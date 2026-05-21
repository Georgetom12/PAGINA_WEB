// Enriched content — deep knowledge base integrated into each module
export const contentEnriched: Record<string, { sections: any[] }> = {

  // ════════════════════════════════════════════════════════════════════════
  // N2 — EMAs Y MEDIAS MÓVILES (enriquecido)
  // ════════════════════════════════════════════════════════════════════════
  "emas": {
    sections: [
      {
        type: "ema-chart",
        title: "Los 15 Cruces de EMAs — Señales y Significados",
        body: "Cada cruce tiene un nombre, un timeframe óptimo y un contexto de mercado donde es válido. Usa el selector para ver cada tipo.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "La secuencia de Fibonacci en las EMAs",
        text: "Los mercados respetan naturalmente los períodos de Fibonacci: EMA 8, EMA 13, EMA 21, EMA 34, EMA 55, EMA 89, EMA 144, EMA 200. Los institucionales usan estas EMAs porque los números de Fibonacci reflejan la progresión natural de los ciclos del mercado. En crypto: 21 + 55 + 200 = las 3 más respetadas. En Forex: 13 + 21 + 55 + 200. En acciones: 20 + 50 + 200.",
      },
      {
        type: "table",
        headers: ["EMA", "Período", "Tipo de trader", "Significado en precio"],
        rows: [
          ["EMA 8",   "8 velas", "Scalper / daytrader",    "Soporte dinámico en tendencias fuertes — si el precio lo rompe, la tendencia desacelera"],
          ["EMA 13",  "13 velas","Daytrader / swing",      "Fibonacci. Clave en Forex. Entrada en pullback en tendencia limpia"],
          ["EMA 21",  "21 velas","Swing trader",           "La EMA más usada globalmente. Separa tendencia de corrección en 4H y Diario"],
          ["EMA 34",  "34 velas","Swing / posición",       "Fibonacci. Usado en análisis de ondas de Elliott como base"],
          ["EMA 55",  "55 velas","Swing / posición",       "Fibonacci. Clave en Forex diario. Reemplaza la EMA50 en muchos algoritmos"],
          ["EMA 89",  "89 velas","Posición / inversión",   "Fibonacci. Soporte en tendencias macro. Clave en mercado semanal"],
          ["EMA 144", "144 velas","Inversión",             "Fibonacci. Nivel de largo plazo — pocas veces tocado = muy significativo"],
          ["EMA 200", "200 velas","Todos los estilos",     "La línea maestra. Define el régimen de mercado (bull vs bear) globalmente"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "EMA Ribbon — Lectura de convergencia y divergencia",
        text: "Cuando todas las EMAs (8-13-21-34-55) se comprimen y convergen = rango / indecisión. Cuando se expanden y separan ordenadamente = tendencia fuerte en progreso. Cuando se entrelazan (cruzan constantemente) = mercado lateral/ruidoso, NO operar en dirección de cruces de EMAs cortas. En un EMA Stack perfecto alcista: el precio viaja ENTRE la EMA8 y EMA21. Cada toque a EMA21 = zona de compra óptima.",
      },
      {
        type: "infobox",
        variant: "tip",
        label: "Cómo usan las EMAs los grandes fondos",
        text: "Blackrock y Vanguard monitorean la EMA200 diaria del SPX como señal de riesgo institucional. Warren Buffett ha mencionado la SMA200 mensual como filtro de mercado. Los algoritmos de HFT (High Frequency Trading) tienen modelos donde la EMA21 en 1H del SPX es zona de rebalanceo. En BTC: Michael Saylor (MicroStrategy) acumula cuando el precio está bajo la EMA200 semanal.",
      },
      {
        type: "table",
        headers: ["Mercado", "EMAs institucionales clave", "Timeframe principal", "Por qué"],
        rows: [
          ["BTC/Crypto",  "EMA 21 / EMA 200 diaria + EMA 50/200 semanal", "Diario y Semanal",   "Mercado 24/7 — las EMAs reemplazan los niveles de cierre semanales"],
          ["Forex majors","EMA 21 / EMA 55 / EMA 200 diaria",             "Diario y 4H",         "Los bancos centrales operan en base diaria — EMA55 es el equilibrio interbancario"],
          ["SPX / NQ",    "SMA 20 / SMA 50 / SMA 200 diaria",             "Diario y Semanal",    "Los fondos usan SMA (no EMA) para el SPX — diferencia en mercados lentos"],
          ["ORO (XAU)",   "EMA 21 / EMA 50 / EMA 200 semanal",            "Semanal y Mensual",   "Activo lento — las EMAs largas mandan. EMA200 semanal = nivel crítico"],
          ["Futuros ES",  "VWAP + EMA 9/21 en 5min/15min",                "5min para intradía",  "VWAP + EMA cortas = markup/markdown intradía"],
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // N2 — RSI (enriquecido)
  // ════════════════════════════════════════════════════════════════════════
  "rsi": {
    sections: [
      {
        type: "rsi-chart",
        title: "RSI — Divergencias, Rangos Tendenciales y Failure Swings",
        body: "El RSI en una tendencia fuerte NO se usa como reversal. Se usa como trailing confirmation. La clave es entender el rango en el que opera: Bull Range vs Bear Range.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Bull Range vs Bear Range — El secreto del RSI en tendencia",
        text: "En UPTREND: el RSI oscila entre 40 y 90 (Bull Range). Los niveles de 40-50 son soporte del RSI — zona de re-entrada en pullback. Nivel 70 ya no es 'sobrecompra' sino señal de fortaleza. En DOWNTREND: el RSI oscila entre 10 y 60 (Bear Range). El nivel 60-65 actúa como RESISTENCIA del RSI. Si el RSI supera 60 en downtrend = posible cambio de tendencia. Welles Wilder (creador del RSI) nunca dijo que 70/30 eran zonas de reversión — son zonas de interés.",
      },
      {
        type: "table",
        headers: ["Tipo de Divergencia", "Precio", "RSI", "Señal", "Acción"],
        rows: [
          ["Div. Alcista Regular",  "Hace Lower Low (LL)",  "Hace Higher Low (HL)", "Reversión alcista próxima",      "Long en siguiente soporte con vela de confirmación"],
          ["Div. Bajista Regular",  "Hace Higher High (HH)","Hace Lower High (LH)", "Reversión bajista próxima",      "Short en siguiente resistencia con vela de confirmación"],
          ["Div. Alcista Oculta",   "Hace Higher Low (HL)", "Hace Lower Low (LL)",  "Tendencia alcista CONTINÚA",     "Long — señal de continuación, no reversión"],
          ["Div. Bajista Oculta",   "Hace Lower High (LH)", "Hace Higher High (HH)","Tendencia bajista CONTINÚA",     "Short — señal de continuación, no reversión"],
          ["Failure Swing Alcista", "No supera máximo anterior","RSI sí supera 70", "Reversión alcista fuerte",       "Long agresivo — señal de alta fiabilidad"],
          ["Failure Swing Bajista", "No baja del mínimo anterior","RSI sí baja de 30", "Reversión bajista fuerte",   "Short agresivo — señal de alta fiabilidad"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "RSI Failure Swing — La señal más potente de Wilder",
        text: "Failure Swing Alcista: RSI cae a < 30, rebota a > 30, retrocede pero NO baja de 30, y entonces supera el último máximo del RSI = BUY. Esta secuencia confirma que los vendedores perdieron control. Failure Swing Bajista: RSI sube a > 70, cae, rebota pero NO supera 70, y entonces cae bajo el mínimo previo = SELL. El propio Wilder consideraba los Failure Swings como señales más poderosas que las divergencias.",
      },
      {
        type: "infobox",
        variant: "tip",
        label: "RSI Multi-Timeframe — Cómo usarlo correctamente",
        text: "Regla: analiza el RSI en 3 timeframes. HTF (semanal/diario): define el sesgo macro — si RSI > 50 en diario, el sesgo es alcista. MTF (4H): busca la zona de soporte/resistencia del RSI donde entrar. LTF (1H/15min): busca el setup específico (divergencia, failure swing, cruce de 50). Solo operar cuando los 3 TFs apuntan en la misma dirección.",
      },
      {
        type: "table",
        headers: ["Configuración RSI", "Contexto", "¿Qué hacer?", "Fiabilidad"],
        rows: [
          ["RSI(D) > 50 + RSI(4H) pullback a 40-50", "Uptrend diario, corrección normal en 4H",  "Long — re-entrada en tendencia", "Alta"],
          ["RSI(D) < 50 + RSI(4H) rebote a 55-65",   "Downtrend diario, rebote bajista",         "Short — continuación de baja",   "Alta"],
          ["RSI(D) sobreventa + divergencia semanal", "Bottom macro potencial",                   "Acumular largo plazo",           "Muy Alta"],
          ["RSI cruza 50 desde abajo (diario)",       "Cambio de momentum alcista",               "Cambiar sesgo a alcista",        "Alta"],
          ["RSI cruza 50 desde arriba (diario)",      "Cambio de momentum bajista",               "Cambiar sesgo a bajista",        "Alta"],
          ["RSI > 80 en semanal",                     "Euforia de largo plazo",                   "Considerar reducir posición",    "Media-Alta"],
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // N3 — IPDA / ICT (enriquecido)
  // ════════════════════════════════════════════════════════════════════════
  "ipda": {
    sections: [
      {
        type: "ipda-chart",
        title: "IPDA — Premium / Discount / Golden Pocket",
        body: "El IPDA (Interbank Price Delivery Algorithm) es el motor que mueve el precio interbancario. Opera en rangos de 20, 40 y 60 días. Siempre busca entregar precio en la zona opuesta de donde está.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Power of 3 — AMD (Accumulation, Manipulation, Distribution)",
        text: "El Power of 3 es la estructura del día/semana según ICT. ACUMULACIÓN (Asia 20:00-01:00 ET): el algoritmo construye el rango inicial. MANIPULACIÓN (Londres 02:00-05:00 ET): el Judas Swing — el precio barre el SSL o BSL del rango asiático. Este es el movimiento FALSO. DISTRIBUCIÓN (Nueva York 08:30-12:00 ET): el movimiento REAL comienza. El precio va en dirección OPUESTA a la manipulación de Londres. Esta es la estructura que defines ANTES de abrir cualquier trade.",
      },
      {
        type: "table",
        headers: ["Fase AMD", "Horario GMT-5 (Guayaquil)", "Qué hace el precio", "Tu acción"],
        rows: [
          ["Acumulación (Asia)", "20:00 — 01:00", "Crea el rango diario (NDOG): equal highs y lows",        "Marcar los extremos del rango asiático"],
          ["Manipulación (Londres)", "02:00 — 05:00", "Judas Swing: barre SSL o BSL asiático falso",       "ESPERAR — no operar la manipulación"],
          ["Distribución (NY Open)", "08:30 — 11:00", "El movimiento real — en dirección contraria al Judas", "ENTRAR en OTE del movimiento real"],
          ["NY PM", "13:00 — 16:00", "Continúa o revierte el movimiento NY AM",                            "Gestión de posición, no nuevo setup"],
          ["London Close", "11:00 — 12:00", "Cierre de posiciones europeas — volatilidad temporal",         "Cuidado con stops — no nuevo setup"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "ICT Silver Bullet — El setup horario de alta probabilidad",
        text: "El Silver Bullet ocurre DOS veces al día, en ventanas específicas: 10:00–11:00 ET (15:00–16:00 Guayaquil) y 14:00–15:00 ET (19:00–20:00 Guayaquil). La estructura: (1) El precio crea un FVG en esa ventana horaria. (2) Entra en el FVG para llenar el imbalance. (3) Continúa en la dirección del HTF. El Silver Bullet funciona mejor en ES (futuros SPX), NQ y los pares de Forex principales. Tiene entre 70-80% de fiabilidad cuando el HTF está alineado.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "NDOG y NWOG — Los gaps de apertura institucionales",
        text: "New Day Opening Gap (NDOG): el gap entre el cierre del día anterior y la apertura del día actual en Forex. El algoritmo SIEMPRE tiende a cerrar este gap en algún momento del día. New Week Opening Gap (NWOG): gap entre el cierre del viernes y la apertura del domingo en Forex. Semanal. Estos gaps son zonas de alta probabilidad: si el precio está lejos de ellos y retrocede hacia ellos = zona de entrada. Si el precio los cierra = posible reversión.",
      },
      {
        type: "table",
        headers: ["PD Array ICT", "Tipo", "Descripción", "Cómo usarlo"],
        rows: [
          ["Bullish OB",     "Discount", "Última vela roja antes de impulso alcista + BOS", "Compra cuando el precio regresa al 50% del OB"],
          ["Bullish FVG",    "Discount", "3 velas: wick de v1 no solapa con wick de v3",    "Compra cuando precio entra al gap — zona de ineficiencia"],
          ["SIBI",          "Discount", "Sell-side Imbalance Buy-side Inefficiency",       "Zona de acumulación institucional — fuerte"],
          ["Bearish OB",    "Premium",  "Última vela verde antes de impulso bajista + BOS","Vende cuando el precio regresa al 50% del OB"],
          ["Bearish FVG",   "Premium",  "3 velas: wick de v1 no solapa con wick de v3",    "Vende cuando precio entra al gap — relleno del imbalance"],
          ["BISI",         "Premium",  "Buy-side Imbalance Sell-side Inefficiency",       "Zona de distribución institucional — fuerte"],
          ["Breaker Block", "Ambos",    "OB fallido que invierte su rol como S/R",         "Precio rompe el OB, vuelve a él = entra en dirección del rompimiento"],
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // N3 — SMART MONEY INTRO (enriquecido)
  // ════════════════════════════════════════════════════════════════════════
  "smart-money-intro": {
    sections: [
      {
        type: "sweep-destroy",
        title: "Sweep & Destroy — El Mecanismo Central del Smart Money",
        body: "El Smart Money no puede entrar al mercado de forma silenciosa. Necesita contraparte para sus órdenes. Los barridos de liquidez SON su mecanismo de entrada. Aprende a identificarlos antes de que ocurran.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Market Maker Buy Model — La secuencia completa de una trampa bajista",
        text: "Paso 1 — Consolidación: precio oscila en rango, acumulando SSL bajo los mínimos. Paso 2 — Manipulación bajista (Judas Swing): precio rompe abajo de SSL — todos los stops de longs se activan. Paso 3 — Absorción: el smart money compra TODO ese volumen de stop-loss a precio de descuento. Paso 4 — Reversión: precio recupera el rango y rompe arriba hacia BSL. Paso 5 — Rally: el movimiento real alcista comienza. Esta secuencia se repite en TODOS los mercados y timeframes.",
      },
      {
        type: "liquidity-absorption",
        title: "Absorción Institucional — Cómo identificar que están comprando",
        body: "La absorción es cuando los institucionales compran TODO lo que el retail vende en pánico. Se identifica: precio cae bruscamente (volumen alto) pero CIERRA cerca del máximo de la vela = compradores absorbiendo cada vendedor. CVD sube mientras el precio baja = divergencia = absorción.",
      },
      {
        type: "table",
        headers: ["Señal de absorción", "En el gráfico", "Confirmación", "Acción"],
        rows: [
          ["Hammer / Pin Bar bajista", "Wick largo abajo + cierre cerca del máximo", "Próxima vela cierra sobre el máximo del hammer", "Long con SL bajo el mínimo del wick"],
          ["CVD diverge del precio",   "Precio hace LL, CVD hace HL",               "RSI también diverge",                            "Long en el próximo OB o FVG"],
          ["Volumen climático",         "Volumen 3x+ mayor al promedio en la caída",  "Precio no cierra en nuevos mínimos tras el vol.", "Acumulación en progreso — preparar long"],
          ["Delta negativo + wick",    "Velas rojas con wicks largos + delta negativo", "Precio rebota y no regresa a esa zona",        "OB formado — zona de compra en retroceso"],
          ["Equal Lows + wick",        "Dos mínimos iguales, precio los rompe brevemente", "Precio cierra de vuelta sobre los EQL",     "Spring de Wyckoff / SSL Sweep — long"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "Market Maker Sell Model — La trampa alcista",
        text: "Es el espejo del Buy Model. Paso 1 — Rango: precio consolida creando BSL sobre máximos. Paso 2 — Manipulación alcista: precio rompe arriba del BSL (UTAD/Upthrust). Todos los shorts se liquidan. FOMO compra en breakout. Paso 3 — Absorción: el smart money VENDE toda su posición a ese retail comprador. Paso 4 — Reversión: precio colapsa de vuelta al rango. Paso 5 — Dump: markdown hacia SSL abajo. El Judas Swing es el nombre ICT para este movimiento de manipulación.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // N4/N5 — CICLOS CRYPTO (enriquecido con métricas on-chain)
  // ════════════════════════════════════════════════════════════════════════
  "ciclos-crypto": {
    sections: [
      {
        type: "bitcoin-cycles-chart",
        title: "Ciclos de Bitcoin — Halvings y Fases del Mercado",
        body: "Cada ciclo de Bitcoin sigue la misma estructura macro: acumulación → bull market → distribución → bear market. Los halvings son el catalizador, pero no el único factor.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Las 6 métricas on-chain más importantes para timing de ciclos",
        text: "1. MVRV Z-Score: compara el Market Value vs Realized Value. < 0 = zona de compra histórica. > 7 = zona de venta histórica (burbuja). 2. Puell Multiple: mineros vendiendo vs promedio anual. < 0.5 = bear bottom. > 4 = bull top. 3. Pi Cycle Top: cuando la SMA111 cruza la SMA350×2 = techo de ciclo (100% exacto en 2013, 2017, 2021). 4. 200-Week MA: precio nunca cerró bajo esta línea en la historia de BTC. 5. Realized Price: precio promedio de cada BTC en la última transacción. Precio < Realized = bear extremo. 6. STH vs LTH Cost Basis: cuando los holders de largo plazo están en ganancia y los corto plazo en pérdida = bottom formation.",
      },
      {
        type: "dominance-chart",
        title: "Rotación del Capital — BTC.D como mapa del ciclo",
        body: "La dominancia de BTC te dice en qué fase del ciclo estás con más precisión que cualquier precio.",
      },
      {
        type: "table",
        headers: ["Métrica On-Chain", "Zona de Compra (Fondo)", "Zona de Venta (Techo)", "Frecuencia de señal"],
        rows: [
          ["MVRV Z-Score",    "< 0 (rojo oscuro)",          "> 7 (rojo brillante)",        "1-2 veces por ciclo"],
          ["Puell Multiple",  "< 0.5 (banda verde oscura)", "> 4 (banda roja)",             "1-2 veces por ciclo"],
          ["Pi Cycle Top",    "— (no tiene señal de compra)", "111DMA cruza 350DMAx2",      "1 vez por ciclo"],
          ["200-Week MA",     "Precio toca 200WMA",         "Precio > 2x la 200WMA",       "Cada 3-4 años"],
          ["NVT Ratio",       "NVT < 30",                   "NVT > 100",                   "Frecuente"],
          ["Realized Price",  "Precio < Realized Price",    "Precio > 3x Realized Price",   "1-2 veces por ciclo"],
          ["LTH Supply",      "LTH acumula > 75% del supply","LTH distribuye acelerando",  "Mensual"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "Stock-to-Flow y la Escasez de Bitcoin",
        text: "El modelo S2F (Plan B) compara el stock (supply existente) con el flow (nueva producción). Cada halving duplica el S2F. Post-halving 2024: S2F de BTC supera al oro (S2F ~ 56). S2F histórico: BTC ha seguido la línea S2F en 3 ciclos con alta correlación. Crítica: el S2F ignora la demanda. Complementarlo con análisis on-chain y macro es esencial. La escasez es necesaria pero no suficiente para el precio — también necesitas demanda y liquidez global.",
      },
      {
        type: "infobox",
        variant: "tip",
        label: "El ciclo de 4 años — ¿Por qué existe realmente?",
        text: "El ciclo de 4 años de BTC no es solo por el halving. Es la convergencia de: (1) El halving cada ~4 años. (2) Los ciclos de liquidez global de la Fed (cada 3-4 años sube y baja tasas). (3) Los ciclos de deuda empresarial (4 años promedio de refinanciamiento). (4) La psicología humana: 4 años de euforia → miedo → esperanza → euforia. Cuando los 4 ciclos se alinean alcistamente = bull market explosivo (2020-2021). Cuando se desalinean = bear market extendido.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // N4 — CVD (enriquecido con gráfico propio + divergencias + absorción)
  // ════════════════════════════════════════════════════════════════════════
  "cvd": {
    sections: [
      {
        type: "cvd-chart",
        title: "CVD — Divergencias y Absorción Institucional",
        body: "El CVD (Cumulative Volume Delta) acumula la diferencia entre órdenes de mercado compradoras (que llegan al ask) y vendedoras (que llegan al bid). Es el termómetro más honesto del mercado: muestra quién realmente está siendo más agresivo.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Cómo se calcula el CVD — La mecánica real",
        text: "Delta de una vela = Volumen en Ask (compradores agresivos) − Volumen en Bid (vendedores agresivos). CVD = suma acumulada de todos los deltas. Si el precio sube $1,000 con CVD positivo = compradores la empujaron. Si el precio sube $1,000 con CVD negativo = el precio subió a pesar de que los vendedores eran más agresivos — señal de trampa. Los exchanges muestran esto como 'Taker Buy Volume' vs 'Taker Sell Volume'.",
      },
      {
        type: "table",
        headers: ["Escenario", "Precio", "CVD", "Interpretación", "Acción"],
        rows: [
          ["Uptrend confirmado",      "↑ Higher Highs", "↑ Sube también",         "Compradores agresivos — tendencia sana",     "Mantener longs, buscar pullback para añadir"],
          ["Divergencia bajista ★",   "↑ Nuevo máximo", "↓ Máximo menor",         "Distribución silenciosa — trampa alcista",   "Buscar short en próxima resistencia"],
          ["Downtrend confirmado",    "↓ Lower Lows",   "↓ Baja también",         "Vendedores agresivos — tendencia bajista",   "Mantener shorts, buscar rebote para añadir"],
          ["Divergencia alcista ★",   "↓ Nuevo mínimo", "↑ Mínimo mayor",         "Absorción — institucionales compran caída",  "Buscar long en próximo soporte/OB"],
          ["Climax vendedor",         "↓ Caída rápida", "↓ Pico negativo extremo","Capitulación — pánico máximo",               "Esperar: después del climax viene el rebote"],
          ["Climax comprador",        "↑ Sube rápido",  "↑ Pico positivo extremo","Euforia — FOMO máximo",                      "Cuidado: después del climax comprador viene distribución"],
          ["CVD flat + precio sube",  "↑ Sube",         "→ No se mueve",          "Precio sube sin volumen = movimiento débil", "Alta probabilidad de reversal próximo"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "CVD en diferentes exchanges — Por qué importa",
        text: "El CVD de Binance ≠ CVD de Bybit ≠ CVD de OKX. Cada exchange tiene su propio flujo de órdenes. Señal poderosa: cuando los CVDs de los 3 principales exchanges muestran divergencia alcista simultánea = señal institucional real. Si solo uno muestra divergencia = puede ser ruido. Coinalyze, Velo y Aggr.trade permiten ver el CVD de múltiples exchanges en tiempo real.",
      },
      {
        type: "infobox",
        variant: "tip",
        label: "Estrategia práctica: CVD + Order Block",
        text: "Setup de alta probabilidad: (1) En HTF (4H/1D) identificar un Order Block o FVG en zona de discount. (2) En LTF (15min/1H) esperar que el precio llegue a esa zona. (3) Cuando el precio toca el OB, observar el CVD: si baja con el precio pero el CVD diverge positivamente (HL mientras precio hace LL) = ENTRADA LONG. SL bajo el mínimo del wick. Este triple confluencia (HTF zona + divergencia CVD + estructura LTF) es el setup de máxima probabilidad.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // N4 — OPEN INTEREST (enriquecido con toggle completo)
  // ════════════════════════════════════════════════════════════════════════
  "open-interest": {
    sections: [
      {
        type: "open-interest-chart",
        title: "Open Interest — Las 4 Combinaciones, Funding Rate y Cascada de Liquidaciones",
        body: "El Open Interest mide el número de contratos de derivados abiertos. No es el volumen — es las posiciones ABIERTAS. Cuando alguien entra a un contrato, el OI sube. Cuando cierra, el OI baja. Combinarlo con precio, CVD y funding rate revela el estado real del mercado.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Funding Rate — El mecanismo que financia el mercado perpetuo",
        text: "Los futuros perpetuos no tienen fecha de vencimiento. Para anclarlos al precio spot, los exchanges usan el Funding Rate (tasa de financiamiento). Se paga cada 8 horas (Binance, Bybit, OKX). Funding positivo: los longs pagan a los shorts (0.01% = $10 por cada $10,000 apalancado). Funding negativo: los shorts pagan a los longs. Valores extremos: Funding > +0.1% = mercado sobrecalentado long = dump inminente. Funding < -0.05% = todos apuestan a la baja = short squeeze probable.",
      },
      {
        type: "table",
        headers: ["Funding Rate", "Situación", "Señal", "Estrategia"],
        rows: [
          ["+ 0.001% – 0.01%", "Normal / Neutral",         "Mercado balanceado",                  "Sin señal extrema — seguir trend"],
          ["+ 0.01% – 0.05%", "Moderadamente alcista",     "Longs dominan",                       "Precaución con longs muy apalancados"],
          ["+ 0.05% – 0.1%",  "Sobrecalentado long",        "Alta probabilidad de corrección",     "Reducir exposición long, buscar short"],
          ["+ 0.1% o más",    "Euforia extrema",            "Dump inminente — señal contrarian",   "Short de alta probabilidad"],
          ["−0.001% – 0",     "Ligeramente bajista",        "Mercado bajista suave",               "Sin señal extrema"],
          ["−0.01% – −0.05%", "Sobrecalentado short",       "Short squeeze probable",              "Buscar long agresivo"],
          ["−0.05% o menos",  "Miedo extremo / capitulación","Short squeeze inminente",            "Long agresivo — señal contrarian"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "Liquidation Heatmaps — El mapa del tesoro del smart money",
        text: "Los exchanges publican datos de dónde están los niveles de liquidación de posiciones apalancadas. Coinglass.com ofrece el Liquidation Heatmap: zonas de alta densidad de liquidaciones (calor rojo) son zonas que el precio BUSCARÁ barrer. El mecanismo: precio baja → liquidaciones de longs → más venta forzada → más liquidaciones (cascada). El smart money provoca intencionalmente la cascada para acumular a precio de descuento. USAR: marca las zonas de liquidación caliente en tu gráfico antes de operar.",
      },
      {
        type: "infobox",
        variant: "tip",
        label: "Open Interest como señal de reversión",
        text: "Setup contrarian con OI: OI sube agresivamente + precio sube agresivamente + funding positivo extremo = todo el mundo está long = no hay más comprador = el techo está cerca. OI sube + precio baja + funding negativo extremo = todo el mundo está short = no hay más vendedor = el fondo está cerca. La paradoja del mercado: cuando TODOS están de acuerdo en la dirección, el mercado se mueve en la dirección opuesta para barrer sus stops.",
      },
      {
        type: "table",
        headers: ["Métrica combinada", "OI", "Precio", "Funding", "Interpretación", "Setup"],
        rows: [
          ["Bull trend sano",        "↑ Sube",   "↑ Sube",  "Neutro",  "Nuevos longs abren con convicción",      "Long en pullback a EMA21"],
          ["Short squeeze",          "↓ Baja",   "↑ Sube",  "Negativo","Shorts cierran forzosamente",             "Long agresivo — momentum extremo"],
          ["Bear trend sano",        "↑ Sube",   "↓ Baja",  "Negativo","Nuevos shorts abren con convicción",     "Short en rebote a EMA21"],
          ["Long liquidation",       "↓ Baja",   "↓ Baja",  "Positivo","Longs cierran forzosamente",              "Short agresivo — momentum extremo"],
          ["Techo de ciclo ★",       "Máximo",   "ATH",     "> +0.1%", "Euforia total — distribución inminente", "Reducir longs, buscar short"],
          ["Fondo de ciclo ★",       "Mínimo",   "Mínimo",  "< −0.05%","Capitulación total — acumulación",       "Acumular long — señal contrarian"],
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // N2 — FIBONACCI (enriquecido con extensiones)
  // ════════════════════════════════════════════════════════════════════════
  "fibonacci": {
    sections: [
      {
        type: "fib-chart",
        title: "Fibonacci — Retrocesos, Extensiones y Golden Pocket",
        body: "Los niveles de Fibonacci no son magia — reflejan la proporción natural del universo (Phi = 1.618). El mercado los respeta porque los algoritmos de los principales fondos los tienen programados.",
      },
      {
        type: "fib-levels",
        title: "Golden Pocket y OTE — Las Zonas de Entrada de Alta Probabilidad",
        body: "El Golden Pocket (61.8%–70.5%) es la zona donde el precio retrocede en una tendencia sana antes de continuar. El OTE (Optimal Trade Entry) de ICT abarca de 62% a 79%.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Cómo dibujar Fibonacci correctamente",
        text: "En UPTREND: arrastra el Fibonacci desde el SWING LOW más reciente hasta el SWING HIGH más reciente. Los retrocesos (23.6%, 38.2%, 50%, 61.8%, 78.6%) marcan zonas de compra potencial. En DOWNTREND: arrastra desde el SWING HIGH más reciente hasta el SWING LOW más reciente. Los retrocesos marcan zonas de venta potencial. Error común: usar Fibonacci en timeframes muy bajos (< 15min) sin contexto — los niveles pierden significado sin volumen y estructura.",
      },
      {
        type: "table",
        headers: ["Nivel Fibonacci", "Tipo", "Uso para", "Contexto"],
        rows: [
          ["23.6%", "Retroceso superficial", "Corrección débil en tendencia muy fuerte",    "Solo en impulsos con mucho volumen"],
          ["38.2%", "Retroceso normal",       "Primera zona de re-entrada en tendencia",     "Muy efectivo en onda 4 de Elliott"],
          ["50.0%", "Equilibrio (IPDA)",      "Mitad del rango — divide Premium/Discount",   "El más respetado en SMC/ICT"],
          ["61.8%", "Golden Pocket A ★",      "Retroceso óptimo — entrada de máxima prob.",  "El 'Golden Ratio' — Phi inverso"],
          ["70.5%", "Golden Pocket B / OTE",  "Entrada agresiva en tendencia fuerte",        "Combinado con 61.8% = zona 61.8-70.5%"],
          ["78.6%", "Retroceso profundo",      "Tendencia en riesgo — pero señal poderosa",  "Última zona válida antes de invalidación"],
          ["100%",  "Nivel base",              "Si el precio llega aquí = tendencia rota",   "Zona de invalidación del setup"],
          ["127.2%","Extensión menor",         "Primer TP — extensión moderada",             "Objetivo para TP1"],
          ["161.8%","Extensión áurea ★",       "TP principal — el más respetado",            "Objetivo para TP2 / zona de distribución"],
          ["261.8%","Extensión mayor",         "TP agresivo — tendencias muy fuertes",       "Onda 3 de Elliott frecuentemente aquí"],
          ["423.6%","Extensión extrema",       "Solo en bull markets parabólicos",           "Bitcoin 2020-2021, altcoins extremas"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "Fibonacci Clusters — Donde múltiples niveles convergen",
        text: "Un Fibonacci Cluster es cuando niveles de Fibonacci de diferentes swings coinciden en la misma zona de precio. Por ejemplo: el 61.8% del swing macro + el 38.2% del swing intermedio + un OB + una EMA200 → todos en el mismo nivel de precio. Esto es una confluencia máxima. La regla: cuantos más elementos confluyen en una zona, mayor es la probabilidad de que el precio la respete. Los traders institucionales buscan específicamente estas zonas de alta confluencia.",
      },
      {
        type: "infobox",
        variant: "tip",
        label: "Fibonacci de tiempo — Los ciclos temporales",
        text: "El análisis de Fibonacci no solo aplica al precio, también al tiempo. Fibonacci Time Zones: toma el tiempo entre dos pivotes importantes y proyecta los múltiplos de Fibonacci hacia el futuro. Los giros del mercado tienden a ocurrir en estas fechas proyectadas. Períodos Fibonacci clave: 3, 5, 8, 13, 21, 34, 55, 89 días/semanas. Muchos traders notan que los ATHs y bottoms de BTC han ocurrido cerca de estos períodos desde el último halving o desde el último ciclo.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // N4 — WYCKOFF (enriquecido con los 9 tests)
  // ════════════════════════════════════════════════════════════════════════
  "wyckoff": {
    sections: [
      {
        type: "wyckoff-chart",
        title: "Wyckoff — Acumulación, Distribución y el Composite Man",
        body: "Los esquemas de Wyckoff funcionan porque reflejan la única verdad inmutable del mercado: los institucionales necesitan tiempo para acumular o distribuir sin mover el precio en su contra.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Los 9 Tests de Compra de Wyckoff — La lista de verificación",
        text: "Test 1: ¿El objetivo bajista se ha cumplido (SC)? Test 2: ¿El volumen disminuye en declives? Test 3: ¿El precio mantiene soporte sobre el mínimo previo (ST no rompe SC)? Test 4: ¿El precio sube más en rallies que en declives? Test 5: ¿Los SOS tienen mayor spread y volumen que los SOW? Test 6: ¿El volumen aumenta en movimientos alcistas y disminuye en bajistas? Test 7: ¿Las acciones/sectores fuertes lideran? Test 8: ¿Las líneas de oferta y demanda convergen? Test 9: ¿El precio vuelve a confirmar (LPS) antes de iniciar markup? Cuantos más tests se cumplen, mayor es la probabilidad de que el markup ha comenzado.",
      },
      {
        type: "liquidity-absorption",
        title: "Esfuerzo vs. Resultado — El análisis de volumen de Wyckoff",
        body: "Wyckoff analizaba la relación entre el esfuerzo (volumen) y el resultado (movimiento de precio). Un volumen alto con poco movimiento = absorción. Un volumen bajo con gran movimiento = sin resistencia.",
      },
      {
        type: "table",
        headers: ["Esfuerzo (Volumen)", "Resultado (Precio)", "Interpretación", "Acción"],
        rows: [
          ["Alto", "Movimiento grande (spread amplio)",  "Mercado con convicción — tendencia sana",         "Seguir la dirección"],
          ["Alto", "Movimiento pequeño (spread estrecho)","Absorción — oferta/demanda equilibrada en ese nivel", "Zona de acumulación/distribución"],
          ["Bajo",  "Movimiento grande",                 "Sin resistencia — vacío de liquidez (FVG)",       "El precio llenará ese gap eventualmente"],
          ["Bajo",  "Movimiento pequeño",                "Inactividad — mercado sin interés institucional",  "No operar — esperar volumen"],
          ["Alto creciente en rally",  "Precio sube",   "Demanda institucional genuina",                   "Mantener longs — trend sano"],
          ["Alto creciente en caída",  "Precio baja",   "Oferta institucional — distribución activa",      "Cerrar longs — corto plazo bajista"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "Wyckoff 2.0 — La metodología en mercados modernos",
        text: "David Weis y Roman Bogomazov han actualizado a Wyckoff para el siglo XXI. Wyckoff moderno incluye: análisis de Order Flow y Delta (CVD) para identificar absorción. Identificar el Spring en gráficos de 1H con volumen climático antes del movimiento real. El concepto de Cause and Effect: el tamaño del rango de acumulación (causa) predice la extensión del markup (efecto). Regla de proporcionalidad de Wyckoff: una causa mayor produce un efecto mayor — rangos de acumulación largos = markups largos.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // N5 — ÍNDICES BURSÁTILES (cards completas por índice)
  // ════════════════════════════════════════════════════════════════════════
  "indices": {
    sections: [
      {
        type: "vix-chart",
        title: "Índices Globales y el VIX — El Mapa del Riesgo",
        body: "Los índices bursátiles son la radiografía del mercado en tiempo real. Representan cestas de las empresas más importantes de cada economía. Un trader serio los monitorea todos los días — no para operar acciones, sino para entender el flujo de dinero global.",
      },
      {
        type: "index-cards",
        title: "Diccionario de Índices — Qué son, de dónde vienen y cómo afectan tu trading",
        body: "Cada índice tiene su propia personalidad, origen y forma de impactar el mercado. Conocerlos te permite leer el contexto macro antes de ejecutar cualquier operación.",
        cards: [
          {
            name: "S&P 500",
            ticker: "SPX / ES / SPY",
            emoji: "🏛️",
            color: "#00e676",
            tipo: "Índice USA — 500 empresas",
            nivel: "EL MÁS IMPORTANTE",
            que_es: "Índice que agrupa las 500 empresas de mayor capitalización bursátil listadas en NYSE y NASDAQ. Es el benchmark de referencia global — todos los fondos del mundo se comparan contra el SPX.",
            origen: "Creado por Standard & Poor's en 1957. Hoy gestionado por S&P Dow Jones Indices. Se rebalancea trimestralmente — entrar al SPX500 es uno de los mayores eventos para una empresa. Pondera por capitalización de mercado.",
            para_que: "El barómetro más importante de la economía americana y global. Si el SPX sube → risk-on → capital fluye a activos de riesgo. Si el SPX cae → risk-off → capital busca refugio (bonds, cash, gold). El ETF SPY tiene más de $500B en activos.",
            como_afecta: "Correlación directa con BTC en momentos de crisis. Cuando institucionales sufren pérdidas en SPX, venden otros activos (incluyendo BTC) para cubrir márgenes. Los 'circuit breakers' del mercado (−7%, −13%, −20%) se basan en el SPX. Niveles clave: EMA200 diaria del SPX = señal de cambio de régimen para todo el mercado.",
            btc_corr: "Correlación +0.6 a +0.8 en bear markets. En 2022 el SPX cayó -27% y BTC cayó -75%. Cuando el SPX rompe EMA200 diaria, BTC históricamente baja 2-3x más. En bull market del SPX, BTC tiende a superar el rendimiento del índice.",
          },
          {
            name: "NASDAQ 100",
            ticker: "NQ / QQQ / NDX",
            emoji: "💻",
            color: "#00e5ff",
            tipo: "Índice Tech USA — 100 empresas",
            nivel: "LIDERA EL MERCADO",
            que_es: "Las 100 empresas no financieras más grandes del NASDAQ, dominado por tecnología. Las MAG7 representan ~45% del índice. Si las grandes tech suben, el NQ sube y lidera al SPX.",
            origen: "Creado en 1985 por NASDAQ OMX Group. Rebalanceado anualmente. Solo incluye empresas listadas en NASDAQ (no NYSE). Las opciones del QQQ (ETF del NDX) son las más negociadas del mundo.",
            para_que: "El NQ lidera al SPX en ciclos de risk-on/risk-off. Si el NQ hace un CHoCH bajista antes que el SPX → señal de alerta temprana. El NQ es el índice más sensible a las tasas de interés — cuando la Fed sube tasas, el NQ cae más que el SPX.",
            como_afecta: "Nvidia (NVDA) representa ~8% del NQ. Cada earnings de NVDA mueve el índice. Bitcoin tiene correlación más alta con el NQ que con el SPX porque ambos son activos de alto crecimiento/especulativos. Cuando el NQ/SPX ratio baja = rotación de tech a value = risk-off parcial.",
            btc_corr: "Correlación histórica +0.75 con BTC. El NQ lidera las reversiones de BTC con 1-3 días de anticipación. En 2021 ambos hicieron ATH. En 2022 ambos hicieron bottom en el mismo período (Nov 2022). Monitorear el NQ diario es parte del análisis macro de todo trader de crypto.",
          },
          {
            name: "Dow Jones Industrial",
            ticker: "DJI / US30 / YM",
            emoji: "🏭",
            color: "#ffd700",
            tipo: "Índice USA — 30 industriales",
            nivel: "HISTÓRICO",
            que_es: "El índice más antiguo de Wall Street (1896). Solo 30 empresas 'blue chip' seleccionadas por el Wall Street Journal. No representa al mercado moderno tan bien como el SPX, pero tiene valor simbólico y mediático enorme.",
            origen: "Creado por Charles Dow y Edward Jones en 1896. Originalmente 12 empresas industriales. Pondera por precio de acción (no capitalización) — peculiaridad única: una acción cara tiene más peso aunque la empresa sea más pequeña. Solo se rebalancea en eventos especiales.",
            para_que: "Indicador sentimental más que analítico. Cuando los noticieros dicen 'la bolsa subió X puntos', hablan del Dow. El 'Dow Theory' (análisis de señales entre el DJI y el Dow Transportation) todavía es usado por analistas clásicos.",
            como_afecta: "Menos relevante para el trader moderno que el SPX o NQ. Sin embargo, breakouts del Dow en máximos históricos son señales mediáticas que generan FOMO retail. Correlación menor con BTC que el NQ.",
            btc_corr: "Correlación menor que NQ/SPX. El Dow está compuesto de empresas 'value' (industriales, seguros, farmacéuticas) — menos correlacionadas con BTC. Útil principalmente como confirmación del SPX, no como señal propia.",
          },
          {
            name: "Russell 2000",
            ticker: "RUT / IWM / RTY",
            emoji: "🔬",
            color: "#ff6d00",
            tipo: "Índice USA — 2000 small caps",
            nivel: "TERMÓMETRO INTERNO",
            que_es: "Índice que agrupa las 2,000 empresas de mediana y pequeña capitalización de EEUU. Se considera el indicador más puro de la salud económica interna americana (no multinacionales, sino empresas que operan principalmente en EEUU).",
            origen: "Creado en 1984 por la London Stock Exchange Group (ahora FTSE Russell). Es el subíndice inferior del Russell 3000. Se rebalancea cada junio — el 'Russell Reconstitution' es uno de los eventos de mayor volumen del año en Wall Street.",
            para_que: "El RUT/SPX ratio muestra si el mercado es 'broad' o 'narrow'. Si las small caps suben más que el SPX = rally sano con participación amplia. Si el SPX sube pero el RUT cae = rally solo por las grandes empresas = señal de debilidad. El RUT es el primero en caer en recesiones y el primero en recuperarse.",
            como_afecta: "Correlación alta con el sentimiento de riesgo interno. RUT rompiendo máximos = señal de bull market sano. RUT divergiendo negativamente del SPX = señal de alerta macro. Menor correlación directa con BTC pero importante para el contexto.",
            btc_corr: "Correlación indirecta. Un RUT fuerte = economía sana = risk appetite = positivo para BTC. Un RUT divergente bajista del SPX = señal de que el rally del SPX es artificial = potencialmente negativo para BTC en el mediano plazo.",
          },
          {
            name: "VIX",
            ticker: "VIX / UVXY / SVXY",
            emoji: "😱",
            color: "#e040fb",
            tipo: "Índice de Volatilidad — Fear Index",
            nivel: "EL TERMÓMETRO DEL MIEDO",
            que_es: "El VIX (Volatility Index) mide la volatilidad implícita del S&P 500 para los próximos 30 días, calculada a partir del mercado de opciones sobre el SPX. NO mide la dirección del mercado — mide la VELOCIDAD esperada del movimiento. Un VIX alto = mercado esperando grandes movimientos.",
            origen: "Creado por el CBOE (Chicago Board Options Exchange) en 1990. Diseñado por Robert Whaley. Se calcula a partir de los precios de opciones calls y puts del SPX en múltiples strikes. Es puramente derivado del mercado de opciones — no tiene precio propio de las acciones subyacentes.",
            para_que: "Lectura del miedo del mercado: VIX < 15 = complacencia (peligro escondido). VIX 15-25 = normal. VIX 25-35 = incertidumbre. VIX > 35 = miedo. VIX > 50 = pánico histórico. Regla contrarian: VIX en extremos = señal de reversión. Un pico de VIX coincide con bottoms históricos del SPX.",
            como_afecta: "Relación INVERSA con el SPX: cuando el VIX sube, el SPX baja (casi siempre). VIX > 30 → los fondos reducen posiciones (margin calls, reglas de risk). VIX en pico → seguros de cartera se disparan de precio → institucionales compran el mercado. El VIX spike de COVID (> 80) fue el mejor momento de compra en décadas.",
            btc_corr: "Correlación negativa con BTC. VIX > 30 suele acompañar caídas de BTC. Pero en extremos (VIX > 50), el pánico del SPX puede coincidir con bottoms de BTC también. Monitorear: si VIX empieza a subir gradualmente sin crisis visible = señal de alerta para reducir posiciones en BTC.",
          },
          {
            name: "DAX 40",
            ticker: "DAX / DE40 / FDAX",
            emoji: "🇩🇪",
            color: "#ffd700",
            tipo: "Índice Alemania — 40 empresas",
            nivel: "EUROPA",
            que_es: "El índice más importante de Europa. Agrupa las 40 empresas de mayor capitalización de la Bolsa de Frankfurt (Frankfurter Wertpapierbörse). Representa la economía industrial más grande de Europa: autos, química, farmacéutica, finanzas.",
            origen: "Creado en 1988 por Deutsche Börse AG. Expandido de 30 a 40 componentes en 2021. Incluye dividendos reinvertidos (a diferencia del SPX), lo que lo hace único. Empresas clave: SAP, Siemens, Volkswagen, BASF, Allianz, Deutsche Bank.",
            para_que: "Termómetro de la economía europea. Cuando el DAX hace ATH = economía europea fuerte = euro fuerte = DXY débil = positivo para BTC y materias primas. El DAX tiene alta correlación con el sector automotriz global.",
            como_afecta: "DAX débil + EUR débil = DXY fuerte = presión sobre BTC y commodities. El DAX reacciona fuertemente a eventos geopolíticos europeos (guerra Ucrania 2022, crisis energética). Es el primer mercado europeo en abrir — puede anticipar la apertura del SPX.",
            btc_corr: "Correlación moderada. Su impacto en BTC es principalmente a través del EUR/USD → DXY. Un DAX muy fuerte (EUR fuerte) puede ser positivo para BTC. Crisis europea grave (DAX -10%+) suele arrastrar a BTC junto con los demás activos de riesgo.",
          },
          {
            name: "Nikkei 225",
            ticker: "NI225 / NK / JPN225",
            emoji: "🇯🇵",
            color: "#ff1744",
            tipo: "Índice Japón — 225 empresas",
            nivel: "ASIA",
            que_es: "El índice más antiguo de Asia (1950). Las 225 empresas de mayor actividad bursátil en la Bolsa de Tokio (TSE). Dominado por tecnología, automoción y finanzas japonesas: Toyota, Sony, SoftBank, Nintendo, Mitsubishi.",
            origen: "Calculado por Nihon Keizai Shimbun (Nikkei) desde 1950, basado en métodos del Dow Jones (pondera por precio, no capitalización). Fue el primer índice global en llegar a 40,000 puntos y tuvo el famoso crash de 1990 (-60%) tras la burbuja inmobiliaria japonesa.",
            para_que: "Primer gran índice en abrir cada jornada mundial (sesión asiática). Marca el tono de riesgo global antes de que abra Europa y EEUU. El carry trade del yen (JPY) está directamente relacionado con el Nikkei — cuando el yen se aprecia bruscamente, el Nikkei cae.",
            como_afecta: "El 'Yen Carry Trade': fondos piden prestado en JPY (tasa 0%) para invertir en activos de mayor rendimiento globalmente. Cuando el yen sube (Bank of Japan sube tasas), estos fondos VENDEN activos de riesgo para devolver el yen — cascada global. El crash de agosto 2024 fue el Nikkei cayendo -12% en un día por esta razón, arrastrando a BTC.",
            btc_corr: "El crash del Nikkei de agosto 2024 provocó que BTC cayera -25% en 48 horas. La razón: unwinding del carry trade del yen. Monitorear el JPY/USD: si el yen se aprecia bruscamente = riesgo de crash en todo el mercado global incluyendo BTC.",
          },
          {
            name: "Hang Seng",
            ticker: "HSI / HHI",
            emoji: "🇭🇰",
            color: "#ff6d00",
            tipo: "Índice Hong Kong — 82 empresas",
            nivel: "CHINA / ASIA",
            que_es: "El índice principal de la Bolsa de Hong Kong (HKEX). Incluye las empresas más importantes de Hong Kong y China listadas allí: Alibaba, Tencent, Meituan, HSBC, China Mobile. Es el proxy más accesible de la economía china para traders occidentales.",
            origen: "Creado en 1969 por HSI Services Limited. Reestructurado en 2021 para incluir más empresas tecnológicas chinas. Ha pasado de 30 a 82 componentes. El Hang Seng está dolarizado en HKD (anclado al USD).",
            para_que: "Barómetro de la economía china y el apetito de riesgo asiático. Regulaciones del PCCh (Partido Comunista Chino) pueden hacer que el Hang Seng caiga -20% en días — riesgo regulatorio único. Importante para commodities (China es el mayor consumidor mundial).",
            como_afecta: "China impulsa el 20-30% de la demanda mundial de materias primas. HSI débil = economía china en problemas = menos demanda de petróleo, cobre, etc. Crisis del sector inmobiliario chino (Evergrande 2021) hizo caer el HSI -50% e impactó a mercados globales.",
            btc_corr: "Correlación moderada. Importante: capital chino usa BTC como vía de salida en crisis. Cuando el CNY (yuan) se deprecia o hay controles de capital, la demanda de BTC desde China puede subir. El ban de BTC en China (2021) hizo caer BTC -50% — Pekín tiene poder de mercado sobre crypto.",
          },
          {
            name: "MOVE Index",
            ticker: "MOVE",
            emoji: "📈",
            color: "#00e5ff",
            tipo: "Volatilidad de Bonos — VIX del renta fija",
            nivel: "MACRO AVANZADO",
            que_es: "El MOVE (Merrill Lynch Option Volatility Estimate) es el equivalente del VIX pero para el mercado de bonos del Tesoro americano. Mide la volatilidad implícita de los bonos T-Note a 1, 2, 5 y 10 años. Cuando el MOVE sube = el mercado de bonos está en pánico.",
            origen: "Creado por Merrill Lynch en 1988, ahora calculado por ICE (Intercontinental Exchange). Se calcula a partir de opciones sobre los futuros de bonos del Tesoro. Es menos conocido que el VIX pero más respetado por los traders institucionales de mayor nivel.",
            para_que: "El mercado de bonos es 3x más grande que el de acciones. Cuando el MOVE dispara = los traders de bonos (los más inteligentes del mercado) están en pánico = señal de riesgo sistémico. En la crisis de SVB (marzo 2023), el MOVE llegó a niveles de 2008 — días antes de que el SPX cayera.",
            como_afecta: "MOVE alto + VIX alto = crisis sistémica real. Si el VIX sube pero el MOVE está tranquilo = volatilidad solo en acciones, menos preocupante. Si el MOVE sube antes que el VIX = el mercado de bonos está viendo algo que las acciones aún no descuentan.",
            btc_corr: "Correlación negativa en crisis. MOVE por encima de 150 históricamente coincide con caídas en BTC. El MOVE spike de octubre 2023 coincidió con BTC en $25,000. Cuando el MOVE cae desde extremos = señal de normalización = positivo para todos los activos de riesgo incluyendo BTC.",
          },
          {
            name: "Fear & Greed Index",
            ticker: "CNN F&G",
            emoji: "🎭",
            color: "#7c4dff",
            tipo: "Índice de Sentimiento — Crypto y Acciones",
            nivel: "SENTIMIENTO",
            que_es: "Indicador de sentimiento del mercado que va de 0 (Miedo Extremo) a 100 (Codicia Extrema). Existe en dos versiones: CNN Fear & Greed para el mercado de acciones (7 factores incluyendo VIX, momentum, opciones, etc.) y el Crypto Fear & Greed Index para BTC (volumen, dominancia, redes sociales, Google Trends).",
            origen: "CNN Money creó el original para acciones en 2012. Alternative.me creó la versión crypto en 2018. Ninguno tiene el peso institucional del VIX pero son muy seguidos por el retail y se convierten en profecías autocumplidas.",
            para_que: "Indicador contrarian clásico. Warren Buffett: 'Sé codicioso cuando otros tienen miedo, sé cauteloso cuando otros son codiciosos.' En trading: F&G < 20 = zona de acumulación agresiva. F&G > 80 = zona de distribución. No usar en aislamiento — confirmar con análisis técnico.",
            como_afecta: "Mercados en Codicia Extrema (>80): FOMO retail en su punto máximo, valuaciones extremas, SL muy ajustados. Mercados en Miedo Extremo (<20): capitulación retail, shorts masivos, liquidaciones, precio puede estar en bottom. La transición de Miedo a Neutral es frecuentemente el inicio de un nuevo bull market.",
            btc_corr: "El Crypto Fear & Greed sigue a BTC casi perfectamente. Valores históricos en fondo de ciclo: < 10 en noviembre 2022 (BTC $15,500). Valores en techo: > 90 en noviembre 2021 (BTC $69,000). Un F&G crypto < 20 combinado con MVRV Z-Score negativo = señal de acumulación de largo plazo.",
          },
        ],
      },
      {
        type: "table",
        headers: ["Índice", "País/Región", "Horario GMT-5", "Impacto en BTC", "Señal clave"],
        rows: [
          ["S&P 500 (SPX)",    "EEUU",        "09:30 – 16:00", "Muy Alto",  "SPX bajo EMA200 diaria = risk-off global"],
          ["NASDAQ 100 (NQ)", "EEUU (Tech)",  "09:30 – 16:00", "Muy Alto",  "NQ lidera al SPX — CHoCH del NQ = alerta"],
          ["VIX",             "EEUU (Opciones)", "09:30+",     "Muy Alto",  "VIX > 30 = riesgo. Pico VIX = posible bottom"],
          ["Dow Jones (DJI)", "EEUU (30 emp)", "09:30 – 16:00","Medio",     "Más sentimental que técnico"],
          ["Russell 2000",    "EEUU (small)", "09:30 – 16:00", "Medio",     "RUT diverge del SPX = rally falso"],
          ["DAX 40",          "Alemania",     "03:00 – 11:30", "Medio",     "DAX débil = EUR débil = DXY fuerte"],
          ["Nikkei 225",      "Japón",        "19:00 – 02:00", "Medio",     "Yen fuerte = unwinding carry = crash global"],
          ["Hang Seng",       "Hong Kong",    "21:00 – 04:00", "Bajo-Medio","Regulación China = impacto crypto directo"],
          ["MOVE Index",      "EEUU (Bonos)", "Continuo",      "Alto",      "MOVE > 150 = crisis de bonos = riesgo sistémico"],
          ["F&G Index",       "Crypto/Acciones","Diario",      "Medio",     "< 20 = acumular. > 80 = distribuir"],
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // N5 — VIX (enriquecido con niveles y estrategias)
  // ════════════════════════════════════════════════════════════════════════
  "vix": {
    sections: [
      {
        type: "vix-chart",
        title: "VIX — El Termómetro del Miedo del Mercado",
        body: "El VIX no predice la dirección del mercado — predice la velocidad del movimiento. Un VIX alto en 30 no significa que el mercado va a bajar; significa que el mercado va a MOVERSE RÁPIDO en alguna dirección.",
      },
      {
        type: "index-cards",
        title: "Los 3 índices de miedo más importantes del mercado",
        body: "Cada uno mide un tipo diferente de riesgo. Juntos forman el 'panel de alarmas' del trader macro.",
        cards: [
          {
            name: "VIX — S&P 500 Volatility",
            ticker: "VIX / CBOE:VIX",
            emoji: "😱",
            color: "#e040fb",
            tipo: "Volatilidad implícita SPX — 30 días",
            nivel: "REFERENCIA GLOBAL",
            que_es: "Mide la volatilidad implícita del S&P 500 para los próximos 30 días usando precios de opciones call y put del SPX. No es una predicción de dirección — es una medida del precio del seguro del mercado. Cuando el 'seguro' es caro = hay miedo.",
            origen: "CBOE (Chicago Board Options Exchange), 1990. Diseñado por Robert Whaley. Calculado en tiempo real durante el horario de mercado. La fórmula fue actualizada en 2003 para usar opciones de múltiples strikes (modelo de varianza replicada).",
            para_que: "Clasificación de régimen de mercado: < 15 (baja volatilidad / complacencia), 15-25 (normal), 25-35 (estrés), > 35 (crisis), > 50 (pánico histórico). Estrategia: VIX en pico extremo = comprar acciones o BTC. VIX cayendo desde > 30 = apertura de posiciones largas de mediano plazo.",
            como_afecta: "Relación inversa con el SPX (correlación ~-0.8). Cuando el VIX sube 10 puntos en un día, el SPX cae -3% a -8% típicamente. Los fondos de pensiones tienen mandatos que los obligan a vender cuando el VIX supera ciertos umbrales — acelerando las caídas. Es autorreferencial: cuando el VIX sube, los fondos venden, lo que sube más el VIX.",
            btc_corr: "VIX > 30 históricamente coincide con caídas de BTC de -20% a -50%. VIX > 50 (solo en crisis históricas) = bottom. En el VIX spike de marzo 2020 (85), BTC cayó -50% y luego se recuperó +300% en 12 meses. Señal: VIX en pico → esperar 2-3 días → acumular BTC.",
          },
          {
            name: "VIX9D y VIX3M",
            ticker: "VIX9D / VIX3M",
            emoji: "📅",
            color: "#00e5ff",
            tipo: "VIX de 9 días y 3 meses — Estructura temporal",
            nivel: "AVANZADO",
            que_es: "VIX9D = volatilidad implícita del SPX para los próximos 9 días. VIX3M = volatilidad implícita para los próximos 3 meses. Comparar estos tres VIX (9D, 30D, 3M) revela la estructura temporal del miedo (VIX Term Structure).",
            origen: "También del CBOE. El VIX9D es particularmente sensible a eventos de corto plazo (FOMC, earnings). El VIX3M captura el riesgo de mediano plazo.",
            para_que: "VIX9D > VIX > VIX3M = 'contango invertido' = pánico de corto plazo pero calma esperada a futuro = señal de compra. VIX3M > VIX > VIX9D = estructura normal = mercado tranquilo. La inversión de la curva del VIX es una de las señales de compra más fiables del mercado de opciones.",
            como_afecta: "Los traders de opciones utilizan los spreads entre VIX9D/VIX/VIX3M para construir posiciones de volatilidad. Cuando el VIX9D explota por encima del VIX3M = evento de corto plazo específico siendo descontado.",
            btc_corr: "Indirecta. Si el VIX Term Structure se normaliza (inversión se resuelve), es señal de que el pánico del SPX está cediendo = potencialmente positivo para BTC.",
          },
          {
            name: "VVIX — Volatilidad del VIX",
            ticker: "VVIX / CBOE:VVIX",
            emoji: "🌪️",
            color: "#ffd700",
            tipo: "Volatilidad de la volatilidad",
            nivel: "EXPERTO",
            que_es: "El VVIX mide la volatilidad del propio VIX — la volatilidad de la volatilidad. Si el VIX es el miedo del mercado, el VVIX es el miedo del miedo. Un VVIX alto significa que el VIX en sí mismo está moviéndose de forma impredecible.",
            origen: "CBOE. Calculado de manera análoga al VIX pero usando opciones sobre el propio VIX futuros. Es la 'segunda derivada' del miedo.",
            para_que: "VVIX > 120 = pánico extremo incluso en el mercado de volatilidad = señal contrarian muy fuerte de bottom. VVIX bajo con VIX moderado = mercado en calma sostenible. Señal de alerta: VVIX subiendo mientras el VIX está bajo = algo se está gestando.",
            como_afecta: "Usado principalmente por traders de opciones y volatilidad. Cuando el VVIX dispara, las estrategias de opciones (straddles, strangles) se encarecen extremadamente. Para el trader de BTC, es una señal macro de segundo orden.",
            btc_corr: "Indirecta. VVIX en extremos coincide con los momentos de mayor caos de mercado — también los mejores momentos de acumulación de BTC a largo plazo.",
          },
        ],
      },
      {
        type: "table",
        headers: ["Nivel VIX", "Régimen", "Acción para BTC", "Estrategia de opciones"],
        rows: [
          ["< 12",    "Complacencia extrema",  "Cautela — crash puede llegar sin aviso",     "Comprar puts del SPX como cobertura"],
          ["12 – 15", "Baja volatilidad",       "Normal — operar con plan",                    "Vender volatilidad (theta plays)"],
          ["15 – 20", "Volatilidad normal",     "Condiciones óptimas de trading",              "Cualquier estrategia"],
          ["20 – 25", "Atención",               "Reducir tamaño de posición 20%",              "Opciones se encarecen levemente"],
          ["25 – 30", "Estrés",                 "Reducir exposición 40%",                      "Primas de opciones altas"],
          ["30 – 40", "Miedo",                  "Esperar — preparar para acumular",            "Comprar calls (muy baratos relativamente)"],
          ["40 – 50", "Pánico",                 "Comenzar acumulación gradual BTC",            "Calls de largo plazo muy atractivos"],
          ["> 50",    "Crisis histórica",       "Acumulación agresiva BTC con SL amplio",      "LEAPS (opciones largo plazo) vs comprar el ETF"],
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // N5 — LAS MAGNÍFICAS 7 (cards detalladas por empresa)
  // ════════════════════════════════════════════════════════════════════════
  "mag7": {
    sections: [
      {
        type: "mag7-chart",
        title: "Las Magníficas 7 — Market Cap, Peso en S&P 500 y Correlación BTC",
        body: "Microsoft, Apple, Nvidia, Alphabet, Amazon, Meta y Tesla representan ~35% del S&P 500 y ~45% del NASDAQ 100. No son 7 empresas dentro del índice — SON el índice. Si las MAG7 suben, el SPX sube aunque las otras 493 empresas caigan. Entender cada una es entender el flujo de dinero institucional.",
      },
      {
        type: "infobox",
        variant: "warning",
        label: "POR QUÉ SE LLAMAN 'LAS MAGNÍFICAS 7'",
        text: "El término fue acuñado en 2023 por Michael Hartnett, estratega de Bank of America, haciendo referencia a la película 'Los Siete Magníficos' (1960). Surgió para describir las únicas 7 empresas que subían en un mercado general débil durante 2022-2023. Antes eran las 'FAANG' (Facebook, Apple, Amazon, Netflix, Google) — luego Netflix fue reemplazada por Microsoft y Nvidia cuando la narrativa de IA se convirtió en el motor principal.",
      },
      {
        type: "index-cards",
        title: "Las 7 Magníficas — Una por Una",
        body: "Cada empresa tiene su propia narrativa, sus propios catalizadores de precio y su propia forma de afectar al mercado y a BTC. Estudiarlas individualmente te da ventaja enorme antes de noticias de earnings.",
        cards: [
          {
            name: "NVIDIA Corporation",
            ticker: "NVDA",
            emoji: "🟢",
            color: "#76b900",
            tipo: "Semiconductores · IA · Data Centers",
            nivel: "LA MÁS IMPORTANTE AHORA",
            que_es: "Diseña GPUs (unidades de procesamiento gráfico) que se convirtieron en el hardware esencial para entrenar modelos de inteligencia artificial. Sus chips H100 y A100 son la columna vertebral de ChatGPT, Google Gemini, Meta Llama y prácticamente todo modelo de IA a escala. En 2023 su capitalización pasó de $400B a $3T — el crecimiento más rápido en la historia del S&P 500.",
            origen: "Fundada en 1993 por Jensen Huang, Chris Malachowsky y Curtis Priem en Santa Clara, CA. Originalmente orientada a videojuegos. La apuesta por CUDA (plataforma de computación paralela) en 2006 fue el movimiento que los posicionó para dominar la IA 15 años después. Salida al mercado en 1999 a $12/acción.",
            para_que: "El 'canary in the coal mine' del apetito institucional por riesgo tecnológico. NVDA reporting earnings es el evento trimestral más seguido por traders de BTC porque la reacción post-earnings del NQ marca el tono de riesgo de las semanas siguientes. Si NVDA bate estimaciones en márgenes brutos → rally generalizado de activos de riesgo. Si decepciona → sell-off tech.",
            como_afecta: "Representa ~8% del NASDAQ 100 y ~7% del SPX. Un movimiento de ±10% en NVDA en un solo día (que ocurre con frecuencia en earnings) mueve el NQ ±1.5% y el SPX ±0.8%. Su capitalización de mercado supera el PIB de Alemania. La demanda de NVDA es el proxy más directo del gasto corporativo en IA. Guidance bajista de NVDA = frenada del ciclo IA = caída generalizada tech.",
            btc_corr: "Alta correlación positiva en el ciclo 2023-2025. Ambos son activos de 'narrativa tecnológica + escasez + adopción acelerada'. En enero 2023, cuando NVDA rompió $200, BTC también inició su recuperación. En agosto 2024, el crash del Nikkei afectó a NVDA -20% y a BTC -25% simultáneamente. Monitorear: si NVDA hace un Higher High pero el NQ no confirma → divergencia bajista táctica.",
          },
          {
            name: "Microsoft Corporation",
            ticker: "MSFT",
            emoji: "🪟",
            color: "#00a4ef",
            tipo: "Cloud · IA · Software · Gaming",
            nivel: "LA MÁS ESTABLE",
            que_es: "La segunda empresa más grande del mundo por capitalización. Sus tres pilares de ingresos son: Azure (cloud #2 mundial detrás de AWS), Office 365 / Teams (productividad, 300M usuarios) y Gaming (Xbox, Activision-Blizzard). En 2023 invirtió $13B en OpenAI (ChatGPT) y es el principal habilitador de IA empresarial globalmente.",
            origen: "Fundada en 1975 por Bill Gates y Paul Allen en Albuquerque, NM. Dominó el mercado con MS-DOS y luego Windows. Casi destruida por el auge de internet (perdió la guerra de los browsers), pero renació bajo Satya Nadella (CEO desde 2014) con su pivot a cloud. En 2019 fue la primera empresa en superar $1T de capitalización.",
            para_que: "El termómetro de la salud del gasto corporativo en tecnología. Cuando Azure crece más del 30% trimestral → las empresas siguen invirtiendo en transformación digital → risk-on. Cuando Azure desacelera → las empresas están recortando costos → potencial riesgo macro. El crecimiento de Azure es el indicador más confiable del ciclo de inversión tech empresarial.",
            como_afecta: "~7% del SPX y ~9% del NQ. Sus earnings (usualmente enero, abril, julio, octubre) son el primer gran earnings de la temporada tech. Si MSFT guía conservador → toda la temporada tech empieza con cautela. Tiene beta más baja que NVDA o TSLA — los fondos de pensiones y gestoras conservadoras lo tienen como primera posición en tech. Su movimiento diario afecta los flujos de ETFs como SPY, QQQ, y VTI.",
            btc_corr: "Correlación moderada, principalmente a través del NQ. MSFT tiene BTC en su balance sheet y ha explorado tokenización de activos reales. El crecimiento de Azure para blockchains y smart contracts (Azure Blockchain) crea un vínculo narrativo. Cuando MSFT reporta crecimiento de nube > expectativas, BTC tiende a subir en los 3 días siguientes.",
          },
          {
            name: "Apple Inc.",
            ticker: "AAPL",
            emoji: "🍎",
            color: "#a2aaad",
            tipo: "Consumer Electronics · Servicios · Pagos",
            nivel: "LA MÁS GRANDE",
            que_es: "Durante muchos años la empresa de mayor capitalización del mundo (~$3T en picos). Su negocio tiene dos motores: Hardware (iPhone ~50% de ingresos, Mac, iPad, Watch) y Servicios (App Store, Apple Pay, iCloud, Apple TV+, Apple Music — margen bruto del 72%). El servicio de servicios crece más que el hardware y está más cerca de un banco que de una empresa tech.",
            origen: "Fundada en 1976 por Steve Jobs, Steve Wozniak y Ronald Wayne en Los Altos, CA. El Apple I se vendió ensamblado a mano. La visión de Jobs de 'computación personal elegante' definió cada producto. Fue rescatada de la quiebra en 1997 cuando Jobs regresó. El iPhone (2007) es considerado el producto más exitoso de la historia empresarial.",
            para_que: "El barómetro del consumidor global de clase media-alta. Cuando las ventas de iPhone en China caen → la economía china está mal → impacto en commodities y mercados emergentes. Los servicios de Apple (App Store) capturan el 30% de todos los ingresos de aplicaciones móviles — incluyendo las apps de exchanges de crypto. Su ciclo de 'Superciclo iPhone' (cada 3-4 años con upgrade masivo) genera rallies predecibles.",
            como_afecta: "~7% del SPX (la mayor ponderación individual). Un solo día de -5% en AAPL mueve el SPX -0.35% mecánicamente. Warren Buffett (Berkshire Hathaway) tenía el 50% de su cartera en AAPL — su venta en 2024 fue un evento macro que movió el SPX. El 'Apple Tax' (30% de comisión App Store) impacta directamente a las plataformas crypto y DeFi.",
            btc_corr: "Correlación baja directa, pero importante indirecta. Apple Pay vs crypto: si Apple lanzara un wallet nativo de BTC/stablecoins (rumoreado desde 2021), podría ser el catalizador de adopción masiva más importante de la historia crypto. Apple Pay ya procesa más pagos que Visa en USA. El ciclo de upgrade del iPhone correlaciona con el ciclo de adopción de wallets crypto móviles.",
          },
          {
            name: "Alphabet Inc. (Google)",
            ticker: "GOOGL / GOOG",
            emoji: "🔵",
            color: "#4285f4",
            tipo: "Búsqueda · Cloud · IA · Publicidad",
            nivel: "EL MONOPOLIO DE LA INFORMACIÓN",
            que_es: "Holding que controla Google (92% del mercado de búsquedas global), YouTube (#2 en tráfico web mundial), Google Cloud (cloud #3), Android (72% del mercado de smartphones), Waymo (autos autónomos) y DeepMind (investigación IA). El 80% de sus ingresos viene de publicidad digital — Google es el mayor intermediario de atención humana de la historia.",
            origen: "Google fundada en 1998 por Larry Page y Sergey Brin en un garaje de Menlo Park (la misma historia de Silicon Valley). El algoritmo PageRank revolucionó la búsqueda web. Alphabet creada en 2015 para separar las 'apuestas' (Waymo, DeepMind) del negocio principal. Su IPO en 2004 a $85/acción fue uno de los más esperados de la historia.",
            para_que: "El termómetro del gasto en publicidad digital = termómetro de la salud corporativa global. Cuando los ingresos de publicidad de Google crecen → las empresas tienen dinero para gastar en marketing → economía sana → risk-on. Google Trends es usado por traders institucionales para medir el interés retail en activos: los picos de búsqueda de 'Bitcoin' en Google correlacionan con tops de mercado.",
            como_afecta: "~4% del SPX. Su duopolio de publicidad digital con Meta captura ~65% del gasto global en publicidad online. ChatGPT amenaza directamente su negocio de búsqueda — cada avance de OpenAI/MSFT en IA de búsqueda genera presión bajista en GOOGL. El lanzamiento de Gemini (IA de Google) es la respuesta y determina si mantiene su posición dominante. La regulación antimonopolio (DOJ vs Google) es un riesgo permanente.",
            btc_corr: "Correlación moderada. Google Cloud ofrece servicios de blockchain y hospeda nodos de Ethereum y otras blockchains. Google Finance integra datos de crypto, normalizando el acceso. Cuando las búsquedas de 'Bitcoin' en Google Trends superan 70/100, históricamente están en zonas de sobrecompra. El ban de anuncios de crypto de Google (2018) y su reversión (2021) tuvieron impacto directo en el precio de BTC.",
          },
          {
            name: "Amazon.com Inc.",
            ticker: "AMZN",
            emoji: "📦",
            color: "#ff9900",
            tipo: "E-Commerce · Cloud AWS · Logística · IA",
            nivel: "LA INFRAESTRUCTURA DEL MUNDO",
            que_es: "Amazon tiene dos negocios completamente distintos: el e-commerce (70% de ingresos pero margen bajo, ~5%) y Amazon Web Services — AWS (15% de ingresos pero margen del 38%). AWS es la mayor plataforma cloud del mundo con ~33% de market share. Además tiene Prime Video, Alexa, Whole Foods, Twitch, la farmacia PillPack y la empresa de logística más grande del mundo después de FedEx/UPS.",
            origen: "Fundada en 1994 por Jeff Bezos en su garaje de Bellevue, WA, originalmente como una librería online. El IPO fue en 1997. Amazon casi quebró en 2001 (dotcom crash). La visión de Bezos de 'Day 1' (siempre actuar como si fuera el primer día) y su tolerancia al largo plazo (inversiones que tardan 7+ años en dar frutos) definieron la cultura. AWS fue creada en 2006 — nadie entendió por qué una tienda online creaba nube empresarial.",
            para_que: "AWS es el indicador más confiable del gasto en infraestructura tecnológica global. Si AWS crece > 25% → las empresas tech siguen invirtiendo en escalar → positivo para todo el sector. Los earnings de Amazon se dividen en dos: wall street mira el margen de AWS más que el volumen del e-commerce. Prime Day (julio) y Black Friday son los mejores indicadores del gasto del consumidor americano.",
            como_afecta: "~4% del SPX. AWS hospeda aproximadamente el 60% de internet — incluyendo Netflix, Airbnb, LinkedIn, y miles de proyectos DeFi y blockchain. Cualquier outage de AWS (ha ocurrido varias veces) afecta directamente la liquidez y el funcionamiento de exchanges de crypto. Su logística compite con el modelo de entrega instantánea que las stablecoins intentan replicar en pagos.",
            btc_corr: "Correlación moderada-alta. AWS es el mayor proveedor de infraestructura para exchanges de crypto (Coinbase, Binance tienen partes de su infraestructura en AWS). La expansión de Amazon Pay hacia stablecoins (explorada en 2022) podría ser un catalizador enorme. Más directamente: cuando AMZN sube fuerte post-earnings, el NQ sube y BTC tiende a seguir.",
          },
          {
            name: "Meta Platforms Inc.",
            ticker: "META",
            emoji: "📘",
            color: "#0866ff",
            tipo: "Redes Sociales · IA · Reality Labs · Publicidad",
            nivel: "LA MÁQUINA DE PUBLICIDAD",
            que_es: "Controla Facebook (3B+ usuarios), Instagram (2B+), WhatsApp (2B+) y Threads. El 98% de sus ingresos viene de publicidad hiperpersonalizada con los datos de sus 3.3 billones de usuarios activos diarios — la mayor base de usuarios de cualquier plataforma privada en la historia humana. Reality Labs (Meta Quest VR) es su apuesta de largo plazo que todavía pierde $15B/año.",
            origen: "Facebook fundado en 2004 por Mark Zuckerberg en la Universidad de Harvard. Rebrandeada como Meta en 2021 para pivotar hacia el 'Metaverso'. La compra de Instagram por $1B en 2012 y WhatsApp por $19B en 2014 fueron las adquisiciones más estratégicas de la historia tech — hoy Instagram sola valdría más de $500B. El escándalo de Cambridge Analytica (2018) casi destruyó la empresa.",
            para_que: "Como Alphabet, es el termómetro del gasto global en publicidad digital. Pero a diferencia de Google (búsqueda = intención), Meta vende publicidad de descubrimiento (las personas no buscan, les aparece). La salud de Meta = salud de las pequeñas y medianas empresas que usan Instagram para crecer. Su tasa de engagement es el indicador más directo de si la gente tiene tiempo y dinero para consumir.",
            como_afecta: "~2.5% del SPX. Cuando Meta reporta DAU (usuarios activos diarios) más altos de lo esperado → el sector de consumo digital está sano. Su Year of Efficiency (2023) donde despidió 21,000 empleados y multiplicó el margen operativo de 14% a 40% fue el turnaround corporativo más rápido y exitoso de la historia reciente del S&P 500. Instagram es el canal #1 de marketing para proyectos crypto y NFTs.",
            btc_corr: "Correlación moderada-alta narrativamente. Meta lanzó Diem (antes Libra) — la stablecoin más ambiciosa de la historia — que fue bloqueada por reguladores en 2022. Si Meta lanzara una stablecoin hoy (exploración activa de 2024), el impacto en el ecosistema crypto sería masivo: 3B+ usuarios con acceso directo a crypto. Cuando el metaverso narrative estaba caliente (2021), NFTs y MANA/AXS subían junto con META.",
          },
          {
            name: "Tesla Inc.",
            ticker: "TSLA",
            emoji: "⚡",
            color: "#cc0000",
            tipo: "EVs · Energía · IA / Robótica · xAI",
            nivel: "LA MÁS VOLÁTIL",
            que_es: "Fabricante de autos eléctricos líder mundial (aunque BYD chino vende más unidades). Sus tres pilares: venta de autos EV (~80% ingresos), generación y almacenamiento de energía (Powerwall, Megapack) y Software/IA (Full Self-Driving, Optimus robot). Elon Musk también controla SpaceX, xAI (Grok), X (Twitter) y Neuralink — creando un ecosistema de influencia único.",
            origen: "Fundada en 2003 por Martin Eberhard y Marc Tarpenning. Elon Musk se unió en 2004 como chairman y mayor inversor, convirtiéndose en CEO en 2008. Casi quebró 3 veces (2008, 2013, 2019). El Roadster (2008), Model S (2012) y Model 3 (2017) fueron los tres hitos que lo convirtieron en el fabricante de autos más valioso del mundo en 2020, superando a Toyota.",
            para_que: "Tesla es el único activo del S&P 500 que se mueve más por los tweets de su CEO que por los fundamentales. Beta altísima (1.8-2.5) — amplifica los movimientos del mercado en ambas direcciones. Sus earnings tienen el mayor interés de opciones de cualquier MAG7 — traders de opciones aman la alta volatilidad implícita de TSLA. Indicador del ciclo EV y de la narrativa IA (Optimus, FSD).",
            como_afecta: "~2% del SPX. La posición de TSLA es controversialmente grande para una empresa con los fundamentales de un fabricante de autos pero la valoración de una empresa de software IA. Cuando Elon hace un anuncio en X (Twitter) — especialmente sobre política, crypto o Tesla — puede mover TSLA ±10% en horas. Su margen bruto automotriz (que cayó de 30% a 16% en 2023-2024) es el indicador de si la guerra de precios EV está destruyendo márgenes.",
            btc_corr: "Correlación directísima. Tesla tiene BTC en su balance sheet (compró $1.5B en 2021, vendió parte en 2022). Elon Musk ha movido el precio de DOGE y BTC con un solo tweet más de una docena de veces documentadas. La adopción de BTC como pago en Tesla (anunciada y revertida en 2021) fue uno de los mayores eventos de mercado crypto de ese año. TSLA y BTC son el único par de activos donde un individuo puede mover ambos con 280 caracteres.",
          },
        ],
      },
      {
        type: "infobox",
        variant: "key",
        label: "🗓️ CALENDARIO DE EARNINGS MAG7 — El evento más importante del trimestre",
        text: "Las MAG7 reportan en la misma semana de cada trimestre. El orden típico: MSFT + GOOGL (martes/miércoles), META + AMZN (jueves), luego AAPL (semanas 2-3 de la temporada), NVDA siempre reporta TARDE (3-4 semanas después de los demás). TSLA es el primero en reportar, antes que todos. El día 'MAG7 Day' donde MSFT y GOOGL reportan simultáneamente es históricamente el día de mayor volatilidad del trimestre. Si ambas baten → euforia. Si ambas decepcionan → sell-off tech inmediato.",
      },
      {
        type: "table",
        headers: ["Empresa", "Peso SPX", "Peso NQ", "Beta", "Catalizador clave", "Señal para BTC"],
        rows: [
          ["NVDA",  "~7%",  "~8%",  "1.8", "Guidance de márgenes de AI chips",          "NVDA +5% post-earnings → BTC +3-8% en 48h"],
          ["MSFT",  "~7%",  "~9%",  "0.9", "Crecimiento de Azure (nube)",               "Azure > 30% crecimiento → risk-on amplio"],
          ["AAPL",  "~7%",  "~9%",  "1.1", "Ventas iPhone China + margen servicios",    "Ciclo iPhone = adopción móvil crypto"],
          ["GOOGL", "~4%",  "~5%",  "1.1", "Ingresos publicidad + Cloud market share",  "Google Trends 'Bitcoin' > 70 = techo cercano"],
          ["AMZN",  "~4%",  "~5%",  "1.2", "Margen operativo de AWS",                   "AWS crece > 25% → infra crypto sana"],
          ["META",  "~2.5%","~3%",  "1.3", "DAU (usuarios activos) + ARPU publicidad",  "Stablecoin Meta = catalizador potencial enorme"],
          ["TSLA",  "~2%",  "~2.5%","1.9", "Margen bruto automotriz + deliveries",      "Elon tweet = movimiento BTC/DOGE directo"],
        ],
      },
      {
        type: "table",
        headers: ["Escenario MAG7", "Impacto en SPX", "Impacto en NQ", "Impacto esperado en BTC"],
        rows: [
          ["Todas baten earnings + guían al alza",    "+2% a +4%",   "+3% a +6%",   "+5% a +15% en 1 semana"],
          ["NVDA + MSFT baten, resto neutral",        "+1% a +2%",   "+2% a +3%",   "+3% a +8%"],
          ["AAPL decepciona pero NVDA bate",          "Neutral/+0.5%","Neutral",     "Sin señal clara"],
          ["NVDA decepciona (guidance bajo)",         "-2% a -4%",   "-3% a -6%",   "-5% a -15%"],
          ["Todas decepcionan / temporada débil",     "-4% a -8%",   "-6% a -12%",  "-10% a -30%"],
          ["TSLA + Elon escándalo / tweet negativo",  "-0.5% a -1%", "-0.5%",       "DOGE -10%, BTC -2%"],
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // N7 — GESTIÓN DE RIESGO (enriquecido con Kelly Criterion)
  // ════════════════════════════════════════════════════════════════════════
  "risk-management": {
    sections: [
      {
        type: "risk-reward-chart",
        title: "Gestión de Riesgo — R:R, Sizing y Matemática del Trader",
        body: "La gestión de riesgo no es una opción — es el único factor que determina si vas a sobrevivir lo suficiente para aprender. Un trader con 40% de win rate y R:R 1:3 es MÁS rentable que uno con 60% de win rate y R:R 1:1.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "La Fórmula de Position Sizing — Cómo calcular el tamaño exacto",
        text: "FÓRMULA: Tamaño de posición = (Capital × % Riesgo) ÷ (Precio entrada − Precio SL). Ejemplo: Capital $10,000 × 1% riesgo = $100 de riesgo máximo. Entrada BTC en $50,000 con SL en $49,000 = diferencia de $1,000. Tamaño = $100 ÷ $1,000 = 0.1 BTC. Esta fórmula funciona para CUALQUIER activo: acciones, futuros, forex, crypto. El apalancamiento no cambia la fórmula — cambia el margen requerido. Nunca arriesgues más del 1-2% por trade.",
      },
      {
        type: "table",
        headers: ["Pérdida en la cuenta", "% Necesario para recuperar", "Lección"],
        rows: [
          ["5%",  "5.3%",   "Recuperable fácilmente en 1-2 días"],
          ["10%", "11.1%",  "Recuperable en pocos días — zona segura"],
          ["20%", "25%",    "Requiere semanas — zona de precaución"],
          ["25%", "33.3%",  "Umbral de alarma — revisar estrategia"],
          ["33%", "50%",    "Necesitas +50% solo para volver al inicio"],
          ["50%", "100%",   "Necesitas DOBLAR la cuenta — casi imposible"],
          ["75%", "300%",   "Prácticamente irrecuperable"],
          ["90%", "900%",   "La cuenta está destruida"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "Kelly Criterion — La fórmula óptima de position sizing",
        text: "La fórmula de Kelly: f* = (bp − q) ÷ b. Donde: b = R:R (beneficio por unidad de riesgo), p = probabilidad de ganar (win rate como decimal), q = probabilidad de perder (1 − p). Ejemplo con win rate 50% y R:R 1:2: f* = (2 × 0.5 − 0.5) ÷ 2 = 0.25 = 25% del capital por trade. ADVERTENCIA: Kelly completo es muy agresivo. Los profesionales usan Half-Kelly o Quarter-Kelly para reducir la volatilidad de la curva de capital. La fórmula asume que el edge es constante — en trading real no lo es.",
      },
      {
        type: "infobox",
        variant: "warn",
        label: "Anti-Martingala vs Martingala — Por qué los profesionales usan una sola",
        text: "Martingala (doblar en pérdidas): parece lógico pero una racha de 6-7 pérdidas borra la cuenta. En trading la racha de pérdidas puede ser de 10-15 trades. NUNCA uses Martingala. Anti-Martingala (piramide en ganancias): añades tamaño SOLO cuando el trade ya está ganando. Mueves el SL al breakeven. Agregas contratos cuando el precio llega a tu primer TP. Este es el método de los traders profesionales: maximizan ganancias en trades correctos, limitan pérdidas en incorrectos.",
      },
      {
        type: "table",
        headers: ["Métrica", "Fórmula", "Tu objetivo", "¿Cómo mejorarla?"],
        rows: [
          ["Win Rate",           "Wins / Total trades × 100",              "> 45% con R:R 1:2",      "Ser más selectivo con setups"],
          ["R:R Promedio",       "TP promedio / SL promedio",              "> 2.0",                   "Mover el SL al BE antes, dejar correr TP"],
          ["Expectativa",        "(WR × R_avg_win) − (LR × R_avg_loss)",  "> 0.3R por trade",        "Mejorar WR o R:R"],
          ["Profit Factor",      "Ganancias brutas / Pérdidas brutas",     "> 1.5 (ideal > 2)",       "Cortar losers rápido, dejar correr winners"],
          ["Max Drawdown",       "Pico − Valle ÷ Pico × 100",             "< 15% mensual",           "Reducir tamaño de posición"],
          ["Sharpe Ratio",       "Retorno / Desviación estándar",          "> 1.5",                   "Reducir días con pérdidas extremas"],
          ["Calmar Ratio",       "Retorno anual / Max Drawdown",           "> 1.0",                   "Controlar el drawdown máximo"],
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // N7 — PSICOLOGÍA (enriquecido con sesgos cognitivos)
  // ════════════════════════════════════════════════════════════════════════
  "psicologia": {
    sections: [
      {
        type: "psychology-chart",
        title: "Ciclo Psicológico del Mercado — Dónde está el retail vs el smart money",
        body: "El mercado es un dispositivo de transferencia de dinero del impaciente al paciente, del emocional al sistemático, del retail al institucional.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Los 8 sesgos cognitivos que destruyen cuentas de trading",
        text: "1. Aversión a la pérdida (Kahneman): las pérdidas duelen 2.5x más que las ganancias de igual tamaño. Por eso movemos el SL. 2. Sesgo de confirmación: buscamos información que confirma lo que ya creemos — ignoramos señales contrarias. 3. Sesgo de recencia: los últimos trades influyen demasiado en las decisiones futuras. 4. Anclaje: el precio de compra te ancla psicológicamente aunque no sea relevante. 5. Exceso de confianza: después de 3 wins seguidos, el trader siente que 'lo domina'. 6. Efecto de disposición: cerrar winners demasiado pronto, mantener losers demasiado tiempo. 7. Ilusión de control: pensar que analizando más tienes más control sobre el resultado. 8. Falacia del apostador: creer que 'ya toca' un win después de varias pérdidas.",
      },
      {
        type: "table",
        headers: ["Sesgo Cognitivo", "Cómo aparece en trading", "Solución práctica"],
        rows: [
          ["Aversión a pérdida",    "Mover SL para no cerrar en pérdida",                  "Stop loss automático en plataforma ANTES de entrar"],
          ["Sesgo de confirmación", "Solo ver análisis que apoyan tu posición",             "Buscar activamente razones por las que estás EQUIVOCADO"],
          ["Sesgo de recencia",     "Operar más grande tras racha de ganancias",            "Tamaño de posición FIJO, independiente de racha"],
          ["Anclaje",               "No vender porque 'estoy en -20% y quiero recuperar'", "El precio no sabe lo que pagaste — el mercado no te debe nada"],
          ["Exceso de confianza",   "Abrir más trades tras semana buena",                  "Máximo de trades por día/semana en las reglas del plan"],
          ["Efecto disposición",    "Cerrar +3% y mantener −15%",                          "TP y SL siempre ANTES de entrar. No renegociar"],
          ["Ilusión de control",    "Mirar el gráfico cada 5 minutos cuando en posición",  "Poner alertas, no mirar — las decisiones están tomadas"],
          ["Falacia del apostador", "Doblar posición tras pérdidas 'para recuperar'",       "Cada trade es INDEPENDIENTE — el anterior no importa"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "Sistema 1 vs Sistema 2 — Daniel Kahneman aplicado al trading",
        text: "Daniel Kahneman (Nobel de Economía 2002) describe dos sistemas de pensamiento. Sistema 1 (rápido, emocional, automático): es el que opera cuando ves una vela roja enorme y sientes miedo. Es el que activa el FOMO. Es el que mueve tu SL. Sistema 2 (lento, racional, deliberativo): es el que sigue el plan, analiza la confluencia, calcula el position sizing. El trading rentable requiere DESACTIVAR el Sistema 1 y activar el Sistema 2. Herramienta: crea un checklist de 5 puntos que DEBES verificar antes de ejecutar cualquier trade. El acto de leer el checklist activa el Sistema 2.",
      },
      {
        type: "infobox",
        variant: "tip",
        label: "El Proceso de los 3 pasos post-trade",
        text: "Después de CADA trade (ganado o perdido), haz estos 3 pasos: (1) DESCRIBE sin juicio: 'El precio llegó al OB en zona de discount con RSI en 42 y divergencia alcista. Entré con SL bajo el mínimo del swing. El precio fue a TP1 y luego a TP2.' (2) EVALÚA el proceso, no el resultado: ¿Seguiste el plan? ¿Respetaste el SL? ¿El setup tenía la confluencia requerida? (3) EXTRAE una lección: ¿Qué haría diferente? ¿Qué confirma tu sistema? La calidad del proceso es lo que importa, no el resultado de un trade individual.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // N2 — SESIONES DE TRADING (enriquecido)
  // ════════════════════════════════════════════════════════════════════════
  "sesiones": {
    sections: [
      {
        type: "session-chart",
        title: "Sesiones Globales — Horarios GMT-5 (Guayaquil / Ecuador)",
        body: "El mercado no es 24 horas de igual actividad. Tiene ventanas de alta liquidez donde el 80% del volumen real ocurre. Fuera de esas ventanas, el precio solo 'se mueve' — dentro de ellas, el precio se DECIDE.",
      },
      {
        type: "amd-chart",
        title: "AMD en las Sesiones — Acumulación (Asia) → Manipulación (Londres) → Distribución (NY)",
        body: "Las sesiones son el contenedor del AMD. Asia acumula el rango. Londres manipula (Judas Swing). Nueva York ejecuta el movimiento real.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Las Killzones de ICT — Las 4 ventanas de máxima probabilidad",
        text: "1. London Open KZ (02:00–05:00 GMT-5): el momento más importante del día para Forex. El algoritmo barre el rango asiático. 2. NY Open KZ (08:30–11:00 GMT-5): apertura de Wall Street. El mayor volumen del día. News macro a las 08:30. 3. London Close (11:00–12:00 GMT-5): los traders europeos cierran posiciones = volatilidad temporal. 4. NY PM KZ (13:00–16:00 GMT-5): continuación o reversal del NY AM. Menor volumen pero oportunidades claras.",
      },
      {
        type: "table",
        headers: ["Sesión", "GMT-5 (Guayaquil)", "Volumen", "Activos principales", "Característica"],
        rows: [
          ["Tokio/Asia",    "20:00 — 01:00", "Bajo",  "JPY, AUD, NZD, cripto",    "Establece el rango nocturno. El precio que crean es la 'trampa' de Londres"],
          ["Sydney",        "19:00 — 01:00", "Muy bajo", "AUD, NZD, ORO",         "Previa a Asia. Poca liquidez — no operar"],
          ["Londres Open",  "02:00 — 05:00", "Muy Alto", "EUR, GBP, CHF, ORO",   "El Judas Swing ocurre aquí. Inicio del movimiento del día"],
          ["Overlap L+NY",  "08:00 — 12:00", "Máximo", "TODOS",                   "La ventana de mayor liquidez del mundo. 60%+ del volumen diario"],
          ["Nueva York AM", "08:30 — 12:00", "Muy Alto","USD, índices, commodities","News macro. Apertura NYSE. Setup principal del día"],
          ["Nueva York PM", "13:00 — 17:00", "Medio",  "USD, índices",             "Continuación o reversal. Silver Bullet 14:00-15:00"],
          ["Cripto 24/7",   "00:00 — 24:00", "Variable","BTC, ETH, Alts",          "Respeta los horarios de Forex/equities. Mayor volatilidad en NY"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "Asian Range — El rango que todos los profesionales marcan",
        text: "El Asian Range es la zona de precio entre el máximo y el mínimo de la sesión asiática (20:00–01:00 GMT-5). Los traders institucionales marcan: BSL (Buy-Side Liquidity) = máximo asiático + igual máximos sobre él. SSL (Sell-Side Liquidity) = mínimo asiático + igual mínimos bajo él. En la sesión de Londres: uno de los dos extremos se barrerá (Judas Swing). En la sesión de Nueva York: el precio irá hacia el lado OPUESTO al que fue Londres. Este patrón tiene 65-70% de fiabilidad histórica.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // N5 — DXY (enriquecido con los componentes del índice)
  // ════════════════════════════════════════════════════════════════════════
  "dxy": {
    sections: [
      {
        type: "dxy-correlation-chart",
        title: "DXY — Composición, Correlaciones y Señales",
        body: "El DXY no es simplemente 'el dólar'. Es una cesta ponderada de 6 monedas donde el EUR representa el 57.6% del índice. Entender su composición te explica por qué se mueve.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Composición exacta del DXY — Lo que pocas personas saben",
        text: "Euro (EUR): 57.6% del DXY — el más dominante. Yen japonés (JPY): 13.6%. Libra esterlina (GBP): 11.9%. Dólar canadiense (CAD): 9.1%. Corona sueca (SEK): 4.2%. Franco suizo (CHF): 3.6%. Implicación: cuando el BCE (Banco Central Europeo) sube tasas, el EUR se fortalece y el DXY BAJA — lo que es positivo para BTC y oro. Cuando la Fed sube tasas más que el BCE, el DXY SUBE — negativo para risk assets.",
      },
      {
        type: "table",
        headers: ["Evento macro", "Efecto en DXY", "Efecto en BTC", "Efecto en ORO", "Plazo"],
        rows: [
          ["FED sube tasas",           "↑ Sube",      "↓ Presión",    "↓ Presión",    "Inmediato"],
          ["FED baja tasas",           "↓ Baja",      "↑ Positivo",   "↑ Positivo",   "Inmediato"],
          ["BCE sube tasas más que FED","↓ Baja",     "↑ Positivo",   "↑ Positivo",   "Días"],
          ["Datos CPI alto (EEUU)",    "↑ Sube",      "↓ Presión",    "Mixto",         "Inmediato"],
          ["Datos CPI bajo (EEUU)",    "↓ Baja",      "↑ Positivo",   "↑ Positivo",   "Inmediato"],
          ["NFP (empleo) muy alto",    "↑ Sube",      "↓ Presión",    "↓ Presión",    "Inmediato"],
          ["Crisis geopolítica",       "↑ Safe haven", "↓ Mixto",     "↑ Fuerte",      "Días-semanas"],
          ["Recesión en EEUU",        "↓ Debilita",   "Mixto",        "↑ Positivo",   "Semanas"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "El DXY como herramienta de timing para BTC",
        text: "Estrategia de correlación inversa: cuando el DXY está en una resistencia técnica clara (trendline, EMA200, nivel Fibonacci) y empieza a rechazar → señal de entrada en BTC. Cuando el DXY está en soporte y rebota → señal de precaución en BTC. La correlación no es perfecta ni instantánea — hay un lag de horas a días. También: el índice DXY no incluye CNY (yuan chino). Cuando China devalúa el yuan, el capital chino fluye hacia BTC — evento que no aparece en el DXY.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // N5 — BONOS (enriquecido con historial de curva invertida)
  // ════════════════════════════════════════════════════════════════════════
  "bonos": {
    sections: [
      {
        type: "bonds-chart",
        title: "Bonos del Tesoro — Yields, Curva y Ciclos de Tasas",
        body: "El mercado de bonos es 3 veces más grande que el mercado de acciones. Los traders de bonos son considerados los más inteligentes del mundo — si la bolsa y los bonos dicen cosas distintas, los bonos generalmente tienen razón.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "La curva invertida — Récord histórico como señal de recesión",
        text: "La inversión de la curva 2Y-10Y (cuando el yield a 2 años supera al de 10 años) ha precedido las últimas 8 recesiones en EEUU sin fallar una sola vez. Historial: 2006-2007 (antes de 2008), 2000 (antes del dot-com crash), 1989 (antes de 1990-91), 1980 (antes de 1981-82). La señal de INVERSIÓN predice recesión con 6-18 meses de antelación. La señal de DESINVERSIÓN (vuelve a positiva) = la recesión ya comenzó o está por comenzar. En 2022: la curva se invirtió con mayor profundidad que en 2006.",
      },
      {
        type: "table",
        headers: ["Período Curva", "Duración inversión", "Recesión siguiente", "Impacto en BTC"],
        rows: [
          ["1978-1980",  "14 meses", "Recesión 1980",         "BTC no existía"],
          ["1980-1982",  "24 meses", "Recesión 1981-82",      "BTC no existía"],
          ["1989",       "6 meses",  "Recesión 1990-91",      "BTC no existía"],
          ["2000",       "12 meses", "Recesión 2001 + dot-com","BTC no existía"],
          ["2006-2007",  "13 meses", "Gran Recesión 2008-09", "BTC nació en este contexto (Oct 2008)"],
          ["2019",       "3 meses",  "COVID 2020 (acelerado)", "BTC cayó -50% en el crash COVID"],
          ["2022-2024",  "> 24 meses","Recesión 2024-2025?",  "Relación directa con bear market 2022"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "Ciclo de tasas de la FED y su impacto en BTC",
        text: "El ciclo de la Fed tiene 4 fases: (1) Subida de tasas (hawkish): el costo del dinero sube. Capital sale de activos de riesgo. Malo para BTC y acciones. (2) Pausa: la Fed espera ver el efecto. Mercados inciertos — volatilidad. (3) Pivote (primer recorte): el dinero se vuelve más barato. Capital busca rendimiento. Histórico positivo para BTC. (4) QE / Baja de tasas acelerada: el dinero fluye hacia activos de riesgo. Muy positivo para BTC. La correlación histórica: cada ciclo de subida de tasas de la Fed ha coincidido con una corrección en BTC 6-12 meses después. Cada ciclo de baja de tasas ha coincidido con el inicio de un bull market en BTC.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // N7 — DIARIO DE TRADING (enriquecido)
  // ════════════════════════════════════════════════════════════════════════
  "diario-trading": {
    sections: [
      {
        type: "risk-reward-chart",
        title: "El Diario como Sistema de Feedback — Tu ventaja estadística",
        body: "El diario de trading convierte el trading de un juego de intuición a un negocio basado en datos. Sin datos, no sabes si tienes edge real o solo suerte.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Las 3 preguntas que el diario debe responder",
        text: "1. ¿Tengo edge estadístico real? (Expectativa > 0 después de 50+ trades). 2. ¿Cuáles son mis mejores setups? (Identifica los 2-3 setups con mayor expectativa). 3. ¿Cuáles son mis patrones de error? (Identifica cuándo FOMO, cuándo operas en rango, cuándo rompes las reglas). La mayoría de los traders no llevan diario y no saben sus propias estadísticas — operan en la oscuridad.",
      },
      {
        type: "table",
        headers: ["Campo del Diario", "Por qué es importante", "Cómo usarlo en revisión semanal"],
        rows: [
          ["Fecha/hora de entrada",  "Identifica horarios más rentables",      "¿Tus mejores trades son en NY AM? ¿En Londres?"],
          ["Activo y timeframe",     "Identifica qué activos te funcionan más",  "¿BTC > ETH en tu sistema? ¿4H > 1H?"],
          ["Nombre del setup",       "Cuantifica qué setups funcionan",         "Top 3 setups por expectativa"],
          ["R:R planificado",        "¿Fuiste disciplinado con el objetivo?",   "¿Cerraste antes de TP? ¿Por qué?"],
          ["R:R real",               "La diferencia = comportamiento emocional", "Si planificado > real = cerras winners pronto"],
          ["Estado emocional (1-10)","Correlaciona emoción con resultado",      "¿Pierdes más cuando estás a 8-10 (muy emocionado)?"],
          ["¿Seguiste el plan?",     "El dato más honesto que hay",             "Si no lo seguiste, ¿qué te hizo desviar?"],
          ["Screenshot + notas",     "Aprender visual del error/acierto",       "Revisar patterns en imágenes semanalmente"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "La revisión semanal — El ritual de los traders profesionales",
        text: "DOMINGO (antes de la semana): (1) Revisar bias macro (DXY, yields, SPX). (2) Marcar niveles clave en todos los activos que operas. (3) Revisar las estadísticas de la semana anterior. VIERNES (cierre de semana): (1) Calcular P&L en R (no en $). (2) Revisar cada trade: ¿seguí el plan? (3) Identificar el error o acierto principal de la semana. (4) Ajustar reglas si es necesario (después de 20+ trades con el mismo error). Los traders de hedge funds senior dedican 30-60 minutos a este proceso sin excepción.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // N6 — ELLIOTT WAVES (enriquecido con Fibonacci)
  // ════════════════════════════════════════════════════════════════════════
  "elliott-waves": {
    sections: [
      {
        type: "elliott-wave-chart",
        title: "Ondas de Elliott — Todas las Estructuras del Mercado",
        body: "Elliott Wave Theory (1938) es el sistema más completo para clasificar el comportamiento colectivo del mercado. Existen dos familias: ondas de IMPULSO (mueven el precio en la dirección de la tendencia mayor) y ondas CORRECTIVAS (mueven el precio en contra). Hay exactamente 13 tipos de onda — el gráfico interactivo cubre todas.",
      },
      {
        type: "table",
        headers: ["Familia", "Estructura", "Tipo de corrección", "Sub-ondas internas"],
        rows: [
          ["IMPULSO",     "1-2-3-4-5",      "—",                   "Ondas 1,3,5 = 5; Ondas 2,4 = 3"],
          ["IMPULSO",     "Diagonal inicial","Cuña convergente",    "5 ondas solapadas (onda 1 o A)"],
          ["IMPULSO",     "Diagonal final",  "Cuña convergente",    "5 ondas solapadas (onda 5 o C)"],
          ["CORRECTIVA",  "Zigzag",          "A-B-C / 5-3-5",       "A=5, B=3, C=5 sub-ondas"],
          ["CORRECTIVA",  "Flat regular",    "A-B-C / 3-3-5",       "A=3, B=3, C=5 sub-ondas"],
          ["CORRECTIVA",  "Flat expandida",  "A-B-C / 3-3-5",       "B supera top; C < fondo A"],
          ["CORRECTIVA",  "Flat running",    "A-B-C / 3-3-5",       "B supera top; C no llega fondo A"],
          ["CORRECTIVA",  "Triángulo contráctil", "A-B-C-D-E",     "Cada onda = 3 sub-ondas"],
          ["CORRECTIVA",  "Triángulo barrera",    "A-B-C-D-E",     "Línea B-D horizontal"],
          ["CORRECTIVA",  "Triángulo expansivo",  "A-B-C-D-E",     "Cada onda > la anterior (raro)"],
          ["CORRECTIVA",  "Doble tres (WXY)",     "W-X-Y",         "Dos correcciones + enlace X"],
          ["CORRECTIVA",  "Triple tres (WXYXZ)",  "W-X-Y-X-Z",     "Tres correcciones + 2 enlaces"],
        ],
      },
      {
        type: "infobox",
        variant: "key",
        label: "Las 3 REGLAS ABSOLUTAS de Elliott (si se rompe una → el conteo está mal)",
        text: "REGLA 1 — La onda 2 NUNCA retrocede más del 100% de la onda 1. Si el precio baja más del inicio de la onda 1, no hay onda 2. REGLA 2 — La onda 3 NUNCA es la más corta de las ondas impulsivas (1, 3 y 5). Puede ser igual a 1 o 5, pero nunca más corta. REGLA 3 — La onda 4 NUNCA entra en el territorio de precio de la onda 1 (en mercados de contado; en futuros se permite solapamiento mínimo). Estas 3 reglas son la forma de VALIDAR o INVALIDAR cualquier conteo.",
      },
      {
        type: "table",
        headers: ["Corrección", "Estructura", "Profundidad", "Cuándo aparece", "Señal clave"],
        rows: [
          ["Zigzag",          "5-3-5",   "Profunda (61.8-100%)",  "Onda 2, onda A",             "B no supera 61.8% de A"],
          ["Flat regular",    "3-3-5",   "Lateral-moderada",      "Onda 4, onda B",             "B casi llega al top inicial"],
          ["Flat expandida",  "3-3-5",   "Profunda + trampa",     "Onda 2, onda B compleja",    "B supera el máximo previo"],
          ["Flat running",    "3-3-5",   "Superficial",           "Onda 4 en trend fuerte",     "C queda por encima de A"],
          ["Triángulo",       "3-3-3-3-3","Lateral comprensión",  "Onda 4, onda B, onda X",     "Thrust tras onda E"],
          ["Doble tres WXY",  "3+3",     "Lateral amplia",        "Onda 4, onda B prolongada",  "X es corrección pequeña"],
          ["Triple tres WXYXZ","3+3+3",  "Lateral muy larga",     "Onda 4 en range market",     "Evitar operar dentro"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "Diagonals — Las cuñas que predicen el mayor movimiento",
        text: "Diagonal Inicial (Leading Diagonal): aparece como Onda 1 o Onda A. Cuña convergente de 5 ondas donde se PERMITE el solapamiento. Predice un movimiento explosivo en la dirección del diagonal tras la Onda 2/B siguiente. Diagonal Final (Ending Diagonal): aparece en Onda 5 o Onda C. Cuña con volumen DECRECIENTE + RSI divergente. Las ondas 3,4,5 se solapan. SEÑAL MÁXIMA de reversión inminente. Cuando termina el diagonal final → reversión rápida y total de toda la corrección anterior. Es la señal de reversión de mayor probabilidad en Elliott.",
      },
      {
        type: "table",
        headers: ["Fibonacci en correcciones", "Zigzag", "Flat regular", "Flat expandida", "Triángulo"],
        rows: [
          ["Onda A retrocede de impulso", "50-78.6%", "38.2-61.8%", "38.2-50%", "Varía"],
          ["Onda B retrocede de A",       "38.2-50%", "90-100%",    "100-138.2%","B-D convergen"],
          ["Onda C respecto a A",         "100-161.8%","100%",       "138.2-161.8%","Cada onda < anterior"],
          ["Posición típica",             "Onda 2, A","Onda 4, B",  "Onda 2, B", "Onda 4, B, X"],
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // N5 — ORO (enriquecido con el ciclo histórico)
  // ════════════════════════════════════════════════════════════════════════
  "oro": {
    sections: [
      {
        type: "gold-cycles-chart",
        title: "ORO (XAU/USD) — Ciclos Históricos y Métricas",
        body: "El oro es el activo refugio con 5,000 años de historia. Entender sus ciclos es entender los ciclos de confianza en el sistema monetario global.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Los grandes ciclos del oro — Historia que se repite",
        text: "1971 (Nixon Shock): EEUU abandona el patrón oro. El precio explotó de $35 a $850 en 9 años (+2,300%). 1980-2001: Bear market de 20 años mientras las tasas reales subían (Reagan/Volcker). 2001-2011: Bull market de 10 años post dot-com + post 9/11 + QE 2008. De $250 a $1,920 (+668%). 2011-2015: Corrección profunda. 2015-2020: Acumulación. 2020-2024: Nuevo bull market — precio supera $2,500. El patrón: el oro tiene mercados alcistas cuando las tasas reales son negativas (inflación > rendimiento de bonos).",
      },
      {
        type: "table",
        headers: ["Factor", "Impacto en ORO", "Por qué", "Magnitud"],
        rows: [
          ["Tasas reales negativas (inflación > yield)", "Muy alcista ↑↑",    "El oro no tiene rendimiento — compite con bonos que rinden negativo", "Alta"],
          ["DXY débil",                "Alcista ↑",       "ORO cotiza en USD — dólar débil = oro más barato para otros",              "Alta"],
          ["Compras de bancos centrales","Muy alcista ↑↑","China, India, Rusia compran oro para desglobalizar el USD",                "Muy Alta"],
          ["Crisis/guerra/incertidumbre","Alcista ↑",     "Safe haven — inversores fluyen al activo de mayor confianza histórica",    "Alta-Variable"],
          ["Tasas reales positivas altas","Bajista ↓",    "Los bonos rinden más que el oro (costo de oportunidad)",                  "Alta"],
          ["DXY fuerte",               "Bajista ↓",       "Oro más caro en otras monedas = menor demanda global",                    "Media-Alta"],
          ["Riesgo de liquidación",    "Bajista temporal ↓","En crash, se vende ORO para cubrir pérdidas en acciones",               "Temporal"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "ORO como señal para BTC — La correlación histórica",
        text: "En los últimos 3 ciclos, el oro ha liderado los movimientos de BTC con 3-6 meses de anticipación. Cuando el oro rompió su ATH de $2,075 en 2024, BTC siguió rompiendo su ATH pocos meses después. La narrativa institucional: los mismos fondos que acumulan oro en fase de incertidumbre, luego rotan parte del capital hacia BTC como 'oro digital' cuando el risk appetite mejora. Larry Fink (CEO Blackrock): 'Bitcoin is digital gold' — y Blackrock lanzó el ETF de BTC spot en enero 2024.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // VELAS JAPONESAS — PATRONES DE GRÁFICO (override con ChartPatternsChart)
  // ════════════════════════════════════════════════════════════════════════
  "velas-patrones": {
    sections: [
      {
        type: "text",
        body: `Los patrones de velas japonesas son la base del análisis técnico. Cada patrón cuenta una historia sobre la batalla entre compradores y vendedores. En SMC, los usamos para CONFIRMAR entradas en zonas de interés — nunca como señal aislada.`,
      },
      {
        type: "infobox",
        variant: "key",
        label: "Regla de oro",
        text: "Un patrón de vela en una zona vacía NO vale nada. Un patrón de vela en un Order Block + Golden Pocket + Kill Zone = alta probabilidad.",
      },
      {
        type: "candle-patterns",
        title: "Catálogo de velas individuales y multi-vela",
        body: "Patrones de una, dos y tres velas. Haz clic en cualquier categoría para filtrar.",
      },
      {
        type: "infobox",
        variant: "pro",
        label: "Patrones más confiables en SMC",
        text: "Bullish/Bearish Engulfing en un OB = ★★★★★. Morning/Evening Star en Golden Pocket = ★★★★★. Doji en POI = ALERTA, espera la siguiente vela de confirmación antes de entrar.",
      },
      {
        type: "table",
        headers: ["Patrón", "# Velas", "Categoría", "Confiabilidad en POI"],
        rows: [
          ["Bullish Engulfing",     "2", "Reversión Alcista",  "★★★★★"],
          ["Bearish Engulfing",     "2", "Reversión Bajista",  "★★★★★"],
          ["Morning Star",         "3", "Reversión Alcista",  "★★★★☆"],
          ["Evening Star",         "3", "Reversión Bajista",  "★★★★☆"],
          ["Hammer / Shooting Star","1", "Reversión",         "★★★☆☆"],
          ["Marubozu",             "1", "Continuación",       "★★★★☆"],
          ["Doji",                 "1", "Indecisión",         "★★☆☆☆"],
          ["Three White Soldiers", "3", "Continuación Alcista","★★★★☆"],
          ["Three Black Crows",    "3", "Continuación Bajista","★★★★☆"],
          ["Pin Bar (Wick largo)", "1", "Reversión",          "★★★★☆"],
          ["Harami Alcista",       "2", "Reversión Alcista",  "★★★☆☆"],
          ["Harami Bajista",       "2", "Reversión Bajista",  "★★★☆☆"],
        ],
      },
      {
        type: "chart-patterns",
        title: "Patrones de Gráfico — Price Action Estructural",
        body: "Estos patrones se forman en múltiples velas y sesiones. Son las estructuras más potentes del análisis técnico clásico. Selecciona cada patrón para ver el diagrama SVG detallado con entrada, SL y objetivos.",
      },
      {
        type: "infobox",
        variant: "tip",
        label: "¿Cómo usar estos patrones con SMC?",
        text: "En SMC el patrón de gráfico define la dirección macro. El Order Block / FVG define la entrada micro. Ejemplo: HCH bajista en diario → vendo en el OB del retest del cuello en 4H. No entres en la rotura ciega — espera el retest.",
      },
      {
        type: "table",
        headers: ["Patrón", "Tipo", "Timeframe ideal", "Confiabilidad", "Con volumen"],
        rows: [
          ["HCH Bajista / Alcista",    "Reversión",    "4H / Diario / Semanal", "★★★★★", "Sí, crítico"],
          ["Doble Techo / Piso",       "Reversión",    "1H / 4H / Diario",      "★★★★☆", "Sí, P2 < P1"],
          ["Triple Techo / Piso",      "Reversión",    "4H / Diario",           "★★★★★", "Sí, T3 < T1"],
          ["Taza y Asa",               "Continuación", "Diario / Semanal",      "★★★★☆", "Crítico en asa"],
          ["Bandera Alcista/Bajista",  "Continuación", "15m / 1H / 4H",         "★★★★☆", "Bajo en bandera"],
          ["Banderín Alcista/Bajista", "Continuación", "15m / 1H / 4H",         "★★★★☆", "Explota en rotura"],
          ["Triángulo Ascendente",     "Continuación", "1H / 4H",               "★★★★☆", "Aumenta al apex"],
          ["Triángulo Descendente",    "Continuación", "1H / 4H",               "★★★★☆", "Aumenta al apex"],
          ["Triángulo Simétrico",      "Bidireccional","1H / 4H / Diario",      "★★★☆☆", "Confirmación rotura"],
          ["Cuña Ascendente",          "Reversión",    "4H / Diario",           "★★★★☆", "Disminuye en cuña"],
          ["Cuña Descendente",         "Reversión",    "4H / Diario",           "★★★★☆", "Disminuye en cuña"],
          ["Canal Alcista/Bajista",    "Continuación", "Todos",                 "★★★☆☆", "Referencial"],
        ],
      },
    ],
  },
};
