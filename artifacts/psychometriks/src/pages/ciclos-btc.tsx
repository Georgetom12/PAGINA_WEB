import React, { useState, useEffect, useMemo } from "react";
import SiteNav from "@/components/site-nav";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from "recharts";

// ─── Stoch RSI ───────────────────────────────────────────────────────────────
function calcRSI(closes: number[], period: number): number[] {
  const rsi: number[] = new Array(closes.length).fill(50);
  if (closes.length <= period) return rsi;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff; else avgLoss += Math.abs(diff);
  }
  avgGain /= period; avgLoss /= period;
  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const g = diff > 0 ? diff : 0, l = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsi;
}

function sma(arr: number[], period: number): number[] {
  return arr.map((_, i) => {
    if (i < period - 1) return 50;
    return arr.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
  });
}

function calcStochRSI(closes: number[], rsiP = 14, stochP = 14, kP = 3, dP = 3) {
  const rsi = calcRSI(closes, rsiP);
  const stoch = rsi.map((v, i) => {
    if (i < stochP) return 50;
    const slice = rsi.slice(i - stochP, i + 1);
    const lo = Math.min(...slice), hi = Math.max(...slice);
    return hi === lo ? 50 : ((v - lo) / (hi - lo)) * 100;
  });
  const k = sma(stoch, kP);
  const d = sma(k, dP);
  return { k, d };
}

// ─── Historical bottoms ───────────────────────────────────────────────────────
const BOTTOMS = [
  { date: "2011-11", price: 2,     label: "BOTTOM 2011" },
  { date: "2015-01", price: 175,   label: "BOTTOM 2015" },
  { date: "2018-12", price: 3200,  label: "BOTTOM 2018" },
  { date: "2022-11", price: 15500, label: "BOTTOM 2022" },
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChartPoint {
  dateStr: string;
  ts: number;
  price: number;
  logPrice: number;
  k: number;
  d: number;
  isBottom?: boolean;
  bottomLabel?: string;
}

// ─── Utils ───────────────────────────────────────────────────────────────────
function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("es-EC", { year: "numeric", month: "short" });
}
function fmtPrice(v: number) {
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { value: number; name: string; payload: ChartPoint }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-[#060a0f] border border-[#1a2535] p-3 text-xs font-space">
      <div className="text-[#7ab3c8] mb-1">{d.dateStr}</div>
      <div className="text-[#ffd700]">BTC: {fmtPrice(d.price)}</div>
      {d.k !== undefined && <div className="text-[#00e5ff]">Stoch RSI K: {d.k?.toFixed(1)}</div>}
      {d.d !== undefined && <div className="text-[#e040fb]">Stoch RSI D: {d.d?.toFixed(1)}</div>}
      {d.isBottom && <div className="text-[#00e676] mt-1 font-bold">✓ {d.bottomLabel}</div>}
    </div>
  );
}

// ─── Cycle position ───────────────────────────────────────────────────────────
function getCyclePosition(k: number, d: number): { label: string; color: string; desc: string } {
  if (k < 20 && d < 20)   return { label: "ZONA DE ACUMULACIÓN", color: "#00e676", desc: "Stoch RSI en zona baja — históricamente zona de compra institucional" };
  if (k > 80 && d > 80)   return { label: "ZONA DE DISTRIBUCIÓN", color: "#f44336", desc: "Stoch RSI saturado — históricamente zona de toma de ganancias" };
  if (k > d && k < 80)    return { label: "IMPULSO ALCISTA", color: "#00e5ff", desc: "K cruzando por encima de D — momentum positivo creciente" };
  if (k < d && k > 20)    return { label: "CORRECCIÓN", color: "#ff9800", desc: "K por debajo de D — momentum perdiendo fuerza" };
  return { label: "ZONA NEUTRAL", color: "#ffd700", desc: "Stoch RSI en zona media — esperar definición de dirección" };
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function CiclosBTC() {
  const [data, setData]         = useState<ChartPoint[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [view, setView]         = useState<"full" | "recent">("full");
  const [showStoch, setShowStoch] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function fetch_data() {
      try {
        // Kraken weekly OHLC (interval=10080 min = 1 week) — goes back to 2013
        const res = await fetch(`/api/proxy/kraken/ohlc?pair=XBTUSD&interval=10080`);
        const json = await res.json() as { error?: string[] | string; result?: Record<string, [number, string, string, string, string, string, string, number][]> };
        // (julio 20 2026) Antes esto no validaba la respuesta — si el proxy
        // devolvía un error (403 del gate de acceso, error de Kraken, etc.)
        // igual parseaba como JSON válido con un array vacío, sin lanzar
        // excepción, dejando el gráfico en blanco para siempre.
        if (!res.ok || (json.error && json.error.length > 0) || !json.result) {
          throw new Error(`Kraken proxy falló: ${res.status} ${JSON.stringify(json.error ?? "sin result")}`);
        }
        const weeklyRows = Object.values(json.result)[0] ?? [];
        if (weeklyRows.length === 0) throw new Error("Kraken proxy devolvió 0 velas");

        // Group weekly rows into monthly by averaging close prices
        const monthMap = new Map<string, { closes: number[]; ts: number }>();
        for (const row of weeklyRows) {
          const ts    = row[0] * 1000;
          const close = parseFloat(row[4]);
          const key   = new Date(ts).toISOString().slice(0, 7); // YYYY-MM
          if (!monthMap.has(key)) monthMap.set(key, { closes: [], ts });
          monthMap.get(key)!.closes.push(close);
        }

        const prices: [number, number][] = [];
        for (const [, v] of monthMap) {
          const avg = v.closes.reduce((a, b) => a + b, 0) / v.closes.length;
          prices.push([v.ts, avg]);
        }
        prices.sort((a, b) => a[0] - b[0]);

        const closes = prices.map(p => p[1]);
        const { k, d } = calcStochRSI(closes, 14, 14, 3, 3);

        const bottomDates = new Set(BOTTOMS.map(b => b.date));

        const result: ChartPoint[] = prices.map(([ts, price], i) => {
          const dateStr = new Date(ts).toISOString().slice(0, 7); // YYYY-MM
          const bottom = BOTTOMS.find(b => dateStr.startsWith(b.date));
          return {
            dateStr,
            ts,
            price,
            logPrice: Math.log10(Math.max(price, 0.01)),
            k: k[i],
            d: d[i],
            isBottom: !!bottom,
            bottomLabel: bottom?.label,
          };
        });

        if (!cancelled) {
          setData(result);
        }
      } catch (e) {
        if (!cancelled) setError("Error cargando datos históricos de BTC.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch_data();
    return () => { cancelled = true; };
  }, []);

  const displayData = useMemo(() => {
    if (!data.length) return [];
    if (view === "recent") return data.slice(-48); // last 4 years
    return data;
  }, [data, view]);

  const lastPoint = data[data.length - 1];
  const cyclePos  = lastPoint ? getCyclePosition(lastPoint.k, lastPoint.d) : null;

  const priceMin = useMemo(() => Math.min(...displayData.map(d => d.price)) * 0.8, [displayData]);
  const priceMax = useMemo(() => Math.max(...displayData.map(d => d.price)) * 1.2, [displayData]);

  // Estimate next bottom (avg ~4 year halving cycles)
  const lastBottomTs  = new Date("2022-11-21").getTime();
  const cycleDuration = 4 * 365.25 * 24 * 3600 * 1000;
  const nextBottomTs  = lastBottomTs + cycleDuration;
  const nextBottomDate = new Date(nextBottomTs).toLocaleDateString("es-EC", { month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />
      <div className="pt-28 pb-16 px-6 md:px-12 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-2">PSY LIQMAP · ANÁLISIS DE CICLOS</div>
          <h1 className="font-bebas text-5xl md:text-6xl leading-none text-white mb-2">
            CICLOS <span className="text-[#00e5ff]">BTC</span> + STOCH RSI
          </h1>
          <p className="font-space text-[11px] text-[#7ab3c8]">
            Gráfico bimestral histórico · Stoch RSI (3,3,14,14) · Fondos de ciclo marcados
          </p>
        </div>

        {/* Current position */}
        {cyclePos && lastPoint && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1a2535] border border-[#1a2535] mb-8">
            <div className="bg-[#060a0f] p-5 col-span-1" style={{ borderTop: `2px solid ${cyclePos.color}` }}>
              <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#5a8898] mb-1">POSICIÓN EN EL CICLO</div>
              <div className="font-bebas text-2xl mb-1" style={{ color: cyclePos.color }}>{cyclePos.label}</div>
              <div className="font-space text-[10px] text-[#6a7090]">{cyclePos.desc}</div>
            </div>
            <div className="bg-[#060a0f] p-5">
              <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#5a8898] mb-1">STOCH RSI ACTUAL</div>
              <div className="flex gap-4 mt-2">
                <div>
                  <div className="font-space text-[9px] text-[#7ab3c8]">K</div>
                  <div className="font-bebas text-3xl text-[#00e5ff]">{lastPoint.k?.toFixed(1)}</div>
                </div>
                <div>
                  <div className="font-space text-[9px] text-[#7ab3c8]">D</div>
                  <div className="font-bebas text-3xl text-[#e040fb]">{lastPoint.d?.toFixed(1)}</div>
                </div>
              </div>
              <div className="mt-2 h-2 bg-[#0d1520] w-full">
                <div className="h-full transition-all" style={{ width: `${lastPoint.k?.toFixed(0)}%`, background: cyclePos.color }} />
              </div>
            </div>
            <div className="bg-[#060a0f] p-5">
              <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#5a8898] mb-1">PRÓXIMO FONDO ESTIMADO</div>
              <div className="font-bebas text-2xl text-[#ffd700] mt-2">{nextBottomDate}</div>
              <div className="font-space text-[9px] text-[#7ab3c8] mt-1">
                Basado en ciclos históricos de ~4 años post-halving. Si el ciclo se modifica, el Stoch RSI actualizará la señal automáticamente.
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[{ v: "full", l: "Historia completa (2012—)" }, { v: "recent", l: "Últimos 4 años" }].map(opt => (
            <button key={opt.v} onClick={() => setView(opt.v as "full" | "recent")}
              className="px-4 py-2 border font-space text-[10px] tracking-[0.1em] uppercase transition-all"
              style={{ borderColor: view === opt.v ? "#00e5ff" : "#1a2535", color: view === opt.v ? "#00e5ff" : "#4a6070", background: view === opt.v ? "#00e5ff0f" : "transparent" }}>
              {opt.l}
            </button>
          ))}
          <button onClick={() => setShowStoch(s => !s)}
            className="px-4 py-2 border font-space text-[10px] tracking-[0.1em] uppercase transition-all"
            style={{ borderColor: showStoch ? "#e040fb" : "#1a2535", color: showStoch ? "#e040fb" : "#4a6070", background: showStoch ? "#e040fb0f" : "transparent" }}>
            {showStoch ? "▼ Stoch RSI" : "▶ Stoch RSI"}
          </button>
        </div>

        {/* BTC Price chart */}
        <div className="border border-[#1a2535] bg-[#060a0f] p-4 mb-3">
          <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#5a8898] mb-3">BITCOIN — ESCALA LOGARÍTMICA (USD)</div>
          {loading ? (
            <div className="h-72 flex items-center justify-center font-space text-[#5a8898] text-[11px]">Cargando datos históricos...</div>
          ) : error ? (
            <div className="h-72 flex items-center justify-center font-space text-[#ff1744] text-[11px]">{error}</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={displayData} margin={{ top: 10, right: 60, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0d1520" vertical={false} />
                <XAxis dataKey="ts" tickFormatter={t => new Date(t).getFullYear().toString()} tick={{ fill: "#4a6070", fontSize: 9 }} tickLine={false} axisLine={false} interval={11} />
                <YAxis scale="log" domain={[priceMin, priceMax]} tickFormatter={fmtPrice} tick={{ fill: "#4a6070", fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {/* Bottom zones */}
                {BOTTOMS.map(b => {
                  const idx = displayData.findIndex(d => d.dateStr.startsWith(b.date));
                  if (idx < 0) return null;
                  return (
                    <ReferenceLine key={b.date} x={displayData[idx]?.ts} stroke="#00e67655" strokeDasharray="4 4" label={{ value: "↑ " + b.label, position: "top", fill: "#00e676", fontSize: 8 }} />
                  );
                })}
                {/* Projected next bottom */}
                <ReferenceLine x={nextBottomTs} stroke="#ffd70055" strokeDasharray="6 3" label={{ value: "↑ PROYECTADO", position: "top", fill: "#ffd700", fontSize: 8 }} />
                <Line type="monotone" dataKey="price" stroke="#ffd700" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stoch RSI chart */}
        {showStoch && !loading && !error && (
          <div className="border border-[#1a2535] bg-[#060a0f] p-4">
            <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#5a8898] mb-3">
              STOCH RSI (3,3,14,14) — LOS CÍRCULOS MARCAN FONDOS HISTÓRICOS
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={displayData} margin={{ top: 5, right: 60, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0d1520" vertical={false} />
                <XAxis dataKey="ts" tickFormatter={t => new Date(t).getFullYear().toString()} tick={{ fill: "#4a6070", fontSize: 9 }} tickLine={false} axisLine={false} interval={11} />
                <YAxis domain={[0, 100]} tick={{ fill: "#4a6070", fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {/* Zones */}
                <ReferenceArea y1={0} y2={20} fill="#00e67608" />
                <ReferenceArea y1={80} y2={100} fill="#f4433608" />
                <ReferenceLine y={20} stroke="#00e67633" strokeDasharray="4 4" label={{ value: "20 — Zona compra", position: "right", fill: "#00e676", fontSize: 8 }} />
                <ReferenceLine y={80} stroke="#f4433633" strokeDasharray="4 4" label={{ value: "80 — Zona venta", position: "right", fill: "#f44336", fontSize: 8 }} />
                {/* Bottom markers */}
                {BOTTOMS.map(b => {
                  const idx = displayData.findIndex(d => d.dateStr.startsWith(b.date));
                  if (idx < 0) return null;
                  return <ReferenceLine key={b.date} x={displayData[idx]?.ts} stroke="#00e67544" strokeDasharray="4 4" />;
                })}
                <Line type="monotone" dataKey="k" stroke="#00e5ff" strokeWidth={1.5} dot={false} name="K" />
                <Line type="monotone" dataKey="d" stroke="#e040fb" strokeWidth={1.5} dot={false} name="D" />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-2"><div className="w-3 h-px bg-[#00e5ff]" /><span className="font-space text-[9px] text-[#7ab3c8]">K (señal rápida)</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-px bg-[#e040fb]" /><span className="font-space text-[9px] text-[#7ab3c8]">D (señal lenta)</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-2 bg-[#00e67622]" /><span className="font-space text-[9px] text-[#7ab3c8]">Zona acumulación (&lt;20)</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-2 bg-[#f4433622]" /><span className="font-space text-[9px] text-[#7ab3c8]">Zona distribución (&gt;80)</span></div>
            </div>
          </div>
        )}

        {/* Cycle update note */}
        <div className="mt-6 border border-[#ffd70022] bg-[#0a0900] p-5">
          <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#ffd700] mb-2">⟳ AUTO-ACTUALIZACIÓN DE CICLOS</div>
          <div className="font-space text-[11px] text-[#6a7040] leading-relaxed">
            El Stoch RSI se recalcula en tiempo real con cada nueva vela mensual de Kraken. Si el ciclo se modifica (por ejemplo, un bottom prematuro o tardío), el indicador lo refleja automáticamente. Las líneas de proyección son estimaciones basadas en promedios históricos — no garantías.
          </div>
        </div>

        {/* ── BTC vs MINERÍA ──────────────────────────────────────────────── */}
        <div className="mt-8">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-2">PSY LIQMAP · ANÁLISIS ON-CHAIN</div>
          <h2 className="font-bebas text-3xl md:text-4xl text-white mb-1">
            BTC <span className="text-[#ff6d00]">vs</span> COSTO DE MINERÍA
          </h2>
          <p className="font-space text-[11px] text-[#7ab3c8] mb-6">
            Cuando el precio de BTC cae por debajo del costo de producción de los mineros, históricamente marca un fondo de ciclo.
          </p>

          {/* Mining cost reference cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1a2535] border border-[#1a2535] mb-6">
            {[
              { label: "COSTO PRODUCCIÓN EST.", value: "~$45,000", sub: "Promedio global mineros 2024", color: "#ff6d00" },
              { label: "COSTO MINERO EFICIENTE", value: "~$30,000", sub: "ASIC S21 · electricidad barata", color: "#ffd700" },
              { label: "PRECIO ACTUAL vs COSTO", value: ">2×", sub: "Margen positivo — mineros rentables", color: "#00e676" },
            ].map(c => (
              <div key={c.label} className="bg-[#060a0f] p-5 text-center" style={{ borderTop: `2px solid ${c.color}` }}>
                <div className="font-space text-[9px] text-[#7ab3c8] tracking-[0.1em] mb-2">{c.label}</div>
                <div className="font-bebas text-3xl mb-1" style={{ color: c.color }}>{c.value}</div>
                <div className="font-space text-[9px] text-[#5a8898]">{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Historical mining capitulation events */}
          <div className="border border-[#1a2535] bg-[#060a0f] p-5 mb-4">
            <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#ff6d00] mb-4">CAPITULACIONES DE MINEROS (FONDOS HISTÓRICOS)</div>
            <div className="space-y-3">
              {[
                { date: "DIC 2018", btcPrice: "$3,200", miningCost: "~$4,800", gap: "-33%", note: "BTC cayó 35% por debajo del costo. Mineros apagaron equipos. Fondo de ciclo confirmado.", bottom: true },
                { date: "MAR 2020", btcPrice: "$3,800", miningCost: "~$6,500", gap: "-42%", note: "Flash crash COVID. BTC tocó el costo variable en pocos días. Rebote rápido.", bottom: true },
                { date: "NOV 2022", btcPrice: "$15,800", miningCost: "~$17,000", gap: "-7%",  note: "Colapso FTX. Muchos mineros públicos quebraron. Hashrate cayó 20%.", bottom: true },
                { date: "2025 (CICLO ACTUAL)", btcPrice: "~$95K+", miningCost: "~$45K", gap: "+111%", note: "Mineros muy rentables. Post-halving 2024. No hay señal de capitulación.", bottom: false },
              ].map(ev => (
                <div key={ev.date} className="flex gap-4 items-start border border-[#1a2535] px-4 py-3"
                  style={{ borderColor: ev.bottom ? "#ff6d0033" : "#00e67622" }}>
                  <div className="shrink-0">
                    <div className="font-sharetech text-[9px] tracking-[0.1em] mb-1" style={{ color: ev.bottom ? "#ff6d00" : "#00e676" }}>{ev.date}</div>
                    <div className="font-bebas text-xl text-white">{ev.btcPrice}</div>
                    <div className="font-space text-[9px] text-[#7ab3c8]">BTC</div>
                  </div>
                  <div className="border-l border-[#1a2535] pl-4 flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-space text-[9px] text-[#7ab3c8]">Costo minería: <span className="text-white">{ev.miningCost}</span></span>
                      <span className="font-space text-[10px] font-bold px-2 py-0.5" style={{ color: ev.bottom ? "#ff6d00" : "#00e676", background: ev.bottom ? "#ff6d0015" : "#00e67615" }}>
                        {ev.gap} vs costo
                      </span>
                      {ev.bottom && <span className="font-space text-[8px] text-[#00e676] tracking-[0.1em]">✓ FONDO CONFIRMADO</span>}
                    </div>
                    <div className="font-space text-[11px] text-[#6a8a9a]">{ev.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interpretation guide */}
          <div className="border border-[#ff6d0022] bg-[#0a0500] p-5">
            <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#ff6d00] mb-3">📖 CÓMO USAR EL INDICADOR MINERÍA + BTC</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-space text-[11px] text-[#8a9ab0] leading-relaxed">
              <div>
                <p className="mb-2"><span className="text-[#ff6d00] font-bold">BTC &lt; Costo minería:</span> Zona de compra histórica. Los mineros no pueden seguir operando, el mercado está en capitulación. Solo ocurrió 3 veces en la historia de BTC.</p>
                <p><span className="text-[#ffd700] font-bold">BTC cerca del costo:</span> Zona de riesgo. Vigilar el Hashrate — si cae más del 15% en 30 días, hay capitulación en progreso.</p>
              </div>
              <div>
                <p className="mb-2"><span className="text-[#00e676] font-bold">BTC &gt; 2× costo:</span> Mineros rentables. Están acumulando BTC. No venden. Señal neutral-alcista de largo plazo.</p>
                <p><span className="text-[#00e5ff] font-bold">BTC &gt; 4× costo:</span> Zona de euforia. Los mineros venden activamente para cubrir operaciones. Históricamente marca techos de ciclo.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
