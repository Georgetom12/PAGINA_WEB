import React from "react";

export function CRTChart() {
  const W = 680;
  const H = 320;

  // CRT = Candle Range Theory
  // A single candle (or 3-candle sequence) maps to AMD phases
  // Zone colors
  const acc = "#7c4dff44";
  const manip = "#ff6d0044";
  const dist = "#00e67644";

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 340 }}>
          {/* Grid lines */}
          {[50, 100, 150, 200, 250, 300].map(yy => (
            <line key={yy} x1={0} y1={yy} x2={W} y2={yy} stroke="#1a2535" strokeWidth={0.5} />
          ))}
          {[80, 160, 240, 320, 400, 480, 560].map(xx => (
            <line key={xx} x1={xx} y1={0} x2={xx} y2={H} stroke="#1a2535" strokeWidth={0.5} />
          ))}

          {/* ═══════════ PART 1: Single CRT candle anatomy ═══════════ */}
          {/* The big "CRT candle" */}
          {/* Zones stacked: Lower third = SSL (Accum zone) / Middle = Manipulation / Upper third = BSL (Dist zone) */}
          {/* Candle: open at ~40% up, close at ~75%, with wick to bottom (~8%) and top (~92%) */}

          {/* Zone labels (right margin) */}
          {/* Lower accumulation band */}
          <rect x={60} y={220} width={100} height={60} fill={acc} rx={2} />
          <rect x={60} y={138} width={100} height={82} fill={manip} rx={2} />
          <rect x={60} y={50} width={100} height={88} fill={dist} rx={2} />

          {/* Big CRT candle */}
          {/* wick line */}
          <line x1={110} y1={22} x2={110} y2={290} stroke="#aaa" strokeWidth={2} />
          {/* body: open ~220, close ~80 = bullish big candle */}
          <rect x={94} y={80} width={32} height={140} fill="#00e676" rx={1} />
          {/* zone dividers on candle */}
          <line x1={60} y1={138} x2={160} y2={138} stroke="#ff6d00" strokeWidth={1} strokeDasharray="4 3" />
          <line x1={60} y1={220} x2={160} y2={220} stroke="#7c4dff" strokeWidth={1} strokeDasharray="4 3" />

          {/* Zone labels */}
          <text x={168} y={45} fill="#00e676" fontSize={11} fontFamily="'Share Tech Mono', monospace">BSL</text>
          <text x={168} y={60} fill="#7a8fa0" fontSize={9} fontFamily="Rajdhani, sans-serif">Buy Side Liq.</text>
          <text x={168} y={80} fill="#00e676" fontSize={9} fontFamily="Rajdhani, sans-serif">DISTRIBUCIÓN</text>

          <text x={168} y={150} fill="#ff6d00" fontSize={11} fontFamily="'Share Tech Mono', monospace">CUERPO</text>
          <text x={168} y={165} fill="#7a8fa0" fontSize={9} fontFamily="Rajdhani, sans-serif">Rango principal</text>
          <text x={168} y={180} fill="#ff6d00" fontSize={9} fontFamily="Rajdhani, sans-serif">MANIPULACIÓN</text>

          <text x={168} y={240} fill="#7c4dff" fontSize={11} fontFamily="'Share Tech Mono', monospace">SSL</text>
          <text x={168} y={255} fill="#7a8fa0" fontSize={9} fontFamily="Rajdhani, sans-serif">Sell Side Liq.</text>
          <text x={168} y={270} fill="#7c4dff" fontSize={9} fontFamily="Rajdhani, sans-serif">ACUMULACIÓN</text>

          {/* ═══════════ PART 2: CRT 3-candle sequence ═══════════ */}
          {/* Label "CRT 3-velas" */}
          <text x={290} y={25} fill="#00e5ff" fontSize={12} fontFamily="'Share Tech Mono', monospace" letterSpacing={2}>
            CRT — SECUENCIA 3 VELAS
          </text>

          {/* Background zones for 3-candle CRT */}
          {/* Candle 1: Range candle — defines the range */}
          {/* Candle 2: Manipulation — wick below the range (SSL sweep) */}
          {/* Candle 3: Distribution — impulse above the range (BSL target) */}

          {/* Range box */}
          <rect x={280} y={110} width={90} height={130} fill="#ffffff08" stroke="#ffffff22" strokeWidth={1} rx={2} />
          <text x={287} y={106} fill="#546e7a" fontSize={9} fontFamily="'Share Tech Mono', monospace">RANGO</text>

          {/* Candle 1 — Range (neutral spinning top) */}
          <line x1={320} y1={100} x2={320} y2={248} stroke="#aaa" strokeWidth={1.5} />
          <rect x={308} y={130} width={24} height={80} fill="#546e7a" rx={1} />
          <text x={308} y={272} fill="#546e7a" fontSize={9} fontFamily="Rajdhani" textAnchor="middle">①</text>
          <text x={320} y={272} fill="#546e7a" fontSize={9} fontFamily="Rajdhani" textAnchor="middle">Rango</text>

          {/* Candle 2 — Manipulation (long wick down = SSL sweep) */}
          <line x1={370} y1={118} x2={370} y2={290} stroke="#ff6d00" strokeWidth={1.5} />
          <rect x={358} y={135} width={24} height={55} fill="#ff6d00" rx={1} />
          {/* SSL sweep arrow */}
          <line x1={245} y1={240} x2={390} y2={240} stroke="#ff6d0055" strokeWidth={1} strokeDasharray="4 3" />
          <text x={248} y={237} fill="#ff6d00" fontSize={9} fontFamily="'Share Tech Mono', monospace">SSL</text>
          <text x={358} y={272} fill="#ff6d00" fontSize={9} fontFamily="Rajdhani" textAnchor="middle">②</text>
          <text x={370} y={272} fill="#ff6d00" fontSize={9} fontFamily="Rajdhani" textAnchor="middle">Manipul.</text>

          {/* Candle 3 — Distribution (impulse up) */}
          <line x1={420} y1={85} x2={420} y2={195} stroke="#00e676" strokeWidth={1.5} />
          <rect x={408} y={90} width={24} height={90} fill="#00e676" rx={1} />
          {/* BSL target */}
          <line x1={245} y1={108} x2={450} y2={108} stroke="#00e67655" strokeWidth={1} strokeDasharray="4 3" />
          <text x={248} y={105} fill="#00e676" fontSize={9} fontFamily="'Share Tech Mono', monospace">BSL</text>
          <text x={408} y={272} fill="#00e676" fontSize={9} fontFamily="Rajdhani" textAnchor="middle">③</text>
          <text x={420} y={272} fill="#00e676" fontSize={9} fontFamily="Rajdhani" textAnchor="middle">Distribuc.</text>

          {/* Arrow showing the real direction */}
          <line x1={445} y1={175} x2={445} y2={100} stroke="#00e676" strokeWidth={2} markerEnd="url(#arrowUp)" />
          <defs>
            <marker id="arrowUp" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
              <path d="M2,7 L4,1 L6,7" fill="none" stroke="#00e676" strokeWidth={1.5} />
            </marker>
            <marker id="arrowDown" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse">
              <path d="M2,1 L4,7 L6,1" fill="none" stroke="#ff1744" strokeWidth={1.5} />
            </marker>
          </defs>

          {/* ═══════════ PART 3: CRT Bearish ═══════════ */}
          {/* Label */}
          <text x={490} y={25} fill="#ff1744" fontSize={10} fontFamily="'Share Tech Mono', monospace" letterSpacing={1}>
            CRT BAJISTA
          </text>

          {/* Candle B1 — Range */}
          <line x1={510} y1={90} x2={510} y2={235} stroke="#aaa" strokeWidth={1.5} />
          <rect x={498} y={115} width={24} height={75} fill="#546e7a" rx={1} />

          {/* Candle B2 — Manipulation UP (BSL sweep) */}
          <line x1={558} y1={48} x2={558} y2={200} stroke="#ff6d00" strokeWidth={1.5} />
          <rect x={546} y={130} width={24} height={60} fill="#ff6d00" rx={1} />
          <line x1={475} y1={62} x2={590} y2={62} stroke="#ff6d0055" strokeWidth={1} strokeDasharray="4 3" />
          <text x={478} y={59} fill="#ff6d00" fontSize={9} fontFamily="'Share Tech Mono', monospace">BSL</text>

          {/* Candle B3 — Distribution DOWN */}
          <line x1={606} y1={140} x2={606} y2={288} stroke="#ff1744" strokeWidth={1.5} />
          <rect x={594} y={195} width={24} height={90} fill="#ff1744" rx={1} />
          <line x1={475} y1={227} x2={640} y2={227} stroke="#ff174455" strokeWidth={1} strokeDasharray="4 3" />
          <text x={478} y={224} fill="#ff1744" fontSize={9} fontFamily="'Share Tech Mono', monospace">SSL</text>

          {/* Arrow down */}
          <line x1={650} y1={170} x2={650} y2={255} stroke="#ff1744" strokeWidth={2} />
          <polygon points="645,252 650,262 655,252" fill="#ff1744" />

          {/* Labels B1 B2 B3 */}
          {[510, 558, 606].map((xx, i) => (
            <text key={i} x={xx} y={298} fill="#546e7a" fontSize={9} fontFamily="Rajdhani" textAnchor="middle">
              {["① Rango", "② Man.", "③ Dist."][i]}
            </text>
          ))}

          {/* ═══════════ Title ═══════════ */}
          <text x={20} y={18} fill="#00e5ff" fontSize={12} fontFamily="'Share Tech Mono', monospace" letterSpacing={2}>
            CRT — CANDLE RANGE THEORY
          </text>
          <text x={20} y={310} fill="#546e7a" fontSize={9} fontFamily="Rajdhani, sans-serif">
            Cada vela contiene su propio ciclo AMD — Acumulación → Manipulación → Distribución
          </text>
        </svg>
      </div>

      {/* Steps explanation */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginTop: 14 }}>
        {[
          { step: "01", color: "#546e7a", title: "Vela de Rango", body: "Define el rango. Cuerpo mediano, mechas moderadas. El mercado está equilibrando. Alta y baja = referencia del CRT." },
          { step: "02", color: "#ff6d00", title: "Vela de Manipulación", body: "Barre la liquidez fuera del rango — SSL (mecha abajo) o BSL (mecha arriba). Caza stops. Judas Swing en esta vela." },
          { step: "03", color: "#00e676", title: "Vela de Distribución", body: "Impulso real en la dirección opuesta a la manipulación. Alta probabilidad. Busca entrada en FVG/OB de esta vela." },
        ].map(s => (
          <div key={s.step} style={{
            background: "var(--bg3)", border: `1px solid ${s.color}44`,
            borderLeft: `3px solid ${s.color}`, padding: "10px 12px",
          }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: s.color, marginBottom: 4 }}>
              PASO {s.step} — {s.title.toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: "#7a8fa0", lineHeight: 1.6 }}>{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
