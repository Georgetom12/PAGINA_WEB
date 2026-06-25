# PROMPT COMPLETO PARA REPLIT — PSYCHOMETRIKS WHALE INTEL
# Pega esto COMPLETO en Replit AI

---

## CONTEXTO REAL DEL SISTEMA

Tengo un monorepo con:
- Frontend: `artifacts/psychometriks/src/pages/whale-alert.tsx`
- Backend: `artifacts/api-server/src/routes/`
- URL API producción: `api.psychometriks.trade`
- Deploy: Railway (backend) + Cloudflare Pages (frontend)

## CANALES Y BOTS REALES:

### CANAL 1: "Psychometriks - signals-btc-eth-sol"
- Chat ID: -1003707106507
- Bot 1: @psychometriks_whale_bot → variable: WHALE_BOT_TOKEN
- Bot 2: @Psychometriks_signals_bot → variable: SIGNALS_BOT_TOKEN
- Publica: Whale alerts con wallet real + señales BTC/ETH/SOL

### CANAL 2: "Psychometriks_alcoins_signal"  
- Chat ID: -1003702118104
- Bot: @signals_altcoins_bot → variable: ALTCOINS_BOT_TOKEN
- Publica: Señales PSY altcoins con Score/RSI/CVD/TP/SL

### CANAL 3: "PSYCHOMETRIKS pro"
- Chat ID: -1003781020653
- Bots: Exchanges_alert, WHALE_ALERT, SmartMoneyRadar, 
        PSYCHOMETRIKS WHALE GEMS, PSYCHOMETRIKS Gem Hunter
- Bot principal: WHALEPERP_BOT_TOKEN
- Publica: WhalePerp alerts + DegenScout gems + Exchange signals

---

## TAREA 1 — CREAR: `artifacts/api-server/src/routes/telegram-listener.ts`

```typescript
import TelegramBot from 'node-telegram-bot-api';
import { pool } from '@workspace/db';
import { logger } from '../lib/logger';

// ─── Chat IDs ────────────────────────────────────────────────────────────────
const CHAT_IDS = {
  signals:  process.env.SIGNALS_CHAT_ID  || '-1003707106507',
  alcoins:  process.env.ALCOINS_CHAT_ID  || '-1003702118104',
  pro:      process.env.PRO_CHAT_ID      || '-1003781020653',
};

// ─── DB Setup ─────────────────────────────────────────────────────────────────
async function setupTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS whale_alerts_tg (
        id SERIAL PRIMARY KEY,
        bot_source VARCHAR(50),
        exchange VARCHAR(50),
        coin VARCHAR(20),
        pair VARCHAR(30),
        clase VARCHAR(50),
        rating INTEGER,
        direccion VARCHAR(10),
        tamano_usd BIGINT,
        cantidad DECIMAL(20,8),
        precio DECIMAL(20,8),
        wallet VARCHAR(200),
        upnl BIGINT,
        cuenta_usd BIGINT,
        posiciones TEXT,
        mensaje TEXT,
        raw_text TEXT,
        ts BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS gem_alerts_tg (
        id SERIAL PRIMARY KEY,
        bot_source VARCHAR(50),
        tipo VARCHAR(30),
        symbol VARCHAR(30),
        address VARCHAR(200),
        chain VARCHAR(20),
        hold_score INTEGER,
        precio DECIMAL(20,12),
        lp_usd DECIMAL(20,2),
        fdv DECIMAL(20,2),
        vol_1h DECIMAL(20,2),
        cambio_1h DECIMAL(10,2),
        cambio_24h DECIMAL(10,2),
        buys_1h INTEGER,
        sells_1h INTEGER,
        edad_min INTEGER,
        monto_usd DECIMAL(20,2),
        lp_pool DECIMAL(20,2),
        tx_url TEXT,
        dex_url TEXT,
        raw_text TEXT,
        ts BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS psy_signals_tg (
        id SERIAL PRIMARY KEY,
        bot_source VARCHAR(50),
        tier VARCHAR(30),
        symbol VARCHAR(30),
        timeframe VARCHAR(10),
        tipo VARCHAR(10),
        score DECIMAL(5,2),
        confianza VARCHAR(20),
        precio DECIMAL(20,8),
        rsi DECIMAL(6,2),
        ema_9 DECIMAL(20,8),
        ema_21 DECIMAL(20,8),
        ema_50 DECIMAL(20,8),
        ema_200 DECIMAL(20,8),
        cvd DECIMAL(20,2),
        bb_b DECIMAL(8,4),
        macd DECIMAL(20,8),
        resistencia DECIMAL(20,8),
        soporte DECIMAL(20,8),
        score_tecnico INTEGER,
        score_patron INTEGER,
        score_sentiment INTEGER,
        win_rate DECIMAL(5,1),
        retorno_prom DECIMAL(8,2),
        raw_text TEXT,
        ts BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS exchange_alerts_tg (
        id SERIAL PRIMARY KEY,
        bot_source VARCHAR(50),
        exchange VARCHAR(50),
        coin VARCHAR(20),
        pair VARCHAR(30),
        direccion VARCHAR(10),
        clase VARCHAR(50),
        rating INTEGER,
        tamano_usd BIGINT,
        cantidad DECIMAL(20,8),
        precio DECIMAL(20,8),
        mensaje TEXT,
        raw_text TEXT,
        ts BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    logger.info('Telegram listener tables ready');
  } finally {
    client.release();
  }
}

// ─── PARSERS ──────────────────────────────────────────────────────────────────

// Parser 1: WhalePerp / WHALE ALERT
// Formato:
// 🦈 WhalePerp — PSYCHOMETRIKS / PSYCHOMETRIKS WHALE ALERT
// 0xecb63caa...c2b82b00
// Exchange: Hyperliquid
// Rating: A+ ⚡ · 70/100
// Clase: 🦈 MEGALODÓN
// Cuenta: $29,078,041
// uPnL actual: $+415,073
// 🟢 NUEVO LONG / 🔴 NUEVO SHORT / CIERRE LONG
// ETH LONG 15x · $17,239,901
// Posiciones activas: ETH 15x $17M uPnL $+212K ...
async function parseWhaleAlert(text: string, ts: number, botSource: string) {
  try {
    const wallet = text.match(/0x[a-fA-F0-9]+\.{3}[a-fA-F0-9]+/)?.[0] || null;
    const exchange = text.match(/Exchange:\s*(\w+)/)?.[1] || 
                     text.match(/(Hyperliquid|dYdX|OKX|Binance|Bybit|BitMEX)/i)?.[1] || null;
    const rating = parseInt(text.match(/(\d+)\/100/)?.[1] || '0');
    const clase = text.match(/Clase:\s*[🦈🐋🐬🦭🐟]*\s*([A-ZÁÉÍÓÚÑ\s]+)/)?.[1]?.trim() || null;
    const cuenta = parseInt((text.match(/Cuenta:\s*\$([0-9,]+)/)?.[1] || '0').replace(/,/g, ''));
    const upnl = parseInt((text.match(/uPnL actual:\s*\$([+\-0-9,]+)/)?.[1] || '0').replace(/[+,]/g, ''));
    
    const isLong = text.includes('NUEVO LONG') || text.includes('🟢');
    const isShort = text.includes('NUEVO SHORT') || text.includes('🔴 NUEVO');
    const direccion = isLong ? 'LONG' : isShort ? 'SHORT' : 'NEUTRAL';

    // Parsear posicion principal
    const posMatch = text.match(/([A-Z]+)\s+(LONG|SHORT)\s+(\d+)x\s*·?\s*\$([0-9,]+)/);
    const coin = posMatch?.[1] || text.match(/([A-Z]{2,6})-?(USD|USDT|PERP)/)?.[1] || null;
    const tamano = parseInt((posMatch?.[4] || '0').replace(/,/g, ''));

    // Posiciones activas completas
    const posicionesMatch = text.match(/Posiciones activas:([\s\S]*?)(?=⏰|$)/);
    const posiciones = posicionesMatch?.[1]?.trim() || null;

    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO whale_alerts_tg 
        (bot_source, exchange, coin, clase, rating, direccion, tamano_usd, 
         wallet, upnl, cuenta_usd, posiciones, raw_text, ts)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      `, [botSource, exchange, coin, clase, rating, direccion, tamano,
          wallet, upnl, cuenta, posiciones, text.slice(0, 2000), ts]);
      logger.info({ coin, direccion, tamano }, 'Whale alert saved');
    } finally {
      client.release();
    }
  } catch (err) {
    logger.warn({ err }, 'parseWhaleAlert failed');
  }
}

// Parser 2: DegenScout gems nuevas
// Formato:
// 🦅 DegenScout
// 🆕 NEW TOKEN SOLANA🟡 / GEM DETECTADA 🟡 BSC
// SYMBOL / NAME
// ADDRESS
// Hold Score: 65/100 — 🟢 POTENCIAL
// Precio: $0.00030
// LP: $65.2K
// FDV: $246.4K
// Vol 1h: $35.0K
// Δ 1h/24h: +137.0% / +137.0%
// Buys/Sells 1h: 40/13
// Edad: 3m
async function parseDegenScoutGem(text: string, ts: number) {
  try {
    const isNew = text.includes('NEW TOKEN') || text.includes('GEM DETECTADA');
    if (!isNew) return;

    const chain = text.includes('SOLANA') ? 'solana' : 
                  text.includes('BSC') || text.includes('pancakeswap') ? 'bsc' : 
                  text.includes('ETH') ? 'ethereum' : 'unknown';
    
    const holdScore = parseInt(text.match(/Hold Score:\s*(\d+)\/100/)?.[1] || '0');
    const precio = parseFloat(text.match(/Precio:\s*\$([0-9.]+)/)?.[1] || '0');
    const lp = parseMoneyValue(text.match(/LP:\s*\$([0-9.KMB]+)/)?.[1] || '0');
    const fdv = parseMoneyValue(text.match(/FDV:\s*\$([0-9.KMB]+)/)?.[1] || '0');
    const vol1h = parseMoneyValue(text.match(/Vol 1h:\s*\$([0-9.KMB]+)/)?.[1] || '0');
    const cambio1h = parseFloat(text.match(/Δ 1h(?:\/24h)?:\s*([+\-0-9.]+)%/)?.[1] || '0');
    const buys = parseInt(text.match(/Buys\/Sells 1h:\s*(\d+)\/\d+/)?.[1] || '0');
    const sells = parseInt(text.match(/Buys\/Sells 1h:\s*\d+\/(\d+)/)?.[1] || '0');
    
    // Address (Solana = 32-44 chars base58, ETH = 0x...)
    const address = text.match(/0x[a-fA-F0-9]{40}/)?.[0] || 
                    text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/)?.[0] || null;
    
    // Symbol — línea después del tipo de token
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const tokenLineIdx = lines.findIndex(l => l.includes('NEW TOKEN') || l.includes('GEM DETECTADA'));
    const symbol = lines[tokenLineIdx + 1]?.split('/')?.[0]?.trim() || null;

    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO gem_alerts_tg 
        (bot_source, tipo, symbol, address, chain, hold_score, precio, 
         lp_usd, fdv, vol_1h, cambio_1h, buys_1h, sells_1h, raw_text, ts)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      `, ['degenscout', 'new_gem', symbol, address, chain, holdScore, precio,
          lp, fdv, vol1h, cambio1h, buys, sells, text.slice(0, 2000), ts]);
      logger.info({ symbol, chain, holdScore }, 'Gem alert saved');
    } finally {
      client.release();
    }
  } catch (err) {
    logger.warn({ err }, 'parseDegenScoutGem failed');
  }
}

// Parser 3: DegenScout whale buy/sell
// Formato:
// 🦅 DegenScout
// 🔴 WHALE VENTA SOLANA / 🟢 WHALE COMPRA SOLANA
// SYMBOL / CHAIN
// Monto: $24.7K
// LP del pool: $3.87M
// Ver tx · Dexscreener
async function parseDegenScoutWhale(text: string, ts: number) {
  try {
    const isWhale = text.includes('WHALE VENTA') || text.includes('WHALE COMPRA');
    if (!isWhale) return;

    const tipo = text.includes('WHALE VENTA') ? 'whale_sell' : 'whale_buy';
    const chain = text.includes('SOLANA') ? 'solana' : 
                  text.includes('ETH') ? 'ethereum' : 'bsc';
    
    const monto = parseMoneyValue(text.match(/Monto:\s*\$([0-9.KMB]+)/)?.[1] || '0');
    const lpPool = parseMoneyValue(text.match(/LP del pool:\s*\$([0-9.KMB]+)/)?.[1] || '0');
    const txUrl = text.match(/Ver tx[:\s]*(https?:\/\/\S+)/)?.[1] || null;
    const dexUrl = text.match(/Dexscreener[:\s]*(https?:\/\/\S+)/)?.[1] || null;
    
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const whaleLineIdx = lines.findIndex(l => l.includes('WHALE'));
    const symbol = lines[whaleLineIdx + 1]?.split('/')?.[0]?.trim() || null;

    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO gem_alerts_tg 
        (bot_source, tipo, symbol, chain, monto_usd, lp_pool, 
         tx_url, dex_url, raw_text, ts)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      `, ['degenscout', tipo, symbol, chain, monto, lpPool,
          txUrl, dexUrl, text.slice(0, 2000), ts]);
      logger.info({ symbol, tipo, monto }, 'DegenScout whale saved');
    } finally {
      client.release();
    }
  } catch (err) {
    logger.warn({ err }, 'parseDegenScoutWhale failed');
  }
}

// Parser 4: Señales PSY altcoins
// Formato:
// TIER 3 — Meme Coin / TIER 4 — Trending 2026
// 🚀 SEÑAL PSY — EIGENUSDT 4H
// 📈 COMPRA / 📉 VENTA
// Score: 61.8/100 | 🟢 ALTA / 🟡 MEDIA / 🔴 BAJA
// Precio: 0.212700 USDT
// RSI(14): 49.89
// EMA 9/21: 0.2141 / 0.2141
// EMA 50/200: 0.2869 / 0.1899
// CVD: -45,476
// BB %B: 0.38
// R: 0.234900 (+10.44%)
// S: 0.203200 (-4.47%)
// Score Final: 41.7 / 100
// Técnico: 33 | Patrón: 58 | Sentiment: 50
// Confianza: BAJA
// Win Rate: 83.3% (histórico 30 casos)
// Retorno promedio: +1.53%
async function parsePsySignal(text: string, ts: number) {
  try {
    const hasSignal = text.includes('SEÑAL PSY') || text.includes('PSY Engine');
    if (!hasSignal) return;

    const tierMatch = text.match(/TIER\s*(\d+)\s*[—-]\s*([^\n]+)/);
    const tier = tierMatch ? `TIER ${tierMatch[1]} — ${tierMatch[2].trim()}` : null;
    
    const symbolMatch = text.match(/SEÑAL PSY\s*[—-]\s*([A-Z]+(?:USDT|USD|BTC)?)\s+(\w+)/);
    const symbol = symbolMatch?.[1] || null;
    const timeframe = symbolMatch?.[2] || null;
    
    const tipo = text.includes('📈') || text.includes('COMPRA') ? 'COMPRA' : 
                 text.includes('📉') || text.includes('VENTA') ? 'VENTA' : null;
    
    const scoreMatch = text.match(/Score(?:\s+Final)?:\s*([\d.]+)\s*\/\s*100/);
    const score = parseFloat(scoreMatch?.[1] || '0');
    
    const confianza = text.match(/Confianza:\s*(ALTA|MEDIA|BAJA)/)?.[1] || null;
    const precio = parseFloat(text.match(/Precio:\s*([\d.]+)/)?.[1] || '0');
    const rsi = parseFloat(text.match(/RSI\(\d+\):\s*([\d.]+)/)?.[1] || '0');
    
    const emaMatch = text.match(/EMA 9\/21:\s*([\d.]+)\s*\/\s*([\d.]+)/);
    const ema9 = parseFloat(emaMatch?.[1] || '0');
    const ema21 = parseFloat(emaMatch?.[2] || '0');
    
    const ema50200Match = text.match(/EMA 50\/200:\s*([\d.]+)\s*\/\s*([\d.]+)/);
    const ema50 = parseFloat(ema50200Match?.[1] || '0');
    const ema200 = parseFloat(ema50200Match?.[2] || '0');
    
    const cvd = parseFloat((text.match(/CVD:\s*([+\-0-9,]+)/)?.[1] || '0').replace(/,/g, ''));
    const bbB = parseFloat(text.match(/BB %B:\s*([\d.]+)/)?.[1] || '0');
    const macd = parseFloat(text.match(/MACD[^:]*:\s*([+\-0-9.]+)/)?.[1] || '0');
    
    const resistencia = parseFloat(text.match(/R:\s*([\d.]+)/)?.[1] || '0');
    const soporte = parseFloat(text.match(/S:\s*([\d.]+)/)?.[1] || '0');
    
    const scoreTecnico = parseInt(text.match(/Técnico:\s*(\d+)/)?.[1] || '0');
    const scorePatron = parseInt(text.match(/Patrón:\s*(\d+)/)?.[1] || '0');
    const scoreSentiment = parseInt(text.match(/Sentiment:\s*(\d+)/)?.[1] || '0');
    
    const winRate = parseFloat(text.match(/Win Rate:\s*([\d.]+)%/)?.[1] || '0');
    const retornoProm = parseFloat(text.match(/Retorno promedio:\s*([+\-0-9.]+)%/)?.[1] || '0');

    if (!symbol || !tipo) return; // ignorar si no es señal válida

    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO psy_signals_tg 
        (bot_source, tier, symbol, timeframe, tipo, score, confianza, precio,
         rsi, ema_9, ema_21, ema_50, ema_200, cvd, bb_b, macd,
         resistencia, soporte, score_tecnico, score_patron, score_sentiment,
         win_rate, retorno_prom, raw_text, ts)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
      `, ['psy-engine', tier, symbol, timeframe, tipo, score, confianza, precio,
          rsi, ema9, ema21, ema50, ema200, cvd, bbB, macd,
          resistencia, soporte, scoreTecnico, scorePatron, scoreSentiment,
          winRate, retornoProm, text.slice(0, 3000), ts]);
      logger.info({ symbol, tipo, score, confianza }, 'PSY signal saved');
    } finally {
      client.release();
    }
  } catch (err) {
    logger.warn({ err }, 'parsePsySignal failed');
  }
}

// Parser 5: Exchange alerts (WhalePerp en canal pro)
// Formato:
// 🦈 WhalePerp — PSYCHOMETRIKS
// WHALE ALERT
// dYdX v4 · COSMOS · ETH-USD
// Clase: PEZ GRANDE · Rating: 30/100
// 🟢 Dirección: LONG
// Tamaño: $250.5K
// Cantidad: 109.9580 ETH
// Precio: $2,277.80
async function parseExchangeAlert(text: string, ts: number) {
  try {
    const hasAlert = text.includes('WHALE ALERT') && 
                     (text.includes('dYdX') || text.includes('OKX') || 
                      text.includes('Binance') || text.includes('Bybit'));
    if (!hasAlert) return;

    const exchange = text.match(/(dYdX v4|OKX|Binance|Bybit|BitMEX|Hyperliquid)/i)?.[1] || null;
    const pair = text.match(/([A-Z]+-[A-Z]+)/)?.[1] || null;
    const coin = pair?.split('-')?.[0] || null;
    const clase = text.match(/Clase:\s*([A-ZÁÉÍÓÚÑ\s]+?)(?:\s*·|\n)/)?.[1]?.trim() || null;
    const rating = parseInt(text.match(/Rating:\s*(\d+)\/100/)?.[1] || '0');
    const direccion = text.includes('🟢') || text.match(/Dirección:\s*LONG/) ? 'LONG' :
                      text.includes('🔴') || text.match(/Dirección:\s*SHORT/) ? 'SHORT' : 'NEUTRAL';
    const tamano = parseMoneyValue(text.match(/Tamaño:\s*\$([0-9.KMB]+)/)?.[1] || '0');
    const cantidad = parseFloat(text.match(/Cantidad:\s*([\d.]+)/)?.[1] || '0');
    const precio = parseFloat((text.match(/Precio:\s*\$([\d,]+\.?\d*)/)?.[1] || '0').replace(/,/g, ''));
    const mensaje = text.match(/💡\s*(.+)/)?.[1] || null;

    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO exchange_alerts_tg 
        (bot_source, exchange, coin, pair, clase, rating, direccion, 
         tamano_usd, cantidad, precio, mensaje, raw_text, ts)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      `, ['whaleperp', exchange, coin, pair, clase, rating, direccion,
          tamano, cantidad, precio, mensaje, text.slice(0, 2000), ts]);
      logger.info({ coin, exchange, direccion, tamano }, 'Exchange alert saved');
    } finally {
      client.release();
    }
  } catch (err) {
    logger.warn({ err }, 'parseExchangeAlert failed');
  }
}

// ─── Helper: parsear valores monetarios (ej: $24.7K → 24700) ─────────────────
function parseMoneyValue(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/[$,\s]/g, '');
  const num = parseFloat(clean);
  if (clean.endsWith('K')) return Math.round(parseFloat(clean) * 1000);
  if (clean.endsWith('M')) return Math.round(parseFloat(clean) * 1_000_000);
  if (clean.endsWith('B')) return Math.round(parseFloat(clean) * 1_000_000_000);
  return Math.round(num);
}

// ─── Router de mensajes ───────────────────────────────────────────────────────
async function routeMessage(chatId: string, text: string, ts: number) {
  if (!text || text.length < 10) return;
  
  logger.info({ chatId, preview: text.slice(0, 80) }, 'Telegram message received');

  // Canal signals-btc-eth-sol
  if (chatId === CHAT_IDS.signals) {
    if (text.includes('WHALE ALERT') || text.includes('WhalePerp')) {
      await parseWhaleAlert(text, ts, 'whale-intel');
    }
    if (text.includes('SEÑAL PSY') || text.includes('PSY Engine')) {
      await parsePsySignal(text, ts);
    }
  }

  // Canal alcoins_signal
  if (chatId === CHAT_IDS.alcoins) {
    if (text.includes('SEÑAL PSY') || text.includes('PSY Engine') || 
        text.includes('TIER')) {
      await parsePsySignal(text, ts);
    }
  }

  // Canal PSYCHOMETRIKS pro
  if (chatId === CHAT_IDS.pro) {
    if (text.includes('WhalePerp') || text.includes('PSYCHOMETRIKS WHALE ALERT')) {
      await parseWhaleAlert(text, ts, 'whaleperp');
      await parseExchangeAlert(text, ts);
    }
    if (text.includes('DegenScout')) {
      if (text.includes('WHALE VENTA') || text.includes('WHALE COMPRA')) {
        await parseDegenScoutWhale(text, ts);
      } else if (text.includes('NEW TOKEN') || text.includes('GEM DETECTADA')) {
        await parseDegenScoutGem(text, ts);
      }
    }
  }
}

// ─── Iniciar bots ─────────────────────────────────────────────────────────────
export async function startTelegramListener() {
  await setupTables();

  const tokens = [
    { token: process.env.WHALE_BOT_TOKEN,    name: 'whale-bot' },
    { token: process.env.SIGNALS_BOT_TOKEN,  name: 'signals-bot' },
    { token: process.env.ALTCOINS_BOT_TOKEN, name: 'altcoins-bot' },
    { token: process.env.WHALEPERP_BOT_TOKEN,name: 'whaleperp-bot' },
  ].filter(b => !!b.token);

  if (tokens.length === 0) {
    logger.warn('No Telegram bot tokens found — listener disabled');
    return;
  }

  for (const { token, name } of tokens) {
    try {
      const bot = new TelegramBot(token!, { polling: true });
      
      bot.on('message', async (msg) => {
        const chatId = String(msg.chat.id);
        const text = msg.text || msg.caption || '';
        await routeMessage(chatId, text, msg.date * 1000);
      });

      bot.on('channel_post', async (msg) => {
        const chatId = String(msg.chat.id);
        const text = msg.text || msg.caption || '';
        await routeMessage(chatId, text, msg.date * 1000);
      });

      bot.on('polling_error', (err) => {
        logger.warn({ err: err.message, bot: name }, 'Polling error');
      });

      logger.info({ bot: name }, 'Telegram bot started');
    } catch (err) {
      logger.warn({ err, bot: name }, 'Failed to start bot');
    }
  }
}
```

---

## TAREA 2 — AGREGAR ENDPOINTS en `artifacts/api-server/src/routes/whale-intel.ts`

Agregar al final del archivo, ANTES del `export default router`:

```typescript
// ─── GET /api/whale-intel/tg-whales ──────────────────────────────────────────
router.get("/whale-intel/tg-whales", async (req, res) => {
  const cached = cGet("tg_whales");
  if (cached) { res.json({ ok: true, alerts: cached }); return; }
  try {
    const client = await pool.connect();
    try {
      const r = await client.query(
        `SELECT * FROM whale_alerts_tg ORDER BY ts DESC LIMIT 50`
      );
      cSet("tg_whales", r.rows, 15_000);
      res.json({ ok: true, alerts: r.rows, total: r.rowCount });
    } finally { client.release(); }
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err), alerts: [] });
  }
});

// ─── GET /api/whale-intel/tg-signals ─────────────────────────────────────────
router.get("/whale-intel/tg-signals", async (req, res) => {
  const cached = cGet("tg_signals");
  if (cached) { res.json({ ok: true, signals: cached }); return; }
  try {
    const client = await pool.connect();
    try {
      const r = await client.query(
        `SELECT * FROM psy_signals_tg ORDER BY ts DESC LIMIT 60`
      );
      cSet("tg_signals", r.rows, 15_000);
      res.json({ ok: true, signals: r.rows, total: r.rowCount });
    } finally { client.release(); }
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err), signals: [] });
  }
});

// ─── GET /api/whale-intel/tg-gems ────────────────────────────────────────────
router.get("/whale-intel/tg-gems", async (req, res) => {
  const cached = cGet("tg_gems");
  if (cached) { res.json({ ok: true, gems: cached }); return; }
  try {
    const client = await pool.connect();
    try {
      const r = await client.query(
        `SELECT * FROM gem_alerts_tg ORDER BY ts DESC LIMIT 40`
      );
      cSet("tg_gems", r.rows, 15_000);
      res.json({ ok: true, gems: r.rows, total: r.rowCount });
    } finally { client.release(); }
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err), gems: [] });
  }
});

// ─── GET /api/whale-intel/tg-exchanges ───────────────────────────────────────
router.get("/whale-intel/tg-exchanges", async (req, res) => {
  const cached = cGet("tg_exchanges");
  if (cached) { res.json({ ok: true, alerts: cached }); return; }
  try {
    const client = await pool.connect();
    try {
      const r = await client.query(
        `SELECT * FROM exchange_alerts_tg ORDER BY ts DESC LIMIT 40`
      );
      cSet("tg_exchanges", r.rows, 15_000);
      res.json({ ok: true, alerts: r.rows, total: r.rowCount });
    } finally { client.release(); }
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err), alerts: [] });
  }
});

// ─── GET /api/whale-intel/tg-stats ───────────────────────────────────────────
router.get("/whale-intel/tg-stats", async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const since = Date.now() - 86_400_000; // últimas 24h
      const [w, s, g, e] = await Promise.all([
        client.query(`SELECT COUNT(*) FROM whale_alerts_tg WHERE ts > $1`, [since]),
        client.query(`SELECT COUNT(*) FROM psy_signals_tg WHERE ts > $1`, [since]),
        client.query(`SELECT COUNT(*) FROM gem_alerts_tg WHERE ts > $1`, [since]),
        client.query(`SELECT COUNT(*) FROM exchange_alerts_tg WHERE ts > $1`, [since]),
      ]);
      res.json({
        ok: true,
        whales_24h: parseInt(w.rows[0].count),
        signals_24h: parseInt(s.rows[0].count),
        gems_24h: parseInt(g.rows[0].count),
        exchanges_24h: parseInt(e.rows[0].count),
        ultima_actualizacion: new Date().toISOString(),
      });
    } finally { client.release(); }
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  }
});
```

---

## TAREA 3 — AGREGAR en `artifacts/api-server/src/index.ts`

Buscar la línea donde dice `app.listen` y DESPUÉS agregar:

```typescript
import { startTelegramListener } from './routes/telegram-listener';

// Después de app.listen():
startTelegramListener().catch(err => 
  logger.warn({ err }, 'Telegram listener failed to start')
);
```

---

## TAREA 4 — AGREGAR dependencia en `artifacts/api-server/package.json`

```json
"node-telegram-bot-api": "^0.66.0",
"@types/node-telegram-bot-api": "^0.66.0"
```

---

## TAREA 5 — ACTUALIZAR `artifacts/psychometriks/src/pages/whale-alert.tsx`

En el tab SEÑALES PSY, cambiar el fetch para usar los datos reales de la DB:

```typescript
// En PsySignalsTab, cambiar:
// ANTES: fetch('/api/signals') o fetch('/api/altcoins-signals')
// DESPUÉS:
const d = await fetch('/api/whale-intel/tg-signals').then(r => r.json());
if (d.ok && d.signals?.length) {
  setSignals(d.signals);
} else {
  // fallback al sistema actual
  const fallback = await fetch('/api/signals').then(r => r.json());
  setSignals(fallback.signals || []);
}
```

En el tab WHALE FEEDS, cambiar fetch:
```typescript
// ANTES: fetch('/api/whale-intel/alerts')
// DESPUÉS: mezclar ambas fuentes
const [tgData, apiData] = await Promise.allSettled([
  fetch('/api/whale-intel/tg-whales').then(r => r.json()),
  fetch('/api/whale-intel/alerts').then(r => r.json()),
]);
// Mostrar tg-whales primero (datos reales Telegram), luego los de API
```

En el tab GEM HUNTER, agregar fuente DegenScout:
```typescript
const [tgGems, dexGems] = await Promise.allSettled([
  fetch('/api/whale-intel/tg-gems').then(r => r.json()),
  fetch('/api/whale-intel/gems').then(r => r.json()),
]);
// Mostrar tg-gems primero con badge "🦅 DEGENSCOUT"
```

En el tab EXCHANGE SIGNALS:
```typescript
const d = await fetch('/api/whale-intel/tg-exchanges').then(r => r.json());
```

---

## VARIABLES DE ENTORNO — Agregar en Railway api-server:

```
WHALE_BOT_TOKEN      = (token de @psychometriks_whale_bot)
SIGNALS_BOT_TOKEN    = (token de @Psychometriks_signals_bot)
ALTCOINS_BOT_TOKEN   = (token de @signals_altcoins_bot)
WHALEPERP_BOT_TOKEN  = (token del bot WHALE_ALERT del canal pro)
SIGNALS_CHAT_ID      = -1003707106507
ALCOINS_CHAT_ID      = -1003702118104
PRO_CHAT_ID          = -1003781020653
```

---

## REGLAS CRÍTICAS:
1. NO borrar nada existente en whale-intel.ts ni whale-alert.tsx
2. NO cambiar el sistema de auth ni los planes
3. Los parsers usan try/catch — si un mensaje falla, continúa con el siguiente
4. El listener usa channel_post (no solo message) para canales de Telegram
5. NO duplicar señales — si el mismo mensaje llega por 2 bots, ignorar el duplicado
   (verificar: SELECT COUNT(*) WHERE ts = $ts AND symbol = $symbol antes de INSERT)
6. Hacer redeploy en Railway después de los cambios
7. Verificar que node-telegram-bot-api está en package.json antes de deploy
