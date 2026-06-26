import { Router, type IRouter, type Request, type Response } from "express";
import { db, members, authTokens } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes } from "crypto";
import { hashPassword } from "../lib/psy-auth";
import { signJwt } from "../lib/jwt";
import { verifyTOTP } from "../lib/totp";
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
    maxAge: 24 * 60 * 60 * 1000,
  });
}

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post("/auth/register", async (req: Request, res: Response) => {
  const { username, email, password } = req.body as {
    username?: string; email?: string; password?: string;
  };

  if (!username || !email || !password) {
    res.status(400).json({ error: "Usuario, correo y contraseña son requeridos" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Correo inválido" });
    return;
  }
  if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
    res.status(400).json({ error: "Usuario: 3-30 caracteres, solo letras, números, _ y -" });
    return;
  }

  try {
    const passwordHash = hashPassword(password);
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
      memberId: member.id,
      token,
      type: "verify_email",
      expiresAt,
    });

    await sendEmail(
      member.email!,
      "Verificá tu cuenta PSYCHOMETRIKS",
      verifyEmailHtml(member.username, token)
    );

    res.json({ ok: true, message: "Cuenta creada. Revisá tu correo para verificar tu cuenta." });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") {
      res.status(400).json({ error: "Ese usuario o correo ya está registrado" });
      return;
    }
    req.log.error({ err }, "register error");
    res.status(500).json({ error: "Error al crear la cuenta" });
  }
});

// ── GET /api/auth/verify-email/:token ────────────────────────────────────────
router.get("/auth/verify-email/:token", async (req: Request, res: Response) => {
  const { token } = req.params as { token: string };
  try {
    const [row] = await db.select().from(authTokens)
      .where(and(
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
    req.log.error({ err }, "verify-email error");
    res.status(500).json({ error: "Error al verificar" });
  }
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post("/auth/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: "Correo requerido" }); return; }

  try {
    const [member] = await db.select().from(members)
      .where(eq(members.email, email.toLowerCase().trim()))
      .limit(1);

    if (member) {
      const token = genToken();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await db.insert(authTokens).values({
        memberId: member.id,
        token,
        type: "reset_password",
        expiresAt,
      });
      await sendEmail(
        member.email!,
        "Reseteo de contraseña PSYCHOMETRIKS",
        resetPasswordHtml(member.username, token)
      );
    }
    // Always return ok to avoid email enumeration
    res.json({ ok: true, message: "Si ese correo existe, te enviamos instrucciones." });
  } catch (err) {
    req.log.error({ err }, "forgot-password error");
    res.status(500).json({ error: "Error interno" });
  }
});

// ── POST /api/auth/reset-password ────────────────────────────────────────────
router.post("/auth/reset-password", async (req: Request, res: Response) => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password) {
    res.status(400).json({ error: "Token y contraseña requeridos" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
    return;
  }

  try {
    const [row] = await db.select().from(authTokens)
      .where(and(
        eq(authTokens.token, token),
        eq(authTokens.type, "reset_password"),
        gt(authTokens.expiresAt, new Date())
      )).limit(1);

    if (!row || row.usedAt) {
      res.status(400).json({ ok: false, error: "Link inválido o expirado. Solicitá uno nuevo." });
      return;
    }

    const passwordHash = hashPassword(password);
    await db.update(members).set({ passwordHash, updatedAt: new Date() })
      .where(eq(members.id, row.memberId));
    await db.update(authTokens).set({ usedAt: new Date() })
      .where(eq(authTokens.id, row.id));

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "reset-password error");
    res.status(500).json({ error: "Error al resetear la contraseña" });
  }
});

// ── POST /api/auth/superadmin-login ──────────────────────────────────────────
// R2+R3: JWT firmado + TOTP 2FA opcional (activar con SUPERADMIN_TOTP_SECRET en Railway)
router.post("/auth/superadmin-login", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: "Usuario y contraseña requeridos" });
    return;
  }
  const u = username.toLowerCase().trim();

  // Leer credenciales desde Railway env vars — cero hardcoding
  const SA_USER = (process.env["SUPERADMIN_USER"] ?? "").toLowerCase().trim();
  const SA_PWD  = process.env["SUPERADMIN_PASSWORD"] ?? "";

  if (!SA_USER || !SA_PWD) {
    res.status(503).json({ ok: false, error: "Servidor no configurado" });
    return;
  }

  const match = u === SA_USER && password === SA_PWD;

  if (!match) {
    res.status(401).json({ ok: false, error: "Credenciales incorrectas" });
    return;
  }

  // R3 — Si TOTP está configurado, exigir segundo factor antes de emitir token
  const TOTP_SECRET = process.env["SUPERADMIN_TOTP_SECRET"];
  if (TOTP_SECRET) {
    res.json({ ok: false, needsTotp: true });
    return;
  }

  // Sin TOTP configurado — emitir JWT directamente (backward compat)
  const token = signJwt({ sub: u, role: "superadmin", plan: "elite" });
  setSessionCookie(res, token);
  res.json({ ok: true, role: "superadmin", username: u, plan: "elite", token });
});

// ── POST /api/auth/superadmin-totp-verify ─────────────────────────────────────
// R3 — Segundo factor: verifica TOTP y emite JWT completo
router.post("/auth/superadmin-totp-verify", async (req: Request, res: Response) => {
  const { username, password, totpCode } = req.body as {
    username?: string; password?: string; totpCode?: string;
  };
  if (!username || !password || !totpCode) {
    res.status(400).json({ error: "Usuario, contraseña y código 2FA requeridos" });
    return;
  }

  const TOTP_SECRET = process.env["SUPERADMIN_TOTP_SECRET"];
  if (!TOTP_SECRET) {
    res.status(400).json({ error: "2FA no configurado en el servidor" });
    return;
  }

  const u = username.toLowerCase().trim();
  const SA_USER = (process.env["SUPERADMIN_USER"] ?? "").toLowerCase().trim();
  const SA_PWD  = process.env["SUPERADMIN_PASSWORD"] ?? "";
  const match = u === SA_USER && password === SA_PWD;

  if (!match) {
    res.status(401).json({ ok: false, error: "Credenciales incorrectas" });
    return;
  }

  if (!verifyTOTP(totpCode.trim(), TOTP_SECRET)) {
    res.status(401).json({ ok: false, error: "Código 2FA incorrecto o expirado" });
    return;
  }

  const token = signJwt({ sub: u, role: "superadmin", plan: "elite" });
  setSessionCookie(res, token);
  res.json({ ok: true, role: "superadmin", username: u, plan: "elite", token });
});

// ── POST /api/auth/exchange-login ─────────────────────────────────────────────
// Login para plan exchange — requiere email verificado + JWT + cookie
router.post("/auth/exchange-login", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: "Usuario y contraseña requeridos" });
    return;
  }
  try {
    const hash = hashPassword(password);
    const identifier = username.toLowerCase().trim();
    const [member] = await db.select().from(members)
      .where(eq(members.username, identifier))
      .limit(1);

    const byEmail = !member
      ? (await db.select().from(members).where(eq(members.email, identifier)).limit(1))[0]
      : null;
    const m = member ?? byEmail;

    if (!m || m.passwordHash !== hash || !m.active) {
      res.status(401).json({ error: "Credenciales incorrectas o cuenta inactiva" });
      return;
    }
    // R6 — email verification obligatoria para todos los planes
    if (!m.emailVerified) {
      res.status(401).json({ error: "Verificá tu correo antes de ingresar. Revisá tu bandeja de entrada." });
      return;
    }

    const token = signJwt({ sub: m.username, role: "member", plan: m.plan ?? "exchange" });
    setSessionCookie(res, token);
    res.json({
      ok: true,
      role: "member",
      username: m.username,
      displayName: m.displayName,
      plan: m.plan,
      token,
    });
  } catch (err) {
    req.log.error({ err }, "exchange-login error");
    res.status(500).json({ error: "Error en autenticación" });
  }
});

export default router;
