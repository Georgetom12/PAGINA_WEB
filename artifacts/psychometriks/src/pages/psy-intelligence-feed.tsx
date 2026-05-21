import React, { useState, useEffect, useCallback, useRef } from "react";
import SiteNav from "@/components/site-nav";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────
interface FeedData {
  btcPrice: number;
  btcChange24h: number;
  fundingRate: number;
  openInterest: number;
  fearGreed: number;
  fearGreedLabel: string;
  lsRatio: number;
  fgHistory: { ts: string; value: number; label: string }[];
  lsHistory:  { ts: string; value: number }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtPrice(v: number) {
  return "$" + v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
function fmtPct(v: number, decimals = 4) {
  return (v >= 0 ? "+" : "") + (v * 100).toFixed(decimals) + "%";
}
function fmtB(v: number) {
  if (v >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return "$" + (v / 1e6).toFixed(0) + "M";
  return "$" + v.toFixed(0);
}

function fgColor(v: number) {
  if (v <= 25) return "#ff1744";
  if (v <= 45) return "#ff6d00";
  if (v <= 55) return "#ffd700";
  if (v <= 75) return "#00e676";
  return "#e040fb";
}
function fgLabel(v: number) {
  if (v <= 25) return "MIEDO EXTREMO";
  if (v <= 45) return "MIEDO";
  if (v <= 55) return "NEUTRAL";
  if (v <= 75) return "CODICIA";
  return "CODICIA EXTREMA";
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTip({ active, payload, label }: { active?: boolean; payload?: {value:number;color:string}[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#060a0f", border: "1px solid #1a2535", padding: "8px 12px", fontFamily: "'Share Tech Mono',monospace", fontSize: 10 }}>
      <div style={{ color: "#4a6070", marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color ?? "#00e5ff" }}>{p.value}</div>
      ))}
    </div>
  );
}

// ─── Gauge SVG ───────────────────────────────────────────────────────────────
function FearGreedGauge({ value, color }: { value: number; color: string }) {
  const r = 70;
  const cx = 90, cy = 90;
  const startAngle = -210;
  const sweepAngle = 240;
  const angle = startAngle + (sweepAngle * value) / 100;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arc = (deg: number) => ({
    x: cx + r * Math.cos(toRad(deg)),
    y: cy + r * Math.sin(toRad(deg)),
  });
  const needleTip = { x: cx + (r - 10) * Math.cos(toRad(angle)), y: cy + (r - 10) * Math.sin(toRad(angle)) };
  const arcs = [
    { start: -210, end: -162, color: "#ff1744" },
    { start: -162, end: -114, color: "#ff6d00" },
    { start: -114, end: -66,  color: "#ffd700" },
    { start:  -66, end:  -18, color: "#00e676" },
    { start:  -18, end:   30, color: "#e040fb" },
  ];
  function describeArc(s: number, e: number) {
    const p1 = arc(s), p2 = arc(e);
    const large = e - s > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`;
  }
  return (
    <svg width={180} height={110} viewBox="0 0 180 110">
      {arcs.map((a, i) => (
        <path key={i} d={describeArc(a.start, a.end)} fill="none" stroke={a.color} strokeWidth={10} strokeLinecap="round" opacity={0.3} />
      ))}
      <path d={describeArc(startAngle, angle)} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y} stroke="#fff" strokeWidth={2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill="#fff" />
      <text x={cx} y={cy + 20} textAnchor="middle" fill="#fff" fontFamily="'Orbitron',monospace" fontSize={22} fontWeight={700}>{value}</text>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PsyIntelligenceFeed() {
  const [data, setData]           = useState<FeedData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [narrative, setNarrative] = useState("");
  const [narLoading, setNarLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [narTs, setNarTs]         = useState<Date | null>(null);
  const narrativeRef              = useRef("");

  // ── Fetch all market data ──
  const fetchData = useCallback(async () => {
    try {
      const [krakenTicker, okxOI, okxFunding, fearGreedRaw, lsRatioRaw] = await Promise.allSettled([
        fetch("/api/proxy/kraken/price?pair=XBTUSD").then(r => r.json()),
        fetch("/api/proxy/okx/oi?instId=BTC-USDT-SWAP").then(r => r.json()),
        fetch("/api/proxy/okx/funding?instId=BTC-USDT-SWAP").then(r => r.json()),
        fetch("/api/proxy/fear-greed?limit=7").then(r => r.json()),
        fetch("/api/proxy/okx/ls-ratio?ccy=BTC&period=1D&limit=30").then(r => r.json()),
      ]);

      // BTC price from Kraken
      let btcPrice = 0, btcChange24h = 0;
      if (krakenTicker.status === "fulfilled") {
        const t = krakenTicker.value;
        const pair = Object.keys(t.result ?? {})[0];
        const ticker = t.result?.[pair];
        if (ticker) {
          btcPrice    = parseFloat(ticker.c?.[0] ?? "0");
          const open  = parseFloat(ticker.o ?? "0");
          btcChange24h = open > 0 ? ((btcPrice - open) / open) * 100 : 0;
        }
      }

      // OKX OI
      let openInterest = 0;
      if (okxOI.status === "fulfilled") {
        const oiData = okxOI.value?.data?.[0];
        openInterest = parseFloat(oiData?.oiCcy ?? "0") * btcPrice;
      }

      // OKX Funding
      let fundingRate = 0;
      if (okxFunding.status === "fulfilled") {
        fundingRate = parseFloat(okxFunding.value?.data?.[0]?.fundingRate ?? "0");
      }

      // Fear & Greed
      let fearGreed = 50, fearGreedLabel = "NEUTRAL";
      let fgHistory: { ts: string; value: number; label: string }[] = [];
      if (fearGreedRaw.status === "fulfilled") {
        const fgData = fearGreedRaw.value?.data ?? [];
        fearGreed      = parseInt(fgData[0]?.value ?? "50");
        fearGreedLabel = fgLabel(fearGreed);
        fgHistory = [...fgData].reverse().map((d: { value: string; value_classification: string; timestamp: string }) => ({
          ts:    new Date(parseInt(d.timestamp) * 1000).toLocaleDateString("es-EC", { month: "short", day: "numeric" }),
          value: parseInt(d.value),
          label: d.value_classification,
        }));
      }

      // L/S ratio OKX
      let lsRatio = 0;
      let lsHistory: { ts: string; value: number }[] = [];
      if (lsRatioRaw.status === "fulfilled") {
        const lsData = lsRatioRaw.value?.data ?? [];
        lsRatio = parseFloat(lsData[0]?.[1] ?? "0");
        lsHistory = [...lsData].slice(0, 14).reverse().map((d: string[]) => ({
          ts:    new Date(parseInt(d[0])).toLocaleDateString("es-EC", { month: "short", day: "numeric" }),
          value: parseFloat(parseFloat(d[1]).toFixed(3)),
        }));
      }

      const next: FeedData = {
        btcPrice, btcChange24h, fundingRate, openInterest,
        fearGreed, fearGreedLabel, lsRatio, fgHistory, lsHistory,
      };
      setData(next);
      setLastUpdate(new Date());
      setLoading(false);
      return next;
    } catch {
      setLoading(false);
      return null;
    }
  }, []);

  // ── Fetch narrative from Claude ──
  const fetchNarrative = useCallback(async (d: FeedData) => {
    setNarLoading(true);
    narrativeRef.current = "";
    setNarrative("");
    try {
      const res = await fetch("/api/intelligence/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fearGreed:      d.fearGreed,
          fearGreedLabel: d.fearGreedLabel,
          btcPrice:       d.btcPrice,
          btcChange24h:   d.btcChange24h,
          fundingRate:    d.fundingRate,
          openInterest:   d.openInterest,
          lsRatio:        d.lsRatio,
        }),
      });
      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      if (!reader) return;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6)) as { text?: string; done?: boolean; error?: boolean };
            if (parsed.done || parsed.error) break;
            if (parsed.text) {
              narrativeRef.current += parsed.text;
              setNarrative(narrativeRef.current);
            }
          } catch { /* skip */ }
        }
      }
      setNarTs(new Date());
    } catch { /* silent */ }
    finally { setNarLoading(false); }
  }, []);

  useEffect(() => {
    fetchData().then(d => { if (d) fetchNarrative(d); });
    const interval = setInterval(() => {
      fetchData().then(d => { if (d) fetchNarrative(d); });
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData, fetchNarrative]);

  // ── Refresh manual ──
  const handleRefresh = useCallback(() => {
    fetchData().then(d => { if (d) fetchNarrative(d); });
  }, [fetchData, fetchNarrative]);

  const fgC = data ? fgColor(data.fearGreed) : "#ffd700";
  const fundColor = data
    ? data.fundingRate > 0.0003 ? "#ff1744"
    : data.fundingRate > 0.0001 ? "#ff6d00"
    : data.fundingRate < -0.0001 ? "#00e676"
    : "#4a6070"
    : "#4a6070";

  const lsColor = data
    ? data.lsRatio > 1.5 ? "#ff1744"
    : data.lsRatio > 1.1 ? "#ffd700"
    : data.lsRatio < 0.9 ? "#00e676"
    : "#4a6070"
    : "#4a6070";

  function NarrativeText({ text }: { text: string }) {
    return (
      <>
        {text.split(/(\n\n|\n)/g).map((chunk, ci) => {
          if (chunk === "\n\n") return <><br key={ci} /><br /></>;
          if (chunk === "\n")   return <br key={ci} />;
          return (
            <React.Fragment key={ci}>
              {chunk.split(/\*\*(.+?)\*\*/g).map((part, pi) =>
                pi % 2 === 1
                  ? <span key={pi} style={{ color: "#00e5ff", fontWeight: 700 }}>{part}</span>
                  : <React.Fragment key={pi}>{part}</React.Fragment>
              )}
            </React.Fragment>
          );
        })}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="font-sharetech text-[9px] tracking-[0.35em] text-[#5a8898] mb-2">
              PSYCHOMETRIKS · LIQMAP PRO · INTELIGENCIA DE MERCADO
            </div>
            <h1 className="font-bebas text-4xl md:text-5xl text-white leading-none mb-1">
              PSY INTELLIGENCE FEED
            </h1>
            <p className="font-space text-[11px] text-[#7ab3c8]">
              Fear & Greed · Funding · Open Interest · L/S Ratio · Narrativa IA en tiempo real
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {lastUpdate && (
              <div className="font-sharetech text-[9px] text-[#5a8898]">
                {lastUpdate.toLocaleTimeString("es-EC")}
              </div>
            )}
            <button
              onClick={handleRefresh}
              className="font-space text-[9px] px-3 py-1.5 border border-[#1a2535] text-[#7ab3c8] hover:border-[#00e5ff44] hover:text-[#00e5ff] transition-colors"
            >
              ↺ ACTUALIZAR
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="font-sharetech text-[10px] text-[#5a8898] tracking-[0.3em] animate-pulse">
              CARGANDO DATOS DE MERCADO...
            </div>
          </div>
        ) : data ? (
          <>
            {/* ── Top KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#0d1520] border border-[#0d1520] mb-6">
              {[
                {
                  label: "BTC PRECIO",
                  value: fmtPrice(data.btcPrice),
                  sub: `${data.btcChange24h >= 0 ? "+" : ""}${data.btcChange24h.toFixed(2)}% 24h`,
                  color: data.btcChange24h >= 0 ? "#00e676" : "#ff1744",
                },
                {
                  label: "FEAR & GREED",
                  value: `${data.fearGreed}/100`,
                  sub: data.fearGreedLabel,
                  color: fgC,
                },
                {
                  label: "FUNDING BTC",
                  value: fmtPct(data.fundingRate),
                  sub: data.fundingRate > 0.0003 ? "LONGS PAGANDO MUCHO" : data.fundingRate < -0.0001 ? "SHORTS PAGANDO" : "EQUILIBRADO",
                  color: fundColor,
                },
                {
                  label: "RATIO L/S",
                  value: data.lsRatio > 0 ? data.lsRatio.toFixed(2) : "N/D",
                  sub: data.lsRatio > 1.2 ? "MÁS LONGS" : data.lsRatio < 0.9 ? "MÁS SHORTS" : "EQUILIBRADO",
                  color: lsColor,
                },
              ].map(k => (
                <div key={k.label} className="bg-[#060a0f] p-4 md:p-5">
                  <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#5a8898] mb-2">{k.label}</div>
                  <div className="font-orbitron text-xl md:text-2xl font-black mb-1" style={{ color: k.color }}>{k.value}</div>
                  <div className="font-space text-[9px]" style={{ color: k.color }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* ── Segunda fila: OI + gauge ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#0d1520] border border-[#0d1520] mb-6">
              {/* Open Interest */}
              <div className="bg-[#060a0f] p-5">
                <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#5a8898] mb-1">OPEN INTEREST BTC</div>
                <div className="font-orbitron text-3xl font-black text-[#e040fb] mb-1">
                  {data.openInterest > 0 ? fmtB(data.openInterest) : "—"}
                </div>
                <div className="font-space text-[9px] text-[#7ab3c8]">
                  {data.openInterest > 20e9
                    ? "OI ELEVADO — apalancamiento alto en el mercado"
                    : data.openInterest > 10e9
                    ? "OI MODERADO — posiciones normales"
                    : "OI BAJO — mercado desapalancado"}
                </div>
              </div>

              {/* Fear & Greed Gauge */}
              <div className="bg-[#060a0f] p-5 flex flex-col items-center justify-center">
                <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#5a8898] mb-2 self-start">GAUGE SENTIMIENTO</div>
                <FearGreedGauge value={data.fearGreed} color={fgC} />
                <div className="font-bebas text-xl tracking-[0.15em] mt-1" style={{ color: fgC }}>
                  {data.fearGreedLabel}
                </div>
              </div>
            </div>

            {/* ── Gráficos ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#0d1520] border border-[#0d1520] mb-6">

              {/* Fear & Greed Histórico — 7 días */}
              <div className="bg-[#060a0f] p-5">
                <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#5a8898] mb-4">
                  FEAR & GREED — ÚLTIMOS 7 DÍAS
                </div>
                {data.fgHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={data.fgHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fgGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={fgC} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={fgC} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0d1520" />
                      <XAxis dataKey="ts" tick={{ fill: "#2a4a5a", fontSize: 8, fontFamily: "'Share Tech Mono'" }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "#2a4a5a", fontSize: 8, fontFamily: "'Share Tech Mono'" }} />
                      <ReferenceLine y={25} stroke="#ff1744" strokeDasharray="4 4" strokeOpacity={0.5} />
                      <ReferenceLine y={75} stroke="#e040fb" strokeDasharray="4 4" strokeOpacity={0.5} />
                      <Tooltip content={<CustomTip />} />
                      <Area type="monotone" dataKey="value" stroke={fgC} fill="url(#fgGrad)" strokeWidth={2} dot={{ fill: fgC, r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center font-space text-[9px] text-[#5a8898]">CARGANDO...</div>
                )}
                <div className="flex justify-between mt-2">
                  {[{v:0,l:"Miedo\nExtremo",c:"#ff1744"},{v:25,l:"Miedo",c:"#ff6d00"},{v:50,l:"Neutral",c:"#ffd700"},{v:75,l:"Codicia",c:"#00e676"},{v:90,l:"Codicia\nExtrema",c:"#e040fb"}].map(z => (
                    <div key={z.v} className="text-center">
                      <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: z.c }} />
                      <div className="font-space text-[7px] leading-tight" style={{ color: z.c }}>{z.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* L/S Ratio Histórico */}
              <div className="bg-[#060a0f] p-5">
                <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#5a8898] mb-4">
                  RATIO LONGS/SHORTS — 14 DÍAS (OKX)
                </div>
                {data.lsHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={data.lsHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0d1520" />
                      <XAxis dataKey="ts" tick={{ fill: "#2a4a5a", fontSize: 8, fontFamily: "'Share Tech Mono'" }} />
                      <YAxis tick={{ fill: "#2a4a5a", fontSize: 8, fontFamily: "'Share Tech Mono'" }} />
                      <ReferenceLine y={1} stroke="#ffd700" strokeDasharray="4 4" />
                      <Tooltip content={<CustomTip />} />
                      <Bar dataKey="value" fill="#00e5ff" opacity={0.7} radius={[2, 2, 0, 0]}
                        label={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center font-space text-[9px] text-[#5a8898]">
                    {data.lsRatio > 0 ? "CARGANDO HISTÓRICO..." : "L/S HISTÓRICO NO DISPONIBLE VÍA OKX"}
                  </div>
                )}
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#ff1744]"/><span className="font-space text-[8px] text-[#7ab3c8]">&gt;1.5 Longs extremo</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#ffd700]"/><span className="font-space text-[8px] text-[#7ab3c8]">1.0 Equilibrio</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#00e676]"/><span className="font-space text-[8px] text-[#7ab3c8]">&lt;0.9 Shorts dominan</span></div>
                </div>
              </div>
            </div>

            {/* ── Narrativa IA Claude ── */}
            <div className="border border-[#1a2535] bg-[#060a0f] p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#e040fb] to-transparent" />

              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="font-sharetech text-[8px] tracking-[0.3em] text-[#7ab3c8] mb-1">
                    PSYCHOMETRIKS · ANÁLISIS IA · CLAUDE
                  </div>
                  <div className="font-bebas text-2xl text-white">NARRATIVA DE MERCADO</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${narLoading ? "animate-pulse bg-[#e040fb]" : "bg-[#00e676]"}`} />
                    <span className="font-space text-[8px] text-[#7ab3c8]">
                      {narLoading ? "ANALIZANDO..." : narTs ? narTs.toLocaleTimeString("es-EC") : "—"}
                    </span>
                  </div>
                  {!narLoading && (
                    <button
                      onClick={() => { if (data) fetchNarrative(data); }}
                      className="font-space text-[8px] px-2 py-1 border border-[#1a2535] text-[#7ab3c8] hover:border-[#e040fb44] hover:text-[#e040fb] transition-colors"
                    >
                      ↺ NUEVO ANÁLISIS
                    </button>
                  )}
                </div>
              </div>

              {narrative ? (
                <div className="font-space text-[12px] leading-relaxed text-[#a0b4c0]">
                  <NarrativeText text={narrative} />
                </div>
              ) : narLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-3 bg-[#0d1520] animate-pulse rounded" style={{ width: `${70 + i * 8}%` }} />
                  ))}
                </div>
              ) : (
                <div className="font-space text-[10px] text-[#5a8898]">Iniciando análisis...</div>
              )}
            </div>

            {/* ── Guía de lectura ── */}
            <div className="mt-6 border border-[#0d1520] bg-[#060a0f] p-5">
              <div className="font-sharetech text-[8px] tracking-[0.3em] text-[#5a8898] mb-4">CÓMO LEER ESTE PANEL</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    icon: "😱",
                    title: "Fear & Greed",
                    body: "0-25: Miedo extremo — históricamente zona de compra institucional. 75-100: Codicia extrema — zona de distribución. El mercado siempre vuelve al centro (45-55).",
                  },
                  {
                    icon: "💸",
                    title: "Funding Rate",
                    body: "Positivo alto (+0.03%+): longs pagando mucho — mercado sobrecalentado, riesgo de flush. Negativo: shorts pagando — posible squeeze. Cerca de 0: equilibrio saludable.",
                  },
                  {
                    icon: "📊",
                    title: "Ratio L/S",
                    body: ">1.5: demasiados longs abiertos — el mercado tiende a limpiar esas posiciones. <0.9: shorts dominando — posible short squeeze. 1.0 es el equilibrio neutro.",
                  },
                  {
                    icon: "🟣",
                    title: "Open Interest",
                    body: "Alto OI + precio subiendo: tendencia sólida. Alto OI + precio lateral: riesgo de flush. OI cayendo: desapalancamiento — mercado más sano para nuevas posiciones.",
                  },
                ].map(g => (
                  <div key={g.title} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{g.icon}</span>
                      <div className="font-space text-[10px] text-[#00e5ff] font-bold">{g.title}</div>
                    </div>
                    <div className="font-space text-[10px] text-[#7ab3c8] leading-relaxed">{g.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="text-4xl">⚠️</div>
            <div className="font-space text-[11px] text-[#7ab3c8]">Error cargando datos. Verificá tu conexión.</div>
            <button onClick={handleRefresh} className="font-space text-[10px] px-4 py-2 border border-[#1a2535] text-[#7ab3c8] hover:border-[#00e5ff44] hover:text-[#00e5ff] transition-colors">
              REINTENTAR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
