// PSY INDICATORS - Fetch Spot Price
// Ruta: artifacts/psychometriks/src/pages/indicators/shared/fetchSpot.ts

import { SpotResult, CG_IDS, bSym } from './types';

export async function fetchSpot(sym: string): Promise<SpotResult[]> {
  const results: SpotResult[] = [];
  const tasks: Promise<void>[] = [];
  const cgId = CG_IDS[sym];

  // 1. CoinGecko — precio real consenso
  if (cgId) {
    tasks.push(
      fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd&include_24hr_change=true`,
        { signal: AbortSignal.timeout(7000) }
      )
        .then(r => r.json())
        .then(d => {
          if (d[cgId]?.usd)
            results.push({ src: 'CoinGecko', price: d[cgId].usd, chg: d[cgId].usd_24h_change });
        })
        .catch(() => {})
    );
  }

  // 2. Bybit spot ticker
  tasks.push(
    fetch(
      `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${bSym(sym)}`,
      { signal: AbortSignal.timeout(5000) }
    )
      .then(r => r.json())
      .then(d => {
        const i = d?.result?.list?.[0];
        if (i?.lastPrice && +i.lastPrice > 0)
          results.push({ src: 'Bybit', price: +i.lastPrice, chg: +i.price24hPcnt * 100 });
      })
      .catch(() => {})
  );

  // 3. OKX spot ticker
  tasks.push(
    fetch(
      `https://www.okx.com/api/v5/market/ticker?instId=${sym}-USDT`,
      { signal: AbortSignal.timeout(5000) }
    )
      .then(r => r.json())
      .then(d => {
        if (d.data?.[0]?.last && +d.data[0].last > 0)
          results.push({ src: 'OKX', price: +d.data[0].last, chg: null });
      })
      .catch(() => {})
  );

  await Promise.allSettled(tasks);
  return results;
}

export function getBestSpot(results: SpotResult[]): SpotResult | null {
  if (!results.length) return null;
  return results.find(r => r.src === 'CoinGecko') || results[0];
}
