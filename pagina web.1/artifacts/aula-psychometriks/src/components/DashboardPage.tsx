import React, { useMemo, useState } from "react";
import { User } from "../auth/types";
import { getExamHistory, type ExamResult } from "../auth/examHistory";
import { computeStats } from "../auth/userProgress";
import { LEVEL_META } from "../data/modules";
import { EXAM_MODES } from "../data/examQuestions";

interface DashboardPageProps {
  currentUser: User;
  onGoExam: () => void;
  onGoRetos: () => void;
}

const pctColor = (p: number) =>
  p >= 90 ? "#ffd700" : p >= 75 ? "#00e676" : p >= 60 ? "#00e5ff" : p >= 40 ? "#ff9800" : "#ff1744";

const LEVEL_ORDER = ["N1","N2","N3","N4","N5","N6","N7","N8"];

// ─── SVG Line Chart ────────────────────────────────────────────────────
function LineChart({ data, width = 600, height = 140 }: { data: { date: string; pct: number; mode: string }[]; width?: number; height?: number }) {
  if (data.length < 2) return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "var(--muted)", fontFamily: "'Share Tech Mono',monospace", fontSize: 11, letterSpacing: 2 }}>
        NECESITÁS MÁS EXÁMENES PARA VER TENDENCIAS
      </span>
    </div>
  );

  const pad = { top: 12, right: 16, bottom: 24, left: 32 };
  const W = width - pad.left - pad.right;
  const H = height - pad.top - pad.bottom;

  const minY = 0, maxY = 100;
  const toX = (i: number) => pad.left + (i / (data.length - 1)) * W;
  const toY = (v: number) => pad.top + H - ((v - minY) / (maxY - minY)) * H;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(d.pct)}`).join(" ");
  const areaPath = `${linePath} L${toX(data.length - 1)},${pad.top + H} L${toX(0)},${pad.top + H} Z`;

  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(v => (
        <g key={v}>
          <line x1={pad.left} y1={toY(v)} x2={pad.left + W} y2={toY(v)} stroke="#1a2a3a" strokeWidth="1" />
          <text x={pad.left - 6} y={toY(v) + 4} textAnchor="end" fill="#2a4a6a" fontSize="9" fontFamily="monospace">{v}</text>
        </g>
      ))}
      {/* Area fill */}
      <path d={areaPath} fill="url(#chartGrad)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* 75% reference line */}
      <line x1={pad.left} y1={toY(75)} x2={pad.left + W} y2={toY(75)} stroke="#00e67644" strokeWidth="1" strokeDasharray="4,4" />
      {/* Points */}
      {data.map((d, i) => (
        <g key={i}>
          <circle
            cx={toX(i)} cy={toY(d.pct)} r={hovered === i ? 6 : 4}
            fill={pctColor(d.pct)} stroke="#060a0f" strokeWidth="2"
            style={{ cursor: "pointer", transition: "r 0.1s" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
          {hovered === i && (
            <g>
              <rect x={toX(i) - 36} y={toY(d.pct) - 30} width={72} height={24} rx="3" fill="#0d1520" stroke={pctColor(d.pct)} strokeWidth="1" />
              <text x={toX(i)} y={toY(d.pct) - 14} textAnchor="middle" fill={pctColor(d.pct)} fontSize="11" fontFamily="monospace" fontWeight="bold">
                {d.pct}% · {d.mode}
              </text>
            </g>
          )}
        </g>
      ))}
      {/* Date labels — only show a few */}
      {data.map((d, i) => {
        if (data.length <= 8 || i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) {
          const short = new Date(d.date).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
          return (
            <text key={i} x={toX(i)} y={height - 4} textAnchor="middle" fill="#2a4a6a" fontSize="8" fontFamily="monospace">
              {short}
            </text>
          );
        }
        return null;
      })}
    </svg>
  );
}

// ─── Bar Chart per level ───────────────────────────────────────────────
function LevelRadar({ levelStats }: { levelStats: Record<string, { avgPct: number }> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {LEVEL_ORDER.map(lvl => {
        const meta = LEVEL_META[lvl as keyof typeof LEVEL_META];
        const stat = levelStats[lvl];
        const pct = stat?.avgPct ?? 0;
        return (
          <div key={lvl} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontFamily: "'Share Tech Mono',monospace", fontSize: 9, width: 26,
              color: meta.color, flexShrink: 0, letterSpacing: 0.5,
            }}>{lvl}</span>
            <div style={{ flex: 1, height: 18, background: "#0d1520", borderRadius: 3, overflow: "hidden", position: "relative" }}>
              <div style={{
                height: "100%", width: stat ? pct + "%" : "0%",
                background: `linear-gradient(90deg, ${meta.color}55, ${meta.color})`,
                borderRadius: 3, transition: "width 1s ease",
                display: "flex", alignItems: "center",
              }} />
              {stat && (
                <span style={{
                  position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                  fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: pctColor(pct),
                }}>{pct}%</span>
              )}
              {!stat && (
                <span style={{
                  position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
                  fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#2a4a6a", letterSpacing: 1,
                }}>SIN DATOS</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Recommendations ────────────────────────────────────────────────────
function Recommendations({ stats, onGoExam }: { stats: ReturnType<typeof computeStats>; onGoExam: () => void }) {
  const recs: { emoji: string; title: string; body: string; color: string; action?: string }[] = [];

  if (stats.totalExams === 0) {
    recs.push({ emoji: "🎯", title: "Empezá con una evaluación", body: "Completá tu primer examen para que el sistema analice tus fortalezas y debilidades.", color: "#00e5ff", action: "HACER EXAMEN" });
  } else {
    // Weakest level
    if (stats.weakestLevel && stats.levelStats[stats.weakestLevel]) {
      const lvl = stats.weakestLevel;
      const meta = LEVEL_META[lvl as keyof typeof LEVEL_META];
      const avg = stats.levelStats[lvl].avgPct;
      recs.push({
        emoji: "📖",
        title: `Reforzá ${lvl} — ${meta.label}`,
        body: `Tu promedio en este nivel es ${avg}%. Revisá los módulos correspondientes en el Aula y volvé a evaluarte.`,
        color: meta.color,
      });
    }
    // Trend
    if (stats.recentTrend === "up") {
      recs.push({ emoji: "📈", title: "¡Vas en ascenso!", body: "Tus últimos exámenes muestran mejora consistente. Seguí con esta racha — el aprendizaje se está consolidando.", color: "#00e676" });
    } else if (stats.recentTrend === "down") {
      recs.push({ emoji: "⚠️", title: "Tendencia a la baja", body: "Tus últimos resultados bajaron un poco. Tomá un descanso, revisá el material y volvé con energía renovada.", color: "#ff9800" });
    }
    // Streak
    if (stats.currentStreak === 0) {
      recs.push({ emoji: "🔥", title: "Retomá tu racha", body: "No evaluaste hoy. Cada día de práctica construye el hábito del trader disciplinado.", color: "#ff6d00", action: "HACER EXAMEN" });
    } else if (stats.currentStreak >= 3) {
      recs.push({ emoji: "⚡", title: `Racha de ${stats.currentStreak} días`, body: "¡Excelente consistencia! La disciplina diaria es lo que separa a los traders profesionales.", color: "#ffd700" });
    }
    // Missing levels
    const missing = LEVEL_ORDER.filter(l => !stats.levelStats[l]);
    if (missing.length > 0) {
      const lvl = missing[0];
      const meta = LEVEL_META[lvl as keyof typeof LEVEL_META];
      recs.push({ emoji: "🗺️", title: `Explorá ${lvl} — ${meta.label}`, body: `Aún no evaluaste este nivel. Ampliar tu conocimiento a todas las áreas te hace un trader más completo.`, color: meta.color, action: "HACER EXAMEN" });
    }
    // General exam
    if (!stats.levelStats["GENERAL"]) {
      recs.push({ emoji: "🌐", title: "Probá el Examen General", body: "20 preguntas mezcladas de todos los niveles — el mejor indicador de tu estado general como trader.", color: "#00e5ff", action: "HACER EXAMEN" });
    }
    // Strongest
    if (stats.strongestLevel && stats.levelStats[stats.strongestLevel]) {
      const lvl = stats.strongestLevel;
      const meta = LEVEL_META[lvl as keyof typeof LEVEL_META];
      const best = stats.levelStats[lvl].bestPct;
      if (best < 100) {
        recs.push({ emoji: "🎯", title: `Perfeccioná ${lvl}`, body: `Es tu nivel más fuerte con ${best}% como máximo. ¿Podés llegar al 100%?`, color: meta.color, action: "HACER EXAMEN" });
      }
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {recs.slice(0, 4).map((r, i) => (
        <div key={i} style={{
          background: `${r.color}0a`, border: `1px solid ${r.color}33`,
          borderRadius: 6, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{r.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 14, color: r.color, marginBottom: 4 }}>
              {r.title}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{r.body}</div>
          </div>
          {r.action && (
            <button onClick={onGoExam} style={{
              background: `${r.color}18`, border: `1px solid ${r.color}44`,
              color: r.color, fontFamily: "'Orbitron',monospace", fontSize: 8, letterSpacing: 1,
              padding: "6px 10px", borderRadius: 3, cursor: "pointer", flexShrink: 0,
            }}>{r.action}</button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────
export function DashboardPage({ currentUser, onGoExam, onGoRetos }: DashboardPageProps) {
  const history = useMemo(() => getExamHistory(currentUser.id), [currentUser.id]);
  const stats = useMemo(() => computeStats(history), [history]);

  const chartData = useMemo(() => {
    return [...history].reverse().map(h => ({
      date: h.date, pct: h.pct, mode: h.mode,
    }));
  }, [history]);

  const [chartFilter, setChartFilter] = useState<string>("ALL");

  const filteredChart = useMemo(() => {
    if (chartFilter === "ALL") return chartData;
    return chartData.filter(d => d.mode === chartFilter);
  }, [chartData, chartFilter]);

  const trendEmoji = stats.recentTrend === "up" ? "📈" : stats.recentTrend === "down" ? "📉" : "➡️";
  const trendColor = stats.recentTrend === "up" ? "#00e676" : stats.recentTrend === "down" ? "#ff1744" : "#546e7a";

  return (
    <div style={{ padding: "40px 36px", maxWidth: 1000, margin: "0 auto" }}>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, letterSpacing: 5, color: "var(--cyan)", marginBottom: 8 }}>
          PSYCHOMETRIKS ACADEMY
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 44, letterSpacing: 5, color: "var(--text)", marginBottom: 8, lineHeight: 1 }}>
          DASHBOARD PERSONAL
        </h1>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: trendColor, fontFamily: "'Share Tech Mono',monospace" }}>
            {trendEmoji} {stats.recentTrend === "up" ? "Tendencia alcista" : stats.recentTrend === "down" ? "Tendencia bajista" : "Estable"}
          </span>
          {stats.currentStreak > 0 && (
            <span style={{ fontSize: 12, color: "#ff6d00", fontFamily: "'Share Tech Mono',monospace" }}>
              🔥 Racha de {stats.currentStreak} días
            </span>
          )}
        </div>
      </div>

      {/* ── MINI STATS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 28 }}>
        {[
          { label: "EXÁMENES", val: stats.totalExams.toString(), c: "var(--cyan)" },
          { label: "PROMEDIO", val: stats.totalExams ? stats.avgPct + "%" : "—", c: pctColor(stats.avgPct) },
          { label: "MEJOR SCORE", val: stats.totalExams ? stats.bestPct + "%" : "—", c: "#ffd700" },
          { label: "RACHA ACTUAL", val: stats.currentStreak + "d", c: "#ff6d00" },
          { label: "RACHA MÁXIMA", val: stats.maxStreak + "d", c: "#ff9800" },
          { label: "BADGES", val: `${stats.earnedBadges.length}/${12}`, c: "#7c4dff" },
        ].map(s => (
          <div key={s.label} style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: 6, padding: "14px 16px",
          }}>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 20, color: s.c, fontWeight: 700 }}>{s.val}</div>
            <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 2, fontFamily: "'Share Tech Mono',monospace", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── LINE CHART ── */}
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "22px 24px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 3, color: "var(--cyan)" }}>
            EVOLUCIÓN DE SCORES
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["ALL", ...LEVEL_ORDER, "GENERAL"].map(f => {
              const hasSome = f === "ALL" ? history.length > 0 : history.some(h => h.mode === f);
              if (!hasSome && f !== "ALL") return null;
              return (
                <button key={f} onClick={() => setChartFilter(f)} style={{
                  padding: "3px 8px", fontFamily: "'Share Tech Mono',monospace", fontSize: 9, letterSpacing: 1,
                  background: chartFilter === f ? "rgba(0,229,255,0.15)" : "var(--bg)",
                  border: chartFilter === f ? "1px solid var(--cyan)" : "1px solid var(--border)",
                  color: chartFilter === f ? "var(--cyan)" : "var(--muted)", borderRadius: 3, cursor: "pointer",
                }}>{f}</button>
              );
            })}
          </div>
        </div>
        <LineChart data={filteredChart} width={900} height={160} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* ── LEVEL BARS ── */}
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "22px 24px" }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 3, color: "var(--cyan)", marginBottom: 18 }}>
            PERFORMANCE POR NIVEL
          </div>
          <LevelRadar levelStats={stats.levelStats} />
        </div>

        {/* ── RECOMMENDATIONS ── */}
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "22px 24px" }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 3, color: "var(--cyan)", marginBottom: 18 }}>
            RECOMENDACIONES
          </div>
          <Recommendations stats={stats} onGoExam={onGoExam} />
        </div>
      </div>

      {/* ── RECENT 5 ── */}
      {history.length > 0 && (
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "22px 24px", marginBottom: 24 }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 3, color: "var(--cyan)", marginBottom: 16 }}>
            ACTIVIDAD RECIENTE
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {history.slice(0, 5).map((h, i) => {
              const modeCfg = EXAM_MODES.find(m => m.mode === h.mode);
              const col = modeCfg?.color || "var(--cyan)";
              return (
                <div key={i} style={{
                  flex: 1, minWidth: 120, background: "#060a0f",
                  border: `1px solid ${col}33`, borderRadius: 6, padding: "14px 16px",
                  textAlign: "center",
                }}>
                  <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 18, color: pctColor(h.pct), fontWeight: 700 }}>{h.pct}%</div>
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: col, marginTop: 4, letterSpacing: 1 }}>{h.mode}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 6 }}>
                    {new Date(h.date).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onGoExam} style={{
          flex: 1, padding: "14px", background: "rgba(0,229,255,0.08)",
          border: "1px solid rgba(0,229,255,0.3)", borderRadius: 4, cursor: "pointer",
          color: "var(--cyan)", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2,
        }}>🎓 HACER EXAMEN</button>
        <button onClick={onGoRetos} style={{
          flex: 1, padding: "14px", background: "rgba(255,215,0,0.08)",
          border: "1px solid rgba(255,215,0,0.3)", borderRadius: 4, cursor: "pointer",
          color: "#ffd700", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2,
        }}>🏆 VER RETOS</button>
      </div>
    </div>
  );
}
