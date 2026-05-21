// Overrides / additions for modules that need the new visual chart sections
// These are merged LAST in ALL_CONTENT so they always win

export const contentVisualCharts: Record<string, any> = {

  // ─── VELAS JAPONESAS — PATRONES (override to add candle patterns grid) ────
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
        title: "Catálogo completo de patrones",
        body: "Haz clic en cualquier categoría para filtrar. Cada patrón muestra el gráfico SVG y la descripción de uso.",
      },
      {
        type: "infobox",
        variant: "pro",
        label: "Setup de alta probabilidad",
        text: "Busca siempre un Bullish/Bearish Engulfing o Morning/Evening Star como señal de confirmación en tu POI. Son los patrones más confiables en SMC. El Doji en zona de POI es la alerta — espera la siguiente vela de confirmación.",
      },
      {
        type: "table",
        headers: ["Patrón", "# Velas", "Categoría", "Confiabilidad en POI"],
        rows: [
          ["Bullish Engulfing", "2", "Reversión Alcista", "★★★★★"],
          ["Bearish Engulfing", "2", "Reversión Bajista", "★★★★★"],
          ["Morning Star", "3", "Reversión Alcista", "★★★★☆"],
          ["Evening Star", "3", "Reversión Bajista", "★★★★☆"],
          ["Hammer / Shooting Star", "1", "Reversión", "★★★☆☆"],
          ["Marubozu", "1", "Continuación", "★★★★☆"],
          ["Doji", "1", "Indecisión", "★★☆☆☆"],
          ["Three White Soldiers", "3", "Continuación Alcista", "★★★★☆"],
          ["Three Black Crows", "3", "Continuación Bajista", "★★★★☆"],
        ],
      },
    ],
  },

  // ─── FIBONACCI COMPLETO (override con FibLevels chart) ────────────────────
  "fibonacci": {
    sections: [
      {
        type: "text",
        body: `Fibonacci no es magia — es matemática del comportamiento institucional. Los grandes players usan los retrocesos de Fibonacci para calcular zonas de valor justo donde llenar sus posiciones. Si lo hacen todos, los niveles se convierten en profecías autocumplidas.`,
      },
      {
        type: "fib-chart",
        title: "Fibonacci Básico — Retrocesos y Extensiones",
        fibDirection: "bullish",
      },
      {
        type: "fib-levels",
        title: "Niveles Fibonacci Completos — Retrocesos + Extensiones + Zonas",
        body: "El mapa completo de todos los niveles de Fibonacci que el indicador PSY usa para identificar zonas de entrada y objetivos de precio.",
      },
      {
        type: "infobox",
        variant: "pro",
        label: "Golden Pocket — el nivel más importante",
        text: "El 61.8%–70.5% es el 'Golden Pocket' — la zona donde el smart money entra en pullbacks. Si el precio retrocede al Golden Pocket y hay un Order Block o FVG ahí, es tu setup de mayor probabilidad. En el PSY aparece sombreado en dorado.",
      },
      {
        type: "table",
        headers: ["Nivel", "Nombre", "Uso principal", "Confiabilidad"],
        rows: [
          ["23.6%", "Retroceso shallow", "Tendencias muy fuertes", "★★☆☆☆"],
          ["38.2%", "Retroceso moderado", "Entrada conservadora", "★★★☆☆"],
          ["50%", "Equilibrium (EQ)", "Línea Premium/Discount", "★★★☆☆"],
          ["61.8%", "Golden Ratio ★", "Inicio Golden Pocket — Entrada", "★★★★★"],
          ["70.5%", "OTE (ICT)", "Fin Golden Pocket — Entrada", "★★★★★"],
          ["78.6%", "Retroceso profundo", "Crypto: retrocesos extremos", "★★★★☆"],
          ["88.6%", "Zona extrema", "Último soporte antes de invalidar", "★★★☆☆"],
          ["127.2%", "Extensión 1", "TP1 — Objetivo inicial", "★★★★☆"],
          ["161.8%", "Extensión Golden ★", "TP2 — Objetivo principal", "★★★★★"],
          ["200%", "Extensión doble", "TP3 — Objetivo ambicioso", "★★★☆☆"],
          ["261.8%", "Extensión mayor", "TP4 — Tendencias fuertes", "★★☆☆☆"],
        ],
      },
      {
        type: "infobox",
        variant: "tip",
        label: "Cómo trazar Fibonacci correctamente",
        text: "SIEMPRE de Swing Low a Swing High (en alcista) o de Swing High a Swing Low (en bajista). El swing debe estar confirmado — espera que el precio haya roto estructura (BOS) antes de trazar. En el PSY, el Fibonacci se traza automáticamente sobre el último swing relevante del timeframe seleccionado.",
      },
    ],
  },

  // ─── AMD — ACUMULACIÓN, MANIPULACIÓN, DISTRIBUCIÓN ────────────────────────
  "amd": {
    sections: [
      {
        type: "text",
        body: `AMD es el ciclo de 3 fases por el que pasa el mercado en CUALQUIER timeframe: Acumulación → Manipulación → Distribución. Es el mismo ciclo de Wyckoff pero expresado en el lenguaje moderno del SMC y aplicado específicamente a las sesiones de trading.`,
      },
      {
        type: "amd-chart",
        title: "Ciclo AMD — Visualización Completa con Sesiones (GMT-5 Guayaquil)",
        body: "El gráfico muestra el AMD alcista (izquierda) y bajista (derecha) con las fases marcadas y el horario de Guayaquil GMT-5.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "AMD + Sesiones — La Combinación Clave",
        text: "Acumulación = Asia (6PM-3AM GYE). Manipulación = Pre-London (1AM-4AM GYE) — el Judas Swing ocurre aquí. Distribución = London + New York (3AM-5PM GYE) — el movimiento real y rentable.",
      },
      {
        type: "crt-chart",
        title: "CRT — Candle Range Theory (AMD en una sola vela)",
        body: "El CRT aplica el mismo ciclo AMD a una sola vela (o secuencia de 3 velas). La vela de rango define el campo de batalla, la vela de manipulación caza los stops, y la vela de distribución es el movimiento real.",
      },
      {
        type: "infobox",
        variant: "pro",
        label: "CRT — Setup práctico",
        text: "En el gráfico de 15m o 1H, espera la formación de una vela de rango (Candle 1). Si la siguiente vela barre la liquidez del rango (SSL o BSL) y cierra de vuelta adentro (Candle 2 = manipulación), entra en la apertura de la Candle 3 o en el FVG/OB que deja el movimiento. SL bajo/sobre la zona barrida. TP en la liquidez opuesta.",
      },
      {
        type: "table",
        headers: ["Fase", "Horario GYE (GMT-5)", "Sesión", "Qué buscar"],
        rows: [
          ["Acumulación (A)", "6PM — 3AM", "Asiática", "Rango estrecho, bajo volumen, EQH/EQL formándose"],
          ["Manipulación (M)", "1AM — 4AM", "Pre-London", "Judas Swing — barrida de SSL o BSL + vela de rechazo"],
          ["Distribución (D)", "3AM — 5PM", "London + NY AM", "Movimiento impulsivo + BOS + OB/FVG en la dirección real"],
          ["CRT Vela 1", "Cualquier hora", "Cualquier TF", "Vela de rango — define el campo de batalla"],
          ["CRT Vela 2", "Cualquier hora", "Cualquier TF", "Manipulación — barre SSL o BSL del rango"],
          ["CRT Vela 3", "Cualquier hora", "Cualquier TF", "Distribución — movimiento real con displacement"],
        ],
      },
    ],
  },

  // ─── SMC — SMART MONEY CONCEPTS FUNDAMENTOS (override para sweep/absorption) ─
  "smart-money-intro": {
    sections: [
      {
        type: "text",
        body: `Smart Money Concepts (SMC) es la metodología que analiza el mercado desde la perspectiva de los grandes jugadores institucionales — bancos, fondos de inversión, creadores de mercado. El objetivo: identificar dónde están sus órdenes y seguirlos.`,
      },
      {
        type: "structure-chart",
        title: "Estructura de Mercado — HH/HL vs LH/LL",
        chartType: "trend",
      },
      {
        type: "sweep-destroy",
        title: "Sweep & Destroy — El Setup Central del SMC",
        body: "El Sweep & Destroy (también llamado 'Liquidity Hunt & Reversal') es el setup más poderoso y frecuente en SMC. El precio barre una zona de liquidez (SSL o BSL), y luego se revierte explosivamente en dirección contraria.",
      },
      {
        type: "liquidity-absorption",
        title: "Absorción de Liquidez — La Señal Institucional",
        body: "Antes del Sweep & Destroy, los institucionales 'absorben' las órdenes del lado contrario. Cuando la absorción está completa (se quedan sin más vendedores/compradores), el precio se mueve explosivamente.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Sweep & Destroy vs Absorción — Diferencia",
        text: "Sweep & Destroy: vista desde la perspectiva del precio (el chart). La absorción es la misma operación vista desde el Order Flow / Footprint — ahí ves el volumen y el delta que confirman que los institucionales están activos en esa zona.",
      },
      {
        type: "table",
        headers: ["Concepto", "¿Qué es?", "¿Cómo identificarlo en PSY?", "¿Cómo operar?"],
        rows: [
          ["Sweep & Destroy", "Wick viola SSL/BSL + displacement contrario", "Mecha larga + vela grande opuesta + BOS", "Entrada en OB/FVG del displacement"],
          ["Absorción Alcista", "Múltiples velas en SSL con alto volumen, delta positivo", "Cluster de velas cerca de mínimos + volumen alto", "Espera el displacement alcista"],
          ["Absorción Bajista", "Múltiples velas en BSL con alto volumen, delta negativo", "Cluster de velas cerca de máximos + volumen alto", "Espera el displacement bajista"],
          ["Judas Swing", "Movimiento falso Pre-London que caza stops", "Barrida en horario 1AM-4AM GYE + reversión", "Entrada tras confirmación del reversal"],
          ["Stop Kill", "Variante del Sweep — el precio activa stops específicos", "Precio toca un nivel exacto y rebota", "Entrada tras confirmación del rebote"],
        ],
      },
    ],
  },

  // ─── CRT — CANDLE RANGE THEORY ───────────────────────────────────────────────
  "crt": {
    sections: [
      {
        type: "text",
        body: `La Candle Range Theory (CRT) aplica el ciclo AMD (Acumulación-Manipulación-Distribución) a una secuencia de 3 velas. Es el marco de análisis más granular del SMC — te permite leer el comportamiento institucional vela por vela en cualquier timeframe.`,
      },
      {
        type: "crt-chart",
        title: "CRT — Anatomía Completa (Alcista y Bajista)",
        body: "El gráfico muestra la anatomía de una vela CRT individual (izquierda) y la secuencia de 3 velas (centro: alcista, derecha: bajista). Cada zona color representa una fase AMD.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "CRT — Las 3 velas",
        text: "Vela 1 = RANGO (define el campo). Vela 2 = MANIPULACIÓN (barre la liquidez del rango — SSL o BSL). Vela 3 = DISTRIBUCIÓN (movimiento real en dirección opuesta a la manipulación). Si la Vela 2 barre hacia abajo y la Vela 3 sube fuerte = CRT alcista.",
      },
      {
        type: "sweep-destroy",
        title: "CRT + Sweep & Destroy — El Setup Completo",
        body: "El CRT y el Sweep & Destroy son el mismo concepto en diferentes escalas. El CRT usa 3 velas específicas. El Sweep & Destroy puede ocurrir en múltiples velas. En ambos casos: el precio barre la liquidez y luego se mueve en la dirección real.",
      },
      {
        type: "table",
        headers: ["Vela CRT", "Descripción", "Qué buscar", "Acción"],
        rows: [
          ["Vela 1 — Rango", "Cuerpo mediano, mechas moderadas", "Define High y Low del CRT", "Marcar el rango — esperar"],
          ["Vela 2 — Manipulación (alcista)", "Wick bajo el Low del rango (SSL sweep)", "Cierra de vuelta dentro del rango", "Alerta de CRT alcista"],
          ["Vela 2 — Manipulación (bajista)", "Wick sobre el High del rango (BSL sweep)", "Cierra de vuelta dentro del rango", "Alerta de CRT bajista"],
          ["Vela 3 — Distribución", "Impulso fuerte en dirección contraria a V2", "BOS + FVG/OB en la vela", "ENTRADA al cierre de V2 o apertura de V3"],
          ["Invalidación", "V2 cierra fuera del rango (no es CRT)", "No hay retorno al rango", "No operar"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "CRT en la práctica — Timeframes ideales",
        text: "El CRT funciona mejor en gráficos de 1H, 4H, y Diario. En 15m también es válido dentro de Kill Zones. La clave es que el barrido (V2) ocurra durante la sesión asiática o Pre-London, y la distribución (V3) durante London o NY. La secuencia temporal natural del AMD refuerza el CRT.",
      },
    ],
  },

  // ─── BOS & CHOCH (override para añadir estructura-market chart) ────────────
  "bos-choch": {
    sections: [
      {
        type: "bos-chart",
        title: "BOS & CHoCH — Estructura, Confirmación y Señales de Reversión",
        body: "El BOS confirma que la tendencia CONTINÚA. El CHoCH es la primera señal de CAMBIO. Dominar ambos te permite operar siempre a favor del smart money y anticipar los giros antes de que ocurran.",
      },
      {
        type: "text",
        body: `BOS (Break of Structure) y CHoCH (Change of Character) son los dos conceptos más importantes del análisis de estructura en SMC. Definen si el mercado CONTINÚA su tendencia (BOS) o si está CAMBIANDO de dirección (CHoCH).`,
      },
      {
        type: "infobox",
        variant: "key",
        label: "BOS — Definición exacta",
        text: "El precio supera (con cierre de vela) el último Swing High previo en uptrend = BOS alcista. O cae bajo el último Swing Low en downtrend = BOS bajista. El BOS CONFIRMA que la tendencia sigue activa. En el PSY aparece marcado con etiqueta 'BOS' y una línea horizontal en el nivel roto.",
      },
      {
        type: "structure-chart",
        title: "CHoCH — Change of Character (Señal de Reversión)",
        chartType: "choch",
      },
      {
        type: "infobox",
        variant: "warn",
        label: "CHoCH ≠ Reversión confirmada",
        text: "El CHoCH es solo la PRIMERA señal de posible cambio. No operes el CHoCH solo. Necesitas: CHoCH → formación de nuevo swing en la dirección nueva → BOS en la dirección nueva → ENTONCES entras en el siguiente retroceso.",
      },
      {
        type: "sweep-destroy",
        title: "BOS + Sweep & Destroy — El Setup Completo",
        body: "La secuencia más efectiva en SMC combina el Sweep de liquidez con el BOS de confirmación: el precio barre los stops (Sweep), y luego rompe estructura en la dirección nueva (BOS). Eso es la confirmación máxima.",
      },
      {
        type: "table",
        headers: ["Señal", "Qué significa", "¿Operas?", "SL", "TP"],
        rows: [
          ["BOS alcista", "Tendencia alcista confirma — nuevo HH", "Sí, en el HL siguiente", "Bajo el HL", "Extensión 127.2%-161.8%"],
          ["BOS bajista", "Tendencia bajista confirma — nuevo LL", "Sí, en el LH siguiente", "Sobre el LH", "Extensión bajista"],
          ["CHoCH alcista", "Primera señal de fin de bajista", "Espera BOS de confirmación", "—", "—"],
          ["CHoCH bajista", "Primera señal de fin de alcista", "Espera BOS de confirmación", "—", "—"],
          ["MSS + Disp.", "CHoCH con displacement fuerte", "Entrada con cautela", "Bajo/sobre el sweep", "Siguiente BSL/SSL"],
        ],
      },
    ],
  },

  // ─── WYCKOFF (override completo con WyckoffChart) ────────────────────────
  "wyckoff": {
    sections: [
      {
        type: "text",
        body: `Richard Wyckoff fue el precursor de todo el análisis institucional moderno. Sus esquemas de Acumulación y Distribución de los años 1930 siguen siendo vigentes porque reflejan la naturaleza inmutable del comportamiento humano y la psicología colectiva del mercado.`,
      },
      {
        type: "wyckoff-chart",
        title: "Esquemas de Wyckoff — Acumulación y Distribución",
        body: "Usa el selector para alternar entre el esquema de Acumulación (uptrend) y el de Distribución (downtrend). El gráfico inferior muestra el ciclo completo del Composite Man.",
        schema: "accumulation",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Las 5 Fases — Cómo identificarlas",
        text: "Fase A: El precio para su tendencia previa (PS/SC/AR para acumulación, PSY/BC/AR para distribución). Fase B: Construcción del rango — oscilaciones sin dirección clara. Fase C: La trampa — Spring (acumulación) o UTAD (distribución). Fase D: El mercado muestra su dirección real — SOS o SOW. Fase E: El movimiento tendencial sostenido.",
      },
      {
        type: "liquidity-absorption",
        title: "Absorción de Liquidez — El mecanismo interno del Wyckoff",
        body: "El Spring y el UTAD son exactamente lo mismo que el Sweep & Destroy del SMC moderno. La 'Fase C' de Wyckoff = el Judas Swing del AMD. Todo es el mismo mecanismo institucional: primero absorben, luego barren los stops, después se mueven.",
      },
      {
        type: "infobox",
        variant: "pro",
        label: "Wyckoff + SMC — La combinación definitiva",
        text: "Spring de Wyckoff = SSL Sweep en SMC. UTAD de Wyckoff = BSL Sweep en SMC. SOS de Wyckoff = BOS alcista en SMC. SOW de Wyckoff = BOS bajista en SMC. LPS de Wyckoff = Order Block / Golden Pocket para entrada. LPSY de Wyckoff = Bearish OB / FVG para short.",
      },
      {
        type: "table",
        headers: ["Evento Wyckoff", "Equivalente SMC/ICT", "¿Qué buscar en el gráfico?"],
        rows: [
          ["PS — Preliminary Support", "Primer OB alcista", "Vela de gran cuerpo alcista con volumen — primer freno"],
          ["SC — Selling Climax", "SSL Sweep + Absorción masiva", "Volumen climático + wick enorme abajo + cierre alcista"],
          ["AR — Automatic Rally", "BOS alcista LTF + FVG", "Impulso brusco alcista post-SC — define techo del rango"],
          ["ST — Secondary Test", "Retorno al OB del SC", "Misma zona del SC pero con volumen menor = institucionales listos"],
          ["Spring", "Liquidity Sweep (SSL)", "Wick bajo el soporte + cierre dentro del rango = TRAMPA"],
          ["SOS — Sign of Strength", "BOS alcista HTF", "Ruptura del AR con volumen expandido = confirmación"],
          ["LPS — Last Point of Support", "Bullish OB / Golden Pocket", "Último retroceso antes del markup — ENTRADA"],
          ["PSY — Preliminary Supply", "Primer OB bajista", "Primera venta institucional que frena el alza"],
          ["BC — Buying Climax", "BSL Sweep + Absorción masiva", "Volumen climático + wick arriba + cierre bajista"],
          ["UTAD — Upthrust After Dist.", "BSL Sweep + CHoCH bajista", "Wick sobre el BC + cierre dentro del rango = TRAMPA"],
          ["SOW — Sign of Weakness", "BOS bajista HTF", "Ruptura del AR con volumen expandido = confirmación bajista"],
          ["LPSY — Last Point of Supply", "Bearish OB / FVG bajista", "Último rebote antes del markdown — SHORT"],
        ],
      },
    ],
  },

  // ─── SESIONES DE TRADING (override con AMD) ──────────────────────────────
  "sesiones": {
    sections: [
      {
        type: "text",
        body: `El mercado forex y crypto sigue un ritmo diario marcado por la apertura y cierre de las principales plazas bursátiles del mundo. Entender este ritmo es fundamental para saber CUÁNDO operar y CUÁNDO mantenerse fuera del mercado.`,
      },
      {
        type: "session-chart",
        title: "Mapa de Sesiones — Horario Guayaquil (GMT-5)",
      },
      {
        type: "amd-chart",
        title: "Sesiones y Ciclo AMD — La Estructura del Día",
        body: "Las tres sesiones del día corresponden exactamente a las tres fases del ciclo AMD. El timing de las sesiones define qué tipo de movimiento esperar en cada momento.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Kill Zones — Ventanas de Alta Probabilidad",
        text: "London KZ: 2AM-5AM GYE (la más importante para forex). NY AM KZ: 7AM-10AM GYE (overlap — máxima liquidez). Asian KZ: 8PM-12AM GYE (para pares con JPY o BTC en rangos). Los mejores setups ocurren en estas ventanas — fuera de ellas el movimiento es errático.",
      },
      {
        type: "table",
        headers: ["Sesión", "Horario GYE (GMT-5)", "Volumen", "Pares recomendados", "Fase AMD"],
        rows: [
          ["Asiática", "6PM — 3AM", "Bajo", "JPY, AUD, BTC, ETH", "Acumulación"],
          ["Pre-London", "1AM — 3AM", "Medio", "EUR, GBP, CHF", "Manipulación (Judas)"],
          ["London", "3AM — 12PM", "MUY ALTO", "EUR/USD, GBP/USD, XAU", "Distribución inicio"],
          ["London/NY Overlap", "7AM — 12PM", "MÁXIMO", "Todos los pares", "Distribución máxima"],
          ["New York AM", "7AM — 2PM", "Alto", "USD pairs, BTC, SPX", "Distribución"],
          ["New York PM", "2PM — 5PM", "Medio", "USD pairs, BTC", "Distribución cierre"],
          ["Dead Zone", "12PM — 6PM", "Bajo", "Evitar entradas nuevas", "Sin fase clara"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "Silver Bullet — Los setups de ICT más precisos",
        text: "Silver Bullet AM: 3AM-4AM GYE (10-11AM NY). Silver Bullet PM: 7AM-8AM GYE (2-3PM NY). En esas ventanas, espera un sweep de liquidez + FVG. La entrada en el retorno al FVG tiene altísima probabilidad estadística según el análisis histórico de ICT.",
      },
    ],
  },

};
