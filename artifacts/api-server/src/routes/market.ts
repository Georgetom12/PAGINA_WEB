import { Router, Request, Response } from "express";

const router = Router();

const TTL = 90_000; // 90 seconds
const cache = new Map<string, { data: unknown; ts: number }>();

// ── Name maps ────────────────────────────────────────────────────────────────
const STOCK_NAMES: Record<string, string> = {
  AAPL: "Apple Inc.", MSFT: "Microsoft Corp.", AMZN: "Amazon.com Inc.",
  GOOGL: "Alphabet Inc.", META: "Meta Platforms Inc.", NVDA: "NVIDIA Corp.",
  TSLA: "Tesla Inc.", NFLX: "Netflix Inc.", AMD: "AMD Inc.", INTC: "Intel Corp.",
  CRM: "Salesforce Inc.", ORCL: "Oracle Corp.", ADBE: "Adobe Inc.",
  PYPL: "PayPal Holdings", SQ: "Block Inc.", UBER: "Uber Technologies",
  COIN: "Coinbase Global", JPM: "JPMorgan Chase", GS: "Goldman Sachs",
  MS: "Morgan Stanley", BAC: "Bank of America", WFC: "Wells Fargo",
  SPY: "S&P 500 ETF", QQQ: "NASDAQ-100 ETF", DIA: "Dow Jones ETF", IWM: "Russell 2000 ETF",
};
const FOREX_NAMES: Record<string, string> = {
  "EURUSD=X": "EUR/USD", "GBPUSD=X": "GBP/USD", "USDJPY=X": "USD/JPY",
  "USDCHF=X": "USD/CHF", "AUDUSD=X": "AUD/USD", "USDCAD=X": "USD/CAD",
  "NZDUSD=X": "NZD/USD", "EURGBP=X": "EUR/GBP", "EURJPY=X": "EUR/JPY",
  "GBPJPY=X": "GBP/JPY",
};
const COMMODITY_NAMES: Record<string, string> = {
  "GC=F": "Oro (XAU/USD)", "SI=F": "Plata (XAG/USD)", "CL=F": "Petróleo WTI",
  "BZ=F": "Petróleo Brent", "NG=F": "Gas Natural", "HG=F": "Cobre",
  "PL=F": "Platino", "KC=F": "Café", "ZW=F": "Trigo", "ZC=F": "Maíz",
};

const ALL_NAMES: Record<string, string> = { ...STOCK_NAMES, ...FOREX_NAMES, ...COMMODITY_NAMES };

const STOCK_SYMBOLS = [
  "AAPL","MSFT","AMZN","GOOGL","META","NVDA","TSLA",
  "NFLX","AMD","INTC","CRM","ORCL","ADBE","PYPL","SQ","UBER","COIN",
  "JPM","GS","MS","BAC","WFC",
  "SPY","QQQ","DIA","IWM",
];

// Equities page symbols (20 stocks shown in /equities)
const EQUITIES_SYMBOLS = [
  "AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA","BRK-B","JPM","V",
  "WMT","XOM","JNJ","UNH","PG","MA","LLY","COST","HD","NFLX",
];
const FOREX_SYMBOLS = [
  "EURUSD=X","GBPUSD=X","USDJPY=X","USDCHF=X","AUDUSD=X","USDCAD=X","NZDUSD=X",
  "EURGBP=X","EURJPY=X","GBPJPY=X",
];
const COMMODITY_SYMBOLS = [
  "GC=F","SI=F","CL=F","BZ=F","NG=F","HG=F","PL=F","KC=F","ZW=F","ZC=F",
];

// ── v8 per-symbol fetch (same as macro — this endpoint works) ─────────────────
interface V8Meta {
  symbol?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  regularMarketVolume?: number;
  marketCap?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  trailingPE?: number;
  currency?: string;
}

const YF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Origin": "https://finance.yahoo.com",
  "Referer": "https://finance.yahoo.com/",
};

// Try query2 first (more reliable from Railway), fall back to query1
async function fetchSymbol(symbol: string) {
  const enc = encodeURIComponent(symbol);
  const path = `v8/finance/chart/${enc}?interval=1d&range=5d&includePrePost=false`;
  const urls = [
    `https://query2.finance.yahoo.com/${path}`,
    `https://query1.finance.yahoo.com/${path}`,
  ];
  let lastErr: unknown;
  for (const url of urls) {
    try {
      const r = await fetch(url, { headers: YF_HEADERS, signal: AbortSignal.timeout(8000) });
      if (!r.ok) { lastErr = new Error(`HTTP ${r.status}`); continue; }
      const d = await r.json() as { chart?: { result?: { meta?: V8Meta }[] } };
      const meta = d?.chart?.result?.[0]?.meta ?? {};
      const price = meta.regularMarketPrice ?? 0;
      if (price === 0) { lastErr = new Error("zero price"); continue; }
      const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
      const change = price - prevClose;
      const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
      const name = ALL_NAMES[symbol] ?? meta.shortName ?? meta.longName ?? symbol;
      return { symbol, name, price, change, changePct,
        volume: meta.regularMarketVolume ?? 0, marketCap: meta.marketCap,
        high: meta.regularMarketDayHigh, low: meta.regularMarketDayLow,
        high52w: meta.fiftyTwoWeekHigh, low52w: meta.fiftyTwoWeekLow,
        pe: meta.trailingPE, currency: meta.currency ?? "USD", live: true };
    } catch (e) { lastErr = e; }
  }
  throw lastErr ?? new Error("All Yahoo Finance endpoints failed");
}

// ── Simulated fallback data (realistic prices, seeded) ───────────────────────
const SIM_PRICES: Record<string, { price: number; pe?: number }> = {
  AAPL: { price: 207.84, pe: 33.2 }, MSFT: { price: 420.51, pe: 36.8 },
  AMZN: { price: 197.12, pe: 45.1 }, GOOGL: { price: 165.34, pe: 20.9 },
  META:  { price: 572.14, pe: 28.4 }, NVDA: { price: 921.50, pe: 55.3 },
  TSLA:  { price: 276.88, pe: 62.7 }, NFLX: { price: 640.20, pe: 42.1 },
  AMD:   { price: 145.30, pe: 50.2 }, INTC: { price: 21.18, pe: 18.4 },
  CRM:   { price: 312.40, pe: 55.8 }, ORCL: { price: 180.60, pe: 30.1 },
  ADBE:  { price: 380.20, pe: 32.5 }, PYPL: { price: 68.44, pe: 17.2 },
  SQ:    { price: 62.30, pe: 22.1 }, UBER: { price: 74.80, pe: 38.9 },
  COIN:  { price: 198.40, pe: 30.2 }, JPM: { price: 242.10, pe: 12.4 },
  GS:    { price: 561.20, pe: 14.8 }, MS: { price: 112.80, pe: 16.2 },
  BAC:   { price: 42.30, pe: 13.1 }, WFC: { price: 72.60, pe: 12.8 },
  SPY:   { price: 562.40 }, QQQ: { price: 472.80 },
  DIA:   { price: 420.10 }, IWM: { price: 201.30 },
  "EURUSD=X": { price: 1.1315 }, "GBPUSD=X": { price: 1.3290 },
  "USDJPY=X": { price: 143.82 }, "USDCHF=X": { price: 0.8271 },
  "AUDUSD=X": { price: 0.6388 }, "USDCAD=X": { price: 1.3840 },
  "NZDUSD=X": { price: 0.5921 }, "EURGBP=X": { price: 0.8512 },
  "EURJPY=X": { price: 162.74 }, "GBPJPY=X": { price: 191.14 },
  "GC=F":  { price: 3312.40 }, "SI=F": { price: 32.84 },
  "CL=F":  { price: 58.62 },   "BZ=F": { price: 61.34 },
  "NG=F":  { price: 3.42 },    "HG=F": { price: 4.88 },
  "PL=F":  { price: 982.40 },  "KC=F": { price: 312.80 },
  "ZW=F":  { price: 548.60 },  "ZC=F": { price: 448.20 },
};

function simQuote(symbol: string) {
  const base = SIM_PRICES[symbol] ?? { price: 100 };
  const seed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const variation = (((seed * 9301 + 49297) % 233280) / 233280) * 0.06 - 0.03;
  const price = base.price * (1 + variation);
  const dayChange = base.price * ((((Date.now() / 60000) * seed) % 200) / 10000 - 0.01);
  const changePct = (dayChange / price) * 100;
  const name = ALL_NAMES[symbol] ?? symbol;
  return {
    symbol, name, price, change: dayChange, changePct,
    volume: Math.floor(seed * 4821000 % 50000000 + 1000000),
    pe: base.pe, currency: symbol.endsWith("=X") ? "FX" : "USD",
    high: price * 1.012, low: price * 0.988,
    high52w: price * 1.35, low52w: price * 0.65,
    live: false,
  };
}

type AnyQuote = ReturnType<typeof simQuote> | Awaited<ReturnType<typeof fetchSymbol>>;
async function getQuotes(symbols: string[]): Promise<AnyQuote[]> {
  const cacheKey = symbols.join(",");
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < TTL) return hit.data as AnyQuote[];

  const results = await Promise.allSettled(
    symbols.map(s => fetchSymbol(s))
  );

  const quotes: AnyQuote[] = results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return simQuote(symbols[i]!);
  });

  cache.set(cacheKey, { data: quotes, ts: Date.now() });
  return quotes;
}

// ── Routes ───────────────────────────────────────────────────────────────────

router.get("/market/stocks", async (_req: Request, res: Response) => {
  try {
    const quotes = await getQuotes(STOCK_SYMBOLS);
    res.json({ data: quotes, ts: Date.now() });
  } catch (err) {
    res.status(502).json({ error: "Error fetching stock data", detail: String(err) });
  }
});

router.get("/market/forex", async (_req: Request, res: Response) => {
  try {
    const quotes = await getQuotes(FOREX_SYMBOLS);
    res.json({ data: quotes, ts: Date.now() });
  } catch (err) {
    res.status(502).json({ error: "Error fetching forex data", detail: String(err) });
  }
});

router.get("/market/commodities", async (_req: Request, res: Response) => {
  try {
    const quotes = await getQuotes(COMMODITY_SYMBOLS);
    res.json({ data: quotes, ts: Date.now() });
  } catch (err) {
    res.status(502).json({ error: "Error fetching commodities data", detail: String(err) });
  }
});

// GET /api/market/all — fetch all three groups in parallel
router.get("/market/all", async (_req: Request, res: Response) => {
  try {
    const [stocks, forex, commodities] = await Promise.all([
      getQuotes(STOCK_SYMBOLS),
      getQuotes(FOREX_SYMBOLS),
      getQuotes(COMMODITY_SYMBOLS),
    ]);
    res.json({ stocks, forex, commodities, ts: Date.now() });
  } catch (err) {
    res.status(502).json({ error: "Error fetching market data", detail: String(err) });
  }
});

// ── Macro indices (NASDAQ, S&P500, DXY, Yields, VIX, Gold, BTC) ─────────────
const MACRO_DEFS = [
  { symbol: "^IXIC",    name: "NASDAQ Composite",  shortName: "NASDAQ", color: "#00e5ff", btcCorr: 0.55,  inverse: false },
  { symbol: "^NDX",     name: "NASDAQ-100",         shortName: "NDX",    color: "#00bcd4", btcCorr: 0.58,  inverse: false },
  { symbol: "^GSPC",    name: "S&P 500",            shortName: "SPX",    color: "#4fc3f7", btcCorr: 0.48,  inverse: false },
  { symbol: "DX-Y.NYB", name: "DXY Dollar Index",   shortName: "DXY",    color: "#ff1744", btcCorr: -0.62, inverse: true  },
  { symbol: "^TNX",     name: "10Y Treasury Yield", shortName: "10Y",    color: "#ff6d00", btcCorr: -0.38, inverse: true  },
  { symbol: "^VIX",     name: "VIX Fear Index",     shortName: "VIX",    color: "#7c4dff", btcCorr: -0.44, inverse: true  },
  { symbol: "GC=F",     name: "Oro / Gold",         shortName: "XAU",    color: "#ffd700", btcCorr: 0.31,  inverse: false },
  { symbol: "BTC-USD",  name: "Bitcoin",            shortName: "BTC",    color: "#f7931a", btcCorr: 1.00,  inverse: false },
];

async function fetchMacroQuote(def: typeof MACRO_DEFS[0]) {
  const enc = encodeURIComponent(def.symbol);
  const path = `v8/finance/chart/${enc}?interval=1d&range=5d&includePrePost=false`;
  const urls = [
    `https://query2.finance.yahoo.com/${path}`,
    `https://query1.finance.yahoo.com/${path}`,
  ];
  let lastErr: unknown;
  for (const url of urls) {
    try {
      const r = await fetch(url, { headers: YF_HEADERS, signal: AbortSignal.timeout(8000) });
      if (!r.ok) { lastErr = new Error(`HTTP ${r.status}`); continue; }
      const d = await r.json() as { chart?: { result?: { meta?: V8Meta }[] } };
      const meta = d?.chart?.result?.[0]?.meta ?? {};
      const price = meta.regularMarketPrice ?? 0;
      if (price === 0) { lastErr = new Error("zero price"); continue; }
      const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
      const change = price - prevClose;
      const changePct = prevClose ? (change / prevClose) * 100 : 0;
      return { ...def, price, change, changePct, live: true };
    } catch (e) { lastErr = e; }
  }
  throw lastErr ?? new Error("All Yahoo Finance endpoints failed");
}

router.get("/market/equities", async (_req: Request, res: Response) => {
  const hit = cache.get("equities");
  if (hit && Date.now() - hit.ts < TTL) { res.json(hit.data); return; }
  const results = await Promise.allSettled(EQUITIES_SYMBOLS.map(s => fetchSymbol(s)));
  const data = results.map((r, i) =>
    r.status === "fulfilled" ? r.value : simQuote(EQUITIES_SYMBOLS[i]!)
  );
  const payload = { data, ts: Date.now() };
  cache.set("equities", { data: payload, ts: Date.now() });
  res.json(payload);
});

router.get("/market/macro", async (_req: Request, res: Response) => {
  const hit = cache.get("macro");
  if (hit && Date.now() - hit.ts < TTL) {
    res.json(hit.data);
    return;
  }
  const results = await Promise.allSettled(MACRO_DEFS.map(fetchMacroQuote));
  const data = results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { ...MACRO_DEFS[i], price: 0, change: 0, changePct: 0, live: false }
  );
  const payload = { data, ts: Date.now() };
  cache.set("macro", { data: payload, ts: Date.now() });
  res.json(payload);
});

export default router;
