import { useEffect, useRef, useState } from "react";
import SiteNav from "@/components/site-nav";
import { Link } from "wouter";

const TELEGRAM = "https://t.me/psychometriks_pro";
type PsyPlan = "basico" | "educacion" | "pro" | "elite" | null;
interface AuthSession { user: string; role: string; plan?: PsyPlan; token: string; ts: number; }
function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem("psyko_auth");
    if (!raw) return null;
    const s = JSON.parse(raw) as AuthSession;
    if (Date.now() - s.ts > 8 * 60 * 60 * 1000) { localStorage.removeItem("psyko_auth"); return null; }
    return s;
  } catch { return null; }
}
function isElite(s: AuthSession | null) {
  if (!s) return false;
  return s.role === "superadmin" || s.role === "operator" || s.plan === "elite";
}

function TradingViewWidget({ config, id }: { config: Record<string, unknown>; id: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify(config);
    ref.current.appendChild(script);
    return () => { if (ref.current) ref.current.innerHTML = ""; };
  }, [id]);

  return <div ref={ref} className="tradingview-widget-container" style={{ height: "100%", width: "100%" }} />;
}

function TickerTape() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const container = document.createElement("div");
    container.className = "tradingview-widget-container__widget";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
        { proName: "FOREXCOM:NSXUSD", title: "NASDAQ 100" },
        { description: "Dow Jones", proName: "FOREXCOM:DJI" },
        { description: "Russell 2000", proName: "TVC:RUT" },
        { description: "Gold", proName: "TVC:GOLD" },
        { description: "DXY", proName: "TVC:DXY" },
        { description: "VIX", proName: "CBOE:VIX" },
        { description: "Apple", proName: "NASDAQ:AAPL" },
        { description: "NVIDIA", proName: "NASDAQ:NVDA" },
        { description: "Tesla", proName: "NASDAQ:TSLA" },
        { description: "Microsoft", proName: "NASDAQ:MSFT" },
        { description: "Meta", proName: "NASDAQ:META" },
        { description: "Amazon", proName: "NASDAQ:AMZN" },
        { description: "Google", proName: "NASDAQ:GOOGL" },
        { description: "Bitcoin ETF", proName: "NASDAQ:IBIT" },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: "es",
    });
    ref.current.appendChild(container);
    ref.current.appendChild(script);
    return () => { if (ref.current) ref.current.innerHTML = ""; };
  }, []);
  return <div ref={ref} className="tradingview-widget-container" />;
}

function MarketOverview() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      dateRange: "1D",
      showChart: true,
      locale: "es",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: false,
      width: "100%",
      height: "100%",
      tabs: [
        {
          title: "Índices",
          symbols: [
            { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
            { s: "FOREXCOM:NSXUSD", d: "Nasdaq 100" },
            { s: "FOREXCOM:DJI", d: "Dow Jones" },
            { s: "TVC:RUT", d: "Russell 2000" },
            { s: "INDEX:CAC40", d: "CAC 40" },
            { s: "INDEX:DAX", d: "DAX" },
          ],
          originalTitle: "Indices",
        },
        {
          title: "Acciones Tech",
          symbols: [
            { s: "NASDAQ:AAPL", d: "Apple" },
            { s: "NASDAQ:NVDA", d: "NVIDIA" },
            { s: "NASDAQ:MSFT", d: "Microsoft" },
            { s: "NASDAQ:META", d: "Meta" },
            { s: "NASDAQ:GOOGL", d: "Google" },
            { s: "NASDAQ:AMZN", d: "Amazon" },
            { s: "NASDAQ:TSLA", d: "Tesla" },
            { s: "NYSE:COIN", d: "Coinbase" },
          ],
          originalTitle: "Tech",
        },
        {
          title: "Commodities",
          symbols: [
            { s: "TVC:GOLD", d: "Oro" },
            { s: "TVC:SILVER", d: "Plata" },
            { s: "NYMEX:CL1!", d: "Petróleo WTI" },
            { s: "TVC:USOIL", d: "Oil" },
          ],
          originalTitle: "Commodities",
        },
        {
          title: "Forex",
          symbols: [
            { s: "TVC:DXY", d: "DXY" },
            { s: "FX:EURUSD", d: "EUR/USD" },
            { s: "FX:USDJPY", d: "USD/JPY" },
            { s: "FX:GBPUSD", d: "GBP/USD" },
          ],
          originalTitle: "Forex",
        },
      ],
    });
    ref.current.appendChild(script);
    return () => { if (ref.current) ref.current.innerHTML = ""; };
  }, []);
  return <div ref={ref} className="tradingview-widget-container" style={{ height: "100%", width: "100%" }} />;
}

function HeatmapWidget() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      exchanges: [],
      dataSource: "SPX500",
      grouping: "sector",
      blockSize: "market_cap_basic",
      blockColor: "change",
      locale: "es",
      symbolUrl: "",
      colorTheme: "dark",
      hasTopBar: false,
      isDataSetEnabled: true,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: "100%",
      height: "100%",
    });
    ref.current.appendChild(script);
    return () => { if (ref.current) ref.current.innerHTML = ""; };
  }, []);
  return <div ref={ref} className="tradingview-widget-container" style={{ height: "100%", width: "100%" }} />;
}

function ScreenerWidget() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-screener.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: "100%",
      defaultColumn: "overview",
      defaultScreen: "most_capitalized",
      market: "america",
      showToolbar: true,
      colorTheme: "dark",
      locale: "es",
      isTransparent: true,
    });
    ref.current.appendChild(script);
    return () => { if (ref.current) ref.current.innerHTML = ""; };
  }, []);
  return <div ref={ref} className="tradingview-widget-container" style={{ height: "100%", width: "100%" }} />;
}

const STOCKS = [
  { sym: "NASDAQ:AAPL", name: "Apple", icon: "🍎" },
  { sym: "NASDAQ:NVDA", name: "NVIDIA", icon: "🟢" },
  { sym: "NASDAQ:MSFT", name: "Microsoft", icon: "🔷" },
  { sym: "NASDAQ:TSLA", name: "Tesla", icon: "⚡" },
  { sym: "NASDAQ:META", name: "Meta", icon: "🌐" },
  { sym: "NASDAQ:AMZN", name: "Amazon", icon: "📦" },
  { sym: "NASDAQ:GOOGL", name: "Google", icon: "🔍" },
  { sym: "NYSE:COIN", name: "Coinbase", icon: "🪙" },
];

function MiniChart({ sym, name, icon }: { sym: string; name: string; icon: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: sym,
      width: "100%",
      height: 200,
      locale: "es",
      dateRange: "1D",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
      chartOnly: false,
      noTimeScale: false,
    });
    ref.current.appendChild(script);
    return () => { if (ref.current) ref.current.innerHTML = ""; };
  }, [sym]);

  return (
    <div className="rounded-lg border border-[#0ff2]/10 bg-[#020b12]/60 overflow-hidden hover:border-[#0ff2]/30 transition-colors">
      <div className="px-3 pt-2 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-[#0ff2] font-mono text-xs font-semibold">{name}</span>
      </div>
      <div ref={ref} className="tradingview-widget-container" style={{ height: 160 }} />
    </div>
  );
}

export default function BolsaValores() {
  const [session] = useState(getSession);

  if (!session || !isElite(session)) {
    return (
      <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
        <SiteNav />
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="mb-6 text-5xl">📈</div>
          <div className="font-space text-[9px] text-[#ffd700] tracking-[0.3em] uppercase mb-3">ACCESO RESTRINGIDO</div>
          <h1 className="font-bebas text-5xl text-white mb-4">ACCIONES &<br /><span className="text-[#40c4ff]">RENTA FIJA</span></h1>
          <p className="font-space text-sm text-[#7ab3c8] max-w-md mb-8 leading-relaxed">
            El LiqMap de acciones, bonds y ETFs globales es exclusivo del plan Elite.
            Análisis institucional de mercados tradicionales en tiempo real.
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link href="/pricing"
              className="font-space text-xs font-bold tracking-[0.15em] uppercase px-8 py-4 no-underline transition-all hover:-translate-y-0.5"
              style={{ background: "#ffd700", color: "#020408" }}>
              UPGRADE A ELITE — $99/mes
            </Link>
            <a href={TELEGRAM} target="_blank" rel="noopener noreferrer"
              className="font-space text-xs tracking-[0.15em] uppercase px-8 py-4 border border-[#1a2535] text-[#7ab3c8] hover:border-[#00e5ff] hover:text-[#00e5ff] transition-all">
              Contactar por Telegram
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020b12] text-white">
      <SiteNav />

      {/* Ticker tape */}
      <div className="border-b border-[#0ff2]/10 bg-[#020b12]">
        <TickerTape />
      </div>

      <div className="px-4 py-6 max-w-screen-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-[#0ff2] rounded-full" />
          <div>
            <h1 className="text-2xl font-bold font-mono text-white tracking-widest">BOLSA DE VALORES</h1>
            <p className="text-xs text-[#0ff2]/60 font-mono tracking-widest mt-0.5">MERCADOS GLOBALES — ACCIONES · ÍNDICES · COMMODITIES</p>
          </div>
        </div>

        {/* Main chart + Market overview */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Main TradingView chart S&P500 */}
          <div className="xl:col-span-2 rounded-lg border border-[#0ff2]/10 bg-[#020b12]/60 overflow-hidden" style={{ height: 500 }}>
            <div className="px-4 py-2 border-b border-[#0ff2]/10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-mono text-[#0ff2]/80 tracking-widest">S&P 500 · LIVE</span>
            </div>
            <div style={{ height: 460 }}>
              <TradingViewWidget
                id="spx-chart"
                config={{
                  autosize: true,
                  symbol: "FOREXCOM:SPXUSD",
                  interval: "D",
                  timezone: "America/New_York",
                  theme: "dark",
                  style: "1",
                  locale: "es",
                  backgroundColor: "rgba(2,11,18,0)",
                  gridColor: "rgba(0,229,255,0.05)",
                  hide_top_toolbar: false,
                  allow_symbol_change: true,
                  save_image: false,
                  studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies"],
                }}
              />
            </div>
          </div>

          {/* Market overview */}
          <div className="rounded-lg border border-[#0ff2]/10 bg-[#020b12]/60 overflow-hidden" style={{ height: 500 }}>
            <div className="px-4 py-2 border-b border-[#0ff2]/10">
              <span className="text-xs font-mono text-[#0ff2]/80 tracking-widest">PANORAMA DE MERCADOS</span>
            </div>
            <div style={{ height: 460 }}>
              <MarketOverview />
            </div>
          </div>
        </div>

        {/* S&P 500 Heatmap */}
        <div className="rounded-lg border border-[#0ff2]/10 bg-[#020b12]/60 overflow-hidden">
          <div className="px-4 py-2 border-b border-[#0ff2]/10">
            <span className="text-xs font-mono text-[#0ff2]/80 tracking-widest">MAPA DE CALOR — S&P 500 POR SECTOR</span>
          </div>
          <div style={{ height: 500 }}>
            <HeatmapWidget />
          </div>
        </div>

        {/* Individual stocks mini charts */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono text-[#0ff2]/60 tracking-widest">ACCIONES PRINCIPALES</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STOCKS.map(s => (
              <MiniChart key={s.sym} sym={s.sym} name={s.name} icon={s.icon} />
            ))}
          </div>
        </div>

        {/* Stock screener */}
        <div className="rounded-lg border border-[#0ff2]/10 bg-[#020b12]/60 overflow-hidden">
          <div className="px-4 py-2 border-b border-[#0ff2]/10">
            <span className="text-xs font-mono text-[#0ff2]/80 tracking-widest">SCREENER DE ACCIONES — USA</span>
          </div>
          <div style={{ height: 600 }}>
            <ScreenerWidget />
          </div>
        </div>

        <p className="text-center text-[10px] text-[#0ff2]/20 font-mono pb-4">
          DATOS EN TIEMPO REAL VÍA TRADINGVIEW · SOLO PARA ANÁLISIS INFORMATIVO
        </p>
      </div>
    </div>
  );
}
