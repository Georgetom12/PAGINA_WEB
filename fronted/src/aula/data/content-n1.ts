import type { AulaModuleContent } from "../types";

export const contentN1: Record<string, AulaModuleContent> = {
"intro-mercados": {
  sections: [
    {
      type: "market-anatomy-chart",
      title: "Anatomía del Mercado — Bid, Ask, Order Book",
    },
    {
      title: "¿Qué es el Trading?",
      body: `El trading es la compra y venta de activos financieros con el objetivo de obtener beneficios de las fluctuaciones de precio. A diferencia de la inversión a largo plazo, el trader busca aprovechar movimientos de corto y mediano plazo en el mercado.`,
      type: "text"
    },
    {
      title: "Tipos de Mercados",
      type: "cards",
      cards: [
        { color: "#00e676", title: "Renta Variable (Acciones)", icon: "📈", text: "Representan propiedad parcial de una empresa. Valoración basada en EBITDA, flujos de caja y ciclos económicos. Mercado centralizado con horarios definidos (NYSE: 9:30-16:00 EST)." },
        { color: "#00e5ff", title: "Criptoactivos", icon: "₿", text: "Protocolos digitales de transferencia de valor. Operan 24/7. Alta volatilidad por falta de regulación y sensibilidad extrema al order flow. Liquidez fragmentada entre exchanges." },
        { color: "#ffd700", title: "Forex", icon: "💱", text: "Mayor mercado del mundo (~6.6T USD/día). Pares de divisas. Opera 24/5 en cuatro sesiones: Sydney, Tokyo, London, New York. Spread estrecho en pares mayores." },
        { color: "#e040fb", title: "Materias Primas", icon: "🛢️", text: "Oro, petróleo, plata, gas natural. Influenciados por geopolítica, oferta/demanda y el dólar. Se tradean vía futuros, CFDs o ETFs." },
        { color: "#ff6d00", title: "Índices Bursátiles", icon: "🏛️", text: "Canasta de acciones representativas (S&P 500 = 500 empresas más grandes USA). Termómetro del mercado. Cuando el SPX sube, el 80% de las acciones suben con él." },
        { color: "#ff1744", title: "Futuros y Derivados", icon: "📜", text: "Contratos sobre activos subyacentes. Permiten apalancamiento. Futuros perpetuos en crypto: el instrumento más usado por institucionales para mover el mercado." },
      ]
    },
    {
      title: "Diferencias Clave: Crypto vs Acciones",
      type: "table",
      headers: ["Característica", "Acciones", "Crypto"],
      rows: [
        ["Horario", "Lunes-Viernes, sesiones fijas", "24/7/365"],
        ["Regulación", "Alta (SEC, CNMV, etc.)", "Baja/emergente"],
        ["Volatilidad", "Moderada (SPX ±1-2% diario)", "Alta (BTC ±5-15% diario)"],
        ["Acceso", "Requiere broker regulado", "Solo wallet/exchange"],
        ["Apalancamiento", "2x-4x típico", "Hasta 100x (futuros)"],
        ["Transparencia", "Estados financieros públicos", "On-chain visible"],
        ["Manipulación", "Regulada, penalizada", "Frecuente (whales)"],
        ["Gap de apertura", "Frecuentes (overnight)", "No existe (24/7)"],
      ]
    },
    {
      title: "Los Participantes del Mercado",
      type: "cards",
      cards: [
        { color: "#ffd700", title: "Institucionales (Smart Money)", icon: "🏦", text: "Hedge funds, bancos, market makers. Mueven volúmenes masivos. Sus órdenes no entran al mercado de una sola vez — las fragmentan y distribuyen. TU trabajo es seguirlos." },
        { color: "#00e5ff", title: "Retail Traders", icon: "👤", text: "Traders individuales. Representan ~15-20% del volumen. Son la liquidez que usan los institucionales para ejecutar sus posiciones. Aprende a no ser el combustible de ellos." },
        { color: "#e040fb", title: "Market Makers", icon: "⚡", text: "Proveen liquidez al mercado. Dan precio bid/ask constantemente. En crypto, los exchanges mismos suelen ser market makers. Su negocio es el spread." },
        { color: "#ff6d00", title: "Algoritmos (HFT)", icon: "🤖", text: "High Frequency Trading. Ejecutan miles de órdenes por segundo. Detectan imbalances de precio y los arbitran. Son el 60-70% del volumen en mercados desarrollados." },
      ]
    },
    {
      title: "Timeframes y su Uso",
      type: "table",
      headers: ["Timeframe", "Nombre", "Uso Principal", "Tipo de Trader"],
      rows: [
        ["1m - 5m", "Scalping", "Entradas ultra precisas, liquidez", "Scalper"],
        ["15m - 1H", "Intraday", "Confirmaciones, gestión de trade", "Day Trader"],
        ["4H", "Swing intraday", "Estructura principal + contexto", "Day/Swing"],
        ["Diario (D)", "Swing Trading", "Dirección macro del trade", "Swing Trader"],
        ["Semanal (W)", "Posicional", "Visión macro del mercado", "Posicional"],
        ["Mensual (M)", "Macro", "Ciclos largos, big picture", "Inversor/Macro"],
      ]
    },
    {
      type: "infobox",
      variant: "key",
      label: "REGLA DE ORO",
      text: "Siempre analiza de arriba hacia abajo (Top-Down Analysis). Empieza en el Mensual o Semanal para ver el contexto macro, luego baja al Diario para la estructura, y finalmente al 4H o 1H para la entrada. Nunca entres contra la dirección del timeframe mayor."
    }
  ]
},

"anatomia-mercado": {
  sections: [
    {
      type: "candle-anatomy",
      title: "Anatomía de una Vela Japonesa",
    },
    {
      title: "Bid, Ask y Spread",
      body: `El precio no es un número estático — es un equilibrio momentáneo entre compradores y vendedores. Entender esta mecánica es fundamental para cualquier trader.`,
      type: "text"
    },
    {
      type: "infobox",
      variant: "key",
      label: "CONCEPTOS BÁSICOS",
      text: `BID = El precio máximo que los compradores están dispuestos a pagar ahora mismo.
ASK = El precio mínimo que los vendedores aceptan ahora mismo.
SPREAD = ASK - BID = El costo de cada operación para el trader retail.`
    },
    {
      title: "Tipos de Órdenes",
      type: "table",
      headers: ["Tipo", "Descripción", "Cuándo Usarla", "Ventaja/Riesgo"],
      rows: [
        ["Market Order", "Compra/vende al precio actual del mercado", "Necesitas entrar/salir inmediatamente", "Ejecución garantizada pero puede sufrir slippage"],
        ["Limit Order", "Solo ejecuta al precio que especificaste", "Quieres entrar en zona exacta", "Mejor precio, puede no ejecutarse"],
        ["Stop Order", "Ejecuta cuando el precio llega a un nivel", "Stop Loss, entrada en ruptura", "Automática, puede sufrir slippage en gaps"],
        ["Stop Limit", "Stop + Limit combinados", "Control preciso de precio máximo de ejecución", "No garantiza ejecución si gap supera el límite"],
        ["Trailing Stop", "Stop que sigue al precio a distancia fija", "Proteger ganancias en tendencia", "Puede cerrarse en pullbacks normales"],
        ["OCO", "One Cancels Other — dos órdenes vinculadas", "TP y SL simultáneos", "Automatiza la gestión del trade"],
      ]
    },
    {
      title: "Maker vs Taker",
      type: "cards",
      cards: [
        { color: "#00e676", title: "Maker (Provee liquidez)", icon: "🎁", text: "Coloca órdenes limit que quedan en el libro de órdenes esperando ser ejecutadas. AÑADE liquidez al mercado. Los exchanges dan fees menores o incluso rebates a los makers. El trading institucional es mayoritariamente maker." },
        { color: "#ff1744", title: "Taker (Toma liquidez)", icon: "🎯", text: "Ejecuta contra órdenes que ya están en el libro. Usa market orders o limit orders que se ejecutan inmediatamente. QUITA liquidez. Paga fees más altos. El retail suele ser taker." },
      ]
    },
    {
      title: "El Libro de Órdenes (Order Book)",
      body: `El libro de órdenes muestra todas las órdenes limit pendientes a ambos lados del precio actual. En el lado izquierdo están los BIDS (compradores) y en el derecho los ASKS (vendedores). Leer el order book te permite ver dónde hay muros de compra/venta y anticipar movimientos.`,
      type: "text"
    },
    {
      type: "infobox",
      variant: "tip",
      label: "SLIPPAGE",
      text: "El slippage ocurre cuando el precio de ejecución difiere del esperado. Es más frecuente en: market orders con poco volumen, activos con spread amplio, o en momentos de alta volatilidad (noticias, rupturas). Para minimizarlo: usa limit orders siempre que sea posible."
    },
    {
      title: "Apalancamiento y Margen",
      type: "table",
      headers: ["Apalancamiento", "Capital Propio", "Control", "Riesgo de Liquidación (mov. adverso)"],
      rows: [
        ["1x (sin apalancamiento)", "$1,000", "$1,000", "No se puede liquidar"],
        ["2x", "$1,000", "$2,000", "-50% del activo"],
        ["5x", "$1,000", "$5,000", "-20% del activo"],
        ["10x", "$1,000", "$10,000", "-10% del activo"],
        ["25x", "$1,000", "$25,000", "-4% del activo"],
        ["100x", "$1,000", "$100,000", "-1% del activo"],
      ]
    },
    {
      type: "infobox",
      variant: "danger",
      label: "ADVERTENCIA",
      text: "El apalancamiento amplifica TANTO las ganancias como las pérdidas. Un trade con 10x que va en tu contra un 10% = liquidación total. El 90% de los traders que usan alto apalancamiento pierden su capital. PSYCHOMETRIKS recomienda: máximo 5x-10x en crypto, con gestión de riesgo estricta."
    }
  ]
},

"velas-basico": {
  sections: [
    {
      type: "candle-anatomy",
      title: "Anatomía Completa de la Vela",
    },
    {
      title: "Historia de las Velas Japonesas",
      body: `Las velas japonesas (Candlestick Charts o ローソク足, Rōsoku-ashi) fueron desarrolladas en el siglo XVIII por Munehisa Homma (1724–1803), un comerciante de arroz de Sakata, Japón. Homma acumuló una fortuna legendaria aplicando análisis psicológico al mercado de arroz en Dojima, Osaka. Su insight: los mercados no son solo números — reflejan emociones humanas: miedo, codicia, esperanza y pánico.`,
      type: "text"
    },
    {
      title: "Anatomía de una Vela",
      type: "cards",
      cards: [
        { color: "#00e676", title: "Cuerpo (Body)", icon: "📦", text: "Distancia entre apertura y cierre. Si cierra ARRIBA de la apertura = verde/alcista. Si cierra ABAJO = roja/bajista. El tamaño del cuerpo mide la decisión: cuerpo grande = dominio claro." },
        { color: "#00e5ff", title: "Mecha Superior (Upper Wick)", icon: "⬆️", text: "Distancia entre el cuerpo y el máximo. Representa el rechazo del precio al alza. Mecha superior larga en zona de resistencia = vendedores rechazaron esa zona fuertemente." },
        { color: "#ffd700", title: "Mecha Inferior (Lower Wick)", icon: "⬇️", text: "Distancia entre el cuerpo y el mínimo. Representa el rechazo del precio a la baja. Mecha inferior larga en zona de soporte = compradores rechazaron esa zona fuertemente." },
        { color: "#e040fb", title: "La Regla de Oro", icon: "⬡", text: "El cuerpo mide la DECISIÓN. Las mechas miden la BATALLA. Vela con cuerpo pequeño + mechas largas = indecisión total. Vela con cuerpo grande + sin mechas = convicción máxima." },
      ]
    },
    {
      title: "Tipos de Velas Básicas",
      type: "table",
      headers: ["Vela", "Descripción", "Señal", "Fuerza"],
      rows: [
        ["Marubozu Alcista", "Cuerpo grande verde, sin mechas. Apertura=mínimo, cierre=máximo", "Alcista fuerte — compradores dominaron todo", "★★★★★"],
        ["Marubozu Bajista", "Cuerpo grande rojo, sin mechas. Apertura=máximo, cierre=mínimo", "Bajista fuerte — vendedores dominaron todo", "★★★★★"],
        ["Martillo (Hammer)", "Cuerpo pequeño arriba, mecha inferior larga (>2x cuerpo)", "Alcista — rechazo de mínimos, compradores entraron", "★★★★"],
        ["Estrella Fugaz", "Cuerpo pequeño abajo, mecha superior larga (>2x cuerpo)", "Bajista — rechazo de máximos, vendedores entraron", "★★★★"],
        ["Doji", "Apertura ≈ Cierre. Cuerpo mínimo, mechas simétricas", "Neutro — indecisión total entre compradores y vendedores", "★★★"],
        ["Doji Libélula", "Apertura=Cierre=Máximo. Mecha inferior muy larga", "Alcista — rechazo bajista extremo desde soporte", "★★★★"],
        ["Doji Lápida", "Apertura=Cierre=Mínimo. Mecha superior muy larga", "Bajista — rechazo alcista extremo desde resistencia", "★★★★"],
        ["Spinning Top", "Cuerpo pequeño, mechas simétricas de tamaño medio", "Indecisión — contexto define la dirección", "★★"],
      ]
    },
    {
      title: "Psicología Detrás de las Velas",
      body: `Cada vela cuenta una historia completa de la batalla entre compradores y vendedores. Imagina la apertura de la vela: el precio comienza ahí. Los compradores empujan hacia arriba creando el cuerpo y el máximo. Los vendedores empujan hacia abajo creando el mínimo. Al cierre, el resultado final se plasma en el cuerpo.`,
      type: "text"
    },
    {
      type: "infobox",
      variant: "pro",
      label: "LECTURA PROFESIONAL",
      text: "No leas velas de forma aislada. Una vela solo tiene significado en CONTEXTO: ¿Dónde está en la estructura del mercado? ¿Está en zona de soporte o resistencia? ¿Hay confluencia con Fibonacci? Una misma vela Marubozu alcista en zona de distribución = señal débil. La misma en Golden Pocket de retroceso = señal fuerte."
    },
    {
      title: "El Cuerpo vs Las Mechas — Reglas de Interpretación",
      type: "table",
      headers: ["Elemento", "Grande/Largo", "Pequeño/Corto", "Interpretación"],
      rows: [
        ["Cuerpo", "Decisión clara del lado ganador", "Indecisión o equilibrio", "Mide la fuerza del movimiento"],
        ["Mecha Superior", "Rechazo bajista fuerte arriba", "Poca resistencia arriba", "Vendedores activos en esa zona"],
        ["Mecha Inferior", "Rechazo alcista fuerte abajo", "Poca demanda abajo", "Compradores activos en esa zona"],
        ["Sin mechas", "Convicción total (Marubozu)", "N/A", "El lado ganador dominó todo el período"],
      ]
    }
  ]
},

"estructura-mercado": {
  sections: [
    {
      type: "structure-chart",
      structureType: "uptrend",
      title: "Tendencia Alcista — HH / HL Visual",
    },
    {
      type: "structure-chart",
      structureType: "downtrend",
      title: "Tendencia Bajista — LH / LL Visual",
    },
    {
      type: "structure-chart",
      structureType: "bos-bullish",
      title: "Break of Structure (BOS) Alcista",
    },
    {
      type: "structure-chart",
      structureType: "choch-bearish",
      title: "Change of Character (CHoCH) Bajista",
    },
    {
      title: "Qué es la Estructura de Mercado",
      body: `El mercado se mueve en ondas — no en líneas rectas. Esta secuencia de máximos y mínimos define LA ESTRUCTURA. Entender la estructura es lo más importante en trading: sin estructura no hay contexto, sin contexto no hay trade.`,
      type: "text"
    },
    {
      title: "Tendencias y Swings",
      type: "cards",
      cards: [
        { color: "#00e676", title: "Tendencia Alcista (Uptrend)", icon: "📈", text: "Serie de máximos más altos (Higher Highs = HH) y mínimos más altos (Higher Lows = HL). Cada pullback crea un nuevo HL que sirve como zona de compra. La tendencia es válida mientras siga creando HH y HL." },
        { color: "#ff1744", title: "Tendencia Bajista (Downtrend)", icon: "📉", text: "Serie de máximos más bajos (Lower Highs = LH) y mínimos más bajos (Lower Lows = LL). Cada rebote crea un nuevo LH que sirve como zona de venta. La tendencia es válida mientras siga creando LH y LL." },
        { color: "#ffd700", title: "Rango / Consolidación", icon: "↔️", text: "El precio oscila entre dos niveles horizontales sin crear nuevos HH/LL. Indica equilibrio entre compradores y vendedores. El precio SIEMPRE termina rompiendo el rango — la dirección de la ruptura define la próxima tendencia." },
      ]
    },
    {
      title: "Swing Highs y Swing Lows",
      body: `Un Swing High es un máximo local flanqueado por al menos 2 velas con máximos más bajos a cada lado. Un Swing Low es un mínimo local flanqueado por al menos 2 velas con mínimos más altos. Los swings son los puntos de referencia para medir la estructura.`,
      type: "text"
    },
    {
      type: "infobox",
      variant: "key",
      label: "LA REGLA FUNDAMENTAL",
      text: `ALCISTA: HH → HL → HH → HL → HH
BAJISTA: LH → LL → LH → LL → LH
Cuando un HL rompe el LL anterior = POSIBLE cambio de tendencia (CHoCH)
Cuando el precio rompe el HH anterior = Confirmación de continuación alcista (BOS)`
    },
    {
      title: "Fases del Mercado",
      type: "table",
      headers: ["Fase", "Descripción", "Qué hace el precio", "Acción del Trader"],
      rows: [
        ["Acumulación", "Institucionales comprando silenciosamente", "Rango lateral tras caída", "Buscar señales de compra en el rango bajo"],
        ["Impulso Alcista", "Precio sube con fuerza (Mark Up)", "HH y HL sostenidos, volumen alto", "Ir long en los HL o en rupturas de HH"],
        ["Distribución", "Institucionales vendiendo posiciones largas", "Rango lateral en máximos", "Buscar señales de venta en el rango alto"],
        ["Impulso Bajista", "Precio cae con fuerza (Mark Down)", "LH y LL sostenidos, volumen alto", "Ir short en los LH o en rupturas de LL"],
      ]
    },
    {
      title: "Timeframes y Estructura Fractal",
      body: `La estructura del mercado es FRACTAL: el mismo patrón se repite en todos los timeframes. Una tendencia alcista en el gráfico semanal contiene dentro suya múltiples ciclos de acumulación/distribución en el diario. Un retroceso en el diario contiene impulsos y retrocesos en el 4H. Siempre analiza de arriba hacia abajo.`,
      type: "text"
    },
    {
      type: "infobox",
      variant: "warn",
      label: "ERROR COMÚN",
      text: "Muchos traders ven una tendencia bajista en 15 minutos y venden, sin darse cuenta que están dentro de un retroceso de una tendencia ALCISTA en el diario. El timeframe mayor SIEMPRE manda. Un corto en una pullback alcista en diario tiene probabilidad baja — aunque en el gráfico de 15m 'parezca' bajista."
    },
    {
      title: "Soportes y Resistencias en Estructura",
      type: "cards",
      cards: [
        { color: "#00e676", title: "Soporte", icon: "🛡️", text: "Nivel donde el precio ha rebotado múltiples veces al alza. El mercado 'recuerda' ese nivel. Cuantas más veces toca sin romper, más fuerte. Un soporte roto se convierte en resistencia (inversión de roles)." },
        { color: "#ff1744", title: "Resistencia", icon: "🚧", text: "Nivel donde el precio ha rebotado múltiples veces a la baja. Zona de oferta histórica. Una resistencia rota se convierte en soporte." },
        { color: "#ffd700", title: "Zona de Demanda", icon: "📥", text: "Área de precio donde hubo mucha demanda institucional. No es una línea exacta sino una zona. Precio suele regresar y rebotar desde ella." },
        { color: "#e040fb", title: "Zona de Oferta", icon: "📤", text: "Área de precio donde hubo mucha venta institucional. El precio suele regresar y rechazarse desde ella." },
      ]
    }
  ]
}

};
