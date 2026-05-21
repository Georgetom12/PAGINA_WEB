import React, { useMemo } from "react";
import { User, ROLE_META } from "../auth/types";
import { getExamHistory } from "../auth/examHistory";
import { computeStats, ALL_BADGES, getCurrentStreak } from "../auth/userProgress";
import { LEVEL_META } from "../data/modules";
import { EXAM_MODES } from "../data/examQuestions";

interface ProfilePageProps {
  currentUser: User;
  onGoExam: () => void;
  onGoRetos: () => void;
}

const pctColor = (p: number) =>
  p >= 90 ? "#ffd700" : p >= 75 ? "#00e676" : p >= 60 ? "#00e5ff" : p >= 40 ? "#ff9800" : "#ff1744";

const gradeOf = (p: number) =>
  p >= 90 ? "A+" : p >= 80 ? "A" : p >= 70 ? "B" : p >= 60 ? "C" : "D";

export function ProfilePage({ currentUser, onGoExam, onGoRetos }: ProfilePageProps) {
  const history = useMemo(() => getExamHistory(currentUser.id), [currentUser.id]);
  const stats = useMemo(() => computeStats(history), [history]);
  const roleColor = ROLE_META[currentUser.role].color;
  const initials = (currentUser.displayName || currentUser.username).slice(0, 2).toUpperCase();
  const joined = new Date(currentUser.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });

  const LEVELS_ORDER = ["N1","N2","N3","N4","N5","N6","N7","N8"];

  return (
    <div style={{ padding: "40px 36px", maxWidth: 960, margin: "0 auto" }}>

      {/* ── HEADER CARD ── */}
      <div style={{
        background: "var(--bg2)", border: `1px solid ${roleColor}44`,
        borderRadius: 10, padding: "28px 32px", marginBottom: 28,
        display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap",
      }}>
        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: `${roleColor}22`, border: `2px solid ${roleColor}88`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Orbitron',monospace", fontSize: 26, color: roleColor, fontWeight: 700, flexShrink: 0,
        }}>{initials}</div>

        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 30, letterSpacing: 3, color: "var(--text)", lineHeight: 1 }}>
            {currentUser.displayName || currentUser.username}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{
              fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2,
              padding: "3px 10px", border: `1px solid ${roleColor}66`,
              background: `${roleColor}18`, color: roleColor,
            }}>{currentUser.role}</span>
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "var(--muted)" }}>
              Desde {joined}
            </span>
          </div>
        </div>

        {/* Streak badge */}
        <div style={{
          textAlign: "center", padding: "16px 24px",
          background: stats.currentStreak > 0 ? "rgba(255,109,0,0.1)" : "var(--bg)",
          border: `1px solid ${stats.currentStreak > 0 ? "rgba(255,109,0,0.4)" : "var(--border)"}`,
          borderRadius: 8, flexShrink: 0,
        }}>
          <div style={{ fontSize: 28 }}>{stats.currentStreak > 0 ? "🔥" : "💤"}</div>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, color: stats.currentStreak > 0 ? "#ff6d00" : "var(--muted)", fontWeight: 700 }}>
            {stats.currentStreak}
          </div>
          <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 2, fontFamily: "'Share Tech Mono',monospace", marginTop: 2 }}>RACHA ACTUAL</div>
        </div>
      </div>

      {/* ── GLOBAL STATS ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 28 }}>
        {[
          { label: "EXÁMENES", val: stats.totalExams.toString(), color: "var(--cyan)" },
          { label: "PROMEDIO", val: stats.totalExams ? stats.avgPct + "%" : "—", color: pctColor(stats.avgPct) },
          { label: "MEJOR", val: stats.totalExams ? stats.bestPct + "%" : "—", color: "#ffd700" },
          { label: "RACHA MÁXIMA", val: stats.maxStreak + " días", color: "#ff6d00" },
          { label: "BADGES", val: stats.earnedBadges.length + "/" + ALL_BADGES.length, color: "#7c4dff" },
        ].map(s => (
          <div key={s.label} style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: 6, padding: "16px 18px",
          }}>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, color: s.color, fontWeight: 700 }}>{s.val}</div>
            <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 2, fontFamily: "'Share Tech Mono',monospace", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>

        {/* ── LEVEL PROGRESS ── */}
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "22px 24px" }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 3, color: "var(--cyan)", marginBottom: 18 }}>
            PROGRESO POR NIVEL
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {LEVELS_ORDER.map(lvl => {
              const meta = LEVEL_META[lvl as keyof typeof LEVEL_META];
              const stat = stats.levelStats[lvl];
              const pct = stat?.avgPct ?? 0;
              return (
                <div key={lvl}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{
                        fontFamily: "'Share Tech Mono',monospace", fontSize: 9, padding: "1px 6px",
                        background: `${meta.color}22`, border: `1px solid ${meta.color}44`, color: meta.color,
                      }}>{lvl}</span>
                      <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: "var(--text)", fontWeight: 600 }}>
                        {meta.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {stat && (
                        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "var(--muted)" }}>
                          {stat.count} exam{stat.count !== 1 ? "s" : ""}
                        </span>
                      )}
                      <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: stat ? pctColor(pct) : "var(--border)" }}>
                        {stat ? pct + "%" : "—"}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: "#1a2a3a", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: stat ? pct + "%" : "0%",
                      background: `linear-gradient(90deg, ${meta.color}88, ${meta.color})`,
                      borderRadius: 3, transition: "width 1s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── BADGES EARNED ── */}
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "22px 24px" }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 3, color: "var(--cyan)", marginBottom: 18 }}>
            LOGROS DESBLOQUEADOS
          </div>
          {stats.earnedBadges.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "var(--muted)", letterSpacing: 2 }}>
                AÚN SIN LOGROS
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                Completá tu primer examen
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {ALL_BADGES.map(b => {
                const earned = stats.earnedBadges.some(e => e.id === b.id);
                return (
                  <div key={b.id} style={{
                    padding: "10px 12px", borderRadius: 6,
                    background: earned ? `${b.color}12` : "rgba(255,255,255,0.02)",
                    border: `1px solid ${earned ? b.color + "44" : "var(--border)"}`,
                    opacity: earned ? 1 : 0.35,
                    display: "flex", gap: 8, alignItems: "flex-start",
                  }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{b.emoji}</span>
                    <div>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 11, color: earned ? b.color : "var(--muted)" }}>
                        {b.title}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.3, marginTop: 1 }}>
                        {b.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RECENT HISTORY ── */}
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "22px 24px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 3, color: "var(--cyan)" }}>
            ÚLTIMOS EXÁMENES
          </div>
          {stats.totalExams === 0 && (
            <button onClick={onGoExam} style={{
              background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)",
              color: "var(--cyan)", fontFamily: "'Orbitron',monospace", fontSize: 9, letterSpacing: 2,
              padding: "6px 12px", borderRadius: 3, cursor: "pointer",
            }}>+ HACER EXAMEN</button>
          )}
        </div>
        {history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "var(--muted)", letterSpacing: 2, marginBottom: 16 }}>
              SIN EXÁMENES AÚN
            </div>
            <button onClick={onGoExam} style={{
              padding: "12px 32px", background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)",
              borderRadius: 4, cursor: "pointer", color: "var(--cyan)",
              fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2,
            }}>
              HACER MI PRIMER EXAMEN →
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.slice(0, 8).map((h, i) => {
              const modeCfg = EXAM_MODES.find(m => m.mode === h.mode);
              const col = modeCfg?.color || "var(--cyan)";
              const d = new Date(h.date);
              const grade = gradeOf(h.pct);
              return (
                <div key={h.id} style={{
                  display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
                  padding: "10px 14px", background: "#060a0f", borderRadius: 5,
                  border: `1px solid ${col}22`,
                }}>
                  <span style={{
                    fontFamily: "'Share Tech Mono',monospace", fontSize: 9, padding: "2px 7px",
                    background: `${col}22`, border: `1px solid ${col}44`, color: col, flexShrink: 0,
                  }}>{h.mode}</span>
                  <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: "var(--text)", flex: 1, minWidth: 100 }}>{h.modeLabel}</span>
                  <div style={{ width: 70, height: 5, background: "#1a2a3a", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: h.pct + "%", background: pctColor(h.pct), borderRadius: 3 }} />
                  </div>
                  <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: pctColor(h.pct), width: 40 }}>{h.pct}%</span>
                  <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 14, color: pctColor(h.pct), fontWeight: 700, width: 28 }}>{grade}</span>
                  <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "var(--muted)" }}>
                    {d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CTA BOTTOM ── */}
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onGoExam} style={{
          flex: 1, padding: "14px", background: "rgba(0,229,255,0.08)",
          border: "1px solid rgba(0,229,255,0.3)", borderRadius: 4, cursor: "pointer",
          color: "var(--cyan)", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2,
        }}>
          🎓 HACER EXAMEN
        </button>
        <button onClick={onGoRetos} style={{
          flex: 1, padding: "14px", background: "rgba(255,215,0,0.08)",
          border: "1px solid rgba(255,215,0,0.3)", borderRadius: 4, cursor: "pointer",
          color: "#ffd700", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2,
        }}>
          🏆 VER RETOS
        </button>
      </div>
    </div>
  );
}
