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
    res.json(await fetchOrderBook(req.params.pair));
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

// ─── Volatilidad realizada cripto — reemplaza al viejo "Options" (necesitaba
// un feed de opciones pago que no tenemos). Mismo cálculo que ya se usa para
// acciones en psy-brain-live.ts, pero con velas de Binance para cripto.
const VOL_CRYPTO_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];
async function fetchBinanceCloses(symbol: string): Promise<number[]> {
  try {
    const r = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1d&limit=90`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return [];
    const d = await r.json() as unknown[][];
    return d.map(k => parseFloat(String(k[4])));
  } catch { return []; }
}
function volatilidadRealizadaCripto(closes: number[]): number | null {
  if (closes.length < 10) return null;
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) rets.push((closes[i]! - closes[i - 1]!) / closes[i - 1]!);
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, r) => a + (r - mean) ** 2, 0) / rets.length;
  return Math.sqrt(variance) * Math.sqrt(365) * 100; // cripto opera 365 días, no 252 como acciones
}

router.get("/market-data/crypto-volatility", async (req: Request, res: Response) => {
  try {
    const results = await Promise.all(VOL_CRYPTO_SYMBOLS.map(async sym => {
      const closes = await fetchBinanceCloses(sym);
      const vol = volatilidadRealizadaCripto(closes);
      const price = closes.at(-1) ?? null;
      const price7dAgo = closes.at(-8) ?? null;
      const chg7d = price != null && price7dAgo ? ((price - price7dAgo) / price7dAgo) * 100 : null;
      return { sym: sym.replace("USDT", ""), price, chg7d, volatilidadRealizada: vol };
    }));
    res.json({ ok: true, data: results.sort((a, b) => (b.volatilidadRealizada ?? 0) - (a.volatilidadRealizada ?? 0)), ts: Date.now() });
  } catch (err) {
    req.log.error({ err }, "market-data/crypto-volatility");
    res.status(502).json({ error: "upstream error" });
  }
});

// ─── FED WATCH — calculado con datos reales, no la API pagada de CME ──────
// Metodología pública (misma que usa la librería open-source pyfedwatch):
// el precio de los futuros de Fed Funds a 30 días (ticker ZQ) = 100 - tasa
// promedio esperada ese mes. En un mes SIN reunión FOMC, eso es directo. En
// un mes CON reunión, se resuelve la tasa post-reunión ponderando por días
// antes/después de la fecha de decisión dentro del mes.
// Fechas FOMC 2026 verificadas (Fed oficial): 28-29 ene, 17-18 mar, 28-29 abr,
// 16-17 jun, 28-29 jul, 15-16 sep, 27-28 oct, 8-9 dic. Decisión siempre el
// segundo día. Tasa actual (jul 2026): 3.50%–3.75% (punto medio 3.625%).
const FOMC_2026_DECISION_DAYS: Record<number, number> = { 1: 28, 3: 18, 4: 29, 6: 17, 7: 29, 9: 16, 10: 28, 12: 9 };
const CURRENT_FED_MIDPOINT = 3.625;

function zqTickerFor(year: number, month: number): string {
  const codes = ["F","G","H","J","K","M","N","Q","U","V","X","Z"]; // ene..dic
  return `ZQ${codes[month - 1]}${String(year).slice(-2)}=F`;
}

async function fetchZqPrice(ticker: string): Promise<number | null> {
  try {
    const r = await fetch(
      `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`,
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }, signal: AbortSignal.timeout(8000) },
    );
    if (!r.ok) return null;
    const d = await r.json() as { chart?: { result?: [{ meta?: { regularMarketPrice?: number } }] } };
    return d?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null;
  } catch { return null; }
}

// Calendario de ganancias real vía Alpha Vantage (gratis, CSV) — cuota muy
// chica (25 llamadas/día), por eso cache largo (12h)
let _earningsCache: { data: unknown; ts: number } | null = null;
router.get("/market-data/earnings-calendar", async (req: Request, res: Response) => {
  if (_earningsCache && Date.now() - _earningsCache.ts < 12 * 3_600_000) { res.json(_earningsCache.data); return; }
  const key = process.env["ALPHA_VANTAGE_KEY"];
  if (!key) { res.json({ ok: false, error: "ALPHA_VANTAGE_KEY no configurado", data: [] }); return; }
  try {
    const r = await fetch(`https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&horizon=3month&apikey=${key}`, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) { res.json({ ok: false, error: `Alpha Vantage respondió ${r.status}`, data: [] }); return; }
    const csv = await r.text();
    if (csv.includes("\"Information\"") || csv.includes("\"Note\"")) { res.json({ ok: false, error: "Cuota diaria de Alpha Vantage agotada", data: [] }); return; }
    const lines = csv.trim().split("\n");
    const rows = lines.slice(1).map(line => {
      const [symbol, name, reportDate, , estimate] = line.split(",");
      return { sym: symbol, name, date: reportDate, estimateEps: estimate && estimate !== "" ? parseFloat(estimate) : null };
    }).filter(r => r.sym && r.date);
    const payload = { ok: true, data: rows.slice(0, 30), ts: Date.now() };
    _earningsCache = { data: payload, ts: Date.now() };
    res.json(payload);
  } catch (err) {
    req.log.error({ err }, "market-data/earnings-calendar");
    res.json({ ok: false, error: "Error de red consultando Alpha Vantage", data: [] });
  }
});

// Indicadores económicos reales vía FRED (que ya recopila BLS + BEA en un
// solo lugar) — CPI y PCE se calculan como variación interanual (YoY),
// desempleo se toma directo (ya es %), PIB real como variación interanual.
const FRED_SERIES: Record<string, { id: string; tipo: "yoy_indice" | "directo" | "yoy_trimestral" }> = {
  cpi: { id: "CPIAUCSL", tipo: "yoy_indice" },       // BLS — CPI todos los consumidores urbanos
  desempleo: { id: "UNRATE", tipo: "directo" },       // BLS — tasa de desempleo
  pib: { id: "GDPC1", tipo: "yoy_trimestral" },       // BEA — PIB real
  pce: { id: "PCEPILFE", tipo: "yoy_indice" },        // BEA — PCE núcleo (el que la Fed más mira)
};

async function fetchFredSeries(seriesId: string, key: string, limit: number): Promise<Array<{ date: string; value: number }>> {
  const r = await fetch(
    `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${key}&file_type=json&sort_order=desc&limit=${limit}`,
    { signal: AbortSignal.timeout(8000) },
  );
  if (!r.ok) return [];
  const d = await r.json() as { observations?: Array<{ date: string; value: string }> };
  return (d.observations ?? [])
    .filter(o => o.value !== ".")
    .map(o => ({ date: o.date, value: parseFloat(o.value) }));
}

router.get("/market-data/econ-indicators", async (req: Request, res: Response) => {
  const key = process.env["FRED_API_KEY"];
  if (!key) { res.json({ ok: false, error: "FRED_API_KEY no configurado", data: {} }); return; }
  try {
    const resultados: Record<string, { valor: number; fecha: string; unidad: string } | null> = {};
    for (const [nombre, cfg] of Object.entries(FRED_SERIES)) {
      const obs = await fetchFredSeries(cfg.id, key, cfg.tipo === "yoy_trimestral" ? 6 : 14);
      if (cfg.tipo === "directo") {
        resultados[nombre] = obs[0] ? { valor: obs[0].value, fecha: obs[0].date, unidad: "%" } : null;
      } else if (cfg.tipo === "yoy_indice" && obs.length >= 13) {
        const yoy = ((obs[0]!.value - obs[12]!.value) / obs[12]!.value) * 100;
        resultados[nombre] = { valor: Math.round(yoy * 100) / 100, fecha: obs[0]!.date, unidad: "% interanual" };
      } else if (cfg.tipo === "yoy_trimestral" && obs.length >= 5) {
        const yoy = ((obs[0]!.value - obs[4]!.value) / obs[4]!.value) * 100;
        resultados[nombre] = { valor: Math.round(yoy * 100) / 100, fecha: obs[0]!.date, unidad: "% interanual" };
      } else {
        resultados[nombre] = null;
      }
    }
    res.json({ ok: true, data: resultados, ts: Date.now(), fuente: "FRED (recopila datos oficiales de BLS y BEA)" });
  } catch (err) {
    req.log.error({ err }, "market-data/econ-indicators");
    res.json({ ok: false, error: "Error consultando FRED", data: {} });
  }
});

router.get("/market-data/fed-watch", async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const meses = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
    const precios = await Promise.all(meses.map(m => fetchZqPrice(zqTickerFor(m.year, m.month))));
    const impliedRates = precios.map(p => (p !== null ? 100 - p : null));

    // Recorre mes a mes; si el mes tiene reunión, despeja la tasa post-decisión
    // ponderando por días antes/después dentro de ese mes calendario
    let tasaVigente = CURRENT_FED_MIDPOINT;
    const resultados: Array<{ mes: string; fecha_decision: string; tasa_antes: number; tasa_despues_implicita: number | null; cambio_bps: number | null }> = [];
    for (let i = 0; i < meses.length; i++) {
      const { year, month } = meses[i]!;
      const diaReunion = FOMC_2026_DECISION_DAYS[month];
      const impliedRate = impliedRates[i];
      if (!diaReunion || impliedRate === null) { continue; }
      const diasEnMes = new Date(year, month, 0).getDate();
      const pesoAntes = (diaReunion - 1) / diasEnMes;
      const pesoDespues = (diasEnMes - diaReunion + 1) / diasEnMes;
      const tasaDespues = pesoDespues > 0 ? (impliedRate - pesoAntes * tasaVigente) / pesoDespues : null;
      const cambioBps = tasaDespues !== null ? Math.round((tasaDespues - tasaVigente) * 100) : null;
      resultados.push({
        mes: `${year}-${String(month).padStart(2, "0")}`,
        fecha_decision: `${year}-${String(month).padStart(2, "0")}-${String(diaReunion).padStart(2, "0")}`,
        tasa_antes: Math.round(tasaVigente * 1000) / 1000,
        tasa_despues_implicita: tasaDespues !== null ? Math.round(tasaDespues * 1000) / 1000 : null,
        cambio_bps: cambioBps,
      });
      if (tasaDespues !== null) tasaVigente = tasaDespues;
    }
    res.json({ ok: true, data: resultados, ts: Date.now(), metodo: "Calculado de futuros ZQ reales (Yahoo) — mismo principio público que CME FedWatch, no es la API oficial de pago" });
  } catch (err) {
    req.log.error({ err }, "market-data/fed-watch");
    res.json({ ok: false, error: "Error calculando Fed Watch", data: [] });
  }
});

router.get("/market-data/econ-calendar", async (req: Request, res: Response) => {
  const key = process.env["FMP_API_KEY"];
  if (!key) { res.json({ ok: false, error: "FMP_API_KEY no configurado", data: [] }); return; }
  try {
    const today = new Date();
    const in14d = new Date(today.getTime() + 14 * 86400000);
    const from = today.toISOString().slice(0, 10), to = in14d.toISOString().slice(0, 10);
    const r = await fetch(`https://financialmodelingprep.com/api/v3/economic_calendar?from=${from}&to=${to}&apikey=${key}`, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) { res.json({ ok: false, error: `FMP respondió ${r.status} — probablemente no incluido en el plan actual`, data: [] }); return; }
    const d = await r.json() as Array<{ event: string; date: string; country: string; estimate: number | null; previous: number | null; impact: string }>;
    if (!Array.isArray(d)) { res.json({ ok: false, error: "Respuesta inesperada de FMP", data: [] }); return; }
    const relevantes = d
      .filter(e => e.country === "US" && e.impact !== "Low")
      .slice(0, 10)
      .map(e => ({ date: e.date, event: e.event, est: e.estimate, prev: e.previous, impact: e.impact }));
    res.json({ ok: true, data: relevantes, ts: Date.now() });
  } catch (err) {
    req.log.error({ err }, "market-data/econ-calendar");
    res.json({ ok: false, error: "Error de red consultando FMP", data: [] });
  }
});

// ─── Volumen relativo de ETFs (reemplaza "Capital Flow" que necesitaría datos
// de creación/redención reales — feed pago que no tenemos) ─────────────────
const ETF_VOLUME_SYMBOLS = ["QQQ", "SPY", "GLD", "IBIT", "SQQQ", "IEF"];

async function fetchYahooDailyHistory(symbol: string): Promise<{ closes: number[]; volumes: number[] }> {
  try {
    const r = await fetch(
      `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo`,
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }, signal: AbortSignal.timeout(10000) },
    );
    if (!r.ok) return { closes: [], volumes: [] };
    const d = await r.json() as { chart?: { result?: [{ indicators?: { quote?: [{ close?: (number|null)[]; volume?: (number|null)[] }] } }] } };
    const q = d?.chart?.result?.[0]?.indicators?.quote?.[0];
    const closes = (q?.close ?? []).filter((c): c is number => c !== null && c > 0);
    const volumes = (q?.volume ?? []).filter((v): v is number => v !== null && v >= 0);
    return { closes, volumes };
  } catch { return { closes: [], volumes: [] }; }
}

router.get("/market-data/etf-volume", async (req: Request, res: Response) => {
  try {
    const results = await Promise.all(ETF_VOLUME_SYMBOLS.map(async sym => {
      const { closes, volumes } = await fetchYahooDailyHistory(sym);
      if (closes.length < 2 || volumes.length < 15) return { name: sym, pct: 0, volRelativo: null };
      const pct = ((closes.at(-1)! - closes.at(-2)!) / closes.at(-2)!) * 100;
      const hoy = volumes.at(-1)!;
      const prev = volumes.slice(-21, -1);
      const avg = prev.reduce((a, b) => a + b, 0) / (prev.length || 1);
      const volRelativo = avg > 0 ? hoy / avg : null;
      return { name: sym, pct, volRelativo };
    }));
    res.json({ ok: true, data: results, ts: Date.now() });
  } catch (err) {
    req.log.error({ err }, "market-data/etf-volume");
    res.status(502).json({ error: "upstream error" });
  }
});

router.get("/market-data/fed-rate", async (req: Request, res: Response) => {
  const key = process.env["FRED_API_KEY"];
  if (!key) { res.json({ ok: false, error: "FRED_API_KEY no configurado" }); return; }
  try {
    const r = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DFEDTARU&api_key=${key}&file_type=json&sort_order=desc&limit=1`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!r.ok) { res.json({ ok: false, error: `FRED respondió ${r.status}` }); return; }
    const d = await r.json() as { observations?: Array<{ date: string; value: string }> };
    const obs = d.observations?.[0];
    if (!obs) { res.json({ ok: false, error: "Sin datos de FRED" }); return; }
    res.json({ ok: true, rate: parseFloat(obs.value), date: obs.date });
  } catch (err) {
    req.log.error({ err }, "market-data/fed-rate");
    res.json({ ok: false, error: "Error de red consultando FRED" });
  }
});

// PIB Real por Estado (BEA) — cuáles estados están creciendo más rápido.
// Dataset "Regional", tabla SAGDP9 (Real GDP by state), LineCode=1 (total).
router.get("/market-data/regional-gdp", async (req: Request, res: Response) => {
  const key = process.env["BEA_API_KEY"];
  if (!key) { res.json({ ok: false, error: "BEA_API_KEY no configurado", data: [] }); return; }
  try {
    const r = await fetch(
      `https://apps.bea.gov/api/data?UserID=${key}&method=GetData&datasetname=Regional&TableName=SAGDP9&LineCode=1&GeoFips=STATE&Year=LAST2&ResultFormat=JSON`,
      { signal: AbortSignal.timeout(12000) },
    );
    if (!r.ok) { res.json({ ok: false, error: `BEA respondió ${r.status}`, data: [] }); return; }
    const d = await r.json() as { BEAAPI?: { Results?: { Error?: { APIErrorDescription?: string }; Data?: Array<{ GeoName: string; TimePeriod: string; DataValue: string }> } } };
    const err = d?.BEAAPI?.Results?.Error;
    if (err) { res.json({ ok: false, error: err.APIErrorDescription ?? "Error de BEA", data: [] }); return; }
    const rows = d?.BEAAPI?.Results?.Data ?? [];
    if (!rows.length) { res.json({ ok: false, error: "Sin datos de BEA", data: [] }); return; }
    const byState = new Map<string, Array<{ year: string; val: number }>>();
    for (const row of rows) {
      if (row.GeoName === "United States") continue; // solo estados individuales
      const val = parseFloat(row.DataValue.replace(/,/g, ""));
      if (!byState.has(row.GeoName)) byState.set(row.GeoName, []);
      byState.get(row.GeoName)!.push({ year: row.TimePeriod, val });
    }
    const resultado = Array.from(byState.entries())
      .map(([estado, years]) => {
        const sorted = years.sort((a, b) => a.year.localeCompare(b.year));
        const anterior = sorted[0], actual = sorted.at(-1);
        if (!anterior || !actual || anterior === actual) return null;
        const cambioPct = ((actual.val - anterior.val) / anterior.val) * 100;
        return { estado, año: actual.year, cambioPct: Math.round(cambioPct * 100) / 100 };
      })
      .filter((x): x is { estado: string; año: string; cambioPct: number } => x !== null)
      .sort((a, b) => b.cambioPct - a.cambioPct);
    res.json({ ok: true, data: resultado, ts: Date.now(), fuente: "BEA — Real GDP by state (SAGDP9)" });
  } catch (err) {
    req.log.error({ err }, "market-data/regional-gdp");
    res.json({ ok: false, error: "Error consultando BEA", data: [] });
  }
});

export default router;
