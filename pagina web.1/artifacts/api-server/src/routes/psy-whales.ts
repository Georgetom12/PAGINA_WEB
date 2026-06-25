/**
 * PSY WHALE TRACKER — PSYCHOMETRIKS
 * Seguimiento personalizado de wallets de ballenas conocidas.
 * Consulta transacciones en tiempo real vía Etherscan/BscScan (API keys en env).
 * 
 * Endpoints:
 *   GET  /api/psy-whales/wallets          → listar wallets guardadas
 *   POST /api/psy-whales/wallets          → agregar wallet
 *   DELETE /api/psy-whales/wallets/:id    → eliminar wallet
 *   GET  /api/psy-whales/txs/:address     → txs on-chain de una wallet (Etherscan/BscScan)
 *   GET  /api/psy-whales/portfolio/:address → balances ERC-20 de una wallet
 *   GET  /api/psy-whales/summary          → resumen de actividad reciente de todas las wallets
 */

import { Router, Request, Response } from "express";
import { pool } from "@workspace/db";

const router = Router();

// ── Crear tabla si no existe ──────────────────────────────
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS psy_whale_wallets (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      address     VARCHAR(100) NOT NULL UNIQUE,
      chain       VARCHAR(20)  NOT NULL DEFAULT 'eth',
      tags        TEXT[]       DEFAULT '{}',
      note        TEXT,
      is_active   BOOLEAN      DEFAULT true,
      created_at  TIMESTAMP    DEFAULT NOW()
    )
  `);
}
ensureTable().catch(err => console.error("psy-whales ensureTable:", err));

// ── Helpers de explorer API ───────────────────────────────
function explorerUrl(chain: string): string {
  const map: Record<string, string> = {
    eth:  "https://api.etherscan.io/api",
    bsc:  "https://api.bscscan.com/api",
    arb:  "https://api.arbiscan.io/api",
    poly: "https://api.polygonscan.com/api",
    base: "https://api.basescan.org/api",
    op:   "https://api-optimistic.etherscan.io/api",
  };
  return map[chain] ?? map.eth!;
}

function explorerKey(chain: string): string {
  const keyMap: Record<string, string> = {
    eth:  process.env["ETHERSCAN_API_KEY"] ?? "",
    bsc:  process.env["BSCSCAN_API_KEY"]   ?? process.env["ETHERSCAN_API_KEY"] ?? "",
    arb:  process.env["ARBISCAN_API_KEY"]  ?? process.env["ETHERSCAN_API_KEY"] ?? "",
    poly: process.env["POLYGONSCAN_API_KEY"] ?? process.env["ETHERSCAN_API_KEY"] ?? "",
    base: process.env["BASESCAN_API_KEY"]  ?? process.env["ETHERSCAN_API_KEY"] ?? "",
    op:   process.env["ETHERSCAN_API_KEY"] ?? "",
  };
  return keyMap[chain] ?? "";
}

async function fetchExplorer(chain: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(explorerUrl(chain));
  const apiKey = explorerKey(chain);
  Object.entries({ ...params, apikey: apiKey }).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`Explorer ${chain} HTTP ${r.status}`);
  return r.json();
}

// ── GET /api/psy-whales/wallets ───────────────────────────
router.get("/psy-whales/wallets", async (_req: Request, res: Response) => {
  try {
    const rows = await pool.query(
      `SELECT id, name, address, chain, tags, note, is_active, created_at
       FROM psy_whale_wallets
       WHERE is_active = true
       ORDER BY created_at DESC`
    );
    res.json({ ok: true, wallets: rows.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ── POST /api/psy-whales/wallets ──────────────────────────
router.post("/psy-whales/wallets", async (req: Request, res: Response) => {
  const { name, address, chain, tags, note } = req.body as {
    name?: string; address?: string; chain?: string;
    tags?: string[]; note?: string;
  };
  if (!name?.trim() || !address?.trim()) {
    res.status(400).json({ ok: false, error: "Nombre y dirección son obligatorios" });
    return;
  }
  // Validar formato de dirección (EVM: 0x + 40 hex chars)
  if (!/^0x[0-9a-fA-F]{40}$/.test(address.trim())) {
    res.status(400).json({ ok: false, error: "Dirección EVM inválida (debe ser 0x + 40 hex)" });
    return;
  }
  const validChains = ["eth", "bsc", "arb", "poly", "base", "op"];
  const chainVal = chain && validChains.includes(chain) ? chain : "eth";
  try {
    const row = await pool.query(
      `INSERT INTO psy_whale_wallets (name, address, chain, tags, note)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (address) DO UPDATE SET name=$1, chain=$3, tags=$4, note=$5, is_active=true
       RETURNING id`,
      [name.trim(), address.trim().toLowerCase(), chainVal, tags ?? [], note?.trim() ?? null]
    );
    res.json({ ok: true, id: row.rows[0]?.id });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ── DELETE /api/psy-whales/wallets/:id ───────────────────
router.delete("/psy-whales/wallets/:id", async (req: Request, res: Response) => {
  try {
    await pool.query(
      `UPDATE psy_whale_wallets SET is_active = false WHERE id = $1`,
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ── GET /api/psy-whales/txs/:address ─────────────────────
// Últimas N transacciones normales + ERC-20 transfers de una wallet
router.get("/psy-whales/txs/:address", async (req: Request, res: Response) => {
  const { address } = req.params;
  const chain = (req.query.chain as string) ?? "eth";
  const limit = Math.min(parseInt((req.query.limit as string) ?? "25"), 100);

  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    res.status(400).json({ ok: false, error: "Dirección inválida" });
    return;
  }
  try {
    const [normalData, erc20Data] = await Promise.allSettled([
      fetchExplorer(chain, {
        module: "account", action: "txlist",
        address, startblock: "0", endblock: "99999999",
        page: "1", offset: String(limit), sort: "desc",
      }),
      fetchExplorer(chain, {
        module: "account", action: "tokentx",
        address, startblock: "0", endblock: "99999999",
        page: "1", offset: String(limit), sort: "desc",
      }),
    ]);

    type ExplorerResp = { status: string; result: unknown[] };
    const normal = normalData.status === "fulfilled"
      ? ((normalData.value as ExplorerResp).result ?? []).slice(0, limit)
      : [];
    const erc20 = erc20Data.status === "fulfilled"
      ? ((erc20Data.value as ExplorerResp).result ?? []).slice(0, limit)
      : [];

    res.json({ ok: true, chain, address, normal, erc20 });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  }
});

// ── GET /api/psy-whales/portfolio/:address ────────────────
// Balances ERC-20 (top 20 tokens) de una wallet
router.get("/psy-whales/portfolio/:address", async (req: Request, res: Response) => {
  const { address } = req.params;
  const chain = (req.query.chain as string) ?? "eth";
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    res.status(400).json({ ok: false, error: "Dirección inválida" });
    return;
  }
  try {
    // Balance nativo (ETH/BNB/MATIC)
    const nativeData = await fetchExplorer(chain, {
      module: "account", action: "balance", address, tag: "latest",
    }) as { result?: string };
    const nativeWei = nativeData?.result ?? "0";
    const nativeBalance = parseInt(nativeWei) / 1e18;

    // ERC-20 transfers recientes para inferir tokens en cartera
    const erc20Data = await fetchExplorer(chain, {
      module: "account", action: "tokentx",
      address, page: "1", offset: "100", sort: "desc",
    }) as { result?: Array<{ tokenName: string; tokenSymbol: string; contractAddress: string; tokenDecimal: string; value: string; to: string }> };

    // Agrupar por contrato y calcular balance aproximado
    const tokenMap = new Map<string, { name: string; symbol: string; address: string; balance: number }>();
    for (const tx of (erc20Data.result ?? [])) {
      const key = tx.contractAddress.toLowerCase();
      const decimals = parseInt(tx.tokenDecimal) || 18;
      const value = parseInt(tx.value) / Math.pow(10, decimals);
      const isIncoming = tx.to.toLowerCase() === address.toLowerCase();
      if (!tokenMap.has(key)) {
        tokenMap.set(key, { name: tx.tokenName, symbol: tx.tokenSymbol, address: key, balance: 0 });
      }
      tokenMap.get(key)!.balance += isIncoming ? value : -value;
    }

    const tokens = Array.from(tokenMap.values())
      .filter(t => t.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 20);

    res.json({ ok: true, chain, address, native_balance: nativeBalance, tokens });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  }
});

// ── GET /api/psy-whales/summary ───────────────────────────
// Resumen de actividad reciente de TODAS las wallets guardadas
router.get("/psy-whales/summary", async (_req: Request, res: Response) => {
  try {
    const walletRows = await pool.query(
      `SELECT name, address, chain FROM psy_whale_wallets WHERE is_active = true LIMIT 20`
    );
    const wallets = walletRows.rows as { name: string; address: string; chain: string }[];

    // Consultar últimas 5 txs de cada wallet en paralelo (con límite de concurrencia)
    const results = await Promise.allSettled(
      wallets.map(async w => {
        const data = await fetchExplorer(w.chain, {
          module: "account", action: "tokentx",
          address: w.address, page: "1", offset: "5", sort: "desc",
        }) as { result?: Array<{ tokenName: string; tokenSymbol: string; value: string; tokenDecimal: string; to: string; from: string; timeStamp: string; hash: string }> };
        const txs = (data.result ?? []).map(tx => {
          const decimals = parseInt(tx.tokenDecimal) || 18;
          const value = parseInt(tx.value) / Math.pow(10, decimals);
          const direction = tx.to.toLowerCase() === w.address.toLowerCase() ? "in" : "out";
          return {
            whale_name: w.name,
            wallet: w.address,
            chain: w.chain,
            direction,
            token: tx.tokenSymbol,
            value,
            time: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
            hash: tx.hash,
          };
        });
        return txs;
      })
    );

    const allTxs = results
      .flatMap(r => r.status === "fulfilled" ? r.value : [])
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 50);

    res.json({ ok: true, wallet_count: wallets.length, recent_txs: allTxs });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;
