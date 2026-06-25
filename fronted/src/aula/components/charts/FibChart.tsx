import React from "react";

interface FibChartProps {
  direction?: "bullish" | "bearish";
  title?: string;
  width?: number;
  height?: number;
}

const LEVELS = [
  { pct: 0,     label: "0%",     color: "#00e676" },
  { pct: 0.236, label: "23.6%",  color: "#546e7a" },
  { pct: 0.382, label: "38.2%",  color: "#00e5ff" },
  { pct: 0.5,   label: "50%",    color: "#546e7a" },
  { pct: 0.618, label: "61.8% ★ GOLDEN",  color: "#ffd700" },
  { pct: 0.705, label: "70.5%",  color: "#ffd700" },
  { pct: 0.786, label: "78.6%",  color: "#e040fb" },
  { pct: 1,     label: "100%",   color: "#ff1744" },
];

export function FibChart({ direction = "bullish", title, width = 620, height = 340 }: FibChartProps) {
  const pad = { top: 40, bottom: 30, left: 30, right: 160 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const priceHigh = 100;
  const priceLow = 0;

  const toY = (pct: number) => {
    if (direction === "bullish") {
      return pad.top + pct * chartH;
    }
    return pad.top + (1 - pct) * chartH;
  };

  const fibLines = LEVELS.map((l) => ({
    ...l,
    y: toY(l.pct),
    price: direction === "bullish"
      ? (priceHigh - (priceHigh - priceLow) * l.pct).toFixed(1)
      : (priceLow + (priceHigh - priceLow) * l.pct).toFixed(1),
  }));

  const midPct = 0.5;
  const rightEdge = pad.left + chartW;

  return (
    <div style={{
      background: "var(--bg3)",
      border: "1px solid var(--border2)",
      borderRadius: 4,
      marginBottom: 20,
    }}>
      {title && (
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 10,
          letterSpacing: 2,
          color: "var(--muted)",
          textAlign: "center",
          padding: "10px 0 0",
          textTransform: "uppercase",
        }}>
          {title}
        </div>
      )}
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
        {/* Background for Golden Pocket zone */}
        <rect
          x={pad.left}
          y={toY(0.705)}
          width={chartW}
          height={Math.abs(toY(0.618) - toY(0.705))}
          fill="rgba(255,215,0,0.12)"
          rx={0}
        />

        {/* Price path */}
        {direction === "bullish" ? (
          <polyline
            points={`
              ${pad.left + 10},${toY(1)}
              ${pad.left + chartW * 0.4},${toY(0)}
              ${pad.left + chartW * 0.55},${toY(0.55)}
              ${pad.left + chartW * 0.7},${toY(0.618)}
            `}
            fill="none"
            stroke="#00e5ff"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <polyline
            points={`
              ${pad.left + 10},${toY(0)}
              ${pad.left + chartW * 0.4},${toY(1)}
              ${pad.left + chartW * 0.55},${toY(0.45)}
              ${pad.left + chartW * 0.7},${toY(0.382)}
            `}
            fill="none"
            stroke="#ff6d00"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Fib lines */}
        {fibLines.map((line, i) => (
          <g key={i}>
            <line
              x1={pad.left}
              y1={line.y}
              x2={rightEdge}
              y2={line.y}
              stroke={line.color}
              strokeWidth={line.pct === 0.618 || line.pct === 0.705 ? 2 : 1}
              strokeDasharray={line.pct === 0 || line.pct === 1 ? undefined : "4,3"}
              opacity={0.9}
            />
            <text
              x={rightEdge + 6}
              y={line.y + 4}
              fill={line.color}
              fontSize={9}
              fontFamily="'Share Tech Mono', monospace"
            >
              {line.label}
            </text>
          </g>
        ))}

        {/* Golden Pocket label */}
        <text
          x={pad.left + chartW * 0.5}
          y={(toY(0.618) + toY(0.705)) / 2 + 4}
          textAnchor="middle"
          fill="#ffd700"
          fontSize={11}
          fontWeight="bold"
          fontFamily="'Orbitron', monospace"
        >
          GOLDEN POCKET
        </text>

        {/* Origin points labels */}
        {direction === "bullish" && (
          <>
            <text x={pad.left + 12} y={toY(1) - 6} fill="#ff1744" fontSize={10} fontFamily="'Share Tech Mono', monospace">SWING LOW (0)</text>
            <text x={pad.left + chartW * 0.38} y={toY(0) - 8} fill="#00e676" fontSize={10} fontFamily="'Share Tech Mono', monospace">SWING HIGH (100)</text>
            <text x={pad.left + chartW * 0.58} y={toY(0.618) + 14} fill="#ffd700" fontSize={10} fontFamily="'Share Tech Mono', monospace">ENTRADA LONG</text>
          </>
        )}
        {direction === "bearish" && (
          <>
            <text x={pad.left + 12} y={toY(0) - 6} fill="#00e676" fontSize={10} fontFamily="'Share Tech Mono', monospace">SWING HIGH (0)</text>
            <text x={pad.left + chartW * 0.38} y={toY(1) + 16} fill="#ff1744" fontSize={10} fontFamily="'Share Tech Mono', monospace">SWING LOW (100)</text>
            <text x={pad.left + chartW * 0.58} y={toY(0.382) - 10} fill="#ffd700" fontSize={10} fontFamily="'Share Tech Mono', monospace">ENTRADA SHORT</text>
          </>
        )}

        {/* Title top */}
        <text
          x={pad.left}
          y={24}
          fill={direction === "bullish" ? "#00e676" : "#ff6d00"}
          fontSize={11}
          fontFamily="'Orbitron', monospace"
          fontWeight="bold"
          letterSpacing={2}
        >
          FIBONACCI {direction === "bullish" ? "ALCISTA — RETROCESOS" : "BAJISTA — RETROCESOS"}
        </text>
      </svg>
    </div>
  );
}
