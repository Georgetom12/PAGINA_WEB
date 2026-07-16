/**
 * MARKET PULSE — motor de detección de movimientos anómalos para ACCIONES y
 * FOREX, hermano del `pump-live.ts` (cripto) pero adaptado a mercados spot:
 * no hay OI/funding/CVD de futuros perpetuos aquí, así que la validación usa
 * la señal equivalente real para estos mercados — ¿el movimiento es de ESTA
 * acción/par específicamente, o es todo el mercado moviéndose junto
 * (comparado contra SPY para acciones, DXY para forex)?
 *
 * Corre embebido dentro del mismo proceso de api-server — igual que pump-live.
 */
import { Router, type Request, type Response } from "express";

const router = Router();

const YF_HEADERS = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" };

// ─── Watchlist ────────────────────────────────────────────────────────────
const STOCK_SYMBOLS = [
  "AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA","BRK-B","JPM","V",
  "WMT","XOM","JNJ","UNH","PG","MA","LLY","COST","HD","NFLX",
];
const FOREX_SYMBOLS = [
  "EURUSD=X","GBPUSD=X","USDJPY=X","USDCHF=X","AUDUSD=X","USDCAD=X","NZDUSD=X",
  "EURGBP=X","EURJPY=X","GBPJPY=X",
];
const BENCHMARK_STOCK = "SPY";
const BENCHMARK_FOREX = "DX-Y.NYB"; // DXY

const SCAN_INTERVAL_MS = 30_000;      // acciones/forex se mueven más lento que cripto — no hace falta cada 5s
const BASELINE_SAMPLES = 20;
const MIN_BASELINE_SAMPLES = 8;
const STOCK_VOL_SPIKE_MULT = 3.0;
const STOCK_PRICE_MOVE_MIN = 0.5;     // %
const FOREX_PRICE_MOVE_MIN = 0.15;    // % — forex se mueve mucho menos que acciones
const CONFIRMATION_DELAY_MS = 90_000; // más largo que cripto — spot es más lento
const LINGER_MS = 5 * 60_000;
const SYMBOL_COOLDOWN_MS = 15 * 60_000;
const IDIOSYNCRATIC_MIN_RATIO = 1.8;  // el símbolo debe moverse >=1.8x más que su benchmark para ser "real"

type AssetClass = "stock" | "forex";
type Stage = "early" | "confirmed";

interface Row {
  symbol: string; assetClass: AssetClass; stage: Stage;
  price: number; priceEarly: number; pctMoveSinceEarly: number;
  volMultiplier: number; benchmarkMovePct: number; idiosyncraticRatio: number;
  score: number; verdict: string; progressPct: number;
  triggeredAt: number; confirmAt: number; lingerUntil: number;
}

interface SymState {
  samples: Array<[number, number]>;  // [ts, price]
  volSamples: Array<[number, number]>; // [ts, volume] (solo acciones)
  lastPrice: number | null;
  lastVolume: number | null;
}
const state: Record<string, SymState> = {};
function getState(symbol: string): SymState {
  if (!state[symbol]) state[symbol] = { samples: [], volSamples: [], lastPrice: null, lastVolume: null };
  return state[symbol];
}

const rows = new Map<string, Row>();
const cooldown = new Map<string, number>();
const pending = new Map<string, { confirmAt: number; earlyPrice: number; assetClass: AssetClass }>();

async function fetchYahoo1m(symbol: string): Promise<{ price: number; volume: number | null } | null> {
  const path = `v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
  for (const host of ["query2.finance.yahoo.com", "query1.finance.yahoo.com"]) {
    try {
      const r = await fetch(`https://${host}/${path}`, { headers: YF_HEADERS, signal: AbortSignal.timeout(8000) });
      if (!r.ok) continue;
      const d = await r.json() as {
        chart?: { result?: [{ meta?: { regularMarketPrice?: number; regularMarketVolume?: number } }] };
      };
      const meta = d?.chart?.result?.[0]?.meta;
      if (!meta?.regularMarketPrice) continue;
      return { price: meta.regularMarketPrice, volume: meta.regularMarketVolume ?? null };
    } catch { /* intenta el siguiente host */ }
  }
  return null;
}

function ingest(st: SymState, price: number, volume: number | null) {
  const now = Date.now();
  st.samples.push([now, price]);
  if (st.samples.length > BASELINE_SAMPLES + 2) st.samples.shift();
  st.lastPrice = price;
  if (volume !== null) {
    st.volSamples.push([now, volume]);
    if (st.volSamples.length > BASELINE_SAMPLES + 2) st.volSamples.shift();
    st.lastVolume = volume;
  }
}

function baselineVolumeDelta(st: SymState): number {
  // Volumen ACUMULADO reportado por Yahoo sube monotónicamente en el día — nos
  // interesa el delta entre samples recientes, no el nivel absoluto.
  if (st.volSamples.length < 2) return 0;
  const [, vNow] = st.volSamples[st.volSamples.length - 1];
  const [, vPrev] = st.volSamples[st.volSamples.length - 2];
  return Math.max(0, vNow - vPrev);
}
function avgVolumeDelta(st: SymState): number {
  if (st.volSamples.length < BASELINE_SAMPLES) return 0;
  const deltas: number[] = [];
  for (let i = 1; i < st.volSamples.length - 1; i++) {
    deltas.push(Math.max(0, st.volSamples[i][1] - st.volSamples[i - 1][1]));
  }
  if (!deltas.length) return 0;
  return deltas.reduce((a, b) => a + b, 0) / deltas.length;
}
function priceMovePct(st: SymState): number {
  if (st.samples.length < 2) return 0;
  const [, pNow] = st.samples[st.samples.length - 1];
  const [, pPrev] = st.samples[0];
  if (!pPrev) return 0;
  return ((pNow - pPrev) / pPrev) * 100;
}

function checkTrigger(symbol: string, assetClass: AssetClass): boolean {
  const st = getState(symbol);
  if (st.samples.length < MIN_BASELINE_SAMPLES) return false;
  const move = priceMovePct(st);
  const minMove = assetClass === "stock" ? STOCK_PRICE_MOVE_MIN : FOREX_PRICE_MOVE_MIN;
  if (Math.abs(move) < minMove) return false;

  if (assetClass === "stock") {
    const delta = baselineVolumeDelta(st);
    const avg = avgVolumeDelta(st);
    if (avg <= 0 || delta < avg * STOCK_VOL_SPIKE_MULT) return false;
  }
  return true;
}

const watchlist: Array<{ symbol: string; assetClass: AssetClass }> = [
  ...STOCK_SYMBOLS.map(symbol => ({ symbol, assetClass: "stock" as const })),
  ...FOREX_SYMBOLS.map(symbol => ({ symbol, assetClass: "forex" as const })),
];

async function scanTick() {
  // Benchmarks primero (SPY y DXY) para tener con qué comparar
  const spy = await fetchYahoo1m(BENCHMARK_STOCK);
  const dxy = await fetchYahoo1m(BENCHMARK_FOREX);
  if (spy) ingest(getState(BENCHMARK_STOCK), spy.price, spy.volume);
  if (dxy) ingest(getState(BENCHMARK_FOREX), dxy.price, dxy.volume);
  const spyMove = priceMovePct(getState(BENCHMARK_STOCK));
  const dxyMove = priceMovePct(getState(BENCHMARK_FOREX));

  for (const { symbol, assetClass } of watchlist) {
    const q = await fetchYahoo1m(symbol);
    if (!q) continue;
    const st = getState(symbol);
    ingest(st, q.price, q.volume);

    if (pending.has(symbol)) continue;
    const cd = cooldown.get(symbol) ?? 0;
    if (Date.now() - cd < SYMBOL_COOLDOWN_MS) continue;
    if (!checkTrigger(symbol, assetClass)) continue;

    cooldown.set(symbol, Date.now());
    pending.set(symbol, { confirmAt: Date.now() + CONFIRMATION_DELAY_MS, earlyPrice: q.price, assetClass });
    rows.set(symbol, {
      symbol, assetClass, stage: "early", price: q.price, priceEarly: q.price, pctMoveSinceEarly: 0,
      volMultiplier: assetClass === "stock" ? (avgVolumeDelta(st) > 0 ? baselineVolumeDelta(st) / avgVolumeDelta(st) : 0) : 0,
      benchmarkMovePct: assetClass === "stock" ? spyMove : dxyMove, idiosyncraticRatio: 0,
      score: 0, verdict: "🌱 arrancando...", progressPct: 5,
      triggeredAt: Date.now(), confirmAt: Date.now() + CONFIRMATION_DELAY_MS, lingerUntil: 0,
    });
  }

  // Progreso de las pendientes
  for (const [symbol, p] of pending.entries()) {
    const row = rows.get(symbol);
    const st = getState(symbol);
    if (!row || !st.lastPrice) continue;
    const elapsed = Date.now() - (p.confirmAt - CONFIRMATION_DELAY_MS);
    row.progressPct = Math.min(95, 5 + (elapsed / CONFIRMATION_DELAY_MS) * 90);
    row.price = st.lastPrice;
    row.pctMoveSinceEarly = ((st.lastPrice - row.priceEarly) / row.priceEarly) * 100;
  }

  // Confirmaciones
  const now = Date.now();
  for (const [symbol, p] of Array.from(pending.entries())) {
    if (now < p.confirmAt) continue;
    pending.delete(symbol);
    const st = getState(symbol);
    const row = rows.get(symbol);
    if (!row || !st.lastPrice) { rows.delete(symbol); continue; }

    const move = ((st.lastPrice - p.earlyPrice) / p.earlyPrice) * 100;
    const benchmarkMove = p.assetClass === "stock" ? spyMove : dxyMove;
    const idiosyncraticRatio = Math.abs(benchmarkMove) > 0.001
      ? Math.abs(move) / Math.abs(benchmarkMove)
      : (Math.abs(move) > 0 ? 99 : 0);

    let score = 0;
    // ¿Sigue moviéndose en la misma dirección que arrancó?
    if (move * (row.pctMoveSinceEarly >= 0 ? 1 : -1) >= 0 && Math.abs(move) >= Math.abs(row.pctMoveSinceEarly) * 0.5) score += 1; else score -= 1;
    // ¿Es idiosincrático (la acción/par sola) o solo sigue al mercado?
    if (idiosyncraticRatio >= IDIOSYNCRATIC_MIN_RATIO) score += 1; else score -= 1;

    const directionUp = move >= 0;
    const verdict = score >= 1
      ? `🟢 REAL — ${directionUp ? "movimiento propio alcista" : "movimiento propio bajista"}`
      : idiosyncraticRatio < IDIOSYNCRATIC_MIN_RATIO
        ? "🟡 SOLO SIGUE AL MERCADO (no es la acción, es todo el índice)"
        : "🔴 TRAP — revirtió";

    rows.set(symbol, {
      ...row, stage: "confirmed", price: st.lastPrice, pctMoveSinceEarly: move,
      benchmarkMovePct: benchmarkMove, idiosyncraticRatio, score, verdict, progressPct: 100,
      confirmAt: now, lingerUntil: now + LINGER_MS,
    });
  }

  // Apaga filas viejas
  for (const [symbol, row] of Array.from(rows.entries())) {
    if (row.stage === "confirmed" && now > row.lingerUntil) rows.delete(symbol);
  }
}

let running = false;
let started = false;
export function startMarketPulseLoop() {
  if (started) return;
  started = true;
  setTimeout(() => {
    setInterval(async () => {
      if (running) return;
      running = true;
      try { await scanTick(); } catch (e) { console.error("market-pulse loop error:", e); }
      finally { running = false; }
    }, SCAN_INTERVAL_MS);
  }, 5000);
  console.log("[market-pulse] motor de acciones/forex iniciado (embebido en api-server)");
}

router.get("/market-pulse/rows", (_req: Request, res: Response) => {
  const list = Array.from(rows.values()).sort((a, b) => b.triggeredAt - a.triggeredAt);
  res.json({ ok: true, rows: list, ts: Date.now() });
});

startMarketPulseLoop();

export default router;
