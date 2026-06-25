import React, { useState } from "react";

type SchemaType = "accumulation" | "distribution";

/* ─── Shared helper ─────────────────────────────────────────────────────── */
function Candle({ x, o, h, l, c, w = 10 }: { x: number; o: number; h: number; l: number; c: number; w?: number }) {
  const col = c >= o ? "#00e676" : "#ff1744";
  const bTop = Math.min(o, c);
  const bH = Math.max(Math.abs(o - c), 2);
  return (
    <g>
      <line x1={x} y1={h} x2={x} y2={l} stroke={col} strokeWidth={1.2} />
      <rect x={x - w / 2} y={bTop} width={w} height={bH} fill={col} />
    </g>
  );
}

function Label({
  x, y, text, color = "#00e5ff", small = false, anchor = "middle",
}: {
  x: number; y: number; text: string; color?: string; small?: boolean; anchor?: "start" | "middle" | "end";
}) {
  return (
    <text
      x={x} y={y}
      fill={color}
      fontSize={small ? 8.5 : 10}
      fontFamily="'Share Tech Mono', monospace"
      textAnchor={anchor}
      letterSpacing={small ? 0.5 : 0.8}
    >
      {text}
    </text>
  );
}

function EventDot({ x, y, color, r = 4 }: { x: number; y: number; color: string; r?: number }) {
  return <circle cx={x} cy={y} r={r} fill={color} stroke="#0a0f18" strokeWidth={1} />;
}

function HorizLine({ x1, x2, y, color, dash = false }: { x1: number; x2: number; y: number; color: string; dash?: boolean }) {
  return (
    <line
      x1={x1} y1={y} x2={x2} y2={y}
      stroke={color} strokeWidth={0.8}
      strokeDasharray={dash ? "4 3" : undefined}
      opacity={0.7}
    />
  );
}

/* ─── ACCUMULATION SCHEMATIC ─────────────────────────────────────────────── */
function AccumulationChart() {
  const W = 760;
  const H = 320;

  // Price path (y axis: lower = higher price since SVG y=0 is top)
  // Phases: A(downtrend) → B(range) → C(spring) → D(SOS) → E(markup)
  // We'll draw candles along a price path

  const candles = [
    // Phase A: Downtrend — Preliminary Support (PS) + Selling Climax (SC) + AR + ST
    { x: 30,  o: 50,  h: 47,  l: 65,  c: 63 },  // down
    { x: 45,  o: 63,  h: 60,  l: 78,  c: 75 },  // down
    { x: 60,  o: 75,  h: 73,  l: 88,  c: 85 },  // PS zone — first buying
    { x: 75,  o: 85,  h: 83,  l: 108, c: 105 }, // Selling Climax spike down
    { x: 90,  o: 105, h: 103, l: 120, c: 117 }, // SC — climactic bottom
    { x: 105, o: 117, h: 90,  l: 119, c: 93 },  // AR — Automatic Rally
    { x: 120, o: 93,  h: 91,  l: 110, c: 107 }, // AR top
    // Phase B: Trading range — ST (Secondary Test)
    { x: 135, o: 107, h: 105, l: 118, c: 115 }, // decline to ST
    { x: 150, o: 115, h: 113, l: 119, c: 116 }, // ST (tests SC low, doesn't break)
    { x: 165, o: 116, h: 100, l: 118, c: 103 }, // bounce
    { x: 180, o: 103, h: 96,  l: 112, c: 99 },  // range midpoint
    { x: 195, o: 99,  h: 97,  l: 108, c: 105 }, // minor down
    { x: 210, o: 105, h: 96,  l: 107, c: 98 },  // range
    { x: 225, o: 98,  h: 95,  l: 106, c: 103 }, // SOS minor
    { x: 240, o: 103, h: 97,  l: 110, c: 100 }, // back down
    // Phase C: Spring
    { x: 255, o: 100, h: 97,  l: 124, c: 121 }, // Spring — breaks below SC
    { x: 270, o: 121, h: 108, l: 122, c: 110 }, // Spring rally
    // Phase D: SOS + LPS
    { x: 285, o: 110, h: 95,  l: 112, c: 97 },  // SOS — breaks above range
    { x: 300, o: 97,  h: 93,  l: 100, c: 95 },  // LPS — Last Point of Support
    { x: 315, o: 95,  h: 86,  l: 97,  c: 88 },  // markup begins
    // Phase E: Markup
    { x: 330, o: 88,  h: 80,  l: 90,  c: 82 },
    { x: 345, o: 82,  h: 72,  l: 84,  c: 74 },
    { x: 360, o: 74,  h: 62,  l: 76,  c: 64 },
    { x: 375, o: 64,  h: 52,  l: 66,  c: 54 },
    { x: 390, o: 54,  h: 42,  l: 56,  c: 44 },
  ];

  // Key level y-coords
  const SC_Y = 118;   // Selling Climax low
  const AR_Y = 91;    // Automatic Rally high
  const SPRING_Y = 124; // Spring low
  const RANGE_TOP = 91;
  const RANGE_BOT = 119;

  // Phase zones x ranges
  const phaseA = [22, 128];
  const phaseB = [128, 252];
  const phaseC = [252, 278];
  const phaseD = [278, 332];
  const phaseE = [332, 410];

  const phaseColors: Record<string, string> = {
    A: "#ff174420", B: "#7c4dff20", C: "#ff6d0020", D: "#00e67620", E: "#00e5ff20",
  };
  const phaseStroke: Record<string, string> = {
    A: "#ff174460", B: "#7c4dff60", C: "#ff6d0060", D: "#00e67660", E: "#00e5ff60",
  };
  const phaseLabel: Record<string, string> = {
    A: "#ff1744", B: "#7c4dff", C: "#ff6d00", D: "#00e676", E: "#00e5ff",
  };

  return (
    <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 380 }}>
      {/* Grid */}
      {[60, 100, 140, 180, 220, 260, 300].map(yy => (
        <line key={yy} x1={0} y1={yy} x2={W} y2={yy} stroke="#1a2535" strokeWidth={0.5} />
      ))}

      {/* Phase backgrounds */}
      {Object.entries({ A: phaseA, B: phaseB, C: phaseC, D: phaseD, E: phaseE }).map(([k, [x1, x2]]) => (
        <g key={k}>
          <rect x={x1} y={30} width={x2 - x1} height={H - 50} fill={phaseColors[k]} stroke={phaseStroke[k]} strokeWidth={0.5} />
          <text x={(x1 + x2) / 2} y={47} fill={phaseLabel[k]} fontSize={11}
            fontFamily="'Orbitron', monospace" textAnchor="middle" fontWeight="bold">
            {k}
          </text>
        </g>
      ))}

      {/* Phase label row */}
      {[
        { x: (phaseA[0] + phaseA[1]) / 2, text: "PARADA", color: "#ff1744" },
        { x: (phaseB[0] + phaseB[1]) / 2, text: "RANGO", color: "#7c4dff" },
        { x: (phaseC[0] + phaseC[1]) / 2, text: "TRAMPA", color: "#ff6d00" },
        { x: (phaseD[0] + phaseD[1]) / 2, text: "SOS", color: "#00e676" },
        { x: (phaseE[0] + phaseE[1]) / 2, text: "MARKUP", color: "#00e5ff" },
      ].map(l => (
        <text key={l.x} x={l.x} y={58} fill={l.color} fontSize={8} fontFamily="Rajdhani, sans-serif" textAnchor="middle" letterSpacing={1}>
          {l.text}
        </text>
      ))}

      {/* SC and AR horizontal levels */}
      <HorizLine x1={22} x2={408} y={SC_Y} color="#ff174488" dash />
      <HorizLine x1={22} x2={408} y={AR_Y} color="#00e67688" dash />
      <HorizLine x1={22} x2={408} y={SPRING_Y} color="#ff6d0088" dash />

      {/* Level labels */}
      <Label x={415} y={SC_Y + 3} text="SC" color="#ff1744" small anchor="start" />
      <Label x={415} y={AR_Y + 3} text="AR" color="#00e676" small anchor="start" />
      <Label x={415} y={SPRING_Y + 3} text="Spring" color="#ff6d00" small anchor="start" />

      {/* Candles */}
      {candles.map((c, i) => <Candle key={i} {...c} />)}

      {/* Event annotations */}
      {/* PS — Preliminary Support */}
      <EventDot x={60} y={88} color="#ffd700" />
      <Label x={60} y={82} text="PS" color="#ffd700" small />

      {/* SC — Selling Climax */}
      <EventDot x={90} y={120} color="#ff1744" r={5} />
      <Label x={90} y={130} text="SC" color="#ff1744" />

      {/* AR — Automatic Rally */}
      <EventDot x={107} y={90} color="#00e676" r={5} />
      <Label x={107} y={83} text="AR" color="#00e676" />

      {/* ST — Secondary Test */}
      <EventDot x={150} y={119} color="#ff6d00" />
      <Label x={150} y={129} text="ST" color="#ff6d00" small />

      {/* SOW — Sign of Weakness minor */}
      <EventDot x={210} y={98} color="#e040fb" />
      <Label x={210} y={92} text="SOW?" color="#e040fb" small />

      {/* Spring */}
      <EventDot x={255} y={124} color="#ff6d00" r={6} />
      <Label x={255} y={136} text="SPRING" color="#ff6d00" />

      {/* Test of Spring */}
      <EventDot x={270} y={122} color="#ffd700" />
      <Label x={270} y={132} text="T.Spring" color="#ffd700" small />

      {/* SOS — Sign of Strength */}
      <EventDot x={285} y={95} color="#00e676" r={5} />
      <Label x={285} y={87} text="SOS" color="#00e676" />

      {/* LPS — Last Point of Support */}
      <EventDot x={300} y={95} color="#00e5ff" r={5} />
      <Label x={300} y={103} text="LPS" color="#00e5ff" />

      {/* BU — Back Up to Range top */}
      <Label x={315} y={82} text="BU" color="#00e5ff" small />

      {/* Markup arrow */}
      <line x1={385} y1={80} x2={385} y2={44} stroke="#00e676" strokeWidth={2} />
      <polygon points="381,47 385,38 389,47" fill="#00e676" />
      <Label x={395} y={52} text="MARKUP" color="#00e676" small anchor="start" />

      {/* Range bracket */}
      <line x1={448} y1={AR_Y} x2={448} y2={SC_Y} stroke="#546e7a" strokeWidth={1} />
      <line x1={444} y1={AR_Y} x2={452} y2={AR_Y} stroke="#546e7a" strokeWidth={1} />
      <line x1={444} y1={SC_Y} x2={452} y2={SC_Y} stroke="#546e7a" strokeWidth={1} />
      <Label x={455} y={(AR_Y + SC_Y) / 2 + 3} text="RANGO" color="#546e7a" small anchor="start" />
      <Label x={455} y={(AR_Y + SC_Y) / 2 + 14} text="ACUM." color="#546e7a" small anchor="start" />

      {/* Volume bars (low volume in range, high at SC and SOS) */}
      {[
        { x: 30,  h: 8,  color: "#ff1744" }, { x: 45,  h: 12, color: "#ff1744" },
        { x: 60,  h: 14, color: "#ff1744" }, { x: 75,  h: 10, color: "#ff1744" },
        { x: 90,  h: 28, color: "#00e676" }, // SC — huge volume
        { x: 105, h: 20, color: "#00e676" }, { x: 120, h: 16, color: "#ff1744" },
        { x: 135, h: 8,  color: "#ff1744" }, { x: 150, h: 6,  color: "#ff1744" }, // ST — low vol
        { x: 165, h: 7,  color: "#00e676" }, { x: 180, h: 6,  color: "#ff1744" },
        { x: 195, h: 5,  color: "#ff1744" }, { x: 210, h: 7,  color: "#ff1744" },
        { x: 225, h: 8,  color: "#00e676" }, { x: 240, h: 6,  color: "#ff1744" },
        { x: 255, h: 10, color: "#ff1744" }, // Spring — low-med vol
        { x: 270, h: 9,  color: "#00e676" },
        { x: 285, h: 20, color: "#00e676" }, // SOS — expanding volume
        { x: 300, h: 10, color: "#ff1744" }, { x: 315, h: 18, color: "#00e676" },
        { x: 330, h: 22, color: "#00e676" }, { x: 345, h: 20, color: "#00e676" },
        { x: 360, h: 18, color: "#00e676" }, { x: 375, h: 22, color: "#00e676" },
      ].map((v, i) => (
        <rect key={i} x={v.x - 5} y={H - 8 - v.h} width={10} height={v.h} fill={v.color} opacity={0.5} />
      ))}
      <Label x={20} y={H - 8} text="VOL" color="#546e7a" small anchor="start" />

      {/* Title */}
      <Label x={W / 2} y={22} text="WYCKOFF — ESQUEMA DE ACUMULACIÓN" color="#00e5ff" />
    </svg>
  );
}

/* ─── DISTRIBUTION SCHEMATIC ─────────────────────────────────────────────── */
function DistributionChart() {
  const W = 760;
  const H = 320;

  const candles = [
    // Phase A: Uptrend stops — PSY + BC + AR + ST
    { x: 30,  o: 265, h: 260, l: 250, c: 255 },
    { x: 45,  o: 255, h: 248, l: 242, c: 246 },
    { x: 60,  o: 246, h: 238, l: 232, c: 234 }, // PSY zone
    { x: 75,  o: 234, h: 218, l: 228, c: 220 }, // Buying Climax spike
    { x: 90,  o: 220, h: 210, l: 218, c: 213 }, // BC top
    { x: 105, o: 213, h: 222, l: 210, c: 220 }, // AR down
    { x: 120, o: 220, h: 228, l: 218, c: 226 }, // AR up
    // Phase B: Trading range — ST
    { x: 135, o: 226, h: 220, l: 232, c: 222 }, // ST — tests BC high
    { x: 150, o: 222, h: 220, l: 223, c: 221 }, // ST (near BC high, no breakout)
    { x: 165, o: 221, h: 225, l: 220, c: 224 }, // bounce
    { x: 180, o: 224, h: 230, l: 222, c: 228 }, // SOW minor
    { x: 195, o: 228, h: 224, l: 230, c: 226 }, // back up
    { x: 210, o: 226, h: 222, l: 229, c: 225 }, // range oscillation
    { x: 225, o: 225, h: 228, l: 222, c: 226 }, // UT (minor)
    { x: 240, o: 226, h: 231, l: 226, c: 229 }, // up test
    // Phase C: UTAD
    { x: 255, o: 229, h: 210, l: 231, c: 213 }, // UTAD spike UP above BC
    { x: 270, o: 213, h: 220, l: 212, c: 218 }, // UTAD rejection
    // Phase D: SOW + LPSY
    { x: 285, o: 218, h: 224, l: 215, c: 222 }, // SOW — breaks below range
    { x: 300, o: 222, h: 219, l: 226, c: 222 }, // LPSY — Last Point Supply
    { x: 315, o: 222, h: 224, l: 230, c: 228 }, // markdown begins
    // Phase E: Markdown
    { x: 330, o: 228, h: 230, l: 242, c: 240 },
    { x: 345, o: 240, h: 242, l: 256, c: 254 },
    { x: 360, o: 254, h: 256, l: 270, c: 268 },
    { x: 375, o: 268, h: 270, l: 285, c: 282 },
    { x: 390, o: 282, h: 284, l: 298, c: 295 },
  ];

  const BC_Y = 210;   // Buying Climax high
  const AR_Y = 228;   // Automatic Reaction low
  const UTAD_Y = 210; // UTAD spike (same as BC)

  const phaseA = [22, 128];
  const phaseB = [128, 252];
  const phaseC = [252, 278];
  const phaseD = [278, 332];
  const phaseE = [332, 410];

  const phaseColors: Record<string, string> = {
    A: "#ff174420", B: "#7c4dff20", C: "#ff6d0020", D: "#00e67620", E: "#00e5ff20",
  };
  const phaseStroke: Record<string, string> = {
    A: "#ff174460", B: "#7c4dff60", C: "#ff6d0060", D: "#00e67660", E: "#00e5ff60",
  };
  const phaseLabel: Record<string, string> = {
    A: "#ff1744", B: "#7c4dff", C: "#ff6d00", D: "#00e676", E: "#00e5ff",
  };

  return (
    <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 380 }}>
      {/* Grid */}
      {[80, 130, 180, 230, 280].map(yy => (
        <line key={yy} x1={0} y1={yy} x2={W} y2={yy} stroke="#1a2535" strokeWidth={0.5} />
      ))}

      {/* Phase backgrounds */}
      {Object.entries({ A: phaseA, B: phaseB, C: phaseC, D: phaseD, E: phaseE }).map(([k, [x1, x2]]) => (
        <g key={k}>
          <rect x={x1} y={30} width={x2 - x1} height={H - 50} fill={phaseColors[k]} stroke={phaseStroke[k]} strokeWidth={0.5} />
          <text x={(x1 + x2) / 2} y={47} fill={phaseLabel[k]} fontSize={11}
            fontFamily="'Orbitron', monospace" textAnchor="middle" fontWeight="bold">
            {k}
          </text>
        </g>
      ))}
      {[
        { x: (phaseA[0] + phaseA[1]) / 2, text: "PARADA", color: "#ff1744" },
        { x: (phaseB[0] + phaseB[1]) / 2, text: "RANGO", color: "#7c4dff" },
        { x: (phaseC[0] + phaseC[1]) / 2, text: "TRAMPA", color: "#ff6d00" },
        { x: (phaseD[0] + phaseD[1]) / 2, text: "SOW", color: "#00e676" },
        { x: (phaseE[0] + phaseE[1]) / 2, text: "MKDOWN", color: "#00e5ff" },
      ].map(l => (
        <text key={l.x} x={l.x} y={58} fill={l.color} fontSize={8} fontFamily="Rajdhani, sans-serif" textAnchor="middle" letterSpacing={1}>
          {l.text}
        </text>
      ))}

      {/* BC and AR level lines */}
      <HorizLine x1={22} x2={408} y={BC_Y} color="#ff174488" dash />
      <HorizLine x1={22} x2={408} y={AR_Y} color="#00e67688" dash />
      <Label x={415} y={BC_Y + 3} text="BC" color="#ff1744" small anchor="start" />
      <Label x={415} y={AR_Y + 3} text="AR" color="#00e676" small anchor="start" />

      {/* Candles */}
      {candles.map((c, i) => <Candle key={i} {...c} />)}

      {/* Event annotations */}
      {/* PSY — Preliminary Supply */}
      <EventDot x={60} y={232} color="#ffd700" />
      <Label x={60} y={243} text="PSY" color="#ffd700" small />

      {/* BC — Buying Climax */}
      <EventDot x={90} y={210} color="#ff1744" r={5} />
      <Label x={90} y={203} text="BC" color="#ff1744" />

      {/* AR — Automatic Reaction */}
      <EventDot x={107} y={220} color="#00e676" r={5} />
      <Label x={107} y={228} text="AR" color="#00e676" />

      {/* ST — Secondary Test */}
      <EventDot x={150} y={220} color="#ff6d00" />
      <Label x={150} y={213} text="ST" color="#ff6d00" small />

      {/* UT — Upthrust */}
      <EventDot x={225} y={222} color="#e040fb" />
      <Label x={225} y={215} text="UT" color="#e040fb" small />

      {/* SOW minor */}
      <EventDot x={180} y={230} color="#546e7a" />
      <Label x={180} y={238} text="SOW?" color="#546e7a" small />

      {/* UTAD — Upthrust After Distribution */}
      <EventDot x={255} y={210} color="#ff6d00" r={6} />
      <Label x={255} y={203} text="UTAD" color="#ff6d00" />

      {/* Test of UTAD */}
      <EventDot x={270} y={212} color="#ffd700" />
      <Label x={270} y={222} text="T.UTAD" color="#ffd700" small />

      {/* SOW — Sign of Weakness */}
      <EventDot x={285} y={222} color="#ff1744" r={5} />
      <Label x={285} y={232} text="SOW" color="#ff1744" />

      {/* LPSY — Last Point of Supply */}
      <EventDot x={300} y={222} color="#ff6d00" r={5} />
      <Label x={300} y={215} text="LPSY" color="#ff6d00" />

      {/* Markdown arrow */}
      <line x1={385} y1={260} x2={385} y2={295} stroke="#ff1744" strokeWidth={2} />
      <polygon points="381,292 385,301 389,292" fill="#ff1744" />
      <Label x={395} y={282} text="MKDOWN" color="#ff1744" small anchor="start" />

      {/* Range bracket */}
      <line x1={445} y1={BC_Y} x2={445} y2={AR_Y} stroke="#546e7a" strokeWidth={1} />
      <line x1={441} y1={BC_Y} x2={449} y2={BC_Y} stroke="#546e7a" strokeWidth={1} />
      <line x1={441} y1={AR_Y} x2={449} y2={AR_Y} stroke="#546e7a" strokeWidth={1} />
      <Label x={452} y={(BC_Y + AR_Y) / 2 + 3} text="RANGO" color="#546e7a" small anchor="start" />
      <Label x={452} y={(BC_Y + AR_Y) / 2 + 14} text="DIST." color="#546e7a" small anchor="start" />

      {/* Volume bars */}
      {[
        { x: 30,  h: 8,  color: "#00e676" }, { x: 45,  h: 12, color: "#00e676" },
        { x: 60,  h: 14, color: "#00e676" }, { x: 75,  h: 10, color: "#00e676" },
        { x: 90,  h: 28, color: "#ff1744" }, // BC — huge volume
        { x: 105, h: 20, color: "#ff1744" }, { x: 120, h: 16, color: "#00e676" },
        { x: 135, h: 6,  color: "#00e676" }, { x: 150, h: 5,  color: "#00e676" }, // ST low vol
        { x: 165, h: 7,  color: "#ff1744" }, { x: 180, h: 8,  color: "#ff1744" },
        { x: 195, h: 6,  color: "#00e676" }, { x: 210, h: 7,  color: "#00e676" },
        { x: 225, h: 8,  color: "#00e676" }, { x: 240, h: 7,  color: "#00e676" },
        { x: 255, h: 10, color: "#00e676" }, // UTAD
        { x: 270, h: 9,  color: "#ff1744" },
        { x: 285, h: 20, color: "#ff1744" }, // SOW
        { x: 300, h: 10, color: "#00e676" }, { x: 315, h: 18, color: "#ff1744" },
        { x: 330, h: 22, color: "#ff1744" }, { x: 345, h: 20, color: "#ff1744" },
        { x: 360, h: 18, color: "#ff1744" }, { x: 375, h: 22, color: "#ff1744" },
      ].map((v, i) => (
        <rect key={i} x={v.x - 5} y={H - 8 - v.h} width={10} height={v.h} fill={v.color} opacity={0.5} />
      ))}
      <Label x={20} y={H - 8} text="VOL" color="#546e7a" small anchor="start" />

      {/* Title */}
      <Label x={W / 2} y={22} text="WYCKOFF — ESQUEMA DE DISTRIBUCIÓN" color="#ff1744" />
    </svg>
  );
}

/* ─── COMPOSITE MAN SIMPLIFIED ──────────────────────────────────────────── */
function CompositeManChart() {
  const W = 760;
  const H = 180;

  const path = [
    // Accumulation (flat)
    [30, 130], [50, 125], [70, 132], [90, 127], [110, 134], [130, 128], [150, 133],
    // Markup
    [170, 115], [195, 95], [220, 75], [245, 58], [265, 45],
    // Distribution (flat at top)
    [285, 48], [305, 43], [325, 50], [345, 44], [365, 52], [385, 46], [405, 50],
    // Markdown
    [425, 68], [450, 88], [475, 108], [500, 128], [520, 142],
  ];

  const toD = (pts: number[][]) => pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");

  return (
    <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 380 }}>
      {/* Zones */}
      <rect x={22}  y={20} width={155} height={H - 30} fill="#7c4dff15" stroke="#7c4dff40" strokeWidth={0.5} />
      <rect x={165} y={20} width={110} height={H - 30} fill="#00e67615" stroke="#00e67640" strokeWidth={0.5} />
      <rect x={275} y={20} width={145} height={H - 30} fill="#ff174415" stroke="#ff174440" strokeWidth={0.5} />
      <rect x={420} y={20} width={115} height={H - 30} fill="#ff6d0015" stroke="#ff6d0040" strokeWidth={0.5} />

      {/* Zone labels */}
      {[
        { x: 95,  label: "ACUMULACIÓN", sub: "Smart Money COMPRA", color: "#7c4dff" },
        { x: 218, label: "MARKUP",       sub: "Precio sube",         color: "#00e676" },
        { x: 345, label: "DISTRIBUCIÓN", sub: "Smart Money VENDE",   color: "#ff1744" },
        { x: 475, label: "MARKDOWN",     sub: "Precio cae",          color: "#ff6d00" },
      ].map(z => (
        <g key={z.x}>
          <text x={z.x} y={36} fill={z.color} fontSize={9} fontFamily="'Orbitron', monospace" textAnchor="middle">{z.label}</text>
          <text x={z.x} y={48} fill={z.color} fontSize={8} fontFamily="Rajdhani, sans-serif" textAnchor="middle" opacity={0.7}>{z.sub}</text>
        </g>
      ))}

      {/* Price line */}
      <path d={toD(path)} fill="none" stroke="#00e5ff" strokeWidth={2.5} />

      {/* Dots at key transitions */}
      {[
        { x: 150, y: 133, color: "#7c4dff", label: "Spring" },
        { x: 265, y: 45,  color: "#00e676", label: "ATH Zone" },
        { x: 405, y: 50,  color: "#ff1744", label: "UTAD" },
        { x: 520, y: 142, color: "#ff6d00", label: "SC/SSL" },
      ].map(d => (
        <g key={d.x}>
          <circle cx={d.x} cy={d.y} r={5} fill={d.color} stroke="#0a0f18" strokeWidth={1} />
          <text x={d.x} y={d.y + (d.y > 100 ? 14 : -8)} fill={d.color} fontSize={8}
            fontFamily="'Share Tech Mono', monospace" textAnchor="middle">{d.label}</text>
        </g>
      ))}

      {/* "COMPOSITE MAN" annotation */}
      <text x={590} y={55} fill="#ffd700" fontSize={10} fontFamily="'Share Tech Mono', monospace">COMPOSITE MAN</text>
      {["Compra en acumulación", "Vende en distribución", "Crea las noticias", "El mercado le obedece"].map((t, i) => (
        <text key={i} x={590} y={70 + i * 14} fill="#546e7a" fontSize={9} fontFamily="Rajdhani, sans-serif">{t}</text>
      ))}

      <text x={W / 2} y={H - 8} fill="#546e7a" fontSize={8} fontFamily="Rajdhani, sans-serif" textAnchor="middle">
        Ciclo completo del mercado según Wyckoff — se repite en todos los timeframes
      </text>
    </svg>
  );
}

/* ─── MAIN EXPORT ────────────────────────────────────────────────────────── */
export function WyckoffChart({ schema = "accumulation" }: { schema?: SchemaType }) {
  const [active, setActive] = useState<SchemaType>(schema);

  return (
    <div>
      {/* Toggle */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {([["accumulation", "⬆ Acumulación", "#00e676"], ["distribution", "⬇ Distribución", "#ff1744"]] as const).map(
          ([s, label, color]) => (
            <button
              key={s}
              onClick={() => setActive(s)}
              style={{
                background: active === s ? `${color}22` : "var(--bg3)",
                border: `1px solid ${active === s ? color : "var(--border2)"}`,
                color: active === s ? color : "var(--muted)",
                padding: "6px 18px", fontSize: 11,
                fontFamily: "'Share Tech Mono', monospace", cursor: "pointer", letterSpacing: 1,
              }}
            >
              {label}
            </button>
          )
        )}
      </div>

      <div style={{ overflowX: "auto", marginBottom: 16 }}>
        {active === "accumulation" ? <AccumulationChart /> : <DistributionChart />}
      </div>

      {/* Event legend */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 8, marginBottom: 16,
      }}>
        {(active === "accumulation" ? [
          { abbr: "PS",     color: "#ffd700", name: "Preliminary Support",    desc: "Primera compra institucional que frena la caída. Volumen y spread aumentan." },
          { abbr: "SC",     color: "#ff1744", name: "Selling Climax",         desc: "Pánico masivo de venta. Volumen climático. Institucionales absorben TODA la oferta." },
          { abbr: "AR",     color: "#00e676", name: "Automatic Rally",        desc: "Rebote automático tras el SC — los vendedores se agotaron. Define el techo del rango." },
          { abbr: "ST",     color: "#ff6d00", name: "Secondary Test",         desc: "El precio vuelve al área del SC con menor volumen. Confirma el soporte." },
          { abbr: "Spring", color: "#ff6d00", name: "Spring (Trampa bajista)", desc: "El precio rompe bajo el soporte brevemente, caza stops, y revierte. Es el Sweep & Destroy." },
          { abbr: "SOS",    color: "#00e676", name: "Sign of Strength",       desc: "El precio rompe sobre el techo del rango con volumen expandido. Confirmación alcista." },
          { abbr: "LPS",    color: "#00e5ff", name: "Last Point of Support",  desc: "Último retroceso antes del markup. Zona de compra de alta probabilidad." },
          { abbr: "BU",     color: "#00e5ff", name: "Back-Up",               desc: "Retroceso final al techo del rango antes del markup. A veces = LPS." },
        ] : [
          { abbr: "PSY",  color: "#ffd700", name: "Preliminary Supply",       desc: "Primera venta institucional que frena el alza. El precio empieza a mostrar fatiga." },
          { abbr: "BC",   color: "#ff1744", name: "Buying Climax",            desc: "Compra climática masiva. Volumen enorme. Institucionales venden TODA su posición." },
          { abbr: "AR",   color: "#00e676", name: "Automatic Reaction",       desc: "Caída automática tras el BC — los compradores se agotaron. Define el piso del rango." },
          { abbr: "ST",   color: "#ff6d00", name: "Secondary Test",           desc: "El precio regresa al BC con menor volumen. Confirma la resistencia." },
          { abbr: "UT",   color: "#e040fb", name: "Upthrust",                 desc: "Falso breakout sobre el BC con bajo volumen. Señal de distribución en marcha." },
          { abbr: "UTAD", color: "#ff6d00", name: "Upthrust After Dist.",     desc: "Trampa alcista final — rompe sobre el BC brevemente y revierte. = Sweep & Destroy bajista." },
          { abbr: "SOW",  color: "#ff1744", name: "Sign of Weakness",         desc: "El precio rompe bajo el piso del rango con volumen. Confirmación bajista." },
          { abbr: "LPSY", color: "#ff6d00", name: "Last Point of Supply",     desc: "Último rebote antes del markdown. Zona de venta de alta probabilidad." },
        ]).map(e => (
          <div key={e.abbr} style={{
            background: "var(--bg3)", border: `1px solid ${e.color}44`,
            borderLeft: `3px solid ${e.color}`, padding: "8px 10px",
          }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: e.color }}>{e.abbr}</span>
              <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "Rajdhani" }}>{e.name}</span>
            </div>
            <div style={{ fontSize: 11, color: "#7a8fa0", lineHeight: 1.55 }}>{e.desc}</div>
          </div>
        ))}
      </div>

      {/* Composite Man cycle */}
      <div style={{ marginBottom: 8 }}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#ffd700",
          letterSpacing: 2, marginBottom: 10,
        }}>
          CICLO COMPLETO DEL COMPOSITE MAN
        </div>
        <div style={{ overflowX: "auto" }}>
          <CompositeManChart />
        </div>
      </div>
    </div>
  );
}
