// PSY INDICATORS - Fetch Candles
// Ruta: artifacts/psychometriks/src/pages/indicators/shared/fetchCandles.ts

import { Candle, CandleResult, TF, bSym } from './types';

const TF_BYBIT: Record<TF, string> = { '15m': '15', '1h': '60', '4h': '240', '1d': 'D' };
const TF_OKX: Record<TF, string>   = { '15m': '15m', '1h': '1H', '4h': '4H', '1d': '1D' };

export async function fetchCandles(
  sym: string,
  tf: TF,
  limit = 250
): Promise<CandleResult> {
  const bs = bSym(sym);

  // 1. Bybit — más confiable para altcoins
  try {
    const r = await fetch(
      `https://api.bybit.com/v5/market/kline?symbol=${bs}&interval=${TF_BYBIT[tf]}&limit=${limit}`,
      { signal: AbortSignal.timeout(7000) }
    );
    const d = await r.json();
    if (d.result?.list?.length > 20) {
      const raw = d.result.list.reverse();
      return {
        candles: raw.map((k: string[]) => ({
          o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[5], bv: k[9] ? +k[9] : null
        })),
        src: 'Bybit',
        hasBV: !!raw[0]?.[9]
      };
    }
  } catch (_) {}

  // 2. OKX
  try {
    const r = await fetch(
      `https://www.okx.com/api/v5/market/candles?instId=${sym}-USDT&bar=${TF_OKX[tf]}&limit=${limit}`,
      { signal: AbortSignal.timeout(7000) }
    );
    const d = await r.json();
    if (d.data?.length > 20) {
      return {
        candles: d.data.reverse().map((k: string[]) => ({
          o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[7] || +k[5], bv: null
        })),
        src: 'OKX',
        hasBV: false
      };
    }
  } catch (_) {}

  // 3. CryptoCompare (agregado multi-exchange)
  const ccType = tf === '1d' ? 'day' : tf.includes('h') ? 'hour' : 'minute';
  const agg = tf === '4h' ? 4 : tf === '15m' ? 15 : 1;
  const r = await fetch(
    `https://min-api.cryptocompare.com/data/v2/histo${ccType}?fsym=${sym}&tsym=USD&aggregate=${agg}&limit=${limit}`,
    { signal: AbortSignal.timeout(8000) }
  );
  const d = await r.json();
  if (d.Data?.Data?.length > 20) {
    return {
      candles: d.Data.Data.map((k: { open: number; high: number; low: number; close: number; volumeto: number }) => ({
        o: k.open, h: k.high, l: k.low, c: k.close, v: k.volumeto, bv: null
      })),
      src: 'CryptoCompare',
      hasBV: false
    };
  }

  throw new Error('Sin fuente disponible para ' + sym);
}
