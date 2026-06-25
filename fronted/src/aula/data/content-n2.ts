import type { AulaModuleContent } from "../types";

export const contentN2: Record<string, AulaModuleContent> = {
"velas-patrones": {
  sections: [
    {
      type: "candle-chart",
      title: "Tipos de Velas — Visual Interactivo",
    },
    {
      type: "candle-patterns",
      title: "Grilla Visual de Patrones de Velas",
    },
    {
      type: "chart-patterns",
      title: "Patrones Chartistas Clásicos",
    },
    {
      title: "Patrones de Reversión — 2 Velas",
      type: "table",
      headers: ["Patrón", "Formación", "Señal", "Fuerza"],
      rows: [
        ["Envolvente Alcista", "Vela roja pequeña → vela verde que la engloba totalmente", "ALCISTA — cambio de control total. La demanda superó la oferta.", "★★★★★"],
        ["Envolvente Bajista", "Vela verde pequeña → vela roja que la engloba totalmente", "BAJISTA — cambio de control total. La oferta superó la demanda.", "★★★★★"],
        ["Piercing Line", "Vela roja → verde que cierra >50% del cuerpo rojo", "ALCISTA — compradores recuperaron más del 50% de la caída", "★★★★"],
        ["Nube Oscura (Dark Cloud)", "Vela verde → roja que cierra <50% del cuerpo verde", "BAJISTA — distribución institucional comenzando", "★★★★"],
        ["Harami Alcista", "Vela roja grande → verde pequeña dentro del rango rojo", "ALCISTA POTENCIAL — vendedores perdiendo fuerza", "★★★"],
        ["Harami Bajista", "Vela verde grande → roja pequeña dentro del rango verde", "BAJISTA POTENCIAL — compradores perdiendo fuerza", "★★★"],
        ["Tweezer Bottom", "Dos velas con mínimo idéntico (roja → verde)", "ALCISTA — doble rechazo desde mismo nivel", "★★★★"],
        ["Tweezer Top", "Dos velas con máximo idéntico (verde → roja)", "BAJISTA — doble rechazo desde mismo nivel", "★★★★"],
        ["Kick Alcista", "Marubozu rojo → Marubozu verde con gap al alza", "ALCISTA EXPLOSIVO — cambio institucional masivo", "★★★★★"],
        ["Kick Bajista", "Marubozu verde → Marubozu rojo con gap a la baja", "BAJISTA EXPLOSIVO — institucionales vendiendo masivamente", "★★★★★"],
      ]
    },
    {
      title: "Patrones de Reversión — 3 Velas",
      type: "table",
      headers: ["Patrón", "Secuencia", "Contexto", "Señal"],
      rows: [
        ["Morning Star", "Roja + Doji/pequeña + Verde fuerte", "Final de tendencia bajista", "ALCISTA FUERTE — clásico de reversión"],
        ["Evening Star", "Verde + Doji/pequeña + Roja fuerte", "Final de tendencia alcista", "BAJISTA FUERTE — distribución clásica"],
        ["Tres Soldados Blancos", "3 velas verdes consecutivas, cuerpos grandes, cierres en máximos", "Tras consolidación o fondo", "ALCISTA — impulso sostenido"],
        ["Tres Cuervos Negros", "3 velas rojas consecutivas, cuerpos grandes, cierres en mínimos", "Tras consolidación o techo", "BAJISTA — caída sostenida"],
        ["Three Inside Up", "Harami alcista + confirmación verde que supera el máximo de vela 1", "En soporte fuerte", "ALCISTA — triple confirmación"],
        ["Three Inside Down", "Harami bajista + confirmación roja que rompe el mínimo de vela 1", "En resistencia fuerte", "BAJISTA — triple confirmación"],
        ["Bebé Abandonado Alcista", "Roja + gap abajo + Doji + gap arriba + Verde", "En mínimos absolutos", "ALCISTA EXPLOSIVO — rarísimo"],
        ["Bebé Abandonado Bajista", "Verde + gap arriba + Doji + gap abajo + Roja", "En máximos absolutos", "BAJISTA EXPLOSIVO — rarísimo"],
      ]
    },
    {
      title: "Patrones de Continuación",
      type: "cards",
      cards: [
        { color: "#00e676", title: "Tres Métodos Alcistas", icon: "📈", text: "Vela verde grande → 3 velas rojas pequeñas dentro del rango → vela verde grande que supera el máximo. CONTINÚA la tendencia alcista. Las 3 velas pequeñas son el pullback/retroceso." },
        { color: "#ff1744", title: "Tres Métodos Bajistas", icon: "📉", text: "Vela roja grande → 3 velas verdes pequeñas dentro del rango → vela roja grande que rompe el mínimo. CONTINÚA la tendencia bajista." },
        { color: "#00e5ff", title: "Separating Lines", icon: "→", text: "Vela en una dirección → siguiente vela abre en el mismo nivel pero va en la dirección de la tendencia. Señal de reacumulación (alcista) o redistribución (bajista)." },
        { color: "#ffd700", title: "High/Low Wave", icon: "〰️", text: "Velas con mechas muy largas en ambos lados y cuerpos pequeños. Indica consolidación con alta participación. Suele preceder un movimiento fuerte. Dirección depende del contexto." },
      ]
    },
    {
      type: "infobox",
      variant: "pro",
      label: "REGLA CLAVE",
      text: "Los patrones de velas NO son señales de entrada por sí solos. Son FILTROS. Solo toma un trade cuando el patrón aparece en: zona de soporte/resistencia clave + nivel de Fibonacci (61.8% o 78.6%) + confluencia con EMA o estructura. Con 3 confluencias mínimo, la probabilidad de éxito aumenta significativamente."
    },
    {
      title: "Patrones de Rango y Consolidación",
      type: "table",
      headers: ["Patrón", "Formación", "Duración", "Ruptura esperada"],
      rows: [
        ["Inside Bar", "Vela completa dentro del rango de la anterior", "1 vela", "En dirección de tendencia mayor"],
        ["NR4/NR7", "Vela con rango menor que las 4/7 anteriores", "1 vela", "Expansión fuerte del rango próxima"],
        ["Doji en Soporte", "Doji exactamente en nivel de soporte/fibo", "1 vela", "Alcista — rebote inminente"],
        ["Pin Bar en Resistencia", "Estrella fugaz en resistencia clave", "1 vela", "Bajista — caída inminente"],
        ["Squeezing (Compresión)", "3-5 velas de rango decreciente", "3-5 velas", "Ruptura violenta en cualquier dirección"],
      ]
    }
  ]
},

"fibonacci": {
  sections: [
    {
      type: "fib-chart",
      title: "Fibonacci — Retrocesos Visuales",
    },
    {
      type: "fib-levels-chart",
      title: "Fibonacci — Extensiones y Niveles Clave",
    },
    {
      title: "La Secuencia y las Proporciones",
      body: `Leonardo Fibonacci fue un matemático italiano del siglo XIII. La secuencia 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144... aparece en toda la naturaleza: espirales de caracoles, distribución de semillas, proporciones del cuerpo humano. En trading, estas proporciones FUNCIONAN porque los grandes operadores las usan como referencia.`,
      type: "text"
    },
    {
      title: "Niveles de Fibonacci — Retrocesos",
      type: "table",
      headers: ["Nivel", "Porcentaje", "Uso Principal", "Fortaleza"],
      rows: [
        ["0.236", "23.6%", "Retroceso menor — tendencias muy fuertes", "Débil"],
        ["0.382", "38.2%", "Primer retroceso significativo — tendencias fuertes", "Media"],
        ["0.500", "50.0%", "Nivel psicológico (no es Fibonacci puro)", "Media-Alta"],
        ["0.618", "61.8%", "GOLDEN RATIO — zona de mayor probabilidad de rebote", "MUY ALTA ★★★★★"],
        ["0.705", "70.5%", "Segunda mitad del Golden Pocket", "Alta ★★★★"],
        ["0.786", "78.6%", "Retroceso profundo — casi invalidación", "Alta si hay confluencia"],
        ["0.886", "88.6%", "Zona extrema — última defensa antes del quiebre", "Alta solo con confluencia"],
      ]
    },
    {
      type: "infobox",
      variant: "key",
      label: "EL GOLDEN POCKET",
      text: "La zona entre 61.8% y 70.5% se llama GOLDEN POCKET. Es la zona de mayor probabilidad de rebote en todo el análisis técnico. Los institucionales la usan como zona principal de acumulación (en retrocesos alcistas) o distribución (en retrocesos bajistas). Si hay confluencia (EMA + soporte histórico + Golden Pocket), la probabilidad de éxito aumenta a 70-80%."
    },
    {
      title: "Extensiones de Fibonacci — Targets (TPs)",
      type: "table",
      headers: ["Extensión", "Porcentaje", "Uso como Target", "Cuando usarlo"],
      rows: [
        ["1.000", "100%", "Proyección al punto de origen", "TP conservador en trades pequeños"],
        ["1.272", "127.2%", "Primer target de extensión", "TP1 — salir 50-70% de la posición"],
        ["1.414", "141.4%", "Target medio", "TP2 moderado"],
        ["1.618", "161.8%", "GOLDEN EXTENSION — target principal", "TP2 o TP3 — el más respetado institucionalmente"],
        ["2.000", "200%", "Doble del movimiento", "Target amplio en tendencias fuertes"],
        ["2.618", "261.8%", "Extensión máxima normal", "TP final en altcoins en bull market"],
      ]
    },
    {
      title: "Cómo Medir Fibonacci Correctamente",
      type: "cards",
      cards: [
        { color: "#00e676", title: "En Tendencia ALCISTA", icon: "📈", text: "Mide desde el MÍNIMO (0%) hasta el MÁXIMO (100%). Los retrocesos dan zonas de COMPRA. El Golden Pocket (61.8%-70.5%) es tu zona de entrada long." },
        { color: "#ff1744", title: "En Tendencia BAJISTA", icon: "📉", text: "Mide desde el MÁXIMO (0%) hasta el MÍNIMO (100%). Los retrocesos dan zonas de VENTA. El Golden Pocket (61.8%-70.5%) es tu zona de entrada short." },
        { color: "#ffd700", title: "Mechas vs Cuerpos", icon: "🕯️", text: "Lo más común es usar las MECHAS (extremos absolutos) para el 0% y 100%. Sé CONSISTENTE con tu método. Algunos traders usan cuerpos de velas — elige uno y aplícalo siempre igual." },
        { color: "#00e5ff", title: "Mínimo Relevante vs Arbitrario", icon: "🎯", text: "Solo mide entre SWINGS RELEVANTES: el último swing low y el último swing high significativos. No mida desde cualquier movimiento — solo desde los swings que marcan la estructura de mercado." },
      ]
    },
    {
      title: "Fibonacci Multi-Timeframe (MTF)",
      body: `La técnica más poderosa: usar Fibonacci en DOS timeframes simultáneamente. Cuando el nivel 61.8% del timeframe diario coincide con el 61.8% del timeframe de 4H, esa zona tiene DOBLE PESO. Si además hay un Order Block o soporte histórico, la confluencia es extremadamente fuerte.`,
      type: "text"
    },
    {
      title: "Regla de las Confluencias",
      type: "table",
      headers: ["Número de Confluencias", "Probabilidad Estimada", "Tamaño de Posición", "Decisión"],
      rows: [
        ["1 sola (ej: solo Fibo 61.8%)", "~50-55%", "Mínimo (0.5% riesgo)", "Solo scalpers experimentados"],
        ["2 confluencias", "~60-65%", "Pequeño (0.5-1% riesgo)", "Entrada pequeña, confirmar más"],
        ["3 confluencias", "~70-75%", "Normal (1-1.5% riesgo)", "Entrada estándar ✓"],
        ["4+ confluencias", "~80-85%", "Mayor (1.5-2% riesgo)", "Alta convicción — A+ trade"],
      ]
    },
    {
      type: "infobox",
      variant: "tip",
      label: "FIBONACCI + ESTRUCTURA",
      text: "El nivel de Fibonacci más poderoso es el que coincide con un BOS (Break of Structure) o CHoCH. Cuando el precio hace un BOS alcista y luego retrocede al 61.8% de ese movimiento para crear un nuevo HL, esa entrada tiene probabilidad muy alta. Esto es el núcleo del ICT y del Smart Money Concept."
    }
  ]
},

"emas": {
  sections: [
    {
      type: "ema-chart",
      title: "EMAs en Acción — Cruces y Estructura",
    },
    {
      title: "Qué son las Medias Móviles",
      body: `Una media móvil suaviza el ruido del precio calculando el promedio de los últimos N períodos. La EMA (Exponential Moving Average) da más peso a los precios recientes, haciéndola más reactiva que la SMA. Las EMAs actúan como soportes y resistencias dinámicas.`,
      type: "text"
    },
    {
      title: "Las EMAs más Importantes",
      type: "table",
      headers: ["EMA", "Período", "Uso Principal", "Tipo de Trader"],
      rows: [
        ["EMA 9", "9 períodos", "Scalping, tendencia de muy corto plazo", "Scalper"],
        ["EMA 21", "21 períodos", "Soporte/resistencia dinámica intraday", "Day Trader / Swing"],
        ["EMA 50", "50 períodos", "Tendencia de mediano plazo, pivote clave", "Swing Trader"],
        ["EMA 100", "100 períodos", "Tendencia de mediano-largo plazo", "Swing/Posicional"],
        ["EMA 200", "200 períodos", "LA EMA MÁS IMPORTANTE. Divide mercado bull/bear", "Todos los traders"],
      ]
    },
    {
      type: "infobox",
      variant: "key",
      label: "LA EMA 200 — REGLA FUNDAMENTAL",
      text: "Si el precio está POR ENCIMA de la EMA 200 = SESGO ALCISTA. Compra en pullbacks. Si está POR DEBAJO = SESGO BAJISTA. Vende en rebotes. El cruce de la EMA 50 sobre la EMA 200 = Golden Cross (señal alcista de largo plazo). El cruce inverso = Death Cross (señal bajista de largo plazo)."
    },
    {
      title: "Golden Cross vs Death Cross",
      type: "cards",
      cards: [
        { color: "#ffd700", title: "Golden Cross ✨", icon: "⬆️", text: "La EMA 50 cruza POR ENCIMA de la EMA 200. Señal alcista de largo plazo. Históricamente precede períodos de subida sostenida. En Bitcoin: los Golden Cross en el ciclo de 4 años han coincidido con el inicio del bull market." },
        { color: "#ff1744", title: "Death Cross 💀", icon: "⬇️", text: "La EMA 50 cruza POR DEBAJO de la EMA 200. Señal bajista de largo plazo. En Bitcoin (2022): el Death Cross precedió la caída de $69K a $15K. El problema: son señales REZAGADAS — cuando aparecen, ya has perdido parte del movimiento." },
      ]
    },
    {
      title: "EMA Ribbon — El Semáforo de Tendencia",
      body: `El EMA Ribbon usa múltiples EMAs (8, 13, 21, 34, 55, 89, 144, 200) al mismo tiempo. Cuando todas están ordenadas de menor a mayor apuntando hacia arriba y el precio está encima = tendencia alcista fuerte. Cuando se cruzan entre sí = transición/indecisión. Cuando están ordenadas a la inversa = tendencia bajista fuerte.`,
      type: "text"
    },
    {
      title: "EMAs en el Sistema PSYCHOMETRIKS",
      type: "table",
      headers: ["Posición del Precio", "Lectura", "Bias", "Acción"],
      rows: [
        ["Sobre EMA 200 + Sobre EMA 50", "Tendencia alcista doble confirmada", "LARGO fuerte", "Solo trades LONG"],
        ["Sobre EMA 200 + Bajo EMA 50", "Pullback en tendencia alcista", "LARGO moderado", "Buscar entradas long en EMA 50"],
        ["Bajo EMA 200 + Bajo EMA 50", "Tendencia bajista doble confirmada", "CORTO fuerte", "Solo trades SHORT"],
        ["Bajo EMA 200 + Sobre EMA 50", "Rebote en tendencia bajista", "CORTO moderado", "Buscar entradas short en EMA 50"],
        ["Entre EMA 50 y 200", "Transición / indecisión", "NEUTRO", "Esperar ruptura clara"],
      ]
    },
    {
      type: "infobox",
      variant: "tip",
      label: "MEJOR USO PRÁCTICO",
      text: "No uses las EMAs como señal de entrada — úsalas para CONTEXTO y BIAS. La EMA 21 en el 4H es tu mejor amigo para day trading: si el precio está sobre ella con estructura alcista, busca compras en el pullback a la EMA. Si está bajo ella, busca ventas en el rebote. Simple y efectivo."
    }
  ]
},

"rsi": {
  sections: [
    {
      type: "rsi-chart",
      title: "RSI — Zonas de Sobrecompra y Sobreventa",
    },
    {
      title: "Qué es el RSI",
      body: `El RSI (Relative Strength Index) fue desarrollado por J. Welles Wilder en 1978. Es un oscilador de momentum que mide la velocidad y magnitud de los cambios de precio, expresado en una escala de 0 a 100. Indica qué tan fuerte está comprando o vendiendo el mercado en relación a su historia reciente.`,
      type: "text"
    },
    {
      title: "Fórmula y Parámetros",
      type: "formula",
      text: `RSI = 100 - [100 / (1 + RS)]
RS = Promedio de ganancias en N períodos / Promedio de pérdidas en N períodos
Período estándar: 14 períodos
RSI > 70 = SOBRECOMPRA (el precio subió muy rápido)
RSI < 30 = SOBREVENTA (el precio cayó muy rápido)`
    },
    {
      title: "Zonas del RSI",
      type: "table",
      headers: ["Zona RSI", "Descripción", "Acción Común", "Error Frecuente"],
      rows: [
        ["80-100", "Sobrecompra extrema", "Buscar señales de agotamiento", "Vender por el número — el RSI puede mantenerse alto en tendencias fuertes"],
        ["70-80", "Sobrecompra moderada", "Estar alerta para posibles reversiones", "Igual — en tendencias el RSI se 'queda pegado' arriba"],
        ["50-70", "Zona alcista", "Mantener posiciones largas, sesgo comprador", "Vender prematuramente"],
        ["50", "Línea central", "Zona de equilibrio y cambio de sesgo", "Ignorarla — el cruce del 50 es señal de cambio de tendencia"],
        ["30-50", "Zona bajista", "Mantener posiciones cortas, sesgo vendedor", "Comprar prematuramente"],
        ["20-30", "Sobreventa moderada", "Estar alerta para posibles rebotes", "Comprar por el número — en tendencias bajistas puede mantenerse bajo"],
        ["0-20", "Sobreventa extrema", "Buscar señales de capitulación y fondo", "Igual"],
      ]
    },
    {
      title: "Divergencias — La Señal Más Poderosa del RSI",
      type: "cards",
      cards: [
        { color: "#00e676", title: "Divergencia Alcista Regular", icon: "⬆️", text: "El precio hace mínimos MÁS BAJOS pero el RSI hace mínimos MÁS ALTOS. Significa: el precio está cayendo pero con cada vez menos fuerza vendedora. Precede reversiones alcistas. Más confiable en soporte/Fibonacci." },
        { color: "#ff1744", title: "Divergencia Bajista Regular", icon: "⬇️", text: "El precio hace máximos MÁS ALTOS pero el RSI hace máximos MÁS BAJOS. Significa: el precio sube pero con cada vez menos fuerza compradora. Precede reversiones bajistas. Más confiable en resistencia/Fibonacci." },
        { color: "#ffd700", title: "Divergencia Alcista Oculta", icon: "🔍", text: "El precio hace mínimos MÁS ALTOS pero el RSI hace mínimos MÁS BAJOS. Señal de CONTINUACIÓN alcista — los compradores siguen activos aunque el RSI retroceda." },
        { color: "#e040fb", title: "Divergencia Bajista Oculta", icon: "🔍", text: "El precio hace máximos MÁS BAJOS pero el RSI hace máximos MÁS ALTOS. Señal de CONTINUACIÓN bajista — los vendedores siguen activos." },
      ]
    },
    {
      type: "infobox",
      variant: "warn",
      label: "RSI EN TENDENCIAS FUERTES",
      text: "En tendencias muy fuertes (Bitcoin en bull market) el RSI puede mantenerse entre 60-90 por semanas o meses. NO vendas solo porque el RSI esté en 80. El RSI en sobrecompra en tendencia alcista es NORMAL y puede continuar subiendo. La divergencia bajista + resistencia es lo que necesitas para anticipar el techo."
    },
    {
      title: "RSI Macro vs Micro",
      body: `En el sistema PSYCHOMETRIKS se usa el RSI en dos timeframes: el RSI MACRO (timeframe diario o semanal) define el sesgo general del mercado. El RSI MICRO (4H o 1H) da la señal de entrada. Cuando el RSI macro está sobre 50 y el RSI micro está en sobreventa, eso es una entrada long de alta probabilidad en la tendencia macro.`,
      type: "text"
    }
  ]
},

"sesiones": {
  sections: [
    {
      type: "session-chart",
      title: "Sesiones de Trading — Reloj Global 24h",
    },
    {
      title: "Las 4 Sesiones del Mercado Global",
      body: `El mercado forex y crypto opera globalmente las 24 horas. Sin embargo, la actividad y liquidez NO son uniformes. Se divide en 4 sesiones principales que corresponden a los mayores centros financieros del mundo. La diferencia entre operar en una sesión activa vs inactiva puede ser la diferencia entre ganar o perder.`,
      type: "text"
    },
    {
      title: "Horarios de Sesiones (UTC)",
      type: "table",
      headers: ["Sesión", "Hora UTC", "Hora MEX (CST)", "Hora ARG/CHI (ART)", "Liquidez"],
      rows: [
        ["🌏 ASIA / TOKYO", "00:00 - 09:00", "18:00 - 03:00", "21:00 - 06:00", "Media — Baja"],
        ["🇬🇧 LONDON OPEN", "07:00 - 08:00", "01:00 - 02:00", "04:00 - 05:00", "Muy Alta"],
        ["🇬🇧 LONDON (pico)", "08:00 - 12:00", "02:00 - 06:00", "05:00 - 09:00", "Extrema"],
        ["⚡ OVERLAP L+NY", "12:00 - 17:00", "06:00 - 11:00", "09:00 - 14:00", "MÁXIMA"],
        ["🇺🇸 NEW YORK (pico)", "13:00 - 17:00", "07:00 - 11:00", "10:00 - 14:00", "Extrema"],
        ["🇺🇸 NEW YORK (tarde)", "17:00 - 21:00", "11:00 - 15:00", "14:00 - 18:00", "Alta"],
        ["🌙 OFF SESSION", "21:00 - 00:00", "15:00 - 18:00", "18:00 - 21:00", "Baja"],
      ]
    },
    {
      title: "Características de Cada Sesión",
      type: "cards",
      cards: [
        { color: "#00e5ff", title: "🌏 Sesión Asia", icon: "⭐", text: "Baja liquidez = movimientos contenidos. El precio suele ACUMULAR o crear rangos que luego se rompen en London. El ATH y ATL asiáticos (Asian High / Asian Low) son niveles clave de liquidez que London y NY van a buscar. Ideal para: posicionar órdenes limit, no para scalping." },
        { color: "#ff6d00", title: "🇬🇧 London Open (Kill Zone)", icon: "🔥", text: "Apertura más violenta del día. Los algoritmos institucionales londinenses activan sus estrategias. Suele ir a BUSCAR liquidez: ya sea el Asian High (para hacer un fake y caer) o el Asian Low (para hacer un fake y subir). La trampa de apertura (Judas Swing) es muy común aquí." },
        { color: "#00e676", title: "🇺🇸 New York Open (Kill Zone)", icon: "🚀", text: "Segunda apertura más violenta. Con el overlap London-NY (12-17 UTC) se produce el mayor volumen del día. Es cuando se dan los movimientos más grandes y cuando la dirección real del día suele confirmarse. El precio de apertura de NY (9:30 EST en acciones) es crítico." },
        { color: "#ffd700", title: "⚡ Overlap London-NY", icon: "👑", text: "EL MEJOR MOMENTO PARA TRADEAR. 12:00-17:00 UTC. Ambos mercados están abiertos simultáneamente. El volumen es máximo. Los movimientos son más claros y rápidos. En PSYCHOMETRIKS, esta kill zone tiene el mayor peso en el score." },
      ]
    },
    {
      title: "¿Qué pasa en Cada Sesión con Crypto?",
      type: "table",
      headers: ["Sesión", "Patrón Frecuente", "Estrategia"],
      rows: [
        ["Asia (00-09 UTC)", "Rango o acumulación silenciosa. Precios relativamente estables.", "Identificar Asian High/Low. Poner órdenes limit para London."],
        ["London Open (07-09 UTC)", "Ruptura del rango asiático. A veces FALSA ruptura (Judas Swing)", "Esperar confirmación de la dirección. No entrar en la primera vela."],
        ["London (09-12 UTC)", "Tendencia establecida. Continuación o reversión del Judas Swing.", "Seguir la tendencia establecida en entradas en pullback."],
        ["Overlap (12-17 UTC)", "Movimiento más grande del día. Confirmación o ruptura de London.", "MEJOR momento — mayor liquidez = menor manipulación."],
        ["NY Tarde (17-21 UTC)", "Corrección del movimiento del día o consolidación.", "Cerrar posiciones intraday. Preparar swings."],
        ["Off Session (21-00 UTC)", "Baja volatilidad. Riesgo de 'stop hunting' algorítmico.", "No operar. Esperar Asia."],
      ]
    },
    {
      title: "El Judas Swing — La Trampa de Liquidez",
      body: `El Judas Swing es un patrón frecuente en London Open y NY Open. Funciona así: el precio va primero en la DIRECCIÓN EQUIVOCADA, tomando los stops y atrayendo a traders en la dirección falsa, para luego REVERTIR violentamente en la dirección real. El smart money usa esta "trampa" para acumular/distribuir posiciones con mejor precio.`,
      type: "text"
    },
    {
      type: "infobox",
      variant: "key",
      label: "KILL ZONES PSYCHOMETRIKS",
      text: `London Kill Zone: 07:00-09:00 UTC — barrida de liquidez, inicio de dirección
London/NY Overlap: 12:00-17:00 UTC — MÁXIMA LIQUIDEZ ⚡PREMIUM
NY Open: 13:00-16:00 UTC — confirmación de movimiento del día
Nota: En crypto los horarios tienen menos rigidez que en forex, pero los patrones se mantienen porque los mismos algoritmos institucionales operan ambos mercados.`
    }
  ]
}

};
