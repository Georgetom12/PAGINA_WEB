import React, { useState } from "react";
import SiteNav from "@/components/site-nav";

interface Endpoint {
  method: "GET" | "POST";
  path: string;
  desc: string;
  params?: { name: string; type: string; required: boolean; desc: string }[];
  response: string;
  example?: string;
  auth: boolean;
}

const ENDPOINTS: { section: string; color: string; items: Endpoint[] }[] = [
  {
    section: "MERCADO",
    color: "#00e5ff",
    items: [
      {
        method: "GET", path: "/api/proxy/kraken/ohlc", auth: false,
        desc: "Datos OHLC históricos de BTC desde 2013 (Kraken). Semanales, diarios o mensuales.",
        params: [
          { name: "pair",     type: "string",  required: false, desc: "Par de trading. Default: XBTUSD" },
          { name: "interval", type: "number",  required: false, desc: "Intervalo en minutos. 1440=1D, 10080=1W, 43200=1M" },
        ],
        response: `{ "error": [], "result": { "XXBTZUSD": [[timestamp, open, high, low, close, vwap, volume, count], ...] } }`,
        example: "/api/proxy/kraken/ohlc?pair=XBTUSD&interval=10080",
      },
      {
        method: "GET", path: "/api/proxy/kraken/price", auth: false,
        desc: "Precio BTC en tiempo real via Kraken ticker.",
        params: [{ name: "pair", type: "string", required: false, desc: "Par. Default: XBTUSD" }],
        response: `{ "result": { "XXBTZUSD": { "c": ["78500.00", "1"], "v": ["..."], "h": ["..."], "l": ["..."] } } }`,
        example: "/api/proxy/kraken/price?pair=XBTUSD",
      },
      {
        method: "GET", path: "/api/proxy/coinbase/price", auth: false,
        desc: "Precio spot BTC/USD de Coinbase (para calcular Coinbase Premium).",
        params: [{ name: "pair", type: "string", required: false, desc: "Par. Default: BTC-USD" }],
        response: `{ "data": { "amount": "78500.12", "base": "BTC", "currency": "USD" } }`,
        example: "/api/proxy/coinbase/price?pair=BTC-USD",
      },
      {
        method: "GET", path: "/api/proxy/okx/candles", auth: false,
        desc: "Velas OHLCV de futuros perpetuos BTC-USDT-SWAP via OKX.",
        params: [
          { name: "instId", type: "string", required: false, desc: "Instrumento. Default: BTC-USDT-SWAP" },
          { name: "bar",    type: "string", required: false, desc: "Timeframe. 1D, 4H, 1H, etc." },
          { name: "limit",  type: "number", required: false, desc: "Máximo de velas. Default: 300" },
        ],
        response: `{ "data": [["timestamp_ms","open","high","low","close","vol","volCcy","volCcyQuote","confirm"], ...] }`,
        example: "/api/proxy/okx/candles?instId=BTC-USDT-SWAP&bar=1D&limit=90",
      },
      {
        method: "GET", path: "/api/proxy/okx/oi", auth: false,
        desc: "Open Interest actual de futuros perpetuos BTC en OKX.",
        params: [{ name: "instId", type: "string", required: false, desc: "Instrumento. Default: BTC-USDT-SWAP" }],
        response: `{ "data": [{ "instId": "BTC-USDT-SWAP", "oi": "31926.33", "oiCcy": "31926.33", "oiUsd": "2497022661.62", "ts": "1777771864459" }] }`,
        example: "/api/proxy/okx/oi?instId=BTC-USDT-SWAP",
      },
    ],
  },
  {
    section: "SEÑALES",
    color: "#00e676",
    items: [
      {
        method: "GET", path: "/api/signals", auth: true,
        desc: "Lista de señales de trading activas y archivadas.",
        params: [],
        response: `[{ "id": "uuid", "asset": "BTC/USDT", "direction": "LONG", "entry": 78500, "tp": 85000, "sl": 75000, "status": "ACTIVE", "channel_id": "uuid", "created_at": "..." }]`,
      },
      {
        method: "GET", path: "/api/channels", auth: true,
        desc: "Canales de señales disponibles (públicos y premium).",
        params: [],
        response: `[{ "id": "uuid", "name": "PSY MAIN", "description": "...", "active": true, "tier": "PRO" }]`,
      },
    ],
  },
  {
    section: "CHAT IA",
    color: "#e040fb",
    items: [
      {
        method: "POST", path: "/api/chat/message", auth: false,
        desc: "Envía un mensaje al Asesor Trading IA (powered by Gemini). Incluye historial de conversación.",
        params: [
          { name: "message",  type: "string", required: true,  desc: "Mensaje del usuario" },
          { name: "history",  type: "array",  required: false, desc: "Historial previo [{role, content}]" },
        ],
        response: `{ "reply": "Análisis institucional...", "suggestions": ["¿Qué es el OI?", "Explícame funding"] }`,
        example: `POST /api/chat/message\n{ "message": "¿Está Bitcoin en zona de acumulación?", "history": [] }`,
      },
      {
        method: "GET", path: "/api/chat/suggestions", auth: false,
        desc: "Obtiene sugerencias de preguntas frecuentes para el chat IA.",
        params: [],
        response: `{ "suggestions": ["¿Qué es el funding rate?", "Explícame el PSY Score", ...] }`,
      },
    ],
  },
];

const RATE_LIMITS = [
  { tier: "FREE", rpm: 30, rpd: 500, color: "#4a6070" },
  { tier: "PRO",  rpm: 120, rpd: 5000, color: "#00e676" },
  { tier: "API KEY", rpm: 600, rpd: 50000, color: "#e040fb" },
];

export default function ApiDocs() {
  const [activeSection, setActiveSection] = useState(0);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  async function testEndpoint(endpoint: Endpoint) {
    if (!endpoint.example || endpoint.auth) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/${endpoint.example.replace(/^\//, "")}`);
      const json = await res.json();
      setTestResult(JSON.stringify(json, null, 2).slice(0, 800) + "\n...");
    } catch (e) {
      setTestResult(`Error: ${String(e)}`);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020b12] text-white">
      <SiteNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">

        {/* Header */}
        <div className="mb-10">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-3">PSYCHOMETRIKS · DEVELOPERS</div>
          <h1 className="font-bebas text-5xl md:text-6xl leading-none text-white mb-2">
            API <span className="text-[#e040fb]">DOCS</span>
          </h1>
          <p className="font-space text-[11px] text-[#7ab3c8]">
            API pública REST · JSON · Sin autenticación para endpoints de mercado · Base URL: <span className="text-[#e040fb]">https://psychometriks.com</span>
          </p>
        </div>

        {/* Quick info */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { label: "FORMATO", value: "JSON", color: "#e040fb" },
            { label: "AUTENTICACIÓN", value: "API Key (opcional)", color: "#ffd700" },
            { label: "RATE LIMIT", value: "30 req/min FREE", color: "#00e676" },
          ].map(s => (
            <div key={s.label} className="border border-[#0d2030] bg-[#040f18] p-4 text-center">
              <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#7ab3c8] mb-1">{s.label}</div>
              <div className="font-bebas text-lg tracking-wider" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Rate limits */}
        <div className="mb-10 border border-[#0d2030] bg-[#040f18] p-5">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-4">RATE LIMITS</div>
          <div className="grid grid-cols-3 gap-3">
            {RATE_LIMITS.map(rl => (
              <div key={rl.tier} className="border border-[#0d2030] p-3 text-center">
                <div className="font-sharetech text-[9px] tracking-[0.15em] mb-2" style={{ color: rl.color }}>{rl.tier}</div>
                <div className="font-bebas text-2xl text-white">{rl.rpm} <span className="text-sm text-[#7ab3c8]">/ min</span></div>
                <div className="font-space text-[9px] text-[#7ab3c8]">{rl.rpd.toLocaleString()} / día</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-2 mb-6">
          {ENDPOINTS.map((s, i) => (
            <button key={s.section} onClick={() => setActiveSection(i)}
              className={`font-sharetech text-[9px] tracking-[0.2em] px-4 py-2 border transition-colors ${i === activeSection ? "border-current" : "border-[#0d2030] text-[#7ab3c8] hover:border-[#7ab3c8]"}`}
              style={i === activeSection ? { color: s.color, borderColor: s.color, backgroundColor: `${s.color}10` } : {}}>
              {s.section}
            </button>
          ))}
        </div>

        {/* Endpoints */}
        <div className="space-y-3 mb-10">
          {ENDPOINTS[activeSection].items.map(ep => {
            const key = ep.path;
            const expanded = expandedEndpoint === key;
            return (
              <div key={key} className="border border-[#0d2030] bg-[#040f18] overflow-hidden">
                <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#060d16] transition-colors"
                  onClick={() => setExpandedEndpoint(expanded ? null : key)}>
                  <span className={`font-sharetech text-[9px] tracking-[0.1em] px-2 py-0.5 border shrink-0 ${ep.method === "GET" ? "text-[#00e676] border-[#00e67640] bg-[#001a0a]" : "text-[#e040fb] border-[#e040fb40] bg-[#0d001a]"}`}>
                    {ep.method}
                  </span>
                  <code className="font-sharetech text-[10px] text-white flex-1">{ep.path}</code>
                  {ep.auth && <span className="font-sharetech text-[8px] tracking-[0.1em] text-[#ffd700] border border-[#ffd70040] bg-[#1a1400] px-1.5 py-0.5 shrink-0">AUTH</span>}
                  <span className="font-space text-[10px] text-[#7ab3c8] shrink-0 hidden md:block">{ep.desc.slice(0, 50)}...</span>
                  <span className="font-sharetech text-[9px] text-[#7ab3c8] shrink-0">{expanded ? "−" : "+"}</span>
                </button>

                {expanded && (
                  <div className="border-t border-[#060d16] p-4 space-y-4">
                    <p className="font-space text-[10px] text-[#8a9090]">{ep.desc}</p>

                    {ep.params && ep.params.length > 0 && (
                      <div>
                        <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#7ab3c8] mb-2">PARÁMETROS</div>
                        <table className="w-full font-space text-[9px]">
                          <thead>
                            <tr className="border-b border-[#0d2030]">
                              {["Nombre","Tipo","Req","Descripción"].map(h => (
                                <th key={h} className="text-left pb-2 pr-4 text-[#7ab3c8] font-normal">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {ep.params.map(p => (
                              <tr key={p.name} className="border-b border-[#060d16]">
                                <td className="py-2 pr-4"><code className="text-[#00e5ff]">{p.name}</code></td>
                                <td className="py-2 pr-4 text-[#e040fb]">{p.type}</td>
                                <td className="py-2 pr-4">{p.required ? <span className="text-[#ff6d00]">Sí</span> : <span className="text-[#7ab3c8]">No</span>}</td>
                                <td className="py-2 text-[#6a8090]">{p.desc}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div>
                      <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#7ab3c8] mb-2">RESPUESTA</div>
                      <pre className="bg-[#020b12] border border-[#0d2030] p-3 text-[9px] text-[#6a8090] overflow-x-auto whitespace-pre-wrap">{ep.response}</pre>
                    </div>

                    {ep.example && (
                      <div>
                        <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#7ab3c8] mb-2">EJEMPLO</div>
                        <pre className="bg-[#020b12] border border-[#0d2030] p-3 text-[9px] text-[#e040fb] overflow-x-auto">{ep.example}</pre>
                      </div>
                    )}

                    {ep.example && !ep.auth && (
                      <div className="flex gap-3 items-start">
                        <button
                          onClick={() => testEndpoint(ep)}
                          disabled={testing}
                          className="font-sharetech text-[9px] tracking-[0.15em] px-4 py-2 border border-[#e040fb40] text-[#e040fb] hover:bg-[#0d001a] transition-colors disabled:opacity-50">
                          {testing ? "⏳ EJECUTANDO..." : "▶ PROBAR EN VIVO"}
                        </button>
                        {testResult && (
                          <pre className="flex-1 bg-[#020b12] border border-[#0d2030] p-3 text-[8px] text-[#00e676] overflow-x-auto max-h-48 whitespace-pre-wrap">
                            {testResult}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Authentication */}
        <div className="border border-[#ffd70022] bg-[#0a0900] p-5 mb-6">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#ffd700] mb-3">AUTENTICACIÓN (API KEY)</div>
          <div className="font-space text-[10px] text-[#8a9090] leading-relaxed mb-3">
            Los endpoints de mercado son públicos. Para endpoints protegidos, incluye tu API key en el header:
          </div>
          <pre className="bg-[#020b12] border border-[#0d2030] p-3 text-[9px] text-[#ffd700] overflow-x-auto">
{`curl -H "X-PSY-API-Key: YOUR_KEY" https://psychometriks.com/api/signals`}
          </pre>
        </div>

        {/* Contact */}
        <div className="text-center font-space text-[10px] text-[#7ab3c8]">
          ¿Necesitas acceso API avanzado o integración empresarial?{" "}
          <a href="mailto:api@psychometriks.com" className="text-[#e040fb] hover:underline">api@psychometriks.com</a>
        </div>

      </div>
    </div>
  );
}
