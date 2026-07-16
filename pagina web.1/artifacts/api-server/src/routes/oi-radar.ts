/**
 * OI RADAR — Open Interest y sesgo Long/Short REAL por altcoin, multi-exchange.
 * Reemplaza el tab "Hyperliquid OI" de altcoins-signals.tsx, que antes generaba
 * los números con una fórmula fija basada en la posición del arreglo (100% falso).
 *
 * Fuentes (en orden de intento): Binance Futures → Bybit → Hyperliquid.
 * Binance y Bybit dan OI en USD y % de cuentas long/short reales.
 * Hyperliquid (si las otras dos fallan) solo da OI — el sesgo se infiere del
 * signo del funding rate como respaldo razonable cuando no hay ratio directo.
 */
import { Router, type Request, type Response } from "express";

const router = Router();
const TTL_MS = 90_000; // mismo intervalo que ya anunciaba el tab ("cada 90 segundos")

interface OiRow {
  symbol: string;
  oiUsd: number | null;
  longsPct: number | null;
  shortsPct: number | null;
  source: string;
}

const cache = new Map<string, { data: OiRow[]; ts: number }>();

async function getJson(url: string, init?: RequestInit): Promise<unknown | null> {
  try {
    const r = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

async function fromBinance(symbol: string): Promise<OiRow | null> {
  const [oiHist, ratio] = await Promise.all([
    getJson(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=5m&limit=1`) as
      Promise<Array<{ sumOpenInterestValue: string }> | null>,
    getJson(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=5m&limit=1`) as
      Promise<Array<{ longAccount: string; shortAccount: string }> | null>,
  ]);
  const oiUsd = oiHist?.[0]?.sumOpenInterestValue ? parseFloat(oiHist[0].sumOpenInterestValue) : null;
  const longsPct = ratio?.[0]?.longAccount ? parseFloat(ratio[0].longAccount) * 100 : null;
  const shortsPct = ratio?.[0]?.shortAccount ? parseFloat(ratio[0].shortAccount) * 100 : null;
  if (oiUsd === null && longsPct === null) return null;
  return { symbol, oiUsd, longsPct, shortsPct, source: "binance" };
}

async function fromBybit(symbol: string): Promise<OiRow | null> {
  const [ticker, ratio] = await Promise.all([
    getJson(`https://api.bybit.com/v5/market/tickers?category=linear&symbol=${symbol}`) as
      Promise<{ result?: { list?: Array<{ openInterestValue?: string }> } } | null>,
    getJson(`https://api.bybit.com/v5/market/account-ratio?category=linear&symbol=${symbol}&period=5min&limit=1`) as
      Promise<{ result?: { list?: Array<{ buyRatio?: string; sellRatio?: string }> } } | null>,
  ]);
  const oiUsd = ticker?.result?.list?.[0]?.openInterestValue ? parseFloat(ticker.result.list[0].openInterestValue!) : null;
  const buy  = ratio?.result?.list?.[0]?.buyRatio  ? parseFloat(ratio.result.list[0].buyRatio!)  * 100 : null;
  const sell = ratio?.result?.list?.[0]?.sellRatio ? parseFloat(ratio.result.list[0].sellRatio!) * 100 : null;
  if (oiUsd === null && buy === null) return null;
  return { symbol, oiUsd, longsPct: buy, shortsPct: sell, source: "bybit" };
}

async function fromHyperliquid(symbol: string): Promise<OiRow | null> {
  // Hyperliquid usa el nombre base (sin USDT) — ej "SOL" en vez de "SOLUSDT"
  const coin = symbol.replace("USDT", "");
  const d = await getJson("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "metaAndAssetCtxs" }),
  }) as [{ universe?: Array<{ name: string }> }, Array<{ openInterest?: string; markPx?: string; funding?: string }>] | null;
  if (!d || !Array.isArray(d) || !d[0]?.universe) return null;
  const idx = d[0].universe.findIndex(a => a.name === coin);
  if (idx < 0) return null;
  const ctx = d[1]?.[idx];
  if (!ctx?.openInterest || !ctx?.markPx) return null;
  const oiUsd = parseFloat(ctx.openInterest) * parseFloat(ctx.markPx);
  // Sin ratio directo de longs/shorts en la API pública — usamos el signo del
  // funding como sesgo aproximado (funding positivo = más presión compradora).
  const funding = ctx.funding ? parseFloat(ctx.funding) : 0;
  const longsPct = funding > 0 ? 55 : funding < 0 ? 45 : 50;
  return { symbol, oiUsd, longsPct, shortsPct: 100 - longsPct, source: "hyperliquid (sesgo estimado por funding)" };
}

async function getOiRow(symbol: string): Promise<OiRow> {
  const b = await fromBinance(symbol);
  if (b) return b;
  const y = await fromBybit(symbol);
  if (y) return y;
  const h = await fromHyperliquid(symbol);
  if (h) return h;
  return { symbol, oiUsd: null, longsPct: null, shortsPct: null, source: "sin dato" };
}

router.get("/oi-radar/live", async (req: Request, res: Response) => {
  const symbolsParam = String(req.query.symbols ?? "");
  const symbols = symbolsParam.split(",").map(s => s.trim()).filter(Boolean);
  if (!symbols.length) { res.json({ ok: true, data: [] }); return; }

  const cacheKey = symbols.join(",");
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < TTL_MS) { res.json({ ok: true, data: hit.data, cached: true }); return; }

  const data = await Promise.all(symbols.map(getOiRow));
  cache.set(cacheKey, { data, ts: Date.now() });
  res.json({ ok: true, data, cached: false });
});

export default router;
