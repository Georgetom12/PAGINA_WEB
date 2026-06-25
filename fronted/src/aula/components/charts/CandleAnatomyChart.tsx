import React from "react";

const Mono  = "'Share Tech Mono', monospace";
const Sans  = "'Rajdhani', sans-serif";
const Orb   = "'Orbitron', monospace";
const BG    = "#0a0f18";

function arr(x1:number,y1:number,x2:number,y2:number,color:string,label?:string) {
  const angle = Math.atan2(y2-y1,x2-x1);
  const len = 7;
  const ax = x2 - len*Math.cos(angle-0.4);
  const ay = y2 - len*Math.sin(angle-0.4);
  const bx = x2 - len*Math.cos(angle+0.4);
  const by = y2 - len*Math.sin(angle+0.4);
  return <g>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.2} strokeDasharray="4 3"/>
    <polygon points={`${x2},${y2} ${ax},${ay} ${bx},${by}`} fill={color}/>
    {label && <text x={x1} y={y1-5} fill={color} fontSize={9} fontFamily={Mono} textAnchor="middle">{label}</text>}
  </g>;
}

export function CandleAnatomyChart() {
  const W = 700, H = 330;

  return (
    <div style={{ overflowX: "auto", marginBottom: 12 }}>
      <svg width={W} height={H} style={{ background: BG, borderRadius: 4, display: "block", minWidth: 420 }}>

        {/* ──── Grid ──── */}
        {[80,160,240].map(y => <line key={y} x1={0} y1={y} x2={W} y2={y} stroke="#1a253533" strokeWidth={0.5}/>)}

        {/* ──── Title ──── */}
        <text x={W/2} y={22} fill="#00e5ff" fontSize={12} fontFamily={Mono} textAnchor="middle" letterSpacing={2}>
          ANATOMÍA DE LA VELA JAPONESA
        </text>

        {/* ══════ BULLISH CANDLE (left) ══════ */}
        <text x={150} y={45} fill="#00e676" fontSize={10} fontFamily={Mono} textAnchor="middle">ALCISTA (VERDE)</text>
        <text x={150} y={57} fill="#546e7a" fontSize={8}  fontFamily={Sans} textAnchor="middle">Close &gt; Open</text>

        {/* candle body */}
        <rect x={127} y={115} width={46} height={100} fill="#00e67622" stroke="#00e676" strokeWidth={2}/>

        {/* upper wick */}
        <line x1={150} y1={115} x2={150} y2={68} stroke="#00e676" strokeWidth={2}/>
        {/* lower wick */}
        <line x1={150} y1={215} x2={150} y2={258} stroke="#00e676" strokeWidth={2}/>

        {/* HIGH label */}
        {arr(80,55,148,70,"#ffd700","HIGH")}
        <text x={38} y={52} fill="#ffd700" fontSize={8} fontFamily={Mono}>Máximo</text>
        <text x={38} y={62} fill="#546e7a" fontSize={7} fontFamily={Sans}>Resistencia puntual</text>

        {/* CLOSE label */}
        {arr(60,108,126,117,"#00e676","CLOSE")}
        <text x={15} y={104} fill="#00e676" fontSize={9} fontFamily={Mono} fontWeight="bold">CLOSE ★</text>
        <text x={15} y={114} fill="#546e7a" fontSize={7} fontFamily={Sans}>El más importante</text>

        {/* BODY label */}
        <text x={108} y={162} fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="end">CUERPO</text>
        <line x1={110} y1={160} x2={127} y2={165} stroke="#00e67699" strokeWidth={1}/>

        {/* OPEN label */}
        {arr(60,222,126,215,"#aaa","OPEN")}
        <text x={15} y={218} fill="#aaa" fontSize={9} fontFamily={Mono}>OPEN</text>
        <text x={15} y={228} fill="#546e7a" fontSize={7} fontFamily={Sans}>Precio de apertura</text>

        {/* LOW label */}
        {arr(80,272,148,258,"#ffd700","LOW")}
        <text x={38} y={268} fill="#ffd700" fontSize={8} fontFamily={Mono}>Mínimo</text>
        <text x={38} y={278} fill="#546e7a" fontSize={7} fontFamily={Sans}>Soporte puntual</text>

        {/* UPPER WICK label */}
        <text x={200} y={90} fill="#e040fb" fontSize={8} fontFamily={Mono}>MECHA SUPERIOR</text>
        <line x1={198} y1={92} x2={155} y2={90} stroke="#e040fb88" strokeWidth={1}/>
        <text x={200} y={101} fill="#546e7a" fontSize={7} fontFamily={Sans}>Rechazo de compradores</text>

        {/* LOWER WICK label */}
        <text x={200} y={242} fill="#ff9900" fontSize={8} fontFamily={Mono}>MECHA INFERIOR</text>
        <line x1={198} y1={244} x2={155} y2={240} stroke="#ff990088" strokeWidth={1}/>
        <text x={200} y={253} fill="#546e7a" fontSize={7} fontFamily={Sans}>Vendedores rechazados</text>

        {/* ══════ BEARISH CANDLE (center-right) ══════ */}
        <text x={440} y={45} fill="#ff1744" fontSize={10} fontFamily={Mono} textAnchor="middle">BAJISTA (ROJA)</text>
        <text x={440} y={57} fill="#546e7a" fontSize={8}  fontFamily={Sans} textAnchor="middle">Open &gt; Close</text>

        <rect x={417} y={115} width={46} height={100} fill="#ff174422" stroke="#ff1744" strokeWidth={2}/>
        <line x1={440} y1={115} x2={440} y2={68} stroke="#ff1744" strokeWidth={2}/>
        <line x1={440} y1={215} x2={440} y2={258} stroke="#ff1744" strokeWidth={2}/>

        {arr(365,55,438,70,"#ffd700")}
        <text x={323} y={52} fill="#ffd700" fontSize={8} fontFamily={Mono}>Máximo (High)</text>

        {arr(355,108,416,113,"#ff9900")}
        <text x={305} y={105} fill="#ff9900" fontSize={9} fontFamily={Mono} fontWeight="bold">OPEN ★</text>
        <text x={305} y={115} fill="#546e7a" fontSize={7} fontFamily={Sans}>Apertura = techo del cuerpo</text>

        <text x={400} y={162} fill="#ff1744" fontSize={8} fontFamily={Mono} textAnchor="end">CUERPO</text>
        <line x1={402} y1={160} x2={417} y2={165} stroke="#ff174499" strokeWidth={1}/>

        {arr(355,222,416,215,"#00e676")}
        <text x={305} y={218} fill="#00e676" fontSize={9} fontFamily={Mono} fontWeight="bold">CLOSE ★</text>
        <text x={305} y={228} fill="#546e7a" fontSize={7} fontFamily={Sans}>Cierre = piso del cuerpo</text>

        {arr(365,272,438,258,"#ffd700")}
        <text x={323} y={268} fill="#ffd700" fontSize={8} fontFamily={Mono}>Mínimo (Low)</text>

        {/* ══════ Candle TYPES mini-grid (right) ══════ */}
        <text x={610} y={45} fill="#00e5ff" fontSize={9} fontFamily={Mono} textAnchor="middle">TIPOS</text>

        {/* Hammer */}
        <rect x={573} y={110} width={16} height={20} fill="#00e67622" stroke="#00e676" strokeWidth={1.5}/>
        <line x1={581} y1={130} x2={581} y2={165} stroke="#00e676" strokeWidth={1.5}/>
        <text x={595} y={128} fill="#aaa" fontSize={7} fontFamily={Mono}>Hammer</text>
        <text x={595} y={137} fill="#546e7a" fontSize={6} fontFamily={Sans}>wick largo ↓</text>

        {/* Doji */}
        <rect x={573} y={190} width={16} height={3} fill="#ffd700" stroke="#ffd700" strokeWidth={1}/>
        <line x1={581} y1={170} x2={581} y2={193} stroke="#ffd700" strokeWidth={1.5}/>
        <line x1={581} y1={193} x2={581} y2={215} stroke="#ffd700" strokeWidth={1.5}/>
        <text x={595} y={188} fill="#ffd700" fontSize={7} fontFamily={Mono}>Doji</text>
        <text x={595} y={198} fill="#546e7a" fontSize={6} fontFamily={Sans}>Indecisión</text>

        {/* Shooting Star */}
        <rect x={573} y={250} width={16} height={18} fill="#ff174422" stroke="#ff1744" strokeWidth={1.5}/>
        <line x1={581} y1={250} x2={581} y2={215} stroke="#ff1744" strokeWidth={1.5}/>
        <line x1={581} y1={268} x2={581} y2={272} stroke="#ff1744" strokeWidth={1.5}/>
        <text x={595} y={248} fill="#ff1744" fontSize={7} fontFamily={Mono}>Shooting Star</text>
        <text x={595} y={258} fill="#546e7a" fontSize={6} fontFamily={Sans}>wick largo ↑</text>

        {/* Bottom legend */}
        <text x={W/2} y={H-6} fill="#546e7a" fontSize={8} fontFamily={Sans} textAnchor="middle">
          Regla: el CIERRE es el dato más importante. Un cierre fuerte en el extremo opuesto del wick = convicción. Un cierre en el medio = indecisión.
        </text>
      </svg>
    </div>
  );
}
