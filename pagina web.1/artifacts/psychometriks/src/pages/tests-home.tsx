import React, { useEffect } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/site-nav";
import { TESTS } from "@/data/tests";

function useSeoMeta(title: string, desc: string) {
  useEffect(() => {
    document.title = title;
    let d = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!d) { d = document.createElement("meta") as HTMLMetaElement; d.name = "description"; document.head.appendChild(d); }
    d.content = desc;
  }, [title, desc]);
}

const STATS = [
  { value: "47%", label: "de traders no saben su perfil real" },
  { value: "3 min", label: "es todo lo que lleva cada test" },
  { value: "94%", label: "dice que el resultado fue sorprendente" },
];

const PROFILE_EXAMPLES = [
  { emoji: "😱", name: "FOMO Trader", color: "#ff5252", desc: "Perseguís movimientos. Comprás alto, vendés bajo." },
  { emoji: "🔥", name: "Trader Impulsivo", color: "#ff7043", desc: "Sabés la teoría pero tus emociones ganan siempre." },
  { emoji: "🎯", name: "Cazador de Fondos", color: "#ffd700", desc: "Atrapás fondos a veces — y te barrés otras." },
  { emoji: "🔬", name: "Sobre-Analítico", color: "#ab47bc", desc: "Perfecto análisis que nunca ejecutás." },
  { emoji: "⚔️", name: "Guerrero Mental", color: "#00e676", desc: "Disciplina real. Solo necesitás mejores herramientas." },
  { emoji: "💣", name: "Víctima del Leverage", color: "#ff5252", desc: "Buen análisis destruido por apalancamiento excesivo." },
];

export default function TestsHome() {
  useSeoMeta(
    "Tests de Psicología del Trading | PSYCHOMETRIKS — ¿Qué tipo de trader eres?",
    "Descubrí tu perfil psicológico como trader. Tests gratuitos: ¿Qué tipo de trader eres?, ¿Por qué te liquidan?, y Test de Psicología del Trading."
  );

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 md:px-12 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,229,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,.03) 1px,transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div className="max-w-4xl relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="font-sharetech text-[10px] text-[#00e5ff] tracking-[0.3em] uppercase">
              PSYCHOMETRIKS · TESTS GRATUITOS
            </div>
          </div>
          <h1 className="font-bebas text-[clamp(52px,8vw,100px)] leading-[0.92] tracking-[0.01em] mb-6">
            DESCUBRÍ CÓMO<br />
            <span className="text-[#00e5ff]">PENSÁS</span> AL TRADEAR
          </h1>
          <p className="text-[#6a8090] text-lg max-w-xl leading-[1.7] mb-8">
            El 90% de las liquidaciones no son por análisis incorrecto.
            Son por <strong className="text-white">errores psicológicos repetibles y predecibles</strong>.
            Encontrá el tuyo antes de que te cueste otra cuenta.
          </p>

          {/* Stats */}
          <div className="flex gap-8 flex-wrap mb-12">
            {STATS.map((s) => (
              <div key={s.value}>
                <div className="font-bebas text-3xl text-[#00e5ff]">{s.value}</div>
                <div className="font-sharetech text-[10px] text-[#7ab3c8] tracking-[0.1em] uppercase">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Scroll hint */}
          <div className="font-sharetech text-[10px] text-[#5a8898] tracking-[0.2em] animate-bounce">
            ↓ ELEGÍ TU TEST
          </div>
        </div>
      </section>

      {/* Tests grid */}
      <section className="px-6 md:px-12 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="font-sharetech text-[10px] text-[#5a8898] tracking-[0.3em] uppercase mb-8">
            3 TESTS DISPONIBLES — GRATUITOS Y SIN REGISTRO
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTS.map((test, i) => (
              <Link key={test.id} href={`/tests/${test.id}`}>
                <div
                  className="relative border border-[#1a2535] hover:border-opacity-100 p-8 cursor-pointer transition-all duration-300 group"
                  style={{ borderColor: `${test.color}22` }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${test.color}88`)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${test.color}22`)}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5 transition-opacity"
                    style={{ background: test.color, opacity: 0.4 }}
                  />
                  <div className="absolute top-3 right-4 font-sharetech text-[10px] text-[#5a8898] tracking-widest">
                    0{i + 1}
                  </div>

                  <div className="text-4xl mb-5">{test.emoji}</div>

                  <div
                    className="font-sharetech text-[9px] tracking-[0.3em] uppercase mb-2"
                    style={{ color: test.color }}
                  >
                    TEST · {test.timeMin} MIN · {test.questions.length} PREGUNTAS
                  </div>

                  <h2 className="font-bebas text-2xl text-white mb-3 leading-tight">
                    {test.title}
                  </h2>

                  <p className="font-rajdhani text-[#7ab3c8] text-sm leading-relaxed mb-6">
                    {test.description}
                  </p>

                  <div
                    className="inline-flex items-center gap-2 font-sharetech text-[10px] tracking-[0.2em] uppercase py-3 px-5 transition-all group-hover:gap-3"
                    style={{
                      background: `${test.color}18`,
                      border: `1px solid ${test.color}44`,
                      color: test.color,
                    }}
                  >
                    HACER EL TEST <span>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Profile gallery */}
      <section className="px-6 md:px-12 pb-20 border-t border-[#0d1520]">
        <div className="max-w-5xl mx-auto pt-16">
          <div className="font-sharetech text-[10px] text-[#5a8898] tracking-[0.3em] uppercase mb-2">
            PERFILES POSIBLES
          </div>
          <h2 className="font-bebas text-4xl text-white mb-10">
            ¿Cuál eres vos?
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {PROFILE_EXAMPLES.map((p) => (
              <div
                key={p.name}
                className="border border-[#1a2535] p-5"
                style={{ borderLeftColor: p.color, borderLeftWidth: 2 }}
              >
                <div className="text-2xl mb-2">{p.emoji}</div>
                <div
                  className="font-bebas text-lg mb-1"
                  style={{ color: p.color }}
                >
                  {p.name}
                </div>
                <div className="font-rajdhani text-[#7ab3c8] text-sm">
                  {p.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="px-6 md:px-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <div
            className="border p-10 md:p-14 text-center relative overflow-hidden"
            style={{ borderColor: "#00e5ff22" }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(0,229,255,0.05) 0%, transparent 70%)",
              }}
            />
            <div className="relative z-10">
              <div className="font-sharetech text-[10px] text-[#00e5ff] tracking-[0.3em] uppercase mb-4">
                TOMÁ EL PRIMER TEST AHORA
              </div>
              <h3 className="font-bebas text-[clamp(32px,5vw,64px)] text-white leading-tight mb-4">
                3 MINUTOS QUE PUEDEN<br />
                <span className="text-[#00e5ff]">CAMBIAR TU TRADING</span>
              </h3>
              <p className="font-rajdhani text-[#7ab3c8] text-base mb-8 max-w-md mx-auto">
                Sin registro. Sin email. Resultado inmediato con recomendaciones personalizadas para tu perfil.
              </p>
              <Link href="/tests/tipo-trader">
                <div className="inline-flex items-center gap-3 bg-[#00e5ff] text-[#020408] font-space text-xs font-bold tracking-[0.15em] uppercase px-10 py-4 cursor-pointer hover:bg-white transition-colors">
                  🧠 EMPEZAR: ¿QUÉ TIPO DE TRADER SOY?
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#0d1520] px-6 md:px-12 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <Link href="/" className="font-orbitron text-[11px] font-black text-[#00e5ff] tracking-[0.2em] uppercase no-underline">
            PSY<span className="text-white">CHOMETRIKS</span>
          </Link>
          <div className="font-sharetech text-[10px] text-[#5a8898] tracking-widest">
            TESTS DE PSICOLOGÍA DEL TRADING · GRATUITO
          </div>
        </div>
      </footer>
    </div>
  );
}
