import { Router, type IRouter, type Request, type Response } from "express";
import { db, members, supportMessages, pushTokens } from "@workspace/db";
import { eq, desc, asc } from "drizzle-orm";
import { validateToken } from "../lib/psy-auth";
import { sendEmail, adminReplyHtml } from "../lib/email";

const router: IRouter = Router();

function getMemberFromToken(token: string): { username: string } | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const parts = decoded.split(":");
    if (parts[0] !== "MEMBER" || parts.length < 2) return null;
    return { username: parts[1]! };
  } catch { return null; }
}

// ── POST /api/support/message — usuario envía mensaje ───────────────────────
router.post("/support/message", async (req: Request, res: Response) => {
  const token = req.headers["x-psy-token"] as string | undefined;
  const member = token ? getMemberFromToken(token) : null;
  if (!member) { res.status(401).json({ error: "No autorizado" }); return; }

  const { message } = req.body as { message?: string };
  if (!message?.trim()) { res.status(400).json({ error: "Mensaje requerido" }); return; }

  try {
    const [m] = await db.select().from(members)
      .where(eq(members.username, member.username)).limit(1);
    if (!m) { res.status(404).json({ error: "Usuario no encontrado" }); return; }

    await db.insert(supportMessages).values({
      memberId: m.id,
      memberUsername: m.username,
      sender: "user",
      message: message.trim(),
    });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "support message error");
    res.status(500).json({ error: "Error al enviar mensaje" });
  }
});

// ── GET /api/support/messages — usuario ve su historial ────────────────────
router.get("/support/messages", async (req: Request, res: Response) => {
  const token = req.headers["x-psy-token"] as string | undefined;
  const member = token ? getMemberFromToken(token) : null;
  if (!member) { res.json({ ok: true, messages: [] }); return; }

  try {
    const [m] = await db.select().from(members)
      .where(eq(members.username, member.username)).limit(1);
    if (!m) { res.status(404).json({ error: "Usuario no encontrado" }); return; }

    const msgs = await db.select().from(supportMessages)
      .where(eq(supportMessages.memberId, m.id))
      .orderBy(asc(supportMessages.createdAt));

    // Mark admin messages as read
    await db.update(supportMessages)
      .set({ readAt: new Date() })
      .where(eq(supportMessages.memberId, m.id));

    res.json({ ok: true, messages: msgs });
  } catch (err) {
    req.log.error({ err }, "support fetch error");
    res.status(500).json({ error: "Error al cargar mensajes" });
  }
});

// ── GET /api/admin/support/inbox — admin ve todas las conversaciones ─────────
router.get("/admin/support/inbox", async (req: Request, res: Response) => {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  if (auth.role === "none") { res.status(403).json({ error: "Acceso denegado" }); return; }

  try {
    const msgs = await db.select().from(supportMessages)
      .orderBy(desc(supportMessages.createdAt))
      .limit(500);

    // Group by member
    const byMember: Record<string, typeof msgs> = {};
    for (const m of msgs) {
      if (!byMember[m.memberUsername]) byMember[m.memberUsername] = [];
      byMember[m.memberUsername]!.push(m);
    }

    const conversations = Object.entries(byMember).map(([username, messages]) => {
      const last = messages[0]!;
      const unread = messages.filter(m => m.sender === "user" && !m.readAt).length;
      return { username, lastMessage: last.message, lastAt: last.createdAt, unread, messages };
    });

    res.json({ ok: true, conversations });
  } catch (err) {
    req.log.error({ err }, "support inbox error");
    res.status(500).json({ error: "Error al cargar inbox" });
  }
});

// ── POST /api/admin/support/reply — admin responde ──────────────────────────
router.post("/admin/support/reply", async (req: Request, res: Response) => {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  if (auth.role === "none") { res.status(403).json({ error: "Acceso denegado" }); return; }

  const { username, message } = req.body as { username?: string; message?: string };
  if (!username || !message?.trim()) {
    res.status(400).json({ error: "username y message requeridos" });
    return;
  }

  try {
    const [m] = await db.select().from(members)
      .where(eq(members.username, username)).limit(1);
    if (!m) { res.status(404).json({ error: "Usuario no encontrado" }); return; }

    await db.insert(supportMessages).values({
      memberId: m.id,
      memberUsername: m.username,
      sender: "admin",
      message: message.trim(),
    });

    // Send email notification if user has email
    if (m.email) {
      await sendEmail(
        m.email,
        "Respuesta de soporte — PSYCHOMETRIKS",
        adminReplyHtml(m.username, message.trim())
      );
    }

    // Send Expo push notification if token stored
    const [pt] = await db.select().from(pushTokens)
      .where(eq(pushTokens.memberId, m.id)).limit(1);
    if (pt?.expoToken) {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          to: pt.expoToken,
          title: "PSYCHOMETRIKS Soporte",
          body: message.trim().slice(0, 120),
          data: { screen: "exchange" },
        }),
      }).catch(() => {});
    }

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "support reply error");
    res.status(500).json({ error: "Error al responder" });
  }
});

// ── POST /api/admin/support/upgrade-plan — admin sube plan desde el chat ─────
router.post("/admin/support/upgrade-plan", async (req: Request, res: Response) => {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  if (auth.role !== "superadmin") { res.status(403).json({ error: "Acceso denegado" }); return; }

  const { username, plan, expiresAt } = req.body as {
    username?: string; plan?: string; expiresAt?: string;
  };
  if (!username || !plan) {
    res.status(400).json({ error: "username y plan requeridos" });
    return;
  }
  const validPlans = ["exchange", "basico", "educacion", "pro", "elite"];
  if (!validPlans.includes(plan)) {
    res.status(400).json({ error: "Plan inválido" });
    return;
  }

  try {
    const [m] = await db.select().from(members)
      .where(eq(members.username, username)).limit(1);
    if (!m) { res.status(404).json({ error: "Usuario no encontrado" }); return; }

    const updates: Record<string, unknown> = { plan, updatedAt: new Date() };
    if (expiresAt) updates["expiresAt"] = new Date(expiresAt);

    await db.update(members).set(updates).where(eq(members.id, m.id));

    // Notify user
    await db.insert(supportMessages).values({
      memberId: m.id,
      memberUsername: m.username,
      sender: "admin",
      message: `✅ Tu plan fue actualizado a **${plan.toUpperCase()}**. Ya podés acceder a todas las funciones de tu nuevo plan.`,
    });

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "upgrade-plan error");
    res.status(500).json({ error: "Error al actualizar plan" });
  }
});

// ── POST /api/support/push-token — mobile guarda expo push token ─────────────
router.post("/support/push-token", async (req: Request, res: Response) => {
  const token = req.headers["x-psy-token"] as string | undefined;
  const member = token ? getMemberFromToken(token) : null;
  if (!member) { res.status(401).json({ error: "No autorizado" }); return; }

  const { expoToken } = req.body as { expoToken?: string };
  if (!expoToken) { res.status(400).json({ error: "expoToken requerido" }); return; }

  try {
    const [m] = await db.select().from(members)
      .where(eq(members.username, member.username)).limit(1);
    if (!m) { res.status(404).json({ error: "Usuario no encontrado" }); return; }

    // Upsert: delete old + insert new
    await db.delete(pushTokens).where(eq(pushTokens.memberId, m.id));
    await db.insert(pushTokens).values({
      memberId: m.id,
      memberUsername: m.username,
      expoToken,
    });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "push-token error");
    res.status(500).json({ error: "Error al guardar token" });
  }
});

export default router;
