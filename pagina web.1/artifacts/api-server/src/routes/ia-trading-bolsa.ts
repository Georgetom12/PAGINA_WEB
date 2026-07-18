/**
 * IA TRADING — BOLSA DE VALORES (acciones + forex)
 * ─────────────────────────────────────────────────────────────────────────────
 * Adaptado de `ia-trading-proxy.ts` (el motor de cripto) — misma filosofía de
 * análisis (RSI en cascada, EMA/MACD, estructura, Fibonacci, patrones,
 * divergencia real, zonas de confluencia, entrada/SL/TPs), pero con datos de
 * Yahoo Finance en vez de Binance, ya que acciones y forex no tienen
 * futuros perpetuos (por eso no hay OI/funding/CVD aquí — no existen en
 * estos mercados). Archivo NUEVO y separado del motor cripto, no lo toca.
 */
import { Router, type Request, type Response } from "express";
import { validateToken } from "../lib/psy-auth";
import {
  ema, rsi, macdCalc, atr, swings, fibLevels, structure,
  candlePatterns, chartPatterns, type OHLCV, type CandlePattern,
} from "./psy-algo";
import { detectarDivergencia } from "./altcoin-signals";

const router = Router();

const STOCK_SYMBOLS = ["AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA","BRK-B","JPM","V","WMT","XOM","JNJ","UNH","PG","MA","LLY","COST","HD","NFLX"];
const FOREX_SYMBOLS = ["EURUSD=X","GBPUSD=X","USDJPY=X","USDCHF=X","AUDUSD=X","USDCAD=X","NZDUSD=X","EURGBP=X","EURJPY=X","GBPJPY=X"];
const ALL_SYMBOLS = [...STOCK_SYMBOLS, ...FOREX_SYMBOLS];

const _cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_MS = 5 * 60_000;

async function requireElite(req: Request, res: Response): Promise<boolean> {
  const auth = await validateToken(req.headers["x-psy-token"] as string | undefined);
  const allowed = auth.role === "superadmin" || auth.plan === "elite";
  if (!allowed) { res.status(403).json({ ok: false, error: "Requiere plan Elite" }); return false; }
  return true;
}

// ─── Datos: Yahoo Finance (mismo endpoint sin auth ya probado en market.ts) ─
const YF_HEADERS = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" };
const YF_INTERVAL: Record<string, string> = { "15m": "15m", "1h": "60m", "4h": "60m", "1d": "1d", "1w": "1wk" };
const YF_RANGE: Record<string, string> = { "15m": "1mo", "1h": "3mo", "4h": "3mo", "1d": "2y", "1w": "5y" };

async function fetchKlines(symbol: string, tf: string): Promise<OHLCV[]> {
  const interval = YF_INTERVAL[tf] ?? "1d", range = YF_RANGE[tf] ?? "1y";
  for (const host of ["query2.finance.yahoo.com", "query1.finance.yahoo.com"]) {
    try {
      const r = await fetch(
        `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`,
        { headers: YF_HEADERS, signal: AbortSignal.timeout(10000) },
      );
      if (!r.ok) continue;
      const d = await r.json() as {
        chart?: { result?: [{ timestamp?: number[]; indicators?: { quote?: [{ open?: (number|null)[]; high?: (number|null)[]; low?: (number|null)[]; close?: (number|null)[]; volume?: (number|null)[] }] } }] };
      };
      const res = d?.chart?.result?.[0];
      const ts = res?.timestamp ?? [];
      const q = res?.indicators?.quote?.[0];
      if (!ts.length || !q) continue;
      const out: OHLCV[] = [];
      for (let i = 0; i < ts.length; i++) {
        const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i];
        if (o == null || h == null || l == null || c == null) continue;
        out.push({ time: ts[i]! * 1000, open: o, high: h, low: l, close: c, volume: q.volume?.[i] ?? 0 });
      }
      if (tf === "4h" && interval === "60m") return agruparVelas(out, 4); // Yahoo no tiene 4h nativo
      return out;
    } catch { /* intenta el siguiente host */ }
  }
  return [];
}

function agruparVelas(candles: OHLCV[], n: number): OHLCV[] {
  const out: OHLCV[] = [];
  for (let i = 0; i < candles.length; i += n) {
    const g = candles.slice(i, i + n);
    if (!g.length) continue;
    out.push({
      time: g[0]!.time, open: g[0]!.open,
      high: Math.max(...g.map(c => c.high)), low: Math.min(...g.map(c => c.low)),
      close: g.at(-1)!.close, volume: g.reduce((a, c) => a + c.volume, 0),
    });
  }
  return out;
}

// ─── Macro (mismo patrón ya usado en ia-trading-proxy.ts / market.ts) ──────
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
    } catch { /* siguiente host */ }
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
  const [dxy, vix, spx, ...mag7] = await Promise.all([
    yahooChangePct("DX-Y.NYB"), yahooLevel("^VIX"), yahooChangePct("^GSPC"),
    yahooChangePct("AAPL"), yahooChangePct("MSFT"), yahooChangePct("NVDA"),
  ]);
  const mag7Valid = mag7.filter((v): v is number => v !== null);
  const mag7_avg = mag7Valid.length ? mag7Valid.reduce((a, b) => a + b, 0) / mag7Valid.length : 0;
  const dxyChange = dxy ?? 0, vixValue = vix ?? 16, spxChange = spx ?? 0;
  let sesgo_score = 50;
  sesgo_score += spxChange > 0 ? 10 : -10;
  sesgo_score += vixValue < 18 ? 10 : vixValue > 25 ? -15 : 0;
  sesgo_score += mag7_avg > 0 ? 10 : -10;
  sesgo_score = Math.max(0, Math.min(100, sesgo_score));
  const sesgo = sesgo_score >= 60 ? "RISK_ON" : sesgo_score <= 40 ? "RISK_OFF" : "NEUTRAL";
  const narrativa = [
    `DXY ${dxyChange >= 0 ? "+" : ""}${dxyChange.toFixed(2)}%`,
    `VIX ${vixValue.toFixed(0)} ${vixValue > 25 ? "— miedo elevado" : vixValue < 18 ? "— complacencia" : "— normal"}`,
    `Mag7 promedio ${mag7_avg >= 0 ? "+" : ""}${mag7_avg.toFixed(2)}%`,
  ];
  return { sesgo, sesgo_score, dxy_change: dxyChange, vix_value: vixValue, spx_change: spxChange, mag7_avg, narrativa };
}

// ─── Análisis nativo (mismo scoring que la versión cripto, sin OI/CVD/funding
// porque acciones y forex no tienen futuros perpetuos) ─────────────────────
async function analizarBolsaNativo(symbolRaw: string) {
  const symbol = symbolRaw.toUpperCase().trim();
  const hit = _cache.get(symbol);
  if (hit && Date.now() - hit.ts < CACHE_MS) return hit.data;

  const tfKeys = ["15m", "1h", "4h", "1d", "1w"];
  const klinesByTf: Record<string, OHLCV[]> = {};
  await Promise.all(tfKeys.map(async tf => { klinesByTf[tf] = await fetchKlines(symbol, tf); }));

  const c1h = klinesByTf["1h"] ?? [], c4h = klinesByTf["4h"] ?? [], c1d = klinesByTf["1d"] ?? [], c1w = klinesByTf["1w"] ?? [];
  if (!c1h.length || !c4h.length) return { error: `Sin datos para ${symbol}` };

  const price = c1h.at(-1)!.close;

  const rsi_map: Record<string, number> = {};
  for (const tf of tfKeys) {
    const cl = (klinesByTf[tf] ?? []).map(c => c.close);
    rsi_map[tf] = cl.length > 15 ? Math.round(rsi(cl) * 10) / 10 : 50;
  }
  const rsi_energy = Math.round((Object.values(rsi_map).reduce((a, b) => a + b, 0) / tfKeys.length) * 10) / 10;

  const cl1h = c1h.map(c => c.close), cl4h = c4h.map(c => c.close);
  const e9 = ema(cl1h, 9).at(-1)!, e21 = ema(cl1h, 21).at(-1)!;
  const e50 = ema(cl4h, Math.min(50, cl4h.length)).at(-1)!, e200 = ema(cl4h, Math.min(200, cl4h.length)).at(-1)!;
  const rsi1h = rsi_map["1h"]!;

  const divergencia1h = detectarDivergencia(c1h, 5);
  const divergencia4h = detectarDivergencia(c4h, 5);
  const divergenciaFinal = divergencia4h.tipo !== "NONE" ? divergencia4h : divergencia1h;
  const rsiDiv = divergenciaFinal.tipo === "DIV_ALCISTA" ? "BULLISH_DIV" : divergenciaFinal.tipo === "DIV_BAJISTA" ? "BEARISH_DIV" : "NONE";

  const m4 = macdCalc(cl4h);
  const mH = m4.hist.at(-1)!, mHP = m4.hist.at(-2) ?? 0;
  const macdX = mHP < 0 && mH > 0 ? "BULLISH" : mHP > 0 && mH < 0 ? "BEARISH" : "NONE";
  const st4h = structure(c4h), st1d = structure(c1d), st1w = c1w.length ? structure(c1w) : "NEUTRAL";
  const atr4h = atr(c4h);

  const p1h = candlePatterns(c1h.slice(-8), "1H");
  const p4h = candlePatterns(c4h.slice(-8), "4H");
  const ch4h = chartPatterns(c4h, "4H", price);
  const ch1d = c1d.length ? chartPatterns(c1d, "1D", price) : [];
  const chW = c1w.length ? chartPatterns(c1w, "SEMANAL", price) : [];
  const allP: CandlePattern[] = [...p1h, ...p4h, ...ch4h, ...ch1d, ...chW];
  const bullP = allP.filter(p => p.type === "BULLISH"), bearP = allP.filter(p => p.type === "BEARISH");
  const bestPattern = [...allP].sort((a, b) => (b.target ? 1 : 0) - (a.target ? 1 : 0))[0];

  const { highs: H4, lows: L4 } = swings(c4h, 5);
  const swH = H4.slice(-3).reduce((a, b) => Math.max(a, b.price), 0) || price * 1.10;
  const swLRaw = L4.slice(-3).reduce((a, b) => Math.min(a, b.price), Infinity);
  const swL = isFinite(swLRaw) ? swLRaw : price * 0.90;
  const fibs = fibLevels(swH, swL);

  let score = 0; let dir: "ALCISTA" | "BAJISTA" | "NEUTRAL" = "NEUTRAL";
  const contexto: string[] = [];
  if (e9 > e21 && e21 > e50) { score += 2; dir = "ALCISTA"; contexto.push("EMA 9>21>50 (1H/4H) — alineación alcista"); }
  if (e9 < e21 && e21 < e50) { score += 2; dir = "BAJISTA"; contexto.push("EMA 9<21<50 (1H/4H) — alineación bajista"); }
  contexto.push(price > e200 ? "Precio > EMA200 (4H) — macro alcista" : "Precio < EMA200 (4H) — macro bajista");
  const pesoDiv = (divergenciaFinal.confianza / 100) * 3;
  if (rsiDiv === "BULLISH_DIV") { score += pesoDiv; dir = "ALCISTA"; contexto.push(`Divergencia alcista (${divergenciaFinal.confianza}%): ${divergenciaFinal.desc}`); }
  if (rsiDiv === "BEARISH_DIV") { score += pesoDiv; dir = "BAJISTA"; contexto.push(`Divergencia bajista (${divergenciaFinal.confianza}%): ${divergenciaFinal.desc}`); }
  if (macdX === "BULLISH") { score += 3; dir = "ALCISTA"; contexto.push("MACD cruce alcista (4H)"); }
  if (macdX === "BEARISH") { score += 3; dir = "BAJISTA"; contexto.push("MACD cruce bajista (4H)"); }
  if (st4h === "BULLISH") { score += 1; contexto.push("Estructura 4H alcista"); }
  if (st4h === "BEARISH") { score += 1; contexto.push("Estructura 4H bajista"); }
  if (st1d === "BULLISH") { score += 1; contexto.push("Estructura 1D alcista"); }
  if (st1d === "BEARISH") { score += 1; contexto.push("Estructura 1D bajista"); }
  if (st1w === "BULLISH") { score += 1; contexto.push("Estructura semanal alcista — macro"); }
  if (st1w === "BEARISH") { score += 1; contexto.push("Estructura semanal bajista — macro"); }
  if (bullP.length) { score += Math.min(bullP.length * 1.5, 4); contexto.push(`${bullP.length} patrón(es) alcista(s): ${bullP.map(p => p.name).join(", ")}`); }
  if (bearP.length) { score += Math.min(bearP.length * 1.5, 4); contexto.push(`${bearP.length} patrón(es) bajista(s): ${bearP.map(p => p.name).join(", ")}`); }

  if (dir === "NEUTRAL") dir = bullP.length > bearP.length ? "ALCISTA" : bearP.length > bullP.length ? "BAJISTA" : "NEUTRAL";
  const confianza = Math.round(Math.min(100, (score / 24) * 100));
  const accion: "ENTRAR" | "ESPERAR" | "EVITAR" = dir === "NEUTRAL" ? "EVITAR" : confianza >= 65 ? "ENTRAR" : confianza >= 40 ? "ESPERAR" : "EVITAR";
  const bearScore = Math.round(Math.min(100, ((bearP.length * 1.5) + (macdX === "BEARISH" ? 3 : 0) + (rsiDiv === "BEARISH_DIV" ? 3 : 0) + (st4h === "BEARISH" ? 1 : 0) + (st1d === "BEARISH" ? 1 : 0)) / 12 * 100));

  const zona_entrada = dir === "ALCISTA" ? fibs.f618 : dir === "BAJISTA" ? fibs.f382 : price;
  const zona_razon = dir === "ALCISTA"
    ? `Fib 61.8% (${fibs.f618.toFixed(2)}) + estructura 4H — zona de recarga`
    : dir === "BAJISTA" ? `Fib 38.2% (${fibs.f382.toFixed(2)}) + estructura 4H — zona de distribución`
    : "Sin zona clara — mercado neutral";
  const sl = dir === "ALCISTA" ? swL - atr4h * 0.5 : dir === "BAJISTA" ? swH + atr4h * 0.5 : price * 0.98;
  const sl_razon = dir === "ALCISTA" ? "Debajo del swing low 4H − 0.5×ATR" : dir === "BAJISTA" ? "Arriba del swing high 4H + 0.5×ATR" : "—";

  const bullTargets = allP.filter(p => p.type === "BULLISH" && p.target).map(p => p.target!);
  const bearTargets = allP.filter(p => p.type === "BEARISH" && p.target).map(p => p.target!);
  const tp1_corto = dir === "ALCISTA" ? (bullTargets[0] ?? fibs.f786) : dir === "BAJISTA" ? (bearTargets[0] ?? fibs.f382) : price;
  const tp2_corto = dir === "ALCISTA" ? (bullTargets[1] ?? fibs.f1272) : dir === "BAJISTA" ? (bearTargets[1] ?? swL) : price;
  const tp3_corto = dir === "ALCISTA" ? swH : dir === "BAJISTA" ? swL - atr4h : price;
  const tp1_macro = dir === "ALCISTA" ? (ch1d.find(p => p.type === "BULLISH")?.target ?? fibs.f1272) : dir === "BAJISTA" ? (ch1d.find(p => p.type === "BEARISH")?.target ?? fibs.f382 * 0.97) : price;
  const tp2_macro = dir === "ALCISTA" ? (chW.find(p => p.type === "BULLISH")?.target ?? fibs.f1272 * 1.03) : dir === "BAJISTA" ? (chW.find(p => p.type === "BEARISH")?.target ?? swL * 0.95) : price;
  const tp3_macro = dir === "ALCISTA" ? swH * 1.08 : dir === "BAJISTA" ? swL * 0.92 : price;

  type Zona = [number, string, number];
  const zonasRaw: Zona[] = [
    [fibs.f618, "Fib 61.8%", 10], [fibs.f500, "Fib 50%", 6], [fibs.f382, "Fib 38.2%", 8],
    [fibs.f786, "Fib 78.6%", 6], [fibs.f1272, "Ext 127.2%", 5],
    [swH, "Swing High 4H", 7], [swL, "Swing Low 4H", 7],
    ...allP.filter(p => p.target).map((p): Zona => [p.target!, p.name, p.strength === "FUERTE" ? 9 : p.strength === "MODERADO" ? 6 : 3]),
  ];
  const zonas_clave = zonasRaw.sort((a, b) => b[2] - a[2]).slice(0, 6);
  const best = zonas_clave[0];

  const macro = await getMacro();

  const nucleo = {
    fractal_tipo: bestPattern?.type ?? "NINGUNO",
    fractal_pro_patron: bestPattern?.name ?? "NINGUNO",
    fractal_descripcion: bestPattern?.description ?? "Sin patrón dominante detectado en este momento.",
    fractal_objetivo: bestPattern?.target ?? null,
    fractal_fuerza: bestPattern?.strength ?? "DÉBIL",
    fractal_confianza: bestPattern?.strength === "FUERTE" ? 85 : bestPattern?.strength === "MODERADO" ? 55 : bestPattern ? 25 : 0,
    rsi_map, rsi_energy,
    fib_618: fibs.f618, fib_382: fibs.f382,
    agotamiento_score: Math.round(Math.abs(rsi1h - 50) * 2),
    agotamiento_dir: rsi1h > 65 ? "SOBRECOMPRA" : rsi1h < 35 ? "SOBREVENTA" : "NEUTRAL",
    bear_score: bearScore,
    verdict: dir,
    best_level: best ? best[1] : "—",
    best_score: best ? best[2] * 10 : 0,
    zonas_clave,
    nota: "Sin OI/CVD/Funding — acciones y forex no tienen futuros perpetuos, esas métricas no existen aquí.",
  };

  const dictamen = {
    dictamen: `${dir} CON ${accion === "ENTRAR" ? "SEÑAL CONFIRMADA" : accion === "ESPERAR" ? "CONFIRMACIÓN PARCIAL" : "SIN EDGE CLARO"}`,
    direccion: dir, confianza, accion, contexto,
    zona_entrada, zona_razon, sl, sl_razon,
    tp1_corto, tp2_corto, tp3_corto, tp1_macro, tp2_macro, tp3_macro,
  };

  const memoria = {
    ajuste_confianza: 0,
    notas: ["Motor nativo de Bolsa — sin historial propio acumulado todavía."],
    stats: { accuracy: undefined, ganancia_avg: undefined, total: 0 },
    recientes: [] as { dir: string; resultado: string; ganancia: number; hace_h: number }[],
  };

  const result = { symbol, precio: price, dictamen, nucleo, macro, memoria };
  _cache.set(symbol, { data: result, ts: Date.now() });
  return result;
}

router.post("/ia-trading-bolsa/analizar", async (req: Request, res: Response) => {
  if (!(await requireElite(req, res))) return;
  const symbol = String((req.body as { symbol?: string })?.symbol ?? "").trim();
  if (!symbol) { res.json({ error: "Símbolo requerido" }); return; }
  try {
    res.json(await analizarBolsaNativo(symbol));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/ia-trading-bolsa/top-symbols", async (req: Request, res: Response) => {
  if (!(await requireElite(req, res))) return;
  res.json({ symbols: ALL_SYMBOLS });
});

export default router;
