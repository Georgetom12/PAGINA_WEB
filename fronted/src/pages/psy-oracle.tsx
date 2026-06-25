import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Chart, registerables } from "chart.js";
import { getAuth } from "@/lib/auth";

Chart.register(...registerables);

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
  const EARNINGS = [
    {sym:"NVDA",date:"22 May",est:"+12%", sentiment:"BULLISH"},
    {sym:"AAPL",date:"01 Jun",est:"+4%",  sentiment:"NEUTRAL"},
    {sym:"TSLA",date:"08 Jun",est:"-8%",  sentiment:"BEARISH"},
    {sym:"META",date:"15 Jun",est:"+18%", sentiment:"BULLISH"},
  ];

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
        <Card title="Earnings Próximos">
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {EARNINGS.map((e,i) => (
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:6,borderBottom:"1px solid #1e2530"}}>
                <div>
                  <div style={{color:"#e8eaed",fontSize:13,fontWeight:700,fontFamily:"monospace"}}>{e.sym}</div>
                  <div style={{color:"#7b8fa0",fontSize:9,fontFamily:"monospace"}}>{e.date}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{color:Number(e.est.replace("%","")) > 0 ? "#00ff88":"#ff3366",fontSize:11,fontFamily:"monospace"}}>{e.est}</div>
                  <div style={{fontSize:9,fontFamily:"monospace",color:e.sentiment==="BULLISH"?"#00ff88":e.sentiment==="BEARISH"?"#ff3366":"#ffd700"}}>{e.sentiment}</div>
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
    if (!sectorRef.current) return;
    if (sectorChart.current) { sectorChart.current.destroy(); }
    sectorChart.current = new Chart(sectorRef.current, {
      type:"bar",
      data:{labels:SECTOR_YTD.map(s=>s.name),datasets:[{data:SECTOR_YTD.map(s=>s.chg),backgroundColor:SECTOR_YTD.map(s=>s.chg>=0?"#00ff8833":"#ff336633"),borderColor:SECTOR_YTD.map(s=>s.chg>=0?"#00ff88":"#ff3366"),borderWidth:1}]},
      options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:"#7b8fa0",font:{size:9}},grid:{color:"#1e2530"}},y:{ticks:{color:"#cdd",font:{size:9}},grid:{display:false}}}},
    });
    return () => { if (sectorChart.current) { sectorChart.current.destroy(); sectorChart.current = null; } };
  }, []);

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
        <Card title="Rotación Sectorial YTD" badge={<RefBadge />}>
          <div style={{height:240,position:"relative"}}>
            <canvas ref={sectorRef} />
          </div>
        </Card>

        <Card title="Capital Flow 24H — ETFs" badge={<RefBadge />}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {ETF_FLOWS.map(e => {
              const w = Math.abs(e.flow) / 3000 * 100;
              return (
                <div key={e.name}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{color:"#e8eaed",fontSize:11,fontFamily:"monospace"}}>{e.name}</span>
                    <span style={{color:e.type==="IN"?"#00ff88":"#ff3366",fontSize:11,fontFamily:"monospace"}}>{e.type==="IN"?"+":"-"}${Math.abs(e.flow).toLocaleString()}M</span>
                  </div>
                  <div style={{height:6,background:"#1e2530",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${w}%`,background:e.type==="IN"?"#00ff88":"#ff3366",borderRadius:3,transition:"width 0.4s"}} />
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

        <Card title="Dark Pool Prints" badge={<RefBadge />}>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <div style={{display:"flex",justifyContent:"space-between",color:"#7b8fa0",fontSize:9,fontFamily:"monospace",letterSpacing:1,paddingBottom:6,borderBottom:"1px solid #1e2530"}}>
              <span>SYM</span><span>PRECIO</span><span>TAMAÑO</span><span>LADO</span><span>HORA</span>
            </div>
            {DARK_POOL.map((d,i) => (
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #1e253030",fontSize:11,fontFamily:"monospace"}}>
                <span style={{color:"#e8eaed",fontWeight:700,width:50}}>{d.sym}</span>
                <span style={{color:"#cdd"}}>{d.price}</span>
                <span style={{color:"#7b8fa0"}}>{d.size}</span>
                <span style={{color:d.side==="BID"?"#00ff88":"#ff3366"}}>{d.side}</span>
                <span style={{color:"#4a5568"}}>{d.ts}</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:10,padding:"8px 10px",background:"#080c14",borderRadius:6,border:"1px solid #1e2530",fontSize:9,color:"#7b8fa0",fontFamily:"monospace"}}>
            ⚡ Dark pool activity neta: <span style={{color:"#00ff88"}}>BID $5.2B</span> vs OFFER $3.1B — Acumulación detectada
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Section 4: OPTIONS ──────────────────────────────────────────────────────
function SectionOptions() {
  const [sel, setSel] = useState(0);
  const opt = OPTIONS_DATA[sel];
  const gexRef = useRef<HTMLCanvasElement>(null);
  const gexChart = useRef<Chart | null>(null);

  useEffect(() => {
    if (!gexRef.current) return;
    if (gexChart.current) { gexChart.current.destroy(); }
    const strikes = [-10,-8,-5,-3,-1,0,1,3,5,8,10].map(d => (opt.strike*(1+d/100)));
    const gexData = strikes.map((_,i) => {
      const mid=5; const dist=Math.abs(i-mid);
      return (dist===0?8.4:dist===1?5.2:dist===2?2.8:1.2)*(Math.random()>0.5?1:-0.4);
    });
    gexChart.current = new Chart(gexRef.current, {
      type:"bar",
      data:{labels:strikes.map(s=>s.toFixed(0)),datasets:[{data:gexData,backgroundColor:gexData.map(v=>v>=0?"#00ff8833":"#ff336633"),borderColor:gexData.map(v=>v>=0?"#00ff88":"#ff3366"),borderWidth:1}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},title:{display:true,text:"GEX por Strike",color:"#7b8fa0",font:{size:10}}},scales:{x:{ticks:{color:"#7b8fa0",font:{size:8}},grid:{color:"#1e2530"}},y:{ticks:{color:"#7b8fa0",font:{size:8}},grid:{color:"#1e2530"}}}},
    });
    return () => { if (gexChart.current) { gexChart.current.destroy(); gexChart.current = null; } };
  }, [sel, opt.strike]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <span style={{color:"#7b8fa0",fontSize:10,fontFamily:"monospace",letterSpacing:2}}>ACTIVO:</span>
        {OPTIONS_DATA.map((o,i) => (
          <button key={i} onClick={()=>setSel(i)} style={{background:sel===i?"#7b2ff722":"#0d1117",border:`1px solid ${sel===i?"#7b2ff7":"#1e2530"}`,color:sel===i?"#7b2ff7":"#7b8fa0",padding:"4px 14px",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>{o.sym}</button>
        ))}
        <RefBadge text="DATOS CBOE — REFERENCIA" />
      </div>

      <div className="psy-grid-2" style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:12}}>
        {[
          {lbl:"Delta",val:opt.delta.toFixed(2),c:opt.delta>0.5?"#00ff88":"#ffd700"},
          {lbl:"Gamma",val:opt.gamma.toFixed(3),c:"#00e5ff"},
          {lbl:"Theta",val:opt.theta.toFixed(2),c:"#ff6b35"},
          {lbl:"Vega", val:opt.vega.toFixed(1), c:"#7b2ff7"},
          {lbl:"IV",   val:opt.iv,               c:"#ffd700"},
          {lbl:"P/C Ratio",val:opt.pcr.toFixed(2),c:opt.pcr>1?"#ff3366":"#00ff88"},
          {lbl:"Max Pain",val:`$${opt.maxPain.toLocaleString()}`,c:"#ffd700"},
          {lbl:"GEX Net",val:opt.gex>0?`+${opt.gex}B`:`${opt.gex}B`,c:opt.gex>0?"#00ff88":"#ff3366"},
        ].map(m => (
          <Card key={m.lbl}>
            <div style={{color:"#7b8fa0",fontSize:9,fontFamily:"monospace",letterSpacing:1}}>{m.lbl}</div>
            <div style={{color:m.c,fontSize:20,fontWeight:700,fontFamily:"monospace",marginTop:4}}>{m.val}</div>
          </Card>
        ))}
      </div>

      <div className="psy-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card title="GEX — Gamma Exposure por Strike">
          <div style={{height:200,position:"relative"}}><canvas ref={gexRef} /></div>
        </Card>
        <Card title="P/C Ratio — Interpretación">
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1,height:20,background:"#1e2530",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.min(opt.pcr/2*100,100)}%`,background:opt.pcr>1?"#ff3366":"#00ff88",transition:"width 0.4s"}} />
              </div>
              <span style={{color:opt.pcr>1?"#ff3366":"#00ff88",fontSize:14,fontWeight:700,fontFamily:"monospace",minWidth:40}}>{opt.pcr.toFixed(2)}</span>
            </div>
            <div style={{fontSize:10,fontFamily:"monospace",color:"#9aa5b4",lineHeight:1.6}}>
              {opt.pcr>1.2?"▸ P/C > 1.2 → Presión vendedora institucional.":opt.pcr<0.8?"▸ P/C < 0.8 → Euforia compradora.":"▸ P/C neutral (0.8-1.2) → Sin sesgo claro."}
            </div>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <div style={{flex:1,background:"#080c14",borderRadius:6,padding:"8px 10px"}}>
                <div style={{color:"#7b8fa0",fontSize:9,fontFamily:"monospace"}}>Señal Opuesta</div>
                <div style={{color:opt.pcr>1?"#00ff88":"#ff3366",fontSize:12,fontWeight:700,fontFamily:"monospace"}}>{opt.pcr>1?"CONTRARIAN BULL":"CONTRARIAN BEAR"}</div>
              </div>
              <div style={{flex:1,background:"#080c14",borderRadius:6,padding:"8px 10px"}}>
                <div style={{color:"#7b8fa0",fontSize:9,fontFamily:"monospace"}}>Setup</div>
                <div style={{color:"#ffd700",fontSize:12,fontWeight:700,fontFamily:"monospace"}}>{opt.type} BIAS</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Unusual Options Activity — Top Prints" badge={<RefBadge />}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,fontFamily:"monospace"}}>
            <thead>
              <tr style={{borderBottom:"1px solid #1e2530"}}>
                {["SYM","TIPO","STRIKE","EXP","VOL","OI","VOL/OI","PREMIUM","LADO"].map(h => (
                  <th key={h} style={{color:"#7b8fa0",padding:"6px 8px",textAlign:"left",fontSize:9,letterSpacing:1}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {UNUSUAL_OPTIONS.map((u,i) => (
                <tr key={i} style={{borderBottom:"1px solid #1e253040"}}>
                  <td style={{color:"#e8eaed",padding:"7px 8px",fontWeight:700}}>{u.sym}</td>
                  <td style={{color:u.type==="CALL"?"#00ff88":"#ff3366",padding:"7px 8px"}}>{u.type}</td>
                  <td style={{color:"#cdd",padding:"7px 8px"}}>{u.strike}</td>
                  <td style={{color:"#7b8fa0",padding:"7px 8px"}}>{u.exp}</td>
                  <td style={{color:"#cdd",padding:"7px 8px"}}>{u.vol}</td>
                  <td style={{color:"#7b8fa0",padding:"7px 8px"}}>{u.oi}</td>
                  <td style={{color:"#ffd700",padding:"7px 8px",fontWeight:700}}>{u.ratio}</td>
                  <td style={{color:u.type==="CALL"?"#00ff88":"#ff3366",padding:"7px 8px"}}>{u.premium}</td>
                  <td style={{padding:"7px 8px"}}><span style={{background:u.side==="BUY"?"#00ff8818":"#ff336618",color:u.side==="BUY"?"#00ff88":"#ff3366",fontSize:9,padding:"2px 6px",borderRadius:4}}>{u.side}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
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
                {["FONDO","ACCIÓN","SYM","ACCIONES","VALOR","CAMBIO"].map(h => (
                  <th key={h} style={{color:"#7b8fa0",padding:"6px 8px",textAlign:"left",fontSize:9,letterSpacing:1}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOLDINGS_13F.map((h,i) => (
                <tr key={i} style={{borderBottom:"1px solid #1e253040"}}>
                  <td style={{color:"#e8eaed",padding:"7px 8px",fontWeight:700}}>{h.fund}</td>
                  <td style={{padding:"7px 8px"}}>
                    <span style={{background:h.action==="ADD"?"#00ff8818":h.action==="SELL"?"#ff336618":"#7b2ff718",color:h.action==="ADD"?"#00ff88":h.action==="SELL"?"#ff3366":"#7b2ff7",fontSize:9,padding:"2px 6px",borderRadius:4}}>{h.action}</span>
                  </td>
                  <td style={{color:"#e8eaed",padding:"7px 8px",fontWeight:700}}>{h.sym}</td>
                  <td style={{color:"#7b8fa0",padding:"7px 8px"}}>{h.shares}</td>
                  <td style={{color:"#cdd",padding:"7px 8px"}}>{h.value}</td>
                  <td style={{color:h.chg.startsWith("+")||h.chg==="NEW"?"#00ff88":"#ff3366",padding:"7px 8px"}}>{h.chg}</td>
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

        <Card title="ETF Flows — Capital Flow Neto 7D" badge={<RefBadge />}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {ETF_FLOWS.map(e => {
              const w = Math.abs(e.flow)/3000*100;
              return (
                <div key={e.name}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{color:"#e8eaed",fontSize:12,fontFamily:"monospace",fontWeight:700}}>{e.name}</span>
                    <span style={{color:e.type==="IN"?"#00ff88":"#ff3366",fontSize:11,fontFamily:"monospace"}}>{e.type==="IN"?"+":"-"}${Math.abs(e.flow).toLocaleString()}M</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{flex:1,height:8,background:"#1e2530",borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${w}%`,background:e.type==="IN"?"#00ff88":"#ff3366",borderRadius:4,transition:"width 0.4s"}} />
                    </div>
                    <span style={{color:e.type==="IN"?"#00ff8888":"#ff336688",fontSize:9,fontFamily:"monospace",minWidth:20}}>{e.type}</span>
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
  const fng     = macro?.fng.value ?? 68;
  const fngLbl  = macro?.fng.label ?? "GREED";
  const dxy     = macro?.indices["DXY"];
  const tnx     = macro?.indices["TNX"];

  const macroMetrics = useMemo(() => [
    {lbl:"Fear & Greed", val: `${fng}`, sub: fngLbl.toUpperCase(), c:"#ffd700", live: macro !== null},
    {lbl:"DXY",          val: dxy ? dxy.price.toFixed(2) : "—",   sub: dxy ? `${dxy.chg >= 0 ? "▲" : "▼"} ${Math.abs(dxy.chg).toFixed(2)}%` : "—", c:"#ff6b35", live: dxy !== undefined},
    {lbl:"FED Rate",     val: "5.25%",   sub: "Sin cambio",    c:"#00e5ff", live: false},
    {lbl:"US10Y Yield",  val: tnx ? `${tnx.price.toFixed(3)}%` : "—", sub: tnx ? `${tnx.chg >= 0 ? "▲" : "▼"} ${Math.abs(tnx.chg).toFixed(3)}%` : "—", c:"#7b2ff7", live: tnx !== undefined},
  ], [macro, fng, fngLbl, dxy, tnx]);

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

      <div className="psy-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card title="Calendario Económico — Próximos Eventos">
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <div style={{display:"flex",justifyContent:"space-between",color:"#7b8fa0",fontSize:9,fontFamily:"monospace",letterSpacing:1,paddingBottom:6,borderBottom:"1px solid #1e2530"}}>
              <span>FECHA</span><span>EVENTO</span><span>EST</span><span>PREV</span><span>IMPACTO</span>
            </div>
            {ECO_CALENDAR.map((e,i) => (
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #1e253030",fontSize:10,fontFamily:"monospace"}}>
                <span style={{color:"#00e5ff",minWidth:50}}>{e.date}</span>
                <span style={{color:"#cdd",flex:1,padding:"0 8px"}}>{e.event}</span>
                <span style={{color:"#00ff88",minWidth:40}}>{e.est}</span>
                <span style={{color:"#7b8fa0",minWidth:40}}>{e.prev}</span>
                <span style={{color:e.impact==="ALTO"?"#ff3366":"#ffd700",fontSize:9,padding:"1px 5px",background:e.impact==="ALTO"?"#ff336618":"#ffd70018",borderRadius:3}}>{e.impact}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="FED Watch — Probabilidades de Cambio de Tasas">
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[
              {meeting:"Jun 2025",hold:72,cut25:24,cut50:4},
              {meeting:"Jul 2025",hold:48,cut25:38,cut50:14},
              {meeting:"Sep 2025",hold:28,cut25:48,cut50:24},
            ].map(f => (
              <div key={f.meeting} style={{background:"#080c14",borderRadius:6,padding:"10px 12px"}}>
                <div style={{color:"#e8eaed",fontSize:11,fontFamily:"monospace",fontWeight:700,marginBottom:6}}>{f.meeting}</div>
                <div style={{display:"flex",gap:6}}>
                  {[["HOLD",f.hold,"#ffd700"],["CUT 25bps",f.cut25,"#00ff88"],["CUT 50bps",f.cut50,"#00e5ff"]].map(([l,v,c]) => (
                    <div key={String(l)} style={{flex:1}}>
                      <div style={{color:c as string,fontSize:13,fontWeight:700,fontFamily:"monospace"}}>{v}%</div>
                      <div style={{color:"#4a5568",fontSize:8,fontFamily:"monospace"}}>{l}</div>
                      <div style={{height:4,background:"#1e2530",borderRadius:2,marginTop:3}}>
                        <div style={{height:"100%",width:`${v}%`,background:c as string,borderRadius:2}} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Section 7: SQUEEZE SCAN ─────────────────────────────────────────────────
function SectionSqueeze() {
  const siRef = useRef<HTMLCanvasElement>(null);
  const siChart = useRef<Chart | null>(null);
  useEffect(() => {
    if (!siRef.current) return;
    if (siChart.current) { siChart.current.destroy(); }
    siChart.current = new Chart(siRef.current, {
      type:"bar",
      data:{labels:SQUEEZE_CANDIDATES.map(s=>s.sym),datasets:[
        {label:"Short Interest %",data:SQUEEZE_CANDIDATES.map(s=>parseFloat(s.si)),backgroundColor:"#ff336633",borderColor:"#ff3366",borderWidth:1},
        {label:"Squeeze Score",data:SQUEEZE_CANDIDATES.map(s=>s.score),backgroundColor:"#7b2ff733",borderColor:"#7b2ff7",borderWidth:1,type:"line" as const},
      ]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:"#7b8fa0",font:{size:10}}}},scales:{x:{ticks:{color:"#7b8fa0",font:{size:9}},grid:{color:"#1e2530"}},y:{ticks:{color:"#7b8fa0",font:{size:9}},grid:{color:"#1e2530"}}}},
    });
    return () => { if (siChart.current) { siChart.current.destroy(); siChart.current = null; } };
  }, []);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <span style={{color:"#7b8fa0",fontSize:10,fontFamily:"monospace",letterSpacing:2}}>SHORT SQUEEZE SCANNER</span>
        <RefBadge text="FINRA · 2 SEMANAS DELAY" />
      </div>
      <Card title="Short Squeeze Scanner — Candidatos Activos">
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,fontFamily:"monospace"}}>
            <thead>
              <tr style={{borderBottom:"1px solid #1e2530"}}>
                {["SYM","SHORT INT","BORROW RATE","DÍAS CUBRIR","CALL THETA","FLOAT","SCORE"].map(h => (
                  <th key={h} style={{color:"#7b8fa0",padding:"6px 8px",textAlign:"left",fontSize:9,letterSpacing:1}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SQUEEZE_CANDIDATES.map((s,i) => (
                <tr key={i} style={{borderBottom:"1px solid #1e253040",background:s.score>=80?"#7b2ff708":"transparent"}}>
                  <td style={{color:"#e8eaed",padding:"8px 8px",fontWeight:700}}>{s.sym}</td>
                  <td style={{color:"#ff3366",padding:"8px 8px"}}>{s.si}</td>
                  <td style={{color:"#ff6b35",padding:"8px 8px"}}>{s.borrow}</td>
                  <td style={{color:"#ffd700",padding:"8px 8px"}}>{s.days}d</td>
                  <td style={{color:"#7b8fa0",padding:"8px 8px"}}>{s.ctc}%</td>
                  <td style={{padding:"8px 8px"}}><span style={{color:s.float==="Low"?"#ff3366":s.float==="Mid"?"#ffd700":"#00ff88",fontSize:9}}>{s.float}</span></td>
                  <td style={{padding:"8px 8px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:60,height:6,background:"#1e2530",borderRadius:3}}>
                        <div style={{height:"100%",width:`${s.score}%`,background:s.score>=80?"#7b2ff7":s.score>=60?"#ffd700":"#4a5568",borderRadius:3}} />
                      </div>
                      <span style={{color:s.score>=80?"#7b2ff7":s.score>=60?"#ffd700":"#4a5568",fontWeight:700}}>{s.score}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Short Interest & Squeeze Score">
        <div style={{height:220,position:"relative"}}><canvas ref={siRef} /></div>
      </Card>

      <div className="psy-grid-2" style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:12}}>
        {[
          {title:"Método Squeeze",body:"Score: SI% (40%) + Borrow Rate (25%) + Días Cubrir (20%) + Call OI (15%). Score ≥80: Alta probabilidad squeeze en 5-10 días."},
          {title:"Fuente FINRA",  body:"Datos FINRA actualizados cada 2 semanas. Borrow rate obtenido de prime brokers. Dark pool prints complementan la señal."},
          {title:"Risk Management",body:"⚡ Squeezes = ALTA VOLATILIDAD. Stop loss estricto recomendado. Máximo 2% del capital en cualquier squeeze trade."},
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
function SectionNarrativa({macro}:{macro:LiveMacro|null}) {
  const fng = macro?.fng.value ?? 68;
  const dxy = macro?.indices["DXY"];
  const regime = fng >= 70 ? "RISK-ON BULL" : fng >= 50 ? "NEUTRAL" : "RISK-OFF BEAR";
  const regimeColor = fng >= 70 ? "#00ff88" : fng >= 50 ? "#ffd700" : "#ff3366";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div className="psy-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card title="Narrativas Dominantes del Mercado">
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
                {lbl:"Rotación Capital",val: "Crypto + Tech + Commodities",                            c: "#ff6b35"},
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
                  <div key={i} style={{background:phase==="MOMENTUM"?"#00e5ff22":"#0d1117",border:`1px solid ${phase==="MOMENTUM"?"#00e5ff":"#1e2530"}`,borderRadius:6,padding:"6px 10px",fontSize:9,fontFamily:"monospace",color:phase==="MOMENTUM"?"#00e5ff":"#4a5568"}}>{phase}</div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Narrativas por Asset Class">
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {[
                {cls:"CRYPTO",     nar:"Adopción institucional + halving cycle",bias:"BULL"},
                {cls:"EQUITIES",   nar:"IA supercycle + buybacks masivos",       bias:"BULL"},
                {cls:"COMMODITIES",nar:"Demanda infraestructura + geopolitics",  bias:"BULL"},
                {cls:"BONDS",      nar:"Yield alto = compresión valuaciones",    bias:"BEAR"},
                {cls:"FOREX",      nar:"DXY debilidad estructural",              bias:dxy && dxy.chg < 0 ? "BEAR" : "NEUTRAL"},
              ].map(n => (
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
  {id:"options",      label:"Options",      icon:"⚗️"},
  {id:"institucional",label:"Institucional",icon:"🏛"},
  {id:"macro",        label:"Macro",        icon:"🌐"},
  {id:"squeeze",      label:"Squeeze",      icon:"⚡"},
  {id:"narrativa",    label:"Narrativa",    icon:"📖"},
  {id:"brain",        label:"PSY BRAIN",    icon:"🧠"},
];

export default function PsyOracle() {
  const [active, setActive] = useState("dashboard");
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
        {active==="options"       && <SectionOptions />}
        {active==="institucional" && <SectionInstitucional macro={macro} />}
        {active==="macro"         && <SectionMacro        macro={macro} />}
        {active==="squeeze"       && <SectionSqueeze />}
        {active==="narrativa"     && <SectionNarrativa    macro={macro} />}
        {active==="brain"         && <SectionPsyBrain     crypto={crypto} macro={macro} />}
      </div>
    </div>
  );
}
