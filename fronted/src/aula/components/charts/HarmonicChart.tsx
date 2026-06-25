import React from "react";

export type HarmonicType = "bat" | "gartley" | "butterfly" | "crab" | "shark" | "cypher" | "abcd";

const HARMONICS: Record<HarmonicType, {
  name: string;
  color: string;
  xab: string;
  abc: string;
  bcd: string;
  xad: string;
  description: string;
  bullPoints: [number, number][];
  bearPoints: [number, number][];
}> = {
  gartley: {
    name: "Gartley",
    color: "#00e5ff",
    xab: "61.8%",
    abc: "38.2%–88.6%",
    bcd: "127.2%–161.8%",
    xad: "78.6%",
    description: "El patrón más clásico. Retroceso profundo al 78.6% del XA. Alta probabilidad en Golden Pocket.",
    bullPoints: [[40,220],[140,80],[200,130],[300,60],[360,160]],
    bearPoints: [[40,60],[140,200],[200,150],[300,220],[360,100]],
  },
  bat: {
    name: "Bat (Murciélago)",
    color: "#00e676",
    xab: "38.2%–50%",
    abc: "38.2%–88.6%",
    bcd: "161.8%–261.8%",
    xad: "88.6%",
    description: "Retroceso al 88.6% del XA. Muy preciso — el SL queda justo bajo X. RR excelente.",
    bullPoints: [[40,220],[120,110],[190,145],[290,70],[360,195]],
    bearPoints: [[40,60],[120,170],[190,135],[290,210],[360,75]],
  },
  butterfly: {
    name: "Butterfly (Mariposa)",
    color: "#ffd700",
    xab: "78.6%",
    abc: "38.2%–88.6%",
    bcd: "161.8%–261.8%",
    xad: "127.2%–161.8%",
    description: "D supera el punto X — es una extensión. Alta probabilidad de reversión en ese extremo.",
    bullPoints: [[40,180],[120,80],[200,120],[300,50],[380,210]],
    bearPoints: [[40,100],[120,200],[200,160],[300,230],[380,70]],
  },
  crab: {
    name: "Crab (Cangrejo)",
    color: "#e040fb",
    xab: "38.2%–61.8%",
    abc: "38.2%–88.6%",
    bcd: "224%–361.8%",
    xad: "161.8%",
    description: "El patrón extremo. D llega al 161.8% de XA. Reversiones muy violentas desde D.",
    bullPoints: [[40,200],[110,110],[180,140],[280,80],[380,240]],
    bearPoints: [[40,80],[110,170],[180,140],[280,200],[380,40]],
  },
  shark: {
    name: "Shark (Tiburón)",
    color: "#ff6d00",
    xab: "N/A",
    abc: "113%–161.8%",
    bcd: "50%–88.6%",
    xad: "88.6%–113%",
    description: "Patrón de 5 puntos (O-X-A-B-C). Extensiones del ABC. Muy popular en crypto.",
    bullPoints: [[40,200],[100,100],[180,160],[280,50],[360,130]],
    bearPoints: [[40,80],[100,180],[180,120],[280,230],[360,150]],
  },
  cypher: {
    name: "Cypher",
    color: "#7c4dff",
    xab: "38.2%–61.8%",
    abc: "113%–141.4%",
    bcd: "78.6%",
    xad: "78.6%",
    description: "Solo 4 puntos. C supera A. D es el 78.6% del rango XC. Muy limpio en crypto.",
    bullPoints: [[40,220],[120,100],[210,145],[280,60],[360,175]],
    bearPoints: [[40,60],[120,180],[210,135],[280,220],[360,105]],
  },
  abcd: {
    name: "AB=CD",
    color: "#00e5ff",
    xab: "N/A",
    abc: "38.2%–88.6%",
    bcd: "127.2%–161.8%",
    xad: "127.2%–161.8%",
    description: "El más básico: AB = CD en longitud y tiempo. Hay versión alcista y bajista. Muy común.",
    bullPoints: [[80,220],[180,100],[260,150],[360,30]],
    bearPoints: [[80,60],[180,180],[260,130],[360,250]],
  },
};

interface HarmonicChartProps {
  pattern: HarmonicType;
  direction?: "bull" | "bear";
  width?: number;
  height?: number;
  showInfo?: boolean;
}

export function HarmonicChart({
  pattern,
  direction = "bull",
  width = 560,
  height = 300,
  showInfo = true,
}: HarmonicChartProps) {
  const h = HARMONICS[pattern];
  const points = direction === "bull" ? h.bullPoints : h.bearPoints;
  const labels = pattern === "abcd"
    ? ["A", "B", "C", "D"]
    : ["X", "A", "B", "C", "D"];

  const polyPts = points.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <div style={{
      background: "var(--bg3)",
      border: `1px solid ${h.color}33`,
      borderLeft: `3px solid ${h.color}`,
      borderRadius: 4,
      marginBottom: 16,
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px 6px",
      }}>
        <span style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: 13,
          color: h.color,
          fontWeight: 700,
        }}>
          {h.name}
        </span>
        <span style={{
          fontSize: 11,
          color: "var(--muted)",
          fontFamily: "'Rajdhani', sans-serif",
        }}>
          {direction === "bull" ? "📈 Alcista" : "📉 Bajista"}
        </span>
      </div>

      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
        {/* Lines connecting points */}
        <polyline
          points={polyPts}
          fill="none"
          stroke={h.color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.85}
        />

        {/* Shaded triangle area */}
        {points.length >= 4 && (
          <polygon
            points={`${points[0][0]},${points[0][1]} ${points[points.length-1][0]},${points[points.length-1][1]} ${points[points.length-2][0]},${points[points.length-2][1]}`}
            fill={direction === "bull" ? "rgba(0,230,118,0.07)" : "rgba(255,23,68,0.07)"}
          />
        )}

        {/* Point markers + labels */}
        {points.map(([x, y], i) => {
          const isLast = i === points.length - 1;
          const label = labels[i] || "?";
          const pointColor = isLast
            ? (direction === "bull" ? "#00e676" : "#ff1744")
            : h.color;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={isLast ? 8 : 5} fill={pointColor} opacity={0.9} />
              <text
                x={x + (i % 2 === 0 ? -12 : 12)}
                y={y + 4}
                textAnchor={i % 2 === 0 ? "end" : "start"}
                fill={pointColor}
                fontSize={14}
                fontWeight="bold"
                fontFamily="'Orbitron', monospace"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* D = Entry label */}
        {(() => {
          const lastPt = points[points.length - 1];
          return (
            <text
              x={lastPt[0] + 15}
              y={lastPt[1] + (direction === "bull" ? 14 : -10)}
              fill={direction === "bull" ? "#00e676" : "#ff1744"}
              fontSize={10}
              fontFamily="'Share Tech Mono', monospace"
            >
              ENTRADA
            </text>
          );
        })()}
      </svg>

      {showInfo && (
        <div style={{
          padding: "8px 16px 12px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px 16px",
          borderTop: `1px solid ${h.color}22`,
        }}>
          {[
            ["XAB", h.xab],
            ["ABC", h.abc],
            ["BCD", h.bcd],
            ["XAD", h.xad],
          ].filter(([, v]) => v !== "N/A").map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 10,
                color: h.color,
                minWidth: 28,
              }}>
                {k}:
              </span>
              <span style={{ fontSize: 12, color: "#b0c4d8" }}>{v}</span>
            </div>
          ))}
          <div style={{ gridColumn: "1/-1", marginTop: 6, fontSize: 12, color: "#8ca0b0", lineHeight: 1.5 }}>
            {h.description}
          </div>
        </div>
      )}
    </div>
  );
}
