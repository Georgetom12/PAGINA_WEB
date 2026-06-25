import { Router, type IRouter, type Request, type Response } from "express";
import { db, channels, channelBots, signals } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

// GET /api/channels — list all (tokens redacted for public safety)
router.get("/channels", async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(channels).orderBy(channels.id);
    // Redact tokens from public endpoint
    const safe = rows.map(c => ({ ...c, botToken: c.botToken ? "***" : "" }));
    res.json({ ok: true, channels: safe });
  } catch (err) {
    req.log.error({ err }, "channels fetch error");
    res.status(500).json({ error: "Error al obtener canales" });
  }
});

// GET /api/channels/admin — full data (for admin panel only)
router.get("/channels/admin", async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(channels).orderBy(channels.id);
    res.json({ ok: true, channels: rows });
  } catch (err) {
    req.log.error({ err }, "channels admin fetch error");
    res.status(500).json({ error: "Error al obtener canales" });
  }
});

// POST /api/channels — create channel
router.post("/channels", async (req: Request, res: Response) => {
  const { slug, name, description, color, botToken, channelId, active } = req.body as {
    slug: string; name: string; description?: string; color?: string;
    botToken: string; channelId: string; active?: boolean;
  };
  if (!slug || !name || !botToken || !channelId) {
    res.status(400).json({ error: "slug, name, botToken y channelId son requeridos" });
    return;
  }
  try {
    const [row] = await db.insert(channels).values({
      slug, name, description: description ?? null,
      color: color ?? "#00e5ff", botToken, channelId,
      active: active ?? true,
    }).returning();
    res.json({ ok: true, channel: { ...row!, botToken: "***" } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("unique")) {
      res.status(409).json({ error: `Ya existe un canal con slug "${slug}"` });
    } else {
      req.log.error({ err }, "channel create error");
      res.status(500).json({ error: "Error al crear canal" });
    }
  }
});

// PATCH /api/channels/:id — update channel
router.patch("/channels/:id", async (req: Request, res: Response) => {
  const id = Number(req.params["id"]);
  const { name, description, color, botToken, channelId, inviteLink, active } = req.body as {
    name?: string; description?: string; color?: string;
    botToken?: string; channelId?: string; inviteLink?: string; active?: boolean;
  };
  try {
    const updates: Record<string, unknown> = {};
    if (name        !== undefined) updates["name"]        = name;
    if (description !== undefined) updates["description"] = description;
    if (color       !== undefined) updates["color"]       = color;
    if (botToken    !== undefined) updates["botToken"]    = botToken;
    if (channelId   !== undefined) updates["channelId"]   = channelId;
    if (inviteLink  !== undefined) updates["inviteLink"]  = inviteLink;
    if (active      !== undefined) updates["active"]      = active;

    await db.update(channels).set(updates).where(eq(channels.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "channel update error");
    res.status(500).json({ error: "Error al actualizar canal" });
  }
});

// DELETE /api/channels/:id — delete channel
router.delete("/channels/:id", async (req: Request, res: Response) => {
  const id = Number(req.params["id"]);
  try {
    await db.delete(channels).where(eq(channels.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "channel delete error");
    res.status(500).json({ error: "Error al eliminar canal" });
  }
});

// GET /api/channels/:id/bots — list bots for a channel
router.get("/channels/:id/bots", async (req: Request, res: Response) => {
  const id = Number(req.params["id"]);
  try {
    const rows = await db.select().from(channelBots).where(eq(channelBots.channelId, id));
    // Redact tokens
    const safe = rows.map(b => ({ ...b, botToken: b.botToken ? "***" : "" }));
    res.json({ ok: true, bots: safe });
  } catch (err) {
    req.log.error({ err }, "channel bots fetch error");
    res.status(500).json({ error: "Error al obtener bots" });
  }
});

// GET /api/channels/:id/bots/admin — full tokens (admin only)
router.get("/channels/:id/bots/admin", async (req: Request, res: Response) => {
  const id = Number(req.params["id"]);
  try {
    const rows = await db.select().from(channelBots).where(eq(channelBots.channelId, id));
    res.json({ ok: true, bots: rows });
  } catch (err) {
    req.log.error({ err }, "channel bots admin fetch error");
    res.status(500).json({ error: "Error al obtener bots" });
  }
});

// POST /api/channels/:id/bots — add a bot to a channel
router.post("/channels/:id/bots", async (req: Request, res: Response) => {
  const channelId = Number(req.params["id"]);
  const { label, botToken } = req.body as { label?: string; botToken?: string };
  if (!label || !botToken) {
    res.status(400).json({ error: "label y botToken son requeridos" });
    return;
  }
  try {
    const [row] = await db.insert(channelBots).values({ channelId, label, botToken, active: true }).returning();
    res.json({ ok: true, bot: { ...row, botToken: "***" } });
  } catch (err) {
    req.log.error({ err }, "channel bot create error");
    res.status(500).json({ error: "Error al agregar bot" });
  }
});

// PATCH /api/channels/bots/:botId — update a bot
router.patch("/channels/bots/:botId", async (req: Request, res: Response) => {
  const botId = Number(req.params["botId"]);
  const { label, botToken, active } = req.body as { label?: string; botToken?: string; active?: boolean };
  try {
    const updates: Record<string, unknown> = {};
    if (label     !== undefined) updates["label"]    = label;
    if (botToken  !== undefined && botToken !== "") updates["botToken"] = botToken;
    if (active    !== undefined) updates["active"]   = active;
    await db.update(channelBots).set(updates).where(eq(channelBots.id, botId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "channel bot update error");
    res.status(500).json({ error: "Error al actualizar bot" });
  }
});

// DELETE /api/channels/bots/:botId — remove a bot
router.delete("/channels/bots/:botId", async (req: Request, res: Response) => {
  const botId = Number(req.params["botId"]);
  try {
    await db.delete(channelBots).where(eq(channelBots.id, botId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "channel bot delete error");
    res.status(500).json({ error: "Error al eliminar bot" });
  }
});

// GET /api/channels/:slug/signals — signals for a specific channel
router.get("/channels/:slug/signals", async (req: Request, res: Response) => {
  const slug = req.params["slug"]!;
  try {
    const rows = await db
      .select()
      .from(signals)
      .where(sql`${signals.channelSlug} = ${slug}`)
      .orderBy(desc(signals.createdAt))
      .limit(50);
    res.json({ ok: true, signals: rows });
  } catch (err) {
    req.log.error({ err }, "channel signals fetch error");
    res.status(500).json({ error: "Error al obtener señales del canal" });
  }
});

export default router;
