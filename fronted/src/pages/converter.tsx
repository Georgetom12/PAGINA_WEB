import React, { useState, useEffect, useRef } from "react";
import SiteNav from "@/components/site-nav";

interface Price { symbol: string; price: number; change: number; high: number; low: number; }

const ASSETS = [
  { symbol: "BTCUSDT", label: "Bitcoin",  ticker: "BTC", icon: "₿",  color: "#f7931a", decimals: 2 },
  { symbol: "ETHUSDT", label: "Ethereum", ticker: "ETH", icon: "Ξ",  color: "#627eea", decimals: 2 },
  { symbol: "SOLUSDT", label: "Solana",   ticker: "SOL", icon: "◎",  color: "#9945ff", decimals: 2 },
  { symbol: "BNBUSDT", label: "BNB",      ticker: "BNB", icon: "⬡",  color: "#f3ba2f", decimals: 2 },
  { symbol: "XRPUSDT", label: "XRP",      ticker: "XRP", icon: "✦",  color: "#00aae4", decimals: 4 },
  { symbol: "DOGEUSDT",label: "Dogecoin", ticker: "DOGE",icon: "Ð",  color: "#c2a633", decimals: 5 },
  { symbol: "ADAUSDT", label: "Cardano",  ticker: "ADA", icon: "₳",  color: "#0033ad", decimals: 4 },
  { symbol: "AVAXUSDT",label: "Avalanche",ticker: "AVAX",icon: "▲",  color: "#e84142", decimals: 2 },
];

const FIATS = [
  { ticker: "USDT", label: "Tether USDT", flag: "💲", rate: 1 },
  { ticker: "USD",  label: "Dólar US",    flag: "🇺🇸", rate: 1 },
  { ticker: "EUR",  label: "Euro",        flag: "🇪🇺", rate: 0.92 },
  { ticker: "ARS",  label: "Peso ARG",    flag: "🇦🇷", rate: 1250 },
  { ticker: "COP",  label: "Peso COP",    flag: "🇨🇴", rate: 4150 },
  { ticker: "MXN",  label: "Peso MXN",    flag: "🇲🇽", rate: 17.2 },
  { ticker: "PEN",  label: "Sol PEN",     flag: "🇵🇪", rate: 3.75 },
  { ticker: "CLP",  label: "Peso CLP",    flag: "🇨🇱", rate: 970 },
];

export default function Converter() {
  const [prices, setPrices]       = useState<Map<string, Price>>(new Map());
  const [amount, setAmount]       = useState("1");
  const [fromAsset, setFromAsset] = useState("BTCUSDT");
  const [toFiat, setToFiat]       = useState("USDT");
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const streams = ASSETS.map(a => `${a.symbol.toLowerCase()}@ticker`).join("/");
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    wsRef.current = ws;
    ws.onopen  = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as { data: { s: string; c: string; P: string; h: string; l: string } };
        const d = msg.data;
        setPrices(prev => {
          const next = new Map(prev);
          next.set(d.s, { symbol: d.s, price: parseFloat(d.c), change: parseFloat(d.P), high: parseFloat(d.h), low: parseFloat(d.l) });
          return next;
        });
        setLastUpdate(new Date());
      } catch {}
    };
    return () => ws.close();
  }, []);

  const asset     = ASSETS.find(a => a.symbol === fromAsset)!;
  const fiat      = FIATS.find(f => f.ticker === toFiat)!;
  const priceData = prices.get(fromAsset);
  const usdPrice  = priceData?.price ?? 0;
  const converted = parseFloat(amount || "0") * usdPrice * fiat.rate;
  const fmtNum    = (n: number, dec = 2) => n.toLocaleString("es-EC", { minimumFractionDigits: dec, maximumFractionDigits: dec });

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      <div className="pt-28 pb-16 px-4 md:px-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-3">Herramientas</div>
          <h1 className="font-bebas text-5xl md:text-7xl leading-none mb-3">
            CONVERSOR<br /><span className="text-[#00e5ff]">CRYPTO</span>
          </h1>
          <div className="flex items-center gap-3">
            <p className="font-space text-[12px] text-[#7ab3c8]">Precios en tiempo real via Binance</p>
            <span className="font-space text-[9px] px-2 py-0.5 border"
              style={{ color: connected ? "#00e676" : "#ff1744", borderColor: connected ? "#00e67633" : "#ff174433" }}>
              {connected ? "🟢 LIVE" : "🔴 OFFLINE"}
            </span>
          </div>
          {lastUpdate && <div className="font-space text-[9px] text-[#5a8898] mt-1">Actualizado: {lastUpdate.toLocaleTimeString("es-EC")}</div>}
        </div>

        {/* Main converter */}
        <div className="border border-[#1a2535] bg-[#060a0f] p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Amount */}
            <div>
              <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">Cantidad</label>
              <input
                type="number" value={amount} onChange={e => setAmount(e.target.value)} min="0"
                className="w-full bg-[#080d14] border border-[#1a2535] text-white font-mono text-[20px] px-4 py-3 focus:outline-none focus:border-[#00e5ff44] transition-colors"
              />
            </div>

            {/* From asset */}
            <div>
              <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">Criptomoneda</label>
              <select
                value={fromAsset} onChange={e => setFromAsset(e.target.value)}
                className="w-full bg-[#080d14] border border-[#1a2535] text-white font-space text-[13px] px-4 py-3.5 focus:outline-none appearance-none cursor-pointer">
                {ASSETS.map(a => (
                  <option key={a.symbol} value={a.symbol}>{a.icon} {a.label} ({a.ticker})</option>
                ))}
              </select>
            </div>

            {/* To fiat */}
            <div>
              <label className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase block mb-1.5">Moneda destino</label>
              <select
                value={toFiat} onChange={e => setToFiat(e.target.value)}
                className="w-full bg-[#080d14] border border-[#1a2535] text-white font-space text-[13px] px-4 py-3.5 focus:outline-none appearance-none cursor-pointer">
                {FIATS.map(f => (
                  <option key={f.ticker} value={f.ticker}>{f.flag} {f.ticker} — {f.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Result */}
          <div className="mt-6 p-5 border text-center"
            style={{ borderColor: asset.color + "44", background: asset.color + "08" }}>
            <div className="font-space text-[11px] text-[#7ab3c8] mb-2">
              {amount || "0"} {asset.ticker} =
            </div>
            <div className="font-mono font-black leading-none"
              style={{ fontSize: "clamp(2rem, 8vw, 4rem)", color: asset.color }}>
              {usdPrice > 0 ? fmtNum(converted, toFiat === "USDT" || toFiat === "USD" ? 2 : 0) : "—"}
            </div>
            <div className="font-space text-[14px] text-[#8a9ab0] mt-1">{fiat.flag} {toFiat}</div>
            {priceData && (
              <div className="mt-3 font-space text-[11px]" style={{ color: priceData.change >= 0 ? "#00e676" : "#ff1744" }}>
                {priceData.change >= 0 ? "▲" : "▼"} {Math.abs(priceData.change).toFixed(2)}% en 24h
              </div>
            )}
          </div>

          {/* Current price */}
          {priceData && (
            <div className="mt-4 grid grid-cols-3 gap-px bg-[#1a2535]">
              {[
                { label: "PRECIO", value: `$${fmtNum(priceData.price, asset.decimals)}` },
                { label: "MÁXIMO 24H", value: `$${fmtNum(priceData.high, asset.decimals)}` },
                { label: "MÍNIMO 24H", value: `$${fmtNum(priceData.low, asset.decimals)}` },
              ].map((item, i) => (
                <div key={i} className="bg-[#060a0f] p-3 text-center">
                  <div className="font-space text-[9px] text-[#5a8898] tracking-[0.1em] mb-1">{item.label}</div>
                  <div className="font-mono text-[13px] text-white">{item.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price table */}
        <div className="border border-[#1a2535] bg-[#060a0f] overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-[#1a2535]">
            <span className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase">PRECIOS EN VIVO — TODOS LOS ACTIVOS</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a2535]">
                  {["ACTIVO", "PRECIO", "24H", "MÁXIMO", "MÍNIMO", "ACCIÓN"].map((h, i) => (
                    <th key={i} className="font-space text-[9px] text-[#5a8898] tracking-[0.15em] px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ASSETS.map(a => {
                  const p = prices.get(a.symbol);
                  const isUp = (p?.change ?? 0) >= 0;
                  return (
                    <tr key={a.symbol}
                      className="border-b border-[#1a2535] hover:bg-[#0d1520] transition-colors cursor-pointer"
                      onClick={() => setFromAsset(a.symbol)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span style={{ color: a.color, fontSize: 18 }}>{a.icon}</span>
                          <div>
                            <div className="font-space text-[12px] text-white">{a.ticker}</div>
                            <div className="font-space text-[10px] text-[#5a8898]">{a.label}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-white">
                        {p ? `$${fmtNum(p.price, a.decimals)}` : <span className="text-[#5a8898]">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px]" style={{ color: isUp ? "#00e676" : "#ff1744" }}>
                        {p ? `${isUp ? "+" : ""}${p.change.toFixed(2)}%` : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-[#7ab3c8]">
                        {p ? `$${fmtNum(p.high, a.decimals)}` : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-[#7ab3c8]">
                        {p ? `$${fmtNum(p.low, a.decimals)}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={e => { e.stopPropagation(); setFromAsset(a.symbol); }}
                          className="font-space text-[9px] px-2.5 py-1 border transition-all"
                          style={{ borderColor: fromAsset === a.symbol ? a.color : "#1a2535", color: fromAsset === a.symbol ? a.color : "#4a6070" }}>
                          {fromAsset === a.symbol ? "✓ SEL" : "USAR"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick conversions */}
        {priceData && (
          <div className="border border-[#1a2535] bg-[#060a0f] p-5">
            <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase mb-4">
              CONVERSIONES RÁPIDAS — {asset.ticker}/USDT
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10].map(qty => (
                <div key={qty}
                  className="bg-[#080d14] border border-[#1a2535] p-3 hover:border-[#1a2535aa] cursor-pointer transition-colors"
                  onClick={() => setAmount(String(qty))}>
                  <div className="font-space text-[10px] text-[#5a8898] mb-1">{qty} {asset.ticker}</div>
                  <div className="font-mono text-[13px]" style={{ color: asset.color }}>
                    ${fmtNum(qty * priceData.price)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
