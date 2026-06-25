import { useState, useMemo } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/site-nav";

const ERROR_TYPES = [
  {
    id: "fomo",
    icon: "🔥",
    label: "FOMO — Entraste tarde al movimiento",
    color: "#ff6d00",
    desc: "Compraste el pico porque el precio ya subía. Clásica trampa del mercado.",
    avgLoss: 0.035,
  },
  {
    id: "no_sl",
    icon: "💀",
    label: "SIN STOP LOSS — Dejaste correr la pérdida",
    color: "#ff1744",
    desc: "Esperabas que volviera. No volvió. O volvió, pero te quedaste en el drawdown semanas.",
    avgLoss: 0.08,
  },
  {
    id: "revenge",
    icon: "😤",
    label: "REVENGE TRADING — Operaste para recuperar",
    color: "#e040fb",
    desc: "Después de perder, abriste otra posición más grande para recuperar. Y perdiste más.",
    avgLoss: 0.06,
  },
  {
    id: "overlev",
    icon: "⚡",
    label: "SOBREALANCAMIENTO — Leverage excesivo",
    color: "#ffd700",
    desc: "Usaste más apalancamiento del que podías manejar. Una corrección normal te liquidó.",
    avgLoss: 0.12,
  },
  {
    id: "early_exit",
    icon: "🏃",
    label: "SALIDA TEMPRANA — Cerraste antes del TP",
    color: "#00bcd4",
    desc: "El miedo te sacó del trade antes de tiempo. El precio llegó a tu TP sin vos.",
    avgLoss: 0.03,
  },
  {
    id: "overtrading",
    icon: "🎰",
    label: "SOBRETRADING — Operaste de más",
    color: "#7c4dff",
    desc: "Más operaciones = más comisiones + más errores emocionales. La cantidad destruye la calidad.",
    avgLoss: 0.025,
  },
];

interface ErrorCount {
  [key: string]: number;
}

function formatUsd(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function CostoErroresGate() {
  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani flex flex-col">
      <SiteNav />
      <div className="flex-1 flex items-center justify-center px-6 pt-20">
        <div className="border border-[#1a2535] bg-[#060a0f] p-10 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#ff1744] to-transparent" />
          <div className="text-5xl mb-5">💸</div>
          <div className="font-sharetech text-[9px] tracking-[0.4em] text-[#ff1744] mb-3">ACCESO RESTRINGIDO</div>
          <div className="font-bebas text-3xl text-white mb-2">COSTO DE MIS ERRORES</div>
          <div className="font-space text-[12px] text-[#7a9aaa] mb-6 leading-relaxed">
            La calculadora de errores de trading está disponible para miembros con plan
            <span className="text-[#ff1744] font-bold"> Básico</span> o superior.
          </div>
          <div className="border border-[#ff174422] bg-[#020408] px-5 py-4 mb-6 text-left">
            <div className="font-sharetech text-[10px] tracking-[0.2em] text-[#ff1744] mb-3">⬡ INCLUÍDO DESDE $9/mes</div>
            <div className="space-y-1.5">
              {["Calculá exactamente cuánto te costaron tus errores","FOMO, revenge trading, sobrealancamiento y más","Desglose en dólares por tipo de error","Proyección anual de pérdidas evitables","Plan de acción para corregir cada patrón"].map(f => (
                <div key={f} className="flex items-center gap-2 font-space text-[11px] text-[#8a9ab0]">
                  <span className="text-[#ff1744] text-[9px]">✦</span> {f}
                </div>
              ))}
            </div>
          </div>
          <a href="/pricing" className="block w-full py-3 bg-[#ff1744] text-white font-space text-[12px] font-bold tracking-[0.2em] uppercase text-center no-underline hover:bg-[#cc0033] transition-colors">
            VER PLANES →
          </a>
          <div className="mt-4 font-space text-[10px] text-[#5a8898]">
            ¿Ya sos miembro? <a href="/login" className="text-[#ff1744] hover:underline">Iniciá sesión</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CostoErrores() {
  const auth = (() => { try { return JSON.parse(localStorage.getItem("psyko_auth") ?? "null") as { role?: string; plan?: string } | null; } catch { return null; } })();
  const isAllowed = ["aprendiz","educacion","trader","institucional"].includes(auth?.plan ?? "") || auth?.role === "superadmin" || auth?.role === "operator";
  if (!isAllowed) return <CostoErroresGate />;

  const [capital, setCapital]   = useState("5000");
  const [months, setMonths]     = useState("6");
  const [errors, setErrors]     = useState<ErrorCount>({});
  const [analyzed, setAnalyzed] = useState(false);

  const cap = parseFloat(capital) || 0;
  const mon = parseFloat(months) || 1;

  const result = useMemo(() => {
    if (!analyzed || cap <= 0) return null;

    let totalLost = 0;
    const breakdown: { id: string; icon: string; label: string; color: string; count: number; lost: number; desc: string }[] = [];

    ERROR_TYPES.forEach(et => {
      const count = errors[et.id] ?? 0;
      if (count > 0) {
        const lost = count * cap * et.avgLoss;
        totalLost += lost;
        breakdown.push({ ...et, count, lost });
      }
    });

    breakdown.sort((a, b) => b.lost - a.lost);

    const projectedYear = (totalLost / mon) * 12;
    const returnIfFixed = cap * 0.15 * (mon / 12);
    const opportunityCost = totalLost + returnIfFixed;

    const worstError = breakdown[0] ?? null;
    const recoveryTrades = totalLost > 0 ? Math.ceil(totalLost / (cap * 0.02)) : 0;

    return {
      totalLost,
      breakdown,
      projectedYear,
      opportunityCost,
      worstError,
      recoveryTrades,
      percentOfCapital: (totalLost / cap) * 100,
    };
  }, [analyzed, cap, mon, errors, capital, months]);

  const totalErrors = Object.values(errors).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />
      <div className="pt-28 pb-20 px-4 md:px-10 max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="font-space text-[10px] text-[#ffd700] tracking-[0.4em] uppercase mb-3">
            💸 CALCULADORA DE ERRORES
          </div>
          <h1 className="font-bebas text-6xl md:text-8xl leading-none mb-4">
            MIS ERRORES<br /><span className="text-[#ff1744]">CUESTAN $X</span>
          </h1>
          <p className="font-space text-[12px] text-[#7ab3c8] max-w-xl mx-auto leading-relaxed">
            Ponerle número a tus errores psicológicos es lo más duro — y lo más necesario.<br />
            Solo cuando duele de verdad, cambiás.
          </p>
        </div>

        {!analyzed ? (
          <div className="space-y-8">
            {/* Capital + Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-space text-[10px] text-[#ffd700] tracking-[0.2em] uppercase block mb-2">
                  TU CAPITAL DE TRADING ($)
                </label>
                <input type="number" value={capital} onChange={e => setCapital(e.target.value)}
                  placeholder="5000"
                  className="w-full bg-[#060a0f] border border-[#ffd70033] px-4 py-4 font-bebas text-4xl text-[#ffd700] focus:outline-none" />
              </div>
              <div>
                <label className="font-space text-[10px] text-[#ffd700] tracking-[0.2em] uppercase block mb-2">
                  PERÍODO A ANALIZAR (meses)
                </label>
                <input type="number" value={months} onChange={e => setMonths(e.target.value)}
                  min="1" max="24" placeholder="6"
                  className="w-full bg-[#060a0f] border border-[#ffd70033] px-4 py-4 font-bebas text-4xl text-[#ffd700] focus:outline-none" />
              </div>
            </div>

            {/* Error types */}
            <div>
              <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.3em] uppercase mb-4">
                ¿CUÁNTAS VECES COMETISTE CADA ERROR?
              </div>
              <div className="space-y-3">
                {ERROR_TYPES.map(et => {
                  const count = errors[et.id] ?? 0;
                  return (
                    <div key={et.id} className="border border-[#1a2535] bg-[#060a0f] p-5"
                      style={{ borderColor: count > 0 ? `${et.color}44` : "#1a2535" }}>
                      <div className="flex items-start gap-4">
                        <span className="text-2xl shrink-0 mt-1">{et.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-space text-[12px] font-bold mb-1" style={{ color: count > 0 ? et.color : "#7a9aaa" }}>
                            {et.label}
                          </div>
                          <p className="font-space text-[10px] text-[#7ab3c8] leading-relaxed">{et.desc}</p>
                          {count > 0 && cap > 0 && (
                            <div className="font-space text-[10px] mt-2" style={{ color: et.color }}>
                              Costo estimado: {formatUsd(count * cap * et.avgLoss)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setErrors(p => ({ ...p, [et.id]: Math.max(0, (p[et.id] ?? 0) - 1) }))}
                            className="w-8 h-8 border border-[#1a2535] text-[#7ab3c8] hover:border-[#ff174444] hover:text-[#ff1744] transition-all font-bold text-lg flex items-center justify-center">
                            −
                          </button>
                          <span className="font-bebas text-2xl w-8 text-center" style={{ color: count > 0 ? et.color : "#2a4a5a" }}>
                            {count}
                          </span>
                          <button
                            onClick={() => setErrors(p => ({ ...p, [et.id]: (p[et.id] ?? 0) + 1 }))}
                            className="w-8 h-8 border border-[#1a2535] text-[#7ab3c8] hover:border-[#00e67644] hover:text-[#00e676] transition-all font-bold text-lg flex items-center justify-center">
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setAnalyzed(true)}
              disabled={totalErrors === 0 || cap <= 0}
              className="w-full py-5 font-bebas text-3xl tracking-[0.15em] transition-all"
              style={{
                background: totalErrors > 0 && cap > 0 ? "#ff1744" : "#1a2535",
                color: totalErrors > 0 && cap > 0 ? "white" : "#2a4a5a",
              }}>
              💸 CALCULAR EL COSTO DE MIS ERRORES
            </button>
          </div>
        ) : result ? (
          <div className="space-y-6">
            {/* Main number */}
            <div className="border-2 border-[#ff174444] bg-[#ff174408] p-10 text-center">
              <div className="font-space text-[10px] text-[#ff1744] tracking-[0.4em] uppercase mb-4">
                TUS ERRORES PSICOLÓGICOS TE COSTARON
              </div>
              <div className="font-bebas text-8xl md:text-9xl text-[#ff1744] leading-none mb-3">
                {formatUsd(result.totalLost)}
              </div>
              <div className="font-space text-[13px] text-[#7a9aaa]">
                en {months} {parseInt(months) === 1 ? "mes" : "meses"} — {result.percentOfCapital.toFixed(1)}% de tu capital de trading
              </div>

              {result.worstError && (
                <div className="mt-6 border border-[#ff174433] bg-[#ff174410] p-4 inline-block">
                  <div className="font-space text-[9px] text-[#ff1744] tracking-[0.2em] mb-1">TU ERROR MÁS CARO</div>
                  <div className="font-space text-[13px] text-white">{result.worstError.icon} {result.worstError.label}</div>
                  <div className="font-bebas text-2xl" style={{ color: result.worstError.color }}>
                    {formatUsd(result.worstError.lost)} perdidos
                  </div>
                </div>
              )}
            </div>

            {/* Key projections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1a2535] border border-[#1a2535]">
              {[
                {
                  label: "PROYECCIÓN ANUAL",
                  value: formatUsd(result.projectedYear),
                  sub: "Si seguís así 12 meses",
                  color: "#ff1744",
                },
                {
                  label: "COSTO DE OPORTUNIDAD",
                  value: formatUsd(result.opportunityCost),
                  sub: "Lo perdido + lo que habrías ganado",
                  color: "#ffd700",
                },
                {
                  label: "TRADES PARA RECUPERAR",
                  value: `${result.recoveryTrades}`,
                  sub: "A riesgo profesional de 2%/trade",
                  color: "#00e5ff",
                },
              ].map(m => (
                <div key={m.label} className="bg-[#060a0f] p-6 text-center">
                  <div className="font-space text-[8px] text-[#5a8898] tracking-[0.12em] uppercase mb-2">{m.label}</div>
                  <div className="font-bebas text-4xl mb-1" style={{ color: m.color }}>{m.value}</div>
                  <div className="font-space text-[9px] text-[#7ab3c8]">{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Breakdown */}
            {result.breakdown.length > 0 && (
              <div>
                <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.3em] uppercase mb-3">DESGLOSE POR ERROR</div>
                <div className="space-y-2">
                  {result.breakdown.map(b => {
                    const pct = result.totalLost > 0 ? (b.lost / result.totalLost) * 100 : 0;
                    return (
                      <div key={b.id} className="border border-[#1a2535] bg-[#060a0f] p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span>{b.icon}</span>
                            <span className="font-space text-[12px]" style={{ color: b.color }}>{b.label}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bebas text-2xl" style={{ color: b.color }}>{formatUsd(b.lost)}</div>
                            <div className="font-space text-[9px] text-[#7ab3c8]">{b.count}x · {pct.toFixed(0)}% del total</div>
                          </div>
                        </div>
                        <div className="h-1 bg-[#1a2535] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: b.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Message */}
            <div className="border border-[#00e5ff22] bg-[#00e5ff05] p-6">
              <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.3em] uppercase mb-3">QUÉ SIGNIFICA ESTO</div>
              <p className="font-space text-[13px] text-[#c0d8e8] leading-relaxed">
                Estos <strong className="text-white">{formatUsd(result.totalLost)}</strong> no los perdiste por el mercado.
                Los perdiste por decisiones. El mercado no te robó — tus emociones te cobraron.
                La buena noticia: las emociones se pueden entrenar. Cada uno de esos errores tiene un sistema que lo elimina.
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button onClick={() => { setAnalyzed(false); setErrors({}); }}
                className="py-4 font-space text-[11px] font-bold tracking-[0.2em] uppercase border border-[#1a2535] text-[#7ab3c8] hover:border-[#ffd70033] hover:text-[#ffd700] transition-all">
                ← RECALCULAR
              </button>
              <Link href="/adn-trader"
                className="py-4 font-space text-[11px] font-bold tracking-[0.2em] uppercase border border-[#e040fb33] text-[#e040fb] hover:bg-[#e040fb10] transition-all text-center no-underline flex items-center justify-center">
                🧬 MI ADN DE TRADER
              </Link>
              <Link href="/pricing"
                className="py-4 font-space text-[11px] font-bold tracking-[0.2em] uppercase bg-[#ffd700] text-[#020408] hover:bg-[#ffe033] transition-all text-center no-underline flex items-center justify-center">
                CORREGIR MIS ERRORES →
              </Link>
            </div>

            <p className="text-center font-space text-[10px] text-[#5a8898]">
              Los valores son estimaciones basadas en promedios de comportamiento en mercados de crypto futuros.
              No constituyen asesoramiento financiero.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
