# PROMPT PARA REPLIT — PSYCHOMETRIKS WHALE INTEL
# Pega esto COMPLETO en Replit AI

---

## CONTEXTO DEL PROYECTO

Tengo un monorepo con:
- Frontend: `artifacts/psychometriks/src/pages/whale-alert.tsx` (React + Vite, desplegado en Cloudflare Pages)
- Backend: `artifacts/api-server/src/routes/whale-intel.ts` (Express 5 + PostgreSQL, desplegado en Railway)
- URL producción API: `api.psychometriks.trade`
- Variables de entorno en Railway: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID`, `DATABASE_URL`

---

## TAREA 1 — NUEVO ARCHIVO: `artifacts/api-server/src/routes/telegram-listener.ts`

Crear un listener de Telegram que:

1. Use `node-telegram-bot-api` con polling
2. Escuche estos canales (los IDs vienen de las variables de entorno):
   - `WHALEPERP_CHAT_ID` → mensajes de WhalePerp (ballenas HL/dYdX)
   - `DEGENSCOUT_CHAT_ID` → mensajes de DegenScout (compras ballenas DEX + nuevas altcoins)
   - `ALCOINS_CHAT_ID` → mensajes de señales altcoins PSY

3. Parsee cada tipo de mensaje y guarde en PostgreSQL

### PARSER 1 — WhalePerp (formato real):
```
🦈 WhalePerp — PSYCHOMETRIKS
WHALE ALERT
─────────────────────────────
🏦 dYdX v4 · 🌌 COSMOS · 📊 ETH-USD
🏆 Clase: PEZ GRANDE · ⭐ Rating: 30/100
🟢 Dirección: LONG
💰 Tamaño: $250.5K
📦 Cantidad: 109.9580 ETH
💲 Precio: $2,277.80
💡 Presión compradora institucional...
```

Extraer: exchange, coin, pair, clase, rating, direccion(LONG/SHORT), tamano_usd, cantidad, precio, wallet(si existe), mensaje_inteligencia, timestamp

### PARSER 2 — DegenScout gems (formato real):
```
🦅 DegenScout
🆕 NEW TOKEN SOLANA🟡
[nombre_token]
[address]
🏆 Hold Score: 50/100 — 🟡 ESPECULATIVO
💲 Precio: $0.06720
💧 LP: $20.0K
📊 Vol 24h: $9.5K
📈 Δ 1h: +2031.0%
🛒 Buys/Sells 1h: 13/0
Safety (RugCheck): [riesgos]
```

Extraer: symbol, address, chain(solana/ethereum), hold_score, precio, lp_usd, vol_24h, cambio_1h, buys_1h, sells_1h, rugcheck_risks, timestamp

### PARSER 3 — DegenScout whale buy/sell (formato real):
```
🦅 DegenScout
🔴 WHALE VENTA SOLANA
TROLL / SOL
💰 Monto: $24.7K
💧 LP del pool: $3.87M
Ver tx · Dexscreener
```

Extraer: tipo(compra/venta), chain, symbol, monto_usd, lp_pool_usd, tx_url, timestamp

### PARSER 4 — Señales PSY altcoins (formato real):
```
TIER 4 — Trending 2026
🚀 SEÑAL PSY — EIGENUSDT 4H
─────────────────────────────
📉 VENTA
Score: 41.7/100 | 🔴 BAJA
─────────────────────────────
💰 Precio: 0.212700 USDT
📊 Indicadores
• RSI(14): 49.89
• EMA 9/21: 0.2141 / 0.2141
• EMA 50/200: 0.2869 / 0.1899
• CVD: -45,476 🔴
• Vol: 0.00x
• OI: N/D
📐 Niveles
• R: 0.234900 (+10.44%)
• S: 0.203200 (-4.47%)
🧠 PSY INTELLIGENCE
• Score Final: 41.7 / 100
• Técnico: 33 | Patrón: 58 | Sentiment: 50
• Confianza: BAJA
```

Extraer: tier, symbol, timeframe, tipo(COMPRA/VENTA), score, confianza, precio, rsi, ema_9, ema_21, ema_50, ema_200, cvd, resistencia, soporte, score_tecnico, score_patron, score_sentiment, timestamp

4. Guardar todo en estas tablas PostgreSQL (crearlas si no existen):

```sql
-- Alertas de ballenas (WhalePerp)
CREATE TABLE IF NOT EXISTS whale_alerts (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  exchange VARCHAR(50),
  coin VARCHAR(20),
  pair VARCHAR(30),
  clase VARCHAR(50),
  rating INTEGER,
  direccion VARCHAR(10),
  tamano_usd BIGINT,
  cantidad DECIMAL(20,8),
  precio DECIMAL(20,8),
  wallet VARCHAR(100),
  mensaje TEXT,
  raw_text TEXT,
  ts BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Gems nuevas (DegenScout)
CREATE TABLE IF NOT EXISTS gem_alerts (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  symbol VARCHAR(30),
  address VARCHAR(100),
  chain VARCHAR(20),
  hold_score INTEGER,
  precio DECIMAL(20,10),
  lp_usd DECIMAL(20,2),
  vol_24h DECIMAL(20,2),
  cambio_1h DECIMAL(10,2),
  buys_1h INTEGER,
  sells_1h INTEGER,
  rugcheck_risks TEXT,
  tipo VARCHAR(20) DEFAULT 'new_token',
  monto_usd DECIMAL(20,2),
  tx_url TEXT,
  raw_text TEXT,
  ts BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Señales PSY altcoins
CREATE TABLE IF NOT EXISTS psy_signals (
  id SERIAL PRIMARY KEY,
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
  resistencia DECIMAL(20,8),
  soporte DECIMAL(20,8),
  score_tecnico INTEGER,
  score_patron INTEGER,
  score_sentiment INTEGER,
  raw_text TEXT,
  ts BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

5. Exponer endpoints GET en el router:

```
GET /api/telegram/whale-alerts?limit=50&exchange=all&direccion=all
GET /api/telegram/gem-alerts?limit=50&chain=all&tipo=all  
GET /api/telegram/psy-signals?limit=50&tipo=all&confianza=all
GET /api/telegram/stats → { whales_hoy, gems_hoy, signals_hoy, ultima_actualizacion }
```

6. El listener se inicia en `artifacts/api-server/src/index.ts` — agregar:
```typescript
import { startTelegramListener } from './routes/telegram-listener';
// después de app.listen:
startTelegramListener().catch(err => logger.warn({ err }, 'Telegram listener failed'));
```

---

## TAREA 2 — MODIFICAR: `artifacts/api-server/src/routes/whale-intel.ts`

Agregar estas rutas al router existente (NO borrar nada de lo que ya existe):

```typescript
// GET /api/whale-intel/live-whales → mezcla DB + API en tiempo real
// Retorna: últimas 30 whale_alerts de la DB + los traders actuales de HL
router.get("/whale-intel/live-whales", async (req, res) => {
  // Leer de DB: SELECT * FROM whale_alerts ORDER BY ts DESC LIMIT 30
  // Combinar con los traders de Hyperliquid
  // Retornar unificado
});

// GET /api/whale-intel/live-signals → señales PSY de la DB  
router.get("/whale-intel/live-signals", async (req, res) => {
  // SELECT * FROM psy_signals ORDER BY ts DESC LIMIT 50
});

// GET /api/whale-intel/live-gems → gems de DegenScout de la DB
router.get("/whale-intel/live-gems", async (req, res) => {
  // SELECT * FROM gem_alerts ORDER BY ts DESC LIMIT 40
});
```

---

## TAREA 3 — MODIFICAR: `artifacts/psychometriks/src/pages/whale-alert.tsx`

Rediseñar completamente la página con ESTOS 6 TABS (no 3):

### TAB 1: 🐋 WHALE FEEDS
- Fuente: `/api/telegram/whale-alerts` (DB, datos reales de WhalePerp)
- Mostrar cards estilo Telegram con: exchange badge, coin, clase (MEGALODÓN/PEZ GRANDE/etc), rating/100, dirección LONG/SHORT, tamaño USD, wallet truncada si existe
- Color verde para LONG, rojo para SHORT
- Filtros: por exchange (HL/dYdX/OKX/BMX), por dirección, por clase
- Auto-refresh cada 30 segundos
- Si no hay datos en DB todavía → mostrar datos de `/api/whale-intel/alerts` (fallback al sistema actual)

### TAB 2: 📊 OI FLOW  
- Mantener EXACTAMENTE el código actual del CopyTradingTab
- No cambiar nada de este tab

### TAB 3: 🤖 SEÑALES PSY
- Fuente: `/api/telegram/psy-signals` (DB, señales del algoritmo PSY)
- Cards estilo Telegram con: TIER badge, símbolo, timeframe, COMPRA/VENTA, Score/100, barra de confianza, precio actual, RSI, CVD, Resistencia/Soporte
- Color de barra: score >= 65 verde, score <= 40 rojo, resto amarillo
- Filtros: por tipo (COMPRA/VENTA), por confianza (ALTA/MEDIA/BAJA), por tier
- Auto-refresh cada 60 segundos
- Si no hay datos en DB → mostrar mensaje "Esperando señales del algoritmo PSY..."

### TAB 4: 💎 GEM HUNTER
- Fuente MIXTA: `/api/telegram/gem-alerts` (DegenScout DB) + `/api/whale-intel/gems` (DexScreener API actual)
- Primero mostrar las gems de DegenScout (tienen hold_score real)
- Luego las de DexScreener
- Cards con: símbolo, chain badge, hold_score si existe, precio, cambio 1h, vol 24h, LP, buys/sells, link Dexscreener
- Badge especial "🦅 DEGENSCOUT" para las que vienen del bot
- Mantener el RugCheck existente
- Filtros existentes + nuevo filtro "Solo DegenScout"

### TAB 5: 📡 EXCHANGE SIGNALS  
- Fuente: `/api/coinglass/signals` (ya existe) + futuro
- Mantener EXACTAMENTE el código actual
- Solo cambiar el nombre del tab

### TAB 6: 💥 SHORT SQUEEZE
- Fuente: `/api/whale-intel/traders` filtrado
- Mostrar solo activos donde: funding > +0.05% (longs pagando mucho) + OI > $50M
- Estos son candidatos a short squeeze
- Card con: símbolo, funding rate (grande y en rojo), OI total, % cambio precio, "RIESGO SQUEEZE" badge
- Ordenar por funding rate descendente
- Tooltip explicativo: "Funding alto = longs atrapados = posible squeeze"

### ESTRUCTURA GENERAL DE LA PÁGINA:

```
Header: WHALE INTEL (mismo estilo actual)
SystemWinRateBanner (ya existe, mantener)

Tabs: [🐋 WHALE FEEDS] [📊 OI FLOW] [🤖 SEÑALES PSY] [💎 GEM HUNTER] [📡 EXCHANGES] [💥 SQUEEZE]

Tab activo por defecto: 🤖 SEÑALES PSY

Footer con fuentes de datos
```

### IMPORTANTE — Mantener todo lo que ya existe:
- `getAuth()`, `isElite()`, `hasPro()` — NO CAMBIAR
- `PlanGate` component — NO CAMBIAR  
- `SystemWinRateBanner` — NO CAMBIAR
- `IntentScoreBar` — NO CAMBIAR
- `HistoryModal` — NO CAMBIAR
- `CopyTradingTab` (ahora tab OI FLOW) — NO CAMBIAR NADA
- `GemHunterTab` — mantener pero agregar fuente DegenScout
- Auth guard al inicio — NO CAMBIAR
- Niveles de plan: whale-alert es ELITE (rank >= 4)

---

## TAREA 4 — AGREGAR dependencia en `artifacts/api-server/package.json`

```json
"node-telegram-bot-api": "^0.66.0",
"@types/node-telegram-bot-api": "^0.66.0"
```

---

## VARIABLES DE ENTORNO NUEVAS (agregar en Railway api-server):

```
WHALEPERP_CHAT_ID=    ← ID del canal PSYCHOMETRIKS pro
DEGENSCOUT_CHAT_ID=   ← mismo canal (mismo bot publica todo)
ALCOINS_CHAT_ID=      ← ID de Psychometriks_alcoins_signal
```

---

## REGLAS CRÍTICAS:
1. NO borrar ningún endpoint existente en whale-intel.ts
2. NO cambiar el sistema de auth
3. NO cambiar CopyTradingTab ni OI Flow
4. Los parsers deben ser tolerantes a fallos (try/catch por mensaje)
5. Si el mensaje no matchea ningún parser → ignorar silenciosamente
6. Usar el pool/db existente de `@workspace/db` para las queries
7. El listener debe reconectarse automáticamente si cae
8. Cachear los endpoints GET por 15 segundos máximo
