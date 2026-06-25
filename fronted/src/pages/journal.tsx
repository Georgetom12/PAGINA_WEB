import React, { useState, useEffect, useCallback, useMemo } from "react";
import SiteNav from "@/components/site-nav";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");
const STORAGE_KEY = "psy_journal_v1";

interface Trade {
  id: string;
  date: string;
  asset: string;
  direction: "LONG" | "SHORT";
  entry: number;
  exit: number;
  size: number;
  result: number;
  rMultiple: number;
  emotions: string[];
  mistakes: string[];
  notes: string;
  setup: string;
  whyReally?: string;
  aiAnalysis?: string;
  aiTs?: number;
}

const EMOTIONS = ["FOMO","Miedo","Avaricia","Confianza","Frustración","Calma","Venganza","Impaciencia","Euforia","Duda"];
const MISTAKES = ["Entré tarde","SL muy ajustado","SL muy amplio","Sin plan previo","Moví el SL","Sobre-apalancado","Ignoré tendencia","FOMO en TP","Promedié en contra","Sin gestión de riesgo"];
const SETUPS   = ["Ruptura de estructura","Retest de soporte","Imbalance / FVG","Liquidity grab","OB institucional","Supply/Demand","Tendencia clara","Scalp rápido","Noticias macro","Otro"];
const WHY_OPTS = ["Estrategia clara","FOMO — precio moviéndose","Aburrimiento","Impulso","Recuperar pérdida","Vi que otros entraron","Setup técnico limpio","Otro"];

function loadTrades(): Trade[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function saveTrades(trades: Trade[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
}
const emptyForm = (): Omit<Trade, "id"|"rMultiple"|"result"> => ({
  date: new Date().toISOString().split("T")[0],
  asset: "BTC/USDT", direction: "LONG",
  entry: 0, exit: 0, size: 100,
  emotions: [], mistakes: [], notes: "", setup: "", whyReally: "",
});
function calcR(entry: number, exit: number, dir: "LONG"|"SHORT", size: number) {
  if (!entry || !exit) return { pnl: 0, r: 0 };
  const pct = dir === "LONG" ? (exit - entry) / entry : (entry - exit) / entry;
  return { pnl: parseFloat((pct * size).toFixed(2)), r: parseFloat((pct * 100).toFixed(2)) };
}
function toggle(arr: string[], v: string) { return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]; }

// ─── FOMO checker logic ──────────────────────────────────────────────
interface FomoCheck {
  setup: string;
  why: string;
  hasSL: boolean;
  hasTP: boolean;
  emotion: string;
  timeInTrade: string;
}
function analyzeFomo(check: FomoCheck): { verdict: string; color: string; risk: number; warnings: string[]; verdict_short: string } {
  const warnings: string[] = [];
  let risk = 0;

  if (check.why.includes("FOMO"))         { risk += 35; warnings.push("Entrás porque el precio se está moviendo — eso es comprar el techo."); }
  if (check.why.includes("Aburrimiento")) { risk += 40; warnings.push("El aburrimiento es la razón #1 por la que traders destruyen cuentas."); }
  if (check.why.includes("Recuperar"))    { risk += 50; warnings.push("Revenge trading detectado. Probabilidad de pérdida adicional: muy alta."); }
  if (check.why.includes("otros entraron")){ risk += 30; warnings.push("Siguiendo a otros sin tu propio análisis = exposición sin convicción."); }
  if (check.why.includes("Impulso"))      { risk += 25; warnings.push("Entrada impulsiva sin plan = SL mental que nunca se respeta."); }
  if (!check.hasSL)                       { risk += 30; warnings.push("Sin stop-loss definido. Una operación sin SL no es trading, es apuesta."); }
  if (!check.hasTP)                       { risk += 10; warnings.push("Sin take-profit claro. ¿Cuándo salís? El mercado decide por vos."); }
  if (check.emotion === "FOMO" || check.emotion === "Euforia")    { risk += 20; warnings.push("Euforia o FOMO activo = juicio comprometido. Los mejores trades se sienten aburridos."); }
  if (check.emotion === "Venganza" || check.emotion === "Frustración") { risk += 35; warnings.push("Estado emocional negativo. Los traders profesionales esperan neutralidad emocional."); }
  if (check.timeInTrade === "Menos de 5 min") { risk += 15; warnings.push("Análisis demasiado rápido. ¿Revisaste todas las temporalidades?"); }
  if (!check.setup || check.setup === "Otro") { risk += 20; warnings.push("Setup no definido. Sin criterio de entrada objetivo."); }

  risk = Math.min(risk, 99);

  let verdict = "", color = "", verdict_short = "";
  if (risk >= 70) { verdict = "NO ENTRES. Alta probabilidad de liquidación."; verdict_short = "⛔ NO ENTRAR"; color = "#ff1744"; }
  else if (risk >= 45) { verdict = "CUIDADO. El trade tiene señales de alerta importantes."; verdict_short = "⚠ ALTO RIESGO"; color = "#ff6d00"; }
  else if (risk >= 25) { verdict = "PRECAUCIÓN. Revisá el SL/TP y tu estado emocional antes de entrar."; verdict_short = "🟡 REVISAR"; color = "#ffd700"; }
  else { verdict = "Setup razonable. Procedé con disciplina y gestión de riesgo."; verdict_short = "✓ PROCEDER"; color = "#00e676"; }

  return { verdict, color, risk, warnings, verdict_short };
}

// ─── Sub-components ──────────────────────────────────────────────────
function CheckGroup({ items, selected, onChange, color }: { items: string[]; selected: string[]; onChange: (v: string[]) => void; color: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <button key={item} type="button" onClick={() => onChange(toggle(selected, item))}
          className="font-space text-[10px] px-2.5 py-1 border transition-all"
          style={{ borderColor: selected.includes(item) ? color : "#1a2535", color: selected.includes(item) ? color : "#4a6070", background: selected.includes(item) ? `${color}15` : "transparent" }}>
          {item}
        </button>
      ))}
    </div>
  );
}

function TradeStats({ trades }: { trades: Trade[] }) {
  const closed = trades.filter(t => t.exit > 0);
  const wins = closed.filter(t => t.result > 0).length;
  const wr = closed.length ? Math.round((wins / closed.length) * 100) : 0;
  const totalPnl = closed.reduce((s, t) => s + t.result, 0);
  const avgR = closed.length ? closed.reduce((s, t) => s + t.rMultiple, 0) / closed.length : 0;
  const emotionFreq: Record<string, number> = {};
  const mistakeFreq: Record<string, number> = {};
  trades.forEach(t => {
    t.emotions.forEach(e => { emotionFreq[e] = (emotionFreq[e] ?? 0) + 1; });
    t.mistakes.forEach(m => { mistakeFreq[m] = (mistakeFreq[m] ?? 0) + 1; });
  });
  const topEmotion = Object.entries(emotionFreq).sort(([,a],[,b]) => b-a)[0];
  const topMistake = Object.entries(mistakeFreq).sort(([,a],[,b]) => b-a)[0];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a2535] border border-[#1a2535] mb-6">
      {[
        { label: "TRADES TOTAL",  value: trades.length,                                             color: "#fff" },
        { label: "WIN RATE",      value: `${wr}%`,                                                  color: wr>=60?"#00e676":wr>=40?"#ffd700":"#ff1744" },
        { label: "PNL ACUMULADO", value: `${totalPnl>=0?"+":""}$${totalPnl.toFixed(0)}`,            color: totalPnl>=0?"#00e676":"#ff1744" },
        { label: "R PROMEDIO",    value: `${avgR>=0?"+":""}${avgR.toFixed(1)}%`,                    color: avgR>=0?"#00e5ff":"#ff6d00" },
      ].map((s,i) => (
        <div key={i} className="bg-[#060a0f] p-4 text-center">
          <div className="font-space text-[9px] text-[#5a8898] tracking-[0.1em] mb-1">{s.label}</div>
          <div className="font-mono text-[20px] font-black" style={{ color: s.color }}>{s.value}</div>
        </div>
      ))}
      {topEmotion && (
        <div className="bg-[#060a0f] p-3 col-span-1 md:col-span-2">
          <div className="font-space text-[9px] text-[#5a8898] mb-1">EMOCIÓN MÁS FRECUENTE</div>
          <div className="font-space text-[13px] text-[#ffd700] font-bold">{topEmotion[0]} <span className="text-[#7ab3c8]">({topEmotion[1]}x)</span></div>
        </div>
      )}
      {topMistake && (
        <div className="bg-[#060a0f] p-3 col-span-1 md:col-span-2">
          <div className="font-space text-[9px] text-[#5a8898] mb-1">ERROR MÁS REPETIDO</div>
          <div className="font-space text-[13px] text-[#ff6d00] font-bold">{topMistake[0]} <span className="text-[#7ab3c8]">({topMistake[1]}x)</span></div>
        </div>
      )}
    </div>
  );
}

// ─── REPETICIÓN DE ERRORES ───────────────────────────────────────────
function RepeticionTab({ trades }: { trades: Trade[] }) {
  const mistakeData = useMemo(() => {
    const freq: Record<string, { count: number; trades: Trade[]; totalLoss: number }> = {};
    trades.forEach(t => {
      t.mistakes.forEach(m => {
        if (!freq[m]) freq[m] = { count: 0, trades: [], totalLoss: 0 };
        freq[m].count++;
        freq[m].trades.push(t);
        if (t.result < 0) freq[m].totalLoss += Math.abs(t.result);
      });
    });
    return Object.entries(freq).sort(([,a],[,b]) => b.count - a.count);
  }, [trades]);

  const errorTimeline = useMemo(() => {
    return trades
      .filter(t => t.mistakes.length > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);
  }, [trades]);

  if (trades.length === 0) {
    return (
      <div className="border border-[#1a2535] bg-[#060a0f] p-16 text-center">
        <div className="text-4xl mb-4">🔁</div>
        <div className="font-bebas text-2xl text-white mb-2">SIN DATOS AÚN</div>
        <p className="font-space text-[12px] text-[#7ab3c8]">Registrá trades con errores para ver los patrones.</p>
      </div>
    );
  }

  const maxCount = mistakeData[0]?.[1].count ?? 1;

  return (
    <div className="space-y-6">
      {/* Pattern alerts */}
      {mistakeData.filter(([,v]) => v.count >= 3).length > 0 && (
        <div className="border border-[#ff174433] bg-[#ff174808] p-5">
          <div className="font-space text-[10px] text-[#ff1744] tracking-[0.3em] uppercase mb-3">⚠ PATRONES DETECTADOS</div>
          {mistakeData.filter(([,v]) => v.count >= 3).map(([mistake, data]) => (
            <div key={mistake} className="flex items-center gap-3 mb-2">
              <span className="font-bebas text-2xl text-[#ff1744]">{data.count}×</span>
              <span className="font-space text-[12px] text-white">"{mistake}"</span>
              <span className="font-space text-[10px] text-[#7ab3c8]">— Has caído {data.count} veces en este error</span>
            </div>
          ))}
        </div>
      )}

      {/* Error frequency bars */}
      <div>
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4">FRECUENCIA DE ERRORES</div>
        <div className="space-y-2">
          {mistakeData.map(([mistake, data]) => {
            const pct = (data.count / maxCount) * 100;
            const severity = data.count >= 4 ? "#ff1744" : data.count >= 2 ? "#ff6d00" : "#ffd700";
            return (
              <div key={mistake} className="border border-[#1a2535] bg-[#060a0f] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-space text-[12px] text-white">{mistake}</span>
                  <div className="flex items-center gap-3">
                    {data.totalLoss > 0 && (
                      <span className="font-space text-[10px] text-[#ff1744]">−${data.totalLoss.toFixed(0)}</span>
                    )}
                    <span className="font-bebas text-xl" style={{ color: severity }}>{data.count}×</span>
                  </div>
                </div>
                <div className="h-1.5 bg-[#1a2535] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: severity }} />
                </div>
                {data.count >= 3 && (
                  <div className="mt-2 font-space text-[10px] text-[#ff174480]">
                    ⚠ Patrón repetitivo — {data.count} ocurrencias. Esto no es mala suerte, es un hábito.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error timeline */}
      <div>
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4">TIMELINE DE ERRORES</div>
        <div className="border border-[#1a2535] divide-y divide-[#0d1520]">
          {errorTimeline.map((trade, i) => (
            <div key={trade.id} className="px-4 py-3 flex items-start gap-4">
              <div className="shrink-0 w-16 text-right">
                <div className="font-space text-[9px] text-[#5a8898]">
                  {new Date(trade.date).toLocaleDateString("es", { day:"2-digit", month:"short" })}
                </div>
              </div>
              <div className="w-px self-stretch bg-[#1a2535] relative">
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                  style={{ background: trade.result < 0 ? "#ff1744" : "#00e676" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-space text-[11px] text-white">{trade.asset}</span>
                  <span className="font-mono text-[11px]" style={{ color: trade.result >= 0 ? "#00e676" : "#ff1744" }}>
                    {trade.result >= 0 ? "+" : ""}${trade.result.toFixed(0)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {trade.mistakes.map(m => (
                    <span key={m} className="font-space text-[9px] px-1.5 py-0.5 border border-[#ff6d0033] text-[#ff6d00]">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Most dangerous combination */}
      {(() => {
        const combos: Record<string, number> = {};
        trades.forEach(t => {
          if (t.mistakes.length >= 2) {
            const key = t.mistakes.slice(0,2).sort().join(" + ");
            combos[key] = (combos[key] ?? 0) + 1;
          }
        });
        const top = Object.entries(combos).sort(([,a],[,b]) => b-a)[0];
        if (!top || top[1] < 2) return null;
        return (
          <div className="border border-[#ff6d0033] bg-[#ff6d0008] p-5">
            <div className="font-space text-[10px] text-[#ff6d00] tracking-[0.3em] uppercase mb-2">🔥 COMBO LETAL MÁS FRECUENTE</div>
            <div className="font-bebas text-2xl text-white mb-1">{top[0]}</div>
            <div className="font-space text-[11px] text-[#7ab3c8]">Esta combinación apareció {top[1]} veces. Es tu perfil de error más destructivo.</div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── COSTO DE ERRORES ────────────────────────────────────────────────
function CostoTab({ trades }: { trades: Trade[] }) {
  const closed = trades.filter(t => t.exit > 0);

  const mistakeCost = useMemo(() => {
    const data: Record<string, { count: number; totalLoss: number; lossCount: number; avgLoss: number }> = {};
    closed.forEach(t => {
      t.mistakes.forEach(m => {
        if (!data[m]) data[m] = { count: 0, totalLoss: 0, lossCount: 0, avgLoss: 0 };
        data[m].count++;
        if (t.result < 0) { data[m].lossCount++; data[m].totalLoss += Math.abs(t.result); }
      });
    });
    Object.values(data).forEach(d => { d.avgLoss = d.lossCount > 0 ? d.totalLoss / d.lossCount : 0; });
    return Object.entries(data).sort(([,a],[,b]) => b.totalLoss - a.totalLoss);
  }, [closed]);

  const emotionCost = useMemo(() => {
    const data: Record<string, { count: number; totalLoss: number; lossCount: number }> = {};
    closed.forEach(t => {
      t.emotions.forEach(e => {
        if (!data[e]) data[e] = { count: 0, totalLoss: 0, lossCount: 0 };
        data[e].count++;
        if (t.result < 0) { data[e].lossCount++; data[e].totalLoss += Math.abs(t.result); }
      });
    });
    return Object.entries(data).sort(([,a],[,b]) => b.totalLoss - a.totalLoss).filter(([,v]) => v.totalLoss > 0);
  }, [closed]);

  const whyCost = useMemo(() => {
    const data: Record<string, { count: number; totalLoss: number; totalGain: number; lossCount: number; winCount: number }> = {};
    closed.forEach(t => {
      const why = t.whyReally || "No registrado";
      if (!data[why]) data[why] = { count:0, totalLoss:0, totalGain:0, lossCount:0, winCount:0 };
      data[why].count++;
      if (t.result < 0) { data[why].lossCount++; data[why].totalLoss += Math.abs(t.result); }
      else { data[why].winCount++; data[why].totalGain += t.result; }
    });
    return Object.entries(data).sort(([,a],[,b]) => b.totalLoss - a.totalLoss);
  }, [closed]);

  const totalLossFromMistakes = mistakeCost.reduce((s,[,v]) => s + v.totalLoss, 0);
  const totalAllLosses = closed.filter(t => t.result < 0).reduce((s,t) => s + Math.abs(t.result), 0);
  const pctFromMistakes = totalAllLosses > 0 ? (totalLossFromMistakes / totalAllLosses * 100) : 0;

  if (closed.length === 0) {
    return (
      <div className="border border-[#1a2535] bg-[#060a0f] p-16 text-center">
        <div className="text-4xl mb-4">📉</div>
        <div className="font-bebas text-2xl text-white mb-2">SIN TRADES CERRADOS</div>
        <p className="font-space text-[12px] text-[#7ab3c8]">Registrá trades con entrada y salida para ver el costo de tus errores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Headline damage number */}
      <div className="border border-[#ff174433] bg-[#ff174808] p-6 grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1a2535]">
        {[
          { label: "Perdido por errores documentados", value: `$${totalLossFromMistakes.toFixed(0)}`, color: "#ff1744", sub: "suma de pérdidas en trades con errores marcados" },
          { label: "% del total de pérdidas", value: `${pctFromMistakes.toFixed(0)}%`, color: "#ff6d00", sub: "de tus pérdidas tienen errores registrados" },
          { label: "Costo promedio por error", value: `$${mistakeCost[0]?.[1].avgLoss.toFixed(0) ?? "0"}`, color: "#ffd700", sub: `tu error más caro: "${mistakeCost[0]?.[0] ?? "—"}"` },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="bg-[#060a0f] p-5">
            <div className="font-space text-[10px] text-[#5a8898] tracking-[0.15em] uppercase mb-2">{label}</div>
            <div className="font-bebas text-4xl mb-1" style={{ color }}>{value}</div>
            <div className="font-space text-[10px] text-[#7ab3c8]">{sub}</div>
          </div>
        ))}
      </div>

      {/* Error cost ranking */}
      {mistakeCost.length > 0 && (
        <div>
          <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4">RANKING DE ERRORES POR COSTO ($)</div>
          <div className="space-y-2">
            {mistakeCost.map(([mistake, data], i) => (
              <div key={mistake} className="border border-[#1a2535] bg-[#060a0f] p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bebas text-2xl text-[#1a2535] w-8 shrink-0">#{i+1}</span>
                  <span className="font-space text-[12px] text-white flex-1">{mistake}</span>
                  <div className="text-right shrink-0">
                    {data.totalLoss > 0 ? (
                      <div className="font-bebas text-2xl text-[#ff1744]">−${data.totalLoss.toFixed(0)}</div>
                    ) : (
                      <div className="font-bebas text-2xl text-[#7ab3c8]">$0</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 mt-2 font-space text-[10px] text-[#5a8898]">
                  <span>{data.count} veces cometido</span>
                  {data.lossCount > 0 && <span>en {data.lossCount} trade{data.lossCount>1?"s":""} perdedores</span>}
                  {data.avgLoss > 0 && <span>~${data.avgLoss.toFixed(0)} por ocurrencia</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emotion cost */}
      {emotionCost.length > 0 && (
        <div>
          <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4">COSTO EMOCIONAL — PÉRDIDAS POR EMOCIÓN</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[#1a2535] border border-[#1a2535]">
            {emotionCost.map(([emo, data]) => (
              <div key={emo} className="bg-[#060a0f] p-4">
                <div className="font-space text-[10px] text-[#ffd700] mb-1">{emo}</div>
                <div className="font-bebas text-2xl text-[#ff1744]">−${data.totalLoss.toFixed(0)}</div>
                <div className="font-space text-[9px] text-[#5a8898]">{data.lossCount} pérdidas · {data.count} apariciones</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* "Por qué entraste" cost */}
      {whyCost.filter(([k]) => k !== "No registrado").length > 0 && (
        <div>
          <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4">POR QUÉ ENTRASTE — RESULTADOS REALES</div>
          <div className="space-y-2">
            {whyCost.filter(([k]) => k !== "No registrado").map(([why, data]) => {
              const netResult = data.totalGain - data.totalLoss;
              return (
                <div key={why} className="border border-[#1a2535] bg-[#060a0f] p-4 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="font-space text-[12px] text-white mb-1">"{why}"</div>
                    <div className="font-space text-[10px] text-[#5a8898]">{data.count} trades · {data.winCount}W / {data.lossCount}L</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bebas text-2xl" style={{ color: netResult >= 0 ? "#00e676" : "#ff1744" }}>
                      {netResult >= 0 ? "+" : ""}${netResult.toFixed(0)}
                    </div>
                    <div className="font-space text-[9px] text-[#5a8898]">resultado neto</div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="font-space text-[11px] text-[#5a8898] mt-3 leading-relaxed">
            Esta tabla muestra si tus razones de entrada generan ganancia o pérdida neta. Las entradas por FOMO o impulso casi siempre aparecen en rojo.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── FOMO CHECKER MODAL ──────────────────────────────────────────────
function FomoModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [check, setCheck] = useState<FomoCheck>({ setup: "", why: "", hasSL: false, hasTP: false, emotion: "", timeInTrade: "" });
  const [result, setResult] = useState<ReturnType<typeof analyzeFomo> | null>(null);

  const questions = [
    {
      q: "¿Cuánto tiempo llevás analizando este trade?",
      field: "timeInTrade" as keyof FomoCheck,
      opts: ["Menos de 5 min", "5-15 minutos", "15-30 minutos", "Más de 30 min"],
    },
    {
      q: "¿Cuál es tu razón REAL para entrar ahora?",
      field: "why" as keyof FomoCheck,
      opts: WHY_OPTS,
    },
    {
      q: "¿Cómo te sentís emocionalmente en este momento?",
      field: "emotion" as keyof FomoCheck,
      opts: EMOTIONS,
    },
    {
      q: "¿Tenés el setup claramente definido?",
      field: "setup" as keyof FomoCheck,
      opts: SETUPS,
    },
  ];

  const isBoolStep = step === questions.length;
  const isDone = result !== null;

  const handleOpt = (field: keyof FomoCheck, val: string) => {
    const updated = { ...check, [field]: val };
    setCheck(updated);
    if (step < questions.length - 1) { setTimeout(() => setStep(s => s + 1), 300); }
    else { setStep(s => s + 1); }
  };

  const handleAnalyze = () => {
    setResult(analyzeFomo(check));
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#060a0f] border-2 border-[#00e5ff33] w-full max-w-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1a2535] flex items-center justify-between">
          <div>
            <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.3em] uppercase">⚡ ANTES DE ENTRAR</div>
            <div className="font-bebas text-xl text-white">Detector de FOMO en tiempo real</div>
          </div>
          <button onClick={onClose} className="text-[#7ab3c8] hover:text-white text-xl">✕</button>
        </div>

        <div className="p-6">
          {!isDone ? (
            <>
              {/* Progress */}
              <div className="flex gap-1 mb-6">
                {[...questions, { q: "" }].map((_, i) => (
                  <div key={i} className="flex-1 h-0.5 rounded-full transition-colors"
                    style={{ background: i <= step ? "#00e5ff" : "#1a2535" }} />
                ))}
              </div>

              {/* Question */}
              {!isBoolStep ? (
                <div>
                  <div className="font-bebas text-2xl text-white mb-5">{questions[step].q}</div>
                  <div className="grid grid-cols-1 gap-2">
                    {questions[step].opts.map(opt => (
                      <button key={opt}
                        onClick={() => handleOpt(questions[step].field, opt)}
                        className="text-left font-space text-[11px] px-4 py-3 border transition-all hover:border-[#00e5ff44] hover:text-[#00e5ff]"
                        style={{
                          borderColor: check[questions[step].field] === opt ? "#00e5ff" : "#1a2535",
                          color: check[questions[step].field] === opt ? "#00e5ff" : "#4a6070",
                          background: check[questions[step].field] === opt ? "#00e5ff10" : "transparent",
                        }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-bebas text-2xl text-white mb-5">¿Tenés SL y TP definidos?</div>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      { label: "Stop-Loss", field: "hasSL" as const },
                      { label: "Take-Profit", field: "hasTP" as const },
                    ].map(({ label, field }) => (
                      <div key={field}>
                        <div className="font-space text-[10px] text-[#7ab3c8] mb-2">{label}</div>
                        <div className="grid grid-cols-2 gap-px bg-[#1a2535]">
                          {[true, false].map(v => (
                            <button key={String(v)}
                              onClick={() => setCheck(c => ({ ...c, [field]: v }))}
                              className="py-2.5 font-space text-[11px] font-bold transition-all"
                              style={{ background: check[field] === v ? (v ? "#00e67618" : "#ff174418") : "#060a0f", color: check[field] === v ? (v ? "#00e676" : "#ff1744") : "#2a4a5a" }}>
                              {v ? "Sí" : "No"}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleAnalyze}
                    className="w-full py-4 font-space text-[13px] font-bold tracking-[0.2em] uppercase text-[#020408]"
                    style={{ background: "#00e5ff" }}>
                    ANALIZAR AHORA →
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Result */
            <div>
              {/* Verdict */}
              <div className="border-2 p-5 mb-5 text-center" style={{ borderColor: result.color + "66", background: result.color + "10" }}>
                <div className="font-bebas text-5xl mb-2" style={{ color: result.color }}>{result.risk}%</div>
                <div className="font-space text-[11px] text-[#7ab3c8] mb-2">PROBABILIDAD DE TRADE FALLIDO</div>
                <div className="font-bebas text-2xl" style={{ color: result.color }}>{result.verdict_short}</div>
                <div className="font-space text-[12px] text-white mt-2">{result.verdict}</div>
              </div>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="space-y-2 mb-5">
                  {result.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 px-3 py-2.5 border border-[#1a2535] bg-[#080d14]">
                      <span className="text-[#ff6d00] shrink-0 mt-0.5">⚠</span>
                      <span className="font-space text-[11px] text-[#8a9ab0] leading-relaxed">{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Risk gauge bar */}
              <div className="mb-5">
                <div className="flex justify-between font-space text-[9px] text-[#5a8898] mb-1">
                  <span>Bajo riesgo</span><span>Alto riesgo</span>
                </div>
                <div className="h-2 bg-[#1a2535] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${result.risk}%`, background: `linear-gradient(90deg, #00e676, #ffd700, #ff1744)` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setStep(0); setCheck({ setup:"",why:"",hasSL:false,hasTP:false,emotion:"",timeInTrade:"" }); setResult(null); }}
                  className="py-3 font-space text-[11px] tracking-[0.1em] uppercase border border-[#1a2535] text-[#7ab3c8] hover:border-[#00e5ff44] hover:text-[#00e5ff] transition-colors">
                  ↺ REPETIR
                </button>
                <button onClick={onClose}
                  className="py-3 font-space text-[11px] font-bold tracking-[0.1em] uppercase text-[#020408]"
                  style={{ background: result.color }}>
                  {result.risk >= 45 ? "CANCELAR TRADE" : "PROCEDER"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Plan Gate ────────────────────────────────────────────────────────────────
function JournalPlanGate() {
  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani flex flex-col">
      <SiteNav />
      <div className="flex-1 flex items-center justify-center px-6 pt-20">
        <div className="border border-[#1a2535] bg-[#060a0f] p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-5">🔒</div>
          <div className="font-sharetech text-[9px] tracking-[0.4em] text-[#00e5ff] mb-3">ACCESO RESTRINGIDO</div>
          <div className="font-bebas text-3xl text-white mb-2">PSY JOURNAL IA</div>
          <div className="font-space text-[12px] text-[#7a9aaa] mb-6 leading-relaxed">
            El diario de trading con IA está disponible para miembros del plan
            <span className="text-[#ffd700] font-bold"> Trader</span> o superior.
          </div>
          <div className="border border-[#ffd70022] bg-[#0a0900] px-5 py-4 mb-6">
            <div className="font-sharetech text-[10px] tracking-[0.2em] text-[#ffd700] mb-3">⬡ INCLUÍDO EN TRADER $49/mes</div>
            <div className="space-y-1.5 text-left">
              {["PSY JOURNAL IA — Diario con IA psicológica","Análisis por trade + reporte semanal","Detector de errores y patrones","PSY AUTOPSY incluído","Aula Virtual completa"].map(f => (
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

// ─── PSY MENTAL TAB ──────────────────────────────────────────────────
function MentalTab({ trades }: { trades: Trade[] }) {
  const closed = trades.filter(t => t.exit > 0);

  // Consecutive losses (current streak)
  let streak = 0;
  for (const t of trades) {
    if (t.result < 0) streak++;
    else break;
  }

  // Revenge trading: loss followed by another trade within 60 min
  let revengeCount = 0;
  for (let i = 0; i < trades.length - 1; i++) {
    const cur = trades[i];
    const nxt = trades[i + 1];
    if (cur.result < 0) {
      const diff = (new Date(nxt.date).getTime() - new Date(cur.date).getTime()) / 60000;
      if (diff < 60) revengeCount++;
    }
  }

  // Overtrading: days with > 5 trades
  const byDay: Record<string, number> = {};
  trades.forEach(t => {
    const d = t.date.slice(0, 10);
    byDay[d] = (byDay[d] ?? 0) + 1;
  });
  const overtradeDays = Object.values(byDay).filter(c => c > 5).length;

  // Emotion breakdown
  const emotionCount: Record<string, number> = {};
  trades.forEach(t => t.emotions.forEach(e => { emotionCount[e] = (emotionCount[e] ?? 0) + 1; }));
  const topEmotions = Object.entries(emotionCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Win/loss stats
  const wins   = closed.filter(t => t.result > 0).length;
  const losses = closed.filter(t => t.result < 0).length;
  const winRate = closed.length ? Math.round((wins / closed.length) * 100) : 0;

  // State assessment
  const dangerScore = (streak >= 3 ? 3 : streak) + (revengeCount >= 3 ? 3 : revengeCount) + (overtradeDays >= 2 ? 3 : overtradeDays);
  const state: "CONTROLADO" | "ALERTA" | "PARA" =
    dangerScore >= 6 ? "PARA" : dangerScore >= 3 ? "ALERTA" : "CONTROLADO";
  const stateColors = {
    CONTROLADO: { color: "#00e676", bg: "#00e67610", border: "#00e67630", emoji: "🟢" },
    ALERTA:     { color: "#ffd700", bg: "#ffd70010", border: "#ffd70030", emoji: "🟡" },
    PARA:       { color: "#ff1744", bg: "#ff174410", border: "#ff174430", emoji: "🔴" },
  };
  const sc = stateColors[state];

  const recommendations: string[] = [];
  if (streak >= 2) recommendations.push(`Llevas ${streak} pérdidas consecutivas. Reducí el tamaño de posición a la mitad.`);
  if (streak >= 4) recommendations.push("4+ pérdidas seguidas = mercado no está a tu favor. Tomá 1 día completo fuera del mercado.");
  if (revengeCount >= 2) recommendations.push("Detectamos revenge trading. Ponete una regla: 30 min de espera obligatoria después de cada pérdida.");
  if (overtradeDays >= 1) recommendations.push(`${overtradeDays} día(s) con más de 5 trades. El sobretrading destruye la disciplina. Limitá a 3 trades por día.`);
  if (winRate < 40 && closed.length >= 5) recommendations.push(`Win rate de ${winRate}% — revisá si el setup que usás realmente tiene edge estadístico.`);
  if (recommendations.length === 0) recommendations.push("Sin señales de alerta detectadas. Seguí operando con disciplina.");

  if (trades.length === 0) {
    return (
      <div className="border border-[#1a2535] bg-[#060a0f] p-16 text-center">
        <div className="text-5xl mb-4">🧠</div>
        <div className="font-bebas text-3xl text-white mb-2">REGISTRÁ TRADES PRIMERO</div>
        <p className="font-space text-[12px] text-[#7ab3c8] max-w-sm mx-auto leading-relaxed">
          PSY Mental analiza tus patrones de comportamiento a partir del historial de trades registrados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado actual */}
      <div className="border-2 p-6" style={{ borderColor: sc.border, background: sc.bg }}>
        <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-3">ESTADO MENTAL ACTUAL</div>
        <div className="flex items-center gap-4">
          <div className="text-5xl">{sc.emoji}</div>
          <div>
            <div className="font-bebas text-4xl" style={{ color: sc.color }}>{state}</div>
            <div className="font-sharetech text-[9px] tracking-[0.15em]" style={{ color: sc.color }}>
              {state === "CONTROLADO" && "Sin señales de alerta. Continuá con disciplina."}
              {state === "ALERTA"     && "Patrones de riesgo detectados. Reducí exposición."}
              {state === "PARA"       && "ALTO RIESGO — Detené las operaciones hoy."}
            </div>
          </div>
        </div>
      </div>

      {/* Métricas de comportamiento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "PÉRDIDAS CONSECUTIVAS", value: streak.toString(), color: streak >= 3 ? "#ff1744" : streak >= 2 ? "#ffd700" : "#00e676", warning: streak >= 2 },
          { label: "REVENGE TRADES",         value: revengeCount.toString(), color: revengeCount >= 2 ? "#ff1744" : revengeCount >= 1 ? "#ffd700" : "#00e676", warning: revengeCount >= 1 },
          { label: "DÍAS SOBRETRADING",      value: overtradeDays.toString(), color: overtradeDays >= 2 ? "#ff1744" : overtradeDays >= 1 ? "#ffd700" : "#00e676", warning: overtradeDays >= 1 },
          { label: "WIN RATE",               value: `${winRate}%`, color: winRate >= 55 ? "#00e676" : winRate >= 40 ? "#ffd700" : "#ff1744", warning: winRate < 40 && closed.length >= 5 },
        ].map(m => (
          <div key={m.label} className="border border-[#1a2535] bg-[#060a0f] p-4 text-center">
            <div className="font-bebas text-3xl" style={{ color: m.color }}>{m.value}</div>
            <div className="font-sharetech text-[8px] tracking-[0.1em] text-[#5a8898] mt-1">{m.label}</div>
            {m.warning && <div className="font-sharetech text-[8px] text-[#ffd700] mt-1">⚠ ALERTA</div>}
          </div>
        ))}
      </div>

      {/* Recomendaciones */}
      <div className="border border-[#1a2535] bg-[#060a0f] p-5">
        <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#00e5ff] mb-4">RECOMENDACIONES PERSONALIZADAS</div>
        <div className="space-y-3">
          {recommendations.map((r, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-[#00e5ff] shrink-0 mt-0.5">→</span>
              <p className="font-space text-[12px] text-[#8090a0] leading-relaxed">{r}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Emociones frecuentes */}
      {topEmotions.length > 0 && (
        <div className="border border-[#1a2535] bg-[#060a0f] p-5">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-4">EMOCIONES MÁS FRECUENTES</div>
          <div className="space-y-2">
            {topEmotions.map(([emo, count]) => {
              const pct = Math.round((count / trades.length) * 100);
              const danger = ["FOMO","Venganza","Frustración","Euforia"].includes(emo);
              return (
                <div key={emo}>
                  <div className="flex justify-between mb-1">
                    <span className="font-space text-[11px]" style={{ color: danger ? "#ff1744" : "#8090a0" }}>
                      {emo} {danger ? "⚠" : ""}
                    </span>
                    <span className="font-sharetech text-[9px] text-[#5a8898]">{count} trades ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-[#1a2535] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: danger ? "#ff1744" : "#00e5ff" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 font-sharetech text-[9px] text-[#5a8898] leading-relaxed">
            Las emociones de FOMO, Venganza y Euforia están estadísticamente correlacionadas con trades perdedores.
          </div>
        </div>
      )}

      {/* Reglas de oro */}
      <div className="border border-[#1a2535] bg-[#060a0f] p-5">
        <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#e040fb] mb-4">REGLAS ANTI-OVERTRADING</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { rule: "Máximo 3 trades por día", icon: "🔢" },
            { rule: "30 min de cooldown después de cada pérdida", icon: "⏱" },
            { rule: "Reducir size 50% después de 2 pérdidas seguidas", icon: "📉" },
            { rule: "Parar el día si llegás a -3R en total", icon: "🛑" },
            { rule: "Nunca operar durante eventos macro sin plan", icon: "📅" },
            { rule: "Un trade aburrido es mejor que uno emocionante", icon: "😴" },
          ].map(r => (
            <div key={r.rule} className="flex items-start gap-2">
              <span className="text-base shrink-0">{r.icon}</span>
              <span className="font-space text-[11px] text-[#7ab3c8] leading-relaxed">{r.rule}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────
function JournalApp() {
  const [trades, setTrades]       = useState<Trade[]>([]);
  const [tab, setTab]             = useState<"trades"|"repeticiones"|"costo"|"mental">("trades");
  const [showForm, setShowForm]   = useState(false);
  const [showFomo, setShowFomo]   = useState(false);
  const [form, setForm]           = useState(emptyForm());
  const [aiLoading, setAiLoading] = useState<string|null>(null);
  const [viewTrade, setViewTrade] = useState<Trade|null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string|null>(null);

  useEffect(() => { setTrades(loadTrades()); }, []);

  const { pnl, r } = calcR(form.entry, form.exit, form.direction, form.size);

  const submit = () => {
    if (!form.asset || !form.entry) return;
    const trade: Trade = { ...form, id: Date.now().toString(), result: pnl, rMultiple: r };
    const next = [trade, ...trades];
    setTrades(next); saveTrades(next);
    setShowForm(false); setForm(emptyForm());
  };

  const deleteTrade = (id: string) => {
    const next = trades.filter(t => t.id !== id);
    setTrades(next); saveTrades(next);
    setDeleteConfirm(null);
    if (viewTrade?.id === id) setViewTrade(null);
  };

  const runAI = useCallback(async (trade: Trade) => {
    setAiLoading(trade.id);
    try {
      const prompt = `Eres un coach de trading y psicólogo especializado en traders. Analiza este trade en español:
TRADE: ${trade.direction} ${trade.asset}
Entrada: $${trade.entry} → Salida: $${trade.exit}
Resultado: ${trade.result > 0 ? "+" : ""}$${trade.result} (${trade.rMultiple > 0 ? "+" : ""}${trade.rMultiple.toFixed(1)}%)
Setup: ${trade.setup || "No especificado"}
Por qué entró: ${trade.whyReally || "No registrado"}
Emociones: ${trade.emotions.join(", ") || "No registradas"}
Errores: ${trade.mistakes.join(", ") || "Ninguno"}
Notas: ${trade.notes || "Sin notas"}

Análisis psicológico directo (3-4 párrafos):
1. ¿Qué sesgos cognitivos o emocionales se detectan?
2. ¿En qué falló la disciplina o el proceso?
3. Una acción concreta para mejorar en el próximo trade similar.
Sé específico, no genérico. Usá el contexto real del trade.`;

      const res = await fetch(`/api/psy-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      if (res.ok) {
        const d = await res.json() as { reply?: string };
        const analysis = d.reply ?? "No se pudo obtener análisis.";
        const next = trades.map(t => t.id === trade.id ? { ...t, aiAnalysis: analysis, aiTs: Date.now() } : t);
        setTrades(next); saveTrades(next);
        if (viewTrade?.id === trade.id) setViewTrade({ ...trade, aiAnalysis: analysis, aiTs: Date.now() });
      }
    } catch { /* ignore */ } finally { setAiLoading(null); }
  }, [trades, viewTrade]);

  const TABS = [
    { key: "trades",       label: "📓 TRADES" },
    { key: "repeticiones", label: "🔁 REPETICIÓN" },
    { key: "costo",        label: "💸 COSTO DE ERRORES" },
    { key: "mental",       label: "🧠 PSY MENTAL" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />
      <div className="pt-28 pb-24 px-4 md:px-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-2">Psicología del Trading</div>
            <h1 className="font-bebas text-5xl md:text-7xl leading-none mb-2">DIARIO DE<br /><span className="text-[#00e5ff]">TRADING</span></h1>
            <p className="font-space text-[12px] text-[#7ab3c8] max-w-md leading-relaxed">
              Registrá trades, detectá patrones y calculá el costo real de tus errores.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowFomo(true)}
              className="font-space text-[11px] font-bold tracking-[0.15em] uppercase px-5 py-3 border-2 border-[#ff174466] text-[#ff1744] hover:bg-[#ff174415] transition-colors">
              ⚡ ESTOY POR ENTRAR
            </button>
            <button onClick={() => setShowForm(true)}
              className="font-space text-[12px] font-bold tracking-[0.15em] uppercase px-6 py-3 text-[#020408] hover:opacity-90 transition-opacity"
              style={{ background: "#00e5ff" }}>
              + REGISTRAR TRADE
            </button>
          </div>
        </div>

        {/* Stats */}
        {trades.length > 0 && <TradeStats trades={trades} />}

        {/* Tabs */}
        <div className="flex gap-px bg-[#1a2535] border border-[#1a2535] mb-6">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-3 font-space text-[10px] tracking-[0.15em] uppercase transition-colors"
              style={{ background: tab === t.key ? "#00e5ff18" : "#060a0f", color: tab === t.key ? "#00e5ff" : "#4a6070", borderBottom: tab === t.key ? "2px solid #00e5ff" : "2px solid transparent" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "repeticiones" && <RepeticionTab trades={trades} />}
        {tab === "costo" && <CostoTab trades={trades} />}
        {tab === "mental" && <MentalTab trades={trades} />}

        {tab === "trades" && (
          trades.length === 0 ? (
            <div className="border border-[#1a2535] bg-[#060a0f] p-16 text-center">
              <div className="text-5xl mb-4">📓</div>
              <div className="font-bebas text-3xl text-white mb-2">TU DIARIO ESTÁ VACÍO</div>
              <p className="font-space text-[12px] text-[#7ab3c8] mb-6 max-w-sm mx-auto leading-relaxed">
                Los errores que no registrás, los repetís.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={() => setShowFomo(true)}
                  className="font-space text-[11px] font-bold tracking-[0.1em] uppercase px-5 py-3 border border-[#ff174466] text-[#ff1744] hover:bg-[#ff174410]">
                  ⚡ ANTES DE ENTRAR
                </button>
                <button onClick={() => setShowForm(true)}
                  className="font-space text-[12px] font-bold tracking-[0.15em] uppercase px-6 py-3 text-[#020408]"
                  style={{ background: "#00e5ff" }}>
                  REGISTRAR MI PRIMER TRADE
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {trades.map(trade => {
                const isWin = trade.result > 0;
                return (
                  <div key={trade.id} className="border border-[#1a2535] bg-[#060a0f] p-4 cursor-pointer hover:border-[#1a2535aa] transition-colors" onClick={() => setViewTrade(trade)}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-space text-[10px] font-bold px-2 py-0.5 border shrink-0"
                        style={{ color: trade.direction==="LONG"?"#00e676":"#ff1744", borderColor:(trade.direction==="LONG"?"#00e676":"#ff1744")+"44" }}>
                        {trade.direction==="LONG"?"▲":"▼"} {trade.direction}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="font-space text-[13px] text-white">{trade.asset}</span>
                        {trade.setup && <span className="ml-2 font-space text-[10px] text-[#7ab3c8]">{trade.setup}</span>}
                      </div>
                      <div className="font-mono text-[16px] font-black shrink-0" style={{ color: isWin?"#00e676":"#ff1744" }}>
                        {isWin?"+":""}${trade.result.toFixed(2)}
                      </div>
                      <div className="font-space text-[10px] text-[#5a8898] shrink-0">
                        {new Date(trade.date).toLocaleDateString("es-EC",{day:"2-digit",month:"short"})}
                      </div>
                      {trade.aiAnalysis && <span className="font-space text-[9px] text-[#00e5ff] border border-[#00e5ff33] px-1.5 py-0.5 shrink-0">🧠 IA</span>}
                      {trade.mistakes.length > 0 && <span className="font-space text-[9px] text-[#ff6d00] border border-[#ff6d0033] px-1.5 py-0.5 shrink-0">⚠ {trade.mistakes.length} errores</span>}
                      <button onClick={e => { e.stopPropagation(); setDeleteConfirm(trade.id); }}
                        className="font-space text-[10px] text-[#5a8898] hover:text-[#ff1744] transition-colors shrink-0 ml-auto">🗑</button>
                    </div>
                    {trade.emotions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {trade.emotions.map(e => <span key={e} className="font-space text-[9px] px-1.5 py-0.5 border border-[#ffd70022] text-[#ffd70080]">{e}</span>)}
                      </div>
                    )}
                    {deleteConfirm === trade.id && (
                      <div className="mt-3 p-3 border border-[#ff174433] bg-[#ff174408] flex items-center justify-between" onClick={e => e.stopPropagation()}>
                        <span className="font-space text-[11px] text-[#ff1744]">¿Eliminar este trade?</span>
                        <div className="flex gap-2">
                          <button onClick={() => deleteTrade(trade.id)} className="font-space text-[10px] px-3 py-1 bg-[#ff1744] text-white">ELIMINAR</button>
                          <button onClick={() => setDeleteConfirm(null)} className="font-space text-[10px] px-3 py-1 border border-[#1a2535] text-[#7ab3c8]">CANCELAR</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* FOMO Modal */}
      {showFomo && <FomoModal onClose={() => setShowFomo(false)} />}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#060a0f] border border-[#1a2535] w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#1a2535] flex items-center justify-between">
              <div className="font-bebas text-2xl text-white">REGISTRAR TRADE</div>
              <button onClick={() => setShowForm(false)} className="text-[#7ab3c8] hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">ACTIVO</label>
                  <input value={form.asset} onChange={e => setForm({...form,asset:e.target.value})}
                    className="w-full bg-[#080d14] border border-[#1a2535] text-white font-mono text-[14px] px-3 py-2.5 focus:outline-none focus:border-[#00e5ff44]" placeholder="BTC/USDT" />
                </div>
                <div>
                  <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">FECHA</label>
                  <input type="date" value={form.date} onChange={e => setForm({...form,date:e.target.value})}
                    className="w-full bg-[#080d14] border border-[#1a2535] text-white font-mono text-[14px] px-3 py-2.5 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">DIRECCIÓN</label>
                <div className="grid grid-cols-2 gap-px bg-[#1a2535]">
                  {(["LONG","SHORT"] as const).map(d => (
                    <button key={d} type="button" onClick={() => setForm({...form,direction:d})}
                      className="py-3 font-space text-[11px] font-bold tracking-[0.1em] transition-all"
                      style={{ background: form.direction===d?(d==="LONG"?"#00e67618":"#ff174418"):"#060a0f", color: form.direction===d?(d==="LONG"?"#00e676":"#ff1744"):"#2a4a5a" }}>
                      {d==="LONG"?"▲ LONG":"▼ SHORT"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {([{label:"ENTRADA ($)",key:"entry"},{label:"SALIDA ($)",key:"exit"},{label:"CAPITAL ($)",key:"size"}] as const).map(f => (
                  <div key={f.key}>
                    <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">{f.label}</label>
                    <input type="number" value={form[f.key]||""} onChange={e => setForm({...form,[f.key]:parseFloat(e.target.value)||0})}
                      className="w-full bg-[#080d14] border border-[#1a2535] text-white font-mono text-[14px] px-3 py-2.5 focus:outline-none focus:border-[#00e5ff44]" />
                  </div>
                ))}
              </div>
              {form.entry > 0 && form.exit > 0 && (
                <div className="flex items-center justify-between p-3 border"
                  style={{ borderColor:pnl>=0?"#00e67633":"#ff174433", background:pnl>=0?"#00e67608":"#ff174408" }}>
                  <span className="font-space text-[11px] text-[#7ab3c8]">Resultado estimado:</span>
                  <span className="font-mono text-[16px] font-black" style={{ color:pnl>=0?"#00e676":"#ff1744" }}>
                    {pnl>=0?"+":""}${pnl.toFixed(2)} ({r>=0?"+":""}{r.toFixed(1)}%)
                  </span>
                </div>
              )}
              {/* Por qué entraste */}
              <div>
                <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">¿POR QUÉ ENTRASTE REALMENTE? <span className="text-[#5a8898]">(modo honesto)</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {WHY_OPTS.map(s => (
                    <button key={s} type="button" onClick={() => setForm({...form,whyReally:s})}
                      className="font-space text-[10px] px-2.5 py-1 border transition-all"
                      style={{ borderColor:form.whyReally===s?"#ffd700":"#1a2535", color:form.whyReally===s?"#ffd700":"#4a6070", background:form.whyReally===s?"#ffd70015":"transparent" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">SETUP</label>
                <div className="flex flex-wrap gap-1.5">
                  {SETUPS.map(s => (
                    <button key={s} type="button" onClick={() => setForm({...form,setup:s})}
                      className="font-space text-[10px] px-2.5 py-1 border transition-all"
                      style={{ borderColor:form.setup===s?"#00e5ff":"#1a2535", color:form.setup===s?"#00e5ff":"#4a6070", background:form.setup===s?"#00e5ff15":"transparent" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">EMOCIONES DURANTE EL TRADE</label>
                <CheckGroup items={EMOTIONS} selected={form.emotions} onChange={v => setForm({...form,emotions:v})} color="#ffd700" />
              </div>
              <div>
                <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">ERRORES COMETIDOS</label>
                <CheckGroup items={MISTAKES} selected={form.mistakes} onChange={v => setForm({...form,mistakes:v})} color="#ff6d00" />
              </div>
              <div>
                <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">NOTAS PERSONALES</label>
                <textarea value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} rows={3}
                  placeholder="¿Qué salió bien? ¿Qué hubieras hecho distinto? ¿Cómo te sentías antes de entrar?"
                  className="w-full bg-[#080d14] border border-[#1a2535] text-white font-space text-[12px] px-3 py-2.5 focus:outline-none focus:border-[#00e5ff44] resize-none" />
              </div>
              <button onClick={submit}
                className="w-full py-4 font-space text-[13px] font-bold tracking-[0.2em] uppercase text-[#020408] hover:opacity-90 transition-opacity"
                style={{ background:"#00e5ff" }}>
                GUARDAR TRADE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trade detail modal */}
      {viewTrade && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewTrade(null)}>
          <div className="bg-[#060a0f] border border-[#1a2535] w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#1a2535] flex items-center justify-between">
              <div>
                <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em]">{new Date(viewTrade.date).toLocaleDateString("es-EC",{day:"2-digit",month:"long",year:"numeric"})}</div>
                <div className="font-bebas text-2xl" style={{ color:viewTrade.direction==="LONG"?"#00e676":"#ff1744" }}>
                  {viewTrade.direction} {viewTrade.asset}
                </div>
              </div>
              <button onClick={() => setViewTrade(null)} className="text-[#7ab3c8] hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-px bg-[#1a2535]">
                {[
                  {label:"ENTRADA",value:`$${viewTrade.entry}`,color:"#fff"},
                  {label:"SALIDA",value:`$${viewTrade.exit}`,color:"#fff"},
                  {label:"RESULTADO",value:`${viewTrade.result>=0?"+":""}$${viewTrade.result.toFixed(2)}`,color:viewTrade.result>=0?"#00e676":"#ff1744"},
                ].map((s,i) => (
                  <div key={i} className="bg-[#060a0f] p-3 text-center">
                    <div className="font-space text-[9px] text-[#5a8898] mb-1">{s.label}</div>
                    <div className="font-mono text-[14px] font-bold" style={{ color:s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {viewTrade.whyReally && (
                <div className="border border-[#ffd70022] bg-[#ffd70008] px-4 py-3">
                  <div className="font-space text-[10px] text-[#ffd700] mb-1">🧠 MODO HONESTO — Por qué entró</div>
                  <div className="font-space text-[12px] text-white">{viewTrade.whyReally}</div>
                </div>
              )}
              {viewTrade.setup && <div><span className="font-space text-[10px] text-[#7ab3c8]">SETUP: </span><span className="font-space text-[12px] text-[#00e5ff]">{viewTrade.setup}</span></div>}
              {viewTrade.emotions.length > 0 && (
                <div>
                  <div className="font-space text-[10px] text-[#7ab3c8] mb-2">EMOCIONES</div>
                  <div className="flex flex-wrap gap-1.5">
                    {viewTrade.emotions.map(e => <span key={e} className="font-space text-[10px] px-2 py-0.5 border border-[#ffd70033] text-[#ffd700]">{e}</span>)}
                  </div>
                </div>
              )}
              {viewTrade.mistakes.length > 0 && (
                <div>
                  <div className="font-space text-[10px] text-[#7ab3c8] mb-2">ERRORES</div>
                  <div className="flex flex-wrap gap-1.5">
                    {viewTrade.mistakes.map(m => <span key={m} className="font-space text-[10px] px-2 py-0.5 border border-[#ff6d0033] text-[#ff6d00]">{m}</span>)}
                  </div>
                </div>
              )}
              {viewTrade.notes && (
                <div className="border border-[#1a2535] p-4 bg-[#080d14]">
                  <div className="font-space text-[10px] text-[#7ab3c8] mb-2">NOTAS</div>
                  <p className="font-space text-[12px] text-[#8a9ab0] leading-relaxed">{viewTrade.notes}</p>
                </div>
              )}
              <div className="border border-[#00e5ff22] bg-[#080d14] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.2em]">🧠 ANÁLISIS PSY IA</div>
                  <button onClick={() => runAI(viewTrade)} disabled={aiLoading === viewTrade.id}
                    className="font-space text-[10px] px-3 py-1.5 border border-[#00e5ff44] text-[#00e5ff] hover:bg-[#00e5ff10] transition-colors disabled:opacity-40">
                    {aiLoading === viewTrade.id ? "⏳ ANALIZANDO..." : viewTrade.aiAnalysis ? "↺ NUEVO ANÁLISIS" : "✦ ANALIZAR"}
                  </button>
                </div>
                {viewTrade.aiAnalysis ? (
                  <div className="font-space text-[12px] text-[#8a9ab0] leading-relaxed whitespace-pre-wrap">{viewTrade.aiAnalysis}</div>
                ) : (
                  <div className="font-space text-[11px] text-[#5a8898]">Presioná "Analizar" para que la IA detecte tus patrones psicológicos y errores de proceso en este trade específico.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating "Estoy por entrar" button */}
      <button
        onClick={() => setShowFomo(true)}
        className="fixed bottom-6 right-6 z-40 font-space text-[11px] font-bold tracking-[0.1em] uppercase px-5 py-3 shadow-2xl transition-all hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg,#ff1744,#ff6d00)", color: "white", boxShadow: "0 0 30px #ff174440" }}>
        ⚡ ESTOY POR ENTRAR
      </button>
    </div>
  );
}

export default function Journal() {
  const auth = (() => { try { return JSON.parse(localStorage.getItem("psyko_auth") ?? "null") as { user?: string; role?: string; plan?: string } | null; } catch { return null; } })();
  const plan = auth?.plan ?? "";
  const isAllowed = ["aprendiz","trader","institucional"].includes(plan) || auth?.role === "superadmin" || auth?.role === "operator" || auth?.role === "member";
  if (!isAllowed) return <JournalPlanGate />;
  return <JournalApp />;
}
