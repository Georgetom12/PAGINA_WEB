import React from "react";

interface StructureChartProps {
  type: "uptrend" | "downtrend" | "bos-bullish" | "choch-bearish" | "wyckoff-acc" | "wyckoff-dist";
  title?: string;
  width?: number;
  height?: number;
}

export function StructureChart({ type, title, width = 620, height = 260 }: StructureChartProps) {
  const renderContent = () => {
    if (type === "uptrend") {
      return (
        <g>
          {/* Uptrend wave path */}
          <polyline
            points="40,200 120,150 160,165 240,110 280,125 360,70 400,85 480,40"
            fill="none" stroke="#00e5ff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
          />
          {/* HH labels */}
          {[[240,100],[360,60],[480,30]].map(([x,y],i) => (
            <g key={i}>
              <circle cx={x} cy={y+10} r={5} fill="#00e676" opacity={0.9} />
              <text x={x} y={y} textAnchor="middle" fill="#00e676" fontSize={10} fontFamily="'Share Tech Mono',monospace">HH{i+1}</text>
            </g>
          ))}
          {/* HL labels */}
          {[[160,175],[280,135],[400,95]].map(([x,y],i) => (
            <g key={i}>
              <circle cx={x} cy={y-10} r={5} fill="#00e5ff" opacity={0.9} />
              <text x={x} y={y+4} textAnchor="middle" fill="#00e5ff" fontSize={10} fontFamily="'Share Tech Mono',monospace">HL{i+1}</text>
            </g>
          ))}
          {/* Start */}
          <circle cx={40} cy={200} r={5} fill="#ff1744" opacity={0.9} />
          <text x={40} y={218} textAnchor="middle" fill="#ff1744" fontSize={10} fontFamily="'Share Tech Mono',monospace">LL</text>
          {/* arrow annotation */}
          <text x={310} y={220} textAnchor="middle" fill="#546e7a" fontSize={11} fontFamily="'Rajdhani',sans-serif">
            Tendencia Alcista: HH → HL → HH → HL → HH
          </text>
        </g>
      );
    }

    if (type === "downtrend") {
      return (
        <g>
          <polyline
            points="40,50 120,100 160,85 240,135 280,120 360,170 400,155 480,200"
            fill="none" stroke="#ff6d00" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
          />
          {[[240,145],[360,180],[480,210]].map(([x,y],i) => (
            <g key={i}>
              <circle cx={x} cy={y-10} r={5} fill="#ff1744" opacity={0.9} />
              <text x={x} y={y+2} textAnchor="middle" fill="#ff1744" fontSize={10} fontFamily="'Share Tech Mono',monospace">LL{i+1}</text>
            </g>
          ))}
          {[[160,75],[280,110],[400,145]].map(([x,y],i) => (
            <g key={i}>
              <circle cx={x} cy={y+10} r={5} fill="#ff6d00" opacity={0.9} />
              <text x={x} y={y-2} textAnchor="middle" fill="#ff6d00" fontSize={10} fontFamily="'Share Tech Mono',monospace">LH{i+1}</text>
            </g>
          ))}
          <circle cx={40} cy={50} r={5} fill="#00e676" opacity={0.9} />
          <text x={40} y={40} textAnchor="middle" fill="#00e676" fontSize={10} fontFamily="'Share Tech Mono',monospace">HH</text>
          <text x={310} y={230} textAnchor="middle" fill="#546e7a" fontSize={11} fontFamily="'Rajdhani',sans-serif">
            Tendencia Bajista: LH → LL → LH → LL → LH
          </text>
        </g>
      );
    }

    if (type === "bos-bullish") {
      return (
        <g>
          {/* Uptrend then BOS */}
          <polyline
            points="30,200 100,155 135,170 200,120 235,135 300,90 340,100 420,50"
            fill="none" stroke="#00e5ff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          />
          {/* Previous HH line */}
          <line x1={200} y1={120} x2={440} y2={120} stroke="#00e676" strokeWidth={1.5} strokeDasharray="5,3" opacity={0.7} />
          <text x={445} y={124} fill="#00e676" fontSize={9} fontFamily="'Share Tech Mono',monospace">Previous HH</text>
          {/* BOS label */}
          <text x={380} y={65} textAnchor="middle" fill="#00e676" fontSize={13} fontWeight="bold" fontFamily="'Orbitron',monospace">BOS ✓</text>
          <text x={380} y={80} textAnchor="middle" fill="#00e676" fontSize={9} fontFamily="'Share Tech Mono',monospace">BREAK OF STRUCTURE</text>
          {/* Arrow showing break */}
          <line x1={340} y1={90} x2={380} y2={72} stroke="#00e676" strokeWidth={1.5} strokeDasharray="3,2" />
          {/* Labels */}
          {[[200,110],[300,80]].map(([x,y],i) => (
            <text key={i} x={x} y={y-6} textAnchor="middle" fill="#00e676" fontSize={9} fontFamily="'Share Tech Mono',monospace">HH{i+1}</text>
          ))}
          {[[135,180],[235,145]].map(([x,y],i) => (
            <text key={i} x={x} y={y+14} textAnchor="middle" fill="#00e5ff" fontSize={9} fontFamily="'Share Tech Mono',monospace">HL{i+1}</text>
          ))}
          <text x={420} y={44} textAnchor="middle" fill="#00e676" fontSize={9} fontFamily="'Share Tech Mono',monospace">NEW HH</text>
          <text x={300} y={235} textAnchor="middle" fill="#546e7a" fontSize={11} fontFamily="'Rajdhani',sans-serif">
            BOS: Confirmación de continuación alcista — nueva HL válida para entrada
          </text>
        </g>
      );
    }

    if (type === "choch-bearish") {
      return (
        <g>
          {/* Uptrend then CHoCH */}
          <polyline
            points="30,200 100,150 140,168 210,110 250,125 310,80 345,95"
            fill="none" stroke="#00e5ff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          />
          {/* CHoCH — breaks HL */}
          <polyline
            points="345,95 380,135 420,160 470,190"
            fill="none" stroke="#ff1744" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
          />
          {/* Previous HL line */}
          <line x1={250} y1={125} x2={500} y2={125} stroke="#ff1744" strokeWidth={1.5} strokeDasharray="5,3" opacity={0.7} />
          <text x={505} y={129} fill="#ff1744" fontSize={9} fontFamily="'Share Tech Mono',monospace">Previous HL</text>
          {/* CHoCH label */}
          <text x={435} y={155} textAnchor="middle" fill="#ff1744" fontSize={13} fontWeight="bold" fontFamily="'Orbitron',monospace">CHoCH ⚠</text>
          <text x={435} y={170} textAnchor="middle" fill="#ff1744" fontSize={9} fontFamily="'Share Tech Mono',monospace">CHANGE OF CHARACTER</text>
          <text x={300} y={235} textAnchor="middle" fill="#546e7a" fontSize={11} fontFamily="'Rajdhani',sans-serif">
            CHoCH: El precio rompe el HL → primer indicio de reversión bajista
          </text>
          {[[210,100],[310,70]].map(([x,y],i) => (
            <text key={i} x={x} y={y-6} textAnchor="middle" fill="#00e676" fontSize={9} fontFamily="'Share Tech Mono',monospace">HH{i+1}</text>
          ))}
        </g>
      );
    }

    if (type === "wyckoff-acc") {
      // Wyckoff Accumulation schema
      const pts = [
        [30,60],[60,110],[80,150],[120,180],[160,200],[200,185],[250,190],
        [290,175],[320,200],[360,195],[400,160],[440,120],[490,80],[540,40],
      ];
      const path = pts.map(([x,y],i) => `${i===0?"M":"L"}${x+20},${y}`).join(" ");

      return (
        <g>
          <path d={path} fill="none" stroke="#00e5ff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {/* Phase labels */}
          {[
            {x:55,y:95,t:"PS",c:"#546e7a"},{x:75,y:130,t:"SC",c:"#ff1744"},
            {x:115,y:155,t:"AR",c:"#00e676"},{x:195,y:168,t:"ST",c:"#546e7a"},
            {x:335,y:182,t:"Spring",c:"#ffd700"},{x:395,y:140,t:"SOS",c:"#00e676"},
            {x:455,y:100,t:"LPS",c:"#00e5ff"},{x:540,y:60,t:"Mark Up",c:"#00e676"},
          ].map(({x,y,t,c},i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={4} fill={c} opacity={0.9} />
              <text x={x} y={y-8} textAnchor="middle" fill={c} fontSize={9} fontFamily="'Share Tech Mono',monospace">{t}</text>
            </g>
          ))}
          {/* Phase bands */}
          {[
            {x:30,w:100,label:"FASE A",c:"rgba(255,23,68,0.1)"},
            {x:130,w:160,label:"FASE B",c:"rgba(0,229,255,0.06)"},
            {x:290,w:80,label:"FASE C",c:"rgba(255,215,0,0.1)"},
            {x:370,w:100,label:"FASE D",c:"rgba(0,230,118,0.08)"},
            {x:470,w:90,label:"FASE E",c:"rgba(0,230,118,0.12)"},
          ].map(({x,w,label,c},i) => (
            <g key={i}>
              <rect x={x+20} y={30} width={w} height={height-60} fill={c} />
              <text x={x+20+w/2} y={22} textAnchor="middle" fill="#546e7a" fontSize={8} fontFamily="'Share Tech Mono',monospace">{label}</text>
            </g>
          ))}
          <text x={310} y={235} textAnchor="middle" fill="#546e7a" fontSize={11} fontFamily="'Rajdhani',sans-serif">
            Esquema de Acumulación Wyckoff — Spring → SOS → Mark Up
          </text>
        </g>
      );
    }

    if (type === "wyckoff-dist") {
      const pts = [
        [30,200],[70,150],[100,110],[140,70],[180,50],[220,65],
        [260,55],[300,68],[340,52],[380,80],[420,120],[460,165],[510,200],[550,220],
      ];
      const path = pts.map(([x,y],i) => `${i===0?"M":"L"}${x},${y}`).join(" ");

      return (
        <g>
          <path d={path} fill="none" stroke="#ff6d00" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {[
            {x:135,y:55,t:"PSY",c:"#546e7a"},{x:175,y:35,t:"BC",c:"#ff1744"},
            {x:215,y:50,t:"AR",c:"#00e676"},{x:295,y:48,t:"UTAD",c:"#ff1744"},
            {x:380,y:65,t:"SOW",c:"#ff1744"},{x:425,y:105,t:"LPSY",c:"#ff6d00"},
            {x:530,y:185,t:"Mark Down",c:"#ff1744"},
          ].map(({x,y,t,c},i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={4} fill={c} opacity={0.9} />
              <text x={x} y={y-8} textAnchor="middle" fill={c} fontSize={9} fontFamily="'Share Tech Mono',monospace">{t}</text>
            </g>
          ))}
          <text x={290} y={240} textAnchor="middle" fill="#546e7a" fontSize={11} fontFamily="'Rajdhani',sans-serif">
            Esquema de Distribución Wyckoff — UTAD → SOW → Mark Down
          </text>
        </g>
      );
    }

    return null;
  };

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
          padding: "10px 0 4px",
          textTransform: "uppercase",
        }}>
          {title}
        </div>
      )}
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
        {renderContent()}
      </svg>
    </div>
  );
}
