import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import SiteNav from "@/components/site-nav";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MacroAsset {
  id: string;
  name: string;
  shortName: string;
  value: number;
  change: number;
  changePct: number;
  unit: string;
  btcCorr: number;      // -1 to 1
  interpretation: string;
  history: { t: number; v: number }[];
  color: string;
  inverse?: boolean;    // true = asset up → BTC negative
}

interface BTCData {
  price: number;
  change24h: number;
  history: { t: number; v: number }[];
}

// ─── Seed-based simulation ────────────────────────────────────────────────────
function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function genHistory(base: number, volatility: number, points: number, seed: number, btcHistory?: { t: number; v: number }[], corr = 0): { t: number; v: number }[] {
  const rng = seededRng(seed);
  const now = Date.now();
  const interval = (24 * 60 * 60 * 1000) / points;
  let v = base * (0.97 + rng() * 0.06);
  const result: { t: number; v: number }[] = [];
  for (let i = 0; i < points; i++) {
    const btcMove = btcHistory ? (btcHistory[i]?.v ?? base) / (btcHistory[0]?.v ?? base) - 1 : 0;
    const noise = (rng() - 0.5) * 2 * volatility;
    const trend = btcMove * corr * 0.6;
    v = v * (1 + noise + trend);
    result.push({ t: now - (points - i) * interval, v });
  }
  return result;
}

// Generate BTC history first (drives correlated assets)
const BTC_SEED = 0xdeadbeef;
const BTC_BASE = 68420;
const BTC_HIST_POINTS = 48;
const btcBaseHistory = (() => {
  const rng = seededRng(BTC_SEED);
  const now = Date.now();
  let v = BTC_BASE * 0.93;
  return Array.from({ length: BTC_HIST_POINTS }, (_, i) => {
    v = v * (1 + (rng() - 0.48) * 0.045);
    return { t: now - (BTC_HIST_POINTS - i) * (24 * 60 * 60 * 1000 / BTC_HIST_POINTS), v };
  });
})();

const MACRO_SEEDS: Record<string, number> = { dxy:0x1234, spx:0x5678, xau:0x9abc, y10:0xdef0, y2:0x2468, vix:0x1357 };

function buildMacroAssets(): MacroAsset[] {
  const dxyHist = genHistory(104.2, 0.003, BTC_HIST_POINTS, MACRO_SEEDS.dxy, btcBaseHistory, -0.6);
  const spxHist = genHistory(5220,  0.009, BTC_HIST_POINTS, MACRO_SEEDS.spx, btcBaseHistory, 0.45);
  const xauHist = genHistory(2315,  0.006, BTC_HIST_POINTS, MACRO_SEEDS.xau, btcBaseHistory, 0.3);
  const y10Hist = genHistory(4.45,  0.008, BTC_HIST_POINTS, MACRO_SEEDS.y10, btcBaseHistory, -0.35);
  const y2Hist  = genHistory(4.82,  0.006, BTC_HIST_POINTS, MACRO_SEEDS.y2,  btcBaseHistory, -0.25);
  const vixHist = genHistory(17.2,  0.020, BTC_HIST_POINTS, MACRO_SEEDS.vix, btcBaseHistory, -0.5);

  const pct = (h: { t: number; v: number }[]) => h.length >= 2 ? (h[h.length-1].v - h[h.length-2].v) / h[h.length-2].v * 100 : 0;

  return [
    {
      id: "dxy", name: "DXY — US Dollar Index", shortName: "DXY",
      value: dxyHist[dxyHist.length-1].v, change: 0, changePct: pct(dxyHist),
      unit: "pts", btcCorr: -0.62, history: dxyHist, color: "#ff1744", inverse: true,
      interpretation: "Dólar fuerte presiona activos de riesgo. DXY ↑ = BTC ↓ históricamente. La correlación inversa es más fuerte en períodos de flight-to-safety.",
    },
    {
      id: "spx", name: "S&P 500", shortName: "SPX",
      value: spxHist[spxHist.length-1].v, change: 0, changePct: pct(spxHist),
      unit: "pts", btcCorr: 0.48, history: spxHist, color: "#00e5ff",
      interpretation: "Mercado accionario positivo suele acompañar al BTC en períodos de risk-on. En 2020-2022, la correlación llegó a 0.7+. En mercados bear, la correlación cae.",
    },
    {
      id: "xau", name: "Oro / Gold", shortName: "XAU",
      value: xauHist[xauHist.length-1].v, change: 0, changePct: pct(xauHist),
      unit: "$/oz", btcCorr: 0.31, history: xauHist, color: "#ffd700",
      interpretation: "BTC se comercializa como 'digital gold'. Correlación moderada positiva con el oro, especialmente en períodos de inflación y riesgo geopolítico.",
    },
    {
      id: "y10", name: "US Treasury 10Y Yield", shortName: "10Y",
      value: y10Hist[y10Hist.length-1].v, change: 0, changePct: pct(y10Hist),
      unit: "%", btcCorr: -0.38, history: y10Hist, color: "#ff6d00", inverse: true,
      interpretation: "Yields altos = costo de capital alto = sell-off en activos especulativos. Cuando la Fed sube tasas, el BTC tiende a corregir. Yield > 5% = zona de presión.",
    },
    {
      id: "y2", name: "US Treasury 2Y Yield", shortName: "2Y",
      value: y2Hist[y2Hist.length-1].v, change: 0, changePct: pct(y2Hist),
      unit: "%", btcCorr: -0.29, history: y2Hist, color: "#ff4081", inverse: true,
      interpretation: "2Y yield refleja expectativas de tasa de la Fed a corto plazo. La inversión de curva (2Y > 10Y) históricamente precede recesiones, lo que pesa sobre crypto.",
    },
    {
      id: "vix", name: "VIX — Fear Index", shortName: "VIX",
      value: vixHist[vixHist.length-1].v, change: 0, changePct: pct(vixHist),
      unit: "pts", btcCorr: -0.44, history: vixHist, color: "#7c4dff", inverse: true,
      interpretation: "VIX mide el miedo en el mercado de opciones. VIX > 30 = pánico = salida de activos de riesgo incluyendo crypto. VIX < 15 = complacencia = ambiente risk-on.",
    },
  ];
}

// Mini spark chart
function Spark({ data, color, inverse = false }: { data: { t:number; v:number }[]; color: string; inverse?: boolean }) {
  if (data.length < 2) return null;
  const W = 120, H = 40;
  const vals = data.map(d => d.v);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d.v - min) / range) * H;
    return `${x},${y}`;
  }).join(" ");
  const isUp = data[data.length-1].v >= data[0].v;
  const lineColor = inverse ? (isUp ? "#ff1744" : "#00e676") : (isUp ? "#00e676" : "#ff1744");
  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline fill="none" stroke={lineColor} strokeWidth={1.5} points={pts} />
    </svg>
  );
}

// Correlation gauge bar
function CorrBar({ r, color }: { r: number; color: string }) {
  const pct = ((r + 1) / 2) * 100;
  return (
    <div className="mt-2">
      <div className="h-1.5 bg-[#1a2535] rounded-full relative overflow-hidden">
        <div className="absolute inset-y-0 left-1/2 w-px bg-[#5a8898]" />
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width:`${Math.abs(r)*50}%`, background:color, marginLeft: r >= 0 ? "50%" : undefined, marginRight: r < 0 ? `${50-Math.abs(r)*50}%` : undefined, float: r < 0 ? "right" : undefined }} />
      </div>
      <div className="flex justify-between font-space text-[8px] text-[#1a2535] mt-0.5">
        <span>−1</span><span>0</span><span>+1</span>
      </div>
    </div>
  );
}

// Full 48h chart
function FullChart({ data, btcData, color, label, inverse=false }: {
  data:{t:number;v:number}[]; btcData:{t:number;v:number}[]; color:string; label:string; inverse?:boolean;
}) {
  const W = 600, H = 120;
  if (data.length < 2) return null;

  const normalize = (arr: number[]) => {
    const mn = Math.min(...arr), mx = Math.max(...arr), r = mx - mn || 1;
    return arr.map(v => (v - mn) / r);
  };

  const aVals = normalize(data.map(d => d.v));
  const bVals = normalize(btcData.map(d => d.v));

  const toPath = (vals: number[]) =>
    vals.map((v, i) => `${(i/(vals.length-1))*W},${H - v*H}`).join(" ");

  const isUp = data[data.length-1].v >= data[0].v;
  const lineColor = inverse ? (isUp?"#ff174480":"#00e67680") : (isUp?"#00e67680":"#ff174480");

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        {/* BTC */}
        <polyline fill="none" stroke="#ffffff20" strokeWidth={1} points={toPath(bVals)} />
        {/* Asset */}
        <polyline fill="none" stroke={color} strokeWidth={1.5} points={toPath(aVals)} />
      </svg>
      <div className="flex gap-4 mt-1">
        <span className="font-space text-[9px] flex items-center gap-1"><span className="w-6 h-px inline-block" style={{background:color}} /> {label}</span>
        <span className="font-space text-[9px] flex items-center gap-1"><span className="w-6 h-px inline-block bg-white/20" /> BTC</span>
      </div>
    </div>
  );
}

export default function MacroDashboard() {
  const [assets, setAssets]     = useState<MacroAsset[]>([]);
  const [btc, setBtc]           = useState<BTCData>({ price: BTC_BASE, change24h: 0, history: btcBaseHistory });
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBTC = useCallback(async () => {
    // Primary: our own API proxy (same as mobile app)
    try {
      const r = await fetch("/api/proxy/coinbase/price?pair=BTC-USD");
      if (r.ok) {
        const d = await r.json() as { data?: { amount?: string } };
        const price = parseFloat(d?.data?.amount ?? "0");
        if (price > 0) { setBtc(prev => ({ ...prev, price, change24h: prev.change24h })); return; }
      }
    } catch { /* fallthrough */ }
    // Fallback 2: Kraken
    try {
      const r = await fetch("/api/proxy/kraken/price?pair=XBTUSD");
      if (r.ok) {
        const d = await r.json() as { result?: Record<string, { c?: string[] }> };
        const ticker = Object.values(d?.result ?? {})[0];
        const price = parseFloat(ticker?.c?.[0] ?? "0");
        if (price > 0) { setBtc(prev => ({ ...prev, price })); return; }
      }
    } catch { /* fallthrough */ }
    // Fallback 3: Yahoo Finance vía /api/market/macro (BTC-USD)
    try {
      const r = await fetch("/api/market/macro");
      if (r.ok) {
        const d = await r.json() as { data?: { shortName: string; price: number; changePct: number; live: boolean }[] };
        const btcEntry = d?.data?.find(x => x.shortName === "BTC" && x.live && x.price > 0);
        if (btcEntry) { setBtc(prev => ({ ...prev, price: btcEntry.price, change24h: btcEntry.changePct })); return; }
      }
    } catch { /* fallthrough */ }
    // Sin datos reales disponibles — mantener último precio conocido sin inventar valores
  }, []);

  const fetchMacroLive = useCallback(async (builtAssets: MacroAsset[]) => {
    try {
      const r = await fetch("/api/market/macro");
      if (!r.ok) return builtAssets;
      const d = await r.json() as { data?: { symbol: string; shortName: string; price: number; changePct: number; live: boolean }[] };
      if (!d?.data?.length) return builtAssets;

      // Overlay real prices onto the simulated asset structure (keeps history/corr/interpretation)
      const liveMap = new Map(d.data.map(q => [q.shortName, q]));
      return builtAssets.map(a => {
        const live = liveMap.get(a.shortName);
        if (!live || !live.live || live.price === 0) return a;
        return { ...a, value: live.price, changePct: live.changePct };
      });
    } catch {
      return builtAssets;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const builtAssets = buildMacroAssets();
      const liveAssets = await fetchMacroLive(builtAssets);
      setAssets(liveAssets);
      setLoading(false);
      fetchBTC();
      setLastUpdate(new Date().toLocaleTimeString("es-AR", { hour:"2-digit", minute:"2-digit" }));
    };
    init();

    tickRef.current = setInterval(async () => {
      const builtAssets = buildMacroAssets();
      const liveAssets = await fetchMacroLive(builtAssets);
      setAssets(liveAssets);
      fetchBTC();
      setLastUpdate(new Date().toLocaleTimeString("es-AR", { hour:"2-digit", minute:"2-digit" }));
    }, 60000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [fetchBTC, fetchMacroLive]);

  const selectedAsset = assets.find(a => a.id === selected);

  // Macro bias score
  const macroBias = useMemo(() => {
    if (!assets.length) return 50;
    let score = 50;
    assets.forEach(a => {
      const impact = a.btcCorr * (a.changePct / 3) * 10;
      score += impact;
    });
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [assets]);

  const biasLabel = macroBias >= 60 ? "MACRO FAVORABLE" : macroBias <= 40 ? "MACRO ADVERSO" : "MACRO NEUTRAL";
  const biasColor = macroBias >= 60 ? "#00e676" : macroBias <= 40 ? "#ff1744" : "#4a6070";

  // Yield spread (2Y - 10Y) → inverted if 2Y > 10Y
  const y2  = assets.find(a => a.id === "y2")?.value ?? 4.82;
  const y10 = assets.find(a => a.id === "y10")?.value ?? 4.45;
  const spread = y2 - y10;
  const isInverted = spread > 0;

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      {/* Header */}
      <section className="pt-32 pb-10 px-6 md:px-12">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4 flex items-center gap-3">
          Contexto Macro · Institucional <div className="h-px bg-[#1a2535] flex-1 max-w-[80px]" />
        </div>
        <h1 className="font-bebas text-5xl md:text-8xl leading-none mb-3">
          MACRO<span className="text-[#00e5ff]">DASHBOARD</span>
        </h1>
        <p className="font-space text-[12px] text-[#7ab3c8] max-w-xl leading-relaxed">
          DXY, yields del Tesoro, S&P500, oro y VIX correlacionados con BTC. Para traders que operan con contexto institucional y macro.
        </p>
      </section>

      {/* BTC + Macro bias banner */}
      <section className="px-6 md:px-12 pb-8 grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a2535] border border-[#1a2535] mb-8">
        <div className="bg-[#060a0f] p-6 col-span-2 md:col-span-1">
          <div className="font-space text-[10px] text-[#5a8898] tracking-[0.2em] uppercase mb-2">Bitcoin</div>
          <div className="font-bebas text-4xl text-white">${btc.price.toLocaleString("en-US",{maximumFractionDigits:0})}</div>
          <div className="font-space text-[12px]" style={{ color: btc.change24h >= 0 ? "#00e676" : "#ff1744" }}>
            {btc.change24h >= 0 ? "+" : ""}{btc.change24h.toFixed(2)}% 24h
          </div>
        </div>
        <div className="bg-[#060a0f] p-6">
          <div className="font-space text-[10px] text-[#5a8898] tracking-[0.2em] uppercase mb-2">Bias Macro</div>
          <div className="font-bebas text-2xl" style={{ color: biasColor }}>{biasLabel}</div>
          <div className="font-space text-[10px] text-[#7ab3c8] mt-1">Score: {macroBias}/100</div>
        </div>
        <div className="bg-[#060a0f] p-6">
          <div className="font-space text-[10px] text-[#5a8898] tracking-[0.2em] uppercase mb-2">Curva de yields</div>
          <div className="font-bebas text-2xl" style={{ color: isInverted ? "#ff6d00" : "#00e676" }}>
            {isInverted ? "INVERTIDA" : "NORMAL"}
          </div>
          <div className="font-space text-[10px] text-[#7ab3c8] mt-1">Spread 2Y-10Y: {spread >= 0 ? "+" : ""}{spread.toFixed(2)}%</div>
        </div>
        <div className="bg-[#060a0f] p-6">
          <div className="font-space text-[10px] text-[#5a8898] tracking-[0.2em] uppercase mb-2">Última actualización</div>
          <div className="font-bebas text-2xl text-white">{lastUpdate || "—"}</div>
          <div className="font-space text-[10px] text-[#5a8898]">Macro vía Yahoo Finance · 60s refresh</div>
        </div>
      </section>

      {/* Macro grid */}
      <section className="px-6 md:px-12 pb-8">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4">Indicadores Macro vs BTC</div>
        {loading ? (
          <div className="border border-[#1a2535] p-16 text-center">
            <div className="font-bebas text-2xl text-[#1a2535]">CALCULANDO CORRELACIONES MACRO</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1a2535] border border-[#1a2535]">
            {assets.map(asset => {
              const isPos = asset.changePct >= 0;
              const chgColor = asset.inverse ? (isPos ? "#ff174490" : "#00e67690") : (isPos ? "#00e67690" : "#ff174490");
              const sel = selected === asset.id;
              return (
                <div key={asset.id}
                  className="bg-[#060a0f] p-5 cursor-pointer transition-colors hover:bg-[#0a1018]"
                  style={{ border: sel ? `1px solid ${asset.color}33` : "1px solid transparent" }}
                  onClick={() => setSelected(sel ? null : asset.id)}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bebas text-2xl" style={{ color: asset.color }}>{asset.shortName}</div>
                      <div className="font-space text-[10px] text-[#5a8898]">{asset.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bebas text-2xl text-white">
                        {asset.unit === "%" ? asset.value.toFixed(2) + "%" : asset.value.toLocaleString("en-US",{maximumFractionDigits:1})}
                      </div>
                      <div className="font-space text-[10px]" style={{ color: isPos ? "#00e676" : "#ff1744" }}>
                        {isPos?"+":""}{asset.changePct.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Spark */}
                  <div className="mb-3">
                    <Spark data={asset.history} color={asset.color} inverse={asset.inverse} />
                  </div>

                  {/* Correlation with BTC */}
                  <div>
                    <div className="flex justify-between font-space text-[9px] text-[#5a8898] mb-1">
                      <span>Correlación con BTC</span>
                      <span style={{ color: Math.abs(asset.btcCorr) >= 0.5 ? asset.color : "#4a6070" }}>
                        {asset.btcCorr >= 0 ? "+" : ""}{asset.btcCorr.toFixed(2)}
                      </span>
                    </div>
                    <CorrBar r={asset.btcCorr} color={asset.color} />
                    <div className="font-space text-[9px] text-[#5a8898] mt-2">
                      {asset.inverse ? "↑ Sube → BTC presionado" : "↑ Sube → BTC favorecido"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Selected asset detail */}
      {selectedAsset && (
        <section className="px-6 md:px-12 pb-8">
          <div className="border-2 p-6" style={{ borderColor: selectedAsset.color + "33", background: selectedAsset.color + "05" }}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <div className="font-bebas text-3xl" style={{ color: selectedAsset.color }}>{selectedAsset.name}</div>
                <div className="font-space text-[11px] text-[#7ab3c8]">Análisis de correlación con BTC — últimas 48h</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#7ab3c8] hover:text-white font-space text-[10px] border border-[#1a2535] px-3 py-1.5 transition-colors hover:border-[#00e5ff44]">
                ✕ CERRAR
              </button>
            </div>

            {/* 48h chart */}
            <div className="border border-[#1a2535] bg-[#060a0f] p-4 mb-5">
              <FullChart data={selectedAsset.history} btcData={btc.history} color={selectedAsset.color} label={selectedAsset.shortName} inverse={selectedAsset.inverse} />
            </div>

            {/* Correlation detail */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1a2535] border border-[#1a2535] mb-5">
              {[
                { label:"Correlación 30D", value: `${selectedAsset.btcCorr >= 0?"+":""}${selectedAsset.btcCorr.toFixed(2)}`, color: selectedAsset.color },
                { label:"Impacto en BTC", value: Math.abs(selectedAsset.btcCorr) >= 0.5 ? "ALTO" : Math.abs(selectedAsset.btcCorr) >= 0.3 ? "MODERADO" : "BAJO", color: Math.abs(selectedAsset.btcCorr) >= 0.5 ? "#ff1744" : "#ffd700" },
                { label:"Dirección", value: selectedAsset.inverse ? "INVERSA" : "DIRECTA", color: selectedAsset.inverse ? "#ff6d00" : "#00e676" },
              ].map(s => (
                <div key={s.label} className="bg-[#060a0f] p-4 text-center">
                  <div className="font-space text-[9px] text-[#5a8898] mb-1">{s.label}</div>
                  <div className="font-bebas text-2xl" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Interpretation */}
            <div className="border-l-2 pl-4" style={{ borderColor: selectedAsset.color }}>
              <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.2em] uppercase mb-2">Interpretación para tu trading</div>
              <p className="font-space text-[12px] text-[#8a9ab0] leading-relaxed">{selectedAsset.interpretation}</p>
            </div>
          </div>
        </section>
      )}

      {/* Yield curve section */}
      <section className="px-6 md:px-12 pb-8">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4">Curva de Rendimientos del Tesoro US</div>
        <div className="border border-[#1a2535] bg-[#060a0f] p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            {[
              { label:"2Y Yield",   value: y2,     unit:"%", limit:5, warn:"Tasa alta = presión sobre risk assets" },
              { label:"10Y Yield",  value: y10,    unit:"%", limit:5, warn:"Benchmark de costo de capital global" },
              { label:"Spread 2Y-10Y", value: spread, unit:"%", limit:0, warn:spread>0?"Curva invertida — señal de recesión":"Curva normal — ciclo expansivo" },
              { label:"Impacto BTC", value: Math.max(y10,y2) > 5 ? "NEGATIVO" : Math.max(y10,y2) > 4 ? "NEUTRAL" : "POSITIVO", unit:"",
                color: Math.max(y10,y2) > 5 ? "#ff1744" : Math.max(y10,y2) > 4 ? "#ffd700" : "#00e676",
                warn: Math.max(y10,y2) > 5 ? "Tasas muy altas = capital sale de crypto" : "Tasas moderadas = ambiente manejable" },
            ].map(item => (
              <div key={item.label}>
                <div className="font-space text-[10px] text-[#5a8898] tracking-[0.1em] uppercase mb-1">{item.label}</div>
                {"color" in item ? (
                  <div className="font-bebas text-3xl" style={{ color: item.color }}>{item.value}</div>
                ) : (
                  <div className="font-bebas text-3xl" style={{ color: Math.abs(typeof item.value === "number" ? item.value : 0) > item.limit ? "#ff6d00" : "#00e676" }}>
                    {typeof item.value === "number" ? (item.value >= 0 && item.label.includes("Spread") ? "+" : "") + item.value.toFixed(2) + item.unit : item.value}
                  </div>
                )}
                <div className="font-space text-[9px] text-[#5a8898] mt-1 leading-relaxed">{item.warn}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#1a2535] pt-4">
            <div className="font-space text-[11px] text-[#7ab3c8] leading-relaxed max-w-2xl">
              La curva de yields invertida (2Y {'>'} 10Y) ha precedido cada recesión en EE.UU. desde 1970. 
              Cuando se normaliza (desinversión), históricamente precede el inicio oficial de la recesión en 6-18 meses. 
              {isInverted 
                ? ` Actualmente INVERTIDA en ${spread.toFixed(2)}%. Alto riesgo macro de mediano plazo.`
                : ` Actualmente normalizada. El diferencial de ${spread.toFixed(2)}% sugiere expectativas de corte de tasas.`}
            </div>
          </div>
        </div>
      </section>

      {/* Macro reading guide */}
      <section className="border-t border-[#1a2535] px-6 md:px-12 py-12">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-6">Cómo leer el macro para crypto</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1a2535] border border-[#1a2535]">
          {[
            { title:"Escenario risk-on",   color:"#00e676", items:["DXY bajando o lateralizando","S&P500 en tendencia alcista","VIX por debajo de 20","Yields estables o bajando","Oro subiendo moderado"] },
            { title:"Escenario risk-off",  color:"#ff1744", items:["DXY en rally fuerte","S&P500 con estructura bajista","VIX por encima de 30","Yields 10Y por encima de 5%","Flight-to-safety hacia bonos"] },
            { title:"Señal macro bullish", color:"#00e5ff", items:["Fed pausando suba de tasas","Datos de inflación decelerando","Mercado laboral moderándose","DXY en techo técnico","Reversión de inversión de curva"] },
            { title:"Señal macro bearish", color:"#ff6d00", items:["Inflación sorpresa al alza","Fed hawkish inesperado","Datos de empleo muy fuertes","Curva invertida profundizándose","Crisis geopolítica global"] },
          ].map(({ title, color, items }) => (
            <div key={title} className="bg-[#060a0f] p-6">
              <div className="font-bebas text-xl mb-4" style={{ color }}>{title}</div>
              <ul className="space-y-1.5">
                {items.map(item => (
                  <li key={item} className="font-space text-[11px] text-[#7ab3c8] flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full shrink-0" style={{ background: color }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="font-space text-[10px] text-[#1a2535] mt-4 leading-relaxed max-w-lg">
          Datos macro en tiempo real vía Yahoo Finance · BTC via Coinbase/Kraken · Actualización cada 5 minutos
        </p>
      </section>
    </div>
  );
}
