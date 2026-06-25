import { Router, Request, Response } from "express";

const router = Router();

const ANTHROPIC_KEY = process.env["ANTHROPIC_API_KEY"];

// POST /api/psy-brain/analyze — SSE streaming con Claude
router.post("/psy-brain/analyze", async (req: Request, res: Response) => {
  const { prompt } = req.body as { prompt?: string };

  if (!prompt) {
    res.status(400).json({ ok: false, error: "Missing prompt" });
    return;
  }

  if (!ANTHROPIC_KEY) {
    res.status(500).json({ ok: false, error: "ANTHROPIC_API_KEY not configured" });
    return;
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const send = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "messages-2023-12-15",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 1500,
        stream: true,
        system: `Eres PSY BRAIN — el sistema de análisis institucional de PSYCHOMETRIKS. 
Eres un analista cripto de élite con acceso a datos on-chain, flujo de ballenas, liquidaciones y sentiment.
Respondes siempre en español, de forma directa, técnica y precisa.
Usas conceptos de Smart Money (Order Blocks, FVG, CHoCH, BOS, liquidez) y análisis on-chain.
Tus análisis son concisos pero profundos. Máximo 3-4 párrafos.`,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      send({ error: `Anthropic error: ${anthropicRes.status} — ${err}` });
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    const reader = anthropicRes.body?.getReader();
    if (!reader) {
      send({ error: "No stream reader" });
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
            send({ text: parsed.delta.text });
          }
        } catch {}
      }
    }

    send({ done: true });
    res.write("data: [DONE]\n\n");
  } catch (err: unknown) {
    send({ error: (err as Error).message ?? "Unknown error" });
    res.write("data: [DONE]\n\n");
  } finally {
    res.end();
  }
});

// POST /api/psy-chat — también disponible via Anthropic si no hay Gemini
router.post("/psy-brain/chat", async (req: Request, res: Response) => {
  const { message } = req.body as { message?: string };
  if (!message) { res.status(400).json({ ok: false, error: "Missing message" }); return; }
  if (!ANTHROPIC_KEY) { res.status(500).json({ ok: false, error: "No API key" }); return; }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 800,
        system: "Eres PSY, asistente de trading de PSYCHOMETRIKS. Responde en español, directo y técnico.",
        messages: [{ role: "user", content: message }],
      }),
    });
    const d = await r.json() as { content?: Array<{text?: string}> };
    const reply = d.content?.[0]?.text ?? "Sin respuesta";
    res.json({ ok: true, reply });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
