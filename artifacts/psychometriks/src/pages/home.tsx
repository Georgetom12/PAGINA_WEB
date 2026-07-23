import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { shieldRead } from "@/lib/secure-storage";
import { motion, AnimatePresence } from "framer-motion";

const TELEGRAM = "https://t.me/psychometriks_pro";

const DEFAULT_CONFIG = {
  prices: { basic: "9", educacion: "29", pro: "49", elite: "99" },
  paypal: "psychometriks@gmail.com",
  binance: "psychometriks_pro",
  bank: "Banco Pichincha\nCuenta Ahorros: 2207XXXXXX\nNombre: JORGE —\nCédula: 17XXXXXXXX",
};

function loadConfig() {
  try {
    const raw = localStorage.getItem("psy_config");
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) } as typeof DEFAULT_CONFIG;
  } catch {}
  return DEFAULT_CONFIG;
}

// ── Payment Modal ─────────────────────────────────────────────
function PaymentModal({ plan, onClose, cfg }: {
  plan: { tier: string; name: string; price: string };
  onClose: () => void;
  cfg: typeof DEFAULT_CONFIG;
}) {
  const [tab, setTab] = useState<"paypal" | "binance" | "bank">("paypal");
  const telegramMsg = encodeURIComponent(
    `Hola! Quiero activar el plan ${plan.name} ($${plan.price}/mes). Adjunto mi comprobante de pago.`
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, backdropFilter: "blur(4px)",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#080d14", border: "1px solid #00e5ff33",
        maxWidth: 480, width: "100%", borderRadius: 4, overflow: "hidden",
      }}>
        <div style={{ height: 2, background: "linear-gradient(90deg,#00e5ff,#e040fb)" }} />
        <div style={{ padding: "28px 32px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#00e5ff", letterSpacing: 4, marginBottom: 6 }}>
                {plan.tier} — OBTENER ACCESO
              </div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 38, color: "#fff", lineHeight: 1 }}>
                {plan.name}
              </div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, color: "#4a6070", marginTop: 4 }}>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: "#00e5ff" }}>${plan.price}</span> / mes
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#4a6070", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 4 }}>✕</button>
          </div>

          {/* Access list */}
          <div style={{ background: "#0d1520", border: "1px solid #1a2535", borderRadius: 4, padding: "14px 18px", marginBottom: 24, fontSize: 13, color: "#4a6070", fontFamily: "'Space Grotesk',sans-serif" }}>
            <div style={{ color: "#00e5ff", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, letterSpacing: 3, marginBottom: 10 }}>ACCESO INCLUIDO</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
              <a href="/aula/" style={{ color: "#00e676", textDecoration: "none", fontSize: 12, letterSpacing: 1 }}>▶ AULA VIRTUAL</a>
              {plan.name !== "BASIC" && (
                <a href="/liquid-map.html" style={{ color: "#00e5ff", textDecoration: "none", fontSize: 12, letterSpacing: 1 }}>⚡ LIQMAP PRO</a>
              )}
            </div>
          </div>

          {/* Payment method tabs */}
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#4a6070", letterSpacing: 3, marginBottom: 12 }}>
            MÉTODO DE PAGO
          </div>
          <div style={{ display: "flex", gap: 1, marginBottom: 20, background: "#0d1520", border: "1px solid #1a2535", borderRadius: 4, overflow: "hidden" }}>
            {([
              { key: "paypal", label: "💳 PayPal / Tarjeta" },
              { key: "binance", label: "🟡 Binance Pay" },
              { key: "bank", label: "🏦 Transferencia" },
            ] as { key: "paypal"|"binance"|"bank"; label: string }[]).map(m => (
              <button key={m.key} onClick={() => setTab(m.key)} style={{
                flex: 1, padding: "10px 6px", background: tab === m.key ? "#00e5ff15" : "none",
                border: "none", borderBottom: tab === m.key ? "2px solid #00e5ff" : "2px solid transparent",
                color: tab === m.key ? "#00e5ff" : "#4a6070",
                fontFamily: "'Share Tech Mono',monospace", fontSize: 10, cursor: "pointer",
                transition: "all 0.15s", letterSpacing: 1,
              }}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Payment content */}
          <div style={{ background: "#0d1520", border: "1px solid #1a2535", borderRadius: 4, padding: "20px 20px 16px", marginBottom: 20 }}>
            {tab === "paypal" && (
              <div>
                <div style={{ fontSize: 12, color: "#4a6070", fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1.7 }}>
                  Realizá el pago por PayPal o con tarjeta de crédito/débito al siguiente correo:
                </div>
                <div style={{
                  margin: "12px 0", padding: "12px 16px",
                  background: "#060a0f", border: "1px solid #00e5ff22",
                  fontFamily: "'Share Tech Mono',monospace", fontSize: 14, color: "#e0f4ff",
                  borderRadius: 3, letterSpacing: 1,
                }}>
                  {cfg.paypal}
                </div>
                <div style={{ fontSize: 11, color: "#2a4a5a", fontFamily: "'Space Grotesk',monospace" }}>
                  PayPal acepta tarjeta de crédito, débito y saldo PayPal.
                </div>
              </div>
            )}
            {tab === "binance" && (
              <div>
                <div style={{ fontSize: 12, color: "#4a6070", fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1.7, marginBottom: 12 }}>
                  Escaneá el código QR con la app de Binance para pagar:
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{
                    background: "#fff", borderRadius: 8, padding: 6,
                    width: 120, height: 120, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}>
                    <img
                      src="/binance-qr.jpg"
                      alt="Binance Pay QR"
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 18%" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#4a6070", fontFamily: "'Share Tech Mono',monospace", letterSpacing: 2, marginBottom: 6 }}>
                      BINANCE ID
                    </div>
                    <div style={{
                      padding: "10px 14px", background: "#060a0f",
                      border: "1px solid #ffd70033", borderRadius: 3,
                      fontFamily: "'Share Tech Mono',monospace", fontSize: 15,
                      color: "#ffd700", letterSpacing: 2, marginBottom: 10,
                    }}>
                      104 421 445 2
                    </div>
                    <div style={{ fontSize: 10, color: "#4a6070", fontFamily: "'Share Tech Mono',monospace", letterSpacing: 2, marginBottom: 6 }}>
                      USUARIO
                    </div>
                    <div style={{
                      padding: "8px 14px", background: "#060a0f",
                      border: "1px solid #ffd70022", borderRadius: 3,
                      fontFamily: "'Share Tech Mono',monospace", fontSize: 13,
                      color: "#e0f4ff", letterSpacing: 1,
                    }}>
                      @{cfg.binance}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#2a4a5a", fontFamily: "'Space Grotesk',sans-serif", marginTop: 10 }}>
                  Podés enviar USDT, BTC u otras criptomonedas.
                </div>
              </div>
            )}
            {tab === "bank" && (
              <div>
                <div style={{ fontSize: 12, color: "#4a6070", fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1.7, marginBottom: 12 }}>
                  Transferencia bancaria — datos:
                </div>
                <div style={{
                  padding: "12px 16px", background: "#060a0f",
                  border: "1px solid #e040fb22", borderRadius: 3,
                  fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: "#e0f4ff",
                  lineHeight: 1.8, whiteSpace: "pre-line" as const,
                }}>
                  {cfg.bank}
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div style={{ background: "#0d1520", border: "1px solid #1a2535", borderRadius: 4, padding: "16px 20px", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#4a6070", letterSpacing: 3, marginBottom: 8 }}>
              PASO FINAL
            </div>
            <div style={{ fontSize: 13, color: "#4a6070", fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1.6, marginBottom: 14 }}>
              Una vez realizado el pago, enviá el comprobante por Telegram y recibís tu usuario y contraseña en minutos.
            </div>
            <a
              href={`${TELEGRAM}?start=plan_${plan.name.toLowerCase()}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "block", textAlign: "center", padding: "14px",
                background: "linear-gradient(135deg,#2CA5E0,#229ED9)",
                color: "#fff", fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: 700, fontSize: 13, letterSpacing: 2, textDecoration: "none",
                borderRadius: 3, transition: "opacity 0.2s",
              }}
            >
              ✈️ ENVIAR COMPROBANTE — @psychometriks_pro
            </a>
          </div>

          <div style={{ textAlign: "center", fontSize: 11, color: "#2a4a5a", fontFamily: "'Space Grotesk',sans-serif" }}>
            Activación manual en horario laboral (Ecuador, UTC-5)
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Auth helper ───────────────────────────────────────────────
function modalAuth() {
  try {
    const raw = localStorage.getItem("psyko_auth");
    if (!raw) return null;
    const s = JSON.parse(shieldRead(raw)) as { user?: string; role?: string; plan?: string; ts?: number; displayName?: string };
    if (Date.now() - (s.ts ?? 0) > 8 * 60 * 60 * 1000) return null;
    return s;
  } catch { return null; }
}

// ── Plan rank — incluye todos los nombres de plan de la DB ────
const MODAL_RANK: Record<string, number> = {
  exchange: 0.5,
  basico: 1, básico: 1, basic: 1,
  aprendiz: 1,
  educacion: 2, educación: 2,
  pro: 3,
  trader: 3,
  elite: 4,
  institucional: 4,
};
function getPlanRank(plan: string) { return MODAL_RANK[(plan ?? "").toLowerCase()] ?? 0; }

// ── Panel definitions ─────────────────────────────────────────
interface MItem { icon: string; label: string; desc: string; href: string; badge?: string; ext?: boolean }
interface MPanel {
  id: string; level: number; label: string; sublabel: string;
  color: string; icon: string; price?: string; adminOnly?: boolean;
  items: MItem[];
}

const ACCESS_PANELS: MPanel[] = [
  {
    id: "gratuito", level: 0, label: "GRATUITO", sublabel: "Sin registro · Contenido libre para todos",
    color: "#546e7a", icon: "🌐",
    items: [
      { icon: "📰", label: "Blog & Análisis",          desc: "Análisis BTC/ETH/macro · SMC · Semanal",              href: "/blog" },
      { icon: "🧠", label: "Test: Tipo de Trader",     desc: "5 perfiles psicológicos · 3 min",                     href: "/tests/tipo-trader" },
      { icon: "⚡", label: "Test: ¿Por qué te liquidan?", desc: "4 perfiles · Diagnóstico de errores",              href: "/tests/por-que-te-liquidan" },
      { icon: "🧬", label: "Test de Psicología",       desc: "Perfil completo · 4 min",                             href: "/tests/psicologia" },
      { icon: "✈️", label: "Canal Telegram",            desc: "Análisis diarios · Alertas · Comunidad PSY",         href: "https://t.me/psychometriks_pro", ext: true, badge: "GRATIS" },
      { icon: "📲", label: "App Mobile",                desc: "Descargá la app PSY",                                 href: "/descarga" },
    ],
  },
  {
    id: "basico", level: 1, label: "BÁSICO", sublabel: "$9 / mes · Nivel 1 · Inicio del camino",
    color: "#00e676", icon: "📚", price: "9",
    items: [
      { icon: "🎓", label: "Aula Virtual N1–N3",        desc: "SMC · Fundamentos · Técnico · 10+ horas",            href: "/aula", badge: "INCLUIDO" },
      { icon: "⚡", label: "Estoy por Entrar",           desc: "Análisis inmediato antes de tu trade",               href: "/pre-entry" },
      { icon: "🧬", label: "ADN del Trader",             desc: "Perfil psicológico completo · 8 preguntas",          href: "/adn-trader" },
      { icon: "💸", label: "Costo de Mis Errores",       desc: "¿Cuánto te costaron tus errores?",                   href: "/costo-errores" },
      { icon: "📐", label: "Position Size Calc",         desc: "Tamaño de posición óptimo",                          href: "/calculadora" },
      { icon: "💀", label: "Simulador de Liquidación",   desc: "Cómo te destruye el mercado",                        href: "/simulador" },
      { icon: "📓", label: "Diario de Trading",          desc: "IA analiza tus errores · Journaling avanzado",       href: "/journal" },
      { icon: "💱", label: "PSY Wallet",                desc: "DEX Exchange · Swap · Portfolio · Auditoría",        href: "/psy-wallet" },
      { icon: "🔐", label: "Bóveda Personal",            desc: "Seeds, claves privadas, TOTP · Solo vos",            href: "/boveda" },
      { icon: "🎓", label: "Certificados PDF",           desc: "Generá tu certificado oficial",                      href: "/certificado" },
      { icon: "💎", label: "Programa de Afiliados",      desc: "Hasta 35% comisión recurrente",                      href: "/affiliate" },
    ],
  },
  {
    id: "educacion", level: 2, label: "EDUCACIÓN", sublabel: "$29 / mes · Nivel 2 · Formación completa",
    color: "#ffd700", icon: "📡", price: "29",
    items: [
      { icon: "🎓", label: "Aula Virtual N1–N5",        desc: "Wyckoff · Smart Money · Macro · 25+ horas",          href: "/aula", badge: "COMPLETO" },
      { icon: "📡", label: "Señales BTC/ETH/SOL",       desc: "Canal Telegram · Señales semanales en vivo",         href: "/signals", badge: "LIVE" },
      { icon: "⏮️", label: "Market Replay",              desc: "Reviví momentos históricos del mercado",             href: "/replay" },
      { icon: "📅", label: "Calendario Económico",       desc: "FOMC · CPI · NFP · Eventos macro",                  href: "/economic-calendar" },
      { icon: "🏆", label: "Leaderboard PSY",            desc: "Historial de señales · Ranking traders",             href: "/leaderboard" },
      { icon: "💱", label: "Conversor Crypto",           desc: "Precios en tiempo real · LATAM friendly",            href: "/converter" },
      { icon: "💱", label: "PSY Wallet",                desc: "DEX Exchange · Swap · Portfolio · Auditoría",        href: "/psy-wallet", badge: "INCLUIDO" },
      { icon: "💧", label: "PSY Liquidity Fuel",         desc: "Liquidez global FED·BOJ·ECB·BOE · Fuel Gauge",      href: "/liquidez-global", badge: "NUEVO" },
      { icon: "🧠", label: "PSY Panels BTC",             desc: "Smart Money · RSI · ADX+CVD · POC · Funding",       href: "/psy-panels-btc", badge: "NUEVO" },
    ],
  },
  {
    id: "pro", level: 3, label: "PRO", sublabel: "$49 / mes · Nivel 3 · Operativa activa",
    color: "#e040fb", icon: "💧", price: "49",
    items: [
      { icon: "💱", label: "PSY Wallet",                desc: "DEX Exchange · Swap · Portfolio · Auditoría",        href: "/psy-wallet", badge: "INCLUIDO" },
      { icon: "💧", label: "LiqMap PRO",                desc: "Mapa de liquidaciones institucional · 24/7",         href: "/liquid-map.html", badge: "PRO" },
      { icon: "📊", label: "LiqMap Normal",             desc: "Visualizador de liquidaciones estándar",             href: "/liqmap" },
      { icon: "🚀", label: "PSY Exchange",              desc: "Tokens · PSY Trust Score · Listá proyectos",         href: "/exchange" },
      { icon: "🧠", label: "PSY Score",                 desc: "Score institucional 0–100",                          href: "/psy-score" },
      { icon: "📡", label: "PSY Screener",              desc: "Top 50 con señales PSY-ULT1",                        href: "/screener" },
      { icon: "🌡️", label: "PSY HeatMap",               desc: "Correlación BTC·ETH·XAU·DXY",                       href: "/heatmap" },
      { icon: "💸", label: "Funding Dashboard",         desc: "Funding rates de todas las exchanges",               href: "/funding" },
      { icon: "⚡", label: "Liquidation Clock",         desc: "Liquidaciones por minuto en tiempo real",            href: "/liquidations" },
      { icon: "🌐", label: "Macro Dashboard",           desc: "DXY · VIX · Bonos · SPX · Yields",                  href: "/macro" },
      { icon: "📊", label: "Spot vs Perpetuos",         desc: "Demanda real · Patrón 2022",                         href: "/spot-perp" },
      { icon: "🔄", label: "Ciclos BTC",                desc: "Stoch RSI bimestral · Fondos históricos",            href: "/ciclos-btc" },
      { icon: "🏛️", label: "FED × BTC",                 desc: "Presidentes FED + Coinbase Premium en vivo",        href: "/fed-btc" },
      { icon: "🕐", label: "Market Hours",              desc: "Estado de mercados mundiales · Sesiones en vivo",   href: "/market-hours" },
      { icon: "⚔️", label: "War Room",                   desc: "Sala de análisis en vivo",                          href: "/war-room" },
    ],
  },
  {
    id: "elite", level: 4, label: "ELITE", sublabel: "$99 / mes · Nivel 4 · Acceso total",
    color: "#00e5ff", icon: "⬡", price: "99",
    items: [
      { icon: "💱", label: "PSY Wallet",                desc: "DEX Exchange · Swap · Portfolio · Auditoría",        href: "/psy-wallet", badge: "INCLUIDO" },
      { icon: "🎓", label: "Aula Virtual N1–N8",        desc: "Todos los niveles · 34 módulos · 50+ horas",         href: "/aula", badge: "TOTAL" },
      { icon: "🪙", label: "Señales Altcoins",          desc: "Top 50 altcoins · HyperLiquid · Tiempo real",        href: "/altcoins-signals", badge: "LIVE" },
      { icon: "🐋", label: "Whale Alert",               desc: "Movimientos +$1M on-chain en tiempo real",           href: "/whale-alert", badge: "LIVE" },
      { icon: "📈", label: "Acciones & Renta Fija",     desc: "LiqMap stocks · Bonds · ETFs",                       href: "/bolsa", badge: "ELITE" },
      { icon: "🏛", label: "Equities Command Center",   desc: "Top 20 acciones · Charts · Macro · Confluencia",     href: "/equities", badge: "ELITE" },
      { icon: "🔮", label: "PSY ORACLE",               desc: "Dashboard institucional · 9 secciones · PSY BRAIN IA (Claude)",  href: "/psy-oracle", badge: "ELITE" },
      { icon: "🧠", label: "PSY BRAIN",                 desc: "Analista IA institucional · Claude Sonnet 4 · 9 tipos de análisis", href: "/psy-brain", badge: "ELITE" },
      { icon: "🦄", label: "IA Trading",                desc: "Trading intradía — análisis cuantitativo multi-timeframe · Memoria y aprendizaje", href: "/ia-trading", badge: "NUEVO" },
      { icon: "📊", label: "IA Trading — Bolsa",         desc: "Acciones y forex — mismo motor, entrada/stop/TPs, sin OI/CVD (no aplica)", href: "/ia-trading-bolsa", badge: "NUEVO" },
      { icon: "🚀", label: "SEÑALES FUERTES CONFIRMADAS", desc: "Scalping rápido — Altcoins con doble confirmación · Técnico + IA multi-timeframe", href: "/ia-signals", badge: "NUEVO" },
    ],
  },
  {
    id: "admin", level: 5, label: "ADMINISTRADOR", sublabel: "Solo superadmin · Control total de la plataforma",
    color: "#ffd700", icon: "⚙️", adminOnly: true,
    items: [
      { icon: "👥", label: "Gestión de Usuarios",       desc: "Crear · Editar · Activar · Revocar",                 href: "/dashboard" },
      { icon: "📡", label: "Señales Realtime",           desc: "Publicar señales al canal",                          href: "/realtime" },
      { icon: "🤖", label: "Bot X",                     desc: "Panel del bot de Telegram",                          href: "/bot-x" },
      { icon: "💰", label: "Revenue",                   desc: "MRR · ARR · Distribución de planes",                 href: "/dashboard" },
    ],
  },
];

// ── Quick Access Modal — 6 paneles con acordeón ───────────────
function QuickAccessModal({ onClose }: { onClose: () => void }) {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const auth = modalAuth();
  const userPlan  = (auth?.plan ?? "").toLowerCase();
  const userRank  = getPlanRank(userPlan);
  const isAdmin   = auth?.role === "superadmin" || auth?.role === "operator";
  const loggedIn  = !!auth;

  function canUse(panel: MPanel) {
    if (panel.adminOnly) return isAdmin;
    if (panel.level === 0) return true;
    if (!loggedIn) return false;
    if (isAdmin) return true;
    return userRank >= panel.level;
  }

  function openPanel(id: string) {
    const panel = ACCESS_PANELS.find(p => p.id === id);
    if (!panel) return;
    // Free panel → always open
    if (panel.level === 0) { setActivePanel(id); return; }
    // Admin panel → must be admin
    if (panel.adminOnly && !isAdmin) return;
    // Paid panels → must be logged in; if not, go to login then return here
    if (!loggedIn) {
      setLocation(`/login?redirect=${encodeURIComponent("/?modal=access")}`);
      return;
    }
    setActivePanel(id);
  }

  const open = ACCESS_PANELS.find(p => p.id === activePanel);

  // ── Detail view ─────────────────────────────────────────────
  const DetailView = ({ panel }: { panel: MPanel }) => {
    const unlocked = canUse(panel);
    const c = panel.color;
    return (
      <div>
        {/* Back bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
          borderBottom: `1px solid ${c}22`, cursor: "pointer", background: `${c}08`,
        }} onClick={() => setActivePanel(null)}>
          <span style={{ color: c, fontSize: 16 }}>←</span>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: c, letterSpacing: 2, textTransform: "uppercase" as const }}>
            VOLVER A LOS NIVELES
          </span>
        </div>

        {/* Panel header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${c}18` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>{unlocked ? panel.icon : "🔒"}</span>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: unlocked ? c : "#2a4a5a", lineHeight: 1 }}>
              {panel.label}
            </span>
            <span style={{
              fontFamily: "'Share Tech Mono',monospace", fontSize: 8, letterSpacing: 2,
              padding: "2px 8px", border: `1px solid ${unlocked ? c + "55" : "#1a2535"}`,
              color: unlocked ? c : "#2a4a5a", background: unlocked ? `${c}0d` : "transparent",
            }}>
              {panel.level === 0 ? "GRATIS" : panel.adminOnly ? "ADMIN" : unlocked ? "✓ ACTIVO" : `$${panel.price}/mes`}
            </span>
          </div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: "#4a6070" }}>{panel.sublabel}</div>
        </div>

        {/* Items */}
        <div style={{ padding: "14px 20px", display: "grid", gap: 8 }}>
          {panel.items.map((item, i) => {
            if (!unlocked) {
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", background: "#060a0f", border: "1px solid #0d1520", borderRadius: 3,
                }}>
                  <span style={{ fontSize: 16, opacity: 0.25, flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: 600, color: "#2a4a5a" }}>{item.label}</div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, color: "#1a2535" }}>{item.desc}</div>
                  </div>
                  <span style={{ color: "#1a2535", fontSize: 11 }}>🔒</span>
                </div>
              );
            }
            const isExt = item.ext || item.href.startsWith("http");
            return (
              <a key={i} href={item.href}
                target={isExt ? "_blank" : undefined}
                rel={isExt ? "noopener noreferrer" : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 12, textDecoration: "none",
                  padding: "10px 14px", background: `${c}08`, border: `1px solid ${c}22`,
                  borderRadius: 3, transition: "border-color 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = c + "88")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = c + "22")}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                    <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: 600, color: "#e0f0ff" }}>{item.label}</span>
                    {item.badge && (
                      <span style={{
                        fontFamily: "'Share Tech Mono',monospace", fontSize: 7, letterSpacing: 1,
                        padding: "1px 5px", border: `1px solid ${c}55`, color: c, background: `${c}15`,
                      }}>{item.badge}</span>
                    )}
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, color: "#4a6070", marginTop: 1 }}>{item.desc}</div>
                </div>
                <span style={{ color: c, fontSize: 13, opacity: 0.7 }}>→</span>
              </a>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{ padding: "0 20px 18px" }}>
          {unlocked ? (
            <a href={panel.id === "admin" ? "/dashboard" : panel.items[0]?.href ?? "#"}
              style={{
                display: "block", textAlign: "center", padding: "11px",
                background: c, color: "#020408",
                fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: 700,
                letterSpacing: 2, textDecoration: "none",
              }}>
              {panel.id === "admin" ? "ABRIR PANEL MAESTRO →" : `INGRESAR A ${panel.label} →`}
            </a>
          ) : (
            <a href="/pricing" style={{
              display: "block", textAlign: "center", padding: "11px",
              border: `1px solid ${c}44`, color: c,
              fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: 700,
              letterSpacing: 2, textDecoration: "none", background: `${c}08`,
            }}>
              🔒 ACTIVAR {panel.label}{panel.price ? ` — $${panel.price}/mes` : ""} →
            </a>
          )}
        </div>
      </div>
    );
  };

  // ── Panel list view ─────────────────────────────────────────
  const ListView = () => (
    <div style={{ padding: "22px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, letterSpacing: 4, color: "#00e5ff" }}>
          YA SOY CLIENTE
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#4a6070", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 0 }}>✕</button>
      </div>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: "#4a6070", marginBottom: 18 }}>
        {loggedIn
          ? `Conectado como ${(auth?.displayName ?? auth?.user ?? "").toUpperCase()} · Seleccioná tu nivel`
          : "Seleccioná tu nivel de acceso"}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {ACCESS_PANELS.map(panel => {
          if (panel.adminOnly && !isAdmin) return null;
          const unlocked = canUse(panel);
          const c = panel.color;
          return (
            <div key={panel.id} onClick={() => openPanel(panel.id)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 18px", cursor: "pointer",
                background: unlocked ? `${c}08` : "#040608",
                border: `1px solid ${unlocked ? c + "33" : "#1a2535"}`,
                borderRadius: 3, opacity: unlocked ? 1 : 0.55,
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={e => { if (unlocked) { e.currentTarget.style.borderColor = c + "88"; e.currentTarget.style.background = c + "14"; } }}
              onMouseLeave={e => { if (unlocked) { e.currentTarget.style.borderColor = c + "33"; e.currentTarget.style.background = c + "08"; } }}
            >
              {/* Level badge */}
              <div style={{
                width: 38, height: 38, flexShrink: 0, borderRadius: 4,
                background: unlocked ? `${c}15` : "#0d1520",
                border: `1px solid ${unlocked ? c + "44" : "#1a2535"}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>
                {unlocked ? panel.icon : "🔒"}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: unlocked ? c : "#2a4a5a", lineHeight: 1 }}>
                    {panel.label}
                  </span>
                  <span style={{
                    fontFamily: "'Share Tech Mono',monospace", fontSize: 7, letterSpacing: 2,
                    padding: "1px 6px", border: `1px solid ${unlocked ? c + "44" : "#1a253555"}`,
                    color: unlocked ? c : "#2a4a5a",
                  }}>
                    {panel.level === 0 ? "GRATIS" : panel.adminOnly ? "ADMIN" : unlocked ? "✓ ACTIVO" : `$${panel.price}/mes`}
                  </span>
                </div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, color: unlocked ? "#4a6070" : "#2a4a5a", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {panel.sublabel}
                </div>
              </div>

              <span style={{ color: unlocked ? c : "#2a4a5a", fontSize: 14, flexShrink: 0, opacity: 0.7 }}>›</span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #1a2535", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/pricing" style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: "#4a6070", textDecoration: "none" }}>
          ¿Sin acceso? Ver planes →
        </a>
        {loggedIn && (
          <button onClick={() => { localStorage.removeItem("psyko_auth"); setLocation("/login"); }}
            style={{ background: "none", border: "none", fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, color: "#4a6070", cursor: "pointer" }}>
            Cerrar sesión
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, backdropFilter: "blur(4px)",
    }} onClick={() => { if (!activePanel) onClose(); }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#080d14",
        border: `1px solid ${open ? open.color + "55" : "#00e5ff33"}`,
        maxWidth: 500, width: "100%", borderRadius: 4, overflow: "hidden",
        maxHeight: "92vh", overflowY: "auto",
        transition: "border-color 0.2s",
      }}>
        <div style={{ height: 2, background: "linear-gradient(90deg,#546e7a,#00e676,#ffd700,#e040fb,#00e5ff,#ffd700)" }} />
        {open ? <DetailView panel={open} /> : <ListView />}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [paymentPlan, setPaymentPlan] = useState<null | { tier: string; name: string; price: string }>(null);
  const [showAccess, setShowAccess] = useState(false);
  const [cfg, setCfg] = useState<typeof DEFAULT_CONFIG>(DEFAULT_CONFIG);

  useEffect(() => {
    setCfg(loadConfig());
    const timer = setTimeout(() => setShowIntro(false), 2800);
    // Auto-open ACCESO DIRECTO if returning from login with ?modal=access
    const params = new URLSearchParams(window.location.search);
    if (params.get("modal") === "access") {
      try {
        const raw = localStorage.getItem("psyko_auth");
        if (raw) {
          const s = JSON.parse(shieldRead(raw)) as { ts?: number };
          if (Date.now() - (s.ts ?? 0) <= 8 * 60 * 60 * 1000) {
            setTimeout(() => setShowAccess(true), 1200);
          }
        }
      } catch {}
    }
    return () => clearTimeout(timer);
  }, []);

  const plans = [
    {
      tier: "NIVEL 1", name: "BÁSICO", price: (cfg.prices as any).basic ?? "9", featured: false, badge: undefined as string | undefined,
      color: "#00e676",
      features: [
        "✔ Aula Virtual completa (8 niveles, 44+ módulos)",
        "✔ Herramientas psicológicas (Pre-Entry, ADN Trader, Costo Errores)",
        "✔ Blog y contenido educativo",
        "✔ Soporte por Telegram",
      ],
      access: ["aula"],
    },
    {
      tier: "NIVEL 2", name: "EDUCACIÓN", price: (cfg.prices as any).educacion ?? "29", featured: false, badge: undefined as string | undefined,
      color: "#e040fb",
      features: [
        "✔ Todo lo del plan Básico",
        "✔ Indicadores institucionales base",
        "✔ Señales BTC / ETH / SOL",
        "✔ Análisis de mercado semanal",
        "✔ Acceso al canal de señales",
      ],
      access: ["aula", "signals"],
    },
    {
      tier: "NIVEL 3", name: "PRO", price: (cfg.prices as any).pro ?? "49", featured: true, badge: "MÁS POPULAR" as string | undefined,
      color: "#00e5ff",
      features: [
        "✔ Todo lo del plan Educación",
        "✔ ⚡ LiqMap PRO en tiempo real",
        "✔ Score PSY + Anti-Liquidación",
        "✔ Señales en tiempo real 24/7",
        "✔ Análisis IA diario",
        "✔ Indicadores PRO completos",
      ],
      access: ["aula", "liqmap", "signals"],
    },
    {
      tier: "NIVEL 4", name: "ELITE", price: (cfg.prices as any).elite ?? "99", featured: false, badge: "TOP" as string | undefined,
      color: "#ffd700",
      features: [
        "✔ Todo lo del plan Pro",
        "✔ Acciones & Renta Fija (LiqMap Stocks)",
        "✔ Panel altcoins top 50 con señales",
        "✔ Whale Tracker Hyperliquid",
        "✔ Mentoring personalizado",
        "✔ Acceso anticipado a módulos nuevos",
        "✔ Prioridad máxima en soporte",
      ],
      access: ["aula", "liqmap", "signals", "stocks", "altcoins", "mentoring"],
    },
  ];

  return (
    <div className="relative min-h-screen text-white bg-background overflow-x-hidden font-rajdhani z-10">
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
            onClick={() => setShowIntro(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background cursor-pointer"
            style={{ backgroundImage: 'linear-gradient(rgba(0,229,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,.04) 1px,transparent 1px)', backgroundSize: '40px 40px' }}
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} className="text-center">
              <h1 className="font-orbitron text-4xl md:text-6xl font-black tracking-[0.3em] text-[#00e5ff]">PSYCHOMETRIKS</h1>
              <p className="font-sharetech text-muted-foreground mt-4 tracking-[0.2em] text-sm">INITIALIZING SECURE CONNECTION...</p>
              <div className="w-64 h-1 bg-border mt-8 mx-auto overflow-hidden relative">
                <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="absolute inset-0 bg-[#00e5ff]" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-40 px-6 md:px-12 py-5 flex items-center justify-between bg-gradient-to-b from-[#020408]/95 to-transparent backdrop-blur-md">
        <div className="font-space text-[13px] font-bold text-[#00e5ff] tracking-[0.2em] uppercase">
          PSY<span className="text-white">CHOMETRIKS</span>
        </div>
        <div className="hidden md:flex gap-7 items-center">
          <a href="#features" style={{ fontFamily: "'Exo 2', 'Space Grotesk', sans-serif", fontSize: 11, color: "#7ab3c8", letterSpacing: "0.14em", textDecoration: "none", textTransform: "uppercase" as const, transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#00e5ff")} onMouseLeave={e => (e.currentTarget.style.color = "#7ab3c8")}>Suite</a>
          <a href="/indicators" style={{ fontFamily: "'Exo 2', 'Space Grotesk', sans-serif", fontSize: 11, color: "#7ab3c8", letterSpacing: "0.14em", textDecoration: "none", textTransform: "uppercase" as const, transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#00e5ff")} onMouseLeave={e => (e.currentTarget.style.color = "#7ab3c8")}>Indicadores</a>
          <a href="/blog" style={{ fontFamily: "'Exo 2', 'Space Grotesk', sans-serif", fontSize: 11, color: "#7ab3c8", letterSpacing: "0.14em", textDecoration: "none", textTransform: "uppercase" as const, transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#00e5ff")} onMouseLeave={e => (e.currentTarget.style.color = "#7ab3c8")}>Blog</a>

          {/* PSY LAUNCH — destacado naranja-amarillo */}
          <a href="/psy-launch" style={{
            fontFamily: "'Exo 2', 'Space Grotesk', sans-serif",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.18em",
            textDecoration: "none",
            textTransform: "uppercase" as const,
            background: "linear-gradient(135deg, #ff6b00, #ffd700, #ff9a00)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 10px rgba(255,160,0,0.55))",
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 10px",
            border: "1px solid rgba(255,160,0,0.35)",
            borderRadius: 3,
            position: "relative" as const,
          }}
            onMouseEnter={e => { e.currentTarget.style.filter = "drop-shadow(0 0 18px rgba(255,160,0,0.9))"; e.currentTarget.style.borderColor = "rgba(255,160,0,0.7)"; }}
            onMouseLeave={e => { e.currentTarget.style.filter = "drop-shadow(0 0 10px rgba(255,160,0,0.55))"; e.currentTarget.style.borderColor = "rgba(255,160,0,0.35)"; }}
          >
            <span style={{ fontSize: 13, WebkitTextFillColor: "initial" }}>🚀</span>
            PSY Launch
            <span style={{
              position: "absolute" as const,
              top: -6,
              right: -6,
              background: "linear-gradient(135deg,#ff6b00,#ffd700)",
              borderRadius: 99,
              fontSize: 7,
              fontWeight: 900,
              letterSpacing: "0.1em",
              color: "#020408",
              padding: "1px 5px",
              WebkitTextFillColor: "#020408",
              boxShadow: "0 0 8px rgba(255,160,0,0.6)",
            }}>NEW</span>
          </a>

          <a href="/pricing" style={{ fontFamily: "'Exo 2', 'Space Grotesk', sans-serif", fontSize: 11, color: "#7ab3c8", letterSpacing: "0.14em", textDecoration: "none", textTransform: "uppercase" as const, transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#00e5ff")} onMouseLeave={e => (e.currentTarget.style.color = "#7ab3c8")}>Planes</a>
          <a href="/descarga" style={{ fontFamily: "'Exo 2', 'Space Grotesk', sans-serif", fontSize: 11, color: "#00e5ff", letterSpacing: "0.14em", textDecoration: "none", textTransform: "uppercase" as const, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00e5ff", display: "inline-block", animation: "pulse 1.5s infinite" }} />📲 App
          </a>
          <button onClick={() => setShowAccess(true)}
            className="font-space text-[11px] border border-[#00e5ff44] text-[#00e5ff] px-5 py-2.5 font-bold tracking-[0.15em] uppercase hover:bg-[#00e5ff15] transition-colors">
            Ya soy cliente
          </button>
          <a href="/pricing" className="font-space text-[11px] bg-[#00e5ff] text-[#020408] px-5 py-2.5 font-bold tracking-[0.15em] uppercase hover:bg-white transition-colors">
            Suscribirme
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col justify-center px-6 md:px-12 pt-32 pb-20 relative overflow-hidden">
        {/* Grid bg */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(0,229,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,.03) 1px,transparent 1px)",
          backgroundSize: "50px 50px",
        }} />

        <div className="font-space text-[11px] text-[#00e5ff] tracking-[0.3em] uppercase mb-6 flex items-center gap-3 relative z-10">
          <div className="flex items-center gap-1.5 text-[#00e676]">
            <div className="w-1.5 h-1.5 bg-[#00e676] rounded-full animate-pulse" /> LIVE
          </div>
          · SISTEMA ACTIVO
        </div>

        <h1 style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: "clamp(52px, 8.5vw, 118px)",
          fontWeight: 900,
          lineHeight: 0.95,
          letterSpacing: "-0.01em",
          marginBottom: 16,
          position: "relative",
          zIndex: 10,
        }}>
          <span style={{
            background: "linear-gradient(135deg, #e0f7ff 0%, #00e5ff 50%, #7ab3c8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 32px rgba(0,229,255,0.25))",
            display: "block",
          }}>DESCUBRÍ CÓMO</span>

          <span style={{ display: "block" }}>
            <span style={{
              background: "linear-gradient(135deg, #e040fb, #ff4081, #ff6ec7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 28px rgba(224,64,251,0.5))",
              fontStyle: "italic",
            }}>PENSÁS</span>
            <span style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}> AL TRADEAR</span>
          </span>

          <span style={{
            background: "linear-gradient(135deg, #ff6b00, #ffaa00, #ffd700)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 20px rgba(255,160,0,0.4))",
            display: "block",
            fontSize: "0.82em",
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}>Y EVITÁ LIQUIDACIONES</span>
        </h1>

        <p className="text-[#7ab3c8] text-base max-w-xl leading-[1.8] my-6 font-light relative z-10">
          El 90% de las liquidaciones no son por análisis malo —{" "}
          <strong className="text-white font-medium">son errores psicológicos predecibles y repetibles.</strong>{" "}
          Encontrá el tuyo en 3 minutos.
        </p>

        {/* Primary CTA: Test */}
        <div className="flex gap-4 flex-wrap mb-4 relative z-10">
          <a href="/tests/tipo-trader"
            className="bg-[#00e5ff] text-[#020408] font-space text-xs font-bold tracking-[0.15em] uppercase px-8 py-4 hover:bg-white transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_rgba(0,229,255,0.4)] flex items-center gap-2"
          >
            🧠 HACER EL TEST GRATIS →
          </a>
          <button onClick={() => setShowAccess(true)}
            className="border border-[#1a2535] font-space text-xs tracking-[0.15em] uppercase px-8 py-4 hover:border-[#2a3a50] transition-all flex items-center gap-2"
            style={{ color: "#4a6070" }}>
            Ya soy cliente
          </button>
        </div>

        {/* Social proof pills */}
        <div className="flex gap-4 flex-wrap relative z-10">
          {[
            { icon: "💀", text: "Simulador de liquidación personal" },
            { icon: "🧠", text: "3 tests psicológicos gratuitos" },
            { icon: "⚡", text: "LiqMap PRO en tiempo real" },
          ].map(pill => (
            <div key={pill.text} className="flex items-center gap-2 font-sharetech text-[10px] text-[#5a8898] tracking-widest border border-[#0d1520] px-3 py-1.5">
              <span>{pill.icon}</span> {pill.text}
            </div>
          ))}
        </div>

        {/* Test mini-card */}
        <div className="mt-12 max-w-sm border border-[#00e5ff22] p-5 relative z-10 hover:border-[#00e5ff44] transition-colors">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00e5ff] to-transparent" />
          <div className="font-sharetech text-[8px] text-[#00e5ff] tracking-[0.3em] uppercase mb-2">
            TEST RECOMENDADO
          </div>
          <div className="font-bebas text-2xl text-white mb-1">
            ¿Qué tipo de trader eres?
          </div>
          <div className="font-rajdhani text-[#7ab3c8] text-sm mb-4">
            5 perfiles posibles · 10 preguntas · 3 minutos
          </div>
          <div className="flex gap-2 flex-wrap">
            {["😱 FOMO", "🔥 Impulsivo", "⚔️ Disciplinado", "🔬 Analítico", "🎯 Cazador"].map(tag => (
              <span key={tag} className="font-sharetech text-[8px] px-2 py-0.5 border border-[#1a2535] text-[#5a8898]">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="bg-[#0d1520] border-y border-[#1a2535] py-3 overflow-hidden relative">
        <div className="flex gap-16 whitespace-nowrap animate-[ticker_25s_linear_infinite] w-max">
          {[...Array(2)].flatMap((_, dup) =>
            [
              { pair: "BTC/USDT", price: "$77,600", up: true },
              { pair: "ETH/USDT", price: "$3,200", up: true },
              { pair: "SOL/USDT", price: "$185.4", up: false },
              { pair: "BNB/USDT", price: "$610.2", up: true },
              { pair: "XRP/USDT", price: "$0.65", up: false },
              { pair: "ADA/USDT", price: "$0.55", up: true },
            ].map((coin, i) => (
              <span key={`${dup}-${i}`} className="font-space text-[11px] text-[#7ab3c8] flex gap-2 items-center">
                {coin.pair} <span className={coin.up ? "text-[#00e676]" : "text-[#ff1744]"}>{coin.price} {coin.up ? "↑" : "↓"}</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ── PSY EXCHANGE + WALLET + REGISTER ─────────────────────── */}
      <section className="relative px-6 md:px-12 py-20 border-b border-[#1a2535] overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.06]"
            style={{ background: "radial-gradient(circle,#ffd700,transparent 70%)" }} />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-[0.05]"
            style={{ background: "radial-gradient(circle,#00e676,transparent 70%)" }} />
          <div className="absolute inset-0"
            style={{ backgroundImage: "linear-gradient(rgba(255,215,0,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,215,0,.02) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>

        {/* Header */}
        <div className="relative z-10 text-center mb-12">
          <div className="inline-flex items-center gap-2 font-space text-[10px] text-[#ffd700] tracking-[0.4em] uppercase mb-4 border border-[#ffd70022] px-4 py-1.5">
            <span className="w-1.5 h-1.5 bg-[#ffd700] rounded-full animate-pulse" />
            4 PILARES DE INGRESOS · GRATIS · SIN TARJETA
          </div>
          <h2 className="font-bebas text-[clamp(48px,7vw,96px)] leading-none text-white">
            EL ECOSISTEMA <span className="text-[#ffd700]">COMPLETO</span><br />
            EN UN SOLO LUGAR
          </h2>
          <p className="font-space text-[13px] text-[#7ab3c8] mt-4 max-w-xl mx-auto leading-relaxed">
            Exchange DeFi, Wallet multi-chain, Token Factory y el $PSY Token oficial — todo desde tu cuenta PSYCHOMETRIKS.
          </p>
        </div>

        {/* 4 Pillar Cards */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 max-w-7xl mx-auto mb-10">
          {/* Exchange Card */}
          <Link href="/exchange"
            className="group border bg-[#060a0f] p-7 no-underline block relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(255,215,0,0.08)]"
            style={{ borderColor: "#ffd70033" }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#ffd700] via-[#ffd70080] to-transparent" />
            <div className="absolute top-0 right-0 font-space text-[8px] text-[#ffd700] tracking-[0.2em] border-l border-b border-[#ffd70022] px-3 py-1.5 bg-[#ffd70008]">
              GRATIS
            </div>
            <div className="text-4xl mb-4">🚀</div>
            <div className="font-bebas text-3xl text-[#ffd700] mb-2">PSY EXCHANGE</div>
            <p className="font-space text-[11px] text-[#7ab3c8] leading-relaxed mb-5">
              SWAP de tokens ERC-20 con las mejores rutas de liquidez vía 0x Protocol. Sin comisiones ocultas. Sin custodia.
            </p>
            <div className="space-y-2">
              {["⚡ Swap instantáneo · Mejor precio garantizado","🔒 Non-custodial · Tus fondos, tu control","🌐 Ethereum, Polygon, Arbitrum, Base"].map(f => (
                <div key={f} className="flex items-center gap-2 font-space text-[10px] text-[#7ab3c8]">
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 font-space text-[10px] font-bold text-[#ffd700] tracking-[0.15em] group-hover:tracking-[0.2em] transition-all">
              IR AL EXCHANGE →
            </div>
          </Link>

          {/* Wallet Card */}
          <Link href="/psy-wallet"
            className="group border bg-[#060a0f] p-7 no-underline block relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(0,230,118,0.08)]"
            style={{ borderColor: "#00e67633" }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00e676] via-[#00e67680] to-transparent" />
            <div className="absolute top-0 right-0 font-space text-[8px] text-[#00e676] tracking-[0.2em] border-l border-b border-[#00e67622] px-3 py-1.5 bg-[#00e67608]">
              GRATIS
            </div>
            <div className="text-4xl mb-4">💎</div>
            <div className="font-bebas text-3xl text-[#00e676] mb-2">PSY WALLET</div>
            <p className="font-space text-[11px] text-[#7ab3c8] leading-relaxed mb-5">
              Conectá MetaMask y operá directamente desde tu cuenta PSY. Firma transacciones DeFi sin salir de la plataforma.
            </p>
            <div className="space-y-2">
              {["🦊 MetaMask · WalletConnect · Coinbase Wallet","🔐 AES-256-GCM · PSY Vault integrado","⛓️ Multi-chain · ETH · Polygon · Arbitrum"].map(f => (
                <div key={f} className="flex items-center gap-2 font-space text-[10px] text-[#7ab3c8]">
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 font-space text-[10px] font-bold text-[#00e676] tracking-[0.15em] group-hover:tracking-[0.2em] transition-all">
              ABRIR WALLET →
            </div>
          </Link>

          {/* PSY Launch — Token Factory */}
          <Link href="/psy-launch"
            className="group border bg-[#060a0f] p-7 no-underline block relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(255,160,0,0.08)]"
            style={{ borderColor: "#ff9a0033" }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#ff6b00] via-[#ffd700] to-transparent" />
            <div className="absolute top-0 right-0 font-space text-[8px] text-[#ffd700] tracking-[0.2em] border-l border-b border-[#ffd70022] px-3 py-1.5 bg-[#ffd70008]">
              NEW
            </div>
            <div className="text-4xl mb-4">🏭</div>
            <div className="font-bebas text-3xl leading-none mb-2" style={{ background: "linear-gradient(135deg,#ff6b00,#ffd700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              TOKEN FACTORY<br /><span className="text-2xl">PSY LAUNCH</span>
            </div>
            <p className="font-space text-[11px] text-[#7ab3c8] leading-relaxed mb-5">
              Lanzá tu propio token con curva de bonding automática en BSC. Sin código. Sin intermediarios. Tu proyecto, tu comunidad.
            </p>
            <div className="space-y-2">
              {["⚙️ Deploy guiado · 0.01 BNB creación","📈 Bonding curve · Precio sube con demanda","🎓 Graduación automática a PancakeSwap"].map(f => (
                <div key={f} className="flex items-center gap-2 font-space text-[10px] text-[#7ab3c8]">
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 font-space text-[10px] font-bold tracking-[0.15em] group-hover:tracking-[0.2em] transition-all" style={{ color: "#ff9a00" }}>
              LANZAR TOKEN →
            </div>
          </Link>

          {/* PSY Token oficial */}
          <Link href="/psy-token"
            className="group border bg-[#060a0f] p-7 no-underline block relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(168,85,247,0.08)]"
            style={{ borderColor: "#a855f733" }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#a855f7] via-[#a855f780] to-transparent" />
            <div className="absolute top-0 right-0 font-space text-[8px] text-[#a855f7] tracking-[0.2em] border-l border-b border-[#a855f722] px-3 py-1.5 bg-[#a855f708]">
              IDO PRÓXIMO
            </div>
            <div className="text-4xl mb-4">🪙</div>
            <div className="font-bebas text-3xl text-[#a855f7] leading-none mb-2">LANZAMIENTO<br /><span className="text-2xl">$PSY TOKEN</span></div>
            <p className="font-space text-[11px] text-[#7ab3c8] leading-relaxed mb-5">
              El token oficial del ecosistema PSYCHOMETRIKS. Acceso premium, governance y rewards para holders tempranos.
            </p>
            <div className="space-y-2">
              {["💎 Whitelist abierta · 30% descuento IDO","🗳️ Governance · Votá el futuro de la plataforma","📡 Holders acceden a señales institucionales"].map(f => (
                <div key={f} className="flex items-center gap-2 font-space text-[10px] text-[#7ab3c8]">
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 font-space text-[10px] font-bold text-[#a855f7] tracking-[0.15em] group-hover:tracking-[0.2em] transition-all">
              VER $PSY TOKEN →
            </div>
          </Link>
        </div>

        {/* CTA */}
        <div className="relative z-10 text-center">
          <Link href="/login"
            className="inline-flex items-center gap-3 bg-[#00e676] text-[#020408] font-space text-sm font-bold tracking-[0.15em] uppercase px-10 py-5 no-underline hover:bg-white transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,230,118,0.35)]"
          >
            ✅ CREAR CUENTA GRATIS →
          </Link>
          <div className="mt-4 font-space text-[10px] text-[#5a8898] tracking-[0.1em]">
            Acceso inmediato · Sin tarjeta de crédito · Cancelación en cualquier momento
          </div>
          <div className="mt-3">
            <button onClick={() => setShowAccess(true)}
              className="font-space text-[10px] text-[#5a8898] hover:text-[#7ab3c8] transition-colors tracking-widest underline underline-offset-4">
              Ya tengo cuenta → Ingresar
            </button>
          </div>
        </div>
      </section>

      {/* NEW — 3 Psychological Tools Strip */}
      <section className="px-6 md:px-12 py-16 border-b border-[#1a2535]">
        <div className="font-space text-[10px] text-[#ff1744] tracking-[0.4em] uppercase mb-4 flex items-center gap-3">
          🆕 NUEVAS HERRAMIENTAS <div className="h-px bg-[#ff174422] flex-1 max-w-[120px]" />
        </div>
        <h2 className="font-bebas text-4xl md:text-6xl leading-none mb-10">
          EL MERCADO TE CONOCE.<br /><span className="text-[#ff1744]">¿VOS TE CONOCÉS?</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              href: "/pre-entry",
              icon: "⚡",
              label: "ESTOY POR ENTRAR",
              color: "#00e5ff",
              desc: "Analizá tu setup ANTES de apretar el botón. Liquidación, R:R, alertas psicológicas — en 10 segundos.",
              cta: "ANALIZAR MI ENTRADA →",
              badge: "BÁSICO+",
              badgeColor: "#00e676",
            },
            {
              href: "/adn-trader",
              icon: "🧬",
              label: "ADN DEL TRADER",
              color: "#e040fb",
              desc: "8 preguntas. El sistema detecta tu patrón real. ¿Sos el Predador, el Kamikaze, o el Fantasma?",
              cta: "DESCUBRIR MI ADN →",
              badge: "BÁSICO+",
              badgeColor: "#00e676",
            },
            {
              href: "/costo-errores",
              icon: "💸",
              label: "COSTO DE MIS ERRORES",
              color: "#ffd700",
              desc: "FOMO, revenge trading, sobrealancamiento. Calculá exactamente cuánto te costaron en dólares.",
              cta: "CALCULAR MI PÉRDIDA →",
              badge: "BÁSICO+",
              badgeColor: "#00e676",
            },
          ].map(tool => (
            <Link key={tool.href} href={tool.href}
              className="group border border-[#1a2535] bg-[#060a0f] p-6 no-underline transition-all hover:border-opacity-60 block relative overflow-hidden"
              style={{ borderColor: `${tool.color}22` }}>
              <div className="absolute top-0 left-0 w-full h-0.5 transition-all" style={{ background: tool.color }} />
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{tool.icon}</span>
                <span className="font-space text-[9px] px-2 py-0.5 tracking-[0.15em]"
                  style={{ color: (tool as any).badgeColor ?? tool.color, background: `${(tool as any).badgeColor ?? tool.color}15`, border: `1px solid ${(tool as any).badgeColor ?? tool.color}33` }}>
                  {tool.badge}
                </span>
              </div>
              <div className="font-bebas text-2xl mb-2" style={{ color: tool.color }}>{tool.label}</div>
              <p className="font-space text-[11px] text-[#7ab3c8] leading-relaxed mb-5">{tool.desc}</p>
              <div className="font-space text-[10px] font-bold tracking-[0.15em] uppercase transition-all"
                style={{ color: tool.color }}>
                {tool.cta}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 md:px-12 py-24">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4 flex items-center gap-3">
          Suite de Módulos <div className="h-px bg-[#1a2535] flex-1 max-w-[80px]" />
        </div>
        <h2 className="font-bebas text-5xl md:text-7xl leading-none mb-5">EL ARSENAL<br />COMPLETO</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1a2535] border border-[#1a2535] mt-16">
          {[
            { code: "EDU-AULA", name: "Aula Virtual", desc: "Educación de 0 a 100 en trading institucional. 8 niveles, 44+ módulos.", tag: "BÁSICO+", color: "#00e676", href: "/aula" as string | null },
            { code: "SIG-MAP", name: "LiqMap PRO", desc: "Heatmap de liquidaciones en tiempo real. Score PSY, funding rate, análisis IA.", tag: "PRO+", color: "#00e5ff", href: "/liquid-map.html" as string | null },
            { code: "BOT-TG", name: "Señales en Vivo", desc: "Señales de entrada/salida automáticas 24/7. BTC, ETH, SOL y altcoins.", tag: "EDUCACIÓN+", color: "#e040fb", href: "/signals" as string | null },
            { code: "AI-ANALYSIS", name: "Análisis IA", desc: "Narrativa automática del mercado basada en datos institucionales en vivo.", tag: "PRO+", color: "#ffd700", href: "/indicators" as string | null },
            { code: "MKT-STOCKS", name: "Acciones & Renta Fija", desc: "LiqMap de stocks, bonds, ETFs. Análisis institucional de mercados tradicionales.", tag: "ELITE", color: "#40c4ff", href: "/bolsa" as string | null },
            { code: "EQ-CENTER", name: "Equities Command Center", desc: "Top 20 acciones globales · Charts IA · Correlaciones macro · Wyckoff · Elliott.", tag: "ELITE", color: "#ffd700", href: "/equities" as string | null },
            { code: "WHALE-HL", name: "Whale Tracker", desc: "Rastreo de ballenas en Hyperliquid en tiempo real. Alertas de posiciones masivas.", tag: "ELITE", color: "#ff6d00", href: "/whale-alert" as string | null },
          ].map((feat, i) => {
            const inner = (
              <>
                <div className="absolute top-0 left-0 w-[3px] h-0 transition-all duration-300 group-hover:h-full" style={{ background: feat.color }} />
                <div className="font-space text-[10px] tracking-[0.2em] mb-3" style={{ color: feat.color }}>{feat.code}</div>
                <div className="font-bebas text-3xl text-white mb-2">{feat.name}</div>
                <div className="text-[13px] text-[#7ab3c8] leading-[1.6]">{feat.desc}</div>
                <div className="inline-block mt-4 font-space text-[10px] px-2.5 py-1 tracking-[0.1em]" style={{ background: `${feat.color}18`, color: feat.color }}>
                  {feat.tag}
                </div>
                {feat.href && (
                  <div className="absolute bottom-4 right-4 font-space text-[10px] text-[#00e5ff] opacity-0 group-hover:opacity-100 transition-opacity tracking-[0.1em]">
                    ACCEDER →
                  </div>
                )}
              </>
            );
            return feat.href ? (
              <Link key={i} href={feat.href} className="bg-[#080d14] p-8 hover:bg-[#0d1520] transition-colors relative group overflow-hidden block">
                {inner}
              </Link>
            ) : (
              <div key={i} className="bg-[#080d14] p-8 hover:bg-[#0d1520] transition-colors relative group overflow-hidden">
                {inner}
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 md:px-12 py-24 bg-[#080d14]">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4 flex items-center gap-3">
          Planes de Acceso <div className="h-px bg-[#1a2535] flex-1 max-w-[80px]" />
        </div>
        <h2 className="font-bebas text-5xl md:text-7xl leading-none mb-4">NIVELES DE<br />AUTORIZACIÓN</h2>
        <p className="text-[#7ab3c8] text-sm font-space tracking-[0.1em] mb-16 max-w-lg">
          Pagos procesados manualmente. Enviá el comprobante por Telegram y recibís tu acceso en minutos.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-px bg-[#1a2535] border border-[#1a2535]">
          {plans.map((plan, i) => (
            <div key={i} className={`bg-[#020408] p-8 relative transition-colors flex flex-col ${plan.featured ? 'bg-[#0a1420] z-10' : ''}`}
              style={plan.featured ? { outline: `1px solid ${plan.color}`, outlineOffset: "-1px" } : {}}>
              {plan.badge && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px font-space text-[10px] font-bold tracking-[0.15em] px-4 py-1 uppercase whitespace-nowrap"
                  style={{ background: plan.color, color: "#020408" }}>
                  {plan.badge}
                </div>
              )}
              <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.3em] uppercase mb-5">{plan.tier}</div>
              <div className="font-bebas leading-none text-white mb-1" style={{ fontSize: "clamp(52px,5vw,80px)" }}>
                <span className="font-space text-lg text-[#7ab3c8] align-top inline-block mt-3">$</span>{plan.price}
              </div>
              <div className="text-xs text-[#7ab3c8] mb-3">/ mes</div>
              <div className="font-bebas text-2xl mb-4" style={{ color: plan.color }}>{plan.name}</div>

              {/* Access badges */}
              <div className="flex gap-1.5 mb-5 flex-wrap">
                <span className="font-space text-[8px] px-2 py-0.5 tracking-[0.1em]" style={{ background: `${plan.color}18`, border: `1px solid ${plan.color}33`, color: plan.color }}>
                  ▶ AULA VIRTUAL
                </span>
                {plan.access.includes("liqmap") && (
                  <span className="font-space text-[8px] px-2 py-0.5 tracking-[0.1em]" style={{ background: "#00e5ff12", border: "1px solid #00e5ff33", color: "#00e5ff" }}>
                    ⚡ LIQMAP
                  </span>
                )}
                {plan.access.includes("stocks") && (
                  <span className="font-space text-[8px] px-2 py-0.5 tracking-[0.1em]" style={{ background: "#40c4ff12", border: "1px solid #40c4ff33", color: "#40c4ff" }}>
                    📈 STOCKS
                  </span>
                )}
                {plan.access.includes("altcoins") && (
                  <span className="font-space text-[8px] px-2 py-0.5 tracking-[0.1em]" style={{ background: "#ffd70012", border: "1px solid #ffd70033", color: "#ffd700" }}>
                    🪙 ALTCOINS
                  </span>
                )}
              </div>

              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="text-[12px] text-[#7ab3c8] leading-[1.4]">
                    {f}
                  </li>
                ))}
              </ul>

              {/* Payment methods mini */}
              <div className="flex gap-1.5 mb-5 flex-wrap">
                {["💳 PayPal", "🟡 Binance", "🏦 Banco"].map(m => (
                  <span key={m} className="font-space text-[8px] px-2 py-0.5 text-[#5a8898] border border-[#1a2535]">{m}</span>
                ))}
              </div>

              <button
                onClick={() => setPaymentPlan({ tier: plan.tier, name: plan.name, price: plan.price })}
                className="w-full font-space text-xs font-bold tracking-[0.15em] uppercase p-4 transition-all"
                style={plan.featured
                  ? { background: plan.color, color: "#020408" }
                  : { border: `1px solid #1a2535`, color: "white" }
                }
                onMouseEnter={e => { if (!plan.featured) { (e.target as HTMLButtonElement).style.background = plan.color; (e.target as HTMLButtonElement).style.color = "#020408"; (e.target as HTMLButtonElement).style.borderColor = plan.color; } }}
                onMouseLeave={e => { if (!plan.featured) { (e.target as HTMLButtonElement).style.background = ""; (e.target as HTMLButtonElement).style.color = "white"; (e.target as HTMLButtonElement).style.borderColor = "#1a2535"; } }}
              >
                OBTENER ACCESO
              </button>
            </div>
          ))}
        </div>

        {/* App Download CTA */}
        <div className="mt-12 relative overflow-hidden" style={{
          border: "1px solid #00e5ff22",
          background: "linear-gradient(135deg, #020b12 0%, #04121e 50%, #020b12 100%)",
        }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "linear-gradient(rgba(0,229,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,.02) 1px,transparent 1px)",
            backgroundSize: "30px 30px",
          }} />
          <div className="relative p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.3em] uppercase mb-2">📲 DISPONIBLE EN TU TELÉFONO</div>
              <div className="font-bebas text-4xl md:text-5xl text-white leading-none mb-3">
                DESCARGA LA APP<br />
                <span className="text-[#00e5ff]">GRATIS</span>
              </div>
              <div className="font-space text-sm text-[#7ab3c8] mb-6 max-w-sm leading-relaxed">
                Instala PSYCHOMETRIKS en iOS y Android en 30 segundos. Sin App Store. Sin Play Store. Funciona como app nativa.
              </div>
              <div className="flex gap-3 flex-wrap">
                <a href="/descarga"
                  className="flex items-center gap-3 px-6 py-3.5 border transition-all hover:-translate-y-0.5"
                  style={{ background: "#00e5ff12", border: "1px solid #00e5ff44", color: "#00e5ff" }}>
                  <span className="text-xl">🤖</span>
                  <div>
                    <div className="font-space text-[8px] text-[#4a8090] tracking-[0.15em] uppercase">Instalar en</div>
                    <div className="font-space text-sm font-bold tracking-[0.1em]">Android</div>
                  </div>
                </a>
                <a href="/descarga"
                  className="flex items-center gap-3 px-6 py-3.5 border transition-all hover:-translate-y-0.5"
                  style={{ background: "#aaaaff12", border: "1px solid #aaaaff44", color: "#ddddff" }}>
                  <span className="text-xl">🍎</span>
                  <div>
                    <div className="font-space text-[8px] text-[#8888aa] tracking-[0.15em] uppercase">Instalar en</div>
                    <div className="font-space text-sm font-bold tracking-[0.1em]">iOS / iPhone</div>
                  </div>
                </a>
                <a href="/descarga"
                  className="flex items-center gap-2 px-5 py-3.5 font-space text-[10px] text-[#7ab3c8] border border-[#1a2535] hover:border-[#2a3a50] tracking-[0.1em] uppercase transition-all">
                  Ver instrucciones →
                </a>
              </div>
            </div>
            {/* Mini phone visual */}
            <div className="shrink-0 hidden md:block">
              <div className="border-2 border-[#5a8898] rounded-[20px] overflow-hidden bg-[#020b12] p-2" style={{ width: 130, aspectRatio: "9/19" }}>
                <div className="flex justify-between px-2 py-1 mb-1">
                  <span className="font-space text-[5px] text-[#7ab3c8]">9:41</span>
                  <span className="font-sharetech text-[5px] text-[#00e5ff] tracking-widest">PSY</span>
                  <span className="font-space text-[5px] text-[#7ab3c8]">●●●</span>
                </div>
                <div className="space-y-1.5 px-1">
                  <div className="bg-[#040f18] border border-[#0d2030] p-2 rounded">
                    <div className="font-sharetech text-[5px] text-[#00e5ff]">PSY SCORE</div>
                    <div className="font-bebas text-xl text-[#00e676]">72</div>
                    <div className="h-1 bg-[#0d2030] rounded mt-1">
                      <div className="h-full w-[72%] bg-[#00e676] rounded" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="bg-[#040f18] border border-[#0d2030] p-1 rounded text-center">
                      <div className="font-bebas text-xs text-[#ffd700]">$78K</div>
                      <div className="font-sharetech text-[4px] text-[#7ab3c8]">BTC</div>
                    </div>
                    <div className="bg-[#040f18] border border-[#0d2030] p-1 rounded text-center">
                      <div className="font-bebas text-xs text-[#627eea]">$3.1K</div>
                      <div className="font-sharetech text-[4px] text-[#7ab3c8]">ETH</div>
                    </div>
                  </div>
                  <div className="bg-[#040f18] border border-[#ff174430] p-1.5 rounded">
                    <div className="font-sharetech text-[4px] text-[#ff6d00]">⚡ WHALE ALERT</div>
                    <div className="font-space text-[4px] text-[#7ab3c8] mt-0.5">$47.2M BTC → CEX</div>
                  </div>
                  <div className="bg-[#040f18] border border-[#0d2030] p-1.5 rounded">
                    <div className="font-sharetech text-[4px] text-[#7ab3c8] mb-1">LIQMAP</div>
                    <div className="flex gap-0.5 h-5 items-end">
                      {[60,75,55,80,70,90,65,85,75,95].map((h,i) => (
                        <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, backgroundColor: h > 70 ? "#00e676" : "#ff6d00" }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Telegram CTA */}
        <div className="mt-12 border border-[#1a2535] p-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.3em] uppercase mb-2">¿TENÉS DUDAS?</div>
            <div className="font-bebas text-3xl text-white">HABLEMOS DIRECTAMENTE</div>
            <div className="text-sm text-[#7ab3c8] mt-1 mb-6">Respondemos en Telegram · @psychometriks_pro</div>
            <a href={TELEGRAM} target="_blank" rel="noopener noreferrer"
              style={{ background: "linear-gradient(135deg,#2CA5E0,#229ED9)", display: "inline-block" }}
              className="font-space text-xs font-bold tracking-[0.15em] uppercase px-8 py-4 text-white hover:opacity-90 transition-opacity">
              ✈️ ABRIR TELEGRAM
            </a>
          </div>
          {/* Telegram QR */}
          <a href={TELEGRAM} target="_blank" rel="noopener noreferrer" className="shrink-0 flex flex-col items-center gap-3 group">
            <div style={{
              background: "#fff", borderRadius: 12, padding: 10,
              width: 160, height: 160, overflow: "hidden",
              boxShadow: "0 0 0 1px #229ED933",
              transition: "box-shadow 0.2s",
            }}
              className="group-hover:shadow-[0_0_0_2px_#229ED9]"
            >
              <img
                src="/telegram-qr.jpg"
                alt="Telegram QR @psychometriks_pro"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 12%" }}
              />
            </div>
            <div className="font-space text-[10px] text-[#229ED9] tracking-[0.15em] uppercase">
              @PSYCHOMETRIKS_PRO
            </div>
          </a>
        </div>
      </section>

      {/* Social Sharing */}
      <section className="px-6 md:px-12 py-16 bg-[#020408] border-t border-[#1a2535]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-3 flex items-center justify-center gap-3">
            <div className="h-px bg-[#1a2535] w-12" /> COMPARTÍ CON TU RED <div className="h-px bg-[#1a2535] w-12" />
          </div>
          <h2 className="font-bebas text-4xl md:text-5xl text-white mb-2">
            AYUDÁ A OTROS TRADERS<br />
            <span className="text-[#00e5ff]">A NO COMETER TUS ERRORES</span>
          </h2>
          <p className="font-space text-[12px] text-[#7ab3c8] mb-10 max-w-md mx-auto leading-relaxed">
            El 90% de los traders se liquidan por errores psicológicos. Compartí PSYCHOMETRIKS y ayudá a alguien a evitarlo.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Acabo de descubrir que mis liquidaciones no son por el análisis — son errores psicológicos predecibles. Esta plataforma te lo demuestra en 3 minutos 🧠⚡")}&url=${encodeURIComponent("https://psychometriks.trade")}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 font-space text-[11px] font-bold tracking-[0.12em] uppercase px-6 py-3.5 transition-all hover:-translate-y-0.5"
              style={{ background: "#111", border: "1px solid #333", color: "#e8f0f8" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.257 5.625 5.907-5.625zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Compartir en X
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent("🧠 PSYCHOMETRIKS — La plataforma que analiza tu psicología como trader\n\n¿Sabés cuánto te costaron tus errores emocionales? Te lo calcula exactamente.\n\n➡️ https://psychometriks.trade\n\nHacé el test gratis — tarda 3 minutos")}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 font-space text-[11px] font-bold tracking-[0.12em] uppercase px-6 py-3.5 transition-all hover:-translate-y-0.5"
              style={{ background: "#00000022", border: "1px solid #25D36633", color: "#25D366" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent("https://psychometriks.trade")}&text=${encodeURIComponent("🧠 PSYCHOMETRIKS — Plataforma de trading con análisis psicológico\n\nDescubrí por qué te liquidás realmente. Test gratis en 3 minutos ⚡")}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 font-space text-[11px] font-bold tracking-[0.12em] uppercase px-6 py-3.5 transition-all hover:-translate-y-0.5"
              style={{ background: "#00000022", border: "1px solid #229ED933", color: "#229ED9" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Telegram
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://psychometriks.trade")}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 font-space text-[11px] font-bold tracking-[0.12em] uppercase px-6 py-3.5 transition-all hover:-translate-y-0.5"
              style={{ background: "#00000022", border: "1px solid #1877F233", color: "#1877F2" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </a>
            <a
              href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent("https://psychometriks.trade")}&title=${encodeURIComponent("PSYCHOMETRIKS — Análisis psicológico para traders")}&summary=${encodeURIComponent("Plataforma que analiza tu psicología como trader. Descubrí por qué te liquidás realmente.")}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 font-space text-[11px] font-bold tracking-[0.12em] uppercase px-6 py-3.5 transition-all hover:-translate-y-0.5"
              style={{ background: "#00000022", border: "1px solid #0A66C233", color: "#0A66C2" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a2535] p-10 md:px-12 flex justify-between items-center flex-wrap gap-4 bg-[#060a0f]">
        <div className="font-space text-xs text-[#00e5ff] tracking-[0.2em]">
          PSYCHOMETRIKS
        </div>
        <div className="font-space text-[10px] text-[#7ab3c8]">© 2025 PSYCHOMETRIKS. ALL RIGHTS RESERVED.</div>
        <div className="flex gap-6 flex-wrap">
          <a href="/indicators" className="font-space text-[10px] text-[#7ab3c8] uppercase tracking-[0.1em] hover:text-[#00e5ff]">Indicadores</a>
          <a href="/signals" className="font-space text-[10px] text-[#7ab3c8] uppercase tracking-[0.1em] hover:text-[#00e5ff]">Señales</a>
          <a href="/blog" className="font-space text-[10px] text-[#7ab3c8] uppercase tracking-[0.1em] hover:text-[#00e5ff]">Blog</a>
          <a href="/pricing" className="font-space text-[10px] text-[#7ab3c8] uppercase tracking-[0.1em] hover:text-[#00e5ff]">Planes</a>
          <a href="/liquid-map.html" className="font-space text-[10px] text-[#7ab3c8] uppercase tracking-[0.1em] hover:text-[#00e5ff]">LiqMap</a>
          <a href="/aula/" className="font-space text-[10px] text-[#7ab3c8] uppercase tracking-[0.1em] hover:text-[#00e5ff]">Aula</a>
          <a href="/descarga" className="font-space text-[10px] text-[#00e5ff] uppercase tracking-[0.1em] hover:text-white">📲 App</a>
          <a href={TELEGRAM} target="_blank" rel="noopener noreferrer" className="font-space text-[10px] text-[#7ab3c8] uppercase tracking-[0.1em] hover:text-[#00e5ff]">✈️ Telegram</a>
        </div>
      </footer>

      {/* Modals */}
      {showAccess && (
        <QuickAccessModal onClose={() => setShowAccess(false)} />
      )}
      {paymentPlan && (
        <PaymentModal plan={paymentPlan} cfg={cfg} onClose={() => setPaymentPlan(null)} />
      )}
    </div>
  );
}
