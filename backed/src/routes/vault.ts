import { Router, Request, Response } from "express";
import { createHmac, randomBytes } from "crypto";

const router = Router();

// ─── Pure-Node TOTP (RFC 6238 / RFC 4226) ─────────────────────────────────────
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function generateBase32Secret(byteLen = 20): string {
  const bytes = randomBytes(byteLen);
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  let result = "";
  for (let i = 0; i + 4 < bits.length; i += 5) {
    result += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  return result;
}

function base32ToBuffer(base32: string): Buffer {
  const cleaned = base32.toUpperCase().replace(/=+$/, "").replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const c of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(c);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, "0");
  }
  const byteArr: number[] = [];
  for (let i = 0; i + 7 < bits.length; i += 8) {
    byteArr.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(byteArr);
}

function generateTOTP(secret: string, windowOffset = 0): string {
  const key = base32ToBuffer(secret);
  const counter = Math.floor(Date.now() / 30000) + windowOffset;
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000) >>> 0, 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24 |
     (hmac[offset + 1] & 0xff) << 16 |
     (hmac[offset + 2] & 0xff) << 8 |
     (hmac[offset + 3] & 0xff)) % 1_000_000;
  return code.toString().padStart(6, "0");
}

function verifyTOTP(token: string, secret: string): boolean {
  // Allow ±1 window (±30 seconds tolerance)
  for (const w of [-1, 0, 1]) {
    if (generateTOTP(secret, w) === token) return true;
  }
  return false;
}

function otpauthURI(secret: string, user: string, issuer: string): string {
  const params = new URLSearchParams({
    secret, issuer, algorithm: "SHA1", digits: "6", period: "30",
  });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(user)}?${params}`;
}

// ── POST /api/vault/totp/setup ─────────────────────────────────────────────
router.post("/vault/totp/setup", (req: Request, res: Response) => {
  const { userId = "psy-user" } = req.body as { userId?: string };
  try {
    const secret = generateBase32Secret(20);
    const url = otpauthURI(secret, userId, "PSY VAULT · PSYCHOMETRIKS");
    req.log.info({ userId }, "vault totp setup");
    res.json({ ok: true, secret, otpauthUrl: url });
  } catch (err) {
    req.log.error({ err }, "vault totp setup error");
    res.status(500).json({ ok: false, error: "Error generando clave 2FA" });
  }
});

// ── POST /api/vault/totp/verify ────────────────────────────────────────────
router.post("/vault/totp/verify", (req: Request, res: Response) => {
  const { token, secret } = req.body as { token?: string; secret?: string };
  if (!token || !secret) {
    res.status(400).json({ ok: false, error: "token y secret requeridos" });
    return;
  }
  const valid = verifyTOTP(token, secret);
  res.json({ ok: true, valid });
});

// ── POST /api/vault/send-recovery ─────────────────────────────────────────
router.post("/vault/send-recovery", async (req: Request, res: Response) => {
  const { recoveryKey, method, chatId } = req.body as {
    recoveryKey?: string;
    method?: string;
    chatId?: string;
  };

  if (!recoveryKey || !method) {
    res.status(400).json({ ok: false, error: "recoveryKey y method requeridos" });
    return;
  }

  if (method === "telegram") {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      res.status(503).json({
        ok: false,
        error: "Telegram no configurado. Agrega TELEGRAM_BOT_TOKEN en los secretos.",
        setupRequired: true,
      });
      return;
    }
    const targetChatId = chatId ?? process.env.TELEGRAM_CHANNEL_ID;
    if (!targetChatId) {
      res.status(400).json({ ok: false, error: "Se requiere un chat ID de Telegram." });
      return;
    }
    try {
      const text = [
        "🔐 *PSY VAULT — Clave de Recuperación*",
        "",
        `\`${recoveryKey}\``,
        "",
        "⚠️ *NUNCA compartas esta clave con nadie.*",
        "Guárdala en un lugar seguro fuera de línea.",
        "PSYCHOMETRIKS no puede recuperar fondos perdidos.",
      ].join("\n");

      const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: targetChatId, text, parse_mode: "Markdown" }),
      });
      const d = await r.json() as { ok: boolean; description?: string };
      if (!d.ok) {
        res.status(400).json({ ok: false, error: d.description ?? "Error de Telegram" });
        return;
      }
      req.log.info({ method, chatId: targetChatId }, "vault recovery key sent");
      res.json({ ok: true });
    } catch (err) {
      req.log.error({ err }, "vault send-recovery telegram error");
      res.status(500).json({ ok: false, error: "Error al enviar por Telegram" });
    }
    return;
  }

  res.status(501).json({
    ok: false,
    error: `Método "${method}" próximamente disponible.`,
    setupRequired: true,
  });
});

export default router;
