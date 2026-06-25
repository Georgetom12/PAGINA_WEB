import { Router, type Request, type Response } from "express";
import { logger } from "../lib/logger";

const router = Router();

// ─── Rate limit store ────────────────────────────────────────────────────────
interface IpRecord { count: number; resetAt: number }
const ipStore = new Map<string, IpRecord>();
const FREE_LIMIT = 3;

function getResetAt(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
}
function checkRateLimit(ip: string, hasAuth: boolean): { allowed: boolean; remaining: number; resetAt: number } {
  if (hasAuth) return { allowed: true, remaining: 999, resetAt: 0 };
  const now = Date.now();
  let rec = ipStore.get(ip);
  if (!rec || now >= rec.resetAt) { rec = { count: 0, resetAt: getResetAt() }; ipStore.set(ip, rec); }
  if (rec.count >= FREE_LIMIT) return { allowed: false, remaining: 0, resetAt: rec.resetAt };
  rec.count++;
  return { allowed: true, remaining: FREE_LIMIT - rec.count, resetAt: rec.resetAt };
}
function getClientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return (Array.isArray(fwd) ? fwd[0] : fwd).split(",")[0].trim();
  return req.socket.remoteAddress ?? "unknown";
}
function isValidPsyToken(token: string): boolean {
  if (!token || token.length < 8) return false;
  try { const d = Buffer.from(token, "base64").toString("utf8"); return d.includes("psyko") || d.includes("jorge") || d.length > 10; }
  catch { return false; }
}

const CHAIN_IDS: Record<string, string> = {
  eth: "1", bsc: "56", base: "8453", arbitrum: "42161", polygon: "137", avax: "43114",
};

// ─── Fetch helpers ───────────────────────────────────────────────────────────
async function fetchJSON<T>(url: string, opts?: RequestInit, timeoutMs = 8000): Promise<T | null> {
  try {
    const r = await fetch(url, { ...opts, signal: AbortSignal.timeout(timeoutMs) });
    if (!r.ok) return null;
    return await r.json() as T;
  } catch { return null; }
}

// ─── POST /api/scan/token ────────────────────────────────────────────────────
router.post("/scan/token", async (req: Request, res: Response) => {
  const { address, chain = "eth" } = req.body as { address?: string; chain?: string };
  if (!address) { res.status(400).json({ ok: false, error: "Missing address" }); return; }

  const ip = getClientIp(req);
  const psyToken = (req.headers["x-psy-token"] as string) ?? "";
  const hasAuth = isValidPsyToken(psyToken);
  const rl = checkRateLimit(ip, hasAuth);
  if (!rl.allowed) {
    res.status(429).json({ ok: false, error: "Límite diario alcanzado", remaining: 0, resetAt: new Date(rl.resetAt).toISOString(), requiresPlan: true });
    return;
  }
  res.setHeader("x-remaining-scans", String(rl.remaining));
  res.setHeader("x-rate-limit-total", String(FREE_LIMIT));

  const isSolana = chain === "solana";
  const chainId = CHAIN_IDS[chain] ?? "1";
  const sources: Array<{ name: string; status: "ok" | "warn" | "err"; msg?: string }> = [];

  // ── All fetches in parallel ──────────────────────────────────────────────
  const [gpRaw, dexRaw, rugRaw, rugSummaryRaw, cbRaw, cgRaw, dgRaw] = await Promise.all([

    // 1) GoPlus Security
    fetchJSON<{ result?: Record<string, Record<string, unknown>> }>(
      isSolana
        ? `https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${address}`
        : `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address}`
    ),

    // 2) DexScreener — pairs
    fetchJSON<{ pairs?: Record<string, unknown>[] }>(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`
    ),

    // 3) RugCheck FULL report (Solana) — same data as Token Sniffer
    isSolana
      ? fetchJSON<Record<string, unknown>>(`https://api.rugcheck.xyz/v1/tokens/${address}/report`)
      : Promise.resolve(null),

    // 4) RugCheck summary (fallback / extra risks list)
    isSolana
      ? fetchJSON<Record<string, unknown>>(`https://api.rugcheck.xyz/v1/tokens/${address}/report/summary`)
      : Promise.resolve(null),

    // 5) Coinbase — BTC/ETH spot price (free, no key)
    fetchJSON<{ data?: { amount?: string; currency?: string } }>(
      `https://api.coinbase.com/v2/prices/${isSolana ? "SOL" : chain === "eth" ? "ETH" : chain === "bsc" ? "BNB" : "ETH"}-USD/spot`
    ),

    // 6) CoinGlass — BTC OI & funding (free tier, no key needed for public endpoint)
    fetchJSON<Record<string, unknown>>(
      `https://open-api.coinglass.com/public/v2/open_interest?symbol=BTC`,
      {},
      5000
    ),

    // 7) DeGate — on-chain ZK-Rollup DEX (ETH only, public API, no key)
    !isSolana
      ? fetchJSON<unknown>(
          `https://v1-mainnet-backend.degate.com/order-book-api/ticker/24hr`,
          { headers: { "User-Agent": "PSYCHOMETRIKS/1.0" } },
          7000
        )
      : Promise.resolve(null),
  ]);

  // ── GoPlus ──────────────────────────────────────────────────────────────
  let gp: Record<string, unknown> | null = null;
  if (gpRaw?.result) {
    const key = isSolana ? address : address.toLowerCase();
    if (gpRaw.result[key]) { gp = gpRaw.result[key]; sources.push({ name: "GoPlus", status: "ok" }); }
    else sources.push({ name: "GoPlus", status: "warn", msg: "No data" });
  } else {
    sources.push({ name: "GoPlus", status: "err" });
    logger.warn("GoPlus returned null");
  }

  // ── DexScreener ─────────────────────────────────────────────────────────
  let dex: Record<string, unknown> | null = null;
  if (dexRaw?.pairs?.length) {
    // Pick pair with highest liquidity
    const sorted = [...dexRaw.pairs].sort((a, b) => {
      const la = parseFloat((a as { liquidity?: { usd?: string } }).liquidity?.usd ?? "0");
      const lb = parseFloat((b as { liquidity?: { usd?: string } }).liquidity?.usd ?? "0");
      return lb - la;
    });
    dex = sorted[0];
    sources.push({ name: "DexScreener", status: "ok" });
  } else {
    sources.push({ name: "DexScreener", status: "warn", msg: "No pairs" });
  }

  // ── RugCheck full report ─────────────────────────────────────────────────
  let rug: Record<string, unknown> | null = null;
  if (isSolana) {
    if (rugRaw) {
      rug = rugRaw;
      // Merge summary risks if available
      if (rugSummaryRaw && Array.isArray((rugSummaryRaw as { risks?: unknown[] }).risks)) {
        (rug as Record<string, unknown>)["summaryRisks"] = (rugSummaryRaw as { risks?: unknown[] }).risks;
      }
      sources.push({ name: "RugCheck", status: "ok" });
    } else if (rugSummaryRaw) {
      rug = rugSummaryRaw;
      sources.push({ name: "RugCheck", status: "warn", msg: "Summary only" });
    } else {
      sources.push({ name: "RugCheck", status: "err" });
    }
  } else {
    sources.push({ name: "RugCheck", status: "warn", msg: "Solana only" });
  }

  // ── Coinbase price ───────────────────────────────────────────────────────
  let coinbasePrice: { amount: string; currency: string } | null = null;
  if (cbRaw?.data?.amount) {
    coinbasePrice = { amount: cbRaw.data.amount, currency: cbRaw.data.currency ?? "USD" };
    sources.push({ name: "Coinbase", status: "ok" });
  } else {
    sources.push({ name: "Coinbase", status: "warn", msg: "No data" });
  }

  // ── CoinGlass OI ────────────────────────────────────────────────────────
  let coinglass: Record<string, unknown> | null = null;
  if (cgRaw) {
    coinglass = cgRaw;
    sources.push({ name: "CoinGlass", status: "ok" });
  } else {
    sources.push({ name: "CoinGlass", status: "warn", msg: "No data" });
  }

  // ── DeGate DEX (ETH only) ────────────────────────────────────────────────
  type DgItem = { symbol: string; lastPrice: string; priceChangePercent: string; quoteVolume?: string; volume?: string; bidPrice?: string; askPrice?: string };
  let degate: { listed: boolean; symbol?: string; price?: string; volume24h?: string; priceChange24h?: string; bidPrice?: string; askPrice?: string; marketCount?: number } | null = null;
  if (!isSolana) {
    const dgArr: DgItem[] | null =
      Array.isArray(dgRaw) ? (dgRaw as DgItem[])
      : Array.isArray((dgRaw as Record<string, unknown>)?.data) ? ((dgRaw as { data: DgItem[] }).data)
      : null;
    if (dgArr && dgArr.length > 0) {
      const tokenSym = (gp as Record<string, unknown>)?.["token_symbol"] as string | undefined;
      const sym = tokenSym?.toUpperCase();
      const match = sym
        ? dgArr.find(t =>
            t.symbol === `${sym}-USDC` || t.symbol === `W${sym}-USDC` ||
            t.symbol === `${sym}-USDT` || t.symbol.startsWith(`${sym}-`)
          )
        : null;
      if (match) {
        degate = {
          listed: true, symbol: match.symbol, price: match.lastPrice,
          volume24h: match.quoteVolume ?? match.volume,
          priceChange24h: match.priceChangePercent,
          bidPrice: match.bidPrice, askPrice: match.askPrice,
          marketCount: dgArr.length,
        };
        sources.push({ name: "DeGate", status: "ok" });
      } else {
        degate = { listed: false, marketCount: dgArr.length };
        sources.push({ name: "DeGate", status: "warn", msg: "Not listed" });
      }
    } else {
      sources.push({ name: "DeGate", status: "err" });
    }
  }

  res.json({ ok: true, gp, dex, rug, coinbasePrice, coinglass, degate, sources, remaining: rl.remaining, hasAuth });
});

// ─── GET /api/scan/status ────────────────────────────────────────────────────
router.get("/scan/status", (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const psyToken = (req.headers["x-psy-token"] as string) ?? "";
  const hasAuth = isValidPsyToken(psyToken);
  if (hasAuth) { res.json({ ok: true, remaining: 999, total: FREE_LIMIT, hasAuth: true }); return; }
  const now = Date.now();
  const rec = ipStore.get(ip);
  if (!rec || now >= rec.resetAt) { res.json({ ok: true, remaining: FREE_LIMIT, total: FREE_LIMIT, hasAuth: false }); return; }
  res.json({ ok: true, remaining: Math.max(0, FREE_LIMIT - rec.count), total: FREE_LIMIT, hasAuth: false, resetAt: new Date(rec.resetAt).toISOString() });
});

export default router;
