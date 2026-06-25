import React, { useState, useCallback } from "react";
import SiteNav from "@/components/site-nav";

type Side = "long" | "short";
type SLMode = "price" | "percent" | "pips";

export default function Calculadora() {
  const [capital, setCapital]     = useState("10000");
  const [riskPct, setRiskPct]     = useState("1");
  const [entry, setEntry]         = useState("");
  const [sl, setSl]               = useState("");
  const [tp, setTp]               = useState("");
  const [leverage, setLeverage]   = useState("1");
  const [side, setSide]           = useState<Side>("long");
  const [slMode, setSlMode]       = useState<SLMode>("price");
  const [copied, setCopied]       = useState(false);

  const num = (v: string) => parseFloat(v.replace(",", ".")) || 0;

  const calc = useCallback(() => {
    const cap  = num(capital);
    const risk = num(riskPct) / 100;
    const ent  = num(entry);
    const lev  = Math.max(1, num(leverage));

    if (!cap || !risk || !ent) return null;

    let slPrice = 0;
    if (slMode === "price") {
      slPrice = num(sl);
    } else if (slMode === "percent") {
      const pct = num(sl) / 100;
      slPrice = side === "long" ? ent * (1 - pct) : ent * (1 + pct);
    } else {
      const pips = num(sl);
      slPrice = side === "long" ? ent - pips : ent + pips;
    }
    if (!slPrice || slPrice <= 0) return null;

    const slPct = Math.abs(ent - slPrice) / ent;
    if (slPct <= 0) return null;

    const dollarRisk      = cap * risk;
    const positionValue   = dollarRisk / slPct;
    const positionCoins   = positionValue / ent;
    const margin          = positionValue / lev;

    let tpPrice = num(tp);
    let rrRatio: number | null = null;
    let dollarProfit: number | null = null;
    if (tpPrice > 0) {
      const tpDist = Math.abs(tpPrice - ent);
      const slDist = Math.abs(ent - slPrice);
      rrRatio = tpDist / slDist;
      dollarProfit = positionCoins * tpDist * (side === "long" ? 1 : -1) * Math.sign(tpPrice - ent);
      dollarProfit = Math.abs(dollarProfit);
    }

    const slPip  = Math.abs(ent - slPrice);
    const pctRisk = slPct * 100;

    return { dollarRisk, positionValue, positionCoins, margin, slPrice, slPct: pctRisk, slPip, rrRatio, dollarProfit };
  }, [capital, riskPct, entry, sl, tp, leverage, side, slMode]);

  const result = calc();

  const fmt = (n: number, dec = 2) =>
    n >= 1000 ? n.toLocaleString("es-EC", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : n.toFixed(dec);

  const copyResult = () => {
    if (!result) return;
    const text = [
      `📐 POSITION SIZE CALCULATOR — PSYCHOMETRIKS`,
      `Capital: $${fmt(num(capital))}  |  Riesgo: ${riskPct}%`,
      `Entrada: $${entry}  |  SL: $${fmt(result.slPrice, 4)}`,
      ``,
      `💰 Riesgo en USD: $${fmt(result.dollarRisk)}`,
      `📦 Posición USD: $${fmt(result.positionValue)}`,
      `🪙 Cantidad: ${fmt(result.positionCoins, 4)} coins`,
      `🏛 Margen usado: $${fmt(result.margin)}`,
      result.rrRatio ? `🎯 R/R: 1:${fmt(result.rrRatio)}  |  Ganancia: +$${fmt(result.dollarProfit!)}` : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const InputField = ({ label, value, onChange, placeholder, suffix }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; suffix?: string;
  }) => (
    <div>
      <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">{label}</label>
      <div className="flex">
        <input
          type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="flex-1 bg-[#060a0f] border border-[#1a2535] text-white font-mono text-[14px] px-3 py-2.5 focus:outline-none focus:border-[#00e5ff44] transition-colors"
        />
        {suffix && <span className="font-space text-[11px] text-[#7ab3c8] bg-[#0d1520] border border-l-0 border-[#1a2535] px-3 flex items-center">{suffix}</span>}
      </div>
    </div>
  );

  const riskLevels = [0.5, 1, 1.5, 2, 3, 5];

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      <div className="pt-28 pb-16 px-4 md:px-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-3">Herramientas</div>
          <h1 className="font-bebas text-5xl md:text-7xl leading-none mb-3">
            POSITION SIZE<br /><span className="text-[#00e5ff]">CALCULATOR</span>
          </h1>
          <p className="font-space text-[12px] text-[#7ab3c8] max-w-lg leading-relaxed">
            Calculá tu tamaño de posición óptimo en base a tu capital y riesgo definido. Nunca arriesgues más de lo que planificaste.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="space-y-5">
            {/* Side */}
            <div className="border border-[#1a2535] bg-[#060a0f] p-5">
              <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase mb-3">DIRECCIÓN</div>
              <div className="grid grid-cols-2 gap-px bg-[#1a2535]">
                {(["long", "short"] as Side[]).map(s => (
                  <button key={s} onClick={() => setSide(s)}
                    className="py-3 font-space text-[11px] font-bold tracking-[0.15em] uppercase transition-all"
                    style={{
                      background: side === s ? (s === "long" ? "#00e67618" : "#ff174418") : "#060a0f",
                      color: side === s ? (s === "long" ? "#00e676" : "#ff1744") : "#2a4a5a",
                    }}>
                    {s === "long" ? "▲ LONG" : "▼ SHORT"}
                  </button>
                ))}
              </div>
            </div>

            {/* Capital & Risk */}
            <div className="border border-[#1a2535] bg-[#060a0f] p-5 space-y-4">
              <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase mb-1">CAPITAL Y RIESGO</div>
              <InputField label="Capital total" value={capital} onChange={setCapital} placeholder="10000" suffix="USDT" />
              <div>
                <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">Riesgo por operación</label>
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  {riskLevels.map(r => (
                    <button key={r} onClick={() => setRiskPct(String(r))}
                      className="font-space text-[10px] px-2.5 py-1 border transition-all"
                      style={{
                        borderColor: riskPct === String(r) ? "#00e5ff" : "#1a2535",
                        color: riskPct === String(r) ? "#00e5ff" : "#4a6070",
                        background: riskPct === String(r) ? "#00e5ff12" : "transparent",
                      }}>
                      {r}%
                    </button>
                  ))}
                </div>
                <InputField label="" value={riskPct} onChange={setRiskPct} placeholder="1" suffix="%" />
                {parseFloat(riskPct) > 3 && (
                  <div className="mt-2 font-space text-[10px] text-[#ff1744] flex items-center gap-1.5">
                    ⚠️ Riesgo alto — los profesionales usan máx 1-2% por operación
                  </div>
                )}
              </div>
            </div>

            {/* Entry / SL / TP */}
            <div className="border border-[#1a2535] bg-[#060a0f] p-5 space-y-4">
              <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase mb-1">PRECIOS</div>
              <InputField label="Precio de entrada" value={entry} onChange={setEntry} placeholder="65000" suffix="$" />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase">Stop Loss</label>
                  <div className="flex gap-1">
                    {(["price", "percent", "pips"] as SLMode[]).map(m => (
                      <button key={m} onClick={() => setSlMode(m)}
                        className="font-space text-[9px] px-2 py-0.5 border transition-all"
                        style={{ borderColor: slMode === m ? "#ff1744" : "#1a2535", color: slMode === m ? "#ff1744" : "#4a6070" }}>
                        {m === "price" ? "$" : m === "percent" ? "%" : "PIPS"}
                      </button>
                    ))}
                  </div>
                </div>
                <InputField
                  label="" value={sl} onChange={setSl}
                  placeholder={slMode === "price" ? "63500" : slMode === "percent" ? "2.3" : "500"}
                  suffix={slMode === "price" ? "$" : slMode === "percent" ? "%" : "pips"}
                />
              </div>

              <InputField label="Take Profit (opcional)" value={tp} onChange={setTp} placeholder="70000" suffix="$" />
              <InputField label="Apalancamiento" value={leverage} onChange={setLeverage} placeholder="1" suffix="x" />
            </div>
          </div>

          {/* Result Panel */}
          <div className="space-y-5">
            {result ? (
              <>
                {/* Main result */}
                <div className="border bg-[#060a0f] p-6"
                  style={{ borderColor: side === "long" ? "#00e67633" : "#ff174433", background: side === "long" ? "linear-gradient(135deg,rgba(0,230,118,0.05),transparent)" : "linear-gradient(135deg,rgba(255,23,68,0.05),transparent)" }}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="font-space text-[10px] tracking-[0.3em] uppercase" style={{ color: side === "long" ? "#00e676" : "#ff1744" }}>
                        {side === "long" ? "▲ LONG" : "▼ SHORT"} — {riskPct}% RIESGO
                      </div>
                      <div className="font-bebas text-4xl text-white mt-0.5">RESULTADO</div>
                    </div>
                    <button onClick={copyResult}
                      className="font-space text-[10px] px-3 py-2 border border-[#1a2535] text-[#7ab3c8] hover:border-[#00e5ff44] hover:text-[#00e5ff] transition-colors">
                      {copied ? "✓ COPIADO" : "📋 COPIAR"}
                    </button>
                  </div>

                  {/* Big numbers */}
                  <div className="grid grid-cols-2 gap-px bg-[#1a2535] mb-5">
                    {[
                      { label: "RIESGO EN USD",    value: `$${fmt(result.dollarRisk)}`,    color: "#ff1744" },
                      { label: "POSICIÓN TOTAL",   value: `$${fmt(result.positionValue)}`,  color: "#ffd700" },
                      { label: "CANTIDAD (COINS)",  value: fmt(result.positionCoins, 4),    color: "#00e5ff" },
                      { label: "MARGEN REQUERIDO", value: `$${fmt(result.margin)}`,         color: "#e040fb" },
                    ].map((item, i) => (
                      <div key={i} className="bg-[#060a0f] p-4 text-center">
                        <div className="font-space text-[9px] text-[#5a8898] tracking-[0.15em] mb-1">{item.label}</div>
                        <div className="font-mono text-[18px] font-black" style={{ color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* SL details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center py-2 border-b border-[#1a2535]">
                      <span className="font-space text-[11px] text-[#7ab3c8]">SL calculado</span>
                      <span className="font-mono text-[13px] text-[#ff1744]">${fmt(result.slPrice, 4)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#1a2535]">
                      <span className="font-space text-[11px] text-[#7ab3c8]">Distancia al SL</span>
                      <span className="font-mono text-[13px] text-white">{fmt(result.slPct, 2)}%</span>
                    </div>
                    {num(leverage) > 1 && (
                      <div className="flex justify-between items-center py-2 border-b border-[#1a2535]">
                        <span className="font-space text-[11px] text-[#7ab3c8]">Apalancamiento</span>
                        <span className="font-mono text-[13px] text-[#ffd700]">{num(leverage)}x</span>
                      </div>
                    )}
                  </div>

                  {/* R/R */}
                  {result.rrRatio !== null && result.dollarProfit !== null && (
                    <div className="p-4 border border-[#00e67633] bg-[#00e67608]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-space text-[10px] text-[#00e676] tracking-[0.1em]">🎯 RATIO R/R</span>
                        <span className="font-mono text-[20px] font-black text-[#00e676]">1 : {fmt(result.rrRatio)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-space text-[11px] text-[#7ab3c8]">Ganancia potencial</span>
                        <span className="font-mono text-[16px] font-bold text-[#00e676]">+${fmt(result.dollarProfit)}</span>
                      </div>
                      {result.rrRatio < 1 && (
                        <div className="mt-2 font-space text-[10px] text-[#ff1744]">⚠️ R/R menor a 1:1 — no recomendado</div>
                      )}
                      {result.rrRatio >= 2 && (
                        <div className="mt-2 font-space text-[10px] text-[#00e676]">✅ Excelente R/R — operación bien estructurada</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Visual risk bar */}
                <div className="border border-[#1a2535] bg-[#060a0f] p-5">
                  <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase mb-3">EXPOSICIÓN DE CARTERA</div>
                  <div className="h-4 bg-[#0d1520] border border-[#1a2535] relative overflow-hidden mb-2">
                    <div className="h-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, parseFloat(riskPct) * 10)}%`,
                        background: parseFloat(riskPct) > 3 ? "#ff1744" : parseFloat(riskPct) > 2 ? "#ffd700" : "#00e676",
                      }} />
                  </div>
                  <div className="flex justify-between font-space text-[10px] text-[#5a8898]">
                    <span>0% (sin riesgo)</span>
                    <span style={{ color: parseFloat(riskPct) > 3 ? "#ff1744" : parseFloat(riskPct) > 2 ? "#ffd700" : "#00e676" }}>
                      {riskPct}% de tu cartera en riesgo
                    </span>
                    <span>10%+</span>
                  </div>
                </div>

                {/* Rules */}
                <div className="border border-[#ffd70022] bg-[#060a0f] p-5">
                  <div className="font-space text-[10px] text-[#ffd700] tracking-[0.2em] uppercase mb-3">⚡ REGLAS DE GESTIÓN PSY</div>
                  <div className="space-y-2">
                    {[
                      { rule: "Máximo 1-2% de riesgo por operación", ok: parseFloat(riskPct) <= 2 },
                      { rule: "R/R mínimo de 1:2 para operar", ok: result.rrRatio !== null && result.rrRatio >= 2 },
                      { rule: "SL siempre definido antes de entrar", ok: !!sl },
                      { rule: "Nunca promediar contra la posición", ok: true },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center gap-2 font-space text-[11px]" style={{ color: r.ok ? "#4a6070" : "#ff174480" }}>
                        <span style={{ color: r.ok ? "#00e676" : "#ff1744" }}>{r.ok ? "✔" : "✕"}</span>
                        {r.rule}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="border border-[#1a2535] bg-[#060a0f] p-10 text-center">
                <div className="text-4xl mb-4">📐</div>
                <div className="font-space text-[12px] text-[#5a8898] leading-relaxed">
                  Ingresá tu capital, riesgo y precio de entrada<br />para calcular el tamaño óptimo de tu posición.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick reference */}
        <div className="mt-8 border border-[#1a2535] bg-[#060a0f] p-6">
          <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.3em] uppercase mb-4">GUÍA RÁPIDA — FÓRMULA</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Riesgo en $", formula: "Capital × % Riesgo", example: "$10,000 × 1% = $100" },
              { label: "Tamaño posición", formula: "Riesgo $ ÷ Distancia SL%", example: "$100 ÷ 2% = $5,000" },
              { label: "Ratio R/R", formula: "Distancia TP ÷ Distancia SL", example: "200 pips ÷ 100 pips = 2:1" },
            ].map((item, i) => (
              <div key={i} className="border border-[#1a2535] p-4 bg-[#080d14]">
                <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.1em] mb-1">{item.label}</div>
                <div className="font-mono text-[13px] text-[#00e5ff] mb-2">{item.formula}</div>
                <div className="font-space text-[11px] text-[#5a8898]">ej: {item.example}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
