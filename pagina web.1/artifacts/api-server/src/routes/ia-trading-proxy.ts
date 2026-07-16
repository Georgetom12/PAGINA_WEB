/**
 * PSYCHOMETRIKS INTELLIGENT AI TRADING — Motor NATIVO (TypeScript)
 * ─────────────────────────────────────────────────────────────────────────────
 * ACTUALIZACIÓN (jul 2026): esto YA NO llama al servicio Python externo
 * (motor_psy, deploy separado en Railway). Ahora calcula todo directo aquí,
 * en el mismo proceso del api-server — reutilizando los mismos indicadores
 * ya probados en `psy-algo.ts` (EMA, RSI, MACD, CVD, ATR, estructura,
 * Fibonacci, patrones de velas/gráfico), extendidos a más temporalidades
 * (5m→1semana) y a la lista completa de monedas de esta página.
 *
 * El formato de respuesta se mantiene IGUAL al que ya esperaba el frontend
 * (ia-trading.tsx) — por eso esa página no necesitó ningún cambio.
 */
import { Router, type Request, type Response } from "express";
import { validateToken } from "../lib/psy-auth";
import {
  ema, rsi, rsiArr, macdCalc, atr, cvd, swings, fibLevels, structure,
  candlePatterns, chartPatterns, type OHLCV, type CandlePattern,
} from "./psy-algo";

const router = Router();

const FALLBACK_SYMBOLS = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT","LINKUSDT","AAVEUSDT","INJUSDT"];
const TOP_SYMBOLS_COUNT = 60;
let _topSymbolsCache: { data: string[]; ts: number } | null = null;
const TOP_SYMBOLS_TTL_MS = 15 * 60_000;

async function getTopSymbols(): Promise<string[]> {
  if (_topSymbolsCache && Date.now() - _topSymbolsCache.ts < TOP_SYMBOLS_TTL_MS) return _topSymbolsCache.data;
  try {
    const r = await fetch("https://fapi.binance.com/fapi/v1/ticker/24hr", { signal: AbortSignal.timeout(8000) });
    if (r.ok) {
      const d = await r.json() as Array<Record<string, unknown>>;
      const syms = d
        .filter(x => String(x.symbol).endsWith("USDT"))
        .sort((a, b) => parseFloat(String(b.quoteVolume)) - parseFloat(String(a.quoteVolume)))
        .slice(0, TOP_SYMBOLS_COUNT)
        .map(x => String(x.symbol));
      if (syms.length) { _topSymbolsCache = { data: syms, ts: Date.now() }; return syms; }
    }
  } catch { /* usa el respaldo fijo */ }
  return FALLBACK_SYMBOLS;
}
const TIMEFRAMES: Record<string, string> = {
  "5m": "5m", "15m": "15m", "30m": "30m", "1h": "1h", "4h": "4h", "1d": "1d", "1w": "1w",
};

// ─── Cache (5 min, igual que antes) ────────────────────────────────────────
const _cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_MS = 5 * 60_000;

async function requireElite(req: Request, res: Response): Promise<boolean> {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  const allowed = auth.role === "superadmin" || auth.plan === "elite";
  if (!allowed) { res.status(403).json({ ok: false, error: "Requiere plan Elite" }); return false; }
  return true;
}

// ─── Datos: Binance Futures (cubre todas las monedas de la lista) ─────────
async function fetchKlines(symbol: string, interval: string, limit = 200): Promise<OHLCV[]> {
  try {
    const r = await fetch(
      `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!r.ok) return [];
    const d = await r.json() as unknown[][];
    return d.map(k => ({
      time: Number(k[0]), open: parseFloat(String(k[1])), high: parseFloat(String(k[2])),
      low: parseFloat(String(k[3])), close: parseFloat(String(k[4])), volume: parseFloat(String(k[5])),
    }));
  } catch { return []; }
}

// ─── Macro (mismo patrón/endpoint que ya funciona en market.ts) ───────────
const YF_HEADERS = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" };
async function yahooChangePct(symbol: string): Promise<number | null> {
  const path = `v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  for (const host of ["query2.finance.yahoo.com", "query1.finance.yahoo.com"]) {
    try {
      const r = await fetch(`https://${host}/${path}`, { headers: YF_HEADERS, signal: AbortSignal.timeout(8000) });
      if (!r.ok) continue;
      const d = await r.json() as { chart?: { result?: [{ meta?: { regularMarketPrice?: number; chartPreviousClose?: number; previousClose?: number } }] } };
      const meta = d?.chart?.result?.[0]?.meta;
      if (!meta?.regularMarketPrice) continue;
      const prev = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice;
      return ((meta.regularMarketPrice - prev) / prev) * 100;
    } catch { /* intenta el siguiente host */ }
  }
  return null;
}
async function yahooLevel(symbol: string): Promise<number | null> {
  const path = `v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  for (const host of ["query2.finance.yahoo.com", "query1.finance.yahoo.com"]) {
    try {
      const r = await fetch(`https://${host}/${path}`, { headers: YF_HEADERS, signal: AbortSignal.timeout(8000) });
      if (!r.ok) continue;
      const d = await r.json() as { chart?: { result?: [{ meta?: { regularMarketPrice?: number } }] } };
      const p = d?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (p) return p;
    } catch { /* siguiente host */ }
  }
  return null;
}

async function getMacro() {
  const [dxy, vix, spx, gold, wti, ...mag7] = await Promise.all([
    yahooChangePct("DX-Y.NYB"), yahooLevel("^VIX"), yahooChangePct("^GSPC"),
    yahooLevel("GC=F"), yahooLevel("CL=F"),
    yahooChangePct("AAPL"), yahooChangePct("MSFT"), yahooChangePct("GOOGL"),
    yahooChangePct("AMZN"), yahooChangePct("META"), yahooChangePct("NVDA"), yahooChangePct("TSLA"),
  ]);
  const mag7Valid = mag7.filter((v): v is number => v !== null);
  const mag7_avg = mag7Valid.length ? mag7Valid.reduce((a, b) => a + b, 0) / mag7Valid.length : 0;
  const dxyChange = dxy ?? 0;
  const vixValue = vix ?? 16;
  const spxChange = spx ?? 0;

  let sesgo_score = 50;
  sesgo_score += spxChange > 0 ? 10 : -10;
  sesgo_score += dxyChange < 0 ? 10 : -10;
  sesgo_score += vixValue < 18 ? 10 : vixValue > 25 ? -15 : 0;
  sesgo_score += mag7_avg > 0 ? 10 : -10;
  sesgo_score = Math.max(0, Math.min(100, sesgo_score));
  const sesgo = sesgo_score >= 60 ? "RISK_ON" : sesgo_score <= 40 ? "RISK_OFF" : "NEUTRAL";

  const narrativa: string[] = [];
  narrativa.push(`DXY ${dxyChange >= 0 ? "+" : ""}${dxyChange.toFixed(2)}% ${dxyChange > 0 ? "→ presión bajista sobre cripto" : "→ viento a favor de cripto"}`);
  narrativa.push(`VIX ${vixValue.toFixed(0)} ${vixValue > 25 ? "— miedo elevado en mercados" : vixValue < 18 ? "— complacencia, apetito de riesgo" : "— normal"}`);
  narrativa.push(`Mag7 promedio ${mag7_avg >= 0 ? "+" : ""}${mag7_avg.toFixed(2)}% — ${mag7_avg > 0 ? "tech liderando al alza" : "tech débil"}`);

  return { sesgo, sesgo_score, dxy_change: dxyChange, vix_value: vixValue, spx_change: spxChange, mag7_avg, gold_value: gold ?? 0, wti_value: wti ?? 0, narrativa };
}

// ─── Análisis nativo completo por símbolo ─────────────────────────────────
async function analizarNativo(symbolRaw: string) {
  const symbol = symbolRaw.toUpperCase().trim();
  const cacheKey = symbol;
  const hit = _cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < CACHE_MS) return hit.data;

  const tfKeys = ["5m", "15m", "30m", "1h", "4h", "1d", "1w"];
  const klinesByTf: Record<string, OHLCV[]> = {};
  await Promise.all(tfKeys.map(async tf => { klinesByTf[tf] = await fetchKlines(symbol, TIMEFRAMES[tf]!, tf === "1w" ? 60 : 200); }));

  const c1h = klinesByTf["1h"] ?? [], c4h = klinesByTf["4h"] ?? [], c1d = klinesByTf["1d"] ?? [], c1w = klinesByTf["1w"] ?? [];
  if (!c1h.length || !c4h.length) return { error: `Sin datos para ${symbol}` };

  const price = c1h.at(-1)!.close;

  // RSI en cascada (5m → 1 semana)
  const rsi_map: Record<string, number> = {};
  for (const tf of tfKeys) {
    const cl = (klinesByTf[tf] ?? []).map(c => c.close);
    rsi_map[tf] = cl.length > 15 ? Math.round(rsi(cl) * 10) / 10 : 50;
  }
  const rsi_energy = Math.round((Object.values(rsi_map).reduce((a, b) => a + b, 0) / tfKeys.length) * 10) / 10;

  // EMA / MACD / CVD / estructura
  const cl1h = c1h.map(c => c.close), cl4h = c4h.map(c => c.close);
  const e9 = ema(cl1h, 9).at(-1)!, e21 = ema(cl1h, 21).at(-1)!;
  const e50 = ema(cl4h, 50).at(-1)!, e200 = ema(cl4h, 200).at(-1)!;
  const rsi1h = rsi_map["1h"]!, rsi4h = rsi_map["4h"]!, rsi1d = rsi_map["1d"]!;
  const rArr1h = rsiArr(cl1h);
  const rsi1hPrev5 = rArr1h.at(-6) ?? rsi1h, pxPrev5 = cl1h.at(-6) ?? price;
  const rsiDiv = (price < pxPrev5 && rsi1h > rsi1hPrev5) ? "BULLISH_DIV" : (price > pxPrev5 && rsi1h < rsi1hPrev5) ? "BEARISH_DIV" : "NONE";
  const m4 = macdCalc(cl4h);
  const mH = m4.hist.at(-1)!, mHP = m4.hist.at(-2) ?? 0;
  const macdX = mHP < 0 && mH > 0 ? "BULLISH" : mHP > 0 && mH < 0 ? "BEARISH" : "NONE";
  const cvd1h = cvd(c1h);
  const cvdTrend = (cvd1h.at(-1) ?? 0) > (cvd1h.at(-10) ?? 0) ? "BULLISH" : "BEARISH";
  const st4h = structure(c4h), st1d = structure(c1d), st1w = c1w.length ? structure(c1w) : "NEUTRAL";
  const atr4h = atr(c4h);

  // Patrones (fractales) en varias temporalidades
  const p1h = candlePatterns(c1h.slice(-8), "1H");
  const p4h = candlePatterns(c4h.slice(-8), "4H");
  const ch4h = chartPatterns(c4h, "4H", price);
  const ch1d = c1d.length ? chartPatterns(c1d, "1D", price) : [];
  const chW = c1w.length ? chartPatterns(c1w, "SEMANAL", price) : [];
  const allP: CandlePattern[] = [...p1h, ...p4h, ...ch4h, ...ch1d, ...chW];
  const bullP = allP.filter(p => p.type === "BULLISH"), bearP = allP.filter(p => p.type === "BEARISH");
  const bestPattern = [...allP].sort((a, b) => (b.target ? 1 : 0) - (a.target ? 1 : 0))[0];

  // Fibonacci (swing 4H)
  const { highs: H4, lows: L4 } = swings(c4h, 5);
  const swH = H4.slice(-3).reduce((a, b) => Math.max(a, b.price), 0) || price * 1.10;
  const swLRaw = L4.slice(-3).reduce((a, b) => Math.min(a, b.price), Infinity);
  const swL = isFinite(swLRaw) ? swLRaw : price * 0.90;
  const fibs = fibLevels(swH, swL);

  // ── Scoring (misma filosofía que psy-algo.ts, extendido a 1D/1SEM) ──────
  let score = 0; let dir: "ALCISTA" | "BAJISTA" | "NEUTRAL" = "NEUTRAL";
  const contexto: string[] = [];
  if (e9 > e21 && e21 > e50) { score += 2; dir = "ALCISTA"; contexto.push("EMA 9>21>50 (1H/4H) — alineación alcista"); }
  if (e9 < e21 && e21 < e50) { score += 2; dir = "BAJISTA"; contexto.push("EMA 9<21<50 (1H/4H) — alineación bajista"); }
  contexto.push(price > e200 ? "Precio > EMA200 (4H) — macro alcista" : "Precio < EMA200 (4H) — macro bajista");
  if (rsiDiv === "BULLISH_DIV") { score += 3; dir = "ALCISTA"; contexto.push("Divergencia alcista RSI (1H)"); }
  if (rsiDiv === "BEARISH_DIV") { score += 3; dir = "BAJISTA"; contexto.push("Divergencia bajista RSI (1H)"); }
  if (macdX === "BULLISH") { score += 3; dir = "ALCISTA"; contexto.push("MACD cruce alcista (4H)"); }
  if (macdX === "BEARISH") { score += 3; dir = "BAJISTA"; contexto.push("MACD cruce bajista (4H)"); }
  contexto.push(cvdTrend === "BULLISH" ? "CVD (1H) — compras netas dominando" : "CVD (1H) — ventas netas dominando");
  if (st4h === "BULLISH") { score += 1; contexto.push("Estructura 4H alcista (HH/HL)"); }
  if (st4h === "BEARISH") { score += 1; contexto.push("Estructura 4H bajista (LH/LL)"); }
  if (st1d === "BULLISH") { score += 1; contexto.push("Estructura 1D alcista"); }
  if (st1d === "BEARISH") { score += 1; contexto.push("Estructura 1D bajista"); }
  if (st1w === "BULLISH") { score += 1; contexto.push("Estructura semanal alcista — macro"); }
  if (st1w === "BEARISH") { score += 1; contexto.push("Estructura semanal bajista — macro"); }
  if (bullP.length) { score += Math.min(bullP.length * 1.5, 4); contexto.push(`${bullP.length} patrón(es) alcista(s): ${bullP.map(p => p.name).join(", ")}`); }
  if (bearP.length) { score += Math.min(bearP.length * 1.5, 4); contexto.push(`${bearP.length} patrón(es) bajista(s): ${bearP.map(p => p.name).join(", ")}`); }

  if (dir === "NEUTRAL") dir = bullP.length > bearP.length ? "ALCISTA" : bearP.length > bullP.length ? "BAJISTA" : "NEUTRAL";
  const confianza = Math.round(Math.min(100, (score / 24) * 100));
  const accion: "ENTRAR" | "ESPERAR" | "EVITAR" = dir === "NEUTRAL" ? "EVITAR" : confianza >= 65 ? "ENTRAR" : confianza >= 40 ? "ESPERAR" : "EVITAR";

  // Bear score independiente (qué tan fuerte es el caso bajista, sin importar cuál ganó)
  const bearScore = Math.round(Math.min(100, ((bearP.length * 1.5) + (macdX === "BEARISH" ? 3 : 0) + (rsiDiv === "BEARISH_DIV" ? 3 : 0) + (st4h === "BEARISH" ? 1 : 0) + (st1d === "BEARISH" ? 1 : 0)) / 12 * 100));

  // Entrada / SL / TPs
  const zona_entrada = dir === "ALCISTA" ? fibs.f618 : dir === "BAJISTA" ? fibs.f382 : price;
  const zona_razon = dir === "ALCISTA"
    ? `Fib 61.8% (${fibs.f618.toFixed(2)}) + estructura 4H — zona de recarga`
    : dir === "BAJISTA"
    ? `Fib 38.2% (${fibs.f382.toFixed(2)}) + estructura 4H — zona de distribución`
    : "Sin zona clara — mercado neutral";
  const sl = dir === "ALCISTA" ? swL - atr4h * 0.5 : dir === "BAJISTA" ? swH + atr4h * 0.5 : price * (price > 0 ? 0.95 : 1);
  const sl_razon = dir === "ALCISTA" ? "Debajo del swing low 4H − 0.5×ATR" : dir === "BAJISTA" ? "Arriba del swing high 4H + 0.5×ATR" : "—";

  const bullTargets = allP.filter(p => p.type === "BULLISH" && p.target).map(p => p.target!);
  const bearTargets = allP.filter(p => p.type === "BEARISH" && p.target).map(p => p.target!);
  const tp1_corto = dir === "ALCISTA" ? (bullTargets[0] ?? fibs.f786) : dir === "BAJISTA" ? (bearTargets[0] ?? fibs.f382) : price;
  const tp2_corto = dir === "ALCISTA" ? (bullTargets[1] ?? fibs.f1272) : dir === "BAJISTA" ? (bearTargets[1] ?? swL) : price;
  const tp3_corto = dir === "ALCISTA" ? swH : dir === "BAJISTA" ? swL - atr4h : price;
  const tp1_macro = dir === "ALCISTA" ? (ch1d.find(p => p.type === "BULLISH")?.target ?? fibs.f1272) : dir === "BAJISTA" ? (ch1d.find(p => p.type === "BEARISH")?.target ?? fibs.f382 * 0.95) : price;
  const tp2_macro = dir === "ALCISTA" ? (chW.find(p => p.type === "BULLISH")?.target ?? fibs.f1272 * 1.05) : dir === "BAJISTA" ? (chW.find(p => p.type === "BEARISH")?.target ?? swL * 0.9) : price;
  const tp3_macro = dir === "ALCISTA" ? swH * 1.15 : dir === "BAJISTA" ? swL * 0.85 : price;

  // Zonas de confluencia (fib + targets de patrones + swing levels)
  type Zona = [number, string, number];
  const zonasRaw: Zona[] = [
    [fibs.f618, "Fib 61.8%", 10], [fibs.f500, "Fib 50%", 6], [fibs.f382, "Fib 38.2%", 8],
    [fibs.f786, "Fib 78.6%", 6], [fibs.f1272, "Ext 127.2%", 5],
    [swH, "Swing High 4H", 7], [swL, "Swing Low 4H", 7],
    ...allP.filter(p => p.target).map((p): Zona => [p.target!, p.name, p.strength === "FUERTE" ? 9 : p.strength === "MODERADO" ? 6 : 3]),
  ];
  const zonas_clave = zonasRaw.sort((a, b) => b[2] - a[2]).slice(0, 6);
  const best = zonas_clave[0];

  // POC Cascade — "Point of Control" aproximado por temporalidad (precio de la
  // vela de mayor volumen entre las últimas N), comparado contra el precio actual
  const pocCascade: Record<string, { level: number; status: "ARRIBA" | "CERCA" | "ABAJO" }> = {};
  for (const tf of tfKeys) {
    const candles = (klinesByTf[tf] ?? []).slice(-40);
    if (!candles.length) { pocCascade[tf] = { level: price, status: "CERCA" }; continue; }
    const pocCandle = candles.reduce((a, b) => (b.volume > a.volume ? b : a));
    const level = (pocCandle.high + pocCandle.low + pocCandle.close) / 3;
    const diffPct = ((price - level) / level) * 100;
    const status = diffPct > 0.3 ? "ARRIBA" : diffPct < -0.3 ? "ABAJO" : "CERCA";
    pocCascade[tf] = { level, status };
  }
  const pocsAbajo = Object.values(pocCascade).filter(p => p.status === "ABAJO").length;

  // Bollinger Bands (20, 2σ) + ancho de canal + pendiente de regresión — todo sobre 4H
  const bbPeriod = Math.min(20, cl4h.length - 1);
  const bbSlice = cl4h.slice(-bbPeriod);
  const bbMid = bbSlice.reduce((a, b) => a + b, 0) / (bbSlice.length || 1);
  const bbVariance = bbSlice.reduce((a, b) => a + (b - bbMid) ** 2, 0) / (bbSlice.length || 1);
  const bbStd = Math.sqrt(bbVariance);
  const bbUpper = bbMid + bbStd * 2, bbLower = bbMid - bbStd * 2;
  const bbWidthPct = bbMid > 0 ? ((bbUpper - bbLower) / bbMid) * 100 : 0;
  const bollinger = bbWidthPct > 8 ? "ANCHO" : bbWidthPct > 4 ? "MEDIO" : "ESTRECHO";

  // Pendiente de regresión lineal simple sobre los últimos 20 cierres (4H)
  const regSlice = cl4h.slice(-20);
  const n = regSlice.length;
  const xMean = (n - 1) / 2, yMean = regSlice.reduce((a, b) => a + b, 0) / (n || 1);
  let num = 0, den = 0;
  regSlice.forEach((y, i) => { num += (i - xMean) * (y - yMean); den += (i - xMean) ** 2; });
  const slopeRaw = den > 0 ? num / den : 0;
  const slopePct = yMean > 0 ? (slopeRaw / yMean) * 100 : 0;

  // Posición del precio DENTRO del canal de regresión (Superior/Medio/Inferior) —
  // no confundir con la fuerza de la pendiente (eso es "slope" aparte)
  const regResiduals = regSlice.map((y, i) => y - (yMean + slopeRaw * (i - xMean)));
  const regStd = Math.sqrt(regResiduals.reduce((a, r) => a + r ** 2, 0) / (n || 1));
  const lastResidual = regResiduals.at(-1) ?? 0;
  const canalReg = lastResidual > regStd * 0.5 ? "SUPERIOR" : lastResidual < -regStd * 0.5 ? "INFERIOR" : "MEDIO";

  const macro = await getMacro();

  const nucleo = {
    fractal_tipo: bestPattern?.type ?? "NINGUNO",
    fractal_pro_patron: bestPattern?.name ?? "NINGUNO",
    fractal_descripcion: bestPattern?.description ?? "Sin patrón dominante detectado en este momento.",
    fractal_objetivo: bestPattern?.target ?? null,
    fractal_fuerza: bestPattern?.strength ?? "DÉBIL",
    fractal_confianza: bestPattern?.strength === "FUERTE" ? 85 : bestPattern?.strength === "MODERADO" ? 55 : bestPattern ? 25 : 0,
    rsi_map, rsi_energy,
    vwap: c1d.length ? c1d.slice(-20).reduce((a, c) => a + (c.high + c.low + c.close) / 3 * c.volume, 0) / (c1d.slice(-20).reduce((a, c) => a + c.volume, 0) || 1) : price,
    precio_vwap: price > 0 ? (price > (c1d.length ? c1d.slice(-1)[0]!.close : price) ? "SOBRE" : "BAJO") : "—",
    fib_618: fibs.f618, fib_382: fibs.f382,
    agotamiento_score: Math.round(Math.abs(rsi1h - 50) * 2),
    agotamiento_dir: rsi1h > 65 ? "SOBRECOMPRA" : rsi1h < 35 ? "SOBREVENTA" : "NEUTRAL",
    bear_score: bearScore,
    verdict: dir,
    best_level: best ? best[1] : "—",
    best_score: best ? best[2] * 10 : 0,
    zonas_clave,
    poc_cascade: pocCascade,
    pocs_abajo: pocsAbajo,
    bollinger, canal_reg: canalReg, slope: slopePct,
  };

  const dictamen = {
    dictamen: `${dir} CON ${accion === "ENTRAR" ? "SEÑAL CONFIRMADA" : accion === "ESPERAR" ? "CONFIRMACIÓN PARCIAL" : "SIN EDGE CLARO"}`,
    direccion: dir, confianza, accion, contexto,
    zona_entrada, zona_razon, sl, sl_razon,
    tp1_corto, tp2_corto, tp3_corto, tp1_macro, tp2_macro, tp3_macro,
  };

  // ── Scalping (5m-15m-30m-1H) — análisis PARALELO e independiente, temporalidad
  // baja, para quien opera en minutos/horas en vez de días/semanas ──────────
  const c5m = klinesByTf["5m"] ?? [], c15m = klinesByTf["15m"] ?? [], c30m = klinesByTf["30m"] ?? [];
  let dictamen_scalping = null as null | { direccion: string; confianza: number; accion: string; contexto: string[] };
  if (c5m.length > 30 && c15m.length > 30) {
    const cl5 = c5m.map(c => c.close), cl15 = c15m.map(c => c.close);
    const e9s = ema(cl5, 9).at(-1)!, e21s = ema(cl5, 21).at(-1)!;
    const e50s = ema(cl15, 50).at(-1)!, e200s = ema(cl15, Math.min(200, cl15.length - 1)).at(-1)!;
    const rsi5 = rsi(cl5), rsi15 = rsi(cl15);
    const m15 = macdCalc(cl15);
    const mHs = m15.hist.at(-1)!, mHPs = m15.hist.at(-2) ?? 0;
    const macdXs = mHPs < 0 && mHs > 0 ? "BULLISH" : mHPs > 0 && mHs < 0 ? "BEARISH" : "NONE";
    const st30 = c30m.length ? structure(c30m) : "NEUTRAL";

    let sScore = 0; let sDir: "ALCISTA" | "BAJISTA" | "NEUTRAL" = "NEUTRAL";
    const sCtx: string[] = [];
    if (e9s > e21s && e21s > e50s) { sScore += 2; sDir = "ALCISTA"; sCtx.push("EMA 9>21>50 (5m/15m) — momentum alcista de corto"); }
    if (e9s < e21s && e21s < e50s) { sScore += 2; sDir = "BAJISTA"; sCtx.push("EMA 9<21<50 (5m/15m) — momentum bajista de corto"); }
    if (rsi5 < 30) { sScore += 2; sDir = "ALCISTA"; sCtx.push(`RSI 5m ${rsi5.toFixed(0)} — sobreventa de corto plazo`); }
    if (rsi5 > 70) { sScore += 2; sDir = "BAJISTA"; sCtx.push(`RSI 5m ${rsi5.toFixed(0)} — sobrecompra de corto plazo`); }
    if (macdXs === "BULLISH") { sScore += 2; sDir = "ALCISTA"; sCtx.push("MACD cruce alcista (15m)"); }
    if (macdXs === "BEARISH") { sScore += 2; sDir = "BAJISTA"; sCtx.push("MACD cruce bajista (15m)"); }
    if (st30 === "BULLISH") { sScore += 1; sCtx.push("Estructura 30m alcista"); }
    if (st30 === "BEARISH") { sScore += 1; sCtx.push("Estructura 30m bajista"); }
    sCtx.push(`RSI 15m ${rsi15.toFixed(0)}`);

    const sConfianza = Math.round(Math.min(100, (sScore / 9) * 100));
    const sAccion = sDir === "NEUTRAL" ? "EVITAR" : sConfianza >= 65 ? "ENTRAR" : sConfianza >= 40 ? "ESPERAR" : "EVITAR";
    dictamen_scalping = { direccion: sDir, confianza: sConfianza, accion: sAccion, contexto: sCtx };
  }

  const memoria = {
    ajuste_confianza: 0,
    notas: ["Motor nativo — sin historial propio acumulado todavía. La confianza que ves es 100% del análisis técnico de este momento, sin ajuste histórico."],
    stats: { accuracy: undefined, ganancia_avg: undefined, total: 0 },
    recientes: [] as { dir: string; resultado: string; ganancia: number; hace_h: number }[],
  };

  const result = { symbol, precio: price, dictamen, dictamen_scalping, nucleo, macro, memoria };
  _cache.set(cacheKey, { data: result, ts: Date.now() });
  return result;
}

// ─── Rutas (mismos paths de siempre — el frontend no necesita cambiar) ────
router.post("/ia-trading/analizar", async (req: Request, res: Response) => {
  if (!(await requireElite(req, res))) return;
  const symbol = String((req.body as { symbol?: string })?.symbol ?? "").trim();
  if (!symbol) { res.json({ error: "Símbolo requerido" }); return; }
  try {
    const data = await analizarNativo(symbol);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/ia-trading/top-symbols", async (req: Request, res: Response) => {
  if (!(await requireElite(req, res))) return;
  const symbols = await getTopSymbols();
  res.json({ symbols });
});

// Historial/leaderboard: honestos — el motor nativo recién arranca, sin
// historial propio acumulado todavía (antes esto venía del bot Python).
router.get("/ia-trading/historial", async (req: Request, res: Response) => {
  if (!(await requireElite(req, res))) return;
  res.json({ historial: [], nota: "Motor nativo recién activado — el historial se irá acumulando a partir de ahora." });
});

router.get("/ia-trading/leaderboard", async (req: Request, res: Response) => {
  if (!(await requireElite(req, res))) return;
  res.json({ leaderboard: [], nota: "Motor nativo recién activado — el leaderboard se irá acumulando a partir de ahora." });
});

export default router;
