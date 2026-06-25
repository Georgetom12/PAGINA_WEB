import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { sendEmail, submissionStatusHtml } from "../lib/email";

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
    // Fetch submission details before updating (need email + token info)
    const { rows: before } = await pool.query<{
      email: string; token_name: string; symbol: string; status: string;
    }>(
      `SELECT email, token_name, symbol, status FROM psy_exchange_submissions WHERE id = $1`,
      [id]
    );
    const sub = before[0];

    await pool.query(
      `UPDATE psy_exchange_submissions
       SET status = $1, admin_notes = $2
       WHERE id = $3`,
      [status, admin_notes ?? null, id]
    );

    // Send email only when status actually changes to approved/rejected
    if (sub && sub.email && sub.status !== status && (status === "approved" || status === "rejected")) {
      const subject = status === "approved"
        ? `✅ ${sub.token_name} (${sub.symbol}) aprobado en PSY Exchange`
        : `❌ Solicitud de ${sub.token_name} (${sub.symbol}) — no aprobada`;
      const html = submissionStatusHtml(sub.token_name, sub.symbol, status, admin_notes ?? undefined);
      sendEmail(sub.email, subject, html).catch(() => {}); // fire-and-forget
    }

    res.json({ ok: true, emailSent: !!(sub?.email && sub.status !== status && status !== "pending") });
  } catch (err) {
    req.log.error({ err }, "exchange/patch error");
    res.status(500).json({ error: "Error al actualizar" });
  }
});

// ── 0x API v2 — chain IDs ─────────────────────────────────────────────────────
const ZEROX_CHAIN_ID: Record<string, string> = {
  eth: "1",
  bsc: "56",
  base: "8453",
  arbitrum: "42161",
  polygon: "137",
  optimism: "10",
  avalanche: "43114",
};
const ZEROX_BASE = "https://api.0x.org";

// GET /api/exchange/zerox/quote — 0x Permit2 quote (v2)
// ?sellToken=0x...&buyToken=0x...&sellAmount=...&taker=0x...&chain=eth
router.get("/exchange/zerox/quote", async (req: Request, res: Response) => {
  const apiKey = process.env.ZEROX_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "0x API key no configurada", keyMissing: true });
    return;
  }
  const { sellToken, buyToken, sellAmount, taker, chain = "eth" } = req.query as Record<string, string>;
  if (!sellToken || !buyToken || !sellAmount) {
    res.status(400).json({ error: "Faltan parámetros: sellToken, buyToken, sellAmount" });
    return;
  }
  const chainId = ZEROX_CHAIN_ID[chain] ?? "1";
  const feeWallet = chain === "bsc"
    ? (process.env["PSY_FEE_WALLET_BNB"] ?? process.env["PSY_FEE_WALLET"])
    : process.env["PSY_FEE_WALLET"];
  if (!feeWallet) {
    res.status(503).json({ error: "Fee wallet no configurada en el servidor" });
    return;
  }
  try {
    const params = new URLSearchParams({
      chainId,
      sellToken,
      buyToken,
      sellAmount,
      swapFeeRecipient: feeWallet,
      swapFeeBps: "50",        // 0.5%
      swapFeeToken: buyToken,  // fee charged in the output token
      ...(taker ? { taker } : {}),
    });
    const r = await fetch(`${ZEROX_BASE}/swap/permit2/quote?${params.toString()}`, {
      headers: { "0x-api-key": apiKey, "0x-version": "v2" },
    });
    const data = await r.json() as unknown;
    res.status(r.status).json(data);
  } catch (err) {
    req.log.error({ err }, "zerox/quote error");
    res.status(502).json({ error: "Error conectando con 0x API" });
  }
});

// GET /api/exchange/zerox/price — 0x price (indicative, no taker needed)
router.get("/exchange/zerox/price", async (req: Request, res: Response) => {
  const apiKey = process.env.ZEROX_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "0x API key no configurada", keyMissing: true });
    return;
  }
  const { sellToken, buyToken, sellAmount, chain = "eth" } = req.query as Record<string, string>;
  if (!sellToken || !buyToken || !sellAmount) {
    res.status(400).json({ error: "Faltan parámetros" });
    return;
  }
  const chainId = ZEROX_CHAIN_ID[chain] ?? "1";
  try {
    const params = new URLSearchParams({ chainId, sellToken, buyToken, sellAmount });
    const r = await fetch(`${ZEROX_BASE}/swap/permit2/price?${params.toString()}`, {
      headers: { "0x-api-key": apiKey, "0x-version": "v2" },
    });
    const data = await r.json() as unknown;
    res.status(r.status).json(data);
  } catch (err) {
    req.log.error({ err }, "zerox/price error");
    res.status(502).json({ error: "Error conectando con 0x API" });
  }
});

// GET /api/exchange/jupiter/quote — proxy to Jupiter v6 (Solana, no API key needed)
// ?inputMint=So11...&outputMint=EPjF...&amount=1000000&slippageBps=50
router.get("/exchange/jupiter/quote", async (req: Request, res: Response) => {
  const { inputMint, outputMint, amount, slippageBps = "50" } = req.query as Record<string, string>;
  if (!inputMint || !outputMint || !amount) {
    res.status(400).json({ error: "Faltan parámetros: inputMint, outputMint, amount" });
    return;
  }
  try {
    const params = new URLSearchParams({ inputMint, outputMint, amount, slippageBps });
    const r = await fetch(`https://quote-api.jup.ag/v6/quote?${params.toString()}`, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    const data = await r.json() as unknown;
    res.status(r.ok ? 200 : r.status).json(data);
  } catch (err) {
    req.log.error({ err }, "jupiter/quote error");
    res.status(502).json({ error: "Error conectando con Jupiter API" });
  }
});

export default router;
