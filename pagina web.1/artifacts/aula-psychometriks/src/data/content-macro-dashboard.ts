export const contentMacroDashboard: Record<string, any> = {

"macro-dashboard": {
  sections: [
    {
      title: "El Universo Macro del Trader",
      type: "text",
      body: `Para operar BTC, XAU u otros activos con consistencia, necesitas entender el contexto macro. No puedes ignorar el entorno macroeconómico y esperar que tu análisis técnico funcione solo. Los movimientos más grandes de mercado — los que liquidan cuentas — son causados por eventos macro.

Este dashboard es tu radar completo. No necesitas monitorear todos los indicadores todos los días, pero sí necesitas saber qué buscar y por qué importa cada uno. Los 5 de mayor peso para BTC/XAU son: DXY, SPX/NDX, VIX, US10Y, y los ETF Flows de BTC. Esos 5 te dan el 80% del contexto macro que necesitas.`,
    },
    {
      type: "macro-dashboard",
    },
    {
      title: "Cómo Leer el Contexto Macro — Framework",
      type: "table",
      headers: ["Indicador", "Sube → BTC reacciona", "Baja → BTC reacciona", "Urgencia"],
      rows: [
        ["VIX", "Cae (riesgo ON — alcista BTC)", "Sube (riesgo OFF — bajista BTC)", "🔴 Inmediata"],
        ["DXY", "Cae (bajista USD → alcista BTC)", "Sube (fuerte USD → presión BTC)", "🔴 Inmediata"],
        ["SPX/NDX", "Sube (correlación positiva BTC)", "Cae (ventas correladas en BTC)", "🔴 Inmediata"],
        ["US10Y Yield", "Sube (liquidity tighten → bajista BTC)", "Cae (liquidity ease → alcista BTC)", "🟡 Diaria"],
        ["M2 Global", "Sube (más liquidez → bull market crypto)", "Cae (QT → bear market crypto)", "🟢 Semanal"],
        ["ETF Flows", "Entradas netas (demanda BTC spot)", "Salidas netas (distribución ETF)", "🔴 Inmediata"],
        ["USD/JPY", "Sube (yen débil → carry trade ON)", "Cae rápido (desemantellamiento carry → sell all)", "🔴 Inmediata"],
        ["USDT.D", "Baja (flujo a BTC/alts — alcista)", "Sube (huida a stable — bajista crypto)", "🔴 Inmediata"],
        ["BTC.D", "Sube (BTC lidera sobre alts)", "Baja (altseason activándose)", "🟡 Diaria"],
        ["Funding Rate", "Positivo alto (longs dominan → riesgo squeeze)", "Negativo (shorts dominan → posible short squeeze)", "🔴 Inmediata"],
        ["MVRV Z-Score", "Sobre 7 (zona techo histórico)", "Bajo 0 (zona de compra histórica)", "🟢 Semanal"],
        ["NUPL", "Sobre 0.75 (euforia — techo de ciclo)", "Bajo 0 (capitulación — fondo)", "🟢 Semanal"],
      ],
    },
    {
      type: "infobox",
      variant: "pro",
      label: "EL USD/JPY — EL INDICADOR QUE TODOS IGNORAN",
      text: `El USD/JPY es uno de los indicadores más peligrosos y menos monitoreados.

Cuando el yen se aprecia FUERTE (USD/JPY cae rápido), los fondos que tenían posiciones en el carry trade del yen se ven forzados a vender TODO para cubrir sus posiciones. Acciones, crypto, oro, todo baja en cascada.

Viste esto en agosto 2024: USD/JPY cayó de 160 a 142 en semanas. BTC cayó 20%+ en días. Las bolsas globales se derrumbaron. Fue el desmantelamiento del yen carry trade.

Regla práctica: si USD/JPY cae más de 3-5% en una semana, prepárate para turbulencia en todos los mercados de riesgo. Si sube sostenidamente, los carry trades se reconstruyen y el apetito por riesgo regresa.`,
    },
    {
      title: "On-Chain — Los Datos Que No Mienten",
      type: "cards",
      cards: [
        {
          color: "#ff6d00",
          icon: "₿",
          title: "MVRV Z-Score",
          text: "Compara el Market Value con el Realized Value de BTC. Score > 7 = zona de techo histórico (sell zone). Score < 0 = zona de fondo histórico (buy zone). Es uno de los mejores indicadores de ciclo que existen. Herramienta: glassnode.com o lookintobitcoin.com",
        },
        {
          color: "#ff6d00",
          icon: "📊",
          title: "NUPL (Net Unrealized P&L)",
          text: "Muestra si el mercado en general está en ganancia o pérdida no realizada. Zonas: Capitulación (<0), Esperanza (0-0.25), Optimismo (0.25-0.5), Creencia (0.5-0.75), Euforia (0.75-1). La euforia = techo, la capitulación = fondo. Simple y poderoso.",
        },
        {
          color: "#ff6d00",
          icon: "🏦",
          title: "ETF Flows (BlackRock, Fidelity)",
          text: "Los ETF spot de BTC introducen demanda institucional real y medible. Si BlackRock acumula 10,000 BTC en una semana = presión compradora real. Si hay salidas netas 3 días seguidos = distribución institucional. Herramienta: farside.co.uk para flows diarios.",
        },
        {
          color: "#ff6d00",
          icon: "💰",
          title: "Stablecoin Supply",
          text: "La cantidad total de USDT+USDC en circulación representa la 'munición' disponible para entrar a crypto. Si Stablecoin Supply crece = hay más capital potencial esperando entrar. Si el ratio Stablecoin/BTC market cap es alto = alcista. Herramienta: CoinGlass.",
        },
        {
          color: "#ff6d00",
          icon: "📈",
          title: "Funding Rate",
          text: "Costo de mantener posiciones perpetuas. Si Funding Rate es muy positivo (>0.05% cada 8h), los longs están pagando mucho a los shorts = mercado sobreextendido al alza, riesgo de liquidación masiva bajando. Si es muy negativo, igual pero al revés.",
        },
        {
          color: "#ff6d00",
          icon: "📉",
          title: "Open Interest (OI)",
          text: "Contratos de futuros abiertos. OI alto + precio subiendo = apalancamiento alcista creciente = más riesgo. OI bajo = mercado más limpio. Cuando el OI cae rápido = liquidaciones masivas ocurrieron (busca quiénes fueron liquidados en CoinGlass).",
        },
      ],
    },
    {
      title: "Eventos Macro de Alto Impacto — Calendario",
      type: "table",
      headers: ["Evento", "Frecuencia", "Hora GYE", "Impacto BTC", "Qué Buscar"],
      rows: [
        ["FOMC (Fed Decision)", "8 veces/año", "2:00 PM", "🔴 Extremo", "Tono hawkish vs dovish, dot plot, conferencia Powell"],
        ["NFP (Non-Farm Payrolls)", "1° viernes del mes", "8:30 AM", "🔴 Alto", "Empleo fuerte → Fed restrictiva. Empleo débil → Fed dovish"],
        ["CPI (Inflación)", "Mensual", "8:30 AM", "🔴 Alto", "CPI > estimado → hawkish. CPI < estimado → dovish"],
        ["PCE (Deflactor)", "Mensual", "8:30 AM", "🟡 Alto", "Favorito de la Fed para medir inflación real"],
        ["GDP (PIB)", "Trimestral", "8:30 AM", "🟡 Medio-Alto", "Recesión técnica (2 trim. negativos) = riesgo macro"],
        ["PMI Manufacturero", "Mensual", "10:00 AM", "🟡 Medio", "PMI > 50 = expansión. PMI < 50 = contracción"],
        ["Jobless Claims", "Semanal (jueves)", "8:30 AM", "🟡 Medio", "Aumento sostenido = debilitamiento del empleo → dovish"],
        ["PPI (Inflación productor)", "Mensual", "8:30 AM", "🟡 Medio", "Leading indicator del CPI. PPI sube → CPI sigue"],
        ["OPEC Meeting", "Variable", "Variable", "🟡 Medio", "Corte de producción = petróleo sube = inflación sube = hawkish"],
        ["Discursos Powell/Fed", "Variable", "Variable", "🔴 Alto", "Cualquier hint de cambio de política = volatilidad inmediata"],
      ],
    },
    {
      type: "infobox",
      variant: "warn",
      label: "REGLA DE ORO ANTES DE EVENTOS MACRO",
      text: `NUNCA tengas posiciones abiertas importantes 15 minutos antes de un dato macro de alto impacto.

El mercado puede mover 2-5% en segundos con un dato inesperado. Tu stop loss puede no ejecutarse al precio esperado (slippage extremo). Las liquidaciones en cascada pueden llevarse tu cuenta.

Estrategia correcta: cierra posiciones antes del dato, espera la reacción inicial (los primeros 5-10 minutos son el ruido), y luego busca la entrada después de que el mercado digiere el dato y confirma la dirección.`,
    },
    {
      title: "Correlaciones Clave — Cheat Sheet",
      type: "table",
      headers: ["Si esto pasa...", "Espera en BTC", "Espera en XAU", "Confianza"],
      rows: [
        ["DXY rompe soporte y cae", "📈 Alcista", "📈 Alcista", "Alta"],
        ["VIX supera 30", "📉 Bajista", "📈 Refugio (alcista)", "Alta"],
        ["SPX cae >2% en un día", "📉 Bajista correlado", "📈 Refugio temporal", "Alta"],
        ["FOMC baja tasas", "📈 Muy alcista", "📈 Muy alcista", "Alta"],
        ["FOMC sube tasas inesperado", "📉 Muy bajista", "📉 Bajista inicial", "Alta"],
        ["USD/JPY cae >3% en semana", "📉 Riesgo extremo", "📉 Venta correlada", "Alta"],
        ["ETF Flows 5+ días positivos", "📈 Demanda real", "Neutro", "Alta"],
        ["Funding Rate >0.1% (8h)", "⚠️ Sobreextendido", "N/A", "Media"],
        ["M2 Global +6% YoY", "📈 Ciclo alcista", "📈 Alcista", "Media-Alta"],
        ["US10Y yield sobre 5%", "📉 Presión bajista", "📉 Presión bajista", "Media"],
        ["Stablecoin inflow masivo en exchanges", "📉 Distribución probable", "Neutro", "Media"],
        ["MVRV Z-Score <1", "📈 Zona acumulación", "N/A", "Alta (largo plazo)"],
      ],
    },
  ],
},

};
