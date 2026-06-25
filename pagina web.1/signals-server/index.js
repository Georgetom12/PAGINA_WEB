const express = require("express");
const cors    = require("cors");

const app  = express();
const PORT = process.env.PORT || 3001;

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://psychometriks.com",
  "https://www.psychometriks.com",
  "https://psychometriks.pages.dev",
  "https://psychometriks.netlify.app",
  "http://localhost:5173",
  "http://localhost:3000",
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.some(o => origin === o || origin.endsWith(".pages.dev")))
      cb(null, true);
    else cb(new Error("Not allowed by CORS"));
  },
}));
app.use(express.json());

// ── Semana activa — actualizar cada lunes ─────────────────────────────────────
const WEEK_OF = "2026-W19";

const SYMBOLS = [
  // MEGA CAPS
  { symbol: "BTCUSDT",    name: "Bitcoin",        icon: "₿",  color: "#f7931a" },
  { symbol: "ETHUSDT",    name: "Ethereum",        icon: "Ξ",  color: "#627eea" },
  { symbol: "SOLUSDT",    name: "Solana",          icon: "◎",  color: "#9945ff" },
  { symbol: "BNBUSDT",    name: "BNB",             icon: "⬡",  color: "#f3ba2f" },
  { symbol: "XRPUSDT",    name: "Ripple",          icon: "✕",  color: "#00aae4" },
  // TOP ALTS
  { symbol: "ADAUSDT",    name: "Cardano",         icon: "₳",  color: "#0033ad" },
  { symbol: "DOGEUSDT",   name: "Dogecoin",        icon: "Ð",  color: "#c2a633" },
  { symbol: "AVAXUSDT",   name: "Avalanche",       icon: "△",  color: "#e84142" },
  { symbol: "DOTUSDT",    name: "Polkadot",        icon: "⬤",  color: "#e6007a" },
  { symbol: "LINKUSDT",   name: "Chainlink",       icon: "🔗", color: "#375bd2" },
  { symbol: "LTCUSDT",    name: "Litecoin",        icon: "Ł",  color: "#bfbbbb" },
  { symbol: "UNIUSDT",    name: "Uniswap",         icon: "🦄", color: "#ff007a" },
  { symbol: "ATOMUSDT",   name: "Cosmos",          icon: "⚛",  color: "#6f7390" },
  { symbol: "NEARUSDT",   name: "NEAR",            icon: "Ⓝ",  color: "#00c08b" },
  { symbol: "MATICUSDT",  name: "Polygon",         icon: "⬡",  color: "#8247e5" },
  { symbol: "APTUSDT",    name: "Aptos",           icon: "◆",  color: "#00b4ff" },
  { symbol: "ARBUSDT",    name: "Arbitrum",        icon: "🔷", color: "#12aaff" },
  { symbol: "OPUSDT",     name: "Optimism",        icon: "🔴", color: "#ff0420" },
  { symbol: "SUIUSDT",    name: "Sui",             icon: "💧", color: "#6fbcf0" },
  { symbol: "INJUSDT",    name: "Injective",       icon: "💉", color: "#00f2fe" },
  { symbol: "SEIUSDT",    name: "Sei",             icon: "⚡", color: "#ff4d00" },
  { symbol: "AAVEUSDT",   name: "Aave",            icon: "👻", color: "#b6509e" },
  { symbol: "MKRUSDT",    name: "Maker",           icon: "🏛",  color: "#1aab9b" },
  { symbol: "CRVUSDT",    name: "Curve",           icon: "〰",  color: "#00fa9a" },
  { symbol: "LDOUSDT",    name: "Lido",            icon: "⚗",  color: "#00a3ff" },
  { symbol: "RUNEUSDT",   name: "THORChain",       icon: "⚡", color: "#33ff99" },
  { symbol: "ICPUSDT",    name: "Internet Comp.",  icon: "∞",  color: "#3b00b9" },
  { symbol: "FILUSDT",    name: "Filecoin",        icon: "⍟",  color: "#0090ff" },
  { symbol: "XLMUSDT",    name: "Stellar",         icon: "✦",  color: "#7d00ff" },
  { symbol: "HBARUSDT",   name: "Hedera",          icon: "ℏ",  color: "#00b0ef" },
  { symbol: "ALGOUSDT",   name: "Algorand",        icon: "◈",  color: "#00b4d8" },
  { symbol: "EGLDUSDT",   name: "MultiversX",      icon: "⬡",  color: "#1d43e2" },
  // AI & DeSci
  { symbol: "FETUSDT",    name: "Fetch.AI",        icon: "🤖", color: "#1f6eff" },
  { symbol: "RNDRUSDT",   name: "Render",          icon: "🖥",  color: "#ff4500" },
  { symbol: "WLDUSDT",    name: "Worldcoin",       icon: "🌍", color: "#00bcd4" },
  { symbol: "TAOUSDT",    name: "Bittensor",       icon: "🧠", color: "#4dabf7" },
  { symbol: "AGIXUSDT",   name: "SingularityNET",  icon: "🤖", color: "#5b6df8" },
  { symbol: "OCEANUSDT",  name: "Ocean",           icon: "🌊", color: "#e259ff" },
  // COINS CHINAS
  { symbol: "TRXUSDT",    name: "Tron",            icon: "🔴", color: "#ff060a" },
  { symbol: "VETUSDT",    name: "VeChain",         icon: "✓",  color: "#15bdff" },
  { symbol: "NEOUSDT",    name: "Neo",             icon: "⬡",  color: "#58bf00" },
  { symbol: "ONTUSDT",    name: "Ontology",        icon: "◈",  color: "#32a4be" },
  { symbol: "STRKUSDT",   name: "Starknet",        icon: "✦",  color: "#ec796b" },
  { symbol: "COREUSDT",   name: "Core DAO",        icon: "⬡",  color: "#ff7a00" },
  { symbol: "MOVEUSDT",   name: "Movement",        icon: "⚙",  color: "#a855f7" },
  // DeFi 2.0
  { symbol: "JUPUSDT",    name: "Jupiter",         icon: "🪐", color: "#c27aff" },
  { symbol: "PENDLEUSDT", name: "Pendle",          icon: "⏳", color: "#a3e635" },
  { symbol: "ENAUSDT",    name: "Ethena",          icon: "💠", color: "#8b5cf6" },
  { symbol: "PYTHUSDT",   name: "Pyth",            icon: "🔮", color: "#e6dafb" },
  { symbol: "RAYUSDT",    name: "Raydium",         icon: "💧", color: "#5ac4be" },
  { symbol: "TIAUSDT",    name: "Celestia",        icon: "🌐", color: "#7c3aed" },
  { symbol: "DYMUSDT",    name: "Dymension",       icon: "⬡",  color: "#e879f9" },
  // MEMES
  { symbol: "SHIBUSDT",   name: "Shiba Inu",       icon: "🐕", color: "#ff9800" },
  { symbol: "PEPEUSDT",   name: "Pepe",            icon: "🐸", color: "#00c853" },
  { symbol: "FLOKIUSDT",  name: "Floki",           icon: "🐶", color: "#ff8c00" },
  { symbol: "WIFUSDT",    name: "dogwifhat",       icon: "🎩", color: "#c8a96e" },
  { symbol: "BONKUSDT",   name: "Bonk",            icon: "🦴", color: "#f7931a" },
  { symbol: "TRUMPUSDT",  name: "Trump",           icon: "🇺🇸", color: "#ff1a1a" },
  { symbol: "PENGUUSDT",  name: "Pengu",           icon: "🐧", color: "#00cfff" },
  // GAMING & INFRA
  { symbol: "AXSUSDT",    name: "Axie Infinity",   icon: "🐾", color: "#0055d4" },
  { symbol: "SANDUSDT",   name: "Sandbox",         icon: "🏖",  color: "#00adef" },
  { symbol: "MANAUSDT",   name: "Decentraland",    icon: "🌐", color: "#ff2d55" },
  { symbol: "CHZUSDT",    name: "Chiliz",          icon: "⚽", color: "#cd0124" },
  { symbol: "GALAUSDT",   name: "Gala",            icon: "🎮", color: "#04c18b" },
  { symbol: "FTMUSDT",    name: "Fantom",          icon: "🔵", color: "#13b5ec" },
  { symbol: "IMXUSDT",    name: "ImmutableX",      icon: "🔷", color: "#00d4ff" },
  { symbol: "GRTUSDT",    name: "The Graph",       icon: "📊", color: "#6f4cff" },
  { symbol: "FLOWUSDT",   name: "Flow",            icon: "🌊", color: "#00ef8b" },
];

// ══════════════════════════════════════════════════════════════════════════════
// INDICADORES TÉCNICOS
// ══════════════════════════════════════════════════════════════════════════════

function calcEma(values, period) {
  const k = 2 / (period + 1);
  const result = [];
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = 0; i < period - 1; i++) result.push(NaN);
  result.push(prev);
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

function calcRsi(closes, period = 14) {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  if (losses === 0) return 100;
  return 100 - 100 / (1 + gains / losses);
}

function calcMacd(closes) {
  const ema12 = calcEma(closes, 12);
  const ema26 = calcEma(closes, 26);
  const line  = ema12.map((v, i) => v - ema26[i]).filter(v => !isNaN(v));
  const sig   = calcEma(line, 9);
  const n     = sig.length;
  return {
    histogram:      line[line.length - 1] - sig[n - 1],
    prev_histogram: line[line.length - 2] - sig[n - 2],
  };
}

function calcAtr(highs, lows, closes, period = 14) {
  const trs = [];
  for (let i = 1; i < closes.length; i++) {
    const hl  = highs[i] - lows[i];
    const hpc = Math.abs(highs[i] - closes[i - 1]);
    const lpc = Math.abs(lows[i]  - closes[i - 1]);
    trs.push(Math.max(hl, hpc, lpc));
  }
  if (trs.length < period) return trs[trs.length - 1] || 0;
  return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function calcVolSpike(volumes) {
  if (volumes.length < 10) return 1;
  const avg = volumes.slice(-10, -1).reduce((a, b) => a + b, 0) / 9;
  return avg > 0 ? volumes[volumes.length - 1] / avg : 1;
}

function calcMarketStructure(closes, lookback = 10) {
  const n = closes.length;
  if (n < lookback * 2) return "NEUTRAL";
  const recent = closes.slice(-lookback);
  const prev   = closes.slice(-lookback * 2, -lookback);
  const rH = Math.max(...recent), rL = Math.min(...recent);
  const pH = Math.max(...prev),   pL = Math.min(...prev);
  if (rH > pH && rL > pL) return "BULLISH";
  if (rH < pH && rL < pL) return "BEARISH";
  return "NEUTRAL";
}

// ══════════════════════════════════════════════════════════════════════════════
// FETCH VELAS — OKX primero, Bybit como fallback (sin geo-bloqueo)
// ══════════════════════════════════════════════════════════════════════════════

async function tryOkx(symbol, interval, limit) {
  const base     = symbol.replace(/USDT$/i, "");
  const instId   = `${base}-USDT`;
  const okxBar   = interval === "4h" ? "4H" : "1H";
  const url      = `https://www.okx.com/api/v5/market/candles?instId=${instId}&bar=${okxBar}&limit=${limit}`;
  const ctrl     = new AbortController();
  const timer    = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r    = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`OKX HTTP ${r.status}`);
    const json = await r.json();
    if (json.code !== "0" || !json.data?.length) throw new Error("OKX sin datos");
    return json.data.reverse().map(k => ({
      open:   parseFloat(k[1]),
      high:   parseFloat(k[2]),
      low:    parseFloat(k[3]),
      close:  parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
  } finally {
    clearTimeout(timer);
  }
}

async function tryBybit(symbol, interval, limit) {
  const bybitInterval = interval === "4h" ? "240" : "60";
  const url  = `https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=${bybitInterval}&limit=${limit}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r    = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`Bybit HTTP ${r.status}`);
    const json = await r.json();
    if (json.retCode !== 0 || !json.result?.list?.length) throw new Error("Bybit sin datos");
    return json.result.list.reverse().map(k => ({
      open:   parseFloat(k[1]),
      high:   parseFloat(k[2]),
      low:    parseFloat(k[3]),
      close:  parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
  } finally {
    clearTimeout(timer);
  }
}

async function fetchKlines(symbol, interval = "1h", limit = 100) {
  try { return await tryOkx(symbol, interval, limit); } catch {}
  try { return await tryBybit(symbol, interval, limit); } catch {}
  throw new Error(`Sin datos para ${symbol} ${interval}`);
}

// ══════════════════════════════════════════════════════════════════════════════
// ANÁLISIS PRINCIPAL v2 — 1H + 4H HTF + ATR dinámico
// ══════════════════════════════════════════════════════════════════════════════

async function analyseSymbol(meta) {
  try {
    const [klines1h, klines4h] = await Promise.all([
      fetchKlines(meta.symbol, "1h", 100),
      fetchKlines(meta.symbol, "4h", 60),
    ]);

    if (klines1h.length < 50 || klines4h.length < 30) return null;

    // ── Datos 1H ──────────────────────────────────────────────────────────────
    const closes1h  = klines1h.map(k => k.close);
    const highs1h   = klines1h.map(k => k.high);
    const lows1h    = klines1h.map(k => k.low);
    const volumes1h = klines1h.map(k => k.volume);
    const price     = closes1h[closes1h.length - 1];

    // ── Datos 4H ──────────────────────────────────────────────────────────────
    const closes4h = klines4h.map(k => k.close);
    const highs4h  = klines4h.map(k => k.high);
    const lows4h   = klines4h.map(k => k.low);

    // ── Indicadores 1H ───────────────────────────────────────────────────────
    const rsi1h      = calcRsi(closes1h, 14);
    const macd1h     = calcMacd(closes1h);
    const ema20_1h   = calcEma(closes1h, 20);
    const ema50_1h   = calcEma(closes1h, 50);
    const atr1h      = calcAtr(highs1h, lows1h, closes1h, 14);
    const volSpike   = calcVolSpike(volumes1h);
    const struct1h   = calcMarketStructure(closes1h, 10);

    const ema20_1h_v = ema20_1h[ema20_1h.length - 1];
    const ema50_1h_v = ema50_1h[ema50_1h.length - 1];

    // ── Indicadores 4H ───────────────────────────────────────────────────────
    const rsi4h      = calcRsi(closes4h, 14);
    const macd4h     = calcMacd(closes4h);
    const ema20_4h   = calcEma(closes4h, 20);
    const ema50_4h   = calcEma(closes4h, 50);
    const atr4h      = calcAtr(highs4h, lows4h, closes4h, 14);
    const struct4h   = calcMarketStructure(closes4h, 10);

    const ema20_4h_v = ema20_4h[ema20_4h.length - 1];
    const ema50_4h_v = ema50_4h[ema50_4h.length - 1];

    // ── HTF bias — el 4H manda ────────────────────────────────────────────────
    let htfScore = 0;
    if (closes4h[closes4h.length - 1] > ema20_4h_v && ema20_4h_v > ema50_4h_v) htfScore += 2;
    else if (closes4h[closes4h.length - 1] < ema20_4h_v && ema20_4h_v < ema50_4h_v) htfScore -= 2;
    if (struct4h === "BULLISH") htfScore++;
    if (struct4h === "BEARISH") htfScore--;
    if (rsi4h > 50) htfScore++;
    if (rsi4h < 50) htfScore--;
    if (macd4h.histogram > 0) htfScore++;
    if (macd4h.histogram < 0) htfScore--;

    const htfBias = htfScore >= 3 ? "BULLISH" : htfScore <= -3 ? "BEARISH" : "NEUTRAL";

    // ── Scoring 1H ───────────────────────────────────────────────────────────
    let bull = 0, bear = 0;
    const indicators = [];

    // RSI 1H — umbrales estrictos
    if      (rsi1h < 30) { bull += 3; indicators.push(`RSI1H ${rsi1h.toFixed(0)} sobrevendido`); }
    else if (rsi1h < 42) { bull += 2; indicators.push(`RSI1H ${rsi1h.toFixed(0)} bajo`); }
    else if (rsi1h > 70) { bear += 3; indicators.push(`RSI1H ${rsi1h.toFixed(0)} sobrecomprado`); }
    else if (rsi1h > 58) { bear += 2; indicators.push(`RSI1H ${rsi1h.toFixed(0)} alto`); }

    // MACD 1H — crossover vale más
    if      (macd1h.histogram > 0 && macd1h.prev_histogram <= 0) { bull += 4; indicators.push("MACD1H cruce alcista ▲"); }
    else if (macd1h.histogram > 0)                                { bull += 1; indicators.push("MACD1H positivo"); }
    else if (macd1h.histogram < 0 && macd1h.prev_histogram >= 0) { bear += 4; indicators.push("MACD1H cruce bajista ▼"); }
    else if (macd1h.histogram < 0)                                { bear += 1; indicators.push("MACD1H negativo"); }

    // EMA 1H — precio vs EMA20 y EMA50
    if      (price > ema20_1h_v && ema20_1h_v > ema50_1h_v) { bull += 2; indicators.push("EMA20 > EMA50 ▲"); }
    else if (price < ema20_1h_v && ema20_1h_v < ema50_1h_v) { bear += 2; indicators.push("EMA20 < EMA50 ▼"); }
    else if (price > ema20_1h_v) { bull += 1; indicators.push("Precio > EMA20"); }
    else if (price < ema20_1h_v) { bear += 1; indicators.push("Precio < EMA20"); }

    // Estructura 1H
    if      (struct1h === "BULLISH") { bull += 2; indicators.push("Estructura 1H alcista HH/HL"); }
    else if (struct1h === "BEARISH") { bear += 2; indicators.push("Estructura 1H bajista LH/LL"); }

    // Volumen spike
    if (volSpike > 2.0) indicators.push(`Vol ×${volSpike.toFixed(1)} spike`);

    // ── Filtro HTF — no operar contra el bias del 4H ──────────────────────────
    const direction = bull >= bear ? "LONG" : "SHORT";
    if (direction === "LONG"  && htfBias === "BEARISH") return null;
    if (direction === "SHORT" && htfBias === "BULLISH") return null;

    // HTF confirmación suma puntos
    if (direction === "LONG"  && htfBias === "BULLISH") bull += 2;
    if (direction === "SHORT" && htfBias === "BEARISH") bear += 2;

    const score = Math.max(bull, bear);

    // ── Score mínimo estricto ─────────────────────────────────────────────────
    if (score < 6) return null;

    // ── TP/SL dinámico basado en ATR ──────────────────────────────────────────
    const atrBlend   = atr1h * 0.6 + (atr4h / 4) * 0.4;
    let tp1, tp2, sl;
    if (direction === "LONG") {
      tp1 = price + atrBlend * 1.5;
      tp2 = price + atrBlend * 3.0;
      sl  = price - atrBlend * 1.0;
    } else {
      tp1 = price - atrBlend * 1.5;
      tp2 = price - atrBlend * 3.0;
      sl  = price + atrBlend * 1.0;
    }

    const reward = Math.abs(tp1 - price);
    const risk   = Math.abs(price - sl);
    const rr     = risk > 0 ? (reward / risk).toFixed(2) : "N/A";

    const fmt = v =>
      v < 0.0001 ? v.toFixed(8) :
      v < 0.01   ? v.toFixed(6) :
      v < 1      ? v.toFixed(4) :
      v < 100    ? v.toFixed(3) : v.toFixed(2);

    const strength      = score >= 9 ? "FUERTE" : "MODERADO";
    const strengthColor = score >= 9 ? "#00e676" : "#ffd700";

    const change1h = closes1h.length >= 2
      ? ((closes1h[closes1h.length - 1] - closes1h[closes1h.length - 2]) / closes1h[closes1h.length - 2]) * 100
      : 0;

    const macdCross = (macd1h.histogram > 0 && macd1h.prev_histogram <= 0) ||
                      (macd1h.histogram < 0 && macd1h.prev_histogram >= 0);

    return {
      symbol:        meta.symbol,
      name:          meta.name,
      icon:          meta.icon,
      color:         meta.color,
      direction,
      strength,
      strengthColor,
      entry:         fmt(price),
      tp1:           fmt(tp1),
      tp2:           fmt(tp2),
      sl:            fmt(sl),
      rr:            `1:${rr}`,
      rsi1h:         parseFloat(rsi1h.toFixed(1)),
      rsi4h:         parseFloat(rsi4h.toFixed(1)),
      macdHistogram: parseFloat(macd1h.histogram.toFixed(6)),
      macdCross,
      volumeSpike:   parseFloat(volSpike.toFixed(2)),
      atr1h:         parseFloat(atr1h.toFixed(6)),
      htfBias,
      struct1h,
      struct4h,
      indicators,
      score,
      change1h:      parseFloat(change1h.toFixed(2)),
    };

  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// BATCH — 10 en paralelo con delay entre lotes
// ══════════════════════════════════════════════════════════════════════════════

async function batchAnalyse(symbols, batchSize = 10, delayMs = 600) {
  const results = [];
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch   = symbols.slice(i, i + batchSize);
    const settled = await Promise.allSettled(batch.map(analyseSymbol));
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value !== null) results.push(r.value);
    }
    if (i + batchSize < symbols.length)
      await new Promise(res => setTimeout(res, delayMs));
  }
  return results;
}

// ══════════════════════════════════════════════════════════════════════════════
// CACHE — 5 minutos
// ══════════════════════════════════════════════════════════════════════════════

let cache = null;
const CACHE_TTL = 5 * 60 * 1000;

// ══════════════════════════════════════════════════════════════════════════════
// RUTAS
// ══════════════════════════════════════════════════════════════════════════════

app.get("/healthz", (_req, res) => res.json({ ok: true, version: "2.0", exchanges: ["OKX", "Bybit"] }));

app.get("/api/altcoin-signals", async (_req, res) => {
  if (cache && Date.now() - cache.at < CACHE_TTL) {
    return res.setHeader("X-Cache", "HIT").json({
      signals:      cache.signals,
      cachedAt:     new Date(cache.at).toISOString(),
      weekOf:       WEEK_OF,
      totalScanned: SYMBOLS.length,
      source:       "real_ta_v2",
    });
  }

  try {
    const all     = await batchAnalyse(SYMBOLS);
    const signals = all
      .sort((a, b) => b.score - a.score || Math.abs(b.change1h) - Math.abs(a.change1h))
      .slice(0, 20);

    cache = { signals, at: Date.now() };

    res.setHeader("X-Cache", "MISS").json({
      signals,
      cachedAt:     new Date().toISOString(),
      weekOf:       WEEK_OF,
      totalScanned: SYMBOLS.length,
      source:       "real_ta_v2",
    });
  } catch (err) {
    res.status(502).json({ error: "Error al calcular señales", detail: String(err) });
  }
});

app.listen(PORT, () => console.log(`PSY Signals v2 · OKX+Bybit · port ${PORT}`));
