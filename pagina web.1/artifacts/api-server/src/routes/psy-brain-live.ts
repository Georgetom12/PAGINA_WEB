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

// ── FMP (mismo patrón ya probado en buffett.ts) ─────────────────────────────
const FMP_BASE = "https://financialmodelingprep.com/stable";
async function fmpQuote(symbol: string): Promise<{ price: number; changePct: number } | null> {
  const key = process.env["FMP_API_KEY"];
  if (!key) return null;
  try {
    const r = await fetch(`${FMP_BASE}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${key}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const d = await r.json() as Array<{ price?: number; changePercentage?: number }>;
    const q = Array.isArray(d) ? d[0] : null;
    if (!q || typeof q.price !== "number") return null;
    return { price: q.price, changePct: q.changePercentage ?? 0 };
  } catch { return null; }
}

async function fmpTreasury(): Promise<{ y10: number | null; y2: number | null }> {
  const key = process.env["FMP_API_KEY"];
  if (!key) return { y10: null, y2: null };
  try {
    const r = await fetch(`${FMP_BASE}/treasury-rates?apikey=${key}`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return { y10: null, y2: null };
    const d = await r.json() as Array<{ year10?: number; year2?: number }>;
    const latest = d[0];
    return { y10: latest?.year10 ?? null, y2: latest?.year2 ?? null };
  } catch { return { y10: null, y2: null }; }
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

// ── Mapeo de símbolos ────────────────────────────────────────────────────────
const EQUITY_SYMS = ["AAPL", "NVDA", "MSFT", "AMZN", "GOOGL", "META", "TSLA", "JPM", "NFLX", "COST"];
const INDEX_MAP: Record<string, string> = { SPX: "^GSPC", NDX: "^NDX", DJI: "^DJI", RUT: "^RUT", VIX: "^VIX" };
const MACRO_MAP: Record<string, string> = { DXY: "DX-Y.NYB", XAU: "GCUSD", WTI: "CLUSD" };
const CRYPTO_SYMS = ["BTC", "ETH", "SOL", "BNB", "XRP"];

// GET /api/psy-brain/live-data
router.get("/psy-brain/live-data", async (_req: Request, res: Response) => {
  const cached = cGet<unknown>("psy_brain_live");
  if (cached) { res.json(cached); return; }

  try {
    const [equityResults, indexResults, macroResults, cryptoResults, treasury] = await Promise.all([
      Promise.all(EQUITY_SYMS.map(s => fmpQuote(s))),
      Promise.all(Object.values(INDEX_MAP).map(s => fmpQuote(s))),
      Promise.all(Object.values(MACRO_MAP).map(s => fmpQuote(s))),
      Promise.all(CRYPTO_SYMS.map(s => binanceTicker(s))),
      fmpTreasury(),
    ]);

    const equities: Record<string, { price: number | null; changePct: number | null }> = {};
    EQUITY_SYMS.forEach((s, i) => {
      equities[s] = { price: equityResults[i]?.price ?? null, changePct: equityResults[i]?.changePct ?? null };
    });

    const indices: Record<string, { price: number | null; changePct: number | null }> = {};
    Object.keys(INDEX_MAP).forEach((s, i) => {
      indices[s] = { price: indexResults[i]?.price ?? null, changePct: indexResults[i]?.changePct ?? null };
    });

    const macro: Record<string, { price: number | null; changePct: number | null }> = {};
    Object.keys(MACRO_MAP).forEach((s, i) => {
      macro[s] = { price: macroResults[i]?.price ?? null, changePct: macroResults[i]?.changePct ?? null };
    });
    macro["US10Y"] = { price: treasury.y10, changePct: null };
    macro["US2Y"] = { price: treasury.y2, changePct: null };

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
