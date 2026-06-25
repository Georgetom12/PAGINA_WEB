export interface TestOption {
  text: string;
  profile: string;
}

export interface TestQuestion {
  question: string;
  options: TestOption[];
}

export interface TraderProfile {
  id: string;
  name: string;
  emoji: string;
  color: string;
  tagline: string;
  description: string;
  traits: string[];
  weaknesses: string[];
  tools: { icon: string; name: string; desc: string; href: string }[];
  planCta: {
    title: string;
    desc: string;
    plan: "PRO" | "ELITE" | "BASIC";
    href: string;
  };
}

export interface PsyTest {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  timeMin: number;
  color: string;
  questions: TestQuestion[];
  profiles: Record<string, TraderProfile>;
}

export const TESTS: PsyTest[] = [
  {
    id: "tipo-trader",
    title: "¿Qué tipo de trader eres?",
    subtitle: "Descubrí tu perfil psicológico y por qué tomás las decisiones que tomás",
    description: "10 preguntas sobre tus hábitos reales de trading. Sin trampa — el resultado puede sorprenderte.",
    emoji: "🧠",
    timeMin: 3,
    color: "#00e5ff",
    questions: [
      {
        question: "BTC sube un 12% en 2 horas. ¿Qué hacés?",
        options: [
          { text: "Entro inmediatamente — no puedo perderme el movimiento", profile: "FOMO" },
          { text: "Espero un pullback pero termino entrando cuando ya subió más", profile: "IMPULSIVO" },
          { text: "Busco el soporte más cercano para entrar en retroceso", profile: "CAZADOR" },
          { text: "Analizo el contexto macro antes de decidir cualquier cosa", profile: "DISCIPLINADO" },
        ],
      },
      {
        question: "¿Cuándo fue la última vez que moviste tu stop loss en contra de tu plan?",
        options: [
          { text: "Nunca — si se activa el SL, fue la decisión correcta", profile: "DISCIPLINADO" },
          { text: "La semana pasada, el precio se acercó y entré en pánico", profile: "IMPULSIVO" },
          { text: "Siempre lo elimino cuando el precio va en mi contra", profile: "FOMO" },
          { text: "Casi nunca entro, así que rara vez tengo ese problema", profile: "ANALITICO" },
        ],
      },
      {
        question: "Describí tu historial de operaciones del último mes:",
        options: [
          { text: "Muchas operaciones pequeñas, resultado general negativo", profile: "FOMO" },
          { text: "Grandes ganancias y grandes pérdidas — muy volátil", profile: "IMPULSIVO" },
          { text: "Pocas entradas, busco el reversal perfecto siempre", profile: "CAZADOR" },
          { text: "Consistente, sin grandes sorpresas en ningún sentido", profile: "DISCIPLINADO" },
        ],
      },
      {
        question: "Cuando el mercado va en tu contra, ¿qué sentís?",
        options: [
          { text: "Ansiedad extrema — reviso el precio cada 2 minutos", profile: "FOMO" },
          { text: "Enojo, quiero recuperar las pérdidas cuanto antes", profile: "IMPULSIVO" },
          { text: "Calma, confío en que el precio va a volver a mi zona", profile: "CAZADOR" },
          { text: "Me paralizo analizando si me equivoqué en el análisis", profile: "ANALITICO" },
        ],
      },
      {
        question: "¿Cómo tomás la decisión de entrar a una operación?",
        options: [
          { text: "El precio se mueve fuerte y entro antes de pensarlo", profile: "FOMO" },
          { text: "Cuando un nivel key aparece evalúo si hay reversal", profile: "CAZADOR" },
          { text: "Espero el setup perfecto que muchas veces nunca llega", profile: "ANALITICO" },
          { text: "Sigo mi sistema al pie de la letra sin importar emociones", profile: "DISCIPLINADO" },
        ],
      },
      {
        question: "¿Cuántas operaciones hiciste en el último mes?",
        options: [
          { text: "Más de 50 — hay que aprovechar todo movimiento", profile: "FOMO" },
          { text: "Entre 20 y 50 — opero cuando veo oportunidad", profile: "IMPULSIVO" },
          { text: "Entre 5 y 20 — selectivo con mis entradas", profile: "DISCIPLINADO" },
          { text: "Menos de 5 — esperando la entrada perfecta", profile: "ANALITICO" },
        ],
      },
      {
        question: "Ves traders presumiendo grandes ganancias en Twitter. ¿Reaccionás?",
        options: [
          { text: "FOMO inmediato — abro una posición para no quedarme afuera", profile: "FOMO" },
          { text: "Me enojo y opero para demostrar que yo también puedo", profile: "IMPULSIVO" },
          { text: "Lo ignoro completamente — cada trader tiene su camino", profile: "DISCIPLINADO" },
          { text: "Empiezo a analizar si mi estrategia es la correcta", profile: "ANALITICO" },
        ],
      },
      {
        question: "¿Tenés un plan de trading escrito antes de entrar a cada operación?",
        options: [
          { text: "Sí, siempre. Entrada, SL, TP y tamaño definido antes", profile: "DISCIPLINADO" },
          { text: "A veces, depende de cómo esté el mercado ese día", profile: "IMPULSIVO" },
          { text: "No, el mercado cambia demasiado rápido para planear", profile: "FOMO" },
          { text: "Tengo un plan muy detallado pero rara vez lo ejecuto", profile: "ANALITICO" },
        ],
      },
      {
        question: "BTC cae 15% de repente. ¿Qué hacés con tus altcoins?",
        options: [
          { text: "Vendo todo en pánico antes de que caiga más", profile: "FOMO" },
          { text: "Compro más agresivamente — debe ser el fondo", profile: "CAZADOR" },
          { text: "Las dejo. Confío en el ciclo y mi análisis original", profile: "DISCIPLINADO" },
          { text: "Paso días analizando sin tomar ninguna decisión", profile: "ANALITICO" },
        ],
      },
      {
        question: "¿Cuál es tu mayor problema como trader?",
        options: [
          { text: "Persigo precios y siempre entro tarde", profile: "FOMO" },
          { text: "Opero impulsivamente sin respetar mi plan", profile: "IMPULSIVO" },
          { text: "Nunca encuentro el 'nivel perfecto' para entrar", profile: "CAZADOR" },
          { text: "Analizo tanto que nunca ejecuto las operaciones", profile: "ANALITICO" },
        ],
      },
    ],
    profiles: {
      FOMO: {
        id: "FOMO",
        name: "FOMO Trader",
        emoji: "😱",
        color: "#ff5252",
        tagline: "Siempre llegás tarde al festín",
        description:
          "Operás movido por el miedo a perderte oportunidades. Entrás cuando el movimiento ya hizo el 70% del recorrido, y salís justo antes del siguiente impulso. El FOMO es tu peor enemigo.",
        traits: [
          "Entrás en breakouts tardíos sin confirmación",
          "Revisás el precio cada pocos minutos",
          "Tomás decisiones en segundos por miedo a perderte el movimiento",
          "Cerrás posiciones ganadoras demasiado pronto por ansiedad",
        ],
        weaknesses: [
          "Comprás en máximos y vendés en mínimos consistentemente",
          "Tu costo promedio por operación es muy alto",
          "El Over-trading te consume en comisiones",
        ],
        tools: [
          { icon: "⚡", name: "Liquidation Clock", desc: "Mirá qué niveles tienen REALMENTE liquidez antes de entrar", href: "/liquidations" },
          { icon: "🧠", name: "PSY Score", desc: "Identificá zonas institucionales, no movimientos retail", href: "/psy-score" },
          { icon: "📡", name: "PSY Screener", desc: "Filtrá solo señales de COMPRA FUERTE para no entrar antes", href: "/screener" },
        ],
        planCta: {
          title: "LiqMap PRO es tu antídoto",
          desc: "El mapa de liquidaciones te muestra EXACTAMENTE en qué niveles el smart money entra. Dejás de perseguir precios y empezás a anticiparlos.",
          plan: "PRO",
          href: "/pricing",
        },
      },
      IMPULSIVO: {
        id: "IMPULSIVO",
        name: "Trader Impulsivo",
        emoji: "🔥",
        color: "#ff7043",
        tagline: "Tu mayor enemigo estás en el espejo",
        description:
          "Tenés conocimiento técnico pero tus emociones sabotean cada operación. Rompés tu propio plan, movés stops, y entrás en revenge trading después de pérdidas. La disciplina es tu asignatura pendiente.",
        traits: [
          "Movés el stop loss cuando el precio se acerca",
          "Hacés revenge trading después de pérdidas",
          "Abandonás estrategias que funcionan en el primer drawdown",
          "Aumentás el tamaño de posición cuando estás perdiendo",
        ],
        weaknesses: [
          "Variabilidad extrema en resultados",
          "El estrés emocional afecta tu vida fuera del trading",
          "Quemás cuentas cuando el mercado va en contra",
        ],
        tools: [
          { icon: "📓", name: "Diario de Trading IA", desc: "La IA detecta tus patrones emocionales y te alerta", href: "/journal" },
          { icon: "📐", name: "Position Size Calc", desc: "Calculá el tamaño correcto ANTES de entrar, sin emociones", href: "/calculadora" },
          { icon: "🌡️", name: "PSY HeatMap", desc: "Contexto de mercado para no operar contra la corriente", href: "/heatmap" },
        ],
        planCta: {
          title: "El Aula Virtual cambia tu psicología",
          desc: "El módulo de Psicología del Trading (Nivel 3) te da el framework mental para separar emociones de decisiones. 8 niveles, 44 módulos.",
          plan: "BASIC",
          href: "/pricing",
        },
      },
      CAZADOR: {
        id: "CAZADOR",
        name: "Cazador de Fondos",
        emoji: "🎯",
        color: "#ffd700",
        tagline: "Siempre buscando el reversal perfecto",
        description:
          "Tu instinto de comprar en zonas de pánico es valioso, pero lo llevás al extremo. Intentás atrapar cada fondo antes de que el mercado confirme el giro. A veces acertás espectacularmente; otras veces te barrés.",
        traits: [
          "Comprás en zonas de miedo extremo antes de confirmación",
          "Addeas posiciones mientras el precio baja ('promediás')",
          "Creés que podés identificar el mínimo exacto",
          "Tenés pocas operaciones pero muy concentradas",
        ],
        weaknesses: [
          "Un solo trade puede borrar meses de ganancias",
          "El apalancamiento amplifica tus errores de timing",
          "Luchás contra la tendencia con demasiada frecuencia",
        ],
        tools: [
          { icon: "⚡", name: "Liquidation Clock", desc: "Identificá zonas de liquidez REALES, no solo soportes visuales", href: "/liquidations" },
          { icon: "🌐", name: "Macro Dashboard", desc: "Contexto macro antes de comprar contra la tendencia", href: "/macro" },
          { icon: "💸", name: "Funding Dashboard", desc: "Funding negativo extremo = señal real de capitulación", href: "/funding" },
        ],
        planCta: {
          title: "LiqMap PRO: Comprá donde hay liquidez real",
          desc: "En lugar de adivinar el fondo, LiqMap te muestra exactamente dónde están los stops de los grandes. Esos son los fondos reales.",
          plan: "PRO",
          href: "/pricing",
        },
      },
      ANALITICO: {
        id: "ANALITICO",
        name: "Sobre-Analítico",
        emoji: "🔬",
        color: "#ab47bc",
        tagline: "Paralysis by analysis — sabés todo pero ejecutás nada",
        description:
          "Tu análisis es impecable pero nunca lo ejecutás. Esperás la confirmación perfecta que nunca llega. Mientras analizás, los traders que saben menos que vos están ganando. El conocimiento sin acción no paga.",
        traits: [
          "Analizás horas antes de cada operación",
          "Cuando el setup aparece, buscás más confirmaciones",
          "Tenés notebooks llenos de análisis pero pocas operaciones",
          "Te quedás fuera de movimientos que habías identificado correctamente",
        ],
        weaknesses: [
          "Bajo número de operaciones, poca experiencia real",
          "La perfección te impide aprender de la práctica",
          "Frustrante ver que tus análisis eran correctos pero no ejecutaste",
        ],
        tools: [
          { icon: "📡", name: "PSY Screener", desc: "Deja que el algoritmo confirme lo que ya analizaste", href: "/screener" },
          { icon: "⏮", name: "Market Replay", desc: "Practicá ejecución sin riesgo en histórico de mercado", href: "/replay" },
          { icon: "🧠", name: "PSY Score", desc: "Un número objetivo que elimina la parálisis de análisis", href: "/psy-score" },
        ],
        planCta: {
          title: "El PSY Score elimina la incertidumbre",
          desc: "Un score de 0 a 100 calculado algorítmicamente. Cuando marca >70, entrás. Sin más análisis infinito. Sin más parálisis.",
          plan: "PRO",
          href: "/pricing",
        },
      },
      DISCIPLINADO: {
        id: "DISCIPLINADO",
        name: "Trader Disciplinado",
        emoji: "🏆",
        color: "#00e676",
        tagline: "Ya tenés la mentalidad — ahora necesitás la ventaja",
        description:
          "Felicitaciones. Tenés lo más difícil del trading: disciplina y control emocional. Tu desafío ya no es psicológico — es de ventaja informacional. Necesitás herramientas que te den edge sobre el mercado.",
        traits: [
          "Seguís tu plan de trading consistentemente",
          "Aceptás las pérdidas como parte del proceso",
          "Tu tamaño de posición siempre está controlado",
          "No operás por emoción ni por presión externa",
        ],
        weaknesses: [
          "Podés estar perdiendo edge por falta de herramientas institucionales",
          "Tu análisis técnico puede mejorarse con datos on-chain",
          "Las señales manuales tienen limitaciones vs. sistemas algorítmicos",
        ],
        tools: [
          { icon: "📡", name: "PSY Screener", desc: "Top 50 cryptos con señales PSY-ULT1 en tiempo real", href: "/screener" },
          { icon: "💸", name: "Funding Dashboard", desc: "Funding rates — datos que la mayoría ignora", href: "/funding" },
          { icon: "🌐", name: "Macro Dashboard", desc: "DXY, Yields, SPX — el contexto que mueve crypto", href: "/macro" },
        ],
        planCta: {
          title: "PRO es el paso natural para vos",
          desc: "Ya tenés la disciplina. Ahora sumale la ventaja del dinero inteligente: LiqMap PRO, señales en tiempo real y análisis institucional.",
          plan: "PRO",
          href: "/pricing",
        },
      },
    },
  },

  {
    id: "por-que-te-liquidan",
    title: "¿Por qué te liquidan?",
    subtitle: "Encontrá el patrón que destruye tu cuenta una y otra vez",
    description: "10 situaciones reales de trading. Respondé con honestidad — el diagnóstico puede ahorrarte la próxima liquidación.",
    emoji: "⚡",
    timeMin: 3,
    color: "#ff5252",
    questions: [
      {
        question: "¿Qué apalancamiento usás normalmente en cripto?",
        options: [
          { text: "Más de 20x — los retornos son increíbles cuando acierto", profile: "SOBRE_APALANCADO" },
          { text: "Entre 5x y 20x según lo que veo en el mercado", profile: "SOBRE_APALANCADO" },
          { text: "Entre 2x y 5x con gestión de riesgo estricta", profile: "SIN_PLAN" },
          { text: "1x o sin apalancamiento — protejo mi capital primero", profile: "REVENGE" },
        ],
      },
      {
        question: "¿Qué porcentaje de tu cuenta arriesgás por operación?",
        options: [
          { text: "Más del 20% — si voy a operar, que valga la pena", profile: "SOBRE_APALANCADO" },
          { text: "Entre 10% y 20% según la convicción que tengo", profile: "FOMO_ENTRY" },
          { text: "Entre 1% y 5% siguiendo reglas fijas", profile: "REVENGE" },
          { text: "Varía mucho — a veces el 1%, a veces el 30%", profile: "SIN_PLAN" },
        ],
      },
      {
        question: "Perdés 3 operaciones seguidas. ¿Qué hacés?",
        options: [
          { text: "Abro una operación más grande para recuperar rápido", profile: "REVENGE" },
          { text: "Sigo operando igual, las pérdidas son parte del juego", profile: "SIN_PLAN" },
          { text: "Paro, reviso mi diario y analizo qué salió mal", profile: "SOBRE_APALANCADO" },
          { text: "Abro varias posiciones para diversificar la recuperación", profile: "FOMO_ENTRY" },
        ],
      },
      {
        question: "¿Dónde ponés tu stop loss normalmente?",
        options: [
          { text: "No uso stop loss — el precio siempre vuelve", profile: "SIN_PLAN" },
          { text: "Muy ajustado, no quiero perder más del 1-2%", profile: "FOMO_ENTRY" },
          { text: "En niveles técnicos clave con espacio para respirar", profile: "SOBRE_APALANCADO" },
          { text: "Depende del humor — a veces pongo, a veces no", profile: "REVENGE" },
        ],
      },
      {
        question: "BTC está en una tendencia bajista clara. ¿Entrás long?",
        options: [
          { text: "Sí, siempre — los fondos son las mejores oportunidades", profile: "SIN_PLAN" },
          { text: "Solo si hay señales claras de reversal y confirmo el cambio", profile: "SOBRE_APALANCADO" },
          { text: "Entro apenas veo un rebote, aunque sea pequeño", profile: "FOMO_ENTRY" },
          { text: "Nunca tradeo contra la tendencia principal", profile: "REVENGE" },
        ],
      },
      {
        question: "¿Revisás el contexto macro antes de entrar a una operación?",
        options: [
          { text: "Nunca — el análisis técnico es suficiente", profile: "SIN_PLAN" },
          { text: "A veces, si recuerdo hacerlo", profile: "FOMO_ENTRY" },
          { text: "Siempre: DXY, yields y sentimiento del mercado", profile: "SOBRE_APALANCADO" },
          { text: "Solo reviso el precio y el gráfico de 15 minutos", profile: "REVENGE" },
        ],
      },
      {
        question: "Estás en una operación ganadora. Sube 5%. ¿Qué hacés?",
        options: [
          { text: "Cierro todo inmediatamente — la ganancia es real cuando está en la cuenta", profile: "FOMO_ENTRY" },
          { text: "Cierro parcial, muevo SL a breakeven y dejo correr", profile: "SOBRE_APALANCADO" },
          { text: "Agrego más posición para multiplicar la ganancia", profile: "SIN_PLAN" },
          { text: "Nada — esperaba mucho más y no me conformo con eso", profile: "REVENGE" },
        ],
      },
      {
        question: "¿Tenés reglas escritas de gestión de riesgo que siempre seguís?",
        options: [
          { text: "Sí, están escritas y las reviso regularmente", profile: "SOBRE_APALANCADO" },
          { text: "Las tengo en la cabeza pero no siempre las sigo", profile: "FOMO_ENTRY" },
          { text: "No tengo reglas formales — improviso según el mercado", profile: "SIN_PLAN" },
          { text: "Tuve reglas pero las abandoné después de malos resultados", profile: "REVENGE" },
        ],
      },
      {
        question: "¿Cuál fue tu mayor pérdida en una sola operación?",
        options: [
          { text: "Más del 50% de mi cuenta en una operación", profile: "SOBRE_APALANCADO" },
          { text: "Entre el 20% y 50% — doloroso pero recuperé", profile: "REVENGE" },
          { text: "Entre el 5% y 20% — nunca superé ese límite", profile: "FOMO_ENTRY" },
          { text: "No recuerdo — tengo muchas pérdidas grandes", profile: "SIN_PLAN" },
        ],
      },
      {
        question: "¿Cuántas veces te liquidaron o quemaste una cuenta de futuros?",
        options: [
          { text: "Más de 3 veces — pero siempre aprendo algo nuevo", profile: "SOBRE_APALANCADO" },
          { text: "1 o 2 veces — me pasó pero ya entendí el error", profile: "FOMO_ENTRY" },
          { text: "Nunca me liquidaron pero estuve cerca muchas veces", profile: "SIN_PLAN" },
          { text: "Me liquidaron y después perdí más intentando recuperar", profile: "REVENGE" },
        ],
      },
    ],
    profiles: {
      SOBRE_APALANCADO: {
        id: "SOBRE_APALANCADO",
        name: "Víctima del Apalancamiento",
        emoji: "💣",
        color: "#ff5252",
        tagline: "El leverage amplifica tanto ganancias como liquidaciones",
        description:
          "Tu problema principal es el apalancamiento excesivo. No es que tu análisis sea malo — es que una pequeña fluctuación normal borra tu posición antes de que el precio llegue a tu objetivo. El mercado te da la razón... después de liquidarte.",
        traits: [
          "Usás leverage alto buscando retornos rápidos",
          "Tus liquidaciones ocurren en volatilidad normal de mercado",
          "Sabés analizar pero el sizing destruye tus resultados",
          "A veces ganás mucho, pero los borradores son devastadores",
        ],
        weaknesses: [
          "Una vela de alta volatilidad puede limpiar tu cuenta",
          "Los exchanges liquidan antes de llegar a tu stop loss intencional",
          "El estrés del alto leverage afecta tus decisiones posteriores",
        ],
        tools: [
          { icon: "📐", name: "Position Size Calc", desc: "Calculá el tamaño óptimo según tu capital y riesgo real", href: "/calculadora" },
          { icon: "⚡", name: "Liquidation Clock", desc: "Mirá dónde liquida el mercado ANTES de abrir posición", href: "/liquidations" },
          { icon: "💸", name: "Funding Dashboard", desc: "Funding alto = demasiado apalancamiento en el mercado", href: "/funding" },
        ],
        planCta: {
          title: "LiqMap PRO: Evitá las zonas de barrido",
          desc: "El mapa de liquidaciones muestra exactamente dónde los exchanges van a buscar stops. Dejás de ser la víctima y empezás a anticipar los movimientos.",
          plan: "PRO",
          href: "/pricing",
        },
      },
      SIN_PLAN: {
        id: "SIN_PLAN",
        name: "Sin Sistema Definido",
        emoji: "🎲",
        color: "#ff7043",
        tagline: "Estás jugando, no tradiando",
        description:
          "Sin reglas claras, cada operación es un juego de azar disfrazado de análisis. Algunas salen bien, pero la falta de sistema hace que sea imposible replicar las ganancias y muy fácil repetir los errores.",
        traits: [
          "Cada operación es diferente sin lógica consistente",
          "Cambiás de estrategia frecuentemente",
          "No tenés reglas escritas de entry, exit o gestión de riesgo",
          "Tus mejores meses son producto de la suerte tanto como del skill",
        ],
        weaknesses: [
          "No podés mejorar lo que no podés medir",
          "Sin plan, las emociones toman el control en momentos clave",
          "Impossible replicar resultados positivos de forma consistente",
        ],
        tools: [
          { icon: "📓", name: "Diario de Trading IA", desc: "Registrá operaciones y dejá que la IA detecte tus patrones", href: "/journal" },
          { icon: "📡", name: "PSY Screener", desc: "Un sistema objetivo que filtra señales por ti", href: "/screener" },
          { icon: "⏮", name: "Market Replay", desc: "Probá estrategias en datos históricos sin arriesgar capital", href: "/replay" },
        ],
        planCta: {
          title: "El Aula Virtual te da el sistema",
          desc: "8 niveles de educación estructurada: desde cómo leer un gráfico hasta estrategias institucionales completas. Sin improvisación.",
          plan: "BASIC",
          href: "/pricing",
        },
      },
      FOMO_ENTRY: {
        id: "FOMO_ENTRY",
        name: "Entrada por FOMO",
        emoji: "🏃",
        color: "#ffd700",
        tagline: "Entrás en el peor momento, siempre",
        description:
          "Tu gestión de riesgo es razonable pero tus entradas están contaminadas por el FOMO. Entrás cuando el movimiento ya ocurrió, pagás premiums altos, y tu stop loss correcto te activa en el pullback normal antes del movimiento real.",
        traits: [
          "Entrás después de confirmación tardía del movimiento",
          "Tus stops se activan en fluctuaciones normales post-breakout",
          "Pagás precios altos por entrar en momentum",
          "Perdés la calma cuando ves que otros entraron antes",
        ],
        weaknesses: [
          "Alto costo promedio por operación",
          "Ratio riesgo/recompensa deteriorado por entradas tardías",
          "Las pérdidas por timing incorrecto se acumulan con el tiempo",
        ],
        tools: [
          { icon: "⚡", name: "Liquidation Clock", desc: "Identificá zonas de entry ANTES del movimiento, no después", href: "/liquidations" },
          { icon: "🧠", name: "PSY Score", desc: "Score institucional — cuándo el dinero inteligente ya entró", href: "/psy-score" },
          { icon: "🌡️", name: "PSY HeatMap", desc: "Correlaciones macro para no entrar contra el contexto", href: "/heatmap" },
        ],
        planCta: {
          title: "Anticipá en lugar de seguir",
          desc: "LiqMap PRO te muestra los niveles donde el smart money tiene órdenes acumuladas. Entrás junto a ellos, no después de ellos.",
          plan: "PRO",
          href: "/pricing",
        },
      },
      REVENGE: {
        id: "REVENGE",
        name: "Revenge Trader",
        emoji: "😤",
        color: "#e040fb",
        tagline: "El mercado no te debe nada — pero vos le debés disciplina",
        description:
          "Después de una pérdida, algo se activa en vos que te impulsa a 'recuperar' lo perdido de inmediato. Ese impulso es tu mayor destructor. El mercado no sabe ni le importa que perdiste — pero vos sí, y eso te hace iracional.",
        traits: [
          "Aumentás el tamaño de posición después de pérdidas",
          "Operás más frecuentemente cuando estás en drawdown",
          "Buscás operaciones rápidas para recuperar lo perdido",
          "Rompés todas tus reglas en estado de revenge",
        ],
        weaknesses: [
          "Un día de revenge trading puede borrar semanas de ganancias",
          "Tomás riesgos irracionales cuando más necesitás calma",
          "El ciclo pérdida → revenge → más pérdidas es difícil de romper",
        ],
        tools: [
          { icon: "📓", name: "Diario de Trading IA", desc: "La IA detecta tus patrones emocionales y te da alertas", href: "/journal" },
          { icon: "⚔️", name: "War Room", desc: "Sala de análisis en vivo — operá con contexto, no con rabia", href: "/war-room" },
          { icon: "📐", name: "Position Size Calc", desc: "Definí el size ANTES de la sesión para no improvisarlo", href: "/calculadora" },
        ],
        planCta: {
          title: "El Aula Virtual: Módulo de Psicología",
          desc: "El Nivel 3 del Aula Virtual está dedicado exclusivamente a psicología del trading. Aprenderás a gestionar el revenge trading con técnicas concretas.",
          plan: "BASIC",
          href: "/pricing",
        },
      },
    },
  },

  {
    id: "psicologia",
    title: "Test de Psicología del Trading",
    subtitle: "¿Tu mente es tu mayor ventaja o tu mayor obstáculo?",
    description: "Evaluá tu fortaleza mental en 10 situaciones críticas de trading. Resultados sorprendentemente honestos.",
    emoji: "🧬",
    timeMin: 4,
    color: "#ab47bc",
    questions: [
      {
        question: "¿Cómo describís tu estado mental en los primeros 10 minutos después de una pérdida?",
        options: [
          { text: "Tranquilo — las pérdidas son costos de hacer negocios", profile: "GUERRERO" },
          { text: "Un poco alterado, pero se me pasa en 20-30 minutos", profile: "EN_FORMACION" },
          { text: "Muy afectado — pienso en eso durante horas", profile: "ESCLAVO_FOMO" },
          { text: "Inmediatamente abro otra posición para recuperar", profile: "OVER_TRADER" },
        ],
      },
      {
        question: "Identificaste correctamente un setup perfecto pero no entraste. El precio mueve 20%. ¿Cómo reaccionás?",
        options: [
          { text: "Apunto la observación en mi diario y sigo con la rutina", profile: "GUERRERO" },
          { text: "Me frustra, pero lo tomo como aprendizaje para la próxima", profile: "EN_FORMACION" },
          { text: "FOMO inmediato — entro aunque el movimiento ya ocurrió", profile: "ESCLAVO_FOMO" },
          { text: "Me quedo paralizado, después de eso no puedo operar el resto del día", profile: "CAPITULADOR" },
        ],
      },
      {
        question: "Llevas 2 semanas sin una operación ganadora. ¿Qué hacés?",
        options: [
          { text: "Reviso mi sistema y busco si algo cambió en el mercado", profile: "GUERRERO" },
          { text: "Reduzco el tamaño de posición hasta recuperar confianza", profile: "EN_FORMACION" },
          { text: "Pruebo estrategias diferentes para romper la racha", profile: "OVER_TRADER" },
          { text: "Me replanteo si realmente sirvo para el trading", profile: "CAPITULADOR" },
        ],
      },
      {
        question: "Estás en una operación ganadora y sube 15%. ¿Qué sentís?",
        options: [
          { text: "Satisfacción controlada — ejecuto mi plan de salida normalmente", profile: "GUERRERO" },
          { text: "Euforia — quiero agregar más posición inmediatamente", profile: "OVER_TRADER" },
          { text: "Ansiedad por perder la ganancia — cierro antes de tiempo", profile: "ESCLAVO_FOMO" },
          { text: "Nerviosismo — y si baja y pierdo todo lo ganado", profile: "CAPITULADOR" },
        ],
      },
      {
        question: "¿Con qué frecuencia revisás tu desempeño de trading?",
        options: [
          { text: "Semanalmente — revisión estructurada con métricas", profile: "GUERRERO" },
          { text: "Ocasionalmente, cuando me acuerdo o algo sale muy mal", profile: "EN_FORMACION" },
          { text: "Constantemente, incluso operación por operación en tiempo real", profile: "OVER_TRADER" },
          { text: "Casi nunca — los resultados me deprimen demasiado", profile: "CAPITULADOR" },
        ],
      },
      {
        question: "Un trader que seguís en Twitter dice que viene un crash épico. ¿Cómo te afecta?",
        options: [
          { text: "Lo tomo como una opinión más — hago mi propio análisis", profile: "GUERRERO" },
          { text: "Lo considero y lo incorporo como factor adicional", profile: "EN_FORMACION" },
          { text: "Me genera ansiedad inmediata y cierro posiciones por las dudas", profile: "ESCLAVO_FOMO" },
          { text: "Empiezo a operar short aunque vaya contra mi análisis previo", profile: "OVER_TRADER" },
        ],
      },
      {
        question: "¿Cómo manejás una racha ganadora de 5 operaciones seguidas?",
        options: [
          { text: "Mantengo el mismo tamaño y disciplina — no cambio nada", profile: "GUERRERO" },
          { text: "Subo levemente el tamaño con cautela", profile: "EN_FORMACION" },
          { text: "Subo mucho el tamaño — estoy en modo hot streak", profile: "OVER_TRADER" },
          { text: "Empiezo a esperar que salga mal — siempre se rompe la racha", profile: "CAPITULADOR" },
        ],
      },
      {
        question: "¿Podés descansar bien aunque tengas posiciones abiertas?",
        options: [
          { text: "Sí — si puse mi stop loss, el trade se maneja solo", profile: "GUERRERO" },
          { text: "Más o menos — reviso el precio una vez antes de dormir", profile: "EN_FORMACION" },
          { text: "No — reviso el precio 5+ veces en la noche", profile: "ESCLAVO_FOMO" },
          { text: "Cierro todas las posiciones antes de dormir por el miedo", profile: "CAPITULADOR" },
        ],
      },
      {
        question: "¿Cuántas operaciones hacés en un día de mercado activo?",
        options: [
          { text: "1 a 3 — esperé el setup correcto y lo ejecuté", profile: "GUERRERO" },
          { text: "3 a 7 — sigo oportunidades durante el día", profile: "EN_FORMACION" },
          { text: "Más de 10 — hay que aprovechar la volatilidad", profile: "OVER_TRADER" },
          { text: "0 a 1 — prefiero esperar a estar 100% seguro", profile: "CAPITULADOR" },
        ],
      },
      {
        question: "¿Cuál es tu relación con el trading cuando no estás frente al gráfico?",
        options: [
          { text: "Desconecto completamente — necesito vida fuera del trading", profile: "GUERRERO" },
          { text: "Pienso en el mercado ocasionalmente pero llevo vida normal", profile: "EN_FORMACION" },
          { text: "El trading ocupa el 80%+ de mis pensamientos siempre", profile: "OVER_TRADER" },
          { text: "Pienso en cuánto perdí o puedo perder constantemente", profile: "CAPITULADOR" },
        ],
      },
    ],
    profiles: {
      GUERRERO: {
        id: "GUERRERO",
        name: "Guerrero Mental",
        emoji: "⚔️",
        color: "#00e676",
        tagline: "Tu mayor ventaja es la que está dentro de tu cabeza",
        description:
          "Tenés una fortaleza psicológica excepcional. Procesás las pérdidas como datos, no como fracasos personales. Mantenés la disciplina cuando otros caen en pánico. Esto es lo más difícil del trading — y ya lo tenés.",
        traits: [
          "Procesas pérdidas sin impacto emocional duradero",
          "Mantenés disciplina en situaciones de alta presión",
          "Tu bienestar no depende de los resultados de una operación",
          "Revisás tu desempeño con objetividad científica",
        ],
        weaknesses: [
          "Tu ventaja psicológica puede generar exceso de confianza",
          "Podés subestimar la importancia de actualizar tu sistema",
          "La calma puede volverse complacencia en mercados extremos",
        ],
        tools: [
          { icon: "📡", name: "PSY Screener", desc: "Señales algorítmicas para complementar tu fortaleza mental", href: "/screener" },
          { icon: "💸", name: "Funding Dashboard", desc: "Datos macro para contexto — donde pocos miran", href: "/funding" },
          { icon: "⚔️", name: "War Room", desc: "Sala de análisis en vivo con la comunidad", href: "/war-room" },
        ],
        planCta: {
          title: "Sumale edge informacional a tu fortaleza mental",
          desc: "Ya tenés la psicología. LiqMap PRO te da la ventaja informacional: liquidaciones en tiempo real, PSY Score institucional y señales algorítmicas.",
          plan: "ELITE",
          href: "/pricing",
        },
      },
      EN_FORMACION: {
        id: "EN_FORMACION",
        name: "Trader en Formación",
        emoji: "📈",
        color: "#00e5ff",
        tagline: "Vas por buen camino — solo necesitás más estructura",
        description:
          "Tu psicología es sólida en el 70% de los casos. Tus respuestas muestran madurez y capacidad de aprendizaje. Todavía hay situaciones de alto estrés donde las emociones ganan, pero eso es normal en esta etapa.",
        traits: [
          "Aprendés de los errores y los documentás",
          "Tu gestión emocional mejora con cada mes que pasa",
          "Tomás el trading seriamente sin que consuma tu vida",
          "Tenés momentos de debilidad pero los identificás",
        ],
        weaknesses: [
          "Bajo presión extrema, las emociones todavía pueden ganar",
          "Tu sistema puede no estar lo suficientemente definido",
          "Necesitás más experiencia en diferentes condiciones de mercado",
        ],
        tools: [
          { icon: "📓", name: "Diario de Trading IA", desc: "Documentá tu progreso y detectá patrones de mejora", href: "/journal" },
          { icon: "⏮", name: "Market Replay", desc: "Entrenate en situaciones de alto estrés sin riesgo real", href: "/replay" },
          { icon: "🧠", name: "PSY Score", desc: "Objetividad algorítmica para complementar tu criterio", href: "/psy-score" },
        ],
        planCta: {
          title: "El Aula Virtual acelera tu curva de aprendizaje",
          desc: "8 niveles estructurados que te dan el framework completo: análisis técnico, psicología, gestión de riesgo y estrategia institucional.",
          plan: "BASIC",
          href: "/pricing",
        },
      },
      ESCLAVO_FOMO: {
        id: "ESCLAVO_FOMO",
        name: "Esclavo del FOMO",
        emoji: "😰",
        color: "#ffd700",
        tagline: "El miedo a perderte algo es tu mayor cadena",
        description:
          "El FOMO controla tus decisiones. No es codicia — es miedo. Miedo a quedarte fuera, miedo a que otros ganen y vos no. Este miedo te hace tomar las peores decisiones en los peores momentos del mercado.",
        traits: [
          "Tomás decisiones para aliviar ansiedad, no para maximizar ganancia",
          "Las redes sociales tienen un impacto desproporcionado en tus decisiones",
          "Cerrás posiciones ganadoras demasiado pronto por miedo a perder",
          "Entrás tarde en movimientos por miedo a perderte el rally",
        ],
        weaknesses: [
          "Tus mejores oportunidades las perdés por no actuar en el momento correcto",
          "Las que ejecutás las ejecutás en el peor momento",
          "La ansiedad crónica afecta tu salud y tu performance",
        ],
        tools: [
          { icon: "🧠", name: "PSY Score", desc: "Un número objetivo elimina la ansiedad de la decisión", href: "/psy-score" },
          { icon: "⚡", name: "Liquidation Clock", desc: "Verás OBJETIVAMENTE por qué no debías entrar ahí", href: "/liquidations" },
          { icon: "📓", name: "Diario de Trading IA", desc: "Registra el contexto emocional de cada operación", href: "/journal" },
        ],
        planCta: {
          title: "La solución al FOMO es la objetividad",
          desc: "LiqMap PRO te da datos concretos sobre dónde está el dinero inteligente. Cuando el score dice 'esperar', esperás. Sin emoción. Sin FOMO.",
          plan: "PRO",
          href: "/pricing",
        },
      },
      CAPITULADOR: {
        id: "CAPITULADOR",
        name: "Capitulador",
        emoji: "🏳️",
        color: "#ff5252",
        tagline: "Vendés en el peor momento. Siempre.",
        description:
          "El miedo a perder domina todo. Cerrás posiciones ganadoras demasiado pronto, no entrás en setups perfectos por miedo, y cuando el mercado cae, sos el primero en capitular — justo antes del rebote.",
        traits: [
          "Cerrás posiciones ganadoras antes de tu TP objetivo",
          "El miedo a perder supera el deseo de ganar",
          "Tomás las decisiones más grandes en los momentos de más pánico",
          "Te quedás fuera del mercado después de una mala racha",
        ],
        weaknesses: [
          "Tu win rate puede ser alto pero tus ganancias son insuficientes",
          "Capitulás exactamente en los fondos de mercado",
          "El miedo crónico te impide capitalizar oportunidades reales",
        ],
        tools: [
          { icon: "🌐", name: "Macro Dashboard", desc: "Contexto macro para entender si el miedo del mercado es real", href: "/macro" },
          { icon: "💸", name: "Funding Dashboard", desc: "Funding extremo = momento de ser contrario, no de capitular", href: "/funding" },
          { icon: "⏮", name: "Market Replay", desc: "Revisá lo que pasó después de tus capitulaciones históricas", href: "/replay" },
        ],
        planCta: {
          title: "Datos para combatir el miedo irracional",
          desc: "El Aula Virtual tiene un módulo completo sobre gestión del miedo en trading. Más el LiqMap PRO para ver cuando el mercado tiene razón de caer o es pánico retail.",
          plan: "PRO",
          href: "/pricing",
        },
      },
      OVER_TRADER: {
        id: "OVER_TRADER",
        name: "Over-Trader",
        emoji: "⚡",
        color: "#ff7043",
        tagline: "Más operaciones no es más dinero — es más comisiones",
        description:
          "Operás demasiado. Tu mente necesita acción constante y el mercado se convierte en entretenimiento. Pagás fortunas en comisiones, quemás energía mental en operaciones innecesarias y perdés objetividad.",
        traits: [
          "Necesitás tener posiciones abiertas constantemente",
          "Confundís actividad con productividad en el trading",
          "Operar más te da una sensación de control",
          "En días aburridos, generás operaciones artificialmente",
        ],
        weaknesses: [
          "Las comisiones acumuladas son una sangría constante",
          "El agotamiento mental te hace tomar peores decisiones con el tiempo",
          "La falta de selectividad deteriora la calidad de tus entradas",
        ],
        tools: [
          { icon: "📡", name: "PSY Screener", desc: "Solo mostrá señales FUERTES — automáticamente reducís operaciones", href: "/screener" },
          { icon: "📓", name: "Diario de Trading IA", desc: "La IA te mostrará que tus mejores días son los de menos operaciones", href: "/journal" },
          { icon: "🏆", name: "Leaderboard", desc: "Analizá el historial de señales — la calidad supera la cantidad", href: "/leaderboard" },
        ],
        planCta: {
          title: "Menos operaciones, mejores resultados",
          desc: "El PSY Screener PRO filtra solo las señales de máxima calidad. Empezás a operar 1-3 veces por semana con alta convicción en lugar de 10-20 veces con baja calidad.",
          plan: "PRO",
          href: "/pricing",
        },
      },
    },
  },
];

export function getTest(id: string): PsyTest | undefined {
  return TESTS.find(t => t.id === id);
}

export function computeResult(test: PsyTest, answers: string[]): TraderProfile {
  const scores: Record<string, number> = {};
  for (const key of Object.keys(test.profiles)) scores[key] = 0;
  for (const profileId of answers) {
    if (scores[profileId] !== undefined) scores[profileId]++;
  }
  const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  return test.profiles[winner];
}
