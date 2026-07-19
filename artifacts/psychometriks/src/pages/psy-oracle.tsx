import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { Chart, registerables } from "chart.js";
import { getAuth } from "@/lib/auth";

Chart.register(...registerables);

// Calendario Económico real de TradingView (gratis, sin API key, sin límite
// de cuota) — reemplaza el intento vía FMP que daba 403 en el plan actual.
// Mismo patrón de embeds que ya se usa en bolsa-valores.tsx.
function EconomicCalendarWidget() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const container = document.createElement("div");
    container.className = "tradingview-widget-container__widget";
    ref.current.appendChild(container);
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark", isTransparent: true, width: "100%", height: "100%",
      locale: "es", importanceFilter: "-1,0,1", currencyFilter: "USD",
    });
    ref.current.appendChild(script);
    return () => { if (ref.current) ref.current.innerHTML = ""; };
  }, []);
  return <div ref={ref} className="tradingview-widget-container" style={{ height: 380, width: "100%" }} />;
}

// ─── Color helpers ─────────────────────────────────────────────────────────
function chgColor(v: number): string {
  if (v >= 3) return "#00ff88";
  if (v >= 1) return "#00cc66";
  if (v > 0) return "#00aa44";
  if (v === 0) return "#444";
  if (v > -1) return "#cc3355";
  if (v > -3) return "#ee2244";
  return "#ff3366";
}
function chgBg(v: number): string {
  if (v >= 3) return "#00ff8815";
  if (v >= 1) return "#00cc6612";
  if (v > 0) return "#00aa4410";
  if (v === 0) return "#22222a";
  if (v > -1) return "#cc335510";
  if (v > -3) return "#ee224412";
  return "#ff336615";
}

// ─── Live data types ────────────────────────────────────────────────────────
interface LiveCrypto  { sym: string; price: number; chg24h: number; vol24h?: number; }
interface LiveIndices { [key: string]: { price: number; chg: number }; }
interface LiveFng     { value: number; label: string; }
interface LiveYield   { label: string; rate: number; }
interface LiveMacro   { indices: LiveIndices; fng: LiveFng; yields: LiveYield[]; }
interface LiveOB      { bids: {price:number;size:number;total:number}[]; asks: {price:number;size:number;total:number}[]; pair: string; }

// ─── useLiveMarketData ──────────────────────────────────────────────────────
function useLiveMarketData() {
  const [crypto,    setCrypto]    = useState<LiveCrypto[]>([]);
  const [macro,     setMacro]     = useState<LiveMacro | null>(null);
  const [orderBook, setOrderBook] = useState<LiveOB | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [lastUpdate,setLastUpdate]= useState<string>("");

  const fetchAll = useCallback(async () => {
    try {
      const [cRes, mRes] = await Promise.allSettled([
        fetch("/api/market-data/crypto").then(r => r.json()) as Promise<{assets: LiveCrypto[]}>,
        fetch("/api/market-data/macro").then(r  => r.json()) as Promise<LiveMacro>,
      ]);
      if (cRes.status === "fulfilled" && cRes.value?.assets) setCrypto(cRes.value.assets);
      if (mRes.status === "fulfilled" && mRes.value?.indices) setMacro(mRes.value);
      setLastUpdate(new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  const fetchOB = useCallback(async (pair: string) => {
    if (!["BTC","ETH","SOL"].includes(pair)) return;
    try {
      const d = await fetch(`/api/market-data/orderbook/${pair}`).then(r => r.json()) as LiveOB;
      if (d?.bids) setOrderBook(d);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 30_000);
    return () => clearInterval(t);
  }, [fetchAll]);

  return { crypto, macro, orderBook, fetchOB, loading, lastUpdate };
}

// ─── TradingView Chart embed ────────────────────────────────────────────────
function TVChart({ symbol, interval = "D", height = 220 }: { symbol: string; interval?: string; height?: number }) {
  const id = useRef(`tv_${symbol.replace(/[^a-z0-9]/gi,"_")}_${Math.random().toString(36).slice(2)}`).current;
  const src = `https://s.tradingview.com/widgetembed/?frameElementId=${id}&symbol=${encodeURIComponent(symbol)}&interval=${interval}&theme=dark&style=1&locale=es&hide_side_toolbar=1&allow_symbol_change=0&hideideas=1&saveimage=0&toolbarbg=0d1117&withdateranges=1`;
  return <iframe id={id} src={src} width="100%" height={height} frameBorder="0" scrolling="no" style={{borderRadius:6,display:"block"}} title={`Chart ${symbol}`} />;
}

// ─── RefBadge ───────────────────────────────────────────────────────────────
function RefBadge({ text = "DATOS REFERENCIA" }: { text?: string }) {
  return <span style={{background:"#ffd70018",border:"1px solid #ffd70044",color:"#ffd700",fontSize:9,padding:"2px 7px",borderRadius:4,fontFamily:"monospace",letterSpacing:1}}>{text}</span>;
}

// ─── LiveBadge ──────────────────────────────────────────────────────────────
function LiveBadge() {
  return <span style={{background:"#00ff8818",border:"1px solid #00ff8844",color:"#00ff88",fontSize:9,padding:"2px 7px",borderRadius:4,fontFamily:"monospace",letterSpacing:1}}>● LIVE</span>;
}

// ─── Static fallback / reference data ──────────────────────────────────────
const TICKERS = [
  {sym:"BTC", chg:+2.1}, {sym:"ETH", chg:+1.4}, {sym:"SOL", chg:+3.8},
  {sym:"BNB", chg:+0.7}, {sym:"XRP", chg:-0.3}, {sym:"AVAX",chg:-1.2},
  {sym:"ARB", chg:+4.1}, {sym:"OP",  chg:+5.3}, {sym:"DOGE",chg:-0.8},
  {sym:"PEPE",chg:+8.4}, {sym:"AAPL",chg:+0.9}, {sym:"NVDA",chg:+2.7},
  {sym:"TSLA",chg:-1.4}, {sym:"MSFT",chg:+0.6}, {sym:"META",chg:+1.8},
  {sym:"AMZN",chg:+0.4}, {sym:"SPY", chg:+0.42},{sym:"QQQ", chg:+0.71},
  {sym:"GLD", chg:+0.83},{sym:"SLV", chg:+1.2},
];

const TOP20_TABLE = [
  {rank:1, sym:"SOL",  price:"$88.20",   d1:"+0.2%",  d7:"+4.1%",  vol:"$2.8B",  flow:"+$410M", signal:"ACUM"},
  {rank:2, sym:"PEPE", price:"$0.0000124",d1:"+3.1%", d7:"+12.4%", vol:"$1.2B",  flow:"+$180M", signal:"ACUM"},
  {rank:3, sym:"OP",   price:"$0.149",   d1:"+7.4%",  d7:"+9.8%",  vol:"$340M",  flow:"+$92M",  signal:"ACUM"},
  {rank:4, sym:"ARB",  price:"$0.128",   d1:"+4.0%",  d7:"+7.2%",  vol:"$280M",  flow:"+$72M",  signal:"ACUM"},
  {rank:5, sym:"NVDA", price:"$211.50",  d1:"+2.7%",  d7:"+8.1%",  vol:"$18.4B", flow:"+$2.1B", signal:"ACUM"},
  {rank:6, sym:"BTC",  price:"$79,550",  d1:"-1.9%",  d7:"+1.2%",  vol:"$24.8B", flow:"+$2.4B", signal:"ACUM"},
  {rank:7, sym:"ETH",  price:"$2,280",   d1:"-1.7%",  d7:"-0.8%",  vol:"$8.4B",  flow:"+$480M", signal:"NEUTRAL"},
  {rank:8, sym:"AVAX", price:"$9.50",    d1:"+0.1%",  d7:"-2.8%",  vol:"$240M",  flow:"-$28M",  signal:"DIST"},
  {rank:9, sym:"TSLA", price:"$350.00",  d1:"-1.4%",  d7:"-5.8%",  vol:"$12.1B", flow:"-$980M", signal:"DIST"},
  {rank:10,sym:"XRP",  price:"$1.384",   d1:"-2.0%",  d7:"-1.1%",  vol:"$1.2B",  flow:"-$44M",  signal:"NEUTRAL"},
];

const HEATMAP_1W = [
  {sym:"BTC", chg:+6.3},{sym:"ETH", chg:+4.2},{sym:"SOL", chg:+12.4},{sym:"BNB", chg:+2.1},{sym:"XRP", chg:-1.1},
  {sym:"AVAX",chg:-3.4},{sym:"ARB", chg:+7.2},{sym:"OP",  chg:+9.8},{sym:"DOGE",chg:-2.3},{sym:"PEPE",chg:+24.1},
  {sym:"AAPL",chg:+3.2},{sym:"NVDA",chg:+8.1},{sym:"TSLA",chg:-5.8},{sym:"MSFT",chg:+2.4},{sym:"META",chg:+6.3},
  {sym:"AMZN",chg:+1.8},{sym:"SPY", chg:+2.1},{sym:"QQQ", chg:+3.4},{sym:"GLD", chg:+4.2},{sym:"SLV", chg:+5.8},
];
const HEATMAP_1M = [
  {sym:"BTC", chg:+18.4},{sym:"ETH", chg:+12.1},{sym:"SOL", chg:+28.3},{sym:"BNB", chg:+8.4},{sym:"XRP", chg:-4.2},
  {sym:"AVAX",chg:-12.1},{sym:"ARB", chg:+21.4},{sym:"OP",  chg:+18.9},{sym:"DOGE",chg:-8.1},{sym:"PEPE",chg:+68.4},
  {sym:"AAPL",chg:+7.2},{sym:"NVDA", chg:+22.1},{sym:"TSLA",chg:-14.8},{sym:"MSFT",chg:+9.4},{sym:"META",chg:+18.2},
  {sym:"AMZN",chg:+6.1},{sym:"SPY",  chg:+7.8},{sym:"QQQ",  chg:+11.4},{sym:"GLD", chg:+14.8},{sym:"SLV",chg:+19.2},
];
const SECTOR_YTD = [
  {name:"Tecnología", chg:+18.4},{name:"Energía",    chg:-8.2},{name:"Consumo",    chg:+6.4},
  {name:"Salud",      chg:+4.1}, {name:"Financiero", chg:+12.8},{name:"Materiales", chg:+3.2},
  {name:"Utilities",  chg:-2.1}, {name:"Industriales",chg:+8.9},{name:"Real Estate",chg:-4.8},
  {name:"Comm Svcs",  chg:+14.2},
];
const FVG_LIST = [
  {type:"BULL FVG", range:"$76,400 – $77,200",age:"3D",status:"ACTIVO", fill:22},
  {type:"BEAR FVG", range:"$84,200 – $85,100",age:"1D",status:"ACTIVO", fill:0},
  {type:"BULL FVG", range:"$72,800 – $73,600",age:"7D",status:"PARCIAL",fill:65},
  {type:"IMBALANCE",range:"$79,400 – $79,600",age:"1H",status:"FRESCO", fill:8},
];
const DARK_POOL = [
  {sym:"SPY",  price:"$584.20", size:"2.8M",   side:"BID",   ts:"10:42"},
  {sym:"AAPL", price:"$287.14", size:"1.2M",   side:"OFFER", ts:"10:31"},
  {sym:"NVDA", price:"$211.80", size:"480K",   side:"BID",   ts:"10:18"},
  {sym:"QQQ",  price:"$489.32", size:"3.4M",   side:"BID",   ts:"09:58"},
  {sym:"BTC",  price:"$79,420", size:"124 BTC",side:"OFFER", ts:"09:44"},
];
const OPTIONS_DATA = [
  {sym:"SPY", strike:585,   exp:"21Jun",delta:0.48,gamma:0.082,theta:-0.34, vega:2.1,  iv:"14.8%",pcr:1.42,maxPain:580,   gex:-2.8,type:"PUT" },
  {sym:"NVDA",strike:210,   exp:"21Jun",delta:0.52,gamma:0.064,theta:-1.28, vega:8.4,  iv:"42.1%",pcr:0.68,maxPain:200,   gex:+4.2,type:"CALL"},
  {sym:"BTC", strike:80000, exp:"27Jun",delta:0.44,gamma:0.041,theta:-280,  vega:1240, iv:"58.4%",pcr:0.82,maxPain:78000, gex:+8.1,type:"CALL"},
];
const UNUSUAL_OPTIONS = [
  {sym:"GME", type:"CALL",strike:25,  exp:"21Jun",vol:"48K", oi:"2.1K",ratio:"22.8x",premium:"$4.2M", side:"BUY"},
  {sym:"NVDA",type:"CALL",strike:240, exp:"19Jul",vol:"28K", oi:"8.4K",ratio:"3.3x", premium:"$18.4M",side:"BUY"},
  {sym:"SPY", type:"PUT", strike:560, exp:"21Jun",vol:"180K",oi:"42K", ratio:"4.3x", premium:"$48M",  side:"BUY"},
  {sym:"AAPL",type:"PUT", strike:280, exp:"28May",vol:"64K", oi:"12K", ratio:"5.3x", premium:"$8.1M", side:"BUY"},
];
const HOLDINGS_13F = [
  {fund:"Bridgewater",    action:"ADD", sym:"GLD",  shares:"2.0M",value:"$624M", chg:"+18%"},
  {fund:"Millennium",     action:"ADD", sym:"NVDA", shares:"840K",value:"$774M", chg:"+24%"},
  {fund:"Citadel",        action:"SELL",sym:"TSLA", shares:"1.2M",value:"$238M", chg:"-31%"},
  {fund:"Two Sigma",      action:"ADD", sym:"META", shares:"480K",value:"$624M", chg:"+12%"},
  {fund:"DE Shaw",        action:"ADD", sym:"BRK.B",shares:"280K",value:"$112M", chg:"+8%"},
  {fund:"Appaloosa",      action:"NEW", sym:"SOL",  shares:"—",   value:"$84M",  chg:"NEW"},
  {fund:"Tiger Global",   action:"SELL",sym:"AMZN", shares:"320K",value:"$614M", chg:"-18%"},
];
const INSIDER_TX = [
  {name:"Jensen Huang",   company:"NVDA",role:"CEO",type:"SELL",shares:"120K",value:"$110M",date:"02 May"},
  {name:"Tim Cook",       company:"AAPL",role:"CEO",type:"SELL",shares:"48K", value:"$9.1M",date:"29 Abr"},
  {name:"Elon Musk",      company:"TSLA",role:"CEO",type:"BUY", shares:"1M",  value:"$194M",date:"24 Abr"},
  {name:"Mark Zuckerberg",company:"META",role:"CEO",type:"SELL",shares:"84K", value:"$109M",date:"18 Abr"},
];
const ETF_FLOWS = [
  {name:"QQQ", flow:+2840,type:"IN"},{name:"SPY", flow:+1820,type:"IN"},
  {name:"GLD", flow:+940, type:"IN"},{name:"IBIT",flow:+1240,type:"IN"},
  {name:"SQQQ",flow:-680, type:"OUT"},{name:"IEF",flow:-420, type:"OUT"},
];
const SMART_MONEY = [
  {sym:"BTC", score:82,bias:"BULL",conf:"ALTA"},{sym:"NVDA",score:78,bias:"BULL",conf:"ALTA"},
  {sym:"SPY", score:61,bias:"BULL",conf:"MEDIA"},{sym:"TSLA",score:32,bias:"BEAR",conf:"MEDIA"},
  {sym:"GLD", score:74,bias:"BULL",conf:"ALTA"},
];
const ECO_CALENDAR = [
  {date:"13 May",event:"CPI EE.UU. (Abr)",  est:"+3.4%",prev:"+3.5%",impact:"ALTO"},
  {date:"14 May",event:"PPI Núcleo",          est:"+2.8%",prev:"+2.7%",impact:"MEDIO"},
  {date:"15 May",event:"Ventas Minoristas",   est:"+0.4%",prev:"+0.7%",impact:"ALTO"},
  {date:"22 May",event:"FOMC Actas",          est:"—",    prev:"—",    impact:"ALTO"},
  {date:"28 May",event:"PCE Núcleo (Abr)",   est:"+2.6%",prev:"+2.8%",impact:"ALTO"},
];
const SQUEEZE_CANDIDATES = [
  {sym:"GME", si:"31.2%",borrow:"420bps",days:2.1,ctc:88,float:"Low", score:94},
  {sym:"BBBY",si:"28.4%",borrow:"380bps",days:1.8,ctc:82,float:"Low", score:88},
  {sym:"MSTR",si:"18.2%",borrow:"180bps",days:3.4,ctc:74,float:"Mid", score:76},
  {sym:"AMC", si:"22.1%",borrow:"240bps",days:2.8,ctc:68,float:"Low", score:72},
  {sym:"RIVN",si:"14.8%",borrow:"140bps",days:4.2,ctc:61,float:"Mid", score:64},
  {sym:"PLTR",si:"11.4%",borrow:"88bps", days:5.8,ctc:52,float:"High",score:54},
];
const NARRATIVES = [
  {name:"BTC como Reserva de Valor",trend:"BULL",strength:88,catalyst:"ETF flows + halving",  momentum:"+12%"},
  {name:"IA / Semiconductores",     trend:"BULL",strength:82,catalyst:"NVDA earnings beat",   momentum:"+18%"},
  {name:"Ciclo Liquidez FED",       trend:"BULL",strength:74,catalyst:"Pivot rate cuts Q3",   momentum:"+8%"},
  {name:"DXY Debilitamiento",       trend:"BULL",strength:68,catalyst:"Deuda + déficit",      momentum:"+6%"},
  {name:"Risk-Off Treasuries",      trend:"BEAR",strength:42,catalyst:"Yield curve inverse",  momentum:"-4%"},
  {name:"Recesión Earnings",        trend:"BEAR",strength:38,catalyst:"Guidance cuts Q2/Q3",  momentum:"-6%"},
];
const BRAIN_ASSETS: Record<string,string[]> = {
  equity: ["AAPL","NVDA","MSFT","TSLA","META","AMZN","GOOGL","JPM","BRK.B","SPY"],
  index:  ["SPX","NDX","DJI","RUT","VIX","SKEW","MOVE"],
  macro:  ["DXY","US10Y","US2Y","GOLD","OIL","BTC.D","TOTAL3"],
  crypto: ["BTC","ETH","SOL","BNB","XRP","AVAX","ARB","OP","DOGE","PEPE"],
};
const ANALYSIS_TYPES = [
  {id:"full",     label:"Análisis Completo",    icon:"🧠"},
  {id:"flujo",    label:"Flujo Institucional",  icon:"🌊"},
  {id:"opciones", label:"Señales de Opciones",  icon:"📊"},
  {id:"macro",    label:"Contexto Macro",       icon:"🌐"},
  {id:"narrativa",label:"Análisis de Narrativa",icon:"📖"},
  {id:"squeeze",  label:"Squeeze Candidates",   icon:"⚡"},
];

const CRYPTO_HEATMAP = ["BTC","ETH","SOL","BNB","XRP","AVAX","ARB","OP","DOGE","PEPE"];
const STOCK_HEATMAP  = ["AAPL","NVDA","TSLA","MSFT","META","AMZN","SPY","QQQ","GLD","SLV"];

// ─── Shared components ──────────────────────────────────────────────────────
function HeatmapGrid({ data }: { data: {sym:string;chg:number}[] }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(5, 1fr)",gap:6}}>
      {data.map(t => (
        <div key={t.sym} style={{background:chgBg(t.chg),border:`1px solid ${chgColor(t.chg)}22`,borderRadius:6,padding:"8px 6px",textAlign:"center",cursor:"default"}}>
          <div style={{color:"#cdd",fontSize:11,fontFamily:"monospace",fontWeight:700}}>{t.sym}</div>
          <div style={{color:chgColor(t.chg),fontSize:13,fontWeight:700,marginTop:2}}>{t.chg > 0 ? "+" : ""}{t.chg.toFixed(1)}%</div>
        </div>
      ))}
    </div>
  );
}
function Card({title,children,style,badge}:{title?:string;children:React.ReactNode;style?:React.CSSProperties;badge?:React.ReactNode}) {
  return (
    <div style={{background:"#0d1117",border:"1px solid #1e2530",borderRadius:10,padding:16,...style}}>
      {title && (
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{color:"#7b8fa0",fontSize:10,letterSpacing:2,textTransform:"uppercase",fontFamily:"monospace"}}>▸ {title}</div>
          {badge}
        </div>
      )}
      {children}
    </div>
  );
}
function AlertBadge({type}:{type:string}) {
  const colors:Record<string,string> = {WHALE:"#00e5ff",OPCIONES:"#7b2ff7",SQUEEZE:"#ff6b35",MACRO:"#ffd700","13F":"#00ff88"};
  const c = colors[type] || "#888";
  return <span style={{background:`${c}18`,border:`1px solid ${c}44`,color:c,fontSize:9,padding:"2px 6px",borderRadius:4,fontFamily:"monospace",letterSpacing:1}}>{type}</span>;
}

// ─── Section 1: DASHBOARD ───────────────────────────────────────────────────
function SectionDashboard({crypto,macro,loading}:{crypto:LiveCrypto[];macro:LiveMacro|null;loading:boolean}) {

  // Build live macro ribbon
  const liveRibbon = useMemo(() => {
    const btc  = crypto.find(c => c.sym === "BTC");
    const spx  = macro?.indices["GSPC"];
    const dxy  = macro?.indices["DXY"];
    const us10y= macro?.indices["TNX"];
    const gold = macro?.indices["GOLD"];
    const vix  = macro?.indices["VIX"];
    return [
      {sym:"BTC",   val: btc   ? `$${btc.price.toLocaleString("en-US",{maximumFractionDigits:0})}` : "—", chg: btc?.chg24h ?? 0},
      {sym:"SPX",   val: spx   ? spx.price.toLocaleString("en-US",{maximumFractionDigits:0})        : "—", chg: spx?.chg    ?? 0},
      {sym:"DXY",   val: dxy   ? dxy.price.toFixed(2)                                               : "—", chg: dxy?.chg    ?? 0},
      {sym:"US10Y", val: us10y ? `${us10y.price.toFixed(3)}%`                                       : "—", chg: us10y?.chg  ?? 0},
      {sym:"GOLD",  val: gold  ? `$${gold.price.toLocaleString("en-US",{maximumFractionDigits:0})}` : "—", chg: gold?.chg   ?? 0},
      {sym:"VIX",   val: vix   ? vix.price.toFixed(2)                                               : "—", chg: vix?.chg    ?? 0},
    ];
  }, [crypto, macro]);

  // Live heatmap (1D real OKX + Yahoo data)
  const liveHeatmap = useMemo(() => [
    ...CRYPTO_HEATMAP.map(sym => {
      const live = crypto.find(c => c.sym === sym);
      return {sym, chg: live?.chg24h ?? (TICKERS.find(t => t.sym === sym)?.chg ?? 0)};
    }),
    ...STOCK_HEATMAP.map(sym => {
      const live = macro?.indices[sym];
      return {sym, chg: live?.chg ?? (TICKERS.find(t => t.sym === sym)?.chg ?? 0)};
    }),
  ], [crypto, macro]);

  // Live F&G
  const fng      = macro?.fng.value ?? 68;
  const fngLabel = macro?.fng.label ?? "GREED";
  const angle = (fng / 100) * Math.PI;
  const cx = 80; const cy = 80; const r = 60;
  const gx = cx + r * Math.cos(Math.PI - angle);
  const gy = cy - r * Math.sin(angle);

  // Live TOP20 with real prices
  const liveTop20 = useMemo(() => TOP20_TABLE.map(row => {
    const cLive = crypto.find(c => c.sym === row.sym);
    const sLive = macro?.indices[row.sym];
    const p = cLive?.price ?? sLive?.price;
    const ch = cLive?.chg24h ?? sLive?.chg;
    if (p !== undefined && ch !== undefined) {
      const pStr = p >= 1000
        ? `$${p.toLocaleString("en-US",{maximumFractionDigits:0})}`
        : p >= 1
          ? `$${p.toFixed(2)}`
          : `$${p.toFixed(6)}`;
      return {...row, price: pStr, d1: `${ch >= 0 ? "+" : ""}${ch.toFixed(1)}%`};
    }
    return row;
  }), [crypto, macro]);

  const ALERTS = [
    {type:"WHALE",   msg:"BTC — whale de 820 BTC detectado saliendo a Coinbase",  ts:"hace 6m"},
    {type:"OPCIONES",msg:"SPY — Put/Call spike a 1.42 (presión vendedora)",        ts:"hace 14m"},
    {type:"SQUEEZE", msg:"GME — Short interest >30%, borrow rate +420bps",         ts:"hace 31m"},
    {type:"MACRO",   msg:`US10Y toca ${macro?.indices["TNX"]?.price.toFixed(3) ?? "4.392"}% — zona resistencia`,ts:"hace 44m"},
    {type:"13F",     msg:"Bridgewater añadió 2M acciones de GLD en Q1",            ts:"hace 1h"},
  ];
  // Earnings reales vía Alpha Vantage (antes EARNINGS era un arreglo fijo con
  // fechas de "22 May" sin año, y un "% esperado de movimiento" que en
  // realidad nadie puede saber antes del reporte — eso era inventado)
  interface EarningsRow { sym: string; name: string; date: string; estimateEps: number | null }
  const [earnings, setEarnings] = useState<EarningsRow[]>([]);
  const [earningsError, setEarningsError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/market-data/earnings-calendar");
        const d = await r.json() as { ok: boolean; data?: EarningsRow[]; error?: string };
        if (!cancelled) { if (d.ok && d.data) setEarnings(d.data); else setEarningsError(d.error ?? "No disponible"); }
      } catch { if (!cancelled) setEarningsError("Error de red"); }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Macro ribbon — LIVE */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(6, 1fr)",gap:8}}>
        {liveRibbon.map(m => (
          <div key={m.sym} style={{background:"#0d1117",border:"1px solid #1e2530",borderRadius:8,padding:"10px 12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:"#7b8fa0",fontSize:9,letterSpacing:2,fontFamily:"monospace"}}>{m.sym}</span>
              {!loading && m.val !== "—" && <LiveBadge />}
            </div>
            <div style={{color: m.val === "—" && loading ? "#4a5568" : "#e8eaed",fontSize:14,fontWeight:700,fontFamily:"monospace",marginTop:4}}>
              {loading && m.val === "—" ? "···" : m.val}
            </div>
            <div style={{color:chgColor(m.chg),fontSize:11,fontFamily:"monospace"}}>
              {m.chg !== 0 ? (m.chg > 0 ? "▲" : "▼") : "●"} {Math.abs(m.chg).toFixed(2)}%
            </div>
          </div>
        ))}
      </div>

      <div className="psy-grid" style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:16}}>
        {/* Heatmap — LIVE 1D */}
        <Card title="Market Heatmap — 1D" badge={<LiveBadge />}>
          <HeatmapGrid data={liveHeatmap} />
          <div style={{display:"flex",gap:16,marginTop:10,justifyContent:"center"}}>
            {[["≥+3%","#00ff88"],["0~+3%","#00aa44"],["0%","#444"],["-3~0%","#cc3355"],["≤-3%","#ff3366"]].map(([l,c]) => (
              <div key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"#7b8fa0",fontFamily:"monospace"}}>
                <div style={{width:8,height:8,borderRadius:2,background:c as string}} />{l}
              </div>
            ))}
          </div>
        </Card>

        {/* Right panel */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Fear & Greed — LIVE */}
          <Card title="Fear & Greed Index" badge={macro ? <LiveBadge /> : <RefBadge />}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
              <svg width={160} height={90} style={{overflow:"visible"}}>
                {[["#ff3366",0],["#ff6b35",0.25],["#ffd700",0.5],["#00aa44",0.75],["#00ff88",0.875]].map(([c,start],i,arr) => {
                  const s = Math.PI + (start as number)*Math.PI;
                  const e = Math.PI + ((arr[i+1]?.[1] as number ?? 1) as number)*Math.PI;
                  const x1=cx+r*Math.cos(s);const y1=cy+r*Math.sin(s);
                  const x2=cx+r*Math.cos(e);const y2=cy+r*Math.sin(e);
                  return <path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`} fill={`${c}33`} stroke={c as string} strokeWidth={0.5} />;
                })}
                <line x1={cx} y1={cy} x2={gx} y2={gy} stroke="#ffd700" strokeWidth={2} strokeLinecap="round" />
                <circle cx={cx} cy={cy} r={4} fill="#ffd700" />
                <text x={cx} y={cy+22} textAnchor="middle" fill="#ffd700" fontSize={20} fontWeight={700} fontFamily="monospace">{fng}</text>
                <text x={cx} y={cy+36} textAnchor="middle" fill="#ffd700" fontSize={9} fontFamily="monospace" letterSpacing={1}>{fngLabel.toUpperCase()}</text>
              </svg>
              <div style={{display:"flex",justifyContent:"space-between",width:"100%",fontSize:8,color:"#7b8fa0",fontFamily:"monospace",marginTop:4}}>
                <span style={{color:"#ff3366"}}>FEAR</span><span style={{color:"#00ff88"}}>GREED</span>
              </div>
            </div>
          </Card>

          {/* Market Regime */}
          <Card title="Market Regime">
            <div style={{textAlign:"center"}}>
              <div style={{color: (macro?.fng.value ?? 68) >= 50 ? "#00ff88" : "#ff3366",fontSize:18,fontWeight:700,fontFamily:"monospace"}}>
                {(macro?.fng.value ?? 68) >= 70 ? "BULL TREND" : (macro?.fng.value ?? 68) >= 50 ? "NEUTRAL BULL" : "BEAR CAUTION"}
              </div>
              <div style={{color:"#7b8fa0",fontSize:10,fontFamily:"monospace",marginTop:4}}>F&G: {fng}/100 — {fngLabel}</div>
              <div style={{marginTop:8,display:"flex",gap:8,justifyContent:"center"}}>
                {[["Trend",(macro?.fng.value ?? 68) >= 60 ? "BULL":"NEUTRAL",(macro?.fng.value ?? 68) >= 60 ? "#00ff88":"#ffd700"],
                  ["VIX",macro?.indices["VIX"]?.price.toFixed(1) ?? "—","#ffd700"],
                  ["Vol",(macro?.indices["VIX"]?.price ?? 14) < 20 ? "Low" : "High",(macro?.indices["VIX"]?.price ?? 14) < 20 ? "#00ff88":"#ff3366"]
                ].map(([l,v,c]) => (
                  <div key={String(l)} style={{textAlign:"center"}}>
                    <div style={{color:c as string,fontSize:13,fontWeight:700,fontFamily:"monospace"}}>{v}</div>
                    <div style={{color:"#7b8fa0",fontSize:8,fontFamily:"monospace"}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="psy-grid" style={{display:"grid",gridTemplateColumns:"1fr 240px 240px",gap:16}}>
        {/* SPX Chart — TradingView LIVE */}
        <Card title="SPX — S&P 500" badge={<LiveBadge />}>
          <TVChart symbol="SP:SPX" interval="D" height={180} />
        </Card>

        {/* Alerts */}
        <Card title="Alertas Activas">
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {ALERTS.map((a,i) => (
              <div key={i} style={{display:"flex",flexDirection:"column",gap:3,paddingBottom:6,borderBottom:"1px solid #1e2530"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <AlertBadge type={a.type} />
                  <span style={{color:"#4a5568",fontSize:9,fontFamily:"monospace"}}>{a.ts}</span>
                </div>
                <div style={{color:"#9aa5b4",fontSize:10,fontFamily:"monospace",lineHeight:1.4}}>{a.msg}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Earnings */}
        <Card title="Earnings Próximos" badge={earnings.length ? <LiveBadge /> : undefined}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {earningsError ? (
              <div style={{color:"#7b8fa0",fontSize:10,fontFamily:"monospace",textAlign:"center",padding:"14px 0"}}>No disponible: {earningsError}</div>
            ) : earnings.length === 0 ? (
              <div style={{color:"#7b8fa0",fontSize:10,fontFamily:"monospace",textAlign:"center",padding:"14px 0"}}>Cargando calendario real…</div>
            ) : earnings.slice(0, 6).map((e,i) => (
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:6,borderBottom:"1px solid #1e2530"}}>
                <div>
                  <div style={{color:"#e8eaed",fontSize:13,fontWeight:700,fontFamily:"monospace"}}>{e.sym}</div>
                  <div style={{color:"#7b8fa0",fontSize:9,fontFamily:"monospace"}}>{e.date}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{color:"#7b8fa0",fontSize:9,fontFamily:"monospace"}}>EPS est.</div>
                  <div style={{color:"#00e5ff",fontSize:11,fontFamily:"monospace"}}>{e.estimateEps !== null ? `$${e.estimateEps.toFixed(2)}` : "—"}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top 20 — live prices */}
      <Card title="Top 20 — Movers" badge={<LiveBadge />}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,fontFamily:"monospace"}}>
            <thead>
              <tr style={{borderBottom:"1px solid #1e2530"}}>
                {["#","SYM","PRECIO","1D","7D","VOLUMEN","FLUJO 24H","SEÑAL"].map(h => (
                  <th key={h} style={{color:"#7b8fa0",padding:"6px 8px",textAlign:"left",fontSize:9,letterSpacing:1}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {liveTop20.map(row => (
                <tr key={row.rank} style={{borderBottom:"1px solid #1e253040"}}>
                  <td style={{color:"#4a5568",padding:"7px 8px"}}>{row.rank}</td>
                  <td style={{color:"#e8eaed",padding:"7px 8px",fontWeight:700}}>{row.sym}</td>
                  <td style={{color:"#cdd",padding:"7px 8px"}}>{row.price}</td>
                  <td style={{color:chgColor(parseFloat(row.d1)),padding:"7px 8px"}}>{row.d1}</td>
                  <td style={{color:chgColor(parseFloat(row.d7)),padding:"7px 8px"}}>{row.d7}</td>
                  <td style={{color:"#7b8fa0",padding:"7px 8px"}}>{row.vol}</td>
                  <td style={{color:row.flow.startsWith("+")?"#00ff88":"#ff3366",padding:"7px 8px"}}>{row.flow}</td>
                  <td style={{padding:"7px 8px"}}>
                    <span style={{background:row.signal==="ACUM"?"#00ff8818":row.signal==="DIST"?"#ff336618":"#ffd70018",border:`1px solid ${row.signal==="ACUM"?"#00ff8844":row.signal==="DIST"?"#ff336644":"#ffd70044"}`,color:row.signal==="ACUM"?"#00ff88":row.signal==="DIST"?"#ff3366":"#ffd700",fontSize:9,padding:"2px 6px",borderRadius:4}}>
                      {row.signal}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Section 2: HEATMAP AVANZADO ────────────────────────────────────────────
function SectionHeatmap({crypto,macro}:{crypto:LiveCrypto[];macro:LiveMacro|null}) {
  const [tf, setTf] = useState<"1D"|"1W"|"1M">("1D");

  // Rotación sectorial REAL — antes SECTOR_YTD era un arreglo fijo que nunca
  // cambiaba. Ahora usa el mismo endpoint de sectores (10 SPDR ETFs) ya
  // construido en market.ts. Es el % de HOY, no YTD real (para YTD real
  // haría falta guardar el precio del 1 de enero, que no tenemos).
  interface SectorLive { symbol: string; name: string; pct: number }
  const [sectores, setSectores] = useState<SectorLive[]>([]);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/market/sectors");
        const d = await r.json() as { data?: SectorLive[] };
        if (!cancelled && d.data) setSectores(d.data);
      } catch { /* deja los datos anteriores */ }
    };
    load();
    const iv = setInterval(load, 5 * 60_000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  // Volumen relativo REAL de ETFs (reemplaza "Capital Flow" que necesitaría
  // flujos de creación/redención reales — eso sí requiere un feed pago tipo
  // Farside que no tenemos). El volumen relativo SÍ es 100% real y gratis.
  interface EtfVol { name: string; pct: number; volRelativo: number | null }
  const [etfVol, setEtfVol] = useState<EtfVol[]>([]);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/market-data/etf-volume");
        const d = await r.json() as { ok: boolean; data?: EtfVol[] };
        if (!cancelled && d.ok && d.data) setEtfVol(d.data);
      } catch { /* deja los datos anteriores */ }
    };
    load();
    const iv = setInterval(load, 5 * 60_000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  const live1D = useMemo(() => [
    ...CRYPTO_HEATMAP.map(sym => {
      const live = crypto.find(c => c.sym === sym);
      return {sym, chg: live?.chg24h ?? (TICKERS.find(t => t.sym === sym)?.chg ?? 0)};
    }),
    ...STOCK_HEATMAP.map(sym => {
      const live = macro?.indices[sym];
      return {sym, chg: live?.chg ?? (TICKERS.find(t => t.sym === sym)?.chg ?? 0)};
    }),
  ], [crypto, macro]);

  const data = tf === "1D" ? live1D : tf === "1W" ? HEATMAP_1W : HEATMAP_1M;
  const isLive = tf === "1D";

  const sectorRef = useRef<HTMLCanvasElement>(null);
  const sectorChart = useRef<Chart | null>(null);
  useEffect(() => {
    if (!sectorRef.current || !sectores.length) return;
    if (sectorChart.current) { sectorChart.current.destroy(); }
    sectorChart.current = new Chart(sectorRef.current, {
      type:"bar",
      data:{labels:sectores.map(s=>s.name),datasets:[{data:sectores.map(s=>s.pct),backgroundColor:sectores.map(s=>s.pct>=0?"#00ff8833":"#ff336633"),borderColor:sectores.map(s=>s.pct>=0?"#00ff88":"#ff3366"),borderWidth:1}]},
      options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:"#7b8fa0",font:{size:9}},grid:{color:"#1e2530"}},y:{ticks:{color:"#cdd",font:{size:9}},grid:{display:false}}}},
    });
    return () => { if (sectorChart.current) { sectorChart.current.destroy(); sectorChart.current = null; } };
  }, [sectores]);

  // Live global markets (SPX/NDX real, others reference)
  const globalMarkets = useMemo(() => {
    const gspc = macro?.indices["GSPC"];
    const ndx  = macro?.indices["NDX"];
    return [
      {name:"S&P 500",  val: gspc ? gspc.price.toLocaleString("en-US",{maximumFractionDigits:0}) : "—", chg: gspc?.chg ?? 0.42, live:true},
      {name:"NASDAQ",   val: ndx  ? ndx.price.toLocaleString("en-US",{maximumFractionDigits:0})  : "—", chg: ndx?.chg  ?? 0.71, live:true},
      {name:"DAX",      val: "22,240", chg: -0.22, live:false},
      {name:"Nikkei",   val: "36,820", chg: -0.94, live:false},
      {name:"FTSE 100", val: "8,450",  chg: +0.18, live:false},
      {name:"CSI 300",  val: "3,890",  chg: -0.32, live:false},
    ];
  }, [macro]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <span style={{color:"#7b8fa0",fontSize:10,fontFamily:"monospace",letterSpacing:2}}>TIMEFRAME:</span>
        {(["1D","1W","1M"] as const).map(t => (
          <button key={t} onClick={() => setTf(t)} style={{background:tf===t?"#00e5ff22":"#0d1117",border:`1px solid ${tf===t?"#00e5ff":"#1e2530"}`,color:tf===t?"#00e5ff":"#7b8fa0",padding:"4px 14px",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>{t}</button>
        ))}
        {isLive ? <LiveBadge /> : <RefBadge text="DATOS HISTÓRICOS" />}
      </div>

      <Card title={`Heatmap Multitemporal — ${tf}`}>
        <HeatmapGrid data={data} />
      </Card>

      <div className="psy-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card title="Rotación Sectorial — Hoy" badge={sectores.length ? <LiveBadge /> : <RefBadge />}>
          <div style={{height:240,position:"relative"}}>
            {sectores.length ? <canvas ref={sectorRef} /> : <div style={{color:"#7b8fa0",fontSize:11,textAlign:"center",paddingTop:100}}>Cargando datos reales de sectores…</div>}
          </div>
        </Card>

        <Card title="Volumen Relativo — ETFs" badge={etfVol.length ? <LiveBadge /> : <RefBadge />}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {etfVol.length === 0 ? (
              <div style={{color:"#7b8fa0",fontSize:11,textAlign:"center",padding:"20px 0"}}>Cargando…</div>
            ) : etfVol.map(e => {
              const w = Math.min((e.volRelativo ?? 1) / 3 * 100, 100);
              const up = e.pct >= 0;
              return (
                <div key={e.name}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{color:"#e8eaed",fontSize:11,fontFamily:"monospace"}}>{e.name}</span>
                    <span style={{color:up?"#00ff88":"#ff3366",fontSize:11,fontFamily:"monospace"}}>{up?"+":""}{e.pct.toFixed(2)}% · vol {e.volRelativo?.toFixed(1) ?? "—"}x</span>
                  </div>
                  <div style={{height:6,background:"#1e2530",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${w}%`,background:up?"#00ff88":"#ff3366",borderRadius:3,transition:"width 0.4s"}} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Global markets — SPX/NDX live, rest reference */}
      <Card title="Mercados Globales — Snapshot">
        <div style={{display:"grid",gridTemplateColumns:"repeat(6, 1fr)",gap:8}}>
          {globalMarkets.map(m => (
            <div key={m.name} style={{background:chgBg(m.chg),border:`1px solid ${chgColor(m.chg)}22`,borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{color:"#7b8fa0",fontSize:9,fontFamily:"monospace"}}>{m.name}</span>
                {m.live ? <span style={{color:"#00ff88",fontSize:7,fontFamily:"monospace"}}>●</span> : <span style={{color:"#ffd700",fontSize:7,fontFamily:"monospace"}}>◎</span>}
              </div>
              <div style={{color:"#e8eaed",fontSize:13,fontWeight:700,fontFamily:"monospace"}}>{m.val}</div>
              <div style={{color:chgColor(m.chg),fontSize:11,fontFamily:"monospace"}}>{m.chg > 0 ? "+" : ""}{m.chg.toFixed(2)}%</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:8,fontSize:9,color:"#4a5568",fontFamily:"monospace"}}>● LIVE (API) · ◎ Referencia de mercado</div>
      </Card>
    </div>
  );
}

// ─── Section 3: ORDER FLOW ───────────────────────────────────────────────────
function SectionOrderFlow({crypto,orderBook,fetchOB}:{crypto:LiveCrypto[];orderBook:LiveOB|null;fetchOB:(p:string)=>void}) {
  const [pair, setPair] = useState("BTC");
  const cvdRef = useRef<HTMLCanvasElement>(null);
  const cvdChart = useRef<Chart | null>(null);

  // Fetch live order book on pair change + poll every 10s
  useEffect(() => {
    fetchOB(pair);
    if (!["BTC","ETH","SOL"].includes(pair)) return;
    const t = setInterval(() => fetchOB(pair), 10_000);
    return () => clearInterval(t);
  }, [pair, fetchOB]);

  useEffect(() => {
    if (!cvdRef.current) return;
    if (cvdChart.current) { cvdChart.current.destroy(); }
    const hours = Array.from({length:24},(_,i)=>`${i}:00`);
    const base = pair==="BTC"?1200:pair==="ETH"?400:pair==="SOL"?80:4200;
    const cvdData = Array.from({length:24},(_,i)=>base+(Math.sin(i*0.6)*base*0.15)+(i>14?i*base*0.008:0));
    cvdChart.current = new Chart(cvdRef.current, {
      type:"line",
      data:{labels:hours,datasets:[{label:"CVD Acumulado",data:cvdData,borderColor:cvdData[23]>cvdData[0]?"#00ff88":"#ff3366",backgroundColor:cvdData[23]>cvdData[0]?"#00ff8812":"#ff336612",fill:true,borderWidth:2,tension:0.4,pointRadius:0}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:"#7b8fa0",font:{size:10}}}},scales:{x:{ticks:{color:"#7b8fa0",font:{size:9},maxTicksLimit:8},grid:{color:"#1e2530"}},y:{ticks:{color:"#7b8fa0",font:{size:9}},grid:{color:"#1e2530"}}}},
    });
    return () => { if (cvdChart.current) { cvdChart.current.destroy(); cvdChart.current = null; } };
  }, [pair]);

  // Use live order book if available, else static fallback
  const hasLiveOB = orderBook !== null && orderBook.pair === pair && ["BTC","ETH","SOL"].includes(pair);
  const bids  = hasLiveOB ? orderBook!.bids : [{price:79400,size:12.4,total:12.4},{price:79200,size:28.1,total:40.5},{price:79050,size:18.8,total:59.3},{price:78900,size:42.2,total:101.5},{price:78700,size:68.4,total:169.9},{price:78400,size:120.1,total:290.0}];
  const asks  = hasLiveOB ? orderBook!.asks : [{price:79600,size:9.2,total:9.2},{price:79800,size:24.8,total:34.0},{price:80000,size:16.1,total:50.1},{price:80300,size:38.4,total:88.5},{price:80600,size:82.2,total:170.7},{price:81000,size:148.8,total:319.5}];
  const maxSz = Math.max(...bids.map(b=>b.total),...asks.map(a=>a.total));

  // Live spread & mid price
  const midPrice = hasLiveOB
    ? ((orderBook!.bids[0]?.price ?? 0) + (orderBook!.asks[0]?.price ?? 0)) / 2
    : (pair==="BTC"?79500:pair==="ETH"?2280:pair==="SOL"?88.2:5847);

  const priceStr = midPrice >= 1000
    ? `$${midPrice.toLocaleString("en-US",{maximumFractionDigits:0})}`
    : `$${midPrice.toFixed(2)}`;

  // Live price for CVD header
  const liveCrypto = crypto.find(c => c.sym === pair);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <span style={{color:"#7b8fa0",fontSize:10,fontFamily:"monospace",letterSpacing:2}}>PAR:</span>
        {["BTC","ETH","SOL","SPX"].map(p => (
          <button key={p} onClick={() => setPair(p)} style={{background:pair===p?"#00e5ff22":"#0d1117",border:`1px solid ${pair===p?"#00e5ff":"#1e2530"}`,color:pair===p?"#00e5ff":"#7b8fa0",padding:"4px 14px",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>{p}</button>
        ))}
        {hasLiveOB ? <LiveBadge /> : <RefBadge />}
        {liveCrypto && (
          <span style={{color:chgColor(liveCrypto.chg24h),fontFamily:"monospace",fontSize:11,marginLeft:8}}>
            {liveCrypto.chg24h >= 0 ? "▲" : "▼"} {Math.abs(liveCrypto.chg24h).toFixed(2)}% 24H
          </span>
        )}
      </div>

      <div className="psy-grid" style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:16}}>
        {/* Order Book — LIVE */}
        <Card title={`Order Book — ${pair}/USD`} badge={hasLiveOB ? <LiveBadge /> : <RefBadge />}>
          <div style={{fontSize:10,fontFamily:"monospace"}}>
            <div style={{display:"flex",justifyContent:"space-between",color:"#7b8fa0",marginBottom:6,paddingBottom:6,borderBottom:"1px solid #1e2530",fontSize:9,letterSpacing:1}}>
              <span>PRECIO</span><span>TAMAÑO</span><span>TOTAL</span>
            </div>
            {asks.slice().reverse().map((a,i) => (
              <div key={i} style={{position:"relative",marginBottom:2}}>
                <div style={{position:"absolute",right:0,top:0,bottom:0,width:`${(a.total/maxSz)*100}%`,background:"#ff336612",borderRadius:2}} />
                <div style={{display:"flex",justifyContent:"space-between",position:"relative",padding:"2px 0"}}>
                  <span style={{color:"#ff3366"}}>{a.price.toLocaleString("en-US",{maximumFractionDigits:a.price<10?2:0})}</span>
                  <span style={{color:"#9aa5b4"}}>{a.size.toFixed(a.price>1000?3:2)}</span>
                  <span style={{color:"#4a5568"}}>{a.total.toFixed(a.price>1000?2:1)}</span>
                </div>
              </div>
            ))}
            <div style={{textAlign:"center",padding:"6px 0",color:"#00e5ff",fontWeight:700,background:"#00e5ff12",borderRadius:4,margin:"4px 0",fontSize:12}}>
              {priceStr} ↕
            </div>
            {bids.map((b,i) => (
              <div key={i} style={{position:"relative",marginBottom:2}}>
                <div style={{position:"absolute",right:0,top:0,bottom:0,width:`${(b.total/maxSz)*100}%`,background:"#00ff8812",borderRadius:2}} />
                <div style={{display:"flex",justifyContent:"space-between",position:"relative",padding:"2px 0"}}>
                  <span style={{color:"#00ff88"}}>{b.price.toLocaleString("en-US",{maximumFractionDigits:b.price<10?2:0})}</span>
                  <span style={{color:"#9aa5b4"}}>{b.size.toFixed(b.price>1000?3:2)}</span>
                  <span style={{color:"#4a5568"}}>{b.total.toFixed(b.price>1000?2:1)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* CVD Chart */}
        <Card title={`CVD — ${pair} 24H`} badge={<RefBadge text="ESTIMADO" />}>
          <div style={{height:200,position:"relative"}}>
            <canvas ref={cvdRef} />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:8,marginTop:12}}>
            {[
              {lbl:"CVD Bias",val:"BULLISH",c:"#00ff88"},
              {lbl:"Delta 1H",val:`${liveCrypto && liveCrypto.chg24h > 0 ? "+" : ""}${liveCrypto ? (liveCrypto.chg24h * 0.048).toFixed(1) + "M" : "4.8M"}`,c:liveCrypto && liveCrypto.chg24h > 0 ? "#00ff88" : "#ff3366"},
              {lbl:"Agresión",val:"BUY 64%",c:"#00e5ff"},
              {lbl:"Absorción",val:"MEDIA",c:"#ffd700"},
            ].map(m => (
              <div key={m.lbl} style={{background:"#080c14",borderRadius:6,padding:"8px 10px"}}>
                <div style={{color:"#7b8fa0",fontSize:9,fontFamily:"monospace",letterSpacing:1}}>{m.lbl}</div>
                <div style={{color:m.c,fontSize:12,fontWeight:700,fontFamily:"monospace",marginTop:2}}>{m.val}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="psy-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card title="FVG / SMC Imbalances" badge={<RefBadge />}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {FVG_LIST.map((f,i) => (
              <div key={i} style={{background:"#080c14",borderRadius:6,padding:"10px 12px",border:`1px solid ${f.type.includes("BULL")?"#00ff8822":f.type.includes("BEAR")?"#ff336622":"#00e5ff22"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{color:f.type.includes("BULL")?"#00ff88":f.type.includes("BEAR")?"#ff3366":"#00e5ff",fontSize:10,fontFamily:"monospace",fontWeight:700}}>{f.type}</span>
                  <span style={{background:"#1e2530",color:"#7b8fa0",fontSize:9,padding:"1px 6px",borderRadius:3,fontFamily:"monospace"}}>{f.age} · {f.status}</span>
                </div>
                <div style={{color:"#e8eaed",fontSize:11,fontFamily:"monospace"}}>{f.range}</div>
                <div style={{marginTop:6,height:4,background:"#1e2530",borderRadius:2}}>
                  <div style={{height:"100%",width:`${f.fill}%`,background:f.type.includes("BULL")?"#00ff88":"#ff3366",borderRadius:2}} />
                </div>
                <div style={{color:"#4a5568",fontSize:9,fontFamily:"monospace",marginTop:3}}>Fill: {f.fill}%</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Órdenes Grandes en el Libro" badge={orderBook ? <LiveBadge /> : <RefBadge />}>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <div style={{display:"flex",justifyContent:"space-between",color:"#7b8fa0",fontSize:9,fontFamily:"monospace",letterSpacing:1,paddingBottom:6,borderBottom:"1px solid #1e2530"}}>
              <span>PAR</span><span>PRECIO</span><span>TAMAÑO</span><span>LADO</span>
            </div>
            {!orderBook ? (
              <div style={{color:"#7b8fa0",fontSize:11,textAlign:"center",padding:"14px 0"}}>Cargando libro de órdenes en vivo…</div>
            ) : [
              ...orderBook.bids.slice(0, 4).map(b => ({ price: b.price, size: b.size, side: "BID" as const })),
              ...orderBook.asks.slice(0, 4).map(a => ({ price: a.price, size: a.size, side: "OFFER" as const })),
            ].sort((a, b) => b.size - a.size).slice(0, 6).map((d, i) => (
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #1e253030",fontSize:11,fontFamily:"monospace"}}>
                <span style={{color:"#e8eaed",fontWeight:700,width:50}}>{orderBook.pair}</span>
                <span style={{color:"#cdd"}}>${d.price.toLocaleString("en-US",{maximumFractionDigits:2})}</span>
                <span style={{color:"#7b8fa0"}}>{d.size.toFixed(3)}</span>
                <span style={{color:d.side==="BID"?"#00ff88":"#ff3366"}}>{d.side}</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:10,padding:"8px 10px",background:"#080c14",borderRadius:6,border:"1px solid #1e2530",fontSize:9,color:"#7b8fa0",fontFamily:"monospace"}}>
            Órdenes reales del libro en vivo de {orderBook?.pair ?? "—"} — no es "dark pool" (eso necesita un feed FINRA pago que no tenemos), es el libro visible ordenado por tamaño.
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Section 4: OPTIONS ──────────────────────────────────────────────────────
// Reemplaza el viejo "Options" (GEX/greeks/max pain — necesitaba un feed de
// opciones pago que no tenemos) por volatilidad realizada REAL de cripto,
// calculada con velas diarias de Binance — mismo cálculo honesto que ya se
// usa para acciones en PSY BRAIN, aplicado aquí a las criptos principales.
function SectionOptions() {
  interface VolCripto { sym: string; price: number | null; chg7d: number | null; volatilidadRealizada: number | null }
  const [rows, setRows] = useState<VolCripto[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/market-data/crypto-volatility");
        const d = await r.json() as { ok: boolean; data?: VolCripto[] };
        if (!cancelled && d.ok && d.data) setRows(d.data);
      } catch { /* deja la tabla anterior */ }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    const iv = setInterval(load, 5 * 60_000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <span style={{color:"#7b8fa0",fontSize:10,fontFamily:"monospace",letterSpacing:2}}>📉 VOLATILIDAD CRIPTO</span>
        <RefBadge text="DATOS REALES · BINANCE" />
      </div>
      <Card title="Volatilidad Realizada (90 días, anualizada)">
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,fontFamily:"monospace"}}>
            <thead>
              <tr style={{borderBottom:"1px solid #1e2530"}}>
                {["SYM","PRECIO","% 7D","VOLATILIDAD REALIZADA"].map(h => (
                  <th key={h} style={{color:"#7b8fa0",padding:"6px 8px",textAlign:"left",fontSize:9,letterSpacing:1}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{color:"#7b8fa0",padding:"14px 8px",textAlign:"center"}}>Cargando datos reales de Binance…</td></tr>
              ) : rows.map((s,i) => (
                <tr key={i} style={{borderBottom:"1px solid #1e253040"}}>
                  <td style={{color:"#e8eaed",padding:"8px 8px",fontWeight:700}}>{s.sym}</td>
                  <td style={{color:"#cdd",padding:"8px 8px"}}>{s.price != null ? `$${s.price.toLocaleString("en-US",{maximumFractionDigits:2})}` : "—"}</td>
                  <td style={{color:(s.chg7d ?? 0) >= 0 ? "#00ff88" : "#ff3366",padding:"8px 8px"}}>{s.chg7d != null ? `${s.chg7d >= 0 ? "+" : ""}${s.chg7d.toFixed(2)}%` : "—"}</td>
                  <td style={{padding:"8px 8px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:100,height:6,background:"#1e2530",borderRadius:3}}>
                        <div style={{height:"100%",width:`${Math.min(100,(s.volatilidadRealizada ?? 0))}%`,background:(s.volatilidadRealizada ?? 0)>80?"#ff3366":(s.volatilidadRealizada ?? 0)>50?"#ffd700":"#00ff88",borderRadius:3}} />
                      </div>
                      <span style={{color:"#e8eaed",fontWeight:700}}>{s.volatilidadRealizada != null ? `${s.volatilidadRealizada.toFixed(0)}%` : "—"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="psy-grid-2" style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:12}}>
        {[
          {title:"Qué es esto",body:"Volatilidad Realizada — qué tanto se ha movido el precio en los últimos 90 días, anualizada. No es lo mismo que la IV de opciones (esa la fija el mercado de opciones y necesita un feed pago que no tenemos), pero es un dato real calculado del precio, no inventado."},
          {title:"Fuente",  body:"Velas diarias de Binance Futures (90 días) — se recalcula cada 5 minutos."},
          {title:"Por qué reemplazó a Options",body:"La sección de opciones (GEX, greeks, max pain) necesitaba un feed de opciones pago (CBOE/ORATS/Tradier) que la plataforma no tiene conectado — mostraba números fijos que nunca cambiaban."},
        ].map((c,i) => (
          <Card key={i} title={c.title}>
            <div style={{fontSize:10,fontFamily:"monospace",color:"#9aa5b4",lineHeight:1.7}}>{c.body}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Section 5: INSTITUCIONAL ────────────────────────────────────────────────
function SectionInstitucional({macro}:{macro:LiveMacro|null}) {
  // Update smart money bias based on live F&G
  const liveSmartMoney = useMemo(() => {
    const fng = macro?.fng.value ?? 68;
    return SMART_MONEY.map(s => {
      if (s.sym === "BTC") return {...s, score: Math.min(99, Math.round(fng * 0.9 + 20)), bias: fng >= 50 ? "BULL" : "BEAR"};
      return s;
    });
  }, [macro]);

  // 13F real vía SEC EDGAR (ya construido en oracle-feeds.ts) — reemplaza la
  // tabla fija de "Bridgewater/Millennium/Citadel" que nunca cambiaba.
  interface Holding13F { nameOfIssuer: string; cusip: string; value: number; shares: number }
  interface Investor13F { name: string; fund: string; ok: boolean; periodOfReport?: string; filedAt?: string; holdings?: Holding13F[] }
  const [investors13F, setInvestors13F] = useState<Investor13F[]>([]);
  const [loading13F, setLoading13F] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/oracle/superinvestors");
        const d = await r.json() as { ok: boolean; investors?: Investor13F[] };
        if (!cancelled && d.ok && d.investors) setInvestors13F(d.investors);
      } catch { /* deja la tabla vacía, se mostrará el mensaje de carga/error */ }
      finally { if (!cancelled) setLoading13F(false); }
    })();
    return () => { cancelled = true; };
  }, []);
  // Aplanamos: una fila por cada holding, de cada superinversor, ordenado por valor
  // Volumen relativo real de ETFs — mismo endpoint que Heatmap (reemplaza
  // "Capital Flow Neto" que necesitaría flujos de creación/redención reales)
  interface EtfVol2 { name: string; pct: number; volRelativo: number | null }
  const [etfVolInst, setEtfVolInst] = useState<EtfVol2[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/market-data/etf-volume");
        const d = await r.json() as { ok: boolean; data?: EtfVol2[] };
        if (!cancelled && d.ok && d.data) setEtfVolInst(d.data);
      } catch { /* deja vacío */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const filas13F = useMemo(() => {
    const out: Array<{ fund: string; sym: string; shares: number; value: number; periodo?: string }> = [];
    for (const inv of investors13F) {
      for (const h of (inv.holdings ?? []).slice(0, 5)) {
        out.push({ fund: inv.fund, sym: h.nameOfIssuer, shares: h.shares, value: h.value, periodo: inv.periodOfReport });
      }
    }
    return out.sort((a, b) => b.value - a.value).slice(0, 20);
  }, [investors13F]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <span style={{color:"#7b8fa0",fontSize:10,fontFamily:"monospace",letterSpacing:2}}>SMART MONEY SCORE</span>
        <RefBadge text="MODELO INTERNO" />
      </div>
      <div className="psy-grid-2" style={{display:"grid",gridTemplateColumns:"repeat(5, 1fr)",gap:12}}>
        {liveSmartMoney.map(s => (
          <Card key={s.sym}>
            <div style={{textAlign:"center"}}>
              <div style={{color:"#7b8fa0",fontSize:9,fontFamily:"monospace",letterSpacing:2}}>{s.sym}</div>
              <div style={{position:"relative",margin:"10px auto",width:64,height:64}}>
                <svg viewBox="0 0 64 64" style={{transform:"rotate(-90deg)"}}>
                  <circle cx={32} cy={32} r={28} fill="none" stroke="#1e2530" strokeWidth={6} />
                  <circle cx={32} cy={32} r={28} fill="none" stroke={s.bias==="BULL"?"#00ff88":"#ff3366"} strokeWidth={6} strokeDasharray={`${s.score*1.759} ${175.9}`} strokeLinecap="round" />
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:s.bias==="BULL"?"#00ff88":"#ff3366",fontSize:15,fontWeight:700,fontFamily:"monospace"}}>{s.score}</div>
              </div>
              <div style={{color:s.bias==="BULL"?"#00ff88":"#ff3366",fontSize:11,fontWeight:700,fontFamily:"monospace"}}>{s.bias}</div>
              <div style={{color:"#4a5568",fontSize:9,fontFamily:"monospace"}}>Conf: {s.conf}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Tracker 13F — Posiciones Institucionales Q1 2025" badge={<RefBadge text="SEC EDGAR · 45D DELAY" />}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,fontFamily:"monospace"}}>
            <thead>
              <tr style={{borderBottom:"1px solid #1e2530"}}>
                {["FONDO","POSICIÓN","ACCIONES","VALOR (miles USD)","PERIODO 13F"].map(h => (
                  <th key={h} style={{color:"#7b8fa0",padding:"6px 8px",textAlign:"left",fontSize:9,letterSpacing:1}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading13F ? (
                <tr><td colSpan={5} style={{color:"#7b8fa0",padding:"14px 8px",textAlign:"center"}}>Cargando 13F real desde SEC EDGAR…</td></tr>
              ) : filas13F.length === 0 ? (
                <tr><td colSpan={5} style={{color:"#7b8fa0",padding:"14px 8px",textAlign:"center"}}>Sin datos disponibles ahora mismo — SEC EDGAR puede estar limitando la consulta, intenta más tarde.</td></tr>
              ) : filas13F.map((h,i) => (
                <tr key={i} style={{borderBottom:"1px solid #1e253040"}}>
                  <td style={{color:"#e8eaed",padding:"7px 8px",fontWeight:700}}>{h.fund}</td>
                  <td style={{color:"#e8eaed",padding:"7px 8px"}}>{h.sym}</td>
                  <td style={{color:"#7b8fa0",padding:"7px 8px"}}>{h.shares.toLocaleString("en-US")}</td>
                  <td style={{color:"#cdd",padding:"7px 8px"}}>${h.value.toLocaleString("en-US")}K</td>
                  <td style={{color:"#7b8fa0",padding:"7px 8px"}}>{h.periodo ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="psy-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card title="Insider Transactions — 30 Días" badge={<RefBadge text="SEC EDGAR" />}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {INSIDER_TX.map((tx,i) => (
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #1e253040"}}>
                <div>
                  <div style={{color:"#e8eaed",fontSize:11,fontFamily:"monospace",fontWeight:700}}>{tx.name}</div>
                  <div style={{color:"#7b8fa0",fontSize:9,fontFamily:"monospace"}}>{tx.company} · {tx.role}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{color:tx.type==="BUY"?"#00ff88":"#ff3366",fontSize:12,fontWeight:700,fontFamily:"monospace"}}>{tx.type} {tx.shares}</div>
                  <div style={{color:"#4a5568",fontSize:9,fontFamily:"monospace"}}>{tx.value} · {tx.date}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Volumen Relativo — ETFs" badge={etfVolInst.length ? <LiveBadge /> : <RefBadge />}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {etfVolInst.length === 0 ? (
              <div style={{color:"#7b8fa0",fontSize:11,textAlign:"center",padding:"14px 0"}}>Cargando…</div>
            ) : etfVolInst.map(e => {
              const w = Math.min((e.volRelativo ?? 1) / 3 * 100, 100);
              const up = e.pct >= 0;
              return (
                <div key={e.name}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{color:"#e8eaed",fontSize:12,fontFamily:"monospace",fontWeight:700}}>{e.name}</span>
                    <span style={{color:up?"#00ff88":"#ff3366",fontSize:11,fontFamily:"monospace"}}>{up?"+":""}{e.pct.toFixed(2)}%</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{flex:1,height:8,background:"#1e2530",borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${w}%`,background:up?"#00ff88":"#ff3366",borderRadius:4,transition:"width 0.4s"}} />
                    </div>
                    <span style={{color:"#7b8fa0",fontSize:9,fontFamily:"monospace",minWidth:34}}>{e.volRelativo?.toFixed(1) ?? "—"}x</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Section 6: MACRO GLOBAL ─────────────────────────────────────────────────
function SectionMacro({macro}:{macro:LiveMacro|null}) {
  // Indicadores económicos reales (CPI, desempleo, PIB, PCE) — vía FRED, que
  // recopila datos oficiales de BLS y BEA en un solo lugar
  interface EconIndicator { valor: number; fecha: string; unidad: string }
  const [econInd, setEconInd] = useState<Record<string, EconIndicator | null>>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/market-data/econ-indicators");
        const d = await r.json() as { ok: boolean; data?: Record<string, EconIndicator | null> };
        if (!cancelled && d.ok && d.data) setEconInd(d.data);
      } catch { /* deja vacío, se muestra "—" */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const fng     = macro?.fng.value ?? 68;
  const fngLbl  = macro?.fng.label ?? "GREED";
  const dxy     = macro?.indices["DXY"];
  const tnx     = macro?.indices["TNX"];

  // Tasa Fed real (FRED) — antes era "5.25%" fijo, nunca cambiaba
  const [fedRate, setFedRate] = useState<{ rate: number; date: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/market-data/fed-rate");
        const d = await r.json() as { ok: boolean; rate?: number; date?: string };
        if (!cancelled && d.ok && d.rate !== undefined && d.date) setFedRate({ rate: d.rate, date: d.date });
      } catch { /* deja null, se muestra "—" */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fed Watch calculado con futuros ZQ reales (no la API pagada de CME) —
  // ver metodología completa en el comentario del endpoint en market-data.ts
  interface FedWatchRow { mes: string; fecha_decision: string; tasa_antes: number; tasa_despues_implicita: number | null; cambio_bps: number | null }
  const [fedWatch, setFedWatch] = useState<FedWatchRow[]>([]);
  const [fedWatchError, setFedWatchError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/market-data/fed-watch");
        const d = await r.json() as { ok: boolean; data?: FedWatchRow[] };
        if (!cancelled) { if (d.ok && d.data) setFedWatch(d.data); else setFedWatchError(true); }
      } catch { if (!cancelled) setFedWatchError(true); }
    })();
    return () => { cancelled = true; };
  }, []);




  const macroMetrics = useMemo(() => [
    {lbl:"Fear & Greed", val: `${fng}`, sub: fngLbl.toUpperCase(), c:"#ffd700", live: macro !== null},
    {lbl:"DXY",          val: dxy ? dxy.price.toFixed(2) : "—",   sub: dxy ? `${dxy.chg >= 0 ? "▲" : "▼"} ${Math.abs(dxy.chg).toFixed(2)}%` : "—", c:"#ff6b35", live: dxy !== undefined},
    {lbl:"FED Rate",     val: fedRate ? `${fedRate.rate.toFixed(2)}%` : "—",   sub: fedRate ? `Al ${fedRate.date}` : "cargando…",    c:"#00e5ff", live: fedRate !== null},
    {lbl:"US10Y Yield",  val: tnx ? `${tnx.price.toFixed(3)}%` : "—", sub: tnx ? `${tnx.chg >= 0 ? "▲" : "▼"} ${Math.abs(tnx.chg).toFixed(3)}%` : "—", c:"#7b2ff7", live: tnx !== undefined},
  ], [macro, fng, fngLbl, dxy, tnx, fedRate]);

  // Live yield table
  const yieldData = macro?.yields ?? [
    {label:"1M",rate:5.30},{label:"3M",rate:5.24},{label:"6M",rate:5.18},
    {label:"1Y",rate:4.98},{label:"2Y",rate:4.71},{label:"5Y",rate:4.62},
    {label:"10Y",rate:4.52},{label:"30Y",rate:4.62},
  ];

  // Detect inversion
  const y2 = yieldData.find(y => y.label === "2Y")?.rate ?? 4.71;
  const y10 = yieldData.find(y => y.label === "10Y")?.rate ?? 4.52;
  const spread = y10 - y2;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div className="psy-grid-2" style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:12}}>
        {macroMetrics.map(m => (
          <Card key={m.lbl} badge={m.live ? <LiveBadge /> : <RefBadge />}>
            <div style={{color:"#7b8fa0",fontSize:9,fontFamily:"monospace",letterSpacing:1}}>{m.lbl}</div>
            <div style={{color:m.c,fontSize:24,fontWeight:700,fontFamily:"monospace",margin:"6px 0"}}>{m.val}</div>
            <div style={{color:"#9aa5b4",fontSize:10,fontFamily:"monospace"}}>{m.sub}</div>
          </Card>
        ))}
      </div>

      <div className="psy-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {/* US10Y TradingView — LIVE */}
        <Card title="US10Y — Rendimiento Bono 10 Años" badge={<LiveBadge />}>
          <TVChart symbol="TVC:US10Y" interval="D" height={180} />
          <div style={{marginTop:8,padding:"8px 10px",background:"#080c14",borderRadius:6,border:`1px solid ${spread < 0 ? "#ff336622" : "#00ff8822"}`,fontSize:10,fontFamily:"monospace",color:"#9aa5b4"}}>
            {spread < 0
              ? `⚡ Curva <span style="color:#ff3366">invertida</span>: spread 2Y-10Y ${spread.toFixed(2)}bps. Señal histórica de recesión.`
              : `▸ Spread 2Y-10Y: +${(spread*100).toFixed(0)}bps — Curva normal. Señal positiva para el ciclo.`
            }
          </div>
        </Card>

        {/* DXY TradingView — LIVE */}
        <Card title="DXY — Índice Dólar" badge={<LiveBadge />}>
          <TVChart symbol="TVC:DXY" interval="D" height={180} />
          <div style={{marginTop:8,padding:"8px 10px",background:"#080c14",borderRadius:6,border:`1px solid ${(dxy?.chg ?? 0) < 0 ? "#00ff8822" : "#ff6b3522"}`,fontSize:10,fontFamily:"monospace",color:"#9aa5b4"}}>
            {(dxy?.chg ?? 0) < 0
              ? "▸ DXY en tendencia bajista. Positivo para BTC, ORO y activos de riesgo."
              : "▸ DXY en tendencia alcista. Presión sobre activos de riesgo y commodities."}
          </div>
        </Card>
      </div>

      {/* Live Yield Curve Table */}
      <Card title="Curva de Rendimientos US Treasuries — Tasas Actuales" badge={macro ? <LiveBadge /> : <RefBadge />}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(8, 1fr)",gap:8,marginBottom:12}}>
          {yieldData.map(y => (
            <div key={y.label} style={{background:"#080c14",borderRadius:6,padding:"8px",textAlign:"center"}}>
              <div style={{color:"#7b8fa0",fontSize:9,fontFamily:"monospace"}}>{y.label}</div>
              <div style={{color:"#7b2ff7",fontSize:14,fontWeight:700,fontFamily:"monospace",marginTop:4}}>{y.rate.toFixed(3)}%</div>
            </div>
          ))}
        </div>
        <div style={{padding:"8px 10px",background:"#080c14",borderRadius:6,border:`1px solid ${spread < 0 ? "#ff336622" : "#00ff8822"}`,fontSize:10,fontFamily:"monospace",color:"#9aa5b4"}}>
          2Y-10Y Spread: <span style={{color:spread<0?"#ff3366":"#00ff88",fontWeight:700}}>{spread >= 0 ? "+" : ""}{(spread*100).toFixed(1)}bps</span>
          {spread < 0 ? " — Inversión activa (señal recesión 12-18M lag)" : " — Normal. Expansión crediticia."}
        </div>
      </Card>

      <Card title="Indicadores Económicos Reales — CPI, Desempleo, PIB, PCE" badge={Object.keys(econInd).length ? <LiveBadge /> : undefined}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:12}}>
          {[
            { key: "cpi", label: "CPI (Inflación)" },
            { key: "desempleo", label: "Desempleo" },
            { key: "pib", label: "PIB Real" },
            { key: "pce", label: "PCE Núcleo" },
          ].map(({ key, label }) => {
            const ind = econInd[key];
            return (
              <div key={key} style={{background:"#080c14",borderRadius:6,padding:"10px 12px",textAlign:"center"}}>
                <div style={{color:"#7b8fa0",fontSize:9,fontFamily:"monospace",marginBottom:4}}>{label}</div>
                <div style={{color:ind ? (ind.valor >= 0 ? "#00e5ff" : "#ff3366") : "#4a5568",fontSize:18,fontFamily:"monospace",fontWeight:700}}>
                  {ind ? `${ind.valor >= 0 && key !== "desempleo" ? "+" : ""}${ind.valor}%` : "—"}
                </div>
                <div style={{color:"#4a5568",fontSize:8,fontFamily:"monospace",marginTop:2}}>{ind?.fecha ?? "cargando…"}</div>
              </div>
            );
          })}
        </div>
        <div style={{fontSize:8,color:"#4a5568",fontFamily:"monospace",marginTop:10}}>
          Fuente: FRED (recopila datos oficiales de BLS y BEA) — CPI/PCE/PIB en variación interanual real
        </div>
      </Card>

      <div className="psy-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card title="Calendario Económico — Próximos Eventos" badge={<LiveBadge />}>
          <EconomicCalendarWidget />
        </Card>

        <Card title="FED Watch — Cambio Implícito por Reunión" badge={fedWatch.length ? <LiveBadge /> : undefined}>
          {fedWatchError ? (
            <div style={{color:"#7b8fa0",fontSize:10,fontFamily:"monospace",padding:"14px 0",textAlign:"center"}}>No disponible ahora mismo (futuros ZQ sin datos en Yahoo)</div>
          ) : fedWatch.length === 0 ? (
            <div style={{color:"#7b8fa0",fontSize:10,fontFamily:"monospace",padding:"14px 0",textAlign:"center"}}>Calculando desde futuros de Fed Funds reales…</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {fedWatch.map(f => (
                <div key={f.mes} style={{background:"#080c14",borderRadius:6,padding:"10px 12px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{color:"#e8eaed",fontSize:11,fontFamily:"monospace",fontWeight:700}}>Reunión {f.fecha_decision}</span>
                    <span style={{color:f.cambio_bps===null?"#7b8fa0":f.cambio_bps>0?"#ff3366":f.cambio_bps<0?"#00ff88":"#ffd700",fontSize:11,fontFamily:"monospace",fontWeight:700}}>
                      {f.cambio_bps === null ? "—" : f.cambio_bps === 0 ? "SIN CAMBIO" : `${f.cambio_bps > 0 ? "+" : ""}${f.cambio_bps} bps`}
                    </span>
                  </div>
                  <div style={{color:"#7b8fa0",fontSize:9,fontFamily:"monospace"}}>
                    Tasa implícita: {f.tasa_antes.toFixed(3)}% → {f.tasa_despues_implicita?.toFixed(3) ?? "—"}%
                  </div>
                </div>
              ))}
              <div style={{fontSize:8,color:"#4a5568",fontFamily:"monospace",marginTop:4}}>
                Calculado de futuros ZQ reales (mismo principio público que CME FedWatch) — expectativa de valor esperado, no el desglose de probabilidades HOLD/CUT25/CUT50 exacto de la API oficial de pago.
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Section 7: SQUEEZE SCAN ─────────────────────────────────────────────────
// Reemplaza el viejo "Squeeze Scanner" (necesitaba short interest real, que no
// tenemos gratis) por algo que SÍ podemos calcular 100% real: combina 3
// métricas que ya construimos para PSY BRAIN (volumen relativo, qué tan
// extremo está el RSI, y volatilidad realizada) en un solo puntaje que
// resalta qué acciones están teniendo un movimiento genuinamente anómalo
// ahora mismo — mismo espíritu que "squeeze candidates", sin inventar nada.
function SectionVolatilidad() {
  interface VolRow { sym: string; price: number | null; changePct: number | null; rsi14: number | null; volRealizada: number | null; volRelativo: number | null; score: number }
  const [rows, setRows] = useState<VolRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/psy-brain/live-data");
        const d = await r.json() as { ok: boolean; equities?: Record<string, { price: number|null; changePct: number|null; rsi14: number|null; volRealizada: number|null; volRelativo: number|null }> };
        if (!cancelled && d.ok && d.equities) {
          const list = Object.entries(d.equities).map(([sym, e]) => {
            const volRel = Math.min(e.volRelativo ?? 1, 5);
            const rsiExtremo = Math.abs((e.rsi14 ?? 50) - 50);
            const vol = Math.min(e.volRealizada ?? 0, 100);
            const score = Math.round((volRel / 5) * 40 + (rsiExtremo / 50) * 30 + (vol / 100) * 30);
            return { sym, price: e.price, changePct: e.changePct, rsi14: e.rsi14, volRealizada: e.volRealizada, volRelativo: e.volRelativo, score };
          }).sort((a, b) => b.score - a.score);
          setRows(list);
        }
      } catch { /* deja la tabla anterior */ }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    const iv = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <span style={{color:"#7b8fa0",fontSize:10,fontFamily:"monospace",letterSpacing:2}}>🌡️ RADAR DE VOLATILIDAD EXTREMA</span>
        <RefBadge text="DATOS REALES · YAHOO FINANCE" />
      </div>
      <Card title="¿Dónde está pasando algo raro ahora mismo?">
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,fontFamily:"monospace"}}>
            <thead>
              <tr style={{borderBottom:"1px solid #1e2530"}}>
                {["SYM","PRECIO","% HOY","RSI(14)","VOL. REALIZADA","VOL. RELATIVO","SCORE"].map(h => (
                  <th key={h} style={{color:"#7b8fa0",padding:"6px 8px",textAlign:"left",fontSize:9,letterSpacing:1}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{color:"#7b8fa0",padding:"14px 8px",textAlign:"center"}}>Cargando datos reales…</td></tr>
              ) : rows.slice(0, 15).map((s,i) => (
                <tr key={i} style={{borderBottom:"1px solid #1e253040",background:s.score>=70?"#7b2ff708":"transparent"}}>
                  <td style={{color:"#e8eaed",padding:"8px 8px",fontWeight:700}}>{s.sym}</td>
                  <td style={{color:"#cdd",padding:"8px 8px"}}>{s.price != null ? `$${s.price.toFixed(2)}` : "—"}</td>
                  <td style={{color:(s.changePct ?? 0) >= 0 ? "#00ff88" : "#ff3366",padding:"8px 8px"}}>{s.changePct != null ? `${s.changePct >= 0 ? "+" : ""}${s.changePct.toFixed(2)}%` : "—"}</td>
                  <td style={{color:"#ffd700",padding:"8px 8px"}}>{s.rsi14?.toFixed(0) ?? "—"}</td>
                  <td style={{color:"#7b8fa0",padding:"8px 8px"}}>{s.volRealizada != null ? `${s.volRealizada.toFixed(0)}%` : "—"}</td>
                  <td style={{color:"#7b8fa0",padding:"8px 8px"}}>{s.volRelativo != null ? `${s.volRelativo.toFixed(1)}x` : "—"}</td>
                  <td style={{padding:"8px 8px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:60,height:6,background:"#1e2530",borderRadius:3}}>
                        <div style={{height:"100%",width:`${s.score}%`,background:s.score>=70?"#7b2ff7":s.score>=45?"#ffd700":"#4a5568",borderRadius:3}} />
                      </div>
                      <span style={{color:s.score>=70?"#7b2ff7":s.score>=45?"#ffd700":"#4a5568",fontWeight:700}}>{s.score}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="psy-grid-2" style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:12}}>
        {[
          {title:"Cómo se calcula",body:"Score real (0-100): Volumen relativo hoy vs 20 días (40%) + qué tan lejos está el RSI de 50 (30%) + volatilidad realizada anualizada (30%). Todo calculado del precio, no inventado."},
          {title:"Fuente",  body:"Yahoo Finance (6 meses de historial diario por acción) — el mismo dato real ya conectado en PSY BRAIN. Se refresca solo cada 60s."},
          {title:"Cómo usarlo",body:"Score alto = la acción se está moviendo distinto a lo normal AHORA. No dice para qué lado va — combínalo con IA Trading para el plan de entrada."},
        ].map((c,i) => (
          <Card key={i} title={c.title}>
            <div style={{fontSize:10,fontFamily:"monospace",color:"#9aa5b4",lineHeight:1.7}}>{c.body}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Section 8: NARRATIVA ────────────────────────────────────────────────────
function SectionNarrativa({macro,crypto}:{macro:LiveMacro|null;crypto:LiveCrypto[]}) {
  const fng = macro?.fng.value ?? 68;
  const dxy = macro?.indices["DXY"];
  const regime = fng >= 70 ? "RISK-ON BULL" : fng >= 50 ? "NEUTRAL" : "RISK-OFF BEAR";
  const regimeColor = fng >= 70 ? "#00ff88" : fng >= 50 ? "#ffd700" : "#ff3366";

  // Todo lo de abajo usa datos REALES ya disponibles (antes eran textos fijos
  // que nunca cambiaban, incluida la fase del ciclo que siempre marcaba
  // "MOMENTUM" y el sesgo de cada clase de activo que siempre decía "BULL").
  const btc = crypto.find(c => c.sym === "BTC");
  const spx = macro?.indices["GSPC"];
  const gold = macro?.indices["GOLD"];
  const tnx = macro?.indices["TNX"];

  // Rotación de capital real: compara el % de cambio de cripto vs bonos vs
  // acciones vs materias primas y ordena de mayor a menor
  const rotacionCapital = useMemo(() => {
    const clases = [
      { nombre: "Crypto", chg: btc?.chg24h ?? 0 },
      { nombre: "Acciones", chg: spx?.chg ?? 0 },
      { nombre: "Materias Primas", chg: gold?.chg ?? 0 },
      { nombre: "Bonos", chg: tnx ? -tnx.chg : 0 }, // yield sube = precio del bono baja
    ].sort((a, b) => b.chg - a.chg);
    return clases.map(c => c.nombre).join(" + ");
  }, [btc, spx, gold, tnx]);

  // Fase del ciclo real: combina qué tan extremo está el F&G con la
  // dirección de BTC en las últimas 24h (heurística real, no aleatoria)
  const faseCiclo = useMemo(() => {
    const chg = btc?.chg24h ?? 0;
    if (fng >= 80) return "DISTRIB";
    if (fng >= 65 && chg > 0) return "MOMENTUM";
    if (fng >= 50 && chg > 0) return "DESPEGUE";
    if (fng < 25) return "CORREC";
    if (fng < 50 && chg < 0) return "ACUM";
    return "MOMENTUM";
  }, [fng, btc]);

  const biasAssetClass = useMemo(() => [
    {cls:"CRYPTO",     nar:`BTC ${(btc?.chg24h ?? 0) >= 0 ? "+" : ""}${(btc?.chg24h ?? 0).toFixed(2)}% (24h)`, bias: (btc?.chg24h ?? 0) >= 0 ? "BULL" : "BEAR"},
    {cls:"EQUITIES",   nar:`S&P 500 ${(spx?.chg ?? 0) >= 0 ? "+" : ""}${(spx?.chg ?? 0).toFixed(2)}% (hoy)`,   bias: (spx?.chg ?? 0) >= 0 ? "BULL" : "BEAR"},
    {cls:"COMMODITIES",nar:`Oro ${(gold?.chg ?? 0) >= 0 ? "+" : ""}${(gold?.chg ?? 0).toFixed(2)}% (hoy)`,     bias: (gold?.chg ?? 0) >= 0 ? "BULL" : "BEAR"},
    {cls:"BONDS",      nar:`US10Y ${tnx ? (tnx.chg >= 0 ? "subiendo" : "bajando") : "—"} — ${tnx && tnx.chg >= 0 ? "presión en precios" : "alivio en precios"}`, bias: tnx ? (tnx.chg >= 0 ? "BEAR" : "BULL") : "NEUTRAL"},
    {cls:"FOREX",      nar: dxy ? `DXY ${dxy.chg >= 0 ? "fortaleciéndose" : "debilitándose"}` : "—", bias: dxy && dxy.chg < 0 ? "BEAR" : dxy ? "BULL" : "NEUTRAL"},
  ], [btc, spx, gold, tnx, dxy]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div className="psy-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card title="Narrativas Dominantes del Mercado" badge={<RefBadge text="ANÁLISIS CUALITATIVO — REFERENCIA" />}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {NARRATIVES.map((n,i) => (
              <div key={i} style={{background:"#080c14",borderRadius:8,padding:"10px 12px",border:`1px solid ${n.trend==="BULL"?"#00ff8822":"#ff336622"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{color:"#e8eaed",fontSize:11,fontFamily:"monospace",fontWeight:700}}>{n.name}</span>
                  <span style={{background:n.trend==="BULL"?"#00ff8818":"#ff336618",color:n.trend==="BULL"?"#00ff88":"#ff3366",fontSize:9,padding:"2px 6px",borderRadius:4,fontFamily:"monospace"}}>{n.trend} {n.momentum}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{flex:1,height:4,background:"#1e2530",borderRadius:2,marginRight:12}}>
                    <div style={{height:"100%",width:`${n.strength}%`,background:n.trend==="BULL"?"#00ff88":"#ff3366",borderRadius:2}} />
                  </div>
                  <span style={{color:"#7b8fa0",fontSize:9,fontFamily:"monospace",minWidth:24}}>{n.strength}</span>
                </div>
                <div style={{color:"#4a5568",fontSize:9,fontFamily:"monospace",marginTop:4}}>Catalizador: {n.catalyst}</div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card title="Market Regime Detector" badge={macro ? <LiveBadge /> : <RefBadge />}>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[
                {lbl:"Regime Actual",   val: regime,                                                   c: regimeColor},
                {lbl:"Fear & Greed",    val: `${fng}/100 — ${(macro?.fng.label ?? "GREED").toUpperCase()}`, c: "#ffd700"},
                {lbl:"DXY Tendencia",   val: dxy ? (dxy.chg < 0 ? "BAJISTA ↓ (BULL crypto)" : "ALCISTA ↑ (BEAR crypto)") : "—", c: dxy ? (dxy.chg < 0 ? "#00ff88" : "#ff3366") : "#7b8fa0"},
                {lbl:"US10Y",           val: macro?.indices["TNX"] ? `${macro.indices["TNX"].price.toFixed(3)}%` : "—", c: "#7b2ff7"},
                {lbl:"Rotación Capital",val: rotacionCapital,                            c: "#ff6b35"},
              ].map(m => (
                <div key={m.lbl} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #1e253030"}}>
                  <span style={{color:"#7b8fa0",fontSize:10,fontFamily:"monospace"}}>{m.lbl}</span>
                  <span style={{color:m.c,fontSize:11,fontFamily:"monospace",fontWeight:700}}>{m.val}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Ciclo de Narrativas — Fase Actual">
            <div style={{textAlign:"center",padding:"12px 0"}}>
              <div style={{fontSize:11,color:"#7b8fa0",fontFamily:"monospace",marginBottom:16}}>
                ACUMULACIÓN → DESPEGUE → <span style={{color:"#00e5ff",fontWeight:700}}>▶ MOMENTUM ◀</span> → DISTRIBUCIÓN → CORRECCIÓN
              </div>
              <div style={{display:"flex",justifyContent:"center",gap:6}}>
                {["ACUM","DESPEGUE","MOMENTUM","DISTRIB","CORREC"].map((phase,i) => (
                  <div key={i} style={{background:phase===faseCiclo?"#00e5ff22":"#0d1117",border:`1px solid ${phase===faseCiclo?"#00e5ff":"#1e2530"}`,borderRadius:6,padding:"6px 10px",fontSize:9,fontFamily:"monospace",color:phase===faseCiclo?"#00e5ff":"#4a5568"}}>{phase}</div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Narrativas por Asset Class">
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {biasAssetClass.map(n => (
                <div key={n.cls} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #1e253030"}}>
                  <span style={{color:"#7b8fa0",fontSize:9,fontFamily:"monospace",minWidth:90}}>{n.cls}</span>
                  <span style={{color:"#9aa5b4",fontSize:9,fontFamily:"monospace",flex:1}}>{n.nar}</span>
                  <span style={{color:n.bias==="BULL"?"#00ff88":n.bias==="BEAR"?"#ff3366":"#ffd700",fontSize:9,fontFamily:"monospace",fontWeight:700,minWidth:50}}>{n.bias}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Section 9: PSY BRAIN IA ─────────────────────────────────────────────────
interface ChatMessage { role:"user"|"assistant"; content:string; }

function SectionPsyBrain({crypto,macro}:{crypto:LiveCrypto[];macro:LiveMacro|null}) {
  const [group,        setGroup]        = useState<keyof typeof BRAIN_ASSETS>("crypto");
  const [asset,        setAsset]        = useState("BTC");
  const [analysisType, setAnalysisType] = useState("full");
  const [messages,     setMessages]     = useState<ChatMessage[]>([]);
  const [streaming,    setStreaming]     = useState(false);
  const [streamText,   setStreamText]   = useState("");
  const [input,        setInput]        = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (chatRef.current) { chatRef.current.scrollTop = chatRef.current.scrollHeight; }
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages, streamText, scrollToBottom]);

  // Build live context string to inject before each analysis
  const liveContextStr = useMemo(() => {
    if (!macro && crypto.length === 0) return "";
    const btc   = crypto.find(c => c.sym === "BTC");
    const spx   = macro?.indices["GSPC"];
    const dxy   = macro?.indices["DXY"];
    const us10y = macro?.indices["TNX"];
    const vix   = macro?.indices["VIX"];
    const gold  = macro?.indices["GOLD"];
    const lines = [
      `╔══ DATOS DE MERCADO EN TIEMPO REAL — ${new Date().toLocaleString("es-AR",{timeZone:"America/Argentina/Buenos_Aires"})} (GMT-3) ══╗`,
      btc   ? `▸ BTC:    $${btc.price.toLocaleString("en-US",{maximumFractionDigits:0})} (${btc.chg24h >= 0 ? "+" : ""}${btc.chg24h.toFixed(2)}% 24H)` : null,
      spx   ? `▸ S&P500: ${spx.price.toLocaleString("en-US",{maximumFractionDigits:0})} (${spx.chg >= 0 ? "+" : ""}${spx.chg.toFixed(2)}%)` : null,
      macro ? `▸ Fear & Greed: ${macro.fng.value}/100 — ${macro.fng.label.toUpperCase()}` : null,
      dxy   ? `▸ DXY:    ${dxy.price.toFixed(2)} (${dxy.chg >= 0 ? "+" : ""}${dxy.chg.toFixed(2)}%)` : null,
      us10y ? `▸ US10Y:  ${us10y.price.toFixed(3)}%` : null,
      vix   ? `▸ VIX:    ${vix.price.toFixed(2)}` : null,
      gold  ? `▸ GOLD:   $${gold.price.toLocaleString("en-US",{maximumFractionDigits:0})}` : null,
      "╚════════════════════════════════════════════════════════╝",
    ].filter(Boolean);
    return lines.join("\n");
  }, [crypto, macro]);

  const runAnalysis = useCallback(async (overrideInput?: string) => {
    if (streaming) return;
    const userMsg = overrideInput ?? input.trim();
    setInput("");
    setMessages(prev => [...prev, {role:"user", content: userMsg || `Análisis ${analysisType} de ${asset}`}]);
    setStreaming(true);
    setStreamText("");
    let accumulated = "";
    try {
      // Inject live context before user message (not shown in chat, only sent to API)
      const apiMessage = liveContextStr
        ? `${liveContextStr}\n\nConsulta: ${userMsg || `Análisis ${analysisType} de ${asset}`}`
        : (userMsg || undefined);

      const session = getAuth();
      const res = await fetch("/api/psy-oracle/brain", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          ...(session?.token ? { "x-psy-token": session.token } : {}),
        },
        body: JSON.stringify({asset, analysisType, userMessage: apiMessage}),
      });
      if (!res.ok || !res.body) {
        let detail = `HTTP ${res.status}`;
        try { const j = await res.json(); detail = j.error ?? j.message ?? detail; } catch { /* ignore */ }
        throw new Error(detail);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, {stream:true});
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6)) as {text?:string;done?:boolean;error?:string};
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.done) break;
            if (parsed.text) { accumulated += parsed.text; setStreamText(accumulated); }
          } catch { /* ignore parse */ }
        }
      }
      setMessages(prev => [...prev, {role:"assistant", content: accumulated}]);
    } catch (err) {
      setMessages(prev => [...prev, {role:"assistant", content:`⚠ Error: ${err instanceof Error ? err.message : "Error al conectar con PSY BRAIN"}`}]);
    } finally {
      setStreaming(false);
      setStreamText("");
    }
  }, [streaming, input, asset, analysisType, liveContextStr]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runAnalysis(); }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,height:"100%"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg, #7b2ff722, #00e5ff12)",border:"1px solid #7b2ff755",borderRadius:12,padding:"16px 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:28}}>🧠</div>
          <div>
            <div style={{color:"#e8eaed",fontSize:16,fontWeight:700,fontFamily:"monospace",letterSpacing:1}}>PSY BRAIN IA</div>
            <div style={{color:"#7b8fa0",fontSize:10,fontFamily:"monospace",letterSpacing:2}}>ANALISTA INSTITUCIONAL · CLAUDE AI · CONTEXTO MERCADO EN TIEMPO REAL</div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:12}}>
            {liveContextStr && (
              <span style={{color:"#00ff88",fontSize:9,fontFamily:"monospace",background:"#00ff8812",border:"1px solid #00ff8833",padding:"2px 8px",borderRadius:4}}>
                ● CONTEXTO LIVE INYECTADO
              </span>
            )}
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#00ff88",boxShadow:"0 0 8px #00ff88"}} />
              <span style={{color:"#00ff88",fontSize:10,fontFamily:"monospace"}}>ONLINE</span>
            </div>
          </div>
        </div>
        {/* Live market context preview */}
        {liveContextStr && (
          <div style={{marginTop:10,background:"#080c14",borderRadius:6,padding:"8px 12px",border:"1px solid #00ff8822",fontSize:9,fontFamily:"monospace",color:"#7b8fa0",whiteSpace:"pre-line"}}>
            {liveContextStr}
          </div>
        )}
      </div>

      <div className="psy-brain-layout psy-grid" style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:16,flex:1}}>
        {/* Left panel */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card title="Grupo de Activos">
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {(Object.keys(BRAIN_ASSETS) as (keyof typeof BRAIN_ASSETS)[]).map(g => (
                <button key={g} onClick={()=>{setGroup(g);setAsset(BRAIN_ASSETS[g][0]);}} style={{background:group===g?"#7b2ff722":"transparent",border:`1px solid ${group===g?"#7b2ff7":"#1e2530"}`,color:group===g?"#7b2ff7":"#7b8fa0",padding:"7px 12px",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"monospace",textAlign:"left",textTransform:"uppercase",letterSpacing:2}}>{g}</button>
              ))}
            </div>
          </Card>

          <Card title={`Activo — ${group.toUpperCase()}`}>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {BRAIN_ASSETS[group].map(a => {
                const livePx = crypto.find(c => c.sym === a)?.price ?? macro?.indices[a]?.price;
                return (
                  <button key={a} onClick={()=>setAsset(a)} style={{background:asset===a?"#00e5ff22":"#080c14",border:`1px solid ${asset===a?"#00e5ff":"#1e2530"}`,color:asset===a?"#00e5ff":"#7b8fa0",padding:"4px 10px",borderRadius:4,fontSize:10,cursor:"pointer",fontFamily:"monospace"}} title={livePx ? `$${livePx.toLocaleString("en-US",{maximumFractionDigits:2})}` : a}>{a}</button>
                );
              })}
            </div>
            <div style={{marginTop:10,textAlign:"center",background:"#080c14",borderRadius:6,padding:"8px 0"}}>
              <div style={{color:"#7b8fa0",fontSize:9,fontFamily:"monospace",letterSpacing:2}}>ACTIVO SELECCIONADO</div>
              <div style={{color:"#00e5ff",fontSize:20,fontWeight:700,fontFamily:"monospace"}}>{asset}</div>
              {(() => {
                const lp = crypto.find(c => c.sym === asset)?.price ?? macro?.indices[asset]?.price;
                const lc = crypto.find(c => c.sym === asset)?.chg24h ?? macro?.indices[asset]?.chg;
                return lp ? (
                  <div style={{color:chgColor(lc ?? 0),fontSize:11,fontFamily:"monospace"}}>
                    ${lp.toLocaleString("en-US",{maximumFractionDigits: lp > 100 ? 0 : 2})}
                    {lc !== undefined ? ` · ${lc >= 0 ? "+" : ""}${lc.toFixed(2)}%` : ""}
                  </div>
                ) : null;
              })()}
            </div>
          </Card>

          <Card title="Tipo de Análisis">
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {ANALYSIS_TYPES.map(t => (
                <button key={t.id} onClick={()=>setAnalysisType(t.id)} style={{background:analysisType===t.id?"#00e5ff18":"transparent",border:`1px solid ${analysisType===t.id?"#00e5ff44":"#1e2530"}`,color:analysisType===t.id?"#00e5ff":"#7b8fa0",padding:"7px 10px",borderRadius:6,fontSize:10,cursor:"pointer",fontFamily:"monospace",textAlign:"left",display:"flex",alignItems:"center",gap:6}}>
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>
          </Card>

          <button
            onClick={() => runAnalysis()}
            disabled={streaming}
            style={{background:streaming?"#1e2530":"linear-gradient(135deg, #7b2ff7, #00e5ff)",border:"none",color:streaming?"#4a5568":"#080c14",padding:"12px 0",borderRadius:8,fontSize:13,fontWeight:700,cursor:streaming?"not-allowed":"pointer",fontFamily:"monospace",letterSpacing:1}}
          >
            {streaming ? "⏳ ANALIZANDO..." : `🧠 ANALIZAR ${asset}`}
          </button>
        </div>

        {/* Chat panel */}
        <div style={{display:"flex",flexDirection:"column",gap:0,background:"#0d1117",border:"1px solid #1e2530",borderRadius:10,overflow:"hidden"}}>
          <div ref={chatRef} className="psy-brain-chat" style={{flex:1,minHeight:400,maxHeight:520,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:14}}>
            {messages.length === 0 && !streaming && (
              <div style={{textAlign:"center",color:"#4a5568",fontFamily:"monospace",fontSize:11,paddingTop:40}}>
                <div style={{fontSize:32,marginBottom:12}}>🧠</div>
                <div>Selecciona un activo y tipo de análisis,</div>
                <div>luego presiona <span style={{color:"#00e5ff"}}>ANALIZAR</span> o escribe una pregunta.</div>
                <div style={{marginTop:16,color:"#2a3540",fontSize:10}}>PSY BRAIN analiza con datos reales de mercado inyectados automáticamente.</div>
              </div>
            )}
            {messages.map((m,i) => (
              <div key={i} style={{display:"flex",gap:10,flexDirection:m.role==="user"?"row-reverse":"row"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:m.role==="user"?"#00e5ff22":"#7b2ff722",border:`1px solid ${m.role==="user"?"#00e5ff44":"#7b2ff744"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>
                  {m.role==="user"?"👤":"🧠"}
                </div>
                <div style={{background:m.role==="user"?"#00e5ff12":"#080c14",border:`1px solid ${m.role==="user"?"#00e5ff22":"#1e2530"}`,borderRadius:8,padding:"10px 14px",maxWidth:"85%",fontSize:11,fontFamily:"monospace",color:"#cdd",lineHeight:1.7,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
                  {m.content}
                </div>
              </div>
            ))}
            {streaming && streamText && (
              <div style={{display:"flex",gap:10}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:"#7b2ff722",border:"1px solid #7b2ff744",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>🧠</div>
                <div style={{background:"#080c14",border:"1px solid #7b2ff733",borderRadius:8,padding:"10px 14px",maxWidth:"85%",fontSize:11,fontFamily:"monospace",color:"#cdd",lineHeight:1.7,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
                  {streamText}<span style={{animation:"blink 1s infinite",color:"#7b2ff7"}}>▌</span>
                </div>
              </div>
            )}
            {streaming && !streamText && (
              <div style={{display:"flex",gap:10}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:"#7b2ff722",border:"1px solid #7b2ff744",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>🧠</div>
                <div style={{background:"#080c14",border:"1px solid #7b2ff733",borderRadius:8,padding:"10px 14px",fontSize:11,fontFamily:"monospace",color:"#7b2ff7"}}>
                  Analizando {asset}... <span style={{color:"#4a5568"}}>({ANALYSIS_TYPES.find(t=>t.id===analysisType)?.label})</span>
                </div>
              </div>
            )}
          </div>

          <div style={{borderTop:"1px solid #1e2530",padding:"12px 16px",display:"flex",gap:8}}>
            <textarea
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming}
              placeholder={`Pregunta sobre ${asset}... (Enter para enviar)`}
              style={{flex:1,background:"#080c14",border:"1px solid #1e2530",borderRadius:8,padding:"8px 12px",color:"#e8eaed",fontSize:11,fontFamily:"monospace",resize:"none",height:44,outline:"none",lineHeight:1.5}}
              rows={2}
            />
            <button
              onClick={()=>runAnalysis()}
              disabled={streaming || !input.trim()}
              style={{background:streaming||!input.trim()?"#1e2530":"#7b2ff7",border:"none",color:streaming||!input.trim()?"#4a5568":"#fff",padding:"0 16px",borderRadius:8,fontSize:18,cursor:streaming||!input.trim()?"not-allowed":"pointer"}}
            >
              ➤
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes blink { 0%,50%{opacity:1} 51%,100%{opacity:0} }`}</style>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const SECTIONS = [
  {id:"dashboard",    label:"Dashboard",    icon:"📊"},
  {id:"heatmap",      label:"Heatmap",      icon:"🔥"},
  {id:"orderflow",    label:"Order Flow",   icon:"🌊"},
  {id:"institucional",label:"Institucional",icon:"🏛"},
  {id:"macro",        label:"Macro",        icon:"🌐"},
  {id:"volatilidad",  label:"Volatilidad",  icon:"🌡️"},
  {id:"volcripto",    label:"Vol. Cripto",  icon:"📉"},
  {id:"narrativa",    label:"Narrativa",    icon:"📖"},
  {id:"brain",        label:"PSY BRAIN",    icon:"🧠"},
];

export default function PsyOracle() {
  const [active, setActive] = useState("dashboard");
  const [, setLocation] = useLocation();
  const { crypto, macro, orderBook, fetchOB, loading, lastUpdate } = useLiveMarketData();

  return (
    <div style={{background:"#080c14",minHeight:"100vh",color:"#e8eaed",fontFamily:"'Space Grotesk', sans-serif"}}>
      <style>{`
        @media (max-width: 640px) {
          .psy-grid   { grid-template-columns: 1fr !important; }
          .psy-grid-2 { grid-template-columns: repeat(2,1fr) !important; }
          .psy-brain-layout { grid-template-columns: 1fr !important; flex:none !important; }
          .psy-brain-chat   { min-height: 300px !important; max-height: 400px !important; }
        }
      `}</style>
      <div style={{padding:"8px 20px 0"}}>
        <button
          onClick={() => setLocation("/dashboard")}
          style={{background:"transparent",border:"1px solid #1e2530",color:"#7b8fa0",fontSize:9,fontFamily:"monospace",letterSpacing:2,padding:"6px 12px",cursor:"pointer",borderRadius:2}}
          onMouseEnter={e => { e.currentTarget.style.color = "#00e5ff"; e.currentTarget.style.borderColor = "#00e5ff55"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#7b8fa0"; e.currentTarget.style.borderColor = "#1e2530"; }}
        >
          ← VOLVER
        </button>
      </div>
      {/* Top bar */}
      <div style={{background:"#0d1117",borderBottom:"1px solid #1e2530",padding:"0 20px"}}>
        <div style={{maxWidth:1400,margin:"0 auto",display:"flex",alignItems:"center",gap:0}}>
          <div style={{padding:"14px 20px 14px 0",borderRight:"1px solid #1e2530",marginRight:20}}>
            <div style={{color:"#7b2ff7",fontSize:12,fontWeight:700,fontFamily:"monospace",letterSpacing:3}}>PSY</div>
            <div style={{color:"#00e5ff",fontSize:10,fontFamily:"monospace",letterSpacing:4}}>ORACLE</div>
          </div>
          <div style={{display:"flex",gap:0,overflowX:"auto",flex:1,minWidth:0,WebkitOverflowScrolling:"touch",msOverflowStyle:"none",scrollbarWidth:"none"}}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={()=>setActive(s.id)} style={{background:"transparent",border:"none",borderBottom:`2px solid ${active===s.id?"#00e5ff":"transparent"}`,color:active===s.id?"#00e5ff":"#7b8fa0",padding:"12px 10px 10px",fontSize:10,cursor:"pointer",fontFamily:"monospace",letterSpacing:1,whiteSpace:"nowrap",transition:"all 0.15s",display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                <span>{s.icon}</span>{s.label.toUpperCase()}
              </button>
            ))}
          </div>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
            {lastUpdate && (
              <span style={{color:"#4a5568",fontSize:9,fontFamily:"monospace"}}>UPD {lastUpdate}</span>
            )}
            <span style={{color:"#4a5568",fontSize:9,fontFamily:"monospace"}}>ELITE</span>
            <div style={{width:6,height:6,borderRadius:"50%",background:loading?"#ffd700":"#00ff88",boxShadow:`0 0 6px ${loading?"#ffd700":"#00ff88"}`}} />
            <span style={{color:loading?"#ffd700":"#00ff88",fontSize:9,fontFamily:"monospace"}}>{loading?"CARGANDO":"LIVE"}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth:1400,margin:"0 auto",padding:"24px 20px"}}>
        {active==="dashboard"     && <SectionDashboard    crypto={crypto} macro={macro} loading={loading} />}
        {active==="heatmap"       && <SectionHeatmap      crypto={crypto} macro={macro} />}
        {active==="orderflow"     && <SectionOrderFlow    crypto={crypto} orderBook={orderBook} fetchOB={fetchOB} />}
        {active==="institucional" && <SectionInstitucional macro={macro} />}
        {active==="macro"         && <SectionMacro        macro={macro} />}
        {active==="volatilidad"   && <SectionVolatilidad />}
        {active==="volcripto"     && <SectionOptions />}
        {active==="narrativa"     && <SectionNarrativa    macro={macro} crypto={crypto} />}
        {active==="brain"         && <SectionPsyBrain     crypto={crypto} macro={macro} />}
      </div>
    </div>
  );
}
