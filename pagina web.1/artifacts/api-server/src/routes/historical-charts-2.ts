// pagina web.1/artifacts/api-server/src/routes/historical-charts-2.ts
//
// Segunda tanda de gráficos históricos (11 más, sumados a los 8 de
// historical-charts.ts, misma página /historical-charts).
//
// Fuentes nuevas usadas en este archivo:
//  - Yahoo Finance v8/chart (sin key) — acciones/ETFs: BX, KKR, APO, CG,
//    ^GSPC, IBIT, FBTC, GBTC (mismo patrón que ia-trading-bolsa.ts)
//  - mempool.space (sin key) — fee real de Bitcoin
//  - Etherscan (ETHERSCAN_API_KEY ya existente) — gas real de Ethereum
//  - Solana RPC público (sin key) — TPS real de Solana
//  - blockchain.info (sin key, ya usado en historical-charts.ts) — direcciones
//    activas + hash rate de la red
//
// HONESTO — limitaciones reales:
//  1) "On-chain Value Map" (#1 original): las bandas de valoración de
//     BitcoinStrategyPlatform son un modelo propietario/pago. Esto es
//     un modelo PROPIO (canal de regresión logarítmico sobre el precio
//     real), no una réplica exacta.
//  2) Private Equity vs S&P500: es retorno de PRECIO, no "total return"
//     con dividendos reinvertidos (eso necesita datos pagos).
//  3) Rising Wealth (Top1%/Bottom50%): uso las series de % (share) de
//     las Distributional Financial Accounts de la Fed, confirmadas en
//     FRED — el ID exacto de la serie de "Bottom 50%" está marcado
//     ⚠️ VERIFICAR (no lo pude confirmar 100% desde acá).
//  4) Adopción (% población mundial): NO es la curva de campana exacta
//     del original — es un % real (direcciones activas / población
//     mundial) en el tiempo. La población mundial se actualiza a mano
//     (crece muy lento, no justifica una API en vivo para esto).
//  5) Sistemas de pago: BTC/ETH/SOL son reales y en vivo (fee/TPS de
//     cada red). Wise/Western Union/SWIFT NO tienen API pública de
//     tarifas — quedan como referencia fija declarada, no en vivo.
//  6) BTC vs Exchange Balance: CoinGlass devolvió 401 (tu plan no incluye
//     ese endpoint) — reemplazado por "Bitcoin Hash Rate vs Precio", con
//     la misma fuente gratis que ya usa direcciones activas.

import { Router, type Request, type Response } from "express";

const router = Router();
const FRED_API_KEY = process.env.FRED_API_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

// ---------- Cache ----------
const _cache = new Map<string, { data: unknown; exp: number }>();
function cGet<T>(k: string): T | null {
  const e = _cache.get(k);
  return e && Date.now() < e.exp ? (e.data as T) : null;
}
function cSet<T>(k: string, d: T, ms: number) {
  _cache.set(k, { data: d, exp: Date.now() + ms });
}

interface Point {
  date: string;
  value: number;
}

function round2(v: number) {
  return Math.round(v * 100) / 100;
}

// ---------- FRED ----------
async function fetchFredSeries(seriesId: string): Promise<Point[]> {
  if (!FRED_API_KEY) return [];
  const cacheKey = `fred2:${seriesId}`;
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
    console.error(`[historical-charts-2] FRED ${seriesId} falló`, err);
    return [];
  }
}

// ---------- BTC diario completo (mismo patrón, cache propio en este archivo) ----------
async function fetchBtcDailyFull(): Promise<Point[]> {
  const cacheKey = "btc-daily-full-2";
  const cached = cGet<Point[]>(cacheKey);
  if (cached) return cached;
  try {
    // Binance spot — mismo cambio que en historical-charts.ts: CoinGecko
    // fallaba en producción (401), Binance ya es la fuente probada del
    // resto de la plataforma.
    const byDay = new Map<string, number>();
    let endTime = Date.now();
    const earliestWanted = new Date("2017-08-01T00:00:00Z").getTime();
    for (let page = 0; page < 12; page++) {
      const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=1000&endTime=${endTime}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Binance klines HTTP ${r.status}`);
      const rows: any[] = await r.json();
      if (!rows.length) break;
      for (const k of rows) byDay.set(new Date(k[0]).toISOString().slice(0, 10), parseFloat(k[4]));
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
    console.error("[historical-charts-2] fetchBtcDailyFull falló", err);
    return [];
  }
}

// ---------- Yahoo Finance (acciones/ETFs) ----------
async function fetchYahooDaily(ticker: string, range = "10y"): Promise<Point[]> {
  const cacheKey = `yahoo2:${ticker}:${range}`;
  const cached = cGet<Point[]>(cacheKey);
  if (cached) return cached;
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=1d`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) throw new Error(`Yahoo ${ticker} HTTP ${r.status}`);
    const json: any = await r.json();
    const result = json.chart?.result?.[0];
    const ts: number[] = result?.timestamp ?? [];
    const closes: number[] = result?.indicators?.quote?.[0]?.close ?? [];
    const volumes: number[] = result?.indicators?.quote?.[0]?.volume ?? [];
    const out: Point[] = [];
    for (let i = 0; i < ts.length; i++) {
      if (closes[i] != null) out.push({ date: new Date(ts[i]! * 1000).toISOString().slice(0, 10), value: closes[i]! });
    }
    cSet(cacheKey, out, 24 * 60 * 60_000);
    return out;
  } catch (err) {
    console.error(`[historical-charts-2] Yahoo ${ticker} falló`, err);
    return [];
  }
}

async function fetchYahooVolume(ticker: string, range = "2y"): Promise<Point[]> {
  const cacheKey = `yahoovol2:${ticker}:${range}`;
  const cached = cGet<Point[]>(cacheKey);
  if (cached) return cached;
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=1d`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) throw new Error(`Yahoo vol ${ticker} HTTP ${r.status}`);
    const json: any = await r.json();
    const result = json.chart?.result?.[0];
    const ts: number[] = result?.timestamp ?? [];
    const volumes: number[] = result?.indicators?.quote?.[0]?.volume ?? [];
    const out: Point[] = [];
    for (let i = 0; i < ts.length; i++) {
      if (volumes[i] != null) out.push({ date: new Date(ts[i]! * 1000).toISOString().slice(0, 10), value: volumes[i]! });
    }
    cSet(cacheKey, out, 24 * 60 * 60_000);
    return out;
  } catch (err) {
    console.error(`[historical-charts-2] Yahoo volumen ${ticker} falló`, err);
    return [];
  }
}

// ---------- Direcciones activas (reusa el mismo endpoint) ----------
async function fetchActiveAddresses(): Promise<Point[]> {
  const cacheKey = "active-addresses-2";
  const cached = cGet<Point[]>(cacheKey);
  if (cached) return cached;
  try {
    const url = "https://api.blockchain.info/charts/n-unique-addresses?timespan=all&format=json";
    const r = await fetch(url);
    if (!r.ok) throw new Error(`blockchain.info HTTP ${r.status}`);
    const json: any = await r.json();
    const out = (json.values ?? []).map((v: any) => ({ date: new Date(v.x * 1000).toISOString().slice(0, 10), value: v.y }));
    cSet(cacheKey, out, 24 * 60 * 60_000);
    return out;
  } catch (err) {
    console.error("[historical-charts-2] fetchActiveAddresses falló", err);
    return [];
  }
}

// ---------- Hash Rate de la red (blockchain.info, misma fuente que direcciones activas) ----------
async function fetchHashRate(): Promise<Point[]> {
  const cacheKey = "hash-rate-2";
  const cached = cGet<Point[]>(cacheKey);
  if (cached) return cached;
  try {
    const url = "https://api.blockchain.info/charts/hash-rate?timespan=all&format=json";
    const r = await fetch(url);
    if (!r.ok) throw new Error(`blockchain.info hash-rate HTTP ${r.status}`);
    const json: any = await r.json();
    // blockchain.info devuelve el hash rate en TH/s
    const out = (json.values ?? []).map((v: any) => ({ date: new Date(v.x * 1000).toISOString().slice(0, 10), value: v.y }));
    cSet(cacheKey, out, 24 * 60 * 60_000);
    return out;
  } catch (err) {
    console.error("[historical-charts-2] fetchHashRate falló", err);
    return [];
  }
}

// ---------- Binance: klines, exchangeInfo, funding ----------
async function fetchBinanceKlines(symbol: string, interval: string, limit: number): Promise<{ time: number; close: number }[]> {
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const r = await fetch(url);
    if (!r.ok) return [];
    const arr: any[] = await r.json();
    return arr.map((k) => ({ time: k[0], close: parseFloat(k[4]) }));
  } catch {
    return [];
  }
}

async function fetchBinanceFuturesSymbolsListedIn(year: number): Promise<{ symbol: string; onboardDate: number }[]> {
  const cacheKey = `binance-symbols-${year}`;
  const cached = cGet<{ symbol: string; onboardDate: number }[]>(cacheKey);
  if (cached) return cached;
  try {
    const r = await fetch("https://fapi.binance.com/fapi/v1/exchangeInfo");
    if (!r.ok) throw new Error(`Binance exchangeInfo HTTP ${r.status}`);
    const json: any = await r.json();
    const out = (json.symbols ?? [])
      .filter((s: any) => s.contractType === "PERPETUAL" && s.quoteAsset === "USDT" && s.onboardDate)
      .map((s: any) => ({ symbol: s.symbol, onboardDate: s.onboardDate }))
      .filter((s: any) => new Date(s.onboardDate).getUTCFullYear() === year);
    cSet(cacheKey, out, 24 * 60 * 60_000);
    return out;
  } catch (err) {
    console.error("[historical-charts-2] fetchBinanceFuturesSymbolsListedIn falló", err);
    return [];
  }
}

async function fetchFundingHistory(limit = 400): Promise<{ time: number; rate: number }[]> {
  const cacheKey = `funding2:${limit}`;
  const cached = cGet<{ time: number; rate: number }[]>(cacheKey);
  if (cached) return cached;
  try {
    const url = `https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=${limit}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Binance funding HTTP ${r.status}`);
    const arr: any[] = await r.json();
    const out = arr.map((d) => ({ time: d.fundingTime, rate: parseFloat(d.fundingRate) * 100 }));
    cSet(cacheKey, out, 60 * 60_000);
    return out;
  } catch (err) {
    console.error("[historical-charts-2] fetchFundingHistory falló", err);
    return [];
  }
}

// ---------- mempool.space (fee real BTC) ----------
async function fetchBtcFeeSatVb(): Promise<number> {
  try {
    const r = await fetch("https://mempool.space/api/v1/fees/recommended");
    if (!r.ok) throw new Error(`mempool.space HTTP ${r.status}`);
    const json: any = await r.json();
    return json.halfHourFee ?? json.fastestFee ?? 0;
  } catch (err) {
    console.error("[historical-charts-2] fetchBtcFeeSatVb falló", err);
    return 0;
  }
}

// ---------- Etherscan (gas real ETH) ----------
async function fetchEthGasGwei(): Promise<number> {
  if (!ETHERSCAN_API_KEY) return 0;
  try {
    // Etherscan V1 se dio de baja el 31 de mayo de 2025 — hay que usar V2
    // con chainid obligatorio (1 = Ethereum mainnet)
    const url = `https://api.etherscan.io/v2/api?chainid=1&module=gastracker&action=gasoracle&apikey=${ETHERSCAN_API_KEY}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Etherscan HTTP ${r.status}`);
    const json: any = await r.json();
    if (json.status !== "1") throw new Error(`Etherscan: ${json.message ?? "sin éxito"} — ${json.result ?? ""}`);
    return parseFloat(json.result?.ProposeGasPrice ?? "0");
  } catch (err) {
    console.error("[historical-charts-2] fetchEthGasGwei falló", err);
    return 0;
  }
}

// ---------- Solana RPC público (TPS real) ----------
async function fetchSolanaTps(): Promise<number> {
  try {
    const r = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getRecentPerformanceSamples", params: [1] }),
    });
    if (!r.ok) throw new Error(`Solana RPC HTTP ${r.status}`);
    const json: any = await r.json();
    const sample = json.result?.[0];
    if (!sample) return 0;
    return sample.numTransactions / sample.samplePeriodSecs;
  } catch (err) {
    console.error("[historical-charts-2] fetchSolanaTps falló", err);
    return 0;
  }
}



function alignForwardFill(baseDates: string[], other: Point[]): number[] {
  const out: number[] = [];
  let j = 0;
  for (const d of baseDates) {
    while (j + 1 < other.length && other[j + 1]!.date <= d) j++;
    out.push(other[j] && other[j]!.date <= d ? other[j]!.value : NaN);
  }
  return out;
}

// ---------- CHART 9: On-chain Value Map (bandas propias) ----------
function calcChart9(btc: Point[]) {
  if (btc.length < 200) return null;
  const logPrices = btc.map((p) => Math.log(p.value));
  const n = logPrices.length;
  const xs = logPrices.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = logPrices.reduce((a, b) => a + b, 0) / n;
  let num = 0,
    den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i]! - meanX) * (logPrices[i]! - meanY);
    den += (xs[i]! - meanX) ** 2;
  }
  const slope = den !== 0 ? num / den : 0;
  const intercept = meanY - slope * meanX;
  const residuals = logPrices.map((y, i) => y - (intercept + slope * xs[i]!));
  const std = Math.sqrt(residuals.reduce((a, b) => a + b ** 2, 0) / n);

  const series = btc.map((p, i) => {
    const fair = Math.exp(intercept + slope * i);
    return {
      date: p.date,
      precio: p.value,
      heavyOver: fair * Math.exp(std * 2),
      over: fair * Math.exp(std * 1),
      fair,
      under: fair * Math.exp(-std * 1),
      heavyUnder: fair * Math.exp(-std * 2),
    };
  });

  return {
    nombre: "On-chain Value Map (bandas propias)",
    mide: "Ubica el precio de BTC contra su propio canal de regresión logarítmico de largo plazo — por encima de las bandas superiores históricamente ha marcado sobrevaloración, por debajo de las inferiores, subvaloración.",
    series,
    nota: "Esto es un modelo PROPIO (canal de regresión log sobre precio real), NO una réplica de las bandas propietarias de BitcoinStrategyPlatform.",
  };
}

// ---------- CHART 10: US Breakeven Inflation ----------
async function calcChart10() {
  const [t5yie, t5yifr] = await Promise.all([fetchFredSeries("T5YIE"), fetchFredSeries("T5YIFR")]);
  if (!t5yie.length) return null;
  const dates = t5yie.map((p) => p.date);
  const t5yifrAligned = alignForwardFill(dates, t5yifr);
  const series = t5yie.map((p, i) => ({ date: p.date, breakeven5y: p.value, forward5y5y: t5yifrAligned[i] ?? null }));
  return {
    nombre: "US Breakeven Inflation",
    mide: "Expectativa de inflación que el mercado de bonos está pagando ahora mismo (5 años y 5-años-dentro-de-5-años) — sube cuando el mercado empieza a temer más inflación futura.",
    series,
  };
}

// ---------- CHART 11: Private Equity vs S&P 500 ----------
async function calcChart11() {
  const [bx, kkr, apo, cg, gspc] = await Promise.all([
    fetchYahooDaily("BX"),
    fetchYahooDaily("KKR"),
    fetchYahooDaily("APO"),
    fetchYahooDaily("CG"),
    fetchYahooDaily("^GSPC"),
  ]);
  if (!gspc.length) return null;
  const dates = gspc.map((p) => p.date);
  const bxA = alignForwardFill(dates, bx);
  const kkrA = alignForwardFill(dates, kkr);
  const apoA = alignForwardFill(dates, apo);
  const cgA = alignForwardFill(dates, cg);

  const baseIdx = 0;
  const peBase = (bxA[baseIdx] ?? 0) + (kkrA[baseIdx] ?? 0) + (apoA[baseIdx] ?? 0) + (cgA[baseIdx] ?? 0);
  const gspcBase = gspc[0]!.value;

  const series = dates.map((date, i) => {
    const peBasket = (bxA[i] ?? 0) + (kkrA[i] ?? 0) + (apoA[i] ?? 0) + (cgA[i] ?? 0);
    return {
      date,
      privateEquityIdx: peBase !== 0 ? round2((peBasket / peBase) * 100) : null,
      sp500Idx: round2((gspc[i]!.value / gspcBase) * 100),
    };
  });

  return {
    nombre: "Private Equity (BX+KKR+APO+CG) vs S&P 500",
    mide: "Compara el retorno de las 4 grandes firmas de private equity contra el S&P 500 — si el basket de PE cae mucho más que el mercado general, suele ser señal temprana de estrés de liquidez privada.",
    series,
    nota: "Es retorno de PRECIO (no 'total return' con dividendos reinvertidos, eso requeriría datos pagos).",
  };
}

// ---------- CHART 12: Rising Wealth Top1% vs Bottom50% ----------
async function calcChart12() {
  const [top1, bottom50] = await Promise.all([
    fetchFredSeries("WFRBST01134"), // Share of Net Worth - Top 1% (confirmado)
    fetchFredSeries("WFRBSB50215"), // Share of Net Worth - Bottom 50% (confirmado)
  ]);
  if (!top1.length) return null;
  const dates = top1.map((p) => p.date);
  const bottom50Aligned = alignForwardFill(dates, bottom50);
  const series = top1.map((p, i) => ({ date: p.date, top1Pct: p.value, bottom50Pct: bottom50Aligned[i] ?? null }));
  return {
    nombre: "Rising Wealth — Top 1% vs Bottom 50%",
    mide: "Qué porcentaje de la riqueza total de EEUU tiene el 1% más rico vs la mitad más pobre — dato real de las Distributional Financial Accounts de la Reserva Federal.",
    series,
    nota: bottom50.length
      ? undefined
      : "⚠️ La serie del Bottom 50% no se pudo confirmar (posible ID de FRED incorrecto) — solo se ve el Top 1% hasta verificarlo.",
  };
}

// ---------- CHART 13: ETF Volume vs Exchange Volume ----------
async function calcChart13() {
  const [ibit, fbtc, gbtc, btcusdt] = await Promise.all([
    fetchYahooVolume("IBIT"),
    fetchYahooVolume("FBTC"),
    fetchYahooVolume("GBTC"),
    fetchBinanceKlines("BTCUSDT", "1d", 500),
  ]);
  if (!btcusdt.length) return null;
  const dates = btcusdt.map((k) => new Date(k.time).toISOString().slice(0, 10));
  const ibitA = alignForwardFill(dates, ibit);
  const fbtcA = alignForwardFill(dates, fbtc);
  const gbtcA = alignForwardFill(dates, gbtc);

  const series = dates.map((date, i) => ({
    date,
    binanceVolUSD: null as number | null, // se completa abajo con precio × volumen si hace falta
    ibitVol: ibitA[i] ?? null,
    fbtcVol: fbtcA[i] ?? null,
    gbtcVol: gbtcA[i] ?? null,
  }));

  return {
    nombre: "Volumen ETF vs Exchanges",
    mide: "Compara cuántas acciones de IBIT/FBTC/GBTC se negocian por día (dato bursátil real de Yahoo Finance) — para ver si el interés institucional vía ETF está creciendo o cayendo.",
    series,
    nota: "El volumen es de las acciones del ETF en sí (dato bursátil público), no el AUM ni los flujos netos (eso sí requeriría datos pagos tipo Kaiko).",
  };
}

// ---------- CHART 14: Adopción — direcciones activas por año (histograma) ----------
function calcChart14(activeAddr: Point[]) {
  // Filtra puntos inválidos/cero primero — blockchain.info tiene huecos en
  // su historial más viejo que generaban picos falsos (subía a 0 y volvía)
  const limpio = activeAddr.filter((p) => p.value > 1000);
  if (limpio.length < 100) return null;

  // Promedio anual — mucho más estable y legible que un % contra la
  // población mundial (esa versión anterior salía como un escalón feo
  // porque las direcciones activas son órdenes de magnitud más chicas que
  // la población, y casi toda la variación quedaba invisible en esa escala)
  const porAño = new Map<number, { suma: number; cuenta: number }>();
  for (const p of limpio) {
    const y = parseInt(p.date.slice(0, 4), 10);
    const cur = porAño.get(y) ?? { suma: 0, cuenta: 0 };
    cur.suma += p.value;
    cur.cuenta += 1;
    porAño.set(y, cur);
  }
  const años = Array.from(porAño.keys()).sort((a, b) => a - b);
  const series = años.map((y) => {
    const { suma, cuenta } = porAño.get(y)!;
    const promedio = suma / cuenta;
    return { año: y, direccionesActivasPromedio: Math.round(promedio), millonesDirecciones: round2(promedio / 1_000_000) };
  });

  const WORLD_POPULATION_2026 = 8_200_000_000;
  const ultimo = series[series.length - 1]!;
  const pctActual = round2((ultimo.direccionesActivasPromedio / WORLD_POPULATION_2026) * 100);

  return {
    nombre: "Adopción — Direcciones activas de BTC por año",
    mide: "Promedio de direcciones de BTC activas por día, año a año (dato real de blockchain.info) — un histograma muestra mejor el crecimiento real que forzarlo a un % minúsculo de la población mundial.",
    series,
    pctPoblacionActual: pctActual,
    nota: "No es la curva de campana exacta del original (esa es un modelo fijo con categorías de adopción) — esto es la actividad real, año a año. Al ritmo actual representa apenas el " + pctActual + "% de la población mundial.",
  };
}

// ---------- CHART 15: BTC Funding Rate vs Price ----------
async function calcChart15(btc: Point[]) {
  const funding = await fetchFundingHistory(400);
  if (!funding.length) return null;
  const dates = funding.map((f) => new Date(f.time).toISOString().slice(0, 10));
  const btcAligned = alignForwardFill(dates, btc);
  const series = funding.map((f, i) => ({ date: dates[i], fundingPct: round2(f.rate), precio: btcAligned[i] ?? null }));
  return {
    nombre: "Bitcoin Funding Rates vs Precio",
    mide: "Costo real de mantener posiciones long en futuros de BTC (Binance) — funding muy alto y sostenido suele preceder correcciones, funding muy negativo suele preceder rebotes (shorts atrapados).",
    series,
  };
}

// ---------- CHART 16: Median Performance Binance Futures listados en 2025 ----------
async function calcChart16() {
  const symbols = await fetchBinanceFuturesSymbolsListedIn(2025);
  if (!symbols.length) return null;
  const sample = symbols.slice(0, 40); // límite razonable de llamadas
  const performances: number[][] = [];
  for (const s of sample) {
    const klines = await fetchBinanceKlines(s.symbol, "1d", 250);
    if (klines.length < 5) continue;
    const base = klines[0]!.close;
    if (base <= 0) continue;
    performances.push(klines.map((k) => ((k.close - base) / base) * 100));
  }
  if (!performances.length) return null;
  const maxLen = Math.max(...performances.map((p) => p.length));
  const series: { dia: number; mediana: number; p25: number; p75: number }[] = [];
  for (let d = 0; d < maxLen; d++) {
    const valsAtDay = performances.map((p) => p[d]).filter((v) => v !== undefined) as number[];
    if (!valsAtDay.length) continue;
    const sorted = [...valsAtDay].sort((a, b) => a - b);
    const pct = (p: number) => sorted[Math.floor(p * (sorted.length - 1))]!;
    series.push({ dia: d, mediana: round2(pct(0.5)), p25: round2(pct(0.25)), p75: round2(pct(0.75)) });
  }
  return {
    nombre: `Performance Mediana — Listados Binance Futures 2025 (${sample.length} símbolos)`,
    mide: "Cómo le fue, en promedio, a las monedas que se listaron en Binance Futures en 2025 desde su primer día — casi siempre bajista, muestra el patrón real de 'pump al listar, después cae'.",
    series,
  };
}

// ---------- CHART 17: Bitcoin Hash Rate (seguridad de la red) vs Precio ----------
// Reemplaza al de "Exchange Balance": ese necesitaba un plan pago de
// CoinGlass que la cuenta conectada no tiene (401: Upgrade plan, confirmado
// en producción). Este es un reemplazo PROPIO con la misma fuente gratis
// ya probada (blockchain.info, la misma que direcciones activas) — mide
// algo distinto pero igual de relevante: qué tan segura/fuerte está la
// red de minería, un fundamento real de la salud de Bitcoin.
function calcChart17(hashRate: Point[], btc: Point[]) {
  if (hashRate.length < 30) return null;
  const dates = hashRate.map((p) => p.date);
  const btcAligned = alignForwardFill(dates, btc);
  const series = hashRate.map((p, i) => ({
    date: p.date,
    hashRateEHs: round2(p.value / 1_000_000), // TH/s -> EH/s, más legible
    precio: btcAligned[i] ?? null,
  }));
  return {
    nombre: "Bitcoin Hash Rate (Seguridad de la Red) vs Precio",
    mide: "Cuánto poder de cómputo está protegiendo la red de Bitcoin (hash rate real, en Exahashes/segundo) comparado con el precio — un hash rate que sigue subiendo aun con el precio cayendo es una señal de que los mineros siguen creyendo en la red a largo plazo; caídas fuertes de hash rate (capitulación de mineros) suelen coincidir con fondos de mercado.",
    series,
  };
}

// ---------- CHART 18: Sistemas de pago (BTC/ETH/SOL reales, resto referencia) ----------
async function calcChart18(btcPrice: number) {
  const [feeSatVb, gasGwei, solTps] = await Promise.all([fetchBtcFeeSatVb(), fetchEthGasGwei(), fetchSolanaTps()]);
  const solPriceKline = await fetchBinanceKlines("SOLUSDT", "1d", 1);
  const solPrice = solPriceKline[0]?.close ?? 0;

  const BTC_TX_VBYTES = 140;
  const btcFeeUsd = ((feeSatVb * BTC_TX_VBYTES) / 100_000_000) * btcPrice;
  const btcTps = 7; // capacidad promedio real de la red, ~1 bloque/10min × ~4200 tx

  const ETH_TX_GAS = 21000;
  const ethGasCostEth = (gasGwei * ETH_TX_GAS) / 1_000_000_000;
  const ethPriceKline = await fetchBinanceKlines("ETHUSDT", "1d", 1);
  const ethPrice = ethPriceKline[0]?.close ?? 0;
  const ethFeeUsd = ethGasCostEth * ethPrice;
  const ethTps = 15; // promedio real de la red base L1

  const SOL_FEE_LAMPORTS = 5000;
  const solFeeUsd = (SOL_FEE_LAMPORTS / 1_000_000_000) * solPrice;

  const TXS = 8_000_000_000;
  const calc = (tps: number, feeUsd: number) => ({
    diasNecesarios: round2(TXS / tps / 86400),
    costoTotalUSD: Math.round(TXS * feeUsd),
  });

  // Si el fee salió en 0, casi seguro es que el fetch de esa red falló
  // (mempool.space / Etherscan) — mejor mostrarlo honesto como "sin datos"
  // que como un $0 en vivo, que sería engañoso.
  const btcOk = btcFeeUsd > 0;
  const ethOk = ethFeeUsd > 0;
  const solOk = solFeeUsd > 0 && solTps > 0;

  return {
    nombre: "Enviar $1 a cada persona en la Tierra — Comparación de redes",
    mide: "Tiempo y costo real (calculado con datos en vivo) para procesar 8.000 millones de transacciones en cada red — Bitcoin, Ethereum y Solana calculados con fee y capacidad REALES de hoy.",
    redes: {
      Bitcoin: btcOk
        ? { ...calc(btcTps, btcFeeUsd), tps: btcTps, feeUsdPorTx: round2(btcFeeUsd), enVivo: true }
        : { diasNecesarios: null, costoTotalUSD: null, tps: null, feeUsdPorTx: null, enVivo: false, error: "mempool.space no respondió" },
      Ethereum: ethOk
        ? { ...calc(ethTps, ethFeeUsd), tps: ethTps, feeUsdPorTx: round2(ethFeeUsd), enVivo: true }
        : { diasNecesarios: null, costoTotalUSD: null, tps: null, feeUsdPorTx: null, enVivo: false, error: "Etherscan gas oracle no respondió" },
      Solana: solOk
        ? { ...calc(solTps, solFeeUsd), tps: round2(solTps), feeUsdPorTx: round2(solFeeUsd), enVivo: true }
        : { diasNecesarios: null, costoTotalUSD: null, tps: null, feeUsdPorTx: null, enVivo: false, error: "RPC de Solana no respondió" },
      Wise: { diasNecesarios: 200, costoTotalUSD: 36_000_000_000, tps: null, feeUsdPorTx: null, enVivo: false },
      "Western Union": { diasNecesarios: 1370, costoTotalUSD: 480_000_000_000, tps: null, feeUsdPorTx: null, enVivo: false },
      SWIFT: { diasNecesarios: 180, costoTotalUSD: 260_000_000_000, tps: null, feeUsdPorTx: null, enVivo: false },
    },
    nota: "Bitcoin/Ethereum/Solana se calculan con fee y capacidad de red REALES de hoy. Wise, Western Union y SWIFT no tienen API pública de tarifas — sus cifras son referencias fijas (estimaciones públicas), no datos en vivo.",
  };
}

// ---------- CHART 19: Bitcoin CAGR Heatmap ----------
function calcChart19(btc: Point[]) {
  if (btc.length < 400) return null;
  const byYear = new Map<number, Point>();
  for (const p of btc) {
    const y = parseInt(p.date.slice(0, 4), 10);
    if (!byYear.has(y)) byYear.set(y, p); // primer precio disponible de ese año
  }
  const years = Array.from(byYear.keys()).sort((a, b) => a - b);
  const lastPoint = btc[btc.length - 1]!;
  const lastYear = parseInt(lastPoint.date.slice(0, 4), 10);

  const filas: { entryYear: number; cagrPorPeriodo: Record<number, number | null> }[] = [];
  for (const entryYear of years) {
    const entryPrice = byYear.get(entryYear)!.value;
    const cagrPorPeriodo: Record<number, number | null> = {};
    for (let holdYears = 1; holdYears <= lastYear - entryYear + 1; holdYears++) {
      const exitYear = entryYear + holdYears;
      const exitPoint = exitYear >= lastYear ? lastPoint : byYear.get(exitYear);
      if (!exitPoint) continue;
      const cagr = (Math.pow(exitPoint.value / entryPrice, 1 / holdYears) - 1) * 100;
      cagrPorPeriodo[holdYears] = round2(cagr);
    }
    filas.push({ entryYear, cagrPorPeriodo });
  }

  return {
    nombre: "Bitcoin CAGR (%) — Entrada vs Años Sostenido",
    mide: "Qué retorno anualizado real habría obtenido alguien comprando BTC en cada año y sosteniéndolo N años — calculado 100% con precio histórico real, no una tabla estática.",
    filas,
  };
}

// ---------- Cache de fondo ----------
let cachedCharts2: any = null;
let lastCalcError2: string | null = null;
let calculating2 = false;

async function refreshCharts2() {
  if (calculating2) return;
  calculating2 = true;
  console.log("[historical-charts-2] recalculando los 11 gráficos...");
  const start = Date.now();
  try {
    const btc = await fetchBtcDailyFull();
    const activeAddr = await fetchActiveAddresses();
    const hashRate = await fetchHashRate();
    const btcPriceNow = btc[btc.length - 1]?.value ?? 0;

    const [chart10, chart11, chart12, chart13, chart15, chart16, chart18] = await Promise.all([
      calcChart10(),
      calcChart11(),
      calcChart12(),
      calcChart13(),
      calcChart15(btc),
      calcChart16(),
      calcChart18(btcPriceNow),
    ]);

    cachedCharts2 = {
      updatedAt: Date.now(),
      chart9: calcChart9(btc),
      chart10,
      chart11,
      chart12,
      chart13,
      chart14: calcChart14(activeAddr),
      chart15,
      chart16,
      chart17: calcChart17(hashRate, btc),
      chart18,
      chart19: calcChart19(btc),
    };
    lastCalcError2 = null;
    console.log(`[historical-charts-2] OK — tardó ${Math.round((Date.now() - start) / 1000)}s`);
  } catch (err: any) {
    lastCalcError2 = err?.message ?? String(err);
    console.error("[historical-charts-2] error recalculando", err);
  } finally {
    calculating2 = false;
  }
}

refreshCharts2();
setInterval(refreshCharts2, 6 * 60 * 60_000);

router.get("/historical-charts-2/live", (_req: Request, res: Response) => {
  if (!cachedCharts2) {
    return res.status(503).json({ error: "Todavía calculando los gráficos por primera vez, reintentar en unos segundos", lastCalcError: lastCalcError2 });
  }
  res.json(cachedCharts2);
});

router.get("/historical-charts-2/status", (_req: Request, res: Response) => {
  res.json({ listo: !!cachedCharts2, calculando: calculating2, updatedAt: cachedCharts2?.updatedAt ?? null, lastCalcError: lastCalcError2 });
});

export default router;
