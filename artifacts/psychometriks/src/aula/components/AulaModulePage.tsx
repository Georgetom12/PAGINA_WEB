import React from "react";
import { MODULES, LEVEL_META, type Level } from "../data/modules";
import { ALL_CONTENT } from "../data";
import { ModuleRenderer } from "./ModuleRenderer";
import { isLevelLocked, nextPlanForLevel } from "../access";

interface AulaModulePageProps {
  moduleId: string;
  onBack: () => void;
  onNext: (id: string) => void;
  onPrev: (id: string) => void;
  isCompleted: boolean;
  onMarkComplete: () => void;
  onMarkIncomplete: () => void;
  allowedLevels: Level[];
}

export function AulaModulePage({ moduleId, onBack, onNext, onPrev, isCompleted, onMarkComplete, onMarkIncomplete, allowedLevels }: AulaModulePageProps) {
  const mod = MODULES.find((m) => m.id === moduleId);
  const content = ALL_CONTENT[moduleId];
  const idx = MODULES.findIndex((m) => m.id === moduleId);
  const prevMod = idx > 0 ? MODULES[idx - 1] : null;
  const nextMod = idx < MODULES.length - 1 ? MODULES[idx + 1] : null;

  if (!mod) {
    return <div style={{ padding: 40, color: "#ff1744" }}>Módulo no encontrado: {moduleId}</div>;
  }

  const meta = LEVEL_META[mod.level];

  // (julio 20 2026) Candado real — defensa en profundidad. AulaHome/AulaSidebar
  // ya no dejan hacer click en un módulo bloqueado, pero esto cubre el caso de
  // que currentModule se haya seteado igual (ej. progreso guardado de antes de
  // este arreglo apuntando a un módulo que ya no le corresponde al plan actual).
  if (isLevelLocked(mod.level, allowedLevels)) {
    const upsell = nextPlanForLevel(mod.level);
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: 40 }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 18, letterSpacing: 2, color: "#eceff1", marginBottom: 10 }}>
            Módulo de nivel {mod.level}
          </div>
          <p style={{ fontSize: 14, color: "#546e7a", lineHeight: 1.6, marginBottom: 20 }}>
            "{mod.title}" está incluido en el plan <span style={{ color: meta.color }}>{upsell.plan}</span> ({upsell.price}) o superior.
          </p>
          <button
            onClick={onBack}
            style={{
              padding: "10px 24px", background: "none",
              border: `1px solid ${meta.color}`, color: meta.color,
              cursor: "pointer", fontFamily: "'Share Tech Mono', monospace", fontSize: 12, letterSpacing: 1,
            }}
          >
            ← VOLVER AL AULA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: "auto" }}>
      <div style={{
        background: `linear-gradient(135deg, #0f1820 0%, ${meta.color}0d 100%)`,
        borderBottom: "1px solid #1a2a3a",
        padding: "36px 48px 32px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -120, right: -60,
          width: 350, height: 350,
          background: `radial-gradient(circle, ${meta.color}15, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, fontSize: 11, fontFamily: "'Share Tech Mono', monospace", color: "#546e7a" }}>
          <button
            onClick={onBack}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#546e7a", fontSize: 11, fontFamily: "'Share Tech Mono', monospace" }}
          >
            ← AULA VIRTUAL
          </button>
          <span>/</span>
          <span style={{ color: meta.color }}>{meta.label}</span>
          <span>/</span>
          <span style={{ color: "#eceff1" }}>MÓDULO {mod.number}</span>

          {isCompleted && (
            <span style={{
              marginLeft: "auto",
              display: "inline-flex", alignItems: "center", gap: 6,
              background: `${meta.color}1a`, border: `1px solid ${meta.color}55`,
              padding: "3px 10px",
              fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: 2,
              color: meta.color,
            }}>
              ✓ COMPLETADO
            </span>
          )}
        </div>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: `${meta.color}1a`, border: `1px solid ${meta.color}55`,
          padding: "4px 14px", marginBottom: 16,
        }}>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: 3, color: meta.color }}>
            {mod.level} · {meta.label}
          </span>
        </div>

        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: 4, color: "#eceff1", lineHeight: 1.1, marginBottom: 10 }}>
          <span style={{ marginRight: 16 }}>{mod.emoji}</span>
          {mod.title}
        </h1>

        <p style={{ fontSize: 15, color: "#546e7a", marginBottom: 20 }}>{mod.subtitle}</p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {mod.tags.map((tag, i) => (
            <span key={i} style={{
              fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
              letterSpacing: 1, padding: "3px 10px",
              background: "#0f1820", border: "1px solid #243040",
              color: "#546e7a",
            }}>
              #{tag}
            </span>
          ))}
          <span style={{ marginLeft: "auto", fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: meta.color, opacity: 0.8 }}>
            ⏱ {mod.duration}
          </span>
        </div>
      </div>

      <div style={{ padding: "40px 48px", maxWidth: 920 }}>
        {content ? (
          <ModuleRenderer sections={content.sections} />
        ) : (
          <div style={{ padding: 40, background: "#0d1520", border: "1px solid #1a2a3a", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 14, color: "#00e5ff", marginBottom: 8 }}>
              CONTENIDO PRÓXIMAMENTE
            </div>
            <p style={{ color: "#546e7a", fontSize: 13 }}>
              Este módulo está siendo preparado por el equipo de PSYCHOMETRIKS.
            </p>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
          {isCompleted ? (
            <button
              onClick={onMarkIncomplete}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 24px",
                background: "none",
                border: `1px solid ${meta.color}55`,
                color: meta.color,
                cursor: "pointer",
                fontFamily: "'Share Tech Mono', monospace", fontSize: 11, letterSpacing: 2,
                transition: "all 0.2s",
              }}
            >
              ✓ MÓDULO COMPLETADO · Desmarcar
            </button>
          ) : (
            <button
              onClick={onMarkComplete}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 28px",
                background: `${meta.color}1a`,
                border: `1px solid ${meta.color}`,
                color: meta.color,
                cursor: "pointer",
                fontFamily: "'Share Tech Mono', monospace", fontSize: 11, letterSpacing: 2,
                transition: "all 0.2s",
              }}
            >
              Marcar como completado ✓
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 32, paddingTop: 24, borderTop: "1px solid #1a2a3a" }}>
          {prevMod ? (
            <button
              onClick={() => onPrev(prevMod.id)}
              className="aula-module-card"
              style={{
                flex: 1, padding: "16px 20px",
                background: "#0d1520", border: "1px solid #1a2a3a",
                cursor: "pointer", color: "#eceff1",
                textAlign: "left", transition: "all 0.2s",
              }}
            >
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#546e7a", marginBottom: 6, letterSpacing: 1 }}>
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
              className="aula-module-card"
              style={{
                flex: 1, padding: "16px 20px",
                background: "#0d1520", border: "1px solid #1a2a3a",
                cursor: "pointer", color: "#eceff1",
                textAlign: "right", transition: "all 0.2s",
              }}
            >
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#546e7a", marginBottom: 6, letterSpacing: 1 }}>
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
