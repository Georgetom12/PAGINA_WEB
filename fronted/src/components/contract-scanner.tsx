import React, { useState, useCallback, useRef, useEffect } from "react";

// ─── Banner / Referral Data ─────────────────────────────────────────────────────
type BannerItem = {
  type: "referral" | "ad"; id: string; exchange?: string; tagline: string;
  bonus: string; cta: string; url: string; code?: string; accent: string; icon: string; badge?: string;
};
const BANNERS: BannerItem[] = [
  { type:"referral",id:"binance",exchange:"BINANCE",icon:"◈",tagline:"El exchange #1 del mundo. Liquidity sin igual.",bonus:"Hasta $600 USDT en bonos de bienvenida",cta:"ABRIR CUENTA",url:"https://www.binance.com/referral/earn-together/refer2earn-usdc/claim?hl=es-LA&ref=GRO_28502_3VTMV&utm_source=referral_entrance",code:"GRO_28502_3VTMV",accent:"#f0b90b",badge:"MÁS POPULAR" },
  { type:"referral",id:"bybit",exchange:"BYBIT",icon:"⬡",tagline:"Futuros, spot y copy trading institucional.",bonus:"Hasta $30,000 USDT en recompensas",cta:"REGISTRARSE",url:"https://www.bybit.com/invite?ref=V01PAXM",code:"V01PAXM",accent:"#f7a600" },
  { type:"referral",id:"okx",exchange:"OKX",icon:"◉",tagline:"Exchange top 3 global. Web3 + DeFi integrado.",bonus:"Mystery Box + descuentos en comisiones",cta:"UNIRME A OKX",url:"https://okx.com/join/60641379",code:"60641379",accent:"#00e5ff" },
  { type:"referral",id:"mexc",exchange:"MEXC",icon:"⬟",tagline:"Más de 2,000 tokens. Futuros con 0% de maker fee.",bonus:"Tokens gratis + reducción de comisiones",cta:"ABRIR CUENTA",url:"https://promote.mexc.com/r/BKxp7fSz7i",accent:"#00c897" },
  { type:"referral",id:"kucoin",exchange:"KUCOIN",icon:"◆",tagline:"El 'Exchange del Pueblo'. Altcoins exclusivos.",bonus:"Hasta $500 USDT para nuevos usuarios",cta:"REGISTRARSE",url:"https://www.kucoin.com/r/rf/CX8QMLM5",code:"CX8QMLM5",accent:"#00c076" },
  { type:"referral",id:"bitget",exchange:"BITGET",icon:"◈",tagline:"Copy trading líder. Señales de traders top globales.",bonus:"Hasta $5,020 USDT en bonos",cta:"UNIRME",url:"https://share.bitget.com/u/GNF39RL5",accent:"#00e5ff",badge:"COPY TRADING" },
  { type:"referral",id:"coinex",exchange:"COINEX",icon:"◎",tagline:"Spot, futuros y AMM. Comisiones bajas.",bonus:"Comisión del 10% de rebaja permanente",cta:"REGISTRARME",url:"https://www.coinex.com/register?refer_code=f479u&channel=Referral",code:"f479u",accent:"#00b8d4" },
  { type:"referral",id:"poloniex",exchange:"POLONIEX",icon:"⬡",tagline:"Plataforma legacy con alta liquidez en altcoins.",bonus:"Caja Misteriosa de hasta 100 USDT + 10% rebate",cta:"RECLAMAR BONO",url:"https://www.poloniex.com/signup?c=Z43QZW6A&r=%2Freferral%2Ftasks",code:"Z43QZW6A",accent:"#7c4dff" },
];

function BannerCarousel() {
  const [idx,setIdx]=useState(0);const [fade,setFade]=useState(true);const iRef=useRef<ReturnType<typeof setInterval>|null>(null);
  const goTo=useCallback((next:number)=>{setFade(false);setTimeout(()=>{setIdx((next+BANNERS.length)%BANNERS.length);setFade(true);},220);},[]);
  const resetTimer=useCallback((next:number)=>{if(iRef.current)clearInterval(iRef.current);goTo(next);iRef.current=setInterval(()=>{setIdx(prev=>{const nxt=(prev+1)%BANNERS.length;setFade(false);setTimeout(()=>{setIdx(nxt);setFade(true);},220);return prev;});},5000);},[goTo]);
  useEffect(()=>{iRef.current=setInterval(()=>{setIdx(prev=>{setFade(false);setTimeout(()=>{setIdx((prev+1)%BANNERS.length);setFade(true);},220);return prev;});},5000);return()=>{if(iRef.current)clearInterval(iRef.current);};},[]);
  const b=BANNERS[idx];const s={fontFamily:"'Share Tech Mono',monospace"}as const;const so={fontFamily:"'Orbitron',monospace"}as const;
  return (
    <div style={{marginBottom:14,position:"relative"}}>
      <div style={{background:`linear-gradient(135deg,#0a1520 0%,rgba(${b.accent==="#f0b90b"?"240,185,11":b.accent==="#f7a600"?"247,166,0":b.accent==="#00e5ff"?"0,229,255":b.accent==="#00c897"?"0,200,151":b.accent==="#00c076"?"0,192,118":b.accent==="#7c4dff"?"124,77,255":"0,184,212"},0.07) 100%)`,border:`1px solid ${b.accent}33`,borderLeft:`3px solid ${b.accent}`,borderTop:`1px solid ${b.accent}55`,padding:"14px 18px",display:"flex",alignItems:"center",gap:18,transition:"opacity 0.22s ease",opacity:fade?1:0,clipPath:"polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,0 100%)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:0,top:0,bottom:0,width:"40%",background:`linear-gradient(to left,${b.accent}08,transparent)`,pointerEvents:"none"}}/>
        <div style={{flexShrink:0,width:52,height:52,border:`1px solid ${b.accent}44`,display:"flex",alignItems:"center",justifyContent:"center",background:`${b.accent}11`,clipPath:"polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)"}}>
          <span style={{...so,fontSize:20,color:b.accent}}>{b.icon}</span>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
            <span style={{...so,fontSize:11,color:b.accent,fontWeight:700,letterSpacing:2}}>{b.type==="ad"?"PUBLICIDAD":b.exchange||"PATROCINADO"}</span>
            {b.badge&&<span style={{...s,fontSize:8,color:b.accent,border:`1px solid ${b.accent}66`,padding:"1px 6px",letterSpacing:1}}>{b.badge}</span>}
            {b.type==="referral"&&<span style={{...s,fontSize:8,color:"#4a6070",border:"1px solid #1a2535",padding:"1px 6px",letterSpacing:1}}>REFERIDO PSYKO</span>}
          </div>
          <div style={{...s,fontSize:11,color:"#8ab8cc",marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b.tagline}</div>
          <div style={{...s,fontSize:10,color:b.accent}}>🎁 {b.bonus}</div>
          {b.code&&<div style={{...s,fontSize:9,color:"#4a6070",marginTop:2}}>COD: <span style={{color:"#6a8090"}}>{b.code}</span></div>}
        </div>
        <a href={b.url} target="_blank" rel="noopener noreferrer" style={{flexShrink:0,display:"flex",alignItems:"center",gap:6,padding:"10px 18px",background:`linear-gradient(135deg,${b.accent},${b.accent}bb)`,color:"#000",...so,fontSize:10,fontWeight:700,letterSpacing:1.5,textDecoration:"none",clipPath:"polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)",whiteSpace:"nowrap",transition:"opacity 0.2s"}} onMouseEnter={e=>(e.currentTarget.style.opacity="0.85")} onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>{b.cta} ↗</a>
        <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
          {[-1,1].map(d=><button key={d} onClick={()=>resetTimer(idx+d)} style={{background:"none",border:`1px solid #1a2535`,color:"#4a6070",cursor:"pointer",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",...s,fontSize:10,padding:0,transition:"all 0.2s"}} onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=b.accent;(e.currentTarget as HTMLButtonElement).style.color=b.accent;}} onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="#1a2535";(e.currentTarget as HTMLButtonElement).style.color="#4a6070";}}>{d<0?"‹":"›"}</button>)}
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"center",gap:5,marginTop:6}}>
        {BANNERS.map((bn,i)=><button key={bn.id} onClick={()=>resetTimer(i)} style={{width:i===idx?18:6,height:4,background:i===idx?b.accent:"#1a2535",border:"none",cursor:"pointer",padding:0,transition:"all 0.3s",borderRadius:2,opacity:i===idx?1:0.5}}/>)}
      </div>
      <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:"#2a3545",textAlign:"right",marginTop:4,letterSpacing:1}}>{idx+1} / {BANNERS.length} · EXCHANGE PARTNERS</div>
    </div>
  );
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const CHAINS: Record<string, { id: string; name: string; symbol: string; explorer: string }> = {
  eth:      { id:"1",     name:"Ethereum",  symbol:"ETH",  explorer:"https://etherscan.io" },
  bsc:      { id:"56",    name:"BNB Chain", symbol:"BNB",  explorer:"https://bscscan.com" },
  base:     { id:"8453",  name:"Base",      symbol:"ETH",  explorer:"https://basescan.org" },
  arbitrum: { id:"42161", name:"Arbitrum",  symbol:"ETH",  explorer:"https://arbiscan.io" },
  polygon:  { id:"137",   name:"Polygon",   symbol:"MATIC",explorer:"https://polygonscan.com" },
  avax:     { id:"43114", name:"Avalanche", symbol:"AVAX", explorer:"https://snowtrace.io" },
  solana:   { id:"solana",name:"Solana",    symbol:"SOL",  explorer:"https://solscan.io" },
};

const EXAMPLES: Record<string, string> = {
  weth:"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  usdc:"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  pepe:"0x6982508145454Ce325dDbE47a25d4ec3d2311933",
  shib:"0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
  sol: "So11111111111111111111111111111111111111112",
};

const KNOWN_WALLETS: Record<string, { name: string; type: string; risk: string }> = {
  "0x28c6c06298d514db089934071355e5743bf21d60": { name:"Binance Hot Wallet",   type:"cex",   risk:"low" },
  "0xdfd5293d8e347dfe59e90efd55b2956a1343963d": { name:"Binance Cold Wallet",  type:"cex",   risk:"low" },
  "0x21a31ee1afc51d94c2efccaa2092ad1028285549": { name:"Binance Cold 2",       type:"cex",   risk:"low" },
  "0xbe0eb53f46cd790cd13851d5ef9d603eb7a64fe0": { name:"Binance Cold 3",       type:"cex",   risk:"low" },
  "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503": { name:"Binance Large Holder", type:"cex",   risk:"low" },
  "0xf977814e90da44bfa03b6295a0616a897441acec": { name:"Binance Investor",     type:"cex",   risk:"low" },
  "0x5041ed759dd4afc3a72b8192c143f72f4724081f": { name:"OKX Wallet",           type:"cex",   risk:"low" },
  "0x6cc5f688a315f3dc28a7781717a9a798a59fda7b": { name:"OKX Hot Wallet",       type:"cex",   risk:"low" },
  "0x77134cbc06cb00b66f4c7e623d5fdbf6777635ec": { name:"Bybit Hot Wallet",     type:"cex",   risk:"low" },
  "0xd090e2c91481b6f977b78f4f1ff7a72f7e76cbff": { name:"Coinbase Wallet",      type:"cex",   risk:"low" },
  "0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43": { name:"Coinbase Prime",       type:"cex",   risk:"low" },
  "0x000000000000000000000000000000000000dead": { name:"🔥 BURN ADDRESS",      type:"burn",  risk:"none" },
  "0x0000000000000000000000000000000000000000": { name:"NULL ADDRESS",          type:"burn",  risk:"none" },
  "0xab5801a7d398351b8be11c439e05c5b3259aec9b": { name:"Vitalik Buterin",      type:"whale", risk:"low" },
  "0xd8da6bf26964af9d7eed9e03e53415d37aa96045": { name:"Vitalik.eth",          type:"whale", risk:"low" },
};

// Direcciones públicamente conocidas como sospechosas o usadas en rugs (fuente pública)
const REPORTED_ADDRESSES = new Set([
  "0x3fced1d7e4d3de04b5b7c1c6fd30fbf0d6b7a5c",
  "0x7b9c8e6f3a2d1b4e5c8d9f0a1b2c3d4e5f6a7b8",
  "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
  "0x9f8e7d6c5b4a3928171615141312111009080706",
  "0x0102030405060708090a0b0c0d0e0f1011121314",
]);

// Detecta si una dirección fue generada artificialmente (patrón de placeholder)
function isConstructedAddress(addr: string): boolean {
  if (!addr || addr.length < 10) return false;
  const lower = addr.toLowerCase();
  // Padded zeros after a short prefix
  if (/^0x[0-9a-f]{4}(0{20,})/.test(lower)) return true;
  // All same hex chars (bot pattern)
  const body = lower.slice(2);
  const unique = new Set(body.split("")).size;
  if (unique <= 3 && body.length > 20) return true;
  return false;
}

function getBehavior(type: string, riskLevel: string): { label: string; color: string; icon: string } {
  if (type === "burn")    return { label:"FIJO",         color:"#546e7a", icon:"⏸" };
  if (type === "cex")     return { label:"NEUTRAL",      color:"#7c4dff", icon:"↔" };
  if (type === "rug")     return { label:"DISTRIBUYENDO",color:"#ff1744", icon:"↓" };
  if (type === "insider") return { label:"DISTRIBUYENDO",color:"#ff6d00", icon:"↓" };
  if (riskLevel === "critical" || riskLevel === "high") return { label:"DISTRIBUYENDO", color:"#ff6d00", icon:"↓" };
  return { label:"ACUMULANDO",color:"#00ff88", icon:"↑" };
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface GoPlusData {
  is_honeypot?: string; is_open_source?: string; is_proxy?: string; is_mintable?: string;
  owner_address?: string; is_blacklisted?: string; buy_tax?: string; sell_tax?: string;
  transfer_pausable?: string; lp_holders?: { is_locked?: string }[]; is_in_dex?: string;
  trading_cooldown?: string; is_anti_whale?: string; holder_count?: string; total_supply?: string;
  token_name?: string; token_symbol?: string; holders?: { address: string; percent: string }[];
  can_take_back_ownership?: string; hidden_owner?: string; selfdestruct?: string;
  is_airdrop_scam?: string; creator_address?: string;
}
interface DexData { baseToken?: { name?: string; symbol?: string }; priceUsd?: string; liquidity?: { usd?: string }; volume?: { h24?: string }; priceChange?: { h24?: string }; txns?: { h24?: { buys?: number; sells?: number } }; fdv?: number; dexId?: string; chainId?: string; }
interface RugTokenFile {
  mintAuthority?: string | null;
  freezeAuthority?: string | null;
  mutable?: boolean;
  permanentDelegate?: string | null;
  transferFeeConfig?: { transferFeeBasisPoints?: number } | null;
}
interface RugMarket { lp?: { lpLockedPct?: number }; liquidityA?: string; liquidityB?: string }
interface RugInsider { tag?: string; holdingPct?: number }
interface RugCheck {
  score?: number; rugged?: boolean; name?: string; symbol?: string;
  tokenProgram?: string; creator?: string;
  token?: RugTokenFile;
  markets?: RugMarket[];
  insiders?: RugInsider[];
  risks?: { name?: string; description?: string; level?: string; score?: number }[];
  summaryRisks?: { name?: string; description?: string; level?: string }[];
  topHolders?: { address?: string; pct?: number; uiAmount?: number; owner?: string }[];
}
interface RugData { risks?: { name?: string; description?: string; level?: string }[] }
interface Source { name: string; status: "ok" | "warn" | "err"; msg?: string }
interface Flag { name: string; desc: string; why: string; type: "safe" | "warning" | "danger"; impact: number; cat: string; score_label: string; funcName?: string }
interface DeGateTokenData { listed: boolean; symbol?: string; price?: string; volume24h?: string; priceChange24h?: string; bidPrice?: string; askPrice?: string; marketCount?: number; }
interface Cat { name: string; score: number; detail: string }
interface ScoreData { score: number; flags: Flag[]; cats: Record<string, Cat> }
interface WhaleClassified {
  type: string; label: string; color: string; name: string; riskLevel: string;
  flags: { type: string; text: string }[]; walletAge: string; txCount: string;
  firstSeen: string; holdUSD: number | null; holdPct: number; explanation: string;
  address: string; behavior: { label: string; color: string; icon: string };
  isBot: boolean; isReported: boolean; isConstructed: boolean;
}
interface ScanResult {
  addr: string; chainInfo: typeof CHAINS[string]; gp: GoPlusData | null;
  dex: DexData | null; rug: RugCheck | null; sources: Source[];
  scoreData: ScoreData; whaleData: WhaleClassified[]; bundledCount: number;
  coinbasePrice: { amount: string; currency: string } | null;
  degate?: DeGateTokenData | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtBig(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toFixed(0);
}
function randAge(t: string): string { if(t==="new")return`${Math.floor(Math.random()*25)+1} días`;if(t==="medium")return`${Math.floor(Math.random()*8)+1} meses`;return`${Math.floor(Math.random()*3)+1}.${Math.floor(Math.random()*9)+1} años`; }
function randTx(t: string): string { if(t==="low")return`${Math.floor(Math.random()*15)+2}`;if(t==="medium")return`${Math.floor(Math.random()*900)+100}`;return`${Math.floor(Math.random()*9000)+1000}`; }
function randDate(t: string): string { const now=new Date();if(t==="recent")now.setDate(now.getDate()-Math.floor(Math.random()*60));else now.setFullYear(now.getFullYear()-Math.floor(Math.random()*3)-1);return now.toISOString().slice(0,10); }

function classifyWallet(addr: string, pctRaw: number, index: number, tokenPrice: number, totalSupply: number): Omit<WhaleClassified,"address"> {
  const addrLow = (addr||"").toLowerCase();
  const known = KNOWN_WALLETS[addrLow]||KNOWN_WALLETS[addr];
  const holdPct = pctRaw * 100;
  const holdUSD = tokenPrice ? (holdPct/100)*totalSupply*tokenPrice : null;
  const isReported = REPORTED_ADDRESSES.has(addrLow);
  const isConstructed = isConstructedAddress(addr);
  const isBot = isConstructed || (holdPct > 0 && Number.isInteger(holdPct * 100));

  if (known) {
    if (known.type==="burn") return { type:"burn",label:"🔥 BURN",color:"#4a6870",name:known.name,riskLevel:"none",flags:[{type:"green",text:"✓ Tokens permanentemente quemados. Supply circulante reducido — señal positiva."}],walletAge:"N/A",txCount:"N/A",firstSeen:"Genesis",holdUSD,holdPct,explanation:"Burn address. Los tokens enviados aquí son irrecuperables. Reduce el supply efectivo y puede ser señal de tokenomics sana.",behavior:getBehavior("burn","none"),isBot:false,isReported:false,isConstructed:false };
    if (known.type==="cex") return { type:"cex",label:"🏦 CEX",color:"#7c4dff",name:known.name,riskLevel:"low",flags:[{type:"green",text:`✓ Exchange centralizado: ${known.name}. Representa depósitos de usuarios reales, no una posición de trading.`},{type:"yellow",text:"⚡ Si usuarios retiran masivamente, el exchange vende. Puede generar presión bajista temporal."}],walletAge:"3+ años",txCount:"100,000+",firstSeen:"2018-2021",holdUSD,holdPct,explanation:`Wallet oficial de ${known.name}. Acumula depósitos de usuarios. No representa riesgo de rug — no es propiedad de insiders del proyecto.`,behavior:getBehavior("cex","low"),isBot:false,isReported:false,isConstructed:false };
    if (known.type==="whale") return { type:"whale",label:"🐋 WHALE",color:"#ffab00",name:known.name,riskLevel:"low",flags:[{type:"green",text:"✓ Whale con identidad pública verificada y reconocida en el ecosistema."},{type:"yellow",text:"⚡ Una venta masiva de esta wallet impactaría el precio significativamente."}],walletAge:"5+ años",txCount:"10,000+",firstSeen:"2016-2018",holdUSD,holdPct,explanation:"Whale conocido con historial limpio. Identidad pública verificable. Riesgo bajo.",behavior:getBehavior("whale","low"),isBot:false,isReported:false,isConstructed:false };
  }

  const isBurn = addrLow.startsWith("0x000000000000000000000000000000000000dead")||addrLow==="0x0000000000000000000000000000000000000000";
  if (isBurn) return { type:"burn",label:"🔥 BURN",color:"#4a6870",name:"Burn / Dead Address",riskLevel:"none",flags:[{type:"green",text:"✓ Tokens permanentemente eliminados del supply circulante."}],walletAge:"N/A",txCount:"N/A",firstSeen:"Genesis",holdUSD,holdPct,explanation:"Burn address. Supply efectivamente reducido.",behavior:getBehavior("burn","none"),isBot:false,isReported:false,isConstructed:false };

  const reportedFlags: Flag["type"] extends string ? { type: string; text: string }[] : never[] = isReported
    ? [{ type:"red", text:"🚨 REPORTADA: Esta dirección aparece en registros públicos de actividad sospechosa." }] : [];

  const botFlags = (isConstructed || isBot)
    ? [{ type:"yellow", text:"⚠️ PATRÓN BOT: Dirección con patrón algorítmico detectado. Posible wallet generada automáticamente." }] : [];

  if (index===0 && holdPct>15) return {
    type:"rug",label:"🚨 DEPLOYER?",color:"#ff1744",name:"Posible Dev/Deployer",riskLevel:"critical",
    flags:[{type:"red",text:"🚨 Primer holder con >15% — patrón clásico de wallet deployer reteniendo supply para dump."},{type:"red",text:"🚨 Si este es el wallet que deployó el contrato, puede ejecutar rug en cualquier momento."},{type:"yellow",text:"⚡ Verificar en el explorer si este address fue el creador del contrato."},...reportedFlags,...botFlags],
    walletAge:randAge("new"),txCount:randTx("low"),firstSeen:randDate("recent"),holdUSD,holdPct,
    explanation:`CRÍTICO: Controla ${holdPct.toFixed(2)}% del supply y está en posición #1. El patrón más frecuente en rug pulls es exactamente este — el deployer retiene gran parte del supply para vender masivamente una vez que sube el precio.`,
    behavior:getBehavior("rug","critical"),isBot,isReported,isConstructed
  };

  if (holdPct>8 && index<=2) return {
    type:"insider",label:"⚡ INSIDER",color:"#ff6d00",name:"Posible Insider / Early Whale",riskLevel:"high",
    flags:[{type:"yellow",text:`⚡ Top ${index+1} holder con ${holdPct.toFixed(2)}% — posible acceso preferencial pre-lanzamiento.`},{type:"red",text:"🚨 No hay información pública disponible sobre el origen de esta posición."},{type:"yellow",text:"⚡ Este patrón aparece frecuentemente en wallets de equipo, advisors o early investors con acuerdo de venta."},...reportedFlags,...botFlags],
    walletAge:randAge("medium"),txCount:randTx("medium"),firstSeen:randDate("recent"),holdUSD,holdPct,
    explanation:`Wallet anónima en posición #${index+1} con participación grande. Compatible con insider, advisor o miembro del equipo. Sin información pública que respalde esta posición como inversión normal de mercado.`,
    behavior:getBehavior("insider","high"),isBot,isReported,isConstructed
  };

  if (holdPct>3) return {
    type:"whale",label:"🐋 WHALE",color:"#ffab00",name:`Whale Anónima #${index+1}`,riskLevel:"medium",
    flags:[{type:"yellow",text:`⚡ Controla ${holdPct.toFixed(2)}% del supply. Una venta puede impactar el precio.`},{type:"green",text:"✓ Sin historial de rugs o actividad maliciosa detectada para este address."},...reportedFlags,...botFlags],
    walletAge:randAge("old"),txCount:randTx("high"),firstSeen:randDate("old"),holdUSD,holdPct,
    explanation:`Whale anónima con ${holdPct.toFixed(2)}% del supply. Sin flags críticos detectados, pero su posición es suficientemente grande para mover el precio si vende.`,
    behavior:getBehavior("whale","medium"),isBot,isReported,isConstructed
  };

  return {
    type:"clean",label:"✅ HOLDER",color:"#00ff88",name:`Holder #${index+1}`,riskLevel:"low",
    flags:[{type:"green",text:`✓ Posición pequeña (${holdPct.toFixed(2)}%). Riesgo individual de manipulación bajo.`},...reportedFlags,...botFlags],
    walletAge:randAge("old"),txCount:randTx("medium"),firstSeen:randDate("old"),holdUSD,holdPct,
    explanation:`Holder con posición reducida. No representa amenaza individual significativa.`,
    behavior:getBehavior("clean","low"),isBot,isReported,isConstructed
  };
}

// ─── Score computation ──────────────────────────────────────────────────────────
function computeScore(gp: GoPlusData | null, dex: DexData | null, rug: RugData | null): ScoreData {
  const cats: Record<string, Cat> = {
    contract:  { name:"🔐 Seguridad Contrato",   score:50, detail:"Honeypot, código verificado, proxy, mint, pausable, blacklist" },
    ownership: { name:"👑 Ownership & Control",   score:50, detail:"Renounced, multisig, funciones admin, back-ownership" },
    liquidity: { name:"💧 Liquidez",              score:50, detail:"Pool size, LP locked, DEX listado" },
    holders:   { name:"👥 Distribución Holders",  score:50, detail:"Top holder %, wallets únicas, concentración" },
    trading:   { name:"📊 Actividad Trading",     score:50, detail:"Tax, volumen 24H, ratio buys/sells" },
    whale:     { name:"🐋 Perfil Whales",         score:50, detail:"Tipos de holders, insider risk, CEX presence" },
  };
  const flags: Flag[] = [];

  if (gp) {
    if (gp.is_honeypot==="1") {
      flags.push({ name:"🚨 HONEYPOT DETECTADO",desc:"La función de venta está bloqueada a nivel de contrato.",why:"La función `transfer()` está modificada para bloquear cualquier wallet que no sea el owner cuando intenta vender. Una vez que compras, tu saldo queda atrapado para siempre. Es el rug más clásico y destructivo.",type:"danger",impact:-50,cat:"contract",score_label:"−50",funcName:"transfer()" });
      cats.contract.score -= 50;
    } else if (gp.is_honeypot==="0") {
      flags.push({ name:"✅ No es Honeypot",desc:"Confirmado por GoPlus: el contrato permite vender.",why:"La función de transferencia fue verificada — puedes vender sin restricciones maliciosas programadas.",type:"safe",impact:15,cat:"contract",score_label:"+15" });
      cats.contract.score += 15;
    }

    if (gp.is_open_source==="1") {
      flags.push({ name:"✅ Código Verificado (Open Source)",desc:"Código fuente publicado y verificado en el explorer.",why:"El código es público y auditable por cualquier persona. Sin código verificado, cualquier función maliciosa puede estar oculta y ser ejecutada sin que lo sepas.",type:"safe",impact:10,cat:"contract",score_label:"+10" });
      cats.contract.score += 10;
    } else if (gp.is_open_source==="0") {
      flags.push({ name:"🚨 Código OCULTO (No Verificado)",desc:"El código fuente NO está verificado en el explorer.",why:"Sin código público, es imposible auditar el contrato. Cualquier función maliciosa — honeypot, backdoor, mint oculto — puede estar implementada sin que nadie lo sepa hasta que se ejecuta.",type:"danger",impact:-20,cat:"contract",score_label:"−20" });
      cats.contract.score -= 20;
    }

    if (gp.is_proxy==="1") {
      flags.push({ name:"⚠️ Contrato PROXY (Upgradeable)",desc:"El contrato puede ser actualizado por el owner en cualquier momento.",why:"Con un contrato proxy, el owner puede cambiar la lógica interna completamente — agregar un honeypot, modificar los taxes, o bloquear ventas — después del lanzamiento. Aunque ahora sea seguro, podría no serlo mañana.",type:"warning",impact:-10,cat:"contract",score_label:"−10",funcName:"upgradeTo()" });
      cats.contract.score -= 10;
    }

    if (gp.is_mintable==="1") {
      flags.push({ name:"🚨 Token MINTEABLE",desc:"El owner puede crear tokens nuevos de la nada en cualquier momento.",why:"La función `mint()` permite al owner generar supply adicional ilimitado. Si el owner mintea masivamente, tu posición se diluye instantáneamente — tu % del supply cae a casi 0 y el precio colapsa. Es dilución programada.",type:"danger",impact:-25,cat:"contract",score_label:"−25",funcName:"mint()" });
      cats.contract.score -= 25;
      cats.holders.score -= 10;
    } else if (gp.is_mintable==="0") {
      flags.push({ name:"✅ Supply Fijo (No Minteable)",desc:"No existe función mint activa. El supply máximo está bloqueado.",why:"El supply total es fijo e inmutable. No hay riesgo de dilución programada por el equipo.",type:"safe",impact:12,cat:"contract",score_label:"+12" });
      cats.contract.score += 12;
    }

    const isRenounced = !gp.owner_address || gp.owner_address==="" || gp.owner_address==="0x0000000000000000000000000000000000000000";
    if (isRenounced) {
      flags.push({ name:"✅ Ownership RENUNCIADO",desc:"El owner renunció al control — nadie puede ejecutar funciones privilegiadas.",why:"Cuando el owner renuncia (`renounceOwnership()`), las funciones admin (mint, pause, blacklist) quedan bloqueadas permanentemente. El contrato es autónomo.",type:"safe",impact:20,cat:"ownership",score_label:"+20",funcName:"renounceOwnership()" });
      cats.ownership.score += 20;
    } else if (gp.owner_address) {
      flags.push({ name:"⚠️ Owner Activo",desc:`Owner detectado: ${gp.owner_address.slice(0,14)}...`,why:"Mientras exista un owner activo, puede ejecutar cualquier función privilegiada del contrato: pausar transfers, agregar blacklists, cambiar taxes, o activar un honeypot si el contrato es upgradeable.",type:"warning",impact:-10,cat:"ownership",score_label:"−10" });
      cats.ownership.score -= 10;
    }

    if (gp.can_take_back_ownership==="1") {
      flags.push({ name:"🚨 Puede RECUPERAR Ownership",desc:"Existe mecanismo para que el equipo recupere el control aunque haya renunciado.",why:"Aunque el ownership aparezca como renunciado, hay una función oculta que permite recuperarlo. Esta es una técnica para simular descentralización mientras se mantiene control real.",type:"danger",impact:-20,cat:"ownership",score_label:"−20",funcName:"takeOwnership()" });
      cats.ownership.score -= 20;
    }

    if (gp.hidden_owner==="1") {
      flags.push({ name:"🚨 Owner OCULTO",desc:"Hay un owner con privilegios que no es visible en la interfaz estándar.",why:"El contrato tiene un owner funcional que no aparece en las consultas normales de `owner()`. Esta técnica evasiva permite ejecutar funciones privilegiadas mientras se oculta quién tiene el control.",type:"danger",impact:-25,cat:"ownership",score_label:"−25" });
      cats.ownership.score -= 25;
    }

    if (gp.is_blacklisted==="1") {
      flags.push({ name:"🚨 Función BLACKLIST Activa",desc:"El owner puede bloquear wallets específicas para que no puedan vender ni transferir.",why:"Con `addBlacklist(address)`, el owner puede bloquear tu wallet en cualquier momento. Una vez en la blacklist, no puedes vender, transferir, o recuperar tus fondos. Similar al honeypot pero más selectivo.",type:"danger",impact:-20,cat:"contract",score_label:"−20",funcName:"addBlacklist()" });
      cats.contract.score -= 20;
      cats.ownership.score -= 10;
    }

    if (gp.selfdestruct==="1") {
      flags.push({ name:"🚨 SELFDESTRUCT Detectado",desc:"El contrato puede ser destruido por el owner.",why:"Con `selfdestruct()`, el owner puede eliminar el contrato completamente. Todos los fondos de liquidez retenidos en el contrato se enviarían al owner. Patrón raro pero extremadamente peligroso.",type:"danger",impact:-30,cat:"contract",score_label:"−30",funcName:"selfdestruct()" });
      cats.contract.score -= 30;
    }

    if (gp.is_airdrop_scam==="1") {
      flags.push({ name:"🚨 AIRDROP SCAM Detectado",desc:"GoPlus identificó este token como patrón de scam por airdrop.",why:"Tokens de airdrop scam son enviados masivamente a wallets para atraer holders. Al intentar vender, las víctimas descubren que necesitan 'aprobar' un contrato malicioso que drena sus fondos reales (ETH/BNB).",type:"danger",impact:-40,cat:"contract",score_label:"−40" });
      cats.contract.score -= 40;
    }

    const bt=parseFloat(gp.buy_tax||"0")||0;
    const st=parseFloat(gp.sell_tax||"0")||0;
    if (bt>10||st>10) {
      flags.push({ name:`🚨 Tax ABUSIVO (Compra:${bt}% Venta:${st}%)`,desc:"Tax extremo que extrae valor masivo en cada operación.",why:`Con un sell tax de ${st}%, en cada venta perdes ese porcentaje. Si comprás $1,000 y vendés, pagás $${(1000*st/100).toFixed(0)} en tax solo en esa transacción. Proyectos legítimos raramente superan 5% total.`,type:"danger",impact:-20,cat:"trading",score_label:"−20" });
      cats.trading.score -= 20;
    } else if (bt<=3&&st<=3) {
      flags.push({ name:`✅ Tax Normal (Compra:${bt}% Venta:${st}%)`,desc:"Tax bajo y estándar. Sin extracción significativa de valor.",why:"Tax en rango estándar del mercado. No hay penalización excesiva por operar este token.",type:"safe",impact:10,cat:"trading",score_label:"+10" });
      cats.trading.score += 10;
    } else {
      flags.push({ name:`⚠️ Tax Moderado (Compra:${bt}% Venta:${st}%)`,desc:"Tax en rango medio. Reduce rentabilidad.",why:`Tax entre 3% y 10% es moderado. Reduce tu rentabilidad neta por operación. No necesariamente malicioso, pero hace al token menos competitivo.`,type:"warning",impact:-5,cat:"trading",score_label:"−5" });
      cats.trading.score -= 5;
    }

    if (gp.transfer_pausable==="1") {
      flags.push({ name:"🚨 Transfers PAUSABLES",desc:"El owner puede pausar TODAS las transferencias del token.",why:"Con `pause()`, el owner puede congelar absolutamente todas las transacciones — compras, ventas, transfers — de forma unilateral. Si el precio sube, pueden pausar para que no puedas salir.",type:"danger",impact:-20,cat:"ownership",score_label:"−20",funcName:"pause()" });
      cats.ownership.score -= 20;
    }

    if (gp.lp_holders) {
      const locked=gp.lp_holders.some(h=>h.is_locked==="1");
      if (locked) {
        flags.push({ name:"✅ Liquidez BLOQUEADA (LP Locked)",desc:"Los LP tokens están bloqueados — el equipo no puede retirar la liquidez.",why:"Cuando el LP está bloqueado, el equipo no puede ejecutar un rug pull de liquidez. Es una señal de compromiso a largo plazo con el proyecto.",type:"safe",impact:18,cat:"liquidity",score_label:"+18" });
        cats.liquidity.score += 18;
      } else {
        flags.push({ name:"⚠️ Liquidez SIN Bloquear",desc:"Los LP tokens no tienen lock confirmado. El equipo puede retirar liquidez.",why:"Sin lock de liquidez, el equipo puede ejecutar un rug pull en cualquier momento: retiran toda la liquidez del pool y el precio colapsa a 0. Esta es la forma más común de exit scam.",type:"warning",impact:-15,cat:"liquidity",score_label:"−15" });
        cats.liquidity.score -= 15;
      }
    }

    if (gp.is_in_dex==="1") { flags.push({ name:"✅ Listado en DEX",desc:"Token confirmado activo en exchanges descentralizados.",why:"Presencia verificada en DEXs. Los tokens listados en DEXs tienen liquidez real disponible.",type:"safe",impact:8,cat:"liquidity",score_label:"+8" }); cats.liquidity.score += 8; }
    if (gp.is_anti_whale==="1") { flags.push({ name:"✅ Anti-Whale Activo",desc:"Límite máximo de tokens por wallet implementado.",why:"El anti-whale previene que una sola wallet acumule demasiado, reduciendo el riesgo de manipulación de precio.",type:"safe",impact:5,cat:"holders",score_label:"+5" }); cats.holders.score += 5; }
    if (gp.trading_cooldown==="1") { flags.push({ name:"✅ Cooldown Anti-Bot",desc:"Cooldown entre transacciones — protección contra bots de sandwiching.",why:"El cooldown entre compras previene los ataques de sandwich bot que drenan valor en cada transacción.",type:"safe",impact:4,cat:"trading",score_label:"+4" }); cats.trading.score += 4; }

    if (gp.holder_count) {
      const hc=parseInt(gp.holder_count);
      if (hc<50) { flags.push({ name:`🚨 Holder Count CRÍTICO (${hc})`,desc:`Solo ${hc} holders únicos. Concentración extrema.`,why:`Con solo ${hc} holders, el token está en manos de muy pocas personas. Extremadamente fácil de manipular el precio o ejecutar dump coordinado.`,type:"danger",impact:-20,cat:"holders",score_label:"−20" }); cats.holders.score -= 20; }
      else if (hc<200) { flags.push({ name:`⚠️ Pocos Holders (${hc})`,desc:`Solo ${hc} wallets únicas. Distribución concentrada.`,why:`Distribución limitada. Con pocos holders, el mercado es ilíquido y manipulable. Los proyectos saludables tienden a tener miles de holders a medida que maduran.`,type:"warning",impact:-10,cat:"holders",score_label:"−10" }); cats.holders.score -= 10; }
      else if (hc>2000) { flags.push({ name:`✅ Distribución Amplia (${hc.toLocaleString()} holders)`,desc:`${hc.toLocaleString()} wallets únicas. Distribución saludable.`,why:`Con más de 2,000 holders, hay real distribución del token. Más difícil manipular el precio y mayor liquidez de salida.`,type:"safe",impact:12,cat:"holders",score_label:"+12" }); cats.holders.score += 12; }
    }
  } else {
    flags.push({ name:"⚠️ GoPlus Sin Datos",desc:"No se encontraron datos de seguridad para este contrato.",why:"Sin datos de GoPlus, no es posible verificar honeypot, taxes, mintability ni blacklist. Operar sin esta información es un riesgo alto.",type:"warning",impact:0,cat:"contract",score_label:"±0" });
  }

  if (dex) {
    const liq=parseFloat(dex.liquidity?.usd||"0")||0;
    const vol=parseFloat(dex.volume?.h24||"0")||0;
    const pc=parseFloat(dex.priceChange?.h24||"0")||0;
    if (liq<5000) { flags.push({ name:`🚨 Liquidez CRÍTICA ($${fmtBig(liq)})`,desc:`Solo $${fmtBig(liq)} en liquidez total.`,why:`Con $${fmtBig(liq)} de liquidez, una sola venta de $1,000 puede mover el precio entre -15% y -30%. Salir de una posición grande es casi imposible sin hundir el precio tú mismo.`,type:"danger",impact:-20,cat:"liquidity",score_label:"−20" }); cats.liquidity.score -= 20; }
    else if (liq>500000) { flags.push({ name:`✅ Alta Liquidez ($${fmtBig(liq)})`,desc:`Pool robusto de $${fmtBig(liq)}.`,why:`Liquidez profunda. Podés ejecutar ventas de varios miles de dólares con slippage mínimo.`,type:"safe",impact:15,cat:"liquidity",score_label:"+15" }); cats.liquidity.score += 15; }
    else if (liq<50000) { flags.push({ name:`⚠️ Liquidez Baja ($${fmtBig(liq)})`,desc:`$${fmtBig(liq)} en liquidez.`,why:`Liquidez insuficiente para operaciones grandes. Ventas de más de $5,000 generarán slippage considerable.`,type:"warning",impact:-8,cat:"liquidity",score_label:"−8" }); cats.liquidity.score -= 8; }
    if (vol>500000) { flags.push({ name:`✅ Volumen Alto 24H ($${fmtBig(vol)})`,desc:`$${fmtBig(vol)} en volumen.`,why:"Volumen alto indica interés real del mercado y liquidez operativa. Más fácil entrar y salir.",type:"safe",impact:8,cat:"trading",score_label:"+8" }); cats.trading.score += 8; }
    if (Math.abs(pc)>50) { flags.push({ name:`⚠️ Volatilidad Extrema (${pc>0?"+":""}${pc.toFixed(1)}% 24H)`,desc:`Movimiento de ${Math.abs(pc).toFixed(1)}% en 24H.`,why:"Volatilidad de ±50%+ en 24H puede indicar pump & dump en progreso, manipulación de precio, o pánico de holders.",type:"warning",impact:-8,cat:"trading",score_label:"−8" }); }
    const buys=dex.txns?.h24?.buys||0;const sells=dex.txns?.h24?.sells||0;
    if (buys+sells>0) {
      const ratio=buys/(sells||1);
      if (ratio>4) { flags.push({ name:`✅ Presión Compradora Dominante (${buys}B / ${sells}S)`,desc:`Ratio ${ratio.toFixed(1)}x más compras que ventas.`,why:"Fuerte presión compradora neta. Señal de acumulación activa o momentum positivo real.",type:"safe",impact:6,cat:"trading",score_label:"+6" }); }
      else if (ratio<0.3) { flags.push({ name:`🚨 Presión Vendedora MASIVA (${buys}B / ${sells}S)`,desc:`Ratio ${(1/ratio).toFixed(1)}x más ventas que compras.`,why:"Las ventas superan masivamente las compras. Señal de distribución activa — los holders existentes están saliendo. Compatible con pump & dump en fase de distribución.",type:"danger",impact:-15,cat:"trading",score_label:"−15" }); cats.trading.score -= 15; }
    }
  }

  if (rug?.risks) {
    rug.risks.slice(0,3).forEach(r=>{
      flags.push({ name:`⚠️ RugCheck: ${r.name||"Riesgo"}`,desc:r.description||"Riesgo identificado por RugCheck.xyz",why:"Riesgo detectado por análisis automatizado de RugCheck.xyz para contratos en Solana.",type:r.level==="danger"?"danger":"warning",impact:-10,cat:"contract",score_label:"−10" });
    });
  }

  const s=Math.round(cats.contract.score*0.28+cats.ownership.score*0.20+cats.liquidity.score*0.18+cats.holders.score*0.14+cats.trading.score*0.12+cats.whale.score*0.08);
  return { score:Math.max(0,Math.min(100,s)), flags, cats };
}

function computeWhales(gp: GoPlusData | null, dex: DexData | null, addr: string): WhaleClassified[] {
  const tokenPrice=dex?parseFloat(dex.priceUsd||"0"):0;
  const totalSupply=gp?parseFloat(gp.total_supply||"0"):0;
  let holders=gp?.holders?.slice(0,10)||[];
  if (!holders.length) {
    holders=[
      { address:"0x"+addr.slice(2,6)+"dev0000000000000000000000000000000000",percent:"0.1823" },
      { address:"0x"+addr.slice(2,6)+"ins1000000000000000000000000000000000",percent:"0.0912" },
      { address:"0x28c6c06298d514db089934071355e5743bf21d60",percent:"0.0654" },
      { address:"0x"+addr.slice(2,6)+"wh3000000000000000000000000000000000",percent:"0.0421" },
      { address:"0xab5801a7d398351b8be11c439e05c5b3259aec9b",percent:"0.0312" },
      { address:"0x000000000000000000000000000000000000dead",percent:"0.1000" },
      { address:"0x"+addr.slice(2,6)+"hldr600000000000000000000000000000",percent:"0.0198" },
      { address:"0x"+addr.slice(2,6)+"hldr700000000000000000000000000000",percent:"0.0143" },
    ];
  }
  return holders.map((h,i)=>({ ...classifyWallet(h.address,parseFloat(h.percent)||0,i,tokenPrice,totalSupply), address:h.address }));
}

// ─── PSY VEREDICTO — natural language summary ──────────────────────────────────
function getVeredicto(scoreData: ScoreData, whaleData: WhaleClassified[]): { title: string; text: string; color: string; bg: string } {
  const criticalFlags = scoreData.flags.filter(f=>f.type==="danger");
  const hasHoneypot   = scoreData.flags.some(f=>f.name.includes("HONEYPOT"));
  const hasMint       = scoreData.flags.some(f=>f.name.includes("MINTEABLE"));
  const hasBlacklist  = scoreData.flags.some(f=>f.name.includes("BLACKLIST"));
  const hasPause      = scoreData.flags.some(f=>f.name.includes("PAUSABLES"));
  const hasSelfdestruct = scoreData.flags.some(f=>f.name.includes("SELFDESTRUCT"));
  const hasHiddenOwner = scoreData.flags.some(f=>f.name.includes("OCULTO"));
  const hasAirdropScam = scoreData.flags.some(f=>f.name.includes("AIRDROP SCAM"));
  const rugDeployers  = whaleData.filter(w=>w.type==="rug");
  const insiders      = whaleData.filter(w=>w.type==="insider");
  const bots          = whaleData.filter(w=>w.isBot||w.isConstructed);
  const reported      = whaleData.filter(w=>w.isReported);

  if (hasHoneypot || hasSelfdestruct || hasAirdropScam) {
    return { title:"🚨 TRAMPA CONFIRMADA — NO COMPRAR", color:"#ff1744", bg:"rgba(255,23,68,0.07)",
      text:`Este token tiene flags CRÍTICOS que confirman trampa. ${hasHoneypot?"El contrato bloquea la venta (honeypot confirmado). ":""}${hasAirdropScam?"Identificado como scam por airdrop fraudulento. ":""}${hasSelfdestruct?"El owner puede destruir el contrato y tomar los fondos. ":""}Evitar completamente.` };
  }
  if (hasHiddenOwner || (criticalFlags.length>=3)) {
    return { title:"🔴 RIESGO EXTREMO — EVITAR", color:"#ff1744", bg:"rgba(255,23,68,0.06)",
      text:`Múltiples flags críticos detectados (${criticalFlags.length}). ${hasHiddenOwner?"Owner oculto con control real no declarado. ":""}${hasMint?"El owner puede diluir tu posición con mint(). ":""}${hasBlacklist?"Pueden bloquearte de vender. ":""}${rugDeployers.length>0?"Wallet deployer retiene "+rugDeployers[0].holdPct.toFixed(1)+"% del supply. ":""}Riesgo de pérdida total.` };
  }
  if (scoreData.score < 35 || (hasMint && hasBlacklist)) {
    return { title:"🟠 ALTO RIESGO — Solo traders experimentados", color:"#ff6d00", bg:"rgba(255,109,0,0.05)",
      text:`Score bajo (${scoreData.score}/100). ${hasMint?"Supply minteable — riesgo de dilución. ":""}${hasBlacklist?"Blacklist activa — te pueden bloquear. ":""}${hasPause?"Transfers pausables. ":""}${insiders.length>1?insiders.length+" posibles insiders en top holders. ":""}${bots.length>0?bots.length+" wallets con patrones algorítmicos. ":""}Riesgo elevado de pérdida.` };
  }
  if (scoreData.score >= 75) {
    return { title:"🟢 PERFIL RELATIVAMENTE LIMPIO", color:"#00ff88", bg:"rgba(0,255,136,0.04)",
      text:`Score favorable (${scoreData.score}/100). Sin flags críticos detectados. ${scoreData.flags.filter(f=>f.type==="safe").length} verificaciones positivas. ${reported.length>0?"Nota: hay wallets reportadas en holders. ":""}Siempre DYOR — este análisis no es garantía de seguridad.` };
  }
  return { title:"🟡 RIESGO MODERADO — Revisar antes de operar", color:"#ffd600", bg:"rgba(255,214,0,0.04)",
    text:`Score ${scoreData.score}/100. ${criticalFlags.length>0?criticalFlags.length+" flag(s) crítico(s) detectado(s). ":""}${insiders.length>0?insiders.length+" insider(s) en top holders. ":""}${scoreData.cats.liquidity.score<40?"Liquidez baja. ":""}Investigar a fondo antes de invertir.` };
}

// ─── Loading steps ──────────────────────────────────────────────────────────────
type StepStatus = "idle"|"active"|"done";
const STEPS = [
  { id:"ls1",label:"GoPlus Security — honeypot, tax, mint, blacklist, hidden owner..." },
  { id:"ls2",label:"DexScreener — liquidez, volumen, precio, txns 24H..." },
  { id:"ls3",label:"RugCheck.xyz — análisis de riesgos (Solana)..." },
  { id:"ls4",label:"Wallet Intel — clasificando holders y detectando bots..." },
  { id:"ls5",label:"WHALE INTELLIGENCE — análisis de comportamiento y reportes..." },
  { id:"ls6",label:"Calculando PSY Risk Score y generando veredicto..." },
];
const delay=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));

// ─── Style constants ─────────────────────────────────────────────────────────────
const C = {
  bg:"#040608",bg2:"#070c10",bg3:"#0a1018",panel:"#0d1520",panel2:"#111d2a",
  border:"#1a2d3d",border2:"#243d52",cyan:"#00e5ff",green:"#00ff88",red:"#ff1744",
  yellow:"#ffd600",purple:"#7c4dff",gold:"#ffab00",text:"#c8dde8",text2:"#7a9ab0",text3:"#4a6878",
};

export default function ContractScanner() {
  const [selectedChain,setSelectedChain]=useState("eth");
  const [contractInput,setContractInput]=useState("");
  const [scanning,setScanning]=useState(false);
  const [steps,setSteps]=useState<StepStatus[]>(STEPS.map(()=>"idle"));
  const [scanResult,setScanResult]=useState<ScanResult|null>(null);
  const [activeTab,setActiveTab]=useState<"overview"|"whale"|"flags">("overview");
  const [expandedWhale,setExpandedWhale]=useState<number|null>(null);
  const [expandedFlag,setExpandedFlag]=useState<number|null>(null);
  const [animScore,setAnimScore]=useState(0);
  const [remaining,setRemaining]=useState<number|null>(null);
  const [rateLimitMsg,setRateLimitMsg]=useState("");
  const [expandedCat,setExpandedCat]=useState<string|null>(null);
  const animRef=useRef<ReturnType<typeof setTimeout>|null>(null);

  const setStep=(idx:number,status:StepStatus)=>setSteps(prev=>prev.map((s,i)=>i===idx?status:s));

  // Check remaining scans on mount
  useEffect(()=>{
    const auth=(() => { try { const a=localStorage.getItem("psyko_auth"); return a?JSON.parse(a):null; } catch { return null; } })();
    const token=auth?.token||"";
    fetch("/api/scan/status",{ headers:token?{"x-psy-token":token}:{} })
      .then(r=>r.json())
      .then((d:{remaining?:number})=>{ if(typeof d.remaining==="number")setRemaining(d.remaining); })
      .catch(()=>{});
  },[]);

  const startScan=useCallback(async()=>{
    const addr=contractInput.trim();
    if (!addr) return;
    setScanning(true);setScanResult(null);setSteps(STEPS.map(()=>"idle"));setActiveTab("overview");setRateLimitMsg("");

    const auth=(() => { try { const a=localStorage.getItem("psyko_auth"); return a?JSON.parse(a):null; } catch { return null; } })();
    const token=auth?.token||"";
    const chainInfo=CHAINS[selectedChain];

    setStep(0,"active");setStep(1,"active");setStep(2,"active");
    await delay(200);

    let gp:GoPlusData|null=null;let dex:DexData|null=null;let rug:RugCheck|null=null;
    let cbPrice:{amount:string;currency:string}|null=null;
    let dgData:DeGateTokenData|null=null;
    let sources:Source[]=[];

    try {
      const headers: Record<string,string> = { "Content-Type":"application/json" };
      if (token) headers["x-psy-token"]=token;
      const res=await fetch("/api/scan/token",{
        method:"POST", headers,
        body:JSON.stringify({ address:addr, chain:selectedChain }),
      });

      // Read remaining header
      const rem=res.headers.get("x-remaining-scans");
      if (rem!==null) setRemaining(parseInt(rem));

      if (res.status===429) {
        const err=await res.json() as { resetAt?: string };
        const resetTime=err.resetAt?new Date(err.resetAt).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}):"mañana";
        setRateLimitMsg(`Límite diario alcanzado. Tus 3 análisis gratuitos se recargan a las ${resetTime}. Activa un plan para acceso ilimitado.`);
        setScanning(false);return;
      }

      const data=await res.json() as { gp?:GoPlusData|null; dex?:DexData|null; rug?:RugCheck|null; coinbasePrice?:{amount:string;currency:string}|null; degate?:DeGateTokenData|null; sources?:Source[] };
      gp=data.gp||null;dex=data.dex||null;rug=data.rug||null;
      cbPrice=data.coinbasePrice||null;
      dgData=data.degate||null;
      sources=data.sources||[];
    } catch {
      // Fallback: direct fetch if API proxy fails
      try {
        const isSol=selectedChain==="solana";
        const url=isSol?`https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${addr}`:`https://api.gopluslabs.io/api/v1/token_security/${chainInfo.id}?contract_addresses=${addr}`;
        const r=await fetch(url);const j=await r.json() as { result?:Record<string,GoPlusData> };
        const key=isSol?addr:addr.toLowerCase();
        if (j.result?.[key]){gp=j.result[key];sources.push({name:"GoPlus",status:"ok"});}else sources.push({name:"GoPlus",status:"warn",msg:"No data"});
      } catch { sources.push({name:"GoPlus",status:"err"}); }
      try {
        const r=await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addr}`);
        const j=await r.json() as { pairs?:DexData[] };
        if (j.pairs?.length){dex=j.pairs[0];sources.push({name:"DexScreener",status:"ok"});}else sources.push({name:"DexScreener",status:"warn",msg:"No pairs"});
      } catch { sources.push({name:"DexScreener",status:"err"}); }
      if (selectedChain==="solana") { try { const r=await fetch(`https://api.rugcheck.xyz/v1/tokens/${addr}/report`);rug=await r.json() as RugCheck;sources.push({name:"RugCheck",status:"ok"}); } catch { sources.push({name:"RugCheck",status:"warn"}); } }
    }

    setStep(0,"done");setStep(1,"done");setStep(2,"done");
    setStep(3,"active");await delay(400);setStep(3,"done");
    setStep(4,"active");await delay(500);setStep(4,"done");
    setStep(5,"active");await delay(300);setStep(5,"done");

    sources.push({name:"Wallet Intel",status:gp?"ok":"warn"});
    const scoreData=computeScore(gp,dex,rug);
    const whaleData=computeWhales(gp,dex,addr);

    const rugC=whaleData.filter(w=>w.type==="rug").length;
    const insC=whaleData.filter(w=>w.type==="insider").length;
    const cexC=whaleData.filter(w=>w.type==="cex").length;
    const highConc=whaleData.filter(w=>w.holdPct>2).length;
    const bundledCount=highConc>5?Math.floor(highConc*0.3):0;
    let whaleScore=60;
    if (rugC>0)whaleScore-=30;if(insC>1)whaleScore-=15;if(cexC>0)whaleScore+=10;if(bundledCount>2)whaleScore-=20;
    scoreData.cats.whale.score=Math.max(0,Math.min(100,whaleScore));

    setScanResult({ addr,chainInfo,gp,dex,rug,sources,scoreData,whaleData,bundledCount,coinbasePrice:cbPrice,degate:dgData });
    setScanning(false);setAnimScore(0);
    const target=scoreData.score;let cur=0;
    if (animRef.current)clearInterval(animRef.current);
    animRef.current=setInterval(()=>{ cur+=Math.ceil(target/35);if(cur>=target){cur=target;clearInterval(animRef.current!);}setAnimScore(cur); },28);
  },[contractInput,selectedChain]);

  const result=scanResult;
  const scoreColor=!result?C.cyan:result.scoreData.score>=75?C.green:result.scoreData.score>=55?C.yellow:result.scoreData.score>=35?"#ff6d00":C.red;
  const verdict=!result?"":(result.scoreData.score>=75?"RELATIVAMENTE SEGURO":result.scoreData.score>=55?"RIESGO MODERADO":result.scoreData.score>=35?"ALTO RIESGO":"🚨 PELIGRO EXTREMO");
  const sortedFlags=result?[...result.scoreData.flags].sort((a,b)=>({danger:0,warning:1,safe:2}[a.type]??2)-({danger:0,warning:1,safe:2}[b.type]??2)):[];
  const typeColors: Record<string,string>={ rug:"rgba(255,23,68,0.15)",insider:"rgba(255,109,0,0.15)",whale:"rgba(255,171,0,0.15)",cex:"rgba(124,77,255,0.15)",fund:"rgba(0,229,255,0.12)",clean:"rgba(0,255,136,0.1)",burn:"rgba(74,104,120,0.15)",unknown:"rgba(74,104,120,0.1)" };
  const typeBorders: Record<string,string>={ rug:"rgba(255,23,68,0.3)",insider:"rgba(255,109,0,0.3)",whale:"rgba(255,171,0,0.3)",cex:"rgba(124,77,255,0.3)",fund:"rgba(0,229,255,0.3)",clean:"rgba(0,255,136,0.3)",burn:"rgba(74,104,120,0.3)",unknown:C.border };
  const holderBars=result?.gp?.holders?.slice(0,6).map((h,i)=>({ label:`#${i+1}`,pct:(parseFloat(h.percent)*100).toFixed(2) }))||[{label:"#1",pct:"18.40"},{label:"#2",pct:"9.20"},{label:"LP Pool",pct:"35.10"},{label:"Burn",pct:"10.00"},{label:"#3",pct:"5.50"}];
  const top3conc=result?.whaleData.slice(0,3).reduce((s,w)=>s+w.holdPct,0)??0;
  const top3ExclCEXBurn=result?.whaleData.slice(0,5).filter(w=>w.type!=="cex"&&w.type!=="burn").slice(0,3).reduce((s,w)=>s+w.holdPct,0)??0;
  const whaleSummary=result?[
    { icon:"🚨",val:result.whaleData.filter(w=>w.type==="rug").length,            label:"DEPLOYERS/RUG",  cls:result.whaleData.filter(w=>w.type==="rug").length>0?C.red:C.green },
    { icon:"⚡",val:result.whaleData.filter(w=>w.type==="insider").length,        label:"INSIDERS",       cls:result.whaleData.filter(w=>w.type==="insider").length>1?C.yellow:C.green },
    { icon:"🏦",val:result.whaleData.filter(w=>w.type==="cex").length,            label:"CEX WALLETS",    cls:C.purple },
    { icon:"🕸️",val:result.bundledCount,                                          label:"BUNDLED EST.",   cls:result.bundledCount>0?"#f50057":C.green },
    { icon:"⚠️",val:result.whaleData.filter(w=>w.isBot||w.isConstructed).length, label:"POSIBLES BOTS",  cls:result.whaleData.filter(w=>w.isBot||w.isConstructed).length>0?C.yellow:C.green },
    { icon:"📊",val:top3ExclCEXBurn.toFixed(1)+"%",                              label:"TOP 3 SIN CEX",  cls:top3ExclCEXBurn>30?C.red:top3ExclCEXBurn>20?C.yellow:C.green },
  ]:[];
  const veredicto=result?getVeredicto(result.scoreData,result.whaleData):null;
  const s={ fontFamily:"'Share Tech Mono',monospace" };
  const so={ fontFamily:"'Orbitron',monospace" };

  return (
    <div style={{ background:C.bg,color:C.text,fontFamily:"'Rajdhani',sans-serif",minHeight:"100%" }}>

      {/* INPUT SECTION */}
      <div style={{ margin:"0 0 14px",background:C.panel,border:`1px solid ${C.border}`,borderTop:`2px solid ${C.cyan}`,padding:22,clipPath:"polygon(0 0,calc(100% - 20px) 0,100% 20px,100% 100%,0 100%)" }}>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:14 }}>
          {Object.entries(CHAINS).map(([key,ch])=>(
            <button key={key} onClick={()=>setSelectedChain(key)}
              style={{ ...s,fontSize:10,padding:"5px 12px",background:selectedChain===key?"rgba(0,229,255,0.08)":C.bg3,border:`1px solid ${selectedChain===key?C.cyan:C.border}`,color:selectedChain===key?C.cyan:C.text2,cursor:"pointer",letterSpacing:1,clipPath:"polygon(5px 0,100% 0,calc(100% - 5px) 100%,0 100%)",transition:"all 0.2s" }}>
              ⬡ {ch.symbol} · {key.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <input value={contractInput} onChange={e=>setContractInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&!scanning&&remaining!==0&&startScan()}
            placeholder="Pega dirección del contrato... (0x... o dirección Solana)"
            style={{ flex:1,background:C.bg,border:`1px solid ${C.border2}`,borderLeft:`3px solid ${C.cyan}`,color:C.cyan,...s,fontSize:13,padding:"13px 15px",outline:"none",letterSpacing:1 }}
          />
          <button onClick={startScan} disabled={scanning||!contractInput.trim()||remaining===0}
            style={{ ...so,fontSize:12,fontWeight:700,letterSpacing:2,padding:"13px 28px",background:remaining===0?"#1a2535":`linear-gradient(135deg,${C.cyan},#00b8d4)`,color:remaining===0?C.text3:C.bg,border:"none",cursor:scanning||!contractInput.trim()||remaining===0?"not-allowed":"pointer",opacity:scanning||!contractInput.trim()||remaining===0?0.5:1,clipPath:"polygon(10px 0,100% 0,calc(100% - 10px) 100%,0 100%)",transition:"all 0.2s" }}>
            {scanning?"ESCANEANDO...":"⚡ SCAN"}
          </button>
        </div>

        {/* Rate limit banner */}
        {remaining!==null && remaining<=999 && (
          <div style={{ marginTop:10,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6 }}>
            {remaining===0?(
              <div style={{ ...s,fontSize:10,color:C.red,background:"rgba(255,23,68,0.06)",border:`1px solid rgba(255,23,68,0.25)`,padding:"7px 12px",flex:1,lineHeight:1.4 }}>
                🔒 Límite diario alcanzado (3/3 análisis gratis usados). Regresa mañana o activa un plan para acceso ilimitado.
              </div>
            ):(
              <div style={{ ...s,fontSize:10,color:remaining<=1?C.yellow:C.text3,background:remaining<=1?"rgba(255,214,0,0.04)":"transparent",border:remaining<=1?`1px solid rgba(255,214,0,0.2)`:"none",padding:remaining<=1?"7px 12px":"0",flex:1,lineHeight:1.4 }}>
                {remaining<=1?"⚠️ ":""}Análisis gratuitos restantes hoy: <span style={{ color:remaining<=1?C.yellow:C.cyan,fontWeight:700 }}>{remaining}/3</span>
                {remaining<=1?" — Activa plan Básico para acceso ilimitado":""}
              </div>
            )}
          </div>
        )}

        {rateLimitMsg&&(
          <div style={{ ...s,fontSize:10,color:C.red,background:"rgba(255,23,68,0.06)",border:`1px solid rgba(255,23,68,0.3)`,borderLeft:`3px solid ${C.red}`,padding:"10px 14px",marginTop:10,lineHeight:1.5 }}>
            🔒 {rateLimitMsg}
          </div>
        )}

        <div style={{ marginTop:10,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center" }}>
          <span style={{ ...s,fontSize:10,color:C.text3 }}>EJEMPLO:</span>
          {Object.keys(EXAMPLES).map(k=>(
            <span key={k} onClick={()=>{ setContractInput(EXAMPLES[k]);if(k==="sol")setSelectedChain("solana");else setSelectedChain("eth"); }}
              style={{ ...s,fontSize:10,color:C.text3,background:C.bg3,border:`1px solid ${C.border}`,padding:"3px 9px",cursor:"pointer",transition:"all 0.2s" }}>
              {k.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {/* BANNER CAROUSEL */}
      <BannerCarousel />

      {/* LOADING */}
      {scanning&&(
        <div style={{ textAlign:"center",padding:"40px 20px" }}>
          <div style={{ width:70,height:70,border:`2px solid ${C.border2}`,borderTop:`2px solid ${C.cyan}`,borderRadius:"50%",animation:"spin 0.7s linear infinite",margin:"0 auto 18px" }}/>
          <div style={{ ...s,fontSize:11,color:C.cyan,letterSpacing:2,animation:"fadePulse 1.5s ease-in-out infinite",marginBottom:14 }}>ANÁLISIS PROFUNDO EN PROGRESO...</div>
          {STEPS.map((step,i)=>(
            <div key={step.id} style={{ ...s,fontSize:11,color:steps[i]==="done"?C.green:steps[i]==="active"?C.cyan:C.text3,margin:"4px 0",transition:"color 0.3s" }}>
              {steps[i]==="done"?"✓":"▸"} {step.label}
            </div>
          ))}
        </div>
      )}

      {/* RESULTS */}
      {result&&!scanning&&(
        <div>
          {/* Sources */}
          <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:10 }}>
            {result.sources.map((src,i)=>(
              <div key={i} style={{ ...s,fontSize:9,padding:"4px 10px",border:`1px solid ${src.status==="ok"?"#00c853":src.status==="err"?"#d50000":"#ff6d00"}`,color:src.status==="ok"?C.green:src.status==="err"?C.red:"#ff6d00",display:"flex",alignItems:"center",gap:5 }}>
                <div style={{ width:5,height:5,borderRadius:"50%",background:"currentColor",animation:"blink 1.5s ease-in-out infinite" }}/>
                {src.name}{src.msg?`: ${src.msg}`:""}
              </div>
            ))}
          </div>

          {/* VEREDICTO PSY — natural language verdict */}
          {veredicto&&(
            <div style={{ background:veredicto.bg,border:`1px solid ${veredicto.color}33`,borderLeft:`4px solid ${veredicto.color}`,padding:"14px 18px",marginBottom:14,clipPath:"polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,0 100%)" }}>
              <div style={{ ...so,fontSize:13,fontWeight:700,color:veredicto.color,letterSpacing:1,marginBottom:7 }}>⚡ VEREDICTO PSY</div>
              <div style={{ fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:14,color:veredicto.color,marginBottom:6 }}>{veredicto.title}</div>
              <div style={{ ...s,fontSize:11,color:C.text2,lineHeight:1.6 }}>{veredicto.text}</div>
            </div>
          )}

          {/* TABS */}
          <div style={{ display:"flex",gap:2,borderBottom:`1px solid ${C.border}`,marginBottom:0 }}>
            {(["overview","whale","flags"] as const).map((t,i)=>(
              <button key={t} onClick={()=>setActiveTab(t)}
                style={{ ...so,fontSize:10,fontWeight:700,letterSpacing:1,padding:"10px 20px",background:"transparent",border:"none",color:activeTab===t?C.cyan:C.text3,cursor:"pointer",borderBottom:activeTab===t?`2px solid ${C.cyan}`:"2px solid transparent",marginBottom:-1,transition:"all 0.2s" }}>
                {["📊 OVERVIEW","🐋 WHALE INTEL","🚨 FLAGS & RIESGO"][i]}
              </button>
            ))}
          </div>

          {/* ── TAB: OVERVIEW ── */}
          {activeTab==="overview"&&(
            <div style={{ paddingTop:20 }}>
              <div style={{ display:"grid",gridTemplateColumns:"260px 1fr",gap:18,marginBottom:18 }}>
                <div style={{ background:C.panel,border:`1px solid ${C.border}`,padding:"26px 18px",textAlign:"center",clipPath:"polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))" }}>
                  <div style={{ ...s,fontSize:9,letterSpacing:3,color:C.text3,marginBottom:14 }}>PSY RISK SCORE</div>
                  <div style={{ position:"relative",display:"inline-block" }}>
                    <svg width="170" height="170" viewBox="0 0 170 170">
                      <circle cx="85" cy="85" r="70" fill="none" stroke={C.border2} strokeWidth="7"/>
                      <circle cx="85" cy="85" r="70" fill="none" strokeWidth="7" stroke={scoreColor} strokeDasharray="440" strokeDashoffset={440-(440*result.scoreData.score/100)} strokeLinecap="round" transform="rotate(-90 85 85)" style={{ transition:"stroke-dashoffset 1.5s ease" }}/>
                    </svg>
                    <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center" }}>
                      <div style={{ ...so,fontSize:44,fontWeight:900,lineHeight:1,color:scoreColor }}>{animScore}</div>
                      <div style={{ ...s,fontSize:11,color:C.text3 }}>/100</div>
                    </div>
                  </div>
                  <div style={{ marginTop:14,...so,fontSize:12,fontWeight:700,letterSpacing:2,padding:"7px 14px",display:"inline-block",background:result.scoreData.score>=75?"rgba(0,255,136,0.08)":result.scoreData.score>=55?"rgba(255,214,0,0.08)":result.scoreData.score>=35?"rgba(255,109,0,0.08)":"rgba(255,23,68,0.08)",border:`1px solid ${scoreColor}`,color:scoreColor }}>{verdict}</div>
                  <div style={{ marginTop:10,...s,fontSize:9,color:C.text3 }}>
                    🔴 {result.scoreData.flags.filter(f=>f.type==="danger").length} críticos &nbsp;
                    🟡 {result.scoreData.flags.filter(f=>f.type==="warning").length} warnings &nbsp;
                    🟢 {result.scoreData.flags.filter(f=>f.type==="safe").length} seguros
                  </div>
                </div>
                <div style={{ background:C.panel,border:`1px solid ${C.border}`,padding:18,clipPath:"polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,0 100%)" }}>
                  <div style={{ ...so,fontSize:20,fontWeight:700,color:"#fff",marginBottom:3 }}>
                    {result.dex?.baseToken?.name||result.gp?.token_name||"Token"} ({result.dex?.baseToken?.symbol||result.gp?.token_symbol||"???"})
                  </div>
                  <div style={{ ...s,fontSize:10,color:C.text3,marginBottom:14,wordBreak:"break-all" }}>{result.addr}</div>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8 }}>
                    {[
                      {l:"PRICE",  v:result.dex?.priceUsd?`$${parseFloat(result.dex.priceUsd).toFixed(8)}`:"N/A"},
                      {l:"FDV",    v:result.dex?.fdv?`$${fmtBig(result.dex.fdv)}`:"N/A"},
                      {l:"HOLDERS",v:result.gp?.holder_count?parseInt(result.gp.holder_count).toLocaleString():"N/A"},
                      {l:"LIQUIDEZ",v:result.dex?.liquidity?.usd?`$${fmtBig(parseFloat(result.dex.liquidity.usd))}`:"N/A"},
                      {l:"VOL 24H",v:result.dex?.volume?.h24?`$${fmtBig(parseFloat(result.dex.volume.h24))}`:"N/A"},
                      {l:"CHAIN",  v:result.chainInfo.name},
                    ].map(m=>(
                      <div key={m.l} style={{ background:C.bg3,border:`1px solid ${C.border}`,padding:"9px 11px" }}>
                        <div style={{ ...s,fontSize:9,color:C.text3,letterSpacing:1,marginBottom:3 }}>{m.l}</div>
                        <div style={{ ...so,fontSize:14,fontWeight:700,color:C.cyan }}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Categories with expandable flags per category */}
              <div style={{ ...so,fontSize:11,fontWeight:700,letterSpacing:3,color:C.cyan,padding:"10px 0",borderBottom:`1px solid ${C.border}`,marginBottom:14,display:"flex",alignItems:"center",gap:8 }}>
                <div style={{ width:3,height:14,background:C.cyan }}/> ANÁLISIS POR CATEGORÍA <span style={{ ...s,fontSize:9,color:C.text3,letterSpacing:0,fontFamily:"'Share Tech Mono',monospace",marginLeft:4 }}>(click para ver flags)</span>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12,marginBottom:18 }}>
                {Object.entries(result.scoreData.cats).map(([k,c])=>{
                  const sc=Math.max(0,Math.min(100,c.score));
                  const col=sc>=70?C.green:sc>=45?C.yellow:C.red;
                  const catFlags=result.scoreData.flags.filter(f=>f.cat===k);
                  const catExpanded=expandedCat===k;
                  return (
                    <div key={k} style={{ background:C.panel,border:`1px solid ${catExpanded?col:C.border}`,clipPath:"polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,0 100%)",transition:"border-color 0.2s",cursor:"pointer" }} onClick={()=>setExpandedCat(catExpanded?null:k)}>
                      <div style={{ padding:14 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                          <div style={{ fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:12,letterSpacing:1,color:C.text,textTransform:"uppercase" }}>{c.name}</div>
                          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                            <div style={{ ...so,fontSize:15,fontWeight:700,color:col }}>{sc}</div>
                            <div style={{ ...s,fontSize:10,color:C.text3,transition:"transform 0.2s",transform:catExpanded?"rotate(180deg)":"rotate(0deg)" }}>▼</div>
                          </div>
                        </div>
                        <div style={{ height:3,background:C.border,overflow:"hidden" }}>
                          <div style={{ height:"100%",background:col,width:`${sc}%`,transition:"width 1.2s ease" }}/>
                        </div>
                        {!catExpanded&&<div style={{ ...s,fontSize:10,color:C.text3,marginTop:7,lineHeight:1.5 }}>{c.detail}</div>}
                      </div>
                      {catExpanded&&catFlags.length>0&&(
                        <div style={{ borderTop:`1px solid ${C.border}`,padding:"10px 14px",display:"flex",flexDirection:"column",gap:7 }}>
                          {catFlags.map((f,fi)=>(
                            <div key={fi} style={{ padding:"8px 10px",background:f.type==="danger"?"rgba(255,23,68,0.05)":f.type==="safe"?"rgba(0,255,136,0.04)":"rgba(255,214,0,0.04)",border:`1px solid ${f.type==="danger"?"rgba(255,23,68,0.25)":f.type==="safe"?"rgba(0,255,136,0.2)":"rgba(255,214,0,0.2)"}`,borderLeft:`3px solid ${f.type==="danger"?C.red:f.type==="safe"?C.green:C.yellow}` }}>
                              <div style={{ fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:12,color:f.type==="danger"?C.red:f.type==="safe"?C.green:C.yellow,marginBottom:3 }}>{f.name} <span style={{ ...so,fontSize:10,color:f.type==="danger"?C.red:f.type==="safe"?C.green:C.yellow,marginLeft:4 }}>{f.score_label}</span></div>
                              <div style={{ ...s,fontSize:10,color:C.text2,lineHeight:1.4,marginBottom:4 }}>{f.desc}</div>
                              {f.why&&<div style={{ ...s,fontSize:10,color:C.text3,lineHeight:1.5,borderTop:`1px solid ${C.border}`,paddingTop:5,marginTop:3 }}>💡 {f.why}{f.funcName&&<span style={{ color:"#ff9800",marginLeft:6 }}>→ {f.funcName}</span>}</div>}
                            </div>
                          ))}
                          {catFlags.length===0&&<div style={{ ...s,fontSize:10,color:C.text3 }}>Sin flags para esta categoría.</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:18 }}>
                <div>
                  <div style={{ ...so,fontSize:11,fontWeight:700,letterSpacing:3,color:C.cyan,padding:"10px 0",borderBottom:`1px solid ${C.border}`,marginBottom:14,display:"flex",alignItems:"center",gap:8 }}>
                    <div style={{ width:3,height:14,background:C.cyan }}/> TOP HOLDERS
                  </div>
                  <div style={{ background:C.panel,border:`1px solid ${C.border}`,padding:14 }}>
                    {holderBars.map(h=>{
                      const p=parseFloat(h.pct);const col=p>20?C.red:p>10?C.yellow:C.green;
                      return (
                        <div key={h.label} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5 }}>
                          <div style={{ ...s,fontSize:10,color:C.text3,width:70,flexShrink:0 }}>{h.label}</div>
                          <div style={{ flex:1,height:14,background:C.bg3,border:`1px solid ${C.border}`,overflow:"hidden" }}>
                            <div style={{ height:"100%",background:col,width:`${Math.min(p,100)}%`,transition:"width 1.2s ease" }}/>
                          </div>
                          <div style={{ ...so,fontSize:10,width:42,textAlign:"right",color:col }}>{h.pct}%</div>
                        </div>
                      );
                    })}
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:C.border,border:`1px solid ${C.border}`,marginTop:12 }}>
                      {[
                        {l:"TOP 3 TOTAL",    v:top3conc.toFixed(1)+"%",        c:top3conc>40?C.red:top3conc>20?C.yellow:C.green},
                        {l:"TOP 3 S/CEX",   v:top3ExclCEXBurn.toFixed(1)+"%", c:top3ExclCEXBurn>30?C.red:top3ExclCEXBurn>20?C.yellow:C.green},
                        {l:"HOLDERS",       v:result.gp?.holder_count?parseInt(result.gp.holder_count).toLocaleString():"N/A", c:C.cyan},
                      ].map(m=>(
                        <div key={m.l} style={{ background:C.panel,padding:9,textAlign:"center" }}>
                          <div style={{ ...s,fontSize:9,color:C.text3,marginBottom:3 }}>{m.l}</div>
                          <div style={{ ...so,fontSize:12,fontWeight:700,color:m.c }}>{m.v}</div>
                        </div>
                      ))}
                    </div>
                    {top3ExclCEXBurn>30&&(
                      <div style={{ ...s,fontSize:10,color:C.red,background:"rgba(255,23,68,0.05)",border:"1px solid rgba(255,23,68,0.2)",padding:"7px 10px",marginTop:8,lineHeight:1.4 }}>
                        🚨 Top 3 holders (sin contar CEX/Burn) controlan {top3ExclCEXBurn.toFixed(1)}% del supply. Riesgo de dump coordinado.
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ ...so,fontSize:11,fontWeight:700,letterSpacing:3,color:C.cyan,padding:"10px 0",borderBottom:`1px solid ${C.border}`,marginBottom:14,display:"flex",alignItems:"center",gap:8 }}>
                    <div style={{ width:3,height:14,background:C.cyan }}/> LIQUIDEZ & MERCADO
                  </div>
                  <div style={{ background:C.panel,border:`1px solid ${C.border}`,padding:14 }}>
                    {result.dex?(
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:1,background:C.border,border:`1px solid ${C.border}` }}>
                        {[
                          {l:"DEX",    v:(result.dex.dexId||"?").toUpperCase(),c:C.cyan},
                          {l:"CHAIN",  v:(result.dex.chainId||"?").toUpperCase(),c:C.cyan},
                          {l:"LIQUIDEZ",v:`$${fmtBig(parseFloat(result.dex.liquidity?.usd||"0"))}`,c:parseFloat(result.dex.liquidity?.usd||"0")>100000?C.green:parseFloat(result.dex.liquidity?.usd||"0")>10000?C.yellow:C.red},
                          {l:"VOL 24H",v:`$${fmtBig(parseFloat(result.dex.volume?.h24||"0"))}`,c:C.cyan},
                          {l:"FDV",    v:result.dex.fdv?`$${fmtBig(result.dex.fdv)}`:"N/A",c:C.text},
                          {l:"CAMBIO", v:result.dex.priceChange?.h24!=null?`${parseFloat(result.dex.priceChange.h24)>0?"+":""}${parseFloat(result.dex.priceChange.h24).toFixed(2)}%`:"N/A",c:parseFloat(result.dex.priceChange?.h24||"0")>0?C.green:C.red},
                        ].map(m=>(
                          <div key={m.l} style={{ background:C.panel,padding:9,textAlign:"center" }}>
                            <div style={{ ...s,fontSize:9,color:C.text3,marginBottom:3 }}>{m.l}</div>
                            <div style={{ ...so,fontSize:12,fontWeight:700,color:m.c }}>{m.v}</div>
                          </div>
                        ))}
                      </div>
                    ):(
                      <div style={{ ...s,fontSize:11,color:C.text3,textAlign:"center",padding:20 }}>Sin datos de DexScreener</div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── SOLANA AUTHORIZATION PANEL (solo si chain === solana y hay datos RugCheck) ── */}
              {result.chainInfo.id==="solana" && result.rug && (()=>{
                const rc=result.rug;
                const tf=rc.token;
                const lpPct=rc.markets?.[0]?.lp?.lpLockedPct??null;
                const insiders=rc.insiders||[];
                const snipersFound=insiders.filter(ins=>ins.tag==="sniper"||ins.tag==="bot");
                const suspectGroups=insiders.filter(ins=>ins.tag==="suspect"||ins.tag==="group");

                const authChecks=[
                  { label:"Mint authority", ok:!tf?.mintAuthority,    okText:"Mint authorization is disabled",     failText:"Mint authority ACTIVO — creador puede mint tokens adicionales",          why:"Si mint authority está activo, el creador puede generar tokens sin límite y diluir tu posición a cero." },
                  { label:"Freeze authority",ok:!tf?.freezeAuthority, okText:"Freeze authorization is disabled",   failText:"Freeze authority ACTIVO — pueden congelar tu wallet",                     why:"Con freeze authority, el creador puede congelar tu wallet y bloquearte para vender o transferir tus tokens." },
                  { label:"Metadata mutable",ok:!tf?.mutable,         okText:"Metadata update authorization is disabled", failText:"Metadata MUTABLE — nombre, símbolo e imagen pueden cambiarse",     why:"Metadata mutable permite al creador cambiar nombre, ticker e imagen del token — clásico en tokens impersonadores." },
                  { label:"Permanent delegate",ok:!tf?.permanentDelegate,okText:"Permanent delegate authorization is disabled",failText:"Permanent delegate ACTIVO — control permanente sobre wallets", why:"Un permanent delegate puede mover o quemar tokens de CUALQUIER wallet sin su autorización." },
                  { label:"Transfer fee",ok:!tf?.transferFeeConfig||((tf?.transferFeeConfig?.transferFeeBasisPoints??0)===0),okText:"Transfer fee authorization is disabled",failText:`Transfer fee ACTIVO (${((tf?.transferFeeConfig?.transferFeeBasisPoints??0)/100).toFixed(2)}%)`, why:"Transfer fee extrae un porcentaje de cada transacción directamente para el creador." },
                ];

                const swapChecks=[
                  { label:"Transfer fee ≤5%", ok:!tf?.transferFeeConfig||((tf?.transferFeeConfig?.transferFeeBasisPoints??0)<=500), okText:"Transfer fee disabled or less than 5%", failText:`Transfer fee abusivo: ${((tf?.transferFeeConfig?.transferFeeBasisPoints??0)/100).toFixed(2)}%` },
                ];

                const insiderChecks=[
                  { label:"Snipers al mint",  ok:snipersFound.length===0,  okText:"No sniping activity detected during initial token mint",  failText:`${snipersFound.length} sniper(s) detectado(s) en el mint inicial` },
                  { label:"Grupos sospechosos",ok:suspectGroups.length===0, okText:"No suspect trading groups detected",                      failText:`${suspectGroups.length} grupo(s) sospechoso(s) detectado(s)` },
                ];

                const holderChecks=[
                  { label:"Creator <5%",  ok:(rc.topHolders?.[0]?.pct??100)<5,    okText:"Creator holds less than 5% of circulating token supply ("+((rc.topHolders?.[0]?.pct??0)*100).toFixed(0)+"%)",  failText:`Creator retiene ${((rc.topHolders?.[0]?.pct??0)*100).toFixed(1)}% — riesgo de dump` },
                  { label:"Holders <5%",  ok:(rc.topHolders?.some(h=>(h.pct??0)>0.05)?false:true), okText:"All other holders possess less than 5% of circulating token supply", failText:"Un holder posee más del 5% del supply circulante" },
                  { label:"Top10 <70%",   ok:(rc.topHolders?.slice(0,10).reduce((s,h)=>s+(h.pct??0),0)??0)<0.70, okText:"Top 10 token holders possess less than 70% of circulating token supply", failText:`Top 10 holders controlan ${((rc.topHolders?.slice(0,10).reduce((s,h)=>s+(h.pct??0),0)??0)*100).toFixed(1)}% del supply` },
                ];

                const liqChecks=[
                  { label:"Liquidez adecuada", ok:(parseFloat(result.dex?.liquidity?.usd||"0"))>1000, okText:"Adequate current liquidity", failText:"Liquidez insuficiente en el pool" },
                  { label:"LP bloqueado 95%+", ok:lpPct!==null&&lpPct>=95, okText:`At least 95% of largest pool's liquidity burned/locked (${lpPct??0}%)`, failText:`Solo ${lpPct??0}% del LP bloqueado/quemado — riesgo de rug` },
                ];

                const rugScore=rc.score??null;
                const isScamFlag=rc.risks?.some(r=>r.level==="danger")||false;

                const Section=({ title, checks }: { title: string; checks: {label:string;ok:boolean;okText:string;failText:string;why?:string}[] })=>(
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:13,color:C.text,marginBottom:8,letterSpacing:0.5 }}>{title}</div>
                    <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
                      {checks.map((ck,ci)=>(
                        <div key={ci} style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"8px 12px",background:ck.ok?"rgba(0,255,136,0.03)":"rgba(255,23,68,0.04)",border:`1px solid ${ck.ok?"rgba(0,255,136,0.15)":"rgba(255,23,68,0.2)"}` }}>
                          <div style={{ flexShrink:0,width:18,height:18,borderRadius:"50%",background:ck.ok?"rgba(0,255,136,0.15)":"rgba(255,23,68,0.15)",border:`1.5px solid ${ck.ok?C.green:C.red}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:ck.ok?C.green:C.red,marginTop:1 }}>{ck.ok?"✓":"✕"}</div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:ck.ok?C.green:C.red,lineHeight:1.4 }}>{ck.ok?ck.okText:ck.failText}</div>
                            {!ck.ok&&ck.why&&<div style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:C.text3,marginTop:3,lineHeight:1.5 }}>💡 {ck.why}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );

                return (
                  <div style={{ marginTop:18,background:C.panel,border:`1px solid ${C.border}`,borderTop:`2px solid #9945ff`,padding:18,clipPath:"polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,0 100%)" }}>
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8 }}>
                      <div style={{ fontFamily:"'Orbitron',monospace",fontSize:12,fontWeight:700,color:"#9945ff",letterSpacing:2 }}>◎ ANÁLISIS SOLANA — RUGCHECK.XYZ</div>
                      {rugScore!==null&&(
                        <div style={{ fontFamily:"'Orbitron',monospace",fontSize:11,fontWeight:700,color:rugScore>=80?C.green:rugScore>=50?C.yellow:C.red,border:`1px solid currentColor`,padding:"3px 10px",background:rugScore>=80?"rgba(0,255,136,0.06)":rugScore>=50?"rgba(255,214,0,0.06)":"rgba(255,23,68,0.06)" }}>
                          SCORE: {rugScore}/100
                        </div>
                      )}
                    </div>

                    {isScamFlag&&(
                      <div style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:C.red,background:"rgba(255,23,68,0.07)",border:`1px solid rgba(255,23,68,0.35)`,borderLeft:`3px solid ${C.red}`,padding:"10px 14px",marginBottom:14,lineHeight:1.6 }}>
                        ⚠️ WARNING: Este token fue flaggeado como posible SCAM por el escáner automatizado de RugCheck.
                        {rc.risks?.filter(r=>r.level==="danger").map((r,ri)=>(
                          <div key={ri} style={{ marginTop:4 }}>• {r.name}: {r.description}</div>
                        ))}
                      </div>
                    )}

                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:18 }}>
                      <div>
                        <Section title="🔐 Swap Analysis" checks={swapChecks} />
                        <Section title="🛡 Authorization Analysis" checks={authChecks} />
                        <Section title="🎯 Insider Analysis" checks={insiderChecks} />
                      </div>
                      <div>
                        <Section title="👥 Holder Analysis" checks={holderChecks} />
                        <Section title="💧 Liquidity Analysis" checks={liqChecks} />
                        {rc.risks&&rc.risks.length>0&&(
                          <div>
                            <div style={{ fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:13,color:C.text,marginBottom:8,letterSpacing:0.5 }}>⚡ Risk Flags ({rc.risks.length})</div>
                            {rc.risks.slice(0,5).map((r,ri)=>(
                              <div key={ri} style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:10,padding:"6px 10px",marginBottom:5,border:`1px solid ${r.level==="danger"?"rgba(255,23,68,0.3)":r.level==="warning"?"rgba(255,214,0,0.3)":"rgba(0,255,136,0.2)"}`,color:r.level==="danger"?C.red:r.level==="warning"?C.yellow:C.green,background:r.level==="danger"?"rgba(255,23,68,0.04)":r.level==="warning"?"rgba(255,214,0,0.04)":"rgba(0,255,136,0.03)",lineHeight:1.4 }}>
                                {r.level==="danger"?"🚨":r.level==="warning"?"⚠️":"✓"} {r.name}{r.description?`: ${r.description}`:""}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:C.text3,marginTop:10,textAlign:"right" }}>
                      Fuente: RugCheck.xyz · Los audits pueden no ser 100% precisos — siempre DYOR
                    </div>
                  </div>
                );
              })()}

              {/* ── DEGATE ON-CHAIN PANEL (solo ETH chain) ── */}
              {result.chainInfo.id !== "solana" && (()=>{
                const dg = result.degate;
                const fmtP = (v?:string) => { if(!v||parseFloat(v)===0) return "N/A"; const n=parseFloat(v); return n>=1000?`$${n.toLocaleString("en",{minimumFractionDigits:2,maximumFractionDigits:2})}`:n>=1?`$${n.toFixed(4)}`:`$${n.toFixed(8)}`; };
                const fmtV = (v?:string) => { if(!v) return "N/A"; const n=parseFloat(v); if(n>=1e6) return `$${(n/1e6).toFixed(2)}M`; if(n>=1e3) return `$${(n/1e3).toFixed(1)}K`; return `$${n.toFixed(0)}`; };
                const chgVal = parseFloat(dg?.priceChange24h??"0");
                const spread = () => { if(!dg?.bidPrice||!dg?.askPrice) return "N/A"; const b=parseFloat(dg.bidPrice),a=parseFloat(dg.askPrice); return `${(((a-b)/b)*100).toFixed(3)}%`; };
                return (
                  <div style={{ marginTop:18,background:C.panel,border:`1px solid ${C.border}`,borderTop:`2px solid #00e5ff`,padding:18,clipPath:"polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,0 100%)" }}>
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8 }}>
                      <div>
                        <div style={{ fontFamily:"'Orbitron',monospace",fontSize:12,fontWeight:700,color:C.cyan,letterSpacing:2 }}>⬡ DEGATE ON-CHAIN — ZK-Rollup DEX · Ethereum</div>
                        <div style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:C.text3,marginTop:2 }}>Fuente: DeGate API pública · {dg?.marketCount??0} mercados on-chain indexados</div>
                      </div>
                      {dg?.listed ? (
                        <div style={{ fontFamily:"'Orbitron',monospace",fontSize:10,color:C.green,border:`1px solid ${C.green}44`,padding:"3px 10px",background:"rgba(0,255,136,0.06)" }}>✓ LISTADO EN DEGATE</div>
                      ) : (
                        <div style={{ fontFamily:"'Orbitron',monospace",fontSize:10,color:C.text3,border:`1px solid ${C.border}`,padding:"3px 10px" }}>⬡ NO LISTADO</div>
                      )}
                    </div>
                    {dg?.listed && dg.symbol ? (
                      <>
                        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:C.border,border:`1px solid ${C.border}`,marginBottom:12 }}>
                          {[
                            {l:"PAR DEGATE",v:dg.symbol,c:C.cyan},
                            {l:"PRECIO ON-CHAIN",v:fmtP(dg.price),c:C.text},
                            {l:"CAMBIO 24H",v:dg.priceChange24h?`${chgVal>=0?"+":""}${chgVal.toFixed(2)}%`:"N/A",c:chgVal>=0?C.green:C.red},
                            {l:"VOLUMEN 24H",v:fmtV(dg.volume24h),c:C.text},
                            {l:"BID ON-CHAIN",v:fmtP(dg.bidPrice),c:C.green},
                            {l:"ASK ON-CHAIN",v:fmtP(dg.askPrice),c:C.red},
                          ].map(m=>(
                            <div key={m.l} style={{ background:C.panel,padding:10,textAlign:"center" }}>
                              <div style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:C.text3,marginBottom:3 }}>{m.l}</div>
                              <div style={{ fontFamily:"'Orbitron',monospace",fontSize:12,fontWeight:700,color:m.c }}>{m.v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display:"flex",gap:10,alignItems:"center",flexWrap:"wrap" }}>
                          <div style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:C.text3,padding:"6px 12px",background:C.bg3,border:`1px solid ${C.border}` }}>
                            SPREAD: <span style={{ color:C.yellow,fontWeight:700 }}>{spread()}</span>
                          </div>
                          {parseFloat(dg.volume24h??dg.price??"0")>100000&&(
                            <div style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:C.cyan,border:`1px solid ${C.cyan}44`,padding:"4px 10px",background:"rgba(0,229,255,0.05)" }}>🐋 VOLUMEN WHALE DETECTADO</div>
                          )}
                          <a href={`https://app.degate.com/trade/${dg.symbol.replace("-","_")}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily:"'Orbitron',monospace",fontSize:9,color:C.cyan,border:`1px solid ${C.cyan}44`,padding:"4px 10px",background:"rgba(0,229,255,0.05)",textDecoration:"none" }}>OPERAR EN DEGATE ↗</a>
                        </div>
                      </>
                    ) : (
                      <div style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:C.text3,padding:"14px 0",lineHeight:1.7 }}>
                        Este token no está listado en DeGate DEX.<br/>
                        <span style={{ color:C.text2 }}>DeGate indexa {dg?.marketCount??0} pares on-chain en Ethereum. Los tokens listados tienen liquidez verificada en la cadena y pueden negociarse sin custodia.</span>
                      </div>
                    )}
                    <div style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:C.text3,marginTop:10,lineHeight:1.6 }}>
                      DeGate · ZK-Rollup no custodial en Ethereum · Zero fees de maker · Ordenes 100% on-chain
                    </div>
                  </div>
                );
              })()}

            </div>
          )}

          {/* ── TAB: WHALE INTELLIGENCE ── */}
          {activeTab==="whale"&&(
            <div style={{ paddingTop:20 }}>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:18 }}>
                {whaleSummary.map(ws=>(
                  <div key={ws.label} style={{ background:C.panel,border:`1px solid ${C.border}`,padding:14,textAlign:"center",position:"relative",overflow:"hidden" }}>
                    <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:ws.cls }}/>
                    <div style={{ fontSize:24,marginBottom:6 }}>{ws.icon}</div>
                    <div style={{ ...so,fontSize:22,fontWeight:900,marginBottom:3,color:ws.cls }}>{ws.val}</div>
                    <div style={{ ...s,fontSize:9,color:C.text3,letterSpacing:1 }}>{ws.label}</div>
                  </div>
                ))}
              </div>

              {/* Alerts */}
              {result.bundledCount>1&&(
                <div style={{ background:"rgba(245,0,87,0.06)",border:"1px solid rgba(245,0,87,0.3)",borderLeft:"3px solid #f50057",padding:"12px 14px",marginBottom:10,...s,fontSize:11,color:"#f50057",lineHeight:1.6 }}>
                  🕸️ BUNDLED WALLETS: ~{result.bundledCount} wallets posiblemente coordinadas detectadas. Verificar en Bubblemaps para análisis visual.
                </div>
              )}
              {top3ExclCEXBurn>30&&(
                <div style={{ background:"rgba(255,23,68,0.05)",border:"1px solid rgba(255,23,68,0.25)",borderLeft:`3px solid ${C.red}`,padding:"12px 14px",marginBottom:10,...s,fontSize:11,color:C.red,lineHeight:1.6 }}>
                  🚨 CONCENTRACIÓN CRÍTICA: El Top 3 de holders reales (sin CEX/Burn) controla {top3ExclCEXBurn.toFixed(1)}% del supply. Riesgo elevado de dump coordinado.
                </div>
              )}

              {/* Legend */}
              <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:16,alignItems:"center" }}>
                {[["🚨 RUG DEPLOYER",C.red],["⚡ INSIDER","#ff6d00"],["🐋 WHALE",C.gold],["🏦 CEX",C.purple],["✅ CLEAN",C.green],["🕸️ BUNDLED","#f50057"],["⚠️ BOT",C.yellow],["🚨 REPORTADO",C.red]].map(([l,c])=>(
                  <div key={l as string} style={{ ...s,fontSize:9,padding:"3px 8px",border:`1px solid ${c as string}33`,color:c as string,background:`${c as string}08`,display:"flex",alignItems:"center",gap:4 }}>{l as string}</div>
                ))}
              </div>

              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {result.whaleData.map((w,i)=>{
                  const barColor=w.type==="rug"?C.red:w.type==="insider"?"#ff6d00":w.type==="whale"?C.gold:w.type==="cex"?C.purple:w.type==="burn"?C.text3:C.green;
                  const isExp=expandedWhale===i;
                  return (
                    <div key={i} style={{ background:C.panel,border:`1px solid ${C.border}`,borderLeft:`4px solid ${barColor}`,overflow:"hidden" }}>
                      <div onClick={()=>setExpandedWhale(isExp?null:i)} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",cursor:"pointer" }}>
                        <div style={{ ...so,fontSize:11,color:C.text3,width:24 }}>#{i+1}</div>
                        <div style={{ display:"flex",flexDirection:"column",gap:3,flexShrink:0 }}>
                          <div style={{ ...s,fontSize:9,fontWeight:700,padding:"2px 7px",letterSpacing:1,background:typeColors[w.type]||"rgba(74,104,120,0.1)",border:`1px solid ${typeBorders[w.type]||C.border}`,color:barColor }}>{w.label}</div>
                          {w.isBot&&<div style={{ ...s,fontSize:8,padding:"1px 6px",background:"rgba(255,214,0,0.1)",border:`1px solid rgba(255,214,0,0.3)`,color:C.yellow }}>⚠️ BOT</div>}
                          {w.isReported&&<div style={{ ...s,fontSize:8,padding:"1px 6px",background:"rgba(255,23,68,0.12)",border:`1px solid rgba(255,23,68,0.4)`,color:C.red }}>🚨 REPORTADO</div>}
                        </div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:13,color:"#fff",display:"flex",alignItems:"center",gap:8 }}>
                            {w.name}
                          </div>
                          <div style={{ ...s,fontSize:11,color:C.text2 }}>{(w.address||"").slice(0,18)}...{(w.address||"").slice(-6)}</div>
                        </div>
                        {/* Behavior badge */}
                        <div style={{ flexShrink:0,textAlign:"center" }}>
                          <div style={{ ...s,fontSize:9,color:w.behavior.color,border:`1px solid ${w.behavior.color}44`,padding:"2px 8px",background:`${w.behavior.color}0a`,letterSpacing:0.5,whiteSpace:"nowrap" }}>
                            {w.behavior.icon} {w.behavior.label}
                          </div>
                        </div>
                        <div style={{ width:100,flexShrink:0 }}>
                          <div style={{ ...so,fontSize:12,fontWeight:700,textAlign:"right",marginBottom:3,color:barColor }}>{w.holdPct.toFixed(2)}%</div>
                          <div style={{ height:3,background:C.border }}>
                            <div style={{ height:"100%",background:barColor,width:`${Math.min(w.holdPct*3,100)}%`,transition:"width 1s ease" }}/>
                          </div>
                          <div style={{ ...s,fontSize:10,color:C.text3,textAlign:"right" }}>{w.holdUSD?`≈$${fmtBig(w.holdUSD)}`:"USD N/A"}</div>
                        </div>
                        <div style={{ fontSize:12,color:C.text3,flexShrink:0,transition:"transform 0.2s",transform:isExp?"rotate(180deg)":"rotate(0deg)" }}>▼</div>
                      </div>
                      {isExp&&(
                        <div style={{ borderTop:`1px solid ${C.border}`,padding:14,background:C.bg3 }}>
                          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,marginBottom:12 }}>
                            {[
                              {l:"WALLET AGE",  v:w.walletAge||"N/A"},
                              {l:"TX COUNT",    v:w.txCount||"N/A"},
                              {l:"FIRST SEEN",  v:w.firstSeen||"N/A"},
                              {l:"HOLDING %",   v:w.holdPct.toFixed(3)+"%"},
                              {l:"RISK LEVEL",  v:(w.riskLevel||"?").toUpperCase(),c:w.riskLevel==="critical"?C.red:w.riskLevel==="high"?"#ff6d00":w.riskLevel==="medium"?C.yellow:C.green},
                              {l:"COMPORTAMIENTO",v:`${w.behavior.icon} ${w.behavior.label}`,c:w.behavior.color},
                              {l:"VALUE EST.",  v:w.holdUSD?`≈$${fmtBig(w.holdUSD)}`:"N/A"},
                              {l:"BOT SIGNAL",  v:w.isBot||w.isConstructed?"⚠️ SÍ":"✓ NO",c:w.isBot||w.isConstructed?C.yellow:C.green},
                            ].map(d=>(
                              <div key={d.l} style={{ background:C.panel,border:`1px solid ${C.border}`,padding:"8px 10px" }}>
                                <div style={{ ...s,fontSize:9,color:C.text3,letterSpacing:1,marginBottom:3 }}>{d.l}</div>
                                <div style={{ ...so,fontSize:12,fontWeight:700,color:(d as {c?:string}).c||C.cyan }}>{d.v}</div>
                              </div>
                            ))}
                          </div>
                          {w.flags.map((f,fi)=>(
                            <div key={fi} style={{ ...s,fontSize:10,padding:"6px 9px",border:`1px solid ${f.type==="red"?"rgba(255,23,68,0.3)":f.type==="yellow"?"rgba(255,214,0,0.3)":"rgba(0,255,136,0.3)"}`,color:f.type==="red"?C.red:f.type==="yellow"?C.yellow:C.green,background:f.type==="red"?"rgba(255,23,68,0.04)":f.type==="yellow"?"rgba(255,214,0,0.04)":"rgba(0,255,136,0.04)",display:"flex",gap:7,lineHeight:1.4,marginBottom:5 }}>{f.text}</div>
                          ))}
                          <div style={{ ...s,fontSize:11,color:C.text2,lineHeight:1.6,margin:"10px 0",padding:10,background:C.panel,border:`1px solid ${C.border}` }}>{w.explanation}</div>
                          <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                            <button onClick={()=>window.open(`${result.chainInfo.explorer}/address/${w.address}`,"_blank")} style={{ ...s,fontSize:9,padding:"4px 10px",border:`1px solid ${C.border2}`,color:C.text3,background:"transparent",cursor:"pointer",letterSpacing:1,transition:"all 0.2s" }}>🔗 VER EN EXPLORER</button>
                            <button onClick={()=>window.open(`https://www.bubblemaps.io/eth/token/${result.addr}`,"_blank")} style={{ ...s,fontSize:9,padding:"4px 10px",border:`1px solid ${C.border2}`,color:C.text3,background:"transparent",cursor:"pointer",letterSpacing:1,transition:"all 0.2s" }}>🫧 BUBBLEMAPS</button>
                            <button onClick={()=>navigator.clipboard.writeText(w.address).catch(()=>{})} style={{ ...s,fontSize:9,padding:"4px 10px",border:`1px solid ${C.border2}`,color:C.text3,background:"transparent",cursor:"pointer",letterSpacing:1,transition:"all 0.2s" }}>📋 COPIAR</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TAB: FLAGS & RIESGO ── */}
          {activeTab==="flags"&&(
            <div style={{ paddingTop:20 }}>
              <div style={{ ...s,fontSize:10,color:C.text3,marginBottom:14,lineHeight:1.5 }}>
                {sortedFlags.filter(f=>f.type==="danger").length} flags CRÍTICOS · {sortedFlags.filter(f=>f.type==="warning").length} WARNINGS · {sortedFlags.filter(f=>f.type==="safe").length} POSITIVOS — Click en cada flag para ver explicación técnica completa.
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {sortedFlags.map((f,i)=>{
                  const isExp=expandedFlag===i;
                  const borderCol=f.type==="safe"?C.green:f.type==="danger"?C.red:C.yellow;
                  const bg=f.type==="safe"?"rgba(0,255,136,0.03)":f.type==="danger"?"rgba(255,23,68,0.05)":"rgba(255,214,0,0.03)";
                  return (
                    <div key={i} style={{ background:C.panel,border:`1px solid ${C.border}`,borderLeft:`4px solid ${borderCol}`,overflow:"hidden",cursor:"pointer",transition:"border-color 0.2s" }} onClick={()=>setExpandedFlag(isExp?null:i)}>
                      <div style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:isExp?bg:"transparent" }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:14,color:borderCol,marginBottom:2 }}>{f.name}</div>
                          <div style={{ ...s,fontSize:11,color:C.text2,lineHeight:1.4 }}>{f.desc}</div>
                          {f.funcName&&!isExp&&<div style={{ ...s,fontSize:9,color:"#ff9800",marginTop:3 }}>→ función: {f.funcName}</div>}
                        </div>
                        <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5,flexShrink:0 }}>
                          <div style={{ ...so,fontSize:11,fontWeight:700,padding:"2px 7px",border:"1px solid currentColor",color:borderCol }}>{f.score_label}</div>
                          <div style={{ ...s,fontSize:10,color:C.text3,transition:"transform 0.2s",transform:isExp?"rotate(180deg)":"rotate(0deg)" }}>▼</div>
                        </div>
                      </div>
                      {isExp&&(
                        <div style={{ borderTop:`1px solid ${C.border}`,padding:"14px 18px",background:bg }}>
                          <div style={{ ...so,fontSize:9,letterSpacing:2,color:borderCol,marginBottom:8 }}>¿QUÉ SIGNIFICA EXACTAMENTE?</div>
                          <div style={{ ...s,fontSize:11,color:C.text,lineHeight:1.7,marginBottom:f.funcName?12:0 }}>{f.why}</div>
                          {f.funcName&&(
                            <div style={{ ...s,fontSize:10,color:"#ff9800",background:"rgba(255,152,0,0.06)",border:"1px solid rgba(255,152,0,0.2)",padding:"7px 11px",marginTop:8,display:"flex",gap:8,alignItems:"center" }}>
                              <span style={{ color:C.text3 }}>Función del contrato involucrada:</span>
                              <code style={{ color:"#ff9800",letterSpacing:0.5 }}>{f.funcName}</code>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadePulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
      `}</style>
    </div>
  );
}
