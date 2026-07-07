import React, { useState, useEffect, useCallback, useRef } from "react";
import SiteNav from "@/components/site-nav";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Price  { price: number | null; source: string; symbol: string; timestamp: number }
interface Sentiment { btc_dominance: number; active_cryptos: number; fear_greed_7d: { date: string; label: string; value: number }[] }
interface Whale  { chain: string; from: string; hash: string; timestamp: number; to: string; value: number; value_usd: number }
interface NewsItem { link: string; pubDate: string; source: string; title: string }
interface Miner  { btc_held: number; hash_rate: string; name: string; ticker: string }
interface Treasury { btc: string; entity: string; usd: string }
interface FG          { value: string; value_classification: string; timestamp: string }
interface DLProtocol  { name: string; tvl: number; category: string; chain: string; logo: string | null; change_1d: number | null; change_7d: number | null }
interface DLTvl       { date: number; tvl: number }
interface DLData      { protocols: DLProtocol[]; tvlHistory: DLTvl[]; totalTvl: number }
interface SIHolding    { nameOfIssuer: string; cusip: string; value: number; shares: number }
interface SuperInvestor {
  cik: string; name: string; fund: string; ok: boolean;
  periodOfReport: string | null; filedAt: string | null; holdings: SIHolding[];
}

// ─── Constants ───────────────────────────────────────────────────────────────
const C = {
  bg:     "#020406", bg2:  "#050d14", bg3: "#080f18",
  panel:  "#060e16", border: "#0d1f2d", border2: "#122030",
  cyan:   "#00e5ff", green: "#00ff88", red: "#ff1744",
  yellow: "#ffd600", gold:  "#ffab00", purple: "#7c4dff",
  text:   "#c8dde8", text2: "#8ab8cc", text3: "#4a6070",
};

const FG_COLORS: Record<string, string> = {
  "Extreme Fear": "#ff1744", "Fear": "#ff6d00",
  "Neutral": "#ffd600", "Greed": "#00c853", "Extreme Greed": "#00ff88",
};

function fmtUSD(n: number): string {
  if (n >= 1e9)  return "$" + (n / 1e9).toFixed(2)  + "B";
  if (n >= 1e6)  return "$" + (n / 1e6).toFixed(2)  + "M";
  if (n >= 1e3)  return "$" + (n / 1e3).toFixed(1)  + "K";
  return "$" + n.toFixed(2);
}
function fmtBTC(n: number): string {
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K BTC";
  return n.toFixed(2) + " BTC";
}
function timeAgo(ts: number): string {
  const d = Math.floor((Date.now() / 1000) - ts);
  if (d < 60)    return `hace ${d}s`;
  if (d < 3600)  return `hace ${Math.floor(d / 60)}m`;
  if (d < 86400) return `hace ${Math.floor(d / 3600)}h`;
  return `hace ${Math.floor(d / 86400)}d`;
}
function fmtDate(pub: string): string {
  try { return new Date(pub).toLocaleString("es-MX", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return pub.slice(0, 16); }
}

// ─── Pulse dot ───────────────────────────────────────────────────────────────
function Pulse({ color = C.green }: { color?: string }) {
  return (
    <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:color,
      boxShadow:`0 0 6px ${color}`, animation:"blink 1.5s ease-in-out infinite" }} />
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function OracleFeeds() {
  const [prices,     setPrices]     = useState<Record<string, Price> | null>(null);
  const [sentiment,  setSentiment]  = useState<Sentiment | null>(null);
  const [whales,     setWhales]     = useState<Whale[]>([]);
  const [news,       setNews]       = useState<NewsItem[]>([]);
  const [miners,     setMiners]     = useState<Miner[]>([]);
  const [treasuries, setTreasuries] = useState<Treasury[]>([]);
  const [fg,         setFg]         = useState<FG[]>([]);
  const [defillama,  setDefillama]  = useState<DLData | null>(null);
  const [superInvestors, setSuperInvestors] = useState<SuperInvestor[]>([]);
  const [newsExt,    setNewsExt]    = useState<NewsItem[]>([]);
  const [status,     setStatus]     = useState<Record<string, string>>({});
  const [activeTab,  setActiveTab]  = useState<"whales"|"news"|"newsext"|"miners"|"treasury"|"defi"|"superinvestors">("whales");
  const [lastUp,     setLastUp]     = useState(Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch$ = useCallback(async (path: string) => {
    const r = await fetch(path);
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  }, []);

  const loadAll = useCallback(async () => {
    const [p, s, w, n, m, t, f, st, dl, ne] = await Promise.allSettled([
      fetch$("/api/oracle/prices"),
      fetch$("/api/oracle/sentiment"),
      fetch$("/api/oracle/whales"),
      fetch$("/api/oracle/news"),
      fetch$("/api/oracle/miners"),
      fetch$("/api/oracle/treasuries"),
      fetch$("/api/oracle/fear_greed"),
      fetch$("/api/oracle/status"),
      fetch$("/api/oracle/defillama"),
      fetch$("/api/oracle/news_extended"),
    ]);
    if (p.status === "fulfilled") setPrices(p.value);
    if (s.status === "fulfilled") setSentiment(s.value);
    if (w.status === "fulfilled") setWhales(Array.isArray(w.value) ? w.value : []);
    if (n.status === "fulfilled") setNews(Array.isArray(n.value) ? n.value.slice(0, 20) : []);
    if (m.status === "fulfilled") setMiners(Array.isArray(m.value) ? m.value : []);
    if (t.status === "fulfilled") setTreasuries(Array.isArray(t.value) ? t.value.slice(0, 15) : []);
    if (f.status === "fulfilled") setFg(Array.isArray(f.value) ? f.value : []);
    if (st.status === "fulfilled" && (st.value as { last_updated?: Record<string, string> }).last_updated)
      setStatus((st.value as { last_updated: Record<string, string> }).last_updated);
    if (dl.status === "fulfilled" && dl.value && (dl.value as DLData).protocols) setDefillama(dl.value as DLData);
    if (ne.status === "fulfilled") setNewsExt(Array.isArray(ne.value) ? ne.value.slice(0, 30) : []);
    setLastUp(Date.now());
  }, [fetch$]);

  useEffect(() => {
    loadAll();
    tickRef.current = setInterval(loadAll, 60_000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [loadAll]);

  // Superinversores (13F) — cambia trimestralmente, no hace falta refrescar
  // cada 60s como el resto; se pide una sola vez al entrar a la página.
  useEffect(() => {
    fetch$("/api/oracle/superinvestors")
      .then((d: { ok: boolean; investors?: SuperInvestor[] }) => {
        if (d.ok && d.investors) setSuperInvestors(d.investors);
      })
      .catch(() => {});
  }, [fetch$]);

  const s  = { fontFamily: "'Share Tech Mono', monospace" } as const;
  const so = { fontFamily: "'Orbitron', monospace" } as const;
  const rb = { fontFamily: "'Rajdhani', sans-serif" } as const;

  const currentFG = fg[0];
  const fgColor   = currentFG ? (FG_COLORS[currentFG.value_classification] ?? C.yellow) : C.text3;
  const fgVal     = currentFG ? parseInt(currentFG.value) : null;

  const tabs: { key: typeof activeTab; label: string; icon: string; count?: number }[] = [
    { key:"whales",  icon:"🐋", label:"WHALE ALERTS",   count: whales.length  },
    { key:"news",    icon:"📰", label:"NOTICIAS",        count: news.length    },
    { key:"newsext", icon:"🌐", label:"NEWS EXTENDED",   count: newsExt.length },
    { key:"defi",    icon:"💧", label:"DEFI TVL",        count: defillama?.protocols.length },
    { key:"miners",  icon:"⛏",  label:"MINEROS BTC",    count: miners.length  },
    { key:"treasury",icon:"🏛", label:"BTC TREASURIES",  count: treasuries.length },
    { key:"superinvestors", icon:"🧠", label:"SUPERINVERSORES", count: superInvestors.length },
  ];

  return (
    <div style={{ background: C.bg, color: C.text, minHeight:"100vh", ...rb }}>
      <style>{`
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes ticker  { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .of-row:hover { background: rgba(0,229,255,0.04) !important; }
        .of-news:hover { border-color: ${C.cyan}44 !important; background: rgba(0,229,255,0.03) !important; }
        .of-tab:hover  { color: ${C.cyan} !important; }
      `}</style>

      <SiteNav />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ background: C.bg2, borderBottom:`1px solid ${C.border}`, padding:"28px 32px 20px" }}>
        <div style={{ maxWidth:1400, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
            <div>
              <div style={{ ...s, fontSize:9, color:C.cyan, letterSpacing:"0.4em", marginBottom:6, display:"flex", alignItems:"center", gap:10 }}>
                <Pulse /> PSYCHOMETRIKS ORACLE · FEEDS EN TIEMPO REAL · ELITE
              </div>
              <h1 style={{ ...so, fontSize:32, color:C.text, margin:0, letterSpacing:2, lineHeight:1 }}>
                ORACLE <span style={{ color:C.cyan }}>FEEDS</span>
              </h1>
              <p style={{ ...s, fontSize:11, color:C.text3, marginTop:6 }}>
                Inteligencia de mercado institucional — datos en vivo actualizados cada 60s
              </p>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"flex-start" }}>
              {Object.entries(status).slice(0,4).map(([k, v]) => (
                <div key={k} style={{ ...s, fontSize:8, color:C.text3, border:`1px solid ${C.border}`, padding:"4px 8px", letterSpacing:1 }}>
                  {k.replace(/_/g," ").toUpperCase()}<br/>
                  <span style={{ color:C.text2 }}>{new Date(v).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})}</span>
                </div>
              ))}
              <div style={{ ...s, fontSize:8, color:C.text3, border:`1px solid ${C.border2}`, padding:"4px 10px", letterSpacing:1, cursor:"pointer", borderColor:C.cyan+"33" }}
                onClick={loadAll}>
                ⟳ REFRESH<br/><span style={{ color:C.text2 }}>{new Date(lastUp).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PRICE TICKER ───────────────────────────────────────────────────── */}
      <div style={{ background:C.bg3, borderBottom:`1px solid ${C.border}`, padding:"10px 32px", overflow:"hidden" }}>
        <div style={{ maxWidth:1400, margin:"0 auto", display:"flex", gap:32, alignItems:"center" }}>
          {prices && Object.entries(prices).map(([sym, d]) => (
            <div key={sym} style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
              <span style={{ ...so, fontSize:11, color:C.cyan, letterSpacing:1 }}>{sym.split("/")[0]}</span>
              <span style={{ ...so, fontSize:15, color: d.price ? C.text : C.text3, fontWeight:700 }}>
                {d.price ? "$" + d.price.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 }) : "N/A"}
              </span>
              <span style={{ ...s, fontSize:9, color:C.text3 }}>{d.source}</span>
              <Pulse color={d.price ? C.green : C.text3} />
            </div>
          ))}
          {!prices && <span style={{ ...s, fontSize:10, color:C.text3 }}>Cargando precios...</span>}
        </div>
      </div>

      {/* ── MAIN GRID ──────────────────────────────────────────────────────── */}
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"24px 32px", display:"grid", gridTemplateColumns:"1fr 340px", gap:20 }}>

        {/* LEFT: sentiment + feeds */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* ── SENTIMENT ROW ────────────────────────────────────────────── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

            {/* Fear & Greed */}
            <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderTop:`2px solid ${fgColor}`, padding:20, clipPath:"polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,0 100%)" }}>
              <div style={{ ...s, fontSize:9, color:C.text3, letterSpacing:"0.3em", marginBottom:12 }}>📊 FEAR & GREED INDEX · 7 DÍAS</div>
              {currentFG ? (
                <>
                  <div style={{ display:"flex", alignItems:"flex-end", gap:14, marginBottom:16 }}>
                    <div style={{ ...so, fontSize:52, color:fgColor, lineHeight:1, fontWeight:700 }}>{fgVal}</div>
                    <div>
                      <div style={{ ...so, fontSize:12, color:fgColor, letterSpacing:1 }}>{currentFG.value_classification.toUpperCase()}</div>
                      <div style={{ ...s, fontSize:9, color:C.text3, marginTop:3 }}>ÍNDICE HOY</div>
                    </div>
                  </div>
                  {/* 7-day bar chart */}
                  <div style={{ display:"flex", gap:4, alignItems:"flex-end", height:50 }}>
                    {fg.slice(0,7).reverse().map((f, i) => {
                      const v = parseInt(f.value);
                      const col = FG_COLORS[f.value_classification] ?? C.yellow;
                      return (
                        <div key={i} title={`${f.value_classification}: ${v}`} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                          <div style={{ width:"100%", height: Math.max(4, (v / 100) * 44), background:col, opacity: i === 6 ? 1 : 0.55, transition:"height 0.4s", borderRadius:"1px 1px 0 0" }} />
                          <div style={{ ...s, fontSize:7, color:C.text3 }}>{new Date(parseInt(f.timestamp)*1000).toLocaleDateString("es-MX",{weekday:"short"}).slice(0,2).toUpperCase()}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ ...s, fontSize:10, color:C.text3, paddingTop:20 }}>Cargando índice...</div>
              )}
            </div>

            {/* BTC Dominance + Sentiment */}
            <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderTop:`2px solid ${C.cyan}`, padding:20, clipPath:"polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,0 100%)" }}>
              <div style={{ ...s, fontSize:9, color:C.text3, letterSpacing:"0.3em", marginBottom:12 }}>🌐 DOMINIO & MERCADO</div>
              {sentiment ? (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div>
                    <div style={{ ...s, fontSize:9, color:C.text3, marginBottom:4 }}>BTC DOMINANCE</div>
                    <div style={{ ...so, fontSize:36, color:C.gold, lineHeight:1 }}>{sentiment.btc_dominance.toFixed(2)}<span style={{ fontSize:18 }}>%</span></div>
                    <div style={{ marginTop:8, height:6, background:C.bg, borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${sentiment.btc_dominance}%`, background:`linear-gradient(90deg,${C.gold},${C.yellow})`, borderRadius:3, transition:"width 1s" }} />
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:12 }}>
                    <div style={{ flex:1, background:C.bg, padding:"10px 12px", border:`1px solid ${C.border}` }}>
                      <div style={{ ...s, fontSize:8, color:C.text3, marginBottom:3 }}>CRYPTOS ACTIVAS</div>
                      <div style={{ ...so, fontSize:16, color:C.cyan }}>{sentiment.active_cryptos.toLocaleString()}</div>
                    </div>
                    <div style={{ flex:1, background:C.bg, padding:"10px 12px", border:`1px solid ${C.border}` }}>
                      <div style={{ ...s, fontSize:8, color:C.text3, marginBottom:3 }}>ALT DOMINANCE</div>
                      <div style={{ ...so, fontSize:16, color:C.text2 }}>{(100 - sentiment.btc_dominance).toFixed(2)}%</div>
                    </div>
                  </div>
                  {sentiment.fear_greed_7d[0] && (
                    <div style={{ ...s, fontSize:9, color:C.text3, borderTop:`1px solid ${C.border}`, paddingTop:10 }}>
                      SENTIMIENTO HOY: <span style={{ color: FG_COLORS[sentiment.fear_greed_7d[0].label] ?? C.yellow }}>{sentiment.fear_greed_7d[0].label.toUpperCase()} · {sentiment.fear_greed_7d[0].value}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ ...s, fontSize:10, color:C.text3, paddingTop:20 }}>Cargando sentimiento...</div>
              )}
            </div>
          </div>

          {/* ── TABBED FEEDS ─────────────────────────────────────────────── */}
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, clipPath:"polygon(0 0,calc(100% - 20px) 0,100% 20px,100% 100%,0 100%)" }}>
            {/* Tab header */}
            <div style={{ display:"flex", borderBottom:`1px solid ${C.border}` }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)} className="of-tab"
                  style={{ ...s, fontSize:10, padding:"12px 18px", background:"none", border:"none", cursor:"pointer", letterSpacing:1,
                    color: activeTab === t.key ? C.cyan : C.text3,
                    borderBottom: activeTab === t.key ? `2px solid ${C.cyan}` : "2px solid transparent",
                    transition:"all 0.2s", display:"flex", alignItems:"center", gap:6 }}>
                  {t.icon} {t.label}
                  {t.count ? <span style={{ fontSize:8, color:C.text3 }}>({t.count})</span> : null}
                </button>
              ))}
            </div>

            {/* WHALES */}
            {activeTab === "whales" && (
              <div style={{ maxHeight:440, overflowY:"auto" }}>
                {whales.length === 0 && (
                  <div style={{ ...s, fontSize:10, color:C.text3, padding:24, textAlign:"center" }}>Sin movimientos recientes</div>
                )}
                {whales.map((w, i) => (
                  <div key={i} className="of-row" style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 18px", borderBottom:`1px solid ${C.border}`, transition:"background 0.2s", animation:"fadeIn 0.3s ease both", animationDelay:`${i*30}ms` }}>
                    <div style={{ ...so, fontSize:11, color: w.value_usd >= 10e6 ? C.red : w.value_usd >= 5e6 ? C.gold : C.yellow, flexShrink:0, minWidth:28 }}>
                      {w.value_usd >= 10e6 ? "🚨" : w.value_usd >= 5e6 ? "🐋" : "⚡"}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                        <span style={{ ...so, fontSize:12, color:C.text, fontWeight:700 }}>{fmtUSD(w.value_usd)}</span>
                        <span style={{ ...s, fontSize:9, color:C.text3 }}>{fmtBTC(w.value)} · {w.chain}</span>
                      </div>
                      <div style={{ ...s, fontSize:9, color:C.text3, display:"flex", gap:6, flexWrap:"wrap" }}>
                        <span>DE: <span style={{ color:C.text2 }}>{w.from}</span></span>
                        <span style={{ color:C.border2 }}>→</span>
                        <span>A: <span style={{ color:C.text2 }}>{w.to}</span></span>
                      </div>
                    </div>
                    <div style={{ flexShrink:0, textAlign:"right" }}>
                      <div style={{ ...s, fontSize:9, color:C.text3 }}>{timeAgo(w.timestamp)}</div>
                      <a href={`https://mempool.space/tx/${w.hash}`} target="_blank" rel="noopener noreferrer"
                        style={{ ...s, fontSize:8, color:C.cyan, textDecoration:"none" }}>VER TX ↗</a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* NEWS */}
            {activeTab === "news" && (
              <div style={{ maxHeight:440, overflowY:"auto", padding:14, display:"flex", flexDirection:"column", gap:8 }}>
                {news.length === 0 && (
                  <div style={{ ...s, fontSize:10, color:C.text3, padding:24, textAlign:"center" }}>Cargando noticias...</div>
                )}
                {news.map((item, i) => (
                  <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="of-news"
                    style={{ display:"block", padding:"10px 14px", border:`1px solid ${C.border}`, textDecoration:"none", transition:"all 0.2s", animation:"fadeIn 0.3s ease both", animationDelay:`${i*20}ms` }}>
                    <div style={{ ...s, fontSize:8, color:C.text3, marginBottom:4, display:"flex", gap:8 }}>
                      <span style={{ color:C.cyan }}>{item.source}</span>
                      <span>·</span>
                      <span>{fmtDate(item.pubDate)}</span>
                    </div>
                    <div style={{ ...rb, fontSize:13, color:C.text, lineHeight:1.4 }}>{item.title}</div>
                  </a>
                ))}
              </div>
            )}

            {/* NEWS EXTENDED */}
            {activeTab === "newsext" && (
              <div style={{ maxHeight:440, overflowY:"auto", padding:14, display:"flex", flexDirection:"column", gap:8 }}>
                <div style={{ ...s, fontSize:9, color:C.text3, marginBottom:6, letterSpacing:"0.2em" }}>DECRYPT · BITCOIN MAGAZINE · COINTELEGRAPH DEFI · 30 ARTÍCULOS</div>
                {newsExt.length === 0 && <div style={{ ...s, fontSize:10, color:C.text3, padding:24, textAlign:"center" }}>Cargando noticias extendidas...</div>}
                {newsExt.map((item, i) => (
                  <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="of-news"
                    style={{ display:"block", padding:"10px 14px", border:`1px solid ${C.border}`, textDecoration:"none", transition:"all 0.2s", animation:"fadeIn 0.3s ease both", animationDelay:`${i*15}ms` }}>
                    <div style={{ ...s, fontSize:8, color:C.text3, marginBottom:4, display:"flex", gap:8 }}>
                      <span style={{ color: item.source.includes("Decrypt") ? "#ff6d00" : item.source.includes("Bitcoin") ? "#f0b90b" : C.cyan }}>{item.source}</span>
                      <span>·</span><span>{fmtDate(item.pubDate)}</span>
                    </div>
                    <div style={{ ...rb, fontSize:13, color:C.text, lineHeight:1.4 }}>{item.title}</div>
                  </a>
                ))}
              </div>
            )}

            {/* DEFI TVL */}
            {activeTab === "defi" && (
              <div style={{ padding:18 }}>
                {defillama ? (
                  <>
                    {/* Total TVL header */}
                    <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:16, padding:"12px 16px", background:C.bg, border:`1px solid ${C.border}`, borderLeft:`3px solid #00c853` }}>
                      <div>
                        <div style={{ ...s, fontSize:9, color:C.text3, marginBottom:3 }}>TOTAL DeFi TVL (30D)</div>
                        <div style={{ ...so, fontSize:26, color:"#00c853" }}>${(defillama.totalTvl / 1e9).toFixed(2)}<span style={{ fontSize:14 }}>B</span></div>
                      </div>
                      <div style={{ flex:1, display:"flex", alignItems:"flex-end", gap:2, height:36 }}>
                        {defillama.tvlHistory.slice(-14).map((d, i) => {
                          const max = Math.max(...defillama.tvlHistory.slice(-14).map(x=>x.tvl));
                          const min = Math.min(...defillama.tvlHistory.slice(-14).map(x=>x.tvl));
                          const pct = max === min ? 0.5 : (d.tvl - min) / (max - min);
                          const isLast = i === 13;
                          return <div key={i} style={{ flex:1, height: Math.max(4, pct * 34), background: isLast ? "#00c853" : "#00c85355", borderRadius:"1px 1px 0 0", transition:"height 0.4s" }} title={`$${(d.tvl/1e9).toFixed(1)}B`} />;
                        })}
                      </div>
                    </div>
                    {/* Protocols table */}
                    <div style={{ ...s, fontSize:9, color:C.text3, marginBottom:10, letterSpacing:"0.2em" }}>TOP 15 PROTOCOLOS DeFi POR TVL · EXCLUYE CEX</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {defillama.protocols.map((p, i) => {
                        const maxTvl = defillama.protocols[0]?.tvl ?? 1;
                        const barPct = Math.min(100, (p.tvl / maxTvl) * 100);
                        const change = p.change_1d;
                        return (
                          <div key={i} className="of-row" style={{ padding:"9px 14px", border:`1px solid ${C.border}`, transition:"background 0.2s", animation:"fadeIn 0.3s ease both", animationDelay:`${i*30}ms` }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
                              <span style={{ ...so, fontSize:11, color:C.text3, minWidth:20 }}>#{i+1}</span>
                              {p.logo && <img src={p.logo} alt="" style={{ width:18, height:18, borderRadius:"50%", objectFit:"cover" }} onError={e=>(e.currentTarget.style.display="none")} />}
                              <span style={{ ...rb, fontSize:14, color:C.text, fontWeight:600, flex:1 }}>{p.name}</span>
                              <span style={{ ...s, fontSize:8, color:C.text3, background:C.bg3, border:`1px solid ${C.border}`, padding:"2px 6px" }}>{p.category}</span>
                              <span style={{ ...so, fontSize:13, color:"#00c853" }}>${(p.tvl/1e9).toFixed(2)}B</span>
                              {change !== null && (
                                <span style={{ ...s, fontSize:9, color: change >= 0 ? C.green : C.red, minWidth:46, textAlign:"right" }}>
                                  {change >= 0 ? "▲" : "▼"}{Math.abs(change).toFixed(2)}%
                                </span>
                              )}
                            </div>
                            <div style={{ height:3, background:C.bg, borderRadius:2, overflow:"hidden" }}>
                              <div style={{ height:"100%", width:`${barPct}%`, background:"#00c853", opacity:0.6, borderRadius:2, transition:"width 0.8s" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{ ...s, fontSize:10, color:C.text3, padding:24, textAlign:"center" }}>Cargando DeFiLlama...</div>
                )}
              </div>
            )}

            {/* MINERS */}
            {activeTab === "miners" && (
              <div style={{ padding:18 }}>
                <div style={{ ...s, fontSize:9, color:C.text3, marginBottom:14 }}>PRINCIPALES MINEROS BTC LISTADOS · HASH RATE + RESERVAS</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {miners.map((m, i) => (
                    <div key={i} className="of-row" style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:10, padding:"10px 14px", border:`1px solid ${C.border}`, transition:"background 0.2s", animation:"fadeIn 0.3s ease both", animationDelay:`${i*40}ms` }}>
                      <div>
                        <div style={{ ...rb, fontSize:14, color:C.text, fontWeight:600 }}>{m.name}</div>
                        <div style={{ ...s, fontSize:9, color:C.cyan }}>{m.ticker}</div>
                      </div>
                      <div>
                        <div style={{ ...s, fontSize:8, color:C.text3, marginBottom:2 }}>BTC EN RESERVA</div>
                        <div style={{ ...so, fontSize:13, color:C.gold }}>{m.btc_held.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ ...s, fontSize:8, color:C.text3, marginBottom:2 }}>HASH RATE</div>
                        <div style={{ ...so, fontSize:13, color:C.cyan }}>{m.hash_rate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TREASURY */}
            {activeTab === "treasury" && (
              <div style={{ padding:18 }}>
                <div style={{ ...s, fontSize:9, color:C.text3, marginBottom:14 }}>EMPRESAS CON BTC EN RESERVA CORPORATIVA · TOP 15</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {treasuries.map((t, i) => (
                    <div key={i} className="of-row" style={{ display:"flex", alignItems:"center", gap:14, padding:"9px 14px", border:`1px solid ${C.border}`, transition:"background 0.2s", animation:"fadeIn 0.3s ease both", animationDelay:`${i*30}ms` }}>
                      <div style={{ ...so, fontSize:12, color:C.text3, minWidth:24 }}>#{t.entity}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ ...rb, fontSize:14, color:C.text, fontWeight:600 }}>{t.btc}</div>
                      </div>
                      <div style={{ ...s, fontSize:16 }}>{t.usd}</div>
                    </div>
                  ))}
                  {treasuries.length === 0 && (
                    <div style={{ ...s, fontSize:10, color:C.text3, padding:24, textAlign:"center" }}>Cargando tesoros...</div>
                  )}
                </div>
              </div>
            )}

            {/* SUPERINVERSORES (13F) */}
            {activeTab === "superinvestors" && (
              <div style={{ padding:18 }}>
                <div style={{ ...s, fontSize:9, color:C.text3, marginBottom:4 }}>
                  MOVIMIENTOS 13F REAL — SEC EDGAR (data.sec.gov) · Fuente oficial, gratis, sin terceros
                </div>
                <div style={{ ...s, fontSize:8, color:C.text3, marginBottom:14, opacity:0.7 }}>
                  ⚠ Los 13F son trimestrales — se reportan ~45 días después del cierre de cada trimestre, no es data al segundo.
                </div>
                {superInvestors.length === 0 && (
                  <div style={{ ...s, fontSize:10, color:C.text3, padding:24, textAlign:"center" }}>Cargando 13F de SEC EDGAR...</div>
                )}
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {superInvestors.map((inv, i) => (
                    <div key={inv.cik} style={{ border:`1px solid ${C.border}`, animation:"fadeIn 0.3s ease both", animationDelay:`${i*40}ms` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:C.bg3, borderBottom:`1px solid ${C.border}` }}>
                        <div>
                          <div style={{ ...rb, fontSize:14, color:C.text, fontWeight:700 }}>{inv.name}</div>
                          <div style={{ ...s, fontSize:9, color:C.text3 }}>{inv.fund}</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          {inv.ok ? (
                            <>
                              <div style={{ ...s, fontSize:8, color:C.text3 }}>Período reportado</div>
                              <div style={{ ...so, fontSize:11, color:C.cyan }}>{inv.periodOfReport ?? "—"}</div>
                            </>
                          ) : (
                            <div style={{ ...s, fontSize:9, color:C.red }}>⚠ Sin datos disponibles</div>
                          )}
                        </div>
                      </div>
                      {inv.holdings?.length > 0 && (
                        <div style={{ padding:"6px 0" }}>
                          {inv.holdings.slice(0, 8).map((h, j) => (
                            <div key={j} className="of-row" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 14px", transition:"background 0.2s" }}>
                              <div style={{ ...rb, fontSize:11, color:C.text }}>{h.nameOfIssuer}</div>
                              <div style={{ display:"flex", gap:14, alignItems:"center" }}>
                                <div style={{ ...s, fontSize:9, color:C.text3 }}>{h.shares.toLocaleString()} acciones</div>
                                <div style={{ ...so, fontSize:11, color:C.gold, minWidth:80, textAlign:"right" }}>{fmtUSD(h.value * 1000)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR ─────────────────────────────────────────────────── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* PSY Score Bar */}
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderTop:`2px solid ${fgColor}`, padding:18, clipPath:"polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,0 100%)" }}>
            <div style={{ ...s, fontSize:9, color:C.text3, letterSpacing:"0.3em", marginBottom:12 }}>⚡ PSY MARKET STATUS</div>
            {currentFG && sentiment ? (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  { label:"FEAR & GREED", val: fgVal ?? 0, color: fgColor, suffix:"/100" },
                  { label:"BTC DOMINANCE", val: Math.round(sentiment.btc_dominance), color: C.gold, suffix:"%" },
                  { label:"ALT SEASON", val: Math.round(100 - sentiment.btc_dominance), color: C.purple, suffix:"%" },
                ].map(row => (
                  <div key={row.label}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ ...s, fontSize:9, color:C.text3 }}>{row.label}</span>
                      <span style={{ ...so, fontSize:11, color:row.color }}>{row.val}{row.suffix}</span>
                    </div>
                    <div style={{ height:4, background:C.bg, borderRadius:2, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${row.val}%`, background:row.color, borderRadius:2, transition:"width 1s" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ ...s, fontSize:10, color:C.text3 }}>Cargando...</div>
            )}
          </div>

          {/* Whale summary */}
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, padding:18 }}>
            <div style={{ ...s, fontSize:9, color:C.text3, letterSpacing:"0.3em", marginBottom:12 }}>🐋 RESUMEN WHALE ALERTS</div>
            {whales.length > 0 ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { label:"TOTAL MOVIMIENTOS", val: whales.length, color:C.cyan },
                  { label:"MAYOR TRANSACCIÓN", val: fmtUSD(Math.max(...whales.map(w=>w.value_usd))), color:C.red },
                  { label:"VOLUMEN TOTAL", val: fmtUSD(whales.reduce((a,w)=>a+w.value_usd,0)), color:C.gold },
                  { label:">$10M (CRÍTICOS)", val: whales.filter(w=>w.value_usd>=10e6).length, color:C.red },
                  { label:">$1M (GRANDES)", val: whales.filter(w=>w.value_usd>=1e6).length, color:C.yellow },
                ].map(row => (
                  <div key={row.label} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ ...s, fontSize:9, color:C.text3 }}>{row.label}</span>
                    <span style={{ ...so, fontSize:11, color:row.color }}>{row.val}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ ...s, fontSize:10, color:C.text3 }}>Sin datos recientes</div>
            )}
          </div>

          {/* Noticias rápidas */}
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, padding:18, flex:1 }}>
            <div style={{ ...s, fontSize:9, color:C.text3, letterSpacing:"0.3em", marginBottom:12 }}>📰 ÚLTIMAS NOTICIAS</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {news.slice(0,5).map((item, i) => (
                <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                  style={{ display:"block", textDecoration:"none", paddingBottom:8, borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ ...s, fontSize:8, color:C.cyan, marginBottom:3 }}>{item.source}</div>
                  <div style={{ ...rb, fontSize:12, color:C.text2, lineHeight:1.35 }}>{item.title}</div>
                </a>
              ))}
              {news.length === 0 && <div style={{ ...s, fontSize:10, color:C.text3 }}>Cargando...</div>}
            </div>
          </div>

          {/* Last update */}
          <div style={{ ...s, fontSize:8, color:C.text3, textAlign:"center", padding:"6px 0", letterSpacing:1 }}>
            <Pulse color={C.text3} /> ACTUALIZACIÓN AUTOMÁTICA CADA 60s · {new Date(lastUp).toLocaleTimeString("es-MX")}
          </div>
        </div>
      </div>
    </div>
  );
}
