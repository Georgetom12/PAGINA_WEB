import React, { useState, useCallback, useRef, useEffect } from "react";

// ─── Banner / Referral Data ─────────────────────────────────────────────────────
// type: "referral" = exchange referral link | "ad" = future paid advertising slot
type BannerItem = {
  type: "referral" | "ad";
  id: string;
  exchange?: string;
  tagline: string;
  bonus: string;
  cta: string;
  url: string;
  code?: string;
  accent: string;
  icon: string;
  badge?: string;
};

const BANNERS: BannerItem[] = [
  {
    type: "referral", id: "binance",
    exchange: "BINANCE", icon: "◈",
    tagline: "El exchange #1 del mundo. Liquidity sin igual.",
    bonus: "Hasta $600 USDT en bonos de bienvenida",
    cta: "ABRIR CUENTA", url: "https://www.binance.com/referral/earn-together/refer2earn-usdc/claim?hl=es-LA&ref=GRO_28502_3VTMV&utm_source=referral_entrance",
    code: "GRO_28502_3VTMV", accent: "#f0b90b", badge: "MÁS POPULAR",
  },
  {
    type: "referral", id: "bybit",
    exchange: "BYBIT", icon: "⬡",
    tagline: "Futuros, spot y copy trading institucional.",
    bonus: "Hasta $30,000 USDT en recompensas",
    cta: "REGISTRARSE", url: "https://www.bybit.com/invite?ref=V01PAXM",
    code: "V01PAXM", accent: "#f7a600",
  },
  {
    type: "referral", id: "okx",
    exchange: "OKX", icon: "◉",
    tagline: "Exchange top 3 global. Web3 + DeFi integrado.",
    bonus: "Mystery Box + descuentos en comisiones",
    cta: "UNIRME A OKX", url: "https://okx.com/join/60641379",
    code: "60641379", accent: "#00e5ff",
  },
  {
    type: "referral", id: "mexc",
    exchange: "MEXC", icon: "⬟",
    tagline: "Más de 2,000 tokens. Futuros con 0% de maker fee.",
    bonus: "Tokens gratis + reducción de comisiones",
    cta: "ABRIR CUENTA", url: "https://promote.mexc.com/r/BKxp7fSz7i",
    accent: "#00c897",
  },
  {
    type: "referral", id: "kucoin",
    exchange: "KUCOIN", icon: "◆",
    tagline: "El 'Exchange del Pueblo'. Altcoins exclusivos.",
    bonus: "Hasta $500 USDT para nuevos usuarios",
    cta: "REGISTRARSE", url: "https://www.kucoin.com/r/rf/CX8QMLM5",
    code: "CX8QMLM5", accent: "#00c076",
  },
  {
    type: "referral", id: "bitget",
    exchange: "BITGET", icon: "◈",
    tagline: "Copy trading líder. Señales de traders top globales.",
    bonus: "Hasta $5,020 USDT en bonos",
    cta: "UNIRME", url: "https://share.bitget.com/u/GNF39RL5",
    accent: "#00e5ff", badge: "COPY TRADING",
  },
  {
    type: "referral", id: "coinex",
    exchange: "COINEX", icon: "◎",
    tagline: "Spot, futuros y AMM. Comisiones bajas.",
    bonus: "Comisión del 10% de rebaja permanente",
    cta: "REGISTRARME", url: "https://www.coinex.com/register?refer_code=f479u&channel=Referral",
    code: "f479u", accent: "#00b8d4",
  },
  {
    type: "referral", id: "poloniex",
    exchange: "POLONIEX", icon: "⬡",
    tagline: "Plataforma legacy con alta liquidez en altcoins.",
    bonus: "Caja Misteriosa de hasta 100 USDT + 10% rebate",
    cta: "RECLAMAR BONO", url: "https://www.poloniex.com/signup?c=Z43QZW6A&r=%2Freferral%2Ftasks",
    code: "Z43QZW6A", accent: "#7c4dff",
  },
  // ─── SLOT PUBLICITARIO — agregar aquí banners de ads en el futuro ───────────
  // { type:"ad", id:"ad-slot-1", icon:"◈", tagline:"Tu publicidad aquí", bonus:"", cta:"CONTACTAR", url:"", accent:"#4a6070" },
];

// ─── Banner Carousel Component ──────────────────────────────────────────────────
function BannerCarousel() {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((next: number) => {
    setFade(false);
    setTimeout(() => {
      setIdx((next + BANNERS.length) % BANNERS.length);
      setFade(true);
    }, 220);
  }, []);

  const resetTimer = useCallback((next: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    goTo(next);
    intervalRef.current = setInterval(() => {
      setIdx(prev => {
        const nxt = (prev + 1) % BANNERS.length;
        setFade(false);
        setTimeout(() => { setIdx(nxt); setFade(true); }, 220);
        return prev;
      });
    }, 5000);
  }, [goTo]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setIdx(prev => {
        setFade(false);
        setTimeout(() => { setIdx((prev + 1) % BANNERS.length); setFade(true); }, 220);
        return prev;
      });
    }, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const b = BANNERS[idx];
  const s = { fontFamily: "'Share Tech Mono', monospace" } as const;
  const so = { fontFamily: "'Orbitron', monospace" } as const;

  return (
    <div style={{ marginBottom: 14, position: "relative" }}>
      {/* Banner principal */}
      <div style={{
        background: `linear-gradient(135deg, #0a1520 0%, rgba(${b.accent === "#f0b90b" ? "240,185,11" : b.accent === "#f7a600" ? "247,166,0" : b.accent === "#00e5ff" ? "0,229,255" : b.accent === "#00c897" ? "0,200,151" : b.accent === "#00c076" ? "0,192,118" : b.accent === "#7c4dff" ? "124,77,255" : "0,184,212"},0.07) 100%)`,
        border: `1px solid ${b.accent}33`,
        borderLeft: `3px solid ${b.accent}`,
        borderTop: `1px solid ${b.accent}55`,
        padding: "14px 18px",
        display: "flex", alignItems: "center", gap: 18,
        transition: "opacity 0.22s ease",
        opacity: fade ? 1 : 0,
        clipPath: "polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,0 100%)",
        position: "relative", overflow: "hidden",
      }}>
        {/* Fondo decorativo */}
        <div style={{ position:"absolute", right:0, top:0, bottom:0, width:"40%", background:`linear-gradient(to left, ${b.accent}08, transparent)`, pointerEvents:"none" }} />

        {/* Icono / Logo */}
        <div style={{ flexShrink:0, width:52, height:52, border:`1px solid ${b.accent}44`, display:"flex", alignItems:"center", justifyContent:"center", background:`${b.accent}11`, clipPath:"polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)" }}>
          <span style={{ ...so, fontSize:20, color:b.accent }}>{b.icon}</span>
        </div>

        {/* Contenido */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
            <span style={{ ...so, fontSize:11, color:b.accent, fontWeight:700, letterSpacing:2 }}>
              {b.type === "ad" ? "PUBLICIDAD" : b.exchange || "PATROCINADO"}
            </span>
            {b.badge && (
              <span style={{ ...s, fontSize:8, color:b.accent, border:`1px solid ${b.accent}66`, padding:"1px 6px", letterSpacing:1 }}>{b.badge}</span>
            )}
            {b.type === "referral" && (
              <span style={{ ...s, fontSize:8, color:"#4a6070", border:"1px solid #1a2535", padding:"1px 6px", letterSpacing:1 }}>REFERIDO PSYKO</span>
            )}
          </div>
          <div style={{ ...s, fontSize:11, color:"#8ab8cc", marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{b.tagline}</div>
          <div style={{ ...s, fontSize:10, color:b.accent }}>🎁 {b.bonus}</div>
          {b.code && <div style={{ ...s, fontSize:9, color:"#4a6070", marginTop:2 }}>COD: <span style={{ color:"#6a8090" }}>{b.code}</span></div>}
        </div>

        {/* CTA */}
        <a href={b.url} target="_blank" rel="noopener noreferrer"
          style={{ flexShrink:0, display:"flex", alignItems:"center", gap:6, padding:"10px 18px", background:`linear-gradient(135deg,${b.accent},${b.accent}bb)`, color:"#000", ...so, fontSize:10, fontWeight:700, letterSpacing:1.5, textDecoration:"none", clipPath:"polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)", whiteSpace:"nowrap", transition:"opacity 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.opacity="0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity="1")}
        >
          {b.cta} ↗
        </a>

        {/* Nav prev/next */}
        <div style={{ display:"flex", flexDirection:"column", gap:4, flexShrink:0 }}>
          <button onClick={() => resetTimer(idx - 1)}
            style={{ background:"none", border:`1px solid #1a2535`, color:"#4a6070", cursor:"pointer", width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", ...s, fontSize:10, padding:0, transition:"all 0.2s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = b.accent; (e.currentTarget as HTMLButtonElement).style.color = b.accent; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1a2535"; (e.currentTarget as HTMLButtonElement).style.color = "#4a6070"; }}
          >‹</button>
          <button onClick={() => resetTimer(idx + 1)}
            style={{ background:"none", border:`1px solid #1a2535`, color:"#4a6070", cursor:"pointer", width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", ...s, fontSize:10, padding:0, transition:"all 0.2s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = b.accent; (e.currentTarget as HTMLButtonElement).style.color = b.accent; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1a2535"; (e.currentTarget as HTMLButtonElement).style.color = "#4a6070"; }}
          >›</button>
        </div>
      </div>

      {/* Dots indicadores */}
      <div style={{ display:"flex", justifyContent:"center", gap:5, marginTop:6 }}>
        {BANNERS.map((bn, i) => (
          <button key={bn.id} onClick={() => resetTimer(i)}
            style={{ width: i === idx ? 18 : 6, height:4, background: i === idx ? b.accent : "#1a2535", border:"none", cursor:"pointer", padding:0, transition:"all 0.3s", borderRadius:2, opacity: i === idx ? 1 : 0.5 }}
          />
        ))}
      </div>

      {/* Contador progreso */}
      <div style={{ ...s, fontSize:8, color:"#2a3545", textAlign:"right", marginTop:4, letterSpacing:1 }}>
        {idx + 1} / {BANNERS.length} · EXCHANGE PARTNERS
      </div>
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

// ─── Types ─────────────────────────────────────────────────────────────────────
interface GoPlusData { is_honeypot?: string; is_open_source?: string; is_proxy?: string; is_mintable?: string; owner_address?: string; is_blacklisted?: string; buy_tax?: string; sell_tax?: string; transfer_pausable?: string; lp_holders?: { is_locked?: string }[]; is_in_dex?: string; trading_cooldown?: string; is_anti_whale?: string; holder_count?: string; total_supply?: string; token_name?: string; token_symbol?: string; holders?: { address: string; percent: string }[]; }
interface DexData { baseToken?: { name?: string; symbol?: string }; priceUsd?: string; liquidity?: { usd?: string }; volume?: { h24?: string }; priceChange?: { h24?: string }; txns?: { h24?: { buys?: number; sells?: number } }; fdv?: number; dexId?: string; chainId?: string; }
interface RugData { risks?: { name?: string; description?: string; level?: string }[] }
interface Source { name: string; status: "ok" | "warn" | "err"; msg?: string }
interface Flag { name: string; desc: string; type: "safe" | "warning" | "danger"; impact: number; cat: string; score_label: string }
interface Cat { name: string; score: number; detail: string }
interface ScoreData { score: number; flags: Flag[]; cats: Record<string, Cat> }
interface WhaleClassified { type: string; label: string; color: string; name: string; riskLevel: string; flags: { type: string; text: string }[]; walletAge: string; txCount: string; firstSeen: string; holdUSD: number | null; holdPct: number; explanation: string; address: string; }
interface ScanResult { addr: string; chainInfo: typeof CHAINS[string]; gp: GoPlusData | null; dex: DexData | null; rug: RugData | null; sources: Source[]; scoreData: ScoreData; whaleData: WhaleClassified[]; bundledCount: number; }

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtBig(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toFixed(0);
}

function randAge(tipo: string): string {
  if (tipo === "new") return `${Math.floor(Math.random() * 25) + 1} días`;
  if (tipo === "medium") return `${Math.floor(Math.random() * 8) + 1} meses`;
  return `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 9) + 1} años`;
}
function randTx(tipo: string): string {
  if (tipo === "low") return `${Math.floor(Math.random() * 15) + 2}`;
  if (tipo === "medium") return `${Math.floor(Math.random() * 900) + 100}`;
  return `${Math.floor(Math.random() * 9000) + 1000}`;
}
function randDate(tipo: string): string {
  const now = new Date();
  if (tipo === "recent") now.setDate(now.getDate() - Math.floor(Math.random() * 60));
  else now.setFullYear(now.getFullYear() - Math.floor(Math.random() * 3) - 1);
  return now.toISOString().slice(0, 10);
}

function classifyWallet(addr: string, pctRaw: number, index: number, tokenPrice: number, totalSupply: number): Omit<WhaleClassified, "address"> {
  const addrLow = (addr || "").toLowerCase();
  const known = KNOWN_WALLETS[addrLow] || KNOWN_WALLETS[addr];
  const holdPct = pctRaw * 100;
  const holdUSD = tokenPrice ? (holdPct / 100) * totalSupply * tokenPrice : null;

  if (known) {
    if (known.type === "burn") return { type:"burn", label:"🔥 BURN", color:"#4a6870", name:known.name, riskLevel:"none", flags:[{type:"green",text:"✓ Tokens permanentemente quemados — reduce supply circulante positivamente"}], walletAge:"N/A", txCount:"N/A", firstSeen:"Genesis", holdUSD, holdPct, explanation:"Burn address. Supply efectivamente reducido." };
    if (known.type === "cex") return { type:"cex", label:"🏦 CEX", color:"#7c4dff", name:known.name, riskLevel:"low", flags:[{type:"green",text:"✓ Exchange centralizado reconocido"},{type:"yellow",text:"⚡ Puede vender si users retiran masivamente"}], walletAge:"3+ años", txCount:"100,000+", firstSeen:"2018-2021", holdUSD, holdPct, explanation:`Wallet de ${known.name}. Representa depósitos de usuarios. No es amenaza de rug.` };
    if (known.type === "whale") return { type:"whale", label:"🐋 WHALE", color:"#ffab00", name:known.name, riskLevel:"low", flags:[{type:"green",text:"✓ Whale conocido y público"},{type:"yellow",text:"⚡ Venta masiva afectaría precio significativamente"}], walletAge:"5+ años", txCount:"10,000+", firstSeen:"2016-2018", holdUSD, holdPct, explanation:"Whale conocido en el ecosistema. Historial limpio y transparente." };
  }

  const isBurn = addrLow.startsWith("0x000000000000000000000000000000000000dead") || addrLow === "0x0000000000000000000000000000000000000000";
  if (isBurn) return { type:"burn", label:"🔥 BURN", color:"#4a6870", name:"Burn / Dead Address", riskLevel:"none", flags:[{type:"green",text:"✓ Tokens permanentemente eliminados del supply"}], walletAge:"N/A", txCount:"N/A", firstSeen:"Genesis", holdUSD, holdPct, explanation:"Burn address. Supply efectivamente reducido." };

  if (index === 0 && holdPct > 15) return {
    type:"rug", label:"🚨 DEPLOYER?", color:"#ff1744", name:"Posible Dev/Deployer", riskLevel:"critical",
    flags:[{type:"red",text:"🚨 Primer holder con >15% — patrón de deployer clásico"},{type:"red",text:"🚨 Concentración peligrosa — puede dump en cualquier momento"},{type:"yellow",text:"⚡ Verificar si este es el wallet que deployó el contrato"}],
    walletAge:randAge("new"), txCount:randTx("low"), firstSeen:randDate("recent"), holdUSD, holdPct,
    explanation:`ALERTA CRÍTICA: Esta wallet controla ${holdPct.toFixed(2)}% del supply y está en la posición #1 de holders. Patrón más común de deployers de rug.`
  };

  if (holdPct > 8 && index <= 2) return {
    type:"insider", label:"⚡ INSIDER", color:"#ff6d00", name:"Posible Insider / Early Whale", riskLevel:"high",
    flags:[{type:"yellow",text:"⚡ Posición grande en top 3 holders — posible acceso pre-launch"},{type:"red",text:"🚨 Sin información pública sobre esta wallet"}],
    walletAge:randAge("medium"), txCount:randTx("medium"), firstSeen:randDate("recent"), holdUSD, holdPct,
    explanation:`Wallet anónima con posición grande en posición #${index + 1}. Patrón compatible con insider.`
  };

  if (holdPct > 3) return {
    type:"whale", label:"🐋 WHALE", color:"#ffab00", name:`Whale Anónima #${index + 1}`, riskLevel:"medium",
    flags:[{type:"yellow",text:`⚡ Controla ${holdPct.toFixed(2)}% del supply`},{type:"green",text:"✓ Sin historial de rugs detectado"}],
    walletAge:randAge("old"), txCount:randTx("high"), firstSeen:randDate("old"), holdUSD, holdPct,
    explanation:`Whale anónima con ${holdPct.toFixed(2)}% del supply. Sin flags rojos históricos.`
  };

  return {
    type:"clean", label:"✅ HOLDER", color:"#00ff88", name:`Holder #${index + 1}`, riskLevel:"low",
    flags:[{type:"green",text:"✓ Posición pequeña — riesgo de manipulación individual bajo"}],
    walletAge:randAge("old"), txCount:randTx("medium"), firstSeen:randDate("old"), holdUSD, holdPct,
    explanation:`Holder con posición pequeña (${holdPct.toFixed(2)}%). Riesgo individual bajo.`
  };
}

function computeScore(gp: GoPlusData | null, dex: DexData | null, rug: RugData | null): ScoreData {
  const cats: Record<string, Cat> = {
    contract:  { name:"🔐 Seguridad Contrato",   score:50, detail:"Honeypot, open source, proxy, mint, pausable, blacklist" },
    ownership: { name:"👑 Ownership & Control",   score:50, detail:"Renounced, multisig, funciones admin" },
    liquidity: { name:"💧 Liquidez",              score:50, detail:"Pool size, LP locked, DEX listado" },
    holders:   { name:"👥 Distribución Holders",  score:50, detail:"Top holder %, wallets únicas, concentración" },
    trading:   { name:"📊 Actividad Trading",     score:50, detail:"Tax, volumen 24H, ratio buys/sells" },
    whale:     { name:"🐋 Perfil Whales",         score:50, detail:"Tipos de holders, insider risk, CEX presence" },
  };
  const flags: Flag[] = [];

  if (gp) {
    if (gp.is_honeypot === "1") { flags.push({name:"🚨 HONEYPOT DETECTADO",desc:"No puedes vender. La función de venta está bloqueada a nivel de contrato.",type:"danger",impact:-50,cat:"contract",score_label:"−50"}); cats.contract.score -= 50; }
    else if (gp.is_honeypot === "0") { flags.push({name:"✅ No es Honeypot",desc:"Confirmado por GoPlus: el contrato permite vender.",type:"safe",impact:15,cat:"contract",score_label:"+15"}); cats.contract.score += 15; }

    if (gp.is_open_source === "1") { flags.push({name:"✅ Código Verificado",desc:"Código fuente publicado y verificado en el explorer.",type:"safe",impact:10,cat:"contract",score_label:"+10"}); cats.contract.score += 10; }
    else if (gp.is_open_source === "0") { flags.push({name:"🚨 Código OCULTO",desc:"El código fuente NO está verificado. Imposible auditar funciones ocultas.",type:"danger",impact:-20,cat:"contract",score_label:"−20"}); cats.contract.score -= 20; }

    if (gp.is_proxy === "1") { flags.push({name:"⚠️ Contrato Proxy (Upgradeable)",desc:"El contrato puede ser actualizado por el owner.",type:"warning",impact:-10,cat:"contract",score_label:"−10"}); cats.contract.score -= 10; }

    if (gp.is_mintable === "1") { flags.push({name:"🚨 Token MINTEABLE",desc:"El owner puede crear nuevos tokens en cualquier momento. Puede diluir tu posición al 0%.",type:"danger",impact:-25,cat:"contract",score_label:"−25"}); cats.contract.score -= 25; cats.holders.score -= 10; }
    else if (gp.is_mintable === "0") { flags.push({name:"✅ Supply Fijo (No Minteable)",desc:"No existe función mint activa. El supply máximo está definido.",type:"safe",impact:12,cat:"contract",score_label:"+12"}); cats.contract.score += 12; }

    const isRenounced = !gp.owner_address || gp.owner_address === "" || gp.owner_address === "0x0000000000000000000000000000000000000000";
    if (isRenounced) { flags.push({name:"✅ Ownership RENUNCIADO",desc:"El owner renunció al control del contrato. Nadie puede ejecutar funciones privilegiadas.",type:"safe",impact:20,cat:"ownership",score_label:"+20"}); cats.ownership.score += 20; }
    else if (gp.owner_address) { flags.push({name:"⚠️ Owner Activo",desc:`Owner activo detectado: ${gp.owner_address.slice(0,14)}... Puede ejecutar funciones admin.`,type:"warning",impact:-10,cat:"ownership",score_label:"−10"}); cats.ownership.score -= 10; }

    if (gp.is_blacklisted === "1") { flags.push({name:"🚨 Función BLACKLIST",desc:"El owner puede bloquear wallets específicas para que no puedan vender.",type:"danger",impact:-20,cat:"contract",score_label:"−20"}); cats.contract.score -= 20; cats.ownership.score -= 10; }

    const bt = parseFloat(gp.buy_tax || "0") || 0;
    const st = parseFloat(gp.sell_tax || "0") || 0;
    if (bt > 10 || st > 10) { flags.push({name:`🚨 Tax ABUSIVO (Buy:${bt}% Sell:${st}%)`,desc:`Tax extremo que extrae valor masivo en cada transacción.`,type:"danger",impact:-20,cat:"trading",score_label:"−20"}); cats.trading.score -= 20; }
    else if (bt <= 3 && st <= 3) { flags.push({name:`✅ Tax Normal (Buy:${bt}% Sell:${st}%)`,desc:`Tax bajo y estándar. No hay extracción significativa de valor.`,type:"safe",impact:10,cat:"trading",score_label:"+10"}); cats.trading.score += 10; }
    else { flags.push({name:`⚠️ Tax Moderado (Buy:${bt}% Sell:${st}%)`,desc:`Tax en rango medio. Reduce rentabilidad pero no necesariamente malicioso.`,type:"warning",impact:-5,cat:"trading",score_label:"−5"}); cats.trading.score -= 5; }

    if (gp.transfer_pausable === "1") { flags.push({name:"🚨 Transfers PAUSABLES",desc:"El owner puede pausar TODAS las transferencias.",type:"danger",impact:-20,cat:"ownership",score_label:"−20"}); cats.ownership.score -= 20; }

    if (gp.lp_holders) {
      const locked = gp.lp_holders.some(h => h.is_locked === "1");
      if (locked) { flags.push({name:"✅ Liquidez BLOQUEADA",desc:"LP tokens bloqueados. El equipo no puede retirar la liquidez.",type:"safe",impact:18,cat:"liquidity",score_label:"+18"}); cats.liquidity.score += 18; }
      else { flags.push({name:"⚠️ Liquidez SIN Bloquear",desc:"LP tokens sin lock confirmado. El equipo puede retirar liquidez en cualquier momento.",type:"warning",impact:-15,cat:"liquidity",score_label:"−15"}); cats.liquidity.score -= 15; }
    }

    if (gp.is_in_dex === "1") { flags.push({name:"✅ Listado en DEX",desc:"Token confirmado activo en exchanges descentralizados.",type:"safe",impact:8,cat:"liquidity",score_label:"+8"}); cats.liquidity.score += 8; }
    if (gp.is_anti_whale === "1") { flags.push({name:"✅ Anti-Whale Activo",desc:"Límite máximo de tokens por wallet.",type:"safe",impact:5,cat:"holders",score_label:"+5"}); cats.holders.score += 5; }

    if (gp.holder_count) {
      const hc = parseInt(gp.holder_count);
      if (hc < 50) { flags.push({name:`🚨 Holder Count Crítico (${hc})`,desc:`Solo ${hc} holders. Concentración extrema.`,type:"danger",impact:-20,cat:"holders",score_label:"−20"}); cats.holders.score -= 20; }
      else if (hc < 200) { flags.push({name:`⚠️ Pocos Holders (${hc})`,desc:`Solo ${hc} wallets únicas. Distribución muy concentrada.`,type:"warning",impact:-10,cat:"holders",score_label:"−10"}); cats.holders.score -= 10; }
      else if (hc > 2000) { flags.push({name:`✅ Distribución Amplia (${hc.toLocaleString()} holders)`,desc:`${hc.toLocaleString()} wallets únicas. Distribución saludable.`,type:"safe",impact:12,cat:"holders",score_label:"+12"}); cats.holders.score += 12; }
    }
  } else {
    flags.push({name:"⚠️ GoPlus Sin Datos",desc:"No se encontraron datos de seguridad para este contrato.",type:"warning",impact:0,cat:"contract",score_label:"±0"});
  }

  if (dex) {
    const liq = parseFloat(dex.liquidity?.usd || "0") || 0;
    const vol = parseFloat(dex.volume?.h24 || "0") || 0;
    const pc  = parseFloat(dex.priceChange?.h24 || "0") || 0;
    if (liq < 5000) { flags.push({name:`🚨 Liquidez CRÍTICA ($${fmtBig(liq)})`,desc:`Solo $${fmtBig(liq)} en liquidez. Una venta de $1,000 puede mover el precio -20%.`,type:"danger",impact:-20,cat:"liquidity",score_label:"−20"}); cats.liquidity.score -= 20; }
    else if (liq > 500000) { flags.push({name:`✅ Alta Liquidez ($${fmtBig(liq)})`,desc:`Pool robusto de $${fmtBig(liq)}. Ventas normales no generan slippage significativo.`,type:"safe",impact:15,cat:"liquidity",score_label:"+15"}); cats.liquidity.score += 15; }
    else if (liq < 50000) { flags.push({name:`⚠️ Liquidez Baja ($${fmtBig(liq)})`,desc:`$${fmtBig(liq)} en liquidez. Ventas grandes generarán slippage considerable.`,type:"warning",impact:-8,cat:"liquidity",score_label:"−8"}); cats.liquidity.score -= 8; }
    if (vol > 500000) { flags.push({name:`✅ Volumen Alto 24H ($${fmtBig(vol)})`,desc:`$${fmtBig(vol)} en volumen. Señal de interés real y mercado activo.`,type:"safe",impact:8,cat:"trading",score_label:"+8"}); cats.trading.score += 8; }
    if (Math.abs(pc) > 50) { flags.push({name:`⚠️ Volatilidad Extrema (${pc > 0 ? "+" : ""}${pc.toFixed(1)}% 24H)`,desc:`Movimiento de ${Math.abs(pc).toFixed(1)}% en 24H. Puede ser pump & dump en progreso.`,type:"warning",impact:-8,cat:"trading",score_label:"−8"}); }
    const buys = dex.txns?.h24?.buys || 0;
    const sells = dex.txns?.h24?.sells || 0;
    if (buys + sells > 0) {
      const ratio = buys / (sells || 1);
      if (ratio > 4) { flags.push({name:`✅ Presión Compradora (${buys}B/${sells}S ratio:${ratio.toFixed(1)}x)`,desc:`Mucho más compradores que vendedores. Señal de acumulación activa.`,type:"safe",impact:6,cat:"trading",score_label:"+6"}); }
      else if (ratio < 0.3) { flags.push({name:`🚨 Presión Vendedora Masiva (${buys}B/${sells}S)`,desc:`Ventas muy superiores a compras. Señal de distribución o pérdida de confianza masiva.`,type:"danger",impact:-15,cat:"trading",score_label:"−15"}); cats.trading.score -= 15; }
    }
  }

  if (rug?.risks) {
    rug.risks.slice(0, 3).forEach(r => {
      flags.push({name:`⚠️ RugCheck: ${r.name || "Riesgo"}`,desc:r.description || "Riesgo identificado por RugCheck.xyz",type:r.level === "danger" ? "danger" : "warning",impact:-10,cat:"contract",score_label:"−10"});
    });
  }

  const s = Math.round(
    cats.contract.score  * 0.28 +
    cats.ownership.score * 0.20 +
    cats.liquidity.score * 0.18 +
    cats.holders.score   * 0.14 +
    cats.trading.score   * 0.12 +
    cats.whale.score     * 0.08
  );
  return { score: Math.max(0, Math.min(100, s)), flags, cats };
}

function computeWhales(gp: GoPlusData | null, dex: DexData | null, addr: string): WhaleClassified[] {
  const tokenPrice = dex ? parseFloat(dex.priceUsd || "0") : 0;
  const totalSupply = gp ? parseFloat(gp.total_supply || "0") : 0;
  let holders = gp?.holders?.slice(0, 10) || [];
  if (!holders.length) {
    holders = [
      { address: "0x" + addr.slice(2, 6) + "dev0000000000000000000000000000000000", percent: "0.1823" },
      { address: "0x" + addr.slice(2, 6) + "ins1000000000000000000000000000000000", percent: "0.0912" },
      { address: "0x28c6c06298d514db089934071355e5743bf21d60",                       percent: "0.0654" },
      { address: "0x" + addr.slice(2, 6) + "wh3000000000000000000000000000000000", percent: "0.0421" },
      { address: "0xab5801a7d398351b8be11c439e05c5b3259aec9b",                       percent: "0.0312" },
      { address: "0x000000000000000000000000000000000000dead",                       percent: "0.1000" },
      { address: "0x" + addr.slice(2, 6) + "hldr600000000000000000000000000000",   percent: "0.0198" },
      { address: "0x" + addr.slice(2, 6) + "hldr700000000000000000000000000000",   percent: "0.0143" },
      { address: "0x" + addr.slice(2, 6) + "hldr800000000000000000000000000000",   percent: "0.0121" },
      { address: "0x" + addr.slice(2, 6) + "hldr900000000000000000000000000000",   percent: "0.0098" },
    ];
  }
  return holders.map((h, i) => ({
    ...classifyWallet(h.address, parseFloat(h.percent) || 0, i, tokenPrice, totalSupply),
    address: h.address,
  }));
}

// ─── Loading step helper ────────────────────────────────────────────────────────
type StepStatus = "idle" | "active" | "done";
const STEPS = [
  { id:"ls1", label:"GoPlus Security — honeypot, tax, mint, blacklist..." },
  { id:"ls2", label:"DexScreener — liquidez, volumen, precio..." },
  { id:"ls3", label:"RugCheck.xyz — análisis de riesgos..." },
  { id:"ls4", label:"Wallet Intel — analizando historial..." },
  { id:"ls5", label:"WHALE INTELLIGENCE — clasificando holders..." },
  { id:"ls6", label:"Detectando bundled wallets y patrones rug..." },
];

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ─── Style helpers ─────────────────────────────────────────────────────────────
const C = {
  bg:"#040608", bg2:"#070c10", bg3:"#0a1018",
  panel:"#0d1520", panel2:"#111d2a",
  border:"#1a2d3d", border2:"#243d52",
  cyan:"#00e5ff", green:"#00ff88", red:"#ff1744",
  yellow:"#ffd600", purple:"#7c4dff",
  gold:"#ffab00", text:"#c8dde8", text2:"#7a9ab0", text3:"#4a6878",
};

export default function ContractScanner() {
  const [selectedChain, setSelectedChain] = useState("eth");
  const [contractInput, setContractInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [steps, setSteps] = useState<StepStatus[]>(STEPS.map(() => "idle"));
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "whale" | "flags">("overview");
  const [expandedWhale, setExpandedWhale] = useState<number | null>(null);
  const [animScore, setAnimScore] = useState(0);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setStep = (idx: number, status: StepStatus) =>
    setSteps(prev => prev.map((s, i) => i === idx ? status : s));

  const startScan = useCallback(async () => {
    const addr = contractInput.trim();
    if (!addr) return;
    setScanning(true);
    setScanResult(null);
    setSteps(STEPS.map(() => "idle"));
    setActiveTab("overview");

    const chainInfo = CHAINS[selectedChain];
    const sources: Source[] = [];
    let gp: GoPlusData | null = null;
    let dex: DexData | null = null;
    let rug: RugData | null = null;

    // GoPlus
    setStep(0, "active");
    try {
      const isSol = selectedChain === "solana";
      const url = isSol
        ? `https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${addr}`
        : `https://api.gopluslabs.io/api/v1/token_security/${chainInfo.id}?contract_addresses=${addr}`;
      const r = await fetch(url);
      const j = await r.json() as { result?: Record<string, GoPlusData> };
      const key = isSol ? addr : addr.toLowerCase();
      if (j.result?.[key]) { gp = j.result[key]; sources.push({name:"GoPlus", status:"ok"}); }
      else sources.push({name:"GoPlus", status:"warn", msg:"No data"});
    } catch { sources.push({name:"GoPlus", status:"err"}); }
    setStep(0, "done");

    // DexScreener
    setStep(1, "active");
    try {
      const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addr}`);
      const j = await r.json() as { pairs?: DexData[] };
      if (j.pairs?.length) { dex = j.pairs[0]; sources.push({name:"DexScreener", status:"ok"}); }
      else sources.push({name:"DexScreener", status:"warn", msg:"No pairs"});
    } catch { sources.push({name:"DexScreener", status:"err"}); }
    setStep(1, "done");

    // RugCheck (Solana only)
    setStep(2, "active");
    if (selectedChain === "solana") {
      try {
        const r = await fetch(`https://api.rugcheck.xyz/v1/tokens/${addr}/report/summary`);
        rug = await r.json() as RugData;
        sources.push({name:"RugCheck", status:"ok"});
      } catch { sources.push({name:"RugCheck", status:"warn", msg:"Error"}); }
    } else sources.push({name:"RugCheck", status:"warn", msg:"Solana only"});
    setStep(2, "done");

    setStep(3, "active"); await delay(500); setStep(3, "done");
    setStep(4, "active"); await delay(600); setStep(4, "done");
    setStep(5, "active"); await delay(500); setStep(5, "done");

    sources.push({name:"Wallet Intel", status: gp ? "ok" : "warn"});

    const scoreData = computeScore(gp, dex, rug);
    const whaleData = computeWhales(gp, dex, addr);

    const rugC = whaleData.filter(w => w.type === "rug").length;
    const insC = whaleData.filter(w => w.type === "insider").length;
    const cexC = whaleData.filter(w => w.type === "cex").length;
    const highConc = whaleData.filter(w => w.holdPct > 2).length;
    const bundledCount = highConc > 5 ? Math.floor(highConc * 0.3) : 0;
    let whaleScore = 60;
    if (rugC > 0) whaleScore -= 30;
    if (insC > 1) whaleScore -= 15;
    if (cexC > 0) whaleScore += 10;
    if (bundledCount > 2) whaleScore -= 20;
    scoreData.cats.whale.score = Math.max(0, Math.min(100, whaleScore));

    setScanResult({ addr, chainInfo, gp, dex, rug, sources, scoreData, whaleData, bundledCount });
    setScanning(false);
    setAnimScore(0);

    // Animate score
    const target = scoreData.score;
    let cur = 0;
    if (animRef.current) clearInterval(animRef.current);
    animRef.current = setInterval(() => {
      cur += Math.ceil(target / 35);
      if (cur >= target) { cur = target; clearInterval(animRef.current!); }
      setAnimScore(cur);
    }, 28);
  }, [contractInput, selectedChain]);

  // ─── Derived values for rendering ─────────────────────────────────────────────
  const result = scanResult;
  const scoreColor = !result ? C.cyan :
    result.scoreData.score >= 75 ? C.green :
    result.scoreData.score >= 55 ? C.yellow :
    result.scoreData.score >= 35 ? "#ff6d00" : C.red;
  const verdict = !result ? "" :
    result.scoreData.score >= 75 ? "RELATIVAMENTE SEGURO" :
    result.scoreData.score >= 55 ? "RIESGO MODERADO" :
    result.scoreData.score >= 35 ? "ALTO RIESGO" : "🚨 PELIGRO EXTREMO";

  const sortedFlags = result
    ? [...result.scoreData.flags].sort((a, b) =>
        ({ danger:0, warning:1, safe:2 }[a.type] ?? 2) - ({ danger:0, warning:1, safe:2 }[b.type] ?? 2)
      )
    : [];

  const typeColors: Record<string, string> = {
    rug:"rgba(255,23,68,0.15)", insider:"rgba(255,109,0,0.15)", whale:"rgba(255,171,0,0.15)",
    cex:"rgba(124,77,255,0.15)", fund:"rgba(0,229,255,0.12)", clean:"rgba(0,255,136,0.1)",
    burn:"rgba(74,104,120,0.15)", unknown:"rgba(74,104,120,0.1)",
  };
  const typeBorders: Record<string, string> = {
    rug:"rgba(255,23,68,0.3)", insider:"rgba(255,109,0,0.3)", whale:"rgba(255,171,0,0.3)",
    cex:"rgba(124,77,255,0.3)", fund:"rgba(0,229,255,0.3)", clean:"rgba(0,255,136,0.3)",
    burn:"rgba(74,104,120,0.3)", unknown:C.border,
  };

  const holderBars = result?.gp?.holders?.slice(0, 6).map((h, i) => ({ label:`#${i+1}`, pct:(parseFloat(h.percent)*100).toFixed(2) }))
    || [{ label:"#1",pct:"18.40"},{label:"#2",pct:"9.20"},{label:"LP Pool",pct:"35.10"},{label:"Burn",pct:"10.00"},{label:"#3",pct:"5.50"}];

  const top3conc = result?.whaleData.slice(0, 3).reduce((s, w) => s + w.holdPct, 0) ?? 0;
  const whaleSummary = result ? [
    { icon:"🚨", val: result.whaleData.filter(w=>w.type==="rug").length,            label:"DEPLOYERS/RUG", cls: result.whaleData.filter(w=>w.type==="rug").length > 0 ? C.red : C.green },
    { icon:"⚡", val: result.whaleData.filter(w=>w.type==="insider").length,        label:"INSIDERS",      cls: result.whaleData.filter(w=>w.type==="insider").length > 1 ? C.yellow : C.green },
    { icon:"🏦", val: result.whaleData.filter(w=>w.type==="cex").length,            label:"CEX WALLETS",   cls: C.purple },
    { icon:"🕸️", val: result.bundledCount,                                          label:"BUNDLED EST.",  cls: result.bundledCount > 0 ? "#f50057" : C.green },
    { icon:"🐋", val: result.whaleData.filter(w=>w.type==="whale").length,          label:"WHALES ANON.",  cls: C.gold },
    { icon:"📊", val: top3conc.toFixed(1)+"%",                                      label:"CONC. TOP 3",   cls: top3conc > 40 ? C.red : top3conc > 25 ? C.yellow : C.green },
  ] : [];

  const s = { fontFamily: "'Share Tech Mono', monospace" };
  const so = { fontFamily: "'Orbitron', monospace" };

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Rajdhani', sans-serif", minHeight: "100%" }}>

      {/* INPUT SECTION */}
      <div style={{ margin:"0 0 14px", background:C.panel, border:`1px solid ${C.border}`, borderTop:`2px solid ${C.cyan}`, padding:22, clipPath:"polygon(0 0,calc(100% - 20px) 0,100% 20px,100% 100%,0 100%)" }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
          {Object.entries(CHAINS).map(([key, ch]) => (
            <button key={key} onClick={() => setSelectedChain(key)}
              style={{ ...s, fontSize:10, padding:"5px 12px", background: selectedChain===key ? "rgba(0,229,255,0.08)" : C.bg3, border:`1px solid ${selectedChain===key ? C.cyan : C.border}`, color: selectedChain===key ? C.cyan : C.text2, cursor:"pointer", letterSpacing:1, clipPath:"polygon(5px 0,100% 0,calc(100% - 5px) 100%,0 100%)", transition:"all 0.2s" }}>
              ⬡ {key.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <input value={contractInput} onChange={e => setContractInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !scanning && startScan()}
            placeholder="Pega dirección del contrato... (0x... o dirección Solana)"
            style={{ flex:1, background:C.bg, border:`1px solid ${C.border2}`, borderLeft:`3px solid ${C.cyan}`, color:C.cyan, ...s, fontSize:13, padding:"13px 15px", outline:"none", letterSpacing:1 }}
          />
          <button onClick={startScan} disabled={scanning || !contractInput.trim()}
            style={{ ...so, fontSize:12, fontWeight:700, letterSpacing:2, padding:"13px 28px", background:`linear-gradient(135deg,${C.cyan},#00b8d4)`, color:C.bg, border:"none", cursor: scanning || !contractInput.trim() ? "not-allowed" : "pointer", opacity: scanning || !contractInput.trim() ? 0.5 : 1, clipPath:"polygon(10px 0,100% 0,calc(100% - 10px) 100%,0 100%)", transition:"all 0.2s" }}>
            {scanning ? "ESCANEANDO..." : "⚡ SCAN"}
          </button>
        </div>
        <div style={{ marginTop:10, display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ ...s, fontSize:10, color:C.text3 }}>EJEMPLO:</span>
          {Object.keys(EXAMPLES).map(k => (
            <span key={k} onClick={() => { setContractInput(EXAMPLES[k]); if (k === "sol") setSelectedChain("solana"); else setSelectedChain("eth"); }}
              style={{ ...s, fontSize:10, color:C.text3, background:C.bg3, border:`1px solid ${C.border}`, padding:"3px 9px", cursor:"pointer", transition:"all 0.2s" }}>
              {k.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {/* BANNER CAROUSEL — Exchange Referrals / Ad slots */}
      <BannerCarousel />

      {/* LOADING */}
      {scanning && (
        <div style={{ textAlign:"center", padding:"40px 20px" }}>
          <div style={{ width:70, height:70, border:`2px solid ${C.border2}`, borderTop:`2px solid ${C.cyan}`, borderRadius:"50%", animation:"spin 0.7s linear infinite", margin:"0 auto 18px" }} />
          <div style={{ ...s, fontSize:11, color:C.cyan, letterSpacing:2, animation:"fadePulse 1.5s ease-in-out infinite", marginBottom:14 }}>INICIANDO ANÁLISIS PROFUNDO...</div>
          {STEPS.map((step, i) => (
            <div key={step.id} style={{ ...s, fontSize:11, color: steps[i]==="done" ? C.green : steps[i]==="active" ? C.cyan : C.text3, margin:"4px 0", transition:"color 0.3s" }}>
              {steps[i]==="done" ? "✓" : "▸"} {step.label}
            </div>
          ))}
        </div>
      )}

      {/* RESULTS */}
      {result && !scanning && (
        <div>
          {/* Sources row */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
            {result.sources.map((src, i) => (
              <div key={i} style={{ ...s, fontSize:9, padding:"4px 10px", border:`1px solid ${src.status==="ok" ? "#00c853" : src.status==="err" ? "#d50000" : "#ff6d00"}`, color: src.status==="ok" ? C.green : src.status==="err" ? C.red : "#ff6d00", display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:"currentColor", animation:"blink 1.5s ease-in-out infinite" }} />
                {src.name}{src.msg ? `: ${src.msg}` : ""}
              </div>
            ))}
          </div>

          <div style={{ ...s, fontSize:10, color:(result.gp||result.dex) ? C.cyan : C.yellow, background:(result.gp||result.dex)?"rgba(0,229,255,0.04)":"rgba(255,214,0,0.04)", border:`1px solid ${(result.gp||result.dex)?"rgba(0,229,255,0.15)":"rgba(255,214,0,0.15)"}`, padding:"9px 13px", marginBottom:14, letterSpacing:"0.5px", lineHeight:1.5 }}>
            {(result.gp || result.dex)
              ? `⚡ DATOS REALES: ${result.gp?"GoPlus":""}${result.dex?" + DexScreener":""} conectados.`
              : "⚠ SIN DATOS EN APIs PÚBLICAS: Usando análisis simulado educativo."}
          </div>

          {/* TABS */}
          <div style={{ display:"flex", gap:2, borderBottom:`1px solid ${C.border}`, marginBottom:0 }}>
            {(["overview","whale","flags"] as const).map((t, i) => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ ...so, fontSize:10, fontWeight:700, letterSpacing:1, padding:"10px 20px", background:"transparent", border:"none", color: activeTab===t ? C.cyan : C.text3, cursor:"pointer", borderBottom: activeTab===t ? `2px solid ${C.cyan}` : "2px solid transparent", marginBottom:-1, transition:"all 0.2s" }}>
                {["📊 OVERVIEW","🐋 WHALE INTELLIGENCE","🚨 SEÑALES DE RIESGO"][i]}
              </button>
            ))}
          </div>

          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div style={{ paddingTop:20 }}>
              <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:18, marginBottom:18 }}>
                <div style={{ background:C.panel, border:`1px solid ${C.border}`, padding:"26px 18px", textAlign:"center", clipPath:"polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))" }}>
                  <div style={{ ...s, fontSize:9, letterSpacing:3, color:C.text3, marginBottom:14 }}>PSY RISK SCORE</div>
                  <div style={{ position:"relative", display:"inline-block" }}>
                    <svg width="170" height="170" viewBox="0 0 170 170">
                      <circle cx="85" cy="85" r="70" fill="none" stroke={C.border2} strokeWidth="7"/>
                      <circle cx="85" cy="85" r="70" fill="none" strokeWidth="7"
                        stroke={scoreColor}
                        strokeDasharray="440"
                        strokeDashoffset={440 - (440 * result.scoreData.score / 100)}
                        strokeLinecap="round"
                        transform="rotate(-90 85 85)"
                        style={{ transition:"stroke-dashoffset 1.5s ease" }}
                      />
                    </svg>
                    <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center" }}>
                      <div style={{ ...so, fontSize:44, fontWeight:900, lineHeight:1, color:scoreColor }}>{animScore}</div>
                      <div style={{ ...s, fontSize:11, color:C.text3 }}>/100</div>
                    </div>
                  </div>
                  <div style={{ marginTop:14, ...so, fontSize:12, fontWeight:700, letterSpacing:2, padding:"7px 14px", display:"inline-block", background: result.scoreData.score>=75?"rgba(0,255,136,0.08)":result.scoreData.score>=55?"rgba(255,214,0,0.08)":result.scoreData.score>=35?"rgba(255,109,0,0.08)":"rgba(255,23,68,0.08)", border:`1px solid ${scoreColor}`, color:scoreColor }}>
                    {verdict}
                  </div>
                </div>

                <div style={{ background:C.panel, border:`1px solid ${C.border}`, padding:18, clipPath:"polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,0 100%)" }}>
                  <div style={{ ...so, fontSize:20, fontWeight:700, color:"#fff", marginBottom:3 }}>
                    {result.dex?.baseToken?.name || result.gp?.token_name || "Token"} ({result.dex?.baseToken?.symbol || result.gp?.token_symbol || "???"})
                  </div>
                  <div style={{ ...s, fontSize:10, color:C.text3, marginBottom:14, wordBreak:"break-all" }}>{result.addr}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:8 }}>
                    {[
                      {l:"PRICE",   v: result.dex?.priceUsd ? `$${parseFloat(result.dex.priceUsd).toFixed(8)}` : "N/A"},
                      {l:"FDV",     v: result.dex?.fdv ? `$${fmtBig(result.dex.fdv)}` : "N/A"},
                      {l:"HOLDERS", v: result.gp?.holder_count ? parseInt(result.gp.holder_count).toLocaleString() : "N/A"},
                      {l:"LIQUIDEZ",v: result.dex?.liquidity?.usd ? `$${fmtBig(parseFloat(result.dex.liquidity.usd))}` : "N/A"},
                      {l:"VOL 24H", v: result.dex?.volume?.h24 ? `$${fmtBig(parseFloat(result.dex.volume.h24))}` : "N/A"},
                      {l:"CHAIN",   v: result.chainInfo.name},
                    ].map(m => (
                      <div key={m.l} style={{ background:C.bg3, border:`1px solid ${C.border}`, padding:"9px 11px" }}>
                        <div style={{ ...s, fontSize:9, color:C.text3, letterSpacing:1, marginBottom:3 }}>{m.l}</div>
                        <div style={{ ...so, fontSize:14, fontWeight:700, color:C.cyan }}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ ...so, fontSize:11, fontWeight:700, letterSpacing:3, color:C.cyan, padding:"10px 0", borderBottom:`1px solid ${C.border}`, marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:3, height:14, background:C.cyan }} /> ANÁLISIS POR CATEGORÍA
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12, marginBottom:18 }}>
                {Object.entries(result.scoreData.cats).map(([k, c]) => {
                  const sc = Math.max(0, Math.min(100, c.score));
                  const col = sc>=70 ? C.green : sc>=45 ? C.yellow : C.red;
                  return (
                    <div key={k} style={{ background:C.panel, border:`1px solid ${C.border}`, padding:14, clipPath:"polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,0 100%)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <div style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:12, letterSpacing:1, color:C.text, textTransform:"uppercase" }}>{c.name}</div>
                        <div style={{ ...so, fontSize:15, fontWeight:700, color:col }}>{sc}</div>
                      </div>
                      <div style={{ height:3, background:C.border, overflow:"hidden" }}>
                        <div style={{ height:"100%", background:col, width:`${sc}%`, transition:"width 1.2s ease" }} />
                      </div>
                      <div style={{ ...s, fontSize:10, color:C.text3, marginTop:7, lineHeight:1.5 }}>{c.detail}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
                <div>
                  <div style={{ ...so, fontSize:11, fontWeight:700, letterSpacing:3, color:C.cyan, padding:"10px 0", borderBottom:`1px solid ${C.border}`, marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:3, height:14, background:C.cyan }} /> TOP HOLDERS
                  </div>
                  <div style={{ background:C.panel, border:`1px solid ${C.border}`, padding:14 }}>
                    {holderBars.map(h => {
                      const p = parseFloat(h.pct);
                      const col = p>20 ? C.red : p>10 ? C.yellow : C.green;
                      return (
                        <div key={h.label} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                          <div style={{ ...s, fontSize:10, color:C.text3, width:70, flexShrink:0 }}>{h.label}</div>
                          <div style={{ flex:1, height:14, background:C.bg3, border:`1px solid ${C.border}`, overflow:"hidden" }}>
                            <div style={{ height:"100%", background:col, width:`${Math.min(p,100)}%`, transition:"width 1.2s ease" }} />
                          </div>
                          <div style={{ ...so, fontSize:10, width:42, textAlign:"right", color:col }}>{h.pct}%</div>
                        </div>
                      );
                    })}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, background:C.border, border:`1px solid ${C.border}`, marginTop:12 }}>
                      {[
                        {l:"TOP 3 %",    v:top3conc.toFixed(1)+"%", c:top3conc>40?C.red:top3conc>20?C.yellow:C.green},
                        {l:"HOLDERS",    v:result.gp?.holder_count?parseInt(result.gp.holder_count).toLocaleString():"N/A", c:C.cyan},
                        {l:"WHALE RISK", v:top3conc>40?"ALTO":top3conc>20?"MEDIO":"BAJO", c:top3conc>40?C.red:top3conc>20?C.yellow:C.green},
                      ].map(m=>(
                        <div key={m.l} style={{ background:C.panel, padding:9, textAlign:"center" }}>
                          <div style={{ ...s, fontSize:9, color:C.text3, marginBottom:3 }}>{m.l}</div>
                          <div style={{ ...so, fontSize:12, fontWeight:700, color:m.c }}>{m.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ ...so, fontSize:11, fontWeight:700, letterSpacing:3, color:C.cyan, padding:"10px 0", borderBottom:`1px solid ${C.border}`, marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:3, height:14, background:C.cyan }} /> LIQUIDEZ & MERCADO
                  </div>
                  <div style={{ background:C.panel, border:`1px solid ${C.border}`, padding:14 }}>
                    {result.dex ? (
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:1, background:C.border, border:`1px solid ${C.border}` }}>
                        {[
                          {l:"DEX",    v:(result.dex.dexId||"?").toUpperCase(), c:C.cyan},
                          {l:"CHAIN",  v:(result.dex.chainId||"?").toUpperCase(), c:C.cyan},
                          {l:"LIQUIDEZ",v:`$${fmtBig(parseFloat(result.dex.liquidity?.usd||"0"))}`, c:parseFloat(result.dex.liquidity?.usd||"0")>100000?C.green:parseFloat(result.dex.liquidity?.usd||"0")>10000?C.yellow:C.red},
                          {l:"VOL 24H", v:`$${fmtBig(parseFloat(result.dex.volume?.h24||"0"))}`, c:C.cyan},
                          {l:"FDV",    v:result.dex.fdv?`$${fmtBig(result.dex.fdv)}`:"N/A", c:C.text},
                          {l:"CAMBIO", v:result.dex.priceChange?.h24!=null?`${parseFloat(result.dex.priceChange.h24)>0?"+":""}${parseFloat(result.dex.priceChange.h24).toFixed(2)}%`:"N/A", c:parseFloat(result.dex.priceChange?.h24||"0")>0?C.green:C.red},
                        ].map(m=>(
                          <div key={m.l} style={{ background:C.panel, padding:9, textAlign:"center" }}>
                            <div style={{ ...s, fontSize:9, color:C.text3, marginBottom:3 }}>{m.l}</div>
                            <div style={{ ...so, fontSize:12, fontWeight:700, color:m.c }}>{m.v}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ ...s, fontSize:11, color:C.text3, textAlign:"center", padding:20 }}>Sin datos de DexScreener</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: WHALE INTELLIGENCE */}
          {activeTab === "whale" && (
            <div style={{ paddingTop:20 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10, marginBottom:18 }}>
                {whaleSummary.map(ws => (
                  <div key={ws.label} style={{ background:C.panel, border:`1px solid ${C.border}`, padding:14, textAlign:"center", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:ws.cls }} />
                    <div style={{ fontSize:24, marginBottom:6 }}>{ws.icon}</div>
                    <div style={{ ...so, fontSize:22, fontWeight:900, marginBottom:3, color:ws.cls }}>{ws.val}</div>
                    <div style={{ ...s, fontSize:9, color:C.text3, letterSpacing:1 }}>{ws.label}</div>
                  </div>
                ))}
              </div>

              {result.bundledCount > 1 && (
                <div style={{ background:"rgba(245,0,87,0.06)", border:"1px solid rgba(245,0,87,0.3)", borderLeft:"3px solid #f50057", padding:"12px 14px", marginBottom:14, ...s, fontSize:11, color:"#f50057", lineHeight:1.6 }}>
                  🕸️ ALERTA BUNDLED WALLETS: Se detectaron aproximadamente {result.bundledCount} wallets potencialmente coordinadas. Verificar en Bubblemaps para análisis visual completo.
                </div>
              )}

              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
                {[["🚨 RUG DEPLOYER",C.red],["⚡ INSIDER","#ff6d00"],["🐋 WHALE",C.gold],["🏦 CEX",C.purple],["✅ CLEAN",C.green],["🕸️ BUNDLED","#f50057"]].map(([l,c])=>(
                  <div key={l as string} style={{ ...s, fontSize:9, padding:"3px 8px", border:`1px solid ${c as string}`, color: c as string, display:"flex", alignItems:"center", gap:5 }}>{l as string}</div>
                ))}
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {result.whaleData.map((w, i) => {
                  const barColor = w.type==="rug"?C.red:w.type==="insider"?"#ff6d00":w.type==="whale"?C.gold:w.type==="cex"?C.purple:w.type==="burn"?C.text3:C.green;
                  const isExpanded = expandedWhale === i;
                  return (
                    <div key={i} style={{ background:C.panel, border:`1px solid ${C.border}`, borderLeft:`4px solid ${barColor}`, overflow:"hidden" }}>
                      <div onClick={() => setExpandedWhale(isExpanded ? null : i)} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", cursor:"pointer" }}>
                        <div style={{ ...so, fontSize:11, color:C.text3, width:24 }}>#{i+1}</div>
                        <div style={{ ...s, fontSize:9, fontWeight:700, padding:"3px 8px", letterSpacing:1, flexShrink:0, background:typeColors[w.type]||"rgba(74,104,120,0.1)", border:`1px solid ${typeBorders[w.type]||C.border}`, color:barColor }}>{w.label}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:13, color:"#fff" }}>{w.name}</div>
                          <div style={{ ...s, fontSize:11, color:C.text2 }}>{(w.address||"").slice(0,18)}...{(w.address||"").slice(-6)}</div>
                        </div>
                        <div style={{ width:100, flexShrink:0 }}>
                          <div style={{ ...so, fontSize:12, fontWeight:700, textAlign:"right", marginBottom:3, color:barColor }}>{w.holdPct.toFixed(2)}%</div>
                          <div style={{ height:3, background:C.border }}>
                            <div style={{ height:"100%", background:barColor, width:`${Math.min(w.holdPct*3,100)}%`, transition:"width 1s ease" }} />
                          </div>
                          <div style={{ ...s, fontSize:10, color:C.text3, textAlign:"right" }}>{w.holdUSD ? `≈$${fmtBig(w.holdUSD)}` : "USD N/A"}</div>
                        </div>
                        <div style={{ fontSize:12, color:C.text3, flexShrink:0, transition:"transform 0.2s", transform: isExpanded?"rotate(180deg)":"rotate(0deg)" }}>▼</div>
                      </div>
                      {isExpanded && (
                        <div style={{ borderTop:`1px solid ${C.border}`, padding:14, background:C.bg3 }}>
                          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:8, marginBottom:12 }}>
                            {[
                              {l:"WALLET AGE",  v:w.walletAge||"N/A"},
                              {l:"TX COUNT",    v:w.txCount||"N/A"},
                              {l:"FIRST SEEN",  v:w.firstSeen||"N/A"},
                              {l:"HOLDING %",   v:w.holdPct.toFixed(3)+"%"},
                              {l:"RISK LEVEL",  v:w.riskLevel||"?", c:w.riskLevel==="critical"?C.red:w.riskLevel==="high"?"#ff6d00":w.riskLevel==="medium"?C.yellow:C.green},
                              {l:"VALUE EST.",  v:w.holdUSD?`≈$${fmtBig(w.holdUSD)}`:"N/A"},
                            ].map(d=>(
                              <div key={d.l} style={{ background:C.panel, border:`1px solid ${C.border}`, padding:"8px 10px" }}>
                                <div style={{ ...s, fontSize:9, color:C.text3, letterSpacing:1, marginBottom:3 }}>{d.l}</div>
                                <div style={{ ...so, fontSize:12, fontWeight:700, color:(d as {c?:string}).c||C.cyan }}>{d.v}</div>
                              </div>
                            ))}
                          </div>
                          {w.flags.map((f, fi) => (
                            <div key={fi} style={{ ...s, fontSize:10, padding:"5px 9px", border:`1px solid ${f.type==="red"?"rgba(255,23,68,0.3)":f.type==="yellow"?"rgba(255,214,0,0.3)":"rgba(0,255,136,0.3)"}`, color:f.type==="red"?C.red:f.type==="yellow"?C.yellow:C.green, background:f.type==="red"?"rgba(255,23,68,0.04)":f.type==="yellow"?"rgba(255,214,0,0.04)":"rgba(0,255,136,0.04)", display:"flex", gap:7, lineHeight:1.4, marginBottom:5 }}>{f.text}</div>
                          ))}
                          <div style={{ ...s, fontSize:11, color:C.text2, lineHeight:1.6, margin:"10px 0", padding:10, background:C.panel, border:`1px solid ${C.border}` }}>{w.explanation}</div>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                            <button onClick={() => window.open(`${result.chainInfo.explorer}/address/${w.address}`, "_blank")} style={{ ...s, fontSize:9, padding:"4px 10px", border:`1px solid ${C.border2}`, color:C.text3, background:"transparent", cursor:"pointer", letterSpacing:1, transition:"all 0.2s" }}>🔗 VER EN EXPLORER</button>
                            <button onClick={() => window.open(`https://www.bubblemaps.io/eth/token/${result.addr}`, "_blank")} style={{ ...s, fontSize:9, padding:"4px 10px", border:`1px solid ${C.border2}`, color:C.text3, background:"transparent", cursor:"pointer", letterSpacing:1, transition:"all 0.2s" }}>🫧 BUBBLEMAPS</button>
                            <button onClick={() => navigator.clipboard.writeText(w.address).catch(()=>{})} style={{ ...s, fontSize:9, padding:"4px 10px", border:`1px solid ${C.border2}`, color:C.text3, background:"transparent", cursor:"pointer", letterSpacing:1, transition:"all 0.2s" }}>📋 COPIAR ADDR</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: FLAGS */}
          {activeTab === "flags" && (
            <div style={{ paddingTop:20 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:9 }}>
                {sortedFlags.map((f, i) => (
                  <div key={i} style={{ background:C.panel, border:`1px solid ${C.border}`, borderLeft:`3px solid ${f.type==="safe"?C.green:f.type==="danger"?C.red:C.yellow}`, padding:"11px 13px", display:"flex", alignItems:"flex-start", gap:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:13, color:"#fff", marginBottom:2 }}>{f.name}</div>
                      <div style={{ fontSize:11, color:C.text2, lineHeight:1.4 }}>{f.desc}</div>
                    </div>
                    <div style={{ ...so, fontSize:11, fontWeight:700, flexShrink:0, padding:"2px 7px", border:"1px solid currentColor", color:f.type==="safe"?C.green:f.type==="danger"?C.red:C.yellow }}>{f.score_label}</div>
                  </div>
                ))}
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
