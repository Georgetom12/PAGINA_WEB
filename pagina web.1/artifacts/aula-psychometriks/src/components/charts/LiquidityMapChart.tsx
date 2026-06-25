import React, { useState } from "react";

// ─── THEME ────────────────────────────────────────────────────────────────────
const Mono = "'Share Tech Mono', monospace";
const Sans = "'Rajdhani', sans-serif";
const BG   = "#0a0f18";

// ─── CHART DIMENSIONS ─────────────────────────────────────────────────────────
const W = 700, H = 340;

// ─── VIEWS REGISTRY — add new views here ──────────────────────────────────────
// To extend: add [key, label] to VIEWS, create a view function, add render case.
type View =
  | "ssl-hunt"
  | "bsl-hunt"
  | "eqhl"
  | "inducement"
  | "pdh-pdl"
  | "psych-levels"
  | "full-map";

const VIEWS: [View, string][] = [
  // ── Core SSL/BSL mechanics ──
  ["ssl-hunt",    "📉 SSL Hunt"],
  ["bsl-hunt",    "📈 BSL Hunt"],
  ["eqhl",        "⚖️ EQH / EQL"],
  ["inducement",  "🪤 Inducement"],
  // ── Session levels ──
  ["pdh-pdl",     "🕐 PDH / PDL"],
  // ── Price psychology ──
  ["psych-levels","🔢 Niveles Psicológicos"],
  // ── Overview ──
  ["full-map",    "🗺️ Mapa Completo"],
];

// ─── SHARED PRIMITIVES ────────────────────────────────────────────────────────
function candle(x: number, o: number, h: number, l: number, c: number, color: string, w = 26) {
  const bull = c >= o, bt = bull ? c : o, bb = bull ? o : c;
  return <g>
    <line x1={x + w / 2} y1={h} x2={x + w / 2} y2={l} stroke={color} strokeWidth={1.5} />
    <rect x={x} y={bt} width={w} height={Math.max(2, bb - bt)}
      fill={bull ? color + "33" : color + "55"} stroke={color} strokeWidth={1.5} />
  </g>;
}
function hline(y: number, x1: number, x2: number, color: string, dash = "5 3", sw = 1.5) {
  return <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={sw} strokeDasharray={dash} />;
}
function lbl(x: number, y: number, t: string, c: string, size = 9, anchor: "middle" | "start" | "end" = "middle") {
  return <text x={x} y={y} fill={c} fontSize={size} fontFamily={Mono} textAnchor={anchor}>{t}</text>;
}
function note(x: number, y: number, t: string, c: string, size = 7) {
  return <text x={x} y={y} fill={c} fontSize={size} fontFamily={Sans}>{t}</text>;
}
function dot(x: number, y: number, color: string, r = 5) {
  return <circle cx={x} cy={y} r={r} fill={color} stroke="#0a0f18" strokeWidth={1.5} />;
}
function badge(x: number, y: number, text: string, color: string) {
  return <g>
    <rect x={x - 2} y={y - 10} width={text.length * 6.5 + 4} height={13} fill={color + "33"} stroke={color} strokeWidth={0.8} rx={2} />
    <text x={x} y={y} fill={color} fontSize={8} fontFamily={Mono}>{text}</text>
  </g>;
}
function liqTag(x: number, y: number, label: string, color: string, side: "L" | "R" = "R") {
  const w = label.length * 6.2 + 6;
  const tx = side === "R" ? x + 4 : x - w - 4;
  return <g>
    <rect x={tx} y={y - 8} width={w} height={13} fill={color + "22"} stroke={color} strokeWidth={0.8} rx={2} />
    <text x={tx + w / 2} y={y + 2} fill={color} fontSize={7} fontFamily={Mono} textAnchor="middle">{label}</text>
  </g>;
}

// ═════════════════════════════════════════════════════════════════════════════
// VIEW 1 — SSL HUNT
// ═════════════════════════════════════════════════════════════════════════════
function SSLHuntView() {
  return <g>
    {lbl(W / 2, 22, "SSL HUNT — BARRIDA DE SELL-SIDE LIQUIDITY", "#ff1744", 11)}
    {lbl(W / 2, 36, "El precio barre los stops bajo los mínimos → absorbe vendedores → revierte al alza", "#546e7a", 8)}

    {lbl(120, 58, "FASE 1: Rango + SSL acumulando", "#ffd700", 9)}
    {candle(15, 145, 122, 152, 128, "#00e676")}{candle(48, 128, 108, 138, 112, "#ff1744")}
    {candle(81, 112, 95, 120, 98, "#00e676")}{candle(114, 98, 80, 105, 85, "#ff1744")}
    {candle(147, 85, 68, 92, 72, "#00e676")}{candle(180, 72, 55, 82, 60, "#ff1744")}
    {candle(213, 60, 48, 65, 52, "#00e676")}{candle(246, 52, 45, 58, 48, "#ff1744")}

    {hline(215, 10, 310, "#ff174499", "5 3", 2)}
    {lbl(10, 212, "EQL", "#ff1744", 9, "start")}
    {lbl(10, 222, "SSL", "#ff174499", 7, "start")}
    {lbl(315, 212, "← Stops de longs aquí", "#ff174499", 8, "start")}

    {lbl(345, 58, "FASE 2: Judas Swing (barre SSL)", "#e040fb", 9)}
    {candle(290, 48, 38, 55, 42, "#00e676")}{candle(323, 42, 35, 48, 38, "#ff1744")}
    {candle(356, 38, 22, 205, 196, "#ff1744", 30)}
    {lbl(371, 14, "SWEEP", "#e040fb", 9)}
    {hline(205, 350, 425, "#e040fb99", "3 2", 2)}
    {lbl(300, 220, "SSL BARRIDO ✓", "#e040fb", 9)}

    {lbl(520, 58, "FASE 3: Reversión — ENTRY", "#00e676", 9)}
    {candle(395, 196, 183, 205, 188, "#ff1744", 26)}
    {candle(427, 188, 162, 195, 167, "#00e676", 26)}
    {candle(459, 167, 136, 172, 142, "#00e676", 26)}
    {candle(491, 142, 108, 147, 113, "#00e676", 26)}
    {candle(523, 113, 80, 118, 85, "#00e676", 26)}
    {candle(555, 85, 55, 90, 60, "#00e676", 26)}

    {dot(459, 157, "#00e676", 6)}{lbl(472, 147, "ENTRY", "#00e676", 9)}
    {hline(205, 390, 622, "#ffd70099", "4 3")}{lbl(624, 208, "SL", "#ffd700", 8, "start")}
    {hline(55, 530, 640, "#00e67699", "3 2")}{lbl(642, 58, "TP", "#00e676", 8, "start")}

    <rect x={10} y={228} width={288} height={34} fill="#ff174411" stroke="#ff174422" rx={2} />
    {lbl(154, 241, "SSL = Stops de longs BAJO mínimos", "#ff1744", 8)}
    {lbl(154, 253, "El SM NECESITA esa liquidez para comprar", "#546e7a", 7)}

    {lbl(10, H - 6, "SSL Hunt = barre stops bajo mínimos para comprar barato. Vela sweep con wick largo = señal. Entrada cuando CIERRA de vuelta sobre el EQL.", "#546e7a", 8, "start")}
  </g>;
}

// ═════════════════════════════════════════════════════════════════════════════
// VIEW 2 — BSL HUNT
// ═════════════════════════════════════════════════════════════════════════════
function BSLHuntView() {
  return <g>
    {lbl(W / 2, 22, "BSL HUNT — BARRIDA DE BUY-SIDE LIQUIDITY", "#00e676", 11)}
    {lbl(W / 2, 36, "El precio barre los stops sobre los máximos → absorbe compradores → revierte a la baja", "#546e7a", 8)}

    {lbl(120, 58, "FASE 1: Rango + BSL acumulando", "#ffd700", 9)}
    {candle(15, 180, 158, 188, 165, "#ff1744")}{candle(48, 165, 148, 172, 152, "#00e676")}
    {candle(81, 152, 138, 160, 142, "#ff1744")}{candle(114, 142, 128, 150, 132, "#00e676")}
    {candle(147, 132, 118, 140, 122, "#ff1744")}{candle(180, 122, 108, 130, 112, "#00e676")}
    {candle(213, 112, 98, 120, 102, "#ff1744")}{candle(246, 102, 88, 110, 92, "#00e676")}

    {hline(90, 10, 310, "#00e67699", "5 3", 2)}
    {lbl(10, 86, "EQH", "#00e676", 9, "start")}{lbl(10, 97, "BSL", "#00e67499", 7, "start")}
    {lbl(315, 86, "← Stops de shorts aquí", "#00e67499", 8, "start")}

    {lbl(345, 58, "FASE 2: Judas Swing (barre BSL)", "#e040fb", 9)}
    {candle(290, 92, 82, 98, 88, "#ff1744")}{candle(323, 88, 78, 94, 84, "#00e676")}
    {candle(356, 84, 75, 102, 94, "#00e676", 30)}
    {lbl(371, 70, "SWEEP↑", "#e040fb", 9)}
    {hline(92, 350, 425, "#e040fb99", "3 2", 2)}{lbl(300, 87, "BSL BARRIDO ✓", "#e040fb", 9)}

    {lbl(520, 58, "FASE 3: Reversión bajista", "#ff1744", 9)}
    {candle(395, 92, 98, 182, 176, "#ff1744", 26)}
    {candle(427, 176, 182, 218, 213, "#ff1744", 26)}
    {candle(459, 213, 220, 245, 240, "#ff1744", 26)}
    {candle(491, 240, 246, 268, 263, "#ff1744", 26)}
    {candle(523, 263, 270, 290, 286, "#ff1744", 26)}

    {dot(427, 180, "#ff1744", 6)}{lbl(440, 175, "ENTRY", "#ff1744", 9)}
    {hline(78, 390, 622, "#ffd70099", "4 3")}{lbl(624, 81, "SL", "#ffd700", 8, "start")}
    {hline(286, 490, 640, "#ff174499", "3 2")}{lbl(642, 289, "TP", "#ff1744", 8, "start")}

    <rect x={10} y={228} width={288} height={34} fill="#00e67611" stroke="#00e67622" rx={2} />
    {lbl(154, 241, "BSL = Stops de shorts SOBRE máximos", "#00e676", 8)}
    {lbl(154, 253, "El SM vende TODA su posición a ese precio", "#546e7a", 7)}

    {lbl(10, H - 6, "BSL Hunt = barre stops sobre máximos para vender en el peak. Vela sweep con wick largo arriba = señal bajista. Entrada cuando CIERRA bajo el EQH.", "#546e7a", 8, "start")}
  </g>;
}

// ═════════════════════════════════════════════════════════════════════════════
// VIEW 3 — EQH / EQL
// ═════════════════════════════════════════════════════════════════════════════
function EQHLView() {
  return <g>
    {lbl(W / 2, 22, "EQUAL HIGHS (EQH) & EQUAL LOWS (EQL) — IMANES DE LIQUIDEZ", "#ffd700", 11)}
    {lbl(W / 2, 36, "Dos o más máximos/mínimos al mismo nivel = liquidez acumulada = imán para el precio", "#546e7a", 8)}

    <rect x={0} y={48} width={340} height={280} fill="#0a0f1855" stroke="#00e67644" strokeWidth={1} rx={3} />
    {lbl(170, 65, "EQUAL HIGHS — EQH (BSL arriba)", "#00e676", 9)}

    {candle(15, 148, 98, 155, 105, "#00e676", 26)}{candle(47, 105, 88, 112, 92, "#ff1744", 26)}{candle(79, 92, 82, 98, 85, "#00e676", 26)}
    {candle(111, 85, 78, 90, 80, "#ff1744", 26)}{candle(143, 80, 78, 85, 80, "#00e676", 26)}
    {hline(78, 10, 185, "#00e67699", "5 3", 2)}{lbl(8, 74, "EQH", "#00e676", 9, "start")}

    {candle(180, 80, 75, 85, 78, "#ff1744", 26)}{candle(212, 78, 70, 83, 72, "#00e676", 26)}
    {candle(244, 72, 65, 78, 68, "#ff1744", 26)}
    {candle(276, 68, 62, 180, 172, "#00e676", 30)}
    {lbl(291, 58, "BSL SWEPT", "#e040fb", 8)}{lbl(291, 68, "→ SHORT", "#ff1744", 8)}

    {note(15, 220, "Dos picos en el mismo nivel", "#546e7a")}
    {note(15, 232, "= zona magnética = target", "#546e7a")}
    {note(15, 250, "Estrategia EQH:", "#ffd700", 8)}
    {note(15, 262, "  Espera el sweep (ruptura falsa)", "#7a8fa0")}
    {note(15, 274, "  + vela de rechazo + entrada short", "#7a8fa0")}
    {note(15, 286, "  SL sobre el wick, TP en EQL", "#7a8fa0")}

    <rect x={350} y={48} width={340} height={280} fill="#0a0f1855" stroke="#ff174444" strokeWidth={1} rx={3} />
    {lbl(520, 65, "EQUAL LOWS — EQL (SSL abajo)", "#ff1744", 9)}

    {candle(365, 168, 218, 175, 225, "#ff1744", 26)}{candle(397, 225, 235, 232, 242, "#00e676", 26)}
    {candle(429, 242, 248, 248, 255, "#ff1744", 26)}{candle(461, 255, 258, 262, 265, "#00e676", 26)}
    {candle(493, 265, 268, 272, 270, "#ff1744", 26)}
    {hline(270, 360, 530, "#ff174499", "5 3", 2)}{lbl(535, 273, "EQL", "#ff1744", 8, "start")}

    {candle(530, 270, 268, 275, 272, "#00e676", 26)}{candle(562, 272, 268, 278, 274, "#ff1744", 26)}
    {candle(594, 274, 270, 200, 192, "#ff1744", 30)}
    {lbl(609, 188, "SSL SWEPT", "#e040fb", 8)}{lbl(609, 198, "→ LONG", "#00e676", 8)}

    {note(365, 220, "Dos valles en el mismo nivel", "#546e7a")}
    {note(365, 232, "= zona magnética = target", "#546e7a")}
    {note(365, 250, "Estrategia EQL:", "#ffd700", 8)}
    {note(365, 262, "  Espera el sweep (ruptura falsa)", "#7a8fa0")}
    {note(365, 274, "  + vela de rechazo + entrada long", "#7a8fa0")}
    {note(365, 286, "  SL bajo el wick, TP en EQH", "#7a8fa0")}

    {lbl(10, H - 6, "EQH/EQL = 'imanes' de precio. El mercado los respeta en un 80%+ de los casos. Marcarlos te dice DÓNDE irá el precio antes de que llegue.", "#546e7a", 8, "start")}
  </g>;
}

// ═════════════════════════════════════════════════════════════════════════════
// VIEW 4 — INDUCEMENT
// ═════════════════════════════════════════════════════════════════════════════
function InducementView() {
  return <g>
    {lbl(W / 2, 22, "INDUCEMENT — LA TRAMPA DEL MERCADO", "#e040fb", 11)}
    {lbl(W / 2, 36, "Un mínimo/máximo creado deliberadamente para atraer stops ANTES del movimiento real", "#546e7a", 8)}

    {lbl(140, 60, "SETUP ALCISTA CON INDUCEMENT", "#00e676", 9)}

    {candle(15, 155, 130, 162, 138, "#ff1744")}{candle(48, 138, 115, 145, 120, "#ff1744")}
    {candle(81, 120, 98, 128, 105, "#ff1744")}{candle(114, 105, 85, 112, 90, "#ff1744")}
    {candle(147, 90, 72, 98, 78, "#ff1744")}{candle(180, 78, 62, 85, 65, "#ff1744")}

    {candle(213, 65, 45, 72, 50, "#00e676", 28)}
    {candle(247, 50, 38, 56, 42, "#00e676", 28)}
    {dot(260, 38, "#e040fb", 6)}{lbl(260, 30, "IDM", "#e040fb", 9)}
    {lbl(260, 20, "(Inducement)", "#e040fb", 7)}
    {note(275, 32, "Este high atrae shorts → sus stops van SOBRE aquí", "#e040fb")}

    {candle(285, 42, 35, 48, 38, "#ff1744", 28)}{candle(319, 38, 30, 42, 34, "#ff1744", 28)}
    {candle(353, 34, 25, 38, 28, "#ff1744", 28)}

    {hline(245, 10, 415, "#ff174499", "5 3")}
    {lbl(10, 241, "SSL real", "#ff1744", 8, "start")}

    {candle(387, 28, 20, 248, 240, "#ff1744", 28)}
    {lbl(401, 12, "SSL SWEPT", "#ff1744", 8)}{lbl(401, 22, "(real target)", "#546e7a", 7)}

    {candle(422, 240, 228, 248, 232, "#00e676", 26)}
    {candle(454, 232, 208, 238, 213, "#00e676", 26)}
    {candle(486, 213, 182, 218, 188, "#00e676", 26)}
    {dot(499, 193, "#00e676", 6)}{lbl(513, 185, "ENTRY", "#00e676", 9)}
    {candle(518, 188, 158, 193, 163, "#00e676", 26)}
    {candle(550, 163, 128, 168, 133, "#00e676", 26)}
    {candle(582, 133, 98, 138, 103, "#00e676", 26)}

    {hline(250, 420, 650, "#ffd70099", "4 3")}{lbl(652, 253, "SL", "#ffd700", 8, "start")}
    {hline(98, 540, 660, "#00e67699", "3 2")}{lbl(662, 101, "TP", "#00e676", 8, "start")}

    <rect x={10} y={264} width={680} height={44} fill="#e040fb11" stroke="#e040fb22" rx={2} />
    {lbl(350, 278, "SECUENCIA: IDM high → atrae shorts → sus stops = BSL arriba → precio baja Y barre SSL abajo → absorción → impulso alcista real", "#e040fb", 8)}
    {lbl(350, 291, "El inducement es el truco. El primer sweep NO es la entrada — el segundo sí. Siempre hay un stop-hunt ANTES del stop-hunt real.", "#546e7a", 7)}

    {lbl(10, H - 6, "Inducement = señuelo. El mercado crea un movimiento falso para limpiar el lado opuesto antes de moverse en la dirección real.", "#546e7a", 8, "start")}
  </g>;
}

// ═════════════════════════════════════════════════════════════════════════════
// VIEW 5 — PDH / PDL  (Previous Day / Week High & Low)
// ═════════════════════════════════════════════════════════════════════════════
function PDHPDLView() {
  const dayW = 80, gap = 12;
  const days = [
    { label: "Lunes",    open: 175, high: 148, low: 195, close: 152, color: "#00e676" },
    { label: "Martes",   open: 152, high: 130, low: 172, close: 165, color: "#ff1744" },
    { label: "Miércoles",open: 165, high: 115, low: 175, close: 122, color: "#00e676" },
    { label: "Jueves",   open: 122, high:  90, low: 135, close: 128, color: "#ff1744" },
  ];

  return <g>
    {lbl(W / 2, 22, "PDH / PDL — PREVIOUS DAY & WEEK HIGH / LOW", "#00e5ff", 11)}
    {lbl(W / 2, 36, "Los niveles del día/semana anterior son los primeros targets de liquidez en cada nueva sesión", "#546e7a", 8)}

    {/* Day candles — schematic */}
    {days.map((d, i) => {
      const cx = 28 + i * (dayW + gap);
      const midX = cx + dayW / 2;
      return <g key={i}>
        {/* Full day range background */}
        <rect x={cx} y={d.high} width={dayW} height={d.low - d.high} fill={d.color + "08"} stroke={d.color + "33"} strokeWidth={0.5} rx={1} />
        {/* Body */}
        {candle(cx + 18, d.open, d.high + 2, d.low - 2, d.close, d.color, dayW - 36)}
        {/* Day label */}
        {lbl(midX, d.low + 14, d.label, "#546e7a", 7)}
        {/* HIGH label */}
        {i > 0 && badge(cx - 2, d.high - 4, `PDH ${i}`, "#00e5ff")}
        {/* LOW label */}
        {i > 0 && badge(cx - 2, d.low + 2, `PDL ${i}`, "#ff9900")}
        {/* Extend lines forward */}
        {i < days.length - 1 && hline(d.high, cx + dayW, cx + dayW + gap, "#00e5ff66", "4 2")}
        {i < days.length - 1 && hline(d.low,  cx + dayW, cx + dayW + gap, "#ff990066", "4 2")}
      </g>;
    })}

    {/* Current day with PDH/PDL as targets */}
    {(() => {
      const cx = 28 + 4 * (dayW + gap);
      return <g>
        <rect x={cx} y={48} width={140} height={H - 80} fill="#00e5ff08" stroke="#00e5ff22" strokeWidth={0.5} rx={2} />
        {lbl(cx + 70, 62, "HOY", "#00e5ff", 9)}

        {/* PDH line of yesterday extended */}
        {hline(90, cx, cx + 140, "#00e5ff88", "6 3", 1.8)}
        {liqTag(cx + 140, 90, "PDH ayer", "#00e5ff")}
        {lbl(cx + 10, 85, "BSL aquí", "#00e5ff", 7, "start")}

        {/* PDL line of yesterday */}
        {hline(135, cx, cx + 140, "#ff990088", "6 3", 1.8)}
        {liqTag(cx + 140, 135, "PDL ayer", "#ff9900")}
        {lbl(cx + 10, 130, "SSL aquí", "#ff9900", 7, "start")}

        {/* PWH / PWL */}
        {hline(68, cx, cx + 140, "#e040fb66", "3 2")}
        {liqTag(cx + 140, 68, "PWH semanal", "#e040fb")}
        {hline(162, cx, cx + 140, "#ffd70066", "3 2")}
        {liqTag(cx + 140, 162, "PWL semanal", "#ffd700")}

        {/* Price moving toward PDH */}
        {candle(cx + 8,  250, 235, 260, 238, "#00e676", 22)}
        {candle(cx + 36, 238, 215, 245, 220, "#00e676", 22)}
        {candle(cx + 64, 220, 185, 228, 190, "#00e676", 22)}
        {candle(cx + 92, 190, 140, 198, 145, "#00e676", 22)} {/* hits PDH */}
        {dot(cx + 103, 140, "#00e5ff", 5)}
        {lbl(cx + 103, 130, "TARGET", "#00e5ff", 7)}
      </g>;
    })()}

    {/* Info panel */}
    <rect x={10} y={240} width={330} height={80} fill="#00000030" stroke="#1a2535" strokeWidth={0.5} rx={2} />
    {lbl(175, 255, "NIVELES CLAVE — JERARQUÍA", "#00e5ff", 9)}
    {[
      ["PMH / PML", "Mes anterior", "#e040fb", "Objetivos de largo plazo"],
      ["PWH / PWL", "Semana anterior", "#ffd700", "Targets semanales"],
      ["PDH / PDL", "Día anterior",  "#00e5ff", "Targets diarios (más usados)"],
      ["PDO / PDC", "Open y Close previo", "#ff9900", "Niveles de reacción intraday"],
    ].map(([lv, periodo, color, desc], i) => <g key={i}>
      <rect x={14} y={262 + i * 14} width={7} height={7} fill={color as string} />
      {note(26, 270 + i * 14, `${lv} (${periodo}): ${desc}`, "#7a8fa0")}
    </g>)}

    {lbl(10, H - 6, "PDH/PDL = los primeros 2 targets de cada sesión. El precio de Londres suele ir a barrer el PDL o PDH asiático antes de la dirección real del día.", "#546e7a", 8, "start")}
  </g>;
}

// ═════════════════════════════════════════════════════════════════════════════
// VIEW 6 — PSYCHOLOGICAL LEVELS (Round Numbers)
// ═════════════════════════════════════════════════════════════════════════════
function PsychLevelsView() {
  const levels = [
    { price: "100,000", y: 55,  type: "ATH PSICOLÓGICO",   color: "#ffd700",  note: "Resistencia máxima — máxima BSL acumulada" },
    { price: "95,000",  y: 88,  type: "Número redondo",    color: "#00e5ff",  note: "Stops de shorts + breakout buyers" },
    { price: "90,000",  y: 120, type: "Número redondo",    color: "#00e5ff",  note: "Zona de take profit masivo" },
    { price: "85,000",  y: 152, type: "Zona de oferta",    color: "#ff9900",  note: "OB bajista histórico" },
    { price: "80,000",  y: 184, type: "NÚMERO MAYOR",      color: "#e040fb",  note: "SSL + stops masivos = imán fuerte" },
    { price: "75,000",  y: 216, type: "Número redondo",    color: "#00e5ff",  note: "Zona de demanda intermedia" },
    { price: "70,000",  y: 250, type: "Zona de demanda",   color: "#00e676",  note: "EQL histórico + OB alcista" },
    { price: "65,000",  y: 283, type: "Soporte crítico",   color: "#ff1744",  note: "SSL mayor — rompería estructura" },
  ];

  return <g>
    {lbl(W / 2, 22, "NIVELES PSICOLÓGICOS — DÓNDE SE ACUMULA LA LIQUIDEZ MASIVA", "#ffd700", 11)}
    {lbl(W / 2, 36, "Los números redondos concentran stops, take profits y órdenes institucionales automáticas", "#546e7a", 8)}

    {/* Price line */}
    <line x1={200} y1={50} x2={200} y2={H - 20} stroke="#1a2535" strokeWidth={1.5} />

    {levels.map((l, i) => {
      const isStrong = l.type.includes("MAYOR") || l.type.includes("ATH");
      return <g key={i}>
        {hline(l.y, 0, W, l.color + (isStrong ? "55" : "33"), isStrong ? "6 2" : "4 3", isStrong ? 1.8 : 1)}
        {/* Price label */}
        <rect x={2} y={l.y - 8} width={88} height={14} fill={l.color + "22"} stroke={l.color} strokeWidth={isStrong ? 1.2 : 0.8} rx={2} />
        {lbl(46, l.y + 2, `$ ${l.price}`, l.color, 8)}
        {/* Type label */}
        {lbl(100, l.y + 2, l.type, l.color, isStrong ? 9 : 7, "start")}
        {/* Note */}
        {note(300, l.y + 2, l.note, "#546e7a")}
        {/* Dot on price line */}
        {isStrong && dot(200, l.y, l.color, 5)}
        {!isStrong && <circle cx={200} cy={l.y} r={3} fill={l.color + "88"} />}
      </g>;
    })}

    {/* Price candles approaching $100K */}
    {[
      { x: 178, o: 295, h: 280, l: 300, c: 283 },
      { x: 156, o: 307, h: 292, l: 312, c: 295 },
      { x: 134, o: 318, h: 305, l: 322, c: 308 },
    ].map((c, i) => candle(c.x + 14, c.o, c.h, c.l, c.c, "#00e676", 20))}

    {/* Legend box */}
    <rect x={560} y={48} width={132} height={100} fill="#00000030" stroke="#1a2535" strokeWidth={0.5} rx={2} />
    {lbl(626, 63, "REGLA PRÁCTICA", "#ffd700", 8)}
    {note(568, 78,  "Números con muchos ceros", "#7a8fa0")}
    {note(568, 91,  "= más liquidez acumulada.", "#7a8fa0")}
    {note(568, 104, "100K > 90K > 80K > 75K", "#ffd700", 8)}
    {note(568, 117, "Siempre marca los 5 más", "#7a8fa0")}
    {note(568, 130, "cercanos al precio actual.", "#7a8fa0")}
    {note(568, 143, "Son tus primeros TPs.", "#00e676", 8)}

    {lbl(10, H - 6, "Números redondos = concentración masiva de stops y órdenes. El precio los respeta porque MILES de traders ponen sus órdenes ahí. Nunca los ignores.", "#546e7a", 8, "start")}
  </g>;
}

// ═════════════════════════════════════════════════════════════════════════════
// VIEW 7 — FULL LIQUIDITY MAP (Mapa Completo)
// ═════════════════════════════════════════════════════════════════════════════
function FullMapView() {
  return <g>
    {lbl(W / 2, 18, "MAPA COMPLETO DE LIQUIDEZ — TODOS LOS NIVELES EN UN VISTAZO", "#00e5ff", 11)}
    {lbl(W / 2, 32, "La capa completa de liquidez: EQH/EQL, PDH/PDL, OBs, Inducement, Round numbers", "#546e7a", 8)}

    {/* ── Price axis ── */}
    <line x1={90} y1={42} x2={90} y2={H - 18} stroke="#1a2535" strokeWidth={1} />

    {/* ── Liquidity levels — top half (BSL) ── */}
    {/* Round number resistance */}
    {hline(50, 90, 530, "#ffd70066", "4 2", 2)}
    {liqTag(88, 50, "ROUND NUM", "#ffd700", "L")}
    {lbl(460, 45, "BSL máxima — stops de shorts + FOMO buyers", "#ffd70099", 7, "start")}

    {/* PWH */}
    {hline(72, 90, 530, "#e040fb55", "6 3", 1.5)}
    {liqTag(88, 72, "PWH", "#e040fb", "L")}
    {lbl(460, 67, "Previous Week High — BSL semanal", "#e040fb99", 7, "start")}

    {/* EQH */}
    {hline(92, 90, 530, "#00e67666", "5 3", 1.2)}
    {hline(96, 90, 530, "#00e67666", "5 3", 1.2)}
    {liqTag(88, 94, "EQH", "#00e676", "L")}
    {lbl(460, 89, "Equal Highs — BSL acumulada", "#00e67699", 7, "start")}

    {/* PDH */}
    {hline(112, 90, 530, "#00e5ff66", "4 3", 1.5)}
    {liqTag(88, 112, "PDH", "#00e5ff", "L")}
    {lbl(460, 107, "Previous Day High — target corto plazo", "#00e5ff99", 7, "start")}

    {/* ── CURRENT PRICE ZONE ── */}
    <rect x={90} y={155} width={440} height={28} fill="#00e5ff08" stroke="#00e5ff22" strokeWidth={0.5} />
    {lbl(310, 168, "▶ PRECIO ACTUAL — ZONA DE EQUILIBRIO (50%)", "#00e5ff", 9)}
    <line x1={90} y1={168} x2={530} y2={168} stroke="#00e5ff44" strokeWidth={1} strokeDasharray="2 2" />

    {/* ── Liquidity levels — bottom half (SSL) ── */}
    {/* PDL */}
    {hline(197, 90, 530, "#ff990066", "4 3", 1.5)}
    {liqTag(88, 197, "PDL", "#ff9900", "L")}
    {lbl(460, 192, "Previous Day Low — target corto plazo", "#ff990099", 7, "start")}

    {/* EQL */}
    {hline(222, 90, 530, "#ff174466", "5 3", 1.2)}
    {hline(226, 90, 530, "#ff174466", "5 3", 1.2)}
    {liqTag(88, 224, "EQL", "#ff1744", "L")}
    {lbl(460, 219, "Equal Lows — SSL acumulada", "#ff174499", 7, "start")}

    {/* PWL */}
    {hline(248, 90, 530, "#e040fb55", "6 3", 1.5)}
    {liqTag(88, 248, "PWL", "#e040fb", "L")}
    {lbl(460, 243, "Previous Week Low — SSL semanal", "#e040fb99", 7, "start")}

    {/* OB Zone */}
    <rect x={90} y={262} width={440} height={22} fill="#00e67611" stroke="#00e67644" strokeWidth={0.8} />
    {liqTag(88, 273, "BULL OB", "#00e676", "L")}
    {lbl(460, 274, "Order Block alcista — zona de demanda institucional", "#00e67699", 7, "start")}

    {/* Round number support */}
    {hline(295, 90, 530, "#ffd70066", "4 2", 2)}
    {liqTag(88, 295, "ROUND NUM", "#ffd700", "L")}
    {lbl(460, 290, "SSL máxima — stops de longs + panic sellers", "#ffd70099", 7, "start")}

    {/* ── Price candle ── */}
    {candle(540, 158, 118, 185, 122, "#00e676", 30)}
    {lbl(555, 108, "SETUP", "#00e676", 8)}
    {lbl(555, 118, "IDEAL", "#00e676", 8)}
    <line x1={555} y1={122} x2={555} y2={268} stroke="#00e67666" strokeWidth={1} strokeDasharray="2 2" />

    {/* SL/TP */}
    {hline(112, 530, 620, "#00e5ff88", "3 2")}{lbl(622, 115, "TP", "#00e5ff", 8, "start")}
    {hline(295, 530, 620, "#ffd70088", "3 2")}{lbl(622, 298, "SL", "#ffd700", 8, "start")}

    {/* Vertical divider */}
    <line x1={530} y1={42} x2={530} y2={H - 18} stroke="#1a253544" strokeWidth={0.5} />

    {lbl(10, H - 6, "Flujo de trabajo: marca BSL arriba → SSL abajo → precio actual entre ambos. El precio irá a barrer el más cercano primero.", "#546e7a", 8, "start")}
  </g>;
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export function LiquidityMapChart() {
  const [view, setView] = useState<View>("full-map");

  return (
    <div>
      {/* Tab bar — extensible: just add to VIEWS array above */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {VIEWS.map(([v, label]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              background: view === v ? "#00e5ff22" : "var(--bg3)",
              border: `1px solid ${view === v ? "#00e5ff" : "var(--border2)"}`,
              color: view === v ? "#00e5ff" : "var(--muted)",
              padding: "5px 12px", fontSize: 10,
              fontFamily: Mono, cursor: "pointer", letterSpacing: 0.7,
              borderRadius: 2,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ overflowX: "auto" }}>
        <svg
          width={W}
          height={H}
          style={{ background: BG, borderRadius: 4, display: "block", minWidth: 420 }}
        >
          {/* Grid */}
          {[80, 160, 240].map(y => (
            <line key={y} x1={0} y1={y} x2={W} y2={y} stroke="#1a253533" strokeWidth={0.5} />
          ))}

          {/* View router — add new cases here when extending */}
          {view === "ssl-hunt"    && <SSLHuntView />}
          {view === "bsl-hunt"    && <BSLHuntView />}
          {view === "eqhl"        && <EQHLView />}
          {view === "inducement"  && <InducementView />}
          {view === "pdh-pdl"     && <PDHPDLView />}
          {view === "psych-levels"&& <PsychLevelsView />}
          {view === "full-map"    && <FullMapView />}
        </svg>
      </div>
    </div>
  );
}
