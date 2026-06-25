import React, { useState } from "react";

const Mono = "'Share Tech Mono', monospace";
const Sans = "'Rajdhani', sans-serif";
const Orb  = "'Orbitron', monospace";
const BG   = "#0a0f18";

type View = "bullish-ob" | "bearish-ob" | "fvg" | "breaker";

const VIEWS: [View, string][] = [
  ["bullish-ob", "🟢 Bullish OB"],
  ["bearish-ob", "🔴 Bearish OB"],
  ["fvg",        "⬜ FVG / Imbalance"],
  ["breaker",    "🔄 Breaker Block"],
];

const W = 700, H = 320;

function candle(x:number,o:number,h:number,l:number,c:number,color:string,w=28) {
  const bull = c >= o;
  const body_top    = bull ? c : o;
  const body_bottom = bull ? o : c;
  return <g>
    <line x1={x+w/2} y1={h} x2={x+w/2} y2={l} stroke={color} strokeWidth={1.5}/>
    <rect x={x} y={body_top} width={w} height={Math.max(2,body_bottom-body_top)}
      fill={bull ? color+"33" : color+"55"} stroke={color} strokeWidth={1.5}/>
  </g>;
}
function hline(y:number,x1:number,x2:number,color:string,dash="5 3",w=1) {
  return <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={w} strokeDasharray={dash}/>;
}
function lbl(x:number,y:number,t:string,c:string,size=9,anchor:"middle"|"start"|"end"="middle") {
  return <text x={x} y={y} fill={c} fontSize={size} fontFamily={Mono} textAnchor={anchor}>{t}</text>;
}
function zone(x:number,y:number,w:number,h:number,color:string,label:string) {
  return <g>
    <rect x={x} y={y} width={w} height={h} fill={color+"22"} stroke={color} strokeWidth={1} strokeDasharray="4 3"/>
    <text x={x+w/2} y={y+h/2+4} fill={color} fontSize={8} fontFamily={Mono} textAnchor="middle">{label}</text>
  </g>;
}

function BullishOB() {
  return <g>
    {lbl(W/2, 22, "BULLISH ORDER BLOCK — FORMACIÓN Y RETEST", "#00e676", 11)}
    {lbl(W/2, 38, "Última vela roja ANTES del impulso alcista que rompe estructura", "#546e7a", 8)}

    {/* Pre-trend downmove */}
    {candle(25, 120, 95, 145, 130, "#ff1744")}
    {candle(62, 130, 105, 155, 138, "#ff1744")}
    {candle(99, 138, 112, 158, 148, "#ff1744")}
    {candle(136, 142, 118, 162, 155, "#ff1744")}

    {/* THE ORDER BLOCK (last red before impulse) */}
    <rect x={168} y={155} width={36} height={50} fill="#ff174444" stroke="#ff1744" strokeWidth={2.5}/>
    <line x1={186} y1={155} x2={186} y2={138} stroke="#ff1744" strokeWidth={2}/>
    <line x1={186} y1={205} x2={186} y2={218} stroke="#ff1744" strokeWidth={2}/>
    {lbl(186, 130, "OB", "#ff1744", 11)}
    {lbl(186, 282, "BULLISH OB", "#ff174499", 8)}

    {/* OB zone highlight */}
    {zone(168, 155, 36, 50, "#00e676", "")}

    {/* Displacement candles (impulse up — BOS) */}
    {candle(212, 205, 155, 215, 148, "#00e676")}
    {candle(249, 148, 105, 158, 110, "#00e676")}
    {candle(286, 110, 68,  120,  72, "#00e676", 30)}

    {/* BOS line */}
    {hline(142, 160, 400, "#00e67699", "6 3", 1.5)}
    {lbl(405, 145, "BOS ↑", "#00e676", 9, "start")}

    {/* FVG zone between impulse candles */}
    {zone(214, 148, 82, 55, "#00e5ff", "FVG")}

    {/* Pullback to OB (retest) */}
    {candle(332, 72, 55, 82, 62, "#ff1744", 26)}
    {candle(365, 62, 50, 68, 54, "#ff1744", 26)}
    {candle(398, 54, 48, 58, 56, "#00e676", 26)} {/* Entry candle */}

    {/* OB zone extended */}
    {hline(155, 168, 450, "#00e67644", "4 3")}
    {hline(205, 168, 450, "#00e67644", "4 3")}
    <rect x={168} y={155} width={285} height={50} fill="#00e67608" stroke="none"/>

    {/* Entry marker */}
    {lbl(414, 40, "ENTRY", "#00e676", 9)}
    <line x1={414} y1={44} x2={414} y2={56} stroke="#00e676" strokeWidth={1.5}/>
    <polygon points={`414,58 409,50 419,50`} fill="#00e676"/>

    {/* SL */}
    {hline(218, 380, 470, "#ffd70099", "4 3")}
    {lbl(472, 221, "SL", "#ffd700", 9, "start")}

    {/* TP */}
    {candle(432, 56, 35, 60, 40, "#00e676", 26)}
    {candle(465, 40, 18, 46, 22, "#00e676", 26)}
    {hline(22, 430, 510, "#00e67699", "3 2")}
    {lbl(512, 25, "TP", "#00e676", 9, "start")}

    {/* Legend */}
    {lbl(10, H-4, "Regla: el OB es más válido si causó un BOS + dejó FVG + está en zona Discount (61.8-78.6% Fibonacci). Retest = entrada.",
      "#546e7a", 8, "start")}
  </g>;
}

function BearishOB() {
  return <g>
    {lbl(W/2, 22, "BEARISH ORDER BLOCK — FORMACIÓN Y RETEST", "#ff1744", 11)}
    {lbl(W/2, 38, "Última vela verde ANTES del impulso bajista que rompe estructura", "#546e7a", 8)}

    {/* Pre-trend upmove */}
    {candle(25, 235, 195, 248, 215, "#00e676")}
    {candle(62, 215, 180, 228, 192, "#00e676")}
    {candle(99, 192, 158, 205, 168, "#00e676")}
    {candle(136, 168, 135, 182, 145, "#00e676")}

    {/* THE ORDER BLOCK (last green before drop) */}
    <rect x={168} y={95} width={36} height={50} fill="#00e67644" stroke="#00e676" strokeWidth={2.5}/>
    <line x1={186} y1={95} x2={186} y2={80} stroke="#00e676" strokeWidth={2}/>
    <line x1={186} y1={145} x2={186} y2={162} stroke="#00e676" strokeWidth={2}/>
    {lbl(186, 72, "OB", "#00e676", 11)}
    {lbl(186, 288, "BEARISH OB", "#ff174499", 8)}

    {/* OB zone highlight */}
    {zone(168, 95, 36, 50, "#ff1744", "")}

    {/* Displacement candles (impulse down — BOS) */}
    {candle(212, 95, 100, 158, 148, "#ff1744")}
    {candle(249, 148, 155, 210, 202, "#ff1744")}
    {candle(286, 202, 208, 258, 250, "#ff1744", 30)}

    {/* BOS line */}
    {hline(145, 160, 400, "#ff174499", "6 3", 1.5)}
    {lbl(405, 148, "BOS ↓", "#ff1744", 9, "start")}

    {/* FVG zone */}
    {zone(214, 100, 82, 48, "#00e5ff", "FVG")}

    {/* Pullback to OB */}
    {candle(332, 250, 238, 260, 248, "#00e676", 26)}
    {candle(365, 248, 238, 254, 242, "#00e676", 26)}
    {candle(398, 242, 232, 248, 244, "#ff1744", 26)}

    {/* OB zone extended */}
    {hline(95,  168, 450, "#ff174444", "4 3")}
    {hline(145, 168, 450, "#ff174444", "4 3")}
    <rect x={168} y={95} width={285} height={50} fill="#ff174408" stroke="none"/>

    {/* Entry marker */}
    {lbl(414, 290, "ENTRY", "#ff1744", 9)}
    <line x1={414} y1={286} x2={414} y2={252} stroke="#ff1744" strokeWidth={1.5}/>
    <polygon points={`414,250 409,258 419,258`} fill="#ff1744"/>

    {/* SL */}
    {hline(80, 380, 470, "#ffd70099", "4 3")}
    {lbl(472, 83, "SL", "#ffd700", 9, "start")}

    {/* TP */}
    {candle(432, 244, 250, 275, 265, "#ff1744", 26)}
    {candle(465, 265, 272, 298, 292, "#ff1744", 26)}
    {hline(292, 430, 510, "#ff174499", "3 2")}
    {lbl(512, 295, "TP", "#ff1744", 9, "start")}

    {lbl(10, H-4, "Regla: el precio SIEMPRE regresa a las zonas donde quedaron órdenes pendientes. El OB bajista = zona de distribución institucional.",
      "#546e7a", 8, "start")}
  </g>;
}

function FVGView() {
  return <g>
    {lbl(W/2, 22, "FVG — FAIR VALUE GAP (IMBALANCE DE 3 VELAS)", "#00e5ff", 11)}
    {lbl(W/2, 38, "El gap entre el wick de V1 y el wick de V3 que no fue negociado = zona magnética", "#546e7a", 8)}

    {/* ── Bullish FVG ── */}
    <rect x={0} y={48} width={340} height={272} fill="#0a0f1855" stroke="#00e67644" strokeWidth={1} rx={3}/>
    {lbl(170, 64, "BULLISH FVG", "#00e676", 10)}

    {/* V1 - bearish */}
    {candle(50, 165, 140, 178, 152, "#ff1744", 38)}
    {lbl(69, 200, "V1", "#546e7a", 9)}
    {/* V2 - big bullish displacement */}
    {candle(98, 175, 92, 182, 98, "#00e676", 38)}
    {lbl(117, 200, "V2", "#00e676", 9)}
    {/* V3 - bullish continuation */}
    {candle(146, 98, 72, 105, 78, "#00e676", 38)}
    {lbl(165, 200, "V3", "#546e7a", 9)}

    {/* FVG zone = wick_top of V1 to wick_bottom of V3 */}
    {zone(98, 105, 86, 47, "#00e5ff", "FVG / IMBALANCE")}
    {hline(105, 95, 265, "#00e5ff66", "4 3")}
    {hline(152, 95, 265, "#00e5ff66", "4 3")}
    {lbl(270, 109, "Top FVG = wick bajo V3", "#00e5ff", 7, "start")}
    {lbl(270, 155, "Bot FVG = wick alto V1", "#00e5ff", 7, "start")}

    {/* Pullback fills FVG */}
    {candle(200, 78, 68, 85, 72, "#ff1744", 30)}
    {candle(237, 72, 62, 80, 66, "#ff1744", 30)}
    {candle(270, 66, 58, 70, 62, "#00e676", 30)}
    {lbl(252, 55, "ENTRY (relleno FVG)", "#00e676", 8)}

    {/* ── Bearish FVG ── */}
    <rect x={350} y={48} width={340} height={272} fill="#0a0f1855" stroke="#ff174444" strokeWidth={1} rx={3}/>
    {lbl(520, 64, "BEARISH FVG", "#ff1744", 10)}

    {/* V1 - bullish */}
    {candle(400, 155, 132, 162, 138, "#00e676", 38)}
    {lbl(419, 200, "V1", "#546e7a", 9)}
    {/* V2 - big bearish displacement */}
    {candle(448, 132, 128, 172, 162, "#ff1744", 38)}
    {lbl(467, 200, "V2", "#ff1744", 9)}
    {/* V3 - bearish continuation */}
    {candle(496, 162, 158, 195, 188, "#ff1744", 38)}
    {lbl(515, 200, "V3", "#546e7a", 9)}

    {/* FVG zone = wick_bottom of V1 to wick_top of V3 */}
    {zone(448, 138, 86, 24, "#00e5ff", "FVG")}
    {hline(138, 445, 615, "#00e5ff66", "4 3")}
    {hline(162, 445, 615, "#00e5ff66", "4 3")}
    {lbl(617, 141, "Bot FVG = wick alto V3", "#00e5ff", 7, "start")}
    {lbl(617, 164, "Top FVG = wick bajo V1", "#00e5ff", 7, "start")}

    {/* Pullback fills FVG */}
    {candle(548, 188, 178, 196, 183, "#00e676", 30)}
    {candle(585, 183, 160, 190, 165, "#00e676", 30)}
    {candle(618, 165, 150, 170, 162, "#ff1744", 30)}
    {lbl(600, 290, "ENTRY (relleno FVG)", "#ff1744", 8)}

    {lbl(10, H-4,
      "FVG = zona de ineficiencia de precio. El mercado tiende a regresar a rellenar estos gaps antes de continuar. En SMC: el FVG dentro de un OB = confluencia máxima.",
      "#546e7a", 8, "start")}
  </g>;
}

function BreakerView() {
  return <g>
    {lbl(W/2, 22, "BREAKER BLOCK — OB FALLIDO QUE SE CONVIERTE EN SU OPUESTO", "#e040fb", 11)}
    {lbl(W/2, 38, "Cuando el precio toca un OB y lo ROMPE en lugar de rebotar, el OB falla y se convierte en Breaker", "#546e7a", 8)}

    {/* ── Initial setup ── */}
    {lbl(120, 65, "FASE 1: OB fallido", "#ffd700", 9)}

    {/* Bullish OB that fails */}
    <rect x={30} y={160} width={36} height={50} fill="#00e67622" stroke="#00e67666" strokeWidth={2} strokeDasharray="5 3"/>
    {lbl(48, 155, "OB ✗ FALLA", "#ff1744", 8)}
    {candle(30, 160, 140, 172, 148, "#ff1744", 36)}

    {/* price tests OB */}
    {candle(74, 148, 125, 160, 132, "#00e676", 30)}
    {candle(111, 132, 118, 138, 122, "#ff1744", 30)}
    {candle(148, 122, 110, 128, 114, "#ff1744", 30)}
    {candle(185, 114, 105, 120, 109, "#ff1744", 30)} {/* breaks OB */}

    {/* OB level */}
    {hline(160, 28, 310, "#00e67655", "4 3")}
    {hline(210, 28, 310, "#ff174455", "4 3")}
    {lbl(315, 163, "OB top", "#00e67699", 7, "start")}
    {lbl(315, 213, "OB bot = Breaker", "#e040fb", 7, "start")}

    {/* Arrow down breaking OB */}
    {candle(222, 109, 100, 218, 205, "#ff1744", 30)}
    {lbl(237, 92, "ROTURA", "#ff1744", 8)}
    {lbl(237, 102, "del OB", "#ff1744", 8)}

    {/* ── BREAKER BLOCK forms ── */}
    {lbl(430, 65, "FASE 2: Breaker activo", "#e040fb", 9)}

    {/* Breaker zone */}
    {zone(270, 160, 36, 50, "#e040fb", "BREAKER")}
    {lbl(288, 232, "BREAKER", "#e040fb", 8)}
    {lbl(288, 243, "zona de venta", "#546e7a", 7)}

    {/* More down move */}
    {candle(315, 205, 210, 225, 215, "#ff1744", 30)}
    {candle(352, 215, 220, 248, 242, "#ff1744", 30)}
    {candle(389, 242, 248, 270, 265, "#ff1744", 30)}

    {/* Pullback to Breaker = ENTRY SHORT */}
    {candle(432, 265, 258, 275, 260, "#00e676", 30)}
    {candle(469, 260, 238, 264, 242, "#00e676", 30)}
    {candle(506, 242, 208, 248, 213, "#00e676", 30)}
    {candle(543, 213, 190, 218, 196, "#ff1744", 30)}

    {/* Breaker zone extended */}
    {hline(160, 270, 600, "#e040fb44", "4 3")}
    {hline(210, 270, 600, "#e040fb44", "4 3")}
    <rect x={270} y={160} width={333} height={50} fill="#e040fb08" stroke="none"/>

    {/* Entry */}
    {lbl(558, 280, "ENTRY SHORT", "#e040fb", 9)}
    <line x1={558} y1={276} x2={558} y2={215} stroke="#e040fb" strokeWidth={1.5}/>
    <polygon points={`558,213 553,221 563,221`} fill="#e040fb"/>

    {/* SL */}
    {hline(150, 500, 620, "#ffd70099", "4 3")}
    {lbl(622, 153, "SL", "#ffd700", 9, "start")}

    {/* TP */}
    {lbl(10, H-4,
      "Breaker = el OB fallido se convierte en zona de reacción OPUESTA. Concepto de ICT. Una vez roto el OB alcista → se convierte en resistencia (Bearish Breaker). Entra en el retest.",
      "#546e7a", 8, "start")}
  </g>;
}

export function OrderBlockFVGChart() {
  const [view, setView] = useState<View>("bullish-ob");

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {VIEWS.map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            background: view === v ? "#00e5ff22" : "var(--bg3)",
            border: `1px solid ${view === v ? "#00e5ff" : "var(--border2)"}`,
            color: view === v ? "#00e5ff" : "var(--muted)",
            padding: "6px 14px", fontSize: 10,
            fontFamily: Mono, cursor: "pointer", letterSpacing: 0.8,
          }}>{label}</button>
        ))}
      </div>

      <div style={{ overflowX: "auto" }}>
        <svg width={W} height={H} style={{ background: BG, borderRadius: 4, display: "block", minWidth: 420 }}>
          {[80,160,240].map(y=><line key={y} x1={0} y1={y} x2={W} y2={y} stroke="#1a253533" strokeWidth={0.5}/>)}
          {view === "bullish-ob" && <BullishOB />}
          {view === "bearish-ob" && <BearishOB />}
          {view === "fvg"        && <FVGView />}
          {view === "breaker"    && <BreakerView />}
        </svg>
      </div>
    </div>
  );
}
