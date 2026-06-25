import React from "react";

interface Session {
  start: number;
  end: number;
  name: string;
  subname: string;
  color: string;
  volume: number;
  badge?: string;
  badgeColor?: string;
  tags: string[];
  description: string;
}

const SESSIONS_GYE: Session[] = [
  {
    start: 18, end: 27, // 6PM - 3AM (27 = 3AM next day)
    name: "🌏 ASIA",
    subname: "Tokio · Singapur · Hong Kong",
    color: "#00e5ff",
    volume: 30,
    badge: "Baja volatilidad",
    badgeColor: "#00e5ff",
    tags: ["JPY activo", "AUD/NZD", "Nikkei/HSI", "BTC lateral"],
    description: "Mercado tranquilo. BTC tiende a moverse lateral o con rangos pequeños. Los pares JPY (USD/JPY, EUR/JPY) son los más activos. Buena sesión para estudiar y planificar — no para buscar entradas agresivas.",
  },
  {
    start: 26, end: 28, // 2AM - 4AM
    name: "⚠️ PRE-LONDON",
    subname: "Zona Trampa · Judas Swing",
    color: "#ff6d00",
    volume: 25,
    badge: "Manipulación",
    badgeColor: "#ff6d00",
    tags: ["Judas Swing", "Fake breakout", "Stop hunt"],
    description: "Zona clásica de manipulación antes de Londres. Los market makers barren stops en ambas direcciones para acumular posiciones. Tu sistema debería detectar señales de Judas Swing aquí. NO operar a ciegas — esperar confirmación.",
  },
  {
    start: 27, end: 36, // 3AM - 12PM
    name: "🇬🇧 LONDON",
    subname: "Mercado Europeo",
    color: "#e040fb",
    volume: 65,
    badge: "Alta volatilidad",
    badgeColor: "#e040fb",
    tags: ["EUR/GBP activos", "XAU/USD mueve", "BTC despierta", "DAX/FTSE"],
    description: "Londres maneja ~35% del volumen forex global. BTC y XAU/USD empiezan a moverse con fuerza. Los primeros movimientos de Londres suelen marcar la dirección del día. Zona de entradas de alta probabilidad una vez confirmada la dirección.",
  },
  {
    start: 32, end: 36, // 8AM - 12PM
    name: "⚡ OVERLAP",
    subname: "Londres + Nueva York ★ LA MEJOR",
    color: "#ffd700",
    volume: 95,
    badge: "Máxima volatilidad",
    badgeColor: "#ffd700",
    tags: ["Más volumen del día", "Movimientos reales", "Noticias USA", "BTC explosivo"],
    description: "Tu ventana dorada. Dos centros financieros activos al mismo tiempo. Aquí ocurren los movimientos más limpios, los breakouts reales y las mayores liquidaciones. NFP, CPI, FOMC salen en este rango. Máxima atención.",
  },
  {
    start: 32, end: 41, // 8AM - 5PM
    name: "🇺🇸 NEW YORK",
    subname: "Mercado USA",
    color: "#00e676",
    volume: 75,
    badge: "Alta volatilidad",
    badgeColor: "#00e676",
    tags: ["SPX/NDX", "USD dominante", "BTC correlado", "Futuros CME"],
    description: "Después del overlap baja un poco pero sigue siendo zona activa. El cierre de NY (5PM tu hora) suele traer reducción de posiciones institucionales. Los futuros CME de BTC cierran aquí también — puede generar gaps al reabrir.",
  },
  {
    start: 41, end: 42, // 5PM - 6PM
    name: "💀 DEAD ZONE",
    subname: "Cierre NY / Pre-Asia",
    color: "#546e7a",
    volume: 10,
    badge: "Mínimo volumen",
    badgeColor: "#546e7a",
    tags: ["Spreads altos", "Liquidez baja", "Evitar entradas"],
    description: "La hora más muerta del mercado. Spreads amplios, movimientos sin sentido, trampas fáciles. En crypto puede haber moves bruscos sin volumen real. Mejor no operar este rango.",
  },
];

interface SessionChartProps {
  width?: number;
}

function TimeLabel({ hour24 }: { hour24: number }) {
  const h = hour24 % 24;
  const ampm = h < 12 ? "AM" : "PM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return <>{display}{ampm}</>;
}

export function SessionChart({ width = 700 }: SessionChartProps) {
  // 18:00 to 18:00 next day = 24 hours
  // x axis: 18 to 42 (24h block, 42 = 18 next day)
  const totalHours = 24;
  const startHour = 18; // 6PM GYE
  const endHour = 42;   // 6PM next day

  const padL = 14;
  const padR = 14;
  const barH = 54;
  const labelH = 24;
  const rulerH = 22;
  const chartW = width - padL - padR;

  const toX = (h: number) => padL + ((h - startHour) / totalHours) * chartW;

  return (
    <div style={{
      background: "var(--bg3)",
      border: "1px solid var(--border2)",
      borderRadius: 4,
      overflow: "hidden",
      marginBottom: 20,
    }}>
      <div style={{
        padding: "12px 16px 8px",
        fontFamily: "'Orbitron', monospace",
        fontSize: 11,
        letterSpacing: 3,
        color: "var(--cyan)",
        borderBottom: "1px solid var(--border)",
      }}>
        SESIONES DE TRADING — HORARIO GUAYAQUIL (GMT-5)
      </div>

      {/* Timeline SVG */}
      <div style={{ overflowX: "auto" }}>
        <svg width={width} height={rulerH + 16} style={{ display: "block", minWidth: 400 }}>
          {/* Hour ticks */}
          {Array.from({ length: 25 }).map((_, i) => {
            const h = startHour + i;
            const x = toX(h);
            const label = h % 24;
            const ampm = label < 12 ? "AM" : "PM";
            const display = label === 0 ? "12" : label > 12 ? String(label - 12) : String(label);
            const important = label % 3 === 0;
            return (
              <g key={i}>
                <line x1={x} y1={0} x2={x} y2={important ? 8 : 5} stroke="var(--border2)" strokeWidth={1} />
                {important && (
                  <text
                    x={x}
                    y={20}
                    textAnchor="middle"
                    fill={label === 8 ? "#ffd700" : label === 3 ? "#ff6d00" : "var(--muted)"}
                    fontSize={9}
                    fontFamily="'Share Tech Mono', monospace"
                  >
                    {display}{ampm}
                  </text>
                )}
              </g>
            );
          })}
          {/* Line */}
          <line x1={padL} y1={1} x2={width - padR} y2={1} stroke="var(--border)" strokeWidth={1} />
        </svg>
      </div>

      {/* Session blocks */}
      <div style={{ padding: "4px 14px 8px" }}>
        {SESSIONS_GYE.map((s, i) => {
          const leftPct = ((s.start - startHour) / totalHours) * 100;
          const widthPct = ((s.end - s.start) / totalHours) * 100;

          return (
            <div key={i} style={{ marginBottom: 16, position: "relative" }}>
              {/* Bar */}
              <div style={{ position: "relative", height: 8, background: "var(--bg)", marginBottom: 10, borderRadius: 2 }}>
                <div style={{
                  position: "absolute",
                  left: `${Math.max(0, leftPct)}%`,
                  width: `${Math.min(widthPct, 100 - Math.max(0, leftPct))}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${s.color}cc, ${s.color}44)`,
                  borderRadius: 2,
                }} />
              </div>

              <div style={{
                background: `${s.color}0d`,
                border: `1px solid ${s.color}33`,
                borderLeft: `3px solid ${s.color}`,
                borderRadius: 3,
                padding: "12px 14px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                  <div>
                    <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, color: s.color, marginBottom: 2 }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.subname}</div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "var(--text)", marginTop: 3 }}>
                      {s.start >= 24
                        ? `${((s.start % 24) || 12) > 12 ? (s.start % 24) - 12 : (s.start % 24) || 12}:00 ${s.start % 24 < 12 ? "AM" : "PM"}`
                        : `${s.start > 12 ? s.start - 12 : s.start}:00 ${s.start >= 12 ? "PM" : "AM"}`
                      }
                      {" — "}
                      {(() => {
                        const e = s.end % 24;
                        const h = e > 12 ? e - 12 : e === 0 ? 12 : e;
                        const ap = e < 12 ? "AM" : "PM";
                        return `${h}:00 ${ap}`;
                      })()}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <span style={{
                      background: `${s.badgeColor}22`,
                      border: `1px solid ${s.badgeColor}55`,
                      color: s.badgeColor,
                      fontSize: 10,
                      padding: "2px 8px",
                      fontFamily: "'Share Tech Mono', monospace",
                      letterSpacing: 1,
                    }}>
                      {s.badge}
                    </span>
                    <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "right" }}>
                      <span style={{ color: s.color, fontWeight: 700 }}>Volumen: </span>
                      <div style={{
                        display: "inline-block",
                        width: 80,
                        height: 6,
                        background: "var(--bg)",
                        borderRadius: 3,
                        overflow: "hidden",
                        verticalAlign: "middle",
                        marginLeft: 4,
                      }}>
                        <div style={{
                          width: `${s.volume}%`,
                          height: "100%",
                          background: `linear-gradient(90deg, ${s.color}, ${s.color}66)`,
                          borderRadius: 3,
                        }} />
                      </div>
                      <span style={{ color: s.color, marginLeft: 4, fontSize: 10 }}>{s.volume}%</span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {s.tags.map((tag, j) => (
                    <span key={j} style={{
                      background: "var(--bg3)",
                      border: "1px solid var(--border2)",
                      color: "#8ca0b0",
                      fontSize: 10,
                      padding: "2px 8px",
                      fontFamily: "'Share Tech Mono', monospace",
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>

                <p style={{ fontSize: 13, color: "#8ca0b0", lineHeight: 1.65, margin: 0 }}>
                  {s.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Your optimal hours panel */}
      <div style={{ padding: "12px 14px 14px", borderTop: "1px solid var(--border)" }}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 10,
          letterSpacing: 3,
          color: "var(--muted)",
          marginBottom: 12,
        }}>
          TU HORARIO ÓPTIMO — GUAYAQUIL (GMT-5)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10 }}>
          {[
            { time: "8:00 AM — 12:00 PM", label: "Ventana Principal ★", color: "#ffd700", desc: "Overlap Londres+NY — máximo volumen y claridad direccional" },
            { time: "3:00 AM — 7:00 AM", label: "Ventana Secundaria", color: "#e040fb", desc: "Apertura Londres — primeras señales direccionales del día" },
            { time: "2:00 AM — 4:00 AM", label: "Zona Trampa ⚠", color: "#ff6d00", desc: "Pre-Londres — Judas Swing / stop hunt clásico" },
            { time: "5:00 PM — 6:00 PM", label: "Evitar Operar", color: "#546e7a", desc: "Dead zone — spreads altos, sin liquidez real" },
          ].map((item, i) => (
            <div key={i} style={{
              background: "var(--bg2)",
              border: `1px solid ${item.color}44`,
              padding: "10px 12px",
              borderRadius: 3,
            }}>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 12, color: item.color, marginBottom: 4 }}>
                {item.time}
              </div>
              <div style={{ fontSize: 11, color: item.color, marginBottom: 4, opacity: 0.8 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: "#546e7a", lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Special events */}
      <div style={{ padding: "12px 14px 14px", borderTop: "1px solid var(--border)" }}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 10,
          letterSpacing: 3,
          color: "var(--muted)",
          marginBottom: 12,
        }}>
          EVENTOS ESPECIALES DENTRO DE SESIONES
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
          {[
            { event: "CME Gap (Dom 6 PM)", desc: "Futuros BTC cierran viernes 5PM y reabren domingo 6PM GYE. Los gaps que quedan suelen cerrarse — zona de atracción de precio.", color: "#ff6d00" },
            { event: "Apertura Wall St. (9:30 AM)", desc: "SPX/NDX abren — BTC suele hacer un micro-move de confirmación o negación de tendencia. Muy importante como confluencia.", color: "#00e676" },
            { event: "Cierre Londres (12 PM)", desc: "Institucionales europeos cierran posiciones. Puede generar reversión temporal antes de que NY tome control total.", color: "#e040fb" },
            { event: "FOMC / NFP / CPI", desc: "Salen casi siempre entre 8:30–10:00 AM GYE. Mayor impacto del año en esas ventanas. Evitar posiciones abiertas antes del dato.", color: "#ff1744" },
            { event: "Futuros Asia (6:00 PM)", desc: "Apertura de Tokio con futuros Nikkei. Si hay gap significativo indica sentimiento de riesgo para la sesión siguiente.", color: "#00e5ff" },
            { event: "Cierre mensual / trimestral", desc: "Último día del mes/trimestre — rebalanceos institucionales crean movimientos atípicos. No confundir con señales técnicas.", color: "#ffd700" },
          ].map((item, i) => (
            <div key={i} style={{
              background: "var(--bg2)",
              border: `1px solid ${item.color}33`,
              borderLeft: `2px solid ${item.color}`,
              padding: "10px 12px",
            }}>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 13, color: item.color, marginBottom: 4 }}>
                {item.event}
              </div>
              <div style={{ fontSize: 12, color: "#7a8fa0", lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
