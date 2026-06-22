import React, { useState, useEffect, useCallback } from "react";
import SiteNav from "@/components/site-nav";

// ─── Wallets conocidas — LookOnChain + Ballenas + Trump Family ───────────────
// Agrupadas por categoría para mejor UX
const KNOWN_WALLETS = [

  // ── LOOKONCHAIN SMART MONEY ──────────────────────────────────────────────
  {
    id: "whale-short-eth",
    label: "Whale Short ETH",
    alias: "0x1be4",
    address: "0x1be45feF92C4E2538fEcd150757Ed62b7B3757D7",
    chain: "ETH",
    color: "#ff4444",
    category: "lookonchain",
    note: "Borrow ETH de Aave y vende en Binance — short institucional activo",
    tags: ["SHORT", "AAVE", "BINANCE"],
  },
  {
    id: "whale-hype",
    label: "Whale HYPE",
    alias: "0x6436",
    address: "0x6436D88D376Ea7FbDe1AB5A8Db7151579Bc90103",
    chain: "ETH",
    color: "#e040fb",
    category: "lookonchain",
    note: "Retira millones de HYPE de exchanges — acumulación/staking masivo",
    tags: ["HYPE", "STAKING"],
  },
  {
    id: "pando-hacker",
    label: "Pando Rings Hacker",
    alias: "0x303D",
    address: "0x303D0A175CeEC14DD7B3d4F60CABE6CEc06a3d9F",
    chain: "ETH",
    color: "#ff6d00",
    category: "lookonchain",
    note: "Trading ETH activo — compra dips y vende rallies",
    tags: ["TRADER", "ETH"],
  },
  {
    id: "leveraged-eth",
    label: "Leveraged ETH Whale",
    alias: "0xc70a",
    address: "0xc70ad21c69cbf3631637f2796a42e94c42013810",
    chain: "ETH",
    color: "#ffd700",
    category: "lookonchain",
    note: "Compras apalancadas de ETH — alto riesgo / alto convicción",
    tags: ["LONG", "APALANCADO", "ETH"],
  },

  // ── TRUMP FAMILY + WLFI ──────────────────────────────────────────────────
  {
    id: "trump-wallet",
    label: "Donald Trump (linked)",
    alias: "0x9484",
    address: "0x94845333028b1204fbe14e1278fd4adde46b22ce",
    chain: "ETH",
    color: "#ff6b35",
    category: "trump",
    note: "Wallet vinculada por Arkham — holdings WLFI / TRUMP memecoin / ETH",
    tags: ["TRUMP", "WLFI", "POLÍTICO"],
  },
  {
    id: "wlfi-treasury",
    label: "WLFI Treasury (Multisig)",
    alias: "0x5be9",
    address: "0x5be9a4959308a0d0c7bc0870e319314d8d957dbb",
    chain: "ETH",
    color: "#ff9100",
    category: "trump",
    note: "Multisig principal de World Liberty Financial — muy trackeable en Etherscan",
    tags: ["WLFI", "MULTISIG", "DeFi"],
  },
  {
    id: "justin-sun",
    label: "Justin Sun (TRON/WLFI)",
    alias: "0x3ddf",
    address: "0x3ddfa8ec3052539b6c9549f12cea2c295cff5296",
    chain: "ETH",
    color: "#ff1744",
    category: "trump",
    note: "Inversor grande en WLFI — wallets muy activas y trackeadas en multi-chain",
    tags: ["TRON", "WLFI", "INVERSOR"],
  },

  // ── GRANDES BALLENAS CONOCIDAS ───────────────────────────────────────────
  {
    id: "vitalik",
    label: "Vitalik Buterin",
    alias: "0xd8dA",
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    chain: "ETH",
    color: "#00e5ff",
    category: "whales",
    note: "Co-fundador Ethereum — donaciones públicas frecuentes, muy transparente",
    tags: ["ETH", "FUNDADOR", "DONACIONES"],
  },
  {
    id: "eth-foundation",
    label: "Ethereum Foundation",
    alias: "0xde0B (EF)",
    address: "0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe",
    chain: "ETH",
    color: "#536dfe",
    category: "whales",
    note: "Treasury principal de Ethereum Foundation — ventas periódicas para operaciones",
    tags: ["ETH", "TREASURY", "PROTOCOLO"],
  },
];

// ─── Categorías para UI ───────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all",         label: "Todas",          color: "#7ab3c8" },
  { id: "lookonchain", label: "🔍 LookOnChain",  color: "#00e5ff" },
  { id: "trump",       label: "🇺🇸 Trump/WLFI",  color: "#ff6b35" },
  { id: "whales",      label: "🐋 Ballenas",     color: "#e040fb" },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface TxRaw {
  hash: string;
  from: string;
  to: string;
  value: string;        // wei (ETH) o cantidad (ERC-20)
  timeStamp: string;
  tokenName?: string;
  tokenSymbol?: string;
  tokenDecimal?: string;
  gas: string;
  gasPrice: string;
  isError?: string;
  contractAddress?: string;
  input?: string;
}

interface TxParsed {
  hash: string;
  timestamp: number;
  from: string;
  to: string;
  value: number;
  symbol: string;
  usdValue?: number;
  direction: "IN" | "OUT";
  type: string;         // TRANSFER / SWAP / CONTRACT / etc
  isError: boolean;
}

interface WalletData {
  address: string;
  balance: number;       // ETH
  balanceUsd: number;
  txCount: number;
  txs: TxParsed[];
  lastActivity: number;
  loading: boolean;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const API_BASE = "https://api.etherscan.io/api";
const ETHERSCAN_KEY = (import.meta as Record<string, unknown> & { env?: Record<string, string> }).env?.VITE_ETHERSCAN_API_KEY ?? "";

async function ethFetch(params: Record<string, string>) {
  const qs = new URLSearchParams({ ...params, apikey: ETHERSCAN_KEY }).toString();
  const r = await fetch(`${API_BASE}?${qs}`);
  const j = await r.json();
  if (j.status !== "1" && j.message !== "No transactions found") throw new Error(j.message ?? "API error");
  return j.result;
}

function weiToEth(wei: string) {
  return parseFloat(wei) / 1e18;
}

function fmtEth(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  if (n >= 1)    return n.toFixed(3);
  return n.toFixed(6);
}

function fmtUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function timeAgo(ts: number) {
  const diff = Date.now() / 1000 - ts;
  if (diff < 60)      return "hace <1m";
  if (diff < 3600)    return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400)   return `hace ${Math.floor(diff / 3600)}h`;
  if (diff < 604800)  return `hace ${Math.floor(diff / 86400)}d`;
  return new Date(ts * 1000).toLocaleDateString("es-EC");
}

function parseTxType(tx: TxRaw, myAddr: string): TxParsed {
  const from = tx.from.toLowerCase();
  const to   = (tx.to ?? "").toLowerCase();
  const me   = myAddr.toLowerCase();
  const direction: "IN" | "OUT" = from === me ? "OUT" : "IN";

  let symbol = "ETH";
  let value  = weiToEth(tx.value ?? "0");

  if (tx.tokenSymbol) {
    symbol = tx.tokenSymbol;
    const dec = parseInt(tx.tokenDecimal ?? "18", 10);
    value = parseFloat(tx.value ?? "0") / Math.pow(10, dec);
  }

  // Classify
  let type = "TRANSFER";
  if (tx.input && tx.input !== "0x" && tx.input.length > 10) type = "CONTRATO";
  if (tx.tokenSymbol) type = "TOKEN";
  if (to.includes("0x000000000000000000000000")) type = "BURN";

  return {
    hash: tx.hash,
    timestamp: parseInt(tx.timeStamp, 10),
    from: tx.from,
    to: tx.to ?? "",
    value,
    symbol,
    direction,
    type,
    isError: tx.isError === "1",
  };
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function WhaleTracker() {
  const [selected,  setSelected]  = useState<string>("all");
  const [category,  setCategory]  = useState<string>("all");
  const [wallets,   setWallets]   = useState<Record<string, WalletData>>({});
  const [ethPrice,  setEthPrice]  = useState(3000);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [filter,    setFilter]    = useState<"all"|"IN"|"OUT">("all");
  const [minValue,  setMinValue]  = useState(0);

  // Fetch ETH price once
  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd")
      .then(r => r.json())
      .then(d => setEthPrice(d?.ethereum?.usd ?? 3000))
      .catch(() => {});
  }, []);

  const fetchWallet = useCallback(async (addr: string) => {
    setWallets(prev => ({ ...prev, [addr]: { ...prev[addr], loading: true, error: undefined } as WalletData }));

    try {
      // 1. ETH Balance
      const balRaw = await ethFetch({ module: "account", action: "balance", address: addr, tag: "latest" });
      const balance = weiToEth(balRaw);

      // 2. Normal TXs (last 30)
      const normalRaw: TxRaw[] = await ethFetch({
        module: "account", action: "txlist", address: addr,
        startblock: "0", endblock: "99999999", page: "1", offset: "30", sort: "desc",
      }).catch(() => []);

      // 3. ERC-20 Token TXs (last 30)
      const tokenRaw: TxRaw[] = await ethFetch({
        module: "account", action: "tokentx", address: addr,
        startblock: "0", endblock: "99999999", page: "1", offset: "30", sort: "desc",
      }).catch(() => []);

      // Merge + sort by timestamp desc
      const allTxs = [
        ...normalRaw.map(tx => parseTxType(tx, addr)),
        ...tokenRaw.map(tx => parseTxType(tx, addr)),
      ]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50);

      // Add USD values
      const txsWithUsd = allTxs.map(tx => ({
        ...tx,
        usdValue: tx.symbol === "ETH" ? tx.value * ethPrice :
                  tx.symbol === "USDC" || tx.symbol === "USDT" || tx.symbol === "DAI" ? tx.value :
                  undefined,
      }));

      const lastActivity = txsWithUsd[0]?.timestamp ?? 0;
      const txCount = normalRaw.length;

      setWallets(prev => ({
        ...prev,
        [addr]: {
          address: addr,
          balance,
          balanceUsd: balance * ethPrice,
          txCount,
          txs: txsWithUsd,
          lastActivity,
          loading: false,
        },
      }));
    } catch (e) {
      setWallets(prev => ({
        ...prev,
        [addr]: {
          address: addr,
          balance: 0,
          balanceUsd: 0,
          txCount: 0,
          txs: [],
          lastActivity: 0,
          loading: false,
          error: "Sin API key de Etherscan configurada — agrega VITE_ETHERSCAN_API_KEY",
        },
      }));
    }
  }, [ethPrice]);

  const refreshAll = useCallback(() => {
    setLastRefresh(new Date());
    KNOWN_WALLETS.forEach(w => fetchWallet(w.address));
  }, [fetchWallet]);

  useEffect(() => { refreshAll(); }, []);
  useEffect(() => {
    const id = setInterval(refreshAll, 120_000); // refresh every 2min
    return () => clearInterval(id);
  }, [refreshAll]);

  // ── Active wallets to show ──────────────────────────────────────────────────
  const activeWallets = KNOWN_WALLETS.filter(w => {
    if (selected !== "all" && w.id !== selected) return false;
    if (category !== "all" && w.category !== category) return false;
    return true;
  });

  // ── All transactions merged ───────────────────────────────────────────────
  const walletsForFeed = category === "all" && selected === "all" ? KNOWN_WALLETS : activeWallets;
  const allTxsMerged = walletsForFeed
    .flatMap(w => {
      const data = wallets[w.address];
      if (!data?.txs) return [];
      return data.txs.map(tx => ({
        ...tx,
        walletLabel: w.label,
        walletColor: w.color,
        walletAlias: w.alias,
      }));
    })
    .filter(tx => {
      if (filter !== "all" && tx.direction !== filter) return false;
      if (minValue > 0 && (tx.usdValue ?? 0) < minValue * 1000) return false;
      return true;
    })
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 100);

  return (
    <div className="min-h-screen bg-[#020b12] text-white">
      <SiteNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">

        {/* ── HEADER ── */}
        <div className="mb-8">
          <button onClick={() => window.history.back()}
            className="font-sharetech text-[8px] tracking-[0.15em] text-[#7ab3c8] hover:text-[#00e5ff] transition-colors mb-4 flex items-center gap-1.5">
            ← VOLVER
          </button>
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-3">
            PSYCHOMETRIKS · ON-CHAIN INTELLIGENCE · POWERED BY ETHERSCAN
          </div>
          <h1 className="font-bebas text-5xl md:text-7xl leading-none text-white mb-2">
            WHALE <span className="text-[#00e5ff]">TRACKER</span>
          </h1>
          <p className="font-space text-[11px] text-[#7ab3c8] max-w-2xl">
            Seguimiento en tiempo real de las wallets más mencionadas por <span className="text-[#00e5ff]">@lookonchain</span>.
            Monitorea qué compran, qué venden y cuándo mueven fondos estas ballenas institucionales.
          </p>

          {/* Live indicator */}
          <div className="flex items-center gap-2 mt-3">
            <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
            <span className="font-sharetech text-[8px] text-[#00e676] tracking-[0.1em]">
              LIVE — actualización cada 2min
            </span>
            {lastRefresh && (
              <span className="font-sharetech text-[7px] text-[#5a8898]">
                · última: {lastRefresh.toLocaleTimeString("es-EC")}
              </span>
            )}
            <button onClick={refreshAll}
              className="ml-3 font-sharetech text-[7px] px-3 py-1 border border-[#0d2030] text-[#7ab3c8] hover:border-[#00e5ff] hover:text-[#00e5ff] transition-all">
              ↻ REFRESH
            </button>
          </div>
        </div>

        {/* ── CATEGORY FILTERS ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="font-sharetech text-[7px] text-[#5a8898] self-center tracking-[0.1em]">CATEGORÍA:</span>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => { setCategory(c.id); setSelected("all"); }}
              className="font-sharetech text-[7px] px-3 py-1.5 border transition-all"
              style={{
                borderColor: category === c.id ? c.color : "#0d2030",
                color:       category === c.id ? c.color : "#7ab3c8",
                background:  category === c.id ? `${c.color}12` : "transparent",
              }}>
              {c.label}
            </button>
          ))}
          <div className="ml-auto font-sharetech text-[7px] text-[#5a8898] self-center">
            {activeWallets.length} wallets · {KNOWN_WALLETS.length} total
          </div>
        </div>

        {/* ── WALLET CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
          {(category === "all" ? KNOWN_WALLETS : KNOWN_WALLETS.filter(w => w.category === category)).map(w => {
            const data = wallets[w.address];
            const isActive = selected === w.id || selected === "all";
            return (
              <div key={w.id}
                className="border cursor-pointer transition-all p-4"
                style={{
                  borderColor: selected === w.id ? w.color : "#0d2030",
                  background: selected === w.id ? `${w.color}08` : "#040f18",
                  boxShadow: selected === w.id ? `0 0 20px ${w.color}20` : "none",
                }}
                onClick={() => setSelected(selected === w.id ? "all" : w.id)}>

                {/* Label + chain */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-bebas text-lg leading-none" style={{ color: w.color }}>
                      {w.label}
                    </div>
                    <div className="font-sharetech text-[7px] text-[#5a8898] mt-0.5">
                      {w.alias} · {w.chain}
                    </div>
                  </div>
                  <span className="font-sharetech text-[6px] px-1.5 py-0.5 border ml-2 shrink-0"
                    style={{ borderColor: `${w.color}40`, color: w.color, background: `${w.color}10` }}>
                    {w.category === "lookonchain" ? "LOC" : w.category === "trump" ? "🇺🇸" : "🐋"}
                  </span>
                </div>

                {/* Balance */}
                {data?.loading ? (
                  <div className="font-sharetech text-[8px] text-[#5a8898] animate-pulse">Cargando…</div>
                ) : data?.error ? (
                  <div className="font-sharetech text-[7px] text-[#ff4444] leading-relaxed">{data.error}</div>
                ) : (
                  <>
                    <div className="font-bebas text-2xl text-white">
                      {fmtEth(data?.balance ?? 0)} ETH
                    </div>
                    <div className="font-sharetech text-[8px] text-[#5a8898]">
                      ≈ {fmtUsd(data?.balanceUsd ?? 0)}
                    </div>
                    <div className="font-sharetech text-[7px] text-[#3a4a5a] mt-1">
                      Última tx: {data?.lastActivity ? timeAgo(data.lastActivity) : "─"}
                    </div>
                  </>
                )}

                {/* Tags */}
                <div className="flex gap-1 mt-2 flex-wrap">
                  {w.tags.map(t => (
                    <span key={t} className="font-sharetech text-[5.5px] px-1 py-0.5 border"
                      style={{ borderColor: `${w.color}40`, color: w.color, background: `${w.color}10` }}>
                      {t}
                    </span>
                  ))}
                </div>

                {/* Note */}
                <div className="font-space text-[7px] text-[#5a8898] mt-2 leading-relaxed">
                  {w.note}
                </div>

                {/* Address link */}
                <a href={`https://etherscan.io/address/${w.address}`}
                  target="_blank" rel="noreferrer"
                  className="font-sharetech text-[6px] text-[#3a5a6a] hover:text-[#00e5ff] transition-colors mt-2 block"
                  onClick={e => e.stopPropagation()}>
                  {w.address.slice(0, 10)}…{w.address.slice(-6)} ↗
                </a>
              </div>
            );
          })}
        </div>

        {/* ── FILTERS ── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="font-sharetech text-[7px] text-[#5a8898] tracking-[0.1em]">FILTROS:</div>

          {(["all", "IN", "OUT"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="font-sharetech text-[7px] px-3 py-1.5 border transition-all"
              style={{
                borderColor: filter === f ? "#00e5ff" : "#0d2030",
                color: filter === f ? "#00e5ff" : "#7ab3c8",
                background: filter === f ? "rgba(0,229,255,.08)" : "transparent",
              }}>
              {f === "all" ? "TODAS" : f === "IN" ? "✅ ENTRADAS" : "🔴 SALIDAS"}
            </button>
          ))}

          <div className="flex items-center gap-2 ml-3">
            <span className="font-sharetech text-[7px] text-[#5a8898]">MÍNIMO:</span>
            <select value={minValue} onChange={e => setMinValue(+e.target.value)}
              className="font-sharetech text-[7px] bg-[#040f18] border border-[#0d2030] text-[#7ab3c8] px-2 py-1 outline-none">
              <option value={0}>Cualquier valor</option>
              <option value={10}>≥ $10K</option>
              <option value={100}>≥ $100K</option>
              <option value={500}>≥ $500K</option>
              <option value={1000}>≥ $1M</option>
            </select>
          </div>

          <div className="ml-auto font-sharetech text-[7px] text-[#5a8898]">
            {allTxsMerged.length} transacciones
          </div>
        </div>

        {/* ── TRANSACTIONS FEED ── */}
        <div className="border border-[#0d2030] bg-[#040f18]">

          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1.5fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-[#0d2030] font-sharetech text-[7px] tracking-[0.08em] text-[#5a8898]">
            <div>WALLET</div>
            <div>TIEMPO</div>
            <div>TRANSACCIÓN</div>
            <div className="text-center">TIPO</div>
            <div className="text-center">VALOR</div>
            <div className="text-center">DIRECCIÓN</div>
          </div>

          {allTxsMerged.length === 0 ? (
            <div className="p-12 text-center">
              <div className="font-sharetech text-[9px] text-[#5a8898] animate-pulse tracking-[0.2em]">
                {Object.values(wallets).some(w => w.loading)
                  ? "CARGANDO TRANSACCIONES ON-CHAIN…"
                  : "SIN TRANSACCIONES — CONFIGURA ETHERSCAN_API_KEY EN RAILWAY"}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#081520] max-h-[600px] overflow-y-auto">
              {allTxsMerged.map((tx, i) => {
                const dirColor = tx.direction === "IN" ? "#00e676" : "#ff4444";
                const dirIcon  = tx.direction === "IN" ? "↓" : "↑";
                const usdStr   = tx.usdValue !== undefined ? fmtUsd(tx.usdValue) : "─";
                const isLarge  = (tx.usdValue ?? 0) >= 100_000;

                return (
                  <div key={`${tx.hash}-${i}`}
                    className="grid grid-cols-[1fr_1fr_1.5fr_1fr_1fr_1fr] gap-3 px-4 py-3 hover:bg-[#060f1a] transition-colors items-center"
                    style={{ background: isLarge ? `${(tx as typeof tx & { walletColor?: string }).walletColor ?? "#fff"}06` : undefined }}>

                    {/* Wallet */}
                    <div>
                      <div className="font-sharetech text-[8px] font-bold"
                        style={{ color: (tx as typeof tx & { walletColor?: string }).walletColor }}>
                        {(tx as typeof tx & { walletLabel?: string }).walletLabel ?? "─"}
                      </div>
                      <div className="font-sharetech text-[6px] text-[#5a8898]">
                        {(tx as typeof tx & { walletAlias?: string }).walletAlias}
                      </div>
                    </div>

                    {/* Tiempo */}
                    <div className="font-sharetech text-[7px] text-[#5a8898]">
                      {timeAgo(tx.timestamp)}
                    </div>

                    {/* TX hash + to/from */}
                    <div>
                      <a href={`https://etherscan.io/tx/${tx.hash}`}
                        target="_blank" rel="noreferrer"
                        className="font-sharetech text-[7px] text-[#3a6a7a] hover:text-[#00e5ff] transition-colors">
                        {tx.hash.slice(0, 12)}… ↗
                      </a>
                      <div className="font-sharetech text-[6px] text-[#3a4a5a] mt-0.5 truncate">
                        {tx.direction === "OUT"
                          ? `→ ${tx.to.slice(0, 8)}…${tx.to.slice(-4)}`
                          : `← ${tx.from.slice(0, 8)}…${tx.from.slice(-4)}`}
                      </div>
                    </div>

                    {/* Tipo */}
                    <div className="text-center">
                      <span className="font-sharetech text-[6.5px] px-1.5 py-0.5 border border-[#0d2030] text-[#7ab3c8]">
                        {tx.type}
                      </span>
                      {tx.isError && (
                        <div className="font-sharetech text-[5.5px] text-[#ff4444] mt-0.5">ERROR</div>
                      )}
                    </div>

                    {/* Valor */}
                    <div className="text-center">
                      <div className="font-space text-[9px] font-bold"
                        style={{ color: isLarge ? "#ffd700" : "#ffffff" }}>
                        {fmtEth(tx.value)} {tx.symbol}
                      </div>
                      {tx.usdValue !== undefined && (
                        <div className="font-sharetech text-[6px] text-[#5a8898]">{usdStr}</div>
                      )}
                    </div>

                    {/* Dirección */}
                    <div className="text-center">
                      <div className="font-bebas text-lg leading-none" style={{ color: dirColor }}>
                        {dirIcon} {tx.direction}
                      </div>
                      {isLarge && (
                        <div className="font-sharetech text-[5.5px] text-[#ffd700] mt-0.5 animate-pulse">
                          🐋 GRANDE
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── INFO BOX ── */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* How it works */}
          <div className="border border-[#0d2030] bg-[#040f18] p-4">
            <div className="font-sharetech text-[8px] tracking-[0.15em] text-[#00e5ff] mb-3">
              📊 CÓMO LEER ESTE TRACKER
            </div>
            <div className="space-y-2 font-space text-[9px] text-[#7ab3c8] leading-relaxed">
              <div>• <span className="text-[#00e676]">↓ ENTRADA</span> — la wallet <strong>recibe</strong> fondos (acumulación posible)</div>
              <div>• <span className="text-[#ff4444]">↑ SALIDA</span> — la wallet <strong>envía</strong> fondos (distribución o depósito en exchange)</div>
              <div>• <span className="text-[#ffd700]">🐋 GRANDE</span> — movimiento &gt;$100K — alta relevancia</div>
              <div>• <span className="text-white">CONTRATO</span> — interacción con DeFi (Aave, Uniswap, etc.)</div>
              <div>• <span className="text-[#e040fb]">TOKEN</span> — transferencia de ERC-20 (USDT, HYPE, etc.)</div>
            </div>
          </div>

          {/* LookOnChain context */}
          <div className="border border-[#0d2030] bg-[#040f18] p-4">
            <div className="font-sharetech text-[8px] tracking-[0.15em] text-[#ffd700] mb-3">
              📋 WALLETS MONITOREADAS ({KNOWN_WALLETS.length} total)
            </div>
            <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
              {KNOWN_WALLETS.map(w => (
                <div key={w.id} className="flex gap-2 items-start">
                  <span className="font-sharetech text-[7px] mt-0.5 shrink-0" style={{ color: w.color }}>●</span>
                  <div>
                    <span className="font-sharetech text-[7px]" style={{ color: w.color }}>{w.label}</span>
                    <span className="font-sharetech text-[6px] text-[#3a4a5a] mx-1">
                      [{w.category === "lookonchain" ? "LOC" : w.category === "trump" ? "TRUMP" : "WHALE"}]
                    </span>
                    <span className="font-space text-[7px] text-[#5a8898]">— {w.note}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[#0d2030] flex gap-3">
              <a href="https://x.com/lookonchain" target="_blank" rel="noreferrer"
                className="font-sharetech text-[7px] text-[#00e5ff] hover:underline">
                @lookonchain ↗
              </a>
              <a href="https://arkham.intelligence" target="_blank" rel="noreferrer"
                className="font-sharetech text-[7px] text-[#ffd700] hover:underline">
                Arkham Intel ↗
              </a>
              <a href="https://etherscan.io" target="_blank" rel="noreferrer"
                className="font-sharetech text-[7px] text-[#00e676] hover:underline">
                Etherscan ↗
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 font-sharetech text-[7px] text-[#3a4a5a] text-center tracking-[0.1em]">
          PSYCHOMETRIKS WHALE TRACKER · POWERED BY ETHERSCAN API · SOLO INFORMATIVO
        </div>
      </div>
    </div>
  );
}
