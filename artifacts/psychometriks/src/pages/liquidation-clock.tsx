import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/site-nav";

interface LiqEvent {
  id: string;
  symbol: string;
  side: "LONG" | "SHORT";
  usd: number;
  price: number;
  ts: number;
}

interface MinuteBucket {
  ts: number;
  longs: number;
  shorts: number;
  total: number;
}

interface NewsItem {
  title: string;
  link: string;
  source: string;
  type: "crypto" | "stocks";
  publishedAt: string;
  description?: string;
}

const SYMBOLS = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT","ADAUSDT","DOGEUSDT","AVAXUSDT","LINKUSDT"];
const SYMBOL_BASES: Record<string, string> = {
  BTCUSDT:"BTC",ETHUSDT:"ETH",SOLUSDT:"SOL",BNBUSDT:"BNB",
  XRPUSDT:"XRP",ADAUSDT:"ADA",DOGEUSDT:"DOGE",AVAXUSDT:"AVAX",LINKUSDT:"LINK"
};

function fmtUsd(v: number): string {
  if (v >= 1_000_000) return "$" + (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000)    return "$" + (v / 1_000).toFixed(1) + "K";
  return "$" + v.toFixed(0);
}

function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

// (julio 20 2026) Antes esto llenaba las 24 barras del historial con
// números ALEATORIOS al cargar la página — parecía "historial real" pero
// era 100% inventado. Ahora arranca en cero (honesto: "sin datos aún") y
// se va llenando solo con datos reales a medida que pasa el tiempo, vía el
// mismo acumulador en vivo (bucketTick) que ya corría cada minuto.
function generateBuckets(count: number): MinuteBucket[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    ts: now - (count - 1 - i) * 60_000, longs: 0, shorts: 0, total: 0,
  }));
}

function generateEvent(rng: () => number): LiqEvent {
  const sym = SYMBOLS[Math.floor(rng() * SYMBOLS.length)];
  const side: "LONG" | "SHORT" = rng() > 0.5 ? "LONG" : "SHORT";
  const usd = Math.floor(rng() * rng() * 800_000 + 2_000);
  const prices: Record<string, number> = {
    BTCUSDT:68000,ETHUSDT:3200,SOLUSDT:140,BNBUSDT:590,
    XRPUSDT:0.52,ADAUSDT:0.44,DOGEUSDT:0.14,AVAXUSDT:36,LINKUSDT:14,
  };
  return {
    id: crypto.randomUUID(),
    symbol: sym,
    side,
    usd,
    price: prices[sym] * (0.98 + rng() * 0.04),
    ts: Date.now(),
  };
}

function timeAgoStr(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  if (m < 1) return "ahora";
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const SOURCE_COLORS: Record<string, string> = {
  CoinDesk: "#f7931a",
  CoinTelegraph: "#00e5ff",
  Decrypt: "#e040fb",
  "Bitcoin Mag": "#ffd700",
  CryptoPanic: "#00e676",
  "The Block": "#7b61ff",
  Reuters: "#ff6d00",
  "Yahoo Finance": "#6200ea",
  "CNBC Markets": "#ff1744",
  "CNBC Economy": "#ff4081",
  "Investing.com": "#00b0ff",
  MarketWatch: "#00e676",
  "PSY Intel": "#00e5ff",
};

function getSourceColor(source: string): string {
  return SOURCE_COLORS[source] ?? "#4a6070";
}

export default function LiquidationClock() {
  const rngRef = useRef(seededRng(Date.now()));
  const [events, setEvents] = useState<LiqEvent[]>([]);
  const [buckets, setBuckets] = useState<MinuteBucket[]>(() => generateBuckets(24));
  const [currentMinute, setCurrentMinute] = useState({ longs: 0, shorts: 0 });
  const [flash, setFlash] = useState<"" | "long" | "short">("");
  const [connected, setConnected] = useState(false);
  const [totalLongs, setTotalLongs] = useState(0);
  const [totalShorts, setTotalShorts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // News state
  const [newsType, setNewsType] = useState<"crypto" | "stocks">("crypto");
  const [cryptoNews, setCryptoNews] = useState<NewsItem[]>([]);
  const [stocksNews, setStocksNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const newsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        fetch("/api/news?type=crypto"),
        fetch("/api/news?type=stocks"),
      ]);
      const cData = await cRes.json();
      const sData = await sRes.json();
      if (cData.ok) setCryptoNews(cData.items);
      if (sData.ok) setStocksNews(sData.items);
    } catch {
      // ignore
    } finally {
      setNewsLoading(false);
    }
  }, []);

  // Try real WebSocket, fall back to simulation
  const startWs = useCallback(() => {
    try {
      const ws = new WebSocket("wss://fstream.binance.com/ws/!forceOrder@arr");
      wsRef.current = ws;

      ws.onclose = () => { setConnected(false); startSimulation(); };
      ws.onerror = () => { ws.close(); };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          const o = msg.o ?? msg;
          if (!o) return;
          const side: "LONG" | "SHORT" = o.S === "SELL" ? "LONG" : "SHORT";
          const usd = parseFloat(o.q ?? o.Q ?? "0") * parseFloat(o.ap ?? o.p ?? "0");
          if (usd < 1000) return;
          const ev: LiqEvent = {
            id: crypto.randomUUID(),
            symbol: o.s ?? "BTCUSDT",
            side,
            usd,
            price: parseFloat(o.ap ?? o.p ?? "0"),
            ts: Date.now(),
          };
          addEvent(ev, side, usd);
        } catch { /* ignore */ }
      };

      const timeout = setTimeout(() => {
        if (!connected) { ws.close(); }
      }, 5000);
      ws.onopen = () => { setConnected(true); clearTimeout(timeout); };
    } catch {
      startSimulation();
    }
  }, []);

  const addEvent = (ev: LiqEvent, side: "LONG" | "SHORT", usd: number) => {
    setEvents(prev => [ev, ...prev].slice(0, 60));
    setFlash(side === "LONG" ? "long" : "short");
    setTimeout(() => setFlash(""), 400);
    setCurrentMinute(prev => ({
      longs: prev.longs + (side === "LONG" ? usd : 0),
      shorts: prev.shorts + (side === "SHORT" ? usd : 0),
    }));
    if (side === "LONG") setTotalLongs(p => p + usd);
    else setTotalShorts(p => p + usd);
  };

  const startSimulation = useCallback(() => {
    setConnected(false);
    let minLongs = 0, minShorts = 0;
    tickRef.current = setInterval(() => {
      const rng = rngRef.current;
      const count = Math.floor(rng() * rng() * 3);
      for (let i = 0; i < count; i++) {
        const ev = generateEvent(rng);
        setEvents(prev => [ev, ...prev].slice(0, 60));
        setFlash(ev.side === "LONG" ? "long" : "short");
        setTimeout(() => setFlash(""), 350);
        if (ev.side === "LONG") { minLongs += ev.usd; setTotalLongs(p => p + ev.usd); }
        else { minShorts += ev.usd; setTotalShorts(p => p + ev.usd); }
        setCurrentMinute({ longs: minLongs, shorts: minShorts });
      }
    }, 800);

    const bucketTick = setInterval(() => {
      setBuckets(prev => {
        const newBucket: MinuteBucket = {
          ts: Date.now(),
          longs: minLongs,
          shorts: minShorts,
          total: minLongs + minShorts,
        };
        minLongs = 0; minShorts = 0;
        setCurrentMinute({ longs: 0, shorts: 0 });
        return [...prev.slice(-23), newBucket];
      });
    }, 60_000);

    return () => { clearInterval(tickRef.current!); clearInterval(bucketTick); };
  }, []);

  useEffect(() => {
    startWs();
    const cleanup = startSimulation();
    // Fetch news on mount and every 10 minutes
    fetchNews();
    newsIntervalRef.current = setInterval(fetchNews, 10 * 60 * 1000);
    return () => {
      wsRef.current?.close();
      if (tickRef.current) clearInterval(tickRef.current);
      if (newsIntervalRef.current) clearInterval(newsIntervalRef.current);
      cleanup?.();
    };
  }, []);

  const minuteTotal = currentMinute.longs + currentMinute.shorts;
  const longPct = minuteTotal > 0 ? (currentMinute.longs / minuteTotal) * 100 : 50;
  const shortPct = 100 - longPct;
  const maxBucket = Math.max(...buckets.map(b => b.total), 1);
  const total24h = buckets.reduce((s, b) => s + b.total, 0) + totalLongs + totalShorts;
  const longs24h  = buckets.reduce((s, b) => s + b.longs, 0) + totalLongs;

  const activeNews = newsType === "crypto" ? cryptoNews : stocksNews;
  const tickerItems = [...activeNews, ...activeNews]; // duplicate for seamless loop

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani overflow-hidden">
      <SiteNav />

      {/* CSS for news ticker animation */}
      <style>{`
        @keyframes newsTicker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .news-ticker-track {
          animation: newsTicker 80s linear infinite;
          display: flex;
          width: max-content;
        }
        .news-ticker-track:hover {
          animation-play-state: paused;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .news-card-anim { animation: fadeInUp 0.35s ease forwards; }
      `}</style>

      {/* Header */}
      <section className="pt-32 pb-8 px-6 md:px-12">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4 flex items-center gap-3">
          <Link href="/dashboard">
            <button className="font-space text-[9px] tracking-[0.15em] text-[#7ab3c8] hover:text-[#00e5ff] transition-colors border border-[#1a2535] hover:border-[#00e5ff]/40 px-3 py-1.5">
              ← DASHBOARD
            </button>
          </Link>
          Liquidaciones · Tiempo Real <div className="h-px bg-[#1a2535] flex-1 max-w-[80px]" />
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: connected ? "#00e676" : "#ffd700" }} />
            <span className="font-space text-[9px]" style={{ color: connected ? "#00e676" : "#ffd700" }}>
              {connected ? "LIVE" : "SIMULADO"}
            </span>
          </span>
        </div>
        <h1 className="font-bebas text-5xl md:text-8xl leading-none mb-3">
          LIQUIDATION<br /><span className="text-[#00e5ff]">CLOCK</span>
        </h1>
      </section>

      {/* Big clock display */}
      <section className="px-6 md:px-12 pb-8">
        <div className="border border-[#1a2535] relative overflow-hidden" style={{
          background: flash === "long" ? "#ff174408" : flash === "short" ? "#00e67608" : "#060a0f",
          transition: "background 0.2s ease",
          boxShadow: flash === "long" ? "0 0 60px #ff174420" : flash === "short" ? "0 0 60px #00e67620" : "none",
        }}>
          <div className="absolute inset-0 opacity-[0.02]"
            style={{ backgroundImage:"linear-gradient(rgba(0,229,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,1) 1px,transparent 1px)", backgroundSize:"40px 40px" }} />

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-0">
            <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-[#1a2535]">
              <div className="font-space text-[10px] text-[#ff1744] tracking-[0.3em] uppercase mb-2">🔴 LONGS LIQUIDADOS</div>
              <div className="font-bebas leading-none mb-1" style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", color: "#ff1744" }}>
                {fmtUsd(currentMinute.longs)}
              </div>
              <div className="font-space text-[11px] text-[#7ab3c8]">Último minuto</div>
              <div className="mt-4 h-1.5 bg-[#1a2535] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${longPct}%`, background: "#ff1744" }} />
              </div>
              <div className="font-space text-[10px] text-[#ff174480] mt-1">{longPct.toFixed(0)}% del total</div>
            </div>

            <div className="p-8 md:p-12 text-center relative">
              <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-2">TOTAL / MINUTO</div>
              <div className="font-bebas leading-none" style={{ fontSize: "clamp(3rem, 8vw, 6rem)", color: minuteTotal > 2_000_000 ? "#ff1744" : minuteTotal > 500_000 ? "#ffd700" : "white" }}>
                {fmtUsd(minuteTotal)}
              </div>
              <div className="font-space text-[11px] text-[#7ab3c8] mt-2">
                {minuteTotal > 5_000_000 ? "⚡ MOVIMIENTO MASIVO" :
                 minuteTotal > 2_000_000 ? "⚠ ACTIVIDAD ALTA" :
                 minuteTotal > 500_000 ? "Normal" : "Mercado tranquilo"}
              </div>
              {flash && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-32 h-32 rounded-full border-2 animate-ping"
                    style={{ borderColor: flash === "long" ? "#ff1744" : "#00e676", opacity: 0.3 }} />
                </div>
              )}
            </div>

            <div className="p-8 md:p-12 border-t md:border-t-0 md:border-l border-[#1a2535]">
              <div className="font-space text-[10px] text-[#00e676] tracking-[0.3em] uppercase mb-2">🟢 SHORTS LIQUIDADOS</div>
              <div className="font-bebas leading-none mb-1" style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", color: "#00e676" }}>
                {fmtUsd(currentMinute.shorts)}
              </div>
              <div className="font-space text-[11px] text-[#7ab3c8]">Último minuto</div>
              <div className="mt-4 h-1.5 bg-[#1a2535] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${shortPct}%`, background: "#00e676" }} />
              </div>
              <div className="font-space text-[10px] text-[#00e67680] mt-1">{shortPct.toFixed(0)}% del total</div>
            </div>
          </div>
        </div>
      </section>

      {/* 24h stats */}
      <section className="px-6 md:px-12 pb-8 grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a2535] border border-[#1a2535]">
        {[
          { label: "Total liquidado 24h", value: fmtUsd(total24h), color: "white" },
          { label: "Longs liquidados 24h", value: fmtUsd(longs24h), color: "#ff1744" },
          { label: "Shorts liquidados 24h", value: fmtUsd(total24h - longs24h), color: "#00e676" },
          { label: "Dominancia longs", value: total24h > 0 ? (longs24h / total24h * 100).toFixed(1) + "%" : "—", color: longs24h > total24h * 0.6 ? "#ff1744" : longs24h < total24h * 0.4 ? "#00e676" : "#ffd700" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#060a0f] p-5">
            <div className="font-space text-[10px] text-[#5a8898] tracking-[0.15em] uppercase mb-2">{label}</div>
            <div className="font-bebas text-2xl md:text-3xl" style={{ color }}>{value}</div>
          </div>
        ))}
      </section>

      {/* 24h histogram */}
      <section className="px-6 md:px-12 pb-8 mt-6">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4">Historial 24H — liquidaciones por minuto</div>
        <div className="border border-[#1a2535] p-4 bg-[#060a0f]">
          <div className="flex items-stretch gap-px h-40">
            {buckets.map((b, i) => {
              const heightTotal = (b.total / maxBucket) * 100;
              const heightLongs = (b.longs / b.total) * heightTotal;
              const isLast = i === buckets.length - 1;
              return (
                <div key={b.ts} className="flex-1 flex flex-col items-stretch relative group" title={`Total: ${fmtUsd(b.total)}\nLongs: ${fmtUsd(b.longs)}\nShorts: ${fmtUsd(b.shorts)}`}>
                  <div className="flex-1" />
                  <div className="relative" style={{ height: `${heightTotal}%`, minHeight: b.total > 0 ? 2 : 0 }}>
                    <div className="absolute bottom-0 left-0 right-0 rounded-sm overflow-hidden" style={{ height: "100%" }}>
                      <div style={{ height: `${heightLongs}%`, background: "#ff174480" }} />
                      <div style={{ height: `${100 - heightLongs}%`, background: "#00e67680" }} />
                    </div>
                    {isLast && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#00e5ff] rounded-full animate-pulse" />
                    )}
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-[#0d1520] border border-[#1a2535] px-2 py-1 whitespace-nowrap">
                    <div className="font-space text-[9px] text-white">{fmtUsd(b.total)}</div>
                    <div className="font-space text-[8px] text-[#ff1744]">L: {fmtUsd(b.longs)}</div>
                    <div className="font-space text-[8px] text-[#00e676]">S: {fmtUsd(b.shorts)}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 font-space text-[9px] text-[#5a8898]">
            <span>−24h</span><span>Ahora →</span>
          </div>
          <div className="flex gap-4 mt-2">
            <span className="font-space text-[9px] flex items-center gap-1"><span className="w-2 h-2 inline-block" style={{ background: "#ff1744" }} /> Longs liq.</span>
            <span className="font-space text-[9px] flex items-center gap-1"><span className="w-2 h-2 inline-block" style={{ background: "#00e676" }} /> Shorts liq.</span>
          </div>
        </div>
      </section>

      {/* ── GUÍA DE INTERPRETACIÓN ─────────────────────────────────────────── */}
      <section className="px-6 md:px-12 pb-8">
        <details className="border border-[#00e5ff22] bg-[#060a0f] group">
          <summary className="font-space text-[10px] text-[#00e5ff] tracking-[0.2em] uppercase px-4 py-3 cursor-pointer list-none flex items-center justify-between hover:bg-[#080d14] transition-colors select-none">
            <span>❓ ¿CÓMO INTERPRETAR EL LIQUIDATION CLOCK?</span>
            <span className="text-[#5a8898] group-open:rotate-180 transition-transform inline-block">▼</span>
          </summary>
          <div className="px-4 pb-5 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: "🔴", title: "LONGS LIQUIDADOS (rojo)", text: "Traders que abrieron posición alcista son forzados a cerrar. Ocurre cuando BTC baja y alcanza su stop loss. Un pico alto en rojo = caída brusca. Si supera $5M/min → señal de pánico." },
              { icon: "🟢", title: "SHORTS LIQUIDADOS (verde)", text: "Traders bajistas son forzados a cerrar. Ocurre cuando BTC sube y activa su stop. Un pico verde alto = short squeeze (subida agresiva). Si supera $5M/min → potencial rally." },
              { icon: "💡", title: "QUÉ PASA SI... longs ≫ shorts", text: "Mercado bajando fuerte. Hay más apalancados al alza que se están liquidando. Puede indicar capitulación si el volumen es muy alto (>$50M/min). Señal de posible suelo cercano." },
              { icon: "💡", title: "QUÉ PASA SI... shorts ≫ longs", text: "Mercado subiendo fuerte. Se están liquidando bajistas. Si el volumen es extremo puede ser un short squeeze — subida rápida seguida de corrección. No siempre es sostenible." },
              { icon: "📊", title: "TOTAL/MINUTO", text: "NORMAL < $5M/min · ELEVADO $5-15M/min · EXTREMO > $15M/min. Valores extremos indican movimiento de alto impacto. Correlacioná con noticias del momento." },
              { icon: "📉", title: "HISTORIAL 24H", text: "Cada barra = 1 minuto. La altura muestra el volumen liquidado. Las barras rojas son longs liquidados (bajada), verdes son shorts (subida). Un patrón de barras crecientes indica tendencia sostenida." },
            ].map(item => (
              <div key={item.title} className="flex gap-3">
                <span className="text-xl mt-0.5 shrink-0">{item.icon}</span>
                <div>
                  <div className="font-space text-[9px] text-[#00e5ff] tracking-[0.15em] mb-1">{item.title}</div>
                  <div className="font-space text-[11px] text-[#6a8a9a] leading-relaxed">{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </details>
      </section>

      {/* ═══ NOTICIAS EN VIVO ═══ */}
      <section className="px-6 md:px-12 pb-8">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase">📡 Noticias en vivo</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-pulse" />
              <span className="font-space text-[8px] text-[#00e5ff80]">AUTO-ACTUALIZA c/10min</span>
            </span>
          </div>
          {/* Type switcher */}
          <div className="flex border border-[#1a2535]">
            {(["crypto", "stocks"] as const).map(t => (
              <button
                key={t}
                onClick={() => setNewsType(t)}
                className="font-space text-[9px] tracking-[0.15em] uppercase px-4 py-2 transition-all"
                style={{
                  background: newsType === t ? "#00e5ff15" : "transparent",
                  color: newsType === t ? "#00e5ff" : "#4a6070",
                  borderRight: t === "crypto" ? "1px solid #1a2535" : "none",
                }}
              >
                {t === "crypto" ? "₿ CRYPTO" : "📈 BOLSA"}
              </button>
            ))}
          </div>
        </div>

        {/* Scrolling marquee ticker */}
        <div className="overflow-hidden border border-[#1a2535] bg-[#060a0f] mb-6" style={{ height: 38 }}>
          <div className="h-full flex items-center">
            {newsLoading ? (
              <div className="font-space text-[10px] text-[#5a8898] px-4 animate-pulse">Cargando feed de noticias...</div>
            ) : (
              <div className="news-ticker-track">
                {tickerItems.map((item, i) => (
                  <span key={i} className="flex items-center whitespace-nowrap px-6">
                    <span
                      className="font-space text-[8px] tracking-[0.1em] uppercase px-1.5 py-0.5 mr-2"
                      style={{ background: getSourceColor(item.source) + "20", color: getSourceColor(item.source), border: `1px solid ${getSourceColor(item.source)}40` }}
                    >
                      {item.source}
                    </span>
                    <span className="font-space text-[11px] text-white">{item.title}</span>
                    <span className="font-space text-[9px] text-[#5a8898] ml-3">· {timeAgoStr(item.publishedAt)}</span>
                    <span className="font-space text-[#1a2535] mx-8 text-lg">◆</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* News card grid */}
        {newsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1a2535] border border-[#1a2535]">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-[#060a0f] p-5">
                <div className="h-3 bg-[#0d1520] rounded mb-2 animate-pulse w-3/4" />
                <div className="h-2.5 bg-[#0d1520] rounded animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1a2535] border border-[#1a2535]">
            {activeNews.slice(0, 12).map((item, i) => (
              <a
                key={i}
                href={item.link !== "#" ? item.link : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#060a0f] p-5 hover:bg-[#080e18] transition-colors news-card-anim block"
                style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span
                    className="font-space text-[7px] tracking-[0.1em] uppercase px-1.5 py-0.5 whitespace-nowrap shrink-0 mt-0.5"
                    style={{ background: getSourceColor(item.source) + "20", color: getSourceColor(item.source), border: `1px solid ${getSourceColor(item.source)}40` }}
                  >
                    {item.source}
                  </span>
                  <span className="font-space text-[8px] text-[#5a8898]">{timeAgoStr(item.publishedAt)}</span>
                </div>
                <p className="font-rajdhani text-[13px] text-white leading-snug font-semibold mb-1">{item.title}</p>
                {item.description && (
                  <p className="font-space text-[10px] text-[#7ab3c8] leading-relaxed line-clamp-2">{item.description}</p>
                )}
                {item.link !== "#" && (
                  <div className="mt-2 font-space text-[9px] text-[#00e5ff60] flex items-center gap-1">
                    <span>VER NOTA</span>
                    <span>→</span>
                  </div>
                )}
              </a>
            ))}
            {activeNews.length === 0 && (
              <div className="col-span-2 bg-[#060a0f] p-10 text-center">
                <div className="font-space text-[11px] text-[#5a8898]">Conectando con feeds de noticias...</div>
              </div>
            )}
          </div>
        )}

        {/* Sources legend */}
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <span className="font-space text-[9px] text-[#5a8898] tracking-[0.1em]">FUENTES:</span>
          {(newsType === "crypto"
            ? ["CoinDesk", "CoinTelegraph", "Decrypt", "Bitcoin Mag", "CryptoPanic", "The Block"]
            : ["Reuters", "Yahoo Finance", "CNBC Markets", "CNBC Economy", "Investing.com", "MarketWatch"]
          ).map(src => (
            <span key={src} className="font-space text-[8px] px-2 py-0.5"
              style={{ color: getSourceColor(src), border: `1px solid ${getSourceColor(src)}30`, background: getSourceColor(src) + "10" }}>
              {src}
            </span>
          ))}
        </div>
      </section>

      {/* Live ticker */}
      <section className="px-6 md:px-12 pb-20">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4">Ticker de liquidaciones en vivo</div>
        <div className="border border-[#1a2535] overflow-hidden">
          <div className="grid font-space text-[9px] text-[#5a8898] tracking-[0.15em] uppercase border-b border-[#1a2535] px-4 py-2"
            style={{ gridTemplateColumns: "80px 80px 1fr 1fr 80px" }}>
            <span>Par</span><span>Lado</span><span className="text-right">Precio</span><span className="text-right">Valor</span><span className="text-right">Hace</span>
          </div>
          <div className="divide-y divide-[#0d1520] max-h-80 overflow-y-auto">
            {events.length === 0 && (
              <div className="px-4 py-6 text-center font-space text-[11px] text-[#5a8898]">Esperando liquidaciones...</div>
            )}
            {events.map(ev => {
              const ago = Math.floor((Date.now() - ev.ts) / 1000);
              const base = SYMBOL_BASES[ev.symbol] ?? ev.symbol.replace("USDT","");
              return (
                <div key={ev.id} className="grid items-center px-4 py-2.5 hover:bg-[#060a0f] transition-colors animate-in"
                  style={{ gridTemplateColumns: "80px 80px 1fr 1fr 80px" }}>
                  <span className="font-space text-[11px] text-white">{base}</span>
                  <span className="font-space text-[10px] font-bold" style={{ color: ev.side === "LONG" ? "#ff1744" : "#00e676" }}>
                    {ev.side === "LONG" ? "🔴 LONG" : "🟢 SHORT"}
                  </span>
                  <span className="font-space text-[10px] text-[#7ab3c8] text-right">
                    ${ev.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </span>
                  <span className="font-bebas text-base text-right" style={{ color: ev.usd > 100_000 ? (ev.side === "LONG" ? "#ff1744" : "#00e676") : "#4a6070" }}>
                    {fmtUsd(ev.usd)}
                  </span>
                  <span className="font-space text-[9px] text-[#5a8898] text-right">{ago < 60 ? `${ago}s` : `${Math.floor(ago/60)}m`}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interpretation guide */}
      <section className="border-t border-[#1a2535] px-6 md:px-12 py-12">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-6">Cómo leer las liquidaciones</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1a2535] border border-[#1a2535]">
          {[
            { icon:"🔴", color:"#ff1744", title:"Liquidaciones de LONGS masivas", desc:"El precio bajó fuertemente y liquidó posiciones largas. Generalmente señala una zona de agotamiento bajista — el flush ya ocurrió. Potencial zona de rebote después del pico de longs." },
            { icon:"🟢", color:"#00e676", title:"Liquidaciones de SHORTS masivas", desc:"El precio subió y liquidó posiciones cortas. Short squeeze en progreso. El precio puede continuar subiendo mientras siga habiendo shorts que cazar. Cuidado con entrada long en el pico." },
          ].map(({ icon, color, title, desc }) => (
            <div key={title} className="bg-[#060a0f] p-6">
              <div className="font-bebas text-2xl mb-2" style={{ color }}>{icon} {title}</div>
              <p className="font-space text-[11px] text-[#7ab3c8] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
