import { Router, type Request, type Response } from "express";

const router = Router();

// ── Symbols to analyse (top altcoins) ────────────────────────────────────────
const SYMBOLS = [
  { symbol: "BTCUSDT",   name: "Bitcoin",      icon: "₿",  color: "#f7931a" },
  { symbol: "ETHUSDT",   name: "Ethereum",     icon: "Ξ",  color: "#627eea" },
  { symbol: "SOLUSDT",   name: "Solana",       icon: "◎",  color: "#9945ff" },
  { symbol: "BNBUSDT",   name: "BNB",          icon: "⬡",  color: "#f3ba2f" },
  { symbol: "XRPUSDT",   name: "Ripple",       icon: "✕",  color: "#00aae4" },
  { symbol: "ADAUSDT",   name: "Cardano",      icon: "₳",  color: "#0033ad" },
  { symbol: "DOGEUSDT",  name: "Dogecoin",     icon: "Ð",  color: "#c2a633" },
  { symbol: "AVAXUSDT",  name: "Avalanche",    icon: "△",  color: "#e84142" },
  { symbol: "DOTUSDT",   name: "Polkadot",     icon: "⬤",  color: "#e6007a" },
  { symbol: "LINKUSDT",  name: "Chainlink",    icon: "🔗", color: "#375bd2" },
  { symbol: "LTCUSDT",   name: "Litecoin",     icon: "Ł",  color: "#bfbbbb" },
  { symbol: "UNIUSDT",   name: "Uniswap",      icon: "🦄", color: "#ff007a" },
  { symbol: "ATOMUSDT",  name: "Cosmos",       icon: "⚛",  color: "#2e3148" },
  { symbol: "NEARUSDT",  name: "NEAR",         icon: "Ⓝ",  color: "#00c08b" },
  { symbol: "APTUSDT",   name: "Aptos",        icon: "◆",  color: "#00b4ff" },
  { symbol: "ARBUSDT",   name: "Arbitrum",     icon: "🔷", color: "#12aaff" },
  { symbol: "OPUSDT",    name: "Optimism",     icon: "🔴", color: "#ff0420" },
  { symbol: "SUIUSDT",   name: "Sui",          icon: "💧", color: "#6fbcf0" },
  { symbol: "INJUSDT",   name: "Injective",    icon: "💉", color: "#00f2fe" },
  { symbol: "SEIUSDT",   name: "Sei",          icon: "⚡", color: "#ff4d00" },
  { symbol: "FETUSDT",   name: "Fetch.AI",     icon: "🤖", color: "#1f6eff" },
  { symbol: "AAVEUSDT",  name: "Aave",         icon: "👻", color: "#b6509e" },
];

// ── Technical indicator helpers ───────────────────────────────────────────────

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(...new Array(period - 1).fill(NaN), prev);
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

function rsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

interface Macd { macd: number; signal: number; histogram: number; prev_histogram: number; }
function macd(closes: number[]): Macd {
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]).filter(v => !isNaN(v));
  const signalLine = ema(macdLine, 9);
  const n = signalLine.length;
  const hist = macdLine[macdLine.length - 1] - signalLine[n - 1];
  const prevHist = macdLine[macdLine.length - 2] - signalLine[n - 2];
  return {
    macd: macdLine[macdLine.length - 1],
    signal: signalLine[n - 1],
    histogram: hist,
    prev_histogram: prevHist,
  };
}

function volumeSpike(volumes: number[]): number {
  if (volumes.length < 10) return 1;
  const avgVol = volumes.slice(-10, -1).reduce((a, b) => a + b, 0) / 9;
  return avgVol > 0 ? volumes[volumes.length - 1] / avgVol : 1;
}

// ── Binance klines fetch ──────────────────────────────────────────────────────
interface Kline { open: number; high: number; low: number; close: number; volume: number; }

async function fetchKlines(symbol: string, interval = "1h", limit = 60): Promise<Kline[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`Binance ${r.status}`);
  const raw = await r.json() as unknown[][];
  return raw.map(k => ({
    open:   parseFloat(k[1] as string),
    high:   parseFloat(k[2] as string),
    low:    parseFloat(k[3] as string),
    close:  parseFloat(k[4] as string),
    volume: parseFloat(k[5] as string),
  }));
}

// ── Signal scoring ────────────────────────────────────────────────────────────
interface AnalysedSignal {
  symbol: string; name: string; icon: string; color: string;
  direction: "LONG" | "SHORT";
  strength: "FUERTE" | "MODERADO" | "DÉBIL";
  strengthColor: string;
  entry: string; tp1: string; tp2: string; sl: string;
  rr: string;
  rsi: number; macdHistogram: number; macdCross: boolean;
  volumeSpike: number; ema20: number;
  indicators: string[];
  score: number;
  change1h: number;
}

async function analyseSymbol(meta: typeof SYMBOLS[0]): Promise<AnalysedSignal | null> {
  try {
    const klines = await fetchKlines(meta.symbol);
    if (klines.length < 40) return null;

    const closes  = klines.map(k => k.close);
    const volumes = klines.map(k => k.volume);
    const price   = closes[closes.length - 1];
    const change1h = closes.length >= 2
      ? ((closes[closes.length - 1] - closes[closes.length - 2]) / closes[closes.length - 2]) * 100
      : 0;

    const rsiVal    = rsi(closes);
    const macdVal   = macd(closes);
    const volSpike  = volumeSpike(volumes);
    const ema20Vals = ema(closes, 20);
    const ema20     = ema20Vals[ema20Vals.length - 1];
    const macdCross = macdVal.histogram > 0 && macdVal.prev_histogram <= 0 ||
                      macdVal.histogram < 0 && macdVal.prev_histogram >= 0;

    let bullScore = 0, bearScore = 0;
    const indicators: string[] = [];

    if (rsiVal < 30)      { bullScore += 3; indicators.push(`RSI ${rsiVal.toFixed(0)} sobrevendido`); }
    else if (rsiVal < 45) { bullScore += 1; indicators.push(`RSI ${rsiVal.toFixed(0)} neutral-bajo`); }
    else if (rsiVal > 70) { bearScore += 3; indicators.push(`RSI ${rsiVal.toFixed(0)} sobrecomprado`); }
    else if (rsiVal > 55) { bearScore += 1; indicators.push(`RSI ${rsiVal.toFixed(0)} neutral-alto`); }

    if (macdVal.histogram > 0 && macdVal.prev_histogram <= 0) { bullScore += 3; indicators.push("MACD cruce alcista ▲"); }
    else if (macdVal.histogram > 0) { bullScore += 1; indicators.push("MACD histograma positivo"); }
    else if (macdVal.histogram < 0 && macdVal.prev_histogram >= 0) { bearScore += 3; indicators.push("MACD cruce bajista ▼"); }
    else if (macdVal.histogram < 0) { bearScore += 1; indicators.push("MACD histograma negativo"); }

    if (price > ema20 * 1.02)       { bullScore += 1; indicators.push("Precio > EMA20"); }
    else if (price < ema20 * 0.98)  { bearScore += 1; indicators.push("Precio < EMA20"); }

    if (volSpike > 2.5)  { (bullScore > bearScore ? bullScore : bearScore) && indicators.push(`Volumen ×${volSpike.toFixed(1)} (spike)`); }

    const totalScore = Math.max(bullScore, bearScore);
    if (totalScore < 3) return null;

    const direction: "LONG" | "SHORT" = bullScore >= bearScore ? "LONG" : "SHORT";
    const score = totalScore;

    const strength: "FUERTE" | "MODERADO" | "DÉBIL" =
      score >= 5 ? "FUERTE" : score >= 3 ? "MODERADO" : "DÉBIL";
    const strengthColor = strength === "FUERTE" ? "#00e676" : strength === "MODERADO" ? "#ffd700" : "#ff6d00";

    const tp1Pct = direction === "LONG" ? 1.035 : 0.965;
    const tp2Pct = direction === "LONG" ? 1.075 : 0.925;
    const slPct  = direction === "LONG" ? 0.975 : 1.025;

    const fmt = (v: number) => v < 0.01 ? v.toFixed(6) : v < 1 ? v.toFixed(4) : v < 100 ? v.toFixed(2) : v.toFixed(0);

    return {
      symbol: meta.symbol, name: meta.name, icon: meta.icon, color: meta.color,
      direction, strength, strengthColor,
      entry: fmt(price),
      tp1:   fmt(price * tp1Pct),
      tp2:   fmt(price * tp2Pct),
      sl:    fmt(price * slPct),
      rr: direction === "LONG" ? "1:" + ((price * tp1Pct - price) / (price - price * slPct)).toFixed(1)
                                : "1:" + ((price - price * tp1Pct) / (price * slPct - price)).toFixed(1),
      rsi: parseFloat(rsiVal.toFixed(1)),
      macdHistogram: parseFloat(macdVal.histogram.toFixed(6)),
      macdCross,
      volumeSpike: parseFloat(volSpike.toFixed(2)),
      ema20: parseFloat(ema20.toFixed(fmt(ema20).includes(".") ? fmt(ema20).split(".")[1].length : 0)),
      indicators,
      score,
      change1h: parseFloat(change1h.toFixed(2)),
    };
  } catch {
    return null;
  }
}

// ── Simple 5-minute cache ─────────────────────────────────────────────────────
let cache: { signals: AnalysedSignal[]; at: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

// ── GET /api/altcoin-signals ──────────────────────────────────────────────────
router.get("/altcoin-signals", async (_req: Request, res: Response) => {
  if (cache && Date.now() - cache.at < CACHE_TTL) {
    res.setHeader("X-Cache", "HIT");
    res.json({ signals: cache.signals, cachedAt: new Date(cache.at).toISOString(), source: "real_ta" });
    return;
  }

  try {
    const results = await Promise.allSettled(SYMBOLS.map(analyseSymbol));
    const signals = results
      .filter((r): r is PromiseFulfilledResult<AnalysedSignal> => r.status === "fulfilled" && r.value !== null)
      .map(r => r.value)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    cache = { signals, at: Date.now() };
    res.setHeader("X-Cache", "MISS");
    res.json({ signals, cachedAt: new Date().toISOString(), source: "real_ta" });
  } catch (err) {
    res.status(502).json({ error: "Error al calcular señales", detail: String(err) });
  }
});

export default router;
