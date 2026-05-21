import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { getAuth, isAdmin, hasAccess, logout, PLAN_COLORS, PLAN_NAMES } from "@/lib/auth";

const TESTS_LINKS = [
  { href: "/tests/tipo-trader",           icon: "🧠", label: "¿Qué tipo de trader eres?",    desc: "5 perfiles · 3 min" },
  { href: "/tests/por-que-te-liquidan",   icon: "⚡", label: "¿Por qué te liquidan?",        desc: "4 perfiles · 3 min" },
  { href: "/tests/psicologia",            icon: "🧬", label: "Test de Psicología",            desc: "5 perfiles · 4 min" },
];

const LIQMAP_LINKS = [
  { href: "/psy-score",         icon: "🧠", label: "PSY Score",             desc: "Score institucional 0-100",                    plan: "pro"   },
  { href: "/screener",          icon: "📡", label: "PSY Screener",          desc: "Top 50 con señales PSY-ULT1",                  plan: "pro"   },
  { href: "/liquidations",      icon: "⚡", label: "Liquidation Clock",     desc: "Liquidaciones por minuto",                     plan: "pro"   },
  { href: "/funding",           icon: "💸", label: "Funding Dashboard",     desc: "Funding rates en tiempo real",                 plan: "pro"   },
  { href: "/heatmap",           icon: "🌡️", label: "PSY HeatMap",           desc: "Correlación BTC·ETH·XAU·DXY",                 plan: "pro"   },
  { href: "/macro",             icon: "🌐", label: "Macro Dashboard",       desc: "DXY · Yields · SPX · XAU",                    plan: "pro"   },
  { href: "/spot-perp",         icon: "📊", label: "Spot vs Perpetuos",     desc: "Demanda 30d · Patrón 2022 · Régimen actual",  plan: "pro"   },
  { href: "/ciclos-btc",        icon: "🔄", label: "Ciclos BTC",            desc: "Stoch RSI bimestral · Fondos históricos",     plan: "pro"   },
  { href: "/fed-btc",           icon: "🏛", label: "FED × BTC",             desc: "Presidentes FED + Coinbase Premium en vivo",  plan: "pro"   },
  { href: "/whale-alert",       icon: "🐋", label: "Whale Alert",           desc: "Movimientos +$1M en tiempo real · On-chain",  plan: "elite" },
  { href: "/psychometriks-whale-signals.html", icon: "🎯", label: "Whale Signals",         desc: "Copy Trade Ballenas + Gem Hunter · IA",        plan: "elite", external: true },
  { href: "/market-hours",      icon: "🕐", label: "Market Hours",          desc: "Estado de mercados mundiales · Sesiones",     plan: "pro"   },
  { href: "/bolsa",             icon: "📈", label: "Acciones & Renta Fija", desc: "LiqMap stocks, bonds, ETFs",                  plan: "elite" },
  { href: "/altcoins-signals",  icon: "🪙", label: "Señales Altcoins",      desc: "Top 50 altcoins · Hyperliquid · Tiempo real", plan: "elite" },
  { href: "/equities",          icon: "🏛", label: "Equities Command Center", desc: "Top 20 acciones · Chart.js · Macro correlaciones", plan: "elite" },
  { href: "/psy-feed",          icon: "🧬", label: "PSY Intelligence Feed",  desc: "Fear & Greed · Funding · L/S · Narrativa IA", plan: "pro"   },
  { href: "/psy-oracle",        icon: "🔮", label: "PSY ORACLE",              desc: "Intelligence institucional · 9 secciones · PSY BRAIN IA", plan: "elite" },
  { href: "/anti-rug",          icon: "🛡", label: "Anti-Rug Scanner",       desc: "Score de riesgo · Honeypot · Holders · Taxes",  plan: "elite" },
  { href: "/command-center",    icon: "⚡", label: "Command Center",          desc: "Overview · Scanner · Portfolio · OI · PSY AI",  plan: "elite" },
  { href: "/psy-brain",         icon: "🧠", label: "PSY BRAIN",               desc: "Analista IA institucional · Claude Sonnet 4 · 9 tipos de análisis", plan: "elite" },
  { href: "/oracle-feeds",      icon: "📡", label: "ORACLE FEEDS",             desc: "Precios live · Whales · Noticias · Mineros · Tesoros · Fear & Greed", plan: "elite" },
];

const TOOLS_LINKS = [
  { href: "/pre-entry",         icon: "⚡", label: "ESTOY POR ENTRAR",        desc: "Análisis antes de tu trade",         plan: "basico"    },
  { href: "/adn-trader",        icon: "🧬", label: "ADN del Trader",           desc: "Tu perfil psicológico real",         plan: "basico"    },
  { href: "/costo-errores",     icon: "💸", label: "Costo de Mis Errores",     desc: "Cuánto te costaron tus errores en $", plan: "basico"   },
  { href: "/challenge",         icon: "🏆", label: "Challenge 30 Días",       desc: "Conviértete en PSY Trader · 90 misiones", plan: "basico" },
  { href: "/affiliate",         icon: "💎", label: "Programa Afiliados",       desc: "Hasta 35% comisión recurrente",      plan: "basico"    },
  { href: "/api-docs",          icon: "⚙️",  label: "API Pública",             desc: "Docs REST · Prueba en vivo · JSON",  plan: ""          },
  { href: "/certificado",       icon: "🎓", label: "Certificados PDF",         desc: "Genera tu certificado oficial",      plan: "basico"    },
  { href: "/psy-token",         icon: "🪙", label: "$PSY Token",               desc: "Tokenomics · Staking · Governance",  plan: "basico"    },
  { href: "/simulador",         icon: "💀", label: "Simulador de Liquidación", desc: "Cómo te destruye el mercado",        plan: "basico"    },
  { href: "/psy-autopsy",       icon: "🔬", label: "PSY Autopsy",              desc: "Post-mortem forense de tu trade",    plan: "basico"    },
  { href: "/psy-wallet",        icon: "💱", label: "PSY Wallet",               desc: "DEX Exchange · Swap · Auditoría",    plan: ""          },
  { href: "/war-room",          icon: "⚔️",  label: "War Room",                desc: "Sala de análisis en vivo",           plan: "pro"       },
  { href: "/journal",           icon: "📓", label: "Diario de Trading",        desc: "IA analiza tus errores",             plan: "basico"    },
  { href: "/replay",            icon: "⏮",  label: "Market Replay",           desc: "Reviví momentos históricos",         plan: "educacion" },
  { href: "/calculadora",       icon: "📐", label: "Position Size Calc",       desc: "Tamaño de posición óptimo",          plan: "basico"    },
  { href: "/converter",         icon: "💱", label: "Conversor Crypto",         desc: "Precios en tiempo real",             plan: "basico"    },
  { href: "/economic-calendar", icon: "📅", label: "Calendario Económico",     desc: "FOMC · CPI · NFP",                   plan: "educacion" },
  { href: "/leaderboard",       icon: "🏆", label: "Leaderboard",              desc: "Historial de señales",               plan: "educacion" },
  { href: "/boveda",            icon: "🔐", label: "Bóveda Personal",          desc: "Seeds, claves, TOTP · Cifrado local", plan: "basico"   },
  { href: "/strategies",        icon: "📋", label: "Marketplace Estrategias",  desc: "Estrategias verificadas · Backtest · Setup",  plan: "elite" },
  { href: "/psy-brain",         icon: "🧠", label: "PSY BRAIN",               desc: "Analista IA institucional · Claude Sonnet 4 · 9 análisis", plan: "elite" },
];

const NAV_LINKS = [
  { href: "/tests",      label: "🧠 Tests", highlight: true },
  { href: "/exchange",   label: "⚡ Exchange", highlight: true },
  { href: "/signals",    label: "Señales" },
  { href: "/pricing",    label: "Planes" },
];

type DropKey = "liqmap" | "tools" | "user" | null;

const PLAN_BADGE_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  basico:        { bg: "#00e67615", border: "#00e67633", text: "#00e676" },
  aprendiz:      { bg: "#00e67615", border: "#00e67633", text: "#00e676" },
  educacion:     { bg: "#ffd70015", border: "#ffd70033", text: "#ffd700" },
  pro:           { bg: "#e040fb15", border: "#e040fb33", text: "#e040fb" },
  trader:        { bg: "#e040fb15", border: "#e040fb33", text: "#e040fb" },
  elite:         { bg: "#00e5ff15", border: "#00e5ff33", text: "#00e5ff" },
  institucional: { bg: "#00e5ff15", border: "#00e5ff33", text: "#00e5ff" },
};

export default function SiteNav() {
  const [location]      = useLocation();
  const [open, setOpen] = useState(false);
  const [drop, setDrop] = useState<DropKey>(null);
  const navRef          = useRef<HTMLDivElement>(null);
  const auth            = getAuth();
  const admin           = isAdmin(auth);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setDrop(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (key: DropKey) => setDrop(d => (d === key ? null : key));
  const planKey = auth?.plan?.toLowerCase() ?? "";
  const badgeStyle = PLAN_BADGE_COLOR[planKey] ?? { bg: "#1a253515", border: "#1a253533", text: "#4a6070" };
  const planLabel = PLAN_NAMES[planKey] ?? planKey.toUpperCase();

  const isLiqActive  = LIQMAP_LINKS.some(t => location.startsWith(t.href));
  const isToolActive = TOOLS_LINKS.some(t => location.startsWith(t.href));

  function PlanBadge({ plan }: { plan: string | null | undefined }) {
    if (!plan) return null;
    const s = PLAN_BADGE_COLOR[plan.toLowerCase()] ?? { bg: "transparent", border: "#1a2535", text: "#4a6070" };
    const n = PLAN_NAMES[plan.toLowerCase()] ?? plan.toUpperCase();
    return (
      <span className="font-space text-[7px] px-1.5 py-0.5 tracking-[0.1em]"
        style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
        {n}
      </span>
    );
  }

  function LockBadge({ plan }: { plan: string | null | undefined }) {
    if (!plan || !auth) return null;
    const needed = plan as Parameters<typeof hasAccess>[1];
    if (admin || hasAccess(auth, needed)) return null;
    return (
      <span className="font-space text-[7px] px-1 py-0.5 tracking-[0.05em] opacity-60"
        style={{ background: "#ff174408", border: "1px solid #ff174433", color: "#ff5266" }}>
        🔒 {PLAN_NAMES[plan.toLowerCase()] ?? plan.toUpperCase()}
      </span>
    );
  }

  function DropdownSection({
    title, links, color = "#00e5ff",
  }: {
    title: string;
    links: typeof LIQMAP_LINKS;
    color?: string;
  }) {
    return (
      <>
        <div className="px-4 pt-3 pb-1 font-sharetech text-[8px] tracking-[0.3em] uppercase" style={{ color }}>
          {title}
        </div>
        {links.map(t => {
          const isExternal = !!(t as { external?: boolean }).external;
          const itemPlan   = (t as { plan?: string | null }).plan;
          const needed     = itemPlan as Parameters<typeof hasAccess>[1];
          const canAccess  = admin || !itemPlan || hasAccess(auth, needed);
          const isActive   = canAccess && !isExternal && location.startsWith(t.href);

          const inner = (
            <>
              <span className="text-base shrink-0 mt-0.5" style={{ opacity: canAccess ? 1 : 0.35 }}>{t.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className={`font-space text-[10px] ${isActive ? "text-[#00e5ff]" : canAccess ? "text-white" : "text-[#2a3a4a]"}`}>
                    {t.label}
                  </div>
                  <PlanBadge plan={itemPlan} />
                  {!canAccess && (
                    <span className="font-space text-[7px] px-1.5 py-0.5 tracking-[0.05em]"
                      style={{ background: "#ff174408", border: "1px solid #ff174433", color: "#ff5266" }}>
                      🔒 {PLAN_NAMES[itemPlan?.toLowerCase() ?? ""] ?? itemPlan?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="font-space text-[9px]" style={{ color: canAccess ? "#4a6070" : "#1a2535" }}>{t.desc}</div>
              </div>
            </>
          );

          if (!canAccess) {
            return (
              <div key={t.href}
                className="flex items-start gap-3 px-4 py-2.5 border-b border-[#0d1520] last:border-0 select-none"
                style={{ cursor: "not-allowed", background: "#02040899" }}
                title={`Requiere plan ${PLAN_NAMES[itemPlan?.toLowerCase() ?? ""] ?? itemPlan}`}>
                {inner}
              </div>
            );
          }

          const rowCls = `flex items-start gap-3 px-4 py-2.5 border-b border-[#0d1520] last:border-0 no-underline transition-colors hover:bg-[#0d1520] ${isActive ? "bg-[#0d1520]" : ""}`;
          return isExternal
            ? <a key={t.href} href={t.href} target="_blank" rel="noopener noreferrer" onClick={() => setDrop(null)} className={rowCls}>{inner}</a>
            : <Link key={t.href} href={t.href} onClick={() => setDrop(null)} className={rowCls}>{inner}</Link>;
        })}
      </>
    );
  }

  function handleLogout() {
    if (confirm("¿Cerrar sesión?")) logout();
  }

  return (
    <>
    <nav ref={navRef} className="fixed top-0 w-full z-40 px-6 md:px-12 py-4 flex items-center justify-between bg-[#020408]/95 backdrop-blur-md border-b border-[#0d1520]">
      <Link href="/" className="font-orbitron text-[13px] font-black text-[#00e5ff] tracking-[0.2em] uppercase no-underline">
        PSY<span className="text-white">CHOMETRIKS</span>
      </Link>

      {/* Desktop */}
      <div className="hidden md:flex items-center gap-5">
        {NAV_LINKS.map(l => (
          <Link key={l.href} href={l.href}
            className={`font-space text-[11px] tracking-[0.15em] uppercase transition-colors no-underline ${
              location.startsWith(l.href)
                ? "text-[#00e5ff]"
                : (l as { highlight?: boolean }).highlight
                  ? "text-[#00e5ff] opacity-70 hover:opacity-100"
                  : "text-[#7ab3c8] hover:text-[#00e5ff]"
            }`}>
            {l.label}
          </Link>
        ))}

        {/* LiqMap dropdown — solo usuarios autenticados */}
        {auth && (
          <div className="relative">
            <button onClick={() => toggle("liqmap")}
              className={`font-space text-[11px] tracking-[0.15em] uppercase transition-colors flex items-center gap-1 ${isLiqActive || drop === "liqmap" ? "text-[#00e5ff]" : "text-[#7ab3c8] hover:text-[#00e5ff]"}`}>
              LiqMap <span className="text-[9px]" style={{ transform: drop === "liqmap" ? "rotate(180deg)" : undefined, display: "inline-block", transition: "transform 0.15s" }}>▼</span>
            </button>
            {drop === "liqmap" && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-[#060a0f] border border-[#1a2535] shadow-2xl max-h-[70vh] overflow-y-auto">
                <DropdownSection title="PSY · LIQMAP PRO" links={LIQMAP_LINKS} color="#00e5ff" />
              </div>
            )}
          </div>
        )}

        {/* Tools dropdown — solo usuarios autenticados */}
        {auth && (
          <div className="relative">
            <button onClick={() => toggle("tools")}
              className={`font-space text-[11px] tracking-[0.15em] uppercase transition-colors flex items-center gap-1 ${isToolActive || drop === "tools" ? "text-[#00e5ff]" : "text-[#7ab3c8] hover:text-[#00e5ff]"}`}>
              Herramientas <span className="text-[9px]" style={{ transform: drop === "tools" ? "rotate(180deg)" : undefined, display: "inline-block", transition: "transform 0.15s" }}>▼</span>
            </button>
            {drop === "tools" && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-[#060a0f] border border-[#1a2535] shadow-2xl max-h-[70vh] overflow-y-auto">
                <DropdownSection title="HERRAMIENTAS" links={TOOLS_LINKS} color="#ffd700" />
                <Link href="/onboarding" onClick={() => setDrop(null)}
                  className="flex items-start gap-3 px-4 py-2.5 no-underline transition-colors hover:bg-[#0d1520] border-t-2 border-[#ffd70022]">
                  <span className="text-base shrink-0 mt-0.5">🚀</span>
                  <div>
                    <div className="font-space text-[10px] text-[#ffd700]">Tutorial Inicio</div>
                    <div className="font-space text-[9px] text-[#7ab3c8]">Guía paso a paso</div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="w-px h-4 bg-[#1a2535]" />

        {auth ? (
          /* ── Logged-in user menu ── */
          <div className="relative">
            <button onClick={() => toggle("user")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-full border flex items-center justify-center font-orbitron text-[10px] font-bold"
                style={{ borderColor: badgeStyle.border, background: badgeStyle.bg, color: badgeStyle.text }}>
                {(auth.user ?? "?")[0].toUpperCase()}
              </div>
              <div className="flex flex-col items-start">
                <span className="font-space text-[10px] text-white leading-none">{auth.displayName ?? auth.user}</span>
                <span className="font-space text-[8px] tracking-[0.1em]" style={{ color: badgeStyle.text }}>
                  {admin ? "ADMIN" : planLabel}
                </span>
              </div>
              <span className="text-[9px] text-[#7ab3c8]" style={{ display: "inline-block", transition: "transform 0.15s", transform: drop === "user" ? "rotate(180deg)" : undefined }}>▼</span>
            </button>

            {drop === "user" && (
              <div className="absolute top-full right-0 mt-2 w-52 bg-[#060a0f] border border-[#1a2535] shadow-2xl">
                {/* User info */}
                <div className="px-4 py-3 border-b border-[#0d1520]">
                  <div className="font-space text-[10px] text-white">{auth.displayName ?? auth.user}</div>
                  <div className="font-space text-[8px] text-[#7ab3c8] mt-0.5">@{auth.user}</div>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[8px] font-space tracking-[0.1em]"
                    style={{ background: badgeStyle.bg, border: `1px solid ${badgeStyle.border}`, color: badgeStyle.text }}>
                    {admin ? "⚡ ADMINISTRADOR" : `PLAN ${planLabel}`}
                  </div>
                </div>

                <Link href="/dashboard" onClick={() => setDrop(null)}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-[#0d1520] no-underline hover:bg-[#0d1520] transition-colors">
                  <span className="text-sm">🏠</span>
                  <span className="font-space text-[10px] text-white">Mi Dashboard</span>
                </Link>

                <Link href="/boveda" onClick={() => setDrop(null)}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-[#0d1520] no-underline hover:bg-[#0d1520] transition-colors">
                  <span className="text-sm">🔐</span>
                  <span className="font-space text-[10px] text-white">Mi Bóveda</span>
                </Link>

                {!admin && (
                  <Link href="/pricing" onClick={() => setDrop(null)}
                    className="flex items-center gap-3 px-4 py-2.5 border-b border-[#0d1520] no-underline hover:bg-[#0d1520] transition-colors">
                    <span className="text-sm">⬆</span>
                    <span className="font-space text-[10px]" style={{ color: badgeStyle.text }}>Mejorar Plan</span>
                  </Link>
                )}

                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#ff174410] transition-colors border-none bg-transparent cursor-pointer">
                  <span className="text-sm">🚪</span>
                  <span className="font-space text-[10px] text-[#ff5266]">Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ── Not logged in ── */
          <>
            <a href="/aula/" className="font-space text-[11px] border border-[#00e5ff44] text-[#00e5ff] px-4 py-2 tracking-[0.15em] uppercase hover:bg-[#00e5ff15] transition-colors no-underline">
              Ya soy cliente
            </a>
            <Link href="/pricing" className="font-space text-[11px] bg-[#00e5ff] text-[#020408] px-4 py-2 font-bold tracking-[0.15em] uppercase hover:bg-white transition-colors no-underline">
              Suscribirme
            </Link>
          </>
        )}
      </div>

      {/* Mobile burger */}
      <button className="md:hidden text-[#7ab3c8] hover:text-white" onClick={() => setOpen(!open)}>
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 bg-[#020408] border-b border-[#1a2535] p-6 flex flex-col gap-3 md:hidden max-h-[80vh] overflow-y-auto">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href}
              onClick={() => setOpen(false)}
              className={`font-space text-[12px] tracking-[0.15em] uppercase no-underline ${
                (l as { highlight?: boolean }).highlight ? "text-[#00e5ff]" : "text-[#7ab3c8] hover:text-[#00e5ff]"
              }`}>
              {l.label}
            </Link>
          ))}

          {auth && (
            <div className="border border-[#1a2535] bg-[#060a0f] p-3">
              <div className="font-space text-[10px] text-white">{auth.displayName ?? auth.user}</div>
              <div className="font-space text-[8px] mt-0.5" style={{ color: badgeStyle.text }}>
                {admin ? "ADMINISTRADOR" : `PLAN ${planLabel}`}
              </div>
            </div>
          )}

          {/* LIQMAP y HERRAMIENTAS — solo usuarios autenticados */}
          {auth && (
            <>
              <div className="border-t border-[#1a2535] pt-3">
                <div className="font-space text-[9px] text-[#00e5ff] tracking-[0.2em] uppercase mb-2 opacity-60">LIQMAP PRO</div>
                {LIQMAP_LINKS.map(t => (
                  <Link key={t.href} href={t.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 font-space text-[12px] text-[#7ab3c8] hover:text-[#00e5ff] no-underline py-1.5">
                    <span>{t.icon}</span> {t.label}
                    {!admin && !hasAccess(auth, (t.plan as Parameters<typeof hasAccess>[1]) ?? "basico") && (
                      <span className="ml-auto text-[8px] text-[#ff5266]">🔒</span>
                    )}
                  </Link>
                ))}
              </div>

              <div className="border-t border-[#1a2535] pt-3">
                <div className="font-space text-[9px] text-[#ffd700] tracking-[0.2em] uppercase mb-2 opacity-60">HERRAMIENTAS</div>
                {TOOLS_LINKS.map(t => (
                  <Link key={t.href} href={t.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 font-space text-[12px] text-[#7ab3c8] hover:text-[#00e5ff] no-underline py-1.5">
                    <span>{t.icon}</span> {t.label}
                    {!admin && t.plan && !hasAccess(auth, (t.plan as Parameters<typeof hasAccess>[1]) ?? "basico") && (
                      <span className="ml-auto text-[8px] text-[#ff5266]">🔒</span>
                    )}
                  </Link>
                ))}
                <Link href="/onboarding" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 font-space text-[12px] text-[#ffd700] no-underline py-1.5">
                  <span>🚀</span> Tutorial inicio
                </Link>
              </div>
            </>
          )}

          <hr className="border-[#1a2535]" />

          {auth ? (
            <>
              <Link href="/dashboard" onClick={() => setOpen(false)} className="font-space text-[12px] text-white no-underline">
                🏠 Mi Dashboard
              </Link>
              <Link href="/boveda" onClick={() => setOpen(false)} className="font-space text-[12px] text-white no-underline">
                🔐 Mi Bóveda
              </Link>
              {!admin && (
                <Link href="/pricing" onClick={() => setOpen(false)} className="font-space text-[12px] no-underline" style={{ color: badgeStyle.text }}>
                  ⬆ Mejorar Plan
                </Link>
              )}
              <button onClick={handleLogout}
                className="font-space text-[12px] text-[#ff5266] text-left bg-transparent border-none cursor-pointer p-0">
                🚪 Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <a href="/aula/" className="font-space text-[12px] text-[#00e5ff] tracking-[0.1em] uppercase no-underline">
                Ya soy cliente →
              </a>
              <Link href="/pricing" onClick={() => setOpen(false)} className="font-space text-[12px] bg-[#00e5ff] text-[#020408] px-4 py-2 font-bold tracking-[0.1em] uppercase text-center no-underline">
                Suscribirme
              </Link>
            </>
          )}
        </div>
      )}
    </nav>

    {/* ── Botón de retroceso — aparece en todas las páginas excepto Home ── */}
    {location !== "/" && (
      <button
        onClick={() => window.history.back()}
        style={{
          position: "fixed",
          top: 58,
          left: 16,
          zIndex: 39,
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "5px 10px",
          background: "rgba(2,4,8,0.92)",
          border: "1px solid #1a2535",
          color: "#2a4a5a",
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.18em",
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          transition: "color 0.15s, border-color 0.15s",
          lineHeight: 1,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.color = "#00e5ff";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#00e5ff55";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.color = "#2a4a5a";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#1a2535";
        }}
      >
        ← VOLVER
      </button>
    )}
  </>
  );
}
