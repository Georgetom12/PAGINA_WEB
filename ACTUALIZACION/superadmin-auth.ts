/**
 * PSY PLATFORM — Superadmin Auth
 * ─────────────────────────────────────────────────────────────────────────────
 * UNA sola cuenta maestra. Cero hardcoding. Todo desde Railway env vars.
 *
 * Variables REQUERIDAS en Railway:
 *   SUPERADMIN_USER     → nombre de usuario (ej: jamogollon)
 *   SUPERADMIN_PASSWORD → contraseña maestra
 *   SESSION_SECRET      → clave para firmar JWT (mínimo 32 chars)
 *
 * Ruta: POST /api/auth/superadmin-login
 *   Body: { username, password }
 *   Returns: { ok, token, role, plan, username }
 */

import { Router, type Request, type Response } from "express";
import { signJwt } from "../lib/jwt";

const router = Router();

// ── Leer credenciales desde Railway env vars (REQUERIDAS) ───────────────────
const SA_USER = process.env["SUPERADMIN_USER"];
const SA_PASS = process.env["SUPERADMIN_PASSWORD"];

if (!SA_USER || !SA_PASS) {
  console.error("[superadmin-auth] FATAL: SUPERADMIN_USER y SUPERADMIN_PASSWORD deben estar en Railway env vars");
}

// ── POST /api/auth/superadmin-login ─────────────────────────────────────────
router.post("/auth/superadmin-login", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ ok: false, error: "Usuario y contraseña requeridos" });
    return;
  }

  // Validar env vars configuradas
  if (!SA_USER || !SA_PASS) {
    res.status(503).json({ ok: false, error: "Servidor no configurado. Contacta al admin." });
    return;
  }

  const inputUser = username.toLowerCase().trim();
  const expectedUser = SA_USER.toLowerCase().trim();

  // Comparación estricta usuario + contraseña
  if (inputUser !== expectedUser || password !== SA_PASS) {
    res.status(401).json({ ok: false, error: "Credenciales incorrectas" });
    return;
  }

  // Emitir JWT con rol superadmin + plan elite (7 días)
  const token = signJwt(
    { sub: expectedUser, role: "superadmin", plan: "elite" },
    7 * 24 * 60 * 60 // 7 días
  );

  res.json({
    ok:       true,
    token,
    role:     "superadmin",
    plan:     "elite",
    username: expectedUser,
  });
});

// ── POST /api/auth/superadmin-totp (placeholder — sin 2FA por ahora) ────────
router.post("/auth/superadmin-totp", (_req: Request, res: Response) => {
  res.status(400).json({ ok: false, error: "2FA no configurado" });
});

export default router;
