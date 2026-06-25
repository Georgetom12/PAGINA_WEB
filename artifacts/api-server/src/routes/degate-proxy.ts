import { Router, Request, Response } from "express";

const router = Router();
const DEGATE_BASE = "https://v1-mainnet-backend.degate.com/order-book-api";

async function proxyGet(url: string, res: Response) {
  try {
    const r = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "PSYCHOMETRIKS/1.0",
      },
    });
    if (!r.ok) {
      res.status(r.status).json({ ok: false, error: `DeGate error ${r.status}` });
      return;
    }
    const data = await r.json();
    res.json({ ok: true, ...data });
  } catch (err: unknown) {
    res.status(502).json({ ok: false, error: (err as Error).message });
  }
}

// GET /api/proxy/degate/tickers
router.get("/proxy/degate/tickers", async (_req: Request, res: Response) => {
  await proxyGet(`${DEGATE_BASE}/ticker/24hr`, res);
});

// GET /api/proxy/degate/depth?symbol=ETH_USDC&size=10
router.get("/proxy/degate/depth", async (req: Request, res: Response) => {
  const { symbol = "ETH_USDC", size = "10" } = req.query as Record<string, string>;
  await proxyGet(`${DEGATE_BASE}/depth?symbol=${encodeURIComponent(symbol)}&size=${size}`, res);
});

// GET /api/proxy/degate/trades?symbol=ETH_USDC&limit=40
router.get("/proxy/degate/trades", async (req: Request, res: Response) => {
  const { symbol = "ETH_USDC", limit = "40" } = req.query as Record<string, string>;
  await proxyGet(`${DEGATE_BASE}/trades?symbol=${encodeURIComponent(symbol)}&limit=${limit}`, res);
});

// GET /api/proxy/degate/pumps — top gainers 24h
router.get("/proxy/degate/pumps", async (_req: Request, res: Response) => {
  try {
    const r = await fetch(`${DEGATE_BASE}/ticker/24hr`, {
      headers: { "Accept": "application/json", "User-Agent": "PSYCHOMETRIKS/1.0" },
    });
    const raw = await r.json() as { data?: Array<{symbol:string; priceChangePercent:string; lastPrice:string; volume:string; quoteVolume:string}> };
    const tickers = raw.data ?? [];
    const pumps: Record<string, unknown> = {};
    for (const t of tickers) {
      pumps[t.symbol] = {
        symbol: t.symbol,
        priceChangePercent: t.priceChangePercent,
        lastPrice: t.lastPrice,
        volume: t.volume,
        quoteVolume: t.quoteVolume,
      };
    }
    res.json({ ok: true, data: pumps });
  } catch (err: unknown) {
    res.status(502).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
