import React, { useState, useEffect, useRef } from "react";
import SiteNav from "@/components/site-nav";
import { Link } from "wouter";

const TELEGRAM = "https://t.me/psychometriks_pro";

type PsyPlan = "basico" | "educacion" | "pro" | "elite" | null;
interface AuthSession { user: string; role: string; plan?: PsyPlan; token: string; ts: number; }

function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem("psyko_auth");
    if (!raw) return null;
    const s = JSON.parse(raw) as AuthSession;
    if (Date.now() - s.ts > 8 * 60 * 60 * 1000) { localStorage.removeItem("psyko_auth"); return null; }
    return s;
  } catch { return null; }
}

function isElite(s: AuthSession | null) {
  if (!s) return false;
  return s.role === "superadmin" || s.role === "operator" || s.plan === "elite";
}

const TOP50_ALTCOINS = [
  { symbol: "SOLUSDT",   label: "SOL/USDT",   icon: "◎",  color: "#9945ff", name: "Solana" },
  { symbol: "BNBUSDT",   label: "BNB/USDT",   icon: "⬡",  color: "#f3ba2f", name: "BNB" },
  { symbol: "XRPUSDT",   label: "XRP/USDT",   icon: "✕",  color: "#00aae4", name: "Ripple" },
  { symbol: "ADAUSDT",   label: "ADA/USDT",   icon: "₳",  color: "#0033ad", name: "Cardano" },
  { symbol: "DOGEUSDT",  label: "DOGE/USDT",  icon: "Ð",  color: "#c2a633", name: "Dogecoin" },
  { symbol: "AVAXUSDT",  label: "AVAX/USDT",  icon: "△",  color: "#e84142", name: "Avalanche" },
  { symbol: "DOTUSDT",   label: "DOT/USDT",   icon: "⬤",  color: "#e6007a", name: "Polkadot" },
  { symbol: "MATICUSDT", label: "MATIC/USDT", icon: "⬡",  color: "#8247e5", name: "Polygon" },
  { symbol: "LINKUSDT",  label: "LINK/USDT",  icon: "🔗", color: "#375bd2", name: "Chainlink" },
  { symbol: "SHIBUSDT",  label: "SHIB/USDT",  icon: "🐕", color: "#ff9800", name: "Shiba Inu" },
  { symbol: "LTCUSDT",   label: "LTC/USDT",   icon: "Ł",  color: "#bfbbbb", name: "Litecoin" },
  { symbol: "UNIUSDT",   label: "UNI/USDT",   icon: "🦄", color: "#ff007a", name: "Uniswap" },
  { symbol: "ATOMUSDT",  label: "ATOM/USDT",  icon: "⚛",  color: "#2e3148", name: "Cosmos" },
  { symbol: "XLMUSDT",   label: "XLM/USDT",   icon: "✦",  color: "#7d00ff", name: "Stellar" },
  { symbol: "NEARUSDT",  label: "NEAR/USDT",  icon: "Ⓝ",  color: "#00c08b", name: "NEAR" },
  { symbol: "ALGOUSDT",  label: "ALGO/USDT",  icon: "◈",  color: "#00b4d8", name: "Algorand" },
  { symbol: "FILUSDT",   label: "FIL/USDT",   icon: "⍟",  color: "#0090ff", name: "Filecoin" },
  { symbol: "APTUSDT",   label: "APT/USDT",   icon: "◆",  color: "#00b4ff", name: "Aptos" },
  { symbol: "ARBUSDT",   label: "ARB/USDT",   icon: "🔷", color: "#12aaff", name: "Arbitrum" },
  { symbol: "OPUSDT",    label: "OP/USDT",    icon: "🔴", color: "#ff0420", name: "Optimism" },
  { symbol: "SUIUSDT",   label: "SUI/USDT",   icon: "💧", color: "#6fbcf0", name: "Sui" },
  { symbol: "INJUSDT",   label: "INJ/USDT",   icon: "💉", color: "#00f2fe", name: "Injective" },
  { symbol: "TIAUSDT",   label: "TIA/USDT",   icon: "🌐", color: "#7c3aed", name: "Celestia" },
  { symbol: "SEIUSDT",   label: "SEI/USDT",   icon: "⚡", color: "#ff4d00", name: "Sei" },
  { symbol: "RNDRUSDT",  label: "RNDR/USDT",  icon: "🖥",  color: "#ff4500", name: "Render" },
  { symbol: "FTMUSDT",   label: "FTM/USDT",   icon: "🔵", color: "#13b5ec", name: "Fantom" },
  { symbol: "SANDUSDT",  label: "SAND/USDT",  icon: "🏖",  color: "#00adef", name: "Sandbox" },
  { symbol: "MANAUSDT",  label: "MANA/USDT",  icon: "🌐", color: "#ff2d55", name: "Decentraland" },
  { symbol: "AXSUSDT",   label: "AXS/USDT",   icon: "🐾", color: "#0055d4", name: "Axie Infinity" },
  { symbol: "AAVEUSDT",  label: "AAVE/USDT",  icon: "👻", color: "#b6509e", name: "Aave" },
  { symbol: "MKRUSDT",   label: "MKR/USDT",   icon: "🏛",  color: "#1aab9b", name: "Maker" },
  { symbol: "CRVUSDT",   label: "CRV/USDT",   icon: "〰",  color: "#0fa", name: "Curve" },
  { symbol: "LDOUSDT",   label: "LDO/USDT",   icon: "⚗",  color: "#00a3ff", name: "Lido" },
  { symbol: "GRTUSDT",   label: "GRT/USDT",   icon: "📊", color: "#6f4cff", name: "The Graph" },
  { symbol: "IMXUSDT",   label: "IMX/USDT",   icon: "🔷", color: "#00d4ff", name: "Immutable X" },
  { symbol: "FLOKIUSDT", label: "FLOKI/USDT", icon: "🐶", color: "#ff8c00", name: "Floki" },
  { symbol: "PEPEUSDT",  label: "PEPE/USDT",  icon: "🐸", color: "#00c853", name: "Pepe" },
  { symbol: "WIFUSDT",   label: "WIF/USDT",   icon: "🎩", color: "#c8a96e", name: "dogwifhat" },
  { symbol: "BONKUSDT",  label: "BONK/USDT",  icon: "🦴", color: "#f7931a", name: "Bonk" },
  { symbol: "FETUSDT",   label: "FET/USDT",   icon: "🤖", color: "#1f6eff", name: "Fetch.AI" },
  { symbol: "WLDUSDT",   label: "WLD/USDT",   icon: "🌍", color: "#00bcd4", name: "Worldcoin" },
  { symbol: "JUPUSDT",   label: "JUP/USDT",   icon: "🪐", color: "#c27aff", name: "Jupiter" },
  { symbol: "PENGUUSDT", label: "PENGU/USDT", icon: "🐧", color: "#00cfff", name: "Pengu" },
  { symbol: "TRUMPUSDT", label: "TRUMP/USDT", icon: "🇺🇸", color: "#ff1a1a", name: "Trump" },
  { symbol: "MOVEUSDT",  label: "MOVE/USDT",  icon: "⚙",  color: "#a855f7", name: "Movement" },
  { symbol: "HYPUSDT",   label: "HYP/USDT",   icon: "⚡", color: "#00ff88", name: "Hyperliquid" },
  { symbol: "XAIUSDT",   label: "XAI/USDT",   icon: "🤖", color: "#ff4455", name: "Xai" },
  { symbol: "PIXELUSDT", label: "PIXEL/USDT", icon: "🎮", color: "#7fffd4", name: "Pixels" },
  { symbol: "EIGENUSDT", label: "EIGEN/USDT", icon: "🔑", color: "#6366f1", name: "Eigenlayer" },
  { symbol: "ZENUSDT",   label: "ZEN/USDT",   icon: "☯",  color: "#3a5f8a", name: "Zen" },
];

interface AltcoinData {
  symbol: string;
  price: number;
  change: number;
  high: number;
  low: number;
  volume: number;
}

// ── Real signal type (matches PSY-ULT2 /api/altcoin-signals response) ─────────
interface WhaleSignal {
  symbol: string; name: string; icon: string; color: string;
  direction: "LONG" | "SHORT";
  strength: "FUERTE" | "MODERADO" | "DÉBIL";
  strengthColor: string;
  // Price levels
  entry: string; tp1: string; tp2: string; tp3: string; sl: string; rr: string;
  // Momentum
  rsi1h: number; rsi4h: number;
  rsiDiv: "BULLISH_DIV" | "BEARISH_DIV" | "NONE";
  stochK: number; stochD: number;
  macdHistogram: number; macdCross: boolean; macdDir: "BULLISH" | "BEARISH" | "NEUTRAL";
  volumeSpike: number;
  cvdTrend: "BULLISH" | "BEARISH";
  htfBias: "BULLISH" | "BEARISH" | "NEUTRAL";
  struct4h: "BULLISH" | "BEARISH" | "NEUTRAL";
  // SMC
  fvg: "BULLISH" | "BEARISH" | null;
  sweep: "BULLISH" | "BEARISH" | null;
  orderBlock: "BULLISH" | "BEARISH" | null;
  bos: "BULLISH" | "BEARISH" | null;
  zone: "PREMIUM" | "DISCOUNT" | "EQUILIBRIUM";
  nearSR: "SUPPORT" | "RESISTANCE" | null;
  // Fibonacci
  swingHigh: string; swingLow: string;
  fib382: string; fib500: string; fib618: string; fib786: string;
  fib1272: string; fib1618: string;
  // Market data
  fundingRate: number;
  oiChange24h: number;
  // Meta
  indicators: string[];
  score: number;
  change1h: number;
}

function PriceRow({ coin }: { coin: typeof TOP50_ALTCOINS[0] }) {
  const [data, setData] = useState<{ price: number; change: number } | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${coin.symbol.toLowerCase()}@miniTicker`);
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      const price = parseFloat(d.c);
      const open = parseFloat(d.o);
      const change = open > 0 ? ((price - open) / open) * 100 : 0;
      setData({ price, change });
    };
    return () => ws.close();
  }, [coin.symbol]);

  const p = data?.price ?? 0;
  const c = data?.change ?? 0;
  const isPos = c >= 0;

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#0d1520] last:border-0 hover:bg-[#060a0f] transition-colors">
      <div className="flex items-center gap-3 w-36 shrink-0">
        <span style={{ color: coin.color, fontSize: 16 }}>{coin.icon}</span>
        <div>
          <div className="font-space text-[11px] text-white">{coin.name}</div>
          <div className="font-space text-[9px] text-[#7ab3c8]">{coin.symbol.replace("USDT", "")}</div>
        </div>
      </div>
      <div className="font-space text-[12px] text-white text-right">
        {p > 0 ? `$${p.toFixed(p < 0.01 ? 6 : p < 1 ? 4 : p < 10 ? 3 : p < 1000 ? 2 : 0)}` : "—"}
      </div>
      <div className={`font-space text-[11px] font-bold w-16 text-right ${isPos ? "text-[#00e676]" : "text-[#ff1744]"}`}>
        {p > 0 ? `${isPos ? "+" : ""}${c.toFixed(2)}%` : "—"}
      </div>
    </div>
  );
}

function TradingViewMiniChart({ symbol }: { symbol: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const s = document.createElement("script");
    s.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    s.async = true;
    s.innerHTML = JSON.stringify({
      symbol: `BINANCE:${symbol}`,
      width: "100%",
      height: 120,
      locale: "es",
      dateRange: "1D",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
      noTimeScale: false,
    });
    ref.current.appendChild(s);
    return () => { if (ref.current) ref.current.innerHTML = ""; };
  }, [symbol]);
  return <div ref={ref} />;
}

export default function AltcoinsSignals() {
  const [session] = useState(getSession);
  const [prices, setPrices] = useState<Record<string, AltcoinData>>({});
  const [signals, setSignals] = useState<WhaleSignal[]>([]);
  const [sigLoading, setSigLoading] = useState(true);
  const [sigError, setSigError] = useState("");
  const [cachedAt, setCachedAt] = useState<string>("");
  const [filter, setFilter] = useState<"ALL" | "LONG" | "SHORT">("ALL");
  const [tab, setTab] = useState<"signals" | "scanner" | "oiradar">("signals");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const ws1Ref = useRef<WebSocket | null>(null);

  // ── OI Radar (real, multi-exchange) — solo carga mientras ese tab esté abierto ──
  interface OiRow { symbol: string; oiUsd: number | null; longsPct: number | null; shortsPct: number | null; source: string }
  const [oiData, setOiData] = useState<Record<string, OiRow>>({});
  const [oiLoading, setOiLoading] = useState(true);
  useEffect(() => {
    if (tab !== "oiradar") return;
    let cancelled = false;
    const symbols = TOP50_ALTCOINS.slice(0, 18).map(c => c.symbol).join(",");
    const load = async () => {
      try {
        const r = await fetch(`/api/oi-radar/live?symbols=${symbols}`);
        const d = await r.json() as { ok: boolean; data?: OiRow[] };
        if (!cancelled && d.ok && d.data) {
          const map: Record<string, OiRow> = {};
          for (const row of d.data) map[row.symbol] = row;
          setOiData(map);
        }
      } catch { /* deja los datos anteriores */ }
      finally { if (!cancelled) setOiLoading(false); }
    };
    load();
    const id = setInterval(load, 90_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [tab]);

  // ── Live prices for Scanner tab (Binance WebSocket) ───────────────────────
  useEffect(() => {
    const streams = TOP50_ALTCOINS.slice(0, 25).map(c => `${c.symbol.toLowerCase()}@miniTicker`).join("/");
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      const d = msg.data;
      if (!d) return;
      const price = parseFloat(d.c);
      const open  = parseFloat(d.o);
      const change = open > 0 ? ((price - open) / open) * 100 : 0;
      setPrices(prev => ({
        ...prev,
        [d.s]: { symbol: d.s, price, change, high: parseFloat(d.h), low: parseFloat(d.l), volume: parseFloat(d.q) },
      }));
      setLastUpdate(new Date());
    };
    ws1Ref.current = ws;
    return () => ws.close();
  }, []);

  // ── Real signals from backend (RSI + MACD + Volume) ───────────────────────
  async function fetchSignals() {
    setSigLoading(true);
    setSigError("");
    try {
      const r = await fetch("/api/proxy/signals/altcoins");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json() as { signals: WhaleSignal[]; cachedAt: string };
      setSignals(data.signals);
      setCachedAt(data.cachedAt);
    } catch (err) {
      setSigError("Error al cargar señales: " + String(err));
    } finally {
      setSigLoading(false);
    }
  }

  useEffect(() => { void fetchSignals(); }, []);

  // Auto-refresh every 5 minutes (matches backend cache TTL)
  useEffect(() => {
    const t = setInterval(() => { void fetchSignals(); }, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  if (!session || !isElite(session)) {
    return (
      <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
        <SiteNav />
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="mb-6 text-5xl">🪙</div>
          <div className="font-space text-[9px] text-[#ffd700] tracking-[0.3em] uppercase mb-3">ACCESO RESTRINGIDO</div>
          <h1 className="font-bebas text-5xl text-white mb-4">SEÑALES ALTCOINS<br /><span className="text-[#ffd700]">PLAN ELITE</span></h1>
          <p className="font-space text-sm text-[#7ab3c8] max-w-md mb-8 leading-relaxed">
            El panel de señales para top 50 altcoins con Open Interest multi-exchange es exclusivo del plan Elite.
            Acceso en tiempo real con análisis de whale flow y funding.
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link href="/pricing"
              className="font-space text-xs font-bold tracking-[0.15em] uppercase px-8 py-4 no-underline transition-all hover:-translate-y-0.5"
              style={{ background: "#ffd700", color: "#020408" }}>
              UPGRADE A ELITE — $99/mes
            </Link>
            <a href={TELEGRAM} target="_blank" rel="noopener noreferrer"
              className="font-space text-xs tracking-[0.15em] uppercase px-8 py-4 border border-[#1a2535] text-[#7ab3c8] hover:border-[#00e5ff] hover:text-[#00e5ff] transition-all">
              Contactar por Telegram
            </a>
          </div>
        </div>
      </div>
    );
  }

  const filteredSignals = signals.filter(s => filter === "ALL" || s.direction === filter);

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      {/* Header */}
      <div className="pt-20 pb-0 px-6 md:px-10 border-b border-[#0d1520]">
        <div className="flex items-center justify-between py-6 flex-wrap gap-4">
          <div>
            <div className="font-space text-[9px] text-[#ffd700] tracking-[0.3em] uppercase mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#00e676] rounded-full animate-pulse" /> LIVE · ELITE ONLY
            </div>
            <h1 className="font-bebas text-4xl md:text-5xl">
              SEÑALES <span className="text-[#ffd700]">ALTCOINS</span>
              <span className="font-space text-sm text-[#7ab3c8] ml-3 tracking-[0.1em]">TOP 50</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#00e5ff] rounded-full animate-pulse" />
                <span className="font-sharetech text-[8px] text-[#00e5ff] tracking-[0.2em]">ANÁLISIS TÉCNICO REAL</span>
              </div>
              <div className="font-sharetech text-[8px] text-[#5a8898]">RSI · MACD · EMA20 · Volumen</div>
              {cachedAt && (
                <div className="font-sharetech text-[8px] text-[#5a8898]">
                  calc: {new Date(cachedAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
            <a href={TELEGRAM} target="_blank" rel="noopener noreferrer"
              className="font-space text-[10px] font-bold tracking-[0.1em] uppercase px-5 py-2.5 transition-all no-underline flex items-center gap-2"
              style={{ background: "linear-gradient(135deg,#2CA5E0,#229ED9)", color: "white" }}>
              ✈️ CANAL TELEGRAM
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0">
          {[
            { key: "signals", label: "🔔 Señales Activas" },
            { key: "scanner", label: "📡 Scanner Precios" },
            { key: "oiradar", label: "🌐 OI RADAR — MULTI-EXCHANGE" },
          ].map(t => (
            <button key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`font-space text-[10px] tracking-[0.1em] uppercase px-6 py-3 border-b-2 transition-all ${tab === t.key ? "text-[#ffd700] border-[#ffd700]" : "text-[#7ab3c8] border-transparent hover:text-white"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 md:px-10 py-6">

        {/* === SEÑALES TAB === */}
        {tab === "signals" && (
          <div>
            {/* Filter */}
            <div className="flex gap-2 mb-6">
              {(["ALL", "LONG", "SHORT"] as const).map(f => (
                <button key={f}
                  onClick={() => setFilter(f)}
                  className={`font-space text-[10px] font-bold tracking-[0.15em] uppercase px-5 py-2 transition-all ${filter === f
                    ? f === "LONG" ? "bg-[#00e676] text-[#020408]" : f === "SHORT" ? "bg-[#ff1744] text-white" : "bg-[#ffd700] text-[#020408]"
                    : "border border-[#1a2535] text-[#7ab3c8] hover:border-[#2a3a50]"
                  }`}>
                  {f === "ALL" ? "TODOS" : f}
                </button>
              ))}
              <div className="ml-auto font-space text-[10px] text-[#7ab3c8] flex items-center">
                {filteredSignals.length} señales activas
              </div>
            </div>

            {sigLoading ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-4 animate-pulse">📡</div>
                <div className="font-bebas text-2xl text-white mb-2">CALCULANDO SEÑALES</div>
                <div className="font-space text-sm text-[#7ab3c8]">
                  Descargando 60 velas · calculando RSI, MACD y volumen para {" "}
                  <span className="text-[#00e5ff]">20 altcoins</span>...
                </div>
              </div>
            ) : sigError ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-4">⚠️</div>
                <div className="font-space text-sm text-[#ff6d00] mb-4">{sigError}</div>
                <button onClick={() => void fetchSignals()}
                  className="font-space text-[10px] font-bold tracking-[0.1em] uppercase px-6 py-3 border border-[#00e5ff44] text-[#00e5ff] hover:bg-[#00e5ff15] transition-all">
                  ↻ REINTENTAR
                </button>
              </div>
            ) : filteredSignals.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-4">🔍</div>
                <div className="font-space text-sm text-[#7ab3c8]">
                  Sin señales con suficiente confirmación técnica ahora.<br />
                  El algoritmo solo genera señales cuando RSI + MACD + Volumen alinean.
                </div>
                <button onClick={() => void fetchSignals()}
                  className="mt-4 font-space text-[10px] font-bold tracking-[0.1em] uppercase px-6 py-3 border border-[#ffd70044] text-[#ffd700] hover:bg-[#ffd70015] transition-all">
                  ↻ RECALCULAR
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredSignals.map(sig => (
                  <div key={sig.symbol} className="relative overflow-hidden border bg-[#030a14] hover:-translate-y-0.5 transition-all duration-300"
                    style={{
                      borderColor: sig.direction === "LONG" ? "#00e67640" : "#ff174440",
                      boxShadow: sig.direction === "LONG" ? "inset 0 0 40px #00e67606" : "inset 0 0 40px #ff174406",
                    }}>
                    <div className="absolute top-0 left-0 w-full h-[3px]"
                      style={{background: sig.direction === "LONG"
                        ? "linear-gradient(90deg,#007a30,#00e676 60%,transparent)"
                        : "linear-gradient(90deg,#880020,#ff1744 60%,transparent)"}} />

                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 flex items-center justify-center flex-shrink-0 border"
                            style={{color:sig.color, fontSize:26, borderColor:`${sig.color}30`, background:`${sig.color}10`}}>
                            {sig.icon}
                          </div>
                          <div>
                            <div className="font-bebas text-2xl text-white leading-none tracking-wider">{sig.name}</div>
                            <div className="font-space text-[9px] text-[#7ab3c8]">
                              {sig.symbol.replace("USDT", "/USDT")}
                              {sig.change1h !== 0 && (
                                <span className={`ml-2 font-bold ${sig.change1h > 0 ? "text-[#00e676]" : "text-[#ff1744]"}`}>
                                  {sig.change1h > 0 ? "+" : ""}{sig.change1h}% 1h
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="font-bebas text-2xl px-4 py-1 tracking-[0.08em] leading-none text-black"
                            style={{
                              background: sig.direction === "LONG" ? "#00e676" : "#ff1744",
                              boxShadow: sig.direction === "LONG" ? "0 0 18px #00e67660" : "0 0 18px #ff174460",
                            }}>
                            {sig.direction === "LONG" ? "▲ LONG" : "▼ SHORT"}
                          </span>
                          <span className="font-space text-[9px] font-bold px-2.5 py-1 tracking-[0.08em]"
                            style={{background:`${sig.strengthColor}18`, border:`1px solid ${sig.strengthColor}45`, color:sig.strengthColor}}>
                            {sig.strength}
                          </span>
                        </div>
                      </div>

                      {/* ── Price levels (5 cols) ─────────────────────────── */}
                      <div className="grid grid-cols-5 gap-1.5 mb-2.5">
                        {[
                          { label: "ENTRADA", value: sig.entry, color: "#e0e8f0",  bg: "#0d1520" },
                          { label: "TP1",     value: sig.tp1,   color: "#00e676",  bg: "#00150a" },
                          { label: "TP2",     value: sig.tp2,   color: "#00ff88",  bg: "#00150a" },
                          { label: "TP3",     value: sig.tp3,   color: "#69ffb0",  bg: "#001a0a" },
                          { label: "STOP",    value: sig.sl,    color: "#ff1744",  bg: "#1a0005" },
                        ].map(item => (
                          <div key={item.label} className="text-center border py-1.5"
                            style={{background:item.bg, borderColor:`${item.color}22`}}>
                            <div className="font-sharetech text-[6px] text-[#5a8898] tracking-[0.08em] mb-0.5">{item.label}</div>
                            <div className="font-space text-[9px] font-bold" style={{ color: item.color }}>{item.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* ── Fibonacci levels ──────────────────────────────── */}
                      <div className="mb-2.5 p-2 bg-[#030b16] border border-[#0a1525]">
                        <div className="font-sharetech text-[6px] text-[#3a6070] tracking-[0.15em] mb-1.5">FIBONACCI — S.H: {sig.swingHigh} · S.L: {sig.swingLow}</div>
                        <div className="grid grid-cols-6 gap-1">
                          {([
                            { k: "0.382", v: sig.fib382,  c: "#00bcd4" },
                            { k: "0.500", v: sig.fib500,  c: "#00acc1" },
                            { k: "0.618", v: sig.fib618,  c: "#ffd700" },
                            { k: "0.786", v: sig.fib786,  c: "#ff9800" },
                            { k: "1.272", v: sig.fib1272, c: "#00e676" },
                            { k: "1.618", v: sig.fib1618, c: "#69ffb0" },
                          ] as const).map(f => (
                            <div key={f.k} className="text-center">
                              <div className="font-sharetech text-[5.5px] mb-0.5" style={{color:`${f.c}80`}}>{f.k}</div>
                              <div className="font-space text-[7.5px] font-bold" style={{color:f.c}}>{f.v}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── Momentum indicators (8 cols) ──────────────────── */}
                      <div className="grid grid-cols-4 gap-1 mb-2 p-2 bg-[#040d18] border border-[#0d1a2a]">
                        {([
                          { label:"RSI 1H",    value:String(sig.rsi1h),  color:sig.rsi1h<35?"#00e676":sig.rsi1h>65?"#ff1744":"#ffd700" },
                          { label:"RSI 4H",    value:String(sig.rsi4h),  color:sig.rsi4h<40?"#00e676":sig.rsi4h>60?"#ff1744":"#7ab3c8" },
                          { label:"STOCH K",   value:`${sig.stochK}`, color:sig.stochK<25?"#00e676":sig.stochK>75?"#ff1744":"#ffd700" },
                          { label:"MACD",      value:sig.macdCross?"CRUCE":sig.macdHistogram>0?"▲ POS":"▼ NEG", color:sig.macdDir==="BULLISH"?"#00e676":sig.macdDir==="BEARISH"?"#ff1744":"#ffd700" },
                          { label:"VOL ×",     value:`${sig.volumeSpike}`, color:sig.volumeSpike>2.5?"#00e5ff":sig.volumeSpike>1.5?"#ffd700":"#7ab3c8" },
                          { label:"4H BIAS",   value:sig.htfBias==="BULLISH"?"▲BULL":sig.htfBias==="BEARISH"?"▼BEAR":"— NEU", color:sig.htfBias==="BULLISH"?"#00e676":sig.htfBias==="BEARISH"?"#ff1744":"#7ab3c8" },
                          { label:"CVD",       value:sig.cvdTrend==="BULLISH"?"▲ POS":"▼ NEG", color:sig.cvdTrend==="BULLISH"?"#00e676":"#ff1744" },
                          { label:"ZONA",      value:sig.zone==="DISCOUNT"?"DISC.":sig.zone==="PREMIUM"?"PREM.":"EQ.", color:sig.zone==="DISCOUNT"?"#00e676":sig.zone==="PREMIUM"?"#ff1744":"#7ab3c8" },
                        ] as const).map(ind => (
                          <div key={ind.label} className="text-center">
                            <div className="font-sharetech text-[5.5px] text-[#5a8898] tracking-[0.1em] mb-0.5">{ind.label}</div>
                            <div className="font-space text-[9px] font-bold" style={{color:ind.color}}>{ind.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* ── SMC badges row ────────────────────────────────── */}
                      <div className="flex flex-wrap gap-1 mb-2.5">
                        {sig.fvg && (
                          <span className="font-sharetech text-[6.5px] px-1.5 py-0.5 rounded-sm"
                            style={{background:sig.fvg==="BULLISH"?"#00e67618":"#ff174418", border:`1px solid ${sig.fvg==="BULLISH"?"#00e67640":"#ff174440"}`, color:sig.fvg==="BULLISH"?"#00e676":"#ff1744"}}>
                            FVG {sig.fvg==="BULLISH"?"▲":"▼"}
                          </span>
                        )}
                        {sig.sweep && (
                          <span className="font-sharetech text-[6.5px] px-1.5 py-0.5 rounded-sm"
                            style={{background:sig.sweep==="BULLISH"?"#00e5ff14":"#ff980014", border:`1px solid ${sig.sweep==="BULLISH"?"#00e5ff40":"#ff980040"}`, color:sig.sweep==="BULLISH"?"#00e5ff":"#ff9800"}}>
                            SWEEP {sig.sweep==="BULLISH"?"▲":"▼"}
                          </span>
                        )}
                        {sig.orderBlock && (
                          <span className="font-sharetech text-[6.5px] px-1.5 py-0.5 rounded-sm"
                            style={{background:"#7c3aed14", border:"1px solid #7c3aed40", color:"#a78bfa"}}>
                            OB {sig.orderBlock==="BULLISH"?"▲":"▼"}
                          </span>
                        )}
                        {sig.bos && (
                          <span className="font-sharetech text-[6.5px] px-1.5 py-0.5 rounded-sm"
                            style={{background:sig.bos==="BULLISH"?"#00e67614":"#ff174414", border:`1px solid ${sig.bos==="BULLISH"?"#00e67630":"#ff174430"}`, color:sig.bos==="BULLISH"?"#69ffb0":"#ff6b7a"}}>
                            BOS/CHoCH {sig.bos==="BULLISH"?"▲":"▼"}
                          </span>
                        )}
                        {sig.nearSR && (
                          <span className="font-sharetech text-[6.5px] px-1.5 py-0.5 rounded-sm"
                            style={{background:"#ffd70014", border:"1px solid #ffd70040", color:"#ffd700"}}>
                            {sig.nearSR==="SUPPORT"?"SOPORTE ▲":"RESISTENCIA ▼"}
                          </span>
                        )}
                        {sig.rsiDiv !== "NONE" && (
                          <span className="font-sharetech text-[6.5px] px-1.5 py-0.5 rounded-sm"
                            style={{background:sig.rsiDiv==="BULLISH_DIV"?"#00e67614":"#ff174414", border:`1px solid ${sig.rsiDiv==="BULLISH_DIV"?"#00e67640":"#ff174440"}`, color:sig.rsiDiv==="BULLISH_DIV"?"#00e676":"#ff1744"}}>
                            RSI DIV {sig.rsiDiv==="BULLISH_DIV"?"▲":"▼"}
                          </span>
                        )}
                        {sig.fundingRate !== 0 && (
                          <span className="font-sharetech text-[6.5px] px-1.5 py-0.5 rounded-sm"
                            style={{background:"#00e5ff0a", border:"1px solid #00e5ff30", color:"#00e5ff"}}>
                            FUND {sig.fundingRate > 0 ? "+" : ""}{sig.fundingRate.toFixed(4)}%
                          </span>
                        )}
                        {Math.abs(sig.oiChange24h) > 3 && (
                          <span className="font-sharetech text-[6.5px] px-1.5 py-0.5 rounded-sm"
                            style={{background:"#7ab3c814", border:"1px solid #7ab3c830", color:"#7ab3c8"}}>
                            OI {sig.oiChange24h > 0 ? "▲" : "▼"}{Math.abs(sig.oiChange24h).toFixed(1)}%
                          </span>
                        )}
                      </div>

                      {/* ── Top indicators ────────────────────────────────── */}
                      <div className="flex flex-wrap gap-1 mb-2.5">
                        {sig.indicators.slice(0, 3).map((ind, i) => (
                          <span key={i} className="font-sharetech text-[6.5px] px-2 py-0.5"
                            style={{ background: "#0a1520", border: "1px solid #1a2535", color: "#7ab3c8" }}>
                            {ind}
                          </span>
                        ))}
                      </div>

                      {/* ── Footer: R/R + score /10 ───────────────────────── */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#0d1a2a]">
                        <div className="flex items-center gap-2">
                          <span className="font-bebas text-base text-white tracking-wider leading-none">R/R</span>
                          <span className="font-space text-[11px] font-bold text-[#ffd700]">{sig.rr}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({length:10},(_,i)=>(
                            <div key={i} className="w-[6px] h-[6px] rounded-sm"
                              style={{background: i < sig.score ? sig.direction==="LONG"?"#00e676":"#ff1744" : "#0d1520"}}/>
                          ))}
                          <span className="font-sharetech text-[8px] text-[#7ab3c8] ml-1">{sig.score}/10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === SCANNER TAB === */}
        {tab === "scanner" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Price list */}
            <div className="xl:col-span-1 bg-[#060a0f] border border-[#1a2535] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1a2535] flex items-center justify-between">
                <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.2em] uppercase">Precios Live · Top 50</div>
                <div className="w-1.5 h-1.5 bg-[#00e676] rounded-full animate-pulse" />
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {TOP50_ALTCOINS.slice(0, 30).map(coin => (
                  <PriceRow key={coin.symbol} coin={coin} />
                ))}
              </div>
            </div>

            {/* Charts */}
            <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TOP50_ALTCOINS.slice(0, 8).map(coin => (
                <div key={coin.symbol} className="bg-[#060a0f] border border-[#1a2535] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ color: coin.color }}>{coin.icon}</span>
                    <span className="font-space text-[10px] text-white">{coin.name}</span>
                    {prices[coin.symbol] && (
                      <span className={`ml-auto font-space text-[9px] font-bold ${prices[coin.symbol].change >= 0 ? "text-[#00e676]" : "text-[#ff1744]"}`}>
                        {prices[coin.symbol].change >= 0 ? "+" : ""}{prices[coin.symbol].change.toFixed(2)}%
                      </span>
                    )}
                  </div>
                  <TradingViewMiniChart symbol={coin.symbol} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === OI RADAR TAB (datos reales multi-exchange) === */}
        {tab === "oiradar" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full ${oiLoading ? "bg-[#ffd700] animate-pulse" : "bg-[#00e676] animate-pulse"}`} />
              <div className="font-space text-[10px] text-[#7ab3c8] tracking-widest">
                Open Interest y sesgo Long/Short reales — Binance → Bybit → Hyperliquid (lo que responda primero). Actualización cada 90 segundos.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
              {TOP50_ALTCOINS.slice(0, 18).map((coin) => {
                const row = oiData[coin.symbol];
                const longs  = row?.longsPct  != null ? Math.round(row.longsPct)  : null;
                const shorts = row?.shortsPct != null ? Math.round(row.shortsPct) : (longs != null ? 100 - longs : null);
                const oi = row?.oiUsd != null ? (row.oiUsd / 1_000_000).toFixed(1) : null;
                const bias = longs == null ? "SIN DATO" : longs > 55 ? "ALCISTA" : longs < 45 ? "BAJISTA" : "NEUTRAL";
                const biasColor = bias === "ALCISTA" ? "#00e676" : bias === "BAJISTA" ? "#ff1744" : bias === "NEUTRAL" ? "#ffd700" : "#3a5568";
                return (
                  <div key={coin.symbol} className="bg-[#060a0f] border border-[#1a2535] p-4 hover:border-opacity-60 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span style={{ color: coin.color, fontSize: 18 }}>{coin.icon}</span>
                        <div>
                          <div className="font-space text-[11px] text-white">{coin.name}</div>
                          <div className="font-space text-[8px] text-[#7ab3c8]">{row?.source ?? (oiLoading ? "cargando..." : "—")}</div>
                        </div>
                      </div>
                      <span className="font-space text-[9px] font-bold px-2 py-0.5 tracking-[0.1em]"
                        style={{ background: `${biasColor}15`, border: `1px solid ${biasColor}33`, color: biasColor }}>
                        {bias}
                      </span>
                    </div>

                    <div className="text-[10px] font-space text-[#7ab3c8] mb-2 flex justify-between">
                      <span>LONGS <strong className="text-[#00e676]">{longs != null ? `${longs}%` : "—"}</strong></span>
                      <span>OI <strong className="text-white">{oi != null ? `$${oi}M` : "—"}</strong></span>
                      <span>SHORTS <strong className="text-[#ff1744]">{shorts != null ? `${shorts}%` : "—"}</strong></span>
                    </div>

                    <div className="h-1.5 bg-[#0d1520] rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{ background: longs != null ? `linear-gradient(90deg, #00e676 ${longs}%, #ff1744 ${longs}%)` : "#1a2535" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Disclaimer */}
            <div className="border border-[#ffd70020] bg-[#ffd70008] p-4 rounded">
              <div className="font-space text-[9px] text-[#ffd700] tracking-[0.15em] uppercase mb-1">⚠ Fuente de datos</div>
              <div className="font-space text-[10px] text-[#7ab3c8] leading-relaxed">
                Open Interest en dólares y % real de cuentas long/short, tomados directo de las APIs públicas de
                Binance Futures y Bybit (con Hyperliquid como respaldo — ahí el sesgo se estima por el signo del
                funding rate, ya que su API pública no expone ratio de cuentas). Cache de 90 segundos por símbolo.
              </div>
            </div>
          </div>
        )}

        {/* Footer disclaimer */}
        <div className="mt-8 border-t border-[#0d1520] pt-6">
          <p className="font-space text-[9px] text-[#5a8898] leading-relaxed">
            ⚠ DISCLAIMER: Las señales son únicamente educativas y de referencia. No constituyen asesoramiento financiero. El trading con apalancamiento implica riesgo de pérdida total del capital. Operá siempre con gestión de riesgo adecuada (máx 1-2% por trade). Datos en tiempo real vía Binance WebSocket, Bybit y Hyperliquid API.
          </p>
        </div>
      </div>
    </div>
  );
}
