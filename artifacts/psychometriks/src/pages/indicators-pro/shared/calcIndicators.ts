// PSY INDICATORS - Calculations
// Ruta: artifacts/psychometriks/src/pages/indicators/shared/calcIndicators.ts

import { Candle, ADXResult, MACDResult, Cross, VolumeProfile } from './types';

// ── EMA ──────────────────────────────────────────────
export function ema(arr: number[], period: number): number[] {
  const k = 2 / (period + 1);
  let e = arr[0];
  const out = [e];
  for (let i = 1; i < arr.length; i++) {
    e = arr[i] * k + e * (1 - k);
    out.push(e);
  }
  return out;
}

// ── WILDER SMOOTHING ─────────────────────────────────
export function wilder(arr: number[], period: number): number[] {
  let s = 0;
  for (let i = 0; i < period; i++) s += arr[i];
  const out = [s];
  for (let i = period; i < arr.length; i++) {
    s = s - s / period + arr[i];
    out.push(s);
  }
  return out;
}

// ── SMA ──────────────────────────────────────────────
export function sma(arr: number[], period: number): (number | null)[] {
  return arr.map((_, i) => {
    if (i < period - 1) return null;
    return arr.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
  });
}

// ── ADX ──────────────────────────────────────────────
export function calcADX(candles: Candle[], period = 14, bars = 180): ADXResult {
  const H = candles.map(c => c.h);
  const L = candles.map(c => c.l);
  const C = candles.map(c => c.c);
  const n = candles.length;
  const TR: number[] = [], PDM: number[] = [], MDM: number[] = [];

  for (let i = 1; i < n; i++) {
    TR.push(Math.max(H[i] - L[i], Math.abs(H[i] - C[i-1]), Math.abs(L[i] - C[i-1])));
    const up = H[i] - H[i-1], dn = L[i-1] - L[i];
    PDM.push(up > dn && up > 0 ? up : 0);
    MDM.push(dn > up && dn > 0 ? dn : 0);
  }

  const atr = wilder(TR, period);
  const pDM = wilder(PDM, period);
  const mDM = wilder(MDM, period);
  const DIp: number[] = [], DIm: number[] = [], DX: number[] = [];

  for (let i = 0; i < atr.length; i++) {
    const dp = atr[i] > 0 ? 100 * pDM[i] / atr[i] : 0;
    const dm = atr[i] > 0 ? 100 * mDM[i] / atr[i] : 0;
    DIp.push(dp); DIm.push(dm);
    DX.push((dp + dm) > 0 ? 100 * Math.abs(dp - dm) / (dp + dm) : 0);
  }

  let av = 0;
  for (let i = 0; i < period; i++) av += DX[i];
  av /= period;
  const ADX = [av];
  for (let i = period; i < DX.length; i++) {
    av = (av * (period - 1) + DX[i]) / period;
    ADX.push(av);
  }

  const skip = period * 2;
  const sl = Math.min(ADX.length - skip, bars);
  const adxArr  = ADX.slice(skip, skip + sl);
  const dipArr  = DIp.slice(skip, skip + sl);
  const dimArr  = DIm.slice(skip, skip + sl);
  const ps = skip + period;
  let priceC = C.slice(ps, ps + sl);
  let priceH = H.slice(ps, ps + sl);
  let priceL = L.slice(ps, ps + sl);

  const ml = Math.min(adxArr.length, priceC.length);
  return {
    adx:    adxArr.slice(-ml),
    dip:    dipArr.slice(-ml),
    dim:    dimArr.slice(-ml),
    priceC: priceC.slice(-ml),
    priceH: priceH.slice(-ml),
    priceL: priceL.slice(-ml),
  };
}

export function detectADXCrosses(dip: number[], dim: number[], adx: number[], thresh: number): Cross[] {
  const crosses: Cross[] = [];
  for (let i = 1; i < dip.length; i++) {
    const pb = dip[i-1] > dim[i-1], cb = dip[i] > dim[i];
    if (!pb && cb) crosses.push({ i, type: 'bull', adx: adx[i], valid: adx[i] >= thresh });
    else if (pb && !cb) crosses.push({ i, type: 'bear', adx: adx[i], valid: adx[i] >= thresh });
  }
  return crosses;
}

// ── RSI ──────────────────────────────────────────────
export function calcRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = [];
  let avgG = 0, avgL = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i-1];
    if (d > 0) avgG += d; else avgL += Math.abs(d);
  }
  avgG /= period; avgL /= period;
  rsi.push(100 - 100 / (1 + (avgL === 0 ? 100 : avgG / avgL)));
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i-1];
    const g = d > 0 ? d : 0, l = d < 0 ? Math.abs(d) : 0;
    avgG = (avgG * (period - 1) + g) / period;
    avgL = (avgL * (period - 1) + l) / period;
    rsi.push(100 - 100 / (1 + (avgL === 0 ? 100 : avgG / avgL)));
  }
  return rsi;
}

// ── MACD ─────────────────────────────────────────────
export function calcMACD(
  candles: Candle[],
  fast = 12, slow = 26, signal = 9, bars = 150
): MACDResult {
  const C = candles.map(c => c.c);
  const fst = ema(C, fast);
  const slw = ema(C, slow);
  const skip = slow - 1;
  const macdFull = fst.slice(skip).map((v, i) => v - slw[skip + i]);
  const sigFull  = ema(macdFull, signal);
  const sSk = signal - 1;
  const macdArr  = macdFull.slice(sSk).slice(-bars);
  const signalArr = sigFull.slice(sSk).slice(-bars);
  const histArr   = macdArr.map((v, i) => v - signalArr[i]);
  const ml = Math.min(macdArr.length, C.length);
  return {
    macd:   macdArr.slice(-ml),
    signal: signalArr.slice(-ml),
    hist:   histArr.slice(-ml),
    priceC: C.slice(-ml),
    priceH: candles.slice(-ml).map(c => c.h),
    priceL: candles.slice(-ml).map(c => c.l),
  };
}

export function detectMACDCrosses(macd: number[], signal: number[]): Cross[] {
  const crosses: Cross[] = [];
  for (let i = 1; i < macd.length; i++) {
    const pb = macd[i-1] > signal[i-1], cb = macd[i] > signal[i];
    if (!pb && cb) crosses.push({ i, type: 'bull', macd: macd[i], sig: signal[i] });
    else if (pb && !cb) crosses.push({ i, type: 'bear', macd: macd[i], sig: signal[i] });
  }
  return crosses;
}

// ── CVD ──────────────────────────────────────────────
export function calcCVD(candles: Candle[], spotPrice: number) {
  const deltas: number[] = [], buyVols: number[] = [], sellVols: number[] = [];
  for (const c of candles) {
    const range = c.h - c.l || 0.0001;
    const bR = (c.c - c.l) / range;
    const buy  = c.v * bR * (spotPrice || c.c);
    const sell = c.v * (1 - bR) * (spotPrice || c.c);
    deltas.push(buy - sell);
    buyVols.push(buy);
    sellVols.push(sell);
  }
  let cum = 0;
  const cvd = deltas.map(d => { cum += d; return cum; });
  return { cvd, deltas, buyVols, sellVols };
}

// ── VOLUME PROFILE ────────────────────────────────────
export function calcVolumeProfile(candles: Candle[], nBuckets = 100): VolumeProfile {
  const priceMax = Math.max(...candles.map(c => c.h));
  const priceMin = Math.min(...candles.map(c => c.l));
  const bsz = (priceMax - priceMin) / nBuckets || 1;
  const buckets = new Array(nBuckets).fill(0);

  for (const c of candles) {
    const v = c.v || 1;
    const iL = Math.max(0, Math.floor((c.l - priceMin) / bsz));
    const iH = Math.min(nBuckets - 1, Math.floor((c.h - priceMin) / bsz));
    const spread = iH - iL + 1;
    for (let i = iL; i <= iH; i++) buckets[i] += v / spread;
  }

  let pocIdx = 0;
  for (let i = 1; i < nBuckets; i++) if (buckets[i] > buckets[pocIdx]) pocIdx = i;
  const poc = priceMin + pocIdx * bsz + bsz / 2;

  const totalVol = buckets.reduce((a, b) => a + b, 0);
  let vaVol = buckets[pocIdx], vaL = pocIdx, vaH = pocIdx;
  while (vaVol < totalVol * 0.7 && (vaL > 0 || vaH < nBuckets - 1)) {
    const up = vaH < nBuckets - 1 ? buckets[vaH + 1] : 0;
    const dn = vaL > 0 ? buckets[vaL - 1] : 0;
    if (up >= dn && vaH < nBuckets - 1) { vaH++; vaVol += up; }
    else if (vaL > 0) { vaL--; vaVol += dn; }
    else break;
  }
  const vah = priceMin + vaH * bsz + bsz / 2;
  const val = priceMin + vaL * bsz + bsz / 2;

  const maxVol = Math.max(...buckets);
  const hvns: { price: number; vol: number }[] = [];
  const lvns: { price: number; vol: number }[] = [];
  for (let i = 0; i < nBuckets; i++) {
    const price = priceMin + i * bsz + bsz / 2;
    if (buckets[i] >= maxVol * 0.65) hvns.push({ price, vol: buckets[i] });
    else if (buckets[i] <= maxVol * 0.15 && buckets[i] > 0) lvns.push({ price, vol: buckets[i] });
  }

  return { buckets, poc, vah, val, hvns, lvns, priceMin, priceMax, bsz, nb: nBuckets };
}

// ── LIQ ZONES ─────────────────────────────────────────
export function calcLiqZones(price: number) {
  const levs = [5, 10, 15, 20, 25, 50, 75, 100];
  return {
    longs:  levs.map(l => ({ lev: l, price: price * (1 - 1 / l), pct: -100 / l })),
    shorts: levs.map(l => ({ lev: l, price: price * (1 + 1 / l), pct:  100 / l })),
  };
}
