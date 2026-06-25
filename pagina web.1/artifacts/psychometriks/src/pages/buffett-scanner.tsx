import React, { useState, useEffect, useCallback } from "react";
import SiteNav from "@/components/site-nav";

// ─── Auth ─────────────────────────────────────────────────────────────────────
function getAuth() {
  try {
    const r = localStorage.getItem("psyko_auth");
    if (!r) return null;
    const s = JSON.parse(r) as { role?: string; plan?: string; ts?: number; user?: string };
    if (Date.now() - (s.ts ?? 0) > 28_800_000) return null;
    return s;
  } catch { return null; }
}
function isAdmin(auth: ReturnType<typeof getAuth>) {
  if (!auth) return false;
  return auth.role === "superadmin" || auth.role === "operator";
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface BuffettResult {
  ticker: string;
  name: string;
  sector: string;
  score: number;
  valuation: string | { zone?: string; label?: string };
  price: number;
  dcf_value?: number;
  margin_safety?: number;
  roic?: number;
  pe?: number;
  pb?: number;
  gross_margin?: number;
  debt_equity?: number;
  net_margin?: number;
  rsi?: number;
  macd_signal?: string;
  ema_trend?: string;
  updated_at?: string;
}

interface BuffettStatus {
  ok: boolean;
  scanning: boolean;
  universe_total: number;
  state?: {
    last_index?: number;
    last_run?: string;
    calls_today?: number;
    total_analyzed?: number;
    total_passed?: number;
    cycle?: number;
  };
  stats?: { n: string; avg_score: string };
  top_today?: BuffettResult[];
  companies_today?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtScore(score: number) {
  if (score >= 80) return { label: "STRONG BUY", color: "#00e676", bg: "rgba(0,230,118,.15)" };
  if (score >= 65) return { label: "BUY", color: "#00e5ff", bg: "rgba(0,229,255,.12)" };
  if (score >= 50) return { label: "HOLD", color: "#ffd700", bg: "rgba(255,215,0,.1)" };
  return { label: "AVOID", color: "#ff4444", bg: "rgba(255,68,68,.1)" };
}

function getZoneLabel(val: BuffettResult["valuation"]) {
  if (!val) return "─";
  if (typeof val === "string") return val;
  return val.label ?? val.zone ?? "─";
}

function fmtPct(n?: number) {
  if (n === undefined || n === null) return "─";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function fmtNum(n?: number, decimals = 1) {
  if (n === undefined || n === null) return "─";
  return n.toFixed(decimals);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BuffettScanner() {
  const auth = getAuth();
  const admin = isAdmin(auth);

  const [status, setStatus]       = useState<BuffettStatus | null>(null);
  const [results, setResults]     = useState<BuffettResult[]>([]);
  const [loading, setLoading]     = useState(true);
  const [scanning, setScanning]   = useState(false);
  const [scanMsg, setScanMsg]     = useState("");
  const [minScore, setMinScore]   = useState(0);
  const [sectorF, setSectorF]     = useState("all");
  const [sortBy, setSortBy]       = useState<"score"|"pe"|"roic"|"margin">("score");
  const [expanded, setExpanded]   = useState<string | null>(null);

  const sectors = ["all", ...Array.from(new Set(results.map(r => r.sector).filter(Boolean)))];

  const loadData = useCallback(async () => {
    try {
      const [stRes, rsRes] = await Promise.allSettled([
        fetch("/api/buffett/status").then(r => r.json()) as Promise<BuffettStatus>,
        fetch(`/api/buffett/results?min_score=${minScore}&limit=200`).then(r => r.json()) as Promise<{ ok: boolean; results: BuffettResult[] }>,
      ]);
      if (stRes.status === "fulfilled" && stRes.value.ok) setStatus(stRes.value);
      if (rsRes.status === "fulfilled" && rsRes.value.ok) setResults(rsRes.value.results ?? []);
    } catch { /* skip */ }
    finally { setLoading(false); }
  }, [minScore]);

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 30_000);
    return () => clearInterval(id);
  }, [loadData]);

  // Poll while scanning
  useEffect(() => {
    if (!scanning) return;
    const id = setInterval(async () => {
      const r = await fetch("/api/buffett/status").then(x => x.json()).catch(() => null);
      if (r?.ok) {
        setStatus(r);
        if (!r.scanning) { setScanning(false); setScanMsg("✅ Scan completado"); loadData(); }
      }
    }, 3000);
    return () => clearInterval(id);
  }, [scanning, loadData]);

  const startScan = async () => {
    if (scanning) return;
    setScanMsg("");
    try {
      const r = await fetch("/api/buffett/scan", { method: "POST" }).then(x => x.json());
      if (r.ok) { setScanning(true); setScanMsg(`⚡ Escaneando ${r.universe} tickers…`); }
      else setScanMsg(`❌ ${r.error ?? "Error al iniciar scan"}`);
    } catch { setScanMsg("❌ Error de red"); }
  };

  const filtered = results
    .filter(r => sectorF === "all" || r.sector === sectorF)
    .sort((a, b) => {
      if (sortBy === "score")  return b.score - a.score;
      if (sortBy === "pe")     return (a.pe ?? 999) - (b.pe ?? 999);
      if (sortBy === "roic")   return (b.roic ?? 0) - (a.roic ?? 0);
      if (sortBy === "margin") return (b.gross_margin ?? 0) - (a.gross_margin ?? 0);
      return 0;
    });

  const st = status?.state;
  const analyzed = Number(st?.total_analyzed ?? 0);
  const passed   = Number(st?.total_passed ?? 0);
  const cycle    = Number(st?.cycle ?? 1);
  const pct      = status?.universe_total ? Math.round(analyzed / status.universe_total * 100) : 0;

  return (
    <div className="min-h-screen bg-[#020b12] text-white">
      <SiteNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">

        {/* ── HEADER ── */}
        <div className="mb-8">
          <button onClick={() => window.history.back()}
            className="font-sharetech text-[8px] tracking-[0.15em] text-[#7ab3c8] hover:text-[#00e5ff] transition-colors mb-4 flex items-center gap-1.5">
            ← VOLVER
          </button>
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-3">
            PSYCHOMETRIKS · VALUE INVESTING INTELLIGENCE
          </div>
          <h1 className="font-bebas text-5xl md:text-7xl leading-none text-white mb-2">
            WARREN <span className="text-[#ffd700]">BUFFETT</span> SCANNER
          </h1>
          <p className="font-space text-[11px] text-[#7ab3c8] max-w-2xl">
            Análisis fundamental estilo value-investing sobre ~230 acciones (S&P 500 + grandes tech + ADRs chinos).
            9 criterios de calidad (ROIC, P/E, P/B, márgenes, deuda…), valuación intrínseca (DCF + Graham + múltiplos)
            y análisis técnico para los mejores scores.
          </p>
        </div>

        {/* ── STATUS CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: "UNIVERSO",      value: status?.universe_total ?? "─", color: "#00e5ff" },
            { label: "ANALIZADAS",    value: analyzed || "0",               color: "#00e676" },
            { label: "PASARON 260",   value: passed   || "0",               color: "#ffd700" },
            { label: "CICLO ACTUAL",  value: `#${cycle} · ${pct}%`,         color: "#e040fb" },
            { label: "CALLS HOY",     value: `${st?.calls_today ?? 0}/${status?.universe_total ? Math.floor((status.universe_total || 230) * 5 * 0.2) : "─"}`, color: "#7ab3c8" },
          ].map(c => (
            <div key={c.label} className="border border-[#0d2030] bg-[#040f18] p-4">
              <div className="font-sharetech text-[7px] tracking-[0.12em] text-[#5a8898] mb-2">{c.label}</div>
              <div className="font-bebas text-2xl md:text-3xl leading-none" style={{ color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* ── SCAN BUTTON + CONTROLS ── */}
        <div className="border border-[#0d2030] bg-[#040f18] p-5 mb-6">
          <div className="flex flex-wrap items-center gap-4">

            {/* Scan button — admin only */}
            {admin ? (
              <button
                onClick={startScan}
                disabled={scanning || status?.scanning}
                className="font-sharetech text-[9px] tracking-[0.15em] px-6 py-3 border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: scanning || status?.scanning ? "#ffd700" : "#00e676",
                  color:       scanning || status?.scanning ? "#ffd700" : "#00e676",
                  background:  scanning || status?.scanning ? "rgba(255,215,0,.08)" : "rgba(0,230,118,.08)",
                  boxShadow:   scanning || status?.scanning ? "0 0 20px rgba(255,215,0,.2)" : "none",
                }}>
                {scanning || status?.scanning ? "⏳ ESCANEANDO…" : "⚡ FORZAR SCAN MANUAL"}
              </button>
            ) : (
              <div className="font-sharetech text-[8px] text-[#5a8898] border border-[#0d2030] px-4 py-3">
                🔒 Scan manual — solo admin
              </div>
            )}

            {/* Status message */}
            {(scanMsg || status?.scanning) && (
              <div className="font-sharetech text-[8px] tracking-[0.1em]"
                style={{ color: scanMsg.startsWith("❌") ? "#ff4444" : "#00e676" }}>
                {scanMsg || "⚡ Scan en curso — actualizando cada 3s…"}
              </div>
            )}

            {/* Progress bar when scanning */}
            {(scanning || status?.scanning) && (
              <div className="flex-1 min-w-32">
                <div className="h-1.5 bg-[#0d2030] w-full overflow-hidden">
                  <div className="h-full bg-[#ffd700] animate-pulse" style={{ width: `${pct}%` }} />
                </div>
                <div className="font-sharetech text-[6px] text-[#5a8898] mt-1">
                  {pct}% completado · {analyzed} tickers procesados
                </div>
              </div>
            )}

            <div className="ml-auto text-right">
              <div className="font-sharetech text-[7px] text-[#5a8898]">
                {st?.last_run ? `Último scan: ${st.last_run}` : "Sin scan activo — próximo lote al ejecutarse el cron diario"}
              </div>
            </div>
          </div>

          {/* 3 ENTRY ZONES — Buffett style */}
          {filtered.length > 0 && (
            <div className="mt-5 pt-4 border-t border-[#0d2030]">
              <div className="font-sharetech text-[8px] tracking-[0.15em] text-[#ffd700] mb-3">
                🎯 3 ZONAS DE ENTRADA BUFFETT — BASADAS EN MARGEN DE SEGURIDAD
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    zone: "🟢 ZONA 1 — IDEAL",
                    desc: "Margen seguridad ≥30% · Score ≥80 · ROIC ≥15%",
                    color: "#00e676",
                    filter: (r: BuffettResult) => (r.margin_safety ?? 0) >= 30 && r.score >= 80,
                  },
                  {
                    zone: "🟡 ZONA 2 — ACEPTABLE",
                    desc: "Margen seguridad ≥15% · Score ≥65 · ROIC ≥10%",
                    color: "#ffd700",
                    filter: (r: BuffettResult) => (r.margin_safety ?? 0) >= 15 && r.score >= 65 && (r.margin_safety ?? 0) < 30,
                  },
                  {
                    zone: "🔵 ZONA 3 — ESPERAR",
                    desc: "Fundamentals OK pero precio justo — esperar corrección",
                    color: "#00e5ff",
                    filter: (r: BuffettResult) => r.score >= 50 && (r.margin_safety ?? 100) < 15,
                  },
                ].map(z => {
                  const count = results.filter(z.filter).length;
                  const top3  = results.filter(z.filter).sort((a, b) => b.score - a.score).slice(0, 3);
                  return (
                    <div key={z.zone} className="border p-3" style={{ borderColor: `${z.color}30`, background: `${z.color}06` }}>
                      <div className="font-sharetech text-[8px] tracking-[0.1em] mb-1" style={{ color: z.color }}>{z.zone}</div>
                      <div className="font-space text-[7px] text-[#5a8898] mb-2">{z.desc}</div>
                      <div className="font-bebas text-2xl mb-2" style={{ color: z.color }}>{count} acciones</div>
                      {top3.length > 0 ? (
                        <div className="flex gap-1.5 flex-wrap">
                          {top3.map(r => (
                            <span key={r.ticker} className="font-sharetech text-[7px] px-2 py-0.5 border"
                              style={{ borderColor: `${z.color}40`, color: z.color, background: `${z.color}10` }}>
                              {r.ticker}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="font-sharetech text-[7px] text-[#5a8898]">Sin resultados aún</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── FILTERS ── */}
        <div className="flex flex-wrap gap-3 mb-5">
          {/* Score filter */}
          <div className="flex items-center gap-2">
            <span className="font-sharetech text-[7px] text-[#5a8898] tracking-[0.1em]">SCORE MÍNIMO:</span>
            <select value={minScore} onChange={e => setMinScore(+e.target.value)}
              className="font-sharetech text-[8px] bg-[#040f18] border border-[#0d2030] text-[#7ab3c8] px-3 py-1.5 outline-none">
              {[0, 40, 50, 60, 70, 80].map(v => (
                <option key={v} value={v}>{v === 0 ? "todos" : `≥ ${v}`}</option>
              ))}
            </select>
          </div>

          {/* Sector filter */}
          <div className="flex items-center gap-2">
            <span className="font-sharetech text-[7px] text-[#5a8898] tracking-[0.1em]">SECTOR:</span>
            <select value={sectorF} onChange={e => setSectorF(e.target.value)}
              className="font-sharetech text-[8px] bg-[#040f18] border border-[#0d2030] text-[#7ab3c8] px-3 py-1.5 outline-none">
              {sectors.map(s => <option key={s} value={s}>{s === "all" ? "Todos los sectores" : s}</option>)}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="font-sharetech text-[7px] text-[#5a8898] tracking-[0.1em]">ORDENAR:</span>
            {(["score", "pe", "roic", "margin"] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className="font-sharetech text-[7px] px-2.5 py-1 border transition-all"
                style={{
                  borderColor: sortBy === s ? "#ffd700" : "#0d2030",
                  color: sortBy === s ? "#ffd700" : "#7ab3c8",
                  background: sortBy === s ? "rgba(255,215,0,.08)" : "transparent",
                }}>
                {s === "score" ? "Score" : s === "pe" ? "P/E" : s === "roic" ? "ROIC" : "Margen"}
              </button>
            ))}
          </div>

          <div className="ml-auto font-sharetech text-[8px] text-[#5a8898]">
            {filtered.length} resultados
          </div>
        </div>

        {/* ── RESULTS TABLE ── */}
        {loading ? (
          <div className="p-12 text-center font-sharetech text-[10px] text-[#7ab3c8] animate-pulse tracking-[0.2em]">
            CARGANDO SCANNER…
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-[#0d2030] bg-[#040f18] p-12 text-center">
            <div className="font-bebas text-4xl text-[#7ab3c8] mb-3">SIN RESULTADOS TODAVÍA</div>
            <div className="font-space text-[11px] text-[#5a8898] max-w-md mx-auto mb-4">
              El escaneo cubre el universo gradualmente (límite de la API gratuita de datos).
              {admin && " Usa el botón ⚡ FORZAR SCAN MANUAL para analizar el siguiente lote."}
            </div>
            {admin && (
              <button onClick={startScan} disabled={scanning}
                className="font-sharetech text-[9px] tracking-[0.15em] px-6 py-3 border-2 border-[#00e676] text-[#00e676] bg-[rgba(0,230,118,.08)] hover:bg-[rgba(0,230,118,.15)] transition-all disabled:opacity-50">
                ⚡ INICIAR PRIMER SCAN
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2 font-sharetech text-[7px] tracking-[0.1em] text-[#5a8898] border-b border-[#0d2030]">
              <div>EMPRESA</div>
              <div className="text-center">SCORE</div>
              <div className="text-center">SEÑAL</div>
              <div className="text-center">PRECIO</div>
              <div className="text-center">P/E</div>
              <div className="text-center">ROIC</div>
              <div className="text-center">MARGEN %</div>
              <div className="text-center">RSI</div>
            </div>

            {filtered.map(r => {
              const sig = fmtScore(r.score);
              const isExp = expanded === r.ticker;
              const rsi = r.rsi ?? 0;
              const rsiColor = rsi > 70 ? "#ff4444" : rsi < 30 ? "#00e676" : "#7ab3c8";

              return (
                <div key={r.ticker}>
                  {/* Row */}
                  <div
                    className="border border-[#0d2030] hover:border-[#1a3040] bg-[#040f18] hover:bg-[#060f1a] cursor-pointer transition-all"
                    onClick={() => setExpanded(isExp ? null : r.ticker)}
                    style={{ borderColor: isExp ? `${sig.color}40` : undefined }}>
                    <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 items-center">

                      {/* Company */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bebas text-xl" style={{ color: sig.color }}>{r.ticker}</span>
                          <span className="font-sharetech text-[7px] text-[#5a8898] hidden md:inline">{r.sector}</span>
                        </div>
                        <div className="font-space text-[8px] text-[#7ab3c8] truncate">{r.name}</div>
                      </div>

                      {/* Score */}
                      <div className="text-center">
                        <div className="font-bebas text-2xl" style={{ color: sig.color }}>{r.score.toFixed(0)}</div>
                        <div className="h-1 bg-[#0d2030] mt-1 mx-auto w-16 overflow-hidden">
                          <div className="h-full" style={{ width: `${r.score}%`, background: sig.color }} />
                        </div>
                      </div>

                      {/* Signal */}
                      <div className="text-center">
                        <span className="font-sharetech text-[7px] px-2 py-1 border"
                          style={{ borderColor: `${sig.color}50`, color: sig.color, background: sig.bg }}>
                          {sig.label}
                        </span>
                      </div>

                      {/* Price */}
                      <div className="text-center font-space text-[10px] text-white">
                        {r.price ? `$${r.price.toFixed(2)}` : "─"}
                        {r.dcf_value && (
                          <div className="font-sharetech text-[6px] text-[#5a8898]">
                            DCF ${r.dcf_value.toFixed(0)}
                          </div>
                        )}
                      </div>

                      {/* P/E */}
                      <div className="text-center font-space text-[10px]"
                        style={{ color: (r.pe ?? 0) < 20 ? "#00e676" : (r.pe ?? 0) > 30 ? "#ff6b6b" : "#ffd700" }}>
                        {fmtNum(r.pe, 1)}x
                      </div>

                      {/* ROIC */}
                      <div className="text-center font-space text-[10px]"
                        style={{ color: (r.roic ?? 0) >= 15 ? "#00e676" : (r.roic ?? 0) >= 10 ? "#ffd700" : "#ff6b6b" }}>
                        {fmtNum(r.roic)}%
                      </div>

                      {/* Gross Margin */}
                      <div className="text-center font-space text-[10px]"
                        style={{ color: (r.gross_margin ?? 0) >= 50 ? "#00e676" : (r.gross_margin ?? 0) >= 30 ? "#ffd700" : "#ff6b6b" }}>
                        {fmtNum(r.gross_margin)}%
                      </div>

                      {/* RSI */}
                      <div className="text-center font-space text-[10px]" style={{ color: rsiColor }}>
                        {fmtNum(r.rsi, 0)}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExp && (
                      <div className="border-t border-[#0d2030] px-4 py-4"
                        style={{ background: `${sig.color}04` }}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {[
                            { label: "MARGEN SEGURIDAD", value: fmtPct(r.margin_safety), color: (r.margin_safety ?? 0) >= 30 ? "#00e676" : (r.margin_safety ?? 0) >= 15 ? "#ffd700" : "#ff6b6b" },
                            { label: "P/B RATIO",        value: fmtNum(r.pb, 2) + "x",    color: (r.pb ?? 0) < 2 ? "#00e676" : "#ffd700" },
                            { label: "NET MARGIN",       value: fmtNum(r.net_margin) + "%", color: (r.net_margin ?? 0) >= 10 ? "#00e676" : "#ffd700" },
                            { label: "DEUDA/EQUITY",     value: fmtNum(r.debt_equity, 2),  color: (r.debt_equity ?? 99) < 0.5 ? "#00e676" : (r.debt_equity ?? 99) < 1 ? "#ffd700" : "#ff6b6b" },
                            { label: "MACD",             value: r.macd_signal ?? "─",       color: r.macd_signal === "bullish" ? "#00e676" : r.macd_signal === "bearish" ? "#ff4444" : "#ffd700" },
                            { label: "EMA TREND",        value: r.ema_trend ?? "─",         color: r.ema_trend === "bullish" ? "#00e676" : r.ema_trend === "bearish" ? "#ff4444" : "#ffd700" },
                            { label: "VALUACIÓN",        value: getZoneLabel(r.valuation),  color: sig.color },
                            { label: "SECTOR",           value: r.sector ?? "─",            color: "#7ab3c8" },
                          ].map(s => (
                            <div key={s.label} className="bg-[#020b12] border border-[#0d2030] p-3">
                              <div className="font-sharetech text-[6px] text-[#5a8898] tracking-[0.08em] mb-1">{s.label}</div>
                              <div className="font-space text-[10px] font-bold" style={{ color: s.color }}>{s.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Buffett entry zones analysis */}
                        <div className="border border-[#0d2030] p-3 bg-[#020b12]">
                          <div className="font-sharetech text-[7px] tracking-[0.1em] text-[#ffd700] mb-2">🎯 ANÁLISIS ZONA DE ENTRADA</div>
                          <div className="font-space text-[9px] text-[#7ab3c8] leading-relaxed">
                            {(r.margin_safety ?? 0) >= 30
                              ? `✅ ZONA 1 IDEAL — ${r.ticker} cotiza con ${fmtPct(r.margin_safety)} de descuento al valor intrínseco. Criterios Buffett ampliamente superados. Compra escalonada recomendada.`
                              : (r.margin_safety ?? 0) >= 15
                              ? `🟡 ZONA 2 ACEPTABLE — ${r.ticker} ofrece ${fmtPct(r.margin_safety)} de margen de seguridad. Buena oportunidad pero esperar posible mejora.`
                              : `🔵 ZONA 3 ESPERAR — ${r.ticker} tiene fundamentals sólidos (Score ${r.score.toFixed(0)}/100) pero el precio actual no ofrece suficiente margen de seguridad. Poner en watchlist.`
                            }
                          </div>
                        </div>

                        {r.updated_at && (
                          <div className="mt-2 font-sharetech text-[6px] text-[#3a4a5a] text-right">
                            Analizado: {new Date(r.updated_at).toLocaleDateString("es-EC")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 font-sharetech text-[7px] text-[#3a4a5a] text-center tracking-[0.1em]">
          PSYCHOMETRIKS BUFFETT SCANNER — SOLO EDUCATIVO — NO ES ASESORÍA FINANCIERA — SIEMPRE HACER PROPIA INVESTIGACIÓN
        </div>

      </div>
    </div>
  );
}
