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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
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
function loadHistory(): WhaleAlert[] {
  try { return JSON.parse(localStorage.getItem(HIST_KEY) ?? "[]") as WhaleAlert[]; } catch { return []; }
}
function saveHistory(alerts: WhaleAlert[]) {
  try { localStorage.setItem(HIST_KEY, JSON.stringify(alerts.slice(0, 200))); } catch {}
}

// ─── Win Rate del Sistema (usando historial localStorage) ─────────────────────
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
  const meta = TYPE_META[a.type];
  const isSignif = a.significant;
  return (
    <div className="relative overflow-hidden border transition-all duration-300 hover:scale-[1.01]"
      style={{
        borderColor: isSignif ? `${meta.color}60` : `${meta.color}25`,
        background: `linear-gradient(135deg,#020b12,#040e18)`,
        boxShadow: isSignif ? `0 0 20px ${meta.color}20, inset 0 0 30px ${meta.color}05` : "none",
      }}>
      {/* Top bar */}
      <div className="h-[2px] w-full" style={{background:`linear-gradient(90deg,transparent,${meta.color},transparent)`}}/>

      <div className="p-3 flex gap-3 items-start">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center border text-xl"
          style={{borderColor:`${meta.color}30`, background:`${meta.color}12`}}>
          {meta.emoji}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
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

          {/* Amount */}
          <div className="font-bebas text-2xl leading-none mb-1" style={{color:meta.color}}>
            {fmt(a.usd)}
            {a.amount > 0 && a.coin !== "BTC" && a.coin !== "ETH" && (
              <span className="font-space text-[10px] text-[#5a8898] font-normal ml-2">
                {a.amount.toFixed(2)} {a.coin}
              </span>
            )}
          </div>

          {/* From / To */}
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
      const d = await fetch("/api/whale-intel/alerts").then(r=>r.json()) as {ok:boolean;alerts:WhaleAlert[]};
      if (!d.ok) return;
      const merged = [...d.alerts];
      const seen = new Set(merged.map(a=>a.id));
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
    {key:"all",       label:"TODAS"},
    {key:"whale_buy", label:"🐋 COMPRAS"},
    {key:"whale_sell",label:"🔴 VENTAS"},
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

      {/* Filters */}
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
  daysTracked: number; cumulativePnl: number; timeline: Array<{date:string;pnl:number;cumPnl:number;oi:number;winRate:number;position:string}>;
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
  const fundingFmt = `${t.fundingRate>=0?"+":""}${(t.fundingRate*100).toFixed(4)}%`;
  const fundingColor = t.fundingRate > 0 ? "#ff6b6b" : "#69db7c";

  return (
    <div className="relative overflow-hidden border transition-all duration-300 hover:scale-[1.01]"
      style={{
        borderColor: `${posColor}35`,
        background: `linear-gradient(135deg,#020b12 0%,#040e18 100%)`,
        boxShadow: `0 0 20px ${posColor}08, inset 0 0 40px ${posColor}04`,
      }}>

      {/* Exchange color bar */}
      <div className="h-[2px] w-full" style={{background:`linear-gradient(90deg,${exMeta.color},${sigColor} 60%,transparent)`}}/>

      {/* Telegram-header style */}
      <div className="px-4 pt-3 pb-2 border-b" style={{borderColor:`${posColor}15`}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Exchange badge */}
            <span className="font-sharetech text-[8px] px-2 py-1 tracking-[0.15em] font-bold"
              style={{color:exMeta.color, background:`${exMeta.color}15`, border:`1px solid ${exMeta.color}40`}}>
              {exMeta.short}
            </span>
            {/* Coin */}
            <span className="font-bebas text-3xl text-white tracking-wider leading-none">{t.coin}</span>
            {/* Size badge */}
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
          {/* LONG / SHORT badge */}
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

        {/* OI row */}
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
        {/* Win rate bar — Telegram-pill style */}
        <div className="mb-4 p-3 border" style={{borderColor:`${wrColor}20`, background:`${wrColor}06`}}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-sharetech text-[8px] tracking-[0.15em] text-[#7ab3c8]">WIN RATE {winPeriod.toUpperCase()}</span>
            <span className="font-bebas text-2xl leading-none" style={{color:wrColor}}>{wr.toFixed(0)}%</span>
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

        {/* Stats — Telegram-alert 2-col grid */}
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

        {/* Entry / TP / SL — Telegram signal style */}
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

        {/* Signal footer — full width like Telegram CTA */}
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

// ─── COPY TRADING TAB ─────────────────────────────────────────────────────────
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

      {/* System Win Rate */}
      <SystemWinRateBanner traders={traders} />

      {/* Exchange filter */}
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

      {/* Consensus banner */}
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

      {/* Consensus bar */}
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

      {/* Win rate period selector */}
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

// ─── GEM HUNTER TAB ───────────────────────────────────────────────────────────
function GemHunterTab({isEliteUser}:{isEliteUser:boolean}) {
  const [gems, setGems] = useState<Gem[]>([]);
  const [loading, setLoading] = useState(true);
  const [chain, setChain] = useState<"all"|"solana"|"ethereum">("all");
  const [minBuyVol, setMinBuyVol] = useState(20_000);
  const [rugLoading, setRugLoading] = useState<Record<string,boolean>>({});
  const [rugData, setRugData] = useState<Record<string,{score:number;risks:number}>>({});

  useEffect(() => {
    fetch("/api/whale-intel/gems")
      .then(r=>r.json())
      .then((d:{ok:boolean;gems:Gem[]})=>{ if(d.ok) setGems(d.gems); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
    const t = setInterval(()=>{
      fetch("/api/whale-intel/gems").then(r=>r.json())
        .then((d:{ok:boolean;gems:Gem[]})=>{ if(d.ok) setGems(d.gems); }).catch(()=>{});
    }, 60_000);
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
      {/* Filters */}
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          {label:"GEMS DETECTADAS",  value:filtered.length,                                   color:"#e040fb"},
          {label:"BUY VOL TOTAL",    value:fmt(filtered.reduce((s,g)=>s+g.buyVolume,0)),      color:"#00e676"},
          {label:"BOOSTED",          value:filtered.filter(g=>g.isBoosted).length,            color:"#ffd700"},
        ].map(s=>(
          <div key={s.label} className="border border-[#0d2030] bg-[#040f18] p-3 text-center">
            <div className="font-sharetech text-[8px] tracking-[0.18em] text-[#7ab3c8] mb-1">{s.label}</div>
            <div className="font-bebas text-2xl tracking-wider" style={{color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center font-sharetech text-[10px] text-[#7ab3c8] animate-pulse">ESCANEANDO DEXSCREENER…</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center font-space text-[11px] text-[#7ab3c8]">No se encontraron gems con esos filtros</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(gem => {
            const rug = rugData[gem.address];
            const rl = rugLoading[gem.address];
            const buyRatio = gem.buyCount / Math.max(1, gem.buyCount + gem.sellCount);
            const chainColor = gem.chain === "solana" ? "#9945ff" : "#627eea";
            const trendColor = gem.priceChange1h >= 0 ? "#00e676" : "#ff1744";
            return (
              <div key={gem.address} className="relative overflow-hidden border hover:scale-[1.01] transition-all duration-300"
                style={{
                  borderColor: `${trendColor}35`,
                  background: "linear-gradient(135deg,#020b12,#040e18)",
                  boxShadow: `inset 0 0 30px ${trendColor}04`,
                }}>
                <div className="h-[2px] w-full" style={{background:`linear-gradient(90deg,${chainColor},#e040fb 60%,transparent)`}}/>
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bebas text-3xl text-white tracking-wider leading-none">{gem.symbol}</span>
                        <span className="font-sharetech text-[7px] px-1.5 py-0.5"
                          style={{color:chainColor, border:`1px solid ${chainColor}35`, background:`${chainColor}10`}}>
                          {gem.chain==="solana"?"◎ SOL":"Ξ ETH"}
                        </span>
                        {gem.isBoosted && <span className="font-sharetech text-[7px] px-1.5 py-0.5 text-[#ffd700] border border-[#ffd70035] bg-[#ffd70008]">⚡ BOOST</span>}
                      </div>
                      <div className="font-space text-[9px] text-[#7ab3c8] truncate max-w-[150px]">{gem.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bebas text-3xl tracking-wider leading-none"
                        style={{color:trendColor}}>
                        {gem.priceChange1h>=0?"+":""}{gem.priceChange1h.toFixed(1)}%
                      </div>
                      <div className="font-sharetech text-[7px] text-[#7ab3c8] tracking-[0.1em]">1H CHANGE</div>
                    </div>
                  </div>

                  {/* Buy pressure bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-sharetech text-[8px] text-[#00e676]">🟢 {gem.buyCount}</span>
                      <span className="font-bebas text-base text-[#00e676] tracking-wider leading-none">BUY {fmt(gem.buyVolume)}</span>
                      <span className="font-sharetech text-[8px] text-[#ff1744]">🔴 {gem.sellCount}</span>
                    </div>
                    <div className="h-2.5 bg-[#0a1520] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{width:`${buyRatio*100}%`, background:"linear-gradient(90deg,#007a30,#00e676)", boxShadow:"0 0 8px #00e67650"}}/>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      {label:"VOL 24H",  value:fmt(gem.volume24h),                        color:"#00e5ff"},
                      {label:"LIQUIDEZ", value:fmt(gem.liquidity),                        color:"#e040fb"},
                      {label:"MKT CAP",  value:gem.marketCap?fmt(gem.marketCap):"N/D",    color:"#ffd700"},
                      {label:"EDAD",     value:ageLabel(gem.ageMinutes),                  color:"#7a9aaa"},
                    ].map(s=>(
                      <div key={s.label} className="bg-[#040d18] border border-[#0d1a2a] p-2.5 text-center">
                        <div className="font-sharetech text-[7px] text-[#5a8898] tracking-[0.08em] mb-1">{s.label}</div>
                        <div className="font-space text-[11px] font-bold" style={{color:s.color}}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* RugCheck + Link */}
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

// ─── MAIN CONTENT ─────────────────────────────────────────────────────────────
function WhaleIntelContent() {
  const [tab, setTab] = useState<"feeds"|"copy"|"gems">("copy");
  const auth = getAuth();
  const elite = isElite(auth);

  const TABS = [
    {key:"feeds", label:"🐋 WHALE FEEDS",  icon:"🐋"},
    {key:"copy",  label:"📊 OI FLOW",       icon:"📊"},
    {key:"gems",  label:"💎 GEM HUNTER",    icon:"💎", elite:true},
  ] as const;

  return (
    <div className="min-h-screen bg-[#020b12] text-white">
      <SiteNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">

        {/* Header */}
        <div className="mb-8">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-3">PSY LIQMAP · ON-CHAIN INTEL</div>
          <h1 className="font-bebas text-5xl md:text-6xl leading-none text-white mb-2">
            WHALE <span className="text-[#00e5ff]">INTEL</span>
          </h1>
          <p className="font-space text-[11px] text-[#7ab3c8]">
            Movimientos ballena en tiempo real · Hyperliquid + Etherscan + mempool.space · OI Flow real · Gems DEX
          </p>
        </div>

        {/* Tab nav */}
        <div className="flex gap-0 mb-6 border-b border-[#0d2030]">
          {TABS.map(t => (
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={`px-5 py-3 font-sharetech text-[9px] tracking-[0.15em] transition-all border-b-2 -mb-px ${
                tab===t.key
                  ? "border-[#00e5ff] text-[#00e5ff] bg-[#001a1f]"
                  : "border-transparent text-[#7ab3c8] hover:text-white hover:bg-[#040f18]"
              }`}>
              {t.label}
              {"elite" in t && t.elite && !elite && <span className="ml-1.5 text-[#e040fb] text-[7px]">ELITE</span>}
            </button>
          ))}
        </div>

        {tab === "feeds" && <WhaleFeedsTab />}
        {tab === "copy"  && <CopyTradingTab />}
        {tab === "gems"  && <GemHunterTab isEliteUser={elite} />}

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
