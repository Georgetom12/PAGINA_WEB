import { Router, type Request, type Response } from "express";
import { db, signals, channels, channelBots } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

// ── helpers ──────────────────────────────────────────────────────────────────
function buildTelegramText(body: SignalBody, channelName?: string): string {
  const { asset, direction, entry, tp1, tp2, tp3, sl, leverage, rr, note, source } = body;
  const dirEmoji = direction === "LONG" ? "🟢" : "🔴";
  const header   = channelName ? `⚡ <b>SEÑAL ${channelName.toUpperCase()}</b>` : "⚡ <b>SEÑAL PSYCHOMETRIKS</b>";

  let text = `${header}\n\n`;
  text += `${dirEmoji} <b>${asset} — ${direction}</b>\n\n`;
  text += `🎯 Entrada: <code>${entry}</code>\n`;
  text += `✅ TP1: <code>${tp1}</code>\n`;
  if (tp2) text += `✅ TP2: <code>${tp2}</code>\n`;
  if (tp3) text += `✅ TP3: <code>${tp3}</code>\n`;
  text += `🛑 Stop Loss: <code>${sl}</code>\n\n`;

  const parts: string[] = [];
  if (rr)       parts.push(`⚖️ R/R: <code>${rr}</code>`);
  if (leverage)  parts.push(`📈 Leverage: <code>${leverage}</code>`);
  if (parts.length) text += parts.join("  ·  ") + "\n\n";
  if (note)   text += `📝 <i>${note}</i>\n\n`;
  if (source) text += `🤖 <i>${source}</i>\n\n`;
  text += `<i>⚠️ Solo educativo. No es asesoramiento financiero.</i>\n\n`;
  text += `#${asset.replace(/[/.]/, "")} #${direction} #Psychometriks`;
  return text;
}

async function sendToTelegram(token: string, chatId: string, text: string) {
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  return r.json() as Promise<{ ok: boolean; description?: string; result?: { message_id: number } }>;
}

interface SignalBody {
  asset: string; direction: string; entry: string; tp1: string;
  tp2?: string; tp3?: string; sl: string; leverage?: string;
  rr?: string; note?: string; source?: string;
}

// ── POST /api/telegram/signal — single channel (legacy, uses env vars) ──────
router.post("/telegram/signal", async (req: Request, res: Response) => {
  const token     = process.env["TELEGRAM_BOT_TOKEN"]  ?? "";
  const channelId = process.env["TELEGRAM_CHANNEL_ID"] ?? "";

  if (!token || !channelId) {
    res.status(503).json({
      error: "Telegram no configurado",
      hint: "Usá /api/telegram/signal/:channelSlug con canales configurados en el panel",
    });
    return;
  }

  const body = req.body as SignalBody;
  if (!body.asset || !body.direction || !body.entry || !body.tp1 || !body.sl) {
    res.status(400).json({ error: "asset, direction, entry, tp1 y sl son requeridos" });
    return;
  }

  try {
    const text   = buildTelegramText(body);
    const tgData = await sendToTelegram(token, channelId, text);
    if (!tgData.ok) {
      req.log.error({ tgData }, "Telegram API error");
      res.status(502).json({ error: tgData.description ?? "Telegram API error" });
      return;
    }
    await db.insert(signals).values({
      channelSlug: "default",
      asset: body.asset, direction: body.direction, entry: body.entry,
      tp1: body.tp1, tp2: body.tp2 ?? null, tp3: body.tp3 ?? null, sl: body.sl,
      leverage: body.leverage ?? null, rr: body.rr ?? null,
      note: body.note ?? null, source: body.source ?? "MANUAL",
      status: "ACTIVA", tgMsgId: String(tgData.result?.message_id ?? ""),
    });
    res.json({ ok: true, message_id: tgData.result?.message_id });
  } catch (err) {
    req.log.error({ err }, "telegram send error");
    res.status(500).json({ error: "Error interno al enviar a Telegram" });
  }
});

// ── POST /api/telegram/signal/:channelSlug — send to a specific channel ─────
router.post("/telegram/signal/:channelSlug", async (req: Request, res: Response) => {
  const slug = req.params["channelSlug"]!;
  const body = req.body as SignalBody;

  if (!body.asset || !body.direction || !body.entry || !body.tp1 || !body.sl) {
    res.status(400).json({ error: "asset, direction, entry, tp1 y sl son requeridos" });
    return;
  }

  try {
    const [ch] = await db.select().from(channels).where(sql`${channels.slug} = ${slug}`).limit(1);
    if (!ch) {
      res.status(404).json({ error: `Canal "${slug}" no encontrado` });
      return;
    }
    if (!ch.active) {
      res.status(403).json({ error: `Canal "${slug}" está inactivo` });
      return;
    }

    const text = buildTelegramText(body, ch.name);

    const bots = await db.select().from(channelBots)
      .where(eq(channelBots.channelId, ch.id));
    const activeBots = bots.filter(b => b.active);

    let firstMsgId: number | undefined;
    let anyOk = false;

    if (activeBots.length > 0) {
      for (const bot of activeBots) {
        const tgData = await sendToTelegram(bot.botToken, ch.channelId, text);
        if (tgData.ok) {
          anyOk = true;
          if (!firstMsgId) firstMsgId = tgData.result?.message_id;
        } else {
          req.log.error({ tgData, slug, botId: bot.id }, "Telegram bot error");
        }
      }
    } else {
      const tgData = await sendToTelegram(ch.botToken, ch.channelId, text);
      if (tgData.ok) {
        anyOk = true;
        firstMsgId = tgData.result?.message_id;
      } else {
        req.log.error({ tgData, slug }, "Telegram API error");
        res.status(502).json({ error: tgData.description ?? "Telegram API error" });
        return;
      }
    }

    if (!anyOk) {
      res.status(502).json({ error: "Todos los bots fallaron al enviar" });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.insert(signals) as any).values({
      channelSlug: String(slug),
      asset: body.asset, direction: body.direction, entry: body.entry,
      tp1: body.tp1, tp2: body.tp2 ?? null, tp3: body.tp3 ?? null, sl: body.sl,
      leverage: body.leverage ?? null, rr: body.rr ?? null,
      note: body.note ?? null, source: body.source ?? "MANUAL",
      status: "ACTIVA", tgMsgId: String(firstMsgId ?? ""),
    });

    req.log.info({ slug, asset: body.asset, direction: body.direction, bots: activeBots.length }, "Signal sent via named channel");
    res.json({ ok: true, message_id: firstMsgId, channel: ch.name, bots_used: activeBots.length });
  } catch (err) {
    req.log.error({ err }, "telegram multi-channel send error");
    res.status(500).json({ error: "Error interno al enviar a Telegram" });
  }
});

// ── POST /api/telegram/signal/all — broadcast to all active channels ─────────
router.post("/telegram/broadcast", async (req: Request, res: Response) => {
  const body = req.body as SignalBody;
  if (!body.asset || !body.direction || !body.entry || !body.tp1 || !body.sl) {
    res.status(400).json({ error: "asset, direction, entry, tp1 y sl son requeridos" });
    return;
  }

  try {
    const activeChannels = await db.select().from(channels).where(eq(channels.active, true));
    if (activeChannels.length === 0) {
      res.status(404).json({ error: "No hay canales activos configurados" });
      return;
    }

    const results = await Promise.allSettled(
      activeChannels.map(async ch => {
        const text   = buildTelegramText(body, ch.name);
        const tgData = await sendToTelegram(ch.botToken, ch.channelId, text);
        if (!tgData.ok) throw new Error(tgData.description ?? "Telegram API error");
        await db.insert(signals).values({
          channelSlug: ch.slug,
          asset: body.asset, direction: body.direction, entry: body.entry,
          tp1: body.tp1, tp2: body.tp2 ?? null, tp3: body.tp3 ?? null, sl: body.sl,
          leverage: body.leverage ?? null, rr: body.rr ?? null,
          note: body.note ?? null, source: body.source ?? "MANUAL",
          status: "ACTIVA", tgMsgId: String(tgData.result?.message_id ?? ""),
        });
        return { slug: ch.slug, name: ch.name, message_id: tgData.result?.message_id };
      })
    );

    const sent   = results.filter(r => r.status === "fulfilled").map(r => (r as PromiseFulfilledResult<{ slug: string; name: string; message_id?: number }>).value);
    const failed = results.filter(r => r.status === "rejected").map(r => (r as PromiseRejectedResult).reason?.message ?? "Error");

    res.json({ ok: sent.length > 0, sent, failed });
  } catch (err) {
    req.log.error({ err }, "broadcast error");
    res.status(500).json({ error: "Error interno en broadcast" });
  }
});

// ── POST /api/telegram/webhook — incoming from Telegram ──────────────────────
router.post("/telegram/webhook", async (req: Request, res: Response) => {
  res.json({ ok: true });
  try {
    const update = req.body as TelegramUpdate;
    const msg    = update.channel_post ?? update.message;
    if (!msg?.text) return;

    const chatId = String(msg.chat.id);

    // ── Handle /bot-status command ──────────────────────────────────────────
    if (msg.text.trim().startsWith("/bot-status")) {
      await handleBotStatusCommand(req, chatId, msg.chat.type);
      return;
    }

    if (!msg.text.includes("SEÑAL")) return;

    const parsed = parseTelegramSignal(msg.text);
    if (!parsed) return;

    // Try to match channel by channelId
    const [channel] = await db.select().from(channels).where(eq(channels.channelId, chatId)).limit(1);

    await db.insert(signals).values({
      channelSlug: channel?.slug ?? "default",
      ...parsed,
      tgMsgId: String(msg.message_id),
      status: "ACTIVA",
    });
    req.log.info({ asset: parsed.asset, channelSlug: channel?.slug ?? "default" }, "Signal from webhook saved");
  } catch (err) {
    req.log.error({ err }, "webhook processing error");
  }
});

// ── /bot-status command handler ───────────────────────────────────────────
async function handleBotStatusCommand(req: Request, chatId: string, chatType: string) {
  try {
    // Find the channel to get its bot token
    const [ch] = await db.select().from(channels).where(eq(channels.channelId, chatId)).limit(1);

    // Use env token as fallback
    const botToken = ch?.botToken || process.env["TELEGRAM_BOT_TOKEN"] || "";
    if (!botToken) {
      req.log.warn({ chatId }, "No bot token for /bot-status reply");
      return;
    }

    // Fetch bot status data
    const statusData = await fetchBotStatusData();
    const text = formatBotStatusMessage(statusData);

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });

    req.log.info({ chatId }, "/bot-status command replied");
  } catch (err) {
    req.log.error({ err }, "/bot-status command error");
  }
}

async function fetchBotStatusData() {
  const { db: dbConn, signals: sig, channels: chan } = await import("@workspace/db");
  const { desc: descOrd, gte } = await import("drizzle-orm");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [allToday, lastArr, allChans] = await Promise.all([
    dbConn.select().from(sig).where(gte(sig.createdAt, todayStart)),
    dbConn.select().from(sig).orderBy(descOrd(sig.createdAt)).limit(1),
    dbConn.select({ id: chan.id, active: chan.active }).from(chan),
  ]);

  const last = lastArr[0] ?? null;

  const calcR = (status: string, rr: string | null) => {
    if (status === "INVALIDADA ❌") return -1;
    if (status === "ACTIVA") return 0;
    let reward = 1;
    if (rr) { const m = rr.match(/1\s*[:\/]\s*([\d.]+)/); if (m) reward = parseFloat(m[1]!); }
    if (status === "TP2 ✅") return reward;
    if (status === "TP1 ✅" || status === "CERRADA ✅") return Math.min(reward, 2);
    return 0;
  };

  const pnlR      = allToday.reduce((a, s) => a + calcR(s.status, s.rr), 0);
  const wins      = allToday.filter(s => s.status.startsWith("TP") || s.status === "CERRADA ✅").length;
  const losses    = allToday.filter(s => s.status === "INVALIDADA ❌").length;
  const active    = allToday.filter(s => s.status === "ACTIVA").length;
  const closed    = allToday.filter(s => s.status !== "ACTIVA").length;
  const winRate   = closed > 0 ? Math.round((wins / closed) * 100) : 0;
  const activeCh  = allChans.filter(c => c.active).length;

  const startMs   = Date.now() - (process.uptime() * 1000);
  const upH       = Math.floor(process.uptime() / 3600);
  const upM       = Math.floor((process.uptime() % 3600) / 60);
  const uptime    = upH > 0 ? `${upH}h ${upM}m` : `${upM}m`;

  return { pnlR, wins, losses, active, closed, winRate, activeCh, last, uptime, signalsToday: allToday.length };
}

function formatBotStatusMessage(d: Awaited<ReturnType<typeof fetchBotStatusData>>) {
  const pnlSign  = d.pnlR >= 0 ? "📈" : "📉";
  const pnlStr   = `${d.pnlR >= 0 ? "+" : ""}${d.pnlR.toFixed(2)}R`;
  const now      = new Date().toLocaleString("es-EC", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Guayaquil",
  });

  let txt = `🤖 <b>PSYCHOMETRIKS BOT — ESTADO</b>\n`;
  txt += `🟢 <b>ACTIVO</b>  ·  Uptime: ${d.uptime}\n`;
  txt += `🕒 ${now} (ECT)\n\n`;

  txt += `${pnlSign} <b>PnL del Día:</b> <code>${pnlStr}</code>\n`;
  txt += `📊 Señales hoy: ${d.signalsToday}  |  Abiertas: ${d.active}\n`;
  txt += `✅ Wins: ${d.wins}  ·  ❌ Losses: ${d.losses}  ·  🎯 WR: ${d.winRate}%\n\n`;

  if (d.last) {
    const dirEmoji = d.last.direction === "LONG" ? "🟢" : "🔴";
    const ago      = Math.round((Date.now() - new Date(d.last.createdAt).getTime()) / 60000);
    const agoStr   = ago < 60 ? `${ago}m atrás` : `${Math.floor(ago / 60)}h atrás`;
    txt += `📡 <b>Última señal:</b>\n`;
    txt += `${dirEmoji} <b>${d.last.asset} ${d.last.direction}</b>`;
    if (d.last.leverage) txt += ` (${d.last.leverage})`;
    txt += `\n`;
    txt += `🎯 E: <code>${d.last.entry}</code>  TP1: <code>${d.last.tp1}</code>  SL: <code>${d.last.sl}</code>\n`;
    txt += `📌 Estado: <b>${d.last.status}</b>`;
    if (d.last.rr) txt += `  ·  R/R: ${d.last.rr}`;
    txt += `\n⏱ ${agoStr}\n\n`;
  } else {
    txt += `📡 <b>Última señal:</b> Sin señales registradas\n\n`;
  }

  txt += `📺 Canales activos: ${d.activeCh}\n`;
  txt += `<i>#PsychometriksBot #Status</i>`;
  return txt;
}

// ── GET /api/telegram/webhook-url ────────────────────────────────────────────
router.get("/telegram/webhook-url", (_req: Request, res: Response) => {
  const domains    = process.env["REPLIT_DOMAINS"] ?? "";
  const domain     = domains.split(",")[0]?.trim();
  if (!domain) {
    res.json({ ok: false, hint: "Deploy the app first to get a public URL." });
    return;
  }
  const webhookUrl = `https://${domain}/api/telegram/webhook`;
  res.json({ ok: true, webhookUrl });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
interface TelegramUpdate {
  update_id: number;
  channel_post?: TelegramMessage;
  message?: TelegramMessage;
}
interface TelegramMessage {
  message_id: number;
  text?: string;
  date: number;
  chat: { id: number; type: string };
}

function parseTelegramSignal(txt: string) {
  const isLong  = /🟢/.test(txt);
  const isShort = /🔴/.test(txt);
  if (!isLong && !isShort) return null;
  const direction = isLong ? "LONG" : "SHORT";

  const assetMatch = txt.match(/([A-Z]{2,6}\/[A-Z]{2,5})\s*[—–-]/);
  if (!assetMatch) return null;
  const asset = assetMatch[1]!;

  const extract = (label: string) => {
    const m = txt.match(new RegExp(`${label}[:\\s]+([\\d,.]+)`));
    return m ? m[1]! : "";
  };

  const entry = extract("Entrada");
  const tp1   = extract("TP1");
  const tp2   = extract("TP2") || null;
  const tp3   = extract("TP3") || null;
  const sl    = extract("Stop Loss") || extract("Stop");
  if (!entry || !tp1 || !sl) return null;

  const rrMatch   = txt.match(/R\/R[:\s]+([0-9:.,]+)/);
  const levMatch  = txt.match(/Leverage[:\s]+([^\n]+)/);
  const noteMatch = txt.match(/📝\s*(.+?)(?:\n|$)/);

  return {
    asset, direction, entry, tp1, tp2, tp3, sl,
    rr:       rrMatch  ? rrMatch[1]!.trim()  : null,
    leverage: levMatch ? levMatch[1]!.trim() : null,
    note:     noteMatch ? noteMatch[1]!.trim() : null,
    source:   "PSY BOT",
  };
}

export default router;
