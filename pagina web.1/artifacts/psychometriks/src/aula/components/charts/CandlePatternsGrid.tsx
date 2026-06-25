import React, { useState } from "react";

// Candle values are 0-100 scale: 100=top, 0=bottom
// SVG y-axis is inverted: y = H - (val/100)*H
interface Candle {
  o: number; h: number; l: number; c: number;
}

const H = 72; // SVG height per candle slot
const CW = 16; // body width
const CX = 12; // center x per slot
const SLOT_W = 24; // x width per candle

function candleColor(c: Candle) {
  return c.c >= c.o ? "#00e676" : "#ff1744";
}

function y(val: number) {
  return H - (val / 100) * H;
}

function renderCandle(c: Candle, slotIndex: number, key: string) {
  const col = candleColor(c);
  const cx = slotIndex * SLOT_W + CX;
  const bodyTop = y(Math.max(c.o, c.c));
  const bodyBot = y(Math.min(c.o, c.c));
  const bodyH = Math.max(bodyBot - bodyTop, 2);
  const wickTop = y(c.h);
  const wickBot = y(c.l);
  return (
    <g key={key}>
      <line x1={cx} y1={wickTop} x2={cx} y2={wickBot} stroke={col} strokeWidth={1.5} />
      <rect
        x={cx - CW / 2} y={bodyTop}
        width={CW} height={bodyH}
        fill={col} stroke={col} strokeWidth={0.5}
        opacity={c.c >= c.o ? 1 : 1}
      />
    </g>
  );
}

function renderDoji(c: Candle, slotIndex: number, key: string, color = "#aaa") {
  const cx = slotIndex * SLOT_W + CX;
  const crossY = y((c.o + c.c) / 2);
  return (
    <g key={key}>
      <line x1={cx} y1={y(c.h)} x2={cx} y2={y(c.l)} stroke={color} strokeWidth={1.5} />
      <line x1={cx - CW / 2} y1={crossY} x2={cx + CW / 2} y2={crossY} stroke={color} strokeWidth={2} />
    </g>
  );
}

interface PatternDef {
  name: string;
  tag: string;
  color: string;
  candles: Candle[];
  note: string;
  isDoji?: boolean[];
}

const PATTERNS: PatternDef[] = [
  // ── REVERSIÓN ALCISTA ─────────────────────────────────────────────────────
  {
    name: "Hammer", tag: "Rev. Alcista", color: "#00e676",
    candles: [{ o: 75, h: 80, l: 20, c: 78 }],
    note: "Mecha larga inferior ≥2× cuerpo. Señal alcista en soporte.",
  },
  {
    name: "Inverted Hammer", tag: "Rev. Alcista", color: "#00e676",
    candles: [{ o: 30, h: 75, l: 25, c: 35 }],
    note: "Mecha larga superior ≥2× cuerpo. En soporte tras tendencia bajista.",
  },
  {
    name: "Morning Star", tag: "Rev. Alcista", color: "#00e676",
    candles: [
      { o: 80, h: 82, l: 55, c: 58 },
      { o: 40, h: 48, l: 35, c: 42 },
      { o: 50, h: 78, l: 48, c: 75 },
    ],
    note: "3 velas: bajista + doji/pequeña + alcista fuerte. Reversión en soporte.",
  },
  {
    name: "Bullish Engulfing", tag: "Rev. Alcista", color: "#00e676",
    candles: [
      { o: 65, h: 68, l: 42, c: 45 },
      { o: 38, h: 80, l: 35, c: 78 },
    ],
    note: "Vela alcista que cubre completamente el cuerpo de la vela bajista anterior.",
  },
  {
    name: "Bullish Harami", tag: "Rev. Alcista", color: "#00e676",
    candles: [
      { o: 78, h: 81, l: 38, c: 40 },
      { o: 48, h: 62, l: 45, c: 60 },
    ],
    note: "Vela pequeña alcista dentro del cuerpo de la vela bajista anterior.",
  },
  {
    name: "Piercing Pattern", tag: "Rev. Alcista", color: "#00e676",
    candles: [
      { o: 80, h: 83, l: 40, c: 42 },
      { o: 35, h: 74, l: 32, c: 72 },
    ],
    note: "La vela alcista cierra sobre el 50% del cuerpo bajista anterior.",
  },
  {
    name: "Tweezer Bottom", tag: "Rev. Alcista", color: "#00e676",
    candles: [
      { o: 72, h: 75, l: 28, c: 35 },
      { o: 36, h: 70, l: 28, c: 68 },
    ],
    note: "Dos mínimos iguales consecutivos. Soporte doble en zona de demanda.",
  },
  {
    name: "Three White Soldiers", tag: "Rev. Alcista", color: "#00e676",
    candles: [
      { o: 22, h: 42, l: 20, c: 40 },
      { o: 38, h: 60, l: 36, c: 58 },
      { o: 56, h: 78, l: 54, c: 76 },
    ],
    note: "3 velas alcistas sucesivas con cierres progresivamente mayores. Tendencia fuerte.",
  },
  {
    name: "Morning Doji Star", tag: "Rev. Alcista", color: "#00e676",
    candles: [
      { o: 78, h: 81, l: 52, c: 55 },
      { o: 40, h: 46, l: 36, c: 42 },
      { o: 50, h: 79, l: 48, c: 77 },
    ],
    note: "Como Morning Star pero la vela central es un Doji. Alta probabilidad.",
    isDoji: [false, true, false],
  },
  {
    name: "Belt Hold Alcista", tag: "Rev. Alcista", color: "#00e676",
    candles: [{ o: 25, h: 78, l: 24, c: 76 }],
    note: "Vela alcista sin mecha inferior que abre en el mínimo. Compra institucional.",
  },

  // ── REVERSIÓN BAJISTA ─────────────────────────────────────────────────────
  {
    name: "Shooting Star", tag: "Rev. Bajista", color: "#ff1744",
    candles: [{ o: 68, h: 92, l: 63, c: 65 }],
    note: "Mecha superior larga ≥2× cuerpo. En resistencia tras tendencia alcista.",
  },
  {
    name: "Hanging Man", tag: "Rev. Bajista", color: "#ff1744",
    candles: [{ o: 72, h: 78, l: 30, c: 75 }],
    note: "Igual que Hammer pero en techo. Señal de debilidad alcista.",
  },
  {
    name: "Evening Star", tag: "Rev. Bajista", color: "#ff1744",
    candles: [
      { o: 30, h: 70, l: 28, c: 68 },
      { o: 72, h: 82, l: 68, c: 75 },
      { o: 65, h: 68, l: 32, c: 35 },
    ],
    note: "3 velas: alcista + pequeña/doji + bajista fuerte. Reversión en resistencia.",
  },
  {
    name: "Bearish Engulfing", tag: "Rev. Bajista", color: "#ff1744",
    candles: [
      { o: 35, h: 62, l: 32, c: 60 },
      { o: 65, h: 68, l: 22, c: 25 },
    ],
    note: "Vela bajista que cubre completamente el cuerpo de la vela alcista anterior.",
  },
  {
    name: "Bearish Harami", tag: "Rev. Bajista", color: "#ff1744",
    candles: [
      { o: 25, h: 72, l: 22, c: 70 },
      { o: 58, h: 65, l: 42, c: 44 },
    ],
    note: "Vela pequeña bajista dentro del cuerpo de la vela alcista anterior.",
  },
  {
    name: "Dark Cloud Cover", tag: "Rev. Bajista", color: "#ff1744",
    candles: [
      { o: 25, h: 72, l: 23, c: 70 },
      { o: 78, h: 80, l: 32, c: 34 },
    ],
    note: "La vela bajista cierra bajo el 50% del cuerpo alcista anterior.",
  },
  {
    name: "Tweezer Top", tag: "Rev. Bajista", color: "#ff1744",
    candles: [
      { o: 30, h: 78, l: 28, c: 68 },
      { o: 65, h: 78, l: 30, c: 32 },
    ],
    note: "Dos máximos iguales consecutivos. Resistencia doble en zona de oferta.",
  },
  {
    name: "Three Black Crows", tag: "Rev. Bajista", color: "#ff1744",
    candles: [
      { o: 78, h: 80, l: 58, c: 60 },
      { o: 62, h: 64, l: 40, c: 42 },
      { o: 44, h: 46, l: 22, c: 24 },
    ],
    note: "3 velas bajistas sucesivas con cierres progresivamente menores.",
  },
  {
    name: "Evening Doji Star", tag: "Rev. Bajista", color: "#ff1744",
    candles: [
      { o: 28, h: 68, l: 26, c: 65 },
      { o: 72, h: 80, l: 68, c: 74 },
      { o: 60, h: 62, l: 25, c: 28 },
    ],
    note: "Como Evening Star pero la vela central es un Doji. Alta probabilidad.",
    isDoji: [false, true, false],
  },
  {
    name: "Belt Hold Bajista", tag: "Rev. Bajista", color: "#ff1744",
    candles: [{ o: 78, h: 79, l: 22, c: 24 }],
    note: "Vela bajista sin mecha superior que abre en el máximo. Venta institucional.",
  },

  // ── DOJI ──────────────────────────────────────────────────────────────────
  {
    name: "Doji Estándar", tag: "Neutral/Indecisión", color: "#ffd700",
    candles: [{ o: 50, h: 75, l: 25, c: 50 }],
    note: "Apertura ≈ Cierre. Equilibrio entre compradores y vendedores.",
    isDoji: [true],
  },
  {
    name: "Dragonfly Doji", tag: "Rev. Alcista", color: "#00e676",
    candles: [{ o: 70, h: 72, l: 15, c: 70 }],
    note: "Mecha inferior muy larga, sin cuerpo. Rechazo fuerte de zona baja.",
    isDoji: [true],
  },
  {
    name: "Gravestone Doji", tag: "Rev. Bajista", color: "#ff1744",
    candles: [{ o: 30, h: 82, l: 28, c: 30 }],
    note: "Mecha superior muy larga, sin cuerpo. Rechazo fuerte de zona alta.",
    isDoji: [true],
  },
  {
    name: "Long-legged Doji", tag: "Neutral/Indecisión", color: "#ffd700",
    candles: [{ o: 50, h: 88, l: 12, c: 50 }],
    note: "Mechas muy largas en ambos lados. Gran incertidumbre — espera confirmación.",
    isDoji: [true],
  },

  // ── CONTINUACIÓN ─────────────────────────────────────────────────────────
  {
    name: "Marubozu Alcista", tag: "Continuación Alcista", color: "#00e676",
    candles: [{ o: 20, h: 21, l: 19, c: 80 }],
    note: "Cuerpo enorme sin mechas. Dominio total de compradores.",
  },
  {
    name: "Marubozu Bajista", tag: "Continuación Bajista", color: "#ff1744",
    candles: [{ o: 80, h: 81, l: 19, c: 20 }],
    note: "Cuerpo enorme sin mechas. Dominio total de vendedores.",
  },
  {
    name: "Spinning Top", tag: "Neutral/Indecisión", color: "#546e7a",
    candles: [{ o: 52, h: 72, l: 28, c: 48 }],
    note: "Cuerpo pequeño con mechas largas. Mercado incierto — espera dirección.",
  },
  {
    name: "Three Inside Up", tag: "Rev. Alcista", color: "#00e676",
    candles: [
      { o: 75, h: 78, l: 38, c: 40 },
      { o: 45, h: 62, l: 42, c: 60 },
      { o: 58, h: 80, l: 56, c: 78 },
    ],
    note: "Harami alcista confirmado por 3ra vela que cierra sobre la primera.",
  },
  {
    name: "Three Inside Down", tag: "Rev. Bajista", color: "#ff1744",
    candles: [
      { o: 28, h: 72, l: 25, c: 68 },
      { o: 60, h: 65, l: 42, c: 44 },
      { o: 46, h: 48, l: 22, c: 24 },
    ],
    note: "Harami bajista confirmado por 3ra vela que cierra bajo la primera.",
  },
  {
    name: "Abandoned Baby Alcista", tag: "Rev. Alcista", color: "#00e676",
    candles: [
      { o: 70, h: 72, l: 48, c: 50 },
      { o: 36, h: 42, l: 30, c: 38 },
      { o: 55, h: 78, l: 53, c: 76 },
    ],
    note: "Doji aislado entre gap bajista y gap alcista. Reversión fuerte.",
    isDoji: [false, true, false],
  },
];

const TAG_COLORS: Record<string, string> = {
  "Rev. Alcista": "#00e676",
  "Rev. Bajista": "#ff1744",
  "Neutral/Indecisión": "#ffd700",
  "Continuación Alcista": "#00e5ff",
  "Continuación Bajista": "#ff6d00",
};

const CATEGORIES = ["Rev. Alcista", "Rev. Bajista", "Neutral/Indecisión", "Continuación Alcista", "Continuación Bajista"];

export function CandlePatternsGrid() {
  const [filter, setFilter] = useState<string | null>(null);

  const displayed = filter ? PATTERNS.filter(p => p.tag === filter) : PATTERNS;

  const grouped: Record<string, PatternDef[]> = {};
  displayed.forEach(p => {
    if (!grouped[p.tag]) grouped[p.tag] = [];
    grouped[p.tag].push(p);
  });

  return (
    <div>
      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <button
          onClick={() => setFilter(null)}
          style={{
            background: !filter ? "var(--cyan)" : "var(--bg3)",
            border: `1px solid ${!filter ? "var(--cyan)" : "var(--border2)"}`,
            color: !filter ? "var(--bg)" : "var(--muted)",
            padding: "4px 14px", fontSize: 11,
            fontFamily: "'Share Tech Mono', monospace", cursor: "pointer", letterSpacing: 1,
          }}
        >TODOS ({PATTERNS.length})</button>
        {CATEGORIES.map(cat => {
          const count = PATTERNS.filter(p => p.tag === cat).length;
          const color = TAG_COLORS[cat] || "#546e7a";
          const isActive = filter === cat;
          return (
            <button key={cat} onClick={() => setFilter(isActive ? null : cat)} style={{
              background: isActive ? `${color}22` : "var(--bg3)",
              border: `1px solid ${isActive ? color : "var(--border2)"}`,
              color: isActive ? color : "var(--muted)",
              padding: "4px 12px", fontSize: 11,
              fontFamily: "'Share Tech Mono', monospace", cursor: "pointer", letterSpacing: 1,
            }}>
              {cat.toUpperCase()} ({count})
            </button>
          );
        })}
      </div>

      {/* Patterns grid by category */}
      {CATEGORIES.filter(cat => grouped[cat]?.length).map(cat => {
        const color = TAG_COLORS[cat] || "#546e7a";
        return (
          <div key={cat} style={{ marginBottom: 24 }}>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
              letterSpacing: 3, color, marginBottom: 12,
              borderBottom: `1px solid ${color}44`, paddingBottom: 6,
            }}>
              {cat.toUpperCase()} — {grouped[cat].length} patrones
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 10,
            }}>
              {grouped[cat].map(pattern => {
                const nCandles = pattern.candles.length;
                const svgW = nCandles * SLOT_W + 8;
                return (
                  <div key={pattern.name} style={{
                    background: "var(--bg3)",
                    border: `1px solid var(--border2)`,
                    borderLeft: `3px solid ${color}`,
                    padding: "12px 14px",
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                  }}>
                    {/* SVG chart */}
                    <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                      <svg
                        width={svgW}
                        height={H + 4}
                        style={{ background: "rgba(0,0,0,0.25)", borderRadius: 2 }}
                      >
                        <g transform="translate(4,2)">
                          {pattern.candles.map((c, ci) => {
                            const isDoji = pattern.isDoji?.[ci];
                            return isDoji
                              ? renderDoji(c, ci, `d-${ci}`, color)
                              : renderCandle(c, ci, `c-${ci}`);
                          })}
                        </g>
                      </svg>
                    </div>
                    {/* Info */}
                    <div>
                      <div style={{
                        fontFamily: "'Orbitron', monospace",
                        fontSize: 11,
                        color: "var(--text)",
                        marginBottom: 3,
                      }}>
                        {pattern.name}
                      </div>
                      <div style={{
                        fontSize: 11,
                        color: "#7a8fa0",
                        lineHeight: 1.55,
                      }}>
                        {pattern.note}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
