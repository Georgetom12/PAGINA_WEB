// Visual chart sections for every module that needs one
export const contentAllVisuals: Record<string, { sections: any[] }> = {

  // ─── N1: FUNDAMENTOS ──────────────────────────────────────────────────────
  "intro-mercados": {
    sections: [
      {
        type: "market-anatomy-chart",
        title: "Order Book — Bid / Ask / Spread",
        body: "Todo mercado financiero funciona a través de un libro de órdenes. Aquí vives el motor real del precio.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Los 3 actores del mercado",
        text: "Market Makers (MM): proveen liquidez — crean el Bid y el Ask. Institucionales: mueven grandes posiciones, necesitan liquidez para entrar/salir. Retail: somos la minoría de volumen — seguimos la narrativa que los MM e institucionales crean.",
      },
      {
        type: "table",
        headers: ["Tipo de Mercado", "Horario", "Activos", "Liquidez"],
        rows: [
          ["Forex", "24h/5 días", "EUR/USD, GBP/USD, DXY…", "Más alta del mundo"],
          ["Crypto", "24h/7 días", "BTC, ETH, SOL, Alts…", "Alta en BTC/ETH, baja en alts"],
          ["Acciones NYSE", "9:30–16:00 ET", "AAPL, TSLA, NVDA…", "Alta en MAG7"],
          ["Futuros CME", "23h/día", "ES, NQ, GC, CL…", "Alta en ES y NQ"],
          ["Opciones", "Según subyacente", "Cualquier activo", "Variable — cuidado gap"],
        ],
      },
    ],
  },

  "anatomia-mercado": {
    sections: [
      {
        type: "market-anatomy-chart",
        title: "Anatomía del Mercado — Órdenes y Liquidez",
        body: "El precio se mueve porque existen compradores y vendedores con órdenes pendientes. Entender la mecánica de órdenes es la base de todo.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Las 4 órdenes fundamentales",
        text: "Market Order: ejecuta al mejor precio disponible — instantánea pero puede tener slippage. Limit Order: espera tu precio — sin slippage pero puede no ejecutarse. Stop Order: se convierte en market cuando el precio toca tu nivel — para protección. Stop-Limit: combina stop y limit — riesgo de no ejecución en mercados rápidos.",
      },
      {
        type: "table",
        headers: ["Concepto", "Definición", "Impacto en el precio"],
        rows: [
          ["Bid", "Mejor precio de compra disponible", "Comprar en el Ask sube el precio"],
          ["Ask", "Mejor precio de venta disponible", "Vender en el Bid baja el precio"],
          ["Spread", "Ask − Bid", "Costo mínimo por operar"],
          ["Liquidez", "Volumen de órdenes disponibles", "Alta liquidez = menor slippage"],
          ["Slippage", "Diferencia precio esperado vs ejecutado", "Mayor en activos ilíquidos o news"],
          ["Market Depth", "Volumen en cada nivel de precio", "Resistencias/soportes invisibles"],
        ],
      },
    ],
  },

  "velas-basico": {
    sections: [
      {
        type: "candle-anatomy",
        title: "Anatomía de la Vela Japonesa",
        body: "Cada vela representa la batalla entre compradores y vendedores en un periodo de tiempo. Aprender a leerla te da ventaja sobre el 90% del mercado.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "La psicología detrás de cada vela",
        text: "Cuerpo grande alcista: compradores dominaron todo el periodo. Cuerpo grande bajista: vendedores tomaron control total. Mecha larga superior: compradores empujaron arriba pero vendedores los rechazaron. Mecha larga inferior (hammer): vendedores empujaron abajo pero compradores absorbieron toda la oferta. Doji: equilibrio total — indecisión, reversión posible.",
      },
      {
        type: "table",
        headers: ["Parte de la vela", "Qué significa", "Señal de trading"],
        rows: [
          ["Apertura (Open)", "Primer precio del periodo", "Contexto de inicio"],
          ["Cierre (Close)", "Último precio del periodo", "El más importante — muestra el ganador"],
          ["Máximo (High)", "Precio más alto alcanzado", "Nivel de resistencia puntual"],
          ["Mínimo (Low)", "Precio más bajo alcanzado", "Nivel de soporte puntual"],
          ["Cuerpo", "Rango entre Open y Close", "Convicción del movimiento"],
          ["Mecha/Wick", "Rango más allá del cuerpo", "Rechazo — liquidez barrida"],
        ],
      },
    ],
  },

  "estructura-mercado": {
    sections: [
      {
        type: "structure-chart",
        title: "Estructura del Mercado — HH/HL (alcista) · LH/LL (bajista)",
        chartType: "structure",
        body: "La estructura es el lenguaje del mercado. Antes de buscar entradas, siempre pregunta: ¿la estructura es alcista o bajista en este timeframe?",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Las 4 estructuras posibles",
        text: "Alcista (uptrend): HH + HL — precio hace máximos y mínimos cada vez más altos. Bajista (downtrend): LH + LL — precio hace máximos y mínimos cada vez más bajos. Rango (consolidación): mismos máximos y mínimos. Transición: cuando el precio rompe la secuencia — búscalo como BOS/CHoCH.",
      },
      {
        type: "table",
        headers: ["Concepto", "Significado", "¿Qué hacer?"],
        rows: [
          ["HH (Higher High)", "Máximo más alto que el anterior", "Tendencia alcista — buscar longs"],
          ["HL (Higher Low)", "Mínimo más alto que el anterior", "Confirma uptrend — zona de compra"],
          ["LH (Lower High)", "Máximo más bajo que el anterior", "Tendencia bajista — buscar shorts"],
          ["LL (Lower Low)", "Mínimo más bajo que el anterior", "Confirma downtrend — zona de venta"],
          ["BOS (Break of Structure)", "Precio rompe el último HH o LL", "Tendencia confirmada"],
          ["CHoCH (Change of Character)", "Primer BOS contra la tendencia", "Alerta de reversión posible"],
        ],
      },
    ],
  },

  // ─── N2: TÉCNICO ──────────────────────────────────────────────────────────
  "emas": {
    sections: [
      {
        type: "ema-chart",
        title: "EMAs 21 / 50 / 200 — Tendencia y Cruces",
        body: "Las medias móviles exponenciales son el termómetro de la tendencia. Precio sobre EMA200 = alcista. Precio bajo EMA200 = bajista. El orden 21 > 50 > 200 = perfecta alineación alcista.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Cómo usar las EMAs como soporte/resistencia",
        text: "EMA 21: soporte/resistencia en tendencias fuertes — los institucionales defienden esta EMA en pullbacks. EMA 50: soporte en uptrend medio — un cierre bajo esta EMA es alerta. EMA 200: la línea más importante — divide el bull de bear market. En Forex: EMA 50 diaria es clave para DXY y pares principales.",
      },
      {
        type: "table",
        headers: ["Señal EMA", "Configuración", "Fiabilidad", "Acción"],
        rows: [
          ["Golden Cross", "EMA21 cruza EMA50 hacia arriba", "Alta (diario/semanal)", "Buscar longs en pullback"],
          ["Death Cross", "EMA21 cruza EMA50 hacia abajo", "Alta (diario/semanal)", "Buscar shorts en rebote"],
          ["EMA Stack alcista", "EMA21 > EMA50 > EMA200", "Muy alta", "Solo longs — tendencia fuerte"],
          ["EMA Stack bajista", "EMA21 < EMA50 < EMA200", "Muy alta", "Solo shorts — tendencia fuerte"],
          ["Precio rebota EMA200", "1er toque con volumen", "Alta", "Entrada en dirección de tendencia"],
          ["Precio cierra bajo EMA200", "Con volumen expandido", "Alta", "Cambio de régimen — precaución"],
        ],
      },
    ],
  },

  "rsi": {
    sections: [
      {
        type: "rsi-chart",
        title: "RSI (14) — Divergencias y Zonas Extremas",
        body: "El RSI mide la velocidad y cambio de los movimientos de precio. Lo más valioso no es el nivel (70/30) sino las divergencias: cuando el precio y el RSI no están de acuerdo.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Divergencias — La señal más poderosa del RSI",
        text: "Divergencia Alcista Regular: precio hace LL, RSI hace HL — compradores perdiendo menos momentum = reversión alcista próxima. Divergencia Bajista Regular: precio hace HH, RSI hace LH — vendedores ganando fuerza = reversión bajista. Divergencia Alcista Oculta: precio hace HL, RSI hace LL — tendencia alcista continúa. Divergencia Bajista Oculta: precio hace LH, RSI hace HH — tendencia bajista continúa.",
      },
      {
        type: "table",
        headers: ["Zona RSI", "Interpretación", "Acción preferida"],
        rows: [
          [">70 (Sobrecompra)", "Momentum alcista extremo", "No short inmediato — esperar divergencia"],
          ["<30 (Sobreventa)", "Momentum bajista extremo", "No long inmediato — esperar divergencia"],
          ["50 (Línea media)", "Neutral — equilibrio fuerzas", "Sesgar en dirección de tendencia"],
          ["RSI 60-70 en uptrend", "Momentum alcista saludable", "Mantener longs — no vender"],
          ["RSI 30-40 en downtrend", "Momentum bajista saludable", "Mantener shorts — no comprar"],
          ["Divergencia + nivel extremo", "Señal de alta probabilidad", "Buscar entrada + confirmación vela"],
        ],
      },
    ],
  },

  // ─── N3: SMART MONEY ──────────────────────────────────────────────────────
  "order-blocks": {
    sections: [
      {
        type: "ob-fvg-chart",
        title: "Order Blocks & FVG — Formación, Identificación y Entrada",
        body: "Un Order Block es la huella que deja el smart money cuando acumula o distribuye posiciones. El precio siempre regresa a esos niveles para rellenar las órdenes pendientes.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Cómo identificar un OB válido",
        text: "Bullish OB: última vela roja antes de un impulso alcista fuerte que rompe estructura. Bearish OB: última vela verde antes de un impulso bajista fuerte que rompe estructura. El OB es más válido si: (1) causó un BOS, (2) dejó un FVG / imbalance, (3) está en zona de discount/premium según IPDA, (4) tiene confluencia con Fibonacci 61.8-70.5%.",
      },
      {
        type: "table",
        headers: ["Tipo OB", "Definición", "Zona de", "Entrada ideal"],
        rows: [
          ["Bullish OB", "Última vela roja antes de impulso alcista", "Discount (50-100% Fib)", "Cierre sobre el high del OB"],
          ["Bearish OB", "Última vela verde antes de impulso bajista", "Premium (0-50% Fib)", "Cierre bajo el low del OB"],
          ["Breaker Block", "OB fallido que se convierte en opuesto", "Nivel roto", "Pullback al breaker"],
          ["Mitigation Block", "OB que fue parcialmente tocado", "Precio llega al 50% del OB", "Zona del 50% como entrada"],
          ["FVG (Fair Value Gap)", "Imbalance de 3 velas sin solapamiento", "Dentro del impulso del OB", "Relleno del gap completo"],
          ["Void / Propulsion Block", "OB + FVG + BOS en la misma zona", "Cualquiera", "Confluencia máxima"],
        ],
      },
    ],
  },

  "liquidez": {
    sections: [
      {
        type: "liquidity-map",
        title: "Liquidez — SSL/BSL Hunt, Equal Highs/Lows, Inducement",
        body: "La liquidez es el combustible del mercado. Los institucionales NECESITAN liquidez para llenar sus posiciones. Aprende a ver dónde está antes de que el precio la barre.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Los 5 tipos de liquidez más importantes",
        text: "BSL (Buy-Side Liquidity): stops de shorts y órdenes de compra de breakout traders sobre máximos — EQH, previous HH, trendline bearish. SSL (Sell-Side Liquidity): stops de longs y órdenes de venta de breakout traders bajo mínimos — EQL, previous LL, trendline bullish. Resting Liquidity: igual máximos/mínimos (EQH/EQL) — imán para el precio. Inducement: mínimo/máximo creado específicamente para atraer stops. Void/FVG: zonas sin órdenes que el precio tiende a rellenar.",
      },
      {
        type: "liquidity-absorption",
        title: "Absorción de Liquidez — Cómo el Smart Money usa los stops",
        body: "Los institucionales no pueden entrar al mercado discretamente. Necesitan que haya muchas órdenes al otro lado para llenar su posición. El sweep de liquidez ES el mecanismo de entrada institucional.",
      },
      {
        type: "table",
        headers: ["Tipo de Liquidez", "Dónde está", "¿Qué hace el precio?"],
        rows: [
          ["EQH (Equal Highs)", "Dos o más máximos casi idénticos", "Los supera, barre stops, revierte"],
          ["EQL (Equal Lows)", "Dos o más mínimos casi idénticos", "Los rompe, barre stops, revierte"],
          ["Previous Day High", "Máximo del día anterior", "Lo supera en apertura Londres/NY"],
          ["Previous Day Low", "Mínimo del día anterior", "Lo rompe antes del movimiento real"],
          ["Trendline BSL", "Línea que conecta mínimos en uptrend", "Break falso abajo → reversión alcista"],
          ["VWAP", "Precio promedio ponderado por volumen", "Vuelta al VWAP tras extensión extrema"],
        ],
      },
    ],
  },

  "ipda": {
    sections: [
      {
        type: "ipda-chart",
        title: "IPDA — Interbank Price Delivery Algorithm",
        body: "El IPDA es el algoritmo que el mercado usa para entregar precio. Funciona en rangos de 20, 40 y 60 días buscando liquidez en la zona opuesta. Premium o Discount — el precio siempre está en una de las dos.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "La regla de IPDA más importante",
        text: "Si el precio está en DISCOUNT (50-100% del rango, zona barata): busca LONGS en POIs bajistas — el algoritmo irá a buscar BSL arriba. Si el precio está en PREMIUM (0-50% del rango, zona cara): busca SHORTS en POIs alcistas — el algoritmo irá a buscar SSL abajo. El Golden Pocket (61.8-70.5%) en Discount = entrada long de máxima probabilidad.",
      },
      {
        type: "fib-levels-chart",
        title: "Golden Pocket y niveles OTE en el contexto IPDA",
        body: "El OTE (Optimal Trade Entry) de ICT corresponde al rango 62-79% del retroceso — zona donde el IPDA entrega precio con mayor frecuencia antes de continuar el impulso.",
      },
      {
        type: "table",
        headers: ["Nivel Fib", "Nombre ICT/IPDA", "Uso"],
        rows: [
          ["50%",          "Equilibrium",    "Divide Premium de Discount"],
          ["61.8%",        "Golden Pocket A", "Entrada long en Discount"],
          ["70.5%",        "Golden Pocket B / OTE", "Entrada long profunda"],
          ["78.6%",        "OTE extremo",    "Última zona de compra válida"],
          ["38.2% (inv.)", "Premium entry",  "Short en Premium"],
          ["23.6% (inv.)", "Extreme Premium", "Short más conservador"],
        ],
      },
    ],
  },

  "cvd": {
    sections: [
      {
        type: "open-interest-chart",
        title: "CVD / Open Interest — Volumen y Financiamiento",
        body: "El CVD (Cumulative Volume Delta) muestra si el precio subió/bajó con volumen de compra o venta agresiva. El OI muestra cuántas posiciones están abiertas. Combinados revelan la convicción real del movimiento.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Las 4 combinaciones clave de Precio + CVD",
        text: "Precio ↑ + CVD ↑: compradores agresivos — movimiento sano y sostenible. Precio ↑ + CVD ↓: precio sube pero en vendedores netos — sospechoso, posible trampa alcista (distribución). Precio ↓ + CVD ↓: vendedores agresivos — movimiento bajista sostenible. Precio ↓ + CVD ↑: precio baja pero con compradores netos — absorción — posible reversión próxima.",
      },
      {
        type: "table",
        headers: ["Métrica", "¿Qué mide?", "Señal alcista", "Señal bajista"],
        rows: [
          ["CVD", "Volumen compra vs venta neto", "CVD sube con precio", "CVD diverge del precio"],
          ["OI subiendo", "Nuevas posiciones abren", "En uptrend = confirmación", "En downtrend = distribución"],
          ["OI bajando", "Posiciones se cierran", "Capitulación de shorts", "Capitulación de longs"],
          ["Funding +", "Longs pagan a shorts", "> +0.01% = sobrecalentado long", "Señal de corrección"],
          ["Funding −", "Shorts pagan a longs", "< −0.01% = short squeeze listo", "Señal de recuperación"],
          ["Large Wicks + CVD", "Absorción de liquidez", "Wick bajo + CVD sube = compra", "Wick alto + CVD baja = venta"],
        ],
      },
    ],
  },

  "open-interest": {
    sections: [
      {
        type: "open-interest-chart",
        title: "Open Interest — El Mapa de las Posiciones Abiertas",
        body: "El Open Interest te dice cuánto dinero está apostando en el mercado de derivados. Alto OI = mucha liquidez que puede ser barrida. Su combinación con precio y funding rate es la señal más potente del mercado crypto.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Señales de alto valor con OI",
        text: "OI sube + precio sube = tendencia alcista saludable (nuevos longs abren). OI sube + precio baja = tendencia bajista saludable (nuevos shorts abren). OI baja + precio sube = short squeeze (shorts cerrando). OI baja + precio baja = long liquidation (longs cerrando). Funding muy positivo (+0.1%+) = mercado sobrecalentado largo = riesgo de dump repentino.",
      },
    ],
  },

  // ─── N5: MACRO ────────────────────────────────────────────────────────────
  "dominancias": {
    sections: [
      {
        type: "dominance-chart",
        title: "BTC.D / USDT.D / Alts — El Mapa del Capital Crypto",
        body: "Las dominancias muestran dónde está fluyendo el capital dentro del ecosistema crypto. Son el mapa más poderoso para entender en qué fase del ciclo estamos.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Fases del ciclo según dominancias",
        text: "Fase 1 — Bear: BTC.D baja, USDT.D sube = capital sale de todo. Fase 2 — BTC Recovery: BTC.D sube, USDT.D baja = capital entra pero solo en BTC. Fase 3 — ETH Season: BTC.D baja, USDT.D baja, ETH.D sube = capital rota a ETH. Fase 4 — AltSeason: BTC.D baja mucho, ETH.D baja, Alts 100 sube = toda la capitalización en alts. Esta fase es la más explosiva y la más corta.",
      },
      {
        type: "table",
        headers: ["Dominancia", "Sube cuando...", "Baja cuando...", "Señal para"],
        rows: [
          ["BTC.D > 55%", "Capital huye a BTC", "Alt season", "Acumular BTC"],
          ["USDT.D > 10%", "Miedo/incertidumbre", "Risk-on", "Estar fuera o short"],
          ["ETH.D > 18%", "ETH lidera la rotación", "BTC domina", "Acumular ETH/DeFi"],
          ["Alts.D sube rápido", "Capital entra a alts", "BTC temporada", "Exposure en alts"],
          ["USDT.D < 4%", "Mercado eufórico", "Rotación alta", "Cuidado — posible techo"],
        ],
      },
    ],
  },

  "dxy": {
    sections: [
      {
        type: "dxy-correlation-chart",
        title: "DXY — El Dólar como Termómetro del Mercado Global",
        body: "El DXY (Índice del Dólar) es quizás el dato macro más importante para cualquier trader. Mide la fortaleza del dólar contra una cesta de monedas. Cuando el dólar sube, el riesgo cae.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "DXY y sus correlaciones",
        text: "DXY ↑: oro baja, BTC baja, EUR/USD baja, mercados emergentes caen, commodities bajan. DXY ↓: oro sube, BTC sube, EUR/USD sube, risk-on generalizado. DXY en soporte técnico: punto de inflexión — si rebota, presiona activos de riesgo. DXY en resistencia: si rompe arriba = mercados caen; si rechaza = relief rally en risk assets.",
      },
      {
        type: "table",
        headers: ["DXY", "BTC", "ORO", "EUR/USD", "Acciones US"],
        rows: [
          ["↑ Fuerte",  "↓ Presión", "↓ Presión",  "↓ Cae",   "↓ Sector exportador sufre"],
          ["↓ Débil",   "↑ Rally",   "↑ Rally",    "↑ Sube",  "↑ Risk-on generalizado"],
          ["Lateral",   "Independiente", "Independiente", "Rango", "Depende de datos"],
          ["↑ Brusco",  "Dump repentino", "Dump fuerte", "Flash crash", "Sell-off rápido"],
          ["↓ Brusco",  "Pump fuerte", "Pump fuerte", "Flash rally", "Gap alcista"],
        ],
      },
    ],
  },

  "indices": {
    sections: [
      {
        type: "vix-chart",
        title: "Índices Globales y el VIX — El Miedo del Mercado",
        body: "Los índices americanos (SPX, NQ, DJI) son el barómetro de la economía global. El VIX mide el miedo implícito en el mercado de opciones sobre el SPX.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Los 3 índices más importantes y su significado",
        text: "S&P 500 (SPX / ES): las 500 empresas más grandes de USA. El índice más representativo del mercado global. NASDAQ 100 (NQ): las 100 empresas tech más grandes. Lidera los movimientos — más volátil que el SPX. DJI (Dow Jones): 30 empresas industriales históricas. Menos relevante para el trader moderno. Correlación con BTC: cuando el SPX cae con fuerza, BTC suele caer 2-3x más.",
      },
      {
        type: "table",
        headers: ["Índice/Métrica", "Símbolo", "Correlation BTC", "Señal"],
        rows: [
          ["S&P 500", "SPX / ES", "+0.65 en bear markets", "SPX crash = BTC dump"],
          ["NASDAQ 100", "NQ / QQQ", "+0.75 histórico", "NQ lidera BTC en risk-off"],
          ["VIX < 15", "Fear index", "Negativa", "Complacencia — cuidado con posiciones grandes"],
          ["VIX 20-30", "Fear index", "Negativa", "Volatilidad normal — oportunidades"],
          ["VIX > 40", "Fear index", "Negativa (extremo)", "Pánico máximo = compra histórica"],
          ["VIX pico + SPX mínimo", "—", "—", "Bottom de mercado — acumular"],
        ],
      },
    ],
  },

  "mag7": {
    sections: [
      {
        type: "vix-chart",
        title: "MAG7 — Las 7 Empresas que Mueven el Mercado",
        body: "Microsoft, Apple, Nvidia, Alphabet, Amazon, Meta y Tesla representan más del 30% del S&P 500. Su movimiento ES el mercado. Entenderlas es entender el flujo institucional.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Impacto de las MAG7 en crypto",
        text: "Cuando las MAG7 caen, el capital institucional sale del risk-on — BTC y alts suelen caer. Cuando Nvidia (NVDA) sube con fuerza, hay apetito por activos de alto crecimiento/tecnología — positivo para BTC. Las MAG7 reportan ganancias trimestralmente — estos eventos crean volatilidad que afecta a todo el mercado, incluyendo crypto.",
      },
      {
        type: "table",
        headers: ["Empresa", "Símbolo", "Sector", "Relevancia para Crypto"],
        rows: [
          ["Microsoft", "MSFT", "Cloud / AI / Software", "Alta — integra BTC en tesorería"],
          ["Apple", "AAPL", "Consumer Electronics", "Media — wallet, pagos"],
          ["Nvidia", "NVDA", "Semiconductores / IA", "Muy alta — minería y GPU AI"],
          ["Alphabet", "GOOGL", "Búsqueda / Cloud / IA", "Alta — barometro de ad spend"],
          ["Amazon", "AMZN", "E-Commerce / Cloud AWS", "Alta — infraestructura"],
          ["Meta", "META", "Social / VR / IA", "Alta — Metaverso, pagos digitales"],
          ["Tesla", "TSLA", "EVs / IA / Energia", "Alta — BTC en balance sheet, Elon"],
        ],
      },
    ],
  },

  "vix": {
    sections: [
      {
        type: "vix-chart",
        title: "VIX — Índice del Miedo y Estrategias",
        body: "El VIX mide la volatilidad implícita del S&P 500 en las próximas 30 sesiones. Es el termómetro del miedo. Conocerlo te da una ventaja enorme sobre el retail.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Niveles del VIX y qué significan",
        text: "VIX < 15: mercado complaciente, volatilidad baja — cuidado con posiciones grandes, el riesgo real es mayor de lo percibido. VIX 15-25: volatilidad normal — condiciones sanas para operar. VIX 25-35: incertidumbre elevada — opciones caras, reducir tamaño de posición. VIX > 35: miedo extremo — históricamente representa oportunidad de compra de largo plazo. VIX > 50: pánico histórico (COVID, 2008) — zona de acumulación máxima.",
      },
    ],
  },

  "bonos": {
    sections: [
      {
        type: "bonds-chart",
        title: "Bonos del Tesoro — Yields y Curva de Rendimiento",
        body: "Los bonos del Tesoro americano son el activo libre de riesgo del mundo. Su yield (rendimiento) es la tasa de descuento para todos los activos financieros. Entender los yields es entender el costo del dinero.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Curva de rendimiento — La señal de recesión",
        text: "Curva normal (pendiente positiva): 10Y > 2Y — economía sana, expectativa de crecimiento. Curva plana: 10Y ≈ 2Y — transición, incertidumbre. Curva invertida (pendiente negativa): 2Y > 10Y — señal histórica de recesión próxima (6-18 meses después). Desinversión de la curva (vuelve a normalizarse): suele preceder al inicio de la recesión real.",
      },
      {
        type: "table",
        headers: ["Escenario de Yields", "BTC/Crypto", "Oro", "Acciones", "USD"],
        rows: [
          ["Yields 10Y suben fuerte", "Presión negativa", "Cae", "Caen (especialmente tech)", "Fortalece"],
          ["Yields 10Y bajan", "Positivo", "Sube", "Suben", "Debilita"],
          ["Curva invertida", "Precaución", "Sube (safe haven)", "Caen", "Variable"],
          ["FED sube tasas", "Negativo corto plazo", "Cae", "Caen", "Fortalece"],
          ["FED baja tasas", "Muy positivo", "Sube", "Suben", "Debilita"],
          ["QE (impresión dinero)", "Muy positivo (inflación)", "Sube mucho", "Suben", "Debilita mucho"],
        ],
      },
    ],
  },

  "oro": {
    sections: [
      {
        type: "gold-cycles-chart",
        title: "ORO (XAU/USD) — Ciclos, Correlaciones y Uso como Señal",
        body: "El oro es el activo refugio más antiguo del mundo. Su precio refleja el miedo global, la inflación, la debilidad del dólar y la incertidumbre geopolítica. También es el predecesor histórico de los movimientos de BTC.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Oro como señal de alerta temprana para BTC",
        text: "Históricamente el oro sube primero y BTC lo sigue 3-6 meses después en los ciclos de devaluación del dólar. Oro en máximos históricos + DXY débil + yields bajos = condiciones ideales para BTC. Oro cae bruscamente = risk-off extremo = BTC también cae. La narrativa 'BTC es el oro digital' hace que ambos se muevan juntos en ciclos macro.",
      },
    ],
  },

  "petroleo": {
    sections: [
      {
        type: "bonds-chart",
        title: "Petróleo (WTI/Brent) — Inflación y Risk-Off",
        body: "El petróleo es el activo que conecta la economía real con los mercados financieros. Una subida brusca del petróleo genera inflación, sube los yields y presiona los activos de riesgo.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Petróleo y sus efectos en el portfolio",
        text: "Petróleo sube moderado: positivo para energía, neutral para tech/crypto. Petróleo sube bruscamente: inflación → FED hawkish → sube yields → presiona BTC y tech. Petróleo cae: deflación/recesión signal → risk-off → negativo para todo. Petróleo < $60 WTI: señal de debilidad económica global. Petróleo > $100: presión inflacionaria severa, banco central agresivo.",
      },
    ],
  },

  "ciclos-crypto": {
    sections: [
      {
        type: "bitcoin-cycles-chart",
        title: "Ciclos de Bitcoin — Halvings y Fases del Mercado",
        body: "Bitcoin ha completado 3 ciclos completos de halving. Cada ciclo dura aproximadamente 4 años y sigue la misma estructura: acumulación → bull market → distribución → bear market. El 4° ciclo comenzó con el halving de abril 2024.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "El Halving — El evento más importante de Bitcoin",
        text: "Cada ~210,000 bloques (≈4 años), la recompensa por minar un bloque se reduce a la mitad. Esto reduce la inflación de BTC. Halvings: Nov 2012 (50→25 BTC), Jul 2016 (25→12.5 BTC), May 2020 (12.5→6.25 BTC), Abr 2024 (6.25→3.125 BTC). Los ciclos post-halving históricamente han generado nuevos máximos históricos 12-18 meses después.",
      },
      {
        type: "dominance-chart",
        title: "Rotación del Capital en el Ciclo Crypto",
        body: "El dinero no sale del ecosistema — rota. Bitcoin lidera, luego ETH, luego las alts grandes, finalmente las micro-caps.",
      },
    ],
  },

  // ─── N6: AVANZADO ─────────────────────────────────────────────────────────
  "elliott-waves": {
    sections: [
      {
        type: "elliott-wave-chart",
        title: "Ondas de Elliott — La Estructura Fractal del Mercado",
        body: "Ralph Nelson Elliott descubrió en los años 30 que los mercados siguen patrones fractales de 5 ondas impulsivas y 3 ondas correctivas. Esta estructura se repite en todos los timeframes — desde un gráfico de 1 minuto hasta el mensual.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "La regla de oro de las Ondas de Elliott",
        text: "Las 3 reglas NUNCA se violan: (1) La onda 2 nunca retrocede más del 100% de la onda 1. (2) La onda 3 NUNCA es la más corta de las tres ondas impulsivas (1, 3, 5). (3) La onda 4 nunca solapa el territorio de precio de la onda 1. Si violas alguna de estas reglas, estás contando mal las ondas.",
      },
      {
        type: "table",
        headers: ["Onda", "Color", "Fibonacci típico", "Carácter psicológico"],
        rows: [
          ["Onda 1", "Verde", "Impulso inicial", "Pocos creen — parece reversión normal"],
          ["Onda 2", "Rojo", "61.8% retroceso de onda 1", "Miedo de que la tendencia vieja regrese"],
          ["Onda 3", "Cyan", "161.8%-261.8% de onda 1", "Euforia — todo el mundo entra tarde"],
          ["Onda 4", "Naranja", "38.2% retroceso de onda 3", "Aburrimiento — rango lateral"],
          ["Onda 5", "Dorado", "100% de onda 1", "FOMO extremo — divergencia RSI"],
          ["Onda A", "Rojo", "Impulso bajista", "Shock — nadie cree que terminó"],
          ["Onda B", "Verde", "50-61.8% retroceso de A", "Trampa — falso regreso al rally"],
          ["Onda C", "Rojo", "100-138.2% de onda A", "Pánico — capitulación masiva"],
        ],
      },
    ],
  },

  "ict": {
    sections: [
      {
        type: "ipda-chart",
        title: "ICT — Inner Circle Trader — PD Arrays y IPDA",
        body: "La metodología ICT de Michael J. Huddleston es la síntesis más completa del análisis institucional. Sus conceptos están basados en cómo el algoritmo IPDA del mercado interbancario entrega precio.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Los PD Arrays de ICT (de más a menos alcista)",
        text: "Premium Arrays (bajistas): Bearish OB, Bearish FVG, Bearish BB, BISI, Bearish Void. Discount Arrays (alcistas): Bullish OB, Bullish FVG, Bullish BB, SIBI, Bullish Void. Equilibrium: VWAP, 50% del rango, EMA 200. La regla: en Discount busca Bullish Arrays para long. En Premium busca Bearish Arrays para short.",
      },
      {
        type: "session-chart",
        title: "ICT Killzones — Las ventanas horarias de alta probabilidad",
        body: "ICT identifica ventanas de tiempo específicas donde el algoritmo IPDA mueve precio con mayor probabilidad. Estas killzones coinciden con las aperturas de las grandes sesiones.",
      },
      {
        type: "table",
        headers: ["Killzone ICT", "Horario GMT-5 (Guayaquil)", "¿Qué buscar?"],
        rows: [
          ["London Open KZ", "02:00–05:00", "Sweep de SSL/BSL asiático → directional entry"],
          ["NY AM KZ", "08:30–11:00", "Reacción al 9:30 open, news macro, OTE"],
          ["NY Lunch", "11:00–13:00", "Trampa de reversal o consolidación"],
          ["NY PM KZ", "13:00–16:00", "Continuación o reversal de NY AM"],
          ["London Close", "11:00–12:00", "Cierre posiciones Londres = volatilidad"],
          ["Asian Range", "20:00–01:00", "Establece el rango para el sweep de Londres"],
        ],
      },
    ],
  },

  "gann": {
    sections: [
      {
        type: "gann-chart",
        title: "Gann — Ángulos, Tiempo y el Cuadrado de 9",
        body: "William Delbert Gann fue el trader más legendario del siglo XX. Su metodología combina precio, tiempo y geometría para predecir movimientos del mercado con una precisión matemática única.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Los conceptos más útiles de Gann para el trader moderno",
        text: "Ángulo 1×1 (45°): la línea de equilibrio. Precio sobre ella = alcista. Bajo ella = bajista. Cuadrado de 9: convierte un precio en grados angulares para encontrar soporte/resistencia temporal. Ley de vibración: el precio responde a ciclos matemáticos (90°, 180°, 270°, 360° del cuadrado). Tiempo = precio: cuando el tiempo coincide con el precio en el cuadrado, se produce un giro. Las fechas del año con mayor concentración de giros: equinoccios y solsticios.",
      },
    ],
  },

  // ─── N7: MAESTRÍA ─────────────────────────────────────────────────────────
  "risk-management": {
    sections: [
      {
        type: "risk-reward-chart",
        title: "Gestión de Riesgo — La Única Habilidad No Negociable",
        body: "El 90% de los traders pierden dinero no porque tengan mala estrategia, sino porque tienen mala gestión de riesgo. Una sola operación mal dimensionada puede borrar semanas de trabajo.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Las 5 reglas de gestión de riesgo",
        text: "Regla 1 — Riesgo por operación: nunca arriesgues más del 1-2% del capital por trade. Regla 2 — R:R mínimo: nunca abras un trade con R:R menor a 1:2 (preferible 1:3+). Regla 3 — Riesgo diario máximo: máximo 3-5% de pérdida en un día antes de dejar de operar. Regla 4 — Correlación: no abras múltiples trades en activos correlacionados (BTC + ETH = mismo riesgo). Regla 5 — Drawdown: si llegas al 10% de drawdown mensual, pausa y analiza tu sistema.",
      },
      {
        type: "table",
        headers: ["Win Rate", "R:R 1:1", "R:R 1:2", "R:R 1:3", "Veredicto"],
        rows: [
          ["30%", "-", "-", "Neutral", "Necesitas 1:3+ obligatorio"],
          ["40%", "-", "Rentable", "Rentable", "Mínimo recomendado"],
          ["50%", "Neutral", "Rentable", "Muy rentable", "Estándar profesional"],
          ["60%", "Rentable", "Muy rentable", "Excelente", "Alta probabilidad"],
          ["70%+", "Muy rentable", "Excelente", "Elite", "Poco sostenible a largo plazo"],
        ],
      },
    ],
  },

  "psicologia": {
    sections: [
      {
        type: "psychology-chart",
        title: "Psicología del Trading — El Ciclo Emocional del Mercado",
        body: "La psicología es el único factor que separa a los traders consistentes del resto. No es tu estrategia lo que falla — eres tú frente a la pantalla. La inteligencia emocional es tu edge más poderoso.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Los 5 errores psicológicos más comunes",
        text: "1. FOMO (Fear of Missing Out): entrar tarde porque el precio ya subió. 2. Revenge Trading: doblar posición después de una pérdida para recuperar. 3. Moving the Stop: mover el stop loss al ver que la posición va en contra. 4. Cutting Winners Early: cerrar un trade ganador por miedo a que revierta. 5. Letting Losers Run: mantener un trade perdedor con esperanza de que se recupere.",
      },
      {
        type: "table",
        headers: ["Error Psicológico", "Causa raíz", "Solución"],
        rows: [
          ["FOMO", "Miedo a perder una oportunidad", "Plan de trading escrito antes de abrir la sesión"],
          ["Revenge trading", "Ego herido por la pérdida", "Stop diario de pérdidas máximas"],
          ["Mover el stop", "No aceptar estar equivocado", "Colocar stop ANTES de entrar, no después"],
          ["Cerrar winner pronto", "Ansiedad / greed inverso", "Definir TP con R:R ANTES de entrar"],
          ["Dejar perder correr", "Esperanza irracional", "Stop loss automático en plataforma — sin excepción"],
          ["Sobre-operar", "Aburrimiento / adrenalina", "Máximo de 3 trades por día"],
        ],
      },
    ],
  },

  "diario-trading": {
    sections: [
      {
        type: "risk-reward-chart",
        title: "Diario de Trading — Tu Sistema de Mejora Continua",
        body: "Los mejores traders del mundo llevan un diario. No para recordar sus trades, sino para identificar sus patrones de error y sus ventajas estadísticas. Es el feedback loop más poderoso.",
      },
      {
        type: "infobox",
        variant: "key",
        label: "Qué registrar en tu diario",
        text: "Por cada trade anota: activo y timeframe, setup (qué estructura/confluencia viste), entrada exacta y razón, SL/TP con R:R, resultado en R (no en dinero), estado emocional (1-10), errores cometidos, screenshot antes y después. Una vez por semana: calcula tu win rate, R:R promedio, expectativa matemática, y los setups más rentables.",
      },
      {
        type: "table",
        headers: ["Métrica del Diario", "Fórmula", "Objetivo Profesional"],
        rows: [
          ["Expectativa", "(Win% × R avg win) − (Loss% × avg loss)", "> 0.3R por trade"],
          ["Win Rate", "Trades ganadores / total trades × 100", "> 45% con R:R 1:2"],
          ["Profit Factor", "Ganancias brutas / Pérdidas brutas", "> 1.5"],
          ["Drawdown máximo", "Pérdida pico a valle en el período", "< 10% mensual"],
          ["Sharpe Ratio", "Retorno / Desviación estándar", "> 1.5"],
          ["R promedio", "P&L total / número de trades en R", "> 1.0R promedio"],
        ],
      },
    ],
  },
};
