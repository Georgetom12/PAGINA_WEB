import React, { useState, useEffect, useRef, useCallback } from "react";
import SiteNav from "@/components/site-nav";

interface ReplayEvent {
  id: string;
  name: string;
  date: string;
  description: string;
  color: string;
  icon: string;
  tag: string;
  frames: Frame[];
  lesson: string;
  peak: number;
  trough: number;
}

interface Frame {
  label: string;
  price: number;
  note?: string;
  noteColor?: string;
  volume?: number;
  fundingRate?: number;
}

const EVENTS: ReplayEvent[] = [
  {
    id: "crash-may-2021",
    name: "CRASH DE MAYO 2021",
    date: "Mayo 2021",
    description: "BTC cae -53% en 1 mes. Elon Musk twitea contra Bitcoin, China prohíbe minería. El mercado pierde $1T en capitalización.",
    color: "#ff1744",
    icon: "💥",
    tag: "CRASH HISTÓRICO",
    peak: 64895, trough: 30202,
    lesson: "La correlación entre redes sociales y movimientos de BTC fue brutal. Los que tenían SL definido sobrevivieron. Los que confiaban en 'HODL a cualquier precio' perdieron 50%. Lección: los fundamentales no frenan un pánico de liquidaciones en cadena.",
    frames: [
      { label: "14 Abr", price: 64895, note: "🏆 ATH histórico — euforia total", noteColor: "#e040fb", volume: 85e9, fundingRate: 0.12 },
      { label: "17 Abr", price: 58200, note: "⚡ Primer flush (-10%)", noteColor: "#ff6d00", volume: 120e9, fundingRate: 0.08 },
      { label: "19 Abr", price: 51800, note: "🔴 Cascade de liquidaciones", noteColor: "#ff1744", volume: 180e9, fundingRate: -0.02 },
      { label: "24 Abr", price: 48600, note: "Elon tuitea sobre BTC y energía", noteColor: "#ff1744", volume: 90e9, fundingRate: -0.01 },
      { label: "12 May", price: 42500, note: "Tesla anuncia que no acepta BTC", noteColor: "#ff1744", volume: 200e9, fundingRate: -0.05 },
      { label: "19 May", price: 30202, note: "💀 China prohíbe minería — pánico total", noteColor: "#7b0000", volume: 350e9, fundingRate: -0.15 },
      { label: "26 May", price: 38500, note: "🟡 Primer rebote técnico", noteColor: "#ffd700", volume: 80e9, fundingRate: 0.01 },
      { label: "2 Jun",  price: 35200, note: "Retest del soporte", noteColor: "#ffd700", volume: 60e9, fundingRate: 0.02 },
    ],
  },
  {
    id: "ftx-collapse",
    name: "COLAPSO DE FTX",
    date: "Noviembre 2022",
    description: "FTX, el segundo exchange más grande del mundo, quiebra en 72 horas. Sam Bankman-Fried usa fondos de clientes. $8B desaparecen. BTC cae -26% en una semana.",
    color: "#ff6d00",
    icon: "🏚",
    tag: "BLACK SWAN",
    peak: 21400, trough: 15476,
    lesson: "Not your keys, not your coins. El riesgo de contraparte en exchanges centralizados es real. Los que tenían BTC en hardware wallets no perdieron nada. Los que confiaban en FTX, todo. Además: el contagio fue brutal — BlockFi, Genesis, Celsius ya habían caído antes.",
    frames: [
      { label: "6 Nov",  price: 21400, note: "CoinDesk publica balance de Alameda", noteColor: "#ffd700", volume: 45e9, fundingRate: 0.01 },
      { label: "7 Nov",  price: 20100, note: "⚡ Binance anuncia venta de FTT tokens", noteColor: "#ff6d00", volume: 90e9, fundingRate: -0.02 },
      { label: "8 Nov",  price: 18200, note: "🔴 FTX congela retiros", noteColor: "#ff1744", volume: 180e9, fundingRate: -0.08 },
      { label: "9 Nov",  price: 16400, note: "Binance CZ dice que no compra FTX", noteColor: "#ff1744", volume: 220e9, fundingRate: -0.12 },
      { label: "10 Nov", price: 16000, note: "FTX declara bankruptcy", noteColor: "#7b0000", volume: 310e9, fundingRate: -0.18 },
      { label: "11 Nov", price: 15476, note: "💀 Mínimo del evento — $15.4K", noteColor: "#7b0000", volume: 180e9, fundingRate: -0.08 },
      { label: "13 Nov", price: 16800, note: "Rebote técnico con volumen bajo", noteColor: "#ffd700", volume: 60e9, fundingRate: -0.03 },
      { label: "20 Nov", price: 15500, note: "🟡 Retest — zona de acumulación", noteColor: "#ffd700", volume: 40e9, fundingRate: -0.02 },
    ],
  },
  {
    id: "bull-q1-2024",
    name: "APROBACIÓN ETF SPOT BTC",
    date: "Enero 2024",
    description: "La SEC aprueba el primer ETF spot de Bitcoin. BlackRock, Fidelity y Invesco entran al mercado. $10B de inflows en semanas. BTC sube 60% en 2 meses.",
    color: "#00e676",
    icon: "🚀",
    tag: "EVENTO ALCISTA",
    peak: 73835, trough: 38500,
    lesson: "El 'buy the rumor, sell the news' no funcionó esta vez. El mercado esperaba el ETF meses antes, pero los inflows institucionales reales superaron todas las expectativas. Lección: la liquidez institucional es paciente pero masiva. Los que esperaron la 'corrección post-evento' se perdieron el rally.",
    frames: [
      { label: "10 Ene", price: 45800, note: "✅ SEC aprueba ETF spot de BTC", noteColor: "#00e676", volume: 200e9, fundingRate: 0.05 },
      { label: "11 Ene", price: 42800, note: "🔴 Sell the news (-6%)", noteColor: "#ff6d00", volume: 180e9, fundingRate: 0.02 },
      { label: "15 Ene", price: 43200, note: "BlackRock compra $500M en BTC", noteColor: "#00e676", volume: 80e9, fundingRate: 0.03 },
      { label: "29 Ene", price: 43800, note: "ETF acumula $5B en 2 semanas", noteColor: "#00e676", volume: 70e9, fundingRate: 0.04 },
      { label: "12 Feb", price: 51200, note: "⚡ Ruptura de resistencia clave", noteColor: "#00e5ff", volume: 120e9, fundingRate: 0.07 },
      { label: "25 Feb", price: 57000, note: "Primer test del nivel 55K-57K", noteColor: "#ffd700", volume: 90e9, fundingRate: 0.06 },
      { label: "5 Mar",  price: 68000, note: "🚀 Nuevo ATH — supera Nov 2021", noteColor: "#e040fb", volume: 200e9, fundingRate: 0.10 },
      { label: "14 Mar", price: 73835, note: "🏆 ATH absoluto — $73,835", noteColor: "#e040fb", volume: 250e9, fundingRate: 0.15 },
    ],
  },
  {
    id: "covid-crash-2020",
    name: "CRASH COVID — MARZO 2020",
    date: "Marzo 2020",
    description: "En 24 horas, BTC cae -50%. El mundo entra en lockdown. Los mercados tradicionales también se desploman. Es el único momento en la historia donde BTC cayó más que el SP500 en un solo día.",
    color: "#e040fb",
    icon: "🦠",
    tag: "MACRO EXTREMO",
    peak: 9200, trough: 3867,
    lesson: "En un crash de mercado global, ningún activo es refugio en el corto plazo — ni oro, ni Bitcoin. Todo se vende para conseguir liquidez. Pero los que acumularon en $4K-$5K multiplicaron x18 en 18 meses. La clave: tener cash disponible en los momentos de mayor miedo.",
    frames: [
      { label: "6 Mar",  price: 9200, note: "BTC en zona de resistencia pre-crash", noteColor: "#ffd700", volume: 35e9, fundingRate: 0.02 },
      { label: "8 Mar",  price: 7900, note: "🔴 Mercados globales empiezan a caer", noteColor: "#ff6d00", volume: 60e9, fundingRate: -0.01 },
      { label: "11 Mar", price: 7100, note: "OMS declara pandemia global", noteColor: "#ff1744", volume: 90e9, fundingRate: -0.05 },
      { label: "12 Mar", price: 5500, note: "⚡ -27% en un día — liquidaciones masivas", noteColor: "#7b0000", volume: 300e9, fundingRate: -0.20 },
      { label: "13 Mar", price: 3867, note: "💀 Mínimo: $3,867 — máximo pánico", noteColor: "#7b0000", volume: 450e9, fundingRate: -0.25 },
      { label: "15 Mar", price: 5200, note: "🟡 Rebote +35% desde mínimos", noteColor: "#ffd700", volume: 120e9, fundingRate: 0.00 },
      { label: "20 Mar", price: 6200, note: "Primer soporte estable", noteColor: "#ffd700", volume: 70e9, fundingRate: 0.01 },
      { label: "30 Mar", price: 6400, note: "🟢 Mercado se estabiliza", noteColor: "#00e676", volume: 50e9, fundingRate: 0.02 },
    ],
  },
];

function MiniChart({ frames, color, playing, currentIdx }: { frames: Frame[]; color: string; playing: boolean; currentIdx: number }) {
  const prices = frames.map(f => f.price);
  const min = Math.min(...prices) * 0.985;
  const max = Math.max(...prices) * 1.015;
  const W = 700; const H = 200;

  const px = (i: number) => (i / (frames.length - 1)) * (W - 40) + 20;
  const py = (p: number) => H - 20 - ((p - min) / (max - min)) * (H - 40);

  const visible  = frames.slice(0, currentIdx + 1);
  const pathD    = visible.map((f, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(f.price)}`).join(" ");
  const areaD    = visible.length > 1 ? `${pathD} L ${px(visible.length - 1)} ${H} L ${px(0)} ${H} Z` : "";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {[0.25, 0.5, 0.75].map((t, i) => (
        <line key={i} x1={20} y1={20 + t * (H - 40)} x2={W - 20} y2={20 + t * (H - 40)}
          stroke="#1a2535" strokeWidth={1} strokeDasharray="4,4" />
      ))}

      {/* Area fill */}
      {areaD && <path d={areaD} fill="url(#chartFill)" />}

      {/* Line */}
      {visible.length > 1 && <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}

      {/* All future points (dimmed) */}
      {frames.slice(currentIdx + 1).map((f, i) => (
        <circle key={i} cx={px(currentIdx + 1 + i)} cy={py(f.price)} r={2} fill="#1a2535" />
      ))}

      {/* Current price dot */}
      {visible.length > 0 && (
        <>
          <circle cx={px(currentIdx)} cy={py(frames[currentIdx].price)} r={5} fill={color} opacity={playing ? "0.6" : "1"} />
          {playing && <circle cx={px(currentIdx)} cy={py(frames[currentIdx].price)} r={10} fill={color} opacity={0.2}>
            <animate attributeName="r" values="5;15;5" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0;0.3" dur="1.5s" repeatCount="indefinite" />
          </circle>}
        </>
      )}

      {/* Price labels */}
      <text x={W - 18} y={py(max) + 4} textAnchor="end" fill="#2a4a5a" fontSize="9" fontFamily="'Space Mono',monospace">
        ${max.toLocaleString()}
      </text>
      <text x={W - 18} y={py(min) + 4} textAnchor="end" fill="#2a4a5a" fontSize="9" fontFamily="'Space Mono',monospace">
        ${min.toLocaleString()}
      </text>
    </svg>
  );
}

export default function Replay() {
  const [selectedEvent, setSelectedEvent] = useState<ReplayEvent>(EVENTS[0]);
  const [currentIdx, setCurrentIdx]       = useState(0);
  const [playing, setPlaying]             = useState(false);
  const [speed, setSpeed]                 = useState(1500);
  const intervalRef                       = useRef<ReturnType<typeof setInterval> | null>(null);

  const frame = selectedEvent.frames[currentIdx];
  const totalFrames = selectedEvent.frames.length;

  const tick = useCallback(() => {
    setCurrentIdx(prev => {
      if (prev >= totalFrames - 1) { setPlaying(false); return prev; }
      return prev + 1;
    });
  }, [totalFrames]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(tick, speed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, tick, speed]);

  const selectEvent = (ev: ReplayEvent) => {
    setSelectedEvent(ev);
    setCurrentIdx(0);
    setPlaying(false);
  };

  const prevFrame = () => { setPlaying(false); setCurrentIdx(i => Math.max(0, i - 1)); };
  const nextFrame = () => { setPlaying(false); setCurrentIdx(i => Math.min(totalFrames - 1, i + 1)); };

  const pct = ((frame.price - selectedEvent.trough) / (selectedEvent.peak - selectedEvent.trough)) * 100;
  const fromPeak = ((frame.price - selectedEvent.peak) / selectedEvent.peak) * 100;

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />
      <div className="pt-28 pb-16 px-4 md:px-8 max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-3">Educación</div>
          <h1 className="font-bebas text-5xl md:text-7xl leading-none mb-3">
            MARKET<br /><span className="text-[#00e5ff]">REPLAY</span>
          </h1>
          <p className="font-space text-[12px] text-[#7ab3c8] max-w-xl leading-relaxed">
            Reviví los momentos que marcaron la historia de BTC. Estudiá cómo reaccionó el mercado — frame a frame.
          </p>
        </div>

        {/* Event selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a2535] border border-[#1a2535] mb-6">
          {EVENTS.map(ev => (
            <button key={ev.id} onClick={() => selectEvent(ev)}
              className="p-4 text-left transition-all"
              style={{ background: selectedEvent.id === ev.id ? `${ev.color}10` : "#060a0f" }}>
              <div className="text-2xl mb-1">{ev.icon}</div>
              <div className="font-space text-[9px] px-1.5 py-0.5 border inline-block mb-1.5"
                style={{ color: ev.color, borderColor: ev.color + "44" }}>{ev.tag}</div>
              <div className="font-space text-[11px] text-white leading-tight">{ev.name}</div>
              <div className="font-space text-[10px] text-[#7ab3c8] mt-0.5">{ev.date}</div>
              <div className="font-mono text-[11px] mt-1" style={{ color: ev.color }}>
                {ev.peak >= ev.trough
                  ? `${((ev.trough - ev.peak) / ev.peak * 100).toFixed(0)}%`
                  : `+${((ev.peak - ev.trough) / ev.trough * 100).toFixed(0)}%`}
              </div>
            </button>
          ))}
        </div>

        {/* Main replay panel */}
        <div className="border bg-[#060a0f] mb-5"
          style={{ borderColor: selectedEvent.color + "44" }}>
          {/* Event header */}
          <div className="px-6 py-4 border-b flex items-center gap-4 flex-wrap"
            style={{ borderColor: selectedEvent.color + "22", background: `linear-gradient(90deg,${selectedEvent.color}08,transparent)` }}>
            <span className="text-3xl">{selectedEvent.icon}</span>
            <div className="flex-1">
              <div className="font-space text-[9px] tracking-[0.3em] uppercase mb-0.5" style={{ color: selectedEvent.color }}>
                {selectedEvent.tag} · {selectedEvent.date}
              </div>
              <div className="font-bebas text-3xl text-white">{selectedEvent.name}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[11px] text-[#7ab3c8]">RANGO DEL EVENTO</div>
              <div className="font-mono text-[16px] font-bold">
                ${selectedEvent.trough.toLocaleString()} – ${selectedEvent.peak.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="px-4 pt-4 pb-2">
            <MiniChart frames={selectedEvent.frames} color={selectedEvent.color} playing={playing} currentIdx={currentIdx} />
          </div>

          {/* Frame info */}
          <div className="px-6 py-4 border-t border-[#1a2535]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a2535] mb-4">
              {[
                { label: "PRECIO", value: `$${frame.price.toLocaleString()}`, color: "#fff" },
                { label: "vs PEAK", value: `${fromPeak >= 0 ? "+" : ""}${fromPeak.toFixed(1)}%`, color: fromPeak >= 0 ? "#00e676" : "#ff1744" },
                { label: "VOLUMEN 24H", value: frame.volume ? `$${(frame.volume / 1e9).toFixed(0)}B` : "—", color: "#ffd700" },
                { label: "FUNDING RATE", value: frame.fundingRate !== undefined ? `${(frame.fundingRate * 100).toFixed(3)}%` : "—", color: (frame.fundingRate ?? 0) > 0 ? "#e040fb" : "#00e5ff" },
              ].map((s, i) => (
                <div key={i} className="bg-[#060a0f] p-3 text-center">
                  <div className="font-space text-[9px] text-[#5a8898] mb-1">{s.label}</div>
                  <div className="font-mono text-[14px] font-bold" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Frame note */}
            {frame.note && (
              <div className="p-3 border mb-4" style={{ borderColor: (frame.noteColor ?? "#ffd700") + "44", background: (frame.noteColor ?? "#ffd700") + "08" }}>
                <div className="font-space text-[12px]" style={{ color: frame.noteColor ?? "#ffd700" }}>{frame.note}</div>
                <div className="font-space text-[10px] text-[#7ab3c8] mt-1">📅 {frame.label}</div>
              </div>
            )}

            {/* Timeline dots */}
            <div className="flex items-center gap-1 mb-4">
              {selectedEvent.frames.map((f, i) => (
                <button key={i} onClick={() => { setPlaying(false); setCurrentIdx(i); }}
                  className="flex-1 h-2 transition-all hover:opacity-80"
                  style={{ background: i <= currentIdx ? selectedEvent.color : "#1a2535", opacity: i <= currentIdx ? 1 : 0.4 }} />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={prevFrame} disabled={currentIdx === 0}
                className="font-space text-[11px] px-4 py-2 border border-[#1a2535] text-[#7ab3c8] hover:text-white disabled:opacity-30 transition-colors">
                ◀ ANTERIOR
              </button>

              <button onClick={() => setPlaying(p => !p)}
                className="font-space text-[12px] font-bold px-6 py-2.5 tracking-[0.1em] transition-all"
                style={{ background: playing ? "#ff1744" : selectedEvent.color, color: "#020408" }}>
                {playing ? "⏸ PAUSAR" : currentIdx >= totalFrames - 1 ? "↺ REPETIR" : "▶ REPRODUCIR"}
              </button>

              <button onClick={() => { setCurrentIdx(i => Math.min(totalFrames - 1, i + 1)); setPlaying(false); }}
                disabled={currentIdx >= totalFrames - 1}
                className="font-space text-[11px] px-4 py-2 border border-[#1a2535] text-[#7ab3c8] hover:text-white disabled:opacity-30 transition-colors">
                SIGUIENTE ▶
              </button>

              <div className="ml-auto flex items-center gap-2">
                <span className="font-space text-[10px] text-[#5a8898]">VELOCIDAD</span>
                {[2000, 1200, 700].map((s, i) => (
                  <button key={s} onClick={() => setSpeed(s)}
                    className="font-space text-[10px] px-2 py-1 border transition-all"
                    style={{ borderColor: speed === s ? selectedEvent.color : "#1a2535", color: speed === s ? selectedEvent.color : "#4a6070" }}>
                    {["1x", "1.5x", "2x"][i]}
                  </button>
                ))}
              </div>

              <button onClick={() => { setCurrentIdx(0); setPlaying(false); }}
                className="font-space text-[10px] text-[#5a8898] hover:text-[#7ab3c8] transition-colors">
                ↺ REINICIAR
              </button>
            </div>
          </div>
        </div>

        {/* Context + Lesson */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-[#1a2535] bg-[#060a0f] p-5">
            <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase mb-3">📖 CONTEXTO HISTÓRICO</div>
            <p className="font-space text-[12px] text-[#8a9ab0] leading-relaxed">{selectedEvent.description}</p>
          </div>
          <div className="border p-5" style={{ borderColor: selectedEvent.color + "33", background: selectedEvent.color + "05" }}>
            <div className="font-space text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: selectedEvent.color }}>
              🎯 LECCIÓN CLAVE
            </div>
            <p className="font-space text-[12px] text-[#8a9ab0] leading-relaxed">{selectedEvent.lesson}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
