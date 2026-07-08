import { Router, Request, Response } from "express";

const router = Router();

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

    const equities: Record<string, { price: number | null; changePct: number | null; marketCap: number | null }> = {};
    EQUITY_SYMS.forEach((s, i) => {
      equities[s] = {
        price: equityResults[i]?.price ?? null,
        changePct: equityResults[i]?.changePct ?? null,
        marketCap: null, // Yahoo chart API no trae marketCap; se deja null en vez de un valor falso
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

    const payload = { ok: true, equities, indices, macro, crypto, fetchedAt: new Date().toISOString() };
    cSet("psy_brain_live", payload, 60_000);
    res.json(payload);
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  }
});

export default router;
