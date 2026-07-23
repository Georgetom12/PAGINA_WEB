// artifacts/psychometriks/src/pages/psy-panels-btc.tsx
//
// Página única con los 6 paneles técnicos para BTC:
//   0) PSY Liquidity Fuel — Global vs BTC (antes era una página aparte,
//      ahora vive acá mismo, junto con los otros)
//   1) PSY-SMD, 2) RSI Master, 3) ADX+CVD, 4) Liquidity Flow (POC),
//   5) Funding Sentiment
//
// Cada panel tiene: nombre + qué mide, gráfico real, y un VEREDICTO final
// con color (verde=alcista, rojo=bajista, gris=neutral) para que se
// entienda de un vistazo si es bueno o malo. RSI Master y ADX+CVD tienen
// pestañas por temporalidad (1H/4H/1D/1W) en vez de amontonar las 4 juntas.
//
// Consume /api/psy-panels-btc/live y /api/global-liquidity/live

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";

const fmtTime = (t: number) => {
  const d = new Date(t);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};
const fmtDate = (d: string) => d?.slice(2) ?? d;

const chartTooltip = { contentStyle: { background: "#111827", border: "1px solid #374151", fontSize: 12 } };

type Tipo = "alcista" | "bajista" | "neutral";

const TIPO_STYLES: Record<Tipo, { bg: string; text: string; icon: string; border: string }> = {
  alcista: { bg: "bg-teal-950", text: "text-teal-300", icon: "🟢", border: "border-teal-800" },
  bajista: { bg: "bg-red-950", text: "text-red-300", icon: "🔴", border: "border-red-800" },
  neutral: { bg: "bg-gray-800", text: "text-gray-300", icon: "⚪", border: "border-gray-700" },
};

function VeredictoBanner({ veredicto }: { veredicto?: { texto: string; tipo: Tipo } }) {
  if (!veredicto) return null;
  const s = TIPO_STYLES[veredicto.tipo] ?? TIPO_STYLES.neutral;
  return (
    <div className={`mt-3 rounded-lg border ${s.border} ${s.bg} px-3 py-2 flex items-start gap-2`}>
      <span>{s.icon}</span>
      <span className={`text-sm font-medium ${s.text}`}>{veredicto.texto}</span>
    </div>
  );
}

function Card({
  title,
  emoji,
  mide,
  children,
  explicacion,
  veredicto,
}: {
  title: string;
  emoji: string;
  mide?: string;
  children: React.ReactNode;
  explicacion?: string;
  veredicto?: { texto: string; tipo: Tipo };
}) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-6">
      <h2 className="text-lg font-bold">
        {emoji} {title}
      </h2>
      {mide && <p className="text-xs text-gray-500 mb-3">{mide}</p>}
      <div className="mt-3">{children}</div>
      <VeredictoBanner veredicto={veredicto} />
      {explicacion && <p className="text-xs text-gray-500 mt-3 border-t border-gray-800 pt-3">{explicacion}</p>}
    </div>
  );
}

function Stat({ label, value, tipo }: { label: string; value: string; tipo?: Tipo }) {
  const color = tipo === "alcista" ? "text-teal-400" : tipo === "bajista" ? "text-red-400" : "text-white";
  return (
    <div className="bg-gray-800/50 rounded-lg px-3 py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-sm font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function TabButtons({ tfs, active, onChange }: { tfs: string[]; active: string; onChange: (tf: string) => void }) {
  return (
    <div className="flex gap-1 mb-3">
      {tfs.map((tf) => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
            tf === active ? "bg-cyan-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}

export default function PsyPanelsBtcPage() {
  const [panels, setPanels] = useState<any>(null);
  const [fuel, setFuel] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsiTf, setRsiTf] = useState("1H");
  const [adxTf, setAdxTf] = useState("1H");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [rp, rf] = await Promise.all([fetch("/api/psy-panels-btc/live"), fetch("/api/global-liquidity/live")]);
        const [jp, jf] = await Promise.all([rp.json(), rf.json()]);
        if (cancelled) return;
        if (!rp.ok) setError(jp.error ?? "Error cargando paneles");
        else {
          setPanels(jp);
          setError(null);
        }
        if (rf.ok) setFuel(jf);
      } catch {
        if (!cancelled) setError("Fallo de red pidiendo los paneles");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const rsiTfs = panels?.rsiMaster ? Object.keys(panels.rsiMaster.porTimeframe) : [];
  const adxTfs = panels?.adxCvd ? Object.keys(panels.adxCvd.porTimeframe) : [];
  const rsiActive = panels?.rsiMaster?.porTimeframe?.[rsiTf];
  const adxActive = panels?.adxCvd?.porTimeframe?.[adxTf];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">🧠 PSY PANELS — BTC</h1>
      <p className="text-gray-400 text-sm mb-6">Liquidez global, Smart Money, RSI, ADX+CVD, POC y Sentiment — todo calculado para BTC.</p>

      {loading && <div className="text-gray-400">Cargando...</div>}
      {error && <div className="bg-red-950 border border-red-700 text-red-300 rounded-lg p-4 mb-4">{error}</div>}

      {/* PANEL 0 — LIQUIDITY FUEL (antes página aparte) */}
      {fuel && (
        <Card
          title={fuel.nombre ?? "PSY Liquidity Fuel — Global vs BTC"}
          emoji="💧"
          mide={fuel.mide}
          explicacion={undefined}
          veredicto={fuel.veredicto}
        >
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400 text-sm">Fuel Gauge</span>
              <span className="text-2xl font-bold">{fuel.fuelGauge?.toFixed(1)}/100</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${fuel.fuelGauge >= 50 ? "bg-teal-500" : "bg-red-500"}`}
                style={{ width: `${fuel.fuelGauge}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-3">
            <Stat label="Combustible (Z)" value={fuel.compositeZ?.toFixed(2)} tipo={fuel.compositeZ >= 0 ? "alcista" : "bajista"} />
            <Stat label="Impulso (4 sem)" value={fuel.fuelImpulse?.toFixed(2)} tipo={fuel.fuelImpulse >= 0 ? "alcista" : "bajista"} />
            <Stat label="Balances bancos (Z)" value={fuel.liqZBancos?.toFixed(2)} />
            <Stat label="DXY (Z)" value={fuel.dxyZ?.toFixed(2)} tipo={fuel.dxyZ <= 0 ? "alcista" : "bajista"} />
            <Stat label="Impulso tasas" value={fuel.rateImpulse?.toFixed(2)} tipo={fuel.rateImpulse >= 0 ? "alcista" : "bajista"} />
          </div>
          {fuel.historia?.length > 1 && (
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={fuel.historia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip {...chartTooltip} labelFormatter={fmtDate} />
                <ReferenceLine y={0} stroke="#4b5563" />
                <Bar dataKey="compositeZ" name="Combustible (Z)">
                  {fuel.historia.map((d: any, i: number) => (
                    <Cell key={i} fill={d.compositeZ >= 0 ? "#14b8a6" : "#ef4444"} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="fuelImpulse" name="Impulso" stroke="#fb923c" dot={false} strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
          <p className="text-xs text-gray-500 mt-3 border-t border-gray-800 pt-3">
            Combina impresión de dinero (FED+BOJ+ECB+BOE) + fuerza del dólar (DXY) + tasas de interés en un solo
            combustible macro. Columnas verdes/rojas = nivel del combustible; línea naranja = su impulso (si
            está acelerando o desacelerando).
          </p>
        </Card>
      )}

      {panels && (
        <>
          {/* PANEL 1 — SMD */}
          {panels.smd && (
            <Card title={panels.smd.nombre} emoji="🎯" mide={panels.smd.mide} explicacion={panels.smd.explicacion} veredicto={panels.smd.veredicto}>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-700 text-gray-200">{panels.smd.regimen}</span>
                {panels.smd.ventanaRiesgo && (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-yellow-900 text-yellow-300">⚠ Ventana {panels.smd.ventanaRiesgo}</span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                <Stat label="Precio %" value={`${panels.smd.precioPct}%`} tipo={panels.smd.precioPct >= 0 ? "alcista" : "bajista"} />
                <Stat label="CVD %" value={`${panels.smd.cvdPct}%`} tipo={panels.smd.cvdPct >= 0 ? "alcista" : "bajista"} />
                <Stat label="OI %" value={`${panels.smd.oiPct}%`} />
                <Stat label="Funding" value={`${panels.smd.fundingPct}%`} tipo={panels.smd.fundingPct <= 0 ? "alcista" : "bajista"} />
                <Stat label="LSQ score" value={`${panels.smd.lsqScore}/9`} />
                <Stat label="SSQ score" value={`${panels.smd.ssqScore}/9`} />
              </div>
              {panels.smd.historia?.length > 1 && (
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={panels.smd.historia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="time" tickFormatter={fmtTime} stroke="#6b7280" fontSize={10} />
                    <YAxis stroke="#6b7280" fontSize={10} />
                    <Tooltip {...chartTooltip} labelFormatter={fmtTime} />
                    <ReferenceLine y={0} stroke="#4b5563" />
                    <Bar dataKey="divScore" name="Div. Score">
                      {panels.smd.historia.map((d: any, i: number) => (
                        <Cell key={i} fill={d.divScore >= 0 ? "#14b8a6" : "#ef4444"} />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey="cvdPct" name="CVD %" stroke="#38bdf8" dot={false} strokeWidth={1.5} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Card>
          )}

          {/* PANEL 2 — RSI MASTER (con pestañas) */}
          {panels.rsiMaster && (
            <Card title={panels.rsiMaster.nombre} emoji="📊" mide={panels.rsiMaster.mide} explicacion={panels.rsiMaster.explicacion} veredicto={rsiActive?.veredicto}>
              <TabButtons tfs={rsiTfs} active={rsiTf} onChange={setRsiTf} />
              {rsiActive && (
                <>
                  <div className="flex flex-wrap gap-3 mb-3">
                    <Stat label={`RSI ${rsiTf}`} value={String(rsiActive.rsi)} tipo={rsiActive.veredicto?.tipo} />
                    <Stat label="Zona" value={rsiActive.zona} />
                  </div>
                  {rsiActive.historia?.length > 1 && (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={rsiActive.historia}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="time" tickFormatter={fmtTime} stroke="#6b7280" fontSize={10} />
                        <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={10} />
                        <Tooltip {...chartTooltip} labelFormatter={fmtTime} />
                        <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" />
                        <ReferenceLine y={50} stroke="#4b5563" strokeDasharray="2 2" />
                        <ReferenceLine y={30} stroke="#14b8a6" strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="rsi" name={`RSI ${rsiTf}`} stroke="#a78bfa" dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </>
              )}
            </Card>
          )}

          {/* PANEL 3 — ADX+CVD (con pestañas) */}
          {panels.adxCvd && (
            <Card title={panels.adxCvd.nombre} emoji="📈" mide={panels.adxCvd.mide} explicacion={panels.adxCvd.explicacion} veredicto={adxActive?.veredicto}>
              <div className="mb-3">
                <Stat label="Score total confluencia (4 TF)" value={String(panels.adxCvd.scoreTotal)} tipo={panels.adxCvd.scoreTotal > 0 ? "alcista" : panels.adxCvd.scoreTotal < 0 ? "bajista" : "neutral"} />
              </div>
              <TabButtons tfs={adxTfs} active={adxTf} onChange={setAdxTf} />
              {adxActive && (
                <>
                  <div className="flex flex-wrap gap-3 mb-3">
                    <Stat label={`ADX ${adxTf}`} value={String(adxActive.adx)} />
                    <Stat label="Dirección" value={adxActive.direccion} tipo={adxActive.direccion === "ALCISTA" ? "alcista" : adxActive.direccion === "BAJISTA" ? "bajista" : "neutral"} />
                    <Stat label="CVD%" value={`${adxActive.cvdPct}%`} tipo={adxActive.cvdPct >= 0 ? "alcista" : "bajista"} />
                    <Stat label="Etiqueta" value={adxActive.etiqueta} />
                  </div>
                  {adxActive.historia?.length > 1 && (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={adxActive.historia}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="time" tickFormatter={fmtTime} stroke="#6b7280" fontSize={10} />
                        <YAxis stroke="#6b7280" fontSize={10} />
                        <Tooltip {...chartTooltip} labelFormatter={fmtTime} />
                        <ReferenceLine y={25} stroke="#f59e0b" strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="adx" name={`ADX ${adxTf}`} stroke="#f59e0b" dot={false} strokeWidth={2} />
                        <Line type="monotone" dataKey="cvdPct" name={`CVD% ${adxTf}`} stroke="#38bdf8" dot={false} strokeWidth={1.5} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </>
              )}
            </Card>
          )}

          {/* PANEL 4 — LIQUIDITY FLOW (POC) */}
          {panels.liquidityFlow && (
            <Card title={panels.liquidityFlow.nombre} emoji="💧" mide={panels.liquidityFlow.mide} explicacion={panels.liquidityFlow.explicacion} veredicto={panels.liquidityFlow.veredicto}>
              <div className="flex flex-wrap gap-3 mb-3">
                <Stat label="Liquidity Score" value={`${panels.liquidityFlow.liqScore}/100`} tipo={panels.liquidityFlow.liqScore >= 60 ? "alcista" : panels.liquidityFlow.liqScore <= 40 ? "bajista" : "neutral"} />
                <Stat label="POCs abajo" value={String(panels.liquidityFlow.pocsAbajo)} />
                <Stat label="POCs arriba" value={String(panels.liquidityFlow.pocsArriba)} />
                <Stat label="Capital" value={panels.liquidityFlow.capitalEstado} tipo={panels.liquidityFlow.capitalEstado === "ACUMULACIÓN" ? "alcista" : panels.liquidityFlow.capitalEstado === "DISTRIBUCIÓN" ? "bajista" : "neutral"} />
              </div>
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="text-gray-500 text-left">
                    <th className="pb-2">TF</th>
                    <th className="pb-2">POC</th>
                    <th className="pb-2">Dist %</th>
                    <th className="pb-2">Posición</th>
                    <th className="pb-2">Cobertura</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(panels.liquidityFlow.porTimeframe).map(([tf, v]: [string, any]) => (
                    <tr key={tf} className="border-t border-gray-800">
                      <td className="py-1.5">{tf}</td>
                      <td className="py-1.5">{v.poc}</td>
                      <td className="py-1.5">{v.distPct}%</td>
                      <td className={`py-1.5 ${v.posicion === "ABAJO" ? "text-red-400" : v.posicion === "ARRIBA" ? "text-teal-400" : ""}`}>{v.posicion}</td>
                      <td className="py-1.5 text-gray-400">
                        {v.cobertura}
                        {!v.coberturaCompleta && <span className="text-yellow-500 ml-1">⚠ parcial</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {panels.liquidityFlow.historia?.length > 1 && (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={panels.liquidityFlow.historia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="time" tickFormatter={fmtTime} stroke="#6b7280" fontSize={10} />
                    <YAxis stroke="#6b7280" fontSize={10} />
                    <Tooltip {...chartTooltip} labelFormatter={fmtTime} />
                    <ReferenceLine y={0} stroke="#4b5563" />
                    <ReferenceLine y={15} stroke="#ef4444" strokeDasharray="4 4" />
                    <ReferenceLine y={-15} stroke="#14b8a6" strokeDasharray="4 4" />
                    <Area type="monotone" dataKey="capitalDiv" name="Divergencia Capital" stroke="#fb923c" fill="#fb923c33" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>
          )}

          {/* PANEL 5 — FUNDING SENTIMENT */}
          {panels.fundingSentiment && (
            <Card title={panels.fundingSentiment.nombre} emoji="🌊" mide={panels.fundingSentiment.mide} explicacion={panels.fundingSentiment.explicacion} veredicto={panels.fundingSentiment.veredicto}>
              <div className="flex flex-wrap gap-3 mb-3">
                <Stat label="Sentiment" value={`${panels.fundingSentiment.sentimentScore}/100`} tipo={panels.fundingSentiment.sentimentScore >= 55 ? "alcista" : panels.fundingSentiment.sentimentScore <= 45 ? "bajista" : "neutral"} />
                <Stat label="Estado" value={panels.fundingSentiment.label} />
                <Stat label="Funding real" value={`${panels.fundingSentiment.fundingPct}%`} tipo={panels.fundingSentiment.fundingPct <= 0 ? "alcista" : "bajista"} />
                <Stat label="OI" value={panels.fundingSentiment.oiEstado} />
                {panels.fundingSentiment.squeezeSignal && <Stat label="Señal" value="💥 SQUEEZE" tipo="alcista" />}
              </div>
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="text-gray-500 text-left">
                    <th className="pb-2">TF</th>
                    <th className="pb-2">CVD %</th>
                    <th className="pb-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(panels.fundingSentiment.porTimeframe).map(([tf, v]: [string, any]) => (
                    <tr key={tf} className="border-t border-gray-800">
                      <td className="py-1.5">{tf}</td>
                      <td className="py-1.5">{v.cvdPct}%</td>
                      <td className={`py-1.5 ${v.estado === "COMPRA" ? "text-teal-400" : v.estado === "VENTA" ? "text-red-400" : ""}`}>{v.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {panels.fundingSentiment.historia?.length > 1 && (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={panels.fundingSentiment.historia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="time" tickFormatter={fmtTime} stroke="#6b7280" fontSize={10} />
                    <YAxis stroke="#6b7280" fontSize={10} />
                    <Tooltip {...chartTooltip} labelFormatter={fmtTime} />
                    <ReferenceLine y={3} stroke="#14b8a6" strokeDasharray="4 4" />
                    <ReferenceLine y={0} stroke="#4b5563" />
                    <ReferenceLine y={-3} stroke="#ef4444" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="cvdPct" name="CVD % 1H" stroke="#22d3ee" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          )}

          <div className="text-xs text-gray-600 text-center mt-2">
            Última actualización: {new Date(panels.updatedAt).toLocaleString("es-EC")}
          </div>
        </>
      )}
    </div>
  );
}
