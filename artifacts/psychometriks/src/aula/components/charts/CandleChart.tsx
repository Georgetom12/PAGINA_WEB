import React from "react";

export interface Candle {
  open: number;
  high: number;
  close: number;
  low: number;
  color?: string;
  label?: string;
}

const DEMO_CANDLES: Candle[] = [
  { open: 40, high: 55, close: 52, low: 37, label: "Alcista" },
  { open: 52, high: 58, close: 48, low: 45, label: "Bajista" },
  { open: 48, high: 53, close: 48, low: 43, label: "Doji" },
  { open: 40, high: 40, close: 62, low: 40, label: "Marubozu" },
  { open: 60, high: 78, close: 61, low: 42, label: "Pin Bar" },
  { open: 55, high: 57, close: 70, low: 38, label: "Martillo" },
  { open: 70, high: 82, close: 74, low: 68, label: "Alcista" },
  { open: 74, high: 76, close: 60, low: 57, label: "Bajista" },
  { open: 62, high: 68, close: 66, low: 58, label: "Alcista" },
  { open: 66, high: 80, close: 68, low: 65, label: "Pin Bar" },
  { open: 68, high: 75, close: 78, low: 66, label: "Alcista" },
  { open: 78, high: 85, close: 82, low: 76, label: "Alcista" },
];

interface CandleChartProps {
  candles?: Candle[];
  width?: number;
  height?: number;
  title?: string;
  annotations?: { x: number; y: number; text: string; color?: string }[];
  lines?: { y: number; color: string; label?: string; dash?: boolean }[];
  arrows?: { x1: number; y1: number; x2: number; y2: number; color?: string; label?: string }[];
}

export function CandleChart({
  candles = DEMO_CANDLES,
  width = 600,
  height = 280,
  title,
  annotations = [],
  lines = [],
  arrows = [],
}: CandleChartProps) {
  const pad = { top: 30, bottom: 30, left: 20, right: 80 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const allValues = candles.flatMap((c) => [c.high, c.low]);
  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);
  const range = maxV - minV || 1;

  const toY = (v: number) => pad.top + chartH - ((v - minV) / range) * chartH;
  const candleW = Math.max(8, (chartW / candles.length) * 0.55);
  const spacing = chartW / candles.length;

  const toX = (i: number) => pad.left + i * spacing + spacing / 2;

  return (
    <div style={{
      background: "var(--bg3)",
      border: "1px solid var(--border2)",
      borderRadius: 4,
      padding: "4px 0 8px",
      marginBottom: 20,
    }}>
      {title && (
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 10,
          letterSpacing: 2,
          color: "var(--muted)",
          textAlign: "center",
          padding: "8px 0 4px",
          textTransform: "uppercase",
        }}>
          {title}
        </div>
      )}
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
          <line
            key={i}
            x1={pad.left}
            y1={pad.top + chartH * (1 - pct)}
            x2={pad.left + chartW}
            y2={pad.top + chartH * (1 - pct)}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={1}
          />
        ))}

        {/* Horizontal price lines */}
        {lines.map((line, i) => {
          const y = toY(line.y);
          return (
            <g key={i}>
              <line
                x1={pad.left}
                y1={y}
                x2={pad.left + chartW + 60}
                y2={y}
                stroke={line.color}
                strokeWidth={1.5}
                strokeDasharray={line.dash ? "5,4" : undefined}
                opacity={0.85}
              />
              {line.label && (
                <text
                  x={pad.left + chartW + 4}
                  y={y - 3}
                  fill={line.color}
                  fontSize={9}
                  fontFamily="'Share Tech Mono', monospace"
                >
                  {line.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Candles */}
        {candles.map((c, i) => {
          const x = toX(i);
          const isGreen = c.close >= c.open;
          const color = c.color || (isGreen ? "#00e676" : "#ff1744");
          const bodyTop = toY(Math.max(c.open, c.close));
          const bodyBot = toY(Math.min(c.open, c.close));
          const bodyH = Math.max(1, bodyBot - bodyTop);

          return (
            <g key={i}>
              {/* Wick */}
              <line
                x1={x}
                y1={toY(c.high)}
                x2={x}
                y2={toY(c.low)}
                stroke={color}
                strokeWidth={1.5}
              />
              {/* Body */}
              <rect
                x={x - candleW / 2}
                y={bodyTop}
                width={candleW}
                height={bodyH}
                fill={isGreen ? color : color}
                opacity={0.85}
                rx={1}
              />
              {/* Label below */}
              {c.label && (
                <text
                  x={x}
                  y={height - 6}
                  textAnchor="middle"
                  fill="#546e7a"
                  fontSize={9}
                  fontFamily="'Share Tech Mono', monospace"
                >
                  {c.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Arrows */}
        {arrows.map((a, i) => (
          <g key={i}>
            <defs>
              <marker id={`arr${i}`} markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill={a.color || "#00e5ff"} />
              </marker>
            </defs>
            <line
              x1={toX(a.x1)}
              y1={toY(a.y1)}
              x2={toX(a.x2)}
              y2={toY(a.y2)}
              stroke={a.color || "#00e5ff"}
              strokeWidth={1.5}
              markerEnd={`url(#arr${i})`}
            />
            {a.label && (
              <text
                x={(toX(a.x1) + toX(a.x2)) / 2 + 6}
                y={(toY(a.y1) + toY(a.y2)) / 2}
                fill={a.color || "#00e5ff"}
                fontSize={9}
                fontFamily="'Share Tech Mono', monospace"
              >
                {a.label}
              </text>
            )}
          </g>
        ))}

        {/* Annotations */}
        {annotations.map((ann, i) => (
          <text
            key={i}
            x={toX(ann.x)}
            y={toY(ann.y) - 5}
            textAnchor="middle"
            fill={ann.color || "#00e5ff"}
            fontSize={10}
            fontFamily="'Share Tech Mono', monospace"
          >
            {ann.text}
          </text>
        ))}
      </svg>
    </div>
  );
}
