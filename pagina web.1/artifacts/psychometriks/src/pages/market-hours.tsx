import React, { useState, useEffect } from "react";
import SiteNav from "@/components/site-nav";

interface Market {
  name: string;
  city: string;
  tz: string;
  open: number;
  close: number;
  days: number[];
  color: string;
  glow: string;
  icon: string;
  pair: string;
}

const MARKETS: Market[] = [
  { name: "CRYPTO",       city: "24 / 7",        tz: "UTC",                open:  0, close: 24, days: [0,1,2,3,4,5,6], color: "#00e5ff", glow: "#00e5ff40", icon: "₿", pair: "Bitcoin / Altcoins" },
  { name: "NEW YORK",     city: "NYSE · NASDAQ",  tz: "America/New_York",   open:  9.5, close: 16,  days: [1,2,3,4,5],   color: "#00e676", glow: "#00e67640", icon: "🗽", pair: "SPX · NDX · DJI" },
  { name: "LONDON",       city: "LSE · FTSE",     tz: "Europe/London",      open:  8, close: 16.5, days: [1,2,3,4,5],   color: "#e040fb", glow: "#e040fb40", icon: "🏛", pair: "FTSE 100 · LIBOR" },
  { name: "FRANKFURT",    city: "XETRA · DAX",    tz: "Europe/Berlin",      open:  9, close: 17.5, days: [1,2,3,4,5],   color: "#ffd700", glow: "#ffd70040", icon: "🦅", pair: "DAX 40 · EuroStoxx" },
  { name: "TOKIO",        city: "TSE · Nikkei",   tz: "Asia/Tokyo",         open:  9, close: 15.5, days: [1,2,3,4,5],   color: "#ff6d00", glow: "#ff6d0040", icon: "🗼", pair: "Nikkei 225 · TOPIX" },
  { name: "HONG KONG",    city: "HKEX",           tz: "Asia/Hong_Kong",     open:  9.5, close: 16, days: [1,2,3,4,5],   color: "#ff1744", glow: "#ff174440", icon: "🏙", pair: "Hang Seng · HSI" },
  { name: "SYDNEY",       city: "ASX",            tz: "Australia/Sydney",   open: 10, close: 16,   days: [1,2,3,4,5],   color: "#69f0ae", glow: "#69f0ae40", icon: "🦘", pair: "ASX 200 · XJO" },
  { name: "FOREX",        city: "OTC Global",     tz: "UTC",                open:  0, close: 24,   days: [1,2,3,4,5],   color: "#80d8ff", glow: "#80d8ff40", icon: "💱", pair: "EUR/USD · GBP/USD · USD/JPY" },
];

const SESSIONS = [
  { name: "TOKIO",     start: 0,  end: 9,  color: "#ff6d00", label: "Baja volatilidad — Asia abre" },
  { name: "LONDON",    start: 8,  end: 16, color: "#e040fb", label: "Alta volatilidad — Europa domina" },
  { name: "OVERLAP",   start: 13, end: 17, color: "#ffd700", label: "MÁX VOLATILIDAD — NY + London solapados" },
  { name: "NEW YORK",  start: 13.5, end: 22, color: "#00e676", label: "Volatilidad media-alta — NY cierra" },
];

function nowInTz(tz: string): { h: number; m: number; day: number } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour: "numeric", minute: "numeric", weekday: "short", hour12: false,
  }).formatToParts(now);
  const h   = parseInt(parts.find(p => p.type === "hour")?.value ?? "0", 10);
  const m   = parseInt(parts.find(p => p.type === "minute")?.value ?? "0", 10);
  const wdStr = parts.find(p => p.type === "weekday")?.value ?? "Mon";
  const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { h, m, day: wdMap[wdStr] ?? 1 };
}

function isOpen(m: Market, now: Date): { open: boolean; hoursLeft: number } {
  if (m.name === "CRYPTO") return { open: true, hoursLeft: 99 };
  const { h, m: min, day } = nowInTz(m.tz);
  const decimal = h + min / 60;
  const inDay   = m.days.includes(day);
  const inTime  = decimal >= m.open && decimal < m.close;
  const hoursLeft = inDay && inTime ? m.close - decimal : 0;
  return { open: inDay && inTime, hoursLeft };
}

function localTimeInTz(tz: string): string {
  return new Intl.DateTimeFormat("es-EC", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(new Date());
}

function utcHourNow(): number {
  const now = new Date();
  return now.getUTCHours() + now.getUTCMinutes() / 60;
}

export default function MarketHours() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const utcH = utcHourNow();

  return (
    <div className="min-h-screen bg-[#020b12] text-white">
      <SiteNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">

        {/* Header */}
        <div className="mb-10">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-3">
            PSY LIQMAP · SESIONES
          </div>
          <h1 className="font-bebas text-5xl md:text-6xl leading-none text-white mb-2">
            MARKET <span className="text-[#00e5ff]">HOURS</span>
          </h1>
          <p className="font-space text-[11px] text-[#7ab3c8]">
            Estado en tiempo real de los principales mercados mundiales · Zonas de mayor volatilidad
          </p>
        </div>

        {/* UTC Clock */}
        <div className="flex items-center gap-6 mb-10 p-4 border border-[#0d2030] bg-[#040f18]">
          <div>
            <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#7ab3c8]">UTC / GMT</div>
            <div className="font-bebas text-3xl text-[#00e5ff] tracking-wider">{localTimeInTz("UTC")}</div>
          </div>
          <div className="h-8 w-px bg-[#0d2030]" />
          <div>
            <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#7ab3c8]">TU HORA LOCAL</div>
            <div className="font-bebas text-3xl text-white tracking-wider">
              {now.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
            </div>
          </div>
        </div>

        {/* 24h timeline */}
        <div className="mb-10 p-5 border border-[#0d2030] bg-[#040f18]">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-4">SESIONES · 24 HORAS UTC</div>
          <div className="relative h-10 bg-[#020b12] rounded overflow-hidden mb-2">
            {SESSIONS.map(s => (
              <div key={s.name} className="absolute top-0 h-full opacity-30 rounded" style={{
                left: `${(s.start / 24) * 100}%`,
                width: `${((s.end - s.start) / 24) * 100}%`,
                backgroundColor: s.color,
              }} />
            ))}
            {/* Current time indicator */}
            <div className="absolute top-0 h-full w-0.5 bg-white z-10" style={{ left: `${(utcH / 24) * 100}%` }}>
              <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-white" />
            </div>
          </div>
          {/* Hour labels */}
          <div className="flex justify-between font-space text-[9px] text-[#7ab3c8] mb-4">
            {[0, 3, 6, 9, 12, 15, 18, 21, 24].map(h => (
              <span key={h}>{String(h).padStart(2, "0")}:00</span>
            ))}
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SESSIONS.map(s => (
              <div key={s.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: s.color, opacity: 0.7 }} />
                <span className="font-space text-[9px] text-[#6a8090]">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Markets grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
          {MARKETS.map(m => {
            const { open, hoursLeft } = isOpen(m, now);
            const localTime = localTimeInTz(m.tz);
            return (
              <div key={m.name} className="border border-[#0d2030] bg-[#040f18] p-5 flex items-start gap-4" style={{
                borderColor: open ? m.glow.replace("40", "60") : "#0d2030",
                boxShadow: open ? `0 0 12px ${m.glow}` : "none",
              }}>
                <div className="text-2xl shrink-0 mt-1">{m.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-bebas text-xl tracking-widest" style={{ color: m.color }}>{m.name}</div>
                    <div className={`font-sharetech text-[9px] tracking-[0.2em] px-2 py-0.5 ${open ? "text-[#00e676] border border-[#00e67640] bg-[#001a0a]" : "text-[#7ab3c8] border border-[#0d2030] bg-[#020b12]"}`}>
                      {m.name === "CRYPTO" ? "SIEMPRE ABIERTO" : m.name === "FOREX" ? "SIEMPRE ABIERTO" : open ? `ABIERTO · ${Math.floor(hoursLeft)}h ${Math.floor((hoursLeft % 1) * 60)}m` : "CERRADO"}
                    </div>
                  </div>
                  <div className="font-space text-[10px] text-[#7ab3c8] mb-2">{m.city} · {m.pair}</div>
                  <div className="flex items-center justify-between">
                    <div className="font-bebas text-lg tracking-wider text-white">{localTime}</div>
                    <div className="font-space text-[9px] text-[#7ab3c8]">
                      {m.name === "CRYPTO" || m.name === "FOREX" ? "Non-stop" : `${String(Math.floor(m.open)).padStart(2,"0")}:${m.open % 1 ? "30" : "00"} – ${String(Math.floor(m.close)).padStart(2,"0")}:${m.close % 1 ? "30" : "00"} local`}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Best trading windows */}
        <div className="border border-[#ffd70022] bg-[#0a0900] p-5">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#ffd700] mb-4">⚡ MEJORES VENTANAS PARA OPERAR CRYPTO</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { time: "13:00 – 17:00 UTC", label: "OVERLAP NY + LONDON", tip: "Máxima liquidez y volatilidad. Ideal para breakouts y reversals. El 60% de los movimientos diarios de BTC ocurren aquí.", color: "#ffd700" },
              { time: "08:00 – 13:00 UTC", label: "SESIÓN EUROPEA", tip: "London mueve el mercado. Funding rates se resetean. Buena ventana para entries con estructura diaria confirmada.", color: "#e040fb" },
              { time: "21:00 – 01:00 UTC", label: "ASIA NOCTURNA", tip: "Menor volumen. Acumulación/distribución silenciosa. Ojo con manipulaciones antes de apertura europea.", color: "#ff6d00" },
            ].map(w => (
              <div key={w.time} className="border-l-2 pl-4" style={{ borderColor: w.color }}>
                <div className="font-bebas text-lg tracking-wider mb-1" style={{ color: w.color }}>{w.time}</div>
                <div className="font-sharetech text-[9px] tracking-[0.15em] text-white mb-2">{w.label}</div>
                <div className="font-space text-[10px] text-[#6a8090] leading-relaxed">{w.tip}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
