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

function Card({
  title,
  mide,
  nota,
  detalle,
  children,
}: {
  title: string;
  mide?: string;
  nota?: string;
  detalle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {mide && <p className="text-xs text-gray-500 mb-3">{mide}</p>}
      <div className="mt-2">{children}</div>
      {nota && <p className="text-xs text-yellow-600 mt-3 border-t border-gray-800 pt-3">⚠ {nota}</p>}
      {detalle && !nota && <p className="text-xs text-gray-600 mt-3 border-t border-gray-800 pt-3">{detalle}</p>}
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

export default function HistoricalChartsPage() {
  const [data, setData] = useState<any>(null);
  const [data2, setData2] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [res, res2] = await Promise.all([fetch("/api/historical-charts/live"), fetch("/api/historical-charts-2/live")]);
        const json = await res.json();
        const json2 = await res2.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) setError(json.error ?? "Error cargando gráficos");
        else {
          setData(json);
          setError(null);
        }
        if (res2.ok) setData2(json2);
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
            <Card title={`1️⃣ ${data.chart1.nombre}`} mide={data.chart1.mide}>
              <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                <Stat label="Drawdown actual" value={`${data.chart1.resumen.drawdownActualPct}%`} />
                <Stat label="ATH histórico" value={`$${Math.round(data.chart1.resumen.athHistorico).toLocaleString("es-EC")}`} />
                <Stat label="Precio actual" value={`$${Math.round(data.chart1.resumen.precioActual).toLocaleString("es-EC")}`} />
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={data.chart1.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tickFormatter={(d) => d?.slice(0, 4)} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip {...chartTooltip} />
                  <ReferenceLine y={0} stroke="#4b5563" />
                  <Area type="monotone" dataKey="drawdownPct" name="Drawdown %" stroke="#ef4444" fill="#ef444433" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* CHART 2 */}
          {data.chart2 && (
            <Card title={`2️⃣ ${data.chart2.nombre}`} mide={data.chart2.mide} detalle={data.chart2.nota}>
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
            Última actualización (tanda 1): {new Date(data.updatedAt).toLocaleString("es-EC")}
          </div>
        </>
      )}

      {data2 && (
        <>
          {/* CHART 9 */}
          {data2.chart9 && (
            <Card title={`9️⃣ ${data2.chart9.nombre}`} mide={data2.chart9.mide} detalle={data2.chart9.nota}>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={data2.chart9.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tickFormatter={(d) => d?.slice(0, 4)} />
                  <YAxis scale="log" domain={["auto", "auto"]} stroke="#6b7280" fontSize={10} />
                  <Tooltip {...chartTooltip} />
                  <Line type="monotone" dataKey="heavyOver" name="Heavy Overvalued" stroke="#7f1d1d" dot={false} strokeWidth={1} />
                  <Line type="monotone" dataKey="over" name="Overvalued" stroke="#f59e0b" dot={false} strokeWidth={1} />
                  <Line type="monotone" dataKey="fair" name="Fair Value" stroke="#6b7280" dot={false} strokeWidth={1} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="under" name="Undervalued" stroke="#22c55e" dot={false} strokeWidth={1} />
                  <Line type="monotone" dataKey="heavyUnder" name="Heavy Undervalued" stroke="#14532d" dot={false} strokeWidth={1} />
                  <Line type="monotone" dataKey="precio" name="Precio BTC" stroke="#e5e7eb" dot={false} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* CHART 10 */}
          {data2.chart10 && (
            <Card title={`🔟 ${data2.chart10.nombre}`} mide={data2.chart10.mide}>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data2.chart10.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tickFormatter={(d) => d?.slice(0, 7)} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip {...chartTooltip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="breakeven5y" name="5-Year Breakeven" stroke="#e5e7eb" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="forward5y5y" name="5Y Forward 5Y" stroke="#38bdf8" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* CHART 11 */}
          {data2.chart11 && (
            <Card title={`1️⃣1️⃣ ${data2.chart11.nombre}`} mide={data2.chart11.mide} detalle={data2.chart11.nota}>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data2.chart11.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tickFormatter={(d) => d?.slice(0, 7)} />
                  <YAxis scale="log" domain={["auto", "auto"]} stroke="#6b7280" fontSize={10} />
                  <Tooltip {...chartTooltip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="privateEquityIdx" name="Basket Private Equity" stroke="#22c55e" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="sp500Idx" name="S&P 500" stroke="#e5e7eb" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* CHART 12 */}
          {data2.chart12 && (
            <Card title={`1️⃣2️⃣ ${data2.chart12.nombre}`} mide={data2.chart12.mide} nota={data2.chart12.nota}>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data2.chart12.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tickFormatter={(d) => d?.slice(0, 4)} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip {...chartTooltip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="top1Pct" name="Top 1% (%)" stroke="#f59e0b" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="bottom50Pct" name="Bottom 50% (%)" stroke="#38bdf8" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* CHART 13 */}
          {data2.chart13 && (
            <Card title={`1️⃣3️⃣ ${data2.chart13.nombre}`} mide={data2.chart13.mide} detalle={data2.chart13.nota}>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data2.chart13.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tickFormatter={(d) => d?.slice(0, 7)} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip {...chartTooltip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="ibitVol" name="IBIT" stroke="#38bdf8" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="fbtcVol" name="FBTC" stroke="#3b82f6" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="gbtcVol" name="GBTC" stroke="#7c3aed" dot={false} strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* CHART 14 */}
          {data2.chart14 && (
            <Card title={`1️⃣4️⃣ ${data2.chart14.nombre}`} mide={data2.chart14.mide} detalle={data2.chart14.nota}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data2.chart14.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="año" stroke="#6b7280" fontSize={10} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip {...chartTooltip} />
                  <Bar dataKey="millonesDirecciones" name="Direcciones activas (millones)" fill="#38bdf8" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* CHART 15 */}
          {data2.chart15 && (
            <Card title={`1️⃣5️⃣ ${data2.chart15.nombre}`} mide={data2.chart15.mide}>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={data2.chart15.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tickFormatter={(d) => d?.slice(0, 7)} />
                  <YAxis yAxisId="fund" stroke="#6b7280" fontSize={10} />
                  <YAxis yAxisId="price" orientation="right" scale="log" domain={["auto", "auto"]} stroke="#6b7280" fontSize={10} />
                  <Tooltip {...chartTooltip} />
                  <ReferenceLine yAxisId="fund" y={0} stroke="#4b5563" />
                  <Bar yAxisId="fund" dataKey="fundingPct" name="Funding %">
                    {data2.chart15.series.map((d: any, i: number) => (
                      <Cell key={i} fill={d.fundingPct >= 0 ? "#22c55e" : "#ef4444"} />
                    ))}
                  </Bar>
                  <Line yAxisId="price" type="monotone" dataKey="precio" name="Precio BTC" stroke="#e5e7eb" dot={false} strokeWidth={1.5} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* CHART 16 */}
          {data2.chart16 && (
            <Card title={`1️⃣6️⃣ ${data2.chart16.nombre}`} mide={data2.chart16.mide}>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={data2.chart16.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="dia" stroke="#6b7280" fontSize={10} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip {...chartTooltip} />
                  <ReferenceLine y={0} stroke="#4b5563" />
                  <Area type="monotone" dataKey="p75" stroke="none" fill="#a78bfa22" />
                  <Area type="monotone" dataKey="p25" stroke="none" fill="#0f172a" />
                  <Line type="monotone" dataKey="mediana" name="Performance mediana %" stroke="#a78bfa" dot={false} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* CHART 17 */}
          {data2.chart17 && (
            <Card title={`1️⃣7️⃣ ${data2.chart17.nombre}`} mide={data2.chart17.mide}>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={data2.chart17.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tickFormatter={(d) => d?.slice(0, 7)} />
                  <YAxis yAxisId="hash" stroke="#6b7280" fontSize={10} />
                  <YAxis yAxisId="price" orientation="right" scale="log" domain={["auto", "auto"]} stroke="#6b7280" fontSize={10} />
                  <Tooltip {...chartTooltip} />
                  <Area yAxisId="hash" type="monotone" dataKey="hashRateEHs" name="Hash Rate (EH/s)" stroke="#a78bfa" fill="#a78bfa33" strokeWidth={2} />
                  <Line yAxisId="price" type="monotone" dataKey="precio" name="Precio BTC" stroke="#f59e0b" dot={false} strokeWidth={1.5} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* CHART 18 */}
          {data2.chart18 && (
            <Card title={`1️⃣8️⃣ ${data2.chart18.nombre}`} mide={data2.chart18.mide} detalle={data2.chart18.nota}>
              <div className="space-y-2 text-sm">
                {Object.entries(data2.chart18.redes).map(([red, v]: [string, any]) => (
                  <div key={red} className="flex justify-between items-center bg-gray-800/50 rounded-lg px-3 py-2">
                    <span className="font-medium">
                      {red} {v.enVivo && <span className="text-teal-400 text-xs">● en vivo</span>}
                    </span>
                    {v.diasNecesarios != null ? (
                      <span className="text-gray-300">
                        {v.diasNecesarios.toLocaleString("es-EC")} días · ${(v.costoTotalUSD / 1_000_000).toFixed(0)}M
                      </span>
                    ) : (
                      <span className="text-yellow-600 text-xs">⚠ sin datos{v.error ? ` (${v.error})` : ""}</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* CHART 19 */}
          {data2.chart19 && (
            <Card title={`1️⃣9️⃣ ${data2.chart19.nombre}`} mide={data2.chart19.mide}>
              <div className="overflow-x-auto">
                <table className="text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="p-1 text-gray-500">Entrada</th>
                      {Array.from({ length: 15 }, (_, i) => i + 1).map((h) => (
                        <th key={h} className="p-1 text-gray-500">{h}a</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data2.chart19.filas.map((fila: any) => (
                      <tr key={fila.entryYear}>
                        <td className="p-1 text-gray-400 font-semibold">{fila.entryYear}</td>
                        {Array.from({ length: 15 }, (_, i) => i + 1).map((h) => {
                          const v = fila.cagrPorPeriodo[h];
                          if (v === undefined) return <td key={h} className="p-1"></td>;
                          const bg = v >= 100 ? "bg-blue-700" : v >= 50 ? "bg-teal-700" : v >= 0 ? "bg-green-800" : "bg-red-800";
                          return (
                            <td key={h} className={`p-1 text-center text-white ${bg}`}>
                              {Math.round(v)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <div className="text-xs text-gray-600 text-center mt-2">
            Última actualización (tanda 2): {new Date(data2.updatedAt).toLocaleString("es-EC")}
          </div>
        </>
      )}
    </div>
  );
}
