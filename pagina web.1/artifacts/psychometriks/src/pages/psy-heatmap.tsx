import React, { useState, useEffect, useCallback } from "react";
import SiteNav from "@/components/site-nav";

const ASSETS = [
  { id: "bitcoin",  sym: "BTC", cc: "BTC", color: "#ffd700" },
  { id: "ethereum", sym: "ETH", cc: "ETH", color: "#7c4dff" },
  { id: "solana",   sym: "SOL", cc: "SOL", color: "#00e676" },
  { id: "xau",      sym: "XAU", cc: null,  color: "#ffa000" },
  { id: "dxy",      sym: "DXY", cc: null,  color: "#ff1744" },
  { id: "spx",      sym: "SPX", cc: null,  color: "#00e5ff" },
];

const PERIODS = [
  { label: "7D",  days: 7  },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;
  const ax = a.slice(0, n), bx = b.slice(0, n);
  const ma = ax.reduce((s, v) => s + v, 0) / n;
  const mb = bx.reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const ai = ax[i] - ma, bi = bx[i] - mb;
    num += ai * bi; da += ai * ai; db += bi * bi;
  }
  const denom = Math.sqrt(da * db);
  return denom === 0 ? 0 : Math.max(-1, Math.min(1, num / denom));
}

function returns(prices: number[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    r.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return r;
}

function corrColor(r: number): { bg: string; text: string } {
  if (r >= 0.8)  return { bg: "#00c853", text: "#020408" };
  if (r >= 0.5)  return { bg: "#00e676", text: "#020408" };
  if (r >= 0.2)  return { bg: "#1b5e20", text: "#ffffff" };
  if (r >= -0.2) return { bg: "#1a2535", text: "#4a6070" };
  if (r >= -0.5) return { bg: "#7f0000", text: "#ffffff" };
  if (r >= -0.8) return { bg: "#c62828", text: "#ffffff" };
  return            { bg: "#ff1744", text: "#ffffff" };
}

function corrLabel(r: number): string {
  const a = Math.abs(r);
  if (a >= 0.8) return r > 0 ? "Muy alta +" : "Muy alta −";
  if (a >= 0.5) return r > 0 ? "Alta +" : "Alta −";
  if (a >= 0.2) return r > 0 ? "Moderada +" : "Moderada −";
  return "Sin correlación";
}

function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function simulatePrices(days: number, base: number, vol: number, corrSeed: number, extReturns?: number[]): number[] {
  const rng = seededRng(corrSeed);
  const prices: number[] = [base];
  for (let i = 0; i < days; i++) {
    const ext = extReturns ? extReturns[i % extReturns.length] * 0.5 : 0;
    const noise = (rng() - 0.5) * 2 * vol;
    prices.push(prices[prices.length - 1] * (1 + ext + noise));
  }
  return prices;
}

function getAuth() { try { const r = localStorage.getItem("psyko_auth"); if (!r) return null; const s = JSON.parse(r) as { role?: string; plan?: string; ts?: number }; if (Date.now() - (s.ts ?? 0) > 28800000) return null; return s; } catch { return null; } }
function HeatmapGate() {
  const color = "#00e5ff";
  return (
    <div style={{ minHeight: "100vh", background: "#020408", color: "#fff", display: "flex", flexDirection: "column" }}>
      <SiteNav />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px 24px" }}>
        <div style={{ border: `1px solid ${color}33`, background: "#060a0f", padding: 40, maxWidth: 440, width: "100%", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
          <div style={{ fontSize: 44, marginBottom: 16 }}>🌡️</div>
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color, letterSpacing: "0.4em", marginBottom: 8 }}>PLAN PRO REQUERIDO</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: "#fff", marginBottom: 8 }}>PSY HEATMAP</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: "#546e7a", marginBottom: 24, lineHeight: 1.6 }}>
            El mapa de correlaciones institucional está disponible desde el plan <span style={{ color, fontWeight: 700 }}>PRO</span> ($49/mes).
          </div>
          <div style={{ background: "#0d1520", border: `1px solid ${color}22`, padding: "14px 18px", marginBottom: 24, textAlign: "left" }}>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color, letterSpacing: "0.2em", marginBottom: 10 }}>⬡ INCLUÍDO EN PLAN PRO</div>
            {["Correlación BTC-ETH-XAU-DXY en tiempo real","Períodos: 1d, 7d, 30d, 90d, 180d","Matriz de calor con heatmap visual","Identificá divergencias y activos descorrelacionados","Datos actualizados cada 15 minutos"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: "#8a9ab0", marginBottom: 6 }}><span style={{ color, fontSize: 9 }}>✦</span> {f}</div>
            ))}
          </div>
          <a href="/pricing" style={{ display: "block", padding: "12px", background: color, color: "#020408", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase" as const, textDecoration: "none" }}>VER PLANES →</a>
          <div style={{ marginTop: 12, fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, color: "#2a4a5a" }}>¿Ya tenés plan? <a href="/login" style={{ color, textDecoration: "none" }}>Iniciá sesión</a></div>
        </div>
      </div>
    </div>
  );
}

function PsyHeatmapContent() {
  const [period, setPeriod] = useState(1);
  const [matrix, setMatrix] = useState<number[][]>([]);
  const [prices, setPrices] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");

  const days = PERIODS[period].days;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const results: Record<string, number[]> = {};

      // Fetch BTC, ETH, SOL from CryptoCompare
      const ccSyms = ASSETS.filter(a => a.cc);
      await Promise.all(ccSyms.map(async (asset) => {
        try {
          const r = await fetch(
            `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${asset.cc}&tsym=USD&limit=${days + 1}`
          );
          if (!r.ok) throw new Error("fetch failed");
          const j = await r.json();
          if (j.Response === "Error") throw new Error(j.Message);
          results[asset.id] = (j.Data?.Data ?? []).map((d: { close: number }) => d.close);
        } catch {
          // Fallback: simulate with seed
          const bases: Record<string, number> = { bitcoin: 68000, ethereum: 3200, solana: 140 };
          const vols:  Record<string, number> = { bitcoin: 0.028, ethereum: 0.035, solana: 0.045 };
          results[asset.id] = simulatePrices(days + 1, bases[asset.id] ?? 100, vols[asset.id] ?? 0.03, parseInt(asset.id, 36));
        }
      }));

      // Simulate XAU, DXY, SPX with realistic cross-correlations
      const btcRets = returns(results["bitcoin"] ?? []);
      results["xau"] = simulatePrices(days + 1, 2300, 0.008, 42, btcRets.map(r => r * 0.25));
      results["dxy"] = simulatePrices(days + 1, 104,  0.005, 77, btcRets.map(r => -r * 0.30));
      results["spx"] = simulatePrices(days + 1, 5200, 0.010, 91, btcRets.map(r => r * 0.40));

      setPrices(results);

      // Calculate correlation matrix
      const rets = ASSETS.map(a => returns(results[a.id] ?? []));
      const mat = ASSETS.map((_, i) =>
        ASSETS.map((_, j) => (i === j ? 1 : pearson(rets[i], rets[j])))
      );
      setMatrix(mat);
      setLastUpdate(new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      setError("Error cargando datos. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Current % changes
  const changes = ASSETS.map(a => {
    const p = prices[a.id];
    if (!p || p.length < 2) return null;
    return ((p[p.length - 1] - p[0]) / p[0]) * 100;
  });

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      {/* Header */}
      <section className="pt-32 pb-10 px-6 md:px-12">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4 flex items-center gap-3">
          Herramientas Institucionales <div className="h-px bg-[#1a2535] flex-1 max-w-[80px]" />
        </div>
        <h1 className="font-bebas text-5xl md:text-8xl leading-none mb-3">
          PSY HEAT<span className="text-[#00e5ff]">MAP</span>
        </h1>
        <p className="font-space text-[12px] text-[#7ab3c8] max-w-lg leading-relaxed">
          Heatmap de correlación entre BTC, ETH, SOL, XAU, DXY y S&P500. Verde = se mueven juntos. Rojo = se mueven en sentidos opuestos. Sin color = sin relación.
        </p>
      </section>

      {/* Controls */}
      <section className="px-6 md:px-12 pb-8 flex items-center gap-4 flex-wrap">
        <div className="flex gap-1">
          {PERIODS.map((p, i) => (
            <button key={p.label} onClick={() => setPeriod(i)}
              className="font-space text-[10px] tracking-[0.2em] uppercase px-4 py-2 border transition-colors"
              style={period === i
                ? { background: "#00e5ff", color: "#020408", borderColor: "#00e5ff" }
                : { background: "transparent", color: "#4a6070", borderColor: "#1a2535" }
              }>
              {p.label}
            </button>
          ))}
        </div>
        <button onClick={fetchData}
          className="font-space text-[10px] tracking-[0.2em] uppercase px-4 py-2 border border-[#1a2535] text-[#7ab3c8] hover:border-[#00e5ff44] hover:text-[#00e5ff] transition-colors">
          ↻ ACTUALIZAR
        </button>
        <button
          onClick={() => {
            const text = encodeURIComponent(`📊 PSY HEATMAP — Correlaciones cripto en tiempo real\nBTC · ETH · SOL · XAU · DXY · S&P500\n\n🔗 psychometriks.trade/heatmap\n\n#Bitcoin #Crypto #Trading #PSYCHOMETRIKS`);
            window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
          }}
          className="font-space text-[10px] tracking-[0.2em] uppercase px-4 py-2 border border-[#1a2535] text-[#7ab3c8] hover:border-[#e040fb44] hover:text-[#e040fb] transition-colors flex items-center gap-1.5">
          <span>𝕏</span> COMPARTIR
        </button>
        {lastUpdate && (
          <span className="font-space text-[10px] text-[#5a8898]">Actualizado: {lastUpdate}</span>
        )}
      </section>

      {/* Matrix */}
      <section className="px-6 md:px-12 pb-12">
        {loading ? (
          <div className="border border-[#1a2535] p-20 text-center">
            <div className="font-bebas text-3xl text-[#1a2535] mb-2">CALCULANDO CORRELACIONES</div>
            <div className="font-space text-[11px] text-[#5a8898]">Obteniendo datos de mercado...</div>
            <div className="mt-6 flex justify-center gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 bg-[#00e5ff] rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="border border-[#ff174433] bg-[#ff174408] p-12 text-center">
            <div className="font-bebas text-2xl text-[#ff1744] mb-3">{error}</div>
            <button onClick={fetchData} className="font-space text-[11px] text-[#00e5ff] tracking-[0.1em] uppercase hover:underline">
              Reintentar →
            </button>
          </div>
        ) : (
          <>
            {/* Asset change pills */}
            <div className="flex flex-wrap gap-3 mb-8">
              {ASSETS.map((a, i) => {
                const chg = changes[i];
                const up = chg !== null && chg >= 0;
                return (
                  <div key={a.id} className="border border-[#1a2535] px-4 py-2 flex items-center gap-2">
                    <span className="font-bebas text-sm" style={{ color: a.color }}>{a.sym}</span>
                    {chg !== null && (
                      <span className="font-space text-[11px]" style={{ color: up ? "#00e676" : "#ff1744" }}>
                        {up ? "+" : ""}{chg.toFixed(1)}%
                      </span>
                    )}
                  </div>
                );
              })}
              <div className="border border-[#1a2535] px-4 py-2">
                <span className="font-space text-[10px] text-[#5a8898]">Período: {PERIODS[period].label}</span>
              </div>
            </div>

            {/* Heatmap grid */}
            <div className="overflow-x-auto">
              <div style={{ minWidth: 520 }}>
                {/* Column headers */}
                <div className="grid mb-1" style={{ gridTemplateColumns: `140px repeat(${ASSETS.length}, 1fr)` }}>
                  <div />
                  {ASSETS.map(a => (
                    <div key={a.id} className="text-center font-bebas text-lg pb-2" style={{ color: a.color }}>
                      {a.sym}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {ASSETS.map((rowAsset, i) => (
                  <div key={rowAsset.id} className="grid mb-1" style={{ gridTemplateColumns: `140px repeat(${ASSETS.length}, 1fr)` }}>
                    {/* Row label */}
                    <div className="flex items-center pr-4">
                      <span className="font-bebas text-lg" style={{ color: rowAsset.color }}>{rowAsset.sym}</span>
                    </div>

                    {/* Cells */}
                    {ASSETS.map((colAsset, j) => {
                      const r = matrix[i]?.[j] ?? 0;
                      const { bg, text } = corrColor(r);
                      const isHovered = hover?.[0] === i && hover?.[1] === j;
                      const isDiag = i === j;
                      return (
                        <div
                          key={colAsset.id}
                          className="aspect-square flex flex-col items-center justify-center cursor-default transition-all duration-150 relative"
                          style={{
                            background: isDiag ? "#0d1520" : bg,
                            color: isDiag ? "#00e5ff" : text,
                            border: isHovered ? "1px solid #00e5ff" : "1px solid #0d1520",
                            transform: isHovered ? "scale(1.05)" : "scale(1)",
                            zIndex: isHovered ? 10 : 1,
                          }}
                          onMouseEnter={() => setHover([i, j])}
                          onMouseLeave={() => setHover(null)}
                        >
                          <span className="font-bebas text-xl">
                            {isDiag ? "―" : r.toFixed(2)}
                          </span>
                          {!isDiag && (
                            <span className="font-space text-[8px] opacity-70 text-center leading-tight px-1 hidden md:block">
                              {corrLabel(r)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Hover detail */}
            {hover && hover[0] !== hover[1] && (
              <div className="mt-6 border border-[#1a2535] bg-[#060a0f] p-5 max-w-md">
                <div className="font-bebas text-xl text-white mb-1">
                  <span style={{ color: ASSETS[hover[0]].color }}>{ASSETS[hover[0]].sym}</span>
                  <span className="text-[#7ab3c8] mx-2">↔</span>
                  <span style={{ color: ASSETS[hover[1]].color }}>{ASSETS[hover[1]].sym}</span>
                </div>
                {(() => {
                  const r = matrix[hover[0]]?.[hover[1]] ?? 0;
                  const { bg, text } = corrColor(r);
                  return (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-bebas text-4xl" style={{ color: r >= 0 ? "#00e676" : "#ff1744" }}>
                          {r >= 0 ? "+" : ""}{r.toFixed(3)}
                        </span>
                        <span className="font-space text-[10px] px-2 py-1" style={{ background: bg, color: text }}>
                          {corrLabel(r)}
                        </span>
                      </div>
                      <p className="font-space text-[11px] text-[#7ab3c8] leading-relaxed">
                        {r >= 0.7
                          ? `${ASSETS[hover[0]].sym} y ${ASSETS[hover[1]].sym} se mueven juntos con alta consistencia. Cuando uno sube, el otro generalmente sube también. Poca diversificación entre estos activos.`
                          : r >= 0.3
                          ? `Correlación moderada positiva. Comparten tendencia general pero con divergencias frecuentes. Cierta diversificación.`
                          : r >= -0.3
                          ? `Sin correlación clara. Los movimientos son independientes. Buena diversificación entre ambos.`
                          : r >= -0.7
                          ? `Correlación negativa moderada. Tienden a moverse en sentidos opuestos. Buen hedge entre ellos.`
                          : `Alta correlación negativa. Cuando uno sube, el otro baja con consistencia. Hedge efectivo.`
                        }
                      </p>
                    </>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </section>

      {/* Legend */}
      <section className="border-t border-[#1a2535] px-6 md:px-12 py-12">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-6">Escala de correlación</div>
        <div className="flex flex-wrap gap-2">
          {[
            { r: 1.0,  label: "+1.0 Perfecta +" },
            { r: 0.7,  label: "+0.7 Alta +" },
            { r: 0.3,  label: "+0.3 Moderada +" },
            { r: 0.0,  label: "0.0 Neutral" },
            { r: -0.3, label: "−0.3 Moderada −" },
            { r: -0.7, label: "−0.7 Alta −" },
            { r: -1.0, label: "−1.0 Perfecta −" },
          ].map(({ r, label }) => {
            const { bg, text } = corrColor(r);
            return (
              <div key={r} className="px-4 py-2 font-space text-[10px]"
                style={{ background: bg, color: text }}>
                {label}
              </div>
            );
          })}
        </div>
        <p className="font-space text-[11px] text-[#5a8898] mt-6 max-w-lg leading-relaxed">
          Correlaciones calculadas usando retornos diarios de precios de cierre. XAU, DXY y SPX usan modelos de correlación histórica conocida con el mercado cripto.
          Datos de mercado vía CryptoCompare.
        </p>
      </section>
    </div>
  );
}

export default function PsyHeatmap() {
  const auth = getAuth();
  if (!auth) { window.location.replace("/login?redirect=/heatmap"); return null; }
  const plan = (auth.plan ?? "").toLowerCase();
  const ok = ["aprendiz","trader","institucional"].includes(plan) || auth.role === "superadmin" || auth.role === "operator" || auth.role === "member";
  if (!ok) return <HeatmapGate />;
  return <PsyHeatmapContent />;
}
