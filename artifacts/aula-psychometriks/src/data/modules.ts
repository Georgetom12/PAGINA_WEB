export interface ModuleSection {
  title: string;
  content: string; // raw HTML-ish string rendered via dangerouslySetInnerHTML? no — we'll use a different approach
  type?: "text" | "table" | "formula" | "infobox" | "cards" | "list" | "steps" | "chart";
}

export type Level = "N1" | "N2" | "N3" | "N4" | "N5" | "N6" | "N7" | "N8";

export const LEVEL_META: Record<Level, { label: string; color: string; desc: string }> = {
  N1: { label: "FUNDAMENTOS",     color: "#00e676", desc: "Bases del mercado" },
  N2: { label: "TÉCNICO",         color: "#00e5ff", desc: "Análisis técnico clásico" },
  N3: { label: "SMART MONEY",     color: "#ff6d00", desc: "Metodología institucional" },
  N4: { label: "AVANZADO",        color: "#ffd700", desc: "Flujo y estructura avanzada" },
  N5: { label: "MACRO",           color: "#e040fb", desc: "Macroeconómicos y ciclos" },
  N6: { label: "METODOLOGÍAS",    color: "#7c4dff", desc: "Sistemas completos" },
  N7: { label: "GESTIÓN",         color: "#ff1744", desc: "Capital y psicología" },
  N8: { label: "ACCIONES & RENTA FIJA", color: "#40c4ff", desc: "Mercados financieros tradicionales" },
};

export interface TradeModule {
  id: string;
  number: string;
  level: Level;
  title: string;
  subtitle: string;
  emoji: string;
  duration: string;
  tags: string[];
}

export const MODULES: TradeModule[] = [
  // NIVEL 1 — FUNDAMENTOS
  { id: "glosario-psy",         number: "00", level: "N1", title: "Glosario PSY — Conceptos",   subtitle: "Todos los términos del indicador PSY en TradingView", emoji: "📖", duration: "Referencia", tags: ["Glosario","Conceptos","PSY","Referencia"] },
  { id: "intro-mercados",       number: "01", level: "N1", title: "Introducción a los Mercados", subtitle: "Activos, exchanges, renta variable vs crypto", emoji: "🌐", duration: "25 min", tags: ["Básico","Mercados","Activos"] },
  { id: "anatomia-mercado",     number: "02", level: "N1", title: "Anatomía del Mercado",        subtitle: "Bid, Ask, Spread, tipos de órdenes, liquidez",  emoji: "🔬", duration: "20 min", tags: ["Básico","OrderFlow"] },
  { id: "velas-basico",         number: "03", level: "N1", title: "Velas Japonesas — Básico",    subtitle: "Anatomía, tipos, psicología de cada vela",       emoji: "🕯️", duration: "35 min", tags: ["Velas","Básico"] },
  { id: "estructura-mercado",   number: "04", level: "N1", title: "Estructura de Mercado",       subtitle: "Tendencias, HH/HL, LH/LL, Bull vs Bear",        emoji: "📊", duration: "30 min", tags: ["Estructura","Básico"] },
  // NIVEL 2 — TÉCNICO
  { id: "velas-patrones",       number: "05", level: "N2", title: "Velas Japonesas — Patrones",  subtitle: "Reversión, continuación, multi-vela (80+ patrones)", emoji: "🎯", duration: "60 min", tags: ["Velas","Patrones"] },
  { id: "fibonacci",            number: "06", level: "N2", title: "Fibonacci Completo",          subtitle: "Retrocesos, extensiones, Golden Pocket, confluencias", emoji: "🌀", duration: "45 min", tags: ["Fibonacci","Niveles"] },
  { id: "emas",                 number: "07", level: "N2", title: "EMAs y Medias Móviles",       subtitle: "EMA 21/50/200, Ribbon, Golden Cross, Death Cross", emoji: "〰️", duration: "30 min", tags: ["EMAs","Tendencia"] },
  { id: "rsi",                  number: "08", level: "N2", title: "RSI — Relative Strength",     subtitle: "Sobrecompra, sobreventa, divergencias, estrategias", emoji: "📈", duration: "35 min", tags: ["RSI","Osciladores"] },
  { id: "sesiones",             number: "09", level: "N2", title: "Sesiones de Trading",         subtitle: "Asia, London, New York, Overlap — horarios y características", emoji: "🕐", duration: "40 min", tags: ["Sesiones","Horarios"] },
  // NIVEL 3 — SMART MONEY
  { id: "smart-money-intro",    number: "10", level: "N3", title: "Smart Money — Fundamentos",  subtitle: "Qué es el dinero institucional, cómo rastrearlo", emoji: "🏦", duration: "25 min", tags: ["SMC","Institucional"] },
  { id: "bos-choch",            number: "11", level: "N3", title: "BOS & CHoCH",                subtitle: "Break of Structure y Change of Character",      emoji: "💥", duration: "35 min", tags: ["BOS","CHoCH","Estructura"] },
  { id: "order-blocks",         number: "12", level: "N3", title: "Order Blocks & FVG",         subtitle: "OB alcistas/bajistas, Fair Value Gaps, Breaker Blocks", emoji: "🧱", duration: "45 min", tags: ["OB","FVG","Zonas"] },
  { id: "liquidez",             number: "13", level: "N3", title: "Liquidez y Liquidity Hunts",  subtitle: "BSL, SSL, Inducements, barridas de liquidez",   emoji: "💧", duration: "40 min", tags: ["Liquidez","Trampas"] },
  { id: "amd",                  number: "14", level: "N3", title: "AMD — Acumulación, Manipulación, Distribución", subtitle: "El modelo de 3 fases institucional", emoji: "⚙️", duration: "40 min", tags: ["AMD","Ciclo"] },
  { id: "crt",                  number: "15", level: "N3", title: "CRT — Candle Range Theory",   subtitle: "Inside bar, range, barridas y dirección real",   emoji: "📦", duration: "35 min", tags: ["CRT","Rango"] },
  { id: "ipda",                 number: "16", level: "N3", title: "IPDA — Rangos Premium/Discount", subtitle: "Equilibrium, Premium vs Discount, NWOG, NDOG", emoji: "⚖️", duration: "30 min", tags: ["IPDA","Niveles"] },
  // NIVEL 4 — AVANZADO
  { id: "wyckoff",              number: "17", level: "N4", title: "Wyckoff — Método Completo",   subtitle: "Acumulación, distribución, Spring, UTAD, SOS, SOW", emoji: "🔮", duration: "60 min", tags: ["Wyckoff","Ciclos"] },
  { id: "cvd",                  number: "18", level: "N4", title: "CVD — Cumulative Volume Delta", subtitle: "Qué es, cómo leerlo, divergencias, señales",  emoji: "🌊", duration: "35 min", tags: ["CVD","Volumen"] },
  { id: "open-interest",        number: "19", level: "N4", title: "Open Interest",               subtitle: "OI real, funding rates, liquidaciones, manipulación", emoji: "📉", duration: "40 min", tags: ["OI","Futuros","Funding"] },
  { id: "dominancias",          number: "20", level: "N4", title: "Dominancias Crypto",         subtitle: "BTC.D, USDT.D, USDC.D — ciclos altcoin season", emoji: "👑", duration: "35 min", tags: ["Dominancia","BTC","Altcoins"] },
  // NIVEL 5 — MACRO
  { id: "dxy",                  number: "21", level: "N5", title: "DXY — Índice del Dólar",      subtitle: "Qué es, cómo leerlo, ciclos, impacto en mercados", emoji: "💵", duration: "40 min", tags: ["DXY","Dólar","Macro"] },
  { id: "indices",              number: "22", level: "N5", title: "Índices Bursátiles",          subtitle: "SPX, NASDAQ, Dow Jones (US30), DJI — correlaciones", emoji: "🏛️", duration: "40 min", tags: ["Índices","SPX","US30"] },
  { id: "mag7",                 number: "23", level: "N5", title: "Las Magníficas 7",            subtitle: "NVDA, MSFT, AAPL, AMZN, GOOGL, META, TSLA — por qué mueven el mercado", emoji: "🚀", duration: "35 min", tags: ["MAG7","Acciones","Tech"] },
  { id: "vix",                  number: "24", level: "N5", title: "VIX — Índice de Volatilidad", subtitle: "Fear index, cómo usarlo, niveles clave, inverso al SPX", emoji: "😱", duration: "30 min", tags: ["VIX","Volatilidad","Miedo"] },
  { id: "bonos",                number: "25", level: "N5", title: "Bonos del Tesoro 10Y",        subtitle: "Yields, curva de rendimiento, inversión, impacto en crypto", emoji: "📜", duration: "35 min", tags: ["Bonos","Yields","Fed"] },
  { id: "oro",                  number: "26", level: "N5", title: "Oro — XAU/USD",               subtitle: "Ciclos del oro, relación con dólar, inflación, crisis", emoji: "🥇", duration: "35 min", tags: ["Oro","XAU","Macro"] },
  { id: "petroleo",             number: "27", level: "N5", title: "Petróleo — WTI & Brent",      subtitle: "Ciclos, OPEC, impacto en inflación y mercados",  emoji: "🛢️", duration: "30 min", tags: ["WTI","Brent","Petróleo"] },
  { id: "ciclos-crypto",        number: "28", level: "N5", title: "Ciclos de Bitcoin",           subtitle: "Halving, ciclo de 4 años, altcoin season, patrones históricos", emoji: "₿", duration: "45 min", tags: ["Bitcoin","Halving","Ciclos"] },
  // NIVEL 5 — MACRO EXTRA
  { id: "macro-dashboard",      number: "29", level: "N5", title: "Dashboard Macro Completo",   subtitle: "Todos los indicadores macro: VIX, DXY, Bonos, On-Chain, Macro events", emoji: "🌍", duration: "50 min", tags: ["Macro","Dashboard","On-Chain"] },
  // NIVEL 6 — METODOLOGÍAS
  { id: "elliott-waves",        number: "30", level: "N6", title: "Ondas de Elliott",            subtitle: "5 impulsos, 3 correcciones, fractales, aplicación práctica", emoji: "〽️", duration: "55 min", tags: ["Elliott","Ondas","Teoría"] },
  { id: "armonicos",            number: "31", level: "N6", title: "Patrones Armónicos",          subtitle: "Gartley, Bat, Butterfly, Crab, Shark, Cypher, ABCD — XABCD completo", emoji: "🎼", duration: "60 min", tags: ["Armónicos","Fibonacci","Patrones"] },
  { id: "ict",                  number: "32", level: "N6", title: "ICT — Inner Circle Trader",   subtitle: "Modelo ICT, PD Arrays, Killzones, Judas Swing, NWOG", emoji: "🎖️", duration: "50 min", tags: ["ICT","SMC","Avanzado"] },
  { id: "gann",                 number: "33", level: "N6", title: "Gann — Geometría del Tiempo", subtitle: "Cuadrado de 9, ángulos Gann, fan, grid, tiempo/precio", emoji: "⬡", duration: "45 min", tags: ["Gann","Geometría","Tiempo"] },
  // NIVEL 7 — GESTIÓN
  { id: "risk-management",      number: "34", level: "N7", title: "Gestión de Riesgo",           subtitle: "Regla 3-5-7, tamaño posición, R:R, Kelly, drawdown", emoji: "🛡️", duration: "40 min", tags: ["Riesgo","Capital","R:R"] },
  { id: "psicologia",           number: "35", level: "N7", title: "Psicología del Trader",       subtitle: "Sesgos cognitivos, FOMO, FUD, sobreoperativa, disciplina", emoji: "🧠", duration: "35 min", tags: ["Psicología","Mental"] },
  { id: "diario-trading",       number: "36", level: "N7", title: "Diario de Trading",           subtitle: "Cómo registrar operaciones, métricas, mejora continua", emoji: "📓", duration: "25 min", tags: ["Diario","Métricas","Backtesting"] },
  // NIVEL 8 — ACCIONES & RENTA FIJA
  { id: "analisis-fundamental", number: "AF01", level: "N8", title: "Análisis Fundamental",       subtitle: "Estados financieros, ratios de valoración, P/E, FCF, balance", emoji: "📊", duration: "55 min", tags: ["Acciones","Fundamental","P/E","Balance"] },
  { id: "earnings-reports",     number: "AF02", level: "N8", title: "Earnings Reports",           subtitle: "Beat & Raise, EPS, Revenue, Guidance — cómo operar resultados", emoji: "📋", duration: "40 min", tags: ["Earnings","EPS","Revenue","Acciones"] },
  { id: "dividend-investing",   number: "AF03", level: "N8", title: "Dividend Investing",         subtitle: "Yield, DRIP, Aristocrats, fechas clave del ciclo de dividendos", emoji: "💰", duration: "35 min", tags: ["Dividendos","Yield","Income","Inversión"] },
  { id: "bonos-acciones",       number: "AF04", level: "N8", title: "Bonos y Renta Fija",         subtitle: "Yield, Duration, Curva de tasas, Rating crediticio", emoji: "📜", duration: "45 min", tags: ["Bonos","Yield","Duration","Tasas"] },
  { id: "opciones-financieras", number: "AF05", level: "N8", title: "Opciones Financieras",       subtitle: "Calls, Puts, Greeks, estrategias básicas e intermedias", emoji: "⚡", duration: "60 min", tags: ["Opciones","Greeks","Calls","Puts"] },
  { id: "brokers-acciones",     number: "AF06", level: "N8", title: "Brokers para Acciones",      subtitle: "IBKR, regulación, tipos de cuentas, costos ocultos", emoji: "🏦", duration: "30 min", tags: ["Broker","IBKR","LatAm","Regulación"] },
  { id: "impuestos-inversiones",number: "AF07", level: "N8", title: "Impuestos sobre Inversiones", subtitle: "Capital gains, dividendos, W-8BEN, Tax Loss Harvesting", emoji: "🧾", duration: "35 min", tags: ["Impuestos","Capital Gains","W-8BEN","LatAm"] },
  { id: "glosario-recursos-af", number: "AF08", level: "N8", title: "Glosario y Recursos",        subtitle: "Términos esenciales y plataformas recomendadas para mercados", emoji: "📚", duration: "Referencia", tags: ["Glosario","Recursos","Referencia"] },
];
