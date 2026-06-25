import React, { useState } from "react";

const Mono = "'Share Tech Mono', monospace";
const Sans = "'Rajdhani', sans-serif";
const Orb  = "'Orbitron', monospace";

type ViewType = "hch" | "doble" | "triple" | "taza" | "bandera" | "triangulo" | "cuna";

const VIEWS: [ViewType, string][] = [
  ["hch",       "👤 HCH"],
  ["doble",     "〽️ Doble Techo/Piso"],
  ["triple",    "🏔️ Triple Techo/Piso"],
  ["taza",      "☕ Taza y Asa"],
  ["bandera",   "🚩 Banderas & Banderines"],
  ["triangulo", "🔺 Triángulos"],
  ["cuna",      "📐 Cuñas & Canales"],
];

const W = 700, H = 330;
const BG = "#0a0f18";

// ── helpers ───────────────────────────────────────────────────────────────────
function poly(pts: {x:number,y:number}[], color: string, w = 2.5, dash = "") {
  return <polyline points={pts.map(p=>`${p.x},${p.y}`).join(" ")}
    fill="none" stroke={color} strokeWidth={w} strokeDasharray={dash} />;
}
function hline(y: number, x1: number, x2: number, color: string, dash = "5 4", w = 1) {
  return <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={w} strokeDasharray={dash} />;
}
function vline(x: number, y1: number, y2: number, color: string, dash = "4 3") {
  return <line x1={x} y1={y1} x2={x} y2={y2} stroke={color} strokeWidth={1} strokeDasharray={dash} />;
}
function lbl(x:number,y:number,text:string,color:string,size=9,anchor:"middle"|"start"|"end"="middle") {
  return <text x={x} y={y} fill={color} fontSize={size} fontFamily={Mono} textAnchor={anchor} fontWeight="bold">{text}</text>;
}
function note(x:number,y:number,text:string,color:string,size=8,anchor:"middle"|"start"|"end"="start") {
  return <text x={x} y={y} fill={color} fontSize={size} fontFamily={Sans} textAnchor={anchor}>{text}</text>;
}
function dot(x:number,y:number,color:string,r=5) {
  return <circle cx={x} cy={y} r={r} fill={color} stroke="#0a0f18" strokeWidth={1.5} />;
}
function arrowUp(x:number,y:number,len:number,color:string) {
  return <g>
    <line x1={x} y1={y} x2={x} y2={y-len} stroke={color} strokeWidth={2}/>
    <polygon points={`${x},${y-len-7} ${x-5},${y-len} ${x+5},${y-len}`} fill={color}/>
  </g>;
}
function arrowDown(x:number,y:number,len:number,color:string) {
  return <g>
    <line x1={x} y1={y} x2={x} y2={y+len} stroke={color} strokeWidth={2}/>
    <polygon points={`${x},${y+len+7} ${x-5},${y+len} ${x+5},${y+len}`} fill={color}/>
  </g>;
}
function infoBox(x:number,y:number,w:number,h:number,title:string,rows:{t:string,c:string}[]) {
  return <g>
    <rect x={x} y={y} width={w} height={h} fill="#00000030" stroke="#1a2535" strokeWidth={0.5} rx={2}/>
    <text x={x+w/2} y={y+14} fill="#ffd700" fontSize={9} fontFamily={Mono} textAnchor="middle">{title}</text>
    {rows.map((r,i)=>r.t
      ? <text key={i} x={x+8} y={y+26+i*12} fill={r.c} fontSize={7.5} fontFamily={i%2===0?Mono:Sans}>{r.t}</text>
      : null
    )}
  </g>;
}
function grid() {
  return <>{[65,130,195,260].map(y=><line key={y} x1={0} y1={y} x2={W} y2={y} stroke="#1a253544" strokeWidth={0.5}/>)}</>;
}
function panelBg(x:number,y:number,w:number,h:number,color:string,title:string,sub:string) {
  return <g>
    <rect x={x} y={y} width={w} height={h} fill="#0a0f1855" stroke={color+"44"} strokeWidth={1} rx={3}/>
    <text x={x+w/2} y={y+14} fill={color} fontSize={9} fontFamily={Mono} textAnchor="middle" fontWeight="bold">{title}</text>
    <text x={x+w/2} y={y+25} fill="#546e7a" fontSize={7} fontFamily={Mono} textAnchor="middle">{sub}</text>
  </g>;
}

// ── measured-move helper (bracket) ────────────────────────────────────────────
function measuredMove(x:number, yPeak:number, yBase:number, yTarget:number, color:string, label="Objetivo") {
  const dir = yTarget > yBase ? 1 : -1; // 1=down, -1=up
  return <g>
    {vline(x, yPeak, yTarget, color, "3 2")}
    {hline(yPeak,  x-8, x+8, color, "")}
    {hline(yBase,  x-8, x+8, color, "")}
    {hline(yTarget,x-8, x+8, color, "")}
    <text x={x+11} y={yTarget+4} fill={color} fontSize={8} fontFamily={Mono}>{label}</text>
    <text x={x+11} y={yPeak+4}   fill={color} fontSize={7} fontFamily={Mono}>Patrón alto</text>
    <text x={x+11} y={yBase+4}   fill={color} fontSize={7} fontFamily={Mono}>Cuello</text>
  </g>;
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW: HCH — Hombro Cabeza Hombro (bearish) + HCH Invertido (bullish)
// ══════════════════════════════════════════════════════════════════════════════
function HCHView() {
  // ── Bearish H&S (left panel, origin 0,30) ──
  const trend = [{x:5,y:230},{x:18,y:205},{x:25,y:215},{x:38,y:185}];
  const ls    = [{x:38,y:185},{x:58,y:115},{x:78,y:180}];
  const head  = [{x:78,y:180},{x:103,y:55},{x:128,y:180}];
  const rs    = [{x:128,y:180},{x:148,y:120},{x:168,y:180}];
  const brk   = [{x:168,y:180},{x:182,y:200},{x:200,y:240}];
  const neck  = [{x:20,y:180},{x:210,y:180}];

  // ── Bullish Inverse H&S (right panel, offset x+340) ──
  const ox = 340;
  const downTrend = [{x:ox+5,y:95},{x:ox+18,y:120},{x:ox+25,y:110},{x:ox+38,y:140}];
  const ils    = [{x:ox+38,y:140},{x:ox+58,y:210},{x:ox+78,y:145}];
  const ihead  = [{x:ox+78,y:145},{x:ox+103,y:270},{x:ox+128,y:145}];
  const irs    = [{x:ox+128,y:145},{x:ox+148,y:205},{x:ox+168,y:145}];
  const ibrk   = [{x:ox+168,y:145},{x:ox+182,y:125},{x:ox+205,y:80}];
  const ineck  = [{x:ox+20,y:145},{x:ox+215,y:145}];

  return <g>
    <text x={W/2} y={20} fill="#00e5ff" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>
      HOMBRO-CABEZA-HOMBRO (HCH) — BEARISH &amp; BULLISH
    </text>

    {panelBg(0,28,320,280,"#ff1744","HCH BAJISTA","Patrón de reversión — sell")}
    {panelBg(340,28,345,280,"#00e676","HCH INVERTIDO","Patrón de reversión — buy")}

    {/* Bearish price path */}
    {poly(trend,"#7a8fa0",1.5)}
    {poly(ls,   "#aaa",2)}
    {poly(head, "#aaa",2)}
    {poly(rs,   "#aaa",2)}
    {poly(brk,  "#ff1744",3)}
    {hline(180,20,210,"#ff174488","5 3",1.5)}
    <text x={213} y={183} fill="#ff1744" fontSize={8} fontFamily={Mono}>Cuello</text>

    {/* shoulder/head labels */}
    {dot(58,115,"#aaa")}
    {dot(103,55,"#aaa",7)}
    {dot(148,120,"#aaa")}
    {lbl(58,104,"LS","#aaa")}
    {lbl(103,43,"C","#fff",11)}
    {lbl(148,109,"RS","#aaa")}
    {lbl(182,198,"ENTRY","#ff1744",8)}
    {dot(182,200,"#ff1744")}

    {/* Measured move */}
    {vline(230,55,240,"#ff174477","3 2")}
    {hline(55,224,236,"#ff174477","",1)}
    {hline(180,224,236,"#ff174477","",1)}
    <text x={238} y={115} fill="#ff174499" fontSize={7} fontFamily={Mono}>H</text>
    {hline(240,218,236,"#ff174499","",1)}
    <text x={238} y={243} fill="#ff1744" fontSize={8} fontFamily={Mono}>TP</text>
    <text x={238} y={254} fill="#546e7a" fontSize={7} fontFamily={Mono}>= H</text>
    {dot(200,240,"#ff1744",4)}

    {/* SL line */}
    {hline(115,20,80,"#ffd70055","4 3",1)}
    <text x={22} y={112} fill="#ffd700" fontSize={7} fontFamily={Mono}>SL &gt; RS</text>

    {/* Bullish price path */}
    {poly(downTrend,"#7a8fa044",1.5)}
    {poly(ils,  "#aaa",2)}
    {poly(ihead,"#aaa",2)}
    {poly(irs,  "#aaa",2)}
    {poly(ibrk, "#00e676",3)}
    {hline(145,ox+20,ox+215,"#00e67688","5 3",1.5)}
    <text x={ox+218} y={148} fill="#00e676" fontSize={8} fontFamily={Mono}>Cuello</text>

    {dot(ox+58, 210,"#aaa")}
    {dot(ox+103,270,"#aaa",7)}
    {dot(ox+148,205,"#aaa")}
    {lbl(ox+58, 222,"LS","#aaa")}
    {lbl(ox+103,283,"C","#fff",11)}
    {lbl(ox+148,218,"RS","#aaa")}
    {dot(ox+182,125,"#00e676")}
    {lbl(ox+182,115,"ENTRY","#00e676",8)}

    {vline(ox+225,145,270,"#00e67677","3 2")}
    {hline(270,ox+219,ox+231,"#00e67677","",1)}
    {hline(145,ox+219,ox+231,"#00e67677","",1)}
    <text x={ox+233} y={210} fill="#00e67499" fontSize={7} fontFamily={Mono}>H</text>
    {hline(80,ox+219,ox+231,"#00e67499","",1)}
    <text x={ox+233} y={83} fill="#00e676" fontSize={8} fontFamily={Mono}>TP</text>
    {dot(ox+205,80,"#00e676",4)}

    {hline(210,ox+20,ox+80,"#ffd70055","4 3",1)}
    <text x={ox+22} y={208} fill="#ffd700" fontSize={7} fontFamily={Mono}>SL &lt; RS</text>

    <text x={10} y={H-4} fill="#546e7a" fontSize={8} fontFamily={Sans}>
      Cuello = línea que une los dos valles (bajista) o las dos crestas (alcista). Rotura + volumen + retest del cuello = entrada ideal.
    </text>
  </g>;
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW: DOBLE TECHO / DOBLE PISO
// ══════════════════════════════════════════════════════════════════════════════
function DobleView() {
  // Doble Techo (M) left, Doble Piso (W) right
  const ox2 = 360;

  // Doble Techo M
  const mPts = [
    {x:10,y:230},{x:30,y:200},{x:50,y:210},           // pre-trend up
    {x:60,y:185},{x:75,y:210},                          // rise
    {x:85,y:185},{x:100,y:85},{x:120,y:165},            // peak 1
    {x:145,y:115},{x:165,y:165},                        // pullback
    {x:180,y:85},{x:200,y:165},                         // peak 2 (same level)
    {x:215,y:185},{x:230,y:220},{x:250,y:260},          // breakdown
  ];

  // Doble Piso W
  const wPts = [
    {x:ox2+10,y:90},{x:ox2+25,y:120},
    {x:ox2+40,y:105},{x:ox2+55,y:230},{x:ox2+75,y:165},// trough 1
    {x:ox2+95,y:215},{x:ox2+115,y:165},                 // recovery
    {x:ox2+130,y:230},{x:ox2+150,y:165},                // trough 2 (same level)
    {x:ox2+170,y:145},{x:ox2+190,y:105},{x:ox2+210,y:70},// breakout
  ];

  const neck1y = 165; // doble techo neckline
  const neck2y = 165; // doble piso neckline (ox2)

  return <g>
    <text x={W/2} y={20} fill="#00e5ff" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>
      DOBLE TECHO (M) &amp; DOBLE PISO (W)
    </text>

    {panelBg(0,28,340,280,"#ff1744","DOBLE TECHO — M PATTERN","Bearish reversal")}
    {panelBg(ox2-20,28,360,280,"#00e676","DOBLE PISO — W PATTERN","Bullish reversal")}

    {/* M pattern */}
    {poly(mPts,"#cccccc",2)}
    {hline(85,75,210,"#ff174488","5 3",1.5)}
    {hline(neck1y,20,255,"#ffd70088","5 3",1.5)}
    {dot(100,85,"#ff1744",6)}{lbl(100,73,"P1","#ff1744",9)}
    {dot(180,85,"#ff1744",6)}{lbl(180,73,"P2","#ff1744",9)}
    {dot(230,220,"#ff1744",5)}{lbl(240,222,"ENTRY","#ff1744",8)}

    <text x={258} y={neck1y+4} fill="#ffd700" fontSize={7} fontFamily={Mono}>Cuello</text>
    <text x={258} y={89}       fill="#ff1744" fontSize={7} fontFamily={Mono}>Resistencia</text>

    {/* Measured move for M */}
    {vline(300,85,260,"#ff174466","3 2")}
    {hline(85,294,306,"#ff174466","",1)}
    {hline(165,294,306,"#ff174466","",1)}
    {hline(260,294,306,"#ff174466","",1)}
    <text x={308} y={177} fill="#ff174499" fontSize={7} fontFamily={Mono}>h</text>
    <text x={308} y={262} fill="#ff1744" fontSize={8} fontFamily={Mono}>TP ≈ h</text>

    {hline(145,0,50,"#ffd70044","4 3",1)}
    <text x={5} y={142} fill="#ffd700" fontSize={7} fontFamily={Mono}>SL sobre P2</text>

    {/* W pattern */}
    {poly(wPts,"#cccccc",2)}
    {hline(230,ox2+50,ox2+150,"#00e67688","5 3",1.5)}
    {hline(neck2y,ox2-15,ox2+215,"#ffd70088","5 3",1.5)}
    {dot(ox2+55,230,"#00e676",6)}{lbl(ox2+55,243,"P1","#00e676",9)}
    {dot(ox2+130,230,"#00e676",6)}{lbl(ox2+130,243,"P2","#00e676",9)}
    {dot(ox2+190,105,"#00e676",5)}{lbl(ox2+192,96,"ENTRY","#00e676",8)}

    <text x={ox2-14} y={neck2y+4} fill="#ffd700" fontSize={7} fontFamily={Mono}>Cuello</text>
    <text x={ox2+152} y={234}     fill="#00e676" fontSize={7} fontFamily={Mono}>Soporte</text>

    {vline(ox2+235,70,230,"#00e67466","3 2")}
    {hline(230,ox2+229,ox2+241,"#00e67466","",1)}
    {hline(165,ox2+229,ox2+241,"#00e67466","",1)}
    {hline(70, ox2+229,ox2+241,"#00e67466","",1)}
    <text x={ox2+243} y={200} fill="#00e47499" fontSize={7} fontFamily={Mono}>h</text>
    <text x={ox2+243} y={74}  fill="#00e676" fontSize={8} fontFamily={Mono}>TP ≈ h</text>

    <text x={10} y={H-4} fill="#546e7a" fontSize={8} fontFamily={Sans}>
      Regla: los dos picos (tops) o valles (bottoms) deben estar al mismo nivel ±2%. Volumen en P2 MENOR que en P1 confirma el patrón.
    </text>
  </g>;
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW: TRIPLE TECHO / TRIPLE PISO
// ══════════════════════════════════════════════════════════════════════════════
function TripleView() {
  const ox2 = 360;

  const triTop = [
    {x:8,y:240},{x:20,y:210},{x:30,y:220},
    {x:48,y:85},{x:68,y:165},
    {x:88,y:85},{x:108,y:165},
    {x:128,y:85},{x:148,y:165},
    {x:160,y:180},{x:175,y:215},{x:195,y:265},
  ];
  const triBot = [
    {x:ox2+8,y:75},{x:ox2+20,y:110},{x:ox2+30,y:95},
    {x:ox2+48,y:240},{x:ox2+68,y:165},
    {x:ox2+88,y:240},{x:ox2+108,y:165},
    {x:ox2+128,y:240},{x:ox2+148,y:165},
    {x:ox2+162,y:145},{x:ox2+178,y:110},{x:ox2+198,y:65},
  ];

  return <g>
    <text x={W/2} y={20} fill="#00e5ff" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>
      TRIPLE TECHO &amp; TRIPLE PISO
    </text>

    {panelBg(0,28,330,280,"#ff1744","TRIPLE TECHO","Bearish reversal fuerte")}
    {panelBg(ox2-20,28,360,280,"#00e676","TRIPLE PISO","Bullish reversal fuerte")}

    {poly(triTop,"#cccccc",2)}
    {hline(85,40,155,"#ff174488","5 3",1.5)}
    {hline(165,10,200,"#ffd70088","5 3",1.5)}
    {dot(48,85,"#ff1744",5)}{lbl(48,73,"T1","#ff1744",8)}
    {dot(88,85,"#ff1744",5)}{lbl(88,73,"T2","#ff1744",8)}
    {dot(128,85,"#ff1744",5)}{lbl(128,73,"T3","#ff1744",8)}
    {dot(175,215,"#ff1744",5)}{lbl(185,213,"ENTRY","#ff1744",8)}
    <text x={200} y={168} fill="#ffd700" fontSize={7} fontFamily={Mono}>Cuello</text>
    <text x={157} y={83}  fill="#ff1744" fontSize={7} fontFamily={Mono}>Resistencia</text>
    {vline(270,85,265,"#ff174466","3 2")}
    {hline(85,264,276,"#ff174466","",1)}{hline(165,264,276,"#ff174466","",1)}{hline(265,264,276,"#ff174466","",1)}
    <text x={278} y={267} fill="#ff1744" fontSize={8} fontFamily={Mono}>TP</text>

    {poly(triBot,"#cccccc",2)}
    {hline(240,ox2+40,ox2+155,"#00e67688","5 3",1.5)}
    {hline(165,ox2-10,ox2+210,"#ffd70088","5 3",1.5)}
    {dot(ox2+48,240,"#00e676",5)}{lbl(ox2+48,253,"T1","#00e676",8)}
    {dot(ox2+88,240,"#00e676",5)}{lbl(ox2+88,253,"T2","#00e676",8)}
    {dot(ox2+128,240,"#00e676",5)}{lbl(ox2+128,253,"T3","#00e676",8)}
    {dot(ox2+178,110,"#00e676",5)}{lbl(ox2+185,100,"ENTRY","#00e676",8)}
    <text x={ox2-18} y={168} fill="#ffd700" fontSize={7} fontFamily={Mono}>Cuello</text>
    <text x={ox2+158} y={244} fill="#00e676" fontSize={7} fontFamily={Mono}>Soporte</text>
    {vline(ox2+235,65,240,"#00e67466","3 2")}
    {hline(240,ox2+229,ox2+241,"#00e67466","",1)}{hline(165,ox2+229,ox2+241,"#00e67466","",1)}{hline(65,ox2+229,ox2+241,"#00e67466","",1)}
    <text x={ox2+243} y={68} fill="#00e676" fontSize={8} fontFamily={Mono}>TP</text>

    <text x={10} y={H-4} fill="#546e7a" fontSize={8} fontFamily={Sans}>
      El triple patrón es MÁS FUERTE que el doble — más rechazos en el mismo nivel = más órdenes pendientes acumuladas.
    </text>
  </g>;
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW: TAZA Y ASA
// ══════════════════════════════════════════════════════════════════════════════
function TazaView() {
  // Cup = smooth rounded bottom, handle = small consolidation at right rim, breakout
  const rimY = 85;
  const bottomY = 240;
  const handleDrop = 35;

  // Cup (rounded U-shape using bezier approximated with many points)
  const cupPts: {x:number,y:number}[] = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30; // 0→1
    const x = 30 + t * 260; // x: 30 → 290
    const angle = Math.PI * t; // 0 → π
    const y = rimY + (bottomY - rimY) * Math.sin(angle) * 0.95 + (bottomY - rimY) * 0.05;
    cupPts.push({ x: Math.round(x), y: Math.round(y) });
  }

  // Handle (small descending consolidation then breakout)
  const handlePts = [
    {x:290,y:rimY},
    {x:302,y:rimY+15},{x:310,y:rimY+handleDrop},
    {x:322,y:rimY+20},{x:330,y:rimY+handleDrop},
    {x:342,y:rimY+15},{x:355,y:rimY-5},
    {x:370,y:rimY-25},{x:385,y:rimY-55},
  ];

  return <g>
    <text x={W/2} y={20} fill="#ffd700" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>
      TAZA Y ASA — CUP &amp; HANDLE
    </text>

    {/* Left rim line */}
    {hline(rimY, 10, 32, "#ffd70088", "5 3", 1.5)}
    {/* Right rim line */}
    {hline(rimY, 288, 420, "#ffd70088", "5 3", 1.5)}
    <text x={14} y={rimY-5} fill="#ffd700" fontSize={8} fontFamily={Mono}>Borde izquierdo</text>
    <text x={295} y={rimY-5} fill="#ffd700" fontSize={8} fontFamily={Mono}>Borde derecho</text>

    {/* Cup */}
    {poly(cupPts, "#00e5ff", 2.5)}
    {dot(30,  rimY, "#ffd700", 5)}
    {dot(160, bottomY-3, "#00e676", 5)}
    {dot(290, rimY, "#ffd700", 5)}
    <text x={158} y={bottomY+14} fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="middle">Fondo de la taza</text>

    {/* Handle */}
    {poly(handlePts, "#ff9900", 2.5)}
    <text x={320} y={rimY+handleDrop+14} fill="#ff9900" fontSize={8} fontFamily={Mono} textAnchor="middle">ASA</text>
    <text x={320} y={rimY+handleDrop+25} fill="#546e7a" fontSize={7} fontFamily={Sans} textAnchor="middle">consolidación &lt;35%</text>

    {/* Breakout */}
    {dot(355, rimY-5, "#00e676", 5)}
    <text x={357} y={rimY-15} fill="#00e676" fontSize={8} fontFamily={Mono}>ENTRY</text>
    {arrowUp(385, rimY-28, 40, "#00e676")}
    {dot(385, rimY-55, "#00e676", 5)}
    <text x={387} y={rimY-70} fill="#00e676" fontSize={8} fontFamily={Mono}>TP ≈ profundidad</text>

    {/* Depth annotation */}
    {vline(420, rimY, bottomY, "#00e5ff44", "3 2")}
    {hline(rimY,   414,426,"#00e5ff44","",1)}
    {hline(bottomY,414,426,"#00e5ff44","",1)}
    <text x={428} y={(rimY+bottomY)/2+4} fill="#00e5ff" fontSize={8} fontFamily={Mono}>D</text>

    {/* SL */}
    {hline(rimY+handleDrop+5, 295, 360, "#ffd70044", "4 3", 1)}
    <text x={297} y={rimY+handleDrop+18} fill="#ffd700" fontSize={7} fontFamily={Mono}>SL bajo asa</text>

    {infoBox(455, 35, 232, 255, "TAZA Y ASA — DETALLES", [
      {t:"Tipo: continuación alcista",c:"#00e676"},
      {t:"William O'Neil (1988)",c:"#546e7a"},
      {t:"",c:""},
      {t:"Taza:",c:"#ffd700"},
      {t:"  Fondo redondeado (U, no V)",c:"#7a8fa0"},
      {t:"  Duración: 6 sem — 6 meses",c:"#7a8fa0"},
      {t:"  Retroceso: 15-33%",c:"#7a8fa0"},
      {t:"",c:""},
      {t:"Asa:",c:"#ff9900"},
      {t:"  Pequeña consolidación tras rim",c:"#7a8fa0"},
      {t:"  Retroceso asa: máx. 35%",c:"#7a8fa0"},
      {t:"  Volumen baja en asa",c:"#7a8fa0"},
      {t:"",c:""},
      {t:"Entry: rotura del borde con volumen",c:"#00e676"},
      {t:"TP: profundidad de la taza",c:"#00e676"},
      {t:"SL: bajo el punto más bajo del asa",c:"#ffd700"},
      {t:"",c:""},
      {t:"★ En crypto: ATH retest + asa = setup",c:"#00e5ff"},
    ])}

    <text x={10} y={H-4} fill="#546e7a" fontSize={8} fontFamily={Sans}>
      La taza debe tener forma de U (redondeada). Si el fondo es en V, es menos confiable. El asa es la última trampa antes del rally.
    </text>
  </g>;
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW: BANDERAS Y BANDERINES
// ══════════════════════════════════════════════════════════════════════════════
function BanderaView() {
  return <g>
    <text x={W/2} y={20} fill="#00e5ff" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>
      BANDERAS &amp; BANDERINES — FLAGS &amp; PENNANTS
    </text>

    {/* ── Bull Flag (top-left) ── */}
    {panelBg(0,28,160,280,"#00e676","BULL FLAG","Continuación alcista")}
    {/* Flagpole up */}
    {poly([{x:10,y:250},{x:35,y:120}],"#00e676",3)}
    {dot(10,250,"#546e7a",4)}{dot(35,120,"#00e676",4)}
    <text x={14} y={240} fill="#546e7a" fontSize={7} fontFamily={Mono}>Base</text>
    {/* Flag (parallel channels slanting down) */}
    {poly([{x:35,y:120},{x:55,y:138},{x:75,y:156},{x:95,y:170}],"#aaa",1.5)}
    {poly([{x:35,y:135},{x:55,y:153},{x:75,y:171},{x:95,y:185}],"#aaa",1.5)}
    {/* Breakout */}
    {poly([{x:95,y:170},{x:110,y:145},{x:130,y:115},{x:150,y:80}],"#00e676",2.5)}
    {dot(95,170,"#00e676",5)}
    <text x={97} y={162} fill="#00e676" fontSize={7} fontFamily={Mono}>ENTRY</text>
    {/* TP */}
    {vline(148,80,250,"#00e67644","3 2")}
    {hline(80,142,154,"#00e67644","",1)}{hline(170,142,154,"#00e67644","",1)}{hline(250,142,154,"#00e67644","",1)}
    <text x={20} y={83} fill="#00e676" fontSize={7} fontFamily={Mono}>TP = mástil</text>
    {/* Flag channel label */}
    <text x={55} y={200} fill="#aaa" fontSize={7} fontFamily={Mono} textAnchor="middle">bandera</text>
    <text x={55} y={211} fill="#546e7a" fontSize={7} fontFamily={Sans} textAnchor="middle">canal bajista</text>

    {/* ── Bear Flag (top-right of first group) ── */}
    {panelBg(168,28,160,280,"#ff1744","BEAR FLAG","Continuación bajista")}
    {poly([{x:178,y:80},{x:203,y:210}],"#ff1744",3)}
    {dot(178,80,"#546e7a",4)}{dot(203,210,"#ff1744",4)}
    {poly([{x:203,y:210},{x:223,y:192},{x:243,y:176},{x:263,y:162}],"#aaa",1.5)}
    {poly([{x:203,y:195},{x:223,y:177},{x:243,y:161},{x:263,y:147}],"#aaa",1.5)}
    {poly([{x:263,y:162},{x:278,y:187},{x:298,y:215},{x:318,y:250}],"#ff1744",2.5)}
    {dot(263,162,"#ff1744",5)}
    <text x={265} y={154} fill="#ff1744" fontSize={7} fontFamily={Mono}>ENTRY</text>
    <text x={215} y={136} fill="#aaa" fontSize={7} fontFamily={Mono} textAnchor="middle">bandera</text>
    <text x={215} y={147} fill="#546e7a" fontSize={7} fontFamily={Sans} textAnchor="middle">canal alcista</text>

    {/* ── Bull Pennant (bottom-left) ── */}
    {panelBg(336,28,175,280,"#00e5ff","BULL PENNANT","Continuación alcista")}
    {poly([{x:346,y:250},{x:370,y:115}],"#00e5ff",3)}
    {dot(346,250,"#546e7a",4)}{dot(370,115,"#00e5ff",4)}
    {/* Converging lines (pennant) */}
    {poly([{x:370,y:115},{x:390,y:125},{x:410,y:132},{x:430,y:138}],"#aaa",1.5)}
    {poly([{x:370,y:135},{x:390,y:133},{x:410,y:133},{x:430,y:133}],"#aaa",1.5)}
    <text x={400} y={150} fill="#aaa" fontSize={7} fontFamily={Mono} textAnchor="middle">banderín</text>
    {/* Breakout */}
    {poly([{x:430,y:133},{x:446,y:108},{x:465,y:75}],"#00e5ff",2.5)}
    {dot(430,133,"#00e5ff",5)}
    <text x={432} y={125} fill="#00e5ff" fontSize={7} fontFamily={Mono}>ENTRY</text>
    <text x={348} y={79} fill="#00e5ff" fontSize={7} fontFamily={Mono}>TP = mástil</text>

    {/* ── Bear Pennant ── */}
    {panelBg(520,28,170,280,"#e040fb","BEAR PENNANT","Continuación bajista")}
    {poly([{x:530,y:80},{x:554,y:215}],"#e040fb",3)}
    {dot(530,80,"#546e7a",4)}{dot(554,215,"#e040fb",4)}
    {poly([{x:554,y:215},{x:574,y:205},{x:594,y:197},{x:614,y:191}],"#aaa",1.5)}
    {poly([{x:554,y:195},{x:574,y:196},{x:594,y:196},{x:614,y:197}],"#aaa",1.5)}
    <text x={584} y={213} fill="#aaa" fontSize={7} fontFamily={Mono} textAnchor="middle">banderín</text>
    {poly([{x:614,y:191},{x:630,y:218},{x:648,y:250}],"#e040fb",2.5)}
    {dot(614,191,"#e040fb",5)}
    <text x={616} y={183} fill="#e040fb" fontSize={7} fontFamily={Mono}>ENTRY</text>
    <text x={532} y={265} fill="#e040fb" fontSize={7} fontFamily={Mono}>TP = mástil</text>

    <text x={10} y={H-4} fill="#546e7a" fontSize={8} fontFamily={Sans}>
      Bandera = canal paralelo. Banderín = triángulo pequeño. Ambos son correcciones de BAJA volatilidad tras un mástil de ALTA volatilidad.
    </text>
  </g>;
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW: TRIÁNGULOS
// ══════════════════════════════════════════════════════════════════════════════
function TrianguloView() {
  return <g>
    <text x={W/2} y={20} fill="#e040fb" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>
      TRIÁNGULOS — 3 TIPOS
    </text>

    {/* ── Ascending Triangle (bullish) ── */}
    {panelBg(0,28,213,280,"#00e676","TRIÁNGULO ASCENDENTE","Continuación alcista")}
    {/* Flat top + rising bottom */}
    {hline(85,12,185,"#00e67688","5 3",2)}
    {poly([{x:12,y:225},{x:40,y:175},{x:65,y:225},{x:95,y:155},{x:120,y:215},{x:150,y:130},{x:178,y:190}],"#aaa",1.5)}
    {poly([{x:12,y:225},{x:55,y:185},{x:100,y:158},{x:150,y:138},{x:178,y:85}],"#00e67655",1,"4 3")}
    <text x={92} y={79} fill="#00e676" fontSize={7} fontFamily={Mono} textAnchor="middle">Resistencia flat</text>
    <text x={92} y={245} fill="#00e676" fontSize={7} fontFamily={Mono} textAnchor="middle">soporte ascendente</text>
    {poly([{x:178,y:85},{x:196,y:62},{x:210,y:40}],"#00e676",2.5)}
    {dot(178,85,"#00e676",5)}{lbl(168,78,"ENTRY","#00e676",7)}
    {dot(210,40,"#00e676",5)}{lbl(210,32,"TP","#00e676",8)}
    <text x={5} y={102} fill="#ffd700" fontSize={7} fontFamily={Mono}>SL bajo la base</text>

    {/* ── Descending Triangle (bearish) ── */}
    {panelBg(220,28,212,280,"#ff1744","TRIÁNGULO DESCENDENTE","Continuación bajista")}
    {hline(225,232,405,"#ff174488","5 3",2)}
    {poly([{x:232,y:85},{x:260,y:135},{x:285,y:85},{x:315,y:145},{x:340,y:88},{x:370,y:155},{x:398,y:95}],"#aaa",1.5)}
    {poly([{x:232,y:85},{x:270,y:113},{x:315,y:138},{x:365,y:160},{x:400,y:175}],"#ff174455",1,"4 3")}
    <text x={315} y={79} fill="#ff1744" fontSize={7} fontFamily={Mono} textAnchor="middle">resistencia descendente</text>
    <text x={315} y={244} fill="#ff1744" fontSize={7} fontFamily={Mono} textAnchor="middle">Soporte flat</text>
    {poly([{x:400,y:175},{x:415,y:200},{x:428,y:235}],"#ff1744",2.5)}
    {dot(400,175,"#ff1744",5)}{lbl(390,168,"ENTRY","#ff1744",7)}
    {dot(428,235,"#ff1744",5)}{lbl(432,238,"TP","#ff1744",8)}

    {/* ── Symmetrical Triangle (bidireccional) ── */}
    {panelBg(440,28,250,280,"#ffd700","TRIÁNGULO SIMÉTRICO","Bidireccional")}
    {poly([{x:450,y:75},{x:490,y:105},{x:530,y:88},{x:565,y:115},{x:600,y:100},{x:628,y:120}],"#aaa",1.5)}
    {poly([{x:450,y:245},{x:490,y:215},{x:530,y:230},{x:565,y:205},{x:600,y:220},{x:628,y:200}],"#aaa",1.5)}
    {/* Converging trendlines */}
    {poly([{x:450,y:75},{x:530,y:88},{x:628,y:120}],"#ffd70066",1,"4 3")}
    {poly([{x:450,y:245},{x:530,y:230},{x:628,y:200}],"#ffd70066",1,"4 3")}
    <text x={540} y={168} fill="#ffd700" fontSize={8} fontFamily={Mono} textAnchor="middle">APEX</text>
    {/* Breakout up option */}
    {poly([{x:628,y:120},{x:648,y:88},{x:668,y:60}],"#00e676",2)}
    <text x={651} y={58} fill="#00e676" fontSize={7} fontFamily={Mono}>Breakout ↑</text>
    {/* Breakout down option */}
    {poly([{x:628,y:200},{x:648,y:228},{x:668,y:260}],"#ff1744",2)}
    <text x={651} y={272} fill="#ff1744" fontSize={7} fontFamily={Mono}>Breakout ↓</text>

    <text x={10} y={H-4} fill="#546e7a" fontSize={8} fontFamily={Sans}>
      Ascendente = buyers acumulando bajo resistencia = alcista. Descendente = sellers distribuyendo sobre soporte = bajista. Simétrico = esperar rotura.
    </text>
  </g>;
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW: CUÑAS Y CANALES
// ══════════════════════════════════════════════════════════════════════════════
function CunaView() {
  return <g>
    <text x={W/2} y={20} fill="#ff6d00" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>
      CUÑAS &amp; CANALES
    </text>

    {/* ── Rising Wedge (bearish) ── */}
    {panelBg(0,28,160,280,"#ff1744","CUÑA ASCENDENTE","Bearish — contra-tendencia")}
    {/* Rising converging lines */}
    {poly([{x:10,y:230},{x:40,y:190},{x:70,y:160},{x:100,y:138},{x:130,y:120},{x:150,y:112}],"#ff174466",1.5,"4 3")}
    {poly([{x:10,y:260},{x:45,y:220},{x:80,y:192},{x:110,y:172},{x:140,y:158},{x:150,y:150}],"#ff174466",1.5,"4 3")}
    {poly([{x:10,y:255},{x:30,y:220},{x:55,y:202},{x:75,y:183},{x:100,y:168},{x:120,y:155},{x:140,y:143}],"#aaa",2)}
    {/* Breakdown */}
    {poly([{x:148,y:148},{x:140,y:170},{x:125,y:200},{x:110,y:240}],"#ff1744",3)}
    {dot(148,148,"#ff1744",5)}{lbl(152,141,"ENTRY","#ff1744",7,"start")}
    {lbl(80,275,"Rotura bajista","#ff1744",7,"middle")}
    {hline(230,5,115,"#ffd70044","4 3",1)}<text x={7} y={228} fill="#ffd700" fontSize={7} fontFamily={Mono}>SL</text>

    {/* ── Falling Wedge (bullish) ── */}
    {panelBg(168,28,158,280,"#00e676","CUÑA DESCENDENTE","Bullish — contra-tendencia")}
    {poly([{x:178,y:70},{x:208,y:110},{x:238,y:138},{x:268,y:156},{x:298,y:168},{x:318,y:172}],"#00e67666",1.5,"4 3")}
    {poly([{x:178,y:100},{x:213,y:138},{x:248,y:165},{x:278,y:183},{x:308,y:196},{x:318,y:200}],"#00e67666",1.5,"4 3")}
    {poly([{x:178,y:95},{x:200,y:130},{x:225,y:158},{x:248,y:178},{x:270,y:192},{x:290,y:204}],"#aaa",2)}
    {poly([{x:318,y:175},{x:308,y:152},{x:295,y:120},{x:280,y:85}],"#00e676",3)}
    {dot(318,175,"#00e676",5)}{lbl(321,168,"ENTRY","#00e676",7,"start")}
    {lbl(248,275,"Rotura alcista","#00e676",7,"middle")}

    {/* ── Bullish Channel ── */}
    {panelBg(334,28,175,280,"#00e5ff","CANAL ALCISTA","Continuación alcista")}
    {poly([{x:344,y:250},{x:370,y:210},{x:396,y:230},{x:422,y:185},{x:448,y:210},{x:478,y:155}],"#aaa",2)}
    {poly([{x:344,y:220},{x:370,y:182},{x:400,y:200},{x:428,y:158},{x:455,y:182},{x:486,y:128}],"#00e5ff66",1.5,"5 3")}
    {poly([{x:344,y:265},{x:376,y:232},{x:406,y:250},{x:432,y:214},{x:460,y:236},{x:490,y:185}],"#00e5ff66",1.5,"5 3")}
    <text x={415} y={275} fill="#00e5ff" fontSize={7} fontFamily={Mono} textAnchor="middle">tocar suelo = comprar</text>
    <text x={415} y={120} fill="#00e5ff" fontSize={7} fontFamily={Mono} textAnchor="middle">tocar techo = TP parcial</text>

    {/* ── Bearish Channel ── */}
    {panelBg(517,28,175,280,"#e040fb","CANAL BAJISTA","Continuación bajista")}
    {poly([{x:527,y:80},{x:553,y:120},{x:579,y:98},{x:605,y:145},{x:631,y:118},{x:657,y:170}],"#aaa",2)}
    {poly([{x:527,y:60},{x:556,y:96},{x:585,y:75},{x:610,y:120},{x:638,y:95},{x:665,y:150}],"#e040fb66",1.5,"5 3")}
    {poly([{x:527,y:108},{x:556,y:144},{x:583,y:123},{x:610,y:168},{x:635,y:148},{x:663,y:200}],"#e040fb66",1.5,"5 3")}
    <text x={595} y={220} fill="#e040fb" fontSize={7} fontFamily={Mono} textAnchor="middle">tocar techo = vender</text>
    <text x={595} y={50}  fill="#e040fb" fontSize={7} fontFamily={Mono} textAnchor="middle">tocar suelo = TP parcial</text>

    <text x={10} y={H-4} fill="#546e7a" fontSize={8} fontFamily={Sans}>
      Cuña: líneas convergentes (se cierra). Canal: líneas paralelas. En cuñas: la rotura CONTRA la dirección de la cuña es la señal. Canal: operar los extremos.
    </text>
  </g>;
}

// ── Legend cards ──────────────────────────────────────────────────────────────
const legends: Record<ViewType, {wave:string,color:string,desc:string}[]> = {
  hch: [
    {wave:"HCH Bajista",color:"#ff1744",desc:"Tres picos: dos hombros iguales + cabeza más alta. Rotura del cuello = entrada short."},
    {wave:"HCH Invertido",color:"#00e676",desc:"Tres valles: dos hombros iguales + cabeza más profunda. Rotura del cuello = entrada long."},
    {wave:"Cuello (Neckline)",color:"#ffd700",desc:"Línea que une los dos valles (HCH bajista) o las dos crestas (HCH alcista). Es el trigger."},
    {wave:"Medida del movimiento",color:"#00e5ff",desc:"TP = distancia desde la cabeza hasta el cuello, proyectada desde el punto de rotura."},
    {wave:"SL óptimo",color:"#546e7a",desc:"Por encima del hombro derecho (bajista) o por debajo del hombro derecho (alcista)."},
  ],
  doble: [
    {wave:"Doble Techo (M)",color:"#ff1744",desc:"Dos picos al mismo nivel. Volumen en P2 menor que P1. Rotura del cuello confirma."},
    {wave:"Doble Piso (W)",color:"#00e676",desc:"Dos valles al mismo nivel. Volumen en P2 menor. Rotura del cuello = entrada long."},
    {wave:"Cuello (Neck)",color:"#ffd700",desc:"El valle entre los dos picos (doble techo) o la cresta entre los dos valles (doble piso)."},
    {wave:"Medida",color:"#00e5ff",desc:"TP = altura desde los picos/valles hasta el cuello, proyectada desde la rotura."},
    {wave:"Confirmación",color:"#546e7a",desc:"Volumen decreciente en el segundo pico/valle + rotura con volumen = confirmación sólida."},
  ],
  triple: [
    {wave:"Triple Techo",color:"#ff1744",desc:"3 rechazos en la misma resistencia. Más potente que el doble techo. Acumulación de órdenes."},
    {wave:"Triple Piso",color:"#00e676",desc:"3 rechazos en el mismo soporte. Señal de fuerte demanda institucional en esa zona."},
    {wave:"Paciencia",color:"#ffd700",desc:"El tercer rechazo tiene MENOS volumen que el primero — señal de agotamiento del impulso."},
    {wave:"Medida",color:"#00e5ff",desc:"TP = altura del patrón (distancia entre resistencia/soporte y el cuello), proyectada."},
    {wave:"Timeframes",color:"#546e7a",desc:"Más confiable en 4H, diario y semanal. En 1H o 15m genera más falsos positivos."},
  ],
  taza: [
    {wave:"La Taza",color:"#00e5ff",desc:"Fondo redondeado (U). Duración: semanas o meses. Retroceso 15-33% del rally previo."},
    {wave:"El Asa",color:"#ff9900",desc:"Pequeña consolidación en el borde derecho. Retrocede máximo 35% de la taza. Volumen bajo."},
    {wave:"Breakout",color:"#00e676",desc:"Rotura del borde superior con aumento de volumen. Entrada en la rotura o en el retest."},
    {wave:"TP",color:"#ffd700",desc:"Objetivo = profundidad de la taza proyectada desde el punto de rotura."},
    {wave:"En crypto",color:"#e040fb",desc:"BTC frecuentemente forma Taza y Asa en el período post-halving. ATH retest = borde de la taza."},
  ],
  bandera: [
    {wave:"Bull Flag",color:"#00e676",desc:"Mástil alcista + canal bajista pequeño. Rotura arriba = TP igual al mástil."},
    {wave:"Bear Flag",color:"#ff1744",desc:"Mástil bajista + canal alcista pequeño. Rotura abajo = TP igual al mástil."},
    {wave:"Bull Pennant",color:"#00e5ff",desc:"Mástil alcista + triángulo pequeño. Volumen baja en el pennant, explota en la rotura."},
    {wave:"Bear Pennant",color:"#e040fb",desc:"Mástil bajista + triángulo pequeño. Señal de continuación bajista fuerte."},
    {wave:"Regla del mástil",color:"#ffd700",desc:"TP = longitud del mástil (flagpole). La bandera/banderín debe corregir menos del 50% del mástil."},
  ],
  triangulo: [
    {wave:"Ascendente",color:"#00e676",desc:"Resistencia flat + soporte ascendente. Los buyers presionan la resistencia. Rotura arriba."},
    {wave:"Descendente",color:"#ff1744",desc:"Soporte flat + resistencia descendente. Los sellers presionan. Rotura abajo."},
    {wave:"Simétrico",color:"#ffd700",desc:"Convergencia bidireccional. Esperar la rotura. Más frecuente como continuación que reversión."},
    {wave:"Thrust",color:"#e040fb",desc:"Después de la rotura, TP = altura máxima del triángulo proyectada desde el vértice de rotura."},
    {wave:"Falso breakout",color:"#546e7a",desc:"Muy común en triángulos simétricos. Esperar cierre de vela fuera del triángulo para confirmar."},
  ],
  cuna: [
    {wave:"Cuña ascendente",color:"#ff1744",desc:"Sube pero se comprime. Bearish. Rotura bajista = mínimo objetivo = inicio de la cuña."},
    {wave:"Cuña descendente",color:"#00e676",desc:"Baja pero se comprime. Bullish. Rotura alcista = objetivo = inicio de la cuña."},
    {wave:"Canal alcista",color:"#00e5ff",desc:"Líneas paralelas subiendo. Compra en el soporte, TP parcial en la resistencia."},
    {wave:"Canal bajista",color:"#e040fb",desc:"Líneas paralelas bajando. Vende en la resistencia, TP parcial en el soporte."},
    {wave:"Rotura de canal",color:"#ffd700",desc:"Rotura del canal = señal de aceleración. TP = anchura del canal proyectada desde la rotura."},
  ],
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export function ChartPatternsChart() {
  const [view, setView] = useState<ViewType>("hch");

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
        <svg width={W} height={H}
          style={{ background: BG, borderRadius: 4, display: "block", minWidth: 420 }}>
          {grid()}
          {view === "hch"       && <HCHView />}
          {view === "doble"     && <DobleView />}
          {view === "triple"    && <TripleView />}
          {view === "taza"      && <TazaView />}
          {view === "bandera"   && <BanderaView />}
          {view === "triangulo" && <TrianguloView />}
          {view === "cuna"      && <CunaView />}
        </svg>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
        gap: 8, marginTop: 12,
      }}>
        {(legends[view] || []).map(w => (
          <div key={w.wave} style={{
            background: "var(--bg3)",
            border: `1px solid ${w.color}44`,
            borderLeft: `3px solid ${w.color}`,
            padding: "8px 10px",
          }}>
            <div style={{ fontFamily: Orb, fontSize: 10, color: w.color, marginBottom: 3 }}>{w.wave}</div>
            <div style={{ fontSize: 11, color: "#7a8fa0", lineHeight: 1.55 }}>{w.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
