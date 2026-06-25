import React from "react";

export function AMDChart() {
  const W = 700;
  const H = 340;

  // Price path: accumulation (flat) → manipulation (fake spike down) → distribution (real move up)
  // Then show the Bearish AMD too

  // Bullish AMD price path (simplified):
  const bullPath = [
    // Accumulation: x 40-200, price oscillates around y=200
    [40, 200], [55, 192], [70, 208], [85, 196], [100, 205], [115, 195], [130, 202], [145, 198], [160, 204], [175, 197], [190, 201],
    // Manipulation: fake spike DOWN (Judas Swing)
    [205, 230], [215, 248], [225, 265], [232, 255], [238, 240],
    // Distribution: real move UP
    [248, 220], [262, 195], [278, 172], [295, 148], [312, 122], [330, 100], [345, 82], [358, 68], [370, 55], [382, 45],
    // End
    [395, 42],
  ];

  const toSVG = (pts: number[][]) =>
    pts.map(([x, y]) => `${x},${y}`).join(" ");

  // Bear AMD price path
  const bearPath = [
    // Accumulation flat
    [430, 145], [445, 138], [460, 150], [475, 143], [490, 152], [505, 142], [520, 148], [535, 144], [550, 150], [565, 141], [578, 147],
    // Manipulation: fake spike UP
    [590, 128], [600, 112], [608, 98], [615, 110], [620, 125],
    // Distribution: real move DOWN
    [632, 148], [645, 170], [658, 193], [672, 215], [682, 235], [690, 255],
  ];

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 380 }}>

          {/* Grid */}
          {[80, 140, 200, 260].map(yy => (
            <line key={yy} x1={0} y1={yy} x2={W} y2={yy} stroke="#1a2535" strokeWidth={0.5} />
          ))}

          {/* ─── BULLISH AMD ─────────────────────────────────────── */}
          {/* Phase zones background */}
          {/* Accumulation zone */}
          <rect x={35} y={30} width={175} height={290} fill="#7c4dff08" stroke="#7c4dff33" strokeWidth={0.5} rx={2} />
          {/* Manipulation zone */}
          <rect x={198} y={30} width={55} height={290} fill="#ff6d0015" stroke="#ff6d0055" strokeWidth={0.5} rx={2} />
          {/* Distribution zone */}
          <rect x={243} y={30} width={162} height={290} fill="#00e67608" stroke="#00e67633" strokeWidth={0.5} rx={2} />

          {/* Session bands (Bullish) */}
          <text x={38} y={22} fill="#7c4dff" fontSize={9} fontFamily="'Share Tech Mono', monospace" letterSpacing={1}>ASIA — ACUMULACIÓN</text>
          <text x={200} y={22} fill="#ff6d00" fontSize={9} fontFamily="'Share Tech Mono', monospace" letterSpacing={1}>MAN.</text>
          <text x={248} y={22} fill="#00e676" fontSize={9} fontFamily="'Share Tech Mono', monospace" letterSpacing={1}>LONDON + NY — DISTRIBUCIÓN</text>

          {/* Price line: Accumulation */}
          <polyline
            points={toSVG(bullPath.slice(0, 11))}
            fill="none" stroke="#7c4dff" strokeWidth={2}
          />

          {/* Price line: Manipulation */}
          <polyline
            points={toSVG(bullPath.slice(10, 16))}
            fill="none" stroke="#ff6d00" strokeWidth={2.5}
          />

          {/* Price line: Distribution */}
          <polyline
            points={toSVG(bullPath.slice(15))}
            fill="none" stroke="#00e676" strokeWidth={2.5}
          />

          {/* Equilibrium line (range midpoint) */}
          <line x1={35} y1={201} x2={242} y2={201} stroke="#ffffff22" strokeWidth={1} strokeDasharray="5 3" />
          <text x={37} y={197} fill="#546e7a" fontSize={8} fontFamily="'Share Tech Mono', monospace">EQ</text>

          {/* Manipulation low label */}
          <line x1={225} y1={265} x2={290} y2={290} stroke="#ff6d00" strokeWidth={0.8} strokeDasharray="3 2" />
          <text x={254} y={307} fill="#ff6d00" fontSize={9} fontFamily="Rajdhani, sans-serif">Judas Swing — SSL Sweep</text>

          {/* BOS arrow up */}
          <line x1={248} y1={195} x2={248} y2={145} stroke="#00e676" strokeWidth={1} strokeDasharray="3 2" />
          <polygon points="244,148 248,138 252,148" fill="#00e676" />
          <text x={253} y={148} fill="#00e676" fontSize={9} fontFamily="'Share Tech Mono', monospace">BOS ↑</text>

          {/* Direction arrow */}
          <line x1={360} y1={100} x2={390} y2={50} stroke="#00e676" strokeWidth={2} />
          <polygon points="386,48 393,44 388,53" fill="#00e676" />

          {/* ─── BEARISH AMD ──────────────────────────────────────── */}
          {/* Phase zones */}
          <rect x={424} y={30} width={162} height={290} fill="#7c4dff08" stroke="#7c4dff33" strokeWidth={0.5} rx={2} />
          <rect x={582} y={30} width={45} height={290} fill="#ff6d0015" stroke="#ff6d0055" strokeWidth={0.5} rx={2} />
          <rect x={623} y={30} width={75} height={290} fill="#ff174408" stroke="#ff174433" strokeWidth={0.5} rx={2} />

          {/* Labels */}
          <text x={428} y={22} fill="#7c4dff" fontSize={9} fontFamily="'Share Tech Mono', monospace" letterSpacing={1}>ACUM.</text>
          <text x={585} y={22} fill="#ff6d00" fontSize={9} fontFamily="'Share Tech Mono', monospace" letterSpacing={1}>MAN.</text>
          <text x={628} y={22} fill="#ff1744" fontSize={9} fontFamily="'Share Tech Mono', monospace" letterSpacing={1}>DIST.</text>

          {/* Price line: Accumulation */}
          <polyline
            points={toSVG(bearPath.slice(0, 11))}
            fill="none" stroke="#7c4dff" strokeWidth={2}
          />
          {/* Manipulation UP */}
          <polyline
            points={toSVG(bearPath.slice(10, 16))}
            fill="none" stroke="#ff6d00" strokeWidth={2.5}
          />
          {/* Distribution DOWN */}
          <polyline
            points={toSVG(bearPath.slice(15))}
            fill="none" stroke="#ff1744" strokeWidth={2.5}
          />

          {/* Manipulation high label */}
          <line x1={608} y1={98} x2={640} y2={75} stroke="#ff6d00" strokeWidth={0.8} strokeDasharray="3 2" />
          <text x={600} y={70} fill="#ff6d00" fontSize={9} fontFamily="Rajdhani, sans-serif">Judas Swing — BSL Sweep</text>

          {/* BOS arrow down */}
          <line x1={628} y1={148} x2={628} y2={195} stroke="#ff1744" strokeWidth={1} strokeDasharray="3 2" />
          <polygon points="624,192 628,200 632,192" fill="#ff1744" />
          <text x={633} y={195} fill="#ff1744" fontSize={9} fontFamily="'Share Tech Mono', monospace">BOS ↓</text>

          {/* Title */}
          <text x={20} y={325} fill="#546e7a" fontSize={9} fontFamily="Rajdhani, sans-serif">
            AMD = Acumulación (Asia) → Manipulación (Pre-London) → Distribución (London/NY) — Horario Guayaquil GMT-5
          </text>
        </svg>
      </div>

      {/* Session times table */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 14 }}>
        {[
          { phase: "A — Acumulación", color: "#7c4dff", time: "6PM – 3AM GYE", session: "Sesión Asiática", desc: "Rango estrecho, poca dirección. Los institucionales construyen posiciones silenciosamente." },
          { phase: "M — Manipulación", color: "#ff6d00", time: "1AM – 4AM GYE", session: "Pre-London", desc: "Judas Swing: movimiento falso que caza stops. En alcista barre SSL. En bajista barre BSL." },
          { phase: "D — Distribución", color: "#00e676", time: "3AM – 5PM GYE", session: "London + New York", desc: "Movimiento real y sostenido. Alta volatilidad. Aquí se gana el dinero siguiendo el impulso." },
        ].map(p => (
          <div key={p.phase} style={{
            background: "var(--bg3)", border: `1px solid ${p.color}44`,
            borderLeft: `3px solid ${p.color}`, padding: "10px 12px",
          }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: p.color, marginBottom: 3 }}>{p.phase}</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#546e7a", marginBottom: 5 }}>{p.time} · {p.session}</div>
            <div style={{ fontSize: 12, color: "#7a8fa0", lineHeight: 1.6 }}>{p.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
