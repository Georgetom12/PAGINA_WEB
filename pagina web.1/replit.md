# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks y Zod schemas desde OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema (solo dev)
- `pnpm --filter @workspace/api-server run dev` — correr API server local

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## User preferences — REGLAS PERMANENTES (sin excepción)

### REGLA 1 — Preguntar SIEMPRE antes de cambiar
Antes de ejecutar CUALQUIER cambio (código, rutas, gráficos, componentes, nav, lógica, estilos) presentar al usuario la propuesta con: qué se cambia, motivo a favor (Sí) y posible impacto (No/riesgo). Sin aprobación explícita, NO se ejecuta.

### REGLA 2 — Páginas nuevas no reemplazan nada
Toda página nueva se agrega en el nivel acordado con el usuario previamente. No se toca ninguna página o ruta existente. La página nueva se adapta automáticamente a: Railway (api-server si necesita backend), GitHub si aplica, y la app móvil Expo — todo en sincronía con el código que funciona actualmente. Nivel y acceso se acuerdan primero.

### REGLA 3 — Todo lo nuevo requiere nivel de autorización
Toda página, función o herramienta nueva tiene asignado un plan de acceso (aprendiz / trader / institucional / elite / admin). Ese nivel se acuerda con el usuario antes de construir. No existe funcionalidad nueva sin plan de acceso definido.

### REGLA 4 — NUNCA quitar un gráfico. SIEMPRE agregar más
Está prohibido eliminar cualquier gráfico existente. Cuando se detecte una oportunidad de agregar visualizaciones que eleven la calidad y eficiencia de la plataforma, se propone al usuario. El estándar es la excelencia, no la mediocridad.

### REGLA 5 — Toda información nueva se respalda; reglas exactas de eliminación
- **SÍ se puede borrar:** contenido exactamente duplicado (ej. lo que esté repetido en un ZIP anterior), o una página SIN gráficos que ya fue reemplazada por una versión actualizada con los mismos datos.
- **NO se puede borrar:** ninguna página que contenga gráficos aunque esté desactualizada — quitarla significaría trabajo doble para recuperar esas visualizaciones.
- Lo que no se borra se almacena y puede reutilizarse en proyectos futuros.
- Todo borrado requiere aprobación explícita del usuario con justificación de duplicado exacto.

### REGLA 6 — La IA puede proponer ideas que engrandezcan la plataforma
Se autoriza al agente a proponer ideas propias que eleven la plataforma y demuestren su capacidad. Toda propuesta requiere consenso con el usuario antes de ejecutarse. Se busca crear algo que refleje excelencia técnica real, no soluciones mediocres.

### REGLA 7 — Toda página nueva aparece en /pricing según su plan
Cada vez que se crea una página o feature nueva, debe agregarse automáticamente en la página de precios (`/pricing`) bajo el plan correcto (Básico / Educación / Pro / Elite). El ítem debe tener ícono, nombre y descripción corta. No se entrega ninguna feature nueva sin que esté visible en pricing.

### REGLA 8 — Alertar siempre cuando una decisión es errónea
Si el agente detecta que una decisión tomada por el usuario (arquitectura, flujo, acceso, tecnología, lógica de negocio, seguridad) es incorrecta, riesgosa o va a generar problemas, DEBE decírselo con claridad antes de ejecutar: explicar el problema concreto, el impacto real que puede tener, y una alternativa mejor si existe. No se ejecuta en silencio algo que se sabe que está mal.

### REGLA 9 — Análisis de impacto completo en cada modificación
Antes de entregar cualquier cambio (código, ZIP, build, ruta, componente, archivo de deploy), el agente DEBE revisar qué otros archivos, rutas, comportamientos o flujos pueden verse afectados por esa modificación. No se entrega nada sin haber verificado que lo que funcionaba antes sigue funcionando. Arreglar una cosa y romper otra no es aceptable. El checklist mínimo por cada cambio:
1. ¿Qué archivos toca directamente este cambio?
2. ¿Qué otros archivos importan o dependen de esos archivos?
3. ¿El build de producción sigue siendo correcto? (`build:netlify` para web)
4. ¿El `_worker.js` y `_redirects` están correctamente copiados al dist antes del ZIP?
5. ¿Las rutas SPA siguen funcionando en producción (Cloudflare)?
6. ¿El ZIP generado usa `BASE_PATH=/` (no `/psychometriks/`)?

### Reglas adicionales previas (siguen vigentes)
- **Web y app SIEMPRE van a la par.** Cambio en `artifacts/psychometriks` → también en `artifacts/tap-dot`, y viceversa. No se entrega uno sin el otro.
- Expo se publica manualmente con `eas update --branch production` (EXPO_TOKEN no configurado).
- Hacer las cosas bien y a conciencia. No asumir — preguntar cuando hay dudas.
- No omitir nada del resumen cuando se informa al usuario de cambios.

## Artifacts

### artifacts/psychometriks — PSYCHOMETRIKS Landing (React + Vite)
Spanish crypto trading platform landing site.

**Access levels (App.tsx Guard):**
- **Público** (sin login): `/`, `/pricing`, `/login`, `/blog`, `/blog/:slug`, `/tests`, `/tests/:testId`, `/descarga`, `/onboarding`, `/verify/:certCode`, `/api-docs`, `/indicators`
- **Básico** (cualquier miembro): `/dashboard`, `/calculadora`, `/converter`, `/simulador`, `/pre-entry`, `/adn-trader`, `/costo-errores`, `/journal`, `/psy-autopsy`, `/certificado`, `/challenge`, `/affiliate`, `/psy-token`, `/boveda`, `/signals`, `/replay`, `/economic-calendar`, `/leaderboard`, `/aula`
- **Exchange** (plan exchange o superior): `/exchange`, `/psy-wallet`
- **Pro** (trader/pro o superior — LiqMap PRO): `/heatmap`, `/funding`, `/liquidations`, `/screener`, `/macro`, `/spot-perp`, `/ciclos-btc`, `/fed-btc`, `/market-hours`, `/psy-score`, `/war-room`, `/psy-feed`
- **Elite** (institucional/elite — LiqMap ELITE): `/whale-alert`, `/bolsa`, `/altcoins-signals`, `/equities`
- **Admin only**: `/realtime`, `/bot-x`

**Plan system (DB):** `aprendiz` $5 (Aula only) · `trader` $49 · `institucional` $99 (todo + Bot X)
**Plan rank mapping (auth.ts):** aprendiz=basico=1, educacion=2, trader=pro=3, institucional=elite=4

**Routes:**
- `/` — Home · `/tests` — Tests hub · `/blog` — Blog (15 artículos SEO) · `/pricing` — Planes
- `/login` — Login (JORGE-2026 / JORGE-ADMIN-2026 para admin)
- `/psy-wallet` — DEX exchange · `/boveda` — PSY VAULT (AES-256-GCM, PIN, seeds, 2FA)
- `/admin/apis` — Admin API key management (DB-backed, 12 keys)
- **LiqMap:** `/spot-perp`, `/ciclos-btc`, `/fed-btc`, `/whale-alert`, `/market-hours`, `/heatmap`, `/funding`, `/liquidations`, `/screener`, `/macro`, `/war-room`, `/psy-score`
- **Herramientas:** `/challenge`, `/affiliate`, `/api-docs`, `/certificado`, `/psy-token`, `/simulador`, `/psy-autopsy`, `/pre-entry`, `/adn-trader`, `/costo-errores`, `/journal`, `/replay`, `/calculadora`, `/converter`, `/economic-calendar`, `/leaderboard`

**API URL pattern (CRITICAL):** Browser fetches MUST use absolute paths like `/api/proxy/kraken/ohlc`. NEVER use `${BASE_URL}/api/...` — BASE_URL points to Vite server, not api-server.

**Auth:** `psyko_auth` localStorage `{ user, role, plan, token, ts }`. Roles: superadmin (admin/MASTER99), operator (DB), member (DB + plan). Admin password: JORGE-ADMIN-2026.

**Key data files:**
- `src/data/tests.ts` — 3 tests, 14 profiles total, scoring logic
- `src/data/blog-posts.ts` — 15 blog articles (SEO-optimized Spanish)
- `src/components/site-nav.tsx` — Nav with Tests/LiqMap/Herramientas dropdowns
- `src/lib/auth.ts` — Plan rank system (maps both old and DB plan names)

### artifacts/aula-psychometriks — PSYCHOMETRIKS Aula Virtual
Members-only learning platform at `/aula/`. Same auth pattern.

**CRÍTICO — Merge order en `src/data/index.ts`:** `contentEnriched` y `contentAllVisuals` van PRIMERO. `contentChartsModules` y `contentVisualCharts` van AL FINAL para que los gráficos siempre ganen sobre el texto plano. No cambiar este orden sin preguntar al usuario.

### artifacts/tap-dot — PSYCHOMETRIKS Mobile App (Expo/React Native)
Full mobile trading app. Published as "PSYCHOMETRIKS" on App Store.

**Tabs:** Dashboard (BTC live + market), Screener (50 cryptos + PSY-ULT1), Señales (signals feed), Journal (trading diary con AsyncStorage), Perfil (profile + plan + PSY VAULT).

**PSY VAULT mobile:** VaultCard in PERFIL tab → Modal with PIN keypad (6 digits, djb2 hash, AsyncStorage) → seed phrase (12 words masked), private key (hex masked), recovery key (masked).

**Bundle ID:** com.psychometriks.app

### artifacts/api-server — API Server
Express 5 API. Routes for chat widget (Gemini AI), admin config (DB-backed), and market proxy.

**Market proxy routes** (all geo-unblocked):
- `/api/proxy/kraken/ohlc` — BTC weekly/daily OHLC · `/api/proxy/kraken/price` — BTC live ticker
- `/api/proxy/okx/candles` — OKX SWAP daily candles · `/api/proxy/okx/oi` — Open interest
- `/api/proxy/coinbase/price` — Coinbase BTC spot · `/api/admin/config` — API key management

**Note:** Binance (451 geo-blocked) y CoinGecko (401 needs key) NO funcionan. Usar Kraken + OKX + Coinbase.

**Cloudflare `_worker.js`:** proxy `/api/proxy/signals/altcoins` → Railway signals server (server-to-server, sin CORS). Resto de `/api/*` → Railway API server. Fallback → `env.ASSETS.fetch`.

### artifacts/trading-chat — Asesor Trading IA
AI-powered trading advisor chat interface.

## Gotchas

- Aula build requiere: `PORT=19461 BASE_PATH=/aula-psychometriks/ pnpm --filter @workspace/aula-psychometriks run build`
- ZIP para Cloudflare Pages se genera con `python3` (no hay `zip` disponible en el entorno)
- `_worker.js` y `_redirects` deben copiarse manualmente a `dist/public/` antes de crear el ZIP del web
- Señales altcoins: funcionan vía `_worker.js` proxy, no desde el api-server directamente

## Known Pre-existing Errors (ignore)
- `ModuleRenderer.tsx` lines 520/525: TS2538 (type used as index)
- `signals-realtime.tsx` line 820: TS7030 (not all paths return value)
- PostCSS `@import` order warning in dev (cosmetic, doesn't affect build)
