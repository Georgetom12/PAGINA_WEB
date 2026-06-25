import { Router, type IRouter, type Request, type Response } from "express";
import { db, members } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { hashPassword, verifyPassword, validateToken } from "../lib/psy-auth";
import { signJwt } from "../lib/jwt";

const IS_PROD = process.env["NODE_ENV"] === "production";

function setSessionCookie(res: Response, token: string): void {
  res.cookie("psy_session", token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? "strict" : "lax",
    path: "/api",
    maxAge: 24 * 60 * 60 * 1000,
  });
}

const router: IRouter = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

// Parse a date string ("YYYY-MM-DD") as noon UTC to avoid any timezone shifting
// the stored day. Without this, "2026-06-05" → midnight UTC → June 4 in UTC-5.
function parseDateSafe(dateStr: string): Date {
  // If it already contains a time component, use as-is
  if (dateStr.includes("T") || dateStr.includes(" ")) return new Date(dateStr);
  // Date-only → store as noon UTC so no timezone makes it cross to the previous day
  return new Date(dateStr + "T12:00:00Z");
}

function isExpired(expiresAt: Date | string | null | undefined): boolean {
  if (!expiresAt) return false;
  // Give until end-of-day grace: expired only if past 23:59 of the expiry date
  const exp = new Date(expiresAt);
  exp.setHours(23, 59, 59, 999);
  return exp < new Date();
}

// ── POST /api/auth/member-login ──────────────────────────────────────────────
router.post("/auth/member-login", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: "Correo y contraseña requeridos" });
    return;
  }

  try {
    const identifier = username.toLowerCase().trim();

    // Fetch ALL candidates matching either email OR username in one query.
    // This handles: same email shared by multiple accounts, login by username,
    // login by email — without ambiguity.
    const candidates = await db
      .select()
      .from(members)
      .where(or(eq(members.email, identifier), eq(members.username, identifier)));

    // Pick the first active candidate whose password matches (bcrypt or legacy SHA-256)
    let member: typeof candidates[0] | undefined;
    for (const c of candidates.filter(c => c.active)) {
      if (await verifyPassword(password, c.passwordHash)) { member = c; break; }
    }

    // Auto-upgrade legacy SHA-256 → bcrypt silently in background
    if (member && !member.passwordHash.startsWith("$2b$") && !member.passwordHash.startsWith("$2a$")) {
      hashPassword(password).then(newHash =>
        db.update(members).set({ passwordHash: newHash }).where(eq(members.id, member!.id))
      ).catch(() => {});
    }

    if (!member) {
      // Check if we found candidates but password was wrong vs no account at all
      const exists = candidates.some(c => c.active);
      res.status(401).json({
        error: exists
          ? "Contraseña incorrecta"
          : "Usuario no encontrado o cuenta inactiva",
      });
      return;
    }

    if (isExpired(member.expiresAt)) {
      res.status(401).json({ error: "Tu suscripción ha vencido. Contactá a Jorge." });
      return;
    }

    // R6 — email verification obligatoria para todos los planes
    if (!member.emailVerified) {
      res.status(401).json({ error: "Verificá tu correo antes de ingresar. Revisá tu bandeja de entrada." });
      return;
    }

    // R2 — JWT firmado HS256 (reemplaza base64 inseguro)
    const token = signJwt({ sub: member.username, role: "member", plan: member.plan ?? "basico" });

    // R1 — httpOnly cookie para proteger el token de XSS
    setSessionCookie(res, token);

    res.json({
      ok: true, role: "member",
      username: member.username,
      displayName: member.displayName,
      plan: member.plan,
      token,
    });
  } catch (err) {
    req.log.error({ err }, "member login error");
    res.status(500).json({ error: "Error en autenticación" });
  }
});

// ── GET /api/admin/members ───────────────────────────────────────────────────
router.get("/admin/members", async (req: Request, res: Response) => {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  if (auth.role !== "superadmin") { res.status(403).json({ error: "Acceso denegado" }); return; }
  try {
    const rows = await db.select({
      id: members.id, username: members.username, displayName: members.displayName,
      email: members.email, plan: members.plan, expiresAt: members.expiresAt,
      active: members.active, notes: members.notes, createdAt: members.createdAt,
    }).from(members).orderBy(members.createdAt);
    res.json({ ok: true, members: rows });
  } catch (err) {
    req.log.error({ err }, "members fetch error");
    res.status(500).json({ error: "Error al obtener miembros" });
  }
});

// ── POST /api/admin/members ──────────────────────────────────────────────────
router.post("/admin/members", async (req: Request, res: Response) => {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  if (auth.role !== "superadmin") { res.status(403).json({ error: "Acceso denegado" }); return; }

  const { username, password, displayName, email, plan, expiresAt, notes } = req.body as {
    username?: string; password?: string; displayName?: string;
    email?: string; plan?: string; expiresAt?: string; notes?: string;
  };

  if (!username || !password || !displayName) {
    res.status(400).json({ error: "username, password y displayName son requeridos" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    return;
  }
  const validPlans = ["basico", "educacion", "pro", "elite"];
  if (plan && !validPlans.includes(plan)) {
    res.status(400).json({ error: "Plan inválido. Usá: basico, educacion, pro, elite" });
    return;
  }

  try {
    const passwordHash = await hashPassword(password);
    const [member] = await db.insert(members).values({
      username: username.toLowerCase().trim(),
      passwordHash,
      displayName: displayName.trim(),
      email: email?.trim() || null,
      plan: plan ?? "basico",
      expiresAt: expiresAt ? parseDateSafe(expiresAt) : null,
      notes: notes?.trim() || null,
      active: true,
      emailVerified: true, // Admin crea directamente — no requiere verificación de correo
    }).returning();
    res.json({ ok: true, member: { id: member.id, username: member.username, displayName: member.displayName, plan: member.plan } });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") {
      res.status(400).json({ error: "Ese nombre de usuario ya existe" });
      return;
    }
    req.log.error({ err }, "member create error");
    res.status(500).json({ error: "Error al crear miembro" });
  }
});

// ── PATCH /api/admin/members/:id ─────────────────────────────────────────────
router.patch("/admin/members/:id", async (req: Request, res: Response) => {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  if (auth.role !== "superadmin") { res.status(403).json({ error: "Acceso denegado" }); return; }

  const id = Number(req.params["id"]);
  const { active, plan, password, expiresAt, notes, displayName } = req.body as {
    active?: boolean; plan?: string; password?: string;
    expiresAt?: string | null; notes?: string; displayName?: string;
  };

  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (active !== undefined) updates["active"] = active;
    if (plan) updates["plan"] = plan;
    if (displayName) updates["displayName"] = displayName;
    if (notes !== undefined) updates["notes"] = notes;
    if (expiresAt !== undefined) updates["expiresAt"] = expiresAt ? parseDateSafe(expiresAt) : null;
    if (password) {
      if (password.length < 6) { res.status(400).json({ error: "Contraseña mínimo 6 caracteres" }); return; }
      updates["passwordHash"] = await hashPassword(password);
    }
    await db.update(members).set(updates).where(eq(members.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "member update error");
    res.status(500).json({ error: "Error al actualizar miembro" });
  }
});

// ── DELETE /api/admin/members/:id ────────────────────────────────────────────
// Regla: usuarios con wallet activa NO se pueden eliminar — solo degradar a "exchange"
router.delete("/admin/members/:id", async (req: Request, res: Response) => {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  if (auth.role !== "superadmin") { res.status(403).json({ error: "Acceso denegado" }); return; }
  const id = Number(req.params["id"]);
  try {
    const [member] = await db.select().from(members).where(eq(members.id, id)).limit(1);
    if (member?.walletAddress) {
      res.status(400).json({
        error: "Este usuario tiene una wallet activa y no puede eliminarse. Podés degradar su plan a 'exchange' desde la edición.",
      });
      return;
    }
    await db.delete(members).where(eq(members.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "member delete error");
    res.status(500).json({ error: "Error al eliminar miembro" });
  }
});

export default router;
