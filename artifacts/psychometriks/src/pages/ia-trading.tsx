import React, { useState, useEffect } from "react";
import SiteNav from "@/components/site-nav";
import { getAuth, hasAccess } from "@/lib/auth";

// ─── Tipos ──────────────────────────────────────────────────────────────────
interface Dictamen {
  dictamen: string;
  direccion: "ALCISTA" | "BAJISTA" | "NEUTRAL";
  confianza: number;
  accion: "ENTRAR" | "ESPERAR" | "EVITAR";
  contexto: string[];
  zona_entrada: number;
  zona_razon: string;
  sl: number;
  sl_razon: string;
  tp1_corto: number; tp2_corto: number; tp3_corto: number;
  tp1_macro: number; tp2_macro: number; tp3_macro: number;
}

interface Nucleo {
  fractal_tipo: string;
  fractal_pro_patron: string;
  fractal_descripcion?: string;
  fractal_objetivo?: number | null;
  fractal_fuerza?: string;
  fractal_confianza?: number;
  rsi_map: Record<string, number>;
  rsi_energy: number;
  vwap: number;
  precio_vwap: string;
  fib_618: number;
  fib_382: number;
  agotamiento_score: number;
  agotamiento_dir: string;
  bear_score: number;
  verdict: string;
  best_level: string;
  best_score: number;
  zonas_clave: [number, string, number][];
  poc_cascade?: Record<string, { level: number; status: "ARRIBA" | "CERCA" | "ABAJO" }>;
  pocs_abajo?: number;
  bollinger?: string;
  canal_reg?: string;
  slope?: number;
}

interface Macro {
  sesgo?: string;
  sesgo_score?: number;
  dxy_change?: number;
  vix_value?: number;
  spx_change?: number;
  mag7_avg?: number;
  gold_value?: number;
  wti_value?: number;
  narrativa?: string[];
}

interface Memoria {
  ajuste_confianza?: number;
  notas?: string[];
  stats?: { accuracy?: number; ganancia_avg?: number; total?: number };
  recientes?: { dir: string; resultado: string; ganancia: number; hace_h: number }[];
}

interface Resultado {
  symbol: string;
  precio: number;
  dictamen: Dictamen;
  dictamen_scalping?: { direccion: string; confianza: number; accion: string; contexto: string[] } | null;
  nucleo: Nucleo;
  macro: Macro;
  memoria: Memoria;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmt(v: number | undefined | null): string {
  if (!v) return "─";
  if (v >= 1000) return v.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v >= 1) return v.toFixed(4);
  if (v >= 0.1) return v.toFixed(5);
  if (v >= 0.01) return v.toFixed(6);
  return v.toFixed(8);
}

const CHIPS_FALLBACK = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "LINKUSDT", "AAVEUSDT", "INJUSDT"];

// ─── Plan Gate ──────────────────────────────────────────────────────────────
function PlanGate() {
  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani flex flex-col">
      <SiteNav />
      <div className="flex-1 flex items-center justify-center px-6 pt-20">
        <div className="border border-[#1a2535] bg-[#060a0f] p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-5">🔒</div>
          <div className="font-sharetech text-[9px] tracking-[0.4em] text-[#e040fb] mb-3">ACCESO RESTRINGIDO</div>
          <div className="font-bebas text-3xl text-white mb-2">PSYCHOMETRIKS INTELLIGENT AI TRADING</div>
          <p className="text-[#8a9bb0] text-sm mt-4">Esta herramienta está disponible solo para el plan ELITE.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────
export default function IntelligentAiTrading() {
  const auth = getAuth();
  if (!hasAccess(auth, "elite")) return <PlanGate />;

  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Resultado | null>(null);
  const [chips, setChips] = useState<string[]>(CHIPS_FALLBACK);
  const [autoMode, setAutoMode] = useState<"off" | "1h" | "4h">("off");
  const [secsLeft, setSecsLeft] = useState(0);

  useEffect(() => {
    if (autoMode === "off" || !symbol) { setSecsLeft(0); return; }
    const intervalSec = autoMode === "1h" ? 3600 : 14400;
    setSecsLeft(intervalSec);
    const tick = setInterval(() => {
      setSecsLeft(s => {
        if (s <= 1) { analizar(symbol); return intervalSec; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, symbol]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/ia-trading/top-symbols", { headers: { "X-PSY-Token": auth?.token ?? "" } });
        const json = await r.json() as { symbols?: string[] };
        if (json.symbols?.length) setChips(json.symbols);
      } catch { /* se queda con el respaldo fijo */ }
    })();
  }, []);

  async function analizar(sym?: string) {
    const target = (sym ?? symbol).trim().toUpperCase();
    if (!target) return;
    setSymbol(target);
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const r = await fetch("/api/ia-trading/analizar", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-PSY-Token": auth?.token ?? "" },
        body: JSON.stringify({ symbol: target }),
      });
      const json = await r.json();
      if (!r.ok || json.error) {
        setError(json.error || "Error al analizar");
        return;
      }
      setData(json as Resultado);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const dm = data?.dictamen;
  const nr = data?.nucleo;
  const dirColor = dm?.direccion === "ALCISTA" ? "#00e676" : dm?.direccion === "BAJISTA" ? "#ff1744" : "#8a9bb0";
  const dirEmoji = dm?.direccion === "ALCISTA" ? "🟢" : dm?.direccion === "BAJISTA" ? "🔴" : "⚪";

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        {/* HEADER */}
        <div className="mb-8">
          <div className="font-sharetech text-[9px] tracking-[0.4em] text-[#00e5ff] mb-2">PLAN ELITE</div>
          <h1 className="font-bebas text-4xl md:text-5xl text-white">PSYCHOMETRIKS INTELLIGENT AI TRADING</h1>
          <p className="text-[#8a9bb0] text-sm mt-2">
            Análisis cuantitativo multi-timeframe con memoria y aprendizaje continuo.
          </p>
        </div>

        {/* MÉTRICAS Y TEMPORALIDAD ÓPTIMA */}
        <div className="border border-[#1a2535] bg-[#060a0f] p-4 mb-6">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#00e5ff] mb-3">📖 QUÉ MÉTRICAS USA ESTE ANÁLISIS</div>
          <p className="text-[13px] text-white/90 leading-relaxed mb-3">
            EMA (9/21 en 1H, 50/200 en 4H) · RSI en 7 temporalidades (5m a 1 semana) con detección de divergencias ·
            MACD (4H) · CVD — volumen delta acumulado (1H) · ATR (4H) · estructura de mercado (4H, 1D, 1 semana) ·
            niveles de Fibonacci (desde los últimos swings de 4H) · patrones de velas y de gráfico (hombro-cabeza-hombro,
            dobles techos/suelos, cuñas, etc.) · contexto macro (DXY, VIX, S&P 500, promedio Mag7).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
            <div className="bg-[#0a0f16] border-l-2 border-[#ffd700] p-3">
              <span className="text-[#ffd700] font-bold">⚡ Scalping (5m-15m-30m-1H):</span>{" "}
              <span className="text-white/80">óptimo si vas a operar en minutos a pocas horas.</span>
            </div>
            <div className="bg-[#0a0f16] border-l-2 border-[#00e5ff] p-3">
              <span className="text-[#00e5ff] font-bold">📈 Swing / Largo plazo (4H-1D-1SEM):</span>{" "}
              <span className="text-white/80">óptimo si tu horizonte es de días a semanas.</span>
            </div>
          </div>
        </div>

        {/* BUSCADOR */}
        <div className="flex items-center gap-3 mb-3 text-xs text-[#8a9bb0]">
          <span className="tracking-widest">🔄 AUTO-ACTUALIZAR:</span>
          {(["off", "1h", "4h"] as const).map(m => (
            <button
              key={m}
              onClick={() => setAutoMode(m)}
              className="px-2.5 py-1 border text-[10px] tracking-wider uppercase transition-colors"
              style={{
                borderColor: autoMode === m ? "#00e5ff" : "#1a2535",
                color: autoMode === m ? "#00e5ff" : "#8a9bb0",
                background: autoMode === m ? "#00e5ff11" : "transparent",
              }}
            >
              {m}
            </button>
          ))}
          {autoMode !== "off" && symbol && (
            <span className="text-[#5a6b7d]">próxima en {Math.floor(secsLeft / 60)}m {secsLeft % 60}s</span>
          )}
        </div>

        <div className="flex gap-3 mb-4">
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analizar()}
            placeholder="Ej: BTCUSDT, ETHUSDT, SOLUSDT..."
            className="flex-1 bg-[#060a0f] border border-[#1a2535] px-4 py-3 text-sm outline-none focus:border-[#00e5ff] transition-colors"
          />
          <button
            onClick={() => analizar()}
            disabled={loading}
            className="bg-[#00e5ff] text-[#020408] font-bold px-6 py-3 text-sm tracking-wider disabled:opacity-50"
          >
            {loading ? "ANALIZANDO..." : "🔍 ANALIZAR"}
          </button>
        </div>

        <div className="flex gap-2 flex-wrap mb-2 max-h-[92px] overflow-y-auto pr-1">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => analizar(c)}
              className="px-3 py-1.5 bg-[#060a0f] border border-[#1a2535] text-[#8a9bb0] text-xs hover:border-[#00e5ff] hover:text-[#00e5ff] transition-colors"
            >
              {c.replace("USDT", "")}
            </button>
          ))}
        </div>
        <div className="text-[10px] text-[#5a6b7d] mb-8">{chips.length} monedas disponibles (top por volumen en Binance Futures) — o escribe cualquier símbolo arriba</div>

        {loading && (
          <div className="text-center py-16 text-[#8a9bb0]">
            <div className="w-10 h-10 mx-auto border-2 border-[#00e5ff33] border-t-[#00e5ff] rounded-full animate-spin mb-4" />
            Analizando {symbol}… descargando datos multi-timeframe
          </div>
        )}

        {error && (
          <div className="border border-[#ff174444] bg-[#ff174411] p-4 text-[#ff1744] text-sm mb-6">{error}</div>
        )}

        {data && dm && nr && (
          <div className="grid md:grid-cols-2 gap-5">
            {/* COLUMNA 1 */}
            <div className="space-y-5">
              {/* RESOLUCIÓN FINAL */}
              <div className="border-2 bg-[#060a0f] p-5" style={{ borderColor: `${dirColor}66` }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#00e5ff] mb-1">RESOLUCIÓN FINAL</div>
                    <div className="text-lg font-bold" style={{ color: dirColor }}>
                      {dirEmoji} {dm.direccion} — {dm.accion === "ENTRAR" ? "✅ ENTRAR" : dm.accion === "ESPERAR" ? "⏳ ESPERAR" : "🚫 EVITAR"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold" style={{ color: dirColor }}>{dm.confianza?.toFixed(0)}%</div>
                    <div className="text-[10px] text-[#8a9bb0] tracking-wide">CONFIANZA</div>
                  </div>
                </div>

                <div className="h-1.5 bg-white/10 mb-3">
                  <div className="h-full" style={{ width: `${dm.confianza}%`, background: dirColor }} />
                </div>

                <div className="bg-[#0a0f16] border-l-2 p-3 mb-3 text-sm text-[#b0bec5]" style={{ borderColor: dirColor }}>
                  {dm.dictamen}
                </div>

                <div className="flex justify-between px-3 py-2 bg-[#0a0f16] mb-2 text-sm">
                  <span className="text-[#8a9bb0]">📍 PRECIO ACTUAL</span>
                  <span className="text-[#00e5ff] font-bold">{fmt(data.precio)}</span>
                </div>

                <div className="text-[10px] text-[#8a9bb0] tracking-widest mb-2 mt-1">📐 ZONAS CALCULADAS</div>
                <div className="flex justify-between px-3 py-2.5 mb-2" style={{ background: `${dirColor}22`, border: `1px solid ${dirColor}44` }}>
                  <div>
                    <div className="font-bold text-sm" style={{ color: dirColor }}>📌 ENTRADA ÓPTIMA</div>
                    <div className="text-[11px] text-[#8a9bb0]">{dm.zona_razon || "─"}</div>
                  </div>
                  <div className="font-bold text-lg" style={{ color: dirColor }}>{fmt(dm.zona_entrada)}</div>
                </div>

                <div className="flex justify-between px-3 py-2 bg-[#ff174411] mb-4">
                  <span className="text-[#ff1744] text-sm">🛑 STOP LOSS</span>
                  <span className="text-[#ff1744] font-bold">{fmt(dm.sl)}</span>
                </div>

                <div className="text-[10px] text-[#8a9bb0] tracking-widest mb-2">⚡ CORTO PLAZO (1H-4H)</div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[["TP1", dm.tp1_corto], ["TP2", dm.tp2_corto], ["TP3", dm.tp3_corto]].map(([label, val]) => (
                    <div key={label as string} className="bg-[#00e67611] border border-[#00e67633] p-2 text-center">
                      <div className="text-[10px] text-[#8a9bb0]">{label}</div>
                      <div className="text-[#00e676] font-bold text-sm">{fmt(val as number)}</div>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-[#8a9bb0] tracking-widest mb-2">🌙 LARGO PLAZO (1D-1W)</div>
                <div className="grid grid-cols-3 gap-2">
                  {[["TP1", dm.tp1_macro], ["TP2", dm.tp2_macro], ["TP3", dm.tp3_macro]].map(([label, val]) => (
                    <div key={label as string} className="bg-[#e040fb11] border border-[#e040fb33] p-2 text-center">
                      <div className="text-[10px] text-[#8a9bb0]">{label}</div>
                      <div className="text-[#e040fb] font-bold text-sm">{fmt(val as number)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SCALPING (5m-15m-30m-1H) — análisis paralelo, independiente del swing */}
              {data.dictamen_scalping && (
                <div className="border border-[#1a2535] bg-[#060a0f] p-5">
                  <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#ffd700] mb-3">⚡ SCALPING (5M-15M-30M-1H)</div>
                  {(() => {
                    const ds = data.dictamen_scalping!;
                    const scColor = ds.direccion === "ALCISTA" ? "#00e676" : ds.direccion === "BAJISTA" ? "#ff1744" : "#8a9bb0";
                    return (
                      <>
                        <div className="flex justify-between items-center mb-3">
                          <div className="font-bold text-sm" style={{ color: scColor }}>
                            {ds.direccion === "ALCISTA" ? "🟢" : ds.direccion === "BAJISTA" ? "🔴" : "⚪"} {ds.direccion} — {ds.accion === "ENTRAR" ? "✅ ENTRAR" : ds.accion === "ESPERAR" ? "⏳ ESPERAR" : "🚫 EVITAR"}
                          </div>
                          <div className="text-2xl font-bold" style={{ color: scColor }}>{ds.confianza}%</div>
                        </div>
                        <div className="h-1.5 bg-white/10 mb-3">
                          <div className="h-full" style={{ width: `${ds.confianza}%`, background: scColor }} />
                        </div>
                        {ds.contexto.map((c, i) => (
                          <div key={i} className="text-[12px] text-[#b0bec5] py-1 border-b border-white/5 last:border-0">{c}</div>
                        ))}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* FRACTAL PRO */}
              <div className="border border-[#1a2535] bg-[#060a0f] p-5">
                <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#ff8a00] mb-3">🔺 FRACTAL PRO</div>
                <div className="flex justify-between items-center mb-2">
                  <div className="font-bold text-sm" style={{ color: nr.fractal_tipo === "BULLISH" ? "#00e676" : nr.fractal_tipo === "BEARISH" ? "#ff1744" : "#8a9bb0" }}>
                    {nr.fractal_pro_patron !== "NINGUNO" ? nr.fractal_pro_patron : "Sin patrón dominante"}
                  </div>
                  <div className="text-lg font-bold text-[#ff8a00]">{nr.fractal_confianza ?? 0}%</div>
                </div>
                <div className="h-1.5 bg-white/10 mb-3">
                  <div className="h-full" style={{ width: `${nr.fractal_confianza ?? 0}%`, background: "#ff8a00" }} />
                </div>
                <div className="text-[12px] text-[#b0bec5] leading-relaxed mb-2">{nr.fractal_descripcion}</div>
                <div className="grid grid-cols-2 gap-2">
                  <InfoItem label="OBJETIVO" value={nr.fractal_objetivo ? fmt(nr.fractal_objetivo) : "—"} />
                  <InfoItem label="FUERZA" value={nr.fractal_fuerza ?? "—"} />
                </div>
              </div>

              {/* MEMORIA */}
              <div className="border border-[#1a2535] bg-[#060a0f] p-5">
                <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#00e5ff] mb-3">🧠 MEMORIA + APRENDIZAJE</div>
                {data.memoria?.stats?.total ? (
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="flex justify-between bg-[#0a0f16] px-3 py-2 text-sm">
                        <span className="text-[#8a9bb0]">Accuracy</span>
                        <span className="font-bold" style={{ color: (data.memoria.stats.accuracy ?? 0) >= 60 ? "#00e676" : "#ffd700" }}>
                          {data.memoria.stats.accuracy?.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between bg-[#0a0f16] px-3 py-2 text-sm">
                        <span className="text-[#8a9bb0]">Señales</span>
                        <span className="font-bold">{data.memoria.stats.total}</span>
                      </div>
                    </div>
                    {data.memoria.recientes?.slice(0, 5).map((r, i) => (
                      <div key={i} className="flex justify-between px-3 py-1.5 bg-[#0a0f16] mb-1 text-xs">
                        <span style={{ color: r.dir === "ALCISTA" ? "#00e676" : "#ff1744" }}>{r.dir === "ALCISTA" ? "▲" : "▼"}</span>
                        <span className="font-bold">{r.resultado || "PEND"}</span>
                        <span style={{ color: (r.ganancia ?? 0) > 0 ? "#00e676" : "#ff1744" }}>
                          {(r.ganancia ?? 0) > 0 ? "+" : ""}{(r.ganancia ?? 0).toFixed(2)}%
                        </span>
                        <span className="text-[#8a9bb0]">hace {r.hace_h}h</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-[#8a9bb0] text-sm text-center py-4">Sin historial aún — se acumula con cada análisis</div>
                )}
              </div>

              {/* CONTEXTO */}
              <div className="border border-[#1a2535] bg-[#060a0f] p-5">
                <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#00e5ff] mb-3">💬 ANÁLISIS</div>
                {dm.contexto?.length ? (
                  dm.contexto.map((c, i) => (
                    <div key={i} className="text-sm text-[#b0bec5] py-1.5 border-b border-white/5 last:border-0">{c}</div>
                  ))
                ) : (
                  <div className="text-[#8a9bb0] text-sm text-center py-4">Sin contexto adicional</div>
                )}
              </div>
            </div>

            {/* COLUMNA 2 */}
            <div className="space-y-5">
              {/* NÚCLEO */}
              <div className="border border-[#1a2535] bg-[#060a0f] p-5">
                <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#00e5ff] mb-3">🔬 NÚCLEO MATEMÁTICO — {data.symbol}</div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <InfoItem label="PATRÓN" value={nr.fractal_pro_patron !== "NINGUNO" ? nr.fractal_pro_patron : nr.fractal_tipo} />
                  <InfoItem label="VWAP" value={`${fmt(nr.vwap)} (${nr.precio_vwap})`} />
                  <InfoItem label="Fib 61.8%" value={fmt(nr.fib_618)} />
                  <InfoItem label="Fib 38.2%" value={fmt(nr.fib_382)} />
                  <InfoItem label="AGOTAMIENTO" value={`${nr.agotamiento_score?.toFixed(0)}/100 (${nr.agotamiento_dir})`} />
                  <InfoItem label="BEAR SCORE" value={`${nr.bear_score}/100`} />
                  <InfoItem label="MEJOR NIVEL" value={`${nr.best_level} (${nr.best_score}/100)`} />
                  <InfoItem label="VEREDICTO" value={nr.verdict} />
                  <InfoItem label="BOLLINGER" value={nr.bollinger ?? "—"} />
                  <InfoItem label="CANAL REG." value={nr.canal_reg ?? "—"} />
                  <InfoItem label="SLOPE" value={nr.slope !== undefined ? `${nr.slope.toFixed(4)}%` : "—"} />
                  <InfoItem label="POCs ABAJO" value={String(nr.pocs_abajo ?? "—")} />
                </div>

                {nr.poc_cascade && (
                  <>
                    <div className="text-[10px] text-[#8a9bb0] tracking-widest mb-2 mt-1">📍 POC CASCADE</div>
                    <div className="grid grid-cols-2 gap-1.5 mb-4">
                      {Object.entries(nr.poc_cascade).map(([tf, p]) => (
                        <div key={tf} className="flex justify-between items-center bg-[#0a0f16] px-2.5 py-1.5 text-xs">
                          <span className="text-[#8a9bb0] w-8">{tf}</span>
                          <span className="font-bold">{fmt(p.level)}</span>
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5"
                            style={{ color: p.status === "ARRIBA" ? "#00e676" : p.status === "ABAJO" ? "#ff1744" : "#ffd700" }}
                          >
                            {p.status === "ARRIBA" ? "↑ ARRIBA" : p.status === "ABAJO" ? "↓ ABAJO" : "≈ CERCA"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="text-[10px] text-[#8a9bb0] tracking-widest mb-2">⚡ RSI CASCADA</div>
                {Object.entries(nr.rsi_map || {}).map(([tf, rsi]) => (
                  <div key={tf} className="flex items-center gap-3 mb-1.5">
                    <span className="text-xs text-[#8a9bb0] w-10">{tf}</span>
                    <div className="flex-1 h-1 bg-white/10">
                      <div className="h-full" style={{ width: `${rsi}%`, background: rsi > 70 ? "#ff1744" : rsi < 30 ? "#00e676" : "#00e5ff" }} />
                    </div>
                    <span className="text-xs w-10 text-right" style={{ color: rsi > 70 ? "#ff1744" : rsi < 30 ? "#00e676" : "#eceff1" }}>
                      {rsi?.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>

              {/* MACRO */}
              <div className="border border-[#1a2535] bg-[#060a0f] p-5">
                <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#00e5ff] mb-3">🌍 CONTEXTO MACRO GLOBAL</div>
                {data.macro?.sesgo ? (
                  <>
                    <div
                      className="flex justify-between items-center px-3 py-2.5 mb-3"
                      style={{ background: "#0a0f16", borderLeft: `3px solid ${data.macro.sesgo === "RISK_ON" ? "#00e676" : data.macro.sesgo === "RISK_OFF" ? "#ff1744" : "#ffd700"}` }}
                    >
                      <div>
                        <div className="font-bold" style={{ color: data.macro.sesgo === "RISK_ON" ? "#00e676" : data.macro.sesgo === "RISK_OFF" ? "#ff1744" : "#ffd700" }}>
                          {data.macro.sesgo}
                        </div>
                        <div className="text-[11px] text-[#8a9bb0]">Sesgo macro global</div>
                      </div>
                      <div className="font-bold">{data.macro.sesgo_score?.toFixed(0)}/100</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <InfoItem label="DXY" value={`${data.macro.dxy_change?.toFixed(2)}%`} valueColor={(data.macro.dxy_change ?? 0) >= 0 ? "#ff1744" : "#00e676"} />
                      <InfoItem label="VIX" value={data.macro.vix_value?.toFixed(0) ?? "─"} valueColor={(data.macro.vix_value ?? 0) > 25 ? "#ff1744" : (data.macro.vix_value ?? 0) < 18 ? "#00e676" : "#ffd700"} />
                      <InfoItem label="SPX" value={`${data.macro.spx_change?.toFixed(2)}%`} valueColor={(data.macro.spx_change ?? 0) >= 0 ? "#00e676" : "#ff1744"} />
                      <InfoItem label="Mag7" value={`${data.macro.mag7_avg?.toFixed(2)}%`} valueColor={(data.macro.mag7_avg ?? 0) >= 0 ? "#00e676" : "#ff1744"} />
                      <InfoItem label="Oro (Gold)" value={fmt(data.macro.gold_value)} valueColor="#ffd700" />
                      <InfoItem label="WTI (Petróleo)" value={fmt(data.macro.wti_value)} valueColor="#ff8a00" />
                    </div>
                  </>
                ) : (
                  <div className="text-[#8a9bb0] text-sm text-center py-4">Cargando contexto macro…</div>
                )}
              </div>

              {/* CONFLUENCIAS */}
              <div className="border border-[#1a2535] bg-[#060a0f] p-5">
                <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#00e5ff] mb-3">⭐ ZONAS DE CONFLUENCIA</div>
                {(nr.zonas_clave || []).slice(0, 6).map(([p, d, s], i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center px-3 py-2 mb-1"
                    style={{ borderLeft: `3px solid ${s >= 8 ? "#ffd700" : s >= 5 ? "#00e5ff" : "#8a9bb0"}`, background: s >= 8 ? "#ffd70011" : s >= 5 ? "#00e5ff11" : "#8a9bb011" }}
                  >
                    <div>
                      <div className="text-sm font-bold">{fmt(p)}</div>
                      <div className="text-[11px] text-[#8a9bb0]">{d}</div>
                    </div>
                    <div className="font-bold text-sm" style={{ color: s >= 8 ? "#ffd700" : s >= 5 ? "#00e5ff" : "#8a9bb0" }}>
                      {s.toFixed(0)}pts
                    </div>
                  </div>
                )) || <div className="text-[#8a9bb0] text-sm text-center py-4">Sin confluencias detectadas</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value, valueColor }: { label: string; value: React.ReactNode; valueColor?: string }) {
  return (
    <div className="flex justify-between bg-[#0a0f16] px-3 py-1.5">
      <span className="text-[10px] text-[#8a9bb0]">{label}</span>
      <span className="text-[11px] font-bold" style={valueColor ? { color: valueColor } : undefined}>{value}</span>
    </div>
  );
}
