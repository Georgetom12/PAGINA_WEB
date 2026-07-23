// artifacts/psychometriks/src/pages/psy-panels-btc.tsx
//
// Página nueva — los 5 paneles pedidos, calculados SOLO para BTC.
// Consume /api/psy-panels-btc/live (nuevo backend: psy-panels-btc.ts)

import { useEffect, useState } from "react";

interface PanelsLive {
  updatedAt: number;
  simbolo: string;
  smd: any;
  rsiMaster: any;
  adxCvd: any;
  liquidityFlow: any;
  fundingSentiment: any;
}

function Card({
  title,
  emoji,
  children,
  explicacion,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
  explicacion?: string;
}) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-6">
      <h2 className="text-lg font-bold mb-3">
        {emoji} {title}
      </h2>
      {children}
      {explicacion && (
        <p className="text-xs text-gray-500 mt-3 border-t border-gray-800 pt-3">{explicacion}</p>
      )}
    </div>
  );
}

function Badge({ text, positive }: { text: string; positive: boolean | null }) {
  const color =
    positive === null ? "bg-gray-700 text-gray-300" : positive ? "bg-teal-900 text-teal-300" : "bg-red-900 text-red-300";
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{text}</span>;
}

export default function PsyPanelsBtcPage() {
  const [data, setData] = useState<PanelsLive | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/psy-panels-btc/live");
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) setError(json.error ?? "Error cargando paneles");
        else {
          setData(json);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Fallo de red pidiendo los paneles");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 60_000); // refresca cada 1 min
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">🧠 PSY PANELS — BTC</h1>
      <p className="text-gray-400 text-sm mb-6">
        Smart Money, RSI, ADX+CVD, Liquidez y Sentiment — todo calculado solo para BTC.
      </p>

      {loading && <div className="text-gray-400">Cargando...</div>}
      {error && <div className="bg-red-950 border border-red-700 text-red-300 rounded-lg p-4 mb-4">{error}</div>}

      {data && (
        <>
          {/* PANEL 1 — SMD */}
          {data.smd && (
            <Card title="PSY-SMD — Smart Money & Squeeze" emoji="🎯" explicacion={data.smd.explicacion}>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge text={data.smd.regimen} positive={data.smd.regimen.includes("ACUM") || data.smd.regimen.includes("LONG")} />
                {data.smd.ventanaRiesgo && <Badge text={`⚠ Ventana ${data.smd.ventanaRiesgo}`} positive={false} />}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <Stat label="Precio %" value={`${data.smd.precioPct}%`} />
                <Stat label="CVD %" value={`${data.smd.cvdPct}%`} />
                <Stat label="OI %" value={`${data.smd.oiPct}%`} />
                <Stat label="Funding" value={`${data.smd.fundingPct}%`} />
                <Stat label="LSQ score" value={`${data.smd.lsqScore}/9`} />
                <Stat label="SSQ score" value={`${data.smd.ssqScore}/9`} />
              </div>
            </Card>
          )}

          {/* PANEL 2 — RSI MASTER */}
          {data.rsiMaster && (
            <Card title="PSY RSI Master" emoji="📊" explicacion={data.rsiMaster.explicacion}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-left">
                    <th className="pb-2">TF</th>
                    <th className="pb-2">RSI</th>
                    <th className="pb-2">Zona</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.rsiMaster.porTimeframe).map(([tf, v]: [string, any]) => (
                    <tr key={tf} className="border-t border-gray-800">
                      <td className="py-1.5">{tf}</td>
                      <td className="py-1.5">{v.rsi}</td>
                      <td className="py-1.5">{v.zona}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* PANEL 3 — ADX+CVD */}
          {data.adxCvd && (
            <Card title="PSY ADX+CVD" emoji="📈" explicacion={data.adxCvd.explicacion}>
              <div className="mb-3">
                <Stat label="Score total confluencia" value={String(data.adxCvd.scoreTotal)} />
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-left">
                    <th className="pb-2">TF</th>
                    <th className="pb-2">ADX</th>
                    <th className="pb-2">Dirección</th>
                    <th className="pb-2">CVD%</th>
                    <th className="pb-2">RSI</th>
                    <th className="pb-2">Etiqueta</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.adxCvd.porTimeframe).map(([tf, v]: [string, any]) => (
                    <tr key={tf} className="border-t border-gray-800">
                      <td className="py-1.5">{tf}</td>
                      <td className="py-1.5">{v.adx}</td>
                      <td className="py-1.5">{v.direccion}</td>
                      <td className="py-1.5">{v.cvdPct}%</td>
                      <td className="py-1.5">{v.rsi}</td>
                      <td className="py-1.5">{v.etiqueta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* PANEL 4 — LIQUIDITY FLOW */}
          {data.liquidityFlow && (
            <Card title="PSY Liquidity Flow v2 — POC" emoji="💧" explicacion={data.liquidityFlow.explicacion}>
              <div className="flex flex-wrap gap-3 mb-3">
                <Stat label="Liquidity Score" value={`${data.liquidityFlow.liqScore}/100`} />
                <Stat label="POCs abajo" value={String(data.liquidityFlow.pocsAbajo)} />
                <Stat label="POCs arriba" value={String(data.liquidityFlow.pocsArriba)} />
                <Stat label="Capital" value={data.liquidityFlow.capitalEstado} />
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-left">
                    <th className="pb-2">TF</th>
                    <th className="pb-2">POC</th>
                    <th className="pb-2">Dist %</th>
                    <th className="pb-2">Posición</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.liquidityFlow.porTimeframe).map(([tf, v]: [string, any]) => (
                    <tr key={tf} className="border-t border-gray-800">
                      <td className="py-1.5">{tf}</td>
                      <td className="py-1.5">{v.poc}</td>
                      <td className="py-1.5">{v.distPct}%</td>
                      <td className="py-1.5">{v.posicion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* PANEL 5 — FUNDING SENTIMENT */}
          {data.fundingSentiment && (
            <Card title="PSY Funding Sentiment v2.1" emoji="🌊" explicacion={data.fundingSentiment.explicacion}>
              <div className="flex flex-wrap gap-3 mb-3">
                <Stat label="Sentiment" value={`${data.fundingSentiment.sentimentScore}/100`} />
                <Badge text={data.fundingSentiment.label} positive={data.fundingSentiment.sentimentScore >= 50} />
                <Stat label="Funding real" value={`${data.fundingSentiment.fundingPct}%`} />
                <Stat label="OI" value={data.fundingSentiment.oiEstado} />
                {data.fundingSentiment.squeezeSignal && <Badge text="💥 SQUEEZE" positive={true} />}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-left">
                    <th className="pb-2">TF</th>
                    <th className="pb-2">CVD %</th>
                    <th className="pb-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.fundingSentiment.porTimeframe).map(([tf, v]: [string, any]) => (
                    <tr key={tf} className="border-t border-gray-800">
                      <td className="py-1.5">{tf}</td>
                      <td className="py-1.5">{v.cvdPct}%</td>
                      <td className="py-1.5">{v.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          <div className="text-xs text-gray-600 text-center mt-2">
            Última actualización: {new Date(data.updatedAt).toLocaleString("es-EC")}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800/50 rounded-lg px-3 py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
