import { Router, Request, Response } from "express";
import { generateBase32Secret, verifyTOTP, otpauthURI } from "../lib/totp";

const router = Router();

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
