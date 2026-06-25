import { GlossaryTerm } from "../components/GlossarySection";

export const PSY_TERMS: GlossaryTerm[] = [

  // ─── ESTRUCTURA DE MERCADO ─────────────────────────────────────────────────

  {
    term: "Break of Structure",
    abbr: "BOS",
    category: "Estructura de Mercado",
    color: "#00e676",
    indicatorLabel: "BOS",
    definition: "El precio rompe un swing high/low previo confirmando que la tendencia CONTINÚA. BOS alcista = nuevo HH. BOS bajista = nuevo LL.",
    details: `El BOS es la confirmación de que la tendencia sigue activa. Cuando estás en uptrend y el precio supera el último HH = BOS alcista. En downtrend, cuando cae bajo el último LL = BOS bajista.

En el indicador PSY aparece marcado con una etiqueta "BOS" sobre la vela que confirma la ruptura, junto a una línea horizontal en el nivel roto.

Uso: después de un BOS, busca la siguiente HL (en alcista) o LH (en bajista) para entrar en la dirección de la tendencia.`,
    seeModule: "BOS & CHoCH",
  },

  {
    term: "Change of Character",
    abbr: "CHoCH",
    category: "Estructura de Mercado",
    color: "#ff1744",
    indicatorLabel: "CHoCH",
    definition: "Primera señal de posible cambio de tendencia. En uptrend: el precio rompe el último HL. En downtrend: rompe el último LH.",
    details: `El CHoCH NO confirma reversión — es solo la primera advertencia. Necesitas ver luego BOS consecutivos en la nueva dirección para confirmar.

En el indicador PSY aparece marcado en rojo/naranja con etiqueta "CHoCH" y una línea en el nivel roto.

Diferencia clave con BOS: el BOS rompe en la dirección de la tendencia. El CHoCH rompe en contra de la tendencia (rompe el mínimo de retroceso en una tendencia alcista).`,
    seeModule: "BOS & CHoCH",
  },

  {
    term: "Market Structure Shift",
    abbr: "MSS",
    category: "Estructura de Mercado",
    color: "#ff6d00",
    indicatorLabel: "MSS",
    definition: "Similar al CHoCH — señala un cambio de carácter en la estructura. Algunos sistemas lo distinguen del CHoCH por requerir desplazamiento (Displacement) fuerte.",
    details: `En algunos sistemas SMC, MSS y CHoCH son sinónimos. En otros, el MSS requiere que la ruptura venga acompañada de un Displacement (movimiento impulsivo fuerte) para ser válido.

En el PSY, el MSS suele marcar cambios estructurales de mayor relevancia que un CHoCH simple — requiere mayor fuerza de movimiento.`,
    seeModule: "BOS & CHoCH",
  },

  {
    term: "Higher High",
    abbr: "HH",
    category: "Estructura de Mercado",
    color: "#00e676",
    indicatorLabel: "HH",
    definition: "Máximo mayor al máximo anterior. Señal de tendencia alcista activa. Los compradores empujan el precio a zonas cada vez más altas.",
    details: `Para que sea un HH válido, el precio debe superar con un cierre de vela (no solo con la mecha) el máximo anterior.

En el indicador PSY aparece marcado sobre los picos del precio. La secuencia HH → HL → HH → HL = uptrend saludable.`,
    seeModule: "Estructura de Mercado",
  },

  {
    term: "Higher Low",
    abbr: "HL",
    category: "Estructura de Mercado",
    color: "#00e5ff",
    indicatorLabel: "HL",
    definition: "Mínimo mayor al mínimo anterior. Confirma que la demanda crece — cada retroceso se detiene en niveles más altos. La zona HL es donde se buscan entradas long.",
    details: `El HL es la zona donde los traders de tendencia buscan entradas long. La lógica: si la tendencia es alcista (HH/HL), en el siguiente retroceso el precio debería formar un nuevo HL — ahí es tu oportunidad de comprar más barato antes del siguiente HH.

Invalidación: si el precio cae bajo el HL previo = posible CHoCH y cambio de tendencia.`,
    seeModule: "Estructura de Mercado",
  },

  {
    term: "Lower High",
    abbr: "LH",
    category: "Estructura de Mercado",
    color: "#ff6d00",
    indicatorLabel: "LH",
    definition: "Máximo menor al máximo anterior. Los vendedores dominan — cada rebote falla en superar el nivel anterior. En downtrend, el LH es donde se buscan entradas short.",
    details: `El LH confirma que el mercado bajista sigue activo. Los vendedores venden antes de que el precio llegue al máximo anterior.

Invalidación del LH: si el precio supera el LH anterior = posible CHoCH alcista.`,
    seeModule: "Estructura de Mercado",
  },

  {
    term: "Lower Low",
    abbr: "LL",
    category: "Estructura de Mercado",
    color: "#ff1744",
    indicatorLabel: "LL",
    definition: "Mínimo menor al mínimo anterior. Señal de tendencia bajista activa. Los vendedores llevan el precio a niveles cada vez más bajos.",
    details: `La secuencia LH → LL → LH → LL = downtrend clásico. Mientras se mantenga esta secuencia, la tendencia bajista está intacta.

Invalidación: si el precio sube sobre el LH previo = posible CHoCH bajista.`,
    seeModule: "Estructura de Mercado",
  },

  {
    term: "Equal Highs",
    abbr: "EQH",
    category: "Estructura de Mercado",
    color: "#e040fb",
    indicatorLabel: "EQH",
    definition: "Dos o más máximos al mismo nivel de precio. Son zonas de liquidez — los stops de los shorts y las órdenes de breakout de los longs se acumulan aquí.",
    details: `Los EQH son una trampa potencial. El precio puede hacer un micro-breakout falso para cazar los stops y las órdenes de compra acumuladas sobre esos máximos, y luego revertir violentamente.

Si el precio toca los EQH, espera — puede ser un Judas Swing. Si rompe con volumen real = breakout legítimo.`,
    seeModule: "Liquidez y Liquidity Hunts",
  },

  {
    term: "Equal Lows",
    abbr: "EQL",
    category: "Estructura de Mercado",
    color: "#e040fb",
    indicatorLabel: "EQL",
    definition: "Dos o más mínimos al mismo nivel de precio. Zona de liquidez — stops de los longs y órdenes de breakout bajistas se concentran aquí.",
    details: `Los EQL son zonas de atracción para el precio. El mercado tiende a buscar esa liquidez antes de hacer su movimiento real.

En un setup SMC: si el precio cae a los EQL, los barre (Liquidity Sweep), y luego revierte con una vela de Displacement alcista = entrada long de alta probabilidad.`,
    seeModule: "Liquidez y Liquidity Hunts",
  },

  {
    term: "Swing High / Swing Low",
    abbr: "SH / SL",
    category: "Estructura de Mercado",
    color: "#546e7a",
    indicatorLabel: "Swing H/L",
    definition: "Puntos de inflexión visibles del precio. Un Swing High es un máximo rodeado de mínimos. Un Swing Low es un mínimo rodeado de máximos.",
    details: `Los swings son los bloques fundamentales de la estructura. Son los puntos desde los cuales se trazan los Fibonacci, se identifican los BOS/CHoCH, y se definen los HH/HL/LH/LL.

En el indicador PSY, los Swing Highs y Lows relevantes se marcan automáticamente según el timeframe activo.`,
    seeModule: "Estructura de Mercado",
  },

  // ─── SMART MONEY — ZONAS ──────────────────────────────────────────────────

  {
    term: "Order Block",
    abbr: "OB",
    category: "Smart Money — Zonas",
    color: "#ff6d00",
    indicatorLabel: "OB ↑ / OB ↓",
    definition: "La última vela opuesta antes de un movimiento impulsivo (BOS o Displacement). Zona donde los institucionales dejaron órdenes sin llenar que defenderán en el próximo retorno.",
    details: `OB Alcista (Bullish OB): última vela roja antes de un impulso alcista fuerte que genera BOS. El precio tiende a volver a esa zona para rebalancear y luego continuar al alza.

OB Bajista (Bearish OB): última vela verde antes de un impulso bajista fuerte. El precio vuelve a esa zona para rebalancear y luego continuar cayendo.

En el indicador PSY se marca como un rectángulo con "OB ↑" o "OB ↓". El rectángulo cubre el rango completo del cuerpo de la vela OB.

Validez: un OB se mitiga cuando el precio cierra completamente dentro de él (lo "consume" completamente).`,
    seeModule: "Order Blocks & FVG",
  },

  {
    term: "Bullish Order Block",
    abbr: "Bullish OB",
    category: "Smart Money — Zonas",
    color: "#00e676",
    indicatorLabel: "OB ↑",
    definition: "Última vela bajista antes de un movimiento alcista impulsivo que rompe estructura. Zona de compra institucional. En el indicador PSY aparece como rectángulo verde/cyan.",
    details: `Características del Bullish OB válido:
• Debe estar seguido de un desplazamiento alcista (displacement) fuerte
• Ese desplazamiento debe generar un BOS o MSS
• La zona del OB no debe haber sido violada (el precio no debe haber cerrado bajo su base)

El alto del OB = High de la vela
El bajo del OB = Low de la vela (algunos sistemas usan el cuerpo, otros el rango completo)`,
    seeModule: "Order Blocks & FVG",
  },

  {
    term: "Bearish Order Block",
    abbr: "Bearish OB",
    category: "Smart Money — Zonas",
    color: "#ff1744",
    indicatorLabel: "OB ↓",
    definition: "Última vela alcista antes de un movimiento bajista impulsivo que rompe estructura. Zona de venta institucional. En el PSY aparece como rectángulo rojo.",
    details: `El Bearish OB funciona igual que el Bullish pero en dirección opuesta:
• Última vela verde antes del impulso bajista
• Ese impulso debe generar BOS bajista o MSS
• La zona no debe haber sido violada (precio no cierra sobre su techo)

Cuando el precio retorna al Bearish OB = busca confirmación de rechazo (Shooting Star, Bearish Engulfing) para entrar short.`,
    seeModule: "Order Blocks & FVG",
  },

  {
    term: "Fair Value Gap",
    abbr: "FVG",
    category: "Smart Money — Zonas",
    color: "#00e5ff",
    indicatorLabel: "FVG",
    definition: "Zona donde el precio se movió tan rápido que dejó un gap de desequilibrio — la vela 3 no solapa con la vela 1. El precio tiende a volver a 'rellenar' esa zona.",
    details: `El FVG se forma en 3 velas:
• Vela 1: impulso en una dirección
• Vela 2: gap — entre el High de V1 y el Low de V3 hay espacio sin negociación
• Vela 3: el gap queda visible

FVG Alcista: High de V1 < Low de V3 (espacio entre ellos = zona de compra)
FVG Bajista: Low de V1 > High de V3 (espacio entre ellos = zona de venta)

En PSY aparece como rectángulo semitransparente marcado "FVG". El precio tiende a cerrar el 50% del FVG (Consequent Encroachment) antes de rebotar.

Sinónimos: Imbalance, Inefficiency, Gap, IFVG (Inversión del FVG si ya fue visitado y rechazado)`,
    seeModule: "Order Blocks & FVG",
  },

  {
    term: "Breaker Block",
    abbr: "BB",
    category: "Smart Money — Zonas",
    color: "#ffd700",
    indicatorLabel: "BB",
    definition: "Un Order Block que fue violado (el precio lo atravesó generando CHoCH/BOS contrario). Ahora se convierte en zona opuesta — un OB alcista violado se convierte en Breaker Block bajista.",
    details: `El Breaker Block es el OB 'roto'. Cuando el precio viola completamente un OB, ese OB cambia de función:
• OB alcista roto → Breaker Block bajista (zona de oferta ahora)
• OB bajista roto → Breaker Block alcista (zona de demanda ahora)

En PSY aparece marcado como "BB" con un color diferente al OB original. Es una zona de alta probabilidad porque hay muchos traders que tenían órdenes en ese OB que ahora quedan atrapados.`,
    seeModule: "Order Blocks & FVG",
  },

  {
    term: "Rejection Block",
    abbr: "RB",
    category: "Smart Money — Zonas",
    color: "#e040fb",
    indicatorLabel: "RB",
    definition: "Zona formada por la mecha de una vela con rechazo extremo. El precio intentó moverse en una dirección pero fue rechazado violentamente — la zona de la mecha actúa como resistencia/soporte.",
    details: `El Rejection Block se forma cuando una vela tiene una mecha muy larga comparada con su cuerpo. La zona de la mecha representa el área donde las órdenes institucionales absorbieron el movimiento.

Diferencia con OB: el OB es la vela completa antes del impulso. El RB es específicamente la zona de la mecha de la vela de rechazo.`,
    seeModule: "Order Blocks & FVG",
  },

  {
    term: "Mitigation Block",
    abbr: "MB",
    category: "Smart Money — Zonas",
    color: "#7c4dff",
    indicatorLabel: "MB",
    definition: "Order Block que el precio ya visitó parcialmente pero no mitigó completamente. Todavía tiene 'munición' institucional — puede actuar como zona de reacción en el próximo retorno.",
    details: `Un OB se considera 'mitigado' cuando el precio cierra completamente dentro de él, consumiendo todas las órdenes institucionales.

Un MB es un OB parcialmente consumido. Puede seguir actuando como zona relevante, especialmente si el precio solo tocó el 50% del OB (Consequent Encroachment del OB).`,
    seeModule: "Order Blocks & FVG",
  },

  {
    term: "Propulsion Block",
    abbr: "PB",
    category: "Smart Money — Zonas",
    color: "#00e676",
    indicatorLabel: "PB",
    definition: "Zona de consolidación antes de un movimiento explosivo. El precio consolida brevemente, acumulando energía, y luego se mueve con fuerza. La zona de consolidación actúa como soporte/resistencia.",
    details: `El Propulsion Block es menos común en el PSY pero aparece en configuraciones de alta volatilidad. Es similar al OB pero en vez de una sola vela, se forma en un pequeño rango de consolidación.

En crypto aparece frecuentemente antes de breakouts explosivos — el precio consolida en un rango pequeño (1-3 horas) y luego dispara.`,
    seeModule: "Order Blocks & FVG",
  },

  {
    term: "Balanced Price Range",
    abbr: "BPR",
    category: "Smart Money — Zonas",
    color: "#00e5ff",
    indicatorLabel: "BPR",
    definition: "Zona de superposición entre un OB alcista y un FVG alcista (o bajista y bajista). La confluencia de ambas zonas crea una zona de muy alta probabilidad.",
    details: `El BPR es la zona donde un Order Block y un Fair Value Gap se superponen. Es una de las zonas de mayor probabilidad en SMC porque combina:
1. Zona de órdenes institucionales pendientes (OB)
2. Zona de desequilibrio que el precio tiende a cerrar (FVG)

En PSY puede aparecer marcado cuando el indicador detecta esta confluencia.`,
    seeModule: "Order Blocks & FVG",
  },

  {
    term: "Volume Imbalance",
    abbr: "VI",
    category: "Smart Money — Zonas",
    color: "#546e7a",
    indicatorLabel: "VI",
    definition: "Gap de volumen entre dos velas consecutivas del mismo color — el High de la vela anterior no alcanza el Low de la siguiente (en alcista) o el Low no alcanza el High (en bajista). Similar al FVG pero entre velas del mismo color.",
    details: `Diferencia entre FVG y Volume Imbalance:
• FVG: gap visible en 3 velas (V1-V2-V3)
• VI: gap entre 2 velas consecutivas del mismo color sin vela intermedia

Ambos representan zonas de desequilibrio. El mercado tiende a cerrar estas zonas antes de continuar su movimiento.`,
    seeModule: "Order Blocks & FVG",
  },

  // ─── LIQUIDEZ ─────────────────────────────────────────────────────────────

  {
    term: "Buy Side Liquidity",
    abbr: "BSL",
    category: "Liquidez",
    color: "#e040fb",
    indicatorLabel: "BSL",
    definition: "Zona donde se acumulan órdenes de compra y stops de vendedores — principalmente sobre máximos previos, Equal Highs, trendlines alcistas. El precio es atraído hacia estas zonas.",
    details: `La BSL se acumula sobre:
• Highs previos del día/semana/mes
• Equal Highs (EQH)
• Trendlines alcistas (los stops están sobre la línea)
• Máximos de consolidaciones

Cuando el precio alcanza la BSL, se produce una barrida de liquidez: el precio sube brevemente sobre esos máximos, activa los stops y órdenes pendientes, y puede revertir. El indicador PSY marca las zonas BSL principales.`,
    seeModule: "Liquidez y Liquidity Hunts",
  },

  {
    term: "Sell Side Liquidity",
    abbr: "SSL",
    category: "Liquidez",
    color: "#e040fb",
    indicatorLabel: "SSL",
    definition: "Zona donde se acumulan órdenes de venta y stops de compradores — principalmente bajo mínimos previos, Equal Lows, trendlines bajistas.",
    details: `La SSL se acumula bajo:
• Lows previos del día/semana/mes
• Equal Lows (EQL)
• Trendlines bajistas (los stops están bajo la línea)
• Mínimos de consolidaciones

El precio busca la SSL, la barre (caza los stops), y puede revertir al alza. Este es el patrón de "Spring" de Wyckoff en contexto moderno.`,
    seeModule: "Liquidez y Liquidity Hunts",
  },

  {
    term: "Inducement",
    abbr: "IDM",
    category: "Liquidez",
    color: "#ff6d00",
    indicatorLabel: "IDM",
    definition: "Máximo o mínimo creado para atraer órdenes en una dirección antes de que el precio se mueva en la dirección contraria. Es una trampa deliberada del smart money.",
    details: `El IDM funciona así:
1. El mercado forma un swing visible que atrae a traders retail
2. Los retail ponen sus stops justo debajo (en alcista) o encima (en bajista) de ese swing
3. El precio barre ese nivel (IDM), caza los stops
4. El precio continúa en la dirección real

Ejemplo clásico: en un uptrend, el precio forma un HL → pero ese HL es un poco más bajo de lo esperado (IDM = señal falsa de CHoCH). Muchos shorts colocan stops sobre ese "CHoCH". El precio los barre y sigue al alza.`,
    seeModule: "Liquidez y Liquidity Hunts",
  },

  {
    term: "Liquidity Sweep",
    abbr: "LS",
    category: "Liquidez",
    color: "#ff1744",
    indicatorLabel: "Sweep",
    definition: "Cuando el precio alcanza una zona de liquidez (BSL/SSL), activa esas órdenes, y luego revierte. El 'barrido' de liquidez es la mecha que aparece más allá del nivel de stops.",
    details: `El Liquidity Sweep es uno de los setups más poderosos del SMC. Secuencia completa:
1. Identificar zona de liquidez (BSL o SSL)
2. El precio llega a esa zona y la viola brevemente (mecha)
3. Vela de displacement en la dirección contraria
4. Entrada después de la confirmación

La mecha del sweep = los stops activados = la liquidez que necesitaban los institucionales para llenar sus órdenes.`,
    seeModule: "Liquidez y Liquidity Hunts",
  },

  {
    term: "Draw on Liquidity",
    abbr: "DOL",
    category: "Liquidez",
    color: "#00e5ff",
    indicatorLabel: "DOL",
    definition: "El objetivo hacia donde el precio se dirige para buscar liquidez. En cada momento el mercado tiene un DOL — el nivel de BSL o SSL más cercano y relevante que 'atrae' el precio.",
    details: `El DOL es el 'imán' del precio. Para operar con PSY debes siempre preguntarte: ¿Hacia qué zona de liquidez se dirige el precio ahora?

En uptrend: el DOL está arriba (BSL — los máximos previos)
En downtrend: el DOL está abajo (SSL — los mínimos previos)

Una vez que el precio alcanza el DOL y barre esa liquidez, el siguiente DOL puede ser en la dirección contraria.`,
    seeModule: "Liquidez y Liquidity Hunts",
  },

  {
    term: "Liquidity Void",
    abbr: "LV",
    category: "Liquidez",
    color: "#7c4dff",
    indicatorLabel: "LV",
    definition: "Zona donde el precio se movió muy rápido dejando pocas o ninguna transacción — 'vacío' de liquidez. El precio tiende a volver a esa zona para 'rellenarla'. Similar al FVG pero de mayor magnitud.",
    details: `La diferencia con el FVG es de escala. El FVG es un gap entre velas. La Liquidity Void es un movimiento de varias velas donde el precio pasó tan rápido que quedó muy poca negociación.

En TradingView aparece como una zona de velas con cuerpos muy grandes y pocas mechas — el precio "viajó" sin mucha resistencia. Eventualmente vuelve a esa zona.`,
    seeModule: "Liquidez y Liquidity Hunts",
  },

  // ─── FIBONACCI & NIVELES ──────────────────────────────────────────────────

  {
    term: "Golden Pocket",
    abbr: "GP",
    category: "Fibonacci & Niveles",
    color: "#ffd700",
    indicatorLabel: "GP",
    definition: "Zona entre el 61.8% y el 70.5% de Fibonacci. La zona de mayor probabilidad estadística de rebote en retrocesos. Confluencia del Golden Ratio con el siguiente nivel significativo.",
    details: `El Golden Pocket es la zona más buscada por traders institucionales para entrar en pullbacks. Combina:
• 0.618 (Golden Ratio — Fibonacci puro)
• 0.705 (OTE de ICT — Optimal Trade Entry)

Cuando el precio retrocede al Golden Pocket en tendencia alcista = búsqueda de longs.
Cuando el precio retrocede al Golden Pocket en tendencia bajista = búsqueda de shorts.

Mayor probabilidad cuando se combina con: Order Block en esa zona + sesión London/NY activa.`,
    seeModule: "Fibonacci Completo",
  },

  {
    term: "Optimal Trade Entry",
    abbr: "OTE",
    category: "Fibonacci & Niveles",
    color: "#ffd700",
    indicatorLabel: "OTE",
    definition: "Zona de entrada óptima según ICT: entre el 62% y el 78.6% de Fibonacci del swing previo. Es la zona donde los institucionales suelen llenar sus posiciones en pullbacks.",
    details: `El OTE de ICT va del 62% al 78.6% de Fibonacci. A veces se extiende hasta el 88.6%.

Forma parte del Golden Pocket pero con un rango ligeramente más amplio. En el indicador PSY puede aparecer como una zona sombreada entre estos niveles.

La lógica: los institucionales esperan que el precio 'corrija' suficiente para dar valor antes de continuar el impulso. El OTE es ese punto de 'valor justo' desde su perspectiva.`,
    seeModule: "Fibonacci Completo",
  },

  {
    term: "Premium Zone",
    abbr: "Premium",
    category: "Fibonacci & Niveles",
    color: "#ff1744",
    indicatorLabel: "Premium",
    definition: "Zona sobre el 50% (Equilibrium) del rango de precio. En esta zona el precio está 'caro'. Para longs, comprar en Premium es un error — esperas al Discount.",
    details: `Para definir Premium/Discount necesitas identificar un rango (entre un swing high y un swing low).
• Sobre el 50% = Premium (caro para comprar, ideal para vender)
• Bajo el 50% = Discount (barato para comprar)
• En el 50% = Equilibrium (precio justo)

Regla: busca longs en Discount, busca shorts en Premium. Nunca compres en Premium esperando continuación — el smart money te vende ahí.`,
    seeModule: "IPDA — Rangos Premium/Discount",
  },

  {
    term: "Discount Zone",
    abbr: "Discount",
    category: "Fibonacci & Niveles",
    color: "#00e676",
    indicatorLabel: "Discount",
    definition: "Zona bajo el 50% (Equilibrium) del rango de precio. El precio está 'barato'. Es la zona donde el smart money compra en mercados alcistas.",
    details: `En un mercado alcista:
• El smart money compra en Discount (61.8%–78.6% del rango)
• El smart money vende en Premium (nuevos ATH o extensiones)

El Discount más efectivo coincide con el Golden Pocket (61.8%–70.5%).

En el indicador PSY puede aparecer como una zona sombreada verde en la parte baja del rango identificado.`,
    seeModule: "IPDA — Rangos Premium/Discount",
  },

  {
    term: "Equilibrium",
    abbr: "EQ",
    category: "Fibonacci & Niveles",
    color: "#546e7a",
    indicatorLabel: "EQ / 50%",
    definition: "El 50% exacto del rango de precio. Zona neutral — ni caro ni barato. A veces actúa como soporte/resistencia en sí misma.",
    details: `El 50% es el nivel de Fibonacci más discutido — no es una ratio pura de Fibonacci sino de Dow Theory. Sin embargo, es extremadamente respetado por su simplicidad psicológica.

En PSY/SMC, el EQ es la línea divisoria entre Premium y Discount. Es una zona de 'precio justo' donde el mercado puede pausar antes de decidir dirección.`,
    seeModule: "IPDA — Rangos Premium/Discount",
  },

  {
    term: "Consequent Encroachment",
    abbr: "CE",
    category: "Fibonacci & Niveles",
    color: "#00e5ff",
    indicatorLabel: "CE",
    definition: "El 50% exacto de un Fair Value Gap (FVG). El precio tiende a retornar al menos hasta el CE del FVG antes de rebotar. Es el nivel mínimo de 'relleno' que se espera de un FVG.",
    details: `Cuando hay un FVG, el CE es su punto medio:
• Si el FVG va de 100 a 110, el CE está en 105
• El precio tiende a cerrarse al menos hasta el CE del FVG
• Una entrada conservadora en el FVG usa el CE como zona de confirmación

En el indicador PSY puede aparecer como una línea dentro del rectángulo del FVG marcando su punto medio.`,
    seeModule: "Order Blocks & FVG",
  },

  // ─── GAPS & APERTURAS ─────────────────────────────────────────────────────

  {
    term: "New Week Opening Gap",
    abbr: "NWOG",
    category: "Gaps & Aperturas",
    color: "#00e676",
    indicatorLabel: "NWOG",
    definition: "Gap creado entre el cierre del viernes y la apertura del lunes en forex. Los mercados cierran el viernes y abren el lunes — cualquier diferencia es el NWOG. Es una zona de atracción.",
    details: `El NWOG es una referencia clave del IPDA. El precio tiende a:
1. Abrir la semana y moverse hacia el NWOG para cerrarlo
2. O usarlo como punto de rechazo si el precio se aleja de él

En crypto (BTC), el equivalente es el CME Gap: los futuros de BTC en CME cierran el viernes a las 5PM NY y reabren el domingo a las 6PM NY. La diferencia = CME Gap = muy respetado por los traders de BTC.

En PSY aparece como una zona entre las líneas de apertura y cierre de la semana anterior.`,
    seeModule: "IPDA — Rangos Premium/Discount",
  },

  {
    term: "New Day Opening Gap",
    abbr: "NDOG",
    category: "Gaps & Aperturas",
    color: "#00e676",
    indicatorLabel: "NDOG",
    definition: "Gap entre el cierre de ayer y la apertura de hoy. Zona de atracción intradía — el precio tiende a visitar esta zona durante la sesión del día.",
    details: `El NDOG es la referencia diaria del IPDA. Es especialmente relevante en las primeras horas de la sesión de New York.

El precio tiende a 'cerrar' el NDOG antes de continuar su movimiento. Si el NDOG no se cierra durante la mañana, puede actuar como objetivo del día.`,
    seeModule: "IPDA — Rangos Premium/Discount",
  },

  {
    term: "CME Gap",
    abbr: "CME Gap",
    category: "Gaps & Aperturas",
    color: "#ffd700",
    indicatorLabel: "CME Gap",
    definition: "Gap entre el cierre del viernes a las 5PM NY de los futuros BTC de CME y su reapertura el domingo a las 6PM NY. Altísima probabilidad de cierre (~90% histórico).",
    details: `El CME Gap es uno de los indicadores más respetados por los traders de BTC:
• Futuros CME cierran: viernes 5PM NY (sábado 5AM GYE+1)
• Futuros CME abren: domingo 6PM NY (domingo 6PM GYE)
• Diferencia = CME Gap

Estadísticamente ~90% de los CME Gaps se cierran. El precio suele moverse hacia ese gap durante los primeros días de la semana antes de continuar su tendencia.

En TradingView se ve en el gráfico de BTC1! o en el indicador de futuros CME.`,
    seeModule: "Open Interest",
  },

  {
    term: "Displacement",
    abbr: "Disp.",
    category: "Gaps & Aperturas",
    color: "#ff6d00",
    indicatorLabel: "Displacement",
    definition: "Movimiento impulsivo fuerte que rompe estructura, deja FVGs, y muestra claramente que una parte del mercado domina. Es el movimiento que confirma la intención institucional.",
    details: `Un Displacement válido debe:
1. Romper estructura (BOS o MSS)
2. Dejar FVGs (moverse tan rápido que hay gaps de desequilibrio)
3. Tener cuerpos de vela grandes y pocas mechas
4. Ocurrir en las sesiones de mayor volumen (London/NY)

En PSY, el Displacement es lo que valida un Order Block o FVG. Sin displacement, el OB o FVG es menos confiable.`,
    seeModule: "AMD — Acumulación, Manipulación, Distribución",
  },

  // ─── SESIONES & TIMING ────────────────────────────────────────────────────

  {
    term: "Kill Zone",
    abbr: "KZ",
    category: "Sesiones & Timing",
    color: "#7c4dff",
    indicatorLabel: "KZ",
    definition: "Ventanas de tiempo de alta probabilidad donde los institucionales ejecutan sus órdenes más grandes. Son London KZ, New York KZ (AM), New York KZ (PM) y Asian KZ.",
    details: `Kill Zones (Horario Guayaquil GMT-5):
• Asian KZ: 8PM - 12AM (Tokio)
• London KZ: 2AM - 5AM (apertura europea)  
• New York AM KZ: 7AM - 10AM (apertura NY y Overlap)
• New York PM KZ: 1:30PM - 4PM (tarde NY)

Dentro de los Kill Zones ocurren los movimientos más limpios y confiables. El PSY puede marcar estas ventanas como zonas de mayor atención.`,
    seeModule: "Sesiones de Trading",
  },

  {
    term: "Judas Swing",
    abbr: "JS",
    category: "Sesiones & Timing",
    color: "#ff6d00",
    indicatorLabel: "Judas",
    definition: "Movimiento falso en la zona Pre-London (2-4AM GYE) que engaña a los traders retail moviéndose en una dirección para luego revertir violentamente en la dirección real del día.",
    details: `El Judas Swing es la 'fase de manipulación' del AMD en el contexto de sesiones:
1. Pre-London (2-4AM GYE): el precio mueve fuerte en una dirección
2. Caza los stops en esa dirección
3. Al inicio de London (3-5AM GYE): precio revierte y establece la dirección real

Para usarlo: si ves una barrida de liquidez + displacement contrario en ese horario = posible entrada en la dirección del reversal.`,
    seeModule: "Sesiones de Trading",
  },

  {
    term: "AMD Cycle",
    abbr: "AMD",
    category: "Sesiones & Timing",
    color: "#ff6d00",
    indicatorLabel: "AMD",
    definition: "Acumulación → Manipulación → Distribución. El ciclo de 3 fases por el que pasa el precio en cada sesión y en múltiples timeframes.",
    details: `El AMD aplicado a las sesiones del día:
• Acumulación (Asia, 6PM-3AM GYE): precio lateral, rango estrecho, construcción de posiciones
• Manipulación (Pre-London, 2-4AM GYE): Judas Swing, barrida de liquidez en ambas direcciones
• Distribución (London+NY, 3AM-5PM GYE): movimiento real con dirección y volumen

Este ciclo se repite fractal: en cada sesión, en cada día, en cada semana, en cada ciclo de mercado.`,
    seeModule: "AMD — Acumulación, Manipulación, Distribución",
  },

  {
    term: "ICT Silver Bullet",
    abbr: "Silver Bullet",
    category: "Sesiones & Timing",
    color: "#7c4dff",
    indicatorLabel: "Silver Bullet",
    definition: "Ventana de trading específica de ICT: 10AM-11AM NY (3-4AM GYE), o 2PM-3PM NY (7-8AM GYE). Setups de FVG dentro de estas ventanas tienen alta probabilidad.",
    details: `El Silver Bullet es un concepto de ICT que identifica ventanas de 1 hora donde el precio suele crear FVGs que se respetan con alta precisión.

Silver Bullet AM: 3AM-4AM GYE (10-11AM NY)
Silver Bullet PM: 7AM-8AM GYE (2-3PM NY)

Setup: espera que el precio barra liquidez → deje un FVG en la ventana → entra en el retorno al FVG.`,
    seeModule: "ICT — Inner Circle Trader",
  },

  {
    term: "Macro (ICT)",
    abbr: "Macro",
    category: "Sesiones & Timing",
    color: "#e040fb",
    indicatorLabel: "Macro",
    definition: "En ICT, un 'Macro' es una ventana de 20 minutos dentro de un Kill Zone donde el precio crea un swing mínimo/máximo que luego se respeta. Diferente al 'Macro' de análisis macroeconómico.",
    details: `Los Macros de ICT (distintos del análisis macro):
• 8:50AM - 9:10AM NY: apertura del mercado americano
• 9:50AM - 10:10AM NY: primer rebalanceo del día
• 10:50AM - 11:10AM NY: segundo swing
• 1:10PM - 1:30PM NY: inicio sesión tarde
• 3:00PM - 3:15PM NY: cierre anticipado Europa

En el PSY avanzado, estos macros pueden estar marcados como zonas de atención especial.`,
    seeModule: "ICT — Inner Circle Trader",
  },

  // ─── IPDA & ENTREGA ────────────────────────────────────────────────────────

  {
    term: "Interbank Price Delivery Algorithm",
    abbr: "IPDA",
    category: "IPDA & Entrega",
    color: "#ff1744",
    indicatorLabel: "IPDA",
    definition: "El algoritmo de entrega de precios interbancario. El concepto que describe cómo los bancos y la Fed estructuran la entrega de precios en ventanas de 20, 40 y 60 días de negociación.",
    details: `El IPDA es un concepto avanzado de ICT. Define que el precio busca liquidez en un 'lookback' de:
• 20 días de negociación hacia atrás
• 40 días de negociación hacia atrás
• 60 días de negociación hacia atrás

Dentro de esa ventana, el precio busca los highs y lows más relevantes para 'entregar precio' en esas zonas.

Es la base del NWOG, NDOG, y la identificación de rangos Premium/Discount relevantes.`,
    seeModule: "IPDA — Rangos Premium/Discount",
  },

  {
    term: "Internal Range Liquidity",
    abbr: "IRL",
    category: "IPDA & Entrega",
    color: "#00e5ff",
    indicatorLabel: "IRL",
    definition: "Liquidez dentro del rango de precio actual — FVGs, OBs y niveles internos que el precio debe visitar antes de continuar hacia la liquidez externa.",
    details: `El precio generalmente 'entrega' primero la IRL antes de moverse hacia la ERL.

IRL en uptrend: los FVGs y OBs alcistas bajo el precio actual
IRL en downtrend: los FVGs y OBs bajistas sobre el precio actual

Cuando el precio retrocede a un OB o FVG interno = está entregando IRL. Después de esa entrega, puede continuar hacia la ERL.`,
    seeModule: "IPDA — Rangos Premium/Discount",
  },

  {
    term: "External Range Liquidity",
    abbr: "ERL",
    category: "IPDA & Entrega",
    color: "#ff6d00",
    indicatorLabel: "ERL",
    definition: "Liquidez fuera del rango de precio actual — los highs/lows previos significativos donde se acumulan stops. El objetivo final del precio después de entregar la IRL.",
    details: `La ERL está representada por:
• Previous Day High/Low (PDH/PDL)
• Previous Week High/Low (PWH/PWL)
• Swing Highs/Lows mayores
• ATH, ATL

En un uptrend: el precio entrega IRL (retrocede a OBs/FVGs) → luego continúa hacia ERL (PDH, PWH, ATH).

En downtrend: el precio entrega IRL (rebota a OBs/FVGs bajistas) → luego continúa hacia ERL (PDL, PWL, ATL).`,
    seeModule: "IPDA — Rangos Premium/Discount",
  },

  {
    term: "Previous Day High",
    abbr: "PDH",
    category: "IPDA & Entrega",
    color: "#00e676",
    indicatorLabel: "PDH",
    definition: "El máximo del día de negociación anterior. Zona de liquidez y referencia clave del IPDA. Ruptura del PDH con volumen = continuación alcista.",
    details: `El PDH es uno de los niveles más respetados en trading intradía. Los institutional traders lo marcan porque:
1. Hay stops de shorts justo sobre el PDH (BSL)
2. Hay órdenes de breakout compradoras sobre él
3. Es una referencia del IPDA para la entrega de precio

En el indicador PSY puede aparecer como una línea horizontal marcada "PDH".`,
    seeModule: "IPDA — Rangos Premium/Discount",
  },

  {
    term: "Previous Day Low",
    abbr: "PDL",
    category: "IPDA & Entrega",
    color: "#ff1744",
    indicatorLabel: "PDL",
    definition: "El mínimo del día de negociación anterior. Zona de liquidez — hay stops de longs y órdenes de breakout cortas bajo este nivel.",
    details: `Simétrico al PDH pero hacia abajo. El PDL representa la SSL del día anterior.

Cuando el precio se acerca al PDL, pregúntate:
1. ¿Lo va a barrer para buscar liquidez y rebotar? (sweep + reversal)
2. ¿Lo va a romper con displacement bajista? (BOS bajista continuación)

El contexto del HTF responde esa pregunta.`,
    seeModule: "IPDA — Rangos Premium/Discount",
  },

  // ─── MACRO & CONTEXTO ─────────────────────────────────────────────────────

  {
    term: "High Time Frame",
    abbr: "HTF",
    category: "Macro & Contexto",
    color: "#546e7a",
    indicatorLabel: "HTF",
    definition: "Marco temporal superior al que operas. Si operas en 1H, tu HTF es 4H y diario. Define el BIAS (sesgo direccional) general que debes seguir.",
    details: `La regla de oro del análisis multi-timeframe:
• HTF define el bias (alcista o bajista)
• MTF identifica el POI de entrada
• LTF afina la entrada exacta

Nunca operes contra el HTF. Si el HTF muestra estructura bajista (LH/LL), no busques longs en el LTF — busca confirmación de ese movimiento bajista en timeframes menores.`,
    seeModule: "BOS & CHoCH",
  },

  {
    term: "Low Time Frame",
    abbr: "LTF",
    category: "Macro & Contexto",
    color: "#546e7a",
    indicatorLabel: "LTF",
    definition: "Marco temporal inferior al de análisis — donde se afina la entrada exacta. Típicamente 5m, 15m. Usado para encontrar confirmación de vela/estructura dentro del POI del HTF.",
    details: `El LTF se usa solo DENTRO de una zona de interés identificada en el HTF/MTF. 

Proceso:
1. HTF: identifica estructura y bias
2. MTF (4H/1H): identifica el POI (OB, FVG, zona Fibonacci)
3. LTF (15m/5m): cuando el precio llega al POI, busca un CHoCH o BOS de confirmación en LTF + vela de displacement

Sin el análisis HTF primero, el LTF solo genera ruido y falsas señales.`,
    seeModule: "BOS & CHoCH",
  },

  {
    term: "Point of Interest",
    abbr: "POI",
    category: "Macro & Contexto",
    color: "#00e5ff",
    indicatorLabel: "POI",
    definition: "Zona relevante donde el precio puede reaccionar — OB, FVG, zona Fibonacci, soporte/resistencia mayor. Es donde el trader espera para tomar una decisión.",
    details: `Los POIs se identifican en el HTF primero. Un POI válido tiene:
• Una razón técnica clara (OB, FVG, Fibonacci, Estructura)
• Alineación con el bias del HTF
• Idealmente, confluencia de múltiples factores (OB + FVG + Fibonacci en la misma zona)

El PSY-SMD identifica POIs automáticamente y te alerta cuando el precio se acerca a ellos.`,
    seeModule: "Smart Money — Fundamentos",
  },

  {
    term: "Potential Reversal Zone",
    abbr: "PRZ",
    category: "Macro & Contexto",
    color: "#e040fb",
    indicatorLabel: "PRZ",
    definition: "Zona de confluencia de ratios de Fibonacci donde se espera una reversión del precio. Específicamente usado en patrones armónicos (Gartley, Bat, etc.) como punto D.",
    details: `El PRZ es el núcleo de los patrones armónicos. Para que sea válido necesitas:
1. Retroceso de XA (según el patrón: 61.8% para Gartley, 88.6% para Bat, etc.)
2. Extensión de BC (según el patrón)
3. Confluencia de Fibonacci adicionales

Cuantas más ratios converjan en el PRZ (mínimo 2-3), mayor la probabilidad de reversión.`,
    seeModule: "Patrones Armónicos",
  },

  // ─── GESTIÓN & METODOLOGÍA ────────────────────────────────────────────────

  {
    term: "Risk/Reward Ratio",
    abbr: "R:R",
    category: "Gestión & Metodología",
    color: "#00e5ff",
    indicatorLabel: "R:R",
    definition: "Relación entre la ganancia potencial y la pérdida potencial de un trade. Un R:R de 3:1 significa que ganas 3 por cada 1 que arriesgas.",
    details: `Mínimo aceptable en PSY: 2:1
Objetivo: 3:1 a 5:1

Cálculo:
R:R = (TP - Entrada) / (Entrada - SL)   [para longs]
R:R = (Entrada - TP) / (SL - Entrada)   [para shorts]

Importante: incluso con 50% de win rate, si tienes R:R 3:1 eres rentable. Con 40% win rate y R:R 3:1 también eres rentable. El R:R es más importante que el win rate.`,
    seeModule: "Gestión de Riesgo",
  },

  {
    term: "Stop Loss",
    abbr: "SL",
    category: "Gestión & Metodología",
    color: "#ff1744",
    indicatorLabel: "SL",
    definition: "Orden automática que cierra tu posición en un precio específico para limitar las pérdidas. En SMC se coloca bajo/sobre la zona de invalidación del setup.",
    details: `Colocación del SL según el setup:
• En OB: bajo el low del OB alcista (o sobre el high del OB bajista)
• En FVG: bajo el inicio del FVG alcista
• En Fibonacci: bajo el siguiente nivel de Fib (ej: si entras en 61.8%, SL bajo 78.6%)
• En Armónicos: bajo el punto X (para alcista)

NUNCA uses un SL fijo en $ o puntos sin considerar la estructura del mercado. El SL debe estar en un nivel donde, si el precio lo toca, el setup se ha invalidado.`,
    seeModule: "Gestión de Riesgo",
  },

  {
    term: "Take Profit",
    abbr: "TP",
    category: "Gestión & Metodología",
    color: "#00e676",
    indicatorLabel: "TP",
    definition: "Objetivo de precio donde tomas ganancias. En SMC típicamente se ubica en la siguiente zona de liquidez (BSL/SSL), swing high/low previo, o extensión de Fibonacci.",
    details: `Niveles de TP en SMC:
• TP1: primer nivel de liquidez/estructura importante (38.2% del movimiento)
• TP2: swing high/low previo relevante (BSL/SSL)
• TP3: extensión de Fibonacci al 127.2% o 161.8%

Estrategia óptima: cierra 50% en TP1, mueve SL a breakeven, deja correr el resto hasta TP2/TP3.`,
    seeModule: "Gestión de Riesgo",
  },

  {
    term: "Confluence",
    abbr: "Confluencia",
    category: "Gestión & Metodología",
    color: "#ffd700",
    indicatorLabel: "Confluencia",
    definition: "Cuando múltiples factores técnicos diferentes señalan el mismo nivel de precio. Mayor confluencia = mayor probabilidad. El setup ideal tiene 3+ confluencias.",
    details: `Ejemplo de confluencia máxima para un long:
✓ Estructura HTF alcista (BOS alcista reciente)
✓ Golden Pocket de Fibonacci en esa zona
✓ Order Block alcista H4 en esa zona
✓ FVG alcista parcialmente llenado
✓ Sesión London/NY activa
✓ Macro contexto favorable (DXY bajando, SPX subiendo)

Cuando tienes 5+ confluencias = entrada PREMIUM con mayor certeza de resultado.`,
    seeModule: "Smart Money — Fundamentos",
  },

  {
    term: "Bias",
    abbr: "Bias",
    category: "Gestión & Metodología",
    color: "#00e5ff",
    indicatorLabel: "Bias",
    definition: "El sesgo direccional del mercado — alcista (bullish) o bajista (bearish). Lo define el análisis de estructura HTF. Solo operas en la dirección del bias.",
    details: `Cómo determinar el Bias:
1. Mira el gráfico Semanal y Diario
2. ¿La estructura es de HH/HL (alcista) o LH/LL (bajista)?
3. ¿El precio está en Premium (bias bajista probable) o Discount (bias alcista probable)?
4. ¿La macro confirma? (DXY, SPX, Funding Rate)

Tu Bias del día lo determinas antes de la sesión. No cambias el bias intraday salvo que haya un CHoCH mayor en HTF.`,
    seeModule: "Smart Money — Fundamentos",
  },

  {
    term: "Imbalance",
    abbr: "IMB",
    category: "Gestión & Metodología",
    color: "#00e5ff",
    indicatorLabel: "IMB",
    definition: "Sinónimo de FVG (Fair Value Gap). Zona donde el precio se movió tan rápido que no hubo negociación equilibrada. El mercado tiende a volver a esas zonas para 'rebalancear'.",
    details: `El término 'Imbalance' se usa frecuentemente en flujo de órdenes y footprint charts, mientras que 'FVG' es el término del SMC/ICT.

Ambos describen lo mismo: zonas donde la demanda superó a la oferta (o viceversa) tan rápido que quedaron sin negociar. El mercado siempre tiende a retornar a esas zonas para equilibrar — esto es lo que el PSY aprovecha.`,
    seeModule: "Order Blocks & FVG",
  },

  {
    term: "Mitigation",
    abbr: "Mitigation",
    category: "Gestión & Metodología",
    color: "#ffd700",
    indicatorLabel: "Mitigation",
    definition: "El proceso por el cual el precio retorna a una zona de OB o FVG y 'consume' las órdenes pendientes ahí. Una vez mitigado, el OB/FVG pierde su fuerza.",
    details: `Un OB se considera mitigado cuando el precio cierra completamente dentro de él. Una vez mitigado = ya no funciona como zona de reacción confiable.

Un FVG se mitiga cuando el precio lo 'llena' completamente (cierra en el extremo opuesto del gap).

Regla práctica: si el precio ya visitó el OB o FVG pero NO lo mitigó completamente, puede seguir siendo válido (Mitigation Block).`,
    seeModule: "Order Blocks & FVG",
  },
];

export const contentGlosario: Record<string, any> = {
  "glosario-psy": {
    sections: [
      {
        type: "text",
        body: `Este glosario contiene todos los términos y conceptos que encontrarás en los indicadores PSYCHOMETRIKS en TradingView. Haz clic en cualquier término para ver la explicación completa. Usa el buscador para encontrar rápidamente cualquier concepto.`,
      },
      {
        type: "glossary",
        terms: PSY_TERMS,
      },
    ],
  },
};
