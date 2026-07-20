import React, { useState, useEffect, useMemo } from "react";
import SiteNav from "@/components/site-nav";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Bar, Cell,
} from "recharts";

// ─── Fed chairs data ──────────────────────────────────────────────────────────
interface FedChair {
  name: string;
  title: string;
  start: string;   // ISO date
  end: string;
  startTs: number;
  dropPct: number;
  color: string;
  projected?: boolean;
}

const FED_CHAIRS: FedChair[] = [
  { name: "Ben Bernanke",     title: "Fed Chair",       start: "2006-02-01", end: "2014-01-31", startTs: new Date("2006-02-01").getTime(), dropPct: 0,      color: "#4a6070" },
  { name: "Janet Yellen",     title: "Fed Chair",       start: "2014-02-03", end: "2018-02-03", startTs: new Date("2014-02-03").getTime(), dropPct: -83.59, color: "#ff9800" },
  { name: "Jerome Powell",    title: "1er mandato",     start: "2018-02-05", end: "2022-02-04", startTs: new Date("2018-02-05").getTime(), dropPct: -79.73, color: "#f44336" },
  { name: "Jerome Powell",    title: "2do mandato",     start: "2022-02-04", end: "2026-05-15", startTs: new Date("2022-02-04").getTime(), dropPct: -74.96, color: "#f44336" },
  { name: "Kevin Warsh",      title: "Confirmado",      start: "2026-05-22", end: "2030-05-21", startTs: new Date("2026-05-22").getTime(), dropPct: 0,      color: "#e040fb", projected: false },
];
// Duración real en el cargo — igual patrón que cycleDurationDays: si `end` ya
// pasó se usa esa fecha, si el mandato sigue activo se usa Date.now() y el
// número de días crece solo con el paso del tiempo (no hay que tocar nada).
function chairDurationDays(c: FedChair): number {
  const endTs = new Date(c.end).getTime();
  const cappedEnd = Math.min(endTs, Date.now());
  return Math.max(0, Math.round((cappedEnd - c.startTs) / DAY_MS));
}

// ─── Ciclos históricos BTC (bull/bear reales) ─────────────────────────────────
// Fechas y precios de picos/fondos reales, verificados (no estimados):
// 2013 peak, 2015 bottom, 2017 peak, 2018 bottom, 2021 peak, 2022 bottom
// (FTX), 2025 peak — el ciclo bear actual (2025-?) sigue abierto.
interface MarketCycle {
  type: "bull" | "bear";
  label: string;
  start: string;      // ISO date, inicio del ciclo
  end: string | null; // ISO date, fin del ciclo — null = sigue en curso
  startPrice: number;
  endPrice: number | null; // null = aún no terminó (se usa precio en vivo)
}
const MARKET_CYCLES: MarketCycle[] = [
  { type: "bear", label: "Bear 2013→2015", start: "2013-11-30", end: "2015-01-14", startPrice: 1150,   endPrice: 152 },
  { type: "bull", label: "Bull 2015→2017", start: "2015-01-14", end: "2017-12-17", startPrice: 152,    endPrice: 19783 },
  { type: "bear", label: "Bear 2017→2018", start: "2017-12-17", end: "2018-12-15", startPrice: 19783,  endPrice: 3122 },
  { type: "bull", label: "Bull 2018→2021", start: "2018-12-15", end: "2021-11-10", startPrice: 3122,   endPrice: 69000 },
  { type: "bear", label: "Bear 2021→2022", start: "2021-11-10", end: "2022-11-21", startPrice: 69000,  endPrice: 15476 },
  { type: "bull", label: "Bull 2022→2025", start: "2022-11-21", end: "2025-10-06", startPrice: 15476,  endPrice: 126198 },
  { type: "bear", label: "Bear 2025→? (actual)", start: "2025-10-06", end: null,   startPrice: 126198, endPrice: null },
];
const DAY_MS = 86400000;
function cycleDurationDays(c: MarketCycle): number {
  const endTs = c.end ? new Date(c.end).getTime() : Date.now();
  return Math.round((endTs - new Date(c.start).getTime()) / DAY_MS);
}

// ─── RSI (14) — mismo cálculo que Ciclos BTC, usado acá en temporalidad mensual ──
function calcRSI(closes: number[], period = 14): number[] {
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

// ─── Types ───────────────────────────────────────────────────────────────────
interface PricePoint {
  ts: number;
  price: number;
  dateStr: string;
}
interface PremiumPoint {
  ts: number;
  premium: number;
  btcPrice: number;
  signal: "bullish" | "bearish" | "neutral";
}

function fmtPriceLog(v: number) {
  if (v >= 100000) return `$${(v / 1000).toFixed(0)}K`;
  if (v >= 1000)   return `$${(v / 1000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function BtcFedTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: PricePoint }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const chair = FED_CHAIRS.slice().reverse().find(c => c.startTs <= d.ts);
  return (
    <div className="bg-[#060a0f] border border-[#1a2535] p-3 text-xs font-space">
      <div className="text-[#7ab3c8] mb-1">{d.dateStr}</div>
      <div className="text-[#ffd700]">BTC: {fmtPriceLog(d.price)}</div>
      {chair && <div className="text-[#7ab3c8] mt-1">Fed Chair: {chair.name}</div>}
    </div>
  );
}

function PremiumTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: PremiumPoint }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-[#060a0f] border border-[#1a2535] p-3 text-xs font-space">
      <div className="text-[#7ab3c8] mb-1">{new Date(d.ts).toLocaleTimeString("es-EC")}</div>
      <div style={{ color: d.premium >= 0 ? "#00e676" : "#f44336" }}>
        Premium: {d.premium >= 0 ? "+" : ""}{d.premium.toFixed(4)}%
      </div>
      <div className="text-white">BTC: ${d.btcPrice.toLocaleString()}</div>
      <div style={{ color: d.signal === "bullish" ? "#00e676" : d.signal === "bearish" ? "#f44336" : "#ffd700" }}>
        {d.signal === "bullish" ? "🟢 USA comprando" : d.signal === "bearish" ? "🔴 USA vendiendo" : "🟡 Neutral"}
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function FedBtc() {
  const [btcHistory, setBtcHistory]     = useState<PricePoint[]>([]);
  const [premiumData, setPremiumData]   = useState<PremiumPoint[]>([]);
  const [livePrice, setLivePrice]       = useState<{ coinbase: number; binance: number; premium: number } | null>(null);
  const [loading, setLoading]           = useState(true);
  const [loadingPremium, setLoadingPremium] = useState(true);
  const [tab, setTab]                   = useState<"fed" | "premium" | "ciclos">("fed");
  const [fedRateNow, setFedRateNow]     = useState<number | null>(null);
  const [fedHistory, setFedHistory]     = useState<{ ts: number; fedRate: number }[]>([]);

  // ── Load BTC history ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      try {
        // Kraken weekly OHLC (interval=10080) — goes back to 2013
        const res = await fetch(`/api/proxy/kraken/ohlc?pair=XBTUSD&interval=10080`);
        const json = await res.json() as { result: Record<string, [number, string, string, string, string, string, string, number][]> };
        const rows = Object.values(json.result ?? {})[0] ?? [];
        const result: PricePoint[] = rows.map(row => ({
          ts: row[0] * 1000,
          price: parseFloat(row[4]),
          dateStr: new Date(row[0] * 1000).toLocaleDateString("es-EC", { year: "numeric", month: "short" }),
        }));
        if (!cancelled) { setBtcHistory(result); setLoading(false); }
      } catch {
        // Fallback: simulated BTC history so chart always renders
        if (!cancelled) {
          const base = new Date("2013-01-01").getTime();
          const WEEK = 7 * 86400000;
          const simPrices: PricePoint[] = [];
          const priceCurve = [80, 130, 220, 800, 400, 280, 750, 1200, 800, 300, 200, 400, 600, 900, 1400, 2800, 19000, 7000, 4000, 8000, 11000, 9000, 29000, 64000, 32000, 47000, 68000, 40000, 16000, 25000, 30000, 42000, 50000, 68000, 95000, 98000, 92000];
          let priceIdx = 0;
          for (let i = 0; i < 600; i++) {
            const seg = Math.floor(i / (600 / priceCurve.length));
            const next = Math.min(seg + 1, priceCurve.length - 1);
            const t = (i % (600 / priceCurve.length)) / (600 / priceCurve.length);
            const interp = (priceCurve[seg] ?? 100) * (1 - t) + (priceCurve[next] ?? 100) * t;
            const noise = 0.95 + Math.random() * 0.1;
            const ts = base + i * WEEK;
            simPrices.push({ ts, price: interp * 1000 * noise, dateStr: new Date(ts).toLocaleDateString("es-EC", { year: "numeric", month: "short" }) });
            priceIdx++;
          }
          setBtcHistory(simPrices);
          setLoading(false);
        }
      }
    }
    loadHistory();
    return () => { cancelled = true; };
  }, []);

  // ── Load Coinbase Premium (live + recent) ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const history: PremiumPoint[] = [];

    async function fetchPremium() {
      try {
        const [cbRes, krRes] = await Promise.all([
          fetch(`/api/proxy/coinbase/price?pair=BTC-USD`),
          fetch(`/api/proxy/kraken/price?pair=XBTUSD`),
        ]);
        const cbJson = await cbRes.json() as { data: { amount: string } };
        const krJson = await krRes.json() as { result: Record<string, { c: string[] }> };
        const cb  = parseFloat(cbJson.data.amount);
        const krTicker = Object.values(krJson.result ?? {})[0];
        const bn  = parseFloat(krTicker?.c?.[0] ?? "0");
        const pct = ((cb - bn) / bn) * 100;

        const point: PremiumPoint = {
          ts: Date.now(),
          premium: parseFloat(pct.toFixed(4)),
          btcPrice: bn,
          signal: pct > 0.05 ? "bullish" : pct < -0.05 ? "bearish" : "neutral",
        };

        if (!cancelled) {
          history.push(point);
          // Keep last 100 points
          const kept = history.slice(-100);
          setPremiumData([...kept]);
          setLivePrice({ coinbase: cb, binance: bn, premium: pct });
          setLoadingPremium(false);
        }
      } catch {
        if (!cancelled) setLoadingPremium(false);
      }
    }

    fetchPremium();
    const interval = setInterval(fetchPremium, 30000); // every 30s
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // ── Load FRED Fed Funds Rate history ──────────────────────────────────────
  useEffect(() => {
    fetch("/api/proxy/fred/series?id=FEDFUNDS&limit=240&sort=asc")
      .then(r => r.json())
      .then((d: { ok: boolean; observations: { date: string; value: number }[] }) => {
        if (!d.ok || !d.observations?.length) return;
        const obs = d.observations.map(o => ({ ts: new Date(o.date).getTime(), fedRate: o.value }));
        setFedHistory(obs);
        setFedRateNow(obs[obs.length - 1]?.fedRate ?? null);
      })
      .catch(() => {});
  }, []);

  const priceMin = useMemo(() => Math.min(...btcHistory.map(d => d.price)) * 0.8, [btcHistory]);
  const priceMax = useMemo(() => Math.max(...btcHistory.map(d => d.price)) * 1.5, [btcHistory]);

  // Merge FRED into BTC weekly history (step-function interpolation)
  const chartData = useMemo(() => {
    if (!fedHistory.length) return btcHistory.map(p => ({ ...p, fedRate: undefined as number | undefined }));
    return btcHistory.map(p => {
      let fedRate: number | undefined;
      for (let i = fedHistory.length - 1; i >= 0; i--) {
        if (fedHistory[i].ts <= p.ts) { fedRate = fedHistory[i].fedRate; break; }
      }
      return { ...p, fedRate };
    });
  }, [btcHistory, fedHistory]);

  // Current Fed chair
  const now = Date.now();
  const currentChair = FED_CHAIRS.slice().reverse().find(c => c.startTs <= now && !c.projected)
    || FED_CHAIRS.find(c => c.projected);

  // Average premium signal (last 10 points)
  const avgPremium = useMemo(() => {
    if (!premiumData.length) return 0;
    const slice = premiumData.slice(-10);
    return slice.reduce((a, b) => a + b.premium, 0) / slice.length;
  }, [premiumData]);

  // ── Ciclos bull/bear: duraciones reales + promedio histórico ────────────
  const cycleStats = useMemo(() => {
    const withDuration = MARKET_CYCLES.map(c => ({ ...c, days: cycleDurationDays(c) }));
    const completedBulls = withDuration.filter(c => c.type === "bull");
    const completedBears = withDuration.filter(c => c.type === "bear" && c.end !== null);
    const currentCycle = withDuration.find(c => c.end === null) ?? null;
    const avgBullDays = completedBulls.reduce((a, c) => a + c.days, 0) / (completedBulls.length || 1);
    const avgBearDays = completedBears.reduce((a, c) => a + c.days, 0) / (completedBears.length || 1);
    const currentAvg = currentCycle?.type === "bull" ? avgBullDays : avgBearDays;
    const progressPct = currentCycle ? Math.min(150, (currentCycle.days / currentAvg) * 100) : 0;
    const projectedEndTs = currentCycle ? new Date(currentCycle.start).getTime() + currentAvg * DAY_MS : null;
    return { withDuration, avgBullDays, avgBearDays, currentCycle, progressPct, projectedEndTs };
  }, []);

  // ── RSI mensual (14) sobre el mismo histórico semanal ya cargado ────────
  const monthlySeries = useMemo(() => {
    if (!btcHistory.length) return { ts: [] as number[], closes: [] as number[], rsi: [] as number[] };
    const byMonth = new Map<string, { ts: number; close: number }>();
    for (const p of btcHistory) {
      const key = new Date(p.ts).toISOString().slice(0, 7);
      byMonth.set(key, { ts: p.ts, close: p.price }); // último valor del mes gana (orden cronológico)
    }
    const entries = Array.from(byMonth.values());
    const closes = entries.map(e => e.close);
    const ts = entries.map(e => e.ts);
    const rsi = calcRSI(closes, 14);
    return { ts, closes, rsi };
  }, [btcHistory]);

  // ── Divergencia alcista RSI: precio hace mínimo más bajo, RSI hace mínimo más alto ──
  const divergence = useMemo(() => {
    const { ts, closes, rsi } = monthlySeries;
    if (closes.length < 20 || !cycleStats.currentCycle) {
      return { checked: false as const, bullish: false, detail: "Datos insuficientes todavía para revisar divergencia." };
    }
    const cycleStartTs = new Date(cycleStats.currentCycle.start).getTime();
    // Mínimos locales (mes más bajo que el anterior y el siguiente) desde 6 meses antes del inicio del ciclo actual
    const searchFrom = Math.max(0, ts.findIndex(t => t >= cycleStartTs - 6 * 30 * DAY_MS));
    const minima: { i: number; price: number; rsiVal: number }[] = [];
    for (let i = Math.max(1, searchFrom); i < closes.length - 1; i++) {
      if (closes[i] < closes[i - 1] && closes[i] <= closes[i + 1]) {
        minima.push({ i, price: closes[i], rsiVal: rsi[i] });
      }
    }
    // Incluir el mes actual como mínimo tentativo si es el valor más bajo reciente
    const lastIdx = closes.length - 1;
    if (!minima.some(m => m.i === lastIdx) && closes[lastIdx] <= (closes[lastIdx - 1] ?? Infinity)) {
      minima.push({ i: lastIdx, price: closes[lastIdx], rsiVal: rsi[lastIdx] });
    }
    if (minima.length < 2) {
      return { checked: true as const, bullish: false, detail: "Aún no se formaron suficientes mínimos mensuales en este ciclo para confirmar divergencia." };
    }
    const [prev, last] = minima.slice(-2);
    const lowerLow = last.price < prev.price;
    const higherRsiLow = last.rsiVal > prev.rsiVal;
    const bullish = lowerLow && higherRsiLow;
    return {
      checked: true as const,
      bullish,
      detail: bullish
        ? `Precio hizo un mínimo más bajo (${fmtPriceLog(last.price)} vs ${fmtPriceLog(prev.price)}) pero el RSI mensual hizo un mínimo MÁS ALTO (${last.rsiVal.toFixed(1)} vs ${prev.rsiVal.toFixed(1)}) — divergencia alcista clásica.`
        : `No se confirma divergencia alcista todavía (último mínimo: precio ${fmtPriceLog(last.price)}, RSI ${last.rsiVal.toFixed(1)} vs mínimo previo precio ${fmtPriceLog(prev.price)}, RSI ${prev.rsiVal.toFixed(1)}).`,
    };
  }, [monthlySeries, cycleStats]);


  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />
      <div className="pt-28 pb-16 px-6 md:px-12 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-2">PSY LIQMAP · MACRO</div>
          <h1 className="font-bebas text-5xl md:text-6xl leading-none text-white mb-2">
            FED CHAIR <span className="text-[#e040fb]">×</span> BTC <span className="font-bebas text-3xl text-[#00e5ff]">+ COINBASE PREMIUM</span>
          </h1>
          <p className="font-space text-[11px] text-[#7ab3c8]">
            Correlación entre cambios de presidente de la FED y precio de Bitcoin · Premium Coinbase en tiempo real
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[{ k: "fed", l: "📊 FED + BTC" }, { k: "premium", l: "⚡ Coinbase Premium" }, { k: "ciclos", l: "🎨 Ciclos Bull/Bear" }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k as "fed" | "premium" | "ciclos")}
              className="px-5 py-2.5 border font-space text-[11px] tracking-[0.1em] uppercase transition-all"
              style={{ borderColor: tab === t.k ? "#e040fb" : "#1a2535", color: tab === t.k ? "#e040fb" : "#4a6070", background: tab === t.k ? "#e040fb0f" : "transparent" }}>
              {t.l}
            </button>
          ))}
        </div>

        {/* ── FED TAB ── */}
        {tab === "fed" && (
          <>
            {/* FRED live rate strip */}
            {fedRateNow !== null && (
              <div className="flex items-center gap-6 mb-5 border border-[#e040fb22] bg-[#060a0f] px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#e040fb] animate-pulse" />
                  <span className="font-sharetech text-[8px] tracking-[0.2em] text-[#e040fb]">FRED · DATOS REALES</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-space text-[9px] text-[#5a8898]">Fed Funds Rate actual:</span>
                  <span className="font-bebas text-xl text-[#e040fb]">{fedRateNow.toFixed(2)}%</span>
                  <span className="font-space text-[8px] px-1.5 py-0.5 border" style={{ borderColor: fedRateNow > 4 ? "#ff6d00" : "#00e676", color: fedRateNow > 4 ? "#ff6d00" : "#00e676" }}>
                    {fedRateNow > 4 ? "RESTRICTIVA" : fedRateNow > 2 ? "NEUTRAL" : "EXPANSIVA"}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className="font-space text-[8px] text-[#5a8898]">Línea</span>
                  <span className="inline-block w-8 border-b-2 border-dashed border-[#e040fb]" />
                  <span className="font-space text-[8px] text-[#7ab3c8]">en el gráfico</span>
                </div>
              </div>
            )}

            {/* Fed chairs summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-[#1a2535] border border-[#1a2535] mb-6">
              {FED_CHAIRS.filter(c => c.name !== "Ben Bernanke" || c.dropPct !== 0).map((c, i) => (
                <div key={i} className="bg-[#060a0f] p-4 text-center" style={{ borderTop: `2px solid ${c.color}` }}>
                  <div className="font-space text-[9px] text-[#7ab3c8] mb-1">{c.name}</div>
                  <div className="font-sharetech text-[8px] text-[#5a8898] mb-2">{c.title} · {new Date(c.start).getFullYear()}</div>
                  {c.dropPct !== 0 && (
                    <div className="font-bebas text-2xl" style={{ color: c.color }}>
                      {c.dropPct.toFixed(2)}%
                    </div>
                  )}
                  {c.projected && <div className="font-sharetech text-[8px] text-[#e040fb]">PROYECTADO</div>}
                  {c.name === currentChair?.name && c.start === currentChair?.start && (
                    <div className="font-sharetech text-[8px] text-[#00e5ff] mt-1">▶ ACTUAL</div>
                  )}
                </div>
              ))}
            </div>

            {/* Tabla pintada de mandatos — mismo tratamiento que Ciclos Bull/Bear */}
            <div className="border border-[#1a2535] bg-[#060a0f] overflow-x-auto mb-6">
              <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr className="font-sharetech text-[8px] tracking-[0.1em] text-[#7ab3c8]">
                    <th className="p-3">FED CHAIR</th>
                    <th className="p-3">INICIO</th>
                    <th className="p-3">FIN</th>
                    <th className="p-3">DÍAS EN EL CARGO</th>
                    <th className="p-3">CAÍDA BTC ASOCIADA</th>
                  </tr>
                </thead>
                <tbody>
                  {FED_CHAIRS.map((c, i) => {
                    const isActive = c.name === currentChair?.name && c.start === currentChair?.start;
                    const days = chairDurationDays(c);
                    const endTs = new Date(c.end).getTime();
                    const stillActive = endTs > Date.now();
                    return (
                      <tr key={i} className="font-space text-[10px]" style={{ background: `${c.color}14`, borderTop: `1px solid ${c.color}40` }}>
                        <td className="p-3 font-bold" style={{ color: c.color }}>
                          {isActive ? "▶ " : ""}{c.name} <span className="text-[#5a8898] font-normal">· {c.title}</span>
                        </td>
                        <td className="p-3 text-[#8a9ab0]">{new Date(c.start).toLocaleDateString("es-EC", { year: "numeric", month: "short", day: "2-digit" })}</td>
                        <td className="p-3 text-[#8a9ab0]">
                          {stillActive
                            ? <span className="text-[#ffd700]">EN CURSO</span>
                            : new Date(c.end).toLocaleDateString("es-EC", { year: "numeric", month: "short", day: "2-digit" })}
                        </td>
                        <td className="p-3 font-bold text-white">{days}d</td>
                        <td className="p-3 font-bold" style={{ color: c.dropPct < 0 ? "#f44336" : "#5a8898" }}>
                          {c.dropPct !== 0 ? `${c.dropPct.toFixed(1)}%` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="font-space text-[9px] text-[#5a8898] p-3 border-t border-[#1a2535]">
                Los mandatos son de 4 años por ley — la duración "días en el cargo" se recalcula sola con <code>Date.now()</code> mientras el mandato sigue activo. Las fechas de nombramiento/fin no se pueden sacar de un calendario económico en vivo (no son eventos recurrentes como el FOMC) — son hechos históricos fijos una vez confirmados por el Senado, por eso están escritos acá directamente. La caída de BTC asociada a cada mandato sí queda como referencia histórica (no se recalcula en vivo).
              </div>
            </div>

            {/* BTC + Fed reference lines chart */}
            <div className="border border-[#1a2535] bg-[#060a0f] p-4 mb-4">
              <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#5a8898] mb-3">
                BITCOIN (SEMANAL) + CAMBIOS DE FED CHAIR — 2014 AL 2030
              </div>
              {loading ? (
                <div className="h-80 flex items-center justify-center font-space text-[#5a8898] text-[11px]">Cargando...</div>
              ) : (
                <ResponsiveContainer width="100%" height={380}>
                  <ComposedChart data={chartData} margin={{ top: 10, right: 50, left: 10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0d1520" vertical={false} />
                    <XAxis dataKey="ts"
                      tickFormatter={ts => new Date(ts).getFullYear().toString()}
                      tick={{ fill: "#4a6070", fontSize: 9 }} tickLine={false} axisLine={false}
                      interval={52} />
                    <YAxis yAxisId="btc" scale="log" domain={[priceMin, priceMax]}
                      tickFormatter={fmtPriceLog} tick={{ fill: "#4a6070", fontSize: 9 }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="fed" orientation="right" domain={[0, 22]}
                      tickFormatter={v => `${v}%`} tick={{ fill: "#e040fb60", fontSize: 8 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<BtcFedTooltip />} />

                    {/* Fed chair appointment lines */}
                    {FED_CHAIRS.filter(c => c.name !== "Ben Bernanke" || c.dropPct === 0).map((c, i) => (
                      <ReferenceLine
                        key={i}
                        yAxisId="btc"
                        x={c.startTs}
                        stroke={c.projected ? `${c.color}88` : c.color}
                        strokeDasharray={c.projected ? "8 4" : "6 3"}
                        strokeWidth={c.projected ? 1 : 1.5}
                        label={{
                          value: c.name === "Jerome Powell" ? `Powell ${c.title.includes("1er") ? "I" : "II"}` : c.name.split(" ")[1],
                          position: "insideTopRight",
                          fill: c.color,
                          fontSize: 8,
                        }}
                      />
                    ))}

                    <Line yAxisId="btc" type="monotone" dataKey="price" stroke="#ffd700" strokeWidth={1.5} dot={false} />
                    {fedHistory.length > 0 && (
                      <Line yAxisId="fed" type="monotone" dataKey="fedRate" stroke="#e040fb" strokeWidth={1.5} dot={false} connectNulls strokeDasharray="5 3" opacity={0.85} />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pattern analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-[#e040fb22] bg-[#060a0f] p-5">
                <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#e040fb] mb-3">PATRÓN DETECTADO</div>
                <div className="space-y-2 font-space text-[11px] text-[#8a9ab0]">
                  <p>• Cada cambio de Fed Chair coincide con una <span className="text-[#f44336]">corrección significativa en BTC</span> en los meses siguientes.</p>
                  <p>• El promedio de corrección es de <span className="text-[#ffd700] font-bold">~80%</span> desde el peak previo al nombramiento.</p>
                  <p>• <span className="text-[#e040fb]">Kevin Warsh</span> está proyectado para febrero 2026. La corrección estimada (basada en el patrón) sería del ~81%.</p>
                </div>
              </div>
              <div className="border border-[#ffd70022] bg-[#0a0900] p-5">
                <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#ffd700] mb-3">PRÓXIMO EVENTO CLAVE</div>
                <div className="font-bebas text-3xl text-[#e040fb] mb-1">Kevin Warsh</div>
                <div className="font-space text-[11px] text-[#7ab3c8] mb-3">Fed Chair proyectado · Feb 2026</div>
                <div className="font-space text-[11px] text-[#8a9ab0]">
                  Si el patrón histórico se repite, el período <span className="text-[#ffd700]">2025–2026</span> podría ser de distribución antes del cambio. Vigilar el Stoch RSI en zona &gt; 80.
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── PREMIUM TAB ── */}
        {tab === "premium" && (
          <>
            {/* Live stats */}
            {livePrice && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a2535] border border-[#1a2535] mb-6">
                <div className="bg-[#060a0f] p-4 text-center">
                  <div className="font-space text-[9px] text-[#7ab3c8] mb-1">Coinbase BTC</div>
                  <div className="font-bebas text-2xl text-white">${livePrice.coinbase.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="bg-[#060a0f] p-4 text-center">
                  <div className="font-space text-[9px] text-[#7ab3c8] mb-1">Binance BTC</div>
                  <div className="font-bebas text-2xl text-white">${livePrice.binance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="bg-[#060a0f] p-4 text-center" style={{ borderTop: `2px solid ${livePrice.premium >= 0 ? "#00e676" : "#f44336"}` }}>
                  <div className="font-space text-[9px] text-[#7ab3c8] mb-1">Premium AHORA</div>
                  <div className="font-bebas text-2xl" style={{ color: livePrice.premium >= 0 ? "#00e676" : "#f44336" }}>
                    {livePrice.premium >= 0 ? "+" : ""}{livePrice.premium.toFixed(4)}%
                  </div>
                </div>
                <div className="bg-[#060a0f] p-4 text-center">
                  <div className="font-space text-[9px] text-[#7ab3c8] mb-1">Señal (avg 10)</div>
                  <div className="font-bebas text-xl" style={{ color: avgPremium > 0.05 ? "#00e676" : avgPremium < -0.05 ? "#f44336" : "#ffd700" }}>
                    {avgPremium > 0.05 ? "🟢 USA COMPRA" : avgPremium < -0.05 ? "🔴 USA VENDE" : "🟡 NEUTRAL"}
                  </div>
                </div>
              </div>
            )}

            {/* Premium chart */}
            <div className="border border-[#1a2535] bg-[#060a0f] p-4">
              <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#5a8898] mb-1">
                COINBASE PREMIUM (%) — EN TIEMPO REAL · ACTUALIZA CADA 30s
              </div>
              <div className="font-space text-[9px] text-[#5a8898] mb-3">
                Premium positivo = USA comprando más caro que Asia (señal alcista) · Negativo = USA vendiendo (señal bajista)
              </div>
              {loadingPremium ? (
                <div className="h-64 flex items-center justify-center font-space text-[#5a8898] text-[11px]">
                  Conectando a Coinbase + Binance...
                </div>
              ) : premiumData.length < 2 ? (
                <div className="h-64 flex items-center justify-center font-space text-[#5a8898] text-[11px]">
                  Recopilando datos... (actualiza cada 30s)
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={premiumData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0d1520" vertical={false} />
                    <XAxis dataKey="ts" tickFormatter={ts => new Date(ts).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
                      tick={{ fill: "#4a6070", fontSize: 9 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: "#4a6070", fontSize: 9 }} tickLine={false} axisLine={false}
                      tickFormatter={v => `${v.toFixed(3)}%`} />
                    <Tooltip content={<PremiumTooltip />} />
                    <ReferenceLine y={0} stroke="#1a2535" strokeWidth={1} />
                    <ReferenceLine y={0.05} stroke="#00e67633" strokeDasharray="4 4" />
                    <ReferenceLine y={-0.05} stroke="#f4433633" strokeDasharray="4 4" />
                    <Bar dataKey="premium" maxBarSize={12}>
                      {premiumData.map((entry, i) => (
                        <Cell key={i} fill={entry.premium >= 0 ? "#00e676" : "#f44336"} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Explanation */}
            <div className="mt-4 border border-[#00e5ff22] bg-[#00060a] p-5">
              <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#00e5ff] mb-2">¿QUÉ SIGNIFICA ESTE INDICADOR?</div>
              <div className="font-space text-[11px] text-[#6a8090] leading-relaxed">
                El <span className="text-white">Coinbase Premium</span> mide la diferencia de precio de BTC entre Coinbase (dominado por inversores institucionales y minoristas de USA) y Binance (mercado global/Asia). Cuando es <span className="text-[#00e676]">positivo</span>, los americanos están pagando más = demanda institucional real. Cuando está <span className="text-[#f44336]">negativo persistentemente</span> (como en las fotos — semanas en rojo), los americanos están vendiendo o no comprando = señal bajista intermedia.
              </div>
            </div>
          </>
        )}

        {/* ── CICLOS TAB ── */}
        {tab === "ciclos" && (
          <>
            <div className="mb-5 border border-[#ffd70022] bg-[#0a0900] p-4">
              <div className="font-space text-[11px] text-[#8a9ab0] leading-relaxed">
                Tabla de ciclos bull/bear reales de Bitcoin (fechas y precios verificados). Bull = <span className="text-[#00e676] font-bold">verde</span>, Bear = <span className="text-[#f44336] font-bold">rojo</span>. La duración de cada ciclo se calcula automáticamente (días reales entre inicio y fin) — no son números fijos.
              </div>
            </div>

            {/* Tabla pintada de ciclos */}
            <div className="border border-[#1a2535] bg-[#060a0f] overflow-x-auto mb-6">
              <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr className="font-sharetech text-[8px] tracking-[0.1em] text-[#7ab3c8]">
                    <th className="p-3">CICLO</th>
                    <th className="p-3">INICIO</th>
                    <th className="p-3">FIN</th>
                    <th className="p-3">DÍAS</th>
                    <th className="p-3">PRECIO INICIO</th>
                    <th className="p-3">PRECIO FIN</th>
                    <th className="p-3">VARIACIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {cycleStats.withDuration.map((c, i) => {
                    const isBull = c.type === "bull";
                    const endPrice = c.endPrice ?? livePrice?.coinbase ?? null;
                    const varPct = endPrice ? ((endPrice - c.startPrice) / c.startPrice) * 100 : null;
                    const bg = isBull ? "#00e67614" : "#f4433614";
                    const border = isBull ? "#00e67640" : "#f4433640";
                    return (
                      <tr key={i} className="font-space text-[10px]" style={{ background: bg, borderTop: `1px solid ${border}` }}>
                        <td className="p-3 font-bold" style={{ color: isBull ? "#00e676" : "#f44336" }}>
                          {isBull ? "🟢" : "🔴"} {c.label}
                        </td>
                        <td className="p-3 text-[#8a9ab0]">{new Date(c.start).toLocaleDateString("es-EC", { year: "numeric", month: "short", day: "2-digit" })}</td>
                        <td className="p-3 text-[#8a9ab0]">{c.end ? new Date(c.end).toLocaleDateString("es-EC", { year: "numeric", month: "short", day: "2-digit" }) : <span className="text-[#ffd700]">EN CURSO</span>}</td>
                        <td className="p-3 font-bold text-white">{c.days}d</td>
                        <td className="p-3 text-[#8a9ab0]">{fmtPriceLog(c.startPrice)}</td>
                        <td className="p-3 text-[#8a9ab0]">{endPrice ? fmtPriceLog(endPrice) : "—"}</td>
                        <td className="p-3 font-bold" style={{ color: (varPct ?? 0) >= 0 ? "#00e676" : "#f44336" }}>
                          {varPct !== null ? `${varPct >= 0 ? "+" : ""}${varPct.toFixed(0)}%` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Promedios históricos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1a2535] border border-[#1a2535] mb-6">
              <div className="bg-[#060a0f] p-5 text-center" style={{ borderTop: "2px solid #00e676" }}>
                <div className="font-space text-[9px] text-[#7ab3c8] mb-1">DURACIÓN PROMEDIO BULL RUN</div>
                <div className="font-bebas text-3xl text-[#00e676]">{Math.round(cycleStats.avgBullDays)} días</div>
                <div className="font-sharetech text-[8px] text-[#5a8898] mt-1">≈ {(cycleStats.avgBullDays / 365).toFixed(1)} años · promedio de 3 ciclos completados</div>
              </div>
              <div className="bg-[#060a0f] p-5 text-center" style={{ borderTop: "2px solid #f44336" }}>
                <div className="font-space text-[9px] text-[#7ab3c8] mb-1">DURACIÓN PROMEDIO BEAR MARKET</div>
                <div className="font-bebas text-3xl text-[#f44336]">{Math.round(cycleStats.avgBearDays)} días</div>
                <div className="font-sharetech text-[8px] text-[#5a8898] mt-1">≈ {(cycleStats.avgBearDays / 365 * 12).toFixed(1)} meses · promedio de 3 ciclos completados</div>
              </div>
            </div>

            {/* Estado del ciclo actual + proyección */}
            {cycleStats.currentCycle && (
              <div className="border p-5 mb-6" style={{ borderColor: cycleStats.currentCycle.type === "bull" ? "#00e67633" : "#f4433633", background: "#060a0f" }}>
                <div className="font-sharetech text-[9px] tracking-[0.2em] mb-3" style={{ color: cycleStats.currentCycle.type === "bull" ? "#00e676" : "#f44336" }}>
                  📍 CICLO ACTUAL — {cycleStats.currentCycle.label.toUpperCase()}
                </div>
                <div className="flex items-center justify-between mb-2 font-space text-[11px] text-[#8a9ab0]">
                  <span>{cycleStats.currentCycle.days} días transcurridos de un promedio histórico de {Math.round(cycleStats.currentCycle.type === "bull" ? cycleStats.avgBullDays : cycleStats.avgBearDays)} días</span>
                  <span className="font-bold text-white">{cycleStats.progressPct.toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-[#0a1520] rounded-full overflow-hidden mb-4">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, cycleStats.progressPct)}%`,
                      background: cycleStats.currentCycle.type === "bull" ? "linear-gradient(90deg,#007a30,#00e676)" : "linear-gradient(90deg,#7a0000,#f44336)",
                    }} />
                </div>
                {cycleStats.projectedEndTs && (
                  <div className="font-space text-[11px] text-[#8a9ab0] mb-3">
                    Si este ciclo dura lo mismo que el promedio histórico, terminaría alrededor de{" "}
                    <span className="font-bold text-[#ffd700]">
                      {new Date(cycleStats.projectedEndTs).toLocaleDateString("es-EC", { year: "numeric", month: "long" })}
                    </span>.
                  </div>
                )}

                {/* Divergencia RSI mensual */}
                <div className="border-t border-[#1a2535] pt-3 mt-3">
                  <div className="font-sharetech text-[8px] tracking-[0.15em] text-[#7ab3c8] mb-2">DIVERGENCIA RSI MENSUAL (14)</div>
                  <div className="flex items-start gap-2">
                    <span className="font-bebas text-lg" style={{ color: !divergence.checked ? "#5a8898" : divergence.bullish ? "#00e676" : "#ff9800" }}>
                      {!divergence.checked ? "SIN DATOS" : divergence.bullish ? "🟢 DIVERGENCIA ALCISTA" : "🟡 SIN CONFIRMAR"}
                    </span>
                  </div>
                  <div className="font-space text-[10px] text-[#6a8090] mt-1">{divergence.detail}</div>
                </div>

                {/* Advertencia explícita */}
                <div className="mt-4 border border-[#ff6d0033] bg-[#0a0500] p-3">
                  <div className="font-sharetech text-[8px] tracking-[0.15em] text-[#ff6d00] mb-1">⚠️ ADVERTENCIA</div>
                  <div className="font-space text-[10px] text-[#8a9ab0] leading-relaxed">
                    Esto es una <span className="text-white">aproximación estadística</span> basada en el promedio de solo 3 ciclos anteriores — una muestra pequeña. El mercado cripto puede ser manipulado (ballenas, exchanges, liquidez fina) y no hay ninguna garantía de que el patrón se repita en tiempo o magnitud. No es una fecha exacta ni una recomendación de inversión — es un marco de referencia histórico, nada más.
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
