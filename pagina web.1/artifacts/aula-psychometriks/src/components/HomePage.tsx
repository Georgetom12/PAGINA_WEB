import React from "react";
import { MODULES, LEVEL_META, type Level } from "../data/modules";
import { User, LEVEL_ACCESS } from "../auth/types";

const ALL_LEVELS: Level[] = ["N1","N2","N3","N4","N5","N6","N7","N8"];

interface HomePageProps {
  onSelect: (id: string) => void;
  currentUser: User;
  onGoTests?: () => void;
  onGoExam?: () => void;
}

export function HomePage({ onSelect, currentUser, onGoTests, onGoExam }: HomePageProps) {
  const accessLevels = LEVEL_ACCESS[currentUser.role];

  const grouped = ALL_LEVELS.reduce((acc, level) => {
    acc[level] = MODULES.filter((m) => m.level === level);
    return acc;
  }, {} as Record<Level, typeof MODULES>);

  const accessibleCount = MODULES.filter(m => accessLevels.includes(m.level)).length;

  return (
    <div style={{ padding: "48px 40px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 56, textAlign: "center" }}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace", fontSize: 11,
          letterSpacing: 5, color: "var(--cyan)", marginBottom: 12, opacity: 0.8,
        }}>
          PSYCHOMETRIKS TRADING ACADEMY
        </div>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 72,
          letterSpacing: 8, lineHeight: 1, color: "var(--text)", marginBottom: 16,
        }}>
          AULA VIRTUAL
        </h1>
        <p style={{
          fontSize: 17, color: "var(--muted)", maxWidth: 620,
          margin: "0 auto 24px", lineHeight: 1.7,
        }}>
          Formación profesional en trading. De los fundamentos del mercado hasta
          metodologías institucionales avanzadas y mercados financieros tradicionales.
        </p>

        <div style={{ display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
          {[
            { label: "Módulos Disponibles", value: `${accessibleCount}` },
            { label: "Niveles", value: "8" },
            { label: "Horas", value: "25+" },
            { label: "Plan", value: currentUser.role },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 22, color: "var(--cyan)", fontWeight: 700 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 2, fontFamily: "'Share Tech Mono', monospace", textTransform: "uppercase" as const }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* ─── TESTS & EXÁMENES CTA ─── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(0,229,255,0.06), rgba(224,64,251,0.04))",
          border: "1px solid rgba(0,229,255,0.25)",
          borderRadius: 8, padding: "28px 32px", marginBottom: 8,
        }}>
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, letterSpacing: 4, color: "var(--cyan)", marginBottom: 10 }}>
            ⬡ EVALUACIÓN DE CONOCIMIENTOS
          </div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: 4, color: "var(--text)", marginBottom: 8, lineHeight: 1 }}>
            TESTS Y EXÁMENES
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20, maxWidth: 560 }}>
            Medí tu conocimiento en cada nivel del Aula. 9 modos de examen, 110+ preguntas, calificación instantánea y certificado PSY. Podés compartir tu resultado en redes con el sello PSYCHOMETRIKS.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => onGoTests?.()}
              style={{
                padding: "12px 28px", background: "rgba(0,229,255,0.12)",
                border: "1px solid rgba(0,229,255,0.4)", borderRadius: 4, cursor: "pointer",
                color: "var(--cyan)", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2,
                fontWeight: 700,
              }}
            >
              📋 VER TODOS LOS TESTS →
            </button>
            <button
              onClick={() => onGoExam?.()}
              style={{
                padding: "12px 28px", background: "rgba(224,64,251,0.1)",
                border: "1px solid rgba(224,64,251,0.35)", borderRadius: 4, cursor: "pointer",
                color: "#e040fb", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2,
              }}
            >
              ▶ EXAMEN GENERAL
            </button>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              { label: "9 modos", desc: "N1 a N8 + General" },
              { label: "110+ preguntas", desc: "Banco completo" },
              { label: "Certificado", desc: "Con sello PSY" },
              { label: "Compartible", desc: "X · TikTok · WhatsApp" },
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, color: "var(--cyan)", fontWeight: 700 }}>{f.label}</span>
                <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "var(--muted)" }}>· {f.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {ALL_LEVELS.map((level) => {
        const meta = LEVEL_META[level];
        const mods = grouped[level];
        const locked = !accessLevels.includes(level);

        return (
          <div key={level} style={{ marginBottom: 48, opacity: locked ? 0.45 : 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <span style={{
                fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: 3,
                padding: "4px 12px", border: `1px solid ${locked ? "#1a3a4a" : meta.color}`,
                color: locked ? "#2a4a5a" : meta.color, flexShrink: 0,
              }}>{level}</span>
              <h2 style={{
                fontFamily: "'Orbitron', monospace", fontSize: 16, letterSpacing: 3,
                color: locked ? "#2a4a5a" : meta.color, textTransform: "uppercase" as const,
              }}>{meta.label}</h2>
              {locked && (
                <span style={{
                  fontSize: 10, letterSpacing: 2, color: "#ff6b6b",
                  fontFamily: "'Share Tech Mono', monospace", border: "1px solid #ff174422",
                  padding: "2px 8px", background: "#ff17440a",
                }}>🔒 PLAN SUPERIOR REQUERIDO</span>
              )}
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${locked ? "#1a3a4a" : meta.color}44, transparent)` }} />
              <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "'Share Tech Mono', monospace" }}>
                {mods.length} módulos
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {mods.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => !locked && onSelect(mod.id)}
                  className="module-card"
                  style={{
                    padding: "18px 20px", borderRadius: 4,
                    background: "var(--card)", border: "1px solid var(--border)",
                    cursor: locked ? "not-allowed" : "pointer",
                    textAlign: "left", transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 10 }}>{locked ? "🔒" : mod.emoji}</div>
                  <div style={{
                    fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
                    color: locked ? "#2a4a5a" : meta.color, letterSpacing: 2, marginBottom: 6,
                  }}>{mod.number}</div>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif", fontSize: 14,
                    fontWeight: 700, color: locked ? "#2a4a5a" : "var(--text)", lineHeight: 1.3, marginBottom: 6,
                  }}>{mod.title}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.4, marginBottom: 10 }}>
                    {mod.subtitle}
                  </div>
                  <div style={{
                    fontSize: 10, color: locked ? "#1a3a4a" : meta.color,
                    fontFamily: "'Share Tech Mono', monospace", opacity: 0.7,
                  }}>{mod.duration}</div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
