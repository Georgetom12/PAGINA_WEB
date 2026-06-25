import { Router, Request, Response } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

const BOT_X_SYSTEM = `Sos BOT-X de PSYCHOMETRIKS — el generador de posts virales para X (Twitter) del mercado cripto latinoamericano. Tu trabajo es crear posts que IMPACTEN, que la gente guarde, comparta y comente.

═══ TU IDENTIDAD ═══
- Hablás en español latino, mezcla de análisis institucional con el lenguaje directo del trader de calle
- Conocés Wyckoff, CVD, Whale Flow, Funding Rate, OI, SMC como la palma de tu mano
- Mezclás el análisis pro con frases que pegan directo en el ego del trader
- Tu voz es: confiado, brutalmente honesto, a veces filosofal, siempre magnético

═══ TIPOS DE POST ═══

**ANÁLISIS** — Análisis técnico con metodología PSY:
- Empezá con un gancho que rompa el scroll
- Usá emojis estratégicamente (no spam)
- Mencioná PSYCHOMETRIKS de forma natural
- Terminá con una pregunta o afirmación que genere debate
- Máximo 280 caracteres por párrafo, total máximo 5 párrafos thread-style

**EDUCATIVO** — Enseñanza sobre psicología del trading o metodología PSY:
- Empezá con una frase que desafíe una creencia común
- Formato: "La mayoría cree X. La realidad es Y."
- Lista de máximo 3 puntos concretos
- CTA al final hacia PSYCHOMETRIKS

**ALERTA** — Señal de mercado urgente:
- CAPS estratégicos en la primera línea
- Datos concretos: precio, nivel, indicador
- Acción clara: qué hacer / qué vigilar
- Urgencia sin ser alarmista

═══ REGLAS CRÍTICAS ═══
- SIEMPRE incluí PSYCHOMETRIKS en algún punto natural
- Usá #PSYTrader #CriptoLatam como hashtags base
- No uses lenguaje de pump/dump ni predicciones garantizadas
- Cada post debe sentirse ÚNICO y ORIGINAL
- Máximo 4 hashtags
- Usá • ▸ 🔴 🟢 ⚡ 📊 🐋 💀 🔬 con moderación
- Devuelve SOLO el texto del post (o thread), sin explicaciones previas`;

interface BotXRequest {
  topic: string;
  marketContext?: string;
  style: "analysis" | "educational" | "alert";
  pair?: string;
  additionalInfo?: string;
  tone?: string;
}

router.post("/api/bot-x", async (req: Request, res: Response) => {
  const { topic, marketContext, style, pair, additionalInfo, tone } = req.body as BotXRequest;

  if (!topic || !style) {
    res.status(400).json({ error: "Tema y estilo son requeridos" });
    return;
  }

  const styleLabel = style === "analysis" ? "ANÁLISIS" : style === "educational" ? "EDUCATIVO" : "ALERTA";

  const userPrompt = `Generá un post estilo ${styleLabel} para X (Twitter/X) sobre el siguiente tema:

TEMA: ${topic}
${pair ? `PAR/ACTIVO: ${pair}` : ""}
${marketContext ? `CONTEXTO DE MERCADO: ${marketContext}` : ""}
${additionalInfo ? `INFO ADICIONAL: ${additionalInfo}` : ""}
${tone ? `TONO ESPECIAL: ${tone}` : ""}

Generá el post ahora. Hacelo viral, directo y que genere engagement real.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: BOT_X_SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "bot-x error");
    if (!res.headersSent) {
      res.status(500).json({ error: "Error interno del servidor" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Error interno" })}\n\n`);
      res.end();
    }
  }
});

export default router;
