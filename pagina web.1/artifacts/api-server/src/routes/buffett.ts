/**
 * BUFFETT SCANNER — TypeScript port of buffett_v3 Python
 * Exact same logic: criteria, DCF, Graham, RSI, MACD, EMA,
 * Bollinger, ATR, Fibonacci, OBV, harmonics, OI, insiders.
 */
import { Router, type Request, type Response } from "express";
import pg from "pg";

const router = Router();
const { Pool } = pg;

// ─── DB ───────────────────────────────────────────────────────────────────────
let pool: pg.Pool | null = null;
let tablesReady = false;

async function ensureTables(db: pg.Pool) {
  if (tablesReady) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS buffett_results (
      ticker       TEXT PRIMARY KEY,
      name         TEXT,
      sector       TEXT,
      score        NUMERIC,
      valuation    TEXT,
      price        NUMERIC,
      dcf_value    NUMERIC,
      margin_safety NUMERIC,
      roic         NUMERIC,
      pe           NUMERIC,
      pb           NUMERIC,
      price_fcf    NUMERIC,
      peg          NUMERIC,
      gross_margin NUMERIC,
      debt_equity  NUMERIC,
      net_margin   NUMERIC,
      rsi          NUMERIC,
      macd_signal  TEXT,
      ema_trend    TEXT,
      data         JSONB,
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS buffett_state (
      id           INTEGER PRIMARY KEY DEFAULT 1,
      data         JSONB NOT NULL DEFAULT '{}'
    );
    ALTER TABLE buffett_state ADD COLUMN IF NOT EXISTS last_index      INTEGER DEFAULT 0;
    ALTER TABLE buffett_state ADD COLUMN IF NOT EXISTS last_run        TEXT;
    ALTER TABLE buffett_state ADD COLUMN IF NOT EXISTS calls_today     INTEGER DEFAULT 0;
    ALTER TABLE buffett_state ADD COLUMN IF NOT EXISTS total_analyzed  INTEGER DEFAULT 0;
    ALTER TABLE buffett_state ADD COLUMN IF NOT EXISTS total_passed    INTEGER DEFAULT 0;
    ALTER TABLE buffett_state ADD COLUMN IF NOT EXISTS cycle           INTEGER DEFAULT 1;
    ALTER TABLE buffett_state ADD COLUMN IF NOT EXISTS universe_size   INTEGER DEFAULT 0;
    ALTER TABLE buffett_state ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();
    INSERT INTO buffett_state (id, data) VALUES (1, '{}') ON CONFLICT DO NOTHING;
    CREATE TABLE IF NOT EXISTS buffett_snapshots (
      id        SERIAL PRIMARY KEY,
      label     TEXT NOT NULL,
      saved_at  TIMESTAMPTZ DEFAULT NOW(),
      results   JSONB NOT NULL
    );
  `);
  tablesReady = true;
}

function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_PUBLIC_URL ?? process.env.BUFFETT_DATABASE_URL ?? process.env.DATABASE_URL;
    if (!url) return null;
    pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
    ensureTables(pool).catch(() => { tablesReady = false; });
  }
  return pool;
}

// ─── Config (exact copy of config.py) ────────────────────────────────────────
const CRITERIA = {
  roic_min: 10, pe_max: 20, pb_max: 2, price_fcf_max: 20, peg_max: 2,
  gross_margin_min: 50, debt_equity_max: 0.5, net_margin_min: 10, eps_growth_years: 5,
};
const DCF_CFG  = { growth: 0.10, terminal: 0.03, discount: 0.09, years: 10 };
const VALUATION = { strong_buy: -0.30, buy: -0.15, fair: 0.00, expensive: 0.20 };
const TECHNICAL_CFG = {
  ema_periods: [10, 20, 50, 100, 200],
  rsi_period: 14, macd_fast: 12, macd_slow: 26, macd_signal: 9,
  bb_period: 20, bb_std: 2, atr_period: 14,
};
const MAX_CALLS = 230;
const CALLS_PER = 5;

// ─── Universe (exact copy of data.py) ────────────────────────────────────────
const UNIVERSE = [
  "AAPL","MSFT","NVDA","GOOGL","AMZN","META","TSLA","BRK-B","AVGO","JPM",
  "LLY","V","UNH","XOM","MA","JNJ","PG","COST","HD","MRK","ABBV","CVX",
  "KO","WMT","BAC","CRM","ACN","MCD","NFLX","PEP","TMO","CSCO","WFC","LIN",
  "DIS","IBM","GE","CAT","GS","UBER","AMGN","ISRG","SPGI","AXP","RTX","BLK",
  "BKNG","DHR","PFE","NEE","HON","LOW","UNP","AMAT","TJX","SYK","VRTX","C",
  "NOW","PANW","ADP","ETN","MDT","GILD","ADI","REGN","BMY","MU","LRCX","BSX",
  "MMC","DE","CI","SCHW","ZTS","CB","CME","EOG","SO","DUK","ITW","SHW","MDLZ",
  "KKR","APH","PLD","COP","EQIX","AON","KLAC","MCO","HUM","TT","SNPS","CDNS",
  "WM","GD","MAR","NSC","MSI","FDX","EMR","ROP","ORLY","MCHP","ROST","F",
  "GM","USB","OKE","AFL","CTAS","PAYX","MNST","KMB","YUM","FTNT","STZ","IDXX",
  "MRVL","CRWD","DDOG","ZS","NET","SNOW","PLTR","COIN","APP","SMCI",
  "OKTA","MDB","GTLB","BILL","HIMS","CELH","ARM","RDDT","DUOL",
  "BABA","JD","PDD","BIDU","NIO","XPEV","LI","TCOM","EDU","VIPS",
  "TME","IQ","BILI","NTES","FUTU","MNSO","KANZHUN","SEA","GRAB",
  // ADRs chinos adicionales (la API en plan free no soporta tickers nativos
  // de Shanghai/Shenzhen/Hong Kong como 0700.HK — solo ADRs en NYSE/NASDAQ)
  "WB","ZTO","YUMC","TAL","ATHM","QFIN","BEKE","MOMO","VNET","LX",
  "HTHT","CCEP","ACM","HUYA","DOYU","RLX","EH","YY","UTSI","CD",
  // Extra S&P500
  "DXCM","VRSK","ANSS","CPRT","ODFL","FAST","CTVA","IQV","DLTR","BIIB",
  "INTU","TTWO","POOL","MPWR","PAYC","PWR","KEYS","TROW",
];

// ─── FMP Base ─────────────────────────────────────────────────────────────────
const FMP_BASE = "https://financialmodelingprep.com/stable";

async function fmp(ep: string, p: Record<string,string> = {}): Promise<Record<string,unknown> | null> {
  const key = process.env.FMP_API_KEY; if (!key) return null;
  const q = new URLSearchParams({ apikey: key, ...p });
  try {
    const r = await fetch(`${FMP_BASE}/${ep}?${q}`, { signal: AbortSignal.timeout(12000) });
    if (!r.ok) {
      console.error(`FMP error [${ep}] symbol=${p.symbol ?? "?"} status=${r.status} ${await r.text().catch(() => "")}`);
      return null;
    }
    const d = await r.json() as unknown;
    if (Array.isArray(d)) return (d[0] as Record<string,unknown>) ?? null;
    return d as Record<string,unknown> ?? null;
  } catch (e) { console.error(`FMP fetch error [${ep}] symbol=${p.symbol ?? "?"}:`, e); return null; }
}
async function fmpList(ep: string, p: Record<string,string> = {}): Promise<Record<string,unknown>[]> {
  const key = process.env.FMP_API_KEY; if (!key) return [];
  const q = new URLSearchParams({ apikey: key, ...p });
  try {
    const r = await fetch(`${FMP_BASE}/${ep}?${q}`, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) {
      console.error(`FMP error [${ep}] symbol=${p.symbol ?? "?"} status=${r.status} ${await r.text().catch(() => "")}`);
      return [];
    }
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  } catch (e) { console.error(`FMP fetch error [${ep}] symbol=${p.symbol ?? "?"}:`, e); return []; }
}
const _f = (d: Record<string,unknown> | null, k: string): number => {
  if (!d) return 0;
  const v = d[k]; return typeof v === "number" ? v : parseFloat(String(v ?? 0)) || 0;
};

// ─── Fuentes alternas — Yahoo Finance y Stooq (gratis, sin API key) ──────────
// Se usan como respaldo cuando FMP falla (plan limitado / 402-403 / rate limit),
// para que el escáner NO se quede sin datos por depender de un solo proveedor.
const YF_HEADERS = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" };

interface FallbackQuote { price: number; marketCap: number; volume: number; name: string }

// Precio/marketCap/volumen en vivo — Yahoo Finance v7 (batch quote, sin key)
async function fetchYahooQuote(ticker: string): Promise<FallbackQuote | null> {
  // v7/finance/quote empezó a devolver 401 (Yahoo le agregó autenticación).
  // v8/finance/chart NO la pide — es el mismo endpoint que ya usamos sin
  // problema en market.ts para macro/sectores. No trae marketCap, pero sí
  // precio y volumen, que es lo esencial para no perder el ticker entero.
  const path = `v8/finance/chart/${encodeURIComponent(ticker)}?interval=1m&range=1d`;
  for (const host of ["query2.finance.yahoo.com", "query1.finance.yahoo.com"]) {
    try {
      const r = await fetch(`https://${host}/${path}`, { headers: YF_HEADERS, signal: AbortSignal.timeout(8000) });
      if (!r.ok) { console.error(`Yahoo quote error [${ticker}] host=${host} status=${r.status}`); continue; }
      const d = await r.json() as {
        chart?: { result?: [{ meta?: { regularMarketPrice?: number; regularMarketVolume?: number; longName?: string; shortName?: string } }] };
      };
      const meta = d?.chart?.result?.[0]?.meta;
      if (!meta?.regularMarketPrice) continue;
      return {
        price:     meta.regularMarketPrice,
        marketCap: 0, // no disponible en este endpoint — el prefiltro de mcap se salta para fuente "yahoo"
        volume:    meta.regularMarketVolume ?? 0,
        name:      meta.longName ?? meta.shortName ?? ticker,
      };
    } catch (e) { console.error(`Yahoo quote fetch error [${ticker}] host=${host}:`, e); }
  }
  return null;
}

// Última capa de respaldo — Stooq (CSV plano, sin key, muy estable para precio)
async function fetchStooqPrice(ticker: string): Promise<{ price: number } | null> {
  try {
    const sym = `${ticker.toLowerCase()}.us`;
    const r = await fetch(`https://stooq.com/q/l/?s=${sym}&f=sd2t2ohlcv&h&e=csv`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) { console.error(`Stooq error [${ticker}] status=${r.status}`); return null; }
    const csv = await r.text();
    const rows = csv.trim().split("\n");
    if (rows.length < 2) return null;
    const cols = rows[1].split(",");
    const close = parseFloat(cols[6] ?? "");
    if (!close || close <= 0) return null;
    return { price: close };
  } catch (e) { console.error(`Stooq fetch error [${ticker}]:`, e); return null; }
}

// Fundamentales básicos de respaldo — Yahoo quoteSummary (cuando FMP ratios-ttm
// y key-metrics-ttm fallan ambos). No cubre todo lo que da FMP (ej. ROIC exacto),
// pero da lo suficiente para no dejar el criterio entero en 0 por un 403 de FMP.
interface FallbackFundamentals {
  pe: number; pb: number; de: number; gm: number; nm: number;
  roic: number; bvps: number; shares: number; peg: number;
}
// NOTA (jul 2026): Yahoo empezó a exigir autenticación en v10/quoteSummary
// (devuelve 401 en muchos tickers). Cuando eso pasa, esta función simplemente
// retorna null y el sistema sigue con lo que FMP haya podido dar — no hay
// todavía un endpoint gratis conocido que reemplace esto para fundamentales
// completos (a diferencia del precio, que sí tiene alternativa en v8/chart).
async function fetchYahooFundamentals(ticker: string): Promise<FallbackFundamentals | null> {
  const modules = "defaultKeyStatistics,financialData,summaryDetail";
  const path = `v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}`;
  for (const host of ["query2.finance.yahoo.com", "query1.finance.yahoo.com"]) {
    try {
      const r = await fetch(`https://${host}/${path}`, { headers: YF_HEADERS, signal: AbortSignal.timeout(8000) });
      if (!r.ok) { console.error(`Yahoo fundamentals error [${ticker}] host=${host} status=${r.status}`); continue; }
      const d = await r.json() as {
        quoteSummary?: { result?: [{
          defaultKeyStatistics?: Record<string, { raw?: number }>;
          financialData?: Record<string, { raw?: number }>;
          summaryDetail?: Record<string, { raw?: number }>;
        }] };
      };
      const res = d?.quoteSummary?.result?.[0];
      if (!res) continue;
      const dks = res.defaultKeyStatistics ?? {};
      const fin = res.financialData ?? {};
      const summ = res.summaryDetail ?? {};
      return {
        pe:     summ.trailingPE?.raw ?? summ.forwardPE?.raw ?? 0,
        pb:     dks.priceToBook?.raw ?? 0,
        de:     fin.debtToEquity?.raw ? fin.debtToEquity.raw / 100 : 0, // Yahoo lo da en %, FMP en ratio
        gm:     fin.grossMargins?.raw ? fin.grossMargins.raw * 100 : 0,
        nm:     fin.profitMargins?.raw ? fin.profitMargins.raw * 100 : 0,
        roic:   fin.returnOnEquity?.raw ? fin.returnOnEquity.raw * 100 : 0, // proxy — Yahoo no da ROIC directo
        bvps:   dks.bookValue?.raw ?? 0,
        shares: dks.sharesOutstanding?.raw ?? 0,
        peg:    dks.pegRatio?.raw ?? 0,
      };
    } catch (e) { console.error(`Yahoo fundamentals fetch error [${ticker}] host=${host}:`, e); }
  }
  return null;
}

// ─── TECHNICAL ANALYSIS (port of technical.py) ───────────────────────────────

type OHLCV = { open: number; high: number; low: number; close: number; volume: number; };

function calcEMA(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  let ema = values[0];
  result.push(ema);
  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
}

function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  const gains: number[] = [], losses: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gains.push(d > 0 ? d : 0);
    losses.push(d < 0 ? -d : 0);
  }
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b) / period;
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }
  if (avgLoss === 0) return 100;
  return Math.round((100 - 100 / (1 + avgGain / avgLoss)) * 100) / 100;
}

function calcMACD(closes: number[], fast = 12, slow = 26, sig = 9) {
  if (closes.length < slow + sig) return { macd: 0, signal: 0, hist: 0, prev_hist: 0 };
  const emaFast = calcEMA(closes, fast);
  const emaSlow = calcEMA(closes, slow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const sigLine  = calcEMA(macdLine, sig);
  const hist     = macdLine.map((v, i) => v - sigLine[i]);
  const n = hist.length;
  return {
    macd:      Math.round(macdLine[n-1] * 10000) / 10000,
    signal:    Math.round(sigLine[n-1]  * 10000) / 10000,
    hist:      Math.round(hist[n-1]     * 10000) / 10000,
    prev_hist: Math.round((hist[n-2] ?? 0) * 10000) / 10000,
  };
}

function calcBollinger(closes: number[], period = 20) {
  if (closes.length < period) return { upper: 0, mid: 0, lower: 0, bw_pct: 0, zone: "N/A" };
  const slice = closes.slice(-period);
  const mid   = slice.reduce((a, b) => a + b) / period;
  const std   = Math.sqrt(slice.reduce((s, v) => s + (v - mid) ** 2, 0) / period);
  const upper = mid + 2 * std;
  const lower = mid - 2 * std;
  const price = closes[closes.length - 1];
  const bw    = mid > 0 ? Math.round((upper - lower) / mid * 10000) / 100 : 0;
  const zone  = price >= upper ? "TOCA SUPERIOR 🔴" : price <= lower ? "TOCA INFERIOR 🟢" : "DENTRO ⚪";
  return { upper: Math.round(upper*100)/100, mid: Math.round(mid*100)/100,
           lower: Math.round(lower*100)/100, bw_pct: bw, zone };
}

function calcATR(bars: OHLCV[], period = 14): number {
  if (bars.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const h = bars[i].high, l = bars[i].low, pc = bars[i-1].close;
    trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }
  const recent = trs.slice(-period);
  return Math.round(recent.reduce((a,b) => a+b, 0) / recent.length * 100) / 100;
}

function calcFibonacci(bars: OHLCV[], price: number) {
  const last252 = bars.slice(-252);
  const high = Math.max(...last252.map(b => b.high));
  const low  = Math.min(...last252.map(b => b.low));
  const diff = high - low;
  const levels: Record<string, number> = {
    "0.0":    Math.round(high * 100) / 100,
    "0.236":  Math.round((high - 0.236 * diff) * 100) / 100,
    "0.382":  Math.round((high - 0.382 * diff) * 100) / 100,
    "0.5":    Math.round((high - 0.500 * diff) * 100) / 100,
    "0.618":  Math.round((high - 0.618 * diff) * 100) / 100,
    "0.786":  Math.round((high - 0.786 * diff) * 100) / 100,
    "1.0":    Math.round(low  * 100) / 100,
    "-0.272": Math.round((high + 0.272 * diff) * 100) / 100,
    "-0.618": Math.round((high + 0.618 * diff) * 100) / 100,
    "-1.0":   Math.round((high + 1.0   * diff) * 100) / 100,
  };
  const nearest = Object.entries(levels).reduce((a, b) =>
    Math.abs(b[1] - price) < Math.abs(a[1] - price) ? b : a);
  return { high_52w: Math.round(high*100)/100, low_52w: Math.round(low*100)/100,
           levels, nearest: nearest[0], nearest_price: nearest[1] };
}

function calcVolume(bars: OHLCV[]) {
  const vols    = bars.map(b => b.volume);
  const closes  = bars.map(b => b.close);
  const curr    = vols[vols.length - 1];
  const avg20   = vols.slice(-20).reduce((a,b) => a+b, 0) / 20;
  const ratio   = avg20 > 0 ? Math.round(curr / avg20 * 100) / 100 : 0;
  // OBV
  let obv = 0; const obvArr = [0];
  for (let i = 1; i < bars.length; i++) {
    const d = closes[i] > closes[i-1] ? 1 : closes[i] < closes[i-1] ? -1 : 0;
    obv += d * vols[i];
    obvArr.push(obv);
  }
  const obvTrend = obvArr[obvArr.length-1] > obvArr[Math.max(0, obvArr.length-21)] ? "ALCISTA 🟢" : "BAJISTA 🔴";
  const trend    = ratio > 1.5 ? "ALTO 🟢" : ratio < 0.5 ? "BAJO 🔴" : "NORMAL ⚪";
  return { current: Math.round(curr), avg20: Math.round(avg20), ratio, trend, obv_trend: obvTrend };
}

function calcHarmonics(closes: number[]) {
  try {
    const last100 = closes.slice(-100);
    const w = 5;
    const pivots: number[] = [];
    for (let i = w; i < last100.length - w; i++) {
      const seg = last100.slice(i - w, i + w + 1);
      if (last100[i] === Math.max(...seg) || last100[i] === Math.min(...seg))
        pivots.push(last100[i]);
    }
    if (pivots.length < 5) return { detected: ["—"], count: 0 };
    const [x, a, b, c] = pivots.slice(-5);
    const xa = Math.abs(a - x), ab = Math.abs(b - a), bc = Math.abs(c - b);
    if (xa <= 0 || ab <= 0 || bc <= 0) return { detected: ["—"], count: 0 };
    const ab_xa = ab / xa, bc_ab = bc / ab;
    const patterns: string[] = [];
    if (ab_xa > 0.55 && ab_xa < 0.68 && bc_ab > 0.35 && bc_ab < 0.90) patterns.push("GARTLEY");
    else if (ab_xa > 0.35 && ab_xa < 0.52)                               patterns.push("BAT");
    else if (ab_xa > 0.75 && ab_xa < 0.82)                               patterns.push("BUTTERFLY");
    else if (ab_xa > 0.38 && ab_xa < 0.50 && bc_ab > 0.88)               patterns.push("CRAB");
    return { detected: patterns.length ? patterns : ["—"], count: patterns.length };
  } catch { return { detected: ["N/A"], count: 0 }; }
}

function calcTechnicalSignal(r: Record<string, unknown>) {
  let score = 0, total = 0;
  const rsi    = (r.rsi as { value: number }).value;
  score += rsi < 40 ? 1 : rsi > 70 ? -1 : 0; total += 1;
  const hist = (r.macd as { hist: number }).hist;
  score += hist > 0 ? 1 : -1; total += 1;
  const et = r.ema_trend as string;
  if (et.includes("FUERTE 🟢"))    { score += 2; }
  else if (et.includes("PARCIAL 🟡")) { score += 1; }
  else if (et.includes("FUERTE 🔴")) { score -= 2; }
  else                               { score -= 1; }
  total += 2;
  const bbZone = (r.bollinger as { zone: string }).zone;
  if (bbZone.includes("INFERIOR"))  score += 1;
  else if (bbZone.includes("SUPERIOR")) score -= 1;
  total += 1;
  const obvTrend = (r.volume as { obv_trend: string }).obv_trend;
  score += obvTrend.includes("ALCISTA") ? 1 : -1; total += 1;
  const pct   = Math.round(((score + total) / (total * 2)) * 100);
  const label = pct >= 70 ? "COMPRA TÉCNICA 🟢" : pct >= 50 ? "NEUTRAL 🟡" : "VENTA TÉCNICA 🔴";
  return { score: pct, label };
}

async function runTechnical(ticker: string) {
  const today  = new Date().toISOString().slice(0, 10);
  const from   = new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10);
  const raw    = await fmpList("historical-price-eod/full",
    { symbol: ticker, from, to: today });
  if (!raw || raw.length < 50) return null;

  // FMP returns descending — reverse to ascending
  const bars: OHLCV[] = raw.slice().reverse().map(d => ({
    open:   parseFloat(String(d.open   ?? 0)) || 0,
    high:   parseFloat(String(d.high   ?? 0)) || 0,
    low:    parseFloat(String(d.low    ?? 0)) || 0,
    close:  parseFloat(String(d.close  ?? 0)) || 0,
    volume: parseFloat(String(d.volume ?? 0)) || 0,
  })).filter(b => b.close > 0);

  if (bars.length < 50) return null;
  const closes = bars.map(b => b.close);
  const price  = closes[closes.length - 1];

  // EMAs (10,20,50,100,200)
  const emas: Record<string, number> = {};
  for (const p of TECHNICAL_CFG.ema_periods) {
    if (closes.length >= p)
      emas[`ema${p}`] = Math.round(calcEMA(closes, p).at(-1)! * 100) / 100;
  }
  const aboveCount = Object.values(emas).filter(v => price > v).length;
  const totalEmas  = Object.keys(emas).length;
  const emaTrend = aboveCount === totalEmas ? "ALCISTA FUERTE 🟢"
    : aboveCount >= totalEmas / 2 ? "ALCISTA PARCIAL 🟡"
    : aboveCount === 0 ? "BAJISTA FUERTE 🔴" : "BAJISTA PARCIAL 🟠";

  const rsiVal   = calcRSI(closes);
  const rsiZone  = rsiVal > 70 ? "SOBRECOMPRA 🔴" : rsiVal < 30 ? "SOBREVENTA 🟢" : "NEUTRO ⚪";

  const { macd: macdVal, signal: sigVal, hist, prev_hist } = calcMACD(closes);
  const macdCross = prev_hist < 0 && hist > 0 ? "GOLDEN CROSS 🟢"
    : prev_hist > 0 && hist < 0 ? "DEATH CROSS 🔴" : "—";

  const result: Record<string, unknown> = {
    price:      Math.round(price * 100) / 100,
    emas,
    ema_trend:  emaTrend,
    rsi:        { value: rsiVal, zone: rsiZone },
    macd:       { macd: macdVal, signal: sigVal, hist,
                  trend: hist > 0 ? "ALCISTA 🟢" : "BAJISTA 🔴", cross: macdCross },
    bollinger:  calcBollinger(closes),
    atr:        calcATR(bars),
    fibonacci:  calcFibonacci(bars, price),
    volume:     calcVolume(bars),
    harmonics:  calcHarmonics(closes),
  };
  result.signal = calcTechnicalSignal(result);
  return result;
}

// ─── POLYGON / MASSIVE (port of polygon.py) ──────────────────────────────────

const POLY_BASE = "https://api.polygon.io";

async function polyGet(ep: string, params: Record<string,string> = {}) {
  const key = process.env.MASSIVE_API_KEY || process.env.POLYGON_API_KEY;
  if (!key) return null;
  const q = new URLSearchParams({ apiKey: key, ...params });
  try {
    const r = await fetch(`${POLY_BASE}/${ep}?${q}`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    return await r.json() as Record<string, unknown>;
  } catch { return null; }
}

async function getOptionsOI(ticker: string) {
  const data = await polyGet(`v3/snapshot/options/${ticker}`, { limit: "50" });
  const results = (data?.results ?? []) as Record<string,unknown>[];
  if (!results.length) return { available: false, score: 0, label: "N/A" };
  let callOI = 0, putOI = 0;
  for (const opt of results) {
    const oi    = Number(opt.open_interest ?? 0);
    const ctype = (opt.details as Record<string,unknown>)?.contract_type as string ?? "";
    if (ctype === "call") callOI += oi;
    else if (ctype === "put") putOI += oi;
  }
  const pc = callOI > 0 ? Math.round(putOI / callOI * 100) / 100 : null;
  let score = 0, sentiment = "N/A";
  if (pc === null) { score = 0; sentiment = "N/A"; }
  else if (pc < 0.5)  { score = 2;  sentiment = "MUY ALCISTA 🟢"; }
  else if (pc < 0.8)  { score = 1;  sentiment = "ALCISTA 🟡"; }
  else if (pc < 1.2)  { score = 0;  sentiment = "NEUTRO ⚪"; }
  else if (pc < 1.5)  { score = -1; sentiment = "BAJISTA 🟠"; }
  else                { score = -2; sentiment = "MUY BAJISTA 🔴"; }
  return { available: true, call_oi: callOI, put_oi: putOI, pc_ratio: pc,
           sentiment, score, label: pc !== null ? `P/C: ${pc}` : "N/A" };
}

async function getShortInterest(ticker: string) {
  const data = await polyGet("stocks/v1/short-interest",
    { ticker, limit: "1", order: "desc" });
  const results = (data?.results ?? []) as Record<string,unknown>[];
  if (!results.length) return { available: false, score: 0, label: "Sin datos" };
  try {
    const r        = results[0];
    const ss       = Number(r.shares_short ?? 0);
    const fs       = Number(r.float_shares ?? 0);
    const shortPct = fs > 0 ? Math.round(ss / fs * 1000) / 10 : 0;
    if (!shortPct) return { available: false, score: 0, label: "Sin datos" };
    let score = 0, label = "";
    if      (shortPct < 3)  { score = 2;  label = `BAJO ${shortPct}% 🟢`; }
    else if (shortPct < 8)  { score = 1;  label = `NORMAL ${shortPct}% 🟡`; }
    else if (shortPct < 15) { score = 0;  label = `ELEVADO ${shortPct}% 🟠`; }
    else if (shortPct < 25) { score = -1; label = `ALTO ${shortPct}% 🔴`; }
    else                    { score = -2; label = `MUY ALTO ${shortPct}% 💀`; }
    return { available: true, short_pct: shortPct, shares_short: Math.round(ss), score, label };
  } catch { return { available: false, score: 0, label: "Error" }; }
}

async function getInsiderTrades(ticker: string) {
  const from = new Date(Date.now() - 180 * 864e5).toISOString().slice(0, 10);
  const data = await polyGet("stocks/filings/vX/form-4",
    { ticker, filed_gte: from, limit: "25", order: "desc" });
  const results = (data?.results ?? []) as Record<string,unknown>[];
  if (!results.length) return { available: false, score: 0, label: "Sin actividad", buys: 0, sells: 0 };
  let buys = 0, sells = 0;
  for (const filing of results) {
    const txs = (filing.transactions ?? []) as Record<string,unknown>[];
    for (const tx of txs) {
      const code = String(tx.transaction_code ?? "");
      if (code === "P") buys++;
      else if (code === "S") sells++;
    }
  }
  const total = buys + sells;
  if (!total) return { available: false, score: 0, label: "Sin actividad", buys: 0, sells: 0 };
  const ratio = buys / total;
  let score = 0, label = "";
  if      (ratio >= 0.8) { score = 3;  label = `COMPRANDO FUERTE 🟢 (${buys}C/${sells}V)`; }
  else if (ratio >= 0.6) { score = 2;  label = `COMPRANDO 🟡 (${buys}C/${sells}V)`; }
  else if (ratio >= 0.4) { score = 1;  label = `MIXTO ⚪ (${buys}C/${sells}V)`; }
  else if (ratio >= 0.2) { score = -1; label = `VENDIENDO 🟠 (${buys}C/${sells}V)`; }
  else                   { score = -2; label = `VENDIENDO FUERTE 🔴 (${buys}C/${sells}V)`; }
  return { available: true, buys, sells, buy_ratio: Math.round(ratio*100)/100, score, label };
}

async function getNewsSentiment(ticker: string) {
  const data = await polyGet("v2/reference/news",
    { ticker, limit: "20", order: "desc" });
  const results = (data?.results ?? []) as Record<string,unknown>[];
  if (!results.length) return { available: false, score: 0, label: "Sin noticias", articles: 0 };
  let pos = 0, neg = 0;
  for (const art of results) {
    const insights = (art.insights ?? []) as Record<string,unknown>[];
    for (const ins of insights) {
      const sent = String(ins.sentiment ?? "");
      if (sent === "positive") pos++;
      else if (sent === "negative") neg++;
    }
  }
  const total = pos + neg;
  if (!total) return { available: false, score: 0, label: "Sin sentimiento", articles: results.length };
  const ratio = pos / total;
  let score = 0, label = "";
  if      (ratio >= 0.7) { score = 2;  label = `MUY POSITIVO 🟢 (${pos}+/${neg}-)`;  }
  else if (ratio >= 0.55) { score = 1; label = `POSITIVO 🟡 (${pos}+/${neg}-)`;       }
  else if (ratio >= 0.45) { score = 0; label = `NEUTRO ⚪ (${pos}+/${neg}-)`;         }
  else if (ratio >= 0.3)  { score = -1; label = `NEGATIVO 🟠 (${pos}+/${neg}-)`;      }
  else                    { score = -2; label = `MUY NEGATIVO 🔴 (${pos}+/${neg}-)`;  }
  return { available: true, positive: pos, negative: neg, articles: results.length, score, label };
}

async function getPolygonScore(ticker: string) {
  const [oi, short, insider, news] = await Promise.all([
    getOptionsOI(ticker), getShortInterest(ticker),
    getInsiderTrades(ticker), getNewsSentiment(ticker),
  ]);
  const scores = [oi.score, short.score, insider.score, news.score];
  const weights = [2, 1, 3, 1]; // insider más importante
  const totalW  = weights.reduce((a,b) => a+b, 0);
  const raw     = scores.reduce((s,v,i) => s + v * weights[i], 0);
  const maxRaw  = totalW * 3;
  const minRaw  = -totalW * 3;
  const normalized = Math.round(((raw - minRaw) / (maxRaw - minRaw)) * 100);
  const label = normalized >= 65 ? "SEÑALES ALCISTAS 🟢"
    : normalized < 40 ? "SEÑALES BAJISTAS 🔴" : "SEÑALES NEUTRAS ⚪";
  return { score: normalized, label, oi, short, insider, news };
}

// ─── Screener / Valuation (port of screener.py) ───────────────────────────────

function dcfCalc(fcf: number, shares: number): number | null {
  if (fcf <= 0 || shares <= 0) return null;
  const { growth: g, terminal: tg, discount: r, years: n } = DCF_CFG;
  let pv = 0;
  for (let i = 1; i <= n; i++) pv += fcf * (1 + g) ** i / (1 + r) ** i;
  const tv = fcf * (1 + g) ** n * (1 + tg) / (r - tg);
  return (pv + tv / (1 + r) ** n) / shares;
}
function grahamCalc(eps: number, bvps: number): number | null {
  if (eps <= 0 || bvps <= 0) return null;
  return Math.sqrt(22.5 * eps * bvps);
}
function zoneCalc(price: number, intrinsic: number): string {
  const diff = (price - intrinsic) / intrinsic;
  if (diff <= VALUATION.strong_buy) return "COMPRA FUERTE 🟢";
  if (diff <= VALUATION.buy)        return "COMPRA 🟡";
  if (diff <= VALUATION.fair)       return "PRECIO JUSTO ⚪";
  if (diff <= VALUATION.expensive)  return "CARA 🔴";
  return "BURBUJA 💀";
}

async function analyzeOne(ticker: string) {
  // 1. Quote (pre-filter) — FMP primero, Yahoo y Stooq como respaldo si falla
  let quote = await fmp("quote", { symbol: ticker });
  let quoteSource = "fmp";
  if (!quote) {
    const yq = await fetchYahooQuote(ticker);
    if (yq) {
      quote = { price: yq.price, marketCap: yq.marketCap, volume: yq.volume, name: yq.name };
      quoteSource = "yahoo";
    }
  }
  if (!quote || _f(quote, "price") <= 0) {
    const sq = await fetchStooqPrice(ticker);
    if (sq) { quote = { ...(quote ?? {}), price: sq.price }; quoteSource = quoteSource === "fmp" ? "stooq" : `${quoteSource}+stooq`; }
  }
  if (!quote) { console.error(`analyzeOne: sin quote de ninguna fuente [${ticker}]`); return null; }
  const price  = _f(quote, "price");
  if (price <= 0) return null;
  // El filtro de marketCap solo aplica si tenemos el dato — Stooq y Yahoo (v8/chart)
  // no lo dan, y no queremos descartar un ticker válido solo porque la fuente de
  // respaldo es más simple. El filtro de volumen sí aplica a ambos, ya que Yahoo
  // v8/chart sí trae regularMarketVolume.
  if (quoteSource === "fmp") {
    if (_f(quote, "marketCap") < 500_000_000) return null;
  }
  if (quoteSource === "fmp" || quoteSource === "yahoo") {
    if (_f(quote, "volume") < 100_000) return null;
  }

  // 2. Ratios + Metrics + Income + Profile en paralelo (FMP)
  const [ratios, metrics, incomeList, profile] = await Promise.all([
    fmp("ratios-ttm",      { symbol: ticker }),
    fmp("key-metrics-ttm", { symbol: ticker }),
    fmpList("income-statement", { symbol: ticker, limit: "5" }),
    fmp("profile",         { symbol: ticker }),
  ]);

  const epsList      = incomeList.map(d => parseFloat(String(d.epsdiluted ?? 0)) || 0);
  const yearsPositive = epsList.filter(e => e > 0).length;

  // Si FMP no dio ni ratios ni metrics, usamos Yahoo como respaldo de fundamentales
  let fundSource = "fmp";
  let yfFund: FallbackFundamentals | null = null;
  if (!ratios && !metrics) {
    yfFund = await fetchYahooFundamentals(ticker);
    if (yfFund) fundSource = "yahoo";
  }

  const roic  = yfFund ? yfFund.roic  : _f(metrics, "roicTTM")                     * 100;
  const pe    = yfFund ? yfFund.pe    : _f(ratios,  "priceEarningsRatioTTM");
  const pb    = yfFund ? yfFund.pb    : _f(ratios,  "priceToBookRatioTTM");
  const pfcf  = _f(ratios,  "priceToFreeCashFlowsRatioTTM"); // sin equivalente directo gratis en Yahoo
  const peg   = yfFund ? yfFund.peg   : _f(ratios,  "priceEarningsToGrowthRatioTTM");
  const gm    = yfFund ? yfFund.gm    : _f(ratios,  "grossProfitMarginTTM")         * 100;
  const de    = yfFund ? yfFund.de    : _f(ratios,  "debtEquityRatioTTM");
  const nm    = yfFund ? yfFund.nm    : _f(ratios,  "netProfitMarginTTM")           * 100;
  const bvps  = yfFund ? yfFund.bvps  : _f(metrics, "bookValuePerShareTTM");
  const shares = yfFund ? yfFund.shares : _f(metrics, "numberOfSharesOutstandingTTM");

  const criteria: Record<string, { label: string; display: string; target: string; pass: number }> = {
    roic:         { label: "ROIC",         display: `${roic.toFixed(1)}%`,  target: `> ${CRITERIA.roic_min}%`,         pass: roic >= CRITERIA.roic_min ? 1 : 0 },
    pe:           { label: "P/E",          display: `${pe.toFixed(1)}`,     target: `< ${CRITERIA.pe_max}`,            pass: pe > 0 && pe < CRITERIA.pe_max ? 1 : 0 },
    pb:           { label: "P/B",          display: `${pb.toFixed(1)}`,     target: `< ${CRITERIA.pb_max}`,            pass: pb > 0 && pb < CRITERIA.pb_max ? 1 : 0 },
    pfcf:         { label: "Price/FCF",    display: `${pfcf.toFixed(1)}`,   target: `< ${CRITERIA.price_fcf_max}`,     pass: pfcf > 0 && pfcf < CRITERIA.price_fcf_max ? 1 : 0 },
    peg:          { label: "PEG",          display: `${peg.toFixed(1)}`,    target: `< ${CRITERIA.peg_max}`,           pass: peg > 0 && peg < CRITERIA.peg_max ? 1 : 0 },
    gross_margin: { label: "Gross Margin", display: `${gm.toFixed(1)}%`,    target: `> ${CRITERIA.gross_margin_min}%`, pass: gm >= CRITERIA.gross_margin_min ? 1 : 0 },
    debt_equity:  { label: "Debt/Equity",  display: `${de.toFixed(2)}`,     target: `< ${CRITERIA.debt_equity_max}`,   pass: de >= 0 && de < CRITERIA.debt_equity_max ? 1 : 0 },
    net_margin:   { label: "Net Margin",   display: `${nm.toFixed(1)}%`,    target: `> ${CRITERIA.net_margin_min}%`,   pass: nm >= CRITERIA.net_margin_min ? 1 : 0 },
    eps_growth:   { label: "EPS Growth",   display: `${yearsPositive} años`,target: `>= ${CRITERIA.eps_growth_years}`, pass: yearsPositive >= CRITERIA.eps_growth_years ? 1 : 0 },
  };
  const passed = Object.values(criteria).reduce((s, c) => s + c.pass, 0);
  const total  = Object.keys(criteria).length;
  const score  = Math.round((passed / total) * 100);

  // Valuation (if score >= 40)
  let valuation = null;
  if (score >= 40) {
    const cfData = await fmp("cash-flow-statement", { symbol: ticker, limit: "1" });
    const fcf    = _f(cfData, "freeCashFlow");
    const eps_val = pe > 0 ? price / pe : 0;
    const dcfVal  = dcfCalc(fcf, shares);
    const grahamVal = grahamCalc(eps_val, bvps);
    const peVal   = eps_val > 0 ? eps_val * 15 : null;
    const vals    = [dcfVal, grahamVal, peVal].filter(v => v != null && v > 0) as number[];
    const avg     = vals.length ? vals.reduce((a,b) => a+b, 0) / vals.length : null;
    if (avg) {
      valuation = {
        price:     Math.round(price * 100) / 100,
        intrinsic: Math.round(avg * 100) / 100,
        upside:    Math.round(((avg - price) / price) * 1000) / 10,
        zone:      zoneCalc(price, avg),
        levels: {
          strong_buy: Math.round(avg * 0.70 * 100) / 100,
          buy:        Math.round(avg * 0.85 * 100) / 100,
          fair:       Math.round(avg * 100) / 100,
          expensive:  Math.round(avg * 1.20 * 100) / 100,
          bubble:     Math.round(avg * 1.40 * 100) / 100,
        },
      };
    }
  }

  // Technical + Polygon (only if score >= 60 — same as Python)
  let technical = null;
  let polygon_data = null;
  if (score >= 60) {
    [technical, polygon_data] = await Promise.all([
      runTechnical(ticker),
      getPolygonScore(ticker),
    ]);
  }

  return {
    ticker,
    name:        (profile as Record<string,unknown>)?.companyName as string ?? (quote.name as string ?? ticker),
    price,
    market_cap:  _f(quote, "marketCap"),
    sector:      (profile as Record<string,unknown>)?.sector as string ?? "N/A",
    country:     (profile as Record<string,unknown>)?.country as string ?? "N/A",
    score, passed, total, criteria, valuation,
    technical, polygon: polygon_data,
    raw: { roic, pe, pb, pfcf, peg, gm, de, nm, eps_yrs: yearsPositive, quote_source: quoteSource, fundamentals_source: fundSource },
  };
}

// ─── State helpers ────────────────────────────────────────────────────────────
async function loadState() {
  const db = getPool(); if (!db) return null;
  try {
    const r = await db.query("SELECT * FROM buffett_state WHERE id=1");
    return r.rows[0] ?? null;
  } catch { return null; }
}
async function saveState(s: Record<string,unknown>) {
  const db = getPool(); if (!db) return;
  await db.query(
    `UPDATE buffett_state SET last_index=$1,last_run=$2,calls_today=$3,
     total_analyzed=$4,total_passed=$5,cycle=$6,universe_size=$7,updated_at=NOW()
     WHERE id=1`,
    [s.last_index, s.last_run, s.calls_today, s.total_analyzed,
     s.total_passed, s.cycle, s.universe_size]
  );
}
async function saveResult(data: Record<string,unknown>) {
  const db = getPool(); if (!db) return;
  // Ensure technical + polygon columns exist
  await db.query(`
    ALTER TABLE buffett_results
      ADD COLUMN IF NOT EXISTS technical  JSONB,
      ADD COLUMN IF NOT EXISTS polygon    JSONB
  `).catch(() => {});
  await db.query(
    `INSERT INTO buffett_results
     (ticker,name,price,market_cap,sector,country,score,passed_count,total_count,
      criteria,valuation,raw,technical,polygon,analyzed_at,updated_at)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,CURRENT_DATE,NOW())
     ON CONFLICT(ticker) DO UPDATE SET
       name=$2,price=$3,market_cap=$4,sector=$5,country=$6,score=$7,
       passed_count=$8,total_count=$9,criteria=$10,valuation=$11,raw=$12,
       technical=$13,polygon=$14,analyzed_at=CURRENT_DATE,updated_at=NOW()`,
    [data.ticker, data.name, data.price, data.market_cap, data.sector, data.country,
     data.score, data.passed, data.total,
     JSON.stringify(data.criteria), JSON.stringify(data.valuation),
     JSON.stringify(data.raw), JSON.stringify(data.technical), JSON.stringify(data.polygon)]
  );
}

// ─── Running flag ─────────────────────────────────────────────────────────────
let scanning = false;

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/buffett/status
router.get("/buffett/status", async (_req: Request, res: Response) => {
  const db = getPool();
  if (!db) { res.json({ ok: false, error: "DATABASE_PUBLIC_URL not set" }); return; }
  try {
    const state    = await loadState();
    const statsR   = await db.query("SELECT COUNT(*) as n, AVG(score) as avg_score FROM buffett_results");
    const topR     = await db.query(
      "SELECT ticker,name,score,sector,valuation FROM buffett_results WHERE score>=60 ORDER BY score DESC LIMIT 10");
    res.json({
      ok: true, scanning, universe_total: UNIVERSE.length,
      state, stats: statsR.rows[0], top_today: topR.rows,
      companies_today: Math.floor((MAX_CALLS - (state?.calls_today ?? 0)) / CALLS_PER),
    });
  } catch (e) { res.status(500).json({ ok: false, error: String(e) }); }
});

// GET /api/buffett/results
router.get("/buffett/results", async (req: Request, res: Response) => {
  const db = getPool();
  if (!db) { res.json({ ok: false, error: "DATABASE_PUBLIC_URL not set" }); return; }
  try {
    const minScore   = parseInt(String(req.query.min_score ?? 0)) || 0;
    const limit      = Math.min(parseInt(String(req.query.limit ?? 200)) || 200, 500);
    const sector     = req.query.sector as string | undefined;
    const zone_f     = req.query.zone   as string | undefined;
    let   where      = "WHERE score >= $1";
    const params: unknown[] = [minScore];
    if (sector) { where += ` AND sector = $${params.length+1}`;                    params.push(sector); }
    if (zone_f) { where += ` AND valuation->>'zone' ILIKE $${params.length+1}`;    params.push(`%${zone_f}%`); }
    const r = await db.query(
      `SELECT ticker,name,price,market_cap,sector,country,score,passed_count,
              total_count,criteria,valuation,raw,technical,polygon,analyzed_at
       FROM buffett_results ${where} ORDER BY score DESC LIMIT ${limit}`, params);
    res.json({ ok: true, count: r.rows.length, results: r.rows });
  } catch (e) { res.status(500).json({ ok: false, error: String(e) }); }
});

// POST /api/buffett/scan
// ── Lógica del scan, reusable desde el endpoint manual y el auto-scheduler ──
async function runScanCycle(): Promise<void> {
  if (scanning) return;
  if (!(process.env.DATABASE_PUBLIC_URL ?? process.env.BUFFETT_DATABASE_URL ?? process.env.DATABASE_URL)) {
    console.error("Buffett auto-scan: saltado — falta DATABASE_URL/DATABASE_PUBLIC_URL/BUFFETT_DATABASE_URL");
    return;
  }
  if (!process.env.FMP_API_KEY) {
    console.error("Buffett auto-scan: saltado — falta FMP_API_KEY");
    return;
  }

  scanning = true;
  try {
    let state: Record<string,unknown> = await loadState() ?? {
      last_index: 0, last_run: null, calls_today: 0,
      total_analyzed: 0, total_passed: 0, cycle: 1, universe_size: UNIVERSE.length,
    };
    const today = new Date().toISOString().slice(0, 10);
    if (state.last_run !== today) { state.calls_today = 0; state.last_run = today; }
    state.universe_size = UNIVERSE.length;

    const maxToday = Math.floor((MAX_CALLS - Number(state.calls_today ?? 0)) / CALLS_PER);
    let analyzed   = 0;

    while (analyzed < maxToday && Number(state.calls_today) < MAX_CALLS) {
      const idx    = Number(state.last_index ?? 0) % UNIVERSE.length;
      const ticker = UNIVERSE[idx];
      try {
        const result = await analyzeOne(ticker);
        state.calls_today     = Number(state.calls_today) + CALLS_PER;
        state.total_analyzed  = Number(state.total_analyzed ?? 0) + 1;
        analyzed++;
        if (result) {
          await saveResult(result as Record<string,unknown>);
          if (result.score >= 60) state.total_passed = Number(state.total_passed ?? 0) + 1;
        }
      } catch { /* skip ticker */ }
      state.last_index = (idx + 1) % UNIVERSE.length;
      if (Number(state.last_index) === 0) state.cycle = Number(state.cycle ?? 1) + 1;
      await saveState(state);
      await new Promise(r => setTimeout(r, 400));
    }
  } catch (e) { console.error("Buffett scan error:", e); }
  finally     { scanning = false; }
}

// ── Auto-scheduler — corre solo, una vez al día, sin que nadie tenga que
// entrar a apretar el botón. Como Railway mantiene el proceso corriendo
// 24/7, un setInterval alcanza (no hace falta un cron externo).
const AUTO_SCAN_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h
setTimeout(() => {
  runScanCycle().catch(e => console.error("Buffett auto-scan (inicial) error:", e));
  setInterval(() => {
    runScanCycle().catch(e => console.error("Buffett auto-scan error:", e));
  }, AUTO_SCAN_INTERVAL_MS);
}, 60_000); // espera 60s tras arrancar el server antes del primer auto-scan

router.post("/buffett/scan", async (req: Request, res: Response) => {
  if (scanning)                     { res.json({ ok: false, error: "Scan ya en curso" }); return; }
  if (!(process.env.DATABASE_PUBLIC_URL ?? process.env.BUFFETT_DATABASE_URL ?? process.env.DATABASE_URL)) { res.json({ ok: false, error: "DATABASE_PUBLIC_URL no configurado" }); return; }
  if (!process.env.FMP_API_KEY)    { res.json({ ok: false, error: "FMP_API_KEY no configurado" }); return; }

  res.json({ ok: true, message: "Scan iniciado en background", universe: UNIVERSE.length });
  runScanCycle().catch(e => console.error("Buffett scan (manual) error:", e));
});

// POST /api/buffett/snapshot — guardar snapshot actual
router.post("/buffett/snapshot", async (req: Request, res: Response) => {
  const db = getPool();
  if (!db) { res.status(503).json({ ok: false, error: "DB no disponible" }); return; }
  try {
    await ensureTables(db);
    const label = String((req.body as Record<string, unknown>)?.label ?? new Date().toISOString().slice(0, 10));
    const rows  = await db.query("SELECT * FROM buffett_results ORDER BY score DESC");
    if (!rows.rows.length) { res.status(400).json({ ok: false, error: "Sin datos para guardar snapshot" }); return; }
    const result = await db.query(
      "INSERT INTO buffett_snapshots (label, results) VALUES ($1, $2) RETURNING id, label, saved_at",
      [label, JSON.stringify(rows.rows)]
    );
    res.json({ ok: true, snapshot: result.rows[0], count: rows.rows.length });
  } catch (e) { res.status(500).json({ ok: false, error: String(e) }); }
});

// GET /api/buffett/snapshots — lista de snapshots
router.get("/buffett/snapshots", async (_req: Request, res: Response) => {
  const db = getPool();
  if (!db) { res.json({ ok: true, snapshots: [] }); return; }
  try {
    await ensureTables(db);
    const r = await db.query(
      "SELECT id, label, saved_at, jsonb_array_length(results) as count FROM buffett_snapshots ORDER BY saved_at DESC LIMIT 20"
    );
    res.json({ ok: true, snapshots: r.rows });
  } catch (e) { res.status(500).json({ ok: false, error: String(e) }); }
});

// GET /api/buffett/snapshot/:id — detalle de un snapshot
router.get("/buffett/snapshot/:id", async (req: Request, res: Response) => {
  const db = getPool();
  if (!db) { res.status(503).json({ ok: false, error: "DB no disponible" }); return; }
  try {
    await ensureTables(db);
    const id = parseInt(String(req.params["id"] ?? "0"), 10);
    const r  = await db.query("SELECT id, label, saved_at, results FROM buffett_snapshots WHERE id=$1", [id]);
    if (!r.rows.length) { res.status(404).json({ ok: false, error: "Snapshot no encontrado" }); return; }
    res.json({ ok: true, snapshot: r.rows[0] });
  } catch (e) { res.status(500).json({ ok: false, error: String(e) }); }
});

// GET /api/buffett/ticker/:ticker
router.get("/buffett/ticker/:ticker", async (req: Request, res: Response) => {
  const db     = getPool();
  const ticker = String(req.params["ticker"] ?? "").toUpperCase();
  if (db) {
    try {
      const cached = await db.query("SELECT * FROM buffett_results WHERE ticker=$1", [ticker]);
      if (cached.rows.length) { res.json({ ok: true, cached: true, result: cached.rows[0] }); return; }
    } catch {}
  }
  if (!process.env.FMP_API_KEY) { res.json({ ok: false, error: "FMP_API_KEY no configurado" }); return; }
  try {
    const result = await analyzeOne(ticker);
    if (!result) { res.status(404).json({ ok: false, error: `Sin datos para ${ticker}` }); return; }
    if (db) await saveResult(result as Record<string,unknown>);
    res.json({ ok: true, cached: false, result });
  } catch (e) { res.status(500).json({ ok: false, error: String(e) }); }
});

export default router;
