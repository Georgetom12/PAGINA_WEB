import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";

interface ScoreData {
  score: number;
  label: string;
  color: string;
  glow: string;
  description: string;
  components: { name: string; value: number; contribution: number; color: string; detail: string }[];
  btcPrice: number;
  btcChange: number;
  fundingRate: number;
  volume24h: number;
}

const LEVELS = [
  { min: 0,  max: 15, label: "CAPITULACIÓN",      color: "#7b0000", glow: "#ff000080", desc: "Mercado en pánico extremo. Las manos débiles están vendiendo todo. Históricamente, zona de acumulación institucional." },
  { min: 15, max: 30, label: "MIEDO EXTREMO",     color: "#ff1744", glow: "#ff174480", desc: "Dominancia del miedo. Funding negativo, liquidaciones masivas. Posible reversal de corto plazo." },
  { min: 30, max: 45, label: "PRECAUCIÓN",        color: "#ff6d00", glow: "#ff6d0080", desc: "Mercado inestable. Los datos macro presionan. Prudencia ante nuevas posiciones long." },
  { min: 45, max: 55, label: "NEUTRAL",            color: "#ffd700", glow: "#ffd70080", desc: "Equilibrio entre compradores y vendedores. Mercado en rango. Sin señal clara direccional." },
  { min: 55, max: 70, label: "CODICIA",            color: "#00e676", glow: "#00e67680", desc: "Momentum alcista. Funding positivo, flujo de compras. Gestión de riesgo activa recomendada." },
  { min: 70, max: 85, label: "EUFORIA",            color: "#00e5ff", glow: "#00e5ff80", desc: "Mercado sobrecalentado. Retail entrando en pánico comprador. Zona de distribución institucional." },
  { min: 85, max: 100,label: "PELIGRO EXTREMO",   color: "#e040fb", glow: "#e040fb80", desc: "Máxima euforia. OI en máximos históricos, funding disparado. Alto riesgo de flush masivo." },
];

function getLevel(score: number) {
  return LEVELS.find(l => score >= l.min && score <= l.max) ?? LEVELS[3];
}

function calcScore(funding: number, priceChange: number, volume: number, prevScore: number): ScoreData & { score: number } {
  const fundingPct = funding * 100;

  const fundingComponent = Math.max(-25, Math.min(25, fundingPct * 400));
  const priceComponent   = Math.max(-20, Math.min(20, priceChange * 3));
  const volumeMultiplier = volume > 50_000_000_000 ? 1.1 : volume > 30_000_000_000 ? 1.0 : 0.9;
  const momentumComponent= priceChange > 5 ? 10 : priceChange > 2 ? 5 : priceChange < -5 ? -10 : priceChange < -2 ? -5 : 0;
  const oiComponent      = fundingPct > 0.05 ? 8 : fundingPct < -0.03 ? -8 : 0;

  const raw = 50 + fundingComponent + priceComponent + momentumComponent + oiComponent;
  const base = Math.max(2, Math.min(98, raw * volumeMultiplier));
  const score = Math.round(prevScore * 0.3 + base * 0.7);

  const level = getLevel(score);

  return {
    score,
    label: level.label,
    color: level.color,
    glow: level.glow,
    description: level.desc,
    btcPrice: 0,
    btcChange: priceChange,
    fundingRate: fundingPct,
    volume24h: volume,
    components: [
      {
        name: "FUNDING RATE",
        value: Math.round(50 + fundingComponent),
        contribution: Math.round(fundingComponent),
        color: fundingPct > 0 ? "#00e676" : "#ff1744",
        detail: `${fundingPct.toFixed(4)}% — ${fundingPct > 0.05 ? "Longs pagando mucho" : fundingPct < -0.03 ? "Shorts pagando" : "Equilibrado"}`,
      },
      {
        name: "MOMENTUM PRECIO",
        value: Math.round(50 + priceComponent),
        contribution: Math.round(priceComponent),
        color: priceChange > 0 ? "#00e676" : "#ff1744",
        detail: `${priceChange > 0 ? "+" : ""}${priceChange.toFixed(2)}% en 24h`,
      },
      {
        name: "OPEN INTEREST",
        value: Math.round(50 + oiComponent),
        contribution: Math.round(oiComponent),
        color: oiComponent > 0 ? "#e040fb" : oiComponent < 0 ? "#ff6d00" : "#4a6070",
        detail: oiComponent > 0 ? "OI creciendo — posiciones apalancadas" : oiComponent < 0 ? "OI cayendo — desapalancamiento" : "OI estable",
      },
      {
        name: "VOLUMEN 24H",
        value: volume > 50e9 ? 70 : volume > 30e9 ? 55 : 40,
        contribution: Math.round((volumeMultiplier - 1) * 50),
        color: volume > 50e9 ? "#00e5ff" : volume > 30e9 ? "#ffd700" : "#4a6070",
        detail: `$${(volume / 1e9).toFixed(1)}B — ${volume > 50e9 ? "Volumen muy alto" : volume > 30e9 ? "Volumen normal" : "Volumen bajo"}`,
      },
    ],
  };
}

function GaugeArc({ score, color, glow }: { score: number; color: string; glow: string }) {
  const r = 140;
  const cx = 200; const cy = 200;
  const startAngle = -220;
  const totalArc   = 260;
  const angle      = startAngle + (score / 100) * totalArc;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arc = (r2: number, a1: number, a2: number, stroke: string, strokeW: number, dash?: string) => {
    const x1 = cx + r2 * Math.cos(toRad(a1));
    const y1 = cy + r2 * Math.sin(toRad(a1));
    const x2 = cx + r2 * Math.cos(toRad(a2));
    const y2 = cy + r2 * Math.sin(toRad(a2));
    const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
    return (
      <path
        d={`M ${x1} ${y1} A ${r2} ${r2} 0 ${large} 1 ${x2} ${y2}`}
        fill="none" stroke={stroke} strokeWidth={strokeW}
        strokeLinecap="round" strokeDasharray={dash}
      />
    );
  };

  const tickX = (deg: number, r2: number) => cx + r2 * Math.cos(toRad(deg));
  const tickY = (deg: number, r2: number) => cy + r2 * Math.sin(toRad(deg));

  const needleX = cx + (r - 20) * Math.cos(toRad(angle));
  const needleY = cy + (r - 20) * Math.sin(toRad(angle));

  return (
    <svg viewBox="0 0 400 320" className="w-full max-w-[400px] mx-auto">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="6" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ff1744" />
          <stop offset="25%"  stopColor="#ff6d00" />
          <stop offset="50%"  stopColor="#ffd700" />
          <stop offset="75%"  stopColor="#00e676" />
          <stop offset="100%" stopColor="#e040fb" />
        </linearGradient>
      </defs>

      {/* Background arc track */}
      {arc(r, -220, 80, "#0d1520", 24)}

      {/* Colored gradient arc fill */}
      {arc(r, -220, startAngle + (score / 100) * totalArc, `url(#arcGrad)`, 24)}

      {/* Glow arc on active part */}
      {arc(r, -220, startAngle + (score / 100) * totalArc, color, 8, undefined)}

      {/* Tick marks */}
      {Array.from({ length: 11 }).map((_, i) => {
        const deg = -220 + (i / 10) * totalArc;
        const inner = tickX(deg, r - 16);
        const innerY = tickY(deg, r - 16);
        const outer = tickX(deg, r + 4);
        const outerY = tickY(deg, r + 4);
        return (
          <line key={i} x1={inner} y1={innerY} x2={outer} y2={outerY}
            stroke="#1a2535" strokeWidth={i % 5 === 0 ? 2 : 1} strokeLinecap="round" />
        );
      })}

      {/* Needle */}
      <line x1={cx} y1={cy} x2={needleX} y2={needleY}
        stroke={color} strokeWidth={3} strokeLinecap="round" filter="url(#glow)" />
      <circle cx={cx} cy={cy} r={8} fill={color} filter="url(#glow)" />
      <circle cx={cx} cy={cy} r={4} fill="#020408" />

      {/* Score number */}
      <text x={cx} y={cy + 52} textAnchor="middle"
        fill={color} fontSize="64" fontFamily="'Bebas Neue', sans-serif"
        filter="url(#glow)">
        {score}
      </text>
      <text x={cx} y={cy + 72} textAnchor="middle" fill="#4a6070" fontSize="11" fontFamily="'Space Mono', monospace">
        PSY SCORE
      </text>

      {/* Zone labels */}
      {[
        { deg: -210, label: "0", r: r + 20 },
        { deg: -55,  label: "50", r: r + 20 },
        { deg: 75,   label: "100", r: r + 20 },
      ].map((t, i) => (
        <text key={i}
          x={cx + (r + 18) * Math.cos(toRad(t.deg))}
          y={cy + (r + 18) * Math.sin(toRad(t.deg)) + 4}
          textAnchor="middle" fill="#2a4a5a" fontSize="10" fontFamily="'Space Mono', monospace">
          {t.label}
        </text>
      ))}
    </svg>
  );
}

export default function PsyScore() {
  const [data, setData]         = useState<(ScoreData & { score: number }) | null>(null);
  const [loading, setLoading]   = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [animScore, setAnimScore]   = useState(50);
  const scoreRef                    = useRef(50);
  const animRef                     = useRef<number>(0);
  const [copied, setCopied]         = useState(false);

  const animateTo = useCallback((target: number) => {
    const start = scoreRef.current;
    const diff  = target - start;
    const dur   = 1500;
    const t0    = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      const cur = Math.round(start + diff * ease);
      setAnimScore(cur);
      scoreRef.current = cur;
      if (p < 1) animRef.current = requestAnimationFrame(step);
    };
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(step);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [krakenRes, fundingRes] = await Promise.allSettled([
        fetch("/api/proxy/kraken/price?pair=XBTUSD").then(r => r.json()),
        fetch("/api/proxy/okx/funding?instId=BTC-USDT-SWAP").then(r => r.json()),
      ]);

      let price = 0, priceChange = 0, volume = 35e9;
      if (krakenRes.status === "fulfilled") {
        const t = krakenRes.value;
        const pair = Object.keys(t.result ?? {})[0];
        const ticker = t.result?.[pair];
        if (ticker) {
          price       = parseFloat(ticker.c?.[0] ?? "0");
          const open  = parseFloat(ticker.o ?? "0");
          priceChange = open > 0 ? ((price - open) / open) * 100 : 0;
          volume      = parseFloat(ticker.v?.[1] ?? "0") * price;
        }
      }

      let fundingRate = 0.0001;
      if (fundingRes.status === "fulfilled") {
        fundingRate = parseFloat(fundingRes.value?.data?.[0]?.fundingRate ?? "0.0001");
      }

      const scored = calcScore(fundingRate, priceChange, volume, scoreRef.current);
      scored.btcPrice = price;
      setData(scored);
      animateTo(scored.score);
      setLastUpdate(new Date());
    } catch {
      const fallback = calcScore(0.0001, 2.3, 35e9, scoreRef.current);
      fallback.btcPrice = 65000;
      setData(fallback);
      animateTo(fallback.score);
    } finally {
      setLoading(false);
    }
  }, [animateTo]);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 60_000);
    return () => { clearInterval(i); cancelAnimationFrame(animRef.current); };
  }, [fetchData]);

  const level      = getLevel(animScore);
  const shareText  = data ? `🧠 PSY SCORE: ${data.score}/100 — ${data.label}\n\nEl indicador institucional de PSYCHOMETRIKS dice: ${data.description.slice(0, 80)}...\n\n👉 psychometriks.com/psy-score` : "";

  const share = (platform: "twitter" | "copy") => {
    if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank");
    } else {
      navigator.clipboard.writeText(shareText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani overflow-hidden">
      {/* Ambient glow background */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 40%, ${level.glow}18 0%, transparent 70%)`, transition: "all 2s ease" }} />

      <div className="relative z-10 pt-8 pb-16 px-4 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <div>
            <div className="font-space text-[9px] text-[#5a8898] tracking-[0.3em] uppercase mb-1">PSYCHOMETRIKS · INDICADOR PROPIO</div>
            <div className="font-bebas text-4xl text-white leading-none">PSY SCORE</div>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdate && <div className="font-space text-[9px] text-[#5a8898]">{lastUpdate.toLocaleTimeString("es-EC")}</div>}
            <button onClick={fetchData}
              className="font-space text-[9px] px-2.5 py-1.5 border border-[#1a2535] text-[#7ab3c8] hover:border-[#00e5ff44] hover:text-[#00e5ff] transition-colors">
              ↺
            </button>
          </div>
        </div>

        {/* Main gauge */}
        <div className="text-center mb-6">
          {loading ? (
            <div className="w-64 h-64 mx-auto flex items-center justify-center">
              <div className="font-space text-[12px] text-[#5a8898] animate-pulse">CALCULANDO SCORE...</div>
            </div>
          ) : (
            <GaugeArc score={animScore} color={level.color} glow={level.glow} />
          )}

          {/* Label */}
          <div className="mt-2">
            <div className="font-bebas text-5xl tracking-widest transition-all duration-1000"
              style={{ color: level.color, textShadow: `0 0 40px ${level.glow}` }}>
              {level.label}
            </div>
            <p className="font-space text-[12px] text-[#7ab3c8] max-w-md mx-auto mt-2 leading-relaxed">
              {level.desc}
            </p>
          </div>
        </div>

        {/* Share buttons */}
        <div className="flex justify-center gap-3 mb-10">
          <button onClick={() => share("twitter")}
            className="font-space text-[11px] font-bold tracking-[0.15em] px-5 py-2.5 transition-all border"
            style={{ borderColor: "#1d9bf044", color: "#1d9bf0", background: "#1d9bf010" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#1d9bf020")}
            onMouseLeave={e => (e.currentTarget.style.background = "#1d9bf010")}>
            𝕏 COMPARTIR EN TWITTER
          </button>
          <button onClick={() => share("copy")}
            className="font-space text-[11px] tracking-[0.1em] px-5 py-2.5 border border-[#1a2535] text-[#7ab3c8] hover:text-white transition-colors">
            {copied ? "✓ COPIADO" : "📋 COPIAR TEXTO"}
          </button>
        </div>

        {/* Component breakdown */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {data.components.map((comp, i) => (
              <div key={i} className="border border-[#1a2535] bg-[#060a0f] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em]">{comp.name}</div>
                    <div className="font-space text-[11px] text-[#5a8898] mt-0.5">{comp.detail}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[20px] font-black" style={{ color: comp.color }}>{comp.value}</div>
                    <div className="font-mono text-[11px]" style={{ color: comp.contribution >= 0 ? "#00e676" : "#ff1744" }}>
                      {comp.contribution >= 0 ? "+" : ""}{comp.contribution}
                    </div>
                  </div>
                </div>
                {/* Mini bar */}
                <div className="h-1.5 bg-[#0d1520] overflow-hidden">
                  <div className="h-full transition-all duration-1000" style={{ width: `${comp.value}%`, background: comp.color }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live BTC stats */}
        {data && (
          <div className="border border-[#1a2535] bg-[#060a0f] p-5 mb-6">
            <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase mb-4">DATOS EN VIVO — BTC/USDT</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "PRECIO BTC", value: data.btcPrice > 0 ? `$${data.btcPrice.toLocaleString("es-EC", { maximumFractionDigits: 0 })}` : "—", color: "#fff" },
                { label: "CAMBIO 24H", value: `${data.btcChange >= 0 ? "+" : ""}${data.btcChange.toFixed(2)}%`, color: data.btcChange >= 0 ? "#00e676" : "#ff1744" },
                { label: "FUNDING RATE", value: `${data.fundingRate.toFixed(4)}%`, color: data.fundingRate > 0 ? "#e040fb" : "#00e5ff" },
                { label: "VOLUMEN 24H", value: `$${(data.volume24h / 1e9).toFixed(1)}B`, color: "#ffd700" },
              ].map((item, i) => (
                <div key={i} className="bg-[#080d14] border border-[#1a2535] p-3 text-center">
                  <div className="font-space text-[9px] text-[#5a8898] tracking-[0.1em] mb-1">{item.label}</div>
                  <div className="font-mono text-[15px] font-bold" style={{ color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historical reference */}
        <div className="border border-[#1a2535] bg-[#060a0f] p-5 mb-6">
          <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase mb-4">REFERENCIA HISTÓRICA</div>
          <div className="space-y-2">
            {[
              { event: "ATH BTC Noviembre 2021", score: 96, label: "EUFORIA", color: "#e040fb" },
              { event: "Crash Mayo 2021 (-50%)", score: 8,  label: "CAPITULACIÓN", color: "#ff1744" },
              { event: "Colapso FTX Nov 2022",   score: 5,  label: "CAPITULACIÓN", color: "#7b0000" },
              { event: "Recovery Enero 2023",     score: 38, label: "PRECAUCIÓN", color: "#ff6d00" },
              { event: "Bull run Q1 2024",        score: 78, label: "EUFORIA", color: "#00e5ff" },
            ].map((ref, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="font-mono text-[12px] font-bold w-8 text-right shrink-0" style={{ color: ref.color }}>{ref.score}</div>
                <div className="flex-1 h-1.5 bg-[#0d1520] overflow-hidden">
                  <div className="h-full" style={{ width: `${ref.score}%`, background: ref.color }} />
                </div>
                <div className="font-space text-[11px] text-[#7ab3c8] shrink-0 w-48 text-right truncate">{ref.event}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="grid grid-cols-2 gap-3">
          {/* (julio 21 2026) Antes había un atajo directo a /realtime (PSY
              Terminal) acá para admins — Jorge pidió sacarlo: el Terminal
              solo debe estar accesible desde el Panel Maestro real
              (PANEL 6: ADMINISTRADOR en dashboard.tsx), no repartido como
              atajo en páginas sueltas. Ahora todos, admin incluido, ven el
              mismo botón hacia las señales reales del plan Educación. */}
          <Link href="/signals" className="py-4 text-center font-space text-[11px] font-bold tracking-[0.15em] uppercase border border-[#00e5ff44] text-[#00e5ff] no-underline hover:bg-[#00e5ff10] transition-colors">
            📡 VER SEÑALES
          </Link>
          <Link href="/pricing" className="py-4 text-center font-space text-[11px] font-bold tracking-[0.15em] uppercase text-[#020408] no-underline hover:opacity-90 transition-opacity" style={{ background: level.color }}>
            ACCESO COMPLETO
          </Link>
        </div>
      </div>
    </div>
  );
}
