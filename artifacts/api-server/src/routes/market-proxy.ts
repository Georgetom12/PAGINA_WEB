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

// ─── Signals — PSY-ULT2 engine (interno, mismo servidor) ─────────────────────
router.get("/proxy/signals/altcoins", async (req: Request, res: Response) => {
  if (!await checkAccess(req, res)) return;
  const port = process.env["PORT"] ?? "8080";
  await proxyFetch(`http://localhost:${port}/api/altcoin-signals`, res, req);
});

// ─── DeGate — Base URL ────────────────────────────────────────────────────────
const DG_BASE = "https://v1-mainnet-backend.degate.com/order-book-api";
const DG_HEADERS = { "User-Agent": "PSYCHOMETRIKS/1.0", Accept: "application/json" };

// In-memory caches
const dgTickerCache: { data: unknown; ts: number } = { data: null, ts: 0 };
const DG_TICKER_TTL = 30_000; // 30s

// GET /proxy/degate/tickers — markets list + 24hr stats merged
router.get("/proxy/degate/tickers", async (req: Request, res: Response) => {
  // Serve cache if fresh
  if (dgTickerCache.data && Date.now() - dgTickerCache.ts < DG_TICKER_TTL) {
    res.setHeader("X-Cache", "HIT");
    res.setHeader("Cache-Control", "public, max-age=30");
    res.json(dgTickerCache.data);
    return;
  }
  try {
    // Fetch markets (gives us token IDs and symbols) + 24hr stats in parallel
    const [marketsRaw, tickerRaw] = await Promise.all([
      fetch(`${DG_BASE}/markets`, { headers: DG_HEADERS, signal: AbortSignal.timeout(8000) })
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${DG_BASE}/ticker/24hr`, { headers: DG_HEADERS, signal: AbortSignal.timeout(8000) })
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ]);

    // Build a symbol→ticker map from the 24hr endpoint
    type Ticker24 = { symbol: string; lastPrice?: string; priceChangePercent?: string; volume?: string; quoteVolume?: string; highPrice?: string; lowPrice?: string; bidPrice?: string; askPrice?: string };
    const tickerMap: Record<string, Ticker24> = {};
    const tickerArr = Array.isArray(tickerRaw) ? tickerRaw as Ticker24[]
      : Array.isArray((tickerRaw as Record<string, unknown>)?.data) ? ((tickerRaw as { data: Ticker24[] }).data) : [];
    tickerArr.forEach((t) => { if (t.symbol) tickerMap[t.symbol] = t; });

    // Build list from markets
    type Market = { pair_id?: number; base_token?: { token_id?: number; symbol?: string; address?: string }; quote_token?: { token_id?: number; symbol?: string }; price?: string; percent?: string; amount?: string };
    const marketArr: Market[] = Array.isArray((marketsRaw as Record<string, unknown>)?.data)
      ? ((marketsRaw as { data: Market[] }).data)
      : Array.isArray(marketsRaw) ? (marketsRaw as Market[]) : [];

    const list = marketArr.map((m) => {
      const sym = `${m.base_token?.symbol ?? "?"}-${m.quote_token?.symbol ?? "ETH"}`;
      const t24 = tickerMap[sym];
      return {
        pair_id:    m.pair_id ?? 0,
        base_token:  m.base_token,
        quote_token: m.quote_token,
        symbol:      sym,
        price:       t24?.lastPrice ?? m.price ?? "0",
        percent:     t24?.priceChangePercent ?? m.percent ?? "0",
        amount:      t24?.volume ?? m.amount ?? "0",
        quoteVolume: t24?.quoteVolume ?? "0",
        highPrice:   t24?.highPrice ?? "0",
        lowPrice:    t24?.lowPrice ?? "0",
        bidPrice:    t24?.bidPrice ?? "0",
        askPrice:    t24?.askPrice ?? "0",
      };
    });

    // Fallback: if markets endpoint failed but tickers worked, build from tickers
    const finalList = list.length > 0 ? list : tickerArr.map(t => ({
      pair_id: 0, base_token: { token_id: 0, symbol: t.symbol.split("-")[0] },
      quote_token: { token_id: 0, symbol: t.symbol.split("-")[1] ?? "ETH" },
      symbol: t.symbol, price: t.lastPrice ?? "0", percent: t.priceChangePercent ?? "0",
      amount: t.volume ?? "0", quoteVolume: t.quoteVolume ?? "0",
      highPrice: t.highPrice ?? "0", lowPrice: t.lowPrice ?? "0",
      bidPrice: t.bidPrice ?? "0", askPrice: t.askPrice ?? "0",
    }));

    const payload = { ok: true, data: { list: finalList, total: finalList.length }, ts: Date.now() };
    dgTickerCache.data = payload;
    dgTickerCache.ts   = Date.now();
    res.setHeader("Cache-Control", "public, max-age=30");
    res.json(payload);
  } catch (err) {
    req.log.error({ err }, "degate/tickers error");
    res.status(502).json({ ok: false, error: "DeGate tickers failed", data: { list: [], total: 0 } });
  }
});

// GET /proxy/degate/depth?symbol=LDO-ETH&size=10
router.get("/proxy/degate/depth", async (req: Request, res: Response) => {
  const { symbol, base_token_id, quote_token_id, size = "10" } = req.query as Record<string, string>;
  const empty = { ok: true, data: { bids: [], asks: [] }, ts: Date.now() };

  // Try symbol-based URL first, then fall back to token ID based
  const urls: string[] = [];
  if (symbol) {
    urls.push(`${DG_BASE}/depth?symbol=${encodeURIComponent(symbol)}&size=${size}`);
    // also try with underscore (some DEX APIs use BASE_QUOTE)
    urls.push(`${DG_BASE}/depth?symbol=${encodeURIComponent(symbol.replace("-","_"))}&size=${size}`);
  }
  if (base_token_id && quote_token_id && base_token_id !== "0") {
    urls.push(`${DG_BASE}/depth?base_token_id=${base_token_id}&quote_token_id=${quote_token_id}&size=${size}`);
  }
  if (urls.length === 0) { res.json(empty); return; }

  for (const url of urls) {
    try {
      const r = await fetch(url, { headers: DG_HEADERS, signal: AbortSignal.timeout(6000) });
      if (!r.ok) continue;
      const raw = await r.json() as Record<string, unknown>;
      const depth = (raw.data ?? raw) as { bids?: [string,string][]; asks?: [string,string][] };
      if ((depth.bids?.length ?? 0) + (depth.asks?.length ?? 0) > 0) {
        res.setHeader("Cache-Control", "no-cache");
        res.json({ ok: true, data: { bids: depth.bids ?? [], asks: depth.asks ?? [] }, ts: Date.now() });
        return;
      }
    } catch { /* try next URL */ }
  }
  res.json(empty);
});

// GET /proxy/degate/trades?symbol=LDO-ETH&limit=40
router.get("/proxy/degate/trades", async (req: Request, res: Response) => {
  const { symbol, base_token_id, quote_token_id, limit = "40" } = req.query as Record<string, string>;

  const urls: string[] = [];
  if (symbol) {
    urls.push(`${DG_BASE}/trades?symbol=${encodeURIComponent(symbol)}&limit=${limit}`);
    urls.push(`${DG_BASE}/trades?symbol=${encodeURIComponent(symbol.replace("-","_"))}&limit=${limit}`);
  }
  if (base_token_id && quote_token_id && base_token_id !== "0") {
    urls.push(`${DG_BASE}/trades?base_token_id=${base_token_id}&quote_token_id=${quote_token_id}&limit=${limit}`);
  }
  if (urls.length === 0) { res.json({ ok: true, trades: [], ts: Date.now() }); return; }

  type RawTrade = { id?: string | number; price?: string; qty?: string; quoteQty?: string; time?: number; isBuyerMaker?: boolean };
  const normalize = (raw: unknown): RawTrade[] => {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(raw))           return raw as RawTrade[];
    if (Array.isArray(r?.data))       return r.data as RawTrade[];
    if (Array.isArray(r?.list))       return r.list as RawTrade[];
    if (Array.isArray(r?.trades))     return r.trades as RawTrade[];
    return [];
  };

  for (const url of urls) {
    try {
      const r = await fetch(url, { headers: DG_HEADERS, signal: AbortSignal.timeout(6000) });
      if (!r.ok) continue;
      const raw = await r.json();
      const list = normalize(raw);
      if (list.length > 0) {
        const trades = list.map(t => ({
          id: t.id ?? Math.random(), price: t.price ?? "0", qty: t.qty ?? "0",
          quoteQty: t.quoteQty ?? "0", time: t.time ?? Date.now(), isBuyerMaker: t.isBuyerMaker ?? false,
        }));
        res.setHeader("Cache-Control", "no-cache");
        res.json({ ok: true, trades, ts: Date.now() });
        return;
      }
    } catch { /* try next URL */ }
  }
  res.json({ ok: true, trades: [], ts: Date.now() });
});

// ─── DeGate Pump Detector — CoinMarketCap 1h / 24h / 7d ──────────────────────
// Tokens listados en DeGate DEX cuyo símbolo existe en CMC
const DEGATE_CMC_SYMBOLS = ["DG","ENS","GRT","LDO","SOL","UNI","MMS","TFC","ZEUS","VEN","MUSK","AIB"];

router.get("/proxy/degate/pumps", async (req: Request, res: Response) => {
  const CMC_KEY = process.env.CMC_API_KEY;
  if (!CMC_KEY) {
    res.status(500).json({ ok: false, error: "CMC_API_KEY not configured" });
    return;
  }
  try {
    const symbols = DEGATE_CMC_SYMBOLS.join(",");
    const r = await fetch(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbols}&convert=USD`,
      {
        headers: { "X-CMC_PRO_API_KEY": CMC_KEY, Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      }
    );
    const raw = await r.json() as { data?: Record<string, { quote?: { USD?: { percent_change_1h?: number; percent_change_24h?: number; percent_change_7d?: number; price?: number } } }> };
    const result: Record<string, { h1: number; h24: number; d7: number; price_usd: number }> = {};
    for (const [sym, val] of Object.entries(raw.data ?? {})) {
      const q = val?.quote?.USD;
      if (!q) continue;
      result[sym] = {
        h1:        q.percent_change_1h  ?? 0,
        h24:       q.percent_change_24h ?? 0,
        d7:        q.percent_change_7d  ?? 0,
        price_usd: q.price             ?? 0,
      };
    }
    res.setHeader("Cache-Control", "public, max-age=120");
    res.json({ ok: true, data: result, ts: Date.now() });
  } catch (err) {
    req.log.error({ err }, "degate/pumps CMC error");
    res.status(502).json({ ok: false, error: "CMC fetch failed" });
  }
});

// ─── FMP (Financial Modeling Prep) — caché 24h annual, 5min quotes ──────────
const fmpCache = new Map<string, { data: unknown; ts: number }>();

router.get("/proxy/fmp/income-statement", async (req: Request, res: Response) => {
  const { symbol = "AAPL", period = "annual", limit = "5" } = req.query as Record<string, string>;
  const sym = symbol.toUpperCase();
  const cacheKey = `is:${sym}:${period}:${limit}`;
  const TTL = 24 * 60 * 60 * 1000;

  const hit = fmpCache.get(cacheKey);
  if (hit && Date.now() - hit.ts < TTL) {
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("X-Cache", "HIT");
    return res.json({ ok: true, symbol: sym, data: hit.data, cached: true });
  }

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ ok: false, error: "FMP_API_KEY no configurada", hint: "Agrega FMP_API_KEY en Replit Secrets" });
  }

  try {
    const url = `https://financialmodelingprep.com/stable/income-statement?symbol=${sym}&period=${period}&limit=${limit}&apikey=${apiKey}`;
    const r = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) {
      const errBody = await r.text().catch(() => "");
      req.log.warn({ status: r.status, sym, errBody }, "fmp income-statement upstream error");
      return res.status(r.status).json({ ok: false, error: `FMP upstream error ${r.status}`, detail: errBody.substring(0, 300) });
    }
    const data = await r.json();
    fmpCache.set(cacheKey, { data, ts: Date.now() });
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("X-Cache", "MISS");
    return res.json({ ok: true, symbol: sym, data, cached: false });
  } catch (err) {
    req.log.error({ err, sym }, "fmp income-statement fetch error");
    return res.status(502).json({ ok: false, error: "FMP fetch failed" });
  }
});

// ─── FRED (Federal Reserve St. Louis) ────────────────────────────────────────
const fredCache = new Map<string, { data: unknown; ts: number }>();

router.get("/proxy/fred/series", async (req: Request, res: Response) => {
  const { id = "FEDFUNDS", limit = "60", sort = "desc" } = req.query as Record<string, string>;
  const seriesId = id.toUpperCase();
  const cacheKey = `fred:${seriesId}:${limit}:${sort}`;
  const TTL = 60 * 60 * 1000; // 1 hour

  const hit = fredCache.get(cacheKey);
  if (hit && Date.now() - hit.ts < TTL) {
    res.setHeader("X-Cache", "HIT");
    return res.json({ ok: true, id: seriesId, observations: hit.data, cached: true });
  }

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ ok: false, error: "FRED_API_KEY no configurada" });
  }

  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=${sort}&limit=${limit}`;
    const r = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) {
      const errBody = await r.text().catch(() => "");
      req.log.warn({ status: r.status, seriesId, errBody }, "FRED upstream error");
      return res.status(r.status).json({ ok: false, error: `FRED upstream error ${r.status}` });
    }
    const body = await r.json() as { observations?: { date: string; value: string }[] };
    const observations = (body.observations ?? [])
      .filter(o => o.value !== "." && o.value !== "")
      .map(o => ({ date: o.date, value: parseFloat(o.value) }));
    fredCache.set(cacheKey, { data: observations, ts: Date.now() });
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("X-Cache", "MISS");
    return res.json({ ok: true, id: seriesId, observations, cached: false });
  } catch (err) {
    req.log.error({ err, seriesId }, "FRED fetch error");
    return res.status(502).json({ ok: false, error: "FRED fetch failed" });
  }
});

// ─── NewsAPI ──────────────────────────────────────────────────────────────────
const newsCache = new Map<string, { data: unknown; ts: number }>();

router.get("/proxy/news", async (req: Request, res: Response) => {
  const {
    q = "bitcoin crypto ethereum",
    pageSize = "20",
    lang = "es",
    sortBy = "publishedAt",
  } = req.query as Record<string, string>;

  const cacheKey = `news:${q}:${pageSize}:${lang}:${sortBy}`;
  const TTL = 15 * 60 * 1000; // 15 min

  const hit = newsCache.get(cacheKey);
  if (hit && Date.now() - hit.ts < TTL) {
    res.setHeader("X-Cache", "HIT");
    return res.json({ ok: true, articles: hit.data, cached: true });
  }

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ ok: false, error: "NEWS_API_KEY no configurada" });
  }

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=${lang}&sortBy=${sortBy}&pageSize=${pageSize}&apiKey=${apiKey}`;
    const r = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) {
      const errBody = await r.text().catch(() => "");
      req.log.warn({ status: r.status, q, errBody }, "NewsAPI upstream error");
      return res.status(r.status).json({ ok: false, error: `NewsAPI upstream error ${r.status}` });
    }
    const body = await r.json() as { articles?: { title: string; url: string; publishedAt: string; source: { name: string }; description?: string; urlToImage?: string }[] };
    const articles = (body.articles ?? []).map(a => ({
      title:       a.title,
      url:         a.url,
      publishedAt: a.publishedAt,
      source:      a.source?.name ?? "NewsAPI",
      description: a.description ?? "",
      image:       a.urlToImage ?? null,
    }));
    newsCache.set(cacheKey, { data: articles, ts: Date.now() });
    res.setHeader("Cache-Control", "public, max-age=900");
    res.setHeader("X-Cache", "MISS");
    return res.json({ ok: true, articles, cached: false });
  } catch (err) {
    req.log.error({ err, q }, "NewsAPI fetch error");
    return res.status(502).json({ ok: false, error: "NewsAPI fetch failed" });
  }
});

router.get("/proxy/fmp/quote", async (req: Request, res: Response) => {
  const { symbol = "AAPL" } = req.query as Record<string, string>;
  const sym = symbol.toUpperCase();
  const cacheKey = `q:${sym}`;
  const TTL = 5 * 60 * 1000;

  const hit = fmpCache.get(cacheKey);
  if (hit && Date.now() - hit.ts < TTL) {
    res.setHeader("Cache-Control", "public, max-age=300");
    res.setHeader("X-Cache", "HIT");
    return res.json({ ok: true, symbol: sym, data: hit.data, cached: true });
  }

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ ok: false, error: "FMP_API_KEY no configurada" });
  }

  try {
    const url = `https://financialmodelingprep.com/stable/quote?symbol=${sym}&apikey=${apiKey}`;
    const r = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) { const e = await r.text().catch(()=>""); return res.status(r.status).json({ ok: false, error: `FMP upstream error ${r.status}`, detail: e.substring(0,300) }); }
    const data = await r.json();
    fmpCache.set(cacheKey, { data, ts: Date.now() });
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.json({ ok: true, symbol: sym, data, cached: false });
  } catch (err) {
    req.log.error({ err, sym }, "fmp quote fetch error");
    return res.status(502).json({ ok: false, error: "FMP fetch failed" });
  }
});

export default router;
