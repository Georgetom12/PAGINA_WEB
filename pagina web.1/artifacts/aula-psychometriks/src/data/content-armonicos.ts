export const contentArmonicos: Record<string, any> = {

"armonicos": {
  sections: [
    {
      title: "¿Qué son los Patrones Armónicos?",
      body: `Los patrones armónicos fueron formalizados por Harold McKinley Gartley en su libro "Profits in the Stock Market" (1935) y luego expandidos por Scott Carney, quien desarrolló el Bat, Butterfly, Crab y Shark. Se basan en la idea de que los mercados se mueven en proporciones matemáticas derivadas de Fibonacci, y que estos patrones se repiten fractal mente en todos los timeframes.

La premisa central: el precio se mueve en estructuras de precio específicas (XABCD) donde cada tramo tiene una relación de Fibonacci precisa con los tramos anteriores. Cuando se cumplen todas las ratios, el punto D es una zona de alta probabilidad de reversión.`,
      type: "text",
    },
    {
      title: "Anatomía de un Patrón Armónico",
      type: "cards",
      cards: [
        { color: "#00e5ff", title: "X — Punto de Origen", icon: "⬡", text: "El inicio del patrón. Es el punto de referencia desde el cual se miden todos los retrocesos y extensiones. En patrones alcistas X es un mínimo; en bajistas es un máximo." },
        { color: "#00e676", title: "A — Primer Impulso", icon: "→", text: "El primer movimiento desde X. Marca la dirección inicial del patrón. XA es el tramo de referencia principal para medir el punto D." },
        { color: "#ffd700", title: "B — Primer Retroceso", icon: "←", text: "Retroceso de XA. Su profundidad (como % de XA) diferencia los distintos patrones. Es uno de los filtros clave para identificar correctamente el patrón." },
        { color: "#e040fb", title: "C — Segundo Impulso", icon: "→", text: "Extensión o retroceso de AB. Junto con B define el patrón específico. El rango de C como % de AB es otro filtro crítico." },
        { color: "#ff1744", title: "D — Punto de Reversión (PRZ)", icon: "★", text: "El Potential Reversal Zone — la zona de entrada. Es la convergencia de múltiples ratios de Fibonacci. Cuantas más ratios coincidan en D, mayor la probabilidad de reversión." },
      ],
    },
    { type: "harmonic", pattern: "gartley" as const, direction: "bull" as const },
    { type: "harmonic", pattern: "bat" as const, direction: "bull" as const },
    { type: "harmonic", pattern: "butterfly" as const, direction: "bear" as const },
    { type: "harmonic", pattern: "crab" as const, direction: "bull" as const },
    { type: "harmonic", pattern: "shark" as const, direction: "bear" as const },
    { type: "harmonic", pattern: "cypher" as const, direction: "bull" as const },
    { type: "harmonic", pattern: "abcd" as const, direction: "bull" as const },
    {
      title: "Tabla Comparativa — Todos los Patrones",
      type: "table",
      headers: ["Patrón", "XAB", "ABC", "BCD", "XAD", "Dificultad", "Frecuencia"],
      rows: [
        ["Gartley", "61.8%", "38.2-88.6%", "127.2-161.8%", "78.6%", "Media", "Alta"],
        ["Bat", "38.2-50%", "38.2-88.6%", "161.8-261.8%", "88.6%", "Media", "Alta"],
        ["Butterfly", "78.6%", "38.2-88.6%", "161.8-261.8%", "127.2-161.8%", "Media", "Media"],
        ["Crab", "38.2-61.8%", "38.2-88.6%", "224-361.8%", "161.8%", "Alta", "Baja"],
        ["Shark", "N/A", "113-161.8%", "50-88.6%", "88.6-113%", "Alta", "Media"],
        ["Cypher", "38.2-61.8%", "113-141.4%", "78.6% (XC)", "78.6%", "Media", "Media"],
        ["AB=CD", "N/A", "38.2-88.6%", "127.2-161.8%", "127.2-161.8%", "Baja", "Muy Alta"],
        ["3 Drives", "N/A", "Drives equidistantes", "127.2-161.8%", "N/A", "Alta", "Baja"],
      ],
    },
    {
      type: "infobox",
      variant: "key",
      label: "PRZ — POTENTIAL REVERSAL ZONE",
      text: `La PRZ es el corazón de los armónicos. Para que el punto D sea válido necesitas:
1. Retroceso de XA (según el patrón)
2. Extensión de BC (según el patrón)
3. Fibonacci de BC respecto a AB (confluencia)
Cuando los tres coinciden en una zona de ±1-2% de precio = PRZ válida.
Mientras más ratios converjan en la PRZ, más alta la probabilidad.`,
    },
    {
      title: "Cómo Operar Patrones Armónicos",
      type: "table",
      headers: ["Paso", "Acción", "Detalle"],
      rows: [
        ["1", "Identificar el patrón preliminar", "Observa XAB que cumpla las ratios básicas del patrón"],
        ["2", "Esperar que llegue al PRZ", "No entres antes — el patrón no está completo hasta que D llega al PRZ"],
        ["3", "Confirmar con contexto HTF", "¿El PRZ coincide con soporte/resistencia mayor? ¿Order Block? ¿Fibonacci MTF?"],
        ["4", "Señal de entrada en D", "Una vela de reversión (pin bar, engulfing) en el PRZ = entrada"],
        ["5", "Stop Loss", "Bajo el PRZ completo (para alcistas) / sobre el PRZ (para bajistas)"],
        ["6", "Take Profit 1 (TP1)", "Retroceso a C (38.2% del CD)"],
        ["7", "Take Profit 2 (TP2)", "Retroceso a B (50-61.8% del AD)"],
        ["8", "Take Profit 3 (TP3)", "Retroceso al nivel de A o X"],
      ],
    },
    {
      type: "infobox",
      variant: "pro",
      label: "ARMÓNICOS + SMC",
      text: `La combinación más potente: busca el PRZ del patrón armónico + Order Block alcista/bajista + Golden Pocket de Fibonacci en el mismo nivel.

Ejemplo: Patrón Bat alcista donde el D llega a 88.6% de XA + en esa zona hay un Order Block alcista H4 + coincide con el 61.8% de un Fibonacci HTF = entrada PREMIUM con SL pequeño y alto RR.

Los traders institucionales CONOCEN estos patrones. Las grandes manos los usan porque marcan zonas de desequilibrio matemático donde el mercado tiende a equilibrar.`,
    },
    {
      title: "Invalidación y Gestión de Riesgo",
      type: "cards",
      cards: [
        { color: "#ff1744", title: "Invalidación de Patrón", icon: "⛔", text: "Si el precio CIERRA más allá del punto X (en alcista: bajo X; en bajista: sobre X), el patrón se invalida. El mercado ha rechazado la estructura. Sal inmediatamente sin esperar más confirmación." },
        { color: "#ffd700", title: "Gestión del Trade", icon: "🎯", text: "Después de que el precio confirma la reversión en D, mueve el SL al breakeven cuando llegues al TP1. Deja el resto correr al TP2 y TP3. Nunca pongas todo el TP en una sola orden con patrones armónicos." },
        { color: "#00e5ff", title: "R:R en Armónicos", icon: "📊", text: "Los patrones armónicos bien ejecutados tienen R:R de 2:1 a 5:1. El Crab, por ser el patrón extremo, puede dar R:R de hasta 8:1 en condiciones ideales. Sin confluencias adicionales, el R:R mínimo aceptable es 2:1." },
      ],
    },
    {
      title: "Herramientas en TradingView",
      body: `En TradingView puedes usar el indicador "Harmonic Pattern Finder" o el "XABCD Pattern" para dibujarlos manualmente. El flujo correcto:
1. Identifica visualmente la estructura XAB cuando el precio retroceda
2. Mide con la herramienta Fibonacci para verificar el retroceso de B
3. Cuando C se forme, proyecta el rango del D usando Fibonacci desde C
4. Cuando el precio se acerque al PRZ, activa las alertas y monitorea`,
      type: "text",
    },
  ],
},

};
