import React, { useMemo, useState } from "react";
import { User } from "../auth/types";
import { getExamHistory } from "../auth/examHistory";
import { ALL_CHALLENGES, ALL_BADGES, getChallengeProgress, computeStats } from "../auth/userProgress";

interface RetosPageProps {
  currentUser: User;
  onGoExam: () => void;
}

export function RetosPage({ currentUser, onGoExam }: RetosPageProps) {
  const history = useMemo(() => getExamHistory(currentUser.id), [currentUser.id]);
  const stats = useMemo(() => computeStats(history), [history]);
  const [tab, setTab] = useState<"retos" | "badges">("retos");

  const challengeProgresses = useMemo(() =>
    ALL_CHALLENGES.map(c => ({ challenge: c, progress: getChallengeProgress(c, history) })),
    [history]
  );

  const done = challengeProgresses.filter(cp => cp.progress.done).length;
  const total = ALL_CHALLENGES.length;

  const earnedSet = new Set(stats.earnedBadges.map(b => b.id));

  return (
    <div style={{ padding: "40px 36px", maxWidth: 1000, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, letterSpacing: 5, color: "var(--cyan)", marginBottom: 8 }}>
          PSYCHOMETRIKS ACADEMY
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 44, letterSpacing: 5, color: "var(--text)", marginBottom: 4, lineHeight: 1 }}>
          RETOS Y LOGROS
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
          Completá desafíos para desbloquear badges y demostrar tu evolución como trader.
        </p>
      </div>

      {/* Progress overview */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 6, padding: "16px 22px", flex: 1, minWidth: 120 }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 24, color: "#ffd700", fontWeight: 700 }}>{done}/{total}</div>
          <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 2, fontFamily: "'Share Tech Mono',monospace", marginTop: 4 }}>RETOS COMPLETOS</div>
        </div>
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 6, padding: "16px 22px", flex: 1, minWidth: 120 }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 24, color: "#7c4dff", fontWeight: 700 }}>{stats.earnedBadges.length}/{ALL_BADGES.length}</div>
          <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 2, fontFamily: "'Share Tech Mono',monospace", marginTop: 4 }}>BADGES GANADOS</div>
        </div>
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 6, padding: "16px 22px", flex: 1, minWidth: 120 }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 24, color: "#ff6d00", fontWeight: 700 }}>
            {stats.currentStreak > 0 ? "🔥" : "💤"} {stats.currentStreak}
          </div>
          <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 2, fontFamily: "'Share Tech Mono',monospace", marginTop: 4 }}>RACHA ACTUAL</div>
        </div>
        {/* Overall progress bar */}
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 6, padding: "16px 22px", flex: 2, minWidth: 200, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2, color: "var(--cyan)" }}>PROGRESO GENERAL</span>
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: "#ffd700" }}>
              {Math.round((done / total) * 100)}%
            </span>
          </div>
          <div style={{ height: 8, background: "#0d1520", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${(done / total) * 100}%`,
              background: "linear-gradient(90deg, #7c4dff, #ffd700)",
              borderRadius: 4, transition: "width 1s ease",
            }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid var(--border)" }}>
        {([
          { id: "retos", label: "🏆 RETOS", count: `${done}/${total}` },
          { id: "badges", label: "🎖️ BADGES", count: `${stats.earnedBadges.length}/${ALL_BADGES.length}` },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "12px 24px", background: "none",
            border: "none", borderBottom: tab === t.id ? "2px solid var(--cyan)" : "2px solid transparent",
            color: tab === t.id ? "var(--cyan)" : "var(--muted)",
            fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            {t.label}
            <span style={{
              fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
              background: tab === t.id ? "rgba(0,229,255,0.15)" : "rgba(255,255,255,0.05)",
              border: tab === t.id ? "1px solid rgba(0,229,255,0.4)" : "1px solid var(--border)",
              color: tab === t.id ? "var(--cyan)" : "var(--muted)",
              padding: "1px 6px", borderRadius: 10,
            }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* RETOS TAB */}
      {tab === "retos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {challengeProgresses.map(({ challenge: c, progress: p }) => (
            <div key={c.id} style={{
              background: "var(--bg2)",
              border: `1px solid ${p.done ? c.color + "66" : c.color + "22"}`,
              borderRadius: 10, padding: "22px 24px",
              opacity: 1,
            }}>
              {/* Challenge header */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 8, flexShrink: 0,
                  background: p.done ? `${c.color}22` : "#0d1520",
                  border: `1px solid ${p.done ? c.color + "66" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
                }}>{c.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{
                      fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2,
                      color: p.done ? c.color : "var(--text)",
                    }}>{c.title}</span>
                    {p.done && (
                      <span style={{
                        fontFamily: "'Orbitron',monospace", fontSize: 8, letterSpacing: 2,
                        padding: "2px 8px", background: `${c.color}22`, border: `1px solid ${c.color}55`,
                        color: c.color, borderRadius: 10,
                      }}>✓ COMPLETADO</span>
                    )}
                    {c.durationDays && !p.done && (
                      <span style={{
                        fontFamily: "'Share Tech Mono',monospace", fontSize: 9, letterSpacing: 1,
                        padding: "2px 8px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                        color: "var(--muted)", borderRadius: 10,
                      }}>{c.durationDays} DÍAS</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{c.description}</div>
                </div>
                {/* Progress ring */}
                <div style={{ flexShrink: 0, position: "relative", width: 52, height: 52 }}>
                  <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="26" cy="26" r="20" fill="none" stroke="#1a2a3a" strokeWidth="5" />
                    <circle
                      cx="26" cy="26" r="20" fill="none"
                      stroke={p.done ? c.color : c.color + "88"} strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={125.7}
                      strokeDashoffset={125.7 - (p.pct / 100) * 125.7}
                      style={{ transition: "stroke-dashoffset 1s ease" }}
                    />
                  </svg>
                  <div style={{
                    position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: c.color, fontWeight: 700,
                  }}>{p.pct}%</div>
                </div>
              </div>

              {/* Steps */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {c.steps.map((step, i) => {
                  const done = step.check(history);
                  return (
                    <div key={step.id} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 12px", borderRadius: 5,
                      background: done ? `${c.color}0d` : "#060a0f",
                      border: `1px solid ${done ? c.color + "33" : "var(--border)"}`,
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                        background: done ? c.color : "#1a2a3a",
                        border: `1px solid ${done ? c.color : "#2a4a6a"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: done ? 11 : 9, color: done ? "#060a0f" : "#2a4a6a", fontWeight: 700,
                      }}>
                        {done ? "✓" : i + 1}
                      </div>
                      <span style={{
                        fontFamily: "'Rajdhani',sans-serif", fontSize: 13, fontWeight: 500,
                        color: done ? "var(--text)" : "var(--muted)",
                        textDecoration: done ? "none" : "none",
                        flex: 1,
                      }}>{step.label}</span>
                      {done && <span style={{ fontSize: 12, flexShrink: 0 }}>✅</span>}
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              {!p.done && (
                <button onClick={onGoExam} style={{
                  marginTop: 14, width: "100%", padding: "10px",
                  background: `${c.color}0d`, border: `1px solid ${c.color}33`,
                  borderRadius: 4, cursor: "pointer", color: c.color,
                  fontFamily: "'Orbitron',monospace", fontSize: 9, letterSpacing: 2,
                }}>
                  CONTINUAR RETO →
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* BADGES TAB */}
      {tab === "badges" && (
        <div>
          {stats.earnedBadges.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 3, color: "#00e676", marginBottom: 14 }}>
                ✓ DESBLOQUEADOS ({stats.earnedBadges.length})
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                {ALL_BADGES.filter(b => earnedSet.has(b.id)).map(b => (
                  <div key={b.id} style={{
                    background: `${b.color}10`, border: `1px solid ${b.color}55`,
                    borderRadius: 8, padding: "18px 20px", display: "flex", gap: 14, alignItems: "flex-start",
                  }}>
                    <span style={{ fontSize: 32, flexShrink: 0 }}>{b.emoji}</span>
                    <div>
                      <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, letterSpacing: 1, color: b.color, marginBottom: 4 }}>
                        {b.title}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>
                        {b.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ALL_BADGES.filter(b => !earnedSet.has(b.id)).length > 0 && (
            <div>
              <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 3, color: "var(--muted)", marginBottom: 14 }}>
                🔒 POR DESBLOQUEAR ({ALL_BADGES.length - stats.earnedBadges.length})
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                {ALL_BADGES.filter(b => !earnedSet.has(b.id)).map(b => (
                  <div key={b.id} style={{
                    background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
                    borderRadius: 8, padding: "18px 20px", display: "flex", gap: 14, alignItems: "flex-start",
                    opacity: 0.45,
                  }}>
                    <span style={{ fontSize: 32, flexShrink: 0, filter: "grayscale(1)" }}>{b.emoji}</span>
                    <div>
                      <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, letterSpacing: 1, color: "var(--muted)", marginBottom: 4 }}>
                        {b.title}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>
                        {b.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.totalExams === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "var(--muted)", letterSpacing: 2, marginBottom: 16 }}>
                COMPLETÁ TU PRIMER EXAMEN PARA DESBLOQUEAR LOGROS
              </div>
              <button onClick={onGoExam} style={{
                padding: "12px 32px", background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)",
                borderRadius: 4, cursor: "pointer", color: "var(--cyan)",
                fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2,
              }}>
                HACER MI PRIMER EXAMEN →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
