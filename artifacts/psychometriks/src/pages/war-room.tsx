import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/site-nav";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface WarEvent {
  id: string;
  name: string;
  shortName: string;
  date: Date;
  impact: "EXTREME" | "HIGH" | "MEDIUM";
  color: string;
  description: string;
  btcBias: "BULLISH" | "BEARISH" | "NEUTRAL" | "VOLATILE";
  historical: string;
}

const UPCOMING_EVENTS: WarEvent[] = [
  {
    id: "fomc-may7",
    name: "FOMC Meeting Minutes",
    shortName: "FOMC",
    date: new Date("2026-05-07T14:00:00Z"),
    impact: "EXTREME",
    color: "#ff1744",
    description: "Actas de la última reunión de la Fed. El mercado leerá cada palabra buscando señales de pivote de tasas.",
    btcBias: "VOLATILE",
    historical: "BTC mueve ±5-12% en las 4h post-FOMC. Las palabras 'data-dependent' y 'restrictive' son las más monitoreadas.",
  },
  {
    id: "cpi-may13",
    name: "CPI — Índice de Precios al Consumidor",
    shortName: "CPI",
    date: new Date("2026-05-13T12:30:00Z"),
    impact: "HIGH",
    color: "#ff6d00",
    description: "Dato de inflación mensual de EE.UU. Si viene por debajo del forecast → rally cripto. Si viene alto → venta masiva.",
    btcBias: "VOLATILE",
    historical: "En 8 de los últimos 10 CPI, BTC movió más de 4% en la primera hora.",
  },
  {
    id: "nfp-jun4",
    name: "Non-Farm Payrolls — Empleos",
    shortName: "NFP",
    date: new Date("2026-06-04T12:30:00Z"),
    impact: "HIGH",
    color: "#ffd700",
    description: "Dato de empleo más importante de EE.UU. NFP bajo = Fed dovish potencial = bullish BTC.",
    btcBias: "VOLATILE",
    historical: "El primer Friday del mes. Alta volatilidad en los primeros 15 minutos.",
  },
  {
    id: "fomc-jun11",
    name: "Decisión de Tasas Fed (FOMC)",
    shortName: "FOMC RATES",
    date: new Date("2026-06-11T18:00:00Z"),
    impact: "EXTREME",
    color: "#e040fb",
    description: "La decisión de tasas más esperada del año. Posible primera bajada de tasas — evento histórico para BTC.",
    btcBias: "BULLISH",
    historical: "Si la Fed baja tasas por primera vez desde 2020, BTC podría subir +15-25% en días.",
  },
];

interface Message {
  id: string;
  user: string;
  text: string;
  ts: number;
  isAI?: boolean;
  isSystem?: boolean;
}

const CHAT_KEY = "psy_warroom_chat_v1";
const USER_NAMES = ["trader_81", "BTC_watcher", "PSY_pro", "Crypto_EC", "LiqMap_user", "HODLer", "futures_pro"];

function loadMessages(): Message[] {
  try { return JSON.parse(localStorage.getItem(CHAT_KEY) ?? "[]").slice(-50); } catch { return []; }
}
function saveMessages(msgs: Message[]) { localStorage.setItem(CHAT_KEY, JSON.stringify(msgs.slice(-50))); }

function CountdownTimer({ target }: { target: Date }) {
  const [diff, setDiff] = useState(target.getTime() - Date.now());

  useEffect(() => {
    const i = setInterval(() => setDiff(target.getTime() - Date.now()), 1000);
    return () => clearInterval(i);
  }, [target]);

  if (diff <= 0) return <span className="font-mono text-[#00e676]">AHORA</span>;

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const d = Math.floor(h / 24);

  if (d > 0) {
    return (
      <span className="font-mono text-[#ffd700]">{d}d {h % 24}h {m}m</span>
    );
  }
  return (
    <span className="font-mono text-[#ff6d00] tabular-nums">
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

function getAuth() { try { const r = localStorage.getItem("psyko_auth"); if (!r) return null; const s = JSON.parse(r) as { role?: string; plan?: string; ts?: number }; if (Date.now() - (s.ts ?? 0) > 28800000) return null; return s; } catch { return null; } }
function WarRoomGate() {
  const color = "#e040fb";
  return (
    <div style={{ minHeight: "100vh", background: "#020408", color: "#fff", display: "flex", flexDirection: "column" }}>
      <SiteNav />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px 24px" }}>
        <div style={{ border: `1px solid ${color}33`, background: "#060a0f", padding: 40, maxWidth: 440, width: "100%", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
          <div style={{ fontSize: 44, marginBottom: 16 }}>⚔️</div>
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color, letterSpacing: "0.4em", marginBottom: 8 }}>PLAN ELITE REQUERIDO</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: "#fff", marginBottom: 8 }}>WAR ROOM</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: "#546e7a", marginBottom: 24, lineHeight: 1.6 }}>
            La sala de análisis en vivo está disponible exclusivamente para el plan <span style={{ color, fontWeight: 700 }}>ELITE</span> ($99/mes).
          </div>
          <div style={{ background: "#0d1520", border: `1px solid ${color}22`, padding: "14px 18px", marginBottom: 24, textAlign: "left" }}>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color, letterSpacing: "0.2em", marginBottom: 10 }}>⬡ EXCLUSIVO ELITE</div>
            {["Sala de análisis en vivo 24/7","Chat con IA de mercado en tiempo real","Precio BTC · ETH en vivo con eventos","Calendario de eventos críticos del mercado","Análisis conjunto con el equipo PSY"].map(f => (
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

function WarRoomContent() {
  const [btcPrice, setBtcPrice]   = useState(0);
  const [btcChange, setBtcChange] = useState(0);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeEvent, setActiveEvent] = useState<WarEvent | null>(null);
  const [nextEvent, setNextEvent]     = useState<WarEvent | null>(null);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const wsRef      = useRef<WebSocket | null>(null);

  useEffect(() => {
    const msgs = loadMessages();
    if (msgs.length === 0) {
      const seed: Message[] = [
        { id: "sys-1", user: "SYSTEM", text: "🔴 WAR ROOM ACTIVADA — Monitoring macro events", ts: Date.now() - 300000, isSystem: true },
        { id: "sys-2", user: "PSY_AI", text: "El mercado está en modo wait-and-see. Volumen bajo pre-evento es típico. Esperen el dato para confirmar dirección.", ts: Date.now() - 200000, isAI: true },
        { id: "u1", user: "trader_81", text: "Alguien con posición armada para el FOMC?", ts: Date.now() - 120000 },
        { id: "u2", user: "BTC_watcher", text: "Yo esperando el dato, sin posición abierta", ts: Date.now() - 90000 },
        { id: "u3", user: "futures_pro", text: "El funding está neutral, no hay apuestas fuertes aún", ts: Date.now() - 60000 },
      ];
      setMessages(seed);
      saveMessages(seed);
    } else {
      setMessages(msgs);
    }
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const now = Date.now();
    const active = UPCOMING_EVENTS.find(e => {
      const d = e.date.getTime() - now;
      return d <= 2 * 3600000 && d >= -3600000;
    }) ?? null;
    const next = UPCOMING_EVENTS.find(e => e.date.getTime() > now) ?? null;
    setActiveEvent(active);
    setNextEvent(next);
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    const connect = () => {
      if (destroyed) return;
      ws = new WebSocket("wss://stream.binance.com:9443/stream?streams=btcusdt@ticker");
      wsRef.current = ws;
      ws.onclose = () => { if (!destroyed) retryTimeout = setTimeout(connect, 5000); };
      ws.onerror = () => ws?.close();
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data) as { data: { c: string; P: string } };
          const p = parseFloat(msg.data.c);
          const ch = parseFloat(msg.data.P);
          setBtcPrice(p);
          setBtcChange(ch);
          setPriceHistory(prev => [...prev, p].slice(-60));
        } catch {}
      };
    };

    connect();
    return () => {
      destroyed = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      ws?.close();
    };
  }, []);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      user: "Vos",
      text: chatInput.trim(),
      ts: Date.now(),
    };
    const next = [...messages, msg];
    setMessages(next);
    saveMessages(next);
    setChatInput("");
  };

  const askAI = useCallback(async (question?: string) => {
    setAiLoading(true);
    const event = activeEvent ?? nextEvent;
    const prompt = question ?? `Estás en la War Room de PSYCHOMETRIKS durante ${event?.name ?? "un evento macro importante"}. 
BTC está a $${btcPrice.toLocaleString()} (${btcChange >= 0 ? "+" : ""}${btcChange.toFixed(2)}% 24h).
Evento: ${event?.description ?? "Sin evento activo"}.
Bias esperado: ${event?.btcBias ?? "NEUTRAL"}.

Dá un análisis breve y directo en español (máx 3 oraciones) sobre qué esperar en las próximas horas con BTC. Mencioná niveles clave si los conocés.`;

    try {
      const r = await fetch(`${API}/api/psy-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      if (r.ok) {
        const d = await r.json() as { reply?: string };
        const aiMsg: Message = {
          id: Date.now().toString(),
          user: "PSY_AI",
          text: d.reply ?? "Sin respuesta",
          ts: Date.now(),
          isAI: true,
        };
        const next = [...messages, aiMsg];
        setMessages(next);
        saveMessages(next);
      }
    } finally { setAiLoading(false); }
  }, [messages, activeEvent, nextEvent, btcPrice, btcChange]);

  const isActive = !!activeEvent;

  const MiniSparkline = () => {
    if (priceHistory.length < 2) return null;
    const min = Math.min(...priceHistory);
    const max = Math.max(...priceHistory);
    const W = 120; const H = 30;
    const pts = priceHistory.map((p, i) => {
      const x = (i / (priceHistory.length - 1)) * W;
      const y = H - ((p - min) / (max - min || 1)) * H;
      return `${x},${y}`;
    }).join(" ");
    const color = btcChange >= 0 ? "#00e676" : "#ff1744";
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-24 h-6">
        <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani overflow-hidden">
      {/* Pulsing border when active */}
      {isActive && (
        <div className="fixed inset-0 pointer-events-none z-0"
          style={{ boxShadow: `inset 0 0 60px ${activeEvent!.color}20`, animation: "pulse 2s infinite" }} />
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-6 pb-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 pt-2">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-orbitron text-[12px] font-black text-[#00e5ff] tracking-[0.2em] uppercase no-underline">
              PSY<span className="text-white">CHOMETRIKS</span>
            </Link>
            <div className="font-space text-[9px] tracking-[0.3em] uppercase"
              style={{ color: isActive ? "#ff1744" : "#ffd700" }}>
              {isActive ? "🔴 WAR ROOM ACTIVA" : "🟡 STANDBY"}
            </div>
          </div>
          {btcPrice > 0 && (
            <div className="flex items-center gap-3">
              <MiniSparkline />
              <div className="text-right">
                <div className="font-mono text-[16px] font-black text-white">${btcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                <div className="font-mono text-[11px]" style={{ color: btcChange >= 0 ? "#00e676" : "#ff1744" }}>
                  {btcChange >= 0 ? "+" : ""}{btcChange.toFixed(2)}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active event banner or countdown */}
        {isActive ? (
          <div className="border p-6 mb-6 relative overflow-hidden"
            style={{ borderColor: activeEvent!.color + "88", background: `linear-gradient(135deg, ${activeEvent!.color}12, transparent)` }}>
            <div className="absolute top-0 right-0 bottom-0 w-2" style={{ background: activeEvent!.color, opacity: 0.6 }}>
              <div className="h-full w-full" style={{ animation: "pulse 1s infinite" }} />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full animate-ping" style={{ background: activeEvent!.color }} />
              <div className="font-space text-[10px] tracking-[0.3em] uppercase" style={{ color: activeEvent!.color }}>
                EVENTO EN CURSO
              </div>
            </div>
            <div className="font-bebas text-4xl text-white mb-2">{activeEvent!.name}</div>
            <p className="font-space text-[12px] text-[#8a9ab0] mb-3">{activeEvent!.description}</p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="font-space text-[10px] px-3 py-1 border"
                style={{ color: activeEvent!.color, borderColor: activeEvent!.color + "44" }}>
                BIAS: {activeEvent!.btcBias}
              </div>
              <div className="font-space text-[11px] text-[#7ab3c8]">{activeEvent!.historical}</div>
            </div>
          </div>
        ) : nextEvent ? (
          <div className="border border-[#ffd70033] bg-[#060a0f] p-5 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="font-space text-[10px] text-[#ffd700] tracking-[0.2em] uppercase mb-1">PRÓXIMO EVENTO</div>
                <div className="font-bebas text-3xl text-white">{nextEvent.name}</div>
                <div className="font-space text-[11px] text-[#7ab3c8] mt-1">{nextEvent.description}</div>
              </div>
              <div className="text-right">
                <div className="font-space text-[10px] text-[#5a8898] mb-1">EMPIEZA EN</div>
                <div className="font-bebas text-3xl">
                  <CountdownTimer target={nextEvent.date} />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── HOW-TO GUIDE ──────────────────────────────────────────────── */}
        <details className="mb-4 border border-[#ffd70022] bg-[#060a0f] group">
          <summary className="font-space text-[10px] text-[#ffd700] tracking-[0.2em] uppercase px-4 py-3 cursor-pointer list-none flex items-center justify-between hover:bg-[#0d1520] transition-colors select-none">
            <span>❓ ¿CÓMO FUNCIONA LA WAR ROOM?</span>
            <span className="text-[#5a8898] group-open:rotate-180 transition-transform inline-block">▼</span>
          </summary>
          <div className="px-4 pb-5 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: "🎯", title: "¿QUÉ ES?", text: "Sala de operaciones en tiempo real para eventos macro de alto impacto. Se activa automáticamente cuando hay un evento EXTREME o HIGH en curso (FOMC, CPI, NFP)." },
              { icon: "📅", title: "PRÓXIMOS EVENTOS", text: "Lista de eventos ordenados por impacto. EXTREME (rojo) = FOMC y decisiones de tasas. HIGH (naranja) = CPI, NFP. MEDIUM (amarillo) = datos secundarios." },
              { icon: "⏱️", title: "COUNTDOWN", text: "Temporizador que muestra cuánto falta para el próximo evento. Cuando llega a 0 la War Room se activa con borde pulsante y alertas." },
              { icon: "📊", title: "BIAS BTC", text: "BULLISH = histórico positivo para BTC. BEARISH = históricamente vende. VOLATILE = puede ir a cualquier lado (lo más común en FOMC). NEUTRAL = impacto mínimo esperado." },
              { icon: "🧠", title: "PSY IA", text: "Botón que activa el análisis de inteligencia artificial. La IA lee el contexto del evento, el precio actual de BTC y el bias histórico para darte un análisis en 3 oraciones." },
              { icon: "💬", title: "CHAT", text: "Espacio para discutir el evento en tiempo real. Tu usuario aparece en verde. Los demás traders en gris. La IA en azul. Presioná Enter para enviar." },
            ].map(item => (
              <div key={item.title} className="flex gap-3">
                <span className="text-xl mt-0.5 shrink-0">{item.icon}</span>
                <div>
                  <div className="font-space text-[9px] text-[#ffd700] tracking-[0.15em] mb-1">{item.title}</div>
                  <div className="font-space text-[11px] text-[#6a8a9a] leading-relaxed">{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </details>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Upcoming events list */}
          <div className="space-y-3">
            <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase">PRÓXIMOS EVENTOS</div>
            {UPCOMING_EVENTS.map(ev => {
              const d = ev.date.getTime() - Date.now();
              const isPast = d < 0;
              return (
                <div key={ev.id} className="border border-[#1a2535] bg-[#060a0f] p-3"
                  style={{ borderColor: ev.id === activeEvent?.id ? ev.color + "66" : "#1a2535", opacity: isPast ? 0.5 : 1 }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-space text-[9px] px-1.5 py-0.5 border"
                      style={{ color: ev.color, borderColor: ev.color + "44" }}>
                      {ev.impact}
                    </span>
                    <span className="font-space text-[10px]" style={{ color: isPast ? "#2a4a5a" : "#4a6070" }}>
                      {isPast ? "PASADO" : <CountdownTimer target={ev.date} />}
                    </span>
                  </div>
                  <div className="font-space text-[12px] text-white">{ev.shortName}</div>
                  <div className="font-space text-[10px] text-[#7ab3c8]">
                    {ev.date.toLocaleDateString("es-EC", { day: "2-digit", month: "short" })} · {ev.date.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })} UTC
                  </div>
                  <div className="font-space text-[9px] mt-1.5 px-1.5 py-0.5 border inline-block"
                    style={{ color: ev.btcBias === "BULLISH" ? "#00e676" : ev.btcBias === "BEARISH" ? "#ff1744" : "#ffd700", borderColor: "transparent" }}>
                    {ev.btcBias === "BULLISH" ? "▲ BULLISH" : ev.btcBias === "BEARISH" ? "▼ BEARISH" : "⚡ VOLATIL"}
                  </div>
                </div>
              );
            })}

            {/* Quick AI analysis */}
            <button onClick={() => askAI()}
              disabled={aiLoading}
              className="w-full py-3 font-space text-[11px] font-bold tracking-[0.15em] uppercase border border-[#00e5ff44] text-[#00e5ff] hover:bg-[#00e5ff10] transition-colors disabled:opacity-40">
              {aiLoading ? "⏳ ANALIZANDO..." : "🧠 ANÁLISIS IA AHORA"}
            </button>
          </div>

          {/* War Room Chat */}
          <div className="md:col-span-2 border border-[#1a2535] bg-[#060a0f] flex flex-col" style={{ height: "600px" }}>
            <div className="px-4 py-3 border-b border-[#1a2535] flex items-center justify-between"
              style={{ background: isActive ? `linear-gradient(90deg,${activeEvent!.color}08,transparent)` : "transparent" }}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isActive ? "animate-ping" : ""}`}
                  style={{ background: isActive ? activeEvent!.color : "#ffd700" }} />
                <span className="font-space text-[11px] text-white">WAR ROOM CHAT</span>
                <span className="font-space text-[9px] text-[#5a8898]">· {messages.length} mensajes</span>
              </div>
              <button onClick={() => askAI()}
                disabled={aiLoading}
                className="font-space text-[9px] px-2.5 py-1 border border-[#00e5ff44] text-[#00e5ff] hover:bg-[#00e5ff10] disabled:opacity-40 transition-colors">
                🧠 PSY IA
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`${msg.isSystem ? "text-center" : ""}`}>
                  {msg.isSystem ? (
                    <div className="font-space text-[10px] text-[#5a8898] border border-[#1a2535] px-3 py-1 inline-block">{msg.text}</div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-space text-[10px] font-bold"
                          style={{ color: msg.isAI ? "#00e5ff" : msg.user === "Vos" ? "#00e676" : "#4a6070" }}>
                          {msg.isAI ? "🧠 PSY_IA" : msg.user === "Vos" ? "► Vos" : `· ${msg.user}`}
                        </span>
                        <span className="font-space text-[9px] text-[#5a8898]">
                          {new Date(msg.ts).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className={`font-space text-[12px] leading-relaxed pl-3 border-l-2 ${msg.isAI ? "text-[#8a9ab0]" : msg.user === "Vos" ? "text-white" : "text-[#6a8a9a]"}`}
                        style={{ borderLeftColor: msg.isAI ? "#00e5ff33" : msg.user === "Vos" ? "#00e67633" : "#1a2535" }}>
                        {msg.text}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {aiLoading && (
                <div>
                  <div className="font-space text-[10px] text-[#00e5ff] mb-1">🧠 PSY_IA</div>
                  <div className="font-space text-[12px] text-[#5a8898] pl-3 border-l-2 border-[#00e5ff33] animate-pulse">
                    Analizando datos del mercado...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[#1a2535]">
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Escribí tu análisis o pregunta..."
                  className="flex-1 bg-[#080d14] border border-[#1a2535] text-white font-space text-[12px] px-3 py-2.5 focus:outline-none focus:border-[#00e5ff44]"
                />
                <button onClick={sendMessage}
                  disabled={!chatInput.trim()}
                  className="font-space text-[11px] font-bold px-4 py-2.5 text-[#020408] disabled:opacity-40 transition-all hover:opacity-90"
                  style={{ background: "#00e5ff" }}>
                  ENVIAR
                </button>
              </div>
              <div className="font-space text-[9px] text-[#5a8898] mt-2">
                Presioná "PSY IA" para análisis en tiempo real · Enter para enviar
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WarRoom() {
  const auth = getAuth();
  if (!auth) { window.location.replace("/login?redirect=/war-room"); return null; }
  const plan = (auth.plan ?? "").toLowerCase();
  const ok = ["aprendiz","trader","institucional"].includes(plan) || auth.role === "superadmin" || auth.role === "operator" || auth.role === "member";
  if (!ok) return <WarRoomGate />;
  return <WarRoomContent />;
}
