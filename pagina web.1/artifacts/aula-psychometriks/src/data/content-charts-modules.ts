export const contentChartsModules: Record<string, any> = {

"velas-basico": {
  sections: [
    {
      title: "¿Qué es una Vela Japonesa?",
      type: "text",
      body: `Las velas japonesas son la representación visual más eficiente del comportamiento del precio en un período de tiempo. Fueron desarrolladas por el comerciante de arroz Munehisa Homma en Japón en el siglo XVIII — mucho antes de que Wall Street existiera.

Cada vela codifica 4 datos: Apertura (Open), Máximo (High), Mínimo (Low) y Cierre (Close). Son conocidas como OHLC. La vela es alcista (verde/blanca) si cierra sobre la apertura, y bajista (roja/negra) si cierra bajo la apertura. La diferencia entre apertura y cierre es el "cuerpo". Los extremos del cuerpo hacia High y Low son las "mechas" o "sombras".`,
    },
    {
      type: "candle-chart",
      title: "Anatomía de la Vela — Alcista vs Bajista",
      candles: [
        { open: 30, high: 70, close: 60, low: 20, label: "ALCISTA" },
        { open: 60, high: 75, close: 40, low: 15, label: "BAJISTA" },
        { open: 45, high: 80, close: 50, low: 10, label: "DOJI" },
        { open: 30, high: 70, close: 65, low: 28, label: "MARUBOZU↑" },
        { open: 65, high: 70, close: 35, low: 28, label: "MARUBOZU↓" },
      ],
      annotations: [
        { x: 0, y: 70, text: "High", color: "#546e7a" },
        { x: 0, y: 20, text: "Low", color: "#546e7a" },
        { x: 1, y: 75, text: "High", color: "#546e7a" },
      ],
    },
    {
      title: "Las 4 partes de una Vela",
      type: "table",
      headers: ["Parte", "Nombre", "Qué indica", "Color"],
      rows: [
        ["Precio más alto", "High / Máximo", "El punto más alto que alcanzó el precio en ese período", "Wick superior"],
        ["Precio más bajo", "Low / Mínimo", "El punto más bajo que alcanzó el precio en ese período", "Wick inferior"],
        ["Precio de apertura", "Open / Apertura", "El precio al inicio del período", "Borde del cuerpo"],
        ["Precio de cierre", "Close / Cierre", "El precio al final del período", "Borde opuesto del cuerpo"],
        ["Cuerpo", "Body", "Diferencia entre Open y Close. Cuerpo grande = movimiento fuerte", "Verde/Rojo"],
        ["Mecha/Sombra", "Wick / Shadow", "Precio que fue rechazado. Mecha larga = rechazo fuerte", "Línea del cuerpo"],
      ],
    },
    {
      title: "Tipos de Velas — Las Más Importantes",
      type: "cards",
      cards: [
        {
          color: "#00e676",
          icon: "🕯️",
          title: "Marubozu Alcista",
          text: "Sin mechas. Puro cuerpo verde. El precio abrió en el mínimo y cerró en el máximo. Fuerza compradora absoluta. Los vendedores no tuvieron ninguna oportunidad durante toda la vela. Señal de continuación alcista muy fuerte.",
        },
        {
          color: "#ff1744",
          icon: "🕯️",
          title: "Marubozu Bajista",
          text: "Sin mechas. Puro cuerpo rojo. El precio abrió en el máximo y cerró en el mínimo. Presión vendedora absoluta. Los compradores no tuvieron ninguna oportunidad. Señal de continuación bajista muy fuerte.",
        },
        {
          color: "#ffd700",
          icon: "➕",
          title: "Doji",
          text: "Apertura y cierre casi idénticos. El cuerpo es prácticamente inexistente. Indica indecisión — los compradores y vendedores están en equilibrio. Su significado cambia completamente según el contexto: en tendencia alcista puede ser señal de agotamiento; aislado no significa nada.",
        },
        {
          color: "#00e5ff",
          icon: "⬆",
          title: "Pin Bar / Hammer",
          text: "Mecha inferior muy larga (2x o más que el cuerpo). Cuerpo pequeño en la parte alta. Indica rechazo del precio hacia abajo — los vendedores llevaron el precio muy abajo pero los compradores lo recuperaron antes del cierre. En soporte = señal de reversión muy potente.",
        },
        {
          color: "#e040fb",
          icon: "⬇",
          title: "Shooting Star / Hanging Man",
          text: "Mecha superior muy larga. Cuerpo pequeño en la parte baja. Es el inverso del Hammer. Indica rechazo del precio hacia arriba — los compradores intentaron llevar el precio arriba pero los vendedores lo devolvieron. En resistencia = señal de reversión bajista.",
        },
        {
          color: "#ff6d00",
          icon: "🌟",
          title: "Spinning Top",
          text: "Cuerpo pequeño con mechas largas en ambos lados. Más indecisión que el Doji pero con más actividad. Los compradores y vendedores lucharon intensamente y ninguno ganó. En un nivel clave puede indicar próxima reversión, pero necesita confirmación.",
        },
      ],
    },
    {
      type: "candle-chart",
      title: "Pin Bar Alcista en Soporte — Ejemplo de Entrada",
      candles: [
        { open: 55, high: 60, close: 52, low: 48 },
        { open: 52, high: 56, close: 50, low: 45 },
        { open: 50, high: 54, close: 48, low: 44 },
        { open: 47, high: 52, close: 58, low: 30, color: "#ffd700", label: "PIN BAR" },
        { open: 57, high: 65, close: 63, low: 56 },
        { open: 63, high: 70, close: 68, low: 62 },
        { open: 67, high: 75, close: 73, low: 66 },
      ],
      lines: [
        { y: 32, color: "#00e676", label: "SOPORTE", dash: true },
      ],
      annotations: [
        { x: 3, y: 62, text: "Rechazo bajo", color: "#ffd700" },
        { x: 4, y: 68, text: "Confirmación", color: "#00e676" },
      ],
    },
    {
      type: "infobox",
      variant: "key",
      label: "PSICOLOGÍA DETRÁS DE CADA VELA",
      text: `Cada vela cuenta la historia de la batalla entre compradores y vendedores en ese período de tiempo.

Vela verde grande = los compradores ganaron claramente
Vela roja grande = los vendedores ganaron claramente
Doji / Spinning top = nadie ganó, batalla equilibrada
Mecha inferior larga = los vendedores intentaron llevar el precio abajo pero fracasaron (rechazo)
Mecha superior larga = los compradores intentaron llevar el precio arriba pero fracasaron (rechazo)

La magia no está en una vela aislada. Está en leer la secuencia de velas: ¿quién fue ganando impulso? ¿Dónde ocurrieron los rechazos?`,
    },
    {
      title: "Lecturas por Tipo de Cuerpo",
      type: "table",
      headers: ["Característica", "Alcista", "Bajista", "Significado"],
      rows: [
        ["Cuerpo grande", "Verde, sin mechas", "Rojo, sin mechas", "Momentum fuerte, dirección clara"],
        ["Cuerpo pequeño", "Verde chico", "Rojo chico", "Indecisión o transición"],
        ["Mecha inferior larga", "Cuerpo arriba", "Cuerpo arriba", "Rechazo bajista — compradores fuerte"],
        ["Mecha superior larga", "Cuerpo abajo", "Cuerpo abajo", "Rechazo alcista — vendedores fuerte"],
        ["Mechas iguales", "Ambos lados", "Ambos lados", "Lucha equilibrada sin ganador"],
        ["Sin mechas", "Marubozu verde", "Marubozu rojo", "Dominio absoluto de un lado"],
        ["Cierre en máximo", "Señal fuerte alcista", "Cierre en máximo raro", "Compradores controlaron el cierre"],
        ["Cierre en mínimo", "Poco frecuente", "Señal fuerte bajista", "Vendedores controlaron el cierre"],
      ],
    },
  ],
},

"velas-patrones": {
  sections: [
    {
      title: "Patrones de Velas — Por Qué Funcionan",
      type: "text",
      body: `Los patrones de velas funcionan porque el comportamiento humano es repetitivo. El miedo, la codicia, la euforia y el pánico se manifiestan de las mismas formas en los gráficos, una y otra vez. Los patrones de velas son la huella visual de esas emociones colectivas.

Sin embargo, una regla fundamental: ningún patrón de velas funciona de forma aislada. Un Engulfing Alcista en medio de una tendencia bajista fuerte es irrelevante. El mismo patrón en un soporte clave, con el RSI en sobreventa, en la sesión de Nueva York, después de una barrida de liquidez = entrada de alta probabilidad.

Hay más de 80 patrones documentados. Los más importantes son los que aparecen más frecuentemente en zonas clave y tienen mayor tasa de éxito estadístico.`,
    },
    {
      type: "candle-chart",
      title: "Engulfing Alcista — Reversión en Soporte",
      candles: [
        { open: 70, high: 75, close: 62, low: 58 },
        { open: 65, high: 70, close: 60, low: 55 },
        { open: 62, high: 66, close: 58, low: 52 },
        { open: 57, high: 61, close: 54, low: 50 },
        { open: 53, high: 57, close: 49, low: 45, label: "BAJISTA" },
        { open: 44, high: 72, close: 68, low: 40, color: "#00e676", label: "ENGULFING" },
        { open: 67, high: 78, close: 76, low: 65 },
        { open: 75, high: 85, close: 83, low: 74 },
      ],
      lines: [
        { y: 42, color: "#00e676", label: "SOPORTE", dash: true },
      ],
      annotations: [
        { x: 5, y: 75, text: "Engloba vela anterior", color: "#ffd700" },
      ],
    },
    {
      title: "Patrones de Reversión Alcista (más importantes)",
      type: "table",
      headers: ["Patrón", "Velas", "Descripción", "Confiabilidad"],
      rows: [
        ["Hammer", "1 vela", "Mecha inferior 2x+ cuerpo. En soporte.", "★★★★★"],
        ["Bullish Engulfing", "2 velas", "Vela verde engloba completamente vela roja anterior", "★★★★★"],
        ["Morning Star", "3 velas", "Rojo grande → Doji/pequeña → Verde grande que recupera", "★★★★★"],
        ["Bullish Harami", "2 velas", "Vela verde pequeña dentro del cuerpo de la roja anterior", "★★★☆☆"],
        ["Piercing Pattern", "2 velas", "Vela verde que cierra sobre el 50% de la roja anterior", "★★★★☆"],
        ["Tweezer Bottom", "2 velas", "Dos velas con mismo mínimo. Segundo intento rechazado.", "★★★★☆"],
        ["Three White Soldiers", "3 velas", "3 verdes consecutivas crecientes, cierres en máximo", "★★★★☆"],
        ["Bullish Abandoned Baby", "3 velas", "Rojo grande → Doji con gap → Verde grande con gap", "★★★★★"],
        ["Dragonfly Doji", "1 vela", "Doji con mecha inferior muy larga, sin mecha superior", "★★★★☆"],
        ["Belt Hold Alcista", "1 vela", "Abre en mínimo, sube, sin mecha inferior", "★★★☆☆"],
      ],
    },
    {
      type: "candle-chart",
      title: "Morning Star — Reversión Bajista a Alcista",
      candles: [
        { open: 80, high: 85, close: 60, low: 55 },
        { open: 58, high: 63, close: 55, low: 52, label: "DOJI" },
        { open: 56, high: 82, close: 79, low: 54, color: "#00e676", label: "CONF." },
        { open: 78, high: 88, close: 86, low: 76 },
        { open: 85, high: 95, close: 93, low: 84 },
      ],
      annotations: [
        { x: 0, y: 88, text: "1: Rojo grande", color: "#ff1744" },
        { x: 1, y: 67, text: "2: Doji (indecisión)", color: "#ffd700" },
        { x: 2, y: 85, text: "3: Verde confirma", color: "#00e676" },
      ],
    },
    {
      title: "Patrones de Reversión Bajista (más importantes)",
      type: "table",
      headers: ["Patrón", "Velas", "Descripción", "Confiabilidad"],
      rows: [
        ["Shooting Star", "1 vela", "Mecha superior 2x+ cuerpo. En resistencia.", "★★★★★"],
        ["Bearish Engulfing", "2 velas", "Vela roja engloba completamente la verde anterior", "★★★★★"],
        ["Evening Star", "3 velas", "Verde grande → Doji → Rojo grande que devuelve", "★★★★★"],
        ["Hanging Man", "1 vela", "Como Hammer pero en resistencia = bajista", "★★★☆☆"],
        ["Dark Cloud Cover", "2 velas", "Vela roja que cierra bajo el 50% de la verde anterior", "★★★★☆"],
        ["Tweezer Top", "2 velas", "Dos velas con mismo máximo. Segundo intento rechazado.", "★★★★☆"],
        ["Three Black Crows", "3 velas", "3 rojas consecutivas, cierres en mínimo", "★★★★☆"],
        ["Bearish Harami", "2 velas", "Vela roja pequeña dentro del cuerpo de la verde anterior", "★★★☆☆"],
        ["Gravestone Doji", "1 vela", "Doji con mecha superior muy larga, sin mecha inferior", "★★★★☆"],
        ["Bearish Abandoned Baby", "3 velas", "Verde grande → Doji con gap → Rojo grande con gap", "★★★★★"],
      ],
    },
    {
      title: "Patrones de Continuación",
      type: "table",
      headers: ["Patrón", "Dirección", "Descripción", "Confiabilidad"],
      rows: [
        ["Rising Three Methods", "Alcista", "Vela grande verde → 3 pequeñas rojas → verde que supera todo", "★★★★★"],
        ["Falling Three Methods", "Bajista", "Vela grande roja → 3 pequeñas verdes → roja que rompe todo", "★★★★★"],
        ["Bullish Mat Hold", "Alcista", "Variante del Rising Three Methods con mayor fuerza", "★★★★☆"],
        ["Upside Tasuki Gap", "Alcista", "Gap alcista → roja que no lo cierra. Gap mantiene fuerza.", "★★★☆☆"],
        ["Downside Tasuki Gap", "Bajista", "Gap bajista → verde que no lo cierra. Gap mantiene fuerza.", "★★★☆☆"],
        ["Separating Lines", "Ambas", "Vela opuesta que abre en el mismo Open de la anterior", "★★★☆☆"],
        ["On Neck", "Bajista", "Vela verde que cierra en el mínimo de la roja anterior", "★★★☆☆"],
        ["Kicking Alcista", "Alcista", "Marubozu rojo → Marubozu verde con gap. Muy raro pero poderoso", "★★★★★"],
      ],
    },
    {
      type: "infobox",
      variant: "pro",
      label: "REGLA DE ORO DE LOS PATRONES DE VELAS",
      text: `Los patrones de velas son herramientas de CONTEXTO, no de señal.

Un Engulfing Alcista en:
❌ Medio de rango sin dirección = irrelevante
❌ Resistencia fuerte = señal falsa probable
✅ Soporte clave + Order Block + Golden Pocket = señal de alta probabilidad

Siempre pregunta:
1. ¿Estoy en una zona relevante? (Soporte/Resistencia/Order Block/Fib)
2. ¿El timeframe mayor está de acuerdo? (HTF Analysis)
3. ¿Hay volumen que respalde el patrón?
4. ¿La sesión es correcta? (Overlap London+NY para mayor fiabilidad)

Cuando se cumplen los 4 = entrada PREMIUM.`,
    },
  ],
},

"fibonacci": {
  sections: [
    {
      title: "Fibonacci y el Mercado",
      type: "text",
      body: `Leonardo Fibonacci fue un matemático del siglo XII que describió la secuencia: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144... La propiedad clave: cada número dividido por el siguiente da aproximadamente 0.618 — el "Golden Ratio" o Phi (φ). Esta proporción aparece en la naturaleza (espirales de conchas, flores, tornados) y los mercados financieros.

¿Por qué el mercado respeta Fibonacci? Porque suficientes traders lo usan: cuando el precio llega al 61.8% y suficientes traders colocan órdenes ahí, se convierte en una profecía autocumplida. Pero más allá de eso, los grandes fondos y algoritmos también usan estas zonas como referencias para su gestión de posiciones.

La aplicación correcta de Fibonacci es una de las habilidades más diferenciadoras del trader avanzado. Dominarlo toma tiempo — pero cuando confluye con estructura, order blocks y sesiones, da las entradas más precisas posibles.`,
    },
    {
      type: "fib-chart",
      title: "Fibonacci Alcista — Retrocesos desde Swing Low a High",
      fibDirection: "bullish",
    },
    {
      type: "fib-chart",
      title: "Fibonacci Bajista — Retrocesos desde Swing High a Low",
      fibDirection: "bearish",
    },
    {
      title: "Los Niveles y Su Significado",
      type: "table",
      headers: ["Nivel", "Ratio", "Significado", "Tipo de Reacción"],
      rows: [
        ["23.6%", "0.236", "Retroceso shallow. Tendencias muy fuertes solo rebotan aquí.", "Débil — solo en momentum extremo"],
        ["38.2%", "0.382", "Primer nivel relevante. Estructura continúa si rebota aquí.", "Moderado — confirma tendencia fuerte"],
        ["50%", "0.500", "No es Fibonacci puro (es de Dow Theory) pero muy respetado.", "Fuerte — zona de decisión psicológica"],
        ["61.8% ★", "0.618", "El Golden Ratio. La zona más importante de Fibonacci.", "Muy fuerte — entrada clásica"],
        ["70.5%", "0.705", "Parte baja del Golden Pocket. Zona de OB frecuente.", "Muy fuerte — con 61.8 forma el pocket"],
        ["78.6%", "0.786", "Retroceso profundo. Última defensa antes de invalidad la estructura.", "Fuerte — con OB puede dar excelente R:R"],
        ["88.6%", "0.886", "Nivel del patrón Bat. Retroceso extremo.", "Variable — depende del contexto"],
        ["100%", "1.000", "Vuelve al punto de inicio. Si rompe = estructura invalidada.", "Zona de invalidación"],
      ],
    },
    {
      type: "infobox",
      variant: "key",
      label: "EL GOLDEN POCKET — LA ZONA MÁS IMPORTANTE",
      text: `El Golden Pocket es la zona entre el 61.8% y el 70.5% de Fibonacci.

Es la zona donde:
• Retroceden los activos en tendencia alcista fuerte para seguir subiendo
• Los institucionales compran en fuertes pullbacks
• Se concentra la mayor probabilidad estadística de reversión

Cuando el Golden Pocket coincide con:
✓ Order Block H4/H1
✓ Sesión de New York / Overlap
✓ RSI en zona de sobreventa
✓ Vela de confirmación (Hammer, Engulfing)

= Entrada PREMIUM con R:R de 3:1 a 5:1 común`,
    },
    {
      title: "Cómo Trazar Fibonacci Correctamente",
      type: "cards",
      cards: [
        {
          color: "#00e676",
          icon: "1️⃣",
          title: "Identifica el Swing Low y Swing High",
          text: "Para tendencia alcista: Swing Low = el punto más bajo del movimiento impulso. Swing High = el punto más alto al que llegó. Debe ser un movimiento claro y significativo, no cualquier vela.",
        },
        {
          color: "#00e5ff",
          icon: "2️⃣",
          title: "Traza de Low a High (o viceversa)",
          text: "En TradingView usa la herramienta 'Fibonacci Retracement'. Para alcista: clic en el Swing Low, arrastra hasta el Swing High. Para bajista: clic en el Swing High, arrastra hasta el Swing Low. La herramienta coloca automáticamente los niveles.",
        },
        {
          color: "#ffd700",
          icon: "3️⃣",
          title: "Valida el Swing — No cualquier movimiento",
          text: "El swing debe ser claramente visible en el timeframe que operas. Un impulso de al menos 3-5 velas. Si el movimiento es demasiado pequeño o hay mucho ruido, el Fibonacci no será efectivo.",
        },
        {
          color: "#e040fb",
          icon: "4️⃣",
          title: "Busca Confluencias en los Niveles",
          text: "El nivel de Fibonacci por sí solo no es suficiente. Busca que el 61.8% o el 78.6% coincida con: una zona de Order Block, una resistencia/soporte roto que se convierte en soporte/resistencia, o un nivel de Fibonacci en otro timeframe.",
        },
        {
          color: "#ff6d00",
          icon: "5️⃣",
          title: "Espera Confirmación de Vela",
          text: "Cuando el precio llega al nivel Fibonacci objetivo, NO entres inmediatamente. Espera una vela de confirmación: Hammer, Engulfing alcista, Pin Bar. Sin confirmación, el precio puede simplemente perforar el nivel y seguir cayendo.",
        },
        {
          color: "#ff1744",
          icon: "6️⃣",
          title: "Define SL y TP antes de entrar",
          text: "SL: justo bajo el siguiente nivel de Fibonacci (por ejemplo, si entras en 61.8%, SL bajo 78.6%). TP1: el último swing high. TP2: extensión de Fibonacci al 127.2% o 161.8%. Calcula el R:R antes de entrar — mínimo 2:1.",
        },
      ],
    },
    {
      title: "Extensiones de Fibonacci — Dónde Tomar Ganancia",
      type: "table",
      headers: ["Extensión", "Uso Principal", "Descripción"],
      rows: [
        ["100%", "TP mínimo", "El precio alcanza el swing high/low original"],
        ["127.2%", "TP1 clásico", "Primera extensión. Común en correcciones moderadas"],
        ["141.4%", "TP intermedio", "Extensión media — menos usada pero respetada"],
        ["161.8%", "TP2 principal ★", "La extensión más importante. Muy alto porcentaje de reacción aquí"],
        ["200%", "TP en impulsos fuertes", "Doble del movimiento original"],
        ["224%", "TP extremo (Crab)", "Patrones armónicos extremos. Raro pero muy preciso"],
        ["261.8%", "TP máximo", "Extensión extrema en mercados de alta volatilidad como BTC"],
      ],
    },
    {
      type: "infobox",
      variant: "tip",
      label: "FIBONACCI MULTI-TIMEFRAME — EL SECRETO",
      text: `El verdadero poder de Fibonacci está en usar MÚLTIPLES timeframes.

Ejemplo práctico (BTC alcista):
1. En el gráfico Semanal (1W), traza Fibonacci del gran swing low al swing high reciente → te da el Golden Pocket semanal
2. En Diario (1D), traza otro Fibonacci del swing más reciente → te da el 61.8% diario
3. Cuando el 61.8% semanal y el 61.8% diario coinciden en la misma zona de precio = CONFLUENCIA MÁXIMA

Esta zona de confluencia multi-timeframe es donde los institucionales colocan sus compras masivas. Es la entrada más poderosa que puedes encontrar. Agrega un Order Block H4 en esa zona y tienes una configuración de clase mundial.`,
    },
    {
      title: "Fibonacci en BTC — Niveles Clave Históricos",
      type: "cards",
      cards: [
        {
          color: "#ffd700",
          icon: "₿",
          title: "Fibonacci desde el Ciclo Completo",
          text: "En cada ciclo de 4 años de BTC, el Bear Market suele retroceder al 78.6%-88.6% del movimiento alcista completo del ciclo anterior. El fondo de 2022 ($15,500) fue exactamente el 78.6% del ciclo 2020-2021. Los ciclos anteriores mostraron el mismo patrón.",
        },
        {
          color: "#00e5ff",
          icon: "📊",
          title: "Golden Pocket en Bull Market",
          text: "Durante el bull market, BTC realiza pullbacks significativos que típicamente tocan el Golden Pocket (61.8%-70.5%) antes de continuar su tendencia alcista. Cada corrección de 20-30% durante un bull run suele ser el mercado 'recargándose' en el Golden Pocket.",
        },
        {
          color: "#00e676",
          icon: "🎯",
          title: "161.8% como Target Principal",
          text: "En BTC, los rallies alcistas fuertes muy frecuentemente tienen como objetivo natural el 161.8% de extensión del impulso anterior. Si BTC mueve +50% desde un fondo y retrocede al 61.8%, el target del próximo impulso suele ser el 161.8% medido desde ese fondo.",
        },
      ],
    },
  ],
},

"sesiones": {
  sections: [
    {
      title: "Por Qué Importan las Sesiones de Trading",
      type: "text",
      body: `El mercado forex y crypto opera 24/7 pero NO es igual en todas las horas. La liquidez, el volumen y la volatilidad cambian drásticamente según qué centros financieros del mundo están activos. Operar en la hora correcta puede ser la diferencia entre un 70% de éxito y un 40%.

Los mercados financieros globales se organizan en tres centros principales: Asia (Tokio principalmente), Europa (Londres principalmente) y América del Norte (New York principalmente). Cada uno tiene sus propias características, activos favoritos y comportamiento típico.

Para los traders de BTC y XAU en Guayaquil (GMT-5), entender exactamente QUÉ pasa y CUÁNDO es esencial para no perder tiempo en horas muertas y enfocarse en las ventanas de máxima oportunidad.`,
    },
    {
      type: "session-chart",
      title: "Sesiones de Trading — Horario Guayaquil (GMT-5)",
    },
    {
      title: "Características de Cada Sesión — Análisis Profundo",
      type: "cards",
      cards: [
        {
          color: "#00e5ff",
          icon: "🌏",
          title: "ASIA (6:00 PM — 3:00 AM GYE)",
          text: "Tokio, Singapur, Hong Kong. Volumen bajo (~30% del día). BTC suele moverse lateral o en rango pequeño. Pares más activos: USD/JPY, AUD/USD, NZD/USD. Nikkei 225 y HSI son los índices de referencia. Buena sesión para: estudiar, revisar el contexto macro, planificar trades del día siguiente. No recomendada para buscar entradas agresivas en BTC.",
        },
        {
          color: "#ff6d00",
          icon: "⚠️",
          title: "PRE-LONDON (2:00 AM — 4:00 AM GYE)",
          text: "La zona más peligrosa del día para traders inexpertos. Los market makers y algoritmos institucionales generan movimientos falsos ('Judas Swing') para limpiar stops en ambas direcciones antes de que Londres establezca la dirección real. Stop hunts, fake breakouts y reversiones rápidas son la norma. El Judas Swing clásico: precio mueve fuerte en una dirección, los stops explotan, luego revierte violentamente hacia la dirección verdadera que establecerá Londres.",
        },
        {
          color: "#e040fb",
          icon: "🇬🇧",
          title: "LONDON (3:00 AM — 12:00 PM GYE)",
          text: "El centro financiero más importante del mundo para Forex. Maneja ~35% del volumen diario global. BTC y XAU/USD despiertan durante la sesión de Londres. Los primeros movimientos de Londres suelen marcar la DIRECCIÓN del día completo. DAX, FTSE 100 y EUR activos. Los primeros 2 horas de Londres (3-5AM GYE) son de los mejores períodos para identificar la dirección institucional. Confirmar la dirección de Londres antes de operar es fundamental.",
        },
        {
          color: "#ffd700",
          icon: "⚡",
          title: "OVERLAP L+NY (8:00 AM — 12:00 PM GYE)",
          text: "LA MEJOR VENTANA DEL DÍA. Dos de los centros financieros más importantes activos simultáneamente. Máximo volumen del día. Movimientos más limpios, breakouts más reales, las barridas de liquidez más precisas. NFP, CPI, FOMC salen típicamente a las 8:30 AM o 10:00 AM GYE. Los algoritmos institucionales ejecutan la mayoría de sus órdenes aquí. Si solo puedes operar 2 horas al día, que sean las 8-10 AM.",
        },
        {
          color: "#00e676",
          icon: "🇺🇸",
          title: "NEW YORK (8:00 AM — 5:00 PM GYE)",
          text: "SPX/NDX/US30 abren a las 9:30 AM GYE. Alta correlación con BTC durante esta sesión. El dólar (DXY) domina. El cierre de Wall Street (4:00 PM GYE) puede generar movimientos en BTC. Los futuros CME de BTC también cierran durante NY (4:00 PM GYE) — esto puede crear gaps o movimientos en el cierre. Post-4PM el volumen baja aunque el mercado sigue operando.",
        },
        {
          color: "#546e7a",
          icon: "💀",
          title: "DEAD ZONE (5:00 PM — 6:00 PM GYE)",
          text: "La hora más muerta del mercado. NY cerró, Asia no abrió. Spreads muy amplios, liquidez casi inexistente. BTC puede hacer moves bruscos sin sentido debido al bajo volumen — fácil de manipular. En Forex, los spreads se multiplican. Evita operar en esta ventana a menos que tengas una razón muy específica. El riesgo/beneficio no justifica estar expuesto.",
        },
      ],
    },
    {
      title: "El Judas Swing — Detallado",
      type: "text",
      body: `El Judas Swing es uno de los conceptos más importantes del trading moderno, formalizado por ICT (Inner Circle Trader). Ocurre principalmente en la zona Pre-London (2-4 AM GYE) pero también puede ocurrir al inicio de Londres o New York.

¿Qué es exactamente? El precio se mueve con fuerza en una dirección (por ejemplo, sube fuertemente), activando los stop losses de los traders que tienen posiciones cortas. Luego, inmediatamente después de que los stops son liquidados, el precio revierte violentamente hacia la dirección contraria (en el ejemplo, cae fuertemente) — esta es la dirección real que el mercado tomará durante la sesión.

La lógica: los market makers necesitan liquidez para llenar sus posiciones de alta magnitud. Los stop losses de los traders retail son esa liquidez. Al "cazar" esos stops primero, crean la liquidez necesaria para acumular su posición real.

Cómo usarlo: si ves un movimiento fuerte en Pre-London en una dirección, espera. Si ese movimiento barre un nivel de liquidez claro (por ejemplo, el High del día anterior) y luego el precio comienza a revertir = busca entrada en la dirección del rechazo. El Judas te da la dirección verdadera del día.`,
    },
    {
      type: "infobox",
      variant: "pro",
      label: "TU PLAN DE SESIONES ÓPTIMO — GUAYAQUIL",
      text: `Con este horario en GMT-5, tu plan semanal debería ser:

LUNES A VIERNES:
• 7:45 AM — Prepara el análisis: revisa el contexto macro, identifica los niveles clave del día
• 8:00 AM — Alerta máxima: inicio del Overlap London+NY
• 8:30 AM — Datos económicos (si hay): CPI, NFP, FOMC salen aquí
• 9:30 AM — Apertura Wall Street: confirma o invalida la dirección
• 8AM-12PM — Ventana de operación principal
• 12 PM — Cierre de Londres: posible reversión técnica temporal
• 12-2 PM — Post overlap: aún activo pero menor calidad
• 4 PM — Cierre CME BTC futuros: posible volatilidad
• 5-6 PM — DEAD ZONE: cierra posiciones o no abras nuevas
• 6 PM en adelante — Solo Asia: para estudiar, no para operar agresivamente`,
    },
    {
      title: "Correlaciones por Sesión — Activos Clave",
      type: "table",
      headers: ["Sesión", "Forex", "Índices", "Crypto", "Metales"],
      rows: [
        ["Asia (6PM-3AM)", "JPY, AUD, NZD, CNH", "Nikkei, Hang Seng, ASX", "BTC lateral/range", "Oro tranquilo"],
        ["Pre-London (2-4AM)", "EUR/USD, GBP/USD moviendo", "DAX futuros", "BTC: cuidado con fakes", "XAU puede moverse"],
        ["London (3AM-12PM)", "EUR, GBP, CHF dominan", "DAX, FTSE 100 en vivo", "BTC despierta", "XAU: movimientos reales"],
        ["Overlap (8AM-12PM)", "TODOS activos", "SPX/NDX futuros + europeos", "BTC: máxima actividad", "XAU: mejor ventana del día"],
        ["New York (8AM-5PM)", "USD domina, DXY activo", "SPX, NDX, Dow, Russell", "BTC correlado con NDX", "XAU correlado inversamente DXY"],
        ["Dead Zone (5-6PM)", "Spreads amplios", "Cerrados", "Movimientos sin volumen", "Riesgo de spike"],
      ],
    },
  ],
},

"estructura-mercado": {
  sections: [
    {
      title: "La Estructura de Mercado — El Lenguaje del Precio",
      type: "text",
      body: `La estructura de mercado es la base de todo el análisis técnico. Antes de poner cualquier indicador, orden o estrategia, necesitas identificar en qué estructura está el precio. El precio no se mueve en línea recta — se mueve en ondas, creando picos (máximos) y valles (mínimos) que forman patrones repetitivos y predecibles.

Entender la estructura te permite saber: ¿Estoy en una tendencia? ¿En qué dirección? ¿Está esa tendencia intacta o cambiando? ¿Dónde están los puntos clave que necesito monitorear? Esta lectura es fundamental — sin ella, cualquier otro análisis es como navegar sin brújula.`,
    },
    {
      type: "structure-chart",
      structureType: "uptrend",
      title: "Tendencia Alcista — HH → HL → HH → HL",
    },
    {
      type: "structure-chart",
      structureType: "downtrend",
      title: "Tendencia Bajista — LH → LL → LH → LL",
    },
    {
      type: "structure-chart",
      structureType: "bos-bullish",
      title: "Break of Structure (BOS) — Continuación Alcista",
    },
    {
      type: "structure-chart",
      structureType: "choch-bearish",
      title: "Change of Character (CHoCH) — Señal de Reversión",
    },
    {
      title: "HH, HL, LH, LL — Los 4 Pilares",
      type: "table",
      headers: ["Sigla", "Nombre", "Tendencia", "Significado"],
      rows: [
        ["HH", "Higher High — Máximo Mayor", "Alcista", "Cada nuevo máximo supera al máximo anterior. Compradores están en control."],
        ["HL", "Higher Low — Mínimo Mayor", "Alcista", "Cada corrección se detiene en un punto más alto que la corrección anterior. La demanda es creciente."],
        ["LH", "Lower High — Máximo Menor", "Bajista", "Cada rebote no logra superar el máximo anterior. Vendedores controlan los repuntes."],
        ["LL", "Lower Low — Mínimo Menor", "Bajista", "Cada caída lleva el precio más abajo. La oferta aplasta la demanda."],
        ["EQ", "Equal High/Low — Igualdad", "Rango", "Precio alcanza el mismo nivel 2+ veces. Es una zona de liquidez = probable ruptura pronto."],
      ],
    },
    {
      type: "infobox",
      variant: "key",
      label: "BOS vs CHoCH — LA DIFERENCIA CRÍTICA",
      text: `BOS (Break of Structure): El precio rompe el último HH en tendencia alcista. Confirma que la tendencia CONTINÚA. Ideal para buscar entradas long en el siguiente HL.

CHoCH (Change of Character): El precio rompe el último HL en tendencia alcista. Es el PRIMER indicio de que la tendencia puede estar cambiando. No es confirmación de reversión — es una advertencia. Para confirmar la reversión, necesitas ver el siguiente movimiento: si forman LH → LL = reversión confirmada.

Error común: Tomar un CHoCH como señal de venta inmediata. El CHoCH solo dice "algo está cambiando". Necesitas confirmación adicional.`,
    },
  ],
},

};
