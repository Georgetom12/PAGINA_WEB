// pagina web.1/artifacts/api-server/src/routes/psy-panels-btc.ts
//
// Los 5 paneles pedidos por Jorge (portados de sus indicadores Pine),
// calculados SOLO para BTC (sin selector de moneda, para simplificar):
//   1) PSY-SMD          — Smart Money Divergence + Squeeze Detector
//   2) PSY RSI MASTER    — RSI multi-timeframe + divergencias
//   3) PSY ADX+CVD       — ADX/DMI + CVD + confluencia multi-TF
//   4) PSY LIQUIDITY v2  — POC real (perfil de volumen con aggTrades) + divergencia de capital
//   5) PSY FUNDING v2.1  — CVD + funding + OI + sentiment score
//
// Reusa las funciones YA PROBADAS de psy-algo.ts (rsi, ema, cvd, atr) —
// no se duplica esa lógica. Lo que SÍ es nuevo acá: fetch de klines BTC
// (Binance→Bybit), ADX/DMI (no existía en psy-algo.ts), y fetch de OI +
// funding REALES de Binance Futures (mejor que los proxies del Pine).
//
// BUGS ENCONTRADOS EN LOS SCRIPTS PINE ORIGINALES (corregidos acá):
//  - PSY-SMD: la variable "oi_close" en realidad traía el PRECIO del
//    contrato perpetuo (request.security(...precio...)), no el Open
//    Interest real — Pine no tiene forma fácil de pedir OI real. Acá en
//    el backend SÍ podemos, así que se usa OI real de Binance Futures
//    (/futures/data/openInterestHist), no un precio disfrazado de OI.
//  - PSY-SMD / PSY FUNDING: "funding_proxy" en Pine aproximaba el
//    funding con la distancia precio-vs-EMA o precio-vs-perp — acá se
//    usa la TASA DE FUNDING REAL de Binance (/fapi/v1/fundingRate),
//    más precisa que cualquier proxy.
//
//  - PSY LIQUIDITY v2: el POC del Pine original era un proxy VWAP (no un
//    perfil de volumen real, porque Pine no tiene acceso a operaciones
//    individuales). Acá se reemplazó por un POC REAL, calculado con
//    aggTrades (operaciones reales) de Binance — ver calcPocReal().
//
// Todo lo demás (CVD, divergencias, squeeze, ADX) es la misma lógica de
// cálculo que los Pine, portada a TypeScript.

import { Router, type Request, type Response } from "express";
import { rsi, cvd, type OHLCV } from "./psy-algo";

const router = Router();
const SYMBOL_SPOT = "BTCUSDT";
const SYMBOL_PERP = "BTCUSDT"; // Binance Futures usa el mismo símbolo en fapi

// ---------- Cache simple en memoria (evita golpear Binance en cada request) ----------
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
  // Bybit usa minutos como "1","5","15","60","240","D","W"
  const map: Record<string, string> = {
    "15m": "15",
    "30m": "30",
    "1h": "60",
    "4h": "240",
    "1d": "D",
    "1w": "W",
  };
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
    .reverse(); // Bybit devuelve más nuevo primero
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
  if (out.length) cSet(cacheKey, out, 60_000); // cache 1 min
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
    cSet(cacheKey, out, 5 * 60_000); // 5 min
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

// ---------- ADX / DMI (no existía en psy-algo.ts, se agrega acá) ----------
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
  // % del volumen total que fue "compra" vs "venta" (wick-based), últimas `len` velas
  const slice = candles.slice(-len);
  let buy = 0;
  let sell = 0;
  for (const c of slice) {
    const range = c.high - c.low || 1;
    const b = ((c.close - c.low) / range) * c.volume;
    const s = ((c.high - c.close) / range) * c.volume;
    buy += b;
    sell += s;
  }
  const total = buy + sell;
  return total > 0 ? ((buy - sell) / total) * 100 : 0;
}

// ---------- PANEL 1: PSY-SMD (Smart Money Divergence + Squeeze) ----------
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

  // Squeeze acumulado (ventana de 5 velas, score 0-9, igual criterio que el Pine)
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

  return {
    regimen,
    precioPct: round2(priceChg),
    cvdPct: round2(cvdChg),
    oiPct: round2(oiChg),
    fundingPct: round4(fundingNow),
    lsqScore,
    ssqScore,
    ventanaRiesgo: manipWindow,
    explicacion:
      "Compara el precio contra el CVD (presión real de compra/venta) y el Open Interest real de Binance. " +
      "Si el precio sube pero el CVD cae, hay ballenas vendiendo en silencio (DISTRIBUCIÓN). Si el precio baja " +
      "pero el CVD sube, están acumulando (ACUMULACIÓN). El squeeze score mide cuánta presión de liquidación " +
      "se está acumulando en las últimas velas — score alto + funding a favor = posible squeeze inminente. " +
      "La 'ventana de riesgo' marca las horas (Asia/Londres/NY) donde suelen darse mechas de manipulación por bajo volumen.",
  };
}

// ---------- PANEL 2: PSY RSI MASTER ----------
async function calcRSIMaster() {
  const tfs = { "1H": "1h", "4H": "4h", "1D": "1d", "1W": "1w" } as const;
  const out: Record<string, { rsi: number; zona: string }> = {};
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
    out[label] = { rsi: round1(val), zona };
  }
  return {
    porTimeframe: out,
    explicacion:
      "RSI (fuerza relativa) calculado en 4 temporalidades a la vez para BTC. Cuando varias temporalidades " +
      "coinciden en la misma zona (todas sobrecompra o todas sobreventa), la señal es más confiable que mirar " +
      "una sola vela o un solo timeframe suelto.",
  };
}

// ---------- PANEL 3: PSY ADX+CVD ----------
async function calcADXCVD() {
  const tfs = { "1H": "1h", "4H": "4h", "1D": "1d", "1W": "1w" } as const;
  const out: Record<
    string,
    { adx: number; direccion: string; cvdPct: number; rsi: number; score: number; etiqueta: string }
  > = {};
  for (const [label, interval] of Object.entries(tfs)) {
    const candles = await fetchKlines(interval, 300);
    if (candles.length < 30) continue;
    const { adx, diPlus, diMinus } = adxDmi(candles, 14, 14);
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

    out[label] = { adx: round1(adx), direccion, cvdPct: round1(cvdPct), rsi: round1(rsiVal), score, etiqueta };
  }
  const scoreTotal = Object.values(out).reduce((a, b) => a + b.score, 0);
  return {
    porTimeframe: out,
    scoreTotal,
    explicacion:
      "ADX mide qué tan FUERTE es la tendencia (no la dirección) — arriba de 25 hay tendencia real, abajo de 20 " +
      "el mercado está lateral/sin dirección clara. DI+/DI- marcan la dirección. Se combina con el CVD (presión " +
      "de compra/venta real) y el RSI en 4 temporalidades para armar un score de confluencia: cuando varias " +
      "temporalidades apuntan al mismo lado, el score sube o baja fuerte.",
  };
}

// ---------- POC REAL (perfil de volumen con operaciones individuales) ----------
// Binance /api/v3/aggTrades da operaciones reales (precio+cantidad), no solo
// velas — con eso armamos un perfil de volumen de verdad y sacamos el POC
// real (la franja de precio con más volumen operado), en vez de un VWAP.
//
// Límite real (no de plata, de cantidad de datos): cada llamada trae máx
// 1000 operaciones. BTC opera muchísimo, así que para ventanas largas
// (varios días) no alcanza a cubrirse toda la ventana nominal con un
// número razonable de llamadas — por eso se cachea fuerte y se declara
// la "cobertura real" (cuánto tiempo realmente cubren las operaciones
// traídas) en vez de mentir que cubrió toda la ventana pedida.
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

// Ventana nominal por temporalidad (lo que "debería" cubrir idealmente) y
// tope de operaciones a traer (Jorge eligió priorizar POC real en TODAS
// las temporalidades, aceptando que sea más lento / más llamadas)
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

  if (out) cSet(cacheKey, out, 5 * 60_000); // cache 5 min — traer aggTrades reales es caro
  return out;
}

// ---------- PANEL 4: PSY LIQUIDITY FLOW v2 (POC real + capital divergencia) ----------
async function calcLiquidityFlow() {
  const tfLabels = ["15m", "30m", "1H", "4H", "1D"] as const;
  const out: Record<string, { poc: number; distPct: number; posicion: string; cobertura: string; coberturaCompleta: boolean }> = {};
  const priceNow = (await fetchKlines("1h", 2)).slice(-1)[0]?.close ?? 0;

  for (const label of tfLabels) {
    const r = await calcPocReal(label);
    if (!r) continue;
    const distPct = priceNow !== 0 ? (Math.abs(r.poc - priceNow) / priceNow) * 100 : 0;
    const posicion = r.poc < priceNow ? "ABAJO" : r.poc > priceNow ? "ARRIBA" : "EN PRECIO";
    out[label] = {
      poc: round2(r.poc),
      distPct: round2(distPct),
      posicion,
      cobertura: r.cobertura,
      coberturaCompleta: r.coberturaCompleta,
    };
  }

  const pocsAbajo = Object.values(out).filter((v) => v.posicion === "ABAJO" && v.distPct > 1.5).length;
  const pocsArriba = Object.values(out).filter((v) => v.posicion === "ARRIBA" && v.distPct > 1.5).length;

  // Divergencia de capital: precio vs volumen (percentil relativo, ventana de 20 velas 1H)
  const candles1h = await fetchKlines("1h", 40);
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

  const pocScore = Math.max(0, 100 - pocsAbajo * 20);
  const capScore = capBull ? 75 : capBear ? 25 : 50;
  const liqScore = pocScore * 0.6 + capScore * 0.4;

  return {
    porTimeframe: out,
    pocsAbajo,
    pocsArriba,
    capitalDiv: round1(capitalDiv),
    capitalEstado: capBull ? "ACUMULACIÓN" : capBear ? "DISTRIBUCIÓN" : "NEUTRAL",
    liqScore: Math.round(liqScore),
    explicacion:
      "El POC (punto de mayor volumen operado) actúa como un 'imán' de precio — si hay POCs por debajo del " +
      "precio actual, el mercado tiende a bajar a buscarlos antes de seguir subiendo. Ahora es un POC REAL: se " +
      "arma con operaciones individuales de Binance (no velas), agrupadas en franjas de precio, igual que un " +
      "volume profile de verdad. Nota honesta sobre 'cobertura': BTC opera tantas veces por segundo que en " +
      "temporalidades largas (4H/1D) puede no alcanzarse toda la ventana de tiempo ideal con una cantidad " +
      "razonable de llamadas — por eso cada fila muestra cuánto tiempo real cubren las operaciones usadas " +
      "('cobertura'), en vez de fingir que siempre cubre la ventana completa. La 'divergencia de capital' compara " +
      "si el precio sube más rápido que el volumen (señal de distribución) o al revés (acumulación).",
  };
}

// ---------- PANEL 5: PSY FUNDING SENTIMENT v2.1 ----------
async function calcFundingSentiment() {
  const tfs = { "15m": "15m", "30m": "30m", "1H": "1h", "4H": "4h", "1D": "1d" } as const;
  const out: Record<string, { cvdPct: number; estado: string }> = {};
  for (const [label, interval] of Object.entries(tfs)) {
    const candles = await fetchKlines(interval, 60);
    if (candles.length < 10) continue;
    const cvdPct = cvdNormalizedPct(candles, 20);
    const estado = cvdPct > 3 ? "COMPRA" : cvdPct < -3 ? "VENTA" : "NEUTRO";
    out[label] = { cvdPct: round1(cvdPct), estado };
  }
  const bulls = Object.values(out).filter((v) => v.estado === "COMPRA").length;
  const bears = Object.values(out).filter((v) => v.estado === "VENTA").length;
  const cvdScore = Math.min(Math.max(50 + (bulls - bears) * 10, 0), 100);

  // Funding REAL (no proxy) — mejora honesta vs el Pine original
  const fundingHist = await fetchFundingHistory(10);
  const fundingNow = fundingHist[fundingHist.length - 1]?.rate ?? 0;
  const fundSat = 0.05; // % — saturación típica de funding real (no la distancia a EMA del Pine)
  const fundScore = Math.min(Math.max(50 - (fundingNow / fundSat) * 50, 0), 100);

  // OI real (no proxy de volumen)
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

  return {
    porTimeframe: out,
    fundingPct: round4(fundingNow),
    oiEstado: oiRising ? "SUBIENDO" : oiFalling ? "BAJANDO" : "ESTABLE",
    sentimentScore,
    label,
    squeezeSignal,
    explicacion:
      "Combina el CVD (presión de compra/venta real) en 5 temporalidades con la tasa de FUNDING real de Binance " +
      "(no una aproximación) y el Open Interest real. Funding muy negativo + CVD bajista en varias temporalidades " +
      "= los shorts están pagando caro y podrían estar atrapados → señal de posible short squeeze.",
  };
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

// ---------- Endpoint único: los 5 paneles juntos ----------
router.get("/psy-panels-btc/live", async (_req: Request, res: Response) => {
  try {
    const [smd, rsiMaster, adxCvd, liquidityFlow, fundingSentiment] = await Promise.all([
      calcSMD(),
      calcRSIMaster(),
      calcADXCVD(),
      calcLiquidityFlow(),
      calcFundingSentiment(),
    ]);
    res.json({
      updatedAt: Date.now(),
      simbolo: "BTCUSDT",
      smd,
      rsiMaster,
      adxCvd,
      liquidityFlow,
      fundingSentiment,
    });
  } catch (err: any) {
    console.error("[psy-panels-btc] error calculando paneles", err);
    res.status(500).json({ error: "No se pudieron calcular los paneles", detalle: err?.message });
  }
});

export default router;
