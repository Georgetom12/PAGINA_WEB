import React, { useState } from "react";
import SiteNav from "@/components/site-nav";

// ─── Strategy data ────────────────────────────────────────────────────────────
type RiskLevel = "BAJO" | "MEDIO" | "ALTO";
type StratType  = "Momentum" | "Reversión" | "Swing" | "Scalp" | "DCA" | "Breakout";

interface Strategy {
  id: string;
  name: string;
  emoji: string;
  type: StratType;
  risk: RiskLevel;
  timeframe: string;
  description: string;
  indicators: string[];
  setup: string;
  winRate: string;
  avgRR: string;
  bestMarket: string;
  notes: string;
  author: string;
}

const STRATEGIES: Strategy[] = [
  {
    id: "fusion-master",
    name: "FUSION MASTER v3",
    emoji: "⚡",
    type: "Swing",
    risk: "MEDIO",
    timeframe: "4H / 1D",
    description: "Motor de consenso que combina 4 módulos: Macro Global + Oracle MTF + SMC + Fibonacci. La señal solo se confirma cuando los 4 módulos están alineados.",
    indicators: ["SMC (Order Blocks, FVG)", "Fibonacci 0.618 / 0.786", "Macro DXY / SPX", "Oracle Multi-Timeframe"],
    setup: "Esperar alineación 4H + 1D. Entrada en OB o FVG con volumen decreciente. Stop debajo del swing low. TP en siguiente nivel de liquidez.",
    winRate: "62–68%",
    avgRR: "1:2.5",
    bestMarket: "BTC / ETH en tendencia",
    notes: "No operar en consolidación lateral. Requiere confirmación en al menos 3 timeframes.",
    author: "PSYCHOMETRIKS",
  },
  {
    id: "psy-ult1",
    name: "PSY-ULT1",
    emoji: "🎯",
    type: "Momentum",
    risk: "ALTO",
    timeframe: "15m / 1H",
    description: "Sistema de señales basado en divergencias RSI/MFI/MACD + análisis de volumen institucional. Detecta acumulación oculta antes del movimiento.",
    indicators: ["RSI 14", "MFI (Money Flow Index)", "MACD 12/26/9", "Volumen VWAP"],
    setup: "Divergencia alcista/bajista en MFI + RSI confirmada. Entrada post-consolidación. TP en resistencia previa. SL bajo el último low significativo.",
    winRate: "55–61%",
    avgRR: "1:3",
    bestMarket: "Altcoins top 50 con liquidez",
    notes: "Alta frecuencia. Requiere spreads bajos. No usar en horarios de bajo volumen.",
    author: "PSYCHOMETRIKS",
  },
  {
    id: "whale-flow",
    name: "WHALE FLOW",
    emoji: "🐋",
    type: "Momentum",
    risk: "MEDIO",
    timeframe: "1H / 4H",
    description: "Clasificación multicriteria de ballenas: RVOL + posición de vela + percentil de volumen. Copia los movimientos de wallets institucionales verificadas on-chain.",
    indicators: ["RVOL (Relative Volume)", "On-chain whale tracker", "Exchange net flow", "Funding rate"],
    setup: "Whale alert con RVOL > 3x promedio. Dirección confirmada por exchange net flow. Entrada en pullback del 38.2%. SL bajo estructura.",
    winRate: "58–64%",
    avgRR: "1:2",
    bestMarket: "BTC / ETH en días de alto volumen",
    notes: "Las mejores señales aparecen durante sesión NY (14:00–20:00 UTC). Evitar durante eventos macro.",
    author: "PSYCHOMETRIKS",
  },
  {
    id: "smc-reversal",
    name: "SMC REVERSAL",
    emoji: "🔄",
    type: "Reversión",
    risk: "MEDIO",
    timeframe: "1H / 4H",
    description: "Estrategia pura de Smart Money Concepts. Identifica Order Blocks institucionales, barridos de liquidez y cambios de estructura (CHoCH / BOS).",
    indicators: ["Order Blocks (OB)", "Fair Value Gaps (FVG)", "CHoCH / BOS", "Sweeps de liquidez"],
    setup: "Identificar zona de liquidez barrida. Esperar CHoCH en timeframe menor. Entrada en retesteo del FVG. TP en siguiente POI opuesto.",
    winRate: "60–66%",
    avgRR: "1:3.5",
    bestMarket: "Cualquier par con alta liquidez",
    notes: "La paciencia es clave. Solo 1–2 setups por semana en 4H. La mayoría de traders sobretradean este sistema.",
    author: "PSYCHOMETRIKS",
  },
  {
    id: "btc-cycles",
    name: "BTC CYCLES DCA",
    emoji: "🔄",
    type: "DCA",
    risk: "BAJO",
    timeframe: "Semanal / Mensual",
    description: "Sistema de acumulación basado en el ciclo de 4 años de Bitcoin. Compras programadas en zonas de pánico extremo, reducción de posición en euforia.",
    indicators: ["Stoch RSI semanal", "Pi Cycle Top/Bottom", "Fear & Greed < 20", "Realized Price"],
    setup: "Acumular cuando Stoch RSI semanal < 20 y Fear & Greed < 25. Reducir 25% cuando Stoch RSI > 80. Salida total con Pi Cycle Top.",
    winRate: "Histórico positivo en 4/4 ciclos",
    avgRR: "1:8+ (ciclo completo)",
    bestMarket: "BTC solamente",
    notes: "Sistema de largo plazo (12–24 meses). No mires el precio diariamente. Ideal para quienes trabajan y no pueden operar activamente.",
    author: "PSYCHOMETRIKS",
  },
  {
    id: "fed-macro",
    name: "FED MACRO PLAY",
    emoji: "🏛",
    type: "Swing",
    risk: "BAJO",
    timeframe: "Diario / Semanal",
    description: "Estrategia macroeconómica que sigue la correlación inversa entre política monetaria de la FED y activos de riesgo. Se posiciona antes de pivots históricos.",
    indicators: ["Tasa Fed Funds", "CPI YoY", "DXY", "TLT (bonos 20Y)"],
    setup: "Acumular BTC/ETH cuando CPI < expectativas + DXY bajando + TLT subiendo. Reducir cuando DXY > 105 o FOMC hawkish.",
    winRate: "70%+ en tendencias macro claras",
    avgRR: "1:4",
    bestMarket: "BTC / ETH / Oro",
    notes: "Requiere seguir calendarios económicos. FOMC, CPI y NFP son los eventos clave. Alta efectividad en cambios de ciclo macro.",
    author: "PSYCHOMETRIKS",
  },
  {
    id: "scalp-liquidations",
    name: "SCALP LIQUIDACIONES",
    emoji: "⚡",
    type: "Scalp",
    risk: "ALTO",
    timeframe: "1m / 5m",
    description: "Aprovecha las liquidaciones en cascada para entrar justo después del barrido de stops. Alta frecuencia, requiere ejecución rápida y spreads bajos.",
    indicators: ["Liquidation heatmap", "Open Interest", "CVD (Cumulative Volume Delta)", "Orderbook depth"],
    setup: "Identificar zona de alta liquidación en heatmap. Esperar sweep con vela de alto volumen. Entrada inmediata post-barrido. TP: 0.3–1%. SL: 0.2%.",
    winRate: "52–58%",
    avgRR: "1:1.5",
    bestMarket: "BTC perp con alta liquidez",
    notes: "Solo para traders experimentados. Requiere conexión rápida y plataforma con feeds de datos en tiempo real. Riesgo de deslizamiento alto.",
    author: "PSYCHOMETRIKS",
  },
  {
    id: "breakout-volume",
    name: "BREAKOUT + VOLUMEN",
    emoji: "🚀",
    type: "Breakout",
    risk: "MEDIO",
    timeframe: "4H / 1D",
    description: "Sistema clásico potenciado. Identifica consolidaciones de alta calidad (HH/HL) con volumen decreciente y espera el breakout con expansión de volumen.",
    indicators: ["Estructura HH/HL", "Volumen relativo", "BB Squeeze", "ATR para SL"],
    setup: "Consolidación mínima 5 velas 4H con volumen decreciente. Breakout con vela > 2x volumen promedio. Entrada en close de vela breakout. SL: 1 ATR.",
    winRate: "55–60%",
    avgRR: "1:2",
    bestMarket: "Altcoins en tendencia alcista",
    notes: "Los mejores breakouts ocurren después de acumulaciones largas (10+ velas). Evitar en mercados bajistas. Filtrar con tendencia 1D.",
    author: "PSYCHOMETRIKS",
  },
];

const TYPE_COLORS: Record<StratType, string> = {
  Momentum:  "#00e5ff",
  Reversión: "#e040fb",
  Swing:     "#00e676",
  Scalp:     "#ff6d00",
  DCA:       "#ffd700",
  Breakout:  "#29b6f6",
};

const RISK_COLORS: Record<RiskLevel, { color: string; bg: string; border: string }> = {
  BAJO:  { color: "#00e676", bg: "#00e67610", border: "#00e67630" },
  MEDIO: { color: "#ffd700", bg: "#ffd70010", border: "#ffd70030" },
  ALTO:  { color: "#ff1744", bg: "#ff174410", border: "#ff174430" },
};

export default function Strategies() {
  const [filterType, setFilterType] = useState<StratType | "TODOS">("TODOS");
  const [filterRisk, setFilterRisk] = useState<RiskLevel | "TODOS">("TODOS");
  const [selected, setSelected] = useState<Strategy | null>(null);

  const filtered = STRATEGIES.filter(s =>
    (filterType === "TODOS" || s.type === filterType) &&
    (filterRisk === "TODOS" || s.risk === filterRisk)
  );

  const types: Array<StratType | "TODOS"> = ["TODOS", "Momentum", "Reversión", "Swing", "Scalp", "DCA", "Breakout"];
  const risks: Array<RiskLevel | "TODOS"> = ["TODOS", "BAJO", "MEDIO", "ALTO"];

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />
      <div className="pt-28 pb-24 px-4 md:px-8 max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <div className="font-space text-[10px] text-[#e040fb] tracking-[0.4em] uppercase mb-2">Estrategias Verificadas · Elite</div>
          <h1 className="font-bebas text-5xl md:text-7xl leading-none mb-3">
            MARKETPLACE<br /><span style={{ color: "#e040fb" }}>DE ESTRATEGIAS</span>
          </h1>
          <p className="font-space text-[12px] text-[#7ab3c8] max-w-lg leading-relaxed">
            Estrategias curadas y verificadas por el equipo PSYCHOMETRIKS. Cada una incluye backtest histórico, 
            setup detallado, indicadores y contexto de mercado ideal.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div>
            <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#5a8898] mb-2">TIPO</div>
            <div className="flex flex-wrap gap-1">
              {types.map(t => (
                <button key={t} onClick={() => setFilterType(t)}
                  className="px-3 py-1.5 font-space text-[10px] font-bold tracking-[0.1em] border transition-all"
                  style={{
                    borderColor: filterType === t ? "#e040fb" : "#1a2535",
                    color: filterType === t ? "#e040fb" : "#4a6070",
                    background: filterType === t ? "#e040fb15" : "#060a0f",
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#5a8898] mb-2">RIESGO</div>
            <div className="flex flex-wrap gap-1">
              {risks.map(r => {
                const c = r === "TODOS" ? { color: "#4a6070", border: "#1a2535" } : { color: RISK_COLORS[r].color, border: RISK_COLORS[r].border };
                return (
                  <button key={r} onClick={() => setFilterRisk(r)}
                    className="px-3 py-1.5 font-space text-[10px] font-bold tracking-[0.1em] border transition-all"
                    style={{
                      borderColor: filterRisk === r ? c.border : "#1a2535",
                      color: filterRisk === r ? c.color : "#4a6070",
                      background: filterRisk === r ? c.color + "10" : "#060a0f",
                    }}>
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "ESTRATEGIAS",       value: STRATEGIES.length.toString() },
            { label: "WIN RATE PROMEDIO",  value: "60%" },
            { label: "RR PROMEDIO",        value: "1:2.5" },
          ].map(s => (
            <div key={s.label} className="border border-[#1a2535] bg-[#060a0f] p-4 text-center">
              <div className="font-bebas text-3xl text-white">{s.value}</div>
              <div className="font-sharetech text-[9px] tracking-[0.15em] text-[#5a8898]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => {
            const rc = RISK_COLORS[s.risk];
            const tc = TYPE_COLORS[s.type];
            return (
              <div key={s.id}
                className="border border-[#1a2535] bg-[#060a0f] p-5 cursor-pointer hover:border-[#e040fb44] transition-all group"
                onClick={() => setSelected(s)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{s.emoji}</div>
                  <div className="flex gap-1">
                    <span className="font-sharetech text-[9px] px-2 py-0.5 border"
                      style={{ color: tc, borderColor: tc + "44", background: tc + "10" }}>
                      {s.type}
                    </span>
                    <span className="font-sharetech text-[9px] px-2 py-0.5 border"
                      style={{ color: rc.color, borderColor: rc.border, background: rc.bg }}>
                      {s.risk}
                    </span>
                  </div>
                </div>

                <div className="font-bebas text-xl text-white group-hover:text-[#e040fb] transition-colors mb-1">
                  {s.name}
                </div>
                <div className="font-sharetech text-[9px] text-[#5a8898] tracking-[0.1em] mb-3">{s.timeframe}</div>
                <p className="font-space text-[11px] text-[#7ab3c8] leading-relaxed line-clamp-3 mb-4">
                  {s.description}
                </p>

                <div className="flex items-center justify-between border-t border-[#1a2535] pt-3">
                  <div className="text-center">
                    <div className="font-space text-[11px] font-bold text-[#00e676]">{s.winRate}</div>
                    <div className="font-sharetech text-[8px] text-[#5a8898] tracking-[0.1em]">WIN RATE</div>
                  </div>
                  <div className="text-center">
                    <div className="font-space text-[11px] font-bold text-[#00e5ff]">{s.avgRR}</div>
                    <div className="font-sharetech text-[8px] text-[#5a8898] tracking-[0.1em]">RR PROMEDIO</div>
                  </div>
                  <div className="font-sharetech text-[9px] text-[#e040fb] tracking-[0.1em]">VER DETALLE →</div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="border border-[#1a2535] bg-[#060a0f] p-16 text-center">
            <div className="font-bebas text-3xl text-white mb-2">SIN RESULTADOS</div>
            <p className="font-space text-[12px] text-[#7ab3c8]">Cambiá los filtros para ver más estrategias.</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 border border-[#1a2535] bg-[#060a0f] px-6 py-4">
          <div className="font-sharetech text-[9px] text-[#5a8898] leading-relaxed">
            ⚠ EDUCATIVO — NO ES ASESORÍA FINANCIERA. Los resultados históricos no garantizan rendimientos futuros.
            Todo trading implica riesgo de pérdida. Practicá cada estrategia en paper trading antes de arriesgar capital real.
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8 overflow-auto"
          onClick={() => setSelected(null)}>
          <div className="bg-[#060a0f] border border-[#e040fb44] w-full max-w-2xl p-8 my-auto"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{selected.emoji}</span>
                  <div className="flex gap-1">
                    <span className="font-sharetech text-[9px] px-2 py-0.5 border"
                      style={{ color: TYPE_COLORS[selected.type], borderColor: TYPE_COLORS[selected.type] + "44", background: TYPE_COLORS[selected.type] + "10" }}>
                      {selected.type}
                    </span>
                    <span className="font-sharetech text-[9px] px-2 py-0.5 border"
                      style={{ color: RISK_COLORS[selected.risk].color, borderColor: RISK_COLORS[selected.risk].border, background: RISK_COLORS[selected.risk].bg }}>
                      RIESGO {selected.risk}
                    </span>
                  </div>
                </div>
                <div className="font-bebas text-4xl text-white">{selected.name}</div>
                <div className="font-sharetech text-[9px] text-[#5a8898] tracking-[0.15em]">
                  {selected.timeframe} · {selected.bestMarket}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#7ab3c8] hover:text-white text-xl font-bold">✕</button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "WIN RATE",   value: selected.winRate, color: "#00e676" },
                { label: "RR PROM.",   value: selected.avgRR,   color: "#00e5ff" },
                { label: "MERCADO",    value: selected.bestMarket.split(" ")[0], color: "#e040fb" },
              ].map(s => (
                <div key={s.label} className="border border-[#1a2535] bg-[#030609] p-3 text-center">
                  <div className="font-space text-[14px] font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="font-sharetech text-[8px] tracking-[0.1em] text-[#5a8898]">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#5a8898] mb-2">DESCRIPCIÓN</div>
                <p className="font-space text-[12px] text-[#8090a0] leading-relaxed">{selected.description}</p>
              </div>

              <div>
                <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#5a8898] mb-2">INDICADORES</div>
                <div className="flex flex-wrap gap-2">
                  {selected.indicators.map(ind => (
                    <span key={ind} className="font-sharetech text-[9px] px-2 py-1 border border-[#1a2535] text-[#7ab3c8]">{ind}</span>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#5a8898] mb-2">SETUP — PASO A PASO</div>
                <div className="border border-[#1a2535] bg-[#030609] p-4">
                  <p className="font-space text-[12px] text-[#8090a0] leading-relaxed">{selected.setup}</p>
                </div>
              </div>

              <div>
                <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#ffd700] mb-2">⚠ NOTAS IMPORTANTES</div>
                <p className="font-space text-[11px] text-[#7ab3c8] leading-relaxed">{selected.notes}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
