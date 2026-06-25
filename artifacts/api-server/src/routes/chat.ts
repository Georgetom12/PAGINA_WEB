import { Router, Request, Response } from "express";
import { db, chatMessagesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router = Router();

// ═══════════════════════════════════════════════════════════════
// FAQ DATABASE  ─  Respuestas predefinidas de trading en español
// ═══════════════════════════════════════════════════════════════
interface FaqEntry {
  keywords: string[];
  answer: string;
  category: string;
}

const FAQ: FaqEntry[] = [
  // ── PSYCHOMETRIKS — PLATAFORMA ────────────────────────────
  {
    keywords: ["psychometriks", "que es psychometriks", "qué es psychometriks", "la plataforma", "psycho", "psicometriks"],
    category: "PSYCHOMETRIKS",
    answer: `**PSYCHOMETRIKS — Trading Intelligence Suite**\n\nPSYCHOMETRIKS es una plataforma de trading institucional que te enseña a leer el mercado como lo hace el dinero inteligente — no como lo hacen las masas.\n\n**Lo que ofrece:**\n• **Suite de 9 indicadores exclusivos** para TradingView (indicadores institucionales avanzados)\n• **Aula PSYCHOMETRIKS** — educación de cero a nivel institucional\n• **Análisis diario** publicado en Telegram y TikTok\n• **Comunidad privada** de traders\n\n**La filosofía:** No venden señales. Enseñan a leer el mercado con las mismas herramientas que usan los institucionales: Whale Flow, CVD, OI, Funding, Ondas de Elliott, Order Blocks y más.\n\n🌐 **psychometriks.trade**`,
  },
  {
    keywords: ["suite", "suite de indicadores", "9 indicadores", "indicadores psy", "indicadores tradingview", "acceso invite", "invite only"],
    category: "PSYCHOMETRIKS",
    answer: `**Suite de Indicadores PSYCHOMETRIKS**\n\nNueve indicadores institucionales para TradingView, publicados con acceso privado por invitación.\n\n**Los 9 indicadores:**\n• **PSY-PULSE** — Score 0-100: Whale Flow + Liquidaciones + Sentimiento. El termómetro del mercado\n• **PSY-SMD (Smart Money)** — CVD + OI + Funding. Detecta manipulación institucional y squeezes antes de que ocurran\n• **PSY-EW (Elliott Waves)** — Detección automática de ondas ABC con targets Fibonacci en tiempo real\n• **PSY-MCI (Macro Crisis Index)** — VIX + DXY + Oil + Gold + SPX. Detecta regímenes de crisis macro antes de que impacten el crypto\n• **PSY-LVD (Liquidity Vacuum)** — Detecta zonas de vacío de liquidez. Cajas azules activas, grises mitigadas. Imanes de precio\n• **PSY-ZONES (Order Blocks)** — Order blocks institucionales, FVGs y sweeps de liquidez con lógica de redraw completa\n• **PSY-ORACLE (Oráculo MTF)** — Bias 1M/1W + Fibonacci inteligente + divergencias RSI/MFI/MACD. La brújula del mercado\n• **WHALE PRO (Whale Flow)** — Clasificación multicriteria de ballenas: RVOL + posición de vela + percentil de volumen\n• **FUSION MASTER v3** — 4 módulos en uno: Macro Global + Oracle MTF + SMC + Fibonacci. Motor de consenso\n\n**Acceso:** El pago se realiza externamente y el administrador activa manualmente el acceso a TradingView. Planes disponibles en **psychometriks.trade/precios**`,
  },
  {
    keywords: ["psy-pulse", "pulse panel", "psypulse"],
    category: "PSYCHOMETRIKS",
    answer: `**PSY-PULSE — Pulse Panel**\n\nEl termómetro del mercado PSYCHOMETRIKS. Genera un **score compuesto de 0 a 100** combinando:\n\n• **Whale Flow** — flujo neto de ballenas\n• **Liquidaciones** — presión de liquidaciones en el mercado\n• **Sentimiento** — estado emocional del mercado\n\n**Cómo interpretarlo:**\n• Score alto (70-100) → mercado en modo alcista / bullish\n• Score neutro (40-60) → indecisión, espera confluencias\n• Score bajo (0-30) → presión bajista, cautela\n\nEl PSY-PULSE funciona en **múltiples módulos simultáneamente**, dándote una lectura holística del mercado en un solo panel.\n\nIncluido en los planes **Trader ($49/mes)** e **Institucional ($99/mes)**.`,
  },
  {
    keywords: ["psy-smd", "smart money", "psysmd", "manipulacion institucional"],
    category: "PSYCHOMETRIKS",
    answer: `**PSY-SMD — Smart Money Detector**\n\nDetecta **manipulación institucional** y squeezes antes de que ocurran, combinando tres señales clave:\n\n• **CVD (Cumulative Volume Delta)** — presión real de compras vs ventas\n• **OI (Open Interest)** — posicionamiento de contratos abiertos\n• **Funding Rate** — costo de mantener posiciones en futuros perpetuos\n\n**Regímenes que detecta:**\n• **SLSQZ (Squeeze)** → mercado comprimido, listo para un movimiento fuerte\n• **BULL** → presión compradora institucional dominante\n• **BEAR** → distribución o ventas institucionales\n• **NEUTRAL** → sin dirección clara\n\nIdeal para **anticipar movimientos** antes de que el precio lo refleje. Uno de los indicadores más potentes de la suite.`,
  },
  {
    keywords: ["psy-mci", "macro crisis index", "psymci", "crisis macro", "vix dxy"],
    category: "PSYCHOMETRIKS",
    answer: `**PSY-MCI — Macro Crisis Index**\n\nEl único indicador de la suite que mira **más allá del crypto** para detectar regímenes de crisis macro antes de que impacten tus posiciones.\n\n**Datos que combina:**\n• **VIX** — índice del miedo del mercado tradicional\n• **DXY** — fortaleza del dólar americano\n• **Oil (Petróleo)** — commodities como proxy de riesgo\n• **Gold (Oro)** — activo refugio\n• **SPX (S&P 500)** — salud del mercado de acciones\n\n**Por qué importa:** El crypto no existe en una burbuja. Cuando el VIX dispara, el DXY sube o el SPX colapsa, el crypto generalmente sigue. El PSY-MCI te da **aviso temprano** de esos regímenes.\n\n🔵 **Categoría:** Macro Global`,
  },
  {
    keywords: ["psy-ew", "elliott waves", "ondas elliott", "psyew", "ondas de elliott"],
    category: "PSYCHOMETRIKS",
    answer: `**PSY-EW — Elliott Waves**\n\nDetección **automática** de ondas de Elliott (ABC) con targets proyectados en tiempo real usando niveles de Fibonacci.\n\n**Qué hace:**\n• Identifica la estructura de ondas actual (impulsiva o correctiva)\n• Proyecta targets alcistas y bajistas con Fibonacci automático\n• Trabaja en tiempo real sin necesidad de conteo manual\n\n**Las Ondas de Elliott en crypto:** El mercado sigue patrones de comportamiento colectivo predecibles. Una impulso de 5 ondas va seguido de una corrección de 3 ondas (ABC). El PSY-EW automatiza ese conteo.\n\n🔵 **Categoría:** Estructura de mercado`,
  },
  {
    keywords: ["psy-zones", "order blocks", "psyzones", "fvg", "fair value gap", "smc ict", "smart money concept"],
    category: "PSYCHOMETRIKS",
    answer: `**PSY-ZONES — Order Blocks**\n\nIdentifica automáticamente las zonas institucionales más importantes del gráfico:\n\n• **Order Blocks (OB)** — zonas donde los institucionales colocaron órdenes masivas\n• **FVGs (Fair Value Gaps)** — huecos de liquidez que el precio tiende a llenar\n• **Sweeps de liquidez** — barridos de stops antes de un movimiento real\n• **Lógica de redraw completa** — los bloques se actualizan cuando son mitigados\n\n**Metodología:** Basado en SMC (Smart Money Concepts) / ICT — la metodología institucional más popular en el trading moderno.\n\n**Uso:** Estos niveles funcionan como soportes/resistencias de alta probabilidad. Las entradas dentro de un OB no mitigado tienen excelente ratio riesgo/beneficio.`,
  },
  {
    keywords: ["fusion master", "fusion v3", "fusionmaster"],
    category: "PSYCHOMETRIKS",
    answer: `**FUSION MASTER v3 — El Motor de Consenso**\n\nEl indicador más completo de la suite: **4 módulos en uno** que trabajan juntos como un motor de consenso.\n\n**Módulos incluidos:**\n1. **Macro Global** — datos macro que afectan al crypto (VIX, DXY, correlaciones)\n2. **Oracle MTF (Multi-TimeFrame)** — bias del mercado en múltiples marcos temporales simultáneamente\n3. **SMC (Smart Money Concepts)** — zonas institucionales y estructura de mercado\n4. **Fibonacci** — niveles automáticos de extensión y retroceso\n\n**Por qué es especial:** En lugar de usar cada indicador por separado, el FUSION MASTER los combina y genera un **consenso**: cuando todos los módulos apuntan en la misma dirección, tienes una confluencia de alta probabilidad.\n\n🟣 **Etiqueta:** FUSION v3`,
  },
  // ── AULA PSYCHOMETRIKS ────────────────────────────────────
  {
    keywords: ["aula", "educacion", "educación", "curso", "cursos", "aprender", "modulos", "módulos", "aula psychometriks"],
    category: "Educación",
    answer: `**El Aula PSYCHOMETRIKS**\n\n*"No vendemos señales. Enseñamos a leer el mercado. Desde cero hasta nivel institucional."*\n\n**8 módulos de contenido:**\n• **01** Fundamentos Crypto & Forex — Sessions, estructura, timeframes\n• **02** Price Action & Velas — 22 patrones + contexto\n• **03** Fibonacci Avanzado — 13 capítulos + extensiones Segan\n• **04** SMC / ICT / Wyckoff — Order blocks, FVGs, acumulación\n• **05** CVD + OI + Funding — Matriz de 4 regímenes institucionales\n• **06** Ondas de Elliott — ABC, impulsos, conteo práctico\n• **07** Gestión de Riesgo — Tamaño de posición, R:R, psicología\n• **08** Uso completo de la Suite PSY — Todos los indicadores en la práctica\n\n**Incluye también:**\n• 12 manuales descargables PDF + HTML\n• Sesiones en vivo por Telegram\n• Análisis diario incluido\n• Acceso de por vida al contenido base\n• Comunidad privada de traders\n\n📚 Acceso con plan **Aprendiz ($5/mes)** o superior.`,
  },
  // ── PLANES Y PRECIOS ──────────────────────────────────────
  {
    keywords: ["precio", "precios", "plan", "planes", "cuanto cuesta", "cuánto cuesta", "membresia", "membresía", "suscripcion", "suscripción", "basico", "educacion", "pro plan", "elite plan"],
    category: "Planes",
    answer: `**Planes PSYCHOMETRIKS — Sin contratos, sin sorpresas**\n\nCancela cuando quieras. Empieza hoy.\n\n**// NIVEL 1 — Básico · $9/mes** ($59 lifetime)\n• Aula Virtual — Niveles 1 al 3\n• Fundamentos, lectura de precio y velas\n• Introducción al Smart Money Concepts\n• Soporte por Telegram\n\n**// NIVEL 2 — Educación · $29/mes** ($179 lifetime)\n• Aula Virtual completa — 8 niveles\n• 44+ módulos desde cero hasta avanzado\n• SMC, Macro, Técnico, Gestión de Riesgo\n\n**// NIVEL 3 — Pro · $49/mes** ($299 lifetime) ⭐ MÁS POPULAR\n• Todo del plan Educación\n• LiqMap PRO — mapa de liquidaciones 24/7\n• Señales BTC / ETH / SOL en vivo\n• Score PSY + Indicadores institucionales\n• Funding Rate · Fear & Greed · Open Interest\n\n**// NIVEL 4 — Elite · $99/mes** ($599 lifetime)\n• Todo del plan Pro\n• Mentoring personalizado (sesiones 1:1)\n• Bot X — análisis IA avanzado\n• Canal privado con señales prioritarias\n• Prioridad absoluta en soporte\n\n🌐 Más info y pago en **psychometriks.trade/precios**`,
  },
  // ── TELEGRAM Y ANÁLISIS ───────────────────────────────────
  {
    keywords: ["telegram", "canal telegram", "señales telegram", "unirse telegram", "comunidad"],
    category: "Comunidad",
    answer: `**Canal de Telegram PSYCHOMETRIKS**\n\nEl canal de Telegram es el centro de operaciones de la comunidad. Incluye:\n\n• **Análisis diario multi-timeframe** — lectura del mercado con los indicadores PSY en tiempo real\n• **Sesiones en vivo** — análisis en directo para miembros del aula\n• **Alertas del sistema** — cuando los indicadores detectan condiciones relevantes\n• **Lecturas de la suite PSY** — PSY-PULSE, PSY-SMD, PSY-MCI, PSY-EW publicadas diariamente\n\n**Ejemplo de lectura diaria:**\n• PSY-PULSE Diario: 67.7 → BULL\n• PSY-SMD Régimen: SLSQZ → SQUEEZE\n• PSY-MCI Macro: 4.7 → NEUTRAL\n• Acción sugerida: HOLDEAR / LONG\n\n🔗 Únete desde **psychometriks.trade** → botón TELEGRAM`,
  },
  {
    keywords: ["analisis diario", "análisis diario", "lectura diaria", "señal diaria", "tiktok"],
    category: "Comunidad",
    answer: `**Análisis Diario PSYCHOMETRIKS**\n\nPublicamos lectura **multi-timeframe diaria** en Telegram y TikTok — BTC, XAU/USD y meme coins — con los indicadores PSYCHOMETRIKS en tiempo real.\n\n**Formato de la lectura:**\n• PSY-PULSE 4H / Diario → score + bias\n• PSY-SMD Régimen → estado institucional (BULL/BEAR/SQUEEZE/NEUTRAL)\n• PSY-MCI Macro → nivel de riesgo macro\n• PSY-EW Target → objetivo de precio más probable\n• CVD + OI Señal → confluencia o espera\n• **Acción sugerida** → LONG / SHORT / HOLDEAR / ESPERAR\n\n**Disponible para:** todos los miembros activos (cualquier plan incluyendo Aprendiz).`,
  },
  // ── LIQMAP PRO ────────────────────────────────────────────
  {
    keywords: ["liqmap", "liqmap pro", "liq map", "dashboard trading", "bot trading", "bot automatico", "bot automático"],
    category: "LiqMap Pro",
    answer: `**LiqMap Pro — Dashboard de Trading Institucional**\n\nLiqMap Pro es la plataforma de datos y herramientas de trading de PSYCHOMETRIKS. Incluye:\n\n**📊 Sección DATA:**\n• Fear & Greed Index en tiempo real\n• Long/Short Ratio (Binance Perps 24h)\n• Dominancia BTC vs Altcoins\n• Mapa de Liquidaciones Estimadas\n• Profundidad del Order Book\n• Heatmap de Liquidez en tiempo real\n• CVD — Taker Buy vs Sell\n• Funding Rate & Open Interest\n• Correlación BTC vs Gold (48h)\n• Niveles clave de liquidación\n\n**📈 Sección TRADING:** Pares en tiempo real (Binance Futures, Bybit Perps, OKX Swap)\n\n**🤖 Sección BOT:** Bot de trading automático conectado a tus indicadores de TradingView (próximamente)\n\n**🎓 Sección AULA:** Acceso al contenido educativo\n\n**📊 Sección INDICADORES:** Scripts Pine Script exclusivos (en desarrollo)\n\nAcceso en **psychometriks.trade**`,
  },
  {
    keywords: ["bot trading automatico", "bot automatico trading", "bot de trading", "trading automatico", "trading automático", "bot vip", "bot pro", "bot basico", "lista de espera bot"],
    category: "LiqMap Pro",
    answer: `**Bot de Trading Automático — Próximamente**\n\nEl bot de LiqMap Pro ejecuta operaciones automáticamente conectado a tus señales de TradingView.\n\n**Planes del Bot:**\n\n🟢 **Bot Básico** (Lista de espera)\n• Alertas de funding rate\n• Alertas de liquidaciones masivas\n• 1 par (BTC/USDT)\n• Notificaciones Telegram\n• Acceso web básico\n\n🔵 **Bot Pro** (Lista de espera)\n• Todo del plan básico\n• Señales de entrada/salida automáticas\n• Top 10 pares + Multi-exchange (3)\n• Dashboard analytics\n• Soporte prioritario\n\n🟣 **Bot VIP** (Lista de espera)\n• Todo del plan Pro\n• Indicadores PSY incluidos\n• Análisis macro integrado\n• API personalizada\n• Consultoría 1:1 mensual\n• Acceso a beta features\n\n**Cómo funciona:** Se conecta a tu indicador de TradingView y lanza la operación automáticamente en el exchange vinculado (Binance, Bybit, OKX).\n\n📋 Regístrate en la lista de espera en **psychometriks.trade/bot**`,
  },
  {
    keywords: ["indicadores liqmap", "liqmap indicator", "smart volume pro", "momentum suite", "macro confluence", "smart money tracker", "full access pack", "pine script", "indicadores exclusivos"],
    category: "LiqMap Pro",
    answer: `**Indicadores Exclusivos LiqMap Pro** *(En Desarrollo — Próximamente)*\n\nScripts Pine Script desarrollados con lógica avanzada de liquidaciones, volumen institucional y momentum.\n\n🔴 **LiqMap Indicator**\n• Zonas de liquidación estimadas en el chart\n• Heatmap overlay en tiempo real\n• Niveles clave automáticos\n• Alertas de proximidad a zonas\n• Compatible múltiples exchanges\n\n🟡 **Smart Volume Pro**\n• CVD con señales de divergencia\n• Detección de absorción institucional\n• Volume Profile integrado\n• Alertas de anomalías de volumen\n\n🟣 **Momentum Suite**\n• Momentum MTF integrado\n• Funding rate overlay\n• Open Interest visual\n• Long/Short en tiempo real\n• Señales de entrada automáticas\n\n🔵 **Macro Confluence**\n• Correlación DXY, Nasdaq, Oro, S&P 500 en tiempo real\n• Eventos macro integrados\n\n🟠 **Smart Money Tracker**\n• Detección de órdenes ocultas (iceberg)\n• Large trades tracker\n• Whale activity alerts\n\n💎 **Full Access Pack** — Todos los indicadores actuales y futuros, acceso a versiones beta, soporte prioritario.\n\n🌐 Solicita acceso anticipado en **psychometriks.trade/indicadores**`,
  },
  // ── INDICADORES PSYCHOMETRIKS — MANUALES DETALLADOS ──────
  {
    keywords: ["institutional alpha", "alpha pro", "institutional alpha pro"],
    category: "Indicadores PSY",
    answer: `**INSTITUTIONAL ALPHA PRO — Manual v1.0**\n\nIndicador todo-en-uno para TradingView (Pine Script v6) que combina 12 módulos institucionales.\n\n**Los 12 módulos:**\n• **Datos Macro** — BTC Dom, USDT Dom, TOTAL 1/2/3, NDX, SPX en W y D\n• **RSI Micro+Macro** — RSI 14 en TF actual y diario simultáneamente\n• **Divergencias RSI** — detecta divergencias alcistas/bajistas automáticamente\n• **ADX Tendencia** — fuerza y dirección con DI+/DI-\n• **Sesiones Forex** — Tokio/Londres/NY/Overlap con fondo de color\n• **Kill Zones** — momentos de máxima liquidez institucional\n• **Money Flow (MFI)** — presión compradora/vendedora micro y macro\n• **Order Blocks** — zonas de distribución y acumulación por pivotes\n• **Fibonacci Auto** — retrocesos y extensiones sobre último impulso\n• **Velas Institucionales** — detecta velas de alta presión y absorción\n• **Score 0-100** — suma ponderada de todos los factores activos\n• **Zonas Confluencia** — caja de compra/venta cuando confluyen múltiples factores\n\n**Score 0-100:**\n• 75-100: BULL FUERTE → operar LONG con tamaño normal\n• 50-74: MODERADO → tamaño reducido o esperar confirmación\n• 25-49: BAJISTA → no nuevas entradas largas\n• 0-24: BEAR → evitar longs, hedgear o esperar fuera\n\n**Instalación:** Pine Script Editor → pegar código → sensibilidad de pivotes 10 (diario) o 5 (1H) → zona horaria UTC-5 para Américas → score mínimo 65 (o 75 para alta calidad).`,
  },
  {
    keywords: ["market correlation", "market correlation pro", "score macro", "altseason detector", "fear greed proxy"],
    category: "Indicadores PSY",
    answer: `**MARKET CORRELATION PRO — Manual v1.0**\n\nIndicador de correlación macro para TradingView que analiza en tiempo real las fuerzas que mueven el crypto.\n\n**Los 7 módulos:**\n• **BTC Dominancia** — % del mercado que controla BTC (CRYPTOCAP:BTC.D)\n• **ETH Dominancia** — fortaleza relativa de ETH\n• **USDT Dominancia** — miedo del mercado (stablecoins)\n• **DXY Dólar** — fuerza del dólar vs canasta de monedas\n• **NASDAQ / S&P 500** — estado del mercado de acciones\n• **TOTAL 1/2/3** — capitalización total de crypto\n• **Fear & Greed** — sentimiento calculado por RSI+Vol+ATR+Momentum\n\n**Dashboard de 6 columnas:** Activo · W (semanal) · D (diario) · TF actual · Score 0-100 · Señal\n\n**Score Macro 0-100:**\n• 75-100: BULL FUERTE → operar LONG con confianza\n• 50-74: ALCISTA → gestión normal\n• 25-49: BAJISTA → reducir tamaño\n• 0-24: BEAR FUERTE → evitar longs\n\n**Fear & Greed propio:**\n• 75-100: Codicia Extrema → precaución\n• 55-74: Codicia → mantener posiciones\n• 45-54: Neutral → esperar\n• 25-44: Miedo → evaluar entrada gradual\n• 0-24: Miedo Extremo → zona de máxima oportunidad histórica (DCA agresivo)\n\n**Altseason Detector:**\n• BTC Season: BTC Dom > 55% → concentrarse en BTC\n• ETH Season: ETH Dom > 18% + BTC Dom < 52% → ETH lidera\n• ALTSEASON: BTC Dom < 45% + Alt Dom > 25% → todas las alts suben\n• Transición: esperar definición`,
  },
  {
    keywords: ["pace pro", "pace pro sniper", "segan destroy", "wyckoff pace", "sniper v2"],
    category: "Indicadores PSY",
    answer: `**PACE PRO SNIPER v2 — All-In-One Institutional Trading Decoder**\n\nCombina Wyckoff + Market Structure + FX Institutional + Macro Correlation + Segan Destroy.\n\n**Componentes principales:**\n• Market Structure (BOS/CHoCH), Wyckoff Engine, Order Blocks, FVGs\n• Fibonacci Avanzado (niveles normales + neutralización + Segan Destroy)\n• RSI Dual (macro 21 + micro 7), ADX+DMI, Money Flow (MFI), Delta Volumen\n• VWAP, Detección de Stop Hunts, Sesiones y Kill Zones\n• Macro Correlation (BTC.D, ETH.D, DXY, NASDAQ, S&P)\n• Intent Score 0-100\n\n**Teoría Segan Destroy de Fibonacci:**\nCuando el precio destruye todos los niveles normales de Fibonacci y entra en extensiones negativas:\n• Destroy -1.1 (-110%): Agotamiento inicial → reversión esperada\n• Destroy -1.27 (-127%): Agotamiento profundo → reversión forzada\n• Destroy -1.618 (-162%): Agotamiento máximo → reversión máxima\n\n**Regla Segan:** En zona Destroy el precio NUNCA debería continuar indefinidamente. Los market makers han liquidado todas las posiciones posibles y el precio debe regresar a niveles normales.\n\n**Las 4 tablas del dashboard:**\n1. SEÑAL MAESTRA (Score, dirección, SL/TP Fibonacci, sesión)\n2. WYCKOFF (fase, esquema, eventos Spring/UTAD/SOS/SOW)\n3. MACRO (BTC.D, DXY, altseason, alineación)\n4. ESTRUCTURA (BOS, CHoCH, EMAs, patrones activos)`,
  },
  {
    keywords: ["v6.6", "oraculo master", "oráculo master", "psy v6", "veredicto", "tabla veredicto", "7 modulos score"],
    category: "Indicadores PSY",
    answer: `**PSYCHOMETRIKS v6.6 — Oráculo Master Suite**\n\nEl indicador más completo de la suite. Sistema de scoring de 7 módulos × 100 pts con datos en tiempo real de Binance Perpetuals.\n\n**Capacidades:**\n• CVD Real + OI Real (Binance Perpetuals)\n• Fear & Greed automático via CRYPTOCAP:FNG\n• Kill Zones con pesos dinámicos (London/NY/Overlap/Asia)\n• Filtro de noticias (NFP/FOMC/CPI) con penalizaciones automáticas\n• Fibonacci automático con TP/SL direccionales LONG/SHORT\n• Régimen de mercado: TRENDING / RANGING / TRANSICIÓN (via ADX)\n\n**Tabla A — Veredicto:**\n• ≥75: LONG CONFIRMADO\n• 62-74: LONG MODERADO\n• 50-61: NEUTRO/ESPERAR\n• 38-49: PRESIÓN BAJISTA\n• <38: SHORT/PELIGRO\n\n**Fibonacci AUTO v2:**\nEntrada en Golden Zone 0.618-0.705, SL bajo swing low, TP1 (1.272), TP2 (1.618), TP3 (2.618). R:R mínimo configurable (default 2.0).\n\n**Filtro de noticias:**\n• NFP/FOMC: -25 puntos al veredicto automáticamente\n• CPI: -10 puntos\n• Un veredicto de 72 (LONG MODERADO) pasa a 47 (NEUTRO) en día de FOMC\n\n**Tabla B:** Estructura de mercado (BOS, CHoCH, EMAs, CRT/AMD, IPDA 40D, patrones)\n**Tabla C:** On-chain/Flujo (Multi-TF, OI Real, CVD, ADX, Whale Detector, Macro)`,
  },
  {
    keywords: ["bid pro", "bid dashboard", "order book tiempo real", "barreras order book", "profundidad book"],
    category: "LiqMap Pro",
    answer: `**PSYCHOMETRIKS BID PRO v2.0 — Dashboard de Order Book**\n\nDashboard conectado a Binance en tiempo real que muestra la profundidad del mercado.\n\n**Pares disponibles:** BTC, ETH, SOL, BNB, XRP, DOGE, ADA, AVAX, LINK, DOT\n\n**Métricas en tiempo real:**\n• Precio Mid actual + cambio\n• Bid Total / Ask Total (profundidad 20 niveles)\n• Ratio B/A — balance comprador/vendedor\n• Order Book completo (Bids y Asks con barras de volumen)\n• Spread y % de spread\n\n**Barreras detectadas:** Niveles de precios con alta concentración de órdenes. Clasificadas por fuerza: STRONG / MEDIUM / WEAK. Las barreras alcistas actúan como soportes, las bajistas como resistencias.\n\n**CVD por Exchange:** Profundidad relativa de compra/venta en cada exchange conectado.\n\n**Agotamiento del Bid:** Mide cuánto del lado comprador se ha consumido — útil para anticipar reversiones.\n\n**Pressure bar:** Barra visual de presión compradora vs vendedora en tiempo real.\n\nAccesible desde LiqMap Pro → sección DATA en **psychometriks.trade**`,
  },
  {
    keywords: ["cvd completo", "delta agresivo", "delta pasivo", "taker comprador", "taker vendedor", "divergencia cvd"],
    category: "Análisis Técnico",
    answer: `**CVD Completo — Cumulative Volume Delta**\n\n**Fórmula del Delta:**\nDelta = Volumen de Compra Agresivo − Volumen de Venta Agresivo\nCVD = suma acumulada de todos los deltas\n\n**Delta Agresivo vs Pasivo:**\n• Agresivo (Takers): los que MUEVEN el precio. Compran/venden a mercado\n• Pasivo (Makers): los que ABSORBEN. Ponen órdenes límite\n• Delta Pasivo = −Delta Agresivo (siempre opuestos)\n\n**Situaciones clave:**\n• CVD sube + precio sube → tendencia alcista real (compradores dominan)\n• CVD baja + precio sube → divergencia bajista → distribución oculta → probable reversión\n• CVD sube + precio baja → divergencia alcista → acumulación oculta → probable rebote\n• CVD plano → equilibrio → esperar ruptura\n\n**Divergencias CVD (la señal más poderosa):**\n\n🟢 **ALCISTA:** Precio hace mínimo más bajo PERO CVD hace mínimo más alto\n→ El retail vende por pánico, los institucionales compran esa caída\n→ Confirmar con: CVD > EMA señal + OI subiendo\n\n🔴 **BAJISTA:** Precio hace máximo más alto PERO CVD hace máximo más bajo\n→ El retail compra por FOMO, los institucionales están vendiendo\n→ Cerrar longs, buscar short con confirmación de precio\n\n**El CVD es un indicador adelantado** — suele moverse antes que el precio.`,
  },
  {
    keywords: ["oi completo", "open interest combinaciones", "oi sube oi baja", "squeeze short", "long squeeze"],
    category: "Análisis Técnico",
    answer: `**Open Interest (OI) — Combinaciones con CVD**\n\n**OI Sube:** se están ABRIENDO posiciones nuevas (dinero nuevo al mercado)\n**OI Baja:** se están CERRANDO posiciones (dinero saliendo)\n\n**Las 4 combinaciones precio + OI:**\n• Precio ↑ + OI ↑ → tendencia alcista REAL (dinero nuevo entrando largo) → mantener\n• Precio ↑ + OI ↓ → short squeeze o cobertura de cortos → cuidado, puede revertir\n• Precio ↓ + OI ↑ → tendencia bajista REAL (dinero nuevo entrando corto) → confirmar dirección\n• Precio ↓ + OI ↓ → liquidaciones en cascada o cierres → posible agotamiento bajista\n\n**OI + CVD juntos (la tríada perfecta):**\n• CVD ↑ + OI ↑ + precio ↑ → BULL REAL — máxima confluencia alcista\n• CVD ↓ + OI ↑ + precio ↑ → TRAMPA — institucionales abriendo shorts, reversión inminente\n• CVD ↑ + OI ↓ + precio ↓ → SHORT SQUEEZE en progreso\n\n**Funding Rate + OI:**\n• Funding positivo + OI alto → muchos longs apalancados, mercado vulnerable a barrida\n• Funding negativo + OI alto → muchos shorts, posible short squeeze\n• Funding negativo extremo + OI subiendo → señal contrarian alcista fuerte\n\nEl indicador **PSY-SMD** de PSYCHOMETRIKS combina CVD + OI + Funding en tiempo real.`,
  },
  // ── FIBONACCI ────────────────────────────────────────────
  {
    keywords: ["fibonacci", "fibo", "retroceso fibonacci", "golden zone", "golden ratio", "extensiones fibonacci", "niveles fibo"],
    category: "Análisis Técnico",
    answer: `**Fibonacci en Trading — Manual PSYCHOMETRIKS**\n\n**Los niveles clave:**\n• 0.236 → retroceso menor, tendencias muy fuertes\n• 0.382 → primer retroceso significativo\n• 0.500 → nivel psicológico, no es Fibo puro\n• **0.618 → GOLDEN RATIO — zona de mayor probabilidad** ⭐\n• 0.705 → completa el Golden Pocket junto al 0.618\n• 0.786 → retroceso profundo, cerca de invalidación\n• 0.886 → Zona de Neutralización — agotamiento de la corrección\n\n**GOLDEN ZONE (0.500 – 0.618):**\nLa zona de entrada institucional por excelencia. Precio + OB + RSI oversold en esta zona = entrada de alta probabilidad.\n\n**Extensiones (Take Profits):**\n• 1.272 → TP1 conservador\n• 1.618 → TP2 (el más respetado por institucionales)\n• 2.618 → TP3 target ambicioso\n\n**Cómo medir:**\n• Tendencia alcista: mide de swing LOW a swing HIGH → los retrocesos dan zonas de COMPRA\n• Tendencia bajista: mide de swing HIGH a swing LOW → retrocesos dan zonas de VENTA\n\n**Confluencias (mínimo 3 para una entrada válida):**\nNivel Fibo 0.618 + Soporte horizontal + EMA importante + OB alcista + Divergencia RSI = entrada de máxima probabilidad\n\n**Segan Destroy:** Cuando el precio rompe todos los niveles y entra en extensiones negativas (-1.1, -1.27, -1.618), el precio está en agotamiento extremo y debe revertir. Ver indicador PACE PRO SNIPER.`,
  },
  // ── SESIONES Y KILL ZONES ─────────────────────────────────
  {
    keywords: ["sesiones trading", "kill zone", "kill zones", "sesion london", "sesion nueva york", "overlap", "sesion asia", "horario trading", "cuando operar"],
    category: "Sesiones",
    answer: `**Sesiones de Trading y Kill Zones**\n\n**Las 4 sesiones (horario UTC):**\n• **Tokio** 00:00-09:00 → volumen bajo, rangos estrechos, movimientos lentos\n• **Londres** 08:00-17:00 → mayor volatilidad del día, institucionales europeos activos\n• **Nueva York** 13:00-22:00 → gran volumen, noticias USA, movimientos fuertes\n• **Crypto** 00:00-24:00 → mercado 24/7, pico en Overlap\n\n**OVERLAP Londres-NY (13:00-17:00 UTC) = MÁXIMO VOLUMEN** ⚡\nAmbas sesiones activas simultáneamente. Aquí ocurren los movimientos más significativos del día.\n\n**Kill Zones — momentos de máxima liquidez institucional:**\n• KZ Londres 08:00-11:00 UTC → apertura europea, banco central europeo activo\n• KZ Nueva York 13:00-16:00 UTC → apertura americana, Fed y bancos US activos\n• KZ Asia 00:00-03:00 UTC → apertura asiática, liquidez Japón/China\n\n**Regla clave de PSYCHOMETRIKS:** Las mejores señales ocurren cuando el Score PSY es alto Y estamos en Overlap o Kill Zone. Score 70+ durante Overlap = probabilidad máxima. Evitar señales en sesión Tokio o fuera de sesión.\n\n**En el PSY v6.6:** El Overlap suma +10 puntos al score, London +6, KZ Asia +3. Los pesos cambian automáticamente según el régimen de mercado (TRENDING/RANGING).`,
  },
  // ── WYCKOFF ──────────────────────────────────────────────
  {
    keywords: ["wyckoff", "spring", "utad", "acumulacion wyckoff", "distribucion wyckoff", "sos wyckoff", "sow wyckoff", "fases wyckoff"],
    category: "Análisis Técnico",
    answer: `**Metodología Wyckoff — Fases y Eventos**\n\nWyckoff describe cómo el smart money acumula y distribuye antes de los grandes movimientos.\n\n**Las fases:**\n• **Fase A:** Stopping Action — primeras señales de parada de la tendencia bajista\n• **Fase B:** Building Cause — precio consolida, smart money acumula en silencio\n• **Fase C:** Test — el movimiento clave (Spring o UTAD)\n• **Fase D:** Mark Up/Down — inicio del movimiento real con SOS/SOW\n• **Fase E:** Trend Established — tendencia confirmada en curso\n\n**Eventos clave:**\n• **SPRING:** Barrida bajo los mínimos en acumulación → señal de compra fuerte. El precio baja a cazar stops del retail y vuelve rápidamente arriba\n• **UTAD (UpThrust After Distribution):** Barrida sobre máximos en distribución → señal de venta fuerte\n• **SOS (Sign Of Strength):** Primera rotura alcista con volumen → confirma acumulación\n• **SOW (Sign Of Weakness):** Primera rotura bajista con volumen → confirma distribución\n• **SC (Selling Climax):** Capitulación con volumen extremo — suele marcar el mínimo\n• **AR (Automatic Rally):** Rebote automático tras el SC\n\n**Cómo piensa el institucional:**\n1. **Acumula** en silencio durante rangos laterales\n2. **Manipula** con un movimiento falso (Spring/UTAD) para cazar stops\n3. **Distribuye** el movimiento real cuando el retail está atrapado\n\n**El PACE PRO SNIPER v2** detecta fases y eventos Wyckoff automáticamente.`,
  },
  // ── VELAS JAPONESAS ──────────────────────────────────────
  {
    keywords: ["velas japonesas", "candlestick", "patron velas", "marubozu", "martillo", "estrella fugaz", "doji", "engulfing", "envolvente", "morning star", "evening star", "tres soldados"],
    category: "Análisis Técnico",
    answer: `**Velas Japonesas — Manual PSYCHOMETRIKS 2025**\n\n**Anatomía:** Cuerpo (apertura-cierre) + mechas superior e inferior\n• Cuerpo grande = dominio claro del lado ganador\n• Mecha larga = rechazo y reversión desde extremo\n• Sin mecha = convicción total (Marubozu)\n\n**Patrones individuales alcistas:**\n• **Marubozu verde** → máxima fuerza compradora, continuación\n• **Martillo** → mecha inferior larga en soporte → reversión alcista\n• **Doji Libélula** → mecha inferior muy larga → rechazo fuerte desde soporte\n\n**Patrones individuales bajistas:**\n• **Marubozu rojo** → máxima fuerza vendedora\n• **Estrella Fugaz** → mecha superior larga en resistencia → distribución\n• **Doji Lápida** → mecha superior muy larga → rechazo desde resistencia\n\n**Combinaciones de 2 velas (más fiables):**\n• **Envolvente Alcista** (roja→verde grande): en soporte → reversión alta probabilidad\n• **Envolvente Bajista** (verde→roja grande): en resistencia → reversión\n• **Tweezer Bottom** (mismo mínimo): soporte fuerte confirmado\n• **Tweezer Top** (mismo máximo): resistencia fuerte confirmada\n\n**Combinaciones de 3 velas:**\n• **Morning Star** (roja→doji→verde fuerte): en mínimos → reversión alcista clásica\n• **Evening Star** (verde→doji→roja fuerte): en máximos → reversión bajista\n• **3 Soldados Blancos** (3 verdes consecutivas): impulso sostenido\n• **3 Cuervos Negros** (3 rojas consecutivas): caída sostenida\n\n**Regla clave:** Ningún patrón funciona aislado. Un Martillo en resistencia = señal débil. El mismo Martillo en soporte fuerte + zona Fibonacci 0.618 + OB alcista = señal de alta probabilidad.`,
  },
  {
    keywords: ["bos", "choch", "market structure", "estructura mercado", "higher high", "lower low", "hh hl lh ll", "break of structure", "cambio estructura"],
    category: "Análisis Técnico",
    answer: `**Estructura de Mercado — BOS y CHoCH**\n\nEl mercado se mueve en ondas de impulso y retroceso. La estructura define la tendencia.\n\n**Tendencia Alcista:** HH (Higher High) → HL (Higher Low) → HH → HL\n**Tendencia Bajista:** LH (Lower High) → LL (Lower Low) → LH → LL\n\n**BOS (Break Of Structure):**\nEl precio rompe el último HH (en alcista) o último LL (en bajista). Confirma que la tendencia continúa en la misma dirección.\n• BOS alcista = precio supera el HH previo → tendencia alcista confirmada, buscar longs en retrocesos\n• BOS bajista = precio rompe el LL previo → tendencia bajista confirmada, evitar longs\n\n**CHoCH (Change Of Character):**\nEl precio rompe la estructura EN CONTRA de la tendencia actual. Es la primera señal de posible cambio de tendencia.\n• CHoCH alcista: en tendencia bajista, el precio rompe un LH previo → posible reversión, empezar a buscar longs\n• CHoCH bajista: en tendencia alcista, el precio rompe un HL previo → alerta de reversión\n\n**Regla:** El CHoCH solo es el aviso. La confirmación viene con el BOS en la nueva dirección.\n\nEl **PSY v6.6** detecta BOS y CHoCH automáticamente en Tabla B (Estructura de Mercado).`,
  },
  {
    keywords: ["adx", "fuerza tendencia", "dmi", "di plus", "di minus", "directional index", "average directional"],
    category: "Análisis Técnico",
    answer: `**ADX — Fuerza de Tendencia**\n\nEl ADX (Average Directional Index) mide la FUERZA de la tendencia, independientemente de su dirección.\n\n**Valores ADX:**\n• < 15: DÉBIL — mercado en rango lateral → evitar operar con tendencia\n• 15-24: MODERADO — tendencia emergente → entrar con prudencia\n• 25-39: FUERTE — tendencia establecida → operar con confianza\n• ≥ 40: MUY FUERTE — tendencia poderosa → mantener posición con trailing stop\n\n**DI+ y DI- (componentes del ADX):**\n• DI+ > DI- → presión compradora dominante → sesgo largo\n• DI- > DI+ → presión vendedora dominante → sesgo corto\n• DI+ cruza sobre DI- → posible señal de entrada largo\n• DI- cruza sobre DI+ → posible señal de salida/short\n\n**En PSYCHOMETRIKS:**\nEl ADX ≥ 25 suma +10 puntos al Score del INSTITUTIONAL ALPHA PRO.\nEl PSY v6.6 usa el ADX para detectar el régimen de mercado:\n• TRENDING (ADX ≥ 25) → pesos del score favorecen seguimiento de tendencia\n• RANGING (ADX < 20) → pesos favorecen niveles de soporte/resistencia\n• TRANSICIÓN (ADX 20-25) → cautela, esperar definición`,
  },
  {
    keywords: ["mfi", "money flow index", "flujo dinero", "presion compradora mfi"],
    category: "Análisis Técnico",
    answer: `**MFI (Money Flow Index) — Flujo de Dinero**\n\nEl MFI combina precio y volumen para medir la presión compradora o vendedora real. A diferencia del RSI, el MFI incluye el volumen en su cálculo, haciéndolo más preciso para detectar actividad institucional.\n\n**Interpretación:**\n• MFI > 80: sobrecompra — posible distribución institucional\n• MFI < 20: sobreventa — posible acumulación institucional\n• MFI ≥ 50: flujo comprador dominante → alcista\n• MFI < 50: flujo vendedor dominante → bajista\n\n**En INSTITUTIONAL ALPHA PRO:**\n• MFI micro ≥ 50 → +8 puntos al score\n• MFI macro ≥ 50 → +7 puntos al score\n\n**Divergencias MFI:**\n• Precio sube + MFI baja → distribución institucional oculta (bajista)\n• Precio baja + MFI sube → acumulación institucional oculta (alcista)\n\nEl MFI es parte del módulo Money Flow del INSTITUTIONAL ALPHA PRO y también aparece en el PSY v6.6 en las divergencias del PSY-ORACLE (RSI/MFI/MACD).`,
  },
  // ── PLACEHOLDER PARA MANUALES FUTUROS ───────────────────
  {
    keywords: ["nuevo indicador", "nuevo manual", "proximo indicador", "próximo indicador", "manuales pendientes", "en desarrollo psychometriks"],
    category: "PSYCHOMETRIKS",
    answer: `**Manuales e Indicadores en Desarrollo**\n\nPSYCHOMETRIKS está en constante expansión. Los próximos manuales e indicadores incluirán:\n\n**Indicadores próximos (LiqMap Pro):**\n• LiqMap Indicator — zonas de liquidación en el chart\n• Smart Volume Pro — CVD con señales de divergencia + Volume Profile\n• Momentum Suite — funding rate overlay + OI visual + señales automáticas\n• Macro Confluence — correlación DXY/Nasdaq/Oro/S&P en tiempo real\n• Smart Money Tracker — iceberg orders, large trades, whale alerts\n• Full Access Pack — todos los indicadores actuales y futuros\n\n**Contenido educativo próximo:**\nManuales adicionales de indicadores específicos estarán disponibles en el Aula PSYCHOMETRIKS.\n\n**Para cualquier pregunta específica** sobre un indicador o concepto que no encuentres en el FAQ, el asistente de IA puede responderla en tiempo real basándose en toda la metodología PSYCHOMETRIKS.\n\n🌐 Mantente al día en **psychometriks.trade** y el canal de Telegram.`,
  },
  // ── INDICADORES TÉCNICOS ──────────────────────────────────
  {
    keywords: ["rsi", "relative strength index", "fuerza relativa"],
    category: "Indicadores",
    answer: `**RSI (Relative Strength Index)**\n\nEl RSI es un oscilador de momentum que mide la velocidad y magnitud de los movimientos de precio. Oscila entre 0 y 100.\n\n• **Sobrecompra**: RSI > 70 → posible corrección bajista\n• **Sobreventa**: RSI < 30 → posible rebote alcista\n• **Zona neutral**: RSI entre 40–60\n\n**Cómo usarlo:** El RSI es más efectivo en mercados laterales. En tendencias fuertes, puede mantenerse en zona de sobrecompra/sobreventa por mucho tiempo. Combínalo con otros indicadores como MACD o EMA para confirmar señales.`,
  },
  {
    keywords: ["ema", "media movil exponencial", "exponential moving average", "media movil", "sma"],
    category: "Indicadores",
    answer: `**EMA (Media Móvil Exponencial)**\n\nLa EMA es una media móvil que da más peso a los precios recientes, haciéndola más reactiva que la SMA (simple).\n\n**EMAs más usadas:**\n• EMA 9 / EMA 21 → scalping y swing trading corto\n• EMA 50 → tendencia mediana\n• EMA 200 → tendencia de largo plazo (si el precio está por encima = bullish)\n\n**Cruces de EMA:**\n• EMA corta cruza hacia arriba a la larga → señal de compra (Golden Cross)\n• EMA corta cruza hacia abajo → señal de venta (Death Cross)\n\nLa EMA 200 es especialmente importante: muchos traders institucionales la usan como referencia.`,
  },
  {
    keywords: ["macd", "convergencia", "divergencia", "moving average convergence"],
    category: "Indicadores",
    answer: `**MACD (Convergencia/Divergencia de Medias Móviles)**\n\nEl MACD muestra la relación entre dos EMAs (generalmente 12 y 26 períodos) y una señal de 9 períodos.\n\n**Componentes:**\n• Línea MACD = EMA12 - EMA26\n• Línea Señal = EMA9 del MACD\n• Histograma = MACD - Señal\n\n**Señales:**\n• MACD cruza por encima de la señal → señal de compra\n• MACD cruza por debajo → señal de venta\n• Divergencia (precio sube pero MACD baja) → debilidad en la tendencia\n\nMuy útil para identificar cambios de tendencia en gráficos de 4h, diario o semanal.`,
  },
  {
    keywords: ["cvd", "volume delta", "cumulative volume delta", "delta acumulado"],
    category: "Indicadores",
    answer: `**CVD (Cumulative Volume Delta)**\n\nEl CVD mide la diferencia acumulada entre compras agresivas (market buys) y ventas agresivas (market sells) en el order book.\n\n**Cómo interpretarlo:**\n• CVD sube + precio sube → confluencia alcista real (compradores al mando)\n• CVD baja + precio sube → divergencia → posible trampa alcista\n• CVD sube + precio baja → posible absorción de ventas (acumulación)\n\n**Uso avanzado:** El CVD es clave para detectar si el movimiento de precio tiene respaldo real de volumen o si es artificial. Muy usado por traders de derivados y futuros.`,
  },
  {
    keywords: ["open interest", "interés abierto", "oi", "futuros", "contratos abiertos"],
    category: "Indicadores",
    answer: `**Open Interest (OI) - Interés Abierto**\n\nEl OI representa el número total de contratos de futuros/opciones abiertos que aún no han sido cerrados.\n\n**Combinaciones importantes:**\n• Precio sube + OI sube → tendencia alcista fuerte (dinero nuevo entrando)\n• Precio sube + OI baja → short squeeze o cobertura (no tan confiable)\n• Precio baja + OI sube → tendencia bajista fuerte\n• Precio baja + OI baja → liquidaciones, posible agotamiento\n\n**Tip:** Cuando el OI está muy elevado, el mercado es vulnerable a liquidaciones en cascada (wick extremos).`,
  },
  {
    keywords: ["soporte", "resistencia", "support", "resistance", "nivel", "zona"],
    category: "Análisis Técnico",
    answer: `**Soportes y Resistencias**\n\nSon zonas de precio donde el mercado ha reaccionado históricamente.\n\n**Soporte:** Zona donde los compradores son más fuertes que los vendedores. El precio tiende a rebotar desde ahí hacia arriba.\n\n**Resistencia:** Zona donde los vendedores dominan. El precio tiende a rechazarse hacia abajo.\n\n**Regla de inversión de roles:** Cuando un soporte se rompe, se convierte en resistencia (y viceversa).\n\n**Cómo identificarlos:**\n• Niveles de precio con múltiples toques históricos\n• Números redondos (ej: $50,000 en BTC)\n• Máximos y mínimos previos\n• Zonas de alto volumen (POC en el perfil de volumen)`,
  },
  {
    keywords: ["ciclo macro", "ciclo bitcoin", "halving", "bull market", "bear market", "ciclo alcista", "ciclo bajista"],
    category: "Macro",
    answer: `**Ciclos del Mercado de Criptomonedas**\n\nBitcoin sigue históricamente un ciclo de 4 años ligado al halving (reducción a la mitad de la recompensa minera).\n\n**Fases del ciclo:**\n1. **Acumulación** (bear final): precios bajos, poca atención del público\n2. **Inicio alcista** (pre-halving): subida gradual, volumen creciente\n3. **Bull run** (post-halving): euforia, precios máximos históricos (ATH)\n4. **Distribución y corrección**: ventas institucionales, caída del 70-90%\n\n**Halvings históricos:**\n• 2012 → Bitcoin pasó de $12 a $1,000\n• 2016 → De $650 a $20,000\n• 2020 → De $8,000 a $69,000\n• 2024 (abril) → ciclo en progreso\n\n**Nota:** El ciclo se puede alargar o acortar. No es garantía, pero históricamente ha sido muy relevante.`,
  },
  {
    keywords: ["bitcoin", "btc", "que es bitcoin", "qué es bitcoin"],
    category: "Criptomonedas",
    answer: `**Bitcoin (BTC)**\n\nBitcoin es la primera y más importante criptomoneda. Creada en 2009 por el seudónimo Satoshi Nakamoto.\n\n**Características clave:**\n• Oferta máxima: 21 millones de BTC\n• Descentralizado: sin banco central ni gobierno que lo controle\n• Blockchain: registro público e inmutable de todas las transacciones\n• Halving cada ~4 años: reduce la emisión de nuevos BTC\n\n**¿Por qué importa?** Bitcoin es considerado el "oro digital" y sirve como activo de reserva de valor en el ecosistema cripto. Muchos altcoins siguen su tendencia.\n\n**En trading:** BTC dominance (BTC.D) indica si el capital fluye hacia Bitcoin o hacia altcoins. Cuando sube, las alts suelen bajar. Cuando baja, las alts pueden explotar (altseason).`,
  },
  {
    keywords: ["ethereum", "eth", "que es ethereum", "qué es ethereum", "smart contract"],
    category: "Criptomonedas",
    answer: `**Ethereum (ETH)**\n\nEthereum es la segunda criptomoneda más importante. Es una plataforma de contratos inteligentes (smart contracts) y aplicaciones descentralizadas (dApps).\n\n**Usos principales:**\n• DeFi (finanzas descentralizadas)\n• NFTs\n• Tokens ERC-20 (la mayoría de altcoins corren sobre Ethereum)\n• Layer 2 (Arbitrum, Optimism, Base)\n\n**Desde "The Merge" (2022):** Ethereum pasó de Proof of Work a Proof of Stake, lo que redujo su consumo energético en ~99.9% y convirtió a ETH en deflacionario en ciertos períodos.\n\n**En trading:** ETH/BTC es un par importante que indica el flujo de capital entre ambos activos. Si ETH supera a BTC en rendimiento, suele preceder a una altseason.`,
  },
  {
    keywords: ["altcoin", "altcoins", "alts", "temporada de alts", "altseason"],
    category: "Criptomonedas",
    answer: `**Altcoins y Altseason**\n\nLas altcoins son todas las criptomonedas que no son Bitcoin. Van desde Ethereum hasta tokens de pequeña capitalización.\n\n**Tipos:**\n• **Large cap**: ETH, BNB, SOL, ADA — más estables\n• **Mid cap**: activos con capitalización media, mayor volatilidad\n• **Small/Micro cap**: alto riesgo, alto potencial (muchas son trampas)\n\n**Altseason:** Período donde las altcoins superan a Bitcoin en rendimiento. Suele ocurrir cuando:\n• BTC dominance cae por debajo del 50-55%\n• BTC se consolida después de una subida fuerte\n• Hay liquidez excedente en el mercado\n\n**Riesgo:** Las altcoins caen mucho más que Bitcoin en mercados bajistas. Gestión de riesgo es crucial.`,
  },
  {
    keywords: ["stop loss", "take profit", "gestión de riesgo", "risk management", "riesgo"],
    category: "Gestión de Riesgo",
    answer: `**Gestión de Riesgo en Trading**\n\nLa gestión de riesgo es lo más importante en trading. Sin ella, incluso las mejores estrategias fallan.\n\n**Reglas fundamentales:**\n• **Riesgo por operación:** Nunca arriesgues más del 1-2% de tu capital en una sola trade\n• **Stop Loss:** Siempre define dónde saldrás si la trade va en tu contra ANTES de entrar\n• **Take Profit:** Define tu objetivo de ganancia con antelación\n• **Ratio riesgo/beneficio:** Busca al menos 1:2 (arriesgas $1 para ganar $2)\n\n**Stop Loss:** Colócalo en una zona técnica significativa (debajo de un soporte, debajo de un swing low). No lo pongas con distancia arbitraria.\n\n**Nunca hagas DCA en contra de la tendencia** sin un plan claro. Muchos traders pierden todo intentando "promediar" una posición perdedora.`,
  },
  {
    keywords: ["apalancamiento", "leverage", "futuros", "margin", "margen", "liquidacion", "liquidación"],
    category: "Derivados y Futuros",
    answer: `**Apalancamiento y Futuros**\n\nEl apalancamiento te permite operar con más capital del que tienes, amplificando tanto ganancias como pérdidas.\n\n**Ejemplo:** Con $100 y 10x de leverage, controlas $1,000. Un movimiento del 10% en tu contra = liquidación total.\n\n**Niveles comunes:**\n• 2x-5x → razonable para traders con experiencia\n• 10x+ → muy arriesgado, solo para muy corto plazo\n• 50x-100x → esencialmente apuesta/casino, no recomendado\n\n**Liquidación:** Cuando el mercado se mueve en tu contra lo suficiente, el exchange cierra tu posición automáticamente y pierdes todo el margen.\n\n**Consejos:**\n• Usa apalancamiento bajo si eres principiante\n• Siempre pon stop loss\n• El funding rate en futuros perpetuos puede erosionar tu posición con el tiempo`,
  },
  {
    keywords: ["order book", "libro de ordenes", "bid", "ask", "spread"],
    category: "Mercado y Exchange",
    answer: `**Order Book (Libro de Órdenes)**\n\nEl order book muestra todas las órdenes de compra (bids) y venta (asks) pendientes en un exchange.\n\n**Componentes:**\n• **Bid (compra):** El precio máximo que los compradores están dispuestos a pagar\n• **Ask (venta):** El precio mínimo al que los vendedores están dispuestos a vender\n• **Spread:** Diferencia entre el mejor bid y el mejor ask (cuanto menor, mejor liquidez)\n\n**Cómo usarlo:**\n• Paredes de compra/venta (walls) pueden indicar soportes/resistencias temporales\n• Absorción de órdenes grandes puede señalar intención institucional\n• Un order book desequilibrado puede predecir movimientos de corto plazo\n\n**Nota:** Los market makers pueden crear y cancelar órdenes grandes (spoofing) para manipular la percepción.`,
  },
  {
    keywords: ["defi", "finanzas descentralizadas", "yield farming", "liquidity pool", "staking"],
    category: "DeFi",
    answer: `**DeFi (Finanzas Descentralizadas)**\n\nDeFi son aplicaciones financieras que funcionan en blockchain sin intermediarios (bancos, brokers).\n\n**Principales actividades:**\n• **Staking:** Bloquear tokens para validar la red y ganar recompensas\n• **Yield Farming:** Proveer liquidez a pools y ganar comisiones/tokens\n• **Lending/Borrowing:** Prestar o pedir prestado cripto (Aave, Compound)\n• **DEX:** Intercambio descentralizado (Uniswap, PancakeSwap)\n\n**Riesgos:**\n• Smart contract risk: bugs en el código pueden ser explotados\n• Impermanent loss: en liquidity pools puedes perder vs. simplemente holdear\n• Rug pulls: proyectos fraudulentos que huyen con los fondos\n\n**Consejo:** Solo invierte en proyectos con auditorías de seguridad verificadas.`,
  },
  {
    keywords: ["whale", "ballena", "institución", "institucional", "manipulacion", "manipulación"],
    category: "Mercado",
    answer: `**Ballenas e Institucionales**\n\nLas ballenas son wallets o entidades que poseen grandes cantidades de cripto y pueden mover el mercado.\n\n**Cómo detectar su actividad:**\n• On-chain analytics (Glassnode, Nansen, Whale Alert)\n• Movimientos grandes hacia/desde exchanges pueden indicar ventas/compras\n• Absorción en el order book\n\n**Actores institucionales:**\n• Fondos de inversión (Grayscale, BlackRock iShares Bitcoin ETF)\n• Market makers (quienes proveen liquidez y ganan del spread)\n• Miners que venden producción regularmente\n\n**Estrategia:** Seguir el dinero inteligente ("smart money") es una estrategia válida pero requiere tiempo y herramientas especializadas. No tomes cada movimiento de ballena como señal de compra/venta.`,
  },
  {
    keywords: ["patron", "patrón", "vela", "candlestick", "doji", "martillo", "engulfing", "bandera", "triángulo", "head and shoulders"],
    category: "Patrones",
    answer: `**Patrones de Velas y Gráficos**\n\n**Patrones de velas (corto plazo):**\n• **Doji:** Cuerpo muy pequeño → indecisión del mercado\n• **Martillo/Hanging Man:** Mecha larga abajo → posible reversión\n• **Engulfing alcista/bajista:** Una vela "engulle" la anterior → reversión fuerte\n• **Marubozu:** Sin mechas → presión de compra/venta muy fuerte\n\n**Patrones de gráfico (mediano plazo):**\n• **Bandera (flag):** Consolidación después de impulso → continuación\n• **Triángulo:** Convergencia de precio → ruptura inminente\n• **Head & Shoulders:** Patrón de reversión bajista clásico\n• **Double top/bottom:** Doble máximo (bajista) o doble mínimo (alcista)\n\n**Importante:** Ningún patrón funciona el 100% del tiempo. Siempre confirma con volumen y otros indicadores.`,
  },
  {
    keywords: ["exchange", "binance", "coinbase", "kraken", "bybit", "okx", "dónde comprar", "donde comprar"],
    category: "Exchanges",
    answer: `**Exchanges de Criptomonedas**\n\n**Centralizados (CEX):**\n• **Binance:** Mayor volumen mundial, buena selección de pares y futuros\n• **Bybit:** Popular para derivados y futuros\n• **OKX:** Amplia variedad, buenas herramientas\n• **Kraken:** Regulado, bueno para institucionales\n• **Coinbase:** Más amigable para principiantes, muy regulado (EE.UU.)\n\n**Descentralizados (DEX):**\n• **Uniswap:** Principal DEX en Ethereum\n• **PancakeSwap:** En BNB Chain\n• **dYdX:** Para futuros descentralizados\n\n**Consejos de seguridad:**\n• Activa 2FA siempre\n• No dejes fondos grandes en el exchange (not your keys, not your coins)\n• Usa hardware wallet (Ledger, Trezor) para holdear a largo plazo`,
  },
  {
    keywords: ["wallet", "cartera", "ledger", "trezor", "seed phrase", "frase semilla", "clave privada", "private key"],
    category: "Seguridad",
    answer: `**Wallets y Seguridad**\n\n**Tipos de wallets:**\n• **Hot wallet** (online): MetaMask, Trust Wallet → conveniente pero menos seguro\n• **Cold wallet** (hardware): Ledger, Trezor → máxima seguridad para hodlers\n• **Paper wallet:** Clave privada impresa → muy seguro si se guarda bien\n\n**Reglas de oro:**\n• **NUNCA compartas tu seed phrase (frase semilla)** con nadie\n• Guarda la seed phrase offline (papel, metal) en lugar seguro\n• Usa wallets diferentes para DeFi (riesgo) y holdings (seguridad)\n\n**"Not your keys, not your coins":** Si el exchange quiebra (como FTX en 2022), puedes perder todo. Una hardware wallet te da control total.\n\n**Cuidado con phishing:** Sitios falsos que imitan wallets/exchanges para robarte las claves.`,
  },
  {
    keywords: ["scalping", "swing trading", "day trading", "posición", "estrategia", "cuanto tiempo"],
    category: "Estrategias",
    answer: `**Estilos de Trading**\n\n**Scalping:**\n• Operaciones muy cortas (segundos a minutos)\n• Requiere mucha atención y velocidad de ejecución\n• Afectado por comisiones (necesitas volumen alto para rentabilizar)\n• No recomendado para principiantes\n\n**Day Trading:**\n• Operaciones intradía (no se dejan posiciones abiertas de noche)\n• Requiere análisis técnico sólido\n• Alto estrés psicológico\n\n**Swing Trading:**\n• Posiciones de días a semanas\n• Ideal para quienes no pueden monitorear el mercado constantemente\n• Usa gráficos de 4h, diario y semanal\n\n**Inversión a largo plazo (HODLing):**\n• Comprar y mantener en ciclos de años\n• Estadísticamente, el más rentable para la mayoría\n• Menos estrés, pero requiere convicción en los proyectos\n\n**Consejo:** Empieza con swing trading. El scalping tiene una curva de aprendizaje muy alta.`,
  },
  {
    keywords: ["psicologia", "psicología", "fomo", "fud", "miedo", "codicia", "greed", "fear", "emociones"],
    category: "Psicología",
    answer: `**Psicología del Trading**\n\nLa psicología es el aspecto más subestimado del trading. La mayoría de las pérdidas vienen de errores emocionales, no de malas estrategias.\n\n**FOMO (Fear Of Missing Out):**\nMiedo a perderse un movimiento → entrar tarde en máximos → pérdidas. Solución: respeta tu plan, siempre habrá otra oportunidad.\n\n**FUD (Fear, Uncertainty, Doubt):**\nVender en pánico por noticias negativas → vender mínimos. Solución: toma decisiones con datos, no con emociones.\n\n**Overtrading:**\nOperar demasiado para "recuperar" pérdidas → ciclo destructivo. Solución: define un máximo de operaciones por día.\n\n**Reglas psicológicas:**\n• Define tu plan ANTES de entrar al mercado\n• Escribe un diario de trading\n• Acepta que perder es parte del juego\n• Nunca inviertas dinero que no puedas perder`,
  },
];

// Preguntas sugeridas agrupadas por categoría
const SUGGESTIONS = [
  {
    category: "PSYCHOMETRIKS",
    questions: [
      "¿Qué es PSYCHOMETRIKS?",
      "¿Cuáles son los planes y precios?",
      "¿Qué incluye el Aula?",
      "¿Qué es la Suite de indicadores?",
    ],
  },
  {
    category: "Indicadores PSY",
    questions: [
      "¿Qué es el PSY-PULSE?",
      "¿Cómo funciona el PSY-SMD?",
      "¿Qué es el FUSION MASTER?",
      "¿Para qué sirve el PSY-MCI?",
    ],
  },
  {
    category: "Trading & Mercado",
    questions: [
      "¿Cómo funciona el RSI?",
      "¿Qué es el CVD?",
      "¿Qué es el Open Interest?",
      "¿Cuándo llega la altseason?",
    ],
  },
  {
    category: "Gestión y estrategia",
    questions: [
      "¿Cómo poner un stop loss correctamente?",
      "¿Cuánto apalancamiento debo usar?",
      "¿Qué es el bot de trading?",
      "¿Qué es LiqMap Pro?",
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════
function matchFaq(userMessage: string): FaqEntry | null {
  const lower = userMessage.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const entry of FAQ) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return entry;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// RUTAS
// ═══════════════════════════════════════════════════════════════

// POST /api/chat/message  ─  SSE streaming
router.post("/message", async (req: Request, res: Response) => {
  const { message, sessionId } = req.body as { message: string; sessionId: string };

  if (!message?.trim() || !sessionId?.trim()) {
    res.status(400).json({ error: "message y sessionId son requeridos" });
    return;
  }

  // Guardar mensaje del usuario
  await db.insert(chatMessagesTable).values({
    sessionId,
    role: "user",
    content: message.trim(),
  });

  // ── Buscar en FAQ ──────────────────────────────────────────
  const faqMatch = matchFaq(message);

  if (faqMatch) {
    const answer = faqMatch.answer;

    // Guardar respuesta FAQ en DB
    await db.insert(chatMessagesTable).values({
      sessionId,
      role: "assistant",
      content: answer,
      source: "faq",
    });

    // Enviar como SSE (streamed chunk a chunk para experiencia consistente)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const words = answer.split(" ");
    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join(" ") + (i + 3 < words.length ? " " : "");
      res.write(`data: ${JSON.stringify({ content: chunk, source: "faq" })}\n\n`);
      await new Promise(r => setTimeout(r, 20));
    }
    res.write(`data: ${JSON.stringify({ done: true, source: "faq" })}\n\n`);
    res.end();
    return;
  }

  // ── Respuesta estática cuando no hay match en FAQ ──────────
  const fallback = `No tengo información específica sobre eso todavía, pero puedo ayudarte con:\n\n• **Plataforma PSYCHOMETRIKS** — planes, indicadores, aula\n• **Indicadores PSY** — PULSE, SMD, ZONES, FUSION MASTER, etc.\n• **Análisis técnico** — SMC, Order Blocks, Fibonacci, Elliott Waves\n• **Derivados y crypto** — Funding Rate, Open Interest, CVD, liquidaciones\n• **Gestión de riesgo** — position sizing, stop loss, psicología\n\nProbá con una de las preguntas sugeridas o escribí un tema más específico. 📊`;

  await db.insert(chatMessagesTable).values({
    sessionId,
    role: "assistant",
    content: fallback,
    source: "faq",
  });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const words = fallback.split(" ");
  for (let i = 0; i < words.length; i += 3) {
    const chunk = words.slice(i, i + 3).join(" ") + (i + 3 < words.length ? " " : "");
    res.write(`data: ${JSON.stringify({ content: chunk, source: "faq" })}\n\n`);
    await new Promise(r => setTimeout(r, 18));
  }
  res.write(`data: ${JSON.stringify({ done: true, source: "faq" })}\n\n`);
  res.end();
});

// GET /api/chat/suggestions  ─  Preguntas sugeridas
router.get("/suggestions", (_req: Request, res: Response) => {
  res.json({ suggestions: SUGGESTIONS });
});

// GET /api/chat/history  ─  Historial de sesión
router.get("/history", async (req: Request, res: Response) => {
  const { sessionId } = req.query as { sessionId: string };

  if (!sessionId) {
    res.status(400).json({ error: "sessionId requerido" });
    return;
  }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(asc(chatMessagesTable.createdAt))
    .limit(100);

  res.json({ messages });
});

export default router;
