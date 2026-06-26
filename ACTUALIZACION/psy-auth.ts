/**
 * PSY Platform — Auth con JWT HS256
 * Una sola cuenta superadmin desde Railway env vars.
 * Sin hardcoding. Sin crash al arrancar si falta una variable opcional.
 */

import { db, operators } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createHash, createHmac } from "crypto";
import bcrypt from "bcrypt";
import { verifyJwt } from "./jwt";

const BCRYPT_ROUNDS = 12;

// ── Hash password (bcrypt) ──────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// ── Verificar password (bcrypt o legacy SHA-256) ────────────────────────────
function legacyHash(password: string): string {
  return createHash("sha256").update(password + "PSY_SALT_2025").digest("hex");
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith("$2b$") || storedHash.startsWith("$2a$")) {
    return bcrypt.compare(password, storedHash);
  }
  return legacyHash(password) === storedHash;
}

// ── Role types ──────────────────────────────────────────────────────────────
export type PsyRole = "superadmin" | "operator" | "member" | "none";

export interface AuthResult {
  role: PsyRole;
  username: string;
  plan?: string;
}

// ── Validate token (JWT primero, legacy base64 de respaldo) ────────────────
export async function validateToken(token: string | undefined): Promise<AuthResult> {
  if (!token) return { role: "none", username: "" };

  // 1. JWT firmado (preferido)
  const jwt = verifyJwt(token);
  if (jwt) {
    return { role: jwt.role as PsyRole, username: jwt.sub, plan: jwt.plan };
  }

  // 2. Backward compat — superadmin base64 legacy
  const SA_PWD = process.env["SUPERADMIN_PASSWORD"] ?? "";
  const SA_USER = (process.env["SUPERADMIN_USER"] ?? "admin").toLowerCase().trim();
  if (SA_PWD) {
    const legacyToken = Buffer.from(`SUPERADMIN:${SA_USER}:${SA_PWD}`).toString("base64");
    if (token === legacyToken) {
      return { role: "superadmin", username: SA_USER };
    }
  }

  // 3. Backward compat — operator base64 legacy
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

// ── Worker HMAC helper ──────────────────────────────────────────────────────
export function buildWorkerHmac(secret: string, timestamp: string): string {
  return createHmac("sha256", secret).update(timestamp).digest("hex");
}
