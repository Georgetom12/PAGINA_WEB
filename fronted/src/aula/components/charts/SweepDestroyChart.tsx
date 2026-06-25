import React from "react";

export function SweepDestroyChart() {
  const W = 720;
  const H = 360;

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 380 }}>

          {/* Grid */}
          {[60, 120, 180, 240, 300].map(yy => (
            <line key={yy} x1={0} y1={yy} x2={W} y2={yy} stroke="#1a2535" strokeWidth={0.5} />
          ))}

          {/* ─── SECTION 1: Sweep & Destroy Alcista (SSL Sweep → Long) ─── */}
          <text x={20} y={18} fill="#00e5ff" fontSize={11} fontFamily="'Share Tech Mono', monospace" letterSpacing={2}>
            SWEEP &amp; DESTROY — ALCISTA (SSL SWEEP)
          </text>

          {/* SSL zone */}
          <rect x={20} y={220} width={350} height={18} fill="#ff174415" stroke="#ff174433" strokeWidth={0.5} />
          <text x={22} y={232} fill="#ff1744" fontSize={9} fontFamily="'Share Tech Mono', monospace">SSL — Sell Side Liquidity (stops de longs aquí)</text>

          {/* Price approach from above */}
          {/* Candles before sweep: downtrend approaching SSL */}
          {[
            { x: 30, o: 180, h: 185, l: 160, c: 163 },
            { x: 55, o: 163, h: 168, l: 148, c: 152 },
            { x: 80, o: 152, h: 157, l: 138, c: 142 },
          ].map((cv, i) => {
            const scaleY = (v: number) => v; // y is already in SVG coords
            const col = cv.c < cv.o ? "#ff1744" : "#00e676";
            const bTop = Math.min(cv.o, cv.c);
            const bH = Math.abs(cv.o - cv.c) || 2;
            return (
              <g key={i}>
                <line x1={cv.x + 10} y1={cv.h} x2={cv.x + 10} y2={cv.l} stroke={col} strokeWidth={1.5} />
                <rect x={cv.x + 2} y={bTop} width={16} height={bH} fill={col} />
              </g>
            );
          })}

          {/* Sweep candle: long wick DOWN through SSL */}
          {/* body: 142-155, wick down to 235 */}
          <line x1={115} y1={132} x2={115} y2={240} stroke="#ff6d00" strokeWidth={2} />
          <rect x={107} y={132} width={16} height={22} fill="#ff6d00" />
          {/* SSL breach marker */}
          <text x={128} y={243} fill="#ff6d00" fontSize={9} fontFamily="Rajdhani, sans-serif">Wick barre SSL</text>

          {/* Displacement candle UP (the "Destroy") */}
          <line x1={140} y1={90} x2={140} y2={158} stroke="#00e676" strokeWidth={2} />
          <rect x={132} y={90} width={16} height={60} fill="#00e676" />

          {/* OB zone (last bearish candle before impulse) */}
          <rect x={100} y={130} width={24} height={28} fill="none" stroke="#ffd700" strokeWidth={1} strokeDasharray="3 2" />
          <text x={100} y={125} fill="#ffd700" fontSize={9} fontFamily="'Share Tech Mono', monospace">OB ↑</text>

          {/* FVG between sweep candle and distribution */}
          <rect x={125} y={105} width={30} height={30} fill="#00e5ff12" stroke="#00e5ff44" strokeWidth={0.8} />
          <text x={126} y={101} fill="#00e5ff" fontSize={9} fontFamily="'Share Tech Mono', monospace">FVG</text>

          {/* Continuation candles */}
          {[
            { x: 158, o: 115, h: 118, l: 78, c: 82 },
            { x: 183, o: 85, h: 88, l: 55, c: 60 },
          ].map((cv, i) => {
            const col = cv.c < cv.o ? "#ff1744" : "#00e676";
            const bTop = Math.min(cv.o, cv.c);
            const bH = Math.abs(cv.o - cv.c) || 2;
            return (
              <g key={i}>
                <line x1={cv.x + 10} y1={cv.h} x2={cv.x + 10} y2={cv.l} stroke={col} strokeWidth={1.5} />
                <rect x={cv.x + 2} y={bTop} width={16} height={bH} fill={col} />
              </g>
            );
          })}

          {/* BOS label */}
          <line x1={140} y1={100} x2={210} y2={100} stroke="#00e67644" strokeWidth={0.8} strokeDasharray="3 2" />
          <text x={145} y={97} fill="#00e676" fontSize={9} fontFamily="'Share Tech Mono', monospace">BOS ↑</text>

          {/* TP arrow */}
          <line x1={200} y1={60} x2={200} y2={35} stroke="#00e676" strokeWidth={2} />
          <polygon points="196,38 200,28 204,38" fill="#00e676" />
          <text x={205} y={42} fill="#00e676" fontSize={9} fontFamily="Rajdhani, sans-serif">TP (BSL)</text>

          {/* SL marker */}
          <line x1={102} y1={245} x2={145} y2={245} stroke="#ff1744" strokeWidth={0.8} strokeDasharray="3 2" />
          <text x={147} y={249} fill="#ff1744" fontSize={8} fontFamily="Rajdhani, sans-serif">SL bajo OB</text>

          {/* Step labels */}
          {[
            { x: 25, y: 290, color: "#546e7a", text: "① Precio baja hacia SSL" },
            { x: 95, y: 290, color: "#ff6d00", text: "② Sweep (wick barre SSL)" },
            { x: 135, y: 305, color: "#00e676", text: "③ Displacement ↑ (OB+FVG)" },
            { x: 160, y: 320, color: "#00e5ff", text: "④ Entrada long / BOS ↑" },
            { x: 185, y: 335, color: "#ffd700", text: "⑤ TP en BSL arriba" },
          ].map((l, i) => (
            <text key={i} x={l.x} y={l.y} fill={l.color} fontSize={9} fontFamily="Rajdhani, sans-serif">{l.text}</text>
          ))}

          {/* Divider */}
          <line x1={370} y1={20} x2={370} y2={H - 10} stroke="#1a2535" strokeWidth={1.5} />

          {/* ─── SECTION 2: Sweep & Destroy Bajista (BSL Sweep → Short) ─── */}
          <text x={385} y={18} fill="#ff1744" fontSize={11} fontFamily="'Share Tech Mono', monospace" letterSpacing={2}>
            SWEEP &amp; DESTROY — BAJISTA (BSL SWEEP)
          </text>

          {/* BSL zone */}
          <rect x={380} y={100} width={330} height={18} fill="#00e67615" stroke="#00e67633" strokeWidth={0.5} />
          <text x={382} y={112} fill="#00e676" fontSize={9} fontFamily="'Share Tech Mono', monospace">BSL — Buy Side Liquidity (stops de shorts aquí)</text>

          {/* Approach candles (uptrend) */}
          {[
            { x: 388, o: 195, h: 192, l: 215, c: 196 },
            { x: 413, o: 175, h: 170, l: 195, c: 175 },
            { x: 438, o: 155, h: 148, l: 172, c: 152 },
          ].map((cv, i) => {
            const col = cv.c < cv.o ? "#00e676" : "#ff1744";
            const bTop = Math.min(cv.o, cv.c);
            const bH = Math.abs(cv.o - cv.c) || 2;
            return (
              <g key={i}>
                <line x1={cv.x + 10} y1={cv.h} x2={cv.x + 10} y2={cv.l} stroke={col} strokeWidth={1.5} />
                <rect x={cv.x + 2} y={bTop} width={16} height={bH} fill={col} />
              </g>
            );
          })}

          {/* Sweep candle: long wick UP through BSL */}
          <line x1={473} y1={72} x2={473} y2={175} stroke="#ff6d00" strokeWidth={2} />
          <rect x={465} y={150} width={16} height={22} fill="#ff6d00" />
          <text x={487} y={78} fill="#ff6d00" fontSize={9} fontFamily="Rajdhani, sans-serif">Wick barre BSL</text>

          {/* Displacement candle DOWN */}
          <line x1={498} y1={140} x2={498} y2={230} stroke="#ff1744" strokeWidth={2} />
          <rect x={490} y={140} width={16} height={75} fill="#ff1744" />

          {/* OB zone (last bullish candle before impulse) */}
          <rect x={458} y={142} width={24} height={28} fill="none" stroke="#ffd700" strokeWidth={1} strokeDasharray="3 2" />
          <text x={458} y={138} fill="#ffd700" fontSize={9} fontFamily="'Share Tech Mono', monospace">OB ↓</text>

          {/* FVG bearish */}
          <rect x={483} y={145} width={30} height={28} fill="#ff174412" stroke="#ff174444" strokeWidth={0.8} />
          <text x={484} y={141} fill="#ff1744" fontSize={9} fontFamily="'Share Tech Mono', monospace">FVG</text>

          {/* Continuation candles DOWN */}
          {[
            { x: 517, o: 205, h: 202, l: 235, c: 230 },
            { x: 542, o: 225, h: 222, l: 262, c: 258 },
          ].map((cv, i) => {
            const col = cv.c > cv.o ? "#ff1744" : "#00e676";
            const bTop = Math.min(cv.o, cv.c);
            const bH = Math.abs(cv.o - cv.c) || 2;
            return (
              <g key={i}>
                <line x1={cv.x + 10} y1={cv.h} x2={cv.x + 10} y2={cv.l} stroke={col} strokeWidth={1.5} />
                <rect x={cv.x + 2} y={bTop} width={16} height={bH} fill={col} />
              </g>
            );
          })}

          {/* BOS ↓ */}
          <line x1={498} y1={220} x2={570} y2={220} stroke="#ff174444" strokeWidth={0.8} strokeDasharray="3 2" />
          <text x={502} y={217} fill="#ff1744" fontSize={9} fontFamily="'Share Tech Mono', monospace">BOS ↓</text>

          {/* TP arrow down */}
          <line x1={562} y1={260} x2={562} y2={300} stroke="#ff1744" strokeWidth={2} />
          <polygon points="558,297 562,307 566,297" fill="#ff1744" />
          <text x={568} y={298} fill="#ff1744" fontSize={9} fontFamily="Rajdhani, sans-serif">TP (SSL)</text>

          {/* SL */}
          <line x1={460} y1={70} x2={505} y2={70} stroke="#00e676" strokeWidth={0.8} strokeDasharray="3 2" />
          <text x={507} y={74} fill="#00e676" fontSize={8} fontFamily="Rajdhani, sans-serif">SL sobre OB</text>

          {/* Title label bottom */}
          <text x={385} y={350} fill="#546e7a" fontSize={9} fontFamily="Rajdhani, sans-serif">
            Secuencia: Approach → Liquidity Sweep → Displacement → Entrada → BOS → TP
          </text>
        </svg>
      </div>

      {/* Key rules */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginTop: 14 }}>
        {[
          { color: "#7c4dff", label: "① IDENTIFY", title: "Identificar la zona", body: "Busca zonas BSL (sobre máximos) o SSL (bajo mínimos) con múltiples stops acumulados: EQH, EQL, PDH, PDL, PWH, PWL." },
          { color: "#ff6d00", label: "② SWEEP", title: "Esperar el barrido", body: "El precio penetra la zona con una mecha. Espera que la vela CIERRE de vuelta dentro del rango — no que solo toque el nivel." },
          { color: "#00e676", label: "③ DESTROY", title: "Confirmar el Destroy", body: "Vela de Displacement fuerte en sentido contrario. Deja OB y FVG. El 'destroy' confirma que los stops fueron cazados y el movimiento real comienza." },
          { color: "#ffd700", label: "④ ENTRY", title: "Entrada en retroceso", body: "Entra en el retorno al OB o FVG dejado por el Displacement. SL bajo/sobre la zona barrida. TP en la siguiente zona de liquidez." },
        ].map(s => (
          <div key={s.label} style={{
            background: "var(--bg3)", border: `1px solid ${s.color}44`,
            borderLeft: `3px solid ${s.color}`, padding: "10px 12px",
          }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: s.color, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: "var(--text)", marginBottom: 4 }}>{s.title}</div>
            <div style={{ fontSize: 12, color: "#7a8fa0", lineHeight: 1.6 }}>{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
