/**
 * PSY Platform — JWT ligero HS256 (sin dependencias externas)
 * Firma con HMAC-SHA256 usando SESSION_SECRET de Railway.
 * Expira en 24h por defecto.
 */
import { createHmac, timingSafeEqual } from "crypto";

const JWT_SECRET = process.env["SESSION_SECRET"];
if (!JWT_SECRET) throw new Error("SESSION_SECRET must be set as an environment variable");
const EXPIRY_SECS = 24 * 60 * 60; // 24 horas

export interface JwtPayload {
  sub:   string;   // username
  role:  string;   // superadmin | operator | member
  plan?: string;
  iat:   number;
  exp:   number;
}

function b64url(data: string | Buffer): string {
  const buf = typeof data === "string" ? Buffer.from(data) : data;
  return buf.toString("base64url");
}

export function signJwt(
  payload: Omit<JwtPayload, "iat" | "exp">,
  expiresInSeconds = EXPIRY_SECS,
): string {
  const now  = Math.floor(Date.now() / 1000);
  const full: JwtPayload = { ...payload, iat: now, exp: now + expiresInSeconds };
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body   = b64url(JSON.stringify(full));
  const sig    = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts as [string, string, string];

    const expectedSig = createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");

    // Comparación en tiempo constante — previene timing attacks
    const a = Buffer.from(sig.padEnd(Math.max(sig.length, expectedSig.length), "\0"));
    const b = Buffer.from(expectedSig.padEnd(Math.max(sig.length, expectedSig.length), "\0"));
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as JwtPayload;
    if (Math.floor(Date.now() / 1000) > payload.exp) return null; // expirado
    return payload;
  } catch {
    return null;
  }
}
