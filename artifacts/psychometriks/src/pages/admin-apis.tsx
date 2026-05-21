import React, { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/site-nav";
import { getAuth } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApiKey {
  keyName: string; label: string; category: string; purpose: string;
  url: string; required: boolean; autoConfigured: boolean; note?: string;
  configured: boolean; source: "auto" | "env" | "db" | "none";
  maskedValue: string | null;
}

interface Channel {
  id: number; slug: string; name: string; description?: string;
  color: string; botToken: string; channelId: string; inviteLink?: string; active: boolean;
  createdAt?: string;
}

interface ChannelBot {
  id: number; channelId: number; label: string; botToken: string; active: boolean; createdAt?: string;
}

interface NewChannelForm {
  slug: string; name: string; description: string;
  color: string; botToken: string; channelId: string;
}

const BLANK_CHANNEL: NewChannelForm = {
  slug: "", name: "", description: "", color: "#00e5ff", botToken: "", channelId: "",
};

const PRESET_CHANNELS = [
  { slug: "alcoins", name: "PSYCHOMETRIKS_ALCOINS:SIGNALS", description: "Señales de altcoins", color: "#e040fb" },
  { slug: "btc-eth-sol", name: "PSYCHOMETRIKS-SIGNALS-BTC-ETH-SOL", description: "Señales BTC, ETH y SOL", color: "#00e5ff" },
  { slug: "pro", name: "PSYCHOMETRIKS PRO", description: "Canal premium — todos los activos", color: "#ffd700" },
];

const CATEGORIES = ["IA", "Notificaciones", "PSY Wallet", "Precios", "Seguridad"];
const CATEGORY_ICONS: Record<string, string> = { IA: "🤖", Notificaciones: "📡", "PSY Wallet": "💱", Precios: "📊", Seguridad: "🔒" };
const CATEGORY_COLORS: Record<string, string> = { IA: "#e040fb", Notificaciones: "#00e5ff", "PSY Wallet": "#00e676", Precios: "#ffd700", Seguridad: "#ff6d00" };

type Tab = "setup" | "apis" | "wallet" | "telegram" | "members" | "exchange" | "borrar" | "developer";

interface ExchangeSubmission {
  id: number; token_name: string; symbol: string; website: string;
  whitepaper: string | null; contract: string | null; chain: string;
  description: string | null; twitter: string | null; telegram: string | null;
  hard_cap: string | null; email: string; member_user: string | null;
  member_plan: string | null; score_boost: number; status: string;
  admin_notes: string | null; submitted_at: string;
}

// ─── Auth Gate ────────────────────────────────────────────────────────────────
function AuthGate({ onAuth }: { onAuth: () => void }) {
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const ADMIN_PASS = import.meta.env["VITE_ADMIN_GATE"] ?? "JORGE-ADMIN-2026";
  function attempt() {
    const auth = getAuth();
    if (auth?.role === "superadmin" || pass === ADMIN_PASS) { onAuth(); }
    else setErr("Contraseña incorrecta");
  }
  return (
    <div className="min-h-screen bg-[#020408] text-white flex flex-col">
      <SiteNav />
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="border border-[#1a2535] bg-[#060a0f] p-8 w-full max-w-sm">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-4">ACCESO RESTRINGIDO · SOLO ADMIN</div>
          <div className="font-bebas text-2xl text-white mb-6">🔒 PANEL DE CONFIGURACIÓN</div>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === "Enter" && attempt()}
            placeholder="Contraseña admin"
            className="w-full bg-[#0a0f18] border border-[#1a2535] px-4 py-3 font-space text-[12px] text-white placeholder-[#2a3a4a] focus:border-[#00e5ff44] focus:outline-none mb-3" />
          {err && <div className="font-space text-[11px] text-[#ff1744] mb-3">{err}</div>}
          <button onClick={attempt}
            className="w-full py-3 font-space text-[11px] font-bold tracking-[0.2em] uppercase bg-[#00e5ff] text-[#020408] hover:opacity-90 transition-opacity">
            ACCEDER →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminApis() {
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState<Tab>("setup");

  useEffect(() => {
    const raw = localStorage.getItem("psyko_auth");
    if (raw) {
      try {
        const { user, role } = JSON.parse(raw);
        if (user === "jorge-2026" || role === "superadmin") setAuthenticated(true);
      } catch { /* */ }
    }
  }, []);

  if (!authenticated) return <AuthGate onAuth={() => setAuthenticated(true)} />;

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />
      <div className="pt-28 pb-16 px-6 md:px-12 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-2">PANEL ADMIN · GESTIÓN DE INTEGRACIONES</div>
            <h1 className="font-bebas text-5xl md:text-6xl leading-none text-white">
              CENTRO DE <span className="text-[#00e5ff]">CONFIGURACIÓN</span>
            </h1>
          </div>
          <Link href="/dashboard" className="font-space text-[10px] tracking-[0.15em] text-[#7ab3c8] border border-[#1a2535] px-4 py-2 no-underline hover:text-[#00e5ff] hover:border-[#00e5ff44] transition-all">
            ← DASHBOARD
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1a2535] mb-8 overflow-x-auto">
          {([
            { id: "setup"    as Tab, label: "⚡ SETUP RÁPIDO",   desc: "Pegá todas tus keys de una vez" },
            { id: "apis"     as Tab, label: "🔑 API KEYS",       desc: "Estado individual de cada key" },
            { id: "wallet"   as Tab, label: "💱 PSY WALLET",     desc: "1inch · 6 servicios · Swap & Fee" },
            { id: "telegram" as Tab, label: "📡 TELEGRAM",       desc: "Bots y canales de señales" },
            { id: "members"  as Tab, label: "👥 MIEMBROS",       desc: "Suscriptores · planes · accesos" },
            { id: "exchange" as Tab, label: "🚀 EXCHANGE",       desc: "Submissions · aprobar tokens" },
            { id: "borrar"     as Tab, label: "🗑 BORRAR APIS",      desc: "Eliminar keys configuradas" },
            { id: "developer"  as Tab, label: "⚡ API DEVELOPER",   desc: "Keys $10/mes · gestión manual" },
          ]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-6 py-4 text-left transition-all border-b-2 shrink-0"
              style={{ borderColor: tab === t.id ? "#00e5ff" : "transparent", background: tab === t.id ? "rgba(0,229,255,0.04)" : "transparent" }}>
              <div className="font-sharetech text-[11px] tracking-[0.15em]" style={{ color: tab === t.id ? "#00e5ff" : "#4a6070" }}>{t.label}</div>
              <div className="font-space text-[10px] text-[#5a8898] mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>

        {tab === "setup"    && <SetupSection onDone={() => setTab("apis")} />}
        {tab === "apis"     && <ApiKeysSection />}
        {tab === "wallet"   && <WalletSection />}
        {tab === "telegram" && <TelegramSection />}
        {tab === "members"  && <MembersSection />}
        {tab === "exchange" && <ExchangeSection />}
        {tab === "borrar"   && <BorrarSection />}
        {tab === "developer" && <DeveloperKeysSection />}
      </div>
    </div>
  );
}

// ─── Exchange Submissions Section ────────────────────────────────────────────
const CHAIN_COLORS: Record<string, string> = {
  ethereum: "#627EEA", bsc: "#F0B90B", polygon: "#8247E5", arbitrum: "#28A0F0",
  optimism: "#FF0420", base: "#0052FF", avalanche: "#E84142", solana: "#9945FF",
  other: "#546e7a",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "#ffd700", approved: "#00e676", rejected: "#ff1744",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "⏳ PENDIENTE", approved: "✅ APROBADO", rejected: "❌ RECHAZADO",
};

function toProjectsJsonEntry(s: ExchangeSubmission): string {
  const entry = {
    id: s.symbol.toLowerCase(),
    name: s.token_name,
    symbol: s.symbol,
    chain: s.chain,
    contract: s.contract ?? "TBD",
    website: s.website,
    description: s.description ?? "",
    hardCap: s.hard_cap ?? "TBD",
    twitter: s.twitter ?? "",
    telegram: s.telegram ?? "",
    psyTrustScore: Math.min(100, 40 + (s.score_boost ?? 0)),
    status: "IDO",
    listed: new Date().toISOString().split("T")[0],
    verified: true,
  };
  return JSON.stringify(entry, null, 2);
}

function ExchangeSection() {
  const API = "https://hello-who-joremogollon.replit.app";

  const [items,   setItems]   = useState<ExchangeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [msg,  setMsg]  = useState<{ id: number; ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/exchange/submissions?status=${filter}`);
      const d = await r.json() as { items: ExchangeSubmission[] };
      setItems(d.items ?? []);
    } catch { setItems([]); } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  async function setStatus(id: number, status: "approved" | "rejected" | "pending") {
    setBusy(id);
    try {
      const r = await fetch(`${API}/api/exchange/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin_notes: notes[id] ?? null }),
      });
      const d = await r.json() as { ok?: boolean; error?: string };
      if (d.ok) {
        setMsg({ id, ok: true, text: status === "approved" ? "✅ Aprobado" : status === "rejected" ? "❌ Rechazado" : "↩ Pendiente" });
        await load();
      } else {
        setMsg({ id, ok: false, text: `Error: ${d.error ?? "desconocido"}` });
      }
    } catch {
      setMsg({ id, ok: false, text: "Error de conexión" });
    } finally {
      setBusy(null);
      setTimeout(() => setMsg(null), 3500);
    }
  }

  function copyJson(s: ExchangeSubmission) {
    navigator.clipboard.writeText(toProjectsJsonEntry(s)).then(() => {
      setCopied(s.id);
      setTimeout(() => setCopied(null), 2500);
    });
  }

  const pending  = items.filter(i => i.status === "pending").length;
  const approved = items.filter(i => i.status === "approved").length;
  const rejected = items.filter(i => i.status === "rejected").length;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="border border-[#00e67622] bg-[#040d08] p-6 mb-6">
        <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#2a4a3a] mb-2">PSY EXCHANGE · GESTIÓN DE LISTADOS</div>
        <div className="font-bebas text-4xl text-white mb-2">
          EXCHANGE <span className="text-[#00e676]">SUBMISSIONS</span>
        </div>
        <p className="font-space text-[11px] text-[#7a9aaa] mb-5">
          Proyectos que solicitaron listing en <span className="text-[#00e5ff]">/exchange</span>. Revisá, aprobá o rechazá cada solicitud.
          Los aprobados podés copiarlos como JSON para pegar en <code className="text-[#ffd700]">projects.json</code>.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "PENDIENTES", count: pending,  color: "#ffd700" },
            { label: "APROBADOS",  count: approved, color: "#00e676" },
            { label: "RECHAZADOS", count: rejected, color: "#ff1744" },
          ].map(s => (
            <div key={s.label} className="border p-4 text-center" style={{ borderColor: `${s.color}33`, background: `${s.color}08` }}>
              <div className="font-bebas text-3xl" style={{ color: s.color }}>{s.count}</div>
              <div className="font-sharetech text-[9px] tracking-[0.2em]" style={{ color: s.color }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-px mb-6">
        {(["all","pending","approved","rejected"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="flex-1 py-2.5 font-sharetech text-[10px] tracking-[0.15em] uppercase transition-all"
            style={{
              background: filter === f ? (f === "all" ? "#00e5ff15" : f === "pending" ? "#ffd70015" : f === "approved" ? "#00e67615" : "#ff174415") : "#0a0f18",
              color: filter === f ? (f === "all" ? "#00e5ff" : f === "pending" ? "#ffd700" : f === "approved" ? "#00e676" : "#ff1744") : "#4a6070",
              border: `1px solid ${filter === f ? (f === "all" ? "#00e5ff44" : f === "pending" ? "#ffd70044" : f === "approved" ? "#00e67644" : "#ff174444") : "#1a2535"}`,
            }}>
            {f === "all" ? "TODOS" : f === "pending" ? "⏳ PENDIENTES" : f === "approved" ? "✅ APROBADOS" : "❌ RECHAZADOS"}
          </button>
        ))}
      </div>

      {/* Refresh */}
      <div className="flex justify-end mb-4">
        <button onClick={() => void load()} disabled={loading}
          className="font-space text-[10px] tracking-[0.15em] px-4 py-2 border border-[#1a2535] text-[#7ab3c8] hover:text-[#00e5ff] hover:border-[#00e5ff44] transition-all">
          {loading ? "⏳ CARGANDO..." : "↻ ACTUALIZAR"}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="border border-[#1a2535] p-12 text-center">
          <div className="font-space text-[12px] text-[#5a8898]">Cargando submissions...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="border border-[#1a2535] bg-[#060a0f] p-12 text-center">
          <div className="font-bebas text-2xl text-[#5a8898] mb-2">SIN SUBMISSIONS</div>
          <p className="font-space text-[11px] text-[#2a3a4a]">
            Cuando proyectos completen el form en <span className="text-[#00e5ff]">/exchange</span>, aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(s => {
            const isExpanded = expanded === s.id;
            const chainColor = CHAIN_COLORS[s.chain?.toLowerCase() ?? ""] ?? CHAIN_COLORS["other"];
            const statusColor = STATUS_COLORS[s.status] ?? "#546e7a";

            return (
              <div key={s.id} className="border transition-all" style={{ borderColor: isExpanded ? `${statusColor}44` : "#1a2535", background: isExpanded ? `${statusColor}05` : "#060a0f" }}>
                {/* Header row */}
                <button className="w-full px-5 py-4 flex items-center gap-4 text-left" onClick={() => setExpanded(isExpanded ? null : s.id)}>
                  {/* Chain badge */}
                  <div className="font-sharetech text-[9px] tracking-[0.1em] px-2 py-1 shrink-0" style={{ color: chainColor, border: `1px solid ${chainColor}55`, background: `${chainColor}15` }}>
                    {s.chain?.toUpperCase() ?? "—"}
                  </div>
                  {/* Token info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bebas text-xl text-white">{s.token_name}</span>
                      <span className="font-sharetech text-[10px] text-[#00e5ff]">${s.symbol}</span>
                      {s.hard_cap && <span className="font-space text-[10px] text-[#7a9aaa]">HC: {s.hard_cap}</span>}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap mt-0.5">
                      <span className="font-space text-[10px] text-[#7ab3c8]">{s.email}</span>
                      {s.member_user && <span className="font-space text-[10px] text-[#5a8898]">usuario: {s.member_user}</span>}
                      <span className="font-space text-[10px] text-[#5a8898]">{new Date(s.submitted_at).toLocaleDateString("es-AR")}</span>
                    </div>
                  </div>
                  {/* Status */}
                  <div className="font-sharetech text-[9px] tracking-[0.1em] px-3 py-1.5 shrink-0" style={{ color: statusColor, border: `1px solid ${statusColor}44`, background: `${statusColor}15` }}>
                    {STATUS_LABELS[s.status] ?? s.status}
                  </div>
                  <span className="text-[#5a8898] text-[10px] shrink-0">{isExpanded ? "▲" : "▼"}</span>
                </button>

                {/* Feedback flash */}
                {msg?.id === s.id && (
                  <div className="mx-5 mb-3 px-4 py-2 font-space text-[11px]" style={{ color: msg.ok ? "#00e676" : "#ff1744", background: msg.ok ? "#00e67615" : "#ff174415", border: `1px solid ${msg.ok ? "#00e67633" : "#ff174433"}` }}>
                    {msg.text}
                  </div>
                )}

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-[#1a2535] pt-5">
                    {/* Fields grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                      {[
                        { label: "WEBSITE",     val: s.website,    link: true },
                        { label: "WHITEPAPER",  val: s.whitepaper, link: true },
                        { label: "CONTRATO",    val: s.contract,   mono: true },
                        { label: "TWITTER",     val: s.twitter,    link: true },
                        { label: "TELEGRAM",    val: s.telegram,   link: true },
                        { label: "HARD CAP",    val: s.hard_cap },
                        { label: "PLAN MEMBER", val: s.member_plan },
                        { label: "SCORE BOOST", val: s.score_boost ? `+${s.score_boost} pts` : "0" },
                      ].map(f => f.val && (
                        <div key={f.label}>
                          <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#5a8898] mb-1">{f.label}</div>
                          {f.link ? (
                            <a href={String(f.val)} target="_blank" rel="noreferrer"
                              className="font-space text-[11px] text-[#00e5ff] underline break-all">
                              {String(f.val)}
                            </a>
                          ) : (
                            <div className={`font-space text-[11px] text-white break-all ${f.mono ? "font-mono text-[10px]" : ""}`}>
                              {String(f.val)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Description */}
                    {s.description && (
                      <div className="mb-5">
                        <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#5a8898] mb-2">DESCRIPCIÓN</div>
                        <p className="font-space text-[11px] text-[#7a9aaa] leading-relaxed border border-[#1a2535] p-3">{s.description}</p>
                      </div>
                    )}

                    {/* Admin notes */}
                    <div className="mb-5">
                      <label className="font-sharetech text-[8px] tracking-[0.2em] text-[#5a8898] block mb-2">NOTAS INTERNAS (admin)</label>
                      <textarea
                        value={notes[s.id] ?? s.admin_notes ?? ""}
                        onChange={e => setNotes(p => ({ ...p, [s.id]: e.target.value }))}
                        rows={2}
                        placeholder="Due diligence, observaciones, razón de rechazo..."
                        className="w-full bg-[#0a0f18] border border-[#1a2535] px-3 py-2 font-space text-[11px] text-white placeholder-[#2a3a4a] focus:border-[#ffd70044] focus:outline-none resize-none"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                      {s.status !== "approved" && (
                        <button onClick={() => void setStatus(s.id, "approved")} disabled={busy === s.id}
                          className="px-5 py-2.5 font-space text-[11px] font-bold tracking-[0.15em] uppercase transition-all"
                          style={{ background: busy === s.id ? "#1a2535" : "#00e676", color: busy === s.id ? "#4a6070" : "#020408" }}>
                          {busy === s.id ? "..." : "✅ APROBAR"}
                        </button>
                      )}
                      {s.status !== "rejected" && (
                        <button onClick={() => void setStatus(s.id, "rejected")} disabled={busy === s.id}
                          className="px-5 py-2.5 font-space text-[11px] font-bold tracking-[0.15em] uppercase transition-all"
                          style={{ background: busy === s.id ? "#1a2535" : "#ff174422", color: busy === s.id ? "#4a6070" : "#ff1744", border: "1px solid #ff174444" }}>
                          {busy === s.id ? "..." : "❌ RECHAZAR"}
                        </button>
                      )}
                      {s.status !== "pending" && (
                        <button onClick={() => void setStatus(s.id, "pending")} disabled={busy === s.id}
                          className="px-4 py-2.5 font-space text-[10px] tracking-[0.1em] border border-[#1a2535] text-[#7ab3c8] hover:text-[#ffd700] hover:border-[#ffd70044] transition-all uppercase">
                          ↩ Volver a pendiente
                        </button>
                      )}
                      <div className="flex-1" />
                      <button onClick={() => copyJson(s)}
                        className="px-4 py-2.5 font-space text-[10px] tracking-[0.1em] border transition-all uppercase"
                        style={{ borderColor: copied === s.id ? "#ffd70044" : "#1a2535", color: copied === s.id ? "#ffd700" : "#4a6070" }}>
                        {copied === s.id ? "✓ COPIADO" : "📋 COPIAR JSON"}
                      </button>
                    </div>

                    {/* JSON preview */}
                    {s.status === "approved" && (
                      <div className="mt-5 border border-[#00e67622] bg-[#040d08] p-4">
                        <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#2a4a3a] mb-2">
                          ENTRADA PARA projects.json — pegá esto en <code className="text-[#ffd700]">artifacts/psychometriks/public/projects.json</code>
                        </div>
                        <pre className="font-mono text-[10px] text-[#00e676] overflow-x-auto whitespace-pre-wrap break-all">
                          {toProjectsJsonEntry(s)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Help footer */}
      <div className="border border-[#1a2535] bg-[#060a0f] p-5 mt-8">
        <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-3">📖 FLUJO COMPLETO — CÓMO LISTAR UN TOKEN REAL</div>
        <div className="space-y-2">
          {[
            { n: "1", t: "El proyecto llena el form en /exchange → se guarda en Railway DB automáticamente." },
            { n: "2", t: "Aparece aquí con status PENDIENTE. Revisás website, whitepaper, contrato, equipo." },
            { n: "3", t: "Si pasa el due diligence → APROBAR. Se genera el JSON automáticamente." },
            { n: "4", t: "Copiás el JSON y lo pegás en artifacts/psychometriks/public/projects.json." },
            { n: "5", t: "Hacés build + deploy en Netlify → el token aparece en /exchange con Trust Score real." },
            { n: "6", t: "Para comisión de swaps: configurá PSY_FEE_WALLET en tab PSY WALLET con tu dirección ETH real." },
          ].map(s => (
            <div key={s.n} className="flex gap-3">
              <span className="font-bebas text-[#00e5ff] text-lg leading-none">{s.n}</span>
              <span className="font-space text-[11px] text-[#7a9aaa]">{s.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Borrar APIs Section ──────────────────────────────────────────────────────
const BORRAR_KEYS = [
  { keyName: "ONEINCH_API_KEY",   label: "1inch API Key",      icon: "⇄", category: "PSY Wallet",  color: "#00e676" },
  { keyName: "ETHERSCAN_API_KEY", label: "Etherscan API Key",  icon: "🔍", category: "PSY Wallet",  color: "#00e676" },
  { keyName: "PSY_FEE_WALLET",    label: "Wallet de Fees PSY", icon: "💎", category: "PSY Wallet",  color: "#00e676" },
  { keyName: "GEMINI_API_KEY",    label: "Gemini API Key",     icon: "🤖", category: "IA",          color: "#e040fb" },
];

function BorrarSection() {
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [statuses, setStatuses] = useState<Record<string, { configured: boolean; source: string; maskedValue: string | null }>>({});
  const [loading, setLoading]   = useState(true);
  const [confirm, setConfirm]   = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [msgs, setMsgs]         = useState<Record<string, { ok: boolean; text: string }>>({});

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/api/admin/config`);
      const data = await res.json() as { keys: ApiKey[] };
      const map: Record<string, { configured: boolean; source: string; maskedValue: string | null }> = {};
      for (const k of data.keys ?? []) map[k.keyName] = { configured: k.configured, source: k.source, maskedValue: k.maskedValue };
      setStatuses(map);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [BASE]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function doDelete(keyName: string) {
    setDeleting(keyName);
    setConfirm(null);
    try {
      const res  = await fetch(`${BASE}/api/admin/config/${keyName}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "X-PSY-Token": getAuth()?.token ?? "" },
        body: JSON.stringify({ adminPassword: "JORGE-ADMIN-2026" }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.success) {
        setMsgs(p => ({ ...p, [keyName]: { ok: true, text: "✅ Eliminada correctamente" } }));
        await fetchStatus();
      } else {
        setMsgs(p => ({ ...p, [keyName]: { ok: false, text: `❌ ${data.error ?? "Error"}` } }));
      }
    } catch {
      setMsgs(p => ({ ...p, [keyName]: { ok: false, text: "❌ Error de conexión" } }));
    } finally {
      setDeleting(null);
      setTimeout(() => setMsgs(p => { const n = { ...p }; delete n[keyName]; return n; }), 4000);
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="border border-[#ff174422] bg-[#0d0508] p-6 mb-8">
        <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#4a2535] mb-2">GESTIÓN DE KEYS — ELIMINAR</div>
        <div className="font-bebas text-4xl text-white mb-3">
          BORRAR <span className="text-[#ff1744]">API KEYS</span>
        </div>
        <div className="font-space text-[11px] text-[#6a7080] leading-relaxed">
          Eliminá únicamente las keys guardadas en base de datos. Las keys de entorno del sistema no pueden borrarse desde acá.
          Hacé click en <strong className="text-[#ff6d00]">ELIMINAR</strong> y confirmá para borrar.
        </div>
      </div>

      {/* Keys list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-[#060a0f] border border-[#1a2535] animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {BORRAR_KEYS.map(k => {
            const st = statuses[k.keyName];
            const isDB       = st?.source === "db";
            const isEnv      = st?.source === "env";
            const configured = st?.configured ?? false;
            const isConfirm  = confirm === k.keyName;
            const isDel      = deleting === k.keyName;
            const msg        = msgs[k.keyName];

            return (
              <div key={k.keyName} className="border border-[#1a2535] bg-[#060a0f] overflow-hidden">
                <div className="h-0.5" style={{ background: configured ? k.color : "#1a2535" }} />
                <div className="p-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0">{k.icon}</span>
                      <div className="min-w-0">
                        <div className="font-space text-[13px] font-bold text-white">{k.label}</div>
                        <div className="font-sharetech text-[9px] text-[#5a8898] tracking-[0.05em]">{k.keyName}</div>
                        {st?.maskedValue && (
                          <div className="font-sharetech text-[10px] text-[#7ab3c8] mt-0.5">{st.maskedValue}</div>
                        )}
                      </div>
                    </div>

                    {/* Right side: status + action */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {/* Status badge */}
                      <span className="font-sharetech text-[10px] px-3 py-1 border tracking-[0.1em]"
                        style={configured
                          ? isDB  ? { color: "#ff6d00", borderColor: "#ff6d0044", background: "#ff6d000a" }
                                  : { color: "#4a6070",  borderColor: "#1a2535",   background: "transparent" }
                          : { color: "#2a3a4a", borderColor: "#1a2535", background: "transparent" }}>
                        {configured
                          ? isDB  ? "● DB"
                          : isEnv ? "ENV · sistema"
                          : "● ACTIVA"
                          : "○ NO CONFIGURADA"}
                      </span>

                      {/* Delete button — only for DB keys */}
                      {isDB && !isConfirm && (
                        <button
                          onClick={() => setConfirm(k.keyName)}
                          disabled={isDel}
                          className="font-space text-[11px] font-bold px-4 py-2 border border-[#ff174444] text-[#ff1744] bg-[#ff17440a] hover:bg-[#ff174422] hover:border-[#ff174466] transition-all tracking-[0.1em] uppercase">
                          🗑 ELIMINAR
                        </button>
                      )}

                      {/* Env key — not deletable */}
                      {isEnv && (
                        <span className="font-space text-[10px] text-[#5a8898] italic">
                          Secreto del sistema — no borrable
                        </span>
                      )}

                      {/* Not configured — nothing to delete */}
                      {!configured && (
                        <span className="font-space text-[10px] text-[#5a8898]">Sin valor guardado</span>
                      )}
                    </div>
                  </div>

                  {/* Confirm step */}
                  {isConfirm && (
                    <div className="mt-4 pt-4 border-t border-[#ff174422] flex items-center gap-3 flex-wrap">
                      <span className="font-space text-[12px] text-[#ff6d00]">
                        ⚠ ¿Confirmar borrado de <strong className="text-white">{k.keyName}</strong>?
                      </span>
                      <button
                        onClick={() => doDelete(k.keyName)}
                        className="font-space text-[11px] font-bold px-4 py-2 bg-[#ff1744] text-white hover:opacity-90 transition-opacity tracking-[0.1em] uppercase">
                        SÍ, BORRAR
                      </button>
                      <button
                        onClick={() => setConfirm(null)}
                        className="font-space text-[11px] px-4 py-2 border border-[#1a2535] text-[#7ab3c8] hover:text-white transition-colors tracking-[0.1em] uppercase">
                        CANCELAR
                      </button>
                    </div>
                  )}

                  {/* Deleting spinner */}
                  {isDel && (
                    <div className="mt-3 font-space text-[11px] text-[#ffd700]">⏳ Eliminando...</div>
                  )}

                  {/* Result msg */}
                  {msg && (
                    <div className="mt-3 font-space text-[12px]" style={{ color: msg.ok ? "#00e676" : "#ff1744" }}>
                      {msg.text}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Warning */}
      <div className="mt-8 border border-[#ff174422] bg-[#0d0508] p-5">
        <div className="font-space text-[10px] text-[#ff6d00] mb-1">⚠️ NOTA</div>
        <div className="font-space text-[11px] text-[#5a4040] leading-relaxed">
          Al eliminar una key, la función asociada dejará de funcionar hasta que configures una nueva desde <strong className="text-[#7ab3c8]">⚡ SETUP RÁPIDO</strong>.
          Las keys marcadas como "ENV · sistema" están protegidas y no se borran desde este panel.
        </div>
      </div>
    </div>
  );
}

// ─── Setup Rápido Section ─────────────────────────────────────────────────────
const SETUP_FIELDS = [
  // 🔥 CRÍTICAS primero
  {
    keyName: "ONEINCH_API_KEY",
    label: "1inch API Key",
    icon: "⇄",
    badge: "🔥 CRÍTICA",
    badgeColor: "#ff1744",
    placeholder: "Ej: a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    hint: "portal.1inch.dev → Developer Portal → Create App → copiar API Key",
    url: "https://portal.1inch.dev/",
    isPassword: true,
    group: "PSY WALLET",
    groupColor: "#00e676",
  },
  {
    keyName: "PSY_FEE_WALLET",
    label: "Wallet de Fees PSY (0.5%)",
    icon: "💎",
    badge: "🔥 CRÍTICA",
    badgeColor: "#ff1744",
    placeholder: "0xTuDirecciónEthereum...",
    hint: "Dirección ETH donde se acumulan los fees de cada swap",
    url: "",
    isPassword: false,
    group: "PSY WALLET",
    groupColor: "#00e676",
  },
  {
    keyName: "GEMINI_API_KEY",
    label: "Gemini API Key",
    icon: "🤖",
    badge: "⚡ REQUERIDA",
    badgeColor: "#ffd700",
    placeholder: "AIzaSy...",
    hint: "aistudio.google.com/app/apikey → Crear clave API",
    url: "https://aistudio.google.com/app/apikey",
    isPassword: true,
    group: "INTELIGENCIA ARTIFICIAL",
    groupColor: "#e040fb",
  },
  {
    keyName: "ANTHROPIC",
    label: "Claude API Key (Anthropic)",
    icon: "🧬",
    badge: "⚡ REQUERIDA",
    badgeColor: "#ffd700",
    placeholder: "sk-ant-api03-...",
    hint: "console.anthropic.com → API Keys → Create Key",
    url: "https://console.anthropic.com/",
    isPassword: true,
    group: "INTELIGENCIA ARTIFICIAL",
    groupColor: "#e040fb",
  },
  {
    keyName: "TELEGRAM_BOT_TOKEN",
    label: "Telegram Bot Token",
    icon: "📡",
    badge: "⚡ REQUERIDA",
    badgeColor: "#ffd700",
    placeholder: "1234567890:ABCdef...",
    hint: "@BotFather → /mybots → tu bot → API Token",
    url: "https://t.me/BotFather",
    isPassword: true,
    group: "TELEGRAM",
    groupColor: "#00e5ff",
  },
  {
    keyName: "TELEGRAM_CHANNEL_ID",
    label: "Telegram Channel ID (principal)",
    icon: "📺",
    badge: "⚡ REQUERIDA",
    badgeColor: "#ffd700",
    placeholder: "-1001234567890 o @psychometriks_pro",
    hint: "Reenvía un mensaje del canal a @userinfobot para obtener el ID",
    url: "https://t.me/userinfobot",
    isPassword: false,
    group: "TELEGRAM",
    groupColor: "#00e5ff",
  },
  // OPCIONALES
  {
    keyName: "NVIDIA_API_KEY",
    label: "NVIDIA API Key",
    icon: "🧠",
    badge: "OPCIONAL",
    badgeColor: "#4a6070",
    placeholder: "nvapi-...",
    hint: "build.nvidia.com → Modelos de IA avanzados NIM",
    url: "https://build.nvidia.com/",
    isPassword: true,
    group: "INTELIGENCIA ARTIFICIAL",
    groupColor: "#e040fb",
  },
  {
    keyName: "ETHERSCAN_API_KEY",
    label: "Etherscan API Key",
    icon: "🔍",
    badge: "OPCIONAL",
    badgeColor: "#4a6070",
    placeholder: "YourApiKeyToken",
    hint: "etherscan.io/myapikey → Historial on-chain Ethereum",
    url: "https://etherscan.io/myapikey",
    isPassword: true,
    group: "PSY WALLET",
    groupColor: "#00e676",
  },
] as const;

type SetupFieldKey = typeof SETUP_FIELDS[number]["keyName"];

function SetupSection({ onDone }: { onDone: () => void }) {
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  // One state entry per field
  const [values, setValues] = useState<Partial<Record<SetupFieldKey, string>>>({});
  const [configured, setConfigured] = useState<Partial<Record<SetupFieldKey, boolean>>>({});
  const [masked, setMasked] = useState<Partial<Record<SetupFieldKey, string>>>({});
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<{ key: string; ok: boolean; msg: string }[]>([]);
  const [done, setDone] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [showValues, setShowValues] = useState<Partial<Record<SetupFieldKey, boolean>>>({});

  // Load current config status
  useEffect(() => {
    fetch(`${BASE}/api/admin/config`)
      .then(r => r.json())
      .then((d: unknown) => {
        const keys = (d as { keys?: Array<{ keyName: string; configured: boolean; maskedValue: string | null }> }).keys ?? [];
        const cfgMap: Partial<Record<SetupFieldKey, boolean>> = {};
        const maskMap: Partial<Record<SetupFieldKey, string>> = {};
        for (const k of keys) {
          cfgMap[k.keyName as SetupFieldKey] = k.configured;
          if (k.maskedValue) maskMap[k.keyName as SetupFieldKey] = k.maskedValue;
        }
        setConfigured(cfgMap);
        setMasked(maskMap);
      })
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  }, [BASE]);

  function set(keyName: SetupFieldKey, v: string) {
    setValues(p => ({ ...p, [keyName]: v }));
  }

  function toggleShow(keyName: SetupFieldKey) {
    setShowValues(p => ({ ...p, [keyName]: !p[keyName] }));
  }

  // Count how many have values entered
  const filledCount = SETUP_FIELDS.filter(f => values[f.keyName]?.trim()).length;
  const configuredCount = SETUP_FIELDS.filter(f => configured[f.keyName]).length;

  async function saveAll() {
    const toSave = SETUP_FIELDS.filter(f => values[f.keyName]?.trim());
    if (!toSave.length) return;

    setSaving(true);
    setResults([]);
    setDone(false);

    const res = await Promise.all(
      toSave.map(async (f) => {
        try {
          const r = await fetch(`${BASE}/api/admin/config`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-PSY-Token": getAuth()?.token ?? "" },
            body: JSON.stringify({
              keyName: f.keyName,
              keyValue: values[f.keyName]!.trim(),
              adminPassword: "JORGE-ADMIN-2026",
            }),
          });
          const data = await r.json() as { success?: boolean; error?: string };
          return { key: f.label, ok: !!data.success, msg: data.success ? "Guardada" : (data.error ?? "Error") };
        } catch {
          return { key: f.label, ok: false, msg: "Error de conexión" };
        }
      })
    );

    setResults(res);
    setSaving(false);

    // Refresh configured status
    fetch(`${BASE}/api/admin/config`)
      .then(r => r.json())
      .then((d: unknown) => {
        const keys = (d as { keys?: Array<{ keyName: string; configured: boolean; maskedValue: string | null }> }).keys ?? [];
        const cfgMap: Partial<Record<SetupFieldKey, boolean>> = {};
        const maskMap: Partial<Record<SetupFieldKey, string>> = {};
        for (const k of keys) {
          cfgMap[k.keyName as SetupFieldKey] = k.configured;
          if (k.maskedValue) maskMap[k.keyName as SetupFieldKey] = k.maskedValue;
        }
        setConfigured(cfgMap);
        setMasked(maskMap);
      })
      .catch(() => {});

    const allOk = res.every(r => r.ok);
    if (allOk) {
      setValues({});
      setDone(true);
    }
  }

  // Group fields
  const groups = Array.from(new Set(SETUP_FIELDS.map(f => f.group)));

  return (
    <div className="max-w-3xl">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="border border-[#1a2535] bg-[#060a0f] p-6 mb-8">
        <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-2">SETUP RÁPIDO — PSYCHOMETRIKS</div>
        <div className="font-bebas text-4xl text-white mb-3">
          PEGÁ TODAS TUS KEYS <span className="text-[#00e5ff]">DE UNA VEZ</span>
        </div>
        <div className="font-space text-[11px] text-[#7ab3c8] leading-relaxed mb-5">
          Completá los campos que tenés disponibles y hacé click en <strong className="text-[#00e5ff]">GUARDAR TODO</strong>.
          Los campos vacíos se ignoran — podés volver y agregar más después. Las keys se guardan cifradas en PostgreSQL.
        </div>

        {/* Progress bar */}
        {!loadingStatus && (
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="font-sharetech text-[9px] text-[#5a8898] tracking-[0.2em]">KEYS CONFIGURADAS</span>
              <span className="font-sharetech text-[11px]" style={{ color: configuredCount === SETUP_FIELDS.length ? "#00e676" : configuredCount >= 3 ? "#ffd700" : "#ff6d00" }}>
                {configuredCount} / {SETUP_FIELDS.length}
              </span>
            </div>
            <div className="h-1.5 bg-[#0a0f18] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(configuredCount / SETUP_FIELDS.length) * 100}%`,
                  background: configuredCount === SETUP_FIELDS.length ? "#00e676" : configuredCount >= 3 ? "#ffd700" : "#ff6d00",
                }} />
            </div>
            <div className="flex gap-4 mt-2">
              {[
                { label: "Configuradas", count: configuredCount, color: "#00e676" },
                { label: "Con valor nuevo", count: filledCount, color: "#00e5ff" },
                { label: "Pendientes", count: SETUP_FIELDS.filter(f => !configured[f.keyName] && !values[f.keyName]?.trim()).length, color: "#ff6d00" },
              ].map(s => (
                <span key={s.label} className="flex items-center gap-1.5 font-space text-[10px] text-[#7ab3c8]">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  {s.label}: <span style={{ color: s.color }}>{s.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Save result banner ───────────────────────────────────────────────── */}
      {results.length > 0 && (
        <div className="mb-6 border p-5 space-y-2"
          style={{ borderColor: results.every(r => r.ok) ? "#00e67633" : "#ffd70033", background: results.every(r => r.ok) ? "#00e67608" : "#ffd70008" }}>
          <div className="font-sharetech text-[10px] tracking-[0.2em] mb-3"
            style={{ color: results.every(r => r.ok) ? "#00e676" : "#ffd700" }}>
            {results.every(r => r.ok) ? "✅ TODAS LAS KEYS GUARDADAS" : "⚠ RESULTADO PARCIAL"}
          </div>
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <span style={{ color: r.ok ? "#00e676" : "#ff1744" }}>{r.ok ? "✓" : "✗"}</span>
              <span className="font-space text-[11px] text-white">{r.key}</span>
              <span className="font-space text-[10px]" style={{ color: r.ok ? "#00e676" : "#ff1744" }}>{r.msg}</span>
            </div>
          ))}
          {done && (
            <button onClick={onDone} className="mt-3 font-space text-[11px] font-bold tracking-[0.1em] uppercase px-5 py-2.5 bg-[#00e5ff] text-[#020408] hover:opacity-90 transition-opacity">
              VER ESTADO DETALLADO →
            </button>
          )}
        </div>
      )}

      {/* ── Fields grouped ───────────────────────────────────────────────────── */}
      <div className="space-y-8">
        {groups.map(group => {
          const groupFields = SETUP_FIELDS.filter(f => f.group === group);
          const groupColor = groupFields[0].groupColor;
          const groupConfigured = groupFields.filter(f => configured[f.keyName]).length;
          return (
            <div key={group}>
              {/* Group header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-[#1a2535]" />
                <span className="font-sharetech text-[9px] tracking-[0.3em] px-3 py-1 border"
                  style={{ color: groupColor, borderColor: `${groupColor}44`, background: `${groupColor}0a` }}>
                  {group}
                </span>
                <span className="font-sharetech text-[9px] text-[#5a8898]">
                  {groupConfigured}/{groupFields.length} configuradas
                </span>
                <div className="h-px flex-1 bg-[#1a2535]" />
              </div>

              {/* Fields */}
              <div className="space-y-4">
                {groupFields.map(field => {
                  const isCfg = configured[field.keyName];
                  const val = values[field.keyName] ?? "";
                  const isVisible = showValues[field.keyName];
                  const hasMasked = masked[field.keyName];
                  const hasNewValue = val.trim().length > 0;

                  return (
                    <div key={field.keyName} className="border border-[#1a2535] bg-[#060a0f] overflow-hidden">
                      {/* Top bar: configured = group color, else dim */}
                      <div className="h-0.5" style={{ background: hasNewValue ? "#00e5ff" : isCfg ? groupColor : "#1a2535" }} />

                      <div className="p-5">
                        {/* Label row */}
                        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{field.icon}</span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-space text-[13px] font-bold text-white">{field.label}</span>
                                <span className="font-sharetech text-[8px] px-2 py-0.5 border tracking-[0.15em]"
                                  style={{ color: field.badgeColor, borderColor: `${field.badgeColor}44`, background: `${field.badgeColor}0f` }}>
                                  {field.badge}
                                </span>
                              </div>
                              <div className="font-sharetech text-[9px] text-[#5a8898] tracking-[0.05em] mt-0.5">{field.keyName}</div>
                            </div>
                          </div>
                          {/* Status */}
                          <div className="flex items-center gap-2 shrink-0">
                            {hasMasked && !hasNewValue && (
                              <span className="font-sharetech text-[10px] text-[#7ab3c8] border border-[#1a2535] px-2 py-1">{hasMasked}</span>
                            )}
                            <span className="font-sharetech text-[10px] px-3 py-1 border tracking-[0.1em]"
                              style={hasNewValue
                                ? { color: "#00e5ff", borderColor: "#00e5ff33", background: "#00e5ff0a" }
                                : isCfg
                                ? { color: "#00e676", borderColor: "#00e67633", background: "#00e6760a" }
                                : { color: "#ff6d00", borderColor: "#ff6d0033", background: "#ff6d000a" }}>
                              {hasNewValue ? "✏ NUEVO VALOR" : isCfg ? "● CONFIGURADA" : "○ PENDIENTE"}
                            </span>
                          </div>
                        </div>

                        {/* Input */}
                        <div className="flex gap-2">
                          <input
                            type={field.isPassword && !isVisible ? "password" : "text"}
                            value={val}
                            onChange={e => set(field.keyName, e.target.value)}
                            placeholder={isCfg && !hasNewValue ? `Ya configurada — pegá nueva key para actualizar` : field.placeholder}
                            className="flex-1 bg-[#0a0f18] border border-[#1a2535] px-4 py-3 font-space text-[12px] text-white placeholder-[#2a3a4a] focus:border-[#00e5ff44] focus:outline-none transition-colors font-mono"
                          />
                          {field.isPassword && (
                            <button onClick={() => toggleShow(field.keyName)}
                              className="px-3 border border-[#1a2535] text-[#7ab3c8] hover:text-[#00e5ff] hover:border-[#00e5ff33] transition-all font-sharetech text-[10px] shrink-0">
                              {isVisible ? "🙈" : "👁"}
                            </button>
                          )}
                          {field.url && (
                            <a href={field.url} target="_blank" rel="noopener noreferrer"
                              className="px-3 border border-[#1a2535] text-[#7ab3c8] hover:text-[#00e5ff] hover:border-[#00e5ff33] transition-all flex items-center no-underline shrink-0">
                              <span className="font-sharetech text-[10px]">↗</span>
                            </a>
                          )}
                        </div>

                        {/* Hint */}
                        <div className="font-space text-[9px] text-[#5a8898] mt-2 leading-relaxed">{field.hint}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Save All button ───────────────────────────────────────────────────── */}
      <div className="mt-8 sticky bottom-6">
        <div className="border border-[#00e5ff33] bg-[#020408]/95 backdrop-blur p-5 flex flex-col gap-3">
          {/* Inline results — visible right next to the button */}
          {results.length > 0 && (
            <div className="space-y-1">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 font-space text-[11px]">
                  <span style={{color: r.ok ? "#00e676" : "#ff1744"}}>{r.ok ? "✓" : "✗"}</span>
                  <span className="text-white">{r.key}</span>
                  <span style={{color: r.ok ? "#00e676" : "#ff1744"}}>{r.msg}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="font-sharetech text-[10px] text-[#00e5ff] tracking-[0.15em] mb-0.5">
                {filledCount > 0 ? `${filledCount} key${filledCount > 1 ? "s" : ""} lista${filledCount > 1 ? "s" : ""} para guardar` : "Completá al menos un campo"}
              </div>
              <div className="font-space text-[9px] text-[#5a8898]">
                Los campos vacíos se ignoran — guardás solo lo que llenaste
              </div>
            </div>
            <button
              onClick={saveAll}
              disabled={saving || filledCount === 0}
              className="font-space text-[13px] font-bold tracking-[0.2em] uppercase px-8 py-4 transition-all shrink-0"
              style={{
                background: saving || filledCount === 0 ? "#0d1520" : "#00e5ff",
                color: saving || filledCount === 0 ? "#2a3a4a" : "#020408",
                cursor: filledCount === 0 ? "not-allowed" : "pointer",
              }}>
              {saving ? "⏳ GUARDANDO..." : `💾 GUARDAR ${filledCount > 0 ? `(${filledCount})` : "TODO"} →`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PSY Wallet / 1inch Section ───────────────────────────────────────────────
const ONEINCH_SERVICES = [
  {
    id: "swap",      icon: "⇄",  label: "Swap API",       priority: "CRÍTICA",    priorityColor: "#ff1744",
    desc: "Ejecuta swaps entre tokens — aquí ganás el fee PSY de 0.5%",
    endpoint: "/api/1inch/quote?chainHex=0x1&src=ETH&dst=USDT&amount=0.01",
    detail: "Sin esta API no hay wallet funcional. Genera el calldata real para MetaMask.",
  },
  {
    id: "price",     icon: "📊",  label: "Spot Price API", priority: "CRÍTICA",    priorityColor: "#ff1744",
    desc: "Precios en tiempo real de cada token para mostrar el valor del portfolio",
    endpoint: "/api/1inch/price?chainHex=0x1&tokens=ETH,USDT,WBTC",
    detail: "Reemplaza a CoinGecko para precios de tokens on-chain con mayor precisión.",
  },
  {
    id: "balance",   icon: "💰",  label: "Balance API",    priority: "IMPORTANTE", priorityColor: "#ffd700",
    desc: "Balances reales del usuario en su wallet — cuánto tiene de cada token",
    endpoint: "/api/1inch/balance/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?chainHex=0x1",
    detail: "Sustituye los holdings de demo con datos reales de la wallet conectada.",
  },
  {
    id: "gas",       icon: "⛽",  label: "Gas Price API",  priority: "IMPORTANTE", priorityColor: "#ffd700",
    desc: "Estimación del costo de cada transacción — widget de gas BAJO / MEDIO / ALTO",
    endpoint: "/api/1inch/gas?chainHex=0x1",
    detail: "Muestra el widget de gas en tiempo real en el panel de Swap.",
  },
  {
    id: "portfolio", icon: "📈",  label: "Portfolio API",  priority: "ÚTIL",       priorityColor: "#00e676",
    desc: "Todas las posiciones del usuario — tokens + DeFi + LP positions",
    endpoint: "/api/1inch/portfolio/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?chainHex=0x1",
    detail: "Vista avanzada de la posición total incluyendo protocolos DeFi.",
  },
  {
    id: "history",   icon: "🕐",  label: "History API",    priority: "ÚTIL",       priorityColor: "#00e676",
    desc: "Historial de transacciones — swaps anteriores con links a Etherscan",
    endpoint: "/api/1inch/history/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?chainHex=0x1&limit=5",
    detail: "Pestaña Historial del PSY Wallet muestra TXs reales on-chain.",
  },
];

interface ServiceStatus { ok: boolean; latency: number; snippet: string }

function WalletSection() {
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [keyStatus, setKeyStatus] = useState<{ configured: boolean; working?: boolean } | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [feeWallet, setFeeWallet] = useState("");
  const [feeMsg, setFeeMsg] = useState("");
  const [savingFee, setSavingFee] = useState(false);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, ServiceStatus>>({});
  const [testingAll, setTestingAll] = useState(false);

  // ── Load key status on mount ───────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE}/api/1inch/status`)
      .then(r => r.json())
      .then(d => setKeyStatus(d as { configured: boolean; working?: boolean }))
      .catch(() => setKeyStatus({ configured: false }));

    // Load current PSY fee wallet from admin config
    fetch(`${BASE}/api/admin/config`)
      .then(r => r.json())
      .then((d: unknown) => {
        const keys = (d as { keys?: Array<{ keyName: string; maskedValue: string | null }> }).keys ?? [];
        const fw = keys.find((k) => k.keyName === "PSY_FEE_WALLET");
        if (fw?.maskedValue) setFeeWallet(fw.maskedValue);
      })
      .catch(() => {});
  }, [BASE]);

  async function saveApiKey() {
    if (!apiKey.trim()) return;
    setSaving(true); setSaveMsg("");
    try {
      const res = await fetch(`${BASE}/api/admin/config`, {
        method: "POST", headers: { "Content-Type": "application/json", "X-PSY-Token": getAuth()?.token ?? "" },
        body: JSON.stringify({ keyName: "ONEINCH_API_KEY", keyValue: apiKey.trim(), adminPassword: "JORGE-ADMIN-2026" }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.success) {
        setSaveMsg("✅ API Key guardada — los 6 servicios se activaron");
        setApiKey("");
        // Re-check status
        setTimeout(() => {
          fetch(`${BASE}/api/1inch/status`).then(r => r.json()).then(d => setKeyStatus(d as { configured: boolean; working?: boolean }));
        }, 500);
      } else {
        setSaveMsg(`❌ ${data.error}`);
      }
    } catch { setSaveMsg("❌ Error de conexión"); }
    finally { setSaving(false); }
  }

  async function saveFeeWallet() {
    if (!feeWallet.trim() || !feeWallet.startsWith("0x")) {
      setFeeMsg("❌ Dirección inválida — debe comenzar con 0x"); return;
    }
    setSavingFee(true); setFeeMsg("");
    try {
      const res = await fetch(`${BASE}/api/admin/config`, {
        method: "POST", headers: { "Content-Type": "application/json", "X-PSY-Token": getAuth()?.token ?? "" },
        body: JSON.stringify({ keyName: "PSY_FEE_WALLET", keyValue: feeWallet.trim(), adminPassword: "JORGE-ADMIN-2026" }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.success) setFeeMsg("✅ Fee wallet guardada");
      else setFeeMsg(`❌ ${data.error}`);
    } catch { setFeeMsg("❌ Error"); }
    finally { setSavingFee(false); }
  }

  async function testService(svc: typeof ONEINCH_SERVICES[0]) {
    setTesting(p => ({ ...p, [svc.id]: true }));
    const t0 = Date.now();
    try {
      const r = await fetch(`${BASE}${svc.endpoint}`);
      const latency = Date.now() - t0;
      const raw = await r.json() as unknown;
      const snippet = JSON.stringify(raw, null, 2).slice(0, 200);
      setResults(p => ({ ...p, [svc.id]: { ok: r.ok && !(raw as { error?: string }).error, latency, snippet } }));
    } catch {
      setResults(p => ({ ...p, [svc.id]: { ok: false, latency: Date.now() - t0, snippet: "Error de conexión" } }));
    } finally {
      setTesting(p => ({ ...p, [svc.id]: false }));
    }
  }

  async function testAll() {
    setTestingAll(true);
    await Promise.all(ONEINCH_SERVICES.map(testService));
    setTestingAll(false);
  }

  const allTested = ONEINCH_SERVICES.every(s => results[s.id] !== undefined);
  const allOk = allTested && ONEINCH_SERVICES.every(s => results[s.id]?.ok);

  return (
    <div>
      {/* ── Hero status banner ─────────────────────────────────────────────── */}
      <div className="border border-[#1a2535] bg-[#060a0f] p-6 mb-6 flex items-start gap-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-2">INTEGRACIÓN PRINCIPAL — PSY WALLET</div>
          <div className="flex items-center gap-3 mb-3">
            <div className="font-bebas text-4xl text-white">1INCH AGGREGATOR</div>
            <div className="font-sharetech text-[9px] px-3 py-1 border tracking-[0.15em]"
              style={keyStatus?.configured
                ? { color: "#00e676", borderColor: "#00e67633", background: "#00e6760a" }
                : { color: "#ff1744", borderColor: "#ff174433", background: "#ff17440a" }}>
              {keyStatus === null ? "VERIFICANDO..." : keyStatus.configured ? "● API KEY ACTIVA" : "○ SIN CONFIGURAR"}
            </div>
          </div>
          <div className="font-space text-[11px] text-[#7ab3c8] leading-relaxed max-w-xl">
            Una sola API key activa los 6 servicios: Swap, Spot Price, Balance, Gas Price, Portfolio e Historial.
            Obtené tu key gratis en{" "}
            <a href="https://portal.1inch.dev/" target="_blank" rel="noopener noreferrer" className="text-[#00e5ff] no-underline hover:underline">
              portal.1inch.dev
            </a>
            {" "}→ registrate → Developer Portal → Create App → copiá la API Key.
          </div>
        </div>
        {/* Summary circles */}
        <div className="flex gap-3">
          {[
            { label: "SERVICIOS", value: "6", color: "#00e5ff" },
            { label: "CRÍTICOS", value: "2", color: "#ff1744" },
            { label: "ACTIVOS", value: allOk ? "6" : allTested ? String(ONEINCH_SERVICES.filter(s => results[s.id]?.ok).length) : "—", color: "#00e676" },
          ].map(s => (
            <div key={s.label} className="w-20 h-20 border border-[#1a2535] bg-[#0a0f18] flex flex-col items-center justify-center">
              <div className="font-bebas text-3xl" style={{ color: s.color }}>{s.value}</div>
              <div className="font-sharetech text-[7px] text-[#5a8898] tracking-[0.1em]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── API Key config ─────────────────────────────────────────────────── */}
      <div className="border border-[#00e5ff33] bg-[#00e5ff08] p-6 mb-6">
        <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#00e5ff] mb-4">🔑 CONFIGURAR 1INCH API KEY</div>
        <div className="flex gap-2 mb-2">
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            onKeyDown={e => e.key === "Enter" && saveApiKey()}
            placeholder="Pegá tu 1inch API Key aquí..."
            className="flex-1 bg-[#0a0f18] border border-[#1a2535] px-4 py-3 font-space text-[12px] text-white placeholder-[#2a3a4a] focus:border-[#00e5ff44] focus:outline-none transition-colors"
          />
          <button onClick={saveApiKey} disabled={saving || !apiKey.trim()}
            className="px-6 py-3 font-space text-[11px] font-bold tracking-[0.15em] uppercase transition-all"
            style={{ background: saving || !apiKey.trim() ? "#0d1520" : "#00e5ff", color: saving || !apiKey.trim() ? "#2a3a4a" : "#020408" }}>
            {saving ? "⏳" : "GUARDAR"}
          </button>
        </div>
        {saveMsg && (
          <div className="font-space text-[11px] mt-2" style={{ color: saveMsg.startsWith("✅") ? "#00e676" : "#ff1744" }}>{saveMsg}</div>
        )}
        <div className="font-space text-[9px] text-[#5a8898] mt-2 flex items-center gap-1.5">
          <span>🔒</span>
          <span>Guardada en PostgreSQL cifrada — nunca expuesta al cliente.</span>
          <a href="https://portal.1inch.dev/" target="_blank" rel="noopener noreferrer" className="text-[#00e5ff] no-underline ml-2">
            Obtener key → portal.1inch.dev
          </a>
        </div>
      </div>

      {/* ── 6 Services grid ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898]">6 SERVICIOS DISPONIBLES</div>
        <button onClick={testAll} disabled={testingAll}
          className="font-space text-[10px] px-4 py-2 border transition-all"
          style={{ borderColor: testingAll ? "#1a2535" : "#00e5ff44", color: testingAll ? "#2a4a5a" : "#00e5ff", background: testingAll ? "transparent" : "#00e5ff08" }}>
          {testingAll ? "⏳ TESTEANDO TODOS..." : "⚡ TESTEAR TODOS"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {ONEINCH_SERVICES.map(svc => {
          const res = results[svc.id];
          const isTesting = testing[svc.id];
          return (
            <div key={svc.id} className="border border-[#1a2535] bg-[#060a0f] overflow-hidden">
              {/* Top accent by priority */}
              <div className="h-0.5 w-full" style={{ background: res ? (res.ok ? "#00e676" : "#ff1744") : svc.priorityColor }} />

              <div className="p-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border border-[#1a2535] bg-[#0a0f18] flex items-center justify-center text-xl shrink-0">
                      {svc.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-space text-[13px] font-bold text-white">{svc.label}</span>
                        <span className="font-sharetech text-[8px] px-2 py-0.5 border tracking-[0.15em]"
                          style={{ color: svc.priorityColor, borderColor: `${svc.priorityColor}44`, background: `${svc.priorityColor}0f` }}>
                          {svc.priority}
                        </span>
                      </div>
                      <div className="font-space text-[10px] text-[#7ab3c8] leading-relaxed">{svc.desc}</div>
                    </div>
                  </div>

                  {/* Status dot + latency */}
                  {res && (
                    <div className="text-right shrink-0">
                      <div className="font-sharetech text-[10px] mb-0.5" style={{ color: res.ok ? "#00e676" : "#ff1744" }}>
                        {res.ok ? "● OK" : "● FAIL"}
                      </div>
                      <div className="font-sharetech text-[9px] text-[#5a8898]">{res.latency}ms</div>
                    </div>
                  )}
                </div>

                {/* Detail note */}
                <div className="font-space text-[9px] text-[#5a8898] italic mb-3">{svc.detail}</div>

                {/* Test result snippet */}
                {res && (
                  <div className="mb-3 p-3 bg-[#030609] border border-[#1a2535] font-sharetech text-[9px] overflow-hidden"
                    style={{ color: res.ok ? "#00e676" : "#ff1744", maxHeight: "80px" }}>
                    <pre className="whitespace-pre-wrap break-all leading-relaxed">{res.snippet}</pre>
                  </div>
                )}

                {/* Test button */}
                <button onClick={() => testService(svc)} disabled={isTesting}
                  className="w-full py-2 font-space text-[10px] font-bold tracking-[0.15em] uppercase border transition-all"
                  style={isTesting
                    ? { borderColor: "#1a2535", color: "#2a4a5a", background: "transparent" }
                    : res
                    ? { borderColor: res.ok ? "#00e67644" : "#ff174444", color: res.ok ? "#00e676" : "#ff1744", background: res.ok ? "#00e67608" : "#ff17440a" }
                    : { borderColor: "#00e5ff33", color: "#00e5ff", background: "#00e5ff08" }}>
                  {isTesting ? "⏳ TESTEANDO..." : res ? (res.ok ? "✓ TEST OK — REPETIR" : "✗ FALLÓ — REINTENTAR") : "🧪 TESTEAR ENDPOINT"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── PSY Fee Wallet ─────────────────────────────────────────────────── */}
      <div className="border border-[#e040fb33] bg-[#e040fb08] p-6 mb-6">
        <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#e040fb] mb-1">💎 PSY FEE WALLET — DIRECCIÓN DE COBRO</div>
        <div className="font-space text-[11px] text-[#7ab3c8] mb-4 leading-relaxed">
          Cada swap cobra un <strong className="text-[#e040fb]">0.5% de fee PSY</strong> que se acumula en esta dirección.
          Configurá tu wallet ETH real para empezar a recibir los fees automáticamente.
        </div>
        <div className="flex gap-2 mb-2">
          <input
            value={feeWallet}
            onChange={e => setFeeWallet(e.target.value)}
            onKeyDown={e => e.key === "Enter" && saveFeeWallet()}
            placeholder="0xTuDirecciónEthereum..."
            className="flex-1 bg-[#0a0f18] border border-[#e040fb33] px-4 py-3 font-space text-[12px] text-white placeholder-[#2a3a4a] focus:border-[#e040fb66] focus:outline-none transition-colors font-mono"
          />
          <button onClick={saveFeeWallet} disabled={savingFee || !feeWallet.trim()}
            className="px-6 py-3 font-space text-[11px] font-bold tracking-[0.15em] uppercase transition-all"
            style={{ background: savingFee || !feeWallet.trim() ? "#0d1520" : "#e040fb", color: savingFee || !feeWallet.trim() ? "#2a3a4a" : "#020408" }}>
            {savingFee ? "⏳" : "GUARDAR"}
          </button>
        </div>
        {feeMsg && (
          <div className="font-space text-[11px] mt-2" style={{ color: feeMsg.startsWith("✅") ? "#00e676" : "#ff1744" }}>{feeMsg}</div>
        )}
        <div className="font-space text-[9px] text-[#5a8898] mt-2">
          ⚠ Usá una dirección que controlés. El fee se cobra vía el parámetro <code className="text-[#e040fb]">referrerAddress</code> de 1inch.
        </div>
      </div>

      {/* ── How to get 1inch key ──────────────────────────────────────────── */}
      <div className="border border-[#1a2535] bg-[#060a0f] p-6">
        <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#00e5ff] mb-5">📖 CÓMO OBTENER TU 1INCH API KEY</div>
        <div className="space-y-4">
          {[
            { step: "01", title: "Crear cuenta en 1inch Dev Portal", desc: "Andá a portal.1inch.dev y registrate con tu email. Es gratis." },
            { step: "02", title: "Crear una nueva App", desc: "Developer Portal → My Apps → Create App. Dale un nombre (ej: PSYCHOMETRIKS PSY Wallet)." },
            { step: "03", title: "Copiar la API Key", desc: "Una vez creada la app, copiá la API Key que aparece. Tiene el formato de un UUID largo." },
            { step: "04", title: "Pegar en el campo de arriba", desc: "Pegala en el campo de arriba y hacé click en GUARDAR. Los 6 servicios se activan inmediatamente." },
            { step: "05", title: "Testear todos los servicios", desc: "Usá el botón TESTEAR TODOS para verificar que cada endpoint responde correctamente." },
          ].map(g => (
            <div key={g.step} className="flex gap-4">
              <div className="font-bebas text-2xl shrink-0 text-[#00e5ff]" style={{ lineHeight: 1 }}>{g.step}</div>
              <div>
                <div className="font-space text-[12px] font-bold text-white mb-0.5">{g.title}</div>
                <div className="font-space text-[11px] text-[#7ab3c8] leading-relaxed">{g.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-5 border-t border-[#1a2535] grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Plan gratuito incluye", value: "100K req/mes", color: "#00e676" },
            { label: "Redes soportadas", value: "ETH · BSC · ARB · POLY · OP · BASE", color: "#00e5ff" },
            { label: "Fee PSY por swap", value: "0.5% → tu wallet", color: "#e040fb" },
          ].map(s => (
            <div key={s.label} className="border border-[#1a2535] bg-[#0a0f18] p-3 text-center">
              <div className="font-space text-[9px] text-[#5a8898] mb-1">{s.label}</div>
              <div className="font-sharetech text-[11px] font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── API Keys Section ─────────────────────────────────────────────────────────
function ApiKeysSection() {
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [msgs, setMsgs] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState("all");

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/admin/config`);
      const data = await res.json() as { keys: ApiKey[] };
      setKeys(data.keys ?? []);
    } catch { setKeys([]); } finally { setLoading(false); }
  }, [BASE]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  async function saveKey(keyName: string) {
    if (!editValue.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/admin/config`, {
        method: "POST", headers: { "Content-Type": "application/json", "X-PSY-Token": getAuth()?.token ?? "" },
        body: JSON.stringify({ keyName, keyValue: editValue.trim(), adminPassword: "JORGE-ADMIN-2026" }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.success) {
        setMsgs(p => ({ ...p, [keyName]: "✅ Guardado correctamente" }));
        setTimeout(() => setMsgs(p => { const n = { ...p }; delete n[keyName]; return n; }), 3000);
        setEditing(null); setEditValue(""); await fetchKeys();
      } else {
        setMsgs(p => ({ ...p, [keyName]: `❌ ${data.error}` }));
      }
    } catch { setMsgs(p => ({ ...p, [keyName]: "❌ Error de conexión" })); }
    finally { setSaving(false); }
  }

  async function deleteKey(keyName: string) {
    if (!confirm(`¿Eliminar ${keyName}?`)) return;
    await fetch(`${BASE}/api/admin/config/${keyName}`, {
      method: "DELETE", headers: { "Content-Type": "application/json", "X-PSY-Token": getAuth()?.token ?? "" },
      body: JSON.stringify({ adminPassword: "JORGE-ADMIN-2026" }),
    });
    await fetchKeys();
  }

  const configured  = keys.filter(k => k.configured).length;
  const required    = keys.filter(k => k.required).length;
  const requiredOk  = keys.filter(k => k.required && k.configured).length;
  const filtered    = activeCategory === "all" ? keys : keys.filter(k => k.category === activeCategory);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a2535] border border-[#1a2535] mb-6">
        {[
          { label: "Total APIs", value: keys.length, color: "#4a6070" },
          { label: "Configuradas", value: configured, color: "#00e5ff" },
          { label: "Requeridas OK", value: `${requiredOk}/${required}`, color: requiredOk === required ? "#00e676" : "#ffd700" },
          { label: "Pendientes", value: keys.filter(k => !k.configured && k.required).length, color: "#ff1744" },
        ].map((s, i) => (
          <div key={i} className="bg-[#060a0f] p-5 text-center">
            <div className="font-space text-[9px] text-[#5a8898] tracking-[0.1em] uppercase mb-2">{s.label}</div>
            <div className="font-bebas text-4xl" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="border border-[#1a2535] bg-[#060a0f] p-5 mb-6">
        <div className="flex justify-between mb-2">
          <span className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898]">ESTADO GENERAL</span>
          <span className="font-sharetech text-[10px]" style={{ color: configured === keys.length ? "#00e676" : "#ffd700" }}>
            {Math.round((configured / Math.max(keys.length, 1)) * 100)}% CONFIGURADO
          </span>
        </div>
        <div className="h-2 bg-[#0a0f18]">
          <div className="h-full transition-all duration-700"
            style={{ width: `${(configured / Math.max(keys.length, 1)) * 100}%`, background: configured === keys.length ? "#00e676" : "#ffd700" }} />
        </div>
        <div className="flex flex-wrap gap-4 mt-3">
          {(["auto","env","db","none"] as const).map(src => {
            const count = keys.filter(k => k.source === src).length;
            if (!count) return null;
            const colors = { auto: "#00e676", env: "#00e5ff", db: "#e040fb", none: "#ff1744" };
            const labels = { auto: "Auto", env: "Env Var", db: "Base de datos", none: "Sin config" };
            return (
              <span key={src} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: colors[src] }} />
                <span className="font-space text-[10px] text-[#7ab3c8]">{labels[src]}: {count}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setActiveCategory("all")}
          className="px-4 py-2 border font-space text-[10px] tracking-[0.1em] uppercase transition-all"
          style={{ borderColor: activeCategory === "all" ? "#00e5ff" : "#1a2535", color: activeCategory === "all" ? "#00e5ff" : "#4a6070", background: activeCategory === "all" ? "#00e5ff12" : "transparent" }}>
          TODAS ({keys.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = keys.filter(k => k.category === cat).length;
          const color = CATEGORY_COLORS[cat] ?? "#4a6070";
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="px-4 py-2 border font-space text-[10px] tracking-[0.1em] uppercase transition-all"
              style={{ borderColor: activeCategory === cat ? color : "#1a2535", color: activeCategory === cat ? color : "#4a6070", background: activeCategory === cat ? `${color}12` : "transparent" }}>
              {CATEGORY_ICONS[cat]} {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Keys list */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-[#060a0f] border border-[#1a2535] animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(key => {
            const color = CATEGORY_COLORS[key.category] ?? "#4a6070";
            const isEditing = editing === key.keyName;
            return (
              <div key={key.keyName} className="border border-[#1a2535] bg-[#060a0f] overflow-hidden">
                {/* Top accent bar */}
                <div className="h-0.5 w-full" style={{ background: key.configured ? color : "#1a2535" }} />
                <div className="p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1.5 shrink-0">
                        {key.configured
                          ? <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                          : <div className="w-2.5 h-2.5 rounded-full bg-[#ff1744] animate-pulse" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-space text-[13px] font-bold text-white">{key.label}</span>
                          <span className="font-sharetech text-[9px] px-2 py-0.5 border tracking-[0.1em]"
                            style={{ color, borderColor: `${color}44`, background: `${color}0f` }}>
                            {CATEGORY_ICONS[key.category]} {key.category}
                          </span>
                          {key.required && <span className="font-sharetech text-[9px] px-2 py-0.5 border border-[#ff174433] text-[#ff6d00] bg-[#ff17440a] tracking-[0.1em]">REQUERIDA</span>}
                          {key.autoConfigured && <span className="font-sharetech text-[9px] px-2 py-0.5 border border-[#00e67633] text-[#00e676] bg-[#00e6760a] tracking-[0.1em]">AUTO ✓</span>}
                        </div>
                        <div className="font-sharetech text-[9px] text-[#5a8898] tracking-[0.05em] mb-1">{key.keyName}</div>
                        <div className="font-space text-[11px] text-[#8a9ab0]">{key.purpose}</div>
                        {key.note && <div className="font-space text-[10px] text-[#7ab3c8] italic mt-0.5">ℹ {key.note}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <div className="font-sharetech text-[10px] px-3 py-1.5 border tracking-[0.1em]"
                        style={key.configured
                          ? { color: "#00e676", borderColor: "#00e67633", background: "#00e6760a" }
                          : { color: "#ff1744", borderColor: "#ff174433", background: "#ff17440a" }}>
                        {key.configured ? `● ${key.source === "auto" ? "AUTO" : key.source === "env" ? "ENV" : "DB"} ✓` : "○ NO CONFIGURADA"}
                      </div>
                      {key.maskedValue && (
                        <div className="font-sharetech text-[10px] text-[#7ab3c8] border border-[#1a2535] px-2 py-1">{key.maskedValue}</div>
                      )}
                      {!key.autoConfigured && (
                        <button onClick={() => { setEditing(isEditing ? null : key.keyName); setEditValue(""); }}
                          className="font-space text-[10px] px-3 py-1.5 border transition-all"
                          style={{ borderColor: isEditing ? "#ffd70044" : "#1a2535", color: isEditing ? "#ffd700" : "#4a6070", background: isEditing ? "#ffd70012" : "transparent" }}>
                          {isEditing ? "CANCELAR" : key.configured ? "✏ EDITAR" : "+ CONFIGURAR"}
                        </button>
                      )}
                      {key.source === "db" && !isEditing && (
                        <button onClick={() => deleteKey(key.keyName)}
                          className="font-space text-[10px] px-2 py-1.5 border border-[#1a2535] text-[#7ab3c8] hover:text-[#ff1744] hover:border-[#ff174433] transition-all">🗑</button>
                      )}
                    </div>
                  </div>

                  {key.url && !isEditing && (
                    <a href={key.url} target="_blank" rel="noopener noreferrer"
                      className="inline-block font-space text-[9px] text-[#5a8898] hover:text-[#7ab3c8] transition-colors no-underline mt-1">
                      🔗 Obtener clave → {key.url}
                    </a>
                  )}

                  {isEditing && (
                    <div className="mt-3 pt-3 border-t border-[#1a2535]">
                      {key.url && (
                        <div className="font-space text-[10px] text-[#7ab3c8] mb-2">
                          Obtén tu clave en: <a href={key.url} target="_blank" rel="noopener noreferrer" className="text-[#00e5ff] no-underline hover:underline">{key.url}</a>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input type="password" value={editValue} onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && saveKey(key.keyName)}
                          placeholder={`Ingresa tu ${key.label}...`} autoFocus
                          className="flex-1 bg-[#0a0f18] border border-[#1a2535] px-4 py-2.5 font-space text-[12px] text-white placeholder-[#2a3a4a] focus:border-[#00e5ff44] focus:outline-none" />
                        <button onClick={() => saveKey(key.keyName)} disabled={saving || !editValue.trim()}
                          className="px-5 py-2.5 font-space text-[11px] font-bold tracking-[0.1em] uppercase transition-all"
                          style={{ background: saving || !editValue.trim() ? "#0d1520" : "#00e5ff", color: saving || !editValue.trim() ? "#2a3a4a" : "#020408" }}>
                          {saving ? "⏳" : "GUARDAR"}
                        </button>
                      </div>
                      <div className="font-space text-[9px] text-[#5a8898] mt-2">🔒 Guardado cifrado en base de datos — nunca se expone al cliente.</div>
                      {msgs[key.keyName] && <div className="font-space text-[11px] mt-2" style={{ color: msgs[key.keyName]?.startsWith("✅") ? "#00e676" : "#ff1744" }}>{msgs[key.keyName]}</div>}
                    </div>
                  )}
                  {msgs[key.keyName] && !isEditing && (
                    <div className="font-space text-[11px] mt-2" style={{ color: msgs[key.keyName]?.startsWith("✅") ? "#00e676" : "#ff1744" }}>{msgs[key.keyName]}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 border border-[#ffd70022] bg-[#0a0900] p-5">
        <div className="font-space text-[10px] text-[#ffd700] mb-1">⚠️ SEGURIDAD</div>
        <div className="font-space text-[11px] text-[#6a7040] leading-relaxed">
          Claves tipo "ENV" están en Replit Secrets (más seguro). Claves tipo "DB" se guardan en PostgreSQL encriptadas. Para producción, preferí siempre Replit Secrets.
        </div>
      </div>
    </div>
  );
}

// ─── Telegram Channels Section ────────────────────────────────────────────────
const BLANK_BOT = { label: "", botToken: "" };

function TelegramSection() {
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
  const H = { "Content-Type": "application/json" };

  // Channel state
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewChannelForm>(BLANK_CHANNEL);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Channel>>({});
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, { ok: boolean; msg: string }>>({});
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [globalMsg, setGlobalMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Bot state
  const [botsMap, setBotsMap] = useState<Record<number, ChannelBot[]>>({});
  const [addBotFor, setAddBotFor] = useState<number | null>(null);
  const [botForm, setBotForm] = useState(BLANK_BOT);
  const [botSaving, setBotSaving] = useState(false);
  const [editBotId, setEditBotId] = useState<number | null>(null);
  const [editBotForm, setEditBotForm] = useState({ label: "", botToken: "" });

  const fetchBots = useCallback(async (channelId: number) => {
    try {
      const r = await fetch(`${BASE}/api/channels/${channelId}/bots/admin`);
      const d = await r.json() as { ok: boolean; bots: ChannelBot[] };
      setBotsMap(p => ({ ...p, [channelId]: d.bots ?? [] }));
    } catch { /* ignore */ }
  }, [BASE]);

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/channels/admin`);
      const data = await res.json() as { ok: boolean; channels: Channel[] };
      const chs = data.channels ?? [];
      setChannels(chs);
      await Promise.all(chs.map(c => fetchBots(c.id)));
    } catch { setChannels([]); } finally { setLoading(false); }
  }, [BASE, fetchBots]);

  const fetchWebhook = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/telegram/webhook-url`);
      const data = await res.json() as { ok: boolean; webhookUrl?: string };
      if (data.ok && data.webhookUrl) setWebhookUrl(data.webhookUrl);
    } catch { /* */ }
  }, [BASE]);

  useEffect(() => { fetchChannels(); fetchWebhook(); }, [fetchChannels, fetchWebhook]);

  function flash(type: "ok" | "err", text: string) {
    setGlobalMsg({ type, text });
    setTimeout(() => setGlobalMsg(null), 4000);
  }

  async function createChannel() {
    if (!form.slug || !form.name || !form.channelId) {
      flash("err", "Slug, nombre y Channel ID son requeridos");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/channels`, {
        method: "POST", headers: H,
        body: JSON.stringify({ slug: form.slug, name: form.name, description: form.description, color: form.color, botToken: form.botToken || "PENDIENTE", channelId: form.channelId, active: false }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (data.ok) { flash("ok", `Canal "${form.name}" creado — ahora agregá los bots`); setForm(BLANK_CHANNEL); setShowForm(false); await fetchChannels(); }
      else flash("err", data.error ?? "Error al crear el canal");
    } catch { flash("err", "Error de conexión"); } finally { setSaving(false); }
  }

  async function updateChannel(id: number) {
    setSaving(true);
    try {
      await fetch(`${BASE}/api/channels/${id}`, { method: "PATCH", headers: H, body: JSON.stringify(editForm) });
      flash("ok", "Canal actualizado"); setEditingId(null); setEditForm({}); await fetchChannels();
    } catch { flash("err", "Error al actualizar"); } finally { setSaving(false); }
  }

  async function toggleActive(ch: Channel) {
    await fetch(`${BASE}/api/channels/${ch.id}`, { method: "PATCH", headers: H, body: JSON.stringify({ active: !ch.active }) });
    await fetchChannels();
  }

  async function deleteChannel(id: number, name: string) {
    if (!confirm(`¿Eliminar el canal "${name}" y todos sus bots?`)) return;
    await fetch(`${BASE}/api/channels/${id}`, { method: "DELETE" });
    await fetchChannels();
  }

  async function testChannel(ch: Channel) {
    setTestingId(ch.id);
    try {
      const res = await fetch(`${BASE}/api/telegram/signal/${ch.slug}`, {
        method: "POST", headers: H,
        body: JSON.stringify({ asset: "BTC/USDT", direction: "LONG", entry: "103000", tp1: "105000", tp2: "107000", sl: "101000", leverage: "10x", rr: "1:2", note: "🧪 Test desde PSYCHOMETRIKS Admin", source: "TEST ADMIN" }),
      });
      const data = await res.json() as { ok?: boolean; error?: string; message_id?: number };
      setTestResults(p => ({ ...p, [ch.id]: data.ok ? { ok: true, msg: `✅ Enviado — msg_id: ${data.message_id}` } : { ok: false, msg: `❌ ${data.error ?? "Error"}` } }));
    } catch { setTestResults(p => ({ ...p, [ch.id]: { ok: false, msg: "❌ Error de conexión" } })); }
    finally { setTestingId(null); }
  }

  async function addBot(channelId: number) {
    if (!botForm.label || !botForm.botToken) { flash("err", "Nombre del bot y token son requeridos"); return; }
    setBotSaving(true);
    try {
      const r = await fetch(`${BASE}/api/channels/${channelId}/bots`, { method: "POST", headers: H, body: JSON.stringify(botForm) });
      const d = await r.json() as { ok?: boolean; error?: string };
      if (d.ok) { setBotForm(BLANK_BOT); setAddBotFor(null); await fetchBots(channelId); flash("ok", "Bot agregado correctamente"); }
      else flash("err", d.error ?? "Error al agregar bot");
    } catch { flash("err", "Error de conexión"); } finally { setBotSaving(false); }
  }

  async function toggleBot(bot: ChannelBot) {
    await fetch(`${BASE}/api/channels/bots/${bot.id}`, { method: "PATCH", headers: H, body: JSON.stringify({ active: !bot.active }) });
    await fetchBots(bot.channelId);
  }

  async function saveEditBot(bot: ChannelBot) {
    setBotSaving(true);
    try {
      await fetch(`${BASE}/api/channels/bots/${bot.id}`, { method: "PATCH", headers: H, body: JSON.stringify({ label: editBotForm.label, ...(editBotForm.botToken ? { botToken: editBotForm.botToken } : {}) }) });
      setEditBotId(null); await fetchBots(bot.channelId); flash("ok", "Bot actualizado");
    } catch { flash("err", "Error al actualizar bot"); } finally { setBotSaving(false); }
  }

  async function deleteBot(bot: ChannelBot) {
    if (!confirm(`¿Eliminar el bot "${bot.label}"?`)) return;
    await fetch(`${BASE}/api/channels/bots/${bot.id}`, { method: "DELETE" });
    await fetchBots(bot.channelId);
  }

  async function loadPreset(preset: typeof PRESET_CHANNELS[0]) {
    setForm(f => ({ ...f, slug: preset.slug, name: preset.name, description: preset.description, color: preset.color }));
    setShowForm(true);
  }

  const totalBots = Object.values(botsMap).flat().length;
  const activeBots = Object.values(botsMap).flat().filter(b => b.active).length;
  const activeCount = channels.filter(c => c.active).length;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a2535] border border-[#1a2535] mb-6">
        {[
          { label: "Canales", value: channels.length, color: "#00e5ff" },
          { label: "Canales activos", value: activeCount, color: "#00e676" },
          { label: "Bots totales", value: totalBots, color: "#e040fb" },
          { label: "Bots activos", value: activeBots, color: "#ffd700" },
        ].map((s, i) => (
          <div key={i} className="bg-[#060a0f] p-5 text-center">
            <div className="font-space text-[9px] text-[#5a8898] tracking-[0.1em] uppercase mb-2">{s.label}</div>
            <div className="font-bebas text-4xl" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Webhook info */}
      {webhookUrl && (
        <div className="border border-[#00e5ff22] bg-[#00e5ff08] p-4 mb-6">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#00e5ff] mb-1">📡 WEBHOOK URL (para configurar en Telegram)</div>
          <div className="font-space text-[11px] text-[#8a9ab0] break-all">{webhookUrl}</div>
          <div className="font-space text-[9px] text-[#5a8898] mt-1">Configura este URL en cada bot vía: <code className="text-[#00e5ff]">https://api.telegram.org/bot{"<TOKEN>"}/setWebhook?url={"{webhookUrl}"}</code></div>
        </div>
      )}

      {/* Global message */}
      {globalMsg && (
        <div className="mb-4 px-4 py-3 font-space text-[12px]"
          style={{ background: globalMsg.type === "ok" ? "#00e67612" : "#ff174412", border: `1px solid ${globalMsg.type === "ok" ? "#00e67633" : "#ff174433"}`, color: globalMsg.type === "ok" ? "#00e676" : "#ff1744" }}>
          {globalMsg.text}
        </div>
      )}

      {/* Presets — add my channels quickly */}
      {channels.length === 0 && !showForm && (
        <div className="border border-[#1a2535] bg-[#060a0f] p-6 mb-6">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#00e5ff] mb-4">⚡ TUS CANALES — CONFIGURACIÓN RÁPIDA</div>
          <div className="font-space text-[11px] text-[#7ab3c8] mb-4">Detecté tus 3 canales de Telegram. Haz click en uno para pre-cargar sus datos y solo necesitas agregar el Bot Token y Channel ID:</div>
          <div className="space-y-3">
            {PRESET_CHANNELS.map((p, i) => (
              <button key={i} onClick={() => loadPreset(p)}
                className="w-full text-left border p-4 transition-all hover:opacity-80"
                style={{ borderColor: `${p.color}44`, background: `${p.color}08` }}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                  <div>
                    <div className="font-space text-[12px] font-bold" style={{ color: p.color }}>{p.name}</div>
                    <div className="font-space text-[10px] text-[#7ab3c8]">{p.description}</div>
                  </div>
                  <div className="ml-auto font-sharetech text-[9px] px-3 py-1 border" style={{ borderColor: `${p.color}44`, color: p.color }}>
                    CONFIGURAR →
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add channel button */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => { setShowForm(!showForm); setForm(BLANK_CHANNEL); }}
          className="font-space text-[11px] font-bold tracking-[0.15em] uppercase px-5 py-2.5 transition-all"
          style={{ background: showForm ? "transparent" : "#00e5ff", color: showForm ? "#4a6070" : "#020408", border: showForm ? "1px solid #1a2535" : "none" }}>
          {showForm ? "CANCELAR" : "+ AGREGAR CANAL"}
        </button>
        {channels.length > 0 && !showForm && (
          <button onClick={() => { setShowForm(true); setForm(BLANK_CHANNEL); }}
            className="font-space text-[10px] px-4 py-2.5 border border-[#1a2535] text-[#7ab3c8] hover:text-[#00e5ff] hover:border-[#00e5ff33] transition-all tracking-[0.1em]">
            + NUEVO CANAL PERSONALIZADO
          </button>
        )}
      </div>

      {/* New channel form */}
      {showForm && (
        <div className="border border-[#00e5ff33] bg-[#00e5ff08] p-6 mb-6">
          <div className="font-sharetech text-[10px] tracking-[0.3em] text-[#00e5ff] mb-5">
            {form.name ? `⚡ CONFIGURANDO: ${form.name}` : "📡 NUEVO CANAL DE TELEGRAM"}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {[
              { label: "Slug (identificador único)", key: "slug" as const, placeholder: "ej: pro, alcoins, btc-eth-sol", hint: "Solo letras, números y guiones" },
              { label: "Nombre del canal", key: "name" as const, placeholder: "ej: PSYCHOMETRIKS PRO", hint: "Nombre que aparece en las señales" },
              { label: "Descripción (opcional)", key: "description" as const, placeholder: "ej: Canal premium de señales", hint: "" },
              { label: "Color del canal", key: "color" as const, placeholder: "#00e5ff", hint: "Hex color para identificarlo" },
            ].map(f => (
              <div key={f.key}>
                <label className="font-sharetech text-[9px] tracking-[0.1em] text-[#7ab3c8] block mb-1">{f.label}</label>
                <div className="flex gap-2">
                  {f.key === "color" && <div className="w-10 border border-[#1a2535] shrink-0" style={{ background: form.color }} />}
                  <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="flex-1 bg-[#0a0f18] border border-[#1a2535] px-3 py-2 font-space text-[12px] text-white placeholder-[#2a3a4a] focus:border-[#00e5ff44] focus:outline-none" />
                </div>
                {f.hint && <div className="font-space text-[9px] text-[#5a8898] mt-0.5">{f.hint}</div>}
              </div>
            ))}
          </div>

          {/* Sensitive fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="font-sharetech text-[9px] tracking-[0.1em] text-[#e040fb] block mb-1">🔑 BOT TOKEN (de @BotFather)</label>
              <input type="password" value={form.botToken} onChange={e => setForm(p => ({ ...p, botToken: e.target.value }))}
                placeholder="1234567890:ABCdef..."
                className="w-full bg-[#0a0f18] border border-[#e040fb33] px-3 py-2 font-space text-[12px] text-white placeholder-[#2a3a4a] focus:border-[#e040fb66] focus:outline-none" />
              <div className="font-space text-[9px] text-[#5a8898] mt-0.5">
                Ve a <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-[#e040fb] no-underline">@BotFather</a> → /mybots → tu bot → API Token
              </div>
            </div>
            <div>
              <label className="font-sharetech text-[9px] tracking-[0.1em] text-[#e040fb] block mb-1">📺 CHANNEL ID o @username</label>
              <input value={form.channelId} onChange={e => setForm(p => ({ ...p, channelId: e.target.value }))}
                placeholder="-1001234567890 o @psychometriks_pro"
                className="w-full bg-[#0a0f18] border border-[#e040fb33] px-3 py-2 font-space text-[12px] text-white placeholder-[#2a3a4a] focus:border-[#e040fb66] focus:outline-none" />
              <div className="font-space text-[9px] text-[#5a8898] mt-0.5">
                Reenvía un mensaje del canal a <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-[#e040fb] no-underline">@userinfobot</a> para obtener el ID
              </div>
            </div>
          </div>

          <button onClick={createChannel} disabled={saving}
            className="w-full py-3 font-space text-[12px] font-bold tracking-[0.2em] uppercase transition-all"
            style={{ background: saving ? "#0d1520" : "#00e5ff", color: saving ? "#2a3a4a" : "#020408" }}>
            {saving ? "⏳ GUARDANDO..." : "✓ CREAR CANAL"}
          </button>
        </div>
      )}

      {/* Channels list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 bg-[#060a0f] border border-[#1a2535] animate-pulse" />)}</div>
      ) : channels.length === 0 ? (
        <div className="border border-[#1a2535] bg-[#060a0f] p-12 text-center">
          <div className="font-bebas text-3xl text-[#1a2535] mb-2">SIN CANALES</div>
          <div className="font-space text-[11px] text-[#5a8898]">Agrega tus 3 canales de Telegram usando las plantillas de arriba</div>
        </div>
      ) : (
        <div className="space-y-4">
          {channels.map(ch => {
            const isEditing = editingId === ch.id;
            const testResult = testResults[ch.id];
            return (
              <div key={ch.id} className="border border-[#1a2535] bg-[#060a0f] overflow-hidden">
                {/* Color bar */}
                <div className="h-1 w-full" style={{ background: ch.active ? ch.color : "#1a2535" }} />

                {/* Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full shrink-0" style={{ background: ch.color }} />
                      <div>
                        <div className="font-space text-[14px] font-bold text-white">{ch.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-sharetech text-[9px] text-[#7ab3c8] tracking-[0.1em]">/{ch.slug}</span>
                          {ch.description && <span className="font-space text-[10px] text-[#5a8898]">· {ch.description}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Active toggle */}
                      <button onClick={() => toggleActive(ch)}
                        className="font-sharetech text-[10px] px-3 py-1.5 border tracking-[0.1em] transition-all"
                        style={ch.active
                          ? { color: "#00e676", borderColor: "#00e67633", background: "#00e6760a" }
                          : { color: "#4a6070", borderColor: "#1a2535", background: "transparent" }}>
                        {ch.active ? "● ACTIVO" : "○ INACTIVO"}
                      </button>

                      {/* Test button */}
                      <button onClick={() => testChannel(ch)} disabled={testingId === ch.id || !ch.active}
                        className="font-space text-[10px] px-3 py-1.5 border border-[#00e5ff33] text-[#00e5ff] hover:bg-[#00e5ff12] transition-all disabled:opacity-40">
                        {testingId === ch.id ? "⏳ ENVIANDO..." : "🧪 TEST"}
                      </button>

                      {/* Edit */}
                      <button onClick={() => {
                        if (isEditing) { setEditingId(null); setEditForm({}); }
                        else { setEditingId(ch.id); setEditForm({ name: ch.name, description: ch.description, color: ch.color }); }
                      }}
                        className="font-space text-[10px] px-3 py-1.5 border transition-all"
                        style={{ borderColor: isEditing ? "#ffd70044" : "#1a2535", color: isEditing ? "#ffd700" : "#4a6070" }}>
                        {isEditing ? "CANCELAR" : "✏ EDITAR"}
                      </button>

                      {/* Delete */}
                      <button onClick={() => deleteChannel(ch.id, ch.name)}
                        className="font-space text-[10px] px-2 py-1.5 border border-[#1a2535] text-[#7ab3c8] hover:text-[#ff1744] hover:border-[#ff174433] transition-all">🗑</button>
                    </div>
                  </div>

                  {/* Channel ID row */}
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-sharetech text-[9px] text-[#5a8898] tracking-[0.1em]">CHANNEL ID</span>
                      <span className="font-space text-[11px]" style={{ color: ch.channelId && ch.channelId !== "PENDIENTE" ? "#00e676" : "#ff6d00" }}>
                        {ch.channelId && ch.channelId !== "PENDIENTE" ? ch.channelId : "⚠ pendiente"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-sharetech text-[9px] text-[#5a8898] tracking-[0.1em]">BOTS</span>
                      <span className="font-space text-[11px]" style={{ color: (botsMap[ch.id]?.filter(b => b.active).length ?? 0) > 0 ? "#00e676" : "#ff6d00" }}>
                        {botsMap[ch.id]?.filter(b => b.active).length ?? 0} activos / {botsMap[ch.id]?.length ?? 0} totales
                      </span>
                    </div>
                  </div>

                  {/* ── BOTS SECTION ── */}
                  <div className="border border-[#1a2535] bg-[#0a0f18] mb-3">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a2535]">
                      <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#7ab3c8]">🤖 BOTS VINCULADOS</div>
                      <button
                        onClick={() => { setAddBotFor(addBotFor === ch.id ? null : ch.id); setBotForm(BLANK_BOT); }}
                        className="font-space text-[9px] px-3 py-1 border transition-all"
                        style={{ borderColor: addBotFor === ch.id ? "#ff174433" : "#00e5ff33", color: addBotFor === ch.id ? "#ff1744" : "#00e5ff" }}>
                        {addBotFor === ch.id ? "✕ CANCELAR" : "+ AGREGAR BOT"}
                      </button>
                    </div>

                    {/* Bot list */}
                    {(botsMap[ch.id] ?? []).length === 0 && addBotFor !== ch.id ? (
                      <div className="px-4 py-3 font-space text-[10px] text-[#5a8898]">
                        Sin bots — hacé click en "+ AGREGAR BOT" para vincular el primero
                      </div>
                    ) : (
                      <div className="divide-y divide-[#1a2535]">
                        {(botsMap[ch.id] ?? []).map(bot => (
                          <div key={bot.id} className="px-4 py-3">
                            {editBotId === bot.id ? (
                              /* Edit bot inline */
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div>
                                    <label className="font-sharetech text-[8px] text-[#7ab3c8] block mb-1">NOMBRE DEL BOT</label>
                                    <input value={editBotForm.label} onChange={e => setEditBotForm(p => ({ ...p, label: e.target.value }))}
                                      className="w-full bg-[#060a0f] border border-[#1a2535] px-2 py-1.5 font-space text-[11px] text-white focus:outline-none focus:border-[#ffd70044]" />
                                  </div>
                                  <div>
                                    <label className="font-sharetech text-[8px] text-[#e040fb] block mb-1">NUEVO TOKEN (opcional)</label>
                                    <input type="password" value={editBotForm.botToken} onChange={e => setEditBotForm(p => ({ ...p, botToken: e.target.value }))}
                                      placeholder="Dejar vacío = no cambiar"
                                      className="w-full bg-[#060a0f] border border-[#e040fb33] px-2 py-1.5 font-space text-[11px] text-white placeholder-[#2a3a4a] focus:outline-none" />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => saveEditBot(bot)} disabled={botSaving}
                                    className="px-4 py-1.5 font-space text-[10px] font-bold"
                                    style={{ background: "#ffd700", color: "#020408" }}>
                                    {botSaving ? "⏳" : "GUARDAR"}
                                  </button>
                                  <button onClick={() => setEditBotId(null)}
                                    className="px-4 py-1.5 font-space text-[10px] border border-[#1a2535] text-[#7ab3c8]">
                                    CANCELAR
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Bot row */
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: bot.active ? "#00e676" : "#2a4a5a" }} />
                                <div className="flex-1 min-w-0">
                                  <div className="font-space text-[12px] font-bold text-white">{bot.label}</div>
                                  <div className="font-sharetech text-[9px] text-[#7ab3c8]">
                                    token: {bot.botToken && bot.botToken !== "***" ? `${bot.botToken.substring(0, 8)}…` : "●●●● configurado"}
                                  </div>
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                  <button onClick={() => toggleBot(bot)}
                                    className="font-sharetech text-[8px] px-2 py-1 border transition-all"
                                    style={bot.active
                                      ? { color: "#00e676", borderColor: "#00e67633", background: "#00e6760a" }
                                      : { color: "#4a6070", borderColor: "#1a2535" }}>
                                    {bot.active ? "● ON" : "○ OFF"}
                                  </button>
                                  <button onClick={() => { setEditBotId(bot.id); setEditBotForm({ label: bot.label, botToken: "" }); }}
                                    className="font-space text-[9px] px-2 py-1 border border-[#1a2535] text-[#7ab3c8] hover:text-[#ffd700] hover:border-[#ffd70033] transition-all">
                                    ✏
                                  </button>
                                  <button onClick={() => deleteBot(bot)}
                                    className="font-space text-[9px] px-2 py-1 border border-[#1a2535] text-[#7ab3c8] hover:text-[#ff1744] hover:border-[#ff174433] transition-all">
                                    🗑
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add bot form */}
                    {addBotFor === ch.id && (
                      <div className="px-4 py-4 border-t border-[#1a2535] bg-[#00e5ff05]">
                        <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#00e5ff] mb-3">✦ VINCULAR NUEVO BOT</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="font-sharetech text-[8px] text-[#7ab3c8] block mb-1">NOMBRE / ETIQUETA *</label>
                            <input value={botForm.label} onChange={e => setBotForm(p => ({ ...p, label: e.target.value }))}
                              placeholder="ej: Bot Principal, Bot Backup 1"
                              className="w-full bg-[#060a0f] border border-[#1a2535] px-3 py-2 font-space text-[11px] text-white placeholder-[#2a3a4a] focus:border-[#00e5ff33] focus:outline-none" />
                          </div>
                          <div>
                            <label className="font-sharetech text-[8px] text-[#e040fb] block mb-1">🔑 BOT TOKEN * (de @BotFather)</label>
                            <input type="password" value={botForm.botToken} onChange={e => setBotForm(p => ({ ...p, botToken: e.target.value }))}
                              placeholder="1234567890:ABCdef..."
                              className="w-full bg-[#060a0f] border border-[#e040fb33] px-3 py-2 font-space text-[11px] text-white placeholder-[#2a3a4a] focus:border-[#e040fb66] focus:outline-none" />
                          </div>
                        </div>
                        <button onClick={() => addBot(ch.id)} disabled={botSaving}
                          className="px-6 py-2 font-space text-[11px] font-bold tracking-[0.15em] uppercase transition-all"
                          style={{ background: botSaving ? "#1a2535" : "#00e5ff", color: botSaving ? "#4a6070" : "#020408" }}>
                          {botSaving ? "⏳ GUARDANDO..." : "VINCULAR BOT →"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Test result */}
                  {testResult && (
                    <div className="font-space text-[11px] px-3 py-2 mb-3"
                      style={{ background: testResult.ok ? "#00e67612" : "#ff174412", border: `1px solid ${testResult.ok ? "#00e67633" : "#ff174433"}`, color: testResult.ok ? "#00e676" : "#ff1744" }}>
                      {testResult.msg}
                    </div>
                  )}

                  {/* Edit channel form (metadata + channel ID only, bots managed separately) */}
                  {isEditing && (
                    <div className="mt-3 pt-4 border-t border-[#1a2535]">
                      <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#ffd700] mb-4">✏ EDITANDO CANAL</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="font-sharetech text-[9px] text-[#7ab3c8] block mb-1">NOMBRE</label>
                          <input value={editForm.name ?? ""} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                            className="w-full bg-[#0a0f18] border border-[#1a2535] px-3 py-2 font-space text-[12px] text-white focus:border-[#ffd70044] focus:outline-none" />
                        </div>
                        <div>
                          <label className="font-sharetech text-[9px] text-[#7ab3c8] block mb-1">DESCRIPCIÓN</label>
                          <input value={editForm.description ?? ""} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                            className="w-full bg-[#0a0f18] border border-[#1a2535] px-3 py-2 font-space text-[12px] text-white focus:border-[#ffd70044] focus:outline-none" />
                        </div>
                        <div>
                          <label className="font-sharetech text-[9px] text-[#e040fb] block mb-1">📺 CHANNEL ID</label>
                          <input defaultValue={ch.channelId} onChange={e => setEditForm(p => ({ ...p, channelId: e.target.value }))}
                            placeholder="-1001234567890 o @username"
                            className="w-full bg-[#0a0f18] border border-[#e040fb33] px-3 py-2 font-space text-[12px] text-white focus:border-[#e040fb66] focus:outline-none" />
                        </div>
                        <div>
                          <label className="font-sharetech text-[9px] text-[#7ab3c8] block mb-1">COLOR</label>
                          <div className="flex gap-2">
                            <div className="w-10 border border-[#1a2535] shrink-0" style={{ background: editForm.color ?? ch.color }} />
                            <input value={editForm.color ?? ch.color} onChange={e => setEditForm(p => ({ ...p, color: e.target.value }))}
                              className="flex-1 bg-[#0a0f18] border border-[#1a2535] px-3 py-2 font-space text-[12px] text-white focus:outline-none" />
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="font-sharetech text-[9px] text-[#00e676] block mb-1">✈️ LINK DE INVITACIÓN TELEGRAM</label>
                          <input defaultValue={ch.inviteLink ?? ""} onChange={e => setEditForm(p => ({ ...p, inviteLink: e.target.value }))}
                            placeholder="https://t.me/+xxxxxxxx o https://t.me/canal_publico"
                            className="w-full bg-[#0a0f18] border border-[#00e67633] px-3 py-2 font-space text-[12px] text-white focus:border-[#00e67666] focus:outline-none" />
                          <div className="font-sharetech text-[9px] text-[#5a8898] mt-1">Este link aparece en la página de señales para que los usuarios se unan al canal</div>
                        </div>
                      </div>
                      <button onClick={() => updateChannel(ch.id)} disabled={saving}
                        className="px-6 py-2.5 font-space text-[11px] font-bold tracking-[0.15em] uppercase"
                        style={{ background: saving ? "#0d1520" : "#ffd700", color: "#020408" }}>
                        {saving ? "⏳" : "GUARDAR CAMBIOS"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* How-to guide – Telegram */}
      <div className="mt-8 border border-[#1a2535] bg-[#060a0f] p-6">
        <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#00e5ff] mb-4">📖 CÓMO OBTENER LOS DATOS DE TELEGRAM</div>
        <div className="space-y-3">
          {[
            { step: "01", title: "Obtener Bot Token", desc: "Abre Telegram → escribe a @BotFather → /mybots → selecciona tu bot → API Token. Copia el token completo (formato: 1234567890:ABCdef...)." },
            { step: "02", title: "Obtener Channel ID", desc: "Método 1: Reenvía cualquier mensaje de tu canal a @userinfobot — te da el ID numérico (ej: -1001234567890). Método 2: Si el canal es público, usa @username directamente (ej: @psychometriks_pro)." },
            { step: "03", title: "Agregar el bot al canal", desc: "Ve a tu canal en Telegram → Administradores → Agregar Administrador → busca tu bot → dale permisos para 'Enviar mensajes'." },
            { step: "04", title: "Probar la conexión", desc: "Después de guardar, usa el botón TEST para enviar una señal de prueba al canal y verificar que todo funciona." },
          ].map(g => (
            <div key={g.step} className="flex gap-4">
              <div className="font-bebas text-2xl shrink-0" style={{ color: "#00e5ff", lineHeight: 1 }}>{g.step}</div>
              <div>
                <div className="font-space text-[12px] font-bold text-white mb-0.5">{g.title}</div>
                <div className="font-space text-[11px] text-[#7ab3c8] leading-relaxed">{g.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Members Section ──────────────────────────────────────────────────────────
interface MemberRow {
  id: number; username: string; displayName: string; email: string | null;
  plan: string; expiresAt: string | null; active: boolean; notes: string | null; createdAt: string;
}

const PLAN_COLORS: Record<string, string> = { basico: "#00e676", educacion: "#00bcd4", pro: "#00e5ff", elite: "#e040fb" };
const PLAN_LABELS: Record<string, string> = { basico: "Básico $9/mes", educacion: "Educación $29/mes", pro: "Pro $49/mes", elite: "Elite $99/mes" };

const BLANK_MEMBER = { username: "", password: "", displayName: "", email: "", plan: "basico", expiresAt: "", notes: "" };

function MembersSection() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK_MEMBER });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ plan: string; active: boolean; password: string; expiresAt: string; notes: string }>({ plan: "basico", active: true, password: "", expiresAt: "", notes: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const API = import.meta.env.BASE_URL.replace(/\/$/, "");
  const token = getAuth()?.token ?? "";
  const headers = { "Content-Type": "application/json", "X-PSY-Token": token };

  const fetchMembers = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API}/api/admin/members`, { headers: { "X-PSY-Token": token } });
      const d = await r.json() as { ok?: boolean; members?: MemberRow[]; error?: string };
      if (d.ok && d.members) { setMembers(d.members); }
      else setError(d.error ?? "Error al cargar miembros");
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }, [API, token]);

  useEffect(() => { void fetchMembers(); }, [fetchMembers]);

  async function createMember() {
    if (!form.username || !form.password || !form.displayName) { setFormErr("Usuario, contraseña y nombre son requeridos"); return; }
    setSaving(true); setFormErr("");
    try {
      const r = await fetch(`${API}/api/admin/members`, { method: "POST", headers, body: JSON.stringify({ ...form, expiresAt: form.expiresAt || undefined, email: form.email || undefined, notes: form.notes || undefined }) });
      const d = await r.json() as { ok?: boolean; error?: string };
      if (d.ok) { setShowForm(false); setForm({ ...BLANK_MEMBER }); void fetchMembers(); }
      else setFormErr(d.error ?? "Error al crear miembro");
    } catch { setFormErr("Error de conexión"); }
    finally { setSaving(false); }
  }

  async function updateMember(id: number) {
    setEditSaving(true);
    try {
      const body: Record<string, unknown> = { plan: editForm.plan, active: editForm.active, notes: editForm.notes || undefined, expiresAt: editForm.expiresAt || null };
      if (editForm.password) body["password"] = editForm.password;
      const r = await fetch(`${API}/api/admin/members/${id}`, { method: "PATCH", headers, body: JSON.stringify(body) });
      const d = await r.json() as { ok?: boolean; error?: string };
      if (d.ok) { setEditId(null); void fetchMembers(); }
    } catch { /* ignore */ }
    finally { setEditSaving(false); }
  }

  async function deleteMember(id: number) {
    try {
      await fetch(`${API}/api/admin/members/${id}`, { method: "DELETE", headers });
      setDeleteConfirm(null); void fetchMembers();
    } catch { /* ignore */ }
  }

  const planStats = { basico: 0, educacion: 0, pro: 0, elite: 0 };
  members.forEach(m => { if (m.active) { planStats[m.plan as keyof typeof planStats] = (planStats[m.plan as keyof typeof planStats] ?? 0) + 1; } });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-5 gap-px bg-[#1a2535] border border-[#1a2535]">
        {[
          { label: "TOTAL MIEMBROS", value: members.length, color: "#fff" },
          { label: "BÁSICO", value: planStats.basico, color: "#00e676" },
          { label: "EDUCACIÓN", value: planStats.educacion, color: "#00bcd4" },
          { label: "PRO", value: planStats.pro, color: "#00e5ff" },
          { label: "ELITE", value: planStats.elite, color: "#e040fb" },
        ].map(s => (
          <div key={s.label} className="bg-[#060a0f] p-5 text-center">
            <div className="font-sharetech text-[8px] text-[#5a8898] tracking-[0.15em] mb-1">{s.label}</div>
            <div className="font-bebas text-4xl" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Header + New member button */}
      <div className="flex items-center justify-between">
        <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898]">
          SUSCRIPTORES ACTIVOS
        </div>
        <button onClick={() => { setShowForm(!showForm); setFormErr(""); setForm({ ...BLANK_MEMBER }); }}
          className="font-space text-[11px] font-bold tracking-[0.15em] uppercase px-5 py-2.5 transition-all"
          style={{ background: showForm ? "#1a2535" : "#00e5ff", color: showForm ? "#4a6070" : "#020408" }}>
          {showForm ? "✕ CANCELAR" : "+ NUEVO MIEMBRO"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="border border-[#00e5ff33] bg-[#060a0f] p-6">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#00e5ff] mb-5">✦ CREAR NUEVO MIEMBRO</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="font-sharetech text-[9px] text-[#7ab3c8] block mb-1.5 tracking-[0.1em]">NOMBRE DE USUARIO *</label>
              <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="ej: juan.garcia"
                className="w-full bg-[#0a0f18] border border-[#1a2535] px-3 py-2.5 font-space text-[12px] text-white focus:border-[#00e5ff44] focus:outline-none" />
            </div>
            <div>
              <label className="font-sharetech text-[9px] text-[#7ab3c8] block mb-1.5 tracking-[0.1em]">CONTRASEÑA *</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="mínimo 6 caracteres"
                className="w-full bg-[#0a0f18] border border-[#1a2535] px-3 py-2.5 font-space text-[12px] text-white focus:border-[#00e5ff44] focus:outline-none" />
            </div>
            <div>
              <label className="font-sharetech text-[9px] text-[#7ab3c8] block mb-1.5 tracking-[0.1em]">NOMBRE COMPLETO *</label>
              <input value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
                placeholder="ej: Juan García"
                className="w-full bg-[#0a0f18] border border-[#1a2535] px-3 py-2.5 font-space text-[12px] text-white focus:border-[#00e5ff44] focus:outline-none" />
            </div>
            <div>
              <label className="font-sharetech text-[9px] text-[#7ab3c8] block mb-1.5 tracking-[0.1em]">EMAIL (opcional)</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="juan@email.com"
                className="w-full bg-[#0a0f18] border border-[#1a2535] px-3 py-2.5 font-space text-[12px] text-white focus:border-[#00e5ff44] focus:outline-none" />
            </div>
            <div>
              <label className="font-sharetech text-[9px] text-[#7ab3c8] block mb-1.5 tracking-[0.1em]">PLAN</label>
              <select value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))}
                className="w-full bg-[#0a0f18] border border-[#1a2535] px-3 py-2.5 font-space text-[12px] text-white focus:outline-none">
                <option value="basico">Básico — $9/mes (Aula Niveles 1-3)</option>
                <option value="educacion">Educación — $29/mes (Aula completa 8 niveles)</option>
                <option value="pro">Pro — $49/mes (Aula + LiqMap + Señales + Indicadores)</option>
                <option value="elite">Elite — $99/mes (Todo + Mentoring 1:1 + Bot X)</option>
              </select>
            </div>
            <div>
              <label className="font-sharetech text-[9px] text-[#7ab3c8] block mb-1.5 tracking-[0.1em]">VENCIMIENTO (opcional)</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                className="w-full bg-[#0a0f18] border border-[#1a2535] px-3 py-2.5 font-space text-[12px] text-white focus:outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="font-sharetech text-[9px] text-[#7ab3c8] block mb-1.5 tracking-[0.1em]">NOTAS INTERNAS (opcional)</label>
              <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="ej: Pago via Binance Pay, recibo #123"
                className="w-full bg-[#0a0f18] border border-[#1a2535] px-3 py-2.5 font-space text-[12px] text-white focus:border-[#00e5ff44] focus:outline-none" />
            </div>
          </div>
          {formErr && <div className="font-space text-[11px] text-[#ff1744] mb-3">{formErr}</div>}
          <button onClick={createMember} disabled={saving}
            className="px-8 py-3 font-space text-[12px] font-bold tracking-[0.2em] uppercase transition-all"
            style={{ background: saving ? "#1a2535" : "#00e5ff", color: saving ? "#4a6070" : "#020408" }}>
            {saving ? "⏳ CREANDO..." : "CREAR MIEMBRO →"}
          </button>
        </div>
      )}

      {/* Error */}
      {error && <div className="border border-[#ff174433] bg-[#ff174408] px-4 py-3 font-space text-[11px] text-[#ff1744]">{error}</div>}

      {/* Members list */}
      {loading ? (
        <div className="border border-[#1a2535] bg-[#060a0f] p-12 text-center font-space text-[11px] text-[#5a8898]">
          Cargando miembros...
        </div>
      ) : members.length === 0 ? (
        <div className="border border-[#1a2535] bg-[#060a0f] p-12 text-center">
          <div className="text-4xl mb-3">👥</div>
          <div className="font-bebas text-2xl text-[#5a8898] mb-2">SIN MIEMBROS AÚN</div>
          <div className="font-space text-[11px] text-[#5a8898]">Creá el primer suscriptor con el botón "Nuevo Miembro"</div>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map(m => {
            const isExpired = m.expiresAt && new Date(m.expiresAt) < new Date();
            const planColor = PLAN_COLORS[m.plan] ?? "#4a6070";
            const isEditing = editId === m.id;
            return (
              <div key={m.id} className="border border-[#1a2535] bg-[#060a0f]">
                {/* Member row */}
                <div className="flex items-center gap-4 px-5 py-4 flex-wrap">
                  {/* Status dot */}
                  <div className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: !m.active ? "#2a4a5a" : isExpired ? "#ff6d00" : "#00e676" }} />
                  {/* Name + user */}
                  <div className="flex-1 min-w-0">
                    <div className="font-space text-[13px] font-bold text-white">{m.displayName}</div>
                    <div className="font-sharetech text-[10px] text-[#7ab3c8] tracking-[0.1em]">
                      @{m.username}{m.email ? ` · ${m.email}` : ""}
                    </div>
                  </div>
                  {/* Plan badge */}
                  <div className="font-sharetech text-[9px] px-3 py-1 border tracking-[0.15em] shrink-0"
                    style={{ color: planColor, borderColor: `${planColor}44`, background: `${planColor}0f` }}>
                    {PLAN_LABELS[m.plan] ?? m.plan}
                  </div>
                  {/* Expiry */}
                  {m.expiresAt && (
                    <div className="font-sharetech text-[9px] shrink-0" style={{ color: isExpired ? "#ff6d00" : "#4a6070" }}>
                      {isExpired ? "⚠ VENCIDO" : "hasta"} {new Date(m.expiresAt).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                  )}
                  {!m.active && <div className="font-sharetech text-[9px] text-[#5a8898] shrink-0">DESACTIVADO</div>}
                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => {
                      if (isEditing) { setEditId(null); return; }
                      setEditId(m.id);
                      setEditForm({ plan: m.plan, active: m.active, password: "", expiresAt: m.expiresAt ? m.expiresAt.split("T")[0] : "", notes: m.notes ?? "" });
                    }}
                      className="font-space text-[10px] px-3 py-1.5 border transition-all"
                      style={{ borderColor: isEditing ? "#ffd700" : "#1a2535", color: isEditing ? "#ffd700" : "#4a6070" }}>
                      {isEditing ? "✕" : "✏ EDITAR"}
                    </button>
                    <button onClick={() => setDeleteConfirm(deleteConfirm === m.id ? null : m.id)}
                      className="font-space text-[10px] px-3 py-1.5 border border-[#1a2535] text-[#7ab3c8] hover:border-[#ff174433] hover:text-[#ff1744] transition-all">
                      🗑
                    </button>
                  </div>
                </div>

                {/* Delete confirm */}
                {deleteConfirm === m.id && (
                  <div className="px-5 pb-4 flex items-center gap-3">
                    <span className="font-space text-[11px] text-[#ff6d00]">¿Eliminar a {m.displayName}?</span>
                    <button onClick={() => deleteMember(m.id)} className="font-space text-[10px] px-3 py-1 bg-[#ff1744] text-white">CONFIRMAR</button>
                    <button onClick={() => setDeleteConfirm(null)} className="font-space text-[10px] px-3 py-1 border border-[#1a2535] text-[#7ab3c8]">CANCELAR</button>
                  </div>
                )}

                {/* Edit form */}
                {isEditing && (
                  <div className="px-5 pb-5 pt-2 border-t border-[#1a2535]">
                    <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#ffd700] mb-4">✏ EDITANDO — {m.displayName}</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="font-sharetech text-[9px] text-[#7ab3c8] block mb-1.5">PLAN</label>
                        <select value={editForm.plan} onChange={e => setEditForm(p => ({ ...p, plan: e.target.value }))}
                          className="w-full bg-[#0a0f18] border border-[#1a2535] px-3 py-2 font-space text-[11px] text-white focus:outline-none">
                          <option value="basico">Básico</option>
                          <option value="educacion">Educación</option>
                          <option value="pro">Pro</option>
                          <option value="elite">Elite</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-sharetech text-[9px] text-[#7ab3c8] block mb-1.5">ESTADO</label>
                        <div className="flex gap-px">
                          {[true, false].map(v => (
                            <button key={String(v)} onClick={() => setEditForm(p => ({ ...p, active: v }))}
                              className="flex-1 py-2 font-space text-[10px] transition-all"
                              style={{ background: editForm.active === v ? (v ? "#00e67615" : "#ff174415") : "#0a0f18", color: editForm.active === v ? (v ? "#00e676" : "#ff1744") : "#4a6070", border: `1px solid ${editForm.active === v ? (v ? "#00e67633" : "#ff174433") : "#1a2535"}` }}>
                              {v ? "ACTIVO" : "INACTIVO"}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="font-sharetech text-[9px] text-[#7ab3c8] block mb-1.5">NUEVA CONTRASEÑA</label>
                        <input type="password" value={editForm.password} onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                          placeholder="Dejar en blanco = no cambiar"
                          className="w-full bg-[#0a0f18] border border-[#1a2535] px-3 py-2 font-space text-[11px] text-white placeholder-[#2a3a4a] focus:outline-none" />
                      </div>
                      <div>
                        <label className="font-sharetech text-[9px] text-[#7ab3c8] block mb-1.5">VENCIMIENTO</label>
                        <input type="date" value={editForm.expiresAt} onChange={e => setEditForm(p => ({ ...p, expiresAt: e.target.value }))}
                          className="w-full bg-[#0a0f18] border border-[#1a2535] px-3 py-2 font-space text-[11px] text-white focus:outline-none" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="font-sharetech text-[9px] text-[#7ab3c8] block mb-1.5">NOTAS INTERNAS</label>
                        <input value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                          placeholder="Anotaciones privadas..."
                          className="w-full bg-[#0a0f18] border border-[#1a2535] px-3 py-2 font-space text-[11px] text-white focus:outline-none" />
                      </div>
                    </div>
                    <button onClick={() => updateMember(m.id)} disabled={editSaving}
                      className="px-6 py-2.5 font-space text-[11px] font-bold tracking-[0.15em] uppercase transition-all"
                      style={{ background: editSaving ? "#1a2535" : "#ffd700", color: editSaving ? "#4a6070" : "#020408" }}>
                      {editSaving ? "⏳" : "GUARDAR CAMBIOS"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Plan reference */}
      <div className="border border-[#1a2535] bg-[#060a0f] p-5 mt-4">
        <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-4">📊 REFERENCIA DE PLANES</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { plan: "BÁSICO",     slug: "basico",    price: "$9/mes",  color: "#00e676", features: ["Aula Virtual Niveles 1-3"] },
            { plan: "EDUCACIÓN",  slug: "educacion", price: "$29/mes", color: "#00bcd4", features: ["Aula Virtual completa — 8 niveles", "44+ módulos"] },
            { plan: "PRO",        slug: "pro",       price: "$49/mes", color: "#00e5ff", features: ["Todo Educación", "LiqMap PRO", "Señales Live", "Indicadores PSY"] },
            { plan: "ELITE",      slug: "elite",     price: "$99/mes", color: "#e040fb", features: ["Todo Pro", "Bot X", "Mentoring 1:1", "Canal prioritario"] },
          ].map(p => (
            <div key={p.plan} className="border p-4" style={{ borderColor: `${p.color}33` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-sharetech text-[10px] tracking-[0.1em] uppercase" style={{ color: p.color }}>{p.plan}</div>
                <div className="font-bebas text-xl" style={{ color: p.color }}>{p.price}</div>
              </div>
              {p.features.map(f => (
                <div key={f} className="flex items-center gap-1.5 mt-1">
                  <span className="text-[8px]" style={{ color: p.color }}>✦</span>
                  <span className="font-space text-[10px] text-[#7a9aaa]">{f}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Developer Keys Section ────────────────────────────────────────────────────
interface DevKey {
  key: string; username: string; label: string; active: boolean;
  activatedAt: string | null; expiresAt: string | null; lastUsedAt: string | null;
  createdAt: string;
}

function DeveloperKeysSection() {
  const [keys, setKeys]         = React.useState<DevKey[]>([]);
  const [loading, setLoading]   = React.useState(true);
  const [newUser, setNewUser]   = React.useState("");
  const [newLabel, setNewLabel] = React.useState("API Developer");
  const [creating, setCreating] = React.useState(false);
  const [msg, setMsg]           = React.useState("");

  const headers    = { "Content-Type": "application/json", "X-PSY-Token": getAuth()?.token ?? "" };

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/developer/keys", { headers });
      if (r.ok) setKeys(await r.json());
    } finally { setLoading(false); }
  }

  React.useEffect(() => { load(); }, []);

  async function create() {
    if (!newUser.trim()) return;
    setCreating(true);
    try {
      const r = await fetch("/api/admin/developer/keys", {
        method: "POST", headers,
        body: JSON.stringify({ username: newUser.trim(), label: newLabel }),
      });
      if (r.ok) { setMsg("✓ Key generada (INACTIVA — activala tras confirmar pago)"); setNewUser(""); await load(); }
      else { const e = await r.json(); setMsg("Error: " + (e.error ?? "desconocido")); }
    } finally { setCreating(false); }
  }

  async function toggleKey(key: string, active: boolean) {
    const ep = active ? "deactivate" : "activate";
    await fetch(`/api/admin/developer/keys/${encodeURIComponent(key)}/${ep}`, { method: "POST", headers });
    await load();
  }

  async function deleteKey(key: string) {
    if (!confirm("¿Eliminar esta key definitivamente?")) return;
    await fetch(`/api/admin/developer/keys/${encodeURIComponent(key)}`, { method: "DELETE", headers });
    await load();
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key).then(() => setMsg("✓ Key copiada al portapapeles"));
  }

  const mask = (k: string) => k.slice(0, 8) + "••••••••••••" + k.slice(-6);

  return (
    <div className="space-y-6">
      <div>
        <div className="font-sharetech text-[10px] tracking-[0.2em] uppercase text-[#00e5ff] mb-1">⚡ API DEVELOPER KEYS — $10 / mes</div>
        <div className="font-space text-[11px] text-[#7ab3c8] leading-relaxed">
          Activación manual tras confirmar pago. Keys inactivas no tienen acceso a la API.
          Con key activa: <span className="text-[#00e5ff]">120 req/min · 5.000 req/día</span>.
          Sin key: <span className="text-[#7ab3c8]">30 req/min (tier libre)</span>.
        </div>
      </div>

      {msg && (
        <div className="border border-[#00e5ff33] bg-[#00e5ff0a] p-3 font-space text-[11px] text-[#00e5ff] flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg("")} className="text-[#7ab3c8] hover:text-white ml-4 bg-transparent border-none cursor-pointer text-base">✕</button>
        </div>
      )}

      {/* Create */}
      <div className="border border-[#1a2535] bg-[#060a0f] p-5">
        <div className="font-sharetech text-[10px] tracking-[0.15em] text-[#7ab3c8] mb-4 uppercase">Generar nueva key</div>
        <div className="flex gap-3 flex-wrap">
          <input value={newUser} onChange={e => setNewUser(e.target.value)}
            placeholder="username del miembro"
            className="flex-1 min-w-[180px] bg-[#0d1520] border border-[#1a2535] px-3 py-2 font-space text-[12px] text-white placeholder-[#5a8898] outline-none focus:border-[#00e5ff44]" />
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
            placeholder="Etiqueta (ej: API Developer)"
            className="flex-1 min-w-[160px] bg-[#0d1520] border border-[#1a2535] px-3 py-2 font-space text-[12px] text-white placeholder-[#5a8898] outline-none focus:border-[#00e5ff44]" />
          <button onClick={create} disabled={creating || !newUser.trim()}
            className="px-5 py-2 font-space text-[11px] font-bold tracking-[0.1em] uppercase border border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff15] transition-colors disabled:opacity-40 cursor-pointer bg-transparent">
            {creating ? "GENERANDO..." : "+ CREAR KEY"}
          </button>
        </div>
        <div className="font-space text-[9px] text-[#5a8898] mt-2">La key se genera INACTIVA — activala después de confirmar el pago.</div>
      </div>

      {/* List */}
      {loading ? (
        <div className="font-space text-[11px] text-[#7ab3c8] py-8 text-center">Cargando keys...</div>
      ) : keys.length === 0 ? (
        <div className="font-space text-[11px] text-[#7ab3c8] py-8 text-center border border-[#1a2535] bg-[#060a0f]">No hay API Keys registradas.</div>
      ) : (
        <div className="space-y-2">
          {keys.map(k => (
            <div key={k.key} className="border p-4 flex items-start gap-4 flex-wrap"
              style={{ borderColor: k.active ? "#00e5ff22" : "#1a2535", background: k.active ? "#00e5ff05" : "#060a0f" }}>
              <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: k.active ? "#00e676" : "#ff5266" }} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-space text-[11px] font-bold text-white">{k.username}</span>
                  <span className="font-space text-[9px] px-1.5 py-0.5 border"
                    style={{ color: k.active ? "#00e676" : "#ff5266", borderColor: k.active ? "#00e67633" : "#ff526633" }}>
                    {k.active ? "ACTIVA" : "INACTIVA"}
                  </span>
                  <span className="font-space text-[9px] text-[#7ab3c8]">{k.label}</span>
                </div>
                <div className="font-mono text-[10px] text-[#7ab3c8] mb-1">{mask(k.key)}</div>
                <div className="flex flex-wrap gap-3 font-space text-[9px] text-[#5a8898]">
                  <span>Creada: {new Date(k.createdAt).toLocaleDateString("es")}</span>
                  {k.lastUsedAt && <span>Último uso: {new Date(k.lastUsedAt).toLocaleDateString("es")}</span>}
                  {k.expiresAt  && <span>Vence: {new Date(k.expiresAt).toLocaleDateString("es")}</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap shrink-0">
                <button onClick={() => copyKey(k.key)}
                  className="px-3 py-1.5 font-space text-[9px] tracking-[0.1em] uppercase border border-[#1a2535] text-[#7ab3c8] hover:border-[#00e5ff44] hover:text-[#00e5ff] transition-colors cursor-pointer bg-transparent">COPIAR</button>
                <button onClick={() => toggleKey(k.key, k.active)}
                  className="px-3 py-1.5 font-space text-[9px] tracking-[0.1em] uppercase border cursor-pointer bg-transparent transition-colors"
                  style={{ borderColor: k.active ? "#ff526633" : "#00e67633", color: k.active ? "#ff5266" : "#00e676" }}>
                  {k.active ? "DESACTIVAR" : "ACTIVAR"}
                </button>
                <button onClick={() => deleteKey(k.key)}
                  className="px-3 py-1.5 font-space text-[9px] tracking-[0.1em] uppercase border border-[#ff526622] text-[#ff5266] hover:bg-[#ff526610] transition-colors cursor-pointer bg-transparent">BORRAR</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border border-[#1a2535] bg-[#060a0f] p-4 grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="font-bebas text-3xl text-[#7ab3c8]">30</div>
          <div className="font-space text-[9px] text-[#5a8898] tracking-[0.15em] uppercase">req/min · sin key</div>
        </div>
        <div>
          <div className="font-bebas text-3xl text-[#00e5ff]">120</div>
          <div className="font-space text-[9px] text-[#7ab3c8] tracking-[0.15em] uppercase">req/min · key activa</div>
        </div>
      </div>
    </div>
  );
}
