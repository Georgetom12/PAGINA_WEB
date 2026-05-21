# 🧠 PSYCHOMETRIKS — ARCHIVO MADRE
> Estado actual completo · Mayo 2026

---

## 📁 ESTRUCTURA DE RAÍZ

```
workspace/
├── artifacts/
│   ├── psychometriks/          ← WEB PRINCIPAL (React + Vite)
│   ├── aula-psychometriks/     ← AULA VIRTUAL (React + Vite)
│   ├── api-server/             ← BACKEND (Express 5 + PostgreSQL)
│   ├── tap-dot/                ← APP MÓVIL (Expo / React Native)
│   ├── trading-chat/           ← CHAT IA (React + Vite)
│   └── mockup-sandbox/         ← Canvas / Preview Server
├── lib/                        ← Librerías compartidas (TypeScript)
├── scripts/                    ← Scripts utilitarios
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── PSYCHOMETRIKS_ARCHIVO_MADRE.md  ← ESTE ARCHIVO
```

---

## 🌐 ARTIFACT: artifacts/psychometriks — WEB PRINCIPAL

### Comandos clave
```bash
# Build producción (Cloudflare Pages)
PORT=19460 BASE_PATH=/ pnpm --filter @workspace/psychometriks run build

# Copiar workers al dist
cp public/_worker.js dist/public/_worker.js
cp public/_redirects dist/public/_redirects

# ZIP para subir a Cloudflare
python3 -c "
import zipfile, pathlib
base = pathlib.Path('dist/public')
with zipfile.ZipFile('/home/runner/workspace/psychometriks-cloudflare.zip', 'w', zipfile.ZIP_DEFLATED) as zf:
    for f in base.rglob('*'):
        if f.is_file(): zf.write(f, f.relative_to(base))
"
```

### Archivos clave
```
src/
├── App.tsx                     ← ROUTER PRINCIPAL + Guards de acceso
├── main.tsx                    ← Entry point
├── index.css                   ← Estilos globales
├── lib/
│   ├── auth.ts                 ← Sistema de auth (PLAN_RANK, getAuth, hasAccess)
│   ├── appkit.ts               ← WalletConnect / Wagmi config
│   ├── secure-storage.ts       ← XOR+Base64 para localStorage
│   └── utils.ts                ← cn(), helpers
├── components/
│   ├── site-nav.tsx            ← NAV PRINCIPAL (dropdowns LiqMap/Herramientas)
│   ├── chat-widget.tsx         ← Widget IA flotante
│   ├── master-panel.tsx        ← Panel admin (superadmin/operator only)
│   ├── support-chat-widget.tsx ← Widget soporte
│   └── upgrade-wall.tsx        ← Muro de upgrade de plan
├── pages/                      ← TODAS LAS PÁGINAS (ver tabla abajo)
├── data/
│   ├── blog-posts.ts           ← 15 artículos SEO en español
│   └── tests.ts                ← 3 tests, 14 perfiles, lógica de scoring
└── hooks/
    ├── use-chat-widget.ts
    ├── use-mobile.tsx
    └── use-toast.ts
```

---

## 🗺️ RUTAS COMPLETAS — App.tsx

### PÚBLICAS (sin login)
| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/` | home.tsx | Landing principal |
| `/pricing` | pricing.tsx | Planes y precios |
| `/login` | login.tsx | Login (JORGE-2026 / JORGE-ADMIN-2026) |
| `/blog` | blog.tsx | Blog 15 artículos |
| `/blog/:slug` | blog-post.tsx | Artículo individual |
| `/tests` | tests-home.tsx | Hub de tests psicológicos |
| `/tests/:testId` | test-quiz.tsx | Test interactivo |
| `/descarga` | descarga.tsx | Descarga app móvil |
| `/onboarding` | onboarding.tsx | Tutorial inicio |
| `/verify/:certCode` | verify-cert.tsx | Verificar certificado |
| `/verify-email/:token` | verify-email.tsx | Verificar email |
| `/reset-password/:token` | reset-password.tsx | Reset contraseña |
| `/api-docs` | api-docs.tsx | Documentación API REST |
| `/indicators` | indicators.tsx | Indicadores públicos |

### BÁSICO — cualquier miembro (rank ≥ 1)
| Ruta | Archivo |
|------|---------|
| `/dashboard` | dashboard.tsx |
| `/calculadora` | calculadora.tsx |
| `/converter` | converter.tsx |
| `/simulador` | simulador.tsx |
| `/pre-entry` | pre-entry.tsx |
| `/adn-trader` | adn-trader.tsx |
| `/costo-errores` | costo-errores.tsx |
| `/journal` | journal.tsx |
| `/psy-autopsy` | psy-autopsy.tsx |
| `/certificado` | certificado.tsx |
| `/challenge` | challenge.tsx |
| `/affiliate` | affiliate.tsx |
| `/psy-token` | psy-token.tsx |
| `/boveda` | boveda.tsx |
| `/signals` | signals.tsx |
| `/replay` | replay.tsx |
| `/economic-calendar` | economic-calendar.tsx |
| `/leaderboard` | leaderboard.tsx |
| `/aula` | AulaPage.tsx |

### PRO — trader/pro o superior (rank ≥ 3)
| Ruta | Archivo |
|------|---------|
| `/psy-feed` | psy-intelligence-feed.tsx |
| `/heatmap` | psy-heatmap.tsx |
| `/funding` | funding-dashboard.tsx |
| `/liquidations` | liquidation-clock.tsx |
| `/screener` | psy-screener.tsx |
| `/macro` | macro-dashboard.tsx |
| `/spot-perp` | spot-perp.tsx |
| `/ciclos-btc` | ciclos-btc.tsx |
| `/fed-btc` | fed-btc.tsx |
| `/market-hours` | market-hours.tsx |
| `/psy-score` | psy-score.tsx |
| `/war-room` | war-room.tsx |

### ELITE — institucional/elite (rank ≥ 4)
| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/whale-alert` | whale-alert.tsx | OI FLOW · Copy Trading · Whale Feeds |
| `/bolsa` | bolsa-valores.tsx | Acciones & Renta Fija |
| `/altcoins-signals` | altcoins-signals.tsx | Top 50 altcoins señales |
| `/equities` | equities.tsx | Equities Command Center |
| `/anti-rug` | anti-rug.tsx | Anti-Rug Scanner |
| `/strategies` | strategies.tsx | Marketplace Estrategias |
| `/psy-oracle` | psy-oracle.tsx | PSY ORACLE Intelligence |
| `/command-center` | command-center.tsx | ⚡ NUEVO: Overview·Scanner·Portfolio·OI·PSY AI |

### EXCHANGE FREE (rank 0.5)
| Ruta | Archivo |
|------|---------|
| `/exchange` | exchange.tsx |
| `/psy-wallet` | psy-wallet.tsx |

### ADMIN ONLY (superadmin/operator)
| Ruta | Archivo |
|------|---------|
| `/admin/apis` | admin-apis.tsx |
| `/realtime` | signals-realtime.tsx |
| `/bot-x` | bot-x.tsx |

---

## 🔐 SISTEMA DE AUTH — lib/auth.ts

```typescript
// localStorage key: "psyko_auth"
// Formato: { user, displayName?, role, plan, token, ts }

// Roles
// "superadmin" → acceso total (contraseña: JORGE-ADMIN-2026 / MASTER99)
// "operator"   → admin operativo
// "member"     → usuario normal (con plan)

// Plan ranks
exchange     = 0.5   // Solo Exchange + Wallet
aprendiz     = 1     // = basico
basico       = 1
educacion    = 2
trader       = 3     // = pro
pro          = 3
institucional= 4     // = elite
elite        = 4
```

---

## 🧭 NAVEGACIÓN — site-nav.tsx

### LIQMAP_LINKS (dropdown LiqMap)
```
PSY Score         /psy-score         pro
PSY Screener      /screener          pro
Liquidation Clock /liquidations      pro
Funding Dashboard /funding           pro
PSY HeatMap       /heatmap           pro
Macro Dashboard   /macro             pro
Spot vs Perpetuos /spot-perp         pro
Ciclos BTC        /ciclos-btc        pro
FED × BTC         /fed-btc           pro
Whale Alert       /whale-alert       elite
Whale Signals     (external HTML)    elite
Market Hours      /market-hours      pro
Acciones          /bolsa             elite
Señales Altcoins  /altcoins-signals  elite
Equities CC       /equities          elite
PSY Intelligence  /psy-feed          pro
PSY ORACLE        /psy-oracle        elite
Anti-Rug Scanner  /anti-rug          elite
⚡ Command Center  /command-center    elite   ← NUEVO
```

### TOOLS_LINKS (dropdown Herramientas)
```
ESTOY POR ENTRAR  /pre-entry         basico
ADN del Trader    /adn-trader        basico
Costo de Errores  /costo-errores     basico
Challenge 30 días /challenge         basico
Programa Afiliados/affiliate         basico
API Pública       /api-docs          público
Certificados PDF  /certificado       basico
$PSY Token        /psy-token         basico
Simulador Liq.    /simulador         basico
PSY Autopsy       /psy-autopsy       basico
PSY Wallet        /psy-wallet        basico
War Room          /war-room          pro
Diario Trading    /journal           basico
Market Replay     /replay            educacion
Position Size Calc/calculadora       basico
Conversor Crypto  /converter         basico
Calendario Econ.  /economic-calendar educacion
Leaderboard       /leaderboard       educacion
Bóveda Personal   /boveda            basico
Marketplace Estrat/strategies        elite
```

---

## ⚙️ ARTIFACT: artifacts/api-server — BACKEND

### URL base en producción: Railway
### URL local dev: `/api/...` (proxy automático Replit)

### REGLA CRÍTICA de URLs en el frontend:
```
✅ CORRECTO: fetch('/api/proxy/kraken/ohlc')
❌ MAL:      fetch(`${BASE_URL}/api/...`)   ← BASE_URL apunta al Vite server, NO al api-server
```

### Archivos clave
```
src/
├── app.ts              ← Express app config
├── index.ts            ← Entry point
├── lib/
│   ├── auth.ts / psy-auth.ts  ← JWT + auth middleware
│   ├── email.ts               ← Resend emails
│   ├── jwt.ts                 ← JWT sign/verify
│   ├── logger.ts              ← Pino logger
│   └── totp.ts                ← 2FA TOTP
└── routes/
    ├── index.ts          ← Registro de todos los routers
    ├── health.ts         ← GET /api/healthz
    ├── market-proxy.ts   ← Proxy Kraken/OKX/Coinbase
    ├── psy-chat.ts       ← POST /api/psy-chat (Gemini AI)
    ├── chat.ts           ← /api/chat (chat widget)
    ├── signals.ts        ← /api/signals
    ├── whale-intel.ts    ← /api/whale-intel/traders
    ├── coinglass.ts      ← /api/coinglass/*
    ├── admin-config.ts   ← /api/admin/config
    ├── api-keys.ts       ← /api/admin/apis (12 API keys)
    ├── members.ts        ← /api/members (CRUD usuarios)
    ├── operators.ts      ← /api/operators
    ├── bot-x.ts          ← /api/bot-x
    ├── bot-status.ts     ← /api/bot-status
    ├── telegram.ts       ← /api/telegram
    ├── channels.ts       ← /api/channels
    ├── market.ts         ← /api/market
    ├── market-data.ts    ← /api/market-data
    ├── intelligence.ts   ← /api/intelligence
    ├── vault.ts          ← /api/vault
    ├── certificates.ts   ← /api/certificates
    ├── news.ts           ← /api/news
    ├── oneinch.ts        ← /api/1inch (DEX)
    ├── exchange.ts       ← /api/exchange
    ├── free-auth.ts      ← /api/auth (login público)
    ├── support-chat.ts   ← /api/support-chat
    ├── test-interpret.ts ← /api/test-interpret
    ├── psy-autopsy.ts    ← /api/psy-autopsy
    ├── psy-oracle.ts     ← /api/psy-oracle
    └── psy-weekly-report.ts
```

### Endpoints más importantes
```
GET  /api/healthz                    → Health check
POST /api/psy-chat                   → { message, history, systemPrompt } → Gemini AI
POST /api/chat                       → Chat widget IA
GET  /api/proxy/kraken/ohlc          → BTC OHLC semanal/diario
GET  /api/proxy/kraken/price         → BTC precio live
GET  /api/proxy/okx/candles          → OKX SWAP velas diarias
GET  /api/proxy/okx/oi               → Open Interest
GET  /api/proxy/coinbase/price       → Coinbase BTC spot
GET  /api/whale-intel/traders        → Datos traders para whale-alert
GET  /api/signals                    → Señales de trading
GET  /api/admin/config               → Config API keys (admin)
POST /api/members                    → Crear miembro
GET  /api/members                    → Listar miembros
```

### APIs disponibles (NO usar Binance ni CoinGecko)
```
✅ Kraken    → geo-libre
✅ OKX       → geo-libre
✅ Coinbase  → geo-libre
✅ Etherscan → ETHERSCAN_API_KEY
✅ CMC       → CMC_API_KEY
✅ Coinglass → COINGLASS_API_KEY
✅ 1inch     → ONEINCH_API_KEY
✅ Gemini AI → GEMINI_API_KEY
✅ Anthropic → ANTHROPIC_API_KEY
❌ Binance   → GEO-BLOQUEADO (451)
❌ CoinGecko → requiere key de pago
```

---

## 📱 ARTIFACT: artifacts/tap-dot — APP MÓVIL

```
Bundle ID: com.psychometriks.app
Publicada como: "PSYCHOMETRIKS" en App Store

Tabs:
├── Dashboard  → BTC live + mercado
├── Screener   → 50 cryptos + PSY-ULT1
├── Señales    → Feed de señales
├── Journal    → Diario (AsyncStorage)
└── Perfil     → Perfil + plan + PSY VAULT

PSY VAULT móvil: PIN 6 dígitos (djb2 hash) → seeds 12 palabras, clave privada, recovery key

Deploy: eas update --branch production (EXPO_TOKEN no configurado, se hace manual)
```

---

## 🎓 ARTIFACT: artifacts/aula-psychometriks — AULA VIRTUAL

```
URL: /aula/
Build: PORT=19461 BASE_PATH=/aula-psychometriks/ pnpm --filter @workspace/aula-psychometriks run build

CRÍTICO — Merge order en src/data/index.ts:
  contentEnriched y contentAllVisuals → PRIMERO
  contentChartsModules y contentVisualCharts → AL FINAL
  (Los gráficos siempre ganan sobre texto plano)

Módulos de contenido:
├── content-n1.ts   → Nivel 1
├── content-n2.ts   → Nivel 2
├── content-n3.ts   → Nivel 3
├── content-n4n5.ts → Niveles 4-5
├── content-n6n7.ts → Niveles 6-7
└── index.ts        → Merge de todo el contenido

Charts disponibles (NO BORRAR):
AMDChart, BOSChart, CandleAnatomyChart, CandleChart, CandlePatternsGrid,
ChartPatternsChart, CRTChart, ElliottWaveChart, FibChart, FibLevelsChart,
HarmonicChart, IndicatorCharts, LiquidityAbsorptionChart, LiquidityMapChart,
MAG7Chart, OrderBlockFVGChart, SessionChart, StructureChart, SweepDestroyChart,
WyckoffChart
```

---

## 💰 PLANES / PRICING

| Plan DB | Alias | Rank | Precio | Acceso |
|---------|-------|------|--------|--------|
| exchange | — | 0.5 | $0 | Solo Exchange + Wallet |
| aprendiz | basico | 1 | $5/mes | Aula only |
| basico | — | 1 | $9/mes | Dashboard + Herramientas básicas |
| educacion | — | 2 | $29/mes | + Replay + Calendar + Leaderboard |
| trader | pro | 3 | $49/mes | + LiqMap PRO completo |
| institucional | elite | 4 | $99/mes | + Todo: Whale, Oracle, Bot X |

---

## 🌐 CLOUDFLARE — _worker.js

```
Rutas que maneja el worker:
/api/proxy/signals/altcoins → Railway signals server (server-to-server, sin CORS)
/api/*                      → Railway API server
resto                       → env.ASSETS.fetch (assets estáticos)

Archivos críticos en public/:
├── _worker.js    ← Worker Cloudflare Pages
└── _redirects    ← Redirect rules SPA (/* → /index.html 200)
```

---

## 🔑 SECRETS disponibles (no mostrar valores)

```
ANTHROPIC_API_KEY    → IA Anthropic (Claude)
CMC_API_KEY          → CoinMarketCap
COINGLASS_API_KEY    → Coinglass (OI, funding)
ETHERSCAN_API_KEY    → Etherscan on-chain
GEMINI_API_KEY       → Google Gemini AI (psy-chat)
ONEINCH_API_KEY      → 1inch DEX
RESEND_API_KEY       → Emails transaccionales
SESSION_SECRET       → JWT session
SUPERADMIN_PASSWORD  → Admin principal
SUPERADMIN_PASSWORD_2→ Admin secundario
DATABASE_URL         → PostgreSQL
```

---

## ⚠️ ERRORES PRE-EXISTENTES (ignorar — no son nuestros)

```
ModuleRenderer.tsx líneas 520/525 → TS2538 (type used as index)
signals-realtime.tsx línea 820    → TS7030 (not all paths return value)
psy-wallet.tsx                    → EIP1193Provider type
spinner.tsx                       → VoidOrUndefinedOnly
PostCSS @import order warning en dev → cosmético, no afecta build
```

---

## 📋 REGLAS PERMANENTES (resumen)

1. **Preguntar SIEMPRE antes de cambiar** — proponer qué, por qué, y riesgo
2. **Páginas nuevas no reemplazan nada** — se agregan en nivel acordado
3. **Todo lo nuevo requiere nivel de autorización** — definir plan antes de construir
4. **NUNCA quitar un gráfico. SIEMPRE agregar más**
5. **Borrado solo con aprobación explícita** y justificación de duplicado exacto
6. **IA puede proponer ideas** — siempre con consenso antes de ejecutar
7. **Toda feature nueva aparece en /pricing** bajo el plan correcto
8. **Alertar cuando una decisión es errónea** — antes de ejecutar
9. **Análisis de impacto completo en cada modificación**
10. **Web y app SIEMPRE van a la par** — psychometriks + tap-dot sincrónicos

---

## 🆕 CAMBIOS RECIENTES (Mayo 2026)

### whale-alert.tsx — REDISEÑADO
- Tab principal renombrado a `📊 OI FLOW` (era "COPY TRADING")
- Tab por defecto: `copy`
- `SystemWinRateBanner` — win rate del sistema con datos MTM
- `TelegramAlertCard` — tarjetas estilo Telegram (emoji icono, badge tipo, "⚡ GRANDE" animado)
- `TraderCard` — cabecera exchange + LONG/SHORT badge + barra win rate + grilla ENTRADA/TP/SL
- `fmtPrice` — helper para precios de alta precisión
- Barra de consenso multi-DEX con porcentajes

### command-center.tsx — NUEVO (Elite)
- Ruta: `/command-center`
- Plan: Elite
- 5 secciones: OVERVIEW · SCANNER · PORTFOLIO · OI TRACKER · PSY AI
- OVERVIEW: BTC/ETH precios reales (Kraken/OKX) + Fear&Greed + Elliott Wave + Wyckoff + PSY Bias
- SCANNER: 15 pares OKX · PSY Score 0-100 · RSI · señal BUY/SELL/NEUTRAL
- PORTFOLIO: tracker localStorage · donut SVG · PnL tiempo real
- OI TRACKER: barras OI por exchange · L/S ratio · funding · desde `/api/whale-intel/traders`
- PSY AI: chat `/api/psy-chat` · 5 prompts rápidos · PSY Score Engine panel

