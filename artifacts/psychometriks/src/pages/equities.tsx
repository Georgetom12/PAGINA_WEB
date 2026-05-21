import React, { useState, useEffect, useRef, useCallback } from "react";
import SiteNav from "@/components/site-nav";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

// ─── DATA ──────────────────────────────────────────────────────────────────────
const STOCKS = [
  { rank:1,  sym:"AAPL",  name:"Apple Inc.",          sector:"Technology",        color:"#00e5ff", bg:"rgba(0,229,255,.15)",
    price:189.30,chg:+1.24,pct:+0.66,mcap:"2.94T",vol:"58.2M",pe:29.4,eps:6.43,div:0.96,yield:0.51,
    high52:199.62,low52:164.08,beta:1.24,atr:3.8,rsi:58,macd:"Bullish",ema200:"Sobre",
    desc:"Gigante tecnológico líder en hardware de consumo, software y servicios digitales. iPhone, Mac, iPad, Apple Watch.",
    bull:"Ciclo de upgrade iPhone 16 Pro. Servicios de IA integrados. Márgenes brutos en máximos históricos.",
    bear:"Saturación del mercado móvil. Regulación antimonopolio en App Store. Exposición a China.",
    signal:"STRONG BUY",wyckoff:"Fase C — Spring completado",elliott:"Onda 3 en progreso",
    news:[{t:"Apple reporta ingresos récord de servicios en Q4",s:1,src:"Bloomberg",time:"2h"},{t:"iPhone 17 leaks apuntan a nuevo form factor ultrafino",s:1,src:"9to5Mac",time:"5h"},{t:"Reguladores EU investigan App Store por monopolio",s:-1,src:"Reuters",time:"8h"}]},
  { rank:2,  sym:"MSFT",  name:"Microsoft Corp.",      sector:"Technology",        color:"#00e676", bg:"rgba(0,230,118,.15)",
    price:415.20,chg:-2.85,pct:-0.68,mcap:"3.08T",vol:"22.1M",pe:36.2,eps:11.45,div:3.00,yield:0.72,
    high52:441.30,low52:362.90,beta:0.89,atr:6.2,rsi:52,macd:"Neutral",ema200:"Sobre",
    desc:"Líder en software empresarial, nube Azure, productividad (Office 365) e IA con OpenAI partnership.",
    bull:"Azure creciendo 28% YoY. Copilot integrado en todo el ecosistema. Dominancia en enterprise AI.",
    bear:"Competencia de AWS/GCP en cloud. Valuation premium. Integración de Activision pendiente de rentabilizar.",
    signal:"BUY",wyckoff:"Fase D — SOS confirmado",elliott:"Onda 5 final",
    news:[{t:"Azure AI supera expectativas con +31% en revenue cloud",s:1,src:"CNBC",time:"1h"},{t:"Copilot for Finance disponible globalmente",s:1,src:"Microsoft Blog",time:"3h"}]},
  { rank:3,  sym:"NVDA",  name:"NVIDIA Corp.",         sector:"Semiconductors",    color:"#76ff03", bg:"rgba(118,255,3,.15)",
    price:875.40,chg:+23.60,pct:+2.77,mcap:"2.16T",vol:"41.8M",pe:67.3,eps:12.96,div:0.16,yield:0.02,
    high52:974.00,low52:420.00,beta:1.72,atr:28.4,rsi:71,macd:"Bullish",ema200:"Sobre",
    desc:"Líder absoluto en GPUs para IA/ML. Data center Blackwell. Dominancia del 80%+ en AI training hardware.",
    bull:"Demanda de H100/H200/Blackwell insaciable. Data center segmento creció 400%. NIM platform.",
    bear:"Múltiplo PER extremadamente elevado. Competencia de AMD MI300. Restricciones export a China.",
    signal:"STRONG BUY",wyckoff:"Fase B — Reacumulación",elliott:"Onda III macro en progreso",
    news:[{t:"NVIDIA Blackwell backlog supera $45B — demanda sin precedentes",s:1,src:"The Information",time:"30m"},{t:"Meta ordena 350,000 GPUs H200 para 2025",s:1,src:"Reuters",time:"2h"}]},
  { rank:4,  sym:"AMZN",  name:"Amazon.com Inc.",      sector:"E-Commerce/Cloud",  color:"#ffab00", bg:"rgba(255,171,0,.15)",
    price:182.50,chg:+0.90,pct:+0.50,mcap:"1.90T",vol:"35.7M",pe:58.4,eps:3.13,div:0,yield:0,
    high52:201.20,low52:127.12,beta:1.15,atr:4.1,rsi:55,macd:"Bullish",ema200:"Sobre",
    desc:"E-commerce global, AWS cloud líder, Prime Video, Alexa AI, logistics network propio.",
    bull:"AWS aceleración. Márgenes operativos récord. IA generativa Bedrock. Advertising boom.",
    bear:"Retail márgenes delgados. Capex elevado. Regulación antitrust global.",
    signal:"BUY",wyckoff:"Fase C completada",elliott:"Onda 3 iniciando",
    news:[{t:"AWS Bedrock supera 50,000 clientes enterprise activos",s:1,src:"AWS Blog",time:"1h"}]},
  { rank:5,  sym:"GOOGL", name:"Alphabet Inc.",        sector:"Technology",        color:"#40c4ff", bg:"rgba(64,196,255,.15)",
    price:172.30,chg:-0.65,pct:-0.38,mcap:"2.13T",vol:"25.3M",pe:23.8,eps:7.24,div:0,yield:0,
    high52:193.31,low52:129.40,beta:1.06,atr:3.9,rsi:49,macd:"Neutral",ema200:"Sobre",
    desc:"Motor de búsqueda dominante, YouTube, Google Cloud, Android, Waymo autonomous driving, DeepMind AI.",
    bull:"Gemini Ultra compite con GPT-4. Search sin signos de erosión. YouTube Shorts monetización.",
    bear:"AI Search puede canibalizar revenue. Regulación antimonopolio DOJ. Cloud tercero.",
    signal:"HOLD",wyckoff:"Fase A — distribución potencial",elliott:"Corrección ABC posible",
    news:[{t:"Gemini 2.0 Ultra supera GPT-4 en benchmarks de código",s:1,src:"Google AI",time:"2h"},{t:"DOJ considera dividir Google Search de Android",s:-1,src:"NYT",time:"5h"}]},
  { rank:6,  sym:"META",  name:"Meta Platforms",       sector:"Social Media",      color:"#e040fb", bg:"rgba(224,64,251,.15)",
    price:503.10,chg:+8.40,pct:+1.70,mcap:"1.29T",vol:"18.9M",pe:26.1,eps:19.29,div:2.00,yield:0.40,
    high52:589.00,low52:374.94,beta:1.28,atr:12.3,rsi:62,macd:"Bullish",ema200:"Sobre",
    desc:"Facebook, Instagram, WhatsApp, Threads. Reality Labs (Quest VR). Llama 3 open source AI.",
    bull:"Advertising revenue en máximos. Llama 3 estrategia open-source brillante. Ray-Ban Meta traction.",
    bear:"Reality Labs pierde $4B/trimestre. TikTok competencia. Demografía envejeciendo en FB.",
    signal:"BUY",wyckoff:"Fase D — markup iniciando",elliott:"Onda 3 de 3",
    news:[{t:"Meta AI Assistant alcanza 500M usuarios activos mensuales",s:1,src:"Meta IR",time:"1h"}]},
  { rank:7,  sym:"TSLA",  name:"Tesla Inc.",           sector:"EV/Energy",         color:"#ff1744", bg:"rgba(255,23,68,.15)",
    price:248.50,chg:-4.30,pct:-1.70,mcap:"790B",vol:"102.5M",pe:51.2,eps:4.85,div:0,yield:0,
    high52:358.64,low52:138.80,beta:2.01,atr:8.9,rsi:44,macd:"Bearish",ema200:"Bajo",
    desc:"Líder en vehículos eléctricos, Powerwall/Powerpack energía, Solar, FSD autopilot, Optimus robot.",
    bull:"Robotaxi launch 2025. Optimus robot producción masiva. Margen de energía supera autos.",
    bear:"Competencia China BYD/NIO. Márgenes auto cayendo. Controversia Musk afecta brand.",
    signal:"HOLD",wyckoff:"Fase A — distribución activa",elliott:"Onda C bajista posible",
    news:[{t:"Tesla rebaja precios Model Y en Europa 5%",s:-1,src:"Reuters",time:"2h"},{t:"FSD v13 promete autonomía nivel 4 para Q2 2025",s:1,src:"Electrek",time:"6h"}]},
  { rank:8,  sym:"BRK.B", name:"Berkshire Hathaway",   sector:"Financials",        color:"#ffd700", bg:"rgba(255,215,0,.15)",
    price:382.00,chg:+1.20,pct:+0.31,mcap:"839B",vol:"3.8M",pe:9.2,eps:41.55,div:0,yield:0,
    high52:396.80,low52:322.50,beta:0.91,atr:4.8,rsi:57,macd:"Neutral",ema200:"Sobre",
    desc:"Conglomerado de Buffett: seguros (GEICO), BNSF ferroviaria, energía, holdings en AAPL/BAC/KO.",
    bull:"Cash position $167B listo para adquisición. Portfolio AAPL sólido. Cash flow masivo.",
    bear:"Valuación premium al book value. Sucesión post-Buffett. Peso excesivo en seguros.",
    signal:"HOLD",wyckoff:"Consolidación horizontal",elliott:"Onda IV corrección",
    news:[{t:"Berkshire acumula $167B en cash — Buffett espera corrección",s:0,src:"WSJ",time:"1d"}]},
  { rank:9,  sym:"JPM",   name:"JPMorgan Chase",       sector:"Banking",           color:"#00e5ff", bg:"rgba(0,229,255,.12)",
    price:202.40,chg:+2.10,pct:+1.05,mcap:"583B",vol:"12.4M",pe:11.8,eps:17.15,div:5.00,yield:2.47,
    high52:220.82,low52:135.19,beta:1.12,atr:3.9,rsi:63,macd:"Bullish",ema200:"Sobre",
    desc:"Mayor banco de EE.UU. por activos. Investment banking, retail banking, JPMorgan Chase consumer, asset mgmt.",
    bull:"Net interest income récord. Fee revenue investment banking. Balance sheet fortress.",
    bear:"Credit losses potenciales en recesión. CRE exposure. Regulación capital Basel III.",
    signal:"BUY",wyckoff:"Fase D — markup",elliott:"Onda 5 extensión",
    news:[{t:"JPM Q4: EPS $4.81 — supera estimaciones en 12%",s:1,src:"CNBC",time:"2h"}]},
  { rank:10, sym:"V",     name:"Visa Inc.",            sector:"Payments",          color:"#00ffcc", bg:"rgba(0,255,204,.12)",
    price:278.90,chg:+1.80,pct:+0.65,mcap:"574B",vol:"7.2M",pe:29.6,eps:9.43,div:2.08,yield:0.74,
    high52:290.96,low52:227.49,beta:0.96,atr:3.4,rsi:60,macd:"Bullish",ema200:"Sobre",
    desc:"Red de pagos global. Procesa $15T/año. Sin balance de crédito — modelo asset-light de royalties.",
    bull:"Pagos digitales crecen +11% global. Margen neto 54%. ROIC >30%. Dividendo creciente.",
    bear:"Regulación interchange fees. Crypto como alternativa. Competencia fintech.",
    signal:"BUY",wyckoff:"Fase C — Spring",elliott:"Onda 3 iniciando",
    news:[{t:"Visa Cross-Border Volume crece 16% — turismo récord post-COVID",s:1,src:"Visa IR",time:"3h"}]},
  { rank:11, sym:"WMT",   name:"Walmart Inc.",         sector:"Retail",            color:"#40c4ff", bg:"rgba(64,196,255,.12)",
    price:68.40,chg:+0.45,pct:+0.66,mcap:"549B",vol:"15.8M",pe:28.1,eps:2.43,div:0.83,yield:1.22,
    high52:74.24,low52:47.65,beta:0.55,atr:1.2,rsi:62,macd:"Bullish",ema200:"Sobre",
    desc:"Mayor retailer del mundo. Tiendas físicas + Walmart+. Flipkart India. Sam's Club. Marketplace.",
    bull:"Walmart+ crecimiento suscripciones. Advertising revenue $3.4B. Grocery market share.",
    bear:"Amazon presiona e-commerce. Márgenes retail delgados. Inflación impacta consumidor.",
    signal:"HOLD",wyckoff:"Distribución menor",elliott:"ABC corrección leve",
    news:[{t:"Walmart+ supera 35M de miembros — rivalizando Amazon Prime",s:1,src:"Bloomberg",time:"4h"}]},
  { rank:12, sym:"XOM",   name:"ExxonMobil Corp.",     sector:"Energy",            color:"#ff6d00", bg:"rgba(255,109,0,.15)",
    price:108.30,chg:-0.80,pct:-0.73,mcap:"436B",vol:"18.2M",pe:13.4,eps:8.09,div:3.80,yield:3.51,
    high52:123.75,low52:95.77,beta:0.58,atr:2.1,rsi:46,macd:"Neutral",ema200:"Bajo",
    desc:"Supermajor integrada de O&G. Refinery, chemical, upstream E&P. Pioneer Natural Resources adquisición.",
    bull:"Pioneer adquisición accretive. Dividend yield 3.5%+ atractivo. Low-cost Permian production.",
    bear:"Transición energética largo plazo. Petróleo en zona $70-80 limita upside. ESG pressure.",
    signal:"HOLD",wyckoff:"Consolidación Fase B",elliott:"Onda IV en progreso",
    news:[{t:"ExxonMobil completa integración Pioneer — 1.3M BOE/día Permian",s:1,src:"Reuters",time:"1d"}]},
  { rank:13, sym:"JNJ",   name:"Johnson & Johnson",    sector:"Healthcare",        color:"#e040fb", bg:"rgba(224,64,251,.12)",
    price:159.80,chg:-0.40,pct:-0.25,mcap:"384B",vol:"8.9M",pe:16.2,eps:9.86,div:4.84,yield:3.03,
    high52:175.97,low52:144.95,beta:0.55,atr:2.3,rsi:48,macd:"Neutral",ema200:"Bajo",
    desc:"Pharma y MedTech. Spin-off Kenvue consumo. Darvadstrocel, Carvykti oncología. Stelara psoriasis.",
    bull:"Pipeline oncología sólido. Dividend aristocrat 62 años consecutivos. MedTech growing.",
    bear:"Litigios talco continúan. LOE Stelara 2025. Separación Kenvue diluye tamaño.",
    signal:"HOLD",wyckoff:"Fase A redistribución",elliott:"Onda B rebote",
    news:[{t:"JNJ Carvykti aprobado para mieloma múltiple en segunda línea",s:1,src:"FDA",time:"2d"}]},
  { rank:14, sym:"UNH",   name:"UnitedHealth Group",   sector:"Healthcare",        color:"#76ff03", bg:"rgba(118,255,3,.12)",
    price:524.30,chg:+4.80,pct:+0.93,mcap:"484B",vol:"3.1M",pe:21.3,eps:24.60,div:8.00,yield:1.53,
    high52:557.40,low52:421.14,beta:0.73,atr:9.2,rsi:57,macd:"Bullish",ema200:"Sobre",
    desc:"Mayor aseguradora de salud de EE.UU. UnitedHealthcare + Optum. Revenue $371B. 49M miembros.",
    bull:"Optum Health crecimiento double digit. Medicare Advantage expansion. Data analytics moat.",
    bear:"Cyberattack Change Healthcare $2.8B. Regulación Medicare reimbursements.",
    signal:"BUY",wyckoff:"Reacumulación Fase C",elliott:"Onda 3 subiendo",
    news:[{t:"UnitedHealth reporta $24.70 EPS Q4 — supera consenso",s:1,src:"UNH IR",time:"1h"}]},
  { rank:15, sym:"PG",    name:"Procter & Gamble",     sector:"Consumer Staples",  color:"#ffd700", bg:"rgba(255,215,0,.12)",
    price:165.20,chg:+0.30,pct:+0.18,mcap:"390B",vol:"6.8M",pe:26.4,eps:6.26,div:4.03,yield:2.44,
    high52:173.89,low52:139.73,beta:0.62,atr:2.1,rsi:54,macd:"Neutral",ema200:"Sobre",
    desc:"Portafolio de 65+ marcas de consumo: Tide, Pampers, Gillette, Oral-B, Head & Shoulders.",
    bull:"Pricing power demostrado. Dividend King 67 años consecutivos. Emerging markets growth.",
    bear:"Private label competencia creciente. Commodity input costs volátiles. Crecimiento orgánico lento.",
    signal:"HOLD",wyckoff:"Rango de consolidación",elliott:"Onda IV plana",
    news:[{t:"P&G reporta organic growth de 4% — supera expectativas del consenso",s:1,src:"P&G IR",time:"2d"}]},
  { rank:16, sym:"MA",    name:"Mastercard Inc.",      sector:"Payments",          color:"#ff6d00", bg:"rgba(255,109,0,.12)",
    price:469.80,chg:+3.20,pct:+0.69,mcap:"440B",vol:"3.4M",pe:36.1,eps:13.01,div:2.64,yield:0.56,
    high52:494.82,low52:374.46,beta:1.10,atr:6.8,rsi:61,macd:"Bullish",ema200:"Sobre",
    desc:"Segunda mayor red de pagos global. Cross-border transactions, Mastercard Send, open banking.",
    bull:"Cross-border volume récord. Value-added services creciendo 18%. ROIC >100%.",
    bear:"BNPL disrupción. Regulación interchange. Crypto payments alternativa.",
    signal:"BUY",wyckoff:"Fase C — Spring",elliott:"Onda 3 avanzando",
    news:[{t:"Mastercard reporta net revenue $6.3B Q4 — +14% YoY",s:1,src:"MA IR",time:"1d"}]},
  { rank:17, sym:"LLY",   name:"Eli Lilly",            sector:"Pharma",            color:"#e040fb", bg:"rgba(224,64,251,.12)",
    price:742.80,chg:+12.40,pct:+1.70,mcap:"706B",vol:"4.2M",pe:48.2,eps:15.41,div:5.20,yield:0.70,
    high52:972.53,low52:614.12,beta:0.42,atr:18.6,rsi:55,macd:"Bullish",ema200:"Sobre",
    desc:"Farmacéutica líder en diabetes (Mounjaro) y obesidad (Zepbound). Pipeline de GLP-1 dominante.",
    bull:"Mounjaro/Zepbound demanda insaciable. GLP-1 mercado $150B+ para 2030. Alzheimer pipeline.",
    bear:"Producción capacity constraint. Competencia Ozempic (Novo Nordisk). Valuation muy elevado.",
    signal:"STRONG BUY",wyckoff:"Fase D — markup sostenido",elliott:"Onda III en progreso",
    news:[{t:"Eli Lilly: Zepbound aprobado para apnea del sueño — nueva indicación",s:1,src:"FDA",time:"5h"}]},
  { rank:18, sym:"CVX",   name:"Chevron Corp.",        sector:"Energy",            color:"#00e5ff", bg:"rgba(0,229,255,.12)",
    price:152.30,chg:-1.10,pct:-0.72,mcap:"283B",vol:"9.8M",pe:14.2,eps:10.73,div:6.52,yield:4.28,
    high52:175.11,low52:139.62,beta:1.01,atr:2.9,rsi:44,macd:"Neutral",ema200:"Bajo",
    desc:"Supermajor integrada con foco en Permian Basin, deepwater Gulf, Tengiz Kazakhstan, Australia LNG.",
    bull:"Hess+Guyana assets transformacionales. Dividend yield 4.2% atractivo. Buyback $15B.",
    bear:"Hess deal bloqueado por Exxon arbitraje. WTI <$75 presiona FCF.",
    signal:"HOLD",wyckoff:"Distribución Fase B",elliott:"Onda C bajista",
    news:[{t:"Arbitraje Hess-Exxon: decisión esperada Q2 2025 — deal en riesgo",s:-1,src:"Bloomberg",time:"1d"}]},
  { rank:19, sym:"COST",  name:"Costco Wholesale",     sector:"Retail",            color:"#00e676", bg:"rgba(0,230,118,.12)",
    price:872.00,chg:+5.40,pct:+0.62,mcap:"386B",vol:"2.1M",pe:52.4,eps:16.64,div:4.64,yield:0.53,
    high52:923.35,low52:683.73,beta:0.86,atr:12.1,rsi:60,macd:"Bullish",ema200:"Sobre",
    desc:"Membership warehouse club. 130M+ miembros. Private label Kirkland Signature. Gold & silver ventas.",
    bull:"Renewal rate 93%. Pricing power defensivo. Gold bullion ventas nuevos revenue stream.",
    bear:"Valuation PER 52x es premium extremo. Crecimiento new member desacelerando.",
    signal:"HOLD",wyckoff:"Consolidación en ATH",elliott:"Onda IV menor corrección",
    news:[{t:"Costco ventas de oro supera $200M/mes — demanda consumidor alto",s:1,src:"WSJ",time:"2d"}]},
  { rank:20, sym:"NFLX",  name:"Netflix Inc.",         sector:"Streaming",         color:"#ff1744", bg:"rgba(255,23,68,.15)",
    price:628.00,chg:+9.80,pct:+1.58,mcap:"268B",vol:"5.6M",pe:44.3,eps:14.18,div:0,yield:0,
    high52:700.90,low52:344.73,beta:1.33,atr:15.8,rsi:65,macd:"Bullish",ema200:"Sobre",
    desc:"Líder de streaming global. 301M+ suscriptores. Ad-supported tier. Live sports NFL/Boxing. Original content.",
    bull:"Password sharing crackdown +30M subs. Ad-tier $7B revenue por 2025. Live sports incrementa ARPU.",
    bear:"Contenido CAPEX $17B/año. Competencia Disney+/Max/Apple TV.",
    signal:"STRONG BUY",wyckoff:"Fase D — markup acelerado",elliott:"Onda 3 extensión",
    news:[{t:"Netflix Q4: 19M nuevos suscriptores — récord histórico trimestral",s:1,src:"Netflix IR",time:"30m"}]},
];

const MACRO = [
  { id:"dxy", name:"DXY — Dollar",    value:104.23, chg:+0.34, pct:+0.33, sub:"US Dollar Index",    colorClass:"mc-dxy", valClass:"val-up"   },
  { id:"vix", name:"VIX — Volatilidad",value:14.82, chg:-0.95, pct:-6.03, sub:"Fear & Greed Index", colorClass:"mc-vix", valClass:"val-down" },
  { id:"sp",  name:"S&P 500",          value:5214.08,chg:+18.30,pct:+0.35, sub:"Large Cap EE.UU.", colorClass:"mc-sp",  valClass:"val-up"   },
  { id:"nas", name:"NASDAQ 100",        value:18162.40,chg:+82.50,pct:+0.46,sub:"Tech-Heavy Index", colorClass:"mc-nas", valClass:"val-up"   },
  { id:"dow", name:"DJIA",             value:39131.50,chg:+45.20,pct:+0.12, sub:"30 Blue Chips",    colorClass:"mc-dow", valClass:"val-up"   },
  { id:"rus", name:"RUSSELL 2000",     value:2048.30, chg:-12.40,pct:-0.60, sub:"Small Caps",       colorClass:"mc-rus", valClass:"val-down" },
];

const ALERTS = [
  { msg:"NVDA: Spike de volumen 3.2x promedio — movimiento institucional posible", sev:"sev-high", icon:"⚡", time:"hace 5m"  },
  { msg:"VIX baja de 15 — mercado en zona de complacencia",                        sev:"sev-med",  icon:"⚠",  time:"hace 12m" },
  { msg:"SPY RSI(14) toca 70 — divergencia con volumen bajando",                   sev:"sev-med",  icon:"📊", time:"hace 22m" },
  { msg:"TSLA cruza EMA200 a la baja en timeframe diario",                         sev:"sev-high", icon:"🔻", time:"hace 31m" },
  { msg:"DXY fuerza — headwind para commodities y EM stocks",                      sev:"sev-low",  icon:"💵", time:"hace 45m" },
  { msg:"Tasas 10Y US Treasury superan 4.35% — presión sobre growth stocks",       sev:"sev-low",  icon:"📈", time:"hace 1h"  },
];

const SECTORS = [
  { name:"TECHNOLOGY",    pct:+18.4, color:"#00e5ff" },
  { name:"FINANCIALS",    pct:+14.2, color:"#00e676" },
  { name:"HEALTHCARE",    pct:+8.6,  color:"#e040fb" },
  { name:"CONSUMER DISC.",pct:+11.3, color:"#ffab00" },
  { name:"INDUSTRIALS",   pct:+9.1,  color:"#40c4ff" },
  { name:"ENERGY",        pct:-3.2,  color:"#ff6d00" },
  { name:"UTILITIES",     pct:+2.1,  color:"#76ff03" },
  { name:"REAL ESTATE",   pct:-1.8,  color:"#ff1744" },
  { name:"CONSUMER STP.", pct:+5.4,  color:"#ffd700" },
  { name:"MATERIALS",     pct:+3.7,  color:"#00ffcc" },
];

type Stock = typeof STOCKS[0];
type Section = "overview" | "sectors" | "confluence";

// ─── COMPONENT ─────────────────────────────────────────────────────────────────
export default function Equities() {
  const [section, setSection]           = useState<Section>("overview");
  const [activeStock, setActiveStock]   = useState<Stock | null>(null);
  const [search, setSearch]             = useState("");
  const [clock, setClock]               = useState("");
  const [mktStatus, setMktStatus]       = useState<{ text: string; cls: string }>({ text:"PRE-MARKET", cls:"status-pre" });
  const [tf, setTf]                     = useState("1D");
  const [liveStocks, setLiveStocks]     = useState(STOCKS);
  const chartRef  = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<Chart | null>(null);

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const est = new Date(utc + 3600000 * -5);
      const h = est.getHours(), m = est.getMinutes(), s = est.getSeconds();
      const fmt = (n: number) => String(n).padStart(2, "0");
      setClock(`${fmt(h)}:${fmt(m)}:${fmt(s)} EST`);
      if (h >= 9 && (h < 16 || (h === 16 && m === 0))) setMktStatus({ text:"● MARKET OPEN", cls:"status-open" });
      else if ((h === 8 && m >= 30) || (h >= 4 && h < 9)) setMktStatus({ text:"◐ PRE-MARKET", cls:"status-pre" });
      else if (h >= 16 && h < 20) setMktStatus({ text:"◑ AFTER-HOURS", cls:"status-pre" });
      else setMktStatus({ text:"○ CLOSED", cls:"status-closed" });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch real prices from api-server → overlay onto static stock data
  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/api/market/equities");
        if (!r.ok) return;
        const json = await r.json() as { data?: { symbol: string; price: number; change: number; changePct: number }[] };
        if (!json.data?.length) return;
        const priceMap = new Map(json.data.map(q => [q.symbol, q]));
        setLiveStocks(prev => prev.map(s => {
          const live = priceMap.get(s.sym) ?? priceMap.get(s.sym.replace("-", ""));
          if (!live || live.price <= 0) return s;
          return { ...s, price: live.price, chg: live.change, pct: live.changePct };
        }));
      } catch { /* keep static data on error */ }
    };
    load();
    const id = setInterval(load, 90000);
    return () => clearInterval(id);
  }, []);

  // Chart render
  const renderChart = useCallback((s: Stock) => {
    const canvas = chartRef.current;
    if (!canvas) return;
    if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null; }
    const days = 30;
    const labels: string[] = [];
    const prices: number[] = [];
    const ema20: number[]  = [];
    const ema200: number[] = [];
    const bbUpper: number[]= [];
    const bbLower: number[]= [];
    // Deterministic seed per symbol so chart is stable across renders
    const symSeed = s.sym.split("").reduce((a: number, c: string) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
    const seededRng = (i: number) => { let x = (symSeed * 1664525 + i * 1013904223 + 49297) >>> 0; return (x / 0xffffffff) * 2 - 1; };
    let basePrice = s.price * (1 - s.pct / 100 * 0.3);
    const trend = s.pct > 0 ? 1.001 : 0.999;
    for (let i = 0; i < days; i++) {
      const d = new Date(); d.setDate(d.getDate() - days + i);
      labels.push(d.toLocaleDateString("es-EC", { month:"short", day:"numeric" }));
      basePrice *= trend * (1 + seededRng(i) * 0.022);
      prices.push(+basePrice.toFixed(2));
    }
    prices[prices.length - 1] = s.price;
    let ema = prices[0]; const k = 2 / (20 + 1);
    prices.forEach(p => { ema = p * k + ema * (1 - k); ema20.push(+ema.toFixed(2)); });
    const ema200val = s.ema200 === "Sobre" ? s.price * 0.88 : s.price * 1.08;
    prices.forEach((_, i) => ema200.push(+(ema200val + seededRng(i + 100) * s.price * 0.005).toFixed(2)));
    prices.forEach((p, i) => {
      const slice = prices.slice(Math.max(0, i - 19), i + 1);
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      const std = Math.sqrt(slice.reduce((a, b) => a + (b - avg) ** 2, 0) / slice.length);
      bbUpper.push(+(avg + 2 * std).toFixed(2));
      bbLower.push(+(avg - 2 * std).toFixed(2));
    });
    chartInst.current = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label:"Precio", data:prices, borderColor:s.color, borderWidth:2, fill:false, tension:.3, pointRadius:0 },
          { label:"EMA 20", data:ema20,  borderColor:"#40c4ff", borderWidth:1.5, borderDash:[4,2], fill:false, tension:.3, pointRadius:0 },
          { label:"EMA 200",data:ema200, borderColor:"#ffd700", borderWidth:1.5, borderDash:[6,3], fill:false, tension:.1, pointRadius:0 },
          { label:"BB Upper",data:bbUpper,borderColor:"rgba(255,255,255,.2)",borderWidth:1,fill:"+1",backgroundColor:"rgba(255,255,255,.03)",tension:.3,pointRadius:0 } as any,
          { label:"BB Lower",data:bbLower,borderColor:"rgba(255,255,255,.2)",borderWidth:1,fill:false,tension:.3,pointRadius:0 },
        ],
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        interaction:{ mode:"index", intersect:false },
        plugins:{ legend:{display:false}, tooltip:{ backgroundColor:"rgba(13,21,32,.95)", borderColor:"rgba(26,42,58,.8)", borderWidth:1, titleColor:"#00e5ff", bodyColor:"#eceff1" } },
        scales:{
          x:{ grid:{color:"rgba(26,42,58,.5)"}, ticks:{color:"#546e7a",font:{family:"monospace",size:9},maxRotation:0,maxTicksLimit:6} },
          y:{ grid:{color:"rgba(26,42,58,.5)"}, ticks:{color:"#546e7a",font:{family:"monospace",size:9},callback:(v)=>"$"+Number(v).toLocaleString()}, position:"right" },
        },
      },
    });
  }, []);

  useEffect(() => {
    if (activeStock) setTimeout(() => renderChart(activeStock), 50);
  }, [activeStock, tf, renderChart]);

  const selectStock = (sym: string) => {
    const s = liveStocks.find(x => x.sym === sym) || STOCKS.find(x => x.sym === sym);
    if (!s) return;
    setActiveStock(s as Stock);
    setSection("overview");
  };

  const filtered = liveStocks.filter(s =>
    s.sym.includes(search.toUpperCase()) || s.name.toUpperCase().includes(search.toUpperCase())
  );

  const sigClass = (sig: string) => ({
    "STRONG BUY":"sig-strong-buy","BUY":"sig-buy","HOLD":"sig-hold","SELL":"sig-sell","STRONG SELL":"sig-strong-sell"
  }[sig] || "sig-hold");

  const buildCorrelations = (s: Stock) => {
    const isTech       = ["Technology","Semiconductors","Streaming"].includes(s.sector);
    const isEnergy     = s.sector === "Energy";
    const isEVEnergy   = s.sector === "EV/Energy";
    const isFinancial  = ["Banking","Payments","Financials"].includes(s.sector);
    const isHealthcare = ["Healthcare","Pharma"].includes(s.sector);
    const isConsumer   = ["Consumer Staples","Retail"].includes(s.sector);
    const isSocial     = s.sector === "Social Media";
    const isCloud      = s.sector === "E-Commerce/Cloud";

    // SPY — correlaciones históricas fijas por sector (sin Math.random)
    const spyCor = isTech      ? 0.88
                 : isCloud     ? 0.87
                 : isSocial    ? 0.86
                 : isEVEnergy  ? 0.82
                 : isFinancial ? 0.85
                 : isEnergy    ? 0.74
                 : isHealthcare? 0.76
                 : isConsumer  ? 0.73
                 : 0.81;

    // VIX — siempre negativo, correlaciones históricas fijas por sector
    const vixCor = isTech      ? -0.79
                 : isCloud     ? -0.76
                 : isSocial    ? -0.74
                 : isEVEnergy  ? -0.77
                 : isFinancial ? -0.72
                 : isEnergy    ? -0.63
                 : isHealthcare? -0.62
                 : isConsumer  ? -0.56
                 : -0.68;

    return [
      { asset:"DXY",    val: isTech?-0.62:isEnergy?0.31:isFinancial?0.48:0.12, note:"USD Index" },
      { asset:"US10Y",  val: isFinancial?0.71:isTech?-0.58:-0.34, note:"Bonos 10 años" },
      { asset:"XAU/USD",val: isEnergy?0.44:isTech?-0.41:-0.18, note:"Oro spot" },
      { asset:"WTI OIL",val: isEnergy?0.87:isTech?-0.22:0.15, note:"Petróleo crudo" },
      { asset:"SPY",    val: spyCor, note:"S&P 500 ETF" },
      { asset:"BTC/USD",val: isTech?0.55:isCloud?0.48:isSocial?0.38:0.22, note:"Bitcoin" },
      { asset:"VIX",    val: vixCor, note:"Volatilidad" },
      { asset:"EUR/USD",val: isTech?0.32:isFinancial?0.41:-0.18, note:"Euro vs Dólar" },
    ];
  };

  return (
    <>
      <style>{`
        :root{--eq-bg:#060a0f;--eq-bg2:#0a1018;--eq-bg3:#0f1820;--eq-panel:#0d1520;--eq-border:#1a2a3a;--eq-border2:#243040;--eq-cyan:#00e5ff;--eq-green:#00e676;--eq-red:#ff1744;--eq-gold:#ffd700;--eq-orange:#ff6d00;--eq-purple:#e040fb;--eq-teal:#40c4ff;--eq-neut:#00ffcc;--eq-white:#eceff1;--eq-gray:#546e7a;--eq-amber:#ffab00;}
        .eq-wrap{background:var(--eq-bg);min-height:100vh;padding:14px;font-family:'Rajdhani',sans-serif;color:var(--eq-white);}
        .eq-wrap::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,229,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,.018) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;z-index:0;}
        .eq-inner{max-width:1800px;margin:0 auto;position:relative;z-index:1;}
        .eq-topbar{display:flex;align-items:center;justify-content:space-between;padding:10px 20px;background:var(--eq-panel);border:1px solid var(--eq-border2);border-radius:6px;margin-bottom:14px;position:relative;overflow:hidden;}
        .eq-topbar::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--eq-gold),var(--eq-orange),var(--eq-green),var(--eq-cyan),var(--eq-gold));background-size:200% 100%;animation:eqFlow 4s linear infinite;}
        @keyframes eqFlow{0%{background-position:0%}100%{background-position:200%}}
        .eq-logo{font-family:'Orbitron',monospace;font-size:1rem;font-weight:900;color:var(--eq-gold);letter-spacing:.2em;text-shadow:0 0 20px rgba(255,215,0,.4);}
        .eq-module{font-family:monospace;font-size:.62rem;color:var(--eq-gray);letter-spacing:.15em;border-left:1px solid var(--eq-border2);padding-left:16px;}
        .eq-tb-right{display:flex;align-items:center;gap:12px;}
        .eq-clock{font-family:monospace;font-size:.75rem;color:var(--eq-cyan);}
        .eq-mkt{font-family:monospace;font-size:.6rem;padding:3px 10px;border-radius:3px;letter-spacing:.12em;}
        .status-open{background:rgba(0,230,118,.12);border:1px solid var(--eq-green);color:var(--eq-green);}
        .status-pre{background:rgba(255,171,0,.1);border:1px solid var(--eq-amber);color:var(--eq-amber);}
        .status-closed{background:rgba(255,23,68,.1);border:1px solid var(--eq-red);color:var(--eq-red);}
        .eq-nav-btn{font-family:monospace;font-size:.62rem;padding:5px 12px;border-radius:3px;border:1px solid var(--eq-border2);background:transparent;color:var(--eq-gray);cursor:pointer;transition:all .2s;letter-spacing:.1em;}
        .eq-nav-btn:hover,.eq-nav-btn.active{border-color:var(--eq-gold);color:var(--eq-gold);background:rgba(255,215,0,.08);}
        .eq-ticker-wrap{background:var(--eq-bg3);border:1px solid var(--eq-border);border-radius:4px;margin-bottom:14px;overflow:hidden;height:36px;display:flex;align-items:center;}
        .eq-ticker-label{font-family:'Orbitron',monospace;font-size:.55rem;font-weight:700;color:var(--eq-gold);letter-spacing:.15em;padding:0 14px;border-right:1px solid var(--eq-border2);white-space:nowrap;flex-shrink:0;}
        .eq-ticker-track{overflow:hidden;flex:1;}
        .eq-ticker-inner{display:flex;animation:tickEq 60s linear infinite;width:max-content;}
        .eq-ticker-inner:hover{animation-play-state:paused;}
        .eq-tick-item{display:flex;align-items:center;gap:8px;padding:0 20px;border-right:1px solid var(--eq-border);height:36px;white-space:nowrap;}
        @keyframes tickEq{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .val-up{color:var(--eq-green)!important;}
        .val-down{color:var(--eq-red)!important;}
        .val-neut{color:var(--eq-cyan)!important;}
        .eq-sec-title{font-family:'Orbitron',monospace;font-size:.75rem;font-weight:700;color:var(--eq-gold);letter-spacing:.2em;margin-bottom:10px;display:flex;align-items:center;gap:10px;}
        .eq-sec-title::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,var(--eq-border2),transparent);}
        .macro-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:14px;}
        .macro-card{background:var(--eq-panel);border:1px solid var(--eq-border);border-radius:6px;padding:12px 14px;position:relative;overflow:hidden;cursor:pointer;transition:all .25s;}
        .macro-card:hover{border-color:var(--eq-border2);transform:translateY(-1px);}
        .macro-card::before{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;}
        .mc-dxy::before{background:var(--eq-gold);}
        .mc-vix::before{background:var(--eq-red);}
        .mc-sp::before{background:var(--eq-green);}
        .mc-nas::before{background:var(--eq-cyan);}
        .mc-dow::before{background:var(--eq-teal);}
        .mc-rus::before{background:var(--eq-purple);}
        .mc-name{font-family:monospace;font-size:.58rem;color:var(--eq-gray);letter-spacing:.12em;margin-bottom:4px;}
        .mc-value{font-family:'Orbitron',monospace;font-size:1.1rem;font-weight:700;letter-spacing:.05em;}
        .mc-chg{font-family:monospace;font-size:.68rem;margin-top:2px;}
        .mc-sub{font-family:monospace;font-size:.55rem;color:var(--eq-gray);margin-top:3px;}
        .eq-main-grid{display:grid;grid-template-columns:340px 1fr;gap:14px;margin-bottom:14px;}
        .eq-stock-panel{background:var(--eq-panel);border:1px solid var(--eq-border);border-radius:6px;overflow:hidden;display:flex;flex-direction:column;}
        .eq-panel-head{padding:12px 16px;border-bottom:1px solid var(--eq-border);display:flex;align-items:center;justify-content:space-between;}
        .eq-panel-title{font-family:'Orbitron',monospace;font-size:.7rem;font-weight:700;color:var(--eq-cyan);letter-spacing:.15em;}
        .eq-panel-tag{font-family:monospace;font-size:.55rem;color:var(--eq-gray);background:var(--eq-bg3);padding:2px 8px;border-radius:2px;}
        .eq-search{padding:8px 12px;border-bottom:1px solid var(--eq-border);}
        .eq-search input{width:100%;background:var(--eq-bg3);border:1px solid var(--eq-border2);border-radius:3px;color:var(--eq-white);font-family:monospace;font-size:.72rem;padding:6px 10px;outline:none;transition:border-color .2s;}
        .eq-search input:focus{border-color:var(--eq-cyan);}
        .eq-stock-items{flex:1;overflow-y:auto;max-height:600px;}
        .eq-stock-row{display:flex;align-items:center;padding:10px 14px;border-bottom:1px solid rgba(26,42,58,.5);cursor:pointer;transition:all .2s;gap:10px;border-left:2px solid transparent;}
        .eq-stock-row:hover,.eq-stock-row.active{background:rgba(0,229,255,.04);border-left-color:var(--eq-cyan);}
        .sr-rank{font-family:monospace;font-size:.58rem;color:var(--eq-gray);width:18px;text-align:center;flex-shrink:0;}
        .sr-icon{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Orbitron',monospace;font-size:.55rem;font-weight:900;flex-shrink:0;}
        .sr-info{flex:1;min-width:0;}
        .sr-sym{font-family:monospace;font-size:.8rem;font-weight:700;color:var(--eq-white);}
        .sr-name{font-size:.68rem;color:var(--eq-gray);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .sr-bar{width:100%;height:2px;background:var(--eq-border);border-radius:1px;margin-top:2px;}
        .sr-right{text-align:right;flex-shrink:0;}
        .sr-price{font-family:monospace;font-size:.8rem;color:var(--eq-white);}
        .sr-pct{font-family:monospace;font-size:.65rem;}
        .sr-mcap{font-family:monospace;font-size:.55rem;color:var(--eq-gray);}
        .eq-detail-panel{background:var(--eq-panel);border:1px solid var(--eq-border);border-radius:6px;overflow:hidden;display:flex;flex-direction:column;}
        .detail-head{padding:14px 20px;border-bottom:1px solid var(--eq-border);display:flex;align-items:center;gap:16px;}
        .dh-icon{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Orbitron',monospace;font-size:.8rem;font-weight:900;}
        .dh-sym{font-family:'Orbitron',monospace;font-size:1.4rem;font-weight:900;color:var(--eq-white);letter-spacing:.05em;}
        .dh-full{font-size:.9rem;color:var(--eq-gray);}
        .dh-sector{font-family:monospace;font-size:.6rem;color:var(--eq-gray);background:var(--eq-bg3);border:1px solid var(--eq-border);padding:2px 8px;border-radius:2px;margin-top:3px;display:inline-block;}
        .dh-price-block{text-align:right;margin-left:auto;}
        .dh-price{font-family:'Orbitron',monospace;font-size:1.8rem;font-weight:900;}
        .dh-chg{font-family:monospace;font-size:.75rem;margin-top:3px;}
        .dh-upd{font-family:monospace;font-size:.55rem;color:var(--eq-gray);}
        .tf-tabs{display:flex;gap:0;padding:0 20px;border-bottom:1px solid var(--eq-border);overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;-ms-overflow-style:none;}
        .tf-tabs::-webkit-scrollbar{display:none;}
        .tf-btn{white-space:nowrap;flex-shrink:0;}
        .tf-btn{font-family:monospace;font-size:.65rem;padding:8px 14px;border:none;background:transparent;color:var(--eq-gray);cursor:pointer;border-bottom:2px solid transparent;transition:all .2s;letter-spacing:.08em;}
        .tf-btn:hover,.tf-btn.active{color:var(--eq-cyan);border-bottom-color:var(--eq-cyan);}
        .sig-badge{padding:2px 8px;border-radius:2px;font-size:.6rem;font-family:monospace;}
        .sig-strong-buy{background:rgba(0,230,118,.15);border:1px solid var(--eq-green);color:var(--eq-green);}
        .sig-buy{background:rgba(0,255,204,.1);border:1px solid var(--eq-neut);color:var(--eq-neut);}
        .sig-hold{background:rgba(0,229,255,.1);border:1px solid var(--eq-cyan);color:var(--eq-cyan);}
        .sig-sell{background:rgba(255,171,0,.1);border:1px solid var(--eq-amber);color:var(--eq-amber);}
        .sig-strong-sell{background:rgba(255,23,68,.1);border:1px solid var(--eq-red);color:var(--eq-red);}
        .chart-wrap{position:relative;background:var(--eq-bg3);border:1px solid var(--eq-border);border-radius:6px;padding:12px;height:260px;}
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:0 20px 16px;}
        .stat-box{background:var(--eq-bg3);border:1px solid var(--eq-border);border-radius:4px;padding:10px 12px;}
        .stat-lbl{font-family:monospace;font-size:.58rem;color:var(--eq-gray);letter-spacing:.1em;margin-bottom:3px;}
        .stat-val{font-family:monospace;font-size:.85rem;color:var(--eq-white);}
        .stat-sub{font-family:monospace;font-size:.55rem;color:var(--eq-gray);margin-top:2px;}
        .analysis-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:0 20px 16px;}
        .analysis-card{background:var(--eq-bg3);border:1px solid var(--eq-border);border-radius:6px;padding:12px;}
        .ac-title{font-family:monospace;font-size:.62rem;color:var(--eq-cyan);letter-spacing:.12em;margin-bottom:8px;display:flex;align-items:center;gap:6px;}
        .ac-dot{width:6px;height:6px;border-radius:50%;background:var(--eq-cyan);}
        .ac-body{font-size:.82rem;color:var(--eq-gray);line-height:1.5;}
        .ac-badge{display:inline-block;padding:2px 8px;border-radius:2px;font-family:monospace;font-size:.6rem;margin-top:6px;}
        .badge-bull{background:rgba(0,230,118,.12);border:1px solid var(--eq-green);color:var(--eq-green);}
        .badge-bear{background:rgba(255,23,68,.1);border:1px solid var(--eq-red);color:var(--eq-red);}
        .score-row{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
        .score-lbl{font-family:monospace;font-size:.6rem;color:var(--eq-gray);width:80px;flex-shrink:0;}
        .score-track{flex:1;height:5px;background:var(--eq-border);border-radius:3px;overflow:hidden;}
        .score-fill{height:100%;border-radius:3px;}
        .score-val{font-family:monospace;font-size:.6rem;color:var(--eq-white);width:28px;text-align:right;}
        .corr-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
        .corr-item{background:var(--eq-bg3);border:1px solid var(--eq-border);border-radius:4px;padding:10px;text-align:center;}
        .corr-asset{font-family:monospace;font-size:.62rem;color:var(--eq-gray);margin-bottom:4px;}
        .corr-val{font-family:'Orbitron',monospace;font-size:1rem;font-weight:700;}
        .corr-bar{width:100%;height:3px;background:var(--eq-border);border-radius:2px;margin-top:6px;overflow:hidden;}
        .corr-lbl{font-family:monospace;font-size:.55rem;color:var(--eq-gray);margin-top:4px;}
        .news-item{background:var(--eq-bg3);border:1px solid var(--eq-border);border-radius:4px;padding:10px 12px;display:flex;gap:12px;align-items:flex-start;margin-bottom:6px;}
        .news-sentiment{width:3px;border-radius:2px;align-self:stretch;flex-shrink:0;}
        .news-title{font-size:.82rem;color:var(--eq-white);line-height:1.3;margin-bottom:3px;}
        .news-meta{font-family:monospace;font-size:.58rem;color:var(--eq-gray);}
        .annotation{background:rgba(255,215,0,.06);border:1px solid rgba(255,215,0,.2);border-radius:4px;padding:8px 12px;margin-bottom:8px;}
        .ann-title{font-family:monospace;font-size:.6rem;color:var(--eq-gold);letter-spacing:.1em;margin-bottom:4px;}
        .ann-body{font-size:.8rem;color:var(--eq-gray);line-height:1.4;}
        .eq-bottom-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px;}
        .eq-bottom-panel{background:var(--eq-panel);border:1px solid var(--eq-border);border-radius:6px;overflow:hidden;}
        .bp-head{padding:10px 14px;border-bottom:1px solid var(--eq-border);display:flex;align-items:center;justify-content:space-between;}
        .bp-title{font-family:'Orbitron',monospace;font-size:.65rem;font-weight:700;color:var(--eq-cyan);letter-spacing:.15em;}
        .bp-body{padding:12px 14px;}
        .heatmap-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;}
        .hm-cell{border-radius:3px;padding:8px 4px;text-align:center;cursor:pointer;transition:opacity .2s;}
        .hm-cell:hover{opacity:.8;}
        .hm-sym{font-family:monospace;font-size:.6rem;color:rgba(255,255,255,.9);font-weight:700;}
        .hm-pct{font-family:monospace;font-size:.58rem;}
        .alert-item{display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--eq-bg3);border-radius:4px;border-left:3px solid;margin-bottom:6px;}
        .alert-msg{font-size:.8rem;color:var(--eq-white);}
        .alert-time{font-family:monospace;font-size:.58rem;color:var(--eq-gray);}
        .alert-sev-badge{font-family:monospace;font-size:.6rem;padding:2px 7px;border-radius:2px;}
        .sev-high{border-color:var(--eq-red);}
        .sev-high .alert-sev-badge{background:rgba(255,23,68,.15);border:1px solid var(--eq-red);color:var(--eq-red);}
        .sev-med{border-color:var(--eq-amber);}
        .sev-med .alert-sev-badge{background:rgba(255,171,0,.12);border:1px solid var(--eq-amber);color:var(--eq-amber);}
        .sev-low{border-color:var(--eq-cyan);}
        .sev-low .alert-sev-badge{background:rgba(0,229,255,.1);border:1px solid var(--eq-cyan);color:var(--eq-cyan);}
        .sec-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
        .sec-name{font-family:monospace;font-size:.62rem;color:var(--eq-gray);width:120px;flex-shrink:0;}
        .sec-track{flex:1;height:14px;background:var(--eq-border);border-radius:3px;overflow:hidden;position:relative;}
        .sec-fill{height:100%;border-radius:3px;display:flex;align-items:center;padding-left:6px;}
        .sec-val{font-family:monospace;font-size:.58rem;position:absolute;right:6px;top:50%;transform:translateY(-50%);}
        .conf-table{width:100%;border-collapse:collapse;}
        .conf-table th{font-family:monospace;font-size:.58rem;color:var(--eq-gray);letter-spacing:.1em;padding:6px 10px;text-align:left;border-bottom:1px solid var(--eq-border);}
        .conf-table td{font-family:monospace;font-size:.68rem;padding:7px 10px;border-bottom:1px solid rgba(26,42,58,.4);}
        .conf-table tr:hover td{background:rgba(0,229,255,.03);cursor:pointer;}
        .conf-dot{width:7px;height:7px;border-radius:50%;display:inline-block;margin-right:4px;}
        .eq-footer{padding:10px 0;text-align:center;font-family:monospace;font-size:.55rem;color:var(--eq-gray);border-top:1px solid var(--eq-border);letter-spacing:.1em;margin-top:14px;}
        @media(max-width:1200px){.macro-grid{grid-template-columns:repeat(3,1fr);}.eq-main-grid{grid-template-columns:280px 1fr;}.eq-bottom-row{grid-template-columns:1fr 1fr;}}
        @media(max-width:900px){.eq-main-grid{grid-template-columns:1fr;}.eq-bottom-row{grid-template-columns:1fr;}.stats-grid{grid-template-columns:repeat(2,1fr);}.analysis-grid{grid-template-columns:1fr;}.corr-grid{grid-template-columns:repeat(2,1fr);}}
      `}</style>

      <div className="eq-wrap">
        <SiteNav />

        <div className="eq-inner" style={{ paddingTop: "80px" }}>

          {/* TOPBAR */}
          <div className="eq-topbar">
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div className="eq-logo">PSYCHOMETRIKS</div>
              <div className="eq-module">EQUITIES COMMAND CENTER v1.0</div>
            </div>
            <div className="eq-tb-right">
              <div style={{ display:"flex", gap:6 }}>
                {(["overview","sectors","confluence"] as Section[]).map((s, i) => (
                  <button key={s} className={`eq-nav-btn${section === s ? " active" : ""}`} onClick={() => setSection(s)}>
                    {["OVERVIEW","SECTORES","CONFLUENCIA"][i]}
                  </button>
                ))}
              </div>
              <div className={`eq-mkt ${mktStatus.cls}`}>{mktStatus.text}</div>
              <div className="eq-clock">{clock}</div>
            </div>
          </div>

          {/* TICKER TAPE */}
          <div className="eq-ticker-wrap">
            <div className="eq-ticker-label">▶ LIVE</div>
            <div className="eq-ticker-track">
              <div className="eq-ticker-inner">
                {[...liveStocks, ...[{sym:"SPY",price:521.40,pct:+0.35},{sym:"QQQ",price:447.20,pct:+0.46},{sym:"XAU/USD",price:2334.50,pct:+0.18},{sym:"WTI",price:78.45,pct:-0.82},{sym:"BTC",price:67420,pct:+1.23}],...liveStocks].map((s, i) => (
                  <div key={i} className="eq-tick-item">
                    <span style={{ fontFamily:"monospace", fontSize:".7rem", fontWeight:700, color:"#eceff1" }}>{s.sym}</span>
                    <span style={{ fontFamily:"monospace", fontSize:".7rem", color:"#546e7a" }}>${s.price > 1000 ? s.price.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) : s.price.toFixed(2)}</span>
                    <span style={{ fontFamily:"monospace", fontSize:".65rem", color: s.pct >= 0 ? "#00e676" : "#ff1744" }}>{s.pct >= 0 ? "▲" : "▼"} {Math.abs(s.pct).toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══ OVERVIEW ══ */}
          {section === "overview" && (
            <>
              <div className="eq-sec-title">ÍNDICES MACRO & CORRELACIONES CLAVE</div>
              <div className="macro-grid">
                {MACRO.map(m => (
                  <div key={m.id} className={`macro-card ${m.colorClass}`}>
                    <div className="mc-name">{m.name}</div>
                    <div className={`mc-value ${m.valClass}`}>{m.value.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                    <div className={`mc-chg ${m.valClass}`}>{m.chg >= 0 ? "+" : ""}{m.chg.toFixed(2)} ({m.pct >= 0 ? "+" : ""}{m.pct.toFixed(2)}%)</div>
                    <div className="mc-sub">{m.sub}</div>
                  </div>
                ))}
              </div>

              <div className="eq-main-grid">
                {/* STOCK LIST */}
                <div className="eq-stock-panel">
                  <div className="eq-panel-head">
                    <div className="eq-panel-title">TOP 20 EQUITIES</div>
                    <div className="eq-panel-tag">POR MARKET CAP</div>
                  </div>
                  <div className="eq-search">
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="BUSCAR TICKER / EMPRESA..." />
                  </div>
                  <div className="eq-stock-items">
                    {filtered.map(s => {
                      const up = s.pct >= 0;
                      const mcapNum = parseFloat(s.mcap.replace(/[TB]/, "")) * (s.mcap.includes("T") ? 1000 : 1);
                      const fillPct = Math.min(100, (mcapNum / 3080) * 100);
                      return (
                        <div key={s.sym} className={`eq-stock-row${activeStock?.sym === s.sym ? " active" : ""}`} onClick={() => selectStock(s.sym)}>
                          <div className="sr-rank">{s.rank}</div>
                          <div className="sr-icon" style={{ background:s.bg, color:s.color }}>{s.sym.substring(0,2)}</div>
                          <div className="sr-info">
                            <div className="sr-sym">{s.sym}</div>
                            <div className="sr-name">{s.name}</div>
                            <div className="sr-bar"><div style={{ width:`${fillPct}%`, height:"100%", background:`${s.color}20`, border:`1px solid ${s.color}40`, borderRadius:1 }} /></div>
                          </div>
                          <div className="sr-right">
                            <div className="sr-price">${s.price.toFixed(2)}</div>
                            <div className={`sr-pct ${up ? "val-up" : "val-down"}`}>{up ? "+" : ""}{s.pct.toFixed(2)}%</div>
                            <div className="sr-mcap">{s.mcap}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* DETAIL PANEL */}
                <div className="eq-detail-panel">
                  {!activeStock ? (
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:400, flexDirection:"column", gap:12 }}>
                      <div style={{ fontFamily:"'Orbitron',monospace", fontSize:"1rem", color:"var(--eq-gray)", letterSpacing:".2em" }}>SELECCIONA UN ACTIVO</div>
                      <div style={{ fontFamily:"monospace", fontSize:".65rem", color:"var(--eq-border2)" }}>← CLICK EN CUALQUIER EMPRESA DE LA LISTA</div>
                    </div>
                  ) : (() => {
                    const s = activeStock;
                    const up = s.pct >= 0;
                    return (
                      <>
                        <div className="detail-head">
                          <div className="dh-icon" style={{ background:s.bg, color:s.color }}>{s.sym.substring(0,2)}</div>
                          <div>
                            <div className="dh-sym">{s.sym}</div>
                            <div className="dh-full">{s.name}</div>
                            <div className="dh-sector">{s.sector}</div>
                          </div>
                          <div className="dh-price-block">
                            <div className={`dh-price ${up ? "val-up" : "val-down"}`}>${s.price.toFixed(2)}</div>
                            <div className={`dh-chg ${up ? "val-up" : "val-down"}`}>{up ? "▲" : "▼"} {Math.abs(s.chg).toFixed(2)} ({up ? "+" : ""}{s.pct.toFixed(2)}%)</div>
                            <div className="dh-upd">ÚLTIMO: HOY {new Date().toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit"})}</div>
                          </div>
                        </div>

                        <div className="tf-tabs">
                          {["1D","1S","1M","3M","6M","1A","5A","MAX"].map(t => (
                            <button key={t} className={`tf-btn${tf === t ? " active" : ""}`} onClick={() => setTf(t)}>{t}</button>
                          ))}
                          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, padding:"0 10px" }}>
                            <span className={`${sigClass(s.signal)} sig-badge`}>{s.signal}</span>
                          </div>
                        </div>

                        <div style={{ padding:"16px 20px" }}>
                          <div className="annotation">
                            <div className="ann-title">📖 QUÉ MUESTRA ESTE GRÁFICO</div>
                            <div className="ann-body">Precio histórico + EMA 20 (azul) + EMA 200 (oro) + Bandas de Bollinger. Las EMAs muestran tendencia de corto y largo plazo. Bollinger Bands miden volatilidad — precio cerca del upper band = sobrecompra potencial.</div>
                          </div>
                          <div style={{ display:"flex", gap:16, marginBottom:10 }}>
                            {[{label:"Precio",c:s.color},{label:"EMA 20",c:"#40c4ff"},{label:"EMA 200",c:"#ffd700"},{label:"BB ±2σ",c:"rgba(255,255,255,.2)"}].map(l=>(
                              <div key={l.label} style={{ display:"flex", alignItems:"center", gap:6, fontFamily:"monospace", fontSize:".6rem", color:"#546e7a" }}>
                                <div style={{ width:8, height:8, borderRadius:"50%", background:l.c }} />{l.label}
                              </div>
                            ))}
                          </div>
                          <div className="chart-wrap"><canvas ref={chartRef} /></div>
                        </div>

                        <div className="stats-grid">
                          <div className="stat-box"><div className="stat-lbl">52W HIGH</div><div className="stat-val val-up">${s.high52.toFixed(2)}</div><div className="stat-sub">{((s.price-s.high52)/s.high52*100).toFixed(1)}% desde máx</div></div>
                          <div className="stat-box"><div className="stat-lbl">52W LOW</div><div className="stat-val val-down">${s.low52.toFixed(2)}</div><div className="stat-sub">+{((s.price-s.low52)/s.low52*100).toFixed(1)}% desde mín</div></div>
                          <div className="stat-box"><div className="stat-lbl">P/E RATIO</div><div className="stat-val val-neut">{s.pe.toFixed(1)}x</div><div className="stat-sub">EPS: ${s.eps.toFixed(2)}</div></div>
                          <div className="stat-box"><div className="stat-lbl">MARKET CAP</div><div className="stat-val">{s.mcap}</div><div className="stat-sub">Vol: {s.vol}</div></div>
                          <div className="stat-box"><div className="stat-lbl">DIVIDENDO</div><div className="stat-val">{s.div > 0 ? "$"+s.div.toFixed(2) : "—"}</div><div className="stat-sub">Yield: {s.yield > 0 ? s.yield.toFixed(2)+"%" : "N/A"}</div></div>
                          <div className="stat-box"><div className="stat-lbl">BETA</div><div className={`stat-val ${s.beta>1.2?"val-down":s.beta<0.8?"val-up":"val-neut"}`}>{s.beta.toFixed(2)}</div><div className="stat-sub">{s.beta>1.2?"Alta volatilidad":s.beta<0.8?"Defensivo":"Market neutral"}</div></div>
                          <div className="stat-box"><div className="stat-lbl">RSI(14)</div><div className={`stat-val ${s.rsi>70?"val-down":s.rsi<30?"val-up":"val-neut"}`}>{s.rsi}</div><div className="stat-sub">{s.rsi>70?"⚠ Sobrecompra":s.rsi<30?"⚡ Sobreventa":"Zona neutral"}</div></div>
                          <div className="stat-box"><div className="stat-lbl">ATR(14)</div><div className="stat-val">{s.atr.toFixed(1)}</div><div className="stat-sub">Rango diario esperado</div></div>
                        </div>

                        <div style={{ padding:"0 20px 8px", fontFamily:"'Orbitron',monospace", fontSize:".65rem", color:"var(--eq-gold)", letterSpacing:".15em" }}>ANÁLISIS TÉCNICO + FUNDAMENTAL</div>
                        <div className="analysis-grid">
                          <div className="analysis-card"><div className="ac-title"><div className="ac-dot" />DESCRIPCIÓN</div><div className="ac-body">{s.desc}</div></div>
                          <div className="analysis-card"><div className="ac-title"><div className="ac-dot" style={{ background:"var(--eq-green)" }} />TESIS ALCISTA</div><div className="ac-body">{s.bull}</div><span className="ac-badge badge-bull">BULL CASE</span></div>
                          <div className="analysis-card"><div className="ac-title"><div className="ac-dot" style={{ background:"var(--eq-red)" }} />RIESGOS BAJISTAS</div><div className="ac-body">{s.bear}</div><span className="ac-badge badge-bear">BEAR CASE</span></div>
                        </div>

                        <div style={{ padding:"0 20px 8px", fontFamily:"'Orbitron',monospace", fontSize:".65rem", color:"var(--eq-cyan)", letterSpacing:".15em" }}>INDICADORES TÉCNICOS</div>
                        <div style={{ padding:"0 20px 16px" }}>
                          <div className="annotation" style={{ borderColor:"rgba(0,229,255,.2)", background:"rgba(0,229,255,.04)", marginBottom:10 }}>
                            <div className="ann-title" style={{ color:"var(--eq-cyan)" }}>📊 CÓMO LEER LOS SCORES</div>
                            <div className="ann-body">Score 0-100. Verde = señal alcista fuerte. Los scores combinan momentum, volumen, estructura de mercado y posición relativa para dar un panorama unificado.</div>
                          </div>
                          {[
                            { lbl:"MOMENTUM",   val:s.rsi,  color: s.rsi>60?"var(--eq-green)":s.rsi<40?"var(--eq-red)":"var(--eq-amber)" },
                            { lbl:"TENDENCIA",   val:s.ema200==="Sobre"?72:35, color:"var(--eq-cyan)" },
                            { lbl:"VOLUMEN",     val:65, color:"var(--eq-teal)" },
                            { lbl:"FUNDAMENTAL", val:Math.min(100,Math.floor(100-s.pe/50*30+20)), color:"var(--eq-gold)" },
                            { lbl:"MACRO CONF.", val:s.signal==="STRONG BUY"?88:s.signal==="BUY"?72:s.signal==="HOLD"?50:35, color:"var(--eq-purple)" },
                          ].map(sc => (
                            <div key={sc.lbl} className="score-row">
                              <div className="score-lbl">{sc.lbl}</div>
                              <div className="score-track"><div className="score-fill" style={{ width:`${sc.val}%`, background:sc.color }} /></div>
                              <div className="score-val">{sc.val}</div>
                            </div>
                          ))}
                        </div>

                        <div className="analysis-grid" style={{ padding:"0 20px 16px" }}>
                          <div className="analysis-card"><div className="ac-title"><div className="ac-dot" style={{ background:"var(--eq-purple)" }} />WYCKOFF FASE</div><div className="ac-body" style={{ fontSize:".85rem" }}>{s.wyckoff}</div><div style={{ fontFamily:"monospace", fontSize:".6rem", color:"var(--eq-gray)", marginTop:6 }}>Acumulación → Markup → Distribución → Markdown</div></div>
                          <div className="analysis-card"><div className="ac-title"><div className="ac-dot" style={{ background:"var(--eq-gold)" }} />ELLIOTT WAVE</div><div className="ac-body" style={{ fontSize:".85rem" }}>{s.elliott}</div><div style={{ fontFamily:"monospace", fontSize:".6rem", color:"var(--eq-gray)", marginTop:6 }}>Onda 3 = más extensa y rentable</div></div>
                          <div className="analysis-card"><div className="ac-title"><div className="ac-dot" style={{ background:"var(--eq-amber)" }} />CONFLUENCIA MACRO</div><div className="ac-body" style={{ fontSize:".8rem" }}>MACD: <span style={{ color:s.macd==="Bullish"?"var(--eq-green)":s.macd==="Bearish"?"var(--eq-red)":"var(--eq-cyan)" }}>{s.macd}</span><br />EMA200: <span style={{ color:s.ema200==="Sobre"?"var(--eq-green)":"var(--eq-red)" }}>Precio {s.ema200} EMA200</span><br />Beta vs SPX: {s.beta.toFixed(2)}</div></div>
                        </div>

                        <div style={{ padding:"0 20px 8px", fontFamily:"'Orbitron',monospace", fontSize:".65rem", color:"var(--eq-gold)", letterSpacing:".15em" }}>CORRELACIÓN CON ACTIVOS MACRO</div>
                        <div style={{ padding:"0 20px 16px" }}>
                          <div className="annotation" style={{ borderColor:"rgba(255,215,0,.2)", marginBottom:10 }}>
                            <div className="ann-title">📖 CORRELACIÓN: QUÉ SIGNIFICA</div>
                            <div className="ann-body">+1.0 = movimiento idéntico. -1.0 = movimiento opuesto. 0 = sin relación. Si DXY sube y la correlación es negativa, es un headwind para la acción.</div>
                          </div>
                          <div className="corr-grid">
                            {buildCorrelations(s).map(c => {
                              const pos = c.val >= 0;
                              return (
                                <div key={c.asset} className="corr-item">
                                  <div className="corr-asset">{c.asset}</div>
                                  <div className={`corr-val ${pos ? "val-up" : "val-down"}`}>{c.val.toFixed(2)}</div>
                                  <div className="corr-bar"><div style={{ width:`${Math.floor(Math.abs(c.val)*100)}%`, height:"100%", background:pos?"var(--eq-green)":"var(--eq-red)", borderRadius:2 }} /></div>
                                  <div style={{ fontFamily:"monospace", fontSize:".55rem", color:"var(--eq-gray)", marginTop:4 }}>{pos ? "↑ POSITIVO" : "↓ INVERSO"}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div style={{ padding:"0 20px 8px", fontFamily:"'Orbitron',monospace", fontSize:".65rem", color:"var(--eq-cyan)", letterSpacing:".15em" }}>NOTICIAS RECIENTES</div>
                        <div style={{ padding:"0 20px 16px" }}>
                          {s.news.map((n, i) => (
                            <div key={i} className="news-item">
                              <div className="news-sentiment" style={{ background:n.s>0?"var(--eq-green)":n.s<0?"var(--eq-red)":"var(--eq-gray)" }} />
                              <div><div className="news-title">{n.t}</div><div className="news-meta">{n.src} • {n.time} • <span style={{ color:n.s>0?"var(--eq-green)":n.s<0?"var(--eq-red)":"var(--eq-gray)" }}>{n.s>0?"POSITIVO":n.s<0?"NEGATIVO":"NEUTRAL"}</span></div></div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* BOTTOM ROW */}
              <div className="eq-bottom-row">
                {/* HEATMAP */}
                <div className="eq-bottom-panel">
                  <div className="bp-head"><div className="bp-title">HEATMAP — RENDIMIENTO HOY</div><span style={{ fontFamily:"monospace", fontSize:".58rem", color:"var(--eq-gray)" }}>% CHG</span></div>
                  <div className="bp-body">
                    <div className="heatmap-grid">
                      {liveStocks.map(s => {
                        const intensity = Math.min(Math.abs(s.pct) / 3, 1);
                        const bg = s.pct > 0 ? `rgba(0,230,118,${0.15+intensity*0.55})` : `rgba(255,23,68,${0.15+intensity*0.55})`;
                        return (
                          <div key={s.sym} className="hm-cell" style={{ background:bg }} onClick={() => selectStock(s.sym)}>
                            <div className="hm-sym">{s.sym}</div>
                            <div className="hm-pct" style={{ color:s.pct>0?"#00e676":"#ff1744" }}>{s.pct>0?"+":""}{s.pct.toFixed(2)}%</div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:10, justifyContent:"center" }}>
                      <div style={{ width:60, height:6, background:"linear-gradient(90deg,#ff1744,#2a1a2a,#00e676)", borderRadius:3 }} />
                      <span style={{ fontFamily:"monospace", fontSize:".55rem", color:"var(--eq-gray)" }}>BEAR ← → BULL</span>
                    </div>
                  </div>
                </div>

                {/* ALERTS */}
                <div className="eq-bottom-panel">
                  <div className="bp-head"><div className="bp-title">⚡ ALERTAS DE VOLATILIDAD</div></div>
                  <div className="bp-body">
                    {ALERTS.map((a, i) => (
                      <div key={i} className={`alert-item ${a.sev}`}>
                        <div style={{ fontSize:"1rem" }}>{a.icon}</div>
                        <div style={{ flex:1 }}><div className="alert-msg">{a.msg}</div><div className="alert-time">{a.time}</div></div>
                        <div className="alert-sev-badge">{a.sev==="sev-high"?"ALTA":a.sev==="sev-med"?"MEDIA":"BAJA"}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTORS */}
                <div className="eq-bottom-panel">
                  <div className="bp-head"><div className="bp-title">RENDIMIENTO POR SECTOR</div><span style={{ fontFamily:"monospace", fontSize:".58rem", color:"var(--eq-gray)" }}>YTD</span></div>
                  <div className="bp-body">
                    {SECTORS.map(s => {
                      const max = Math.max(...SECTORS.map(x => Math.abs(x.pct)));
                      const pct = Math.abs(s.pct) / max * 100;
                      const up = s.pct >= 0;
                      return (
                        <div key={s.name} className="sec-row">
                          <div className="sec-name">{s.name}</div>
                          <div className="sec-track">
                            <div className="sec-fill" style={{ width:`${pct}%`, background:up?s.color+"33":"rgba(255,23,68,.25)" }} />
                            <span className="sec-val" style={{ color:up?s.color:"var(--eq-red)" }}>{up?"+":""}{s.pct.toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ══ SECTORES ══ */}
          {section === "sectors" && (
            <>
              <div className="eq-sec-title">ANÁLISIS SECTORIAL PROFUNDO</div>
              {Object.entries(STOCKS.reduce((acc, s) => { if (!acc[s.sector]) acc[s.sector] = []; acc[s.sector].push(s); return acc; }, {} as Record<string,Stock[]>)).map(([sec, stocks]) => (
                <div key={sec} style={{ background:"var(--eq-panel)", border:"1px solid var(--eq-border)", borderRadius:6, marginBottom:12, overflow:"hidden" }}>
                  <div style={{ padding:"10px 16px", borderBottom:"1px solid var(--eq-border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontFamily:"'Orbitron',monospace", fontSize:".7rem", fontWeight:700, color:"var(--eq-cyan)", letterSpacing:".15em" }}>{sec.toUpperCase()}</div>
                    <div style={{ fontFamily:"monospace", fontSize:".62rem", color:"var(--eq-gray)" }}>{stocks.length} empresa{stocks.length > 1 ? "s" : ""}</div>
                  </div>
                  <div style={{ padding:"12px 16px", display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:8 }}>
                    {stocks.map(s => {
                      const up = s.pct >= 0;
                      return (
                        <div key={s.sym} onClick={() => { selectStock(s.sym); setSection("overview"); }}
                          style={{ background:"var(--eq-bg3)", border:"1px solid var(--eq-border)", borderRadius:4, padding:10, cursor:"pointer", transition:"border-color .2s" }}
                          onMouseOver={e => (e.currentTarget.style.borderColor = "var(--eq-cyan)")}
                          onMouseOut={e => (e.currentTarget.style.borderColor = "var(--eq-border)")}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                            <span style={{ fontFamily:"monospace", fontSize:".8rem", fontWeight:700, color:s.color }}>{s.sym}</span>
                            <span style={{ fontFamily:"monospace", fontSize:".65rem", color:up?"var(--eq-green)":"var(--eq-red)" }}>{up?"+":""}{s.pct.toFixed(2)}%</span>
                          </div>
                          <div style={{ fontSize:".72rem", color:"var(--eq-gray)" }}>{s.name}</div>
                          <div style={{ fontFamily:"monospace", fontSize:".7rem", color:"var(--eq-white)", marginTop:4 }}>${s.price.toFixed(2)}</div>
                          <div style={{ fontFamily:"monospace", fontSize:".58rem", color:"var(--eq-gray)", marginTop:2 }}>{s.mcap} cap · P/E {s.pe}x</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ══ CONFLUENCIA ══ */}
          {section === "confluence" && (
            <>
              <div className="eq-sec-title">MATRIX DE CONFLUENCIA — BOLSA vs MACRO</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div className="eq-bottom-panel">
                  <div className="bp-head"><div className="bp-title">SEÑALES TÉCNICAS TOP 20</div></div>
                  <div className="bp-body">
                    <table className="conf-table">
                      <thead><tr><th>TICKER</th><th>RSI</th><th>MACD</th><th>EMA200</th><th>SEÑAL</th><th>SCORE</th></tr></thead>
                      <tbody>
                        {STOCKS.map(s => {
                          const score = s.signal==="STRONG BUY"?88:s.signal==="BUY"?72:s.signal==="HOLD"?50:35;
                          return (
                            <tr key={s.sym} onClick={() => { selectStock(s.sym); setSection("overview"); }}>
                              <td><span className="conf-dot" style={{ background:s.color }} />{s.sym}</td>
                              <td style={{ color:s.rsi>70?"var(--eq-red)":s.rsi<30?"var(--eq-green)":"var(--eq-white)" }}>{s.rsi}</td>
                              <td style={{ color:s.macd==="Bullish"?"var(--eq-green)":s.macd==="Bearish"?"var(--eq-red)":"var(--eq-amber)" }}>{s.macd}</td>
                              <td style={{ color:s.ema200==="Sobre"?"var(--eq-green)":"var(--eq-red)" }}>{s.ema200}</td>
                              <td><span className={`${sigClass(s.signal)} sig-badge`}>{s.signal}</span></td>
                              <td style={{ color:score>70?"var(--eq-green)":score<40?"var(--eq-red)":"var(--eq-amber)" }}>{score}/100</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="eq-bottom-panel">
                  <div className="bp-head"><div className="bp-title">CORRELACIÓN DXY / TASAS / ORO / PETRÓLEO</div></div>
                  <div className="bp-body">
                    {[
                      { title:"🌍 IMPACTO DXY FUERTE EN EQUITIES", body:"Cuando el dólar sube (DXY ↑): empresas exportadoras sufren, multinationales reportan menos en USD, commodities bajan. Tech growth stocks con deuda en USD son las más afectadas." },
                      { title:"📈 TASAS 10Y vs GROWTH STOCKS", body:"Relación inversa fuerte. Si US10Y sube por encima de 4.5%: valuation de tech se comprime porque el DCF discount rate sube. NVDA/MSFT/AAPL con PER alto son más sensibles.", color:"rgba(0,230,118,.2)", bg:"rgba(0,230,118,.04)", tc:"var(--eq-green)" },
                      { title:"🛢️ PETRÓLEO WTI y SECTORES", body:"WTI $80+ beneficia XOM/CVX. WTI alto = inflación de inputs para industriales/aerolíneas/retail. Tech es inmune directamente pero correlación vía inflación → Fed → tasas.", color:"rgba(255,109,0,.2)", bg:"rgba(255,109,0,.04)", tc:"var(--eq-orange)" },
                      { title:"🥇 ORO XAU/USD como HEDGE", body:"Oro sube cuando: Fed pivota dovish, DXY cae, riesgo geopolítico aumenta, inflación sorprende al alza. Correlación negativa con tech growth stocks de alto PER.", color:"rgba(255,215,0,.2)", bg:"rgba(255,215,0,.04)", tc:"var(--eq-gold)" },
                    ].map((a, i) => (
                      <div key={i} className="annotation" style={{ borderColor:a.color, background:a.bg }}>
                        <div className="ann-title" style={{ color:a.tc }}>{a.title}</div>
                        <div className="ann-body">{a.body}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginTop:14 }}>
                <div className="eq-bottom-panel">
                  <div className="bp-head"><div className="bp-title">📖 GUÍA DE LECTURA — QUÉ SIGNIFICAN ESTOS GRÁFICOS</div></div>
                  <div className="bp-body">
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                      {[
                        { icon:"📊", title:"RSI — Relative Strength Index", body:">70 = sobrecompra (posible reversión bajista). <30 = sobreventa (posible rebote). 40-60 = zona neutral. En tendencias fuertes, RSI puede mantenerse en zona extrema mucho tiempo." },
                        { icon:"📈", title:"MACD — Moving Average Convergence", body:"Diferencia entre EMA12 y EMA26. Cuando MACD cruza su Signal Line hacia arriba = señal alcista. Histograma positivo y creciente = momentum bullish." },
                        { icon:"〽️", title:"EMA 200 — Tendencia Primaria", body:"Precio sobre EMA200 = bull trend. Precio bajo EMA200 = bear trend. El cruce conocido como Golden Cross (EMA50 sobre EMA200) es señal alcista de largo plazo." },
                        { icon:"🎯", title:"Wyckoff — Fases del Mercado", body:"Acumulación (Fase A-E): institucionales compran. Markup: precio sube. Distribución: institucionales venden. Markdown: precio cae. Identificar la fase correcta da ventaja enorme." },
                        { icon:"🌊", title:"Elliott Wave — Ondas del Precio", body:"5 ondas impulsivas + 3 correctivas (A-B-C). Onda 3 es siempre la más larga y rentable. Onda C suele igualar a Onda A en extensión. Fib ratios 0.618/1.618 son clave." },
                        { icon:"⚡", title:"Beta — Sensibilidad vs Mercado", body:"Beta 1.0 = se mueve igual que SPX. Beta 2.0 = doble de volátil que el mercado. TSLA (β=2) amplifica correcciones. BRK.B (β=0.9) casi market-neutral." },
                        { icon:"💹", title:"P/E Ratio — Valuación", body:"PER <15 = value barato. PER 15-25 = razonable. PER >30 = growth premium. NVDA PER 67 requiere crecer EPS 40%+ anual para justificarse." },
                        { icon:"🔗", title:"Correlación entre Activos", body:"Correlación >0.7 = movimiento casi paralelo. Correlación negativa fuerte = hedge natural. En crisis, todas las correlaciones van a +1 (todo cae junto)." },
                        { icon:"📉", title:"ATR — Average True Range", body:"Volatilidad real diaria en dólares. NVDA ATR $28 = espera movimientos de $28/día. Usa ATR para sizing: stop loss óptimo = 1.5x ATR. TP óptimo = 2-3x ATR desde entry." },
                      ].map(g => (
                        <div key={g.title} className="analysis-card">
                          <div className="ac-title" style={{ fontSize:".65rem" }}>{g.icon} {g.title}</div>
                          <div className="ac-body">{g.body}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="eq-footer">PSYCHOMETRIKS EQUITIES v1.0 — DATA SIMULADA PARA FINES EDUCATIVOS — NO ES ASESORÍA FINANCIERA — YO NO PREDIGO — YO LEO LA DATA</div>
        </div>
      </div>
    </>
  );
}
