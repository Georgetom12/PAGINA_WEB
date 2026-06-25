import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { apiConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const BASE = "https://api.1inch.dev";

// ── Chain ID map ──────────────────────────────────────────────────────────────
const CHAIN_IDS: Record<string, number> = {
  "0x1":    1,   // Ethereum
  "0x38":   56,  // BSC
  "0xa4b1": 42161, // Arbitrum
  "0x89":   137, // Polygon
  "0xa":    10,  // Optimism
  "0x2105": 8453, // Base
};

// ── Well-known token addresses (Ethereum mainnet) ─────────────────────────────
export const TOKEN_ADDRS: Record<string, string> = {
  ETH:  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  BNB:  "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
  MATIC:"0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
  LINK: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
  UNI:  "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  DAI:  "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  ARB:  "0x912CE59144191C1204E64559FE8253a0e49E6548", // on Arbitrum
  OP:   "0x4200000000000000000000000000000000000042", // on Optimism
};

// ── Token decimals ────────────────────────────────────────────────────────────
const TOKEN_DECIMALS: Record<string, number> = {
  ETH: 18, WETH: 18, USDT: 6, USDC: 6, WBTC: 8,
  BNB: 18, MATIC: 18, LINK: 18, UNI: 18, DAI: 18,
  ARB: 18, OP: 18,
};

// ── Load API key (env first, then DB) ─────────────────────────────────────────
let cachedKey: string | null = null;
let cacheTs = 0;

async function getApiKey(): Promise<string> {
  const envKey = process.env["ONEINCH_API_KEY"] ?? "";
  if (envKey) return envKey;

  if (cachedKey && Date.now() - cacheTs < 60_000) return cachedKey;

  try {
    const [row] = await db.select().from(apiConfigTable).where(eq(apiConfigTable.keyName, "ONEINCH_API_KEY")).limit(1);
    if (row?.keyValue) {
      cachedKey = row.keyValue;
      cacheTs = Date.now();
      return cachedKey;
    }
  } catch { /* ignore */ }

  return "";
}

interface FetchResult { ok: boolean; status: number; json: () => Promise<unknown>; }
async function oneInchFetch(path: string, apiKey: string): Promise<FetchResult> {
  const r = await fetch(`${BASE}${path}`, {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Accept": "application/json",
    },
    signal: AbortSignal.timeout(10000),
  });
  return r;
}

function resolveToken(symbol: string): string {
  return TOKEN_ADDRS[symbol.toUpperCase()] ?? symbol; // if not found, assume it's already an address
}

function toUnits(amount: number, symbol: string): string {
  const dec = TOKEN_DECIMALS[symbol.toUpperCase()] ?? 18;
  return BigInt(Math.floor(amount * 10 ** dec)).toString();
}

// ── GET /api/1inch/quote ──────────────────────────────────────────────────────
// ?chainHex=0x1&src=ETH&dst=USDT&amount=1.5
router.get("/1inch/quote", async (req: Request, res: Response) => {
  const { chainHex = "0x1", src = "ETH", dst = "USDT", amount = "1" } = req.query as Record<string, string>;
  const chainId = CHAIN_IDS[chainHex] ?? 1;
  const apiKey = await getApiKey();

  if (!apiKey) {
    res.status(503).json({ error: "1inch API key no configurada", hint: "Configura ONEINCH_API_KEY en el panel de Admin" });
    return;
  }

  const srcAddr = resolveToken(src);
  const dstAddr = resolveToken(dst);
  const amountWei = toUnits(parseFloat(amount), src);

  const path = `/swap/v6.0/${chainId}/quote?src=${srcAddr}&dst=${dstAddr}&amount=${amountWei}&includeTokensInfo=true&includeProtocols=true&includeGas=true`;

  try {
    const r = await oneInchFetch(path, apiKey);
    const data = await r.json();
    if (!r.ok) {
      res.status(r.status).json({ error: "1inch quote error", detail: data });
      return;
    }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "1inch quote error");
    res.status(502).json({ error: "Error al obtener cotización", detail: String(err) });
  }
});

// ── Load PSY fee wallet from DB ───────────────────────────────────────────────
let cachedFeeWallet: string | null = null;
let feeWalletTs = 0;

async function getFeeWallet(): Promise<string> {
  if (cachedFeeWallet && Date.now() - feeWalletTs < 60_000) return cachedFeeWallet;
  try {
    const [row] = await db.select().from(apiConfigTable).where(eq(apiConfigTable.keyName, "PSY_FEE_WALLET")).limit(1);
    if (row?.keyValue && row.keyValue.startsWith("0x") && row.keyValue.length === 42) {
      cachedFeeWallet = row.keyValue;
      feeWalletTs = Date.now();
      return cachedFeeWallet;
    }
  } catch { /* ignore */ }
  return "";
}

// ── GET /api/1inch/swap ───────────────────────────────────────────────────────
// ?chainHex=0x1&src=ETH&dst=USDT&amount=1.5&from=0x...&slippage=0.5
router.get("/1inch/swap", async (req: Request, res: Response) => {
  const {
    chainHex = "0x1", src = "ETH", dst = "USDT",
    amount = "1", from, slippage = "0.5",
  } = req.query as Record<string, string>;

  if (!from) {
    res.status(400).json({ error: "from (wallet address) es requerido" });
    return;
  }

  const chainId = CHAIN_IDS[chainHex] ?? 1;
  const [apiKey, feeWallet] = await Promise.all([getApiKey(), getFeeWallet()]);

  if (!apiKey) {
    res.status(503).json({ error: "1inch API key no configurada", hint: "Configura ONEINCH_API_KEY en el panel de Admin" });
    return;
  }

  const srcAddr = resolveToken(src);
  const dstAddr = resolveToken(dst);
  const amountWei = toUnits(parseFloat(amount), src);

  let path = `/swap/v6.0/${chainId}/swap?src=${srcAddr}&dst=${dstAddr}&amount=${amountWei}&from=${from}&slippage=${slippage}&disableEstimate=false&allowPartialFill=false`;
  if (feeWallet) path += `&referrerAddress=${feeWallet}&fee=0.5`;

  try {
    const r = await oneInchFetch(path, apiKey);
    const data = await r.json();
    if (!r.ok) {
      res.status(r.status).json({ error: "1inch swap error", detail: data });
      return;
    }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "1inch swap error");
    res.status(502).json({ error: "Error al construir swap", detail: String(err) });
  }
});

// ── GET /api/1inch/price ──────────────────────────────────────────────────────
// ?chainHex=0x1&tokens=ETH,USDT,WBTC
router.get("/1inch/price", async (req: Request, res: Response) => {
  const { chainHex = "0x1", tokens = "ETH,USDT,WBTC" } = req.query as Record<string, string>;
  const chainId = CHAIN_IDS[chainHex] ?? 1;
  const apiKey = await getApiKey();

  if (!apiKey) {
    res.status(503).json({ error: "1inch API key no configurada" });
    return;
  }

  const tokenList = tokens.split(",").map(t => resolveToken(t.trim())).join(",");
  const path = `/price/v1.1/${chainId}/${tokenList}?currency=USD`;

  try {
    const r = await oneInchFetch(path, apiKey);
    const data = await r.json();
    if (!r.ok) {
      res.status(r.status).json({ error: "1inch price error", detail: data });
      return;
    }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "1inch price error");
    res.status(502).json({ error: "Error al obtener precios", detail: String(err) });
  }
});

// ── GET /api/1inch/balance/:address ──────────────────────────────────────────
// ?chainHex=0x1
router.get("/1inch/balance/:address", async (req: Request, res: Response) => {
  const address = req.params["address"];
  const { chainHex = "0x1" } = req.query as Record<string, string>;
  const chainId = CHAIN_IDS[chainHex] ?? 1;
  const apiKey = await getApiKey();

  if (!apiKey) {
    res.status(503).json({ error: "1inch API key no configurada" });
    return;
  }

  const path = `/balance/v1.2/${chainId}/balances/${address}`;

  try {
    const r = await oneInchFetch(path, apiKey);
    const data = await r.json();
    if (!r.ok) {
      res.status(r.status).json({ error: "1inch balance error", detail: data });
      return;
    }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "1inch balance error");
    res.status(502).json({ error: "Error al obtener balances", detail: String(err) });
  }
});

// ── GET /api/1inch/gas ────────────────────────────────────────────────────────
// ?chainHex=0x1
router.get("/1inch/gas", async (req: Request, res: Response) => {
  const { chainHex = "0x1" } = req.query as Record<string, string>;
  const chainId = CHAIN_IDS[chainHex] ?? 1;
  const apiKey = await getApiKey();

  if (!apiKey) {
    res.status(503).json({ error: "1inch API key no configurada" });
    return;
  }

  const path = `/gas-price/v1.4/${chainId}`;

  try {
    const r = await oneInchFetch(path, apiKey);
    const data = await r.json();
    if (!r.ok) {
      res.status(r.status).json({ error: "1inch gas error", detail: data });
      return;
    }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "1inch gas error");
    res.status(502).json({ error: "Error al obtener gas", detail: String(err) });
  }
});

// ── GET /api/1inch/portfolio/:address ────────────────────────────────────────
// ?chainHex=0x1
router.get("/1inch/portfolio/:address", async (req: Request, res: Response) => {
  const address = req.params["address"];
  const { chainHex = "0x1" } = req.query as Record<string, string>;
  const chainId = CHAIN_IDS[chainHex] ?? 1;
  const apiKey = await getApiKey();

  if (!apiKey) {
    res.status(503).json({ error: "1inch API key no configurada" });
    return;
  }

  const path = `/portfolio/portfolio/v4/overview/erc20/details?addresses=${address}&chain_id=${chainId}&use_cache=true`;

  try {
    const r = await oneInchFetch(path, apiKey);
    const data = await r.json();
    if (!r.ok) {
      res.status(r.status).json({ error: "1inch portfolio error", detail: data });
      return;
    }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "1inch portfolio error");
    res.status(502).json({ error: "Error al obtener portfolio", detail: String(err) });
  }
});

// ── GET /api/1inch/history/:address ──────────────────────────────────────────
// ?chainHex=0x1&limit=20
router.get("/1inch/history/:address", async (req: Request, res: Response) => {
  const address = req.params["address"];
  const { chainHex = "0x1", limit = "20" } = req.query as Record<string, string>;
  const chainId = CHAIN_IDS[chainHex] ?? 1;
  const apiKey = await getApiKey();

  if (!apiKey) {
    res.status(503).json({ error: "1inch API key no configurada" });
    return;
  }

  const path = `/history/v2.0/history/${address}/events?chainId=${chainId}&limit=${limit}&tokenAddress=`;

  try {
    const r = await oneInchFetch(path, apiKey);
    const data = await r.json();
    if (!r.ok) {
      res.status(r.status).json({ error: "1inch history error", detail: data });
      return;
    }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "1inch history error");
    res.status(502).json({ error: "Error al obtener historial", detail: String(err) });
  }
});

// ── GET /api/1inch/tokens ─────────────────────────────────────────────────────
// ?chainHex=0x1
router.get("/1inch/tokens", async (req: Request, res: Response) => {
  const { chainHex = "0x1" } = req.query as Record<string, string>;
  const chainId = CHAIN_IDS[chainHex] ?? 1;
  const apiKey = await getApiKey();

  if (!apiKey) {
    res.status(503).json({ error: "1inch API key no configurada" });
    return;
  }

  const path = `/swap/v6.0/${chainId}/tokens`;

  try {
    const r = await oneInchFetch(path, apiKey);
    const data = await r.json();
    if (!r.ok) {
      res.status(r.status).json({ error: "1inch tokens error", detail: data });
      return;
    }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "1inch tokens error");
    res.status(502).json({ error: "Error al obtener tokens", detail: String(err) });
  }
});

// ── GET /api/1inch/status — check if key is configured ───────────────────────
router.get("/1inch/status", async (_req: Request, res: Response) => {
  const apiKey = await getApiKey();
  if (!apiKey) {
    res.json({ configured: false, message: "ONEINCH_API_KEY no configurada" });
    return;
  }

  // Quick test call to verify key works
  try {
    const r = await fetch(`${BASE}/swap/v6.0/1/tokens`, {
      headers: { "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    res.json({ configured: true, working: r.ok, status: r.status });
  } catch {
    res.json({ configured: true, working: false, message: "Error de conexión con 1inch" });
  }
});

export default router;
