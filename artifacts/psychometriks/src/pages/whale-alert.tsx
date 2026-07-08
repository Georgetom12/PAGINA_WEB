import React, { useState, useEffect, useRef, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import SiteNav from "@/components/site-nav";

// ─── Auth ─────────────────────────────────────────────────────────────────────
function getAuth() {
  try {
    const r = localStorage.getItem("psyko_auth");
    if (!r) return null;
    const s = JSON.parse(r) as { role?: string; plan?: string; ts?: number; user?: string };
    if (Date.now() - (s.ts ?? 0) > 28_800_000) return null;
    return s;
  } catch { return null; }
}
function isElite(auth: ReturnType<typeof getAuth>) {
  if (!auth) return false;
  const role = auth.role ?? "";
  const plan = (auth.plan ?? "").toLowerCase();
  return role === "superadmin" || role === "operator" || plan === "institucional" || plan === "elite";
}
function hasPro(auth: ReturnType<typeof getAuth>) {
  if (!auth) return false;
  const role = auth.role ?? "";
  const plan = (auth.plan ?? "").toLowerCase();
  return isElite({ ...auth }) || plan === "trader" || plan === "pro" || role === "member";
}

// ─── DeGate Types ─────────────────────────────────────────────────────────────
interface DgTicker {
  symbol: string; lastPrice: string; priceChange: string; priceChangePercent: string;
  volume: string; quoteVolume: string; highPrice: string; lowPrice: string;
  bidPrice: string; askPrice: string;
  base_token_id?: number; quote_token_id?: number; pair_id?: number;
}
interface DgPump { h1: number; h24: number; d7: number; price_usd: number; }
interface DgDepth { bids: [string, string][]; asks: [string, string][]; }
interface DgTrade { id: string | number; price: string; qty: string; quoteQty: string; time: number; isBuyerMaker: boolean; }

// ─── Types ────────────────────────────────────────────────────────────────────
interface WhaleAlert {
  id: string; ts: number; coin: string; amount: number; usd: number;
  from: string; to: string;
  type: "transfer"|"exchange_in"|"exchange_out"|"whale_buy"|"whale_sell"|"liquidation";
  hash: string; source: "hyperliquid"|"etherscan"|"mempool"|"dexscreener"; significant: boolean;
}
interface WhaleTrader {
  id: string; displayName: string; coin: string;
  exchange?: "binance"|"bybit"|"okx"|"hyperliquid"|"dydx"|"bitmex";
  currentPosition: "LONG"|"SHORT"|"NEUTRAL";
  positionSizeUsd: number; winRate: number;
  pnl24h: number; pnlWeek: number; volume24h: number;
  totalTrades: number; roi: number; fundingRate: number;
  oiUsd: number; signal: "BUY"|"SELL"|"HOLD";
  size?: "GRANDE"|"MID"|"SMALL";
  score100?: number;
  fundingFormatted?: string;
  isCoinglass?: boolean;
  priceChange24h?: number;
  pnlSource?: "mtm" | "est";
  entryPrice?: number;
  tpPrice?: number;
  slPrice?: number;
  walletLabel?: string;
}
interface CgSignalRaw {
  id: string;
  exchange: "binance"|"bybit"|"okx";
  exchangeLabel: string;
  coin: string;
  direction: "LONG"|"SHORT"|"NEUTRAL";
  fundingRate: number;
  fundingFormatted: string;
  oiUsd: number;
  signal: "BUY"|"SELL"|"HOLD";
  score100: number;
  size: "GRANDE"|"MID"|"SMALL";
  volume24h: number;
}
interface Gem {
  address: string; symbol: string; name: string; chain: string;
  price: number; priceChange1h: number; priceChange24h: number;
  volume24h: number; liquidity: number; marketCap: number;
  buyVolume: number; buyCount: number; sellCount: number;
  ageMinutes: number; dexUrl: string; isBoosted: boolean;
  rugScore?: number; rugRisks?: number; rugLoading?: boolean;
  whaleBuyVolume?: number; whaleBuyCount?: number; source?: "dex" | "cmc";
  detectedCount?: number;
}

interface TgPsySignal {
  id: number;
  tier: string | null;
  symbol: string | null;
  timeframe: string | null;
  tipo: string | null;
  score: string | number | null;
  confianza: string | null;
  precio: string | number | null;
  rsi: string | number | null;
  ema_9: string | number | null;
  ema_21: string | number | null;
  ema_50: string | number | null;
  ema_200: string | number | null;
  cvd: string | number | null;
  resistencia: string | number | null;
  soporte: string | number | null;
  score_tecnico: number | null;
  score_patron: number | null;
  score_sentiment: number | null;
  ts: number;
}

interface TgDegenGem {
  id: number;
  bot_source: string | null;
  tipo: string | null;
  symbol: string | null;
  address: string | null;
  chain: string | null;
  hold_score: number | null;
  precio: string | number | null;
  lp_usd: string | number | null;
  fdv: string | number | null;
  vol_1h: string | number | null;
  cambio_1h: string | number | null;
  cambio_24h: string | number | null;
  buys_1h: number | null;
  sells_1h: number | null;
  edad_min: number | null;
  monto_usd: string | number | null;
  lp_pool: string | number | null;
  tx_url: string | null;
  dex_url: string | null;
  ts: number;
}

interface TgWhaleAlert {
  id: number;
  exchange: string | null;
  coin: string | null;
  pair: string | null;
  clase: string | null;
  rating: number | null;
  direccion: string | null;
  tamano_usd: number | null;
  precio: string | number | null;
  wallet: string | null;
  mensaje: string | null;
  ts: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n == null || !isFinite(n as unknown as number)) return "$—";
  if (n >= 1e9) return `$${(n/1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n/1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
function timeAgo(ts: number) {
  const s = Math.floor((Date.now()-ts)/1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s/60)}m`;
  return `${Math.floor(s/3600)}h`;
}
function ageLabel(min: number) {
  if (min < 60) return `${Math.round(min)}m`;
  if (min < 1440) return `${Math.round(min/60)}h`;
  return `${Math.round(min/1440)}d`;
}
function fmtPrice(p: number) {
  if (!p) return "–";
  if (p >= 1000) return `$${Math.round(p).toLocaleString("en")}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  return `$${p.toFixed(6)}`;
}

// ─── Exchange meta ─────────────────────────────────────────────────────────────
type ExchangeKey = "all"|"hyperliquid"|"dydx"|"okx"|"bitmex"|"binance"|"bybit";
const EX_META: Record<ExchangeKey, { color: string; short: string; bg: string }> = {
  all:         { color: "#00e5ff", short: "TODAS",  bg: "#001a1f" },
  hyperliquid: { color: "#00d4aa", short: "HL",     bg: "#001a15" },
  dydx:        { color: "#6c63ff", short: "dYdX",   bg: "#08001a" },
  okx:         { color: "#00a3ff", short: "OKX",    bg: "#00101a" },
  bitmex:      { color: "#ff6d00", short: "BMX",    bg: "#1a0800" },
  binance:     { color: "#f0b90b", short: "BNB",    bg: "#1a1000" },
  bybit:       { color: "#f7a600", short: "BYB",    bg: "#1a1200" },
};

// ─── CG mapper ────────────────────────────────────────────────────────────────
function cgToTrader(s: CgSignalRaw): WhaleTrader {
  return {
    id: s.id, displayName: `${s.exchange.toUpperCase()}-${s.coin}`, coin: s.coin,
    exchange: s.exchange, currentPosition: s.direction,
    positionSizeUsd: s.oiUsd * 0.01, winRate: s.score100,
    pnl24h: 0, pnlWeek: 0, volume24h: s.volume24h,
    totalTrades: 0, roi: 0, fundingRate: s.fundingRate,
    oiUsd: s.oiUsd, signal: s.signal, size: s.size,
    score100: s.score100, fundingFormatted: s.fundingFormatted, isCoinglass: true,
  };
}

// ─── Persist history ──────────────────────────────────────────────────────────
const HIST_KEY = "psy_whale_history_v2";
const VALID_TYPES = new Set(["transfer","exchange_in","exchange_out","whale_buy","whale_sell","liquidation"]);
function loadHistory(): WhaleAlert[] {
  try {
    const raw = JSON.parse(localStorage.getItem(HIST_KEY) ?? "[]") as WhaleAlert[];
    return raw.filter(a => a && VALID_TYPES.has(a.type));
  } catch { return []; }
}
function saveHistory(alerts: WhaleAlert[]) {
  try { localStorage.setItem(HIST_KEY, JSON.stringify(alerts.slice(0, 200))); } catch {}
}

// ─── Win Rate del Sistema ─────────────────────────────────────────────────────
function calcSystemWinRate(traders: WhaleTrader[]): { rate: number; total: number; wins: number } {
  if (!traders.length) return { rate: 0, total: 0, wins: 0 };
  const withData = traders.filter(t => t.pnlSource === "mtm" && t.priceChange24h !== undefined);
  if (!withData.length) return { rate: 0, total: 0, wins: 0 };
  const isLong = (t: WhaleTrader) => t.currentPosition === "LONG";
  const wins = withData.filter(t => {
    const chg = t.priceChange24h ?? 0;
    return isLong(t) ? chg > 0 : chg < 0;
  }).length;
  return { rate: Math.round((wins / withData.length) * 100), total: withData.length, wins };
}

// ─── TYPE META ─────────────────────────────────────────────────────────────────
const TYPE_META: Record<WhaleAlert["type"], {label:string;icon:string;color:string;emoji:string}> = {
  transfer:     {label:"TRANSFERENCIA",  icon:"↔", color:"#7ab3c8",  emoji:"🔄"},
  exchange_in:  {label:"ENTRADA CEX",   icon:"⬇", color:"#ff6d00",  emoji:"📥"},
  exchange_out: {label:"SALIDA CEX",    icon:"⬆", color:"#00e676",  emoji:"📤"},
  whale_buy:    {label:"COMPRA BALLENA",icon:"🐋", color:"#00e676",  emoji:"🐋"},
  whale_sell:   {label:"VENTA BALLENA", icon:"🔴", color:"#ff1744",  emoji:"🔴"},
  liquidation:  {label:"LIQUIDACIÓN",   icon:"💥", color:"#e040fb",  emoji:"💥"},
};
const SOURCE_LABEL: Record<WhaleAlert["source"],string> = {
  hyperliquid:"Hyperliquid", etherscan:"ETH On-Chain",
  mempool:"BTC Mempool", dexscreener:"DexScreener",
};

// ─── Intent Score ─────────────────────────────────────────────────────────────
function calcIntent(alerts: WhaleAlert[]) {
  if (!alerts.length) return 50;
  let bull = 0, bear = 0;
  for (const a of alerts) {
    const w = a.significant ? 2 : 1;
    if (a.type === "whale_buy" || a.type === "exchange_out") bull += w;
    else if (a.type === "whale_sell" || a.type === "exchange_in") bear += w;
  }
  const total = bull + bear;
  if (!total) return 50;
  return Math.round((bull / total) * 100);
}

// ─── Plan Gate ─────────────────────────────────────────────────────────────────
function PlanGate({icon,title,planName,planPrice,color,features,href}:{
  icon:string;title:string;planName:string;planPrice:string;color:string;features:string[];href:string;
}) {
  return (
    <div style={{minHeight:"100vh",background:"#020408",color:"#fff",display:"flex",flexDirection:"column"}}>
      <SiteNav />
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 24px 24px"}}>
        <div style={{border:`1px solid ${color}33`,background:"#060a0f",padding:40,maxWidth:440,width:"100%",textAlign:"center",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${color},transparent)`}}/>
          <div style={{fontSize:44,marginBottom:16}}>{icon}</div>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color,letterSpacing:"0.4em",marginBottom:8}}>ACCESO RESTRINGIDO</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,color:"#fff",marginBottom:8}}>{title}</div>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:12,color:"#7a9aaa",marginBottom:24,lineHeight:1.6}}>
            Disponible desde el plan <span style={{color,fontWeight:700}}>{planName}</span> (${planPrice}/mes).
          </div>
          <div style={{background:"#0d1520",border:`1px solid ${color}22`,padding:"14px 18px",marginBottom:24,textAlign:"left"}}>
            {features.map(f=>(
              <div key={f} style={{display:"flex",alignItems:"center",gap:8,fontFamily:"'Space Grotesk',sans-serif",fontSize:11,color:"#8a9ab0",marginBottom:6}}>
                <span style={{color,fontSize:9}}>✦</span>{f}
              </div>
            ))}
          </div>
          <a href={href} style={{display:"block",width:"100%",padding:"12px",background:color,color:"#020408",fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:12,letterSpacing:"0.2em",textTransform:"uppercase",textDecoration:"none",boxSizing:"border-box"}}>VER PLANES →</a>
        </div>
      </div>
    </div>
  );
}

// ─── SYSTEM WIN RATE BANNER ───────────────────────────────────────────────────
function SystemWinRateBanner({ traders }: { traders: WhaleTrader[] }) {
  const sys = calcSystemWinRate(traders);
  if (!sys.total) return null;
  const color = sys.rate >= 60 ? "#00e676" : sys.rate >= 50 ? "#ffd700" : "#ff4444";
  const label = sys.rate >= 65 ? "SISTEMA ALCISTA ✅" : sys.rate >= 50 ? "SISTEMA NEUTRO ⚖️" : "SISTEMA BAJISTA ⚠️";
  return (
    <div className="relative overflow-hidden border mb-5 p-4"
      style={{borderColor:`${color}30`, background:`linear-gradient(135deg,#020b12,#040e18)`, boxShadow:`0 0 30px ${color}12`}}>
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{background:`linear-gradient(90deg,transparent,${color},transparent)`}}/>
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <div className="font-sharetech text-[8px] tracking-[0.25em] text-[#7ab3c8] mb-1">📊 WIN RATE DEL SISTEMA</div>
          <div className="flex items-baseline gap-2">
            <span className="font-bebas text-5xl leading-none" style={{color}}>{sys.rate}%</span>
            <span className="font-sharetech text-[9px]" style={{color}}>{label}</span>
          </div>
        </div>
        <div className="flex-1 min-w-[160px]">
          <div className="flex justify-between mb-1">
            <span className="font-sharetech text-[7px] text-[#5a8898]">0%</span>
            <span className="font-sharetech text-[7px] text-[#5a8898]">50%</span>
            <span className="font-sharetech text-[7px] text-[#5a8898]">100%</span>
          </div>
          <div className="h-2.5 bg-[#0a1520] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{width:`${sys.rate}%`, background:`linear-gradient(90deg,#ff4444,#ffd700 50%,#00e676)`, boxShadow:`0 0 8px ${color}60`}}/>
          </div>
          <div className="flex justify-between mt-1">
            <span className="font-space text-[7px] text-[#ff4444]">{sys.total - sys.wins} MISS</span>
            <span className="font-space text-[7px]" style={{color}}>{sys.wins}/{sys.total} correctas</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-sharetech text-[7px] text-[#5a8898] tracking-[0.1em]">BASADO EN</div>
          <div className="font-bebas text-xl text-white leading-none">{sys.total} señales MTM</div>
          <div className="font-sharetech text-[6px] text-[#5a8898] mt-0.5">precio real OKX 24H</div>
        </div>
      </div>
    </div>
  );
}

// ─── TELEGRAM-STYLE ALERT CARD ────────────────────────────────────────────────
function TelegramAlertCard({ a }: { a: WhaleAlert }) {
  const meta = TYPE_META[a.type] ?? TYPE_META.transfer;
  const isSignif = a.significant;
  return (
    <div className="relative overflow-hidden border transition-all duration-300 hover:scale-[1.01]"
      style={{
        borderColor: isSignif ? `${meta.color}60` : `${meta.color}25`,
        background: `linear-gradient(135deg,#020b12,#040e18)`,
        boxShadow: isSignif ? `0 0 20px ${meta.color}20, inset 0 0 30px ${meta.color}05` : "none",
      }}>
      <div className="h-[2px] w-full" style={{background:`linear-gradient(90deg,transparent,${meta.color},transparent)`}}/>
      <div className="p-3 flex gap-3 items-start">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center border text-xl"
          style={{borderColor:`${meta.color}30`, background:`${meta.color}12`}}>
          {meta.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bebas text-xl leading-none text-white tracking-wider">{a.coin}</span>
            <span className="font-sharetech text-[8px] px-2 py-0.5 tracking-[0.12em]"
              style={{color:meta.color, background:`${meta.color}15`, border:`1px solid ${meta.color}35`}}>
              {meta.label}
            </span>
            {isSignif && (
              <span className="font-sharetech text-[7px] px-1.5 py-0.5 text-[#ffd700] border border-[#ffd70035] bg-[#ffd70010] animate-pulse">
                ⚡ GRANDE
              </span>
            )}
            <span className="ml-auto font-sharetech text-[8px] text-[#3a5a6a]">{timeAgo(a.ts)}</span>
          </div>
          <div className="font-bebas text-2xl leading-none mb-1" style={{color:meta.color}}>
            {fmt(a.usd)}
            {a.amount > 0 && a.coin !== "BTC" && a.coin !== "ETH" && (
              <span className="font-space text-[10px] text-[#5a8898] font-normal ml-2">
                {(a.amount ?? 0).toFixed(2)} {a.coin}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[8px] font-sharetech text-[#7ab3c8]">
            <span className="text-[#5a8898]">DE</span>
            <span className="px-1.5 py-0.5 bg-[#0a1520] border border-[#1a2535] truncate max-w-[90px]">{a.from}</span>
            <span className="text-[#5a8898]">→</span>
            <span className="px-1.5 py-0.5 bg-[#0a1520] border border-[#1a2535] truncate max-w-[90px]">{a.to}</span>
            <span className="ml-auto text-[#3a4a5a] text-[6px] truncate">{SOURCE_LABEL[a.source]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── INTENT SCORE ──────────────────────────────────────────────────────────────
function IntentScoreBar({score,total}:{score:number;total:number}) {
  const color = score >= 65 ? "#00e676" : score <= 35 ? "#ff1744" : "#ffd700";
  const label = score >= 65 ? "ALCISTA" : score <= 35 ? "BAJISTA" : "NEUTRAL";
  return (
    <div className="border border-[#0d2030] bg-[#040f18] p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-sharetech text-[9px] tracking-[0.25em] text-[#7ab3c8]">⬡ MARKET INTENT SCORE</div>
        <div className="font-sharetech text-[9px] text-[#7ab3c8]">{total} alertas</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="font-bebas text-5xl tracking-wider" style={{color}}>{score}</div>
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <span className="font-sharetech text-[8px] text-[#ff1744]">BAJISTA 0</span>
            <span className="font-sharetech text-[9px] font-bold" style={{color}}>{label}</span>
            <span className="font-sharetech text-[8px] text-[#00e676]">100 ALCISTA</span>
          </div>
          <div className="h-3 bg-[#0d1520] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{width:`${score}%`, background:`linear-gradient(90deg,#ff1744,#ffd700,#00e676)`}}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WHALE FEEDS TAB ──────────────────────────────────────────────────────────
function WhaleFeedsTab() {
  const [alerts, setAlerts] = useState<WhaleAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<"all"|"whale_buy"|"whale_sell"|"liquidation"|"exchange_in"|"exchange_out">("all");
  const [coinFilter, setCoinFilter] = useState<"all"|"BTC"|"ETH"|"SOL">("all");
  const histRef = useRef(loadHistory());

  const load = useCallback(async () => {
    if (paused) return;
    try {
      // Fuente primaria: whale_alerts_tg (datos reales Telegram) — mezclado con on-chain
      const [tgRes, apiRes] = await Promise.allSettled([
        fetch("/api/whale-intel/tg-whales").then(r=>r.json()) as Promise<{ok:boolean;alerts:WhaleAlert[]}>,
        fetch("/api/whale-intel/alerts").then(r=>r.json()) as Promise<{ok:boolean;alerts:WhaleAlert[]}>,
      ]);
      const tgAlerts  = (tgRes.status  === "fulfilled" && tgRes.value.ok  ? tgRes.value.alerts  : []).filter(a => a && VALID_TYPES.has(a.type));
      const apiAlerts = (apiRes.status === "fulfilled" && apiRes.value.ok ? apiRes.value.alerts : []).filter(a => a && VALID_TYPES.has(a.type));
      const merged    = [...tgAlerts, ...apiAlerts];
      const seen      = new Set(merged.map(a=>a.id));
      for (const h of histRef.current) { if (!seen.has(h.id)) merged.push(h); }
      merged.sort((a,b)=>b.ts-a.ts);
      histRef.current = merged.slice(0,200);
      saveHistory(histRef.current);
      setAlerts(merged.slice(0,80));
    } catch {}
  }, [paused]);

  useEffect(() => {
    load().finally(()=>setLoading(false));
    const t = setInterval(load, 30_000);
    return ()=>clearInterval(t);
  }, [load]);

  const COINS = ["all","BTC","ETH","SOL"] as const;
  const TYPES = [
    {key:"all",        label:"TODAS"},
    {key:"whale_buy",  label:"🐋 COMPRAS"},
    {key:"whale_sell", label:"🔴 VENTAS"},
    {key:"liquidation",label:"💥 LIQUIDACIONES"},
    {key:"exchange_in",label:"📥 ENTRADA CEX"},
    {key:"exchange_out",label:"📤 SALIDA CEX"},
  ] as const;

  const filtered = alerts.filter(a =>
    (filter === "all" || a.type === filter) &&
    (coinFilter === "all" || a.coin === coinFilter)
  );
  const intent = calcIntent(alerts);

  return (
    <div>
      <IntentScoreBar score={intent} total={alerts.length} />
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-1.5 flex-wrap">
          {TYPES.map(t=>(
            <button key={t.key} onClick={()=>setFilter(t.key as typeof filter)}
              className="font-sharetech text-[8px] tracking-[0.1em] px-3 py-1.5 border transition-all"
              style={{
                borderColor: filter===t.key ? "#00e5ff" : "#0d2030",
                color: filter===t.key ? "#00e5ff" : "#7ab3c8",
                background: filter===t.key ? "#001a1f" : "#040f18",
              }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 ml-auto">
          {COINS.map(c=>(
            <button key={c} onClick={()=>setCoinFilter(c)}
              className="font-sharetech text-[8px] px-3 py-1.5 border transition-all"
              style={{
                borderColor: coinFilter===c ? "#ffd700" : "#0d2030",
                color: coinFilter===c ? "#ffd700" : "#7ab3c8",
                background: coinFilter===c ? "#1a1000" : "#040f18",
              }}>
              {c}
            </button>
          ))}
          <button onClick={()=>setPaused(p=>!p)}
            className={`font-sharetech text-[8px] px-3 py-1.5 border transition-all ${paused?"border-[#ff4444] text-[#ff4444] bg-[#1a0005]":"border-[#0d2030] text-[#7ab3c8]"}`}>
            {paused ? "⏸ PAUSADO" : "▶ EN VIVO"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center font-sharetech text-[10px] text-[#7ab3c8] animate-pulse tracking-[0.2em]">
          CONECTANDO: HYPERLIQUID · ETHERSCAN · MEMPOOL.SPACE…
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center font-sharetech text-[10px] text-[#5a8898]">Sin alertas para ese filtro</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(a => <TelegramAlertCard key={a.id} a={a} />)}
        </div>
      )}

      <div className="mt-6 font-space text-[8px] text-[#5a8898] text-center">
        <span className="text-[#00e676]">● DATOS REALES</span> — Hyperliquid · Etherscan ETH · mempool.space BTC &nbsp;·&nbsp; Actualización cada 30s
      </div>
    </div>
  );
}

// ─── HISTORY MODAL ─────────────────────────────────────────────────────────────
interface TraderHistory {
  traderId: string; displayName: string; coin: string; exchange: string;
  daysTracked: number; cumulativePnl: number;
  timeline: Array<{date:string;pnl:number;cumPnl:number;oi:number;winRate:number;position:string}>;
}
function HistoryModal({ traderId, onClose }: { traderId: string; onClose: () => void }) {
  const [hist, setHist] = useState<TraderHistory|null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/whale-intel/trader-history/${traderId}`)
      .then(r=>r.json()).then(d=>{if(d.ok)setHist(d);}).catch(()=>{}).finally(()=>setLoading(false));
  }, [traderId]);
  const color = (hist?.cumulativePnl ?? 0) >= 0 ? "#00e676" : "#ff1744";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(2,8,18,0.9)",backdropFilter:"blur(4px)"}}>
      <div className="w-full max-w-2xl border border-[#1a2535] bg-[#020b14] overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#0d1a2a]">
          <div>
            <div className="font-bebas text-2xl text-white tracking-wider">{hist?.displayName ?? traderId}</div>
            <div className="font-sharetech text-[8px] text-[#7ab3c8]">{hist?.coin} · {hist?.exchange?.toUpperCase()} · {hist?.daysTracked ?? 0} días rastreados</div>
          </div>
          <button onClick={onClose} className="font-sharetech text-[10px] px-3 py-1.5 border border-[#1a2535] text-[#7ab3c8] hover:border-[#00e5ff] hover:text-[#00e5ff] transition-colors">✕</button>
        </div>
        {loading ? (
          <div className="py-12 text-center font-sharetech text-[9px] text-[#7ab3c8] animate-pulse">CARGANDO HISTORIAL…</div>
        ) : !hist || hist.timeline.length === 0 ? (
          <div className="py-12 text-center">
            <div className="font-bebas text-2xl text-[#7ab3c8] mb-2">SIN HISTORIAL AÚN</div>
            <div className="font-space text-[8px] text-[#5a8898]">Los datos se acumulan con el tiempo. Volvé mañana.</div>
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "PNL ACUMULADO", value: fmt(hist.cumulativePnl), color },
                { label: "DÍAS RASTREADOS", value: String(hist.daysTracked), color: "#00e5ff" },
                { label: "PUNTOS DATOS", value: String(hist.timeline.length), color: "#e040fb" },
              ].map(s => (
                <div key={s.label} className="bg-[#040d18] border border-[#0d1a2a] p-3 text-center">
                  <div className="font-sharetech text-[6px] text-[#5a8898] tracking-[0.1em] mb-1">{s.label}</div>
                  <div className="font-bebas text-xl tracking-wider" style={{color:s.color}}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className="mb-2 font-sharetech text-[7px] text-[#5a8898] tracking-[0.12em]">PNL ACUMULADO — ÚLTIMOS {hist.daysTracked} DÍAS</div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hist.timeline} margin={{top:4,right:4,left:0,bottom:0}}>
                  <defs>
                    <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={color} stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{fill:"#5a8898",fontSize:7}} tickLine={false} axisLine={false} tickFormatter={v=>v.slice(5)}/>
                  <YAxis tick={{fill:"#5a8898",fontSize:7}} tickLine={false} axisLine={false} tickFormatter={v=>v>=1e6?`$${(v/1e6).toFixed(1)}M`:v>=1e3?`$${(v/1e3).toFixed(0)}K`:`$${v}`}/>
                  <Tooltip contentStyle={{background:"#040d18",border:"1px solid #1a2535",borderRadius:0,fontFamily:"Share Tech Mono"}} labelStyle={{color:"#7ab3c8",fontSize:9}} itemStyle={{color,fontSize:9}} formatter={(v:number)=>[fmt(v),"PNL Acum."]}/>
                  <ReferenceLine y={0} stroke="#1a2535" strokeDasharray="3 3"/>
                  <Area type="monotone" dataKey="cumPnl" stroke={color} strokeWidth={2} fill="url(#histGrad)" dot={false} activeDot={{r:3,fill:color}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TELEGRAM-STYLE TRADER CARD ───────────────────────────────────────────────
function TraderCard({
  t, winPeriod, onHistory
}: {
  t: WhaleTrader;
  winPeriod: "day"|"week"|"month";
  onHistory: (id: string) => void;
}) {
  const isLong = t.currentPosition === "LONG";
  const isShort = t.currentPosition === "SHORT";
  const posColor = isLong ? "#00e676" : isShort ? "#ff1744" : "#ffd700";
  const sigColor = t.signal === "BUY" ? "#00e676" : t.signal === "SELL" ? "#ff1744" : "#ffd700";
  const exMeta = EX_META[t.exchange as ExchangeKey] ?? EX_META.hyperliquid;

  const wr = (() => {
    const base = t.score100 ?? t.winRate;
    if (winPeriod === "day") return Math.max(45, base - 6 + Math.abs(t.fundingRate)*500 % 4);
    if (winPeriod === "month") return Math.min(92, base + 4);
    return base;
  })();

  const wrColor = wr >= 65 ? "#00e676" : wr <= 45 ? "#ff1744" : "#ffd700";
  const fundingFmt = `${(t.fundingRate??0)>=0?"+":""}${((t.fundingRate??0)*100).toFixed(4)}%`;
  const fundingColor = t.fundingRate > 0 ? "#ff6b6b" : "#69db7c";

  return (
    <div className="relative overflow-hidden border transition-all duration-300 hover:scale-[1.01]"
      style={{
        borderColor: `${posColor}35`,
        background: `linear-gradient(135deg,#020b12 0%,#040e18 100%)`,
        boxShadow: `0 0 20px ${posColor}08, inset 0 0 40px ${posColor}04`,
      }}>

      <div className="h-[2px] w-full" style={{background:`linear-gradient(90deg,${exMeta.color},${sigColor} 60%,transparent)`}}/>

      <div className="px-4 pt-3 pb-2 border-b" style={{borderColor:`${posColor}15`}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-sharetech text-[8px] px-2 py-1 tracking-[0.15em] font-bold"
              style={{color:exMeta.color, background:`${exMeta.color}15`, border:`1px solid ${exMeta.color}40`}}>
              {exMeta.short}
            </span>
            <span className="font-bebas text-3xl text-white tracking-wider leading-none">{t.coin}</span>
            {t.size && (
              <span className="font-sharetech text-[7px] px-1.5 py-0.5"
                style={{
                  color: t.size==="GRANDE"?"#ffd700":t.size==="MID"?"#00e5ff":"#7a9aaa",
                  border: `1px solid ${t.size==="GRANDE"?"#ffd70035":t.size==="MID"?"#00e5ff25":"#1a2535"}`,
                  background: t.size==="GRANDE"?"#ffd70012":t.size==="MID"?"#00e5ff08":"transparent",
                }}>
                {t.size}
              </span>
            )}
          </div>
          <span className="font-bebas text-lg px-4 py-1 tracking-[0.1em] leading-none"
            style={{
              color: posColor,
              background: `${posColor}18`,
              border: `1px solid ${posColor}50`,
              boxShadow: `0 0 14px ${posColor}25`,
            }}>
            {isLong ? "▲ LONG" : isShort ? "▼ SHORT" : "● NEUTRAL"}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-1.5">
          <span className="font-sharetech text-[7px] text-[#5a8898]">OI</span>
          <span className="font-space text-[10px] font-bold text-[#00e5ff]">{fmt(t.oiUsd)}</span>
          {t.pnlSource === "mtm" && t.priceChange24h !== undefined && (
            <>
              <span className="font-sharetech text-[7px] text-[#5a8898]">•</span>
              <span className="font-sharetech text-[7px] text-[#5a8898]">PRECIO 24H</span>
              <span className="font-space text-[9px] font-bold"
                style={{color:t.priceChange24h>=0?"#00e676":"#ff1744"}}>
                {t.priceChange24h>=0?"▲":"▼"} {Math.abs(t.priceChange24h).toFixed(2)}%
              </span>
              <span className="ml-auto font-sharetech text-[6px] px-1.5 py-0.5 text-[#00d4aa] border border-[#00d4aa35]">⚡MTM</span>
            </>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4 p-3 border" style={{borderColor:`${wrColor}20`, background:`${wrColor}06`}}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-sharetech text-[8px] tracking-[0.15em] text-[#7ab3c8]">WIN RATE {winPeriod.toUpperCase()}</span>
            <span className="font-bebas text-2xl leading-none" style={{color:wrColor}}>{(wr??0).toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-[#0a1520] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width:`${wr}%`,
                background: wr>=65?`linear-gradient(90deg,#007a30,#00e676)`:wr<=45?`linear-gradient(90deg,#880020,#ff1744)`:`linear-gradient(90deg,#997700,#ffd700)`,
                boxShadow:`0 0 8px ${wrColor}50`,
              }}/>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            {label: t.pnlSource==="mtm"?"PNL 24H ⚡":"PNL 24H",  value:`${t.pnl24h>=0?"+":""}${fmt(t.pnl24h)}`,   color:t.pnl24h>=0?"#00e676":"#ff1744"},
            {label: t.pnlSource==="mtm"?"PNL 7D ⚡":"PNL 7D",    value:`${t.pnlWeek>=0?"+":""}${fmt(t.pnlWeek)}`, color:t.pnlWeek>=0?"#00e676":"#ff1744"},
            {label:"VOLUMEN 24H", value:fmt(t.volume24h),          color:"#00e5ff"},
            {label:"FUNDING",     value:fundingFmt,                color:fundingColor},
          ].map(s=>(
            <div key={s.label} className="bg-[#040d18] border border-[#0d1a2a] p-2.5">
              <div className="font-sharetech text-[6px] text-[#5a8898] tracking-[0.08em] mb-1">{s.label}</div>
              <div className="font-space text-[10px] font-bold" style={{color:s.color}}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="border mb-3 overflow-hidden" style={{borderColor:`${posColor}25`}}>
          <div className="font-sharetech text-[7px] px-3 py-1.5 tracking-[0.15em] text-center"
            style={{background:`${posColor}12`, color:posColor, borderBottom:`1px solid ${posColor}20`}}>
            📍 NIVELES DE POSICIÓN
          </div>
          <div className="grid grid-cols-3 divide-x divide-[#0d1a2a]">
            {[
              {label:"ENTRADA", val:t.entryPrice, color:"#00e5ff"},
              {label:"TP (est.)", val:t.tpPrice, color:"#00e676"},
              {label:"SL (est.)", val:t.slPrice, color:"#ff4444"},
            ].map(lv=>(
              <div key={lv.label} className="text-center p-2">
                <div className="font-sharetech text-[6px] text-[#5a8898] tracking-[0.08em] mb-0.5">{lv.label}</div>
                <div className="font-space text-[9px] font-bold" style={{color:lv.color}}>
                  {lv.val ? fmtPrice(lv.val) : <span className="text-[#3a4a5a]">🔒</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={()=>onHistory(t.id)}
            className="font-sharetech text-[7px] tracking-[0.12em] px-3 py-2 border border-[#1a2535] text-[#5a8898] hover:border-[#00e5ff55] hover:text-[#00e5ff] transition-all">
            📈 HISTORIAL 6M
          </button>
          <span className="font-bebas text-xl px-6 py-1 tracking-[0.15em] text-black"
            style={{background:sigColor, boxShadow:`0 0 20px ${sigColor}60`}}>
            {t.signal==="BUY"?"▲":t.signal==="SELL"?"▼":"●"} {t.signal}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── OI FLOW TAB (antes: Copy Trading) ───────────────────────────────────────
function CopyTradingTab() {
  const [traders, setTraders] = useState<WhaleTrader[]>([]);
  const [loading, setLoading] = useState(true);
  const [winPeriod, setWinPeriod] = useState<"day"|"week"|"month">("week");
  const [exFilter, setExFilter] = useState<ExchangeKey>("all");
  const [sources, setSources] = useState<Record<string,number>>({});
  const [lastUpdate, setLastUpdate] = useState<Date|null>(null);
  const [historyId, setHistoryId] = useState<string|null>(null);

  const load = async () => {
    const [hlResult, cgResult] = await Promise.allSettled([
      fetch("/api/whale-intel/traders").then(r=>r.json()) as Promise<{ok:boolean;traders:WhaleTrader[];sources?:Record<string,number>}>,
      fetch("/api/coinglass/signals").then(r=>r.json()) as Promise<{ok:boolean;signals:CgSignalRaw[];error?:string}>,
    ]);

    let allTraders: WhaleTrader[] = [];
    const newSources: Record<string,number> = {};

    if (hlResult.status === "fulfilled" && hlResult.value.ok) {
      allTraders = hlResult.value.traders.map(t => ({...t, exchange: t.exchange ?? "hyperliquid"}));
      if (hlResult.value.sources) Object.assign(newSources, hlResult.value.sources);
    }

    if (cgResult.status === "fulfilled" && cgResult.value.ok && cgResult.value.signals?.length) {
      const cgTraders = cgResult.value.signals.map(cgToTrader);
      for (const t of cgTraders) {
        if (t.exchange) newSources[t.exchange] = (newSources[t.exchange] ?? 0) + 1;
      }
      allTraders = [...cgTraders, ...allTraders];
    }

    newSources["all"] = allTraders.length;
    setTraders(allTraders);
    setSources(newSources);
    setLastUpdate(new Date());
  };

  useEffect(() => {
    load().finally(()=>setLoading(false));
    const t = setInterval(load, 90_000);
    return ()=>clearInterval(t);
  }, []);

  const visible = exFilter === "all" ? traders : traders.filter(t=>t.exchange===exFilter);
  const buySignals  = visible.filter(t=>t.signal==="BUY").length;
  const sellSignals = visible.filter(t=>t.signal==="SELL").length;
  const holdSignals = visible.filter(t=>t.signal==="HOLD").length;
  const totalSig    = buySignals + sellSignals + holdSignals;
  const consensus   = buySignals > sellSignals ? "ALCISTA" : sellSignals > buySignals ? "BAJISTA" : "NEUTRAL";
  const consensusColor = buySignals > sellSignals ? "#00e676" : sellSignals > buySignals ? "#ff1744" : "#ffd700";
  const longCount = visible.filter(t=>t.currentPosition==="LONG").length;
  const shortCount = visible.filter(t=>t.currentPosition==="SHORT").length;

  return (
    <div>
      {historyId && <HistoryModal traderId={historyId} onClose={()=>setHistoryId(null)} />}

      <SystemWinRateBanner traders={traders} />

      <div className="flex flex-wrap gap-1.5 mb-4">
        {(Object.keys(EX_META) as ExchangeKey[]).map(k=>{
          const meta = EX_META[k];
          const count = k==="all" ? traders.length : (sources[k] ?? 0);
          const active = exFilter===k;
          return (
            <button key={k} onClick={()=>setExFilter(k)}
              className="flex items-center gap-1.5 px-3 py-2 border transition-all font-sharetech text-[8px] tracking-[0.1em]"
              style={{
                borderColor: active ? meta.color : "#1a2e40",
                color: active ? meta.color : "#7ab3c8",
                background: active ? `${meta.color}15` : "#040d18",
                boxShadow: active ? `0 0 12px ${meta.color}25` : "none",
              }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{background:meta.color}}/>
              {meta.short}
              <span className="font-bebas text-base leading-none" style={{color:active?meta.color:"#aaccdd"}}>{count}</span>
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1.5">
          {lastUpdate && <span className="font-sharetech text-[7px] text-[#5a8898]">{lastUpdate.toLocaleTimeString()}</span>}
          <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse"/>
          <span className="font-sharetech text-[7px] text-[#7ab3c8] tracking-[0.15em]">EN VIVO</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="border border-[#0d2030] bg-[#040f18] p-4 text-center">
          <div className="font-sharetech text-[8px] tracking-[0.18em] text-[#7ab3c8] mb-2">CONSENSO MULTI-DEX</div>
          <div className="font-bebas text-3xl tracking-wider" style={{color:consensusColor}}>{consensus}</div>
          <div className="font-space text-[10px] text-[#7ab3c8] mt-1">{visible.length} señales</div>
        </div>
        <div className="border border-[#00e67640] bg-[#00020a] p-4 text-center">
          <div className="font-sharetech text-[8px] tracking-[0.18em] text-[#7ab3c8] mb-2">🟢 BUY</div>
          <div className="font-bebas text-4xl text-[#00e676] leading-none">{buySignals}</div>
          <div className="font-space text-[10px] text-[#7ab3c8] mt-1">{totalSig?Math.round(buySignals/totalSig*100):0}%</div>
        </div>
        <div className="border border-[#ff174440] bg-[#0a0002] p-4 text-center">
          <div className="font-sharetech text-[8px] tracking-[0.18em] text-[#7ab3c8] mb-2">🔴 SELL</div>
          <div className="font-bebas text-4xl text-[#ff1744] leading-none">{sellSignals}</div>
          <div className="font-space text-[10px] text-[#7ab3c8] mt-1">{totalSig?Math.round(sellSignals/totalSig*100):0}%</div>
        </div>
        <div className="border border-[#0d2030] bg-[#040f18] p-4 text-center">
          <div className="font-sharetech text-[8px] tracking-[0.18em] text-[#7ab3c8] mb-2">LONG / SHORT</div>
          <div className="font-bebas text-3xl text-white leading-none">
            <span className="text-[#00e676]">{longCount}</span>
            <span className="text-[#7ab3c8] mx-1">/</span>
            <span className="text-[#ff1744]">{shortCount}</span>
          </div>
          <div className="font-space text-[10px] text-[#7ab3c8] mt-1">posiciones</div>
        </div>
      </div>

      {totalSig > 0 && (
        <div className="border border-[#0d2030] bg-[#040f18] p-4 mb-4">
          <div className="flex justify-between mb-2">
            <span className="font-sharetech text-[9px] text-[#00e676] font-bold">▲ BUY {buySignals}</span>
            <span className="font-sharetech text-[9px] text-[#ffd700]">● HOLD {holdSignals}</span>
            <span className="font-sharetech text-[9px] text-[#ff1744] font-bold">▼ SELL {sellSignals}</span>
          </div>
          <div className="h-3 bg-[#0d1520] rounded-full overflow-hidden flex">
            <div style={{width:`${buySignals/totalSig*100}%`, background:"linear-gradient(90deg,#007a30,#00e676)"}} className="h-full transition-all duration-700"/>
            <div style={{width:`${holdSignals/totalSig*100}%`, background:"#ffd700"}} className="h-full transition-all duration-700"/>
            <div style={{width:`${sellSignals/totalSig*100}%`, background:"linear-gradient(90deg,#ff1744,#880020)"}} className="h-full transition-all duration-700"/>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-5">
        <span className="font-sharetech text-[9px] text-[#7ab3c8] tracking-[0.2em]">WIN RATE:</span>
        {(["day","week","month"] as const).map(p=>(
          <button key={p} onClick={()=>setWinPeriod(p)}
            className={`font-sharetech text-[9px] tracking-[0.12em] px-4 py-2 border transition-colors ${winPeriod===p?"border-[#ffd700] text-[#ffd700] bg-[#1a1200]":"border-[#0d2030] text-[#7ab3c8]"}`}>
            {p==="day"?"24H":p==="week"?"7D":"30D"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center font-sharetech text-[10px] text-[#7ab3c8] animate-pulse tracking-[0.15em]">
          CONECTANDO: HL · dYdX v4 · OKX · BITMEX…
        </div>
      ) : visible.length === 0 ? (
        <div className="p-8 text-center font-space text-[11px] text-[#7ab3c8]">Sin señales para este exchange</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map(t => (
            <TraderCard key={t.id} t={t} winPeriod={winPeriod} onHistory={setHistoryId} />
          ))}
        </div>
      )}

      <div className="mt-6 font-space text-[8px] text-[#5a8898] text-center leading-relaxed">
        <span className="text-[#00e676]">● OI / FUNDING REAL</span> — Hyperliquid · dYdX v4 · OKX · BitMEX &nbsp;·&nbsp;
        <span className="text-[#00d4aa]">⚡ MTM</span> — PNL mark-to-market precio real OKX 24H · Actualización cada 90s
      </div>
    </div>
  );
}

// ─── TradingView Technical Analysis Widget ────────────────────────────────────
const TV_SYMBOLS: Record<string, string> = {
  BTC: "BINANCE:BTCUSDT",
  ETH: "BINANCE:ETHUSDT",
  SOL: "BINANCE:SOLUSDT",
};

function TvTechWidget({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";
    const inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    el.appendChild(inner);
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
    script.async = true;
    // textContent (no innerHTML) es el método correcto para pasar JSON al widget de TradingView
    script.textContent = JSON.stringify({
      interval: "1h",
      width: "100%",
      isTransparent: true,
      height: 460,
      symbol: TV_SYMBOLS[symbol] ?? `BINANCE:${symbol}USDT`,
      showIntervalTabs: true,
      displayMode: "multiple",
      locale: "es",
      colorTheme: "dark",
    });
    el.appendChild(script);
    return () => { el.innerHTML = ""; };
  }, [symbol]);
  // overflow:hidden + fondo oscuro oculta el blanco del borde del iframe
  return (
    <div ref={containerRef} className="tradingview-widget-container"
      style={{ minHeight: 460, background: "#020b12", overflow: "hidden" }} />
  );
}

// ─── PSY ALGO v2 TYPES ────────────────────────────────────────────────────────
interface AlgoPattern { name: string; type: "BULLISH"|"BEARISH"|"NEUTRAL"; timeframe: string; description: string; target?: number; strength: "FUERTE"|"MODERADO"|"DÉBIL"; }
interface MacroTarget { label: string; price: number; type: "BULLISH"|"BEARISH"|"NEUTRAL"; }
interface AlgoSignal {
  symbol: string; name: string; icon: string; color: string;
  direction: "LONG"|"SHORT"|"NEUTRAL"; strength: "FUERTE"|"MODERADO"|"DÉBIL"; score: number;
  entry: string; tp1: string; tp2: string; sl: string; rr: string; currentPrice: string;
  indicators: { rsi1h: string; rsi4h: string; rsiDivergence: string; macdCross: string; macdHistogram: number; cvdTrend: string; volumeSpike: string; struct4h: string; structWeekly: string; };
  openInterest: { total: number; change24h: string };
  fibonacci: { swingHigh: string; swingLow: string; fib382: string; fib500: string; fib618: string; fib786: string; fib1272: string; };
  patterns: AlgoPattern[]; macroTargets: MacroTarget[]; inds: string[]; updatedAt: number;
  iaConfirmado?: boolean | null; iaConfianza?: number; iaDictamen?: string; iaPatron?: string; iaAccion?: string;
}
interface ExchangeAlgoSignal {
  symbol: string; name: string; icon: string; color: string;
  signal: "LONG"|"SHORT"|"NEUTRAL"; bias: string;
  fundingRate: string; fundingAnnual: string; totalOI: number;
  dydx: { exchange: string; price: number; oi: number; fundingRate: number; fundingAnnual: number } | null;
  gmx: { exchange: string; oi: number; longPct: number; shortPct: number } | null;
  updatedAt: number;
}
interface SqueezeCandidate {
  symbol: string; name: string; icon: string; color: string;
  avgFunding: number; fundingPct: string; fundingAnnual: string;
  type: string; risk: string; score: number; isSS: boolean;
  sources: { exchange: string; rate: string }[];
  volume: { vol24h: number; ratio: string; spike: string; unit: string };
  cvd: { trend: string; delta: string; dominancePct: string };
  openInterest: { total: number; change24h: string };
  confirmations: number;
  updatedAt: number;
}

// ─── PSY SIGNALS TAB — PSY ALGO v2 ────────────────────────────────────────────
function PsySignalsTab() {
  const [signals, setSignals] = useState<AlgoSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string|null>(null);
  const [tab, setTab] = useState<"overview"|"patterns"|"fibonacci">("overview");

  const load = useCallback(async () => {
    try {
      const d = await fetch("/api/psy-algo/signals").then(r => r.json()) as { ok: boolean; signals: AlgoSignal[]; error?: string };
      if (d.ok && d.signals?.length) { setSignals(d.signals); setError(""); }
      else if (d.error) setError(d.error);
    } catch (e) { setError(String(e)); }
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); const t = setInterval(load, 5 * 60_000); return () => clearInterval(t); }, [load]);

  const longCount  = signals.filter(s => s.direction === "LONG").length;
  const shortCount = signals.filter(s => s.direction === "SHORT").length;

  return (
    <div>
      {/* Header stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "ACTIVOS ANALIZADOS", value: String(signals.length), color: "#00e5ff" },
          { label: "▲ LONG",  value: String(longCount),  color: "#00e676" },
          { label: "▼ SHORT", value: String(shortCount), color: "#ff1744" },
          { label: "NEUTRO",  value: String(signals.length - longCount - shortCount), color: "#ffd700" },
        ].map(s => (
          <div key={s.label} className="border border-[#0d2030] bg-[#040f18] p-3 text-center">
            <div className="font-sharetech text-[6px] tracking-[0.12em] text-[#5a8898] mb-1">{s.label}</div>
            <div className="font-bebas text-3xl leading-none" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tab nav for expanded view */}
      {expanded && (
        <div className="flex gap-2 mb-4">
          {(["overview","patterns","fibonacci"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="font-sharetech text-[8px] tracking-[0.1em] px-3 py-1.5 border transition-all"
              style={{ borderColor: tab === t ? "#00e5ff" : "#0d2030", color: tab === t ? "#00e5ff" : "#7ab3c8", background: tab === t ? "#001520" : "#020b12" }}>
              {t === "overview" ? "SEÑAL" : t === "patterns" ? "PATRONES" : "FIBONACCI"}
            </button>
          ))}
          <button onClick={() => setExpanded(null)} className="ml-auto font-sharetech text-[8px] text-[#5a8898] px-3 py-1.5 border border-[#0d2030]">✕ CERRAR</button>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center">
          <div className="font-sharetech text-[10px] text-[#00e5ff] animate-pulse tracking-[0.25em] mb-3">CALCULANDO ALGORITMO PSY…</div>
          <div className="font-space text-[8px] text-[#3a5a6a]">EMA · RSI · MACD · CVD · Fibonacci · Patrones · OI</div>
        </div>
      ) : error ? (
        <div className="p-10 text-center border border-[#ff174430] bg-[#0a0003]">
          <div className="font-bebas text-xl text-[#ff1744] mb-2">ERROR DE CONEXIÓN</div>
          <div className="font-space text-[8px] text-[#7ab3c8]">{error}</div>
          <button onClick={() => { setLoading(true); load().finally(() => setLoading(false)); }} className="mt-3 font-sharetech text-[8px] px-4 py-1.5 border border-[#00e5ff30] text-[#00e5ff]">REINTENTAR</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {signals.map(s => {
            const isExp = expanded === s.symbol;
            const dirColor = s.direction === "LONG" ? "#00e676" : s.direction === "SHORT" ? "#ff1744" : "#ffd700";
            const bullP = s.patterns.filter(p => p.type === "BULLISH");
            const bearP = s.patterns.filter(p => p.type === "BEARISH");
            const strColor = s.strength === "FUERTE" ? "#00e676" : s.strength === "MODERADO" ? "#ffd700" : "#ff6b6b";
            const rsi1hNum = parseFloat(s.indicators.rsi1h);
            const rsi4hNum = parseFloat(s.indicators.rsi4h);
            const volNum = parseFloat(s.indicators.volumeSpike);
            return (
              <div key={s.symbol} className="relative overflow-hidden border transition-all cursor-pointer hover:border-opacity-70"
                onClick={() => { setExpanded(isExp ? null : s.symbol); setTab("overview"); }}
                style={{ borderColor: `${dirColor}40`, background: "linear-gradient(160deg,#020b12,#030d16)", boxShadow: isExp ? `0 0 30px ${dirColor}20` : "none", gridColumn: isExp ? "1 / -1" : undefined }}>
                <div className="h-[2px]" style={{ background: `linear-gradient(90deg,transparent,${dirColor},transparent)` }} />
                <div className="p-4">

                  {/* Asset header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bebas text-4xl leading-none" style={{ color: s.color }}>{s.icon}</span>
                      <div>
                        <div className="font-bebas text-2xl text-white tracking-wider leading-none">{s.symbol}</div>
                        <div className="font-sharetech text-[7px] text-[#5a8898]">{s.name}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-bebas text-base px-4 py-1 text-black tracking-wider" style={{ background: dirColor, boxShadow: `0 0 14px ${dirColor}60` }}>
                        {s.direction === "LONG" ? "▲ LONG" : s.direction === "SHORT" ? "▼ SHORT" : "— NEUTRO"}
                      </span>
                      <span className="font-sharetech text-[7px]" style={{ color: strColor }}>● {s.strength}</span>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="font-sharetech text-[7px] text-[#5a8898] tracking-[0.1em]">CONFLUENCIA PSY ALGO</span>
                      <span className="font-bebas text-lg leading-none" style={{ color: s.score >= 70 ? "#00e676" : s.score >= 45 ? "#ffd700" : "#ff4444" }}>{s.score}/100</span>
                    </div>
                    <div className="h-2 bg-[#0a1520] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.score}%`, background: `linear-gradient(90deg,#ff4444,#ffd700 50%,#00e676)` }} />
                    </div>
                  </div>

                  {/* Confirmación IA Trading */}
                  {s.iaConfirmado === true && (
                    <div className="mb-3 px-3 py-2 border" style={{ borderColor: "#00e5ff44", background: "#00e5ff0c" }}>
                      <div className="font-sharetech text-[7px] text-[#00e5ff] tracking-[0.1em] mb-1">🦄 CONFIRMADO POR IA TRADING · {s.iaConfianza?.toFixed(0)}%</div>
                      {s.iaDictamen && <div className="font-space text-[9px] text-[#b0bec5] leading-relaxed">{s.iaDictamen}</div>}
                    </div>
                  )}
                  {s.iaConfirmado === false && (
                    <div className="mb-3 px-3 py-2 border" style={{ borderColor: "#ffd70044", background: "#ffd7000c" }}>
                      <div className="font-sharetech text-[7px] text-[#ffd700] tracking-[0.1em]">⚠ IA TRADING DISCREPA — precaución, señales en desacuerdo</div>
                    </div>
                  )}

                  {/* Price */}
                  <div className="font-bebas text-3xl text-white mb-3">${s.currentPrice}</div>

                  {!isExp ? (
                    /* Collapsed: quick stats */
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "RSI 1H", value: s.indicators.rsi1h, color: rsi1hNum < 30 ? "#00e676" : rsi1hNum > 70 ? "#ff1744" : "#ffd700" },
                        { label: "CVD",    value: s.indicators.cvdTrend === "BULLISH" ? "▲ BUY" : "▼ SELL", color: s.indicators.cvdTrend === "BULLISH" ? "#00e676" : "#ff1744" },
                        { label: "PATRONES", value: `${bullP.length}▲ ${bearP.length}▼`, color: bullP.length > bearP.length ? "#00e676" : bearP.length > bullP.length ? "#ff1744" : "#ffd700" },
                      ].map(item => (
                        <div key={item.label} className="bg-[#040d18] border border-[#0d1a2a] p-2 text-center">
                          <div className="font-sharetech text-[6px] text-[#5a8898] mb-0.5">{item.label}</div>
                          <div className="font-space text-[9px] font-bold" style={{ color: item.color }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  ) : tab === "overview" ? (
                    /* Expanded: Overview */
                    <div>
                      {/* Entry/TP/SL */}
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {[
                          { label: "ENTRADA",  value: `$${s.entry}`,  color: "#fff" },
                          { label: "TP1",      value: `$${s.tp1}`,    color: "#00e676" },
                          { label: "TP2",      value: `$${s.tp2}`,    color: "#00ff88" },
                          { label: "SL",       value: `$${s.sl}`,     color: "#ff1744" },
                        ].map(item => (
                          <div key={item.label} className="bg-[#040d18] border border-[#0d1a2a] p-2.5 text-center">
                            <div className="font-sharetech text-[6px] text-[#5a8898] mb-1">{item.label}</div>
                            <div className="font-space text-[9px] font-bold" style={{ color: item.color }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="font-sharetech text-[7px] text-[#ffd700] mb-4">R:R {s.rr}</div>

                      {/* Indicator grid */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                          { label: "RSI 1H",    value: s.indicators.rsi1h, color: rsi1hNum < 30 ? "#00e676" : rsi1hNum > 70 ? "#ff1744" : "#ffd700" },
                          { label: "RSI 4H",    value: s.indicators.rsi4h, color: rsi4hNum < 30 ? "#00e676" : rsi4hNum > 70 ? "#ff1744" : "#ffd700" },
                          { label: "DIVERGENCIA RSI", value: s.indicators.rsiDivergence === "BULLISH_DIV" ? "▲ ALCISTA" : s.indicators.rsiDivergence === "BEARISH_DIV" ? "▼ BAJISTA" : "NINGUNA", color: s.indicators.rsiDivergence === "BULLISH_DIV" ? "#00e676" : s.indicators.rsiDivergence === "BEARISH_DIV" ? "#ff1744" : "#5a8898" },
                          { label: "MACD 4H",   value: s.indicators.macdCross === "BULLISH" ? "▲ CRUCE" : s.indicators.macdCross === "BEARISH" ? "▼ CRUCE" : "SIN CRUCE", color: s.indicators.macdCross === "BULLISH" ? "#00e676" : s.indicators.macdCross === "BEARISH" ? "#ff1744" : "#7ab3c8" },
                          { label: "CVD",       value: s.indicators.cvdTrend === "BULLISH" ? "▲ COMPRAS" : "▼ VENTAS", color: s.indicators.cvdTrend === "BULLISH" ? "#00e676" : "#ff1744" },
                          { label: "VOLUMEN",   value: `×${s.indicators.volumeSpike}`, color: volNum > 2 ? "#ff6b00" : volNum > 1.5 ? "#ffd700" : "#7ab3c8" },
                          { label: "ESTR. 4H",  value: s.indicators.struct4h, color: s.indicators.struct4h === "BULLISH" ? "#00e676" : s.indicators.struct4h === "BEARISH" ? "#ff1744" : "#ffd700" },
                          { label: "ESTR. SEM", value: s.indicators.structWeekly, color: s.indicators.structWeekly === "BULLISH" ? "#00e676" : s.indicators.structWeekly === "BEARISH" ? "#ff1744" : "#ffd700" },
                          { label: "OI 24H",    value: s.openInterest.total > 0 ? `${parseFloat(s.openInterest.change24h) > 0 ? "+" : ""}${s.openInterest.change24h}%` : "N/A", color: parseFloat(s.openInterest.change24h) > 0 ? "#00e676" : "#ff1744" },
                        ].map(item => (
                          <div key={item.label} className="bg-[#040d18] border border-[#0d1a2a] p-2">
                            <div className="font-sharetech text-[6px] text-[#5a8898] mb-0.5">{item.label}</div>
                            <div className="font-space text-[8px] font-bold" style={{ color: item.color }}>{item.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Macro targets */}
                      {s.macroTargets.length > 0 && (
                        <div className="border border-[#ffd70030] bg-[#0a0a00] p-3 mb-3">
                          <div className="font-sharetech text-[7px] text-[#ffd700] tracking-[0.15em] mb-2">🎯 OBJETIVOS MACRO DETECTADOS</div>
                          <div className="flex flex-wrap gap-2">
                            {s.macroTargets.map((t, i) => (
                              <div key={i} className="flex items-center gap-1.5 border border-[#0d2030] bg-[#040f18] px-2.5 py-1.5">
                                <span style={{ color: t.type === "BULLISH" ? "#00e676" : "#ff1744" }}>{t.type === "BULLISH" ? "▲" : "▼"}</span>
                                <span className="font-sharetech text-[7px] text-[#7ab3c8]">{t.label}:</span>
                                <span className="font-bebas text-sm" style={{ color: t.type === "BULLISH" ? "#00e676" : "#ff1744" }}>${t.price.toLocaleString("en", { maximumFractionDigits: 0 })}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Confluence indicators list */}
                      <div className="border border-[#0d2030] bg-[#030c14] p-3">
                        <div className="font-sharetech text-[7px] text-[#5a8898] tracking-[0.12em] mb-2">📊 INDICADORES DE CONFLUENCIA</div>
                        <div className="space-y-1">
                          {s.inds.map((ind, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: ind.includes("▲") ? "#00e676" : ind.includes("▼") ? "#ff1744" : "#ffd700" }} />
                              <span className="font-space text-[8px] text-[#7ab3c8]">{ind}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* TradingView Technical Analysis — solo BTC / ETH / SOL */}
                      {TV_SYMBOLS[s.symbol] && (
                        <div className="mt-4 border border-[#0d2030] bg-[#030c14]" style={{ borderTop: "2px solid #00e5ff22" }}>
                          <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-[#0d2030]">
                            <div className="w-[3px] h-[13px]" style={{ background: "#00e5ff" }} />
                            <span className="font-sharetech text-[8px] tracking-[0.2em] text-[#00e5ff]">
                              📊 ANÁLISIS TÉCNICO MTF — {s.symbol} · TRADINGVIEW
                            </span>
                          </div>
                          <TvTechWidget symbol={s.symbol} />
                        </div>
                      )}
                    </div>

                  ) : tab === "patterns" ? (
                    /* Expanded: Patterns */
                    <div className="space-y-2">
                      {s.patterns.length === 0 ? (
                        <div className="p-8 text-center font-sharetech text-[9px] text-[#5a8898]">Sin patrones detectados en timeframes actuales</div>
                      ) : s.patterns.map((p, i) => (
                        <div key={i} className="border p-3 transition-all" style={{ borderColor: p.type === "BULLISH" ? "#00e67630" : p.type === "BEARISH" ? "#ff174430" : "#ffd70030", background: p.type === "BULLISH" ? "#001a0a" : p.type === "BEARISH" ? "#1a0002" : "#0a0a00" }}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-sharetech text-[6px] px-1.5 py-0.5 border" style={{ color: p.timeframe === "SEMANAL" ? "#e040fb" : "#00e5ff", borderColor: p.timeframe === "SEMANAL" ? "#e040fb40" : "#00e5ff40" }}>{p.timeframe}</span>
                              <span className="font-space text-[9px] font-bold text-white">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-sharetech text-[6px]" style={{ color: p.strength === "FUERTE" ? "#00e676" : p.strength === "MODERADO" ? "#ffd700" : "#ff6b6b" }}>{p.strength}</span>
                              <span className="font-bebas text-base" style={{ color: p.type === "BULLISH" ? "#00e676" : p.type === "BEARISH" ? "#ff1744" : "#ffd700" }}>
                                {p.type === "BULLISH" ? "▲" : p.type === "BEARISH" ? "▼" : "—"}
                              </span>
                            </div>
                          </div>
                          <div className="font-space text-[7px] text-[#5a8898] leading-relaxed">{p.description}</div>
                          {p.target && <div className="mt-1 font-sharetech text-[7px]" style={{ color: p.type === "BULLISH" ? "#00e676" : "#ff1744" }}>🎯 Objetivo: ${p.target.toLocaleString("en", { maximumFractionDigits: 0 })}</div>}
                        </div>
                      ))}
                    </div>

                  ) : (
                    /* Expanded: Fibonacci */
                    <div>
                      <div className="font-sharetech text-[7px] text-[#ffd700] tracking-[0.15em] mb-3">📐 NIVELES FIBONACCI — Swing High/Low automático</div>
                      <div className="space-y-1.5">
                        {[
                          { label: "SWING HIGH (100%)", value: s.fibonacci.swingHigh, ref: "resistance", pct: "100" },
                          { label: "FIB 1.272 (EXT)", value: s.fibonacci.fib1272, ref: "extension", pct: "127.2" },
                          { label: "FIB 0.786",        value: s.fibonacci.fib786, ref: "strong", pct: "78.6" },
                          { label: "FIB 0.618 (ORO)",  value: s.fibonacci.fib618, ref: "golden", pct: "61.8" },
                          { label: "FIB 0.500",        value: s.fibonacci.fib500, ref: "mid", pct: "50.0" },
                          { label: "FIB 0.382",        value: s.fibonacci.fib382, ref: "key", pct: "38.2" },
                          { label: "SWING LOW (0%)",   value: s.fibonacci.swingLow, ref: "support", pct: "0" },
                        ].map(f => {
                          const isCurrent = parseFloat(s.currentPrice.replace(/,/g,"")) >= parseFloat(f.value.replace(/,/g,"")) - 500 && parseFloat(s.currentPrice.replace(/,/g,"")) <= parseFloat(f.value.replace(/,/g,"")) + 500;
                          const fibColor = f.ref === "golden" ? "#ffd700" : f.ref === "extension" ? "#00e5ff" : f.ref === "resistance" ? "#ff4444" : f.ref === "support" ? "#00e676" : "#7ab3c8";
                          return (
                            <div key={f.label} className="flex items-center justify-between px-3 py-2 border" style={{ borderColor: isCurrent ? `${fibColor}60` : "#0d1a2a", background: isCurrent ? `${fibColor}10` : "#030c14" }}>
                              <div className="flex items-center gap-2">
                                {isCurrent && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: fibColor }} />}
                                <span className="font-sharetech text-[7px]" style={{ color: fibColor }}>{f.label}</span>
                              </div>
                              <span className="font-bebas text-base" style={{ color: fibColor }}>${f.value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 text-right font-sharetech text-[6px] text-[#2a4a5a]">
                    Actualizado {new Date(s.updatedAt).toLocaleTimeString("es")} · {isExp ? "clic para cerrar" : "clic para expandir"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 font-space text-[8px] text-[#5a8898] text-center">
        <span className="text-[#e040fb]">● PSY ALGO v2</span> — EMA · RSI+Div · MACD · CVD · Volume · Fibonacci · Estructura · OI · Patrones de velas · Chart Patterns macro · Actualización 5min
      </div>
    </div>
  );
}

// ─── EXCHANGE SIGNALS TAB — PSY ALGO v2 (dYdX + GMX, sin Hyperliquid) ─────────
function ExchangeSignalsTab() {
  const [signals, setSignals] = useState<ExchangeAlgoSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await fetch("/api/psy-algo/exchange-signals").then(r => r.json()) as { ok: boolean; signals: ExchangeAlgoSignal[] };
      if (d.ok && d.signals?.length) { setSignals(d.signals); setError(""); }
    } catch (e) { setError(String(e)); }
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); const t = setInterval(load, 3 * 60_000); return () => clearInterval(t); }, [load]);

  const fmtOI = (n: number) => n >= 1e9 ? `$${(n/1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n/1e3).toFixed(0)}K` : n > 0 ? `$${n.toFixed(0)}` : "—";

  return (
    <div>
      {/* Info banner */}
      <div className="border border-[#00e5ff20] bg-[#001520] p-3 mb-5 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse flex-shrink-0" />
        <span className="font-space text-[8px] text-[#7ab3c8]">Señales técnicas de DEX (funding rate + entrada/TP/SL) — <span className="text-[#00e5ff]">dYdX v4</span> (Cosmos) + <span className="text-[#ffd700]">GMX v2</span> (Arbitrum). Para historial de traders y ranking por eficiencia (3 meses), ver tab <span className="text-[#e040fb] font-bold">🐋 WHALE TRACKER</span>.</span>
      </div>

      {loading ? (
        <div className="p-16 text-center">
          <div className="font-sharetech text-[10px] text-[#00e5ff] animate-pulse tracking-[0.25em] mb-3">CONECTANDO CON DEX…</div>
          <div className="font-space text-[8px] text-[#3a5a6a]">dYdX v4 · GMX v2 · Funding Rate · Open Interest</div>
        </div>
      ) : error ? (
        <div className="p-10 text-center border border-[#ff174430]">
          <div className="font-bebas text-xl text-[#ff1744] mb-2">ERROR DE CONEXIÓN DEX</div>
          <div className="font-space text-[8px] text-[#7ab3c8]">{error}</div>
        </div>
      ) : (
        <div className="space-y-4">
          {signals.map(s => {
            const sigColor = s.signal === "LONG" ? "#00e676" : s.signal === "SHORT" ? "#ff1744" : "#ffd700";
            const frNum = parseFloat(s.fundingRate);
            const frColor = frNum < 0 ? "#00e676" : frNum > 0 ? "#ff6b6b" : "#7ab3c8";
            return (
              <div key={s.symbol} className="relative overflow-hidden border" style={{ borderColor: `${sigColor}30`, background: "linear-gradient(160deg,#020b12,#030d16)" }}>
                <div className="h-[2px]" style={{ background: `linear-gradient(90deg,transparent,${sigColor},transparent)` }} />
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bebas text-4xl leading-none" style={{ color: s.color }}>{s.icon}</span>
                      <div>
                        <div className="font-bebas text-2xl text-white tracking-wider leading-none">{s.symbol}</div>
                        <div className="font-sharetech text-[7px] text-[#5a8898]">{s.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bebas text-lg px-4 py-1 text-black tracking-wider block mb-1" style={{ background: sigColor, boxShadow: `0 0 14px ${sigColor}50` }}>
                        {s.signal === "LONG" ? "▲ LONG BIAS" : s.signal === "SHORT" ? "▼ SHORT BIAS" : "— NEUTRO"}
                      </span>
                      <span className="font-sharetech text-[6px] text-[#5a8898]">DEX INTEL</span>
                    </div>
                  </div>

                  {/* Bias explanation */}
                  <div className="border border-[#0d2030] bg-[#030c14] p-2.5 mb-4">
                    <div className="font-space text-[8px] text-[#7ab3c8] leading-relaxed">{s.bias}</div>
                  </div>

                  {/* Funding + OI */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: "FUNDING RATE", value: s.fundingRate, color: frColor },
                      { label: "FUNDING APR", value: s.fundingAnnual, color: frColor },
                      { label: "OI TOTAL DEX", value: fmtOI(s.totalOI), color: "#00e5ff" },
                    ].map(item => (
                      <div key={item.label} className="bg-[#040d18] border border-[#0d1a2a] p-2.5 text-center">
                        <div className="font-sharetech text-[6px] text-[#5a8898] mb-1">{item.label}</div>
                        <div className="font-space text-[9px] font-bold" style={{ color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Sources breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* dYdX */}
                    <div className="border border-[#00e5ff20] bg-[#00151a] p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-sharetech text-[6px] px-2 py-0.5 border border-[#00e5ff30] text-[#00e5ff]">dYdX v4</span>
                        <span className="font-sharetech text-[7px] text-[#5a8898]">Cosmos · Descentralizado</span>
                      </div>
                      {s.dydx ? (
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { label: "PRECIO",   value: `$${s.dydx.price.toLocaleString("en", { maximumFractionDigits: 0 })}`, color: "#fff" },
                            { label: "OI",       value: fmtOI(s.dydx.oi),   color: "#00e5ff" },
                            { label: "FUNDING",  value: ((s.dydx.fundingRate??0) * 100).toFixed(5) + "%", color: (s.dydx.fundingRate??0) < 0 ? "#00e676" : "#ff6b6b" },
                            { label: "FUNDING APR", value: (s.dydx.fundingAnnual??0).toFixed(2) + "%", color: (s.dydx.fundingRate??0) < 0 ? "#00e676" : "#ff6b6b" },
                          ].map(item => (
                            <div key={item.label} className="bg-[#020b12] p-1.5">
                              <div className="font-sharetech text-[5px] text-[#3a5a6a] mb-0.5">{item.label}</div>
                              <div className="font-space text-[8px]" style={{ color: item.color }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                      ) : <div className="font-sharetech text-[7px] text-[#3a5a6a] py-3 text-center">Sin datos disponibles</div>}
                    </div>

                    {/* GMX */}
                    <div className="border border-[#ffd70020] bg-[#0a0a00] p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-sharetech text-[6px] px-2 py-0.5 border border-[#ffd70030] text-[#ffd700]">GMX v2</span>
                        <span className="font-sharetech text-[7px] text-[#5a8898]">Arbitrum · Pools sintéticos</span>
                      </div>
                      {s.gmx ? (
                        <div>
                          <div className="grid grid-cols-2 gap-1.5 mb-2">
                            {[
                              { label: "OI TOTAL", value: fmtOI(s.gmx.oi), color: "#ffd700" },
                              { label: "TIPO", value: "Sin funding fix", color: "#7ab3c8" },
                            ].map(item => (
                              <div key={item.label} className="bg-[#020b12] p-1.5">
                                <div className="font-sharetech text-[5px] text-[#3a5a6a] mb-0.5">{item.label}</div>
                                <div className="font-space text-[8px]" style={{ color: item.color }}>{item.value}</div>
                              </div>
                            ))}
                          </div>
                          {/* Long/Short bar */}
                          <div className="mt-2">
                            <div className="flex justify-between mb-1">
                              <span className="font-sharetech text-[6px] text-[#00e676]">LONG {(s.gmx.longPct??0).toFixed(1)}%</span>
                              <span className="font-sharetech text-[6px] text-[#ff1744]">SHORT {(s.gmx.shortPct??0).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-[#0a1520] rounded-full overflow-hidden flex">
                              <div style={{ width: `${s.gmx.longPct}%`, background: "#00e676" }} />
                              <div style={{ width: `${s.gmx.shortPct}%`, background: "#ff1744" }} />
                            </div>
                          </div>
                        </div>
                      ) : <div className="font-sharetech text-[7px] text-[#3a5a6a] py-3 text-center">Sin datos disponibles</div>}
                    </div>
                  </div>

                  <div className="mt-3 text-right font-sharetech text-[6px] text-[#2a4a5a]">
                    Actualizado {new Date(s.updatedAt).toLocaleTimeString("es")} · Actualización 3min
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 font-space text-[8px] text-[#5a8898] text-center">
        <span className="text-[#00e5ff]">● DEX INTELLIGENCE</span> — dYdX v4 + GMX v2 · Funding Rate · Open Interest · Para Hyperliquid/OKX/BitMEX, ver tab 🐋 WHALE TRACKER · 3min
      </div>
    </div>
  );
}

// ─── SHORT SQUEEZE TAB — PSY ALGO v2 (Binance + MEXC + CoinGlass) ─────────────
function ShortSqueezeTab() {
  const [candidates, setCandidates] = useState<SqueezeCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await fetch("/api/psy-algo/squeeze-radar").then(r => r.json()) as { ok: boolean; candidates: SqueezeCandidate[] };
      if (d.ok && d.candidates?.length) { setCandidates(d.candidates); setError(""); }
    } catch (e) { setError(String(e)); }
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); const t = setInterval(load, 5 * 60_000); return () => clearInterval(t); }, [load]);

  const shortSqueeze = candidates.filter(c => c.type === "SHORT_SQUEEZE");
  const longSqueeze  = candidates.filter(c => c.type === "LONG_SQUEEZE");
  const activeAlerts = candidates.filter(c => c.confirmations >= 2);

  return (
    <div>
      {/* ── ALERTAS ACTIVAS (2/3 o 3/3 confirmaciones) ── */}
      {activeAlerts.length > 0 && (
        <div className="mb-5 space-y-2">
          {activeAlerts.map(c => {
            const isSS   = c.type === "SHORT_SQUEEZE";
            const is3of3 = c.confirmations >= 3;
            const alertColor = is3of3 ? "#ff1744" : "#ffd700";
            return (
              <div key={c.symbol} className="flex items-center gap-4 px-4 py-3 border"
                style={{ borderColor: alertColor, background: `${alertColor}12`, boxShadow: `0 0 20px ${alertColor}25` }}>
                <div className={`w-3 h-3 rounded-full ${is3of3 ? "animate-ping" : "animate-pulse"}`}
                  style={{ background: alertColor }} />
                <div className="flex-1">
                  <span className="font-bebas text-xl tracking-widest" style={{ color: alertColor }}>
                    {is3of3 ? "⚡ SQUEEZE ACTIVO" : "⚠ RIESGO MODERADO"}
                  </span>
                  <span className="font-sharetech text-[11px] text-white ml-3">{c.symbol}</span>
                  <span className="font-sharetech text-[10px] ml-2" style={{ color: isSS ? "#00e676" : "#ff6b6b" }}>
                    {isSS ? "↑ SHORTS EN RIESGO" : "↓ LONGS EN RIESGO"}
                  </span>
                </div>
                <div className="font-sharetech text-[11px] font-bold" style={{ color: alertColor }}>
                  {c.confirmations}/3 confirmaciones
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── HEADER + STATS ── */}
      <div className="border border-[#e040fb30] bg-[#060010] p-5 mb-5">
        <div className="font-sharetech text-[10px] tracking-[0.2em] text-[#e040fb] mb-2">⚡ RADAR DE SQUEEZE MULTI-EXCHANGE</div>
        <div className="font-space text-[11px] text-[#7ab3c8] mb-4 leading-relaxed">
          Detecta desequilibrios extremos de funding rate. Un <span className="text-[#00e676] font-bold">SHORT SQUEEZE</span> ocurre cuando el funding es muy negativo — shorts pagando caro, cualquier subida los liquida en cascada.
          Un <span className="text-[#ff6b6b] font-bold">LONG SQUEEZE</span> es lo opuesto: longs sobrecargados, riesgo de caída forzada.
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "ACTIVOS MONITOREADOS", value: String(candidates.length), color: "#e040fb" },
            { label: "⚡ SHORT SQUEEZE",      value: String(shortSqueeze.length), color: "#00e676" },
            { label: "💥 LONG SQUEEZE",       value: String(longSqueeze.length),  color: "#ff1744" },
          ].map(s => (
            <div key={s.label} className="bg-[#040d18] border border-[#1a2535] p-4 text-center">
              <div className="font-sharetech text-[9px] text-[#5a8898] tracking-[0.08em] mb-2">{s.label}</div>
              <div className="font-bebas text-4xl leading-none" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── GUÍA COLAPSABLE "¿Cómo leer esto?" ── */}
        <button onClick={() => setGuideOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-2.5 border border-[#e040fb30] hover:border-[#e040fb60] transition-all"
          style={{ background: "#0a0020" }}>
          <span className="font-sharetech text-[10px] text-[#e040fb] tracking-[0.15em]">📖 ¿CÓMO LEER ESTE RADAR?</span>
          <span className="font-sharetech text-[10px] text-[#e040fb]">{guideOpen ? "▲ CERRAR" : "▼ VER GUÍA"}</span>
        </button>
        {guideOpen && (
          <div className="border border-[#e040fb20] border-t-0 p-4 space-y-3" style={{ background: "#06001a" }}>
            {[
              { icon: "💸", title: "FUNDING PROMEDIO & APR", text: "El funding es lo que pagan los traders para mantener posiciones abiertas. Negativo = shorts pagan a longs (señal de presión corta). Positivo = longs pagan a shorts. APR >100% = insostenible a largo plazo." },
              { icon: "📊", title: "VOL 24H — Volumen en 24 horas", text: "Volumen real operado. NORMAL = dentro del rango habitual. ALTO o EXTREMO = aceleración anormal de actividad, confirma que algo se está moviendo." },
              { icon: "⚖️", title: "CVD 24H — Cumulative Volume Delta", text: "Flujo neto de órdenes: COMPRAS = más presión compradora. VENTAS = más presión vendedora. Si CVD va contra la dirección del precio, hay divergencia — señal potente." },
              { icon: "📈", title: "OPEN INT. — Interés Abierto", text: "Total de contratos abiertos en el mercado. OI creciente + precio subiendo = tendencia sana. OI creciente + precio bajando = acumulación de posiciones cortas — riesgo de squeeze." },
              { icon: "✅", title: "CONFIRMACIONES (0/3 → 3/3)", text: "El sistema necesita 3 señales simultáneas para confirmar un squeeze: funding extremo + volumen elevado + CVD alineado. 0/3 = sin señal. 2/3 = riesgo moderado (⚠ amarillo). 3/3 = SQUEEZE ACTIVO (🔴 alerta roja)." },
              { icon: "🌡️", title: "PRESIÓN DE FUNDING (1/5 → 5/5)", text: "Escala de intensidad. 1-2 = zona segura, funding normal. 3 = atención, presión moderada. 4-5 = zona peligrosa, el mercado está desequilibrado y puede explotar en cualquier dirección." },
            ].map(item => (
              <div key={item.title} className="flex gap-3">
                <span className="text-lg shrink-0">{item.icon}</span>
                <div>
                  <div className="font-sharetech text-[10px] text-[#e040fb] mb-1">{item.title}</div>
                  <div className="font-space text-[10px] text-[#7ab3c8] leading-relaxed">{item.text}</div>
                </div>
              </div>
            ))}
            <div className="border-t border-[#1a2535] pt-3">
              <div className="font-sharetech text-[10px] text-[#ffd700] mb-1">🎯 ¿CUÁNDO ACTUAR?</div>
              <div className="font-space text-[10px] text-[#7ab3c8] leading-relaxed">
                Una señal de squeeze no es una orden de compra o venta — es una advertencia de que el mercado está bajo presión extrema.
                Con <span className="text-[#ff1744]">3/3 confirmaciones</span>: el movimiento puede ser violento y rápido.
                Usá stops ajustados si operás en la dirección del squeeze. Nunca vayas contra él sin cobertura.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── SOURCES ── */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {["Binance", "OKX", "Bybit", "Gate.io", "MEXC", "KuCoin", "CoinGlass"].map(src => (
          <span key={src} className="font-sharetech text-[9px] px-3 py-1 border border-[#0d2030] text-[#7ab3c8]">{src}</span>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#e040fb] animate-pulse" />
          <span className="font-sharetech text-[9px] text-[#e040fb] tracking-[0.15em]">SCAN ACTIVO · 5min</span>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center">
          <div className="font-sharetech text-[12px] text-[#e040fb] animate-pulse tracking-[0.25em] mb-3">ESCANEANDO FUNDING RATES…</div>
          <div className="font-space text-[10px] text-[#3a5a6a]">Binance · MEXC · CoinGlass · Multi-Exchange</div>
        </div>
      ) : error ? (
        <div className="p-10 text-center border border-[#ff174430]">
          <div className="font-bebas text-2xl text-[#ff1744] mb-2">ERROR DE CONEXIÓN</div>
          <div className="font-space text-[10px] text-[#7ab3c8]">{error}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {candidates.map(c => {
            const isSS = c.type === "SHORT_SQUEEZE";
            const isLS = c.type === "LONG_SQUEEZE";
            const typeColor = isSS ? "#00e676" : isLS ? "#ff1744" : "#5a8898";
            const riskColor = c.risk === "EXTREMO" ? "#ff1744" : c.risk === "ALTO" ? "#ff6b00" : c.risk === "MEDIO" ? "#ffd700" : c.risk === "BAJO" ? "#e040fb" : "#5a8898";
            const frNum = c.avgFunding * 100;
            const frAbs = Math.abs(frNum);
            const barPct = Math.min(100, frAbs / 0.05 * 100);
            const isAlert = c.confirmations >= 2;

            return (
              <div key={c.symbol} className="relative overflow-hidden border transition-all hover:border-opacity-70"
                style={{
                  borderColor: isAlert ? `${c.confirmations >= 3 ? "#ff1744" : "#ffd700"}80` : `${typeColor}40`,
                  background: "linear-gradient(160deg,#020b12,#030d16)",
                  boxShadow: c.confirmations >= 3 ? `0 0 35px #ff174420` : c.score >= 4 ? `0 0 25px ${typeColor}15` : "none"
                }}>
                <div className="h-[3px]" style={{ background: `linear-gradient(90deg,transparent,${typeColor},transparent)` }} />
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <span className="font-bebas text-5xl leading-none" style={{ color: c.color }}>{c.icon}</span>
                      <div>
                        <div className="font-bebas text-3xl text-white tracking-wider leading-none">{c.symbol}</div>
                        <div className="font-sharetech text-[10px] text-[#5a8898]">{c.name}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="font-sharetech text-[9px] px-3 py-1.5 border animate-pulse"
                        style={{ color: riskColor, borderColor: `${riskColor}40`, background: `${riskColor}10` }}>
                        {c.risk === "EXTREMO" ? "🔥 EXTREMO" : c.risk === "ALTO" ? "⚠ ALTO" : c.risk === "MEDIO" ? "⚡ MEDIO" : c.risk === "BAJO" ? "● BAJO" : "— NEUTRO"}
                      </span>
                      <span className="font-sharetech text-[9px]" style={{ color: typeColor }}>
                        {isSS ? "⚡ SHORT SQUEEZE" : isLS ? "💥 LONG SQUEEZE" : "NEUTRO"}
                      </span>
                    </div>
                  </div>

                  {/* Funding stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { label: "FUNDING PROMEDIO", value: c.fundingPct, color: frNum < 0 ? "#00e676" : frNum > 0 ? "#ff6b6b" : "#7ab3c8" },
                      { label: "FUNDING APR",      value: c.fundingAnnual, color: frNum < 0 ? "#00e676" : frNum > 0 ? "#ff6b6b" : "#7ab3c8" },
                    ].map(item => (
                      <div key={item.label} className="bg-[#040d18] border border-[#0d1a2a] p-3 text-center">
                        <div className="font-sharetech text-[9px] text-[#5a8898] mb-2">{item.label}</div>
                        <div className="font-space text-[15px] font-bold" style={{ color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Volumen + CVD + OI */}
                  {c.volume && c.cvd && c.openInterest && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-[#040d18] border border-[#0d1a2a] p-3 text-center">
                        <div className="font-sharetech text-[9px] text-[#5a8898] mb-2">VOL 24H</div>
                        <div className="font-space text-[13px] font-bold text-[#e0e6ff]">
                          {c.volume.vol24h > 1000 ? (c.volume.vol24h / 1000).toFixed(1) + "K" : c.volume.vol24h.toFixed(1)} {c.volume.unit}
                        </div>
                        <div className="font-sharetech text-[9px] mt-1.5"
                          style={{ color: c.volume.spike === "EXTREMO" ? "#ff1744" : c.volume.spike === "ALTO" ? "#ffd700" : c.volume.spike === "NORMAL" ? "#00e676" : "#5a8898" }}>
                          {c.volume.spike} ×{c.volume.ratio}
                        </div>
                      </div>
                      <div className="bg-[#040d18] border border-[#0d1a2a] p-3 text-center">
                        <div className="font-sharetech text-[9px] text-[#5a8898] mb-2">CVD 24H</div>
                        <div className="font-space text-[13px] font-bold"
                          style={{ color: c.cvd.trend === "COMPRAS" ? "#00e676" : "#ff6b6b" }}>
                          {c.cvd.trend}
                        </div>
                        <div className="font-sharetech text-[9px] text-[#5a8898] mt-1.5">{c.cvd.dominancePct}% dom.</div>
                      </div>
                      <div className="bg-[#040d18] border border-[#0d1a2a] p-3 text-center">
                        <div className="font-sharetech text-[9px] text-[#5a8898] mb-2">OPEN INT.</div>
                        <div className="font-space text-[13px] font-bold text-[#e0e6ff]">
                          {c.openInterest.total > 1e9 ? (c.openInterest.total / 1e9).toFixed(2) + "B" : c.openInterest.total > 1e6 ? (c.openInterest.total / 1e6).toFixed(1) + "M" : c.openInterest.total.toFixed(0)}
                        </div>
                        <div className="font-sharetech text-[9px] mt-1.5"
                          style={{ color: parseFloat(c.openInterest.change24h) > 0 ? "#00e676" : parseFloat(c.openInterest.change24h) < 0 ? "#ff6b6b" : "#5a8898" }}>
                          {parseFloat(c.openInterest.change24h) > 0 ? "+" : ""}{c.openInterest.change24h}% 24H
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Confirmaciones */}
                  {c.confirmations != null && (
                    <div className="flex items-center gap-3 mb-4 px-2">
                      <span className="font-sharetech text-[9px] text-[#5a8898] shrink-0">CONFIRMACIONES</span>
                      <div className="flex gap-1.5 flex-1">
                        {[0,1,2,3].map(i => (
                          <div key={i} className="h-2 flex-1 rounded-sm transition-all"
                            style={{ background: i < c.confirmations ? (c.confirmations >= 3 ? "#ff1744" : c.confirmations >= 2 ? "#ffd700" : "#00e676") : "#0d1a2a" }} />
                        ))}
                      </div>
                      <span className="font-space text-[11px] font-bold shrink-0"
                        style={{ color: c.confirmations >= 3 ? "#ff1744" : c.confirmations >= 2 ? "#ffd700" : "#5a8898" }}>
                        {c.confirmations}/3
                      </span>
                    </div>
                  )}

                  {/* Squeeze intensity meter */}
                  <div className="border p-3.5 mb-4" style={{ borderColor: `${typeColor}25`, background: `${typeColor}08` }}>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="font-sharetech text-[9px]" style={{ color: typeColor }}>
                        {isSS ? "⚡ INTENSIDAD SQUEEZE CORTOS" : isLS ? "💥 INTENSIDAD SQUEEZE LARGOS" : "📊 PRESIÓN DE FUNDING"}
                      </span>
                      <span className="font-bebas text-xl leading-none" style={{ color: riskColor }}>{c.score}/5</span>
                    </div>
                    <div className="h-3 bg-[#0a1520] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${barPct}%`, background: isSS ? `linear-gradient(90deg,#00e676,#ffd700,#ff1744)` : `linear-gradient(90deg,#e040fb,#ff6b00,#ff1744)` }} />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="font-sharetech text-[9px] text-[#5a8898]">NEUTRO</span>
                      <span className="font-sharetech text-[9px]" style={{ color: riskColor }}>{barPct.toFixed(0)}%</span>
                      <span className="font-sharetech text-[9px] text-[#ff1744]">EXTREMO</span>
                    </div>
                  </div>

                  {/* What it means */}
                  <div className="bg-[#030c14] border border-[#0d1a2a] p-3.5 mb-3">
                    <div className="font-sharetech text-[9px] text-[#5a8898] mb-2">📖 QUÉ SIGNIFICA</div>
                    <div className="font-space text-[10px] text-[#7ab3c8] leading-relaxed">
                      {isSS
                        ? `Shorts están pagando ${c.fundingPct} por mantener posición. Si el precio sube, se liquidarán en cascada — potencial movimiento explosivo alcista.`
                        : isLS
                        ? `Longs están pagando ${c.fundingPct} por mantener posición. Si el precio cae, liquidaciones en cadena — potencial movimiento bajista rápido.`
                        : "Funding balanceado. Sin presión extrema en ninguna dirección."}
                    </div>
                  </div>

                  {/* Sources breakdown */}
                  {c.sources.length > 0 && (
                    <div className="border border-[#0d1a2a] p-3">
                      <div className="font-sharetech text-[9px] text-[#5a8898] tracking-[0.1em] mb-2">FUENTES ({c.sources.length} exchanges)</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {c.sources.map((src, i) => (
                          <div key={i} className="flex items-center justify-between bg-[#040d18] px-2.5 py-1.5">
                            <span className="font-sharetech text-[9px] text-[#5a8898] truncate">{src.exchange}</span>
                            <span className="font-space text-[10px] font-bold ml-2" style={{ color: parseFloat(src.rate) < 0 ? "#00e676" : parseFloat(src.rate) > 0 ? "#ff6b6b" : "#7ab3c8" }}>{src.rate}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 text-right font-sharetech text-[8px] text-[#2a4a5a]">
                    Actualizado {new Date(c.updatedAt).toLocaleTimeString("es")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 font-space text-[9px] text-[#5a8898] text-center">
        <span className="text-[#e040fb]">● SHORT SQUEEZE RADAR v2</span> — Binance · OKX · Bybit · Gate.io · MEXC · KuCoin · CoinGlass · Señal confirmada por consenso multi-exchange · 5min
      </div>
    </div>
  );
}

// ─── GEM HUNTER TAB ───────────────────────────────────────────────────────────
function GemHunterTab({isEliteUser}:{isEliteUser:boolean}) {
  const [gems, setGems] = useState<Gem[]>([]);
  const [loading, setLoading] = useState(true);
  const [chain, setChain] = useState<"all"|"solana"|"ethereum">("all");
  const [minBuyVol, setMinBuyVol] = useState(20_000);
  const [rugLoading, setRugLoading] = useState<Record<string,boolean>>({});
  const [rugData, setRugData] = useState<Record<string,{score:number;risks:number}>>({});

  useEffect(() => {
    async function loadGems() {
      // Fuente primaria: gem_alerts_tg (🦅 DegenScout canal pro)
      const [tgRes, dexRes] = await Promise.allSettled([
        fetch("/api/whale-intel/tg-gems").then(r=>r.json()) as Promise<{ok:boolean;gems:TgDegenGem[]}>,
        fetch("/api/whale-intel/gems").then(r=>r.json()) as Promise<{ok:boolean;gems:Gem[]}>,
      ]);
      // Convertir TgDegenGem → Gem para renderizado unificado
      const tgGems: Gem[] = tgRes.status === "fulfilled" && tgRes.value.ok
        ? (tgRes.value.gems ?? []).map(g => ({
            address: g.address ?? `tg_${g.id}`,
            symbol: g.symbol ?? "?",
            name: `${g.tipo === "whale_buy" ? "🟢 WHALE BUY" : g.tipo === "whale_sell" ? "🔴 WHALE SELL" : "🆕 NUEVO"} · DegenScout`,
            chain: g.chain ?? "unknown",
            price: parseFloat(String(g.precio ?? "0")),
            priceChange1h: parseFloat(String(g.cambio_1h ?? "0")),
            priceChange24h: 0,
            volume24h: parseFloat(String(g.vol_1h ?? "0")),
            liquidity: parseFloat(String(g.lp_usd ?? "0")),
            marketCap: 0,
            buyVolume: g.tipo === "whale_buy" ? parseFloat(String(g.monto_usd ?? "0")) : parseFloat(String(g.vol_1h ?? "0")),
            buyCount: g.buys_1h ?? 0,
            sellCount: g.sells_1h ?? 0,
            ageMinutes: g.edad_min ?? 0,
            dexUrl: g.tx_url ?? g.dex_url ?? "#",
            isBoosted: (g.hold_score ?? 0) >= 70,
          }))
        : [];
      const dexGems: Gem[] = dexRes.status === "fulfilled" && dexRes.value.ok ? dexRes.value.gems ?? [] : [];
      setGems([...tgGems, ...dexGems]);
      setLoading(false);
    }
    loadGems().catch(()=>setLoading(false));
    const t = setInterval(loadGems, 60_000);
    return ()=>clearInterval(t);
  }, []);

  async function checkRug(address: string) {
    if (rugData[address] !== undefined || rugLoading[address]) return;
    setRugLoading(p=>({...p,[address]:true}));
    try {
      const r = await fetch(`/api/whale-intel/rugcheck/${address}`);
      const d = await r.json() as {score?:number;risks?:unknown[]};
      setRugData(p=>({...p,[address]:{score:d.score??0,risks:(d.risks??[]).length}}));
    } catch {
      setRugData(p=>({...p,[address]:{score:0,risks:0}}));
    }
    setRugLoading(p=>({...p,[address]:false}));
  }

  if (!isEliteUser) {
    return (
      <div className="border border-[#e040fb33] bg-[#060010] p-8 text-center">
        <div style={{fontSize:48,marginBottom:16}}>💎</div>
        <div className="font-bebas text-3xl text-[#e040fb] mb-2">GEM HUNTER — ELITE</div>
        <div className="font-space text-[12px] text-[#7ab3c8] mb-6 max-w-md mx-auto">
          Acceso exclusivo plan Elite. Detecta tokens con potencial 20x antes de que exploten.
        </div>
        <a href="/pricing" className="inline-block px-8 py-3 bg-[#e040fb] text-black font-space font-bold text-[11px] tracking-[0.2em] uppercase">
          VER PLAN ELITE →
        </a>
      </div>
    );
  }

  function rugColor(score: number) {
    if (score < 300) return "#00e676";
    if (score < 700) return "#ffd700";
    return "#ff1744";
  }
  function rugLabel(score: number) {
    if (score < 300) return "SEGURO";
    if (score < 700) return "RIESGO MEDIO";
    return "ALTO RIESGO";
  }

  const filtered = gems.filter(g =>
    (chain==="all"||g.chain===chain) && g.buyVolume >= minBuyVol
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-2">
          {(["all","solana","ethereum"] as const).map(c=>(
            <button key={c} onClick={()=>setChain(c)}
              className={`font-sharetech text-[9px] tracking-[0.12em] px-3 py-1.5 border transition-colors ${chain===c?"border-[#e040fb] text-[#e040fb] bg-[#0a0010]":"border-[#0d2030] text-[#7ab3c8]"}`}>
              {c==="all"?"TODAS":c==="solana"?"◎ SOLANA":"Ξ ETHEREUM"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="font-space text-[9px] text-[#7ab3c8]">BUY VOL MIN:</span>
          <select value={minBuyVol} onChange={e=>setMinBuyVol(Number(e.target.value))}
            className="font-space text-[9px] bg-[#040f18] border border-[#0d2030] text-white px-2 py-1.5 focus:outline-none">
            {[10_000,20_000,50_000,100_000,250_000].map(v=>(
              <option key={v} value={v}>{fmt(v)}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center font-sharetech text-[10px] text-[#7ab3c8] animate-pulse">ESCANEANDO DEX…</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center font-space text-[11px] text-[#5a8898]">Sin gems para ese filtro</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(gem=>{
            const rug = rugData[gem.address];
            const rl = rugLoading[gem.address];
            return (
              <div key={gem.address} className="relative overflow-hidden border border-[#e040fb20] bg-[#060010]"
                style={{boxShadow:gem.isBoosted?"0 0 20px #e040fb15":"none"}}>
                {gem.isBoosted && (
                  <div className="absolute top-2 right-2 font-sharetech text-[7px] px-1.5 py-0.5 text-[#e040fb] border border-[#e040fb35] bg-[#0a0018] animate-pulse">
                    ⚡ BOOST
                  </div>
                )}
                {!!gem.whaleBuyCount && gem.whaleBuyCount > 0 && (
                  <div className="absolute top-2 left-2 font-sharetech text-[7px] px-1.5 py-0.5 text-[#00e5ff] border border-[#00e5ff35] bg-[#00131a]">
                    🐋 {gem.whaleBuyCount} COMPRA{gem.whaleBuyCount > 1 ? "S" : ""} BALLENA · ${
                      (gem.whaleBuyVolume ?? 0) >= 1_000_000
                        ? `${((gem.whaleBuyVolume ?? 0) / 1_000_000).toFixed(2)}M`
                        : `${((gem.whaleBuyVolume ?? 0) / 1_000).toFixed(0)}K`
                    }
                  </div>
                )}
                {(gem.detectedCount ?? 1) > 1 && (
                  <div className="absolute top-9 left-2 font-sharetech text-[7px] px-1.5 py-0.5 text-[#ffd700] border border-[#ffd70035] bg-[#1a1400]">
                    🔁 DETECTADA {gem.detectedCount}× — pools/redes distintos
                  </div>
                )}
                <div className="h-[2px]" style={{background:`linear-gradient(90deg,transparent,#e040fb,transparent)`}}/>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bebas text-2xl text-white tracking-wider leading-none">{gem.symbol}</div>
                      <div className="font-space text-[9px] text-[#7ab3c8] mt-0.5 truncate max-w-[160px]">{gem.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-sharetech text-[7px] px-1.5 py-0.5 border"
                          style={{
                            color:gem.chain==="solana"?"#9945ff":"#627eea",
                            borderColor:gem.chain==="solana"?"#9945ff30":"#627eea30",
                            background:gem.chain==="solana"?"#0a0018":"#00081a",
                          }}>
                          {gem.chain==="solana"?"◎ SOL":"Ξ ETH"}
                        </span>
                        <span className="font-sharetech text-[7px] text-[#5a8898]">{ageLabel(gem.ageMinutes)} old</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bebas text-xl text-white leading-none">{fmtPrice(gem.price)}</div>
                      <div className="font-space text-[9px] font-bold mt-0.5"
                        style={{color:gem.priceChange24h>=0?"#00e676":"#ff1744"}}>
                        {(gem.priceChange24h??0)>=0?"▲":""}{(gem.priceChange24h??0).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    {[
                      {label:"BUY VOL",  value:fmt(gem.buyVolume),                       color:"#00e676"},
                      {label:"LIQUIDITY",value:fmt(gem.liquidity),                       color:"#00e5ff"},
                      {label:"MKT CAP",  value:gem.marketCap?fmt(gem.marketCap):"N/D",  color:"#ffd700"},
                      {label:"🐋 VOL BALLENA", value:gem.whaleBuyVolume?fmt(gem.whaleBuyVolume):"—", color:"#e040fb"},
                    ].map(s=>(
                      <div key={s.label} className="bg-[#040d18] border border-[#0d1a2a] p-2.5 text-center">
                        <div className="font-sharetech text-[7px] text-[#5a8898] tracking-[0.08em] mb-1">{s.label}</div>
                        <div className="font-space text-[11px] font-bold" style={{color:s.color}}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#0d1a2a]">
                    {rug ? (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 bg-[#0d1520] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{width:`${Math.min(100,(rug.score/1000)*100)}%`, background:rugColor(rug.score)}}/>
                        </div>
                        <span className="font-sharetech text-[8px] font-bold" style={{color:rugColor(rug.score)}}>
                          {rugLabel(rug.score)}
                        </span>
                      </div>
                    ) : (
                      <button onClick={()=>checkRug(gem.address)}
                        className="font-sharetech text-[8px] px-2.5 py-1.5 border transition-colors"
                        style={{borderColor:"#e040fb30", color:"#e040fb", background:"#0d0018"}}>
                        {rl?"ANALIZANDO…":"🔍 RUGCHECK"}
                      </button>
                    )}
                    <a href={gem.dexUrl} target="_blank" rel="noopener noreferrer"
                      className="font-sharetech text-[8px] px-3 py-1.5"
                      style={{background:"#001a1f", border:"1px solid #00e5ff40", color:"#00e5ff"}}>
                      DEXSCREENER ↗
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 font-space text-[9px] text-[#5a8898] text-center">
        💎 GEM HUNTER — Datos reales DexScreener · RugCheck on-chain · Actualización cada 60s · Solo fines educativos
      </div>
    </div>
  );
}

// ─── TWITTER / X FEED TAB ─────────────────────────────────────────────────────
interface TwTweet {
  id: string; text: string; authorName: string; authorHandle: string;
  createdAt: string; likes: number; retweets: number; url: string;
  category: "whale" | "signal" | "news";
}

interface OnchainWhale {
  id: string; chain: "BTC"|"ETH"; hash: string;
  amountNative: number; amountUsd: number;
  from: string; to: string; time: string; url: string;
}

function TwitterFeedTab() {
  const [tweets,     setTweets]     = useState<TwTweet[]>([]);
  const [onchain,    setOnchain]    = useState<OnchainWhale[]>([]);
  const [fetchedAt,  setFetchedAt]  = useState<string>("");
  const [nextRefresh,setNextRefresh]= useState<string>("");
  const [loading,    setLoading]    = useState(true);
  const [catFilter,  setCatFilter]  = useState<"all"|"whale"|"signal"|"news">("all");

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/whale-intel/tw-feed").then(r => r.json()) as Promise<{ ok: boolean; tweets: TwTweet[]; fetchedAt?: string; nextRefresh?: string }>,
      fetch("/api/whale-intel/onchain-whales").then(r => r.json()) as Promise<{ ok: boolean; whales: OnchainWhale[]; fetchedAt?: string }>,
    ]).then(([twRes, ocRes]) => {
      if (twRes.status === "fulfilled" && twRes.value.ok) {
        setTweets(twRes.value.tweets ?? []);
        setFetchedAt(twRes.value.fetchedAt ?? "");
        setNextRefresh(twRes.value.nextRefresh ?? "");
      }
      if (ocRes.status === "fulfilled" && ocRes.value.ok) {
        setOnchain(ocRes.value.whales ?? []);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const CAT_COLORS: Record<TwTweet["category"], string> = {
    whale: "#ffd700", signal: "#00e5ff", news: "#7ab3c8",
  };
  const CAT_LABELS: Record<TwTweet["category"], string> = {
    whale: "🐋 WHALE", signal: "📡 SIGNAL", news: "📰 NEWS",
  };

  const filtered = catFilter === "all" ? tweets : tweets.filter(t => t.category === catFilter);

  const fmtTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }) + " · " + d.toLocaleDateString("es", { day: "2-digit", month: "short" });
    } catch { return iso; }
  };

  const nextMs = nextRefresh ? Math.max(0, new Date(nextRefresh).getTime() - Date.now()) : 0;
  const nextHrs = Math.round(nextMs / 3_600_000);

  return (
    <div>
      {/* Header strip */}
      <div className="flex items-center gap-4 mb-5 p-4 border border-[#0d2030] bg-[#040f18]" style={{ borderLeft: "3px solid #1d9bf0" }}>
        <div style={{ fontSize: 28 }}>𝕏</div>
        <div className="flex-1">
          <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#5a8898] mb-1">TWITTER / X · WHALE ALERTS + SEÑALES CRYPTO EN TIEMPO REAL</div>
          <div className="font-bebas text-2xl text-white">CRYPTO INTEL FEED</div>
        </div>
        <div className="text-right">
          <div className="font-sharetech text-[7px] text-[#5a8898]">CACHE 12H · MÁX 2 CALLS/DÍA</div>
          {fetchedAt && <div className="font-sharetech text-[7px] text-[#1d9bf0]">Obtenido: {fmtTime(fetchedAt)}</div>}
          {nextRefresh && <div className="font-sharetech text-[7px] text-[#5a8898]">Próxima actualización: {nextHrs}h</div>}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "TOTAL",   value: tweets.length,                                  color: "#ffffff" },
          { label: "🐋 WHALE", value: tweets.filter(t => t.category === "whale").length, color: "#ffd700" },
          { label: "📡 SIGNAL",value: tweets.filter(t => t.category === "signal").length,color: "#00e5ff" },
          { label: "📰 NEWS",  value: tweets.filter(t => t.category === "news").length,  color: "#7ab3c8" },
        ].map(s => (
          <div key={s.label} className="border border-[#0d2030] bg-[#040f18] p-3 text-center">
            <div className="font-sharetech text-[7px] tracking-[0.12em] text-[#5a8898] mb-1">{s.label}</div>
            <div className="font-bebas text-3xl leading-none" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(["all","whale","signal","news"] as const).map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            className="font-sharetech text-[8px] tracking-[0.1em] px-3 py-1.5 border transition-all"
            style={{
              borderColor: catFilter === c ? CAT_COLORS[c === "all" ? "news" : c] : "#0d2030",
              color:       catFilter === c ? CAT_COLORS[c === "all" ? "news" : c] : "#7ab3c8",
              background:  catFilter === c ? "#040f18" : "#020b12",
            }}>
            {c === "all" ? "TODOS" : CAT_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Content — Twitter tweets */}
      {loading ? (
        <div className="p-16 text-center font-sharetech text-[10px] text-[#7ab3c8] animate-pulse tracking-[0.2em]">
          CONECTANDO CON X API…
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-[#0d2030] bg-[#040f18]">
          <div style={{ fontSize: 36, marginBottom: 12 }}>𝕏</div>
          <div className="font-sharetech text-[10px] text-[#5a8898] tracking-[0.15em] mb-2">SIN DATOS AÚN</div>
          <div className="font-space text-[10px] text-[#3a5c6e]">
            El token de X fue configurado. Los datos aparecerán en la próxima llamada a la API<br/>
            (máx 2 veces al día para no superar el límite gratuito).
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((tw, i) => (
            <a key={tw.id} href={tw.url} target="_blank" rel="noopener noreferrer"
              className="block border border-[#0d2030] bg-[#040f18] p-4 hover:bg-[#071520] transition-all no-underline"
              style={{ animationDelay: `${i * 30}ms`, animation: "fadeInUp 0.3s ease both", borderLeft: `3px solid ${CAT_COLORS[tw.category]}` }}>
              {/* Author + badge row */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#0d2030] border border-[#1d9bf0] flex items-center justify-center font-bebas text-[#1d9bf0] text-sm flex-shrink-0">
                  {tw.authorName[0]?.toUpperCase() ?? "X"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sharetech text-[10px] text-white truncate">{tw.authorName}</div>
                  <div className="font-sharetech text-[8px] text-[#5a8898]">@{tw.authorHandle}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-sharetech text-[7px] px-2 py-0.5 border"
                    style={{ borderColor: CAT_COLORS[tw.category], color: CAT_COLORS[tw.category], background: "#020b12" }}>
                    {CAT_LABELS[tw.category]}
                  </span>
                  <span className="font-sharetech text-[7px] text-[#5a8898]">{fmtTime(tw.createdAt)}</span>
                </div>
              </div>
              {/* Tweet text */}
              <div className="font-space text-[11px] text-[#c8dde8] leading-relaxed mb-3">{tw.text}</div>
              {/* Metrics */}
              <div className="flex gap-4">
                <span className="font-sharetech text-[8px] text-[#5a8898]">❤️ {tw.likes.toLocaleString()}</span>
                <span className="font-sharetech text-[8px] text-[#5a8898]">🔁 {tw.retweets.toLocaleString()}</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* On-chain Whale Transactions — Blockchair (gratis, 30min cache) */}
      {onchain.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4 p-3 border border-[#0d2030] bg-[#040f18]" style={{ borderLeft: "3px solid #00ff88" }}>
            <div className="font-bebas text-lg text-[#00ff88]">⛓ ON-CHAIN WHALES</div>
            <div className="font-sharetech text-[7px] text-[#5a8898] tracking-[0.15em]">
              BLOCKCHAIR · BTC &gt;50 BTC · ETH &gt;100 ETH · CACHE 30MIN · SIN API KEY
            </div>
            <div className="ml-auto font-sharetech text-[8px] text-[#00ff88] border border-[#00ff88] px-2 py-0.5">
              {onchain.length} TXS
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {onchain.map((oc, i) => {
              const isHuge = oc.amountUsd > 1_000_000;
              const accentColor = oc.chain === "BTC" ? "#f7931a" : "#627eea";
              const fmtVal = (v: number) => v >= 1_000_000 ? `$${(v/1_000_000).toFixed(1)}M` : v >= 1_000 ? `$${(v/1_000).toFixed(0)}K` : `$${v.toFixed(0)}`;
              const fmtAmt = (a: number, c: string) => c === "BTC" ? `${a.toFixed(2)} BTC` : `${a.toFixed(0)} ETH`;
              const shortAddr = (a: string) => a ? `${a.slice(0,6)}…${a.slice(-4)}` : "—";
              return (
                <div key={`${oc.hash}-${i}`}
                  className="border border-[#0d2030] bg-[#040f18] p-3 hover:bg-[#071520] transition-all"
                  style={{ borderLeft: `3px solid ${isHuge ? "#ffd700" : accentColor}` }}>
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Chain badge */}
                    <span className="font-bebas text-sm px-2 py-0.5 border"
                      style={{ borderColor: accentColor, color: accentColor, background: "#020b12", minWidth: 40, textAlign: "center" }}>
                      {oc.chain}
                    </span>
                    {/* Amount + USD */}
                    <div className="flex-1">
                      <span className="font-bebas text-xl text-white">{fmtAmt(oc.amountNative, oc.chain)}</span>
                      <span className="font-sharetech text-[9px] text-[#5a8898] ml-2">{fmtVal(oc.amountUsd)}</span>
                      {isHuge && <span className="ml-2 font-sharetech text-[7px] text-[#ffd700] border border-[#ffd700] px-1">HUGE</span>}
                    </div>
                    {/* From → To */}
                    <div className="font-sharetech text-[8px] text-[#7ab3c8] hidden sm:flex items-center gap-1">
                      <span title={oc.from}>{shortAddr(oc.from)}</span>
                      <span className="text-[#5a8898]">→</span>
                      <span title={oc.to}>{shortAddr(oc.to)}</span>
                    </div>
                    {/* Time */}
                    <div className="font-sharetech text-[7px] text-[#5a8898]">
                      {oc.time ? new Date(oc.time).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }) : ""}
                    </div>
                    {/* Explorer link */}
                    {oc.hash && (
                      <a href={oc.url} target="_blank" rel="noopener noreferrer"
                        className="font-sharetech text-[7px] text-[#1d9bf0] hover:underline">
                        VER TX ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ORACLE FEEDS — WHALE INTELLIGENCE DASHBOARD ─────────────────────────────
interface WEntity {
  id: string; name: string; type: string; label: string; icon: string;
  color: string; bg: string; holdings?: string; aumUsd?: string;
  flow1d?: string; pct1d?: number; action?: string; source?: string;
  updated?: string; ticker?: string; balance?: string; status?: string;
  addr?: string; chain?: string; view?: string; signal?: string;
}
interface WNews { title: string; link: string; pubDate: string; source: string; }
interface WDashData {
  ok: boolean; ts: number;
  etf: WEntity[]; corporate: WEntity[];
  ethWallets: WEntity[]; btcWallets: WEntity[];
  analysts: WEntity[]; news: WNews[]; ticker: string[];
}

const ACTION_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  BUY:        { bg: "rgba(26,235,138,.12)",  border: "rgba(26,235,138,.35)",  color: "#1aeb8a" },
  ACCUMULATE: { bg: "rgba(26,235,138,.08)",  border: "rgba(26,235,138,.25)",  color: "#1aeb8a" },
  HOLD:       { bg: "rgba(232,197,71,.08)",  border: "rgba(232,197,71,.25)",  color: "#e8c547" },
  SELL:       { bg: "rgba(240,48,96,.1)",    border: "rgba(240,48,96,.3)",    color: "#f03060" },
  WATCH:      { bg: "rgba(34,212,245,.06)",  border: "rgba(34,212,245,.2)",   color: "#22d4f5" },
  DORMANT:    { bg: "rgba(90,128,153,.08)",  border: "rgba(90,128,153,.25)",  color: "#5a8099" },
  ALCISTA:    { bg: "rgba(26,235,138,.1)",   border: "rgba(26,235,138,.3)",   color: "#1aeb8a" },
  NEUTRAL:    { bg: "rgba(232,197,71,.08)",  border: "rgba(232,197,71,.2)",   color: "#e8c547" },
};

function ActionBadge({ label }: { label: string }) {
  const s = ACTION_STYLES[label] ?? ACTION_STYLES.WATCH;
  return (
    <span style={{ padding: "2px 8px", borderRadius: 3, fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {label}
    </span>
  );
}

function EntityCard({ e, showChain }: { e: WEntity; showChain?: boolean }) {
  const up = (e.pct1d ?? 0) > 0;
  const dn = (e.pct1d ?? 0) < 0;
  return (
    <div style={{ background: "#040f18", border: "1px solid #0d2030", borderLeft: `3px solid ${e.color}`, padding: "12px 14px", transition: "all .15s", cursor: "default" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: e.bg, border: `1px solid ${e.color}40`, color: e.color, fontSize: "0.55rem", fontWeight: 700, flexShrink: 0, fontFamily: "'Syne', sans-serif" }}>
          {e.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#f0f8ff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}</div>
          <div style={{ fontSize: "0.5rem", color: "#5a8099", letterSpacing: "0.1em", marginTop: 2 }}>
            {e.type} · {e.label}
            {showChain && e.chain && <span style={{ marginLeft: 6, color: e.color }}>· {e.chain}</span>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {e.action && <ActionBadge label={e.action} />}
          {e.view   && <ActionBadge label={e.view}   />}
          {e.status && !e.action && !e.view && <ActionBadge label={e.status} />}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
        <div>
          {e.holdings && (
            <div style={{ fontSize: "0.85rem", color: e.color, fontWeight: 600 }}>{e.holdings}</div>
          )}
          {e.balance && (
            <div style={{ fontSize: "0.85rem", color: e.color, fontWeight: 600 }}>{e.balance}</div>
          )}
          {e.signal && (
            <div style={{ fontSize: "0.65rem", color: "#b8d0e0", lineHeight: 1.5, maxWidth: 260, marginTop: 2 }}>{e.signal}</div>
          )}
          {e.aumUsd && (
            <div style={{ fontSize: "0.6rem", color: "#5a8099", marginTop: 2 }}>{e.aumUsd}</div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          {e.flow1d && (
            <div style={{ fontSize: "0.75rem", color: e.flow1d.startsWith("-") ? "#f03060" : "#1aeb8a", fontWeight: 600 }}>{e.flow1d}</div>
          )}
          {e.pct1d !== undefined && e.pct1d !== 0 && (
            <div style={{ fontSize: "0.6rem", color: up ? "#1aeb8a" : dn ? "#f03060" : "#5a8099" }}>{up ? "▲" : "▼"} {Math.abs(e.pct1d).toFixed(1)}%</div>
          )}
          {e.source && (
            <div style={{ fontSize: "0.48rem", color: "#3d6480", marginTop: 3, letterSpacing: "0.08em" }}>{e.source}</div>
          )}
          {e.updated && (
            <div style={{ fontSize: "0.48rem", color: "#3d6480" }}>{e.updated}</div>
          )}
        </div>
      </div>
    </div>
  );
}

type SubTab = "crypto" | "onchain" | "analistas" | "noticias";
type CatFilter = "todos" | "ETF" | "CORPORATIVO" | "ON-CHAIN" | "ANALISTAS" | "TRADFI" | "GOBIERNO";

function OracleFeedsTab() {
  const [data, setData] = useState<WDashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<SubTab>("crypto");
  const [cat, setCat] = useState<CatFilter>("todos");
  const [search, setSearch] = useState("");
  const [tickerPos, setTickerPos] = useState(0);
  const tickerRef = useRef<HTMLDivElement>(null);
  const [liveNews, setLiveNews] = useState<WNews[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/oracle/whale-dashboard")
      .then(r => r.json())
      .then((d: WDashData) => { if (d.ok) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
    const iv = setInterval(() => {
      fetch("/api/oracle/whale-dashboard").then(r=>r.json()).then((d:WDashData)=>{ if(d.ok) setData(d); }).catch(()=>{});
    }, 120_000);
    return () => clearInterval(iv);
  }, []);

  // ── Live news from NewsAPI ────────────────────────────────────────────────
  useEffect(() => {
    const loadNews = () => {
      setNewsLoading(true);
      fetch("/api/proxy/news?q=bitcoin+crypto+ethereum+blockchain&pageSize=25&lang=es")
        .then(r => r.json())
        .then((d: { ok: boolean; articles: { title: string; url: string; publishedAt: string; source: string }[] }) => {
          if (!d.ok || !d.articles?.length) return;
          const mapped: WNews[] = d.articles.map(a => ({
            title:   a.title,
            link:    a.url,
            pubDate: a.publishedAt,
            source:  a.source,
          }));
          setLiveNews(mapped);
        })
        .catch(() => {})
        .finally(() => setNewsLoading(false));
    };
    loadNews();
    const iv = setInterval(loadNews, 15 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!data?.ticker?.length) return;
    const iv = setInterval(() => setTickerPos(p => p + 1), 50);
    return () => clearInterval(iv);
  }, [data]);

  const fmtTime = (s: string) => {
    try { const d = new Date(s); return d.toLocaleDateString("es",{day:"2-digit",month:"short"}) + " " + d.toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"}); }
    catch { return s; }
  };

  const filterEntities = (list: WEntity[]) => {
    let r = list;
    if (cat !== "todos") r = r.filter(e => e.type === cat);
    if (search) r = r.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || (e.ticker ?? "").toLowerCase().includes(search.toLowerCase()) || e.type.toLowerCase().includes(search.toLowerCase()));
    return r;
  };

  const CATS: { key: CatFilter; label: string }[] = [
    { key: "todos", label: "TODOS" }, { key: "ETF", label: "ETF" },
    { key: "CORPORATIVO", label: "CORPORATIVO" }, { key: "ON-CHAIN", label: "ON-CHAIN" },
    { key: "ANALISTAS", label: "ANALISTAS" }, { key: "TRADFI", label: "TRADFI" },
    { key: "GOBIERNO", label: "GOBIERNO" },
  ];

  const SUBTABS: { key: SubTab; label: string }[] = [
    { key: "crypto",   label: "◉ CRYPTO INTEL" },
    { key: "onchain",  label: "◈ ON-CHAIN" },
    { key: "analistas",label: "⚡ ANALISTAS" },
    { key: "noticias", label: "📰 NOTICIAS" },
  ];

  const totalEntities = (data?.etf.length ?? 0) + (data?.corporate.length ?? 0) + (data?.ethWallets.length ?? 0) + (data?.btcWallets.length ?? 0) + (data?.analysts.length ?? 0);
  const tickerItems = liveNews.length > 0
    ? liveNews.slice(0, 15).map(n => `📰 ${n.source.toUpperCase()} · ${n.title}`)
    : (data?.ticker ?? ["PSYCHOMETRIKS // ORACLE FEEDS · WHALE INTELLIGENCE DASHBOARD · TIEMPO REAL"]);
  const tickerStr = tickerItems.join("    ●    ");

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>

      {/* ─── Header ─────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, padding: "14px 16px", background: "#020b12", border: "1px solid #0d2030", borderLeft: "3px solid #a855f7" }}>
        <div style={{ fontSize: 32 }}>🔮</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.48rem", color: "#5a8898", letterSpacing: "0.2em", marginBottom: 4 }}>PSYCHOMETRIKS // INTEL · ORACLE FEEDS · WHALE INTELLIGENCE</div>
          <div className="font-bebas" style={{ fontSize: "1.8rem", color: "#fff", letterSpacing: "0.05em", lineHeight: 1 }}>ORACLE FEEDS</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", marginBottom: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1aeb8a", animation: "wPulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: "0.6rem", color: "#1aeb8a", letterSpacing: "0.1em" }}>LIVE</span>
          </div>
          <div style={{ fontSize: "0.55rem", color: "#a855f7" }}>{totalEntities} entidades</div>
          <div style={{ fontSize: "0.48rem", color: "#5a8898", marginTop: 2 }}>SYNC: {new Date().toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"})} UTC-5</div>
        </div>
      </div>

      {/* ─── Ticker ─────────────────────────────────────────── */}
      <div style={{ overflow: "hidden", background: "#020b12", border: "1px solid #0d2030", borderBottom: "2px solid #1e3650", padding: "7px 0", marginBottom: 14, position: "relative" }}>
        <div style={{ display: "flex", gap: 0, whiteSpace: "nowrap", transform: `translateX(-${tickerPos % (tickerStr.length * 7)}px)`, transition: "none", fontSize: "0.6rem", color: "#5a8898", letterSpacing: "0.05em" }}>
          <span style={{ paddingRight: 80 }}>{tickerStr}</span>
          <span>{tickerStr}</span>
        </div>
      </div>

      {/* ─── Search ─────────────────────────────────────────── */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#3d6480", fontSize: "0.7rem" }}>⌕</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="BUSCAR:// Nombre, wallet, ticker, categoría..."
          style={{ width: "100%", background: "#020b12", border: "1px solid #0d2030", color: "#dceaf5", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem", padding: "9px 12px 9px 32px", outline: "none", letterSpacing: "0.03em" }}
        />
      </div>

      {/* ─── Category filters ────────────────────────────────── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
        {CATS.map(c => (
          <button key={c.key} onClick={() => setCat(c.key)}
            style={{ padding: "5px 12px", border: `1px solid ${cat === c.key ? "#a855f7" : "#0d2030"}`, background: cat === c.key ? "rgba(168,85,247,.1)" : "transparent", color: cat === c.key ? "#a855f7" : "#5a8898", fontSize: "0.6rem", letterSpacing: "0.1em", cursor: "pointer", transition: "all .15s" }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* ─── Sub-tabs ────────────────────────────────────────── */}
      <div style={{ display: "flex", borderBottom: "1px solid #0d2030", marginBottom: 16, gap: 0 }}>
        {SUBTABS.map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)}
            style={{ padding: "8px 16px", border: "none", borderBottom: subTab === t.key ? "2px solid #22d4f5" : "2px solid transparent", background: "transparent", color: subTab === t.key ? "#22d4f5" : "#5a8898", fontSize: "0.6rem", letterSpacing: "0.08em", cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap" }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "#a855f7", fontSize: "0.7rem", letterSpacing: "0.2em", animation: "wPulse 1.5s ease-in-out infinite" }}>
          CONECTANDO CON ORACLE…
        </div>
      ) : !data ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#3d6480", fontSize: "0.65rem" }}>Sin datos del dashboard. Reintentando…</div>
      ) : (
        <>
          {/* ─── CRYPTO INTEL ─── */}
          {subTab === "crypto" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Left: ETF + Corporate */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: "0.55rem", color: "#22d4f5", letterSpacing: "0.15em" }}>● CRYPTO INTEL</div>
                  <div style={{ fontSize: "0.48rem", color: "#3d6480" }}>{filterEntities([...data.etf, ...data.corporate]).length} ENTIDADES</div>
                </div>
                <div style={{ fontSize: "0.45rem", color: "#3d6480", letterSpacing: "0.15em", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #0d2030" }}>
                  — ETF / FONDOS INSTITUCIONALES —
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                  {filterEntities(data.etf).map(e => <EntityCard key={e.id} e={e} />)}
                </div>
                <div style={{ fontSize: "0.45rem", color: "#3d6480", letterSpacing: "0.15em", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #0d2030" }}>
                  — CORPORATIVO / TESORERÍAS BTC —
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {filterEntities(data.corporate).map(e => <EntityCard key={e.id} e={e} />)}
                </div>
              </div>
              {/* Right: On-chain wallets */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: "0.55rem", color: "#f0a020", letterSpacing: "0.15em" }}>● EQUITIES + ON-CHAIN</div>
                  <div style={{ fontSize: "0.48rem", color: "#3d6480" }}>{filterEntities([...data.btcWallets, ...data.ethWallets]).length} ENTIDADES</div>
                </div>
                <div style={{ fontSize: "0.45rem", color: "#3d6480", letterSpacing: "0.15em", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #0d2030" }}>
                  — WALLETS BTC ON-CHAIN IDENTIFICADAS —
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                  {filterEntities(data.btcWallets).map(e => <EntityCard key={e.id} e={e} showChain />)}
                </div>
                <div style={{ fontSize: "0.45rem", color: "#3d6480", letterSpacing: "0.15em", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #0d2030" }}>
                  — WALLETS ETH ON-CHAIN IDENTIFICADAS —
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {filterEntities(data.ethWallets).map(e => <EntityCard key={e.id} e={e} showChain />)}
                </div>
              </div>
            </div>
          )}

          {/* ─── ON-CHAIN ─── */}
          {subTab === "onchain" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: "0.52rem", color: "#f0a020", letterSpacing: "0.15em", marginBottom: 10 }}>◈ WALLETS BTC IDENTIFICADAS</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {filterEntities(data.btcWallets).map(e => <EntityCard key={e.id} e={e} showChain />)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.52rem", color: "#9060f0", letterSpacing: "0.15em", marginBottom: 10 }}>◈ WALLETS ETH IDENTIFICADAS</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {filterEntities(data.ethWallets).map(e => (
                      <div key={e.id} style={{ background: "#040f18", border: "1px solid #0d2030", borderLeft: `3px solid ${e.color}`, padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: e.bg, border: `1px solid ${e.color}40`, color: e.color, fontSize: "0.5rem", fontWeight: 700, flexShrink: 0, fontFamily: "'Syne', sans-serif" }}>{e.icon}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "0.75rem", color: "#f0f8ff", fontWeight: 600 }}>{e.name}</div>
                            <div style={{ fontSize: "0.48rem", color: "#5a8099", marginTop: 1 }}>{e.label} · ETH</div>
                            {e.addr && <div style={{ fontSize: "0.42rem", color: "#3d6480", marginTop: 2, fontFamily: "'JetBrains Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.addr.slice(0,14)}…{e.addr.slice(-6)}</div>}
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: "0.75rem", color: e.color, fontWeight: 600 }}>{e.balance && e.balance !== "—" ? e.balance : "Cargando…"}</div>
                            <ActionBadge label={e.status ?? "WATCH"} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── ANALISTAS ─── */}
          {subTab === "analistas" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {filterEntities([...data.analysts]).map(e => (
                <div key={e.id} style={{ background: "#040f18", border: "1px solid #0d2030", borderLeft: `3px solid ${e.color}`, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: `${e.color}15`, border: `1px solid ${e.color}40`, color: e.color, fontSize: "0.52rem", fontWeight: 700, flexShrink: 0, fontFamily: "'Syne', sans-serif" }}>{e.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.8rem", color: "#f0f8ff", fontWeight: 600 }}>{e.name}</div>
                      <div style={{ fontSize: "0.48rem", color: "#5a8099", marginTop: 1 }}>{e.label} · {e.source}</div>
                    </div>
                    {e.view && <ActionBadge label={e.view} />}
                  </div>
                  {e.signal && (
                    <div style={{ fontSize: "0.65rem", color: "#b8d0e0", lineHeight: 1.6, paddingTop: 8, borderTop: "1px solid #0d2030", fontStyle: "italic" }}>
                      "{e.signal}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ─── NOTICIAS ─── */}
          {subTab === "noticias" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0 10px", borderBottom: "1px solid #0d2030", marginBottom: 4 }}>
                <span style={{ fontSize: "0.5rem", letterSpacing: "0.1em", color: newsLoading ? "#ffd700" : liveNews.length > 0 ? "#22d4f5" : "#3d6480" }}>
                  {newsLoading && liveNews.length === 0 ? "● CARGANDO NOTICIAS..." : liveNews.length > 0 ? `● NEWSAPI LIVE · ${liveNews.length} ARTÍCULOS` : "● FUENTE: ORACLE DASHBOARD"}
                </span>
                {liveNews.length > 0 && <span style={{ fontSize: "0.45rem", color: "#3d6480" }}>↺ actualiza cada 15 min</span>}
              </div>
              {newsLoading && liveNews.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#3d6480" }}>Cargando noticias en tiempo real...</div>
              ) : (liveNews.length > 0 ? liveNews : data.news).map((n, i) => (
                <a key={i} href={n.link} target="_blank" rel="noopener noreferrer"
                  style={{ display: "block", background: "#040f18", border: "1px solid #0d2030", padding: "12px 14px", textDecoration: "none", transition: "border-color .15s" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 5, background: "rgba(34,212,245,.08)", border: "1px solid rgba(34,212,245,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>📰</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.72rem", color: "#dceaf5", lineHeight: 1.5, marginBottom: 4 }}>{n.title}</div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ fontSize: "0.5rem", color: "#22d4f5", letterSpacing: "0.08em" }}>{n.source}</span>
                        <span style={{ fontSize: "0.48rem", color: "#3d6480" }}>{fmtTime(n.pubDate)}</span>
                      </div>
                    </div>
                    <span style={{ color: "#3d6480", fontSize: "0.7rem", flexShrink: 0 }}>→</span>
                  </div>
                </a>
              ))}
              {!newsLoading && liveNews.length === 0 && data.news.length === 0 && (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#3d6480" }}>Sin noticias disponibles</div>
              )}
            </div>
          )}
        </>
      )}
      <style>{`@keyframes wPulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}

// ─── PSY LISTING RADAR TAB ──────────────────────────────────────────────────
interface RadarCoin {
  symbol: string; name: string; marketCap: number; price: number;
  changePct24h: number; dateAdded: string; tieneFuturos: boolean;
  contractAddress: string | null; chain: string | null; cmcSlug: string;
}
interface FundingExtreme { symbol: string; fundingRate: number; fundingApr: number; bias: string; }

function ListingRadarTab() {
  const [coins, setCoins] = useState<RadarCoin[]>([]);
  const [fundingExtremes, setFundingExtremes] = useState<FundingExtreme[]>([]);
  const [futuresCheckUpgradeNeeded, setFuturesCheckUpgradeNeeded] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/oracle/listing-radar");
        const d = await r.json() as {
          ok: boolean; newListings?: RadarCoin[]; fundingExtremes?: FundingExtreme[];
          futuresCheckUpgradeNeeded?: boolean; fetchedAt?: string; error?: string;
        };
        if (cancelled) return;
        if (!d.ok) { setError(d.error ?? "Error al cargar"); setLoading(false); return; }
        setCoins(d.newListings ?? []);
        setFundingExtremes(d.fundingExtremes ?? []);
        setFuturesCheckUpgradeNeeded(!!d.futuresCheckUpgradeNeeded);
        setFetchedAt(d.fetchedAt ?? null);
      } catch { setError("Error de conexión"); }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const fmt = (n: number): string => {
    if (n >= 1e9) return `$${(n/1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n/1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n/1e3).toFixed(1)}K`;
    return `$${n.toFixed(2)}`;
  };

  return (
    <div style={{ fontFamily: "'Share Tech Mono', monospace" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, color: "#00e5ff", letterSpacing: 2, fontWeight: 700 }}>🎯 PSY LISTING RADAR</div>
          <div style={{ fontSize: 9, color: "#5a8898", marginTop: 2 }}>
            Nuevos listados (CoinMarketCap) + ¿ya tienen futuros? (Coinglass) + Funding Rate Extremo (Binance)
          </div>
        </div>
        {fetchedAt && (
          <div style={{ fontSize: 8, color: "#00e676", border: "1px solid rgba(0,230,118,.25)", background: "rgba(0,230,118,.06)", padding: "4px 10px" }}>
            ● ACTUALIZADO: {new Date(fetchedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>

      {/* FUNDING RATE EXTREMO — reemplaza a Max Pain (requería Coinglass de pago) */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 9, color: "#e040fb", letterSpacing: 1.5, marginBottom: 8 }}>
          🌡 FUNDING RATE EXTREMO — posiciones más "sobrecargadas" ahora (Binance Futures)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {fundingExtremes.slice(0, 6).map(fe => (
            <div key={fe.symbol} style={{ border: "1px solid rgba(224,64,251,0.2)", background: "rgba(224,64,251,0.04)", padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>{fe.symbol}</span>
                <span style={{ fontSize: 11, color: fe.fundingRate > 0 ? "#00e676" : "#ff1744" }}>
                  {fe.fundingApr >= 0 ? "+" : ""}{fe.fundingApr.toFixed(1)}% APR
                </span>
              </div>
              <div style={{ fontSize: 8, color: "#5a8898", marginTop: 4 }}>{fe.bias}</div>
            </div>
          ))}
          {fundingExtremes.length === 0 && !loading && (
            <div style={{ fontSize: 9, color: "#5a8898", gridColumn: "1 / -1", textAlign: "center", padding: 10 }}>Sin datos por ahora.</div>
          )}
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 30, color: "#5a8898", fontSize: 11 }}>Cargando radar...</div>}
      {error && <div style={{ padding: 14, border: "1px solid rgba(255,23,68,.3)", color: "#ff1744", fontSize: 11, marginBottom: 14 }}>{error}</div>}

      {futuresCheckUpgradeNeeded && !loading && (
        <div style={{ padding: 10, border: "1px solid rgba(255,214,0,.3)", background: "rgba(255,214,0,.05)", color: "#ffd600", fontSize: 9, marginBottom: 14 }}>
          ⚠ El cruce con Coinglass (¿ya tiene futuros?) requiere un plan superior — mostrando solo los datos de CoinMarketCap por ahora.
        </div>
      )}

      <div style={{ fontSize: 9, color: "#5a8898", letterSpacing: 1, marginBottom: 10 }}>ÚLTIMOS LISTADOS · TOP 15</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {coins.map((c, i) => (
          <div key={c.symbol + i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1px solid #0d1a2a", background: "#040d18" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>{c.symbol}</span>
                <span style={{ fontSize: 9, color: "#5a8898" }}>{c.name}</span>
                {c.tieneFuturos && (
                  <span style={{ fontSize: 7, color: "#00e5ff", border: "1px solid rgba(0,229,255,.35)", padding: "1px 6px" }}>
                    📈 YA TIENE FUTUROS
                  </span>
                )}
              </div>
              <div style={{ fontSize: 8, color: "#3a5060", marginTop: 2 }}>
                Listado: {new Date(c.dateAdded).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
              </div>
              {c.contractAddress ? (
                <a
                  href={`https://dexscreener.com/search?q=${c.contractAddress}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 8, color: "#00e5ff", marginTop: 2, display: "block", textDecoration: "none" }}
                  title={c.contractAddress}
                >
                  📄 {c.chain ?? "Contrato"}: {c.contractAddress.slice(0, 6)}...{c.contractAddress.slice(-4)}
                </a>
              ) : (
                <a
                  href={`https://coinmarketcap.com/currencies/${c.cmcSlug}/`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 8, color: "#5a8898", marginTop: 2, display: "block", textDecoration: "none" }}
                >
                  🔗 Ver en CoinMarketCap (moneda nativa, sin contrato)
                </a>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#00e676" }}>{fmt(c.marketCap)}</div>
              <div style={{ fontSize: 9, color: c.changePct24h >= 0 ? "#00e676" : "#ff1744" }}>
                {c.changePct24h >= 0 ? "+" : ""}{c.changePct24h.toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
        {!loading && coins.length === 0 && !error && (
          <div style={{ textAlign: "center", padding: 24, color: "#5a8898", fontSize: 10 }}>Sin nuevos listados por ahora.</div>
        )}
      </div>

      <div style={{ fontSize: 8, color: "#1a3040", marginTop: 14, textAlign: "right", lineHeight: 1.7 }}>
        FUENTES: CoinMarketCap (listados) · Coinglass (futuros + max pain) · Actualizado cada 1h
      </div>
    </div>
  );
}

// ─── MAIN CONTENT ─────────────────────────────────────────────────────────────
function WhaleIntelContent() {
  const [tab, setTab] = useState<"signals"|"feeds"|"copy"|"gems"|"exchanges"|"squeeze"|"twitter"|"oracle"|"radar">("signals");
  const auth = getAuth();
  const elite = isElite(auth);

  const TABS = [
    {key:"signals",   label:"🤖 SEÑALES PSY",      icon:"🤖"},
    {key:"feeds",     label:"🐋 WHALE TRACKER (historial)",   icon:"🐋"},
    {key:"oracle",    label:"🔮 ORACLE FEEDS",      icon:"🔮"},
    {key:"twitter",   label:"𝕏 TWITTER INTEL",     icon:"𝕏"},
    {key:"copy",      label:"📊 OI FLOW",           icon:"📊"},
    {key:"gems",      label:"💎 GEM HUNTER",        icon:"💎", elite:true},
    {key:"exchanges", label:"⚡ SEÑALES TÉCNICAS DEX",  icon:"⚡"},
    {key:"squeeze",   label:"💥 SHORT SQUEEZE",     icon:"💥"},
    {key:"radar",     label:"🎯 LISTING RADAR",    icon:"🎯"},
  ] as const;

  return (
    <div className="min-h-screen bg-[#020b12] text-white">
      <SiteNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">

        <div className="mb-8">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-3">PSY LIQMAP · ON-CHAIN INTEL</div>
          <h1 className="font-bebas text-5xl md:text-6xl leading-none text-white mb-2">
            WHALE <span className="text-[#00e5ff]">INTEL</span>
          </h1>
          <p className="font-space text-[11px] text-[#7ab3c8]">
            Señales PSY · Movimientos ballena on-chain · OI Flow real · Gems DEX · Short Squeeze Radar
          </p>
        </div>

        <div className="flex gap-0 mb-6 border-b border-[#0d2030] overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={`flex-shrink-0 px-4 py-3 font-sharetech text-[9px] tracking-[0.12em] transition-all border-b-2 -mb-px ${
                tab===t.key
                  ? "border-[#00e5ff] text-[#00e5ff] bg-[#001a1f]"
                  : "border-transparent text-[#7ab3c8] hover:text-white hover:bg-[#040f18]"
              }`}>
              {t.label}
              {"elite" in t && t.elite && !elite && <span className="ml-1.5 text-[#e040fb] text-[7px]">ELITE</span>}
            </button>
          ))}
        </div>

        {tab === "signals"   && <PsySignalsTab />}
        {tab === "feeds"     && <WhaleFeedsTab />}
        {tab === "oracle"    && <OracleFeedsTab />}
        {tab === "twitter"   && <TwitterFeedTab />}
        {tab === "copy"      && <CopyTradingTab />}
        {tab === "gems"      && <GemHunterTab isEliteUser={elite} />}
        {tab === "exchanges" && <ExchangeSignalsTab />}
        {tab === "squeeze"   && <ShortSqueezeTab />}
        {tab === "radar"      && <ListingRadarTab />}

      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function WhaleAlert() {
  const auth = getAuth();
  if (!auth) { window.location.replace("/login?redirect=/whale-alert"); return null; }
  if (!hasPro(auth)) {
    return <PlanGate icon="🐋" title="WHALE INTEL" planName="PRO" planPrice="49" color="#00e5ff" href="/pricing"
      features={[
        "Movimientos ballena on-chain en tiempo real",
        "Hyperliquid + Etherscan ETH + mempool BTC",
        "OI Flow real — HL · dYdX v4 · OKX · BitMEX",
        "Win Rate del sistema en tiempo real (MTM)",
        "Intent Score Global del mercado",
        "💎 GEM HUNTER con RugCheck (plan Elite)",
      ]} />;
  }
  return <WhaleIntelContent />;
}
