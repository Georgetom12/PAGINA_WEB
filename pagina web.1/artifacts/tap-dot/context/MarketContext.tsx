import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ─── Shared API base — same server as web platform ───────────────────────────
const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "https://api.psychometriks.trade";

const SIGNALS_SERVER = "https://signalsbotpaginaweb-production.up.railway.app";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface TaSignalRaw {
  symbol: string;
  direction: "LONG" | "SHORT";
  score: number;
  rsi1h: number;
  rsi4h?: number;
  macdHistogram: number;
  macdCross: boolean;
  htfBias?: "BULLISH" | "BEARISH" | "NEUTRAL";
  struct1h?: string;
  volumeSpike: number;
  indicators: string[];
}

export interface CryptoAsset {
  id: string;
  rank: number;
  symbol: string;
  name: string;
  price: number;
  change1h: number;
  change24h: number;
  change7d: number;
  psyScore: number;
  signal: "BUY_STRONG" | "BUY" | "NEUTRAL" | "SELL" | "SELL_STRONG";
  volume24h: number;
  // Real TA fields from signals server (optional)
  rsi1h?: number;
  rsi4h?: number;
  htfBias?: "BULLISH" | "BEARISH" | "NEUTRAL";
  struct1h?: string;
  macdHistogram?: number;
  volumeSpike?: number;
  taIndicators?: string[];
}

export interface TradingSignal {
  id: string;
  crypto: string;
  symbol: string;
  timeframe: "1H" | "4H" | "1D";
  direction: "LONG" | "SHORT";
  entry: number;
  target: number;
  tp2?: number;
  tp3?: number;
  stopLoss: number;
  psyScore: number;
  timestamp: number;
  status: "ACTIVA" | "CERRADA";
  fullStatus: string;
  rr: number;
  leverage?: string;
  channelSlug?: string;
  note?: string;
  source: "DB" | "SIMULATED";
}

export interface WhaleAlert {
  id: string;
  type: "CEX_IN" | "CEX_OUT" | "WALLET" | "EXCHANGE" | "DEFI";
  symbol: string;
  amount: number;
  amountUsd: number;
  from: string;
  to: string;
  timestamp: number;
  bullish: boolean;
}

export interface MarketSession {
  name: string;
  shortName: string;
  tz: string;
  open: boolean;
  opensIn?: string;
}

interface MarketData {
  btcPrice: number;
  btcChange24h: number;
  marketBias: "ALCISTA" | "NEUTRAL" | "BAJISTA";
  biasScore: number;
  assets: CryptoAsset[];
  signals: TradingSignal[];
  fearGreedIndex: number;
  avgFundingRate: number;
  whaleAlerts: WhaleAlert[];
  marketSessions: MarketSession[];
  isLoading: boolean;
  lastUpdate: Date | null;
  dataSource: "live" | "simulated";
  refresh: () => void;
}

const MarketContext = createContext<MarketData>({
  btcPrice: 0,
  btcChange24h: 0,
  marketBias: "NEUTRAL",
  biasScore: 50,
  assets: [],
  signals: [],
  fearGreedIndex: 50,
  avgFundingRate: 0.01,
  whaleAlerts: [],
  marketSessions: [],
  isLoading: true,
  lastUpdate: null,
  dataSource: "simulated",
  refresh: () => {},
});

// ─── Static list for screener simulation ─────────────────────────────────────
const CRYPTO_LIST = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", rank: 1, basePrice: 78000 },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", rank: 2, basePrice: 3100 },
  { id: "binancecoin", symbol: "BNB", name: "BNB", rank: 3, basePrice: 620 },
  { id: "solana", symbol: "SOL", name: "Solana", rank: 4, basePrice: 195 },
  { id: "ripple", symbol: "XRP", name: "XRP", rank: 5, basePrice: 0.62 },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", rank: 6, basePrice: 0.22 },
  { id: "cardano", symbol: "ADA", name: "Cardano", rank: 7, basePrice: 0.48 },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche", rank: 8, basePrice: 34 },
  { id: "chainlink", symbol: "LINK", name: "Chainlink", rank: 9, basePrice: 14 },
  { id: "polkadot", symbol: "DOT", name: "Polkadot", rank: 10, basePrice: 7.5 },
  { id: "uniswap", symbol: "UNI", name: "Uniswap", rank: 11, basePrice: 11 },
  { id: "cosmos", symbol: "ATOM", name: "Cosmos", rank: 12, basePrice: 9.5 },
  { id: "litecoin", symbol: "LTC", name: "Litecoin", rank: 13, basePrice: 87 },
  { id: "near", symbol: "NEAR", name: "NEAR Protocol", rank: 14, basePrice: 6.8 },
  { id: "fantom", symbol: "FTM", name: "Fantom", rank: 15, basePrice: 0.68 },
  { id: "the-sandbox", symbol: "SAND", name: "The Sandbox", rank: 16, basePrice: 0.38 },
  { id: "decentraland", symbol: "MANA", name: "Decentraland", rank: 17, basePrice: 0.41 },
  { id: "axie-infinity", symbol: "AXS", name: "Axie Infinity", rank: 18, basePrice: 6.2 },
  { id: "theta-token", symbol: "THETA", name: "Theta Network", rank: 19, basePrice: 1.78 },
  { id: "vechain", symbol: "VET", name: "VeChain", rank: 20, basePrice: 0.027 },
  { id: "hedera", symbol: "HBAR", name: "Hedera", rank: 21, basePrice: 0.092 },
  { id: "internet-computer", symbol: "ICP", name: "Internet Computer", rank: 22, basePrice: 12.5 },
  { id: "filecoin", symbol: "FIL", name: "Filecoin", rank: 23, basePrice: 5.1 },
  { id: "elrond-erd-2", symbol: "EGLD", name: "MultiversX", rank: 24, basePrice: 38 },
  { id: "aave", symbol: "AAVE", name: "Aave", rank: 25, basePrice: 185 },
  { id: "maker", symbol: "MKR", name: "Maker", rank: 26, basePrice: 1680 },
  { id: "curve-dao-token", symbol: "CRV", name: "Curve DAO", rank: 27, basePrice: 0.42 },
  { id: "optimism", symbol: "OP", name: "Optimism", rank: 28, basePrice: 1.85 },
  { id: "arbitrum", symbol: "ARB", name: "Arbitrum", rank: 29, basePrice: 0.78 },
  { id: "aptos", symbol: "APT", name: "Aptos", rank: 30, basePrice: 8.9 },
  { id: "sui", symbol: "SUI", name: "Sui", rank: 31, basePrice: 3.4 },
  { id: "injective-protocol", symbol: "INJ", name: "Injective", rank: 32, basePrice: 22 },
  { id: "celestia", symbol: "TIA", name: "Celestia", rank: 33, basePrice: 4.5 },
  { id: "sei-network", symbol: "SEI", name: "Sei", rank: 34, basePrice: 0.38 },
  { id: "bittensor", symbol: "TAO", name: "Bittensor", rank: 35, basePrice: 286 },
  { id: "dogwifcoin", symbol: "WIF", name: "dogwifhat", rank: 36, basePrice: 1.72 },
  { id: "render-token", symbol: "RENDER", name: "Render", rank: 37, basePrice: 5.4 },
  { id: "the-graph", symbol: "GRT", name: "The Graph", rank: 38, basePrice: 0.21 },
  { id: "1inch", symbol: "1INCH", name: "1inch Network", rank: 39, basePrice: 0.31 },
  { id: "synthetix-network-token", symbol: "SNX", name: "Synthetix", rank: 40, basePrice: 1.95 },
  { id: "compound-governance-token", symbol: "COMP", name: "Compound", rank: 41, basePrice: 52 },
  { id: "yearn-finance", symbol: "YFI", name: "yearn.finance", rank: 42, basePrice: 4250 },
  { id: "balancer", symbol: "BAL", name: "Balancer", rank: 43, basePrice: 2.85 },
  { id: "0x", symbol: "ZRX", name: "0x Protocol", rank: 44, basePrice: 0.28 },
  { id: "chiliz", symbol: "CHZ", name: "Chiliz", rank: 45, basePrice: 0.071 },
  { id: "gala", symbol: "GALA", name: "Gala", rank: 46, basePrice: 0.019 },
  { id: "immutable-x", symbol: "IMX", name: "Immutable", rank: 47, basePrice: 1.15 },
  { id: "stacks", symbol: "STX", name: "Stacks", rank: 48, basePrice: 1.05 },
  { id: "floki", symbol: "FLOKI", name: "FLOKI", rank: 49, basePrice: 0.00009 },
  { id: "pepe", symbol: "PEPE", name: "Pepe", rank: 50, basePrice: 0.0000095 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function seededVal(index: number, offset: number): number {
  return Math.sin(index * 2.3 + offset) * 0.5 + 0.5;
}

function getSignal(score: number): CryptoAsset["signal"] {
  if (score >= 75) return "BUY_STRONG";
  if (score >= 60) return "BUY";
  if (score >= 40) return "NEUTRAL";
  if (score >= 25) return "SELL";
  return "SELL_STRONG";
}

function buildAssets(btcPrice: number, taMap: Map<string, TaSignalRaw> = new Map()): CryptoAsset[] {
  const btcBase = CRYPTO_LIST[0].basePrice;
  const btcRatio = btcPrice / btcBase;
  return CRYPTO_LIST.map((c, i) => {
    const ta = taMap.get(c.symbol);
    let psyScore: number;
    if (ta) {
      const base = ta.direction === "LONG"
        ? 50 + Math.round((ta.score / 8) * 50)
        : 50 - Math.round((ta.score / 8) * 50);
      psyScore = Math.max(0, Math.min(100, base));
    } else {
      psyScore = Math.round(15 + seededVal(i, 1.1) * 75);
    }
    return {
      id: c.id,
      rank: c.rank,
      symbol: c.symbol,
      name: c.name,
      price: parseFloat((c.basePrice * btcRatio).toPrecision(4)),
      psyScore,
      change24h: parseFloat(((seededVal(i, 2.7) - 0.5) * 14).toFixed(2)),
      change1h: parseFloat(((seededVal(i, 5.3) - 0.5) * 3).toFixed(2)),
      change7d: parseFloat(((seededVal(i, 0.4) - 0.5) * 25).toFixed(2)),
      volume24h: parseFloat((seededVal(i, 3.9) * 2e9 + 5e7).toFixed(0)),
      signal: getSignal(psyScore),
      // Real TA fields
      rsi1h:        ta?.rsi1h,
      rsi4h:        ta?.rsi4h,
      htfBias:      ta?.htfBias,
      struct1h:     ta?.struct1h,
      macdHistogram: ta?.macdHistogram,
      volumeSpike:  ta?.volumeSpike,
      taIndicators: ta?.indicators,
    };
  });
}

// Map DB signal row → TradingSignal for the mobile app
interface DbSignal {
  id: number;
  channelSlug?: string;
  asset: string;
  direction: string;
  entry: string;
  tp1: string;
  tp2?: string | null;
  tp3?: string | null;
  sl: string;
  rr?: string | null;
  leverage?: string | null;
  note?: string | null;
  source?: string | null;
  status: string;
  tgMsgId?: string | null;
  createdAt: string;
  psyScore?: number;
}

function mapDbSignal(s: DbSignal, assets: CryptoAsset[]): TradingSignal {
  const asset = assets.find((a) => a.symbol === s.asset.toUpperCase());
  const isActive = s.status === "ACTIVA";
  const tp2 = s.tp2 ? parseFloat(s.tp2) || undefined : undefined;
  const tp3 = s.tp3 ? parseFloat(s.tp3) || undefined : undefined;
  return {
    id: `db-${s.id}`,
    crypto: s.asset,
    symbol: s.asset.toUpperCase(),
    timeframe: "1D",
    direction: (s.direction === "LONG" || s.direction === "SHORT") ? s.direction : "LONG",
    entry: parseFloat(s.entry) || asset?.price || 0,
    target: parseFloat(s.tp1) || 0,
    tp2,
    tp3,
    stopLoss: parseFloat(s.sl) || 0,
    psyScore: asset?.psyScore ?? 50,
    timestamp: new Date(s.createdAt).getTime(),
    status: isActive ? "ACTIVA" : "CERRADA",
    fullStatus: s.status,
    rr: parseFloat(s.rr ?? "2") || 2,
    leverage: s.leverage ?? undefined,
    channelSlug: s.channelSlug,
    note: s.note ?? undefined,
    source: "DB",
  };
}

function buildSimulatedSignals(assets: CryptoAsset[]): TradingSignal[] {
  const timeframes: TradingSignal["timeframe"][] = ["1H", "4H", "1D"];
  const signals: TradingSignal[] = [];
  const now = Date.now();
  assets.filter((a) => a.signal !== "NEUTRAL").slice(0, 18).forEach((a, i) => {
    const isLong = a.signal === "BUY_STRONG" || a.signal === "BUY";
    const tf = timeframes[i % 3];
    const rr = 2 + seededVal(i, 7.1);
    const slPct = tf === "1H" ? 0.012 : tf === "4H" ? 0.025 : 0.045;
    const tpPct = slPct * rr;
    const simStatus = i < 12 ? "ACTIVA" : "CERRADA ✅";
    signals.push({
      id: `sim-${a.id}-${tf}-${i}`,
      crypto: a.name,
      symbol: a.symbol,
      timeframe: tf,
      direction: isLong ? "LONG" : "SHORT",
      entry: a.price,
      target: parseFloat((a.price * (isLong ? 1 + tpPct : 1 - tpPct)).toPrecision(5)),
      stopLoss: parseFloat((a.price * (isLong ? 1 - slPct : 1 + slPct)).toPrecision(5)),
      psyScore: a.psyScore,
      timestamp: now - Math.floor(seededVal(i, 4.2) * 48) * 3600000,
      status: i < 12 ? "ACTIVA" : "CERRADA",
      fullStatus: simStatus,
      rr: parseFloat(rr.toFixed(1)),
      source: "SIMULATED",
    });
  });
  return signals.sort((a, b) => b.timestamp - a.timestamp);
}

// ─── Whale alerts (simulated, rotates every 3 min) ────────────────────────────
const WHALE_TEMPLATES = [
  { type: "CEX_IN" as const, sym: "BTC", fromLabel: "Whale Wallet", toLabel: "Binance", bullish: false },
  { type: "CEX_OUT" as const, sym: "BTC", fromLabel: "Coinbase", toLabel: "Cold Wallet", bullish: true },
  { type: "CEX_IN" as const, sym: "ETH", fromLabel: "Unknown Wallet", toLabel: "OKX", bullish: false },
  { type: "WALLET" as const, sym: "BTC", fromLabel: "Satoshi Era Wallet", toLabel: "Unknown", bullish: false },
  { type: "DEFI" as const, sym: "ETH", fromLabel: "Whale", toLabel: "Uniswap V3", bullish: true },
  { type: "CEX_OUT" as const, sym: "SOL", fromLabel: "Kraken", toLabel: "Self Custody", bullish: true },
  { type: "EXCHANGE" as const, sym: "BTC", fromLabel: "Binance", toLabel: "Coinbase", bullish: false },
  { type: "CEX_IN" as const, sym: "USDT", fromLabel: "Market Maker", toLabel: "Binance", bullish: true },
];

function buildWhaleAlerts(btcPrice: number): WhaleAlert[] {
  const now = Date.now();
  const seed = Math.floor(now / 180000);
  return Array.from({ length: 5 }, (_, i) => {
    const t = WHALE_TEMPLATES[(seed + i * 3) % WHALE_TEMPLATES.length];
    const amount = t.sym === "BTC" ? 200 + seededVal(seed + i, i * 1.3) * 1800
      : t.sym === "ETH" ? 1000 + seededVal(seed + i, i * 2.1) * 15000
      : t.sym === "SOL" ? 5000 + seededVal(seed + i, i * 0.9) * 80000
      : 50000000;
    const prices: Record<string, number> = { BTC: btcPrice, ETH: 3100, SOL: 195, USDT: 1 };
    return {
      id: `whale-${seed}-${i}`,
      type: t.type,
      symbol: t.sym,
      amount: parseFloat(amount.toFixed(t.sym === "BTC" ? 1 : 0)),
      amountUsd: amount * (prices[t.sym] ?? 1),
      from: t.fromLabel,
      to: t.toLabel,
      timestamp: now - (Math.floor(seededVal(seed, i * 4.1) * 55) + 1) * 60000,
      bullish: t.bullish,
    };
  }).sort((a, b) => b.timestamp - a.timestamp);
}

// ─── Market sessions (real-time UTC calculation) ───────────────────────────────
function getMarketSessions(): MarketSession[] {
  const now = new Date();
  const t = now.getUTCHours() * 60 + now.getUTCMinutes();
  const day = now.getUTCDay();
  const wd = day !== 0 && day !== 6;
  const minsUntil = (target: number) => {
    let d = target - t;
    if (d < 0) d += 1440;
    return d < 60 ? `en ${d}m` : `en ${Math.floor(d / 60)}h ${d % 60}m`;
  };
  return [
    { name: "Tokyo", shortName: "TYO", tz: "UTC+9", open: wd && t >= 0 && t < 360, opensIn: wd && !(t >= 0 && t < 360) ? minsUntil(0) : undefined },
    { name: "Londres", shortName: "LON", tz: "UTC+0", open: wd && t >= 480 && t < 990, opensIn: wd && !(t >= 480 && t < 990) ? minsUntil(480) : undefined },
    { name: "Nueva York", shortName: "NYC", tz: "UTC-5", open: wd && t >= 810 && t < 1200, opensIn: wd && !(t >= 810 && t < 1200) ? minsUntil(810) : undefined },
    { name: "CME Futuros", shortName: "CME", tz: "UTC-6", open: wd },
    { name: "Crypto", shortName: "CRYPTO", tz: "24/7", open: true },
  ];
}

// ─── TA Signals from signals server ──────────────────────────────────────────
async function fetchTaSignals(): Promise<Map<string, TaSignalRaw>> {
  try {
    const r = await fetch(`${SIGNALS_SERVER}/api/altcoin-signals`, {
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return new Map();
    const d = await r.json() as { signals: TaSignalRaw[] };
    const map = new Map<string, TaSignalRaw>();
    for (const s of d.signals ?? []) {
      const sym = s.symbol.replace(/USDT$/i, "");
      map.set(sym, s);
    }
    return map;
  } catch {
    return new Map();
  }
}

// ─── API fetchers (same endpoints as web platform) ────────────────────────────
async function fetchBtcPrice(): Promise<{ price: number; change24h: number }> {
  // Primary: our own API server (same as web)
  try {
    const r = await fetch(`${API_BASE}/api/proxy/coinbase/price?pair=BTC-USD`, {
      signal: AbortSignal.timeout(6000),
    });
    if (r.ok) {
      const d = await r.json() as { data?: { amount?: string } };
      const price = parseFloat(d?.data?.amount ?? "0");
      if (price > 0) return { price, change24h: 0 };
    }
  } catch { /* fallthrough */ }

  // Fallback: Kraken via our API server
  try {
    const r = await fetch(`${API_BASE}/api/proxy/kraken/price?pair=XBTUSD`, {
      signal: AbortSignal.timeout(6000),
    });
    if (r.ok) {
      const d = await r.json() as { result?: Record<string, { c?: string[] }> };
      const ticker = Object.values(d?.result ?? {})[0];
      const price = parseFloat(ticker?.c?.[0] ?? "0");
      if (price > 0) return { price, change24h: 0 };
    }
  } catch { /* fallthrough */ }

  // Last resort: CoinGecko directly
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
      { signal: AbortSignal.timeout(8000) }
    );
    if (r.ok) {
      const d = await r.json() as { bitcoin?: { usd?: number; usd_24h_change?: number } };
      return {
        price: d?.bitcoin?.usd ?? 0,
        change24h: parseFloat((d?.bitcoin?.usd_24h_change ?? 0).toFixed(2)),
      };
    }
  } catch { /* fallthrough */ }

  return { price: 0, change24h: 0 };
}

async function fetchDbSignals(): Promise<DbSignal[]> {
  try {
    const r = await fetch(`${API_BASE}/api/signals`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return [];
    const d = await r.json() as { ok?: boolean; signals?: DbSignal[] };
    return d?.signals ?? [];
  } catch {
    return [];
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [btcPrice, setBtcPrice] = useState(78000);
  const [btcChange24h, setBtcChange24h] = useState(1.24);
  const [assets, setAssets] = useState<CryptoAsset[]>(() => buildAssets(78000));
  const [signals, setSignals] = useState<TradingSignal[]>(() => buildSimulatedSignals(buildAssets(78000)));
  const [whaleAlerts, setWhaleAlerts] = useState<WhaleAlert[]>(() => buildWhaleAlerts(78000));
  const [marketSessions, setMarketSessions] = useState<MarketSession[]>(() => getMarketSessions());
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<"live" | "simulated">("simulated");

  const priceRef = useRef(btcPrice);
  priceRef.current = btcPrice;

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch BTC price + DB signals + real TA in parallel
      const [{ price, change24h }, dbSigs, taMap] = await Promise.all([
        fetchBtcPrice(),
        fetchDbSignals(),
        fetchTaSignals(),
      ]);

      const newPrice = price > 0 ? price : priceRef.current;
      const newChange = price > 0 ? change24h : btcChange24h;
      const newAssets = buildAssets(newPrice, taMap);

      setBtcPrice(newPrice);
      setBtcChange24h(newChange);
      setAssets(newAssets);
      setWhaleAlerts(buildWhaleAlerts(newPrice));

      // Prefer real signals from DB; fall back to simulated
      if (dbSigs.length > 0) {
        const mapped = dbSigs.map((s) => mapDbSignal(s, newAssets));
        setSignals(mapped);
        setDataSource("live");
      } else {
        setSignals(buildSimulatedSignals(newAssets));
        setDataSource(price > 0 ? "live" : "simulated");
      }
    } catch {
      setDataSource("simulated");
    } finally {
      setIsLoading(false);
      setLastUpdate(new Date());
    }
  }, []);

  const refresh = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
    const priceInterval = setInterval(fetchAll, 30000);         // price + signals every 30s
    const whaleInterval = setInterval(() => setWhaleAlerts(buildWhaleAlerts(priceRef.current)), 180000);
    const sessionInterval = setInterval(() => setMarketSessions(getMarketSessions()), 60000);
    return () => {
      clearInterval(priceInterval);
      clearInterval(whaleInterval);
      clearInterval(sessionInterval);
    };
  }, [fetchAll]);

  const buyCount = assets.filter((a) => a.signal === "BUY" || a.signal === "BUY_STRONG").length;
  const biasScore = Math.round((buyCount / Math.max(assets.length, 1)) * 100);
  const marketBias: MarketData["marketBias"] =
    biasScore >= 60 ? "ALCISTA" : biasScore <= 40 ? "BAJISTA" : "NEUTRAL";
  const fearGreedIndex = Math.round(30 + seededVal(Date.now() / 86400000, 1.5) * 60);
  const avgFundingRate = parseFloat(((seededVal(1, 2.2) - 0.3) * 0.15).toFixed(4));

  return (
    <MarketContext.Provider
      value={{
        btcPrice, btcChange24h, marketBias, biasScore,
        assets, signals, fearGreedIndex, avgFundingRate,
        whaleAlerts, marketSessions,
        isLoading, lastUpdate, dataSource, refresh,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  return useContext(MarketContext);
}
