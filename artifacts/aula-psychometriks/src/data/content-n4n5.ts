export const contentN4N5: Record<string, any> = {

// ─── NIVEL 4 ──────────────────────────────────────────────────────────────────

"wyckoff": {
  sections: [
    {
      title: "Richard Wyckoff y su Método",
      body: `Richard D. Wyckoff (1873–1934) fue uno de los pioneros del análisis técnico. Desarrolló un método de análisis basado en el estudio del precio, volumen y estructura de mercado para inferir las intenciones de los grandes operadores. Su trabajo sigue siendo uno de los más relevantes en el análisis moderno.`,
      type: "text"
    },
    {
      title: "El Método Wyckoff — Principios Fundamentales",
      type: "cards",
      cards: [
        { color: "#00e5ff", title: "Ley de Oferta y Demanda", icon: "⚖️", text: "Cuando la demanda supera a la oferta, el precio sube. Cuando la oferta supera a la demanda, el precio cae. El volumen CONFIRMA la historia del precio. Sin volumen, la señal es débil." },
        { color: "#ffd700", title: "Ley de Causa y Efecto", icon: "⚡", text: "Para que haya un gran movimiento (efecto), primero debe haberse construido una gran causa (acumulación/distribución). El tamaño del rango lateral determina el potencial del movimiento posterior. Cuanto mayor el rango, mayor el movimiento." },
        { color: "#00e676", title: "Ley de Esfuerzo y Resultado", icon: "🔍", text: "El volumen (esfuerzo) debe corresponder al movimiento (resultado). Volumen alto + movimiento pequeño = absorción (los institucionales están absorbiendo la oferta/demanda). Volumen bajo + movimiento grande = ausencia de resistencia." },
      ]
    },
    {
      type: "structure-chart",
      structureType: "wyckoff-acc",
      title: "Esquema de Acumulación Wyckoff — Visual",
    },
    {
      type: "structure-chart",
      structureType: "wyckoff-dist",
      title: "Esquema de Distribución Wyckoff — Visual",
    },
    {
      title: "Esquema de Acumulación Wyckoff",
      type: "table",
      headers: ["Fase", "Evento", "Descripción"],
      rows: [
        ["Fase A", "PS — Preliminary Support", "Primera señal de que la caída puede estar terminando"],
        ["Fase A", "SC — Selling Climax", "Caída climática con volumen muy alto — vendedores agotados"],
        ["Fase A", "AR — Automatic Rally", "Rebote automático tras el SC — define el top del rango"],
        ["Fase A", "ST — Secondary Test", "Re-test del área del SC con menor volumen — confirma el suelo"],
        ["Fase B", "Several STs", "Múltiples tests del soporte y resistencia del rango — acumulación silenciosa"],
        ["Fase C", "Spring", "BARRIDA de mínimos — finta final para limpiar los últimos stops antes del alza"],
        ["Fase C", "Test del Spring", "Re-test del Spring con menor volumen — confirma que no hay más vendedores"],
        ["Fase D", "SOS — Sign of Strength", "Primera ruptura alcista del rango con volumen alto"],
        ["Fase D", "LPS — Last Point of Support", "Retroceso al borde superior del rango — última compra antes del alza"],
        ["Fase E", "Mark Up", "El precio sube con fuerza en tendencia alcista"],
      ]
    },
    {
      title: "Esquema de Distribución Wyckoff",
      type: "table",
      headers: ["Fase", "Evento", "Descripción"],
      rows: [
        ["Fase A", "PSY — Preliminary Supply", "Primera resistencia institucional al alza"],
        ["Fase A", "BC — Buying Climax", "Clímax comprador con volumen alto — compradores agotados"],
        ["Fase A", "AR — Automatic Reaction", "Caída automática tras el BC — define el suelo del rango"],
        ["Fase A", "ST — Secondary Test", "Re-test del BC con menor volumen"],
        ["Fase B", "UT — Upthrust", "Ruptura falsa al alza — toma de liquidez antes de caer"],
        ["Fase C", "UTAD — Upthrust After Distribution", "La última trampa alcista — el máximo histórico falso"],
        ["Fase D", "SOW — Sign of Weakness", "Primera ruptura bajista del rango"],
        ["Fase D", "LPSY — Last Point of Supply", "Rebote al borde inferior del rango — última venta"],
        ["Fase E", "Mark Down", "El precio cae con fuerza en tendencia bajista"],
      ]
    },
    {
      type: "infobox",
      variant: "key",
      label: "SPRING vs UTAD",
      text: `El SPRING (en acumulación) y el UTAD (en distribución) son los eventos más importantes de Wyckoff.
SPRING: Barrida de los mínimos del rango de acumulación, seguida inmediatamente por reversión alcista. Es la trampa definitiva para los bajistas y la última oportunidad de compra barata para los institucionales.
UTAD: Ruptura de los máximos del rango de distribución, seguida inmediatamente por reversión bajista. Es la trampa definitiva para los alcistas y la última oportunidad de venta cara para los institucionales.`
    }
  ]
},

"cvd": {
  sections: [
    {
      type: "cvd-chart",
      title: "CVD — Visualización de Divergencias",
    },
    {
      title: "CVD — Cumulative Volume Delta",
      body: `El Volume Delta es la diferencia entre el volumen comprador (órdenes que llegaron al ask = agresores compradores) y el volumen vendedor (órdenes que llegaron al bid = agresores vendedores). El CVD es la suma acumulada de estos deltas a lo largo del tiempo. Mide quién está siendo MÁS agresivo: compradores o vendedores.`,
      type: "text"
    },
    {
      title: "Cómo Interpretar el CVD",
      type: "table",
      headers: ["Situación", "CVD", "Precio", "Interpretación"],
      rows: [
        ["Tendencia sana", "Subiendo con el precio", "Subiendo", "Compradores agresivos dominan — tendencia sostenible"],
        ["Tendencia sana", "Bajando con el precio", "Bajando", "Vendedores agresivos dominan — tendencia sostenible"],
        ["Divergencia alcista", "Subiendo", "Bajando", "Precio cae pero compradores dominan = absorción de oferta = rebote probable"],
        ["Divergencia bajista", "Bajando", "Subiendo", "Precio sube pero vendedores dominan = distribución = caída probable"],
        ["Pico de CVD bajista", "Cae verticalmente", "También cae", "Capitulación vendedora — posible fondo"],
        ["Pico de CVD alcista", "Sube verticalmente", "También sube", "Clímax comprador — posible techo"],
      ]
    },
    {
      type: "infobox",
      variant: "tip",
      label: "CVD + VOLUMEN",
      text: "Usa el CVD junto con el volumen total. Si el CVD muestra divergencia alcista (sube mientras el precio baja) Y el volumen del último tramo bajista es MENOR que el previo, hay doble señal de agotamiento vendedor. Este setup, en zona de soporte Wyckoff o Order Block, tiene alta probabilidad."
    }
  ]
},

"open-interest": {
  sections: [
    {
      type: "open-interest-chart",
      title: "Open Interest — Precio vs OI vs Funding",
    },
    {
      title: "Open Interest — Qué es",
      body: `El Open Interest (OI) es el número total de contratos de futuros o perpetuos que están abiertos y pendientes de liquidar. No mide el volumen del día — mide CUÁNTAS posiciones activas existen en este momento. Es un termómetro de la convicción del mercado.`,
      type: "text"
    },
    {
      title: "Interpretación del Open Interest",
      type: "table",
      headers: ["Precio", "Open Interest", "Interpretación", "Sesgo"],
      rows: [
        ["↑ Subiendo", "↑ Subiendo", "Dinero nuevo entrando en longs — tendencia alcista fuerte", "Alcista"],
        ["↑ Subiendo", "↓ Bajando", "Shorts cerrando sus posiciones (short covering) — rebote táctico", "Alcista débil"],
        ["↓ Bajando", "↑ Subiendo", "Dinero nuevo entrando en shorts — tendencia bajista fuerte", "Bajista"],
        ["↓ Bajando", "↓ Bajando", "Longs cerrando sus posiciones — caída táctica", "Bajista débil"],
      ]
    },
    {
      title: "Funding Rate — El Precio del Apalancamiento",
      body: `En perpetuos, el Funding Rate es el pago periódico (cada 8h en Binance) entre longs y shorts para mantener el precio del perpetuo cerca del spot. Si funding es POSITIVO: longs pagan a shorts (hay más longs = mercado codiciosos). Si funding es NEGATIVO: shorts pagan a longs (hay más shorts = mercado en pánico).`,
      type: "text"
    },
    {
      type: "infobox",
      variant: "key",
      label: "FUNDING EXTREMO = SEÑAL CONTRARIA",
      text: `Funding POSITIVO EXTREMO (>0.1% / 8h): Euforia — demasiados longs apalancados. El mercado buscará liquidez para liquidar esos longs. Señal BAJISTA de corto plazo.
Funding NEGATIVO EXTREMO (< -0.05% / 8h): Pánico — demasiados shorts apalancados. El mercado buscará liquidez para liquidar esos shorts. Señal ALCISTA de corto plazo.
Ejemplo histórico: En noviembre 2021 (BTC ~$69K), el funding era extremadamente positivo. En junio 2022 (BTC ~$17K), el funding era extremadamente negativo. Ambas eran señales contrarias.`
    },
    {
      title: "Long/Short Ratio y Liquidaciones",
      type: "cards",
        cards: [
          { color: "#00e676", title: "Long/Short Ratio", icon: "⚖️", text: "Ratio de posiciones largas vs cortas en exchanges (Binance, Bybit, OKX). Si >70% son longs, el mercado está excesivamente largo = riesgo de liquidación masiva si cae. Si >70% son shorts, excesivamente corto = riesgo de short squeeze si sube." },
          { color: "#ff1744", title: "Cascada de Liquidaciones", icon: "💣", text: "Cuando el precio alcanza los precios de liquidación de muchos traders, liquida posiciones, el precio se mueve más en esa dirección, liquidando más posiciones... ciclo en cascada. Explicación de los movimientos bruscos de -10% en minutos en crypto." },
        ]
    }
  ]
},

"dominancias": {
  sections: [
    {
      type: "dominance-chart",
      title: "Dominancias — BTC.D, USDT.D y Ciclo Altcoin",
    },
    {
      title: "Las 3 Dominancias Clave",
      type: "cards",
      cards: [
        { color: "#ff6d00", title: "BTC Dominance (BTC.D)", icon: "₿", text: "Porcentaje del market cap total de crypto que pertenece a Bitcoin. Alta BTC.D = capital concentrado en BTC = altcoins sufren. Baja BTC.D = capital fluyendo a altcoins = altcoin season. El ciclo típico: BTC sube primero → BTC.D baja → altcoins explotan." },
        { color: "#00e5ff", title: "USDT Dominance (USDT.D)", icon: "💵", text: "Porcentaje en stablecoins (USDT + USDC). Alta USDT.D = inversores están en cash/espera = miedo = mercado bajista o corrección. Baja USDT.D = el dinero está fluyendo hacia activos de riesgo = mercado alcista." },
        { color: "#00e676", title: "ETH Dominance (ETH.D)", icon: "Ξ", text: "Alta ETH.D relativa a BTC.D = capital fluyendo de BTC a ETH = posible inicio de altcoin season. ETH suele ser el segundo en subir después de BTC en el ciclo alcista." },
      ]
    },
    {
      title: "El Ciclo de Dominancias en Bull Market",
      type: "table",
      headers: ["Fase", "BTC.D", "USDT.D", "ETH.D", "Qué pasa con altcoins"],
      rows: [
        ["Bear market fondo", "50-70% (alta)", "15-20% (alta)", "Baja", "Altcoins en mínimos, nadie las quiere"],
        ["Inicio bull — BTC sube", "↑ Subiendo a 60%+", "↓ Bajando", "Estable-baja", "BTC lidera, altcoins siguen despacio"],
        ["Mitad bull", "~55-60%", "Bajando", "↑ Subiendo", "ETH empieza a superar a BTC"],
        ["Altcoin Season", "↓ Bajando (<45%)", "Muy baja", "Sube", "Altcoins 2x-10x en semanas, BTC relativo estable"],
        ["Techo de ciclo", "~38-45%", "Empezando a subir", "Pico", "Euforia total — señal de distribución inminente"],
        ["Inicio bear", "↑ Subiendo", "↑ Subiendo fuerte", "↓ Bajando", "Altcoins colapsan, BTC más resistente"],
      ]
    },
    {
      type: "infobox",
      variant: "warn",
      label: "ALTCOIN SEASON — SEÑAL CLAVE",
      text: "La verdadera altcoin season NO llega hasta que BTC.D rompe por debajo de ~45% con convicción. Muchos traders saltan a altcoins cuando BTC.D baja de 60% a 55%, pero el movimiento explosivo de altcoins solo ocurre cuando BTC.D cae bajo 45%. Paciencia = dinero."
    }
  ]
},

// ─── NIVEL 5 ──────────────────────────────────────────────────────────────────

"dxy": {
  sections: [
    {
      type: "dxy-correlation-chart",
      title: "DXY — Correlación con Bitcoin y Activos de Riesgo",
    },
    {
      title: "¿Qué es el DXY?",
      body: `El DXY (US Dollar Index) mide el valor del dólar americano contra una canasta de 6 monedas principales: EUR (57.6%), JPY (13.6%), GBP (11.9%), CAD (9.1%), SEK (4.2%), CHF (3.6%). Es el "termómetro" del dólar global. Tiene correlación INVERSA con la mayoría de los activos de riesgo.`,
      type: "text"
    },
    {
      title: "Correlaciones del DXY",
      type: "table",
      headers: ["Activo", "Correlación con DXY", "Explicación"],
      rows: [
        ["Oro (XAU)", "Fuerte inversa (−0.75 promedio)", "El oro está denominado en USD. Dólar fuerte = oro más caro en otras monedas = menos demanda"],
        ["EUR/USD", "Correlación inversa perfecta (−0.9+)", "El EUR es el componente más grande del DXY"],
        ["Petróleo (WTI)", "Moderada inversa (−0.5)", "Petróleo en USD. Dólar fuerte = petróleo más caro para importadores"],
        ["Bitcoin (BTC)", "Variable, tendencia inversa en crisis", "BTC reacciona más a risk-on/risk-off que al DXY directamente"],
        ["SPX (Acciones US)", "Moderada inversa (−0.4 a −0.6)", "Dólar fuerte reduce competitividad de exportaciones US"],
        ["Emerging Markets", "Fuerte inversa", "Deuda en USD de mercados emergentes se vuelve más cara"],
      ]
    },
    {
      type: "infobox",
      variant: "key",
      label: "LECTURA DEL DXY",
      text: `DXY SUBIENDO (Dólar fuerte): 
→ Presión bajista sobre commodities, acciones y crypto
→ Capital fluyendo hacia "seguridad" del dólar
→ Típico en crisis, subidas de tasas de la Fed, risk-off

DXY BAJIENDO (Dólar débil):
→ Soporte para commodities, acciones y crypto
→ Capital buscando activos de mayor rendimiento
→ Típico en QE, bajas de tasas, risk-on`
    }
  ]
},

"indices": {
  sections: [
    {
      type: "mag7-chart",
      title: "Índices Bursátiles — SPX, NASDAQ y su Impacto en Crypto",
    },
    {
      title: "Los Grandes Índices de Wall Street",
      type: "cards",
      cards: [
        { color: "#00e676", title: "S&P 500 (SPX / ES)", icon: "🏛️", text: "500 empresas más grandes de USA por capitalización. El ÍNDICE MÁS IMPORTANTE del mundo. Ponderado por capitalización (las 7 Magníficas = ~35% del peso). Termómetro del 'mercado'. Cuando el SPX sube, el 80% de acciones sube con él. Correlación alta con BTC en risk-on/risk-off." },
        { color: "#00e5ff", title: "NASDAQ 100 (NDX / NQ)", icon: "💻", text: "100 empresas tecnológicas más grandes no-financieras. MUCHO más volátil que el SPX. Dominado por FAANG + NVDA + TSLA. Liderado por el sector tech. Si NVDA o MSFT caen 5%, el NASDAQ puede caer 3%. Alta correlación con BTC en épocas de risk-off." },
        { color: "#ffd700", title: "Dow Jones (DJI / YM)", icon: "🏭", text: "30 empresas industriales históricas. El índice más antiguo (1896). Ponderado por precio (no capitalización). Menos representativo que el SPX pero muy seguido mediáticamente. Su movimiento suele ser más suave que el SPX." },
        { color: "#e040fb", title: "Russell 2000 (RUT)", icon: "📊", text: "2000 empresas pequeñas ('small caps') de USA. Barómetro de la economía doméstica. Cuando el RUT supera al SPX = la economía local está fuerte. Altísima volatilidad. En recesiones cae más que el SPX." },
      ]
    },
    {
      title: "Relación Índices con Crypto",
      type: "table",
      headers: ["Situación", "Efecto en Indices", "Efecto en Bitcoin", "Tipo de Entorno"],
      rows: [
        ["Risk-ON (apetito por riesgo)", "SPX sube, VIX bajo", "BTC sube fuerte", "Bull market / tasas bajas"],
        ["Risk-OFF (aversión al riesgo)", "SPX cae, VIX alto", "BTC cae + venta de stables", "Crisis / tasas subiendo"],
        ["Corrección SPX leve (-5%)", "Nasdaq cae -7-10%", "BTC cae -10-20%", "BTC es el activo más volátil"],
        ["Crash SPX (-20%+)", "Todos los activos caen", "BTC cae -40-60%", "Todos se venden para cubrir margin calls"],
        ["SPX en máximos históricos", "FOMO institucional", "BTC suele seguir con lag", "Institucionales distribuyen en ambos"],
      ]
    }
  ]
},

"mag7": {
  sections: [
    {
      type: "mag7-chart",
      title: "Las 7 Magníficas — Peso y Rendimiento en el SPX",
    },
    {
      title: "Las 7 Magníficas — Por Qué Importan",
      body: `Las 7 Magníficas (Apple, Microsoft, Nvidia, Alphabet/Google, Amazon, Meta, Tesla) representan ~35% del S&P 500. Esto significa que cuando estas 7 empresas suben, el S&P 500 TIENE que subir aunque el resto de las 493 empresas bajen. Son el motor del mercado de acciones global.`,
      type: "text"
    },
    {
      title: "Perfil de las MAG7",
      type: "table",
      headers: ["Empresa", "Ticker", "Foco Principal", "Correlación con Crypto"],
      rows: [
        ["NVIDIA", "NVDA", "GPUs, AI, Data Centers — lidera la revolución IA", "Alta — crypto mining + IA = mismo ciclo tech"],
        ["Microsoft", "MSFT", "Cloud (Azure), Office 365, OpenAI (49%), Xbox", "Moderada — risk-on/off general"],
        ["Apple", "AAPL", "iPhone, Mac, servicios, el mayor market cap histórico", "Baja directa — barometro del consumidor"],
        ["Amazon", "AMZN", "E-commerce + AWS cloud (mayor nube del mundo)", "Moderada — AWS compite con ETH compute"],
        ["Alphabet/Google", "GOOGL", "Google Search, YouTube, Google Cloud, Waymo", "Moderada — publicidad digital + IA"],
        ["Meta", "META", "Facebook, Instagram, WhatsApp, Reality Labs", "Moderada — redes sociales + metaverso"],
        ["Tesla", "TSLA", "EVs, energía solar, Optimus (robot), xAI", "Alta — Elon Musk mueve crypto con tweets"],
      ]
    },
    {
      type: "infobox",
      variant: "key",
      label: "NVDA — EL LÍDER DEL CICLO",
      text: "En el ciclo 2023-2024, NVIDIA fue el activo con mejor rendimiento de las MAG7 (+800% en 2023-2024). Su valoración está ligada directamente a la demanda de IA. Cuando NVDA reporta earnings, el mercado entero reacciona. La correlación NVDA-BTC en este ciclo ha sido notable: ambos son activos de 'narrativa tech + escasez + adopción institucional'."
    }
  ]
},

"vix": {
  sections: [
    {
      type: "vix-chart",
      title: "VIX — Índice de Volatilidad vs SPX",
    },
    {
      title: "VIX — El Índice del Miedo",
      body: `El VIX (CBOE Volatility Index) mide la volatilidad IMPLÍCITA del S&P 500 a 30 días, derivada de los precios de las opciones. No mide volatilidad pasada sino EXPECTATIVA de volatilidad futura. Cuando los inversores tienen miedo, compran puts (seguros) elevando el VIX. Por eso se llama el "índice del miedo".`,
      type: "text"
    },
    {
      title: "Niveles del VIX y su Significado",
      type: "table",
      headers: ["VIX", "Interpretación", "Mercado de acciones", "Impacto en Crypto"],
      rows: [
        ["<12", "Complacencia extrema — nadie tiene miedo", "Euforia — probable techo de corto plazo", "Positivo — risk-on máximo"],
        ["12-20", "Calma — mercado en modo risk-on", "Tendencia alcista saludable", "Positivo — BTC puede subir bien"],
        ["20-30", "Alerta — nerviosismo creciente", "Corrección posible o en curso", "Negativo leve — BTC puede consolidar"],
        ["30-40", "Miedo — stress institucional", "Corrección seria -10 a -20%", "Negativo — BTC caería -15-30%"],
        [">40", "Pánico — crisis activa", "Crash en curso -20%+", "Negativo extremo — BTC -30-50%"],
        [">80 (histórico)", "Pánico extremo (COVID 2020, 2008)", "Mercado en crisis sistémica", "Capitulación total"],
      ]
    },
    {
      type: "infobox",
      variant: "tip",
      label: "VIX COMO CONTRAINDICADOR",
      text: "En extremos, el VIX es un CONTRAINDICADOR. Cuando el VIX llega a 40-50+, el mercado está en pánico máximo = zona de compra histórica. Los mejores momentos para comprar BTC han sido cuando el VIX estuvo sobre 40 (COVID marzo 2020: BTC a $3,800 — luego fue a $69K). Miedo extremo = oportunidad para el preparado."
    }
  ]
},

"bonos": {
  sections: [
    {
      type: "bonds-chart",
      title: "Yield 10Y — Impacto en Acciones y Crypto",
    },
    {
      title: "Bonos del Tesoro USA — Qué son",
      body: `Los bonos del Tesoro americano (Treasuries) son deuda emitida por el gobierno de USA. El yield (rendimiento) del bono a 10 años (US10Y) es el tipo de interés de referencia más importante del mundo — todo lo demás se precio sobre él: hipotecas, créditos corporativos, valoraciones de acciones.`,
      type: "text"
    },
    {
      title: "Yield vs Precio",
      type: "infobox",
      variant: "key",
      text: `El precio del bono y su yield se mueven en DIRECCIÓN OPUESTA.
Cuando los inversores COMPRAN bonos: precio ↑, yield ↓ (buscan seguridad)
Cuando los inversores VENDEN bonos: precio ↓, yield ↑ (buscan más rendimiento)

Yield 10Y SUBIENDO = expectativa de inflación alta / Fed subiendo tasas = MALO para acciones y crypto
Yield 10Y BAJANDO = expectativa de recesión / Fed bajando tasas = BUENO para activos de riesgo`,
      label: "INVERSA YIELD-PRECIO"
    },
    {
      title: "La Curva de Rendimientos",
      body: `La curva de rendimientos muestra los yields de bonos a distintos plazos (2Y, 5Y, 10Y, 30Y). Normalmente la curva es empinada (ascendente): los bonos a más largo plazo pagan más. Cuando se INVIERTE (2Y yield > 10Y yield), históricamente ha precedido recesiones. La inversión de 2022-2023 fue la más profunda desde los 80s.`,
      type: "text"
    }
  ]
},

"oro": {
  sections: [
    {
      type: "gold-cycles-chart",
      title: "Oro — Ciclos Históricos y Correlaciones Macro",
    },
    {
      title: "Oro — El Activo Refugio Eterno",
      body: `El oro ha sido reserva de valor por 5,000 años. En el sistema financiero moderno es el activo refugio por excelencia durante crisis, inflación e incertidumbre geopolítica. No paga dividendos ni intereses, pero mantiene poder adquisitivo a largo plazo.`,
      type: "text"
    },
    {
      title: "Factores que Mueven el Oro",
      type: "cards",
      cards: [
        { color: "#ffd700", title: "Tasas de Interés Reales", icon: "📉", text: "La variable más importante. Tasa real = tasa nominal - inflación. Si tasas reales bajan (Fed sube tasas pero la inflación sube más rápido), el oro SUBE. Si tasas reales suben (Fed sube tasas más rápido que inflación), el oro CAE." },
        { color: "#00e5ff", title: "Dólar (DXY)", icon: "💵", text: "Correlación inversa fuerte. Dólar débil = oro sube. El oro está denominado en USD, así que un dólar fuerte lo encarece para compradores internacionales (menos demanda)." },
        { color: "#ff1744", title: "Geopolítica y Crisis", icon: "⚠️", text: "En guerras, crisis bancarias o incertidumbre extrema los inversores HUYEN al oro. 2022 (guerra Ucrania), 2008 (crisis financiera) = explosiones del oro. También sube cuando hay riesgo de default soberano." },
        { color: "#00e676", title: "Demanda de Bancos Centrales", icon: "🏦", text: "Los bancos centrales (especialmente China, India, Rusia, Turquía) acumulan oro para diversificar reservas alejándose del dólar. Desde 2022, la compra de bancos centrales está en máximos históricos." },
      ]
    },
    {
      type: "infobox",
      variant: "pro",
      label: "ORO Y BITCOIN — ¿COMPETIDORES?",
      text: "Bitcoin es llamado 'digital gold' — escasez programática (21M BTC), descentralizado, no falsificable. En el largo plazo, parte del capital que va al oro podría ir a BTC. A corto plazo, cuando hay crisis EXTREMA, BTC cae con el resto de activos de riesgo mientras el oro sube. En tendencias alcistas, BTC supera masivamente al oro (BTC +800% vs Oro +50% en 2023-2024)."
    }
  ]
},

"petroleo": {
  sections: [
    {
      type: "candle-chart",
      title: "WTI Petróleo — Ciclo de Precio y Zonas Clave",
      candles: [
        { open: 35, high: 42, close: 28, low: 22 },
        { open: 27, high: 35, close: 32, low: 24 },
        { open: 31, high: 38, close: 36, low: 29 },
        { open: 35, high: 55, close: 52, low: 33, label: "OPEC +" },
        { open: 51, high: 68, close: 65, low: 49 },
        { open: 64, high: 85, close: 80, low: 62, label: "Conflicto" },
        { open: 79, high: 88, close: 72, low: 68 },
        { open: 71, high: 76, close: 58, low: 55, label: "Recesión" },
        { open: 57, high: 63, close: 60, low: 53 },
        { open: 59, high: 70, close: 67, low: 57 },
      ],
      lines: [
        { y: 40, color: "#00e676", label: "SOPORTE CLAVE $40", dash: true },
        { y: 80, color: "#ff1744", label: "RESISTENCIA $80", dash: true },
      ],
      annotations: [
        { x: 3, y: 60, text: "Recorte OPEC", color: "#ffd700" },
        { x: 5, y: 88, text: "Risk premium geo", color: "#ff1744" },
        { x: 7, y: 72, text: "Demand drop", color: "#00e5ff" },
      ],
    },
    {
      title: "Petróleo — Motor de la Economía Global",
      body: `El petróleo es la fuente de energía más importante del mundo. El WTI (West Texas Intermediate) es el precio de referencia de USA y el Brent del mercado internacional. El petróleo afecta directamente la inflación (energía = 10-15% del IPC) y por tanto las políticas de la Fed.`,
      type: "text"
    },
    {
      title: "Factores que Mueven el Petróleo",
      type: "table",
      headers: ["Factor", "Efecto", "Ejemplo"],
      rows: [
        ["OPEC+ recortes de producción", "Precio sube", "Arabia Saudita recorta 1M bbl/día → WTI +15%"],
        ["OPEC+ aumentos de producción", "Precio cae", "2014-2016: Saudíes inundan mercado → WTI de $100 a $28"],
        ["Conflicto en Medio Oriente", "Precio sube (risk premium)", "Oct 2023: Hamas ataca Israel → WTI +8% en días"],
        ["Recesión global", "Precio cae (menos demanda)", "2020 COVID: WTI negativo (-$37/bbl en futuros)"],
        ["Dólar fuerte", "Precio baja", "DXY sube → petróleo más caro para resto del mundo → menos demanda"],
        ["China demanda fuerte", "Precio sube", "China es el mayor importador — su crecimiento = más demanda"],
      ]
    },
    {
      type: "infobox",
      variant: "warn",
      label: "PETRÓLEO E INFLACIÓN",
      text: "Petróleo alto = inflación alta (energía, transporte, producción todo sube) → Fed sube tasas → Presión bajista en acciones y crypto. Petróleo bajo = inflación baja → Fed puede bajar tasas → Presión alcista en activos de riesgo. Por eso el precio del WTI está SIEMPRE en el radar de la Fed."
    }
  ]
},

"ciclos-crypto": {
  sections: [
    {
      type: "bitcoin-cycles-chart",
      title: "Ciclos de Bitcoin — Halvings y Patrones Históricos",
    },
    {
      title: "El Ciclo de 4 Años de Bitcoin",
      body: `Bitcoin tiene un ciclo de aproximadamente 4 años ligado al halving: evento programado cada ~210,000 bloques (~4 años) donde la recompensa del minero se reduce a la mitad. Cada ciclo ha seguido un patrón similar: acumulación post-halving → bull market explosivo → distribución → bear market.`,
      type: "text"
    },
    {
      title: "Los Halvings Históricos de Bitcoin",
      type: "table",
      headers: ["Halving", "Fecha", "Precio aprox.", "Ciclo Máximo", "Máximo ATH"],
      rows: [
        ["1er Halving", "Nov 2012", "$12", "Nov 2013", "$1,163 (+9,700%)"],
        ["2do Halving", "Jul 2016", "$660", "Dic 2017", "$19,891 (+3,000%)"],
        ["3er Halving", "May 2020", "$8,700", "Nov 2021", "$69,000 (+790%)"],
        ["4to Halving", "Abr 2024", "$63,000", "¿2025?", "TBD"],
      ]
    },
    {
      title: "Fases del Ciclo de Bitcoin",
      type: "cards",
      cards: [
        { color: "#00e5ff", title: "Fase 1: Acumulación (pre-halving)", icon: "🔵", text: "1-2 años después del bear market. Precio estable-lateral o lentamente alcista. Volumen bajo. Capitulación de los últimos vendedores. Smart money acumula silenciosamente. Miedo extremo (Fear & Greed <20). Bitcoin Dominance alta." },
        { color: "#00e676", title: "Fase 2: Bull Market Temprano (post-halving)", icon: "📈", text: "Los 12-18 meses posteriores al halving. La reducción de oferta nueva empieza a impactar. El precio sube gradualmente. Noticias positivas: ETFs, adopción institucional. Narrativa de 'esta vez será diferente'." },
        { color: "#ffd700", title: "Fase 3: Euforia (late bull)", icon: "🚀", text: "Últimos 6-12 meses del ciclo alcista. Subidas parabólicas. FOMO masivo. Altcoins explotan. Noticias en mainstream media. Todo el mundo 'invierte'. Fear & Greed >90. Este es el momento de ir reduciendo exposición." },
        { color: "#ff1744", title: "Fase 4: Bear Market", icon: "🐻", text: "1-2 años de corrección. El precio cae 70-85% desde el ATH. Narrativas de 'Bitcoin ha muerto'. Pérdidas masivas del retail. Smart money acumula. El ciclo comienza de nuevo..." },
      ]
    },
    {
      type: "infobox",
      variant: "key",
      label: "INDICADORES DE TECHO DE CICLO",
      text: `Pi Cycle Top Indicator: Cuando la EMA 111 días cruza la EMA 350d x2.
MVRV Z-Score: Sobre 7 = techo histórico (Miner Value Ratio vs Realised Value).
Puell Multiple: Sobre 4 = mineros en zona de venta extrema.
NUPL: Sobre 0.75 = euforia extrema.
Fear & Greed: >85 sostenido por semanas.
En los 3 halvings anteriores, cuando 3+ de estos indicadores estaban en zona extrema, el techo estaba próximo.`
    }
  ]
}

};
