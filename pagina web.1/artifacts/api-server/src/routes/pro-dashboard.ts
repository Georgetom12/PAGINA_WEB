// pagina web.1/artifacts/api-server/src/routes/pro-dashboard.ts
//
// PSY PRO DASHBOARD — las 4 piezas pedidas en una sola página:
//   1) Watchlist personal (guardar monedas favoritas, con precio/RSI en vivo)
//   2) Alertas personalizadas (precio o RSI cruza un umbral)
//   3) Portafolio real (conectar API key de Binance, solo lectura, ver balance real)
//   4) Track Record (histórico de señales ganadas/perdidas)
//
// Requiere plan Pro+ (rank ≥ 3). Usa el mismo login/token (X-PSY-Token) que
// el resto de la plataforma — cada usuario solo ve SU watchlist/alertas/
// portafolio, nunca los de otro.
//
// HONESTO:
//  - El Track Record arranca VACÍO — no hay forma de reconstruir un
//    historial de señales que nunca se guardó. Se llena hacia adelante
//    a medida que los motores de señales (IA Trading, etc.) llamen a
//    registrarSeñal()/resolverSeñal() exportadas acá — todavía no están
//    conectadas automáticamente a esos motores, es el siguiente paso.
//  - La conexión de exchange es DE SOLO LECTURA — nunca se pide ni se
//    guarda un API key con permiso de retiro/trading. El key y el secret
//    se guardan encriptados (AES-256-GCM) con PSY_ENCRYPTION_KEY (env var
//    nueva, hay que agregarla en Railway — 32 bytes en hex, se puede
//    generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
//  - Las alertas por ahora son IN-APP (se marcan como disparadas y se ven
//    en el dashboard) — mandarlas por Telegram/email a cada usuario
//    necesitaría un flujo de "vincular tu Telegram" que todavía no existe.

import { Router, type Request, type Response } from "express";
import { db, psyWatchlist, psyAlerts, psyExchangeKeys, psyTrackRecord } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { validateToken } from "../lib/psy-auth";
import { rsi } from "./psy-algo";
import crypto from "crypto";

const router = Router();
const ENC_KEY = process.env.PSY_ENCRYPTION_KEY;

// ---------- Encriptación (AES-256-GCM) para las API keys de exchange ----------
function encrypt(text: string): string {
  if (!ENC_KEY) throw new Error("Falta la variable PSY_ENCRYPTION_KEY en Railway");
  const key = Buffer.from(ENC_KEY, "hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}
function decrypt(payload: string): string {
  if (!ENC_KEY) throw new Error("Falta la variable PSY_ENCRYPTION_KEY en Railway");
  const key = Buffer.from(ENC_KEY, "hex");
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const enc = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

// ---------- Auth: exige member/operator/superadmin + plan Pro o superior ----------
const PLAN_RANK: Record<string, number> = {
  exchange: 0.5,
  basico: 1,
  aprendiz: 1,
  educacion: 2,
  educación: 2,
  pro: 3,
  trader: 3,
  elite: 4,
  institucional: 4,
};

async function requireProMember(req: Request, res: Response): Promise<string | null> {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  if (auth.role === "none") {
    res.status(401).json({ error: "No autenticado" });
    return null;
  }
  if (auth.role === "superadmin" || auth.role === "operator") return auth.username;
  const rank = PLAN_RANK[(auth.plan ?? "").toLowerCase()] ?? 0;
  if (rank < 3) {
    res.status(403).json({ error: "Esta sección requiere plan Pro o superior" });
    return null;
  }
  return auth.username;
}

// ---------- Binance: klines públicos + cuenta privada (firmada) ----------
async function fetchKlines(symbol: string, interval = "1h", limit = 200) {
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const r = await fetch(url);
    if (!r.ok) return [];
    const rows: any[] = await r.json();
    return rows.map((k) => ({ time: k[0], open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]), volume: parseFloat(k[5]) }));
  } catch {
    return [];
  }
}

async function fetchPriceMap(): Promise<Record<string, number>> {
  try {
    const r = await fetch("https://api.binance.com/api/v3/ticker/price");
    if (!r.ok) return {};
    const rows: any[] = await r.json();
    const map: Record<string, number> = {};
    for (const row of rows) map[row.symbol] = parseFloat(row.price);
    return map;
  } catch {
    return {};
  }
}

function signBinance(secret: string, query: string) {
  return crypto.createHmac("sha256", secret).update(query).digest("hex");
}

async function fetchBinanceAccount(apiKey: string, apiSecret: string) {
  const timestamp = Date.now();
  const query = `timestamp=${timestamp}&recvWindow=10000`;
  const signature = signBinance(apiSecret, query);
  const url = `https://api.binance.com/api/v3/account?${query}&signature=${signature}`;
  const r = await fetch(url, { headers: { "X-MBX-APIKEY": apiKey } });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Binance ${r.status}: ${body.slice(0, 200)}`);
  }
  return r.json();
}

// ============================================================
// 1) WATCHLIST
// ============================================================
router.get("/pro-dashboard/watchlist", async (req: Request, res: Response) => {
  const username = await requireProMember(req, res);
  if (!username) return;
  const rows = await db.select().from(psyWatchlist).where(eq(psyWatchlist.username, username)).orderBy(psyWatchlist.createdAt);
  const priceMap = await fetchPriceMap();
  const out = await Promise.all(
    rows.map(async (row) => {
      const klines = await fetchKlines(row.symbol, "1h", 100);
      const closes = klines.map((k) => k.close);
      const rsiVal = closes.length > 20 ? rsi(closes, 14) : null;
      const priceNow = priceMap[row.symbol] ?? closes[closes.length - 1] ?? null;
      const price24hAgo = closes.length > 24 ? closes[closes.length - 25] : closes[0];
      const cambio24hPct = priceNow && price24hAgo ? ((priceNow - price24hAgo) / price24hAgo) * 100 : null;
      return { id: row.id, symbol: row.symbol, precio: priceNow, cambio24hPct: cambio24hPct !== null ? Math.round(cambio24hPct * 100) / 100 : null, rsi: rsiVal !== null ? Math.round(rsiVal * 10) / 10 : null };
    })
  );
  res.json({ watchlist: out });
});

router.post("/pro-dashboard/watchlist", async (req: Request, res: Response) => {
  const username = await requireProMember(req, res);
  if (!username) return;
  const { symbol } = req.body as { symbol?: string };
  if (!symbol) { res.status(400).json({ error: "Falta el símbolo" }); return; }
  try {
    await db.insert(psyWatchlist).values({ username, symbol: symbol.toUpperCase() });
    res.json({ ok: true });
  } catch (err: any) {
    if (err?.code === "23505") { res.status(409).json({ error: "Ya está en tu watchlist" }); return; }
    res.status(500).json({ error: "Error guardando" });
  }
});

router.delete("/pro-dashboard/watchlist/:symbol", async (req: Request, res: Response) => {
  const username = await requireProMember(req, res);
  if (!username) return;
  await db.delete(psyWatchlist).where(and(eq(psyWatchlist.username, username), eq(psyWatchlist.symbol, req.params.symbol!.toUpperCase())));
  res.json({ ok: true });
});

// ---------- Velas para el plano cartesiano (candlestick) ----------
router.get("/pro-dashboard/candles/:symbol", async (req: Request, res: Response) => {
  const username = await requireProMember(req, res);
  if (!username) return;
  const interval = (req.query.interval as string) || "1h";
  const candles = await fetchKlines(req.params.symbol!.toUpperCase(), interval, 200);
  res.json({ symbol: req.params.symbol, interval, candles });
});

// ============================================================
// 2) ALERTAS PERSONALIZADAS
// ============================================================
router.get("/pro-dashboard/alerts", async (req: Request, res: Response) => {
  const username = await requireProMember(req, res);
  if (!username) return;
  const rows = await db.select().from(psyAlerts).where(eq(psyAlerts.username, username)).orderBy(desc(psyAlerts.createdAt));
  res.json({ alerts: rows });
});

router.post("/pro-dashboard/alerts", async (req: Request, res: Response) => {
  const username = await requireProMember(req, res);
  if (!username) return;
  const { symbol, metric, condition, threshold } = req.body as { symbol?: string; metric?: string; condition?: string; threshold?: number };
  if (!symbol || !metric || !condition || threshold === undefined) {
    res.status(400).json({ error: "Faltan campos (symbol, metric, condition, threshold)" });
    return;
  }
  if (!["price", "rsi"].includes(metric) || !["above", "below"].includes(condition)) {
    res.status(400).json({ error: "metric debe ser 'price'/'rsi', condition debe ser 'above'/'below'" });
    return;
  }
  await db.insert(psyAlerts).values({ username, symbol: symbol.toUpperCase(), metric, condition, threshold: String(threshold) });
  res.json({ ok: true });
});

router.delete("/pro-dashboard/alerts/:id", async (req: Request, res: Response) => {
  const username = await requireProMember(req, res);
  if (!username) return;
  await db.delete(psyAlerts).where(and(eq(psyAlerts.username, username), eq(psyAlerts.id, parseInt(req.params.id!, 10))));
  res.json({ ok: true });
});

// ---------- Chequeador de alertas en segundo plano ----------
async function checkAlerts() {
  try {
    const activas = await db.select().from(psyAlerts).where(eq(psyAlerts.active, true));
    if (!activas.length) return;
    const bySymbol = new Map<string, typeof activas>();
    for (const a of activas) {
      if (!bySymbol.has(a.symbol)) bySymbol.set(a.symbol, []);
      bySymbol.get(a.symbol)!.push(a);
    }
    for (const [symbol, alertList] of bySymbol) {
      const klines = await fetchKlines(symbol, "15m", 100);
      if (!klines.length) continue;
      const closes = klines.map((k) => k.close);
      const priceNow = closes[closes.length - 1]!;
      const rsiNow = closes.length > 20 ? rsi(closes, 14) : null;
      for (const alert of alertList) {
        const valor = alert.metric === "price" ? priceNow : rsiNow;
        if (valor === null) continue;
        const umbral = parseFloat(alert.threshold as any);
        const disparada = alert.condition === "above" ? valor >= umbral : valor <= umbral;
        if (disparada) {
          await db.update(psyAlerts).set({ active: false, triggeredAt: new Date() }).where(eq(psyAlerts.id, alert.id));
          console.log(`[pro-dashboard] 🔔 Alerta disparada: ${alert.username} — ${symbol} ${alert.metric} ${alert.condition} ${umbral} (valor real: ${valor})`);
        }
      }
    }
  } catch (err) {
    console.error("[pro-dashboard] checkAlerts falló", err);
  }
}
setInterval(checkAlerts, 2 * 60_000);

// ============================================================
// 3) PORTAFOLIO REAL (conectar exchange, solo lectura)
// ============================================================
router.post("/pro-dashboard/exchange/connect", async (req: Request, res: Response) => {
  const username = await requireProMember(req, res);
  if (!username) return;
  const { apiKey, apiSecret, exchange } = req.body as { apiKey?: string; apiSecret?: string; exchange?: string };
  if (!apiKey || !apiSecret) { res.status(400).json({ error: "Faltan apiKey/apiSecret" }); return; }
  try {
    // Probar la key antes de guardarla — si no es válida o no es de solo lectura, avisamos ahora
    await fetchBinanceAccount(apiKey, apiSecret);
  } catch (err: any) {
    res.status(400).json({ error: `No se pudo validar la key contra Binance: ${err?.message ?? err}` });
    return;
  }
  const apiKeyEnc = encrypt(apiKey);
  const apiSecretEnc = encrypt(apiSecret);
  await db
    .insert(psyExchangeKeys)
    .values({ username, exchange: exchange ?? "binance", apiKeyEnc, apiSecretEnc })
    .onConflictDoUpdate({ target: psyExchangeKeys.username, set: { apiKeyEnc, apiSecretEnc, exchange: exchange ?? "binance" } });
  res.json({ ok: true });
});

router.delete("/pro-dashboard/exchange/disconnect", async (req: Request, res: Response) => {
  const username = await requireProMember(req, res);
  if (!username) return;
  await db.delete(psyExchangeKeys).where(eq(psyExchangeKeys.username, username));
  res.json({ ok: true });
});

router.get("/pro-dashboard/exchange/balances", async (req: Request, res: Response) => {
  const username = await requireProMember(req, res);
  if (!username) return;
  const [row] = await db.select().from(psyExchangeKeys).where(eq(psyExchangeKeys.username, username)).limit(1);
  if (!row) {
    res.json({ conectado: false });
    return;
  }
  try {
    const apiKey = decrypt(row.apiKeyEnc);
    const apiSecret = decrypt(row.apiSecretEnc);
    const account = await fetchBinanceAccount(apiKey, apiSecret);
    const priceMap = await fetchPriceMap();
    const balances = (account.balances ?? [])
      .map((b: any) => ({ asset: b.asset, free: parseFloat(b.free), locked: parseFloat(b.locked) }))
      .filter((b: any) => b.free + b.locked > 0.0001)
      .map((b: any) => {
        const total = b.free + b.locked;
        let usdValue = 0;
        if (["USDT", "USDC", "BUSD", "FDUSD"].includes(b.asset)) usdValue = total;
        else {
          const px = priceMap[`${b.asset}USDT`];
          if (px) usdValue = total * px;
        }
        return { ...b, total, usdValue: Math.round(usdValue * 100) / 100 };
      })
      .sort((a: any, b: any) => b.usdValue - a.usdValue);
    const totalUsd = balances.reduce((sum: number, b: any) => sum + b.usdValue, 0);
    res.json({ conectado: true, exchange: row.exchange, balances, totalUsd: Math.round(totalUsd * 100) / 100 });
  } catch (err: any) {
    res.status(502).json({ conectado: true, error: `No se pudo leer el balance real: ${err?.message ?? err}` });
  }
});

// ============================================================
// 4) TRACK RECORD
// ============================================================
// Exportadas para que, más adelante, los motores de señales (IA Trading,
// altcoin-signals, etc.) las llamen cuando abren/cierran una señal. Todavía
// no están conectadas automáticamente — el historial arranca vacío hasta
// que se haga esa integración.
export async function registrarSeñal(symbol: string, motor: string, direccion: string, entrada: number) {
  const [row] = await db.insert(psyTrackRecord).values({ symbol, motor, direccion, entrada: String(entrada) }).returning();
  return row;
}
export async function resolverSeñal(id: number, resultadoPct: number) {
  const estado = resultadoPct >= 0 ? "GANADA" : "PERDIDA";
  await db.update(psyTrackRecord).set({ estado, resultadoPct: String(resultadoPct), closedAt: new Date() }).where(eq(psyTrackRecord.id, id));
}

router.get("/pro-dashboard/track-record", async (req: Request, res: Response) => {
  const username = await requireProMember(req, res);
  if (!username) return;
  const rows = await db.select().from(psyTrackRecord).orderBy(desc(psyTrackRecord.createdAt)).limit(200);
  const cerradas = rows.filter((r) => r.estado !== "PENDIENTE");
  const ganadas = cerradas.filter((r) => r.estado === "GANADA").length;
  const winRatePct = cerradas.length > 0 ? Math.round((ganadas / cerradas.length) * 1000) / 10 : null;
  const pnlPromedioPct =
    cerradas.length > 0 ? Math.round((cerradas.reduce((s, r) => s + parseFloat((r.resultadoPct as any) ?? "0"), 0) / cerradas.length) * 100) / 100 : null;
  res.json({ señales: rows, resumen: { totalCerradas: cerradas.length, ganadas, winRatePct, pnlPromedioPct } });
});

export default router;
