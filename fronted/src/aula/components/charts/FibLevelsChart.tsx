import React from "react";

const LEVELS = [
  { pct: 0,    label: "0%",    note: "Máximo del swing",            color: "#546e7a", bold: false },
  { pct: 23.6, label: "23.6%", note: "Primer retroceso — débil",    color: "#aaa",    bold: false },
  { pct: 38.2, label: "38.2%", note: "Retroceso moderado",          color: "#00e5ff", bold: false },
  { pct: 50,   label: "50%",   note: "Equilibrium (EQ)",            color: "#ffffff", bold: false },
  { pct: 61.8, label: "61.8%", note: "Golden Ratio — inicio GP",    color: "#ffd700", bold: true  },
  { pct: 70.5, label: "70.5%", note: "OTE — fin del Golden Pocket", color: "#ffd700", bold: true  },
  { pct: 78.6, label: "78.6%", note: "Retroceso profundo / OTE ext",color: "#ff6d00", bold: false },
  { pct: 88.6, label: "88.6%", note: "Zona extrema",                color: "#e040fb", bold: false },
  { pct: 100,  label: "100%",  note: "Mínimo del swing",            color: "#546e7a", bold: false },
];

const EXTENSIONS = [
  { pct: 127.2, label: "127.2%", note: "1ra extensión — TP1",         color: "#00e676" },
  { pct: 141.4, label: "141.4%", note: "TP intermedio",               color: "#00e676" },
  { pct: 161.8, label: "161.8%", note: "Extensión Golden — TP2",      color: "#ffd700" },
  { pct: 200,   label: "200%",   note: "Extensión doble",              color: "#00e5ff" },
  { pct: 224,   label: "224%",   note: "TP3 Fibonacci",                color: "#e040fb" },
  { pct: 261.8, label: "261.8%", note: "Extensión mayor",             color: "#ff1744" },
];

function fibY(pct: number, topY: number, botY: number) {
  return topY + (pct / 100) * (botY - topY);
}

export function FibLevelsChart() {
  const W = 700;
  const H = 400;
  const TOP_Y = 40;
  const BOT_Y = 280;
  const LEFT = 60;
  const RIGHT = 420;
  const MID = (LEFT + RIGHT) / 2;

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 380 }}>

          {/* ─── SECTION 1: Retrocesos (BULLISH) ─── */}
          <text x={LEFT} y={18} fill="#00e5ff" fontSize={11} fontFamily="'Share Tech Mono', monospace" letterSpacing={2}>
            RETROCESOS FIBONACCI — SETUP LONG
          </text>

          {/* Swing: from bottom-left to top-right */}
          {/* X axis: candles go left to right, then retroceso */}
          {/* Draw price: impulse up, then pullback to GP, then continuation */}
          {/* Impulse line */}
          <line x1={LEFT} y1={BOT_Y} x2={RIGHT} y2={TOP_Y} stroke="#00e676" strokeWidth={2} />
          {/* Pullback line to GP */}
          <line x1={RIGHT} y1={TOP_Y} x2={RIGHT + 60} y2={fibY(61.8, TOP_Y, BOT_Y)} stroke="#aaa" strokeWidth={1.5} strokeDasharray="4 3" />
          {/* Continuation line */}
          <line x1={RIGHT + 60} y1={fibY(61.8, TOP_Y, BOT_Y)} x2={RIGHT + 150} y2={TOP_Y - 50} stroke="#00e676" strokeWidth={2} />

          {/* Horizontal level lines */}
          {LEVELS.map(l => {
            const yy = fibY(l.pct, TOP_Y, BOT_Y);
            const isGP = l.pct === 61.8 || l.pct === 70.5;
            return (
              <g key={l.label}>
                <line
                  x1={LEFT} y1={yy} x2={RIGHT + (isGP ? 70 : 30)}
                  y2={yy}
                  stroke={l.color}
                  strokeWidth={l.bold ? 1.5 : 0.8}
                  strokeDasharray={l.bold ? undefined : "3 3"}
                  opacity={l.bold ? 1 : 0.7}
                />
                {/* Left label: percentage */}
                <text x={LEFT - 5} y={yy + 4} fill={l.color} fontSize={9}
                  fontFamily="'Share Tech Mono', monospace" textAnchor="end">
                  {l.label}
                </text>
                {/* Right label: description */}
                <text x={RIGHT + (isGP ? 75 : 35)} y={yy + 4} fill={l.color} fontSize={9}
                  fontFamily="Rajdhani, sans-serif">
                  {l.note}
                </text>
              </g>
            );
          })}

          {/* Golden Pocket highlight band */}
          <rect
            x={LEFT}
            y={fibY(61.8, TOP_Y, BOT_Y)}
            width={RIGHT + 70 - LEFT}
            height={fibY(70.5, TOP_Y, BOT_Y) - fibY(61.8, TOP_Y, BOT_Y)}
            fill="#ffd70020"
            stroke="#ffd70060"
            strokeWidth={0.5}
          />
          <text
            x={MID} y={fibY(66, TOP_Y, BOT_Y) + 4}
            fill="#ffd700" fontSize={10}
            fontFamily="'Share Tech Mono', monospace"
            textAnchor="middle"
          >
            ★ GOLDEN POCKET — ZONA DE COMPRA
          </text>

          {/* Swing markers */}
          <circle cx={LEFT} cy={BOT_Y} r={4} fill="#00e676" />
          <text x={LEFT + 6} y={BOT_Y - 6} fill="#00e676" fontSize={9} fontFamily="Rajdhani">Swing Low</text>
          <circle cx={RIGHT} cy={TOP_Y} r={4} fill="#00e676" />
          <text x={RIGHT - 55} y={TOP_Y - 6} fill="#00e676" fontSize={9} fontFamily="Rajdhani">Swing High</text>

          {/* GP entry marker */}
          <circle cx={RIGHT + 60} cy={fibY(61.8, TOP_Y, BOT_Y)} r={5} fill="#ffd700" />
          <text x={RIGHT + 66} y={fibY(61.8, TOP_Y, BOT_Y) + 4} fill="#ffd700" fontSize={9} fontFamily="Rajdhani">ENTRADA</text>

          {/* TP markers */}
          <line x1={RIGHT + 80} y1={TOP_Y - 20} x2={RIGHT + 150} y2={TOP_Y - 20} stroke="#00e67644" strokeWidth={0.8} strokeDasharray="3 2" />
          <text x={RIGHT + 155} y={TOP_Y - 16} fill="#00e676" fontSize={9} fontFamily="'Share Tech Mono', monospace">TP EXT 127.2%</text>
          <line x1={RIGHT + 80} y1={TOP_Y - 50} x2={RIGHT + 150} y2={TOP_Y - 50} stroke="#ffd70044" strokeWidth={0.8} strokeDasharray="3 2" />
          <text x={RIGHT + 155} y={TOP_Y - 46} fill="#ffd700" fontSize={9} fontFamily="'Share Tech Mono', monospace">TP EXT 161.8%</text>

          {/* ─── SECTION 2: Extensions table (right panel) ─── */}
          <text x={570} y={18} fill="#ff1744" fontSize={10} fontFamily="'Share Tech Mono', monospace" letterSpacing={1}>
            EXTENSIONES
          </text>
          {EXTENSIONS.map((e, i) => (
            <g key={e.label}>
              <rect x={568} y={28 + i * 38} width={120} height={32} fill={`${e.color}10`} stroke={`${e.color}44`} strokeWidth={0.5} rx={2} />
              <text x={574} y={42 + i * 38} fill={e.color} fontSize={10} fontFamily="'Share Tech Mono', monospace">{e.label}</text>
              <text x={574} y={54 + i * 38} fill="#546e7a" fontSize={9} fontFamily="Rajdhani">{e.note}</text>
            </g>
          ))}

          {/* Bottom label */}
          <text x={LEFT} y={H - 12} fill="#546e7a" fontSize={9} fontFamily="Rajdhani, sans-serif">
            Golden Pocket (61.8%–70.5%) + OB o FVG en esa zona = setup de mayor probabilidad en SMC
          </text>
        </svg>
      </div>

      {/* Level cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginTop: 14 }}>
        {[
          { color: "#00e5ff", label: "38.2%", title: "Retroceso Shallow", body: "Movimiento fuerte — los institucionales compraron temprano. Poca corrección." },
          { color: "#ffd700", label: "61.8% – 70.5%", title: "Golden Pocket ★", body: "Zona de mayor probabilidad estadística. Aquí entra el smart money en pullbacks." },
          { color: "#ff6d00", label: "78.6%", title: "Retroceso Profundo", body: "OTE extendido. Mercados volátiles (crypto) suelen retroceder hasta aquí." },
          { color: "#e040fb", label: "88.6%", title: "Zona Extrema", body: "Casi el mínimo completo. Si llega aquí, el setup puede estar invalidándose." },
          { color: "#00e676", label: "127.2%", title: "TP1 Extensión", body: "Primer objetivo de extensión. Cierra 50% de posición aquí." },
          { color: "#ffd700", label: "161.8%", title: "TP2 Golden Ext.", body: "El Golden Ratio de extensión. Objetivo final para operaciones de alta calidad." },
        ].map(c => (
          <div key={c.label} style={{
            background: "var(--bg3)", border: `1px solid ${c.color}44`,
            borderLeft: `3px solid ${c.color}`, padding: "8px 10px",
          }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: c.color, marginBottom: 2 }}>{c.label}</div>
            <div style={{ fontSize: 11, color: "var(--text)", marginBottom: 3, fontFamily: "Orbitron" }}>{c.title}</div>
            <div style={{ fontSize: 11, color: "#7a8fa0", lineHeight: 1.55 }}>{c.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
