import { Router, type IRouter, type Request, type Response } from "express";
import { db, psyWhitelist } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendEmail } from "../lib/email";
import { validateToken } from "../lib/psy-auth";

const router: IRouter = Router();

// ── POST /api/whitelist ───────────────────────────────────────────────────────
// Registro público — guarda el email y envía confirmación automática.
router.post("/whitelist", async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Correo electrónico inválido" });
    return;
  }
  const normalized = email.toLowerCase().trim();
  try {
    await db.insert(psyWhitelist).values({ email: normalized });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") {
      res.status(409).json({ error: "Este correo ya está en la whitelist" });
      return;
    }
    req.log.error({ err }, "whitelist insert error");
    res.status(500).json({ error: "Error al registrar el correo" });
    return;
  }

  sendEmail(normalized, "✅ Estás en la Whitelist de $PSY Token", whitelistConfirmHtml(normalized)).catch(() => {});
  res.json({ ok: true });
});

// ── GET /api/admin/whitelist ──────────────────────────────────────────────────
// Admin only — lista de todos los registrados + conteo.
router.get("/admin/whitelist", async (req: Request, res: Response) => {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  if (auth.role !== "superadmin") { res.status(403).json({ error: "Acceso denegado" }); return; }
  try {
    const rows = await db.select().from(psyWhitelist).orderBy(psyWhitelist.createdAt);
    res.json({ ok: true, total: rows.length, entries: rows });
  } catch (err) {
    req.log.error({ err }, "whitelist fetch error");
    res.status(500).json({ error: "Error al obtener whitelist" });
  }
});

// ── POST /api/admin/whitelist/notify ─────────────────────────────────────────
// Admin only — envía email masivo a todos los no notificados.
router.post("/admin/whitelist/notify", async (req: Request, res: Response) => {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  if (auth.role !== "superadmin") { res.status(403).json({ error: "Acceso denegado" }); return; }

  const { subject, html } = req.body as { subject?: string; html?: string };
  if (!subject || !html) {
    res.status(400).json({ error: "subject y html son requeridos" });
    return;
  }

  try {
    const pending = await db
      .select()
      .from(psyWhitelist)
      .where(eq(psyWhitelist.notified, false));

    let sent = 0;
    for (const entry of pending) {
      const ok = await sendEmail(entry.email, subject, html);
      if (ok) {
        await db.update(psyWhitelist)
          .set({ notified: true, notifiedAt: new Date() })
          .where(eq(psyWhitelist.id, entry.id));
        sent++;
      }
    }
    res.json({ ok: true, sent, total: pending.length });
  } catch (err) {
    req.log.error({ err }, "whitelist notify error");
    res.status(500).json({ error: "Error al enviar notificaciones" });
  }
});

// ── Email template ────────────────────────────────────────────────────────────
function whitelistConfirmHtml(email: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Whitelist $PSY Token — PSYCHOMETRIKS</title></head>
<body style="margin:0;padding:0;background:#060a0f;font-family:'Courier New',monospace">
  <div style="max-width:520px;margin:40px auto;background:#0d1520;border:1px solid #1a2535;border-radius:8px;overflow:hidden">
    <div style="height:3px;background:linear-gradient(90deg,#e040fb,#00e5ff,#ffd700)"></div>
    <div style="padding:40px 36px">
      <div style="font-size:22px;font-weight:900;letter-spacing:0.3em;color:#00e5ff;margin-bottom:4px">PSYCHOMETRIKS</div>
      <div style="font-size:10px;color:#546e7a;letter-spacing:0.2em;margin-bottom:32px">$PSY TOKEN · WHITELIST</div>

      <div style="font-size:40px;text-align:center;margin-bottom:20px">🎯</div>
      <div style="font-size:22px;font-weight:900;color:#e040fb;letter-spacing:0.15em;text-align:center;margin-bottom:16px">
        ¡ESTÁS EN LA WHITELIST!
      </div>

      <p style="color:#8090a0;font-size:13px;line-height:1.8;margin-bottom:16px">
        Tu correo <strong style="color:#fff">${email}</strong> fue registrado exitosamente.
      </p>
      <p style="color:#8090a0;font-size:13px;line-height:1.8;margin-bottom:24px">
        Como miembro de la whitelist tenés acceso prioritario al lanzamiento del <strong style="color:#e040fb">$PSY Token</strong>
        con un <strong style="color:#ffd700">30% de descuento</strong> sobre el precio del IDO.
      </p>

      <div style="background:#0a0012;border:1px solid #e040fb30;border-radius:6px;padding:20px;margin-bottom:28px">
        <div style="font-size:10px;color:#546e7a;letter-spacing:0.2em;margin-bottom:12px">LO QUE VIENE</div>
        <div style="color:#c090d0;font-size:12px;line-height:2">
          ⏳ IDO Launch — Q1 2026<br>
          💎 Precio whitelist: $0.035 (-30%)<br>
          🚀 Precio IDO público: $0.05<br>
          📡 Te avisaremos por este correo cuando abra la venta
        </div>
      </div>

      <a href="https://psychometriks.trade/psy-token"
        style="display:block;background:#e040fb;color:#060a0f;font-size:13px;font-weight:900;letter-spacing:0.15em;padding:14px 32px;text-decoration:none;border-radius:4px;text-align:center">
        ⬡ VER $PSY TOKEN
      </a>
    </div>
    <div style="padding:16px 36px;background:#0a1018;border-top:1px solid #1a2535;font-size:10px;color:#2a3a4a;text-align:center">
      © ${year} PSYCHOMETRIKS · psychometriks.trade<br>
      <span style="color:#1a2535">Recibiste este correo porque te registraste en la whitelist del $PSY Token.</span>
    </div>
  </div>
</body></html>`;
}

export default router;
