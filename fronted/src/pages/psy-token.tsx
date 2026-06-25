import React, { useState } from "react";
import SiteNav from "@/components/site-nav";

const TOKENOMICS = [
  { name: "Comunidad & Recompensas",   pct: 35, color: "#00e5ff",  desc: "Challenge, staking, leaderboard rewards" },
  { name: "Ecosistema & Liquidez",     pct: 20, color: "#00e676",  desc: "DEX pools, market making, bridges" },
  { name: "Equipo & Advisors",         pct: 15, color: "#e040fb",  desc: "Vesting 24 meses, cliff 6 meses" },
  { name: "Reserva del Protocolo",     pct: 15, color: "#ffd700",  desc: "Tesorería controlada por governance" },
  { name: "Venta Pública (IDO)",       pct: 10, color: "#ff6d00",  desc: "TGE con vesting 12 meses" },
  { name: "Partnerships",              pct: 5,  color: "#ff1744",  desc: "Integraciones estratégicas" },
];

const UTILITY = [
  { icon: "🔓", title: "ACCESO PREMIUM", desc: "Paga tu suscripción con $PSY y obtén 20% de descuento. Holders automáticamente tier ANALISTA." },
  { icon: "🗳",  title: "GOVERNANCE", desc: "Vota en decisiones del protocolo: nuevas features, cambios de pricing, alianzas estratégicas." },
  { icon: "💎", title: "STAKING REWARDS", desc: "Stakea $PSY y gana hasta 18% APY. Las recompensas provienen del revenue de la plataforma." },
  { icon: "🏆", title: "CHALLENGE PRIZES", desc: "Los ganadores del Challenge 30D reciben $PSY. Sistema de puntos on-chain verificable." },
  { icon: "📡", title: "SEÑALES PREMIUM", desc: "Acceso a señales institucionales exclusivas solo para holders de +10,000 $PSY." },
  { icon: "⛓", title: "CERTIFICADOS NFT", desc: "Los certificados de nivel EXPERTO son NFTs acuñados en tu wallet. Verificables en blockchain." },
];

const ROADMAP = [
  { quarter: "Q3 2025", title: "TOKEN DESIGN", items: ["Tokenomics definidos", "Smart contracts auditados", "Whitepaper publicado"], done: true, color: "#00e676" },
  { quarter: "Q4 2025", title: "PRESALE", items: ["Venta privada (seed)", "Community whitelist", "KOL partnerships"], done: true, color: "#00e676" },
  { quarter: "Q1 2026", title: "IDO LAUNCH", items: ["Lanzamiento IDO", "Listing en DEX (Uniswap, PancakeSwap)", "Farming pools live"], done: false, color: "#ffd700" },
  { quarter: "Q2 2026", title: "STAKING LIVE", items: ["Staking dashboard live", "Governance voting activo", "First airdrop holders"], done: false, color: "#ffd700" },
  { quarter: "Q3 2026", title: "CEX LISTING", items: ["Listing exchange Tier 2", "Cross-chain bridge", "Mobile wallet integration"], done: false, color: "#4a6070" },
  { quarter: "Q4 2026", title: "ECOSYSTEM", items: ["Copy trading con $PSY", "NFT certificados en mainnet", "API monetización con $PSY"], done: false, color: "#4a6070" },
];

const STATS = [
  { label: "TOTAL SUPPLY",   value: "100M",   sub: "$PSY tokens",           color: "#00e5ff" },
  { label: "PRECIO IDO",     value: "$0.05",  sub: "precio de lanzamiento", color: "#ffd700" },
  { label: "MARKET CAP IDO", value: "$5M",    sub: "valoración inicial",    color: "#e040fb" },
  { label: "BLOCKCHAIN",     value: "ETH",    sub: "ERC-20 + bridge BNB",   color: "#00e676" },
];

// ── Whitelist Modal ────────────────────────────────────────────────────────────
function WhitelistModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail]   = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setStatus("ok");
        setMsg("¡Listo! Te avisaremos cuando abra el IDO. Revisá tu correo.");
      } else {
        setStatus("error");
        setMsg(data.error ?? "Error al registrar");
      }
    } catch {
      setStatus("error");
      setMsg("Error de conexión. Intentá de nuevo.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(2,4,8,0.88)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md border border-[#e040fb40] bg-[#06000f]" style={{ boxShadow: "0 0 60px #e040fb18" }}>
        {/* Header */}
        <div style={{ height: 3, background: "linear-gradient(90deg,#e040fb,#00e5ff,#ffd700)" }} />
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7a50a0] mb-1">$PSY TOKEN · WHITELIST</div>
            <div className="font-bebas text-2xl text-white tracking-wider">ÚNETE A LA WHITELIST</div>
          </div>
          <button onClick={onClose} className="text-[#4a6070] hover:text-white transition-colors text-xl leading-none mt-1">✕</button>
        </div>

        <div className="px-6 pb-6">
          {status === "ok" ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">🎯</div>
              <div className="font-bebas text-xl text-[#e040fb] tracking-wider mb-3">¡ESTÁS DENTRO!</div>
              <div className="font-space text-[11px] text-[#8090a0] leading-relaxed mb-2">{msg}</div>
              <div className="font-space text-[10px] text-[#546e7a] mb-6">
                Como whitelister obtenés <span className="text-[#ffd700] font-bold">30% de descuento</span> sobre el precio IDO público.
              </div>
              <button onClick={onClose}
                className="px-6 py-2 bg-[#e040fb] text-black font-bebas tracking-widest text-lg hover:bg-[#ea6bfb] transition-colors">
                CERRAR
              </button>
            </div>
          ) : (
            <>
              <p className="font-space text-[11px] text-[#6a8090] leading-relaxed mb-5">
                Sé de los primeros en acceder al <span className="text-[#e040fb]">$PSY Token</span>.
                Los whitelisters reciben precio de preventa con <span className="text-[#ffd700] font-bold">30% de descuento</span> y acceso prioritario al IDO.
              </p>

              {/* Precio visual */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <div className="border border-[#e040fb30] bg-[#0d001a] p-3 text-center">
                  <div className="font-sharetech text-[8px] tracking-[0.15em] text-[#7a50a0] mb-1">PRECIO WHITELIST</div>
                  <div className="font-bebas text-2xl text-[#e040fb]">$0.035</div>
                  <div className="font-space text-[9px] text-[#00e676]">−30% 🎯</div>
                </div>
                <div className="border border-[#0d2030] bg-[#040f18] p-3 text-center">
                  <div className="font-sharetech text-[8px] tracking-[0.15em] text-[#546e7a] mb-1">PRECIO IDO PÚBLICO</div>
                  <div className="font-bebas text-2xl text-[#546e7a]">$0.05</div>
                  <div className="font-space text-[9px] text-[#546e7a]">precio base</div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setMsg(""); setStatus("idle"); }}
                  placeholder="tu@correo.com"
                  required
                  className="w-full bg-[#0a0014] border border-[#2a1040] px-4 py-3 font-space text-[12px] text-white placeholder-[#3a2050] focus:border-[#e040fb44] focus:outline-none mb-3"
                />
                {msg && status === "error" && (
                  <div className="font-space text-[11px] text-[#ff1744] mb-3">{msg}</div>
                )}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full py-3 font-bebas text-xl tracking-widest bg-[#e040fb] text-black hover:bg-[#ea6bfb] transition-colors disabled:opacity-50"
                >
                  {status === "loading" ? "REGISTRANDO..." : "UNIRME A LA WHITELIST →"}
                </button>
              </form>

              <div className="font-space text-[9px] text-[#2a3a4a] text-center mt-3">
                Sin spam. Solo te avisamos cuando abra el IDO.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PsyToken() {
  const [activeTab, setActiveTab]       = useState<"tokenomics" | "utility" | "roadmap">("tokenomics");
  const [showWhitelist, setShowWhitelist] = useState(false);

  return (
    <div className="min-h-screen bg-[#020b12] text-white">
      <SiteNav />
      {showWhitelist && <WhitelistModal onClose={() => setShowWhitelist(false)} />}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">

        {/* Header */}
        <div className="mb-10">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-3">PSYCHOMETRIKS · WEB3</div>
          <h1 className="font-bebas text-5xl md:text-6xl leading-none text-white mb-2">
            $PSY <span className="text-[#e040fb]">TOKEN</span>
          </h1>
          <p className="font-space text-[11px] text-[#7ab3c8]">
            El token utilitario del ecosistema PSYCHOMETRIKS · Acceso · Governance · Staking · Rewards
          </p>
        </div>

        {/* Hero stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {STATS.map(s => (
            <div key={s.label} className="border border-[#0d2030] bg-[#040f18] p-4 text-center">
              <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#7ab3c8] mb-1">{s.label}</div>
              <div className="font-bebas text-3xl mb-0.5" style={{ color: s.color }}>{s.value}</div>
              <div className="font-space text-[9px] text-[#6a8090]">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Status banner */}
        <div className="border border-[#ffd70040] bg-[#0a0900] p-4 mb-10 flex items-center gap-4">
          <div className="shrink-0 font-sharetech text-[9px] tracking-[0.2em] px-3 py-1.5 border border-[#ffd70060] text-[#ffd700] bg-[#1a1400]">
            ⏳ IDO PRÓXIMAMENTE
          </div>
          <div className="font-space text-[10px] text-[#8a9090] flex-1">
            El IDO de $PSY está programado para Q1 2026. Únete a la whitelist y sé de los primeros en acceder al precio de lanzamiento.
          </div>
          <button
            onClick={() => setShowWhitelist(true)}
            className="shrink-0 px-4 py-2 font-sharetech text-[9px] tracking-[0.15em] border border-[#ffd700] text-[#ffd700] hover:bg-[#1a1400] transition-colors"
          >
            WHITELIST
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["tokenomics", "utility", "roadmap"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`font-sharetech text-[9px] tracking-[0.2em] px-4 py-2 border transition-colors ${activeTab === tab ? "border-[#e040fb] text-[#e040fb] bg-[#0d001a]" : "border-[#0d2030] text-[#7ab3c8] hover:border-[#7ab3c8]"}`}>
              {tab === "tokenomics" ? "TOKENOMICS" : tab === "utility" ? "UTILIDAD" : "ROADMAP"}
            </button>
          ))}
        </div>

        {/* TOKENOMICS tab */}
        {activeTab === "tokenomics" && (
          <div>
            <div className="border border-[#0d2030] bg-[#040f18] p-6 mb-4">
              <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-4">DISTRIBUCIÓN — 100,000,000 $PSY</div>
              <div className="flex h-8 rounded overflow-hidden mb-4">
                {TOKENOMICS.map(t => (
                  <div key={t.name} style={{ width: `${t.pct}%`, backgroundColor: t.color }} title={`${t.name}: ${t.pct}%`} />
                ))}
              </div>
              <div className="space-y-2">
                {TOKENOMICS.map(t => (
                  <div key={t.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: t.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-sharetech text-[9px] tracking-[0.1em] text-white">{t.name}</span>
                        <span className="font-bebas text-lg shrink-0" style={{ color: t.color }}>{t.pct}%</span>
                      </div>
                      <div className="font-space text-[9px] text-[#7ab3c8]">{t.desc}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-space text-[9px] text-[#6a8090]">{(t.pct * 1_000_000).toLocaleString("en")} PSY</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[#0d2030] bg-[#040f18] p-5">
              <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-3">RESUMEN DE VESTING</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "IDO (10%)", vesting: "TGE 20% + 12M lineal", color: "#ff6d00" },
                  { label: "Equipo (15%)", vesting: "Cliff 6M + 24M lineal", color: "#e040fb" },
                  { label: "Comunidad (35%)", vesting: "Distribuido en 36M", color: "#00e5ff" },
                  { label: "Liquidez (20%)", vesting: "TGE 50% + 12M lineal", color: "#00e676" },
                ].map(v => (
                  <div key={v.label} className="border border-[#0d2030] p-3">
                    <div className="font-sharetech text-[8px] tracking-[0.15em] mb-1" style={{ color: v.color }}>{v.label}</div>
                    <div className="font-space text-[9px] text-[#6a8090]">{v.vesting}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* UTILITY tab */}
        {activeTab === "utility" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {UTILITY.map(u => (
              <div key={u.title} className="border border-[#0d2030] bg-[#040f18] p-5">
                <div className="text-2xl mb-3">{u.icon}</div>
                <div className="font-sharetech text-[9px] tracking-[0.15em] text-[#e040fb] mb-2">{u.title}</div>
                <div className="font-space text-[10px] text-[#6a8090] leading-relaxed">{u.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* ROADMAP tab */}
        {activeTab === "roadmap" && (
          <div className="space-y-3">
            {ROADMAP.map((r, i) => (
              <div key={r.quarter} className={`border p-5 ${r.done ? "border-[#00e67640] bg-[#001a0a]" : "border-[#0d2030] bg-[#040f18]"}`}>
                <div className="flex items-start gap-4">
                  <div className="shrink-0 text-center">
                    <div className="font-bebas text-sm tracking-wider mb-1" style={{ color: r.color }}>{r.quarter}</div>
                    <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] mx-auto"
                      style={{ borderColor: r.color, backgroundColor: r.done ? r.color : "transparent", color: r.done ? "#000" : r.color }}>
                      {r.done ? "✓" : String(i + 1)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-bebas text-lg tracking-wider text-white mb-2">{r.title}</div>
                    <div className="space-y-1">
                      {r.items.map(item => (
                        <div key={item} className="flex items-center gap-2">
                          <span style={{ color: r.color }} className="text-[10px] shrink-0">{r.done ? "✓" : "○"}</span>
                          <span className={`font-space text-[9px] ${r.done ? "text-[#6a8090]" : "text-[#8a9090]"}`}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {r.done && <div className="shrink-0 font-sharetech text-[8px] tracking-[0.15em] text-[#00e676] border border-[#00e67640] bg-[#001a0a] px-2 py-0.5">COMPLETADO</div>}
                  {!r.done && r.color === "#ffd700" && <div className="shrink-0 font-sharetech text-[8px] tracking-[0.15em] text-[#ffd700] border border-[#ffd70040] bg-[#1a1400] px-2 py-0.5">EN CURSO</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 border border-[#e040fb30] bg-[#0a0012] p-8 text-center">
          <div className="font-bebas text-3xl text-[#e040fb] mb-2">ÚNETE A LA WHITELIST</div>
          <div className="font-space text-[11px] text-[#6a8090] mb-6">
            Sé de los primeros en acceder al $PSY Token. Los whitelisters reciben precio de preventa con 30% de descuento y acceso prioritario.
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowWhitelist(true)}
              className="px-8 py-3 bg-[#e040fb] text-black font-bebas text-xl tracking-widest hover:bg-[#ea6bfb] transition-colors"
            >
              UNIRME A WHITELIST
            </button>
            <button className="px-6 py-3 border border-[#e040fb40] text-[#e040fb] font-sharetech text-[9px] tracking-[0.15em] hover:bg-[#0d001a] transition-colors">
              VER WHITEPAPER
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
