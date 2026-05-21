import { Router, Request, Response } from "express";
import { db, psyApiKeys } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// ─── Trusted origins (internal traffic — always allowed) ─────────────────────
const TRUSTED_ORIGINS = [
  "https://psychometriks.trade",
  "https://www.psychometriks.trade",
];

function isInternalRequest(req: Request): boolean {
  const origin  = (req.headers["origin"]  as string | undefined)?.trim() ?? "";
  const referer = (req.headers["referer"] as string | undefined)?.trim() ?? "";
  // Check both Origin and Referer headers
  return TRUSTED_ORIGINS.some(o => origin.startsWith(o) || referer.startsWith(o));
}

// ─── Access + rate limiter ────────────────────────────────────────────────────
const RATE_PRO = 120; // req/min with valid active key

interface Bucket { count: number; reset: number }
const buckets = new Map<string, Bucket>();

async function checkAccess(req: Request, res: Response): Promise<boolean> {
  // Internal traffic from psychometriks.trade → always allowed, no rate limit
  if (isInternalRequest(req)) return true;

  // External request: must have a valid active API key
  const apiKey = ((req.query.apiKey ?? req.headers["x-api-key"]) as string | undefined)?.trim();

  if (!apiKey) {
    res.status(403).json({
      error: "API Key requerida",
      message: "Este endpoint requiere una API Key activa. Obtené la tuya en https://psychometriks.trade/pricing",
      docs: "https://psychometriks.trade/api-docs",
    });
    return false;
  }

  try {
    const rows = await db.select().from(psyApiKeys).where(eq(psyApiKeys.key, apiKey)).limit(1);
    const keyRow = rows[0];

    if (!keyRow) {
      res.status(403).json({ error: "API Key inválida" });
      return false;
    }
    if (!keyRow.active) {
      res.status(403).json({ error: "API Key inactiva. Contactá al equipo PSYCHOMETRIKS para activarla." });
      return false;
    }

    // Valid key — apply rate limit
    db.update(psyApiKeys).set({ lastUsedAt: new Date() }).where(eq(psyApiKeys.key, apiKey)).catch(() => {});

    const id     = "key:" + apiKey;
    const now    = Date.now();
    const bucket = buckets.get(id) ?? { count: 0, reset: now + 60_000 };
    if (now > bucket.reset) { bucket.count = 0; bucket.reset = now + 60_000; }
    bucket.count++;
    buckets.set(id, bucket);

    res.setHeader("X-RateLimit-Limit",     RATE_PRO);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, RATE_PRO - bucket.count));
    res.setHeader("X-RateLimit-Reset",     Math.ceil(bucket.reset / 1000));

    if (bucket.count > RATE_PRO) {
      res.status(429).json({
        error: "Rate limit excedido (120 req/min)",
        resetAt: new Date(bucket.reset).toISOString(),
      });
      return false;
    }

    return true;
  } catch {
    // DB unavailable — fail open for external (don't break the API entirely)
    res.status(503).json({ error: "Servicio temporalmente no disponible" });
    return false;
  }
}

async function proxyFetch(url: string, res: Response, req: Request) {
  try {
    const r = await fetch(url, {
      headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0" },
    });
    if (!r.ok) {
      res.status(r.status).json({ error: `Upstream error ${r.status}` });
      return;
    }
    const data = await r.json();
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(data);
  } catch (err) {
    req.log.error({ err, url }, "market-proxy fetch error");
    res.status(502).json({ error: "Proxy fetch failed" });
  }
}

// ─── Kraken ──────────────────────────────────────────────────────────────────
router.get("/proxy/kraken/ohlc", async (req: Request, res: Response) => {
  if (!await checkAccess(req, res)) return;
  const { pair = "XBTUSD", interval = "10080", since = "" } = req.query as Record<string, string>;
  const url = since
    ? `https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=${interval}&since=${since}`
    : `https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=${interval}`;
  await proxyFetch(url, res, req);
});

router.get("/proxy/kraken/price", async (req: Request, res: Response) => {
  if (!await checkAccess(req, res)) return;
  const { pair = "XBTUSD" } = req.query as Record<string, string>;
  await proxyFetch(`https://api.kraken.com/0/public/Ticker?pair=${pair}`, res, req);
});

// ─── OKX ─────────────────────────────────────────────────────────────────────
router.get("/proxy/okx/candles", async (req: Request, res: Response) => {
  if (!await checkAccess(req, res)) return;
  const { instId = "BTC-USDT-SWAP", bar = "1D", limit = "300" } = req.query as Record<string, string>;
  await proxyFetch(
    `https://www.okx.com/api/v5/market/history-candles?instId=${instId}&bar=${bar}&limit=${limit}`,
    res, req
  );
});

router.get("/proxy/okx/oi", async (req: Request, res: Response) => {
  if (!await checkAccess(req, res)) return;
  const { instId = "BTC-USDT-SWAP" } = req.query as Record<string, string>;
  await proxyFetch(
    `https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=${instId}`,
    res, req
  );
});

router.get("/proxy/okx/oi-history", async (req: Request, res: Response) => {
  if (!await checkAccess(req, res)) return;
  const { instId = "BTC-USDT-SWAP", period = "1D", limit = "300" } = req.query as Record<string, string>;
  await proxyFetch(
    `https://www.okx.com/api/v5/rubik/stat/contracts/open-interest-volume?ccy=BTC&period=${period}&limit=${limit}`,
    res, req
  );
});

// ─── Coinbase ─────────────────────────────────────────────────────────────────
router.get("/proxy/coinbase/price", async (req: Request, res: Response) => {
  if (!await checkAccess(req, res)) return;
  const { pair = "BTC-USD" } = req.query as Record<string, string>;
  await proxyFetch(`https://api.coinbase.com/v2/prices/${pair}/spot`, res, req);
});

// ─── Multi-Exchange Funding Rates (OKX + Gate.io + Hyperliquid) ──────────────
const FUNDING_BASES = [
  "BTC","ETH","SOL","BNB","XRP","ADA","DOGE","AVAX","LINK","DOT",
  "MATIC","LTC","ATOM","NEAR","APT","ARB","OP","INJ","SUI","TIA",
];
const FETCH_HEADERS = { "Accept": "application/json", "User-Agent": "Mozilla/5.0" };

interface FundingEntry {
  symbol: string; base: string; rate: number;
  price: number; change: number; nextFundingTime?: number; source: string;
}

async function fetchOKXFunding(): Promise<FundingEntry[]> {
  const results = await Promise.allSettled(
    FUNDING_BASES.map(async (base) => {
      const instId = `${base}-USDT-SWAP`;
      const [fr, tk] = await Promise.all([
        fetch(`https://www.okx.com/api/v5/public/funding-rate?instId=${instId}`, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(6000) }),
        fetch(`https://www.okx.com/api/v5/market/ticker?instId=${instId}`, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(6000) }),
      ]);
      const fd = await fr.json() as { data?: { fundingRate: string; nextFundingTime: string }[] };
      const td = await tk.json() as { data?: { last: string; open24h: string }[] };
      const f = fd.data?.[0]; const t = td.data?.[0];
      if (!f) throw new Error("no data");
      const price = parseFloat(t?.last ?? "0");
      const open24h = parseFloat(t?.open24h ?? "0");
      return { base, symbol: base + "USDT", rate: parseFloat(f.fundingRate), price,
        change: open24h > 0 ? ((price - open24h) / open24h) * 100 : 0,
        nextFundingTime: parseInt(f.nextFundingTime), source: "OKX" };
    })
  );
  return results.filter(r => r.status === "fulfilled").map(r => (r as PromiseFulfilledResult<FundingEntry>).value);
}

async function fetchGateioFunding(): Promise<FundingEntry[]> {
  const r = await fetch("https://api.gateio.ws/api/v4/futures/usdt/tickers", { headers: FETCH_HEADERS, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`Gate.io HTTP ${r.status}`);
  const raw = await r.json() as { contract: string; last: string; funding_rate: string; change_percentage: string }[];
  const baseSet = new Set(FUNDING_BASES);
  return raw
    .filter(x => baseSet.has(x.contract.replace("_USDT", "")))
    .map(x => {
      const base = x.contract.replace("_USDT", "");
      return { base, symbol: base + "USDT", rate: parseFloat(x.funding_rate), price: parseFloat(x.last),
        change: parseFloat(x.change_percentage ?? "0"), source: "Gate.io" };
    });
}

async function fetchHyperliquidFunding(): Promise<FundingEntry[]> {
  const r = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST", headers: { ...FETCH_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "metaAndAssetCtxs" }), signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Hyperliquid HTTP ${r.status}`);
  const [meta, ctxs] = await r.json() as [
    { universe: { name: string }[] },
    { funding: string; markPx: string; dayNtlVlm: string }[]
  ];
  const baseSet = new Set(FUNDING_BASES);
  return meta.universe
    .map((asset, i) => ({ asset, ctx: ctxs[i]! }))
    .filter(({ asset }) => baseSet.has(asset.name))
    .map(({ asset, ctx }) => ({
      base: asset.name, symbol: asset.name + "USDT",
      rate: parseFloat(ctx.funding),   // Hyperliquid returns 8h rate directly
      price: parseFloat(ctx.markPx), change: 0, source: "Hyperliquid",
    }));
}

router.get("/proxy/okx/funding-rates", async (req: Request, res: Response) => {
  const [okxR, gateR, hlR] = await Promise.allSettled([
    fetchOKXFunding(),
    fetchGateioFunding(),
    fetchHyperliquidFunding(),
  ]);

  // Merge: lowest priority first, highest overwrites (OKX = best)
  const byBase = new Map<string, FundingEntry>();
  if (hlR.status === "fulfilled")   hlR.value.forEach(r => byBase.set(r.base, r));
  if (gateR.status === "fulfilled") gateR.value.forEach(r => byBase.set(r.base, r));
  if (okxR.status === "fulfilled")  okxR.value.forEach(r => byBase.set(r.base, r));

  const data = FUNDING_BASES.map(b => byBase.get(b)).filter(Boolean) as FundingEntry[];

  const sources = {
    okx:         okxR.status  === "fulfilled" ? okxR.value.length  : 0,
    gateio:      gateR.status === "fulfilled" ? gateR.value.length : 0,
    hyperliquid: hlR.status   === "fulfilled" ? hlR.value.length   : 0,
  };

  req.log.info({ sources }, "funding-rates multi-exchange");
  res.setHeader("Cache-Control", "public, max-age=60");
  res.json({ data, sources, ts: Date.now() });
});

// ─── Signals (Railway) ────────────────────────────────────────────────────────
router.get("/proxy/signals/altcoins", async (req: Request, res: Response) => {
  if (!await checkAccess(req, res)) return;
  await proxyFetch(
    "https://signalsbotpaginaweb-production.up.railway.app/api/altcoin-signals",
    res, req
  );
});

export default router;
