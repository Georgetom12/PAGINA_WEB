import { Router, Request, Response } from "express";
import { createHash, randomBytes } from "crypto";

const router = Router();

// ── Credenciales superadmin (deben coincidir con psy-auth.ts) ───────────────
const SUPERADMIN_CREDS: Record<string, string> = {
  "admin":      "MASTER99",
  "jorge-2026": "JORGE-ADMIN-2026",
};

// ── JWT simple (sin librería externa) ───────────────────────────────────────
const JWT_SECRET = process.env["JWT_SECRET"] ?? "psy_jwt_secret_2026";

function base64url(str: string): string {
  return Buffer.from(str).toString("base64url");
}

function signJWT(payload: Record<string, unknown>): string {
  const header  = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body    = base64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
  const sig     = createHash("sha256").update(`${header}.${body}.${JWT_SECRET}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

// ── POST /api/auth/superadmin-login ─────────────────────────────────────────
router.post("/auth/superadmin-login", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ ok: false, error: "Missing credentials" });
    return;
  }

  const key = username.toLowerCase().trim();
  const expected = SUPERADMIN_CREDS[key];

  if (!expected || password !== expected) {
    res.status(401).json({ ok: false, error: "Credenciales incorrectas" });
    return;
  }

  const token = signJWT({
    sub:  key,
    role: "superadmin",
    plan: "elite",
    jti:  randomBytes(8).toString("hex"),
    exp:  Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 días
  });

  res.json({
    ok:    true,
    token,
    role:  "superadmin",
    plan:  "elite",
  });
});

// ── POST /api/auth/superadmin-totp ──────────────────────────────────────────
router.post("/auth/superadmin-totp", async (req: Request, res: Response) => {
  // Placeholder — TOTP no implementado aún, siempre aprueba
  res.json({ ok: true, token: signJWT({ role: "superadmin", plan: "elite" }) });
});

export default router;
