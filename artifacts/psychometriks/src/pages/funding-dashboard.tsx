import React, { useState, useEffect, useCallback, useRef } from "react";
import SiteNav from "@/components/site-nav";

interface FundingEntry {
  symbol: string;
  base: string;
  rate: number;
  nextFunding: string;
  price: number;
  change: number;
}

const PRIORITY_PAIRS = [
  "BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT",
  "ADAUSDT","DOGEUSDT","AVAXUSDT","LINKUSDT","DOTUSDT",
  "MATICUSDT","LTCUSDT","ATOMUSDT","NEARUSDT","APTUSDT",
  "ARBUSDT","OPUSDT","INJUSDT","SUIUSDT","TIAUSDT",
];

function fmtRate(r: number): string {
  return (r * 100).toFixed(4) + "%";
}

function rateColor(r: number): string {
  if (r >=  0.001) return "#ff1744";
  if (r >=  0.0005) return "#ff6d00";
  if (r >=  0.0001) return "#ffd700";
  if (r >= -0.0001) return "#4a6070";
  if (r >= -0.0005) return "#00e676";
  if (r >= -0.001)  return "#00c853";
  return "#00bfa5";
}

function rateBg(r: number): string {
  if (r >=  0.001) return "#ff174410";
  if (r >=  0.0001) return "#ff6d0008";
  if (r >= -0.0001) return "#1a2535";
  if (r >= -0.0005) return "#00e67608";
  return "#00bfa510";
}

function rateLabel(r: number): string {
  if (r >=  0.001) return "🔴 EXTREMO +";
  if (r >=  0.0005) return "🟠 MUY ALTO";
  if (r >=  0.0001) return "🟡 POSITIVO";
  if (r >= -0.0001) return "⚪ NEUTRAL";
  if (r >= -0.0005) return "🟢 NEGATIVO";
  if (r >= -0.001)  return "🟢 MUY NEG.";
  return "🔵 EXTREMO −";
}

function fmtPrice(p: number): string {
  if (p >= 1000) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 1)    return "$" + p.toFixed(3);
  return "$" + p.toFixed(5);
}

function nextFundingCountdown(): string {
  const now = new Date();
  const h = now.getUTCHours();
  const next = h < 8 ? 8 : h < 16 ? 16 : 24;
  const diff = (next === 24 ? (24 - h) : (next - h)) * 3600 - now.getUTCMinutes() * 60 - now.getUTCSeconds();
  const hh = Math.floor(diff / 3600);
  const mm = Math.floor((diff % 3600) / 60);
  const ss = diff % 60;
  return `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}:${String(ss).padStart(2,"0")}`;
}

export default function FundingDashboard() {
  const [data, setData] = useState<FundingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all"|"positive"|"negative"|"extreme">("all");
  const [sort, setSort] = useState<"rate"|"abs"|"symbol">("abs");
  const [countdown, setCountdown] = useState(nextFundingCountdown());
  const [lastUpdate, setLastUpdate] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown tick
  useEffect(() => {
    const t = setInterval(() => setCountdown(nextFundingCountdown()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch("/api/proxy/okx/funding-rates");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json() as { data?: { symbol: string; base: string; rate: number; nextFundingTime: number; price: number; change: number }[] };
      if (!json.data?.length) throw new Error("empty response");

      const entries: FundingEntry[] = (json?.data ?? []).map(item => ({
        symbol: item.symbol,
        base: item.base,
        rate: item.rate,
        nextFunding: nextFundingCountdown(),
        price: item.price,
        change: item.change,
      }));

      setData(entries);
      setLastUpdate(new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setError("");
    } catch {
      setError("No se pudo conectar a OKX. Reintentando...");
      // Fallback: hardcoded realistic rates (no Math.random)
      const FALLBACK: FundingEntry[] = [
        { symbol:"BTCUSDT",  base:"BTC",  rate: 0.00012, nextFunding:"", price:103800, change: 1.2 },
        { symbol:"ETHUSDT",  base:"ETH",  rate: 0.00010, nextFunding:"", price: 2450, change: 0.8 },
        { symbol:"SOLUSDT",  base:"SOL",  rate: 0.00043, nextFunding:"", price:  162, change:-0.5 },
        { symbol:"BNBUSDT",  base:"BNB",  rate: 0.00010, nextFunding:"", price:  608, change: 0.3 },
        { symbol:"XRPUSDT",  base:"XRP",  rate: 0.00010, nextFunding:"", price: 2.28, change:-0.2 },
        { symbol:"ADAUSDT",  base:"ADA",  rate: 0.00045, nextFunding:"", price: 0.72, change: 0.4 },
        { symbol:"DOGEUSDT", base:"DOGE", rate:-0.00012, nextFunding:"", price: 0.22, change:-1.1 },
        { symbol:"AVAXUSDT", base:"AVAX", rate: 0.00019, nextFunding:"", price: 22.4, change: 0.6 },
        { symbol:"LINKUSDT", base:"LINK", rate: 0.00078, nextFunding:"", price: 13.8, change: 1.5 },
        { symbol:"DOTUSDT",  base:"DOT",  rate:-0.00015, nextFunding:"", price:  4.2, change:-0.7 },
        { symbol:"MATICUSDT",base:"MATIC",rate: 0.00003, nextFunding:"", price: 0.42, change: 0.1 },
        { symbol:"LTCUSDT",  base:"LTC",  rate:-0.00042, nextFunding:"", price: 89.5, change:-0.3 },
        { symbol:"ATOMUSDT", base:"ATOM", rate: 0.00015, nextFunding:"", price:  4.8, change: 0.5 },
        { symbol:"NEARUSDT", base:"NEAR", rate:-0.00060, nextFunding:"", price:  2.7, change:-1.8 },
        { symbol:"APTUSDT",  base:"APT",  rate: 0.00031, nextFunding:"", price:  5.2, change: 0.9 },
        { symbol:"ARBUSDT",  base:"ARB",  rate: 0.00090, nextFunding:"", price: 0.38, change:-0.4 },
        { symbol:"OPUSDT",   base:"OP",   rate:-0.00033, nextFunding:"", price: 0.72, change:-0.8 },
        { symbol:"INJUSDT",  base:"INJ",  rate: 0.00180, nextFunding:"", price: 12.4, change: 2.1 },
        { symbol:"SUIUSDT",  base:"SUI",  rate:-0.00005, nextFunding:"", price:  3.6, change: 0.2 },
        { symbol:"TIASUDT",  base:"TIA",  rate: 0.00110, nextFunding:"", price:  2.1, change:-0.6 },
      ];
      setData(FALLBACK);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  const filtered = data.filter(d => {
    if (filter === "positive") return d.rate > 0;
    if (filter === "negative") return d.rate < 0;
    if (filter === "extreme")  return Math.abs(d.rate) >= 0.0005;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "rate") return b.rate - a.rate;
    if (sort === "abs")  return Math.abs(b.rate) - Math.abs(a.rate);
    return a.symbol.localeCompare(b.symbol);
  });

  const extremePos = data.filter(d => d.rate >= 0.001).length;
  const extremeNeg = data.filter(d => d.rate <= -0.001).length;
  const avgRate    = data.length ? data.reduce((s, d) => s + d.rate, 0) / data.length : 0;

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      {/* Header */}
      <section className="pt-32 pb-10 px-6 md:px-12">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4 flex items-center gap-3">
          Derivados · Perpetuos <div className="h-px bg-[#1a2535] flex-1 max-w-[80px]" />
        </div>
        <h1 className="font-bebas text-5xl md:text-8xl leading-none mb-3">
          FUNDING RATE<br /><span className="text-[#00e5ff]">DASHBOARD</span>
        </h1>
        <p className="font-space text-[12px] text-[#7ab3c8] max-w-xl leading-relaxed">
          Tasas de funding en tiempo real de Binance Perpetuos. Funding muy negativo = squeeze alcista inminente. Funding muy positivo = mercado sobrecalentado, riesgo de flush bajista.
        </p>
      </section>

      {/* Market overview */}
      <section className="px-6 md:px-12 pb-8 grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a2535] border border-[#1a2535] mb-8">
        {[
          { label: "Próximo pago funding", value: countdown, sub: "UTC 00:00 / 08:00 / 16:00", mono: true },
          { label: "Funding promedio", value: fmtRate(avgRate), sub: avgRate > 0 ? "Longs pagando" : "Shorts pagando", color: rateColor(avgRate) },
          { label: "Extremo positivo", value: `${extremePos} pares`, sub: "Funding ≥ 0.1% = riesgo bajista", color: "#ff1744" },
          { label: "Extremo negativo", value: `${extremeNeg} pares`, sub: "Funding ≤ −0.1% = squeeze alcista", color: "#00e676" },
        ].map(({ label, value, sub, color, mono }) => (
          <div key={label} className="bg-[#060a0f] p-6">
            <div className="font-space text-[10px] text-[#5a8898] tracking-[0.2em] uppercase mb-2">{label}</div>
            <div className={`font-bebas text-2xl md:text-3xl mb-1 ${mono ? "font-mono" : ""}`}
              style={{ color: color ?? "white" }}>
              {value}
            </div>
            <div className="font-space text-[10px] text-[#5a8898]">{sub}</div>
          </div>
        ))}
      </section>

      {/* Controls */}
      <section className="px-6 md:px-12 pb-6 flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {(["all","positive","negative","extreme"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="font-space text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border transition-colors"
              style={filter === f
                ? { background: "#00e5ff", color: "#020408", borderColor: "#00e5ff" }
                : { background: "transparent", color: "#4a6070", borderColor: "#1a2535" }
              }>
              {f === "all" ? "TODOS" : f === "positive" ? "🔴 POSITIVO" : f === "negative" ? "🟢 NEGATIVO" : "⚡ EXTREMOS"}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          <span className="font-space text-[10px] text-[#5a8898] py-1.5 pr-2">Ordenar:</span>
          {(["abs","rate","symbol"] as const).map(s => (
            <button key={s} onClick={() => setSort(s)}
              className="font-space text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 border transition-colors"
              style={sort === s
                ? { background: "#1a2535", color: "white", borderColor: "#00e5ff33" }
                : { background: "transparent", color: "#4a6070", borderColor: "#1a2535" }
              }>
              {s === "abs" ? "|RATE|" : s === "rate" ? "RATE ↓" : "A-Z"}
            </button>
          ))}
        </div>
      </section>

      {/* Table */}
      <section className="px-6 md:px-12 pb-20">
        {loading ? (
          <div className="border border-[#1a2535] p-20 text-center">
            <div className="font-bebas text-3xl text-[#1a2535] mb-2">CONECTANDO A BINANCE FUTURES</div>
            <div className="font-space text-[11px] text-[#5a8898]">Obteniendo funding rates en tiempo real...</div>
            <div className="mt-6 flex justify-center gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 bg-[#00e5ff] rounded-full animate-bounce"
                  style={{ animationDelay: `${i*0.15}s` }} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 border border-[#ffd70033] bg-[#ffd70008] px-4 py-2 font-space text-[10px] text-[#ffd700]">
                ⚠ {error} — Mostrando datos de ejemplo
              </div>
            )}

            {/* Desktop table */}
            <div className="hidden md:block border border-[#1a2535]">
              <div className="grid font-space text-[9px] text-[#5a8898] tracking-[0.2em] uppercase border-b border-[#1a2535] px-4 py-2"
                style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 140px" }}>
                <span>Par</span>
                <span className="text-right">Precio mark</span>
                <span className="text-right">Cambio 24h</span>
                <span className="text-right">Funding rate</span>
                <span className="text-right">Estado</span>
              </div>
              {sorted.map((entry) => (
                <div key={entry.symbol}
                  className="grid items-center px-4 py-3 border-b border-[#0d1520] hover:bg-[#060a0f] transition-colors"
                  style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 140px", background: rateBg(entry.rate) }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center font-bebas text-xs"
                      style={{ background: `${rateColor(entry.rate)}22`, color: rateColor(entry.rate) }}>
                      {entry.base.slice(0,2)}
                    </div>
                    <div>
                      <div className="font-space text-[12px] text-white">{entry.base}</div>
                      <div className="font-space text-[9px] text-[#5a8898]">PERP</div>
                    </div>
                  </div>
                  <div className="text-right font-space text-[12px] text-white">{fmtPrice(entry.price)}</div>
                  <div className="text-right font-space text-[12px]"
                    style={{ color: entry.change >= 0 ? "#00e676" : "#ff1744" }}>
                    {entry.change >= 0 ? "+" : ""}{entry.change.toFixed(2)}%
                  </div>
                  <div className="text-right">
                    <span className="font-bebas text-xl" style={{ color: rateColor(entry.rate) }}>
                      {entry.rate >= 0 ? "+" : ""}{fmtRate(entry.rate)}
                    </span>
                  </div>
                  <div className="text-right font-space text-[9px]" style={{ color: rateColor(entry.rate) }}>
                    {rateLabel(entry.rate)}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-px">
              {sorted.map(entry => (
                <div key={entry.symbol} className="p-4 border border-[#1a2535] flex items-center justify-between"
                  style={{ background: rateBg(entry.rate) }}>
                  <div>
                    <div className="font-bebas text-lg" style={{ color: rateColor(entry.rate) }}>{entry.base}</div>
                    <div className="font-space text-[10px] text-[#7ab3c8]">{fmtPrice(entry.price)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bebas text-2xl" style={{ color: rateColor(entry.rate) }}>
                      {entry.rate >= 0 ? "+" : ""}{fmtRate(entry.rate)}
                    </div>
                    <div className="font-space text-[9px]" style={{ color: rateColor(entry.rate) }}>
                      {rateLabel(entry.rate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="font-space text-[10px] text-[#5a8898]">
                {sorted.length} pares · Actualiza cada 30s {lastUpdate && `· Última act: ${lastUpdate}`}
              </span>
              <button onClick={fetchData}
                className="font-space text-[10px] text-[#00e5ff] tracking-[0.1em] uppercase hover:underline">
                ↻ Actualizar ahora
              </button>
            </div>
          </>
        )}
      </section>

      {/* Guide */}
      <section className="border-t border-[#1a2535] px-6 md:px-12 py-12">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-6">Cómo leer el funding rate</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1a2535] border border-[#1a2535]">
          {[
            { color: "#ff1744", title: "Funding muy positivo (≥ +0.1%)", desc: "Los longs están pagando fuerte a los shorts. El mercado está sobrecalentado. Alta probabilidad de flush bajista para liquidar posiciones largas apalancadas." },
            { color: "#4a6070", title: "Funding neutral (−0.01% a +0.01%)", desc: "Equilibrio entre longs y shorts. Sin presión direccional significativa desde el funding. Considerar otros indicadores para bias." },
            { color: "#00e676", title: "Funding muy negativo (≤ −0.1%)", desc: "Los shorts están pagando a los longs. Mercado en capitulación o exceso bajista. Alta probabilidad de short squeeze alcista. Zona de atención para longs." },
          ].map(({ color, title, desc }) => (
            <div key={title} className="bg-[#060a0f] p-6">
              <div className="w-3 h-3 rounded-full mb-3" style={{ background: color }} />
              <div className="font-bebas text-lg text-white mb-2">{title}</div>
              <p className="font-space text-[11px] text-[#7ab3c8] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
