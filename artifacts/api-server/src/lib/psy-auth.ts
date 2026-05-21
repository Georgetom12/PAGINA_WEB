/**
 * PSY Platform — Auth con JWT HS256 + backward compat con tokens base64.
 *
 * Token format preferido (JWT firmado con SESSION_SECRET):
 *   eyJ... → superadmin | operator | member (con expiración en 24h)
 *
 * Backward compat (tokens viejos base64):
 *   base64( "SUPERADMIN:admin:<SA_PWD>" )      → superadmin
 *   base64( "OPERATOR:<username>:<password>" ) → operator
 *
 * Variables de entorno:
 *   SUPERADMIN_PASSWORD   → contraseña del usuario "admin"    (REQUERIDA — sin fallback)
 *   SUPERADMIN_PASSWORD_2 → contraseña del usuario "jorge"    (REQUERIDA — sin fallback)
 *   SESSION_SECRET        → clave para firmar JWT (CAMBIAR en Railway)
 */

import { db, operators } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createHash, createHmac } from "crypto";
import { verifyJwt } from "./jwt";

// ── Superadmin credentials from env (REQUIRED — no hardcoded fallbacks) ─────
const SA_PWD_1 = process.env["SUPERADMIN_PASSWORD"];
const SA_PWD_2 = process.env["SUPERADMIN_PASSWORD_2"];
if (!SA_PWD_1 || !SA_PWD_2) {
  throw new Error("SUPERADMIN_PASSWORD and SUPERADMIN_PASSWORD_2 must be set as environment variables");
}

const SUPERADMIN_TOKENS = new Set([
  Buffer.from(`SUPERADMIN:admin:${SA_PWD_1}`).toString("base64"),
  Buffer.from(`SUPERADMIN:jorge-2026:${SA_PWD_2}`).toString("base64"),
]);

// ── Hash helper (SHA-256 hex + salt) ───────────────────────────────────────
export function hashPassword(password: string): string {
  return createHash("sha256").update(password + "PSY_SALT_2025").digest("hex");
}

// ── Role types ──────────────────────────────────────────────────────────────
export type PsyRole = "superadmin" | "operator" | "member" | "none";

export interface AuthResult {
  role: PsyRole;
  username: string;
  plan?: string;
}

// ── Parse and validate the X-PSY-Token header (JWT primero, base64 de respaldo) ──
export async function validateToken(token: string | undefined): Promise<AuthResult> {
  if (!token) return { role: "none", username: "" };

  // 1. Intentar JWT firmado (nuevo — preferido)
  const jwt = verifyJwt(token);
  if (jwt) {
    return { role: jwt.role as PsyRole, username: jwt.sub, plan: jwt.plan };
  }

  // 2. Backward compat — superadmin base64 legacy
  if (SUPERADMIN_TOKENS.has(token)) {
    return { role: "superadmin", username: "admin" };
  }

  // 3. Backward compat — operator base64 legacy
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const parts = decoded.split(":");
    if (parts[0] !== "OPERATOR" || parts.length < 3) return { role: "none", username: "" };
    const username = parts[1];
    const password = parts.slice(2).join(":");
    const hash = hashPassword(password);

    const [op] = await db
      .select()
      .from(operators)
      .where(eq(operators.username, username.toLowerCase()))
      .limit(1);

    if (!op || !op.active || op.passwordHash !== hash) {
      return { role: "none", username: "" };
    }
    return { role: "operator", username: op.username };
  } catch {
    return { role: "none", username: "" };
  }
}

// ── Convenience: build operator token (base64, backward compat) ────────────
export function buildOperatorToken(username: string, password: string): string {
  return Buffer.from(`OPERATOR:${username}:${password}`).toString("base64");
}

// ── Worker-to-Railway HMAC helper ────────────────────────────────────────────
export function buildWorkerHmac(secret: string, timestamp: string): string {
  return createHmac("sha256", secret).update(timestamp).digest("hex");
}
