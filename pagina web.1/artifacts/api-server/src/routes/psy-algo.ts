import { Router, type Request, type Response } from "express";
import { logger } from "../lib/logger";

const router = Router();

// ─── CACHE ────────────────────────────────────────────────────────────────────
const _c = new Map<string, { data: unknown; exp: number }>();
function cGet<T>(k: string): T | null { const e = _c.get(k); return e && Date.now() < e.exp ? (e.data as T) : null; }
function cSet<T>(k: string, d: T, ms: number) { _c.set(k, { data: d, exp: Date.now() + ms }); }

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface OHLCV { time: number; open: number; high: number; low: number; close: number; volume: number; }
export interface CandlePattern { name: string; type: "BULLISH" | "BEARISH" | "NEUTRAL"; timeframe: string; description: string; target?: number; strength: "FUERTE" | "MODERADO" | "DÉBIL"; }

// ─── INDICATORS ───────────────────────────────────────────────────────────────
export function ema(vals: number[], p: number): number[] {
  const k = 2 / (p + 1); let prev = vals[0] ?? 0;
  return vals.map(v => { const e = v * k + prev * (1 - k); prev = e; return e; });
}

export function rsi(closes: number[], p = 14): number {
  if (closes.length <= p + 1) return 50;
  let g = 0, l = 0;
  for (let i = 1; i <= p; i++) { const d = closes[i]! - closes[i - 1]!; d > 0 ? (g += d) : (l -= d); }
  g /= p; l /= p;
  for (let i = p + 1; i < closes.length; i++) {
    const d = closes[i]! - closes[i - 1]!;
    g = (g * (p - 1) + Math.max(0, d)) / p;
    l = (l * (p - 1) + Math.max(0, -d)) / p;
  }
  return l === 0 ? 100 : 100 - 100 / (1 + g / l);
}

export function rsiArr(closes: number[], p = 14): number[] {
  const out: number[] = [];
  for (let i = p + 1; i <= closes.length; i++) out.push(rsi(closes.slice(0, i), p));
  return out.length ? out : [50];
}

export function macdCalc(closes: number[]) {
  const f = ema(closes, 12), s = ema(closes, 26);
  const line = f.map((v, i) => v - (s[i] ?? 0));
  const sig = ema(line, 9);
  return { line, sig, hist: line.map((v, i) => v - (sig[i] ?? 0)) };
}

export function atr(candles: OHLCV[], p = 14): number {
  if (candles.length < 2) return 0;
  const trs = candles.slice(1).map((c, i) => {
    const pc = candles[i]!.close;
    return Math.max(c.high - c.low, Math.abs(c.high - pc), Math.abs(c.low - pc));
  });
  let v = trs.slice(0, p).reduce((a, b) => a + b, 0) / p;
  for (let i = p; i < trs.length; i++) v = (v * (p - 1) + trs[i]!) / p;
  return v;
}

export function cvd(candles: OHLCV[]): number[] {
  let cum = 0;
  return candles.map(c => { const r = c.high - c.low || 1; cum += c.volume * ((c.close - c.low) / r * 2 - 1); return cum; });
}

export function swings(candles: OHLCV[], lb = 5) {
  const highs: { i: number; price: number }[] = [], lows: { i: number; price: number }[] = [];
  for (let i = lb; i < candles.length - lb; i++) {
    const w = candles.slice(i - lb, i + lb + 1);
    if (candles[i]!.high >= Math.max(...w.map(c => c.high))) highs.push({ i, price: candles[i]!.high });
    if (candles[i]!.low  <= Math.min(...w.map(c => c.low)))  lows.push({ i, price: candles[i]!.low });
  }
  return { highs, lows };
}

export function fibLevels(swH: number, swL: number) {
  const r = swH - swL;
  return { swH, swL, f0: swL, f236: swL + r * 0.236, f382: swL + r * 0.382, f500: swL + r * 0.5, f618: swL + r * 0.618, f786: swL + r * 0.786, f1000: swH, f1272: swH + r * 0.272, f1618: swH + r * 0.618 };
}

export function structure(candles: OHLCV[]): "BULLISH" | "BEARISH" | "NEUTRAL" {
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

// ─── CANDLE PATTERN ENGINE ────────────────────────────────────────────────────
export function candlePatterns(cs: OHLCV[], tf: string): CandlePattern[] {
  const ps: CandlePattern[] = [];
  if (cs.length < 4) return ps;
  const c0 = cs.at(-1)!, c1 = cs.at(-2)!, c2 = cs.at(-3)!, c3 = cs.at(-4)!;
  const b0 = Math.abs(c0.close - c0.open), b1 = Math.abs(c1.close - c1.open), b2 = Math.abs(c2.close - c2.open);
  const r0 = c0.high - c0.low || 0.001, r1 = c1.high - c1.low || 0.001, r2 = c2.high - c2.low || 0.001;
  const up0 = c0.high - Math.max(c0.open, c0.close), dn0 = Math.min(c0.open, c0.close) - c0.low;
  const up1 = c1.high - Math.max(c1.open, c1.close), dn1 = Math.min(c1.open, c1.close) - c1.low;
  const bull0 = c0.close > c0.open, bull1 = c1.close > c1.open, bull2 = c2.close > c2.open;

  const add = (name: string, type: CandlePattern["type"], desc: string, strength: CandlePattern["strength"], target?: number) =>
    ps.push({ name, type, timeframe: tf, description: desc, strength, target });

  // ── SINGLE CANDLE ──────────────────────────────────────────────────────────
  if (b0 / r0 < 0.08)
    add("Doji", "NEUTRAL", "Indecisión perfecta — esperar confirmación de dirección", "DÉBIL");

  if (dn0 > b0 * 2.5 && up0 < b0 * 0.4 && !bull1)
    add("Martillo", "BULLISH", "Rechazo alcista de soporte — mecha inferior larga, potencial reversión LONG", "FUERTE");

  if (up0 > b0 * 2.5 && dn0 < b0 * 0.4 && bull1)
    add("Estrella Fugaz", "BEARISH", "Rechazo bajista de resistencia — mecha superior larga, potencial reversión SHORT", "FUERTE");

  if (dn0 > b0 * 2.5 && up0 < b0 * 0.4 && bull1)
    add("Hombre Colgado", "BEARISH", "Hammer en zona de resistencia — señal de agotamiento alcista", "MODERADO");

  if (up0 > b0 * 2.5 && dn0 < b0 * 0.4 && !bull1)
    add("Estrella Doji", "BULLISH", "Long-leg doji en zona de soporte — acumulación institucional", "MODERADO");

  // ── DOS VELAS ──────────────────────────────────────────────────────────────
  if (!bull1 && bull0 && c0.open < c1.close && c0.close > c1.open && b0 > b1)
    add("Envolvente Alcista", "BULLISH", "Vela alcista que engloba completamente la bajista — reversión LONG confirmada", "FUERTE");

  if (bull1 && !bull0 && c0.open > c1.close && c0.close < c1.open && b0 > b1)
    add("Envolvente Bajista", "BEARISH", "Vela bajista que engloba completamente la alcista — reversión SHORT confirmada", "FUERTE");

  if (!bull1 && bull0 && c0.open > c1.close && c0.close < c1.open && b0 < b1 * 0.5)
    add("Harami Alcista", "BULLISH", "Pequeña alcista contenida dentro de la bajista — desaceleración bajista, vigilar breakout", "MODERADO");

  if (bull1 && !bull0 && c0.open < c1.close && c0.close > c1.open && b0 < b1 * 0.5)
    add("Harami Bajista", "BEARISH", "Pequeña bajista contenida dentro de la alcista — desaceleración alcista, vigilar breakdown", "MODERADO");

  if (!bull1 && bull0 && c0.open < c1.low && c0.close > (c1.open + c1.close) / 2)
    add("Línea Penetrante", "BULLISH", "Alcista abre debajo del mínimo bajista y cierra arriba del 50% — fuerte compra", "MODERADO");

  if (bull1 && !bull0 && c0.open > c1.high && c0.close < (c1.open + c1.close) / 2)
    add("Nube Oscura", "BEARISH", "Bajista abre sobre el máximo alcista y cierra abajo del 50% — fuerte venta", "MODERADO");

  if (!bull1 && bull0 && Math.abs(c0.low - c1.low) / (c1.low || 1) < 0.002)
    add("Pinza Alcista (Tweezer)", "BULLISH", "Doble mínimo exacto — soporte institucional con entrada de compradores", "MODERADO");

  if (bull1 && !bull0 && Math.abs(c0.high - c1.high) / (c1.high || 1) < 0.002)
    add("Pinza Bajista (Tweezer)", "BEARISH", "Doble máximo exacto — resistencia institucional con entrada de vendedores", "MODERADO");

  if (!bull1 && bull0 && up1 > b1 * 2 && dn0 < b0 * 0.3)
    add("Bebé Abandonado Alcista", "BULLISH", "Gap bajista + estrella + alcista — reversión alcista de alta probabilidad", "FUERTE");

  if (bull1 && !bull0 && dn1 > b1 * 2 && up0 < b0 * 0.3)
    add("Bebé Abandonado Bajista", "BEARISH", "Gap alcista + estrella + bajista — reversión bajista de alta probabilidad", "FUERTE");

  // ── TRES VELAS ─────────────────────────────────────────────────────────────
  if (!bull2 && b2 > r2 * 0.5 && b1 / r1 < 0.25 && bull0 && c0.close > (c2.open + c2.close) / 2)
    add("Estrella Matutina", "BULLISH", "Bajista → indecisión → alcista fuerte. Patrón de reversión LONG de 3 velas", "FUERTE");

  if (bull2 && b2 > r2 * 0.5 && b1 / r1 < 0.25 && !bull0 && c0.close < (c2.open + c2.close) / 2)
    add("Estrella Vespertina", "BEARISH", "Alcista → indecisión → bajista fuerte. Patrón de reversión SHORT de 3 velas", "FUERTE");

  if (!bull2 && b2 > r2 * 0.5 && b1 / r1 < 0.15 && bull0)
    add("Estrella Doji Matutina", "BULLISH", "Estrella Matutina con Doji perfecto — reversión LONG de máxima confianza", "FUERTE");

  if (bull2 && b2 > r2 * 0.5 && b1 / r1 < 0.15 && !bull0)
    add("Estrella Doji Vespertina", "BEARISH", "Estrella Vespertina con Doji perfecto — reversión SHORT de máxima confianza", "FUERTE");

  if (bull0 && bull1 && bull2 && c0.close > c1.close && c1.close > c2.close && b0 > r0 * 0.5 && b1 > r1 * 0.5)
    add("Tres Soldados Blancos", "BULLISH", "Tres velas alcistas progresivas — momentum LONG extremadamente fuerte", "FUERTE");

  if (!bull0 && !bull1 && !bull2 && c0.close < c1.close && c1.close < c2.close && b0 > r0 * 0.5 && b1 > r1 * 0.5)
    add("Tres Cuervos Negros", "BEARISH", "Tres velas bajistas progresivas — momentum SHORT extremadamente fuerte", "FUERTE");

  if (bull2 && !bull1 && b1 < r1 * 0.3 && bull0 && c0.close > c2.high)
    add("Tres Métodos Alcistas", "BULLISH", "Alcista fuerte → pausa → ruptura alcista — continuación del impulso LONG", "MODERADO");

  if (!bull2 && bull1 && b1 < r1 * 0.3 && !bull0 && c0.close < c2.low)
    add("Tres Métodos Bajistas", "BEARISH", "Bajista fuerte → pausa → ruptura bajista — continuación del impulso SHORT", "MODERADO");

  void c3; // referenced for future patterns

  return ps;
}

// ─── CHART PATTERNS (multi-vela, macro) ───────────────────────────────────────
export function chartPatterns(candles: OHLCV[], tf: string, price: number): CandlePattern[] {
  const ps: CandlePattern[] = [];
  if (candles.length < 20) return ps;
  const { highs, lows } = swings(candles, 5);
  const rH = highs.slice(-6), rL = lows.slice(-6);
  const fmt = (n: number) => n.toLocaleString("en", { maximumFractionDigits: 0 });

  // ── DOBLE PISO (W) ────────────────────────────────────────────────────────
  if (rL.length >= 2) {
    const l1 = rL.at(-2)!, l2 = rL.at(-1)!;
    if (l2.i > l1.i + 3 && Math.abs(l1.price - l2.price) / l1.price < 0.03) {
      const nk = rH.filter(h => h.i > l1.i && h.i < l2.i);
      const neck = nk.length ? Math.max(...nk.map(h => h.price)) : price;
      const tgt = neck + (neck - l1.price);
      ps.push({ name: "Doble Piso (W)", type: "BULLISH", timeframe: tf, description: `Doble soporte en ~$${fmt(l1.price)}. Neckline: $${fmt(neck)}. Objetivo macro: $${fmt(tgt)}`, target: tgt, strength: "FUERTE" });
    }
  }

  // ── DOBLE TECHO (M) ───────────────────────────────────────────────────────
  if (rH.length >= 2) {
    const h1 = rH.at(-2)!, h2 = rH.at(-1)!;
    if (h2.i > h1.i + 3 && Math.abs(h1.price - h2.price) / h1.price < 0.03) {
      const nk = rL.filter(l => l.i > h1.i && l.i < h2.i);
      const neck = nk.length ? Math.min(...nk.map(l => l.price)) : price;
      const tgt = neck - (h1.price - neck);
      ps.push({ name: "Doble Techo (M)", type: "BEARISH", timeframe: tf, description: `Doble resistencia en ~$${fmt(h1.price)}. Neckline: $${fmt(neck)}. Objetivo macro: $${fmt(tgt)}`, target: tgt, strength: "FUERTE" });
    }
  }

  // ── TRIPLE PISO ───────────────────────────────────────────────────────────
  if (rL.length >= 3) {
    const [la, lb, lc] = [rL.at(-3)!, rL.at(-2)!, rL.at(-1)!];
    const avg = (la.price + lb.price + lc.price) / 3;
    if ([la, lb, lc].every(l => Math.abs(l.price - avg) / avg < 0.03)) {
      const tgt = avg * 1.18;
      ps.push({ name: "Triple Piso", type: "BULLISH", timeframe: tf, description: `Tres soportes en ~$${fmt(avg)}. Soporte EXTREMO — institucionales acumulando. Objetivo: $${fmt(tgt)}`, target: tgt, strength: "FUERTE" });
    }
  }

  // ── TRIPLE TECHO ──────────────────────────────────────────────────────────
  if (rH.length >= 3) {
    const [ha, hb, hc] = [rH.at(-3)!, rH.at(-2)!, rH.at(-1)!];
    const avg = (ha.price + hb.price + hc.price) / 3;
    if ([ha, hb, hc].every(h => Math.abs(h.price - avg) / avg < 0.03)) {
      const tgt = avg * 0.82;
      ps.push({ name: "Triple Techo", type: "BEARISH", timeframe: tf, description: `Tres resistencias en ~$${fmt(avg)}. Resistencia EXTREMA — distribución institucional. Objetivo: $${fmt(tgt)}`, target: tgt, strength: "FUERTE" });
    }
  }

  // ── HOMBRO CABEZA HOMBRO ──────────────────────────────────────────────────
  if (rH.length >= 3 && rL.length >= 2) {
    const [ls, head, rs] = [rH.at(-3)!, rH.at(-2)!, rH.at(-1)!];
    if (head.price > ls.price && head.price > rs.price && Math.abs(ls.price - rs.price) / ls.price < 0.06) {
      const nkLows = rL.filter(l => l.i > ls.i && l.i < rs.i);
      if (nkLows.length) {
        const neck = Math.min(...nkLows.map(l => l.price));
        const tgt = neck - (head.price - neck);
        ps.push({ name: "Hombro-Cabeza-Hombro", type: "BEARISH", timeframe: tf, description: `HCS confirmado. Cabeza: $${fmt(head.price)}. Neckline: $${fmt(neck)}. Objetivo bajista: $${fmt(tgt)}`, target: tgt, strength: "FUERTE" });
      }
    }
  }

  // ── HCS INVERTIDO ─────────────────────────────────────────────────────────
  if (rL.length >= 3 && rH.length >= 2) {
    const [ls, head, rs] = [rL.at(-3)!, rL.at(-2)!, rL.at(-1)!];
    if (head.price < ls.price && head.price < rs.price && Math.abs(ls.price - rs.price) / ls.price < 0.06) {
      const nkHighs = rH.filter(h => h.i > ls.i && h.i < rs.i);
      if (nkHighs.length) {
        const neck = Math.max(...nkHighs.map(h => h.price));
        const tgt = neck + (neck - head.price);
        ps.push({ name: "HCS Invertido", type: "BULLISH", timeframe: tf, description: `HCS Invertido confirmado. Cabeza: $${fmt(head.price)}. Neckline: $${fmt(neck)}. Objetivo alcista: $${fmt(tgt)}`, target: tgt, strength: "FUERTE" });
      }
    }
  }

  // ── TAZA Y ASA (Cup & Handle) ─────────────────────────────────────────────
  if (candles.length >= 40) {
    const seg = candles.slice(-40);
    const lH = Math.max(...seg.slice(0, 13).map(c => c.high));
    const bot = Math.min(...seg.slice(8, 32).map(c => c.low));
    const rH2 = Math.max(...seg.slice(27).map(c => c.high));
    const depth = (lH - bot) / lH;
    const rec = (rH2 - bot) / (lH - bot);
    if (depth >= 0.12 && depth <= 0.50 && rec >= 0.70) {
      const tgt = lH + (lH - bot);
      ps.push({ name: "Taza y Asa", type: "BULLISH", timeframe: tf, description: `Cup & Handle macro. Resistencia: $${fmt(lH)}. Profundidad ${(depth*100).toFixed(0)}%. Objetivo macro: $${fmt(tgt)}`, target: tgt, strength: "FUERTE" });
    }
  }

  // ── ONDA ABC ALCISTA (Elliott corrección) ─────────────────────────────────
  if (rH.length >= 1 && rL.length >= 2) {
    const h = rH.at(-1)!, lc2 = rL.at(-2)!, lc1 = rL.at(-1)!;
    if (h.i > lc2.i && lc1.i > h.i) {
      const ab = h.price - lc2.price;
      const bc = (h.price - lc1.price) / (ab || 1);
      if (bc >= 0.382 && bc <= 0.786 && lc1.price > lc2.price) {
        const tgt = h.price + ab * 0.618;
        ps.push({ name: "Onda ABC Alcista", type: "BULLISH", timeframe: tf, description: `Corrección ABC completa. Onda A=$${fmt(lc2.price)}→$${fmt(h.price)}, B retrace ${(bc*100).toFixed(0)}%. Target C: $${fmt(tgt)}`, target: tgt, strength: "MODERADO" });
      }
    }
  }

  // ── ONDA ABC BAJISTA ──────────────────────────────────────────────────────
  if (rL.length >= 1 && rH.length >= 2) {
    const l = rL.at(-1)!, hc2 = rH.at(-2)!, hc1 = rH.at(-1)!;
    if (l.i > hc2.i && hc1.i > l.i) {
      const ab = hc2.price - l.price;
      const bc = (hc1.price - l.price) / (ab || 1);
      if (bc >= 0.382 && bc <= 0.786 && hc1.price < hc2.price) {
        const tgt = l.price - ab * 0.618;
        ps.push({ name: "Onda ABC Bajista", type: "BEARISH", timeframe: tf, description: `Corrección ABC bajista completa. Target C bajista: $${fmt(tgt)}`, target: tgt, strength: "MODERADO" });
      }
    }
  }

  // ── XYZ / WXY CORRECCIÓN COMPLEJA ─────────────────────────────────────────
  const allPivots = [...rH.map(p => ({ ...p, t: "H" as const })), ...rL.map(p => ({ ...p, t: "L" as const }))]
    .sort((a, b) => a.i - b.i).slice(-8);
  if (allPivots.length >= 6) {
    let dn = 0, up = 0;
    for (let i = 1; i < allPivots.length; i++) allPivots[i]!.price < allPivots[i-1]!.price ? dn++ : up++;
    if (dn >= 3 && up >= 2) ps.push({ name: "WXY — Corrección Compleja Bajista", type: "BULLISH", timeframe: tf, description: "Tres ondas bajistas alternadas completas (W-X-Y). Alta prob. de reversión alcista desde aquí", strength: "MODERADO" });
    if (up >= 3 && dn >= 2) ps.push({ name: "WXY — Corrección Compleja Alcista", type: "BEARISH", timeframe: tf, description: "Tres ondas alcistas alternadas completas (W-X-Y). Alta prob. de reversión bajista desde aquí", strength: "MODERADO" });
  }

  // ── ORDER BLOCK (ICT) ─────────────────────────────────────────────────────
  if (candles.length >= 6) {
    const last6 = candles.slice(-6);
    const bullCandles = last6.filter(c => c.close > c.open && (c.close - c.open) > (c.high - c.low) * 0.55);
    const bearCandles = last6.filter(c => c.close < c.open && (c.open - c.close) > (c.high - c.low) * 0.55);
    if (bullCandles.length >= 2) {
      const ob = last6.find(c => c.close < c.open);
      if (ob) ps.push({ name: "Order Block Alcista (ICT)", type: "BULLISH", timeframe: tf, description: `OB institucional: $${fmt(ob.low)}-$${fmt(ob.high)}. Zona de recarga institucional — compras sobre este nivel`, strength: "FUERTE" });
    }
    if (bearCandles.length >= 2) {
      const ob = last6.find(c => c.close > c.open);
      if (ob) ps.push({ name: "Order Block Bajista (ICT)", type: "BEARISH", timeframe: tf, description: `OB institucional bajista: $${fmt(ob.low)}-$${fmt(ob.high)}. Zona de distribución — ventas bajo este nivel`, strength: "FUERTE" });
    }
  }

  // ── CUÑA ALCISTA ──────────────────────────────────────────────────────────
  if (rH.length >= 3 && rL.length >= 3) {
    const hSlope = (rH.at(-1)!.price - rH.at(-3)!.price) / (rH.at(-1)!.i - rH.at(-3)!.i || 1);
    const lSlope = (rL.at(-1)!.price - rL.at(-3)!.price) / (rL.at(-1)!.i - rL.at(-3)!.i || 1);
    if (hSlope > 0 && lSlope > 0 && lSlope > hSlope * 1.3) ps.push({ name: "Cuña Alcista (Bearish)", type: "BEARISH", timeframe: tf, description: "Cuña ascendente convergente — patrón bajista de continuación o distribución", strength: "MODERADO" });
    if (hSlope < 0 && lSlope < 0 && hSlope > lSlope * 1.3) ps.push({ name: "Cuña Bajista (Bullish)", type: "BULLISH", timeframe: tf, description: "Cuña descendente convergente — patrón alcista de acumulación", strength: "MODERADO" });
  }

  void price;
  return ps;
}

// ─── KRAKEN FETCH ─────────────────────────────────────────────────────────────
async function kraken(pair: string, interval: number, count = 200): Promise<OHLCV[]> {
  const r = await fetch(`https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=${interval}`, { signal: AbortSignal.timeout(10000) });
  const d = await r.json() as { result: Record<string, number[][]>; error: string[] };
  if (d.error?.length) throw new Error(d.error[0]);
  const key = Object.keys(d.result).find(k => k !== "last")!;
  return (d.result[key] ?? []).slice(-count).map(row => ({ time: +row[0]!, open: +row[1]!, high: +row[2]!, low: +row[3]!, close: +row[4]!, volume: +row[6]! }));
}

// ─── OPEN INTEREST ────────────────────────────────────────────────────────────
async function fetchOI(sym: string) {
  // ── OKX SWAP (instId: BTC-USD-SWAP / ETH-USD-SWAP / SOL-USD-SWAP) ────────────
  const instId = `${sym}-USD-SWAP`;
  try {
    // OI actual + OI hace 24H (candles diarias últimas 2)
    const [rOI, rHist] = await Promise.all([
      fetch(`https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=${instId}`, { signal: AbortSignal.timeout(8000) }),
      fetch(`https://www.okx.com/api/v5/market/candles?instId=${instId}&bar=1D&limit=2`, { signal: AbortSignal.timeout(8000) }),
    ]);
    const dOI   = await rOI.json()   as { data?: { oiUsd?: string; oi?: string }[] };
    // dHist: OKX open-interest history endpoint (instType=SWAP returns oi snapshots)
    const dHist = await rHist.json() as { data?: { oi?: string; oiUsd?: string; ts?: string }[] };

    const total = parseFloat(dOI.data?.[0]?.oiUsd ?? "0");
    // OI history: first entry = most recent, last = oldest
    const hist = dHist.data ?? [];
    const oiNow  = parseFloat(hist[0]?.oiUsd ?? "0");
    const oiPrev = parseFloat(hist[hist.length - 1]?.oiUsd ?? "0");
    const change24h = oiPrev > 0 ? ((oiNow - oiPrev) / oiPrev) * 100 : 0;

    if (total > 0) return { total, change24h };
  } catch { /* fall through */ }

  // ── CoinGlass fallback ────────────────────────────────────────────────────────
  try {
    const key = process.env["COINGLASS_API_KEY"] ?? "";
    if (!key) return { total: 0, change24h: 0 };
    const r = await fetch(`https://open-api.coinglass.com/public/v2/open_interest?symbol=${sym}&interval=0&limit=2`, { headers: { coinglassSecret: key }, signal: AbortSignal.timeout(8000) });
    const d = await r.json() as { data?: { openInterest?: number }[] };
    const now = d.data?.[0]?.openInterest ?? 0, prev = d.data?.[1]?.openInterest ?? now;
    return { total: now, change24h: prev ? ((now - prev) / prev) * 100 : 0 };
  } catch { return { total: 0, change24h: 0 }; }
}

// ─── ASSETS ───────────────────────────────────────────────────────────────────
const ASSETS = [
  { symbol: "BTC", krakenPair: "XBTUSD", name: "Bitcoin",  icon: "₿", color: "#f7931a" },
  { symbol: "ETH", krakenPair: "ETHUSD", name: "Ethereum", icon: "Ξ", color: "#627eea" },
  { symbol: "SOL", krakenPair: "SOLUSD", name: "Solana",   icon: "◎", color: "#9945ff" },
] as const;

// ─── SIGNAL GENERATOR ─────────────────────────────────────────────────────────
async function genSignal(a: typeof ASSETS[number]) {
  const [c1h, c4h, cW] = await Promise.all([
    kraken(a.krakenPair, 60, 200),
    kraken(a.krakenPair, 240, 100),
    kraken(a.krakenPair, 10080, 60),
  ]);

  const cl1h = c1h.map(c => c.close), cl4h = c4h.map(c => c.close);
  const price = cl1h.at(-1)!;

  // EMA
  const e9   = ema(cl1h, 9).at(-1)!,  e21  = ema(cl1h, 21).at(-1)!;
  const e50  = ema(cl4h, 50).at(-1)!, e200 = ema(cl4h, 200).at(-1)!;

  // RSI
  const rArr1h = rsiArr(cl1h), rArr4h = rsiArr(cl4h);
  const rsi1h = rArr1h.at(-1) ?? 50, rsi4h = rArr4h.at(-1) ?? 50;
  const rsi1hPrev5 = rArr1h.at(-6) ?? rsi1h;
  const pxPrev5 = cl1h.at(-6) ?? price;
  const rsiDiv = (price < pxPrev5 && rsi1h > rsi1hPrev5) ? "BULLISH_DIV" : (price > pxPrev5 && rsi1h < rsi1hPrev5) ? "BEARISH_DIV" : "NONE";

  // MACD 4H
  const m4 = macdCalc(cl4h);
  const mH = m4.hist.at(-1)!, mHP = m4.hist.at(-2) ?? 0;
  const macdX = mHP < 0 && mH > 0 ? "BULLISH" : mHP > 0 && mH < 0 ? "BEARISH" : "NONE";

  // CVD
  const cvd1h = cvd(c1h);
  const cvdTrend = (cvd1h.at(-1) ?? 0) > (cvd1h.at(-10) ?? 0) ? "BULLISH" : "BEARISH";

  // Volume spike
  const vols = c1h.slice(-21, -1).map(c => c.volume);
  const avgV = vols.reduce((a, b) => a + b, 0) / (vols.length || 1);
  const volSpike = (c1h.at(-1)!.volume) / (avgV || 1);

  // ATR, Structure, Fibonacci
  const atr4h = atr(c4h);
  const st4h = structure(c4h), stW = structure(cW);
  const { highs: H4, lows: L4 } = swings(c4h, 5);
  const swH = H4.slice(-3).reduce((a, b) => Math.max(a, b.price), 0) || price * 1.10;
  const swL = L4.slice(-3).reduce((a, b) => Math.min(a, b.price), Infinity);
  const swLow = isFinite(swL) ? swL : price * 0.90;
  const fibs = fibLevels(swH, swLow);

  // Open Interest
  const oi = await fetchOI(a.symbol);

  // All patterns
  const p1h = candlePatterns(c1h.slice(-8), "1H");
  const p4h = candlePatterns(c4h.slice(-8), "4H");
  const ch4h = chartPatterns(c4h, "4H", price);
  const chW  = chartPatterns(cW, "SEMANAL", price);
  const allP = [...p1h, ...p4h, ...ch4h, ...chW];

  // Macro targets from patterns
  const macroTargets = allP.filter(p => p.target && (p.timeframe === "SEMANAL" || p.timeframe === "4H"))
    .map(p => ({ label: p.name, price: p.target!, type: p.type }));

  // ── SCORING ───────────────────────────────────────────────────────────────
  let score = 0, dir: "LONG" | "SHORT" | "NEUTRAL" = "NEUTRAL";
  const inds: string[] = [];

  // EMA (max 3)
  if (e9 > e21 && e21 > e50)  { score += 2; dir = "LONG";  inds.push("EMA 9>21>50 — alineación alcista ▲"); }
  if (e9 < e21 && e21 < e50)  { score += 2; dir = "SHORT"; inds.push("EMA 9<21<50 — alineación bajista ▼"); }
  if (price > e200) { score += 1; inds.push("Precio > EMA 200 — macro alcista ▲"); }
  else              { score += 1; inds.push("Precio < EMA 200 — macro bajista ▼"); }

  // RSI (max 4)
  if (rsi4h > 55 && rsi4h < 75) { score += 1; inds.push(`RSI 4H ${rsi4h.toFixed(0)} — momentum alcista`); }
  if (rsi4h < 45 && rsi4h > 25) { score += 1; inds.push(`RSI 4H ${rsi4h.toFixed(0)} — momentum bajista`); }
  if (rsi1h < 30)  { score += 2; dir = "LONG";  inds.push(`RSI 1H ${rsi1h.toFixed(0)} — SOBREVENTA extrema ▲`); }
  if (rsi1h > 70)  { score += 2; dir = "SHORT"; inds.push(`RSI 1H ${rsi1h.toFixed(0)} — SOBRECOMPRA extrema ▼`); }
  if (rsiDiv === "BULLISH_DIV") { score += 3; dir = "LONG";  inds.push("Divergencia ALCISTA RSI — precio baja, RSI sube ▲"); }
  if (rsiDiv === "BEARISH_DIV") { score += 3; dir = "SHORT"; inds.push("Divergencia BAJISTA RSI — precio sube, RSI baja ▼"); }

  // MACD (max 3)
  if (macdX === "BULLISH") { score += 3; dir = "LONG";  inds.push("MACD cruce alcista 4H — golden cross ▲"); }
  if (macdX === "BEARISH") { score += 3; dir = "SHORT"; inds.push("MACD cruce bajista 4H — death cross ▼"); }
  if (mH > 0 && mH > mHP) { score += 1; inds.push("MACD histograma creciente — momentum positivo"); }
  if (mH < 0 && mH < mHP) { score += 1; inds.push("MACD histograma decreciente — momentum negativo"); }

  // CVD (max 1)
  cvdTrend === "BULLISH" ? (score += 1, inds.push("CVD positivo — compras netas dominando ▲")) : (score += 1, inds.push("CVD negativo — ventas netas dominando ▼"));

  // Volume (max 2)
  if (volSpike > 2.5)      { score += 2; inds.push(`Volumen ×${volSpike.toFixed(1)} SPIKE EXTREMO — institución entrando`); }
  else if (volSpike > 1.5) { score += 1; inds.push(`Volumen ×${volSpike.toFixed(1)} spike — acumulación/distribución`); }

  // Structure (max 2)
  if (st4h === "BULLISH") { score += 1; inds.push("Estructura 4H: HH/HL — tendencia alcista confirmada ▲"); }
  if (st4h === "BEARISH") { score += 1; inds.push("Estructura 4H: LH/LL — tendencia bajista confirmada ▼"); }
  if (stW === "BULLISH")  { score += 1; inds.push("Estructura SEMANAL: HH/HL — macro alcista ▲"); }
  if (stW === "BEARISH")  { score += 1; inds.push("Estructura SEMANAL: LH/LL — macro bajista ▼"); }

  // Patterns (max 4)
  const bullP = allP.filter(p => p.type === "BULLISH"), bearP = allP.filter(p => p.type === "BEARISH");
  if (bullP.length) { const pts = Math.min(bullP.length * 1.5, 4); score += pts; inds.push(`${bullP.length} patrón(es) ALCISTA(S) detectado(s)`); }
  if (bearP.length) { const pts = Math.min(bearP.length * 1.5, 4); score += pts; inds.push(`${bearP.length} patrón(es) BAJISTA(S) detectado(s)`); }

  // OI
  if (oi.total > 0 && oi.change24h > 5)  { score += 1; inds.push(`OI ▲ +${oi.change24h.toFixed(1)}% 24H — acumulación`); }
  if (oi.total > 0 && oi.change24h < -5) { score += 1; inds.push(`OI ▼ ${oi.change24h.toFixed(1)}% 24H — distribución`); }

  const scoreNorm = Math.round(Math.min(100, (score / 26) * 100));
  if (dir === "NEUTRAL") dir = bullP.length > bearP.length ? "LONG" : bearP.length > bullP.length ? "SHORT" : "NEUTRAL";
  const strength = scoreNorm >= 70 ? "FUERTE" : scoreNorm >= 45 ? "MODERADO" : "DÉBIL";

  // Entry / TP / SL
  let tp1 = price * 1.05, tp2 = price * 1.10, sl = price * 0.95;
  if (dir === "LONG") {
    tp1 = macroTargets.filter(t => t.type === "BULLISH")[0]?.price ?? fibs.f786;
    tp2 = macroTargets.filter(t => t.type === "BULLISH")[1]?.price ?? fibs.f1272;
    sl  = swLow - atr4h * 0.5;
  } else if (dir === "SHORT") {
    tp1 = macroTargets.filter(t => t.type === "BEARISH")[0]?.price ?? fibs.f382;
    tp2 = macroTargets.filter(t => t.type === "BEARISH")[1]?.price ?? (swLow - atr4h);
    sl  = swH + atr4h * 0.5;
  }

  const rrNum = Math.abs(sl - price) > 0 ? Math.abs(tp1 - price) / Math.abs(sl - price) : 0;
  const fmt2 = (n: number) => n.toLocaleString("en", { maximumFractionDigits: 2 });

  return {
    symbol: a.symbol, name: a.name, icon: a.icon, color: a.color,
    direction: dir, strength, score: scoreNorm,
    entry: fmt2(price), tp1: fmt2(tp1), tp2: fmt2(tp2), sl: fmt2(sl),
    rr: `1:${rrNum.toFixed(2)}`,
    currentPrice: fmt2(price),
    indicators: { rsi1h: rsi1h.toFixed(1), rsi4h: rsi4h.toFixed(1), rsiDivergence: rsiDiv, macdCross: macdX, macdHistogram: mH, cvdTrend, volumeSpike: volSpike.toFixed(2), struct4h: st4h, structWeekly: stW },
    openInterest: { total: oi.total, change24h: oi.change24h.toFixed(2) },
    fibonacci: { swingHigh: fmt2(swH), swingLow: fmt2(swLow), fib382: fmt2(fibs.f382), fib500: fmt2(fibs.f500), fib618: fmt2(fibs.f618), fib786: fmt2(fibs.f786), fib1272: fmt2(fibs.f1272) },
    patterns: allP, macroTargets, inds, updatedAt: Date.now(),
  };
}

// ─── GET /api/psy-algo/signals ─────────────────────────────────────────────────
// ── IA Trading (motor interno) — cruce de confirmación ─────────────────────
const IA_TRADING_URL = process.env["IA_TRADING_URL"];
const IA_TRADING_SECRET = process.env["IA_TRADING_INTERNAL_SECRET"];

async function consultarIaTrading(symbol: string): Promise<{
  direccion: string; confianza: number; accion: string; dictamen: string; patron: string;
} | null> {
  if (!IA_TRADING_URL || !IA_TRADING_SECRET) return null;
  try {
    const r = await fetch(`${IA_TRADING_URL}/api/analizar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Internal-Secret": IA_TRADING_SECRET },
      body: JSON.stringify({ symbol: `${symbol}USDT` }),
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return null;
    const data = await r.json() as {
      dictamen?: { direccion: string; confianza: number; accion: string; dictamen: string };
      nucleo?: { fractal_pro_patron?: string; fractal_tipo?: string };
    };
    if (!data.dictamen) return null;
    return {
      direccion: data.dictamen.direccion,
      confianza: data.dictamen.confianza,
      accion: data.dictamen.accion,
      dictamen: data.dictamen.dictamen,
      patron: data.nucleo?.fractal_pro_patron !== "NINGUNO" ? (data.nucleo?.fractal_pro_patron ?? "") : (data.nucleo?.fractal_tipo ?? ""),
    };
  } catch { return null; }
}

// ─── GET /api/psy-algo/signals ─────────────────────────────────────────────────
router.get("/psy-algo/signals", async (_req: Request, res: Response) => {
  const cached = cGet<unknown[]>("psy_algo_v3");
  if (cached) { res.json({ ok: true, signals: cached }); return; }
  try {
    const signals = await Promise.all(ASSETS.map(genSignal)) as Array<Record<string, unknown> & { symbol: string; direction: string }>;

    // Cruce con el motor IA Trading (en paralelo, sin bloquear si el motor
    // no responde — las señales clásicas siguen mostrándose igual)
    const iaResults = await Promise.all(signals.map(s => consultarIaTrading(s.symbol)));
    signals.forEach((s, i) => {
      const ia = iaResults[i];
      if (!ia) { s["iaConfirmado"] = null; return; }
      const direccionIa = ia.direccion === "ALCISTA" ? "LONG" : ia.direccion === "BAJISTA" ? "SHORT" : "NEUTRAL";
      s["iaConfianza"] = ia.confianza;
      s["iaDictamen"]  = ia.dictamen;
      s["iaPatron"]    = ia.patron;
      s["iaAccion"]    = ia.accion;
      s["iaConfirmado"] = direccionIa === s.direction && ia.accion !== "EVITAR";
    });

    cSet("psy_algo_v3", signals, 5 * 60_000);
    res.json({ ok: true, signals });
  } catch (err) { logger.error({ err }, "psy-algo error"); res.json({ ok: false, signals: [], error: String(err) }); }
});

// ─── GET /api/psy-algo/exchange-signals ───────────────────────────────────────
async function dydxMarket(mkt: string) {
  try {
    const r = await fetch("https://indexer.dydx.trade/v4/perpetualMarkets", { signal: AbortSignal.timeout(8000) });
    const d = await r.json() as { markets?: Record<string, { nextFundingRate?: string; openInterest?: string; oraclePrice?: string }> };
    const m = d.markets?.[mkt];
    if (!m) return null;
    const px = parseFloat(m.oraclePrice ?? "0"), oi = parseFloat(m.openInterest ?? "0") * px, fr = parseFloat(m.nextFundingRate ?? "0");
    return { exchange: "dYdX v4", price: px, oi, fundingRate: fr, fundingAnnual: fr * 8760 * 100 };
  } catch { return null; }
}

async function gmxMarket(sym: string) {
  try {
    const r = await fetch("https://arbitrum-api.gmxinfra.io/markets/info", { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const d = await r.json() as {
      markets?: Array<{
        name?: string;               // ej: "BTC/USD [WBTC.b-USDC]"
        openInterestLong?: string;   // uint, escala 1e30
        openInterestShort?: string;
        isListed?: boolean;
      }>;
    };
    if (!d.markets) return null;

    // El símbolo va al inicio de "name" (ej. "BTC/USD [...]" → "BTC").
    // Puede haber varios mercados (pools distintos) para la misma moneda —
    // se suman todos para tener el OI total real.
    const matching = d.markets.filter(x =>
      x.isListed !== false && x.name?.toUpperCase().startsWith(`${sym.toUpperCase()}/USD`)
    );
    if (matching.length === 0) return null;

    let lOI = 0, sOI = 0;
    for (const m of matching) {
      lOI += parseFloat(m.openInterestLong ?? "0") / 1e30;
      sOI += parseFloat(m.openInterestShort ?? "0") / 1e30;
    }
    const tot = lOI + sOI;
    if (tot === 0) return null;
    return { exchange: "GMX v2", oi: tot, longPct: (lOI/tot*100), shortPct: (sOI/tot*100) };
  } catch { return null; }
}

const DYDX: Record<string, string> = { BTC: "BTC-USD", ETH: "ETH-USD", SOL: "SOL-USD" };

router.get("/psy-algo/exchange-signals", async (_req: Request, res: Response) => {
  const cached = cGet<unknown[]>("psy_exchange_v2");
  if (cached) { res.json({ ok: true, signals: cached }); return; }
  try {
    const signals = await Promise.all(ASSETS.map(async a => {
      const [dd, gm] = await Promise.all([dydxMarket(DYDX[a.symbol]!), gmxMarket(a.symbol)]);
      const fr = dd?.fundingRate ?? 0;
      const totalOI = (dd?.oi ?? 0) + (gm?.oi ?? 0);
      const signal = fr < -0.00015 ? "LONG" : fr > 0.00015 ? "SHORT" : "NEUTRAL";
      const bias = fr < 0 ? "Shorts pagando — presión SHORT SQUEEZE posible" : fr > 0 ? "Longs pagando — posición sobrecargada" : "Funding balanceado — mercado equilibrado";
      return { symbol: a.symbol, name: a.name, icon: a.icon, color: a.color, signal, bias, fundingRate: (fr * 100).toFixed(5) + "%", fundingAnnual: (fr * 8760 * 100).toFixed(2) + "%", totalOI, dydx: dd, gmx: gm, updatedAt: Date.now() };
    }));
    cSet("psy_exchange_v2", signals, 3 * 60_000);
    res.json({ ok: true, signals });
  } catch (err) { logger.error({ err }, "exchange signals error"); res.json({ ok: false, signals: [] }); }
});

// ─── GET /api/psy-algo/squeeze-radar ──────────────────────────────────────────
async function binanceFR(sym: string) {
  try {
    const r = await fetch(`https://fapi.binance.com/fapi/v1/fundingRate?symbol=${sym}USDT&limit=3`, { signal: AbortSignal.timeout(8000) });
    const d = await r.json() as { fundingRate?: string }[];
    if (!Array.isArray(d) || !d.length) return null;
    return { exchange: "Binance", fundingRate: d.reduce((a, b) => a + parseFloat(b.fundingRate ?? "0"), 0) / d.length };
  } catch { return null; }
}

async function mexcFR(sym: string) {
  try {
    const r = await fetch(`https://contract.mexc.com/api/v1/contract/funding_rate/${sym}_USDT`, { signal: AbortSignal.timeout(8000) });
    const d = await r.json() as { data?: { fundingRate?: number } };
    const fr = d.data?.fundingRate; if (fr == null) return null;
    return { exchange: "MEXC", fundingRate: fr };
  } catch { return null; }
}

async function cgFR(sym: string) {
  try {
    const key = process.env["COINGLASS_API_KEY"] ?? ""; if (!key) return [];
    const r = await fetch(`https://open-api.coinglass.com/public/v2/funding?symbol=${sym}`, { headers: { coinglassSecret: key }, signal: AbortSignal.timeout(8000) });
    const d = await r.json() as { data?: { list?: { fundingRate: number; exchangeName: string }[] } };
    return (d.data?.list ?? []).slice(0, 6).map(x => ({ exchange: x.exchangeName, fundingRate: x.fundingRate }));
  } catch { return []; }
}

// ── OKX ───────────────────────────────────────────────────────────────────────
async function okxFR(sym: string) {
  try {
    const instId = `${sym}-USD-SWAP`;
    const r = await fetch(`https://www.okx.com/api/v5/public/funding-rate?instId=${instId}`, { signal: AbortSignal.timeout(8000) });
    const d = await r.json() as { data?: { fundingRate?: string }[] };
    const fr = parseFloat(d.data?.[0]?.fundingRate ?? "");
    if (isNaN(fr)) return null;
    return { exchange: "OKX", fundingRate: fr };
  } catch { return null; }
}

// ── Bybit ─────────────────────────────────────────────────────────────────────
async function bybitFR(sym: string) {
  try {
    const r = await fetch(`https://api.bybit.com/v5/market/funding/history?category=linear&symbol=${sym}USDT&limit=3`, { signal: AbortSignal.timeout(8000) });
    const d = await r.json() as { result?: { list?: { fundingRate?: string }[] } };
    const list = d.result?.list ?? [];
    if (!list.length) return null;
    const avg = list.reduce((a, b) => a + parseFloat(b.fundingRate ?? "0"), 0) / list.length;
    return { exchange: "Bybit", fundingRate: avg };
  } catch { return null; }
}

// ── Gate.io ───────────────────────────────────────────────────────────────────
async function gateFR(sym: string) {
  try {
    const r = await fetch(`https://api.gateio.ws/api/v4/futures/usdt/contracts/${sym}_USDT`, { signal: AbortSignal.timeout(8000) });
    const d = await r.json() as { funding_rate_indicative?: string };
    const fr = parseFloat(d.funding_rate_indicative ?? "");
    if (isNaN(fr)) return null;
    return { exchange: "Gate.io", fundingRate: fr };
  } catch { return null; }
}

// ── KuCoin Futures ────────────────────────────────────────────────────────────
async function kucoinFR(sym: string) {
  try {
    const r = await fetch(`https://api-futures.kucoin.com/api/v1/funding-rate/${sym}USDTM/current`, { signal: AbortSignal.timeout(8000) });
    const d = await r.json() as { data?: { value?: number } };
    const fr = d.data?.value;
    if (fr == null) return null;
    return { exchange: "KuCoin", fundingRate: fr };
  } catch { return null; }
}

router.get("/psy-algo/squeeze-radar", async (_req: Request, res: Response) => {
  const cached = cGet<unknown[]>("psy_squeeze_v2");
  if (cached) { res.json({ ok: true, candidates: cached }); return; }
  try {
    const candidates = await Promise.all(ASSETS.map(async a => {
      const [bn, mx, cg, okx, bybit, gate, kucoin, ohlc1h, oi] = await Promise.all([
        binanceFR(a.symbol), mexcFR(a.symbol), cgFR(a.symbol),
        okxFR(a.symbol), bybitFR(a.symbol), gateFR(a.symbol), kucoinFR(a.symbol),
        kraken(a.krakenPair, 60, 50),   // últimas 50 velas 1H para vol + CVD
        fetchOI(a.symbol),
      ]);

      // ── Funding consensus ────────────────────────────────────────────────────
      const all = [bn, mx, okx, bybit, gate, kucoin, ...cg].filter(Boolean) as { exchange: string; fundingRate: number }[];
      const rates = all.map(x => x.fundingRate);
      const avg = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
      const ssScore = avg < -0.0005 ? 5 : avg < -0.0003 ? 4 : avg < -0.0001 ? 3 : avg < 0 ? 1 : 0;
      const lsScore = avg > 0.0005 ? 5 : avg > 0.0003 ? 4 : avg > 0.0001 ? 3 : avg > 0 ? 1 : 0;

      // ── Volume 24H vs promedio 7 días ─────────────────────────────────────────
      const vols = ohlc1h.map(c => c.volume);
      const vol24h = vols.slice(-24).reduce((a, b) => a + b, 0);
      const avgVol7d = vols.slice(-49, -24).reduce((a, b) => a + b, 0) / 25; // ~25 velas de referencia
      const volRatio = avgVol7d > 0 ? vol24h / (avgVol7d * 24) : 1;
      const volSpike = volRatio > 2.5 ? "EXTREMO" : volRatio > 1.5 ? "ALTO" : volRatio > 1.0 ? "NORMAL" : "BAJO";

      // ── CVD 24H ───────────────────────────────────────────────────────────────
      const cvdArr = cvd(ohlc1h);
      const cvdNow = cvdArr.at(-1) ?? 0;
      const cvd24 = cvdArr.at(-25) ?? cvdNow;
      const cvdDelta = cvdNow - cvd24;
      const cvdTrend = cvdDelta > 0 ? "COMPRAS" : "VENTAS";
      const cvdPct = vol24h > 0 ? Math.abs(cvdDelta / vol24h) * 100 : 0;

      // ── Scoring con confirmación vol + CVD + OI ───────────────────────────────
      let confirmScore = 0;
      const isSS = ssScore >= lsScore;
      // Si funding negativo (short squeeze) y CVD alcista → confirma shorts acumulados vs compras
      if (isSS && cvdTrend === "COMPRAS") confirmScore++;
      // Si funding positivo (long squeeze) y CVD bajista → confirma longs vs ventas
      if (!isSS && cvdTrend === "VENTAS") confirmScore++;
      // Volumen alto = squeeze más peligroso
      if (volRatio > 1.5) confirmScore++;
      // OI creciendo = posiciones acumulándose
      if (oi.change24h > 3) confirmScore++;

      const baseScore = Math.max(ssScore, lsScore);
      const finalScore = Math.min(5, baseScore + (confirmScore >= 2 ? 1 : 0)); // bonus si 2+ confirmaciones
      const type = finalScore >= 3 ? (isSS ? "SHORT_SQUEEZE" : "LONG_SQUEEZE") : "NEUTRO";
      const risk = finalScore >= 5 ? "EXTREMO" : finalScore >= 4 ? "ALTO" : finalScore >= 3 ? "MEDIO" : finalScore >= 1 ? "BAJO" : "NEUTRO";

      return {
        symbol: a.symbol, name: a.name, icon: a.icon, color: a.color,
        avgFunding: avg,
        fundingPct: (avg * 100).toFixed(5) + "%",
        fundingAnnual: (avg * 8760 * 100).toFixed(2) + "%",
        type, risk, score: finalScore, isSS,
        sources: all.map(x => ({ exchange: x.exchange, rate: (x.fundingRate * 100).toFixed(5) + "%" })),
        // ── Nuevos campos ─────────────────────────────────────────────────
        volume: {
          vol24h,
          ratio: volRatio.toFixed(2),
          spike: volSpike,
          unit: a.symbol === "BTC" ? "BTC" : a.symbol === "ETH" ? "ETH" : "SOL",
        },
        cvd: {
          trend: cvdTrend,
          delta: cvdDelta.toFixed(4),
          dominancePct: cvdPct.toFixed(1),
        },
        openInterest: {
          total: oi.total,
          change24h: oi.change24h.toFixed(2),
        },
        confirmations: confirmScore,
        updatedAt: Date.now(),
      };
    }));
    cSet("psy_squeeze_v2", candidates, 5 * 60_000);
    res.json({ ok: true, candidates });
  } catch (err) { logger.error({ err }, "squeeze radar error"); res.json({ ok: false, candidates: [] }); }
});

export default router;
