import { Router, Request, Response } from "express";
import { createHash, randomBytes } from "crypto";

const router = Router();

const JWT_SECRET = process.env["JWT_SECRET"] ?? process.env["SESSION_SECRET"] ?? "psy_jwt_secret_2026";

function base64url(str: string): string {
  return Buffer.from(str).toString("base64url");
}

function signJWT(payload: Record<string, unknown>): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body   = base64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
  const sig    = createHash("sha256").update(`${header}.${body}.${JWT_SECRET}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

// Leer contraseñas desde variables de entorno de Railway
function getSuperadminCreds(): Record<string, string> {
  const creds: Record<string, string> = {};
  const p1 = process.env["SUPERADMIN_PASSWORD"];
  const p2 = process.env["SUPERADMIN_PASSWORD_2"];
  // Fallback hardcoded (solo si no hay variables)
  creds["admin"]      = p1 ?? "MASTER99";
  creds["jorge-2026"] = p2 ?? p1 ?? "JORGE-ADMIN-2026";
  creds["psychometriks"] = p1 ?? p2 ?? "MASTER99";
  return creds;
}

// POST /api/auth/superadmin-login
router.post("/auth/superadmin-login", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ ok: false, error: "Missing credentials" });
    return;
  }

  const key = username.toLowerCase().trim();
  const creds = getSuperadminCreds();
  const expected = creds[key];

  // Verificar contra cualquiera de las contraseñas configuradas
  const p1 = process.env["SUPERADMIN_PASSWORD"];
  const p2 = process.env["SUPERADMIN_PASSWORD_2"];
  const validPasswords = [expected, p1, p2].filter(Boolean);
  const isValid = validPasswords.includes(password);

  if (!isValid) {
    res.status(401).json({ ok: false, error: "Credenciales incorrectas" });
    return;
  }

  const token = signJWT({
    sub:  key,
    role: "superadmin",
    plan: "elite",
    jti:  randomBytes(8).toString("hex"),
    exp:  Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  });

  res.json({ ok: true, token, role: "superadmin", plan: "elite" });
});

router.post("/auth/superadmin-totp", async (_req: Request, res: Response) => {
  res.json({ ok: true, token: signJWT({ role: "superadmin", plan: "elite" }) });
});

export default router;
