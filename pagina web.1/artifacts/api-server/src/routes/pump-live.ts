/**
 * PUMP LIVE — motor de detección de pumps embebido DIRECTO en la página.
 *
 * A diferencia del bot de Telegram standalone (motor_pump_detector, servicio
 * aparte en Railway), esto corre DENTRO del mismo proceso de api-server,
 * no depende de él, no lo afecta, y expone su estado por REST para que el
 * frontend lo pinte como una "hoja de cálculo" en vivo (GEM HUNTER).
 *
 * Misma lógica que el bot: tier barato (volumen 1m) → trigger temprano →
 * tier profundo (OI + CVD + multi-exchange + funding) → veredicto
 * direccional REAL / BULL TRAP / BEAR TRAP / DUDOSO.
 */
import { Router, type Request, type Response } from "express";

const router = Router();

// ─── Config ───────────────────────────────────────────────────────────────
const WATCHLIST_SIZE = 60;              // más chico que el bot standalone — comparte proceso con el resto del API
const WATCHLIST_REFRESH_MS = 15 * 60_000;
const SCAN_INTERVAL_MS = 5_000;
const BASELINE_WINDOW_MIN = 20;
const MIN_BASELINE_SAMPLES = Number(process.env.PUMP_MIN_BASELINE_SAMPLES ?? 5); // 5 min de calentamiento por default
const VOL_SPIKE_MULTIPLIER = Number(process.env.PUMP_VOL_SPIKE_MULTIPLIER ?? 3.0);
const MAJOR_BASELINE_THRESHOLD = 500_000;
const MAJOR_VOL_SPIKE_MULTIPLIER = Number(process.env.PUMP_MAJOR_VOL_SPIKE_MULTIPLIER ?? 5.0);
const MIN_QUOTE_VOL_1M = 20_000;
const PRICE_MOVE_MIN_PCT = Number(process.env.PUMP_PRICE_MOVE_MIN_PCT ?? 0.4);
const CONFIRMATION_DELAY_MS = 45_000;
const LINGER_MS = 3 * 60_000;           // cuánto se queda la fila visible tras confirmar, antes de apagarse
const SYMBOL_COOLDOWN_MS = 10 * 60_000;
const MULTI_EXCHANGE_MIN_CONFIRM = 2;
const FUNDING_EXTREME_PCT = 0.05;
const OI_DELTA_REAL_PCT = 2.0;
const OI_DELTA_FALSO_PCT = 0.5;

const EXCLUDE_SYMBOLS = new Set(["USDCUSDT", "FDUSDUSDT", "TUSDUSDT", "BUSDUSDT", "DAIUSDT"]);

// ─── Tipos ────────────────────────────────────────────────────────────────
type Stage = "early" | "confirming" | "confirmed" | "off";

interface Row {
  symbol: string;
  stage: Stage;
  originExchange: string;
  price: number;
  priceEarly: number;
  volMultiplier: number;
  score: number;
  verdict: string;
  direction: 1 | -1;
  pctMoveSinceEarly: number;
  progressPct: number;      // 0-100, para la barra visual de "cuánto falta para confirmar"
  signals: { multiExchange: string; oi: string; cvd: string; funding: string };
  triggeredAt: number;
  confirmAt: number;
  lingerUntil: number;
}

interface SymbolState {
  minuteVolumes: Array<[number, number]>;  // [minuteTs, quoteVolume]
  currentMinute: number | null;
  currentVol: number;
  lastCandleOpen: number | null;
  lastCandleClose: number | null;
  lastPrice: number | null;
  tradeWindow: Array<[number, number]>;     // [ts, signedQuoteValue]
  lastIngestedTradeTs: number;
  oiHistory: Array<[number, number]>;
  lastFunding: number | null;
}

function newSymbolState(): SymbolState {
  return {
    minuteVolumes: [], currentMinute: null, currentVol: 0,
    lastCandleOpen: null, lastCandleClose: null, lastPrice: null,
    tradeWindow: [], lastIngestedTradeTs: 0, oiHistory: [], lastFunding: null,
  };
}

// state[exchange][symbol]
const state: Record<string, Record<string, SymbolState>> = { binance: {}, bybit: {}, okx: {} };
function getState(exchange: string, symbol: string): SymbolState {
  if (!state[exchange][symbol]) state[exchange][symbol] = newSymbolState();
  return state[exchange][symbol];
}

const rows = new Map<string, Row>();
const HISTORY_MAX = 20;
const history: Row[] = []; // últimas confirmaciones — en memoria, sin DB, peso prácticamente nulo
const cooldown = new Map<string, number>();
const pending = new Map<string, { confirmAt: number; earlyPrice: number; earlyTs: number; confirmedExchanges: Set<string> }>();

let watchlist: string[] = [];
let lastWatchlistRefresh = 0;
let loopStarted = false;

// ─── Helpers HTTP ─────────────────────────────────────────────────────────
async function getJson(url: string, timeoutMs = 8000): Promise<unknown | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!r.ok) { console.error(`[pump-live] HTTP ${r.status} en ${url}`); return null; }
    return await r.json();
  } catch (e) { console.error(`[pump-live] error de red en ${url}:`, e instanceof Error ? e.message : e); return null; }
}

// ─── Exchanges (Binance primero, Bybit/OKX de respaldo — igual que el bot) ─
async function topSymbolsBinance(limit: number): Promise<string[]> {
  const d = await getJson("https://fapi.binance.com/fapi/v1/ticker/24hr") as Array<Record<string, unknown>> | null;
  if (!d) return [];
  return d
    .filter(x => String(x.symbol).endsWith("USDT") && !EXCLUDE_SYMBOLS.has(String(x.symbol)))
    .sort((a, b) => parseFloat(String(b.quoteVolume)) - parseFloat(String(a.quoteVolume)))
    .slice(0, limit)
    .map(x => String(x.symbol));
}
async function topSymbolsBybit(limit: number): Promise<string[]> {
  const d = await getJson("https://api.bybit.com/v5/market/tickers?category=linear") as
    { result?: { list?: Array<Record<string, unknown>> } } | null;
  const list = d?.result?.list ?? [];
  return list
    .filter(x => String(x.symbol).endsWith("USDT") && !EXCLUDE_SYMBOLS.has(String(x.symbol)))
    .sort((a, b) => parseFloat(String(b.turnover24h)) - parseFloat(String(a.turnover24h)))
    .slice(0, limit)
    .map(x => String(x.symbol));
}
async function topSymbolsOkx(limit: number): Promise<string[]> {
  const d = await getJson("https://www.okx.com/api/v5/market/tickers?instType=SWAP") as
    { data?: Array<Record<string, unknown>> } | null;
  const list = (d?.data ?? []).filter(x => String(x.instId).endsWith("-USDT-SWAP"));
  const sorted = list
    .sort((a, b) => parseFloat(String(b.volCcy24h)) - parseFloat(String(a.volCcy24h)))
    .slice(0, limit);
  return sorted
    .map(x => String(x.instId).replace("-USDT-SWAP", "USDT").replace("-", ""))
    .filter(sym => !EXCLUDE_SYMBOLS.has(sym));
}

async function klineBinance(symbol: string) {
  const d = await getJson(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1m&limit=2`) as unknown[] | null;
  if (!d || !d.length) return null;
  const k = d[d.length - 1] as unknown[];
  return { openTime: Number(k[0]), quoteVolume: parseFloat(String(k[7])), open: parseFloat(String(k[1])), close: parseFloat(String(k[4])) };
}
async function klineBybit(symbol: string) {
  const d = await getJson(`https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=1&limit=2`) as
    { result?: { list?: unknown[][] } } | null;
  const rows2 = d?.result?.list;
  if (!rows2 || !rows2.length) return null;
  const k = rows2[0];
  return { openTime: Number(k[0]), quoteVolume: parseFloat(String(k[6])), open: parseFloat(String(k[1])), close: parseFloat(String(k[4])) };
}
async function klineOkx(symbol: string) {
  const inst = symbol.replace("USDT", "") + "-USDT-SWAP";
  const d = await getJson(`https://www.okx.com/api/v5/market/candles?instId=${inst}&bar=1m&limit=2`) as
    { data?: unknown[][] } | null;
  const rows2 = d?.data;
  if (!rows2 || !rows2.length) return null;
  const k = rows2[0];
  return { openTime: Number(k[0]), quoteVolume: parseFloat(String(k[7])), open: parseFloat(String(k[1])), close: parseFloat(String(k[4])) };
}
async function getKline(exchange: string, symbol: string) {
  if (exchange === "binance") return klineBinance(symbol);
  if (exchange === "bybit") return klineBybit(symbol);
  return klineOkx(symbol);
}

async function tradesBinance(symbol: string) {
  const d = await getJson(`https://fapi.binance.com/fapi/v1/trades?symbol=${symbol}&limit=200`) as
    Array<Record<string, unknown>> | null;
  if (!d) return [];
  return d.map(t => ({ price: parseFloat(String(t.price)), qty: parseFloat(String(t.qty)), isSell: Boolean(t.isBuyerMaker), ts: Number(t.time) }));
}
async function tradesBybit(symbol: string) {
  const d = await getJson(`https://api.bybit.com/v5/market/recent-trade?category=linear&symbol=${symbol}&limit=200`) as
    { result?: { list?: Array<Record<string, unknown>> } } | null;
  const list = d?.result?.list ?? [];
  return list.map(t => ({ price: parseFloat(String(t.price)), qty: parseFloat(String(t.size)), isSell: t.side === "Sell", ts: Number(t.time) }));
}
async function tradesOkx(symbol: string) {
  const inst = symbol.replace("USDT", "") + "-USDT-SWAP";
  const d = await getJson(`https://www.okx.com/api/v5/market/trades?instId=${inst}&limit=200`) as
    { data?: Array<Record<string, unknown>> } | null;
  const list = d?.data ?? [];
  return list.map(t => ({ price: parseFloat(String(t.px)), qty: parseFloat(String(t.sz)), isSell: t.side === "sell", ts: Number(t.ts) }));
}
async function getTrades(exchange: string, symbol: string) {
  if (exchange === "binance") return tradesBinance(symbol);
  if (exchange === "bybit") return tradesBybit(symbol);
  return tradesOkx(symbol);
}

async function oiBinance(symbol: string) {
  const d = await getJson(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`) as { openInterest?: string } | null;
  return d?.openInterest ? parseFloat(d.openInterest) : null;
}
async function oiBybit(symbol: string) {
  const d = await getJson(`https://api.bybit.com/v5/market/open-interest?category=linear&symbol=${symbol}&intervalTime=5min&limit=1`) as
    { result?: { list?: Array<{ openInterest?: string }> } } | null;
  const v = d?.result?.list?.[0]?.openInterest;
  return v ? parseFloat(v) : null;
}
async function oiOkx(symbol: string) {
  const inst = symbol.replace("USDT", "") + "-USDT-SWAP";
  const d = await getJson(`https://www.okx.com/api/v5/public/open-interest?instId=${inst}`) as
    { data?: Array<{ oi?: string }> } | null;
  const v = d?.data?.[0]?.oi;
  return v ? parseFloat(v) : null;
}
async function getOi(exchange: string, symbol: string) {
  if (exchange === "binance") return oiBinance(symbol);
  if (exchange === "bybit") return oiBybit(symbol);
  return oiOkx(symbol);
}

async function fundingBinance(symbol: string) {
  const d = await getJson(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`) as { lastFundingRate?: string } | null;
  return d?.lastFundingRate ? parseFloat(d.lastFundingRate) : null;
}
async function fundingBybit(symbol: string) {
  const d = await getJson(`https://api.bybit.com/v5/market/tickers?category=linear&symbol=${symbol}`) as
    { result?: { list?: Array<{ fundingRate?: string }> } } | null;
  const v = d?.result?.list?.[0]?.fundingRate;
  return v ? parseFloat(v) : null;
}
async function fundingOkx(symbol: string) {
  const inst = symbol.replace("USDT", "") + "-USDT-SWAP";
  const d = await getJson(`https://www.okx.com/api/v5/public/funding-rate?instId=${inst}`) as
    { data?: Array<{ fundingRate?: string }> } | null;
  const v = d?.data?.[0]?.fundingRate;
  return v ? parseFloat(v) : null;
}
async function getFunding(exchange: string, symbol: string) {
  if (exchange === "binance") return fundingBinance(symbol);
  if (exchange === "bybit") return fundingBybit(symbol);
  return fundingOkx(symbol);
}

// ─── Estado por símbolo — ingest ──────────────────────────────────────────
function ingestMinuteVolume(st: SymbolState, openTimeMs: number, quoteVolume: number, open: number, close: number) {
  const minuteTs = Math.floor(openTimeMs / 1000 / 60);
  if (st.minuteVolumes.length && st.minuteVolumes[st.minuteVolumes.length - 1][0] === minuteTs) {
    st.minuteVolumes[st.minuteVolumes.length - 1] = [minuteTs, quoteVolume];
  } else {
    st.minuteVolumes.push([minuteTs, quoteVolume]);
    if (st.minuteVolumes.length > BASELINE_WINDOW_MIN + 2) st.minuteVolumes.shift();
  }
  st.currentVol = quoteVolume;
  st.currentMinute = minuteTs;
  st.lastCandleOpen = open;
  st.lastCandleClose = close;
  st.lastPrice = close;
}
function baselineVolPerMin(st: SymbolState): number {
  const history = st.minuteVolumes.length > 1 ? st.minuteVolumes.slice(0, -1) : [];
  if (!history.length) return 0;
  return history.reduce((a, [, v]) => a + v, 0) / history.length;
}
function baselineSampleCount(st: SymbolState): number {
  return Math.max(0, st.minuteVolumes.length - 1);
}
function priceMovePct(st: SymbolState): number {
  if (!st.lastCandleOpen) return 0;
  return ((st.lastCandleClose! - st.lastCandleOpen) / st.lastCandleOpen) * 100;
}
function ingestTrades(st: SymbolState, trades: Array<{ price: number; qty: number; isSell: boolean; ts: number }>) {
  let maxTs = st.lastIngestedTradeTs;
  for (const t of trades) {
    if (t.ts <= st.lastIngestedTradeTs) continue;
    maxTs = Math.max(maxTs, t.ts);
    const quote = t.price * t.qty;
    const signed = t.isSell ? -quote : quote;
    st.tradeWindow.push([t.ts, signed]);
    st.lastPrice = t.price;
  }
  st.lastIngestedTradeTs = maxTs;
  const cutoff = Date.now() - 10 * 60_000;
  while (st.tradeWindow.length && st.tradeWindow[0][0] < cutoff) st.tradeWindow.shift();
}
function cvd(st: SymbolState, windowMs: number): number {
  const cutoff = Date.now() - windowMs;
  return st.tradeWindow.filter(([ts]) => ts >= cutoff).reduce((a, [, q]) => a + q, 0);
}
function oiDeltaPct(st: SymbolState, lookbackMs = 900_000): number | null {
  if (st.oiHistory.length < 2) return null;
  const [nowTs, nowOi] = st.oiHistory[st.oiHistory.length - 1];
  const targetTs = nowTs - lookbackMs;
  let pastOi: number | null = null;
  for (const [ts, oi] of st.oiHistory) {
    if (ts <= targetTs) pastOi = oi; else break;
  }
  if (pastOi === null) pastOi = st.oiHistory[0][1];
  if (!pastOi) return null;
  return ((nowOi - pastOi) / pastOi) * 100;
}

function checkEarlyTrigger(st: SymbolState, quoteVol1m: number): boolean {
  if (baselineSampleCount(st) < MIN_BASELINE_SAMPLES) return false;
  const baseline = baselineVolPerMin(st);
  if (quoteVol1m < MIN_QUOTE_VOL_1M) return false;
  if (baseline <= 0) return false;
  const multiplier = baseline >= MAJOR_BASELINE_THRESHOLD ? MAJOR_VOL_SPIKE_MULTIPLIER : VOL_SPIKE_MULTIPLIER;
  if (quoteVol1m < baseline * multiplier) return false;
  if (Math.abs(priceMovePct(st)) < PRICE_MOVE_MIN_PCT) return false;
  return true;
}

function verdictLabel(score: number, directionUp: boolean): string {
  if (score >= 2) return directionUp ? "🟢 REAL — continuación alcista" : "🟢 REAL — continuación bajista";
  if (score <= -1) return directionUp ? "🔴 BULL TRAP" : "🔴 BEAR TRAP";
  return "🟡 DUDOSO";
}

function scoreSymbol(exchangesConfirming: Set<string>, states: Record<string, SymbolState>, priceMove: number) {
  let score = 0;
  const direction = priceMove >= 0 ? 1 : -1;
  const detail = { multiExchange: "", oi: "", cvd: "", funding: "" };

  if (exchangesConfirming.size >= MULTI_EXCHANGE_MIN_CONFIRM) {
    score += 1; detail.multiExchange = `✅ ${exchangesConfirming.size} exchanges`;
  } else {
    score -= 1; detail.multiExchange = `⚠️ ${exchangesConfirming.size} exchange(s)`;
  }

  const oiDeltas = Object.values(states).map(s => oiDeltaPct(s)).filter((d): d is number => d !== null);
  if (oiDeltas.length) {
    const avg = oiDeltas.reduce((a, b) => a + b, 0) / oiDeltas.length;
    if (avg >= OI_DELTA_REAL_PCT) { score += 1; detail.oi = `✅ OI +${avg.toFixed(2)}%`; }
    else if (avg <= OI_DELTA_FALSO_PCT) { score -= 1; detail.oi = `❌ OI +${avg.toFixed(2)}%`; }
    else detail.oi = `➖ OI +${avg.toFixed(2)}%`;
  } else detail.oi = "➖ sin dato";

  const cvdTotal = Object.values(states).reduce((a, s) => a + cvd(s, 60_000), 0);
  const aligned = cvdTotal * direction;
  if (aligned > 0) { score += 1; detail.cvd = `✅ $${Math.round(cvdTotal).toLocaleString()}`; }
  else { score -= 1; detail.cvd = `❌ $${Math.round(cvdTotal).toLocaleString()}`; }

  const fundings = Object.values(states).map(s => s.lastFunding).filter((f): f is number => f !== null);
  if (fundings.length) {
    const avgPct = (fundings.reduce((a, b) => a + b, 0) / fundings.length) * 100;
    if (Math.abs(avgPct) >= FUNDING_EXTREME_PCT) { score -= 1; detail.funding = `⚠️ ${avgPct.toFixed(4)}%`; }
    else detail.funding = `➖ ${avgPct.toFixed(4)}%`;
  } else detail.funding = "➖ sin dato";

  return { score, detail };
}

// Bybit primero: Binance suele bloquear (HTTP 451) IPs de datacenters/Railway
// según la región — mismo problema y mismo fix que ya resolvimos en el bot
// standalone de Telegram. Si tu región de Railway SÍ tiene acceso a Binance,
// puedes reordenar esto para que Binance vaya primero.
const ENABLED_EXCHANGES = ["bybit", "okx", "binance"];
const PRIMARY_EXCHANGE = ENABLED_EXCHANGES[0];

async function refreshWatchlist() {
  let syms = await topSymbolsBybit(WATCHLIST_SIZE);
  if (!syms.length) syms = await topSymbolsBinance(WATCHLIST_SIZE);
  if (!syms.length) syms = await topSymbolsOkx(WATCHLIST_SIZE);
  if (syms.length) { watchlist = syms; lastWatchlistRefresh = Date.now(); console.log(`[pump-live] watchlist actualizada: ${syms.length} símbolos`); }
  else console.error("[pump-live] no se pudo refrescar watchlist — bybit, binance y okx fallaron");
}

async function cheapTierScan() {
  for (const symbol of watchlist) {
    const triggered = new Set<string>();
    for (const exchange of ENABLED_EXCHANGES) {
      const k = await getKline(exchange, symbol);
      if (!k) continue;
      const st = getState(exchange, symbol);
      ingestMinuteVolume(st, k.openTime, k.quoteVolume, k.open, k.close);
      if (checkEarlyTrigger(st, k.quoteVolume)) triggered.add(exchange);
    }
    if (!triggered.size) continue;

    if (pending.has(symbol)) {
      const p = pending.get(symbol)!;
      for (const ex of triggered) p.confirmedExchanges.add(ex);
      continue;
    }
    const cd = cooldown.get(symbol) ?? 0;
    if (Date.now() - cd < SYMBOL_COOLDOWN_MS) continue;

    // ── Dispara etapa temprana ──
    const primarySt = getState(PRIMARY_EXCHANGE, symbol);
    const earlyPrice = primarySt.lastPrice ?? 0;
    cooldown.set(symbol, Date.now());
    pending.set(symbol, { confirmAt: Date.now() + CONFIRMATION_DELAY_MS, earlyPrice, earlyTs: Date.now(), confirmedExchanges: new Set(triggered) });

    const baseline = baselineVolPerMin(primarySt);
    rows.set(symbol, {
      symbol, stage: "early", originExchange: PRIMARY_EXCHANGE, price: earlyPrice, priceEarly: earlyPrice,
      volMultiplier: baseline > 0 ? primarySt.currentVol / baseline : 0,
      score: 0, verdict: "🌱 arrancando...", direction: 1, pctMoveSinceEarly: 0, progressPct: 5,
      signals: { multiExchange: "—", oi: "—", cvd: "—", funding: "—" },
      triggeredAt: Date.now(), confirmAt: Date.now() + CONFIRMATION_DELAY_MS, lingerUntil: 0,
    });
    console.log(`[pump-live] 🌱 EARLY TRIGGER ${symbol} exchanges=${Array.from(triggered)}`);
  }
}

async function feedPendingTrades() {
  for (const symbol of pending.keys()) {
    for (const exchange of ENABLED_EXCHANGES) {
      const trades = await getTrades(exchange, symbol);
      if (trades.length) ingestTrades(getState(exchange, symbol), trades);
    }
    // Actualiza la barra de progreso mientras espera confirmación
    const p = pending.get(symbol);
    const row = rows.get(symbol);
    if (p && row && row.stage === "early") {
      const elapsed = Date.now() - p.earlyTs;
      row.progressPct = Math.min(95, 5 + (elapsed / CONFIRMATION_DELAY_MS) * 90);
      const st = getState(PRIMARY_EXCHANGE, symbol);
      if (st.lastPrice) {
        row.price = st.lastPrice;
        row.pctMoveSinceEarly = ((st.lastPrice - row.priceEarly) / row.priceEarly) * 100;
      }
    }
  }
}

async function checkConfirmations() {
  const now = Date.now();
  for (const [symbol, p] of Array.from(pending.entries())) {
    if (now < p.confirmAt) continue;
    pending.delete(symbol);

    const perExchangeStates: Record<string, SymbolState> = {};
    for (const exchange of ENABLED_EXCHANGES) {
      const trades = await getTrades(exchange, symbol);
      const oi = await getOi(exchange, symbol);
      const funding = await getFunding(exchange, symbol);
      const st = getState(exchange, symbol);
      if (trades.length) ingestTrades(st, trades);
      if (oi !== null) st.oiHistory.push([now, oi]);
      if (funding !== null) st.lastFunding = funding;
      if (trades.length || oi !== null) perExchangeStates[exchange] = st;
    }
    if (!Object.keys(perExchangeStates).length) { rows.delete(symbol); continue; }

    const lastPrice = Object.values(perExchangeStates).map(s => s.lastPrice).find(p2 => p2) ?? p.earlyPrice;
    const priceMove = p.earlyPrice ? ((lastPrice! - p.earlyPrice) / p.earlyPrice) * 100 : 0;
    const { score, detail } = scoreSymbol(p.confirmedExchanges, perExchangeStates, priceMove);
    const verdict = verdictLabel(score, priceMove >= 0);
    console.log(`[pump-live] ⚡ CONFIRMACIÓN ${symbol} score=${score} -> ${verdict}`);

    const confirmedRow: Row = {
      symbol, stage: "confirmed", originExchange: PRIMARY_EXCHANGE, price: lastPrice ?? p.earlyPrice, priceEarly: p.earlyPrice,
      volMultiplier: rows.get(symbol)?.volMultiplier ?? 0,
      score, verdict, direction: priceMove >= 0 ? 1 : -1, pctMoveSinceEarly: priceMove, progressPct: 100,
      signals: detail, triggeredAt: p.earlyTs, confirmAt: now, lingerUntil: now + LINGER_MS,
    };
    rows.set(symbol, confirmedRow);

    // Guarda copia en el historial (últimas 20, en memoria — no se borra a los 3 min)
    history.unshift({ ...confirmedRow });
    if (history.length > HISTORY_MAX) history.length = HISTORY_MAX;
  }
}

function sweepOffRows() {
  const now = Date.now();
  for (const [symbol, row] of Array.from(rows.entries())) {
    if (row.stage === "confirmed" && now > row.lingerUntil) rows.delete(symbol);
  }
}

let loopRunning = false;
async function loopTick() {
  if (loopRunning) return;
  loopRunning = true;
  try {
    if (!watchlist.length || Date.now() - lastWatchlistRefresh > WATCHLIST_REFRESH_MS) await refreshWatchlist();
    await cheapTierScan();
    await feedPendingTrades();
    await checkConfirmations();
    sweepOffRows();
  } catch (e) {
    console.error("pump-live loop error:", e);
  } finally {
    loopRunning = false;
  }
}

export function startPumpLiveLoop() {
  if (loopStarted) return; // evita doble arranque si el módulo se importa más de una vez
  loopStarted = true;
  setTimeout(() => { setInterval(loopTick, SCAN_INTERVAL_MS); loopTick(); }, 3000);
  console.log("[pump-live] motor de detección iniciado (embebido en api-server)");
}

// ─── Endpoint para el frontend (hoja de cálculo en vivo) ──────────────────
router.get("/pump-live/rows", (_req: Request, res: Response) => {
  const list = Array.from(rows.values()).sort((a, b) => b.triggeredAt - a.triggeredAt);
  res.json({ ok: true, rows: list, history, watchlistSize: watchlist.length, ts: Date.now() });
});

startPumpLiveLoop();

export default router;
