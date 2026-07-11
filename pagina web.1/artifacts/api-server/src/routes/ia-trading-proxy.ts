/**
 * PSYCHOMETRIKS INTELLIGENT AI TRADING — Proxy interno
 * ─────────────────────────────────────────────────────────────────────────────
 * Hace de puente entre el frontend y el servicio de análisis interno
 * (Python/aiohttp, deploy separado en Railway). El usuario final nunca
 * ve ni conoce ese servicio — todo pasa por acá, gateado por el mismo
 * JWT/plan "elite" que ya usa el resto de la plataforma.
 *
 * Variables de entorno requeridas en Railway (api-server):
 *   IA_TRADING_URL              → URL interna del servicio Python
 *                                  (ej: http://ia-trading.railway.internal:8080)
 *   IA_TRADING_INTERNAL_SECRET  → debe coincidir con el mismo valor
 *                                  configurado en el servicio Python
 */

import { Router, type Request, type Response } from "express";
import { validateToken } from "../lib/psy-auth";

const router = Router();

const IA_TRADING_URL = process.env["IA_TRADING_URL"];
const IA_TRADING_SECRET = process.env["IA_TRADING_INTERNAL_SECRET"];

if (!IA_TRADING_URL || !IA_TRADING_SECRET) {
  console.warn("[ia-trading-proxy] IA_TRADING_URL / IA_TRADING_INTERNAL_SECRET no configuradas — la ruta responderá 503");
}

async function requireElite(req: Request, res: Response): Promise<boolean> {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  const allowed = auth.role === "superadmin" || auth.plan === "elite";
  if (!allowed) {
    res.status(403).json({ ok: false, error: "Requiere plan Elite" });
    return false;
  }
  return true;
}

async function proxyToMotor(
  path: string,
  res: Response,
  init: RequestInit = {}
): Promise<void> {
  if (!IA_TRADING_URL || !IA_TRADING_SECRET) {
    res.status(503).json({ ok: false, error: "Servicio no configurado" });
    return;
  }
  try {
    const r = await fetch(`${IA_TRADING_URL}${path}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        "X-Internal-Secret": IA_TRADING_SECRET,
        "Content-Type": "application/json",
      },
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err: unknown) {
    res.status(502).json({ ok: false, error: (err as Error).message });
  }
}

// POST /api/ia-trading/analizar  { symbol }
router.post("/ia-trading/analizar", async (req: Request, res: Response) => {
  if (!(await requireElite(req, res))) return;
  await proxyToMotor("/api/analizar", res, {
    method: "POST",
    body: JSON.stringify(req.body ?? {}),
  });
});

// GET /api/ia-trading/top-symbols
router.get("/ia-trading/top-symbols", async (req: Request, res: Response) => {
  if (!(await requireElite(req, res))) return;
  await proxyToMotor("/api/top-symbols", res);
});

// GET /api/ia-trading/historial?symbol=BTCUSDT
router.get("/ia-trading/historial", async (req: Request, res: Response) => {
  if (!(await requireElite(req, res))) return;
  const symbol = req.query["symbol"] as string | undefined;
  const qs = symbol ? `?symbol=${encodeURIComponent(symbol)}` : "";
  await proxyToMotor(`/api/historial${qs}`, res);
});

// GET /api/ia-trading/leaderboard
router.get("/ia-trading/leaderboard", async (req: Request, res: Response) => {
  if (!(await requireElite(req, res))) return;
  await proxyToMotor("/api/leaderboard", res);
});

export default router;
