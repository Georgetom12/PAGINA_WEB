import React, { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/site-nav";

// ─── 7-day BTC price series (28 puntos · velas de 6h · ~27 Apr – 3 May 2026) ───
const BTC_RAW = [
  94200, 95100, 96400, 95800, 94900, 93600, 92800, 91900,
  92500, 93200, 94100, 95600, 97100, 96300, 94200, 91600,
  92800, 93500, 94700, 95200, 94100, 93400, 94800, 96100,
  95400, 94200, 95800, 96700,
];

const DAYS = ["Lun 28", "Mar 29", "Mié 30", "Jue 1", "Vie 2", "Sáb 3", "Dom 4"];

// ─── Types ────────────────────────────────────────────────────────────────────
interface Profile {
  leverage: number;
  stopLoss: "none" | "sometimes" | "always";
  timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
  style: "scalper" | "day" | "swing" | "holder";
  capital: "<100" | "100-500" | "500-2k" | "2k-10k" | "10k+";
}

interface Scenario {
  title: string;
  day: string;
  entryIdx: number;
  entryPrice: number;
  liqPrice: number;
  exitIdx: number;
  direction: "long" | "short";
  trigger: string;
  loss: string;
  insight: string;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────
function calcRisk(p: Profile): number {
  let score = 0;
  // Leverage
  if (p.leverage >= 50) score += 40;
  else if (p.leverage >= 20) score += 28;
  else if (p.leverage >= 10) score += 18;
  else if (p.leverage >= 5) score += 10;
  else score += 3;
  // Stop loss
  if (p.stopLoss === "none") score += 30;
  else if (p.stopLoss === "sometimes") score += 15;
  else score += 4;
  // Timeframe
  if (p.timeframe === "1m" || p.timeframe === "5m") score += 15;
  else if (p.timeframe === "15m" || p.timeframe === "1h") score += 10;
  else if (p.timeframe === "4h") score += 5;
  else score += 2;
  // Style
  if (p.style === "scalper") score += 15;
  else if (p.style === "day") score += 10;
  else if (p.style === "swing") score += 6;
  else score += 2;
  return Math.min(100, score);
}

function liqDistance(leverage: number): number {
  return 1 / leverage; // fraction of price
}

function moneyLost(capital: Profile["capital"], pct: number): string {
  const map: Record<string, number> = {
    "<100": 80, "100-500": 300, "500-2k": 1000, "2k-10k": 5000, "10k+": 15000,
  };
  const base = map[capital] ?? 300;
  return `$${Math.round(base * pct).toLocaleString()}`;
}

function buildScenarios(p: Profile): Scenario[] {
  const liqD = liqDistance(p.leverage);

  const scenarios: Scenario[] = [
    // Scenario A: FOMO long en el pico → dump brutal
    {
      title: "FOMO LONG en el máximo",
      day: "Mar 29 · 18:00",
      entryIdx: 2,  // 96,400
      entryPrice: BTC_RAW[2],
      liqPrice: Math.round(BTC_RAW[2] * (1 - liqD)),
      exitIdx: BTC_RAW.findIndex((v, i) => i > 2 && v <= BTC_RAW[2] * (1 - liqD)) === -1
        ? 7
        : BTC_RAW.findIndex((v, i) => i > 2 && v <= BTC_RAW[2] * (1 - liqD)),
      direction: "long",
      trigger: p.style === "scalper"
        ? "Entraste en el breakout de 96k. El mercado revirtió de inmediato."
        : "Viste la vela verde de 2.5% y entraste en el techo. Pura emoción.",
      loss: moneyLost(p.capital, Math.min(1, liqD * p.leverage)),
      insight: p.leverage >= 20
        ? "Con ×" + p.leverage + " de apalancamiento necesitás solo un " + (liqD * 100).toFixed(1) + "% en contra para perder todo."
        : "Sin stop loss, aguantaste la caída esperando recuperación. Nunca llegó.",
    },
    // Scenario B: Fake breakout en ATH local → trampa
    {
      title: "TRAMPA en falso ATH",
      day: "Jue 1 · 02:00",
      entryIdx: 12, // 97,100
      entryPrice: BTC_RAW[12],
      liqPrice: Math.round(BTC_RAW[12] * (1 - liqD)),
      exitIdx: BTC_RAW.findIndex((v, i) => i > 12 && v <= BTC_RAW[12] * (1 - liqD)) === -1
        ? 15
        : BTC_RAW.findIndex((v, i) => i > 12 && v <= BTC_RAW[12] * (1 - liqD)),
      direction: "long",
      trigger: "Bitcoin rompió 97k. Parecía imparable. Era exactamente lo que los ballenas querían que creyeras.",
      loss: moneyLost(p.capital, Math.min(1, liqD * p.leverage)),
      insight: "Este patrón de trampa de liquidez ocurrió en el 73% de los breakouts de la semana. LiqMap lo marcó 40 min antes.",
    },
    // Scenario C: Bottom-picking → continúa bajando
    {
      title: "ATRAPAR EL CUCHILLO",
      day: "Mié 30 · 08:00",
      entryIdx: 7,  // 91,900
      entryPrice: BTC_RAW[7],
      liqPrice: p.stopLoss === "none"
        ? Math.round(BTC_RAW[7] * (1 - liqD))
        : Math.round(BTC_RAW[7] * 0.985),
      exitIdx: p.stopLoss === "none"
        ? Math.min(27, BTC_RAW.findIndex((v, i) => i > 7 && v <= BTC_RAW[7] * (1 - liqD)) === -1 ? 11 : BTC_RAW.findIndex((v, i) => i > 7 && v <= BTC_RAW[7] * (1 - liqD)))
        : 8,
      direction: "long",
      trigger: p.stopLoss === "none"
        ? "Pensaste que 91.9k era el suelo. El mercado te mostró que no tenía suelo para vos."
        : "Stop loss activado en 90.8k. Luego rebotó a 94k. Saliste justo antes.",
      loss: p.stopLoss === "none"
        ? moneyLost(p.capital, Math.min(1, liqD * p.leverage))
        : moneyLost(p.capital, 0.08),
      insight: p.stopLoss === "none"
        ? "Sin stop, aguantaste 6 velas en rojo esperando el rebote. Para cuando llegó, ya estabas liquidado."
        : "Con stop, perdiste un 8% — pero no todo. La disciplina te salvó el capital.",
    },
  ];

  // Sort by severity for this profile
  return scenarios;
}

// ─── SVG Mini Chart ───────────────────────────────────────────────────────────
function ScenarioChart({ scenario, color }: { scenario: Scenario; color: string }) {
  const W = 340; const H = 120;
  const start = Math.max(0, scenario.entryIdx - 2);
  const end = Math.min(BTC_RAW.length - 1, Math.max(scenario.exitIdx + 2, scenario.entryIdx + 6));
  const slice = BTC_RAW.slice(start, end + 1);
  const minP = Math.min(...slice, scenario.liqPrice) * 0.997;
  const maxP = Math.max(...slice) * 1.003;
  const range = maxP - minP;

  const toX = (i: number) => ((i / (slice.length - 1)) * (W - 40)) + 20;
  const toY = (v: number) => H - 20 - ((v - minP) / range) * (H - 40);

  const pts = slice.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const fillPts = `${toX(0)},${H - 20} ` + pts + ` ${toX(slice.length - 1)},${H - 20}`;

  const entryLocalIdx = scenario.entryIdx - start;
  const exitLocalIdx = Math.min(slice.length - 1, scenario.exitIdx - start);
  const liqY = toY(scenario.liqPrice);
  const entryX = toX(entryLocalIdx);
  const entryY = toY(scenario.entryPrice);
  const exitX = toX(exitLocalIdx);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxWidth: W }}>
      {/* Price line area */}
      <defs>
        <linearGradient id={`grad-${scenario.entryIdx}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#grad-${scenario.entryIdx})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />

      {/* Liquidation price line */}
      <line x1={20} y1={liqY} x2={W - 20} y2={liqY}
        stroke="#ff1744" strokeWidth="1" strokeDasharray="4,3" strokeOpacity="0.7" />
      <text x={W - 18} y={liqY - 3} fontSize="7" fill="#ff1744" textAnchor="end" opacity="0.9" fontFamily="monospace">
        LIQ ${scenario.liqPrice.toLocaleString()}
      </text>

      {/* Entry zone */}
      <circle cx={entryX} cy={entryY} r={5} fill="#00e676" opacity="0.9" />
      <line x1={entryX} y1={entryY} x2={entryX} y2={H - 20}
        stroke="#00e676" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.4" />
      <text x={entryX} y={entryY - 8} fontSize="7" fill="#00e676" textAnchor="middle" fontFamily="monospace">
        ENTRADA
      </text>

      {/* Exit / Liquidation point */}
      {exitLocalIdx < slice.length && (
        <>
          <circle cx={exitX} cy={toY(slice[exitLocalIdx])} r={6} fill="#ff1744" opacity="0.9" />
          <text x={exitX} y={toY(slice[exitLocalIdx]) - 9} fontSize="8" textAnchor="middle" fill="#ff1744">💀</text>
        </>
      )}
    </svg>
  );
}

// ─── Risk Gauge ───────────────────────────────────────────────────────────────
function RiskGauge({ score }: { score: number }) {
  const color = score >= 75 ? "#ff1744" : score >= 50 ? "#ff6d00" : score >= 30 ? "#ffd700" : "#00e676";
  const label = score >= 75 ? "CRÍTICO" : score >= 50 ? "ALTO" : score >= 30 ? "MODERADO" : "BAJO";
  const circumference = 2 * Math.PI * 44;
  const dash = (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg width="112" height="112" viewBox="0 0 112 112" className="rotate-[-90deg]">
          <circle cx="56" cy="56" r="44" fill="none" stroke="#1a2535" strokeWidth="8" />
          <circle cx="56" cy="56" r="44" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeLinecap="round" style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bebas text-3xl" style={{ color }}>{score}</span>
          <span className="font-sharetech text-[8px] text-[#7ab3c8] tracking-widest">/100</span>
        </div>
      </div>
      <div className="font-space text-[10px] font-bold tracking-[0.2em] mt-1" style={{ color }}>{label}</div>
      <div className="font-space text-[9px] text-[#7ab3c8] mt-0.5">RIESGO DE LIQUIDACIÓN</div>
    </div>
  );
}

// ─── Step 1: Form ─────────────────────────────────────────────────────────────
function ProfileForm({ onSubmit }: { onSubmit: (p: Profile) => void }) {
  const [leverage, setLeverage] = useState(20);
  const [stopLoss, setStopLoss] = useState<Profile["stopLoss"]>("sometimes");
  const [timeframe, setTimeframe] = useState<Profile["timeframe"]>("1h");
  const [style, setStyle] = useState<Profile["style"]>("day");
  const [capital, setCapital] = useState<Profile["capital"]>("100-500");

  const leverageColor = leverage >= 50 ? "#ff1744" : leverage >= 20 ? "#ff6d00" : leverage >= 10 ? "#ffd700" : "#00e676";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-8">

        {/* Leverage */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="font-space text-[11px] tracking-[0.2em] uppercase text-[#8a9ab0]">Apalancamiento típico</label>
            <span className="font-bebas text-3xl" style={{ color: leverageColor }}>×{leverage}</span>
          </div>
          <input type="range" min={1} max={100} value={leverage}
            onChange={e => setLeverage(Number(e.target.value))}
            className="w-full accent-[#00e5ff] h-1 bg-[#1a2535] rounded-full appearance-none cursor-pointer" />
          <div className="flex justify-between font-sharetech text-[8px] text-[#5a8898] mt-1">
            <span>×1 (SIN)</span><span>×10</span><span>×25</span><span>×50</span><span>×100</span>
          </div>
          {leverage >= 50 && (
            <div className="mt-2 font-space text-[10px] text-[#ff1744] flex items-center gap-1">
              ⚠ Con ×{leverage}, un movimiento de {(100 / leverage).toFixed(1)}% te liquida
            </div>
          )}
        </div>

        {/* Stop Loss */}
        <div>
          <label className="font-space text-[11px] tracking-[0.2em] uppercase text-[#8a9ab0] block mb-3">¿Usás stop loss?</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { v: "none",      label: "Nunca",       sub: "aguanto y rezo",       color: "#ff1744" },
              { v: "sometimes", label: "A veces",      sub: "cuando me acuerdo",    color: "#ffd700" },
              { v: "always",    label: "Siempre",      sub: "riesgo controlado",    color: "#00e676" },
            ] as const).map(opt => (
              <button key={opt.v} onClick={() => setStopLoss(opt.v)}
                className="p-3 border text-left transition-all"
                style={{
                  borderColor: stopLoss === opt.v ? opt.color : "#1a2535",
                  background: stopLoss === opt.v ? `${opt.color}12` : "transparent",
                }}>
                <div className="font-space text-[11px] font-bold" style={{ color: stopLoss === opt.v ? opt.color : "#6a8090" }}>{opt.label}</div>
                <div className="font-space text-[9px] text-[#7ab3c8] mt-0.5">{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Timeframe */}
        <div>
          <label className="font-space text-[11px] tracking-[0.2em] uppercase text-[#8a9ab0] block mb-3">Timeframe principal</label>
          <div className="flex flex-wrap gap-2">
            {(["1m", "5m", "15m", "1h", "4h", "1d"] as const).map(tf => (
              <button key={tf} onClick={() => setTimeframe(tf)}
                className="px-4 py-2 border font-sharetech text-[11px] transition-all"
                style={{
                  borderColor: timeframe === tf ? "#00e5ff" : "#1a2535",
                  background: timeframe === tf ? "#00e5ff12" : "transparent",
                  color: timeframe === tf ? "#00e5ff" : "#4a6070",
                }}>
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Trading style */}
        <div>
          <label className="font-space text-[11px] tracking-[0.2em] uppercase text-[#8a9ab0] block mb-3">Estilo de trading</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {([
              { v: "scalper", label: "Scalper",   icon: "⚡", sub: "segundos / minutos" },
              { v: "day",     label: "Day Trader", icon: "🔥", sub: "intradía" },
              { v: "swing",   label: "Swing",      icon: "🌊", sub: "días / semanas" },
              { v: "holder",  label: "Holder",     icon: "💎", sub: "largo plazo" },
            ] as const).map(opt => (
              <button key={opt.v} onClick={() => setStyle(opt.v)}
                className="p-3 border text-center transition-all"
                style={{
                  borderColor: style === opt.v ? "#00e5ff" : "#1a2535",
                  background: style === opt.v ? "#00e5ff12" : "transparent",
                }}>
                <div className="text-xl mb-1">{opt.icon}</div>
                <div className="font-space text-[10px] font-bold" style={{ color: style === opt.v ? "#00e5ff" : "#6a8090" }}>{opt.label}</div>
                <div className="font-space text-[8px] text-[#7ab3c8] mt-0.5">{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Capital */}
        <div>
          <label className="font-space text-[11px] tracking-[0.2em] uppercase text-[#8a9ab0] block mb-3">Capital en juego (USD)</label>
          <div className="flex flex-wrap gap-2">
            {([
              { v: "<100",    label: "< $100" },
              { v: "100-500", label: "$100–500" },
              { v: "500-2k",  label: "$500–2k" },
              { v: "2k-10k",  label: "$2k–10k" },
              { v: "10k+",    label: "$10k+" },
            ] as const).map(opt => (
              <button key={opt.v} onClick={() => setCapital(opt.v)}
                className="px-4 py-2 border font-space text-[11px] transition-all"
                style={{
                  borderColor: capital === opt.v ? "#e040fb" : "#1a2535",
                  background: capital === opt.v ? "#e040fb12" : "transparent",
                  color: capital === opt.v ? "#e040fb" : "#4a6070",
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onSubmit({ leverage, stopLoss, timeframe, style, capital })}
          className="w-full py-5 font-space text-sm font-bold tracking-[0.2em] uppercase transition-all hover:opacity-90"
          style={{ background: "#00e5ff", color: "#020408" }}>
          SIMULAR MIS LIQUIDACIONES →
        </button>
        <p className="font-space text-[10px] text-[#5a8898] text-center">
          Sin registro · Sin email · Resultado en segundos
        </p>
      </div>
    </div>
  );
}

// ─── Step 2: Analysis animation ───────────────────────────────────────────────
function AnalysisLoader({ onDone }: { onDone: () => void }) {
  const steps = [
    "Leyendo tu perfil psicológico...",
    "Cruzando con liquidaciones de los últimos 7 días...",
    "Identificando tus entradas típicas...",
    "Calculando zonas de peligro personales...",
    "Construyendo tus escenarios...",
  ];
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState<boolean[]>(new Array(steps.length).fill(false));

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setCurrent(i);
        setDone(prev => { const n = [...prev]; n[i] = true; return n; });
        if (i === steps.length - 1) timers.push(setTimeout(onDone, 600));
      }, i * 600 + 200));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="max-w-md mx-auto py-16 text-center">
      <div className="font-bebas text-5xl text-white mb-2">ANALIZANDO</div>
      <div className="font-space text-[11px] text-[#7ab3c8] mb-12 tracking-widest">TU PERFIL DE DESTRUCCIÓN</div>
      <div className="space-y-4 text-left">
        {steps.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 font-space text-[12px] transition-all duration-300 ${i > current ? "opacity-20" : "opacity-100"}`}>
            <span style={{ color: done[i] ? "#00e676" : "#2a4a5a", transition: "color 0.3s" }}>
              {done[i] ? "✔" : "○"}
            </span>
            <span style={{ color: i === current ? "#e0f4ff" : done[i] ? "#4a6070" : "#2a4a5a" }}>{s}</span>
          </div>
        ))}
      </div>
      <div className="mt-10 w-full h-px bg-[#1a2535] relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-[#00e5ff]"
          style={{ width: `${((current + 1) / steps.length) * 100}%`, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

// ─── Step 3: Results ──────────────────────────────────────────────────────────
const SCENARIO_COLORS = ["#ff6d00", "#ff1744", "#ffd700"];

function ResultsView({ profile }: { profile: Profile }) {
  const risk = calcRisk(profile);
  const scenarios = buildScenarios(profile);
  const [expanded, setExpanded] = useState<number | null>(0);

  const styleLabel: Record<Profile["style"], string> = {
    scalper: "Scalper", day: "Day Trader", swing: "Swing Trader", holder: "Holder",
  };
  const tfLabel = profile.timeframe.toUpperCase();
  const riskLabel = risk >= 75 ? "destruirte en días" : risk >= 50 ? "vaciarte en semanas" : risk >= 30 ? "erosionarte lentamente" : "sobrevivir mejor que el 80%";

  // Psychological insight based on profile
  const psyInsight = (() => {
    if (profile.stopLoss === "none" && profile.leverage >= 20)
      return { emoji: "🔥", type: "TRADER KAMIKAZE", desc: "Operás con emociones, sin red de seguridad. Cada operación es todo o nada. El mercado te conoce mejor de lo que vos te conocés." };
    if (profile.style === "scalper" && profile.leverage >= 10)
      return { emoji: "⚡", type: "SCALPER IMPULSIVO", desc: "Tu timeframe corto con alto apalancamiento es la combinación más estudiada por los market makers. Vivís en la zona de caza." };
    if (profile.stopLoss === "always" && profile.leverage <= 5)
      return { emoji: "🧠", type: "TRADER DISCIPLINADO", desc: "Tenés bases sólidas. Tus pérdidas son controladas. Con las herramientas correctas podés escalar sin exponerte al desastre." };
    if (profile.style === "swing")
      return { emoji: "🌊", type: "SWING TRADER VULNERABLE", desc: "Los swings te exponen a eventos macro nocturnos. Sin datos de liquidez institucional, operás a ciegas en las horas más peligrosas." };
    return { emoji: "💀", type: "PERFIL DE ALTO RIESGO", desc: "Tu combinación de parámetros te pone en el 67% de traders que pierde capital en los primeros 3 meses." };
  })();

  return (
    <div className="max-w-3xl mx-auto">

      {/* Risk header */}
      <div className="border border-[#ff174422] bg-[#060a0f] p-8 mb-6 flex flex-col sm:flex-row items-center gap-8">
        <RiskGauge score={risk} />
        <div className="flex-1 text-center sm:text-left">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-1">RESULTADO DEL ANÁLISIS</div>
          <h2 className="font-bebas text-[clamp(28px,5vw,48px)] text-white leading-none mb-2">
            TU PERFIL TIENE<br />
            <span style={{ color: risk >= 60 ? "#ff1744" : "#ffd700" }}>
              {risk >= 75 ? "RIESGO CRÍTICO" : risk >= 50 ? "RIESGO ALTO" : risk >= 30 ? "RIESGO MODERADO" : "RIESGO BAJO"}
            </span>
          </h2>
          <p className="font-space text-[12px] text-[#7ab3c8] leading-relaxed">
            Como <strong className="text-[#e0f4ff]">{styleLabel[profile.style]}</strong> en <strong className="text-[#e0f4ff]">{tfLabel}</strong> con ×{profile.leverage} de apalancamiento —
            el mercado tiene capacidad de <strong style={{ color: risk >= 60 ? "#ff6d00" : "#ffd700" }}>{riskLabel}</strong>.
          </p>
        </div>
      </div>

      {/* PSY insight */}
      <div className="border border-[#e040fb33] bg-[#0a060f] p-5 mb-8 flex items-start gap-4">
        <span className="text-3xl shrink-0">{psyInsight.emoji}</span>
        <div>
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#e040fb] mb-1">TIPO PSICOLÓGICO DETECTADO</div>
          <div className="font-bebas text-2xl text-white mb-1">{psyInsight.type}</div>
          <p className="font-space text-[12px] text-[#6a8090] leading-relaxed">{psyInsight.desc}</p>
        </div>
      </div>

      {/* Scenarios */}
      <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-4 uppercase">
        Así te habrían destruido — últimos 7 días
      </div>

      <div className="space-y-2 mb-10">
        {scenarios.map((sc, i) => (
          <div key={i} className="border border-[#1a2535] overflow-hidden">
            {/* Header */}
            <button
              className="w-full flex items-center justify-between p-5 text-left hover:bg-[#0d1520] transition-colors"
              onClick={() => setExpanded(expanded === i ? null : i)}>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 flex items-center justify-center font-bebas text-xl"
                  style={{ color: SCENARIO_COLORS[i] }}>
                  {i + 1}
                </div>
                <div>
                  <div className="font-bebas text-xl text-white">{sc.title}</div>
                  <div className="font-sharetech text-[9px] text-[#7ab3c8] tracking-widest">{sc.day}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="font-sharetech text-[8px] text-[#7ab3c8] tracking-widest">PÉRDIDA ESTIMADA</div>
                  <div className="font-bebas text-2xl" style={{ color: SCENARIO_COLORS[i] }}>{sc.loss}</div>
                </div>
                <span className="font-sharetech text-[10px]" style={{ color: SCENARIO_COLORS[i] }}>
                  {expanded === i ? "▲" : "▼"}
                </span>
              </div>
            </button>

            {/* Expanded */}
            {expanded === i && (
              <div className="border-t border-[#1a2535] bg-[#060a0f] p-5">
                <div className="mb-4">
                  <ScenarioChart scenario={sc} color={SCENARIO_COLORS[i]} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="font-sharetech text-[8px] tracking-[0.3em] text-[#5a8898] mb-1">QUÉ PASÓ</div>
                    <p className="font-space text-[12px] text-[#6a8090] leading-relaxed">{sc.trigger}</p>
                  </div>
                  <div>
                    <div className="font-sharetech text-[8px] tracking-[0.3em] text-[#5a8898] mb-1">EL DATO QUE TE FALTÓ</div>
                    <p className="font-space text-[12px] text-[#6a8090] leading-relaxed">{sc.insight}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3 p-3 border border-[#ff174422] bg-[#ff17440a]">
                  <span className="text-xl">💀</span>
                  <div className="font-space text-[11px] text-[#ff6d00]">
                    Entrada: <strong className="text-white">${sc.entryPrice.toLocaleString()}</strong>
                    <span className="text-[#5a8898] mx-2">·</span>
                    Liquidación: <strong style={{ color: SCENARIO_COLORS[i] }}>${sc.liqPrice.toLocaleString()}</strong>
                    <span className="text-[#5a8898] mx-2">·</span>
                    Movimiento: <strong style={{ color: SCENARIO_COLORS[i] }}>−{((sc.entryPrice - sc.liqPrice) / sc.entryPrice * 100).toFixed(1)}%</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Emotional CTA */}
      <div className="border border-[#00e5ff33] bg-[#020c14] p-8 text-center">
        <div className="font-sharetech text-[9px] tracking-[0.4em] text-[#5a8898] mb-3">LA REALIDAD</div>
        <h3 className="font-bebas text-[clamp(28px,5vw,52px)] text-white leading-tight mb-3">
          ESTO NO ES<br /><span className="text-[#00e5ff]">MALA SUERTE</span>
        </h3>
        <p className="font-space text-[13px] text-[#7ab3c8] max-w-lg mx-auto leading-relaxed mb-8">
          Cada una de estas liquidaciones era <strong className="text-[#e0f4ff]">predecible</strong> 30–60 minutos antes.
          Los clusters de liquidez, el funding, el Score PSY — todo estaba ahí.<br />
          <strong className="text-[#00e5ff]">Vos no tenías acceso. Ahora sí.</strong>
        </p>
        <div className="grid sm:grid-cols-3 gap-4 mb-8 text-left">
          {[
            { icon: "💧", title: "LiqMap PRO", desc: "Clusters de liquidez en tiempo real — sabé dónde están las bombas antes de que exploten" },
            { icon: "🧠", title: "Score PSY", desc: "Indicador institucional que mide cuando el mercado está manipulado vs genuino" },
            { icon: "📡", title: "Señales Live", desc: "Alertas de entrada con invalidación definida — sin adivinar, con lógica institucional" },
          ].map(item => (
            <div key={item.title} className="border border-[#1a2535] p-4">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="font-space text-[11px] font-bold text-[#00e5ff] mb-1">{item.title}</div>
              <div className="font-space text-[10px] text-[#7ab3c8] leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
        <Link href="/pricing"
          className="inline-block w-full sm:w-auto font-space text-sm font-bold tracking-[0.2em] uppercase px-10 py-5 no-underline transition-all hover:opacity-90"
          style={{ background: "#00e5ff", color: "#020408" }}>
          EVITAR MI PRÓXIMA LIQUIDACIÓN →
        </Link>
        <p className="font-space text-[10px] text-[#5a8898] mt-4">
          Desde $49/mes · LiqMap PRO + Señales + Score PSY
        </p>
        <div className="mt-6 pt-6 border-t border-[#1a2535]">
          <button
            onClick={() => window.location.reload()}
            className="font-space text-[11px] text-[#7ab3c8] hover:text-[#00e5ff] transition-colors">
            ← Volver a simular con otros parámetros
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
type Phase = "form" | "loading" | "results";

export default function Simulador() {
  const [phase, setPhase] = useState<Phase>("form");
  const [profile, setProfile] = useState<Profile | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  function handleSubmit(p: Profile) {
    setProfile(p);
    setPhase("loading");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDone() {
    setPhase("results");
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      {/* Hero */}
      <section className="pt-28 pb-10 px-6 md:px-12 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 font-sharetech text-[9px] tracking-[0.3em] uppercase text-[#ff1744] border border-[#ff174422] px-3 py-1.5 mb-6">
          💀 SIMULADOR PERSONAL · GRATIS · SIN REGISTRO
        </div>
        <h1 className="font-bebas text-[clamp(42px,8vw,90px)] leading-none mb-4">
          EL ESPEJO<br />
          <span className="text-[#ff1744]">DEL TRADER</span>
        </h1>
        <p className="font-space text-[13px] text-[#7ab3c8] max-w-xl mx-auto leading-relaxed mb-2">
          No te mostramos datos abstractos.<br />
          <strong className="text-[#e0f4ff]">Te mostramos cómo te habría destruido el mercado a vos — esta semana — con tu forma exacta de tradear.</strong>
        </p>
        {phase === "form" && (
          <p className="font-sharetech text-[9px] text-[#5a8898] tracking-widest mt-4">
            5 PREGUNTAS · RESULTADO INMEDIATO · 100% PERSONAL
          </p>
        )}
      </section>

      <section className="px-6 md:px-12 pb-20 max-w-4xl mx-auto" ref={resultsRef}>
        {phase === "form" && (
          <div className="border border-[#1a2535] bg-[#060a0f] p-8">
            <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-6 uppercase">
              Configurá tu perfil de trading
            </div>
            <ProfileForm onSubmit={handleSubmit} />
          </div>
        )}
        {phase === "loading" && (
          <div className="border border-[#1a2535] bg-[#060a0f] p-8">
            <AnalysisLoader onDone={handleDone} />
          </div>
        )}
        {phase === "results" && profile && (
          <ResultsView profile={profile} />
        )}
      </section>
    </div>
  );
}
