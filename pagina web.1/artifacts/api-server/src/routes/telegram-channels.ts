import { Router, type Request, type Response } from "express";
import { pool, db, members } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { validateToken } from "../lib/psy-auth";

const router = Router();

// ── Los 3 canales — todos ligados al plan Elite ─────────────────────────────
export const CHANNELS = {
  btcEth:   { id: process.env["TG_CHANNEL_BTC_ETH"]   ?? "-1003707106507", label: "Señales PSY (BTC/ETH/SOL)" },
  altcoins: { id: process.env["TG_CHANNEL_ALTCOINS"]  ?? "-1003702118104", label: "Señales Confirmadas (Altcoins)" },
  pro:      { id: process.env["TG_CHANNEL_PRO"]       ?? "-1003781020653", label: "Gem Hunter (PRO)" },
} as const;

let schemaReady: Promise<void> | null = null;
async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS member_telegram_links (
          id SERIAL PRIMARY KEY,
          member_id INTEGER NOT NULL,
          chat_id TEXT NOT NULL,
          phone TEXT,
          telegram_username TEXT,
          created_at BIGINT NOT NULL,
          UNIQUE(member_id)
        );
      `);
      // Por si la tabla ya existía de antes (sin estas columnas)
      await pool.query(`ALTER TABLE member_telegram_links ADD COLUMN IF NOT EXISTS phone TEXT;`);
      await pool.query(`ALTER TABLE member_telegram_links ADD COLUMN IF NOT EXISTS telegram_username TEXT;`);

      // Registro permanente de cada vez que se expulsa a alguien — para
      // tener trazabilidad de qué número/usuario se baneó y cuándo.
      await pool.query(`
        CREATE TABLE IF NOT EXISTS telegram_ban_log (
          id SERIAL PRIMARY KEY,
          member_id INTEGER,
          chat_id TEXT NOT NULL,
          phone TEXT,
          telegram_username TEXT,
          channel_label TEXT,
          motivo TEXT,
          banned_at BIGINT NOT NULL
        );
      `);
    })();
  }
  return schemaReady;
}

async function tgCall(method: string, body: Record<string, unknown>): Promise<unknown> {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) { logger.error("TELEGRAM_BOT_TOKEN no configurado"); return null; }
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json() as { ok: boolean; result?: unknown; description?: string };
    if (!d.ok) { logger.error({ method, err: d.description }, "tgCall failed"); return null; }
    return d.result;
  } catch (err) { logger.error({ err, method }, "tgCall error"); return null; }
}

// ── Otorga acceso: crea un link de invitación de un solo uso por canal y se
// lo manda al usuario por DM del bot ──────────────────────────────────────
export async function grantAllChannels(chatId: string): Promise<void> {
  const links: string[] = [];
  for (const ch of Object.values(CHANNELS)) {
    const result = await tgCall("createChatInviteLink", {
      chat_id: ch.id,
      member_limit: 1,
      name: `elite-${chatId}-${Date.now()}`,
    }) as { invite_link?: string } | null;
    if (result?.invite_link) links.push(`• ${ch.label}: ${result.invite_link}`);
  }
  if (links.length > 0) {
    await tgCall("sendMessage", {
      chat_id: chatId,
      text: `🎉 *Bienvenido al Plan Elite*\n\nAcá tienes tus links de acceso a los canales (cada uno es de un solo uso, solo para vos):\n\n${links.join("\n")}`,
      parse_mode: "Markdown",
    });
  }
}

// ── Revoca acceso: expulsa (kick) de los 3 canales sin ban permanente,
// para que pueda volver a entrar si reactiva Elite más adelante — y deja
// un registro permanente de qué número/usuario se expulsó y cuándo ────────
export async function revokeAllChannels(
  chatId: string,
  info?: { memberId?: number; phone?: string | null; telegramUsername?: string | null; motivo?: string },
): Promise<void> {
  await ensureSchema();
  for (const ch of Object.values(CHANNELS)) {
    await tgCall("banChatMember", { chat_id: ch.id, user_id: chatId });
    await tgCall("unbanChatMember", { chat_id: ch.id, user_id: chatId, only_if_banned: true });
    try {
      await pool.query(
        `INSERT INTO telegram_ban_log (member_id, chat_id, phone, telegram_username, channel_label, motivo, banned_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [info?.memberId ?? null, chatId, info?.phone ?? null, info?.telegramUsername ?? null, ch.label, info?.motivo ?? "Plan Elite finalizado", Date.now()],
      );
    } catch (err) { logger.error({ err }, "telegram_ban_log insert error"); }
  }
  await tgCall("sendMessage", {
    chat_id: chatId,
    text: "Tu plan Elite terminó, así que se te removió de los canales de señales. Si reactivas Elite, te volvemos a dar acceso automáticamente.",
  });
}

// ── POST /api/member/telegram-link — el usuario registra su chat_id ────────
router.post("/member/telegram-link", async (req: Request, res: Response) => {
  await ensureSchema();
  const { username, chatId, phone, telegramUsername } = req.body as {
    username?: string; chatId?: string; phone?: string; telegramUsername?: string;
  };
  if (!username?.trim() || !chatId?.trim()) { res.status(400).json({ ok: false, error: "username y chatId requeridos" }); return; }

  try {
    const [m] = await db.select().from(members).where(eq(members.username, username.trim().toLowerCase())).limit(1);
    if (!m) { res.status(404).json({ ok: false, error: "Usuario no encontrado" }); return; }

    await pool.query(
      `INSERT INTO member_telegram_links (member_id, chat_id, phone, telegram_username, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (member_id) DO UPDATE SET chat_id = $2, phone = COALESCE($3, member_telegram_links.phone), telegram_username = COALESCE($4, member_telegram_links.telegram_username)`,
      [m.id, chatId.trim(), phone?.trim() ?? null, telegramUsername?.trim() ?? null, Date.now()],
    );

    // Si ya es Elite, le manda los links ahora mismo
    if (m.plan === "elite" && m.active) await grantAllChannels(chatId.trim());

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "telegram-link error");
    res.status(500).json({ ok: false, error: "Error al vincular Telegram" });
  }
});

// ── Helper — usado desde members.ts cuando cambia el plan de alguien ───────
export async function syncChannelAccessForMember(memberId: number, isEliteNow: boolean): Promise<void> {
  await ensureSchema();
  try {
    const r = await pool.query(`SELECT chat_id, phone, telegram_username FROM member_telegram_links WHERE member_id = $1`, [memberId]);
    const row = r.rows[0] as { chat_id?: string; phone?: string; telegram_username?: string } | undefined;
    if (!row?.chat_id) return; // el usuario nunca vinculó su Telegram, no hay nada que hacer

    if (isEliteNow) await grantAllChannels(row.chat_id);
    else await revokeAllChannels(row.chat_id, { memberId, phone: row.phone, telegramUsername: row.telegram_username });
  } catch (err) { logger.error({ err, memberId }, "syncChannelAccessForMember error"); }
}

// ── GET /api/admin/telegram-ban-log — historial de expulsiones (solo admin) ─
router.get("/admin/telegram-ban-log", async (req: Request, res: Response) => {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  if (auth.role !== "superadmin") { res.status(403).json({ ok: false, error: "Acceso denegado" }); return; }
  await ensureSchema();
  try {
    const r = await pool.query(`SELECT * FROM telegram_ban_log ORDER BY banned_at DESC LIMIT 100`);
    res.json({ ok: true, log: r.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;
