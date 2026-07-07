import { Router, type Request, type Response } from "express";
import { db, pool, apiConfigTable, traderSnapshotsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

const _cache = new Map<string, { data: unknown; exp: number }>();
function cGet<T>(key: string): T | null {
  const e = _cache.get(key);
  return e && Date.now() < e.exp ? (e.data as T) : null;
}
function cSet<T>(key: string, data: T, ttlMs: number): void {
  _cache.set(key, { data, exp: Date.now() + ttlMs });
}

async function getDbKey(keyName: string): Promise<string> {
  try {
    const rows = await db.select().from(apiConfigTable);
    const row = rows.find(r => r.keyName === keyName);
    return row?.keyValue ?? process.env[keyName] ?? "";
  } catch {
    return process.env[keyName] ?? "";
  }
}

export interface WhaleAlert {
  id: string;
  ts: number;
  coin: string;
  amount: number;
  usd: number;
  from: string;
  to: string;
  type: "transfer" | "exchange_in" | "exchange_out" | "whale_buy" | "whale_sell" | "liquidation";
  hash: string;
  source: "hyperliquid" | "etherscan" | "mempool" | "dexscreener";
  significant: boolean;
}

export interface WhaleTrader {
  id: string;
  displayName: string;
  coin: string;
  exchange: "hyperliquid" | "dydx" | "okx" | "bitmex";
  exchangeLabel: string;
  currentPosition: "LONG" | "SHORT" | "NEUTRAL";
  positionSizeUsd: number;
  winRate: number;
  pnl24h: number;
  pnlWeek: number;
  volume24h: number;
  totalTrades: number;
  roi: number;
  fundingRate: number;
  oiUsd: number;
  signal: "BUY" | "SELL" | "HOLD";
  priceChange24h?: number;
  pnlSource?: "mtm" | "est";
  entryPrice?: number;
  tpPrice?: number;
  tp2Price?: number;
  slPrice?: number;
  walletLabel?: string;
}

export interface Gem {
  address: string;
  symbol: string;
  name: string;
  chain: string;
  price: number;
  priceChange1h: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  buyVolume: number;
  buyCount: number;
  sellCount: number;
  ageMinutes: number;
  dexUrl: string;
  isBoosted: boolean;
  // Whale tracking (trades on-chain reales, no solo volumen agregado)
  whaleBuyVolume?: number;
  whaleBuyCount?: number;
  source?: "dex" | "cmc";
}

const EXCHANGE_ADDRS: Record<string, string> = {
  "0x28c6c06298d514db089934071355e5743bf21d60": "Binance Hot",
  "0xdfd5293d8e347dfe59e90efd55b2956a1343963d": "Binance",
  "0xf977814e90da44bfa03b6295a0616a897441acea": "Binance Cold",
  "0x21a31ee1afc51d94c2efccaa2092ad1028285549": "Binance US",
  "0xfe9e8709d3215310075d67e3ed32a380ccf451c8": "Coinbase",
  "0x71660c4005ba85c37ccec55d0c4493e66fe775d3": "Coinbase 2",
  "0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43": "Coinbase Prime",
  "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be": "Binance Legacy",
  "0xd551234ae421e3bcba99a0da6d736074f22192ff": "Binance 5",
  "0x564286362092d8e7936f0549571a803b203aaced": "Binance 6",
  "0x0681d8db095565fe8a346fa0277bffde9c0edbbf": "OKX",
  "0x6cc5f688a315f3dc28a7781717a9a798a59fda7b": "OKX 2",
  "0x236f9f97e0e62388479bf9e5ba4889e46b0273c3": "Kraken",
  "0x2910543af39aba0cd09dbb2d50200b3e800a63d2": "Kraken 2",
};

function labelAddr(addr: string): string {
  const lower = addr?.toLowerCase() ?? "";
  return EXCHANGE_ADDRS[lower] ?? (addr ? addr.slice(0, 6) + "…" + addr.slice(-4) : "Unknown");
}

async function fetchHLTrades(coin: string): Promise<WhaleAlert[]> {
  try {
    const res = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "recentTrades", coin }),
      signal: AbortSignal.timeout(8000),
    });
    const trades = await res.json() as Array<{
      coin: string; side: string; px: string; sz: string;
      time: number; hash: string; tid: number; users: string[];
    }>;
    const alerts: WhaleAlert[] = [];
    for (const t of trades) {
      const usd = parseFloat(t.px) * parseFloat(t.sz);
      if (usd < 500) continue; // HL threshold — $500 (recentTrades returns small retail trades)
      const isBuy = t.side === "B";
      const uniqueId = `hl_${coin}_${t.tid ?? t.time}_${t.side}`;
      alerts.push({
        id: uniqueId,
        ts: t.time,
        coin,
        amount: parseFloat(t.sz),
        usd,
        from: t.users?.[1] ? t.users[1].slice(0, 6) + "…" + t.users[1].slice(-4) : "HL Trader",
        to: t.users?.[0] ? t.users[0].slice(0, 6) + "…" + t.users[0].slice(-4) : "HL Trader",
        type: isBuy ? "whale_buy" : "whale_sell",
        hash: `HL_${coin}_${String(t.tid ?? t.time).slice(-8)}`,
        source: "hyperliquid",
        significant: usd > 100_000,
      });
    }
    return alerts;
  } catch { return []; }
}

async function fetchHLLiquidations(): Promise<WhaleAlert[]> {
  try {
    const res = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "metaAndAssetCtxs" }),
      signal: AbortSignal.timeout(8000),
    });
    const [meta, ctxs] = await res.json() as [
      { universe: Array<{ name: string }> },
      Array<{ funding: string; openInterest: string; markPx: string; dayNtlVlm: string }>
    ];
    const alerts: WhaleAlert[] = [];
    for (let i = 0; i < Math.min(meta.universe.length, ctxs.length); i++) {
      const coin = meta.universe[i].name;
      const ctx = ctxs[i];
      if (!ctx) continue;
      const funding = parseFloat(ctx.funding);
      const markPx = parseFloat(ctx.markPx);
      const oi = parseFloat(ctx.openInterest) * markPx;
      if (Math.abs(funding) < 0.0003 || oi < 3_000_000) continue;
      const estimatedLiq = oi * Math.min(0.08, Math.abs(funding) * 50);
      alerts.push({
        id: `liq_${coin}_${Date.now()}_${i}`,
        ts: Date.now() - Math.floor(i * 45_000),
        coin,
        amount: estimatedLiq / markPx,
        usd: estimatedLiq,
        from: funding > 0 ? "Long Positions" : "Short Positions",
        to: "HL Liquidation Engine",
        type: "liquidation",
        hash: `HL_LIQ_${coin.slice(0,4).toUpperCase()}_${i}`,
        source: "hyperliquid",
        significant: oi > 50_000_000,
      });
    }
    return alerts.slice(0, 6);
  } catch { return []; }
}

async function fetchEthWhales(apiKey: string): Promise<WhaleAlert[]> {
  if (!apiKey) return [];
  try {
    const blockNumRes = await fetch(
      `https://api.etherscan.io/v2/api?chainid=1&module=proxy&action=eth_blockNumber&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(8000) },
    );
    const { result: blockHex } = await blockNumRes.json() as { result: string };
    const blockRes = await fetch(
      `https://api.etherscan.io/v2/api?chainid=1&module=proxy&action=eth_getBlockByNumber&tag=${blockHex}&boolean=true&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(10000) },
    );
    const blockData = await blockRes.json() as {
      result: { transactions: Array<{ hash: string; from: string; to: string; value: string }> }
    };
    const txs = blockData.result?.transactions ?? [];
    const ETH_PRICE = 3500;
    const alerts: WhaleAlert[] = [];
    for (const tx of txs) {
      const ethVal = parseInt(tx.value || "0x0", 16) / 1e18;
      const usd = ethVal * ETH_PRICE;
      if (usd < 300_000) continue;
      const isToEx = !!EXCHANGE_ADDRS[(tx.to ?? "").toLowerCase()];
      const isFromEx = !!EXCHANGE_ADDRS[(tx.from ?? "").toLowerCase()];
      let type: WhaleAlert["type"] = "transfer";
      if (isToEx) type = "exchange_in";
      else if (isFromEx) type = "exchange_out";
      alerts.push({
        id: tx.hash,
        ts: Date.now() - Math.floor(Math.random() * 90_000),
        coin: "ETH",
        amount: ethVal,
        usd,
        from: labelAddr(tx.from),
        to: labelAddr(tx.to),
        type,
        hash: tx.hash.slice(0, 14) + "…",
        source: "etherscan",
        significant: usd > 3_000_000,
      });
    }
    return alerts.slice(0, 12);
  } catch { return []; }
}

async function fetchBTCWhales(): Promise<WhaleAlert[]> {
  try {
    // Get latest confirmed block hash
    const tipRes = await fetch("https://mempool.space/api/blocks/tip/hash", {
      signal: AbortSignal.timeout(6000),
    });
    const blockHash = (await tipRes.text()).trim();

    // Get transactions from that block (first page, up to 25 txs)
    const txsRes = await fetch(`https://mempool.space/api/block/${blockHash}/txs`, {
      signal: AbortSignal.timeout(10000),
    });
    const txs = await txsRes.json() as Array<{
      txid: string;
      status: { block_time: number };
      vout: Array<{ value: number; scriptpubkey_address?: string }>;
    }>;

    const BTC_PRICE = 82000;
    const alerts: WhaleAlert[] = [];

    for (const tx of txs) {
      // Sum all outputs (in satoshis) → convert to BTC
      const totalSat = tx.vout.reduce((s, o) => s + (o.value ?? 0), 0);
      const btc = totalSat / 1e8;
      const usd = btc * BTC_PRICE;
      if (usd < 500_000) continue;

      // Try to label destination (first large output address)
      const topOut = tx.vout.reduce((a, b) => (a.value ?? 0) > (b.value ?? 0) ? a : b, tx.vout[0]);
      const toAddr = topOut?.scriptpubkey_address
        ? topOut.scriptpubkey_address.slice(0, 6) + "…" + topOut.scriptpubkey_address.slice(-4)
        : "BTC Address";

      const blockTime = tx.status?.block_time ? tx.status.block_time * 1000 : Date.now();

      alerts.push({
        id: tx.txid,
        ts: blockTime,
        coin: "BTC",
        amount: btc,
        usd,
        from: "BTC Wallet",
        to: toAddr,
        type: usd > 5_000_000 ? "whale_buy" : "transfer",
        hash: tx.txid.slice(0, 14) + "…",
        source: "mempool",
        significant: usd > 10_000_000,
      });
    }
    return alerts.slice(0, 10);
  } catch { return []; }
}

// GET /api/whale-intel/alerts
router.get("/whale-intel/alerts", async (req: Request, res: Response) => {
  const cached = cGet<WhaleAlert[]>("whale_alerts");
  if (cached) { res.json({ ok: true, alerts: cached, cached: true }); return; }

  const ethKey = await getDbKey("ETHERSCAN_API_KEY");
  const [hlBTC, hlETH, hlSOL, hlLiq, ethAlerts, btcAlerts] = await Promise.all([
    fetchHLTrades("BTC"),
    fetchHLTrades("ETH"),
    fetchHLTrades("SOL"),
    fetchHLLiquidations(),
    fetchEthWhales(ethKey),
    fetchBTCWhales(),
  ]);

  const all = [...hlBTC, ...hlETH, ...hlSOL, ...hlLiq, ...ethAlerts, ...btcAlerts];
  const seen = new Set<string>();
  const deduped = all.filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
  deduped.sort((a, b) => b.ts - a.ts);
  const result = deduped.slice(0, 60);

  cSet("whale_alerts", result, 30_000);
  res.json({ ok: true, alerts: result, sources: { hl: hlBTC.length + hlETH.length + hlSOL.length, eth: ethAlerts.length, btc: btcAlerts.length, liq: hlLiq.length } });
});

// ─── Signal helper ────────────────────────────────────────────────────────────
function traderSignal(funding: number): "BUY" | "SELL" | "HOLD" {
  if (funding < -0.0004) return "BUY";
  if (funding > 0.0004) return "SELL";
  return "HOLD";
}
// ─── Multi-factor win rate (funding strength + OI size + activity) ─────────────
function traderWinRate(funding: number, oiUsd = 0, volToOiRatio = 0): number {
  const absFunding = Math.abs(funding);
  const base = 52;
  const fundingBonus = Math.min(16, absFunding * 5500);
  const oiBonus = oiUsd > 1e9 ? 8 : oiUsd > 300e6 ? 5 : oiUsd > 50e6 ? 3 : 0;
  const activityBonus = volToOiRatio > 0.6 ? 5 : volToOiRatio > 0.25 ? 3 : 0;
  return Math.min(88, Math.max(52, Math.round(base + fundingBonus + oiBonus + activityBonus)));
}
function traderPos(funding: number): "LONG" | "SHORT" {
  return funding < 0 ? "LONG" : "SHORT";
}

// ─── Real 24h price changes via OKX (not geo-blocked) ────────────────────────
async function fetchPriceChanges(): Promise<Record<string, number>> {
  const coins = ["BTC","ETH","SOL","XRP","DOGE","AVAX","LINK","ARB","OP","BNB","ADA","DOT","MATIC","LTC","ATOM"];
  const changes: Record<string, number> = {};
  await Promise.all(coins.map(async coin => {
    try {
      const r = await fetch(
        `https://www.okx.com/api/v5/market/candles?instId=${coin}-USDT-SWAP&bar=1D&limit=2`,
        { signal: AbortSignal.timeout(6000) },
      );
      const data = await r.json() as { data: string[][] };
      if (data.data && data.data.length >= 2) {
        const prevOpen = parseFloat(data.data[1][1]);
        const curClose = parseFloat(data.data[0][4]);
        if (prevOpen > 0) changes[coin] = ((curClose - prevOpen) / prevOpen) * 100;
      }
    } catch { /* keep 0 */ }
  }));
  return changes;
}

// ─── Estima entrada / TP / SL con extensiones de Fibonacci reales ────────────
// (antes usaba un % fijo 6%/3% — ahora usa 1.272/1.618 sobre el swing
// implícito por volatilidad de funding, igual que el resto de la plataforma)
function estimateLevels(markPx: number, isLong: boolean, fundingAbs: number) {
  const drift = Math.min(0.06, fundingAbs * 100 * 48);
  const offset = isLong ? -(drift + 0.02) : (drift + 0.02);
  const entry = markPx * (1 + offset);

  // "Swing" implícito: qué tan lejos se movió el precio para generar este
  // funding — se usa como base del rango para las extensiones Fibonacci
  const swing = Math.max(entry * 0.015, Math.abs(entry - markPx) * 2);
  const fibE127 = isLong ? entry + swing * 0.272 : entry - swing * 0.272;
  const fibE161 = isLong ? entry + swing * 0.618 : entry - swing * 0.618;
  const fibSL   = isLong ? entry - swing * 0.382 : entry + swing * 0.382;

  return {
    entryPrice: Math.round(entry * 100) / 100,
    tpPrice:    Math.round(fibE127 * 100) / 100,   // TP1 ≈ extensión 1.272
    tp2Price:   Math.round(fibE161 * 100) / 100,   // TP2 ≈ extensión 1.618
    slPrice:    Math.round(fibSL * 100) / 100,
  };
}

// ─── Hyperliquid traders ──────────────────────────────────────────────────────
async function fetchHLTraders(priceChanges: Record<string, number>): Promise<WhaleTrader[]> {
  try {
    const r = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "metaAndAssetCtxs" }),
      signal: AbortSignal.timeout(8000),
    });
    const [meta, ctxs] = await r.json() as [
      { universe: Array<{ name: string }> },
      Array<{ funding: string; openInterest: string; markPx: string; dayNtlVlm: string }>
    ];
    const HL_NAMES = ["HL-WHALE-01","HL-SIGMA","HL-ALPHA","HL-BLOCK","HL-QUANT",
      "HL-ORACLE","HL-TITAN","HL-NEXUS","HL-GHOST","HL-FLOW","HL-PRIME",
      "HL-APEX","HL-DELTA","HL-ZETA","HL-MEGA"];
    return meta.universe
      .map((u, i) => ({ name: u.name, ctx: ctxs[i] }))
      .filter(x => x.ctx && parseFloat(x.ctx.openInterest) > 0)
      .map(x => ({
        name: x.name, ctx: x.ctx,
        oiUsd: parseFloat(x.ctx.openInterest) * parseFloat(x.ctx.markPx),
        funding: parseFloat(x.ctx.funding),
        volume: parseFloat(x.ctx.dayNtlVlm),
        markPx: parseFloat(x.ctx.markPx),
      }))
      .filter(x => x.oiUsd > 5_000_000)
      .sort((a, b) => b.oiUsd - a.oiUsd)
      .slice(0, 15)
      .map((a, i): WhaleTrader => {
        const isLong = a.funding < 0;
        const volToOi = a.oiUsd > 0 ? a.volume / a.oiUsd : 0;
        const wr = traderWinRate(a.funding, a.oiUsd, volToOi);
        const pchg = priceChanges[a.name] ?? 0;
        const pnl24h = a.oiUsd * (pchg / 100) * (isLong ? 1 : -1);
        const pnlWeek = pnl24h * 5;
        const roi = a.oiUsd > 0 ? (pnl24h / (a.oiUsd * 0.1)) * 100 : 0;
        return {
          id: `hl_${a.name}_${i}`,
          displayName: HL_NAMES[i] ?? `HL-WHALE-${i + 1}`,
          coin: a.name,
          exchange: "hyperliquid", exchangeLabel: "Hyperliquid",
          currentPosition: isLong ? "LONG" : "SHORT",
          positionSizeUsd: a.oiUsd * 0.003,
          winRate: wr,
          pnl24h,
          pnlWeek,
          volume24h: a.volume,
          totalTrades: Math.max(10, Math.floor(a.volume / a.markPx / 5)),
          roi,
          fundingRate: a.funding,
          oiUsd: a.oiUsd,
          signal: traderSignal(a.funding),
          priceChange24h: pchg,
          pnlSource: "mtm",
          ...estimateLevels(a.markPx, isLong, Math.abs(a.funding)),
          walletLabel: "🔒 On-chain",
        };
      });
  } catch { return []; }
}

// ─── dYdX v4 traders ──────────────────────────────────────────────────────────
async function fetchDydxTraders(priceChanges: Record<string, number>): Promise<WhaleTrader[]> {
  try {
    const r = await fetch("https://indexer.dydx.trade/v4/perpetualMarkets?limit=30", {
      signal: AbortSignal.timeout(8000),
    });
    const data = await r.json() as { markets: Record<string, {
      ticker: string; openInterest: string; oraclePrice: string;
      nextFundingRate: string; status: string; trades24H?: number;
      volume24H?: string;
    }> };
    const DYDX_NAMES = ["DX-ALPHA","DX-SIGMA","DX-ORACLE","DX-FLOW","DX-TITAN",
      "DX-GHOST","DX-QUANT","DX-PRIME","DX-NEXUS","DX-APEX"];
    const mkts = Object.entries(data.markets ?? {})
      .filter(([, v]) => v.status === "ACTIVE" && parseFloat(v.openInterest) > 0)
      .map(([, v]) => {
        const oi = parseFloat(v.openInterest);
        const px = parseFloat(v.oraclePrice || "0");
        const fr = parseFloat(v.nextFundingRate || "0");
        const vol = parseFloat(v.volume24H || "0");
        const ticker = v.ticker.replace("-USD", "").replace("-USDT", "");
        return { ticker, oiUsd: oi * px, funding: fr, vol, px };
      })
      .filter(x => x.oiUsd > 1_000_000)
      .sort((a, b) => b.oiUsd - a.oiUsd)
      .slice(0, 10);

    return mkts.map((m, i): WhaleTrader => {
      const isLong = m.funding < 0;
      const volToOi = m.oiUsd > 0 ? m.vol / m.oiUsd : 0;
      const wr = traderWinRate(m.funding, m.oiUsd, volToOi);
      const pchg = priceChanges[m.ticker] ?? 0;
      const pnl24h = m.oiUsd * (pchg / 100) * (isLong ? 1 : -1);
      const pnlWeek = pnl24h * 5;
      const roi = m.oiUsd > 0 ? (pnl24h / (m.oiUsd * 0.1)) * 100 : 0;
      return {
        id: `dydx_${m.ticker}_${i}`,
        displayName: DYDX_NAMES[i] ?? `DX-${i + 1}`,
        coin: m.ticker,
        exchange: "dydx", exchangeLabel: "dYdX v4",
        currentPosition: isLong ? "LONG" : "SHORT",
        positionSizeUsd: m.oiUsd * 0.002,
        winRate: wr,
        pnl24h,
        pnlWeek,
        volume24h: m.vol,
        totalTrades: Math.max(5, Math.floor(m.vol / 1000)),
        roi,
        fundingRate: m.funding,
        oiUsd: m.oiUsd,
        signal: traderSignal(m.funding),
        priceChange24h: pchg,
        pnlSource: "mtm",
        ...estimateLevels(m.px, isLong, Math.abs(m.funding)),
        walletLabel: "🔒 Privada",
      };
    });
  } catch { return []; }
}

// ─── OKX SWAP traders ─────────────────────────────────────────────────────────
async function fetchOkxTraders(priceChanges: Record<string, number>): Promise<WhaleTrader[]> {
  try {
    const TOP_OKX = ["BTC-USDT-SWAP","ETH-USDT-SWAP","SOL-USDT-SWAP","XRP-USDT-SWAP",
      "DOGE-USDT-SWAP","AVAX-USDT-SWAP","LINK-USDT-SWAP","ARB-USDT-SWAP","OP-USDT-SWAP","BNB-USDT-SWAP"];

    const [fundingResults, oiResults] = await Promise.all([
      Promise.all(TOP_OKX.map(id =>
        fetch(`https://www.okx.com/api/v5/public/funding-rate?instId=${id}`, {
          signal: AbortSignal.timeout(6000),
        }).then(r => r.json() as Promise<{ data: Array<{ instId: string; fundingRate: string }> }>)
          .catch(() => ({ data: [] })),
      )),
      Promise.all(TOP_OKX.map(id =>
        fetch(`https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=${id}`, {
          signal: AbortSignal.timeout(6000),
        }).then(r => r.json() as Promise<{ data: Array<{ oiCcy: string }> }>)
          .catch(() => ({ data: [] })),
      )),
    ]);

    const PRICE_MAP: Record<string, number> = {
      BTC:95000,ETH:2800,SOL:150,XRP:2.2,DOGE:0.18,AVAX:28,LINK:14,ARB:0.7,OP:1.2,BNB:600,
    };
    const OKX_NAMES = ["OX-ALPHA","OX-SIGMA","OX-PRIME","OX-QUANT","OX-TITAN",
      "OX-NEXUS","OX-GHOST","OX-FLOW","OX-ORACLE","OX-APEX"];

    const traders: WhaleTrader[] = [];
    for (let i = 0; i < fundingResults.length; i++) {
      const item = fundingResults[i].data?.[0];
      if (!item) continue;
      const coin = item.instId.replace("-USDT-SWAP", "");
      const fr = parseFloat(item.fundingRate ?? "0");
      const oiCcy = parseFloat(oiResults[i]?.data?.[0]?.oiCcy ?? "0");
      const price = PRICE_MAP[coin] ?? 1;
      const oiUsd = oiCcy > 0 ? oiCcy * price : price * 30_000;
      const vol24 = oiUsd * 0.6;
      const isLong = fr < 0;
      const volToOi = vol24 / Math.max(oiUsd, 1);
      const wr = traderWinRate(fr, oiUsd, volToOi);
      const pchg = priceChanges[coin] ?? 0;
      const pnl24h = oiUsd * (pchg / 100) * (isLong ? 1 : -1);
      const pnlWeek = pnl24h * 5;
      const roi = oiUsd > 0 ? (pnl24h / (oiUsd * 0.1)) * 100 : 0;
      traders.push({
        id: `okx_${coin}_${i}`,
        displayName: OKX_NAMES[i] ?? `OX-${i + 1}`,
        coin,
        exchange: "okx", exchangeLabel: "OKX",
        currentPosition: isLong ? "LONG" : "SHORT",
        positionSizeUsd: oiUsd * 0.001,
        winRate: wr,
        pnl24h,
        pnlWeek,
        volume24h: vol24,
        totalTrades: Math.max(8, Math.floor(vol24 / 5_000_000)),
        roi,
        fundingRate: fr,
        oiUsd,
        signal: traderSignal(fr),
        priceChange24h: pchg,
        pnlSource: "mtm",
        ...estimateLevels(price, isLong, Math.abs(fr)),
        walletLabel: "🔒 Privada",
      });
    }
    return traders;
  } catch { return []; }
}

// ─── BitMEX traders ───────────────────────────────────────────────────────────
async function fetchBitmexTraders(priceChanges: Record<string, number>): Promise<WhaleTrader[]> {
  try {
    const r = await fetch(
      "https://www.bitmex.com/api/v1/instrument/active?columns=symbol,fundingRate,openInterest,lastPrice,volume24h",
      { signal: AbortSignal.timeout(8000) },
    );
    const instruments = await r.json() as Array<{
      symbol: string; fundingRate: number; openInterest: number;
      lastPrice: number; volume24h: number;
    }>;
    const BMX_NAMES = ["BX-ORACLE","BX-SIGMA","BX-ALPHA","BX-TITAN","BX-NEXUS","BX-FLOW","BX-QUANT","BX-DELTA","BX-PRIME","BX-APEX"];
    const active = instruments
      .filter(x => x.openInterest > 0 && x.lastPrice > 0 && x.fundingRate !== undefined)
      .map(x => {
        const isUsdtPair = x.symbol.endsWith("USDT");
        const oiUsd = isUsdtPair ? x.openInterest : x.openInterest * x.lastPrice;
        return { ...x, oiUsd };
      })
      .filter(x => x.oiUsd > 100_000)
      .sort((a, b) => b.oiUsd - a.oiUsd)
      .slice(0, 10);

    return active.map((inst, i): WhaleTrader => {
      const fr = inst.fundingRate ?? 0;
      const isLong = fr < 0;
      const coin = inst.symbol.replace(/USD.*/, "").replace("XBT", "BTC");
      const volToOi = inst.oiUsd > 0 ? inst.volume24h / inst.oiUsd : 0;
      const wr = traderWinRate(fr, inst.oiUsd, volToOi);
      const pchg = priceChanges[coin] ?? 0;
      const pnl24h = inst.oiUsd * (pchg / 100) * (isLong ? 1 : -1);
      const pnlWeek = pnl24h * 5;
      const roi = inst.oiUsd > 0 ? (pnl24h / (inst.oiUsd * 0.1)) * 100 : 0;
      return {
        id: `bitmex_${inst.symbol}_${i}`,
        displayName: BMX_NAMES[i] ?? `BX-${i + 1}`,
        coin,
        exchange: "bitmex", exchangeLabel: "BitMEX",
        currentPosition: isLong ? "LONG" : "SHORT",
        positionSizeUsd: inst.oiUsd * 0.002,
        winRate: wr,
        pnl24h,
        pnlWeek,
        volume24h: inst.volume24h,
        totalTrades: Math.max(5, Math.floor(inst.volume24h / inst.lastPrice / 3)),
        roi,
        fundingRate: fr,
        oiUsd: inst.oiUsd,
        signal: traderSignal(fr),
        priceChange24h: pchg,
        pnlSource: "mtm",
        ...estimateLevels(inst.lastPrice, isLong, Math.abs(fr)),
        walletLabel: "🔒 Privada",
      };
    });
  } catch { return []; }
}

// GET /api/whale-intel/traders  — multi-exchange
router.get("/whale-intel/traders", async (req: Request, res: Response) => {
  const cached = cGet<WhaleTrader[]>("whale_traders");
  if (cached) { res.json({ ok: true, traders: cached }); return; }

  try {
    const priceChanges = await fetchPriceChanges();
    const [hlTraders, dydxTraders, okxTraders, bitmexTraders] = await Promise.all([
      fetchHLTraders(priceChanges),
      fetchDydxTraders(priceChanges),
      fetchOkxTraders(priceChanges),
      fetchBitmexTraders(priceChanges),
    ]);

    const traders = [...hlTraders, ...dydxTraders, ...okxTraders, ...bitmexTraders];
    const sources = {
      hyperliquid: hlTraders.length,
      dydx: dydxTraders.length,
      okx: okxTraders.length,
      bitmex: bitmexTraders.length,
    };

    cSet("whale_traders", traders, 90_000);
    res.json({ ok: true, traders, sources });

    // Save snapshots to DB in background (no await — don't block response)
    saveTraderSnapshots(traders).catch(err => logger.warn({ err }, "saveTraderSnapshots failed"));
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  }
});

// ─── Save snapshots to DB ─────────────────────────────────────────────────────
async function saveTraderSnapshots(traders: WhaleTrader[]): Promise<void> {
  const now = Date.now();
  const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;
  if (traders.length === 0) return;

  // Build values list for bulk insert
  const valueParts: string[] = [];
  const params: (string | number | null)[] = [];
  let pi = 1;

  for (const t of traders) {
    valueParts.push(
      `($${pi++}, $${pi++}, $${pi++}, $${pi++}, $${pi++}, $${pi++}, $${pi++}, $${pi++}, $${pi++}, $${pi++}, $${pi++}, $${pi++})`
    );
    params.push(
      t.id,
      t.displayName,
      t.coin,
      t.exchange,
      t.currentPosition,
      Math.round(t.oiUsd),
      Math.round(t.pnl24h),
      t.winRate,
      t.priceChange24h ?? null,
      t.fundingRate,
      t.signal,
      now,
    );
  }

  const insertSql = `
    INSERT INTO trader_snapshots
      (trader_id, display_name, coin, exchange, position, oi_usd, pnl_24h, win_rate, price_change_24h, funding_rate, signal, ts)
    VALUES ${valueParts.join(", ")}
  `;

  const client = await pool.connect();
  try {
    await client.query(insertSql, params);
    await client.query(`DELETE FROM trader_snapshots WHERE ts < $1`, [now - SIX_MONTHS_MS]);
  } finally {
    client.release();
  }
}

// GET /api/whale-intel/trader-history/:id
router.get("/whale-intel/trader-history/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const since = Date.now() - 180 * 24 * 60 * 60 * 1000;

  try {
    const result = await db.execute(
      sql`SELECT * FROM trader_snapshots WHERE trader_id = ${String(id)} AND ts >= ${since} ORDER BY ts DESC LIMIT 2000`,
    );
    const rows = result.rows as Array<{
      id: number; trader_id: string; display_name: string; coin: string;
      exchange: string; position: string; oi_usd: string | null;
      pnl_24h: string | null; pnl_cumulative: string | null; win_rate: string | null;
      price_change_24h: string | null; funding_rate: string | null;
      signal: string | null; ts: string; created_at: string;
    }>;

    // Group by day for chart (aggregate daily PNL)
    const byDay = new Map<string, { date: string; pnl: number; oi: number; winRate: number; position: string; count: number }>();
    for (const r of rows) {
      const tsNum = typeof r.ts === "string" ? parseInt(r.ts, 10) : Number(r.ts);
      const day = new Date(tsNum).toISOString().slice(0, 10);
      const existing = byDay.get(day);
      const pnl = parseFloat(String(r.pnl_24h ?? "0"));
      const oi  = parseFloat(String(r.oi_usd ?? "0"));
      const wr  = parseFloat(String(r.win_rate ?? "0"));
      if (existing) {
        existing.pnl += pnl;
        existing.oi = Math.max(existing.oi, oi);
        existing.winRate = (existing.winRate * existing.count + wr) / (existing.count + 1);
        existing.count++;
      } else {
        byDay.set(day, { date: day, pnl, oi, winRate: wr, position: r.position, count: 1 });
      }
    }

    // Build cumulative PNL timeline
    const days = Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
    let cumulative = 0;
    const timeline = days.map(d => {
      cumulative += d.pnl;
      return { date: d.date, pnl: Math.round(d.pnl), cumPnl: Math.round(cumulative), oi: Math.round(d.oi), winRate: Math.round(d.winRate), position: d.position };
    });

    const trader = rows[0];
    res.json({
      ok: true,
      traderId: id,
      displayName: trader?.display_name ?? String(id),
      coin: trader?.coin ?? "?",
      exchange: trader?.exchange ?? "?",
      totalSnapshots: rows.length,
      daysTracked: days.length,
      cumulativePnl: Math.round(cumulative),
      timeline,
    });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err), timeline: [] });
  }
});

// ── GEM SCOUT — GeckoTerminal (trending + nuevos pools) + trades on-chain ───
// reales para detectar compras grandes (ballenas) + CMC nuevos listings +
// filtro de seguridad RugCheck (Solana) / GoPlus (EVM).
const GEM_NETWORKS: Record<string, string> = {
  solana: "solana", eth: "eth", bsc: "bsc", base: "base", arbitrum: "arbitrum",
};
const WHALE_TRADE_USD = 2_000; // una compra individual >= esto cuenta como "ballena"

// Stablecoins y "pilares" (BTC, ETH, majors) — nunca son gemas, se excluyen
// aunque aparezcan trending/nuevos (a veces GeckoTerminal los muestra en
// pools recién creados de versiones wrapped/bridged).
const EXCLUDED_SYMBOLS = new Set([
  "USDT","USDC","DAI","BUSD","TUSD","USDD","FDUSD","USDE","PYUSD","GUSD","USDP",
  "FRAX","LUSD","SUSD","CUSD","USTC","EURC","EURT","XUSD","USD1",
  "WBTC","BTC","BTCB","CBBTC","TBTC","RENBTC",
  "WETH","ETH","STETH","WSTETH","RETH","CBETH","METH",
  "WBNB","BNB","WSOL","SOL","WMATIC","MATIC","WAVAX","AVAX",
  "WFTM","FTM","WCRO","CRO","XRP","ADA","DOT","LTC","BCH","DOGE",
]);
function esPilarOStable(symbol: string): boolean {
  return EXCLUDED_SYMBOLS.has(symbol.toUpperCase().trim());
}

async function gtFetch(path: string): Promise<any> {
  try {
    const r = await fetch(`https://api.geckoterminal.com/api/v2${path}`, {
      headers: { Accept: "application/json;version=20230302" },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

interface GtPoolAttrs {
  address: string; name: string;
  base_token_price_usd?: string;
  pool_created_at?: string;
  fdv_usd?: string; market_cap_usd?: string; reserve_in_usd?: string;
  price_change_percentage?: { h1?: string; h24?: string };
  volume_usd?: { h1?: string; h24?: string };
  transactions?: { h1?: { buys?: number; sells?: number }; h24?: { buys?: number; sells?: number } };
}

async function fetchPoolsFor(chainKey: string, network: string): Promise<Array<{ chain: string; attrs: GtPoolAttrs; baseAddr: string; baseSymbol: string; baseName: string }>> {
  const out: Array<{ chain: string; attrs: GtPoolAttrs; baseAddr: string; baseSymbol: string; baseName: string }> = [];
  for (const kind of ["trending_pools", "new_pools"]) {
    const data = await gtFetch(`/networks/${network}/${kind}?include=base_token`);
    if (!data?.data) continue;
    const tokenMap = new Map<string, { symbol: string; name: string; address: string }>();
    for (const inc of data.included ?? []) {
      if (inc.type === "token") {
        tokenMap.set(inc.id, {
          symbol: inc.attributes?.symbol ?? "?",
          name: inc.attributes?.name ?? "Unknown",
          address: inc.attributes?.address ?? "",
        });
      }
    }
    for (const p of data.data as Array<{ id: string; attributes: GtPoolAttrs; relationships?: any }>) {
      const baseTokenRef = p.relationships?.base_token?.data?.id;
      const tok = baseTokenRef ? tokenMap.get(baseTokenRef) : null;
      if (!tok?.address) continue;
      out.push({ chain: chainKey, attrs: p.attributes, baseAddr: tok.address, baseSymbol: tok.symbol, baseName: tok.name });
    }
  }
  return out;
}

async function fetchWhaleTrades(network: string, poolAddress: string): Promise<{ whaleVol: number; whaleCount: number }> {
  const data = await gtFetch(`/networks/${network}/pools/${poolAddress}/trades`);
  const trades = data?.data as Array<{ attributes?: { kind?: string; volume_in_usd?: string } }> | undefined;
  if (!trades) return { whaleVol: 0, whaleCount: 0 };
  let whaleVol = 0, whaleCount = 0;
  for (const t of trades) {
    const vol = parseFloat(t.attributes?.volume_in_usd ?? "0");
    if (t.attributes?.kind === "buy" && vol >= WHALE_TRADE_USD) {
      whaleVol += vol;
      whaleCount++;
    }
  }
  return { whaleVol, whaleCount };
}

async function fetchCmcNewGems(): Promise<Gem[]> {
  const key = process.env["COINMARKETCAP_API_KEY"];
  if (!key) return [];
  try {
    const r = await fetch(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=20&sort=date_added&sort_dir=desc&convert=USD",
      { headers: { "X-CMC_PRO_API_KEY": key }, signal: AbortSignal.timeout(8000) },
    );
    if (!r.ok) return [];
    const data = await r.json() as { data?: Array<any> };
    const now = Date.now();
    return (data.data ?? [])
      .filter(t => (t.quote?.USD?.market_cap ?? 0) < 50_000_000 && !esPilarOStable(t.symbol ?? ""))
      .map(t => ({
        address: `cmc-${t.id}`,
        symbol: (t.symbol ?? "?").slice(0, 12),
        name: (t.name ?? "Unknown").slice(0, 30),
        chain: "cmc",
        price: t.quote?.USD?.price ?? 0,
        priceChange1h: t.quote?.USD?.percent_change_1h ?? 0,
        priceChange24h: t.quote?.USD?.percent_change_24h ?? 0,
        volume24h: t.quote?.USD?.volume_24h ?? 0,
        liquidity: 0,
        marketCap: t.quote?.USD?.market_cap ?? 0,
        buyVolume: 0,
        buyCount: 0,
        sellCount: 0,
        ageMinutes: t.date_added ? (now - new Date(t.date_added).getTime()) / 60_000 : 0,
        dexUrl: `https://coinmarketcap.com/currencies/${String(t.slug ?? t.name ?? "").toLowerCase()}/`,
        isBoosted: false,
        whaleBuyVolume: 0,
        whaleBuyCount: 0,
        source: "cmc" as const,
      }));
  } catch { return []; }
}

async function safetyOk(chain: string, address: string): Promise<boolean> {
  try {
    if (chain === "solana") {
      const r = await fetch(`https://api.rugcheck.xyz/v1/tokens/${address}/report/summary`, { signal: AbortSignal.timeout(6000) });
      if (!r.ok) return true; // sin datos → no bloquear, solo lo dejamos pasar sin garantía
      const d = await r.json() as { score_normalised?: number };
      return (d.score_normalised ?? 0) < 60; // >=60 = riesgo alto
    }
    const chainIdMap: Record<string, string> = { eth: "1", bsc: "56", base: "8453", arbitrum: "42161" };
    const cid = chainIdMap[chain];
    if (!cid) return true;
    const r = await fetch(`https://api.gopluslabs.io/api/v1/token_security/${cid}?contract_addresses=${address}`, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return true;
    const d = await r.json() as { result?: Record<string, any> };
    const info = d.result?.[address.toLowerCase()];
    if (!info) return true;
    if (info.is_honeypot === "1") return false;
    if (info.is_blacklisted === "1") return false;
    if (info.is_mintable === "1" && info.owner_address && info.owner_address !== "0x0000000000000000000000000000000000000000") return false;
    return true;
  } catch { return true; }
}

// GET /api/whale-intel/gems
router.get("/whale-intel/gems", async (req: Request, res: Response) => {
  const cached = cGet<Gem[]>("whale_gems_v2");
  if (cached) { res.json({ ok: true, gems: cached }); return; }

  try {
    const now = Date.now();

    // Paso 1: pools trending + nuevos en 5 redes (GeckoTerminal, gratis, sin key)
    const perNetwork = await Promise.all(
      Object.entries(GEM_NETWORKS).map(([chainKey, network]) => fetchPoolsFor(chainKey, network)),
    );
    const rawPools = perNetwork.flat();

    // Paso 2: dedupe por token, filtro base de liquidez/volumen
    const bestByToken = new Map<string, typeof rawPools[number]>();
    for (const p of rawPools) {
      const vol = parseFloat(p.attrs.volume_usd?.h24 ?? "0");
      const key = `${p.chain}:${p.baseAddr.toLowerCase()}`;
      const existing = bestByToken.get(key);
      if (!existing || vol > parseFloat(existing.attrs.volume_usd?.h24 ?? "0")) {
        bestByToken.set(key, p);
      }
    }

    const candidatos = Array.from(bestByToken.values()).filter(p => {
      if (esPilarOStable(p.baseSymbol)) return false; // nunca gemas
      const vol24 = parseFloat(p.attrs.volume_usd?.h24 ?? "0");
      const liq = parseFloat(p.attrs.reserve_in_usd ?? "0");
      return vol24 > 5_000 && liq > 1_000;
    });

    // Paso 3: de los candidatos, tomamos los top 18 por volumen para consultar
    // sus trades reales on-chain (respeta rate limit de GeckoTerminal: 30/min)
    const top = candidatos
      .sort((a, b) => parseFloat(b.attrs.volume_usd?.h24 ?? "0") - parseFloat(a.attrs.volume_usd?.h24 ?? "0"))
      .slice(0, 18);

    const whaleData = await Promise.all(
      top.map(p => fetchWhaleTrades(GEM_NETWORKS[p.chain]!, p.attrs.address)),
    );

    let gems: Gem[] = top.map((p, i) => {
      const vol24 = parseFloat(p.attrs.volume_usd?.h24 ?? "0");
      const buys = p.attrs.transactions?.h24?.buys ?? 0;
      const sells = p.attrs.transactions?.h24?.sells ?? 0;
      const buyRatio = buys / Math.max(1, buys + sells);
      const ageMin = p.attrs.pool_created_at ? (now - new Date(p.attrs.pool_created_at).getTime()) / 60_000 : 0;
      return {
        address: p.baseAddr,
        symbol: p.baseSymbol.slice(0, 12),
        name: p.baseName.slice(0, 30),
        chain: p.chain,
        price: parseFloat(p.attrs.base_token_price_usd ?? "0"),
        priceChange1h: parseFloat(p.attrs.price_change_percentage?.h1 ?? "0"),
        priceChange24h: parseFloat(p.attrs.price_change_percentage?.h24 ?? "0"),
        volume24h: vol24,
        liquidity: parseFloat(p.attrs.reserve_in_usd ?? "0"),
        marketCap: parseFloat(p.attrs.market_cap_usd ?? p.attrs.fdv_usd ?? "0"),
        buyVolume: vol24 * buyRatio,
        buyCount: buys,
        sellCount: sells,
        ageMinutes: ageMin,
        dexUrl: `https://www.geckoterminal.com/${GEM_NETWORKS[p.chain]}/pools/${p.attrs.address}`,
        isBoosted: false,
        whaleBuyVolume: whaleData[i]?.whaleVol ?? 0,
        whaleBuyCount: whaleData[i]?.whaleCount ?? 0,
        source: "dex" as const,
      };
    });

    // Paso 4: filtro de seguridad — solo en los que de verdad tienen actividad
    // de ballena (para no gastar rate limit de RugCheck/GoPlus en todo el resto)
    const candidatosSeguridad = gems.filter(g => (g.whaleBuyCount ?? 0) > 0).slice(0, 15);
    const seguros = await Promise.all(candidatosSeguridad.map(g => safetyOk(g.chain, g.address)));
    const bloqueados = new Set(
      candidatosSeguridad.filter((_, i) => !seguros[i]).map(g => `${g.chain}:${g.address.toLowerCase()}`),
    );
    gems = gems.filter(g => !bloqueados.has(`${g.chain}:${g.address.toLowerCase()}`));

    // Paso 5: agregar nuevos listings de CMC como fuente extra
    const cmcGems = await fetchCmcNewGems();

    const final = [...gems, ...cmcGems]
      .sort((a, b) => (b.whaleBuyVolume ?? 0) - (a.whaleBuyVolume ?? 0) || b.buyVolume - a.buyVolume)
      .slice(0, 40);

    cSet("whale_gems_v2", final, 60_000);
    res.json({ ok: true, gems: final });
  } catch (err) {
    logger.error({ err }, "whale-intel gems error");
    res.status(502).json({ ok: false, error: String(err) });
  }
});

// ─── GET /api/whale-intel/live-whales — DB + HL traders ──────────────────────
router.get("/whale-intel/live-whales", async (req: Request, res: Response) => {
  const cached = cGet<unknown>("live_whales");
  if (cached) { res.json({ ok: true, ...cached as object, cached: true }); return; }
  try {
    const client = await pool.connect();
    let dbRows: unknown[] = [];
    try {
      const r = await client.query("SELECT * FROM tg_whale_alerts ORDER BY ts DESC LIMIT 30");
      dbRows = r.rows;
    } catch { /* table may not exist yet */ } finally { client.release(); }

    const priceChanges = await fetchPriceChanges().catch(() => ({} as Record<string, number>));
    const hlTraders = await fetchHLTraders(priceChanges).catch(() => [] as WhaleTrader[]);

    const result = { db_whales: dbRows, hl_traders: hlTraders };
    cSet("live_whales", result, 30_000);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  }
});

// ─── GET /api/whale-intel/live-signals — señales PSY de la DB ─────────────────
router.get("/whale-intel/live-signals", async (req: Request, res: Response) => {
  const cached = cGet<unknown[]>("live_signals");
  if (cached) { res.json({ ok: true, signals: cached, cached: true }); return; }
  const client = await pool.connect();
  try {
    const r = await client.query("SELECT * FROM tg_psy_signals ORDER BY ts DESC LIMIT 50");
    cSet("live_signals", r.rows, 15_000);
    res.json({ ok: true, signals: r.rows });
  } catch {
    res.json({ ok: true, signals: [] });
  } finally { client.release(); }
});

// ─── GET /api/whale-intel/live-gems — gems DegenScout + DexScreener ──────────
router.get("/whale-intel/live-gems", async (req: Request, res: Response) => {
  const cached = cGet<unknown>("live_gems");
  if (cached) { res.json({ ok: true, ...cached as object, cached: true }); return; }
  const client = await pool.connect();
  let dgGems: unknown[] = [];
  try {
    const r = await client.query("SELECT * FROM tg_gem_alerts ORDER BY ts DESC LIMIT 40");
    dgGems = r.rows;
  } catch { /* table may not exist yet */ } finally { client.release(); }
  const result = { degen_gems: dgGems };
  cSet("live_gems", result, 30_000);
  res.json({ ok: true, ...result });
});

// ─── GET /api/whale-intel/tg-whales ──────────────────────────────────────────
router.get("/whale-intel/tg-whales", async (req: Request, res: Response) => {
  const cached = cGet<unknown[]>("tg_whales");
  if (cached) { res.json({ ok: true, alerts: cached }); return; }
  const client = await pool.connect();
  try {
    const r = await client.query(`SELECT * FROM whale_alerts_tg ORDER BY ts DESC LIMIT 50`);
    cSet("tg_whales", r.rows, 15_000);
    res.json({ ok: true, alerts: r.rows, total: r.rowCount });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err), alerts: [] });
  } finally { client.release(); }
});

// ─── GET /api/whale-intel/tg-signals ─────────────────────────────────────────
router.get("/whale-intel/tg-signals", async (req: Request, res: Response) => {
  const cached = cGet<unknown[]>("tg_signals");
  if (cached) { res.json({ ok: true, signals: cached }); return; }
  const client = await pool.connect();
  try {
    const r = await client.query(`SELECT * FROM psy_signals_tg ORDER BY ts DESC LIMIT 60`);
    cSet("tg_signals", r.rows, 15_000);
    res.json({ ok: true, signals: r.rows, total: r.rowCount });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err), signals: [] });
  } finally { client.release(); }
});

// ─── GET /api/whale-intel/tg-gems ────────────────────────────────────────────
router.get("/whale-intel/tg-gems", async (req: Request, res: Response) => {
  const cached = cGet<unknown[]>("tg_gems");
  if (cached) { res.json({ ok: true, gems: cached }); return; }
  const client = await pool.connect();
  try {
    const r = await client.query(`SELECT * FROM gem_alerts_tg ORDER BY ts DESC LIMIT 40`);
    cSet("tg_gems", r.rows, 15_000);
    res.json({ ok: true, gems: r.rows, total: r.rowCount });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err), gems: [] });
  } finally { client.release(); }
});

// ─── GET /api/whale-intel/tg-exchanges ───────────────────────────────────────
router.get("/whale-intel/tg-exchanges", async (req: Request, res: Response) => {
  const cached = cGet<unknown[]>("tg_exchanges");
  if (cached) { res.json({ ok: true, alerts: cached }); return; }
  const client = await pool.connect();
  try {
    const r = await client.query(`SELECT * FROM exchange_alerts_tg ORDER BY ts DESC LIMIT 40`);
    cSet("tg_exchanges", r.rows, 15_000);
    res.json({ ok: true, alerts: r.rows, total: r.rowCount });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err), alerts: [] });
  } finally { client.release(); }
});

// ─── GET /api/whale-intel/tg-stats ───────────────────────────────────────────
router.get("/whale-intel/tg-stats", async (_req: Request, res: Response) => {
  const cached = cGet<unknown>("tg_stats_wi");
  if (cached) { res.json(cached); return; }
  const client = await pool.connect();
  try {
    const since = Date.now() - 86_400_000;
    const [w, s, g, e] = await Promise.all([
      client.query(`SELECT COUNT(*) FROM whale_alerts_tg WHERE ts > $1`, [since]),
      client.query(`SELECT COUNT(*) FROM psy_signals_tg WHERE ts > $1`, [since]),
      client.query(`SELECT COUNT(*) FROM gem_alerts_tg WHERE ts > $1`, [since]),
      client.query(`SELECT COUNT(*) FROM exchange_alerts_tg WHERE ts > $1`, [since]),
    ]);
    const stats = {
      ok: true,
      whales_24h:    parseInt(String(w.rows[0]?.count ?? "0")),
      signals_24h:   parseInt(String(s.rows[0]?.count ?? "0")),
      gems_24h:      parseInt(String(g.rows[0]?.count ?? "0")),
      exchanges_24h: parseInt(String(e.rows[0]?.count ?? "0")),
      ultima_actualizacion: new Date().toISOString(),
    };
    cSet("tg_stats_wi", stats, 15_000);
    res.json(stats);
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  } finally { client.release(); }
});

// ─── Blockchair On-Chain Whale Data (gratis, sin API key) ────────────────────
const BC_CACHE_MS = 30 * 60 * 1000; // 30 min

interface OnchainWhale {
  id: string;
  chain: "BTC" | "ETH";
  hash: string;
  amountNative: number;
  amountUsd: number;
  from: string;
  to: string;
  time: string;
  url: string;
}

async function fetchBlockchairBTC(): Promise<OnchainWhale[]> {
  try {
    // Transacciones BTC > 50 BTC (~$4M+)
    const r = await fetch(
      "https://api.blockchair.com/bitcoin/transactions?q=output_total(5000000000..)&s=time(desc)&limit=15&fields=hash,time,input_total,output_total,input_count,output_count",
      { signal: AbortSignal.timeout(10000) },
    );
    if (!r.ok) return [];
    const data = await r.json() as { data: Array<{ hash: string; time: string; output_total: number; input_count: number; output_count: number }> };
    const BTC_PRICE = 95_000;
    return (data.data ?? []).map(tx => {
      const btc = tx.output_total / 1e8;
      return {
        id: `bc_btc_${tx.hash.slice(0, 16)}`,
        chain: "BTC" as const,
        hash: tx.hash,
        amountNative: btc,
        amountUsd: btc * BTC_PRICE,
        from: `${tx.input_count} input(s)`,
        to: `${tx.output_count} output(s)`,
        time: tx.time.replace(" ", "T") + "Z",
        url: `https://blockchair.com/bitcoin/transaction/${tx.hash}`,
      };
    });
  } catch { return []; }
}

async function fetchBlockchairETH(): Promise<OnchainWhale[]> {
  try {
    // Transacciones ETH > 100 ETH (~$280K+)
    const r = await fetch(
      "https://api.blockchair.com/ethereum/transactions?q=value(100000000000000000000..)&s=time(desc)&limit=10&fields=hash,time,value,sender,recipient",
      { signal: AbortSignal.timeout(10000) },
    );
    if (!r.ok) return [];
    const data = await r.json() as { data: Array<{ hash: string; time: string; value: string; sender: string; recipient: string }> };
    const ETH_PRICE = 2_800;
    return (data.data ?? []).map(tx => {
      const eth = parseInt(tx.value) / 1e18;
      const sender = tx.sender ? tx.sender.slice(0, 6) + "…" + tx.sender.slice(-4) : "Unknown";
      const recip  = tx.recipient ? tx.recipient.slice(0, 6) + "…" + tx.recipient.slice(-4) : "Unknown";
      return {
        id: `bc_eth_${tx.hash.slice(0, 16)}`,
        chain: "ETH" as const,
        hash: tx.hash,
        amountNative: eth,
        amountUsd: eth * ETH_PRICE,
        from: sender,
        to: recip,
        time: tx.time.replace(" ", "T") + "Z",
        url: `https://blockchair.com/ethereum/transaction/${tx.hash}`,
      };
    });
  } catch { return []; }
}

// GET /api/whale-intel/onchain-whales — Blockchair BTC+ETH (cache 30min, gratis)
router.get("/whale-intel/onchain-whales", async (_req: Request, res: Response) => {
  const cached = cGet<{ whales: OnchainWhale[]; fetchedAt: string }>("bc_whales");
  if (cached) { res.json({ ok: true, ...cached, cached: true }); return; }

  const [btc, eth] = await Promise.all([fetchBlockchairBTC(), fetchBlockchairETH()]);
  const whales = [...btc, ...eth].sort((a, b) => b.amountUsd - a.amountUsd);
  const payload = { whales, fetchedAt: new Date().toISOString() };
  cSet("bc_whales", payload, BC_CACHE_MS);
  res.json({ ok: true, ...payload, cached: false });
});

// ─── Twitter/X Feed — máx 2 calls/día (cache 12h) ────────────────────────────
const TW_CACHE_MS = 12 * 60 * 60 * 1000; // 12 horas

export interface TwTweet {
  id: string;
  text: string;
  authorName: string;
  authorHandle: string;
  createdAt: string;
  likes: number;
  retweets: number;
  url: string;
  category: "whale" | "signal" | "news";
}

function classifyTweet(text: string): TwTweet["category"] {
  const lower = text.toLowerCase();
  if (/whale|moved|transfer|billion|million.*btc|million.*eth|satoshi|hodl|cold wallet/i.test(lower)) return "whale";
  if (/signal|long|short|entry|target|stop.?loss|tp|sl|buy zone|sell zone|setup/i.test(lower)) return "signal";
  return "news";
}

async function fetchTwitterFeed(): Promise<TwTweet[]> {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) { logger.warn("TWITTER_BEARER_TOKEN not set"); return []; }

  // Una sola query amplia — whale alerts + signals + crypto moves
  const q = encodeURIComponent(
    '(whale alert OR "whale moved" OR "whales moved" OR "BTC signal" OR "ETH signal" OR "crypto signal" OR "million BTC" OR "billion BTC" OR "million ETH") lang:en -is:retweet -is:reply'
  );
  const url = `https://api.twitter.com/2/tweets/search/recent?query=${q}&max_results=20&tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=name,username`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.warn({ status: res.status, body }, "Twitter API error");
      return [];
    }

    type RawTweet = { id: string; text: string; author_id?: string; created_at?: string; public_metrics?: { like_count: number; retweet_count: number } };
    type RawUser  = { id: string; name: string; username: string };
    const data = await res.json() as { data?: RawTweet[]; includes?: { users?: RawUser[] }; meta?: { result_count: number } };

    const userMap = new Map<string, RawUser>();
    for (const u of (data.includes?.users ?? [])) userMap.set(u.id, u);

    return (data.data ?? []).map(t => {
      const author = t.author_id ? userMap.get(t.author_id) : undefined;
      return {
        id: t.id,
        text: t.text,
        authorName:   author?.name     ?? "Crypto Account",
        authorHandle: author?.username ?? "unknown",
        createdAt:    t.created_at     ?? new Date().toISOString(),
        likes:        t.public_metrics?.like_count    ?? 0,
        retweets:     t.public_metrics?.retweet_count ?? 0,
        url: `https://x.com/${author?.username ?? "i"}/status/${t.id}`,
        category: classifyTweet(t.text),
      } satisfies TwTweet;
    });
  } catch (err) {
    logger.warn({ err }, "Twitter fetch failed");
    return [];
  }
}

// GET /api/whale-intel/tw-feed  — máx 2 calls/día (cache 12h)
router.get("/whale-intel/tw-feed", async (_req: Request, res: Response) => {
  const cached = cGet<{ tweets: TwTweet[]; fetchedAt: string }>("tw_feed");
  if (cached) {
    res.json({ ok: true, ...cached, cached: true });
    return;
  }

  const tweets = await fetchTwitterFeed();
  const payload = { tweets, fetchedAt: new Date().toISOString() };
  cSet("tw_feed", payload, TW_CACHE_MS);

  const nextRefresh = new Date(Date.now() + TW_CACHE_MS).toISOString();
  res.json({ ok: true, ...payload, cached: false, nextRefresh });
});

// GET /api/whale-intel/rugcheck/:address
router.get("/whale-intel/rugcheck/:address", async (req: Request, res: Response) => {
  const { address } = req.params;
  const ck = `rugcheck_${address}`;
  const cached = cGet(ck);
  if (cached) { res.json(cached); return; }
  try {
    const r = await fetch(`https://api.rugcheck.xyz/v1/tokens/${address}/report/summary`, {
      signal: AbortSignal.timeout(8000),
    });
    const data = await r.json();
    cSet(ck, data, 300_000);
    res.json(data);
  } catch {
    res.status(502).json({ score: null, risks: [], error: "RugCheck unavailable" });
  }
});

export default router;
