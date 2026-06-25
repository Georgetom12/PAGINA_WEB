export const contentN8: Record<string, any> = {

  "analisis-fundamental": {
    id: "analisis-fundamental",
    title: "Análisis Fundamental",
    subtitle: "Cómo leer la salud financiera de una empresa antes de invertir",
    level: "N8",
    sections: [
      {
        type: "candle-chart",
        title: "Precio vs Valor Intrínseco — Cuándo el Mercado se Equivoca",
        candles: [
          { open: 120, high: 135, close: 118, low: 110, label: "Sobrevalorada" },
          { open: 117, high: 128, close: 124, low: 112 },
          { open: 123, high: 130, close: 108, low: 100 },
          { open: 107, high: 112, close: 95, low: 88, label: "Infravalorada" },
          { open: 94, high: 100, close: 102, low: 87 },
          { open: 101, high: 115, close: 112, low: 98 },
          { open: 111, high: 125, close: 123, low: 108, label: "Valor justo" },
          { open: 122, high: 135, close: 132, low: 119 },
          { open: 131, high: 145, close: 142, low: 128 },
          { open: 141, high: 158, close: 155, low: 137 },
        ],
        lines: [
          { y: 125, color: "#00e676", label: "Valor intrínseco estimado", dash: true },
          { y: 95, color: "#ff1744", label: "Zona de compra (descuento)", dash: true },
          { y: 150, color: "#ffd700", label: "Zona de venta (sobrecompra)", dash: true },
        ],
        annotations: [
          { x: 0, y: 135, text: "Market overpriced", color: "#ff1744" },
          { x: 3, y: 90, text: "Oportunidad AF", color: "#00e676" },
          { x: 6, y: 128, text: "Precio = Valor", color: "#ffd700" },
        ],
      },
      {
        type: "text",
        title: "1.1 ¿Qué es el Análisis Fundamental?",
        body: `El análisis fundamental es el proceso de evaluar el valor intrínseco de una empresa estudiando sus estados financieros, modelo de negocio, ventajas competitivas y el entorno macroeconómico en el que opera.

A diferencia del análisis técnico, el análisis fundamental busca responder una sola pregunta: ¿Vale la empresa más o menos de lo que el mercado está pagando por ella?

Si el valor intrínseco calculado es MAYOR que el precio de mercado → acción subvalorada (oportunidad de compra).
Si es MENOR → sobrevalorada (posible venta o evitarla).`,
      },
      {
        type: "table",
        title: "Los Tres Pilares del Análisis Fundamental",
        headers: ["PILAR", "QUÉ ANALIZA", "HERRAMIENTAS"],
        rows: [
          ["Análisis Cuantitativo", "Números, ratios, balances. Objetivo y medible.", "P/E, EPS, ROE, deuda"],
          ["Análisis Cualitativo", "Modelo de negocio, ventajas competitivas, management.", "Moat, marca, sector"],
          ["Análisis Macroeconómico", "Tasas, inflación, ciclo económico, contexto del entorno.", "FED, GDP, empleo"],
        ],
      },
      {
        type: "infobox",
        variant: "key",
        label: "Regla de Oro",
        text: "Una empresa puede tener mucho revenue pero poca ganancia neta. Siempre revisá el margen neto = Net Income / Revenue × 100.",
      },
      {
        type: "table",
        title: "1.2 El Estado de Resultados (Income Statement) — Apple 2024",
        headers: ["LÍNEA", "QUÉ REPRESENTA", "EJEMPLO"],
        rows: [
          ["Revenue / Ingresos", "Ventas totales brutas", "$391 billones USD"],
          ["COGS", "Costo de los productos vendidos", "$210 billones USD"],
          ["Gross Profit", "Ingreso - COGS", "$181 billones USD"],
          ["Operating Expenses", "Gastos de operación (R&D, marketing)", "$57 billones USD"],
          ["EBIT / Operating Income", "Ganancia antes de intereses e impuestos", "$123 billones USD"],
          ["Net Income", "Ganancia neta final", "$94 billones USD"],
          ["EPS (Earnings Per Share)", "Ganancia por acción", "$6.11 por acción"],
        ],
      },
      {
        type: "table",
        title: "Márgenes Clave",
        headers: ["MARGEN", "FÓRMULA"],
        rows: [
          ["Margen Bruto", "Gross Profit / Revenue × 100 — eficiencia del producto"],
          ["Margen Operativo", "EBIT / Revenue × 100 — eficiencia operativa del negocio"],
          ["Margen Neto", "Net Income / Revenue × 100 — rentabilidad final real"],
          ["Margen EBITDA", "EBITDA / Revenue × 100 — flujo operativo sin contabilidad"],
        ],
      },
      {
        type: "text",
        title: "1.3 El Balance General",
        body: `El balance es una fotografía de lo que la empresa TIENE (activos), lo que DEBE (pasivos) y lo que le pertenece a los accionistas (patrimonio) en un momento específico.

La ecuación fundamental: ACTIVOS = PASIVOS + PATRIMONIO NETO`,
      },
      {
        type: "table",
        title: "Ratios de Liquidez",
        headers: ["RATIO", "FÓRMULA", "RESULTADO SALUDABLE"],
        rows: [
          ["Current Ratio", "Activo Corriente / Pasivo Corriente", ">1.5 = saludable"],
          ["Quick Ratio", "(Activo Corriente - Inventario) / Pasivo Corriente", ">1.0 = OK"],
          ["Cash Ratio", "Efectivo / Pasivo Corriente", ">0.5 = excelente"],
          ["Debt-to-Equity", "Deuda Total / Patrimonio", "<2.0 para empresas maduras"],
        ],
      },
      {
        type: "infobox",
        variant: "tip",
        label: "Free Cash Flow",
        text: "Free Cash Flow = OCF - Capital Expenditures. Es el dinero REAL que le sobra a la empresa después de mantener su negocio. Las empresas con FCF creciente consistente suelen ser las mejores inversiones de largo plazo.",
      },
      {
        type: "table",
        title: "1.5 Ratios de Valoración",
        headers: ["RATIO", "FÓRMULA", "INTERPRETACIÓN"],
        rows: [
          ["P/E (Price to Earnings)", "Precio / EPS", "15-20 = razonable; >30 = caro; <10 = barato o trampa"],
          ["PEG Ratio", "P/E / Tasa de crecimiento", "<1 = subvalorado con crecimiento; >2 = caro"],
          ["P/B (Price to Book)", "Precio / Valor en libros", "<1 = trading debajo del valor contable"],
          ["P/S (Price to Sales)", "Capitaliz. / Revenue anual", "Útil para empresas sin ganancias aún"],
          ["EV/EBITDA", "Enterprise Value / EBITDA", "<10 = razonable; tech puede ser 20-30"],
          ["Dividend Yield", "Dividendo anual / Precio × 100", ">2% decente; >5% revisar sostenibilidad"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "Consejo PSYCHOMETRIKS",
        text: "El P/E solo tiene sentido comparado con el sector. Un P/E de 30 puede ser barato para tecnología pero caro para utilities. Siempre compará con pares del mismo sector.",
      },
      {
        type: "table",
        title: "Ejemplo Práctico — Comparando dos empresas",
        headers: ["MÉTRICA", "EMPRESA A (Madura)", "EMPRESA B (Growth)"],
        rows: [
          ["Sector", "Consumo básico", "Tecnología cloud"],
          ["Revenue Growth YoY", "4%", "35%"],
          ["Margen Neto", "18%", "8%"],
          ["P/E Ratio", "16x", "45x"],
          ["PEG Ratio", "4.0x (CARO)", "1.3x (RAZONABLE)"],
          ["Deuda/Equity", "0.4x (BAJA)", "0.2x (BAJA)"],
          ["Free Cash Flow", "Positivo y estable", "Negativo (invirtiendo)"],
          ["Veredicto", "Estable, dividendo seguro", "Costosa pero justificada"],
        ],
      },
    ],
  },

  "earnings-reports": {
    id: "earnings-reports",
    title: "Earnings Reports",
    subtitle: "Cómo leer y operar los reportes de resultados trimestrales",
    level: "N8",
    sections: [
      {
        type: "candle-chart",
        title: "Reacción del Precio a Earnings — Beat vs Miss",
        candles: [
          { open: 180, high: 188, close: 175, low: 170 },
          { open: 174, high: 182, close: 179, low: 172 },
          { open: 178, high: 185, close: 183, low: 176, label: "Pre-earnings" },
          { open: 183, high: 210, close: 207, low: 180, label: "BEAT +12%" },
          { open: 206, high: 215, close: 212, low: 202 },
          { open: 211, high: 218, close: 195, low: 188, label: "Miss -8%" },
          { open: 194, high: 200, close: 185, low: 182 },
          { open: 184, high: 192, close: 190, low: 180 },
          { open: 189, high: 198, close: 196, low: 186, label: "BEAT +5%" },
          { open: 195, high: 215, close: 213, low: 193 },
        ],
        lines: [
          { y: 185, color: "#ffd700", label: "Consenso analistas", dash: true },
        ],
        annotations: [
          { x: 3, y: 212, text: "EPS +20% vs estimate", color: "#00e676" },
          { x: 5, y: 188, text: "Revenue miss", color: "#ff1744" },
          { x: 8, y: 200, text: "Guidance raised", color: "#00e676" },
        ],
      },
      {
        type: "text",
        title: "2.1 ¿Qué es un Earnings Report?",
        body: `Cada trimestre, todas las empresas que cotizan en bolsa están OBLIGADAS a publicar sus resultados financieros. Este reporte es el evento más importante del calendario de cualquier acción porque determina si el mercado revisa al alza o a la baja su valoración.`,
      },
      {
        type: "table",
        title: "Calendario de Earnings",
        headers: ["TRIMESTRE", "REPORTE PUBLICADO EN"],
        rows: [
          ["Q1 (Enero-Marzo)", "Abril - Mayo"],
          ["Q2 (Abril-Junio)", "Julio - Agosto"],
          ["Q3 (Julio-Septiembre)", "Octubre - Noviembre"],
          ["Q4 + Año Completo", "Enero - Febrero del año siguiente"],
        ],
      },
      {
        type: "table",
        title: "2.2 Anatomía de un Earnings Report",
        headers: ["COMPONENTE", "QUÉ BUSCAR", "SEÑAL BULLISH / BEARISH"],
        rows: [
          ["EPS (Earnings Per Share)", "Beat vs Estimate", "Beat = subida; Miss = caída fuerte"],
          ["Revenue", "Beat vs Estimate", "Beat con margen >3% = bullish fuerte"],
          ["Guidance", "Outlook próximo trimestre", "Guidance alto = rally; bajo = dump"],
          ["Gross Margin", "Expansión o contracción", "Expansión = pricing power; contracción = presión"],
          ["Free Cash Flow", "Generación de caja", "FCF+ creciente = señal muy bullish"],
          ["KPIs del sector", "Métricas clave del negocio", "Meta: MAU; Amazon: AWS revenue; etc."],
        ],
      },
      {
        type: "infobox",
        variant: "key",
        label: "Concepto Fundamental",
        text: "La reacción del mercado al earnings NO es el resultado absoluto — es el resultado VS las expectativas. Una empresa puede ganar $5/acción y caer si el mercado esperaba $5.20.",
      },
      {
        type: "table",
        title: "2.3 El Concepto de Beat & Raise",
        headers: ["ESCENARIO", "REACCIÓN TÍPICA DEL MERCADO"],
        rows: [
          ["Beat EPS + Beat Revenue + Raise Guidance", "Rally fuerte +5% a +15% o más"],
          ["Beat EPS + Beat Revenue + Guidance inline", "Subida moderada +2% a +5%"],
          ["Beat EPS + Miss Revenue", "Reacción mixta, puede caer ligeramente"],
          ["Miss EPS + Beat Revenue", "Caída moderada, depende del contexto"],
          ["Miss EPS + Miss Revenue + Lower Guidance", "Dump severo -10% a -30% posible"],
        ],
      },
      {
        type: "table",
        title: "2.4 Dónde Encontrar los Earnings Reports",
        headers: ["FUENTE", "URL", "MEJOR PARA"],
        rows: [
          ["SEC EDGAR", "sec.gov/edgar", "Reportes oficiales 10-Q y 10-K"],
          ["Earnings Whispers", "earningswhispers.com", "Fechas y estimados del mercado"],
          ["Seeking Alpha", "seekingalpha.com", "Análisis y transcripciones"],
          ["Yahoo Finance", "finance.yahoo.com", "Rápido y gratuito"],
          ["Zacks / Consensus", "zacks.com", "Estimados de analistas"],
        ],
      },
      {
        type: "text",
        title: "2.5 Estrategias de Operación en Earnings",
        body: `ESTRATEGIA 1 — Pre-Earnings Momentum:
Entrar 2-3 semanas antes del earnings cuando hay momentum positivo y sell the news (vender antes del reporte). Busca acciones con historial de subida antes del earnings. Coloca stop loss por debajo de soporte técnico clave.

ESTRATEGIA 2 — Post-Earnings Drift (PEAD):
Estudios académicos demuestran que las acciones que superan estimados tienden a continuar subiendo en las semanas siguientes. Entrar solo si hay gap up con volumen significativamente mayor al promedio.`,
      },
      {
        type: "infobox",
        variant: "warn",
        label: "Earnings Options Straddle",
        text: "El costo de los straddles en earnings es alto por el IV Crush — la volatilidad implícita colapsa después del reporte. Solo funciona si el movimiento supera el precio del straddle.",
      },
    ],
  },

  "dividend-investing": {
    id: "dividend-investing",
    title: "Dividend Investing",
    subtitle: "Construir flujo de ingresos pasivos con acciones que pagan dividendos",
    level: "N8",
    sections: [
      {
        type: "candle-chart",
        title: "Acción Dividendera — Precio vs Ex-Dividend Dates",
        candles: [
          { open: 95, high: 100, close: 98, low: 92 },
          { open: 97, high: 103, close: 101, low: 95 },
          { open: 100, high: 106, close: 104, low: 98, label: "Ex-Div Q1" },
          { open: 103, high: 107, close: 102, low: 100 },
          { open: 101, high: 108, close: 106, low: 99 },
          { open: 105, high: 112, close: 110, low: 103, label: "Ex-Div Q2" },
          { open: 109, high: 115, close: 113, low: 107 },
          { open: 112, high: 118, close: 116, low: 110, label: "Ex-Div Q3" },
          { open: 115, high: 122, close: 120, low: 113 },
          { open: 119, high: 126, close: 124, low: 117, label: "Ex-Div Q4" },
        ],
        lines: [
          { y: 100, color: "#00e676", label: "Precio entrada inicial", dash: true },
          { y: 118, color: "#ffd700", label: "Precio tras 1 año (+dividendos)", dash: true },
        ],
        annotations: [
          { x: 2, y: 92, text: "$0.85/acción", color: "#00e5ff" },
          { x: 5, y: 100, text: "$0.88/acción", color: "#00e5ff" },
          { x: 9, y: 112, text: "$0.92/acción", color: "#00e5ff" },
        ],
      },
      {
        type: "text",
        title: "3.1 ¿Qué es un Dividendo?",
        body: `Un dividendo es una distribución de parte de las ganancias de una empresa a sus accionistas. Es la empresa diciendo: "generamos más dinero del que necesitamos, te lo devolvemos".

Los dividendos son la base del income investing — construir un portafolio que genere flujo de efectivo regular, independientemente de lo que haga el precio de la acción.`,
      },
      {
        type: "table",
        title: "Tipos de Dividendos",
        headers: ["TIPO", "DESCRIPCIÓN"],
        rows: [
          ["Dividendo en Efectivo (Cash)", "El más común — pago directo en USD por acción"],
          ["Dividendo en Acciones (Stock)", "Recibe más acciones en lugar de efectivo"],
          ["Dividendo Especial", "Pago único por evento extraordinario (venta de activo, etc.)"],
          ["Dividendo de Liquidación", "Señal negativa — empresa devuelve capital al cerrar"],
        ],
      },
      {
        type: "table",
        title: "3.2 Fechas Clave del Ciclo de Dividendos",
        headers: ["FECHA", "QUÉ SIGNIFICA"],
        rows: [
          ["Declaration Date", "La empresa anuncia que pagará dividendo y su monto"],
          ["Ex-Dividend Date (EX-DATE)", "CRÍTICA: debés poseer la acción ANTES de esta fecha para cobrar"],
          ["Record Date", "1-2 días después del Ex-Date — quién está registrado como dueño"],
          ["Payment Date", "Cuándo el dinero llega a tu cuenta (generalmente 2-4 semanas después)"],
        ],
      },
      {
        type: "infobox",
        variant: "warn",
        label: "Atención — Ex-Dividend Date",
        text: "Si comprás la acción el mismo día del Ex-Dividend Date, NO cobrás el dividendo de ese trimestre. Debés comprarla al menos 1 día antes.",
      },
      {
        type: "table",
        title: "3.3 Métricas Clave para Evaluar Dividendos",
        headers: ["MÉTRICA", "FÓRMULA", "QUÉ INDICA"],
        rows: [
          ["Dividend Yield", "Dividendo Anual / Precio × 100", "% de retorno solo por dividendo"],
          ["Dividend Payout Ratio", "Dividendo / EPS × 100", "% de ganancias que se pagan; <60% = sostenible"],
          ["Dividend Growth Rate", "(Div Actual - Div Año Pasado) / Div Año Pasado", "Tasa de crecimiento del dividendo"],
          ["FCF Payout Ratio", "Dividendo / Free Cash Flow", "Más conservador que EPS payout"],
          ["Years of Dividend Growth", "Años consecutivos de aumento", "Dividend Aristocrats = +25 años"],
        ],
      },
      {
        type: "table",
        title: "¿Qué Dividend Yield es atractivo?",
        headers: ["YIELD RANGO", "INTERPRETACIÓN"],
        rows: [
          ["0% - 1%", "Empresa growth — reinvierte todo en crecimiento (Amazon, Google)"],
          ["1% - 2%", "Yield bajo pero con crecimiento de dividendo potencial fuerte"],
          ["2% - 4%", "Rango ideal — rendimiento atractivo con sostenibilidad"],
          ["4% - 6%", "Yield alto — revisá si el payout ratio es sostenible"],
          [">6%", "Yield trampa (yield trap) — posible señal de que el precio cayó por problemas"],
        ],
      },
      {
        type: "table",
        title: "3.4 Dividend Aristocrats y Dividend Kings",
        headers: ["CATEGORÍA", "CRITERIO"],
        rows: [
          ["Dividend Aristocrat", "S&P 500 + mínimo 25 años consecutivos aumentando dividendo"],
          ["Dividend King", "Mínimo 50 años consecutivos aumentando dividendo"],
          ["Dividend Achiever", "Mínimo 10 años consecutivos aumentando dividendo"],
        ],
      },
      {
        type: "table",
        title: "Ejemplos de Dividend Kings",
        headers: ["EMPRESA", "TICKER", "AÑOS CONSECUTIVOS"],
        rows: [
          ["Coca-Cola", "KO", "62+ años"],
          ["Johnson & Johnson", "JNJ", "62+ años"],
          ["Procter & Gamble", "PG", "68+ años"],
          ["Colgate-Palmolive", "CL", "61+ años"],
          ["3M Company", "MMM", "66+ años"],
        ],
      },
      {
        type: "infobox",
        variant: "tip",
        label: "Estrategia DRIP",
        text: "DRIP = Dividend Reinvestment Plan. Ejemplo: Invertís $10,000 en KO con 3% yield. Año 1: recibís $300. Los reinvertís. En 20 años con DRIP, tu posición puede triplicarse sin invertir un dólar adicional. Es el poder del interés compuesto aplicado a dividendos.",
      },
    ],
  },

  "bonos-acciones": {
    id: "bonos-acciones",
    title: "Bonos y Renta Fija",
    subtitle: "Yield, Duration, Curva de Tasas y su impacto en todos los mercados",
    level: "N8",
    sections: [
      {
        type: "bonds-chart",
        title: "Yield 10Y — Curva de Tasas y Relación con Mercados",
      },
      {
        type: "text",
        title: "4.1 ¿Qué es un Bono?",
        body: `Un bono es un instrumento de deuda. Cuando comprás un bono, le estás PRESTANDO dinero a un gobierno o empresa. Ellos se comprometen a pagarte un interés periódico (cupón) y devolverte el capital al final del plazo.`,
      },
      {
        type: "table",
        title: "Componentes de un Bono",
        headers: ["COMPONENTE", "DEFINICIÓN", "EJEMPLO"],
        rows: [
          ["Principal (Par Value)", "Monto que prestaste / valor nominal", "$1,000 USD"],
          ["Cupón (Coupon Rate)", "Interés anual que recibís", "4% = $40/año"],
          ["Vencimiento (Maturity)", "Cuando te devuelven el principal", "10 años"],
          ["Yield (Rendimiento)", "Retorno real considerando precio de mercado", "4.2% actual"],
          ["Precio de mercado", "Lo que pagás hoy (puede diferir del par)", "$980 o $1,020"],
        ],
      },
      {
        type: "infobox",
        variant: "key",
        label: "Regla Fundamental",
        text: "Precio del bono y yield se mueven en DIRECCIÓN OPUESTA. Si el yield sube, el precio cae. Si el yield baja, el precio sube. Esto confunde a muchos principiantes.",
      },
      {
        type: "table",
        title: "4.2 Tipos de Bonos",
        headers: ["TIPO", "EMISOR", "RIESGO / RENDIMIENTO"],
        rows: [
          ["Treasuries (T-Bills/Notes/Bonds)", "Gobierno USA", "Riesgo casi cero — benchmark global"],
          ["TIPS", "Gobierno USA", "Protegidos contra inflación"],
          ["Municipal Bonds (Munis)", "Gobiernos locales USA", "Bajo riesgo + exención fiscal"],
          ["Corporate Investment Grade", "Empresas AAA-BBB", "Bajo-medio riesgo, mejor yield que treasuries"],
          ["High Yield (Junk Bonds)", "Empresas BB o menor", "Alto riesgo, yield muy alto"],
          ["Bonos Convertibles", "Empresas", "Pueden convertirse en acciones"],
        ],
      },
      {
        type: "table",
        title: "4.3 La Curva de Tasas — Formas y Significado",
        headers: ["FORMA", "QUÉ SIGNIFICA", "IMPACTO EN MERCADOS"],
        rows: [
          ["Normal (inclinada positiva)", "Bonos largos rinden más que cortos — economía sana", "Bullish para acciones y riesgo"],
          ["Plana (flat)", "Rendimientos similares en todos los plazos", "Transición — incertidumbre"],
          ["Invertida (inverted)", "Bonos cortos rinden MÁS que largos", "Bearish — histórico predictor recesión"],
          ["Empinada (steep)", "Gran diferencia cortos vs largos", "Expectativa de inflación futura alta"],
        ],
      },
      {
        type: "infobox",
        variant: "danger",
        label: "Señal Macro Crítica",
        text: "La inversión de la curva 2Y vs 10Y (US02Y - US10Y) ha precedido CADA recesión en USA en los últimos 50 años. Cuando el spread se vuelve negativo, es la alerta macro más confiable que existe.",
      },
      {
        type: "table",
        title: "4.4 Duration — Riesgo de Tasa de Interés",
        headers: ["CONCEPTO", "EXPLICACIÓN PRÁCTICA"],
        rows: [
          ["Duration 5 años", "Si las tasas suben 1%, el precio del bono cae ~5%"],
          ["Duration 10 años", "Si las tasas suben 1%, el precio del bono cae ~10%"],
          ["Duration Corta (<3 años)", "Menos sensible a tasas — más seguro en subida de tasas"],
          ["Duration Larga (>10 años)", "Más volátil — perfecto para apostar a bajada de tasas"],
        ],
      },
      {
        type: "table",
        title: "4.5 Rating Crediticio",
        headers: ["MOODY'S", "S&P / FITCH", "CATEGORÍA"],
        rows: [
          ["Aaa", "AAA", "Máxima calidad — grado de inversión"],
          ["Aa", "AA", "Alta calidad — grado de inversión"],
          ["A", "A", "Grado superior medio"],
          ["Baa", "BBB", "Grado medio — MÍNIMO investment grade"],
          ["Ba / B", "BB / B", "Especulativo — High Yield / Junk"],
          ["Caa / Ca", "CCC / CC", "Muy especulativo — alto riesgo impago"],
          ["C", "D", "En default o incumplimiento"],
        ],
      },
      {
        type: "table",
        title: "4.6 Bonos y su Relación con Otros Mercados",
        headers: ["CUANDO EL YIELD SUBE...", "IMPACTO ESPERADO"],
        rows: [
          ["Acciones growth y tecnología", "Caen — sus valuaciones futuras se descuentan más"],
          ["Acciones value y utilities", "Menos impacto — generan flujo actual"],
          ["Oro (XAU/USD)", "Cae — el bono ofrece retorno sin riesgo, el oro no paga"],
          ["Bitcoin y crypto", "Presión bajista — menor apetito por riesgo"],
          ["USD (Dólar)", "Se fortalece — mayor retorno atrae capital externo"],
          ["Mercados emergentes", "Salen flujos — dinero vuelve a USA"],
        ],
      },
    ],
  },

  "opciones-financieras": {
    id: "opciones-financieras",
    title: "Opciones Financieras",
    subtitle: "Calls, Puts, Greeks y estrategias desde básico hasta avanzado",
    level: "N8",
    sections: [
      {
        type: "candle-chart",
        title: "Opciones — Perfil de Ganancia/Pérdida: Long Call vs Long Put",
        candles: [
          { open: 148, high: 152, close: 146, low: 143 },
          { open: 145, high: 150, close: 148, low: 142 },
          { open: 147, high: 153, close: 151, low: 145 },
          { open: 150, high: 158, close: 155, low: 148, label: "Strike $150" },
          { open: 154, high: 165, close: 163, low: 152, label: "Call ITM" },
          { open: 162, high: 172, close: 170, low: 159, label: "+133% Call" },
          { open: 169, high: 178, close: 175, low: 167 },
          { open: 174, high: 180, close: 172, low: 168 },
          { open: 171, high: 177, close: 160, low: 155, label: "Put gana" },
          { open: 159, high: 163, close: 145, low: 140, label: "Put +200%" },
        ],
        lines: [
          { y: 150, color: "#ffd700", label: "Strike Price", dash: true },
          { y: 153, color: "#00e676", label: "Break-even Call ($150 + $3 prem)", dash: true },
          { y: 147, color: "#ff1744", label: "Break-even Put ($150 - $3 prem)", dash: true },
        ],
        annotations: [
          { x: 4, y: 165, text: "Long Call profitable", color: "#00e676" },
          { x: 8, y: 143, text: "Long Put profitable", color: "#ff6d00" },
        ],
      },
      {
        type: "text",
        title: "5.1 ¿Qué es una Opción?",
        body: `Una opción es un contrato que te da el DERECHO (no la obligación) de comprar o vender 100 acciones de una empresa a un precio específico (strike) antes de una fecha de vencimiento (expiration).

Existen solo dos tipos fundamentales:
• CALL Option → Derecho a COMPRAR las acciones al precio strike
• PUT Option → Derecho a VENDER las acciones al precio strike

Cada contrato de opción representa 100 acciones. Si una opción cuesta $3.00, en realidad te cuesta $300 (×100 acciones).`,
      },
      {
        type: "table",
        title: "5.2 Terminología Esencial",
        headers: ["TÉRMINO", "DEFINICIÓN", "EJEMPLO"],
        rows: [
          ["Strike Price", "Precio al que podés comprar/vender", "$150 call en Apple"],
          ["Expiration Date", "Fecha límite del contrato", "19 de Enero 2025"],
          ["Premium", "Precio que pagás por la opción", "$3.50 = $350 total"],
          ["In-the-Money (ITM)", "La opción tiene valor intrínseco", "AAPL $155, Call $150 = ITM"],
          ["At-the-Money (ATM)", "Strike = Precio actual", "AAPL $150, Call $150 = ATM"],
          ["Out-of-the-Money (OTM)", "Sin valor intrínseco aún", "AAPL $148, Call $155 = OTM"],
          ["IV (Implied Volatility)", "Expectativa de movimiento del precio", "IV alta = opciones caras"],
          ["IV Crush", "Colapso de IV después de earnings", "Puede hacer perder dinero aunque aciertes dirección"],
        ],
      },
      {
        type: "table",
        title: "5.3 Los Greeks",
        headers: ["GREEK", "QUÉ MIDE"],
        rows: [
          ["Delta (Δ)", "Cuánto cambia la opción por cada $1 de movimiento. Call: 0 a 1.0; Put: -1.0 a 0"],
          ["Theta (Θ)", "Decaimiento del tiempo — cuánto pierde la opción por cada día que pasa. El tiempo es el enemigo del comprador"],
          ["Vega (V)", "Sensibilidad a la volatilidad implícita. Si IV sube 1%, el precio sube X"],
          ["Gamma (Γ)", "Tasa de cambio del Delta. Las opciones ATM tienen mayor gamma — pueden ganar/perder valor muy rápido"],
          ["Rho (ρ)", "Sensibilidad a las tasas de interés. Relevante en opciones de largo plazo (LEAPS)"],
        ],
      },
      {
        type: "table",
        title: "5.4 Estrategias Básicas",
        headers: ["ESTRATEGIA", "DESCRIPCIÓN", "CUÁNDO USAR"],
        rows: [
          ["Long Call", "Comprar una call — apostás a subida", "Bullish con movimiento fuerte esperado"],
          ["Long Put", "Comprar una put — apostás a caída", "Bearish o para cubrir posición larga"],
          ["Covered Call", "Tenés 100 acciones + vendés call", "Generar ingreso en mercado lateral"],
          ["Cash-Secured Put", "Vendés una put con cash de respaldo", "Comprar acción a descuento deseado"],
        ],
      },
      {
        type: "table",
        title: "Estrategias Intermedias",
        headers: ["ESTRATEGIA", "ESTRUCTURA", "OBJETIVO"],
        rows: [
          ["Bull Call Spread", "Compra call bajo + Vende call alto", "Reducir costo de la call, upside limitado"],
          ["Bear Put Spread", "Compra put alto + Vende put bajo", "Reducir costo de la put, bajada limitada"],
          ["Straddle", "Compra call + put mismo strike", "Beneficio de alta volatilidad (earnings)"],
          ["Strangle", "Compra call OTM + put OTM", "Más barato que straddle, necesita más movimiento"],
          ["Iron Condor", "Vende strangle + compra strangle exterior", "Mercado lateral — rango definido de ganancia"],
        ],
      },
      {
        type: "infobox",
        variant: "danger",
        label: "Advertencia Importante",
        text: "Las opciones son instrumentos de alto riesgo. El comprador puede perder el 100% del premium pagado. Nunca inviertas en opciones más del 2-5% de tu capital por trade. Aprendé bien los Greeks antes de operar con dinero real.",
      },
      {
        type: "text",
        title: "5.5 LEAPS — Opciones de Largo Plazo",
        body: `Las LEAPS (Long-Term Equity Anticipation Securities) son opciones con vencimiento mayor a 1 año, generalmente 1-2 años. Son usadas por inversores como sustituto de acciones con menos capital.

Ventajas:
• Menos efecto del decaimiento diario (theta)
• Permiten apalancamiento controlado
• Ideal para tesis de largo plazo

Consideraciones:
• Costo inicial mayor que opciones cortas
• Liquidez menor
• IV puede afectar precio significativamente`,
      },
    ],
  },

  "brokers-acciones": {
    id: "brokers-acciones",
    title: "Brokers para Acciones",
    subtitle: "Plataformas, costos, regulación y cómo elegir el correcto",
    level: "N8",
    sections: [
      {
        type: "candle-chart",
        title: "Impacto del Broker — Mismo Trade, Diferente Costo",
        candles: [
          { open: 100, high: 108, close: 106, low: 98, label: "Entrada" },
          { open: 105, high: 114, close: 112, low: 103 },
          { open: 111, high: 120, close: 118, low: 109 },
          { open: 117, high: 126, close: 124, low: 115 },
          { open: 123, high: 132, close: 130, low: 121, label: "TP alcanzado" },
          { open: 129, high: 135, close: 120, low: 118, label: "Salida" },
        ],
        lines: [
          { y: 100, color: "#ff1744", label: "SL ($100)", dash: true },
          { y: 130, color: "#00e676", label: "TP ($130) — R:R 3:1", dash: true },
        ],
        annotations: [
          { x: 0, y: 106, text: "Broker sin comisión: +$30 neto", color: "#00e676" },
          { x: 4, y: 124, text: "Broker con fees: +$27.50 neto", color: "#ffd700" },
        ],
      },
      {
        type: "text",
        title: "6.1 ¿Qué es un Broker?",
        body: `Un broker es la plataforma intermediaria que te conecta con los mercados financieros. Sin un broker regulado, no podés comprar o vender acciones, ETFs, bonos u opciones en las bolsas oficiales.`,
      },
      {
        type: "table",
        title: "Tipos de Brokers",
        headers: ["TIPO", "CARACTERÍSTICAS"],
        rows: [
          ["Broker Online (Discount)", "Sin asesor humano, comisiones bajas o cero, plataforma digital (IBKR, Schwab, Fidelity)"],
          ["Broker Full Service", "Asesor personal, investigación incluida, comisiones altas — para grandes patrimonios"],
          ["Broker Internacional", "Acceso a múltiples mercados globales, ideal para no-residentes USA"],
          ["Robo-Advisor", "Gestión automatizada con algoritmos (Betterment, Wealthfront)"],
        ],
      },
      {
        type: "table",
        title: "6.2 Comparativa de Brokers para Latinoamérica",
        headers: ["BROKER", "COMISIONES ACCIONES", "MÍNIMO / ACCESO LATAM"],
        rows: [
          ["Interactive Brokers (IBKR)", "$0 en acciones USA (IBKR Lite)", "$0 mínimo — MUY RECOMENDADO para LatAm"],
          ["Tastytrade", "$0 acciones, $1 por contrato opciones", "$0 mínimo — excelente para opciones"],
          ["TD Ameritrade / Schwab", "$0 comisiones acciones", "Disponible según país"],
          ["Fidelity", "$0 comisiones acciones", "Más restrictivo para no-residentes"],
          ["eToro", "Spread (sin comisión fija)", "Muy accesible para LatAm, regulado"],
          ["XTB", "Sin comisión en acciones", "Regulado FCA Europa, accesible LatAm"],
        ],
      },
      {
        type: "infobox",
        variant: "pro",
        label: "Recomendación para Ecuador y LatAm",
        text: "Interactive Brokers es el estándar de oro. Ofrece acceso a acciones, ETFs, opciones, bonos, forex y futuros desde una sola cuenta con cero mínimo de apertura.",
      },
      {
        type: "table",
        title: "6.3 Regulación — Lo que Debés Verificar",
        headers: ["REGULADOR", "QUÉ PROTEGE"],
        rows: [
          ["SIPC (USA)", "Protege hasta $500,000 en valores si el broker quiebra (no pérdidas de mercado)"],
          ["FDIC (USA)", "Protege depósitos en efectivo hasta $250,000"],
          ["SEC (USA)", "Supervisa brokers y mercados de valores en USA"],
          ["FCA (UK)", "Regulador financiero del Reino Unido — muy respetado"],
          ["CySEC (Chipre/UE)", "Regulador europeo — muchos brokers de forex/CFD"],
          ["FINRA (USA)", "Regula brokers dealers — verificá licencias en brokercheck.finra.org"],
        ],
      },
      {
        type: "table",
        title: "6.4 Tipos de Cuentas",
        headers: ["TIPO DE CUENTA", "CARACTERÍSTICAS", "PARA QUIÉN"],
        rows: [
          ["Cash Account", "Solo operás con fondos disponibles, sin margen", "Principiantes — sin riesgo de deuda"],
          ["Margin Account", "Podés pedir prestado al broker para comprar más", "Intermedios — entender bien el interés del margen"],
          ["IRA / Roth IRA", "Cuenta de retiro con beneficios fiscales USA", "Residentes o ciudadanos USA"],
          ["Joint Account", "Cuenta compartida entre dos personas", "Parejas o socios de inversión"],
          ["Corporate Account", "A nombre de empresa", "Traders que operan como entidad legal"],
        ],
      },
      {
        type: "table",
        title: "6.5 Costos Ocultos que Debés Conocer",
        headers: ["COSTO", "DETALLE"],
        rows: [
          ["Spread Bid/Ask", "Diferencia entre precio de compra y venta — real en todos los brokers"],
          ["Margin Interest", "Interés por usar dinero prestado — puede ser 5-8% anual"],
          ["Options Assignment Fee", "Costo si tu opción es ejercida — revisá en tu broker"],
          ["Wire Transfer Fees", "Costo de mover dinero — algunos cobran $25-$40 por wire"],
          ["Inactivity Fees", "Algunos brokers cobran si no operás por meses"],
          ["Currency Conversion", "Si depositás en USD desde cuenta local — spread del cambio"],
        ],
      },
    ],
  },

  "impuestos-inversiones": {
    id: "impuestos-inversiones",
    title: "Impuestos sobre Inversiones",
    subtitle: "Capital gains, dividendos, reportes y planificación fiscal básica",
    level: "N8",
    sections: [
      {
        type: "candle-chart",
        title: "Hold +1 Año vs Venta Rápida — Impacto Fiscal Real",
        candles: [
          { open: 50, high: 55, close: 52, low: 48, label: "Compra" },
          { open: 51, high: 60, close: 58, low: 50 },
          { open: 57, high: 68, close: 65, low: 55 },
          { open: 64, high: 75, close: 72, low: 62, label: "<1 año: 37%" },
          { open: 71, high: 82, close: 79, low: 69 },
          { open: 78, high: 90, close: 87, low: 76 },
          { open: 86, high: 98, close: 95, low: 84 },
          { open: 94, high: 105, close: 102, low: 92, label: ">1 año: 15%" },
          { open: 101, high: 112, close: 109, low: 99 },
          { open: 108, high: 120, close: 117, low: 106, label: "Vende aquí" },
        ],
        lines: [
          { y: 52, color: "#00e5ff", label: "Precio de compra ($52)", dash: true },
          { y: 72, color: "#ff1744", label: "Venta short-term (paga ~37% ganancias)", dash: true },
          { y: 117, color: "#00e676", label: "Venta long-term (paga ~15% ganancias)", dash: true },
        ],
        annotations: [
          { x: 3, y: 65, text: "Gain $20 → Tax $7.40", color: "#ff1744" },
          { x: 9, y: 105, text: "Gain $65 → Tax $9.75", color: "#00e676" },
        ],
      },
      {
        type: "table",
        title: "7.1 Capital Gains — Tipos",
        headers: ["TIPO", "DEFINICIÓN"],
        rows: [
          ["Short-Term Capital Gain", "Vendés activo que compraste hace MENOS de 1 año — tributás como ingreso ordinario"],
          ["Long-Term Capital Gain", "Vendés activo que compraste hace MÁS de 1 año — tasa preferencial más baja"],
          ["Capital Loss", "Vendés a menor precio que compraste — puede usarse para offset ganancias"],
          ["Unrealized Gain/Loss", "Aumento/caída del valor sin vender — NO genera obligación fiscal todavía"],
        ],
      },
      {
        type: "infobox",
        variant: "key",
        label: "Tasas USA",
        text: "En USA: Long-term capital gains se gravan al 0%, 15% o 20% dependiendo del ingreso. Short-term se grava hasta al 37%. Por eso IMPORTA el plazo de 1 año para inversores de largo plazo.",
      },
      {
        type: "table",
        title: "7.2 Impuestos sobre Dividendos",
        headers: ["TIPO DE DIVIDENDO", "TRATAMIENTO FISCAL USA"],
        rows: [
          ["Qualified Dividend", "Tasa preferencial 0%, 15% o 20% — igual que long-term capital gains"],
          ["Ordinary Dividend", "Tributa como ingreso ordinario (hasta 37% en USA)"],
          ["Return of Capital", "No tributa inmediatamente — reduce tu cost basis"],
          ["Dividendo Internacional", "Puede tener retención en origen + crédito fiscal en USA"],
        ],
      },
      {
        type: "table",
        title: "7.3 Situación para Inversores Latinoamericanos (W-8BEN)",
        headers: ["SITUACIÓN", "RETENCIÓN USA", "OBLIGACIÓN EN PAÍS DE ORIGEN"],
        rows: [
          ["Dividendos de acciones USA", "30% retención", "Declarar en renta local como ingreso extranjero"],
          ["Intereses de bonos USA", "30% o 0% según tipo", "Declarar como renta de capital"],
          ["Capital gains en acciones", "0% para no-residentes USA (generalmente)", "Declarar según ley local"],
          ["ETFs en USA", "Igual que acciones individuales", "Idem"],
        ],
      },
      {
        type: "infobox",
        variant: "tip",
        label: "Formulario W-8BEN",
        text: "Todo inversor no-residente USA debe completar este formulario con su broker para identificarse como extranjero y aplicar las tasas correctas de retención.",
      },
      {
        type: "text",
        title: "7.4 Tax Loss Harvesting",
        body: `El tax loss harvesting es la estrategia de vender posiciones con pérdidas para reducir tu obligación fiscal por las ganancias del año.

Proceso:
1. Vendés una posición que está en pérdida para "cristalizar" la pérdida
2. Esa pérdida se aplica contra tus ganancias del año
3. Podés recomprar una posición similar (no la misma — wash sale rule en USA)
4. Exceso de pérdidas puede carryforward a años siguientes`,
      },
      {
        type: "infobox",
        variant: "tip",
        label: "Wash Sale Rule",
        text: "En USA, no podés vender una posición con pérdida y recomprar la MISMA acción dentro de los 30 días. Solución: si vendés AAPL con pérdida y querés mantener exposición a tecnología, comprá QQQ o MSFT durante los 30 días.",
      },
      {
        type: "table",
        title: "7.5 Documentos Fiscales Importantes",
        headers: ["DOCUMENTO", "QUÉ CONTIENE"],
        rows: [
          ["Form 1099-B (USA)", "Reporte de ventas de valores — ganancias y pérdidas del año"],
          ["Form 1099-DIV (USA)", "Dividendos recibidos en el año"],
          ["Form 1099-INT (USA)", "Intereses recibidos de bonos y cash"],
          ["Schedule D", "Formulario donde reportás capital gains en tu declaración USA"],
          ["Cost Basis Statement", "Historial de precios de compra — tu broker lo provee"],
        ],
      },
      {
        type: "infobox",
        variant: "warn",
        label: "Aviso Legal",
        text: "Esta información es educativa y no constituye asesoría fiscal. Las leyes tributarias varían por país y cambian frecuentemente. Consultá siempre con un contador o asesor fiscal calificado en tu país de residencia.",
      },
    ],
  },

  "glosario-recursos-af": {
    id: "glosario-recursos-af",
    title: "Glosario y Recursos",
    subtitle: "Términos esenciales y plataformas recomendadas para mercados financieros",
    level: "N8",
    sections: [
      {
        type: "candle-chart",
        title: "El Mercado en Contexto — Un Ciclo Completo Bull/Bear",
        candles: [
          { open: 100, high: 105, close: 98, low: 95, label: "Bear Bottom" },
          { open: 97, high: 108, close: 106, low: 95 },
          { open: 105, high: 120, close: 118, low: 104 },
          { open: 117, high: 138, close: 135, low: 115, label: "Bull fase 1" },
          { open: 134, high: 158, close: 155, low: 132 },
          { open: 154, high: 182, close: 178, low: 151, label: "Bull euforia" },
          { open: 177, high: 190, close: 165, low: 158, label: "Distribución" },
          { open: 164, high: 170, close: 145, low: 140 },
          { open: 144, high: 152, close: 125, low: 120, label: "Bear inicio" },
          { open: 124, high: 130, close: 108, low: 102, label: "Capitulación" },
        ],
        lines: [
          { y: 100, color: "#00e676", label: "Zona acumulación (comprar)", dash: true },
          { y: 178, color: "#ff1744", label: "Zona distribución (vender)", dash: true },
        ],
        annotations: [
          { x: 0, y: 95, text: "COMPRAR aquí", color: "#00e676" },
          { x: 5, y: 182, text: "VENDER aquí", color: "#ff1744" },
          { x: 9, y: 100, text: "Reinicia ciclo", color: "#ffd700" },
        ],
      },
      {
        type: "table",
        title: "Glosario de Términos Clave",
        headers: ["TÉRMINO", "CATEGORÍA", "DEFINICIÓN RÁPIDA"],
        rows: [
          ["Alpha", "Performance", "Retorno superior al benchmark — exceso de rendimiento por selección"],
          ["Beta", "Riesgo", "Sensibilidad de una acción vs el mercado. Beta >1 = más volátil que SP500"],
          ["Bull Market", "Mercado", "Mercado en tendencia alcista (+20% desde último mínimo)"],
          ["Bear Market", "Mercado", "Mercado en tendencia bajista (-20% desde último máximo)"],
          ["Correction", "Mercado", "Caída de -10% a -20% desde máximos — normal en bull market"],
          ["Diversification", "Estrategia", "Distribuir capital en múltiples activos no correlacionados"],
          ["Dollar Cost Averaging", "Estrategia", "Invertir monto fijo periódicamente sin importar el precio"],
          ["ETF", "Instrumento", "Fondo cotizado en bolsa que sigue un índice o sector"],
          ["Hedge", "Riesgo", "Posición que protege contra movimiento adverso de otra posición"],
          ["Index Fund", "Instrumento", "Fondo que replica un índice como SP500 — bajo costo"],
          ["Inflation", "Macro", "Aumento general del nivel de precios — erosiona poder adquisitivo"],
          ["Liquidity", "Mercado", "Facilidad para comprar/vender un activo sin afectar su precio"],
          ["Market Cap", "Valoración", "Precio × Acciones en circulación — tamaño total de la empresa"],
          ["Margin Call", "Riesgo", "Obligación de depositar más fondos cuando posición marginal pierde"],
          ["Rebalancing", "Estrategia", "Ajustar el portafolio periódicamente a la asignación objetivo"],
          ["Short Selling", "Estrategia", "Vender acciones prestadas esperando comprarlas más baratas"],
          ["Volatility", "Riesgo", "Magnitud de fluctuación de precios — medida por desviación estándar"],
        ],
      },
      {
        type: "table",
        title: "Plataformas y Recursos Recomendados",
        headers: ["PLATAFORMA", "URL", "USO PRINCIPAL"],
        rows: [
          ["TradingView", "tradingview.com", "Gráficos técnicos y análisis — el estándar"],
          ["Yahoo Finance", "finance.yahoo.com", "Datos fundamentales gratuitos, rápido"],
          ["Macrotrends", "macrotrends.net", "Histórico de fundamentales largo plazo"],
          ["EDGAR (SEC)", "sec.gov/edgar", "Reportes oficiales de empresas USA"],
          ["Finviz", "finviz.com", "Screener de acciones por fundamentales/técnicos"],
          ["Earnings Whispers", "earningswhispers.com", "Calendario de earnings y estimados"],
          ["Simply Wall St", "simplywall.st", "Análisis fundamental visual y simplificado"],
          ["Morningstar", "morningstar.com", "Research profesional — parte gratuita muy buena"],
          ["Seeking Alpha", "seekingalpha.com", "Análisis y transcripciones de earnings"],
          ["FRED (St. Louis Fed)", "fred.stlouisfed.org", "Datos macro USA oficiales"],
          ["Koyfin", "koyfin.com", "Terminal financiero semi-profesional (freemium)"],
        ],
      },
    ],
  },

};
