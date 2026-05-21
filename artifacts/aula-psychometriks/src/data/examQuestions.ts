import type { Level } from "./modules";

export interface ExamQuestion {
  id: string;
  level: Level;
  module: string;
  q: string;
  opts: string[];
  correct: number;
  explanation: string;
}

export const EXAM_QUESTIONS: ExamQuestion[] = [
  // ─── N1 FUNDAMENTOS ────────────────────────────────────────────────
  {
    id:"n1-01", level:"N1", module:"intro-mercados",
    q:"¿Qué es un exchange de criptomonedas?",
    opts:["Un banco central que emite monedas digitales","Una plataforma donde se compran y venden activos crypto","Un tipo de billetera fría (hardware wallet)","Un protocolo de minería de Bitcoin"],
    correct:1, explanation:"Un exchange es una plataforma (centralizada o descentralizada) que permite comprar, vender e intercambiar criptomonedas entre usuarios."
  },
  {
    id:"n1-02", level:"N1", module:"intro-mercados",
    q:"¿Cuál es la diferencia entre renta variable y renta fija?",
    opts:["La renta fija siempre genera ganancias; la variable siempre pérdidas","La renta variable tiene retornos inciertos; la fija ofrece flujos predeterminados","La renta variable incluye solo criptomonedas","No existe diferencia relevante entre ambas"],
    correct:1, explanation:"La renta variable (acciones, crypto) tiene retornos que dependen del mercado. La renta fija (bonos, plazo fijo) ofrece flujos de pago predeterminados."
  },
  {
    id:"n1-03", level:"N1", module:"anatomia-mercado",
    q:"¿Qué es el Bid en un libro de órdenes?",
    opts:["El precio más alto al que un comprador está dispuesto a pagar","El precio más bajo al que un vendedor quiere vender","La diferencia entre precio de compra y venta","El volumen total negociado en el día"],
    correct:0, explanation:"El Bid es el mejor precio de compra disponible — lo que los compradores están dispuestos a pagar en este momento."
  },
  {
    id:"n1-04", level:"N1", module:"anatomia-mercado",
    q:"¿Qué representa el Spread en trading?",
    opts:["El porcentaje de ganancias del broker","La diferencia entre el precio Ask y el precio Bid","El volumen de operaciones abiertas","El número de órdenes en el libro"],
    correct:1, explanation:"El Spread es la diferencia entre el Ask (precio de venta del mercado) y el Bid (precio de compra). Es el costo implícito de cada operación."
  },
  {
    id:"n1-05", level:"N1", module:"anatomia-mercado",
    q:"¿Qué tipo de orden se ejecuta al precio disponible inmediato en el mercado?",
    opts:["Orden límite","Orden stop","Orden de mercado","Orden OCO"],
    correct:2, explanation:"Una orden de mercado (market order) se ejecuta inmediatamente al mejor precio disponible, sin garantía de precio exacto."
  },
  {
    id:"n1-06", level:"N1", module:"velas-basico",
    q:"En una vela japonesa, ¿qué representa el cuerpo (body)?",
    opts:["El rango total de la sesión (mínimo a máximo)","La diferencia entre el precio de apertura y de cierre","El volumen operado en esa vela","La distancia hasta el siguiente nivel de soporte"],
    correct:1, explanation:"El cuerpo de una vela representa la diferencia entre apertura y cierre. Si el cierre es mayor, la vela es alcista; si el cierre es menor, bajista."
  },
  {
    id:"n1-07", level:"N1", module:"velas-basico",
    q:"¿Qué indica una vela Doji?",
    opts:["Una fuerte tendencia alcista","Indecisión del mercado — apertura y cierre casi iguales","Un máximo histórico alcanzado","Gran volumen de compras institucionales"],
    correct:1, explanation:"El Doji tiene apertura y cierre en el mismo nivel (o muy cerca). Indica indecisión entre compradores y vendedores, posible punto de reversión."
  },
  {
    id:"n1-08", level:"N1", module:"velas-basico",
    q:"¿Cómo se llama una vela alcista con cuerpo pequeño en la parte superior y mecha larga inferior?",
    opts:["Hammer (Martillo)","Shooting Star (Estrella Fugaz)","Engulfing Alcista","Evening Star"],
    correct:0, explanation:"El Hammer tiene mecha inferior larga (al menos 2x el cuerpo) y aparece tras una tendencia bajista. Señala posible reversión al alza."
  },
  {
    id:"n1-09", level:"N1", module:"estructura-mercado",
    q:"En análisis técnico, ¿qué es un Higher High (HH)?",
    opts:["Un mínimo más alto que el anterior","Un máximo más alto que el anterior","Un soporte que no se rompe","Un nivel de resistencia clave"],
    correct:1, explanation:"Higher High (HH) es cuando el precio hace un máximo que supera el máximo anterior. Es uno de los pilares de la tendencia alcista junto con los HL (Higher Low)."
  },
  {
    id:"n1-10", level:"N1", module:"estructura-mercado",
    q:"¿Qué define una tendencia bajista (downtrend) en estructura de mercado?",
    opts:["Series de HH y HL","Series de LH y LL (Lower High y Lower Low)","Precio consolidando en rango","Volumen creciente constante"],
    correct:1, explanation:"Una tendencia bajista se caracteriza por Lower Highs (LH — máximos decrecientes) y Lower Lows (LL — mínimos decrecientes)."
  },
  {
    id:"n1-11", level:"N1", module:"estructura-mercado",
    q:"¿Qué es un nivel de soporte?",
    opts:["Una zona donde el precio tiende a rebotar al alza","Una zona donde el precio tiende a caer","El punto máximo de una tendencia alcista","El precio de apertura diario"],
    correct:0, explanation:"Un soporte es un nivel de precio donde la demanda supera a la oferta, causando que el precio rebote hacia arriba en repetidas ocasiones."
  },
  {
    id:"n1-12", level:"N1", module:"intro-mercados",
    q:"¿Qué es una stablecoin?",
    opts:["Una moneda que solo se puede minar con GPUs","Una criptomoneda anclada a un activo estable como el dólar USD","El token nativo de Ethereum","Una criptomoneda de máxima capitalización"],
    correct:1, explanation:"Las stablecoins (USDT, USDC, DAI) mantienen su valor estable, generalmente 1:1 con el dólar. Sirven como refugio dentro del ecosistema crypto."
  },
  {
    id:"n1-13", level:"N1", module:"anatomia-mercado",
    q:"¿Qué es el volumen en trading?",
    opts:["El precio promedio ponderado de un activo","La cantidad de unidades negociadas en un período de tiempo","El tamaño de la posición abierta","El número de traders activos en el mercado"],
    correct:1, explanation:"El volumen indica cuántas unidades de un activo se transaccionaron en un período. Alto volumen = mayor convicción detrás del movimiento del precio."
  },
  {
    id:"n1-14", level:"N1", module:"velas-basico",
    q:"¿Qué indica una vela con cuerpo grande alcista y sin mechas?",
    opts:["Alta indecisión del mercado","Dominio total de compradores en esa sesión — marubozu alcista","Señal de agotamiento de la tendencia","Zona de acumulación institucional"],
    correct:1, explanation:"Un Marubozu alcista (cuerpo lleno sin mechas) indica que los compradores dominaron toda la sesión desde la apertura hasta el cierre, señal de fuerza."
  },
  {
    id:"n1-15", level:"N1", module:"estructura-mercado",
    q:"¿Qué es una resistencia en términos de análisis técnico?",
    opts:["Una zona donde la demanda supera la oferta","Una zona donde la oferta supera la demanda y el precio tiende a rechazar","El nivel de stop loss institucional","El máximo histórico de todo el activo"],
    correct:1, explanation:"Una resistencia es un nivel donde la oferta supera la demanda, causando que el precio rebote hacia abajo. Opuesto al soporte."
  },

  // ─── N2 TÉCNICO ─────────────────────────────────────────────────────
  {
    id:"n2-01", level:"N2", module:"velas-patrones",
    q:"¿Qué es un patrón Engulfing Alcista?",
    opts:["Una vela bajista que envuelve completamente la vela alcista anterior","Una vela alcista que envuelve completamente la vela bajista anterior","Dos velas del mismo tamaño en dirección opuesta","Una vela Doji seguida de una vela alcista"],
    correct:1, explanation:"El Engulfing Alcista es una vela verde que envuelve (supera en apertura y cierre) a la vela roja anterior. Señal de reversión alcista de alta fiabilidad."
  },
  {
    id:"n2-02", level:"N2", module:"velas-patrones",
    q:"¿Qué indica el patrón 'Evening Star' (Estrella Vespertina)?",
    opts:["Continuación de tendencia alcista","Reversión bajista — aparece en la cima de un uptrend","Acumulación institucional en soporte","Ruptura de resistencia clave"],
    correct:1, explanation:"El Evening Star es un patrón de 3 velas (alcista grande + Doji/indecisión + bajista grande) que señala reversión bajista en la cima de una tendencia alcista."
  },
  {
    id:"n2-03", level:"N2", module:"fibonacci",
    q:"¿Cuál es el nivel de retroceso de Fibonacci más importante para los traders?",
    opts:["23.6%","50.0%","61.8% — el 'Golden Ratio'","100%"],
    correct:2, explanation:"El nivel 61.8% (Golden Ratio) es el retroceso de Fibonacci más respetado. Deriva de la proporción áurea y es donde el precio frecuentemente encuentra soporte/resistencia."
  },
  {
    id:"n2-04", level:"N2", module:"fibonacci",
    q:"¿Qué es el 'Golden Pocket' en Fibonacci?",
    opts:["El nivel exacto de 61.8%","La zona entre 61.8% y 65% — área de alta probabilidad","El retroceso del 78.6%","La extensión del 161.8%"],
    correct:1, explanation:"El Golden Pocket es la zona entre 61.8% y 65% de retroceso. Es una de las áreas de mayor probabilidad de reversión o continuación del movimiento previo."
  },
  {
    id:"n2-05", level:"N2", module:"emas",
    q:"¿Qué señal produce el 'Golden Cross' en las EMAs?",
    opts:["La EMA 200 cruza por encima de la EMA 50 — señal bajista","La EMA 50 cruza por encima de la EMA 200 — señal alcista","Las EMAs convergen en el mismo punto","La EMA 21 toca la EMA 200"],
    correct:1, explanation:"El Golden Cross ocurre cuando la EMA de corto plazo (ej: 50) cruza hacia arriba a la de largo plazo (200). Es una señal alcista de mediano/largo plazo."
  },
  {
    id:"n2-06", level:"N2", module:"emas",
    q:"¿Qué es el 'Death Cross'?",
    opts:["La EMA 50 cruza por debajo de la EMA 200 — señal bajista","La EMA 200 supera la EMA 50 — señal alcista","El precio cae por debajo de todas las EMAs","Un patrón de velas bajista extremo"],
    correct:0, explanation:"El Death Cross ocurre cuando la EMA de corto plazo (50) cruza hacia abajo a la de largo plazo (200). Señal bajista de mediano/largo plazo."
  },
  {
    id:"n2-07", level:"N2", module:"rsi",
    q:"¿En qué zona del RSI se considera que un activo está sobrecomprado?",
    opts:["Por debajo de 30","Entre 40 y 60","Por encima de 70","Exactamente en 50"],
    correct:2, explanation:"El RSI por encima de 70 indica sobrecompra (demasiados compradores, posible corrección próxima). Por debajo de 30 indica sobreventa."
  },
  {
    id:"n2-08", level:"N2", module:"rsi",
    q:"¿Qué es una divergencia bajista en el RSI?",
    opts:["El precio hace mínimos más bajos y el RSI también","El precio hace máximos más altos pero el RSI hace máximos más bajos","El RSI supera el nivel 70 en tendencia bajista","El precio y el RSI se mueven en la misma dirección"],
    correct:1, explanation:"Divergencia bajista: el precio sube (HH) pero el RSI baja (LH). Indica debilidad del movimiento alcista y posible reversión a la baja."
  },
  {
    id:"n2-09", level:"N2", module:"sesiones",
    q:"¿Cuál es la sesión de trading con mayor volumen y volatilidad en crypto?",
    opts:["Sesión de Asia (Tokio)","Sesión de Londres","Overlap London-New York (14:00-17:00 UTC)","Sesión del Pacífico"],
    correct:2, explanation:"El overlap entre Londres y Nueva York (14:00-17:00 UTC) concentra el mayor volumen institucional del día. Es donde ocurren los movimientos más explosivos."
  },
  {
    id:"n2-10", level:"N2", module:"sesiones",
    q:"¿Cuándo abre la sesión de Nueva York?",
    opts:["08:00 UTC","13:30 UTC","18:00 UTC","00:00 UTC"],
    correct:1, explanation:"La sesión de Nueva York abre a las 13:30 UTC (9:30 AM EST). Es la sesión más relevante para el mercado de acciones y tiene gran impacto en crypto."
  },
  {
    id:"n2-11", level:"N2", module:"fibonacci",
    q:"¿Para qué sirven las extensiones de Fibonacci?",
    opts:["Para encontrar zonas de retroceso dentro de una tendencia","Para proyectar posibles objetivos de precio (targets) más allá del máximo/mínimo anterior","Para medir el volumen en una zona específica","Para calcular el riesgo de la operación"],
    correct:1, explanation:"Las extensiones de Fibonacci (161.8%, 200%, 261.8%) proyectan targets de precio más allá del swing anterior, útiles para fijar take profits."
  },
  {
    id:"n2-12", level:"N2", module:"emas",
    q:"¿Qué EMA se considera el indicador de tendencia de largo plazo por excelencia?",
    opts:["EMA 9","EMA 21","EMA 50","EMA 200"],
    correct:3, explanation:"La EMA 200 es el indicador de tendencia de largo plazo más seguido. Si el precio está por encima: tendencia alcista macro. Por debajo: tendencia bajista macro."
  },
  {
    id:"n2-13", level:"N2", module:"velas-patrones",
    q:"¿Qué es el patrón 'Three White Soldiers' (Tres Soldados Blancos)?",
    opts:["Tres velas bajistas consecutivas que señalan continuación bajista","Tres velas alcistas consecutivas con cuerpos grandes que señalan fuerza compradora","Un patrón de reversión bajista en la cima","Tres Dojis seguidos indicando indecisión extrema"],
    correct:1, explanation:"Tres Soldados Blancos son 3 velas alcistas consecutivas con cuerpos grandes que abren dentro del cuerpo anterior y cierran en nuevos máximos. Señal de fuerza alcista."
  },
  {
    id:"n2-14", level:"N2", module:"rsi",
    q:"¿Qué indica el RSI en 50?",
    opts:["Activo sobrecomprado","Activo en zona neutra — equilibrio entre compradores y vendedores","Activo en zona de sobreventa extrema","Divergencia confirmada"],
    correct:1, explanation:"El nivel 50 del RSI representa equilibrio. Por encima = momentum alcista predominante; por debajo = momentum bajista. Muchos traders lo usan como filtro de tendencia."
  },
  {
    id:"n2-15", level:"N2", module:"sesiones",
    q:"¿Qué caracteriza a la sesión de Asia en términos de volatilidad?",
    opts:["Es la sesión con mayor volatilidad del día","Suele tener menor volatilidad y movimientos más lentos","Siempre marca los máximos del día","Tiene el mayor volumen de órdenes institucionales"],
    correct:1, explanation:"La sesión asiática (Tokio) suele tener menor volatilidad y volumen comparada con Londres y NY. El precio puede acumular rangos para los movimientos que vendrán."
  },

  // ─── N3 SMART MONEY ─────────────────────────────────────────────────
  {
    id:"n3-01", level:"N3", module:"smart-money-intro",
    q:"¿Qué significa SMC (Smart Money Concepts)?",
    opts:["Una estrategia de inversión en startups tecnológicas","Un conjunto de conceptos para entender y seguir el comportamiento del dinero institucional","Un indicador técnico de volatilidad","Una metodología basada en medias móviles exponenciales"],
    correct:1, explanation:"SMC es una metodología que busca entender cómo operan las instituciones (bancos, fondos), rastreando su footprint en el mercado para operar en la misma dirección."
  },
  {
    id:"n3-02", level:"N3", module:"bos-choch",
    q:"¿Qué es un BOS (Break of Structure)?",
    opts:["Cuando el precio rompe un nivel de soporte sin volumen","Cuando el precio rompe el último máximo o mínimo significativo de la estructura","Cuando dos medias móviles se cruzan","Una ruptura falsa del rango de consolidación"],
    correct:1, explanation:"BOS ocurre cuando el precio rompe el swing point clave anterior (último HH en alcista o último LL en bajista), confirmando la continuación de la tendencia."
  },
  {
    id:"n3-03", level:"N3", module:"bos-choch",
    q:"¿Qué indica un CHoCH (Change of Character)?",
    opts:["Continuación de la tendencia actual","Un posible cambio de dirección — el precio rompe contra la estructura dominante","Aumento repentino del volumen","La formación de un Order Block bajista"],
    correct:1, explanation:"CHoCH indica un posible giro de tendencia. Si el precio estaba haciendo HH/HL y rompe hacia abajo el último HL, hay un Cambio de Carácter — posible inicio de downtrend."
  },
  {
    id:"n3-04", level:"N3", module:"order-blocks",
    q:"¿Qué es un Order Block (OB) alcista?",
    opts:["La última vela bajista antes de un movimiento alcista impulsivo","La primera vela alcista de una tendencia","Una zona de gap no rellenado","Un clúster de órdenes limit en el libro"],
    correct:0, explanation:"Un OB alcista es la última vela bajista (o rango de velas) justo antes de un movimiento impulsivo al alza. Las instituciones colocan allí sus órdenes de compra."
  },
  {
    id:"n3-05", level:"N3", module:"order-blocks",
    q:"¿Qué es un Fair Value Gap (FVG)?",
    opts:["La diferencia entre el precio spot y el precio futuro","Un gap de ineficiencia entre 3 velas donde el precio no ha regresado a rellenar","Una zona sin liquidez por encima de los máximos","El espacio entre dos EMAs en un ribbon"],
    correct:1, explanation:"El FVG (también llamado imbalance) es la zona entre la mecha superior de la vela 1 y la mecha inferior de la vela 3, en un movimiento de 3 velas. El precio tiende a rellenarlo."
  },
  {
    id:"n3-06", level:"N3", module:"liquidez",
    q:"¿Qué es la BSL (Buy Side Liquidity)?",
    opts:["Órdenes de venta acumuladas por encima de máximos previos","Órdenes de compra institucionales en zonas de descuento","El volumen de compras en el libro de órdenes","El total de posiciones largas abiertas"],
    correct:0, explanation:"La BSL se ubica por encima de máximos previos donde los traders tienen sus stop losses. Las instituciones pueden 'cazar' esa liquidez antes de invertir la dirección."
  },
  {
    id:"n3-07", level:"N3", module:"liquidez",
    q:"¿Qué es un 'Inducement' en SMC?",
    opts:["Una señal de confirmación de tendencia","Una trampa de liquidez creada por las instituciones para atraer órdenes en la dirección incorrecta","Un patrón de continuación alcista","Una divergencia en el order flow"],
    correct:1, explanation:"El Inducement es una trampa — las instituciones provocan un movimiento que parece una señal de entrada para atraer a traders retail antes de moverse en la dirección real."
  },
  {
    id:"n3-08", level:"N3", module:"amd",
    q:"¿Cuáles son las tres fases del modelo AMD institucional?",
    opts:["Análisis, Marcación, Distribución","Acumulación, Manipulación, Distribución","Alcista, Movimiento, Declive","Ataque, Mantenimiento, Defensa"],
    correct:1, explanation:"AMD: Acumulación (instituciones acumulan posición), Manipulación (fakeout para cazar stops), Distribución (movimiento real en la dirección de la posición acumulada)."
  },
  {
    id:"n3-09", level:"N3", module:"crt",
    q:"En la Candle Range Theory (CRT), ¿qué es una 'Inside Bar'?",
    opts:["Una vela que supera el rango de la vela anterior","Una vela cuyo rango completo está contenido dentro del rango de la vela anterior","Una vela de alta volatilidad","La primera vela de una sesión de trading"],
    correct:1, explanation:"Una Inside Bar tiene su high menor que el high anterior y su low mayor que el low anterior. Representa compresión — el mercado se contiene antes de una expansión."
  },
  {
    id:"n3-10", level:"N3", module:"ipda",
    q:"¿Qué es el 'Equilibrium' en IPDA?",
    opts:["El precio más operado en el día","El 50% del rango entre un máximo y mínimo relevante — divide zona Premium de Discount","El nivel de soporte más fuerte","El precio de cierre de la sesión anterior"],
    correct:1, explanation:"El Equilibrium (50% del rango) divide el rango en Premium (por encima — caro para comprar) y Discount (por debajo — barato para comprar). Las instituciones compran en Discount."
  },
  {
    id:"n3-11", level:"N3", module:"order-blocks",
    q:"¿Qué es un Breaker Block?",
    opts:["Un Order Block que ha fallado y luego actúa como zona de rechazo en la dirección opuesta","Un OB alcista de muy alta probabilidad","El primer Order Block de una tendencia","Un FVG de múltiples velas"],
    correct:0, explanation:"Un Breaker Block es un OB que fue perforado por el precio (falló como soporte/resistencia) y luego actúa como zona de rechazo en la dirección opuesta — muy poderoso."
  },
  {
    id:"n3-12", level:"N3", module:"smart-money-intro",
    q:"¿Qué es el 'Market Structure Shift' (MSS)?",
    opts:["Una variación del indicador RSI","Un cambio de estructura que confirma el inicio de un nuevo movimiento direccional","El momento donde el mercado alcanza un nuevo ATH","Una ruptura falsa sin volumen"],
    correct:1, explanation:"El MSS es similar al CHoCH — es la confirmación de que la estructura del mercado ha cambiado de dirección. Muchos traders lo usan como señal de entrada."
  },
  {
    id:"n3-13", level:"N3", module:"liquidez",
    q:"¿Dónde se encuentran típicamente los stop losses de los traders retail?",
    opts:["En niveles aleatorios sin lógica técnica","Por debajo de mínimos y por encima de máximos relevantes — zonas de liquidez","En el precio de apertura diaria","En el nivel 50 del RSI"],
    correct:1, explanation:"Los retail suelen poner stops por debajo de soportes/mínimos o por encima de resistencias/máximos. Las instituciones saben esto y van a buscar esa liquidez antes de moverse."
  },
  {
    id:"n3-14", level:"N3", module:"amd",
    q:"¿Qué ocurre en la fase de 'Manipulación' del modelo AMD?",
    opts:["Las instituciones acumulan posición gradualmente","El precio hace un movimiento falso (fakeout) para cazar stops y liquidez antes del movimiento real","El precio inicia el movimiento direccional principal","Las instituciones venden su posición acumulada"],
    correct:1, explanation:"En la Manipulación, el precio hace un movimiento en falso (spike) que activa stops de traders retail y atrae liquidez. Luego viene el movimiento real en la dirección opuesta."
  },
  {
    id:"n3-15", level:"N3", module:"bos-choch",
    q:"¿Cuál es la diferencia entre BOS y CHoCH?",
    opts:["No hay diferencia, son el mismo concepto","BOS confirma continuación de tendencia; CHoCH señala posible inversión de tendencia","BOS es para marcos temporales largos; CHoCH para cortos","CHoCH es más fuerte que el BOS en todos los casos"],
    correct:1, explanation:"BOS = estructura rompe en la dirección de la tendencia (confirma continuación). CHoCH = estructura rompe contra la tendencia dominante (señal de posible reversión)."
  },

  // ─── N4 AVANZADO ────────────────────────────────────────────────────
  {
    id:"n4-01", level:"N4", module:"wyckoff",
    q:"¿Cuáles son las 4 fases del método Wyckoff?",
    opts:["Inicio, Medio, Fin, Reversión","Acumulación, Markup, Distribución, Markdown","Compra, Venta, Pausa, Explosión","Soporte, Resistencia, Rango, Ruptura"],
    correct:1, explanation:"Wyckoff define 4 fases: Acumulación (instituciones compran en bajo precio), Markup (precio sube), Distribución (instituciones venden en alto), Markdown (precio cae)."
  },
  {
    id:"n4-02", level:"N4", module:"wyckoff",
    q:"¿Qué es el 'Spring' en Wyckoff?",
    opts:["El inicio de la fase de distribución","Una rotura falsa por debajo del soporte de acumulación para cazar stops antes del markup","El primer movimiento alcista del markup","Un patrón de continuación en tendencia bajista"],
    correct:1, explanation:"El Spring es una ruptura falsa debajo del soporte del rango de acumulación. Caza los stops de los bajistas y permite a las instituciones finalizar su acumulación a mejores precios."
  },
  {
    id:"n4-03", level:"N4", module:"cvd",
    q:"¿Qué mide el CVD (Cumulative Volume Delta)?",
    opts:["El volumen total acumulado en todos los exchanges","La diferencia acumulada entre volumen de compras agresivas y ventas agresivas","El open interest total del mercado","La correlación entre volumen y precio"],
    correct:1, explanation:"El CVD acumula la diferencia entre el volumen que se ejecuta en el Ask (compras agresivas) vs el Bid (ventas agresivas), mostrando la presión neta compradora/vendedora."
  },
  {
    id:"n4-04", level:"N4", module:"cvd",
    q:"¿Qué indica una divergencia bajista en el CVD?",
    opts:["El CVD sube mientras el precio baja","El precio sube a nuevos máximos pero el CVD no confirma (baja o no sube)","El CVD y el precio se mueven en la misma dirección","El volumen total del mercado disminuye"],
    correct:1, explanation:"Divergencia bajista en CVD: el precio hace nuevos máximos pero el CVD no los confirma (las ventas agresivas están dominando). Señal de debilidad del movimiento alcista."
  },
  {
    id:"n4-05", level:"N4", module:"open-interest",
    q:"¿Qué es el Open Interest (OI)?",
    opts:["El número de órdenes en el libro de órdenes","El número total de contratos de futuros o derivados abiertos que aún no se han liquidado","El volumen operado en el día actual","El interés acumulado de compradores en el mercado spot"],
    correct:1, explanation:"El OI es el número total de contratos de futuros/opciones abiertos. No se cierra con una transacción sino cuando se toma la posición contraria o vence el contrato."
  },
  {
    id:"n4-06", level:"N4", module:"open-interest",
    q:"¿Qué significa que el precio sube con OI creciente?",
    opts:["Señal bajista — los shorts están ganando","Señal alcista — se están abriendo posiciones largas nuevas en la tendencia","El mercado está en sobreventa","Los traders están cerrando sus posiciones cortas"],
    correct:1, explanation:"Precio↑ + OI↑ indica que se están abriendo posiciones largas nuevas. Hay convicción alcista. Diferente a precio↑ + OI↓ (short squeeze — cierres de shorts)."
  },
  {
    id:"n4-07", level:"N4", module:"dominancias",
    q:"¿Qué indica cuando la dominancia de BTC (BTC.D) cae?",
    opts:["Bitcoin está bajando de precio","El capital fluye de Bitcoin hacia altcoins — posible inicio de Altcoin Season","Los stablecoins dominan el mercado","El mercado crypto en general está cayendo"],
    correct:1, explanation:"Cuando BTC.D cae, significa que las altcoins están ganando más valor relativo que Bitcoin. Suele indicar Altcoin Season — momento de mayor performance de las alts."
  },
  {
    id:"n4-08", level:"N4", module:"dominancias",
    q:"¿Qué indica una USDT.D (dominancia de USDT) alta y en subida?",
    opts:["El mercado es alcista y el dinero fluye hacia crypto","El capital está saliendo del mercado a stablecoins — señal de precaución o miedo","Bitcoin está por alcanzar un nuevo ATH","El mercado DeFi está en expansión"],
    correct:1, explanation:"USDT.D alta y creciente indica que el capital está en stablecoins (al margen). Señal de miedo o precaución. Cuando USDT.D cae, el dinero vuelve al mercado."
  },
  {
    id:"n4-09", level:"N4", module:"wyckoff",
    q:"¿Qué es el 'UTAD' (Upthrust After Distribution) en Wyckoff?",
    opts:["El inicio de la fase de acumulación institucional","Una ruptura falsa por encima de la resistencia de distribución, análogo al Spring pero en distribución","El momento de máximo volumen en la tendencia alcista","El primer movimiento bajista del markdown"],
    correct:1, explanation:"UTAD es el equivalente bajista del Spring. Una ruptura falsa por encima de la resistencia de distribución que caza los stops de los cortos antes del Markdown."
  },
  {
    id:"n4-10", level:"N4", module:"open-interest",
    q:"¿Qué es el Funding Rate en futuros perpetuos?",
    opts:["La tasa de interés del broker por mantener la posición","Una tasa pagada periódicamente entre longs y shorts para mantener el precio perpetuo cerca del spot","El porcentaje de ganancias cobrado por el exchange","El costo de conversión entre futuros y spot"],
    correct:1, explanation:"El Funding Rate es un mecanismo de equilibrio: si hay más longs, pagan a los shorts (y viceversa). Funding positivo alto = muchos longs = posible corrección inminente."
  },

  // ─── N5 MACRO ───────────────────────────────────────────────────────
  {
    id:"n5-01", level:"N5", module:"dxy",
    q:"¿Qué representa el DXY (Índice del Dólar)?",
    opts:["El precio del dólar respecto al oro","El valor del dólar frente a una cesta de 6 monedas principales (EUR, JPY, GBP, CAD, SEK, CHF)","El total de dólares en circulación global","La tasa de inflación de Estados Unidos"],
    correct:1, explanation:"El DXY mide el dólar contra una cesta de 6 monedas: EUR (57.6%), JPY (13.6%), GBP (11.9%), CAD (9.1%), SEK (4.2%), CHF (3.6%). Su ponderación mayor es EUR/USD."
  },
  {
    id:"n5-02", level:"N5", module:"dxy",
    q:"¿Cuál es la relación histórica típica entre el DXY y Bitcoin?",
    opts:["Correlación positiva — ambos suben y bajan juntos","Correlación negativa — cuando el DXY sube, BTC tiende a bajar y viceversa","No existe relación estadística entre ambos","El DXY solo afecta a las acciones, no a crypto"],
    correct:1, explanation:"Históricamente hay correlación inversa: DXY↑ = BTC↓ (dólar fuerte = salida de activos de riesgo). DXY↓ = BTC↑ (dólar débil = flujo hacia activos de riesgo)."
  },
  {
    id:"n5-03", level:"N5", module:"vix",
    q:"¿Qué representa el VIX?",
    opts:["El volumen total del mercado de opciones","La volatilidad implícita esperada a 30 días del S&P 500, conocido como 'índice del miedo'","El valor de capitalización del mercado crypto","El índice de inflación de Estados Unidos"],
    correct:1, explanation:"El VIX mide la volatilidad implícita del S&P 500 a 30 días. VIX alto (>30) = miedo/incertidumbre. VIX bajo (<15) = complacencia. Tiende a moverse inverso al mercado."
  },
  {
    id:"n5-04", level:"N5", module:"bonos",
    q:"¿Qué ocurre típicamente cuando los yields de bonos del Tesoro suben?",
    opts:["Las acciones y crypto tienden a subir por mayor confianza","Las acciones y activos de riesgo tienden a caer — el dinero va a bonos que ahora ofrecen mejor retorno","El oro sube correlativamente","El dólar se debilita automáticamente"],
    correct:1, explanation:"Yields altos = bonos ofrecen mejor retorno sin riesgo = capital sale de acciones y activos de riesgo hacia bonos. BTC y acciones tech son especialmente sensibles."
  },
  {
    id:"n5-05", level:"N5", module:"bonos",
    q:"¿Qué es la inversión de la curva de rendimiento (inverted yield curve)?",
    opts:["Cuando los bonos de corto plazo tienen yields más altos que los de largo plazo — señal de recesión","Cuando los bonos del Tesoro suben de precio uniformemente","Un error en el sistema de trading","Cuando el Fed aumenta tasas de corto plazo únicamente"],
    correct:0, explanation:"La curva invertida (2Y yield > 10Y yield) históricamente precede recesiones. Indica que los inversores esperan caída de tasas en el futuro — señal de desaceleración económica."
  },
  {
    id:"n5-06", level:"N5", module:"oro",
    q:"¿Cuál es la relación entre el oro y el dólar?",
    opts:["Correlación positiva fuerte — ambos suben juntos","Correlación negativa — dólar fuerte = oro débil y viceversa","Sin correlación estadística relevante","El oro siempre sube en períodos inflacionarios independientemente del dólar"],
    correct:1, explanation:"El oro tiene correlación negativa con el dólar. DXY↑ = XAU↓ (comprar oro cuesta más en otras monedas). DXY↓ = XAU↑. El oro también actúa como refugio ante inflación."
  },
  {
    id:"n5-07", level:"N5", module:"ciclos-crypto",
    q:"¿Cada cuánto tiempo ocurre el Halving de Bitcoin?",
    opts:["Cada 2 años","Aproximadamente cada 4 años (cada 210,000 bloques)","Cada año exactamente","Cuando la inflación supera el 5%"],
    correct:1, explanation:"El Halving ocurre cada ~210,000 bloques (≈4 años). Reduce a la mitad la recompensa por bloque minado, disminuyendo la emisión de BTC. Históricamente precede bull markets."
  },
  {
    id:"n5-08", level:"N5", module:"ciclos-crypto",
    q:"¿Qué sucede típicamente 12-18 meses después de un Halving de Bitcoin?",
    opts:["El mercado cae a nuevos mínimos históricos","Bitcoin suele alcanzar nuevos máximos históricos (ATH) impulsado por la reducción de oferta","El ciclo de altcoins termina abruptamente","Los mineros abandonan la red masivamente"],
    correct:1, explanation:"El patrón histórico post-halving: ~12-18 meses después, BTC alcanza nuevos ATH. La reducción de oferta (menos BTC minados) con demanda constante o creciente impulsa el precio."
  },
  {
    id:"n5-09", level:"N5", module:"indices",
    q:"¿Por qué el NASDAQ 100 tiene alta correlación con Bitcoin?",
    opts:["Porque Bitcoin está incluido en el índice","Ambos son activos de alta volatilidad y crecimiento (growth assets) que responden igual a liquidez y tasas de interés","Comparten los mismos inversores institucionales únicamente","Porque el NASDAQ regula el mercado crypto"],
    correct:1, explanation:"BTC y NASDAQ comparten perfil de activo de riesgo (growth). Cuando la Fed sube tasas o hay risk-off, ambos caen. Cuando hay liquidez y risk-on, ambos suben."
  },
  {
    id:"n5-10", level:"N5", module:"mag7",
    q:"¿Qué representa NVIDIA (NVDA) en el contexto del mercado actual?",
    opts:["Solo una empresa de videojuegos que coincidió con el boom de IA","El proveedor dominante de GPUs para IA — su rendimiento es indicador clave del ciclo tecnológico","Un índice bursátil de empresas tecnológicas","Una empresa de semiconductores sin relación con crypto ni IA"],
    correct:1, explanation:"NVDA es central al ciclo de IA. Sus GPUs alimentan el entrenamiento de modelos de IA. Su performance es indicador del apetito inversor por tecnología y crecimiento futuro."
  },
  {
    id:"n5-11", level:"N5", module:"dxy",
    q:"¿Qué evento macro suele fortalecer el DXY?",
    opts:["La Fed bajando tasas de interés agresivamente","La Fed subiendo tasas (hawkish) o crisis globales que generan vuelo a la seguridad (flight to safety)","El déficit fiscal creciente de EE.UU.","La expansión cuantitativa (QE) de la Fed"],
    correct:1, explanation:"El DXY sube cuando la Fed sube tasas (diferencial de tasas favorece al dólar) o en crisis globales donde el dólar es el activo refugio por excelencia."
  },

  // ─── N6 METODOLOGÍAS ────────────────────────────────────────────────
  {
    id:"n6-01", level:"N6", module:"elliott-waves",
    q:"¿Cuántas ondas tiene un ciclo de impulso completo de Elliott?",
    opts:["3 ondas de impulso","5 ondas de impulso + 3 ondas de corrección = 8 ondas totales","7 ondas en total","4 ondas de impulso + 2 de corrección"],
    correct:1, explanation:"El ciclo Elliott completo: 5 ondas de impulso (1,2,3,4,5) en la dirección de la tendencia + 3 ondas de corrección (A,B,C). Total = 8 ondas."
  },
  {
    id:"n6-02", level:"N6", module:"elliott-waves",
    q:"¿Cuál es la onda más poderosa y extensa en Elliott Wave?",
    opts:["Onda 1","Onda 2","Onda 3","Onda 5"],
    correct:2, explanation:"La onda 3 suele ser la más larga y poderosa del impulso. Regla: la onda 3 NUNCA puede ser la más corta de las ondas de impulso (1, 3, 5)."
  },
  {
    id:"n6-03", level:"N6", module:"armonicos",
    q:"¿Cuál es el nivel de retroceso XA del patrón Gartley?",
    opts:["61.8%","78.6%","88.6%","127.2%"],
    correct:1, explanation:"En el patrón Gartley, el punto B retrocede exactamente 61.8% del movimiento XA. Es uno de los patrones armónicos más clásicos definidos por H.M. Gartley en 1935."
  },
  {
    id:"n6-04", level:"N6", module:"ict",
    q:"¿Qué son las 'Killzones' en ICT?",
    opts:["Zonas de precio de alto riesgo que deben evitarse","Ventanas de tiempo específicas (London Open, NY Open) donde hay mayor probabilidad de movimiento institucional","Los niveles de stop loss institucionales","Los Order Blocks de máxima fuerza"],
    correct:1, explanation:"Las Killzones de ICT son ventanas horarias clave: London Open (07:00-09:00 UTC), NY Open (12:00-14:00 UTC), London Close (15:00-16:00 UTC). Donde actúa el dinero institucional."
  },
  {
    id:"n6-05", level:"N6", module:"ict",
    q:"¿Qué es el 'Judas Swing' en la metodología ICT?",
    opts:["Una señal alcista de gran potencia","Un movimiento falso al inicio de la sesión en dirección opuesta al movimiento real del día","Un tipo de Order Block especial","El máximo o mínimo de la sesión asiática"],
    correct:1, explanation:"El Judas Swing es un movimiento falso que ocurre al inicio de una sesión clave (generalmente London Open), engañando a los traders retail antes del movimiento real."
  },
  {
    id:"n6-06", level:"N6", module:"gann",
    q:"¿Qué es el 'Cuadrado de 9' de Gann?",
    opts:["Una tabla de multiplicación aplicada al trading","Una espiral matemática que convierte precio en tiempo y tiempo en precio para identificar niveles clave","Una configuración de 9 velas consecutivas","Un oscilador de momentum de 9 períodos"],
    correct:1, explanation:"El Cuadrado de 9 de Gann es una espiral de números que relaciona precio y tiempo. Gann creía que el mercado se mueve en ciclos de tiempo y precio geométricamente relacionados."
  },
  {
    id:"n6-07", level:"N6", module:"armonicos",
    q:"¿Qué diferencia al patrón 'Crab' de otros patrones armónicos?",
    opts:["Tiene solo 3 puntos (XAB)","Su punto D se extiende hasta el 161.8% de XA — tiene la extensión más extrema de todos los patrones","Es el único patrón que funciona solo en mercados bajistas","Requiere una retroceso del 100% en el punto B"],
    correct:1, explanation:"El Crab Harmónico tiene la extensión más extrema: D = 161.8% de XA. Suele marcar reversiones muy poderosas precisamente por lo extremo de su extensión."
  },

  // ─── N7 GESTIÓN ─────────────────────────────────────────────────────
  {
    id:"n7-01", level:"N7", module:"risk-management",
    q:"¿Qué es la regla del 1-2% en gestión de riesgo?",
    opts:["Nunca ganar más del 2% en una operación","Nunca arriesgar más del 1-2% del capital total en una sola operación","Siempre operar con apalancamiento mínimo del 1%","Mantener siempre el 1-2% en stablecoins"],
    correct:1, explanation:"La regla del 1-2%: en cada operación, el máximo loss posible no debe superar el 1-2% del capital total. Protege contra rachas perdedoras prolongadas."
  },
  {
    id:"n7-02", level:"N7", module:"risk-management",
    q:"¿Qué es la relación riesgo/recompensa (R:R)?",
    opts:["El porcentaje de operaciones ganadoras vs perdedoras","La relación entre la ganancia potencial y la pérdida máxima de una operación","El apalancamiento utilizado en la operación","El ratio entre capital invertido y capital total"],
    correct:1, explanation:"R:R compara ganancia potencial vs pérdida máxima. R:R de 1:3 significa que si arriesgás $100, tu target es $300. Con 40% win rate y R:R 1:3 sos rentable."
  },
  {
    id:"n7-03", level:"N7", module:"psicologia",
    q:"¿Qué es el FOMO en trading?",
    opts:["Un indicador técnico de sentimiento","Fear Of Missing Out — el miedo a perderse una subida que lleva a entrar a destiempo","Una estrategia de entrada en breakouts","Un tipo de orden de compra en exchanges"],
    correct:1, explanation:"FOMO (Fear Of Missing Out): entrar a una operación tarde, por miedo a perderse la suba, generalmente cuando el precio ya está extendido. Es una de las causas más comunes de pérdidas."
  },
  {
    id:"n7-04", level:"N7", module:"psicologia",
    q:"¿Qué es el 'sesgo de confirmación' en trading?",
    opts:["Confirmar la entrada con múltiples indicadores","La tendencia a buscar información que confirma nuestra creencia preexistente e ignorar la contraria","El proceso de validar una operación con el mentor","Esperar confirmación de ruptura antes de entrar"],
    correct:1, explanation:"El sesgo de confirmación hace que busquemos solo evidencia que apoye nuestra tesis (alcista o bajista) e ignoremos señales contrarias. Distorsiona el análisis objetivo."
  },
  {
    id:"n7-05", level:"N7", module:"risk-management",
    q:"¿Qué es el 'Drawdown Máximo' y por qué es importante?",
    opts:["La ganancia máxima histórica de una cuenta","La pérdida máxima desde un pico a un valle en el historial de una cuenta — mide la resistencia del sistema","El apalancamiento máximo permitido por el exchange","El máximo de operaciones perdedoras consecutivas"],
    correct:1, explanation:"El Max Drawdown mide la mayor caída desde un pico hasta el siguiente valle. Un sistema con DD de 50% necesita +100% para recuperarse. Clave para evaluar la robustez de una estrategia."
  },
  {
    id:"n7-06", level:"N7", module:"diario-trading",
    q:"¿Cuál es el principal beneficio de mantener un diario de trading?",
    opts:["Automatizar las operaciones futuras","Identificar patrones en los errores y aciertos para mejorar continuamente como trader","Calcular automáticamente los impuestos","Compartir resultados con la comunidad"],
    correct:1, explanation:"El diario de trading permite identificar qué setups funcionan, en qué sesiones se opera mejor, qué errores se repiten y cómo evoluciona la psicología. Es la herramienta de mejora más poderosa."
  },
  {
    id:"n7-07", level:"N7", module:"psicologia",
    q:"¿Qué es la 'sobreoperativa' (overtrading) y por qué es peligrosa?",
    opts:["Operar en múltiples timeframes — estrategia avanzada recomendada","Operar más de lo necesario por aburrimiento, FOMO o necesidad de recuperar — aumenta comisiones y errores","Usar múltiples indicadores en simultáneo","Tener más de 10 posiciones abiertas a la vez"],
    correct:1, explanation:"El overtrading destruye cuentas: más operaciones sin edge = más comisiones, más errores, peor calidad de entradas. Los mejores traders operan pocas veces pero con alta convicción."
  },

  // ─── N8 ACCIONES & RENTA FIJA ───────────────────────────────────────
  {
    id:"n8-01", level:"N8", module:"analisis-fundamental",
    q:"¿Qué mide el ratio P/E (Price to Earnings)?",
    opts:["El porcentaje de ganancias distribuidas como dividendo","Cuánto pagan los inversores por cada dólar de ganancias de la empresa — valora si está cara o barata","La deuda total de la empresa dividida por sus activos","El crecimiento de ingresos en el último año"],
    correct:1, explanation:"P/E = Precio de la acción / Ganancias por acción. P/E alto puede indicar empresa cara o de alto crecimiento esperado. P/E bajo puede indicar valor o problemas. Debe compararse con el sector."
  },
  {
    id:"n8-02", level:"N8", module:"earnings-reports",
    q:"¿Qué significa que una empresa 'beatee' (supere) el EPS estimado?",
    opts:["Que la empresa tuvo pérdidas menores a lo esperado","Que sus ganancias por acción fueron mayores a las estimaciones de los analistas — generalmente impulsa el precio","Que sus ventas igualaron exactamente las proyecciones","Que la dirección redujo su guidance para el próximo trimestre"],
    correct:1, explanation:"Beat de EPS = ganancias reales superan el consenso de analistas. Suele impulsar el precio al alza. El mercado reacciona más a si supera o no las expectativas que al número absoluto."
  },
  {
    id:"n8-03", level:"N8", module:"dividend-investing",
    q:"¿Qué es el 'Dividend Yield' de una acción?",
    opts:["El dividendo total pagado en la historia de la empresa","El dividendo anual dividido entre el precio actual de la acción — expresa el rendimiento por dividendo","El crecimiento del dividendo en los últimos 5 años","El porcentaje de ganancias distribuidas como dividendo (payout ratio)"],
    correct:1, explanation:"Dividend Yield = (Dividendo Anual / Precio Acción) × 100. Si una acción vale $100 y paga $4/año de dividendo, el yield es 4%. Útil para comparar ingresos pasivos."
  },
  {
    id:"n8-04", level:"N8", module:"bonos-acciones",
    q:"¿Qué es la 'Duration' de un bono?",
    opts:["El tiempo hasta el vencimiento del bono","Una medida de la sensibilidad del precio del bono a cambios en las tasas de interés","El total de pagos de cupón restantes","La calificación crediticia del emisor"],
    correct:1, explanation:"Duration mide cuánto cambia el precio de un bono por cada 1% de cambio en tasas. Bono con Duration 10: si tasas suben 1%, el precio cae ~10%. Más Duration = más sensibilidad."
  },
  {
    id:"n8-05", level:"N8", module:"opciones-financieras",
    q:"¿Qué es una opción Call?",
    opts:["El derecho a vender un activo a un precio pactado antes de una fecha específica","El derecho a comprar un activo a un precio pactado (strike) antes de una fecha de vencimiento","Una obligación de comprar el activo al precio de mercado","Un contrato de futuros sobre tasas de interés"],
    correct:1, explanation:"Una Call da el DERECHO (no obligación) de COMPRAR el activo subyacente al precio strike antes del vencimiento. Comprás Calls cuando esperás que el precio suba."
  },
  {
    id:"n8-06", level:"N8", module:"opciones-financieras",
    q:"¿Qué es el 'Delta' en las Greeks de opciones?",
    opts:["El tiempo que queda hasta el vencimiento","La tasa de cambio del precio de la opción respecto al precio del activo subyacente — sensibilidad al precio","La volatilidad implícita de la opción","El costo de llevar la posición en el tiempo"],
    correct:1, explanation:"Delta mide cuánto cambia el precio de la opción por cada $1 de movimiento del subyacente. Call Delta entre 0 y 1; Put Delta entre -1 y 0. Delta 0.5 = opción At-The-Money."
  },
  {
    id:"n8-07", level:"N8", module:"analisis-fundamental",
    q:"¿Qué es el Free Cash Flow (FCF)?",
    opts:["El efectivo disponible en la caja de la empresa","El flujo de caja operativo menos el Capex (gastos de capital) — el dinero real que genera el negocio","Los dividendos totales pagados a accionistas","Las ganancias netas después de impuestos"],
    correct:1, explanation:"FCF = Flujo operativo - Capex. Es el dinero real que la empresa genera y puede usar para pagar dividendos, recomprar acciones, pagar deuda o invertir. Es la métrica de valoración más honesta."
  },
  {
    id:"n8-08", level:"N8", module:"dividend-investing",
    q:"¿Qué son los 'Dividend Aristocrats'?",
    opts:["Acciones con el mayor dividendo absoluto del mercado","Empresas del S&P 500 que han aumentado su dividendo consecutivamente por al menos 25 años","Empresas europeas con dividendos especiales anuales","Fondos de inversión especializados en dividendos"],
    correct:1, explanation:"Los Dividend Aristocrats son empresas del S&P 500 con 25+ años consecutivos de incremento de dividendo. Son consideradas las más estables y de mayor calidad del mercado americano."
  },
  {
    id:"n8-09", level:"N8", module:"impuestos-inversiones",
    q:"¿Qué es el formulario W-8BEN para inversores latinoamericanos?",
    opts:["Un formulario de apertura de cuenta en brokers latinoamericanos","Un formulario del IRS de EE.UU. que declara que el inversor no es ciudadano americano — reduce la retención en dividendos","El formulario de declaración de ganancias en el país de residencia","Un contrato de custodia de activos internacionales"],
    correct:1, explanation:"El W-8BEN certifica ante el IRS que sos extranjero no residente. Reduce la retención de dividendos en acciones americanas del 30% al 10-15% según el tratado fiscal con tu país."
  },
  {
    id:"n8-10", level:"N8", module:"brokers-acciones",
    q:"¿Por qué Interactive Brokers (IBKR) es popular entre traders latinoamericanos?",
    opts:["Por ofrecer las mayores tasas de apalancamiento del mercado","Por su acceso a mercados globales, bajas comisiones, regulación top y disponibilidad para clientes de LatAm","Por ofrecer criptomonedas sin límites de retiro","Por ser el broker con la plataforma más sencilla del mercado"],
    correct:1, explanation:"IBKR es líder para LatAm por: acceso a acciones, bonos, opciones, futuros de múltiples países, comisiones muy bajas, regulación en EE.UU. (SIPC) y aceptar clientes de la mayoría de países."
  },

  // ─── PREGUNTAS ADICIONALES (CROSS-TOPIC) ────────────────────────────
  {
    id:"n3-16", level:"N3", module:"order-blocks",
    q:"¿Cuándo se considera 'mitigado' un Order Block?",
    opts:["Cuando el precio lo toca una sola vez","Cuando el precio regresa al OB y lo opera (recibe reacción o lo perfora completamente)","Cuando han pasado más de 30 velas desde su creación","Cuando el volumen en esa zona es inferior al promedio"],
    correct:1, explanation:"Un OB se mitiga cuando el precio regresa a él y reacciona (válido para operar) o lo perfora completamente (pierde validez). Un OB no mitigado mantiene su potencial de reacción."
  },
  {
    id:"n2-16", level:"N2", module:"fibonacci",
    q:"¿Desde dónde se traza un retroceso de Fibonacci?",
    opts:["Desde cualquier dos puntos del gráfico","Desde el inicio de un swing (mínimo a máximo en alcista, o máximo a mínimo en bajista)","Solo desde máximos y mínimos absolutos (ATH/ATL)","Desde la EMA 200 hasta el precio actual"],
    correct:1, explanation:"El retroceso Fibonacci se traza desde el inicio del swing (pivot low) hasta el final (pivot high) en un upswing, o desde el pivot high al pivot low en un downswing."
  },
  {
    id:"n4-11", level:"N4", module:"wyckoff",
    q:"¿Qué es el 'SOS' (Sign of Strength) en Wyckoff?",
    opts:["Una señal bajista que confirma distribución","Un movimiento alcista de calidad que confirma que la acumulación fue exitosa y el markup está comenzando","La ruptura de un soporte clave con volumen","El inicio de la fase de distribución"],
    correct:1, explanation:"El SOS (Sign of Strength) es un rally de calidad con volumen creciente que confirma que las instituciones completaron la acumulación y el precio está listo para el Markup."
  },
  {
    id:"n5-12", level:"N5", module:"ciclos-crypto",
    q:"¿Qué es la 'Altcoin Season'?",
    opts:["El período donde solo Bitcoin sube y las altcoins caen","El período donde las altcoins superan el rendimiento de Bitcoin — generalmente en la fase final del bull market","Una temporada de mayor regulación para altcoins","El período de emisión de nuevas criptomonedas"],
    correct:1, explanation:"La Altcoin Season ocurre cuando el dinero fluye de Bitcoin a las altcoins, causando que estas superen ampliamente el rendimiento de BTC. Suele ocurrir en la fase tardía del bull market."
  },
  {
    id:"n7-08", level:"N7", module:"risk-management",
    q:"¿Qué es el 'Kelly Criterion' aplicado al trading?",
    opts:["Una regla que indica cuándo tomar ganancias automáticamente","Una fórmula matemática que calcula el tamaño óptimo de posición basado en el win rate y el R:R","El número máximo de operaciones diarias recomendado","Un indicador de momentum basado en probabilidades"],
    correct:1, explanation:"Kelly = W - (1-W)/R donde W=win rate y R=ratio ganancia/pérdida. Da el % óptimo a arriesgar. En trading se suele usar el 'Half Kelly' para ser más conservador."
  },
  {
    id:"n1-16", level:"N1", module:"anatomia-mercado",
    q:"¿Qué es una orden 'Stop Limit'?",
    opts:["Una orden que se ejecuta inmediatamente al mercado","Una orden que activa una orden límite cuando el precio llega a un precio de stop específico","Una orden que cancela automáticamente al final del día","Una orden de compra garantizada sin slippage"],
    correct:1, explanation:"Stop Limit: cuando el precio llega al 'stop price', se activa una orden límite al 'limit price'. Combina control de precio (limit) con automatización de la activación (stop)."
  },
  {
    id:"n6-08", level:"N6", module:"elliott-waves",
    q:"¿Qué es una corrección en zigzag (5-3-5) de Elliott?",
    opts:["Una corrección de 3 ondas planas","Una corrección compuesta por 5 ondas bajistas, 3 alcistas y 5 bajistas — la corrección más agresiva","Una extensión de la onda 3","Una pausa en tendencia alcista de 3 velas"],
    correct:1, explanation:"El zigzag (5-3-5) es la corrección de Elliott más común y agresiva: 5 ondas en la dirección contraria (A), 3 de rebote (B), y 5 más en la dirección de la corrección (C)."
  },
  {
    id:"n5-13", level:"N5", module:"bonos",
    q:"¿Cuál es el impacto de las decisiones de la Fed (Reserva Federal) en el mercado crypto?",
    opts:["La Fed no tiene influencia en los mercados crypto","Las decisiones de tasas de la Fed afectan el apetito por el riesgo global — tasas altas = presión sobre BTC y altcoins","La Fed regula directamente el mercado crypto","Solo afectan a las acciones, no a crypto"],
    correct:1, explanation:"La Fed es el árbitro global del costo del capital. Tasas altas (hawkish) = dinero caro = salida de activos de riesgo como crypto. Tasas bajas o QE = liquidez = flujo hacia BTC y alts."
  },
  {
    id:"n3-17", level:"N3", module:"liquidez",
    q:"¿Qué es la 'SSL' (Sell Side Liquidity)?",
    opts:["Liquidez generada por órdenes de compra por encima de máximos","Liquidez ubicada por debajo de mínimos — stop losses de traders en posición larga","El volumen total de ventas del día","Los límites de las posiciones cortas institucionales"],
    correct:1, explanation:"La SSL se ubica por debajo de mínimos previos donde los traders largos tienen sus stop losses. Las instituciones pueden buscar esa liquidez vendiendo antes de invertir y comprar."
  },
  {
    id:"n2-17", level:"N2", module:"rsi",
    q:"¿Qué es la divergencia alcista en el RSI?",
    opts:["El precio hace máximos más altos y el RSI también","El precio hace mínimos más bajos pero el RSI hace mínimos más altos — señal de agotamiento bajista","El RSI cae por debajo de 30 en tendencia alcista","El precio y el RSI convergen al mismo nivel"],
    correct:1, explanation:"Divergencia alcista: el precio hace LL (nuevos mínimos) pero el RSI hace HL (mínimos menos bajos). Indica que la presión vendedora disminuye — posible reversión al alza."
  },
];

export type ExamMode = "GENERAL" | Level;

export interface ExamConfig {
  mode: ExamMode;
  label: string;
  questionCount: number;
  color: string;
  description: string;
}

export const EXAM_MODES: ExamConfig[] = [
  { mode:"GENERAL", label:"Examen General", questionCount:20, color:"#00e5ff", description:"20 preguntas de todos los niveles" },
  { mode:"N1", label:"N1 — Fundamentos", questionCount:15, color:"#00e676", description:"15 preguntas de Fundamentos del Mercado" },
  { mode:"N2", label:"N2 — Técnico", questionCount:15, color:"#00e5ff", description:"15 preguntas de Análisis Técnico" },
  { mode:"N3", label:"N3 — Smart Money", questionCount:15, color:"#ff6d00", description:"15 preguntas de SMC e Institucional" },
  { mode:"N4", label:"N4 — Avanzado", questionCount:10, color:"#ffd700", description:"10 preguntas de Herramientas Avanzadas" },
  { mode:"N5", label:"N5 — Macro", questionCount:10, color:"#e040fb", description:"10 preguntas de Macroeconomía" },
  { mode:"N6", label:"N6 — Metodologías", questionCount:8, color:"#7c4dff", description:"8 preguntas de Sistemas Completos" },
  { mode:"N7", label:"N7 — Gestión", questionCount:8, color:"#ff1744", description:"8 preguntas de Riesgo y Psicología" },
  { mode:"N8", label:"N8 — Acciones & RF", questionCount:10, color:"#40c4ff", description:"10 preguntas de Mercados Tradicionales" },
];

export function getQuestionsForMode(mode: ExamMode, count: number): ExamQuestion[] {
  const pool = mode === "GENERAL"
    ? EXAM_QUESTIONS
    : EXAM_QUESTIONS.filter(q => q.level === mode);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
