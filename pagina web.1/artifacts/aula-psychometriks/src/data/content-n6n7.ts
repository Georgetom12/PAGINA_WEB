export const contentN6N7: Record<string, any> = {

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
      title: "ICT — Judas Swing y Liquidity Sweep",
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
    }
  ]
},

"gann": {
  sections: [
    {
      type: "gann-chart",
      title: "Gann — Fan de Ángulos y Cuadrado de 9",
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
    }
  ]
},

// ─── NIVEL 7 ──────────────────────────────────────────────────────────────────

"risk-management": {
  sections: [
    {
      type: "risk-reward-chart",
      title: "Risk:Reward — Visualización de Entradas y Niveles",
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
    }
  ]
},

"psicologia": {
  sections: [
    {
      type: "psychology-chart",
      title: "Ciclo Emocional del Trader — Fear & Greed en Acción",
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
    }
  ]
},

"diario-trading": {
  sections: [
    {
      type: "risk-reward-chart",
      title: "Diario de Trading — Análisis de Trades con R:R",
    },
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
    }
  ]
}

};
