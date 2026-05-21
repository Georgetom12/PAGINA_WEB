import React, { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import SiteNav from "@/components/site-nav";
import { TESTS, getTest, computeResult, type TraderProfile } from "@/data/tests";

const TELEGRAM = "https://t.me/psychometriks_pro";

function ProgressBar({ current, total, color }: { current: number; total: number; color: string }) {
  return (
    <div className="w-full h-1 bg-[#0d1520] rounded-full overflow-hidden">
      <div
        className="h-full transition-all duration-500"
        style={{ width: `${(current / total) * 100}%`, background: color }}
      />
    </div>
  );
}

function ResultView({ profile, testColor, testTitle }: { profile: TraderProfile; testColor: string; testTitle: string }) {
  const planColors: Record<string, string> = {
    PRO: "#00e5ff",
    ELITE: "#ffd700",
    BASIC: "#00e676",
  };
  const planColor = planColors[profile.planCta.plan] ?? "#00e5ff";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const shareText = encodeURIComponent(
    `${profile.emoji} Hice el "${testTitle}" en PSYCHOMETRIKS y soy: "${profile.name}"\n\n"${profile.tagline}"\n\n🔬 Hacé el test gratis en psychometriks.trade/tests\n\n⬡ PSYCHOMETRIKS · psychometriks.trade`
  );

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      <div className="max-w-3xl mx-auto px-6 md:px-12 pt-32 pb-24">
        {/* Result header */}
        <div className="text-center mb-12">
          <div
            className="font-sharetech text-[10px] tracking-[0.4em] uppercase mb-4"
            style={{ color: testColor }}
          >
            TU RESULTADO
          </div>
          <div className="text-7xl mb-4">{profile.emoji}</div>
          <h1
            className="font-bebas text-[clamp(40px,7vw,80px)] leading-tight mb-3"
            style={{ color: profile.color }}
          >
            {profile.name}
          </h1>
          <p className="font-rajdhani text-[#6a8090] text-xl italic">
            "{profile.tagline}"
          </p>
        </div>

        {/* Description card */}
        <div
          className="border p-8 mb-8"
          style={{ borderColor: `${profile.color}33`, background: `${profile.color}08` }}
        >
          <div
            className="font-sharetech text-[9px] tracking-[0.3em] uppercase mb-3"
            style={{ color: profile.color }}
          >
            DIAGNÓSTICO
          </div>
          <p className="font-rajdhani text-[#c0d0e0] text-base leading-relaxed">
            {profile.description}
          </p>
        </div>

        {/* Traits + weaknesses */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="border border-[#1a2535] p-6">
            <div className="font-sharetech text-[9px] tracking-[0.3em] uppercase text-[#00e676] mb-4">
              ✓ TUS FORTALEZAS / RASGOS
            </div>
            <ul className="space-y-2">
              {profile.traits.map((t, i) => (
                <li key={i} className="font-rajdhani text-[#7ab3c8] text-sm flex gap-2">
                  <span className="text-[#1a3a2a] mt-0.5">▸</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-[#1a2535] p-6">
            <div className="font-sharetech text-[9px] tracking-[0.3em] uppercase text-[#ff5252] mb-4">
              ✗ PUNTOS DÉBILES
            </div>
            <ul className="space-y-2">
              {profile.weaknesses.map((w, i) => (
                <li key={i} className="font-rajdhani text-[#7ab3c8] text-sm flex gap-2">
                  <span className="text-[#3a1a1a] mt-0.5">▸</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tools recommendation */}
        <div className="mb-10">
          <div className="font-sharetech text-[9px] tracking-[0.3em] uppercase text-[#7ab3c8] mb-4">
            HERRAMIENTAS RECOMENDADAS PARA TU PERFIL
          </div>
          <div className="space-y-3">
            {profile.tools.map((tool, i) => (
              <Link key={i} href={tool.href}>
                <div className="flex items-center gap-4 border border-[#1a2535] p-4 hover:border-[#2a3a50] hover:bg-[#0d1520] transition-all cursor-pointer">
                  <div className="text-2xl w-10 text-center shrink-0">{tool.icon}</div>
                  <div className="flex-1">
                    <div className="font-sharetech text-[11px] text-white tracking-wider">{tool.name}</div>
                    <div className="font-rajdhani text-[#7ab3c8] text-sm">{tool.desc}</div>
                  </div>
                  <div className="text-[#5a8898] text-lg shrink-0">→</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA funnel */}
        <div
          className="border-2 p-8 md:p-10 mb-8 relative overflow-hidden"
          style={{ borderColor: planColor }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: `linear-gradient(90deg, ${planColor}, transparent)` }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at top left, ${planColor}08 0%, transparent 60%)` }}
          />
          <div className="relative z-10">
            <div
              className="inline-block font-sharetech text-[9px] tracking-[0.3em] uppercase px-3 py-1.5 mb-4"
              style={{ background: `${planColor}20`, color: planColor, border: `1px solid ${planColor}44` }}
            >
              SOLUCIÓN PARA TU PERFIL · PLAN {profile.planCta.plan}
            </div>
            <h3
              className="font-bebas text-3xl md:text-4xl mb-3"
              style={{ color: planColor }}
            >
              {profile.planCta.title}
            </h3>
            <p className="font-rajdhani text-[#6a8090] text-base leading-relaxed mb-6">
              {profile.planCta.desc}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={profile.planCta.href}>
                <div
                  className="text-center font-space text-xs font-bold tracking-[0.15em] uppercase px-8 py-4 cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ background: planColor, color: "#020408" }}
                >
                  VER PLAN {profile.planCta.plan} →
                </div>
              </Link>
              <a
                href={TELEGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center font-space text-xs tracking-[0.15em] uppercase px-8 py-4 border border-[#1a2535] text-[#7ab3c8] hover:text-white hover:border-[#2a3a50] transition-all no-underline"
              >
                ✈️ PREGUNTAR POR TELEGRAM
              </a>
            </div>
          </div>
        </div>

        {/* Share section */}
        <div className="mb-10">
          <div className="font-sharetech text-[9px] tracking-[0.3em] uppercase text-[#5a8898] mb-4">
            🔗 COMPARTIR RESULTADO
          </div>

          {/* PSY Branded share card */}
          <div
            className="border p-5 mb-4 relative overflow-hidden"
            style={{ borderColor: `${profile.color}33`, background: `${profile.color}06` }}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${profile.color},transparent)` }} />
            <div className="font-sharetech text-[9px] tracking-[0.2em] uppercase text-[#7ab3c8] mb-2">VISTA PREVIA DEL POST</div>
            <div className="font-bebas text-2xl mb-1" style={{ color: profile.color }}>
              {profile.emoji} {profile.name}
            </div>
            <div className="font-rajdhani text-sm text-[#6a8090] mb-1">"{profile.tagline}"</div>
            <div className="font-sharetech text-[9px] text-[#5a8898]">
              🔬 Test: {testTitle} · PSYCHOMETRIKS · psychometriks.trade
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* X / Twitter */}
            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}&url=https://psychometriks.trade/tests`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-2 border border-[#1a2535] p-4 hover:bg-[#0d1520] transition-all no-underline group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">𝕏</span>
              <span className="font-sharetech text-[9px] tracking-widest uppercase text-[#7ab3c8] group-hover:text-white transition-colors">Twitter / X</span>
            </a>

            {/* TikTok — copy text */}
            <button
              onClick={() => {
                const text = `${profile.emoji} Hice el "${testTitle}" en PSYCHOMETRIKS y soy: "${profile.name}"\n\n"${profile.tagline}"\n\n🔬 Hacé el test gratis en psychometriks.trade/tests\n\n#trading #psychometriks #tradingpsicologia`;
                navigator.clipboard.writeText(text).then(() => alert("✓ Texto copiado — pegalo en TikTok")).catch(() => {});
              }}
              className="flex flex-col items-center justify-center gap-2 border border-[#1a2535] p-4 hover:bg-[#0d1520] transition-all group cursor-pointer"
              style={{ background: "none" }}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">🎵</span>
              <span className="font-sharetech text-[9px] tracking-widest uppercase text-[#7ab3c8] group-hover:text-white transition-colors">TikTok</span>
            </button>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/?text=${shareText}%20psychometriks.trade/tests`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-2 border border-[#1a2535] p-4 hover:bg-[#0d1520] transition-all no-underline group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">💬</span>
              <span className="font-sharetech text-[9px] tracking-widest uppercase text-[#7ab3c8] group-hover:text-white transition-colors">WhatsApp</span>
            </a>

            {/* Copiar link */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/tests`).then(() => alert("✓ Link copiado")).catch(() => {});
              }}
              className="flex flex-col items-center justify-center gap-2 border border-[#1a2535] p-4 hover:bg-[#0d1520] transition-all group cursor-pointer"
              style={{ background: "none" }}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">🔗</span>
              <span className="font-sharetech text-[9px] tracking-widest uppercase text-[#7ab3c8] group-hover:text-white transition-colors">Copiar link</span>
            </button>
          </div>
        </div>

        {/* Try others */}
        <div className="mb-10">
          <Link href="/tests">
            <div className="flex items-center justify-center gap-2 border border-[#1a2535] p-4 hover:bg-[#0d1520] transition-all cursor-pointer text-[#7ab3c8] hover:text-white">
              <span>🧠</span>
              <span className="font-sharetech text-[10px] tracking-widest uppercase">Hacer otro test</span>
            </div>
          </Link>
        </div>

        {/* Other tests */}
        <div className="border-t border-[#0d1520] pt-8">
          <div className="font-sharetech text-[9px] tracking-[0.3em] uppercase text-[#5a8898] mb-5">
            OTROS TESTS QUE PUEDEN INTERESARTE
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {TESTS.map((t) => (
              <Link key={t.id} href={`/tests/${t.id}`}>
                <div className="border border-[#1a2535] p-4 hover:border-[#2a3a50] hover:bg-[#0d1520] transition-all cursor-pointer">
                  <div className="text-2xl mb-2">{t.emoji}</div>
                  <div className="font-bebas text-base text-white leading-tight mb-1">{t.title}</div>
                  <div
                    className="font-sharetech text-[9px] tracking-widest"
                    style={{ color: t.color }}
                  >
                    {t.timeMin} MIN · {t.questions.length} PREGUNTAS
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestQuiz() {
  const params = useParams<{ testId: string }>();
  const [, navigate] = useLocation();
  const test = getTest(params.testId ?? "");

  const [phase, setPhase] = useState<"intro" | "quiz" | "result">("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [result, setResult] = useState<TraderProfile | null>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [phase, current]);

  useEffect(() => {
    if (!test) navigate("/tests");
  }, [test]);

  if (!test) return null;

  const q = test.questions[current];
  const isLast = current === test.questions.length - 1;

  function handleStart() {
    setPhase("quiz");
    setCurrent(0);
    setAnswers([]);
    setSelectedIdx(null);
  }

  function handleSelect(idx: number) {
    if (animating) return;
    setSelectedIdx(idx);
  }

  function handleNext() {
    if (selectedIdx === null) return;
    const profileId = q.options[selectedIdx].profile;
    const newAnswers = [...answers, profileId];
    setAnimating(true);
    setTimeout(() => {
      setAnimating(false);
      if (isLast) {
        const profile = computeResult(test!, newAnswers);
        setResult(profile);
        setPhase("result");
      } else {
        setAnswers(newAnswers);
        setCurrent(c => c + 1);
        setSelectedIdx(null);
      }
    }, 200);
  }

  if (phase === "result" && result) {
    return <ResultView profile={result} testColor={test.color} testTitle={test.title} />;
  }

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      <div className="max-w-2xl mx-auto px-6 md:px-12 pt-32 pb-24">
        {phase === "intro" && (
          <div>
            <Link href="/tests">
              <div className="inline-flex items-center gap-2 font-sharetech text-[10px] text-[#5a8898] tracking-widest uppercase mb-8 cursor-pointer hover:text-[#7ab3c8] transition-colors">
                ← TODOS LOS TESTS
              </div>
            </Link>

            <div className="text-6xl mb-6">{test.emoji}</div>
            <div
              className="font-sharetech text-[10px] tracking-[0.3em] uppercase mb-3"
              style={{ color: test.color }}
            >
              TEST · {test.timeMin} MINUTOS · {test.questions.length} PREGUNTAS
            </div>
            <h1 className="font-bebas text-[clamp(36px,6vw,72px)] leading-tight text-white mb-4">
              {test.title}
            </h1>
            <p className="font-rajdhani text-[#6a8090] text-lg leading-relaxed mb-10">
              {test.subtitle}
            </p>

            <div className="border border-[#1a2535] p-6 mb-8">
              <div className="font-sharetech text-[9px] tracking-[0.3em] uppercase text-[#5a8898] mb-3">
                ANTES DE EMPEZAR
              </div>
              <ul className="space-y-2 font-rajdhani text-[#7ab3c8] text-sm">
                <li className="flex gap-2"><span className="text-[#00e5ff]">→</span> Respondé con honestidad — no lo que deberías hacer sino lo que realmente hacés</li>
                <li className="flex gap-2"><span className="text-[#00e5ff]">→</span> No hay respuestas correctas o incorrectas</li>
                <li className="flex gap-2"><span className="text-[#00e5ff]">→</span> El resultado incluye recomendaciones de herramientas para tu perfil</li>
                <li className="flex gap-2"><span className="text-[#00e5ff]">→</span> Sin registro, sin email — resultado inmediato</li>
              </ul>
            </div>

            {/* Profile preview */}
            <div className="mb-10">
              <div className="font-sharetech text-[9px] tracking-[0.3em] uppercase text-[#5a8898] mb-4">
                POSIBLES RESULTADOS ({Object.keys(test.profiles).length} PERFILES)
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.values(test.profiles).map((p) => (
                  <div
                    key={p.id}
                    className="font-sharetech text-[9px] tracking-widest px-3 py-1.5"
                    style={{ background: `${p.color}15`, border: `1px solid ${p.color}33`, color: p.color }}
                  >
                    {p.emoji} {p.name}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleStart}
              className="w-full font-space text-sm font-bold tracking-[0.15em] uppercase py-5 transition-all hover:opacity-90"
              style={{ background: test.color, color: "#020408" }}
            >
              EMPEZAR TEST →
            </button>
          </div>
        )}

        {phase === "quiz" && q && (
          <div style={{ opacity: animating ? 0 : 1, transition: "opacity 0.2s" }}>
            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <div
                  className="font-sharetech text-[9px] tracking-[0.3em] uppercase"
                  style={{ color: test.color }}
                >
                  PREGUNTA {current + 1} / {test.questions.length}
                </div>
                <div className="font-sharetech text-[9px] text-[#5a8898]">
                  {Math.round(((current) / test.questions.length) * 100)}% COMPLETADO
                </div>
              </div>
              <ProgressBar current={current} total={test.questions.length} color={test.color} />
            </div>

            {/* Question */}
            <h2 className="font-bebas text-[clamp(24px,4vw,40px)] text-white leading-tight mb-8">
              {q.question}
            </h2>

            {/* Options */}
            <div className="space-y-3 mb-10">
              {q.options.map((opt, i) => {
                const isActive = selectedIdx === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    className="w-full text-left p-5 border transition-all duration-150 flex items-start gap-4"
                    style={{
                      borderColor: isActive ? test.color : "#1a2535",
                      background: isActive ? `${test.color}12` : "transparent",
                    }}
                  >
                    <div
                      className="w-6 h-6 shrink-0 border flex items-center justify-center font-sharetech text-[10px] mt-0.5 transition-all"
                      style={{
                        borderColor: isActive ? test.color : "#2a3a50",
                        background: isActive ? `${test.color}20` : "transparent",
                        color: isActive ? test.color : "#2a3a50",
                      }}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span className="font-rajdhani text-base" style={{ color: isActive ? "#e0f0f8" : "#6a8090" }}>
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Next button */}
            <div className="flex items-center justify-between gap-4">
              <div className="font-sharetech text-[9px] text-[#5a8898] tracking-widest">
                {selectedIdx !== null ? "SELECCIÓN REGISTRADA" : "SELECCIONÁ UNA OPCIÓN"}
              </div>
              <button
                onClick={handleNext}
                disabled={selectedIdx === null}
                className="font-space text-xs font-bold tracking-[0.15em] uppercase px-8 py-4 transition-all"
                style={{
                  background: selectedIdx !== null ? test.color : "#0d1520",
                  color: selectedIdx !== null ? "#020408" : "#2a4a5a",
                  cursor: selectedIdx !== null ? "pointer" : "not-allowed",
                }}
              >
                {isLast ? "VER RESULTADO →" : "SIGUIENTE →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
