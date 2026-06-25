import TelegramBot from "node-telegram-bot-api";
import { pool } from "@workspace/db";
import { logger } from "../lib/logger";
import { Router, type Request, type Response } from "express";

const router = Router();

// ─── Chat IDs ─────────────────────────────────────────────────────────────────
// Canal 1: signals-btc-eth-sol — bots: whale_intel + signals
// Canal 2: alcoins_signal      — bot: altcoins (Python, no poll aquí)
// Canal 3: pro                 — bots: exchange, whale_alert, degenscout, whale_gems, gem_hunter
// Canal 4: oracle_feeds        — bot: oracle
const CHAT_IDS = {
  signals: process.env["SIGNALS_CHAT_ID"]  ?? "-1003707106507",
  alcoins: process.env["ALCOINS_CHAT_ID"]  ?? "-1003702118104",
  pro:     process.env["PRO_CHAT_ID"]      ?? "-1003781020653",
  oracle:  process.env["ORACLE_CHAT_ID"]   ?? "-1003960792260",
};

// ─── Cache ────────────────────────────────────────────────────────────────────
const _cache = new Map<string, { data: unknown; exp: number }>();
function cGet<T>(key: string): T | null {
  const e = _cache.get(key);
  return e && Date.now() < e.exp ? (e.data as T) : null;
}
function cSet<T>(key: string, data: T, ttlMs: number): void {
  _cache.set(key, { data, exp: Date.now() + ttlMs });
}

// ─── Helper monetario ────────────────────────────────────────────────────────
function parseMoneyValue(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/[$,\s]/g, "");
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  if (clean.toUpperCase().endsWith("K")) return Math.round(parseFloat(clean) * 1_000);
  if (clean.toUpperCase().endsWith("M")) return Math.round(parseFloat(clean) * 1_000_000);
  if (clean.toUpperCase().endsWith("B")) return Math.round(parseFloat(clean) * 1_000_000_000);
  return Math.round(num);
}

// ─── DB SETUP ─────────────────────────────────────────────────────────────────
async function setupTables(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS whale_alerts_tg (
        id          SERIAL PRIMARY KEY,
        bot_source  VARCHAR(50),
        exchange    VARCHAR(50),
        coin        VARCHAR(20),
        pair        VARCHAR(30),
        clase       VARCHAR(80),
        rating      INTEGER,
        direccion   VARCHAR(10),
        tamano_usd  BIGINT,
        cantidad    DECIMAL(20,8),
        precio      DECIMAL(20,8),
        wallet      VARCHAR(200),
        upnl        BIGINT,
        cuenta_usd  BIGINT,
        posiciones  TEXT,
        mensaje     TEXT,
        raw_text    TEXT,
        ts          BIGINT NOT NULL,
        created_at  TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS gem_alerts_tg (
        id          SERIAL PRIMARY KEY,
        bot_source  VARCHAR(50),
        tipo        VARCHAR(30),
        symbol      VARCHAR(30),
        address     VARCHAR(200),
        chain       VARCHAR(20),
        hold_score  INTEGER,
        precio      DECIMAL(20,12),
        lp_usd      DECIMAL(20,2),
        fdv         DECIMAL(20,2),
        vol_1h      DECIMAL(20,2),
        cambio_1h   DECIMAL(10,2),
        cambio_24h  DECIMAL(10,2),
        buys_1h     INTEGER,
        sells_1h    INTEGER,
        edad_min    INTEGER,
        monto_usd   DECIMAL(20,2),
        lp_pool     DECIMAL(20,2),
        tx_url      TEXT,
        dex_url     TEXT,
        raw_text    TEXT,
        ts          BIGINT NOT NULL,
        created_at  TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS psy_signals_tg (
        id              SERIAL PRIMARY KEY,
        bot_source      VARCHAR(50),
        tier            VARCHAR(50),
        symbol          VARCHAR(30),
        timeframe       VARCHAR(10),
        tipo            VARCHAR(10),
        score           DECIMAL(5,2),
        confianza       VARCHAR(20),
        precio          DECIMAL(20,8),
        rsi             DECIMAL(6,2),
        ema_9           DECIMAL(20,8),
        ema_21          DECIMAL(20,8),
        ema_50          DECIMAL(20,8),
        ema_200         DECIMAL(20,8),
        cvd             DECIMAL(20,2),
        bb_b            DECIMAL(8,4),
        macd            DECIMAL(20,8),
        resistencia     DECIMAL(20,8),
        soporte         DECIMAL(20,8),
        score_tecnico   INTEGER,
        score_patron    INTEGER,
        score_sentiment INTEGER,
        win_rate        DECIMAL(5,1),
        retorno_prom    DECIMAL(8,2),
        raw_text        TEXT,
        ts              BIGINT NOT NULL,
        created_at      TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS exchange_alerts_tg (
        id          SERIAL PRIMARY KEY,
        bot_source  VARCHAR(50),
        exchange    VARCHAR(50),
        coin        VARCHAR(20),
        pair        VARCHAR(30),
        direccion   VARCHAR(10),
        clase       VARCHAR(80),
        rating      INTEGER,
        tamano_usd  BIGINT,
        cantidad    DECIMAL(20,8),
        precio      DECIMAL(20,8),
        mensaje     TEXT,
        raw_text    TEXT,
        ts          BIGINT NOT NULL,
        created_at  TIMESTAMP DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_psy_signals_tg_dedup
        ON psy_signals_tg (ts, symbol) WHERE symbol IS NOT NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_exchange_alerts_tg_dedup
        ON exchange_alerts_tg (ts, pair, exchange) WHERE pair IS NOT NULL;

      CREATE TABLE IF NOT EXISTS oracle_feeds_tg (
        id          SERIAL PRIMARY KEY,
        bot_source  VARCHAR(50),
        tipo        VARCHAR(50),
        coin        VARCHAR(20),
        precio      DECIMAL(20,8),
        valor       DECIMAL(20,4),
        etiqueta    VARCHAR(200),
        raw_text    TEXT,
        ts          BIGINT NOT NULL,
        created_at  TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_oracle_feeds_ts ON oracle_feeds_tg (ts DESC);
    `);
    logger.info("Telegram listener tables ready");
  } catch (err) {
    logger.warn({ err }, "setupTables error — continuing");
  } finally {
    client.release();
  }
}

// ─── PARSER 1: WhalePerp / WHALE ALERT ───────────────────────────────────────
// Ejemplo:
// 🦈 WhalePerp — PSYCHOMETRIKS / PSYCHOMETRIKS WHALE ALERT
// 0xecb63caa...c2b82b00
// Exchange: Hyperliquid
// Rating: A+ ⚡ · 70/100   Clase: 🦈 MEGALODÓN
// Cuenta: $29,078,041      uPnL actual: $+415,073
// 🟢 NUEVO LONG             ETH LONG 15x · $17,239,901
// Posiciones activas: ETH 15x $17M uPnL $+212K
async function parseWhaleAlert(text: string, ts: number, botSource: string): Promise<void> {
  try {
    const wallet    = text.match(/0x[a-fA-F0-9]+\.{3}[a-fA-F0-9]+/)?.[0] ?? null;
    const exchange  = text.match(/Exchange:\s*(\w+)/)?.[1]
                   ?? text.match(/(Hyperliquid|dYdX|OKX|Binance|Bybit|BitMEX)/i)?.[1]
                   ?? null;
    const rating    = parseInt(text.match(/(\d+)\/100/)?.[1] ?? "0");
    const clase     = text.match(/Clase:\s*[🦈🐋🐬🦭🐟]*\s*([A-ZÁÉÍÓÚÑ\s]+)/)?.[1]?.trim() ?? null;
    const cuenta    = parseInt((text.match(/Cuenta:\s*\$([0-9,]+)/)?.[1] ?? "0").replace(/,/g, ""));
    const upnl      = parseInt((text.match(/uPnL actual:\s*\$([+\-0-9,]+)/)?.[1] ?? "0").replace(/[+,]/g, ""));

    const isLong    = text.includes("NUEVO LONG") || (text.includes("🟢") && !text.includes("🔴 NUEVO"));
    const isShort   = text.includes("NUEVO SHORT") || text.includes("🔴 NUEVO");
    const direccion = isLong ? "LONG" : isShort ? "SHORT" : "NEUTRAL";

    const posMatch  = text.match(/([A-Z]+)\s+(LONG|SHORT)\s+(\d+)x\s*·?\s*\$([0-9,]+)/);
    const coin      = posMatch?.[1] ?? text.match(/([A-Z]{2,6})-?(USD|USDT|PERP)/)?.[1] ?? null;
    const tamano    = parseInt((posMatch?.[4] ?? "0").replace(/,/g, ""));

    const posicionesMatch = text.match(/Posiciones activas:([\s\S]*?)(?=⏰|$)/);
    const posiciones = posicionesMatch?.[1]?.trim() ?? null;

    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO whale_alerts_tg
          (bot_source, exchange, coin, clase, rating, direccion, tamano_usd,
           wallet, upnl, cuenta_usd, posiciones, raw_text, ts)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      `, [botSource, exchange, coin, clase, rating, direccion, tamano,
          wallet, upnl, cuenta, posiciones, text.slice(0, 2000), ts]);
      logger.info({ coin, direccion, tamano }, "Whale alert saved");
    } finally { client.release(); }
  } catch (err) {
    logger.warn({ err }, "parseWhaleAlert failed");
  }
}

// ─── PARSER 2: DegenScout gem nueva ──────────────────────────────────────────
// 🦅 DegenScout
// 🆕 NEW TOKEN SOLANA🟡 / GEM DETECTADA 🟡 BSC
// SYMBOL / NAME
// ADDRESS
// Hold Score: 65/100 — 🟢 POTENCIAL
// Precio: $0.00030   LP: $65.2K   FDV: $246.4K
// Vol 1h: $35.0K   Δ 1h/24h: +137.0% / +137.0%
// Buys/Sells 1h: 40/13   Edad: 3m
async function parseDegenScoutGem(text: string, ts: number): Promise<void> {
  try {
    const isNew = text.includes("NEW TOKEN") || text.includes("GEM DETECTADA");
    if (!isNew) return;

    const chain     = text.includes("SOLANA") ? "solana"
                    : text.includes("BSC") || text.includes("pancakeswap") ? "bsc"
                    : text.includes("ETH") ? "ethereum" : "unknown";
    const holdScore = parseInt(text.match(/Hold Score:\s*(\d+)\/100/)?.[1] ?? "0");
    const precio    = parseFloat(text.match(/Precio:\s*\$([0-9.]+)/)?.[1] ?? "0");
    const lp        = parseMoneyValue(text.match(/LP:\s*\$([0-9.KMBkmb]+)/)?.[1] ?? "0");
    const fdv       = parseMoneyValue(text.match(/FDV:\s*\$([0-9.KMBkmb]+)/)?.[1] ?? "0");
    const vol1h     = parseMoneyValue(text.match(/Vol 1h:\s*\$([0-9.KMBkmb]+)/)?.[1] ?? "0");
    const cambio1h  = parseFloat(text.match(/[△Δ]\s*1h(?:\/24h)?:\s*([+\-0-9.]+)%/)?.[1] ?? "0");
    const cambio24h = parseFloat(text.match(/[△Δ]\s*1h\/24h:[^\/]+\/\s*([+\-0-9.]+)%/)?.[1] ?? "0");
    const buys      = parseInt(text.match(/Buys\/Sells 1h:\s*(\d+)\/\d+/)?.[1] ?? "0");
    const sells     = parseInt(text.match(/Buys\/Sells 1h:\s*\d+\/(\d+)/)?.[1] ?? "0");
    const edadM     = text.match(/Edad:\s*(\d+)([mhd])/);
    const edad      = edadM ? (edadM[2] === "m" ? parseInt(edadM[1]) : edadM[2] === "h" ? parseInt(edadM[1]) * 60 : parseInt(edadM[1]) * 1440) : 0;

    const address   = text.match(/0x[a-fA-F0-9]{40}/)?.[0]
                   ?? text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/)?.[0]
                   ?? null;

    const lines     = text.split("\n").map(l => l.trim()).filter(Boolean);
    const tokenIdx  = lines.findIndex(l => l.includes("NEW TOKEN") || l.includes("GEM DETECTADA"));
    const symbol    = lines[tokenIdx + 1]?.split("/")?.[0]?.trim() ?? null;

    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO gem_alerts_tg
          (bot_source, tipo, symbol, address, chain, hold_score, precio,
           lp_usd, fdv, vol_1h, cambio_1h, cambio_24h, buys_1h, sells_1h, edad_min, raw_text, ts)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      `, ["degenscout", "new_gem", symbol, address, chain, holdScore, precio,
          lp, fdv, vol1h, cambio1h, cambio24h, buys, sells, edad, text.slice(0, 2000), ts]);
      logger.info({ symbol, chain, holdScore }, "Gem alert saved");
    } finally { client.release(); }
  } catch (err) {
    logger.warn({ err }, "parseDegenScoutGem failed");
  }
}

// ─── PARSER 3: DegenScout whale buy/sell ─────────────────────────────────────
// 🦅 DegenScout
// 🔴 WHALE VENTA SOLANA / 🟢 WHALE COMPRA SOLANA
// SYMBOL / CHAIN
// Monto: $24.7K   LP del pool: $3.87M
// Ver tx · Dexscreener
async function parseDegenScoutWhale(text: string, ts: number): Promise<void> {
  try {
    const isWhale = text.includes("WHALE VENTA") || text.includes("WHALE COMPRA");
    if (!isWhale) return;

    const tipo   = text.includes("WHALE VENTA") ? "whale_sell" : "whale_buy";
    const chain  = text.includes("SOLANA") ? "solana"
                 : text.includes("ETH") ? "ethereum" : "bsc";
    const monto  = parseMoneyValue(text.match(/Monto:\s*\$([0-9.KMBkmb]+)/)?.[1] ?? "0");
    const lpPool = parseMoneyValue(text.match(/LP del pool:\s*\$([0-9.KMBkmb]+)/)?.[1] ?? "0");
    const txUrl  = text.match(/Ver tx[:\s]*(https?:\/\/\S+)/)?.[1] ?? null;
    const dexUrl = text.match(/Dexscreener[:\s]*(https?:\/\/\S+)/)?.[1] ?? null;

    const lines    = text.split("\n").map(l => l.trim()).filter(Boolean);
    const whaleIdx = lines.findIndex(l => l.includes("WHALE VENTA") || l.includes("WHALE COMPRA"));
    const symbol   = lines[whaleIdx + 1]?.split("/")?.[0]?.trim() ?? null;

    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO gem_alerts_tg
          (bot_source, tipo, symbol, chain, monto_usd, lp_pool, tx_url, dex_url, raw_text, ts)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      `, ["degenscout", tipo, symbol, chain, monto, lpPool, txUrl, dexUrl, text.slice(0, 2000), ts]);
      logger.info({ symbol, tipo, monto }, "DegenScout whale saved");
    } finally { client.release(); }
  } catch (err) {
    logger.warn({ err }, "parseDegenScoutWhale failed");
  }
}

// ─── PARSER 4: Señales PSY altcoins ──────────────────────────────────────────
// TIER 3 — Meme Coin / TIER 4 — Trending 2026
// 🚀 SEÑAL PSY — EIGENUSDT 4H
// 📈 COMPRA / 📉 VENTA
// Score: 61.8/100 | 🟢 ALTA
// Precio: 0.212700 USDT   RSI(14): 49.89
// EMA 9/21: 0.2141 / 0.2141   EMA 50/200: 0.2869 / 0.1899
// CVD: -45,476   BB %B: 0.38
// R: 0.234900 (+10.44%)   S: 0.203200 (-4.47%)
// Técnico: 33 | Patrón: 58 | Sentiment: 50
// Win Rate: 83.3% (histórico 30 casos)   Retorno promedio: +1.53%
async function parsePsySignal(text: string, ts: number): Promise<void> {
  try {
    const hasSignal = text.includes("SEÑAL PSY") || text.includes("PSY Engine");
    if (!hasSignal) return;

    const tierMatch = text.match(/TIER\s*(\d+)\s*[—\-–]\s*([^\n]+)/);
    const tier      = tierMatch ? `TIER ${tierMatch[1]} — ${tierMatch[2].trim()}` : null;

    const symMatch  = text.match(/SEÑAL PSY\s*[—\-–]\s*([\w]+(?:USDT|USD|BTC)?)\s+(\w+)/);
    const symbol    = symMatch?.[1] ?? null;
    const timeframe = symMatch?.[2] ?? null;

    const tipo = text.includes("📈") || text.includes("COMPRA") ? "COMPRA"
               : text.includes("📉") || text.includes("VENTA")  ? "VENTA" : null;

    const scoreMatch = text.match(/Score(?:\s+Final)?:\s*([\d.]+)\s*\/\s*100/);
    const score      = parseFloat(scoreMatch?.[1] ?? "0");
    const confianza  = text.match(/Confianza:\s*(ALTA|MEDIA|BAJA)/)?.[1] ?? null;
    const precio     = parseFloat(text.match(/Precio:\s*([\d.]+)/)?.[1] ?? "0");
    const rsi        = parseFloat(text.match(/RSI\(\d+\):\s*([\d.]+)/)?.[1] ?? "0");

    const ema921 = text.match(/EMA 9\/21:\s*([\d.]+)\s*\/\s*([\d.]+)/);
    const ema9   = parseFloat(ema921?.[1] ?? "0");
    const ema21  = parseFloat(ema921?.[2] ?? "0");

    const ema5200 = text.match(/EMA 50\/200:\s*([\d.]+)\s*\/\s*([\d.]+)/);
    const ema50   = parseFloat(ema5200?.[1] ?? "0");
    const ema200  = parseFloat(ema5200?.[2] ?? "0");

    const cvd        = parseFloat((text.match(/CVD:\s*([+\-0-9,]+)/)?.[1] ?? "0").replace(/,/g, ""));
    const bbB        = parseFloat(text.match(/BB %B:\s*([\d.]+)/)?.[1] ?? "0");
    const macd       = parseFloat(text.match(/MACD[^:]*:\s*([+\-0-9.]+)/)?.[1] ?? "0");
    const resistencia = parseFloat(text.match(/R:\s*([\d.]+)/)?.[1] ?? "0");
    const soporte    = parseFloat(text.match(/S:\s*([\d.]+)/)?.[1] ?? "0");
    const stec       = parseInt(text.match(/Técnico:\s*(\d+)/)?.[1] ?? "0");
    const spat       = parseInt(text.match(/Patrón:\s*(\d+)/)?.[1] ?? "0");
    const ssent      = parseInt(text.match(/Sentiment:\s*(\d+)/)?.[1] ?? "0");
    const winRate    = parseFloat(text.match(/Win Rate:\s*([\d.]+)%/)?.[1] ?? "0");
    const retorno    = parseFloat(text.match(/Retorno promedio:\s*([+\-0-9.]+)%/)?.[1] ?? "0");

    if (!symbol || !tipo) return;

    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO psy_signals_tg
          (bot_source, tier, symbol, timeframe, tipo, score, confianza, precio,
           rsi, ema_9, ema_21, ema_50, ema_200, cvd, bb_b, macd,
           resistencia, soporte, score_tecnico, score_patron, score_sentiment,
           win_rate, retorno_prom, raw_text, ts)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
        ON CONFLICT (ts, symbol) DO NOTHING
      `, ["psy-engine", tier, symbol, timeframe, tipo, score, confianza, precio,
          rsi, ema9, ema21, ema50, ema200, cvd, bbB, macd,
          resistencia, soporte, stec, spat, ssent,
          winRate, retorno, text.slice(0, 3000), ts]);
      logger.info({ symbol, tipo, score, confianza }, "PSY signal saved");
    } finally { client.release(); }
  } catch (err) {
    logger.warn({ err }, "parsePsySignal failed");
  }
}

// ─── PARSER 5: Exchange alert (WhalePerp canal pro) ──────────────────────────
// 🦈 WhalePerp — PSYCHOMETRIKS / WHALE ALERT
// dYdX v4 · COSMOS · ETH-USD
// Clase: PEZ GRANDE · Rating: 30/100
// 🟢 Dirección: LONG
// Tamaño: $250.5K   Cantidad: 109.9580 ETH   Precio: $2,277.80
async function parseExchangeAlert(text: string, ts: number): Promise<void> {
  try {
    const hasAlert = text.includes("WHALE ALERT") &&
      (text.includes("dYdX") || text.includes("OKX") ||
       text.includes("Binance") || text.includes("Bybit") ||
       text.includes("Tamaño:"));
    if (!hasAlert) return;

    const exchange  = text.match(/(dYdX v4|OKX|Binance|Bybit|BitMEX|Hyperliquid)/i)?.[1] ?? null;
    const pair      = text.match(/([A-Z]+-[A-Z]+)/)?.[1] ?? null;
    const coin      = pair?.split("-")?.[0] ?? null;
    const clase     = text.match(/Clase:\s*([A-ZÁÉÍÓÚÑ\s]+?)(?:\s*·|\n)/)?.[1]?.trim() ?? null;
    const rating    = parseInt(text.match(/Rating:\s*(\d+)\/100/)?.[1] ?? "0");
    const direccion = text.includes("🟢") || text.match(/Dirección:\s*LONG/) ? "LONG"
                    : text.includes("🔴") || text.match(/Dirección:\s*SHORT/) ? "SHORT" : "NEUTRAL";
    const tamano    = parseMoneyValue(text.match(/Tamaño:\s*\$([0-9.KMBkmb]+)/)?.[1] ?? "0");
    const cantidad  = parseFloat(text.match(/Cantidad:\s*([\d.]+)/)?.[1] ?? "0");
    const precio    = parseFloat((text.match(/Precio:\s*\$([\d,]+\.?\d*)/)?.[1] ?? "0").replace(/,/g, ""));
    const mensaje   = text.match(/💡\s*(.+)/)?.[1] ?? null;

    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO exchange_alerts_tg
          (bot_source, exchange, coin, pair, clase, rating, direccion,
           tamano_usd, cantidad, precio, mensaje, raw_text, ts)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (ts, pair, exchange) DO NOTHING
      `, ["whaleperp", exchange, coin, pair, clase, rating, direccion,
          tamano, cantidad, precio, mensaje, text.slice(0, 2000), ts]);
      logger.info({ coin, exchange, direccion, tamano }, "Exchange alert saved");
    } finally { client.release(); }
  } catch (err) {
    logger.warn({ err }, "parseExchangeAlert failed");
  }
}

// ─── PARSER 6: Oracle Feeds ──────────────────────────────────────────────────
async function parseOracleFeed(text: string, ts: number): Promise<void> {
  try {
    // Intentar extraer coin, precio y etiqueta genérica
    const coin     = text.match(/\b(BTC|ETH|SOL|XRP|BNB|DOGE|AVAX|LINK|DOT|ADA|MATIC|ARB|OP)\b/i)?.[1]?.toUpperCase() ?? null;
    const precio   = parseFloat(text.match(/\$?([\d,]+\.?\d*)/)?.[1]?.replace(/,/g,"") ?? "0") || null;
    const etiqueta = text.split("\n")[0]?.trim().slice(0, 200) ?? null;
    const tipo     = text.includes("SEÑAL") || text.includes("SIGNAL") ? "signal"
                   : text.includes("PRECIO") || text.includes("PRICE")  ? "price"
                   : text.includes("ALERTA") || text.includes("ALERT")  ? "alert"
                   : "feed";

    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO oracle_feeds_tg (bot_source, tipo, coin, precio, etiqueta, raw_text, ts)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `, ["oracle", tipo, coin, precio, etiqueta, text.slice(0, 3000), ts]);
      logger.info({ coin, tipo, etiqueta }, "Oracle feed saved");
    } finally { client.release(); }
  } catch (err) {
    logger.warn({ err }, "parseOracleFeed failed");
  }
}

// ─── Router de mensajes ───────────────────────────────────────────────────────
async function routeMessage(chatId: string, text: string, ts: number): Promise<void> {
  if (!text || text.length < 10) return;
  logger.debug({ chatId, preview: text.slice(0, 80) }, "Telegram message");

  // Canal 1: signals-btc-eth-sol
  if (chatId === CHAT_IDS.signals) {
    if (text.includes("WHALE ALERT") || text.includes("WhalePerp")) {
      await parseWhaleAlert(text, ts, "whale-intel");
    }
    if (text.includes("SEÑAL PSY") || text.includes("PSY Engine")) {
      await parsePsySignal(text, ts);
    }
  }

  // Canal 2: alcoins_signal
  if (chatId === CHAT_IDS.alcoins) {
    if (text.includes("SEÑAL PSY") || text.includes("PSY Engine") || text.includes("TIER")) {
      await parsePsySignal(text, ts);
    }
  }

  // Canal 3: PSYCHOMETRIKS pro
  if (chatId === CHAT_IDS.pro) {
    if (text.includes("WhalePerp") || text.includes("PSYCHOMETRIKS WHALE ALERT")) {
      await parseWhaleAlert(text, ts, "whaleperp");
      await parseExchangeAlert(text, ts);
    }
    if (text.includes("DegenScout")) {
      if (text.includes("WHALE VENTA") || text.includes("WHALE COMPRA")) {
        await parseDegenScoutWhale(text, ts);
      } else if (text.includes("NEW TOKEN") || text.includes("GEM DETECTADA")) {
        await parseDegenScoutGem(text, ts);
      }
    }
  }

  // Canal 4: ORACLE FEEDS
  if (chatId === CHAT_IDS.oracle) {
    await parseOracleFeed(text, ts);
  }
}

// ─── Iniciar bots ─────────────────────────────────────────────────────────────
let listenersStarted = false;

function startSingleBot(token: string, name: string): void {
  const bot = new TelegramBot(token, { polling: false });

  const handleMsg = async (msg: TelegramBot.Message) => {
    const chatId = String(msg.chat.id);
    const text   = msg.text ?? msg.caption ?? "";
    await routeMessage(chatId, text, msg.date * 1000).catch(e =>
      logger.warn({ err: e }, "routeMessage error"),
    );
  };

  bot.on("message",      handleMsg);
  bot.on("channel_post", handleMsg);

  bot.on("polling_error", (err) => {
    const msg = (err as Error).message ?? "";
    if (msg.includes("409")) {
      logger.warn({ bot: name }, "409 Conflict — otro proceso usa este token, deteniendo polling de este bot");
      bot.stopPolling().catch(() => {/* ignore */});
    } else {
      logger.warn({ err: msg, bot: name }, "Polling error");
    }
  });

  bot.deleteWebHook()
    .then(() => bot.startPolling())
    .then(() => logger.info({ bot: name }, "Telegram bot started"))
    .catch((err: unknown) => logger.warn({ err: String(err), bot: name }, "Failed to start bot"));
}

export async function startTelegramListener(): Promise<void> {
  if (listenersStarted) return;

  await setupTables();

  // ADMIN_BOT_TOKEN = bot dedicado solo-escucha (no envía mensajes a ningún canal).
  // Usar UN solo bot evita conflictos 409 cuando otros bots del mismo token envían
  // mensajes (un bot no recibe sus propios mensajes via getUpdates).
  // Si no hay ADMIN_BOT_TOKEN, se usa cada bot individual como fallback.
  const adminToken = process.env["ADMIN_BOT_TOKEN"];

  if (adminToken) {
    listenersStarted = true;
    startSingleBot(adminToken, "admin-listener");
    logger.info("Telegram listener: usando ADMIN_BOT_TOKEN como bot dedicado");
    return;
  }

  // Fallback: bots individuales (pueden tener 409 si también envían mensajes)
  const tokens = [
    { token: process.env["WHALE_BOT_TOKEN"],                                           name: "whale-bot"    },
    { token: process.env["SIGNALS_BOT_TOKEN"],                                         name: "signals-bot"  },
    { token: process.env["WHALEPERP_BOT_TOKEN"] || process.env["WHALPERP_BOT_TOKEN"], name: "whaleperp-bot" },
    { token: process.env["ORACLE_BOT_TOKEN"],                                          name: "oracle-bot"   },
  ].filter((b): b is { token: string; name: string } => !!b.token);

  if (tokens.length === 0) {
    logger.warn("No Telegram bot tokens configured — listener disabled");
    return;
  }

  listenersStarted = true;
  for (const { token, name } of tokens) {
    startSingleBot(token, name);
  }
}

// ─── GET /api/telegram/whale-alerts (backward compat) ────────────────────────
router.get("/telegram/whale-alerts", async (req: Request, res: Response) => {
  const cached = cGet<unknown[]>("tg_wa_compat");
  if (cached) { res.json({ ok: true, alerts: cached }); return; }
  const client = await pool.connect();
  try {
    const r = await client.query("SELECT * FROM whale_alerts_tg ORDER BY ts DESC LIMIT 50");
    cSet("tg_wa_compat", r.rows, 15_000);
    res.json({ ok: true, alerts: r.rows });
  } catch { res.json({ ok: true, alerts: [] }); }
  finally { client.release(); }
});

// ─── GET /api/telegram/psy-signals (backward compat) ─────────────────────────
router.get("/telegram/psy-signals", async (req: Request, res: Response) => {
  const cached = cGet<unknown[]>("tg_ps_compat");
  if (cached) { res.json({ ok: true, signals: cached }); return; }
  const client = await pool.connect();
  try {
    const r = await client.query("SELECT * FROM psy_signals_tg ORDER BY ts DESC LIMIT 60");
    cSet("tg_ps_compat", r.rows, 15_000);
    res.json({ ok: true, signals: r.rows });
  } catch { res.json({ ok: true, signals: [] }); }
  finally { client.release(); }
});

// ─── GET /api/telegram/gem-alerts (backward compat) ──────────────────────────
router.get("/telegram/gem-alerts", async (req: Request, res: Response) => {
  const cached = cGet<unknown[]>("tg_ga_compat");
  if (cached) { res.json({ ok: true, gems: cached }); return; }
  const client = await pool.connect();
  try {
    const r = await client.query("SELECT * FROM gem_alerts_tg ORDER BY ts DESC LIMIT 40");
    cSet("tg_ga_compat", r.rows, 15_000);
    res.json({ ok: true, gems: r.rows });
  } catch { res.json({ ok: true, gems: [] }); }
  finally { client.release(); }
});

// ─── GET /api/telegram/oracle-feeds ──────────────────────────────────────────
router.get("/telegram/oracle-feeds", async (_req: Request, res: Response) => {
  const cached = cGet<unknown[]>("tg_oracle");
  if (cached) { res.json({ ok: true, feeds: cached }); return; }
  const client = await pool.connect();
  try {
    const r = await client.query("SELECT * FROM oracle_feeds_tg ORDER BY ts DESC LIMIT 60");
    cSet("tg_oracle", r.rows, 15_000);
    res.json({ ok: true, feeds: r.rows });
  } catch { res.json({ ok: true, feeds: [] }); }
  finally { client.release(); }
});

// ─── GET /api/telegram/stats ──────────────────────────────────────────────────
router.get("/telegram/stats", async (_req: Request, res: Response) => {
  const cached = cGet<unknown>("tg_stats");
  if (cached) { res.json(cached); return; }
  const client = await pool.connect();
  try {
    const since = Date.now() - 86_400_000;
    const [w, s, g, e, o] = await Promise.all([
      client.query("SELECT COUNT(*) FROM whale_alerts_tg WHERE ts > $1", [since]),
      client.query("SELECT COUNT(*) FROM psy_signals_tg WHERE ts > $1", [since]),
      client.query("SELECT COUNT(*) FROM gem_alerts_tg WHERE ts > $1", [since]),
      client.query("SELECT COUNT(*) FROM exchange_alerts_tg WHERE ts > $1", [since]),
      client.query("SELECT COUNT(*) FROM oracle_feeds_tg WHERE ts > $1", [since]),
    ]);
    const stats = {
      ok: true,
      whales_24h:    parseInt(String(w.rows[0]?.count ?? "0")),
      signals_24h:   parseInt(String(s.rows[0]?.count ?? "0")),
      gems_24h:      parseInt(String(g.rows[0]?.count ?? "0")),
      exchanges_24h: parseInt(String(e.rows[0]?.count ?? "0")),
      oracle_24h:    parseInt(String(o.rows[0]?.count ?? "0")),
      ultima_actualizacion: new Date().toISOString(),
    };
    cSet("tg_stats", stats, 15_000);
    res.json(stats);
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  } finally { client.release(); }
});

export default router;
