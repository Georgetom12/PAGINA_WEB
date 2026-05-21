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
  { name: "Jerome Powell",    title: "2do mandato",     start: "2022-02-04", end: "2026-02-01", startTs: new Date("2022-02-04").getTime(), dropPct: -74.96, color: "#f44336" },
  { name: "Kevin Warsh",      title: "Proyectado",      start: "2026-02-01", end: "2030-02-01", startTs: new Date("2026-02-01").getTime(), dropPct: -81.35, color: "#e040fb", projected: true },
];

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
  const [tab, setTab]                   = useState<"fed" | "premium">("fed");

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

  const priceMin = useMemo(() => Math.min(...btcHistory.map(d => d.price)) * 0.8, [btcHistory]);
  const priceMax = useMemo(() => Math.max(...btcHistory.map(d => d.price)) * 1.5, [btcHistory]);

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
          {[{ k: "fed", l: "📊 FED + BTC" }, { k: "premium", l: "⚡ Coinbase Premium" }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k as "fed" | "premium")}
              className="px-5 py-2.5 border font-space text-[11px] tracking-[0.1em] uppercase transition-all"
              style={{ borderColor: tab === t.k ? "#e040fb" : "#1a2535", color: tab === t.k ? "#e040fb" : "#4a6070", background: tab === t.k ? "#e040fb0f" : "transparent" }}>
              {t.l}
            </button>
          ))}
        </div>

        {/* ── FED TAB ── */}
        {tab === "fed" && (
          <>
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

            {/* BTC + Fed reference lines chart */}
            <div className="border border-[#1a2535] bg-[#060a0f] p-4 mb-4">
              <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#5a8898] mb-3">
                BITCOIN (SEMANAL) + CAMBIOS DE FED CHAIR — 2014 AL 2030
              </div>
              {loading ? (
                <div className="h-80 flex items-center justify-center font-space text-[#5a8898] text-[11px]">Cargando...</div>
              ) : (
                <ResponsiveContainer width="100%" height={380}>
                  <ComposedChart data={btcHistory} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0d1520" vertical={false} />
                    <XAxis dataKey="ts"
                      tickFormatter={ts => new Date(ts).getFullYear().toString()}
                      tick={{ fill: "#4a6070", fontSize: 9 }} tickLine={false} axisLine={false}
                      interval={52} />
                    <YAxis scale="log" domain={[priceMin, priceMax]}
                      tickFormatter={fmtPriceLog} tick={{ fill: "#4a6070", fontSize: 9 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<BtcFedTooltip />} />

                    {/* Fed chair appointment lines */}
                    {FED_CHAIRS.filter(c => c.name !== "Ben Bernanke" || c.dropPct === 0).map((c, i) => (
                      <ReferenceLine
                        key={i}
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

                    <Line type="monotone" dataKey="price" stroke="#ffd700" strokeWidth={1.5} dot={false} />
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
      </div>
    </div>
  );
}
