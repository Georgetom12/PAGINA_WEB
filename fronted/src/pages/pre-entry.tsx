import { useState, useEffect } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/site-nav";

const ASSETS = [
  { symbol: "BTC",  label: "Bitcoin",   color: "#f7931a" },
  { symbol: "ETH",  label: "Ethereum",  color: "#627eea" },
  { symbol: "SOL",  label: "Solana",    color: "#9945ff" },
  { symbol: "XRP",  label: "XRP",       color: "#00aae4" },
  { symbol: "BNB",  label: "BNB",       color: "#f0b90b" },
  { symbol: "DOGE", label: "Dogecoin",  color: "#c2a633" },
  { symbol: "ADA",  label: "Cardano",   color: "#0033ad" },
  { symbol: "OTRO", label: "Otro activo", color: "#4a6070" },
];

interface Assessment {
  verdict: "GO" | "CAUTION" | "NO_GO";
  score: number;
  liqPrice: number;
  riskPct: number;
  riskUsd: number;
  rrRatio: number;
  warnings: { level: "fatal" | "high" | "medium"; text: string }[];
  killerReason: string | null;
  psychProfile: string;
  recommendation: string;
}

function calcAssessment(
  direction: "LONG" | "SHORT",
  entry: number,
  sl: number,
  tp: number,
  leverage: number,
  capital: number,
  riskPct: number,
): Assessment {
  const warnings: Assessment["warnings"] = [];

  const positionSize = (capital * riskPct / 100) * leverage;
  const riskUsd = Math.abs(entry - sl) / entry * positionSize;
  const liqDistance = 1 / leverage;
  const liqPrice = direction === "LONG"
    ? entry * (1 - liqDistance)
    : entry * (1 + liqDistance);

  const rrRatio = tp > 0 && sl > 0
    ? Math.abs(tp - entry) / Math.abs(entry - sl)
    : 0;

  const slPct = Math.abs(entry - sl) / entry * 100;
  let score = 100;

  if (leverage >= 50) {
    warnings.push({ level: "fatal", text: `${leverage}x de apalancamiento — el 94% de las posiciones con este leverage se liquidan en horas` });
    score -= 40;
  } else if (leverage >= 20) {
    warnings.push({ level: "high", text: `${leverage}x es apalancamiento de alto riesgo — una vela contra vos y perdés todo` });
    score -= 25;
  } else if (leverage >= 10) {
    warnings.push({ level: "medium", text: `${leverage}x requiere gestión de SL muy precisa` });
    score -= 10;
  }

  if (slPct < 0.3 && leverage < 20) {
    warnings.push({ level: "fatal", text: `SL a solo ${slPct.toFixed(2)}% del entry — stop loss demasiado ajustado, el spread lo va a tocar` });
    score -= 30;
  } else if (slPct > 8) {
    warnings.push({ level: "high", text: `SL a ${slPct.toFixed(1)}% — riesgo por trade excesivo. El mercado te cuesta demasiado si perdés` });
    score -= 20;
  }

  if (rrRatio < 1 && rrRatio > 0) {
    warnings.push({ level: "fatal", text: `R:R de ${rrRatio.toFixed(2)} — arriesgás más de lo que ganás. Con este ratio, perder es matemáticamente seguro a largo plazo` });
    score -= 35;
  } else if (rrRatio < 1.5 && rrRatio > 0) {
    warnings.push({ level: "medium", text: `R:R de ${rrRatio.toFixed(2)} — mínimo aceptable es 1.5:1` });
    score -= 10;
  }

  if (riskPct > 5) {
    warnings.push({ level: "fatal", text: `Arriesgás el ${riskPct}% de tu capital en un solo trade — traders profesionales arriesgan máximo 1-2%` });
    score -= 30;
  } else if (riskPct > 2) {
    warnings.push({ level: "high", text: `${riskPct}% de riesgo por trade es agresivo — considerá bajar a 1-2%` });
    score -= 15;
  }

  if (
    (direction === "LONG" && sl > entry) ||
    (direction === "SHORT" && sl < entry)
  ) {
    warnings.push({ level: "fatal", text: `SL en dirección equivocada — si vas LONG tu SL debe estar DEBAJO del entry` });
    score -= 50;
  }

  const liqPctFromSl = Math.abs(liqPrice - sl) / sl * 100;
  if (liqPctFromSl < 2 && leverage > 5) {
    warnings.push({ level: "high", text: `Liquidación a solo ${liqPctFromSl.toFixed(1)}% de tu SL — una wick te puede liquidar antes del stop` });
    score -= 15;
  }

  score = Math.max(0, Math.min(100, score));

  let verdict: "GO" | "CAUTION" | "NO_GO";
  let killerReason: string | null = null;
  let psychProfile: string;
  let recommendation: string;

  if (score >= 70) {
    verdict = "GO";
    psychProfile = "Setup estructurado. Pensás como un trader profesional.";
    recommendation = "Setup técnicamente válido. Ejecutá con disciplina y respetá el SL sin moverlo.";
  } else if (score >= 45) {
    verdict = "CAUTION";
    psychProfile = "Setup con riesgo elevado. Hay señales de trading emocional.";
    recommendation = "Corregí los puntos rojos antes de entrar. Un trade mal configurado no mejora solo.";
  } else {
    verdict = "NO_GO";
    const fatal = warnings.filter(w => w.level === "fatal")[0];
    killerReason = fatal?.text ?? "Múltiples errores críticos detectados";
    psychProfile = "Este setup tiene las características exactas de las posiciones que el mercado destruye.";
    recommendation = "No entres. Este no es miedo, es matemática. Esperá un mejor setup.";
  }

  return {
    verdict, score, liqPrice, riskPct, riskUsd, rrRatio,
    warnings, killerReason, psychProfile, recommendation,
  };
}

const VERDICT_CONFIG = {
  GO:      { color: "#00e676", bg: "#00e67608", border: "#00e67633", label: "ENTRADA VÁLIDA",     icon: "✅" },
  CAUTION: { color: "#ffd700", bg: "#ffd70008", border: "#ffd70033", label: "PRECAUCIÓN",         icon: "⚠️" },
  NO_GO:   { color: "#ff1744", bg: "#ff174408", border: "#ff174433", label: "NO ENTRES",          icon: "🛑" },
};

function PreEntryGate() {
  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani flex flex-col">
      <SiteNav />
      <div className="flex-1 flex items-center justify-center px-6 pt-20">
        <div className="border border-[#1a2535] bg-[#060a0f] p-10 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#ffd700] to-transparent" />
          <div className="text-5xl mb-5">⚡</div>
          <div className="font-sharetech text-[9px] tracking-[0.4em] text-[#ffd700] mb-3">ACCESO RESTRINGIDO</div>
          <div className="font-bebas text-3xl text-white mb-2">ESTOY POR ENTRAR</div>
          <div className="font-space text-[12px] text-[#7a9aaa] mb-6 leading-relaxed">
            El analizador de riesgo de entrada está disponible para miembros con plan
            <span className="text-[#ffd700] font-bold"> Básico</span> o superior.
          </div>
          <div className="border border-[#ffd70022] bg-[#020408] px-5 py-4 mb-6 text-left">
            <div className="font-sharetech text-[10px] tracking-[0.2em] text-[#ffd700] mb-3">⬡ INCLUÍDO DESDE $9/mes</div>
            <div className="space-y-1.5">
              {["Análisis de riesgo antes de entrar al trade","Cálculo de liquidación y R:R en tiempo real","Alertas psicológicas (FOMO, revenge trading)","Detector de setups peligrosos","Evaluación en menos de 10 segundos"].map(f => (
                <div key={f} className="flex items-center gap-2 font-space text-[11px] text-[#8a9ab0]">
                  <span className="text-[#ffd700] text-[9px]">✦</span> {f}
                </div>
              ))}
            </div>
          </div>
          <a href="/pricing" className="block w-full py-3 bg-[#ffd700] text-[#020408] font-space text-[12px] font-bold tracking-[0.2em] uppercase text-center no-underline hover:bg-white transition-colors">
            VER PLANES →
          </a>
          <div className="mt-4 font-space text-[10px] text-[#5a8898]">
            ¿Ya sos miembro? <Link href="/login" className="text-[#ffd700] hover:underline">Iniciá sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PreEntry() {
  const auth = (() => { try { return JSON.parse(localStorage.getItem("psyko_auth") ?? "null") as { role?: string; plan?: string } | null; } catch { return null; } })();
  const isAllowed = ["aprendiz","educacion","trader","institucional"].includes(auth?.plan ?? "") || auth?.role === "superadmin" || auth?.role === "operator";
  if (!isAllowed) return <PreEntryGate />;

  const [asset, setAsset]         = useState("BTC");
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [entry, setEntry]         = useState("");
  const [sl, setSl]               = useState("");
  const [tp, setTp]               = useState("");
  const [leverage, setLeverage]   = useState("10");
  const [capital, setCapital]     = useState("1000");
  const [riskPct, setRiskPct]     = useState("2");
  const [result, setResult]       = useState<Assessment | null>(null);
  const [analyzed, setAnalyzed]   = useState(false);

  const selectedAsset = ASSETS.find(a => a.symbol === asset) ?? ASSETS[0];

  function analyze() {
    const e = parseFloat(entry);
    const s = parseFloat(sl);
    const t = parseFloat(tp) || 0;
    const lev = parseFloat(leverage);
    const cap = parseFloat(capital);
    const rp = parseFloat(riskPct);
    if (!e || !s || !lev || !cap || !rp) return;
    setResult(calcAssessment(direction, e, s, t, lev, cap, rp));
    setAnalyzed(true);
  }

  function reset() {
    setAnalyzed(false);
    setResult(null);
    setEntry(""); setSl(""); setTp("");
  }

  const canAnalyze = entry && sl && leverage && capital && riskPct;

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />
      <div className="pt-28 pb-20 px-4 md:px-10 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="font-space text-[10px] text-[#ff1744] tracking-[0.4em] uppercase mb-3 animate-pulse">
            ⚡ ANÁLISIS PRE-ENTRADA
          </div>
          <h1 className="font-bebas text-6xl md:text-8xl leading-none mb-4">
            ESTOY POR<br />
            <span className="text-[#00e5ff]">ENTRAR</span>
          </h1>
          <p className="font-space text-[13px] text-[#7ab3c8] max-w-xl mx-auto leading-relaxed">
            Antes de apretar el botón, el sistema analiza tu setup.<br />
            Sin filtros. Sin mentiras. Solo matemática.
          </p>
        </div>

        {!analyzed ? (
          <div className="space-y-6">
            {/* Asset + Direction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-2">ACTIVO</label>
                <div className="flex flex-wrap gap-2">
                  {ASSETS.map(a => (
                    <button key={a.symbol} onClick={() => setAsset(a.symbol)}
                      className="font-space text-[11px] px-3 py-2 border transition-all"
                      style={{
                        borderColor: asset === a.symbol ? a.color : "#1a2535",
                        color: asset === a.symbol ? a.color : "#4a6070",
                        background: asset === a.symbol ? `${a.color}12` : "transparent",
                      }}>
                      {a.symbol}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-2">DIRECCIÓN</label>
                <div className="flex gap-2">
                  {(["LONG", "SHORT"] as const).map(d => (
                    <button key={d} onClick={() => setDirection(d)}
                      className="flex-1 py-3 font-bebas text-2xl border transition-all"
                      style={{
                        borderColor: direction === d ? (d === "LONG" ? "#00e676" : "#ff1744") : "#1a2535",
                        color: direction === d ? (d === "LONG" ? "#00e676" : "#ff1744") : "#4a6070",
                        background: direction === d ? (d === "LONG" ? "#00e67610" : "#ff174410") : "transparent",
                      }}>
                      {d === "LONG" ? "▲ LONG" : "▼ SHORT"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Price inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "PRECIO DE ENTRADA *", val: entry, set: setEntry, placeholder: "ej: 65000", color: "#00e5ff" },
                { label: `STOP LOSS * (${direction === "LONG" ? "debajo" : "arriba"} del entry)`, val: sl, set: setSl, placeholder: direction === "LONG" ? "ej: 63000" : "ej: 67000", color: "#ff1744" },
                { label: "TAKE PROFIT (opcional)", val: tp, set: setTp, placeholder: "ej: 70000", color: "#00e676" },
              ].map(({ label, val, set, placeholder, color }) => (
                <div key={label}>
                  <label className="font-space text-[9px] tracking-[0.15em] uppercase block mb-2" style={{ color }}>{label}</label>
                  <input
                    type="number" value={val} onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-[#060a0f] border border-[#1a2535] px-4 py-3 font-space text-[13px] text-white focus:outline-none transition-colors"
                    style={{ borderColor: val ? `${color}55` : "#1a2535" }}
                  />
                </div>
              ))}
            </div>

            {/* Risk inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="font-space text-[9px] text-[#7ab3c8] tracking-[0.15em] uppercase block mb-2">
                  APALANCAMIENTO × {leverage}x
                </label>
                <input type="range" min="1" max="125" value={leverage}
                  onChange={e => setLeverage(e.target.value)}
                  className="w-full accent-[#00e5ff]" />
                <div className="flex justify-between font-space text-[9px] text-[#5a8898] mt-1">
                  <span>1x</span><span style={{ color: parseInt(leverage) >= 50 ? "#ff1744" : parseInt(leverage) >= 20 ? "#ffd700" : "#00e676" }}>
                    {leverage}x {parseInt(leverage) >= 50 ? "— EXTREMO" : parseInt(leverage) >= 20 ? "— ALTO" : "— OK"}
                  </span><span>125x</span>
                </div>
              </div>
              <div>
                <label className="font-space text-[9px] text-[#7ab3c8] tracking-[0.15em] uppercase block mb-2">CAPITAL EN JUEGO ($)</label>
                <input type="number" value={capital} onChange={e => setCapital(e.target.value)}
                  placeholder="1000"
                  className="w-full bg-[#060a0f] border border-[#1a2535] px-4 py-3 font-space text-[13px] text-white focus:outline-none" />
              </div>
              <div>
                <label className="font-space text-[9px] text-[#7ab3c8] tracking-[0.15em] uppercase block mb-2">
                  % A ARRIESGAR: <span style={{ color: parseFloat(riskPct) > 5 ? "#ff1744" : parseFloat(riskPct) > 2 ? "#ffd700" : "#00e676" }}>{riskPct}%</span>
                </label>
                <input type="range" min="0.5" max="20" step="0.5" value={riskPct}
                  onChange={e => setRiskPct(e.target.value)}
                  className="w-full accent-[#00e5ff]" />
                <div className="flex justify-between font-space text-[9px] text-[#5a8898] mt-1">
                  <span>0.5%</span><span>Max recomendado: 2%</span><span>20%</span>
                </div>
              </div>
            </div>

            <button onClick={analyze} disabled={!canAnalyze}
              className="w-full py-5 font-bebas text-3xl tracking-[0.15em] transition-all"
              style={{
                background: canAnalyze ? "#00e5ff" : "#1a2535",
                color: canAnalyze ? "#020408" : "#2a4a5a",
              }}>
              ⚡ ANALIZAR MI ENTRADA AHORA
            </button>

            <p className="text-center font-space text-[10px] text-[#5a8898]">
              Sin registro requerido. Datos no se guardan.
            </p>
          </div>
        ) : result ? (
          <div className="space-y-6">
            {/* Verdict */}
            {(() => {
              const vc = VERDICT_CONFIG[result.verdict];
              return (
                <div className="border-2 p-8 text-center relative overflow-hidden"
                  style={{ borderColor: vc.color, background: vc.bg }}>
                  <div className="text-6xl mb-4">{vc.icon}</div>
                  <div className="font-space text-[11px] tracking-[0.4em] uppercase mb-2" style={{ color: vc.color }}>
                    VEREDICTO PSY
                  </div>
                  <div className="font-bebas text-7xl mb-3" style={{ color: vc.color }}>
                    {vc.label}
                  </div>

                  {/* Score bar */}
                  <div className="max-w-xs mx-auto mb-4">
                    <div className="h-2 bg-[#1a2535] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${result.score}%`, background: vc.color }} />
                    </div>
                    <div className="font-space text-[10px] text-[#7ab3c8] mt-1">
                      Score PSY: <span style={{ color: vc.color }}>{result.score}/100</span>
                    </div>
                  </div>

                  <p className="font-space text-[12px] text-[#7a9aaa] italic">"{result.psychProfile}"</p>

                  {result.killerReason && (
                    <div className="mt-4 border border-[#ff174433] bg-[#ff174408] p-4 text-left">
                      <div className="font-space text-[9px] text-[#ff1744] tracking-[0.2em] mb-1">💀 CAUSA DE MUERTE DETECTADA</div>
                      <div className="font-space text-[12px] text-[#ff6060]">{result.killerReason}</div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Key metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a2535] border border-[#1a2535]">
              {[
                {
                  label: "PRECIO LIQUIDACIÓN",
                  value: `$${result.liqPrice.toLocaleString("en", { maximumFractionDigits: 2 })}`,
                  color: "#ff1744",
                  sub: direction === "LONG" ? "Si cae hasta acá = $0" : "Si sube hasta acá = $0",
                },
                {
                  label: "RIESGO EN $",
                  value: `$${result.riskUsd.toFixed(0)}`,
                  color: result.riskUsd > 200 ? "#ff1744" : result.riskUsd > 100 ? "#ffd700" : "#00e676",
                  sub: `${riskPct}% del capital`,
                },
                {
                  label: "RATIO R:R",
                  value: result.rrRatio > 0 ? `${result.rrRatio.toFixed(2)}:1` : "Sin TP",
                  color: result.rrRatio >= 2 ? "#00e676" : result.rrRatio >= 1 ? "#ffd700" : result.rrRatio > 0 ? "#ff1744" : "#4a6070",
                  sub: result.rrRatio >= 2 ? "Excelente" : result.rrRatio >= 1 ? "Aceptable" : result.rrRatio > 0 ? "Negativo — peligroso" : "Definí un TP",
                },
                {
                  label: "LEVERAGE",
                  value: `${leverage}x`,
                  color: parseInt(leverage) >= 50 ? "#ff1744" : parseInt(leverage) >= 20 ? "#ffd700" : "#00e676",
                  sub: parseInt(leverage) >= 50 ? "Extremo" : parseInt(leverage) >= 20 ? "Alto" : "Manejable",
                },
              ].map(m => (
                <div key={m.label} className="bg-[#060a0f] p-5 text-center">
                  <div className="font-space text-[8px] text-[#5a8898] tracking-[0.12em] uppercase mb-2">{m.label}</div>
                  <div className="font-bebas text-3xl mb-1" style={{ color: m.color }}>{m.value}</div>
                  <div className="font-space text-[9px]" style={{ color: m.color }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="space-y-2">
                <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.3em] uppercase">ALERTAS DETECTADAS</div>
                {result.warnings.map((w, i) => {
                  const wc = w.level === "fatal" ? "#ff1744" : w.level === "high" ? "#ff6d00" : "#ffd700";
                  const wi = w.level === "fatal" ? "💀" : w.level === "high" ? "⚠" : "📌";
                  return (
                    <div key={i} className="flex items-start gap-3 p-4 border"
                      style={{ borderColor: `${wc}33`, background: `${wc}08` }}>
                      <span className="shrink-0 mt-0.5">{wi}</span>
                      <span className="font-space text-[12px]" style={{ color: wc }}>{w.text}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recommendation */}
            <div className="border border-[#00e5ff22] bg-[#00e5ff05] p-6">
              <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.3em] uppercase mb-2">RECOMENDACIÓN PSY</div>
              <p className="font-space text-[14px] text-white leading-relaxed">{result.recommendation}</p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button onClick={reset}
                className="py-4 font-space text-[12px] font-bold tracking-[0.2em] uppercase border border-[#1a2535] text-[#7ab3c8] hover:border-[#00e5ff33] hover:text-[#00e5ff] transition-all">
                ← ANALIZAR OTRO TRADE
              </button>
              <Link href="/psy-autopsy"
                className="py-4 font-space text-[12px] font-bold tracking-[0.2em] uppercase border border-[#e040fb33] text-[#e040fb] hover:bg-[#e040fb10] transition-all text-center no-underline flex items-center justify-center">
                🧠 PSY AUTOPSY IA
              </Link>
              <Link href="/pricing"
                className="py-4 font-space text-[12px] font-bold tracking-[0.2em] uppercase bg-[#00e5ff] text-[#020408] hover:bg-[#00cfee] transition-all text-center no-underline flex items-center justify-center">
                ACCESO COMPLETO →
              </Link>
            </div>

            <p className="text-center font-space text-[10px] text-[#5a8898]">
              Este análisis es educativo. No es asesoramiento financiero.
              El mercado puede comportarse de formas inesperadas.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
