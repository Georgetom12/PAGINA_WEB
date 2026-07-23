// artifacts/psychometriks/src/pages/liquidez-global.tsx
//
// Página NUEVA — PSY LIQUIDITY FUEL (web). Standalone por ahora, sin
// agregar al menú todavía (Jorge la va a introducir después junto con
// más indicadores que se sumen acá mismo).
//
// Consume /api/global-liquidity/live (nuevo backend: global-liquidity.ts)

import { useEffect, useState } from "react";

interface LiquidityHistoryPoint {
  date: string;
  compositeZ: number;
  fuelImpulse: number;
}

interface LiquidityLive {
  updatedAt: number;
  lastDate: string;
  fuelGauge: number;
  compositeZ: number;
  fuelImpulse: number;
  liqZBancos: number;
  dxyZ: number;
  rateImpulse: number;
  historia: LiquidityHistoryPoint[];
  fuentes: Record<string, string>;
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const w = 600;
  const h = 120;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  const zeroY = h - ((0 - min) / range) * h;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
      <line x1={0} y1={zeroY} x2={w} y2={zeroY} stroke="#4b5563" strokeDasharray="4 4" />
      <polyline points={points} fill="none" stroke="#f59e0b" strokeWidth={2} />
    </svg>
  );
}

function GaugeBar({ value }: { value: number }) {
  const color = value >= 50 ? "bg-teal-500" : "bg-red-500";
  return (
    <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
      <div
        className={`h-full ${color} transition-all duration-500`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function LiquidezGlobalPage() {
  const [data, setData] = useState<LiquidityLive | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/global-liquidity/live");
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error ?? "No se pudo cargar la liquidez global");
        } else {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError("Fallo de red pidiendo liquidez global");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 5 * 60 * 1000); // refresca cada 5 min en el front, el backend cachea 24hs
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">💧 PSY LIQUIDITY FUEL — Global</h1>
      <p className="text-gray-400 text-sm mb-6">
        Impresión de dinero (FED+BOJ+ECB+BOE) + monedas (DXY/EUR/JPY/GBP) + tasas
        de interés, combinado en un solo combustible de liquidez.
      </p>

      {loading && <div className="text-gray-400">Cargando datos macro...</div>}
      {error && (
        <div className="bg-red-950 border border-red-700 text-red-300 rounded-lg p-4 mb-4">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="bg-gray-900 rounded-xl p-6 mb-6 border border-gray-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Fuel Gauge</span>
              <span className="text-2xl font-bold">{data.fuelGauge.toFixed(1)}/100</span>
            </div>
            <GaugeBar value={data.fuelGauge} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <Metric label="Combustible (Z)" value={data.compositeZ} />
            <Metric label="Impulso (4 sem)" value={data.fuelImpulse} />
            <Metric label="Balances bancos (Z)" value={data.liqZBancos} />
            <Metric label="DXY (Z)" value={data.dxyZ} invert />
            <Metric label="Impulso tasas" value={data.rateImpulse} />
          </div>

          <div className="bg-gray-900 rounded-xl p-6 mb-6 border border-gray-800">
            <div className="text-gray-400 mb-2">Impulso del combustible — histórico</div>
            <Sparkline data={data.historia.map((h) => h.fuelImpulse)} />
          </div>

          <details className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-sm text-gray-400">
            <summary className="cursor-pointer text-gray-300">Fuentes de datos</summary>
            <ul className="mt-2 space-y-1">
              {Object.entries(data.fuentes).map(([k, v]) => (
                <li key={k}>
                  <span className="text-gray-500">{k}:</span> {v}
                </li>
              ))}
            </ul>
            <div className="mt-2 text-gray-600">
              Última actualización: {new Date(data.updatedAt).toLocaleString("es-EC")}
            </div>
          </details>
        </>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  invert = false,
}: {
  label: string;
  value: number;
  invert?: boolean;
}) {
  const positive = invert ? value <= 0 : value >= 0;
  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-semibold ${positive ? "text-teal-400" : "text-red-400"}`}>
        {value.toFixed(2)}
      </div>
    </div>
  );
} 
