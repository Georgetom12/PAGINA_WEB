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

// ── FMP (reemplaza el scraping de Yahoo Finance — no oficial, poco confiable) ──
const FMP_BASE = "https://financialmodelingprep.com/stable";
async function fetchSymbol(symbol: string) {
  const key = process.env["FMP_API_KEY"];
  if (!key) return null;
  try {
    const r = await fetch(`${FMP_BASE}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${key}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const d = await r.json() as Array<{
      price?: number; change?: number; changePercentage?: number;
      volume?: number; marketCap?: number; dayHigh?: number; dayLow?: number;
      yearHigh?: number; yearLow?: number; name?: string;
    }>;
    const q = Array.isArray(d) ? d[0] : null;
    if (!q || typeof q.price !== "number" || q.price === 0) return null;
    return {
      symbol,
      name: ALL_NAMES[symbol] ?? q.name ?? symbol,
      price: q.price,
      change: q.change ?? 0,
      changePct: q.changePercentage ?? 0,
      volume: q.volume ?? 0,
      marketCap: q.marketCap,
      high: q.dayHigh, low: q.dayLow,
      high52w: q.yearHigh, low52w: q.yearLow,
      currency: "USD",
      live: true,
    };
  } catch { return null; }
}

// NOTA: se eliminó el simulador de precios — antes, si Yahoo/FMP fallaba
// para un símbolo, se inventaba un precio pseudo-aleatorio sin avisar.
// Ahora simplemente se omite ese símbolo de la respuesta.

type AnyQuote = NonNullable<Awaited<ReturnType<typeof fetchSymbol>>>;
async function getQuotes(symbols: string[]): Promise<AnyQuote[]> {
  const cacheKey = symbols.join(",");
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < TTL) return hit.data as AnyQuote[];

  const results = await Promise.allSettled(
    symbols.map(s => fetchSymbol(s))
  );

  const quotes: AnyQuote[] = results
    .map(r => (r.status === "fulfilled" ? r.value : null))
    .filter((q): q is AnyQuote => q !== null);

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
  const data = results
    .map(r => (r.status === "fulfilled" ? r.value : null))
    .filter((q): q is NonNullable<typeof q> => q !== null);
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
