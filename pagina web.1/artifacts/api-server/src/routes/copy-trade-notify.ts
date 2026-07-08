import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { validateToken } from "../lib/psy-auth";
import { logger } from "../lib/logger";

const router = Router();

// ── Auto-creación de tablas (self-healing, mismo patrón que trader_snapshots) ─
let schemaReady: Promise<void> | null = null;
async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS copy_trade_subscribers (
          id SERIAL PRIMARY KEY,
          chat_id TEXT UNIQUE NOT NULL,
          label TEXT,
          active BOOLEAN NOT NULL DEFAULT true,
          created_at BIGINT NOT NULL
        );
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS copy_trade_notifications (
          id SERIAL PRIMARY KEY,
          chat_id TEXT NOT NULL,
          tg_message_id TEXT,
          trader_id TEXT,
          coin TEXT,
          direction TEXT,
          entry_price NUMERIC,
          response TEXT NOT NULL DEFAULT 'pendiente',
          sent_at BIGINT NOT NULL,
          responded_at BIGINT
        );
      `);
    })();
  }
  return schemaReady;
}

// ── Solo superadmin (piloto — nadie más lo ve todavía) ──────────────────────
async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  if (auth.role !== "superadmin") {
    res.status(403).json({ ok: false, error: "Piloto — solo disponible para el admin por ahora" });
    return false;
  }
  return true;
}

async function sendTelegram(chatId: string, text: string, replyMarkup?: unknown): Promise<string | null> {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) { logger.error("TELEGRAM_BOT_TOKEN no configurado"); return null; }
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        reply_markup: replyMarkup,
      }),
    });
    const d = await r.json() as { ok: boolean; result?: { message_id: number }; description?: string };
    if (!d.ok) { logger.error({ err: d.description }, "sendTelegram failed"); return null; }
    return String(d.result?.message_id ?? "");
  } catch (err) { logger.error({ err }, "sendTelegram error"); return null; }
}

// ── POST /api/copy-trade/subscribe — el usuario se anota con su chat_id ─────
router.post("/copy-trade/subscribe", async (req: Request, res: Response) => {
  await ensureSchema();
  const { chatId, label } = req.body as { chatId?: string; label?: string };
  if (!chatId?.trim()) { res.status(400).json({ ok: false, error: "chatId requerido" }); return; }

  try {
    await pool.query(
      `INSERT INTO copy_trade_subscribers (chat_id, label, active, created_at)
       VALUES ($1, $2, true, $3)
       ON CONFLICT (chat_id) DO UPDATE SET active = true, label = COALESCE($2, copy_trade_subscribers.label)`,
      [chatId.trim(), label ?? null, Date.now()],
    );
    // Mensaje de bienvenida — confirma que quedó anotado
    await sendTelegram(chatId.trim(),
      "✅ *PSY COPY TRADE* — Quedaste suscripto.\n\nCuando detectemos un movimiento fuerte de una ballena/trader, te avisamos acá con los detalles. Vos decidís si la tomas o no — nunca ejecutamos nada por vos.\n\nPara darte de baja, entra a la plataforma y presiona \"Cancelar suscripción\".",
    );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "copy-trade subscribe error");
    res.status(500).json({ ok: false, error: "Error al suscribir" });
  }
});

// ── POST /api/copy-trade/unsubscribe ────────────────────────────────────────
router.post("/copy-trade/unsubscribe", async (req: Request, res: Response) => {
  await ensureSchema();
  const { chatId } = req.body as { chatId?: string };
  if (!chatId?.trim()) { res.status(400).json({ ok: false, error: "chatId requerido" }); return; }

  try {
    // Al "borrarse", se desactiva — no se le vuelve a enviar nada más.
    await pool.query(`UPDATE copy_trade_subscribers SET active = false WHERE chat_id = $1`, [chatId.trim()]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Error al cancelar" });
  }
});

// ── GET /api/copy-trade/subscribers — solo admin, ver el piloto ────────────
router.get("/copy-trade/subscribers", async (req: Request, res: Response) => {
  if (!await requireAdmin(req, res)) return;
  await ensureSchema();
  try {
    const subs = await pool.query(`SELECT chat_id, label, active, created_at FROM copy_trade_subscribers ORDER BY created_at DESC`);
    const notifs = await pool.query(`SELECT * FROM copy_trade_notifications ORDER BY sent_at DESC LIMIT 30`);
    res.json({ ok: true, subscribers: subs.rows, recentNotifications: notifs.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ── Envía una notificación de señal con botones Sí/No ───────────────────────
async function notifySignal(signal: {
  traderId: string; coin: string; direction: "LONG" | "SHORT"; entryPrice?: number; displayName?: string;
}): Promise<void> {
  await ensureSchema();
  const subsRes = await pool.query(`SELECT chat_id FROM copy_trade_subscribers WHERE active = true`);
  if (subsRes.rows.length === 0) return;

  const dirLabel = signal.direction === "LONG" ? "🟢 LONG" : "🔴 SHORT";
  const text = [
    `🐋 *PSY COPY TRADE — Nueva señal*`,
    ``,
    `Trader: ${signal.displayName ?? signal.traderId}`,
    `Moneda: *${signal.coin}*`,
    `Dirección: ${dirLabel}`,
    signal.entryPrice ? `Precio de referencia: $${signal.entryPrice.toLocaleString()}` : "",
    ``,
    `¿Tomas esta operación?`,
  ].filter(Boolean).join("\n");

  const keyboard = {
    inline_keyboard: [[
      { text: "✅ Sí, la tomo", callback_data: `ct_yes` },
      { text: "❌ No", callback_data: `ct_no` },
    ]],
  };

  for (const row of subsRes.rows as Array<{ chat_id: string }>) {
    const msgId = await sendTelegram(row.chat_id, text, keyboard);
    if (msgId) {
      await pool.query(
        `INSERT INTO copy_trade_notifications (chat_id, tg_message_id, trader_id, coin, direction, entry_price, sent_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [row.chat_id, msgId, signal.traderId, signal.coin, signal.direction, signal.entryPrice ?? null, Date.now()],
      );
    }
  }
}

// ── POST /api/copy-trade/test-send — solo admin, para probar el piloto ─────
router.post("/copy-trade/test-send", async (req: Request, res: Response) => {
  if (!await requireAdmin(req, res)) return;
  const { chatId } = req.body as { chatId?: string };
  if (!chatId?.trim()) { res.status(400).json({ ok: false, error: "chatId requerido" }); return; }

  await notifySignal({
    traderId: "test", coin: "BTC", direction: "LONG",
    entryPrice: 63500, displayName: "Prueba del piloto",
  });
  res.json({ ok: true, message: "Notificación de prueba enviada" });
});

// ── Registrar la respuesta Sí/No (llamado desde el webhook de Telegram) ─────
export async function recordCopyTradeResponse(chatId: string, tgMessageId: string, response: "si" | "no"): Promise<void> {
  await ensureSchema();
  try {
    await pool.query(
      `UPDATE copy_trade_notifications SET response = $1, responded_at = $2 WHERE chat_id = $3 AND tg_message_id = $4`,
      [response, Date.now(), chatId, tgMessageId],
    );
  } catch (err) { logger.error({ err }, "recordCopyTradeResponse error"); }
}

// ── Chequeo periódico — detecta señales BUY/SELL nuevas y notifica ─────────
// (piloto: mientras solo el admin esté suscripto, esto no le llega a nadie más)
const seenSignals = new Set<string>();
async function checkForNewSignals(): Promise<void> {
  try {
    const port = process.env["PORT"] ?? "8080";
    const r = await fetch(`http://localhost:${port}/api/whale-intel/traders`, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return;
    const d = await r.json() as { ok: boolean; traders?: Array<{ id: string; coin: string; signal: string; currentPosition: string; positionSizeUsd: number; displayName: string }> };
    if (!d.ok || !d.traders) return;

    // Solo señales fuertes (posición grande) y BUY/SELL claro, no HOLD
    const fuertes = d.traders.filter(t => t.signal !== "HOLD" && t.positionSizeUsd > 500_000);
    for (const t of fuertes.slice(0, 5)) {
      const key = `${t.id}:${t.coin}:${t.signal}`;
      if (seenSignals.has(key)) continue;
      seenSignals.add(key);
      if (seenSignals.size > 500) seenSignals.clear(); // evita crecer sin límite
      await notifySignal({
        traderId: t.id, coin: t.coin,
        direction: t.signal === "BUY" ? "LONG" : "SHORT",
        displayName: t.displayName,
      });
    }
  } catch (err) { logger.error({ err }, "checkForNewSignals error"); }
}
setTimeout(() => {
  setInterval(() => { checkForNewSignals().catch(() => {}); }, 10 * 60_000); // cada 10 min
}, 120_000);

export default router;
