/**
 * ÍNDICES CRIPTO — Dominancia BTC/USDT y TOTAL 1/2/3
 * ─────────────────────────────────────────────────────────────────────────────
 * Estos NO son activos que se compren/vendan — son índices calculados
 * (dominancia = capitalización de una moneda ÷ capitalización total del
 * mercado). Binance/Bybit/OKX no tienen velas históricas de esto porque no
 * es un instrumento financiero. Tampoco existe un endpoint gratis con
 * historial ya armado.
 *
 * Por eso este módulo hace algo distinto a los otros: en vez de PEDIR
 * historial, lo CONSTRUYE — cada 5 minutos guarda un dato real (de
 * CoinGecko, gratis, sin key) y arma sus propias "velas" horarias con el
 * tiempo. El análisis técnico completo (RSI, MACD, patrones) solo se activa
 * cuando ya hay suficiente historial real acumulado — no antes, y no se
 * inventa nada mientras tanto.
 */
import { Router, type Request, type Response } from "express";
import { ema, rsi, macdCalc, structure, type OHLCV } from "./psy-algo";

const router = Router();

const SERIES = ["btc_dominance", "usdt_dominance", "total", "total2", "total3"] as const;
type SerieId = typeof SERIES[number];

const samples: Record<SerieId, Array<{ t: number; v: number }>> = {
  btc_dominance: [], usdt_dominance: [], total: [], total2: [], total3: [],
};
const MAX_SAMPLES = 20_000; // ~10 semanas a 5min — suficiente margen

async function recolectar() {
  try {
    const r = await fetch("https://api.coingecko.com/api/v3/global", { signal: AbortSignal.timeout(10000) });
    if (!r.ok) { console.error(`[crypto-indices] HTTP ${r.status} en CoinGecko /global`); return; }
    const d = await r.json() as {
      data?: { total_market_cap?: { usd?: number }; market_cap_percentage?: Record<string, number> };
    };
    const g = d?.data;
    if (!g?.total_market_cap?.usd || !g?.market_cap_percentage) { console.error("[crypto-indices] respuesta sin datos útiles"); return; }

    const total = g.total_market_cap.usd;
    const btcPct = g.market_cap_percentage.btc ?? 0;
    const usdtPct = g.market_cap_percentage.usdt ?? 0;
    const ethPct = g.market_cap_percentage.eth ?? 0;
    const btcMcap = total * (btcPct / 100);
    const ethMcap = total * (ethPct / 100);

    const t = Date.now();
    samples.btc_dominance.push({ t, v: btcPct });
    samples.usdt_dominance.push({ t, v: usdtPct });
    samples.total.push({ t, v: total });
    samples.total2.push({ t, v: total - btcMcap });
    samples.total3.push({ t, v: total - btcMcap - ethMcap });
    for (const s of SERIES) if (samples[s].length > MAX_SAMPLES) samples[s].shift();

    console.log(`[crypto-indices] muestra guardada — BTC.D=${btcPct.toFixed(2)}% USDT.D=${usdtPct.toFixed(2)}% TOTAL=$${(total/1e12).toFixed(2)}T`);
  } catch (e) {
    console.error("[crypto-indices] error de red:", e instanceof Error ? e.message : e);
  }
}

// Arma velas horarias reales a partir de las muestras de 5 min acumuladas
function armarVelasHorarias(serie: Array<{ t: number; v: number }>): OHLCV[] {
  if (!serie.length) return [];
  const buckets = new Map<number, { t: number; v: number }[]>();
  for (const s of serie) {
    const hora = Math.floor(s.t / 3_600_000) * 3_600_000;
    if (!buckets.has(hora)) buckets.set(hora, []);
    buckets.get(hora)!.push(s);
  }
  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hora, pts]) => ({
      time: hora,
      open: pts[0]!.v,
      high: Math.max(...pts.map(p => p.v)),
      low: Math.min(...pts.map(p => p.v)),
      close: pts.at(-1)!.v,
      volume: 0, // no aplica — esto no es un activo negociado
    }));
}

const NOMBRES: Record<SerieId, string> = {
  btc_dominance: "Dominancia BTC", usdt_dominance: "Dominancia USDT",
  total: "TOTAL (cripto sin excluir nada)", total2: "TOTAL2 (sin BTC)", total3: "TOTAL3 (sin BTC ni ETH)",
};

// Estado en vivo, disponible desde la primera muestra — no espera al historial
router.get("/crypto-indices/live", (_req: Request, res: Response) => {
  const data = SERIES.map(s => {
    const arr = samples[s];
    const last = arr.at(-1);
    return { id: s, nombre: NOMBRES[s], valor: last?.v ?? null, muestras: arr.length, actualizado: last?.t ?? null };
  });
  res.json({ ok: true, data });
});

// Análisis técnico — solo cuando ya hay suficiente historial real (mínimo
// ~20 velas horarias = ~20h de recolección continua desde que arrancó esto)
router.get("/crypto-indices/analizar/:id", (req: Request, res: Response) => {
  const id = req.params.id as SerieId;
  if (!SERIES.includes(id)) { res.status(400).json({ error: "Serie inválida" }); return; }
  const velas = armarVelasHorarias(samples[id]);
  if (velas.length < 20) {
    res.json({
      ok: true, id, nombre: NOMBRES[id], suficienteHistorial: false,
      velasAcumuladas: velas.length, velasNecesarias: 20,
      valorActual: samples[id].at(-1)?.v ?? null,
      mensaje: "Todavía acumulando historial real — esto no se puede acelerar, empezó a recolectarse justo ahora.",
    });
    return;
  }
  const closes = velas.map(v => v.close);
  const rsiVal = Math.round(rsi(closes) * 10) / 10;
  const e9 = ema(closes, Math.min(9, closes.length)).at(-1)!;
  const e21 = ema(closes, Math.min(21, closes.length)).at(-1)!;
  const macd = macdCalc(closes);
  const st = structure(velas);
  const dir = e9 > e21 ? "SUBIENDO" : e9 < e21 ? "BAJANDO" : "LATERAL";

  res.json({
    ok: true, id, nombre: NOMBRES[id], suficienteHistorial: true,
    valorActual: closes.at(-1), rsi: rsiVal, ema9: e9, ema21: e21,
    macdHist: macd.hist.at(-1), estructura: st, direccion: dir,
    velasAcumuladas: velas.length,
  });
});

let started = false;
export function startCryptoIndicesLoop() {
  if (started) return;
  started = true;
  recolectar();
  setInterval(recolectar, 5 * 60_000);
  console.log("[crypto-indices] recolector iniciado (BTC.D, USDT.D, TOTAL/2/3) — construyendo historial real desde cero");
}
startCryptoIndicesLoop();

export default router;
