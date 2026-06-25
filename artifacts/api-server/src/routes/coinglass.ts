import { Router, type Request, type Response } from "express";

const router = Router();

const _cache = new Map<string, { data: unknown; exp: number }>();
function cGet<T>(k: string): T | null {
  const e = _cache.get(k);
  return e && Date.now() < e.exp ? (e.data as T) : null;
}
function cSet<T>(k: string, d: T, ttl: number) {
  _cache.set(k, { data: d, exp: Date.now() + ttl });
}

export interface CgSignal {
  id: string;
  exchange: "binance" | "bybit" | "okx";
  exchangeLabel: string;
  coin: string;
  direction: "LONG" | "SHORT" | "NEUTRAL";
  fundingRate: number;
  fundingFormatted: string;
  oiUsd: number;
  signal: "BUY" | "SELL" | "HOLD";
  score100: number;
  size: "GRANDE" | "MID" | "SMALL";
  volume24h: number;
}

const COINS = ["BTC", "ETH", "SOL", "BNB", "XRP", "AVAX", "DOGE", "LINK", "ARB", "OP"];
const PRICE_EST: Record<string, number> = {
  BTC: 95000, ETH: 2800, SOL: 150, BNB: 600, XRP: 2.2,
  AVAX: 28, DOGE: 0.18, LINK: 14, ARB: 0.7, OP: 1.2,
};

function buildSignal(
  exchange: CgSignal["exchange"],
  coin: string,
  fr: number,
  oiUsd: number,
  vol24h?: number,
): CgSignal {
  const direction: CgSignal["direction"] =
    fr < -0.00005 ? "LONG" : fr > 0.00005 ? "SHORT" : "NEUTRAL";
  const signal: CgSignal["signal"] =
    fr < -0.0002 ? "BUY" : fr > 0.0002 ? "SELL" : "HOLD";
  const absRate = Math.abs(fr);
  const score100 = Math.min(99, Math.max(50, Math.round(50 + absRate * 20000)));
  const size: CgSignal["size"] = oiUsd > 2e9 ? "GRANDE" : oiUsd > 300e6 ? "MID" : "SMALL";
  const label = exchange === "binance" ? "Binance" : exchange === "bybit" ? "Bybit" : "OKX";
  return {
    id: `ex_${exchange}_${coin}`,
    exchange,
    exchangeLabel: label,
    coin,
    direction,
    fundingRate: fr,
    fundingFormatted: `${fr >= 0 ? "+" : ""}${(fr * 100).toFixed(4)}%`,
    oiUsd,
    signal,
    score100,
    size,
    volume24h: vol24h ?? oiUsd * 0.75,
  };
}

// ── OKX: fetch funding + OI for all coins ──────────────────────────────────
async function fetchOkx(): Promise<CgSignal[]> {
  const results = await Promise.all(
    COINS.map(async coin => {
      const instId = `${coin}-USDT-SWAP`;
      try {
        const [frRes, oiRes] = await Promise.all([
          fetch(`https://www.okx.com/api/v5/public/funding-rate?instId=${instId}`, { signal: AbortSignal.timeout(7000) }),
          fetch(`https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=${instId}`, { signal: AbortSignal.timeout(7000) }),
        ]);
        const frData = await frRes.json() as { data?: Array<{ fundingRate: string }> };
        const oiData = await oiRes.json() as { data?: Array<{ oiCcy: string }> };
        const fr = parseFloat(frData.data?.[0]?.fundingRate ?? "0");
        const oiCoin = parseFloat(oiData.data?.[0]?.oiCcy ?? "0");
        const price = PRICE_EST[coin] ?? 1;
        const oiUsd = oiCoin > 0 ? oiCoin * price : (coin === "BTC" ? 3e9 : coin === "ETH" ? 1.2e9 : 150e6);
        if (isNaN(fr)) return null;
        return buildSignal("okx", coin, fr, oiUsd);
      } catch { return null; }
    })
  );
  return results.filter(Boolean) as CgSignal[];
}

// ── Bybit: fetch tickers (includes funding + OI) ────────────────────────────
async function fetchBybit(): Promise<CgSignal[]> {
  try {
    const r = await fetch("https://api.bybit.com/v5/market/tickers?category=linear", {
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return [];
    const data = await r.json() as { result?: { list?: Array<{ symbol: string; fundingRate: string; openInterestValue: string; volume24h?: string }> } };
    const list = data.result?.list ?? [];
    const signals: CgSignal[] = [];
    for (const coin of COINS) {
      const ticker = list.find(t => t.symbol === `${coin}USDT`);
      if (!ticker) continue;
      const fr = parseFloat(ticker.fundingRate ?? "0");
      const oiUsd = parseFloat(ticker.openInterestValue ?? "0");
      const vol = parseFloat(ticker.volume24h ?? "0") * (PRICE_EST[coin] ?? 1);
      if (isNaN(fr)) continue;
      signals.push(buildSignal("bybit", coin, fr, oiUsd || (PRICE_EST[coin] ?? 1) * 1e6, vol));
    }
    return signals;
  } catch { return []; }
}

// ── Binance Futures: funding rates (may be geo-blocked in dev) ─────────────
async function fetchBinance(): Promise<CgSignal[]> {
  try {
    const r = await fetch("https://fapi.binance.com/fapi/v1/premiumIndex", {
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return [];
    const data = await r.json() as Array<{ symbol: string; lastFundingRate: string; markPrice: string }>;
    const signals: CgSignal[] = [];
    for (const coin of COINS) {
      const item = data.find(d => d.symbol === `${coin}USDT`);
      if (!item) continue;
      const fr = parseFloat(item.lastFundingRate ?? "0");
      const price = parseFloat(item.markPrice ?? "0") || (PRICE_EST[coin] ?? 1);
      const oiUsd = price * (PRICE_EST[coin] > 0 ? 30000 : 5000);
      if (isNaN(fr)) continue;
      signals.push(buildSignal("binance", coin, fr, oiUsd));
    }
    return signals;
  } catch { return []; }
}

// GET /api/coinglass/signals
router.get("/coinglass/signals", async (_req: Request, res: Response) => {
  const cached = cGet<CgSignal[]>("ex_signals_v4");
  if (cached) { res.json({ ok: true, signals: cached, cached: true, total: cached.length }); return; }

  try {
    const [okxSignals, bybitSignals, binanceSignals] = await Promise.all([
      fetchOkx(),
      fetchBybit(),
      fetchBinance(),
    ]);

    const all = [...binanceSignals, ...bybitSignals, ...okxSignals];
    all.sort((a, b) => b.score100 - a.score100);

    cSet("ex_signals_v4", all, 90_000);
    res.json({
      ok: true,
      signals: all,
      total: all.length,
      sources: {
        binance: binanceSignals.length,
        bybit: bybitSignals.length,
        okx: okxSignals.length,
      },
    });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err), signals: [] });
  }
});

export default router;
