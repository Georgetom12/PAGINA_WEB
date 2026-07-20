import React from "react";
import { MODULES, LEVEL_META, type Level } from "../data/modules";
import { isLevelLocked, nextPlanForLevel } from "../access";

const LEVELS: Level[] = ["N1", "N2", "N3", "N4", "N5", "N6", "N7"];

interface AulaHomeProps {
  onSelect: (id: string) => void;
  completed: Set<string>;
  allowedLevels: Level[];
}

export function AulaHome({ onSelect, completed, allowedLevels }: AulaHomeProps) {
  const grouped = LEVELS.reduce((acc, level) => {
    acc[level] = MODULES.filter((m) => m.level === level);
    return acc;
  }, {} as Record<Level, typeof MODULES>);

  const totalCompleted = completed.size;
  const total = MODULES.length;
  const pct = total > 0 ? Math.round((totalCompleted / total) * 100) : 0;

  return (
    <div style={{ padding: "48px 40px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 56, textAlign: "center" }}>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, letterSpacing: 5, color: "#00e5ff", marginBottom: 12, opacity: 0.8 }}>
          PSYCHOMETRIKS TRADING ACADEMY
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, letterSpacing: 8, lineHeight: 1, color: "#eceff1", marginBottom: 16 }}>
          AULA VIRTUAL
        </h1>
        <p style={{ fontSize: 17, color: "#546e7a", maxWidth: 600, margin: "0 auto 24px", lineHeight: 1.7 }}>
          Formación profesional en trading. De los fundamentos del mercado hasta
          metodologías institucionales avanzadas. {MODULES.length} módulos estructurados
          en 7 niveles progresivos.
        </p>
        <div style={{ display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { label: "Módulos", value: `${MODULES.length}` },
            { label: "Niveles", value: "7" },
            { label: "Horas", value: "20+" },
            { label: "Metodologías", value: "SMC · ICT · Wyckoff" },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 22, color: "#00e5ff", fontWeight: 700 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: "#546e7a", letterSpacing: 2, fontFamily: "'Share Tech Mono', monospace", textTransform: "uppercase" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, maxWidth: 480, margin: "32px auto 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#00e5ff", letterSpacing: 2 }}>
              TU PROGRESO
            </span>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, color: "#00e5ff", fontWeight: 700 }}>
              {totalCompleted}/{total} módulos completados
            </span>
          </div>
          <div style={{ height: 6, background: "#1a2a3a", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${pct}%`,
              background: "linear-gradient(90deg, #00e5ff, #00b8d4)",
              borderRadius: 3,
              transition: "width 0.4s ease",
            }} />
          </div>
          <div style={{ textAlign: "right", marginTop: 4, fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#546e7a" }}>
            {pct}% completado
          </div>
        </div>
      </div>

      {LEVELS.map((level) => {
        const meta = LEVEL_META[level];
        const mods = grouped[level];
        const levelCompleted = mods.filter((m) => completed.has(m.id)).length;
        const locked = isLevelLocked(level, allowedLevels);
        const upsell = locked ? nextPlanForLevel(level) : null;
        return (
          <div key={level} style={{ marginBottom: 48, opacity: locked ? 0.55 : 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 10, letterSpacing: 3,
                padding: "4px 12px",
                border: `1px solid ${meta.color}`,
                color: meta.color, flexShrink: 0,
              }}>
                {level}
              </span>
              <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: 16, letterSpacing: 3, color: meta.color, textTransform: "uppercase", margin: 0 }}>
                {meta.label}
              </h2>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${meta.color}44, transparent)` }} />
              {locked && upsell ? (
                <span style={{ fontSize: 11, color: meta.color, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>
                  🔒 Incluido en {upsell.plan} ({upsell.price})
                </span>
              ) : (
                <span style={{ fontSize: 12, color: "#546e7a", fontFamily: "'Share Tech Mono', monospace" }}>
                  {levelCompleted > 0
                    ? <span><span style={{ color: meta.color }}>{levelCompleted}</span>/{mods.length} completados</span>
                    : `${mods.length} módulos`
                  }
                </span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {mods.map((mod) => {
                const done = completed.has(mod.id);
                return (
                  <button
                    key={mod.id}
                    onClick={() => locked ? undefined : onSelect(mod.id)}
                    className="aula-module-card"
                    style={{
                      padding: "18px 20px", borderRadius: 4,
                      background: done ? `${meta.color}0d` : "#0d1520",
                      border: done ? `1px solid ${meta.color}55` : "1px solid #1a2a3a",
                      cursor: locked ? "not-allowed" : "pointer", textAlign: "left",
                      transition: "all 0.2s",
                      position: "relative",
                    }}
                  >
                    {locked ? (
                      <div style={{
                        position: "absolute", top: 10, right: 10,
                        fontSize: 16,
                      }}>
                        🔒
                      </div>
                    ) : done && (
                      <div style={{
                        position: "absolute", top: 10, right: 10,
                        width: 20, height: 20,
                        background: meta.color,
                        borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, color: "#060a0f", fontWeight: 900,
                      }}>
                        ✓
                      </div>
                    )}
                    <div style={{ fontSize: 24, marginBottom: 10 }}>{mod.emoji}</div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: meta.color, letterSpacing: 2, marginBottom: 6 }}>
                      {mod.number}
                    </div>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, fontWeight: 700, color: done ? meta.color : "#eceff1", lineHeight: 1.3, marginBottom: 6 }}>
                      {mod.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#546e7a", lineHeight: 1.4, marginBottom: 10 }}>
                      {mod.subtitle}
                    </div>
                    <div style={{ fontSize: 10, color: meta.color, fontFamily: "'Share Tech Mono', monospace", opacity: 0.7 }}>
                      {mod.duration}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
