import React, { useMemo } from "react";
import { User } from "../auth/types";
import { EXAM_MODES, type ExamConfig, type ExamMode } from "../data/examQuestions";
import { getExamHistory } from "../auth/examHistory";

interface TestsPageProps {
  currentUser: User;
  onStartExam: (mode: ExamMode) => void;
}

const pctColor = (p: number) =>
  p >= 90 ? "#ffd700" : p >= 75 ? "#00e676" : p >= 60 ? "#00e5ff" : p >= 40 ? "#ff9800" : "#ff1744";

const gradeOf = (p: number) =>
  p >= 90 ? "A+" : p >= 80 ? "A" : p >= 70 ? "B" : p >= 60 ? "C" : "D";

const DIFFICULTY: Record<ExamMode, { label: string; stars: number }> = {
  GENERAL: { label: "Mixto",         stars: 3 },
  N1:      { label: "Básico",        stars: 1 },
  N2:      { label: "Intermedio",    stars: 2 },
  N3:      { label: "Intermedio+",   stars: 3 },
  N4:      { label: "Avanzado",      stars: 4 },
  N5:      { label: "Avanzado",      stars: 4 },
  N6:      { label: "Experto",       stars: 5 },
  N7:      { label: "Psicológico",   stars: 3 },
  N8:      { label: "Especializado", stars: 4 },
};

const TOPICS: Record<ExamMode, string[]> = {
  GENERAL: ["Todos los niveles", "Preguntas aleatorias", "Visión global"],
  N1:      ["Exchanges", "Tipos de órdenes", "Velas japonesas", "Bid/Ask/Spread"],
  N2:      ["Patrones de velas", "Fibonacci", "RSI / MACD", "Sesiones de trading"],
  N3:      ["BOS / CHoCH", "Order Blocks", "FVG", "Liquidez BSL/SSL", "AMD / CRT"],
  N4:      ["Wyckoff", "Volume Profile", "Open Interest", "Funding Rate", "CVD"],
  N5:      ["DXY", "VIX", "Bonos & Yields", "Halving", "Ciclos de BTC"],
  N6:      ["Elliott Waves", "Harmónicos", "ICT Killzones", "Judas Swing"],
  N7:      ["Regla 1-2%", "Risk/Reward", "Psicología del trader", "Max Drawdown"],
  N8:      ["P/E Ratio", "Earnings", "Opciones Call/Put", "Delta", "Renta Fija"],
};

function copyTestLink(mode: ExamMode) {
  const base = window.location.href.split("#")[0];
  navigator.clipboard.writeText(`${base}#test-${mode}`).catch(() => {});
}

function Stars({ n, color }: { n: number; color: string }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 10, color: i <= n ? color : "#1a2a3a" }}>★</span>
      ))}
    </div>
  );
}

export function TestsPage({ currentUser, onStartExam }: TestsPageProps) {
  const history = useMemo(() => getExamHistory(currentUser.id), [currentUser.id]);

  const statsByMode = useMemo(() => {
    const m: Record<string, { count: number; best: number; avg: number; lastDate: string }> = {};
    EXAM_MODES.forEach(cfg => {
      const exs = history.filter(h => h.mode === cfg.mode);
      if (exs.length) {
        m[cfg.mode] = {
          count: exs.length,
          best: Math.max(...exs.map(e => e.pct)),
          avg: Math.round(exs.reduce((s, e) => s + e.pct, 0) / exs.length),
          lastDate: exs[0].date,
        };
      }
    });
    return m;
  }, [history]);

  const totalExams = history.length;
  const modesAttempted = EXAM_MODES.filter(m => statsByMode[m.mode]).length;

  return (
    <div style={{ padding: "40px 36px", maxWidth: 1020, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, letterSpacing: 5, color: "var(--cyan)", marginBottom: 8 }}>
          PSYCHOMETRIKS ACADEMY
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 44, letterSpacing: 5, color: "var(--text)", marginBottom: 6, lineHeight: 1 }}>
          BANCO DE TESTS
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: 600 }}>
          {EXAM_MODES.length} modos de examen con más de 110 preguntas. Evaluá cada área del trading y obtené tu calificación instantánea.
        </p>
      </div>

      {/* Summary row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 36, flexWrap: "wrap" }}>
        {[
          { val: EXAM_MODES.length.toString(), label: "MODOS DISPONIBLES", c: "var(--cyan)" },
          { val: "110+",                        label: "PREGUNTAS",         c: "#00e676" },
          { val: totalExams.toString(),          label: "EXÁMENES HECHOS",  c: "#ffd700" },
          { val: `${modesAttempted}/${EXAM_MODES.length}`, label: "MODOS EXPLORADOS", c: "#7c4dff" },
        ].map(s => (
          <div key={s.label} style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: 6, padding: "16px 22px", flex: 1, minWidth: 110,
          }}>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, color: s.c, fontWeight: 700 }}>{s.val}</div>
            <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 2, fontFamily: "'Share Tech Mono',monospace", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Test grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {EXAM_MODES.map((cfg) => {
          const stat = statsByMode[cfg.mode];
          const diff = DIFFICULTY[cfg.mode];
          const topics = TOPICS[cfg.mode];

          return (
            <div key={cfg.mode} style={{
              background: "var(--bg2)", border: `1px solid ${cfg.color}22`,
              borderRadius: 10, padding: "22px 22px 18px",
              display: "flex", flexDirection: "column", gap: 0,
              transition: "border-color 0.2s, transform 0.15s",
              position: "relative", overflow: "hidden",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = cfg.color + "66"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = cfg.color + "22"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
            >
              {/* Glow accent */}
              <div style={{
                position: "absolute", top: 0, right: 0, width: 120, height: 120,
                background: `radial-gradient(circle at top right, ${cfg.color}12, transparent 70%)`,
                pointerEvents: "none",
              }} />

              {/* Mode badge + title */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <span style={{
                    fontFamily: "'Share Tech Mono',monospace", fontSize: 10, letterSpacing: 2,
                    padding: "2px 8px", background: `${cfg.color}22`, border: `1px solid ${cfg.color}44`,
                    color: cfg.color, display: "inline-block", marginBottom: 8,
                  }}>{cfg.mode}</span>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 2, color: "var(--text)", lineHeight: 1 }}>
                    {cfg.label.replace(/^N\d — /, "")}
                  </div>
                </div>
                {stat && (
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 20, color: pctColor(stat.best), fontWeight: 700 }}>
                      {stat.best}%
                    </div>
                    <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 1, fontFamily: "'Share Tech Mono',monospace" }}>
                      MEJOR
                    </div>
                  </div>
                )}
              </div>

              {/* Difficulty + count */}
              <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
                <Stars n={diff.stars} color={cfg.color} />
                <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "var(--muted)" }}>
                  {diff.label}
                </span>
                <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "var(--muted)", marginLeft: "auto" }}>
                  {cfg.questionCount} preguntas
                </span>
              </div>

              {/* Topics */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
                {topics.map(t => (
                  <span key={t} style={{
                    fontSize: 10, padding: "2px 7px", borderRadius: 10,
                    background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                    color: "var(--muted)", fontFamily: "'Share Tech Mono',monospace",
                  }}>{t}</span>
                ))}
              </div>

              {/* User stats bar */}
              {stat ? (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Share Tech Mono',monospace" }}>
                      Promedio · {stat.count} examen{stat.count !== 1 ? "es" : ""}
                    </span>
                    <span style={{ fontSize: 10, color: pctColor(stat.avg), fontFamily: "'Share Tech Mono',monospace" }}>
                      {stat.avg}% · {gradeOf(stat.avg)}
                    </span>
                  </div>
                  <div style={{ height: 5, background: "#0d1520", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: stat.avg + "%",
                      background: `linear-gradient(90deg, ${cfg.color}66, ${cfg.color})`,
                      borderRadius: 3,
                    }} />
                  </div>
                </div>
              ) : (
                <div style={{
                  marginBottom: 14, padding: "8px 12px",
                  background: "rgba(255,255,255,0.02)", border: "1px dashed var(--border)",
                  borderRadius: 4, textAlign: "center",
                }}>
                  <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "'Share Tech Mono',monospace", letterSpacing: 1 }}>
                    SIN INTENTOS AÚN
                  </span>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                <button
                  onClick={() => onStartExam(cfg.mode)}
                  style={{
                    flex: 1, padding: "10px 0",
                    background: `${cfg.color}18`, border: `1px solid ${cfg.color}55`,
                    borderRadius: 4, cursor: "pointer", color: cfg.color,
                    fontFamily: "'Orbitron',monospace", fontSize: 9, letterSpacing: 2,
                    fontWeight: 700,
                  }}
                >
                  {stat ? "🔄 REPETIR" : "▶ INICIAR"}
                </button>
                <button
                  onClick={() => copyTestLink(cfg.mode)}
                  title="Copiar enlace directo"
                  style={{
                    padding: "10px 14px", background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer",
                    color: "var(--muted)", fontSize: 13,
                  }}
                >🔗</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div style={{
        marginTop: 36, padding: "24px 28px", background: "var(--bg2)",
        border: "1px solid rgba(0,229,255,0.15)", borderRadius: 8,
        display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, letterSpacing: 3, color: "var(--cyan)", marginBottom: 6 }}>
            ¿NO SABÉS POR DÓNDE EMPEZAR?
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            Empezá con el Examen General para tener una visión completa de tu nivel actual.
          </div>
        </div>
        <button
          onClick={() => onStartExam("GENERAL")}
          style={{
            padding: "13px 28px", background: "rgba(0,229,255,0.12)",
            border: "1px solid rgba(0,229,255,0.4)", borderRadius: 4, cursor: "pointer",
            color: "var(--cyan)", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2,
            flexShrink: 0,
          }}
        >
          EXAMEN GENERAL →
        </button>
      </div>
    </div>
  );
}
