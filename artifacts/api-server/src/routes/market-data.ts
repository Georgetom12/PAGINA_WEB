import { Router, Request, Response } from "express";

const router = Router();

// ─── TTL in-memory cache ──────────────────────────────────────────────────
const _cache = new Map<string, { data: unknown; exp: number }>();
function cGet<T>(key: string): T | null {
  const e = _cache.get(key);
  return e && Date.now() < e.exp ? (e.data as T) : null;
}
function cSet<T>(key: string, data: T, ttlMs: number): void {
  _cache.set(key, { data, exp: Date.now() + ttlMs });
}

// ─── Crypto — OKX spot tickers (no key, no geo-block) ────────────────────
const CRYPTO_IDS: Record<string, string> = {
  "BTC-USDT": "BTC",  "ETH-USDT": "ETH",  "SOL-USDT": "SOL",
  "BNB-USDT": "BNB",  "XRP-USDT": "XRP",  "AVAX-USDT": "AVAX",
  "DOGE-USDT": "DOGE","OP-USDT":  "OP",   "ARB-USDT": "ARB",
  "LINK-USDT": "LINK","DOT-USDT": "DOT",  "UNI-USDT": "UNI",
  "PEPE-USDT": "PEPE","SUI-USDT": "SUI",  "TIA-USDT": "TIA",
  "INJ-USDT":  "INJ", "WIF-USDT": "WIF",  "JTO-USDT": "JTO",
  "SEI-USDT":  "SEI", "ATOM-USDT":"ATOM",
};

interface OkxTicker { instId: string; last: string; open24h: string; volCcy24h: string; }

async function fetchCrypto() {
  const cached = cGet<unknown[]>("crypto");
  if (cached) return cached;

  const res = await fetch("https://www.okx.com/api/v5/market/tickers?instType=SPOT", {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  const json = await res.json() as { data: OkxTicker[] };
  const tickerMap = new Map(json.data.map(t => [t.instId, t]));

  const assets = Object.entries(CRYPTO_IDS).flatMap(([id, sym]) => {
    const t = tickerMap.get(id);
    if (!t) return [];
    const price = parseFloat(t.last);
    const open  = parseFloat(t.open24h) || price;
    return [{ sym, price, chg24h: ((price - open) / open) * 100, vol24h: parseFloat(t.volCcy24h) }];
  });

  cSet("crypto", assets, 30_000);
  return assets;
}

// ─── Stocks / Indices / Yields — Yahoo Finance v8 (no key) ───────────────
const YF_SYMBOLS: Record<string, string> = {
  "^GSPC":    "GSPC", "^IXIC":    "NDX",  "^DJI":  "DJI",
  "^VIX":     "VIX",  "DX-Y.NYB": "DXY",  "GC=F":  "GOLD",
  "^TNX":     "TNX",  "^IRX":     "IRX",  "^FVX":  "FVX",  "^TYX": "TYX",
  "AAPL":     "AAPL", "NVDA":     "NVDA", "TSLA":  "TSLA",
  "MSFT":     "MSFT", "META":     "META", "AMZN":  "AMZN",
  "JPM":      "JPM",  "SPY":      "SPY",  "QQQ":   "QQQ",
  "GLD":      "GLD",  "SLV":      "SLV",
};

interface YQuote { key: string; price: number; prev: number }

async function fetchYahoo(symbol: string): Promise<YQuote | null> {
  try {
    const res = await fetch(
      `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
      {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json() as {
      chart: { result?: { meta: { regularMarketPrice: number; chartPreviousClose?: number; previousClose?: number } }[] }
    };
    const meta = data.chart.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    const prev = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice;
    return { key: YF_SYMBOLS[symbol] ?? symbol, price: meta.regularMarketPrice, prev };
  } catch {
    return null;
  }
}

async function fetchMacro() {
  const cached = cGet<object>("macro");
  if (cached) return cached;

  const symbols = Object.keys(YF_SYMBOLS);
  const [fngResult, ...yahooResults] = await Promise.allSettled([
    fetch("https://api.alternative.me/fng/?limit=1&format=json", {
      signal: AbortSignal.timeout(6000),
    }).then(r => r.json()),
    ...symbols.map(sym => fetchYahoo(sym)),
  ]);

  const indices: Record<string, { price: number; chg: number }> = {};
  for (const r of yahooResults) {
    if (r.status === "fulfilled" && r.value) {
      const { key, price, prev } = r.value;
      const chg = prev > 0 ? ((price - prev) / prev) * 100 : 0;
      indices[key] = { price, chg };
    }
  }

  let fng = { value: 50, label: "Neutral" };
  if (fngResult.status === "fulfilled") {
    try {
      const d = fngResult.value as { data: { value: string; value_classification: string }[] };
      fng = { value: parseInt(d.data[0].value, 10), label: d.data[0].value_classification };
    } catch { /* use default */ }
  }

  const irx = indices["IRX"]?.price ?? 5.28;
  const fvx = indices["FVX"]?.price ?? 4.62;
  const tnx = indices["TNX"]?.price ?? 4.52;
  const tyx = indices["TYX"]?.price ?? 4.62;
  const yields = [
    { label: "1M",  rate: parseFloat((irx + 0.02).toFixed(3)) },
    { label: "3M",  rate: parseFloat(irx.toFixed(3)) },
    { label: "6M",  rate: parseFloat(((irx + tnx) / 2 - 0.1).toFixed(3)) },
    { label: "1Y",  rate: parseFloat(((irx + fvx) / 2 - 0.15).toFixed(3)) },
    { label: "2Y",  rate: parseFloat((fvx - 0.5 + (tnx - fvx) * 0.3).toFixed(3)) },
    { label: "5Y",  rate: parseFloat(fvx.toFixed(3)) },
    { label: "10Y", rate: parseFloat(tnx.toFixed(3)) },
    { label: "30Y", rate: parseFloat(tyx.toFixed(3)) },
  ];

  const result = { indices, fng, yields };
  cSet("macro", result, 60_000);
  return result;
}

// ─── BTC/ETH/SOL live technical analysis signals ─────────────────────────────
function computeRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let avgGain = 0, avgLoss = 0;
  for (let i = closes.length - period - 1; i < closes.length - 1; i++) {
    const diff = closes[i + 1]! - closes[i]!;
    if (diff > 0) avgGain += diff; else avgLoss -= diff;
  }
  avgGain /= period; avgLoss /= period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function buildEMA(closes: number[], span: number): number[] {
  if (closes.length === 0) return [];
  const k = 2 / (span + 1);
  const out: number[] = [closes[0]!];
  for (let i = 1; i < closes.length; i++) out.push(closes[i]! * k + out[i - 1]! * (1 - k));
  return out;
}

interface LiveSignal {
  symbol: string; label: string; close: number; change4h: number;
  rsi: number; ema9: number; ema21: number; ema50: number; ema200: number;
  emaCross: "golden" | "death" | null; aboveEma200: boolean; cvdBull: boolean;
  signal: string; signalEmoji: string; direction: "LONG" | "SHORT" | "NEUTRAL";
  score: number; support: number; resistance: number;
  distSupport: number; distResistance: number;
  tp1: number; tp2: number; sl: number; rr: string;
}

async function computeLiveSignals(): Promise<LiveSignal[]> {
  const cached = cGet<LiveSignal[]>("live-signals");
  if (cached) return cached;

  const pairs = [
    { symbol: "BTC/USDT", label: "Bitcoin",  instId: "BTC-USDT-SWAP" },
    { symbol: "ETH/USDT", label: "Ethereum", instId: "ETH-USDT-SWAP" },
    { symbol: "SOL/USDT", label: "Solana",   instId: "SOL-USDT-SWAP" },
  ];

  const results: LiveSignal[] = [];
  await Promise.allSettled(pairs.map(async ({ symbol, label, instId }) => {
    try {
      const r = await fetch(
        `https://www.okx.com/api/v5/market/candles?instId=${instId}&bar=4H&limit=250`,
        { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(9000) }
      );
      const json = await r.json() as { data: string[][] };
      const raw = (json.data ?? []).reverse();
      if (raw.length < 50) return;

      const closes = raw.map(c => parseFloat(c[4]!));
      const highs  = raw.map(c => parseFloat(c[2]!));
      const lows   = raw.map(c => parseFloat(c[3]!));

      const close    = closes.at(-1)!;
      const change4h = ((close - closes.at(-2)!) / closes.at(-2)!) * 100;

      const rsi      = computeRSI(closes);
      const ema9arr  = buildEMA(closes, 9);
      const ema21arr = buildEMA(closes, 21);
      const ema50arr = buildEMA(closes, 50);
      const ema200arr = buildEMA(closes, 200);

      const ema9   = ema9arr.at(-1)!;
      const ema21  = ema21arr.at(-1)!;
      const ema50  = ema50arr.at(-1)!;
      const ema200 = ema200arr.at(-1)!;

      const diffNow  = ema9arr.at(-1)! - ema21arr.at(-1)!;
      const diffPrev = ema9arr.at(-2)! - ema21arr.at(-2)!;
      const emaCross = diffPrev < 0 && diffNow > 0 ? "golden"
                     : diffPrev > 0 && diffNow < 0 ? "death" : null;

      const aboveEma200 = close > ema200;
      const cvd = raw.slice(-20).reduce((acc, c) => {
        const o = parseFloat(c[1]!), cl = parseFloat(c[4]!), v = parseFloat(c[5]!);
        return acc + (cl >= o ? v : -v);
      }, 0);
      const cvdBull = cvd > 0;

      const resistance = Math.max(...highs.slice(-20));
      const support    = Math.min(...lows.slice(-20));
      const distRes    = ((resistance - close) / close) * 100;
      const distSup    = ((close - support) / close) * 100;

      let score = 0;
      if      (rsi < 30) score += 2; else if (rsi < 45) score += 1;
      else if (rsi > 70) score -= 2; else if (rsi > 55) score -= 1;
      if (ema9 > ema21)            score += 1; else score -= 1;
      if (emaCross === "golden")   score += 2;
      else if (emaCross === "death") score -= 2;
      if (cvdBull)                 score += 1; else score -= 1;
      if (aboveEma200)             score += 1; else score -= 1;
      if (ema50 > ema200)          score += 1; else score -= 1;

      let direction: "LONG" | "SHORT" | "NEUTRAL";
      let signal: string, signalEmoji: string;
      if      (score >= 4)  { direction = "LONG";    signal = "COMPRA FUERTE"; signalEmoji = "🚀"; }
      else if (score >= 2)  { direction = "LONG";    signal = "COMPRA";        signalEmoji = "📈"; }
      else if (score <= -4) { direction = "SHORT";   signal = "VENTA FUERTE";  signalEmoji = "💥"; }
      else if (score <= -2) { direction = "SHORT";   signal = "VENTA";         signalEmoji = "📉"; }
      else                  { direction = "NEUTRAL"; signal = "NEUTRAL";       signalEmoji = "⚖️"; }

      const atr20 = raw.slice(-20).reduce((a, c) => a + parseFloat(c[2]!) - parseFloat(c[3]!), 0) / 20;
      let tp1: number, tp2: number, sl: number;
      if (direction !== "SHORT") {
        tp1 = parseFloat((close + atr20 * 1.5).toFixed(2));
        tp2 = parseFloat((close + atr20 * 3.0).toFixed(2));
        sl  = parseFloat((close - atr20 * 1.0).toFixed(2));
      } else {
        tp1 = parseFloat((close - atr20 * 1.5).toFixed(2));
        tp2 = parseFloat((close - atr20 * 3.0).toFixed(2));
        sl  = parseFloat((close + atr20 * 1.0).toFixed(2));
      }
      const rrNum = Math.abs((tp1 - close) / (close - sl));
      const rr    = `1:${rrNum.toFixed(1)}`;

      results.push({
        symbol, label, close: parseFloat(close.toFixed(2)),
        change4h: parseFloat(change4h.toFixed(2)),
        rsi: parseFloat(rsi.toFixed(1)),
        ema9: parseFloat(ema9.toFixed(2)), ema21: parseFloat(ema21.toFixed(2)),
        ema50: parseFloat(ema50.toFixed(2)), ema200: parseFloat(ema200.toFixed(2)),
        emaCross, aboveEma200, cvdBull,
        signal, signalEmoji, direction, score,
        support: parseFloat(support.toFixed(2)), resistance: parseFloat(resistance.toFixed(2)),
        distSupport: parseFloat(distSup.toFixed(2)), distResistance: parseFloat(distRes.toFixed(2)),
        tp1, tp2, sl, rr,
      });
    } catch { /* skip pair on error */ }
  }));

  cSet("live-signals", results, 15 * 60_000);
  return results;
}

// ─── Order Book — Kraken public API ──────────────────────────────────────
const KRAKEN_PAIRS: Record<string, string> = {
  BTC: "XBTUSD", ETH: "ETHUSD", SOL: "SOLUSDT",
};

async function fetchOrderBook(pair: string) {
  const key = `ob:${pair}`;
  const cached = cGet<object>(key);
  if (cached) return cached;

  const kPair = KRAKEN_PAIRS[pair.toUpperCase()] ?? "XBTUSD";
  const res = await fetch(`https://api.kraken.com/0/public/Depth?pair=${kPair}&count=12`, {
    signal: AbortSignal.timeout(6000),
  });
  const data = await res.json() as {
    result: Record<string, { bids: [string, string][]; asks: [string, string][] }>
  };
  const book = Object.values(data.result)[0];

  let bidTotal = 0;
  const bids = book.bids.map(([p, s]) => {
    const size = parseFloat(s);
    bidTotal += size;
    return { price: parseFloat(p), size: parseFloat(size.toFixed(4)), total: parseFloat(bidTotal.toFixed(4)) };
  });

  let askTotal = 0;
  const asks = book.asks.map(([p, s]) => {
    const size = parseFloat(s);
    askTotal += size;
    return { price: parseFloat(p), size: parseFloat(size.toFixed(4)), total: parseFloat(askTotal.toFixed(4)) };
  });

  const result = { bids, asks, pair: pair.toUpperCase(), ts: Date.now() };
  cSet(key, result, 10_000);
  return result;
}

// ─── CoinMarketCap — top 50 con datos completos ───────────────────────────
interface CmcCoin {
  id: number;
  symbol: string;
  name: string;
  cmc_rank: number;
  circulating_supply: number;
  quote: {
    USD: {
      price: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      market_cap: number;
      volume_24h: number;
    };
  };
}

interface CmcAsset {
  id: number;
  symbol: string;
  name: string;
  rank: number;
  price: number;
  chg1h: number;
  chg24h: number;
  chg7d: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  logo: string;
}

async function fetchCmc(): Promise<CmcAsset[]> {
  const cached = cGet<CmcAsset[]>("cmc");
  if (cached) return cached;

  const key = process.env["CMC_API_KEY"];
  if (!key) throw new Error("CMC_API_KEY not configured");

  const res = await fetch(
    "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest" +
    "?limit=50&convert=USD&aux=cmc_rank,circulating_supply",
    {
      headers: { "X-CMC_PRO_API_KEY": key, Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    }
  );
  const json = await res.json() as { data: CmcCoin[] };
  if (!json.data) throw new Error("CMC bad response");

  const assets: CmcAsset[] = json.data.map(c => ({
    id: c.id,
    symbol: c.symbol,
    name: c.name,
    rank: c.cmc_rank,
    price: c.quote.USD.price,
    chg1h: c.quote.USD.percent_change_1h,
    chg24h: c.quote.USD.percent_change_24h,
    chg7d: c.quote.USD.percent_change_7d,
    marketCap: c.quote.USD.market_cap,
    volume24h: c.quote.USD.volume_24h,
    circulatingSupply: c.circulating_supply,
    logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/${c.id}.png`,
  }));

  cSet("cmc", assets, 3 * 60_000);
  return assets;
}

// ─── Routes ──────────────────────────────────────────────────────────────
router.get("/market-data/cmc", async (req: Request, res: Response) => {
  try {
    res.json({ assets: await fetchCmc(), ts: Date.now() });
  } catch (err) {
    req.log.error({ err }, "market-data/cmc");
    res.status(502).json({ error: "upstream error" });
  }
});

router.get("/market-data/crypto", async (req: Request, res: Response) => {
  try {
    res.json({ assets: await fetchCrypto(), ts: Date.now() });
  } catch (err) {
    req.log.error({ err }, "market-data/crypto");
    res.status(502).json({ error: "upstream error" });
  }
});

router.get("/market-data/macro", async (req: Request, res: Response) => {
  try {
    res.json({ ...(await fetchMacro() as object), ts: Date.now() });
  } catch (err) {
    req.log.error({ err }, "market-data/macro");
    res.status(502).json({ error: "upstream error" });
  }
});

router.get("/market-data/orderbook/:pair", async (req: Request, res: Response) => {
  try {
    res.json(await fetchOrderBook(req.params["pair"] as string));
  } catch (err) {
    req.log.error({ err }, "market-data/orderbook");
    res.status(502).json({ error: "upstream error" });
  }
});

router.get("/market-data/live-signals", async (req: Request, res: Response) => {
  try {
    const signals = await computeLiveSignals();
    res.json({ ok: true, signals, cachedAt: new Date().toISOString(), timeframe: "4H" });
  } catch (err) {
    req.log.error({ err }, "market-data/live-signals");
    res.status(502).json({ error: "upstream error" });
  }
});

export default router;
