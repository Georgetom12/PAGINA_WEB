import React, { useState, useEffect } from "react";
import SiteNav from "@/components/site-nav";

const STORAGE_KEY = "psy_affiliate_v1";

interface AffiliateState {
  referralCode: string;
  clicks: number;
  signups: number;
  conversions: number;
  earnedUSD: number;
}

const TIERS = [
  { name: "TRADER",      min: 0,   max: 4,   pct: 20, color: "#4a6070", icon: "👤", perks: ["20% comisión mensual recurrente", "Dashboard de referidos", "Link personalizado"] },
  { name: "ANALISTA",    min: 5,   max: 14,  pct: 25, color: "#00e676", icon: "📊", perks: ["25% comisión mensual recurrente", "Bonos por volumen", "Material de marketing"] },
  { name: "ESTRATEGA",   min: 15,  max: 29,  pct: 30, color: "#00e5ff", icon: "🎯", perks: ["30% comisión mensual recurrente", "Acceso VIP anticipado a features", "Soporte prioritario"] },
  { name: "INSTITUCIONAL", min: 30, max: 999, pct: 35, color: "#e040fb", icon: "🏛", perks: ["35% comisión mensual recurrente", "Comisiones por vida del cliente", "Revenue share adicional"] },
];

const FAQ = [
  { q: "¿Cómo funciona el programa?", a: "Compartes tu link único. Cuando alguien se suscribe usando tu referido, recibes un porcentaje recurrente de su plan mensualmente durante toda su suscripción." },
  { q: "¿Cuándo cobro mis comisiones?", a: "Las comisiones se liquidan el día 1 de cada mes. El mínimo de pago es $50 USD. Puedes elegir pago en USDT, BTC o transferencia bancaria." },
  { q: "¿Hay un límite de referidos?", a: "No hay límite. Cuantos más referidos activos tengas, más sube tu tier y mayor es tu porcentaje de comisión." },
  { q: "¿Qué pasa si un referido cancela su suscripción?", a: "Dejas de recibir la comisión de ese cliente. Por eso incentivamos referir a traders serios que usen la plataforma activamente." },
  { q: "¿Puedo ser afiliado y cliente al mismo tiempo?", a: "Sí, de hecho es la combinación más poderosa. Usas las herramientas, las recomiendas desde experiencia real y generas ingresos pasivos." },
];

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const auth = localStorage.getItem("psyko_auth");
  let seed = 0;
  if (auth) {
    try {
      const parsed = JSON.parse(auth) as { user?: string };
      const str = parsed.user ?? "PSY";
      for (let i = 0; i < str.length; i++) seed = (seed * 31 + str.charCodeAt(i)) >>> 0;
    } catch { seed = 0x50535900; }
  } else {
    seed = 0x50535900;
  }
  let result = "";
  for (let i = 0; i < 8; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    result += chars[seed % chars.length];
  }
  return result;
}

export default function Affiliate() {
  const [state, setState] = useState<AffiliateState | null>(null);
  const [copied, setCopied]   = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AffiliateState;
        // Regenerate code deterministically (no random) if stored
        setState(parsed);
        return;
      } catch { /* ignore */ }
    }
    // First visit: deterministic code, stats start at zero
    const code = generateCode();
    const ns: AffiliateState = { referralCode: code, clicks: 0, signups: 0, conversions: 0, earnedUSD: 0 };
    setState(ns);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ns));
  }, []);

  const currentTier = state ? TIERS.find(t => state.conversions >= t.min && state.conversions <= t.max) ?? TIERS[0] : TIERS[0];
  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1];
  const referralLink = state ? `https://psychometriks.com/?ref=${state.referralCode}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#020b12] text-white">
      <SiteNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">

        {/* Header */}
        <div className="mb-10">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-3">PSYCHOMETRIKS · PARTNERSHIPS</div>
          <h1 className="font-bebas text-5xl md:text-6xl leading-none text-white mb-2">
            PROGRAMA <span className="text-[#00e676]">AFILIADOS</span>
          </h1>
          <p className="font-space text-[11px] text-[#7ab3c8]">
            Gana hasta 35% de comisión recurrente mensual · Sin límite de referidos · Cobra en crypto o fiat
          </p>
        </div>

        {/* Hero stats */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { label: "COMISIÓN MÁXIMA", value: "35%", sub: "mensual recurrente", color: "#e040fb" },
            { label: "DURACIÓN", value: "∞", sub: "de por vida del cliente", color: "#00e5ff" },
            { label: "PAGO MÍNIMO", value: "$50", sub: "USDT, BTC o fiat", color: "#ffd700" },
          ].map(s => (
            <div key={s.label} className="border border-[#0d2030] bg-[#040f18] p-5 text-center">
              <div className="font-bebas text-4xl mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#7ab3c8] mb-1">{s.label}</div>
              <div className="font-space text-[9px] text-[#6a8090]">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Tiers */}
        <div className="mb-10">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-4">TIERS DEL PROGRAMA</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TIERS.map(tier => {
              const isActive = tier.name === currentTier.name;
              return (
                <div key={tier.name} className={`border p-4 transition-all ${isActive ? "bg-[#04090f]" : "bg-[#040f18]"}`}
                  style={{ borderColor: isActive ? tier.color : "#0d2030", boxShadow: isActive ? `0 0 12px ${tier.color}30` : "none" }}>
                  <div className="text-2xl mb-2">{tier.icon}</div>
                  <div className="font-bebas text-lg mb-0.5" style={{ color: tier.color }}>{tier.name}</div>
                  <div className="font-bebas text-3xl text-white mb-1">{tier.pct}%</div>
                  <div className="font-space text-[9px] text-[#7ab3c8] mb-3">{tier.min}+ referidos activos</div>
                  {tier.perks.map(p => (
                    <div key={p} className="flex items-start gap-1.5 mb-1">
                      <span className="text-[#00e676] text-[10px] mt-0.5 shrink-0">✓</span>
                      <span className="font-space text-[9px] text-[#6a8090]">{p}</span>
                    </div>
                  ))}
                  {isActive && <div className="mt-3 font-sharetech text-[8px] tracking-[0.15em] text-center py-1 border" style={{ color: tier.color, borderColor: `${tier.color}50` }}>▶ TU NIVEL ACTUAL</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* My affiliate panel */}
        {state && (
          <div className="mb-10 border border-[#00e67630] bg-[#001a0a] p-6">
            <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#00e676] mb-5">TU PANEL DE AFILIADO</div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: "CLICS TOTALES", value: state.clicks, color: "#00e5ff" },
                { label: "REGISTROS", value: state.signups, color: "#ffd700" },
                { label: "CONVERSIONES ACTIVAS", value: state.conversions, color: "#00e676" },
                { label: "GANADO TOTAL", value: `$${state.earnedUSD.toFixed(0)}`, color: "#e040fb" },
              ].map(s => (
                <div key={s.label} className="border border-[#0d2030] bg-[#040f18] p-3 text-center">
                  <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#7ab3c8] mb-1">{s.label}</div>
                  <div className="font-bebas text-2xl" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Tier progress */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-sharetech text-[9px] tracking-[0.15em]" style={{ color: currentTier.color }}>{currentTier.icon} {currentTier.name} — {currentTier.pct}% comisión</span>
                {nextTier && <span className="font-space text-[9px] text-[#7ab3c8]">→ {nextTier.name} en {nextTier.min - state.conversions} referidos más</span>}
              </div>
              <div className="h-1.5 bg-[#0d2030] rounded overflow-hidden">
                <div className="h-full rounded transition-all duration-700" style={{
                  backgroundColor: currentTier.color,
                  width: `${nextTier ? Math.min(100, ((state.conversions - currentTier.min) / (nextTier.min - currentTier.min)) * 100) : 100}%`,
                }} />
              </div>
            </div>

            {/* Referral link */}
            <div className="flex gap-2">
              <div className="flex-1 border border-[#0d2030] bg-[#020b12] px-3 py-2 font-space text-[10px] text-[#8a9090] truncate">
                {referralLink}
              </div>
              <button onClick={copyLink}
                className={`shrink-0 px-4 py-2 font-sharetech text-[9px] tracking-[0.15em] border transition-colors ${copied ? "border-[#00e676] text-[#00e676] bg-[#001a0a]" : "border-[#0d2030] text-[#7ab3c8] hover:border-[#00e676] hover:text-[#00e676]"}`}>
                {copied ? "✓ COPIADO" : "COPIAR LINK"}
              </button>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="mb-10">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-5">CÓMO FUNCIONA</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
            {[
              { step: "01", title: "Regístrate como afiliado", desc: "Completa el formulario en 2 minutos. Recibe tu código y link únicos de inmediato.", color: "#00e5ff" },
              { step: "02", title: "Comparte con traders reales", desc: "Comparte en redes, grupos de Telegram, Discord o por recomendación directa.", color: "#ffd700" },
              { step: "03", title: "Tus referidos se suscriben", desc: "Cuando se suscriben con tu link, la conversión queda registrada automáticamente.", color: "#e040fb" },
              { step: "04", title: "Cobra mensualmente", desc: "El día 1 de cada mes cobras tu comisión en USDT, BTC o transferencia.", color: "#00e676" },
            ].map(s => (
              <div key={s.step} className="border border-[#0d2030] bg-[#040f18] p-4 relative">
                <div className="font-bebas text-5xl absolute top-3 right-3 opacity-10" style={{ color: s.color }}>{s.step}</div>
                <div className="font-bebas text-sm mb-2" style={{ color: s.color }}>PASO {s.step}</div>
                <div className="font-sharetech text-[9px] tracking-[0.1em] text-white mb-2">{s.title}</div>
                <div className="font-space text-[9px] text-[#6a8090] leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-10">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-4">PREGUNTAS FRECUENTES</div>
          <div className="space-y-1">
            {FAQ.map((item, i) => (
              <div key={i} className="border border-[#0d2030] bg-[#040f18]">
                <button className="w-full flex items-center justify-between p-4 text-left" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-space text-[10px] text-white">{item.q}</span>
                  <span className="font-sharetech text-[10px] text-[#7ab3c8] shrink-0 ml-4">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 font-space text-[10px] text-[#6a8090] leading-relaxed border-t border-[#060d16] pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="border border-[#00e67630] bg-[#001a0a] p-8 text-center">
          <div className="font-bebas text-3xl text-[#00e676] mb-2">¿LISTO PARA GANAR CON PSYCHOMETRIKS?</div>
          <div className="font-space text-[11px] text-[#6a8090] mb-6">Únete a los afiliados que ya generan ingresos pasivos enseñando trading con las mejores herramientas</div>
          <button className="px-8 py-3 bg-[#00e676] text-black font-bebas text-xl tracking-widest hover:bg-[#33eb91] transition-colors">
            UNIRME COMO AFILIADO
          </button>
        </div>

      </div>
    </div>
  );
}
