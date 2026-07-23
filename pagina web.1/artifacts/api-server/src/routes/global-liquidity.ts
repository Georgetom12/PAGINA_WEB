// pagina web.1/artifacts/api-server/src/routes/global-liquidity.ts
//
// PSY GLOBAL LIQUIDITY FUEL — versión backend (para la página nueva)
// Mismo criterio que el indicador Pine PSY-LIQ: impresión de dinero
// (FED+BOJ+ECB+BOE) + monedas (DXY+EUR+JPY+GBP+CNY+CHF) + tasas de
// interés (FED+ECB+BOE), combinado en un Fuel Gauge 0-100.
//
// Fuentes usadas (todas gratis, sin TradingView/Trading Economics pago):
//  - FRED (api.stlouisfed.org) — FED, BOJ, ECB balance, tasa FED
//  - ECB Statistical Data Warehouse (data-api.ecb.europa.eu) — tasa EUR
//  - BOE Interactive Database (bankofengland.co.uk/boeapps/database)
//  - Yahoo Finance v8/chart — DXY + monedas (mismo patrón que ia-trading-bolsa.ts)
//
// PENDIENTE / HONESTO:
//  - PBOC (China): sin fuente gratis confiable de balance semanal. Queda
//    AFUERA del cálculo de impresión de dinero por ahora (no se inventa).
//    Cuando haya ingresos, Trading Economics sí lo tiene.
//  - SNB (Suiza): mismo caso, el franco solo entra como moneda de referencia.
//  - Tasa de Japón (BOJ): sin API JSON limpia y gratis confirmada — usa un
//    valor de respaldo actualizable a mano (ver JP_RATE_FALLBACK) hasta
//    conseguir una fuente mejor.
//  - Código exacto del "balance total" del BOE en su IADB: TODO, ver
//    comentario en fetchBoeSeries() — hay que confirmarlo en vivo (mi
//    sandbox de análisis no tiene salida a internet hacia bankofengland.co.uk
//    para probarlo, hay que testearlo corriendo este archivo en Railway).

import { Router } from "express";

const router = Router();

// ---------- BTC semanal (Binance) — para correlacionar con la liquidez ----------
let btcWeeklyCache: { date: string; value: number }[] | null = null;
let btcWeeklyCacheAt = 0;

async function fetchBtcWeekly(): Promise<{ date: string; value: number }[]> {
  if (btcWeeklyCache && Date.now() - btcWeeklyCacheAt < 60 * 60 * 1000) return btcWeeklyCache;
  try {
    const url = "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1w&limit=1000";
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Binance BTC semanal HTTP ${r.status}`);
    const arr: any[] = await r.json();
    const out = arr.map((k: any) => ({ date: new Date(k[0]).toISOString().slice(0, 10), value: parseFloat(k[4]) }));
    btcWeeklyCache = out;
    btcWeeklyCacheAt = Date.now();
    return out;
  } catch (err) {
    console.error("[global-liquidity] fetchBtcWeekly falló", err);
    return btcWeeklyCache ?? [];
  }
}

const FRED_API_KEY = process.env.FRED_API_KEY;
const REFRESH_MS = 24 * 60 * 60 * 1000; // 24hs — estos datos son semanales, no hace falta más seguido
const MAX_WEEKS = 104; // ventana máxima para z-score, igual que el Pine

// Actualizar a mano cuando el BOJ cambie la tasa (no hay fuente JSON gratis confirmada)
const JP_RATE_FALLBACK = 0.5;

// ---------- TIPOS ----------
interface Point {
  date: string; // YYYY-MM-DD
  value: number;
}

interface LiquidityCache {
  updatedAt: number;
  fed: Point[];
  rrp: Point[];
  tga: Point[];
  boj: Point[]; // JPY
  ecb: Point[]; // EUR
  boe: Point[]; // GBP (TODO: código de serie a confirmar, ver abajo)
  usRate: Point[];
  euRate: Point[];
  gbRate: Point[];
  dxy: Point[];
  eurusd: Point[];
  jpyusd: Point[];
  gbpusd: Point[];
  cnyusd: Point[];
  chfusd: Point[];
}

let cache: LiquidityCache | null = null;
let refreshing = false;
let lastError: string | null = null;

// ---------- FRED ----------
async function fetchFredSeries(seriesId: string): Promise<Point[]> {
  if (!FRED_API_KEY) {
    console.error(`[global-liquidity] falta FRED_API_KEY, no se puede pedir ${seriesId}`);
    return [];
  }
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json`;
  try {
    const r = await fetch(url);
    if (!r.ok) {
      console.error(`[global-liquidity] FRED ${seriesId} HTTP ${r.status}`);
      return [];
    }
    const json: any = await r.json();
    const obs = json.observations ?? [];
    return obs
      .filter((o: any) => o.value !== ".")
      .map((o: any) => ({ date: o.date, value: parseFloat(o.value) }));
  } catch (err) {
    console.error(`[global-liquidity] FRED ${seriesId} fallo de red`, err);
    return [];
  }
}

// ---------- ECB Statistical Data Warehouse (tasa de refinanciamiento) ----------
async function fetchEcbRate(): Promise<Point[]> {
  // Serie: Main Refinancing Operations rate (nivel), formato SDMX-JSON.
  // TODO: probar en vivo — el parseo SDMX es delicado, el shape puede variar.
  const url =
    "https://data-api.ecb.europa.eu/service/data/FM/D.U2.EUR.4F.KR.MRR_FR.LEV?format=jsondata";
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) {
      console.error(`[global-liquidity] ECB SDW HTTP ${r.status}`);
      return [];
    }
    const json: any = await r.json();
    const series = json?.dataSets?.[0]?.series ?? {};
    const dims = json?.structure?.dimensions?.observation?.[0]?.values ?? [];
    const points: Point[] = [];
    for (const key of Object.keys(series)) {
      const obs = series[key]?.observations ?? {};
      for (const idx of Object.keys(obs)) {
        const date = dims[Number(idx)]?.id;
        const value = obs[idx]?.[0];
        if (date && typeof value === "number") points.push({ date, value });
      }
    }
    return points.sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.error("[global-liquidity] ECB SDW fallo de red", err);
    return [];
  }
}

// ---------- BOE Interactive Database ----------
// Tasa oficial (Bank Rate) — código CONFIRMADO: IUDBEDR
// Balance total — código SIN CONFIRMAR todavía. Buscar el código correcto en:
//   https://www.bankofengland.co.uk/boeapps/database/index.asp?SectionRequired=I
// (categoría "Assets - total"; candidatos vistos: ACRTOT, ATOTAL, ATOTL, AFCAS —
//  hay que probar cuál trae la serie semanal correcta antes de confiar en el dato)
const BOE_BANK_RATE_CODE = "IUDBEDR";
const BOE_TOTAL_ASSETS_CODE = "ATOTAL"; // ⚠️ VERIFICAR EN VIVO ANTES DE USAR EN PRODUCCIÓN

async function fetchBoeSeries(seriesCode: string): Promise<Point[]> {
  const url =
    `https://www.bankofengland.co.uk/boeapps/database/_iadb-fromshowcolumns.asp` +
    `?csv.x=yes&Datefrom=01/Jan/2015&Dateto=now&SeriesCodes=${seriesCode}&CSVF=TN&UsingCodes=Y`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) {
      console.error(`[global-liquidity] BOE IADB HTTP ${r.status} (${seriesCode})`);
      return [];
    }
    const text = await r.text();
    // El BOE a veces devuelve una página HTML de error con status 200 —
    // si no parece CSV, lo detectamos y lo tratamos como fallo.
    if (text.trim().startsWith("<")) {
      console.error(`[global-liquidity] BOE IADB devolvió HTML en vez de CSV (${seriesCode}) — código de serie probablemente incorrecto`);
      return [];
    }
    const lines = text.split("\n").slice(1); // primera línea = encabezado
    const points: Point[] = [];
    for (const line of lines) {
      const [dateRaw, valueRaw] = line.split(",");
      if (!dateRaw || !valueRaw) continue;
      const value = parseFloat(valueRaw.replace(/[^\d.-]/g, ""));
      if (!isNaN(value)) points.push({ date: dateRaw.trim(), value });
    }
    return points;
  } catch (err) {
    console.error(`[global-liquidity] BOE IADB fallo de red (${seriesCode})`, err);
    return [];
  }
}

// ---------- Yahoo Finance (monedas + DXY) — mismo patrón que ia-trading-bolsa.ts ----------
async function fetchYahooWeekly(ticker: string): Promise<Point[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker
  )}?range=5y&interval=1wk`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) {
      console.error(`[global-liquidity] Yahoo ${ticker} HTTP ${r.status}`);
      return [];
    }
    const json: any = await r.json();
    const result = json?.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp ?? [];
    const closes: number[] = result?.indicators?.quote?.[0]?.close ?? [];
    const points: Point[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] != null) {
        points.push({
          date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
          value: closes[i],
        });
      }
    }
    return points;
  } catch (err) {
    console.error(`[global-liquidity] Yahoo ${ticker} fallo de red`, err);
    return [];
  }
}

// ---------- Refresh completo ----------
async function refreshCache() {
  if (refreshing) return;
  refreshing = true;
  console.log("[global-liquidity] refrescando datos macro...");
  try {
    const [
      fed,
      rrp,
      tga,
      boj,
      ecb,
      usRate,
      euRate,
      boe,
      gbRate,
      dxy,
      eurusd,
      jpyusd,
      gbpusd,
      cnyusd,
      chfusd,
    ] = await Promise.all([
      fetchFredSeries("WALCL"),
      fetchFredSeries("RRPONTSYD"),
      fetchFredSeries("WTREGEN"),
      fetchFredSeries("JPNASSETS"),
      fetchFredSeries("ECBASSETSW"),
      fetchFredSeries("FEDFUNDS"),
      fetchEcbRate(),
      fetchBoeSeries(BOE_TOTAL_ASSETS_CODE),
      fetchBoeSeries(BOE_BANK_RATE_CODE),
      fetchYahooWeekly("DX-Y.NYB"),
      fetchYahooWeekly("EURUSD=X"),
      fetchYahooWeekly("JPYUSD=X"),
      fetchYahooWeekly("GBPUSD=X"),
      fetchYahooWeekly("CNYUSD=X"),
      fetchYahooWeekly("CHFUSD=X"),
    ]);

    cache = {
      updatedAt: Date.now(),
      fed,
      rrp,
      tga,
      boj,
      ecb,
      boe,
      usRate,
      euRate,
      gbRate,
      dxy,
      eurusd,
      jpyusd,
      gbpusd,
      cnyusd,
      chfusd,
    };
    lastError = null;
    console.log(
      `[global-liquidity] cache OK — FED:${fed.length} RRP:${rrp.length} TGA:${tga.length} BOJ:${boj.length} ECB:${ecb.length} BOE:${boe.length} tasaEU:${euRate.length} tasaGB:${gbRate.length} DXY:${dxy.length}`
    );
    if (boe.length === 0) {
      console.warn(
        `[global-liquidity] BOE balance total vino vacío — revisar BOE_TOTAL_ASSETS_CODE ('${BOE_TOTAL_ASSETS_CODE}') en bankofengland.co.uk/boeapps/database`
      );
    }
  } catch (err: any) {
    lastError = err?.message ?? String(err);
    console.error("[global-liquidity] error refrescando cache", err);
  } finally {
    refreshing = false;
  }
}

refreshCache();
setInterval(refreshCache, REFRESH_MS);

// ---------- Estadística (mismo criterio que el Pine PSY-LIQ) ----------
function alignForwardFill(base: Point[], other: Point[]): number[] {
  // Para cada fecha de "base", toma el último valor conocido de "other" en o antes de esa fecha
  const out: number[] = [];
  let j = 0;
  for (const b of base) {
    while (j + 1 < other.length && other[j + 1].date <= b.date) j++;
    out.push(other[j] && other[j].date <= b.date ? other[j].value : NaN);
  }
  return out;
}

function zScoreSeries(values: number[], maxWindow: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const from = Math.max(0, i - maxWindow + 1);
    const window = values.slice(from, i + 1).filter((v) => !isNaN(v));
    if (window.length < 5) {
      out.push(0);
      continue;
    }
    const mean = window.reduce((a, b) => a + b, 0) / window.length;
    const variance =
      window.reduce((a, b) => a + (b - mean) ** 2, 0) / window.length;
    const std = Math.sqrt(variance);
    out.push(std !== 0 ? (values[i] - mean) / std : 0);
  }
  return out;
}

function ema(values: number[], length: number): number[] {
  const k = 2 / (length + 1);
  const out: number[] = [];
  let prev = values[0] ?? 0;
  for (let i = 0; i < values.length; i++) {
    prev = i === 0 ? values[0] : values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

// ---------- Correlación real liquidez↔BTC + reacción histórica en los cruces ----------
// LAG_WEEKS = mismo rezago que el indicador Pine (teoría de M. Howell: la
// liquidez global suele adelantarse ~6 semanas al movimiento de BTC)
const LAG_WEEKS = 6;

function analizarCorrelacionBtc(compositeZ: number[], btcAligned: number[]) {
  const n = compositeZ.length;
  const compLagged = compositeZ.map((_, i) => (i >= LAG_WEEKS ? compositeZ[i - LAG_WEEKS] : NaN));

  // Solo se usa el tramo donde realmente hay precio de BTC (Binance no tiene
  // historial anterior a su propio lanzamiento) — nada de inventar datos.
  const idxValidos: number[] = [];
  for (let i = 1; i < n; i++) {
    if (!isNaN(compLagged[i]!) && !isNaN(compLagged[i - 1]!) && !isNaN(btcAligned[i]!) && !isNaN(btcAligned[i - 1]!) && btcAligned[i - 1]! > 0) {
      idxValidos.push(i);
    }
  }

  const compChg = idxValidos.map((i) => compLagged[i]! - compLagged[i - 1]!);
  const btcRet = idxValidos.map((i) => Math.log(btcAligned[i]! / btcAligned[i - 1]!));

  // Correlación de Pearson
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
  const mC = mean(compChg);
  const mB = mean(btcRet);
  let num = 0,
    denC = 0,
    denB = 0;
  for (let k = 0; k < compChg.length; k++) {
    num += (compChg[k]! - mC) * (btcRet[k]! - mB);
    denC += (compChg[k]! - mC) ** 2;
    denB += (btcRet[k]! - mB) ** 2;
  }
  const correlacion = denC > 0 && denB > 0 ? num / Math.sqrt(denC * denB) : 0;

  // Beta (regresión simple compChg -> btcRet)
  const beta = denC !== 0 ? num / denC : 0;

  // Volatilidad semanal de BTC (para escalar la magnitud de los escenarios)
  const volSemanal = Math.sqrt(btcRet.reduce((a, b) => a + (b - mB) ** 2, 0) / (btcRet.length || 1));
  const volHorizonte = volSemanal * Math.sqrt(LAG_WEEKS); // escalado al horizonte de 6 semanas

  // Reacción histórica real en los cruces de cero (lo que Jorge señaló en el chart:
  // cada vez que la liquidez cruzó a expansión/contracción, ¿qué hizo BTC después?)
  const cruceAlcistaRets: number[] = [];
  const cruceBajistaRets: number[] = [];
  for (let i = LAG_WEEKS + 1; i < n; i++) {
    if (isNaN(compositeZ[i]!) || isNaN(compositeZ[i - 1]!)) continue;
    const cruzoArriba = compositeZ[i - 1]! <= 0 && compositeZ[i]! > 0;
    const cruzoAbajo = compositeZ[i - 1]! >= 0 && compositeZ[i]! < 0;
    if (!cruzoArriba && !cruzoAbajo) continue;
    const iBtcFuturo = i + LAG_WEEKS;
    if (iBtcFuturo >= n || isNaN(btcAligned[i]!) || isNaN(btcAligned[iBtcFuturo]!) || btcAligned[i]! <= 0) continue;
    const retFuturo = (btcAligned[iBtcFuturo]! - btcAligned[i]!) / btcAligned[i]!;
    if (cruzoArriba) cruceAlcistaRets.push(retFuturo);
    else cruceBajistaRets.push(retFuturo);
  }
  const promedio = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  return {
    correlacion,
    beta,
    volHorizonte,
    reaccionHistorica: {
      cruceAlcista: { promedioPct: promedio(cruceAlcistaRets) * 100, casos: cruceAlcistaRets.length },
      cruceBajista: { promedioPct: promedio(cruceBajistaRets) * 100, casos: cruceBajistaRets.length },
    },
  };
}

function construirProyecciones(precioActual: number, beta: number, fuelImpulseActual: number, correlacion: number, volHorizonte: number) {
  const baseMove = beta * fuelImpulseActual; // mismo cálculo que el Pine (proyección "normal")
  // Magnitudes de cada escenario, ancladas a la volatilidad real de BTC en
  // el horizonte de 6 semanas (no números inventados a ojo)
  const magPesimista = volHorizonte * 0.5;
  const magNormal = Math.max(Math.abs(baseMove), volHorizonte * 1.0);
  const magOptimista = volHorizonte * 1.75;

  const proj = (mag: number, signo: 1 | -1) => precioActual * Math.exp(signo * mag);

  const proyecciones = {
    alza: {
      pesimista: proj(magPesimista, 1),
      normal: proj(magNormal, 1),
      optimista: proj(magOptimista, 1),
    },
    baja: {
      pesimista: proj(magPesimista, -1), // "pesimista" en la baja = la caída más profunda (peor caso)
      normal: proj(magNormal, -1),
      optimista: proj(magOptimista, -1), // "optimista" en la baja = la caída más leve (mejor de los casos malos)
    },
  };

  // Cuál escenario es "más viable" ahora mismo: dirección según el signo del
  // combustible actual, magnitud según la fuerza de la correlación real
  const corrAbs = Math.abs(correlacion);
  const direccion = baseMove >= 0 ? "alza" : "baja";
  const escenario = corrAbs >= 0.5 ? "normal" : corrAbs >= 0.25 ? "pesimista" : "pesimista";
  const confianza = corrAbs >= 0.5 ? "alta" : corrAbs >= 0.25 ? "moderada" : "baja";

  const masViable = {
    direccion,
    escenario,
    confianza,
    texto:
      confianza === "alta"
        ? `Con la correlación actual (${correlacion.toFixed(2)}), el escenario "${escenario}" al ${direccion} es el más viable.`
        : `La correlación actual entre liquidez y BTC es ${confianza === "baja" ? "débil" : "moderada"} (${correlacion.toFixed(2)}) — el escenario "${escenario}" al ${direccion} es el más conservador y el más viable de tomar en cuenta por ahora.`,
  };

  return { proyecciones, masViable };
}


// ---------- Endpoints ----------
router.get("/global-liquidity/live", async (_req, res) => {
  if (!cache) {
    return res.status(503).json({
      error: "Datos macro todavía no cargados, reintentar en unos segundos",
      lastError,
    });
  }

  // Fechas base = FED (la serie más confiable/completa)
  const base = cache.fed;
  const rrpAligned = alignForwardFill(base, cache.rrp);
  const tgaAligned = alignForwardFill(base, cache.tga);
  const bojAligned = alignForwardFill(base, cache.boj);
  const ecbAligned = alignForwardFill(base, cache.ecb);
  const boeAligned = alignForwardFill(base, cache.boe);
  const jpyusdAligned = alignForwardFill(base, cache.jpyusd);
  const eurusdAligned = alignForwardFill(base, cache.eurusd);
  const gbpusdAligned = alignForwardFill(base, cache.gbpusd);
  const dxyAligned = alignForwardFill(base, cache.dxy);
  const usRateAligned = alignForwardFill(base, cache.usRate);
  const euRateAligned = alignForwardFill(base, cache.euRate);
  const gbRateAligned = alignForwardFill(base, cache.gbRate);

  const netLiquidity = base.map((p, i) => {
    const fed = p.value;
    const rrp = rrpAligned[i] || 0;
    const tga = tgaAligned[i] || 0;
    const boj = (bojAligned[i] || 0) * (jpyusdAligned[i] || 0);
    const ecb = (ecbAligned[i] || 0) * (eurusdAligned[i] || 0);
    const boe = (boeAligned[i] || 0) * (gbpusdAligned[i] || 0);
    return fed - rrp - tga + boj + ecb + boe;
  });

  const liqZ = ema(zScoreSeries(netLiquidity, MAX_WEEKS), 3);
  const dxyZ = zScoreSeries(dxyAligned, MAX_WEEKS);

  // Impulso de tasas: recorte = suma combustible, suba = resta
  const rateChg: number[] = base.map((_, i) => {
    if (i === 0) return 0;
    const dUs = (usRateAligned[i] || 0) - (usRateAligned[i - 1] || 0);
    const dEu = (euRateAligned[i] || 0) - (euRateAligned[i - 1] || 0);
    const dGb = (gbRateAligned[i] || 0) - (gbRateAligned[i - 1] || 0);
    return -(dUs + dEu + dGb);
  });
  const rateImpulse = ema(rateChg, 8);

  const wDxy = 0.5;
  const wRate = 1.0;
  const compositeZ = liqZ.map((z, i) => z - wDxy * dxyZ[i] + wRate * rateImpulse[i]);

  const fuelImpulse = compositeZ.map((v, i) =>
    i >= 4 ? v - compositeZ[i - 4] : 0
  );

  const last = compositeZ.length - 1;
  const fuelGaugeRaw = 50 + compositeZ[last] * 20;
  const fuelGauge = Math.max(0, Math.min(100, fuelGaugeRaw));

  // Correlación real con BTC + proyección de 3 escenarios por lado (pedido
  // explícito de Jorge tras ver los cruces de la línea vs la reacción real
  // de BTC en el chart de TradingView)
  const btcWeekly = await fetchBtcWeekly();
  const btcAligned = alignForwardFill(base, btcWeekly);
  const precioActual = btcWeekly[btcWeekly.length - 1]?.value ?? btcAligned[last] ?? 0;
  const { correlacion, beta, volHorizonte, reaccionHistorica } = analizarCorrelacionBtc(compositeZ, btcAligned);
  const { proyecciones, masViable } = construirProyecciones(precioActual, beta, fuelImpulse[last], correlacion, volHorizonte);

  const veredicto =
    fuelGauge >= 65
      ? { texto: "Combustible de liquidez global expandiéndose — viento macro a favor para BTC.", tipo: "alcista" as const }
      : fuelGauge <= 35
        ? { texto: "Combustible de liquidez global contrayéndose — viento macro en contra para BTC.", tipo: "bajista" as const }
        : { texto: "Combustible de liquidez global neutro — sin sesgo macro dominante por ahora.", tipo: "neutral" as const };

  res.json({
    nombre: "PSY Liquidity Fuel — Global vs BTC",
    mide: "Mide la liquidez global (impresión de dinero + tasas de interés + fuerza del dólar) como combustible macro para el precio de BTC.",
    updatedAt: cache.updatedAt,
    lastDate: base[last]?.date,
    fuelGauge,
    compositeZ: compositeZ[last],
    fuelImpulse: fuelImpulse[last],
    liqZBancos: liqZ[last],
    dxyZ: dxyZ[last],
    rateImpulse: rateImpulse[last],
    veredicto,
    precioActual,
    correlacionBtc: correlacion,
    reaccionHistorica,
    proyecciones,
    masViable,
    historia: base.map((p, i) => ({
      date: p.date,
      compositeZ: compositeZ[i],
      fuelImpulse: fuelImpulse[i],
    })),
    fuentes: {
      fed: "FRED WALCL",
      boj: "FRED JPNASSETS",
      ecb_balance: "FRED ECBASSETSW",
      boe_balance: cache.boe.length ? "Bank of England IADB" : "sin datos (ver lastError/logs)",
      ecb_rate: cache.euRate.length ? "ECB SDW" : "sin datos",
      boe_rate: cache.gbRate.length ? "Bank of England IADB (IUDBEDR)" : "sin datos",
      jp_rate: `respaldo manual (${JP_RATE_FALLBACK}%) — sin API confirmada`,
      pboc: "NO incluido (sin fuente gratis confiable)",
      snb: "NO incluido en balance (solo CHF como moneda de referencia)",
      monedas: "Yahoo Finance v8/chart",
    },
  });
});

router.get("/global-liquidity/status", (_req, res) => {
  res.json({
    cacheCargado: !!cache,
    updatedAt: cache?.updatedAt ?? null,
    lastError,
    puntos: cache
      ? {
          fed: cache.fed.length,
          rrp: cache.rrp.length,
          tga: cache.tga.length,
          boj: cache.boj.length,
          ecb: cache.ecb.length,
          boe: cache.boe.length,
          usRate: cache.usRate.length,
          euRate: cache.euRate.length,
          gbRate: cache.gbRate.length,
          dxy: cache.dxy.length,
        }
      : null,
  });
});

export default router;
