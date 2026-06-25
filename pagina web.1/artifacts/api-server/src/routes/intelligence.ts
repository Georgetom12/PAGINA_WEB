import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

const CLAUDE_MODEL = "claude-opus-4-5";

async function safeFetch(url: string, headers?: Record<string, string>) {
  const r = await fetch(url, {
    headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0", ...headers },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// ─── OKX Funding Rate ────────────────────────────────────────────────────────
router.get("/proxy/okx/funding", async (req: Request, res: Response) => {
  try {
    const { instId = "BTC-USDT-SWAP" } = req.query as Record<string, string>;
    const data = await safeFetch(
      `https://www.okx.com/api/v5/public/funding-rate?instId=${instId}`
    );
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "okx funding error");
    res.status(502).json({ error: "Proxy fetch failed" });
  }
});

// ─── OKX Long/Short Ratio ────────────────────────────────────────────────────
router.get("/proxy/okx/ls-ratio", async (req: Request, res: Response) => {
  try {
    const { ccy = "BTC", period = "1D", limit = "30" } = req.query as Record<string, string>;
    const data = await safeFetch(
      `https://www.okx.com/api/v5/rubik/stat/contracts/long-short-account-ratio?ccy=${ccy}&period=${period}&limit=${limit}`
    );
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "okx ls-ratio error");
    res.status(502).json({ error: "Proxy fetch failed" });
  }
});

// ─── Fear & Greed (alternative.me) ──────────────────────────────────────────
router.get("/proxy/fear-greed", async (req: Request, res: Response) => {
  try {
    const { limit = "7" } = req.query as Record<string, string>;
    const data = await safeFetch(
      `https://api.alternative.me/fng/?limit=${limit}&format=json`
    );
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "fear-greed error");
    res.status(502).json({ error: "Proxy fetch failed" });
  }
});

// ─── PSY Intelligence Narrative (Claude) ─────────────────────────────────────
router.post("/intelligence/narrative", async (req: Request, res: Response) => {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) {
    res.status(503).json({ error: "Anthropic API key not configured" });
    return;
  }

  const {
    fearGreed, fearGreedLabel,
    btcPrice, btcChange24h,
    fundingRate,
    openInterest,
    lsRatio,
  } = req.body as {
    fearGreed: number;
    fearGreedLabel: string;
    btcPrice: number;
    btcChange24h: number;
    fundingRate: number;
    openInterest: number;
    lsRatio: number;
  };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const prompt = `Sos PSY-INTELLIGENCE — el analista macro de PSYCHOMETRIKS. Analizá el estado actual del mercado crypto con estos datos en tiempo real:

═══ DATOS DE MERCADO ═══
• Fear & Greed Index: ${fearGreed}/100 — ${fearGreedLabel}
• BTC Precio: $${btcPrice.toLocaleString("en-US")}
• BTC Cambio 24h: ${btcChange24h > 0 ? "+" : ""}${btcChange24h.toFixed(2)}%
• Funding Rate BTC: ${fundingRate > 0 ? "+" : ""}${(fundingRate * 100).toFixed(4)}%
• Open Interest BTC: ${openInterest > 0 ? "$" + (openInterest / 1e9).toFixed(2) + "B" : "No disponible"}
• Ratio L/S: ${lsRatio > 0 ? lsRatio.toFixed(2) : "No disponible"} (>1 = más longs, <1 = más shorts)

═══ TU ANÁLISIS ═══
Generá un análisis de mercado en español latinoamericano, directo y preciso. Máximo 220 palabras. Estructura:

**ESTADO ACTUAL:** Una oración contundente del estado del mercado.

**LO QUE DICEN LOS DATOS:** Interpretación cruzada de funding + F&G + L/S + OI. Qué coincide, qué diverge.

**ZONA DE ATENCIÓN:** Qué vigilar en las próximas 24-48 horas.

**SESGO INSTITUCIONAL:** Alcista / Bajista / Neutral con justificación de una línea.

Sin introducción, sin conclusión genérica. Datos → Interpretación → Acción.`;

  try {
    const client = new Anthropic({ apiKey });
    const stream = client.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "intelligence narrative error");
    if (!res.headersSent) {
      res.status(500).json({ error: "Error generando análisis" });
    } else {
      res.write(`data: ${JSON.stringify({ error: true })}\n\n`);
      res.end();
    }
  }
});

export default router;
