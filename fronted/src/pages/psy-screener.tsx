import React, { useState, useEffect, useCallback, useMemo } from "react";
import SiteNav from "@/components/site-nav";

const SIGNALS_URL = "/api/proxy/signals/altcoins";

interface RealTA {
  direction: "LONG" | "SHORT";
  score: number;
  rsi1h: number;
  rsi4h?: number;
  macdHistogram: number;
  macdCross: boolean;
  volumeSpike: number;
  htfBias?: "BULLISH" | "BEARISH" | "NEUTRAL";
  struct1h?: string;
  indicators: string[];
}

interface CoinRaw {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_1h_in_currency: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  total_volume: number;
  ath: number;
  atl: number;
  ath_change_percentage: number;
  circulating_supply: number;
}

interface CoinSignal {
  id: string;
  symbol: string;
  name: string;
  image: string;
  rank: number;
  price: number;
  change1h: number;
  change24h: number;
  change7d: number;
  volume: number;
  marketCap: number;
  athPct: number;
  psyScore: number;
  signal: "BUY FUERTE" | "BUY" | "NEUTRAL" | "SELL" | "SELL FUERTE";
  signalColor: string;
  components: { label: string; value: number; color: string }[];
}

function psySignal(coin: CoinRaw, ta?: RealTA): CoinSignal {
  const c1h    = coin.price_change_percentage_1h_in_currency ?? 0;
  const c24h   = coin.price_change_percentage_24h ?? 0;
  const c7d    = coin.price_change_percentage_7d_in_currency ?? 0;
  const athPct = coin.ath_change_percentage ?? 0;

  let psyScore: number;
  let components: CoinSignal["components"];

  if (ta) {
    // ── Real TA from signals server ─────────────────────────────────────
    const base = ta.direction === "LONG"
      ? 50 + Math.round((ta.score / 8) * 50)
      : 50 - Math.round((ta.score / 8) * 50);
    psyScore = Math.max(0, Math.min(100, base));

    const rsiVal   = Math.round((ta.rsi1h / 100) * 50);
    const macdVal  = ta.macdHistogram > 0 ? 35 : 15;
    const volVal   = Math.min(50, Math.round(ta.volumeSpike * 10));
    const dirVal   = ta.direction === "LONG" ? 40 : 10;
    const htfVal   = ta.htfBias === "BULLISH" ? 42 : ta.htfBias === "BEARISH" ? 8 : 25;

    components = [
      { label: "RSI 1H",       value: rsiVal,  color: ta.rsi1h < 35 ? "#00e676" : ta.rsi1h > 65 ? "#ff1744" : "#ffd700" },
      { label: "MACD 1H",      value: macdVal, color: ta.macdHistogram > 0 ? "#00e676" : "#ff1744" },
      { label: "Vol. Spike",   value: volVal,  color: ta.volumeSpike > 2 ? "#00e5ff" : "#4a6070" },
      { label: "Bias 4H",      value: htfVal,  color: ta.htfBias === "BULLISH" ? "#00e676" : ta.htfBias === "BEARISH" ? "#ff1744" : "#4a6070" },
      { label: "Dirección",    value: dirVal,  color: ta.direction === "LONG" ? "#00e676" : "#ff1744" },
    ];
  } else {
    // ── Fallback: price-action formula ──────────────────────────────────
    const momentum  = Math.max(-25, Math.min(25, c1h * 4 + c24h * 1.2));
    const trend     = Math.max(-20, Math.min(20, c7d * 0.8));
    const athDist   = athPct > -5 ? -8 : athPct > -20 ? 3 : athPct > -50 ? 8 : 5;
    const volSignal = c24h > 3 ? 8 : c24h < -3 ? -8 : 0;
    const divergence = (c1h > 0 && c24h < -2) ? 5 : (c1h < 0 && c24h > 2) ? -5 : 0;
    const raw = 50 + momentum + trend + athDist + volSignal + divergence;
    psyScore = Math.max(0, Math.min(100, Math.round(raw)));
    components = [
      { label: "Momentum",  value: Math.round(momentum + 25),  color: momentum >= 0 ? "#00e676" : "#ff1744" },
      { label: "Tendencia", value: Math.round(trend + 20),     color: trend >= 0 ? "#00e676" : "#ff1744" },
      { label: "ATH Dist",  value: Math.round(athDist + 10),   color: "#ffd700" },
      { label: "Volumen",   value: Math.round(volSignal + 10), color: "#00e5ff" },
      { label: "Div. PSY",  value: Math.round(divergence + 5), color: "#7c4dff" },
    ];
  }

  let signal: CoinSignal["signal"], signalColor: string;
  if      (psyScore >= 70) { signal = "BUY FUERTE";  signalColor = "#00e676"; }
  else if (psyScore >= 55) { signal = "BUY";         signalColor = "#00c853"; }
  else if (psyScore >= 45) { signal = "NEUTRAL";     signalColor = "#4a6070"; }
  else if (psyScore >= 30) { signal = "SELL";        signalColor = "#ff6d00"; }
  else                     { signal = "SELL FUERTE"; signalColor = "#ff1744"; }

  return {
    id: coin.id, symbol: coin.symbol.toUpperCase(), name: coin.name,
    image: coin.image, rank: coin.market_cap_rank,
    price: coin.current_price, change1h: c1h, change24h: c24h,
    change7d: c7d, volume: coin.total_volume, marketCap: coin.market_cap,
    athPct, psyScore, signal, signalColor, components,
  };
}

function fmtPrice(p: number): string {
  if (p >= 1000) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 1)    return "$" + p.toFixed(3);
  if (p >= 0.01) return "$" + p.toFixed(5);
  return "$" + p.toFixed(7);
}
function fmtMcap(m: number): string {
  if (m >= 1e12) return "$" + (m / 1e12).toFixed(2) + "T";
  if (m >= 1e9)  return "$" + (m / 1e9).toFixed(1) + "B";
  if (m >= 1e6)  return "$" + (m / 1e6).toFixed(0) + "M";
  return "$" + m.toFixed(0);
}
function changeFmt(v: number) {
  return { text: `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`, color: v >= 0 ? "#00e676" : "#ff1744" };
}

function getAuth() { try { const r = localStorage.getItem("psyko_auth"); if (!r) return null; const s = JSON.parse(r) as { role?: string; plan?: string; ts?: number }; if (Date.now() - (s.ts ?? 0) > 28800000) return null; return s; } catch { return null; } }
function ScreenerGate() {
  const color = "#00e5ff";
  return (
    <div style={{ minHeight: "100vh", background: "#020408", color: "#fff", display: "flex", flexDirection: "column" }}>
      <SiteNav />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px 24px" }}>
        <div style={{ border: `1px solid ${color}33`, background: "#060a0f", padding: 40, maxWidth: 440, width: "100%", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
          <div style={{ fontSize: 44, marginBottom: 16 }}>🔍</div>
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color, letterSpacing: "0.4em", marginBottom: 8 }}>PLAN PRO REQUERIDO</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: "#fff", marginBottom: 8 }}>PSY SCREENER</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: "#546e7a", marginBottom: 24, lineHeight: 1.6 }}>
            El screener institucional está disponible desde el plan <span style={{ color, fontWeight: 700 }}>PRO</span> ($49/mes).
          </div>
          <div style={{ background: "#0d1520", border: `1px solid ${color}22`, padding: "14px 18px", marginBottom: 24, textAlign: "left" }}>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color, letterSpacing: "0.2em", marginBottom: 10 }}>⬡ INCLUÍDO EN PLAN PRO</div>
            {["Top 50 cryptos con señales PSY-DLT1","Score PSY 0–180 por activo","Filtros Buy Fuerte / Sell Fuerte","Datos en tiempo real · CoinGecko Pro","Ordenar por señal, ranking o cambio 24h"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: "#8a9ab0", marginBottom: 6 }}><span style={{ color, fontSize: 9 }}>✦</span> {f}</div>
            ))}
          </div>
          <a href="/pricing" style={{ display: "block", padding: "12px", background: color, color: "#020408", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase" as const, textDecoration: "none" }}>VER PLANES →</a>
          <div style={{ marginTop: 12, fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, color: "#2a4a5a" }}>¿Ya tenés plan? <a href="/login" style={{ color, textDecoration: "none" }}>Iniciá sesión</a></div>
        </div>
      </div>
    </div>
  );
}

const SIGNAL_ORDER = ["BUY FUERTE","BUY","NEUTRAL","SELL","SELL FUERTE"];

// ── Metadata estática para fallback OKX (sin API key, sin rate limit) ────────
const OKX_META: Record<string, { id: string; name: string; rank: number; image: string; ath: number; circ: number }> = {
  BTC:  { id:"bitcoin",            name:"Bitcoin",     rank:1,  image:"https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png",           ath:108000,       circ:19.7e6  },
  ETH:  { id:"ethereum",           name:"Ethereum",    rank:2,  image:"https://assets.coingecko.com/coins/images/279/thumb/ethereum.png",         ath:4878,         circ:120e6   },
  SOL:  { id:"solana",             name:"Solana",      rank:4,  image:"https://assets.coingecko.com/coins/images/4128/thumb/solana.png",          ath:294,          circ:457e6   },
  BNB:  { id:"binancecoin",        name:"BNB",         rank:3,  image:"https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png",     ath:788,          circ:145e6   },
  XRP:  { id:"ripple",             name:"XRP",         rank:5,  image:"https://assets.coingecko.com/coins/images/44/thumb/xrp-symbol-white.png",  ath:3.84,         circ:55.8e9  },
  AVAX: { id:"avalanche-2",        name:"Avalanche",   rank:10, image:"https://assets.coingecko.com/coins/images/12559/thumb/Avalanche.png",      ath:146,          circ:411e6   },
  DOGE: { id:"dogecoin",           name:"Dogecoin",    rank:8,  image:"https://assets.coingecko.com/coins/images/5/thumb/dogecoin.png",           ath:0.74,         circ:145e9   },
  OP:   { id:"optimism",           name:"Optimism",    rank:35, image:"https://assets.coingecko.com/coins/images/25244/thumb/Optimism.png",       ath:4.84,         circ:1.03e9  },
  ARB:  { id:"arbitrum",           name:"Arbitrum",    rank:38, image:"https://assets.coingecko.com/coins/images/16547/thumb/photo_2023-03-29_21.47.00.jpeg", ath:2.39, circ:2.54e9 },
  LINK: { id:"chainlink",          name:"Chainlink",   rank:14, image:"https://assets.coingecko.com/coins/images/877/thumb/chainlink-new-logo.png",ath:52.7,        circ:601e6   },
  DOT:  { id:"polkadot",           name:"Polkadot",    rank:18, image:"https://assets.coingecko.com/coins/images/12171/thumb/polkadot.png",       ath:55,           circ:1.41e9  },
  UNI:  { id:"uniswap",            name:"Uniswap",     rank:20, image:"https://assets.coingecko.com/coins/images/12504/thumb/uniswap-uni.png",    ath:44.9,         circ:600e6   },
  PEPE: { id:"pepe",               name:"Pepe",        rank:15, image:"https://assets.coingecko.com/coins/images/29850/thumb/pepe-token.jpeg",    ath:0.0000278,    circ:420e12  },
  SUI:  { id:"sui",                name:"Sui",         rank:12, image:"https://assets.coingecko.com/coins/images/26375/thumb/sui_asset.jpeg",     ath:5.35,         circ:2.78e9  },
  TIA:  { id:"celestia",           name:"Celestia",    rank:42, image:"https://assets.coingecko.com/coins/images/31967/thumb/tia.jpg",            ath:21.2,         circ:219e6   },
  INJ:  { id:"injective-protocol", name:"Injective",   rank:30, image:"https://assets.coingecko.com/coins/images/12882/thumb/Secondary_Symbol.png",ath:52.9,        circ:95.5e6  },
  WIF:  { id:"dogwifcoin",         name:"dogwifhat",   rank:25, image:"https://assets.coingecko.com/coins/images/33566/thumb/wif.png",            ath:4.83,         circ:998e6   },
  JTO:  { id:"jito-governance-token",name:"Jito",      rank:60, image:"https://assets.coingecko.com/coins/images/33228/thumb/jto.png",            ath:4.97,         circ:200e6   },
  SEI:  { id:"sei-network",        name:"Sei",         rank:55, image:"https://assets.coingecko.com/coins/images/28205/thumb/Sei_Logo_-_Transparent.png", ath:0.884, circ:1.8e9 },
  ATOM: { id:"cosmos",             name:"Cosmos",      rank:22, image:"https://assets.coingecko.com/coins/images/1481/thumb/cosmos_hub.png",      ath:44.7,         circ:390e6   },
};

function PsyScreenerContent() {
  const [coins, setCoins]         = useState<CoinSignal[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [filter, setFilter]       = useState<"all"|"buy"|"sell"|"strong">("all");
  const [sort, setSort]           = useState<"signal"|"rank"|"change24h"|"psyScore">("psyScore");
  const [sortDir, setSortDir]     = useState<1|-1>(-1);
  const [detail, setDetail]       = useState<CoinSignal|null>(null);
  const [lastUpdate, setLastUpdate] = useState("");
  const [search, setSearch]       = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const now = () => new Date().toLocaleTimeString("es-AR", { hour:"2-digit", minute:"2-digit", second:"2-digit" });

    // Fetch TA signals in parallel con la primera fuente de precios
    let taMap = new Map<string, RealTA>();
    try {
      const sr = await fetch(SIGNALS_URL);
      if (sr.ok) {
        const sd = await sr.json() as { signals: (RealTA & { symbol: string })[] };
        for (const s of sd.signals) taMap.set(s.symbol.replace("USDT","").toLowerCase(), s);
      }
    } catch { /* signals server unreachable */ }

    // ── 1. CMC (primario — key propia, datos completos: 1h/24h/7d, rank, mcap) ──
    try {
      const cr = await fetch("/api/market-data/cmc");
      if (cr.ok) {
        const cd = await cr.json() as { assets: { id:number; symbol:string; name:string; rank:number; price:number; chg1h:number; chg24h:number; chg7d:number; marketCap:number; volume24h:number; circulatingSupply:number; logo:string }[] };
        if (cd.assets?.length) {
          const raw: CoinRaw[] = cd.assets.map(c => {
            const meta = OKX_META[c.symbol];
            const ath  = meta?.ath ?? 0;
            return {
              id: c.symbol.toLowerCase(), symbol: c.symbol.toLowerCase(), name: c.name,
              image: c.logo, current_price: c.price,
              market_cap: c.marketCap, market_cap_rank: c.rank,
              price_change_percentage_1h_in_currency: c.chg1h,
              price_change_percentage_24h: c.chg24h,
              price_change_percentage_7d_in_currency: c.chg7d,
              total_volume: c.volume24h,
              ath, atl: 0,
              ath_change_percentage: ath > 0 ? ((c.price - ath) / ath) * 100 : 0,
              circulating_supply: c.circulatingSupply,
            };
          });
          setCoins(raw.map(c => psySignal(c, taMap.get(c.symbol))));
          setLastUpdate(now());
          setError("");
          setLoading(false);
          return;
        }
      }
    } catch { /* fallthrough to CoinGecko */ }

    // ── 2. CoinGecko (segundo — sin key, rate limit ocasional) ───────────────
    try {
      const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=1h,24h,7d";
      const r = await fetch(url);
      if (!r.ok) throw new Error("CoinGecko limit");
      const raw: CoinRaw[] = await r.json();
      setCoins(raw.map(c => psySignal(c, taMap.get(c.symbol.toLowerCase()))));
      setLastUpdate(now());
      setError("⚠ CMC no disponible — usando CoinGecko.");
      setLoading(false);
      return;
    } catch { /* fallthrough to OKX */ }

    // ── 3. OKX proxy (tercer fallback — precio + 24h, sin key, sin rate limit) ─
    try {
      const or = await fetch("/api/market-data/crypto");
      if (or.ok) {
        const od = await or.json() as { assets: { sym: string; price: number; chg24h: number; vol24h: number }[] };
        if (od.assets?.length) {
          const raw: CoinRaw[] = od.assets.flatMap(({ sym, price, chg24h, vol24h }) => {
            const meta = OKX_META[sym];
            if (!meta) return [];
            const athChgPct = meta.ath > 0 ? ((price - meta.ath) / meta.ath) * 100 : 0;
            return [{ id: meta.id, symbol: sym.toLowerCase(), name: meta.name, image: meta.image,
              current_price: price, market_cap: price * meta.circ, market_cap_rank: meta.rank,
              price_change_percentage_1h_in_currency: 0, price_change_percentage_24h: chg24h,
              price_change_percentage_7d_in_currency: 0, total_volume: vol24h,
              ath: meta.ath, atl: 0, ath_change_percentage: athChgPct, circulating_supply: meta.circ,
            }];
          });
          raw.sort((a, b) => a.market_cap_rank - b.market_cap_rank);
          setCoins(raw.map(c => psySignal(c, taMap.get(c.symbol))));
          setLastUpdate(now());
          setError("⚠ CMC y CoinGecko no disponibles — precios en tiempo real vía OKX (1h/7d no disponibles).");
          setLoading(false);
          return;
        }
      }
    } catch { /* fallthrough */ }

    // ── 4. Todas las fuentes fallaron ────────────────────────────────────────
    setError("Datos temporalmente no disponibles. CMC, CoinGecko y OKX no respondieron. Intenta recargar.");
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    let list = [...coins];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
    }
    if (filter === "buy")    list = list.filter(c => c.signal === "BUY" || c.signal === "BUY FUERTE");
    if (filter === "sell")   list = list.filter(c => c.signal === "SELL" || c.signal === "SELL FUERTE");
    if (filter === "strong") list = list.filter(c => c.signal === "BUY FUERTE" || c.signal === "SELL FUERTE");

    list.sort((a, b) => {
      let diff = 0;
      if (sort === "rank")     diff = a.rank - b.rank;
      if (sort === "change24h")diff = a.change24h - b.change24h;
      if (sort === "psyScore") diff = a.psyScore - b.psyScore;
      if (sort === "signal")   diff = SIGNAL_ORDER.indexOf(a.signal) - SIGNAL_ORDER.indexOf(b.signal);
      return diff * sortDir;
    });
    return list;
  }, [coins, filter, sort, sortDir, search]);

  const buyCount  = coins.filter(c => c.signal.startsWith("BUY")).length;
  const sellCount = coins.filter(c => c.signal.startsWith("SELL")).length;
  const strongBuy = coins.filter(c => c.signal === "BUY FUERTE").length;
  const avgScore  = coins.length ? Math.round(coins.reduce((s,c) => s + c.psyScore, 0) / coins.length) : 50;
  const marketBias = avgScore >= 60 ? "ALCISTA" : avgScore <= 40 ? "BAJISTA" : "NEUTRAL";
  const biasColor  = avgScore >= 60 ? "#00e676" : avgScore <= 40 ? "#ff1744" : "#4a6070";

  const toggleSort = (s: typeof sort) => {
    if (sort === s) setSortDir(d => (d === 1 ? -1 : 1));
    else { setSort(s); setSortDir(-1); }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      {/* Header */}
      <section className="pt-32 pb-10 px-6 md:px-12">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4 flex items-center gap-3">
          Señales · Top 50 Cryptos <div className="h-px bg-[#1a2535] flex-1 max-w-[80px]" />
        </div>
        <h1 className="font-bebas text-5xl md:text-8xl leading-none mb-3">
          PSY<span className="text-[#00e5ff]">SCREENER</span>
        </h1>
        <p className="font-space text-[12px] text-[#7ab3c8] max-w-xl leading-relaxed">
          Las 50 cryptos por capitalización escaneadas con PSY-ULT1. Detecta cuáles están en zona de entrada o salida según los indicadores institucionales de PSYCHOMETRIKS.
        </p>
      </section>

      {/* Market overview */}
      <section className="px-6 md:px-12 pb-8 grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a2535] border border-[#1a2535] mb-8">
        {[
          { label: "Bias del mercado",    value: marketBias,         color: biasColor,  sub: `PSY promedio: ${avgScore}/100` },
          { label: "Señales de compra",   value: `${buyCount}`,      color: "#00e676",  sub: `${strongBuy} BUY FUERTE` },
          { label: "Señales de venta",    value: `${sellCount}`,     color: "#ff1744",  sub: `${coins.filter(c=>c.signal==="SELL FUERTE").length} SELL FUERTE` },
          { label: "Total escaneadas",    value: `${coins.length}`,  color: "white",    sub: lastUpdate ? `Act. ${lastUpdate}` : "cargando..." },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="bg-[#060a0f] p-6">
            <div className="font-space text-[10px] text-[#5a8898] tracking-[0.2em] uppercase mb-2">{label}</div>
            <div className="font-bebas text-3xl mb-1" style={{ color }}>{value}</div>
            <div className="font-space text-[10px] text-[#5a8898]">{sub}</div>
          </div>
        ))}
      </section>

      {/* Controls */}
      <section className="px-6 md:px-12 pb-6 flex items-center gap-3 flex-wrap">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar crypto..."
          className="bg-[#060a0f] border border-[#1a2535] text-white font-space text-[11px] px-4 py-2 focus:outline-none focus:border-[#00e5ff44] w-40"
        />
        <div className="flex gap-1">
          {([["all","TODOS"],["buy","🟢 COMPRA"],["sell","🔴 VENTA"],["strong","⚡ FUERTES"]] as const).map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className="font-space text-[10px] tracking-[0.1em] uppercase px-3 py-2 border transition-colors"
              style={filter === k ? { background:"#00e5ff", color:"#020408", borderColor:"#00e5ff" } : { background:"transparent", color:"#4a6070", borderColor:"#1a2535" }}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={fetchData} className="font-space text-[10px] tracking-[0.1em] uppercase px-3 py-2 border border-[#1a2535] text-[#7ab3c8] hover:border-[#00e5ff44] hover:text-[#00e5ff] transition-colors ml-auto">
          ↻ ACTUALIZAR
        </button>
      </section>

      {/* Table */}
      <section className="px-6 md:px-12 pb-20">
        {loading ? (
          <div className="border border-[#1a2535] p-20 text-center">
            <div className="font-bebas text-3xl text-[#1a2535] mb-2">ESCANEANDO MERCADO</div>
            <div className="font-space text-[11px] text-[#5a8898]">Aplicando PSY-ULT1 a las top 50 cryptos...</div>
            <div className="mt-6 flex justify-center gap-1">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-[#00e5ff] rounded-full animate-bounce" style={{ animationDelay:`${i*0.15}s` }} />)}
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 border border-[#ffd70033] bg-[#ffd70008] px-4 py-2 font-space text-[10px] text-[#ffd700]">
                ⚠ {error}
              </div>
            )}

            {/* Desktop table */}
            <div className="hidden md:block border border-[#1a2535]">
              <div className="grid font-space text-[9px] text-[#5a8898] tracking-[0.2em] uppercase border-b border-[#1a2535] px-4 py-2.5"
                style={{ gridTemplateColumns:"44px 1fr 100px 80px 80px 80px 110px 120px" }}>
                <button className="text-left hover:text-[#00e5ff] transition-colors" onClick={() => toggleSort("rank")}>#</button>
                <span>Crypto</span>
                <span className="text-right">Precio</span>
                <button className="text-right hover:text-[#00e5ff] transition-colors w-full" onClick={() => toggleSort("change24h")}>1H</button>
                <button className="text-right hover:text-[#00e5ff] transition-colors w-full" onClick={() => toggleSort("change24h")}>24H {sort==="change24h"?sortDir===1?"↑":"↓":""}</button>
                <span className="text-right">7D</span>
                <button className="text-right hover:text-[#00e5ff] transition-colors w-full" onClick={() => toggleSort("psyScore")}>PSY Score {sort==="psyScore"?sortDir===1?"↑":"↓":""}</button>
                <button className="text-right hover:text-[#00e5ff] transition-colors w-full" onClick={() => toggleSort("signal")}>Señal {sort==="signal"?sortDir===1?"↑":"↓":""}</button>
              </div>
              {filtered.map(coin => (
                <div key={coin.id}
                  className="grid items-center px-4 py-3 border-b border-[#0d1520] hover:bg-[#060a0f] cursor-pointer transition-colors"
                  style={{ gridTemplateColumns:"44px 1fr 100px 80px 80px 80px 110px 120px" }}
                  onClick={() => setDetail(coin)}>
                  <span className="font-space text-[11px] text-[#5a8898]">#{coin.rank}</span>
                  <div className="flex items-center gap-2 min-w-0">
                    {coin.image ? (
                      <img src={coin.image} alt={coin.symbol} className="w-6 h-6 rounded-full shrink-0" onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#1a2535] flex items-center justify-center font-bebas text-[9px] text-[#7ab3c8] shrink-0">
                        {coin.symbol.slice(0,2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-space text-[12px] text-white truncate">{coin.symbol}</div>
                      <div className="font-space text-[9px] text-[#5a8898] truncate hidden lg:block">{coin.name}</div>
                    </div>
                  </div>
                  <div className="text-right font-space text-[12px] text-white">{fmtPrice(coin.price)}</div>
                  <div className="text-right font-space text-[11px]" style={{ color: changeFmt(coin.change1h).color }}>{changeFmt(coin.change1h).text}</div>
                  <div className="text-right font-space text-[11px]" style={{ color: changeFmt(coin.change24h).color }}>{changeFmt(coin.change24h).text}</div>
                  <div className="text-right font-space text-[11px]" style={{ color: changeFmt(coin.change7d).color }}>{changeFmt(coin.change7d).text}</div>
                  {/* PSY Score bar */}
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-16 h-1.5 bg-[#1a2535] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width:`${coin.psyScore}%`, background: coin.psyScore >= 55 ? "#00e676" : coin.psyScore <= 45 ? "#ff1744" : "#4a6070" }} />
                    </div>
                    <span className="font-mono text-[11px] w-6 text-right" style={{ color: coin.signalColor }}>{coin.psyScore}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-space text-[9px] font-bold tracking-[0.05em] px-2 py-1"
                      style={{ background: coin.signalColor + "20", color: coin.signalColor, border:`1px solid ${coin.signalColor}40` }}>
                      {coin.signal}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-1">
              {filtered.map(coin => (
                <div key={coin.id} className="border border-[#1a2535] bg-[#060a0f] p-4 cursor-pointer" onClick={() => setDetail(coin)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bebas text-lg text-white">{coin.symbol}</span>
                      <span className="font-space text-[10px] text-[#5a8898]">#{coin.rank}</span>
                    </div>
                    <span className="font-space text-[9px] font-bold px-2 py-1"
                      style={{ background: coin.signalColor+"20", color: coin.signalColor, border:`1px solid ${coin.signalColor}40` }}>
                      {coin.signal}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-space text-[12px] text-white">{fmtPrice(coin.price)}</span>
                    <div className="flex gap-3">
                      <span className="font-space text-[10px]" style={{ color: changeFmt(coin.change24h).color }}>{changeFmt(coin.change24h).text}</span>
                      <span className="font-mono text-[11px] font-bold" style={{ color: coin.signalColor }}>PSY {coin.psyScore}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 font-space text-[10px] text-[#5a8898]">{filtered.length} cryptos · Tocá una fila para ver el desglose de señal</div>
          </>
        )}
      </section>

      {/* Signal detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-[#060a0f] border border-[#1a2535] w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#1a2535] flex items-center justify-between">
              <div>
                <div className="font-bebas text-2xl text-white">{detail.symbol} <span className="text-[#7ab3c8] text-lg">/ {detail.name}</span></div>
                <div className="font-space text-[10px] text-[#5a8898]">PSY-ULT1 Signal Breakdown</div>
              </div>
              <button onClick={() => setDetail(null)} className="text-[#7ab3c8] hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-5">
              {/* Main score */}
              <div className="text-center border border-[#1a2535] py-6" style={{ background: detail.signalColor + "08" }}>
                <div className="font-bebas text-7xl" style={{ color: detail.signalColor }}>{detail.psyScore}</div>
                <div className="font-space text-[10px] text-[#7ab3c8] mb-2">PSY-ULT1 SCORE</div>
                <span className="font-space text-[11px] font-bold px-4 py-1.5" style={{ background: detail.signalColor+"20", color: detail.signalColor, border:`1px solid ${detail.signalColor}50` }}>
                  {detail.signal}
                </span>
              </div>

              {/* Price data */}
              <div className="grid grid-cols-3 gap-px bg-[#1a2535]">
                {[
                  { label:"Precio",  display: fmtPrice(detail.price),                color:"white" },
                  { label:"24h",     display: changeFmt(detail.change24h).text,       color: changeFmt(detail.change24h).color },
                  { label:"7 días",  display: changeFmt(detail.change7d).text,        color: changeFmt(detail.change7d).color },
                ].map((s,i) => (
                  <div key={i} className="bg-[#060a0f] p-3 text-center">
                    <div className="font-space text-[9px] text-[#5a8898] mb-1">{s.label}</div>
                    <div className="font-space text-[13px] font-bold" style={{ color: s.color }}>{s.display}</div>
                  </div>
                ))}
              </div>

              {/* Components */}
              <div>
                <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.3em] uppercase mb-3">Desglose PSY-ULT1</div>
                <div className="space-y-2">
                  {detail.components.map(comp => (
                    <div key={comp.label}>
                      <div className="flex justify-between mb-1">
                        <span className="font-space text-[10px] text-[#7ab3c8]">{comp.label}</span>
                        <span className="font-space text-[10px]" style={{ color: comp.color }}>{comp.value}/50</span>
                      </div>
                      <div className="h-1 bg-[#1a2535] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width:`${(comp.value/50)*100}%`, background: comp.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ATH info */}
              <div className="flex justify-between font-space text-[11px]">
                <span className="text-[#7ab3c8]">Distancia desde ATH:</span>
                <span style={{ color: detail.athPct > -10 ? "#ff6d00" : detail.athPct > -50 ? "#ffd700" : "#00e5ff" }}>
                  {detail.athPct.toFixed(1)}%
                </span>
              </div>

              <button onClick={() => setDetail(null)}
                className="w-full py-3 font-space text-[11px] tracking-[0.1em] uppercase border border-[#1a2535] text-[#7ab3c8] hover:border-[#00e5ff44] hover:text-[#00e5ff] transition-colors">
                CERRAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PsyScreener() {
  const auth = getAuth();
  if (!auth) { window.location.replace("/login?redirect=/screener"); return null; }
  const plan = (auth.plan ?? "").toLowerCase();
  const ok = ["aprendiz","trader","institucional"].includes(plan) || auth.role === "superadmin" || auth.role === "operator" || auth.role === "member";
  if (!ok) return <ScreenerGate />;
  return <PsyScreenerContent />;
}
