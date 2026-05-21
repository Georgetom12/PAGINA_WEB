import React, { useState, useEffect } from "react";
import SiteNav from "@/components/site-nav";

const TELEGRAM = "https://t.me/psychometriks_pro";

const DEFAULT_CONFIG = {
  paypal: "psychometriks@gmail.com",
  binance: "psychometriks_pro",
  bank: "Banco Pichincha\nCuenta Ahorros: 2207XXXXXX\nNombre: JORGE\nCédula: 17XXXXXXXX",
};

function loadConfig() {
  try {
    const raw = localStorage.getItem("psy_config");
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) } as typeof DEFAULT_CONFIG;
  } catch {}
  return DEFAULT_CONFIG;
}

interface Plan {
  tier: string; name: string;
  priceM: string; priceL: string;
  featured: boolean; badge?: string;
  color: string; description: string;
  features: string[]; notIncluded: string[];
  access: string[];
  tag?: string;
}

const PLANS: Plan[] = [
  {
    tier: "FREE", name: "EXCHANGE FREE",
    priceM: "0", priceL: "0",
    featured: false, color: "#4a6070",
    tag: "GRATIS",
    description: "Creá tu cuenta gratis y accedé a PSY Exchange y PSY Wallet. Sin tarjeta de crédito.",
    features: [
      "🚀 PSY Exchange — SWAP de tokens vía 0x Protocol",
      "💎 PSY Wallet — conectá MetaMask, Trust, OKX, Rainbow",
      "🛑 Kill Switch — cierre de emergencia en 1 toque",
      "Verificación de correo incluida",
      "Reset de contraseña",
      "Chat de soporte interno",
    ],
    access: ["exchange", "psy-wallet"],
    notIncluded: ["Señales de trading", "LiqMap PRO", "Aula Virtual", "Dashboard", "Herramientas PSY"],
  },
  {
    tier: "NIVEL 1", name: "BÁSICO",
    priceM: "9", priceL: "59",
    featured: false, color: "#00e676",
    tag: "INICIO",
    description: "Empezá a aprender trading institucional desde cero. Acceso al Aula Virtual con los primeros 3 niveles.",
    features: [
      "📚 Aula Virtual — Niveles 1 al 3",
      "Fundamentos, lectura de precio y velas",
      "Introducción al Smart Money Concepts",
      "Actualizaciones de contenido incluidas",
      "Soporte por Telegram",
    ],
    access: ["aula"],
    notIncluded: ["LiqMap PRO", "Señales en vivo", "Indicadores PSY", "Mentoring"],
  },
  {
    tier: "NIVEL 2", name: "EDUCACIÓN",
    priceM: "29", priceL: "179",
    featured: false, color: "#00bcd4",
    tag: "FORMACIÓN COMPLETA",
    description: "Acceso completo al Aula Virtual — todos los niveles, desde cero hasta estrategias avanzadas de SMC y Macro.",
    features: [
      "📚 Aula Virtual completa — 8 niveles",
      "44+ módulos desde cero hasta avanzado",
      "Fundamentos, SMC, Macro, Técnico",
      "Actualizaciones de contenido incluidas",
      "Soporte por Telegram",
    ],
    access: ["aula"],
    notIncluded: ["LiqMap PRO", "Señales en vivo", "Indicadores PSY", "Mentoring"],
  },
  {
    tier: "NIVEL 3", name: "PRO",
    priceM: "49", priceL: "299",
    featured: true, badge: "MÁS POPULAR", color: "#00e5ff",
    tag: "TRADING ACTIVO",
    description: "Para traders con base que quieren operar con ventaja institucional real. Herramientas + formación.",
    features: [
      "Todo lo del plan Educación",
      "⚡ LiqMap PRO — mapa de liquidaciones 24/7",
      "📡 Señales BTC / ETH / SOL en vivo",
      "📊 Score PSY + Anti-Liquidación",
      "Funding Rate · Fear & Greed · L/S Ratio",
      "Open Interest Tracker",
      "BTC Dominancia · Análisis macro diario",
    ],
    access: ["aula", "liqmap", "signals", "indicators"],
    notIncluded: ["Mentoring personalizado"],
  },
  {
    tier: "NIVEL 4", name: "ELITE",
    priceM: "99", priceL: "599",
    featured: false, color: "#e040fb",
    tag: "ACCESO TOTAL",
    description: "Todo el ecosistema PSYCHOMETRIKS + acompañamiento directo 1:1 con análisis IA avanzado.",
    features: [
      "Todo lo del plan Pro",
      "🤖 SEÑALES PSY — Algoritmo multi-indicador Telegram en tiempo real",
      "🎯 Whale Signals — Copy Trade Ballenas + Gem Hunter",
      "🐋 Whale Alert — movimientos +$1M on-chain",
      "📡 Exchange Signals — Alertas institucionales WhalePerp en vivo",
      "💥 Short Squeeze Radar — Detección funding extremo + OI masivo",
      "🪙 Señales Altcoins — Top 50 · Hyperliquid tiempo real",
      "📈 Acciones & Renta Fija — LiqMap stocks, bonds, ETFs",
      "🏛 Equities Command Center — Top 20 stocks · análisis técnico · macro correlaciones",
      "🔮 PSY ORACLE — Dashboard institucional completo · 9 secciones · PSY BRAIN IA (Claude)",
      "🧠 PSY BRAIN — Analista IA institucional · Claude Sonnet 4 · 9 tipos de análisis (Técnico, Macro, Opciones, Wyckoff, Elliott...)",
      "📡 ORACLE FEEDS — Precios live · Whale Alerts on-chain · Noticias · Fear & Greed · Mineros BTC · Tesoros corporativos",
      "🛡 Anti-Rug Scanner — Score de riesgo · Honeypot · Holder concentration",
      "📋 Marketplace de Estrategias — 8+ estrategias verificadas con backtest",
      "⚡ Command Center — Dashboard institucional · Scanner · Portfolio · OI · PSY AI",
      "🧠 Mentoring personalizado (sesiones 1:1)",
      "Canal privado con señales prioritarias",
      "Acceso anticipado a nuevos módulos",
    ],
    access: ["aula", "liqmap", "signals", "indicators", "mentoring"],
    notIncluded: [],
  },
];

type PayTab = "binance" | "paypal" | "bank";
type BillingCycle = "monthly" | "lifetime";

const ACCESS_BADGES: Record<string, { label: string; color: string; icon: string }> = {
  aula:       { label: "Aula Virtual",    color: "#00e676", icon: "📚" },
  liqmap:     { label: "LiqMap PRO",      color: "#00e5ff", icon: "💧" },
  signals:    { label: "Señales Live",    color: "#ffd700", icon: "📡" },
  indicators: { label: "Indicadores PSY", color: "#e040fb", icon: "📊" },
  mentoring:  { label: "Mentoring 1:1",   color: "#ff6d00", icon: "🧠" },
};

export default function Pricing() {
  const [cfg, setCfg] = useState(DEFAULT_CONFIG);
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [payTab, setPayTab] = useState<PayTab>("binance");

  useEffect(() => { setCfg(loadConfig()); }, []);

  const active = PLANS.find(p => p.name === selectedPlan);
  const activePrice = active ? (billing === "monthly" ? active.priceM : active.priceL) : "0";

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      {/* Hero */}
      <section className="pt-32 pb-12 px-6 md:px-12 text-center">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4">
          Elegí tu nivel de acceso
        </div>
        <h1 className="font-bebas text-6xl md:text-8xl leading-none mb-4">
          PLANES DE<br /><span className="text-[#00e5ff]">AUTORIZACIÓN</span>
        </h1>
        <p className="text-[#7ab3c8] font-space text-sm max-w-lg mx-auto leading-relaxed mb-8">
          Pagos manuales. Enviá tu comprobante por Telegram — acceso activado en minutos.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex border border-[#1a2535] overflow-hidden mb-2">
          <button
            onClick={() => setBilling("monthly")}
            className="px-6 py-3 font-space text-[11px] tracking-[0.15em] uppercase transition-all"
            style={{ background: billing === "monthly" ? "#00e5ff18" : "transparent", color: billing === "monthly" ? "#00e5ff" : "#4a6070", borderRight: "1px solid #1a2535" }}>
            MENSUAL
          </button>
          <button
            onClick={() => setBilling("lifetime")}
            className="px-6 py-3 font-space text-[11px] tracking-[0.15em] uppercase transition-all relative"
            style={{ background: billing === "lifetime" ? "#ffd70018" : "transparent", color: billing === "lifetime" ? "#ffd700" : "#4a6070" }}>
            LIFETIME
            <span className="ml-2 font-space text-[9px] px-1.5 py-0.5 bg-[#ffd70022] text-[#ffd700] border border-[#ffd70033]">AHORRÁS 40%</span>
          </button>
        </div>
        {billing === "lifetime" && (
          <p className="font-space text-[10px] text-[#7ab3c8] mt-2">Pago único · Acceso de por vida · Sin renovaciones</p>
        )}
      </section>

      {/* Plans grid — 4 columns */}
      <section className="px-4 md:px-8 pb-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a2535] border border-[#1a2535]">
          {PLANS.map((plan) => (
            <div key={plan.name}
              className="relative p-6 transition-all flex flex-col"
              style={{
                background: plan.featured ? "#0d1520" : "#060a0f",
                outline: selectedPlan === plan.name ? `2px solid ${plan.color}` : undefined,
              }}>

              {plan.badge && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px font-space text-[9px] font-bold tracking-[0.15em] px-3 py-0.5 uppercase whitespace-nowrap"
                  style={{ background: plan.color, color: "#020408" }}>
                  {plan.badge}
                </div>
              )}

              <div className="font-space text-[8px] tracking-[0.25em] uppercase mb-1 mt-2" style={{ color: plan.color }}>
                {plan.tier} · {plan.tag}
              </div>
              <div className="font-bebas text-4xl mb-1" style={{ color: plan.color }}>{plan.name}</div>

              {/* Price */}
              <div className="mb-1 flex items-end gap-1.5">
                <span className="font-bebas text-5xl text-white">
                  ${billing === "monthly" ? plan.priceM : plan.priceL}
                </span>
                <span className="font-space text-[10px] text-[#7ab3c8] pb-2">
                  {billing === "monthly" ? "/ mes" : "único"}
                </span>
              </div>
              {billing === "monthly" && (
                <div className="font-space text-[9px] text-[#5a8898] mb-3">
                  o ${plan.priceL} lifetime
                </div>
              )}

              <p className="font-space text-[11px] text-[#7ab3c8] leading-relaxed mb-4">{plan.description}</p>

              {/* Access badges */}
              <div className="flex flex-wrap gap-1 mb-4">
                {plan.access.filter(a => ACCESS_BADGES[a]).map(a => (
                  <span key={a} className="font-space text-[8px] px-1.5 py-0.5 tracking-[0.05em]"
                    style={{ color: ACCESS_BADGES[a].color, background: `${ACCESS_BADGES[a].color}12`, border: `1px solid ${ACCESS_BADGES[a].color}33` }}>
                    {ACCESS_BADGES[a].icon} {ACCESS_BADGES[a].label}
                  </span>
                ))}
              </div>

              <div className="flex-1 mb-5 space-y-1.5">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 font-space text-[11px] text-[#8a9ab0]">
                    <span style={{ color: plan.color }} className="mt-0.5 shrink-0">✔</span> {f}
                  </div>
                ))}
                {plan.notIncluded.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 font-space text-[11px] text-[#2a3a4a] line-through">
                    <span className="mt-0.5 shrink-0">✕</span> {f}
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setSelectedPlan(plan.name); setPayTab("binance"); document.getElementById("payment-panel")?.scrollIntoView({ behavior: "smooth" }); }}
                className="w-full py-3 font-space text-[11px] font-bold tracking-[0.12em] uppercase transition-all mt-auto"
                style={{
                  background: selectedPlan === plan.name ? plan.color : "transparent",
                  border: `1px solid ${plan.color}`,
                  color: selectedPlan === plan.name ? "#020408" : plan.color,
                }}>
                {selectedPlan === plan.name ? "✓ SELECCIONADO" : "ELEGIR ESTE PLAN"}
              </button>
            </div>
          ))}
        </div>

        {/* Payment panel */}
        <div id="payment-panel">
          {active && (
            <div className="mt-px border border-t-0 border-[#1a2535] bg-[#080d14] p-8">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div>
                    <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.3em] uppercase mb-1">Plan seleccionado</div>
                    <div className="font-bebas text-4xl" style={{ color: active.color }}>
                      {active.name} — ${activePrice}
                      <span className="text-[#7ab3c8] text-2xl">{billing === "monthly" ? "/mes" : " único"}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {active.access.map(a => (
                        <span key={a} className="font-space text-[9px] px-2 py-0.5"
                          style={{ color: ACCESS_BADGES[a].color, background: `${ACCESS_BADGES[a].color}12`, border: `1px solid ${ACCESS_BADGES[a].color}33` }}>
                          {ACCESS_BADGES[a].icon} {ACCESS_BADGES[a].label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setSelectedPlan(null)}
                    className="font-space text-[11px] text-[#7ab3c8] hover:text-white border border-[#1a2535] px-3 py-1.5">
                    Cambiar plan
                  </button>
                </div>

                {/* Payment method tabs */}
                <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.3em] uppercase mb-3">Método de pago</div>
                <div className="flex border border-[#1a2535] mb-6 overflow-hidden">
                  {([
                    { key: "binance", label: "🟡 USDT / Binance Pay" },
                    { key: "paypal",  label: "💳 PayPal / Tarjeta" },
                    { key: "bank",    label: "🏦 Transferencia" },
                  ] as { key: PayTab; label: string }[]).map(m => (
                    <button key={m.key} onClick={() => setPayTab(m.key)}
                      className="flex-1 py-3 font-space text-[10px] tracking-[0.08em] transition-all"
                      style={{
                        background: payTab === m.key ? "#00e5ff18" : "transparent",
                        borderBottom: payTab === m.key ? "2px solid #00e5ff" : "2px solid transparent",
                        color: payTab === m.key ? "#00e5ff" : "#4a6070",
                      }}>
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="bg-[#0d1520] border border-[#1a2535] p-6 mb-6">
                  {payTab === "binance" && (
                    <div>
                      <p className="font-space text-[12px] text-[#7ab3c8] mb-4 leading-relaxed">
                        Enviá <span className="text-[#ffd700] font-semibold">${activePrice} USDT</span> por Binance Pay — escaneá el QR o transferí al ID:
                      </p>
                      <div className="flex gap-6 items-start flex-wrap">
                        <div className="bg-white rounded-lg p-2 w-36 h-36 shrink-0 overflow-hidden">
                          <img src="/binance-qr.jpg" alt="Binance Pay QR"
                            className="w-full h-full object-cover" style={{ objectPosition: "center 18%" }} />
                        </div>
                        <div className="flex-1 min-w-[180px] space-y-3">
                          <div>
                            <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] mb-1">BINANCE ID</div>
                            <div className="bg-[#060a0f] border border-[#ffd70033] p-3 font-mono text-[16px] text-[#ffd700] tracking-widest">
                              104 421 445 2
                            </div>
                          </div>
                          <div>
                            <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] mb-1">USUARIO</div>
                            <div className="bg-[#060a0f] border border-[#1a2535] p-3 font-mono text-[13px] text-[#e0f4ff]">
                              @{cfg.binance}
                            </div>
                          </div>
                          <div className="font-space text-[10px] text-[#5a8898]">
                            Aceptamos USDT (TRC20/BEP20), BTC, BNB y otras cripto
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 border border-[#ffd70022] bg-[#ffd70008]">
                        <div className="font-space text-[11px] text-[#ffd700] mb-1">⚡ Método más rápido</div>
                        <div className="font-space text-[10px] text-[#7ab3c8]">Activación en minutos tras confirmación. Enviá el hash o captura por Telegram.</div>
                      </div>
                    </div>
                  )}

                  {payTab === "paypal" && (
                    <div>
                      <p className="font-space text-[12px] text-[#7ab3c8] mb-4 leading-relaxed">
                        Realizá el pago por PayPal (acepta tarjeta de crédito/débito) al siguiente correo:
                      </p>
                      <div className="bg-[#060a0f] border border-[#00e5ff22] p-4 font-mono text-[15px] text-[#e0f4ff] mb-3">
                        {cfg.paypal}
                      </div>
                      <p className="font-space text-[11px] text-[#5a8898]">Incluir en el concepto: "PSY {active.name} {billing === "lifetime" ? "LIFETIME" : ""}"</p>
                    </div>
                  )}

                  {payTab === "bank" && (
                    <div>
                      <p className="font-space text-[12px] text-[#7ab3c8] mb-4 leading-relaxed">
                        Transferencia bancaria — datos completos:
                      </p>
                      <div className="bg-[#060a0f] border border-[#e040fb22] p-4 font-mono text-[13px] text-[#e0f4ff] whitespace-pre-line leading-relaxed">
                        {cfg.bank}
                      </div>
                      <p className="font-space text-[11px] text-[#5a8898] mt-3">Incluir en el concepto: "PSY {active.name}"</p>
                    </div>
                  )}
                </div>

                <a href={`${TELEGRAM}?start=plan_${active.name.toLowerCase()}_${billing}`}
                  target="_blank" rel="noopener noreferrer"
                  className="block w-full py-4 text-center font-space text-[12px] font-bold tracking-[0.2em] uppercase text-white transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#2CA5E0,#229ED9)" }}>
                  ✈️ ENVIAR COMPROBANTE POR TELEGRAM
                </a>
                <p className="font-space text-[10px] text-[#5a8898] text-center mt-3">
                  Activación manual · Ecuador UTC-5 · Respondemos en minutos en horario laboral
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* API Developer Add-on */}
      <section className="px-4 md:px-8 pb-10 max-w-7xl mx-auto">
        <div className="border border-[#00e5ff33] bg-[#00e5ff05] p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="text-3xl shrink-0">⚡</div>
          <div className="flex-1">
            <div className="font-space text-[9px] text-[#00e5ff] tracking-[0.3em] uppercase mb-1">ADD-ON DISPONIBLE PARA CUALQUIER PLAN</div>
            <div className="font-bebas text-3xl text-white mb-1">API DEVELOPER KEY — $10 / mes</div>
            <div className="font-space text-[11px] text-[#7ab3c8] leading-relaxed mb-2">
              Acceso programático a todos los endpoints de mercado de PSYCHOMETRIKS. Integrá datos reales en tus scripts, bots o plataformas propias.
            </div>
            <div className="flex flex-wrap gap-4 font-space text-[10px]">
              <span className="text-[#00e5ff]">✔ 120 req/min</span>
              <span className="text-[#00e5ff]">✔ 5.000 req/día</span>
              <span className="text-[#00e5ff]">✔ Kraken · OKX · Coinbase</span>
              <span className="text-[#00e5ff]">✔ JSON · REST</span>
            </div>
          </div>
          <div className="shrink-0 text-center">
            <div className="font-bebas text-5xl text-[#00e5ff]">$10</div>
            <div className="font-space text-[9px] text-[#7ab3c8] mb-3">por mes</div>
            <a href="https://t.me/psychometriks_pro" target="_blank" rel="noopener noreferrer"
              className="block font-space text-[10px] font-bold tracking-[0.15em] uppercase px-5 py-2.5 border border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff15] transition-colors no-underline">
              SOLICITAR KEY →
            </a>
          </div>
        </div>
      </section>

      {/* Comparison table — 5 cols (feature + 4 plans) */}
      <section className="px-4 md:px-8 pb-16 max-w-7xl mx-auto">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-8 text-center">Comparación de planes</div>
        <div className="border border-[#1a2535] overflow-x-auto">
          <div style={{ minWidth: "640px" }}>
            {/* Header */}
            <div className="grid grid-cols-5 bg-[#080d14]">
              <div className="p-4 font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase">Acceso</div>
              {PLANS.map(p => (
                <div key={p.name} className="p-4 text-center border-l border-[#1a2535]">
                  <div className="font-bebas text-2xl" style={{ color: p.color }}>{p.name}</div>
                  <div className="font-space text-[10px] text-[#7ab3c8]">${p.priceM}/mes</div>
                </div>
              ))}
            </div>
            {/* Rows */}
            {Object.entries(ACCESS_BADGES).map(([key, badge]) => (
              <div key={key} className="grid grid-cols-5 border-t border-[#1a2535]">
                <div className="p-4 font-space text-[12px] text-[#8a9ab0] flex items-center gap-2">
                  <span>{badge.icon}</span> {badge.label}
                </div>
                {PLANS.map(p => (
                  <div key={p.name} className="p-4 text-center border-l border-[#1a2535] flex items-center justify-center">
                    {p.access.includes(key)
                      ? <span style={{ color: p.color }} className="text-lg font-bold">✔</span>
                      : <span className="text-[#1a2535] text-lg">✕</span>
                    }
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 md:px-12 py-16 max-w-3xl mx-auto border-t border-[#1a2535]">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-8">Preguntas frecuentes</div>
        {[
          { q: "¿Cuál es la diferencia entre BÁSICO y EDUCACIÓN?", a: "El plan BÁSICO ($9) da acceso a los primeros 3 niveles del Aula Virtual — ideal para arrancar. El plan EDUCACIÓN ($29) desbloquea los 8 niveles completos con todo el contenido avanzado de SMC y Macro." },
          { q: "¿Cómo recibo el acceso después de pagar?", a: "Enviás el comprobante por Telegram con el plan elegido. En minutos te enviamos tu usuario y contraseña para el Aula Virtual, LiqMap PRO y/o Señales, según tu plan." },
          { q: "¿Qué diferencia hay entre mensual y lifetime?", a: "Con el plan mensual pagás mes a mes. Con el lifetime hacés un único pago y tenés acceso para siempre, incluyendo todas las actualizaciones futuras. Ideal si vas a seguir más de 6 meses." },
          { q: "¿Los planes mensuales se renuevan automáticamente?", a: "No. Los planes son manuales. Te avisamos antes del vencimiento para que puedas renovar sin interrupciones." },
          { q: "¿Qué es el LiqMap PRO?", a: "Es el mapa de liquidaciones en tiempo real — muestra exactamente dónde están los clusters de stops de longs y shorts, el Score PSY, Funding Rate, Fear & Greed y Long/Short Ratio. Disponible desde el plan PRO." },
          { q: "¿Puedo cambiar de plan después?", a: "Sí. Podés subir de plan en cualquier momento pagando la diferencia. Contactanos por Telegram y lo ajustamos al instante." },
          { q: "¿Necesito experiencia previa para el Aula Virtual?", a: "No. El Nivel 1 arranca desde cero absoluto — qué es un mercado, cómo leer un gráfico, conceptos básicos. No se necesita ninguna experiencia previa." },
        ].map((item, i) => (
          <div key={i} className="border-b border-[#1a2535] py-6">
            <div className="font-space text-[13px] text-white mb-2">{item.q}</div>
            <div className="font-space text-[12px] text-[#7ab3c8] leading-relaxed">{item.a}</div>
          </div>
        ))}
      </section>

      {/* Footer CTA */}
      <section className="border-t border-[#1a2535] px-6 md:px-12 py-12 text-center">
        <div className="font-bebas text-4xl mb-2">¿TENÉS DUDAS?</div>
        <p className="font-space text-[12px] text-[#7ab3c8] mb-6">Escribinos por Telegram y te asesoramos para elegir el plan correcto.</p>
        <a href={TELEGRAM} target="_blank" rel="noopener noreferrer"
          className="inline-block font-space text-[12px] font-bold tracking-[0.15em] uppercase px-8 py-4 text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#2CA5E0,#229ED9)" }}>
          ✈️ HABLAR CON UN ASESOR
        </a>
      </section>
    </div>
  );
}
