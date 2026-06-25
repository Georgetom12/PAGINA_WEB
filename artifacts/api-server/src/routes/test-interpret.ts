import { Router, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import type { HarmCategory, HarmBlockThreshold } from "@google/genai";

const router = Router();

const GEMINI_MODEL = "gemini-2.0-flash";

interface TestInterpretBody {
  testTitle: string;
  testCat: string;
  correct: number;
  total: number;
  wrongTopics: string[];
  rightTopics: string[];
  streak: number;
}

router.post("/test-interpret", async (req: Request, res: Response) => {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    res.status(503).json({ error: "Gemini not configured" });
    return;
  }

  const { testTitle, testCat, correct, total, wrongTopics, rightTopics, streak } =
    req.body as TestInterpretBody;

  if (typeof correct !== "number" || typeof total !== "number") {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const pct = Math.round((correct / total) * 100);

  const prompt = `Sos PSY — el asistente de psicología del trading de PSYCHOMETRIKS. 
Un trader acaba de completar el "Test del Día: ${testTitle}" (categoría: ${testCat}).

Resultado:
- Puntaje: ${correct}/${total} — ${pct}%
- Racha de días consecutivos: ${streak}
- Respondió CORRECTAMENTE: ${rightTopics.length ? rightTopics.join(", ") : "ninguna"}
- Respondió INCORRECTAMENTE: ${wrongTopics.length ? wrongTopics.join(", ") : "ninguna"}

Escribí una interpretación personalizada en 2-3 oraciones MÁXIMO. 
- Tono: directo, profesional, como un mentor de trading real
- Si el puntaje es alto (>= 75%): felicitalo brevemente y señalá el área débil si hay alguna
- Si el puntaje es bajo (< 50%): sé honesto pero constructivo, señalá qué debe reforzar
- Si fue perfecto (100%): reconocelo con fuerza pero señalá que hay más tests
- Mencioná específicamente el área incorrecta si aplica
- NO uses "¡" ni elogios exagerados
- Terminá siempre con una acción concreta: qué hacer, ver, o practicar
- Respondé SOLO en español, sin asteriscos ni markdown
- Máximo 60 palabras`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.8,
        maxOutputTokens: 150,
        topP: 0.9,
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT"        as HarmCategory, threshold: "BLOCK_NONE" as HarmBlockThreshold },
          { category: "HARM_CATEGORY_HATE_SPEECH"       as HarmCategory, threshold: "BLOCK_NONE" as HarmBlockThreshold },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as HarmCategory, threshold: "BLOCK_NONE" as HarmBlockThreshold },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT" as HarmCategory, threshold: "BLOCK_NONE" as HarmBlockThreshold },
        ],
      },
    });

    const text = response.text?.trim();
    if (!text) {
      res.status(502).json({ error: "No AI response" });
      return;
    }

    res.json({ interpretation: text });
  } catch (err: unknown) {
    req.log.error({ err }, "test-interpret error");
    res.status(502).json({ error: "AI unavailable" });
  }
});

export default router;
