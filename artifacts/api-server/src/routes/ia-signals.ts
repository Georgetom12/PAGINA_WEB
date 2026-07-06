/**
 * PSYCHOMETRIKS INTELLIGENT AI TRADING — Señales confirmadas
 * ─────────────────────────────────────────────────────────────────────────────
 * Copia de altcoin-signals.ts (no se toca el original — sigue alimentando
 * la página y el bot de Telegram existentes sin cambios).
 *
 * Diferencia: cada señal clásica (RSI/MACD/EMA/SMC de corto plazo) se
 * contrasta contra el veredicto multi-timeframe del motor de IA Trading.
 * Solo se muestran las señales donde AMBOS coinciden en dirección — el
 * resultado es una lista más corta, pero de mayor confianza.
 */
import { Router, type Request, type Response } from "express";
import { logger } from "../lib/logger";

const router = Router();

// ─── IA TRADING (interno) ──────────────────────────────────────────────────
const IA_TRADING_URL = process.env["IA_TRADING_URL"];
const IA_TRADING_SECRET = process.env["IA_TRADING_INTERNAL_SECRET"];

interface IaVerdict {
  direccion: "ALCISTA" | "BAJISTA" | "NEUTRAL";
  confianza: number;
  accion: "ENTRAR" | "ESPERAR" | "EVITAR";
  dictamen: string;
  patron: string;
}

async function consultarIaTrading(symbol: string): Promise<IaVerdict | null> {
  if (!IA_TRADING_URL || !IA_TRADING_SECRET) return null;
  try {
    const r = await fetch(`${IA_TRADING_URL}/api/analizar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": IA_TRADING_SECRET,
      },
      body: JSON.stringify({ symbol }),
    });
    if (!r.ok) return null;
    const data = await r.json() as {
      dictamen?: {
        direccion: string; confianza: number; accion: string;
        dictamen: string;
      };
      nucleo?: { fractal_pro_patron?: string; fractal_tipo?: string };
    };
    if (!data.dictamen) return null;
    return {
      direccion: data.dictamen.direccion as IaVerdict["direccion"],
      confianza: data.dictamen.confianza,
      accion: data.dictamen.accion as IaVerdict["accion"],
      dictamen: data.dictamen.dictamen,
      patron: data.nucleo?.fractal_pro_patron !== "NINGUNO"
        ? (data.nucleo?.fractal_pro_patron ?? "")
        : (data.nucleo?.fractal_tipo ?? ""),
    };
  } catch (err) {
    logger.warn({ err, symbol }, "consultarIaTrading failed");
    return null;
  }
}

// ─── CACHE ────────────────────────────────────────────────────────────────────
const _c = new Map<string, { data: unknown; exp: number }>();
function cGet<T>(k: string): T | null { const e = _c.get(k); return e && Date.now() < e.exp ? e.data as T : null; }
function cSet<T>(k: string, d: T, ms: number) { _c.set(k, { data: d, exp: Date.now() + ms }); }

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface OHLCV { time: number; open: number; high: number; low: number; close: number; volume: number; }

export interface AltcoinSignal {
  symbol: string; name: string; icon: string; color: string;
  direction: "LONG" | "SHORT";
  strength: "FUERTE" | "MODERADO" | "DÉBIL";
  strengthColor: string;
  entry: string; tp1: string; tp2: string; tp3: string; sl: string; rr: string;
  // Momentum
  rsi1h: number; rsi4h: number;
  rsiDiv: "BULLISH_DIV" | "BEARISH_DIV" | "NONE";
  stochK: number; stochD: number;
  macdHistogram: number; macdCross: boolean; macdDir: "BULLISH" | "BEARISH" | "NEUTRAL";
  volumeSpike: number;
  cvdTrend: "BULLISH" | "BEARISH";
  // Higher TF
  htfBias: "BULLISH" | "BEARISH" | "NEUTRAL";
  struct4h: "BULLISH" | "BEARISH" | "NEUTRAL";
  // SMC
  fvg: "BULLISH" | "BEARISH" | null;
  sweep: "BULLISH" | "BEARISH" | null;
  orderBlock: "BULLISH" | "BEARISH" | null;
  bos: "BULLISH" | "BEARISH" | null;
  zone: "PREMIUM" | "DISCOUNT" | "EQUILIBRIUM";
  nearSR: "SUPPORT" | "RESISTANCE" | null;
  // Fibonacci
  swingHigh: string; swingLow: string;
  fib382: string; fib500: string; fib618: string; fib786: string;
  fib1272: string; fib1618: string;
  // Market data
  fundingRate: number;
  oiChange24h: number;
  // Meta
  indicators: string[];
  score: number;
  change1h: number;
  // IA Trading (confirmación multi-timeframe) — se agrega después de genSignal
  iaConfianza?: number;
  iaDictamen?: string;
  iaPatron?: string;
}

// ─── ASSETS (TOP 50) ──────────────────────────────────────────────────────────
const ASSETS = [
  { symbol: "SOLUSDT",   okx: "SOL-USDT",   name: "Solana",       icon: "◎",  color: "#9945ff", hasSwap: true  },
  { symbol: "BNBUSDT",   okx: "BNB-USDT",   name: "BNB",          icon: "⬡",  color: "#f3ba2f", hasSwap: true  },
  { symbol: "XRPUSDT",   okx: "XRP-USDT",   name: "Ripple",       icon: "✕",  color: "#00aae4", hasSwap: true  },
  { symbol: "ADAUSDT",   okx: "ADA-USDT",   name: "Cardano",      icon: "₳",  color: "#0033ad", hasSwap: true  },
  { symbol: "DOGEUSDT",  okx: "DOGE-USDT",  name: "Dogecoin",     icon: "Ð",  color: "#c2a633", hasSwap: true  },
  { symbol: "AVAXUSDT",  okx: "AVAX-USDT",  name: "Avalanche",    icon: "△",  color: "#e84142", hasSwap: true  },
  { symbol: "DOTUSDT",   okx: "DOT-USDT",   name: "Polkadot",     icon: "⬤",  color: "#e6007a", hasSwap: true  },
  { symbol: "MATICUSDT", okx: "MATIC-USDT", name: "Polygon",      icon: "⬡",  color: "#8247e5", hasSwap: true  },
  { symbol: "LINKUSDT",  okx: "LINK-USDT",  name: "Chainlink",    icon: "🔗", color: "#375bd2", hasSwap: true  },
  { symbol: "SHIBUSDT",  okx: "SHIB-USDT",  name: "Shiba Inu",    icon: "🐕", color: "#ff9800", hasSwap: true  },
  { symbol: "LTCUSDT",   okx: "LTC-USDT",   name: "Litecoin",     icon: "Ł",  color: "#bfbbbb", hasSwap: true  },
  { symbol: "UNIUSDT",   okx: "UNI-USDT",   name: "Uniswap",      icon: "🦄", color: "#ff007a", hasSwap: true  },
  { symbol: "ATOMUSDT",  okx: "ATOM-USDT",  name: "Cosmos",       icon: "⚛",  color: "#2e3148", hasSwap: true  },
  { symbol: "XLMUSDT",   okx: "XLM-USDT",   name: "Stellar",      icon: "✦",  color: "#7d00ff", hasSwap: true  },
  { symbol: "NEARUSDT",  okx: "NEAR-USDT",  name: "NEAR",         icon: "Ⓝ",  color: "#00c08b", hasSwap: true  },
  { symbol: "ALGOUSDT",  okx: "ALGO-USDT",  name: "Algorand",     icon: "◈",  color: "#00b4d8", hasSwap: true  },
  { symbol: "FILUSDT",   okx: "FIL-USDT",   name: "Filecoin",     icon: "⍟",  color: "#0090ff", hasSwap: true  },
  { symbol: "APTUSDT",   okx: "APT-USDT",   name: "Aptos",        icon: "◆",  color: "#00b4ff", hasSwap: true  },
  { symbol: "ARBUSDT",   okx: "ARB-USDT",   name: "Arbitrum",     icon: "🔷", color: "#12aaff", hasSwap: true  },
  { symbol: "OPUSDT",    okx: "OP-USDT",    name: "Optimism",     icon: "🔴", color: "#ff0420", hasSwap: true  },
  { symbol: "SUIUSDT",   okx: "SUI-USDT",   name: "Sui",          icon: "💧", color: "#6fbcf0", hasSwap: true  },
  { symbol: "INJUSDT",   okx: "INJ-USDT",   name: "Injective",    icon: "💉", color: "#00f2fe", hasSwap: true  },
  { symbol: "TIAUSDT",   okx: "TIA-USDT",   name: "Celestia",     icon: "🌐", color: "#7c3aed", hasSwap: true  },
  { symbol: "SEIUSDT",   okx: "SEI-USDT",   name: "Sei",          icon: "⚡", color: "#ff4d00", hasSwap: true  },
  { symbol: "RNDRUSDT",  okx: "RNDR-USDT",  name: "Render",       icon: "🖥",  color: "#ff4500", hasSwap: true  },
  { symbol: "FTMUSDT",   okx: "FTM-USDT",   name: "Fantom",       icon: "🔵", color: "#13b5ec", hasSwap: true  },
  { symbol: "SANDUSDT",  okx: "SAND-USDT",  name: "Sandbox",      icon: "🏖",  color: "#00adef", hasSwap: true  },
  { symbol: "MANAUSDT",  okx: "MANA-USDT",  name: "Decentraland", icon: "🌐", color: "#ff2d55", hasSwap: true  },
  { symbol: "AXSUSDT",   okx: "AXS-USDT",   name: "Axie Infinity",icon: "🐾", color: "#0055d4", hasSwap: true  },
  { symbol: "AAVEUSDT",  okx: "AAVE-USDT",  name: "Aave",         icon: "👻", color: "#b6509e", hasSwap: true  },
  { symbol: "MKRUSDT",   okx: "MKR-USDT",   name: "Maker",        icon: "🏛",  color: "#1aab9b", hasSwap: true  },
  { symbol: "CRVUSDT",   okx: "CRV-USDT",   name: "Curve",        icon: "〰",  color: "#00fa9a", hasSwap: true  },
  { symbol: "LDOUSDT",   okx: "LDO-USDT",   name: "Lido",         icon: "⚗",  color: "#00a3ff", hasSwap: true  },
  { symbol: "GRTUSDT",   okx: "GRT-USDT",   name: "The Graph",    icon: "📊", color: "#6f4cff", hasSwap: true  },
  { symbol: "IMXUSDT",   okx: "IMX-USDT",   name: "Immutable X",  icon: "🔷", color: "#00d4ff", hasSwap: true  },
  { symbol: "FLOKIUSDT", okx: "FLOKI-USDT", name: "Floki",        icon: "🐶", color: "#ff8c00", hasSwap: false },
  { symbol: "PEPEUSDT",  okx: "PEPE-USDT",  name: "Pepe",         icon: "🐸", color: "#00c853", hasSwap: true  },
  { symbol: "WIFUSDT",   okx: "WIF-USDT",   name: "dogwifhat",    icon: "🎩", color: "#c8a96e", hasSwap: true  },
  { symbol: "BONKUSDT",  okx: "BONK-USDT",  name: "Bonk",         icon: "🦴", color: "#f7931a", hasSwap: true  },
  { symbol: "FETUSDT",   okx: "FET-USDT",   name: "Fetch.AI",     icon: "🤖", color: "#1f6eff", hasSwap: true  },
  { symbol: "WLDUSDT",   okx: "WLD-USDT",   name: "Worldcoin",    icon: "🌍", color: "#00bcd4", hasSwap: true  },
  { symbol: "JUPUSDT",   okx: "JUP-USDT",   name: "Jupiter",      icon: "🪐", color: "#c27aff", hasSwap: true  },
  { symbol: "PENGUUSDT", okx: "PENGU-USDT", name: "Pengu",        icon: "🐧", color: "#00cfff", hasSwap: false },
  { symbol: "TRUMPUSDT", okx: "TRUMP-USDT", name: "Trump",        icon: "🇺🇸", color: "#ff1a1a", hasSwap: true },
  { symbol: "MOVEUSDT",  okx: "MOVE-USDT",  name: "Movement",     icon: "⚙",  color: "#a855f7", hasSwap: true  },
  { symbol: "HYPUSDT",   okx: "HYP-USDT",   name: "Hyperliquid",  icon: "⚡", color: "#00ff88", hasSwap: false },
  { symbol: "XAIUSDT",   okx: "XAI-USDT",   name: "Xai",          icon: "🤖", color: "#ff4455", hasSwap: false },
  { symbol: "PIXELUSDT", okx: "PIXEL-USDT", name: "Pixels",       icon: "🎮", color: "#7fffd4", hasSwap: false },
  { symbol: "EIGENUSDT", okx: "EIGEN-USDT", name: "Eigenlayer",   icon: "🔑", color: "#6366f1", hasSwap: true  },
  { symbol: "ZENUSDT",   okx: "ZEN-USDT",   name: "Zen",          icon: "☯",  color: "#3a5f8a", hasSwap: false },
] as const;

// ─── INDICATOR FUNCTIONS ──────────────────────────────────────────────────────
function ema(vals: number[], p: number): number[] {
  const k = 2 / (p + 1); let prev = vals[0] ?? 0;
  return vals.map(v => { const e = v * k + prev * (1 - k); prev = e; return e; });
}

function rsiVal(closes: number[], p = 14): number {
  if (closes.length <= p + 1) return 50;
  let g = 0, l = 0;
  for (let i = 1; i <= p; i++) { const d = closes[i]! - closes[i-1]!; d > 0 ? (g += d) : (l -= d); }
  g /= p; l /= p;
  for (let i = p + 1; i < closes.length; i++) {
    const d = closes[i]! - closes[i-1]!;
    g = (g * (p-1) + Math.max(0, d)) / p;
    l = (l * (p-1) + Math.max(0, -d)) / p;
  }
  return l === 0 ? 100 : 100 - 100 / (1 + g / l);
}

function rsiArr(closes: number[], p = 14): number[] {
  const out: number[] = [];
  for (let i = p + 1; i <= closes.length; i++) out.push(rsiVal(closes.slice(0, i), p));
  return out.length ? out : [50];
}

function stochRsi(closes: number[], rsiP = 14, stochP = 14, smoothK = 3): { k: number; d: number } {
  const rsis = rsiArr(closes, rsiP);
  if (rsis.length < stochP) return { k: 50, d: 50 };
  const recent = rsis.slice(-stochP);
  const mn = Math.min(...recent), mx = Math.max(...recent);
  const raw = mx === mn ? 50 : ((rsis.at(-1)! - mn) / (mx - mn)) * 100;
  // Simple K without further smoothing (enough for signal generation)
  const kArr: number[] = [];
  for (let i = stochP - 1; i < rsis.length; i++) {
    const seg = rsis.slice(i - stochP + 1, i + 1);
    const mn2 = Math.min(...seg), mx2 = Math.max(...seg);
    kArr.push(mx2 === mn2 ? 50 : ((rsis[i]! - mn2) / (mx2 - mn2)) * 100);
  }
  const kSmooth = kArr.slice(-smoothK).reduce((a, b) => a + b, 0) / Math.min(smoothK, kArr.length);
  const dSmooth = kArr.slice(-smoothK * 2, -smoothK).reduce((a, b) => a + b, 0) / smoothK || kSmooth;
  void raw;
  return { k: Math.round(kSmooth), d: Math.round(dSmooth) };
}

function macdCalc(closes: number[]) {
  const f = ema(closes, 12), s = ema(closes, 26);
  const line = f.map((v, i) => v - (s[i] ?? 0));
  const sig = ema(line, 9);
  return { line, sig, hist: line.map((v, i) => v - (sig[i] ?? 0)) };
}

function atrVal(candles: OHLCV[], p = 14): number {
  if (candles.length < 2) return 0;
  const trs = candles.slice(1).map((c, i) => {
    const pc = candles[i]!.close;
    return Math.max(c.high - c.low, Math.abs(c.high - pc), Math.abs(c.low - pc));
  });
  let v = trs.slice(0, p).reduce((a, b) => a + b, 0) / p;
  for (let i = p; i < trs.length; i++) v = (v * (p-1) + trs[i]!) / p;
  return v;
}

function cvdTrend(candles: OHLCV[]): "BULLISH" | "BEARISH" {
  let cum = 0;
  const cvds = candles.map(c => { const r = c.high - c.low || 1; cum += c.volume * ((c.close - c.low) / r * 2 - 1); return cum; });
  return (cvds.at(-1) ?? 0) > (cvds.at(-10) ?? 0) ? "BULLISH" : "BEARISH";
}

function swingPoints(candles: OHLCV[], lb = 5) {
  const highs: { i: number; price: number }[] = [], lows: { i: number; price: number }[] = [];
  for (let i = lb; i < candles.length - lb; i++) {
    const w = candles.slice(i - lb, i + lb + 1);
    if (candles[i]!.high >= Math.max(...w.map(c => c.high))) highs.push({ i, price: candles[i]!.high });
    if (candles[i]!.low  <= Math.min(...w.map(c => c.low)))  lows.push({ i, price: candles[i]!.low });
  }
  return { highs, lows };
}

function structureTrend(candles: OHLCV[]): "BULLISH" | "BEARISH" | "NEUTRAL" {
  const r = candles.slice(-Math.min(20, candles.length));
  let hh = 0, hl = 0, lh = 0, ll = 0;
  for (let i = 1; i < r.length; i++) {
    r[i]!.high > r[i-1]!.high ? hh++ : lh++;
    r[i]!.low  > r[i-1]!.low  ? hl++ : ll++;
  }
  if (hh > lh && hl > ll) return "BULLISH";
  if (lh > hh && ll > hl) return "BEARISH";
  return "NEUTRAL";
}

function detectFVG(candles: OHLCV[]): { bullish: boolean; bearish: boolean } {
  let bullish = false, bearish = false;
  for (let i = 2; i < candles.length; i++) {
    const c0 = candles[i-2]!, c2 = candles[i]!;
    // Bullish FVG: gap up (c0.high < c2.low = price gap upward, no overlap)
    if (c0.high < c2.low) bullish = true;
    // Bearish FVG: gap down (c0.low > c2.high = price gap downward)
    if (c0.low > c2.high) bearish = true;
  }
  // Only care about recent FVGs (last 20 candles)
  let bRecent = false, beRecent = false;
  const recent = candles.slice(-20);
  for (let i = 2; i < recent.length; i++) {
    const c0 = recent[i-2]!, c2 = recent[i]!;
    if (c0.high < c2.low) bRecent = true;
    if (c0.low > c2.high) beRecent = true;
  }
  void bullish; void bearish;
  return { bullish: bRecent, bearish: beRecent };
}

function detectSweeps(candles: OHLCV[], swH: number, swL: number): { bullSweep: boolean; bearSweep: boolean } {
  // Look at last 10 candles for wick sweeps
  const last = candles.slice(-10);
  let bullSweep = false, bearSweep = false;
  for (const c of last) {
    // Bullish sweep: wick below swingLow but closes above it (liquidity grab, then recover)
    if (c.low < swL && c.close > swL) bullSweep = true;
    // Bearish sweep: wick above swingHigh but closes below it
    if (c.high > swH && c.close < swH) bearSweep = true;
  }
  return { bullSweep, bearSweep };
}

function detectSR(candles: OHLCV[], price: number): { nearSR: "SUPPORT" | "RESISTANCE" | null; support: number; resistance: number } {
  const { highs, lows } = swingPoints(candles, 4);
  const recentH = highs.slice(-5).map(h => h.price);
  const recentL = lows.slice(-5).map(l => l.price);
  const resistance = recentH.length ? Math.min(...recentH.filter(h => h > price)) || Math.max(...recentH) : price * 1.05;
  const support    = recentL.length ? Math.max(...recentL.filter(l => l < price)) || Math.min(...recentL) : price * 0.95;
  const distToRes  = Math.abs(resistance - price) / price;
  const distToSup  = Math.abs(price - support) / price;
  let nearSR: "SUPPORT" | "RESISTANCE" | null = null;
  if (distToSup < 0.015) nearSR = "SUPPORT";
  else if (distToRes < 0.015) nearSR = "RESISTANCE";
  return { nearSR, support, resistance };
}

function detectBOS(candles: OHLCV[]): { bullBOS: boolean; bearBOS: boolean; bullCHoCH: boolean; bearCHoCH: boolean } {
  const { highs, lows } = swingPoints(candles, 4);
  const price = candles.at(-1)!.close;
  let bullBOS = false, bearBOS = false, bullCHoCH = false, bearCHoCH = false;
  if (highs.length >= 2) {
    const prevH = highs.at(-2)!.price;
    if (price > prevH) bullBOS = true;
    // CHoCH: after a bearish structure (lower highs), price breaks above last high
    const st = structureTrend(candles.slice(-20));
    if (st === "BEARISH" && price > prevH) bullCHoCH = true;
  }
  if (lows.length >= 2) {
    const prevL = lows.at(-2)!.price;
    if (price < prevL) bearBOS = true;
    const st = structureTrend(candles.slice(-20));
    if (st === "BULLISH" && price < prevL) bearCHoCH = true;
  }
  return { bullBOS, bearBOS, bullCHoCH, bearCHoCH };
}

function detectOrderBlock(candles: OHLCV[]): "BULLISH" | "BEARISH" | null {
  const last = candles.slice(-8);
  const bullCandles = last.filter(c => c.close > c.open && (c.close - c.open) > (c.high - c.low) * 0.55);
  const bearCandles = last.filter(c => c.close < c.open && (c.open - c.close) > (c.high - c.low) * 0.55);
  if (bullCandles.length >= 2) return "BULLISH";
  if (bearCandles.length >= 2) return "BEARISH";
  return null;
}

function premiumDiscount(price: number, swH: number, swL: number): "PREMIUM" | "DISCOUNT" | "EQUILIBRIUM" {
  const mid = (swH + swL) / 2;
  if (price > mid * 1.02) return "PREMIUM";
  if (price < mid * 0.98) return "DISCOUNT";
  return "EQUILIBRIUM";
}

function candleCount(candles: OHLCV[]): { bull: number; bear: number } {
  const last = candles.slice(-8);
  if (last.length < 3) return { bull: 0, bear: 0 };
  let bull = 0, bear = 0;
  const c0 = last.at(-1)!, c1 = last.at(-2)!, c2 = last.at(-3)!;
  const bull0 = c0.close > c0.open, bull1 = c1.close > c1.open;
  const b0 = Math.abs(c0.close - c0.open), b1 = Math.abs(c1.close - c1.open);
  const r0 = c0.high - c0.low || 0.001, r1 = c1.high - c1.low || 0.001;
  const up0 = c0.high - Math.max(c0.open, c0.close), dn0 = Math.min(c0.open, c0.close) - c0.low;
  // Hammer
  if (dn0 > b0 * 2.5 && up0 < b0 * 0.4 && !bull1) bull++;
  // Shooting star
  if (up0 > b0 * 2.5 && dn0 < b0 * 0.4 && bull1) bear++;
  // Engulfing
  if (!bull1 && bull0 && c0.open < c1.close && c0.close > c1.open && b0 > b1) bull += 2;
  if (bull1 && !bull0 && c0.open > c1.close && c0.close < c1.open && b0 > b1) bear += 2;
  // Three soldiers / crows (simplified)
  if (last.length >= 3 && bull0 && bull1 && c2.close > c2.open) bull += 2;
  if (last.length >= 3 && !bull0 && !bull1 && c2.close < c2.open) bear += 2;
  // Body strength
  if (bull0 && b0 > r0 * 0.65) bull++;
  if (!bull0 && b0 > r0 * 0.65) bear++;
  void r1;
  return { bull: Math.min(bull, 4), bear: Math.min(bear, 4) };
}

// ─── OKX FETCH ────────────────────────────────────────────────────────────────
// ── OKX ──────────────────────────────────────────────────────────────────────
async function okxCandles(instId: string, bar: string, limit = 200): Promise<OHLCV[]> {
  const url = `https://www.okx.com/api/v5/market/candles?instId=${instId}&bar=${bar}&limit=${limit}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(9000) });
  const d = await r.json() as { data?: string[][] };
  if (!d.data?.length) return [];
  // OKX returns most-recent first → reverse to chronological
  return d.data.slice().reverse().map(row => ({
    time:   +row[0]!,
    open:   +row[1]!,
    high:   +row[2]!,
    low:    +row[3]!,
    close:  +row[4]!,
    volume: +row[5]!,
  }));
}

// ── KuCoin (fallback 1) ────────────────────────────────────────────────────────
// Format: SOL-USDT  |  bar: "1hour", "4hour"
// Response: [startAt, open, close, high, low, volume, amount] — newest first
async function kucoinCandles(instId: string, bar: string, limit = 200): Promise<OHLCV[]> {
  const barMap: Record<string, string> = { "1H": "1hour", "4H": "4hour" };
  const type = barMap[bar] ?? "1hour";
  const r = await fetch(
    `https://api.kucoin.com/api/v1/market/candles?symbol=${instId}&type=${type}&limit=${limit}`,
    { signal: AbortSignal.timeout(9000) }
  );
  const d = await r.json() as { data?: string[][] };
  if (!d.data?.length) return [];
  // KuCoin: newest first → reverse; cols: [startAt, open, close, high, low, vol, amount]
  return d.data.slice().reverse().map(row => ({
    time:   +row[0]! * 1000,
    open:   +row[1]!,
    close:  +row[2]!,
    high:   +row[3]!,
    low:    +row[4]!,
    volume: +row[5]!,
  }));
}

// ── Bybit (fallback 2) ────────────────────────────────────────────────────────
// Format: SOLUSDT  |  interval: "60", "240"
// Response: [time(ms), open, high, low, close, volume, turnover] — newest first
async function bybitCandles(symbol: string, bar: string, limit = 200): Promise<OHLCV[]> {
  const intMap: Record<string, string> = { "1H": "60", "4H": "240" };
  const interval = intMap[bar] ?? "60";
  const r = await fetch(
    `https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=${interval}&limit=${limit}`,
    { signal: AbortSignal.timeout(9000) }
  );
  const d = await r.json() as { result?: { list?: string[][] } };
  const list = d.result?.list ?? [];
  if (!list.length) return [];
  // Bybit: newest first → reverse; cols: [ts(ms), open, high, low, close, volume, turnover]
  return list.slice().reverse().map(row => ({
    time:   +row[0]!,
    open:   +row[1]!,
    high:   +row[2]!,
    low:    +row[3]!,
    close:  +row[4]!,
    volume: +row[5]!,
  }));
}

// ── Cadena de fallback: OKX → KuCoin → Bybit ─────────────────────────────────
async function fetchCandles(
  okxId: string,    // "SOL-USDT"
  binanceId: string, // "SOLUSDT"
  bar: string,
  limit = 200
): Promise<OHLCV[]> {
  // 1) OKX
  try {
    const c = await okxCandles(okxId, bar, limit);
    if (c.length >= 30) return c;
  } catch { /* OKX falló → siguiente */ }

  // 2) KuCoin
  try {
    const c = await kucoinCandles(okxId, bar, limit); // SOL-USDT format compatible
    if (c.length >= 30) return c;
  } catch { /* KuCoin falló → siguiente */ }

  // 3) Bybit
  try {
    const c = await bybitCandles(binanceId, bar, limit); // SOLUSDT format
    if (c.length >= 30) return c;
  } catch { /* todos fallaron */ }

  return [];
}

async function okxFunding(instId: string): Promise<number> {
  try {
    const r = await fetch(`https://www.okx.com/api/v5/public/funding-rate?instId=${instId}-SWAP`, { signal: AbortSignal.timeout(6000) });
    const d = await r.json() as { data?: { fundingRate?: string }[] };
    return parseFloat(d.data?.[0]?.fundingRate ?? "0");
  } catch { return 0; }
}

async function okxOI(instId: string): Promise<{ change24h: number }> {
  try {
    const [rNow, rHist] = await Promise.all([
      fetch(`https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=${instId}-SWAP`, { signal: AbortSignal.timeout(6000) }),
      fetch(`https://www.okx.com/api/v5/market/candles?instId=${instId}-SWAP&bar=1D&limit=2`, { signal: AbortSignal.timeout(6000) }),
    ]);
    const dNow  = await rNow.json()  as { data?: { oiUsd?: string }[] };
    const dHist = await rHist.json() as { data?: string[][] };
    const oiNow  = parseFloat(dNow.data?.[0]?.oiUsd ?? "0");
    const rows   = dHist.data ?? [];
    const oiPrev = rows.length > 1 ? parseFloat(rows[1]?.[5] ?? "0") * parseFloat(rows[1]?.[4] ?? "0") : oiNow;
    const change24h = oiPrev > 0 ? ((oiNow - oiPrev) / oiPrev) * 100 : 0;
    return { change24h };
  } catch { return { change24h: 0 }; }
}

// ─── FORMAT ───────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  if (!n || !isFinite(n)) return "—";
  if (n > 1000) return n.toLocaleString("en", { maximumFractionDigits: 2 });
  if (n > 1)    return n.toFixed(4);
  if (n > 0.01) return n.toFixed(6);
  return n.toFixed(8);
}

// ─── MAIN SIGNAL GENERATOR ────────────────────────────────────────────────────
async function genSignal(a: typeof ASSETS[number]): Promise<AltcoinSignal | null> {
  try {
    // Fetch candles + funding + OI in parallel
    const [c1h, c4h, funding, oi] = await Promise.all([
      fetchCandles(a.okx, a.symbol, "1H", 200),
      fetchCandles(a.okx, a.symbol, "4H", 100),
      a.hasSwap ? okxFunding(a.okx) : Promise.resolve(0),
      a.hasSwap ? okxOI(a.okx) : Promise.resolve({ change24h: 0 }),
    ]);

    if (c1h.length < 50) return null;

    const cl1h = c1h.map(c => c.close);
    const cl4h = c4h.length >= 26 ? c4h.map(c => c.close) : cl1h;
    const price = cl1h.at(-1)!;
    const prev  = cl1h.at(-2) ?? price;
    const change1h = prev > 0 ? +((price - prev) / prev * 100).toFixed(2) : 0;

    // ── EMA ─────────────────────────────────────────────────────────────────
    const e9   = ema(cl1h, 9).at(-1)!;
    const e21  = ema(cl1h, 21).at(-1)!;
    const e50  = ema(cl1h, 50).at(-1)!;
    const e200 = ema(cl1h, 200).at(-1) ?? ema(cl1h, cl1h.length).at(-1)!;

    // ── RSI ─────────────────────────────────────────────────────────────────
    const rArr1h = rsiArr(cl1h);
    const rArr4h = rsiArr(cl4h);
    const rsi1h  = +(rArr1h.at(-1) ?? 50).toFixed(1);
    const rsi4h  = +(rArr4h.at(-1) ?? 50).toFixed(1);
    // RSI divergence: compare last 8 candles
    const rsiPrev = rArr1h.at(-9) ?? rsi1h;
    const pxPrev  = cl1h.at(-9) ?? price;
    const rsiDiv: "BULLISH_DIV" | "BEARISH_DIV" | "NONE" =
      (price < pxPrev && rsi1h > rsiPrev) ? "BULLISH_DIV" :
      (price > pxPrev && rsi1h < rsiPrev) ? "BEARISH_DIV" : "NONE";

    // ── StochRSI ─────────────────────────────────────────────────────────────
    const stoch = stochRsi(cl1h);

    // ── MACD ─────────────────────────────────────────────────────────────────
    const m1h  = macdCalc(cl1h);
    const mH   = m1h.hist.at(-1) ?? 0;
    const mHP  = m1h.hist.at(-2) ?? 0;
    const macdCross = (mHP < 0 && mH > 0) || (mHP > 0 && mH < 0);
    const macdDir: "BULLISH" | "BEARISH" | "NEUTRAL" =
      (mHP < 0 && mH > 0) ? "BULLISH" : (mHP > 0 && mH < 0) ? "BEARISH" : "NEUTRAL";

    // ── CVD ──────────────────────────────────────────────────────────────────
    const cvd = cvdTrend(c1h.slice(-30));

    // ── Volume ───────────────────────────────────────────────────────────────
    const vols  = c1h.slice(-21, -1).map(c => c.volume);
    const avgV  = vols.reduce((a, b) => a + b, 0) / (vols.length || 1);
    const volSpike = +(c1h.at(-1)!.volume / (avgV || 1)).toFixed(2);

    // ── ATR ──────────────────────────────────────────────────────────────────
    const atr1h = atrVal(c1h);

    // ── Structure ────────────────────────────────────────────────────────────
    const struct1h = structureTrend(c1h.slice(-20));
    const struct4h = structureTrend(c4h.length >= 20 ? c4h.slice(-20) : c1h.slice(-20));
    const htfBias = struct4h;

    // ── Swings + Fibonacci ────────────────────────────────────────────────────
    const { highs, lows } = swingPoints(c1h.slice(-80), 5);
    const swH = highs.length ? highs.slice(-3).reduce((mx, h) => Math.max(mx, h.price), 0) : price * 1.10;
    const swLRaw = lows.length  ? lows.slice(-3).reduce((mn, l) => Math.min(mn, l.price), Infinity) : price * 0.90;
    const swL = isFinite(swLRaw) ? swLRaw : price * 0.90;
    const range = swH - swL;

    // ── SMC Detectors ────────────────────────────────────────────────────────
    const fvg      = detectFVG(c1h.slice(-30));
    const sweeps   = detectSweeps(c1h.slice(-15), swH, swL);
    const srInfo   = detectSR(c1h, price);
    const bos      = detectBOS(c1h.slice(-40));
    const ob       = detectOrderBlock(c1h.slice(-10));
    const zone     = premiumDiscount(price, swH, swL);
    const patterns = candleCount(c1h.slice(-8));

    // ── SCORING ───────────────────────────────────────────────────────────────
    let bullPts = 0, bearPts = 0;
    const inds: string[] = [];

    // EMA stack (max +3)
    if (e9 > e21 && e21 > e50) { bullPts += 2; inds.push("EMA 9>21>50 — alineación alcista ▲"); }
    if (e9 < e21 && e21 < e50) { bearPts += 2; inds.push("EMA 9<21<50 — alineación bajista ▼"); }
    if (price > e200) { bullPts += 1; inds.push("Precio > EMA200 — macro alcista"); }
    else              { bearPts += 1; inds.push("Precio < EMA200 — macro bajista"); }

    // RSI 1H (max +3 per side)
    if (rsi1h < 28)      { bullPts += 3; inds.push(`RSI 1H ${rsi1h} — SOBREVENTA extrema ▲`); }
    else if (rsi1h < 38) { bullPts += 2; inds.push(`RSI 1H ${rsi1h} — zona de sobreventa ▲`); }
    else if (rsi1h > 72) { bearPts += 3; inds.push(`RSI 1H ${rsi1h} — SOBRECOMPRA extrema ▼`); }
    else if (rsi1h > 62) { bearPts += 2; inds.push(`RSI 1H ${rsi1h} — zona de sobrecompra ▼`); }

    // RSI 4H (max +1)
    if (rsi4h < 45 && rsi4h > 25) { bullPts += 1; inds.push(`RSI 4H ${rsi4h} — momentum alcista`); }
    if (rsi4h > 55 && rsi4h < 75) { bearPts += 1; inds.push(`RSI 4H ${rsi4h} — momentum bajista`); }

    // RSI Divergence (max +3)
    if (rsiDiv === "BULLISH_DIV") { bullPts += 3; inds.push("Divergencia ALCISTA RSI — precio baja, RSI sube ▲"); }
    if (rsiDiv === "BEARISH_DIV") { bearPts += 3; inds.push("Divergencia BAJISTA RSI — precio sube, RSI baja ▼"); }

    // StochRSI (max +2)
    if (stoch.k < 15)      { bullPts += 2; inds.push(`StochRSI K=${stoch.k} — HIPERSOBREVENTA ▲`); }
    else if (stoch.k < 25) { bullPts += 1; inds.push(`StochRSI K=${stoch.k} — sobreventa ▲`); }
    if (stoch.k > 85)      { bearPts += 2; inds.push(`StochRSI K=${stoch.k} — HIPERSOBRECOMPRA ▼`); }
    else if (stoch.k > 75) { bearPts += 1; inds.push(`StochRSI K=${stoch.k} — sobrecompra ▼`); }

    // MACD (max +3)
    if (macdDir === "BULLISH") { bullPts += 3; inds.push("MACD cruce alcista — golden cross 1H ▲"); }
    if (macdDir === "BEARISH") { bearPts += 3; inds.push("MACD cruce bajista — death cross 1H ▼"); }
    if (mH > 0 && mH > mHP)   { bullPts += 1; inds.push("MACD histograma creciente — momentum positivo"); }
    if (mH < 0 && mH < mHP)   { bearPts += 1; inds.push("MACD histograma decreciente — momentum negativo"); }

    // CVD (max +1)
    cvd === "BULLISH" ? (bullPts += 1, inds.push("CVD positivo — compras netas dominando ▲")) : (bearPts += 1, inds.push("CVD negativo — ventas netas dominando ▼"));

    // Volume (max +2)
    if (volSpike > 2.5) { inds.push(`Volumen ×${volSpike} SPIKE EXTREMO — institucional entrando`); bullPts += 1; bearPts += 1; }
    else if (volSpike > 1.5) { inds.push(`Volumen ×${volSpike} spike`); }

    // Structure (max +2)
    if (struct4h === "BULLISH") { bullPts += 1; inds.push("Estructura 4H: HH/HL — tendencia alcista ▲"); }
    if (struct4h === "BEARISH") { bearPts += 1; inds.push("Estructura 4H: LH/LL — tendencia bajista ▼"); }

    // FVG (max +2)
    if (fvg.bullish)  { bullPts += 2; inds.push("Fair Value Gap ALCISTA — imán de precio ▲"); }
    if (fvg.bearish)  { bearPts += 2; inds.push("Fair Value Gap BAJISTA — imán de precio ▼"); }

    // Sweeps (max +3)
    if (sweeps.bullSweep) { bullPts += 3; inds.push("Liquidity SWEEP alcista — barrido de stops SHORT ▲"); }
    if (sweeps.bearSweep) { bearPts += 3; inds.push("Liquidity SWEEP bajista — barrido de stops LONG ▼"); }

    // Order Block (max +2)
    if (ob === "BULLISH") { bullPts += 2; inds.push("Order Block ALCISTA (ICT) — zona institucional de compra"); }
    if (ob === "BEARISH") { bearPts += 2; inds.push("Order Block BAJISTA (ICT) — zona institucional de venta"); }

    // BOS/CHoCH (max +2)
    if (bos.bullBOS || bos.bullCHoCH) { bullPts += 2; inds.push(bos.bullCHoCH ? "CHoCH ALCISTA — cambio de carácter ▲" : "BOS ALCISTA — ruptura de estructura ▲"); }
    if (bos.bearBOS || bos.bearCHoCH) { bearPts += 2; inds.push(bos.bearCHoCH ? "CHoCH BAJISTA — cambio de carácter ▼" : "BOS BAJISTA — ruptura de estructura ▼"); }

    // Premium/Discount (max +1)
    if (zone === "DISCOUNT") { bullPts += 1; inds.push("Zona DISCOUNT — precio en descuento institucional ▲"); }
    if (zone === "PREMIUM")  { bearPts += 1; inds.push("Zona PREMIUM — precio en premium institucional ▼"); }

    // S/R proximity (max +2)
    if (srInfo.nearSR === "SUPPORT")    { bullPts += 2; inds.push(`Precio en SOPORTE clave ~${fmt(srInfo.support)} ▲`); }
    if (srInfo.nearSR === "RESISTANCE") { bearPts += 2; inds.push(`Precio en RESISTENCIA clave ~${fmt(srInfo.resistance)} ▼`); }

    // Funding rate contrarian (max +2)
    if (funding < -0.0001) { bullPts += 2; inds.push(`Funding ${(funding*100).toFixed(4)}% — shorts pagando → squeeze posible ▲`); }
    if (funding > 0.0001)  { bearPts += 2; inds.push(`Funding +${(funding*100).toFixed(4)}% — longs pagando → liquidaciones posibles ▼`); }

    // OI Change (max +1)
    if (oi.change24h > 5)  { inds.push(`OI ▲ +${oi.change24h.toFixed(1)}% 24H — acumulación de posiciones`); }
    if (oi.change24h < -5) { inds.push(`OI ▼ ${oi.change24h.toFixed(1)}% 24H — cierre de posiciones`); }

    // Candle patterns (max +4)
    if (patterns.bull > 0) { bullPts += patterns.bull; inds.push(`${patterns.bull} patrón(es) vela ALCISTA detectado(s) ▲`); }
    if (patterns.bear > 0) { bearPts += patterns.bear; inds.push(`${patterns.bear} patrón(es) vela BAJISTA detectado(s) ▼`); }

    // ── DETERMINE DIRECTION ───────────────────────────────────────────────────
    const dir: "LONG" | "SHORT" = bullPts >= bearPts ? "LONG" : "SHORT";
    const domPts = Math.max(bullPts, bearPts);
    const MAX_PTS = 28;
    const scoreRaw = Math.min(10, Math.round((domPts / MAX_PTS) * 10));

    // Only emit signal if score >= 5/10
    if (scoreRaw < 5) return null;

    const strength: "FUERTE" | "MODERADO" | "DÉBIL" =
      scoreRaw >= 8 ? "FUERTE" : scoreRaw >= 6 ? "MODERADO" : "DÉBIL";
    const strengthColor = strength === "FUERTE" ? "#00e676" : strength === "MODERADO" ? "#ffd700" : "#7ab3c8";

    // ── FIBONACCI LEVELS ──────────────────────────────────────────────────────
    const fib382  = swL + range * 0.382;
    const fib500  = swL + range * 0.500;
    const fib618  = swL + range * 0.618;
    const fib786  = swL + range * 0.786;
    const fib1272 = swH + range * 0.272;
    const fib1618 = swH + range * 0.618;

    // ── ENTRY / TP / SL CALCULATION ───────────────────────────────────────────
    let entry = price;
    let tp1: number, tp2: number, tp3: number, sl: number;

    if (dir === "LONG") {
      // Entry: current price or near Golden Pocket if below it
      entry = price < fib618 ? fib618 : price;
      tp1   = fib786;
      tp2   = fib1272;
      tp3   = fib1618;
      sl    = swL - atr1h * 0.5;
    } else {
      // SHORT: entry current price (or near fib618 from below if price is above)
      const fib382s = swH - range * 0.382;
      const fib500s = swH - range * 0.500;
      entry = price > fib382s ? fib382s : price;
      tp1   = fib500s;
      tp2   = swL;
      tp3   = swL - range * 0.272;
      sl    = swH + atr1h * 0.5;
    }

    const rrNum = Math.abs(sl - entry) > 0 ? Math.abs(tp1 - entry) / Math.abs(sl - entry) : 0;

    return {
      symbol: a.symbol, name: a.name, icon: a.icon, color: a.color,
      direction: dir, strength, strengthColor,
      entry: fmt(entry), tp1: fmt(tp1), tp2: fmt(tp2), tp3: fmt(tp3), sl: fmt(sl),
      rr: `1:${rrNum.toFixed(2)}`,
      rsi1h, rsi4h, rsiDiv,
      stochK: stoch.k, stochD: stoch.d,
      macdHistogram: +mH.toFixed(8), macdCross, macdDir,
      volumeSpike: volSpike, cvdTrend: cvd,
      htfBias, struct4h,
      fvg: fvg.bullish ? "BULLISH" : fvg.bearish ? "BEARISH" : null,
      sweep: sweeps.bullSweep ? "BULLISH" : sweeps.bearSweep ? "BEARISH" : null,
      orderBlock: ob,
      bos: (bos.bullBOS || bos.bullCHoCH) ? "BULLISH" : (bos.bearBOS || bos.bearCHoCH) ? "BEARISH" : null,
      zone, nearSR: srInfo.nearSR,
      swingHigh: fmt(swH), swingLow: fmt(swL),
      fib382: fmt(fib382), fib500: fmt(fib500), fib618: fmt(fib618),
      fib786: fmt(fib786), fib1272: fmt(fib1272), fib1618: fmt(fib1618),
      fundingRate: +( funding * 100).toFixed(5),
      oiChange24h: +oi.change24h.toFixed(2),
      indicators: inds,
      score: scoreRaw,
      change1h,
    };
  } catch (err) {
    logger.warn({ err, asset: a.symbol }, "altcoin signal gen failed");
    return null;
  }
}

// ─── ROUTE ────────────────────────────────────────────────────────────────────
router.get("/ia-signals", async (_req: Request, res: Response) => {
  const cached = cGet<{ signals: AltcoinSignal[]; cachedAt: string }>("ia_signals_v1");
  if (cached) { res.json(cached); return; }

  try {
    // Paso 1: generar señales clásicas (igual que altcoin-signals.ts)
    const candidatas: AltcoinSignal[] = [];
    const assets = [...ASSETS];
    for (let i = 0; i < assets.length; i += 8) {
      const batch = assets.slice(i, i + 8);
      const results = await Promise.allSettled(batch.map(a => genSignal(a)));
      results.forEach(r => { if (r.status === "fulfilled" && r.value) candidatas.push(r.value); });
    }

    // Paso 2: contrastar cada candidata contra el veredicto del IA Trading
    // (en lotes de 4 — el análisis multi-timeframe es más pesado que un indicador simple)
    const confirmadas: AltcoinSignal[] = [];
    for (let i = 0; i < candidatas.length; i += 4) {
      const batch = candidatas.slice(i, i + 4);
      const veredictos = await Promise.allSettled(batch.map(s => consultarIaTrading(s.symbol)));

      veredictos.forEach((v, idx) => {
        if (v.status !== "fulfilled" || !v.value) return;
        const ia = v.value;
        const coincide =
          (batch[idx].direction === "LONG" && ia.direccion === "ALCISTA") ||
          (batch[idx].direction === "SHORT" && ia.direccion === "BAJISTA");

        if (coincide && ia.accion !== "EVITAR") {
          confirmadas.push({
            ...batch[idx],
            iaConfianza: ia.confianza,
            iaDictamen: ia.dictamen,
            iaPatron: ia.patron,
          });
        }
      });
    }

    // Ordenar: mayor confianza del IA Trading primero
    confirmadas.sort((a, b) => (b.iaConfianza ?? 0) - (a.iaConfianza ?? 0));

    const resp = { signals: confirmadas, cachedAt: new Date().toISOString() };
    cSet("ia_signals_v1", resp, 10 * 60_000);
    res.json(resp);
  } catch (err) {
    logger.error({ err }, "ia-signals error");
    res.json({ signals: [], cachedAt: new Date().toISOString() });
  }
});

export default router;
