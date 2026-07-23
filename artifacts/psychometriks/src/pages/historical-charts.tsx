// artifacts/psychometriks/src/pages/historical-charts.tsx
//
// Página nueva — Gráficos Históricos (primeros 8). Pestaña separada de
// psy-panels-btc. Consume /api/historical-charts/live

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from "recharts";

const chartTooltip = { contentStyle: { background: "#111827", border: "1px solid #374151", fontSize: 12 } };
const COLORS = ["#a78bfa", "#38bdf8", "#f59e0b", "#f87171"];

function Card({ title, mide, nota, children }: { title: string; mide?: string; nota?: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {mide && <p className="text-xs text-gray-500 mb-3">{mide}</p>}
      <div className="mt-2">{children}</div>
      {nota && (
        <p className="text-xs text-yellow-600 mt-3 border-t border-gray-800 pt-3">
          ⚠ {nota}
        </p>
      )}
    </div>
  );
}

export default function HistoricalChartsPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/historical-charts/live");
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) setError(json.error ?? "Error cargando gráficos");
        else {
          setData(json);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Fallo de red pidiendo los gráficos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 5 * 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">📚 Gráficos Históricos — BTC & Macro</h1>
      <p className="text-gray-400 text-sm mb-6">8 gráficos con datos reales, actualizados automáticamente.</p>

      {loading && <div className="text-gray-400">Cargando...</div>}
      {error && <div className="bg-red-950 border border-red-700 text-red-300 rounded-lg p-4 mb-4">{error}</div>}

      {data && (
        <>
          {/* CHART 1 */}
          {data.chart1 && (
            <Card title={`1️⃣ ${data.chart1.nombre}`} mide={data.chart1.mide} nota={data.chart1.nota}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="day" type="number" domain={[0, 1450]} stroke="#6b7280" fontSize={10} allowDuplicatedCategory={false} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip {...chartTooltip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {Object.entries(data.chart1.series).map(([year, serie]: [string, any], idx: number) => (
                    <Line key={year} data={serie} type="monotone" dataKey="precio" name={year} stroke={COLORS[idx]} dot={false} strokeWidth={2} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* CHART 2 */}
          {data.chart2 && (
            <Card title={`2️⃣ ${data.chart2.nombre}`} mide={data.chart2.mide} nota={data.chart2.nota}>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={data.chart2.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tickFormatter={(d) => d?.slice(0, 4)} />
                  <YAxis yAxisId="mom" stroke="#6b7280" fontSize={10} />
                  <YAxis yAxisId="price" orientation="right" scale="log" domain={["auto", "auto"]} stroke="#6b7280" fontSize={10} />
                  <Tooltip {...chartTooltip} />
                  <ReferenceLine yAxisId="mom" y={0} stroke="#4b5563" />
                  <Area yAxisId="mom" type="monotone" dataKey="momentum" name="Momentum" stroke="#22c55e" fill="#22c55e55" />
                  <Line yAxisId="price" type="monotone" dataKey="precio" name="Precio BTC" stroke="#e5e7eb" dot={false} strokeWidth={1.5} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* CHART 3 */}
          {data.chart3 && (
            <Card title={`3️⃣ ${data.chart3.nombre}`} mide={data.chart3.mide}>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={data.chart3.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tickFormatter={(d) => d?.slice(0, 7)} />
                  <YAxis yAxisId="m2" stroke="#6b7280" fontSize={10} />
                  <YAxis yAxisId="price" orientation="right" scale="log" domain={["auto", "auto"]} stroke="#6b7280" fontSize={10} />
                  <Tooltip {...chartTooltip} />
                  <Area yAxisId="m2" type="monotone" dataKey="m2GrowthPct" name="M2 % desde inicio de mandato" stroke="#22c55e" fill="#22c55e33" />
                  <Line yAxisId="price" type="monotone" dataKey="precio" name="Precio BTC" stroke="#f59e0b" dot={false} strokeWidth={1.5} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* CHART 4 */}
          {data.chart4 && (
            <Card title={`4️⃣ ${data.chart4.nombre}`} mide={data.chart4.mide} nota={data.chart4.nota}>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={data.chart4.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tickFormatter={(d) => d?.slice(0, 4)} />
                  <YAxis yAxisId="idx" domain={[0, 100]} stroke="#6b7280" fontSize={10} />
                  <YAxis yAxisId="price" orientation="right" scale="log" domain={["auto", "auto"]} stroke="#6b7280" fontSize={10} />
                  <Tooltip {...chartTooltip} />
                  <ReferenceLine yAxisId="idx" y={70} stroke="#ef4444" strokeDasharray="4 4" />
                  <ReferenceLine yAxisId="idx" y={30} stroke="#14b8a6" strokeDasharray="4 4" />
                  <Line yAxisId="idx" type="monotone" dataKey="indice" name="PSY Tactical Index" stroke="#fb923c" dot={false} strokeWidth={2} />
                  <Line yAxisId="price" type="monotone" dataKey="precio" name="Precio BTC" stroke="#e5e7eb" dot={false} strokeWidth={1.5} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* CHART 5 */}
          {data.chart5 && (
            <Card title={`5️⃣ ${data.chart5.nombre}`} mide={data.chart5.mide}>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={data.chart5.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tickFormatter={(d) => d?.slice(0, 4)} />
                  <YAxis yAxisId="chg" stroke="#6b7280" fontSize={10} />
                  <YAxis yAxisId="price" orientation="right" scale="log" domain={["auto", "auto"]} stroke="#6b7280" fontSize={10} />
                  <Tooltip {...chartTooltip} />
                  <ReferenceLine yAxisId="chg" y={0} stroke="#4b5563" />
                  <Bar yAxisId="chg" dataKey="cambio4w" name="Cambio 4 semanas FED">
                    {data.chart5.series.map((d: any, i: number) => (
                      <Cell key={i} fill={d.cambio4w >= 0 ? "#22c55e" : "#ef4444"} />
                    ))}
                  </Bar>
                  <Line yAxisId="price" type="monotone" dataKey="precio" name="Precio BTC" stroke="#e5e7eb" dot={false} strokeWidth={1.5} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* CHART 6 */}
          {data.chart6 && (
            <Card title={`6️⃣ ${data.chart6.nombre}`} mide={data.chart6.mide}>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={data.chart6.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tickFormatter={(d) => d?.slice(0, 4)} />
                  <YAxis yAxisId="m2" stroke="#6b7280" fontSize={10} />
                  <YAxis yAxisId="cpi" orientation="right" stroke="#6b7280" fontSize={10} />
                  <Tooltip {...chartTooltip} />
                  <Line yAxisId="m2" type="monotone" dataKey="m2" name="M2 (miles de millones USD)" stroke="#38bdf8" dot={false} strokeWidth={2} />
                  <Line yAxisId="cpi" type="monotone" dataKey="poderAdquisitivo" name="Poder adquisitivo del dólar" stroke="#ef4444" dot={false} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* CHART 7 */}
          {data.chart7 && (
            <Card title={`7️⃣ ${data.chart7.nombre}`} mide={data.chart7.mide}>
              <div className="flex gap-4 mb-3 text-sm">
                <div className="bg-gray-800/50 rounded-lg px-3 py-2">
                  <div className="text-xs text-gray-500">CAGR (2000-hoy)</div>
                  <div className="font-semibold text-orange-400">{data.chart7.cagrPct}%/año</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg px-3 py-2">
                  <div className="text-xs text-gray-500">Última cifra ({data.chart7.fechaActual})</div>
                  <div className="font-semibold">${(data.chart7.valorActual / 1000).toFixed(2)}T</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data.chart7.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tickFormatter={(d) => d?.slice(0, 4)} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip {...chartTooltip} />
                  <Area type="monotone" dataKey="m2" name="M2 (miles de millones USD)" stroke="#ef4444" fill="#ef444433" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* CHART 8 */}
          {data.chart8 && (
            <Card title={`8️⃣ ${data.chart8.nombre}`} mide={data.chart8.mide}>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={data.chart8.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tickFormatter={(d) => d?.slice(0, 4)} />
                  <YAxis yAxisId="cpi" stroke="#6b7280" fontSize={10} />
                  <YAxis yAxisId="price" orientation="right" scale="log" domain={["auto", "auto"]} stroke="#6b7280" fontSize={10} />
                  <Tooltip {...chartTooltip} />
                  <ReferenceLine yAxisId="cpi" y={0} stroke="#4b5563" />
                  <Bar yAxisId="cpi" dataKey="inflacionPct" name="Inflación mensual %">
                    {data.chart8.series.map((d: any, i: number) => (
                      <Cell key={i} fill={d.recesion ? "#f59e0b" : d.inflacionPct >= 0 ? "#38bdf8" : "#22c55e"} />
                    ))}
                  </Bar>
                  <Line yAxisId="price" type="monotone" dataKey="precio" name="Precio BTC" stroke="#e5e7eb" dot={false} strokeWidth={1.5} />
                </ComposedChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 mt-2">Barras naranjas = mes en recesión oficial (NBER, vía FRED).</p>
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
