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

// NOTA DE SEGURIDAD: /vault/send-recovery fue eliminado a propósito.
// La clave de recuperación de la bóveda NUNCA debe salir del dispositivo
// del usuario ni pasar por ningún servidor o servicio de terceros (ni
// siquiera Telegram) — el usuario es el único que debe verla y guardarla.

export default router;
