import { Router, type Request, type Response } from "express";
import { db, certificates } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router = Router();

function certLevel(score: number): string {
  if (score >= 95) return "elite";
  if (score >= 90) return "trader";
  if (score >= 80) return "analista";
  return "fundamentos";
}

// ── POST /api/certificates ─────────────────────────────────────────────────
router.post("/certificates", async (req: Request, res: Response) => {
  const { studentName, courseName, score } = req.body as {
    studentName?: string;
    courseName?: string;
    score?: number;
  };

  if (!studentName || !courseName || score === undefined) {
    res.status(400).json({ error: "studentName, courseName y score son requeridos" });
    return;
  }
  if (score < 70 || score > 100) {
    res.status(400).json({ error: "Score debe estar entre 70 y 100 (mínimo para aprobar)" });
    return;
  }

  try {
    const [{ total }] = await db.select({ total: count() }).from(certificates);
    const year = new Date().getFullYear();
    const seq  = String(Number(total) + 1).padStart(4, "0");
    const certCode = `PSY-${year}-${seq}`;
    const level    = certLevel(score);

    const [cert] = await db.insert(certificates).values({
      certCode,
      studentName: studentName.trim(),
      courseName:  courseName.trim(),
      level,
      score,
    }).returning();

    req.log.info({ certCode, level, score }, "certificate issued");
    res.json({ ok: true, cert });
  } catch (err) {
    req.log.error({ err }, "certificate create error");
    res.status(500).json({ error: "Error al generar certificado" });
  }
});

// ── GET /api/certificates/:certCode ───────────────────────────────────────
router.get("/certificates/:certCode", async (req: Request, res: Response) => {
  const { certCode } = req.params as { certCode: string };
  try {
    const [cert] = await db.select().from(certificates).where(eq(certificates.certCode, certCode)).limit(1);
    if (!cert) {
      res.status(404).json({ ok: false, error: "Certificado no encontrado" });
      return;
    }
    res.json({ ok: true, cert });
  } catch (err) {
    req.log.error({ err }, "certificate fetch error");
    res.status(500).json({ error: "Error al verificar certificado" });
  }
});

export default router;
