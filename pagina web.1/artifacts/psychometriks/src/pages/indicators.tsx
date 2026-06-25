import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/site-nav";

const TELEGRAM = "https://t.me/psychometriks_pro";

function IndicatorsGate() {
  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani flex flex-col">
      <SiteNav />
      <div className="flex-1 flex items-center justify-center px-6 pt-20">
        <div className="border border-[#1a2535] bg-[#060a0f] p-10 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#ffd700] to-transparent" />
          <div className="text-5xl mb-5">📡</div>
          <div className="font-sharetech text-[9px] tracking-[0.4em] text-[#ffd700] mb-3">ACCESO RESTRINGIDO</div>
          <div className="font-bebas text-3xl text-white mb-2">INDICADORES PSY</div>
          <div className="font-space text-[12px] text-[#7a9aaa] mb-6 leading-relaxed">
            Los indicadores institucionales están disponibles para miembros con plan
            <span className="text-[#ffd700] font-bold"> Educación</span> o superior.
          </div>
          <div className="border border-[#ffd70022] bg-[#080700] px-5 py-4 mb-6 text-left">
            <div className="font-sharetech text-[10px] tracking-[0.2em] text-[#ffd700] mb-3">⬡ INCLUÍDO DESDE $29/mes</div>
            <div className="space-y-1.5">
              {["LiqMap PRO — heatmap de liquidaciones","Score PSY 0-100 institucional","Funding Dashboard en tiempo real","Whale Alert — movimientos +$1M","Macro Dashboard DXY · Yields · SPX","FED × BTC · Ciclos históricos"].map(f => (
                <div key={f} className="flex items-center gap-2 font-space text-[11px] text-[#8a9ab0]">
                  <span className="text-[#ffd700] text-[9px]">✦</span> {f}
                </div>
              ))}
            </div>
          </div>
          <a href="/pricing" className="block w-full py-3 font-space text-[12px] font-bold tracking-[0.2em] uppercase text-center no-underline hover:opacity-90 transition-colors" style={{ background: "#ffd700", color: "#020408" }}>
            VER PLANES →
          </a>
          <div className="mt-4 font-space text-[10px] text-[#5a8898]">
            ¿Ya sos miembro? <a href="/login" className="text-[#00e5ff] hover:underline">Iniciá sesión</a>
          </div>
        </div>
      </div>
    </div>
  );
}

type Tag = "TODOS" | "ON-CHAIN" | "SENTIMIENTO" | "DERIVADOS" | "MACRO" | "PROTECCIÓN" | "INSTITUCIONAL";

interface Indicator {
  code: string; name: string; tag: string;
  color: string; plan: string; icon: string;
  description: string; rating: number;
  stats: { label: string; value: string; up: boolean; bar: number }[];
  link: string; comingSoon?: boolean;
}

const INDICATORS: Indicator[] = [
  {
    code: "LIQ-MAP", name: "LiqMap PRO", tag: "ON-CHAIN", color: "#00e5ff",
    plan: "PRO", icon: "💧", rating: 4.9,
    description: "Heatmap de liquidaciones en tiempo real. Muestra exactamente dónde están los clusters de stops de longs y shorts — los imanes del precio.",
    stats: [
      { label: "Liq Longs 24h",       value: "$284M",   up: false, bar: 72 },
      { label: "Liq Shorts 24h",      value: "$196M",   up: true,  bar: 55 },
      { label: "Cluster más cercano", value: "$82,400", up: true,  bar: 88 },
    ],
    link: "/liquid-map.html",
  },
  {
    code: "SCORE-PSY", name: "Score PSY", tag: "INSTITUCIONAL", color: "#ffd700",
    plan: "PRO", icon: "⭐", rating: 4.8,
    description: "Puntuación 0-100 del posicionamiento institucional. Combina whale flow, funding, OI y estructura de mercado en un solo número accionable.",
    stats: [
      { label: "Score actual", value: "74 / 100",  up: true,  bar: 74 },
      { label: "Tendencia",    value: "ALCISTA",   up: true,  bar: 80 },
      { label: "Señal",        value: "HOLD LONG", up: true,  bar: 85 },
    ],
    link: "/liquid-map.html",
  },
  {
    code: "ANTI-LIQ", name: "Anti-Liquidación", tag: "PROTECCIÓN", color: "#00e676",
    plan: "PRO", icon: "🛡️", rating: 4.9,
    description: "Calcula la zona de stop loss óptima por encima/debajo de los clusters de liquidación, para que no seas víctima del hunt institucional.",
    stats: [
      { label: "Zona segura Long",  value: "$74,800", up: true,  bar: 65 },
      { label: "Zona segura Short", value: "$84,200", up: false, bar: 55 },
      { label: "Risk/Reward",       value: "1:3.2",   up: true,  bar: 90 },
    ],
    link: "/liquid-map.html",
  },
  {
    code: "FUNDING", name: "Funding Rate Monitor", tag: "DERIVADOS", color: "#00e5ff",
    plan: "PRO", icon: "📊", rating: 4.7,
    description: "Tasa de financiamiento de los perpetuos. Positivo = longs pagan a shorts. Extremos predicen reversiones de alta probabilidad.",
    stats: [
      { label: "BTC Funding 8h", value: "0.012%",  up: true,  bar: 58 },
      { label: "ETH Funding 8h", value: "-0.003%", up: false, bar: 38 },
      { label: "Estado",         value: "NEUTRAL", up: true,  bar: 50 },
    ],
    link: "/liquid-map.html",
  },
  {
    code: "FEAR-GREED", name: "Fear & Greed Index", tag: "SENTIMIENTO", color: "#ffd700",
    plan: "BASIC", icon: "😱", rating: 4.6,
    description: "Termómetro del sentimiento del mercado cripto. Escala 0-100. Identificá extremos emocionales — donde el institucional actúa.",
    stats: [
      { label: "Índice actual", value: "78",             up: true,  bar: 78 },
      { label: "Estado",        value: "Codicia Extrema",up: true,  bar: 78 },
      { label: "Señal macro",   value: "PRECAUCIÓN",     up: false, bar: 40 },
    ],
    link: "/liquid-map.html",
  },
  {
    code: "LS-RATIO", name: "Long/Short Ratio", tag: "DERIVADOS", color: "#e040fb",
    plan: "PRO", icon: "⚖️", rating: 4.7,
    description: "Relación entre posiciones largas y cortas en futuros. Extremos en cualquier dirección señalan posibles reversiones de tendencia.",
    stats: [
      { label: "Longs",   value: "62.4%", up: true,  bar: 62 },
      { label: "Shorts",  value: "37.6%", up: false, bar: 38 },
      { label: "Ratio L/S",value: "1.66", up: true,  bar: 66 },
    ],
    link: "/liquid-map.html",
  },
  {
    code: "OI-TRACKER", name: "Open Interest", tag: "DERIVADOS", color: "#ff6d00",
    plan: "PRO", icon: "📈", rating: 4.8,
    description: "Total de contratos abiertos en futuros. OI creciente con precio subiendo = tendencia con respaldo. OI cayendo = cierre de posiciones.",
    stats: [
      { label: "BTC OI",    value: "$18.4B",         up: true, bar: 72 },
      { label: "Cambio 24h",value: "+4.2%",           up: true, bar: 60 },
      { label: "Señal",     value: "TENDENCIA FUERTE",up: true, bar: 88 },
    ],
    link: "/liquid-map.html",
  },
  {
    code: "BTC-DOM", name: "BTC Dominancia", tag: "MACRO", color: "#40c4ff",
    plan: "BASIC", icon: "₿", rating: 4.5,
    description: "% del market cap total que representa Bitcoin. Alta dominancia = flujo hacia BTC. Caída = rotación hacia altcoins.",
    stats: [
      { label: "Dominancia actual", value: "56.2%",    up: true,  bar: 56 },
      { label: "Tendencia",         value: "↑ Subiendo",up: true,  bar: 65 },
      { label: "Señal altcoins",    value: "ESPERAR",   up: false, bar: 35 },
    ],
    link: "/liquid-map.html",
  },
  {
    code: "WHALE-FLOW", name: "Whale Flow Tracker", tag: "ON-CHAIN", color: "#00e5ff",
    plan: "ELITE", icon: "🐋", rating: 5.0,
    description: "Monitoreo de movimientos de wallets whale (+1000 BTC). Detectá acumulación o distribución institucional antes que el mercado.",
    stats: [
      { label: "Flujo neto 24h", value: "+$142M",  up: true,  bar: 70 },
      { label: "Wallets activas",value: "1,247",    up: true,  bar: 60 },
      { label: "Señal",          value: "ACUMULA",  up: true,  bar: 85 },
    ],
    link: "/pricing",
    comingSoon: false,
  },
];

const PLAN_COLOR: Record<string, string> = {
  BASIC: "#00e676",
  PRO:   "#00e5ff",
  ELITE: "#e040fb",
};

const ALL_TAGS: Tag[] = ["TODOS", "ON-CHAIN", "SENTIMIENTO", "DERIVADOS", "MACRO", "PROTECCIÓN", "INSTITUCIONAL"];

function StarRating({ value, color }: { value: number; color: string }) {
  const full  = Math.floor(value);
  const frac  = value - full;
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 11, color: i <= full ? color : i === full + 1 && frac >= 0.5 ? color : "#1a2535", opacity: i === full + 1 && frac >= 0.5 ? 0.5 : 1 }}>★</span>
      ))}
      <span className="font-mono text-[10px] text-[#7ab3c8] ml-1">{value.toFixed(1)}</span>
    </div>
  );
}

function AnimatedBar({ value, color }: { value: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 150); return () => clearTimeout(t); }, [value]);
  return (
    <div style={{ height: 2, background: "#1a2535", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ height: "100%", background: color, borderRadius: 2, width: `${w}%`, transition: "width 1.4s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function PulsingDot({ color }: { color: string }) {
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: color }} />
      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: color }} />
    </span>
  );
}

export default function Indicators() {
  const auth = (() => { try { return JSON.parse(localStorage.getItem("psyko_auth") ?? "null") as { role?: string; plan?: string } | null; } catch { return null; } })();
  const plan = auth?.plan ?? "";
  const isAllowed = ["aprendiz","educacion","trader","institucional"].includes(plan) || auth?.role === "superadmin" || auth?.role === "operator" || auth?.role === "member";
  if (!isAllowed) return <IndicatorsGate />;

  return <IndicatorsContent />;
}

function IndicatorsContent() {
  const [activeTag, setActiveTag] = useState<Tag>("TODOS");
  const [authUser, setAuthUser] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("psyko_auth");
      if (raw) {
        const { user, ts } = JSON.parse(raw);
        if (Date.now() - ts < 8 * 60 * 60 * 1000) setAuthUser(user);
      }
    } catch {}
  }, []);

  const filtered = activeTag === "TODOS"
    ? INDICATORS
    : INDICATORS.filter(i => i.tag === activeTag);

  const getAccessUrl = (ind: Indicator) => {
    if (!authUser) return "/pricing";
    if (ind.plan === "ELITE" && authUser !== "admin") return "/pricing";
    return ind.link;
  };

  const canAccess = (ind: Indicator) => {
    if (!authUser) return false;
    if (authUser === "admin") return true;
    if (ind.plan === "ELITE") return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      {/* Banner: Suite funcional en vivo */}
      <div className="px-6 md:px-12 pt-24">
        <a href={authUser ? "/indicators-pro" : "/pricing"}
          className="flex flex-wrap items-center justify-between gap-3 border border-[#00e5ff33] bg-[#00e5ff0a] hover:bg-[#00e5ff14] transition-colors px-5 py-4 no-underline">
          <div>
            <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#00e5ff] mb-1">⚡ NUEVO · SUITE INTERACTIVA EN VIVO</div>
            <div className="font-space text-[13px] text-white">ADX · RSI · MACD · OI+Funding · CVD · Volume Profile · LiqMap · Master — con gráficos en tiempo real por par y timeframe.</div>
          </div>
          <span className="font-space text-[10px] font-bold tracking-[0.15em] uppercase text-[#00e5ff] whitespace-nowrap">ABRIR SUITE →</span>
        </a>
      </div>

      {/* Hero */}
      <section className="pt-10 pb-16 px-6 md:px-12">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4 flex items-center gap-3">
          Suite de Indicadores <div className="h-px bg-[#1a2535] flex-1 max-w-[80px]" />
          <PulsingDot color="#00e676" />
          <span className="text-[#00e676] text-[10px]">LIVE</span>
        </div>
        <h1 className="font-bebas text-6xl md:text-9xl leading-none mb-4">
          INDICADORES<br /><span className="text-[#00e5ff]">PSY</span>
        </h1>
        <p className="text-[#7ab3c8] font-space text-sm max-w-xl leading-relaxed mb-6">
          Herramientas de análisis institucional combinadas en una sola plataforma. Cada indicador está diseñado para darte ventaja sobre el movimiento del dinero inteligente.
        </p>
        <div className="flex gap-6 font-space text-[11px] text-[#7ab3c8]">
          <span><span className="text-white font-bold">{INDICATORS.length}</span> indicadores</span>
          <span><span style={{ color: PLAN_COLOR.BASIC }} className="font-bold">2</span> en BASIC</span>
          <span><span style={{ color: PLAN_COLOR.PRO }} className="font-bold">6</span> en PRO</span>
          <span><span style={{ color: PLAN_COLOR.ELITE }} className="font-bold">1</span> en ELITE</span>
        </div>
      </section>

      {/* Filter bar */}
      <div className="px-6 md:px-12 pb-8 flex flex-wrap gap-2">
        {ALL_TAGS.map(tag => (
          <button key={tag} onClick={() => setActiveTag(tag)}
            className="font-space text-[10px] tracking-[0.15em] uppercase px-4 py-2 border transition-all"
            style={{
              borderColor:  activeTag === tag ? "#00e5ff" : "#1a2535",
              color:        activeTag === tag ? "#00e5ff" : "#4a6070",
              background:   activeTag === tag ? "#00e5ff10" : "transparent",
            }}>
            {tag}
            {tag !== "TODOS" && (
              <span className="ml-2 text-[9px] text-[#5a8898]">
                {INDICATORS.filter(i => i.tag === tag).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Indicators grid */}
      <section className="px-6 md:px-12 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-[#1a2535] border border-[#1a2535]">
          {filtered.map((ind, i) => {
            const hasAccess = canAccess(ind);
            const accessUrl = getAccessUrl(ind);
            return (
              <div key={i}
                className="bg-[#060a0f] p-6 hover:bg-[#0d1520] transition-colors group relative overflow-hidden flex flex-col"
                style={{ opacity: ind.comingSoon ? 0.6 : 1 }}>

                {/* Left accent bar */}
                <div className="absolute top-0 left-0 w-[3px] h-0 transition-all duration-500 group-hover:h-full"
                  style={{ background: ind.color }} />

                {/* Plan badge top-right */}
                <div className="absolute top-4 right-4">
                  <span className="font-space text-[8px] px-2 py-0.5 tracking-[0.1em]"
                    style={{ color: PLAN_COLOR[ind.plan], background: `${PLAN_COLOR[ind.plan]}12`, border: `1px solid ${PLAN_COLOR[ind.plan]}33` }}>
                    PLAN {ind.plan}
                  </span>
                </div>

                {/* Header */}
                <div className="flex items-start gap-3 mb-3 pr-12">
                  <div className="text-2xl shrink-0 mt-0.5">{ind.icon}</div>
                  <div>
                    <div className="font-space text-[9px] tracking-[0.2em] mb-0.5" style={{ color: ind.color }}>{ind.code}</div>
                    <div className="font-bebas text-xl text-white leading-none">{ind.name}</div>
                  </div>
                </div>

                {/* Tag + Rating */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-space text-[9px] px-2 py-0.5 tracking-[0.1em]"
                    style={{ color: ind.color, background: `${ind.color}12`, border: `1px solid ${ind.color}30` }}>
                    {ind.tag}
                  </span>
                  <StarRating value={ind.rating} color={ind.color} />
                </div>

                {/* Description */}
                <p className="font-space text-[11px] text-[#7ab3c8] leading-relaxed mb-4 flex-1">{ind.description}</p>

                {/* Live stats */}
                <div className="space-y-3 mb-5">
                  {ind.stats.map((s, j) => (
                    <div key={j}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-space text-[10px] text-[#7ab3c8] tracking-[0.03em]">{s.label}</span>
                        <span className="font-mono text-[11px] font-bold" style={{ color: s.up ? ind.color : "#ff1744" }}>{s.value}</span>
                      </div>
                      <AnimatedBar value={s.bar} color={ind.color} />
                    </div>
                  ))}
                </div>

                {/* Action button */}
                {ind.comingSoon ? (
                  <div className="block w-full py-2.5 text-center font-space text-[10px] tracking-[0.15em] uppercase border border-[#1a2535] text-[#5a8898]">
                    PRÓXIMAMENTE
                  </div>
                ) : hasAccess ? (
                  <a href={accessUrl}
                    className="block w-full py-2.5 text-center font-space text-[10px] font-bold tracking-[0.15em] uppercase transition-all border"
                    style={{ borderColor: ind.color, color: ind.color, background: `${ind.color}0a` }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${ind.color}20`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${ind.color}0a`; }}>
                    ACCEDER →
                  </a>
                ) : (
                  <Link href="/pricing"
                    className="block w-full py-2.5 text-center font-space text-[10px] font-bold tracking-[0.15em] uppercase transition-all border border-[#1a2535] text-[#7ab3c8] no-underline hover:border-[#00e5ff44] hover:text-[#00e5ff]">
                    🔒 VER PLAN {ind.plan}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-[#5a8898] font-space text-[12px]">
            No hay indicadores en esta categoría aún.
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="border-t border-[#1a2535] px-6 md:px-12 py-20 text-center">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4">
          Accedé a todos los indicadores
        </div>
        <h2 className="font-bebas text-5xl md:text-7xl mb-4">
          ACTIVÁ TU PLAN <span className="text-[#00e5ff]">PRO</span>
        </h2>
        <p className="font-space text-[12px] text-[#7ab3c8] max-w-md mx-auto leading-relaxed mb-8">
          6 indicadores de análisis institucional + señales en vivo + Aula Virtual completa desde $49/mes. Sin renovación automática.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/pricing"
            className="font-space text-[12px] font-bold tracking-[0.15em] uppercase px-8 py-4 text-[#020408] hover:opacity-90 transition-opacity no-underline"
            style={{ background: "#00e5ff" }}>
            VER PLANES →
          </Link>
          <a href={TELEGRAM} target="_blank" rel="noopener noreferrer"
            className="font-space text-[12px] tracking-[0.15em] uppercase px-8 py-4 border border-[#1a2535] text-[#7ab3c8] hover:border-[#229ED9] hover:text-[#229ED9] transition-colors no-underline">
            ✈️ Telegram
          </a>
        </div>
      </section>
    </div>
  );
}
