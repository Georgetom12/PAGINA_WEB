import React, { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "wouter";
import SiteNav from "@/components/site-nav";

const TELEGRAM = "https://t.me/psychometriks_pro";
const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Types ────────────────────────────────────────────────────────────────────
interface Signal {
  id: string;
  asset: string;
  direction: "LONG" | "SHORT";
  entry: string;
  tp1: string;
  tp2?: string;
  tp3?: string;
  sl: string;
  status: "ACTIVA" | "TP1 ✅" | "TP2 ✅" | "CERRADA ✅" | "INVALIDADA ❌";
  rr: string;
  ts: string;
  note: string;
  leverage: string;
  source: "PSY BOT" | "ANÁLISIS IA" | "MANUAL";
  channelSlug?: string;
}

interface DbSignal {
  id: number;
  channelSlug: string;
  asset: string; direction: string; entry: string;
  tp1: string; tp2?: string | null; tp3?: string | null; sl: string;
  leverage?: string | null; rr?: string | null; note?: string | null;
  source?: string | null; status: string; createdAt: string;
}

interface ApiChannel {
  id: number;
  slug: string;
  name: string;
  description?: string;
  color: string;
  channelId: string;
  active: boolean;
}

// ── Demo signals (fallback when no live data) ─────────────────────────────
const DEMO_SIGNALS: Signal[] = [
  { id: "SIG-0041", asset: "BTC/USDT", direction: "LONG", entry: "76,800", tp1: "79,500", tp2: "82,400", tp3: "86,000", sl: "74,200", status: "ACTIVA",       rr: "1:3.4", ts: "Hoy 09:14",    note: "Order block diario confirmado. Funding negativo. CHoCH en 4H.", leverage: "5x", source: "ANÁLISIS IA", channelSlug: "demo" },
  { id: "SIG-0040", asset: "ETH/USDT", direction: "LONG", entry: "3,180",  tp1: "3,350",  tp2: "3,520",  sl: "3,080",  status: "TP1 ✅",      rr: "1:2.7", ts: "Ayer 16:30",  note: "BOS en 1H. Cluster de liq shorts en $3,350.",                  leverage: "3x", source: "PSY BOT",    channelSlug: "demo" },
  { id: "SIG-0039", asset: "SOL/USDT", direction: "SHORT",entry: "192.4",  tp1: "184.0",  tp2: "176.5",  sl: "198.0",  status: "TP2 ✅",      rr: "1:2.9", ts: "Ayer 11:05",  note: "Distribución en resistencia 4H. Funding +0.08%.",              leverage: "4x", source: "PSY BOT",    channelSlug: "demo" },
  { id: "SIG-0038", asset: "BTC/USDT", direction: "SHORT",entry: "79,200", tp1: "77,000", tp2: "75,400", sl: "80,600", status: "INVALIDADA ❌",rr: "1:2.1", ts: "Hace 2 días", note: "Invalidado al cierre por encima de $80,600.",                   leverage: "3x", source: "MANUAL",     channelSlug: "demo" },
  { id: "SIG-0037", asset: "BNB/USDT", direction: "LONG", entry: "598.0",  tp1: "618.0",  tp2: "642.0",  sl: "582.0",  status: "CERRADA ✅",  rr: "1:2.8", ts: "Hace 3 días", note: "Setup de recuperación post-sell off.",                          leverage: "4x", source: "PSY BOT",    channelSlug: "demo" },
  { id: "SIG-0036", asset: "ETH/USDT", direction: "SHORT",entry: "3,420",  tp1: "3,250",  tp2: "3,120",  sl: "3,510",  status: "CERRADA ✅",  rr: "1:3.3", ts: "Hace 4 días", note: "Rechazo en resistencia semanal + divergencia bajista RSI.",     leverage: "5x", source: "ANÁLISIS IA", channelSlug: "demo" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatTs(iso: string): string {
  try {
    const d   = new Date(iso);
    const h   = (Date.now() - d.getTime()) / 3_600_000;
    if (h < 1)  return `Hace ${Math.round(h * 60)} min`;
    if (h < 24) return `Hoy ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    if (h < 48) return "Ayer";
    return `Hace ${Math.round(h / 24)} días`;
  } catch { return "Reciente"; }
}

function dbToSignal(s: DbSignal): Signal {
  return {
    id:          `DB-${s.id}`,
    asset:       s.asset,
    direction:   s.direction as "LONG" | "SHORT",
    entry:       s.entry,    tp1: s.tp1,
    tp2:         s.tp2 ?? undefined, tp3: s.tp3 ?? undefined,
    sl:          s.sl,
    status:      (s.status as Signal["status"]) ?? "ACTIVA",
    rr:          s.rr   ?? "—",
    ts:          formatTs(s.createdAt),
    note:        s.note ?? "",
    leverage:    s.leverage ?? "—",
    source:      (s.source as Signal["source"]) ?? "MANUAL",
    channelSlug: s.channelSlug,
  };
}

async function fetchChannels(): Promise<ApiChannel[]> {
  try {
    const r = await fetch(`${API_BASE}/api/channels`);
    if (!r.ok) return [];
    const data = await r.json() as { channels?: ApiChannel[] };
    return (data.channels ?? []).filter(c => c.active);
  } catch { return []; }
}

async function fetchAllSignals(): Promise<Signal[]> {
  try {
    const r = await fetch(`${API_BASE}/api/signals`);
    if (!r.ok) return [];
    const data = await r.json() as { signals?: DbSignal[] };
    return (data.signals ?? []).map(dbToSignal);
  } catch { return []; }
}

const PSY_SIGNALS_KEY = "psy_signals_v2";
function loadLocalSignals(): Signal[] {
  try {
    const raw = JSON.parse(localStorage.getItem(PSY_SIGNALS_KEY) || "[]");
    return raw.map((s: Record<string, string>, i: number) => ({
      id: s["id"] || `LOCAL-${i}`,
      asset: s["asset"], direction: s["direction"] as "LONG" | "SHORT",
      entry: s["entry"], tp1: s["tp1"], tp2: s["tp2"], tp3: s["tp3"],
      sl: s["sl"], status: (s["status"] || "ACTIVA") as Signal["status"],
      rr: s["rr"] || "—", ts: formatTs(s["ts"] ?? ""),
      note: s["note"], leverage: s["leverage"],
      source: (s["source"] || "MANUAL") as Signal["source"],
      channelSlug: s["channelSlug"],
    }));
  } catch { return []; }
}

// ── BTC/ETH/SOL live signal type ─────────────────────────────────────────────
interface LiveSignal {
  symbol: string; label: string; close: number; change4h: number;
  rsi: number; ema9: number; ema21: number; ema50: number; ema200: number;
  emaCross: "golden" | "death" | null; aboveEma200: boolean; cvdBull: boolean;
  signal: string; signalEmoji: string; direction: "LONG" | "SHORT" | "NEUTRAL";
  score: number; support: number; resistance: number;
  distSupport: number; distResistance: number;
  tp1: number; tp2: number; sl: number; rr: string;
}

// ── AT (Análisis Técnico) signal type ────────────────────────────────────────
interface WhaleSignal {
  symbol: string; name: string; icon: string; color: string;
  direction: "LONG" | "SHORT";
  strength: "FUERTE" | "MODERADO" | "DÉBIL";
  strengthColor: string;
  entry: string; tp1: string; tp2: string; sl: string; rr: string;
  rsi: number; macdHistogram: number; macdCross: boolean;
  volumeSpike: number; ema20: number;
  indicators: string[];
  score: number; change1h: number;
}

// ── Status styles ─────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  "ACTIVA":        { color: "#00e676", bg: "#00e67615" },
  "TP1 ✅":        { color: "#00e5ff", bg: "#00e5ff15" },
  "TP2 ✅":        { color: "#00e5ff", bg: "#00e5ff20" },
  "CERRADA ✅":    { color: "#4a6070", bg: "#1a2535"   },
  "INVALIDADA ❌": { color: "#ff1744", bg: "#ff174415" },
};

// ── SignalCard ────────────────────────────────────────────────────────────────
function SignalCard({ sig }: { sig: Signal }) {
  const [expanded, setExpanded] = useState(false);
  const isLong   = sig.direction === "LONG";
  const dirColor = isLong ? "#00e676" : "#ff1744";
  const st       = STATUS_STYLE[sig.status] ?? STATUS_STYLE["ACTIVA"]!;

  return (
    <div className="bg-[#080d14] border border-[#1a2535] mb-px hover:border-[#243040] transition-colors">
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="font-space text-[10px] text-[#5a8898] tracking-[0.1em] w-16 shrink-0">{sig.id}</div>
          <span className="font-bebas text-xl text-white min-w-[120px]">{sig.asset}</span>
          <div className="font-space text-[11px] font-bold tracking-[0.15em] px-2 py-0.5 border"
            style={{ color: dirColor, background: `${dirColor}15`, borderColor: `${dirColor}44` }}>
            {sig.direction}
          </div>
          <div className="flex-1 grid grid-cols-3 gap-3 min-w-[200px]">
            <div><div className="font-space text-[9px] text-[#5a8898] mb-0.5">ENTRADA</div><div className="font-mono text-[12px] text-white">{sig.entry}</div></div>
            <div><div className="font-space text-[9px] text-[#5a8898] mb-0.5">TP1</div><div className="font-mono text-[12px]" style={{ color: isLong ? "#00e676" : "#ff1744" }}>{sig.tp1}</div></div>
            <div><div className="font-space text-[9px] text-[#5a8898] mb-0.5">STOP</div><div className="font-mono text-[12px] text-[#ff174499]">{sig.sl}</div></div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <span className="font-space text-[10px] px-2 py-0.5 border" style={{ color: st.color, background: st.bg, borderColor: `${st.color}33` }}>{sig.status}</span>
            <span className="font-space text-[10px] text-[#5a8898]">{sig.ts}</span>
            <span className="text-[#5a8898] text-xs">{expanded ? "▲" : "▼"}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#1a2535] px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] mb-3">TARGETS</div>
            <div className="space-y-1.5">
              {[sig.tp1, sig.tp2, sig.tp3].filter(Boolean).map((tp, i) => (
                <div key={i} className="flex items-center gap-3 font-mono text-[12px]">
                  <span className="text-[#5a8898] w-8">TP{i + 1}</span>
                  <span style={{ color: isLong ? "#00e676" : "#ff1744" }}>{tp}</span>
                </div>
              ))}
              <div className="flex items-center gap-3 font-mono text-[12px]">
                <span className="text-[#5a8898] w-8">SL</span>
                <span className="text-[#ff174499]">{sig.sl}</span>
              </div>
            </div>
          </div>
          <div>
            <div className="flex gap-4 mb-3">
              <div><div className="font-space text-[9px] text-[#7ab3c8] mb-1">R/R</div><div className="font-mono text-[13px] text-[#00e5ff]">{sig.rr}</div></div>
              <div><div className="font-space text-[9px] text-[#7ab3c8] mb-1">LEVERAGE</div><div className="font-mono text-[13px] text-[#ffd700]">{sig.leverage}</div></div>
              <div><div className="font-space text-[9px] text-[#7ab3c8] mb-1">FUENTE</div><div className="font-mono text-[11px] text-[#e040fb]">{sig.source}</div></div>
            </div>
            {sig.note && <div className="font-space text-[11px] text-[#7ab3c8] leading-relaxed bg-[#060a0f] border border-[#1a2535] p-3">{sig.note}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Channel section ───────────────────────────────────────────────────────────
function ChannelSection({ channel, signals }: { channel: ApiChannel; signals: Signal[] }) {
  const [filter, setFilter] = useState<"TODOS" | "ACTIVA" | "CERRADA">("TODOS");

  const filtered = signals.filter(s => {
    if (filter === "ACTIVA")  return s.status === "ACTIVA" || s.status.includes("TP");
    if (filter === "CERRADA") return s.status === "CERRADA ✅" || s.status === "INVALIDADA ❌";
    return true;
  });

  const closed = signals.filter(s => s.status !== "ACTIVA");
  const won    = signals.filter(s => s.status.includes("✅"));
  const wr     = closed.length > 0 ? Math.round((won.length / closed.length) * 100) : 0;
  const active = signals.filter(s => s.status === "ACTIVA").length;

  return (
    <div className="mb-16">
      {/* Channel header */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: channel.color }} />
            <div className="font-space text-[10px] tracking-[0.3em] uppercase" style={{ color: channel.color }}>
              CANAL EN VIVO
            </div>
          </div>
          <h2 className="font-bebas text-3xl md:text-5xl text-white leading-none">{channel.name}</h2>
          {channel.description && (
            <div className="font-space text-[11px] text-[#7ab3c8] mt-1">{channel.description}</div>
          )}
        </div>
        <a href={`https://t.me/${channel.channelId.replace("@","")}`} target="_blank" rel="noopener noreferrer"
          className="font-space text-[10px] tracking-[0.15em] uppercase px-5 py-2.5 text-white no-underline transition-opacity hover:opacity-80"
          style={{ background: `linear-gradient(135deg,${channel.color}99,${channel.color})` }}>
          ✈️ UNIRSE AL CANAL
        </a>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-px mb-5" style={{ background: `${channel.color}22`, border: `1px solid ${channel.color}22` }}>
        {[
          { label: "Señales", value: signals.length },
          { label: "Activas",  value: active, color: "#00e676" },
          { label: "Ganadas",  value: won.length, color: "#00e5ff" },
          { label: "Win Rate", value: `${wr}%`, color: "#ffd700" },
        ].map((s, i) => (
          <div key={i} className="bg-[#080d14] p-4 text-center">
            <div className="font-space text-[9px] text-[#5a8898] tracking-[0.1em] uppercase mb-1">{s.label}</div>
            <div className="font-bebas text-3xl" style={{ color: s.color ?? channel.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(["TODOS", "ACTIVA", "CERRADA"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="font-space text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 border transition-colors"
            style={{ background: filter === f ? channel.color : "transparent", borderColor: filter === f ? channel.color : "#1a2535", color: filter === f ? "#020408" : "#4a6070" }}>
            {f}
          </button>
        ))}
      </div>

      {/* Signals */}
      {filtered.length === 0
        ? <div className="font-space text-[11px] text-[#5a8898] py-6 text-center border border-[#1a2535]">No hay señales en esta categoría</div>
        : filtered.map((sig, i) => <SignalCard key={`${sig.id}-${i}`} sig={sig} />)
      }

      <div className="mt-1 border-b" style={{ borderColor: `${channel.color}22` }} />
    </div>
  );
}

// ── Demo channel section ──────────────────────────────────────────────────────
function DemoSection() {
  return (
    <div className="mb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-2 rounded-full bg-[#229ED9] animate-pulse" />
        <div className="font-space text-[10px] tracking-[0.3em] uppercase text-[#229ED9]">CANAL VIP — SEÑALES EN TIEMPO REAL</div>
      </div>

      {/* Main CTA card */}
      <div className="border border-[#229ED933] bg-gradient-to-br from-[#060d16] to-[#020408] p-8 mb-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#229ED9] to-[#2CA5E0]" />
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #229ED9, transparent)" }} />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="font-bebas text-5xl md:text-6xl text-white leading-none mb-2">
              SEÑALES <span style={{ color: "#229ED9" }}>GEMAS</span>
            </div>
            <div className="font-bebas text-2xl text-[#7ab3c8] leading-none mb-4">PSYCHOMETRIKS × TELEGRAM</div>
            <div className="font-space text-[12px] text-[#8a9ab0] leading-relaxed mb-6">
              Accedé a las señales VIP del canal de Telegram. Análisis técnico en tiempo real, altcoins con alto potencial y setups operativos con entrada, targets y stop loss.
            </div>
            <a href={TELEGRAM} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-3 font-space text-[11px] font-bold tracking-[0.15em] uppercase px-7 py-3.5 text-white no-underline transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #2CA5E0 0%, #229ED9 100%)" }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.008 9.461c-.147.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 14.246l-2.946-.92c-.64-.203-.653-.64.136-.948l11.49-4.43c.533-.194 1-.12.622.3z"/></svg>
              ABRIR CANAL TELEGRAM
            </a>
          </div>

          <div className="space-y-3">
            {[
              { icon: "💎", label: "GEMAS SEMANALES", desc: "Altcoins con alto potencial seleccionados por el equipo" },
              { icon: "📊", label: "ANÁLISIS TÉCNICO", desc: "RSI · MACD · Fibonacci · Order Blocks · Estructura de mercado" },
              { icon: "⚡", label: "ALERTAS EN TIEMPO REAL", desc: "Notificaciones instantáneas cuando se activa una señal" },
              { icon: "🎯", label: "ENTRADA · TP · SL", desc: "Cada señal incluye precio de entrada, targets y stop loss definidos" },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-3 border border-[#1a2535] bg-[#080d14] px-4 py-3">
                <span className="text-lg mt-0.5 shrink-0">{item.icon}</span>
                <div>
                  <div className="font-space text-[9px] text-[#229ED9] tracking-[0.15em] mb-0.5">{item.label}</div>
                  <div className="font-space text-[11px] text-[#6a8a9a]">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="font-space text-[10px] text-[#5a8898] text-center">
        Las señales AT Altcoins de análisis técnico automático están disponibles en la pestaña{" "}
        <span className="text-[#00e5ff]">📊 AT ALTCOINS</span>
      </div>
    </div>
  );
}

// ── Admin Channel Manager ─────────────────────────────────────────────────────
const CHANNEL_COLORS = ["#00e5ff","#00e676","#ffd700","#e040fb","#ff6d00","#ff1744","#64b5f6","#80cbc4"];

interface EditingChannel { id?: number; slug?: string; name?: string; description?: string; color?: string; botToken?: string; channelId?: string; active?: boolean; }

function AdminChannelManager({ channels, onRefresh }: { channels: ApiChannel[]; onRefresh: () => void }) {
  const [open,        setOpen]        = useState(false);
  const [editing,     setEditing]     = useState<EditingChannel | null>(null);
  const [busy,        setBusy]        = useState(false);
  const [confirmDel,  setConfirmDel]  = useState<number | null>(null);
  const [err,         setErr]         = useState("");

  const flash = (msg: string) => { setErr(msg); setTimeout(() => setErr(""), 4000); };

  const save = async () => {
    if (!editing) return;
    if (!editing.slug?.trim() || !editing.name?.trim() || !editing.channelId?.trim()) { flash("Slug, nombre y Channel ID son obligatorios"); return; }
    if (!editing.id && !editing.botToken?.trim()) { flash("El Bot Token es obligatorio al crear un canal"); return; }
    setBusy(true);
    const isNew  = !editing.id;
    const url    = isNew ? "/api/channels" : `/api/channels/${editing.id}`;
    const body: Record<string, unknown> = { slug: editing.slug, name: editing.name, description: editing.description ?? "", color: editing.color ?? "#00e5ff", channelId: editing.channelId, active: editing.active ?? true };
    if (editing.botToken?.trim()) body["botToken"] = editing.botToken;
    const r    = await fetch(url, { method: isNew ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json() as { error?: string };
    if (!r.ok) flash(data.error ?? "Error al guardar");
    else { setEditing(null); onRefresh(); }
    setBusy(false);
  };

  const toggle = async (ch: ApiChannel) => {
    await fetch(`/api/channels/${ch.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !ch.active }) });
    onRefresh();
  };

  const del = async (id: number) => {
    await fetch(`/api/channels/${id}`, { method: "DELETE" });
    setConfirmDel(null); onRefresh();
  };

  return (
    <div className="mt-10 border border-[#ffd70022] bg-[#080d14]">
      {/* Header toggle */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#ffd7000a] transition-colors">
        <div className="flex items-center gap-3">
          <span className="font-space text-[10px] text-[#ffd700] tracking-[0.3em] uppercase">★ ADMIN — GESTIÓN DE CANALES</span>
          <span className="font-space text-[9px] text-[#7ab3c8] border border-[#1a2535] px-2 py-0.5">{channels.length} canal{channels.length !== 1 ? "es" : ""}</span>
        </div>
        <span className="text-[#7ab3c8] text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-[#1a2535] p-6">
          {err && <div className="mb-4 px-4 py-2 border border-[#ff174433] bg-[#ff174408] text-[#ff6b6b] font-space text-[11px]">{err}</div>}

          {/* Channel list */}
          <div className="mb-6">
            {channels.length === 0 && !editing && (
              <div className="text-center py-8 text-[#5a8898] font-space text-[12px]">
                No hay canales configurados todavía — agregá el primero
              </div>
            )}
            {channels.map(ch => (
              <div key={ch.id} className="flex items-center gap-4 flex-wrap mb-3 p-4 border"
                style={{ borderColor: ch.active ? `${ch.color}33` : "#1a2535", background: "#060a0f" }}>
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ch.active ? ch.color : "#2a4a5a" }} />
                <div className="flex-1 min-w-[160px]">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-[14px]">{ch.name}</span>
                    <span className="font-space text-[10px] text-[#7ab3c8]">/{ch.slug}</span>
                    {!ch.active && <span className="font-space text-[9px] text-[#ff1744] border border-[#ff174433] px-1">INACTIVO</span>}
                  </div>
                  <div className="font-space text-[10px] text-[#5a8898] mt-0.5">{ch.channelId}</div>
                  {ch.description && <div className="font-space text-[10px] text-[#7ab3c8] mt-0.5">{ch.description}</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing({ ...ch })}
                    className="font-space text-[10px] px-3 py-1.5 border border-[#1a2535] text-[#7ab3c8] hover:border-[#00e5ff] hover:text-[#00e5ff] transition-colors">
                    ✏️ EDITAR
                  </button>
                  <button onClick={() => toggle(ch)}
                    className="font-space text-[10px] px-3 py-1.5 border transition-colors"
                    style={{ borderColor: ch.active ? "#1a2535" : `${ch.color}44`, color: ch.active ? "#4a6070" : ch.color }}>
                    {ch.active ? "⏸ PAUSAR" : "▶ ACTIVAR"}
                  </button>
                  {confirmDel === ch.id
                    ? <div className="flex gap-1">
                        <button onClick={() => del(ch.id)} className="font-space text-[10px] px-3 py-1.5 border border-[#ff174444] text-[#ff1744]">CONFIRMAR</button>
                        <button onClick={() => setConfirmDel(null)} className="font-space text-[10px] px-3 py-1.5 border border-[#1a2535] text-[#7ab3c8]">CANCELAR</button>
                      </div>
                    : <button onClick={() => setConfirmDel(ch.id)} className="font-space text-[10px] px-3 py-1.5 border border-[#1a2535] text-[#ff174466] hover:border-[#ff174444] hover:text-[#ff1744] transition-colors">🗑</button>
                  }
                </div>
              </div>
            ))}
          </div>

          {/* Add / Edit form */}
          {editing ? (
            <div className="border border-[#00e5ff22] bg-[#020408] p-5">
              <div className="font-space text-[11px] text-[#00e5ff] tracking-[0.2em] mb-5">{editing.id ? "EDITAR CANAL" : "NUEVO CANAL"}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase mb-2">Nombre del canal *</label>
                  <input value={editing.name ?? ""} onChange={e => setEditing(c => ({ ...c!, name: e.target.value }))}
                    placeholder="ej: Crypto Señales PRO"
                    className="w-full bg-[#060a0f] border border-[#1a2535] px-3 py-2.5 text-white font-mono text-[13px] outline-none focus:border-[#00e5ff]" />
                </div>
                <div>
                  <label className="block font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase mb-2">Slug (ID único) *</label>
                  <input value={editing.slug ?? ""}
                    onChange={e => setEditing(c => ({ ...c!, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                    placeholder="ej: crypto-pro" disabled={!!editing.id}
                    className="w-full bg-[#060a0f] border border-[#1a2535] px-3 py-2.5 text-white font-mono text-[13px] outline-none focus:border-[#00e5ff] disabled:opacity-40" />
                </div>
                <div>
                  <label className="block font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase mb-2">
                    Bot Token {editing.id ? "(vacío = sin cambios)" : "*"}
                  </label>
                  <input type="password" value={editing.botToken ?? ""}
                    onChange={e => setEditing(c => ({ ...c!, botToken: e.target.value }))}
                    placeholder="7123456789:AAH..."
                    className="w-full bg-[#060a0f] border border-[#1a2535] px-3 py-2.5 text-white font-mono text-[13px] outline-none focus:border-[#00e5ff]" />
                </div>
                <div>
                  <label className="block font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase mb-2">Channel ID / @username *</label>
                  <input value={editing.channelId ?? ""}
                    onChange={e => setEditing(c => ({ ...c!, channelId: e.target.value }))}
                    placeholder="@psychometriks_pro"
                    className="w-full bg-[#060a0f] border border-[#1a2535] px-3 py-2.5 text-white font-mono text-[13px] outline-none focus:border-[#00e5ff]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase mb-2">Descripción (opcional)</label>
                  <input value={editing.description ?? ""}
                    onChange={e => setEditing(c => ({ ...c!, description: e.target.value }))}
                    placeholder="ej: Señales de Bitcoin con alto R/R"
                    className="w-full bg-[#060a0f] border border-[#1a2535] px-3 py-2.5 text-white font-mono text-[13px] outline-none focus:border-[#00e5ff]" />
                </div>
                <div>
                  <label className="block font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase mb-3">Color del canal</label>
                  <div className="flex gap-2 flex-wrap">
                    {CHANNEL_COLORS.map(col => (
                      <button key={col} onClick={() => setEditing(c => ({ ...c!, color: col }))}
                        style={{ width: 28, height: 28, borderRadius: "50%", background: col, border: editing.color === col ? "3px solid #fff" : "3px solid transparent", cursor: "pointer" }} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase">Estado</label>
                  <button onClick={() => setEditing(c => ({ ...c!, active: !c!.active }))}
                    className="font-space text-[11px] px-4 py-2 border transition-colors"
                    style={{ borderColor: editing.active ? "#00e676" : "#ff1744", color: editing.active ? "#00e676" : "#ff1744" }}>
                    {editing.active ? "✅ ACTIVO" : "⏸ INACTIVO"}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={save} disabled={busy}
                  className="flex-1 font-space text-[11px] tracking-[0.2em] uppercase py-3 border border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff0d] hover:bg-[#00e5ff1a] transition-colors disabled:opacity-50">
                  {busy ? "⏳ GUARDANDO..." : (editing.id ? "💾 ACTUALIZAR CANAL" : "✅ CREAR CANAL")}
                </button>
                <button onClick={() => setEditing(null)}
                  className="font-space text-[11px] tracking-[0.2em] uppercase px-5 py-3 border border-[#1a2535] text-[#7ab3c8] hover:text-white transition-colors">
                  CANCELAR
                </button>
              </div>
              <div className="mt-3 font-space text-[10px] text-[#5a8898] leading-relaxed">
                💡 El Bot Token lo obtenés de <span className="text-[#7ab3c8]">@BotFather</span> → /newbot · El bot debe ser admin del canal con permiso de publicar
              </div>
            </div>
          ) : (
            <button onClick={() => setEditing({ color: "#00e5ff", active: true })}
              className="w-full font-space text-[11px] tracking-[0.2em] uppercase py-3 border border-dashed border-[#1a2535] text-[#7ab3c8] hover:border-[#00e5ff] hover:text-[#00e5ff] transition-colors">
              ➕ AGREGAR CANAL
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
// ─── Plan Gate ───────────────────────────────────────────────────────────────
function getAuth() { try { const r = localStorage.getItem("psyko_auth"); if (!r) return null; const s = JSON.parse(r) as { role?: string; plan?: string; ts?: number }; if (Date.now() - (s.ts ?? 0) > 28800000) return null; return s; } catch { return null; } }
function SignalsGate({ required, price, name, color }: { required: string; price: string; name: string; color: string }) {
  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani flex flex-col">
      <SiteNav />
      <div className="flex-1 flex items-center justify-center px-6 pt-20">
        <div style={{ border: `1px solid ${color}33`, background: "#060a0f", padding: 40, maxWidth: 440, width: "100%", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
          <div style={{ fontSize: 44, marginBottom: 16 }}>📡</div>
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color, letterSpacing: "0.4em", marginBottom: 8 }}>ACCESO RESTRINGIDO</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: "#fff", marginBottom: 8 }}>SEÑALES EN VIVO</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: "#546e7a", marginBottom: 24, lineHeight: 1.6 }}>
            Las señales de trading en tiempo real están disponibles desde el plan <span style={{ color, fontWeight: 700 }}>{name}</span>.
          </div>
          <div style={{ background: "#0d1520", border: `1px solid ${color}22`, padding: "14px 18px", marginBottom: 24, textAlign: "left" }}>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color, letterSpacing: "0.2em", marginBottom: 10 }}>⬡ INCLUÍDO DESDE ${price}/mes</div>
            {["Señales BTC, ETH y SOL en tiempo real","Canal Telegram con alertas automáticas","Señales por análisis IA + PSY BOT","Historial completo de señales","R:R y niveles de entrada/salida"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: "#8a9ab0", marginBottom: 6 }}>
                <span style={{ color, fontSize: 9 }}>✦</span> {f}
              </div>
            ))}
          </div>
          <a href="/pricing" style={{ display: "block", width: "100%", padding: "12px", background: color, color: "#020408", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", boxSizing: "border-box" }}>VER PLANES →</a>
          <div style={{ marginTop: 12, fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, color: "#2a4a5a" }}>
            ¿Ya tenés plan? <a href="/login" style={{ color, textDecoration: "none" }}>Iniciá sesión</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignalsContent() {
  const [, setLocation] = useLocation();
  const [authUser, setAuthUser]   = useState<string | null>(null);
  const [channels,  setChannels]  = useState<ApiChannel[]>([]);
  const [allSigs,   setAllSigs]   = useState<Signal[]>([]);
  const [localSigs, setLocalSigs] = useState<Signal[]>([]);
  const [isLive,    setIsLive]    = useState(false);
  const [lastUpd,   setLastUpd]   = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  // BTC/ETH/SOL live signals state
  const [lsSignals,  setLsSignals]  = useState<LiveSignal[]>([]);
  const [lsLoading,  setLsLoading]  = useState(false);
  const [lsError,    setLsError]    = useState("");
  const [lsCachedAt, setLsCachedAt] = useState("");

  // AT (Análisis Técnico) signals state
  const [atSignals,     setAtSignals]     = useState<WhaleSignal[]>([]);
  const [atLoading,     setAtLoading]     = useState(false);
  const [atError,       setAtError]       = useState("");
  const [atCachedAt,    setAtCachedAt]    = useState("");
  const [atWeekOf,      setAtWeekOf]      = useState("");
  const [atTotalScanned,setAtTotalScanned]= useState(0);
  const [atFilter,      setAtFilter]      = useState<"ALL" | "LONG" | "SHORT">("ALL");

  useEffect(() => {
    const raw = localStorage.getItem("psyko_auth");
    if (!raw) { setLocation("/login"); return; }
    try {
      const { user, ts } = JSON.parse(raw);
      if (Date.now() - ts > 8 * 60 * 60 * 1000) { localStorage.removeItem("psyko_auth"); setLocation("/login"); return; }
      setAuthUser(user);
    } catch { setLocation("/login"); }
  }, [setLocation]);

  useEffect(() => { setLocalSigs(loadLocalSignals()); }, []);

  const poll = useCallback(async () => {
    const [chs, sigs] = await Promise.all([fetchChannels(), fetchAllSignals()]);
    setChannels(chs);
    setAllSigs(sigs);
    setIsLive(true);
    setLastUpd(new Date());
  }, []);

  useEffect(() => {
    if (!authUser) return;
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, [authUser, poll]);

  // Fetch BTC/ETH/SOL live computed signals
  const fetchLiveSignals = useCallback(async () => {
    setLsLoading(true);
    setLsError("");
    try {
      const r = await fetch("/api/market-data/live-signals");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json() as { signals: LiveSignal[]; cachedAt: string };
      setLsSignals(data.signals);
      setLsCachedAt(data.cachedAt);
    } catch (err) {
      setLsError("Error al cargar señales en vivo: " + String(err));
    } finally {
      setLsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "live" && lsSignals.length === 0 && !lsLoading) {
      void fetchLiveSignals();
    }
  }, [activeTab, lsSignals.length, lsLoading, fetchLiveSignals]);

  useEffect(() => {
    const id = setInterval(() => { if (activeTab === "live") void fetchLiveSignals(); }, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, [activeTab, fetchLiveSignals]);

  // Fetch AT signals from backend (RSI + MACD + Volume)
  const fetchAtSignals = useCallback(async () => {
    setAtLoading(true);
    setAtError("");
    try {
      const r = await fetch("/api/proxy/signals/altcoins");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json() as {
        signals: WhaleSignal[];
        cachedAt: string;
        weekOf?: string;
        totalScanned?: number;
      };
      setAtSignals(data.signals);
      setAtCachedAt(data.cachedAt);
      if (data.weekOf)      setAtWeekOf(data.weekOf);
      if (data.totalScanned) setAtTotalScanned(data.totalScanned);
    } catch (err) {
      setAtError("Error al cargar señales AT: " + String(err));
    } finally {
      setAtLoading(false);
    }
  }, []);

  // Load AT signals when tab is first selected
  useEffect(() => {
    if (activeTab === "at" && atSignals.length === 0 && !atLoading) {
      void fetchAtSignals();
    }
  }, [activeTab, atSignals.length, atLoading, fetchAtSignals]);

  // Auto-refresh AT every 5 min (matches backend cache TTL)
  useEffect(() => {
    const id = setInterval(() => { if (activeTab === "at") void fetchAtSignals(); }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [activeTab, fetchAtSignals]);

  if (!authUser) return null;

  // Build unique signals per channel
  const liveChannelSlugs = new Set(channels.map(c => c.slug));

  // Merge live + local, dedup by key
  const seen = new Set<string>();
  const merged: Signal[] = [];
  for (const s of [...allSigs, ...localSigs]) {
    const key = `${s.asset}-${s.direction}-${s.entry}-${s.channelSlug}`;
    if (!seen.has(key)) { seen.add(key); merged.push(s); }
  }

  // Group by channelSlug
  const signalsByChannel = new Map<string, Signal[]>();
  for (const s of merged) {
    const slug = s.channelSlug ?? "default";
    if (!signalsByChannel.has(slug)) signalsByChannel.set(slug, []);
    signalsByChannel.get(slug)!.push(s);
  }

  // All tabs: "all" + one per channel + live BTC/ETH/SOL + AT fixed tab
  const tabs = [
    { id: "all", label: "🌐 TODOS", color: "#4a6070" },
    ...channels.map(c => ({ id: c.slug, label: c.name, color: c.color })),
    ...(merged.length === 0 ? [{ id: "demo", label: "DEMO", color: "#4a6070" }] : []),
    { id: "live", label: "💹 BTC · ETH · SOL", color: "#ffd700" },
    { id: "at",   label: "📊 AT ALTCOINS",     color: "#00e5ff" },
  ];

  // Global stats across all channels
  const allFiltered = activeTab === "all" ? merged : merged.filter(s => s.channelSlug === activeTab);
  const totalActive = merged.filter(s => s.status === "ACTIVA").length;
  const totalWon    = merged.filter(s => s.status.includes("✅")).length;
  const totalClosed = merged.filter(s => s.status !== "ACTIVA").length;
  const globalWr    = totalClosed > 0 ? Math.round((totalWon / totalClosed) * 100) : 0;

  // Channels to render in "all" view
  const channelsToShow = activeTab === "all"
    ? channels
    : channels.filter(c => c.slug === activeTab);
  const showDemo = (activeTab === "all" || activeTab === "demo") && channels.length === 0;

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      <section className="pt-32 pb-8 px-6 md:px-12">
        {/* Hero header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <div className="font-space text-[10px] tracking-[0.4em] uppercase mb-2 flex items-center gap-2" style={{ color: isLive ? "#00e676" : "#4a6070" }}>
              <div className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-[#00e676] animate-pulse" : "bg-[#5a8898]"}`} />
              {isLive ? "LIVE — SEÑALES EN TIEMPO REAL" : "CONECTANDO..."}
            </div>
            <h1 className="font-bebas text-5xl md:text-7xl leading-none">
              CANAL DE<br /><span className="text-[#00e5ff]">SEÑALES</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {lastUpd && (
              <span className="font-space text-[9px] text-[#5a8898] border border-[#1a2535] px-2.5 py-1">
                ↻ {lastUpd.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
            <span className="font-space text-[10px] text-[#7ab3c8] border border-[#1a2535] px-3 py-1.5 uppercase">👤 {authUser}</span>
            <Link href="/dashboard" className="font-space text-[10px] text-[#00e5ff] border border-[#00e5ff44] px-3 py-1.5 uppercase no-underline hover:bg-[#00e5ff15] transition-colors">Dashboard</Link>
          </div>
        </div>

        {/* Global stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a2535] border border-[#1a2535] mb-8">
          {[
            { label: "Total señales", value: merged.length,   color: "#4a6070" },
            { label: "Activas",       value: totalActive,     color: "#00e676" },
            { label: "Ganadas",       value: totalWon,        color: "#00e5ff" },
            { label: "Win Rate",      value: `${globalWr}%`,  color: "#ffd700" },
          ].map((s, i) => (
            <div key={i} className="bg-[#080d14] p-5 text-center">
              <div className="font-space text-[10px] text-[#5a8898] tracking-[0.1em] uppercase mb-2">{s.label}</div>
              <div className="font-bebas text-4xl" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Channel tabs */}
        {tabs.length > 1 && (
          <div className="flex gap-0 mb-8 border-b border-[#1a2535] overflow-x-auto">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="font-space text-[10px] tracking-[0.1em] uppercase px-5 py-3 shrink-0 transition-colors"
                style={{
                  borderBottom: `2px solid ${activeTab === t.id ? t.color : "transparent"}`,
                  color: activeTab === t.id ? t.color : "#4a6070",
                  background: activeTab === t.id ? `${t.color}08` : "transparent",
                }}>
                {activeTab === t.id && <span className="inline-block w-1.5 h-1.5 rounded-full mr-2 mb-0.5" style={{ background: t.color }} />}
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Channel sections */}
        {showDemo && <DemoSection />}

        {channelsToShow.map(ch => (
          <ChannelSection
            key={ch.slug}
            channel={ch}
            signals={signalsByChannel.get(ch.slug) ?? []}
          />
        ))}

        {/* Default/unassigned signals if channels exist but some signals have no channel */}
        {activeTab === "all" && liveChannelSlugs.size > 0 && signalsByChannel.has("default") && (
          <ChannelSection
            channel={{ id: 0, slug: "default", name: "Señales Generales", color: "#4a6070", channelId: "", active: true }}
            signals={signalsByChannel.get("default") ?? []}
          />
        )}

        {/* ── BTC · ETH · SOL LIVE TAB ───────────────────────────────── */}
        {activeTab === "live" && (
          <div>
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-1.5 h-1.5 bg-[#ffd700] rounded-full animate-pulse" />
                  <span className="font-space text-[9px] text-[#ffd700] tracking-[0.3em] uppercase">ANÁLISIS TÉCNICO EN VIVO · 4H · OKX PERPETUALS</span>
                </div>
                <h2 className="font-bebas text-3xl md:text-5xl text-white leading-none">
                  SEÑALES <span className="text-[#ffd700]">BTC · ETH · SOL</span>
                </h2>
                <div className="font-space text-[11px] text-[#7ab3c8] mt-1">
                  RSI-14 · EMA 9/21/50/200 · CVD · Score técnico real
                  {lsCachedAt && (
                    <span className="ml-3 text-[#5a8898]">
                      calc: {new Date(lsCachedAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => void fetchLiveSignals()}
                className="font-space text-[10px] tracking-[0.1em] uppercase px-4 py-2 border border-[#ffd70044] text-[#ffd700] hover:bg-[#ffd70015] transition-colors shrink-0">
                ↻ RECALCULAR
              </button>
            </div>

            {lsLoading ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-4 animate-pulse">📡</div>
                <div className="font-bebas text-2xl text-white mb-2">CALCULANDO SEÑALES</div>
                <div className="font-space text-sm text-[#7ab3c8]">Descargando velas 4H · RSI · EMA · CVD...</div>
              </div>
            ) : lsError ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-4">⚠️</div>
                <div className="font-space text-sm text-[#ff6d00] mb-4">{lsError}</div>
                <button onClick={() => void fetchLiveSignals()}
                  className="font-space text-[10px] font-bold tracking-[0.1em] uppercase px-6 py-3 border border-[#ffd70044] text-[#ffd700] hover:bg-[#ffd70015] transition-all">
                  ↻ REINTENTAR
                </button>
              </div>
            ) : lsSignals.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-4">🔍</div>
                <div className="font-space text-sm text-[#7ab3c8]">Sin datos disponibles. Hacé click en RECALCULAR.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {lsSignals.map(ls => {
                  const isLong  = ls.direction === "LONG";
                  const isShort = ls.direction === "SHORT";
                  const dirColor = isLong ? "#00e676" : isShort ? "#ff1744" : "#ffd700";
                  const fmtP = (n: number) => n >= 1000
                    ? n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                    : n.toFixed(2);
                  return (
                    <div key={ls.symbol} className="bg-[#080d14] border relative overflow-hidden"
                      style={{ borderColor: `${dirColor}33` }}>
                      <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: dirColor }} />

                      {/* Header */}
                      <div className="p-5 border-b border-[#1a2535]">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-bebas text-2xl text-white leading-none">{ls.symbol}</div>
                            <div className="font-space text-[10px] text-[#7ab3c8]">{ls.label} · Perpetual 4H</div>
                          </div>
                          <div className="text-right">
                            <div className="font-space text-[10px] font-bold tracking-[0.1em] px-2.5 py-1 mb-1" style={{ background: `${dirColor}20`, color: dirColor }}>
                              {ls.signalEmoji} {ls.signal}
                            </div>
                            <div className="font-space text-[9px] text-[#5a8898]">Score {ls.score}/7</div>
                          </div>
                        </div>
                        <div className="font-mono text-2xl text-white font-bold">
                          ${fmtP(ls.close)}
                          <span className={`ml-3 text-base font-normal font-space ${ls.change4h >= 0 ? "text-[#00e676]" : "text-[#ff1744]"}`}>
                            {ls.change4h >= 0 ? "+" : ""}{ls.change4h}% 4H
                          </span>
                        </div>
                      </div>

                      {/* Price levels */}
                      <div className="grid grid-cols-4 gap-px bg-[#1a2535]">
                        {[
                          { label: "ENTRADA", val: fmtP(ls.close), color: "#ffffff" },
                          { label: "TP1",     val: fmtP(ls.tp1),   color: "#00e676" },
                          { label: "TP2",     val: fmtP(ls.tp2),   color: "#00e676" },
                          { label: "STOP",    val: fmtP(ls.sl),    color: "#ff1744" },
                        ].map(item => (
                          <div key={item.label} className="bg-[#080d14] p-3 text-center">
                            <div className="font-space text-[8px] text-[#5a8898] tracking-[0.1em] mb-1">{item.label}</div>
                            <div className="font-mono text-[10px] font-bold" style={{ color: item.color }}>{item.val}</div>
                          </div>
                        ))}
                      </div>

                      {/* Technical indicators */}
                      <div className="p-4 space-y-2">
                        {/* RSI */}
                        <div className="flex items-center justify-between">
                          <span className="font-space text-[9px] text-[#5a8898] tracking-[0.1em] w-20">RSI 14</span>
                          <div className="flex-1 mx-3 bg-[#1a2535] h-1.5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(ls.rsi, 100)}%`, background: ls.rsi < 30 ? "#00e676" : ls.rsi > 70 ? "#ff1744" : "#ffd700" }} />
                          </div>
                          <span className="font-mono text-[11px] font-bold w-10 text-right"
                            style={{ color: ls.rsi < 30 ? "#00e676" : ls.rsi > 70 ? "#ff1744" : "#ffd700" }}>
                            {ls.rsi}
                          </span>
                        </div>

                        {/* EMA grid */}
                        <div className="grid grid-cols-2 gap-2">
                          {([
                            { label: "EMA 9",   val: ls.ema9,   ok: ls.close > ls.ema9   },
                            { label: "EMA 21",  val: ls.ema21,  ok: ls.close > ls.ema21  },
                            { label: "EMA 50",  val: ls.ema50,  ok: ls.close > ls.ema50  },
                            { label: "EMA 200", val: ls.ema200, ok: ls.aboveEma200 },
                          ] as const).map(item => (
                            <div key={item.label} className="flex items-center justify-between bg-[#060a0f] border border-[#1a2535] px-2.5 py-1.5">
                              <span className="font-space text-[8px] text-[#5a8898]">{item.label}</span>
                              <span className="font-mono text-[9px]" style={{ color: item.ok ? "#00e676" : "#ff174499" }}>
                                {item.ok ? "▲" : "▼"} {fmtP(item.val)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {ls.emaCross && (
                            <span className="font-space text-[8px] px-2 py-0.5 border"
                              style={{ borderColor: ls.emaCross === "golden" ? "#ffd70044" : "#ff174444",
                                       color:       ls.emaCross === "golden" ? "#ffd700"   : "#ff1744",
                                       background:  ls.emaCross === "golden" ? "#ffd70010" : "#ff174410" }}>
                              {ls.emaCross === "golden" ? "✦ CRUCE ALCISTA 9/21" : "✦ CRUCE BAJISTA 9/21"}
                            </span>
                          )}
                          <span className="font-space text-[8px] px-2 py-0.5 border border-[#1a2535]"
                            style={{ color: ls.cvdBull ? "#00e676" : "#ff174499" }}>
                            CVD {ls.cvdBull ? "POSITIVO" : "NEGATIVO"}
                          </span>
                          <span className="font-space text-[8px] px-2 py-0.5 border border-[#1a2535]"
                            style={{ color: ls.aboveEma200 ? "#00e5ff" : "#4a6070" }}>
                            {ls.aboveEma200 ? "▲ SOBRE EMA200" : "▼ BAJO EMA200"}
                          </span>
                        </div>

                        {/* S/R */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="bg-[#060a0f] border border-[#00e67622] p-2.5">
                            <div className="font-space text-[8px] text-[#5a8898] mb-1">SOPORTE 20V</div>
                            <div className="font-mono text-[10px] text-[#00e676]">${fmtP(ls.support)}</div>
                            <div className="font-space text-[8px] text-[#5a8898]">−{ls.distSupport}%</div>
                          </div>
                          <div className="bg-[#060a0f] border border-[#ff174422] p-2.5">
                            <div className="font-space text-[8px] text-[#5a8898] mb-1">RESISTENCIA 20V</div>
                            <div className="font-mono text-[10px] text-[#ff1744]">${fmtP(ls.resistance)}</div>
                            <div className="font-space text-[8px] text-[#5a8898]">+{ls.distResistance}%</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between font-space text-[9px] text-[#7ab3c8] pt-1">
                          <span>R/R {ls.rr}</span>
                          <span className="text-[#5a8898]">análisis técnico real · 4H OKX</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── AT ALTCOINS TAB ─────────────────────────────────────────── */}
        {activeTab === "at" && (
          <div>
            {/* AT header */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="w-1.5 h-1.5 bg-[#00e5ff] rounded-full animate-pulse" />
                  <span className="font-space text-[9px] text-[#00e5ff] tracking-[0.3em] uppercase">ANÁLISIS TÉCNICO REAL · BINANCE</span>
                  {atWeekOf && (
                    <span className="font-space text-[8px] px-2 py-0.5 border border-[#00e5ff22] text-[#00e5ff88]">
                      {atWeekOf}
                    </span>
                  )}
                </div>
                <h2 className="font-bebas text-3xl md:text-5xl text-white leading-none">
                  SEÑALES <span className="text-[#00e5ff]">ALTCOINS</span>
                </h2>
                <div className="font-space text-[11px] text-[#7ab3c8] mt-1 flex flex-wrap gap-3">
                  <span>RSI-14 · MACD · EMA20 · Volumen</span>
                  {atTotalScanned > 0 && (
                    <span className="text-[#5a8898]">
                      <span className="text-[#ffd700]">{atTotalScanned}</span> monedas escaneadas
                      · top <span className="text-[#00e5ff]">{atSignals.length}</span> señales
                    </span>
                  )}
                  {atCachedAt && (
                    <span className="text-[#5a8898]">
                      calc: {new Date(atCachedAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => void fetchAtSignals()}
                className="font-space text-[10px] tracking-[0.1em] uppercase px-4 py-2 border border-[#00e5ff44] text-[#00e5ff] hover:bg-[#00e5ff15] transition-colors shrink-0">
                ↻ RECALCULAR
              </button>
            </div>

            {/* Direction filter */}
            <div className="flex gap-2 mb-6">
              {(["ALL", "LONG", "SHORT"] as const).map(f => (
                <button key={f} onClick={() => setAtFilter(f)}
                  className={`font-space text-[10px] font-bold tracking-[0.15em] uppercase px-5 py-2 transition-all ${
                    atFilter === f
                      ? f === "LONG" ? "bg-[#00e676] text-[#020408]" : f === "SHORT" ? "bg-[#ff1744] text-white" : "bg-[#00e5ff] text-[#020408]"
                      : "border border-[#1a2535] text-[#7ab3c8] hover:border-[#2a3a50]"
                  }`}>
                  {f === "ALL" ? "TODOS" : f}
                </button>
              ))}
            </div>

            {/* AT signal cards */}
            {atLoading ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-4 animate-pulse">📡</div>
                <div className="font-bebas text-2xl text-white mb-2">CALCULANDO SEÑALES</div>
                <div className="font-space text-sm text-[#7ab3c8]">
                  Descargando velas · calculando RSI, MACD y volumen para{" "}
                  <span className="text-[#00e5ff]">20 altcoins</span>...
                </div>
              </div>
            ) : atError ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-4">⚠️</div>
                <div className="font-space text-sm text-[#ff6d00] mb-4">{atError}</div>
                <button onClick={() => void fetchAtSignals()}
                  className="font-space text-[10px] font-bold tracking-[0.1em] uppercase px-6 py-3 border border-[#00e5ff44] text-[#00e5ff] hover:bg-[#00e5ff15] transition-all">
                  ↻ REINTENTAR
                </button>
              </div>
            ) : atSignals.filter(s => atFilter === "ALL" || s.direction === atFilter).length === 0 ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-4">🔍</div>
                <div className="font-space text-sm text-[#7ab3c8]">
                  Sin señales con suficiente confirmación técnica ahora.<br />
                  El algoritmo solo genera señales cuando RSI + MACD + Volumen alinean.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {atSignals.filter(s => atFilter === "ALL" || s.direction === atFilter).map(sig => (
                  <div key={sig.symbol} className="bg-[#080d14] border p-5 relative overflow-hidden transition-colors"
                    style={{ borderColor: sig.direction === "LONG" ? "#00e67633" : "#ff174433" }}>
                    <div className="absolute top-0 left-0 w-full h-0.5"
                      style={{ background: sig.direction === "LONG" ? "#00e676" : "#ff1744" }} />

                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span style={{ color: sig.color, fontSize: 20 }}>{sig.icon}</span>
                        <div>
                          <div className="font-bebas text-xl text-white leading-none">{sig.name}</div>
                          <div className="font-space text-[9px] text-[#7ab3c8]">
                            {sig.symbol.replace("USDT", "/USDT")}
                            {sig.change1h !== 0 && (
                              <span className={`ml-2 ${sig.change1h > 0 ? "text-[#00e676]" : "text-[#ff1744]"}`}>
                                {sig.change1h > 0 ? "+" : ""}{sig.change1h}% 1h
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`font-space text-[10px] font-bold px-2.5 py-1 tracking-[0.1em] ${
                          sig.direction === "LONG" ? "bg-[#00e67620] text-[#00e676]" : "bg-[#ff174420] text-[#ff1744]"
                        }`}>{sig.direction}</span>
                        <span className="font-space text-[8px] px-1.5 py-0.5 tracking-[0.1em]"
                          style={{ background: `${sig.strengthColor}15`, border: `1px solid ${sig.strengthColor}33`, color: sig.strengthColor }}>
                          {sig.strength}
                        </span>
                      </div>
                    </div>

                    {/* Price levels */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        { label: "ENTRADA", value: sig.entry, color: "#ffffff" },
                        { label: "TP1",     value: sig.tp1,   color: "#00e676" },
                        { label: "TP2",     value: sig.tp2,   color: "#00e676" },
                        { label: "STOP",    value: sig.sl,    color: "#ff1744" },
                      ].map(item => (
                        <div key={item.label} className="text-center">
                          <div className="font-space text-[8px] text-[#7ab3c8] tracking-[0.1em] mb-0.5">{item.label}</div>
                          <div className="font-mono text-[10px] font-bold" style={{ color: item.color }}>{item.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Indicators row */}
                    <div className="grid grid-cols-3 gap-1.5 mb-3 p-2 bg-[#060a0f] border border-[#1a2535]">
                      <div className="text-center">
                        <div className="font-space text-[8px] text-[#5a8898] tracking-[0.1em] mb-0.5">RSI 14</div>
                        <div className="font-mono text-[11px] font-bold"
                          style={{ color: sig.rsi < 35 ? "#00e676" : sig.rsi > 65 ? "#ff1744" : "#ffd700" }}>
                          {sig.rsi}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-space text-[8px] text-[#5a8898] tracking-[0.1em] mb-0.5">MACD</div>
                        <div className="font-mono text-[11px] font-bold"
                          style={{ color: sig.macdHistogram > 0 ? "#00e676" : "#ff1744" }}>
                          {sig.macdCross ? "✕ CRUCE" : sig.macdHistogram > 0 ? "▲ POS" : "▼ NEG"}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-space text-[8px] text-[#5a8898] tracking-[0.1em] mb-0.5">VOL ×</div>
                        <div className="font-mono text-[11px] font-bold"
                          style={{ color: sig.volumeSpike > 2 ? "#00e5ff" : "#4a6070" }}>
                          ×{sig.volumeSpike}
                        </div>
                      </div>
                    </div>

                    {/* Indicator tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {sig.indicators.slice(0, 3).map((ind, i) => (
                        <span key={i} className="font-space text-[8px] px-1.5 py-0.5 border border-[#1a2535] text-[#7ab3c8] bg-[#060a0f]">
                          {ind}
                        </span>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between font-space text-[9px] text-[#7ab3c8]">
                      <span>R/R {sig.rr}</span>
                      <span style={{ color: "#2a4a5a" }}>Score {sig.score}/8 · análisis técnico real</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 p-4 border border-[#1a2535] bg-[#080d14]">
          <div className="font-space text-[10px] text-[#5a8898] leading-relaxed">
            ⚠️ DISCLAIMER: Las señales son únicamente educativas. No constituyen asesoramiento financiero. El trading con apalancamiento implica riesgo de pérdida total del capital. Operá siempre con gestión de riesgo adecuada (máx 1-2% por trade).
          </div>
        </div>

        {/* Admin-only channel manager */}
        {authUser?.toLowerCase() === "admin" && (
          <AdminChannelManager channels={channels} onRefresh={poll} />
        )}
      </section>
    </div>
  );
}

export default function Signals() {
  const auth = getAuth();
  if (!auth) { window.location.replace("/login?redirect=/signals"); return null; }
  const plan = (auth.plan ?? "").toLowerCase();
  const ok = ["aprendiz","educacion","educación","trader","institucional"].includes(plan) || auth.role === "superadmin" || auth.role === "operator" || auth.role === "member";
  if (!ok) return <SignalsGate required="educacion" price="29" name="EDUCACIÓN" color="#ffd700" />;
  return <SignalsContent />;
}
