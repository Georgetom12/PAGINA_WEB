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
 *
 * Hashing:
 *   Nuevos hashes → bcrypt (cost 12)
 *   Hashes legacy → SHA-256 + PSY_SALT_2025 (backward compat, auto-upgrade en login)
 */

import { db, operators } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createHash, createHmac } from "crypto";
import bcrypt from "bcrypt";
import { verifyJwt } from "./jwt";

const BCRYPT_ROUNDS = 12;

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

// ── Legacy SHA-256 hash (solo para backward compat — no usar para hashes nuevos) ──
function legacyHash(password: string): string {
  return createHash("sha256").update(password + "PSY_SALT_2025").digest("hex");
}

// ── Hash nuevo con bcrypt (async) ───────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// ── Verificar contraseña contra hash almacenado (bcrypt o legacy SHA-256) ──
// Detecta automáticamente el tipo de hash por su prefijo.
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith("$2b$") || storedHash.startsWith("$2a$")) {
    return bcrypt.compare(password, storedHash);
  }
  // Legacy: SHA-256 hex (64 chars)
  return legacyHash(password) === storedHash;
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

  // 3. Backward compat — operator base64 legacy (usa SHA-256 directo — tokens viejos)
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const parts = decoded.split(":");
    if (parts[0] !== "OPERATOR" || parts.length < 3) return { role: "none", username: "" };
    const username = parts[1];
    const password = parts.slice(2).join(":");
    const hash = legacyHash(password);

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

