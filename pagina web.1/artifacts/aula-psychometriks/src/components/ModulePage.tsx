import React, { useState, useEffect } from "react";
import { MODULES, LEVEL_META } from "../data/modules";
import { ALL_CONTENT } from "../data";
import { ModuleRenderer } from "./ModuleRenderer";
import { User } from "../auth/types";
import { isLessonDone, markLessonDone, markLessonUndone } from "../auth/lessonProgress";

interface ModulePageProps {
  moduleId: string;
  onBack: () => void;
  onNext: (id: string) => void;
  onPrev: (id: string) => void;
  currentUser?: User;
}

export function ModulePage({ moduleId, onBack, onNext, onPrev, currentUser }: ModulePageProps) {
  const mod = MODULES.find((m) => m.id === moduleId);
  const content = ALL_CONTENT[moduleId];
  const idx = MODULES.findIndex((m) => m.id === moduleId);
  const prevMod = idx > 0 ? MODULES[idx - 1] : null;
  const nextMod = idx < MODULES.length - 1 ? MODULES[idx + 1] : null;

  const [done, setDone] = useState(false);
  const [justMarked, setJustMarked] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setDone(isLessonDone(currentUser.id, moduleId));
    }
    setJustMarked(false);
  }, [moduleId, currentUser?.id]);

  const handleToggleDone = () => {
    if (!currentUser) return;
    if (done) {
      markLessonUndone(currentUser.id, moduleId);
      setDone(false);
    } else {
      markLessonDone(currentUser.id, moduleId);
      setDone(true);
      setJustMarked(true);
      setTimeout(() => setJustMarked(false), 2000);
    }
  };

  if (!mod) {
    return (
      <div style={{ padding: 40, color: "var(--red)" }}>
        Módulo no encontrado: {moduleId}
      </div>
    );
  }

  const meta = LEVEL_META[mod.level];

  return (
    <div style={{ flex: 1, overflow: "auto" }}>
      {/* Hero Header */}
      <div style={{
        background: `linear-gradient(135deg, var(--bg3) 0%, ${meta.color}0d 100%)`,
        borderBottom: "1px solid var(--border)",
        padding: "36px 48px 32px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* glow */}
        <div style={{
          position: "absolute",
          top: -120,
          right: -60,
          width: 350,
          height: 350,
          background: `radial-gradient(circle, ${meta.color}15, transparent 70%)`,
          pointerEvents: "none",
        }} />

        {/* breadcrumb */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          marginBottom: 20,
        }}>
          <button
            onClick={onBack}
            style={{
              background: "none", border: "none",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 11, color: "var(--muted)", cursor: "pointer",
              letterSpacing: 1, padding: 0,
            }}
          >
            ← AULA VIRTUAL
          </button>
          <span style={{ color: "var(--border)" }}>›</span>
          <span style={{
            fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
            letterSpacing: 2, padding: "2px 8px",
            background: `${meta.color}22`, border: `1px solid ${meta.color}44`,
            color: meta.color,
          }}>{mod.level}</span>
          <span style={{ color: "var(--border)" }}>›</span>
          <span style={{
            fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "var(--muted)", letterSpacing: 1,
          }}>Módulo {mod.number}</span>

          {/* Completion badge in header */}
          {done && (
            <span style={{
              marginLeft: 8, fontFamily: "'Share Tech Mono',monospace", fontSize: 9, letterSpacing: 2,
              padding: "2px 8px", background: "rgba(0,230,118,0.12)", border: "1px solid rgba(0,230,118,0.4)",
              color: "#00e676",
            }}>✓ COMPLETADO</span>
          )}
        </div>

        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 42,
          letterSpacing: 4,
          color: "var(--text)",
          lineHeight: 1.1,
          marginBottom: 10,
        }}>
          <span style={{ marginRight: 16 }}>{mod.emoji}</span>
          {mod.title}
        </h1>

        <p style={{
          fontSize: 15,
          color: "var(--muted)",
          marginBottom: 20,
        }}>
          {mod.subtitle}
        </p>

        {/* tags + duration */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {mod.tags.map((tag, i) => (
            <span key={i} style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10,
              letterSpacing: 1,
              padding: "3px 10px",
              background: "var(--bg3)",
              border: "1px solid var(--border2)",
              color: "var(--muted)",
            }}>
              #{tag}
            </span>
          ))}
          <span style={{
            marginLeft: "auto",
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 11,
            color: meta.color,
            opacity: 0.8,
          }}>
            ⏱ {mod.duration}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "40px 48px", maxWidth: 920 }}>
        {content ? (
          <ModuleRenderer sections={content.sections} />
        ) : (
          <div style={{
            padding: 40,
            background: "var(--card)",
            border: "1px solid var(--border)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
            <div style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 14,
              color: "var(--cyan)",
              marginBottom: 8,
            }}>
              CONTENIDO PRÓXIMAMENTE
            </div>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              Este módulo está siendo preparado por el equipo de PSYCHOMETRIKS.
            </p>
          </div>
        )}

        {/* ── MARK AS COMPLETE ── */}
        {currentUser && (
          <div style={{
            marginTop: 40, padding: "20px 24px",
            background: done ? "rgba(0,230,118,0.06)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${done ? "rgba(0,230,118,0.3)" : "var(--border)"}`,
            borderRadius: 8, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{
                fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2,
                color: done ? "#00e676" : "var(--muted)", marginBottom: 4,
              }}>
                {done ? "✓ LECCIÓN COMPLETADA" : "¿TERMINASTE ESTA LECCIÓN?"}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {done
                  ? "Tu progreso quedó guardado en tu perfil."
                  : "Marcala como completada para llevar un registro de tu avance."}
              </div>
            </div>
            <button
              onClick={handleToggleDone}
              style={{
                padding: "10px 24px", borderRadius: 4, cursor: "pointer",
                background: done ? "rgba(255,23,68,0.08)" : "rgba(0,230,118,0.12)",
                border: `1px solid ${done ? "rgba(255,23,68,0.4)" : "rgba(0,230,118,0.4)"}`,
                color: done ? "#ff1744" : "#00e676",
                fontFamily: "'Orbitron',monospace", fontSize: 9, letterSpacing: 2,
                transition: "all 0.2s", flexShrink: 0,
              }}
            >
              {justMarked ? "✓ ¡GUARDADO!" : done ? "✗ DESMARCAR" : "✓ MARCAR COMO COMPLETADA"}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div style={{
          display: "flex",
          gap: 16,
          marginTop: 32,
          paddingTop: 24,
          borderTop: "1px solid var(--border)",
        }}>
          {prevMod ? (
            <button
              onClick={() => onPrev(prevMod.id)}
              style={{
                flex: 1,
                padding: "16px 20px",
                background: "var(--card)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                color: "var(--text)",
                textAlign: "left",
                transition: "border-color 0.2s",
              }}
              className="module-card"
            >
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 10,
                color: "var(--muted)",
                marginBottom: 6,
                letterSpacing: 1,
              }}>
                ← ANTERIOR
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Rajdhani', sans-serif" }}>
                {prevMod.emoji} {prevMod.title}
              </div>
            </button>
          ) : <div style={{ flex: 1 }} />}

          {nextMod && (
            <button
              onClick={() => onNext(nextMod.id)}
              style={{
                flex: 1,
                padding: "16px 20px",
                background: "var(--card)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                color: "var(--text)",
                textAlign: "right",
                transition: "border-color 0.2s",
              }}
              className="module-card"
            >
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 10,
                color: "var(--muted)",
                marginBottom: 6,
                letterSpacing: 1,
              }}>
                SIGUIENTE →
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Rajdhani', sans-serif" }}>
                {nextMod.emoji} {nextMod.title}
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
