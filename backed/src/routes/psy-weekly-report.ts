import { Router, Request, Response } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

interface AutopsyRecord {
  id: string;
  date: string;
  pair: string;
  direction: string;
  entry: string;
  result: string;
  analysis: string;
  errorType?: string;
}

interface WeeklyReportRequest {
  records: AutopsyRecord[];
  userName?: string;
}

router.post("/api/psy-weekly-report", async (req: Request, res: Response) => {
  const { records, userName } = req.body as WeeklyReportRequest;

  if (!records || records.length === 0) {
    res.status(400).json({ error: "No hay autopsias para analizar" });
    return;
  }

  const tradesSummary = records
    .slice(0, 20)
    .map((r, i) => `
Trade ${i + 1} — ${r.date}
- Par: ${r.pair} | Dirección: ${r.direction} | Entrada: $${r.entry}
- Resultado: ${r.result || "Pérdida"}
- Análisis PSY: ${r.analysis.slice(0, 400)}...`)
    .join("\n");

  const prompt = `Sos PSY-WEEKLY — el sistema de reporte semanal de PSYCHOMETRIKS. Analizás el historial de trades del usuario y generás un reporte profundo de sus patrones de error.

Usuario: ${userName || "Trader"}
Período: última semana
Total de autopsias: ${records.length}

HISTORIAL DE TRADES ANALIZADOS:
${tradesSummary}

Generá un REPORTE SEMANAL completo con exactamente esta estructura:

📅 **REPORTE PSY — SEMANA ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📊 RESUMEN DE LA SEMANA**
[Número de trades analizados, balance emocional general, tendencia de la semana]

**🔴 TUS 3 ERRORES PRINCIPALES**
[Lista los 3 errores más repetidos con número de ocurrencias y descripción]

**🧠 PATRÓN PSICOLÓGICO DOMINANTE**
[El sesgo cognitivo o error mental que más aparece: FOMO, revenge trading, no SL, etc.]

**⏰ TU PEOR SESIÓN DE TRADING**
[La hora o sesión del mercado donde más perdés: Londres, NY, Asia, etc. — basado en los datos]

**📈 TU FASE WYCKOFF TRAMPA**
[La fase donde más te atrapan: UTAD, Spring falso, ST, etc.]

**✅ PLAN DE MEJORA — PRÓXIMA SEMANA**
[3 acciones concretas y específicas para mejorar. Sin genéricos — acciones reales y medibles]

**💀 SENTENCIA SEMANAL**
[Una frase brutal y honesta que resume tu semana como trader]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Reporte generado por PSY-WEEKLY · PSYCHOMETRIKS*

Sé específico con los patrones que ves en los datos reales. Si todos los trades fallaron en UTAD, decilo. Si siempre entra sin SL, decilo. La honestidad es lo que mejora traders.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
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
    req.log.error({ err }, "psy-weekly-report error");
    if (!res.headersSent) {
      res.status(500).json({ error: "Error interno" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Error interno" })}\n\n`);
      res.end();
    }
  }
});

export default router;
