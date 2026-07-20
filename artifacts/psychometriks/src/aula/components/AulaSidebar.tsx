import React, { useState } from "react";
import { Link } from "wouter";
import { MODULES, LEVEL_META, type Level, type TradeModule } from "../data/modules";
import { isLevelLocked } from "../access";

interface AulaSidebarProps {
  currentId: string | null;
  onSelect: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  completed: Set<string>;
  allowedLevels: Level[];
}

const LEVELS: Level[] = ["N1", "N2", "N3", "N4", "N5", "N6", "N7"];

export function AulaSidebar({ currentId, onSelect, isOpen, onToggle, completed, allowedLevels }: AulaSidebarProps) {
  const [expanded, setExpanded] = useState<Record<Level, boolean>>({
    N1: true, N2: true, N3: true, N4: false, N5: false, N6: false, N7: false,
  });

  const grouped = LEVELS.reduce((acc, level) => {
    acc[level] = MODULES.filter((m) => m.level === level);
    return acc;
  }, {} as Record<Level, TradeModule[]>);

  const totalCompleted = completed.size;
  const total = MODULES.length;
  const pct = total > 0 ? Math.round((totalCompleted / total) * 100) : 0;

  return (
    <>
      {isOpen && (
        <div
          onClick={onToggle}
          className="aula-mobile-overlay"
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 40, display: "none",
          }}
        />
      )}

      <aside
        className={`aula-sidebar${isOpen ? " open" : ""}`}
        style={{
          width: 280, minWidth: 280,
          background: "#0a1018",
          borderRight: "1px solid #1a2a3a",
          display: "flex", flexDirection: "column",
          height: "100vh", overflow: "hidden",
          position: "sticky", top: 0,
          zIndex: 30, flexShrink: 0,
        }}
      >
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #1a2a3a" }}>
          <Link href="/dashboard" style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 11, letterSpacing: 4,
            color: "#00e5ff", marginBottom: 4,
            display: "block", textDecoration: "none",
            opacity: 0.8,
          }}>
            ← PSYCHOMETRIKS
          </Link>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, color: "#eceff1", lineHeight: 1.1 }}>
            AULA VIRTUAL
          </div>
          <div style={{ fontSize: 11, color: "#546e7a", marginTop: 4, letterSpacing: 1, fontFamily: "'Share Tech Mono', monospace" }}>
            {MODULES.length} MÓDULOS · 7 NIVELES
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#546e7a", letterSpacing: 1 }}>
                PROGRESO
              </span>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#00e5ff" }}>
                {totalCompleted}/{total} · {pct}%
              </span>
            </div>
            <div style={{ height: 3, background: "#1a2a3a", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${pct}%`,
                background: "linear-gradient(90deg, #00e5ff, #00b8d4)",
                borderRadius: 2,
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, overflow: "auto", padding: "12px 0" }}>
          {LEVELS.map((level) => {
            const meta = LEVEL_META[level];
            const mods = grouped[level];
            const isExp = expanded[level];
            const levelCompleted = mods.filter((m) => completed.has(m.id)).length;
            const locked = isLevelLocked(level, allowedLevels);

            return (
              <div key={level} style={{ marginBottom: 4, opacity: locked ? 0.5 : 1 }}>
                <button
                  onClick={() => setExpanded((e) => ({ ...e, [level]: !e[level] }))}
                  className="aula-level-header-btn"
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    gap: 10, padding: "8px 20px",
                    background: "none", border: "none",
                    cursor: "pointer", color: meta.color,
                    transition: "background 0.15s",
                  }}
                >
                  <span style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: 10, letterSpacing: 1,
                    background: `${meta.color}22`,
                    border: `1px solid ${meta.color}55`,
                    color: meta.color, padding: "2px 7px", flexShrink: 0,
                  }}>
                    {level}
                  </span>
                  <span style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 10, letterSpacing: 2,
                    flex: 1, textAlign: "left", color: meta.color,
                  }}>
                    {meta.label}
                  </span>
                  {locked ? (
                    <span style={{ fontSize: 11 }}>🔒</span>
                  ) : levelCompleted > 0 && (
                    <span style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 9, color: meta.color, opacity: 0.7,
                    }}>
                      {levelCompleted}/{mods.length}
                    </span>
                  )}
                  <span style={{ fontSize: 10, opacity: 0.5, color: "#546e7a" }}>
                    {isExp ? "▲" : "▼"}
                  </span>
                </button>

                {isExp && (
                  <div>
                    {mods.map((mod) => {
                      const active = currentId === mod.id;
                      const done = completed.has(mod.id);
                      return (
                        <button
                          key={mod.id}
                          onClick={() => locked ? undefined : onSelect(mod.id)}
                          style={{
                            width: "100%", display: "flex",
                            alignItems: "flex-start", gap: 10,
                            padding: "8px 20px 8px 30px",
                            background: active ? `${meta.color}12` : "none",
                            border: "none",
                            borderLeft: active ? `2px solid ${meta.color}` : "2px solid transparent",
                            cursor: locked ? "not-allowed" : "pointer", transition: "background 0.15s",
                            textAlign: "left",
                          }}
                        >
                          <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{locked ? "🔒" : mod.emoji}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontFamily: "'Rajdhani', sans-serif",
                              fontWeight: 600, fontSize: 13,
                              color: active ? meta.color : done ? `${meta.color}bb` : "#eceff1",
                              lineHeight: 1.3,
                            }}>
                              {mod.number}. {mod.title}
                            </div>
                            <div style={{ fontSize: 11, color: "#546e7a", marginTop: 2, lineHeight: 1.3 }}>
                              {mod.duration}
                            </div>
                          </div>
                          {!locked && done && (
                            <span style={{
                              flexShrink: 0,
                              width: 16, height: 16,
                              background: meta.color,
                              borderRadius: "50%",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 9, color: "#060a0f", fontWeight: 900,
                              marginTop: 3,
                            }}>
                              ✓
                            </span>
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

        <div style={{ padding: "14px 20px", borderTop: "1px solid #1a2a3a", fontSize: 11, color: "#546e7a", fontFamily: "'Share Tech Mono', monospace" }}>
          © 2025 PSYCHOMETRIKS · TRADING ACADEMY
        </div>
      </aside>
    </>
  );
}
