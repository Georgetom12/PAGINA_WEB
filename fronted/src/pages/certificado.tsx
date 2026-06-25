import React, { useState, useRef } from "react";
import SiteNav from "@/components/site-nav";

const COURSES = [
  { id: "psicologia", label: "Psicología del Trading", sublabel: "Fundamentos Cognitivos y Emocionales" },
  { id: "gestion", label: "Gestión de Riesgo Profesional", sublabel: "Position Sizing · Drawdown · R:R" },
  { id: "smc", label: "Smart Money Concepts", sublabel: "Nivel 3 — Análisis Institucional" },
  { id: "onchain", label: "Análisis On-Chain Avanzado", sublabel: "LiqMap · Hash Rate · Dominance" },
  { id: "macro", label: "Macro Trading & BTC", sublabel: "FED · DXY · Yields · Correlaciones" },
  { id: "trader30", label: "PSY Trader 30 Días", sublabel: "Challenge Completado · Disciplina Probada" },
  { id: "niveles12", label: "Fundamentos PSY — Niveles 1-2", sublabel: "Programa Completo Nivel Básico" },
  { id: "niveles14", label: "Analista PSY — Niveles 1-4", sublabel: "Programa Completo Nivel Intermedio" },
  { id: "full8", label: "Trader PSY Certificado — 8 Niveles", sublabel: "Programa Completo · Score +80%" },
  { id: "elite", label: "Elite PSY Master", sublabel: "8 Niveles + 30 Días Journal · Score +90%" },
];

const CERT_PRICE = 3.00;

function getLevelInfo(score: number) {
  if (score >= 95) return { badge: "💎", label: "ELITE PSY MASTER",         color: "#e040fb", border: "#e040fb" };
  if (score >= 90) return { badge: "🥇", label: "TRADER PSY CERTIFICADO",   color: "#ffd700", border: "#ffd700" };
  if (score >= 80) return { badge: "🥈", label: "ANALISTA PSY",             color: "#00e5ff", border: "#00e5ff" };
  return              { badge: "🥉", label: "FUNDAMENTOS PSY",            color: "#00e676", border: "#00e676" };
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("es-EC", { day: "2-digit", month: "long", year: "numeric" });
}

type Step = "select" | "form" | "payment" | "processing" | "done";

interface CertData {
  certCode: string;
  studentName: string;
  courseName: string;
  score: number;
  issuedAt: string;
  level: string;
}

const API_BASE = "";

export default function Certificado() {
  const [step, setStep]             = useState<Step>("select");
  const [course, setCourse]         = useState<typeof COURSES[0] | null>(null);
  const [name, setName]             = useState("");
  const [score, setScore]           = useState<number>(80);
  const [payMethod, setPayMethod]   = useState<"card" | "crypto" | null>(null);
  const [certData, setCertData]     = useState<CertData | null>(null);
  const [error, setError]           = useState("");
  const certRef                     = useRef<HTMLDivElement>(null);

  const lvl = certData ? getLevelInfo(certData.score) : getLevelInfo(score);

  const verifyUrl = certData
    ? `https://psychometriks.trade/verify/${certData.certCode}`
    : "";

  const qrUrl = certData
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(verifyUrl)}&size=120x120&bgcolor=020b12&color=00e5ff&format=png`
    : "";

  function reset() {
    setStep("select"); setCourse(null); setName(""); setScore(80);
    setPayMethod(null); setCertData(null); setError("");
  }

  async function handlePay() {
    if (!payMethod || !course) return;
    setStep("processing");
    setError("");
    try {
      const r = await fetch(`${API_BASE}/api/certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName: name, courseName: course.label, score }),
      });
      const d = await r.json() as { ok?: boolean; cert?: CertData; error?: string };
      if (!d.ok || !d.cert) throw new Error(d.error ?? "Error al generar");
      setCertData(d.cert);
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setStep("payment");
    }
  }

  function handlePrint() {
    if (!certRef.current) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html><head><title>Certificado ${certData?.certCode ?? ""}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4 landscape; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #020b12; color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cert-wrap { width: 297mm; height: 210mm; display: flex; align-items: center; justify-content: center; }
</style>
</head>
<body>
<div class="cert-wrap">${certRef.current.outerHTML}</div>
</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 800);
  }

  return (
    <div className="min-h-screen bg-[#020b12] text-white">
      <SiteNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">

        {/* Header */}
        <div className="mb-10">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-3">PSYCHOMETRIKS · CREDENCIALES</div>
          <div className="flex flex-wrap items-end gap-5 mb-2">
            <h1 className="font-orbitron font-black text-4xl md:text-5xl text-white leading-none">
              PSY<span className="text-[#00e5ff]">CERT</span>
            </h1>
            <div className="border border-[#00e5ff40] bg-[#00e5ff08] px-3 py-1.5 flex items-center gap-2">
              <span className="text-[#00e5ff] text-sm">💳</span>
              <span className="font-orbitron font-bold text-lg text-[#00e5ff]">${CERT_PRICE.toFixed(2)}</span>
              <span className="font-sharetech text-[7px] tracking-[0.2em] text-[#3a7080]">POR CERT</span>
            </div>
          </div>
          <p className="font-rajdhani text-[13px] text-[#7ab3c8] tracking-wide">
            Certificación oficial verificable · Formato A4 landscape · QR de autenticidad · Compartible en LinkedIn
          </p>
        </div>

        {/* Breadcrumb */}
        {step !== "select" && course && (
          <div className="flex items-center gap-2 mb-8 font-sharetech text-[8px] tracking-[0.2em] flex-wrap">
            <button onClick={reset} className="text-[#7ab3c8] hover:text-[#00e5ff] transition-colors">CERTIFICADOS</button>
            <span className="text-[#0d2030]">›</span>
            <span className="text-[#00e5ff]">{course.label}</span>
            {(step === "payment" || step === "processing") && (
              <><span className="text-[#0d2030]">›</span><span className="text-[#ffd700]">PAGO $3.00</span></>
            )}
            {step === "done" && (
              <><span className="text-[#0d2030]">›</span><span className="text-[#00e676]">✓ EMITIDO</span></>
            )}
          </div>
        )}

        {/* ── STEP: SELECT ─────────────────────────────────────────────── */}
        {step === "select" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-10">
              {COURSES.map(c => (
                <button key={c.id}
                  onClick={() => { setCourse(c); setStep("form"); }}
                  className="border border-[#0d2030] bg-[#040f18] p-4 text-left hover:border-[#00e5ff40] hover:bg-[#04090f] transition-all group">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-orbitron font-semibold text-[11px] tracking-wide text-[#00e5ff] mb-1">{c.label}</div>
                      <div className="font-rajdhani text-[12px] text-[#7ab3c8]">{c.sublabel}</div>
                    </div>
                    <span className="font-orbitron text-xs text-[#ffd700] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">$3 →</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Level guide */}
            <div className="border border-[#0d2030] bg-[#040f18] p-5 mb-8">
              <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-4">NIVELES DE CERTIFICACIÓN</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { badge: "🥉", label: "FUNDAMENTOS PSY", score: "70 – 79%", color: "#00e676", desc: "Niveles 1-2" },
                  { badge: "🥈", label: "ANALISTA PSY",    score: "80 – 89%", color: "#00e5ff", desc: "Niveles 1-4" },
                  { badge: "🥇", label: "TRADER PSY",      score: "90 – 94%", color: "#ffd700", desc: "8 niveles ≥80%" },
                  { badge: "💎", label: "ELITE PSY MASTER",score: "95 – 100%",color: "#e040fb", desc: "8 niveles + journal" },
                ].map(lv => (
                  <div key={lv.label} className="border p-3 text-center" style={{ borderColor: lv.color + "30", backgroundColor: lv.color + "06" }}>
                    <div className="text-2xl mb-1">{lv.badge}</div>
                    <div className="font-orbitron font-bold text-[8px] tracking-wide mb-1" style={{ color: lv.color }}>{lv.label}</div>
                    <div className="font-sharetech text-[8px] text-[#6a8090]">{lv.score}</div>
                    <div className="font-rajdhani text-[10px] text-[#7ab3c8]">{lv.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { icon: "💳", title: "PRECIO ÚNICO $3.00", desc: "Por certificado. Tarjeta o cripto. Sin suscripción." },
                { icon: "📄", title: "A4 LANDSCAPE PDF",   desc: "Diseño profesional imprimible. Perfecto para LinkedIn." },
                { icon: "🔐", title: "QR VERIFICABLE",     desc: "Cada cert tiene QR + ID único que cualquiera puede verificar." },
              ].map(b => (
                <div key={b.title} className="border border-[#0d2030] bg-[#040f18] p-4">
                  <div className="text-xl mb-2">{b.icon}</div>
                  <div className="font-sharetech text-[9px] tracking-[0.15em] text-[#00e5ff] mb-1">{b.title}</div>
                  <div className="font-rajdhani text-[12px] text-[#6a8090]">{b.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── STEP: FORM ───────────────────────────────────────────────── */}
        {step === "form" && course && (
          <div className="max-w-xl">
            <div className="border border-[#0d2030] bg-[#040f18] p-6">
              <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-1">PROGRAMA</div>
              <div className="font-orbitron font-semibold text-sm text-[#00e5ff] mb-5">{course.label}</div>

              <div className="space-y-4">
                <div>
                  <label className="font-sharetech text-[8px] tracking-[0.2em] text-[#7ab3c8] block mb-1.5">NOMBRE COMPLETO DEL ESTUDIANTE</label>
                  <input
                    type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ej: Jorge Mauricio Suárez Pérez"
                    className="w-full bg-[#020b12] border border-[#0d2030] px-4 py-3 font-rajdhani text-[14px] text-white placeholder-[#5a8898] focus:outline-none focus:border-[#00e5ff50]"
                  />
                </div>

                <div>
                  <label className="font-sharetech text-[8px] tracking-[0.2em] text-[#7ab3c8] block mb-1.5">SCORE DEL TEST (mínimo 70 para aprobar)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range" min={70} max={100} value={score}
                      onChange={e => setScore(Number(e.target.value))}
                      className="flex-1 accent-[#00e5ff]"
                    />
                    <div className="w-16 text-center border border-[#0d2030] bg-[#020b12] py-2">
                      <span className="font-orbitron font-bold text-lg" style={{ color: getLevelInfo(score).color }}>{score}</span>
                      <span className="font-sharetech text-[8px] text-[#7ab3c8]">/100</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-base">{getLevelInfo(score).badge}</span>
                    <span className="font-orbitron text-[9px] font-bold tracking-wide" style={{ color: getLevelInfo(score).color }}>
                      {getLevelInfo(score).label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6">
                <button onClick={reset} className="font-sharetech text-[9px] tracking-[0.15em] text-[#7ab3c8] hover:text-[#8a9090] transition-colors">← VOLVER</button>
                <button
                  onClick={() => setStep("payment")}
                  disabled={!name.trim()}
                  className="px-6 py-2.5 font-sharetech text-[9px] tracking-[0.15em] border border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff10] transition-all disabled:opacity-30">
                  CONTINUAR AL PAGO →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: PAYMENT ────────────────────────────────────────────── */}
        {step === "payment" && course && (
          <div className="max-w-xl">
            <div className="border border-[#ffd70040] bg-[#040f18] p-6 mb-3">
              <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-4">RESUMEN DEL PEDIDO</div>
              <div className="flex items-start justify-between gap-4 mb-1">
                <div>
                  <div className="font-orbitron font-semibold text-[11px] text-[#00e5ff]">{course.label}</div>
                  <div className="font-rajdhani text-[12px] text-[#6a8090] mt-0.5">
                    Nombre: <span className="text-white">{name}</span> · Score: <span style={{ color: lvl.color }}>{score}/100</span>
                  </div>
                  <div className="font-rajdhani text-[12px] text-[#6a8090]">
                    Nivel: <span style={{ color: lvl.color }}>{lvl.badge} {lvl.label}</span>
                  </div>
                </div>
                <div className="font-orbitron font-black text-2xl text-[#ffd700] shrink-0">$3.00</div>
              </div>

              <div className="h-px bg-[#0d2030] my-4" />

              <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-3">MÉTODO DE PAGO</div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {([
                  { id: "card" as const, icon: "💳", label: "TARJETA", sub: "Visa · Mastercard" },
                  { id: "crypto" as const, icon: "₿", label: "CRIPTO", sub: "USDT · BTC · ETH" },
                ] as const).map(m => (
                  <button key={m.id} onClick={() => setPayMethod(m.id)}
                    className="border p-4 text-left transition-all"
                    style={{
                      borderColor: payMethod === m.id ? "#ffd700" : "#0d2030",
                      backgroundColor: payMethod === m.id ? "#ffd70008" : "#020b12",
                    }}>
                    <div className="text-xl mb-1">{m.icon}</div>
                    <div className="font-sharetech text-[9px] tracking-[0.15em] text-[#ffd700]">{m.label}</div>
                    <div className="font-rajdhani text-[11px] text-[#7ab3c8]">{m.sub}</div>
                  </button>
                ))}
              </div>

              {payMethod === "card" && (
                <div className="space-y-2 mb-5">
                  <input placeholder="Número de tarjeta" className="w-full bg-[#020b12] border border-[#0d2030] px-3 py-2.5 font-rajdhani text-[13px] text-white placeholder-[#5a8898] focus:outline-none focus:border-[#ffd70050]" />
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="MM / AA" className="bg-[#020b12] border border-[#0d2030] px-3 py-2.5 font-rajdhani text-[13px] text-white placeholder-[#5a8898] focus:outline-none focus:border-[#ffd70050]" />
                    <input placeholder="CVV" className="bg-[#020b12] border border-[#0d2030] px-3 py-2.5 font-rajdhani text-[13px] text-white placeholder-[#5a8898] focus:outline-none focus:border-[#ffd70050]" />
                  </div>
                </div>
              )}

              {payMethod === "crypto" && (
                <div className="border border-[#ffd70030] bg-[#020b12] p-4 mb-5">
                  <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#ffd700] mb-3">ENVÍA EXACTAMENTE $3.00 USD EN USDT / BTC / ETH</div>
                  <div className="bg-[#040f18] border border-[#0d2030] px-3 py-2 mb-2">
                    <div className="font-sharetech text-[7px] tracking-[0.2em] text-[#7ab3c8] mb-1">DIRECCIÓN DE PAGO</div>
                    <div className="font-space text-[9px] text-[#ffd700] break-all select-all">psychometriks.eth</div>
                  </div>
                  <div className="font-sharetech text-[7px] tracking-[0.15em] text-[#7ab3c8]">⚠ Envía solo la red correcta · Pago se confirma automáticamente</div>
                </div>
              )}

              {error && <div className="font-rajdhani text-[12px] text-red-400 mb-3">⚠ {error}</div>}

              <div className="flex items-center justify-between">
                <button onClick={() => setStep("form")} className="font-sharetech text-[9px] tracking-[0.15em] text-[#7ab3c8] hover:text-[#8a9090] transition-colors">← VOLVER</button>
                <button
                  onClick={handlePay} disabled={!payMethod}
                  className="px-8 py-3 font-sharetech text-[9px] tracking-[0.15em] border transition-all disabled:opacity-30"
                  style={{ borderColor: payMethod ? "#ffd700" : "#0d2030", color: payMethod ? "#ffd700" : "#4a6070" }}>
                  🔒 PAGAR $3.00 Y GENERAR →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: PROCESSING ─────────────────────────────────────────── */}
        {step === "processing" && (
          <div className="max-w-xl">
            <div className="border border-[#0d2030] bg-[#040f18] p-14 text-center">
              <div className="font-orbitron font-bold text-4xl text-[#00e5ff] mb-4 animate-pulse">PSY</div>
              <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#ffd700] mb-2">PROCESANDO PAGO · GENERANDO CERTIFICADO</div>
              <div className="mt-6 flex justify-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-[#00e5ff] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: DONE — Certificate ─────────────────────────────────── */}
        {step === "done" && certData && (
          <div>
            {/* Success banner */}
            <div className="border border-[#00e67650] bg-[#00e67606] px-5 py-3 mb-6 flex items-center gap-3">
              <span className="text-[#00e676] text-lg">✓</span>
              <div>
                <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#00e676]">PAGO CONFIRMADO · $3.00 USD · CERTIFICADO EMITIDO</div>
                <div className="font-rajdhani text-[12px] text-[#7ab3c8]">
                  ID: <span className="text-[#00e5ff]">{certData.certCode}</span> · Comparte el link de verificación o descarga el PDF
                </div>
              </div>
            </div>

            {/* The actual certificate — landscape A4 design */}
            <div className="overflow-x-auto mb-4">
              <div ref={certRef}
                style={{
                  width: "900px",
                  height: "637px",
                  background: "linear-gradient(#020b12, #020b12) padding-box, linear-gradient(135deg, #00e5ff, #e040fb, #00e5ff 80%) border-box",
                  border: "3px solid transparent",
                  position: "relative",
                  overflow: "hidden",
                  padding: "36px 44px",
                  boxSizing: "border-box",
                  flexShrink: 0,
                }}>

                {/* Grid background */}
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  backgroundImage: "linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px)",
                  backgroundSize: "30px 30px",
                }} />

                {/* PSY watermark */}
                <div style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  pointerEvents: "none",
                }}>
                  <span style={{
                    fontFamily: "'Orbitron', monospace", fontWeight: 900, fontSize: "220px",
                    color: "rgba(0,229,255,0.03)", letterSpacing: "-0.05em", userSelect: "none",
                  }}>PSY</span>
                </div>

                {/* Inner glow corners */}
                <div style={{ position: "absolute", top: 0, left: 0, width: "120px", height: "120px", background: "radial-gradient(ellipse at top left, rgba(0,229,255,0.08), transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: 0, right: 0, width: "120px", height: "120px", background: "radial-gradient(ellipse at bottom right, rgba(224,64,251,0.08), transparent 70%)", pointerEvents: "none" }} />

                {/* Content */}
                <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>

                  {/* Top row: logo + title + level badge */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div>
                      <div style={{ fontFamily: "'Orbitron', monospace", fontWeight: 900, fontSize: "28px", color: "#00e5ff", letterSpacing: "0.05em", lineHeight: 1 }}>
                        PSY<span style={{ color: "white" }}>CHOME</span><span style={{ color: "#e040fb" }}>TRIKS</span>
                      </div>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#4a6070", letterSpacing: "0.25em", marginTop: "3px" }}>
                        PLATAFORMA DE PSICOLOGÍA Y ANÁLISIS CRYPTO
                      </div>
                    </div>
                    <div style={{
                      border: `1px solid ${lvl.color}50`, background: `${lvl.color}10`,
                      padding: "6px 14px", textAlign: "center",
                    }}>
                      <div style={{ fontSize: "20px", lineHeight: 1, marginBottom: "3px" }}>{lvl.badge}</div>
                      <div style={{ fontFamily: "'Orbitron', monospace", fontWeight: 700, fontSize: "8px", color: lvl.color, letterSpacing: "0.1em" }}>{lvl.label}</div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: "1px", background: `linear-gradient(to right, transparent, #00e5ff60, #e040fb60, transparent)`, marginBottom: "22px" }} />

                  {/* Main content */}
                  <div style={{ flex: 1, display: "flex", gap: "32px" }}>

                    {/* Left: certifies */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#4a6070", letterSpacing: "0.3em", marginBottom: "8px" }}>
                        SE CERTIFICA QUE
                      </div>
                      <div style={{ fontFamily: "'Orbitron', monospace", fontWeight: 900, fontSize: "28px", color: "white", letterSpacing: "0.02em", lineHeight: 1.1, marginBottom: "10px", textShadow: "0 0 20px rgba(0,229,255,0.2)" }}>
                        {certData.studentName}
                      </div>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "13px", color: "#8a9090", marginBottom: "18px" }}>
                        ha completado satisfactoriamente el programa
                      </div>

                      {/* Course box */}
                      <div style={{
                        border: `1px solid ${lvl.color}35`,
                        background: `${lvl.color}08`,
                        padding: "12px 16px",
                        marginBottom: "20px",
                      }}>
                        <div style={{ fontFamily: "'Orbitron', monospace", fontWeight: 700, fontSize: "13px", color: lvl.color, letterSpacing: "0.05em", marginBottom: "3px" }}>
                          {certData.courseName}
                        </div>
                        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "12px", color: "#6a8090" }}>
                          PSYCHOMETRIKS · Programa de Formación Profesional
                        </div>
                      </div>

                      {/* Score */}
                      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        <div>
                          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "8px", color: "#4a6070", letterSpacing: "0.2em", marginBottom: "3px" }}>SCORE OBTENIDO</div>
                          <div style={{ fontFamily: "'Orbitron', monospace", fontWeight: 900, fontSize: "32px", color: lvl.color, letterSpacing: "0.05em", lineHeight: 1 }}>
                            {certData.score}<span style={{ fontSize: "14px", color: "#6a8090" }}>/100</span>
                          </div>
                        </div>
                        <div style={{ height: "50px", width: "1px", background: "#0d2030" }} />
                        <div>
                          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "8px", color: "#4a6070", letterSpacing: "0.2em", marginBottom: "3px" }}>FECHA DE EMISIÓN</div>
                          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "14px", color: "white" }}>
                            {fmtDate(new Date(certData.issuedAt))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: QR + ID + signature */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", width: "150px", flexShrink: 0 }}>
                      {/* QR */}
                      <div>
                        <div style={{ border: "1px solid #0d2030", padding: "6px", background: "#020b12", marginBottom: "6px" }}>
                          <img src={qrUrl} alt="QR" width={110} height={110} style={{ display: "block" }} />
                        </div>
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "7px", color: "#4a6070", letterSpacing: "0.1em", textAlign: "center" }}>
                          ESCANEA PARA<br />VERIFICAR
                        </div>
                      </div>

                      {/* ID + signature */}
                      <div style={{ textAlign: "center", width: "100%" }}>
                        <div style={{ borderTop: "1px solid #0d2030", paddingTop: "10px", marginBottom: "6px" }}>
                          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "7px", color: "#4a6070", letterSpacing: "0.15em", marginBottom: "3px" }}>FIRMA DIGITAL</div>
                          <div style={{ fontFamily: "'Orbitron', monospace", fontWeight: 700, fontSize: "12px", color: "#00e5ff", letterSpacing: "0.1em" }}>PSYCHOMETRIKS</div>
                        </div>
                        <div style={{ background: "#04090f", border: "1px solid #0d2030", padding: "5px 8px" }}>
                          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "7px", color: "#4a6070", marginBottom: "2px" }}>ID CERTIFICADO</div>
                          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", color: lvl.color, letterSpacing: "0.05em" }}>
                            {certData.certCode}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom divider */}
                  <div style={{ height: "1px", background: `linear-gradient(to right, transparent, #00e5ff40, transparent)`, margin: "14px 0 8px" }} />
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "7px", color: "#2a4050", letterSpacing: "0.15em", textAlign: "center" }}>
                    Verifica en psychometriks.trade/verify/{certData.certCode} · Solo educativo · No es asesoramiento financiero · #PSYCHOMETRIKS
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-3" style={{ maxWidth: "900px" }}>
              <button onClick={handlePrint}
                className="flex-1 min-w-[180px] py-3 font-sharetech text-[9px] tracking-[0.15em] border border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff10] transition-colors">
                🖨 IMPRIMIR / GUARDAR PDF
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(verifyUrl).catch(() => {}); }}
                className="px-5 py-3 font-sharetech text-[9px] tracking-[0.15em] border border-[#0d2030] text-[#7ab3c8] hover:border-[#7ab3c8] transition-colors">
                🔗 COPIAR LINK VERIFICACIÓN
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(certData.certCode).catch(() => {}); }}
                className="px-5 py-3 font-sharetech text-[9px] tracking-[0.15em] border border-[#0d2030] text-[#7ab3c8] hover:border-[#7ab3c8] transition-colors">
                COPIAR ID
              </button>
              <button onClick={reset}
                className="px-5 py-3 font-sharetech text-[9px] tracking-[0.15em] border border-[#0d2030] text-[#7ab3c8] hover:border-[#7ab3c8] transition-colors">
                NUEVO CERT
              </button>
            </div>
            <div className="font-sharetech text-[8px] text-[#5a8898] tracking-[0.15em]" style={{ maxWidth: "900px" }}>
              🔐 Verifica en: <span className="text-[#00e5ff]">{verifyUrl}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
