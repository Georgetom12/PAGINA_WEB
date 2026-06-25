import React, { useEffect, useState } from "react";
import { useParams } from "wouter";
import SiteNav from "@/components/site-nav";

interface CertData {
  id: number;
  certCode: string;
  studentName: string;
  courseName: string;
  level: string;
  score: number;
  issuedAt: string;
}

function getLevelInfo(level: string, score: number) {
  if (level === "elite" || score >= 95)    return { badge: "💎", label: "ELITE PSY MASTER",       color: "#e040fb" };
  if (level === "trader" || score >= 90)   return { badge: "🥇", label: "TRADER PSY CERTIFICADO", color: "#ffd700" };
  if (level === "analista" || score >= 80) return { badge: "🥈", label: "ANALISTA PSY",           color: "#00e5ff" };
  return                                          { badge: "🥉", label: "FUNDAMENTOS PSY",        color: "#00e676" };
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("es-EC", { day: "2-digit", month: "long", year: "numeric" });
}

const API_BASE = "";

export default function VerifyCert() {
  const params = useParams<{ certCode: string }>();
  const certCode = params.certCode ?? "";

  const [cert, setCert]     = useState<CertData | null>(null);
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "error">("loading");

  useEffect(() => {
    if (!certCode) { setStatus("invalid"); return; }
    fetch(`${API_BASE}/api/certificates/${encodeURIComponent(certCode)}`)
      .then(r => r.json())
      .then((d: { ok?: boolean; cert?: CertData; error?: string }) => {
        if (d.ok && d.cert) { setCert(d.cert); setStatus("valid"); }
        else                 { setStatus("invalid"); }
      })
      .catch(() => setStatus("error"));
  }, [certCode]);

  const lvl = cert ? getLevelInfo(cert.level, cert.score) : null;

  return (
    <div className="min-h-screen bg-[#020b12] text-white">
      <SiteNav />
      <div className="max-w-2xl mx-auto px-4 py-20">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="font-orbitron font-black text-3xl text-[#00e5ff] mb-1">PSY<span className="text-white">CERT</span></div>
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8]">VERIFICACIÓN DE CERTIFICADO</div>
          {certCode && (
            <div className="mt-2 font-space text-[10px] text-[#00e5ff50]">{certCode}</div>
          )}
        </div>

        {/* Loading */}
        {status === "loading" && (
          <div className="border border-[#0d2030] bg-[#040f18] p-14 text-center">
            <div className="font-orbitron font-bold text-2xl text-[#00e5ff] animate-pulse mb-4">PSY</div>
            <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8]">VERIFICANDO CERTIFICADO...</div>
            <div className="mt-5 flex justify-center gap-1.5">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#00e5ff] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Valid */}
        {status === "valid" && cert && lvl && (
          <div>
            {/* Status banner */}
            <div className="border-2 border-[#00e67670] bg-[#00e67608] px-6 py-4 mb-6 text-center">
              <div className="text-4xl mb-2">✅</div>
              <div className="font-orbitron font-black text-xl text-[#00e676] tracking-widest mb-1">CERTIFICADO VÁLIDO</div>
              <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#00e67680]">EMITIDO POR PSYCHOMETRIKS · AUTENTICIDAD VERIFICADA</div>
            </div>

            {/* Cert details */}
            <div
              style={{
                background: "linear-gradient(#040f18, #040f18) padding-box, linear-gradient(135deg, #00e5ff60, #e040fb60) border-box",
                border: "2px solid transparent",
              }}
              className="p-8 mb-5">

              {/* Level */}
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-[#0d2030]">
                <span className="text-4xl">{lvl.badge}</span>
                <div>
                  <div className="font-orbitron font-bold text-lg tracking-wide" style={{ color: lvl.color }}>{lvl.label}</div>
                  <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#7ab3c8]">NIVEL DE CERTIFICACIÓN</div>
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-4">
                {[
                  { label: "NOMBRE DEL ESTUDIANTE", value: cert.studentName, big: true },
                  { label: "PROGRAMA COMPLETADO",   value: cert.courseName },
                  { label: "SCORE OBTENIDO",        value: `${cert.score} / 100`, color: lvl.color },
                  { label: "FECHA DE EMISIÓN",      value: fmtDate(cert.issuedAt) },
                  { label: "ID DE CERTIFICADO",     value: cert.certCode, mono: true, color: "#00e5ff" },
                ].map(f => (
                  <div key={f.label} className="flex flex-col gap-0.5">
                    <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#7ab3c8]">{f.label}</div>
                    <div
                      className={f.big ? "font-orbitron font-bold text-xl text-white" : f.mono ? "font-space text-[11px]" : "font-rajdhani font-semibold text-[15px] text-white"}
                      style={f.color ? { color: f.color } : {}}>
                      {f.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-5 border-t border-[#0d2030] flex items-center justify-between">
                <div className="font-sharetech text-[8px] tracking-[0.15em] text-[#7ab3c8]">
                  🔐 Emitido por <span className="text-[#00e5ff]">PSYCHOMETRIKS</span>
                </div>
                <div className="font-orbitron font-black text-base text-[#00e5ff]">PSY</div>
              </div>
            </div>

            <div className="font-sharetech text-[8px] tracking-[0.1em] text-[#5a8898] text-center">
              psychometriks.trade/verify/{cert.certCode} · Solo educativo · No es asesoramiento financiero
            </div>
          </div>
        )}

        {/* Invalid */}
        {status === "invalid" && (
          <div className="border-2 border-red-900/40 bg-red-950/10 p-14 text-center">
            <div className="text-4xl mb-3">❌</div>
            <div className="font-orbitron font-black text-xl text-red-400 tracking-widest mb-2">CERTIFICADO NO VÁLIDO</div>
            <div className="font-rajdhani text-[13px] text-[#6a8090] mb-1">No encontramos un certificado con el ID:</div>
            <div className="font-space text-[11px] text-red-400 mb-5">{certCode || "—"}</div>
            <div className="font-sharetech text-[9px] tracking-[0.15em] text-[#7ab3c8]">
              Verifica que el ID sea correcto · Contacta a PSYCHOMETRIKS si crees que es un error
            </div>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="border border-[#0d2030] bg-[#040f18] p-14 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <div className="font-orbitron font-bold text-xl text-[#ffd700] tracking-wide mb-2">ERROR DE CONEXIÓN</div>
            <div className="font-rajdhani text-[13px] text-[#6a8090]">No se pudo conectar al servidor. Intenta de nuevo.</div>
            <button onClick={() => { setStatus("loading"); window.location.reload(); }}
              className="mt-5 px-6 py-2 font-sharetech text-[9px] tracking-[0.15em] border border-[#0d2030] text-[#7ab3c8] hover:border-[#7ab3c8] transition-colors">
              REINTENTAR
            </button>
          </div>
        )}

        {/* Go back */}
        <div className="text-center mt-8">
          <a href="/certificado" className="font-sharetech text-[9px] tracking-[0.2em] text-[#7ab3c8] hover:text-[#00e5ff] transition-colors">
            ← GENERAR UN CERTIFICADO
          </a>
        </div>
      </div>
    </div>
  );
}
