// pagina web.1/artifacts/api-server/src/routes/historical-charts.ts
//
// Página nueva — "Gráficos Históricos". Todas con datos reales,
// actualización automática en segundo plano.
//
// Fuentes usadas:
//  - FRED (api.stlouisfed.org, con FRED_API_KEY ya existente) — M2SL,
//    CPIAUCSL, WALCL, USREC
//  - Binance spot (api.binance.com, sin key) — precio histórico diario de
//    BTC. Se probó primero con CoinGecko (exigía key hasta en
//    /market_chart/range, 401 en producción) y después CryptoCompare
//    (también falló en Railway) — Binance es la misma fuente que ya usa
//    el resto de la plataforma sin problemas, así que se unificó ahí.
//  - blockchain.info (api.blockchain.info, sin key) — direcciones activas
//
// HONESTO — limitaciones reales, avisadas de antemano:
//  1) El gráfico #1 (antes "Bitcoin Price After Halvings" superpuesto por
//     ciclo) se REEMPLAZÓ por "Caída desde el Máximo Histórico (Drawdown)":
//     el original necesitaba precio limpio desde 2012, y Binance recién
//     tiene historial desde ago-2017 — en vez de mostrarlo incompleto para
//     siempre, se cambió por un gráfico distinto, con el mismo espíritu
//     (ver dónde estamos parados en el ciclo), 100% armable y confiable.
//  2) "Active Addresses Momentum" (#2): blockchain.info sí tiene el dato
//     real de direcciones activas — el "momentum" es mi propio cálculo
//     (z-score normalizado), no necesariamente la fórmula exacta original.
//  3) "Tactical Bull-Bear Sentiment Index" (#4): la fórmula de Alphractal
//     es propietaria y paga — esto es un índice PROPIO (RSI semanal +
//     percentil de volatilidad), inspirado en el concepto, NO una réplica.

import { Router, type Request, type Response } from "express";

const router = Router();
const FRED_API_KEY = process.env.FRED_API_KEY;

// ---------- Cache simple ----------
const _cache = new Map<string, { data: unknown; exp: number }>();
function cGet<T>(k: string): T | null {
  const e = _cache.get(k);
  return e && Date.now() < e.exp ? (e.data as T) : null;
}
function cSet<T>(k: string, d: T, ms: number) {
  _cache.set(k, { data: d, exp: Date.now() + ms });
}

interface Point {
  date: string; // YYYY-MM-DD
  value: number;
}

// ---------- FRED ----------
async function fetchFredSeries(seriesId: string): Promise<Point[]> {
  if (!FRED_API_KEY) {
    console.error(`[historical-charts] falta FRED_API_KEY, no se puede pedir ${seriesId}`);
    return [];
  }
  const cacheKey = `fred:${seriesId}`;
  const cached = cGet<Point[]>(cacheKey);
  if (cached) return cached;
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`FRED ${seriesId} HTTP ${r.status}`);
    const json: any = await r.json();
    const out = (json.observations ?? [])
      .filter((o: any) => o.value !== ".")
      .map((o: any) => ({ date: o.date, value: parseFloat(o.value) }));
    cSet(cacheKey, out, 24 * 60 * 60_000);
    return out;
  } catch (err) {
    console.error(`[historical-charts] FRED ${seriesId} falló`, err);
    return [];
  }
}

// ---------- BTC precio diario completo (CryptoCompare, sin key) ----------
async function fetchBtcDailyFull(): Promise<Point[]> {
  const cacheKey = "btc-daily-full";
  const cached = cGet<Point[]>(cacheKey);
  if (cached) return cached;
  try {
    // Binance spot — misma fuente que ya usa el resto de la plataforma sin
    // problemas (psy-panels-btc.ts, etc.). Su historial empieza ~ago-2017
    // (cuando abrió Binance), así que no cubre 2012-2017, pero es 100%
    // confiable en Railway (a diferencia de CoinGecko/CryptoCompare, que
    // fallaron en producción).
    const byDay = new Map<string, number>();
    let endTime = Date.now();
    const earliestWanted = new Date("2017-08-01T00:00:00Z").getTime();

    for (let page = 0; page < 12; page++) {
      const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=1000&endTime=${endTime}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Binance klines HTTP ${r.status}`);
      const rows: any[] = await r.json();
      if (!rows.length) break;
      for (const k of rows) {
        byDay.set(new Date(k[0]).toISOString().slice(0, 10), parseFloat(k[4]));
      }
      const firstOpenTime = rows[0][0];
      if (firstOpenTime <= earliestWanted) break;
      endTime = firstOpenTime - 1;
    }

    const out = Array.from(byDay.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
    cSet(cacheKey, out, 24 * 60 * 60_000);
    return out;
  } catch (err) {
    console.error("[historical-charts] fetchBtcDailyFull falló", err);
    return [];
  }
}

// ---------- Direcciones activas (blockchain.info, sin key) ----------
async function fetchActiveAddresses(): Promise<Point[]> {
  const cacheKey = "active-addresses";
  const cached = cGet<Point[]>(cacheKey);
  if (cached) return cached;
  try {
    const url = "https://api.blockchain.info/charts/n-unique-addresses?timespan=all&format=json";
    const r = await fetch(url);
    if (!r.ok) throw new Error(`blockchain.info HTTP ${r.status}`);
    const json: any = await r.json();
    const out = (json.values ?? []).map((v: any) => ({
      date: new Date(v.x * 1000).toISOString().slice(0, 10),
      value: v.y,
    }));
    cSet(cacheKey, out, 24 * 60 * 60_000);
    return out;
  } catch (err) {
    console.error("[historical-charts] fetchActiveAddresses falló", err);
    return [];
  }
}

// ---------- Helpers ----------
function alignForwardFill(baseDates: string[], other: Point[]): number[] {
  const out: number[] = [];
  let j = 0;
  for (const d of baseDates) {
    while (j + 1 < other.length && other[j + 1]!.date <= d) j++;
    out.push(other[j] && other[j]!.date <= d ? other[j]!.value : NaN);
  }
  return out;
}

function round2(v: number) {
  return Math.round(v * 100) / 100;
}

const HALVINGS = [
  { year: "2012", date: "2012-11-28" },
  { year: "2016", date: "2016-07-09" },
  { year: "2020", date: "2020-05-11" },
  { year: "2024", date: "2024-04-20" },
];

const PRESIDENTIAL_TERMS = [
  { presidente: "Obama", inicio: "2009-01-20", fin: "2017-01-20" },
  { presidente: "Trump", inicio: "2017-01-20", fin: "2021-01-20" },
  { presidente: "Biden", inicio: "2021-01-20", fin: "2025-01-20" },
  { presidente: "Trump", inicio: "2025-01-20", fin: "2033-01-20" },
];

// ---------- CHART 1: Bitcoin — Caída desde el Máximo Histórico (Drawdown) ----------
// Reemplaza al gráfico original de halvings superpuestos: ese necesitaba
// precio limpio desde 2012, y ninguna fuente gratis lo sostiene de forma
// confiable en producción (CoinGecko y CryptoCompare fallaron en Railway).
// Este es un gráfico PROPIO, con el mismo espíritu (ver dónde estamos
// parados en el ciclo actual), pero 100% armable con Binance.
function calcChart1(btc: Point[]) {
  if (btc.length < 30) return null;
  let athSoFar = 0;
  const series = btc.map((p) => {
    athSoFar = Math.max(athSoFar, p.value);
    const drawdownPct = athSoFar > 0 ? ((p.value - athSoFar) / athSoFar) * 100 : 0;
    return { date: p.date, precio: p.value, ath: round2(athSoFar), drawdownPct: round2(drawdownPct) };
  });
  const ultimo = series[series.length - 1]!;

  return {
    nombre: "Bitcoin — Caída desde el Máximo Histórico (Drawdown)",
    mide: "Qué tan lejos está el precio actual de BTC de su máximo histórico — los drawdowns profundos (-70% a -85%) suelen marcar zonas de fondo de ciclo, mientras que drawdowns chicos indican que estamos cerca de máximos.",
    series,
    resumen: {
      drawdownActualPct: ultimo.drawdownPct,
      athHistorico: ultimo.ath,
      precioActual: ultimo.precio,
    },
  };
}

// ---------- CHART 2: Active Addresses Momentum ----------
function calcChart2(activeAddr: Point[], btc: Point[]) {
  if (activeAddr.length < 400) return null;
  const values = activeAddr.map((p) => p.value);
  const win = 365;
  const momentum: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const from = Math.max(0, i - win);
    const slice = values.slice(from, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / slice.length;
    const std = Math.sqrt(variance);
    momentum.push(std !== 0 ? (values[i]! - mean) / std : 0);
  }
  const dates = activeAddr.map((p) => p.date);
  const btcAligned = alignForwardFill(dates, btc);

  const series = dates.map((date, i) => ({ date, momentum: round2(momentum[i]!), precio: btcAligned[i] ?? null })).filter((_, i) => i % 3 === 0); // 1 de cada 3 puntos, sino es demasiado pesado para el navegador

  return {
    nombre: "Active Addresses Momentum",
    mide: "Mide si la actividad on-chain (direcciones activas reales) está expandiéndose o contrayéndose respecto a su propio promedio histórico — picos verdes altos suelen coincidir con euforia/tops de ciclo.",
    series,
    nota: "El 'momentum' es un z-score propio (direcciones activas vs su media móvil de 365 días), no necesariamente la fórmula exacta de la fuente original.",
  };
}

// ---------- CHART 3: M2 Growth by Presidential Term ----------
function calcChart3(m2: Point[], btc: Point[]) {
  if (!m2.length) return null;
  const dates = m2.map((p) => p.date);
  const btcAligned = alignForwardFill(dates, btc);

  const series = m2.map((p, i) => {
    const term = PRESIDENTIAL_TERMS.find((t) => p.date >= t.inicio && p.date < t.fin);
    let growthPct = 0;
    if (term) {
      const idxInicio = m2.findIndex((x) => x.date >= term.inicio);
      const valorInicio = m2[idxInicio]?.value ?? p.value;
      growthPct = valorInicio !== 0 ? ((p.value - valorInicio) / valorInicio) * 100 : 0;
    }
    return { date: p.date, presidente: term?.presidente ?? null, m2GrowthPct: round2(growthPct), precio: btcAligned[i] ?? null };
  });

  return {
    nombre: "M2 Growth by Presidential Term",
    mide: "Muestra cuánto creció la oferta monetaria (M2) desde el inicio de cada mandato presidencial, superpuesto con el precio de BTC — para ver si las subidas de BTC coinciden con expansión monetaria.",
    series,
    halvings: HALVINGS,
    terminos: PRESIDENTIAL_TERMS,
  };
}

// ---------- CHART 4: PSY Tactical Sentiment Index (propio) ----------
function rsiSimple(closes: number[], period: number): number[] {
  const out: number[] = new Array(closes.length).fill(50);
  let gainSum = 0,
    lossSum = 0;
  for (let i = 1; i <= period && i < closes.length; i++) {
    const chg = closes[i]! - closes[i - 1]!;
    if (chg > 0) gainSum += chg;
    else lossSum -= chg;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const chg = closes[i]! - closes[i - 1]!;
    const gain = chg > 0 ? chg : 0;
    const loss = chg < 0 ? -chg : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

function calcChart4(btc: Point[]) {
  if (btc.length < 400) return null;
  // Semanal: 1 de cada 7 puntos diarios
  const weekly = btc.filter((_, i) => i % 7 === 0);
  const closes = weekly.map((p) => p.value);
  const rsiArr = rsiSimple(closes, 14);

  // Percentil de volatilidad (ventana de 52 semanas)
  const rets = closes.map((c, i) => (i > 0 ? Math.log(c / closes[i - 1]!) : 0));
  const volPercentil: number[] = [];
  const win = 52;
  for (let i = 0; i < rets.length; i++) {
    const from = Math.max(0, i - win);
    const slice = rets.slice(from, i + 1).map(Math.abs);
    const sorted = [...slice].sort((a, b) => a - b);
    const rank = sorted.indexOf(Math.abs(rets[i]!));
    volPercentil.push(sorted.length > 1 ? (rank / (sorted.length - 1)) * 100 : 50);
  }

  const series = weekly.map((p, i) => ({
    date: p.date,
    indice: round2(rsiArr[i]! * 0.7 + volPercentil[i]! * 0.3),
    precio: p.value,
  }));

  return {
    nombre: "PSY Tactical Bull-Bear Index",
    mide: "Índice propio (RSI semanal + percentil de volatilidad) para ubicar a BTC en zonas de sobrecompra/sobreventa tácticas a lo largo de todo su historial.",
    series,
    nota: "Este es un índice PROPIO inspirado en el concepto de osciladores tácticos (tipo Alphractal) — NO es una réplica de ninguna fórmula propietaria de terceros, que no es pública.",
  };
}

// ---------- CHART 5: Fed Balance Sheet vs BTC ----------
function calcChart5(walcl: Point[], btc: Point[]) {
  if (!walcl.length) return null;
  const dates = walcl.map((p) => p.date);
  const btcAligned = alignForwardFill(dates, btc);
  const series = walcl.map((p, i) => {
    const prev = walcl[Math.max(0, i - 4)]!.value;
    const cambio4w = p.value - prev;
    return { date: p.date, walcl: p.value, cambio4w: round2(cambio4w), precio: btcAligned[i] ?? null };
  });
  return {
    nombre: "Fed Balance Sheet vs BTC",
    mide: "Compara el balance de la Reserva Federal (impresión/reducción de dinero) contra el precio de BTC — las expansiones fuertes (barras verdes) suelen coincidir con los grandes rallies.",
    series,
  };
}

// ---------- CHART 6: M2 vs Purchasing Power (CPI) ----------
function calcChart6(m2: Point[], cpi: Point[]) {
  if (!m2.length || !cpi.length) return null;
  const cpiBase = cpi[0]!.value;
  const cpiDates = cpi.map((p) => p.date);
  const m2Aligned = alignForwardFill(cpiDates, m2);
  const series = cpi.map((p, i) => ({
    date: p.date,
    m2: m2Aligned[i] ?? null,
    poderAdquisitivo: round2((cpiBase / p.value) * 100),
  }));
  return {
    nombre: "M2 vs Poder Adquisitivo (CPI)",
    mide:
      "Compara 2 cosas en el mismo gráfico: cuánto dinero (M2, línea azul) hay circulando en la economía de EEUU, contra cuánto vale realmente ese dinero (poder adquisitivo, línea roja). " +
      "El poder adquisitivo se calcula así: se toma el nivel de precios (CPI) del primer mes de este historial como referencia 100, y se compara contra el CPI de cada mes siguiente (100 ÷ CPI actual × CPI base) — si hoy hacen falta más dólares para comprar lo mismo que antes, el poder adquisitivo baja. " +
      "La lectura simple: mientras la línea azul (dinero impreso) sube sin parar, la línea roja (lo que ese dinero puede comprar) baja — es la forma numérica de mostrar por qué 'antes alcanzaba para más'.",
    series,
  };
}

// ---------- CHART 7: M2 Money Supply Record ----------
function calcChart7(m2: Point[]) {
  if (m2.length < 2) return null;
  const first = m2[0]!;
  const last = m2[m2.length - 1]!;
  const years = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  const cagr = years > 0 ? (Math.pow(last.value / first.value, 1 / years) - 1) * 100 : 0;
  return {
    nombre: "U.S. M2 Money Supply — Récord Histórico",
    mide: "La oferta monetaria total de EEUU en el tiempo — cuánto dinero nuevo entró al sistema, con la tasa de crecimiento anual compuesta (CAGR) real.",
    series: m2.map((p) => ({ date: p.date, m2: p.value })),
    cagrPct: round2(cagr),
    valorActual: last.value,
    fechaActual: last.date,
    eventos: [
      { date: "2008-09-01", label: "Crisis Financiera Global" },
      { date: "2020-03-01", label: "COVID-19" },
    ],
  };
}

// ---------- CHART 8: CPI Inflation vs BTC + Recessions ----------
function calcChart8(cpi: Point[], usrec: Point[], btc: Point[]) {
  if (cpi.length < 2) return null;
  const inflacion: Point[] = [];
  for (let i = 1; i < cpi.length; i++) {
    const chg = cpi[i - 1]!.value !== 0 ? ((cpi[i]!.value - cpi[i - 1]!.value) / cpi[i - 1]!.value) * 100 : 0;
    inflacion.push({ date: cpi[i]!.date, value: chg });
  }
  const dates = inflacion.map((p) => p.date);
  const btcAligned = alignForwardFill(dates, btc);
  const usrecAligned = alignForwardFill(dates, usrec);

  const series = inflacion.map((p, i) => ({
    date: p.date,
    inflacionPct: round2(p.value),
    precio: btcAligned[i] ?? null,
    recesion: (usrecAligned[i] ?? 0) >= 1,
  }));

  return {
    nombre: "CPI Mensual vs BTC + Recesiones",
    mide: "Inflación mensual real (CPI) comparada con el precio de BTC, marcando además los períodos de recesión oficial en EEUU (dato NBER vía FRED).",
    series,
    halvings: HALVINGS,
  };
}

// ---------- Cache de fondo ----------
let cachedCharts: any = null;
let lastCalcError: string | null = null;
let calculating = false;

async function refreshCharts() {
  if (calculating) return;
  calculating = true;
  console.log("[historical-charts] recalculando los 8 gráficos...");
  const start = Date.now();
  try {
    const [m2, cpi, walcl, usrec, btc, activeAddr] = await Promise.all([
      fetchFredSeries("M2SL"),
      fetchFredSeries("CPIAUCSL"),
      fetchFredSeries("WALCL"),
      fetchFredSeries("USREC"),
      fetchBtcDailyFull(),
      fetchActiveAddresses(),
    ]);

    cachedCharts = {
      updatedAt: Date.now(),
      chart1: calcChart1(btc),
      chart2: calcChart2(activeAddr, btc),
      chart3: calcChart3(m2, btc),
      chart4: calcChart4(btc),
      chart5: calcChart5(walcl, btc),
      chart6: calcChart6(m2, cpi),
      chart7: calcChart7(m2),
      chart8: calcChart8(cpi, usrec, btc),
    };
    lastCalcError = null;
    console.log(`[historical-charts] OK — tardó ${Math.round((Date.now() - start) / 1000)}s (m2:${m2.length} cpi:${cpi.length} walcl:${walcl.length} usrec:${usrec.length} btc:${btc.length} addr:${activeAddr.length})`);
  } catch (err: any) {
    lastCalcError = err?.message ?? String(err);
    console.error("[historical-charts] error recalculando", err);
  } finally {
    calculating = false;
  }
}

refreshCharts();
setInterval(refreshCharts, 6 * 60 * 60_000); // cada 6hs — son datos macro/históricos, no hace falta más seguido

router.get("/historical-charts/live", (_req: Request, res: Response) => {
  if (!cachedCharts) {
    return res.status(503).json({ error: "Todavía calculando los gráficos por primera vez, reintentar en unos segundos", lastCalcError });
  }
  res.json(cachedCharts);
});

router.get("/historical-charts/status", (_req: Request, res: Response) => {
  res.json({ listo: !!cachedCharts, calculando: calculating, updatedAt: cachedCharts?.updatedAt ?? null, lastCalcError });
});

export default router;
