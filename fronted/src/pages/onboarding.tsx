import React, { useState } from "react";
import { Link } from "wouter";

const STEPS = [
  {
    id: 1,
    title: "Bienvenido a PSYCHOMETRIKS",
    subtitle: "El sistema de trading institucional",
    icon: "🧠",
    content: (
      <div className="space-y-4">
        <p className="font-space text-[13px] text-[#8a9ab0] leading-relaxed">
          PSYCHOMETRIKS es un ecosistema de trading diseñado para que operes con la misma información que los institucionales — sin filtros, sin ruido.
        </p>
        <div className="grid grid-cols-1 gap-3">
          {[
            { icon: "📡", title: "Señales en tiempo real", desc: "BTC · ETH · SOL — con entry, TP y SL definidos" },
            { icon: "💧", title: "LiqMap PRO", desc: "Mapa de liquidaciones — sabés exactamente dónde está el dinero" },
            { icon: "📚", title: "Aula Virtual", desc: "8 niveles desde cero hasta trading institucional avanzado" },
            { icon: "🤖", title: "PSY Bot IA", desc: "Análisis de mercado en tiempo real con inteligencia artificial" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 border border-[#1a2535] bg-[#080d14]">
              <span className="text-2xl shrink-0">{item.icon}</span>
              <div>
                <div className="font-space text-[12px] text-white">{item.title}</div>
                <div className="font-space text-[11px] text-[#7ab3c8]">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: "Entendé el sistema de riesgo",
    subtitle: "Esto es lo más importante",
    icon: "⚠️",
    content: (
      <div className="space-y-4">
        <p className="font-space text-[13px] text-[#8a9ab0] leading-relaxed">
          Antes de operar, necesitás entender cómo gestionar el riesgo. Los profesionales no ganan porque nunca pierden — ganan porque controlan cuánto pierden.
        </p>
        <div className="border border-[#ffd70033] bg-[#ffd70008] p-4">
          <div className="font-space text-[11px] text-[#ffd700] mb-2">⚡ REGLA FUNDAMENTAL</div>
          <div className="font-mono text-[14px] text-white">Nunca arriesgues más del 1-2% de tu capital por operación.</div>
        </div>
        <div className="space-y-3">
          {[
            { label: "Capital: $1,000 · 1% riesgo",    result: "Máximo $10 en riesgo por trade" },
            { label: "Capital: $5,000 · 1% riesgo",    result: "Máximo $50 en riesgo por trade" },
            { label: "Capital: $10,000 · 1% riesgo",   result: "Máximo $100 en riesgo por trade" },
          ].map((ex, i) => (
            <div key={i} className="flex items-center justify-between p-3 border border-[#1a2535] bg-[#060a0f]">
              <span className="font-space text-[11px] text-[#7ab3c8]">{ex.label}</span>
              <span className="font-mono text-[12px] text-[#00e676]">{ex.result}</span>
            </div>
          ))}
        </div>
        <div className="font-space text-[11px] text-[#7ab3c8] leading-relaxed">
          Usá nuestra <Link href="/calculadora" className="text-[#00e5ff] no-underline">calculadora de position size</Link> para calcular el tamaño exacto de cada posición antes de entrar.
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "Cómo leer las señales",
    subtitle: "Formato estándar PSYCHOMETRIKS",
    icon: "📡",
    content: (
      <div className="space-y-4">
        <p className="font-space text-[13px] text-[#8a9ab0] leading-relaxed">
          Todas las señales siguen el mismo formato. Así es como las interpretás:
        </p>
        <div className="border border-[#00e5ff22] bg-[#060a0f] p-4 font-mono">
          <div className="text-[#00e5ff] text-[11px] mb-3">EJEMPLO DE SEÑAL:</div>
          <div className="space-y-1 text-[13px]">
            <div><span className="text-[#7ab3c8]">ACTIVO: </span><span className="text-white font-bold">BTC/USDT</span></div>
            <div><span className="text-[#7ab3c8]">DIR: </span><span className="text-[#00e676] font-bold">▲ LONG</span></div>
            <div><span className="text-[#7ab3c8]">LEVA: </span><span className="text-[#ffd700]">3x</span></div>
            <div><span className="text-[#7ab3c8]">ENTRADA: </span><span className="text-white">$65,000</span></div>
            <div><span className="text-[#7ab3c8]">TP1: </span><span className="text-[#00e676]">$67,500</span></div>
            <div><span className="text-[#7ab3c8]">TP2: </span><span className="text-[#00e676]">$70,000</span></div>
            <div><span className="text-[#7ab3c8]">SL: </span><span className="text-[#ff1744]">$63,800</span></div>
            <div><span className="text-[#7ab3c8]">R/R: </span><span className="text-[#ffd700]">1:3</span></div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { term: "ENTRADA", color: "#fff",     desc: "El precio donde abrís la posición" },
            { term: "TP1/TP2", color: "#00e676",  desc: "Take Profit — donde tomás ganancias (parciales en TP1)" },
            { term: "SL",      color: "#ff1744",  desc: "Stop Loss — el máximo que podés perder en esa operación" },
            { term: "R/R",     color: "#ffd700",  desc: "Ratio Riesgo/Recompensa — 1:3 = ganás $3 por cada $1 arriesgado" },
            { term: "LEVA",    color: "#e040fb",  desc: "Apalancamiento — amplifica ganancias Y pérdidas. Usalo con cuidado." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 border-b border-[#1a2535]">
              <span className="font-mono text-[12px] font-bold w-14 shrink-0" style={{ color: item.color }}>{item.term}</span>
              <span className="font-space text-[11px] text-[#7ab3c8]">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "Herramientas disponibles",
    subtitle: "Todo lo que tenés en la plataforma",
    icon: "🛠",
    content: (
      <div className="space-y-3">
        <p className="font-space text-[13px] text-[#8a9ab0] leading-relaxed">
          PSYCHOMETRIKS es más que señales. Acá tenés un resumen de todo lo que podés usar:
        </p>
        {[
          { href: "/realtime",           icon: "🔴", label: "Señales Tiempo Real",    desc: "Feed en vivo de señales activas con precios Binance", color: "#ff1744" },
          { href: "/calculadora",        icon: "📐", label: "Position Size Calc",     desc: "Calculá el tamaño exacto de tu posición antes de entrar", color: "#00e5ff" },
          { href: "/converter",          icon: "💱", label: "Conversor Crypto",       desc: "Precios en tiempo real + conversión a tu moneda local", color: "#00e676" },
          { href: "/economic-calendar",  icon: "📅", label: "Calendario Económico",   desc: "FOMC, CPI, NFP — con impacto esperado en BTC", color: "#ffd700" },
          { href: "/leaderboard",        icon: "🏆", label: "Leaderboard Señales",    desc: "Historial completo con win rate y PnL en R-múltiplos", color: "#e040fb" },
          { href: "/pricing",            icon: "💰", label: "Planes de acceso",       desc: "Suscribirte para acceder a todo el ecosistema", color: "#00e676" },
        ].map((item, i) => (
          <Link key={i} href={item.href}
            className="flex items-center gap-3 p-3 border border-[#1a2535] bg-[#060a0f] hover:border-[#1a2535aa] transition-colors no-underline group">
            <span className="text-2xl shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-space text-[12px] text-white">{item.label}</div>
              <div className="font-space text-[11px] text-[#7ab3c8]">{item.desc}</div>
            </div>
            <span className="font-space text-[10px] text-[#5a8898] group-hover:text-[#7ab3c8] transition-colors shrink-0">→</span>
          </Link>
        ))}
      </div>
    ),
  },
  {
    id: 5,
    title: "Elegí tu plan y empezá",
    subtitle: "Acceso completo al ecosistema",
    icon: "🚀",
    content: (
      <div className="space-y-4">
        <p className="font-space text-[13px] text-[#8a9ab0] leading-relaxed">
          Estás listo para empezar. Elegí el plan que se ajuste a tu objetivo:
        </p>
        <div className="space-y-3">
          {[
            { name: "BASIC", price: "$5/mes", color: "#00e676", desc: "Aula Virtual completa — 8 niveles desde cero", tag: "EDUCACIÓN" },
            { name: "PRO",   price: "$49/mes", color: "#00e5ff", desc: "Aula + LiqMap + Señales en vivo + Indicadores PSY", tag: "🔥 MÁS POPULAR", featured: true },
            { name: "ELITE", price: "$99/mes", color: "#e040fb", desc: "Todo lo anterior + Mentoring 1:1 personalizado", tag: "ACCESO TOTAL" },
          ].map((plan, i) => (
            <div key={i} className="border p-4 relative"
              style={{ borderColor: plan.featured ? plan.color + "66" : "#1a2535", background: plan.featured ? plan.color + "08" : "#060a0f" }}>
              {plan.featured && (
                <div className="absolute top-0 right-4 -translate-y-px font-space text-[9px] font-bold px-2 py-0.5"
                  style={{ background: plan.color, color: "#020408" }}>{plan.tag}</div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bebas text-2xl" style={{ color: plan.color }}>{plan.name}</div>
                  <div className="font-space text-[11px] text-[#7ab3c8]">{plan.desc}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[18px] font-black text-white">{plan.price}</div>
                  {!plan.featured && <div className="font-space text-[9px]" style={{ color: plan.color }}>{plan.tag}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
        <Link href="/pricing"
          className="block w-full py-4 text-center font-space text-[13px] font-bold tracking-[0.2em] uppercase text-[#020408] no-underline transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#00e5ff,#0080ff)" }}>
          VER PLANES Y SUSCRIBIRME →
        </Link>
        <div className="text-center font-space text-[10px] text-[#5a8898]">
          Activación en minutos · Pago USDT / Binance Pay · Ecuador UTC-5
        </div>
      </div>
    ),
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  if (done) {
    return (
      <div className="min-h-screen bg-[#020408] text-white font-rajdhani flex items-center justify-center px-4">
        <div className="max-w-lg text-center">
          <div className="text-6xl mb-6">🎯</div>
          <div className="font-bebas text-5xl mb-3 text-[#00e5ff]">LISTO PARA OPERAR</div>
          <p className="font-space text-[13px] text-[#7ab3c8] leading-relaxed mb-8">
            Ya conocés todo lo que necesitás. Ahora explorá la plataforma y empezá a operar con ventaja institucional.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/realtime"
              className="py-4 text-center font-space text-[12px] font-bold tracking-[0.15em] uppercase border border-[#00e5ff44] text-[#00e5ff] no-underline hover:bg-[#00e5ff10] transition-colors">
              🔴 VER SEÑALES
            </Link>
            <Link href="/pricing"
              className="py-4 text-center font-space text-[12px] font-bold tracking-[0.15em] uppercase text-[#020408] no-underline hover:opacity-90 transition-opacity"
              style={{ background: "#00e5ff" }}>
              💰 SUSCRIBIRME
            </Link>
            <Link href="/calculadora"
              className="py-4 text-center font-space text-[12px] font-bold tracking-[0.15em] uppercase border border-[#1a2535] text-[#7ab3c8] no-underline hover:text-white transition-colors">
              📐 CALCULADORA
            </Link>
            <Link href="/"
              className="py-4 text-center font-space text-[12px] font-bold tracking-[0.15em] uppercase border border-[#1a2535] text-[#7ab3c8] no-underline hover:text-white transition-colors">
              🏠 INICIO
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="font-space text-[10px] text-[#5a8898]">PASO {step + 1} DE {STEPS.length}</div>
            <div className="font-space text-[10px] text-[#7ab3c8]">{Math.round(progress)}% completo</div>
          </div>
          <div className="h-1 bg-[#0d1520] border border-[#1a2535]">
            <div className="h-full bg-[#00e5ff] transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            {STEPS.map((s, i) => (
              <div key={i}
                className="w-2 h-2 rounded-full transition-all"
                style={{ background: i < step ? "#00e5ff" : i === step ? "#00e5ff" : "#1a2535", transform: i === step ? "scale(1.4)" : "scale(1)" }}
              />
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="border border-[#1a2535] bg-[#060a0f]">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#1a2535]"
            style={{ background: "linear-gradient(90deg,rgba(0,229,255,0.04),transparent)" }}>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">{current.icon}</span>
              <div>
                <div className="font-space text-[9px] text-[#00e5ff] tracking-[0.3em] uppercase">{current.subtitle}</div>
                <div className="font-bebas text-3xl text-white leading-tight">{current.title}</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">{current.content}</div>

          {/* Navigation */}
          <div className="px-6 pb-6 flex items-center justify-between gap-3">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="font-space text-[11px] tracking-[0.1em] px-4 py-2.5 border border-[#1a2535] text-[#7ab3c8] hover:text-white hover:border-[#7ab3c8] transition-colors disabled:opacity-30">
              ← ATRÁS
            </button>
            <div className="font-space text-[10px] text-[#5a8898]">
              PSYCHOMETRIKS — Sistema institucional
            </div>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="font-space text-[11px] tracking-[0.15em] px-6 py-2.5 font-bold text-[#020408] transition-opacity hover:opacity-90"
                style={{ background: "#00e5ff" }}>
                SIGUIENTE →
              </button>
            ) : (
              <button
                onClick={() => setDone(true)}
                className="font-space text-[11px] tracking-[0.15em] px-6 py-2.5 font-bold text-[#020408] transition-opacity hover:opacity-90"
                style={{ background: "#00e676" }}>
                ¡LISTO! 🚀
              </button>
            )}
          </div>
        </div>

        {/* Skip */}
        <div className="text-center mt-4">
          <button onClick={() => setDone(true)} className="font-space text-[10px] text-[#5a8898] hover:text-[#7ab3c8] transition-colors">
            Saltar tutorial →
          </button>
        </div>
      </div>
    </div>
  );
}
