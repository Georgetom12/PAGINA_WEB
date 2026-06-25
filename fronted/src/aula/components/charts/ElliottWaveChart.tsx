import React, { useState } from "react";

const Mono = "'Share Tech Mono', monospace";
const Sans = "'Rajdhani', sans-serif";
const Orb  = "'Orbitron', monospace";

type ViewType = "impulse" | "zigzag" | "flat" | "triangle" | "wxy" | "fractal";

const VIEWS: [ViewType, string][] = [
  ["impulse",  "📈 Impulso 1-2-3-4-5"],
  ["zigzag",   "⚡ Zigzag (5-3-5)"],
  ["flat",     "📦 Flat & Variantes"],
  ["triangle", "🔺 Triángulo A-B-C-D-E"],
  ["wxy",      "🌀 WXY · WXYXZ"],
  ["fractal",  "🔍 Fractal"],
];

const W = 700, H = 330;

// ── helpers ──────────────────────────────────────────────────────────────────
function dot(x: number, y: number, color: string, r = 6) {
  return <circle cx={x} cy={y} r={r} fill={color} stroke="#0a0f18" strokeWidth={1.5} />;
}
function lbl(
  x: number, y: number, text: string, color: string,
  size = 10, anchor: "middle" | "start" | "end" = "middle", dy = 0
) {
  return (
    <text x={x} y={y + dy} fill={color} fontSize={size} fontFamily={Mono}
      textAnchor={anchor} fontWeight="bold">{text}</text>
  );
}
function seg(x1: number, y1: number, x2: number, y2: number, color: string, w = 2.5) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} />;
}
function dash(x1: number, y1: number, x2: number, y2: number, color: string) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={0.8}
    strokeDasharray="4 3" />;
}
function grid() {
  return <>{[60, 120, 180, 240, 300].map(y =>
    <line key={y} x1={0} y1={y} x2={W} y2={y} stroke="#1a2535" strokeWidth={0.5} />
  )}</>;
}
function infoBox(x: number, y: number, w: number, h: number,
  title: string, lines: { text: string; color: string }[]) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#00000030" stroke="#1a2535" strokeWidth={0.5} rx={2} />
      <text x={x + w / 2} y={y + 14} fill="#ffd700" fontSize={9} fontFamily={Mono}
        textAnchor="middle" letterSpacing={0.5}>{title}</text>
      {lines.map((l, i) => (
        <text key={i} x={x + 8} y={y + 26 + i * 13} fill={l.color} fontSize={8}
          fontFamily={i % 2 === 0 ? Mono : Sans}>{l.text}</text>
      ))}
    </g>
  );
}

// ── views ────────────────────────────────────────────────────────────────────
function ImpulseView() {
  const pts = [
    { x: 50, y: 260, l: "0", c: "#546e7a" },
    { x: 130, y: 155, l: "1", c: "#00e676" },
    { x: 180, y: 210, l: "2", c: "#ff1744" },
    { x: 305, y: 75,  l: "3", c: "#00e5ff" },
    { x: 365, y: 130, l: "4", c: "#ff6d00" },
    { x: 465, y: 55,  l: "5", c: "#ffd700" },
  ];
  const segs = [
    [pts[0], pts[1], "#00e676", 3],
    [pts[1], pts[2], "#ff1744", 2.5],
    [pts[2], pts[3], "#00e5ff", 3.5],
    [pts[3], pts[4], "#ff6d00", 2.5],
    [pts[4], pts[5], "#ffd700", 3],
  ] as const;

  return (
    <g>
      <text x={W / 2} y={20} fill="#00e5ff" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>
        ONDA IMPULSIVA — 5 ONDAS (1-2-3-4-5)
      </text>
      {segs.map(([a, b, col, w], i) =>
        <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={col as string} strokeWidth={w as number} />
      )}
      {/* Fib guides */}
      {dash(130, 155, 470, 155, "#00e67633")}
      {dash(50,  260, 470, 260, "#ff174433")}
      <text x={472} y={159} fill="#00e676" fontSize={7} fontFamily={Mono}>Onda 1 top</text>
      {/* Labels */}
      {pts.map((p, i) => (
        <g key={i}>
          {dot(p.x, p.y, p.c)}
          <text x={p.x} y={p.y + (p.y < 160 ? -12 : 16)} fill={p.c} fontSize={10}
            fontFamily={Mono} textAnchor="middle" fontWeight="bold">{p.l}</text>
        </g>
      ))}
      {infoBox(490, 28, 198, 210, "REGLAS + FIBONACCI", [
        { text: "REGLAS OBLIGATORIAS:", color: "#ffd700" },
        { text: "• Onda 2 ≠ baja > 100% de onda 1", color: "#ff1744" },
        { text: "• Onda 3 ≠ la más corta", color: "#00e5ff" },
        { text: "• Onda 4 no solapa onda 1", color: "#ff6d00" },
        { text: "", color: "" },
        { text: "GUÍAS FIBONACCI:", color: "#ffd700" },
        { text: "Onda 2 → 50%, 61.8% de onda 1", color: "#00e676" },
        { text: "Onda 3 → 161.8%-261.8% onda 1", color: "#00e5ff" },
        { text: "Onda 4 → 23.6%-38.2% onda 3", color: "#ff6d00" },
        { text: "Onda 5 → 100% onda 1 (típico)", color: "#ffd700" },
        { text: "", color: "" },
        { text: "ESTRUCTURA INTERNA:", color: "#ffd700" },
        { text: "Ondas 1,3,5 → impulso (5 sub-ondas)", color: "#00e676" },
        { text: "Ondas 2,4 → corrección (3 sub-ondas)", color: "#ff1744" },
      ])}
      <text x={10} y={H - 5} fill="#546e7a" fontSize={8} fontFamily={Sans}>
        La onda 3 nunca es la más corta. Suele extenderse al 161.8%-261.8% de onda 1. Es donde ganan los trend-followers.
      </text>
    </g>
  );
}

function ZigzagView() {
  // Zigzag 5-3-5 — A impulso, B retroceso 38-50%, C impulso ≈ A
  const top = { x: 50, y: 60 };
  const aBot = { x: 185, y: 230 };
  const bTop = { x: 265, y: 135 };
  const cBot = { x: 410, y: 250 };

  // 5 sub-waves inside A (micro)
  const aSubs = [
    { x: 50, y: 60 }, { x: 75, y: 95 }, { x: 90, y: 82 },
    { x: 130, y: 155 }, { x: 148, y: 140 }, { x: 185, y: 230 },
  ];
  // 3 sub-waves inside B
  const bSubs = [
    { x: 185, y: 230 }, { x: 218, y: 190 }, { x: 240, y: 205 }, { x: 265, y: 135 },
  ];
  // 5 sub-waves inside C
  const cSubs = [
    { x: 265, y: 135 }, { x: 290, y: 170 }, { x: 308, y: 158 },
    { x: 355, y: 215 }, { x: 375, y: 202 }, { x: 410, y: 250 },
  ];

  return (
    <g>
      <text x={W / 2} y={20} fill="#ff1744" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>
        ZIGZAG — CORRECCIÓN 5-3-5 (SHARP)
      </text>

      {/* Sub-wave micro paths */}
      <polyline points={aSubs.map(p => `${p.x},${p.y}`).join(" ")}
        fill="none" stroke="#ff174488" strokeWidth={1.5} strokeDasharray="2 1" />
      <polyline points={bSubs.map(p => `${p.x},${p.y}`).join(" ")}
        fill="none" stroke="#00e67688" strokeWidth={1.5} strokeDasharray="2 1" />
      <polyline points={cSubs.map(p => `${p.x},${p.y}`).join(" ")}
        fill="none" stroke="#ff174488" strokeWidth={1.5} strokeDasharray="2 1" />

      {/* Main segments */}
      {seg(top.x, top.y, aBot.x, aBot.y, "#ff1744", 3)}
      {seg(aBot.x, aBot.y, bTop.x, bTop.y, "#00e676", 2.5)}
      {seg(bTop.x, bTop.y, cBot.x, cBot.y, "#ff1744", 3)}

      {/* Fib lines */}
      {dash(aBot.x, aBot.y, cBot.x + 20, aBot.y, "#ff174444")}
      {dash(top.x, top.y, bTop.x + 20, top.y, "#00e67644")}
      {/* B retraces 38-50% of A */}
      {dash(aBot.x, aBot.y, bTop.x, aBot.y, "#ffd70033")}
      <text x={bTop.x + 5} y={bTop.y - 5} fill="#00e676" fontSize={7} fontFamily={Mono}>
        B retrocede 38-50% de A
      </text>
      <text x={cBot.x + 5} y={aBot.y + 3} fill="#ff1744" fontSize={7} fontFamily={Mono}>
        C = 100%-161.8% de A
      </text>

      {/* Main labels */}
      {[
        { p: top,  l: "Top",  c: "#546e7a", up: true  },
        { p: aBot, l: "A",    c: "#ff1744", up: false },
        { p: bTop, l: "B",    c: "#00e676", up: true  },
        { p: cBot, l: "C",    c: "#ff1744", up: false },
      ].map((item, i) => (
        <g key={i}>
          {dot(item.p.x, item.p.y, item.c)}
          <text x={item.p.x} y={item.p.y + (item.up ? -12 : 16)}
            fill={item.c} fontSize={11} fontFamily={Mono} textAnchor="middle" fontWeight="bold">
            {item.l}
          </text>
        </g>
      ))}

      {/* Sub-wave count bubbles */}
      {[
        { x: 118, y: 148, text: "5 sub-ondas", c: "#ff174488" },
        { x: 222, y: 168, text: "3 sub-ondas", c: "#00e67688" },
        { x: 335, y: 185, text: "5 sub-ondas", c: "#ff174488" },
      ].map((b, i) => (
        <text key={i} x={b.x} y={b.y} fill={b.c} fontSize={7} fontFamily={Mono} textAnchor="middle">{b.text}</text>
      ))}

      {infoBox(445, 28, 240, 240, "ZIGZAG — CARACTERÍSTICAS", [
        { text: "Estructura: A(5) - B(3) - C(5)", color: "#00e5ff" },
        { text: "Es la corrección MÁS PROFUNDA", color: "#ff6d00" },
        { text: "", color: "" },
        { text: "Onda A: 5 sub-ondas bajistas", color: "#ff1744" },
        { text: "(impulso — no bounces fáciles)", color: "#546e7a" },
        { text: "Onda B: 3 sub-ondas alcistas", color: "#00e676" },
        { text: "B retrocede 38%-50% de A", color: "#546e7a" },
        { text: "Onda C: 5 sub-ondas bajistas", color: "#ff1744" },
        { text: "C = 100%-161.8% de A", color: "#546e7a" },
        { text: "", color: "" },
        { text: "CUÁNDO APARECE:", color: "#ffd700" },
        { text: "• En posición de onda 2", color: "#00e676" },
        { text: "• En posición de onda A", color: "#00e676" },
        { text: "• En posición de W o Y", color: "#00e676" },
        { text: "", color: "" },
        { text: "SEÑAL: B no supera el 61.8%", color: "#ffd700" },
        { text: "de A → confirma zigzag", color: "#ffd700" },
      ])}
    </g>
  );
}

function FlatView() {
  // Show 3 flat variants side by side (mini panels)
  const panelW = 200, panelH = 260, gap = 20, startX = 15, startY = 35;

  const flats = [
    {
      name: "REGULAR FLAT",
      sub:  "3-3-5",
      color: "#00e5ff",
      pts: [
        { x: 15,  y: 50, l: "Top",  c: "#546e7a", up: true  },
        { x: 60,  y: 145, l: "A",   c: "#ff1744", up: false },
        { x: 115, y: 55,  l: "B",   c: "#00e676", up: true  },
        { x: 175, y: 150, l: "C",   c: "#ff1744", up: false },
      ],
      rules: ["A: 3 sub-ondas", "B ≈ top de onda 5", "C ≈ A (100%)", "Corrección lateral"],
    },
    {
      name: "EXPANDED FLAT",
      sub:  "3-3-5  (irregular)",
      color: "#e040fb",
      pts: [
        { x: 15,  y: 75,  l: "Top",  c: "#546e7a", up: true  },
        { x: 60,  y: 170, l: "A",    c: "#ff1744", up: false },
        { x: 115, y: 40,  l: "B",    c: "#00e676", up: true  },
        { x: 175, y: 195, l: "C",    c: "#ff1744", up: false },
      ],
      rules: ["A: 3 sub-ondas", "B SUPERA el top 5", "C > A (138.2%)", "La más engañosa"],
    },
    {
      name: "RUNNING FLAT",
      sub:  "3-3-5  (bullish)",
      color: "#ffd700",
      pts: [
        { x: 15,  y: 75,  l: "Top",  c: "#546e7a", up: true  },
        { x: 60,  y: 170, l: "A",    c: "#ff1744", up: false },
        { x: 115, y: 40,  l: "B",    c: "#00e676", up: true  },
        { x: 175, y: 140, l: "C",    c: "#ff9900", up: false },
      ],
      rules: ["A: 3 sub-ondas", "B SUPERA el top 5", "C NO llega a A", "Mercado muy fuerte"],
    },
  ];

  return (
    <g>
      <text x={W / 2} y={20} fill="#ff6d00" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>
        FLAT — 3 VARIANTES (3-3-5)
      </text>

      {flats.map((flat, fi) => {
        const ox = startX + fi * (panelW + gap); // panel offset X
        const oy = startY; // panel offset Y

        return (
          <g key={fi} transform={`translate(${ox}, ${oy})`}>
            {/* Panel background */}
            <rect x={0} y={0} width={panelW} height={panelH}
              fill="#0a0f1855" stroke={flat.color + "55"} strokeWidth={1} rx={3} />

            {/* Panel title */}
            <text x={panelW / 2} y={16} fill={flat.color} fontSize={8.5} fontFamily={Mono}
              textAnchor="middle" fontWeight="bold">{flat.name}</text>
            <text x={panelW / 2} y={27} fill="#546e7a" fontSize={7} fontFamily={Mono}
              textAnchor="middle">{flat.sub}</text>

            {/* Segments */}
            {flat.pts.slice(0, -1).map((p, i) => {
              const next = flat.pts[i + 1];
              const col = i === 1 ? "#00e676" : "#ff1744";
              return <line key={i} x1={p.x} y1={p.y} x2={next.x} y2={next.y}
                stroke={col} strokeWidth={2.5} />;
            })}

            {/* B level dashed line */}
            {fi === 1 && dash(0, 40, panelW, 40, "#e040fb44")}
            {fi === 1 && <text x={4} y={37} fill="#e040fb" fontSize={6} fontFamily={Mono}>B supera top →</text>}
            {fi === 2 && dash(0, 40, panelW, 40, "#ffd70044")}
            {fi === 2 && dash(0, 170, panelW, 170, "#ff174444")}
            {fi === 2 && <text x={4} y={167} fill="#ff1744" fontSize={6} fontFamily={Mono}>C no llega a A →</text>}

            {/* Dots & labels */}
            {flat.pts.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={5} fill={p.c} stroke="#0a0f18" strokeWidth={1} />
                <text x={p.x} y={p.y + (p.up ? -10 : 14)} fill={p.c} fontSize={9}
                  fontFamily={Mono} textAnchor="middle" fontWeight="bold">{p.l}</text>
              </g>
            ))}

            {/* Rules */}
            <rect x={4} y={210} width={panelW - 8} height={46} fill="#00000033" stroke="#1a253577" strokeWidth={0.5} rx={2} />
            {flat.rules.map((r, i) => (
              <text key={i} x={8} y={222 + i * 11} fill={i === 3 ? flat.color : "#7a8fa0"}
                fontSize={7} fontFamily={i === 3 ? Mono : Sans}>{r}</text>
            ))}
          </g>
        );
      })}

      <text x={10} y={H - 4} fill="#546e7a" fontSize={8} fontFamily={Sans}>
        Clave: en la Expanded Flat, la onda B supera el máximo anterior — es una trampa alcista clásica. La onda C siempre tiene 5 sub-ondas.
      </text>
    </g>
  );
}

function TriangleView() {
  // Contracting triangle ABCDE + thrust
  // Converging upper (B-D) and lower (A-C-E) trendlines
  const pts = {
    start: { x: 50, y: 65 },   // pivot before triangle (end of prev wave)
    A: { x: 50, y: 65 },
    Aend: { x: 140, y: 225 },
    B: { x: 140, y: 225 },
    Bend: { x: 230, y: 110 },
    C: { x: 230, y: 110 },
    Cend: { x: 305, y: 195 },
    D: { x: 305, y: 195 },
    Dend: { x: 370, y: 135 },
    E: { x: 370, y: 135 },
    Eend: { x: 405, y: 170 },  // E-end / apex zone
    thrust: { x: 470, y: 65 },  // thrust after triangle
  };

  const segDefs = [
    { x1: pts.A.x, y1: pts.A.y, x2: pts.Aend.x, y2: pts.Aend.y, col: "#ff1744", w: 2.5, lbl: "A" },
    { x1: pts.Bend.x - 90, y1: pts.B.y, x2: pts.Bend.x, y2: pts.Bend.y, col: "#00e676", w: 2.5, lbl: "B" },
    { x1: pts.C.x, y1: pts.C.y, x2: pts.Cend.x, y2: pts.Cend.y, col: "#ff1744", w: 2.5, lbl: "C" },
    { x1: pts.D.x, y1: pts.D.y, x2: pts.Dend.x, y2: pts.Dend.y, col: "#00e676", w: 2.5, lbl: "D" },
    { x1: pts.E.x, y1: pts.E.y, x2: pts.Eend.x, y2: pts.Eend.y, col: "#ff1744", w: 2.5, lbl: "E" },
  ];

  const dots = [
    { p: pts.Aend, l: "A", c: "#ff1744", up: false },
    { p: pts.Bend, l: "B", c: "#00e676", up: true  },
    { p: pts.Cend, l: "C", c: "#ff1744", up: false },
    { p: pts.Dend, l: "D", c: "#00e676", up: true  },
    { p: pts.Eend, l: "E", c: "#e040fb", up: false },
    { p: pts.thrust, l: "Thrust", c: "#ffd700", up: true },
  ];

  return (
    <g>
      <text x={W / 2} y={20} fill="#e040fb" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>
        TRIÁNGULO — CORRECCIÓN A-B-C-D-E (3-3-3-3-3)
      </text>

      {/* Converging trendlines */}
      {dash(pts.A.x, pts.A.y, pts.Dend.x + 40, pts.Dend.y - 15, "#e040fb55")}    {/* upper: A-B top → D top */}
      {dash(pts.Aend.x, pts.Aend.y, pts.Eend.x + 20, pts.Eend.y + 10, "#e040fb55")} {/* lower: A bot → E */}
      <text x={pts.A.x + 5} y={pts.A.y - 6} fill="#e040fb" fontSize={7} fontFamily={Mono}>línea superior (B-D)</text>
      <text x={pts.Aend.x + 5} y={pts.Aend.y + 9} fill="#e040fb" fontSize={7} fontFamily={Mono}>línea inferior (A-C-E)</text>

      {/* Wave segments */}
      {seg(pts.A.x, pts.A.y, pts.Aend.x, pts.Aend.y, "#ff1744", 2.5)}
      {seg(pts.Aend.x, pts.Aend.y, pts.Bend.x, pts.Bend.y, "#00e676", 2.5)}
      {seg(pts.Bend.x, pts.Bend.y, pts.Cend.x, pts.Cend.y, "#ff1744", 2.5)}
      {seg(pts.Cend.x, pts.Cend.y, pts.Dend.x, pts.Dend.y, "#00e676", 2.5)}
      {seg(pts.Dend.x, pts.Dend.y, pts.Eend.x, pts.Eend.y, "#e040fb", 2.5)}
      {/* Thrust after triangle */}
      {seg(pts.Eend.x, pts.Eend.y, pts.thrust.x, pts.thrust.y, "#ffd700", 3.5)}
      <text x={436} y={100} fill="#ffd700" fontSize={8} fontFamily={Mono}>THRUST</text>
      <text x={436} y={112} fill="#546e7a" fontSize={7} fontFamily={Sans}>≈ ancho del triángulo</text>

      {/* "Apex" annotation */}
      <text x={pts.Eend.x - 12} y={pts.Eend.y + 18} fill="#e040fb" fontSize={7} fontFamily={Mono}>APEX</text>

      {/* Dots */}
      {dots.map((d, i) => (
        <g key={i}>
          {dot(d.p.x, d.p.y, d.c)}
          <text x={d.p.x} y={d.p.y + (d.up ? -12 : 16)} fill={d.c} fontSize={10}
            fontFamily={Mono} textAnchor="middle" fontWeight="bold">{d.l}</text>
        </g>
      ))}

      {infoBox(490, 28, 198, 260, "TRIÁNGULOS — 4 TIPOS", [
        { text: "① CONTRÁCTIL (más común)", color: "#e040fb" },
        { text: "  Líneas convergen → apex", color: "#546e7a" },
        { text: "  Cada onda < la anterior", color: "#546e7a" },
        { text: "", color: "" },
        { text: "② BARRERA", color: "#00e5ff" },
        { text: "  Línea inferior horizontal", color: "#546e7a" },
        { text: "  B-D en línea plana", color: "#546e7a" },
        { text: "", color: "" },
        { text: "③ EXPANSIVO (raro)", color: "#ff6d00" },
        { text: "  Líneas divergen", color: "#546e7a" },
        { text: "  Cada onda > la anterior", color: "#546e7a" },
        { text: "", color: "" },
        { text: "④ RUNNING", color: "#ffd700" },
        { text: "  Onda B supera inicio A", color: "#546e7a" },
        { text: "", color: "" },
        { text: "POSICIÓN: onda 4, onda B,", color: "#ffd700" },
        { text: "onda X o onda Y", color: "#ffd700" },
        { text: "Thrust ≈ anchura del triángulo", color: "#00e676" },
      ])}

      <text x={10} y={H - 4} fill="#546e7a" fontSize={8} fontFamily={Sans}>
        Cada sub-onda del triángulo es una corrección de 3 ondas. La onda E es una trampa — after E viene el THRUST explosivo.
      </text>
    </g>
  );
}

function WXYView() {
  // Left panel: Double Three (W-X-Y)
  // Right panel: Triple Three (W-X-Y-X-Z)

  const dbl = {
    start: { x: 15, y: 40 },
    Wend:  { x: 85, y: 175 },
    Xend:  { x: 135, y: 115 },
    Yend:  { x: 210, y: 200 },
  };

  const tri = {
    start: { x: 260, y: 40 },
    Wend:  { x: 305, y: 155 },
    X1end: { x: 340, y: 105 },
    Yend:  { x: 385, y: 165 },
    X2end: { x: 420, y: 120 },
    Zend:  { x: 465, y: 175 },
  };

  return (
    <g>
      <text x={W / 2} y={20} fill="#00e5ff" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>
        DOBLE TRES (W-X-Y) &amp; TRIPLE TRES (W-X-Y-X-Z)
      </text>

      {/* ── Double Three ── */}
      <rect x={8} y={28} width={240} height={260} fill="#0a0f1844" stroke="#00e5ff22" strokeWidth={1} rx={3} />
      <text x={128} y={42} fill="#00e5ff" fontSize={8.5} fontFamily={Mono} textAnchor="middle">DOBLE TRES (WXY)</text>

      {seg(dbl.start.x, dbl.start.y, dbl.Wend.x, dbl.Wend.y, "#ff1744", 3)}
      {seg(dbl.Wend.x, dbl.Wend.y, dbl.Xend.x, dbl.Xend.y, "#00e676", 2.5)}
      {seg(dbl.Xend.x, dbl.Xend.y, dbl.Yend.x, dbl.Yend.y, "#ff6d00", 3)}

      {/* W internal (zigzag hint) */}
      {[dbl.start, { x: 40, y: 88 }, { x: 60, y: 72 }, dbl.Wend].map((p, i, arr) =>
        i < arr.length - 1
          ? <line key={i} x1={p.x} y1={p.y} x2={arr[i + 1].x} y2={arr[i + 1].y}
              stroke="#ff174455" strokeWidth={1} strokeDasharray="2 1" />
          : null
      )}
      {/* Y internal (flat hint) */}
      {[dbl.Xend, { x: 158, y: 155 }, { x: 182, y: 125 }, dbl.Yend].map((p, i, arr) =>
        i < arr.length - 1
          ? <line key={i} x1={p.x} y1={p.y} x2={arr[i + 1].x} y2={arr[i + 1].y}
              stroke="#ff6d0055" strokeWidth={1} strokeDasharray="2 1" />
          : null
      )}

      {[
        { p: dbl.start, l: "Top", c: "#546e7a", up: true  },
        { p: dbl.Wend,  l: "W",   c: "#ff1744", up: false },
        { p: dbl.Xend,  l: "X",   c: "#00e676", up: true  },
        { p: dbl.Yend,  l: "Y",   c: "#ff6d00", up: false },
      ].map((d, i) => (
        <g key={i}>
          {dot(d.p.x, d.p.y, d.c, 5)}
          <text x={d.p.x} y={d.p.y + (d.up ? -11 : 15)} fill={d.c} fontSize={10}
            fontFamily={Mono} textAnchor="middle" fontWeight="bold">{d.l}</text>
        </g>
      ))}

      <text x={50}  y={124} fill="#ff174477" fontSize={7} fontFamily={Mono}>zigzag/flat</text>
      <text x={158} y={148} fill="#ff6d0077" fontSize={7} fontFamily={Mono}>zigzag/flat/△</text>
      <text x={87}  y={110} fill="#00e67677" fontSize={7} fontFamily={Mono}>shallow X</text>

      {/* Rules box inside panel */}
      <rect x={12} y={218} width={232} height={66} fill="#00000033" stroke="#1a253577" strokeWidth={0.5} rx={2} />
      {[
        { t: "W: zigzag, flat o triángulo",    c: "#ff1744" },
        { t: "X: corrección simple (shallow)",  c: "#00e676" },
        { t: "Y: zigzag, flat o triángulo",     c: "#ff6d00" },
        { t: "Y ≠ superar inicio de W",          c: "#ffd700" },
        { t: "Aparece en onda 2, 4, B, Y",      c: "#546e7a" },
      ].map((r, i) =>
        <text key={i} x={16} y={230 + i * 11} fill={r.c} fontSize={7.5} fontFamily={i % 2 === 0 ? Mono : Sans}>{r.t}</text>
      )}

      {/* ── Triple Three ── */}
      <rect x={252} y={28} width={228} height={260} fill="#0a0f1844" stroke="#e040fb22" strokeWidth={1} rx={3} />
      <text x={366} y={42} fill="#e040fb" fontSize={8.5} fontFamily={Mono} textAnchor="middle">TRIPLE TRES (WXYXZ)</text>

      {seg(tri.start.x, tri.start.y, tri.Wend.x, tri.Wend.y, "#ff1744", 2.5)}
      {seg(tri.Wend.x, tri.Wend.y, tri.X1end.x, tri.X1end.y, "#00e676", 2)}
      {seg(tri.X1end.x, tri.X1end.y, tri.Yend.x, tri.Yend.y, "#ff6d00", 2.5)}
      {seg(tri.Yend.x, tri.Yend.y, tri.X2end.x, tri.X2end.y, "#00e676", 2)}
      {seg(tri.X2end.x, tri.X2end.y, tri.Zend.x, tri.Zend.y, "#e040fb", 2.5)}

      {[
        { p: tri.start, l: "Top", c: "#546e7a", up: true  },
        { p: tri.Wend,  l: "W",   c: "#ff1744", up: false },
        { p: tri.X1end, l: "X",   c: "#00e676", up: true  },
        { p: tri.Yend,  l: "Y",   c: "#ff6d00", up: false },
        { p: tri.X2end, l: "X",   c: "#00e676", up: true  },
        { p: tri.Zend,  l: "Z",   c: "#e040fb", up: false },
      ].map((d, i) => (
        <g key={i}>
          {dot(d.p.x, d.p.y, d.c, 5)}
          <text x={d.p.x} y={d.p.y + (d.up ? -11 : 15)} fill={d.c} fontSize={10}
            fontFamily={Mono} textAnchor="middle" fontWeight="bold">{d.l}</text>
        </g>
      ))}

      <rect x={256} y={218} width={220} height={66} fill="#00000033" stroke="#1a253577" strokeWidth={0.5} rx={2} />
      {[
        { t: "W, Y, Z: correcciones simples",  c: "#e040fb" },
        { t: "X: correcciones de enlace",       c: "#00e676" },
        { t: "Mercado extremadamente lateral",   c: "#ff6d00" },
        { t: "Común en correcciones de onda 4", c: "#ffd700" },
        { t: "Muy difícil de operar — EVITAR",  c: "#ff1744" },
      ].map((r, i) =>
        <text key={i} x={260} y={230 + i * 11} fill={r.c} fontSize={7.5} fontFamily={i % 2 === 0 ? Mono : Sans}>{r.t}</text>
      )}

      {/* Right mini info */}
      {infoBox(492, 28, 196, 260, "COMBINACIONES VÁLIDAS", [
        { text: "W puede ser:", color: "#ffd700" },
        { text: "  Zigzag (5-3-5)", color: "#ff1744" },
        { text: "  Flat (3-3-5)", color: "#ff6d00" },
        { text: "  Triángulo ABCDE", color: "#e040fb" },
        { text: "", color: "" },
        { text: "X puede ser:", color: "#ffd700" },
        { text: "  Zigzag (más frecuente)", color: "#00e676" },
        { text: "  Flat o tiny triangle", color: "#546e7a" },
        { text: "", color: "" },
        { text: "Y/Z puede ser:", color: "#ffd700" },
        { text: "  Zigzag, flat o triángulo", color: "#ff6d00" },
        { text: "", color: "" },
        { text: "REGLA CLAVE:", color: "#00e5ff" },
        { text: "Solo 2 zigzags en un WXY", color: "#00e5ff" },
        { text: "separados por X", color: "#00e5ff" },
        { text: "", color: "" },
        { text: "Si dudas entre WXY y 5", color: "#546e7a" },
        { text: "ondas → espera confirmación", color: "#546e7a" },
      ])}

      <text x={10} y={H - 4} fill="#546e7a" fontSize={8} fontFamily={Sans}>
        WXY y WXYXZ son las estructuras más complejas de Elliott. En trading práctico: si el mercado va lateral largo tiempo, es Triple Tres — no intentar operar dentro.
      </text>
    </g>
  );
}

function FractalView() {
  const fractalMain = [
    { label: "0", x: 30,  y: 280 },
    { label: "1", x: 90,  y: 210 },
    { label: "2", x: 120, y: 240 },
    { label: "3", x: 240, y: 130 },
    { label: "4", x: 280, y: 165 },
    { label: "5", x: 380, y: 80  },
  ];
  const fractalInner = [
    { label: "①", x: 120, y: 240 },
    { label: "②", x: 145, y: 255 },
    { label: "③", x: 195, y: 205 },
    { label: "④", x: 215, y: 220 },
    { label: "⑤", x: 240, y: 130 },
  ];
  const cols = ["#546e7a","#00e676","#ff1744","#00e5ff","#ff6d00","#ffd700"];
  const innerCols = ["#00e676","#ff1744","#e040fb","#ff6d00","#ffd700"];

  return (
    <g>
      <text x={W / 2} y={20} fill="#e040fb" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>
        FRACTAL — ONDAS DENTRO DE ONDAS (MULTI-TF)
      </text>
      <polyline points={fractalMain.map(p => `${p.x},${p.y}`).join(" ")}
        fill="none" stroke="#00e5ff55" strokeWidth={3} />
      {fractalMain.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={6} fill={cols[i]} stroke="#0a0f18" strokeWidth={1.5} />
          <text x={p.x} y={p.y + (p.y < 200 ? -12 : 16)} fill={cols[i]} fontSize={10}
            fontFamily={Mono} textAnchor="middle" fontWeight="bold">{p.label}</text>
        </g>
      ))}
      <polyline points={fractalInner.map(p => `${p.x},${p.y}`).join(" ")}
        fill="none" stroke="#e040fb" strokeWidth={2} />
      {fractalInner.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill={innerCols[i]} stroke="#0a0f18" strokeWidth={1} />
          <text x={p.x + (i % 2 === 0 ? -10 : 10)} y={p.y - 8} fill={innerCols[i]}
            fontSize={9} fontFamily={Mono} textAnchor="middle">{p.label}</text>
        </g>
      ))}
      <rect x={115} y={115} width={132} height={148} fill="none"
        stroke="#e040fb44" strokeWidth={1} strokeDasharray="4 3" rx={2} />
      <text x={181} y={112} fill="#e040fb" fontSize={8} fontFamily={Mono} textAnchor="middle">
        ZOOM: onda ③ = 5 sub-ondas internas
      </text>
      {infoBox(420, 30, 265, 230, "FRACTAL EN TIMEFRAMES", [
        { text: "Mensual:", color: "#00e5ff"  },{ text: "  Ondas 1-5 macro (años)", color: "#546e7a" },
        { text: "Semanal:", color: "#ffd700"  },{ text: "  Ondas 1-5 de la onda 3 macro", color: "#546e7a" },
        { text: "Diario:",  color: "#00e676"  },{ text: "  Sub-ondas de onda 3 semanal", color: "#546e7a" },
        { text: "4H:",      color: "#e040fb"  },{ text: "  Micro-ondas del diario", color: "#546e7a" },
        { text: "1H:",      color: "#ff6d00"  },{ text: "  Nano-ondas", color: "#546e7a" },
        { text: "", color: "" },
        { text: "PRINCIPIO FRACTAL:", color: "#ffd700" },
        { text: "Onda 5 ondas impulso →", color: "#00e676" },
        { text: "  onda 1,3,5 = 5 sub-ondas", color: "#546e7a" },
        { text: "  onda 2,4 = 3 sub-ondas", color: "#546e7a" },
        { text: "Onda 3 ondas correctiva →", color: "#ff1744" },
        { text: "  ondas A,C = 5 sub-ondas", color: "#546e7a" },
        { text: "  onda B = 3 sub-ondas", color: "#546e7a" },
      ])}
      <text x={10} y={H - 4} fill="#546e7a" fontSize={8} fontFamily={Sans}>
        La estructura fractal: lo que ves en mensual existe también en 1H. Confluencia multi-TF = las entradas de mayor probabilidad.
      </text>
    </g>
  );
}

// ── Legend cards ──────────────────────────────────────────────────────────────
const legendsByView: Record<ViewType, { wave: string; color: string; desc: string }[]> = {
  impulse: [
    { wave: "Onda 1", color: "#00e676", desc: "Impulso inicial — pocos creen. Suele ser rápido y corto." },
    { wave: "Onda 2", color: "#ff1744", desc: "Retroceso 50-61.8% de onda 1. Parece que el bear vuelve." },
    { wave: "Onda 3", color: "#00e5ff", desc: "La más larga y poderosa. 161.8%-261.8% de onda 1." },
    { wave: "Onda 4", color: "#ff6d00", desc: "Corrección plana. 23.6%-38.2% de onda 3. No solapa onda 1." },
    { wave: "Onda 5", color: "#ffd700", desc: "Impulso final con divergencia en RSI/CVD. FOMO retail." },
  ],
  zigzag: [
    { wave: "Onda A (5)", color: "#ff1744", desc: "Impulso de 5 sub-ondas bajistas. Bajada rápida y vertical." },
    { wave: "Onda B (3)", color: "#00e676", desc: "Retrocede solo 38-50% de A. Si va más = no es zigzag." },
    { wave: "Onda C (5)", color: "#ff1744", desc: "Impulso de 5 sub-ondas. C = 100%-161.8% de onda A." },
    { wave: "Señal clave", color: "#ffd700", desc: "B no supera el 61.8% de A. Corrección profunda y vertical." },
    { wave: "Posición",    color: "#e040fb", desc: "Aparece como onda 2, onda A, o posición W/Y en complex." },
  ],
  flat: [
    { wave: "Regular Flat",  color: "#00e5ff", desc: "B ≈ top original. C ≈ A. Corrección lateral — frecuente en onda 4." },
    { wave: "Expanded Flat", color: "#e040fb", desc: "B supera el top original (trampa alcista). C > A → más daño." },
    { wave: "Running Flat",  color: "#ffd700", desc: "B supera el top. C no llega al fondo de A. Mercado muy fuerte." },
    { wave: "Regla onda A",  color: "#ff1744", desc: "En TODAS las flats: onda A tiene solo 3 sub-ondas (no 5)." },
    { wave: "Regla onda C",  color: "#ff6d00", desc: "En TODAS las flats: onda C tiene 5 sub-ondas (impulso)." },
  ],
  triangle: [
    { wave: "Onda A",        color: "#ff1744", desc: "Primera bajada — 3 sub-ondas. Establece límite inferior inicial." },
    { wave: "Ondas B,D",     color: "#00e676", desc: "Ondas alcistas — tocan la línea superior convergente." },
    { wave: "Ondas C,E",     color: "#ff1744", desc: "Ondas bajistas — tocan la línea inferior convergente." },
    { wave: "Onda E (trampa)",color: "#e040fb", desc: "La onda E suele hacer un fakeout. Es la trampa final." },
    { wave: "THRUST",        color: "#ffd700", desc: "Después de E, el mercado 'explota' ≈ al ancho del triángulo." },
  ],
  wxy: [
    { wave: "Onda W",  color: "#ff1744", desc: "Primera corrección — puede ser zigzag, flat o triángulo." },
    { wave: "Onda X",  color: "#00e676", desc: "Corrección de enlace — shallow (superficial). Puede confundir." },
    { wave: "Onda Y",  color: "#ff6d00", desc: "Segunda corrección — mismos tipos que W." },
    { wave: "Onda Z",  color: "#e040fb", desc: "Triple Three: tercera corrección. Solo si Y no terminó el ciclo." },
    { wave: "Señal",   color: "#ffd700", desc: "Si el mercado va lateral más de lo esperado → Triple Three. No operar." },
  ],
  fractal: [
    { wave: "Ondas 1,3,5", color: "#00e676", desc: "Sub-división: 5 sub-ondas en cada una. Son los impulsos." },
    { wave: "Ondas 2,4",   color: "#ff1744", desc: "Sub-división: 3 sub-ondas cada una. Son las correcciones." },
    { wave: "Ondas A,C",   color: "#ff6d00", desc: "En correctivas: A y C tienen 5 sub-ondas (impulsos)." },
    { wave: "Onda B",      color: "#00e5ff", desc: "En correctivas: B tiene 3 sub-ondas." },
    { wave: "Multi-TF",    color: "#e040fb", desc: "La misma estructura existe en mensual, diario, 4H, 1H y 15m." },
  ],
};

// ── Main component ────────────────────────────────────────────────────────────
export function ElliottWaveChart() {
  const [view, setView] = useState<ViewType>("impulse");

  return (
    <div>
      {/* View buttons */}
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

      {/* SVG chart */}
      <div style={{ overflowX: "auto" }}>
        <svg width={W} height={H}
          style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 400 }}>
          {grid()}
          {view === "impulse"  && <ImpulseView />}
          {view === "zigzag"   && <ZigzagView />}
          {view === "flat"     && <FlatView />}
          {view === "triangle" && <TriangleView />}
          {view === "wxy"      && <WXYView />}
          {view === "fractal"  && <FractalView />}
        </svg>
      </div>

      {/* Legend cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))",
        gap: 8, marginTop: 12,
      }}>
        {(legendsByView[view] || []).map(w => (
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
