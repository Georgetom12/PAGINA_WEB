// artifacts/psychometriks/src/pages/pro-dashboard.tsx
//
// PSY PRO DASHBOARD — Watchlist + Alertas + Portafolio real + Track Record,
// con velas japonesas reales (plano cartesiano) reusando los mismos datos
// de Binance que ya usa IA Trading.
//
// Requiere plan Pro+. Consume /api/pro-dashboard/*

import { useEffect, useState, useCallback } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { getAuth } from "@/lib/auth";

function authHeaders(): Record<string, string> {
  const token = getAuth()?.token;
  return token ? { "X-PSY-Token": token, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

// ---------- Vela japonesa custom (recharts no trae candlestick nativo) ----------
function CandlestickShape(props: any) {
  const { x, width, payload, yAxis } = props;
  if (!yAxis || typeof yAxis.scale !== "function") return null;
  const scale = yAxis.scale;
  const isUp = payload.close >= payload.open;
  const color = isUp ? "#22c55e" : "#ef4444";
  const yHigh = scale(payload.high);
  const yLow = scale(payload.low);
  const yOpen = scale(payload.open);
  const yClose = scale(payload.close);
  const bodyTop = Math.min(yOpen, yClose);
  const bodyBottom = Math.max(yOpen, yClose);
  const bodyHeight = Math.max(1, bodyBottom - bodyTop);
  const wickX = x + width / 2;
  return (
    <g>
      <line x1={wickX} y1={yHigh} x2={wickX} y2={yLow} stroke={color} strokeWidth={1} />
      <rect x={x} y={bodyTop} width={width} height={bodyHeight} fill={color} />
    </g>
  );
}

function CandlestickChart({ candles }: { candles: any[] }) {
  if (!candles?.length) return <div className="text-gray-500 text-sm">Sin velas todavía.</div>;
  const domain = [Math.min(...candles.map((c) => c.low)) * 0.998, Math.max(...candles.map((c) => c.high)) * 1.002];
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={candles}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="time" tickFormatter={(t) => new Date(t).toLocaleDateString("es-EC", { month: "short", day: "numeric" })} stroke="#6b7280" fontSize={9} />
        <YAxis domain={domain} stroke="#6b7280" fontSize={10} />
        <Tooltip
          contentStyle={{ background: "#111827", border: "1px solid #374151", fontSize: 12 }}
          labelFormatter={(t) => new Date(t as number).toLocaleString("es-EC")}
          formatter={(_: any, __: any, item: any) => [
            `O:${item.payload.open} H:${item.payload.high} L:${item.payload.low} C:${item.payload.close}`,
            "OHLC",
          ]}
        />
        <Bar dataKey="high" shape={<CandlestickShape />} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
        active ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-5">
      <h3 className="text-base font-bold mb-3">{title}</h3>
      {children}
    </div>
  );
}

export default function ProDashboardPage() {
  const [tab, setTab] = useState<"watchlist" | "alertas" | "portafolio" | "track">("watchlist");
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [nuevoSimbolo, setNuevoSimbolo] = useState("");
  const [simboloSeleccionado, setSimboloSeleccionado] = useState<string | null>(null);
  const [candles, setCandles] = useState<any[]>([]);
  const [intervalo, setIntervalo] = useState("1h");

  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertForm, setAlertForm] = useState({ symbol: "", metric: "price", condition: "above", threshold: "" });

  const [portafolio, setPortafolio] = useState<any>(null);
  const [connectForm, setConnectForm] = useState({ apiKey: "", apiSecret: "" });
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);

  const [trackRecord, setTrackRecord] = useState<any>(null);

  const loadWatchlist = useCallback(async () => {
    const r = await fetch("/api/pro-dashboard/watchlist", { headers: authHeaders() });
    if (r.ok) {
      const j = await r.json();
      setWatchlist(j.watchlist ?? []);
      if (!simboloSeleccionado && j.watchlist?.[0]) setSimboloSeleccionado(j.watchlist[0].symbol);
    }
  }, [simboloSeleccionado]);

  const loadCandles = useCallback(async (symbol: string, interval: string) => {
    const r = await fetch(`/api/pro-dashboard/candles/${symbol}?interval=${interval}`, { headers: authHeaders() });
    if (r.ok) {
      const j = await r.json();
      setCandles(j.candles ?? []);
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    const r = await fetch("/api/pro-dashboard/alerts", { headers: authHeaders() });
    if (r.ok) setAlerts((await r.json()).alerts ?? []);
  }, []);

  const loadPortafolio = useCallback(async () => {
    const r = await fetch("/api/pro-dashboard/exchange/balances", { headers: authHeaders() });
    if (r.ok) setPortafolio(await r.json());
  }, []);

  const loadTrackRecord = useCallback(async () => {
    const r = await fetch("/api/pro-dashboard/track-record", { headers: authHeaders() });
    if (r.ok) setTrackRecord(await r.json());
  }, []);

  useEffect(() => {
    loadWatchlist();
    loadAlerts();
    loadPortafolio();
    loadTrackRecord();
    const interval = setInterval(() => {
      loadWatchlist();
      loadAlerts();
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (simboloSeleccionado) loadCandles(simboloSeleccionado, intervalo);
  }, [simboloSeleccionado, intervalo, loadCandles]);

  async function agregarSimbolo() {
    if (!nuevoSimbolo) return;
    const r = await fetch("/api/pro-dashboard/watchlist", { method: "POST", headers: authHeaders(), body: JSON.stringify({ symbol: nuevoSimbolo.toUpperCase() }) });
    if (r.ok) {
      setNuevoSimbolo("");
      loadWatchlist();
    }
  }

  async function quitarSimbolo(symbol: string) {
    await fetch(`/api/pro-dashboard/watchlist/${symbol}`, { method: "DELETE", headers: authHeaders() });
    loadWatchlist();
  }

  async function crearAlerta() {
    if (!alertForm.symbol || !alertForm.threshold) return;
    const r = await fetch("/api/pro-dashboard/alerts", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ...alertForm, symbol: alertForm.symbol.toUpperCase(), threshold: parseFloat(alertForm.threshold) }),
    });
    if (r.ok) {
      setAlertForm({ symbol: "", metric: "price", condition: "above", threshold: "" });
      loadAlerts();
    }
  }

  async function borrarAlerta(id: number) {
    await fetch(`/api/pro-dashboard/alerts/${id}`, { method: "DELETE", headers: authHeaders() });
    loadAlerts();
  }

  async function conectarExchange() {
    setConnectLoading(true);
    setConnectError(null);
    try {
      const r = await fetch("/api/pro-dashboard/exchange/connect", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ ...connectForm, exchange: "binance" }),
      });
      const j = await r.json();
      if (!r.ok) {
        setConnectError(j.error ?? "No se pudo conectar");
      } else {
        setConnectForm({ apiKey: "", apiSecret: "" });
        loadPortafolio();
      }
    } finally {
      setConnectLoading(false);
    }
  }

  async function desconectarExchange() {
    await fetch("/api/pro-dashboard/exchange/disconnect", { method: "DELETE", headers: authHeaders() });
    setPortafolio({ conectado: false });
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
        🚀 PSY PRO DASHBOARD
      </h1>
      <p className="text-gray-400 text-sm mb-6">Tu watchlist, tus alertas, tu portafolio real y el track record del sistema — todo en un solo lugar.</p>

      <div className="flex gap-2 mb-6 flex-wrap">
        <TabButton active={tab === "watchlist"} onClick={() => setTab("watchlist")}>📊 Watchlist</TabButton>
        <TabButton active={tab === "alertas"} onClick={() => setTab("alertas")}>🔔 Alertas</TabButton>
        <TabButton active={tab === "portafolio"} onClick={() => setTab("portafolio")}>💰 Portafolio</TabButton>
        <TabButton active={tab === "track"} onClick={() => setTab("track")}>🎯 Track Record</TabButton>
      </div>

      {/* ---------- WATCHLIST ---------- */}
      {tab === "watchlist" && (
        <>
          <Card title="Agregar símbolo">
            <div className="flex gap-2">
              <input
                value={nuevoSimbolo}
                onChange={(e) => setNuevoSimbolo(e.target.value)}
                placeholder="Ej: SOLUSDT"
                className="bg-gray-800 rounded px-3 py-2 text-sm flex-1 outline-none"
              />
              <button onClick={agregarSimbolo} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm font-semibold">
                + Agregar
              </button>
            </div>
          </Card>

          <Card title="Tu Watchlist">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {watchlist.map((w) => (
                <div
                  key={w.symbol}
                  onClick={() => setSimboloSeleccionado(w.symbol)}
                  className={`cursor-pointer rounded-lg p-3 border ${
                    simboloSeleccionado === w.symbol ? "border-purple-500 bg-purple-950/30" : "border-gray-800 bg-gray-800/40"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{w.symbol}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        quitarSimbolo(w.symbol);
                      }}
                      className="text-gray-500 hover:text-red-400 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>${w.precio?.toLocaleString("es-EC")}</span>
                    <span className={w.cambio24hPct >= 0 ? "text-teal-400" : "text-red-400"}>
                      {w.cambio24hPct >= 0 ? "+" : ""}
                      {w.cambio24hPct}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">RSI: {w.rsi ?? "—"}</div>
                </div>
              ))}
              {watchlist.length === 0 && <p className="text-gray-500 text-sm">Todavía no agregaste ningún símbolo.</p>}
            </div>
          </Card>

          {simboloSeleccionado && (
            <Card title={`Gráfico — ${simboloSeleccionado}`}>
              <div className="flex gap-2 mb-3">
                {["15m", "1h", "4h", "1d"].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setIntervalo(tf)}
                    className={`px-3 py-1 rounded text-xs font-semibold ${intervalo === tf ? "bg-cyan-600" : "bg-gray-800 text-gray-400"}`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
              <CandlestickChart candles={candles} />
              <p className="text-xs text-gray-600 mt-2">Mismas velas de Binance que usa el motor de IA Trading — plano cartesiano real (O/H/L/C).</p>
            </Card>
          )}
        </>
      )}

      {/* ---------- ALERTAS ---------- */}
      {tab === "alertas" && (
        <>
          <Card title="Nueva alerta">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
              <input
                value={alertForm.symbol}
                onChange={(e) => setAlertForm({ ...alertForm, symbol: e.target.value })}
                placeholder="Símbolo (BTCUSDT)"
                className="bg-gray-800 rounded px-3 py-2 text-sm outline-none"
              />
              <select
                value={alertForm.metric}
                onChange={(e) => setAlertForm({ ...alertForm, metric: e.target.value })}
                className="bg-gray-800 rounded px-3 py-2 text-sm"
              >
                <option value="price">Precio</option>
                <option value="rsi">RSI</option>
              </select>
              <select
                value={alertForm.condition}
                onChange={(e) => setAlertForm({ ...alertForm, condition: e.target.value })}
                className="bg-gray-800 rounded px-3 py-2 text-sm"
              >
                <option value="above">Cruza arriba de</option>
                <option value="below">Cruza abajo de</option>
              </select>
              <input
                value={alertForm.threshold}
                onChange={(e) => setAlertForm({ ...alertForm, threshold: e.target.value })}
                placeholder="Umbral (70, 65000...)"
                className="bg-gray-800 rounded px-3 py-2 text-sm outline-none"
              />
            </div>
            <button onClick={crearAlerta} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm font-semibold">
              🔔 Crear alerta
            </button>
          </Card>

          <Card title="Tus alertas">
            <div className="space-y-2">
              {alerts.map((a) => (
                <div key={a.id} className="flex justify-between items-center bg-gray-800/50 rounded-lg px-3 py-2 text-sm">
                  <span>
                    {a.symbol} — {a.metric === "price" ? "Precio" : "RSI"} {a.condition === "above" ? "≥" : "≤"} {a.threshold}
                  </span>
                  <div className="flex items-center gap-2">
                    {!a.active && a.triggeredAt ? (
                      <span className="text-teal-400 text-xs">✅ Disparada {new Date(a.triggeredAt).toLocaleString("es-EC")}</span>
                    ) : (
                      <span className="text-yellow-500 text-xs">● Activa</span>
                    )}
                    <button onClick={() => borrarAlerta(a.id)} className="text-gray-500 hover:text-red-400 text-xs">
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && <p className="text-gray-500 text-sm">No tenés alertas todavía.</p>}
            </div>
            <p className="text-xs text-gray-600 mt-3 border-t border-gray-800 pt-3">
              Las alertas se revisan cada 2 minutos y quedan marcadas acá cuando se disparan. Notificación por Telegram/email llega en una próxima versión.
            </p>
          </Card>
        </>
      )}

      {/* ---------- PORTAFOLIO ---------- */}
      {tab === "portafolio" && (
        <>
          {!portafolio?.conectado ? (
            <Card title="Conectar tu exchange (Binance)">
              <p className="text-sm text-yellow-500 mb-3">
                ⚠ Usá SIEMPRE una API key de <strong>solo lectura</strong> (sin permiso de retiro ni de trading). Nunca vamos a pedirte una key con esos permisos.
              </p>
              <div className="space-y-2 mb-3">
                <input
                  value={connectForm.apiKey}
                  onChange={(e) => setConnectForm({ ...connectForm, apiKey: e.target.value })}
                  placeholder="API Key"
                  className="bg-gray-800 rounded px-3 py-2 text-sm w-full outline-none"
                />
                <input
                  value={connectForm.apiSecret}
                  onChange={(e) => setConnectForm({ ...connectForm, apiSecret: e.target.value })}
                  placeholder="API Secret"
                  type="password"
                  className="bg-gray-800 rounded px-3 py-2 text-sm w-full outline-none"
                />
              </div>
              {connectError && <p className="text-red-400 text-xs mb-2">{connectError}</p>}
              <button
                onClick={conectarExchange}
                disabled={connectLoading}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2 rounded text-sm font-semibold disabled:opacity-50"
              >
                {connectLoading ? "Conectando..." : "🔗 Conectar"}
              </button>
              <p className="text-xs text-gray-600 mt-3">Tu key se guarda encriptada (AES-256). Ni siquiera un admin de la plataforma puede leerla en texto plano.</p>
            </Card>
          ) : portafolio.error ? (
            <Card title="Portafolio">
              <p className="text-red-400 text-sm">{portafolio.error}</p>
              <button onClick={desconectarExchange} className="mt-3 text-xs text-gray-500 hover:text-red-400">
                Desconectar y volver a intentar
              </button>
            </Card>
          ) : (
            <Card title={`Portafolio real — ${portafolio.exchange}`}>
              <div className="text-2xl font-bold mb-4">${portafolio.totalUsd?.toLocaleString("es-EC")} <span className="text-sm text-gray-500 font-normal">USD estimado</span></div>
              <div className="space-y-2">
                {portafolio.balances?.map((b: any) => (
                  <div key={b.asset} className="flex justify-between bg-gray-800/50 rounded-lg px-3 py-2 text-sm">
                    <span className="font-semibold">{b.asset}</span>
                    <span>
                      {b.total.toLocaleString("es-EC", { maximumFractionDigits: 6 })} · ${b.usdValue.toLocaleString("es-EC")}
                    </span>
                  </div>
                ))}
              </div>
              <button onClick={desconectarExchange} className="mt-4 text-xs text-gray-500 hover:text-red-400">
                🔌 Desconectar exchange
              </button>
            </Card>
          )}
        </>
      )}

      {/* ---------- TRACK RECORD ---------- */}
      {tab === "track" && trackRecord && (
        <>
          <Card title="Resumen del sistema">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500">Win Rate</div>
                <div className="text-xl font-bold text-teal-400">{trackRecord.resumen.winRatePct ?? "—"}%</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500">Señales cerradas</div>
                <div className="text-xl font-bold">{trackRecord.resumen.totalCerradas}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500">PnL promedio</div>
                <div className={`text-xl font-bold ${(trackRecord.resumen.pnlPromedioPct ?? 0) >= 0 ? "text-teal-400" : "text-red-400"}`}>
                  {trackRecord.resumen.pnlPromedioPct ?? "—"}%
                </div>
              </div>
            </div>
          </Card>
          <Card title="Historial de señales">
            <div className="space-y-2">
              {trackRecord.señales.map((s: any) => (
                <div key={s.id} className="flex justify-between bg-gray-800/50 rounded-lg px-3 py-2 text-sm">
                  <span>
                    {s.symbol} · {s.motor} · {s.direccion}
                  </span>
                  <span
                    className={
                      s.estado === "GANADA" ? "text-teal-400" : s.estado === "PERDIDA" ? "text-red-400" : "text-gray-500"
                    }
                  >
                    {s.estado} {s.resultadoPct ? `(${s.resultadoPct}%)` : ""}
                  </span>
                </div>
              ))}
              {trackRecord.señales.length === 0 && (
                <p className="text-gray-500 text-sm">
                  Todavía no hay señales registradas — este historial se va a ir llenando a medida que los motores de señales
                  empiecen a guardar sus resultados acá.
                </p>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
