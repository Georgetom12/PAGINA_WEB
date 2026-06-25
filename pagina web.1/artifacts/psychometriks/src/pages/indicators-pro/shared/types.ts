// PSY INDICATORS - Shared Types
// Ruta: artifacts/psychometriks/src/pages/indicators/shared/types.ts

export interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  bv?: number | null;
}

export interface SpotResult {
  src: string;
  price: number;
  chg: number | null;
}

export interface CandleResult {
  candles: Candle[];
  src: string;
  hasBV: boolean;
}

export interface ADXResult {
  adx: number[];
  dip: number[];
  dim: number[];
  priceC: number[];
  priceH: number[];
  priceL: number[];
}

export interface MACDResult {
  macd: number[];
  signal: number[];
  hist: number[];
  priceC: number[];
  priceH: number[];
  priceL: number[];
}

export interface Cross {
  i: number;
  type: 'bull' | 'bear';
  adx?: number;
  macd?: number;
  sig?: number;
  valid?: boolean;
}

export interface OIData {
  bybit: { oi: number; fund: number; price: number } | null;
  okx: { oi: number; fund: number | null } | null;
  binance: { oi: number; fund: number | null } | null;
  lsRatio: { buy: number; sell: number } | null;
  oiHist: { oi: number; ts: number }[];
}

export interface VolumeProfile {
  buckets: number[];
  poc: number;
  vah: number;
  val: number;
  hvns: { price: number; vol: number }[];
  lvns: { price: number; vol: number }[];
  priceMin: number;
  priceMax: number;
  bsz: number;
  nb: number;
}

export type TF = '15m' | '1h' | '4h' | '1d';

export const SYMBOLS = [
  'BTC','ETH','SOL','BNB','XRP','ADA','AVAX','LINK','LTC','DOT',
  'DOGE','SHIB','PEPE','WIF','BONK','BOME','FLOKI',
  'ONDO','ARB','OP','SUI','INJ','NEAR','TRUMP','TAO','FET',
  'ICP','FIL','APT','TIA','JUP','XAU'
];

export const MASTER_SYMBOLS = [
  'BTC','ETH','SOL','BNB','XRP','ADA','DOGE','AVAX',
  'LINK','ARB','OP','SUI','PEPE','WIF','BOME',
  'ONDO','NEAR','INJ','TRUMP','TAO'
];

export const CG_IDS: Record<string, string> = {
  BTC:'bitcoin',ETH:'ethereum',BNB:'binancecoin',SOL:'solana',
  XRP:'ripple',ADA:'cardano',AVAX:'avalanche-2',LINK:'chainlink',
  LTC:'litecoin',DOT:'polkadot',DOGE:'dogecoin',SHIB:'shiba-inu',
  PEPE:'pepe',WIF:'dogwifcoin',BONK:'bonk',BOME:'book-of-meme',
  FLOKI:'floki',ONDO:'ondo-finance',ARB:'arbitrum',OP:'optimism',
  SUI:'sui',INJ:'injective-protocol',NEAR:'near',TRUMP:'official-trump',
  TAO:'bittensor',FET:'fetch-ai',ICP:'internet-computer',FIL:'filecoin',
  APT:'aptos',TIA:'celestia',JUP:'jupiter-exchange-solana',XAU:'gold'
};

export const BYBIT_SYM: Record<string, string> = {
  BOME:'BOMEUSDT',PEPE:'PEPEUSDT',BONK:'BONKUSDT',
  WIF:'WIFUSDT',SHIB:'SHIBUSDT',FLOKI:'FLOKIUSDT'
};

export const bSym = (s: string) => BYBIT_SYM[s] || s + 'USDT';

export const fmtPrice = (v: number): string => {
  if (!v) return '—';
  const d = v < 0.0001 ? 8 : v < 0.01 ? 6 : v < 1 ? 5 : v < 100 ? 4 : 2;
  return '$' + v.toLocaleString('en-US', { maximumFractionDigits: d });
};

export const fmtPct = (v: number): string =>
  (v >= 0 ? '+' : '') + v.toFixed(2) + '%';

export const fmtBig = (v: number): string => {
  if (!v || isNaN(v)) return '—';
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(0) + 'K';
  return v.toFixed(0);
};

export const fmtFund = (v: number): string =>
  (v >= 0 ? '+' : '') + v.toFixed(4) + '%';
