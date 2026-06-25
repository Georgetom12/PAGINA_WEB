import { Router, Request, Response } from "express";

const router = Router();

async function proxyFetch(url: string, res: Response, req: Request) {
  try {
    const r = await fetch(url, {
      headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0" },
    });
    if (!r.ok) {
      res.status(r.status).json({ error: `Upstream error ${r.status}` });
      return;
    }
    const data = await r.json();
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(data);
  } catch (err) {
    req.log.error({ err, url }, "market-proxy fetch error");
    res.status(502).json({ error: "Proxy fetch failed" });
  }
}

// ─── Kraken ──────────────────────────────────────────────────────────────────
// OHLC: interval 1440=daily, 10080=weekly, 43200=monthly
router.get("/proxy/kraken/ohlc", async (req: Request, res: Response) => {
  const { pair = "XBTUSD", interval = "10080", since = "" } = req.query as Record<string, string>;
  const url = since
    ? `https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=${interval}&since=${since}`
    : `https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=${interval}`;
  await proxyFetch(url, res, req);
});

// Kraken ticker (live price)
router.get("/proxy/kraken/price", async (req: Request, res: Response) => {
  const { pair = "XBTUSD" } = req.query as Record<string, string>;
  await proxyFetch(`https://api.kraken.com/0/public/Ticker?pair=${pair}`, res, req);
});

// ─── OKX ─────────────────────────────────────────────────────────────────────
// OKX history candles (perpetual futures)
// bar: 1D, 1W, 1M
router.get("/proxy/okx/candles", async (req: Request, res: Response) => {
  const { instId = "BTC-USDT-SWAP", bar = "1D", limit = "300" } = req.query as Record<string, string>;
  // OKX history-candles goes back further
  await proxyFetch(
    `https://www.okx.com/api/v5/market/history-candles?instId=${instId}&bar=${bar}&limit=${limit}`,
    res, req
  );
});

// OKX open interest (current)
router.get("/proxy/okx/oi", async (req: Request, res: Response) => {
  const { instId = "BTC-USDT-SWAP" } = req.query as Record<string, string>;
  await proxyFetch(
    `https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=${instId}`,
    res, req
  );
});

// OKX open interest history
router.get("/proxy/okx/oi-history", async (req: Request, res: Response) => {
  const { instId = "BTC-USDT-SWAP", period = "1D", limit = "300" } = req.query as Record<string, string>;
  await proxyFetch(
    `https://www.okx.com/api/v5/rubik/stat/contracts/open-interest-volume?ccy=BTC&period=${period}&limit=${limit}`,
    res, req
  );
});

// ─── Coinbase ─────────────────────────────────────────────────────────────────
router.get("/proxy/coinbase/price", async (req: Request, res: Response) => {
  const { pair = "BTC-USD" } = req.query as Record<string, string>;
  await proxyFetch(`https://api.coinbase.com/v2/prices/${pair}/spot`, res, req);
});

export default router;
