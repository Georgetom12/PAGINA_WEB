import React, { useState } from "react";

/* ─── Shared utils ───────────────────────────────────────────────────────── */
function Grid({ width, height, step = 60 }: { width: number; height: number; step?: number }) {
  return (
    <g opacity={0.35}>
      {Array.from({ length: Math.ceil(height / step) }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * step} x2={width} y2={i * step} stroke="#1a2535" strokeWidth={0.5} />
      ))}
      {Array.from({ length: Math.ceil(width / (step * 1.5)) }, (_, i) => (
        <line key={`v${i}`} x1={i * step * 1.5} y1={0} x2={i * step * 1.5} y2={height} stroke="#1a2535" strokeWidth={0.5} />
      ))}
    </g>
  );
}

function path(pts: [number, number][]) {
  return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
}

function smooth(pts: [number, number][]) {
  if (pts.length < 2) return path(pts);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cp1x = x0 + (x1 - x0) * 0.5;
    const cp2x = x0 + (x1 - x0) * 0.5;
    d += ` C${cp1x},${y0} ${cp2x},${y1} ${x1},${y1}`;
  }
  return d;
}

const Mono = "'Share Tech Mono', monospace";
const Sans = "'Rajdhani', sans-serif";
const Orb = "'Orbitron', monospace";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  1. EMA CHART — 15 TIPOS DE CRUCE                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

type EMAView = "stack" | "golden" | "death" | "precio" | "rapido";

const EMA_COLORS = {
  precio: "#ffffff",
  ema8:   "#00e676",
  ema21:  "#00e5ff",
  ema50:  "#ffd700",
  ema100: "#ff6d00",
  ema200: "#7c4dff",
};

const ALL_CROSSES = [
  // ── CRUCES ALCISTAS (Golden) ────────────────────────────────────────────
  {
    id: "gc-8-21",    dir: "up",
    name: "Mini Golden Cross",
    emas: "EMA 8 × EMA 21",
    color: "#00e676",
    tf: "1H – 4H",
    fiab: "Media",
    significado: "Impulso alcista de corto plazo. Usado para scalping y swing en tendencia.",
    accion: "Long rápido si la tendencia mayor es alcista. No operar en contra del HTF.",
    nota: "Frecuente — no usar en aislamiento. Confirmar con estructura y volumen.",
  },
  {
    id: "gc-21-50",   dir: "up",
    name: "Golden Cross Medio",
    emas: "EMA 21 × EMA 50",
    color: "#ffd700",
    tf: "4H – Diario",
    fiab: "Alta",
    significado: "Tendencia alcista de mediano plazo confirmada. El setup más usado por swing traders.",
    accion: "Buscar longs en pullback a EMA21 o EMA50 tras el cruce.",
    nota: "Si el precio ya está muy extendido al momento del cruce, esperar el primer pullback.",
  },
  {
    id: "gc-21-100",  dir: "up",
    name: "Golden Cross Recuperación",
    emas: "EMA 21 × EMA 100",
    color: "#00e5ff",
    tf: "Diario",
    fiab: "Alta",
    significado: "Recuperación de tendencia tras corrección profunda. Señal de regreso al uptrend.",
    accion: "Long con SL bajo EMA100. Esperar vela de confirmación.",
    nota: "Más conservador que el 21×50 — menos frecuente, más significativo.",
  },
  {
    id: "gc-50-200",  dir: "up",
    name: "Golden Cross Mayor ★",
    emas: "EMA 50 × EMA 200",
    color: "#ffd700",
    tf: "Diario – Semanal",
    fiab: "Muy Alta",
    significado: "EL cruce más importante. Señal histórica de inicio de bull market. Muy pocos falsos positivos en semanal.",
    accion: "Long de posición en pullback. SL bajo EMA200. Objetivo: nuevo ATH.",
    nota: "En BTC históricamente ha generado +200-1000% en los 12 meses siguientes.",
  },
  {
    id: "gc-100-200", dir: "up",
    name: "Mega Golden Cross",
    emas: "EMA 100 × EMA 200",
    color: "#7c4dff",
    tf: "Semanal – Mensual",
    fiab: "Muy Alta",
    significado: "Confirmación definitiva de bull market macro. Ocurre pocas veces en la vida de un activo.",
    accion: "Acumulación de largo plazo. Este cruce marca inicio de mega tendencia alcista.",
    nota: "En Bitcoin: ocurrió en 2013, 2016, 2020. Cada vez fue el inicio del mayor rally.",
  },
  {
    id: "gc-21-200",  dir: "up",
    name: "Golden Cross Rápido",
    emas: "EMA 21 × EMA 200",
    color: "#00e676",
    tf: "Diario",
    fiab: "Alta",
    significado: "La EMA21 supera la EMA200 sin haber cruzado antes la EMA50 — mercado muy alcista.",
    accion: "Long agresivo. El mercado está recuperándose con fuerza. EMA200 ahora es soporte.",
    nota: "Señal de fuerza extrema — rara. Indica que el sell-off previo fue excesivo.",
  },
  {
    id: "p-ema200-up", dir: "up",
    name: "Precio Cruza EMA200 ↑",
    emas: "Precio × EMA 200",
    color: "#7c4dff",
    tf: "Diario – Semanal",
    fiab: "Muy Alta",
    significado: "Cambio de régimen alcista. El activo pasa de bear market a bull market. El evento más importante de todos.",
    accion: "Cambiar bias a alcista. Buscar longs en pullback a la EMA200.",
    nota: "Hasta que el precio cierre SOBRE la EMA200, el mercado es bajista. Este cierre lo cambia todo.",
  },
  {
    id: "p-ema50-up",  dir: "up",
    name: "Precio Cruza EMA50 ↑",
    emas: "Precio × EMA 50",
    color: "#ffd700",
    tf: "4H – Diario",
    fiab: "Alta",
    significado: "Tendencia alcista de mediano plazo recuperada. Primera señal de que la corrección terminó.",
    accion: "Long conservador con SL bajo el mínimo previo. Confirmar con volumen.",
    nota: "Si la EMA50 está bajando todavía, esperar que se aplane antes de confiar en el cruce.",
  },
  // ── CRUCES BAJISTAS (Death) ──────────────────────────────────────────────
  {
    id: "dc-8-21",    dir: "down",
    name: "Mini Death Cross",
    emas: "EMA 8 × EMA 21",
    color: "#ff1744",
    tf: "1H – 4H",
    fiab: "Media",
    significado: "Impulso bajista de corto plazo. Señal de short en scalping/swing si el HTF es bajista.",
    accion: "Short rápido si la tendencia mayor es bajista. No operar en contra del HTF.",
    nota: "Muy frecuente — confirmar con estructura (LH/LL) antes de ejecutar.",
  },
  {
    id: "dc-21-50",   dir: "down",
    name: "Death Cross Medio",
    emas: "EMA 21 × EMA 50",
    color: "#ff1744",
    tf: "4H – Diario",
    fiab: "Alta",
    significado: "Tendencia bajista de mediano plazo confirmada. El swing setup bajista más efectivo.",
    accion: "Buscar shorts en rebote a EMA21 o EMA50 tras el cruce.",
    nota: "En mercados trending, las EMA actúan como resistencia en los rebotes.",
  },
  {
    id: "dc-21-100",  dir: "down",
    name: "Death Cross Deterioro",
    emas: "EMA 21 × EMA 100",
    color: "#ff6d00",
    tf: "Diario",
    fiab: "Alta",
    significado: "Deterioro de la tendencia. La corrección se convierte en downtrend establecido.",
    accion: "Short en rebote a EMA100. SL sobre el último máximo.",
    nota: "Si el precio está bajo la EMA200 también, el contexto bajista es muy fuerte.",
  },
  {
    id: "dc-50-200",  dir: "down",
    name: "Death Cross Mayor ★",
    emas: "EMA 50 × EMA 200",
    color: "#ff1744",
    tf: "Diario – Semanal",
    fiab: "Muy Alta",
    significado: "EL cruce bajista más importante. Señal histórica de inicio de bear market. Muy pocos falsos negativos.",
    accion: "Cerrar longs de largo plazo. Shorts en rebotes. SL sobre EMA200.",
    nota: "En BTC: 2018, 2022. En SPX: 2008, 2020. Cada vez fue el inicio de caídas de 40-80%.",
  },
  {
    id: "dc-100-200", dir: "down",
    name: "Mega Death Cross",
    emas: "EMA 100 × EMA 200",
    color: "#7c4dff",
    tf: "Semanal – Mensual",
    fiab: "Muy Alta",
    significado: "Confirmación definitiva de bear market macro. Señala tendencia bajista de largo plazo.",
    accion: "Reducir exposición máxima. Solo cash o posiciones de cobertura.",
    nota: "Poco frecuente pero devastador. Una vez confirmado puede durar 12-36 meses.",
  },
  {
    id: "p-ema200-dn", dir: "down",
    name: "Precio Cruza EMA200 ↓",
    emas: "Precio × EMA 200",
    color: "#ff1744",
    tf: "Diario – Semanal",
    fiab: "Muy Alta",
    significado: "Cambio de régimen bajista. El activo pasa de bull market a bear market. Señal de alarma máxima.",
    accion: "Cambiar bias a bajista. Cerrar longs. La EMA200 ahora es resistencia.",
    nota: "No confundir con un wick — necesita CIERRE de vela bajo la EMA200 para ser válido.",
  },
  {
    id: "stack",      dir: "neutral",
    name: "EMA Stack Alcista ★★",
    emas: "EMA8 > EMA21 > EMA50 > EMA200",
    color: "#00e5ff",
    tf: "Cualquiera",
    fiab: "Máxima",
    significado: "Todas las EMAs alineadas alcistamente + precio sobre todas = tendencia perfecta. El setup más potente.",
    accion: "Solo longs. Cada pullback a cualquier EMA es compra. No shortar contra este stack.",
    nota: "EMA Stack bajista (todas invertidas) = solo shorts. Este contexto es donde el smart money concentra sus posiciones.",
  },
];

export function EMAChart() {
  const [view, setView] = useState<EMAView>("stack");
  const W = 740, H = 300;

  // ── STACK ALCISTA (todas las EMAs alineadas) ─────────────────────────────
  const stackPrice: [number,number][] = [
    [30,240],[50,235],[70,228],[88,220],[105,210],[120,198],[135,185],
    [150,172],[162,160],[175,145],[188,132],[200,118],[215,105],[230,92],
    [245,80],[260,70],[275,62],[295,55],[315,48],[335,42],[360,36],
  ];
  const stackE8: [number,number][] = [
    [30,248],[50,242],[70,236],[88,228],[105,218],[120,207],[135,195],
    [150,182],[162,170],[175,156],[188,143],[200,130],[215,117],[230,104],
    [245,92],[260,82],[275,74],[295,67],[315,60],[335,54],[360,48],
  ];
  const stackE21: [number,number][] = [
    [30,258],[50,254],[70,250],[88,244],[105,236],[120,226],[135,215],
    [150,203],[162,191],[175,178],[188,165],[200,152],[215,140],[230,128],
    [245,117],[260,107],[275,99],[295,92],[315,85],[335,79],[360,74],
  ];
  const stackE50: [number,number][] = [
    [30,268],[50,265],[70,262],[88,258],[105,252],[120,244],[135,235],
    [150,224],[162,213],[175,200],[188,188],[200,175],[215,163],[230,151],
    [245,140],[260,130],[275,121],[295,113],[315,106],[335,100],[360,95],
  ];
  const stackE200: [number,number][] = [
    [30,278],[50,277],[70,275],[88,273],[105,270],[120,266],[135,261],
    [150,255],[162,248],[175,240],[188,231],[200,222],[215,212],[230,202],
    [245,192],[260,182],[275,172],[295,163],[315,154],[335,145],[360,137],
  ];

  // ── GOLDEN CROSS 50×200 ───────────────────────────────────────────────────
  const gcE50: [number,number][] = [
    [30,235],[60,230],[90,225],[115,220],[135,215],[150,210],[170,205],
    [185,198],[200,192],[215,186],[230,180],[245,172],[260,164],[275,155],
    [290,145],[310,134],[330,122],[355,110],[380,98],[405,86],[430,75],
  ];
  const gcE200: [number,number][] = [
    [30,260],[60,258],[90,255],[115,252],[135,249],[150,247],[170,244],
    [185,240],[200,235],[215,230],[230,224],[245,218],[260,210],[275,202],
    [290,193],[310,183],[330,172],[355,160],[380,148],[405,136],[430,124],
  ];
  const gcPrice: [number,number][] = [
    [30,245],[60,238],[90,232],[115,225],[135,218],[150,212],[170,205],
    [185,195],[200,183],[215,170],[230,156],[245,140],[260,125],[275,108],
    [290,92],[310,76],[330,62],[355,48],[380,36],[405,26],[430,18],
  ];
  // Cross point approx x=230
  const gcCrossX = 242;
  const gcCrossY = 213;

  // ── DEATH CROSS 50×200 ───────────────────────────────────────────────────
  const dcE50: [number,number][] = [
    [30,80],[60,88],[90,96],[115,105],[135,114],[150,122],[170,130],
    [185,138],[200,146],[215,154],[230,162],[245,170],[260,178],[275,186],
    [290,194],[310,202],[330,210],[355,218],[380,225],[405,230],[430,234],
  ];
  const dcE200: [number,number][] = [
    [30,68],[60,72],[90,78],[115,83],[135,90],[150,96],[170,103],
    [185,110],[200,118],[215,127],[230,137],[245,147],[260,158],[275,170],
    [290,180],[310,190],[330,198],[355,205],[380,210],[405,214],[430,217],
  ];
  const dcPrice: [number,number][] = [
    [30,72],[60,75],[90,80],[115,85],[135,90],[150,95],[170,102],
    [185,112],[200,125],[215,142],[230,160],[245,178],[260,198],[275,215],
    [290,230],[310,242],[330,252],[355,260],[380,265],[405,268],[430,270],
  ];
  const dcCrossX = 250;
  const dcCrossY = 166;

  // ── PRECIO × EMA200 UP+DOWN ───────────────────────────────────────────────
  const pE200: [number,number][] = [
    [30,90],[70,95],[110,100],[150,106],[190,112],[230,118],[270,124],
    [310,130],[350,136],[390,142],[430,148],[470,154],[510,160],[550,166],[600,172],
  ];
  const pPriceUp: [number,number][] = [
    [30,148],[60,145],[90,140],[120,135],[150,128],[175,120],[200,112],
    [220,102],[238,90],[252,76],[268,62],[290,48],[320,36],[355,26],[390,18],
  ];
  const pPriceDn: [number,number][] = [
    [30,58],[60,65],[90,75],[120,88],[150,102],[175,118],[200,134],
    [220,148],[238,160],[252,172],[268,182],[290,190],[320,196],[355,200],[390,202],
  ];
  const pCrossUpX = 238, pCrossUpY = 90;
  const pCrossDnX = 238, pCrossDnY = 160;

  // ── RAPIDO (EMA 8×21) ─────────────────────────────────────────────────────
  const rE8: [number,number][] = [
    [30,200],[45,195],[60,188],[75,180],[88,170],[100,158],[112,145],
    [124,132],[136,122],[148,116],[160,122],[172,130],[184,138],[196,145],
    [208,150],[220,144],[232,136],[244,126],[256,115],[268,104],[280,92],
  ];
  const rE21: [number,number][] = [
    [30,215],[45,212],[60,208],[75,203],[88,196],[100,188],[112,178],
    [124,168],[136,158],[148,150],[160,152],[172,155],[184,158],[196,161],
    [208,162],[220,158],[232,152],[244,144],[256,135],[268,125],[280,114],
  ];
  const rPrice: [number,number][] = [
    [30,220],[45,218],[60,212],[75,204],[88,192],[100,178],[112,162],
    [124,148],[136,135],[148,125],[160,130],[172,138],[184,145],[196,150],
    [208,148],[220,138],[232,125],[244,110],[256,96],[268,82],[280,68],
  ];
  // mini cross up at ~x=100, down at ~x=154
  const rCrossUpX = 104, rCrossUpY = 186;
  const rCrossDnX = 156, rCrossDnY = 152;
  const rCrossUp2X = 222, rCrossUp2Y = 152;

  function Legend() {
    return (
      <g>
        {Object.entries(EMA_COLORS).map(([k, col], i) => (
          <g key={k}>
            <line x1={W - 165} y1={28 + i * 18} x2={W - 148} y2={28 + i * 18} stroke={col} strokeWidth={2} strokeDasharray={k === "ema200" ? "5 3" : undefined} />
            <text x={W - 143} y={33 + i * 18} fill={col} fontSize={9} fontFamily={Mono}>{k === "precio" ? "PRECIO" : k.replace("ema", "EMA ")}</text>
          </g>
        ))}
      </g>
    );
  }

  return (
    <div>
      {/* Toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {([
          ["stack",  "📊 EMA Stack", "#00e5ff"],
          ["golden", "⭐ Golden Cross 50×200", "#ffd700"],
          ["death",  "💀 Death Cross 50×200", "#ff1744"],
          ["precio", "🔀 Precio × EMA200", "#7c4dff"],
          ["rapido", "⚡ Cruce Rápido 8×21", "#00e676"],
        ] as const).map(([v, label, col]) => (
          <button key={v} onClick={() => setView(v as EMAView)} style={{
            background: view === v ? `${col}22` : "var(--bg3)",
            border: `1px solid ${view === v ? col : "var(--border2)"}`,
            color: view === v ? col : "var(--muted)",
            padding: "6px 14px", fontSize: 10,
            fontFamily: Mono, cursor: "pointer", letterSpacing: 0.8,
          }}>{label}</button>
        ))}
      </div>

      <div style={{ overflowX: "auto", marginBottom: 16 }}>
        <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 380 }}>
          <Grid width={W} height={H} />

          {/* ── STACK VIEW ── */}
          {view === "stack" && (
            <g>
              <text x={W/2} y={18} fill="#00e5ff" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>EMA STACK ALCISTA — EMA8 › EMA21 › EMA50 › EMA200</text>
              {/* Gradient fill between price and E200 */}
              <path d={`${smooth(stackPrice)} L${stackPrice[stackPrice.length-1][0]},${H} L${stackPrice[0][0]},${H} Z`} fill="#00e67608" />
              <path d={smooth(stackE200)} fill="none" stroke={EMA_COLORS.ema200} strokeWidth={1.5} strokeDasharray="6 3" />
              <path d={smooth(stackE50)}  fill="none" stroke={EMA_COLORS.ema50}  strokeWidth={2} />
              <path d={smooth(stackE21)}  fill="none" stroke={EMA_COLORS.ema21}  strokeWidth={1.8} />
              <path d={smooth(stackE8)}   fill="none" stroke={EMA_COLORS.ema8}   strokeWidth={1.5} />
              <path d={smooth(stackPrice)} fill="none" stroke={EMA_COLORS.precio} strokeWidth={2.5} />
              <Legend />
              {/* Pullback to EMA21 annotation */}
              <circle cx={200} cy={118} r={5} fill="#00e5ff" />
              <line x1={200} y1={108} x2={200} y2={70} stroke="#00e5ff88" strokeWidth={0.8} strokeDasharray="3 2" />
              <text x={205} y={65} fill="#00e5ff" fontSize={8} fontFamily={Mono}>Pullback a EMA21 = COMPRA</text>
              {/* Pullback to EMA50 */}
              <circle cx={135} cy={185} r={5} fill={EMA_COLORS.ema50} />
              <line x1={135} y1={175} x2={135} y2={130} stroke="#ffd70088" strokeWidth={0.8} strokeDasharray="3 2" />
              <text x={140} y={125} fill="#ffd700" fontSize={8} fontFamily={Mono}>Pullback EMA50 = COMPRA MAYOR</text>
              {/* Stack bracket */}
              <line x1={365} y1={36}  x2={375} y2={36}  stroke="#546e7a" strokeWidth={0.8} />
              <line x1={365} y1={137} x2={375} y2={137} stroke="#546e7a" strokeWidth={0.8} />
              <line x1={370} y1={36}  x2={370} y2={137} stroke="#546e7a" strokeWidth={0.8} />
              <text x={378} y={92} fill="#546e7a" fontSize={8} fontFamily={Mono}>STACK</text>
              {/* Arrow up */}
              <line x1={320} y1={65} x2={320} y2={32} stroke="#00e676" strokeWidth={2} />
              <polygon points="316,35 320,26 324,35" fill="#00e676" />
              <text x={326} y={48} fill="#00e676" fontSize={9} fontFamily={Mono}>BULL</text>
              <text x={10} y={H-6} fill="#546e7a" fontSize={8} fontFamily={Sans}>Stack alcista = solo LONGS. Cada EMA por debajo del precio actúa como soporte dinámico creciente.</text>
            </g>
          )}

          {/* ── GOLDEN CROSS 50×200 ── */}
          {view === "golden" && (
            <g>
              <text x={W/2} y={18} fill="#ffd700" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>GOLDEN CROSS — EMA50 CRUZA EMA200 HACIA ARRIBA</text>
              <path d={`${smooth(gcPrice)} L${gcPrice[gcPrice.length-1][0]},${H-20} L${gcPrice[0][0]},${H-20} Z`} fill="#00e67606" />
              <path d={smooth(gcE200)} fill="none" stroke={EMA_COLORS.ema200} strokeWidth={2} strokeDasharray="6 3" />
              <path d={smooth(gcE50)}  fill="none" stroke={EMA_COLORS.ema50}  strokeWidth={2.5} />
              <path d={smooth(gcPrice)} fill="none" stroke="#00e676" strokeWidth={2} />
              {/* Phase zones */}
              <rect x={30} y={25} width={gcCrossX-30} height={H-40} fill="#ff174406" stroke="#ff174420" strokeWidth={0.5} />
              <rect x={gcCrossX} y={25} width={W-gcCrossX-20} height={H-40} fill="#00e67606" stroke="#00e67620" strokeWidth={0.5} />
              <text x={(30+gcCrossX)/2} y={42} fill="#ff1744" fontSize={8} fontFamily={Mono} textAnchor="middle">BEAR MARKET</text>
              <text x={(gcCrossX+(W-20))/2} y={42} fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="middle">BULL MARKET</text>
              {/* Cross circle */}
              <circle cx={gcCrossX} cy={gcCrossY} r={10} fill="none" stroke="#ffd700" strokeWidth={2} />
              <circle cx={gcCrossX} cy={gcCrossY} r={4}  fill="#ffd700" />
              <line x1={gcCrossX} y1={gcCrossY-14} x2={gcCrossX} y2={gcCrossY-50} stroke="#ffd700" strokeWidth={0.8} strokeDasharray="3 2" />
              <text x={gcCrossX} y={gcCrossY-55} fill="#ffd700" fontSize={9} fontFamily={Mono} textAnchor="middle">⭐ GOLDEN CROSS</text>
              {/* Buy arrow */}
              <line x1={gcCrossX+30} y1={H-50} x2={gcCrossX+30} y2={H-100} stroke="#00e676" strokeWidth={2} />
              <polygon points={`${gcCrossX+26},${H-97} ${gcCrossX+30},${H-108} ${gcCrossX+34},${H-97}`} fill="#00e676" />
              <text x={gcCrossX+36} y={H-70} fill="#00e676" fontSize={8} fontFamily={Mono}>COMPRA LONG</text>
              {/* EMA labels */}
              <text x={W-160} y={48}  fill={EMA_COLORS.ema50}  fontSize={9} fontFamily={Mono}>EMA 50</text>
              <text x={W-160} y={65}  fill={EMA_COLORS.ema200} fontSize={9} fontFamily={Mono}>EMA 200</text>
              <text x={W-160} y={82}  fill="#00e676" fontSize={9} fontFamily={Mono}>Precio</text>
              {/* Stat box */}
              <rect x={W-160} y={100} width={150} height={80} fill="#00000030" stroke="#ffd70030" strokeWidth={0.5} rx={2} />
              <text x={W-85} y={116}  fill="#ffd700" fontSize={8} fontFamily={Mono} textAnchor="middle">ESTADÍSTICAS BTC</text>
              <text x={W-85} y={130}  fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="middle">2016: +1400% en 18m</text>
              <text x={W-85} y={144}  fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="middle">2020: +1300% en 12m</text>
              <text x={W-85} y={158}  fill="#546e7a" fontSize={8} fontFamily={Mono} textAnchor="middle">Señal semanal: 0 falsos</text>
              <text x={10} y={H-6} fill="#546e7a" fontSize={8} fontFamily={Sans}>El Golden Cross 50×200 en semanal es la señal de inicio de bull market. Comprar el pullback post-cruce.</text>
            </g>
          )}

          {/* ── DEATH CROSS 50×200 ── */}
          {view === "death" && (
            <g>
              <text x={W/2} y={18} fill="#ff1744" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>DEATH CROSS — EMA50 CRUZA EMA200 HACIA ABAJO</text>
              <path d={smooth(dcE200)} fill="none" stroke={EMA_COLORS.ema200} strokeWidth={2} strokeDasharray="6 3" />
              <path d={smooth(dcE50)}  fill="none" stroke={EMA_COLORS.ema50}  strokeWidth={2.5} />
              <path d={smooth(dcPrice)} fill="none" stroke="#ff1744" strokeWidth={2} />
              {/* Phase zones */}
              <rect x={30} y={25} width={dcCrossX-30} height={H-40} fill="#00e67406" stroke="#00e67420" strokeWidth={0.5} />
              <rect x={dcCrossX} y={25} width={W-dcCrossX-20} height={H-40} fill="#ff174406" stroke="#ff174420" strokeWidth={0.5} />
              <text x={(30+dcCrossX)/2} y={42} fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="middle">BULL MARKET</text>
              <text x={(dcCrossX+(W-20))/2} y={42} fill="#ff1744" fontSize={8} fontFamily={Mono} textAnchor="middle">BEAR MARKET</text>
              {/* Cross circle */}
              <circle cx={dcCrossX} cy={dcCrossY} r={10} fill="none" stroke="#ff1744" strokeWidth={2} />
              <circle cx={dcCrossX} cy={dcCrossY} r={4}  fill="#ff1744" />
              <line x1={dcCrossX} y1={dcCrossY-14} x2={dcCrossX} y2={dcCrossY-50} stroke="#ff1744" strokeWidth={0.8} strokeDasharray="3 2" />
              <text x={dcCrossX} y={dcCrossY-55} fill="#ff1744" fontSize={9} fontFamily={Mono} textAnchor="middle">💀 DEATH CROSS</text>
              {/* Sell arrow */}
              <line x1={dcCrossX+35} y1={200} x2={dcCrossX+35} y2={240} stroke="#ff1744" strokeWidth={2} />
              <polygon points={`${dcCrossX+31},${237} ${dcCrossX+35},${246} ${dcCrossX+39},${237}`} fill="#ff1744" />
              <text x={dcCrossX+42} y={222} fill="#ff1744" fontSize={8} fontFamily={Mono}>CERRAR LONGS</text>
              {/* Stat box */}
              <rect x={W-165} y={100} width={155} height={80} fill="#00000030" stroke="#ff174430" strokeWidth={0.5} rx={2} />
              <text x={W-87} y={116}  fill="#ff1744" fontSize={8} fontFamily={Mono} textAnchor="middle">ESTADÍSTICAS BTC</text>
              <text x={W-87} y={130}  fill="#ff6d00" fontSize={8} fontFamily={Mono} textAnchor="middle">2018: −84% tras cruce</text>
              <text x={W-87} y={144}  fill="#ff6d00" fontSize={8} fontFamily={Mono} textAnchor="middle">2022: −77% tras cruce</text>
              <text x={W-87} y={158}  fill="#546e7a" fontSize={8} fontFamily={Mono} textAnchor="middle">SPX 2008: −57%</text>
              {/* EMA labels */}
              <text x={W-165} y={48} fill={EMA_COLORS.ema50}  fontSize={9} fontFamily={Mono}>EMA 50</text>
              <text x={W-165} y={65} fill={EMA_COLORS.ema200} fontSize={9} fontFamily={Mono}>EMA 200</text>
              <text x={W-165} y={82} fill="#ff1744"            fontSize={9} fontFamily={Mono}>Precio</text>
              <text x={10} y={H-6} fill="#546e7a" fontSize={8} fontFamily={Sans}>El Death Cross 50×200 en semanal confirma bear market. Las EMAs invierten sus roles: ahora son resistencia.</text>
            </g>
          )}

          {/* ── PRECIO × EMA200 ── */}
          {view === "precio" && (
            <g>
              <text x={W/2} y={18} fill="#7c4dff" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>PRECIO × EMA200 — CAMBIO DE RÉGIMEN DE MERCADO</text>
              <path d={smooth(pE200)} fill="none" stroke={EMA_COLORS.ema200} strokeWidth={2.5} strokeDasharray="6 3" />
              <path d={smooth(pPriceUp)} fill="none" stroke="#00e676" strokeWidth={2} />
              <path d={smooth(pPriceDn)} fill="none" stroke="#ff1744" strokeWidth={2} />
              {/* Up cross */}
              <circle cx={pCrossUpX} cy={pCrossUpY} r={8} fill="none" stroke="#00e676" strokeWidth={1.5} />
              <circle cx={pCrossUpX} cy={pCrossUpY} r={3} fill="#00e676" />
              <text x={pCrossUpX+12} y={pCrossUpY-10} fill="#00e676" fontSize={9} fontFamily={Mono}>CIERRE SOBRE EMA200</text>
              <text x={pCrossUpX+12} y={pCrossUpY+4}  fill="#00e676" fontSize={8} fontFamily={Mono}>→ CAMBIO A BULL MARKET</text>
              {/* Down cross */}
              <circle cx={pCrossDnX} cy={pCrossDnY} r={8} fill="none" stroke="#ff1744" strokeWidth={1.5} />
              <circle cx={pCrossDnX} cy={pCrossDnY} r={3} fill="#ff1744" />
              <text x={pCrossDnX+12} y={pCrossDnY-10} fill="#ff1744" fontSize={9} fontFamily={Mono}>CIERRE BAJO EMA200</text>
              <text x={pCrossDnX+12} y={pCrossDnY+4}  fill="#ff1744" fontSize={8} fontFamily={Mono}>→ CAMBIO A BEAR MARKET</text>
              {/* Zone shading */}
              <rect x={30}  y={pE200[0][1]-15}  width={pCrossUpX-30}   height={30} fill="#00000020" />
              <rect x={pCrossUpX}  y={25}  width={pE200[pE200.length-1][0]-pCrossUpX} height={pCrossUpY} fill="#00e67606" />
              <rect x={pCrossDnX} y={pCrossDnY}  width={pE200[pE200.length-1][0]-pCrossDnX} height={H-pCrossDnY-20} fill="#ff174406" />
              {/* EMA200 label */}
              <text x={W-170} y={166} fill={EMA_COLORS.ema200} fontSize={9} fontFamily={Mono}>EMA 200 (la línea más</text>
              <text x={W-170} y={180} fill={EMA_COLORS.ema200} fontSize={9} fontFamily={Mono}>importante del mercado)</text>
              {/* IMPORTANTE */}
              <rect x={W-170} y={200} width={165} height={55} fill="#7c4dff15" stroke="#7c4dff44" strokeWidth={0.5} rx={2} />
              <text x={W-87} y={216} fill="#7c4dff" fontSize={8} fontFamily={Mono} textAnchor="middle">REGLA PRINCIPAL</text>
              <text x={W-87} y={230} fill="#e0e0e0" fontSize={8} fontFamily={Mono} textAnchor="middle">Precio CIERRA sobre EMA200</text>
              <text x={W-87} y={244} fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="middle">= cambio de régimen alcista</text>
              <text x={10} y={H-6} fill="#546e7a" fontSize={8} fontFamily={Sans}>Precio sobre EMA200 = BULL. Precio bajo EMA200 = BEAR. Esta línea define el régimen de mercado más que cualquier otro indicador.</text>
            </g>
          )}

          {/* ── RÁPIDO 8×21 ── */}
          {view === "rapido" && (
            <g>
              <text x={W/2} y={18} fill="#00e676" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>CRUCE RÁPIDO EMA8 × EMA21 — SCALPING Y SWING</text>
              <path d={smooth(rE21)}  fill="none" stroke={EMA_COLORS.ema21} strokeWidth={1.5} />
              <path d={smooth(rE8)}   fill="none" stroke={EMA_COLORS.ema8}  strokeWidth={1.5} />
              <path d={smooth(rPrice)} fill="none" stroke="#ffffff" strokeWidth={2} />
              {/* Crosses */}
              {/* Cross 1: alcista */}
              <circle cx={rCrossUpX} cy={rCrossUpY} r={7} fill="none" stroke="#00e676" strokeWidth={1.5} />
              <line x1={rCrossUpX} y1={rCrossUpY-10} x2={rCrossUpX} y2={rCrossUpY-45} stroke="#00e67688" strokeWidth={0.8} strokeDasharray="3 2" />
              <text x={rCrossUpX} y={rCrossUpY-50} fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="middle">MINI GOLDEN CROSS ↑</text>
              {/* Cross 2: bajista */}
              <circle cx={rCrossDnX} cy={rCrossDnY} r={7} fill="none" stroke="#ff1744" strokeWidth={1.5} />
              <line x1={rCrossDnX} y1={rCrossDnY+10} x2={rCrossDnX} y2={rCrossDnY+50} stroke="#ff174488" strokeWidth={0.8} strokeDasharray="3 2" />
              <text x={rCrossDnX} y={rCrossDnY+65} fill="#ff1744" fontSize={8} fontFamily={Mono} textAnchor="middle">MINI DEATH CROSS ↓</text>
              {/* Cross 3: alcista #2 */}
              <circle cx={rCrossUp2X} cy={rCrossUp2Y} r={7} fill="none" stroke="#00e676" strokeWidth={1.5} />
              <line x1={rCrossUp2X} y1={rCrossUp2Y-10} x2={rCrossUp2X} y2={rCrossUp2Y-45} stroke="#00e67688" strokeWidth={0.8} strokeDasharray="3 2" />
              <text x={rCrossUp2X} y={rCrossUp2Y-50} fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="middle">MINI GOLDEN CROSS #2 ↑</text>
              {/* EMA labels */}
              <text x={W-155} y={48} fill={EMA_COLORS.ema8}  fontSize={9} fontFamily={Mono}>EMA 8 (más rápida)</text>
              <text x={W-155} y={65} fill={EMA_COLORS.ema21} fontSize={9} fontFamily={Mono}>EMA 21</text>
              <text x={W-155} y={82} fill="#ffffff"           fontSize={9} fontFamily={Mono}>Precio</text>
              {/* Warning box */}
              <rect x={W-155} y={100} width={145} height={90} fill="#ff6d0015" stroke="#ff6d0040" strokeWidth={0.5} rx={2} />
              <text x={W-82} y={116} fill="#ff6d00" fontSize={8} fontFamily={Mono} textAnchor="middle">⚠ ADVERTENCIA</text>
              <text x={W-82} y={130} fill="#7a8fa0" fontSize={8} fontFamily={Mono} textAnchor="middle">Muchos falsos positivos</text>
              <text x={W-82} y={144} fill="#7a8fa0" fontSize={8} fontFamily={Mono} textAnchor="middle">en mercados laterales</text>
              <text x={W-82} y={158} fill="#7a8fa0" fontSize={8} fontFamily={Mono} textAnchor="middle">Siempre filtrar con</text>
              <text x={W-82} y={172} fill="#00e5ff" fontSize={8} fontFamily={Mono} textAnchor="middle">tendencia del HTF (EMA200)</text>
              <text x={10} y={H-6} fill="#546e7a" fontSize={8} fontFamily={Sans}>EMA8×21 en 4H/1D con tendencia alcista en semanal = setup de alta probabilidad. Nunca usar en aislamiento.</text>
            </g>
          )}
        </svg>
      </div>

      {/* Cards con los 15 cruces */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontFamily: Mono, fontSize: 10, color: "#ffd700", letterSpacing: 2, marginBottom: 10 }}>
          LOS 15 CRUCES DE EMAs — REFERENCIA COMPLETA
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
          {ALL_CROSSES.map(c => (
            <div key={c.id} style={{
              background: "var(--bg3)",
              border: `1px solid ${c.color}44`,
              borderLeft: `3px solid ${c.color}`,
              padding: "10px 12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: c.dir === "up" ? "#00e676" : c.dir === "down" ? "#ff1744" : "#00e5ff" }}>
                  {c.dir === "up" ? "↑" : c.dir === "down" ? "↓" : "⇌"}
                </span>
                <span style={{ fontFamily: Mono, fontSize: 10, color: c.color, letterSpacing: 0.5 }}>{c.name}</span>
              </div>
              <div style={{ fontFamily: Mono, fontSize: 9, color: "#546e7a", marginBottom: 5 }}>
                {c.emas} &nbsp;·&nbsp; {c.tf} &nbsp;·&nbsp;
                <span style={{ color: c.fiab === "Muy Alta" ? "#00e676" : c.fiab === "Alta" ? "#ffd700" : "#ff6d00" }}>
                  Fiab: {c.fiab}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#9daebf", lineHeight: 1.5, marginBottom: 4 }}>{c.significado}</div>
              <div style={{ fontSize: 10, color: c.color, marginBottom: 3 }}>➜ {c.accion}</div>
              {c.nota && <div style={{ fontSize: 10, color: "#546e7a", fontStyle: "italic" }}>⚑ {c.nota}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  2. RSI CHART                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */
export function RSIChart() {
  const W = 700, PRICE_H = 160, RSI_H = 100, H = PRICE_H + RSI_H + 20;
  const pricePts: [number, number][] = [
    [30,120],[55,108],[80,118],[105,100],[130,88],[155,70],[175,65],
    [195,78],[215,85],[235,72],[255,60],[275,68],[295,80],[315,90],
    [335,75],[355,62],[375,55],[395,48],[415,38],
  ];
  // RSI: scale to RSI_H where 0=100, RSI_H=0 (y=top is high)
  const rsiOffset = PRICE_H + 20;
  function rsiY(v: number) { return rsiOffset + RSI_H - (v / 100) * RSI_H; }

  const rsiVals: [number, number][] = [
    [30,55],[55,60],[80,58],[105,65],[130,70],[155,78],[175,82],
    [195,65],[215,58],[235,55],[255,68],[275,62],[295,50],[315,42],
    [335,38],[355,30],[375,28],[395,25],[415,22],
  ].map(([x, v]) => [x, rsiY(v)] as [number, number]);

  const obY = rsiY(70);
  const osY = rsiY(30);
  const midY = rsiY(50);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 380 }}>
        <Grid width={W} height={H} />
        <text x={W / 2} y={16} fill="#00e5ff" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>RSI — RELATIVE STRENGTH INDEX</text>

        {/* Price panel */}
        <path d={smooth(pricePts)} fill="none" stroke="#00e676" strokeWidth={2} />

        {/* Divergence annotation: price lower low, RSI higher low = bullish divergence */}
        {/* Low 1 */}
        <circle cx={175} cy={65} r={4} fill="#00e5ff" />
        {/* Low 2 (lower price) */}
        <circle cx={375} cy={55} r={4} fill="#00e5ff" />
        <line x1={175} y1={65} x2={375} y2={55} stroke="#00e5ff" strokeWidth={0.8} strokeDasharray="3 2" />
        <text x={270} y={50} fill="#00e5ff" fontSize={8} fontFamily={Mono} textAnchor="middle">Precio: LL</text>

        {/* RSI divergence (higher low) */}
        <line x1={175} y1={rsiY(82)} x2={375} y2={rsiY(28)} stroke="#ff6d00" strokeWidth={0.8} strokeDasharray="3 2" />
        <text x={270} y={rsiY(42)} fill="#ff6d00" fontSize={8} fontFamily={Mono} textAnchor="middle">RSI: HL = DIVERG. ALCISTA</text>

        {/* RSI panel divider */}
        <line x1={0} y1={rsiOffset - 4} x2={W} y2={rsiOffset - 4} stroke="#1a2535" strokeWidth={1} />
        <text x={10} y={rsiOffset + 12} fill="#00e5ff" fontSize={9} fontFamily={Mono}>RSI (14)</text>

        {/* RSI zones */}
        <rect x={0} y={obY} width={W} height={osY - obY} fill="#ffd70008" />
        <line x1={0} y1={obY} x2={W} y2={obY} stroke="#ff174444" strokeWidth={0.8} strokeDasharray="3 2" />
        <line x1={0} y1={osY} x2={W} y2={osY} stroke="#00e67644" strokeWidth={0.8} strokeDasharray="3 2" />
        <line x1={0} y1={midY} x2={W} y2={midY} stroke="#54547a44" strokeWidth={0.5} />

        <text x={W - 10} y={obY - 3} fill="#ff1744" fontSize={8} fontFamily={Mono} textAnchor="end">70 — Sobrecompra</text>
        <text x={W - 10} y={osY + 11} fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="end">30 — Sobreventa</text>
        <text x={W - 10} y={midY - 3} fill="#546e7a" fontSize={8} fontFamily={Mono} textAnchor="end">50</text>

        {/* RSI line */}
        <path d={smooth(rsiVals)} fill="none" stroke="#e040fb" strokeWidth={2} />

        {/* OB zone highlight at RSI >70 */}
        <circle cx={175} cy={rsiY(82)} r={4} fill="#ff1744" />
        <text x={178} y={rsiY(82) - 5} fill="#ff1744" fontSize={8} fontFamily={Mono}>Sobrecompra</text>

        {/* OS zone highlight at RSI <30 */}
        <circle cx={395} cy={rsiY(22)} r={4} fill="#00e676" />
        <text x={398} y={rsiY(22) + 12} fill="#00e676" fontSize={8} fontFamily={Mono}>Sobreventa</text>

        <text x={10} y={H - 6} fill="#546e7a" fontSize={8} fontFamily={Sans}>Divergencia alcista: precio hace LL pero RSI hace HL → señal de reversión inminente</text>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  3. BITCOIN HALVING CYCLES                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */
export function BitcoinCyclesChart() {
  const W = 700, H = 280;
  // Simplified log-scale BTC price arc per cycle
  const cycles: { label: string; x: number; color: string; year: string }[] = [
    { label: "Halving #1", x: 130, color: "#ffd700", year: "Nov 2012" },
    { label: "Halving #2", x: 265, color: "#ffd700", year: "Jul 2016" },
    { label: "Halving #3", x: 400, color: "#ffd700", year: "May 2020" },
    { label: "Halving #4", x: 535, color: "#ffd700", year: "Apr 2024" },
  ];

  // Price path (log-scale approximation)
  const pricePts: [number, number][] = [
    [20,250],[55,245],[80,240],[100,235],[115,225],[130,215],
    [145,200],[155,175],[160,155],[165,170],[175,180],[190,185],[210,190],
    [225,185],[245,180],[260,165],[275,145],[282,128],[288,118],[295,130],
    [305,140],[315,145],[330,148],[350,150],[370,148],[388,135],[398,118],
    [405,100],[410,85],[415,72],[420,60],[425,50],[432,62],[440,78],
    [450,88],[460,95],[475,100],[490,105],[505,102],[520,98],[535,88],
    [548,78],[558,68],[570,62],[585,58],[600,55],[615,52],[630,50],[660,48],
  ];

  const phases = [
    { x1: 20, x2: 130, label: "ACUMULACIÓN", color: "#7c4dff" },
    { x1: 130, x2: 215, label: "BULL #1", color: "#00e676" },
    { x1: 215, x2: 265, label: "BEAR", color: "#ff1744" },
    { x1: 265, x2: 355, label: "ACUMULACIÓN", color: "#7c4dff" },
    { x1: 355, x2: 440, label: "BULL #2", color: "#00e676" },
    { x1: 440, x2: 535, label: "BEAR", color: "#ff1744" },
    { x1: 535, x2: 660, label: "BULL #3?", color: "#00e5ff" },
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 380 }}>
        <Grid width={W} height={H} />
        <text x={W / 2} y={16} fill="#ffd700" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>CICLOS DE BITCOIN — HALVINGS Y FASES</text>

        {/* Phase backgrounds */}
        {phases.map((p, i) => (
          <g key={i}>
            <rect x={p.x1} y={22} width={p.x2 - p.x1} height={H - 40} fill={`${p.color}08`} stroke={`${p.color}30`} strokeWidth={0.5} />
            <text x={(p.x1 + p.x2) / 2} y={36} fill={p.color} fontSize={8} fontFamily={Mono} textAnchor="middle">{p.label}</text>
          </g>
        ))}

        {/* Halving lines */}
        {cycles.map((c, i) => (
          <g key={i}>
            <line x1={c.x} y1={22} x2={c.x} y2={H - 30} stroke={c.color} strokeWidth={1.5} strokeDasharray="5 3" />
            <text x={c.x} y={H - 18} fill={c.color} fontSize={8} fontFamily={Mono} textAnchor="middle">{c.label}</text>
            <text x={c.x} y={H - 8} fill="#546e7a" fontSize={8} fontFamily={Mono} textAnchor="middle">{c.year}</text>
          </g>
        ))}

        {/* Price line */}
        <path d={smooth(pricePts)} fill="none" stroke="#ffd700" strokeWidth={2.5} />

        {/* ATH markers */}
        <circle cx={160} cy={155} r={5} fill="#00e676" />
        <text x={164} y={152} fill="#00e676" fontSize={7} fontFamily={Mono}>ATH ~$1,200</text>
        <circle cx={288} cy={118} r={5} fill="#00e676" />
        <text x={292} y={115} fill="#00e676" fontSize={7} fontFamily={Mono}>ATH ~$20K</text>
        <circle cx={425} cy={50} r={5} fill="#00e676" />
        <text x={429} y={47} fill="#00e676" fontSize={7} fontFamily={Mono}>ATH ~$69K</text>
        <circle cx={630} cy={50} r={5} fill="#00e5ff" />
        <text x={634} y={47} fill="#00e5ff" fontSize={7} fontFamily={Mono}>ATH ~$110K+?</text>

        {/* Caption */}
        <text x={10} y={H - 4} fill="#546e7a" fontSize={8} fontFamily={Sans}>Cada halving reduce la emisión de BTC a la mitad. Históricamente inicia un nuevo ciclo alcista 12-18 meses después.</text>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  4. PSYCHOLOGY OF MARKET CYCLE                                              */
/* ─────────────────────────────────────────────────────────────────────────── */
export function PsychologyChart() {
  const W = 700, H = 300;
  const emotions = [
    { x: 35,  y: 200, label: "Optimismo",    color: "#00e676", phase: "inicio" },
    { x: 80,  y: 175, label: "Entusiasmo",   color: "#00e676", phase: "" },
    { x: 125, y: 150, label: "Emoción",      color: "#ffd700", phase: "" },
    { x: 165, y: 125, label: "Codicia",      color: "#ffd700", phase: "" },
    { x: 200, y: 100, label: "Euforia",      color: "#ffd700", phase: "BURBUJA" },
    { x: 240, y: 115, label: "Ansiedad",     color: "#ff6d00", phase: "" },
    { x: 275, y: 135, label: "Negación",     color: "#ff6d00", phase: "" },
    { x: 310, y: 160, label: "Miedo",        color: "#ff1744", phase: "" },
    { x: 340, y: 185, label: "Desesperación",color: "#ff1744", phase: "" },
    { x: 368, y: 210, label: "Pánico",       color: "#ff1744", phase: "" },
    { x: 390, y: 228, label: "Capitulación", color: "#ff1744", phase: "FONDO" },
    { x: 415, y: 235, label: "Depresión",    color: "#546e7a", phase: "" },
    { x: 450, y: 228, label: "Desánimo",     color: "#546e7a", phase: "" },
    { x: 490, y: 218, label: "Esperanza",    color: "#7c4dff", phase: "" },
    { x: 530, y: 205, label: "Alivio",       color: "#00e5ff", phase: "" },
    { x: 570, y: 195, label: "Optimismo",    color: "#00e676", phase: "nuevo ciclo" },
  ];

  const priceLine = emotions.map(e => [e.x, e.y] as [number, number]);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 380 }}>
        <Grid width={W} height={H} />
        <text x={W / 2} y={16} fill="#e040fb" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>CICLO PSICOLÓGICO DEL MERCADO</text>

        {/* Price curve */}
        <path d={smooth(priceLine)} fill="none" stroke="#00e5ff" strokeWidth={2.5} />
        <path d={`${smooth(priceLine)} L${priceLine[priceLine.length-1][0]},${H} L${priceLine[0][0]},${H} Z`} fill="#00e5ff06" />

        {/* Smart Money zones */}
        <rect x={350} y={200} width={110} height={50} fill="#00e67612" stroke="#00e67644" strokeWidth={0.8} rx={2} />
        <text x={405} y={265} fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="middle">SMART MONEY COMPRA</text>

        <rect x={175} y={90} width={110} height={50} fill="#ff174412" stroke="#ff174444" strokeWidth={0.8} rx={2} />
        <text x={230} y={158} fill="#ff1744" fontSize={8} fontFamily={Mono} textAnchor="middle">SMART MONEY VENDE</text>

        {/* Emotion dots */}
        {emotions.map((e, i) => (
          <g key={i}>
            <circle cx={e.x} cy={e.y} r={i === 4 || i === 10 ? 6 : 4} fill={e.color} stroke="#0a0f18" strokeWidth={1} />
            {e.phase && (
              <text x={e.x} y={e.y + (e.y > 150 ? 18 : -10)} fill={e.color} fontSize={8} fontFamily={Mono} textAnchor="middle">
                ★ {e.phase.toUpperCase()}
              </text>
            )}
          </g>
        ))}

        {/* Retail entry/exit arrows */}
        <text x={200} y={82} fill="#ffd700" fontSize={8} fontFamily={Mono} textAnchor="middle">Retail COMPRA aquí (FOMO)</text>
        <line x1={200} y1={86} x2={200} y2={98} stroke="#ffd700" strokeWidth={0.8} />
        <polygon points="197,96 200,103 203,96" fill="#ffd700" />

        <text x={390} y={252} fill="#e040fb" fontSize={8} fontFamily={Mono} textAnchor="middle">Retail VENDE aquí (Fear/Panic)</text>
        <line x1={390} y1={247} x2={390} y2={230} stroke="#e040fb" strokeWidth={0.8} />
        <polygon points="387,233 390,226 393,233" fill="#e040fb" />

        {/* Legend dots */}
        {[
          { x: 620, y: 60,  color: "#00e676", label: "Alcista" },
          { x: 620, y: 78,  color: "#ffd700", label: "Euforia" },
          { x: 620, y: 96,  color: "#ff6d00", label: "Corrección" },
          { x: 620, y: 114, color: "#ff1744", label: "Bajista" },
          { x: 620, y: 132, color: "#546e7a", label: "Fondo" },
          { x: 620, y: 150, color: "#7c4dff", label: "Acumulación" },
        ].map(l => (
          <g key={l.label}>
            <circle cx={l.x} cy={l.y - 3} r={4} fill={l.color} />
            <text x={l.x + 10} y={l.y} fill={l.color} fontSize={9} fontFamily={Mono}>{l.label}</text>
          </g>
        ))}

        <text x={10} y={H - 5} fill="#546e7a" fontSize={8} fontFamily={Sans}>
          El retail compra en la euforia y vende en el pánico. El smart money hace exactamente lo opuesto.
        </text>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  5. DXY CORRELATION CHART                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */
export function DXYCorrelationChart() {
  const W = 700, H = 260;
  const dxy: [number, number][] = [
    [30,200],[60,192],[90,188],[115,180],[135,168],[155,155],[170,145],
    [185,138],[200,148],[215,158],[230,168],[250,175],[265,165],[280,155],
    [295,145],[310,140],[325,148],[340,155],[355,162],[370,168],[390,172],
  ];
  const btc: [number, number][] = [
    [30,80],[60,88],[90,95],[115,105],[135,118],[155,132],[170,148],
    [185,158],[200,148],[215,138],[230,128],[250,118],[265,128],[280,140],
    [295,152],[310,158],[325,148],[340,140],[355,132],[370,125],[390,120],
  ];
  const gold: [number, number][] = [
    [30,90],[60,96],[90,102],[115,110],[135,120],[155,130],[170,142],
    [185,150],[200,142],[215,133],[230,124],[250,115],[265,123],[280,133],
    [295,142],[310,146],[325,138],[340,130],[355,122],[370,116],[390,112],
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 380 }}>
        <Grid width={W} height={H} />
        <text x={W / 2} y={16} fill="#00e5ff" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>DXY — CORRELACIÓN INVERSA CON BTC Y ORO</text>

        <path d={smooth(btc)} fill="none" stroke="#ffd700" strokeWidth={2} />
        <path d={smooth(gold)} fill="none" stroke="#ff6d00" strokeWidth={1.5} strokeDasharray="6 3" />
        <path d={smooth(dxy)} fill="none" stroke="#ff1744" strokeWidth={2.5} />

        {/* Correlation annotation */}
        <rect x={120} y={130} width={160} height={50} fill="#ff174412" stroke="#ff174430" strokeWidth={0.5} rx={2} />
        <text x={200} y={148} fill="#ff1744" fontSize={9} fontFamily={Mono} textAnchor="middle">DXY ↑</text>
        <text x={200} y={162} fill="#ffd700" fontSize={9} fontFamily={Mono} textAnchor="middle">BTC / ORO ↓</text>
        <text x={200} y={175} fill="#546e7a" fontSize={8} fontFamily={Mono} textAnchor="middle">correlación inversa</text>

        <rect x={305} y={110} width={155} height={50} fill="#00e67612" stroke="#00e67630" strokeWidth={0.5} rx={2} />
        <text x={382} y={128} fill="#00e676" fontSize={9} fontFamily={Mono} textAnchor="middle">DXY ↓</text>
        <text x={382} y={142} fill="#ffd700" fontSize={9} fontFamily={Mono} textAnchor="middle">BTC / ORO ↑</text>
        <text x={382} y={155} fill="#546e7a" fontSize={8} fontFamily={Mono} textAnchor="middle">Risk-on market</text>

        {/* Legend */}
        <circle cx={430} cy={210} r={4} fill="#ff1744" />
        <text x={438} y={214} fill="#ff1744" fontSize={9} fontFamily={Mono}>DXY</text>
        <circle cx={490} cy={210} r={4} fill="#ffd700" />
        <text x={498} y={214} fill="#ffd700" fontSize={9} fontFamily={Mono}>BTC</text>
        <circle cx={545} cy={210} r={4} fill="#ff6d00" />
        <text x={553} y={214} fill="#ff6d00" fontSize={9} fontFamily={Mono}>ORO</text>

        <text x={10} y={H - 5} fill="#546e7a" fontSize={8} fontFamily={Sans}>DXY fuerte = presión sobre activos de riesgo. DXY débil = rally en BTC, oro, y emergentes.</text>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  6. VIX CHART                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */
export function VIXChart() {
  const W = 700, H = 260;
  const spx: [number, number][] = [
    [30,220],[60,210],[90,198],[120,188],[150,178],[175,168],[195,155],
    [205,145],[215,138],[225,132],[240,142],[255,150],[270,158],[285,165],
    [300,172],[320,162],[340,155],[360,145],[380,138],[405,128],[430,120],
  ];
  const vix: [number, number][] = [
    [30,80],[60,85],[90,90],[120,95],[150,100],[175,108],[195,120],
    [205,145],[215,165],[225,178],[240,160],[255,148],[270,135],[285,125],
    [300,118],[320,128],[340,136],[360,142],[380,148],[405,155],[430,160],
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 380 }}>
        <Grid width={W} height={H} />
        <text x={W / 2} y={16} fill="#e040fb" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>VIX — ÍNDICE DEL MIEDO vs SPX</text>

        {/* Zones */}
        <rect x={0}  y={22} width={W} height={H - 40} fill="transparent" />
        <rect x={0}  y={140} width={W} height={38} fill="#ff174408" />
        <line x1={0} y1={140} x2={W} y2={140} stroke="#ff174444" strokeWidth={0.8} strokeDasharray="4 3" />
        <text x={12} y={137} fill="#ff1744" fontSize={8} fontFamily={Mono}>VIX 30+ = PÁNICO / OPORTUNIDAD</text>
        <line x1={0} y1={178} x2={W} y2={178} stroke="#ffd70044" strokeWidth={0.8} strokeDasharray="4 3" />
        <text x={12} y={175} fill="#ffd700" fontSize={8} fontFamily={Mono}>VIX 20 = PRECAUCIÓN</text>

        <path d={smooth(spx)} fill="none" stroke="#00e676" strokeWidth={2.5} />
        <path d={smooth(vix)} fill="none" stroke="#e040fb" strokeWidth={2} />

        {/* Spike annotation */}
        <circle cx={220} cy={165} r={6} fill="#e040fb" />
        <line x1={220} y1={155} x2={220} y2={128} stroke="#e040fb" strokeWidth={0.8} strokeDasharray="3 2" />
        <text x={224} y={122} fill="#e040fb" fontSize={8} fontFamily={Mono}>VIX spike = crash SPX</text>

        {/* SPX bottom = VIX top */}
        <line x1={220} y1={132} x2={220} y2={178} stroke="#00e67644" strokeWidth={0.8} />
        <text x={224} y={195} fill="#00e676" fontSize={8} fontFamily={Mono}>SPX mínimo</text>

        {/* Legend */}
        <circle cx={440} cy={220} r={4} fill="#00e676" />
        <text x={448} y={224} fill="#00e676" fontSize={9} fontFamily={Mono}>SPX</text>
        <circle cx={500} cy={220} r={4} fill="#e040fb" />
        <text x={508} y={224} fill="#e040fb" fontSize={9} fontFamily={Mono}>VIX</text>

        <text x={10} y={H - 5} fill="#546e7a" fontSize={8} fontFamily={Sans}>VIX &gt; 30 históricamente = zona de compra de largo plazo en SPX y BTC. VIX &lt; 15 = complacencia = cuidado.</text>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  7. DOMINANCE CHART                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */
export function DominanceChart() {
  const W = 700, H = 260;
  const btcD: [number, number][] = [
    [30,80],[60,88],[90,95],[120,90],[150,85],[175,78],[200,70],[225,65],
    [245,58],[265,50],[285,58],[305,65],[325,68],[345,72],[365,75],[390,78],
    [415,82],[445,86],[470,88],
  ];
  const usdtD: [number, number][] = [
    [30,200],[60,195],[90,190],[120,185],[150,180],[175,185],[200,190],
    [225,195],[245,200],[265,205],[285,200],[305,194],[325,190],[345,186],
    [365,182],[390,178],[415,175],[445,170],[470,168],
  ];
  const alts: [number, number][] = [
    [30,150],[60,145],[90,140],[120,148],[150,155],[175,162],[200,172],
    [225,178],[245,185],[265,192],[285,182],[305,172],[325,165],[345,158],
    [365,152],[390,148],[415,142],[445,138],[470,135],
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 380 }}>
        <Grid width={W} height={H} />
        <text x={W / 2} y={16} fill="#ffd700" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>DOMINANCIAS — BTC.D / USDT.D / ALTS</text>

        <path d={smooth(btcD)} fill="none" stroke="#ffd700" strokeWidth={2.5} />
        <path d={smooth(usdtD)} fill="none" stroke="#00e676" strokeWidth={2} />
        <path d={smooth(alts)} fill="none" stroke="#e040fb" strokeWidth={1.5} strokeDasharray="5 3" />

        {/* Altcoin season zone */}
        <rect x={195} y={140} width={95} height={70} fill="#e040fb12" stroke="#e040fb33" strokeWidth={0.5} rx={2} />
        <text x={243} y={168} fill="#e040fb" fontSize={8} fontFamily={Mono} textAnchor="middle">ALTSEASON</text>
        <text x={243} y={180} fill="#546e7a" fontSize={8} fontFamily={Mono} textAnchor="middle">BTC.D ↓</text>
        <text x={243} y={192} fill="#546e7a" fontSize={8} fontFamily={Mono} textAnchor="middle">USDT.D ↓</text>

        {/* BTC season zone */}
        <rect x={400} y={60} width={85} height={55} fill="#ffd70012" stroke="#ffd70033" strokeWidth={0.5} rx={2} />
        <text x={442} y={82} fill="#ffd700" fontSize={8} fontFamily={Mono} textAnchor="middle">BTC SEASON</text>
        <text x={442} y={94} fill="#546e7a" fontSize={8} fontFamily={Mono} textAnchor="middle">BTC.D ↑</text>
        <text x={442} y={106} fill="#546e7a" fontSize={8} fontFamily={Mono} textAnchor="middle">USDT.D ↓</text>

        {/* Legend */}
        {[
          { x: 510, color: "#ffd700", label: "BTC.D (Dominancia BTC)" },
          { x: 530, color: "#00e676", label: "USDT.D (Stablecoins)" },
          { x: 550, color: "#e040fb", label: "ALTS.D (Altcoins)" },
        ].map(l => (
          <g key={l.label}>
            <circle cx={510} cy={l.x - 5} r={4} fill={l.color} />
            <text x={520} y={l.x} fill={l.color} fontSize={9} fontFamily={Mono}>{l.label}</text>
          </g>
        ))}

        <text x={10} y={H - 5} fill="#546e7a" fontSize={8} fontFamily={Sans}>AltSeason: BTC.D baja + USDT.D baja = capital fluye de stables hacia altcoins. Bitcoin Season: BTC.D sube.</text>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  8a. CVD CHART — CUMULATIVE VOLUME DELTA                                    */
/* ─────────────────────────────────────────────────────────────────────────── */
type CVDView = "bearish-div" | "bullish-div" | "combos";

export function CVDChart() {
  const [view, setView] = useState<CVDView>("bearish-div");
  const W = 740, H = 340;

  /* shared layout */
  const D1 = 125, D2 = 220; // panel dividers

  /* ── BEARISH DIVERGENCE DATA ── */
  const bdPrice: [number,number][] = [
    [30,108],[60,96],[90,80],[120,64],[150,50],
    [180,54],[210,62],[240,55],[270,46],[300,58],
    [330,72],[360,86],[395,94],[430,100],[470,106],
  ];
  const bdCVD: [number,number][] = [
    [30,200],[60,190],[90,178],[120,167],[150,156],
    [180,160],[210,165],[240,164],[270,168],[300,173],
    [330,178],[360,184],[395,188],[430,190],[470,192],
  ];
  const bdVol: [number, number, string][] = [
    [35,28,"#00e676"],[62,32,"#00e676"],[90,36,"#00e676"],[118,30,"#00e676"],[148,26,"#00e676"],
    [177,18,"#ffd700"],[207,15,"#ff6d00"],[236,12,"#ff1744"],[265,10,"#ff1744"],[294,12,"#ff1744"],
    [325,20,"#ff1744"],[356,24,"#ff1744"],[393,22,"#ff1744"],[428,18,"#ff1744"],[468,16,"#ff1744"],
  ];
  /* peak: price new HH at x=270 (y=46), CVD fails to make new HH (y=168 > prev 156) */

  /* ── BULLISH DIVERGENCE DATA ── */
  const buPrice: [number,number][] = [
    [30,50],[60,60],[90,72],[120,84],[150,95],
    [180,88],[210,80],[240,86],[270,94],[300,84],
    [330,96],[360,106],[395,112],[430,116],[470,118],
    [510,108],[545,96],[575,80],[610,62],[650,48],
  ];
  const buCVD: [number,number][] = [
    [30,152],[60,160],[90,170],[120,178],[150,185],
    [180,180],[210,175],[240,178],[270,182],[300,176],
    [330,184],[360,190],[395,194],[430,197],[470,199],
    [510,192],[545,182],[575,170],[610,158],[650,148],
  ];
  const buVol: [number, number, string][] = [
    [35,22,"#00e676"],[62,18,"#ff1744"],[90,15,"#ff1744"],[118,18,"#ff1744"],[148,22,"#ff1744"],
    [177,20,"#ff1744"],[207,16,"#ff1744"],[236,20,"#ff1744"],[265,18,"#ff1744"],[295,16,"#ff1744"],
    [325,25,"#ff1744"],[357,30,"#ff1744"],[393,38,"#00e676"],[428,44,"#00e676"],[468,48,"#00e676"],
    [508,36,"#00e676"],[543,38,"#00e676"],[573,40,"#00e676"],[608,42,"#00e676"],[648,45,"#00e676"],
  ];
  /* bottom: price LL at x=470 (y=118), CVD higher low (y=199 < prev 199 meh)
     let me use: price LL at x=430, CVD HL
     actually price second bottom at x=470, CVD diverges (higher) */

  function VolBars({ bars }: { bars: [number, number, string][] }) {
    const base = D2 + 5;
    const maxH = H - base - 8;
    return (
      <g>
        {bars.map(([x, h, col], i) => {
          const barH = Math.min(h, maxH);
          return (
            <rect key={i} x={x - 10} y={base + (maxH - barH)} width={18} height={barH}
              fill={col} opacity={0.75} rx={1} />
          );
        })}
      </g>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {([
          ["bearish-div", "📉 Divergencia Bajista", "#ff1744"],
          ["bullish-div", "📈 Divergencia Alcista", "#00e676"],
          ["combos",      "⚡ Las 4 Combinaciones", "#00e5ff"],
        ] as const).map(([v, label, col]) => (
          <button key={v} onClick={() => setView(v)} style={{
            background: view === v ? `${col}22` : "var(--bg3)",
            border: `1px solid ${view === v ? col : "var(--border2)"}`,
            color: view === v ? col : "var(--muted)",
            padding: "6px 14px", fontSize: 10,
            fontFamily: Mono, cursor: "pointer", letterSpacing: 0.8,
          }}>{label}</button>
        ))}
      </div>

      <div style={{ overflowX: "auto", marginBottom: 14 }}>
        <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 420 }}>
          <Grid width={W} height={H} />

          {/* panel dividers */}
          <line x1={0} y1={D1} x2={W} y2={D1} stroke="#1a253580" strokeWidth={1} />
          <line x1={0} y1={D2} x2={W} y2={D2} stroke="#1a253580" strokeWidth={1} />

          {/* ── BEARISH DIVERGENCE ── */}
          {view === "bearish-div" && (
            <g>
              <text x={W/2} y={16} fill="#ff1744" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>CVD — DIVERGENCIA BAJISTA (DISTRIBUCIÓN SILENCIOSA)</text>
              <text x={10} y={30} fill="#00e676" fontSize={9} fontFamily={Mono}>PRECIO</text>
              <text x={10} y={138} fill="#ffd700" fontSize={9} fontFamily={Mono}>CVD (VOLUMEN DELTA ACUMULADO)</text>
              <text x={10} y={228} fill="#546e7a" fontSize={9} fontFamily={Mono}>DELTA POR VELA</text>

              <path d={smooth(bdPrice)} fill="none" stroke="#00e676" strokeWidth={2.5} />
              <path d={smooth(bdCVD)}   fill="none" stroke="#ffd700" strokeWidth={2} />
              <VolBars bars={bdVol} />

              {/* Price HH line */}
              <line x1={150} y1={50} x2={270} y2={46} stroke="#00e676" strokeWidth={1} strokeDasharray="3 2" />
              <circle cx={150} cy={50} r={4} fill="#00e676" />
              <circle cx={270} cy={46} r={4} fill="#00e676" />
              <text x={155} y={38} fill="#00e676" fontSize={8} fontFamily={Mono}>H1</text>
              <text x={275} y={34} fill="#00e676" fontSize={8} fontFamily={Mono}>H2 (HH)</text>

              {/* CVD LH line */}
              <line x1={150} y1={156} x2={270} y2={168} stroke="#ff1744" strokeWidth={1.5} strokeDasharray="3 2" />
              <circle cx={150} cy={156} r={4} fill="#ff1744" />
              <circle cx={270} cy={168} r={4} fill="#ff1744" />
              <text x={155} y={150} fill="#ff1744" fontSize={8} fontFamily={Mono}>CVD H1</text>
              <text x={250} y={163} fill="#ff1744" fontSize={8} fontFamily={Mono}>CVD LH !</text>

              {/* Vertical indicator lines */}
              <line x1={150} y1={46} x2={150} y2={162} stroke="#ffffff20" strokeWidth={0.8} strokeDasharray="2 2" />
              <line x1={270} y1={42} x2={270} y2={174} stroke="#ffffff20" strokeWidth={0.8} strokeDasharray="2 2" />

              {/* Warning box */}
              <rect x={295} y={35} width={215} height={78} fill="#ff174415" stroke="#ff174440" strokeWidth={0.8} rx={2} />
              <text x={402} y={52}  fill="#ff1744" fontSize={9} fontFamily={Mono} textAnchor="middle">⚠ DIVERGENCIA BAJISTA CVD</text>
              <text x={402} y={67}  fill="#e0e0e0" fontSize={8} fontFamily={Mono} textAnchor="middle">Precio hace Higher High</text>
              <text x={402} y={80}  fill="#e0e0e0" fontSize={8} fontFamily={Mono} textAnchor="middle">CVD hace Lower High</text>
              <text x={402} y={95}  fill="#ff6d00" fontSize={8} fontFamily={Mono} textAnchor="middle">Compradores pierden fuerza</text>
              <text x={402} y={108} fill="#ff6d00" fontSize={8} fontFamily={Mono} textAnchor="middle">→ distribución silenciosa</text>

              {/* Arrow down */}
              <line x1={400} y1={118} x2={400} y2={78} stroke="#ff1744" strokeWidth={1.5} />
              <polygon points="396,82 400,73 404,82" fill="#ff1744" />

              <text x={10} y={H-6} fill="#546e7a" fontSize={8} fontFamily={Sans}>
                Señal: precio hace HH pero el CVD no confirma (LH) = los vendedores absorben discretamente las subidas. Preparar short.
              </text>
            </g>
          )}

          {/* ── BULLISH DIVERGENCE ── */}
          {view === "bullish-div" && (
            <g>
              <text x={W/2} y={16} fill="#00e676" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>CVD — DIVERGENCIA ALCISTA (ABSORCIÓN INSTITUCIONAL)</text>
              <text x={10} y={30} fill="#00e676" fontSize={9} fontFamily={Mono}>PRECIO</text>
              <text x={10} y={138} fill="#ffd700" fontSize={9} fontFamily={Mono}>CVD (VOLUMEN DELTA ACUMULADO)</text>
              <text x={10} y={228} fill="#546e7a" fontSize={9} fontFamily={Mono}>DELTA POR VELA</text>

              <path d={smooth(buPrice)} fill="none" stroke="#ff1744" strokeWidth={2.5} />
              <path d={smooth(buCVD)}   fill="none" stroke="#ffd700" strokeWidth={2} />
              <VolBars bars={buVol} />

              {/* Price LL line (two points going down further) */}
              <line x1={395} y1={112} x2={470} y2={118} stroke="#ff1744" strokeWidth={1} strokeDasharray="3 2" />
              <circle cx={395} cy={112} r={4} fill="#ff1744" />
              <circle cx={470} cy={118} r={4} fill="#ff1744" />
              <text x={365} y={110} fill="#ff1744" fontSize={8} fontFamily={Mono}>L1</text>
              <text x={476} y={116} fill="#ff1744" fontSize={8} fontFamily={Mono}>L2 (LL)</text>

              {/* CVD HL line */}
              <line x1={395} y1={194} x2={470} y2={199} stroke="#00e676" strokeWidth={1.5} strokeDasharray="3 2" />
              <circle cx={395} cy={194} r={4} fill="#00e676" />
              <circle cx={470} cy={199} r={4} fill="#00e676" />
              <text x={365} y={192} fill="#00e676" fontSize={8} fontFamily={Mono}>CVD L1</text>
              <text x={454} y={212} fill="#00e676" fontSize={8} fontFamily={Mono}>CVD HL !</text>

              {/* Vertical lines */}
              <line x1={395} y1={108} x2={395} y2={200} stroke="#ffffff20" strokeWidth={0.8} strokeDasharray="2 2" />
              <line x1={470} y1={114} x2={470} y2={205} stroke="#ffffff20" strokeWidth={0.8} strokeDasharray="2 2" />

              {/* Climax volume annotation */}
              <line x1={430} y1={D2-4} x2={430} y2={D2+8} stroke="#00e67688" strokeWidth={0.8} strokeDasharray="3 2" />
              <text x={438} y={D2+15} fill="#00e676" fontSize={8} fontFamily={Mono}>Absorción climática</text>

              {/* Buy signal box */}
              <rect x={500} y={52} width={220} height={70} fill="#00e67615" stroke="#00e67640" strokeWidth={0.8} rx={2} />
              <text x={610} y={68}  fill="#00e676" fontSize={9} fontFamily={Mono} textAnchor="middle">✅ DIVERGENCIA ALCISTA CVD</text>
              <text x={610} y={82}  fill="#e0e0e0" fontSize={8} fontFamily={Mono} textAnchor="middle">Precio hace Lower Low</text>
              <text x={610} y={95}  fill="#e0e0e0" fontSize={8} fontFamily={Mono} textAnchor="middle">CVD hace Higher Low</text>
              <text x={610} y={109} fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="middle">→ Compradores absorben la caída</text>

              {/* Arrow up after divergence */}
              <line x1={560} y1={100} x2={560} y2={120} stroke="#00e676" strokeWidth={2} />
              <polygon points="556,104 560,95 564,104" fill="#00e676" />

              <text x={10} y={H-6} fill="#546e7a" fontSize={8} fontFamily={Sans}>
                Señal: precio hace LL pero CVD hace HL = los compradores institucionales absorben cada venta. Preparar long en OB o FVG.
              </text>
            </g>
          )}

          {/* ── 4 COMBINATIONS ── */}
          {view === "combos" && (
            <g>
              <text x={W/2} y={16} fill="#00e5ff" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>CVD — LAS 4 COMBINACIONES CON PRECIO</text>

              {/* 2x2 grid */}
              {/* Combo 1: Precio ↑ + CVD ↑ = BULL TREND (top-left) */}
              {(() => {
                const gx = 30, gy = 30, gw = 310, gh = 130;
                const px: [number,number][] = [[gx+10,gy+gh-20],[gx+60,gy+gh-45],[gx+110,gy+gh-70],[gx+160,gy+gh-95],[gx+210,gy+gh-115],[gx+260,gy+20]];
                const cx2: [number,number][] = [[gx+10,gy+gh-15],[gx+60,gy+gh-38],[gx+110,gy+gh-62],[gx+160,gy+gh-88],[gx+210,gy+gh-108],[gx+260,gy+26]];
                return (
                  <g>
                    <rect x={gx} y={gy} width={gw} height={gh} fill="#00e67610" stroke="#00e67630" strokeWidth={1} rx={3} />
                    <text x={gx+gw/2} y={gy+14} fill="#00e676" fontSize={9} fontFamily={Mono} textAnchor="middle">Precio ↑ + CVD ↑</text>
                    <path d={smooth(px)} fill="none" stroke="#00e676" strokeWidth={2} />
                    <path d={smooth(cx2)} fill="none" stroke="#ffd700" strokeWidth={1.5} />
                    <text x={gx+gw/2} y={gy+gh-6} fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="middle">✅ UPTREND REAL — Compradores agresivos</text>
                    <text x={gx+20} y={gy+25} fill="#00e676" fontSize={8} fontFamily={Mono}>Precio</text>
                    <text x={gx+20} y={gy+38} fill="#ffd700" fontSize={8} fontFamily={Mono}>CVD</text>
                  </g>
                );
              })()}

              {/* Combo 2: Precio ↑ + CVD ↓ = DISTRIBUCIÓN (top-right) */}
              {(() => {
                const gx = 370, gy = 30, gw = 340, gh = 130;
                const px: [number,number][] = [[gx+10,gy+gh-20],[gx+60,gy+gh-45],[gx+110,gy+gh-70],[gx+160,gy+gh-90],[gx+210,gy+gh-108],[gx+280,gy+22]];
                const cx2: [number,number][] = [[gx+10,gy+30],[gx+60,gy+45],[gx+110,gy+58],[gx+160,gy+72],[gx+210,gy+88],[gx+280,gy+gh-22]];
                return (
                  <g>
                    <rect x={gx} y={gy} width={gw} height={gh} fill="#ff174410" stroke="#ff174430" strokeWidth={1} rx={3} />
                    <text x={gx+gw/2} y={gy+14} fill="#ff6d00" fontSize={9} fontFamily={Mono} textAnchor="middle">Precio ↑ + CVD ↓</text>
                    <path d={smooth(px)} fill="none" stroke="#00e676" strokeWidth={2} />
                    <path d={smooth(cx2)} fill="none" stroke="#ffd700" strokeWidth={1.5} />
                    <text x={gx+gw/2} y={gy+gh-6} fill="#ff6d00" fontSize={8} fontFamily={Mono} textAnchor="middle">⚠ TRAMPA ALCISTA — Distribución silenciosa</text>
                    <text x={gx+20} y={gy+25} fill="#00e676" fontSize={8} fontFamily={Mono}>Precio</text>
                    <text x={gx+20} y={gy+38} fill="#ffd700" fontSize={8} fontFamily={Mono}>CVD</text>
                  </g>
                );
              })()}

              {/* Combo 3: Precio ↓ + CVD ↓ = DOWNTREND (bottom-left) */}
              {(() => {
                const gx = 30, gy = 180, gw = 310, gh = 130;
                const px: [number,number][] = [[gx+10,gy+22],[gx+60,gy+45],[gx+110,gy+65],[gx+160,gy+85],[gx+210,gy+100],[gx+260,gy+gh-15]];
                const cx2: [number,number][] = [[gx+10,gy+26],[gx+60,gy+48],[gx+110,gy+68],[gx+160,gy+88],[gx+210,gy+104],[gx+260,gy+gh-10]];
                return (
                  <g>
                    <rect x={gx} y={gy} width={gw} height={gh} fill="#ff174410" stroke="#ff174430" strokeWidth={1} rx={3} />
                    <text x={gx+gw/2} y={gy+14} fill="#ff1744" fontSize={9} fontFamily={Mono} textAnchor="middle">Precio ↓ + CVD ↓</text>
                    <path d={smooth(px)} fill="none" stroke="#ff1744" strokeWidth={2} />
                    <path d={smooth(cx2)} fill="none" stroke="#ffd700" strokeWidth={1.5} />
                    <text x={gx+gw/2} y={gy+gh-6} fill="#ff1744" fontSize={8} fontFamily={Mono} textAnchor="middle">🔴 DOWNTREND REAL — Vendedores agresivos</text>
                    <text x={gx+20} y={gy+25} fill="#ff1744" fontSize={8} fontFamily={Mono}>Precio</text>
                    <text x={gx+20} y={gy+38} fill="#ffd700" fontSize={8} fontFamily={Mono}>CVD</text>
                  </g>
                );
              })()}

              {/* Combo 4: Precio ↓ + CVD ↑ = ABSORCIÓN (bottom-right) */}
              {(() => {
                const gx = 370, gy = 180, gw = 340, gh = 130;
                const px: [number,number][] = [[gx+10,gy+22],[gx+60,gy+45],[gx+110,gy+65],[gx+160,gy+85],[gx+210,gy+100],[gx+280,gy+gh-12]];
                const cx2: [number,number][] = [[gx+10,gy+gh-18],[gx+60,gy+gh-38],[gx+110,gy+gh-58],[gx+160,gy+gh-75],[gx+210,gy+gh-92],[gx+280,gy+30]];
                return (
                  <g>
                    <rect x={gx} y={gy} width={gw} height={gh} fill="#00e67610" stroke="#00e67630" strokeWidth={1} rx={3} />
                    <text x={gx+gw/2} y={gy+14} fill="#00e5ff" fontSize={9} fontFamily={Mono} textAnchor="middle">Precio ↓ + CVD ↑</text>
                    <path d={smooth(px)} fill="none" stroke="#ff1744" strokeWidth={2} />
                    <path d={smooth(cx2)} fill="none" stroke="#ffd700" strokeWidth={1.5} />
                    <text x={gx+gw/2} y={gy+gh-6} fill="#00e5ff" fontSize={8} fontFamily={Mono} textAnchor="middle">💧 ABSORCIÓN — Institucionales compran la caída</text>
                    <text x={gx+20} y={gy+25} fill="#ff1744" fontSize={8} fontFamily={Mono}>Precio</text>
                    <text x={gx+20} y={gy+38} fill="#ffd700" fontSize={8} fontFamily={Mono}>CVD</text>
                  </g>
                );
              })()}

              <text x={10} y={H-6} fill="#546e7a" fontSize={8} fontFamily={Sans}>
                Las 4 combinaciones Precio+CVD revelan la convicción real detrás de cada movimiento. El CVD nunca miente — el precio puede ser manipulado, el flujo no.
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  8b. OPEN INTEREST CHART — COMPLETO CON TOGGLE                              */
/* ─────────────────────────────────────────────────────────────────────────── */
type OIView = "combinaciones" | "funding" | "liquidaciones";

export function OpenInterestChart() {
  const [view, setView] = useState<OIView>("combinaciones");
  const W = 740, H = 320;

  /* ── COMBINACIONES: price & OI data ── */
  /* 4 mini-charts inside one SVG showing the 4 combos */
  function miniChart(
    gx: number, gy: number, gw: number, gh: number,
    title: string, titleColor: string,
    pricePts: [number,number][], oiPts: [number,number][],
    note: string, noteColor: string, bg: string, border: string
  ) {
    const pw = gw - 20, ph = (gh - 40) / 2 - 4;
    const midY = gy + 24 + ph + 4;
    return (
      <g>
        <rect x={gx} y={gy} width={gw} height={gh} fill={bg} stroke={border} strokeWidth={1} rx={3} />
        <text x={gx+gw/2} y={gy+14} fill={titleColor} fontSize={9} fontFamily={Mono} textAnchor="middle">{title}</text>
        {/* price sub-panel */}
        <path d={smooth(pricePts)} fill="none" stroke="#00e676" strokeWidth={2} />
        <line x1={gx} y1={midY} x2={gx+gw} y2={midY} stroke="#1a253580" strokeWidth={0.8} />
        {/* oi sub-panel */}
        <path d={smooth(oiPts)} fill="none" stroke="#00e5ff" strokeWidth={2} />
        <text x={gx+gw/2} y={gy+gh-6} fill={noteColor} fontSize={8} fontFamily={Mono} textAnchor="middle">{note}</text>
        <text x={gx+8} y={gy+26} fill="#00e676" fontSize={7} fontFamily={Mono}>Precio</text>
        <text x={gx+8} y={midY+14} fill="#00e5ff" fontSize={7} fontFamily={Mono}>OI</text>
      </g>
    );
  }

  /* build price & OI point arrays positioned within each mini-chart box */
  function pts(gx: number, gy: number, gw: number, gh: number, topPanel: boolean, up: boolean): [number,number][] {
    const ph = (gh - 40) / 2 - 4;
    const startY = topPanel ? gy + 22 : gy + 22 + ph + 8;
    const endY   = startY + ph;
    const midY   = (startY + endY) / 2;
    const n = 6;
    return Array.from({ length: n }, (_, i) => {
      const x = gx + 18 + (gw - 36) * (i / (n - 1));
      const t = i / (n - 1);
      const y = up ? endY - t * (endY - startY) * 0.85 : startY + t * (endY - startY) * 0.85;
      return [x, y] as [number, number];
    });
  }

  /* ── FUNDING: rate history ── */
  const fundX = Array.from({ length: 22 }, (_, i) => 30 + i * 32);
  const fundYNorm: number[] = [158,155,152,148,145,140,138,134,130,126,120,116,112,118,124,130,136,142,148,154,158,162];
  const fundYHot:  number[] = [150,145,138,130,122,112,105,95,88,80,76,82,92,102,115,125,135,148,158,165,170,172];
  const fundYShort: number[]= [170,175,178,182,188,194,200,205,208,212,210,205,198,190,180,170,160,150,142,138,135,132];
  const fundBase = 180; // zero line in funding panel

  const fundPtsNorm: [number,number][]  = fundX.map((x, i) => [x, fundYNorm[i]]);
  const fundPtsHot: [number,number][]   = fundX.map((x, i) => [x, fundYHot[i]]);
  const fundPtsShort: [number,number][] = fundX.map((x, i) => [x, fundYShort[i]]);

  /* ── LIQUIDACIONES ── */
  const liqPrice: [number,number][] = [
    [30,60],[65,58],[100,56],[135,54],[170,53],
    [200,55],[220,60],[240,70],[255,88],[268,108],
    [280,132],[292,158],[302,180],[312,200],[322,215],
    [330,224],[340,220],[355,210],[375,196],[400,182],
    [430,170],[470,158],[520,148],[580,142],[650,138],
  ];
  const liqOI: [number,number][] = [
    [30,220],[65,218],[100,216],[135,215],[170,214],
    [200,215],[220,216],[240,218],[255,222],[268,228],
    [280,232],[292,236],[302,238],[312,236],[322,230],
    [330,222],[340,215],[355,208],[375,204],[400,202],
    [430,205],[470,208],[520,210],[580,212],[650,214],
  ];
  const liqCascadeX = 255;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {([
          ["combinaciones", "📊 Las 4 Combinaciones", "#00e5ff"],
          ["funding",       "💰 Funding Rate Extremos", "#e040fb"],
          ["liquidaciones", "💥 Cascada de Liquidaciones", "#ff6d00"],
        ] as const).map(([v, label, col]) => (
          <button key={v} onClick={() => setView(v)} style={{
            background: view === v ? `${col}22` : "var(--bg3)",
            border: `1px solid ${view === v ? col : "var(--border2)"}`,
            color: view === v ? col : "var(--muted)",
            padding: "6px 14px", fontSize: 10,
            fontFamily: Mono, cursor: "pointer", letterSpacing: 0.8,
          }}>{label}</button>
        ))}
      </div>

      <div style={{ overflowX: "auto", marginBottom: 14 }}>
        <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 420 }}>
          <Grid width={W} height={H} />

          {/* ── COMBINACIONES ── */}
          {view === "combinaciones" && (
            <g>
              <text x={W/2} y={16} fill="#00e5ff" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>OPEN INTEREST — LAS 4 COMBINACIONES CON PRECIO</text>

              {/* Box 1: P↑ + OI↑ = Trend alcista */}
              {miniChart(20, 28, 330, 130, "Precio ↑ + OI ↑", "#00e676",
                pts(20,28,330,130,true,true), pts(20,28,330,130,false,true),
                "✅ UPTREND — Nuevos longs abren", "#00e676", "#00e67610","#00e67630")}

              {/* Box 2: P↑ + OI↓ = Short squeeze */}
              {miniChart(370, 28, 350, 130, "Precio ↑ + OI ↓", "#ff6d00",
                pts(370,28,350,130,true,true), pts(370,28,350,130,false,false),
                "⚡ SHORT SQUEEZE — Shorts capitulando", "#ff6d00", "#ff6d0010","#ff6d0030")}

              {/* Box 3: P↓ + OI↑ = Bear trend */}
              {miniChart(20, 170, 330, 130, "Precio ↓ + OI ↑", "#ff1744",
                pts(20,170,330,130,true,false), pts(20,170,330,130,false,true),
                "🔴 DOWNTREND — Nuevos shorts abren", "#ff1744", "#ff174410","#ff174430")}

              {/* Box 4: P↓ + OI↓ = Liquidación longs */}
              {miniChart(370, 170, 350, 130, "Precio ↓ + OI ↓", "#ffd700",
                pts(370,170,350,130,true,false), pts(370,170,350,130,false,false),
                "⚠ LONG SQUEEZE — Longs liquidados", "#ffd700", "#ffd70010","#ffd70030")}

              <text x={10} y={H-6} fill="#546e7a" fontSize={8} fontFamily={Sans}>
                OI + Precio = la combinación más poderosa de derivados. Cada escenario tiene una acción distinta.
              </text>
            </g>
          )}

          {/* ── FUNDING RATE EXTREMOS ── */}
          {view === "funding" && (
            <g>
              <text x={W/2} y={16} fill="#e040fb" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>FUNDING RATE — SEÑALES DE EXTREMOS DE MERCADO</text>

              {/* Zero line */}
              <line x1={20} y1={fundBase} x2={W-20} y2={fundBase} stroke="#546e7a" strokeWidth={1} strokeDasharray="4 3" />
              <text x={W-14} y={fundBase+4} fill="#546e7a" fontSize={8} fontFamily={Mono}>0%</text>

              {/* Danger zone: funding muy positivo (top = y small) */}
              <rect x={20} y={28} width={W-40} height={68} fill="#ff174408" stroke="#ff174420" strokeWidth={0.5} />
              <text x={30} y={44} fill="#ff1744" fontSize={8} fontFamily={Mono}>ZONA PELIGRO LONG (Funding muy positivo {'>'} +0.05%)</text>
              <text x={30} y={58} fill="#ff6d00" fontSize={8} fontFamily={Mono}>Longs pagan mucho a shorts → mercado sobrecalentado → dump inminente</text>
              <text x={30} y={72} fill="#546e7a" fontSize={8} fontFamily={Mono}>Ejemplo: BTC nov 2021 → funding +0.15% → -30% en 2 semanas</text>

              {/* Danger zone: funding muy negativo (bottom = y large) */}
              <rect x={20} y={226} width={W-40} height={68} fill="#00e67408" stroke="#00e67420" strokeWidth={0.5} />
              <text x={30} y={240} fill="#00e676" fontSize={8} fontFamily={Mono}>ZONA OPORTUNIDAD (Funding muy negativo {'<'} -0.05%)</text>
              <text x={30} y={254} fill="#00e676" fontSize={8} fontFamily={Mono}>Shorts pagan mucho a longs → todos van cortos → short squeeze listo</text>
              <text x={30} y={268} fill="#546e7a" fontSize={8} fontFamily={Mono}>Señal contrarian: cuando todos esperan baja → el precio sube</text>

              {/* Safe zone label */}
              <text x={30} y={174} fill="#7a8fa0" fontSize={8} fontFamily={Mono}>ZONA NEUTRAL (±0.01%) — financiamiento normal de posiciones</text>

              {/* Funding lines */}
              <path d={smooth(fundPtsNorm)}  fill="none" stroke="#7c4dff" strokeWidth={1.5} strokeDasharray="5 3" />
              <path d={smooth(fundPtsHot)}   fill="none" stroke="#ff1744" strokeWidth={2} />
              <path d={smooth(fundPtsShort)} fill="none" stroke="#00e676" strokeWidth={2} />

              {/* Legend */}
              <line x1={W-230} y1={132} x2={W-210} y2={132} stroke="#7c4dff" strokeWidth={1.5} strokeDasharray="4 3" />
              <text x={W-205} y={136} fill="#7c4dff" fontSize={8} fontFamily={Mono}>Neutral</text>
              <line x1={W-230} y1={148} x2={W-210} y2={148} stroke="#ff1744" strokeWidth={2} />
              <text x={W-205} y={152} fill="#ff1744" fontSize={8} fontFamily={Mono}>Sobrecalentado Long</text>
              <line x1={W-230} y1={164} x2={W-210} y2={164} stroke="#00e676" strokeWidth={2} />
              <text x={W-205} y={168} fill="#00e676" fontSize={8} fontFamily={Mono}>Sobrecalentado Short</text>

              {/* Tick annotations */}
              <text x={30} y={H-6} fill="#546e7a" fontSize={8} fontFamily={Sans}>
                Funding positivo: longs pagan 0.01% cada 8h a shorts (Binance/Bybit/OKX). Funding negativo: shorts pagan a longs. Extremos = reversal.
              </text>
            </g>
          )}

          {/* ── CASCADA DE LIQUIDACIONES ── */}
          {view === "liquidaciones" && (
            <g>
              <text x={W/2} y={16} fill="#ff6d00" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>CASCADA DE LIQUIDACIONES — MECANISMO INSTITUCIONAL</text>

              {/* Panel divider */}
              <line x1={0} y1={250} x2={W} y2={250} stroke="#1a253580" strokeWidth={1} />
              <text x={10} y={30}  fill="#00e676" fontSize={9} fontFamily={Mono}>PRECIO</text>
              <text x={10} y={258} fill="#00e5ff" fontSize={9} fontFamily={Mono}>OPEN INTEREST</text>

              {/* Lines */}
              <path d={smooth(liqPrice)} fill="none" stroke="#00e676" strokeWidth={2} />
              <path d={smooth(liqOI)}    fill="none" stroke="#00e5ff" strokeWidth={2} />

              {/* Phase 1: Consolidation */}
              <rect x={28} y={25} width={liqCascadeX-28} height={200} fill="#7c4dff08" />
              <text x={(28+liqCascadeX)/2} y={42} fill="#7c4dff" fontSize={8} fontFamily={Mono} textAnchor="middle">1. CONSOLIDACIÓN</text>
              <text x={(28+liqCascadeX)/2} y={56} fill="#546e7a" fontSize={7} fontFamily={Mono} textAnchor="middle">OI sube → longs acumulados</text>

              {/* Phase 2: Cascade */}
              <rect x={liqCascadeX} y={25} width={100} height={200} fill="#ff174412" />
              <text x={liqCascadeX+50} y={42} fill="#ff1744" fontSize={8} fontFamily={Mono} textAnchor="middle">2. INICIO</text>
              <text x={liqCascadeX+50} y={56} fill="#ff6d00" fontSize={7} fontFamily={Mono} textAnchor="middle">precio rompe SSL</text>

              {/* Phase 3: Liq cascade */}
              <rect x={liqCascadeX+100} y={25} width={120} height={200} fill="#ff174420" />
              <text x={liqCascadeX+160} y={42} fill="#ff1744" fontSize={9} fontFamily={Mono} textAnchor="middle">3. CASCADA</text>
              <text x={liqCascadeX+160} y={56} fill="#ff6d00" fontSize={8} fontFamily={Mono} textAnchor="middle">stop hunts en cascada</text>

              {/* Phase 4: Recovery */}
              <rect x={liqCascadeX+220} y={25} width={W-liqCascadeX-240} height={200} fill="#00e67408" />
              <text x={liqCascadeX+280} y={42} fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="middle">4. ABSORCIÓN</text>
              <text x={liqCascadeX+280} y={56} fill="#00e676" fontSize={7} fontFamily={Mono} textAnchor="middle">institucionales compran</text>

              {/* Cascade annotation */}
              <line x1={liqCascadeX+100} y1={180} x2={liqCascadeX+100} y2={140} stroke="#ff174480" strokeWidth={0.8} strokeDasharray="3 2" />
              <text x={liqCascadeX+105} y={136} fill="#ff1744" fontSize={7} fontFamily={Mono}>SL1 → SL2 → SL3</text>
              <text x={liqCascadeX+105} y={148} fill="#ff6d00" fontSize={7} fontFamily={Mono}>cada SL empuja más</text>

              {/* OI annotations */}
              <text x={50}  y={280} fill="#7c4dff" fontSize={8} fontFamily={Mono}>OI sube = longs abren</text>
              <text x={256} y={280} fill="#ff1744" fontSize={8} fontFamily={Mono}>OI cae = longs liquidados</text>
              <text x={480} y={280} fill="#00e676" fontSize={8} fontFamily={Mono}>OI estabiliza = fin de cascada</text>

              {/* Heatmap legend */}
              <rect x={W-200} y={170} width={185} height={68} fill="#0a0f18" stroke="#1a253580" strokeWidth={0.5} rx={2} />
              <text x={W-108} y={185} fill="#ff6d00" fontSize={8} fontFamily={Mono} textAnchor="middle">¿POR QUÉ ES PREDECIBLE?</text>
              <text x={W-108} y={198} fill="#7a8fa0" fontSize={8} fontFamily={Mono} textAnchor="middle">Los exchanges publican</text>
              <text x={W-108} y={210} fill="#7a8fa0" fontSize={8} fontFamily={Mono} textAnchor="middle">Liquidation Heatmaps</text>
              <text x={W-108} y={222} fill="#00e5ff" fontSize={8} fontFamily={Mono} textAnchor="middle">donde hay SL de apalancados</text>
              <text x={W-108} y={234} fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="middle">→ barrer esa zona = gratis</text>

              <text x={10} y={H-6} fill="#546e7a" fontSize={8} fontFamily={Sans}>
                El smart money usa los Liquidation Heatmaps (Coinglass) para identificar dónde están los SL — y los barre. El precio "rebota mágicamente" allí porque era un barrido planeado.
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  9. RISK / REWARD DIAGRAM                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */
export function RiskRewardChart() {
  const W = 700, H = 280;
  const entryY = 160, slY = 210, tp1Y = 110, tp2Y = 60, tp3Y = 20;
  const entryX = 80, exitX = 580;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 380 }}>
        <Grid width={W} height={H} />
        <text x={W / 2} y={16} fill="#00e5ff" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>GESTIÓN DE RIESGO — RISK / REWARD</text>

        {/* Risk zone (entry to SL) */}
        <rect x={entryX} y={entryY} width={exitX - entryX} height={slY - entryY} fill="#ff174420" stroke="#ff174444" strokeWidth={0.5} />
        {/* TP zones */}
        <rect x={entryX} y={tp1Y} width={exitX - entryX} height={entryY - tp1Y} fill="#00e67610" stroke="#00e67630" strokeWidth={0.5} />
        <rect x={entryX} y={tp2Y} width={exitX - entryX} height={tp1Y - tp2Y} fill="#00e67618" stroke="#00e67440" strokeWidth={0.5} />
        <rect x={entryX} y={tp3Y} width={exitX - entryX} height={tp2Y - tp3Y} fill="#00e67622" stroke="#00e67450" strokeWidth={0.5} />

        {/* Level lines */}
        {[
          { y: slY,    color: "#ff1744", label: "SL — Stop Loss",   rr: "−1R",  pct: "−1%" },
          { y: entryY, color: "#ffffff", label: "ENTRADA",           rr: "0",    pct: "Precio de entrada" },
          { y: tp1Y,   color: "#00e676", label: "TP1",              rr: "+2R",  pct: "+2%" },
          { y: tp2Y,   color: "#00e676", label: "TP2",              rr: "+3R",  pct: "+3%" },
          { y: tp3Y,   color: "#ffd700", label: "TP3",              rr: "+5R",  pct: "+5%" },
        ].map(l => (
          <g key={l.y}>
            <line x1={entryX} y1={l.y} x2={exitX} y2={l.y} stroke={l.color} strokeWidth={1.2} strokeDasharray={l.y === entryY ? undefined : "5 3"} />
            <text x={entryX - 5} y={l.y + 4} fill={l.color} fontSize={9} fontFamily={Mono} textAnchor="end">{l.label}</text>
            <text x={exitX + 5} y={l.y + 4} fill={l.color} fontSize={9} fontFamily={Mono}>{l.rr}</text>
            <text x={exitX + 40} y={l.y + 4} fill="#546e7a" fontSize={8} fontFamily={Mono}>{l.pct}</text>
          </g>
        ))}

        {/* Entry arrow */}
        <circle cx={entryX} cy={entryY} r={6} fill="#ffffff" stroke="#0a0f18" strokeWidth={1} />
        <text x={entryX} y={entryY + 18} fill="#ffffff" fontSize={8} fontFamily={Mono} textAnchor="middle">ENTRADA</text>

        {/* Price path */}
        <path d={path([[entryX, entryY],[150,150],[200,140],[250,125],[300,115],[350,105],[400,95],[450,80],[500,65],[550,50]])} fill="none" stroke="#00e676" strokeWidth={2} />

        {/* SL arrow */}
        <text x={entryX} y={slY + 18} fill="#ff1744" fontSize={8} fontFamily={Mono} textAnchor="middle">STOP LOSS</text>
        <text x={entryX} y={slY + 28} fill="#ff1744" fontSize={7} fontFamily={Mono} textAnchor="middle">si precio llega aquí</text>

        {/* R:R labels */}
        <rect x={10} y={50} width={65} height={180} fill="#00000000" />
        {[
          { y: slY,  label: "1R", color: "#ff1744" },
          { y: tp1Y, label: "2R", color: "#00e676" },
          { y: tp2Y, label: "3R", color: "#00e676" },
          { y: tp3Y, label: "5R", color: "#ffd700" },
        ].map(r => (
          <g key={r.y}>
            <line x1={20} y1={entryY} x2={20} y2={r.y} stroke={`${r.color}44`} strokeWidth={1} />
            <text x={10} y={(entryY + r.y) / 2 + 3} fill={r.color} fontSize={8} fontFamily={Mono}>{r.label}</text>
          </g>
        ))}

        {/* Math box */}
        <rect x={555} y={80} width={130} height={100} fill="#00000040" stroke="#1a2535" strokeWidth={0.5} rx={2} />
        <text x={620} y={96}  fill="#ffd700" fontSize={9} fontFamily={Mono} textAnchor="middle">MATEMÁTICA</text>
        <text x={620} y={112} fill="#ff1744" fontSize={8} fontFamily={Mono} textAnchor="middle">Riesgo: 1%</text>
        <text x={620} y={126} fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="middle">TP1: +2% (+2R)</text>
        <text x={620} y={140} fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="middle">TP2: +3% (+3R)</text>
        <text x={620} y={154} fill="#ffd700" fontSize={8} fontFamily={Mono} textAnchor="middle">TP3: +5% (+5R)</text>
        <text x={620} y={172} fill="#00e5ff" fontSize={8} fontFamily={Mono} textAnchor="middle">WIN RATE: 40%</text>
        <text x={620} y={184} fill="#00e5ff" fontSize={8} fontFamily={Mono} textAnchor="middle">aún rentable a 3R</text>

        <text x={10} y={H - 5} fill="#546e7a" fontSize={8} fontFamily={Sans}>Con R:R mínimo 2:1 y 40% de win rate eres rentable. No necesitas acertar más de la mitad de las veces.</text>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* 10. INTRO MERCADOS — Order Book / Bid-Ask                                   */
/* ─────────────────────────────────────────────────────────────────────────── */
export function MarketAnatomyChart() {
  const W = 700, H = 260;
  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 380 }}>
        <Grid width={W} height={H} />
        <text x={W / 2} y={16} fill="#00e5ff" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>ORDER BOOK — BID / ASK / SPREAD</text>

        {/* Order book visual */}
        {/* ASK side (vendedores) — right of center, red bars */}
        {[
          { price: "50,250", size: 80, y: 45 },
          { price: "50,200", size: 50, y: 65 },
          { price: "50,150", size: 110, y: 85 },
          { price: "50,100", size: 60, y: 105 },
          { price: "50,050", size: 90, y: 125 },
        ].map((o, i) => (
          <g key={i}>
            <rect x={280} y={o.y} width={o.size} height={14} fill="#ff174430" stroke="#ff174466" strokeWidth={0.5} />
            <text x={275} y={o.y + 10} fill="#ff1744" fontSize={8} fontFamily={Mono} textAnchor="end">{o.price}</text>
            <text x={285 + o.size} y={o.y + 10} fill="#546e7a" fontSize={8} fontFamily={Mono}>{o.size / 10}.0 BTC</text>
          </g>
        ))}

        {/* BID side (compradores) — red bars below */}
        {[
          { price: "49,980", size: 120, y: 150 },
          { price: "49,950", size: 70, y: 170 },
          { price: "49,900", size: 95, y: 190 },
          { price: "49,850", size: 55, y: 210 },
          { price: "49,800", size: 140, y: 230 },
        ].map((o, i) => (
          <g key={i}>
            <rect x={280} y={o.y} width={o.size} height={14} fill="#00e67630" stroke="#00e67666" strokeWidth={0.5} />
            <text x={275} y={o.y + 10} fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="end">{o.price}</text>
            <text x={285 + o.size} y={o.y + 10} fill="#546e7a" fontSize={8} fontFamily={Mono}>{o.size / 10}.0 BTC</text>
          </g>
        ))}

        {/* Spread zone */}
        <rect x={240} y={137} width={220} height={14} fill="#ffd70015" stroke="#ffd70044" strokeWidth={0.5} />
        <text x={350} y={147} fill="#ffd700" fontSize={8} fontFamily={Mono} textAnchor="middle">SPREAD = Ask − Bid</text>

        {/* Labels */}
        <text x={240} y={42}  fill="#ff1744" fontSize={9} fontFamily={Mono}>ASKS (vendedores)</text>
        <text x={240} y={148} fill="#00e676" fontSize={9} fontFamily={Mono}>BIDS (compradores)</text>

        {/* Definitions panel */}
        {[
          { y: 50,  color: "#00e5ff", term: "BID",    def: "Precio máximo que el comprador quiere pagar" },
          { y: 72,  color: "#ff1744", term: "ASK",    def: "Precio mínimo que el vendedor acepta" },
          { y: 94,  color: "#ffd700", term: "SPREAD", def: "Diferencia entre Ask y Bid = costo de la transacción" },
          { y: 116, color: "#546e7a", term: "SLIPPAGE",def: "Diferencia entre precio esperado y precio ejecutado" },
          { y: 138, color: "#e040fb", term: "MARKET",  def: "Orden que se ejecuta al precio disponible (Ask/Bid)" },
          { y: 160, color: "#00e676", term: "LIMIT",   def: "Orden que espera hasta que el precio llegue a tu nivel" },
        ].map(d => (
          <g key={d.term}>
            <text x={10} y={d.y} fill={d.color} fontSize={9} fontFamily={Mono}>{d.term}</text>
            <text x={85} y={d.y} fill="#7a8fa0" fontSize={9} fontFamily={Sans}>{d.def}</text>
          </g>
        ))}

        <text x={10} y={H - 5} fill="#546e7a" fontSize={8} fontFamily={Sans}>Spread estrecho = alta liquidez (EUR/USD, BTC/USDT). Spread amplio = baja liquidez = más riesgo de slippage.</text>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* 11. BONDS / YIELDS CHART                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */
export function BondsChart() {
  const W = 700, H = 260;
  const yields: [number, number][] = [
    [30,200],[55,192],[80,185],[105,175],[130,165],[155,158],[175,148],
    [195,138],[210,128],[225,118],[240,130],[255,140],[270,148],[285,155],
    [300,162],[315,155],[330,148],[345,140],[360,132],[380,125],[405,118],
  ];
  const btcInv: [number, number][] = [
    [30,80],[55,88],[80,95],[105,105],[130,118],[155,128],[175,140],
    [195,152],[210,162],[225,172],[240,160],[255,148],[270,138],[285,130],
    [300,122],[315,130],[330,140],[345,150],[360,158],[380,165],[405,172],
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 380 }}>
        <Grid width={W} height={H} />
        <text x={W / 2} y={16} fill="#ffd700" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>BONOS 10Y — YIELDS vs RIESGO</text>

        {/* Yield curve normal/inverted */}
        {/* Yield curve bars */}
        {[
          { t: "3M", v: 65 }, { t: "1Y", v: 55 }, { t: "2Y", v: 50 },
          { t: "5Y", v: 48 }, { t: "10Y", v: 45 }, { t: "30Y", v: 42 },
        ].map((b, i) => (
          <g key={i}>
            <rect x={480 + i * 32} y={100 + b.v} width={22} height={130 - b.v} fill="#ffd70030" stroke="#ffd70066" strokeWidth={0.5} />
            <text x={491 + i * 32} y={98 + b.v} fill="#ffd700" fontSize={7} fontFamily={Mono} textAnchor="middle">{b.v}%</text>
            <text x={491 + i * 32} y={H - 8} fill="#546e7a" fontSize={7} fontFamily={Mono} textAnchor="middle">{b.t}</text>
          </g>
        ))}
        <text x={555} y={40} fill="#ffd700" fontSize={9} fontFamily={Mono} textAnchor="middle">CURVA DE RENDIMIENTO</text>
        <text x={555} y={55} fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="middle">NORMAL (pendiente +)</text>

        <path d={smooth(yields)} fill="none" stroke="#ffd700" strokeWidth={2} />
        <path d={smooth(btcInv)} fill="none" stroke="#00e5ff" strokeWidth={1.5} strokeDasharray="5 3" />

        {/* Key zones */}
        <line x1={0} y1={120} x2={450} y2={120} stroke="#ff174444" strokeWidth={0.8} strokeDasharray="4 3" />
        <text x={10} y={116} fill="#ff1744" fontSize={8} fontFamily={Mono}>Yields altos = presión sobre activos de riesgo</text>

        {/* Legend */}
        <line x1={10} y1={210} x2={35} y2={210} stroke="#ffd700" strokeWidth={2} />
        <text x={40} y={214} fill="#ffd700" fontSize={9} fontFamily={Mono}>10Y Yield</text>
        <line x1={10} y1={228} x2={35} y2={228} stroke="#00e5ff" strokeWidth={1.5} strokeDasharray="5 3" />
        <text x={40} y={232} fill="#00e5ff" fontSize={9} fontFamily={Mono}>BTC (inv.)</text>

        <text x={10} y={H - 5} fill="#546e7a" fontSize={8} fontFamily={Sans}>10Y Yield sube = BTC/acciones caen. 10Y Yield baja = risk-on, BTC sube. Curva invertida = señal de recesión.</text>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* 12. GOLD CYCLES CHART                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */
export function GoldCyclesChart() {
  const W = 700, H = 260;
  const gold: [number, number][] = [
    [30,230],[55,225],[80,218],[105,208],[125,195],[140,180],[155,165],
    [170,152],[185,145],[200,150],[215,158],[230,165],[245,158],[260,148],
    [275,138],[290,125],[305,112],[318,100],[330,88],[342,78],[352,68],
    [365,75],[375,85],[385,92],[395,100],[410,108],[425,100],[440,92],
  ];
  const dxyCycle: [number, number][] = [
    [30,80],[55,88],[80,95],[105,105],[125,118],[140,130],[155,142],
    [170,152],[185,158],[200,150],[215,142],[230,135],[245,142],[260,152],
    [275,162],[290,172],[305,180],[318,188],[330,195],[342,200],[352,205],
    [365,198],[375,190],[385,182],[395,175],[410,168],[425,175],[440,182],
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 380 }}>
        <Grid width={W} height={H} />
        <text x={W / 2} y={16} fill="#ffd700" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>ORO (XAU/USD) — CICLOS Y CORRELACIONES</text>

        <path d={smooth(gold)} fill="none" stroke="#ffd700" strokeWidth={2.5} />
        <path d={smooth(dxyCycle)} fill="none" stroke="#ff1744" strokeWidth={1.5} strokeDasharray="5 3" />

        {/* Annotations */}
        <rect x={130} y={55} width={100} height={45} fill="#ffd70012" stroke="#ffd70030" strokeWidth={0.5} rx={2} />
        <text x={180} y={73}  fill="#ffd700" fontSize={8} fontFamily={Mono} textAnchor="middle">DXY ↓</text>
        <text x={180} y={85}  fill="#ffd700" fontSize={8} fontFamily={Mono} textAnchor="middle">Oro ↑ RALLY</text>
        <text x={180} y={97}  fill="#546e7a" fontSize={7} fontFamily={Mono} textAnchor="middle">correlación inversa</text>

        {/* Safe haven */}
        <rect x={305} y={60} width={100} height={55} fill="#00e67612" stroke="#00e67630" strokeWidth={0.5} rx={2} />
        <text x={355} y={78}  fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="middle">CRISIS</text>
        <text x={355} y={90}  fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="middle">Oro = safe haven</text>
        <text x={355} y={102} fill="#546e7a" fontSize={7} fontFamily={Mono} textAnchor="middle">activo refugio</text>
        <text x={355} y={114} fill="#546e7a" fontSize={7} fontFamily={Mono} textAnchor="middle">vs guerra/inflación</text>

        {/* Legend */}
        <line x1={10} y1={220} x2={35} y2={220} stroke="#ffd700" strokeWidth={2.5} />
        <text x={40} y={224} fill="#ffd700" fontSize={9} fontFamily={Mono}>XAU/USD</text>
        <line x1={10} y1={238} x2={35} y2={238} stroke="#ff1744" strokeWidth={1.5} strokeDasharray="5 3" />
        <text x={40} y={242} fill="#ff1744" fontSize={9} fontFamily={Mono}>DXY (inv.)</text>

        <text x={10} y={H - 5} fill="#546e7a" fontSize={8} fontFamily={Sans}>Oro sube: crisis, inflación, DXY débil, incertidumbre geopolítica. Oro baja: yields altos, DXY fuerte, risk-on.</text>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* 13. GANN ANGLES                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */
export function GannChart() {
  const W = 700, H = 280;
  const pivot = { x: 80, y: 240 };

  const angles = [
    { slope: 1/8, color: "#546e7a", label: "1×8 (82.5°)" },
    { slope: 1/4, color: "#7c4dff", label: "1×4 (75°)" },
    { slope: 1/3, color: "#00e5ff", label: "1×3 (71.25°)" },
    { slope: 1/2, color: "#00e676", label: "1×2 (63.75°)" },
    { slope: 1,   color: "#ffd700", label: "1×1 (45°) ★" },
    { slope: 2,   color: "#ff6d00", label: "2×1 (26.25°)" },
    { slope: 3,   color: "#ff1744", label: "3×1 (18.75°)" },
  ];

  const toX2 = (slope: number) => {
    const dx = (pivot.y - 30) / slope;
    return Math.min(pivot.x + dx, W - 10);
  };
  const toY2 = (slope: number) => {
    const dx = toX2(slope) - pivot.x;
    return pivot.y - dx * slope;
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 380 }}>
        <Grid width={W} height={H} />
        <text x={W / 2} y={16} fill="#ffd700" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>GANN — ÁNGULOS Y CUADRADO DE 9</text>

        {/* Square of 9 mini visualization */}
        <rect x={450} y={30} width={230} height={220} fill="#00000020" stroke="#1a2535" strokeWidth={0.5} rx={2} />
        <text x={565} y={46} fill="#ffd700" fontSize={9} fontFamily={Mono} textAnchor="middle">CUADRADO DE 9</text>
        {/* Simplified spiral numbers */}
        {[
          [565, 70, "1", "#ffd700"],
          [545, 90, "2", "#aaa"], [565, 90, "3", "#aaa"], [585, 90, "4", "#aaa"],
          [545, 110, "5", "#aaa"], [565, 110, "9", "#ffd700"], [585, 110, "7", "#aaa"],
          [545, 130, "8", "#aaa"], [565, 130, "...", "#546e7a"], [585, 130, "6", "#aaa"],
        ].map(([x, y, n, c], i) => (
          <text key={i} x={x as number} y={y as number} fill={c as string} fontSize={10} fontFamily={Mono} textAnchor="middle">{n as string}</text>
        ))}

        {/* Cardinal & diagonal lines from pivot */}
        <line x1={565} y1={155} x2={565} y2={240} stroke="#ffd70044" strokeWidth={0.8} strokeDasharray="3 2" />
        <line x1={480} y1={195} x2={650} y2={195} stroke="#ffd70044" strokeWidth={0.8} strokeDasharray="3 2" />
        <line x1={490} y1={165} x2={640} y2={225} stroke="#ff6d0044" strokeWidth={0.8} strokeDasharray="3 2" />
        <line x1={490} y1={225} x2={640} y2={165} stroke="#00e5ff44" strokeWidth={0.8} strokeDasharray="3 2" />

        <text x={565} y={175} fill="#ffd700" fontSize={8} fontFamily={Mono} textAnchor="middle">Niveles clave:</text>
        <text x={565} y={190} fill="#00e676" fontSize={8} fontFamily={Mono} textAnchor="middle">90° · 180° · 270° · 360°</text>
        <text x={565} y={205} fill="#546e7a" fontSize={8} fontFamily={Mono} textAnchor="middle">diagonal = 45° · 135°</text>
        <text x={565} y={220} fill="#546e7a" fontSize={8} fontFamily={Mono} textAnchor="middle">225° · 315°</text>
        <text x={565} y={238} fill="#7a8fa0" fontSize={7} fontFamily={Sans} textAnchor="middle">Precio en 45° = equilibrio tiempo/precio</text>

        {/* Angle fan */}
        <circle cx={pivot.x} cy={pivot.y} r={5} fill="#ffd700" />
        {angles.map((a, i) => {
          const x2 = toX2(a.slope);
          const y2 = toY2(a.slope);
          return (
            <g key={i}>
              <line x1={pivot.x} y1={pivot.y} x2={x2} y2={y2} stroke={a.color} strokeWidth={a.label.includes("★") ? 2 : 1} />
              <text x={x2 + 4} y={y2} fill={a.color} fontSize={8} fontFamily={Mono}>{a.label}</text>
            </g>
          );
        })}

        {/* Price riding 1×1 line annotation */}
        <text x={pivot.x + 40} y={pivot.y - 50} fill="#ffd700" fontSize={8} fontFamily={Mono}>1×1 = línea de equilibrio</text>
        <text x={pivot.x + 40} y={pivot.y - 38} fill="#546e7a" fontSize={7} fontFamily={Mono}>precio sobre ella = alcista</text>
        <text x={pivot.x + 40} y={pivot.y - 27} fill="#546e7a" fontSize={7} fontFamily={Mono}>precio bajo ella = bajista</text>

        <text x={10} y={H - 5} fill="#546e7a" fontSize={8} fontFamily={Sans}>El ángulo 1×1 (45°) de Gann = 1 unidad de precio por 1 unidad de tiempo. Romperlo cambia la tendencia.</text>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* 14. IPDA PREMIUM DISCOUNT                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */
export function IPDAChart() {
  const W = 700, H = 280;
  const swingH = 50, swingL = 230;
  const eq = (swingH + swingL) / 2;
  const gp1 = swingH + (swingL - swingH) * 0.618;
  const gp2 = swingH + (swingL - swingH) * 0.705;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 380 }}>
        <Grid width={W} height={H} />
        <text x={W / 2} y={16} fill="#00e5ff" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>IPDA — PREMIUM / DISCOUNT / EQUILIBRIUM</text>

        {/* Premium zone */}
        <rect x={50} y={swingH} width={350} height={eq - swingH} fill="#ff174412" stroke="#ff174433" strokeWidth={0.5} />
        <text x={225} y={(swingH + eq) / 2 + 4} fill="#ff174488" fontSize={11} fontFamily={Orb} textAnchor="middle">PREMIUM (caro)</text>
        <text x={225} y={(swingH + eq) / 2 + 18} fill="#ff174466" fontSize={9} fontFamily={Mono} textAnchor="middle">busca SHORTS aquí</text>

        {/* Discount zone */}
        <rect x={50} y={eq} width={350} height={swingL - eq} fill="#00e67612" stroke="#00e67633" strokeWidth={0.5} />
        <text x={225} y={(eq + swingL) / 2 + 4} fill="#00e67688" fontSize={11} fontFamily={Orb} textAnchor="middle">DISCOUNT (barato)</text>
        <text x={225} y={(eq + swingL) / 2 + 18} fill="#00e67666" fontSize={9} fontFamily={Mono} textAnchor="middle">busca LONGS aquí</text>

        {/* Fibonacci levels */}
        {[
          { y: swingH, label: "0%   Swing High", color: "#546e7a" },
          { y: swingH + (swingL - swingH) * 0.236, label: "23.6%", color: "#aaa" },
          { y: swingH + (swingL - swingH) * 0.382, label: "38.2%", color: "#00e5ff" },
          { y: eq,     label: "50%  EQUILIBRIUM", color: "#ffffff" },
          { y: gp1,    label: "61.8% Golden Pocket ★", color: "#ffd700" },
          { y: gp2,    label: "70.5% OTE", color: "#ffd700" },
          { y: swingH + (swingL - swingH) * 0.786, label: "78.6%", color: "#ff6d00" },
          { y: swingL, label: "100% Swing Low", color: "#546e7a" },
        ].map(l => (
          <g key={l.y}>
            <line x1={50} y1={l.y} x2={400} y2={l.y} stroke={l.color} strokeWidth={l.label.includes("★") ? 1.5 : 0.8}
              strokeDasharray={l.y === swingH || l.y === swingL || l.y === eq ? undefined : "4 3"} opacity={0.8} />
            <text x={405} y={l.y + 4} fill={l.color} fontSize={8} fontFamily={Mono}>{l.label}</text>
          </g>
        ))}

        {/* GP band */}
        <rect x={50} y={gp1} width={350} height={gp2 - gp1} fill="#ffd70020" stroke="#ffd70060" strokeWidth={0.5} />
        <text x={225} y={(gp1 + gp2) / 2 + 3} fill="#ffd700" fontSize={8} fontFamily={Mono} textAnchor="middle">★ GOLDEN POCKET</text>

        {/* Price path: goes from swing high, retraces to GP, continues down */}
        {/* Wait - in IPDA this is showing the retracement zones. Let me draw a simple price path */}
        {/* that starts in premium, retraces to golden pocket (discount), then moves up again */}
        <path
          d={path([[480,swingH+10],[510,90],[535,130],[555,eq],[570,gp1+3],[575,gp2-3],[590,gp1+3],[620,140],[650,100],[680,swingH+20]])}
          fill="none" stroke="#00e676" strokeWidth={2}
        />

        {/* Entry dot at GP */}
        <circle cx={575} cy={gp1 + 5} r={6} fill="#ffd700" stroke="#0a0f18" strokeWidth={1} />
        <text x={580} y={gp1 - 2} fill="#ffd700" fontSize={8} fontFamily={Mono}>ENTRADA LONG</text>
        <text x={580} y={gp1 + 9} fill="#546e7a" fontSize={7} fontFamily={Mono}>Golden Pocket</text>

        <text x={10} y={H - 5} fill="#546e7a" fontSize={8} fontFamily={Sans}>El precio SIEMPRE oscila entre Premium y Discount. El Golden Pocket (61.8%-70.5%) en Discount = mejor zona de compra.</text>
      </svg>
    </div>
  );
}
