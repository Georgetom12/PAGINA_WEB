// PSY INDICATORS - Canvas Drawing Helpers
// Ruta: artifacts/psychometriks/src/pages/indicators/shared/drawCharts.ts

import { Cross } from './types';

const TEAL  = 'rgba(0,230,180,';
const RED   = 'rgba(224,85,85,';
const AMBER = 'rgba(230,180,0,';
const GRID  = 'rgba(42,53,64,0.3)';

function gridLines(ctx: CanvasRenderingContext2D, W: number, H: number, rows = 4) {
  ctx.strokeStyle = GRID;
  ctx.lineWidth = 0.5;
  for (let k = 0; k <= rows; k++) {
    const y = (H / rows) * k;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

// ── PRICE CHART ──────────────────────────────────────
export function drawPrice(
  canvas: HTMLCanvasElement,
  priceC: number[],
  priceH: number[],
  priceL: number[],
  spotPrice?: number | null,
  colorFn?: (i: number) => string
) {
  const W = canvas.offsetWidth || 600;
  canvas.width = W; canvas.height = 120;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, W, 120);

  const mn = Math.min(...priceL) * 0.9998;
  const mx = Math.max(...priceH) * 1.0002;
  const rng = mx - mn || 1;
  const bot = 108, top = 10, n = priceC.length;
  const sy = (v: number) => bot - (v - mn) / rng * (bot - top);
  const sx = (i: number) => i / (n - 1) * (W - 2) + 1;

  gridLines(ctx, W, 120, 3);

  if (colorFn) {
    for (let i = 1; i < n; i++) {
      ctx.strokeStyle = colorFn(i);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx(i-1), sy(priceC[i-1]));
      ctx.lineTo(sx(i),   sy(priceC[i]));
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(priceC[0]));
    for (let i = 1; i < n; i++) ctx.lineTo(sx(i), sy(priceC[i]));
    ctx.strokeStyle = TEAL + '0.85)'; ctx.lineWidth = 1.5; ctx.stroke();
  }

  // Fill gradient
  const g = ctx.createLinearGradient(0, 0, 0, 120);
  g.addColorStop(0, TEAL + '0.15)'); g.addColorStop(1, TEAL + '0)');
  ctx.beginPath();
  ctx.moveTo(sx(0), sy(priceC[0]));
  for (let i = 1; i < n; i++) ctx.lineTo(sx(i), sy(priceC[i]));
  ctx.lineTo(sx(n-1), 120); ctx.lineTo(0, 120); ctx.closePath();
  ctx.fillStyle = g; ctx.fill();

  // Spot price line
  if (spotPrice && spotPrice > mn && spotPrice < mx * 1.1) {
    const yS = sy(spotPrice);
    ctx.beginPath(); ctx.moveTo(0, yS); ctx.lineTo(W, yS);
    ctx.strokeStyle = AMBER + '0.7)'; ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '9px "Share Tech Mono"';
    ctx.fillStyle = '#e6b400'; ctx.textAlign = 'right';
    ctx.fillText('SPOT', W - 4, yS - 3);
  }
}

// ── ADX CHART ────────────────────────────────────────
export function drawADX(
  canvas: HTMLCanvasElement,
  adxArr: number[],
  dipArr: number[],
  dimArr: number[],
  crosses: Cross[],
  thresh: number,
  strong: number
) {
  const W = canvas.offsetWidth || 600;
  canvas.width = W; canvas.height = 115;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, W, 115);

  const mx = Math.max(70, ...adxArr, ...dipArr, ...dimArr);
  const bot = 100, top = 10, n = adxArr.length;
  const sy = (v: number) => bot - (v / mx) * (bot - top);
  const sx = (i: number) => i / (n - 1) * (W - 2) + 1;

  // Threshold lines
  [[thresh, AMBER + '0.45)'], [strong, RED + '0.4)']] .forEach(([v, c]) => {
    const y = sy(v as number);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y);
    ctx.strokeStyle = c as string; ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '9px "Share Tech Mono"';
    ctx.fillStyle = c as string; ctx.fillText(String(v), 4, y - 2);
  });

  // Cross vertical lines
  for (const c of crosses) {
    const x = sx(c.i);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, bot);
    ctx.strokeStyle = c.type === 'bull'
      ? (c.valid ? TEAL + '0.55)' : TEAL + '0.15)')
      : (c.valid ? RED  + '0.55)' : RED  + '0.15)');
    ctx.lineWidth = c.valid ? 1.5 : 1; ctx.stroke();
    ctx.font = '9px "Share Tech Mono"';
    ctx.fillStyle = c.type === 'bull' ? TEAL + '0.9)' : RED + '0.9)';
    ctx.textAlign = 'center';
    ctx.fillText(c.type === 'bull' ? '▲' : '▼', x, 9);
  }

  // Lines: ADX, DI+, DI−
  const lines: [number[], string, number][] = [
    [adxArr, TEAL + '0.95)', 2.2],
    [dipArr, TEAL + '0.5)',  1.2],
    [dimArr, RED  + '0.82)', 1.2],
  ];
  for (const [arr, col, lw] of lines) {
    ctx.beginPath(); ctx.moveTo(sx(0), sy(arr[0]));
    for (let i = 1; i < n; i++) ctx.lineTo(sx(i), sy(arr[i]));
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
  }
}

// ── RSI CHART ────────────────────────────────────────
export function drawRSI(
  canvas: HTMLCanvasElement,
  rsiArr: number[],
  rsiMA: (number | null)[],
  ob: number,
  os: number
) {
  const W = canvas.offsetWidth || 600;
  canvas.width = W; canvas.height = 120;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, W, 120);

  const bot = 108, top = 8, n = rsiArr.length;
  const sy = (v: number) => bot - (v / 100) * (bot - top);
  const sx = (i: number) => i / (n - 1) * (W - 2) + 1;
  const yob = sy(ob), yos = sy(os);

  ctx.fillStyle = RED + '0.06)';   ctx.fillRect(0, top, W, yob - top);
  ctx.fillStyle = TEAL + '0.06)';  ctx.fillRect(0, yos, W, bot - yos);

  for (const [v, c] of [[ob, RED + '0.5)'], [50, 'rgba(100,140,160,0.3)'], [os, TEAL + '0.5)']]) {
    const y = sy(v as number);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y);
    ctx.strokeStyle = c as string; ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '9px "Share Tech Mono"';
    ctx.fillStyle = (c as string).replace('0.', '0.8'); ctx.fillText(String(v), 4, y - 2);
  }

  for (let i = 1; i < n; i++) {
    const v = rsiArr[i];
    ctx.strokeStyle = v > ob ? RED + '0.9)' : v < os ? TEAL + '0.9)' : TEAL + '0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx(i-1), sy(rsiArr[i-1])); ctx.lineTo(sx(i), sy(v)); ctx.stroke();
  }

  if (rsiMA.length) {
    const off = n - rsiMA.filter(v => v !== null).length;
    ctx.beginPath(); let started = false;
    rsiMA.forEach((v, i) => {
      if (v === null) return;
      const x = sx(i + off), y = sy(v);
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = AMBER + '0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
  }
}

// ── RSI GAUGE ────────────────────────────────────────
export function drawGauge(canvas: HTMLCanvasElement, value: number, ob: number, os: number) {
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 200, 110);
  const cx = 100, cy = 95, r = 75;

  ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI);
  ctx.strokeStyle = '#1a2530'; ctx.lineWidth = 14; ctx.stroke();

  const zones = [
    { from: 0,  to: os, c: TEAL + '0.7)' },
    { from: os, to: 50, c: TEAL + '0.4)' },
    { from: 50, to: ob, c: AMBER + '0.4)' },
    { from: ob, to: 100, c: RED + '0.7)' },
  ];
  for (const z of zones) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI + (z.from / 100) * Math.PI, Math.PI + (z.to / 100) * Math.PI);
    ctx.strokeStyle = z.c; ctx.lineWidth = 14; ctx.stroke();
  }

  const ang = Math.PI + (value / 100) * Math.PI;
  const nx = cx + Math.cos(ang) * (r - 8);
  const ny = cy + Math.sin(ang) * (r - 8);
  const col = value > ob ? '#e05555' : value < os ? '#00e6b4' : '#e6b400';

  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny);
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = col; ctx.fill();

  ctx.font = '9px "Share Tech Mono"'; ctx.fillStyle = 'rgba(100,140,160,0.6)';
  ctx.textAlign = 'center';
  ctx.fillText('0', cx - r + 4, cy + 12);
  ctx.fillText('50', cx, cy - r - 4);
  ctx.fillText('100', cx + r - 4, cy + 12);
}

// ── MACD CHART ───────────────────────────────────────
export function drawMACD(
  canvas: HTMLCanvasElement,
  macdArr: number[],
  signalArr: number[],
  histArr: number[],
  crosses: Cross[]
) {
  const W = canvas.offsetWidth || 600;
  canvas.width = W; canvas.height = 140;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, W, 140);

  const allV = [...macdArr, ...signalArr, ...histArr];
  const mx = Math.max(...allV.map(Math.abs)) || 1;
  const mid = 70, top = 8, bot = 132, n = macdArr.length;
  const sy = (v: number) => mid - (v / mx) * (mid - top);
  const sx = (i: number) => i / (n - 1) * (W - 2) + 1;

  ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid);
  ctx.strokeStyle = 'rgba(100,140,160,0.3)'; ctx.lineWidth = 1; ctx.stroke();

  const bw = Math.max(1, W / n - 0.5);
  for (let i = 0; i < n; i++) {
    const h = histArr[i], x = sx(i) - bw / 2;
    const grow = i > 0 && Math.abs(h) > Math.abs(histArr[i-1]);
    ctx.fillStyle = h >= 0
      ? (grow ? TEAL + '0.7)' : TEAL + '0.3)')
      : (grow ? RED  + '0.7)' : RED  + '0.3)');
    const bH = Math.abs(sy(mid) - sy(mid + h));
    ctx.fillRect(x, h >= 0 ? sy(h) : mid, bw, Math.abs(mid - sy(h)) || 1);
  }

  for (const c of crosses) {
    const x = sx(c.i);
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bot);
    ctx.strokeStyle = c.type === 'bull' ? TEAL + '0.35)' : RED + '0.35)';
    ctx.lineWidth = 1.5; ctx.stroke();
    ctx.font = '9px "Share Tech Mono"';
    ctx.fillStyle = c.type === 'bull' ? TEAL + '0.9)' : RED + '0.9)';
    ctx.textAlign = 'center';
    ctx.fillText(c.type === 'bull' ? '▲' : '▼', x, top + 8);
  }

  [[macdArr, TEAL + '0.95)', 2.2], [signalArr, AMBER + '0.9)', 1.5]].forEach(([arr, col, lw]) => {
    ctx.beginPath(); ctx.moveTo(sx(0), sy((arr as number[])[0]));
    for (let i = 1; i < n; i++) ctx.lineTo(sx(i), sy((arr as number[])[i]));
    ctx.strokeStyle = col as string; ctx.lineWidth = lw as number; ctx.stroke();
  });
}

// ── OI HISTORY CHART ─────────────────────────────────
export function drawOIHistory(canvas: HTMLCanvasElement, oiData: number[]) {
  const W = canvas.offsetWidth || 600;
  canvas.width = W; canvas.height = 110;
  const ctx = canvas.getContext('2d')!;
  const n = oiData.length;
  if (n < 2) return;

  const mn = Math.min(...oiData) * 0.998;
  const mx = Math.max(...oiData) * 1.002;
  const rng = mx - mn || 1;
  const bot = 98, top = 10;
  const sy = (v: number) => bot - (v - mn) / rng * (bot - top);
  const sx = (i: number) => i / (n - 1) * (W - 2) + 1;

  const g = ctx.createLinearGradient(0, 0, 0, 110);
  g.addColorStop(0, TEAL + '0.2)'); g.addColorStop(1, TEAL + '0.02)');
  ctx.beginPath(); ctx.moveTo(sx(0), sy(oiData[0]));
  for (let i = 1; i < n; i++) ctx.lineTo(sx(i), sy(oiData[i]));
  ctx.lineTo(sx(n-1), bot); ctx.lineTo(0, bot); ctx.closePath();
  ctx.fillStyle = g; ctx.fill();

  ctx.beginPath(); ctx.moveTo(sx(0), sy(oiData[0]));
  for (let i = 1; i < n; i++) ctx.lineTo(sx(i), sy(oiData[i]));
  ctx.strokeStyle = TEAL + '0.9)'; ctx.lineWidth = 2; ctx.stroke();
}

// ── CVD CHART ────────────────────────────────────────
export function drawCVD(
  canvas: HTMLCanvasElement,
  cvdArr: number[],
  deltaArr: number[]
) {
  const W = canvas.offsetWidth || 600;
  canvas.width = W; canvas.height = 140;
  const ctx = canvas.getContext('2d')!;
  const n = cvdArr.length;
  const mx = Math.max(...cvdArr.map(Math.abs)) || 1;
  const mid = 70, top = 8, bot = 132;
  const sy = (v: number) => mid - (v / mx) * (mid - top);
  const sx = (i: number) => i / (n - 1) * (W - 2) + 1;

  ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid);
  ctx.strokeStyle = 'rgba(100,140,160,0.3)'; ctx.lineWidth = 1; ctx.stroke();

  const bw = Math.max(1, W / n - 0.5);
  for (let i = 0; i < n; i++) {
    const d = deltaArr[i], x = sx(i) - bw / 2;
    const grow = i > 0 && Math.abs(d) > Math.abs(deltaArr[i-1]);
    ctx.fillStyle = d >= 0
      ? (grow ? TEAL + '0.65)' : TEAL + '0.3)')
      : (grow ? RED  + '0.65)' : RED  + '0.3)');
    const bH = Math.abs(d) / mx * (mid - top);
    ctx.fillRect(x, d >= 0 ? mid - bH : mid, bw, bH || 1);
  }

  ctx.beginPath(); ctx.moveTo(sx(0), sy(cvdArr[0]));
  for (let i = 1; i < n; i++) ctx.lineTo(sx(i), sy(cvdArr[i]));
  ctx.strokeStyle = TEAL + '0.95)'; ctx.lineWidth = 2; ctx.stroke();

  const cvdNow = cvdArr[n - 1];
  const g = ctx.createLinearGradient(0, 0, 0, 140);
  g.addColorStop(0, cvdNow > 0 ? TEAL + '0.15)' : RED + '0)');
  g.addColorStop(1, cvdNow > 0 ? TEAL + '0)'    : RED + '0.1)');
  ctx.beginPath(); ctx.moveTo(sx(0), sy(cvdArr[0]));
  for (let i = 1; i < n; i++) ctx.lineTo(sx(i), sy(cvdArr[i]));
  ctx.lineTo(sx(n-1), mid); ctx.lineTo(sx(0), mid); ctx.closePath();
  ctx.fillStyle = g; ctx.fill();
}

// ── VOLUME PROFILE CHART ─────────────────────────────
export function drawVolProfile(
  canvas: HTMLCanvasElement,
  priceC: number[],
  priceH: number[],
  priceL: number[],
  profile: import('./types').VolumeProfile,
  spotPrice?: number | null
) {
  const W = canvas.offsetWidth || 600;
  canvas.width = W; canvas.height = 320;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, W, 320);

  const PW = Math.floor(W * 0.78);
  const n = priceC.length;
  const mn = Math.min(...priceL) * 0.9995;
  const mx = Math.max(...priceH) * 1.0005;
  const rng = mx - mn || 1;
  const bot = 308, top = 12;
  const sy = (v: number) => bot - (v - mn) / rng * (bot - top);
  const sx = (i: number) => i / (n - 1) * (PW - 2) + 1;

  gridLines(ctx, PW, 320, 4);

  // VAH VAL POC lines
  if (profile.vah) {
    const y = sy(profile.vah);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(PW, y);
    ctx.strokeStyle = RED + '0.5)'; ctx.lineWidth = 1; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '9px "Share Tech Mono"'; ctx.fillStyle = RED + '0.8)'; ctx.textAlign = 'right'; ctx.fillText('VAH', PW-3, y-2);
  }
  if (profile.val) {
    const y = sy(profile.val);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(PW, y);
    ctx.strokeStyle = TEAL + '0.4)'; ctx.lineWidth = 1; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '9px "Share Tech Mono"'; ctx.fillStyle = TEAL + '0.7)'; ctx.textAlign = 'right'; ctx.fillText('VAL', PW-3, y+9);
  }
  if (profile.poc) {
    const y = sy(profile.poc);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(PW, y);
    ctx.strokeStyle = AMBER + '0.75)'; ctx.lineWidth = 1.5; ctx.setLineDash([5,3]); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '9px "Share Tech Mono"'; ctx.fillStyle = AMBER + '0.9)'; ctx.textAlign = 'right'; ctx.fillText('POC', PW-3, y-2);
  }

  // Price line
  ctx.beginPath(); ctx.moveTo(sx(0), sy(priceC[0]));
  for (let i = 1; i < n; i++) ctx.lineTo(sx(i), sy(priceC[i]));
  ctx.strokeStyle = TEAL + '0.85)'; ctx.lineWidth = 1.5; ctx.stroke();

  const g = ctx.createLinearGradient(0, 0, 0, 320);
  g.addColorStop(0, TEAL + '0.12)'); g.addColorStop(1, TEAL + '0)');
  ctx.beginPath(); ctx.moveTo(sx(0), sy(priceC[0]));
  for (let i = 1; i < n; i++) ctx.lineTo(sx(i), sy(priceC[i]));
  ctx.lineTo(sx(n-1), bot); ctx.lineTo(0, bot); ctx.closePath();
  ctx.fillStyle = g; ctx.fill();

  if (spotPrice) {
    const yS = sy(spotPrice);
    ctx.beginPath(); ctx.moveTo(0, yS); ctx.lineTo(PW, yS);
    ctx.strokeStyle = AMBER + '0.6)'; ctx.lineWidth = 1; ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]);
  }

  // Profile bars (right side)
  const maxB = Math.max(...profile.buckets) || 1;
  const ProfW = W - PW;
  for (let i = 0; i < profile.nb; i++) {
    const p = profile.priceMin + i * (profile.priceMax - profile.priceMin) / profile.nb + (profile.priceMax - profile.priceMin) / (profile.nb * 2);
    const y = sy(p);
    const bw = profile.buckets[i] / maxB * ProfW * 0.9;
    const bH = Math.max(1, (bot - top) / profile.nb * 0.8);
    const isPOC = Math.abs(p - profile.poc) < (profile.priceMax - profile.priceMin) / profile.nb * 1.5;
    const isHVN = profile.hvns.some(h => Math.abs(h.price - p) < (profile.priceMax - profile.priceMin) / profile.nb);
    ctx.fillStyle = isPOC ? AMBER + '0.85)' : isHVN ? TEAL + '0.6)' : 'rgba(100,140,160,0.25)';
    ctx.fillRect(PW + 1, y - bH / 2, bw, bH);
  }

  ctx.beginPath(); ctx.moveTo(PW, top); ctx.lineTo(PW, bot);
  ctx.strokeStyle = 'rgba(42,53,64,0.5)'; ctx.lineWidth = 1; ctx.stroke();
}

// ── LIQ HEATMAP ──────────────────────────────────────
export function drawLiqHeatmap(
  canvas: HTMLCanvasElement,
  price: number,
  longs:  { lev: number; price: number; pct: number }[],
  shorts: { lev: number; price: number; pct: number }[]
) {
  const W = canvas.offsetWidth || 600;
  canvas.width = W; canvas.height = 300;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, W, 300);

  const mn = price * 0.77, mx = price * 1.23, rng = mx - mn;
  const bot = 285, top = 15;
  const sy = (v: number) => bot - (v - mn) / rng * (bot - top);
  const BH = Math.max(3, (bot - top) / longs.length * 0.7);

  gridLines(ctx, W, 300, 6);

  for (let i = 0; i < longs.length; i++) {
    const z = longs[i];
    if (z.price < mn || z.price > mx) continue;
    const y = sy(z.price), inten = 1 - i / longs.length;
    const g = ctx.createLinearGradient(0, 0, W * 0.6, 0);
    g.addColorStop(0, RED + (0.15 + inten * 0.55) + ')');
    g.addColorStop(1, RED + '0)');
    ctx.fillStyle = g; ctx.fillRect(0, y - BH / 2, W * 0.6, BH);
    ctx.font = '9px "Share Tech Mono"'; ctx.fillStyle = RED + (0.5 + inten * 0.4) + ')';
    ctx.textAlign = 'right'; ctx.fillText('×' + z.lev + ' LONG LIQ', W - 4, y + 3);
  }

  for (let i = 0; i < shorts.length; i++) {
    const z = shorts[i];
    if (z.price < mn || z.price > mx) continue;
    const y = sy(z.price), inten = 1 - i / shorts.length;
    const g = ctx.createLinearGradient(0, 0, W * 0.6, 0);
    g.addColorStop(0, TEAL + (0.12 + inten * 0.45) + ')');
    g.addColorStop(1, TEAL + '0)');
    ctx.fillStyle = g; ctx.fillRect(0, y - BH / 2, W * 0.6, BH);
    ctx.font = '9px "Share Tech Mono"'; ctx.fillStyle = TEAL + (0.5 + inten * 0.4) + ')';
    ctx.textAlign = 'right'; ctx.fillText('×' + z.lev + ' SHORT LIQ', W - 4, y + 3);
  }

  // Current price line with glow
  const yP = sy(price);
  ctx.shadowColor = TEAL + '0.5)'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(0, yP); ctx.lineTo(W, yP);
  ctx.strokeStyle = TEAL + '0.9)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = '10px "Share Tech Mono"'; ctx.fillStyle = '#00e6b4';
  ctx.textAlign = 'left'; ctx.fillText('◄ PRECIO', 4, yP - 4);
}
