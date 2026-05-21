import { Router, type IRouter, type Request, type Response } from "express";
import { db, signals, channels, channelBots } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { validateToken } from "../lib/psy-auth";

// ── Telegram helpers (inline to avoid circular imports) ──────────────────────
function buildSignalText(body: {
  asset: string; direction: string; entry: string; tp1: string;
  tp2?: string | null; sl: string; leverage?: string | null;
  rr?: string | null; note?: string | null; source?: string | null;
}, channelName?: string): string {
  const dirEmoji = body.direction === "LONG" ? "🟢" : "🔴";
  const header   = channelName ? `⚡ <b>SEÑAL ${channelName.toUpperCase()}</b>` : "⚡ <b>SEÑAL PSYCHOMETRIKS</b>";
  let text = `${header}\n\n`;
  text += `${dirEmoji} <b>${body.asset} — ${body.direction}</b>\n\n`;
  text += `🎯 Entrada: <code>${body.entry}</code>\n`;
  text += `✅ TP1: <code>${body.tp1}</code>\n`;
  if (body.tp2) text += `✅ TP2: <code>${body.tp2}</code>\n`;
  text += `🛑 Stop Loss: <code>${body.sl}</code>\n\n`;
  const parts: string[] = [];
  if (body.rr)       parts.push(`⚖️ R/R: <code>${body.rr}</code>`);
  if (body.leverage) parts.push(`📈 Leverage: <code>${body.leverage}</code>`);
  if (parts.length) text += parts.join("  ·  ") + "\n\n";
  if (body.note)   text += `📝 <i>${body.note}</i>\n\n`;
  if (body.source) text += `🤖 <i>${body.source}</i>\n\n`;
  text += `<i>⚠️ Solo educativo. No es asesoramiento financiero.</i>\n`;
  text += `#${body.asset.replace(/[/.]/g, "")} #${body.direction} #Psychometriks`;
  return text;
}

async function pushToTelegram(token: string, chatId: string, text: string) {
  if (!token || token === "PENDIENTE" || !chatId || chatId === "PENDIENTE") return null;
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    return r.json() as Promise<{ ok: boolean; result?: { message_id: number } }>;
  } catch { return null; }
}

const router: IRouter = Router();

// ── GET /api/signals ─────────────────────────────────────────────────────
router.get("/signals", async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(signals)
      .orderBy(desc(signals.createdAt))
      .limit(100);
    res.json({ ok: true, signals: rows });
  } catch (err) {
    req.log.error({ err }, "signals fetch error");
    res.status(500).json({ error: "Error al obtener señales" });
  }
});

// ── POST /api/signals ─────────────────────────────────────────────────────
// Requires superadmin or operator token in X-PSY-Token header.
router.post("/signals", async (req: Request, res: Response) => {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  if (auth.role === "none") {
    res.status(403).json({ error: "Acceso denegado — se requiere rol de operador o superadmin" });
    return;
  }

  const {
    channelSlug, asset, direction, entry, tp1, tp2, sl,
    leverage, rr, note, status,
  } = req.body as {
    channelSlug?: string; asset?: string; direction?: string;
    entry?: string; tp1?: string; tp2?: string; sl?: string;
    leverage?: string; rr?: string; note?: string; status?: string;
  };

  if (!asset || !direction || !entry || !tp1 || !sl) {
    res.status(400).json({ error: "Faltan campos requeridos: asset, direction, entry, tp1, sl" });
    return;
  }
  if (!["LONG", "SHORT"].includes(direction)) {
    res.status(400).json({ error: "direction debe ser LONG o SHORT" });
    return;
  }

  const isBroadcast = channelSlug === "all" || channelSlug === "ambos";

  try {
    // ── Resolve target channels ───────────────────────────────────────────────
    let targetChannels: { id: number; slug: string; name: string; channelId: string }[] = [];
    if (isBroadcast) {
      targetChannels = await db.select().from(channels).where(eq(channels.active, true));
    } else if (channelSlug && channelSlug !== "default") {
      const [ch] = await db.select().from(channels).where(eq(channels.slug, channelSlug)).limit(1);
      if (ch) targetChannels = [{ id: ch.id, slug: ch.slug, name: ch.name, channelId: ch.channelId }];
    }

    // ── If broadcast: insert one signal row per channel ───────────────────────
    const slugsToInsert = isBroadcast && targetChannels.length > 0
      ? targetChannels.map(c => c.slug)
      : [channelSlug ?? "default"];

    const signalData = {
      asset: asset.trim().toUpperCase(),
      direction,
      entry: entry.trim(),
      tp1: tp1.trim(),
      tp2: tp2?.trim() || null,
      sl: sl.trim(),
      leverage: leverage?.trim() || null,
      rr: rr?.trim() || null,
      note: note?.trim() || null,
      source: `MANUAL:${auth.username}`,
      status: status ?? "ACTIVA",
    };

    const insertedSignals = await db.insert(signals)
      .values(slugsToInsert.map(slug => ({ ...signalData, channelSlug: slug })))
      .returning();

    // ── Push to Telegram via all active bots of each channel ─────────────────
    const signalBody = { ...signalData, tp2: tp2?.trim() || null };
    if (targetChannels.length > 0) {
      void Promise.allSettled(
        targetChannels.map(async ch => {
          // Get all active bots for this channel
          const bots = await db.select().from(channelBots)
            .where(eq(channelBots.channelId, ch.id))
            .then(rows => rows.filter(b => b.active));
          const text = buildSignalText(signalBody, ch.name);
          if (bots.length > 0) {
            // Send via each bot
            await Promise.allSettled(
              bots.map(b => pushToTelegram(b.botToken, ch.channelId, text))
            );
          } else {
            // Fallback: use channel's own botToken field
            const [chFull] = await db.select().from(channels).where(eq(channels.id, ch.id)).limit(1);
            if (chFull) await pushToTelegram(chFull.botToken, ch.channelId, text);
          }
        })
      );
    } else {
      // Legacy: env vars
      const envToken  = process.env["TELEGRAM_BOT_TOKEN"]  ?? "";
      const envChatId = process.env["TELEGRAM_CHANNEL_ID"] ?? "";
      if (envToken && envChatId) void pushToTelegram(envToken, envChatId, buildSignalText(signalBody));
    }

    req.log.info({ signalIds: insertedSignals.map(s => s.id), by: auth.username, isBroadcast }, "signal(s) created");
    res.json({ ok: true, signal: insertedSignals[0], signals: insertedSignals, broadcast: isBroadcast });
  } catch (err) {
    req.log.error({ err }, "signal create error");
    res.status(500).json({ error: "Error al crear señal" });
  }
});

// ── PATCH /api/signals/:id/status ─────────────────────────────────────────
router.patch("/signals/:id/status", async (req: Request, res: Response) => {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  if (auth.role === "none") {
    res.status(403).json({ error: "Acceso denegado — se requiere rol de operador o superadmin" });
    return;
  }

  const id = Number(req.params["id"]);
  const { status } = req.body as { status: string };
  const VALID = ["ACTIVA", "TP1 ✅", "TP2 ✅", "CERRADA ✅", "INVALIDADA ❌"];
  if (!VALID.includes(status)) {
    res.status(400).json({ error: "Status inválido" });
    return;
  }
  try {
    await db.update(signals).set({ status }).where(eq(signals.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "signals status update error");
    res.status(500).json({ error: "Error al actualizar" });
  }
});

// ── DELETE /api/signals/:id ────────────────────────────────────────────────
router.delete("/signals/:id", async (req: Request, res: Response) => {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  if (auth.role !== "superadmin") {
    res.status(403).json({ error: "Acceso denegado — solo SUPERADMIN puede eliminar señales" });
    return;
  }
  const id = Number(req.params["id"]);
  try {
    await db.delete(signals).where(eq(signals.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "signal delete error");
    res.status(500).json({ error: "Error al eliminar señal" });
  }
});

export default router;
