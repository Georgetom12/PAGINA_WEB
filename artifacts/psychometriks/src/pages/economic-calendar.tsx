import React, { useEffect, useRef } from "react";
import SiteNav from "@/components/site-nav";

// (julio 20 2026) Antes esto era una lista de eventos ESCRITA A MANO
// (fechas fijas de mayo-julio 2026, forecast/previous inventados, "actual"
// siempre vacío) — para julio 2026 ya estaba 100% vencido, todo aparecía
// como "PASADO". Reemplazado por el widget real de Calendario Económico de
// TradingView (gratis, sin API key, sin límite de cuota) — mismo patrón ya
// usado y probado en psy-oracle.tsx (Pro) y bolsa-valores.tsx.
function EconomicCalendarWidget() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const container = document.createElement("div");
    container.className = "tradingview-widget-container__widget";
    ref.current.appendChild(container);
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark", isTransparent: true, width: "100%", height: "100%",
      locale: "es", importanceFilter: "-1,0,1", currencyFilter: "USD",
    });
    ref.current.appendChild(script);
    return () => { if (ref.current) ref.current.innerHTML = ""; };
  }, []);
  return <div ref={ref} className="tradingview-widget-container" style={{ height: 650, width: "100%" }} />;
}

export default function EconomicCalendar() {
  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      <div className="pt-28 pb-16 px-4 md:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-3">Macro</div>
          <h1 className="font-bebas text-5xl md:text-7xl leading-none mb-3">
            CALENDARIO<br /><span className="text-[#00e5ff]">ECONÓMICO</span>
          </h1>
          <p className="font-space text-[12px] text-[#7ab3c8] max-w-xl leading-relaxed">
            Eventos macro clave que mueven BTC y los mercados cripto. FOMC, CPI, NFP — en vivo, actualizado en tiempo real.
          </p>
        </div>

        {/* Legend */}
        <div className="border border-[#1a2535] bg-[#060a0f] p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            {[
              { label: "FOMC",  icon: "🏦", desc: "Decisión de tasas Fed — máximo impacto" },
              { label: "CPI",   icon: "📊", desc: "Inflación mensual — correlación directa" },
              { label: "NFP",   icon: "👷", desc: "Empleo mensual — volatilidad alta" },
              { label: "PPI",   icon: "🏭", desc: "Precios productor — adelanta CPI" },
            ].map((item, i) => (
              <div key={i} className="border border-[#1a2535] p-3 bg-[#080d14]">
                <div className="text-xl mb-1">{item.icon}</div>
                <div className="font-space text-[10px] text-white font-bold mb-1">{item.label}</div>
                <div className="font-space text-[10px] text-[#5a8898] leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live TradingView calendar */}
        <div className="border border-[#1a2535] bg-[#060a0f] p-2 mb-8">
          <EconomicCalendarWidget />
        </div>

        {/* Telegram alert CTA */}
        <div className="border border-[#00e5ff22] bg-[#060a0f] p-6 text-center">
          <div className="text-3xl mb-3">📱</div>
          <div className="font-bebas text-2xl text-white mb-2">ALERTAS ANTES DEL EVENTO</div>
          <p className="font-space text-[12px] text-[#7ab3c8] mb-4">
            Seguí nuestro canal de Telegram — avisamos 1 hora antes de cada evento de alto impacto con el análisis esperado para BTC.
          </p>
          <a href="https://t.me/psychometriks_pro" target="_blank" rel="noopener noreferrer"
            className="inline-block font-space text-[12px] font-bold tracking-[0.15em] uppercase px-6 py-3 text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#2CA5E0,#229ED9)" }}>
            ✈️ UNIRSE AL CANAL
          </a>
        </div>
      </div>
    </div>
  );
}
