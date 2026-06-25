import type { AulaModuleContent } from "../types";

export const contentN6N7: Record<string, AulaModuleContent> = {
// ─── NIVEL 6 ──────────────────────────────────────────────────────────────────

"elliott-waves": {
  sections: [
    {
      type: "elliott-wave-chart",
      title: "Ondas de Elliott — Estructura 5-3 Visual",
    },
    {
      title: "La Teoría de Ondas de Elliott",
      body: `Ralph Nelson Elliott (1871–1948) descubrió que los mercados se mueven en patrones repetitivos de 5 ondas en la dirección de la tendencia y 3 ondas de corrección. Estos patrones se repiten en todos los timeframes — son fractales. Su descubrimiento fue: los mercados son fractales emocionales, no caóticos.`,
      type: "text"
    },
    {
      title: "El Patrón Fundamental 5-3",
      type: "cards",
      cards: [
        { color: "#00e676", title: "Ondas de Impulso (1-2-3-4-5)", icon: "🚀", text: "5 ondas en dirección de la tendencia principal. Ondas 1, 3, 5 = impulso (dirección). Ondas 2, 4 = corrección. La onda 3 NUNCA puede ser la más corta. La onda 4 nunca puede superponerse con la onda 1 (excepto en triángulos y diagonales)." },
        { color: "#ff1744", title: "Ondas Correctivas (A-B-C)", icon: "🔄", text: "3 ondas contra la tendencia principal. A = primera onda bajista. B = rebote (trampa para alcistas). C = onda bajista final que suele superar el mínimo de A. El fin de la onda C es la zona de compra." },
      ]
    },
    {
      title: "Reglas Inquebrantables de Elliott",
      type: "table",
      headers: ["Regla", "Descripción", "Si se viola..."],
      rows: [
        ["Regla 1", "La onda 2 NUNCA puede retroceder más del 100% de la onda 1", "No es onda 2 — reconteo necesario"],
        ["Regla 2", "La onda 3 NUNCA puede ser la más corta de las ondas 1, 3 y 5", "No es onda 3 — estructura diferente"],
        ["Regla 3", "La onda 4 no puede entrar en el territorio de la onda 1", "No es onda 4 (excepto en diagonales)"],
      ]
    },
    {
      title: "Fibonacci en Elliott Waves",
      type: "table",
      headers: ["Onda", "Retroceso/Extensión Típica", "Fibonacci Clave"],
      rows: [
        ["Onda 2 (retroceso)", "50-78.6% de la Onda 1", "61.8% es el más común"],
        ["Onda 3 (extensión)", "161.8%-261.8% de la Onda 1", "161.8% es el objetivo mínimo"],
        ["Onda 4 (retroceso)", "23.6%-50% de la Onda 3", "38.2% es el más común"],
        ["Onda 5 (extensión)", "61.8%-100% de la Onda 1 (igualidad)", "100% = igualdad con onda 1"],
        ["Onda A (corrección ABC)", "Primer tramo bajista", "Mínimo la onda 4 de la estructura anterior"],
        ["Onda B (corrección ABC)", "50-78.6% de la onda A", "Trampa para alcistas"],
        ["Onda C (corrección ABC)", "100-161.8% de la onda A", "161.8% = el target más frecuente"],
      ]
    },
    {
      title: "Tipos de Correcciones Complejas",
      type: "cards",
      cards: [
        { color: "#00e5ff", title: "Zigzag (5-3-5)", icon: "⚡", text: "La corrección más común. A=5 ondas, B=3 ondas, C=5 ondas. Sharp y rápida. La onda B es pequeña. Típica corrección de onda 2." },
        { color: "#ffd700", title: "Flat (3-3-5)", icon: "↔️", text: "Corrección lateral. A=3, B=3 (casi hasta el origen), C=5. La B retrocede casi el 100% de A. Típica de onda 4 o en mercados fuertes." },
        { color: "#e040fb", title: "Triángulo (3-3-3-3-3)", icon: "△", text: "5 segmentos de 3 ondas comprimiéndose. Siempre ocurre en onda 4, B, o X. El precio rompe en la dirección de la tendencia con fuerza al final (thrust). El thrust = 75% del ancho máximo del triángulo." },
        { color: "#ff6d00", title: "Doble/Triple Zigzag (WXY)", icon: "〽️", text: "Dos o tres patrones correctivos conectados por onda X. Las correcciones más complejas y largas. Pueden confundir incluso a expertos en Elliott." },
      ]
    },
    {
      type: "infobox",
      variant: "warn",
      label: "HONESTIDAD SOBRE ELLIOTT",
      text: "Las Ondas de Elliott son subjetivas — dos analistas pueden contar las mismas ondas de forma diferente. El mismo gráfico puede tener 3-5 conteos válidos. Úsalas como CONTEXTO (para saber en qué fase del ciclo macro estás) no como sistema de entrada precisa. Combínalas con SMC y Fibonacci para afinar."
    },
    {
      title: "Diagonales — Patrones Especiales de Elliott",
      type: "cards",
      cards: [
        { color: "#00e5ff", title: "Diagonal Inicial (Onda 1 o A)", icon: "↗️", text: "Aparece en la primera onda de un nuevo movimiento. Tiene forma de cuña convergente (5 ondas en zigzag). La onda 4 SE SUPERPONE con la onda 1 (único caso permitido). Es señal de movimiento explosivo tras su finalización." },
        { color: "#ffd700", title: "Diagonal Terminal (Onda 5 o C)", icon: "📐", text: "Aparece al FINAL de una tendencia. Forma de cuña convergente. Las 5 sub-ondas son todas zigzags (3-3-3-3-3). Señal de agotamiento de tendencia. Tras finalizar, el precio revierte bruscamente (al menos hasta el inicio de la diagonal)." },
        { color: "#e040fb", title: "Extensión de Ondas", icon: "🔭", text: "En un impulso alcista, una de las tres ondas impulsivas (1, 3 o 5) suele extenderse. La más común: Onda 3 extendida (Onda 3 es la más larga). En mercados de tendencia fuerte, la onda 5 puede extenderse. La extensión tiene sub-ondas más visibles — busca el conteo dentro de ella." },
      ]
    },
    {
      title: "Elliott en Práctica — Flujo de Trabajo",
      type: "table",
      headers: ["Paso", "Acción", "Timeframe", "Objetivo"],
      rows: [
        ["1. Identificar ciclo mayor", "Contar las ondas desde el último gran fondo o techo", "Semanal / Mensual", "Saber si estás en onda 1-5 (impulso) o A-B-C (corrección)"],
        ["2. Localizar la onda actual", "¿En qué onda estás ahora? ¿Impulso o corrección?", "Diario / 4H", "Sesgo alcista (ondas 1,3,5) o bajista (A,C) o neutro (2,4,B)"],
        ["3. Calcular targets Fibonacci", "Extensiones para impulsos, retrocesos para correcciones", "4H / 1H", "Determinar dónde termina probablemente la onda actual"],
        ["4. Buscar invalidación", "Definir el nivel que demostraría que tu conteo está mal", "1H / 4H", "Stop Loss conceptual del escenario Elliott"],
        ["5. Confirmar con SMC", "¿Hay Order Block, FVG o zona de liquidez en el target?", "1H / 15min", "Alta confluencia = entrada de alta probabilidad"],
      ]
    }
  ]
},

"ict": {
  sections: [
    {
      type: "ob-fvg-chart",
      title: "ICT — Order Blocks y Fair Value Gaps",
    },
    {
      type: "sweep-destroy",
      title: "ICT — Sweep & Destroy de Liquidez",
    },
    {
      title: "ICT — Inner Circle Trader",
      body: `ICT es el sistema de trading desarrollado por Michael J. Huddleston (también conocido como Inner Circle Trader). Ha formado gratuitamente a miles de traders desde 2010. Su método combina conceptos de Smart Money con modelos de precio algorítmico institucional (IPDA). Es posiblemente el sistema más completo disponible públicamente.`,
      type: "text"
    },
    {
      title: "Conceptos Clave de ICT",
      type: "cards",
      cards: [
        { color: "#00e5ff", title: "PD Arrays (Premium/Discount)", icon: "⚖️", text: "Herramientas de precio (Order Blocks, FVGs, Breaker Blocks, Rejection Blocks, Propulsion Blocks). Cada una es un área de 'interés algorítmico'. El precio es ENTREGADO por algoritmos institucionales (IPDA) a estas zonas." },
        { color: "#ffd700", title: "Killzones ICT", icon: "⚡", text: "London Open (02:00-05:00 EST), New York AM (07:00-10:00 EST), NY PM (13:30-16:00 EST), London Close (10:00-12:00 EST). Momentos donde los algoritmos institucionales son más activos. La mayoría de setups ICT ocurren en estas ventanas." },
        { color: "#00e676", title: "Judas Swing / False Move", icon: "🎣", text: "Al inicio de cada killzone, el precio suele ir PRIMERO en la dirección equivocada para tomar liquidez (barrida de stops), luego revierte en la dirección real. Este movimiento falso es el 'Judas Swing'. Operar en contra de él = trade de alta probabilidad." },
        { color: "#e040fb", title: "NWOG / NDOG", icon: "📅", text: "New Week Opening Gap: el gap entre el cierre del viernes y apertura del lunes. New Day Opening Gap: gap entre sesiones en futuros. El precio tiene tendencia a regresar a estos gaps antes de continuar la tendencia. Son zonas de alto imán de precio." },
      ]
    },
    {
      title: "El Modelo ICT 2022 — Setup Completo",
      type: "table",
      headers: ["Paso", "Descripción", "TF a usar"],
      rows: [
        ["1. Contexto HTF", "Definir si el precio está en Premium o Discount del rango HTF (IPDA 40 días)", "Semanal / Diario"],
        ["2. Liquidity Level", "Identificar el pool de liquidez más cercano (equal highs/lows, PDH/PDL, PWH/PWL)", "Diario / 4H"],
        ["3. Esperar Killzone", "Solo tradear en London Open o NY Open (7-10am EST)", "1H"],
        ["4. Judas Swing", "Observar el movimiento inicial de la killzone — es contrario a la dirección real", "15min"],
        ["5. PD Array Entry", "Buscar Order Block o FVG en el punto de reversión del Judas Swing", "5min / 1min"],
        ["6. BOS en LTF", "Confirmar CHoCH/BOS en dirección de la distribución esperada", "1min"],
        ["7. Target", "Pool de liquidez opuesto: si rompió SSL → target BSL (máximos previos)", "4H / Diario"],
      ]
    },
    {
      type: "infobox",
      variant: "pro",
      label: "ICT EN CRYPTO",
      text: "ICT fue desarrollado para forex, pero sus principios se aplican perfectamente a crypto porque los mismos algoritmos y bancos que manejan forex son los que ahora participan en crypto (CME, Goldman, JPMorgan). Los horarios de killzone en UTC son los mismos. Los PD Arrays funcionan en cualquier mercado líquido. Ajuste: en crypto usar el rango de SESIONES en lugar de sesiones forex. El Judas Swing de London Open es especialmente confiable en BTC."
    },
    {
      title: "SMT Divergence — Smart Money Technique",
      body: `La SMT (Smart Money Technique) Divergence es una de las herramientas más poderosas de ICT. Compara dos activos correlacionados (BTC vs ETH, EURUSD vs GBPUSD, SPX vs NQ). Si ambos deberían hacer nuevos mínimos pero uno NO lo hace, hay divergencia = señal de reversión. El activo que NO hace el nuevo mínimo (o máximo) tiene mayor fortaleza relativa.`,
      type: "text"
    },
    {
      title: "SMT Divergence — Casos de Uso",
      type: "table",
      headers: ["Activo A", "Activo B", "Señal", "Interpretación", "Acción"],
      rows: [
        ["BTC hace nuevo mínimo", "ETH NO hace nuevo mínimo", "SMT alcista en ETH", "ETH más fuerte — capital rotando a ETH", "Long ETH con SL bajo el mínimo de BTC"],
        ["ETH hace nuevo mínimo", "BTC NO hace nuevo mínimo", "SMT alcista en BTC", "BTC más fuerte — posible liderazgo BTC", "Long BTC con SL bajo el mínimo de ETH"],
        ["SPX hace nuevo máximo", "NQ (NASDAQ) NO lo hace", "SMT bajista en SPX", "Mercado débil — solo el SPX llega al máximo", "Precaución con longs — divergencia de debilidad"],
        ["EURUSD hace nuevo mínimo", "GBPUSD NO lo hace", "SMT alcista en forex", "Dólar perdiendo fuerza vs libra — corrección DXY próxima", "Long GBPUSD o reducir shorts en crypto"],
      ]
    },
    {
      title: "ICT PD Arrays — Jerarquía de Importancia",
      type: "cards",
      cards: [
        { color: "#00e5ff", title: "Order Blocks (OB)", icon: "🧱", text: "La última vela opuesta antes de un movimiento impulsivo institucional. OB alcista: última vela roja antes de un impulso alcista fuerte. OB bajista: última vela verde antes de un impulso bajista fuerte. El precio tiende a regresar a mitigar el OB antes de continuar la tendencia." },
        { color: "#ffd700", title: "Fair Value Gaps (FVG / Imbalance)", icon: "⚡", text: "Gap de precio creado por movimiento rápido donde no hay operaciones (el precio pasó pero nadie compró/vendió allí). El precio tiende a regresar a 'cerrar' el FVG para equilibrar el mercado. FVG en dirección de tendencia HTF = zona de entrada de alta probabilidad." },
        { color: "#e040fb", title: "Breaker Blocks", icon: "💥", text: "Un Order Block que FALLÓ — el precio lo rompió. Después de la ruptura, ese OB fallido se convierte en Breaker Block y actúa en DIRECCIÓN OPUESTA (soporte roto = resistencia, resistencia rota = soporte). Son zonas de alta confianza porque el mercado ya probó y rompió ese nivel." },
        { color: "#00e676", title: "Propulsion Blocks", icon: "🚀", text: "Zona de consolidación inmediatamente antes de un impulso. El mercado acumula energía (compresión de precio) y luego explota. El precio regresa al Propulsion Block para recargar antes del siguiente impulso. Similar al OB pero con forma de consolidación en lugar de una sola vela." },
      ]
    }
  ]
},

"gann": {
  sections: [
    {
      type: "gann-chart",
      title: "Gann — Ángulos y Cuadrados de Precio/Tiempo",
    },
    {
      title: "W.D. Gann — El Maestro del Tiempo y Precio",
      body: `William Delbert Gann (1878–1955) fue un trader legendario que afirmaba haber logrado retornos de hasta 1,000% en un año. Desarrolló un sistema basado en geometría, ciclos de tiempo, astronomía y matemáticas. Su trabajo es el más esotérico del análisis técnico, pero con elementos prácticos muy poderosos.`,
      type: "text"
    },
    {
      title: "El Cuadrado de 9 de Gann",
      body: `El Cuadrado de 9 es una espiral numérica donde los números están dispuestos en cuadrados concéntricos. Los números en los ejes cardinales y diagonales (45°, 90°, 135°, 180°, 225°, 270°, 315°, 360°) tienen relaciones especiales. Para cualquier precio, los niveles en 90°, 180°, 270° y 360° son soportes/resistencias naturales.`,
      type: "text"
    },
    {
      title: "Ángulos de Gann",
      type: "table",
      headers: ["Ángulo", "Relación Tiempo/Precio", "Significado"],
      rows: [
        ["1x1 (45°)", "1 unidad de precio por 1 unidad de tiempo", "EL MÁS IMPORTANTE. Si el precio está sobre él = bullish. Bajo = bearish."],
        ["2x1", "2 unidades precio / 1 tiempo", "Tendencia alcista fuerte"],
        ["1x2", "1 unidad precio / 2 tiempo", "Tendencia alcista débil"],
        ["4x1", "4 unidades precio / 1 tiempo", "Impulso extremo"],
        ["1x4", "1 unidad precio / 4 tiempo", "Distribución/acumulación lenta"],
      ]
    },
    {
      title: "Gann Fan",
      body: `El Gann Fan dibuja múltiples ángulos desde un máximo o mínimo significativo. El ángulo 1x1 es el pivote. Si el precio cruza por debajo del ángulo 1x1, caerá hasta el 2x1. Si cruza el 2x1, irá al 3x1, etc. Cada ángulo roto es soporte/resistencia previo convertido en nuevo nivel.`,
      type: "text"
    },
    {
      type: "infobox",
      variant: "warn",
      label: "USO PRÁCTICO DE GANN",
      text: "Gann es el sistema más complejo y más subjetivo. Requiere años para dominarlo. Uso práctico: Cuadrado de 9 para niveles de precio (muy respetados en SPX y Oro). Ciclos de tiempo de Gann para anticipar cambios de tendencia (90, 120, 144, 180, 360 días de un máximo/mínimo). El resto es demasiado complejo para uso cotidiano — es un sistema de estudio, no de trading activo para principiantes."
    },
    {
      title: "Ciclos de Tiempo de Gann — Los Números Clave",
      type: "table",
      headers: ["Ciclo Gann", "Días desde máximo/mínimo", "Significado", "Aplicación en BTC"],
      rows: [
        ["Cuadrado del 90", "90 días", "Un cuarto del año — cambio de tendencia frecuente", "Contar 90 días desde un ATH o fondo importante"],
        ["Cuadrado del 144", "144 días", "Número Fibonacci — resonancia especial", "BTC ha respetado múltiples tops/bottoms en 144d"],
        ["Cuadrado del 180", "180 días", "Mitad del año — punto medio de ciclo", "Halving ±180 días suele coincidir con cambios"],
        ["Cuadrado del 360", "360 días", "Un año completo — ciclo mayor", "Máximos y mínimos de ciclo 12 meses después"],
        ["Cuadrado del 52", "52 semanas", "Año de 52 semanas — ciclo anual", "Cada 52 semanas el mercado suele girar"],
        ["Cuadrado del 7", "7, 14, 21, 28 días", "Ciclos semanales — movimientos intraday", "BTC muestra tendencia a girar en múltiplos de 7d"],
      ]
    },
    {
      title: "Gann Grid y Soporte/Resistencia Natural",
      body: `El Gann Grid es una cuadrícula de líneas a 45° que divide el precio y el tiempo en partes iguales. Los cruces de líneas del grid son puntos de soporte/resistencia natural. En TradingView: busca "Gann Grid" en las herramientas de dibujo. Coloca el punto de inicio en un máximo o mínimo significativo y calibra el tamaño del grid según la volatilidad del activo.`,
      type: "text"
    },
    {
      title: "Combinando Gann con Metodologías Modernas",
      type: "cards",
      cards: [
        { color: "#7c4dff", title: "Gann + Fibonacci", icon: "🌀", text: "Los niveles del Cuadrado de 9 de Gann y los niveles de Fibonacci suelen coincidir en los mismos precios. Cuando un nivel Fibonacci (61.8%, 161.8%) coincide con un nivel Gann (90°, 180° del Cuadrado de 9), la confluencia es extremadamente poderosa. Especialmente en SPX y Oro." },
        { color: "#00e5ff", title: "Gann + Ciclos BTC", icon: "₿", text: "Los ciclos de tiempo de Gann (90, 144, 180 días) aplicados al halving de Bitcoin muestran patrones notables. El fondo del bear market de 2018 fue 364 días después del ATH de 2017. El fondo de 2022 fue ~365 días después del ATH de 2021. La geometría temporal de Gann encuentra eco en los ciclos de Bitcoin." },
        { color: "#ffd700", title: "Gann + SMC", icon: "🏦", text: "Usa Gann para determinar CUÁNDO (tiempo) y SMC para determinar DÓNDE (precio). Si el tiempo de Gann indica un cambio en 90 días y hay un Order Block HTF en ese nivel de precio, la confluencia tiempo-precio de Gann con el OB institucional crea el setup perfecto." },
      ]
    }
  ]
},

// ─── NIVEL 7 ──────────────────────────────────────────────────────────────────

"risk-management": {
  sections: [
    {
      type: "risk-reward-chart",
      title: "Risk/Reward — La Matemática del Trading",
    },
    {
      title: "La Base de Todo — Sobrevivir",
      body: `El trading no es sobre cuánto puedes ganar. Es sobre cuánto puedes SOBREVIVIR cuando te equivocas. Y te vas a equivocar — el 40-50% de los trades de los mejores traders son pérdidas. La diferencia entre un trader ganador y un perdedor es la gestión de riesgo: el ganador pierde poco y gana mucho.`,
      type: "text"
    },
    {
      title: "Regla de Riesgo por Trade",
      type: "cards",
      cards: [
        { color: "#00e676", title: "Regla del 1-2%", icon: "🛡️", text: "Nunca arriesgues más del 1-2% de tu capital total en un solo trade. Con esta regla puedes tener 50 trades perdedores consecutivos y aún tener capital para operar. Con el 10% por trade, solo 10 pérdidas seguidas te liquidan." },
        { color: "#ff1744", title: "Regla del 5% Diario", icon: "🚫", text: "Si pierdes el 5% de tu capital en un día, PARA de operar. Revenge trading (operar para recuperar pérdidas rápido) es la causa número 1 de cuentas liquidadas. El mercado estará mañana." },
        { color: "#ffd700", title: "Regla del 10% Mensual", icon: "📊", text: "Si tu drawdown mensual llega al 10%, reduce el tamaño de tus posiciones a la mitad por el resto del mes. Si llega al 15%, para completamente. Protege el capital sobre todo." },
        { color: "#e040fb", title: "Regla del 3-5-7", icon: "📐", text: "3% riesgo máximo por sector/activo correlacionado. 5% exposición total en trades intraday activos. 7% drawdown máximo antes de parar y revisar. Tres niveles de protección." },
      ]
    },
    {
      title: "Risk:Reward (R:R) — La Clave de la Rentabilidad",
      body: `El R:R es la relación entre el riesgo que tomas (distancia al Stop Loss) y la recompensa que buscas (distancia al Take Profit). Con un R:R de 3:1 solo necesitas ganar el 25% de tus trades para ser rentable.`,
      type: "text"
    },
    {
      title: "Tabla de Win Rate vs R:R necesario",
      type: "table",
      headers: ["R:R", "Win Rate para Break Even", "Win Rate para ser Rentable", "Conclusión"],
      rows: [
        ["1:1", "50%", ">53%", "No recomendado — necesitas ser muy preciso"],
        ["2:1", "33%", ">36%", "Mínimo aceptable"],
        ["3:1", "25%", ">28%", "Bueno — permite equivocarse mucho y ganar"],
        ["5:1", "16.7%", ">19%", "Excelente — para setups A+"],
        ["10:1", "9.1%", ">11%", "Extraordinario — solo para setups premium"],
      ]
    },
    {
      title: "Cálculo del Tamaño de Posición",
      type: "formula",
      text: `TAMAÑO DE POSICIÓN:
Capital = $10,000
Riesgo por trade = 1% = $100
Stop Loss = 3% del precio (ej: BTC a $50,000 → SL a $48,500 = $1,500 distancia)
Tamaño = Riesgo / Distancia al SL = $100 / $1,500 = 0.0667 BTC

Con esta posición, si el SL se activa pierdes exactamente $100 (1% del capital).
Si el TP está a 3% de distancia (R:R 1:1) = ganancia $100.
Si el TP está a 9% (R:R 3:1) = ganancia $300.`
    },
    {
      title: "Kelly Criterion — Tamaño Óptimo de Posición",
      type: "formula",
      text: `Fórmula Kelly: f = (p × b - q) / b
f = porcentaje del capital a arriesgar
p = probabilidad de ganar (ej: 0.55 = 55%)
b = R:R (ej: 2 para R:R 2:1)
q = probabilidad de perder = 1 - p

Ejemplo: p=0.55, R:R=2:1 (b=2)
f = (0.55 × 2 - 0.45) / 2 = (1.1 - 0.45) / 2 = 0.65 / 2 = 32.5%

En la práctica: usa MEDIO KELLY (16.25%) como máximo.
La fórmula asume certeza en las probabilidades — en trading úsala como guía, no como regla exacta.`
    },
    {
      type: "infobox",
      variant: "danger",
      label: "LOS 4 PECADOS CAPITALES DEL RISK MANAGEMENT",
      text: `1. MOVER EL STOP LOSS: El SL está donde está porque el mercado te demostraría que estabas equivocado. Moverlo es autoengaño.
2. REVENGE TRADING: Doblar el tamaño después de una pérdida. Matemáticamente destructivo.
3. OVERTRADING: Más trades = más fees + más errores emocionales. Menos es más.
4. PROMEDIAR A LA BAJA: "Promedio" más cuando el trade va en mi contra. En tendencias, el precio puede seguir yendo en tu contra semanas. Liquida tu error, no lo agrandas.`
    },
    {
      title: "Gestión de Portafolio Multi-Activo — Correlaciones",
      body: `Si tienes simultáneamente un long en BTC y un long en ETH, NO tienes 2 trades independientes — tienes 2 trades MUY correlacionados. Si BTC cae, ETH también cae (correlación 0.8+). Tu riesgo real es mucho mayor del que crees. El riesgo por portafolio debe calcularse teniendo en cuenta las correlaciones entre posiciones.`,
      type: "text"
    },
    {
      title: "Correlaciones entre Activos — Riesgo Real por Exposición",
      type: "table",
      headers: ["Par de activos", "Correlación típica", "Riesgo combinado", "Cómo mitigarlo"],
      rows: [
        ["BTC + ETH", "0.80–0.95", "Casi sin diversificación en crypto bear", "Considera solo uno a la vez, o reduce tamaño total"],
        ["BTC + Altcoins", "0.70–0.90", "Altcoins caen más rápido que BTC en crisis", "Diversifica entre uncorrelated narratives (AI, RWA, Gaming)"],
        ["BTC + SPX", "0.30–0.70 variable", "Alta en crisis, baja en tendencias independientes", "Monitorear correlación semanal — cambia con el contexto"],
        ["BTC + Oro", "0.10–0.30", "Buena diversificación real", "Posición en oro puede actuar como hedge de BTC"],
        ["BTC + DXY", "−0.30 a −0.60", "Correlación inversa — DXY sube, BTC baja", "Si tienes long BTC y DXY está subiendo, riesgo elevado"],
        ["Long BTC + Short ETH/BTC", "Negativa artificial", "Neutral al mercado — captura la diferencia de rendimiento", "Estrategia 'pair trading' avanzada — neutral delta"],
      ]
    },
    {
      title: "Drawdown Recovery — La Matemática Cruel",
      type: "formula",
      text: `El drawdown es ASIMÉTRICO: perder duele MÁS matemáticamente de lo que parece.

Si pierdes el 10% → necesitas ganar 11.1% para recuperar
Si pierdes el 20% → necesitas ganar 25% para recuperar
Si pierdes el 33% → necesitas ganar 50% para recuperar
Si pierdes el 50% → necesitas ganar 100% para recuperar
Si pierdes el 75% → necesitas ganar 300% para recuperar
Si pierdes el 90% → necesitas ganar 900% para recuperar

CONCLUSIÓN: Proteger el capital (evitar grandes drawdowns) es MUCHO más valioso que maximizar las ganancias. Un sistema con Profit Factor 1.5 que nunca pierde más del 15% supera a largo plazo a un sistema con PF 2.0 que ocasionalmente sufre drawdowns del 50%.`
    },
    {
      title: "Sistema de Stops Escalonados — Gestión Dinámica",
      type: "cards",
      cards: [
        { color: "#00e676", title: "Break Even Stop", icon: "🔒", text: "Cuando el trade va a tu favor 1R (gana tanto como arriesgaste), mueve el SL al precio de entrada. Ahora el trade no puede perder. Psicológicamente libera para dejar correr la ganancia sin miedo. Aplica cuando el precio ha confirmado la dirección con un BOS en LTF." },
        { color: "#ffd700", title: "Trailing Stop por Estructura", icon: "📊", text: "En lugar de trailing stop mecánico (%), usa la estructura del mercado. Mueve el SL al nuevo HL (si estás long) o al nuevo LH (si estás short) conforme el precio avanza. El stop se mueve solo cuando la estructura confirma la tendencia — no por un porcentaje arbitrario." },
        { color: "#00e5ff", title: "Escalar la Salida (Partials)", icon: "✂️", text: "No tienes que cerrar el 100% en un solo Take Profit. Cierra el 33% en 1R, el 33% en 2R y deja correr el 33% con stop en break even. Esto garantiza ganancias pero mantiene exposición al movimiento mayor. Los grandes trades son raros — cuando aparecen, captúralos con partials." },
      ]
    }
  ]
},

"psicologia": {
  sections: [
    {
      type: "psychology-chart",
      title: "Psicología del Mercado — El Ciclo Emocional",
    },
    {
      title: "La Psicología — El 80% del Trading",
      body: `Los mejores traders del mundo no son los que tienen el mejor sistema de análisis técnico. Son los que tienen mejor control emocional. Un sistema mediocre ejecutado con disciplina supera a un sistema excelente ejecutado emocionalmente. Tu peor enemigo en trading eres TÚ mismo.`,
      type: "text"
    },
    {
      title: "Los Sesgos Cognitivos del Trader",
      type: "cards",
      cards: [
        { color: "#ff1744", title: "FOMO (Fear of Missing Out)", icon: "😱", text: "Entrar en un trade tarde porque el precio ya subió mucho y 'no lo quieres perder'. Resultado: entras en el peor momento, eres la última compra antes de la caída. El FOMO enriquece al smart money." },
        { color: "#ffd700", title: "FUD (Fear, Uncertainty, Doubt)", icon: "😨", text: "Vender en el peor momento por miedo. Capitular cuando el precio cae fuerte. El FUD enriquece a quien compra tu miedo." },
        { color: "#00e5ff", title: "Sesgo de Confirmación", icon: "🔍", text: "Ver solo los datos que confirman lo que ya creemos. 'Busco razones para que BTC suba porque tengo un long'. El mercado no te debe nada ni le importa tu sesgo." },
        { color: "#e040fb", title: "Aversión a la Pérdida", icon: "🧠", text: "Las pérdidas duelen 2.5x más que lo que alegran las ganancias equivalentes (Kahneman & Tversky). Por eso los traders dejan correr las pérdidas (esperando que vuelvan) y cierran las ganancias rápido (por miedo a perderlas). Exactamente al revés de lo óptimo." },
        { color: "#ff6d00", title: "Efecto Disposición", icon: "📊", text: "Vender activos ganadores demasiado pronto y mantener los perdedores demasiado tiempo. 'Realizamos las ganancias rápido y aguantamos las pérdidas' — destruye la rentabilidad." },
        { color: "#00e676", title: "Overconfidence (Exceso de Confianza)", icon: "🎲", text: "Después de varios trades ganadores, el trader aumenta el tamaño de posición creyendo que 'lo tiene dominado'. El mercado siempre te recuerda que no." },
      ]
    },
    {
      title: "Estados Mentales en Trading",
      type: "table",
      headers: ["Estado", "Señales", "Efecto en Trading", "Solución"],
      rows: [
        ["Zona (Flow)", "Calma, claridad, objetividad", "Trading óptimo — sigue el plan", "Mantenerlo: descanso, rutina"],
        ["Tilt leve", "Ligera impaciencia, sesgo en análisis", "Trades pequeños con baja calidad", "Parar 30 minutos. Revisar el plan."],
        ["Tilt fuerte", "Frustración, necesidad de recuperar", "Revenge trading, riesgo aumentado", "Parar el día. Ejercicio físico."],
        ["Euforia", "Exceso de confianza tras racha ganadora", "Overtrading, posiciones grandes", "Volver a tamaño base, tomar descanso"],
        ["Parálisis", "Miedo a entrar incluso con señales claras", "Trades perdidos por exceso de análisis", "Back-testing para ganar confianza"],
      ]
    },
    {
      type: "infobox",
      variant: "key",
      label: "EL PROCESO ÓPTIMO",
      text: `1. PLAN: Antes de operar, define el setup, la entrada exacta, el SL y el TP.
2. EJECUTA: Cuando el setup aparece, ejecuta mecánicamente. Sin dudas.
3. GESTIONA: Mueve el SL solo para proteger ganancias (trailing stop). NUNCA lo muevas en contra tuya.
4. REGISTRA: Anota el trade completo — no importa el resultado.
5. REVISA: Al final del día/semana, analiza sin ego.
El objetivo no es ganar en cada trade. Es EJECUTAR EL PROCESO correctamente en cada trade.`
    },
    {
      title: "Mindset Ganador",
      type: "cards",
      cards: [
        { color: "#00e676", title: "Piensa en Probabilidades", icon: "🎲", text: "Ningún setup tiene 100% de éxito. Tu ventaja estadística se materializa en MUCHOS trades, no en uno. Un trade perdido con el plan correcto = ÉXITO de proceso. Un trade ganado con el plan incorrecto = FRACASO de proceso." },
        { color: "#00e5ff", title: "Journaling Emocional", icon: "📓", text: "Documenta tu estado emocional al entrar en cada trade. Con el tiempo descubrirás patrones: 'cuando estoy ansioso, sobretradeó' o 'mis mejores trades son cuando estoy descansado y no tengo prisa'." },
        { color: "#ffd700", title: "Ritual Pre-Trading", icon: "🧘", text: "Los mejores traders tienen rituales matutinos: revisión de noticias, análisis macro, identificación de setups del día, definición de invalidaciones. El mercado no te espera — tú debes estar preparado antes de la apertura." },
      ]
    },
    {
      title: "La Rutina Óptima del Trader Profesional",
      type: "table",
      headers: ["Momento", "Actividad", "Tiempo", "Objetivo"],
      rows: [
        ["Antes de operar (30-60min)", "Revisión macro: DXY, US10Y, VIX, SPX futuros", "10 min", "Entender el contexto macro del día"],
        ["Antes de operar", "Análisis técnico HTF: diario y 4H — identificar zonas clave", "15 min", "Definir los niveles de precio más importantes del día"],
        ["Antes de operar", "Plan del día: setups posibles, invalidaciones, límite de pérdida diaria", "10 min", "Tener un mapa antes de entrar al mercado"],
        ["Durante el trading", "Operar solo en killzones / sesiones de mayor liquidez", "Variable", "Concentrar atención donde hay oportunidades reales"],
        ["Durante el trading", "Si se alcanza el límite de pérdida diaria: PARAR", "Inmediato", "Proteger el capital del revenge trading"],
        ["Después de operar", "Revisión de trades del día: ¿Seguí el plan? ¿Por qué no?", "15 min", "Aprendizaje activo, no pasivo"],
        ["Fin de semana", "Revisión semanal: métricas, estadísticas, patrones de error", "30 min", "Mejora continua del sistema"],
      ]
    },
    {
      title: "Cómo Construir Disciplina — Técnicas Prácticas",
      type: "cards",
      cards: [
        { color: "#ff1744", title: "Reglas de Trading Escritas", icon: "📋", text: "Escribe tus reglas exactas: 'Solo entro si hay BOS en 15m + FVG en zona de soporte 4H + funding < 0.03%. Si falta cualquiera de las tres condiciones, NO entro'. Reglas vagas = ejecución vaga. Reglas específicas = ejecución mecánica." },
        { color: "#00e676", title: "Accountability Partner", icon: "🤝", text: "Un compañero de trading que revisa tu diario y tus trades contigo una vez a la semana. La presión social positiva reduce el revenge trading y el FOMO. Compartir tu diario con alguien crea responsabilidad — es más difícil violar tus reglas si sabes que tendrás que explicarlo." },
        { color: "#e040fb", title: "Meditación y Control del Estrés", icon: "🧘", text: "No es pseudociencia: 10-15 minutos diarios de meditación reducen la activación del sistema nervioso simpático (respuesta de lucha/huida) que es la causa física del tilt y el revenge trading. El mercado ataca tus emociones — entrena tus emociones para resistir el ataque." },
        { color: "#ffd700", title: "Trading en Modo Sin Expectativas", icon: "🎯", text: "Antes de cada sesión, recuérdate: 'Hoy puede que no haya ningún setup válido, y está bien'. El objetivo de hoy NO es ganar X dinero — es ejecutar tu proceso correctamente si aparece un setup A+. Sin expectativas de resultado = sin presión emocional = mejores decisiones." },
      ]
    }
  ]
},

"diario-trading": {
  sections: [
    {
      title: "Por Qué Llevar un Diario de Trading",
      body: `El diario de trading es la herramienta más subestimada en trading. Los traders más consistentes llevan un registro detallado de cada operación. Sin datos no puedes mejorar — solo repetir los mismos errores. El diario convierte la experiencia en DATOS que puedes analizar y optimizar.`,
      type: "text"
    },
    {
      title: "Qué Registrar en Cada Trade",
      type: "table",
      headers: ["Campo", "Detalle", "Por Qué Importa"],
      rows: [
        ["Fecha y hora", "Timestamp exacto de entrada y salida", "Identifica si operas mejor en ciertos horarios/sesiones"],
        ["Activo", "BTC/USDT, ETH/BTC, etc.", "Qué activos te dan mejores resultados"],
        ["Dirección", "Long / Short", "¿Eres mejor en longs o shorts?"],
        ["Setup / Razón", "OB + FVG + Golden Pocket, CHoCH en 4H, etc.", "¿Qué setups son más rentables para ti?"],
        ["Precio entrada", "Exacto", "Base del cálculo"],
        ["Stop Loss", "Precio y % de capital", "Para calcular el riesgo real"],
        ["Take Profit 1/2/3", "Precios y ratios R:R", "Para calcular la expectativa del trade"],
        ["Resultado", "Ganancia/pérdida en $ y en R", "Seguimiento de performance"],
        ["Sesión/horario", "Asia/London/NY, hora UTC", "Optimizar horarios de trading"],
        ["Estado emocional", "1-10 (calmado-ansioso)", "Correlaciona emoción con performance"],
        ["Notas", "Por qué fallé/acerté, qué aprendí", "El aprendizaje real"],
      ]
    },
    {
      title: "Métricas Clave del Diario",
      type: "cards",
      cards: [
        { color: "#00e5ff", title: "Win Rate (Tasa de Acierto)", icon: "🎯", text: "% de trades ganadores. Menos importante de lo que parece — un win rate del 40% con R:R 3:1 es muy rentable. Fórmula: Ganadores / Total × 100" },
        { color: "#00e676", title: "Profit Factor", icon: "📈", text: "Total ganado / Total perdido. Sobre 1.5 = sistema rentable. Sobre 2.0 = sistema excelente. Bajo 1.0 = sistema perdedor. Es la métrica más honesta de tu sistema." },
        { color: "#ffd700", title: "Average R (R promedio)", icon: "⚖️", text: "Ganancia/pérdida promedio en términos de R. Si tu ganancia promedio es 2R y tu pérdida promedio es 1R = Average R de +1R. Con Win Rate 50% = +0.5R por trade en promedio." },
        { color: "#ff1744", title: "Max Drawdown", icon: "📉", text: "La mayor caída desde un pico de capital hasta un valle. Si pasaste de $10,000 a $7,000 antes de recuperar = 30% drawdown. Mide la resistencia psicológica que requiere tu sistema." },
        { color: "#e040fb", title: "Expectancy (Esperanza Matemática)", icon: "🔢", text: "E = (Win Rate × Avg Win) - (Loss Rate × Avg Loss). Si E > 0 = sistema con ventaja estadística. Si E < 0 = sistema perdedor. La meta: E positivo con suficientes trades para que se materialice." },
      ]
    },
    {
      type: "infobox",
      variant: "tip",
      label: "HERRAMIENTAS RECOMENDADAS",
      text: `TraderVue / Edgewonk: Software especializado de journaling (de pago, muy completos)
Notion / Google Sheets: Gratuito, personalizable, suficiente para empezar
Screenshots: Siempre captura el gráfico al momento de la entrada y la salida con tu análisis marcado
Mínimo 50 trades antes de sacar conclusiones estadísticas — con menos, el sesgo de muestra pequeña distorsiona los resultados`
    },
    {
      title: "Backtesting — Testear tu Sistema Antes de Arriesgar Capital Real",
      body: `El backtesting es aplicar tus reglas de trading a datos históricos para ver cómo habrían funcionado. Antes de operar un sistema con dinero real, deberías tener al menos 200-300 trades backtested con resultados positivos. El forward testing (en demo o con capital mínimo) confirma que el sistema funciona en condiciones reales.`,
      type: "text"
    },
    {
      type: "infobox",
      variant: "key",
      label: "EL CAMINO A LA CONSISTENCIA",
      text: `Mes 1-3: Estudia. No operes con capital real.
Mes 3-6: Demo/simulación con reglas estrictas.
Mes 6-12: Capital mínimo ($500-$1,000). Solo aprende a EJECUTAR el proceso.
Año 1-2: Capital moderado ($1,000-$5,000). Construye estadísticas reales.
Año 2+: Escala el capital según tus métricas lo justifiquen.
NO hay atajos. El mercado toma el dinero de los impacientes y se lo da a los disciplinados.`
    },
    {
      title: "Template de Registro de Trade",
      type: "formula",
      text: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRADE #[número] — [fecha] — [hora entrada UTC]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Activo: BTC/USDT  |  Dirección: LONG / SHORT
Sesión: Asia / London / NY AM / NY PM
Estado emocional al entrar (1-10): ___

SETUP
├── Contexto HTF (4H/D): [tendencia, zona clave]
├── Trigger LTF (15m/5m): [BOS, FVG, OB, etc.]
├── Confluencias: [fibonacci, OI, CVD, dominancias]
└── Setup tipo: A+ / A / B / C

EJECUCIÓN
├── Precio entrada: $___
├── Stop Loss: $___ (−__% / −$___ / −___R equiv.)
├── Take Profit 1: $___ (R:R ___:1)
├── Take Profit 2: $___ (R:R ___:1)
└── Tamaño: ___ unidades / $___ / ___% del capital

RESULTADO
├── Precio salida: $___ | Hora salida: ___
├── PnL: +/− $___ (+/− ___%)
├── R resultado: +_R / −_R
└── ¿Seguí el plan? SÍ / NO — ¿por qué? ___

APRENDIZAJE
└── [1-2 frases sobre lo que aprendiste de este trade]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    },
    {
      title: "Análisis Semanal — Métricas que Debes Calcular",
      type: "table",
      headers: ["Métrica", "Fórmula", "Tu objetivo inicial", "Objetivo avanzado"],
      rows: [
        ["Win Rate", "Trades ganadores / Total × 100", ">40% (con R:R 2:1+)", ">50%"],
        ["Profit Factor", "Suma ganancias / Suma pérdidas", ">1.3", ">1.75"],
        ["Average R", "Promedio de ganancias−pérdidas en R", ">+0.5R por trade", ">+1.0R por trade"],
        ["Max Drawdown", "Mayor caída de capital pico a valle", "<15%", "<10%"],
        ["Expectancy", "(Win% × Avg Win$) − (Loss% × Avg Loss$)", ">$0 (positivo)", "Creciente mes a mes"],
        ["Trades por semana", "Total trades / semanas", "5-10 (calidad > cantidad)", "Ajustar según sistema"],
        ["Best session", "Sesión con mayor PnL/trade", "Identificar tu sesión óptima", "Concentrarse en ella"],
      ]
    },
    {
      title: "De Demo a Capital Real — El Protocolo de Escalada",
      type: "cards",
      cards: [
        { color: "#00e5ff", title: "Fase 1 — Demo (3-6 meses)", icon: "🎮", text: "Mínimo 100 trades en demo con tus reglas exactas. Si el Profit Factor es >1.3 y el drawdown <15%, puedes avanzar. Si no, identifica qué regla estás rompiendo y corrígela antes de pasar a capital real. El demo no tiene presión emocional — recuerda que el real será diferente." },
        { color: "#ffd700", title: "Fase 2 — Capital mínimo (6-12 meses)", icon: "🌱", text: "$500-$1,500 con riesgo del 0.5% por trade. El objetivo NO es ganar dinero — es SENTIR las emociones del dinero real y seguir ejecutando correctamente. Si puedes mantener las métricas del demo con capital real durante 6 meses, tu sistema es robusto." },
        { color: "#00e676", title: "Fase 3 — Escalada progresiva", icon: "📈", text: "Solo aumenta el capital cuando: (1) tienes 200+ trades registrados, (2) Profit Factor >1.5 consistente 3 meses seguidos, (3) Max Drawdown siempre <15%. Duplica el capital cada 3-6 meses si las métricas lo justifican. NO aceleres por codicia." },
      ]
    }
  ]
}

};
