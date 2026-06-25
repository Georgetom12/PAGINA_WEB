import type { AulaModuleContent } from "../types";

export const contentN4N5: Record<string, AulaModuleContent> = {
// ─── NIVEL 4 ──────────────────────────────────────────────────────────────────

"wyckoff": {
  sections: [
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
      type: "wyckoff-chart",
      title: "Wyckoff — Diagrama Completo de Fases",
    },
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
    },
    {
      title: "Checklist de Confirmación Wyckoff",
      type: "table",
      headers: ["Condición", "Acumulación (Long)", "Distribución (Short)"],
      rows: [
        ["Fase identificada", "A-B-C completadas con SC y Spring claro", "A-B-C completadas con BC y UTAD claro"],
        ["Volumen en evento clave", "SC con volumen extremo, Spring con volumen bajo", "BC con volumen extremo, UTAD con volumen bajo"],
        ["Test del evento clave", "Re-test del Spring con volumen aún menor", "Re-test del UTAD con volumen aún menor"],
        ["SOS / SOW", "Primera ruptura alcista del rango (SOS) confirmada", "Primera ruptura bajista del rango (SOW) confirmada"],
        ["LPS / LPSY", "Retroceso a la parte alta del rango con volumen bajo", "Rebote a la parte baja del rango con volumen bajo"],
        ["Timeframes alineados", "Estructura W acumulación visible en HTF (diario+)", "Estructura W distribución visible en HTF (diario+)"],
      ]
    },
    {
      title: "Wyckoff en Crypto — Aplicaciones Modernas",
      type: "cards",
      cards: [
        { color: "#00e5ff", title: "Wyckoff en BTC (macro)", icon: "₿", text: "Los grandes ciclos de BTC (2018-2019, 2022-2023) son perfectos esquemas de acumulación Wyckoff. El SC = capitulación al fondo del bear market. El Spring = barrida de los mínimos del bear. El SOS = primera ruptura alcista. Identifica la Fase C para entrar con R:R óptimo." },
        { color: "#ffd700", title: "Wyckoff en Futuros Perpetuos", icon: "📊", text: "El CVD y el Open Interest son herramientas de Wyckoff modernas. Volumen delta bajista en SC pero precio no hace nuevo mínimo = absorción = confirmación Wyckoff. OI bajando mientras el precio forma el rango = contratos cerrando = acumulación real." },
        { color: "#00e676", title: "Wyckoff en LTF (Intraday)", icon: "⏱", text: "Los mismos esquemas aparecen en timeframes de 5m-1H para trading intraday. Un esquema de acumulación en 15m dentro de una tendencia alcista en 4H es un LPS de alta probabilidad. El Spring en 15m = barrida de liquidez intraday = entrada institucional." },
      ]
    }
  ]
},

"cvd": {
  sections: [
    {
      type: "cvd-chart",
      title: "CVD — Divergencia con el Precio",
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
    },
    {
      title: "Herramientas para Analizar el CVD",
      type: "cards",
      cards: [
        { color: "#00e5ff", title: "Footprint Chart", icon: "🦶", text: "Muestra el delta de volumen vela a vela e incluso nivel a nivel de precio. Puedes ver exactamente en qué precio hubo más agresión compradora o vendedora. Herramientas: Bookmap, Quantower, Sierra Chart, ATAS. En crypto: Exocharts, Hyblock." },
        { color: "#ffd700", title: "TradingView CVD", icon: "📈", text: "En TradingView usa el indicador 'Cumulative Volume Delta' (CVD) disponible en la librería de Pine Script. También busca 'Volume Delta' para barras individuales. En Binance Futures el CVD se puede construir con datos de trades tick a tick." },
        { color: "#00e676", title: "Exchange-Level CVD", icon: "🏦", text: "El CVD de Binance y el de Bybit pueden diferir porque cada exchange tiene su propia base de usuarios y flujo de órdenes. Comparar el CVD entre exchanges es una señal avanzada: si BTC sube pero el CVD de Binance diverge mientras el de Bybit sube, hay desacuerdo institucional." },
      ]
    },
    {
      title: "Divergencias CVD — Los 4 Setups Clave",
      type: "table",
      headers: ["Setup", "CVD", "Precio", "Acción", "Confirmación"],
      rows: [
        ["Absorción alcista", "Subiendo", "Bajando o lateral", "Preparar long", "Vela de reversión alcista en zona clave"],
        ["Absorción bajista", "Bajando", "Subiendo o lateral", "Preparar short", "Vela de reversión bajista en zona clave"],
        ["Agotamiento comprador", "Pico máximo y gira", "Sigue subiendo", "Short especulativo", "CHoCH en LTF con volumen decreciente"],
        ["Agotamiento vendedor", "Pico mínimo y gira", "Sigue bajando", "Long especulativo", "CHoCH en LTF con volumen decreciente"],
      ]
    }
  ]
},

"open-interest": {
  sections: [
    {
      type: "open-interest-chart",
      title: "Open Interest — Lectura del Posicionamiento",
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
    },
    {
      title: "Combinando OI + CVD + Precio — El Triángulo de Confirmación",
      type: "table",
      headers: ["OI", "CVD", "Precio", "Señal", "Probabilidad"],
      rows: [
        ["↑ Sube", "↑ Sube", "↑ Sube", "Tendencia alcista con dinero nuevo entrando y agresión compradora", "Alta ★★★★"],
        ["↑ Sube", "↓ Baja", "↑ Sube", "Dinero nuevo en shorts mientras precio sube — short squeeze inminente", "Alta para long ★★★★"],
        ["↓ Baja", "↑ Sube", "↑ Sube", "Shorts cubriendo (short covering) — rally sin convicción real", "Moderada ★★★"],
        ["↓ Baja", "↓ Baja", "↓ Baja", "Longs cerrando — caída sin shorts nuevos — agotamiento bajista próximo", "Moderada ★★★"],
        ["↑ Sube", "↑ Sube", "↓ Baja", "Dinero nuevo en longs + agresión compradora pero precio cae — absorción extrema", "Muy alta para long ★★★★★"],
        ["↑ Sube", "↓ Baja", "↓ Baja", "Dinero nuevo en shorts + agresión vendedora — tendencia bajista fuerte", "Alta ★★★★"],
      ]
    },
    {
      title: "Herramientas para Monitorear OI y Liquidaciones",
      type: "cards",
      cards: [
        { color: "#00e5ff", title: "CoinGlass", icon: "🔍", text: "La herramienta más completa para OI, funding rate y liquidaciones en tiempo real. Muestra el mapa de liquidaciones: niveles de precio donde se liquidaría más capital. Es como un mapa del tesoro del mercado — el precio va a buscar esos niveles." },
        { color: "#ffd700", title: "Hyblock Capital", icon: "📊", text: "Visualización avanzada de liquidaciones, CVD y Order Book. Su 'Liquidation Heatmap' muestra en calor visual dónde hay más liquidaciones acumuladas. Los niveles con más calor son imanes de precio." },
        { color: "#e040fb", title: "Velo Data / Glassnode", icon: "📡", text: "Para OI on-chain en derivados. Glassnode muestra OI de opciones de BTC en CME y Deribit. Eventos de vencimiento de opciones (cada último viernes del mes) suelen crear volatilidad — el 'max pain' es el nivel donde vencen con menor pago." },
      ]
    }
  ]
},

"dominancias": {
  sections: [
    {
      type: "dominance-chart",
      title: "BTC.D — Ciclos de Dominancia",
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
    },
    {
      title: "Cómo Operar las Dominancias — Setup Práctico",
      type: "table",
      headers: ["Señal", "Acción", "Activos favorecidos", "Riesgo"],
      rows: [
        ["BTC.D rompe soporte y baja con volumen", "Rotar capital de BTC a ETH y altcoins de alta capitalización", "ETH, SOL, BNB, altcoins L1", "Si el mercado cae en general, todas caen más que BTC"],
        ["USDT.D rompe resistencia y sube", "Salir de posiciones de riesgo, pasar a stablecoins", "USDT, USDC, cash", "Puede ser señal falsa en correcciones normales"],
        ["BTC.D rompe resistencia y sube", "Concentrar en BTC, reducir altcoins", "BTC (posiblemente ETH)", "Altcoins pueden subir igualmente si el mercado está en euforia"],
        ["ETH/BTC rompe resistencia alcista", "Iniciar posición en ETH y tokens del ecosistema Ethereum", "ETH, AAVE, UNI, staking ETH", "Puede ser rotación temporal antes de corrección general"],
        ["USDT.D en mínimos históricos (<3%)", "ALERTA: el mercado está en euforia — reducir exposición gradualmente", "Stablecoins y activos defensivos", "La euforia puede continuar semanas antes del techo"],
      ]
    },
    {
      title: "Dominancias y Market Cap Total (TOTAL)",
      type: "cards",
      cards: [
        { color: "#ff6d00", title: "TOTAL — Market Cap Global", icon: "🌐", text: "El market cap total de crypto (TOTAL en TradingView) es el indicador macro más importante. Cuando TOTAL hace nuevos máximos con BTC.D bajando = altcoin season activa. Cuando TOTAL cae pero BTC.D sube = rotación a BTC = bear market temprano." },
        { color: "#00e5ff", title: "TOTAL2 — Sin Bitcoin", icon: "₿", text: "TOTAL2 excluye a Bitcoin. Mide el mercado de altcoins por separado. Si TOTAL2 sube más rápido que TOTAL = altcoins superando a BTC. Si TOTAL2 cae mientras TOTAL sube = BTC concentra todo el capital." },
        { color: "#00e676", title: "TOTAL3 — Sin BTC ni ETH", icon: "Ξ", text: "TOTAL3 excluye tanto a Bitcoin como a Ethereum. Mide el mercado de altcoins más pequeñas. Si TOTAL3 explota mientras TOTAL2 sube moderado = small caps y micro-caps en distribución (euforia final de ciclo)." },
      ]
    }
  ]
},

// ─── NIVEL 5 ──────────────────────────────────────────────────────────────────

"dxy": {
  sections: [
    {
      type: "dxy-correlation-chart",
      title: "DXY vs BTC — Correlación Inversa",
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
    },
    {
      title: "Ciclos Históricos del DXY y su Impacto en Crypto",
      type: "table",
      headers: ["Período DXY", "Movimiento", "BTC / Crypto", "Contexto macroeconómico"],
      rows: [
        ["2017 (DXY cae de 103 a 91)", "−12%", "BTC +1,900% (de $1K a $20K)", "Fed sin subidas agresivas, risk-on global"],
        ["2018-2019 (DXY sube a 99)", "+8%", "BTC −84% bear market", "Fin del ciclo alcista, tightening anticipado"],
        ["Mar 2020 (DXY spike a 103)", "+8% en días", "BTC −50% en horas", "Crisis COVID — liquidación de todo por dólares"],
        ["2020-2021 (DXY cae a 89)", "−12%", "BTC +1,400% (de $10K a $69K)", "QE masivo, tasas a 0%, máxima liquidez"],
        ["2022 (DXY sube a 114, máximo 20 años)", "+18%", "BTC −77% (de $47K a $16K)", "Fed sube tasas más rápido en 40 años"],
        ["2023-2024 (DXY cae de 114 a 100)", "−12%", "BTC +300% (de $16K a $73K)", "Expectativa de bajadas de tasas, ETFs BTC"],
      ]
    },
    {
      title: "DXY y la Política de la Fed — La Conexión Clave",
      type: "cards",
      cards: [
        { color: "#ffd700", title: "Fed Hawkish (Restrictiva)", icon: "🦅", text: "Cuando la Fed sube tasas o habla de reducir el balance (QT), el dólar se fortalece → DXY sube → presión sobre todos los activos de riesgo. Cada reunión del FOMC (8 al año) es un evento de alto impacto. El dot plot y los comentarios de Jerome Powell mueven mercados más que el precio." },
        { color: "#00e676", title: "Fed Dovish (Expansiva)", icon: "🕊️", text: "Cuando la Fed baja tasas, pausa las subidas, o habla de QE, el dólar se debilita → DXY baja → activos de riesgo suben. Históricamente, el primer recorte de tasas del ciclo dispara a BTC con 6-12 meses de lag." },
        { color: "#00e5ff", title: "Dollar Milkshake Theory", icon: "🥤", text: "Teoría de Brent Johnson: el dólar eventualmente absorbe capital de todo el mundo (emerging markets, Europa, Japón) porque su sistema de deuda en USD es un imán. Implica que el DXY puede subir mucho antes de colapsar. Útil para entender por qué el DXY puede ser fuerte aunque la Fed baje tasas." },
      ]
    }
  ]
},

"indices": {
  sections: [
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
    },
    {
      title: "Horarios de Wall Street — Calendario del Trader",
      type: "table",
      headers: ["Evento / Sesión", "Horario UTC", "Impacto en Mercados", "Prioridad"],
      rows: [
        ["Pre-market NYSE", "13:00–14:30 UTC", "Movimientos en futuros (ES, NQ) y ETFs. Menor liquidez pero puede dar dirección.", "Media"],
        ["Apertura NYSE/NASDAQ", "14:30 UTC", "El momento de mayor volatilidad del día. Primer precio real del día = gap up o gap down.", "MUY ALTA"],
        ["London Close", "16:00 UTC", "Salida de posiciones europeas — puede crear reversiones bruscas.", "Alta"],
        ["NY AM Session", "14:30–17:00 UTC", "Mayor volumen del día. Setups ICT más confiables. BTC más volátil.", "MUY ALTA"],
        ["Fed FOMC Meeting", "19:00 UTC (aprox)", "8 veces al año. Puede mover mercados ±3-5% en minutos. Calendário en FedCalendar.net.", "EXTREMA"],
        ["Cierre NYSE", "21:00 UTC", "Final de la sesión americana. Cierre de posiciones intraday.", "Alta"],
        ["Earnings Reports", "Post-market (21:00+) o Pre-market", "Cada empresa reporta sus resultados trimestrales. MAG7 pueden mover el índice entero.", "MUY ALTA"],
        ["CPI / NFP / PCE", "12:30 o 14:30 UTC (primer viernes del mes para NFP)", "Datos macro que mueven el DXY, bonos, acciones y BTC simultáneamente.", "EXTREMA"],
      ]
    },
    {
      type: "infobox",
      variant: "pro",
      label: "CORRELACIÓN DINÁMICA SPX-BTC",
      text: `La correlación entre el SPX y BTC no es estática — varía según el ciclo de mercado:
ALTA correlación (0.7+): En episodios de risk-off (crisis, subida de tasas) — BTC se vende junto con acciones para cubrir margin calls. 
BAJA correlación (<0.3): En tendencias alcistas independientes de BTC (narrativa propia, ETFs, halving) — BTC puede subir mientras SPX está plano.
Herramienta práctica: Cuando el SPX cae más del 2% en un día, estudia el comportamiento de BTC. Si BTC cae MENOS porcentualmente que SPX, hay fortaleza relativa = señal alcista para BTC. Si cae MÁS = debilidad = riesgo adicional.`
    }
  ]
},

"mag7": {
  sections: [
    {
      type: "mag7-chart",
      title: "MAG7 — Performance vs BTC",
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
    },
    {
      title: "Earnings Season — Cómo Afecta al Mercado",
      body: `Las earnings (resultados trimestrales) son los eventos más impactantes para acciones individuales. Las MAG7 reportan 4 veces al año. Un solo earnings de NVDA o MSFT puede mover el índice entero +2% o −3% en afterhours. El mercado anticipa con semanas de antelación.`,
      type: "text"
    },
    {
      title: "Cómo Operar el Earnings Season",
      type: "table",
      headers: ["Estrategia", "Cuándo", "Riesgo", "Alternativa más segura"],
      rows: [
        ["Comprar antes del earnings ('play the run-up')", "1-2 semanas antes del reporte", "El stock puede caer aunque el earnings sea bueno ('sell the news')", "Comprar en la corrección POST-earnings si los números son buenos"],
        ["Short previo al earnings", "Días antes del reporte esperando caída", "Si el earnings supera expectativas, el gap alcista puede ser brutal", "Esperar el reporte y luego operar en dirección del movimiento"],
        ["Comprar puts/calls (opciones) antes del earnings", "1 semana antes", "La volatilidad implícita cae post-earnings (IV crush) reduciendo el valor de la opción aunque el precio se mueva en tu dirección", "Muy avanzado — solo si conoces opciones"],
        ["Operar el gap post-earnings", "Primer día de trading después del reporte", "El gap puede continuar o revertir rápidamente", "Esperar la primera vela de 15m para confirmar dirección"],
      ]
    },
    {
      title: "El Peso Real de las MAG7 en el SPX",
      type: "cards",
      cards: [
        { color: "#ffd700", title: "Beta Amplificada", icon: "⚡", text: "Las MAG7 tienen beta alta respecto al índice (NVDA beta ~1.8). Cuando el mercado sube 1%, NVDA sube ~1.8%. Esto amplia el rendimiento del índice en subidas, pero también amplifica las caídas." },
        { color: "#00e5ff", title: "Equal Weight vs Cap-Weight", icon: "⚖️", text: "El SPX 500 Equal Weight (RSP) trata a todas las empresas igual (0.2% cada una). Cuando RSP supera al SPX (cap-weighted) = mercado amplio fuerte, no solo MAG7. Cuando MAG7 lideran todo = mercado estrecho = señal de debilidad potencial." },
        { color: "#ff6d00", title: "MAG7 y Crypto", icon: "🔗", text: "En ciclos tech (2023-2024), MAG7 y BTC subieron juntos por la narrativa de 'escasez digital + IA'. Si las MAG7 entran en corrección por valuaciones excesivas, BTC puede seguir. Vigila el P/E ratio de NVDA como termómetro del apetito especulativo." },
      ]
    }
  ]
},

"vix": {
  sections: [
    {
      type: "vix-chart",
      title: "VIX — Niveles de Miedo y Calma",
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
    },
    {
      title: "VVIX — La Volatilidad de la Volatilidad",
      body: `El VVIX mide la volatilidad del propio VIX — qué tan inestable está el VIX mismo. Un VVIX alto (>120) indica que el mercado espera grandes swings en el VIX próximamente = incertidumbre extrema sobre la dirección. VVIX > VIX en términos de señal: a veces el VVIX anticipa el spike del VIX días antes.`,
      type: "text"
    },
    {
      title: "VIX Histórico — Los Grandes Eventos de Pánico",
      type: "table",
      headers: ["Evento", "Fecha", "VIX máximo", "SPX caída", "BTC caída", "Recuperación BTC"],
      rows: [
        ["Crisis financiera global", "Oct 2008", "89.5", "−57%", "N/A (no existía)", "N/A"],
        ["Flash Crash", "May 2010", "48.2", "−13% en un día", "N/A", "N/A"],
        ["Crisis deuda europea", "Ago 2011", "48.0", "−20%", "BTC cayó −80% después", "Meses"],
        ["COVID Crash", "Mar 2020", "82.7", "−35% en días", "−50% en 2 días ($3,800)", "BTC +1,400% en 18 meses"],
        ["Subidas Fed 2022", "Oct 2022", "34.5", "−27%", "−77% (de $47K a $16K)", "BTC +300% en 2023-2024"],
        ["Yen Carry Trade Unwinding", "Ago 2024", "65.7 (intradía)", "−10% en días", "−30% en días (de $64K a $49K)", "Recuperación en semanas"],
      ]
    },
    {
      title: "Estrategias con el VIX",
      type: "cards",
      cards: [
        { color: "#00e676", title: "VIX < 15 — Comprar volatilidad", icon: "😴", text: "Cuando el VIX está muy bajo, el mercado está complaciente. Los institucionales compran opciones baratas (puts de protección) anticipando un spike futuro. Para el trader de crypto: VIX bajo es momento de subir stops y no sobre-leveragear — el complacency precede a los crashes." },
        { color: "#ff1744", title: "VIX > 40 — Comprar el activo", icon: "🎯", text: "Cuando el VIX spikea sobre 40, el miedo está en su pico. Históricamente el 80% de las veces el mercado hace un gran rebote en las semanas siguientes. Para crypto: busca zonas de soporte clave en BTC durante VIX extremos para entradas de alta probabilidad." },
        { color: "#ffd700", title: "VIX y el Put/Call Ratio", icon: "📊", text: "El Put/Call Ratio (PCR) mide cuántas puts se compran vs cuántas calls. PCR > 1.2 = miedo dominante. PCR < 0.7 = codicia. Cuando PCR y VIX están ambos en extremos de miedo, la señal de compra contraria es la más fuerte." },
      ]
    }
  ]
},

"bonos": {
  sections: [
    {
      type: "bonds-chart",
      title: "Yields — US10Y vs Mercados de Riesgo",
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
    },
    {
      title: "El Indicador Yield 2Y-10Y — Historial de Recesiones",
      type: "table",
      headers: ["Período de inversión", "Duración", "Recesión posterior", "Retardo"],
      rows: [
        ["Ago 1978 – Sep 1980", "24 meses", "Recesión 1980-1982", "~6 meses"],
        ["Jun 1989 – Mar 1990", "9 meses", "Recesión 1990-1991", "~12 meses"],
        ["Feb 2000 – Dic 2000", "10 meses", "Recesión 2001 (Dot-com)", "~12 meses"],
        ["Dic 2005 – Jun 2007", "19 meses", "Gran Recesión 2008-2009", "~18 meses"],
        ["Mar 2022 – Dic 2023", "21 meses", "¿Recesión 2024-2025?", "TBD"],
      ]
    },
    {
      title: "Real Yields y su Impacto en BTC y Oro",
      type: "cards",
      cards: [
        { color: "#ffd700", title: "Real Yield = Nominal − Inflación", icon: "📐", text: "El yield real del bono 10Y (TIPS yield en TradingView: TIP o DJP) es el dato más importante para el precio del oro y para los activos de larga duración como BTC. TIPS yield negativo = dinero buscando protección en activos reales = oro y BTC suben." },
        { color: "#00e5ff", title: "TIPS Negativo → Oro y BTC al alza", icon: "📈", text: "En 2020-2021, los TIPS cayeron a −1% negativos → el oro llegó a $2,089 y BTC a $69K. En 2022, los TIPS subieron a +1.5% positivos → el oro cayó y BTC perdió −77%. La variable más predictiva para activos de reserva de valor es el real yield, no el yield nominal." },
        { color: "#00e676", title: "Vigilar: US10Y, DXY, TIP", icon: "👁️", text: "El trio US10Y + DXY + TIP (TIPS ETF) te da el contexto macroeconómico completo. Si los tres apuntan en la misma dirección adversa (yields subiendo + dólar fuerte + TIPS positivos), es el peor entorno posible para crypto. Si apuntan en la dirección favorable, es el mejor." },
      ]
    }
  ]
},

"oro": {
  sections: [
    {
      type: "gold-cycles-chart",
      title: "Oro — Ciclos Históricos",
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
    },
    {
      title: "Ciclos Históricos del Oro — Los Grandes Movimientos",
      type: "table",
      headers: ["Ciclo", "Precio inicial", "Precio máximo", "Rendimiento", "Motor principal"],
      rows: [
        ["1971–1980", "$35/oz", "$850/oz", "+2,328%", "Nixon cierra el patrón oro (1971), inflación de los 70s, crisis petróleo"],
        ["1999–2011", "$252/oz", "$1,921/oz", "+662%", "Dot-com crash, guerra Iraq, QE post-2008"],
        ["2015–2020", "$1,050/oz", "$2,089/oz", "+99%", "Tasas a 0%, QE COVID, TIPS negativos"],
        ["2022–2024", "$1,620/oz", "$2,770+/oz", "+70%+", "Compras de bancos centrales, de-dolarización, geopolítica global"],
      ]
    },
    {
      title: "Oro y la De-dolarización Global",
      body: `Desde la congelación de reservas rusas en 2022, los bancos centrales de China, India, Arabia Saudita y Turquía aceleran la compra de oro para diversificar lejos del dólar. 2022, 2023 y 2024 registraron las mayores compras de oro por bancos centrales en décadas. Este factor estructural (no especulativo) es el motivo por el que el oro subió incluso con el DXY fuerte y los TIPS positivos — algo históricamente inusual.`,
      type: "text"
    }
  ]
},

"petroleo": {
  sections: [
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
    },
    {
      title: "WTI vs Brent — Las Dos Referencias del Petróleo",
      type: "table",
      headers: ["Característica", "WTI (West Texas Intermediate)", "Brent (Mar del Norte)"],
      rows: [
        ["Región", "EE.UU. — Midwest / Cushing, Oklahoma", "Europa y mercados internacionales"],
        ["Calidad", "Más ligero y dulce (menos azufre)", "Ligeramente más pesado"],
        ["Referencia", "NYMEX — usado para precios en USA", "ICE — precio de referencia global (65% del mundo)"],
        ["Ticker TradingView", "USOIL / CL1!", "UKOIL / BRN1!"],
        ["Spread típico", "El Brent suele ser $2-$5 más caro que el WTI", "Diferencia se amplía en crisis de suministro"],
      ]
    },
    {
      title: "Petróleo, Transición Energética y Narrativas de Largo Plazo",
      type: "cards",
      cards: [
        { color: "#ff6d00", title: "Peak Oil Demand vs Peak Supply", icon: "🛢️", text: "Debate central del mercado: ¿llegaremos antes al pico de demanda (vehículos eléctricos, energía renovable) o al pico de oferta (agotamiento de reservas)? Si la demanda pica antes, el petróleo baja gradualmente a largo plazo. Si la oferta pica antes, puede haber un último superciclo antes del declive." },
        { color: "#00e676", title: "Petrodólar y el Sistema Financiero", icon: "💵", text: "Desde 1973, el petróleo se cotiza en dólares (petrodólar) → cualquier país que quiera petróleo necesita dólares → demanda estructural del USD. Si Arabia Saudita comienza a vender petróleo en yuanes (lo está explorando), el petrodólar entraría en crisis → impacto masivo en el DXY y en la geopolítica global." },
        { color: "#00e5ff", title: "Petróleo y Crypto Mining", icon: "⛏️", text: "El precio de la energía afecta directamente el costo de minería de Bitcoin. WTI bajo = electricidad más barata = mineros más rentables = más hashrate. El 'hash price' (ingreso por terahash por día) y el costo de minería son indicadores del floor de precio de BTC." },
      ]
    }
  ]
},

"ciclos-crypto": {
  sections: [
    {
      type: "bitcoin-cycles-chart",
      title: "Bitcoin — Ciclos de Halving",
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
    },
    {
      title: "On-Chain: Métricas para Seguir el Ciclo en Tiempo Real",
      type: "table",
      headers: ["Indicador", "Qué mide", "Señal de fondo", "Señal de techo", "Fuente"],
      rows: [
        ["MVRV Z-Score", "Market Value vs Realized Value vs desviación estándar", "Zona verde (<0)", "Zona roja (>7)", "Glassnode"],
        ["NUPL", "Net Unrealized Profit/Loss — emoción del mercado", "<0 = capitulación total", ">0.75 = euforia", "Glassnode"],
        ["Puell Multiple", "Ingresos diarios mineros vs promedio 365d", "<0.5 = mineros capitulando", ">4 = mineros vendiendo fuerte", "Glassnode"],
        ["SOPR", "Ratio precio venta vs precio compra on-chain", "<1 sostenido = vendedores capitulando", ">1.2 sostenido = distribución", "Glassnode"],
        ["Realized Price", "Precio promedio al que se movió cada BTC", "Precio spot bajo Realized = capitulación", "Spot muy sobre Realized = euforia", "Glassnode/Look"],
        ["Exchange Netflow", "BTC entrando o saliendo de exchanges", "Salida neta sostenida = acumulación HODLer", "Entrada neta = posible venta", "CryptoQuant"],
      ]
    },
    {
      title: "Altcoin Season Index — Cuándo Rotar a Altcoins",
      type: "cards",
      cards: [
        { color: "#e040fb", title: "Altcoin Season Index (ASI)", icon: "🌊", text: "Mide qué porcentaje de las top 50 altcoins superaron a BTC en los últimos 90 días. ASI > 75 = altcoin season activa. ASI < 25 = bitcoin season. Disponible en blockchaincenter.net. El índice tiende a estar en zona 75+ durante los últimos 3-6 meses del bull market." },
        { color: "#00e5ff", title: "Narrativas que Lideran el Ciclo", icon: "📣", text: "Cada ciclo tiene una narrativa principal: 2017 = ICOs en Ethereum. 2021 = DeFi + NFTs. 2024 = AI tokens + Real World Assets (RWA) + Layer 2. Identificar la narrativa ganadora temprano puede multiplicar x10 tu rendimiento vs solo tener BTC." },
        { color: "#ffd700", title: "Rotación Sectorial en Crypto", icon: "🔄", text: "El dinero rota en orden: BTC → ETH → Large caps (SOL, BNB) → Mid caps → Small caps → Micro caps (moonshots). Cuando el dinero llega a micro caps y cada cosa sube 10x en semanas, el ciclo está cerca del techo. Es el momento de reducir exposición, no de aumentarla." },
      ]
    }
  ]
}

};
