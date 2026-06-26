/**
 * PSY Platform — Auth Routes
 * Superadmin: una sola cuenta desde SUPERADMIN_USER + SUPERADMIN_PASSWORD (Railway).
 * Members: bcrypt hash en DB.
 * Sin hardcoding. Sin crash. Sin rate limiter interno (manejo en app.ts).
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { db, members, authTokens } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes } from "crypto";
import { hashPassword, verifyPassword } from "../lib/psy-auth";
import { signJwt } from "../lib/jwt";
import { sendEmail, verifyEmailHtml, resetPasswordHtml } from "../lib/email";

const router: IRouter = Router();
const IS_PROD = process.env["NODE_ENV"] === "production";

function genToken(): string {
  return randomBytes(32).toString("hex");
}

function setSessionCookie(res: Response, token: string): void {
  res.cookie("psy_session", token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? "strict" : "lax",
    path: "/api",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
  });
}

// ── POST /api/auth/superadmin-login ──────────────────────────────────────────
router.post("/auth/superadmin-login", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ ok: false, error: "Usuario y contraseña requeridos" });
    return;
  }

  const SA_USER = (process.env["SUPERADMIN_USER"] ?? "").toLowerCase().trim();
  const SA_PWD  = process.env["SUPERADMIN_PASSWORD"] ?? "";

  if (!SA_USER || !SA_PWD) {
    res.status(503).json({ ok: false, error: "Servidor no configurado correctamente" });
    return;
  }

  const inputUser = username.toLowerCase().trim();

  if (inputUser !== SA_USER || password !== SA_PWD) {
    res.status(401).json({ ok: false, error: "Credenciales incorrectas" });
    return;
  }

  const token = signJwt(
    { sub: SA_USER, role: "superadmin", plan: "elite" },
    7 * 24 * 60 * 60 // 7 días
  );

  setSessionCookie(res, token);
  res.json({ ok: true, token, role: "superadmin", plan: "elite", username: SA_USER });
});

// ── POST /api/auth/member-login ───────────────────────────────────────────────
router.post("/auth/member-login", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ ok: false, error: "Usuario y contraseña requeridos" });
    return;
  }

  try {
    const identifier = username.toLowerCase().trim();

    const [byUser] = await db.select().from(members)
      .where(eq(members.username, identifier)).limit(1);
    const [byEmail] = !byUser
      ? await db.select().from(members).where(eq(members.email, identifier)).limit(1)
      : [undefined];
    const m = byUser ?? byEmail;

    if (!m || !m.active) {
      res.status(401).json({ ok: false, error: "Credenciales incorrectas o cuenta inactiva" });
      return;
    }

    const valid = await verifyPassword(password, m.passwordHash ?? "");
    if (!valid) {
      res.status(401).json({ ok: false, error: "Credenciales incorrectas o cuenta inactiva" });
      return;
    }

    if (!m.emailVerified) {
      res.status(401).json({ ok: false, error: "Verificá tu correo antes de ingresar." });
      return;
    }

    const token = signJwt(
      { sub: m.username, role: "member", plan: m.plan ?? "exchange" },
      7 * 24 * 60 * 60
    );

    setSessionCookie(res, token);
    res.json({
      ok: true, token, role: "member",
      username: m.username,
      displayName: m.displayName,
      plan: m.plan,
    });
  } catch (err) {
    req.log?.error({ err }, "member-login error");
    res.status(500).json({ ok: false, error: "Error en autenticación" });
  }
});

// ── POST /api/auth/operator-login ─────────────────────────────────────────────
router.post("/auth/operator-login", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ ok: false, error: "Usuario y contraseña requeridos" });
    return;
  }

  try {
    const { db: database, operators } = await import("@workspace/db");
    const { eq: equal } = await import("drizzle-orm");
    const identifier = username.toLowerCase().trim();

    const [op] = await database.select().from(operators)
      .where(equal(operators.username, identifier)).limit(1);

    if (!op || !op.active) {
      res.status(401).json({ ok: false, error: "Credenciales incorrectas" });
      return;
    }

    const valid = await verifyPassword(password, op.passwordHash ?? "");
    if (!valid) {
      res.status(401).json({ ok: false, error: "Credenciales incorrectas" });
      return;
    }

    const token = signJwt({ sub: op.username, role: "operator" }, 7 * 24 * 60 * 60);
    setSessionCookie(res, token);
    res.json({ ok: true, token, role: "operator", username: op.username });
  } catch (err) {
    req.log?.error({ err }, "operator-login error");
    res.status(500).json({ ok: false, error: "Error en autenticación" });
  }
});

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post("/auth/register", async (req: Request, res: Response) => {
  const { username, email, password } = req.body as {
    username?: string; email?: string; password?: string;
  };

  if (!username || !email || !password) {
    res.status(400).json({ ok: false, error: "Usuario, correo y contraseña son requeridos" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ ok: false, error: "La contraseña debe tener al menos 8 caracteres" });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ ok: false, error: "Correo inválido" });
    return;
  }
  if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
    res.status(400).json({ ok: false, error: "Usuario: 3-30 caracteres, solo letras, números, _ y -" });
    return;
  }

  try {
    const passwordHash = await hashPassword(password);
    const [member] = await db.insert(members).values({
      username: username.toLowerCase().trim(),
      passwordHash,
      displayName: username.trim(),
      email: email.toLowerCase().trim(),
      plan: "exchange",
      active: true,
      emailVerified: false,
    }).returning();

    const token = genToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.insert(authTokens).values({
      memberId: member.id, token, type: "verify_email", expiresAt,
    });

    await sendEmail(
      member.email!,
      "Verificá tu cuenta PSYCHOMETRIKS",
      verifyEmailHtml(member.username, token)
    );

    res.json({ ok: true, message: "Cuenta creada. Revisá tu correo para verificarla." });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err &&
        (err as { code: string }).code === "23505") {
      res.status(400).json({ ok: false, error: "Ese usuario o correo ya está registrado" });
      return;
    }
    req.log?.error({ err }, "register error");
    res.status(500).json({ ok: false, error: "Error al crear la cuenta" });
  }
});

// ── GET /api/auth/verify-email/:token ────────────────────────────────────────
router.get("/auth/verify-email/:token", async (req: Request, res: Response) => {
  const { token } = req.params as { token: string };
  try {
    const [row] = await db.select().from(authTokens).where(and(
      eq(authTokens.token, token),
      eq(authTokens.type, "verify_email"),
      gt(authTokens.expiresAt, new Date())
    )).limit(1);

    if (!row || row.usedAt) {
      res.status(400).json({ ok: false, error: "Link inválido o expirado" });
      return;
    }

    await db.update(members).set({ emailVerified: true, active: true })
      .where(eq(members.id, row.memberId));
    await db.update(authTokens).set({ usedAt: new Date() })
      .where(eq(authTokens.id, row.id));

    res.json({ ok: true });
  } catch (err) {
    req.log?.error({ err }, "verify-email error");
    res.status(500).json({ ok: false, error: "Error al verificar" });
  }
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post("/auth/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ ok: false, error: "Correo requerido" }); return; }

  try {
    const [member] = await db.select().from(members)
      .where(eq(members.email, email.toLowerCase().trim())).limit(1);

    if (member) {
      const token = genToken();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await db.insert(authTokens).values({
        memberId: member.id, token, type: "reset_password", expiresAt,
      });
      await sendEmail(
        member.email!,
        "Reseteo de contraseña PSYCHOMETRIKS",
        resetPasswordHtml(member.username, token)
      );
    }
    res.json({ ok: true, message: "Si ese correo existe, te enviamos instrucciones." });
  } catch (err) {
    req.log?.error({ err }, "forgot-password error");
    res.status(500).json({ ok: false, error: "Error interno" });
  }
});

// ── POST /api/auth/reset-password ────────────────────────────────────────────
router.post("/auth/reset-password", async (req: Request, res: Response) => {
  const { token, password } = req.body as { token?: string; password?: string };

  if (!token || !password) {
    res.status(400).json({ ok: false, error: "Token y contraseña requeridos" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ ok: false, error: "La contraseña debe tener al menos 8 caracteres" });
    return;
  }

  try {
    const [row] = await db.select().from(authTokens).where(and(
      eq(authTokens.token, token),
      eq(authTokens.type, "reset_password"),
      gt(authTokens.expiresAt, new Date())
    )).limit(1);

    if (!row || row.usedAt) {
      res.status(400).json({ ok: false, error: "Link inválido o expirado. Solicitá uno nuevo." });
      return;
    }

    const passwordHash = await hashPassword(password);
    await db.update(members).set({ passwordHash, updatedAt: new Date() })
      .where(eq(members.id, row.memberId));
    await db.update(authTokens).set({ usedAt: new Date() })
      .where(eq(authTokens.id, row.id));

    res.json({ ok: true });
  } catch (err) {
    req.log?.error({ err }, "reset-password error");
    res.status(500).json({ ok: false, error: "Error al resetear la contraseña" });
  }
});

export default router;
