import React, { useState } from "react";

const Mono = "'Share Tech Mono', monospace";
const Sans = "'Rajdhani', sans-serif";
const BG   = "#0a0f18";

type View = "bos-alcista" | "bos-bajista" | "choch";

const VIEWS: [View, string][] = [
  ["bos-alcista",  "📈 BOS Alcista"],
  ["bos-bajista",  "📉 BOS Bajista"],
  ["choch",        "🔄 CHoCH"],
];

const W = 700, H = 320;

function lbl(x:number,y:number,t:string,c:string,size=9,anchor:"middle"|"start"|"end"="middle") {
  return <text x={x} y={y} fill={c} fontSize={size} fontFamily={Mono} textAnchor={anchor}>{t}</text>;
}
function note(x:number,y:number,t:string,c:string) {
  return <text x={x} y={y} fill={c} fontSize={8} fontFamily={Sans}>{t}</text>;
}
function candle(x:number,o:number,h:number,l:number,c:number,color:string,w=28) {
  const bull = c>=o;
  const bt = bull?c:o, bb = bull?o:c;
  return <g>
    <line x1={x+w/2} y1={h} x2={x+w/2} y2={l} stroke={color} strokeWidth={1.5}/>
    <rect x={x} y={bt} width={w} height={Math.max(2,bb-bt)} fill={bull?color+"33":color+"55"} stroke={color} strokeWidth={1.5}/>
  </g>;
}
function hline(y:number,x1:number,x2:number,color:string,dash="5 3",w=1) {
  return <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={w} strokeDasharray={dash}/>;
}
function dot(x:number,y:number,color:string,r=5) {
  return <circle cx={x} cy={y} r={r} fill={color} stroke="#0a0f18" strokeWidth={1.5}/>;
}
function swingLine(pts:{x:number,y:number}[],color:string) {
  return <polyline points={pts.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="4 3"/>;
}
function bosArrow(x:number,y:number,dir:"up"|"down",color:string) {
  if(dir==="up") return <g>
    <rect x={x-18} y={y-16} width={36} height={16} fill={color+"33"} stroke={color} strokeWidth={1.2} rx={2}/>
    <text x={x} y={y-5} fill={color} fontSize={8} fontFamily={Mono} textAnchor="middle">BOS ↑</text>
  </g>;
  return <g>
    <rect x={x-18} y={y} width={36} height={16} fill={color+"33"} stroke={color} strokeWidth={1.2} rx={2}/>
    <text x={x} y={y+11} fill={color} fontSize={8} fontFamily={Mono} textAnchor="middle">BOS ↓</text>
  </g>;
}

function BOSAlcistaView() {
  const swingPts = [
    {x:30,y:265},{x:80,y:185},{x:105,y:215},{x:158,y:140},
    {x:185,y:170},{x:238,y:105},{x:265,y:135},{x:318,y:72},
    {x:345,y:100},{x:400,y:55},
  ];
  return <g>
    {lbl(W/2,22,"BREAK OF STRUCTURE (BOS) ALCISTA","#00e676",11)}
    {lbl(W/2,38,"Cada HH rompe la resistencia previa — confirma tendencia alcista","#546e7a",8)}

    {/* Swing structure */}
    {swingLine(swingPts,"#00e67666")}

    {/* Swings labeled */}
    {dot(30,265,"#ff1744")}{lbl(30,278,"LL","#ff1744",9)}
    {dot(80,185,"#00e676")}{lbl(80,178,"LH","#00e676",9)}
    {dot(105,215,"#ff1744")}{lbl(105,228,"HL","#00e676",9)}
    {dot(158,140,"#00e676")}{lbl(158,133,"HH","#00e676",9)}{bosArrow(158,133,"up","#00e676")}
    {dot(185,170,"#546e7a")}{lbl(185,183,"HL","#00e676",9)}
    {dot(238,105,"#00e676")}{lbl(238,98,"HH","#00e676",9)}{bosArrow(238,98,"up","#00e676")}
    {dot(265,135,"#546e7a")}{lbl(265,148,"HL","#00e676",9)}
    {dot(318,72,"#00e676")}{lbl(318,65,"HH","#00e676",9)}{bosArrow(318,65,"up","#00e676")}

    {/* Resistance levels (horizontal) */}
    {hline(185,28,280,"#00e67633","5 3")}
    {hline(140,28,340,"#00e67633","5 3")}
    {hline(105,28,400,"#00e67633","5 3")}

    {/* Entry zone */}
    {dot(345,100,"#546e7a")}{lbl(345,113,"HL","#00e676",9)}
    {candle(370,100,72,105,78,"#00e676",28)}
    {lbl(384,64,"ENTRY","#00e676",9)}

    {/* TP */}
    {dot(400,55,"#00e676",6)}{lbl(416,58,"TP → Next BSL","#00e676",8,"start")}
    {hline(55,390,510,"#00e67699","3 2")}

    {/* SL */}
    {hline(135,350,460,"#ffd70099","4 3")}
    {lbl(462,138,"SL bajo HL","#ffd700",8,"start")}

    {/* Info box right */}
    <rect x={440} y={65} width={248} height={200} fill="#00000030" stroke="#1a2535" strokeWidth={0.5} rx={2}/>
    {lbl(564,82,"BOS ALCISTA — CLAVE",  "#00e676",9)}
    {note(450,98,"HH = Higher High → nueva resistencia"     ,"#7a8fa0")}
    {note(450,112,"HL = Higher Low → nuevo soporte"          ,"#7a8fa0")}
    {note(450,126,"Cada BOS (rompe HH anterior) = confirmación","#7a8fa0")}
    {note(450,140,""                                          ,"#7a8fa0")}
    {note(450,154,"★ ENTRADA CLÁSICA:"                        ,"#00e676")}
    {note(450,168,"  1. BOS confirma tendencia alcista"       ,"#7a8fa0")}
    {note(450,182,"  2. Espera pullback al HL"                 ,"#7a8fa0")}
    {note(450,196,"  3. Entra en el OB o FVG del impulso"     ,"#7a8fa0")}
    {note(450,210,"  4. SL bajo el HL, TP en next BSL"        ,"#7a8fa0")}
    {note(450,224,""                                          ,"#7a8fa0")}
    {note(450,238,"SMC: el BOS es el punto donde el smart"    ,"#546e7a")}
    {note(450,252,"money revela su intención — ¡síguelos!"    ,"#546e7a")}

    {lbl(10,H-4,"BOS = confirmación de nueva tendencia. Solo opera a favor del BOS. En contra del BOS = CHoCH.","#546e7a",8,"start")}
  </g>;
}

function BOSBajistaView() {
  const swingPts = [
    {x:30,y:75},{x:80,y:150},{x:105,y:120},{x:158,y:195},
    {x:185,y:165},{x:238,y:228},{x:265,y:195},{x:318,y:258},
    {x:345,y:228},{x:400,y:278},
  ];
  return <g>
    {lbl(W/2,22,"BREAK OF STRUCTURE (BOS) BAJISTA","#ff1744",11)}
    {lbl(W/2,38,"Cada LL rompe el soporte previo — confirma tendencia bajista","#546e7a",8)}

    {swingLine(swingPts,"#ff174466")}

    {dot(30,75,"#00e676")}{lbl(30,68,"HH","#00e676",9)}
    {dot(80,150,"#ff1744")}{lbl(80,163,"HL → LH","#ff1744",9)}
    {dot(105,120,"#00e676")}{lbl(105,113,"LH","#ff1744",9)}
    {dot(158,195,"#ff1744")}{lbl(158,208,"LL","#ff1744",9)}{bosArrow(158,208,"down","#ff1744")}
    {dot(185,165,"#546e7a")}{lbl(185,158,"LH","#ff1744",9)}
    {dot(238,228,"#ff1744")}{lbl(238,241,"LL","#ff1744",9)}{bosArrow(238,241,"down","#ff1744")}
    {dot(265,195,"#546e7a")}{lbl(265,188,"LH","#ff1744",9)}
    {dot(318,258,"#ff1744")}{lbl(318,271,"LL","#ff1744",9)}{bosArrow(318,271,"down","#ff1744")}

    {hline(150,28,280,"#ff174433","5 3")}
    {hline(195,28,340,"#ff174433","5 3")}
    {hline(228,28,400,"#ff174433","5 3")}

    {dot(345,228,"#546e7a")}{lbl(345,221,"LH","#ff1744",9)}
    {candle(370,195,188,228,220,"#ff1744",28)}
    {lbl(384,282,"ENTRY","#ff1744",9)}

    {dot(400,278,"#ff1744",6)}{lbl(416,281,"TP → Next SSL","#ff1744",8,"start")}
    {hline(278,390,510,"#ff174499","3 2")}
    {hline(185,350,460,"#ffd70099","4 3")}
    {lbl(462,188,"SL sobre LH","#ffd700",8,"start")}

    <rect x={440} y={65} width={248} height={200} fill="#00000030" stroke="#1a2535" strokeWidth={0.5} rx={2}/>
    {lbl(564,82,"BOS BAJISTA — CLAVE","#ff1744",9)}
    {note(450,98,"LH = Lower High → nueva resistencia","#7a8fa0")}
    {note(450,112,"LL = Lower Low → nuevo soporte","#7a8fa0")}
    {note(450,126,"Cada BOS (rompe LL anterior) = tendencia bajista","#7a8fa0")}
    {note(450,154,"★ ENTRADA CLÁSICA:","#ff1744")}
    {note(450,168,"  1. BOS confirma downtrend","#7a8fa0")}
    {note(450,182,"  2. Espera pullback al LH","#7a8fa0")}
    {note(450,196,"  3. Entra en el OB bajista del impulso","#7a8fa0")}
    {note(450,210,"  4. SL sobre el LH, TP en next SSL","#7a8fa0")}

    {lbl(10,H-4,"BOS bajista = confirmación de downtrend. Opera SOLO shorts. Si el precio hace un nuevo HH → CHoCH = posible reversión.","#546e7a",8,"start")}
  </g>;
}

function CHoCHView() {
  return <g>
    {lbl(W/2,22,"CHANGE OF CHARACTER (CHoCH) — CAMBIO DE TENDENCIA","#ffd700",11)}
    {lbl(W/2,38,"El primer BOS EN CONTRA de la tendencia previa señala posible reversión","#546e7a",8)}

    {/* Downtrend phase */}
    {lbl(130,58,"DOWNTREND (BOS bajistas)","#ff1744",9)}
    {hline(62,18,350,"#ff174422","6 3")}

    {/* Swings in downtrend */}
    {[
      {x:20,y:75},{x:60,y:128},{x:85,y:105},{x:130,y:162},
      {x:155,y:138},{x:200,y:195},{x:225,y:172},
    ].map((p,i,arr)=> i>0 ? <line key={i} x1={arr[i-1].x} y1={arr[i-1].y} x2={p.x} y2={p.y}
      stroke="#ff174666" strokeWidth={1.5} strokeDasharray="4 3"/> : null)}
    {dot(20,75,"#00e676")}{lbl(20,68,"HH","#00e676",8)}
    {dot(60,128,"#ff1744")}{lbl(60,141,"LL","#ff1744",8)}
    {dot(85,105,"#ff1744")}{lbl(85,98,"LH","#ff1744",8)}
    {dot(130,162,"#ff1744")}{lbl(130,175,"LL","#ff1744",8)}
    {dot(155,138,"#ff1744")}{lbl(155,131,"LH","#ff1744",8)}
    {dot(200,195,"#ff1744")}{lbl(200,208,"LL","#ff1744",8)}
    {dot(225,172,"#ff1744")}{lbl(225,165,"LH","#ff1744",8)}

    {/* BOS labels on downtrend */}
    {bosArrow(130,175,"down","#ff1744")}
    {bosArrow(200,208,"down","#ff1744")}

    {/* CHoCH — first upward BOS */}
    {lbl(310,58,"CHoCH → ↑ BOS en contra","#ffd700",9)}
    <line x1={225} y1={172} x2={270} y2={125} stroke="#ffd700" strokeWidth={2}/>
    {dot(270,125,"#ffd700",6)}{lbl(270,118,"HL ★","#ffd700",9)}

    <line x1={270} y1={125} x2={315} y2={88} stroke="#ffd700" strokeWidth={2.5}/>
    {dot(315,88,"#ffd700",6)}
    {hline(138,200,400,"#ffd70099","5 3",2)}{lbl(403,141,"Resistencia previa (LH)","#ffd70099",7,"start")}
    <rect x={295} y={72} width={40} height={20} fill="#ffd70033" stroke="#ffd700" strokeWidth={1.2} rx={2}/>
    {lbl(315,85,"CHoCH ✓","#ffd700",8)}

    {/* Confirmation — new HH */}
    {lbl(430,58,"CONFIRMACIÓN ALCISTA","#00e676",9)}
    {hline(88,270,660,"#00e67633","5 3")}
    <line x1={315} y1={88} x2={360} y2={110} stroke="#00e676" strokeWidth={1.5}/>
    {dot(360,110,"#546e7a")}{lbl(360,123,"HL","#00e676",8)}
    <line x1={360} y1={110} x2={410} y2={65} stroke="#00e676" strokeWidth={2}/>
    {dot(410,65,"#00e676",6)}{lbl(410,58,"HH","#00e676",8)}
    {bosArrow(410,58,"up","#00e676")}
    <line x1={410} y1={65} x2={455} y2={85} stroke="#00e676" strokeWidth={1.5}/>
    {dot(455,85,"#546e7a")}{lbl(455,98,"HL","#00e676",8)}
    <line x1={455} y1={85} x2={510} y2={48} stroke="#00e676" strokeWidth={2}/>
    {dot(510,48,"#00e676",6)}{bosArrow(510,48,"up","#00e676")}

    {/* Entry at CHoCH HL */}
    {candle(470,85,68,92,72,"#00e676",30)}
    {lbl(485,58,"ENTRY","#00e676",9)}

    {/* SL/TP */}
    {hline(112,445,580,"#ffd70099","4 3")}{lbl(582,115,"SL","#ffd700",8,"start")}
    {hline(48,480,590,"#00e67699","3 2")}{lbl(592,51,"TP","#00e676",8,"start")}

    {/* Divider */}
    <line x1={240} y1={50} x2={240} y2={295} stroke="#ffd70033" strokeWidth={1} strokeDasharray="6 4"/>

    <rect x={530} y={65} width={155} height={215} fill="#00000030" stroke="#1a2535" strokeWidth={0.5} rx={2}/>
    {lbl(607,82,"CHoCH vs BOS","#ffd700",9)}
    {note(538,96,"BOS = tendencia continúa","#7a8fa0")}
    {note(538,108,"  ↑ HH en uptrend","#00e676")}
    {note(538,120,"  ↓ LL en downtrend","#ff1744")}
    {note(538,134,"CHoCH = señal de CAMBIO","#ffd700")}
    {note(538,146,"  ↑ BOS en downtrend = CHoCH","#ffd700")}
    {note(538,158,"  ↓ BOS en uptrend = CHoCH","#ffd700")}
    {note(538,172,"","#546e7a")}
    {note(538,184,"¿Cuándo entrar?","#00e5ff")}
    {note(538,196,"  En el HL/LH post-CHoCH","#7a8fa0")}
    {note(538,208,"  No en el CHoCH mismo","#7a8fa0")}
    {note(538,220,"  Confirmar con OB/FVG","#7a8fa0")}
    {note(538,232,"  y Kill Zone","#7a8fa0")}
    {note(538,245,"","#546e7a")}
    {note(538,257,"En HTF: CHoCH macro = ","#546e7a")}
    {note(538,269,"  cambio de régimen","#546e7a")}

    {lbl(10,H-4,"CHoCH = primer signo de que el smart money está cambiando de dirección. NO entrar en el CHoCH mismo — esperar el retest del OB/FVG que lo originó.","#546e7a",8,"start")}
  </g>;
}

export function BOSChart() {
  const [view, setView] = useState<View>("bos-alcista");

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
          {view === "bos-alcista" && <BOSAlcistaView />}
          {view === "bos-bajista" && <BOSBajistaView />}
          {view === "choch"       && <CHoCHView />}
        </svg>
      </div>
    </div>
  );
}
