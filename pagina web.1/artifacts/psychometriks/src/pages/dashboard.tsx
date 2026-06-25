import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/site-nav";
import { getAuth, isAdmin, hasAccess, logout, PLAN_COLORS, PLAN_NAMES, type PlanLevel } from "@/lib/auth";

const TELEGRAM = "https://t.me/psychometriks_pro";

// ─── Types ─────────────────────────────────────────────────────────────────
interface PanelItem {
  icon: string;
  label: string;
  desc: string;
  href: string;
  badge?: string;
  external?: boolean;
}
interface Panel {
  id: string;
  level: number;            // 0=free, 1=basico, 2=educacion, 3=pro, 4=elite, 5=admin
  required: PlanLevel | null;
  adminOnly?: boolean;
  label: string;
  sublabel: string;
  color: string;
  bg: string;
  icon: string;
  price?: string;
  items: PanelItem[];
  cta: string;
  ctaHref: string;
}

// ─── 6 Panels ──────────────────────────────────────────────────────────────
const PANELS: Panel[] = [
  // ── PANEL 1: GRATUITO ──────────────────────────────────────────────────
  {
    id: "gratuito",
    level: 0,
    required: null,
    label: "GRATUITO",
    sublabel: "Sin registro · Acceso libre para todos",
    color: "#546e7a",
    bg: "#060d12",
    icon: "🌐",
    items: [
      { icon: "📰", label: "Blog & Análisis",         desc: "Análisis BTC/ETH/macro · SMC · Semanal",              href: "/blog" },
      { icon: "🧠", label: "Test: Tipo de Trader",    desc: "5 perfiles psicológicos · 3 min",                     href: "/tests/tipo-trader" },
      { icon: "⚡", label: "Test: ¿Por qué te liquidan?", desc: "4 perfiles · Diagnóstico de errores",             href: "/tests/por-que-te-liquidan" },
      { icon: "🧬", label: "Test de Psicología",      desc: "5 perfiles psicológicos · 4 min",                     href: "/tests/psicologia" },
      { icon: "⚙️", label: "API Pública",              desc: "Docs REST · Prueba en vivo · JSON",                  href: "/api-docs" },
      { icon: "✈️", label: "Canal Telegram",           desc: "Análisis diarios · Alertas · Comunidad PSY",         href: TELEGRAM, external: true, badge: "GRATIS" },
      { icon: "📲", label: "App Mobile",               desc: "Descargá la app PSY para iOS y Android",             href: "/descarga" },
      { icon: "🎓", label: "Verificar Certificado",   desc: "Verificá la autenticidad de un certificado PSY",      href: "/verify/demo" },
    ],
    cta: "VER BLOG →",
    ctaHref: "/blog",
  },

  // ── PANEL 2: BÁSICO ────────────────────────────────────────────────────
  {
    id: "basico",
    level: 1,
    required: "basico",
    label: "BÁSICO",
    sublabel: "$9 / mes · Nivel 1 · Inicio del camino",
    color: "#00e676",
    bg: "#030e08",
    icon: "📚",
    price: "9",
    items: [
      { icon: "🎓", label: "Aula Virtual N1–N3",       desc: "SMC · Fundamentos · Técnico · 10+ horas",            href: "/aula", badge: "INCLUIDO" },
      { icon: "⚡", label: "Estoy por Entrar",          desc: "Análisis inmediato antes de tu trade · Sin filtros", href: "/pre-entry" },
      { icon: "🧬", label: "ADN del Trader",            desc: "Tu perfil psicológico real · 8 preguntas",           href: "/adn-trader" },
      { icon: "💸", label: "Costo de Mis Errores",      desc: "¿Cuánto te costaron tus errores? · Calculadora",    href: "/costo-errores" },
      { icon: "📐", label: "Position Size Calc",        desc: "Tamaño de posición óptimo por operación",           href: "/calculadora" },
      { icon: "💀", label: "Simulador de Liquidación",  desc: "Cómo te destruye el mercado · Personal",            href: "/simulador" },
      { icon: "📓", label: "Diario de Trading",         desc: "IA analiza tus errores · Journaling avanzado",      href: "/journal" },
      { icon: "🔬", label: "PSY Autopsy",               desc: "Post-mortem forense de tu trade perdedor",          href: "/psy-autopsy" },
      { icon: "💱", label: "PSY Wallet",               desc: "DEX Exchange · Swap · Portfolio · Auditoría",       href: "/psy-wallet" },
      { icon: "🔐", label: "Bóveda Personal",           desc: "Seeds, claves privadas, TOTP · Solo vos",           href: "/boveda" },
      { icon: "🎓", label: "Certificados PDF",          desc: "Generá tu certificado oficial · Verificable",       href: "/certificado" },
      { icon: "🏆", label: "Challenge 30 Días",         desc: "Convertite en PSY Trader · 30 misiones",            href: "/challenge" },
      { icon: "💎", label: "Programa de Afiliados",     desc: "Hasta 35% comisión recurrente · Sin límite",        href: "/affiliate" },
    ],
    cta: "IR AL AULA →",
    ctaHref: "/aula",
  },

  // ── PANEL 3: EDUCACIÓN ─────────────────────────────────────────────────
  {
    id: "educacion",
    level: 2,
    required: "educacion",
    label: "EDUCACIÓN",
    sublabel: "$29 / mes · Nivel 2 · Formación completa",
    color: "#ffd700",
    bg: "#0d0a00",
    icon: "📡",
    price: "29",
    items: [
      { icon: "🎓", label: "Aula Virtual N1–N5",       desc: "Wyckoff · Smart Money · Macro · 25+ horas",          href: "/aula", badge: "COMPLETO" },
      { icon: "📡", label: "Señales BTC/ETH/SOL",      desc: "Canal Telegram · Señales semanales en vivo",         href: "/signals", badge: "LIVE" },
      { icon: "⏮️", label: "Market Replay",             desc: "Reviví momentos históricos del mercado",             href: "/replay" },
      { icon: "📅", label: "Calendario Económico",      desc: "FOMC · CPI · NFP · Eventos que mueven el cripto",   href: "/economic-calendar" },
      { icon: "🏆", label: "Leaderboard PSY",           desc: "Historial completo de señales · Ranking traders",   href: "/leaderboard" },
      { icon: "💱", label: "Conversor Crypto",          desc: "Precios en tiempo real · LATAM friendly",           href: "/converter" },
      { icon: "💱", label: "PSY Wallet",               desc: "DEX Exchange · Swap · Portfolio · Auditoría",        href: "/psy-wallet", badge: "INCLUIDO" },
    ],
    cta: "VER SEÑALES →",
    ctaHref: "/signals",
  },

  // ── PANEL 4: PRO ───────────────────────────────────────────────────────
  {
    id: "pro",
    level: 3,
    required: "pro",
    label: "PRO",
    sublabel: "$49 / mes · Nivel 3 · Operativa activa",
    color: "#e040fb",
    bg: "#0d0014",
    icon: "💧",
    price: "49",
    items: [
      { icon: "💱", label: "PSY Wallet",               desc: "DEX Exchange · Swap · Portfolio · Auditoría",        href: "/psy-wallet", badge: "INCLUIDO" },
      { icon: "🚀", label: "PSY Exchange",             desc: "Explorá tokens · PSY Trust Score · Listar proyectos", href: "/exchange", badge: "PRO" },
      { icon: "🧠", label: "PSY Score",                desc: "Score institucional 0–100 · Indicador de tendencia", href: "/psy-score" },
      { icon: "📡", label: "PSY Screener",             desc: "Top 50 con señales PSY-ULT1 · Oportunidades",       href: "/screener" },
      { icon: "🌡️", label: "PSY HeatMap",              desc: "Correlación BTC·ETH·XAU·DXY · Mapa de calor",       href: "/heatmap" },
      { icon: "💸", label: "Funding Dashboard",        desc: "Funding rates de todas las exchanges en vivo",      href: "/funding" },
      { icon: "⚡", label: "Liquidation Clock",        desc: "Liquidaciones por minuto en tiempo real",           href: "/liquidations" },
      { icon: "🌐", label: "Macro Dashboard",          desc: "DXY · VIX · Bonos · SPX · Yields en vivo",         href: "/macro" },
      { icon: "📊", label: "Spot vs Perpetuos",        desc: "Demanda real · Patrón 2022 · Régimen actual",       href: "/spot-perp" },
      { icon: "🔄", label: "Ciclos BTC",               desc: "Stoch RSI bimestral · Fondos históricos",          href: "/ciclos-btc" },
      { icon: "🏛️", label: "FED × BTC",                desc: "Presidentes FED + Coinbase Premium en vivo",       href: "/fed-btc" },
      { icon: "🕐", label: "Market Hours",             desc: "Estado de mercados mundiales · Sesiones en vivo",  href: "/market-hours" },
      { icon: "⚔️", label: "War Room",                  desc: "Sala de análisis en vivo · Estrategia real",       href: "/war-room" },
      { icon: "📐", label: "PSY Indicators Pro",        desc: "ADX·RSI·MACD·OI·CVD·VolProfile·LiqMap·Master",     href: "/indicators-pro", badge: "NUEVO" },
      { icon: "🧮", label: "Depth Calculator",          desc: "Calculadora de profundidad de mercado · Fibonacci", href: "/depth-calculator.html", external: true, badge: "NUEVO" },
      { icon: "📊", label: "Buffett Scanner",           desc: "Value investing · 195 acciones · 9 criterios · ADRs chinos", href: "/buffett-scanner", badge: "NUEVO" },
      { icon: "🚀", label: "PSY LAUNCH",                desc: "Token Factory · BNB Chain · Bonding curve · Pump.fun style", href: "/psy-launch", badge: "NUEVO" },
      { icon: "🐋", label: "Whale Tracker",             desc: "Sigue tus ballenas favoritas · On-chain · ETH/BNB/ARB", href: "/whale-tracker", badge: "NUEVO" },
    ],
    cta: "VER LIQMAP PRO →",
    ctaHref: "/screener",
  },

  // ── PANEL 5: ELITE ─────────────────────────────────────────────────────
  {
    id: "elite",
    level: 4,
    required: "elite",
    label: "ELITE",
    sublabel: "$99 / mes · Nivel 4 · Acceso total",
    color: "#00e5ff",
    bg: "#000d14",
    icon: "⬡",
    price: "99",
    items: [
      { icon: "💱", label: "PSY Wallet",               desc: "DEX Exchange · Swap · Portfolio · Auditoría",        href: "/psy-wallet", badge: "INCLUIDO" },
      { icon: "🪙", label: "Señales Altcoins",         desc: "Top 50 altcoins · HyperLiquid · Tiempo real",       href: "/altcoins-signals", badge: "LIVE" },
      { icon: "🐋", label: "Whale Alert",              desc: "Movimientos +$1M on-chain en tiempo real",          href: "/whale-alert", badge: "LIVE" },
      { icon: "📈", label: "Acciones & Renta Fija",    desc: "LiqMap stocks · Bonds · ETFs · Mercados trad.",     href: "/bolsa", badge: "ELITE" },
      { icon: "🎓", label: "Aula Virtual N1–N8",       desc: "Todos los niveles · 34 módulos · 50+ horas",        href: "/aula", badge: "TOTAL" },
      { icon: "🎯", label: "Whale Signals",            desc: "Copy Trade Ballenas + Gem Hunter · IA tiempo real", href: "/psychometriks-whale-signals.html", external: true, badge: "ELITE" },
    ],
    cta: "ACTIVAR ELITE →",
    ctaHref: TELEGRAM,
  },

  // ── PANEL 6: ADMINISTRADOR ─────────────────────────────────────────────
  {
    id: "admin",
    level: 5,
    required: null,
    adminOnly: true,
    label: "ADMINISTRADOR",
    sublabel: "Solo superadmin · Panel de control total",
    color: "#ffd700",
    bg: "#0d0900",
    icon: "⚙️",
    items: [
      { icon: "👥", label: "Gestión de Usuarios",      desc: "Crear · Editar · Activar · Revocar miembros",       href: "#master-panel" },
      { icon: "📡", label: "Señales Realtime",          desc: "Publicar señales al canal · Panel de envío",        href: "/realtime" },
      { icon: "🤖", label: "Bot X",                    desc: "Panel del bot de Telegram · Configuración",         href: "/bot-x" },
      { icon: "💰", label: "Revenue",                  desc: "MRR · ARR · Distribución de planes",               href: "#master-panel" },
      { icon: "🚀", label: "Exchange Admin",           desc: "Gestión de proyectos listados · Aprobación",        href: "#master-panel" },
      { icon: "⚙️", label: "Configuración API",         desc: "URL del API · Token · Variables del sistema",      href: "/admin/apis" },
    ],
    cta: "ABRIR PANEL MAESTRO ⬡",
    ctaHref: "#master-panel",
  },
];

// ─── API Key Widget ──────────────────────────────────────────────────────────
function ApiKeyWidget({ username }: { username: string }) {
  const [data, setData]       = useState<{ found: boolean; active?: boolean; masked?: string; label?: string; lastUsedAt?: string } | null>(null);
  const [revealed, setRevealed] = useState("");
  const [copied, setCopied]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/developer/key?u=${encodeURIComponent(username.toLowerCase())}`)
      .then(r => r.json()).then(setData).catch(() => setData({ found: false }))
      .finally(() => setLoading(false));
  }, [username]);

  async function reveal() {
    const r = await fetch(`/api/developer/fullkey?u=${encodeURIComponent(username.toLowerCase())}`);
    if (r.ok) { const d = await r.json(); setRevealed(d.key ?? ""); }
  }

  async function copy() {
    const key = revealed || data?.masked || "";
    if (!key) return;
    if (!revealed) { await reveal(); return; }
    navigator.clipboard.writeText(revealed).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  if (loading) return null;

  return (
    <div className="mb-6 border border-[#00e5ff22] bg-[#00e5ff04] p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚡</span>
          <div>
            <div className="font-space text-[9px] text-[#00e5ff] tracking-[0.3em] uppercase mb-0.5">API DEVELOPER KEY</div>
            {!data?.found ? (
              <div className="font-space text-[11px] text-[#7ab3c8]">
                No tenés una API Key activa. <Link href="/pricing" className="text-[#00e5ff] no-underline hover:underline">Solicitá una por $10/mes →</Link>
              </div>
            ) : !data.active ? (
              <div className="font-space text-[11px] text-[#ffd700]">
                Key generada — pendiente de activación. Contactá al admin para confirmar tu pago.
              </div>
            ) : (
              <div>
                <div className="font-mono text-[12px] text-[#7ab3c8] tracking-wider mt-0.5">
                  {revealed || data.masked}
                </div>
                {data.lastUsedAt && (
                  <div className="font-space text-[9px] text-[#5a8898] mt-0.5">
                    Último uso: {new Date(data.lastUsedAt).toLocaleDateString("es")}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {data?.found && data.active && (
          <div className="flex gap-2 shrink-0">
            {!revealed && (
              <button onClick={reveal}
                className="px-3 py-1.5 font-space text-[9px] tracking-[0.1em] uppercase border border-[#00e5ff33] text-[#00e5ff] hover:bg-[#00e5ff15] transition-colors cursor-pointer bg-transparent">
                MOSTRAR
              </button>
            )}
            <button onClick={copy}
              className="px-3 py-1.5 font-space text-[9px] tracking-[0.1em] uppercase border border-[#00e5ff33] text-[#00e5ff] hover:bg-[#00e5ff15] transition-colors cursor-pointer bg-transparent">
              {copied ? "✓ COPIADA" : "COPIAR"}
            </button>
          </div>
        )}
      </div>
      {data?.found && data.active && (
        <div className="mt-3 pt-3 border-t border-[#1a2535] flex flex-wrap gap-4 font-space text-[9px] text-[#5a8898]">
          <span>Límite con key: <span className="text-[#00e5ff]">120 req/min</span></span>
          <span>Base URL: <span className="text-[#7ab3c8]">https://psychometriks.trade/api/proxy/</span></span>
          <Link href="/api-docs" className="text-[#00e5ff] no-underline hover:underline">Ver documentación →</Link>
        </div>
      )}
    </div>
  );
}

// ─── Comments widget ────────────────────────────────────────────────────────
interface Comment { id: string; user: string; text: string; ts: number }
const COMMENTS_KEY = "psyko_blog_comments";
function loadComments(): Comment[] {
  try { return JSON.parse(localStorage.getItem(COMMENTS_KEY) ?? "[]"); } catch { return []; }
}
function saveComments(c: Comment[]) { localStorage.setItem(COMMENTS_KEY, JSON.stringify(c.slice(-100))); }

function BlogCommentsWidget({ authUser }: { authUser: string }) {
  const [comments, setComments] = useState<Comment[]>(loadComments);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const t = text.trim();
    if (!t) { setErr("Escribí algo antes de publicar"); return; }
    if (t.length > 500) { setErr("Máximo 500 caracteres"); return; }
    const newC: Comment = { id: Date.now().toString(36), user: authUser, text: t, ts: Date.now() };
    const updated = [...loadComments(), newC];
    saveComments(updated);
    setComments(updated);
    setText(""); setErr("");
    textareaRef.current?.blur();
  };

  const fmt = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" }) + " · " +
           d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{ borderTop: "1px solid #4a607022", padding: "16px 24px 0" }}>
      <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#546e7a", letterSpacing: 3, marginBottom: 12 }}>
        💬 COMUNIDAD PSY — {comments.length} comentario{comments.length !== 1 ? "s" : ""}
      </div>
      <div style={{ marginBottom: 14 }}>
        <textarea ref={textareaRef} value={text}
          onChange={e => { setText(e.target.value); setErr(""); }}
          onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) submit(); }}
          placeholder="Compartí tu análisis, pregunta o idea... (Ctrl+Enter para publicar)"
          style={{
            width: "100%", background: "#060a0f", border: `1px solid ${err ? "#ff174444" : "#1a2535"}`,
            color: "#e0f0ff", fontFamily: "'Space Grotesk',sans-serif", fontSize: 12,
            padding: "10px 12px", resize: "vertical", minHeight: 72, outline: "none",
            borderRadius: 2, lineHeight: 1.5, boxSizing: "border-box",
          }} maxLength={500} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: err ? "#ff1744" : "#2a4a5a" }}>
            {err || `${text.length}/500`}
          </span>
          <button onClick={submit} style={{
            background: "#546e7a", color: "#020408", border: "none", cursor: "pointer",
            fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 11,
            letterSpacing: 2, padding: "6px 16px", textTransform: "uppercase",
          }}>PUBLICAR →</button>
        </div>
      </div>
      {[...comments].reverse().slice(0, 6).map(c => (
        <div key={c.id} style={{ background: "#060a0f", border: "1px solid #0d1520", borderRadius: 3, padding: "10px 12px", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, color: "#546e7a", letterSpacing: 1 }}>⬡ {c.user.toUpperCase()}</span>
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#2a4a5a" }}>{fmt(c.ts)}</span>
          </div>
          <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, color: "#8a9ab0", margin: 0, lineHeight: 1.5 }}>{c.text}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Panel Card ─────────────────────────────────────────────────────────────
function PanelCard({
  panel, unlocked, userPlan, authUser, isAdminUser, onAdminCta,
}: {
  panel: Panel;
  unlocked: boolean;
  userPlan: string;
  authUser: string;
  isAdminUser: boolean;
  onAdminCta?: () => void;
}) {
  const [expanded, setExpanded] = useState(unlocked);
  const color = unlocked ? panel.color : "#1a2535";
  const levelNum = panel.level + 1;

  const handleCta = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (panel.id === "admin" && onAdminCta) {
      e.preventDefault();
      onAdminCta();
    }
  };

  return (
    <div style={{
      border: `1px solid ${unlocked ? panel.color + "44" : "#1a2535"}`,
      background: unlocked ? panel.bg : "#040608",
      borderRadius: 4, overflow: "hidden",
      opacity: unlocked ? 1 : 0.55,
    }}>
      {/* Top accent bar */}
      <div style={{ height: 2, background: unlocked ? panel.color : "#0d1520" }} />

      {/* Header */}
      <div onClick={() => setExpanded(e => !e)}
        style={{ padding: "18px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, userSelect: "none" }}>

        {/* Level badge */}
        <div style={{
          width: 36, height: 36, flexShrink: 0, borderRadius: 4,
          background: unlocked ? `${panel.color}15` : "#0d1520",
          border: `1px solid ${unlocked ? panel.color + "44" : "#1a2535"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Orbitron',monospace", fontSize: 13, fontWeight: 700,
          color: unlocked ? panel.color : "#2a4a5a",
        }}>
          {unlocked ? panel.icon : "🔒"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 3 }}>
            {/* Level number */}
            <span style={{
              fontFamily: "'Share Tech Mono',monospace", fontSize: 9, letterSpacing: 2,
              color: unlocked ? panel.color : "#2a4a5a", opacity: 0.7,
            }}>
              PANEL {levelNum}
            </span>
            {/* Plan name */}
            <span style={{
              fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, lineHeight: 1,
              color: unlocked ? panel.color : "#2a4a5a",
            }}>
              {panel.label}
            </span>
            {/* Status badge */}
            <span style={{
              fontFamily: "'Share Tech Mono',monospace", fontSize: 8, letterSpacing: 2,
              padding: "2px 8px",
              border: `1px solid ${unlocked ? panel.color + "55" : "#1a253566"}`,
              color: unlocked ? panel.color : "#2a4a5a",
              background: unlocked ? `${panel.color}0d` : "transparent",
            }}>
              {panel.required === null && !panel.adminOnly ? "GRATIS" :
               panel.adminOnly ? "ADMIN" :
               unlocked ? "✓ ACTIVO" :
               `🔒 $${panel.price}/mes`}
            </span>
          </div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: unlocked ? "#4a6070" : "#2a4a5a" }}>
            {panel.sublabel}
          </div>
        </div>

        {/* Count + chevron */}
        <div style={{ display: "flex", flex: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: unlocked ? panel.color : "#2a4a5a", opacity: 0.6 }}>
            {panel.items.length} módulos
          </span>
          <span style={{ color: unlocked ? panel.color : "#2a4a5a", fontSize: 16, opacity: 0.6 }}>
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${unlocked ? panel.color + "18" : "#0d1520"}` }}>
          {/* Items grid */}
          <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
            {panel.items.map((item, i) => {
              const href = item.href.startsWith("http") || item.external ? item.href : item.href;
              const isExternal = item.external || item.href.startsWith("http");
              const isAnchor = item.href.startsWith("#");

              if (unlocked) {
                const commonStyle: React.CSSProperties = {
                  textDecoration: "none", display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "11px 13px",
                  background: `${panel.color}08`,
                  border: `1px solid ${panel.color}22`,
                  borderRadius: 3, cursor: "pointer",
                  transition: "border-color 0.15s, background 0.15s",
                };
                const inner = (
                  <>
                    <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: 600, color: "#e0f0ff" }}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span style={{
                            fontFamily: "'Share Tech Mono',monospace", fontSize: 7, letterSpacing: 1,
                            padding: "1px 5px", border: `1px solid ${panel.color}55`,
                            color: panel.color, background: `${panel.color}15`, flexShrink: 0,
                          }}>{item.badge}</span>
                        )}
                      </div>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, color: "#4a6070", marginTop: 2, lineHeight: 1.4 }}>
                        {item.desc}
                      </div>
                    </div>
                    <span style={{ color: panel.color, fontSize: 12, flexShrink: 0, opacity: 0.6, marginTop: 2 }}>→</span>
                  </>
                );

                if (isAnchor) {
                  return (
                    <button key={i} onClick={onAdminCta}
                      style={{ ...commonStyle, background: `${panel.color}08`, border: `1px solid ${panel.color}22`, cursor: "pointer", textAlign: "left", width: "100%" }}
                      onMouseEnter={e => { (e.currentTarget).style.borderColor = panel.color + "66"; (e.currentTarget).style.background = panel.color + "14"; }}
                      onMouseLeave={e => { (e.currentTarget).style.borderColor = panel.color + "22"; (e.currentTarget).style.background = panel.color + "08"; }}>
                      {inner}
                    </button>
                  );
                }

                return isExternal ? (
                  <a key={i} href={href} target="_blank" rel="noopener noreferrer" style={commonStyle}
                    onMouseEnter={e => { (e.currentTarget).style.borderColor = panel.color + "66"; (e.currentTarget).style.background = panel.color + "14"; }}
                    onMouseLeave={e => { (e.currentTarget).style.borderColor = panel.color + "22"; (e.currentTarget).style.background = panel.color + "08"; }}>
                    {inner}
                  </a>
                ) : (
                  <Link key={i} href={href} style={commonStyle}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = panel.color + "66"; (e.currentTarget as HTMLElement).style.background = panel.color + "14"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = panel.color + "22"; (e.currentTarget as HTMLElement).style.background = panel.color + "08"; }}>
                    {inner}
                  </Link>
                );
              }

              return (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "11px 13px", background: "#060a0f",
                  border: "1px solid #0d1520", borderRadius: 3,
                }}>
                  <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1, opacity: 0.25 }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: 600, color: "#2a4a5a" }}>{item.label}</div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, color: "#1a3040", marginTop: 2, lineHeight: 1.4 }}>{item.desc}</div>
                  </div>
                  <span style={{ color: "#1a2535", fontSize: 12, flexShrink: 0, marginTop: 2 }}>🔒</span>
                </div>
              );
            })}
          </div>

          {/* Community comments — gratuito panel */}
          {panel.id === "gratuito" && unlocked && (
            <BlogCommentsWidget authUser={authUser} />
          )}

          {/* CTA */}
          <div style={{ padding: "0 24px 20px" }}>
            {unlocked ? (
              <a href={panel.ctaHref}
                target={panel.ctaHref.startsWith("http") ? "_blank" : undefined}
                rel={panel.ctaHref.startsWith("http") ? "noopener noreferrer" : undefined}
                onClick={handleCta}
                style={{
                  display: "block", textAlign: "center", padding: "12px",
                  background: panel.color, color: "#020408",
                  fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, fontWeight: 700,
                  letterSpacing: 2, textDecoration: "none",
                }}>
                {panel.cta}
              </a>
            ) : (
              <Link href="/pricing" style={{
                display: "block", textAlign: "center", padding: "12px",
                border: `1px solid ${panel.color}44`, color: panel.color,
                fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, fontWeight: 700,
                letterSpacing: 2, textDecoration: "none", background: `${panel.color}08`,
              }}>
                🔒 ACTIVAR {panel.label} — ${panel.price}/mes →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const auth = getAuth();
  const admin = isAdmin(auth);

  if (!auth) {
    window.location.replace("/login?redirect=/dashboard");
    return null;
  }

  const userPlan  = auth.plan ?? "none";
  const authUser  = auth.displayName ?? auth.user;
  const planKey   = userPlan.toLowerCase();
  const planColor = PLAN_COLORS[planKey] ?? (admin ? "#ffd700" : "#4a6070");
  const planLabel = admin ? "ADMINISTRADOR" : (PLAN_NAMES[planKey] ?? "SIN PLAN");

  // Count unlocked panels
  const unlockedCount = PANELS.filter(p => {
    if (p.adminOnly) return admin;
    if (!p.required) return true;
    return hasAccess(auth, p.required);
  }).length;

  // Open master panel FAB
  const openMasterPanel = () => {
    const btn = document.querySelector<HTMLButtonElement>("[title='Panel Maestro — Superadmin']");
    btn?.click();
  };

  const handleLogout = () => {
    if (confirm("¿Cerrar sesión?")) logout();
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      <div className="pt-28 pb-16 px-4 md:px-10 max-w-5xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <div className="font-space text-[9px] text-[#7ab3c8] tracking-[0.3em] uppercase mb-2">
              PANEL DE MIEMBRO · PSYCHOMETRIKS
            </div>
            <h1 className="font-bebas text-5xl md:text-6xl leading-none">
              BIENVENIDO,{" "}
              <span style={{ color: planColor }}>{authUser.toUpperCase()}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="font-space text-[11px] tracking-[0.2em] uppercase px-3 py-1.5 border font-bold"
                style={{ color: planColor, borderColor: `${planColor}55`, background: `${planColor}0d` }}>
                {admin ? "⚡ ADMINISTRADOR" : `★ PLAN ${planLabel}`}
              </span>
              {!admin && planKey === "none" && (
                <Link href="/pricing"
                  className="font-space text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border border-[#00e5ff44] text-[#00e5ff] no-underline hover:bg-[#00e5ff15] transition-colors">
                  ACTIVAR PLAN →
                </Link>
              )}
            </div>
          </div>

          {/* Logout */}
          <button onClick={handleLogout}
            className="font-space text-[10px] tracking-[0.15em] uppercase px-4 py-2.5 border border-[#1a2535] text-[#7ab3c8] hover:border-[#ff174455] hover:text-[#ff1744] transition-colors self-start mt-1">
            🚪 CERRAR SESIÓN
          </button>
        </div>

        {/* ── Upgrade banner ─────────────────────────────────────── */}
        {!admin && planKey !== "elite" && (
          <div className="mb-6 border border-[#e040fb22] bg-[#e040fb06] p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="font-space text-[9px] text-[#e040fb] tracking-[0.3em] uppercase mb-1">⬆ DESBLOQUEÁ MÁS ACCESOS</div>
              <div className="font-bebas text-lg text-white leading-tight">
                {planKey === "none"    && "Activá un plan y accedé al Aula Virtual, señales, LiqMap PRO y más"}
                {planKey === "basico"  && "Pasá a Educación — señales live, Market Replay y más"}
                {planKey === "educacion" && "Pasá a Pro — Exchange, Screener, HeatMap y suite completa"}
                {planKey === "pro"     && "Pasá a Elite — Altcoins, Whale Alert, Acciones y acceso total"}
              </div>
            </div>
            <Link href="/pricing"
              className="shrink-0 font-space text-[10px] font-bold tracking-[0.2em] uppercase px-5 py-2.5 border border-[#e040fb] text-[#e040fb] no-underline hover:bg-[#e040fb15] transition-colors">
              VER PLANES →
            </Link>
          </div>
        )}

        {/* ── API Key Widget ──────────────────────────────────────── */}
        <ApiKeyWidget username={auth.user} />

        {/* ── Panel count ─────────────────────────────────────────── */}
        <div className="font-space text-[9px] text-[#7ab3c8] tracking-[0.3em] uppercase mb-4">
          {unlockedCount} de {PANELS.length} paneles desbloqueados
        </div>

        {/* ── 6 Panels ────────────────────────────────────────────── */}
        <div className="space-y-2">
          {PANELS.map(panel => {
            if (panel.adminOnly && !admin) return null;
            const unlocked = panel.adminOnly
              ? admin
              : panel.required === null || hasAccess(auth, panel.required);
            return (
              <PanelCard
                key={panel.id}
                panel={panel}
                unlocked={unlocked}
                userPlan={userPlan}
                authUser={authUser}
                isAdminUser={admin}
                onAdminCta={openMasterPanel}
              />
            );
          })}
        </div>

        <div className="text-center mt-10 font-space text-[9px] text-[#5a8898] tracking-[0.2em]">
          PSYCHOMETRIKS · psychometriks.trade · PLATAFORMA DE TRADING INSTITUCIONAL
        </div>
      </div>
    </div>
  );
}
