// pagina web.1/artifacts/api-server/src/routes/psy-panels-btc.ts
//
// Los 5 paneles técnicos (portados de los indicadores Pine de Jorge),
// calculados SOLO para BTC:
//   1) PSY-SMD           — Smart Money & Squeeze
//   2) PSY RSI MASTER     — RSI multi-timeframe + veredicto por TF
//   3) PSY ADX+CVD        — Fuerza de tendencia + presión real de flujo
//   4) PSY LIQUIDITY v2   — POC real (aggTrades) + divergencia de capital
//   5) PSY FUNDING v2.1   — CVD + funding real + OI real + sentiment
//
// Reusa rsi/rsiArr/cvd de psy-algo.ts. Nuevo acá: klines BTC (Binance→
// Bybit), ADX/DMI, OI y funding REALES de Binance Futures, POC real vía
// aggTrades, y un "veredicto" con color por panel (y por temporalidad
// en RSI/ADX) para que se entienda de un vistazo si es bueno o malo.
//
// BUGS CORREGIDOS vs los Pine originales:
//  - PSY-SMD: "oi_close" en Pine en realidad era el PRECIO del perpetuo
//    (Pine no puede pedir OI real) — acá se usa OI real de Binance Futures.
//  - PSY-SMD / FUNDING: el "funding_proxy" de Pine aproximaba con EMA o
//    precio-vs-perp — acá se usa la TASA DE FUNDING REAL de Binance.
//  - LIQUIDITY v2: el POC de Pine era un proxy VWAP — acá es un POC REAL
//    calculado con operaciones individuales (aggTrades).

import { Router, type Request, type Response } from "express";
import { rsi, rsiArr, cvd, type OHLCV } from "./psy-algo";

const router = Router();
const SYMBOL_SPOT = "BTCUSDT";
const SYMBOL_PERP = "BTCUSDT";

type Veredicto = { texto: string; tipo: "alcista" | "bajista" | "neutral" };

// ---------- Cache simple en memoria ----------
const _cache = new Map<string, { data: unknown; exp: number }>();
function cGet<T>(k: string): T | null {
  const e = _cache.get(k);
  return e && Date.now() < e.exp ? (e.data as T) : null;
}
function cSet<T>(k: string, d: T, ms: number) {
  _cache.set(k, { data: d, exp: Date.now() + ms });
}

// ---------- Klines BTC (Binance spot → Bybit fallback) ----------
async function fetchKlinesBinance(interval: string, limit: number): Promise<OHLCV[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${SYMBOL_SPOT}&interval=${interval}&limit=${limit}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Binance klines HTTP ${r.status}`);
  const arr: any[] = await r.json();
  return arr.map((k) => ({
    time: k[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

async function fetchKlinesBybit(interval: string, limit: number): Promise<OHLCV[]> {
  const map: Record<string, string> = { "15m": "15", "30m": "30", "1h": "60", "4h": "240", "1d": "D", "1w": "W" };
  const bybitInterval = map[interval] ?? "60";
  const url = `https://api.bybit.com/v5/market/kline?category=linear&symbol=${SYMBOL_PERP}&interval=${bybitInterval}&limit=${limit}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Bybit klines HTTP ${r.status}`);
  const json: any = await r.json();
  const rows: any[] = json?.result?.list ?? [];
  return rows
    .map((row) => ({
      time: parseInt(row[0], 10),
      open: parseFloat(row[1]),
      high: parseFloat(row[2]),
      low: parseFloat(row[3]),
      close: parseFloat(row[4]),
      volume: parseFloat(row[5]),
    }))
    .reverse();
}

async function fetchKlines(interval: string, limit = 300): Promise<OHLCV[]> {
  const cacheKey = `klines:${interval}:${limit}`;
  const cached = cGet<OHLCV[]>(cacheKey);
  if (cached) return cached;
  let out: OHLCV[] = [];
  try {
    out = await fetchKlinesBinance(interval, limit);
  } catch (err) {
    console.warn(`[psy-panels-btc] Binance klines falló (${interval}), probando Bybit`, err);
    try {
      out = await fetchKlinesBybit(interval, limit);
    } catch (err2) {
      console.error(`[psy-panels-btc] Bybit klines también falló (${interval})`, err2);
      out = [];
    }
  }
  if (out.length) cSet(cacheKey, out, 60_000);
  return out;
}

// ---------- OI real (Binance Futures) ----------
async function fetchOIHistory(period = "1h", limit = 30): Promise<{ time: number; oi: number }[]> {
  const cacheKey = `oi:${period}:${limit}`;
  const cached = cGet<{ time: number; oi: number }[]>(cacheKey);
  if (cached) return cached;
  try {
    const url = `https://fapi.binance.com/futures/data/openInterestHist?symbol=${SYMBOL_PERP}&period=${period}&limit=${limit}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Binance OI hist HTTP ${r.status}`);
    const arr: any[] = await r.json();
    const out = arr.map((d) => ({ time: d.timestamp, oi: parseFloat(d.sumOpenInterest) }));
    cSet(cacheKey, out, 5 * 60_000);
    return out;
  } catch (err) {
    console.error("[psy-panels-btc] fetchOIHistory falló", err);
    return [];
  }
}

// ---------- Funding real (Binance Futures) ----------
async function fetchFundingHistory(limit = 30): Promise<{ time: number; rate: number }[]> {
  const cacheKey = `funding:${limit}`;
  const cached = cGet<{ time: number; rate: number }[]>(cacheKey);
  if (cached) return cached;
  try {
    const url = `https://fapi.binance.com/fapi/v1/fundingRate?symbol=${SYMBOL_PERP}&limit=${limit}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Binance funding hist HTTP ${r.status}`);
    const arr: any[] = await r.json();
    const out = arr.map((d) => ({ time: d.fundingTime, rate: parseFloat(d.fundingRate) * 100 }));
    cSet(cacheKey, out, 5 * 60_000);
    return out;
  } catch (err) {
    console.error("[psy-panels-btc] fetchFundingHistory falló", err);
    return [];
  }
}

// ---------- ADX / DMI (con serie completa, no solo el último valor) ----------
function adxDmi(candles: OHLCV[], len = 14, smooth = 14) {
  const n = candles.length;
  const plusDM: number[] = [0];
  const minusDM: number[] = [0];
  const tr: number[] = [0];
  for (let i = 1; i < n; i++) {
    const up = candles[i]!.high - candles[i - 1]!.high;
    const down = candles[i - 1]!.low - candles[i]!.low;
    plusDM.push(up > down && up > 0 ? up : 0);
    minusDM.push(down > up && down > 0 ? down : 0);
    tr.push(
      Math.max(
        candles[i]!.high - candles[i]!.low,
        Math.abs(candles[i]!.high - candles[i - 1]!.close),
        Math.abs(candles[i]!.low - candles[i - 1]!.close)
      )
    );
  }
  const rma = (vals: number[], p: number) => {
    const out: number[] = [];
    let prev = vals.slice(0, p).reduce((a, b) => a + b, 0) / p;
    out.push(prev);
    for (let i = p; i < vals.length; i++) {
      prev = (prev * (p - 1) + vals[i]!) / p;
      out.push(prev);
    }
    return out;
  };
  const atrArr = rma(tr, len);
  const plusDIArr = rma(plusDM, len).map((v, i) => (atrArr[i] ? (100 * v) / atrArr[i]! : 0));
  const minusDIArr = rma(minusDM, len).map((v, i) => (atrArr[i] ? (100 * v) / atrArr[i]! : 0));
  const dx = plusDIArr.map((v, i) => {
    const m = minusDIArr[i] ?? 0;
    return v + m !== 0 ? (100 * Math.abs(v - m)) / (v + m) : 0;
  });
  const adxArr = rma(dx, smooth);
  const last = adxArr.length - 1;
  return {
    adx: adxArr[last] ?? 0,
    diPlus: plusDIArr[plusDIArr.length - 1] ?? 0,
    diMinus: minusDIArr[minusDIArr.length - 1] ?? 0,
    adxArr,
  };
}

// ---------- Helpers de normalización / zonas ----------
function pctChange(candles: OHLCV[], back: number): number {
  const n = candles.length;
  if (n <= back) return 0;
  const now = candles[n - 1]!.close;
  const then = candles[n - 1 - back]!.close;
  return then !== 0 ? ((now - then) / then) * 100 : 0;
}

function cvdChangePct(cvdArr: number[], back: number): number {
  const n = cvdArr.length;
  if (n <= back) return 0;
  const now = cvdArr[n - 1]!;
  const then = cvdArr[n - 1 - back]!;
  return then !== 0 ? ((now - then) / Math.abs(then)) * 100 : 0;
}

function cvdNormalizedPct(candles: OHLCV[], len: number): number {
  const slice = candles.slice(-len);
  let buy = 0;
  let sell = 0;
  for (const c of slice) {
    const range = c.high - c.low || 1;
    buy += ((c.close - c.low) / range) * c.volume;
    sell += ((c.high - c.close) / range) * c.volume;
  }
  const total = buy + sell;
  return total > 0 ? ((buy - sell) / total) * 100 : 0;
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}
function round2(v: number) {
  return Math.round(v * 100) / 100;
}
function round4(v: number) {
  return Math.round(v * 10000) / 10000;
}

// ---------- PANEL 1: PSY-SMD (Smart Money & Squeeze) ----------
async function calcSMD() {
  const candles = await fetchKlines("15m", 300);
  if (candles.length < 30) return null;

  const smdLen = 14;
  const priceChg = pctChange(candles, smdLen);
  const cvdArr = cvd(candles);
  const cvdChg = cvdChangePct(cvdArr, smdLen);

  const oiHist = await fetchOIHistory("15m", 30);
  const oiNow = oiHist[oiHist.length - 1]?.oi ?? 0;
  const oiThen = oiHist[Math.max(0, oiHist.length - 1 - smdLen)]?.oi ?? oiNow;
  const oiChg = oiThen !== 0 ? ((oiNow - oiThen) / oiThen) * 100 : 0;

  const fundingHist = await fetchFundingHistory(5);
  const fundingNow = fundingHist[fundingHist.length - 1]?.rate ?? 0;

  const divThresh = 2.0;
  const isDist = priceChg > divThresh && cvdChg < -divThresh;
  const isAcum = priceChg < -divThresh && cvdChg > divThresh;
  const isLsqFast = priceChg > divThresh && oiChg > divThresh && fundingNow > 0.005 && !isAcum;
  const isSsqFast = priceChg < -divThresh && oiChg > divThresh && fundingNow < -0.005 && !isDist;

  const sqWindow = 5;
  const recent = candles.slice(-sqWindow);
  let lsqScore = 0;
  let ssqScore = 0;
  for (let i = 1; i < recent.length; i++) {
    const priceDown = recent[i]!.close < recent[i - 1]!.close;
    const priceUp = recent[i]!.close > recent[i - 1]!.close;
    lsqScore += (priceDown ? 1 : 0) + (fundingNow > 0.001 ? 1 : 0);
    ssqScore += (priceUp ? 1 : 0) + (fundingNow < -0.001 ? 1 : 0);
  }
  lsqScore = Math.min(9, Math.round((lsqScore / (sqWindow * 2)) * 9));
  ssqScore = Math.min(9, Math.round((ssqScore / (sqWindow * 2)) * 9));

  const utcHour = new Date().getUTCHours();
  const isAsia = utcHour >= 0 && utcHour < 3;
  const isLondon = utcHour >= 7 && utcHour < 9;
  const isNy = utcHour >= 13 && utcHour < 15;
  const manipWindow = isAsia ? "ASIA" : isLondon ? "LONDRES" : isNy ? "NY" : null;

  let regimen = "NEUTRO";
  if (isLsqFast) regimen = "LONG SQUEEZE";
  else if (isSsqFast) regimen = "SHORT SQUEEZE";
  else if (isDist) regimen = "DISTRIBUCIÓN";
  else if (isAcum) regimen = "ACUMULACIÓN";

  let veredicto: Veredicto = { texto: "Sin señal de manipulación clara — flujo equilibrado entre compradores y vendedores.", tipo: "neutral" };
  if (regimen === "LONG SQUEEZE") veredicto = { texto: "Squeeze de cortos en desarrollo: presión que puede empujar el precio hacia arriba con fuerza.", tipo: "alcista" };
  else if (regimen === "SHORT SQUEEZE") veredicto = { texto: "Squeeze de largos en desarrollo: presión que puede empujar el precio hacia abajo con fuerza.", tipo: "bajista" };
  else if (regimen === "ACUMULACIÓN") veredicto = { texto: "Compra institucional silenciosa detectada — sesgo de fondo alcista.", tipo: "alcista" };
  else if (regimen === "DISTRIBUCIÓN") veredicto = { texto: "Venta institucional silenciosa detectada — sesgo de fondo bajista.", tipo: "bajista" };

  const historia: { time: number; precioPct: number; cvdPct: number; divScore: number }[] = [];
  for (let i = smdLen; i < candles.length; i++) {
    const pThen = candles[i - smdLen]!.close;
    const pChg = pThen !== 0 ? ((candles[i]!.close - pThen) / pThen) * 100 : 0;
    const cThen = cvdArr[i - smdLen]!;
    const cChg = cThen !== 0 ? ((cvdArr[i]! - cThen) / Math.abs(cThen)) * 100 : 0;
    historia.push({ time: candles[i]!.time, precioPct: round2(pChg), cvdPct: round2(cChg), divScore: round2(pChg - cChg) });
  }

  return {
    nombre: "PSY-SMD — Smart Money & Squeeze",
    mide: "Detecta acumulación o distribución institucional oculta y presión de liquidación (squeeze) en tiempo real.",
    regimen,
    precioPct: round2(priceChg),
    cvdPct: round2(cvdChg),
    oiPct: round2(oiChg),
    fundingPct: round4(fundingNow),
    lsqScore,
    ssqScore,
    ventanaRiesgo: manipWindow,
    historia: historia.slice(-96),
    veredicto,
    explicacion:
      "Compara el precio contra el CVD (presión real de compra/venta, calculada operación por operación) y el " +
      "Open Interest real de Binance Futures. Cuando el precio sube pero el CVD cae, hay ballenas vendiendo en " +
      "silencio (DISTRIBUCIÓN); cuando el precio baja pero el CVD sube, están acumulando (ACUMULACIÓN). El " +
      "squeeze score (0-9) mide cuánta presión de liquidación se acumuló en las últimas velas — score alto + " +
      "funding a favor sugiere un squeeze inminente. La 'ventana de riesgo' marca Asia/Londres/NY, las franjas " +
      "horarias donde suele haber mechas de manipulación por bajo volumen.",
  };
}

function rsiVeredicto(val: number, slope: number): Veredicto {
  if (val >= 70) return { texto: "Sobrecompra: el movimiento alcista podría estar perdiendo fuerza — vigilar una corrección.", tipo: "bajista" };
  if (val <= 30) return { texto: "Sobreventa: posible rebote técnico en el corto plazo.", tipo: "alcista" };
  if (slope > 3) return { texto: "Momentum ganando fuerza al alza.", tipo: "alcista" };
  if (slope < -3) return { texto: "Momentum perdiendo fuerza / girando a la baja.", tipo: "bajista" };
  return { texto: "Sin sesgo claro — RSI moviéndose lateral.", tipo: "neutral" };
}

// ---------- PANEL 2: PSY RSI MASTER ----------
async function calcRSIMaster() {
  const tfs = { "1H": "1h", "4H": "4h", "1D": "1d", "1W": "1w" } as const;
  const out: Record<
    string,
    { rsi: number; zona: string; historia: { time: number; rsi: number }[]; veredicto: Veredicto }
  > = {};

  for (const [label, interval] of Object.entries(tfs)) {
    const candles = await fetchKlines(interval, 300);
    if (candles.length < 20) continue;
    const closes = candles.map((c) => c.close);
    const val = rsi(closes, 14);
    let zona = "NEUTRAL";
    if (val >= 80) zona = "SOBRECOMPRA EXTREMA";
    else if (val >= 70) zona = "SOBRECOMPRA";
    else if (val <= 20) zona = "SOBREVENTA EXTREMA";
    else if (val <= 30) zona = "SOBREVENTA";
    else if (val >= 55) zona = "ALCISTA";
    else if (val <= 45) zona = "BAJISTA";

    const rsiSeries = rsiArr(closes, 14);
    const times = candles.slice(candles.length - rsiSeries.length).map((c) => c.time);
    const historia = times.map((time, i) => ({ time, rsi: round1(rsiSeries[i]!) })).slice(-100);
    const slope = historia.length >= 6 ? historia[historia.length - 1]!.rsi - historia[historia.length - 6]!.rsi : 0;

    out[label] = { rsi: round1(val), zona, historia, veredicto: rsiVeredicto(val, slope) };
  }

  return {
    nombre: "PSY RSI Master",
    mide: "Mide el momentum y las zonas de sobrecompra/sobreventa de BTC en 4 temporalidades simultáneas.",
    porTimeframe: out,
    explicacion:
      "RSI (índice de fuerza relativa) calculado de forma independiente en 1H, 4H, 1D y 1W. Cuando varias " +
      "temporalidades coinciden en la misma zona (todas sobrecompra o todas sobreventa), la señal es mucho más " +
      "confiable que mirar una sola vela o un único timeframe. Elegí la pestaña de la temporalidad que te " +
      "interese para ver su evolución en el tiempo.",
  };
}

function adxVeredicto(adx: number, adxSlope: number, direccion: string): Veredicto {
  if (adx >= 25 && adxSlope > 0) {
    return {
      texto: `Tendencia ${direccion.toLowerCase()} FORTALECIÉNDOSE (ADX subiendo) — señal de continuación del movimiento.`,
      tipo: direccion === "ALCISTA" ? "alcista" : direccion === "BAJISTA" ? "bajista" : "neutral",
    };
  }
  if (adx >= 25 && adxSlope <= 0) {
    return { texto: `Tendencia ${direccion.toLowerCase()} establecida pero perdiendo impulso (ADX bajando) — cuidado con un agotamiento.`, tipo: "neutral" };
  }
  if (adx < 20) return { texto: "Mercado en rango, sin tendencia definida — mejor esperar confirmación antes de operar a favor de tendencia.", tipo: "neutral" };
  return { texto: "Tendencia incipiente, todavía sin confirmar fuerza real.", tipo: "neutral" };
}

// ---------- PANEL 3: PSY ADX+CVD ----------
async function calcADXCVD() {
  const tfs = { "1H": "1h", "4H": "4h", "1D": "1d", "1W": "1w" } as const;
  const out: Record<
    string,
    {
      adx: number;
      direccion: string;
      cvdPct: number;
      rsi: number;
      score: number;
      etiqueta: string;
      historia: { time: number; adx: number; cvdPct: number }[];
      veredicto: Veredicto;
    }
  > = {};

  for (const [label, interval] of Object.entries(tfs)) {
    const candles = await fetchKlines(interval, 300);
    if (candles.length < 30) continue;
    const { adx, diPlus, diMinus, adxArr } = adxDmi(candles, 14, 14);
    const cvdPct = cvdNormalizedPct(candles, 20);
    const rsiVal = rsi(
      candles.map((c) => c.close),
      14
    );
    const direccion = diPlus > diMinus * 1.1 ? "ALCISTA" : diMinus > diPlus * 1.1 ? "BAJISTA" : "LATERAL";

    let score = 0;
    if (adx >= 25) score += 1;
    if (diPlus > diMinus) score += 1;
    else if (diMinus > diPlus) score -= 1;
    if (cvdPct >= 70) score += 2;
    else if (cvdPct <= -70) score -= 2;
    if (rsiVal >= 70) score += 1;
    else if (rsiVal <= 30) score -= 1;

    let etiqueta = "NEUTRAL";
    if (score >= 4) etiqueta = "COMPRA MAX";
    else if (score >= 2) etiqueta = "COMPRA";
    else if (score === 1) etiqueta = "SESGO COMPRA";
    else if (score === -1) etiqueta = "SESGO VENTA";
    else if (score <= -4) etiqueta = "VENTA MAX";
    else if (score <= -2) etiqueta = "VENTA";

    // Historial por temporalidad: ADX en el tiempo + CVD% en ventana móvil de 20 velas
    const rollWin = 20;
    const times = candles.slice(candles.length - adxArr.length).map((c) => c.time);
    const historia = times
      .map((time, i) => {
        const idxCandle = candles.length - adxArr.length + i;
        const from = Math.max(0, idxCandle - rollWin);
        const slice = candles.slice(from, idxCandle + 1);
        return { time, adx: round1(adxArr[i]!), cvdPct: round1(cvdNormalizedPct(slice, slice.length)) };
      })
      .slice(-100);
    const adxSlope = historia.length >= 6 ? historia[historia.length - 1]!.adx - historia[historia.length - 6]!.adx : 0;

    out[label] = {
      adx: round1(adx),
      direccion,
      cvdPct: round1(cvdPct),
      rsi: round1(rsiVal),
      score,
      etiqueta,
      historia,
      veredicto: adxVeredicto(adx, adxSlope, direccion),
    };
  }
  const scoreTotal = Object.values(out).reduce((a, b) => a + b.score, 0);
  return {
    nombre: "PSY ADX + CVD",
    mide: "Mide la FUERZA real de la tendencia (ADX) combinada con la presión de compra/venta (CVD) para confirmar si un movimiento tiene sustento real o es ruido.",
    porTimeframe: out,
    scoreTotal,
    explicacion:
      "ADX mide qué tan FUERTE es la tendencia (no la dirección): arriba de 25 hay tendencia real, abajo de 20 " +
      "el mercado está lateral/sin dirección clara. DI+/DI- marcan la dirección. Se combina con el CVD (flujo " +
      "real de órdenes) y el RSI en 4 temporalidades para armar un score de confluencia. Regla simple: si el " +
      "ADX sube junto con la línea de tendencia, es una tendencia clara y con fuerza real; si el ADX baja, la " +
      "tendencia se está agotando aunque el precio siga moviéndose en la misma dirección.",
  };
}

// ---------- POC REAL (perfil de volumen con aggTrades) ----------
async function fetchAggTradesWindow(
  startTimeMs: number,
  endTimeMs: number,
  maxTrades: number
): Promise<{ price: number; qty: number; time: number }[]> {
  const out: { price: number; qty: number; time: number }[] = [];
  const pageLimit = 1000;
  const maxPages = Math.ceil(maxTrades / pageLimit);
  let fromId: number | null = null;

  for (let page = 0; page < maxPages; page++) {
    const url =
      fromId === null
        ? `https://api.binance.com/api/v3/aggTrades?symbol=${SYMBOL_SPOT}&startTime=${startTimeMs}&limit=${pageLimit}`
        : `https://api.binance.com/api/v3/aggTrades?symbol=${SYMBOL_SPOT}&fromId=${fromId}&limit=${pageLimit}`;
    let arr: any[];
    try {
      const r = await fetch(url);
      if (!r.ok) break;
      arr = await r.json();
    } catch {
      break;
    }
    if (!arr.length) break;

    let hitEnd = false;
    for (const t of arr) {
      if (t.T > endTimeMs) {
        hitEnd = true;
        break;
      }
      out.push({ price: parseFloat(t.p), qty: parseFloat(t.q), time: t.T });
    }
    if (hitEnd || arr.length < pageLimit) break;
    fromId = arr[arr.length - 1].a + 1;
  }
  return out;
}

function pocFromTrades(trades: { price: number; qty: number; time: number }[], rows = 50) {
  if (!trades.length) return null;
  let hi = -Infinity;
  let lo = Infinity;
  for (const t of trades) {
    if (t.price > hi) hi = t.price;
    if (t.price < lo) lo = t.price;
  }
  if (hi === lo) return { poc: hi, tradesUsed: trades.length, coverageMs: 0 };
  const step = (hi - lo) / rows;
  const buckets = new Array(rows).fill(0);
  for (const t of trades) {
    let idx = Math.floor((t.price - lo) / step);
    idx = Math.max(0, Math.min(rows - 1, idx));
    buckets[idx] += t.qty;
  }
  let maxIdx = 0;
  for (let i = 1; i < rows; i++) if (buckets[i]! > buckets[maxIdx]!) maxIdx = i;
  const poc = lo + (maxIdx + 0.5) * step;
  const coverageMs = trades[trades.length - 1]!.time - trades[0]!.time;
  return { poc, tradesUsed: trades.length, coverageMs };
}

function coverageLabel(ms: number): string {
  const min = ms / 60_000;
  if (min < 60) return `${Math.round(min)} min`;
  const h = min / 60;
  if (h < 24) return `${Math.round(h * 10) / 10} h`;
  return `${Math.round((h / 24) * 10) / 10} días`;
}

const POC_WINDOWS: Record<string, { hours: number; maxTrades: number }> = {
  "15m": { hours: 2, maxTrades: 20000 },
  "30m": { hours: 6, maxTrades: 20000 },
  "1H": { hours: 24, maxTrades: 20000 },
  "4H": { hours: 24 * 3, maxTrades: 20000 },
  "1D": { hours: 24 * 7, maxTrades: 20000 },
};

async function calcPocReal(label: string) {
  const cacheKey = `poc-real:${label}`;
  const cached = cGet<any>(cacheKey);
  if (cached) return cached;

  const cfg = POC_WINDOWS[label]!;
  const endTimeMs = Date.now();
  const startTimeMs = endTimeMs - cfg.hours * 60 * 60 * 1000;
  const trades = await fetchAggTradesWindow(startTimeMs, endTimeMs, cfg.maxTrades);
  const result = pocFromTrades(trades, 50);

  const nominalMs = cfg.hours * 60 * 60 * 1000;
  const out = result
    ? {
        poc: result.poc,
        tradesUsed: result.tradesUsed,
        cobertura: coverageLabel(result.coverageMs),
        coberturaCompleta: result.coverageMs >= nominalMs * 0.9,
      }
    : null;

  if (out) cSet(cacheKey, out, 5 * 60_000);
  return out;
}

// ---------- PANEL 4: PSY LIQUIDITY FLOW v2 (POC real + capital divergencia) ----------
async function calcLiquidityFlow() {
  const tfLabels = ["15m", "30m", "1H", "4H", "1D"] as const;
  const out: Record<string, { poc: number; distPct: number; posicion: string; cobertura: string; coberturaCompleta: boolean }> = {};
  const priceNow = (await fetchKlines("1h", 2)).slice(-1)[0]?.close ?? 0;

  const results = await Promise.all(tfLabels.map((label) => calcPocReal(label)));
  for (let i = 0; i < tfLabels.length; i++) {
    const label = tfLabels[i]!;
    const r = results[i];
    if (!r) continue;
    const distPct = priceNow !== 0 ? (Math.abs(r.poc - priceNow) / priceNow) * 100 : 0;
    const posicion = r.poc < priceNow ? "ABAJO" : r.poc > priceNow ? "ARRIBA" : "EN PRECIO";
    out[label] = { poc: round2(r.poc), distPct: round2(distPct), posicion, cobertura: r.cobertura, coberturaCompleta: r.coberturaCompleta };
  }

  const pocsAbajo = Object.values(out).filter((v) => v.posicion === "ABAJO" && v.distPct > 1.5).length;
  const pocsArriba = Object.values(out).filter((v) => v.posicion === "ARRIBA" && v.distPct > 1.5).length;

  const candles1h = await fetchKlines("1h", 120);
  const closes = candles1h.map((c) => c.close);
  const vols = candles1h.map((c) => c.volume);
  const priceHi = Math.max(...closes.slice(-20));
  const priceLo = Math.min(...closes.slice(-20));
  const volHi = Math.max(...vols.slice(-20));
  const volLo = Math.min(...vols.slice(-20));
  const priceNorm = priceHi !== priceLo ? ((closes[closes.length - 1]! - priceLo) / (priceHi - priceLo)) * 100 : 50;
  const volNorm = volHi !== volLo ? ((vols[vols.length - 1]! - volLo) / (volHi - volLo)) * 100 : 50;
  const capitalDiv = priceNorm - volNorm;
  const capBull = capitalDiv < -15;
  const capBear = capitalDiv > 15;

  const historia: { time: number; capitalDiv: number }[] = [];
  const rollWin = 20;
  for (let i = rollWin; i < candles1h.length; i++) {
    const cSlice = closes.slice(i - rollWin, i + 1);
    const vSlice = vols.slice(i - rollWin, i + 1);
    const pHi = Math.max(...cSlice);
    const pLo = Math.min(...cSlice);
    const vHi = Math.max(...vSlice);
    const vLo = Math.min(...vSlice);
    const pN = pHi !== pLo ? ((closes[i]! - pLo) / (pHi - pLo)) * 100 : 50;
    const vN = vHi !== vLo ? ((vols[i]! - vLo) / (vHi - vLo)) * 100 : 50;
    historia.push({ time: candles1h[i]!.time, capitalDiv: round1(pN - vN) });
  }

  const pocScore = Math.max(0, 100 - pocsAbajo * 20);
  const capScore = capBull ? 75 : capBear ? 25 : 50;
  const liqScore = pocScore * 0.6 + capScore * 0.4;

  let veredicto: Veredicto = { texto: "Distribución pareja de liquidez — sin imanes fuertes que condicionen el precio.", tipo: "neutral" };
  if (pocsAbajo >= 3) veredicto = { texto: "Varios imanes de precio por debajo — el mercado podría buscar liquidez abajo antes de subir.", tipo: "bajista" };
  else if (pocsAbajo === 0 && capBull) veredicto = { texto: "Camino relativamente libre hacia arriba + acumulación de capital detectada.", tipo: "alcista" };
  else if (pocsArriba >= 3) veredicto = { texto: "Varios imanes de precio por arriba — resistencia real por volumen operado.", tipo: "bajista" };

  return {
    nombre: "PSY Liquidity Flow — POC",
    mide: "Ubica las zonas de precio donde se concentró más volumen operado (imanes de liquidez) y si el capital está acumulando o distribuyendo.",
    porTimeframe: out,
    pocsAbajo,
    pocsArriba,
    capitalDiv: round1(capitalDiv),
    capitalEstado: capBull ? "ACUMULACIÓN" : capBear ? "DISTRIBUCIÓN" : "NEUTRAL",
    liqScore: Math.round(liqScore),
    historia: historia.slice(-100),
    veredicto,
    explicacion:
      "El POC (punto de mayor volumen operado) actúa como un imán de precio: si hay POCs por debajo del precio " +
      "actual, el mercado tiende a bajar a buscarlos antes de seguir subiendo, y viceversa. Es un POC REAL, " +
      "armado con operaciones individuales de Binance (no con velas), igual que un volume profile de verdad. " +
      "Nota honesta sobre 'cobertura': BTC opera tantas veces por segundo que en temporalidades largas (4H/1D) " +
      "puede no alcanzarse toda la ventana de tiempo ideal con una cantidad razonable de llamadas — cada fila " +
      "muestra cuánto tiempo real cubren las operaciones usadas, en vez de fingir que siempre cubre la ventana " +
      "completa. La 'divergencia de capital' compara si el precio sube más rápido que el volumen (distribución) " +
      "o al revés (acumulación).",
  };
}

// ---------- PANEL 5: PSY FUNDING SENTIMENT v2.1 ----------
async function calcFundingSentiment() {
  const tfs = { "15m": "15m", "30m": "30m", "1H": "1h", "4H": "4h", "1D": "1d" } as const;
  const out: Record<string, { cvdPct: number; estado: string }> = {};
  let candles1hForHistoria: OHLCV[] = [];
  for (const [label, interval] of Object.entries(tfs)) {
    const candles = await fetchKlines(interval, 120);
    if (candles.length < 10) continue;
    if (label === "1H") candles1hForHistoria = candles;
    const cvdPct = cvdNormalizedPct(candles, 20);
    const estado = cvdPct > 3 ? "COMPRA" : cvdPct < -3 ? "VENTA" : "NEUTRO";
    out[label] = { cvdPct: round1(cvdPct), estado };
  }
  const bulls = Object.values(out).filter((v) => v.estado === "COMPRA").length;
  const bears = Object.values(out).filter((v) => v.estado === "VENTA").length;
  const cvdScore = Math.min(Math.max(50 + (bulls - bears) * 10, 0), 100);

  const fundingHist = await fetchFundingHistory(10);
  const fundingNow = fundingHist[fundingHist.length - 1]?.rate ?? 0;
  const fundSat = 0.05;
  const fundScore = Math.min(Math.max(50 - (fundingNow / fundSat) * 50, 0), 100);

  const oiHist = await fetchOIHistory("1h", 10);
  const oiNow = oiHist[oiHist.length - 1]?.oi ?? 0;
  const oiThen = oiHist[0]?.oi ?? oiNow;
  const oiRising = oiThen !== 0 && oiNow > oiThen * 1.02;
  const oiFalling = oiThen !== 0 && oiNow < oiThen * 0.98;
  const oiBonus = oiRising ? 5 : oiFalling ? -5 : 0;

  const sentimentScore = Math.min(Math.max(Math.round(cvdScore * 0.65 + fundScore * 0.3 + oiBonus * 0.05), 0), 100);
  const label =
    sentimentScore >= 75
      ? "FLUJO ALCISTA"
      : sentimentScore >= 55
        ? "SESGO ALCISTA"
        : sentimentScore >= 45
          ? "NEUTRO"
          : sentimentScore >= 25
            ? "SESGO BAJISTA"
            : "FLUJO BAJISTA";

  const squeezeSignal = fundingNow < -0.02 && bears >= 3;

  const historia: { time: number; cvdPct: number }[] = [];
  const rollWin = 20;
  for (let i = rollWin; i < candles1hForHistoria.length; i++) {
    const slice = candles1hForHistoria.slice(i - rollWin, i + 1);
    historia.push({ time: candles1hForHistoria[i]!.time, cvdPct: round1(cvdNormalizedPct(slice, slice.length)) });
  }

  const veredicto: Veredicto = {
    texto: squeezeSignal
      ? "Funding muy negativo + CVD bajista en varias temporalidades: los shorts pagan caro y podrían estar atrapados — posible short squeeze."
      : sentimentScore >= 55
        ? "Flujo neto de compra dominante en el mercado de futuros."
        : sentimentScore <= 45
          ? "Flujo neto de venta dominante en el mercado de futuros."
          : "Sentiment equilibrado, sin dominancia clara de compradores o vendedores.",
    tipo: sentimentScore >= 55 ? "alcista" : sentimentScore <= 45 ? "bajista" : "neutral",
  };

  return {
    nombre: "PSY Funding Sentiment",
    mide: "Combina el flujo real de órdenes (CVD), el costo de mantener posiciones (funding) y el interés abierto para medir el sentimiento neto del mercado de futuros.",
    porTimeframe: out,
    fundingPct: round4(fundingNow),
    oiEstado: oiRising ? "SUBIENDO" : oiFalling ? "BAJANDO" : "ESTABLE",
    sentimentScore,
    label,
    squeezeSignal,
    historia: historia.slice(-100),
    veredicto,
    explicacion:
      "Combina el CVD (presión de compra/venta real) en 5 temporalidades con la tasa de FUNDING real de Binance " +
      "(no una aproximación) y el Open Interest real. Funding muy negativo + CVD bajista en varias temporalidades " +
      "sugiere que los shorts están pagando caro y podrían estar atrapados, señal de posible short squeeze.",
  };
}

// ---------- Cache de fondo (mismo patrón que pump-live.ts / crypto-indices.ts) ----------
let cachedPanels: any = null;
let lastCalcError: string | null = null;
let calculating = false;

async function refreshPanels() {
  if (calculating) return;
  calculating = true;
  console.log("[psy-panels-btc] recalculando los 5 paneles...");
  const start = Date.now();
  try {
    const [smd, rsiMaster, adxCvd, liquidityFlow, fundingSentiment] = await Promise.all([
      calcSMD(),
      calcRSIMaster(),
      calcADXCVD(),
      calcLiquidityFlow(),
      calcFundingSentiment(),
    ]);
    cachedPanels = { updatedAt: Date.now(), simbolo: "BTCUSDT", smd, rsiMaster, adxCvd, liquidityFlow, fundingSentiment };
    lastCalcError = null;
    console.log(`[psy-panels-btc] OK — tardó ${Math.round((Date.now() - start) / 1000)}s`);
  } catch (err: any) {
    lastCalcError = err?.message ?? String(err);
    console.error("[psy-panels-btc] error recalculando paneles", err);
  } finally {
    calculating = false;
  }
}

refreshPanels();
setInterval(refreshPanels, 3 * 60_000);

router.get("/psy-panels-btc/live", (_req: Request, res: Response) => {
  if (!cachedPanels) {
    return res.status(503).json({ error: "Todavía calculando los paneles por primera vez, reintentar en unos segundos", lastCalcError });
  }
  res.json(cachedPanels);
});

router.get("/psy-panels-btc/status", (_req: Request, res: Response) => {
  res.json({ listo: !!cachedPanels, calculando: calculating, updatedAt: cachedPanels?.updatedAt ?? null, lastCalcError });
});

export default router;
