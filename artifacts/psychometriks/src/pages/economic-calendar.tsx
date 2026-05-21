import React, { useState } from "react";
import SiteNav from "@/components/site-nav";

type Impact = "HIGH" | "MEDIUM" | "LOW";

interface CalEvent {
  date: string;
  time: string;
  country: string;
  flag: string;
  event: string;
  impact: Impact;
  forecast?: string;
  previous?: string;
  actual?: string;
  btcImpact: string;
  description: string;
}

const EVENTS: CalEvent[] = [
  {
    date: "2026-05-07", time: "14:00", country: "US", flag: "🇺🇸",
    event: "FOMC Meeting Minutes",
    impact: "HIGH", forecast: "—", previous: "Hawkish",
    btcImpact: "ALTO",
    description: "Actas de la última reunión de la Fed. Si revelan postura más dovish → impulso alcista para BTC. Hawkish → presión bajista.",
  },
  {
    date: "2026-05-13", time: "12:30", country: "US", flag: "🇺🇸",
    event: "CPI (Inflación mensual)",
    impact: "HIGH", forecast: "3.1%", previous: "3.2%",
    btcImpact: "ALTO",
    description: "Dato clave de inflación. CPI bajo → Fed puede bajar tasas → positivo para activos de riesgo y BTC. CPI alto → Fed hawkish → bajada probable en crypto.",
  },
  {
    date: "2026-05-15", time: "12:30", country: "US", flag: "🇺🇸",
    event: "PPI (Precios Productor)",
    impact: "MEDIUM", forecast: "2.8%", previous: "3.0%",
    btcImpact: "MEDIO",
    description: "Indicador adelantado de inflación. Correlación alta con CPI del mes siguiente. Mueve mercados cripto si difiere mucho del forecast.",
  },
  {
    date: "2026-05-16", time: "12:30", country: "US", flag: "🇺🇸",
    event: "Desempleo — Jobless Claims",
    impact: "MEDIUM", forecast: "220K", previous: "228K",
    btcImpact: "MEDIO",
    description: "Claims semanales de desempleo. Dato muy bajo → economía fuerte → Fed mantiene tasas altas → leve presión bajista en BTC.",
  },
  {
    date: "2026-06-04", time: "12:30", country: "US", flag: "🇺🇸",
    event: "NFP — Non-Farm Payrolls",
    impact: "HIGH", forecast: "175K", previous: "190K",
    btcImpact: "ALTO",
    description: "El dato de empleo más importante del mes. NFP bajo → Fed dovish → bullish BTC. NFP alto sorpresivo → tasas altas → bearish BTC. Evento de alta volatilidad.",
  },
  {
    date: "2026-06-11", time: "18:00", country: "US", flag: "🇺🇸",
    event: "Decisión de Tasas Fed (FOMC)",
    impact: "HIGH", forecast: "5.25%", previous: "5.50%",
    btcImpact: "MUY ALTO",
    description: "El evento macro más importante para BTC. Una bajada de tasas inesperada puede impulsar +5-10% en BTC en minutos. Una subida o pausa hawkish puede provocar -5-8%.",
  },
  {
    date: "2026-06-12", time: "12:30", country: "US", flag: "🇺🇸",
    event: "CPI (Inflación mensual)",
    impact: "HIGH", forecast: "3.0%", previous: "3.1%",
    btcImpact: "ALTO",
    description: "CPI post-FOMC. Define si la Fed tomó la decisión correcta. Dato sorpresivo puede revertir el movimiento post-reunión.",
  },
  {
    date: "2026-06-19", time: "12:30", country: "US", flag: "🇺🇸",
    event: "Retail Sales (Ventas Minoristas)",
    impact: "MEDIUM", forecast: "+0.4%", previous: "+0.2%",
    btcImpact: "BAJO",
    description: "Mide el gasto del consumidor. Fuerte → economía sana pero inflación latente → neutral-bearish BTC. Débil → recesión temida → risk-off → puede bajar BTC.",
  },
  {
    date: "2026-06-25", time: "13:00", country: "US", flag: "🇺🇸",
    event: "Fed Chair Powell — Discurso",
    impact: "HIGH", forecast: "—", previous: "—",
    btcImpact: "ALTO",
    description: "Cualquier comentario de Powell sobre tasas o balance sheet mueve BTC agresivamente. Palabras clave a monitorear: 'restrictive', 'data-dependent', 'pivot'.",
  },
  {
    date: "2026-07-02", time: "12:30", country: "US", flag: "🇺🇸",
    event: "NFP — Non-Farm Payrolls",
    impact: "HIGH", forecast: "170K", previous: "175K",
    btcImpact: "ALTO",
    description: "NFP mensual. Dato de empleo más monitoreado del mundo. Alta volatilidad en crypto en los primeros 15 minutos después del dato.",
  },
  {
    date: "2026-07-10", time: "12:30", country: "US", flag: "🇺🇸",
    event: "CPI (Inflación mensual)",
    impact: "HIGH", forecast: "2.9%", previous: "3.0%",
    btcImpact: "MUY ALTO",
    description: "Con potencial bajada de tasas en el horizonte, cada CPI se vuelve más crítico. Si CPI < 2.5% → mercado premia activos de riesgo agresivamente.",
  },
];

const IMPACT_COLORS: Record<Impact, { color: string; bg: string; label: string }> = {
  HIGH:   { color: "#ff1744", bg: "#ff174415", label: "🔴 ALTO" },
  MEDIUM: { color: "#ffd700", bg: "#ffd70015", label: "🟡 MEDIO" },
  LOW:    { color: "#00e676", bg: "#00e67615", label: "🟢 BAJO" },
};

const BTC_IMPACT_COLOR: Record<string, string> = {
  "MUY ALTO": "#ff1744",
  "ALTO":     "#ff6d00",
  "MEDIO":    "#ffd700",
  "BAJO":     "#00e676",
};

type FilterImpact = "ALL" | Impact;

export default function EconomicCalendar() {
  const [filterImpact, setFilterImpact] = useState<FilterImpact>("ALL");
  const [expanded, setExpanded]         = useState<string | null>(null);

  const today     = new Date().toISOString().split("T")[0];
  const filtered  = EVENTS.filter(e => filterImpact === "ALL" || e.impact === filterImpact);
  const upcoming  = filtered.filter(e => e.date >= today);
  const past      = filtered.filter(e => e.date < today);

  const EventCard = ({ e, isPast }: { e: CalEvent; isPast: boolean }) => {
    const imp  = IMPACT_COLORS[e.impact];
    const key  = `${e.date}-${e.event}`;
    const open = expanded === key;
    return (
      <div
        className="border border-[#1a2535] bg-[#060a0f] transition-all cursor-pointer hover:border-[#1a2535aa]"
        onClick={() => setExpanded(open ? null : key)}>
        <div className="p-4 flex items-start gap-3">
          {/* Date block */}
          <div className="shrink-0 text-center w-12">
            <div className="font-mono text-[10px] text-[#5a8898]">
              {new Date(e.date + "T12:00:00").toLocaleDateString("es-EC", { month: "short" }).toUpperCase()}
            </div>
            <div className="font-bebas text-3xl text-white leading-none">
              {new Date(e.date + "T12:00:00").getDate()}
            </div>
            <div className="font-space text-[9px] text-[#7ab3c8]">
              {new Date(e.date + "T12:00:00").toLocaleDateString("es-EC", { weekday: "short" }).toUpperCase()}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-[11px] text-[#7ab3c8]">{e.time} UTC</span>
              <span className="text-base">{e.flag}</span>
              <span className="font-space text-[10px] text-[#7ab3c8]">{e.country}</span>
              <span className="font-space text-[9px] px-1.5 py-0.5 border"
                style={{ color: imp.color, borderColor: imp.color + "44", background: imp.bg }}>
                {imp.label}
              </span>
              {isPast && <span className="font-space text-[9px] text-[#5a8898] border border-[#1a2535] px-1.5 py-0.5">PASADO</span>}
            </div>
            <div className="font-space text-[13px] text-white mb-2">{e.event}</div>
            <div className="flex items-center gap-4 flex-wrap">
              {e.forecast && (
                <div>
                  <span className="font-space text-[9px] text-[#5a8898]">FORECAST </span>
                  <span className="font-mono text-[11px] text-[#ffd700]">{e.forecast}</span>
                </div>
              )}
              {e.previous && (
                <div>
                  <span className="font-space text-[9px] text-[#5a8898]">PREV </span>
                  <span className="font-mono text-[11px] text-[#7ab3c8]">{e.previous}</span>
                </div>
              )}
              {e.actual && (
                <div>
                  <span className="font-space text-[9px] text-[#5a8898]">ACTUAL </span>
                  <span className="font-mono text-[12px] font-bold text-white">{e.actual}</span>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="font-space text-[9px] text-[#5a8898] mb-1">IMPACTO BTC</div>
            <div className="font-space text-[10px] font-bold" style={{ color: BTC_IMPACT_COLOR[e.btcImpact] }}>
              {e.btcImpact}
            </div>
            <div className="mt-2 font-space text-[10px] text-[#5a8898]">{open ? "▲" : "▼"}</div>
          </div>
        </div>

        {open && (
          <div className="px-4 pb-4 border-t border-[#1a2535]">
            <div className="mt-3 p-3 bg-[#080d14] border border-[#1a2535]">
              <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.1em] mb-2">📊 ANÁLISIS PSY</div>
              <p className="font-space text-[12px] text-[#8a9ab0] leading-relaxed">{e.description}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

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
            Eventos macro clave que mueven BTC y los mercados cripto. FOMC, CPI, NFP — con análisis del impacto esperado.
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

        {/* Filter */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="font-space text-[10px] text-[#5a8898]">IMPACTO:</span>
          {(["ALL", "HIGH", "MEDIUM", "LOW"] as FilterImpact[]).map(f => (
            <button key={f} onClick={() => setFilterImpact(f)}
              className="font-space text-[9px] px-3 py-1.5 border transition-all"
              style={{
                borderColor: filterImpact === f ? (f === "ALL" ? "#00e5ff" : IMPACT_COLORS[f as Impact]?.color ?? "#00e5ff") : "#1a2535",
                color: filterImpact === f ? (f === "ALL" ? "#00e5ff" : IMPACT_COLORS[f as Impact]?.color ?? "#00e5ff") : "#4a6070",
                background: filterImpact === f ? "rgba(255,255,255,0.04)" : "transparent",
              }}>
              {f === "ALL" ? "TODOS" : IMPACT_COLORS[f as Impact].label}
            </button>
          ))}
          <div className="ml-auto font-space text-[10px] text-[#5a8898]">{upcoming.length} próximos · {past.length} pasados</div>
        </div>

        {/* Upcoming events */}
        {upcoming.length > 0 && (
          <div className="mb-8">
            <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.3em] uppercase mb-4 flex items-center gap-3">
              <span>📅 PRÓXIMOS EVENTOS</span>
              <div className="flex-1 h-px bg-[#1a2535]" />
            </div>
            <div className="space-y-2">
              {upcoming.map((e, i) => <EventCard key={i} e={e} isPast={false} />)}
            </div>
          </div>
        )}

        {/* Past events */}
        {past.length > 0 && (
          <div>
            <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.3em] uppercase mb-4 flex items-center gap-3">
              <span>📁 EVENTOS PASADOS</span>
              <div className="flex-1 h-px bg-[#1a2535]" />
            </div>
            <div className="space-y-2 opacity-60">
              {past.map((e, i) => <EventCard key={i} e={e} isPast={true} />)}
            </div>
          </div>
        )}

        {/* Telegram alert CTA */}
        <div className="mt-8 border border-[#00e5ff22] bg-[#060a0f] p-6 text-center">
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
