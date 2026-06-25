import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

const CLAUDE_MODEL = "claude-sonnet-4-5";

const PSY_BRAIN_SYSTEM = `Eres PSY BRAIN, el analista institucional de PSYCHOMETRIKS. Tu especialidad es identificar el flujo institucional real detrás de los movimientos del mercado. Analizas con precisión quirúrgica: flujo de órdenes, actividad de opciones, posicionamiento institucional 13F, correlaciones macro, narrativas dominantes y puntos de compresión técnica.

Tu respuesta debe ser:
- Estructurada con secciones claras usando ═══ como separador
- Con datos concretos y niveles clave específicos
- Conclusiones accionables con bias claro (BULLISH/BEARISH/NEUTRAL)
- Máximo 3 niveles de entrada/stop/objetivo
- Formato terminal: usa ▸ para puntos clave, ⚡ para alertas críticas, 📊 para datos

Respondes siempre en español con terminología técnica institucional. No uses markdown headers (#), usa ═══ SECCIÓN ═══ para separar.`;

interface PsyBrainRequest {
  asset: string;
  analysisType: string;
  userMessage?: string;
}

function buildPrompt(asset: string, analysisType: string, userMsg?: string): string {
  const prompts: Record<string, string> = {
    flujo: `Analiza el flujo institucional de ${asset}: CVD, dark pools, imbalances SMC/FVG, liq maps y señales de acumulación/distribución. Identifica si el smart money está posicionado long o short y en qué niveles clave.`,
    opciones: `Analiza el posicionamiento en opciones de ${asset}: GEX, max pain, P/C ratio, unusual activity, skew de volatilidad y qué implica para el precio spot en los próximos 7-14 días.`,
    macro: `Analiza el contexto macro para ${asset}: correlación con DXY, US10Y, VIX, ciclo de liquidez global, posicionamiento FED, riesgo geopolítico y cómo afecta la tesis de precio actual.`,
    narrativa: `Identifica la narrativa dominante actual de ${asset}: ciclo de mercado, sentimiento institucional, catalizadores próximos, rotación de capital y regime de mercado actual. ¿Qué historia está comprando el mercado?`,
    squeeze: `Evalúa el potencial de short squeeze de ${asset}: short interest actual, borrow rate, días para cubrir, flujo de opciones call OTM y probabilidad de squeeze en los próximos 5-10 días de trading.`,
    full: `Realiza un análisis institucional COMPLETO de ${asset} con 5 secciones: 1) Flujo de Órdenes & CVD, 2) Posicionamiento Opciones, 3) Contexto Macro, 4) Narrativa Dominante, 5) Compresión Técnica & Setup. Proporciona la tesis de alta probabilidad con niveles clave.`,
  };

  return prompts[analysisType] || userMsg || `Analiza ${asset} desde una perspectiva institucional completa con los datos disponibles.`;
}

router.post("/psy-oracle/brain", async (req: Request, res: Response) => {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) {
    res.status(503).json({ error: "API key no configurada" });
    return;
  }

  const { asset, analysisType, userMessage } = req.body as PsyBrainRequest;

  if (!asset) {
    res.status(400).json({ error: "Asset requerido" });
    return;
  }

  const prompt = buildPrompt(asset, analysisType || "full", userMessage);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const client = new Anthropic({ apiKey });
    const stream = client.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: PSY_BRAIN_SYSTEM,
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
    req.log.error({ err }, "psy-oracle brain error");
    if (!res.headersSent) {
      res.status(500).json({ error: "Error interno del servidor" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Error interno" })}\n\n`);
      res.end();
    }
  }
});

export default router;
