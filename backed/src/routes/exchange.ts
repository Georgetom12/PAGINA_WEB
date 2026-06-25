import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

router.post("/exchange/submit", async (req, res) => {
  const { name, symbol, website, whitepaper, contract, chain, description, twitter, telegram, hardCap, email, memberUser, memberPlan, scoreBoost } = req.body as {
    name?: string; symbol?: string; website?: string; whitepaper?: string;
    contract?: string; chain?: string; description?: string; twitter?: string;
    telegram?: string; hardCap?: string; email?: string;
    memberUser?: string; memberPlan?: string; scoreBoost?: number;
  };

  if (!name || !symbol || !website || !email) {
    res.status(400).json({ error: "Faltan campos obligatorios: name, symbol, website, email" });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO psy_exchange_submissions
         (token_name, symbol, website, whitepaper, contract, chain, description,
          twitter, telegram, hard_cap, email, member_user, member_plan, score_boost, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pending')
       RETURNING id, submitted_at`,
      [name, symbol, website, whitepaper ?? null, contract ?? null, chain ?? "ETH",
       description ?? null, twitter ?? null, telegram ?? null, hardCap ?? null,
       email, memberUser ?? null, memberPlan ?? null, scoreBoost ?? 0]
    );
    const row = result.rows[0] as { id: number; submitted_at: string };
    res.json({ ok: true, id: row.id, submittedAt: row.submitted_at });
  } catch (err) {
    req.log.error({ err }, "exchange/submit error");
    res.status(500).json({ error: "Error al guardar la solicitud" });
  }
});

router.get("/exchange/submissions", async (req, res) => {
  const { user, status } = req.query as { user?: string; status?: string };
  try {
    let q = `SELECT id, token_name, symbol, website, whitepaper, contract, chain, description,
                    twitter, telegram, hard_cap, email, member_user, member_plan,
                    score_boost, status, admin_notes, submitted_at
             FROM psy_exchange_submissions`;
    const params: string[] = [];
    const conds: string[] = [];
    if (user)   { params.push(user);   conds.push(`member_user = $${params.length}`); }
    if (status && status !== "all") { params.push(status); conds.push(`status = $${params.length}`); }
    if (conds.length) q += " WHERE " + conds.join(" AND ");
    q += " ORDER BY submitted_at DESC";
    const rows = await pool.query(q, params);
    res.json({ items: rows.rows });
  } catch (err) {
    req.log.error({ err }, "exchange/submissions error");
    res.status(500).json({ error: "Error al obtener submissions" });
  }
});

router.patch("/exchange/submissions/:id", async (req, res) => {
  const id = parseInt(req.params["id"] ?? "0");
  const { status, admin_notes } = req.body as { status?: string; admin_notes?: string };

  if (!status || !["pending", "approved", "rejected"].includes(status)) {
    res.status(400).json({ error: "status debe ser: pending, approved, rejected" });
    return;
  }

  try {
    await pool.query(
      `UPDATE psy_exchange_submissions
       SET status = $1, admin_notes = $2
       WHERE id = $3`,
      [status, admin_notes ?? null, id]
    );
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "exchange/patch error");
    res.status(500).json({ error: "Error al actualizar" });
  }
});

export default router;
