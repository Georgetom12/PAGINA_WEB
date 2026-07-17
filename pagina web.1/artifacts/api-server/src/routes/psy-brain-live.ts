import { Router, Request, Response } from "express";
import { rsi as calcRsi } from "./psy-algo";

const router = Router();

// ── Historial diario (Yahoo) — para RSI(14), Beta y volatilidad realizada REALES ──
// Antes estos 3 venían hardcodeados en el frontend y nunca cambiaban.
async function fetchYahooHistoryFull(symbol: string, range = "6mo"): Promise<{ closes: number[]; volumes: number[] }> {
  try {
    const r = await fetch(
      `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`,
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }, signal: AbortSignal.timeout(10000) },
    );
    if (!r.ok) return { closes: [], volumes: [] };
    const d = await r.json() as { chart?: { result?: [{ indicators?: { quote?: [{ close?: (number | null)[]; volume?: (number | null)[] }] } }] } };
    const q = d?.chart?.result?.[0]?.indicators?.quote?.[0];
    const closes = (q?.close ?? []).filter((c): c is number => c !== null && c > 0);
    const volumes = (q?.volume ?? []).filter((v): v is number => v !== null && v >= 0);
    return { closes, volumes };
  } catch { return { closes: [], volumes: [] }; }
}
async function fetchYahooHistory(symbol: string, range = "6mo"): Promise<number[]> {
  return (await fetchYahooHistoryFull(symbol, range)).closes;
}

// Volumen relativo — volumen de hoy vs promedio de los últimos 20 días.
// >1.3x = volumen anómalo (algo está pasando), ~1.0x = normal.
function volumenRelativo(volumes: number[]): number | null {
  if (volumes.length < 15) return null;
  const hoy = volumes.at(-1)!;
  const prev = volumes.slice(-21, -1);
  const avg = prev.reduce((a, b) => a + b, 0) / (prev.length || 1);
  return avg > 0 ? hoy / avg : null;
}

function dailyReturns(closes: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < closes.length; i++) out.push((closes[i]! - closes[i - 1]!) / closes[i - 1]!);
  return out;
}

// Volatilidad realizada anualizada (%) — NO es lo mismo que IV de opciones (esa
// viene del mercado de opciones y necesita un feed pago que no tenemos
// conectado), pero es un dato REAL calculado, no inventado.
function volatilidadRealizada(closes: number[]): number | null {
  const rets = dailyReturns(closes);
  if (rets.length < 10) return null;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, r) => a + (r - mean) ** 2, 0) / rets.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

// Beta real vs S&P 500 — covarianza(activo, SPX) / varianza(SPX)
function calcBeta(closesAsset: number[], closesSpx: number[]): number | null {
  const n = Math.min(closesAsset.length, closesSpx.length);
  if (n < 20) return null;
  const rA = dailyReturns(closesAsset.slice(-n));
  const rS = dailyReturns(closesSpx.slice(-n));
  const m = Math.min(rA.length, rS.length);
  if (m < 15) return null;
  const meanA = rA.slice(-m).reduce((a, b) => a + b, 0) / m;
  const meanS = rS.slice(-m).reduce((a, b) => a + b, 0) / m;
  let cov = 0, varS = 0;
  for (let i = 0; i < m; i++) {
    cov += (rA[i]! - meanA) * (rS[i]! - meanS);
    varS += (rS[i]! - meanS) ** 2;
  }
  return varS > 0 ? cov / varS : null;
}

// ── Cache simple en memoria (60s) ───────────────────────────────────────────
const _cache = new Map<string, { data: unknown; exp: number }>();
function cGet<T>(k: string): T | null {
  const e = _cache.get(k);
  return e && Date.now() < e.exp ? (e.data as T) : null;
}
function cSet<T>(k: string, d: T, ms: number) {
  _cache.set(k, { data: d, exp: Date.now() + ms });
}

// ── Yahoo Finance (gratis, sin API key) ─────────────────────────────────────
// NOTA (8-jul-2026): este archivo usaba FMP, pero /api/v3 da 403 "Legacy
// Endpoint" y /stable da 402 "Restricted Endpoint" — confirmado en logs de
// Railway: el plan FMP Basic/gratuito ya no incluye quotes en tiempo real
// para acciones/índices (eso quedó reservado a planes Starter en adelante).
// Se reemplaza por Yahoo Finance, el mismo patrón que ya usa
// `market-data.ts` en este mismo repo y que ahí sí funciona bien.
interface YQuote { price: number; changePct: number }

async function fetchYahoo(symbol: string): Promise<YQuote | null> {
  try {
    const r = await fetch(
      `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
      {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!r.ok) {
      console.warn(`[psy-brain-live] Yahoo quote ${symbol} HTTP ${r.status}`);
      return null;
    }
    const data = await r.json() as {
      chart: { result?: { meta: { regularMarketPrice: number; chartPreviousClose?: number; previousClose?: number } }[] }
    };
    const meta = data.chart.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    const prev = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice;
    const changePct = prev > 0 ? ((meta.regularMarketPrice - prev) / prev) * 100 : 0;
    return { price: meta.regularMarketPrice, changePct };
  } catch (e) {
    console.warn(`[psy-brain-live] Yahoo quote ${symbol} excepción:`, e);
    return null;
  }
}

// ── Binance (crypto, gratis, sin key) ───────────────────────────────────────
async function binanceTicker(sym: string): Promise<{ price: number; changePct: number } | null> {
  try {
    const r = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}USDT`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const d = await r.json() as { lastPrice?: string; priceChangePercent?: string };
    if (!d.lastPrice) return null;
    return { price: parseFloat(d.lastPrice), changePct: parseFloat(d.priceChangePercent ?? "0") };
  } catch { return null; }
}

// ── Mapeo de símbolos (formato Yahoo Finance) ───────────────────────────────
const EQUITY_SYMS = ["AAPL", "NVDA", "MSFT", "AMZN", "GOOGL", "META", "TSLA", "JPM", "NFLX", "COST"];
const INDEX_MAP: Record<string, string> = { SPX: "^GSPC", NDX: "^NDX", DJI: "^DJI", RUT: "^RUT", VIX: "^VIX" };
const MACRO_MAP: Record<string, string> = { DXY: "DX-Y.NYB", XAU: "GC=F", WTI: "CL=F" };
const CRYPTO_SYMS = ["BTC", "ETH", "SOL", "BNB", "XRP"];

// GET /api/psy-brain/live-data
router.get("/psy-brain/live-data", async (_req: Request, res: Response) => {
  const cached = cGet<unknown>("psy_brain_live");
  if (cached) { res.json(cached); return; }

  try {
    const [equityResults, indexResults, macroResults, cryptoResults, tnxResult] = await Promise.all([
      Promise.all(EQUITY_SYMS.map(s => fetchYahoo(s))),
      Promise.all(Object.values(INDEX_MAP).map(s => fetchYahoo(s))),
      Promise.all(Object.values(MACRO_MAP).map(s => fetchYahoo(s))),
      Promise.all(CRYPTO_SYMS.map(s => binanceTicker(s))),
      fetchYahoo("^TNX"), // Bonos 10Y (Yahoo no tiene un ticker gratuito confiable de 2Y)
    ]);

    // Historial diario para RSI(14)/Beta/Volatilidad realizada/Volumen relativo
    // REALES (antes hardcodeados en el frontend, congelados para siempre)
    const [equityHistories, spxHistory] = await Promise.all([
      Promise.all(EQUITY_SYMS.map(s => fetchYahooHistoryFull(s))),
      fetchYahooHistory("^GSPC"),
    ]);
    const equityMetrics: Record<string, { rsi14: number | null; beta: number | null; volRealizada: number | null; volRelativo: number | null }> = {};
    EQUITY_SYMS.forEach((s, i) => {
      const { closes, volumes } = equityHistories[i]!;
      const beta = closes.length >= 20 ? calcBeta(closes, spxHistory) : null;
      equityMetrics[s] = {
        rsi14: closes.length >= 20 ? Math.round(calcRsi(closes) * 10) / 10 : null,
        beta: beta !== null ? Math.round(beta * 100) / 100 : null,
        volRealizada: closes.length >= 15 ? Math.round((volatilidadRealizada(closes) ?? 0) * 10) / 10 : null,
        volRelativo: volumenRelativo(volumes),
      };
    });

    const equities: Record<string, { price: number | null; changePct: number | null; marketCap: number | null; rsi14: number | null; beta: number | null; volRealizada: number | null; volRelativo: number | null }> = {};
    EQUITY_SYMS.forEach((s, i) => {
      equities[s] = {
        price: equityResults[i]?.price ?? null,
        changePct: equityResults[i]?.changePct ?? null,
        marketCap: null, // Yahoo chart API no trae marketCap; se deja null en vez de un valor falso
        rsi14: equityMetrics[s]!.rsi14,
        beta: equityMetrics[s]!.beta,
        volRealizada: equityMetrics[s]!.volRealizada,
        volRelativo: equityMetrics[s]!.volRelativo,
      };
    });

    const indices: Record<string, { price: number | null; changePct: number | null }> = {};
    Object.keys(INDEX_MAP).forEach((s, i) => {
      indices[s] = { price: indexResults[i]?.price ?? null, changePct: indexResults[i]?.changePct ?? null };
    });

    const macro: Record<string, { price: number | null; changePct: number | null }> = {};
    Object.keys(MACRO_MAP).forEach((s, i) => {
      macro[s] = { price: macroResults[i]?.price ?? null, changePct: macroResults[i]?.changePct ?? null };
    });
    macro["US10Y"] = { price: tnxResult?.price ?? null, changePct: tnxResult?.changePct ?? null };
    macro["US2Y"] = { price: null, changePct: null }; // sin fuente gratuita confiable por ahora

    const crypto: Record<string, { price: number | null; changePct: number | null }> = {};
    CRYPTO_SYMS.forEach((s, i) => {
      crypto[s] = { price: cryptoResults[i]?.price ?? null, changePct: cryptoResults[i]?.changePct ?? null };
    });

    // Score de Macro REAL (0-100) — reemplaza el Math.random() del frontend.
    // Sube con SPX en verde y VIX bajo (complacencia/apetito de riesgo);
    // baja con VIX alto (miedo) — misma lógica ya usada en ia-trading-proxy.ts.
    const vixVal = indices["VIX"]?.price ?? 16;
    const spxChg = indices["SPX"]?.changePct ?? 0;
    let macroScore = 50;
    macroScore += spxChg > 0 ? 15 : -15;
    macroScore += vixVal < 18 ? 15 : vixVal > 25 ? -20 : 0;
    macroScore = Math.max(0, Math.min(100, Math.round(macroScore)));

    const payload = { ok: true, equities, indices, macro, crypto, macroScore, fetchedAt: new Date().toISOString() };
    cSet("psy_brain_live", payload, 60_000);
    res.json(payload);
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  }
});

export default router;
