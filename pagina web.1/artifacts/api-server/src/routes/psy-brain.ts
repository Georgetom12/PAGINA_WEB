import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

const PSY_BRAIN_SYSTEM = `Eres PSY BRAIN, el sistema de análisis institucional de PSYCHOMETRIKS. Produces análisis de mercado de nivel institucional en español para traders profesionales. Tus análisis son precisos, accionables y siempre con números específicos. Tu estilo combina la profundidad de un analista de Goldman Sachs con la claridad narrativa de un gestor de fondos de alto nivel. Nunca eres genérico — siempre específico con niveles de precio, porcentajes y datos concretos.

Formato de respuesta:
- Usa **SECCIÓN** para headers (negrita markdown)
- Usa → para bullet points clave
- Sé directo y accionable
- Cierra con: "— PSY BRAIN | PSYCHOMETRIKS"`;

interface PsyBrainRequest {
  prompt: string;
}

router.post("/psy-brain/analyze", async (req: Request, res: Response) => {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) {
    res.status(503).json({ error: "API key no configurada" });
    return;
  }

  const { prompt } = req.body as PsyBrainRequest;

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Prompt requerido" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const client = new Anthropic({ apiKey });
    const stream = client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: PSY_BRAIN_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "psy-brain analyze error");
    if (!res.headersSent) {
      res.status(500).json({ error: "Error interno del servidor" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Error interno" })}\n\n`);
      res.end();
    }
  }
});

export default router;
