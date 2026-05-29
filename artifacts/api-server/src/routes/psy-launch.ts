import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS psy_launch_tokens (
      id               SERIAL PRIMARY KEY,
      mode             VARCHAR(20)     NOT NULL DEFAULT 'anon',
      token_name       VARCHAR(50)     NOT NULL,
      ticker           VARCHAR(10)     NOT NULL,
      description      TEXT            NOT NULL,
      image_url        TEXT,
      company_name     VARCHAR(200),
      company_website  VARCHAR(500),
      company_twitter  VARCHAR(200),
      contract_address VARCHAR(100),
      curve_address    VARCHAR(100),
      creator_wallet   VARCHAR(100),
      tx_hash          VARCHAR(100),
      price            DECIMAL(30,15)  DEFAULT 0,
      market_cap       DECIMAL(20,2)   DEFAULT 0,
      volume_24h       DECIMAL(20,2)   DEFAULT 0,
      bnb_raised       DECIMAL(20,8)   DEFAULT 0,
      holders_count    INTEGER         DEFAULT 0,
      total_supply     BIGINT          DEFAULT 1000000000,
      creator_allocation DECIMAL(5,2)  DEFAULT 5.0,
      status           VARCHAR(20)     DEFAULT 'active',
      graduated_at     TIMESTAMP,
      pancakeswap_url  TEXT,
      created_at       TIMESTAMP       DEFAULT NOW(),
      created_by       VARCHAR(100)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS psy_launch_trades (
      id             SERIAL PRIMARY KEY,
      token_id       INTEGER        REFERENCES psy_launch_tokens(id) ON DELETE CASCADE,
      wallet         VARCHAR(100)   NOT NULL,
      type           VARCHAR(10)    NOT NULL,
      amount_tokens  BIGINT         NOT NULL,
      amount_bnb     DECIMAL(20,8)  NOT NULL,
      price          DECIMAL(30,15) NOT NULL,
      fee_bnb        DECIMAL(20,8)  DEFAULT 0,
      tx_hash        VARCHAR(100),
      created_at     TIMESTAMP      DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS psy_launch_price_history (
      id         SERIAL PRIMARY KEY,
      token_id   INTEGER        REFERENCES psy_launch_tokens(id) ON DELETE CASCADE,
      price      DECIMAL(30,15) NOT NULL,
      market_cap DECIMAL(20,2)  NOT NULL,
      volume     DECIMAL(20,8)  NOT NULL DEFAULT 0,
      created_at TIMESTAMP      DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_psy_launch_trades_token ON psy_launch_trades(token_id);
    CREATE INDEX IF NOT EXISTS idx_psy_launch_tokens_status ON psy_launch_tokens(status);
    CREATE INDEX IF NOT EXISTS idx_psy_launch_price_history_token ON psy_launch_price_history(token_id, created_at DESC);
  `);
}

async function migrateColumns() {
  await pool.query(`ALTER TABLE psy_launch_tokens ADD COLUMN IF NOT EXISTS curve_address VARCHAR(100)`);
  await pool.query(`ALTER TABLE psy_launch_tokens ADD COLUMN IF NOT EXISTS tx_hash VARCHAR(100)`);
}

ensureTables()
  .then(() => migrateColumns())
  .catch(err => console.error("psy-launch ensureTables:", err));

// ── GET /api/psy-launch/tokens ─────────────────────────────────────────────
router.get("/psy-launch/tokens", async (req, res) => {
  const { status, mode } = req.query as { status?: string; mode?: string };
  try {
    let q = `
      SELECT id, mode, token_name, ticker, description, image_url,
             company_name, company_website, company_twitter,
             contract_address, curve_address, price, market_cap, volume_24h,
             bnb_raised, holders_count, total_supply, status,
             graduated_at, pancakeswap_url, created_at
      FROM psy_launch_tokens`;
    const params: string[] = [];
    const conds: string[] = [];
    if (status && status !== "all") {
      params.push(status);
      conds.push(`status = $${params.length}`);
    }
    if (mode) {
      params.push(mode);
      conds.push(`mode = $${params.length}`);
    }
    if (conds.length) q += " WHERE " + conds.join(" AND ");
    q += " ORDER BY CASE WHEN status='active' THEN 0 ELSE 1 END, market_cap DESC, created_at DESC";
    const rows = await pool.query(q, params);
    res.json({ items: rows.rows });
  } catch (err) {
    req.log.error({ err }, "psy-launch/tokens list error");
    res.status(500).json({ error: "Error al obtener tokens" });
  }
});

// ── GET /api/psy-launch/tokens/:id ────────────────────────────────────────
router.get("/psy-launch/tokens/:id", async (req, res) => {
  try {
    const row = await pool.query(`SELECT * FROM psy_launch_tokens WHERE id = $1`, [req.params.id]);
    if (!row.rows[0]) { res.status(404).json({ error: "Token no encontrado" }); return; }
    res.json(row.rows[0]);
  } catch (err) {
    req.log.error({ err }, "psy-launch/token get error");
    res.status(500).json({ error: "Error al obtener token" });
  }
});

// ── POST /api/psy-launch/tokens ───────────────────────────────────────────
router.post("/psy-launch/tokens", async (req, res) => {
  const {
    mode, token_name, ticker, description, image_url,
    company_name, company_website, company_twitter,
    creator_wallet, created_by, contract_address, curve_address, tx_hash,
  } = req.body as {
    mode?: string; token_name?: string; ticker?: string;
    description?: string; image_url?: string;
    company_name?: string; company_website?: string; company_twitter?: string;
    creator_wallet?: string; created_by?: string;
    contract_address?: string; curve_address?: string; tx_hash?: string;
  };

  if (!mode || !["verified", "anon"].includes(mode)) {
    res.status(400).json({ error: "Modo inválido. Debe ser 'verified' o 'anon'" });
    return;
  }
  const tname = (token_name ?? "").trim();
  if (!tname || tname.length < 3 || tname.length > 20) {
    res.status(400).json({ error: "Nombre del token: 3 a 20 caracteres" });
    return;
  }
  const tk = (ticker ?? "").trim().toUpperCase();
  if (!tk || !/^[A-Z]{2,5}$/.test(tk)) {
    res.status(400).json({ error: "Ticker: 2-5 letras mayúsculas (sin números ni símbolos)" });
    return;
  }
  const desc = (description ?? "").trim();
  const minDesc = mode === "verified" ? 100 : 50;
  if (!desc || desc.length < minDesc) {
    res.status(400).json({ error: `Descripción mínima: ${minDesc} caracteres` });
    return;
  }
  if (mode === "verified") {
    if (!(company_name ?? "").trim()) {
      res.status(400).json({ error: "Nombre de empresa requerido en modo VERIFICADO" });
      return;
    }
    const web = (company_website ?? "").trim();
    if (!web || !/^https?:\/\/.+\..+/.test(web)) {
      res.status(400).json({ error: "Website válido requerido (ej: https://tuempresa.com)" });
      return;
    }
    if (!(company_twitter ?? "").trim()) {
      res.status(400).json({ error: "Twitter/X requerido en modo VERIFICADO" });
      return;
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO psy_launch_tokens
         (mode, token_name, ticker, description, image_url,
          company_name, company_website, company_twitter,
          creator_wallet, created_by, creator_allocation,
          contract_address, curve_address, tx_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id, created_at`,
      [
        mode, tname, tk, desc, image_url || null,
        (company_name || "").trim() || null,
        (company_website || "").trim() || null,
        (company_twitter || "").trim() || null,
        (creator_wallet || "").trim() || null,
        created_by || null,
        mode === "verified" ? 5.0 : 15.0,
        (contract_address || "").trim() || null,
        (curve_address || "").trim() || null,
        (tx_hash || "").trim() || null,
      ]
    );
    const row = result.rows[0] as { id: number; created_at: string };
    req.log.info({ id: row.id, mode, ticker: tk }, "psy-launch: token created");
    res.json({ ok: true, id: row.id, createdAt: row.created_at });
  } catch (err) {
    req.log.error({ err }, "psy-launch/tokens create error");
    res.status(500).json({ error: "Error al crear token" });
  }
});

// ── POST /api/psy-launch/trades ───────────────────────────────────────────
router.post("/psy-launch/trades", async (req, res) => {
  const { token_id, wallet, type, amount_tokens, amount_bnb, price, fee_bnb, tx_hash } = req.body as {
    token_id?: number; wallet?: string; type?: string;
    amount_tokens?: number; amount_bnb?: number; price?: number;
    fee_bnb?: number; tx_hash?: string;
  };
  if (!token_id || !wallet || !type || !amount_tokens || !amount_bnb || !price) {
    res.status(400).json({ error: "Faltan campos obligatorios" });
    return;
  }
  if (!["buy", "sell"].includes(type)) {
    res.status(400).json({ error: "type debe ser 'buy' o 'sell'" });
    return;
  }
  try {
    await pool.query(
      `INSERT INTO psy_launch_trades
         (token_id, wallet, type, amount_tokens, amount_bnb, price, fee_bnb, tx_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [token_id, wallet, type, amount_tokens, amount_bnb, price, fee_bnb ?? 0, tx_hash ?? null]
    );
    const updated = await pool.query(
      `UPDATE psy_launch_tokens
       SET bnb_raised    = bnb_raised + $1,
           volume_24h    = volume_24h + $2,
           price         = $3,
           market_cap    = $3 * total_supply,
           holders_count = (
             SELECT COUNT(DISTINCT wallet) FROM psy_launch_trades WHERE token_id = $4
           )
       WHERE id = $4
       RETURNING price, market_cap, volume_24h`,
      [type === "buy" ? amount_bnb : 0, amount_bnb, price, token_id]
    );
    const row = updated.rows[0] as { price: string; market_cap: string; volume_24h: string } | undefined;
    if (row) {
      await pool.query(
        `INSERT INTO psy_launch_price_history (token_id, price, market_cap, volume) VALUES ($1,$2,$3,$4)`,
        [token_id, row.price, row.market_cap, row.volume_24h]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "psy-launch/trades error");
    res.status(500).json({ error: "Error al registrar trade" });
  }
});

// ── GET /api/psy-launch/tokens/:id/trades ─────────────────────────────────
router.get("/psy-launch/tokens/:id/trades", async (req, res) => {
  try {
    const rows = await pool.query(
      `SELECT id, wallet, type, amount_tokens, amount_bnb, price, fee_bnb, tx_hash, created_at
       FROM psy_launch_trades WHERE token_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [req.params.id]
    );
    res.json({ items: rows.rows });
  } catch (err) {
    req.log.error({ err }, "psy-launch/trades list error");
    res.status(500).json({ error: "Error al obtener trades" });
  }
});

// ── GET /api/psy-launch/tokens/:id/holders ────────────────────────────────
router.get("/psy-launch/tokens/:id/holders", async (req, res) => {
  try {
    const rows = await pool.query(
      `SELECT
         wallet,
         SUM(CASE WHEN type='buy' THEN amount_tokens ELSE -amount_tokens END) AS balance,
         SUM(CASE WHEN type='buy' THEN amount_bnb    ELSE 0              END) AS total_invested,
         COUNT(*) AS trade_count
       FROM psy_launch_trades
       WHERE token_id = $1
       GROUP BY wallet
       HAVING SUM(CASE WHEN type='buy' THEN amount_tokens ELSE -amount_tokens END) > 0
       ORDER BY balance DESC
       LIMIT 50`,
      [req.params.id]
    );
    const token = await pool.query(
      `SELECT total_supply, price FROM psy_launch_tokens WHERE id = $1`,
      [req.params.id]
    );
    const supply = parseInt(token.rows[0]?.total_supply ?? "1000000000");
    const price  = parseFloat(token.rows[0]?.price ?? "0");

    type HRow = { wallet: string; balance: string; total_invested: string; trade_count: string };
    const holders = rows.rows.map((h: HRow, i: number) => {
      const balance   = parseInt(h.balance);
      const invested  = parseFloat(h.total_invested);
      const avgEntry  = balance > 0 ? invested / balance : 0;
      const curValue  = balance * price;
      const pnl       = curValue - invested;
      const pnlPct    = invested > 0 ? (pnl / invested) * 100 : 0;
      return {
        rank:          i + 1,
        wallet:        h.wallet,
        balance,
        pct_supply:    ((balance / supply) * 100).toFixed(2),
        avg_entry:     avgEntry.toFixed(10),
        current_value: curValue.toFixed(4),
        pnl:           pnl.toFixed(4),
        pnl_pct:       pnlPct.toFixed(2),
        trade_count:   parseInt(h.trade_count),
      };
    });
    res.json({ items: holders });
  } catch (err) {
    req.log.error({ err }, "psy-launch/holders error");
    res.status(500).json({ error: "Error al obtener holders" });
  }
});

// ── GET /api/psy-launch/tokens/:id/chart ──────────────────────────────────
router.get("/psy-launch/tokens/:id/chart", async (req, res) => {
  try {
    const rows = await pool.query(
      `SELECT price, market_cap, volume, created_at
       FROM psy_launch_price_history
       WHERE token_id = $1
       ORDER BY created_at ASC
       LIMIT 200`,
      [req.params.id]
    );
    res.json({ points: rows.rows });
  } catch (err) {
    req.log.error({ err }, "psy-launch/chart error");
    res.status(500).json({ error: "Error al obtener chart" });
  }
});

// ── GET /api/psy-launch/trending ──────────────────────────────────────────
router.get("/psy-launch/trending", async (req, res) => {
  try {
    const rows = await pool.query(`
      SELECT id, mode, token_name, ticker, description, image_url,
             company_name, contract_address, curve_address,
             price, market_cap, volume_24h, bnb_raised,
             holders_count, total_supply, status, created_at
      FROM psy_launch_tokens
      WHERE status = 'active'
      ORDER BY volume_24h DESC, market_cap DESC
      LIMIT 3
    `);
    res.json({ items: rows.rows });
  } catch (err) {
    req.log.error({ err }, "psy-launch/trending error");
    res.status(500).json({ error: "Error al obtener trending" });
  }
});

// ── PATCH /api/psy-launch/tokens/:id/graduate ─────────────────────────────
router.patch("/psy-launch/tokens/:id/graduate", async (req, res) => {
  const { pancakeswap_url } = req.body as { pancakeswap_url?: string };
  try {
    await pool.query(
      `UPDATE psy_launch_tokens
       SET status = 'graduated', graduated_at = NOW(), pancakeswap_url = $1
       WHERE id = $2`,
      [pancakeswap_url ?? null, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "psy-launch/graduate error");
    res.status(500).json({ error: "Error al graduar token" });
  }
});

export default router;
