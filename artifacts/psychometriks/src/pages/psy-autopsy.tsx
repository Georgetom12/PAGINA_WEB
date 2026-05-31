import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/site-nav";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TradeForm {
  pair: string;
  direction: "LONG" | "SHORT";
  entry: string;
  sl: string;
  tp: string;
  exchange: string;
  datetime: string;
  timeframe: string;
  leverage: string;
  result: string;
  notes: string;
}

interface AutopsyRecord {
  id: string;
  date: string;
  pair: string;
  direction: "LONG" | "SHORT";
  entry: string;
  sl?: string;
  result?: string;
  analysis: string;
  mode: "autopsy" | "simulator";
  errorTags: string[];
  psyScoreAtTime: number;
}

const EMPTY: TradeForm = {
  pair: "", direction: "LONG", entry: "", sl: "", tp: "",
  exchange: "", datetime: "", timeframe: "", leverage: "", result: "", notes: "",
};

const STORAGE_KEY = "psy_autopsy_history";

// ─── LocalStorage helpers ─────────────────────────────────────────────────────
function loadHistory(): AutopsyRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch { return []; }
}

function saveRecord(record: AutopsyRecord) {
  const history = loadHistory();
  history.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 100)));
}

// ─── Error tag extractor ──────────────────────────────────────────────────────
function extractErrorTags(analysis: string): string[] {
  const lower = analysis.toLowerCase();
  const tags: string[] = [];
  if (lower.includes("fomo") || lower.includes("perseguiste") || lower.includes("tarde")) tags.push("FOMO");
  if (lower.includes("sin stop") || lower.includes("sin sl") || lower.includes("no tenías stop") || lower.includes("sin gestión de riesgo")) tags.push("SIN_SL");
  if (lower.includes("utad")) tags.push("UTAD");
  if (lower.includes("revenge") || lower.includes("revancha")) tags.push("REVENGE");
  if (lower.includes("sobreextendido") || lower.includes("apalancamiento") || lower.includes("overleveraged")) tags.push("OVERLEVERAGED");
  if (lower.includes("psicológic")) tags.push("PSICOLÓGICO");
  if (lower.includes("técnic")) tags.push("TÉCNICO");
  if (lower.includes("macro")) tags.push("MACRO");
  if (lower.includes("wyckoff") || lower.includes("spring") || lower.includes("lpsy")) tags.push("WYCKOFF");
  if (lower.includes("cvd") || lower.includes("divergencia")) tags.push("CVD");
  return tags;
}

// ─── PSY Score calculator ─────────────────────────────────────────────────────
function computePsyScore(history: AutopsyRecord[]): number {
  if (history.length === 0) return 60;
  let score = 60;
  // Journaling bonus: up to +20 for 10 autopsias
  score += Math.min(history.length * 2, 20);
  // Simulator bonus
  const simulatorCount = history.filter(r => r.mode === "simulator").length;
  score += Math.min(simulatorCount * 5, 15);
  // Error penalties
  for (const r of history.slice(0, 20)) {
    if (r.errorTags.includes("FOMO")) score -= 5;
    if (r.errorTags.includes("SIN_SL")) score -= 8;
    if (r.errorTags.includes("UTAD")) score -= 4;
    if (r.errorTags.includes("REVENGE")) score -= 6;
    if (r.errorTags.includes("OVERLEVERAGED")) score -= 3;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreColor(score: number): string {
  if (score >= 75) return "#00e676";
  if (score >= 50) return "#ffd700";
  if (score >= 30) return "#ff6d00";
  return "#ff1744";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "DISCIPLINADO";
  if (score >= 65) return "EN PROGRESO";
  if (score >= 45) return "INCONSISTENTE";
  if (score >= 25) return "EN RIESGO";
  return "CRÍTICO";
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
function AutopsyText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return <div key={i} className="font-space text-[12px] font-bold text-[#00e5ff] mt-4 mb-1 tracking-wide">{line.replace(/\*\*/g, "")}</div>;
        }
        if (line.includes("**")) {
          const parts = line.split(/\*\*([^*]+)\*\*/g);
          return (
            <div key={i} className="font-space text-[12px] text-[#8a9ab0] leading-relaxed">
              {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-[#e0f4ff]">{part}</strong> : part)}
            </div>
          );
        }
        if (line.startsWith("━")) return <div key={i} className="border-t border-[#1a2535] my-3" />;
        if (line.startsWith("*") && line.endsWith("*")) return <div key={i} className="font-space text-[10px] text-[#5a8898] italic mt-2">{line.replace(/\*/g, "")}</div>;
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return <div key={i} className="font-space text-[12px] text-[#8a9ab0] leading-relaxed">{line}</div>;
      })}
    </div>
  );
}

// ─── Scan animation ───────────────────────────────────────────────────────────
function ScanAnimation({ mode }: { mode: "autopsy" | "simulator" }) {
  const [tick, setTick] = useState(0);
  const stepsAutopsy = ["Cargando datos históricos del par...", "Analizando fase Wyckoff...", "Calculando CVD y divergencias...", "Detectando Whale Flow...", "Cruzando Funding Rate y OI...", "Estimando PSY-ULT1 Score...", "Redactando veredicto forense..."];
  const stepsSimulator = ["Cargando contexto de mercado...", "Evaluando condiciones de entrada...", "Analizando riesgo/recompensa...", "Verificando PSY-ULT1 Score actual...", "Detectando trampas potenciales...", "Calculando probabilidad de éxito...", "Generando dictamen PSY..."];
  const steps = mode === "autopsy" ? stepsAutopsy : stepsSimulator;
  const color = mode === "autopsy" ? "#ff1744" : "#ffd700";
  useEffect(() => {
    const t = setInterval(() => setTick(n => (n + 1) % steps.length), 900);
    return () => clearInterval(t);
  }, [steps.length]);
  return (
    <div className="flex flex-col items-center py-12">
      <div className="relative w-20 h-20 mb-6">
        <svg viewBox="0 0 80 80" className="w-full h-full animate-spin" style={{ animationDuration: "3s" }}>
          <circle cx="40" cy="40" r="34" fill="none" stroke="#1a2535" strokeWidth="3" />
          <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="3" strokeDasharray="40 174" strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-2xl">{mode === "autopsy" ? "🔬" : "🎯"}</div>
      </div>
      <div className="font-bebas text-2xl text-white mb-2">{mode === "autopsy" ? "AUTOPSIA EN PROGRESO" : "SIMULANDO ENTRADA..."}</div>
      <div className="font-sharetech text-[10px] tracking-[0.3em] animate-pulse min-h-[16px]" style={{ color }}>{steps[tick]}</div>
    </div>
  );
}

// ─── Certificate ──────────────────────────────────────────────────────────────
function PsyCertificate({ userName, score }: { userName?: string; score: number }) {
  return (
    <div className="border-2 border-[#ffd700] bg-gradient-to-b from-[#0a0900] to-[#060a0f] p-8 text-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(45deg,#ffd700 0,#ffd700 1px,transparent 0,transparent 50%)", backgroundSize: "20px 20px" }} />
      <div className="relative z-10">
        <div className="font-sharetech text-[9px] tracking-[0.5em] text-[#ffd700] mb-4">PSYCHOMETRIKS · CERTIFICACIÓN OFICIAL</div>
        <div className="text-5xl mb-4">🏆</div>
        <div className="font-bebas text-3xl text-white mb-1">PSY TRADER CERTIFICADO</div>
        <div className="font-bebas text-xl text-[#ffd700] mb-4">{userName ?? "TRADER"}</div>
        <div className="font-space text-[11px] text-[#8a9ab0] leading-relaxed mb-4">
          Ha demostrado disciplina consistente en el análisis de sus operaciones,<br />
          manteniendo un PSY Score de <strong className="text-[#ffd700]">{score}/100</strong> con journaling activo.
        </div>
        <div className="inline-block border border-[#ffd70055] px-4 py-2 font-sharetech text-[10px] text-[#ffd700] tracking-[0.2em] mb-4">
          NIVEL DISCIPLINADO · PSYCHOMETRIKS {new Date().getFullYear()}
        </div>
        <div className="font-space text-[9px] text-[#7ab3c8]">
          Compartí tu certificado con #PSYTrader en redes sociales
        </div>
      </div>
    </div>
  );
}

// ─── TAG badge ────────────────────────────────────────────────────────────────
const TAG_COLORS: Record<string, string> = {
  FOMO: "#ff6d00", SIN_SL: "#ff1744", UTAD: "#e040fb", REVENGE: "#ff1744",
  OVERLEVERAGED: "#ffd700", PSICOLÓGICO: "#e040fb", TÉCNICO: "#00e5ff",
  MACRO: "#8a9ab0", WYCKOFF: "#00e5ff", CVD: "#00e676",
};

function ErrorTag({ tag }: { tag: string }) {
  const color = TAG_COLORS[tag] ?? "#4a6070";
  return (
    <span className="font-sharetech text-[9px] px-2 py-0.5 border tracking-[0.1em]"
      style={{ color, borderColor: `${color}44`, background: `${color}0f` }}>
      {tag}
    </span>
  );
}

// ─── Tab type ─────────────────────────────────────────────────────────────────
type Tab = "autopsy" | "history" | "score";
type Phase = "form" | "loading" | "result";
type Mode = "autopsy" | "simulator";

// ─── EXAMPLES ────────────────────────────────────────────────────────────────
const EXAMPLES = [
  { label: "BTC Long liquidado", data: { pair: "BTC/USDT", direction: "LONG" as const, entry: "97100", sl: "", tp: "99500", exchange: "Binance", datetime: "2026-05-01 02:00", timeframe: "1h", leverage: "20", result: "Liquidado en $92300", notes: "Vi el rompimiento de 97k y entré. Pensé que era el breakout definitivo. Fue todo lo contrario." } },
  { label: "ETH Short mal cronometrado", data: { pair: "ETH/USDT", direction: "SHORT" as const, entry: "3200", sl: "3350", tp: "2900", exchange: "Bybit", datetime: "2026-04-28 14:00", timeframe: "4h", leverage: "10", result: "SL activado en $3350", notes: "El mercado parecía sobreextendido. Shorteé en resistencia pero salté antes del movimiento real." } },
  { label: "SOL FOMO entry", data: { pair: "SOL/USDT", direction: "LONG" as const, entry: "185", sl: "", tp: "", exchange: "OKX", datetime: "2026-04-30 18:00", timeframe: "15m", leverage: "50", result: "Liquidado en $181.3", notes: "Estaba bombeando fuerte. Entré sin stop. FOMO total." } },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
// ─── Plan Gate ────────────────────────────────────────────────────────────────
function PlanGate({ required }: { required: string }) {
  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani flex flex-col">
      <SiteNav />
      <div className="flex-1 flex items-center justify-center px-6 pt-20">
        <div className="border border-[#1a2535] bg-[#060a0f] p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-5">🔒</div>
          <div className="font-sharetech text-[9px] tracking-[0.4em] text-[#ff1744] mb-3">ACCESO RESTRINGIDO</div>
          <div className="font-bebas text-3xl text-white mb-2">PSY AUTOPSY</div>
          <div className="font-space text-[12px] text-[#7a9aaa] mb-6 leading-relaxed">
            Esta herramienta está disponible para miembros del plan
            <span className="text-[#ffd700] font-bold"> {required}</span> o superior.
          </div>
          <div className="border border-[#ffd70022] bg-[#0a0900] px-5 py-4 mb-6">
            <div className="font-sharetech text-[10px] tracking-[0.2em] text-[#ffd700] mb-3">⬡ INCLUÍDO EN TRADER $49/mes</div>
            <div className="space-y-1.5 text-left">
              {["PSY AUTOPSY — Análisis forense de trades","PSY JOURNAL IA — Diario con inteligencia artificial","Aula Virtual completa"].map(f => (
                <div key={f} className="flex items-center gap-2 font-space text-[11px] text-[#8a9ab0]">
                  <span className="text-[#ffd700] text-[9px]">✦</span> {f}
                </div>
              ))}
            </div>
          </div>
          <a href="/pricing" className="block w-full py-3 font-space text-[12px] font-bold tracking-[0.2em] uppercase text-[#020408] transition-opacity hover:opacity-90" style={{ background: "#ffd700" }}>
            VER PLANES →
          </a>
          <div className="mt-4 font-space text-[10px] text-[#5a8898]">
            ¿Ya sos miembro? <a href="/login" className="text-[#00e5ff] hover:underline">Iniciá sesión</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function PsyAutopsyApp() {
  const [tab, setTab] = useState<Tab>("autopsy");
  const [mode, setMode] = useState<Mode>("autopsy");
  const [form, setForm] = useState<TradeForm>(EMPTY);
  const [phase, setPhase] = useState<Phase>("form");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<AutopsyRecord[]>([]);
  const [weeklyReport, setWeeklyReport] = useState("");
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const psyScore = computePsyScore(history);
  const hasCertificate = psyScore >= 75 && history.length >= 5;

  function set(field: keyof TradeForm, val: string) {
    setForm(f => ({ ...f, [field]: val }));
  }

  function loadExample(idx: number) {
    setForm({ ...EMPTY, ...EXAMPLES[idx].data });
  }

  const canSubmit = form.pair.trim() !== "" && form.entry.trim() !== "";

  async function runAnalysis() {
    if (!canSubmit) return;
    setPhase("loading");
    setOutput("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    abortRef.current = new AbortController();
    try {
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      const endpoint = "/api/psy-autopsy";
      const body = mode === "simulator"
        ? { ...form, simulatorMode: true, notes: (form.notes ? form.notes + "\n" : "") + "[MODO SIMULADOR: Este trade NO se ha ejecutado. Evaluá si debería entrar.] " }
        : form;
      const res = await fetch(`${BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Error ${res.status}`);
      }
      setPhase("result");
      if (!res.body) throw new Error("Stream no disponible");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(part.slice(6)) as { text?: string; done?: boolean; error?: string };
            if (json.error) { setError(json.error); break; }
            if (json.done) break;
            if (json.text) {
              fullText += json.text;
              setOutput(prev => prev + json.text);
              setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
            }
          } catch { /* skip */ }
        }
      }
      // Auto-save
      if (fullText.length > 50) {
        const record: AutopsyRecord = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          pair: form.pair,
          direction: form.direction,
          entry: form.entry,
          sl: form.sl || undefined,
          result: form.result || undefined,
          analysis: fullText,
          mode,
          errorTags: extractErrorTags(fullText),
          psyScoreAtTime: psyScore,
        };
        saveRecord(record);
        setHistory(loadHistory());
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message ?? "Error de conexión");
        setPhase("form");
      }
    }
  }

  function reset() {
    abortRef.current?.abort();
    setPhase("form");
    setOutput("");
    setError("");
  }

  async function generateWeeklyReport() {
    if (history.length === 0) return;
    setWeeklyLoading(true);
    setWeeklyReport("");
    try {
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${BASE}/api/psy-weekly-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: history.slice(0, 20) }),
      });
      if (!res.ok) throw new Error("Error generando reporte");
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(part.slice(6)) as { text?: string; done?: boolean };
            if (json.done) break;
            if (json.text) setWeeklyReport(prev => prev + json.text);
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      setWeeklyReport("Error generando el reporte. Intentá de nuevo.");
    } finally {
      setWeeklyLoading(false);
    }
  }

  // ─── Pattern aggregation for history tab ─────────────────────────────────
  const errorCounts: Record<string, number> = {};
  for (const r of history) {
    for (const tag of r.errorTags) {
      errorCounts[tag] = (errorCounts[tag] ?? 0) + 1;
    }
  }
  const topErrors = Object.entries(errorCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "autopsy", label: mode === "simulator" ? "SIMULADOR" : "AUTOPSIA", icon: mode === "simulator" ? "🎯" : "🔬" },
    { id: "history", label: `HISTORIAL (${history.length})`, icon: "📋" },
    { id: "score", label: "MI PSY SCORE", icon: "📊" },
  ];

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      {/* Hero */}
      <section className="pt-28 pb-6 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#ff1744] border border-[#ff174430] px-3 py-1.5 uppercase">
            🔬 PSY AUTOPSY · IA FORENSE · CLAUDE SONNET
          </div>
          {hasCertificate && (
            <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#ffd700] border border-[#ffd70033] px-3 py-1.5">
              🏆 PSY CERTIFICADO
            </div>
          )}
        </div>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <h1 className="font-bebas text-[clamp(40px,6vw,80px)] leading-none">
            EL POST-MORTEM <span className="text-[#ff1744]">DE TU TRADE</span>
          </h1>
          {/* Mode toggle */}
          <div className="flex border border-[#1a2535] shrink-0">
            <button onClick={() => { setMode("autopsy"); reset(); }}
              className="px-4 py-2 font-space text-[11px] tracking-[0.1em] uppercase transition-all font-bold"
              style={{ background: mode === "autopsy" ? "#ff174415" : "transparent", color: mode === "autopsy" ? "#ff1744" : "#4a6070", borderRight: "1px solid #1a2535" }}>
              🔬 AUTOPSIA
            </button>
            <button onClick={() => { setMode("simulator"); reset(); }}
              className="px-4 py-2 font-space text-[11px] tracking-[0.1em] uppercase transition-all font-bold"
              style={{ background: mode === "simulator" ? "#ffd70015" : "transparent", color: mode === "simulator" ? "#ffd700" : "#4a6070" }}>
              🎯 SIMULADOR
            </button>
          </div>
        </div>
        {mode === "simulator" && (
          <div className="mt-2 inline-block border border-[#ffd70033] bg-[#ffd7000a] px-4 py-2 font-space text-[11px] text-[#ffd700]">
            ⚡ MODO SIMULADOR — Analizá un trade ANTES de ejecutarlo. PSY te dice si entrarías o no.
          </div>
        )}
      </section>

      {/* Tabs */}
      <div className="px-6 md:px-12 max-w-6xl mx-auto">
        <div className="flex border-b border-[#1a2535] mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-5 py-3 font-space text-[11px] tracking-[0.15em] uppercase transition-all border-b-2 -mb-px"
              style={{
                borderBottomColor: tab === t.id ? (t.id === "autopsy" ? (mode === "simulator" ? "#ffd700" : "#ff1744") : "#00e5ff") : "transparent",
                color: tab === t.id ? "#e0f4ff" : "#4a6070",
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <section className="px-6 md:px-12 pb-20 max-w-6xl mx-auto">

        {/* ══ TAB 1: AUTOPSY / SIMULATOR ═══════════════════════════════════════ */}
        {tab === "autopsy" && (
          <>
            {phase === "form" && (
              <div className="grid lg:grid-cols-[1fr_320px] gap-6">
                <div className="border border-[#1a2535] bg-[#060a0f] p-6 md:p-8">
                  <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] uppercase mb-5">
                    {mode === "autopsy" ? "Trade perdedor a analizar" : "Trade que estás considerando entrar"}
                  </div>
                  {/* Quick examples */}
                  <div className="mb-5">
                    <div className="font-space text-[10px] text-[#7ab3c8] mb-2">Ejemplo rápido:</div>
                    <div className="flex flex-wrap gap-2">
                      {EXAMPLES.map((ex, i) => (
                        <button key={i} onClick={() => loadExample(i)}
                          className="font-space text-[10px] px-3 py-1.5 border border-[#1a2535] text-[#7ab3c8] hover:border-[#ff174440] hover:text-[#ff6d00] transition-all">
                          {ex.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">Par *</label>
                      <input value={form.pair} onChange={e => set("pair", e.target.value)} placeholder="BTC/USDT" maxLength={20}
                        className="w-full bg-[#0a0f18] border border-[#1a2535] px-4 py-2.5 font-space text-[13px] text-white placeholder-[#2a3a4a] focus:border-[#ff174460] focus:outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">Dirección *</label>
                      <div className="flex gap-2">
                        {(["LONG", "SHORT"] as const).map(d => (
                          <button key={d} onClick={() => set("direction", d)}
                            className="flex-1 py-2.5 border font-space text-[11px] font-bold tracking-[0.1em] transition-all"
                            style={{ borderColor: form.direction === d ? (d === "LONG" ? "#00e676" : "#ff1744") : "#1a2535", background: form.direction === d ? (d === "LONG" ? "#00e67612" : "#ff174412") : "transparent", color: form.direction === d ? (d === "LONG" ? "#00e676" : "#ff1744") : "#4a6070" }}>
                            {d === "LONG" ? "↑ LONG" : "↓ SHORT"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">Precio de entrada * ($)</label>
                      <input value={form.entry} onChange={e => set("entry", e.target.value)} placeholder="97100" type="number"
                        className="w-full bg-[#0a0f18] border border-[#1a2535] px-4 py-2.5 font-space text-[13px] text-white placeholder-[#2a3a4a] focus:border-[#ff174460] focus:outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">Stop Loss ($)</label>
                      <input value={form.sl} onChange={e => set("sl", e.target.value)} placeholder="Sin SL (dejar vacío)" type="number"
                        className="w-full bg-[#0a0f18] border border-[#1a2535] px-4 py-2.5 font-space text-[13px] text-white placeholder-[#2a3a4a] focus:border-[#ff174460] focus:outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">Take Profit ($)</label>
                      <input value={form.tp} onChange={e => set("tp", e.target.value)} placeholder="Opcional" type="number"
                        className="w-full bg-[#0a0f18] border border-[#1a2535] px-4 py-2.5 font-space text-[13px] text-white placeholder-[#2a3a4a] focus:border-[#ff174460] focus:outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">Exchange</label>
                      <input value={form.exchange} onChange={e => set("exchange", e.target.value)} placeholder="Binance, Bybit, OKX..."
                        className="w-full bg-[#0a0f18] border border-[#1a2535] px-4 py-2.5 font-space text-[13px] text-white placeholder-[#2a3a4a] focus:border-[#ff174460] focus:outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">Fecha y hora</label>
                      <input value={form.datetime} onChange={e => set("datetime", e.target.value)} placeholder="2026-05-01 14:30"
                        className="w-full bg-[#0a0f18] border border-[#1a2535] px-4 py-2.5 font-space text-[13px] text-white placeholder-[#2a3a4a] focus:border-[#ff174460] focus:outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">Timeframe</label>
                      <div className="flex flex-wrap gap-1.5">
                        {["1m", "5m", "15m", "1h", "4h", "1D"].map(tf => (
                          <button key={tf} onClick={() => set("timeframe", tf)}
                            className="px-2.5 py-1.5 border font-sharetech text-[10px] transition-all"
                            style={{ borderColor: form.timeframe === tf ? "#00e5ff" : "#1a2535", background: form.timeframe === tf ? "#00e5ff12" : "transparent", color: form.timeframe === tf ? "#00e5ff" : "#4a6070" }}>
                            {tf.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">Apalancamiento</label>
                      <input value={form.leverage} onChange={e => set("leverage", e.target.value)} placeholder="Ej: 20"
                        className="w-full bg-[#0a0f18] border border-[#1a2535] px-4 py-2.5 font-space text-[13px] text-white placeholder-[#2a3a4a] focus:border-[#ff174460] focus:outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">
                        {mode === "autopsy" ? "Resultado" : "Resultado esperado"}
                      </label>
                      <input value={form.result} onChange={e => set("result", e.target.value)} placeholder="Liquidado / SL activado / -$200"
                        className="w-full bg-[#0a0f18] border border-[#1a2535] px-4 py-2.5 font-space text-[13px] text-white placeholder-[#2a3a4a] focus:border-[#ff174460] focus:outline-none transition-colors" />
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">
                      {mode === "autopsy" ? "Tu razonamiento al entrar" : "Por qué querés entrar este trade"}
                    </label>
                    <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={4}
                      placeholder={mode === "autopsy" ? "Ej: Vi el breakout de X nivel, pensé que era el inicio del rally..." : "Ej: El CVD se ve alcista, precio sobre OB, quiero entrar long en 97k..."}
                      className="w-full bg-[#0a0f18] border border-[#1a2535] px-4 py-3 font-space text-[12px] text-white placeholder-[#2a3a4a] focus:border-[#ff174460] focus:outline-none transition-colors resize-none leading-relaxed" />
                  </div>

                  {error && <div className="mb-4 p-3 border border-[#ff174440] bg-[#ff17440a] font-space text-[11px] text-[#ff6d00]">⚠ {error}</div>}

                  <button onClick={runAnalysis} disabled={!canSubmit}
                    className="w-full py-5 font-space text-sm font-bold tracking-[0.2em] uppercase transition-all"
                    style={{ background: canSubmit ? (mode === "simulator" ? "#ffd700" : "#ff1744") : "#0d1520", color: canSubmit ? (mode === "simulator" ? "#020408" : "#fff") : "#2a3a4a", cursor: canSubmit ? "pointer" : "not-allowed" }}>
                    {mode === "autopsy" ? "🔬 INICIAR AUTOPSIA PSY →" : "🎯 SIMULAR TRADE →"}
                  </button>
                </div>

                {/* Right info panel */}
                <div className="space-y-4">
                  {/* PSY Score mini */}
                  <div className="border border-[#1a2535] bg-[#060a0f] p-5">
                    <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-3">TU PSY SCORE ACTUAL</div>
                    <div className="flex items-center gap-4">
                      <div className="font-bebas text-5xl" style={{ color: scoreColor(psyScore) }}>{psyScore}</div>
                      <div>
                        <div className="font-sharetech text-[10px] font-bold" style={{ color: scoreColor(psyScore) }}>{scoreLabel(psyScore)}</div>
                        <div className="font-space text-[9px] text-[#7ab3c8] mt-0.5">{history.length} autopsias guardadas</div>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 bg-[#0a0f18] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${psyScore}%`, background: scoreColor(psyScore) }} />
                    </div>
                  </div>

                  {mode === "simulator" && (
                    <div className="border border-[#ffd70033] bg-[#ffd7000a] p-5">
                      <div className="font-space text-[10px] text-[#ffd700] mb-2">🎯 MODO SIMULADOR</div>
                      <div className="font-space text-[11px] text-[#6a7040] leading-relaxed">
                        Antes de ejecutar el trade, PSY lo evalúa con Wyckoff, CVD y Whale Flow. Si el sistema dice NO, escuchalo.
                      </div>
                    </div>
                  )}

                  <div className="border border-[#ff174422] bg-[#0a0609] p-5">
                    <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#ff1744] mb-3">QUÉ ANALIZA LA IA</div>
                    {[
                      { icon: "📍", label: "Fase Wyckoff", desc: "Spring, UTAD, ST, LPS" },
                      { icon: "📊", label: "CVD Diagnosis", desc: "Divergencias y presión del momento" },
                      { icon: "🐋", label: "Whale Flow", desc: "Acumulando o distribuyendo" },
                      { icon: "💸", label: "Funding & OI", desc: "Estado del mercado de derivados" },
                      { icon: "🧠", label: "Error psicológico", desc: "FOMO, revenge, overleveraged" },
                      { icon: "🎯", label: "PSY-ULT1 Score", desc: "Score institucional estimado" },
                    ].map(item => (
                      <div key={item.label} className="flex gap-3 py-1.5 border-b border-[#1a2535] last:border-0">
                        <span className="text-base shrink-0">{item.icon}</span>
                        <div>
                          <div className="font-space text-[10px] text-[#e0f4ff] font-bold">{item.label}</div>
                          <div className="font-space text-[9px] text-[#7ab3c8]">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {phase === "loading" && (
              <div className="border border-[#1a2535] bg-[#060a0f]">
                <ScanAnimation mode={mode} />
              </div>
            )}

            {phase === "result" && (
              <div className="grid lg:grid-cols-[1fr_280px] gap-6">
                <div>
                  <div className="border border-[#ff174430] bg-[#0a0609] p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#ff1744] mb-1">
                        {mode === "autopsy" ? "TRADE ANALIZADO" : "TRADE SIMULADO"}
                      </div>
                      <div className="font-bebas text-3xl text-white">
                        {form.pair}
                        <span className="ml-2 text-xl" style={{ color: form.direction === "LONG" ? "#00e676" : "#ff1744" }}>
                          {form.direction === "LONG" ? "↑" : "↓"} {form.direction}
                        </span>
                        <span className="ml-3 text-xl text-[#7ab3c8]">${form.entry}</span>
                      </div>
                      {form.result && <div className="font-space text-[11px] text-[#ff6d00] mt-0.5">💀 {form.result}</div>}
                    </div>
                    <button onClick={reset}
                      className="font-space text-[11px] border border-[#ff174440] text-[#ff6d00] px-4 py-2 hover:bg-[#ff174410] transition-colors">
                      ← Nueva {mode === "autopsy" ? "autopsia" : "simulación"}
                    </button>
                  </div>
                  <div className="border border-[#1a2535] bg-[#060a0f] p-6 min-h-[300px]">
                    <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#ff1744] mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#ff1744] rounded-full animate-pulse" />
                      {mode === "autopsy" ? "AUTOPSIA PSY — ANÁLISIS FORENSE" : "DICTAMEN PSY — SIMULACIÓN PRE-TRADE"}
                    </div>
                    {output ? <AutopsyText text={output} /> : (
                      <div className="font-sharetech text-[10px] text-[#5a8898] animate-pulse">○ Generando análisis...</div>
                    )}
                    <div ref={outputRef} />
                  </div>
                  <div className="mt-3 font-space text-[10px] text-[#5a8898] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#00e676] rounded-full" /> Guardado automáticamente en tu historial
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="border border-[#00e5ff33] bg-[#020c14] p-5">
                    <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-3">EVITÁ QUE VUELVA A PASAR</div>
                    <p className="font-space text-[11px] text-[#7ab3c8] leading-relaxed mb-4">La autopsia te dice qué salió mal. LiqMap PRO te muestra cómo evitarlo en tiempo real.</p>
                    <Link href="/pricing" className="block w-full py-4 text-center font-space text-[12px] font-bold tracking-[0.15em] uppercase no-underline mt-2 hover:opacity-90 transition-opacity" style={{ background: "#00e5ff", color: "#020408" }}>
                      ACCEDER A LIQMAP PRO →
                    </Link>
                  </div>
                  <button onClick={() => setTab("history")}
                    className="w-full py-3 border border-[#1a2535] font-space text-[11px] text-[#7ab3c8] hover:text-[#00e5ff] hover:border-[#00e5ff44] transition-all">
                    📋 Ver mi historial →
                  </button>
                  <button onClick={reset}
                    className="w-full py-3 border border-[#ff174440] font-space text-[11px] text-[#ff6d00] hover:bg-[#ff174410] font-bold tracking-[0.1em] uppercase transition-colors">
                    + NUEVA {mode === "autopsy" ? "AUTOPSIA" : "SIMULACIÓN"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══ TAB 2: HISTORIAL ═════════════════════════════════════════════════ */}
        {tab === "history" && (
          <div className="grid lg:grid-cols-[1fr_280px] gap-6">
            <div>
              <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] uppercase mb-4">
                {history.length} autopsias guardadas
              </div>

              {history.length === 0 ? (
                <div className="border border-[#1a2535] bg-[#060a0f] p-12 text-center">
                  <div className="text-4xl mb-3">📋</div>
                  <div className="font-bebas text-2xl text-[#5a8898] mb-2">SIN HISTORIAL AÚN</div>
                  <div className="font-space text-[12px] text-[#7ab3c8] mb-4">Hacé tu primera autopsia y se guardará automáticamente acá.</div>
                  <button onClick={() => setTab("autopsy")} className="font-space text-[11px] border border-[#ff174440] text-[#ff6d00] px-5 py-2 hover:bg-[#ff174410] transition-colors">
                    → Hacer primera autopsia
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((record) => (
                    <div key={record.id} className="border border-[#1a2535] bg-[#060a0f] overflow-hidden">
                      <button
                        onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                        className="w-full p-4 text-left hover:bg-[#0a0f18] transition-colors">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <span className="font-space text-[10px] px-1.5 py-0.5 border"
                              style={{ color: record.mode === "simulator" ? "#ffd700" : "#ff1744", borderColor: record.mode === "simulator" ? "#ffd70033" : "#ff174433" }}>
                              {record.mode === "simulator" ? "🎯 SIM" : "🔬 REAL"}
                            </span>
                            <div>
                              <div className="font-bebas text-xl text-white">
                                {record.pair}
                                <span className="ml-2 text-base" style={{ color: record.direction === "LONG" ? "#00e676" : "#ff1744" }}>
                                  {record.direction === "LONG" ? "↑" : "↓"} ${record.entry}
                                </span>
                              </div>
                              <div className="font-space text-[9px] text-[#7ab3c8]">
                                {new Date(record.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                {record.result && <span className="ml-2 text-[#ff6d00]">· {record.result}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {record.errorTags.slice(0, 3).map(tag => <ErrorTag key={tag} tag={tag} />)}
                            <span className="font-space text-[10px] text-[#5a8898]">{expandedId === record.id ? "▲" : "▼"}</span>
                          </div>
                        </div>
                      </button>
                      {expandedId === record.id && (
                        <div className="border-t border-[#1a2535] p-4 bg-[#04070d]">
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {record.errorTags.map(tag => <ErrorTag key={tag} tag={tag} />)}
                          </div>
                          <AutopsyText text={record.analysis} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pattern panel */}
            <div className="space-y-4">
              {topErrors.length > 0 && (
                <div className="border border-[#ff174422] bg-[#0a0609] p-5">
                  <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#ff1744] mb-3">TUS ERRORES MÁS FRECUENTES</div>
                  {topErrors.map(([tag, count]) => (
                    <div key={tag} className="mb-3">
                      <div className="flex justify-between mb-1">
                        <ErrorTag tag={tag} />
                        <span className="font-sharetech text-[10px] text-[#7ab3c8]">{count}×</span>
                      </div>
                      <div className="h-1 bg-[#0a0f18]">
                        <div className="h-full transition-all" style={{ width: `${(count / history.length) * 100}%`, background: TAG_COLORS[tag] ?? "#4a6070" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {history.length > 0 && (
                <div className="border border-[#1a2535] bg-[#060a0f] p-5">
                  <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-3">ESTADÍSTICAS</div>
                  {[
                    { label: "Total autopsias", value: history.length },
                    { label: "Simulaciones", value: history.filter(r => r.mode === "simulator").length },
                    { label: "Con SL definido", value: history.filter(r => r.sl).length },
                    { label: "Pares analizados", value: new Set(history.map(r => r.pair)).size },
                  ].map(s => (
                    <div key={s.label} className="flex justify-between py-2 border-b border-[#1a2535] last:border-0">
                      <span className="font-space text-[10px] text-[#7ab3c8]">{s.label}</span>
                      <span className="font-sharetech text-[11px] text-[#e0f4ff]">{s.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {history.length > 0 && (
                <button onClick={() => { if (confirm("¿Borrar todo el historial?")) { localStorage.removeItem(STORAGE_KEY); setHistory([]); } }}
                  className="w-full py-2.5 border border-[#1a2535] font-space text-[10px] text-[#5a8898] hover:border-[#ff174430] hover:text-[#ff6d00] transition-colors">
                  🗑 Borrar historial
                </button>
              )}
            </div>
          </div>
        )}

        {/* ══ TAB 3: PSY SCORE ═════════════════════════════════════════════════ */}
        {tab === "score" && (
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              {/* Score gauge */}
              <div className="border border-[#1a2535] bg-[#060a0f] p-8 text-center">
                <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-4">TU PSY SCORE PERSONAL</div>
                <div className="relative w-40 h-40 mx-auto mb-4">
                  <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                    <circle cx="80" cy="80" r="64" fill="none" stroke="#0a0f18" strokeWidth="10" />
                    <circle cx="80" cy="80" r="64" fill="none" strokeWidth="10" strokeLinecap="round"
                      stroke={scoreColor(psyScore)}
                      strokeDasharray={`${(psyScore / 100) * 402} 402`}
                      style={{ transition: "stroke-dasharray 1s ease" }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="font-bebas text-5xl" style={{ color: scoreColor(psyScore) }}>{psyScore}</div>
                    <div className="font-sharetech text-[9px]" style={{ color: scoreColor(psyScore) }}>/100</div>
                  </div>
                </div>
                <div className="font-bebas text-2xl mb-1" style={{ color: scoreColor(psyScore) }}>{scoreLabel(psyScore)}</div>
                <div className="font-space text-[11px] text-[#7ab3c8]">{history.length} autopsias · {history.filter(r => r.mode === "simulator").length} simulaciones</div>
              </div>

              {/* Score breakdown */}
              <div className="border border-[#1a2535] bg-[#060a0f] p-6">
                <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-4">CÓMO SE CALCULA TU SCORE</div>
                {[
                  { label: "Journaling (autopsias)", value: `+${Math.min(history.length * 2, 20)}`, color: "#00e676", desc: "+2 por autopsia, máx +20" },
                  { label: "Simulador pre-trade", value: `+${Math.min(history.filter(r => r.mode === "simulator").length * 5, 15)}`, color: "#ffd700", desc: "+5 por simulación, máx +15" },
                  { label: "Errores FOMO detectados", value: `-${history.filter(r => r.errorTags.includes("FOMO")).length * 5}`, color: "#ff6d00", desc: "-5 por cada FOMO" },
                  { label: "Trades sin SL", value: `-${history.filter(r => r.errorTags.includes("SIN_SL")).length * 8}`, color: "#ff1744", desc: "-8 por cada trade sin stop" },
                  { label: "Trampas UTAD", value: `-${history.filter(r => r.errorTags.includes("UTAD")).length * 4}`, color: "#e040fb", desc: "-4 por caer en UTAD" },
                  { label: "Revenge trading", value: `-${history.filter(r => r.errorTags.includes("REVENGE")).length * 6}`, color: "#ff1744", desc: "-6 por revenge trade" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-[#1a2535] last:border-0">
                    <div>
                      <div className="font-space text-[11px] text-[#8a9ab0]">{item.label}</div>
                      <div className="font-space text-[9px] text-[#5a8898]">{item.desc}</div>
                    </div>
                    <div className="font-sharetech text-[13px] font-bold" style={{ color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Certificate */}
              {hasCertificate ? (
                <PsyCertificate score={psyScore} />
              ) : (
                <div className="border border-[#ffd70022] bg-[#0a0900] p-6 text-center">
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="font-bebas text-xl text-[#ffd700] mb-1">CERTIFICADO PSY</div>
                  <div className="font-space text-[11px] text-[#6a7040] leading-relaxed mb-3">
                    Alcanzá un PSY Score ≥ 75 con al menos 5 autopsias guardadas para recibir tu certificado oficial.
                  </div>
                  <div className="font-space text-[10px] text-[#7ab3c8]">
                    Progreso: Score {psyScore}/75 · Autopsias {history.length}/5
                  </div>
                  <div className="mt-3 h-1.5 bg-[#0a0f18]">
                    <div className="h-full bg-[#ffd700] transition-all" style={{ width: `${Math.min((psyScore / 75) * 100, 100)}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Right: Weekly report */}
            <div className="space-y-4">
              <div className="border border-[#e040fb33] bg-[#0a060f] p-5">
                <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#e040fb] mb-2">📅 REPORTE SEMANAL IA</div>
                <div className="font-space text-[11px] text-[#6a5070] leading-relaxed mb-4">
                  Claude analiza todo tu historial y genera un reporte de tus patrones de error, peor sesión, y plan de mejora para la próxima semana.
                </div>
                {history.length === 0 ? (
                  <div className="font-space text-[10px] text-[#7ab3c8] border border-[#1a2535] p-3">
                    Necesitás al menos 1 autopsia guardada para generar el reporte.
                  </div>
                ) : (
                  <button onClick={generateWeeklyReport} disabled={weeklyLoading}
                    className="w-full py-3 font-space text-[11px] font-bold tracking-[0.15em] uppercase transition-all"
                    style={{ background: weeklyLoading ? "#1a0a1f" : "#e040fb", color: weeklyLoading ? "#6a5070" : "#fff", cursor: weeklyLoading ? "not-allowed" : "pointer" }}>
                    {weeklyLoading ? "⏳ GENERANDO..." : "📊 GENERAR REPORTE →"}
                  </button>
                )}
              </div>

              {weeklyReport && (
                <div className="border border-[#e040fb33] bg-[#060a0f] p-5">
                  <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#e040fb] mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#e040fb] rounded-full" />
                    REPORTE GENERADO
                  </div>
                  <AutopsyText text={weeklyReport} />
                </div>
              )}

              <div className="border border-[#1a2535] bg-[#060a0f] p-5">
                <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-3">PRÓXIMOS LOGROS</div>
                {[
                  { label: "Primer análisis", done: history.length >= 1, icon: "🔬" },
                  { label: "5 autopsias", done: history.length >= 5, icon: "📋" },
                  { label: "Primera simulación", done: history.filter(r => r.mode === "simulator").length >= 1, icon: "🎯" },
                  { label: "Score ≥ 65", done: psyScore >= 65, icon: "📈" },
                  { label: "Certificado PSY", done: hasCertificate, icon: "🏆" },
                ].map(a => (
                  <div key={a.label} className="flex items-center gap-3 py-2 border-b border-[#1a2535] last:border-0">
                    <span className="text-base">{a.icon}</span>
                    <span className="font-space text-[11px] flex-1" style={{ color: a.done ? "#00e676" : "#4a6070" }}>{a.label}</span>
                    <span className="font-sharetech text-[10px]" style={{ color: a.done ? "#00e676" : "#2a4a5a" }}>{a.done ? "✓" : "○"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function PsyAutopsy() {
  const auth = (() => { try { return JSON.parse(localStorage.getItem("psyko_auth") ?? "null") as { user?: string; role?: string; plan?: string } | null; } catch { return null; } })();
  const plan = auth?.plan ?? "";
  const isAllowed = ["aprendiz","trader","institucional"].includes(plan) || auth?.role === "superadmin" || auth?.role === "operator" || auth?.role === "member";
  if (!isAllowed) return <PlanGate required="Pro" />;
  return <PsyAutopsyApp />;
}
