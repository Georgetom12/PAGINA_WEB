import React, { useState, useEffect, useCallback } from "react";
import SiteNav from "@/components/site-nav";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Signal {
  id: number;
  asset: string;
  direction: "LONG" | "SHORT";
  entry: string;
  tp1: string;
  tp2?: string | null;
  sl: string;
  leverage?: string | null;
  rr?: string | null;
  status: string;
  source?: string | null;
  notes?: string | null;
  createdAt: string;
}

function calcPnl(signals: Signal[]) {
  let wins = 0, losses = 0, pnlR = 0;
  signals.forEach(s => {
    const st = s.status?.toUpperCase() ?? "";
    const rrStr = s.rr ?? "1:2";
    const rrMatch = rrStr.match(/1:(\d+(\.\d+)?)/);
    const reward = rrMatch ? parseFloat(rrMatch[1]) : 2;

    if (st.includes("TP1") || (st === "CERRADA" && !st.includes("❌"))) {
      wins++; pnlR += Math.min(reward, 2);
    } else if (st.includes("TP2")) {
      wins++; pnlR += reward;
    } else if (st.includes("INVALID") || st.includes("❌")) {
      losses++; pnlR -= 1;
    }
  });
  const closed = wins + losses;
  const winRate = closed > 0 ? Math.round((wins / closed) * 100) : 0;
  return { wins, losses, closed, pnlR, winRate };
}

type SortKey = "date" | "asset" | "pnl" | "status";
type FilterDir = "ALL" | "LONG" | "SHORT";
type FilterStatus = "ALL" | "ACTIVA" | "TP1" | "TP2" | "INVALIDA";

export default function Leaderboard() {
  const [signals, setSignals]     = useState<Signal[]>([]);
  const [loading, setLoading]     = useState(true);
  const [sort, setSort]           = useState<SortKey>("date");
  const [sortAsc, setSortAsc]     = useState(false);
  const [filterDir, setFilterDir] = useState<FilterDir>("ALL");
  const [filterSt, setFilterSt]   = useState<FilterStatus>("ALL");

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/signals`);
      if (r.ok) {
        const d = await r.json() as { signals: Signal[] };
        setSignals(d.signals ?? []);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = signals.filter(s => {
    if (filterDir !== "ALL" && s.direction !== filterDir) return false;
    if (filterSt !== "ALL") {
      const st = s.status?.toUpperCase() ?? "";
      if (filterSt === "ACTIVA"  && !st.includes("ACTIVA"))   return false;
      if (filterSt === "TP1"     && !st.includes("TP1"))       return false;
      if (filterSt === "TP2"     && !st.includes("TP2"))       return false;
      if (filterSt === "INVALIDA"&& !st.includes("INVALID"))   return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sort === "date")   diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sort === "asset")  diff = a.asset.localeCompare(b.asset);
    if (sort === "status") diff = a.status.localeCompare(b.status);
    return sortAsc ? diff : -diff;
  });

  const stats = calcPnl(signals);
  const pnlPositive = stats.pnlR >= 0;

  const toggleSort = (key: SortKey) => {
    if (sort === key) setSortAsc(p => !p);
    else { setSort(key); setSortAsc(false); }
  };

  const statusBadge = (status: string) => {
    const st = status?.toUpperCase() ?? "";
    if (st.includes("TP2"))   return { color: "#00e676", bg: "#00e67615", label: "TP2 ✅" };
    if (st.includes("TP1"))   return { color: "#00e676", bg: "#00e67610", label: "TP1 ✅" };
    if (st.includes("ACTIVA"))return { color: "#ffd700", bg: "#ffd70015", label: "⏳ ACTIVA" };
    if (st.includes("INVALID"))return { color: "#ff1744", bg: "#ff174415", label: "❌ INVÁLIDA" };
    if (st.includes("CERRADA"))return { color: "#4a6070", bg: "#1a253510", label: "CERRADA" };
    return { color: "#4a6070", bg: "#1a253510", label: status };
  };

  const pnlForSignal = (s: Signal) => {
    const st = s.status?.toUpperCase() ?? "";
    const rrStr = s.rr ?? "1:2";
    const rrMatch = rrStr.match(/1:(\d+(\.\d+)?)/);
    const reward = rrMatch ? parseFloat(rrMatch[1]) : 2;
    if (st.includes("TP2"))   return { val: reward,          color: "#00e676", label: `+${reward.toFixed(1)}R` };
    if (st.includes("TP1"))   return { val: Math.min(reward,2), color: "#00e676", label: `+${Math.min(reward,2).toFixed(1)}R` };
    if (st.includes("INVALID"))return { val: -1,               color: "#ff1744", label: "-1.0R" };
    return { val: 0, color: "#4a6070", label: "—" };
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60)    return `${mins}m`;
    if (mins < 1440)  return `${Math.floor(mins / 60)}h`;
    return `${Math.floor(mins / 1440)}d`;
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      <div className="pt-28 pb-16 px-4 md:px-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-3">Registro</div>
          <h1 className="font-bebas text-5xl md:text-7xl leading-none mb-3">
            LEADERBOARD<br /><span className="text-[#00e5ff]">DE SEÑALES</span>
          </h1>
          <p className="font-space text-[12px] text-[#7ab3c8]">
            Historial completo de todas las señales — resultados transparentes, sin editar.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-[#1a2535] border border-[#1a2535] mb-6">
          {[
            { label: "TOTAL SEÑALES",  value: signals.length,          color: "#fff" },
            { label: "WINS ✅",         value: stats.wins,              color: "#00e676" },
            { label: "LOSSES ❌",       value: stats.losses,            color: "#ff1744" },
            { label: "WIN RATE",        value: `${stats.winRate}%`,     color: stats.winRate >= 60 ? "#00e676" : stats.winRate >= 40 ? "#ffd700" : "#ff1744" },
            {
              label: "PNL TOTAL",
              value: `${pnlPositive ? "+" : ""}${stats.pnlR.toFixed(1)}R`,
              color: pnlPositive ? "#00e676" : "#ff1744",
            },
          ].map((s, i) => (
            <div key={i} className="bg-[#060a0f] p-4 text-center">
              <div className="font-space text-[9px] text-[#5a8898] tracking-[0.1em] mb-1">{s.label}</div>
              <div className="font-mono font-black text-[22px]" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Win rate bar */}
        {stats.closed > 0 && (
          <div className="border border-[#1a2535] bg-[#060a0f] p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-space text-[10px] text-[#7ab3c8] tracking-[0.15em] uppercase">Distribución de resultados</span>
              <span className="font-space text-[11px] font-bold" style={{ color: stats.winRate >= 60 ? "#00e676" : "#ffd700" }}>
                {stats.winRate}% efectividad
              </span>
            </div>
            <div className="h-3 bg-[#0d1520] flex overflow-hidden border border-[#1a2535]">
              <div className="h-full bg-[#00e676] transition-all" style={{ width: `${stats.winRate}%` }} />
              <div className="h-full bg-[#ff1744] flex-1 transition-all" />
            </div>
            <div className="flex justify-between font-space text-[9px] text-[#5a8898] mt-1">
              <span>{stats.wins} wins</span>
              <span>{stats.losses} losses</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex border border-[#1a2535] overflow-hidden">
            {(["ALL", "LONG", "SHORT"] as FilterDir[]).map(d => (
              <button key={d} onClick={() => setFilterDir(d)}
                className="font-space text-[9px] tracking-[0.1em] px-3 py-1.5 transition-all"
                style={{
                  background: filterDir === d ? (d === "LONG" ? "#00e67618" : d === "SHORT" ? "#ff174418" : "#00e5ff18") : "transparent",
                  color: filterDir === d ? (d === "LONG" ? "#00e676" : d === "SHORT" ? "#ff1744" : "#00e5ff") : "#4a6070",
                  borderRight: "1px solid #1a2535",
                }}>
                {d}
              </button>
            ))}
          </div>
          <div className="flex border border-[#1a2535] overflow-hidden">
            {(["ALL", "ACTIVA", "TP1", "TP2", "INVALIDA"] as FilterStatus[]).map(s => (
              <button key={s} onClick={() => setFilterSt(s)}
                className="font-space text-[9px] tracking-[0.1em] px-3 py-1.5 transition-all"
                style={{
                  background: filterSt === s ? "#ffffff10" : "transparent",
                  color: filterSt === s ? "#fff" : "#4a6070",
                  borderRight: "1px solid #1a2535",
                }}>
                {s}
              </button>
            ))}
          </div>
          <div className="ml-auto font-space text-[10px] text-[#5a8898] self-center">
            {sorted.length} señales
          </div>
        </div>

        {/* Table */}
        <div className="border border-[#1a2535] bg-[#060a0f] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a2535] bg-[#080d14]">
                  {([
                    { key: "date",   label: "FECHA" },
                    { key: "asset",  label: "ACTIVO" },
                    { key: null,     label: "DIR" },
                    { key: null,     label: "ENTRADA" },
                    { key: null,     label: "TP1 / SL" },
                    { key: null,     label: "R/R" },
                    { key: "status", label: "STATUS" },
                    { key: "pnl",    label: "PNL" },
                  ] as { key: SortKey | null; label: string }[]).map((h, i) => (
                    <th key={i}
                      onClick={() => h.key && toggleSort(h.key)}
                      className={`font-space text-[9px] text-[#5a8898] tracking-[0.15em] px-4 py-3 text-left ${h.key ? "cursor-pointer hover:text-[#7ab3c8]" : ""}`}>
                      {h.label} {h.key === sort ? (sortAsc ? "↑" : "↓") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#1a2535]">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 bg-[#1a2535] rounded animate-pulse" style={{ width: `${[70, 60, 80][(i + j) % 3]}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : sorted.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center font-space text-[12px] text-[#5a8898]">
                    {signals.length === 0 ? "Aún no hay señales registradas" : "No hay señales con ese filtro"}
                  </td></tr>
                ) : sorted.map(s => {
                  const badge = statusBadge(s.status);
                  const pnl   = pnlForSignal(s);
                  const isLong = s.direction === "LONG";
                  return (
                    <tr key={s.id} className="border-b border-[#1a2535] hover:bg-[#0d1520] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono text-[11px] text-[#7ab3c8]">{timeAgo(s.createdAt)} atrás</div>
                        <div className="font-space text-[9px] text-[#5a8898]">
                          {new Date(s.createdAt).toLocaleDateString("es-EC", { day: "2-digit", month: "short" })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-space text-[13px] font-bold text-white">{s.asset}</div>
                        {s.leverage && <div className="font-space text-[9px] text-[#ffd700]">{s.leverage}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-space text-[10px] font-bold px-2 py-0.5 border"
                          style={{ color: isLong ? "#00e676" : "#ff1744", borderColor: (isLong ? "#00e676" : "#ff1744") + "44", background: (isLong ? "#00e676" : "#ff1744") + "15" }}>
                          {isLong ? "▲L" : "▼S"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-white">{s.entry}</td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-[11px] text-[#00e676]">TP {s.tp1}</div>
                        <div className="font-mono text-[11px] text-[#ff1744]">SL {s.sl}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-[#ffd700]">{s.rr ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="font-space text-[10px] px-2 py-0.5 border"
                          style={{ color: badge.color, borderColor: badge.color + "44", background: badge.bg }}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] font-bold" style={{ color: pnl.color }}>
                        {pnl.label}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {sorted.length > 0 && (
            <div className="border-t border-[#1a2535] px-4 py-3 flex justify-between items-center bg-[#080d14]">
              <span className="font-space text-[10px] text-[#5a8898]">
                Mostrando {sorted.length} de {signals.length} señales
              </span>
              {stats.closed > 0 && (
                <span className="font-space text-[10px]" style={{ color: pnlPositive ? "#00e676" : "#ff1744" }}>
                  PnL acumulado: {pnlPositive ? "+" : ""}{stats.pnlR.toFixed(1)}R ({stats.winRate}% WR)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 border border-[#1a2535] bg-[#060a0f] font-space text-[10px] text-[#5a8898] leading-relaxed">
          ⚠️ <strong className="text-[#7ab3c8]">Disclaimer:</strong> Las señales pasadas no garantizan resultados futuros. Este historial es para fines educativos y de transparencia. El trading de criptomonedas conlleva riesgo de pérdida total de capital. Siempre usá gestión de riesgo adecuada.
        </div>
      </div>
    </div>
  );
}
