/**
 * PSY Platform — simple header-based auth for signal operators.
 *
 * Token format (sent in X-PSY-Token header):
 *   base64( "SUPERADMIN:admin:MASTER99" )          → superadmin
 *   base64( "OPERATOR:<username>:<password>" )     → operator (validated against DB)
 *
 * We expose helpers used by route handlers — not Express middleware —
 * so each route can decide what level of access it needs.
 */

import { db, operators } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

// ── Hardcoded superadmin ────────────────────────────────────────────────────
const SUPERADMIN_TOKENS = new Set([
  Buffer.from("SUPERADMIN:admin:MASTER99").toString("base64"),
  Buffer.from("SUPERADMIN:jorge-2026:JORGE-ADMIN-2026").toString("base64"),
]);

// ── Hash helper (SHA-256 hex) ───────────────────────────────────────────────
export function hashPassword(password: string): string {
  return createHash("sha256").update(password + "PSY_SALT_2025").digest("hex");
}

// ── Role types ──────────────────────────────────────────────────────────────
export type PsyRole = "superadmin" | "operator" | "none";

export interface AuthResult {
  role: PsyRole;
  username: string;
}

// ── Parse and validate the X-PSY-Token header ──────────────────────────────
export async function validateToken(token: string | undefined): Promise<AuthResult> {
  if (!token) return { role: "none", username: "" };

  // Superadmin
  if (SUPERADMIN_TOKENS.has(token)) {
    return { role: "superadmin", username: "admin" };
  }

  // Operator
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const parts = decoded.split(":");
    if (parts[0] !== "OPERATOR" || parts.length < 3) return { role: "none", username: "" };
    const username = parts[1];
    const password = parts.slice(2).join(":"); // allow colons in password
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

// ── Convenience: build token string for a given user/pass (frontend helper) ─
export function buildOperatorToken(username: string, password: string): string {
  return Buffer.from(`OPERATOR:${username}:${password}`).toString("base64");
}
