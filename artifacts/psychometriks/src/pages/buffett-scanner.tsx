import React, { useState, useEffect, useCallback, useMemo } from "react";
import SiteNav from "@/components/site-nav";

// ─── Types ──────────────────────────────────────────────────────────────────
interface CriteriaCheck {
  label: string;
  display: string;
  target: string;
  pass: number;
}

interface Valuation {
  price: number;
  intrinsic: number;
  upside: number;
  zone: string;
  levels: {
    strong_buy: number;
    buy: number;
    fair: number;
    expensive: number;
    bubble: number;
  };
}

interface BuffettResult {
  ticker: string;
  name: string;
  price: number;
  market_cap: number;
  sector: string;
  country: string;
  score: number;
  passed_count: number;
  total_count: number;
  criteria: Record<string, CriteriaCheck>;
  valuation: Valuation | null;
  technical: Record<string, unknown> | null;
  polygon: Record<string, unknown> | null;
  raw: Record<string, number>;
  analyzed_at: string;
}

interface BuffettStatus {
  ok: boolean;
  scanning: boolean;
  universe_total: number;
  state: {
    last_index: number;
    last_run: string | null;
    calls_today: number;
    total_analyzed: number;
    total_passed: number;
    cycle: number;
    universe_size: number;
  } | null;
  stats: { n: string; avg_score: string } | null;
  top_today: { ticker: string; name: string; score: number; sector: string; valuation: { zone: string } }[];
  companies_today: number;
  error?: string;
}

const ZONE_COLOR: Record<string, string> = {
  "STRONG BUY": "#00e676",
  "BUY": "#7ed957",
  "FAIR": "#ffd700",
  "EXPENSIVE": "#ff9d00",
  "BUBBLE": "#ff3c5c",
};

function zoneColor(zone?: string): string {
  if (!zone) return "#7ab3c8";
  const key = Object.keys(ZONE_COLOR).find(k => zone.toUpperCase().includes(k));
  return key ? ZONE_COLOR[key]! : "#7ab3c8";
}

function scoreColor(score: number): string {
  if (score >= 80) return "#00e676";
  if (score >= 60) return "#7ed957";
  if (score >= 40) return "#ffd700";
  return "#ff6b6b";
}

const fmtCap = (n: number) => {
  if (!n) return "N/D";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
};

// ─── Component ──────────────────────────────────────────────────────────────
export default function BuffettScanner() {
  const [status, setStatus] = useState<BuffettStatus | null>(null);
  const [results, setResults] = useState<BuffettResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(0);
  const [sectorFilter, setSectorFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [selected, setSelected] = useState<BuffettResult | null>(null);
  const [scanMsg, setScanMsg] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("psyko_auth");
      const u = raw ? (JSON.parse(raw) as { user?: string }).user : null;
      setIsAdmin(u === "admin");
    } catch { /* silent */ }
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/buffett/status");
      const d = await r.json();
      setStatus(d as BuffettStatus);
    } catch { /* silent */ }
  }, []);

  const loadResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ min_score: String(minScore), limit: "200" });
      if (sectorFilter) params.set("sector", sectorFilter);
      if (zoneFilter) params.set("zone", zoneFilter);
      const r = await fetch(`/api/buffett/results?${params}`);
      const d = await r.json();
      if (d.ok) setResults(d.results as BuffettResult[]);
    } catch { /* silent */ }
    setLoading(false);
  }, [minScore, sectorFilter, zoneFilter]);

  useEffect(() => { loadStatus(); }, [loadStatus]);
  useEffect(() => { loadResults(); }, [loadResults]);

  // Poll status every 30s while a scan might be running
  useEffect(() => {
    const id = setInterval(loadStatus, 30000);
    return () => clearInterval(id);
  }, [loadStatus]);

  const sectors = useMemo(() => {
    const s = new Set(results.map(r => r.sector).filter(Boolean));
    return Array.from(s).sort();
  }, [results]);

  async function triggerScan() {
    setScanMsg("Iniciando...");
    try {
      const r = await fetch("/api/buffett/scan", { method: "POST" });
      const d = await r.json();
      setScanMsg(d.ok ? `Scan iniciado · universo ${d.universe} tickers` : d.error ?? "Error");
      setTimeout(loadStatus, 2000);
    } catch {
      setScanMsg("Error al iniciar scan");
    }
  }

  const pctCycle = status?.state
    ? Math.round((status.state.last_index / Math.max(status.universe_total, 1)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      <section className="pt-32 pb-10 px-6 md:px-12">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4 flex items-center gap-3">
          Fundamental Equities <div className="h-px bg-[#1a2535] flex-1 max-w-[80px]" />
        </div>
        <h1 className="font-bebas text-6xl md:text-8xl leading-none mb-3">
          WARREN <span className="text-[#00e5ff]">BUFFETT</span> SCANNER
        </h1>
        <p className="text-[#7ab3c8] font-space text-sm max-w-2xl leading-relaxed">
          Análisis fundamental estilo value-investing sobre {status?.universe_total ?? "—"} acciones (S&amp;P 500 + grandes tech + ADRs chinos).
          9 criterios de calidad (ROIC, P/E, P/B, márgenes, deuda...), valuación intrínseca (DCF + Graham + múltiplos) y análisis técnico para los mejores scores.
        </p>
      </section>

      {/* Status panel */}
      <section className="px-6 md:px-12 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Universo" value={String(status?.universe_total ?? "—")} />
          <StatCard label="Analizadas" value={String(status?.state?.total_analyzed ?? 0)} />
          <StatCard label="Pasaron ≥60" value={String(status?.state?.total_passed ?? 0)} color="#00e676" />
          <StatCard label="Ciclo actual" value={`#${status?.state?.cycle ?? 1} · ${pctCycle}%`} />
          <StatCard label="Calls hoy" value={`${status?.state?.calls_today ?? 0}/230`} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-space text-[#7ab3c8]">
          <span>
            {status?.scanning ? (
              <span className="text-[#00e676]">● Scan en curso ahora</span>
            ) : (
              <span>○ Sin scan activo · próximo lote disponible al ejecutarse el cron diario</span>
            )}
          </span>
          {isAdmin && (
            <button
              onClick={triggerScan}
              disabled={status?.scanning}
              className="border border-[#00e5ff44] px-3 py-1 text-[10px] uppercase tracking-wider hover:bg-[#00e5ff14] disabled:opacity-40"
            >
              Forzar scan manual
            </button>
          )}
          {scanMsg && <span className="text-[#ffd700]">{scanMsg}</span>}
        </div>
      </section>

      {/* Filters */}
      <section className="px-6 md:px-12 mb-4 flex flex-wrap gap-3">
        <select
          value={minScore}
          onChange={e => setMinScore(Number(e.target.value))}
          className="bg-[#0a0f1a] border border-[#1a2535] text-[12px] font-space px-3 py-2"
        >
          <option value={0}>Score mínimo: todos</option>
          <option value={40}>Score ≥ 40</option>
          <option value={60}>Score ≥ 60</option>
          <option value={80}>Score ≥ 80</option>
        </select>
        <select
          value={sectorFilter}
          onChange={e => setSectorFilter(e.target.value)}
          className="bg-[#0a0f1a] border border-[#1a2535] text-[12px] font-space px-3 py-2"
        >
          <option value="">Todos los sectores</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={zoneFilter}
          onChange={e => setZoneFilter(e.target.value)}
          className="bg-[#0a0f1a] border border-[#1a2535] text-[12px] font-space px-3 py-2"
        >
          <option value="">Todas las zonas</option>
          <option value="strong buy">Strong Buy</option>
          <option value="buy">Buy</option>
          <option value="fair">Fair</option>
          <option value="expensive">Expensive</option>
          <option value="bubble">Bubble</option>
        </select>
      </section>

      {/* Results table */}
      <section className="px-6 md:px-12 pb-24">
        {loading ? (
          <div className="text-[#7ab3c8] font-space text-sm py-10 text-center">Cargando resultados...</div>
        ) : results.length === 0 ? (
          <div className="text-[#7ab3c8] font-space text-sm py-10 text-center">
            Sin resultados todavía. El escaneo cubre el universo gradualmente (límite de la API gratuita de datos).
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#1a2535]">
            <table className="w-full text-[12px] font-space">
              <thead>
                <tr className="bg-[#0a0f1a] text-[#7ab3c8] text-left">
                  <th className="p-3">Ticker</th>
                  <th className="p-3">Empresa</th>
                  <th className="p-3">Sector</th>
                  <th className="p-3 text-right">Precio</th>
                  <th className="p-3 text-right">Mkt Cap</th>
                  <th className="p-3 text-right">Score</th>
                  <th className="p-3 text-right">Upside</th>
                  <th className="p-3">Zona</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr
                    key={r.ticker}
                    onClick={() => setSelected(r)}
                    className="border-t border-[#1a2535] hover:bg-[#00e5ff0a] cursor-pointer"
                  >
                    <td className="p-3 font-bold">{r.ticker}</td>
                    <td className="p-3 text-[#c8d8e8]">{r.name}</td>
                    <td className="p-3 text-[#7ab3c8]">{r.sector}</td>
                    <td className="p-3 text-right">${r.price?.toFixed(2)}</td>
                    <td className="p-3 text-right">{fmtCap(r.market_cap)}</td>
                    <td className="p-3 text-right font-bold" style={{ color: scoreColor(r.score) }}>{r.score}</td>
                    <td className="p-3 text-right">
                      {r.valuation ? `${r.valuation.upside > 0 ? "+" : ""}${r.valuation.upside}%` : "—"}
                    </td>
                    <td className="p-3">
                      {r.valuation && (
                        <span style={{ color: zoneColor(r.valuation.zone) }}>{r.valuation.zone}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[#060a12] border border-[#1a2535] max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-bebas text-3xl">{selected.ticker}</h2>
                <p className="text-[#7ab3c8] font-space text-xs">{selected.name} · {selected.sector}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#7ab3c8] text-xl">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <StatCard label="Precio" value={`$${selected.price?.toFixed(2)}`} />
              <StatCard label="Score" value={String(selected.score)} color={scoreColor(selected.score)} />
              <StatCard label="Mkt Cap" value={fmtCap(selected.market_cap)} />
            </div>

            <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.2em] uppercase mb-2">Criterios Buffett ({selected.passed_count ?? 0}/{selected.total_count ?? 9})</div>
            <div className="space-y-1 mb-5">
              {Object.values(selected.criteria ?? {}).map((c, i) => (
                <div key={i} className="flex justify-between text-[12px] font-space border-b border-[#1a2535] py-1.5">
                  <span className="text-[#c8d8e8]">{c.label}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-[#7ab3c8]">{c.display} ({c.target})</span>
                    <span style={{ color: c.pass ? "#00e676" : "#ff6b6b" }}>{c.pass ? "✓" : "✕"}</span>
                  </span>
                </div>
              ))}
            </div>

            {selected.valuation && (
              <>
                <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.2em] uppercase mb-2">Valuación Intrínseca</div>
                <div className="grid grid-cols-2 gap-3 mb-5 text-[12px] font-space">
                  <div className="flex justify-between border-b border-[#1a2535] py-1.5">
                    <span className="text-[#7ab3c8]">Valor Intrínseco</span>
                    <span>${selected.valuation.intrinsic}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1a2535] py-1.5">
                    <span className="text-[#7ab3c8]">Upside</span>
                    <span style={{ color: selected.valuation.upside > 0 ? "#00e676" : "#ff6b6b" }}>
                      {selected.valuation.upside > 0 ? "+" : ""}{selected.valuation.upside}%
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#1a2535] py-1.5">
                    <span className="text-[#7ab3c8]">Zona</span>
                    <span style={{ color: zoneColor(selected.valuation.zone) }}>{selected.valuation.zone}</span>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1 text-center text-[10px] font-space mb-5">
                  {Object.entries(selected.valuation.levels).map(([k, v]) => (
                    <div key={k} className="border border-[#1a2535] p-1.5">
                      <div className="text-[#7ab3c8] uppercase">{k.replace("_", " ")}</div>
                      <div>${v}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selected.raw && (
              <>
                <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.2em] uppercase mb-2">Métricas Crudas</div>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-space text-[#7ab3c8]">
                  <div>ROIC: {selected.raw.roic?.toFixed(1)}%</div>
                  <div>P/E: {selected.raw.pe?.toFixed(1)}</div>
                  <div>P/B: {selected.raw.pb?.toFixed(1)}</div>
                  <div>P/FCF: {selected.raw.pfcf?.toFixed(1)}</div>
                  <div>PEG: {selected.raw.peg?.toFixed(1)}</div>
                  <div>Margen Bruto: {selected.raw.gm?.toFixed(1)}%</div>
                  <div>Deuda/Equity: {selected.raw.de?.toFixed(2)}</div>
                  <div>Margen Neto: {selected.raw.nm?.toFixed(1)}%</div>
                  <div>Años EPS+: {selected.raw.eps_yrs}</div>
                </div>
              </>
            )}

            <p className="text-[#5a6a80] font-space text-[10px] mt-5">
              ⚠️ Análisis informativo basado en datos fundamentales públicos. No constituye asesoría financiera.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="border border-[#1a2535] bg-[#0a0f1a] p-3">
      <div className="text-[9px] font-space text-[#7ab3c8] uppercase tracking-wider mb-1">{label}</div>
      <div className="font-bebas text-2xl" style={{ color: color ?? "#fff" }}>{value}</div>
    </div>
  );
}
