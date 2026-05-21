import React, { useState } from "react";
import { MODULES, LEVEL_META, type Level, type TradeModule } from "../data/modules";
import { User, ROLE_META, LEVEL_ACCESS } from "../auth/types";

interface SidebarProps {
  currentId: string | null;
  onSelect: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  currentUser: User;
  onLogout: () => void;
  onAdmin: () => void;
  onChangePwd: () => void;
  onExam: () => void;
  showExam: boolean;
  onProfile: () => void;
  showProfile: boolean;
  onDashboard: () => void;
  showDashboard: boolean;
  onRetos: () => void;
  showRetos: boolean;
  onTests: () => void;
  showTests: boolean;
  currentStreak: number;
  earnedBadges: number;
  lessonsDone: Record<string, boolean>;
  levelProgress: Record<string, { done: number; total: number }>;
}

const ALL_LEVELS: Level[] = ["N1","N2","N3","N4","N5","N6","N7","N8"];

export function Sidebar({ currentId, onSelect, isOpen, onToggle, currentUser, onLogout, onAdmin, onChangePwd, onExam, showExam, onProfile, showProfile, onDashboard, showDashboard, onRetos, showRetos, onTests, showTests, currentStreak, earnedBadges, lessonsDone, levelProgress }: SidebarProps) {
  const [expanded, setExpanded] = useState<Record<Level, boolean>>({
    N1: true, N2: true, N3: false, N4: false, N5: false, N6: false, N7: false, N8: false,
  });
  const [showUserMenu, setShowUserMenu] = useState(false);

  const accessLevels = LEVEL_ACCESS[currentUser.role];
  const roleColor = ROLE_META[currentUser.role].color;

  const grouped = ALL_LEVELS.reduce((acc, level) => {
    acc[level] = MODULES.filter((m) => m.level === level);
    return acc;
  }, {} as Record<Level, TradeModule[]>);

  const isLocked = (level: Level) => !accessLevels.includes(level);

  return (
    <>
      {isOpen && (
        <div onClick={onToggle} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 40, display: "none",
        }} className="mobile-overlay" />
      )}

      <aside style={{
        width: 280, minWidth: 280, background: "var(--bg2)",
        borderRight: "1px solid var(--border)", display: "flex",
        flexDirection: "column", height: "100vh", overflow: "hidden",
        position: "sticky", top: 0, zIndex: 30, flexShrink: 0,
      }}>
        <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid var(--border)" }}>
          <div style={{
            fontFamily: "'Orbitron', monospace", fontSize: 11,
            letterSpacing: 4, color: "var(--cyan)", marginBottom: 4,
          }}>PSYCHOMETRIKS</div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 22,
            letterSpacing: 3, color: "var(--text)", lineHeight: 1.1,
          }}>AULA VIRTUAL</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, letterSpacing: 1, fontFamily: "'Share Tech Mono', monospace" }}>
            {MODULES.length} MÓDULOS · 8 NIVELES
          </div>
        </div>

        <nav style={{ flex: 1, overflow: "auto", padding: "12px 0" }}>
          {/* MERCADOS LIVE special button */}
          <div style={{ padding: "8px 12px 4px" }}>
            <button
              onClick={() => onSelect("mercados-live")}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", border: "1px solid rgba(0,230,118,0.3)",
                borderRadius: 4, cursor: "pointer",
                background: currentId === "mercados-live"
                  ? "rgba(0,230,118,0.12)" : "rgba(0,230,118,0.04)",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 18 }}>📊</span>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{
                  fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2,
                  color: "#00e676",
                }}>MERCADOS LIVE</div>
                <div style={{
                  fontFamily: "'Share Tech Mono',monospace", fontSize: 10,
                  color: "#2a6a4a", marginTop: 2,
                }}>Acciones · Forex · Commodities</div>
              </div>
              <span style={{
                display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                background: "#00e676", boxShadow: "0 0 6px #00e676",
                animation: "pulse 1.5s infinite",
              }} />
            </button>
          </div>
          <div style={{ height: 1, background: "var(--border)", margin: "8px 12px" }} />

          {/* TESTS button */}
          <div style={{ padding: "0 12px 4px" }}>
            <button onClick={onTests} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px",
              border: showTests ? "1px solid rgba(0,229,255,0.65)" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 4, cursor: "pointer",
              background: showTests ? "rgba(0,229,255,0.09)" : "rgba(255,255,255,0.02)",
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 15 }}>🧠</span>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, letterSpacing: 2, color: showTests ? "var(--cyan)" : "var(--text)" }}>BANCO DE TESTS</div>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "var(--muted)", marginTop: 1 }}>9 modos · 110+ preguntas</div>
              </div>
            </button>
          </div>
          <div style={{ height: 1, background: "var(--border)", margin: "4px 12px 4px" }} />

          {/* Engagement nav buttons */}
          <div style={{ padding: "4px 12px 2px", display: "flex", flexDirection: "column", gap: 4 }}>

            {/* MI PERFIL */}
            <button onClick={onProfile} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px",
              border: showProfile ? "1px solid rgba(0,229,255,0.6)" : "1px solid rgba(0,229,255,0.2)",
              borderRadius: 4, cursor: "pointer",
              background: showProfile ? "rgba(0,229,255,0.10)" : "rgba(0,229,255,0.03)",
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 15 }}>👤</span>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, letterSpacing: 2, color: "#00e5ff" }}>MI PERFIL</div>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#1a5a6a", marginTop: 1 }}>Progreso · Logros</div>
              </div>
              {earnedBadges > 0 && (
                <span style={{
                  fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
                  background: "rgba(0,229,255,0.2)", border: "1px solid rgba(0,229,255,0.4)",
                  color: "#00e5ff", padding: "1px 5px", borderRadius: 8,
                }}>🎖️{earnedBadges}</span>
              )}
            </button>

            {/* DASHBOARD */}
            <button onClick={onDashboard} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px",
              border: showDashboard ? "1px solid rgba(0,230,118,0.6)" : "1px solid rgba(0,230,118,0.2)",
              borderRadius: 4, cursor: "pointer",
              background: showDashboard ? "rgba(0,230,118,0.10)" : "rgba(0,230,118,0.03)",
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 15 }}>📈</span>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, letterSpacing: 2, color: "#00e676" }}>DASHBOARD</div>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#1a4a2a", marginTop: 1 }}>Evolución · Recomendaciones</div>
              </div>
            </button>

            {/* RETOS */}
            <button onClick={onRetos} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px",
              border: showRetos ? "1px solid rgba(124,77,255,0.7)" : "1px solid rgba(124,77,255,0.25)",
              borderRadius: 4, cursor: "pointer",
              background: showRetos ? "rgba(124,77,255,0.12)" : "rgba(124,77,255,0.04)",
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 15 }}>🏆</span>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, letterSpacing: 2, color: "#7c4dff" }}>RETOS Y LOGROS</div>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#3a2a6a", marginTop: 1 }}>Desafíos · Badges</div>
              </div>
              {currentStreak > 0 && (
                <span style={{
                  fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
                  background: "rgba(255,109,0,0.2)", border: "1px solid rgba(255,109,0,0.4)",
                  color: "#ff6d00", padding: "1px 5px", borderRadius: 8,
                }}>🔥{currentStreak}</span>
              )}
            </button>

            {/* EVALÚA */}
            <button onClick={onExam} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px",
              border: showExam ? "1px solid rgba(255,215,0,0.6)" : "1px solid rgba(255,215,0,0.22)",
              borderRadius: 4, cursor: "pointer",
              background: showExam ? "rgba(255,215,0,0.12)" : "rgba(255,215,0,0.03)",
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 15 }}>🎓</span>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, letterSpacing: 2, color: "#ffd700" }}>EVALÚA TUS CONOCIMIENTOS</div>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#5a4a0a", marginTop: 1 }}>100+ preguntas · 8 niveles</div>
              </div>
            </button>
          </div>
          <div style={{ height: 1, background: "var(--border)", margin: "8px 12px" }} />

          {ALL_LEVELS.map((level) => {
            const meta = LEVEL_META[level];
            const mods = grouped[level];
            const locked = isLocked(level);
            const isExp = expanded[level];

            return (
              <div key={level} style={{ marginBottom: 4 }}>
                <button
                  onClick={() => {
                    if (!locked) setExpanded((e) => ({ ...e, [level]: !e[level] }));
                  }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 20px", background: "none", border: "none",
                    cursor: locked ? "not-allowed" : "pointer",
                    color: locked ? "#2a4a5a" : meta.color, transition: "background 0.15s",
                    opacity: locked ? 0.5 : 1,
                  }}
                  className="level-header-btn"
                >
                  <span style={{
                    fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: 1,
                    background: `${locked ? "#1a3a4a" : meta.color}22`,
                    border: `1px solid ${locked ? "#1a3a4a" : meta.color}55`,
                    color: locked ? "#2a4a5a" : meta.color, padding: "2px 7px", flexShrink: 0,
                  }}>{level}</span>
                  <span style={{
                    fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: 2,
                    flex: 1, textAlign: "left",
                  }}>{meta.label}</span>
                  {locked ? (
                    <span style={{ fontSize: 12, color: "#2a4a5a" }}>🔒</span>
                  ) : levelProgress[level] && levelProgress[level].total > 0 ? (
                    <span style={{
                      fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
                      color: levelProgress[level].done === levelProgress[level].total ? "#00e676" : "var(--muted)",
                      marginRight: 4,
                    }}>
                      {levelProgress[level].done}/{levelProgress[level].total}
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, opacity: 0.5, color: "var(--muted)" }}>{isExp ? "▲" : "▼"}</span>
                  )}
                </button>

                {isExp && !locked && (
                  <div>
                    {mods.map((mod) => {
                      const active = currentId === mod.id;
                      return (
                        <button
                          key={mod.id}
                          onClick={() => onSelect(mod.id)}
                          style={{
                            width: "100%", display: "flex", alignItems: "flex-start", gap: 10,
                            padding: "8px 20px 8px 30px",
                            background: active ? `${meta.color}12` : "none",
                            border: "none",
                            borderLeft: active ? `2px solid ${meta.color}` : "2px solid transparent",
                            cursor: "pointer", transition: "background 0.15s", textAlign: "left",
                          }}
                        >
                          <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{mod.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                              fontSize: 13, color: active ? meta.color : "var(--text)", lineHeight: 1.3,
                            }}>
                              {mod.number}. {mod.title}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, lineHeight: 1.3 }}>
                              {mod.duration}
                            </div>
                          </div>
                          {lessonsDone[mod.id] && (
                            <span style={{ fontSize: 11, color: "#00e676", flexShrink: 0 }}>✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div style={{ borderTop: "1px solid var(--border)", padding: "12px 16px", position: "relative" }}>
          <button
            onClick={() => setShowUserMenu(s => !s)}
            style={{
              width: "100%", background: "#060a0f", border: `1px solid ${roleColor}33`,
              borderRadius: 6, padding: "10px 14px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: `${roleColor}22`, border: `1px solid ${roleColor}66`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, flexShrink: 0,
            }}>
              {currentUser.role === "ADMIN" ? "★" : currentUser.role === "PRO" ? "◆" : "○"}
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace", fontSize: 12,
                color: "#e0f4ff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {currentUser.displayName || currentUser.username}
              </div>
              <div style={{
                fontSize: 10, letterSpacing: 1,
                color: roleColor, fontFamily: "'Orbitron', monospace",
              }}>
                {currentUser.role}
              </div>
            </div>
            <span style={{ color: "#2a4a5a", fontSize: 12 }}>{showUserMenu ? "▲" : "▼"}</span>
          </button>

          {showUserMenu && (
            <div style={{
              position: "absolute", bottom: "100%", left: 16, right: 16,
              background: "#0d1520", border: "1px solid #1a3a4a", borderRadius: 6,
              overflow: "hidden", zIndex: 50,
            }}>
              {currentUser.role === "ADMIN" && (
                <button onClick={() => { onAdmin(); setShowUserMenu(false); }} style={{
                  width: "100%", background: "none", border: "none",
                  padding: "12px 16px", color: "#ffd700", fontSize: 13,
                  cursor: "pointer", textAlign: "left", display: "flex", gap: 10, alignItems: "center",
                }}>
                  ★ Panel de Administración
                </button>
              )}
              <button onClick={() => { onChangePwd(); setShowUserMenu(false); }} style={{
                width: "100%", background: "none", border: "none",
                padding: "12px 16px", color: "#00e5ff", fontSize: 13,
                cursor: "pointer", textAlign: "left", display: "flex", gap: 10, alignItems: "center",
                borderTop: currentUser.role === "ADMIN" ? "1px solid #1a3a4a" : "none",
              }}>
                🔑 Cambiar Contraseña
              </button>
              <button onClick={() => { onLogout(); setShowUserMenu(false); }} style={{
                width: "100%", background: "none", border: "none",
                borderTop: "1px solid #1a3a4a",
                padding: "12px 16px", color: "#ff6b6b", fontSize: 13,
                cursor: "pointer", textAlign: "left", display: "flex", gap: 10, alignItems: "center",
              }}>
                ⏻ Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .mobile-overlay { display: block !important; }
          aside { position: fixed !important; left: ${isOpen ? "0" : "-280px"} !important; transition: left 0.3s ease; }
        }
      `}</style>
    </>
  );
}
