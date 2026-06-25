import { Router, Request, Response } from "express";

const router = Router();

const GEMINI_KEY = process.env["GEMINI_API_KEY"];
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

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
  if (!GEMINI_KEY) {
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
    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 150,
          topP: 0.9,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      }),
    });

    if (!geminiRes.ok) {
      req.log.error({ status: geminiRes.status }, "Gemini error in test-interpret");
      res.status(502).json({ error: "AI unavailable" });
      return;
    }

    const data = (await geminiRes.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      res.status(502).json({ error: "No AI response" });
      return;
    }

    res.json({ interpretation: text });
  } catch (err) {
    req.log.error({ err }, "test-interpret error");
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
