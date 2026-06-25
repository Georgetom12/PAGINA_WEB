import { logger } from "./logger";

const RESEND_API_KEY = process.env["RESEND_API_KEY"] ?? "";
const FROM = "PSYCHOMETRIKS <noreply@psychometriks.trade>";
const BASE_URL = "https://psychometriks.trade";

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    logger.warn("[email] RESEND_API_KEY not set — skipping send");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    if (!res.ok) {
      const body = await res.text();
      logger.error({ status: res.status, body }, "[email] Resend error");
    }
    return res.ok;
  } catch (err) {
    logger.error({ err }, "[email] fetch error");
    return false;
  }
}

export function verifyEmailHtml(username: string, token: string): string {
  const link = `${BASE_URL}/verify-email/${token}`;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Verificá tu cuenta PSYCHOMETRIKS</title></head>
<body style="margin:0;padding:0;background:#060a0f;font-family:'Courier New',monospace">
  <div style="max-width:520px;margin:40px auto;background:#0d1520;border:1px solid #1a2535;border-radius:8px;overflow:hidden">
    <div style="height:3px;background:linear-gradient(90deg,#00e5ff,#00e676,#ffd700,#e040fb)"></div>
    <div style="padding:40px 36px">
      <div style="font-size:22px;font-weight:900;letter-spacing:0.3em;color:#00e5ff;margin-bottom:6px">PSYCHOMETRIKS</div>
      <div style="font-size:10px;color:#546e7a;letter-spacing:0.2em;margin-bottom:32px">PLATAFORMA DE TRADING</div>
      <p style="color:#8090a0;font-size:13px;line-height:1.7;margin-bottom:8px">Hola <strong style="color:#fff">${username}</strong>,</p>
      <p style="color:#8090a0;font-size:13px;line-height:1.7;margin-bottom:28px">
        Hacé clic en el botón para verificar tu correo y activar tu cuenta de PSY Exchange.
        El link expira en <strong style="color:#ffd700">24 horas</strong>.
      </p>
      <a href="${link}" style="display:inline-block;background:#00e5ff;color:#060a0f;font-size:13px;font-weight:900;letter-spacing:0.15em;padding:14px 32px;text-decoration:none;border-radius:4px">
        ⬡ VERIFICAR CUENTA
      </a>
      <p style="color:#2a3a4a;font-size:10px;margin-top:28px;line-height:1.6">
        Si no te registraste en PSYCHOMETRIKS, ignorá este mensaje.<br>
        <span style="color:#1a2535">${link}</span>
      </p>
    </div>
    <div style="padding:16px 36px;background:#0a1018;border-top:1px solid #1a2535;font-size:10px;color:#2a3a4a;text-align:center">
      © ${new Date().getFullYear()} PSYCHOMETRIKS · psychometriks.trade · Solo educativo
    </div>
  </div>
</body></html>`;
}

export function resetPasswordHtml(username: string, token: string): string {
  const link = `${BASE_URL}/reset-password/${token}`;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Reseteo de contraseña PSYCHOMETRIKS</title></head>
<body style="margin:0;padding:0;background:#060a0f;font-family:'Courier New',monospace">
  <div style="max-width:520px;margin:40px auto;background:#0d1520;border:1px solid #1a2535;border-radius:8px;overflow:hidden">
    <div style="height:3px;background:linear-gradient(90deg,#00e5ff,#00e676,#ffd700,#e040fb)"></div>
    <div style="padding:40px 36px">
      <div style="font-size:22px;font-weight:900;letter-spacing:0.3em;color:#00e5ff;margin-bottom:6px">PSYCHOMETRIKS</div>
      <div style="font-size:10px;color:#546e7a;letter-spacing:0.2em;margin-bottom:32px">RESETEO DE CONTRASEÑA</div>
      <p style="color:#8090a0;font-size:13px;line-height:1.7;margin-bottom:8px">Hola <strong style="color:#fff">${username}</strong>,</p>
      <p style="color:#8090a0;font-size:13px;line-height:1.7;margin-bottom:28px">
        Recibimos una solicitud para cambiar tu contraseña. Hacé clic abajo para elegir una nueva.
        El link expira en <strong style="color:#ffd700">15 minutos</strong>.
      </p>
      <a href="${link}" style="display:inline-block;background:#ffd700;color:#060a0f;font-size:13px;font-weight:900;letter-spacing:0.15em;padding:14px 32px;text-decoration:none;border-radius:4px">
        🔑 CAMBIAR CONTRASEÑA
      </a>
      <p style="color:#2a3a4a;font-size:10px;margin-top:28px;line-height:1.6">
        Si no solicitaste este cambio, ignorá este mensaje. Tu contraseña actual sigue siendo válida.<br>
        <span style="color:#1a2535">${link}</span>
      </p>
    </div>
    <div style="padding:16px 36px;background:#0a1018;border-top:1px solid #1a2535;font-size:10px;color:#2a3a4a;text-align:center">
      © ${new Date().getFullYear()} PSYCHOMETRIKS · psychometriks.trade · Solo educativo
    </div>
  </div>
</body></html>`;
}

export function submissionStatusHtml(
  tokenName: string,
  symbol: string,
  status: "approved" | "rejected",
  adminNotes?: string,
): string {
  const approved = status === "approved";
  const accentColor = approved ? "#00e676" : "#ff1744";
  const emoji      = approved ? "✅" : "❌";
  const headline   = approved ? "¡Tu token fue aprobado!" : "Solicitud no aprobada";
  const body       = approved
    ? `Tu token <strong style="color:#fff">${tokenName} (${symbol})</strong> ha sido revisado y aprobado por el equipo PSYCHOMETRIKS. Ya está visible en el PSY Exchange para que los usuarios puedan invertir.`
    : `Tu solicitud para <strong style="color:#fff">${tokenName} (${symbol})</strong> fue revisada y no fue aprobada en esta ocasión.`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${headline} — PSYCHOMETRIKS Exchange</title></head>
<body style="margin:0;padding:0;background:#060a0f;font-family:'Courier New',monospace">
  <div style="max-width:520px;margin:40px auto;background:#0d1520;border:1px solid #1a2535;border-radius:8px;overflow:hidden">
    <div style="height:3px;background:linear-gradient(90deg,#00e5ff,${accentColor},#ffd700)"></div>
    <div style="padding:40px 36px">
      <div style="font-size:22px;font-weight:900;letter-spacing:0.3em;color:#00e5ff;margin-bottom:6px">PSYCHOMETRIKS</div>
      <div style="font-size:10px;color:#546e7a;letter-spacing:0.2em;margin-bottom:32px">PSY EXCHANGE — REVISIÓN DE TOKEN</div>
      <div style="font-size:32px;margin-bottom:12px">${emoji}</div>
      <div style="font-size:20px;font-weight:900;color:${accentColor};letter-spacing:0.1em;margin-bottom:20px">${headline.toUpperCase()}</div>
      <p style="color:#8090a0;font-size:13px;line-height:1.7;margin-bottom:20px">${body}</p>
      ${adminNotes ? `
      <div style="background:#0a1018;border-left:3px solid ${accentColor};padding:14px 18px;border-radius:4px;margin-bottom:24px">
        <div style="font-size:10px;color:#546e7a;letter-spacing:0.15em;margin-bottom:6px">NOTA DEL EQUIPO</div>
        <p style="color:#e0f0ff;font-size:13px;line-height:1.6;margin:0">${adminNotes}</p>
      </div>` : ""}
      <a href="https://psychometriks.trade/exchange" style="display:inline-block;background:${accentColor};color:#060a0f;font-size:13px;font-weight:900;letter-spacing:0.15em;padding:14px 32px;text-decoration:none;border-radius:4px">
        ⬡ VER PSY EXCHANGE
      </a>
      <p style="color:#2a3a4a;font-size:10px;margin-top:28px;line-height:1.6">
        Para consultas escribí a <a href="mailto:soporte@psychometriks.trade" style="color:#00e5ff">soporte@psychometriks.trade</a>
      </p>
    </div>
    <div style="padding:16px 36px;background:#0a1018;border-top:1px solid #1a2535;font-size:10px;color:#2a3a4a;text-align:center">
      © ${new Date().getFullYear()} PSYCHOMETRIKS · psychometriks.trade
    </div>
  </div>
</body></html>`;
}

export function adminReplyHtml(username: string, adminMsg: string): string {
  const link = `${BASE_URL}/exchange`;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Respuesta de soporte PSYCHOMETRIKS</title></head>
<body style="margin:0;padding:0;background:#060a0f;font-family:'Courier New',monospace">
  <div style="max-width:520px;margin:40px auto;background:#0d1520;border:1px solid #1a2535;border-radius:8px;overflow:hidden">
    <div style="height:3px;background:linear-gradient(90deg,#00e5ff,#00e676,#ffd700,#e040fb)"></div>
    <div style="padding:40px 36px">
      <div style="font-size:22px;font-weight:900;letter-spacing:0.3em;color:#00e5ff;margin-bottom:6px">PSYCHOMETRIKS</div>
      <div style="font-size:10px;color:#546e7a;letter-spacing:0.2em;margin-bottom:32px">MENSAJE DE SOPORTE</div>
      <p style="color:#8090a0;font-size:13px;line-height:1.7;margin-bottom:8px">Hola <strong style="color:#fff">${username}</strong>,</p>
      <p style="color:#8090a0;font-size:13px;line-height:1.7;margin-bottom:20px">Recibiste una respuesta del equipo PSYCHOMETRIKS:</p>
      <div style="background:#0a1018;border-left:3px solid #00e5ff;padding:16px 20px;border-radius:4px;margin-bottom:28px">
        <p style="color:#e0f0ff;font-size:14px;line-height:1.7;margin:0">${adminMsg}</p>
      </div>
      <a href="${link}" style="display:inline-block;background:#00e5ff;color:#060a0f;font-size:13px;font-weight:900;letter-spacing:0.15em;padding:14px 32px;text-decoration:none;border-radius:4px">
        ⬡ VER EN LA PLATAFORMA
      </a>
    </div>
    <div style="padding:16px 36px;background:#0a1018;border-top:1px solid #1a2535;font-size:10px;color:#2a3a4a;text-align:center">
      © ${new Date().getFullYear()} PSYCHOMETRIKS · psychometriks.trade · Solo educativo
    </div>
  </div>
</body></html>`;
}
