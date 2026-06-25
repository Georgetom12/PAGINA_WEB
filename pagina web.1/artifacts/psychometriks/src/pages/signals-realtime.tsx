import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, Link } from "wouter";
import SiteNav from "@/components/site-nav";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");
const TELEGRAM = "https://t.me/psychometriks_pro";

// ── Auth helpers ───────────────────────────────────────────────────────────
type PsyRole = "superadmin" | "operator" | "member" | "user";
type PsyPlan = "basico" | "educacion" | "pro" | "elite" | null;
interface AuthSession { user: string; role: PsyRole; plan?: PsyPlan; token: string; displayName?: string; ts: number; }

function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem("psyko_auth");
    if (!raw) return null;
    const s = JSON.parse(raw) as AuthSession;
    if (Date.now() - s.ts > 8 * 60 * 60 * 1000) { localStorage.removeItem("psyko_auth"); return null; }
    return s;
  } catch { return null; }
}

function authHeaders(token: string): Record<string, string> {
  return { "Content-Type": "application/json", "X-PSY-Token": token };
}

// ── Types ─────────────────────────────────────────────────────────────────
interface Ticker {
  symbol: string; label: string; price: number; change: number;
  high: number; low: number; volume: number; icon: string; color: string;
}
interface Signal {
  id: number; asset: string; direction: "LONG" | "SHORT"; entry: string;
  tp1: string; tp2?: string | null; sl: string; status: string;
  leverage?: string | null; rr?: string | null; note?: string | null;
  source?: string | null; createdAt: string; channelSlug?: string;
}
interface Channel { id: number; slug: string; name: string; color: string; channelId: string; inviteLink?: string | null; active: boolean; }
interface Operator { id: number; username: string; displayName: string; active: boolean; createdAt: string; }
interface AIAnalysis { text: string; ts: number; loading: boolean; }

// ── Binance pairs ──────────────────────────────────────────────────────────
const WS_PAIRS = [
  { symbol: "BTCUSDT",  label: "BTC/USDT",  icon: "₿",  color: "#ffd700" },
  { symbol: "ETHUSDT",  label: "ETH/USDT",  icon: "Ξ",  color: "#00e5ff" },
  { symbol: "SOLUSDT",  label: "SOL/USDT",  icon: "◎",  color: "#9945ff" },
  { symbol: "BNBUSDT",  label: "BNB/USDT",  icon: "⬡",  color: "#f3ba2f" },
  { symbol: "XRPUSDT",  label: "XRP/USDT",  icon: "✕",  color: "#00aae4" },
  { symbol: "DOGEUSDT", label: "DOGE/USDT", icon: "Ð",  color: "#c2a633" },
  { symbol: "ADAUSDT",  label: "ADA/USDT",  icon: "₳",  color: "#0033ad" },
  { symbol: "AVAXUSDT", label: "AVAX/USDT", icon: "▲",  color: "#e84142" },
  { symbol: "DOTUSDT",  label: "DOT/USDT",  icon: "●",  color: "#e6007a" },
  { symbol: "LINKUSDT", label: "LINK/USDT", icon: "⬡",  color: "#375bd2" },
  { symbol: "LTCUSDT",  label: "LTC/USDT",  icon: "Ł",  color: "#bfbbbb" },
  { symbol: "UNIUSDT",  label: "UNI/USDT",  icon: "🦄", color: "#ff007a" },
];

const ASSETS = [
  "BTC/USDT","ETH/USDT","SOL/USDT","BNB/USDT","XRP/USDT","DOGE/USDT",
  "AVAX/USDT","LINK/USDT","DOT/USDT","LTC/USDT","ADA/USDT","MATIC/USDT",
  "UNI/USDT","ATOM/USDT","APT/USDT","ARB/USDT","OP/USDT","INJ/USDT",
  "EUR/USD","GBP/USD","USD/JPY","AUD/USD","XAU/USD","XAG/USD","WTI","NDX",
];

const STATUS_OPTIONS = ["ACTIVA","TP1 ✅","TP2 ✅","CERRADA ✅","INVALIDADA ❌"];

function getTradingSession() {
  const h = new Date().getUTCHours();
  return [
    { name: "ASIA",     color: "#ffd700", active: h >= 0  && h < 8  },
    { name: "LONDON",   color: "#00e5ff", active: h >= 8  && h < 16 },
    { name: "NEW YORK", color: "#00e676", active: h >= 13 && h < 22 },
  ];
}

// ── Sparkline ──────────────────────────────────────────────────────────────
function Sparkline({ history, color }: { history: number[]; color: string }) {
  if (history.length < 2) return null;
  const min = Math.min(...history); const max = Math.max(...history);
  const range = max - min || 1; const W = 80; const H = 28;
  const pts = history.map((v, i) => `${(i / (history.length - 1)) * W},${H - ((v - min) / range) * H}`).join(" ");
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
    </svg>
  );
}

// ── Signal Card ────────────────────────────────────────────────────────────
function SignalCard({
  s, chColor, canManage, token, onRefresh,
}: {
  s: Signal; chColor: string; canManage: boolean; token: string; onRefresh: () => void;
}) {
  const isLong = s.direction === "LONG";
  const isActive = s.status === "ACTIVA";
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const changeStatus = async (status: string) => {
    setUpdatingStatus(true);
    try {
      await fetch(`${API}/api/signals/${s.id}/status`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ status }),
      });
      onRefresh();
    } finally { setUpdatingStatus(false); }
  };

  return (
    <div className="border bg-[#060a0f] p-4 relative overflow-hidden"
      style={{ borderColor: isActive ? `${chColor}44` : "#1a2535" }}>
      {isActive && <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${chColor},transparent)` }} />}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bebas text-xl" style={{ color: chColor }}>{s.asset}</span>
            <span className="font-space text-[9px] px-2 py-0.5 font-bold"
              style={{ background: isLong ? "#00e67620" : "#ff174420", color: isLong ? "#00e676" : "#ff1744", border: `1px solid ${isLong ? "#00e67644" : "#ff174444"}` }}>
              {s.direction}
            </span>
            {s.leverage && <span className="font-space text-[9px] text-[#ffd700] border border-[#ffd70033] px-1.5">{s.leverage}</span>}
          </div>
          <div className="font-space text-[10px] text-[#5a8898] mt-0.5">
            {new Date(s.createdAt).toLocaleString("es-EC", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            {s.source && s.source.startsWith("MANUAL:") && (
              <span className="ml-2 text-[#ffd70080]">por {s.source.replace("MANUAL:", "")}</span>
            )}
          </div>
        </div>
        {canManage ? (
          <select
            value={s.status}
            onChange={e => changeStatus(e.target.value)}
            disabled={updatingStatus}
            className="font-space text-[9px] px-2 py-1 border bg-[#0d1520] cursor-pointer"
            style={{ borderColor: isActive ? "#00e67644" : "#1a2535", color: isActive ? "#00e676" : "#4a6070" }}>
            {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        ) : (
          <span className="font-space text-[10px] px-2 py-1 border"
            style={{ borderColor: isActive ? "#00e67644" : "#1a2535", color: isActive ? "#00e676" : "#4a6070" }}>
            {s.status}
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        {[
          { l: "ENTRADA", v: s.entry, c: "#fff" },
          { l: "TP1",     v: s.tp1,   c: "#00e676" },
          { l: "SL",      v: s.sl,    c: "#ff1744" },
        ].map((f, i) => (
          <div key={i} className="bg-[#080d14] border border-[#1a2535] p-2">
            <div className="font-space text-[9px] text-[#5a8898] tracking-[0.1em] mb-1">{f.l}</div>
            <div className="font-mono text-[12px] font-bold" style={{ color: f.c }}>{f.v}</div>
          </div>
        ))}
      </div>
      {s.tp2 && (
        <div className="mb-2 font-space text-[10px] text-[#00e676]">TP2: {s.tp2}</div>
      )}
      {s.note && <p className="font-space text-[10px] text-[#7ab3c8] leading-relaxed">{s.note}</p>}
      {s.rr && <div className="mt-2 font-space text-[10px] text-[#ffd700]">R/R {s.rr}</div>}
    </div>
  );
}

// ── HeatTile ───────────────────────────────────────────────────────────────
function HeatTile({ t }: { t: Ticker }) {
  const pct = t.change; const intensity = Math.min(Math.abs(pct) / 5, 1);
  const bg = pct > 0 ? `rgba(0,230,118,${0.07 + intensity * 0.25})` : `rgba(255,23,68,${0.07 + intensity * 0.25})`;
  const col = pct > 0 ? "#00e676" : "#ff1744";
  return (
    <div className="border border-[#1a2535] p-3 flex flex-col justify-between min-h-[80px]" style={{ background: bg }}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-space text-[10px] text-[#8a9ab0]">{t.label.split("/")[0]}</span>
        <span className="text-base" style={{ color: t.color }}>{t.icon}</span>
      </div>
      <div className="font-mono text-[11px] text-white font-bold">
        ${t.price < 1 ? t.price.toFixed(5) : t.price < 100 ? t.price.toFixed(3) : t.price.toLocaleString("en", { maximumFractionDigits: 0 })}
      </div>
      <div className="font-mono text-[12px] font-bold" style={{ color: col }}>{pct >= 0 ? "+" : ""}{pct.toFixed(2)}%</div>
    </div>
  );
}

// ── Signal Sender Panel ────────────────────────────────────────────────────
function SignalSender({
  channels, token, onSent,
}: {
  channels: Channel[]; token: string; onSent: () => void;
}) {
  const [asset, setAsset]       = useState("BTC/USDT");
  const [dir, setDir]           = useState<"LONG"|"SHORT">("LONG");
  const [entry, setEntry]       = useState("");
  const [tp1, setTp1]           = useState("");
  const [tp2, setTp2]           = useState("");
  const [sl, setSl]             = useState("");
  const [lev, setLev]           = useState("");
  const [rr, setRr]             = useState("");
  const [note, setNote]         = useState("");
  const [channelSlug, setChannelSlug] = useState("ambos");
  const [sending, setSending]   = useState(false);
  const [toast, setToast]       = useState("");

  useEffect(() => {
    // default to "ambos" if there are multiple channels, else first channel
    if (channels.length > 1 && channelSlug === channels[0]?.slug) setChannelSlug("ambos");
  }, [channels, channelSlug]);

  const send = async () => {
    if (!entry || !tp1 || !sl) { setToast("⚠️ Entrada, TP1 y SL son requeridos"); setTimeout(() => setToast(""), 3000); return; }
    setSending(true);
    try {
      const res = await fetch(`${API}/api/signals`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ channelSlug: channelSlug || "default", asset, direction: dir, entry, tp1, tp2: tp2||null, sl, leverage: lev||null, rr: rr||null, note: note||null }),
      });
      if (res.ok) {
        setToast("✅ Señal publicada correctamente");
        setEntry(""); setTp1(""); setTp2(""); setSl(""); setLev(""); setRr(""); setNote("");
        onSent();
      } else {
        const d = await res.json() as { error?: string };
        setToast(`❌ ${d.error ?? "Error al publicar"}`);
      }
    } catch { setToast("❌ Error de conexión"); }
    finally { setSending(false); setTimeout(() => setToast(""), 4000); }
  };

  const inp = "w-full bg-[#080d14] border border-[#1a2535] text-white font-mono text-[12px] px-3 py-2 outline-none focus:border-[#00e5ff] transition-colors";
  const lbl = "font-space text-[9px] text-[#7ab3c8] tracking-[0.1em] uppercase mb-1 block";

  return (
    <div className="border border-[#ffd70033] bg-[#060a0f]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a2535]"
        style={{ background: "linear-gradient(90deg,rgba(255,215,0,0.06),transparent)" }}>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#ffd700] animate-pulse" />
          <span className="font-space text-[10px] text-[#ffd700] tracking-[0.25em] uppercase">📡 ENVIAR SEÑAL</span>
        </div>
        {toast && (
          <span className="font-space text-[10px]" style={{ color: toast.startsWith("✅") ? "#00e676" : "#ff1744" }}>{toast}</span>
        )}
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Asset + Direction */}
        <div>
          <label className={lbl}>Activo</label>
          <select value={asset} onChange={e => setAsset(e.target.value)} className={inp + " cursor-pointer"}>
            {ASSETS.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Dirección</label>
          <div className="flex gap-2">
            {(["LONG","SHORT"] as const).map(d => (
              <button key={d} onClick={() => setDir(d)}
                className="flex-1 py-2 font-space text-[10px] font-bold tracking-[0.1em] border transition-all"
                style={{
                  borderColor: dir === d ? (d === "LONG" ? "#00e676" : "#ff1744") : "#1a2535",
                  background:  dir === d ? (d === "LONG" ? "#00e67615" : "#ff174415") : "transparent",
                  color:       dir === d ? (d === "LONG" ? "#00e676" : "#ff1744") : "#4a6070",
                }}>
                {d === "LONG" ? "📈 LONG" : "📉 SHORT"}
              </button>
            ))}
          </div>
        </div>
        {/* Entry / TP1 / TP2 / SL */}
        <div>
          <label className={lbl}>Entrada *</label>
          <input value={entry} onChange={e => setEntry(e.target.value)} className={inp} placeholder="65,200" />
        </div>
        <div>
          <label className={lbl}>TP1 *</label>
          <input value={tp1} onChange={e => setTp1(e.target.value)} className={inp} placeholder="67,500" />
        </div>
        <div>
          <label className={lbl}>TP2 (opcional)</label>
          <input value={tp2} onChange={e => setTp2(e.target.value)} className={inp} placeholder="70,000" />
        </div>
        <div>
          <label className={lbl}>Stop Loss *</label>
          <input value={sl} onChange={e => setSl(e.target.value)} className={inp} placeholder="63,800" style={{ borderColor: sl ? "#ff174444" : undefined }} />
        </div>
        {/* Leverage / R:R */}
        <div>
          <label className={lbl}>Apalancamiento</label>
          <input value={lev} onChange={e => setLev(e.target.value)} className={inp} placeholder="5x" />
        </div>
        <div>
          <label className={lbl}>R/R estimado</label>
          <input value={rr} onChange={e => setRr(e.target.value)} className={inp} placeholder="1:3" />
        </div>
        {/* Channel */}
        <div>
          <label className={lbl}>Canal Telegram</label>
          <select value={channelSlug} onChange={e => setChannelSlug(e.target.value)} className={inp + " cursor-pointer"}>
            <option value="ambos">📡 AMBOS CANALES</option>
            {channels.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
            {channels.length === 0 && <option value="default">default (env vars)</option>}
          </select>
        </div>
        {/* Note */}
        <div className="sm:col-span-2">
          <label className={lbl}>Nota / Análisis</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            className={inp + " resize-none"}
            placeholder="Zona de demanda clave en 4H, BOS alcista, entrada en mitigación del OB..." />
        </div>
        {/* Submit */}
        <div className="sm:col-span-2">
          <button onClick={send} disabled={sending}
            className="w-full py-3 font-space text-[11px] font-bold tracking-[0.2em] uppercase border transition-all"
            style={{
              background: sending ? "rgba(255,215,0,0.05)" : "linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,215,0,0.08))",
              borderColor: "#ffd700",
              color: "#ffd700",
              opacity: sending ? 0.6 : 1,
              cursor: sending ? "not-allowed" : "pointer",
            }}>
            {sending ? "⏳ PUBLICANDO..." : "📡 PUBLICAR SEÑAL"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Operator Management Panel (SUPERADMIN only) ────────────────────────────
function OperatorManager({ token }: { token: string }) {
  const [ops, setOps] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser]     = useState("");
  const [newPass, setNewPass]     = useState("");
  const [newName, setNewName]     = useState("");
  const [creating, setCreating]   = useState(false);
  const [toast, setToast]         = useState("");
  const [showForm, setShowForm]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/operators`, { headers: { "X-PSY-Token": token } });
      if (r.ok) { const d = await r.json() as { operators: Operator[] }; setOps(d.operators); }
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const createOp = async () => {
    if (!newUser || !newPass || !newName) { notify("⚠️ Completa todos los campos"); return; }
    setCreating(true);
    try {
      const r = await fetch(`${API}/api/admin/operators`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ username: newUser, password: newPass, displayName: newName }),
      });
      const d = await r.json() as { ok?: boolean; error?: string };
      if (d.ok) { notify("✅ Operador creado"); setNewUser(""); setNewPass(""); setNewName(""); setShowForm(false); load(); }
      else notify(`❌ ${d.error ?? "Error"}`);
    } finally { setCreating(false); }
  };

  const toggleActive = async (op: Operator) => {
    await fetch(`${API}/api/admin/operators/${op.id}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ active: !op.active }),
    });
    load();
    notify(op.active ? `⛔ ${op.displayName} suspendido` : `✅ ${op.displayName} reactivado`);
  };

  const deleteOp = async (op: Operator) => {
    if (!confirm(`¿Eliminar permanentemente a ${op.displayName}? Esta acción no se puede deshacer.`)) return;
    await fetch(`${API}/api/admin/operators/${op.id}`, { method: "DELETE", headers: { "X-PSY-Token": token } });
    load();
    notify(`🗑️ ${op.displayName} eliminado`);
  };

  const inp = "bg-[#080d14] border border-[#1a2535] text-white font-mono text-[12px] px-3 py-2 outline-none focus:border-[#e040fb] transition-colors w-full";

  return (
    <div className="border border-[#e040fb33] bg-[#060a0f]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a2535]"
        style={{ background: "linear-gradient(90deg,rgba(224,64,251,0.06),transparent)" }}>
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e040fb]" />
          <span className="font-space text-[10px] text-[#e040fb] tracking-[0.25em] uppercase">🛡 GESTIÓN DE OPERADORES</span>
        </div>
        <div className="flex items-center gap-2">
          {toast && <span className="font-space text-[9px]" style={{ color: toast.startsWith("✅") ? "#00e676" : toast.startsWith("⚠️") ? "#ffd700" : "#ff1744" }}>{toast}</span>}
          <button onClick={() => setShowForm(!showForm)}
            className="font-space text-[9px] px-3 py-1.5 border border-[#e040fb44] text-[#e040fb] hover:bg-[#e040fb10] transition-colors">
            {showForm ? "CANCELAR" : "+ NUEVO OPERADOR"}
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="p-4 border-b border-[#1a2535] bg-[#080d14]">
          <div className="font-space text-[9px] text-[#e040fb] tracking-[0.15em] mb-3 uppercase">Crear nuevo operador de señales</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <div className="font-space text-[9px] text-[#7ab3c8] mb-1">NOMBRE VISIBLE</div>
              <input value={newName} onChange={e => setNewName(e.target.value)} className={inp} placeholder="Ej: TraderPro" />
            </div>
            <div>
              <div className="font-space text-[9px] text-[#7ab3c8] mb-1">USUARIO (para login)</div>
              <input value={newUser} onChange={e => setNewUser(e.target.value)} className={inp} placeholder="traderpro" />
            </div>
            <div>
              <div className="font-space text-[9px] text-[#7ab3c8] mb-1">CONTRASEÑA</div>
              <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className={inp} placeholder="mínimo 6 caracteres" />
            </div>
          </div>
          <div className="font-space text-[9px] text-[#5a8898] mb-3">
            ⚠️ Este operador solo podrá enviar señales. No tendrá acceso al dashboard ni a la gestión de la plataforma.
          </div>
          <button onClick={createOp} disabled={creating}
            className="font-space text-[9px] px-4 py-2 border border-[#e040fb44] text-[#e040fb] hover:bg-[#e040fb10] transition-colors disabled:opacity-50">
            {creating ? "CREANDO..." : "✅ CREAR OPERADOR"}
          </button>
        </div>
      )}

      {/* Operators list */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-6 font-space text-[10px] text-[#5a8898]">Cargando operadores...</div>
        ) : ops.length === 0 ? (
          <div className="text-center py-6">
            <div className="font-space text-[11px] text-[#5a8898] mb-2">No hay operadores configurados</div>
            <div className="font-space text-[10px] text-[#1a2535]">Creá uno con el botón de arriba para delegar el envío de señales</div>
          </div>
        ) : (
          <div className="space-y-2">
            {ops.map(op => (
              <div key={op.id} className="flex items-center justify-between p-3 border gap-3"
                style={{ borderColor: op.active ? "#e040fb22" : "#1a2535", background: op.active ? "rgba(224,64,251,0.03)" : "rgba(0,0,0,0.2)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: op.active ? "#e040fb" : "#2a4a5a" }} />
                  <div>
                    <div className="font-space text-[12px] text-white">{op.displayName}</div>
                    <div className="font-mono text-[10px] text-[#7ab3c8]">@{op.username}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-space text-[9px] px-2 py-0.5 border"
                    style={{ color: op.active ? "#e040fb" : "#4a6070", borderColor: op.active ? "#e040fb44" : "#1a2535" }}>
                    {op.active ? "ACTIVO" : "SUSPENDIDO"}
                  </span>
                  <button onClick={() => toggleActive(op)}
                    className="font-space text-[9px] px-2 py-1 border transition-colors hover:opacity-80"
                    style={{ borderColor: op.active ? "#ff174444" : "#00e67644", color: op.active ? "#ff1744" : "#00e676" }}>
                    {op.active ? "⛔ SUSPENDER" : "✅ REACTIVAR"}
                  </button>
                  <button onClick={() => deleteOp(op)}
                    className="font-space text-[9px] px-2 py-1 border border-[#1a2535] text-[#7ab3c8] hover:border-[#ff174444] hover:text-[#ff1744] transition-colors">
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-[#1a2535] font-space text-[9px] text-[#1a2535]">
          SOLO VOS (SUPERADMIN) podés ver y gestionar esta sección.
          Los operadores suspendidos no pueden iniciar sesión ni enviar señales.
        </div>
      </div>
    </div>
  );
}

// ── Operator-Only View ─────────────────────────────────────────────────────
function OperatorView({
  session, signals, channels, onRefresh,
}: {
  session: AuthSession; signals: Signal[]; channels: Channel[]; onRefresh: () => void;
}) {
  const chMap = new Map(channels.map(c => [c.slug, c]));
  const recent = signals.slice(0, 10);

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      {/* Operator header */}
      <div className="border-b border-[#1a2535] bg-[#060a0f]">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#e040fb] animate-pulse" />
            <div>
              <div className="font-space text-[9px] text-[#e040fb] tracking-[0.25em] uppercase">PSYCHOMETRIKS — PANEL OPERADOR</div>
              <div className="font-bebas text-xl leading-none text-white">
                {session.displayName ?? session.user} <span className="text-[#7ab3c8] text-sm">· SEÑALES</span>
              </div>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem("psyko_auth"); window.location.href = "/login"; }}
            className="font-space text-[9px] px-3 py-1.5 border border-[#1a2535] text-[#7ab3c8] hover:border-[#ff174444] hover:text-[#ff1744] transition-colors">
            CERRAR SESIÓN
          </button>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 max-w-[900px] mx-auto space-y-6">
        {/* Role badge */}
        <div className="border border-[#e040fb22] bg-[#080d14] px-4 py-3 flex items-center gap-3">
          <span className="text-xl">🛡️</span>
          <div>
            <div className="font-space text-[10px] text-[#e040fb]">ROL: OPERADOR DE SEÑALES</div>
            <div className="font-space text-[9px] text-[#7ab3c8]">
              Podés enviar señales en nombre de PSYCHOMETRIKS. Tus señales son visibles para todos los usuarios del sistema.
            </div>
          </div>
        </div>

        {/* Signal sender */}
        <SignalSender channels={channels} token={session.token} onSent={onRefresh} />

        {/* Recent signals sent by this operator */}
        <div className="border border-[#1a2535] bg-[#060a0f]">
          <div className="px-4 py-3 border-b border-[#1a2535]">
            <span className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase">📋 Últimas señales publicadas</span>
          </div>
          <div className="p-4">
            {recent.length === 0 ? (
              <div className="text-center py-6 font-space text-[11px] text-[#5a8898]">Aún no hay señales. Publiqué la primera arriba.</div>
            ) : (
              <div className="space-y-px bg-[#1a2535]">
                {recent.map(s => {
                  const ch = chMap.get(s.channelSlug ?? "");
                  return <SignalCard key={s.id} s={s} chColor={ch?.color ?? "#e040fb"} canManage={true} token={session.token} onRefresh={onRefresh} />;
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Bot Status types ───────────────────────────────────────────────────────
interface BotStatusData {
  ok: boolean;
  bot: { active: boolean; uptime: string; startedAt: string; environment: string; activeChannels: number; totalChannels: number; };
  lastSignal: { id: number; asset: string; direction: string; entry: string; tp1: string; sl: string; status: string; leverage?: string | null; rr?: string | null; source?: string | null; createdAt: string; } | null;
  today: { date: string; signals: number; active: number; closed: number; wins: number; losses: number; winRate: number; pnlR: number; pnlFormatted: string; };
}

// ── Bot Status Widget ──────────────────────────────────────────────────────
function BotStatusWidget() {
  const [status, setStatus]   = useState<BotStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/bot-status`);
      if (r.ok) { setStatus(await r.json() as BotStatusData); setLastRefresh(new Date()); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 60_000);
    return () => clearInterval(i);
  }, [load]);

  const pnlPositive = (status?.today.pnlR ?? 0) >= 0;

  const StatRow = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-[#1a2535] last:border-0">
      <span className="font-space text-[11px] text-[#7ab3c8]">{label}</span>
      <span className="font-mono text-[13px] font-bold" style={{ color: color ?? "#fff" }}>{value}</span>
    </div>
  );

  return (
    <div className="max-w-[900px] mx-auto space-y-5">
      {/* Header banner */}
      <div className="border bg-[#060a0f] px-5 py-4 flex items-center justify-between"
        style={{ borderColor: status?.bot.active ? "#00e67633" : "#ff174433", background: status?.bot.active ? "linear-gradient(90deg,rgba(0,230,118,0.04),transparent)" : "linear-gradient(90deg,rgba(255,23,68,0.04),transparent)" }}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="text-4xl">🤖</div>
            {status?.bot.active && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#00e676] border-2 border-[#060a0f] animate-pulse" />}
          </div>
          <div>
            <div className="font-space text-[10px] tracking-[0.25em] uppercase" style={{ color: status?.bot.active ? "#00e676" : "#ff1744" }}>
              {loading ? "VERIFICANDO..." : status?.bot.active ? "🟢 BOT ACTIVO" : "🔴 BOT OFFLINE"}
            </div>
            <div className="font-bebas text-2xl text-white leading-none">PSYCHOMETRIKS BOT</div>
            {status && <div className="font-space text-[10px] text-[#7ab3c8] mt-0.5">Uptime: {status.bot.uptime} · {status.bot.environment.toUpperCase()}</div>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="font-space text-[9px] text-[#5a8898]">
            {lastRefresh && `Actualizado: ${lastRefresh.toLocaleTimeString("es-EC")}`}
          </div>
          <button onClick={load} disabled={loading}
            className="font-space text-[9px] px-3 py-1.5 border border-[#1a2535] text-[#7ab3c8] hover:border-[#00e5ff44] hover:text-[#00e5ff] transition-colors disabled:opacity-40">
            {loading ? "⏳" : "↺ REFRESH"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* PnL del Día */}
        <div className="border border-[#1a2535] bg-[#060a0f]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a2535]"
            style={{ background: `linear-gradient(90deg,${pnlPositive ? "rgba(0,230,118,0.05)" : "rgba(255,23,68,0.05)"},transparent)` }}>
            <span className="font-space text-[10px] tracking-[0.2em] uppercase" style={{ color: pnlPositive ? "#00e676" : "#ff1744" }}>
              {pnlPositive ? "📈" : "📉"} PNL DEL DÍA
            </span>
            {status && <span className="font-space text-[9px] text-[#7ab3c8]">{status.today.date}</span>}
          </div>
          <div className="p-5">
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[70, 50, 80].map((w, i) => <div key={i} className="h-4 bg-[#1a2535] rounded" style={{ width: `${w}%` }} />)}
              </div>
            ) : status ? (
              <>
                {/* Big PnL number */}
                <div className="text-center mb-4 py-4 border border-[#1a2535] bg-[#080d14]">
                  <div className="font-mono text-5xl font-black mb-1"
                    style={{ color: pnlPositive ? "#00e676" : "#ff1744", textShadow: `0 0 30px ${pnlPositive ? "#00e67680" : "#ff174480"}` }}>
                    {status.today.pnlFormatted}
                  </div>
                  <div className="font-space text-[10px] text-[#7ab3c8]">R-MULTIPLE DEL DÍA</div>
                </div>
                <StatRow label="Señales hoy"     value={status.today.signals} />
                <StatRow label="✅ Wins"          value={status.today.wins}    color="#00e676" />
                <StatRow label="❌ Losses"        value={status.today.losses}  color="#ff1744" />
                <StatRow label="⏳ Abiertas"      value={status.today.active}  color="#ffd700" />
                <StatRow label="🎯 Win Rate"
                  value={`${status.today.winRate}%`}
                  color={status.today.winRate >= 60 ? "#00e676" : status.today.winRate >= 40 ? "#ffd700" : "#ff1744"} />
              </>
            ) : (
              <div className="text-center py-8 font-space text-[11px] text-[#5a8898]">Sin datos disponibles</div>
            )}
          </div>
        </div>

        {/* Last signal + Infra */}
        <div className="space-y-5">
          {/* Last signal */}
          <div className="border border-[#1a2535] bg-[#060a0f]">
            <div className="px-4 py-3 border-b border-[#1a2535]">
              <span className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase">📡 ÚLTIMA SEÑAL EJECUTADA</span>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="animate-pulse space-y-2">{[60, 80, 50].map((w, i) => <div key={i} className="h-3 bg-[#1a2535] rounded" style={{ width: `${w}%` }} />)}</div>
              ) : status?.lastSignal ? (() => {
                const s = status.lastSignal;
                const isLong = s.direction === "LONG";
                const isActive = s.status === "ACTIVA";
                const ago = Math.round((Date.now() - new Date(s.createdAt).getTime()) / 60000);
                const agoStr = ago < 60 ? `${ago}m atrás` : ago < 1440 ? `${Math.floor(ago / 60)}h atrás` : `${Math.floor(ago / 1440)}d atrás`;
                return (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-bebas text-xl" style={{ color: isLong ? "#00e676" : "#ff1744" }}>{s.asset}</span>
                      <span className="font-space text-[9px] px-2 py-0.5 font-bold border"
                        style={{ background: isLong ? "#00e67620" : "#ff174420", color: isLong ? "#00e676" : "#ff1744", borderColor: isLong ? "#00e67644" : "#ff174444" }}>
                        {s.direction}
                      </span>
                      {s.leverage && <span className="font-space text-[9px] text-[#ffd700] border border-[#ffd70033] px-1.5">{s.leverage}</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      {[{ l: "ENTRADA", v: s.entry, c: "#fff" }, { l: "TP1", v: s.tp1, c: "#00e676" }, { l: "SL", v: s.sl, c: "#ff1744" }].map((f, i) => (
                        <div key={i} className="bg-[#080d14] border border-[#1a2535] p-2 text-center">
                          <div className="font-space text-[8px] text-[#5a8898] mb-1">{f.l}</div>
                          <div className="font-mono text-[11px] font-bold" style={{ color: f.c }}>{f.v}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-space text-[10px] px-2 py-0.5 border"
                        style={{ color: isActive ? "#00e676" : "#4a6070", borderColor: isActive ? "#00e67644" : "#1a2535" }}>
                        {s.status}
                      </span>
                      <span className="font-space text-[10px] text-[#5a8898]">{agoStr}</span>
                    </div>
                    {s.rr && <div className="mt-2 font-space text-[10px] text-[#ffd700]">R/R {s.rr}</div>}
                    {s.source && <div className="mt-1 font-space text-[9px] text-[#5a8898]">via {s.source}</div>}
                  </div>
                );
              })() : (
                <div className="text-center py-4 font-space text-[11px] text-[#5a8898]">Sin señales registradas</div>
              )}
            </div>
          </div>

          {/* Infrastructure */}
          <div className="border border-[#1a2535] bg-[#060a0f]">
            <div className="px-4 py-3 border-b border-[#1a2535]">
              <span className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase">⚙️ INFRAESTRUCTURA</span>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="animate-pulse space-y-2">{[70, 60].map((w, i) => <div key={i} className="h-3 bg-[#1a2535] rounded" style={{ width: `${w}%` }} />)}</div>
              ) : status ? (
                <>
                  <StatRow label="Estado API"       value={<span className="text-[#00e676]">🟢 ONLINE</span>} />
                  <StatRow label="Uptime"            value={status.bot.uptime}         color="#00e5ff" />
                  <StatRow label="Entorno"           value={status.bot.environment.toUpperCase()} color="#ffd700" />
                  <StatRow label="Canales activos"   value={`${status.bot.activeChannels} / ${status.bot.totalChannels}`} color="#e040fb" />
                  <StatRow label="Webhook Telegram"  value={<span className="text-[#00e676]">CONFIGURADO</span>} />
                  <StatRow label="DB"                value={<span className="text-[#00e676]">PostgreSQL ✓</span>} />
                  <div className="mt-3 pt-3 border-t border-[#1a2535]">
                    <div className="font-space text-[9px] text-[#5a8898]">
                      Servidor iniciado: {status.bot.startedAt ? new Date(status.bot.startedAt).toLocaleString("es-EC", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 font-space text-[11px] text-[#5a8898]">Sin datos de infraestructura</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Telegram command guide */}
      <div className="border border-[#1a2535] bg-[#060a0f]">
        <div className="px-4 py-3 border-b border-[#1a2535]">
          <span className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase">📱 COMANDOS TELEGRAM DISPONIBLES</span>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { cmd: "/bot-status",   desc: "Estado del bot, PnL del día y última señal ejecutada", badge: "ACTIVO", color: "#00e676" },
            { cmd: "/señales",      desc: "Lista las señales activas del día (próximamente)", badge: "PRONTO", color: "#ffd700" },
            { cmd: "/pnl-semana",   desc: "Resumen de PnL de la semana (próximamente)",          badge: "PRONTO", color: "#ffd700" },
            { cmd: "/pnl-mes",      desc: "Resumen de PnL del mes (próximamente)",               badge: "PRONTO", color: "#ffd700" },
          ].map(c => (
            <div key={c.cmd} className="flex items-start gap-3 p-3 border border-[#1a2535] bg-[#080d14]">
              <code className="font-mono text-[12px] text-[#00e5ff] shrink-0">{c.cmd}</code>
              <div className="flex-1 min-w-0">
                <div className="font-space text-[10px] text-[#7ab3c8] leading-relaxed">{c.desc}</div>
              </div>
              <span className="font-space text-[8px] px-1.5 py-0.5 border shrink-0"
                style={{ color: c.color, borderColor: `${c.color}44` }}>{c.badge}</span>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-[#1a2535] font-space text-[9px] text-[#5a8898]">
          Para activar los comandos: el bot de Telegram debe estar configurado con un webhook apuntando a tu dominio desplegado.
          Usá el endpoint <code className="text-[#00e5ff80]">GET /api/telegram/webhook-url</code> para obtener la URL del webhook.
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function SignalsRealtime() {
  const [, setLocation] = useLocation();
  const [session, setSession]     = useState<AuthSession | null>(null);
  const [now, setNow]             = useState(new Date());
  const [tickers, setTickers]     = useState<Map<string, Ticker>>(new Map());
  const [histories, setHistories] = useState<Map<string, number[]>>(new Map());
  const [signals, setSignals]     = useState<Signal[]>([]);
  const [channels, setChannels]   = useState<Channel[]>([]);
  const [ai, setAi]               = useState<AIAnalysis>({ text: "", ts: 0, loading: false });
  const [activeFilter, setActiveFilter] = useState<"TODOS"|"ACTIVA"|"LONG"|"SHORT">("TODOS");
  const [activeTab, setActiveTab] = useState<"signals"|"operator-mgmt"|"bot-status">("signals");
  const wsRef = useRef<WebSocket | null>(null);

  // Auth
  useEffect(() => {
    const s = getSession();
    if (!s) { setLocation("/login"); return; }
    setSession(s);
  }, [setLocation]);

  // Clock
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);

  // Binance WebSocket
  // Binance WebSocket
  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    const connect = () => {
      if (destroyed) return;
      const streams = WS_PAIRS.map(p => `${p.symbol.toLowerCase()}@ticker`).join("/");
      ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
      wsRef.current = ws;
      ws.onclose = () => { if (!destroyed) retryTimeout = setTimeout(connect, 5000); };
      ws.onerror = () => ws?.close();
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data) as { data: { s: string; c: string; P: string; h: string; l: string; v: string } };
          const d = msg.data;
          const pair = WS_PAIRS.find(p => p.symbol === d.s);
          if (!pair) return;
          const price = parseFloat(d.c); const change = parseFloat(d.P);
          setTickers(prev => { const next = new Map(prev); next.set(d.s, { symbol: d.s, label: pair.label, price, change, high: parseFloat(d.h), low: parseFloat(d.l), volume: parseFloat(d.v), icon: pair.icon, color: pair.color }); return next; });
          setHistories(prev => { const next = new Map(prev); next.set(d.s, [...(prev.get(d.s) ?? []), price].slice(-40)); return next; });
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

  // Load data
  const loadData = useCallback(async () => {
    try {
      const [sRes, cRes] = await Promise.all([fetch(`${API}/api/signals`), fetch(`${API}/api/channels`)]);
      if (sRes.ok) { const d = await sRes.json() as { signals: Signal[] }; setSignals(d.signals ?? []); }
      if (cRes.ok) { const d = await cRes.json() as { channels: Channel[] }; setChannels(d.channels ?? []); }
    } catch {}
  }, []);

  useEffect(() => {
    if (!session) return;
    loadData();
    const i = setInterval(loadData, 30_000);
    return () => clearInterval(i);
  }, [session, loadData]);

  // AI
  const runAI = useCallback(async () => {
    const btc = tickers.get("BTCUSDT"); const eth = tickers.get("ETHUSDT");
    if (!btc) return;
    setAi(prev => ({ ...prev, loading: true }));
    try {
      const r = await fetch(`${API}/api/psy-chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Dame un análisis rápido del mercado crypto ahora mismo. ¿Cuál es el sesgo institucional? ¿Hay zonas de interés clave? ¿Qué hay que vigilar?", marketContext: { btcPrice: btc.price, btcChange: btc.change, ethPrice: eth?.price, ethChange: eth?.change } }),
      });
      const data = await r.json() as { reply?: string; text?: string };
      setAi({ text: data.reply ?? data.text ?? "", ts: Date.now(), loading: false });
    } catch { setAi(prev => ({ ...prev, loading: false })); }
  }, [tickers]);

  useEffect(() => {
    const btc = tickers.get("BTCUSDT");
    if (btc && ai.ts === 0 && !ai.loading) runAI();
  }, [tickers, ai, runAI]);

  if (!session) return null;

  // ── OPERATOR-ONLY VIEW ─────────────────────────────────────────────────
  if (session.role === "operator") {
    return <OperatorView session={session} signals={signals} channels={channels} onRefresh={loadData} />;
  }

  // ── SUPERADMIN / USER VIEW ─────────────────────────────────────────────
  const isSuperadmin = session.role === "superadmin";
  const isMember = session.role === "member";
  const canManage = isSuperadmin;
  const canAccessChannels = isSuperadmin || isMember;

  const sessions = getTradingSession();
  const activeSession = sessions.find(s => s.active);

  const filteredSignals = signals.filter(s => {
    if (activeFilter === "ACTIVA") return s.status === "ACTIVA";
    if (activeFilter === "LONG")   return s.direction === "LONG";
    if (activeFilter === "SHORT")  return s.direction === "SHORT";
    return true;
  }).slice(0, 20);

  const chMap = new Map(channels.map(c => [c.slug, c]));

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      {/* ── HEADER ── */}
      <div className="pt-20 border-b border-[#1a2535] bg-[#020408]/95 sticky top-0 z-30 backdrop-blur-sm">
        <div className="px-4 md:px-8 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
                <span className="font-space text-[10px] text-[#00e676] tracking-[0.3em] uppercase">LIVE · SEÑALES EN TIEMPO REAL</span>
                {isSuperadmin && (
                  <span className="ml-1 font-space text-[9px] px-2 py-0.5 border border-[#ffd70033] text-[#ffd700]">👑 SUPERADMIN</span>
                )}
              </div>
              <div className="font-bebas text-2xl leading-none">
                PSY <span className="text-[#00e5ff]">TERMINAL</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {sessions.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: s.active ? s.color : "#2a4a5a", boxShadow: s.active ? `0 0 6px ${s.color}` : "none" }} />
                <span className="font-space text-[9px] tracking-[0.1em]" style={{ color: s.active ? s.color : "#2a4a5a" }}>{s.name}</span>
              </div>
            ))}
          </div>
          <div className="font-mono text-[14px] text-[#7ab3c8]">
            {now.toUTCString().slice(17, 25)} UTC
            {activeSession && <span className="ml-2 text-[10px]" style={{ color: activeSession.color }}>· {activeSession.name}</span>}
          </div>
        </div>

        {/* Admin tabs */}
        {isSuperadmin && (
          <div className="px-4 md:px-8 pb-0 flex border-t border-[#1a2535]">
            {[
              { id: "signals",       label: "📡 SEÑALES & MERCADO" },
              { id: "bot-status",    label: "🤖 BOT STATUS" },
              { id: "operator-mgmt", label: "🛡 OPERADORES" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className="font-space text-[9px] tracking-[0.15em] px-4 py-2.5 border-b-2 transition-all"
                style={{
                  borderBottomColor: activeTab === tab.id ? "#ffd700" : "transparent",
                  color: activeTab === tab.id ? "#ffd700" : "#4a6070",
                }}>
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 md:px-8 py-6 max-w-[1800px] mx-auto">

        {/* ── BOT STATUS TAB ── */}
        {isSuperadmin && activeTab === "bot-status" ? (
          <BotStatusWidget />
        ) : isSuperadmin && activeTab === "operator-mgmt" ? (
          <div className="max-w-[800px] mx-auto space-y-6">
            <div className="border border-[#ffd70022] bg-[#080d14] px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">👑</span>
              <div>
                <div className="font-space text-[10px] text-[#ffd700] tracking-[0.1em]">CONTROL TOTAL — SUPERADMIN</div>
                <div className="font-space text-[9px] text-[#7ab3c8]">
                  Solo vos podés crear, suspender o eliminar operadores de señales. Los operadores solo ven el panel de envío — nada más.
                </div>
              </div>
            </div>
            <OperatorManager token={session.token} />
          </div>
        ) : (
          <>
            {/* ── LIVE TICKER ── */}
            <div className="mb-6 overflow-x-auto">
              <div className="flex gap-px min-w-max bg-[#1a2535] border border-[#1a2535]">
                {WS_PAIRS.map(pair => {
                  const t = tickers.get(pair.symbol);
                  const hist = histories.get(pair.symbol) ?? [];
                  const up = (t?.change ?? 0) >= 0;
                  return (
                    <div key={pair.symbol} className="bg-[#060a0f] px-4 py-3 min-w-[140px] hover:bg-[#0d1520] transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span style={{ color: pair.color, fontSize: 14 }}>{pair.icon}</span>
                          <span className="font-space text-[10px] text-[#8a9ab0]">{pair.label.split("/")[0]}</span>
                        </div>
                        {hist.length > 1 && <Sparkline history={hist} color={up ? "#00e676" : "#ff1744"} />}
                      </div>
                      {t ? (
                        <>
                          <div className="font-mono text-[13px] font-bold text-white">
                            {t.price < 1 ? t.price.toFixed(5) : t.price < 100 ? t.price.toFixed(2) : t.price.toLocaleString("en", { maximumFractionDigits: 0 })}
                          </div>
                          <div className="font-mono text-[11px]" style={{ color: up ? "#00e676" : "#ff1744" }}>
                            {up ? "+" : ""}{t.change.toFixed(2)}%
                          </div>
                        </>
                      ) : (
                        <div className="font-mono text-[13px] text-[#5a8898] animate-pulse">—</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
              {/* LEFT */}
              <div className="space-y-6">
                {/* Superadmin Signal Sender */}
                {isSuperadmin && (
                  <SignalSender channels={channels} token={session.token} onSent={loadData} />
                )}

                {/* Heatmap */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.3em] uppercase">📊 Market Heatmap — 24h Change</div>
                    <div className="font-space text-[9px] text-[#5a8898]">via Binance WebSocket</div>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-px bg-[#1a2535] border border-[#1a2535]">
                    {WS_PAIRS.map(pair => {
                      const t = tickers.get(pair.symbol);
                      if (!t) return (
                        <div key={pair.symbol} className="bg-[#060a0f] p-3 min-h-[80px] flex items-center justify-center">
                          <span className="text-[#1a2535] font-space text-[10px]">{pair.label.split("/")[0]}</span>
                        </div>
                      );
                      return <HeatTile key={pair.symbol} t={t} />;
                    })}
                  </div>
                </div>

                {/* Signal feed */}
                <div>
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.3em] uppercase">
                      📡 Feed de Señales
                      <span className="ml-2 font-space text-[9px] text-[#5a8898]">{filteredSignals.length} señales</span>
                    </div>
                    <div className="flex gap-1">
                      {(["TODOS","ACTIVA","LONG","SHORT"] as const).map(f => (
                        <button key={f} onClick={() => setActiveFilter(f)}
                          className="font-space text-[9px] tracking-[0.1em] uppercase px-3 py-1.5 border transition-all"
                          style={{ borderColor: activeFilter === f ? "#00e5ff" : "#1a2535", color: activeFilter === f ? "#00e5ff" : "#4a6070", background: activeFilter === f ? "#00e5ff10" : "transparent" }}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {signals.length === 0 ? (
                    <div className="border border-[#1a2535] bg-[#060a0f] p-12 text-center">
                      <div className="font-space text-[12px] text-[#5a8898] mb-3">No hay señales publicadas todavía</div>
                      {isSuperadmin && <div className="font-space text-[10px] text-[#1a2535]">Usá el panel de arriba para publicar la primera señal</div>}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1a2535] border border-[#1a2535]">
                      {filteredSignals.map(s => {
                        const ch = chMap.get(s.channelSlug ?? "");
                        return <SignalCard key={s.id} s={s} chColor={ch?.color ?? "#00e5ff"} canManage={canManage} token={session.token} onRefresh={loadData} />;
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT */}
              <div className="space-y-5">
                {/* AI */}
                <div className="border border-[#00e5ff22] bg-[#060a0f]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a2535]">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e040fb] animate-pulse" />
                      <span className="font-space text-[10px] text-[#e040fb] tracking-[0.2em] uppercase">PSY IA — Análisis de mercado</span>
                    </div>
                    <button onClick={runAI} disabled={ai.loading}
                      className="font-space text-[9px] px-3 py-1.5 border border-[#00e5ff33] text-[#00e5ff] hover:bg-[#00e5ff10] transition-colors disabled:opacity-40">
                      {ai.loading ? "⏳ ANALIZANDO..." : "↺ ACTUALIZAR"}
                    </button>
                  </div>
                  <div className="p-4">
                    {ai.loading && (
                      <div className="space-y-2 animate-pulse">
                        {[80, 60, 75, 45].map((w, i) => (
                          <div key={i} className="h-3 bg-[#1a2535] rounded" style={{ width: `${w}%` }} />
                        ))}
                      </div>
                    )}
                    {!ai.loading && ai.text && (
                      <div className="font-space text-[12px] text-[#8a9ab0] leading-relaxed whitespace-pre-wrap">{ai.text}</div>
                    )}
                    {!ai.loading && !ai.text && (
                      <div className="text-center py-6">
                        <div className="font-space text-[11px] text-[#5a8898] mb-3">PSY IA lista para analizar</div>
                        <button onClick={runAI}
                          className="font-space text-[10px] px-4 py-2 border border-[#e040fb44] text-[#e040fb] hover:bg-[#e040fb10] transition-colors">
                          ▶ INICIAR ANÁLISIS
                        </button>
                      </div>
                    )}
                    {ai.ts > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#1a2535] font-space text-[9px] text-[#5a8898]">
                        Actualizado: {new Date(ai.ts).toLocaleTimeString("es-EC")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Channels */}
                <div className="bg-[#060a0f]" style={{ border: "1px solid #1a2535" }}>
                  <div className="px-4 py-3 border-b border-[#1a2535] flex items-center justify-between">
                    <span className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase">📡 Canales de Señales Telegram</span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00e676] animate-pulse" />
                  </div>

                  {!canAccessChannels ? (
                    /* ── LOCKED — not a paying member ── */
                    <div className="p-5 space-y-4">
                      {channels.map(ch => (
                        <div key={ch.id} className="border p-4 relative overflow-hidden" style={{ borderColor: `${ch.color}22` }}>
                          <div className="flex items-start gap-3 opacity-30 select-none pointer-events-none">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                              style={{ background: `${ch.color}22`, border: `1px solid ${ch.color}44` }}>
                              <span className="text-sm">✈️</span>
                            </div>
                            <div className="flex-1">
                              <div className="font-space text-[12px] font-bold text-white">{ch.name}</div>
                              <div className="font-space text-[9px] mt-1" style={{ color: ch.color }}>ACTIVO · SEÑALES EN VIVO</div>
                            </div>
                          </div>
                          <div className="mt-3 w-full py-2.5 text-center font-space text-[9px] border border-dashed border-[#1a2535] text-[#5a8898]">
                            🔒 EXCLUSIVO SUSCRIPTORES
                          </div>
                        </div>
                      ))}
                      <a href="/pricing" className="flex items-center justify-center gap-2 w-full py-3 font-space text-[10px] font-bold tracking-[0.2em] uppercase no-underline transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg,#ffd70020,#e040fb20)", border: "1px solid #ffd70044", color: "#ffd700" }}>
                        ⚡ VER PLANES Y SUSCRIBIRME
                      </a>
                    </div>
                  ) : (
                    /* ── UNLOCKED — paying member or superadmin ── */
                    <div className="p-4 space-y-3">
                      {isMember && (
                        <div className="flex items-center gap-2 px-3 py-2 mb-1" style={{ background: "#00e67608", border: "1px solid #00e67622" }}>
                          <span className="text-[#00e676] text-xs">✦</span>
                          <span className="font-space text-[9px] text-[#00e676] tracking-[0.1em]">
                            PLAN {(session.plan ?? "").toUpperCase()} — CANALES EXCLUSIVOS DESBLOQUEADOS
                          </span>
                        </div>
                      )}
                      {channels.length === 0 ? (
                        <div className="font-space text-[11px] text-[#5a8898] text-center py-4">No hay canales configurados</div>
                      ) : channels.map(ch => {
                        const joinUrl = ch.inviteLink || (ch.channelId?.startsWith("@") ? `https://t.me/${ch.channelId.replace("@","")}` : null);
                        return (
                          <div key={ch.id} className="border p-4 space-y-3" style={{ borderColor: `${ch.color}33`, background: `${ch.color}06` }}>
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                style={{ background: `${ch.color}22`, border: `1px solid ${ch.color}44` }}>
                                <span className="text-sm">✈️</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-space text-[12px] font-bold text-white leading-tight">{ch.name}</div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{ background: ch.active ? ch.color : "#2a4a5a", boxShadow: ch.active ? `0 0 5px ${ch.color}` : "none" }} />
                                  <span className="font-space text-[9px]" style={{ color: ch.active ? ch.color : "#2a4a5a" }}>
                                    {ch.active ? "ACTIVO · SEÑALES EN VIVO" : "INACTIVO"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {joinUrl ? (
                              <a href={joinUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-2.5 font-space text-[10px] font-bold tracking-[0.2em] uppercase no-underline transition-all hover:opacity-90"
                                style={{ background: `${ch.color}20`, border: `1px solid ${ch.color}66`, color: ch.color }}>
                                ✈️ UNIRME AL CANAL
                              </a>
                            ) : (
                              <div className="w-full py-2.5 text-center font-space text-[9px] text-[#5a8898] border border-[#1a2535]">
                                Link próximamente
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Market stats */}
                <div className="border border-[#1a2535] bg-[#060a0f]">
                  <div className="px-4 py-3 border-b border-[#1a2535]">
                    <span className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase">📈 Market Stats</span>
                  </div>
                  <div className="p-4 space-y-2">
                    {(() => {
                      const arr = Array.from(tickers.values());
                      const bullish = arr.filter(t => t.change > 0).length;
                      const bearish = arr.filter(t => t.change < 0).length;
                      const btc = tickers.get("BTCUSDT");
                      return (
                        <>
                          <div className="flex justify-between items-center py-1.5 border-b border-[#1a2535]">
                            <span className="font-space text-[11px] text-[#7ab3c8]">Alcistas</span>
                            <span className="font-mono text-[12px] text-[#00e676] font-bold">{bullish} / {WS_PAIRS.length}</span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 border-b border-[#1a2535]">
                            <span className="font-space text-[11px] text-[#7ab3c8]">Bajistas</span>
                            <span className="font-mono text-[12px] text-[#ff1744] font-bold">{bearish} / {WS_PAIRS.length}</span>
                          </div>
                          {btc && (
                            <>
                              <div className="flex justify-between items-center py-1.5 border-b border-[#1a2535]">
                                <span className="font-space text-[11px] text-[#7ab3c8]">BTC 24h High</span>
                                <span className="font-mono text-[12px] text-[#8a9ab0]">${btc.high.toLocaleString("en", { maximumFractionDigits: 0 })}</span>
                              </div>
                              <div className="flex justify-between items-center py-1.5">
                                <span className="font-space text-[11px] text-[#7ab3c8]">BTC 24h Low</span>
                                <span className="font-mono text-[12px] text-[#8a9ab0]">${btc.low.toLocaleString("en", { maximumFractionDigits: 0 })}</span>
                              </div>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Quick nav */}
                <div className="grid grid-cols-2 gap-px bg-[#1a2535] border border-[#1a2535]">
                  {[
                    { label: "LiqMap PRO", href: "/liquid-map.html", icon: "💧", color: "#00e5ff" },
                    { label: "Señales",    href: "/signals",          icon: "📡", color: "#ffd700" },
                    { label: "Dashboard",  href: "/dashboard",        icon: "🖥️", color: "#00e676" },
                    { label: "Planes",     href: "/pricing",          icon: "⚡", color: "#e040fb" },
                  ].map((q, i) => (
                    <Link key={i} href={q.href}
                      className="bg-[#060a0f] p-4 hover:bg-[#0d1520] transition-colors flex items-center gap-2 no-underline">
                      <span className="text-lg">{q.icon}</span>
                      <span className="font-space text-[10px] uppercase tracking-[0.1em]" style={{ color: q.color }}>{q.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
