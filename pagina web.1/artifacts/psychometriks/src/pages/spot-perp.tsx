import React, { useState, useEffect, useMemo } from "react";
import SiteNav from "@/components/site-nav";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell, ReferenceLine,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────
type Regime = "both_growing" | "spot_growing" | "futures_growing" | "both_contracting";

interface DayData {
  date: string;
  ts: number;
  spotDemand: number;
  perpDemand: number;
  totalDemand: number;
  price: number;
  regime: Regime;
  regimeLabel: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const REGIME_COLORS: Record<Regime, string> = {
  both_growing:       "#00e676",
  spot_growing:       "#ff9800",
  futures_growing:    "#7c4dff",
  both_contracting:   "#f44336",
};
const REGIME_LABELS: Record<Regime, string> = {
  both_growing:       "Spot & Futuros Creciendo",
  spot_growing:       "Spot Creciendo, Futuros Contrayendo",
  futures_growing:    "Spot Contrayendo, Futuros Creciendo",
  both_contracting:   "Spot & Futuros Contrayendo",
};

// ─── Data utils ──────────────────────────────────────────────────────────────
function rollingSum(arr: number[], window: number): number[] {
  return arr.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    return arr.slice(start, i + 1).reduce((a, b) => a + b, 0);
  });
}

function getRegime(spot: number, perp: number): Regime {
  if (spot >= 0 && perp >= 0) return "both_growing";
  if (spot >= 0 && perp < 0)  return "spot_growing";
  if (spot < 0 && perp >= 0)  return "futures_growing";
  return "both_contracting";
}

function fmtK(v: number) {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return v.toFixed(0);
}
function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("es-EC", { month: "short", day: "numeric" });
}
function fmtDateFull(ts: number) {
  return new Date(ts).toLocaleDateString("es-EC", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; payload?: DayData }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as DayData;
  if (!d) return null;
  return (
    <div className="bg-[#060a0f] border border-[#1a2535] p-3 text-xs font-space">
      <div className="text-[#7ab3c8] mb-1">{fmtDateFull(d.ts)}</div>
      <div className="mb-2 px-2 py-0.5 text-[10px]" style={{ background: `${REGIME_COLORS[d.regime]}22`, color: REGIME_COLORS[d.regime] }}>
        {d.regimeLabel}
      </div>
      <div style={{ color: "#00e5ff" }}>Spot: {fmtK(d.spotDemand)} BTC</div>
      <div style={{ color: "#e040fb" }}>Perp OI: {fmtK(d.perpDemand)} BTC</div>
      <div style={{ color: "#ffd700" }}>Total: {fmtK(d.totalDemand)} BTC</div>
      <div className="text-white mt-1">BTC: ${d.price.toLocaleString()}</div>
    </div>
  );
}

// ─── Plan Gate ───────────────────────────────────────────────────────────────
function getAuth() { try { const r = localStorage.getItem("psyko_auth"); if (!r) return null; const s = JSON.parse(r) as { role?: string; plan?: string; ts?: number }; if (Date.now() - (s.ts ?? 0) > 28800000) return null; return s; } catch { return null; } }
function SpotPerpGate() {
  const color = "#00e5ff";
  return (
    <div style={{ minHeight: "100vh", background: "#020408", color: "#fff", display: "flex", flexDirection: "column" }}>
      <SiteNav />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px 24px" }}>
        <div style={{ border: `1px solid ${color}33`, background: "#060a0f", padding: 40, maxWidth: 440, width: "100%", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
          <div style={{ fontSize: 44, marginBottom: 16 }}>📊</div>
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color, letterSpacing: "0.4em", marginBottom: 8 }}>PLAN PRO REQUERIDO</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: "#fff", marginBottom: 8 }}>SPOT VS PERPETUOS</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: "#546e7a", marginBottom: 24, lineHeight: 1.6 }}>
            Análisis de demanda on-chain disponible desde el plan <span style={{ color, fontWeight: 700 }}>PRO</span> ($49/mes).
          </div>
          <div style={{ background: "#0d1520", border: `1px solid ${color}22`, padding: "14px 18px", marginBottom: 24, textAlign: "left" }}>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color, letterSpacing: "0.2em", marginBottom: 10 }}>⬡ INCLUÍDO EN PLAN PRO</div>
            {["Demanda Spot vs Futuros Perpetuos · 30/90/365 días","Detección del patrón de acumulación 2022","Régimen actual de mercado en tiempo real","Integración con datos Kraken + OKX","Alertas de inversión de tendencia"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: "#8a9ab0", marginBottom: 6 }}><span style={{ color, fontSize: 9 }}>✦</span> {f}</div>
            ))}
          </div>
          <a href="/pricing" style={{ display: "block", padding: "12px", background: color, color: "#020408", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase" as const, textDecoration: "none" }}>VER PLANES →</a>
          <div style={{ marginTop: 12, fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, color: "#2a4a5a" }}>¿Ya tenés plan? <a href="/login" style={{ color, textDecoration: "none" }}>Iniciá sesión</a></div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
function SpotPerpContent() {
  const [data, setData]       = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [days, setDays]       = useState(365);
  const [currentRegime, setCurrentRegime] = useState<Regime | null>(null);
  const [patternAlert, setPatternAlert]   = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    async function fetchAll() {
      try {
        // Kraken daily spot OHLC + OKX SWAP daily candles (perp proxy)
        const [krakenRes, okxRes] = await Promise.all([
          fetch(`/api/proxy/kraken/ohlc?pair=XBTUSD&interval=1440`),
          fetch(`/api/proxy/okx/candles?instId=BTC-USDT-SWAP&bar=1D&limit=365`),
        ]);

        // Kraken: result.XXBTZUSD — rows: [time_sec, open, high, low, close, vwap, volume, count]
        const krakenJson = await krakenRes.json() as { result: Record<string, [number, string, string, string, string, string, string, number][]> };
        const krakenRows = Object.values(krakenJson.result ?? {})[0] ?? [];

        // OKX: data — rows: [ts_ms, open, high, low, close, vol_contracts, volCcy_BTC, volUSD, confirm]
        const okxJson = await okxRes.json() as { data: string[][] };
        const okxRows = (okxJson.data ?? []).reverse(); // OKX is newest-first

        // Build OKX map by date
        const okxVolumeMap = new Map<string, number>();
        for (const row of okxRows) {
          const d = new Date(parseInt(row[0])).toISOString().slice(0, 10);
          okxVolumeMap.set(d, parseFloat(row[6]) || 0); // volCcy in BTC
        }

        // Build daily arrays from Kraken (already oldest-first)
        const prices: number[]     = [];
        const spotVols: number[]   = [];
        const perpVols: number[]   = [];
        const timestamps: number[] = [];
        const dates: string[]      = [];

        for (const row of krakenRows) {
          const ts      = row[0] * 1000; // sec → ms
          const dateStr = new Date(ts).toISOString().slice(0, 10);
          const price   = parseFloat(row[4]);   // close
          const vol     = parseFloat(row[6]);   // spot volume in BTC
          const perpVol = okxVolumeMap.get(dateStr) ?? 0;

          prices.push(price);
          spotVols.push(vol);
          perpVols.push(perpVol);
          timestamps.push(ts);
          dates.push(dateStr);
        }

        // Daily changes → proxy for demand flow
        const perpChanges = perpVols.map((v, i) => i === 0 ? 0 : v - perpVols[i - 1]);
        const spotChanges = spotVols.map((v, i) => i === 0 ? 0 : v - spotVols[i - 1]);

        // 30-day rolling sums
        const WINDOW = 30;
        const spotRolling = rollingSum(spotChanges, WINDOW);
        const perpRolling = rollingSum(perpChanges, WINDOW);

        // Normalize to reasonable scale (thousands of BTC)
        const maxAbs = Math.max(...spotRolling.map(Math.abs), ...perpRolling.map(Math.abs), 1);

        const result: DayData[] = spotRolling.map((spot, i) => {
          const perp = perpRolling[i];
          const regime = getRegime(spot, perp);
          return {
            date: dates[i],
            ts: timestamps[i],
            spotDemand: spot,
            perpDemand: perp,
            totalDemand: spot + perp,
            price: prices[i],
            regime,
            regimeLabel: REGIME_LABELS[regime],
          };
        });

        if (!cancelled) {
          setData(result);
          const last = result[result.length - 1];
          setCurrentRegime(last?.regime ?? null);

          // Pattern detection: is current pattern like 2022?
          const recent = result.slice(-60);
          const futuresGrowingDays = recent.filter(d => d.regime === "futures_growing").length;
          if (futuresGrowingDays > 20) {
            setPatternAlert("⚠️ PATRÓN 2022 DETECTADO — Futuros creciendo con spot contrayendo por más de 20 días. Señal bajista.");
          } else {
            setPatternAlert("");
          }
        }
      } catch {
        if (!cancelled) {
          setError("Datos temporalmente no disponibles — Kraken y OKX no respondieron. Intenta recargar en unos minutos.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  const displayData = useMemo(() => {
    if (!data.length) return [];
    return data.slice(-days);
  }, [data, days]);

  const priceMin = useMemo(() => Math.min(...displayData.map(d => d.price)) * 0.9, [displayData]);
  const priceMax = useMemo(() => Math.max(...displayData.map(d => d.price)) * 1.05, [displayData]);

  const regimeCounts = useMemo(() => {
    const c: Record<Regime, number> = { both_growing: 0, spot_growing: 0, futures_growing: 0, both_contracting: 0 };
    for (const d of displayData) c[d.regime]++;
    return c;
  }, [displayData]);

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />
      <div className="pt-28 pb-16 px-6 md:px-12 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-2">PSY LIQMAP · DEMANDA ON-CHAIN</div>
          <h1 className="font-bebas text-5xl md:text-6xl leading-none text-white mb-2">
            SPOT VS <span className="text-[#00e5ff]">PERPETUOS</span>
          </h1>
          <p className="font-space text-[11px] text-[#7ab3c8]">
            Suma 30 días de demanda spot y futuros perpetuos · Powered by Kraken + OKX
          </p>
        </div>

        {/* Pattern Alert */}
        {patternAlert && (
          <div className="mb-6 border border-[#7c4dff44] bg-[#7c4dff0a] px-5 py-3">
            <div className="font-space text-[12px] text-[#e040fb]">{patternAlert}</div>
          </div>
        )}

        {/* Current regime + stats */}
        {currentRegime && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a2535] border border-[#1a2535] mb-6">
            {(Object.keys(REGIME_COLORS) as Regime[]).map(r => (
              <div key={r} className="bg-[#060a0f] p-4 text-center"
                style={{ borderTop: currentRegime === r ? `2px solid ${REGIME_COLORS[r]}` : "2px solid transparent" }}>
                <div className="font-bebas text-2xl" style={{ color: REGIME_COLORS[r] }}>
                  {regimeCounts[r]} d
                </div>
                <div className="font-space text-[9px] text-[#7ab3c8] mt-0.5 leading-tight">{REGIME_LABELS[r].split(", ").join("\n")}</div>
                {currentRegime === r && <div className="font-sharetech text-[8px] mt-1" style={{ color: REGIME_COLORS[r] }}>▶ AHORA</div>}
              </div>
            ))}
          </div>
        )}

        {/* Period selector */}
        <div className="flex gap-2 mb-4">
          {[90, 180, 365].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className="px-4 py-2 border font-space text-[10px] tracking-[0.1em] uppercase transition-all"
              style={{ borderColor: days === d ? "#00e5ff" : "#1a2535", color: days === d ? "#00e5ff" : "#4a6070", background: days === d ? "#00e5ff0f" : "transparent" }}>
              {d}D
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="border border-[#1a2535] bg-[#060a0f] p-4">
          <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#5a8898] mb-4">
            DEMANDA SPOT + PERPETUOS — SUMA 30 DÍAS (BTC)
          </div>
          {loading ? (
            <div className="h-80 flex items-center justify-center font-space text-[#5a8898] text-[11px]">Cargando datos de Kraken + OKX...</div>
          ) : error ? (
            <div className="h-80 flex items-center justify-center font-space text-[#ff1744] text-[11px]">{error}</div>
          ) : (
            <ResponsiveContainer width="100%" height={420}>
              <ComposedChart data={displayData} margin={{ top: 10, right: 60, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0d1520" vertical={false} />
                <XAxis dataKey="ts" tickFormatter={fmtDate} tick={{ fill: "#4a6070", fontSize: 9 }} tickLine={false} axisLine={false}
                  interval={Math.floor(displayData.length / 8)} />
                <YAxis yAxisId="demand" tick={{ fill: "#4a6070", fontSize: 9 }} tickLine={false} axisLine={false}
                  tickFormatter={fmtK} label={{ value: "BTC (30d Sum)", angle: -90, position: "insideLeft", fill: "#2a4a5a", fontSize: 9 }} />
                <YAxis yAxisId="price" orientation="right" tick={{ fill: "#4a6070", fontSize: 9 }} tickLine={false} axisLine={false}
                  domain={[priceMin, priceMax]} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine yAxisId="demand" y={0} stroke="#1a2535" strokeWidth={1} />
                <Bar yAxisId="demand" dataKey="totalDemand" maxBarSize={6}>
                  {displayData.map((entry, i) => (
                    <Cell key={i} fill={REGIME_COLORS[entry.regime]} fillOpacity={0.85} />
                  ))}
                </Bar>
                <Line yAxisId="price" type="monotone" dataKey="price" stroke="#ffd700" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.entries(REGIME_COLORS) as [Regime, string][]).map(([r, c]) => (
            <div key={r} className="flex items-center gap-2 border border-[#1a2535] bg-[#060a0f] p-3">
              <div className="w-3 h-3 shrink-0" style={{ background: c }} />
              <span className="font-space text-[10px] text-[#8a9ab0]">{REGIME_LABELS[r]}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 border border-[#1a2535] bg-[#060a0f] p-3">
            <div className="w-3 h-1 shrink-0 bg-[#ffd700]" />
            <span className="font-space text-[10px] text-[#8a9ab0]">Precio BTC</span>
          </div>
        </div>

        {/* Pattern explanation */}
        <div className="mt-6 border border-[#7c4dff22] bg-[#06040f] p-5">
          <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#7c4dff] mb-2">SEÑAL CLAVE · PATRÓN 2022</div>
          <div className="font-space text-[11px] text-[#6a7090] leading-relaxed">
            Las <span className="text-[#7c4dff]">zonas violetas</span> (Spot contrayendo + Futuros creciendo) durante bear markets señalan rallies especulativos sin soporte real — exactamente como en los bear market rallies del 2022. Si este patrón aparece ahora, esperar continuación bajista.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SpotPerp() {
  const auth = getAuth();
  if (!auth) { window.location.replace("/login?redirect=/spot-perp"); return null; }
  const plan = (auth.plan ?? "").toLowerCase();
  const ok = ["aprendiz","trader","institucional"].includes(plan) || auth.role === "superadmin" || auth.role === "operator" || auth.role === "member";
  if (!ok) return <SpotPerpGate />;
  return <SpotPerpContent />;
}
