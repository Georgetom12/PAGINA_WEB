export const contentN3: Record<string, any> = {

"smart-money-intro": {
  sections: [
    {
      type: "amd-chart",
      title: "Ciclo AMD — Cómo Opera el Smart Money",
    },
    {
      title: "¿Qué es el Smart Money?",
      body: `Smart Money (dinero inteligente) se refiere a los grandes operadores institucionales: bancos de inversión, hedge funds, bancos centrales, family offices y market makers. Operan con capitales tan grandes que NO pueden entrar ni salir del mercado de golpe sin moverlo en su contra. Por eso diseñan trampas, acumulan en rangos y distribuyen en impulsos.`,
      type: "text"
    },
    {
      title: "Smart Money vs Retail",
      type: "table",
      headers: ["Característica", "Smart Money (Institucional)", "Retail (Minorista)"],
      rows: [
        ["Capital", "$10M - $10B+ por operación", "$1K - $100K típico"],
        ["Velocidad", "Semanas/meses para acumular", "Segundos para entrar"],
        ["Análisis", "Flujo de órdenes, posicionamiento, macro", "Indicadores, patrones, FOMO/FUD"],
        ["Objetivo", "Acumular/distribuir sin mover el precio en su contra", "Capturar movimientos"],
        ["Stop Loss", "Casi no usan — gestionan por tamaño", "Muy visibles, fáciles de cazar"],
        ["Influencia", "MUEVEN el mercado", "Son movidos por el mercado"],
      ]
    },
    {
      type: "infobox",
      variant: "key",
      label: "LA VERDAD INCÓMODA",
      text: "El mercado está diseñado para transferir dinero de los menos informados a los más informados. Los stops del retail son la LIQUIDEZ que los institucionales necesitan para ejecutar sus posiciones. Cuando ves que 'todos' piensan que el precio va a subir y entonces cae, eso NO es mala suerte — es el smart money ejecutando su plan. Tu trabajo: aprender a leer sus huellas."
    },
    {
      title: "Cómo Opera el Smart Money — El Ciclo",
      type: "cards",
      cards: [
        { color: "#00e5ff", title: "1. Acumulación", icon: "🔵", text: "Compra silenciosa en un rango lateral. El precio no sube para no alertar al retail. Se crean pequeñas barridas de liquidez dentro del rango para limpiar stops y poder comprar más barato." },
        { color: "#ffd700", title: "2. Manipulación", icon: "⚡", text: "Movimiento falso para limpiar la liquidez antes del movimiento real. En acumulación: caída brusca (spring/barrida) para comprar los stops del retail antes de subir." },
        { color: "#00e676", title: "3. Distribución / Mark Up", icon: "🚀", text: "El precio sube con fuerza después de la acumulación. El retail ve el movimiento, entra por FOMO en los máximos... y los institucionales les venden sus posiciones." },
        { color: "#ff1744", title: "4. El Ciclo Bajista", icon: "🔴", text: "En la cima el proceso se invierte: distribución (venta silenciosa) → manipulación alcista (UTAD) → caída violenta. El retail compra en el techo y el smart money recoge el dinero." },
      ]
    }
  ]
},

"bos-choch": {
  sections: [
    {
      type: "bos-chart",
      title: "BOS & CHoCH — Break of Structure y Change of Character",
      body: "El BOS confirma que la tendencia CONTINÚA. El CHoCH es la primera señal de que la tendencia está CAMBIANDO. Dominar ambos conceptos te permite operar siempre a favor del smart money.",
    },
    {
      title: "BOS — Break of Structure",
      body: `Un BOS (Break of Structure) ocurre cuando el precio rompe un swing high o swing low previo, confirmando que la tendencia CONTINÚA en esa dirección. Es la confirmación de que el mercado sigue su rumbo.`,
      type: "text"
    },
    {
      type: "structure-chart",
      structureType: "bos-bullish",
      title: "BOS Alcista — Confirmación de Continuación",
    },
    {
      type: "structure-chart",
      structureType: "choch-bearish",
      title: "CHoCH Bajista — Primera Señal de Reversión",
    },
    {
      type: "infobox",
      variant: "key",
      label: "BOS — DEFINICIÓN",
      text: `BOS ALCISTA: El precio rompe por encima de un swing high previo → confirma continuación alcista (HH nuevo).
BOS BAJISTA: El precio rompe por debajo de un swing low previo → confirma continuación bajista (LL nuevo).
El BOS es señal de CONTINUACIÓN de tendencia, no de reversión.`
    },
    {
      title: "CHoCH — Change of Character",
      body: `Un CHoCH (Change of Character) es la primera señal de que la tendencia está CAMBIANDO. Ocurre cuando el precio rompe un nivel que debería haber respetado si la tendencia continuara. Es el primer indicio de que el smart money ha cambiado de bias.`,
      type: "text"
    },
    {
      type: "infobox",
      variant: "warn",
      label: "CHoCH — DEFINICIÓN",
      text: `CHoCH BAJISTA: En uptrend, el precio NO forma un nuevo HH y en cambio rompe el HL previo → primer indicio de reversión.
CHoCH ALCISTA: En downtrend, el precio NO forma un nuevo LL y en cambio rompe el LH previo → primer indicio de reversión.
El CHoCH SOLO confirma un posible cambio. Necesitas 2-3 BOS en la nueva dirección para confirmar la nueva tendencia.`
    },
    {
      title: "BOS vs CHoCH — Diferencias Clave",
      type: "table",
      headers: ["Aspecto", "BOS", "CHoCH"],
      rows: [
        ["Significado", "Confirmación de continuación", "Primera señal de cambio"],
        ["Posición en la tendencia", "Dentro de tendencia establecida", "Al final de una tendencia"],
        ["Qué nivel rompe", "El último swing en dirección de la tendencia", "El último swing CONTRA la tendencia"],
        ["Confianza", "Alta — la tendencia confirma", "Media — es solo una señal temprana"],
        ["Acción recomendada", "Seguir la tendencia, buscar entradas", "Alertarse, no operar en contra todavía"],
      ]
    },
    {
      title: "Estructura en Distintos Timeframes",
      type: "cards",
      cards: [
        { color: "#00e5ff", title: "HTF Structure (High Time Frame)", icon: "🌐", text: "La estructura en Semanal/Diario define el BIAS. Si el HTF muestra tendencia alcista (BOS alcistas consecutivos), solo debes buscar longs en el timeframe menor. Nunca operes contra la estructura HTF." },
        { color: "#ffd700", title: "MTF Structure (Mid Time Frame)", icon: "🎯", text: "4H o 1H da el contexto de la sesión. Identifica el punto de interés (POI) donde buscarás entrada. Un CHoCH en 4H dentro de tendencia alcista diaria = pullback = oportunidad de compra." },
        { color: "#00e676", title: "LTF Entry (Low Time Frame)", icon: "🔬", text: "15m o 5m para afinar la entrada. Busca un BOS o CHoCH en el LTF que confirme que el precio ha llegado a tu zona y está listo para moverse en tu dirección." },
      ]
    },
    {
      type: "infobox",
      variant: "pro",
      label: "SETUP CLÁSICO SMC",
      text: "1. HTF (Diario): Tendencia alcista confirmada (BOS alcistas). 2. MTF (4H): CHoCH bajista = pullback a zona de interés. 3. Zona de interés: Order Block + Golden Pocket Fibonacci. 4. LTF (15m): BOS alcista = confirmación de entrada. Este setup aparece regularmente y tiene alta probabilidad de éxito."
    }
  ]
},

"order-blocks": {
  sections: [
    {
      type: "ob-fvg-chart",
      title: "Order Blocks y Fair Value Gaps — Visual",
    },
    {
      title: "¿Qué es un Order Block?",
      body: `Un Order Block (OB) es la última vela opuesta antes de un movimiento impulsivo. Representa una zona donde los institucionales colocaron órdenes masivas. Cuando el precio regresa a esa zona, suele reaccionar porque esas órdenes siguen ahí (pendientes o cerradas y reabiertas).`,
      type: "text"
    },
    {
      title: "Tipos de Order Blocks",
      type: "cards",
      cards: [
        { color: "#00e676", title: "Order Block Alcista", icon: "🟢", text: "La última VELA ROJA antes de un impulso alcista fuerte (que creó un BOS). La zona del OB es el rango de esa vela (apertura-cierre o high-low). Cuando el precio retorna a esa zona, se espera rebote alcista." },
        { color: "#ff1744", title: "Order Block Bajista", icon: "🔴", text: "La última VELA VERDE antes de un impulso bajista fuerte (que creó un BOS). Cuando el precio retorna a esa zona, se espera rechazo bajista." },
        { color: "#ffd700", title: "Breaker Block", icon: "💥", text: "Un Order Block que fue 'roto' — el precio lo penetró y falló. Cuando el precio regresa al nivel que falló, se convierte en zona de distribución (si era alcista) o acumulación (si era bajista). Muy poderoso." },
        { color: "#00e5ff", title: "Mitigation Block", icon: "🔄", text: "OB que el precio ya tocó una vez. Tiene menos fuerza que un OB virgen, pero aún puede ser relevante dependiendo del contexto HTF y las confluencias." },
      ]
    },
    {
      title: "Fair Value Gaps (FVG)",
      body: `Un FVG (también llamado Imbalance o IFVG) ocurre cuando en una secuencia de 3 velas, entre la mecha inferior de la vela 1 y la mecha superior de la vela 3 queda un GAP de precio que no fue negociado. Este vacío actúa como un imán — el precio tiende a regresar a llenarlo antes de continuar.`,
      type: "text"
    },
    {
      type: "infobox",
      variant: "key",
      label: "FVG ALCISTA vs BAJISTA",
      text: `FVG ALCISTA (Bullish FVG): Se forma durante impulso hacia arriba. Zona entre Low(vela1) y High(vela3). El precio suele regresar a esta zona antes de continuar subiendo.
FVG BAJISTA (Bearish FVG): Se forma durante impulso hacia abajo. Zona entre High(vela1) y Low(vela3). El precio suele regresar antes de continuar cayendo.`
    },
    {
      title: "Tabla Comparativa de Zonas SMC",
      type: "table",
      headers: ["Zona", "Cómo se forma", "Fuerza", "Cuando usar"],
      rows: [
        ["Order Block virgen", "Última vela opuesta antes del impulso", "★★★★★", "Primera vez que el precio lo toca"],
        ["Fair Value Gap", "Gap entre mechas en impulso de 3 velas", "★★★★", "Como zona de entrada o TP"],
        ["Breaker Block", "OB que fue roto y el precio regresa", "★★★★", "Cambio de sesgo — fuerte rechazo"],
        ["Liquidity Void", "Impulso sin retroceso = zona sin negociar", "★★★", "El precio 'quiere' volver a llenarla"],
        ["Order Block mitigado", "OB que ya fue tocado 1 vez", "★★", "Menos fiable, usar con más confluencias"],
      ]
    },
    {
      type: "infobox",
      variant: "tip",
      label: "CÓMO COMBINARLOS",
      text: "La zona más potente es un OB alcista + FVG alcista en la misma área + Golden Pocket Fibonacci + EMA 21. Cuando estos 4 elementos coinciden en el mismo nivel, la probabilidad de rebote es muy alta. PSYCHOMETRIKS llama a esto 'Zona Premium' y es donde el sistema puntúa más alto en el score de confluencias."
    }
  ]
},

"liquidez": {
  sections: [
    {
      type: "sweep-destroy",
      title: "Liquidity Sweep — Barrida y Reversión",
    },
    {
      type: "liquidity-absorption",
      title: "Absorción de Liquidez — Cómo lo Hacen los Institucionales",
    },
    {
      title: "¿Qué es la Liquidez en Trading?",
      body: `En SMC, liquidez significa colecciones de órdenes pendientes (stops y limit orders) que están esperando ser ejecutadas. Los institucionales NECESITAN liquidez para entrar y salir de posiciones masivas. Por eso el precio va a buscar donde están los stops del retail.`,
      type: "text"
    },
    {
      title: "Tipos de Liquidez",
      type: "cards",
      cards: [
        { color: "#ff1744", title: "BSL — Buy Side Liquidity", icon: "⬆️", text: "Son los stops de los traders en corto y las órdenes de compra breakout por encima de máximos. Están SOBRE los máximos recientes, equal highs, líneas de tendencia alcistas. El precio sube hasta ahí para tomar la liquidez y luego puede invertir o continuar." },
        { color: "#00e676", title: "SSL — Sell Side Liquidity", icon: "⬇️", text: "Son los stops de los traders en largo y las órdenes de venta breakout por debajo de mínimos. Están BAJO los mínimos recientes, equal lows, líneas de tendencia bajistas. El precio baja hasta ahí para tomar la liquidez y luego puede invertir o continuar." },
        { color: "#ffd700", title: "Equal Highs/Lows (EQH/EQL)", icon: "⬌", text: "Cuando el precio toca el mismo nivel máximo o mínimo dos o más veces. ENORME cantidad de liquidez acumulada (stops + breakout orders). Los institucionales los consideran zonas prioritarias a barrida." },
        { color: "#00e5ff", title: "Inducement (IDM)", icon: "🎣", text: "Una trampa deliberada. El precio crea un máximo o mínimo accesible para atraer a los traders retail a entrar... y luego los barre. El IDM es el 'cebo' antes del movimiento real." },
      ]
    },
    {
      title: "El Proceso de Liquidity Sweep",
      type: "cards",
      cards: [
        { color: "#e040fb", title: "Paso 1: Identificar la Liquidez", icon: "🔍", text: "Busca máximos y mínimos anteriores, equal highs/lows, zonas de ruptura donde hay muchos stops acumulados." },
        { color: "#ff6d00", title: "Paso 2: El Sweep", icon: "💥", text: "El precio penetra brevemente esa zona, ejecutando los stops (wick o cierre). El volumen aumenta durante la barrida. Puede durar 1-3 velas." },
        { color: "#00e676", title: "Paso 3: La Reversión", icon: "🔄", text: "Una vez tomada la liquidez, el precio revierte en la dirección opuesta. Si barrió mínimos (SSL) → reversión alcista. Si barrió máximos (BSL) → reversión bajista." },
        { color: "#ffd700", title: "Confirmación de Entrada", icon: "✓", text: "Busca un BOS en LTF en la dirección de la reversión después del sweep. Esto confirma que el smart money tomó la liquidez y ahora está ejecutando en la dirección real." },
      ]
    },
    {
      type: "infobox",
      variant: "pro",
      label: "LIQUIDITY HUNT SETUP",
      text: "Este es uno de los setups más poderosos: 1) HTF en tendencia alcista. 2) El precio baja a buscar SSL (mínimos anteriores). 3) Sweep del SSL con wick o cierre breve bajo él. 4) BOS alcista en LTF. 5) Entrada en el retroceso al OB/FVG formado en la barrida. Target: BSL (máximos anteriores). RR típico: 3:1 a 7:1."
    }
  ]
},

"amd": {
  sections: [
    {
      type: "amd-chart",
      title: "Modelo AMD — Acumulación, Manipulación, Distribución",
    },
    {
      title: "El Modelo AMD — Las 3 Fases",
      body: `AMD (Accumulation, Manipulation, Distribution) es el modelo que describe cómo los institucionales mueven el precio en un ciclo completo. Este modelo aparece en TODOS los timeframes, desde el de 5 minutos hasta el mensual. Entenderlo es entender la lógica profunda del mercado.`,
      type: "text"
    },
    {
      title: "Las 3 Fases Explicadas",
      type: "cards",
      cards: [
        { color: "#00e5ff", title: "A — Accumulation (Acumulación)", icon: "🔵", text: "El smart money compra silenciosamente. El precio se mueve en rango (lateral). No hay dirección clara. El retail se aburre y pierde interés. Esta fase puede durar horas, días o semanas dependiendo del TF. DENTRO de la acumulación hay sub-manipulaciones para limpiar débiles." },
        { color: "#ff1744", title: "M — Manipulation (Manipulación)", icon: "⚡", text: "El precio hace un movimiento FALSO en dirección opuesta a la que va a continuar. Si va a subir: primero baja para barrida de stops y acumular más barato. Si va a bajar: primero sube para barrida de stops y distribuir más caro. Esta fase dura poco (1-5 velas)." },
        { color: "#00e676", title: "D — Distribution (Distribución)", icon: "🚀", text: "El movimiento real. Después de la manipulación el precio se mueve con fuerza en la dirección de la acumulación/distribución. Es en esta fase donde los trades con mejor RR se ejecutan — entras en la manipulación y tu target es la extensión de la distribución." },
      ]
    },
    {
      type: "infobox",
      variant: "key",
      label: "TIMING EN AMD",
      text: `En el contexto de sesiones de trading:
ACUMULACIÓN = Sesión Asiática (rango lateral)
MANIPULACIÓN = London Open (el Judas Swing — movimiento falso)
DISTRIBUCIÓN = NY Open / Overlap (movimiento real del día)
Esta es la estructura que se repite diariamente en forex y crypto. Aprenderla te da una ventaja enorme.`
    },
    {
      title: "AMD en Diferentes Contextos",
      type: "table",
      headers: ["Timeframe", "Acumulación dura", "Manipulación dura", "Distribución dura"],
      rows: [
        ["Intraday (scalping)", "30min - 2h", "1-3 velas (15m)", "2-6h"],
        ["Diario (swing)", "2-7 días", "1-2 días", "5-15 días"],
        ["Semanal/mensual", "2-4 semanas", "1-3 semanas", "4-12 semanas"],
        ["Ciclo macro (crypto)", "3-6 meses", "1-2 meses", "6-18 meses"],
      ]
    }
  ]
},

"crt": {
  sections: [
    {
      type: "crt-chart",
      title: "CRT — Candle Range Theory Visual",
    },
    {
      title: "CRT — Candle Range Theory",
      body: `La Candle Range Theory (CRT) estudia el rango de una vela (High-Low) como zona de liquidez. El principio fundamental: el HIGH de cualquier vela tiene liquidez por encima (stops de shorts + breakout buyers). El LOW tiene liquidez por debajo (stops de longs + breakout sellers). El mercado va a buscar esa liquidez.`,
      type: "text"
    },
    {
      title: "Conceptos Clave de CRT",
      type: "cards",
      cards: [
        { color: "#ffd700", title: "Candle Range", icon: "📦", text: "El rango entre el High y el Low de cualquier vela (H1, H4, Diaria). Esta zona define dónde están los extremos de liquidez para esa vela. El precio 'recuerda' estos rangos en timeframes menores." },
        { color: "#00e5ff", title: "Inside Bar (Vela Interior)", icon: "📦", text: "Vela cuyo rango completo está dentro del rango de la vela anterior. La vela exterior define las zonas de liquidez. Una ruptura del high o low del inside bar suele ser una TRAMPA (false break) antes del movimiento real en la dirección opuesta." },
        { color: "#00e676", title: "Outside Bar (Engulfing)", icon: "📦", text: "Vela que cubre el rango completo de la anterior. Indica que ambos lados de la liquidez fueron tomados. La dirección de cierre de la outside bar define el sesgo siguiente." },
        { color: "#ff1744", title: "CRT Setup", icon: "🎯", text: "1) Identifica una vela de referencia importante (H4 o Daily). 2) Observa si el precio toma el high o low de esa vela (sweep). 3) Si barre el high → sesgo bajista. Si barre el low → sesgo alcista. 4) Entra en la dirección opuesta a la barrida." },
      ]
    },
    {
      type: "infobox",
      variant: "pro",
      label: "CRT + AMD",
      text: "La CRT y el AMD se complementan perfectamente: La fase de Manipulación del AMD es exactamente el momento en que el precio barre el High o Low de la vela de acumulación (CRT sweep). La Distribución comienza cuando el precio revierte desde esa barrida. Este es el setup intraday más repetitivo del mercado."
    }
  ]
},

"ipda": {
  sections: [
    {
      type: "ipda-chart",
      title: "IPDA — Premium, Equilibrio y Discount Visual",
    },
    {
      title: "IPDA — Interbank Price Delivery Algorithm",
      body: `El IPDA describe cómo los algoritmos institucionales entregan precio. El mercado no se mueve aleatoriamente — sigue rangos de referencia definidos: los últimos N días de precio. Los niveles más importantes son los High/Low de las últimas 20, 40 y 60 velas diarias.`,
      type: "text"
    },
    {
      title: "Niveles IPDA Clave",
      type: "table",
      headers: ["Nivel", "Abreviatura", "Descripción", "Importancia"],
      rows: [
        ["Previous Day High", "PDH", "Máximo del día anterior", "★★★★★ — zona de BSL y resistencia"],
        ["Previous Day Low", "PDL", "Mínimo del día anterior", "★★★★★ — zona de SSL y soporte"],
        ["Previous Week High", "PWH", "Máximo de la semana anterior", "★★★★★ — objetivo frecuente de barridas semanales"],
        ["Previous Week Low", "PWL", "Mínimo de la semana anterior", "★★★★★ — objetivo frecuente de barridas semanales"],
        ["New Week Opening Gap", "NWOG", "Gap entre cierre del viernes y apertura del lunes", "★★★★ — imán de precio al inicio de semana"],
        ["New Day Opening Gap", "NDOG", "Gap entre cierre y apertura del día (en futuros)", "★★★ — referencia intraday"],
        ["40 Day Range", "IPDA 40D", "High y Low de los últimos 40 días diarios", "★★★★★ — rango macro principal"],
      ]
    },
    {
      type: "infobox",
      variant: "key",
      label: "PREMIUM vs DISCOUNT",
      text: `El EQUILIBRIO es el 50% del rango IPDA 40D.
PREMIUM = Por encima del equilibrio (50%). Zona cara — institucionales VENDEN aquí.
DISCOUNT = Por debajo del equilibrio (50%). Zona barata — institucionales COMPRAN aquí.
Para trades LONG: busca entradas en DISCOUNT (por debajo del equilibrio).
Para trades SHORT: busca entradas en PREMIUM (por encima del equilibrio).
Nunca compres en premium ni vendas en discount.`
    }
  ]
}

};
