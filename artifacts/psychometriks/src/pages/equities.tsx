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

// ─── Fundamentals Buffett (ROE%, D/E, Earnings Growth%, Payout Ratio%) ────────
const FUND: Record<string, { roe:number; de:number; eg:number; pr:number; moat:string; yrsDiv:number }> = {
  "AAPL":  { roe:147, de:1.70, eg:8,    pr:15, moat:"Ecosistema + marca global",     yrsDiv:12 },
  "MSFT":  { roe:38,  de:0.35, eg:18,   pr:25, moat:"Azure + Office enterprise lock-in", yrsDiv:21 },
  "NVDA":  { roe:91,  de:0.41, eg:185,  pr:1,  moat:"CUDA ecosystem + AI monopolio", yrsDiv:11 },
  "AMZN":  { roe:14,  de:0.27, eg:45,   pr:0,  moat:"AWS + Prime logística",         yrsDiv:0  },
  "GOOGL": { roe:27,  de:0.07, eg:22,   pr:0,  moat:"Search 92% cuota + YouTube",    yrsDiv:0  },
  "META":  { roe:33,  de:0.13, eg:68,   pr:8,  moat:"3.2B usuarios diarios",         yrsDiv:0  },
  "TSLA":  { roe:12,  de:0.08, eg:-30,  pr:0,  moat:"Supercharger + software FSD",   yrsDiv:0  },
  "BRK.B": { roe:13,  de:0.31, eg:5,    pr:0,  moat:"Float seguros + capital allocation", yrsDiv:0 },
  "JPM":   { roe:17,  de:1.20, eg:12,   pr:29, moat:"Investment bank + fortress balance", yrsDiv:13 },
  "V":     { roe:46,  de:0.55, eg:14,   pr:22, moat:"Red global 3.9B tarjetas",      yrsDiv:15 },
  "WMT":   { roe:22,  de:0.68, eg:9,    pr:34, moat:"Supply chain + precio bajo",    yrsDiv:51 },
  "XOM":   { roe:15,  de:0.15, eg:-3,   pr:47, moat:"Permian low-cost + integración", yrsDiv:41 },
  "JNJ":   { roe:23,  de:0.48, eg:3,    pr:49, moat:"Portafolio 50+ blockbusters",   yrsDiv:62 },
  "UNH":   { roe:28,  de:0.62, eg:15,   pr:32, moat:"Optum data moat + 49M miembros", yrsDiv:13 },
  "PG":    { roe:31,  de:0.57, eg:7,    pr:64, moat:"65+ marcas premium global",     yrsDiv:67 },
  "MA":    { roe:185, de:2.30, eg:18,   pr:20, moat:"Red pagos 3.3B tarjetas",       yrsDiv:12 },
  "LLY":   { roe:76,  de:1.70, eg:55,   pr:14, moat:"GLP-1 pipeline 2030",           yrsDiv:7  },
  "CVX":   { roe:13,  de:0.13, eg:-20,  pr:54, moat:"Permian + Guyana deepwater",    yrsDiv:36 },
  "COST":  { roe:31,  de:0.35, eg:16,   pr:32, moat:"Membership 93% renewal rate",   yrsDiv:20 },
  "NFLX":  { roe:37,  de:0.84, eg:142,  pr:0,  moat:"301M subs + contenido original", yrsDiv:0 },
};

// ─── Insider Transactions (datos públicos representativos) ────────────────────
type InsiderTx = { date:string; name:string; title:string; type:"BUY"|"SELL"; shares:number; price:number };
const INSIDER_DATA: Record<string, InsiderTx[]> = {
  "AAPL":  [{date:"Ene 15",name:"T. Cook",title:"CEO",type:"SELL",shares:50000,price:227.5},{date:"Dic 20",name:"L. Maestri",title:"CFO",type:"SELL",shares:30000,price:235.2},{date:"Nov 12",name:"J. Williams",title:"COO",type:"SELL",shares:25000,price:222.1},{date:"Oct 05",name:"A. Gorman",title:"Dir",type:"BUY",shares:5000,price:229.3}],
  "MSFT":  [{date:"Ene 20",name:"S. Nadella",title:"CEO",type:"SELL",shares:100000,price:418.3},{date:"Dic 18",name:"A. Hood",title:"CFO",type:"SELL",shares:45000,price:421.5},{date:"Nov 22",name:"B. Smith",title:"Pres",type:"SELL",shares:35000,price:407.2},{date:"Nov 01",name:"J. Jha",title:"Dir",type:"BUY",shares:2000,price:415.0}],
  "NVDA":  [{date:"Ene 22",name:"J. Huang",title:"CEO",type:"SELL",shares:120000,price:875.4},{date:"Dic 10",name:"C. Malachowsky",title:"Dir",type:"SELL",shares:80000,price:498.3},{date:"Nov 15",name:"M. Stevens",title:"CFO",type:"BUY",shares:5000,price:462.1},{date:"Oct 20",name:"J. Huang",title:"CEO",type:"SELL",shares:60000,price:476.0}],
  "AMZN":  [{date:"Ene 18",name:"A. Jassy",title:"CEO",type:"SELL",shares:50000,price:182.5},{date:"Dic 22",name:"D. Olsavsky",title:"CFO",type:"SELL",shares:20000,price:185.3},{date:"Nov 08",name:"J. Bezos",title:"Dir",type:"SELL",shares:500000,price:177.4},{date:"Oct 14",name:"R. Blackburn",title:"Dir",type:"BUY",shares:8000,price:179.6}],
  "GOOGL": [{date:"Ene 25",name:"S. Pichai",title:"CEO",type:"SELL",shares:22000,price:172.3},{date:"Dic 15",name:"R. Porat",title:"CFO",type:"SELL",shares:18000,price:176.8},{date:"Nov 20",name:"L. Page",title:"Dir",type:"SELL",shares:50000,price:169.4},{date:"Oct 10",name:"J. Doerr",title:"Dir",type:"BUY",shares:3000,price:168.5}],
  "META":  [{date:"Ene 28",name:"M. Zuckerberg",title:"CEO",type:"SELL",shares:200000,price:503.1},{date:"Dic 19",name:"S. Sandberg",title:"Dir",type:"SELL",shares:30000,price:508.4},{date:"Nov 14",name:"S. Taylor",title:"CTO",type:"SELL",shares:15000,price:479.2},{date:"Nov 01",name:"R. Rice",title:"Dir",type:"BUY",shares:2000,price:501.6}],
  "BRK.B": [{date:"Dic 30",name:"W. Buffett",title:"CEO",type:"BUY",shares:500000,price:382.0},{date:"Nov 25",name:"W. Buffett",title:"CEO",type:"BUY",shares:300000,price:375.2},{date:"Oct 18",name:"G. Abel",title:"Vice",type:"BUY",shares:10000,price:368.9},{date:"Sep 05",name:"A. Munger",title:"Dir",type:"BUY",shares:8000,price:361.4}],
  "JPM":   [{date:"Ene 16",name:"J. Dimon",title:"CEO",type:"BUY",shares:12000,price:202.4},{date:"Dic 12",name:"J. Dimon",title:"CEO",type:"BUY",shares:8000,price:194.3},{date:"Nov 20",name:"M. Lake",title:"CFO",type:"BUY",shares:5000,price:188.7},{date:"Oct 08",name:"D. Pinto",title:"Pres",type:"SELL",shares:20000,price:185.4}],
  "JNJ":   [{date:"Ene 10",name:"J. Wolk",title:"CFO",type:"BUY",shares:3000,price:159.8},{date:"Dec 05",name:"J. Duato",title:"CEO",type:"BUY",shares:5000,price:156.3},{date:"Nov 18",name:"P. Fasolo",title:"CPO",type:"BUY",shares:2000,price:153.9},{date:"Oct 22",name:"E. Gordon",title:"Dir",type:"SELL",shares:8000,price:157.5}],
  "XOM":   [{date:"Ene 12",name:"D. Woods",title:"CEO",type:"BUY",shares:8000,price:108.3},{date:"Dic 08",name:"K. Mikells",title:"CFO",type:"BUY",shares:4000,price:109.7},{date:"Nov 15",name:"J. Schlotterbeck",title:"Dir",type:"BUY",shares:3000,price:106.2},{date:"Oct 01",name:"S. Beccue",title:"VP",type:"SELL",shares:6000,price:112.4}],
};
const INSIDER_DEFAULT: InsiderTx[] = [
  {date:"Ene 15",name:"CEO",title:"CEO",type:"SELL",shares:25000,price:0},
  {date:"Dic 20",name:"CFO",title:"CFO",type:"SELL",shares:12000,price:0},
  {date:"Nov 10",name:"Director A",title:"Dir",type:"BUY",shares:3000,price:0},
];

// ─── FMP Types & Helpers ───────────────────────────────────────────────────────
interface FmpEntry {
  date: string; fiscalYear: string; period: string;
  revenue: number; grossProfit: number; operatingIncome: number;
  netIncome: number; ebitda: number; eps: number; epsDiluted: number;
  researchAndDevelopmentExpenses: number;
}
const calcCagr = (vals: number[]): number => {
  if (vals.length < 2 || vals[0] <= 0) return 0;
  return +((Math.pow(vals[vals.length - 1] / vals[0], 1 / (vals.length - 1)) - 1) * 100).toFixed(1);
};
const calcYoY = (curr: number, prev: number): number =>
  prev > 0 ? +((curr / prev - 1) * 100).toFixed(1) : 0;

// ─── Buffett Score ─────────────────────────────────────────────────────────────
const bScore = (sym: string, pe: number, yld: number, div: number): number => {
  const f = FUND[sym]; if (!f) return 0;
  let s = 0;
  s += pe<=10?30:pe<=15?25:pe<=20?18:pe<=25?10:pe<=35?5:0;
  s += f.roe>=30?25:f.roe>=20?20:f.roe>=15?15:f.roe>=10?8:0;
  s += f.de<=0.3?20:f.de<=0.5?16:f.de<=0.8?10:f.de<=1.2?5:0;
  s += f.eg>=20?15:f.eg>=10?12:f.eg>=5?8:f.eg>0?3:0;
  s += yld>=2&&div>0?10:yld>=1&&div>0?7:div>0?4:0;
  return s;
};
const bGrade = (sc: number) => sc>=75?"A+":sc>=65?"A":sc>=55?"B+":sc>=45?"B":sc>=35?"C":"D";
const bColor = (sc: number) => sc>=75?"#00ff88":sc>=55?"#7aff88":sc>=45?"#ffd700":sc>=35?"#ffab00":"#ff4060";
const aristocrat = (sym: string) => (FUND[sym]?.yrsDiv ?? 0) >= 25;

type Stock = typeof STOCKS[0];
type Section = "overview" | "sectors" | "confluence" | "buffett" | "insiders" | "dividends" | "financials";

// ─── COMPONENT ─────────────────────────────────────────────────────────────────
export default function Equities() {
  const [section, setSection]           = useState<Section>("overview");
  const [activeStock, setActiveStock]   = useState<Stock | null>(null);
  const [search, setSearch]             = useState("");
  const [clock, setClock]               = useState("");
  const [mktStatus, setMktStatus]       = useState<{ text: string; cls: string }>({ text:"PRE-MARKET", cls:"status-pre" });
  const [tf, setTf]                     = useState("1D");
  const [liveStocks, setLiveStocks]     = useState(STOCKS);
  const [bSortDesc, setBSortDesc]       = useState(true);
  const [bSortCol, setBSortCol]         = useState<"score"|"pe"|"roe"|"de"|"eg">("score");
  const [divCalcAmt, setDivCalcAmt]     = useState(10000);
  const [insiderStock, setInsiderStock] = useState("BRK.B");
  const chartRef  = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<Chart | null>(null);
  // Buffett Scanner (real API data)
  interface BResult { ticker:string; name:string; price:number; market_cap:number; sector:string; score:number; passed_count:number; total_count:number; criteria:Record<string,{label:string;display:string;target:string;pass:number}>; valuation:{intrinsic:number;upside:number;zone:string;levels:Record<string,number>}|null; raw:{roic:number;pe:number;pb:number;nm:number;gm:number;de:number;eps_yrs:number}; technical:{rsi:{value:number;zone:string};macd:{hist:number;trend:string;cross:string};ema_trend:string;bollinger:{zone:string;bw_pct:number};volume:{ratio:number;obv_trend:string};fibonacci:{nearest:string;nearest_price:number};harmonics:{detected:string[];count:number};signal:{score:number;label:string}}|null; polygon:{score:number;label:string;oi:{available:boolean;pc_ratio:number|null;sentiment:string};short:{available:boolean;short_pct:number;label:string};insider:{available:boolean;buys:number;sells:number;label:string};news:{available:boolean;articles:number;label:string}}|null; analyzed_at:string; }
  interface BStatus { ok:boolean; scanning:boolean; universe_total:number; state:{last_index:number;calls_today:number;total_analyzed:number;cycle:number;last_run:string}|null; stats:{n:string;avg_score:string}; top_today:{ticker:string;name:string;score:number;sector:string}[]; companies_today:number; }
  const [bResults,     setBResults]     = useState<BResult[]>([]);
  const [bStatus,      setBStatus]      = useState<BStatus | null>(null);
  const [bLoading,     setBLoading]     = useState(false);
  const [bScanning,    setBScanning]    = useState(false);
  const [bMinScore,    setBMinScore]    = useState(0);
  const [bSortReal,    setBSortReal]    = useState<"score"|"pe"|"gm"|"de"|"upside">("score");
  const [bSortRealDesc, setBSortRealDesc] = useState(true);
  const [bExpanded,    setBExpanded]    = useState<string | null>(null);
  const [bSubTab,      setBSubTab]      = useState<"actual"|"historico">("actual");
  interface BSnapshot { id:number; label:string; saved_at:string; count:number; }
  interface BSnapDetail { id:number; label:string; saved_at:string; results:Array<{ticker:string;name:string;score:number;sector:string;valuation:string}> }
  const [bSnapshots,   setBSnapshots]  = useState<BSnapshot[]>([]);
  const [bSnapDetail,  setBSnapDetail] = useState<BSnapDetail | null>(null);
  const [bSnapLoading, setBSnapLoading] = useState(false);
  const [bSavingSnap,  setBSavingSnap] = useState(false);
  const [bSnapSelId,   setBSnapSelId]  = useState<number|null>(null);

  // FMP Financials
  const [fmpSymbol,    setFmpSymbol]    = useState<string | null>(null);
  const [fmpData,      setFmpData]      = useState<FmpEntry[] | null>(null);
  const [fmpLoading,   setFmpLoading]   = useState(false);
  const [fmpError,     setFmpError]     = useState<string | null>(null);
  const [fmpChartType, setFmpChartType] = useState<"revenue"|"income"|"eps"|"margins">("revenue");
  const [fmpPeriod, setFmpPeriod] = useState<"annual"|"quarter">("annual");
  const fmpChartRef  = useRef<HTMLCanvasElement>(null);
  const fmpChartInst = useRef<Chart | null>(null);

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

  // Buffett: load results + status + snapshots when tab opens
  useEffect(() => {
    if (section !== "buffett") return;
    setBLoading(true);
    Promise.all([
      fetch(`/api/buffett/results?min_score=${bMinScore}&limit=200`).then(r => r.json()).catch(() => null),
      fetch("/api/buffett/status").then(r => r.json()).catch(() => null),
      fetch("/api/buffett/snapshots").then(r => r.json()).catch(() => null),
    ]).then(([res, stat, snaps]) => {
      if (res?.ok) setBResults(res.results ?? []);
      if (stat?.ok) { setBStatus(stat); setBScanning(stat.scanning ?? false); }
      if (snaps?.ok) setBSnapshots(snaps.snapshots ?? []);
    }).finally(() => setBLoading(false));
  }, [section, bMinScore]);

  const runBuffettScan = () => {
    setBScanning(true);
    const ctrl = new AbortController();
    const hard = setTimeout(() => ctrl.abort(), 15000);
    fetch("/api/buffett/scan", { method: "POST", signal: ctrl.signal })
      .then(r => r.json())
      .then(d => {
        clearTimeout(hard);
        if (!d.ok) { setBScanning(false); return; }
        let attempts = 0;
        const poll = setInterval(() => {
          attempts++;
          if (attempts > 36) { clearInterval(poll); setBScanning(false); return; }
          fetch("/api/buffett/status").then(r => r.json()).catch(() => null).then(s => {
            if (!s?.ok) return;
            setBStatus(s);
            if (!s.scanning) {
              clearInterval(poll);
              setBScanning(false);
              fetch(`/api/buffett/results?min_score=${bMinScore}&limit=200`)
                .then(r => r.json()).catch(() => null)
                .then(res => { if (res?.ok) setBResults(res.results ?? []); });
            }
          });
        }, 10000);
      })
      .catch(() => { clearTimeout(hard); setBScanning(false); });
  };

  const bColor2 = (sc: number) => sc >= 78 ? "#00e676" : sc >= 60 ? "#ffd700" : sc >= 44 ? "#ffab00" : "#ef5350";
  const bGrade2 = (sc: number) => sc >= 78 ? "A" : sc >= 60 ? "B" : sc >= 44 ? "C" : "D";

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

  const fetchFmp = useCallback(async (sym: string, period: "annual"|"quarter" = fmpPeriod) => {
    setFmpSymbol(sym);
    setFmpLoading(true);
    setFmpError(null);
    setFmpData(null);
    try {
      const limit = period === "quarter" ? 8 : 5;
      const r = await fetch(`/api/proxy/fmp/income-statement?symbol=${sym}&period=${period}&limit=${limit}`);
      const json = await r.json() as { ok: boolean; data?: FmpEntry[]; error?: string };
      if (!json.ok || !json.data?.length) {
        setFmpError(json.error ?? "Sin datos disponibles");
      } else {
        setFmpData([...json.data].sort((a, b) => a.fiscalYear.localeCompare(b.fiscalYear)));
      }
    } catch {
      setFmpError("Error de conexión con el proxy FMP");
    } finally {
      setFmpLoading(false);
    }
  }, [fmpPeriod]);

  const renderFmpChart = useCallback((data: FmpEntry[], cType: string) => {
    const canvas = fmpChartRef.current;
    if (!canvas || !data.length) return;
    if (fmpChartInst.current) { fmpChartInst.current.destroy(); fmpChartInst.current = null; }
    const labels  = data.map(d => `FY${d.fiscalYear}`);
    const gridCol = "rgba(26,42,58,.5)";
    const tickCol = { color: "#546e7a" as const };
    const tip = { backgroundColor: "rgba(13,21,32,.95)" as const, titleColor: "#00e5ff" as const, bodyColor: "#eceff1" as const };
    if (cType === "revenue") {
      fmpChartInst.current = new Chart(canvas, { type:"bar",
        data:{ labels, datasets:[
          { label:"Revenue (B$)",      data:data.map(d=>+(d.revenue/1e9).toFixed(1)),     backgroundColor:"rgba(0,229,255,.3)",  borderColor:"#00e5ff", borderWidth:2, borderRadius:4 },
          { label:"Gross Profit (B$)", data:data.map(d=>+(d.grossProfit/1e9).toFixed(1)), backgroundColor:"rgba(0,230,118,.3)",  borderColor:"#00e676", borderWidth:2, borderRadius:4 },
        ]},
        options:{ responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ labels:{ color:"#eceff1", font:{ size:11 } } }, tooltip:tip },
          scales:{ x:{ grid:{ color:gridCol }, ticks:tickCol }, y:{ grid:{ color:gridCol }, ticks:{ ...tickCol, callback:(v)=>`$${v}B` }, position:"right" } } },
      });
    } else if (cType === "income") {
      fmpChartInst.current = new Chart(canvas, { type:"bar",
        data:{ labels, datasets:[
          { label:"Net Income (B$)", data:data.map(d=>+(d.netIncome/1e9).toFixed(1)), backgroundColor:"rgba(0,230,118,.3)",  borderColor:"#00e676", borderWidth:2, borderRadius:4 },
          { label:"EBITDA (B$)",     data:data.map(d=>+(d.ebitda/1e9).toFixed(1)),    backgroundColor:"rgba(255,215,0,.2)",  borderColor:"#ffd700", borderWidth:2, borderRadius:4 },
        ]},
        options:{ responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ labels:{ color:"#eceff1", font:{ size:11 } } }, tooltip:tip },
          scales:{ x:{ grid:{ color:gridCol }, ticks:tickCol }, y:{ grid:{ color:gridCol }, ticks:{ ...tickCol, callback:(v)=>`$${v}B` }, position:"right" } } },
      });
    } else if (cType === "eps") {
      fmpChartInst.current = new Chart(canvas, { type:"line",
        data:{ labels, datasets:[
          { label:"EPS Diluted ($)", data:data.map(d=>+d.epsDiluted.toFixed(2)), borderColor:"#ffd700", backgroundColor:"rgba(255,215,0,.1)", borderWidth:2.5, fill:true, tension:.3, pointRadius:5, pointBackgroundColor:"#ffd700" },
        ]},
        options:{ responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ labels:{ color:"#eceff1", font:{ size:11 } } }, tooltip:tip },
          scales:{ x:{ grid:{ color:gridCol }, ticks:tickCol }, y:{ grid:{ color:gridCol }, ticks:{ ...tickCol, callback:(v)=>`$${v}` }, position:"right" } } },
      });
    } else {
      fmpChartInst.current = new Chart(canvas, { type:"line",
        data:{ labels, datasets:[
          { label:"Margen Bruto %",     data:data.map(d=>+((d.grossProfit/d.revenue)*100).toFixed(1)),     borderColor:"#00e5ff", borderWidth:2, fill:false, tension:.3, pointRadius:4 },
          { label:"Margen Operativo %", data:data.map(d=>+((d.operatingIncome/d.revenue)*100).toFixed(1)), borderColor:"#00e676", borderWidth:2, fill:false, tension:.3, pointRadius:4 },
          { label:"Margen Neto %",      data:data.map(d=>+((d.netIncome/d.revenue)*100).toFixed(1)),       borderColor:"#ffd700", borderWidth:2, fill:false, tension:.3, pointRadius:4 },
        ]},
        options:{ responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ labels:{ color:"#eceff1", font:{ size:11 } } }, tooltip:tip },
          scales:{ x:{ grid:{ color:gridCol }, ticks:tickCol }, y:{ grid:{ color:gridCol }, ticks:{ ...tickCol, callback:(v)=>`${v}%` }, position:"right" } } },
      });
    }
  }, []);

  useEffect(() => {
    if (section === "financials" && fmpData) setTimeout(() => renderFmpChart(fmpData, fmpChartType), 50);
  }, [section, fmpData, fmpChartType, renderFmpChart]);

  return (
    <>
      <style>{`
        :root{--eq-bg:#060a0f;--eq-bg2:#0a1018;--eq-bg3:#0f1820;--eq-panel:#0d1520;--eq-border:#1a2a3a;--eq-border2:#243040;--eq-cyan:#00e5ff;--eq-green:#00e676;--eq-red:#ff1744;--eq-gold:#ffd700;--eq-orange:#ff6d00;--eq-purple:#e040fb;--eq-teal:#40c4ff;--eq-neut:#00ffcc;--eq-white:#eceff1;--eq-gray:#546e7a;--eq-amber:#ffab00;}
        .eq-wrap{background:var(--eq-bg);min-height:100vh;padding:14px;font-family:'Rajdhani',sans-serif;color:var(--eq-white);}
        .eq-wrap::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,229,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,.018) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;z-index:0;}
        .eq-inner{max-width:1800px;margin:0 auto;position:relative;z-index:1;}
        .eq-topbar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:10px 20px;background:var(--eq-panel);border:1px solid var(--eq-border2);border-radius:6px;margin-bottom:14px;position:relative;overflow:visible;row-gap:10px;}
        .eq-topbar::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--eq-gold),var(--eq-orange),var(--eq-green),var(--eq-cyan),var(--eq-gold));background-size:200% 100%;animation:eqFlow 4s linear infinite;}
        @keyframes eqFlow{0%{background-position:0%}100%{background-position:200%}}
        .eq-logo{font-family:'Orbitron',monospace;font-size:1rem;font-weight:900;color:var(--eq-gold);letter-spacing:.2em;text-shadow:0 0 20px rgba(255,215,0,.4);}
        .eq-module{font-family:monospace;font-size:.62rem;color:var(--eq-gray);letter-spacing:.15em;border-left:1px solid var(--eq-border2);padding-left:16px;}
        .eq-tb-right{display:flex;align-items:center;gap:12px;min-width:0;width:100%;}
        .eq-nav-scroll{display:flex;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:thin;flex:1;min-width:0;padding-bottom:2px;}
        .eq-nav-scroll::-webkit-scrollbar{height:4px;}
        .eq-nav-scroll::-webkit-scrollbar-thumb{background:var(--eq-border2);border-radius:2px;}
        .eq-nav-btn{flex-shrink:0;}
        @media (max-width:768px){
          .eq-topbar{justify-content:flex-start;}
          .eq-tb-right{order:3;justify-content:space-between;}
        }
        .eq-clock{font-family:monospace;font-size:.75rem;color:var(--eq-cyan);flex-shrink:0;}
        .eq-mkt{font-family:monospace;font-size:.6rem;padding:3px 10px;border-radius:3px;letter-spacing:.12em;flex-shrink:0;}
        .status-open{background:rgba(0,230,118,.12);border:1px solid var(--eq-green);color:var(--eq-green);}
        .status-pre{background:rgba(255,171,0,.1);border:1px solid var(--eq-amber);color:var(--eq-amber);}
        .status-closed{background:rgba(255,23,68,.1);border:1px solid var(--eq-red);color:var(--eq-red);}
        .eq-nav-btn{font-family:monospace;font-size:.62rem;padding:5px 12px;border-radius:3px;border:1px solid var(--eq-border2);background:transparent;color:var(--eq-gray);cursor:pointer;transition:all .2s;letter-spacing:.1em;white-space:nowrap;}
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
        /* ── BUFFETT ─────────────────────────────────────────────────── */
        .bf-scanner-bar{display:flex;align-items:center;gap:12px;padding:10px 16px;background:rgba(255,215,0,.04);border:1px solid rgba(255,215,0,.18);border-radius:6px;margin-bottom:14px;}
        .bf-led{width:8px;height:8px;border-radius:50%;background:#00e676;box-shadow:0 0 8px #00e676;flex-shrink:0;}
        .bf-led.offline{background:#ff4060;box-shadow:0 0 8px #ff4060;}
        .bf-scanner-txt{font-family:monospace;font-size:.65rem;color:var(--eq-gold);}
        .bf-criteria{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:14px;}
        .bf-crit-card{background:var(--eq-panel);border:1px solid var(--eq-border);border-radius:6px;padding:10px 12px;text-align:center;}
        .bf-crit-icon{font-size:1.2rem;margin-bottom:4px;}
        .bf-crit-name{font-family:'Orbitron',monospace;font-size:.55rem;color:var(--eq-gold);letter-spacing:.1em;margin-bottom:4px;}
        .bf-crit-desc{font-family:monospace;font-size:.58rem;color:var(--eq-gray);line-height:1.4;}
        .bf-crit-ideal{font-family:monospace;font-size:.6rem;color:var(--eq-green);margin-top:5px;}
        .bf-table-wrap{background:var(--eq-panel);border:1px solid var(--eq-border);border-radius:6px;overflow:hidden;margin-bottom:14px;}
        .bf-table{width:100%;border-collapse:collapse;}
        .bf-table th{font-family:monospace;font-size:.58rem;color:var(--eq-gray);letter-spacing:.1em;padding:8px 10px;text-align:left;border-bottom:1px solid var(--eq-border);cursor:pointer;white-space:nowrap;transition:color .2s;}
        .bf-table th:hover{color:var(--eq-gold);}
        .bf-table td{font-family:monospace;font-size:.68rem;padding:8px 10px;border-bottom:1px solid rgba(26,42,58,.4);vertical-align:middle;}
        .bf-table tr:hover td{background:rgba(255,215,0,.02);}
        .bf-score-badge{display:inline-flex;align-items:center;justify-content:center;width:38px;height:22px;border-radius:4px;font-family:'Orbitron',monospace;font-size:.65rem;font-weight:700;}
        .bf-grade{display:inline-block;padding:1px 6px;border-radius:3px;font-family:'Orbitron',monospace;font-size:.6rem;font-weight:700;}
        .bf-bar-wrap{width:80px;height:5px;background:var(--eq-border);border-radius:3px;overflow:hidden;display:inline-block;vertical-align:middle;}
        .bf-bar-fill{height:100%;border-radius:3px;}
        .bf-top-picks{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px;}
        .bf-pick-card{background:var(--eq-panel);border:1px solid rgba(255,215,0,.25);border-radius:8px;padding:14px;position:relative;overflow:hidden;}
        .bf-pick-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--eq-gold),var(--eq-amber));}
        .bf-pick-rank{position:absolute;top:10px;right:12px;font-family:'Orbitron',monospace;font-size:1.8rem;font-weight:900;color:rgba(255,215,0,.12);letter-spacing:.05em;}
        .bf-pick-sym{font-family:'Orbitron',monospace;font-size:1rem;font-weight:900;color:var(--eq-white);}
        .bf-pick-name{font-family:monospace;font-size:.68rem;color:var(--eq-gray);margin-bottom:8px;}
        .bf-pick-score-row{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
        .bf-pick-scorenum{font-family:'Orbitron',monospace;font-size:1.5rem;font-weight:900;color:var(--eq-gold);}
        .bf-pick-maxlbl{font-family:monospace;font-size:.6rem;color:var(--eq-gray);}
        .bf-moat-lbl{font-family:monospace;font-size:.6rem;color:var(--eq-cyan);background:rgba(0,229,255,.06);border:1px solid rgba(0,229,255,.2);border-radius:3px;padding:2px 7px;display:inline-block;margin-top:4px;}
        .bf-criteria-bars{margin-top:10px;}
        .bf-cbar-row{display:flex;align-items:center;gap:6px;margin-bottom:5px;}
        .bf-cbar-lbl{font-family:monospace;font-size:.58rem;color:var(--eq-gray);width:60px;flex-shrink:0;}
        .bf-cbar-track{flex:1;height:4px;background:var(--eq-border);border-radius:2px;overflow:hidden;}
        .bf-cbar-fill{height:100%;border-radius:2px;}
        .bf-cbar-val{font-family:monospace;font-size:.58rem;color:var(--eq-white);width:30px;text-align:right;}
        .bf-rule-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .bf-rule-card{background:rgba(255,215,0,.04);border:1px solid rgba(255,215,0,.12);border-radius:6px;padding:12px;}
        .bf-rule-title{font-family:'Orbitron',monospace;font-size:.6rem;color:var(--eq-gold);letter-spacing:.12em;margin-bottom:6px;}
        .bf-rule-body{font-size:.78rem;color:var(--eq-gray);line-height:1.5;}
        .bf-subtabs{display:flex;gap:0;margin-bottom:14px;border:1px solid var(--eq-border);border-radius:6px;overflow:hidden;}
        .bf-subtab{flex:1;padding:8px 16px;fontFamily:monospace;font-size:.65rem;letter-spacing:.1em;cursor:pointer;border:none;background:transparent;color:var(--eq-gray);transition:all .2s;text-align:center;}
        .bf-subtab.active{background:rgba(255,215,0,.08);color:var(--eq-gold);border-bottom:2px solid var(--eq-gold);}
        .bf-subtab:hover:not(.active){background:rgba(255,255,255,.03);color:var(--eq-white);}
        .bf-snap-list{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;}
        .bf-snap-card{background:var(--eq-panel);border:1px solid var(--eq-border);border-radius:6px;padding:12px;cursor:pointer;transition:border-color .2s;}
        .bf-snap-card:hover,.bf-snap-card.sel{border-color:rgba(255,215,0,.4);background:rgba(255,215,0,.04);}
        .bf-snap-label{font-family:'Orbitron',monospace;font-size:.62rem;color:var(--eq-white);margin-bottom:4px;}
        .bf-snap-date{font-family:monospace;font-size:.58rem;color:var(--eq-gray);}
        .bf-snap-count{font-family:monospace;font-size:.58rem;color:var(--eq-cyan);}
        .bf-delta-up{color:#00e676;font-size:.65rem;}
        .bf-delta-dn{color:#ef5350;font-size:.65rem;}
        .bf-delta-eq{color:var(--eq-gray);font-size:.65rem;}
        /* ── INSIDERS ────────────────────────────────────────────────── */
        .ins-selector{display:flex;gap:6px;flex-wrap:wrap;padding:12px;border-bottom:1px solid var(--eq-border);}
        .ins-sym-btn{font-family:monospace;font-size:.6rem;padding:3px 9px;border-radius:3px;border:1px solid var(--eq-border);background:transparent;color:var(--eq-gray);cursor:pointer;transition:all .15s;}
        .ins-sym-btn:hover,.ins-sym-btn.active{border-color:var(--eq-cyan);color:var(--eq-cyan);background:rgba(0,229,255,.06);}
        .ins-tx-table{width:100%;border-collapse:collapse;}
        .ins-tx-table th{font-family:monospace;font-size:.58rem;color:var(--eq-gray);letter-spacing:.1em;padding:7px 10px;text-align:left;border-bottom:1px solid var(--eq-border);}
        .ins-tx-table td{font-family:monospace;font-size:.7rem;padding:8px 10px;border-bottom:1px solid rgba(26,42,58,.4);}
        .ins-buy-badge{background:rgba(0,230,118,.12);border:1px solid #00e676;color:#00e676;padding:1px 7px;border-radius:3px;font-size:.58rem;}
        .ins-sell-badge{background:rgba(255,23,68,.1);border:1px solid #ff1744;color:#ff1744;padding:1px 7px;border-radius:3px;font-size:.58rem;}
        .ins-sentiment-bar{display:flex;height:12px;border-radius:6px;overflow:hidden;margin:8px 0;}
        .ins-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;}
        .ins-inst-row{display:flex;align-items:center;gap:8px;margin-bottom:7px;}
        .ins-inst-name{font-family:monospace;font-size:.62rem;color:var(--eq-gray);width:130px;flex-shrink:0;}
        .ins-inst-bar{flex:1;height:6px;background:var(--eq-border);border-radius:3px;overflow:hidden;}
        .ins-inst-val{font-family:monospace;font-size:.6rem;color:var(--eq-white);width:38px;text-align:right;flex-shrink:0;}
        /* ── DIVIDENDS ───────────────────────────────────────────────── */
        .div-overview-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;}
        .div-ov-card{background:var(--eq-panel);border:1px solid var(--eq-border);border-radius:6px;padding:12px 14px;}
        .div-ov-label{font-family:monospace;font-size:.55rem;color:var(--eq-gray);letter-spacing:.12em;margin-bottom:4px;}
        .div-ov-value{font-family:'Orbitron',monospace;font-size:1.1rem;font-weight:700;color:var(--eq-gold);}
        .div-ov-sub{font-family:monospace;font-size:.55rem;color:var(--eq-gray);margin-top:2px;}
        .div-table-wrap{background:var(--eq-panel);border:1px solid var(--eq-border);border-radius:6px;overflow:hidden;margin-bottom:14px;}
        .div-table{width:100%;border-collapse:collapse;}
        .div-table th{font-family:monospace;font-size:.58rem;color:var(--eq-gray);letter-spacing:.1em;padding:7px 10px;text-align:left;border-bottom:1px solid var(--eq-border);white-space:nowrap;}
        .div-table td{font-family:monospace;font-size:.68rem;padding:7px 10px;border-bottom:1px solid rgba(26,42,58,.4);vertical-align:middle;}
        .div-table tr:hover td{background:rgba(255,215,0,.02);}
        .aristocrat-badge{background:rgba(255,215,0,.12);border:1px solid var(--eq-gold);color:var(--eq-gold);font-family:monospace;font-size:.55rem;padding:1px 6px;border-radius:3px;white-space:nowrap;}
        .div-calc-panel{background:var(--eq-panel);border:1px solid var(--eq-border);border-radius:6px;padding:16px;margin-bottom:14px;}
        .div-calc-row{display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap;}
        .div-calc-input{background:var(--eq-bg3);border:1px solid var(--eq-border2);border-radius:4px;color:var(--eq-white);font-family:'Orbitron',monospace;font-size:.85rem;padding:8px 14px;outline:none;width:160px;text-align:right;transition:border-color .2s;}
        .div-calc-input:focus{border-color:var(--eq-gold);}
        .div-calc-result{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
        .div-calc-box{background:var(--eq-bg3);border:1px solid var(--eq-border);border-radius:4px;padding:10px;text-align:center;}
        .div-calc-lbl{font-family:monospace;font-size:.55rem;color:var(--eq-gray);margin-bottom:4px;}
        .div-calc-val{font-family:'Orbitron',monospace;font-size:.9rem;font-weight:700;color:var(--eq-gold);}
        @media(max-width:1200px){.macro-grid{grid-template-columns:repeat(3,1fr);}.eq-main-grid{grid-template-columns:280px 1fr;}.eq-bottom-row{grid-template-columns:1fr 1fr;}.bf-top-picks{grid-template-columns:1fr 1fr;}.bf-criteria{grid-template-columns:repeat(3,1fr);}.div-overview-cards{grid-template-columns:repeat(2,1fr);}.ins-grid-2{grid-template-columns:1fr;}}
        @media(max-width:900px){.eq-main-grid{grid-template-columns:1fr;}.eq-bottom-row{grid-template-columns:1fr;}.stats-grid{grid-template-columns:repeat(2,1fr);}.analysis-grid{grid-template-columns:1fr;}.corr-grid{grid-template-columns:repeat(2,1fr);}.bf-top-picks{grid-template-columns:1fr;}.bf-criteria{grid-template-columns:repeat(2,1fr);}.bf-rule-grid{grid-template-columns:1fr;}.div-calc-result{grid-template-columns:repeat(2,1fr);}}
      `}</style>

      <div className="eq-wrap">
        <SiteNav />

        <div className="eq-inner" style={{ paddingTop: "80px" }}>

          {/* TOPBAR */}
          <div className="eq-topbar">
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div className="eq-logo">PSYCHOMETRIKS</div>
              <div className="eq-module">EQUITIES COMMAND CENTER v2.0</div>
            </div>
            <div className="eq-tb-right">
              <div className="eq-nav-scroll">
                {(["overview","sectors","confluence","buffett","insiders","dividends","financials"] as Section[]).map((s, i) => (
                  <button key={s} className={`eq-nav-btn${section === s ? " active" : ""}`} onClick={() => setSection(s)}>
                    {["OVERVIEW","SECTORES","CONFLUENCIA","🔬 BUFFETT","🕵️ INSIDERS","💰 DIVIDENDOS","📊 FINANCIALS"][i]}
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
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div className="eq-bottom-panel">
                  <div className="bp-head"><div className="bp-title">SEÑALES TÉCNICAS + ZONAS DE ENTRADA EN TIEMPO REAL</div></div>
                  <div className="bp-body">
                    <table className="conf-table">
                      <thead><tr>
                        <th>TICKER</th><th>PRECIO</th><th>RSI</th><th>MACD</th><th>EMA200</th><th>SEÑAL</th><th>SCORE</th>
                        <th style={{ color:"#00e676" }}>🟢 E1 AGRESIVA</th>
                        <th style={{ color:"#ffd700" }}>🟡 E2 IDEAL</th>
                        <th style={{ color:"#00e5ff" }}>🔵 E3 CONSERVADORA</th>
                      </tr></thead>
                      <tbody>
                        {STOCKS.map(s => {
                          const live   = liveStocks.find(x => x.sym === s.sym);
                          const price  = live?.price ?? s.price;
                          const atr    = s.atr ?? price * 0.015;
                          const e1     = price - 1.5 * atr;
                          const e2     = price - 3.0 * atr;
                          const e3     = s.ema200 === "Sobre" ? price * 0.88 : price * 0.93;
                          const score  = s.signal==="STRONG BUY"?88:s.signal==="BUY"?72:s.signal==="HOLD"?50:35;
                          const pctE1  = ((e1 - price) / price * 100).toFixed(1);
                          const pctE2  = ((e2 - price) / price * 100).toFixed(1);
                          const pctE3  = ((e3 - price) / price * 100).toFixed(1);
                          return (
                            <tr key={s.sym} onClick={() => { selectStock(s.sym); setSection("overview"); }}>
                              <td><span className="conf-dot" style={{ background:s.color }} />{s.sym}</td>
                              <td style={{ fontFamily:"'Orbitron',monospace", fontSize:".62rem", color:"var(--eq-white)", fontWeight:700 }}>${price.toFixed(2)}</td>
                              <td style={{ color:s.rsi>70?"var(--eq-red)":s.rsi<30?"var(--eq-green)":"var(--eq-white)" }}>{s.rsi}</td>
                              <td style={{ color:s.macd==="Bullish"?"var(--eq-green)":s.macd==="Bearish"?"var(--eq-red)":"var(--eq-amber)" }}>{s.macd}</td>
                              <td style={{ color:s.ema200==="Sobre"?"var(--eq-green)":"var(--eq-red)" }}>{s.ema200}</td>
                              <td><span className={`${sigClass(s.signal)} sig-badge`}>{s.signal}</span></td>
                              <td style={{ color:score>70?"var(--eq-green)":score<40?"var(--eq-red)":"var(--eq-amber)" }}>{score}/100</td>
                              <td>
                                <div style={{ fontFamily:"monospace", fontSize:".62rem", color:"#00e676", fontWeight:700 }}>${e1.toFixed(2)}</div>
                                <div style={{ fontFamily:"monospace", fontSize:".52rem", color:"rgba(0,230,118,.5)" }}>{pctE1}%</div>
                              </td>
                              <td>
                                <div style={{ fontFamily:"monospace", fontSize:".62rem", color:"#ffd700", fontWeight:700 }}>${e2.toFixed(2)}</div>
                                <div style={{ fontFamily:"monospace", fontSize:".52rem", color:"rgba(255,215,0,.5)" }}>{pctE2}%</div>
                              </td>
                              <td>
                                <div style={{ fontFamily:"monospace", fontSize:".62rem", color:"#00e5ff", fontWeight:700 }}>${e3.toFixed(2)}</div>
                                <div style={{ fontFamily:"monospace", fontSize:".52rem", color:"rgba(0,229,255,.5)" }}>{pctE3}%</div>
                              </td>
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

          {/* ══ BUFFETT SCANNER — DATOS REALES ══ */}
          {section === "buffett" && (() => {
            const sortedReal = [...bResults].sort((a, b) => {
              const getV = (r: typeof bResults[0]) => {
                if (bSortReal === "score")  return r.score;
                if (bSortReal === "pe")     return -(r.raw?.pe ?? 999);
                if (bSortReal === "gm")     return r.raw?.gm ?? 0;
                if (bSortReal === "de")     return -(r.raw?.de ?? 99);
                if (bSortReal === "upside") return r.valuation?.upside ?? -999;
                return r.score;
              };
              return bSortRealDesc ? getV(b) - getV(a) : getV(a) - getV(b);
            });
            const top3Real = [...bResults].sort((a,b) => b.score - a.score).slice(0, 3);
            const thR = (col: typeof bSortReal) => {
              if (bSortReal === col) setBSortRealDesc(p => !p);
              else { setBSortReal(col); setBSortRealDesc(true); }
            };
            const totalAnalyzed = parseInt(bStatus?.stats?.n ?? "0") || 0;
            const avgScore      = parseFloat(bStatus?.stats?.avg_score ?? "0") || 0;

            return (
              <>
                <div className="eq-sec-title">🔬 PSY BUFFETT SCANNER — FILOSOFÍA GRAHAM-BUFFETT APLICADA</div>

                {/* Sub-tabs */}
                <div className="bf-subtabs">
                  <button className={`bf-subtab${bSubTab==="actual"?" active":""}`} onClick={() => setBSubTab("actual")}>📊 ACTUAL</button>
                  <button className={`bf-subtab${bSubTab==="historico"?" active":""}`} onClick={() => setBSubTab("historico")}>🕐 HACE 3 MESES</button>
                </div>

                {/* Status bar */}
                <div className="bf-scanner-bar">
                  <div className="bf-led" style={{ background: bScanning ? "#00e676" : totalAnalyzed > 0 ? "#00e5ff" : "#546e7a", boxShadow: bScanning ? "0 0 8px #00e676" : undefined, animation: bScanning ? "pulse 1s infinite" : "none" }} />
                  <div className="bf-scanner-txt">
                    {bScanning ? "⟳ ESCANEANDO..." : totalAnalyzed > 0 ? `DATOS REALES — ${totalAnalyzed} empresas analizadas` : "SIN DATOS AÚN — Presiona INICIAR SCAN"}
                    {bStatus?.state && !bScanning && (
                      <span style={{ color:"var(--eq-gray)", marginLeft:8 }}>
                        · Ciclo {bStatus.state.cycle} · Progreso: {bStatus.state.last_index}/{bStatus.universe_total}
                        · Calls hoy: {bStatus.state.calls_today}/230
                        {bStatus.state.last_run && ` · ${bStatus.state.last_run}`}
                      </span>
                    )}
                  </div>
                  <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
                    {totalAnalyzed > 0 && <span style={{ fontFamily:"monospace", fontSize:".58rem", color:"var(--eq-gray)" }}>Score promedio: <span style={{ color: bColor2(avgScore) }}>{avgScore.toFixed(0)}</span></span>}
                    <select value={bMinScore} onChange={e => setBMinScore(Number(e.target.value))} style={{ background:"var(--eq-bg2)", border:"1px solid var(--eq-border)", color:"var(--eq-gray)", fontFamily:"monospace", fontSize:".58rem", padding:"2px 6px", borderRadius:3 }}>
                      <option value={0}>Todos</option>
                      <option value={44}>≥44 (C+)</option>
                      <option value={60}>≥60 (B+)</option>
                      <option value={78}>≥78 (A)</option>
                    </select>
                    {totalAnalyzed > 0 && (
                      <button
                        disabled={bSavingSnap}
                        onClick={() => {
                          setBSavingSnap(true);
                          const label = new Date().toISOString().slice(0,10);
                          fetch("/api/buffett/snapshot", { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({ label }) })
                            .then(r => r.json())
                            .then(d => { if (d.ok) fetch("/api/buffett/snapshots").then(r=>r.json()).then(s=>{ if(s.ok) setBSnapshots(s.snapshots??[]); }); })
                            .finally(() => setBSavingSnap(false));
                        }}
                        style={{ background:"rgba(255,215,0,.08)", border:"1px solid rgba(255,215,0,.3)", color:"var(--eq-gold)", fontFamily:"monospace", fontSize:".6rem", padding:"4px 10px", borderRadius:3, cursor:"pointer", opacity:bSavingSnap?0.6:1 }}
                      >
                        {bSavingSnap ? "⟳ GUARDANDO..." : "💾 GUARDAR SNAPSHOT"}
                      </button>
                    )}
                    <button
                      onClick={runBuffettScan}
                      disabled={bScanning || bLoading}
                      style={{ background: bScanning ? "rgba(0,230,118,.1)" : "rgba(0,229,255,.15)", border:`1px solid ${bScanning?"#00e676":"#00e5ff"}`, color: bScanning?"#00e676":"#00e5ff", fontFamily:"monospace", fontSize:".6rem", padding:"4px 12px", borderRadius:3, cursor:"pointer", opacity: bScanning||bLoading?0.6:1 }}
                    >
                      {bScanning ? "⟳ ESCANEANDO..." : "▶ INICIAR SCAN"}
                    </button>
                  </div>
                </div>

                {/* 9 Criterios Buffett */}
                {/* ══ HISTORICO VIEW ══ */}
                {bSubTab === "historico" && (
                  <div>
                    {bSnapshots.length === 0 ? (
                      <div style={{ textAlign:"center", padding:"50px 20px", background:"var(--eq-bg2)", border:"1px solid var(--eq-border)", borderRadius:6 }}>
                        <div style={{ fontSize:"2rem", marginBottom:8 }}>🕐</div>
                        <div style={{ fontFamily:"monospace", fontSize:".75rem", color:"var(--eq-white)", marginBottom:6 }}>SIN SNAPSHOTS AÚN</div>
                        <div style={{ fontFamily:"monospace", fontSize:".65rem", color:"var(--eq-gray)", maxWidth:420, margin:"0 auto" }}>
                          Una vez que el scanner tenga datos, usá el botón <strong style={{color:"var(--eq-gold)"}}>💾 GUARDAR SNAPSHOT</strong> en la pestaña ACTUAL para guardar un corte histórico. Ideal hacerlo hoy y comparar en 3 meses.
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="eq-sec-title" style={{ marginBottom:10 }}>📂 SNAPSHOTS GUARDADOS</div>
                        <div className="bf-snap-list">
                          {bSnapshots.map(s => (
                            <div key={s.id} className={`bf-snap-card${bSnapSelId===s.id?" sel":""}`}
                              onClick={() => {
                                if (bSnapSelId === s.id) { setBSnapSelId(null); setBSnapDetail(null); return; }
                                setBSnapSelId(s.id);
                                setBSnapLoading(true);
                                fetch(`/api/buffett/snapshot/${s.id}`).then(r=>r.json())
                                  .then(d => { if (d.ok) setBSnapDetail(d.snapshot); })
                                  .finally(() => setBSnapLoading(false));
                              }}>
                              <div className="bf-snap-label">📅 {s.label}</div>
                              <div className="bf-snap-date">{new Date(s.saved_at).toLocaleDateString("es", {day:"2-digit",month:"short",year:"numeric"})}</div>
                              <div className="bf-snap-count">{s.count} empresas</div>
                            </div>
                          ))}
                        </div>

                        {bSnapLoading && (
                          <div style={{ textAlign:"center", padding:24, fontFamily:"monospace", fontSize:".7rem", color:"var(--eq-gray)" }}>⟳ Cargando snapshot...</div>
                        )}

                        {bSnapDetail && !bSnapLoading && (() => {
                          const snapMap = new Map(bSnapDetail.results.map(r => [r.ticker, r.score]));
                          const currentMap = new Map(bResults.map(r => [r.ticker, r.score]));
                          const rows = bSnapDetail.results.slice().sort((a,b) => b.score - a.score);
                          return (
                            <>
                              <div className="eq-sec-title" style={{ marginBottom:10 }}>
                                📊 SNAPSHOT: {bSnapDetail.label} — {new Date(bSnapDetail.saved_at).toLocaleDateString("es",{day:"2-digit",month:"long",year:"numeric"})}
                                <span style={{ fontFamily:"monospace", fontSize:".6rem", color:"var(--eq-gray)", marginLeft:12 }}>vs. datos actuales</span>
                              </div>
                              <div className="bf-table-wrap">
                                <table className="bf-table">
                                  <thead><tr>
                                    <th>#</th><th>EMPRESA</th><th>SCORE (snap)</th><th>SCORE (hoy)</th><th>Δ CAMBIO</th><th>SECTOR</th><th>VALUACIÓN</th>
                                  </tr></thead>
                                  <tbody>
                                    {rows.map((r, i) => {
                                      const snapScore = r.score ?? 0;
                                      const nowScore  = currentMap.get(r.ticker) ?? null;
                                      const delta     = nowScore !== null ? nowScore - snapScore : null;
                                      const gc = bColor2(snapScore);
                                      return (
                                        <tr key={r.ticker}>
                                          <td style={{ color:"var(--eq-gray)" }}>{i+1}</td>
                                          <td>
                                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                              <div style={{ width:22, height:22, borderRadius:"50%", background:`${gc}18`, color:gc, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Orbitron',monospace", fontSize:".48rem", fontWeight:900 }}>{r.ticker.substring(0,2)}</div>
                                              <div>
                                                <div style={{ fontFamily:"monospace", fontSize:".7rem", fontWeight:700, color:"var(--eq-white)" }}>{r.ticker}</div>
                                                <div style={{ fontFamily:"monospace", fontSize:".55rem", color:"var(--eq-gray)" }}>{r.name}</div>
                                              </div>
                                            </div>
                                          </td>
                                          <td>
                                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                              <div className="bf-score-badge" style={{ background:`${gc}18`, border:`1px solid ${gc}40`, color:gc }}>{snapScore}</div>
                                              <div className="bf-bar-wrap"><div className="bf-bar-fill" style={{ width:`${snapScore}%`, background:gc }} /></div>
                                            </div>
                                          </td>
                                          <td style={{ fontFamily:"monospace", fontSize:".68rem", color: nowScore ? bColor2(nowScore) : "var(--eq-gray)" }}>
                                            {nowScore !== null ? nowScore : "—"}
                                          </td>
                                          <td>
                                            {delta === null ? <span className="bf-delta-eq">—</span>
                                              : delta > 0  ? <span className="bf-delta-up">▲ +{delta.toFixed(0)}</span>
                                              : delta < 0  ? <span className="bf-delta-dn">▼ {delta.toFixed(0)}</span>
                                              : <span className="bf-delta-eq">= 0</span>}
                                          </td>
                                          <td style={{ fontFamily:"monospace", fontSize:".6rem", color:"var(--eq-gray)" }}>{r.sector}</td>
                                          <td style={{ fontFamily:"monospace", fontSize:".6rem", color:"var(--eq-amber)" }}>{r.valuation}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </div>
                )}

                {/* ══ ACTUAL VIEW ══ */}
                {bSubTab === "actual" && (<>
                <div className="bf-criteria">
                  {[
                    { icon:"💡", name:"ROIC",         desc:"Retorno sobre Capital Invertido. Mide la eficiencia real del negocio para generar valor.", ideal:"> 10%" },
                    { icon:"💰", name:"P/E",           desc:"Precio/Ganancias. Buffett prefiere valuaciones razonables con crecimiento sostenible.", ideal:"< 20x" },
                    { icon:"📘", name:"P/B",           desc:"Precio/Valor en Libros. Indica cuánto paga el mercado por el patrimonio contable.", ideal:"< 2x" },
                    { icon:"💸", name:"PRICE/FCF",     desc:"Precio vs. Free Cash Flow real. Más honesto que el P/E — mide cash real generado.", ideal:"< 20x" },
                    { icon:"🚀", name:"PEG RATIO",     desc:"P/E ajustado por crecimiento. Combina valuación y velocidad de crecimiento.", ideal:"< 2x" },
                    { icon:"🏭", name:"GROSS MARGIN",  desc:"Margen bruto. Refleja el moat competitivo y poder de fijación de precios.", ideal:"> 50%" },
                    { icon:"🛡️", name:"DEUDA/EQUITY",  desc:"Solidez financiera. Buffett evita deuda excesiva — prefiere negocios que se financian solos.", ideal:"< 0.5" },
                    { icon:"📈", name:"NET MARGIN",    desc:"Margen neto. Cuánto queda de cada dólar vendido después de todos los costos.", ideal:"> 10%" },
                    { icon:"✅", name:"EPS HISTORY",   desc:"Años consecutivos con EPS positivo. Señal de negocios estables y predecibles.", ideal:"≥ 5 años" },
                  ].map(c => (
                    <div key={c.name} className="bf-crit-card">
                      <div className="bf-crit-icon">{c.icon}</div>
                      <div className="bf-crit-name">{c.name}</div>
                      <div className="bf-crit-desc">{c.desc}</div>
                      <div className="bf-crit-ideal">{c.ideal}</div>
                    </div>
                  ))}
                </div>

                {/* Loading state */}
                {bLoading && (
                  <div style={{ textAlign:"center", padding:"40px", fontFamily:"monospace", fontSize:".7rem", color:"var(--eq-gray)" }}>
                    <div style={{ fontSize:"1.5rem", marginBottom:8 }}>⟳</div>
                    Cargando datos de heliumdb...
                  </div>
                )}

                {/* No data yet */}
                {!bLoading && totalAnalyzed === 0 && (
                  <div style={{ textAlign:"center", padding:"40px 20px", background:"var(--eq-bg2)", border:"1px solid var(--eq-border)", borderRadius:6, margin:"12px 0" }}>
                    <div style={{ fontSize:"2rem", marginBottom:8 }}>🔬</div>
                    <div style={{ fontFamily:"monospace", fontSize:".75rem", color:"var(--eq-white)", marginBottom:6 }}>BASE DE DATOS VACÍA</div>
                    <div style={{ fontFamily:"monospace", fontSize:".65rem", color:"var(--eq-gray)", maxWidth:400, margin:"0 auto 16px" }}>
                      El scanner aún no ha analizado ninguna empresa. Presiona <strong style={{color:"#00e5ff"}}>INICIAR SCAN</strong> para comenzar el análisis con datos reales de FMP. Se analizarán hasta 46 empresas por día (límite free tier).
                    </div>
                    <button onClick={runBuffettScan} disabled={bScanning} style={{ background:"rgba(0,229,255,.15)", border:"1px solid #00e5ff", color:"#00e5ff", fontFamily:"monospace", fontSize:".65rem", padding:"8px 20px", borderRadius:4, cursor:"pointer" }}>
                      ▶ INICIAR PRIMER SCAN
                    </button>
                  </div>
                )}

                {/* TOP 3 PICKS */}
                {!bLoading && top3Real.length > 0 && (
                  <>
                    <div className="eq-sec-title">🏆 TOP 3 PICKS BUFFETT — MAYOR SCORE REAL</div>
                    <div className="bf-top-picks">
                      {top3Real.map((r, idx) => {
                        const gc = bColor2(r.score);
                        const criteriaArr = Object.values(r.criteria ?? {});
                        return (
                          <div key={r.ticker} className="bf-pick-card">
                            <div className="bf-pick-rank">#{idx+1}</div>
                            <div className="bf-pick-sym">{r.ticker}</div>
                            <div className="bf-pick-name">{r.name}</div>
                            <div style={{ fontFamily:"monospace", fontSize:".58rem", color:"var(--eq-gray)", marginBottom:4 }}>{r.sector}</div>
                            <div className="bf-pick-score-row">
                              <div className="bf-pick-scorenum" style={{ color:gc }}>{r.score}</div>
                              <div>
                                <div className="bf-pick-maxlbl">/ 100 pts</div>
                                <div className="bf-grade" style={{ background:`${gc}18`, border:`1px solid ${gc}40`, color:gc }}>{bGrade2(r.score)}</div>
                              </div>
                            </div>
                            <div style={{ fontFamily:"monospace", fontSize:".58rem", color:"var(--eq-gray)", marginBottom:6 }}>
                              {r.passed_count}/{r.total_count} criterios ✓ &nbsp;·&nbsp; ${r.price?.toFixed(2)}
                            </div>
                            {r.valuation && (
                              <div style={{ background:"rgba(0,229,255,.06)", border:"1px solid rgba(0,229,255,.15)", borderRadius:4, padding:"5px 8px", marginBottom:6 }}>
                                <div style={{ fontFamily:"monospace", fontSize:".55rem", color:"var(--eq-gray)" }}>Valor intrínseco: <span style={{ color:"#00e5ff" }}>${r.valuation.intrinsic?.toFixed(2)}</span></div>
                                <div style={{ fontFamily:"monospace", fontSize:".55rem", color: r.valuation.upside > 0 ? "#00e676" : "#ef5350" }}>Upside: {r.valuation.upside > 0 ? "+" : ""}{r.valuation.upside?.toFixed(1)}%</div>
                                <div style={{ fontFamily:"monospace", fontSize:".55rem", color:"var(--eq-amber)" }}>{r.valuation.zone}</div>
                              </div>
                            )}
                            <div className="bf-criteria-bars">
                              {criteriaArr.slice(0,5).map(c => (
                                <div key={c.label} className="bf-cbar-row">
                                  <div className="bf-cbar-lbl">{c.label}</div>
                                  <div className="bf-cbar-track"><div className="bf-cbar-fill" style={{ width:`${c.pass * 100}%`, background: c.pass ? "#00e676" : "#ef5350" }} /></div>
                                  <div style={{ fontFamily:"monospace", fontSize:".52rem", color: c.pass ? "#00e676" : "#ef5350", width:32, textAlign:"right" }}>{c.display}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* TABLA COMPLETA */}
                {!bLoading && sortedReal.length > 0 && (
                  <>
                    <div className="eq-sec-title">📊 RANKING COMPLETO — {sortedReal.length} EMPRESAS — DATOS REALES FMP</div>
                    <div className="bf-table-wrap">
                      <div style={{ padding:"8px 12px", borderBottom:"1px solid var(--eq-border)", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <div style={{ fontFamily:"monospace", fontSize:".58rem", color:"var(--eq-gray)" }}>Click en columna para ordenar · Click en fila para expandir criterios</div>
                        <div style={{ marginLeft:"auto", fontFamily:"monospace", fontSize:".58rem", color:"var(--eq-gray)" }}>
                          🟢 ≥78 excelente &nbsp;🟡 60-77 bueno &nbsp;🟠 44-59 regular &nbsp;🔴 &lt;44 evitar
                        </div>
                      </div>
                      <table className="bf-table">
                        <thead>
                          <tr>
                            <th style={{ width:28 }}>#</th>
                            <th>TICKER</th>
                            <th onClick={() => thR("score")} style={{ cursor:"pointer", color: bSortReal==="score"?"var(--eq-gold)":undefined }}>SCORE {bSortReal==="score"?(bSortRealDesc?"▼":"▲"):""}</th>
                            <th>CRITERIOS</th>
                            <th onClick={() => thR("pe")} style={{ cursor:"pointer", color: bSortReal==="pe"?"var(--eq-gold)":undefined }}>P/E {bSortReal==="pe"?(bSortRealDesc?"▼":"▲"):""}</th>
                            <th onClick={() => thR("gm")} style={{ cursor:"pointer", color: bSortReal==="gm"?"var(--eq-gold)":undefined }}>MARGEN {bSortReal==="gm"?(bSortRealDesc?"▼":"▲"):""}</th>
                            <th onClick={() => thR("de")} style={{ cursor:"pointer", color: bSortReal==="de"?"var(--eq-gold)":undefined }}>D/E {bSortReal==="de"?(bSortRealDesc?"▼":"▲"):""}</th>
                            <th onClick={() => thR("upside")} style={{ cursor:"pointer", color: bSortReal==="upside"?"var(--eq-gold)":undefined }}>UPSIDE {bSortReal==="upside"?(bSortRealDesc?"▼":"▲"):""}</th>
                            <th>ZONA</th>
                            <th>ACTUALIZADO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedReal.map((r, i) => {
                            const gc = bColor2(r.score);
                            const isExp = bExpanded === r.ticker;
                            return (
                              <React.Fragment key={r.ticker}>
                                <tr onClick={() => setBExpanded(isExp ? null : r.ticker)} style={{ cursor:"pointer", background: isExp ? "rgba(0,229,255,.04)" : undefined }}>
                                  <td style={{ color:"var(--eq-gray)" }}>{i+1}</td>
                                  <td>
                                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                      <div style={{ width:22, height:22, borderRadius:"50%", background:`${gc}18`, color:gc, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Orbitron',monospace", fontSize:".48rem", fontWeight:900, flexShrink:0 }}>{r.ticker.substring(0,2)}</div>
                                      <div>
                                        <div style={{ fontFamily:"monospace", fontSize:".7rem", fontWeight:700, color:"var(--eq-white)" }}>{r.ticker}</div>
                                        <div style={{ fontFamily:"monospace", fontSize:".55rem", color:"var(--eq-gray)", maxWidth:100, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.name}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                      <div className="bf-score-badge" style={{ background:`${gc}18`, border:`1px solid ${gc}40`, color:gc }}>{r.score}</div>
                                      <div className="bf-bar-wrap"><div className="bf-bar-fill" style={{ width:`${r.score}%`, background:gc }} /></div>
                                    </div>
                                  </td>
                                  <td>
                                    <span style={{ fontFamily:"monospace", fontSize:".65rem", color: r.passed_count >= 7 ? "#00e676" : r.passed_count >= 5 ? "#ffd700" : "#ef5350" }}>
                                      {r.passed_count}/{r.total_count}
                                    </span>
                                  </td>
                                  <td style={{ fontFamily:"monospace", fontSize:".65rem", color: (r.raw?.pe??0) > 0 && (r.raw?.pe??0) < 20 ? "var(--eq-green)" : (r.raw?.pe??0) < 30 ? "var(--eq-amber)" : "var(--eq-red)" }}>
                                    {(r.raw?.pe??0) > 0 ? `${(r.raw?.pe??0).toFixed(1)}x` : "N/A"}
                                  </td>
                                  <td style={{ fontFamily:"monospace", fontSize:".65rem", color: (r.raw?.gm??0) >= 50 ? "var(--eq-green)" : (r.raw?.gm??0) >= 30 ? "var(--eq-amber)" : "var(--eq-red)" }}>
                                    {(r.raw?.gm??0).toFixed(1)}%
                                  </td>
                                  <td style={{ fontFamily:"monospace", fontSize:".65rem", color: (r.raw?.de??0) < 0.5 ? "var(--eq-green)" : (r.raw?.de??0) < 1.0 ? "var(--eq-amber)" : "var(--eq-red)" }}>
                                    {(r.raw?.de??0).toFixed(2)}
                                  </td>
                                  <td style={{ fontFamily:"monospace", fontSize:".65rem", color: (r.valuation?.upside??-99) > 15 ? "#00e676" : (r.valuation?.upside??-99) > 0 ? "#ffd700" : "#ef5350" }}>
                                    {r.valuation ? `${r.valuation.upside > 0 ? "+" : ""}${r.valuation.upside?.toFixed(1)}%` : "—"}
                                  </td>
                                  <td style={{ fontFamily:"monospace", fontSize:".58rem", color:"var(--eq-amber)", maxWidth:130, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                    {r.valuation?.zone ?? "—"}
                                  </td>
                                  <td style={{ fontFamily:"monospace", fontSize:".58rem" }}>
                                    {(() => {
                                      if (!r.analyzed_at) return <span style={{ color:"var(--eq-gray)" }}>—</span>;
                                      const ageMs = Date.now() - new Date(r.analyzed_at).getTime();
                                      const ageH = ageMs / 3_600_000;
                                      const color = ageH < 24 ? "var(--eq-green)" : ageH < 24 * 7 ? "var(--eq-amber)" : "var(--eq-red)";
                                      const label = ageH < 1 ? "hace <1h" : ageH < 24 ? `hace ${Math.floor(ageH)}h` : `hace ${Math.floor(ageH / 24)}d`;
                                      return <span style={{ color }}>{label}</span>;
                                    })()}
                                  </td>
                                </tr>
                                {isExp && (
                                  <tr style={{ background:"rgba(0,229,255,.03)" }}>
                                    <td colSpan={10} style={{ padding:"10px 16px" }}>
                                      {/* ─── 9 CRITERIOS BUFFETT ─── */}
                                      <div style={{ fontFamily:"monospace", fontSize:".58rem", color:"#00e5ff", marginBottom:5, fontWeight:700 }}>📋 9 CRITERIOS BUFFETT</div>
                                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:5, marginBottom:10 }}>
                                        {Object.values(r.criteria ?? {}).map(c => (
                                          <div key={c.label} style={{ background: c.pass ? "rgba(0,230,118,.08)" : "rgba(239,83,80,.08)", border:`1px solid ${c.pass?"rgba(0,230,118,.25)":"rgba(239,83,80,.25)"}`, borderRadius:4, padding:"5px 8px" }}>
                                            <div style={{ fontFamily:"monospace", fontSize:".58rem", color: c.pass?"#00e676":"#ef5350", fontWeight:700 }}>{c.pass?"✓":"✗"} {c.label}</div>
                                            <div style={{ fontFamily:"monospace", fontSize:".55rem", color:"var(--eq-white)" }}>{c.display}</div>
                                            <div style={{ fontFamily:"monospace", fontSize:".52rem", color:"var(--eq-gray)" }}>Target: {c.target}</div>
                                          </div>
                                        ))}
                                      </div>

                                      {/* ─── VALUACIÓN ─── */}
                                      {r.valuation && (
                                        <div style={{ marginBottom:10 }}>
                                          <div style={{ fontFamily:"monospace", fontSize:".58rem", color:"#00e5ff", marginBottom:5, fontWeight:700 }}>💎 VALUACIÓN DCF + GRAHAM</div>
                                          <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                                            <div style={{ fontFamily:"monospace", fontSize:".6rem", background:"rgba(0,229,255,.07)", border:"1px solid rgba(0,229,255,.2)", borderRadius:4, padding:"4px 10px", color:"#00e5ff" }}>
                                              Intrínseco: ${r.valuation.intrinsic?.toFixed(2)}
                                            </div>
                                            <div style={{ fontFamily:"monospace", fontSize:".6rem", color: r.valuation.upside > 0 ? "#00e676" : "#ef5350" }}>
                                              Upside: {r.valuation.upside > 0 ? "+" : ""}{r.valuation.upside?.toFixed(1)}%
                                            </div>
                                            <div style={{ fontFamily:"monospace", fontSize:".6rem", color:"#ffd700" }}>{r.valuation.zone}</div>
                                            {Object.entries(r.valuation.levels ?? {}).map(([k,v]) => (
                                              <div key={k} style={{ fontFamily:"monospace", fontSize:".55rem", color:"var(--eq-gray)" }}>
                                                <span style={{ color:"var(--eq-amber)", textTransform:"capitalize" }}>{k.replace("_"," ")}: </span>${(v as number).toFixed(2)}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* ─── ANÁLISIS TÉCNICO ─── */}
                                      {r.technical && (
                                        <div style={{ marginBottom:10 }}>
                                          <div style={{ fontFamily:"monospace", fontSize:".58rem", color:"#00e5ff", marginBottom:5, fontWeight:700 }}>📊 ANÁLISIS TÉCNICO</div>
                                          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:5 }}>
                                            {/* Señal general */}
                                            <div style={{ background:"rgba(0,229,255,.06)", border:"1px solid rgba(0,229,255,.2)", borderRadius:4, padding:"6px 10px", gridColumn:"1/-1" }}>
                                              <div style={{ fontFamily:"monospace", fontSize:".62rem", color: r.technical.signal.score >= 70 ? "#00e676" : r.technical.signal.score >= 50 ? "#ffd700" : "#ef5350", fontWeight:700 }}>
                                                {r.technical.signal.label} &nbsp;·&nbsp; Score técnico: {r.technical.signal.score}/100
                                              </div>
                                              <div style={{ fontFamily:"monospace", fontSize:".55rem", color:"var(--eq-gray)", marginTop:2 }}>
                                                EMA: {r.technical.ema_trend}
                                              </div>
                                            </div>
                                            {/* RSI */}
                                            <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid var(--eq-border)", borderRadius:4, padding:"5px 8px" }}>
                                              <div style={{ fontFamily:"monospace", fontSize:".55rem", color:"var(--eq-gray)" }}>RSI (14)</div>
                                              <div style={{ fontFamily:"monospace", fontSize:".65rem", color: r.technical.rsi.value > 70 ? "#ef5350" : r.technical.rsi.value < 30 ? "#00e676" : "#ffd700", fontWeight:700 }}>{r.technical.rsi.value}</div>
                                              <div style={{ fontFamily:"monospace", fontSize:".52rem", color:"var(--eq-gray)" }}>{r.technical.rsi.zone}</div>
                                            </div>
                                            {/* MACD */}
                                            <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid var(--eq-border)", borderRadius:4, padding:"5px 8px" }}>
                                              <div style={{ fontFamily:"monospace", fontSize:".55rem", color:"var(--eq-gray)" }}>MACD</div>
                                              <div style={{ fontFamily:"monospace", fontSize:".62rem", color: r.technical.macd.hist > 0 ? "#00e676" : "#ef5350", fontWeight:700 }}>{r.technical.macd.trend}</div>
                                              {r.technical.macd.cross !== "—" && <div style={{ fontFamily:"monospace", fontSize:".52rem", color:"#ffd700" }}>{r.technical.macd.cross}</div>}
                                            </div>
                                            {/* Bollinger */}
                                            <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid var(--eq-border)", borderRadius:4, padding:"5px 8px" }}>
                                              <div style={{ fontFamily:"monospace", fontSize:".55rem", color:"var(--eq-gray)" }}>Bollinger BW</div>
                                              <div style={{ fontFamily:"monospace", fontSize:".62rem", color:"var(--eq-white)", fontWeight:700 }}>{r.technical.bollinger.bw_pct}%</div>
                                              <div style={{ fontFamily:"monospace", fontSize:".52rem", color:"var(--eq-gray)" }}>{r.technical.bollinger.zone}</div>
                                            </div>
                                            {/* OBV */}
                                            <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid var(--eq-border)", borderRadius:4, padding:"5px 8px" }}>
                                              <div style={{ fontFamily:"monospace", fontSize:".55rem", color:"var(--eq-gray)" }}>OBV / Volumen</div>
                                              <div style={{ fontFamily:"monospace", fontSize:".6rem", color: r.technical.volume.obv_trend.includes("ALCISTA") ? "#00e676" : "#ef5350", fontWeight:700 }}>{r.technical.volume.obv_trend}</div>
                                              <div style={{ fontFamily:"monospace", fontSize:".52rem", color:"var(--eq-gray)" }}>ratio: {r.technical.volume.ratio}x</div>
                                            </div>
                                            {/* Fibonacci */}
                                            <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid var(--eq-border)", borderRadius:4, padding:"5px 8px" }}>
                                              <div style={{ fontFamily:"monospace", fontSize:".55rem", color:"var(--eq-gray)" }}>Fibonacci</div>
                                              <div style={{ fontFamily:"monospace", fontSize:".6rem", color:"#ffd700", fontWeight:700 }}>Nivel {r.technical.fibonacci.nearest}</div>
                                              <div style={{ fontFamily:"monospace", fontSize:".52rem", color:"var(--eq-gray)" }}>${r.technical.fibonacci.nearest_price}</div>
                                            </div>
                                            {/* Armónicas */}
                                            {r.technical.harmonics.count > 0 && (
                                              <div style={{ background:"rgba(255,215,0,.06)", border:"1px solid rgba(255,215,0,.2)", borderRadius:4, padding:"5px 8px" }}>
                                                <div style={{ fontFamily:"monospace", fontSize:".55rem", color:"var(--eq-gray)" }}>Patrón Armónico</div>
                                                <div style={{ fontFamily:"monospace", fontSize:".62rem", color:"#ffd700", fontWeight:700 }}>{r.technical.harmonics.detected.join(", ")}</div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* ─── POLYGON SIGNALS ─── */}
                                      {r.polygon && (
                                        <div>
                                          <div style={{ fontFamily:"monospace", fontSize:".58rem", color:"#00e5ff", marginBottom:5, fontWeight:700 }}>🔮 SEÑALES POLYGON / MASSIVE</div>
                                          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                                            <div style={{ fontFamily:"monospace", fontSize:".6rem", background:`${r.polygon.score>=65?"rgba(0,230,118,.08)":r.polygon.score<40?"rgba(239,83,80,.08)":"rgba(255,215,0,.06)"}`, border:`1px solid ${r.polygon.score>=65?"rgba(0,230,118,.25)":r.polygon.score<40?"rgba(239,83,80,.25)":"rgba(255,215,0,.2)"}`, borderRadius:4, padding:"5px 10px" }}>
                                              Score Polygon: <strong style={{ color: r.polygon.score>=65?"#00e676":r.polygon.score<40?"#ef5350":"#ffd700" }}>{r.polygon.score}/100</strong> · {r.polygon.label}
                                            </div>
                                            {r.polygon.oi?.available && (
                                              <div style={{ fontFamily:"monospace", fontSize:".58rem", background:"rgba(255,255,255,.03)", border:"1px solid var(--eq-border)", borderRadius:4, padding:"5px 10px", color:"var(--eq-gray)" }}>
                                                OI Options: <span style={{ color:"var(--eq-white)" }}>{r.polygon.oi.sentiment}</span> (P/C: {r.polygon.oi.pc_ratio})
                                              </div>
                                            )}
                                            {r.polygon.short?.available && (
                                              <div style={{ fontFamily:"monospace", fontSize:".58rem", background:"rgba(255,255,255,.03)", border:"1px solid var(--eq-border)", borderRadius:4, padding:"5px 10px", color:"var(--eq-gray)" }}>
                                                Short: <span style={{ color:"var(--eq-white)" }}>{r.polygon.short.label}</span>
                                              </div>
                                            )}
                                            {r.polygon.insider?.available && (
                                              <div style={{ fontFamily:"monospace", fontSize:".58rem", background:"rgba(255,255,255,.03)", border:"1px solid var(--eq-border)", borderRadius:4, padding:"5px 10px", color:"var(--eq-gray)" }}>
                                                Insiders: <span style={{ color:"var(--eq-white)" }}>{r.polygon.insider.label}</span>
                                              </div>
                                            )}
                                            {r.polygon.news?.available && (
                                              <div style={{ fontFamily:"monospace", fontSize:".58rem", background:"rgba(255,255,255,.03)", border:"1px solid var(--eq-border)", borderRadius:4, padding:"5px 10px", color:"var(--eq-gray)" }}>
                                                Noticias: <span style={{ color:"var(--eq-white)" }}>{r.polygon.news.label}</span> ({r.polygon.news.articles} artículos)
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                <div className="eq-sec-title">📖 LAS REGLAS DE ORO DE BUFFETT</div>
                <div className="bf-rule-grid">
                  {[
                    { title:"REGLA 1 — ENTIENDE EL NEGOCIO", body:"Buffett nunca invierte en lo que no entiende. Su «círculo de competencia» es deliberadamente estrecho: seguros, bancos, consumo masivo, tecnología de plataforma con moat. Si no puedes explicar el modelo de negocio en 2 minutos, no inviertas." },
                    { title:"REGLA 2 — VENTAJA COMPETITIVA DURABLE", body:"El moat económico es la protección de las utilidades futuras. Puede ser marca (Coca-Cola), costos de cambio (Microsoft Office), efecto de red (Visa/Mastercard), licencia regulatoria o liderazgo en costos. Sin moat, no hay inversión." },
                    { title:"REGLA 3 — DIRECTIVOS HONESTOS Y CAPACES", body:"Buffett invierte en jockeys, no solo en caballos. Prefiere CEOs que traten el dinero de accionistas como propio, que sean honestos en los informes, que eviten la ingeniería contable y que demuestren disciplina de capital a largo plazo." },
                    { title:"REGLA 4 — PRECIO CON MARGEN DE SEGURIDAD", body:"Valor intrínseco calculado con DCF conservador. Comprar solo con 25-50% de descuento sobre ese valor — ese margen cubre errores de análisis y sorpresas del mercado. En bolsa se es alcista a largo plazo pero conservador en precio de entrada." },
                    { title:"REGLA 5 — HORIZONTE A 10+ AÑOS", body:"«Si no estás dispuesto a tener una acción 10 años, no la tengas 10 minutos.» Los mejores retornos vienen del interés compuesto en empresas excelentes sostenidas en el tiempo. El trading frecuente destruye valor después de impuestos y comisiones." },
                    { title:"REGLA 6 — CASH COMO ARMA ESTRATÉGICA", body:"Berkshire mantiene $167B en efectivo no por cobardía, sino por disciplina: espera precios de pánico para comprar negocios excepcionales. El cash en una crisis es como oxígeno en el fondo del mar — vale infinito cuando lo necesitas." },
                  ].map(r => (
                    <div key={r.title} className="bf-rule-card">
                      <div className="bf-rule-title">{r.title}</div>
                      <div className="bf-rule-body">{r.body}</div>
                    </div>
                  ))}
                </div>
                </>)}
              </>
            );
          })()}

          {/* ══ INSIDERS ══ */}
          {section === "insiders" && (() => {
            const txList = INSIDER_DATA[insiderStock] ?? INSIDER_DEFAULT;
            const totalBuyVal  = txList.filter(t => t.type==="BUY") .reduce((a, t) => a + t.shares * (t.price || liveStocks.find(s=>s.sym===insiderStock)?.price || 100), 0);
            const totalSellVal = txList.filter(t => t.type==="SELL").reduce((a, t) => a + t.shares * (t.price || liveStocks.find(s=>s.sym===insiderStock)?.price || 100), 0);
            const total = totalBuyVal + totalSellVal || 1;
            const buyPct  = totalBuyVal  / total * 100;
            const sellPct = totalSellVal / total * 100;
            const netSentiment = buyPct >= 50 ? "BULLISH" : "BEARISH";
            const activeStock2 = liveStocks.find(s => s.sym === insiderStock);

            const INST_HOLDINGS: Record<string, {name:string; pct:number}[]> = {
              "AAPL":  [{name:"Vanguard",pct:8.9},{name:"BlackRock",pct:7.2},{name:"Berkshire",pct:5.8},{name:"State Street",pct:3.8},{name:"Fidelity",pct:2.3}],
              "MSFT":  [{name:"Vanguard",pct:9.1},{name:"BlackRock",pct:7.8},{name:"State Street",pct:4.1},{name:"Fidelity",pct:3.2},{name:"T. Rowe Price",pct:2.8}],
              "NVDA":  [{name:"Vanguard",pct:8.2},{name:"BlackRock",pct:6.9},{name:"State Street",pct:3.4},{name:"FMR LLC",pct:3.1},{name:"Geode Capital",pct:2.6}],
              "BRK.B": [{name:"Vanguard",pct:9.6},{name:"State Street",pct:4.8},{name:"BlackRock",pct:4.2},{name:"Fidelity",pct:2.1},{name:"Geode Capital",pct:1.9}],
              "JPM":   [{name:"Vanguard",pct:8.5},{name:"BlackRock",pct:7.1},{name:"State Street",pct:4.3},{name:"Wellington",pct:3.2},{name:"Fidelity",pct:2.7}],
              "XOM":   [{name:"Vanguard",pct:8.8},{name:"BlackRock",pct:7.5},{name:"State Street",pct:4.5},{name:"Wellington",pct:3.0},{name:"T. Rowe Price",pct:2.4}],
            };
            const defaultInst = [{name:"Vanguard",pct:8.5},{name:"BlackRock",pct:6.9},{name:"State Street",pct:3.8},{name:"Fidelity",pct:2.4},{name:"Geode Capital",pct:2.1}];
            const instHoldings = INST_HOLDINGS[insiderStock] ?? defaultInst;

            return (
              <>
                <div className="eq-sec-title">🕵️ INSIDER TRADING — ACTIVIDAD DE EJECUTIVOS Y DIRECTIVOS</div>

                <div className="bf-scanner-bar" style={{ borderColor:"rgba(0,229,255,.18)", background:"rgba(0,229,255,.03)" }}>
                  <div className="bf-led" />
                  <div className="bf-scanner-txt" style={{ color:"var(--eq-cyan)" }}>
                    Datos públicos de formularios SEC Form 4 — Transacciones de insiders (ejecutivos, directivos, accionistas &gt;10%)
                  </div>
                  <div style={{ marginLeft:"auto", fontFamily:"monospace", fontSize:".6rem", color:"var(--eq-gray)" }}>
                    Últimos 90 días &nbsp;|&nbsp;
                    <span style={{ color:"var(--eq-amber)" }}>⚠ Conectar FMP en /admin/apis para datos en tiempo real</span>
                  </div>
                </div>

                <div className="eq-bottom-panel" style={{ marginBottom:14 }}>
                  <div className="bp-head">
                    <div className="bp-title">SELECCIONAR EMPRESA</div>
                    <div style={{ fontFamily:"monospace", fontSize:".58rem", color:"var(--eq-gray)" }}>Click para ver sus insiders</div>
                  </div>
                  <div className="ins-selector">
                    {liveStocks.map(s => (
                      <button key={s.sym} className={`ins-sym-btn${insiderStock===s.sym?" active":""}`} onClick={() => setInsiderStock(s.sym)}>
                        {s.sym}
                      </button>
                    ))}
                  </div>
                </div>

                {activeStock2 && (
                  <div style={{ background:"var(--eq-panel)", border:"1px solid var(--eq-border)", borderRadius:6, padding:"10px 16px", marginBottom:14, display:"flex", alignItems:"center", gap:16 }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:activeStock2.bg, color:activeStock2.color, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Orbitron',monospace", fontSize:".7rem", fontWeight:900 }}>{activeStock2.sym.substring(0,2)}</div>
                    <div>
                      <div style={{ fontFamily:"'Orbitron',monospace", fontSize:".85rem", fontWeight:700, color:"var(--eq-white)" }}>{activeStock2.sym} — {activeStock2.name}</div>
                      <div style={{ fontFamily:"monospace", fontSize:".62rem", color:"var(--eq-gray)" }}>{activeStock2.sector}</div>
                    </div>
                    <div style={{ marginLeft:"auto", textAlign:"right" }}>
                      <div style={{ fontFamily:"'Orbitron',monospace", fontSize:".8rem", color: netSentiment==="BULLISH"?"var(--eq-green)":"var(--eq-red)" }}>
                        {netSentiment==="BULLISH"?"📈 INSIDER NET BUYER":"📉 INSIDER NET SELLER"}
                      </div>
                      <div style={{ fontFamily:"monospace", fontSize:".6rem", color:"var(--eq-gray)", marginTop:2 }}>
                        Comprado: ${(totalBuyVal/1e6).toFixed(1)}M &nbsp;|&nbsp; Vendido: ${(totalSellVal/1e6).toFixed(1)}M
                      </div>
                    </div>
                  </div>
                )}

                <div className="ins-grid-2">
                  <div className="eq-bottom-panel">
                    <div className="bp-head">
                      <div className="bp-title">📋 TRANSACCIONES RECIENTES — {insiderStock}</div>
                      <span style={{ fontFamily:"monospace", fontSize:".58rem", color:"var(--eq-gray)" }}>SEC Form 4</span>
                    </div>
                    <div className="bp-body" style={{ padding:0 }}>
                      <table className="ins-tx-table">
                        <thead>
                          <tr>
                            <th>FECHA</th>
                            <th>EJECUTIVO</th>
                            <th>CARGO</th>
                            <th>TIPO</th>
                            <th>ACCIONES</th>
                            <th>PRECIO</th>
                            <th>VALOR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {txList.map((tx, i) => {
                            const livePrice = liveStocks.find(s=>s.sym===insiderStock)?.price ?? tx.price;
                            const val = tx.shares * (tx.price || livePrice);
                            return (
                              <tr key={i}>
                                <td style={{ color:"var(--eq-gray)" }}>{tx.date}</td>
                                <td style={{ color:"var(--eq-white)" }}>{tx.name}</td>
                                <td style={{ color:"var(--eq-gray)" }}>{tx.title}</td>
                                <td><span className={tx.type==="BUY"?"ins-buy-badge":"ins-sell-badge"}>{tx.type==="BUY"?"▲ COMPRA":"▼ VENTA"}</span></td>
                                <td style={{ color:"var(--eq-white)" }}>{tx.shares.toLocaleString()}</td>
                                <td style={{ color:"var(--eq-gray)" }}>${(tx.price || livePrice).toFixed(2)}</td>
                                <td style={{ color:tx.type==="BUY"?"var(--eq-green)":"var(--eq-red)" }}>
                                  ${val >= 1e6 ? (val/1e6).toFixed(2)+"M" : val >= 1e3 ? (val/1e3).toFixed(0)+"K" : val.toFixed(0)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ padding:"10px 14px", borderTop:"1px solid var(--eq-border)" }}>
                      <div style={{ fontFamily:"monospace", fontSize:".6rem", color:"var(--eq-gray)", marginBottom:6 }}>SENTIMIENTO NETO (compra vs venta en $)</div>
                      <div className="ins-sentiment-bar">
                        <div style={{ width:`${buyPct}%`, background:"var(--eq-green)", transition:"width .4s" }} />
                        <div style={{ width:`${sellPct}%`, background:"var(--eq-red)", transition:"width .4s" }} />
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", fontFamily:"monospace", fontSize:".58rem" }}>
                        <span style={{ color:"var(--eq-green)" }}>▲ COMPRAS {buyPct.toFixed(0)}%</span>
                        <span style={{ color:"var(--eq-red)" }}>VENTAS {sellPct.toFixed(0)}% ▼</span>
                      </div>
                    </div>
                  </div>

                  <div className="eq-bottom-panel">
                    <div className="bp-head"><div className="bp-title">🏦 TENENCIA INSTITUCIONAL — {insiderStock}</div></div>
                    <div className="bp-body">
                      <div style={{ fontFamily:"monospace", fontSize:".6rem", color:"var(--eq-gray)", marginBottom:10 }}>
                        Top 5 fondos institucionales por % de tenencia
                      </div>
                      {instHoldings.map((inst, i) => (
                        <div key={i} className="ins-inst-row">
                          <div className="ins-inst-name">{inst.name}</div>
                          <div className="ins-inst-bar"><div style={{ width:`${inst.pct/12*100}%`, height:"100%", background:"var(--eq-cyan)", borderRadius:3 }} /></div>
                          <div className="ins-inst-val">{inst.pct.toFixed(1)}%</div>
                        </div>
                      ))}
                      <div style={{ marginTop:14, padding:"10px 12px", background:"rgba(0,229,255,.04)", border:"1px solid rgba(0,229,255,.12)", borderRadius:6 }}>
                        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:".6rem", color:"var(--eq-cyan)", marginBottom:6 }}>📖 CÓMO INTERPRETAR INSIDERS</div>
                        <div style={{ fontFamily:"monospace", fontSize:".68rem", color:"var(--eq-gray)", lineHeight:1.5 }}>
                          Los insiders venden por muchas razones (liquidez, impuestos, diversificación). Pero los insiders <span style={{ color:"var(--eq-green)" }}>COMPRAN por una sola razón: creen que el precio está barato</span>. Buffett lo llama la señal más honesta del mercado — «nadie compra su propia empresa si cree que va a caer».
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background:"var(--eq-panel)", border:"1px solid var(--eq-border)", borderRadius:6, overflow:"hidden", marginBottom:14 }}>
                  <div style={{ padding:"10px 16px", borderBottom:"1px solid var(--eq-border)", fontFamily:"'Orbitron',monospace", fontSize:".65rem", fontWeight:700, color:"var(--eq-cyan)", letterSpacing:".15em" }}>
                    🔑 SEÑALES DE INSIDER TRADING MÁS IMPORTANTES EN BOLSA
                  </div>
                  <div style={{ padding:"12px 16px", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                    {[
                      { icon:"🟢", title:"COMPRA CLÚSTER", desc:"Múltiples insiders (CEO + CFO + Directores) compran simultáneamente en las mismas semanas — señal de alta convicción interna. Históricamente predice +25-40% en 12 meses." },
                      { icon:"🔴", title:"VENTA COORDINADA", desc:"Todos los ejecutivos reducen posición al mismo tiempo — puede indicar techo de ciclo o problemas conocidos internamente. Nunca es señal positiva cuando es masiva y simultánea." },
                      { icon:"🟡", title:"10b5-1 PLANS", desc:"Ventas programadas de antemano para evitar conflictos legales. Un CEO vendiendo por 10b5-1 NO es señal bajista — son planes pre-aprobados antes de conocer resultados." },
                    ].map(c => (
                      <div key={c.title} className="analysis-card">
                        <div className="ac-title">{c.icon} {c.title}</div>
                        <div className="ac-body">{c.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}

          {/* ══ DIVIDENDOS ══ */}
          {section === "dividends" && (() => {
            const divPayers = liveStocks.filter(s => s.div > 0).sort((a,b) => b.yield - a.yield);
            const avgYield  = divPayers.reduce((a,s) => a+s.yield, 0) / (divPayers.length||1);
            const topYield  = Math.max(...divPayers.map(s=>s.yield));
            const aristocrats = divPayers.filter(s => aristocrat(s.sym));
            const totalAnnualIncome = (amount: number) => divPayers.reduce((tot, s) => {
              const weight = 1 / divPayers.length;
              return tot + amount * weight * (s.yield/100);
            }, 0);

            return (
              <>
                <div className="eq-sec-title">💰 DIVIDENDOS — INCOME INVESTING & ARISTOCRATS</div>

                <div className="div-overview-cards">
                  <div className="div-ov-card">
                    <div className="div-ov-label">EMPRESAS CON DIVIDENDO</div>
                    <div className="div-ov-value">{divPayers.length}<span style={{ fontSize:".6rem", color:"var(--eq-gray)" }}> / 20</span></div>
                    <div className="div-ov-sub">{(divPayers.length/20*100).toFixed(0)}% del universo analizado</div>
                  </div>
                  <div className="div-ov-card">
                    <div className="div-ov-label">YIELD PROMEDIO</div>
                    <div className="div-ov-value">{avgYield.toFixed(2)}%</div>
                    <div className="div-ov-sub">Rendimiento anual promedio</div>
                  </div>
                  <div className="div-ov-card">
                    <div className="div-ov-label">MEJOR YIELD</div>
                    <div className="div-ov-value" style={{ color:"var(--eq-green)" }}>{topYield.toFixed(2)}%</div>
                    <div className="div-ov-sub">{divPayers[0]?.sym} — {divPayers[0]?.name}</div>
                  </div>
                  <div className="div-ov-card">
                    <div className="div-ov-label">ARISTOCRATS</div>
                    <div className="div-ov-value">{aristocrats.length}</div>
                    <div className="div-ov-sub">25+ años de crecimiento consecutivo</div>
                  </div>
                </div>

                <div className="div-calc-panel">
                  <div style={{ fontFamily:"'Orbitron',monospace", fontSize:".7rem", fontWeight:700, color:"var(--eq-gold)", letterSpacing:".15em", marginBottom:12 }}>
                    🧮 CALCULADORA DE INGRESOS POR DIVIDENDO
                  </div>
                  <div className="div-calc-row">
                    <div style={{ fontFamily:"monospace", fontSize:".72rem", color:"var(--eq-gray)" }}>Capital a invertir (USD):</div>
                    <input
                      type="number"
                      className="div-calc-input"
                      value={divCalcAmt}
                      onChange={e => setDivCalcAmt(Math.max(0, Number(e.target.value)))}
                    />
                    <div style={{ fontFamily:"monospace", fontSize:".62rem", color:"var(--eq-gray)" }}>
                      Distribuido equitativamente entre {divPayers.length} empresas con dividendo
                    </div>
                  </div>
                  <div className="div-calc-result">
                    {[
                      { lbl:"INGRESO ANUAL",   val:"$"+totalAnnualIncome(divCalcAmt).toFixed(2),     sub:"yield promedio ponderado" },
                      { lbl:"INGRESO MENSUAL", val:"$"+(totalAnnualIncome(divCalcAmt)/12).toFixed(2), sub:"promedio por mes" },
                      { lbl:"YIELD EFECTIVO",  val:divPayers.length>0?(totalAnnualIncome(divCalcAmt)/divCalcAmt*100).toFixed(2)+"%":"—", sub:"sobre capital invertido" },
                      { lbl:"BREAK-EVEN",      val: divCalcAmt>0 && totalAnnualIncome(divCalcAmt)>0 ? Math.ceil(divCalcAmt/totalAnnualIncome(divCalcAmt))+" años":"—", sub:"recuperar capital en dividendos" },
                    ].map(box => (
                      <div key={box.lbl} className="div-calc-box">
                        <div className="div-calc-lbl">{box.lbl}</div>
                        <div className="div-calc-val">{box.val}</div>
                        <div style={{ fontFamily:"monospace", fontSize:".55rem", color:"var(--eq-gray)", marginTop:2 }}>{box.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="eq-sec-title">📊 SCREENER DE DIVIDENDOS — ORDENADO POR YIELD</div>
                <div className="div-table-wrap">
                  <table className="div-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>TICKER</th>
                        <th>SECTOR</th>
                        <th>PRECIO</th>
                        <th>DIV ANUAL</th>
                        <th>YIELD</th>
                        <th>PAYOUT RATIO</th>
                        <th>AÑOS CRECIMIENTO</th>
                        <th>SEÑAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {divPayers.map((s, i) => {
                        const f = FUND[s.sym];
                        const payoutOk = (f?.pr ?? 0) <= 75;
                        return (
                          <tr key={s.sym} onClick={() => { selectStock(s.sym); setSection("overview"); }} style={{ cursor:"pointer" }}>
                            <td style={{ color:"var(--eq-gray)" }}>{i+1}</td>
                            <td>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <div style={{ width:22, height:22, borderRadius:"50%", background:s.bg, color:s.color, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Orbitron',monospace", fontSize:".48rem", fontWeight:900, flexShrink:0 }}>{s.sym.substring(0,2)}</div>
                                <div>
                                  <div style={{ fontFamily:"monospace", fontWeight:700, color:"var(--eq-white)" }}>{s.sym}</div>
                                  {aristocrat(s.sym) && <span className="aristocrat-badge">🏅 ARISTOCRAT</span>}
                                </div>
                              </div>
                            </td>
                            <td style={{ color:"var(--eq-gray)", fontSize:".62rem" }}>{s.sector}</td>
                            <td style={{ fontFamily:"monospace", color:"var(--eq-white)" }}>${s.price.toFixed(2)}</td>
                            <td style={{ fontFamily:"monospace", color:"var(--eq-green)" }}>${s.div.toFixed(2)}</td>
                            <td>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <span style={{ fontFamily:"'Orbitron',monospace", fontSize:".75rem", fontWeight:700, color:s.yield>=3?"#00ff88":s.yield>=2?"var(--eq-green)":s.yield>=1?"var(--eq-amber)":"var(--eq-gray)" }}>{s.yield.toFixed(2)}%</span>
                                <div style={{ width:40, height:4, background:"var(--eq-border)", borderRadius:2, overflow:"hidden" }}>
                                  <div style={{ width:`${Math.min(100, s.yield/5*100)}%`, height:"100%", background:s.yield>=3?"#00ff88":s.yield>=2?"var(--eq-green)":"var(--eq-amber)", borderRadius:2 }} />
                                </div>
                              </div>
                            </td>
                            <td style={{ color:payoutOk?"var(--eq-green)":"var(--eq-red)", fontFamily:"monospace" }}>{f?.pr ? f.pr+"%" : "—"} {(f?.pr ?? 0) > 80 ? "⚠" : ""}</td>
                            <td>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <span style={{ fontFamily:"monospace", color:(FUND[s.sym]?.yrsDiv ?? 0)>=25?"var(--eq-gold)":(FUND[s.sym]?.yrsDiv ?? 0)>=10?"var(--eq-green)":"var(--eq-gray)" }}>{FUND[s.sym]?.yrsDiv ?? 0} años</span>
                                {(FUND[s.sym]?.yrsDiv ?? 0) >= 50 && <span style={{ fontSize:".7rem" }}>👑</span>}
                                {(FUND[s.sym]?.yrsDiv ?? 0) >= 25 && (FUND[s.sym]?.yrsDiv ?? 0) < 50 && <span style={{ fontSize:".7rem" }}>🏅</span>}
                              </div>
                            </td>
                            <td><span className={`${sigClass(s.signal)} sig-badge`}>{s.signal}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {aristocrats.length > 0 && (
                  <>
                    <div className="eq-sec-title">🏅 DIVIDEND ARISTOCRATS EN NUESTRO UNIVERSO</div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:10, marginBottom:14 }}>
                      {aristocrats.map(s => {
                        const f = FUND[s.sym];
                        return (
                          <div key={s.sym} onClick={() => { selectStock(s.sym); setSection("overview"); }} style={{ background:"var(--eq-panel)", border:"1px solid rgba(255,215,0,.25)", borderRadius:8, padding:14, cursor:"pointer", position:"relative", overflow:"hidden" }}>
                            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,var(--eq-gold),var(--eq-amber))" }} />
                            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                              <div style={{ width:34, height:34, borderRadius:"50%", background:s.bg, color:s.color, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Orbitron',monospace", fontSize:".65rem", fontWeight:900 }}>{s.sym.substring(0,2)}</div>
                              <div>
                                <div style={{ fontFamily:"'Orbitron',monospace", fontSize:".8rem", fontWeight:900, color:"var(--eq-white)" }}>{s.sym}</div>
                                <div style={{ fontFamily:"monospace", fontSize:".62rem", color:"var(--eq-gray)" }}>{s.name}</div>
                              </div>
                              <div style={{ marginLeft:"auto", textAlign:"right" }}>
                                <div style={{ fontFamily:"'Orbitron',monospace", fontSize:".85rem", fontWeight:700, color:"var(--eq-gold)" }}>{s.yield.toFixed(2)}%</div>
                                <div style={{ fontFamily:"monospace", fontSize:".55rem", color:"var(--eq-gray)" }}>yield</div>
                              </div>
                            </div>
                            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                              <span className="aristocrat-badge">{(FUND[s.sym]?.yrsDiv ?? 0) >= 50 ? "👑 KING" : "🏅 ARISTOCRAT"}</span>
                              <span style={{ fontFamily:"monospace", fontSize:".6rem", color:"var(--eq-gray)", background:"var(--eq-bg3)", border:"1px solid var(--eq-border)", padding:"1px 6px", borderRadius:3 }}>{f?.yrsDiv ?? 0} años consecutivos</span>
                              <span style={{ fontFamily:"monospace", fontSize:".6rem", color:"var(--eq-green)", background:"rgba(0,230,118,.06)", border:"1px solid rgba(0,230,118,.2)", padding:"1px 6px", borderRadius:3 }}>Div: ${s.div.toFixed(2)}/año</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                <div style={{ background:"var(--eq-panel)", border:"1px solid var(--eq-border)", borderRadius:6, overflow:"hidden", marginBottom:14 }}>
                  <div style={{ padding:"10px 16px", borderBottom:"1px solid var(--eq-border)", fontFamily:"'Orbitron',monospace", fontSize:".65rem", fontWeight:700, color:"var(--eq-gold)", letterSpacing:".15em" }}>
                    📖 GUÍA DE INVERSIÓN EN DIVIDENDOS
                  </div>
                  <div style={{ padding:"12px 16px", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                    {[
                      { icon:"⚠️", title:"YIELD TRAMPA (Dividend Trap)", desc:"Un yield muy alto (>6%) puede ser señal de que el mercado anticipa un recorte del dividendo. Siempre verificar payout ratio (<70% = sostenible). Un dividendo que se recorta destruye capital." },
                      { icon:"🏰", title:"DIVIDEND MOAT", desc:"Busca empresas con 20+ años de crecimiento de dividendo — señal de modelo de negocio resistente a recesiones. Dividend Aristocrats = 25+ años. Dividend Kings = 50+ años sin corte." },
                      { icon:"💹", title:"REINVERSIÓN (DRIP)", desc:"El poder del interés compuesto a través de DRIP (Dividend Reinvestment Plan) es brutal a largo plazo. $10,000 en JNJ hace 30 años reinvirtiendo dividendos = $180,000+ hoy. La paciencia es la estrategia." },
                    ].map(c => (
                      <div key={c.title} className="analysis-card">
                        <div className="ac-title">{c.icon} {c.title}</div>
                        <div className="ac-body">{c.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}

          {/* ══ FINANCIALS — FMP Real Data ══ */}
          {section === "financials" && (() => {
            const sorted   = fmpData ? [...fmpData] : null;
            const latest   = sorted ? sorted[sorted.length - 1] : null;
            const prevY    = sorted && sorted.length >= 2 ? sorted[sorted.length - 2] : null;
            const revCagr  = sorted ? calcCagr(sorted.map(d => d.revenue)) : 0;
            const niCagr   = sorted ? calcCagr(sorted.map(d => d.netIncome)) : 0;
            const epsCagr  = sorted ? calcCagr(sorted.map(d => d.epsDiluted)) : 0;
            const grossMg  = latest ? +((latest.grossProfit / latest.revenue) * 100).toFixed(1) : 0;
            const operMg   = latest ? +((latest.operatingIncome / latest.revenue) * 100).toFixed(1) : 0;
            const netMg    = latest ? +((latest.netIncome / latest.revenue) * 100).toFixed(1) : 0;
            const pGrossMg = prevY  ? +((prevY.grossProfit / prevY.revenue) * 100).toFixed(1) : 0;
            const pOperMg  = prevY  ? +((prevY.operatingIncome / prevY.revenue) * 100).toFixed(1) : 0;
            const pNetMg   = prevY  ? +((prevY.netIncome / prevY.revenue) * 100).toFixed(1) : 0;
            const revYoY   = latest && prevY ? calcYoY(latest.revenue, prevY.revenue) : 0;
            const niYoY    = latest && prevY ? calcYoY(latest.netIncome, prevY.netIncome) : 0;
            const epsYoY   = latest && prevY ? calcYoY(latest.epsDiluted, prevY.epsDiluted) : 0;
            const fmpStock = liveStocks.find(s => s.sym === fmpSymbol) ?? (STOCKS as Stock[]).find(s => s.sym === fmpSymbol) ?? null;
            const realScore = fmpStock && sorted ? (() => {
              const f = FUND[fmpStock.sym]; if (!f) return 0;
              let sc = 0;
              sc += fmpStock.pe<=10?30:fmpStock.pe<=15?25:fmpStock.pe<=20?18:fmpStock.pe<=25?10:fmpStock.pe<=35?5:0;
              sc += f.roe>=30?25:f.roe>=20?20:f.roe>=15?15:f.roe>=10?8:0;
              sc += f.de<=0.3?20:f.de<=0.5?16:f.de<=0.8?10:f.de<=1.2?5:0;
              sc += epsCagr>=20?15:epsCagr>=10?12:epsCagr>=5?8:epsCagr>0?3:0;
              sc += fmpStock.yield>=2&&fmpStock.div>0?10:fmpStock.yield>=1&&fmpStock.div>0?7:fmpStock.div>0?4:0;
              return sc;
            })() : null;
            const staticScore = fmpStock ? bScore(fmpStock.sym, fmpStock.pe, fmpStock.yield, fmpStock.div) : null;
            const bg3 = "var(--eq-bg3)";
            const panel = "var(--eq-panel)";
            const border = "var(--eq-border)";

            return (
              <>
                <div className="eq-sec-title">📊 FINANCIAL STATEMENTS — DATOS REALES VIA FMP API</div>

                {/* ── Stock selector ── */}
                {!fmpSymbol ? (
                  <>
                    <div style={{ background:panel, border:"1px solid var(--eq-border2)", borderRadius:6, padding:"14px 18px", marginBottom:14, display:"flex", alignItems:"center", gap:14 }}>
                      <div style={{ fontSize:"1.8rem" }}>📊</div>
                      <div>
                        <div style={{ fontFamily:"monospace", fontSize:".85rem", color:"var(--eq-white)", marginBottom:3 }}>Selecciona una empresa</div>
                        <div style={{ fontFamily:"monospace", fontSize:".65rem", color:"var(--eq-gray)" }}>Income Statement anual real — últimos 5 años desde FMP API · caché 24h · límite free: 24 calls/día</div>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:8, marginBottom:14 }}>
                      {liveStocks.map(s => (
                        <div key={s.sym} onClick={() => fetchFmp(s.sym)}
                          style={{ background:panel, border:`1px solid ${s.color}30`, borderRadius:6, padding:"10px 12px", cursor:"pointer", transition:"all .2s", display:"flex", alignItems:"center", gap:8 }}
                          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = s.color; (e.currentTarget as HTMLDivElement).style.background = s.bg; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${s.color}30`; (e.currentTarget as HTMLDivElement).style.background = panel; }}
                        >
                          <div style={{ width:28, height:28, borderRadius:"50%", background:s.bg, color:s.color, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Orbitron',monospace", fontSize:".52rem", fontWeight:900, flexShrink:0 }}>{s.sym.substring(0,2)}</div>
                          <div>
                            <div style={{ fontFamily:"monospace", fontSize:".78rem", fontWeight:700, color:"var(--eq-white)" }}>{s.sym}</div>
                            <div style={{ fontFamily:"monospace", fontSize:".55rem", color:"var(--eq-gray)" }}>{s.sector}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {/* ── Company header ── */}
                    <div style={{ background:panel, border:"1px solid var(--eq-border2)", borderRadius:6, padding:"12px 18px", marginBottom:12, display:"flex", alignItems:"center", gap:14 }}>
                      {fmpStock && <div style={{ width:42, height:42, borderRadius:"50%", background:fmpStock.bg, color:fmpStock.color, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Orbitron',monospace", fontSize:".7rem", fontWeight:900 }}>{fmpSymbol.substring(0,2)}</div>}
                      <div>
                        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:"1.1rem", fontWeight:900, color:"var(--eq-white)" }}>{fmpSymbol}</div>
                        <div style={{ fontFamily:"monospace", fontSize:".65rem", color:"var(--eq-gray)" }}>{fmpStock?.name ?? fmpSymbol} · Income Statement {fmpPeriod === "annual" ? "Anual (FY)" : "Trimestral (Q)"}</div>
                      </div>
                      <div style={{ marginLeft:"auto", display:"flex", gap:10, alignItems:"center" }}>
                        <div style={{ display:"flex", border:"1px solid var(--eq-border2)", borderRadius:3, overflow:"hidden" }}>
                          <button onClick={() => { setFmpPeriod("annual"); fetchFmp(fmpSymbol!, "annual"); }}
                            style={{ padding:"4px 10px", fontFamily:"monospace", fontSize:".58rem", border:"none", cursor:"pointer",
                              background: fmpPeriod === "annual" ? "var(--eq-cyan)" : "transparent",
                              color: fmpPeriod === "annual" ? "#000" : "var(--eq-gray)" }}>ANUAL</button>
                          <button onClick={() => { setFmpPeriod("quarter"); fetchFmp(fmpSymbol!, "quarter"); }}
                            style={{ padding:"4px 10px", fontFamily:"monospace", fontSize:".58rem", border:"none", cursor:"pointer",
                              background: fmpPeriod === "quarter" ? "var(--eq-cyan)" : "transparent",
                              color: fmpPeriod === "quarter" ? "#000" : "var(--eq-gray)" }}>TRIMESTRAL</button>
                        </div>
                        {sorted && <div style={{ fontFamily:"monospace", fontSize:".58rem", color:"var(--eq-green)", background:"rgba(0,230,118,.08)", border:"1px solid rgba(0,230,118,.25)", padding:"3px 10px", borderRadius:3 }}>● FMP CONECTADO</div>}
                        <button onClick={() => { setFmpSymbol(null); setFmpData(null); setFmpError(null); }} className="eq-nav-btn">← CAMBIAR</button>
                      </div>
                    </div>

                    {/* Nota: los datos ANUALES solo llegan hasta el último año fiscal
                        ya cerrado y reportado (ej. en 2026, el último disponible es
                        FY2025 — las empresas tardan meses en reportar tras cerrar el
                        año). Para ver algo más reciente, usa TRIMESTRAL. */}
                    {fmpPeriod === "annual" && (
                      <div style={{ fontFamily:"monospace", fontSize:".58rem", color:"var(--eq-gray)", marginBottom:10 }}>
                        ℹ Los reportes anuales solo incluyen años fiscales ya cerrados —
                        para datos más recientes del año en curso, usa el botón TRIMESTRAL.
                      </div>
                    )}

                    {/* Loading */}
                    {fmpLoading && (
                      <div style={{ background:panel, border:`1px solid ${border}`, borderRadius:6, padding:40, textAlign:"center", marginBottom:14 }}>
                        <div style={{ fontFamily:"monospace", fontSize:".8rem", color:"var(--eq-cyan)", marginBottom:8 }}>⏳ Consultando Financial Modeling Prep API...</div>
                        <div style={{ fontFamily:"monospace", fontSize:".62rem", color:"var(--eq-gray)" }}>Cargando Income Statement anual · caché 24h activa</div>
                      </div>
                    )}

                    {/* Error */}
                    {fmpError && !fmpLoading && (
                      <div style={{ background:"rgba(255,23,68,.06)", border:"1px solid rgba(255,23,68,.3)", borderRadius:6, padding:"14px 18px", marginBottom:14 }}>
                        <div style={{ fontFamily:"monospace", fontSize:".8rem", color:"var(--eq-red)", marginBottom:6 }}>⚠ {fmpError}</div>
                        {fmpError.includes("FMP_API_KEY") ? (
                          <div style={{ fontFamily:"monospace", fontSize:".65rem", color:"var(--eq-gray)", lineHeight:1.6 }}>
                            Agrega tu FMP API Key en <strong style={{ color:"var(--eq-cyan)" }}>Replit Secrets</strong> con el nombre <code style={{ color:"var(--eq-gold)" }}>FMP_API_KEY</code>, luego reinicia el api-server.<br />
                            Obtén tu key gratuita en <a href="https://financialmodelingprep.com/developer/docs" target="_blank" rel="noreferrer" style={{ color:"var(--eq-cyan)" }}>financialmodelingprep.com</a> · Free tier: 24 calls/día
                          </div>
                        ) : (
                          <div style={{ fontFamily:"monospace", fontSize:".65rem", color:"var(--eq-gray)" }}>Verifica que la FMP API KEY sea válida · Límite free tier: 24 llamadas/día · Revisa que el api-server esté corriendo.</div>
                        )}
                      </div>
                    )}

                    {/* ── Main content when data loaded ── */}
                    {sorted && !fmpLoading && latest && (
                      <>
                        {/* 4 KPI cards */}
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12 }}>
                          {([
                            { label:"REVENUE",     value:`$${(latest.revenue/1e9).toFixed(1)}B`,    yoy:revYoY, cagr:revCagr, color:"var(--eq-cyan)",   icon:"💰", fy:latest.fiscalYear },
                            { label:"NET INCOME",  value:`$${(latest.netIncome/1e9).toFixed(1)}B`,  yoy:niYoY,  cagr:niCagr,  color:"var(--eq-green)",  icon:"📈", fy:latest.fiscalYear },
                            { label:"EPS DILUTED", value:`$${latest.epsDiluted.toFixed(2)}`,        yoy:epsYoY, cagr:epsCagr, color:"var(--eq-gold)",   icon:"🎯", fy:latest.fiscalYear },
                            { label:"EBITDA",      value:`$${(latest.ebitda/1e9).toFixed(1)}B`,     yoy:prevY?calcYoY(latest.ebitda,prevY.ebitda):0, cagr:sorted?calcCagr(sorted.map(d=>d.ebitda)):0, color:"var(--eq-purple)", icon:"📊", fy:latest.fiscalYear },
                          ] as const).map(c => (
                            <div key={c.label} style={{ background:panel, border:`1px solid ${c.color}30`, borderRadius:6, padding:"14px 16px", position:"relative", overflow:"hidden" }}>
                              <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:c.color }} />
                              <div style={{ fontFamily:"monospace", fontSize:".55rem", color:"var(--eq-gray)", letterSpacing:".12em", marginBottom:6 }}>{c.icon} {c.label} · FY{c.fy}</div>
                              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:"1.25rem", fontWeight:900, color:c.color }}>{c.value}</div>
                              <div style={{ display:"flex", gap:10, marginTop:5, flexWrap:"wrap" }}>
                                <span style={{ fontFamily:"monospace", fontSize:".62rem", color:c.yoy>=0?"var(--eq-green)":"var(--eq-red)" }}>{c.yoy>=0?"▲":"▼"} {Math.abs(c.yoy)}% YoY</span>
                                <span style={{ fontFamily:"monospace", fontSize:".58rem", color:"var(--eq-gray)" }}>CAGR 5yr: <span style={{ color:"var(--eq-amber)" }}>{c.cagr>=0?"+":""}{c.cagr}%</span></span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* 3 Margin cards */}
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:12 }}>
                          {([
                            { label:"MARGEN BRUTO",     value:grossMg, prev:pGrossMg, color:"var(--eq-cyan)"   },
                            { label:"MARGEN OPERATIVO", value:operMg,  prev:pOperMg,  color:"var(--eq-green)"  },
                            { label:"MARGEN NETO",      value:netMg,   prev:pNetMg,   color:"var(--eq-gold)"   },
                          ] as const).map(m => {
                            const delta = prevY ? +(m.value - m.prev).toFixed(1) : null;
                            return (
                              <div key={m.label} style={{ background:panel, border:`1px solid ${border}`, borderRadius:6, padding:"12px 16px" }}>
                                <div style={{ fontFamily:"monospace", fontSize:".55rem", color:"var(--eq-gray)", letterSpacing:".1em", marginBottom:6 }}>{m.label}</div>
                                <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
                                  <div style={{ fontFamily:"'Orbitron',monospace", fontSize:"1.5rem", fontWeight:900, color:m.color }}>{m.value}%</div>
                                  {delta!==null && <div style={{ fontFamily:"monospace", fontSize:".65rem", color:delta>=0?"var(--eq-green)":"var(--eq-red)" }}>{delta>=0?"▲":"▼"} {Math.abs(delta).toFixed(1)}pp YoY</div>}
                                </div>
                                <div style={{ width:"100%", height:3, background:border, borderRadius:2, marginTop:8 }}>
                                  <div style={{ width:`${Math.min(m.value,100)}%`, height:"100%", background:m.color, borderRadius:2, transition:"width .4s" }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Chart type selector */}
                        <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                          {(["revenue","income","eps","margins"] as const).map((k, i) => (
                            <button key={k} className={`eq-nav-btn${fmpChartType===k?" active":""}`} onClick={() => setFmpChartType(k)}>
                              {["💰 REVENUE & GP","📈 NET INCOME & EBITDA","🎯 EPS TREND","📊 MÁRGENES %"][i]}
                            </button>
                          ))}
                        </div>

                        {/* Chart */}
                        <div style={{ background:panel, border:`1px solid ${border}`, borderRadius:6, padding:16, marginBottom:12 }}>
                          <div style={{ height:340, position:"relative" }}>
                            <canvas ref={fmpChartRef} />
                          </div>
                        </div>

                        {/* 5-year data table */}
                        <div style={{ background:panel, border:`1px solid ${border}`, borderRadius:6, overflow:"hidden", marginBottom:12 }}>
                          <div style={{ padding:"10px 16px", borderBottom:`1px solid ${border}`, fontFamily:"'Orbitron',monospace", fontSize:".65rem", fontWeight:700, color:"var(--eq-gold)", letterSpacing:".15em" }}>
                            📋 INCOME STATEMENT HISTÓRICO — USD BILLIONS
                          </div>
                          <div style={{ overflowX:"auto" }}>
                            <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"monospace", fontSize:".68rem" }}>
                              <thead>
                                <tr style={{ background:bg3 }}>
                                  {["MÉTRICA", ...sorted.map(d=>`FY${d.fiscalYear}`)].map(h => (
                                    <th key={h} style={{ padding:"8px 14px", textAlign:"right", color:"var(--eq-gray)", fontWeight:600, letterSpacing:".08em", whiteSpace:"nowrap", borderBottom:`1px solid ${border}` }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {([
                                  { label:"Revenue",        vals:sorted.map(d=>`$${(d.revenue/1e9).toFixed(1)}B`),          color:"var(--eq-cyan)"   },
                                  { label:"Gross Profit",   vals:sorted.map(d=>`$${(d.grossProfit/1e9).toFixed(1)}B`),      color:"var(--eq-white)"  },
                                  { label:"Gross Margin",   vals:sorted.map(d=>`${((d.grossProfit/d.revenue)*100).toFixed(1)}%`), color:"var(--eq-teal)"  },
                                  { label:"Operating Inc.", vals:sorted.map(d=>`$${(d.operatingIncome/1e9).toFixed(1)}B`),  color:"var(--eq-white)"  },
                                  { label:"Net Income",     vals:sorted.map(d=>`$${(d.netIncome/1e9).toFixed(1)}B`),        color:"var(--eq-green)"  },
                                  { label:"EBITDA",         vals:sorted.map(d=>`$${(d.ebitda/1e9).toFixed(1)}B`),          color:"var(--eq-white)"  },
                                  { label:"EPS Diluted",    vals:sorted.map(d=>`$${d.epsDiluted.toFixed(2)}`),             color:"var(--eq-gold)"   },
                                  { label:"R&D / Revenue",  vals:sorted.map(d=>`${d.revenue>0?((d.researchAndDevelopmentExpenses/d.revenue)*100).toFixed(1):"-"}%`), color:"var(--eq-purple)" },
                                ] as const).map((row, ri) => (
                                  <tr key={row.label} style={{ borderBottom:"1px solid rgba(26,42,58,.4)", background:ri%2===0?"transparent":"rgba(13,21,32,.4)" }}>
                                    <td style={{ padding:"7px 14px", color:"var(--eq-gray)", whiteSpace:"nowrap" }}>{row.label}</td>
                                    {(row.vals as string[]).map((v, i) => (
                                      <td key={i} style={{ padding:"7px 14px", textAlign:"right", color:i===sorted.length-1?row.color:"var(--eq-white)", fontWeight:i===sorted.length-1?700:400 }}>{v}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Buffett Score Real vs Estático */}
                        {realScore !== null && staticScore !== null && (
                          <div style={{ background:panel, border:"1px solid rgba(255,215,0,.25)", borderRadius:6, padding:"16px 20px", marginBottom:12, position:"relative", overflow:"hidden" }}>
                            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,var(--eq-gold),var(--eq-amber),var(--eq-green))" }} />
                            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:".65rem", fontWeight:700, color:"var(--eq-gold)", letterSpacing:".15em", marginBottom:14 }}>
                              🔬 BUFFETT SCORE — REAL (FMP) vs ESTIMADO (ESTÁTICO)
                            </div>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:14, alignItems:"center" }}>
                              <div style={{ textAlign:"center", padding:14, background:bg3, borderRadius:6, border:`1px solid ${border}` }}>
                                <div style={{ fontFamily:"monospace", fontSize:".6rem", color:"var(--eq-gray)", marginBottom:8 }}>ESTIMADO — datos estáticos</div>
                                <div style={{ fontFamily:"'Orbitron',monospace", fontSize:"2.8rem", fontWeight:900, color:bColor(staticScore) }}>{staticScore}</div>
                                <div style={{ fontFamily:"monospace", fontSize:".78rem", color:bColor(staticScore), marginTop:4 }}>GRADO {bGrade(staticScore)}</div>
                              </div>
                              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:"1.2rem", color:"var(--eq-gray)" }}>→</div>
                              <div style={{ textAlign:"center", padding:14, background:"rgba(0,230,118,.04)", borderRadius:6, border:"1px solid rgba(0,230,118,.25)" }}>
                                <div style={{ fontFamily:"monospace", fontSize:".6rem", color:"var(--eq-green)", marginBottom:8 }}>● REAL — datos FMP</div>
                                <div style={{ fontFamily:"'Orbitron',monospace", fontSize:"2.8rem", fontWeight:900, color:bColor(realScore) }}>{realScore}</div>
                                <div style={{ fontFamily:"monospace", fontSize:".78rem", color:bColor(realScore), marginTop:4 }}>GRADO {bGrade(realScore)}</div>
                              </div>
                            </div>
                            <div style={{ marginTop:12, padding:"8px 12px", background:bg3, borderRadius:4, fontFamily:"monospace", fontSize:".62rem", color:"var(--eq-gray)", lineHeight:1.6 }}>
                              <strong style={{ color:"var(--eq-white)" }}>EPS CAGR real (5yr):</strong>{" "}
                              <span style={{ color:epsCagr>=0?"var(--eq-green)":"var(--eq-red)", fontWeight:700 }}>{epsCagr>=0?"+":""}{epsCagr}%</span>
                              {" "}· usado en criterio "Crecimiento EPS" del score.{" "}
                              {realScore !== staticScore
                                ? <span>Diferencia con estimado: <span style={{ color:realScore>staticScore?"var(--eq-green)":"var(--eq-red)", fontWeight:700 }}>{realScore>staticScore?"+":""}{realScore-staticScore} pts</span></span>
                                : <span style={{ color:"var(--eq-gray)" }}>Score coincide con el estimado.</span>
                              }
                            </div>
                          </div>
                        )}

                        {/* R&D Analysis */}
                        <div style={{ background:panel, border:`1px solid ${border}`, borderRadius:6, overflow:"hidden", marginBottom:14 }}>
                          <div style={{ padding:"10px 16px", borderBottom:`1px solid ${border}`, fontFamily:"'Orbitron',monospace", fontSize:".65rem", fontWeight:700, color:"var(--eq-purple)", letterSpacing:".15em" }}>
                            🔬 ANÁLISIS I+D — MOAT TECNOLÓGICO
                          </div>
                          <div style={{ padding:"12px 16px", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                            {[
                              { icon:"💡", title:"R&D COMO % DE INGRESOS", desc:`${fmpSymbol} invierte el ${sorted[sorted.length-1].revenue>0?((sorted[sorted.length-1].researchAndDevelopmentExpenses/sorted[sorted.length-1].revenue)*100).toFixed(1):"-"}% de sus ingresos en I+D. Empresas que reinvierten consistentemente en innovación construyen ventajas competitivas difíciles de replicar (moat tecnológico).` },
                              { icon:"📈", title:"TENDENCIA DE MÁRGENES", desc:`Margen bruto ${grossMg}% (${pGrossMg>0?`prev ${pGrossMg}%`:"-"}). Un margen bruto expansivo revela pricing power y eficiencia operativa — señales clave en el análisis Buffett/Graham de calidad de negocio.` },
                              { icon:"🏰", title:"CALIDAD DE EARNINGS", desc:`EPS CAGR ${epsCagr>=0?"+":""}${epsCagr}% en 5 años. El crecimiento consistente de EPS es el indicador más utilizado por value investors para medir la calidad y durabilidad del modelo de negocio.` },
                            ].map(c => (
                              <div key={c.title} className="analysis-card">
                                <div className="ac-title">{c.icon} {c.title}</div>
                                <div className="ac-body">{c.desc}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            );
          })()}

          <div className="eq-footer">PSYCHOMETRIKS EQUITIES v2.0 — DATA SIMULADA PARA FINES EDUCATIVOS — NO ES ASESORÍA FINANCIERA — YO NO PREDIGO — YO LEO LA DATA</div>
        </div>
      </div>
    </>
  );
}
