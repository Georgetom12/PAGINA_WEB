import React, { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/site-nav";

const STORAGE_KEY = "psy_challenge_v1";

interface ChallengeDay {
  day: number;
  title: string;
  tasks: { id: string; text: string; pts: number }[];
  lesson: string;
  category: string;
  color: string;
}

const DAYS: ChallengeDay[] = [
  { day: 1,  category: "PSICOLOGÍA",   color: "#00e5ff", title: "Define tu perfil de riesgo",           lesson: "El trader que no sabe cuánto puede perder ya perdió.", tasks: [{ id:"d1t1", text: "Completá el test '¿Qué tipo de trader eres?'", pts: 20 }, { id:"d1t2", text: "Anotá tu capital real disponible para trading", pts: 10 }, { id:"d1t3", text: "Define tu pérdida máxima mensual tolerada", pts: 20 }] },
  { day: 2,  category: "GESTIÓN",      color: "#00e676", title: "Aprende position sizing",              lesson: "Un 1% de riesgo por trade puede salvarte en un drawdown del 30%.", tasks: [{ id:"d2t1", text: "Calculá tu position size para 1% de riesgo en tu capital", pts: 20 }, { id:"d2t2", text: "Abre la Calculadora y practica 3 escenarios", pts: 15 }, { id:"d2t3", text: "Establece tu R:R mínimo aceptable (recomendado: 1.5)", pts: 15 }] },
  { day: 3,  category: "ANÁLISIS",     color: "#ffd700", title: "Lee el PSY Score",                     lesson: "Operar contra el sesgo del mercado es la causa #1 de liquidaciones.", tasks: [{ id:"d3t1", text: "Revisa el PSY Score actual y anota el nivel", pts: 10 }, { id:"d3t2", text: "Identifica si el mercado está en miedo o codicia", pts: 15 }, { id:"d3t3", text: "Describe qué haría un trader emocional vs institucional ahora", pts: 25 }] },
  { day: 4,  category: "ON-CHAIN",     color: "#e040fb", title: "Spot vs Perpetuos",                   lesson: "Cuando los futuros crecen sin soporte spot: trampa alcista.", tasks: [{ id:"d4t1", text: "Abre Spot vs Perpetuos y lee el régimen actual", pts: 15 }, { id:"d4t2", text: "Anota la tendencia de los últimos 30 días", pts: 15 }, { id:"d4t3", text: "Identifica si el patrón 2022 está activo hoy", pts: 20 }] },
  { day: 5,  category: "PSICOLOGÍA",   color: "#00e5ff", title: "Autopsia de un trade perdedor",       lesson: "El trader que no analiza sus errores está condenado a repetirlos.", tasks: [{ id:"d5t1", text: "Recuerda tu peor trade reciente y escríbelo brevemente", pts: 10 }, { id:"d5t2", text: "Usa PSY Autopsy para analizarlo con IA", pts: 25 }, { id:"d5t3", text: "Lista 3 cambios concretos para evitar repetir ese error", pts: 15 }] },
  { day: 6,  category: "MACRO",        color: "#ff6d00", title: "Entiende la macro",                   lesson: "BTC no opera en el vacío — el DXY y los yields mandan.", tasks: [{ id:"d6t1", text: "Abre el Macro Dashboard y nota los niveles de DXY y SPX", pts: 15 }, { id:"d6t2", text: "¿Están los yields en zona de riesgo para BTC?", pts: 20 }, { id:"d6t3", text: "Compara el FED Chart: ¿en qué era macroeconómica estamos?", pts: 15 }] },
  { day: 7,  category: "DESCANSO",     color: "#4a6070", title: "Revisión de semana 1",                lesson: "Revisar es más valioso que operar. El edge está en los datos.", tasks: [{ id:"d7t1", text: "Repasa tus notas de los 6 días anteriores", pts: 10 }, { id:"d7t2", text: "Calcula tu score promedio de esta semana", pts: 10 }, { id:"d7t3", text: "Escribe tu mayor aprendizaje de la semana en el Journal", pts: 30 }] },
  { day: 8,  category: "TÉCNICO",      color: "#00e676", title: "Identifica el ciclo actual",          lesson: "Los ciclos de BTC son predecibles — si tienes los datos.", tasks: [{ id:"d8t1", text: "Abre Ciclos BTC y estudia dónde estamos históricamente", pts: 15 }, { id:"d8t2", text: "¿El Stoch RSI está en zona de acumulación o distribución?", pts: 20 }, { id:"d8t3", text: "¿Cuándo fue el último bottom de ciclo según el gráfico?", pts: 15 }] },
  { day: 9,  category: "GESTIÓN",      color: "#00e676", title: "Crea tu plan de trading personal",   lesson: "Si no tienes un plan escrito, tu emociones son tu plan.", tasks: [{ id:"d9t1", text: "Define tus horarios de trading (Market Hours → Overlap NY+London)", pts: 10 }, { id:"d9t2", text: "Escribe tus 3 setups favoritos con condiciones de entrada", pts: 25 }, { id:"d9t3", text: "Define tus reglas de salida: TP, SL y trailing stop", pts: 15 }] },
  { day: 10, category: "SCREENER",     color: "#ffd700", title: "Explora el PSY Screener",             lesson: "El mercado siempre tiene líderes y rezagados — encuéntralos.", tasks: [{ id:"d10t1", text: "Abre PSY Screener y lee el Top 10 por señal PSY-ULT1", pts: 10 }, { id:"d10t2", text: "Identifica 2 assets con señal LONG confirmada", pts: 20 }, { id:"d10t3", text: "¿Algún token está en DANGER con señal SHORT?", pts: 20 }] },
  { day: 11, category: "ON-CHAIN",     color: "#e040fb", title: "Whale Alert — sigue el dinero",      lesson: "Las ballenas no ocultan todo — las transferencias on-chain hablan.", tasks: [{ id:"d11t1", text: "Abre Whale Alert y observa durante 10 minutos", pts: 10 }, { id:"d11t2", text: "¿El flujo neto va hacia exchanges o fuera de ellos?", pts: 20 }, { id:"d11t3", text: "¿Qué implicación tiene eso para el precio corto plazo?", pts: 20 }] },
  { day: 12, category: "PSICOLOGÍA",   color: "#00e5ff", title: "Los 7 pecados del trader",           lesson: "Soberbia, impaciencia, codicia, miedo, venganza, pereza, exceso.", tasks: [{ id:"d12t1", text: "Lee 'Los 7 pecados del trading' (Blog PSYCHOMETRIKS)", pts: 10 }, { id:"d12t2", text: "Identifica tus 3 pecados más frecuentes honestamente", pts: 20 }, { id:"d12t3", text: "Escribe una regla de trading para combatir cada uno", pts: 20 }] },
  { day: 13, category: "MACRO",        color: "#ff6d00", title: "Correlación XAU + DXY + BTC",        lesson: "Cuando el dólar cae, el oro sube — y BTC puede hacer lo mismo.", tasks: [{ id:"d13t1", text: "Abre Macro Dashboard y observa correlación DXY/XAU/BTC", pts: 15 }, { id:"d13t2", text: "En las últimas 4 semanas, ¿corrieron en la misma dirección?", pts: 20 }, { id:"d13t3", text: "¿Cómo afecta esto tu thesis actual sobre BTC?", pts: 15 }] },
  { day: 14, category: "DESCANSO",     color: "#4a6070", title: "Revisión de semana 2",               lesson: "Solo el 10% de los traders tienen un journal. Sé ese 10%.", tasks: [{ id:"d14t1", text: "Actualiza tu Journal con los trades de esta semana", pts: 15 }, { id:"d14t2", text: "Calcula tu win rate y R promedio de los últimos 7 días", pts: 20 }, { id:"d14t3", text: "Define 1 mejora específica para la próxima semana", pts: 15 }] },
  { day: 15, category: "TÉCNICO",      color: "#ffd700", title: "Funding Rates — señales contrarias",  lesson: "Funding extremo positivo = liquidaciones masivas inminentes.", tasks: [{ id:"d15t1", text: "Abre Funding Dashboard y lee los rates de BTC y ETH", pts: 10 }, { id:"d15t2", text: "¿El funding está en zona de alerta (>0.05%)?", pts: 20 }, { id:"d15t3", text: "¿Cómo cambiarías tu posición actual con estos datos?", pts: 20 }] },
  { day: 16, category: "GESTIÓN",      color: "#00e676", title: "Simulador de liquidación",           lesson: "Sufrir una liquidación simulada es más barato que la real.", tasks: [{ id:"d16t1", text: "Entra al Simulador y configura tu setup actual", pts: 10 }, { id:"d16t2", text: "Simula un drawdown del 20% con 10x de leverage", pts: 20 }, { id:"d16t3", text: "¿Qué leverage máximo mantiene tu posición en el -30%?", pts: 20 }] },
  { day: 17, category: "ON-CHAIN",     color: "#e040fb", title: "PSY Heatmap — correlaciones",        lesson: "Nada se mueve solo — las correlaciones te dicen cuándo confiar.", tasks: [{ id:"d17t1", text: "Abre PSY HeatMap y lee la correlación BTC/ETH semanal", pts: 10 }, { id:"d17t2", text: "¿El DXY está correlacionado inversamente con BTC ahora?", pts: 20 }, { id:"d17t3", text: "¿Hay alguna correlación rota que sea una oportunidad?", pts: 20 }] },
  { day: 18, category: "PSICOLOGÍA",   color: "#00e5ff", title: "El ciclo de las emociones del trader",lesson: "Euforia → Negación → Miedo → Capitulación → Esperanza → Optimismo.", tasks: [{ id:"d18t1", text: "¿Dónde estás tú emocionalmente con BTC hoy?", pts: 10 }, { id:"d18t2", text: "¿Dónde está la mayoría del retail según el PSY Score?", pts: 15 }, { id:"d18t3", text: "Describe cómo actúa un institucional en el punto donde estás", pts: 25 }] },
  { day: 19, category: "TÉCNICO",      color: "#ffd700", title: "War Room — análisis en vivo",        lesson: "El contexto de mercado cambia todo. Lee la sala antes de operar.", tasks: [{ id:"d19t1", text: "Abre War Room y lee el análisis de sesión actual", pts: 10 }, { id:"d19t2", text: "¿Cuál es el nivel de soporte clave marcado hoy?", pts: 20 }, { id:"d19t3", text: "¿El setup de hoy se alinea con tu plan de trading?", pts: 20 }] },
  { day: 20, category: "GESTIÓN",      color: "#00e676", title: "Construye tu Dashboard personal",    lesson: "Un trader organizado toma mejores decisiones bajo presión.", tasks: [{ id:"d20t1", text: "Configura tu watchlist con máximo 5 pares a monitorear", pts: 10 }, { id:"d20t2", text: "Define un ritual de apertura de sesión (checklist)", pts: 20 }, { id:"d20t3", text: "Define un ritual de cierre de sesión con revisión de trades", pts: 20 }] },
  { day: 21, category: "DESCANSO",     color: "#4a6070", title: "Revisión de semana 3 — mitad del reto",lesson: "Llegaste a la mitad. El 70% abandonó. Tú no.", tasks: [{ id:"d21t1", text: "Escribe tu mayor victoria de este challenge hasta ahora", pts: 15 }, { id:"d21t2", text: "¿Qué hábito nuevo has incorporado realmente?", pts: 20 }, { id:"d21t3", text: "Comparte tu progreso en la comunidad (código de honor)", pts: 15 }] },
  { day: 22, category: "MACRO",        color: "#ff6d00", title: "Calendario económico — anticipa el FOMC",lesson: "El FOMC mueve mercados más que cualquier indicador técnico.", tasks: [{ id:"d22t1", text: "Abre Calendario Económico y busca el próximo FOMC/CPI", pts: 10 }, { id:"d22t2", text: "¿Cuántos días faltan? ¿Cómo reducirías posición antes?", pts: 20 }, { id:"d22t3", text: "¿Cómo reaccionó BTC en los últimos 3 eventos similares?", pts: 20 }] },
  { day: 23, category: "REPLAY",       color: "#00e5ff", title: "Aprende de crashes históricos",      lesson: "El mercado repite sus patrones. Quien los conoce, los anticipa.", tasks: [{ id:"d23t1", text: "Abre Market Replay y estudia el crash de May 2021", pts: 15 }, { id:"d23t2", text: "¿Qué señales daban el Funding y el OI antes del crash?", pts: 20 }, { id:"d23t3", text: "Identifica si esas señales están activas ahora mismo", pts: 15 }] },
  { day: 24, category: "ON-CHAIN",     color: "#e040fb", title: "Coinbase Premium — señal de USA",    lesson: "Cuando Coinbase cotiza más caro que Kraken, el retail USA está comprando.", tasks: [{ id:"d24t1", text: "Abre FED×BTC y lee el Coinbase Premium actual", pts: 10 }, { id:"d24t2", text: "¿Está el premium en positivo (demanda USA) o negativo?", pts: 20 }, { id:"d24t3", text: "¿Confirma o contradice tu thesis actual de mercado?", pts: 20 }] },
  { day: 25, category: "PSICOLOGÍA",   color: "#00e5ff", title: "Reglas de trading — las tuyas",     lesson: "Warren Buffett: 'Regla 1: No perder dinero. Regla 2: No olvidar la regla 1.'", tasks: [{ id:"d25t1", text: "Lista tus 10 reglas de trading personales e intransferibles", pts: 15 }, { id:"d25t2", text: "¿Cuáles rompiste en el último mes? Sé honesto.", pts: 20 }, { id:"d25t3", text: "¿Qué consecuencia personal pondrás si las rompes de nuevo?", pts: 15 }] },
  { day: 26, category: "ANÁLISIS",     color: "#ffd700", title: "Backtesting mental de tu setup",    lesson: "Un setup que no funcionó en el pasado no funcionará hoy.", tasks: [{ id:"d26t1", text: "Elige tu setup favorito y abre Market Replay", pts: 10 }, { id:"d26t2", text: "¿Cuántas veces funcionó en los últimos 6 escenarios históricos?", pts: 25 }, { id:"d26t3", text: "Define la condición de invalidación exacta del setup", pts: 15 }] },
  { day: 27, category: "GESTIÓN",      color: "#00e676", title: "Drawdown máximo tolerado",          lesson: "La cuenta que sobrevive un -30% puede recuperarse. La que llega al -70%, no.", tasks: [{ id:"d27t1", text: "Calcula cuántos trades perdedores seguidos puedes tolerar con 1% R", pts: 15 }, { id:"d27t2", text: "¿Cuál es tu drawdown máximo histórico? ¿Qué lo causó?", pts: 20 }, { id:"d27t3", text: "Define tu regla de 'stop trading' si alcanzas cierto drawdown", pts: 15 }] },
  { day: 28, category: "DESCANSO",     color: "#4a6070", title: "Revisión de semana 4 — recta final", lesson: "Los últimos días son los más importantes. No bajes la guardia.", tasks: [{ id:"d28t1", text: "Revisa todas las notas del Journal de este mes", pts: 15 }, { id:"d28t2", text: "Calcula tu P&L total del mes (simulado o real)", pts: 20 }, { id:"d28t3", text: "Escribe: '¿Qué tipo de trader soy HOY vs hace 28 días?'", pts: 15 }] },
  { day: 29, category: "FINAL",        color: "#e040fb", title: "Tu manifiesto de trading",          lesson: "Un trader con principios claros no necesita emociones para decidir.", tasks: [{ id:"d29t1", text: "Escribe tu manifiesto personal: ¿por qué operas?", pts: 15 }, { id:"d29t2", text: "Define tus 3 objetivos de trading para los próximos 90 días", pts: 20 }, { id:"d29t3", text: "Comparte tu manifiesto con alguien de confianza", pts: 15 }] },
  { day: 30, category: "FINAL",        color: "#ffd700", title: "GRADUACIÓN — Eres un PSY Trader",  lesson: "30 días de disciplina valen más que 10 años de operación inconsciente.", tasks: [{ id:"d30t1", text: "Completa el test de psicología final (compara con el día 1)", pts: 20 }, { id:"d30t2", text: "Escribe tu 'antes y después' honesto de este challenge", pts: 20 }, { id:"d30t3", text: "Imprime (mentalmente) tu certificado PSY Trader 30D", pts: 10 }] },
];

interface SavedState {
  startDate: string | null;
  completedTasks: string[];
  currentDay: number;
}

const EMPTY_STATE: SavedState = { startDate: null, completedTasks: [], currentDay: 1 };

export default function Challenge() {
  const [state, setState]     = useState<SavedState>(EMPTY_STATE);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setState(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  const save = useCallback((s: SavedState) => {
    setState(s);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }, []);

  const startChallenge = useCallback(() => {
    const ns: SavedState = { startDate: new Date().toISOString(), completedTasks: [], currentDay: 1 };
    save(ns);
    setSelectedDay(1);
  }, [save]);

  const toggleTask = useCallback((taskId: string) => {
    const completed = state.completedTasks.includes(taskId);
    const completedTasks = completed
      ? state.completedTasks.filter(id => id !== taskId)
      : [...state.completedTasks, taskId];

    // Auto-advance currentDay
    let currentDay = state.currentDay;
    const dayData = DAYS[currentDay - 1];
    if (dayData) {
      const allDone = dayData.tasks.every(t => completedTasks.includes(t.id));
      if (allDone && currentDay < 30) currentDay = Math.max(currentDay, dayData.day + 1);
    }
    save({ ...state, completedTasks, currentDay });
  }, [state, save]);

  const totalPts = DAYS.reduce((sum, d) => sum + d.tasks.reduce((s, t) => s + t.pts, 0), 0);
  const earnedPts = state.completedTasks.reduce((sum, id) => {
    for (const d of DAYS) {
      const task = d.tasks.find(t => t.id === id);
      if (task) return sum + task.pts;
    }
    return sum;
  }, 0);

  const completedDays = DAYS.filter(d => d.tasks.every(t => state.completedTasks.includes(t.id))).length;
  const progressPct = Math.round((earnedPts / totalPts) * 100);

  const dayView = selectedDay !== null ? DAYS[selectedDay - 1] : null;

  return (
    <div className="min-h-screen bg-[#020b12] text-white">
      <SiteNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">

        {/* Header */}
        <div className="mb-8">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-3">PSYCHOMETRIKS · DESARROLLO</div>
          <h1 className="font-bebas text-5xl md:text-6xl leading-none text-white mb-2">
            CHALLENGE <span className="text-[#ffd700]">30 DÍAS</span>
          </h1>
          <p className="font-space text-[11px] text-[#7ab3c8]">
            30 días de disciplina para convertirte en un PSY Trader profesional · Un desafío diario · 3 tareas por día
          </p>
        </div>

        {!state.startDate ? (
          /* Start screen */
          <div className="border border-[#ffd70030] bg-[#0a0900] p-8 text-center max-w-lg mx-auto">
            <div className="text-5xl mb-4">🏆</div>
            <div className="font-bebas text-3xl text-[#ffd700] mb-4">¿ESTÁS LISTO?</div>
            <div className="font-space text-[11px] text-[#8a9090] leading-relaxed mb-6">
              30 días. 3 tareas por día. 1500+ puntos disponibles. Usa TODAS las herramientas de PSYCHOMETRIKS y conviértete en el trader que siempre quisiste ser.
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[["30", "DÍAS"], ["90", "TAREAS"], ["1500+", "PUNTOS"]].map(([val, lbl]) => (
                <div key={lbl} className="border border-[#ffd70030] p-3">
                  <div className="font-bebas text-2xl text-[#ffd700]">{val}</div>
                  <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#7ab3c8]">{lbl}</div>
                </div>
              ))}
            </div>
            <button onClick={startChallenge}
              className="w-full py-3 bg-[#ffd700] text-black font-bebas text-xl tracking-widest hover:bg-[#ffe033] transition-colors">
              COMENZAR EL CHALLENGE
            </button>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="mb-8 p-5 border border-[#0d2030] bg-[#040f18]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-6">
                  <div>
                    <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#7ab3c8]">PUNTOS</div>
                    <div className="font-bebas text-2xl text-[#ffd700]">{earnedPts} / {totalPts}</div>
                  </div>
                  <div>
                    <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#7ab3c8]">DÍAS COMPLETADOS</div>
                    <div className="font-bebas text-2xl text-[#00e676]">{completedDays} / 30</div>
                  </div>
                  <div>
                    <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#7ab3c8]">DÍA ACTUAL</div>
                    <div className="font-bebas text-2xl text-[#00e5ff]">{state.currentDay}</div>
                  </div>
                </div>
                <div className="font-bebas text-3xl text-white">{progressPct}%</div>
              </div>
              <div className="h-2 bg-[#0d2030] rounded overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#ffd700] to-[#00e676] transition-all duration-700 rounded"
                  style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            {/* Day detail panel */}
            {dayView && (
              <div className="mb-6 border p-5 bg-[#040f18]" style={{ borderColor: `${dayView.color}40` }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-sharetech text-[8px] tracking-[0.2em] px-2 py-0.5 border"
                        style={{ color: dayView.color, borderColor: `${dayView.color}40` }}>{dayView.category}</span>
                      <span className="font-sharetech text-[8px] tracking-[0.2em] text-[#7ab3c8]">DÍA {dayView.day}</span>
                    </div>
                    <div className="font-bebas text-2xl text-white">{dayView.title}</div>
                  </div>
                  <button onClick={() => setSelectedDay(null)} className="font-space text-[10px] text-[#7ab3c8] hover:text-white shrink-0">✕ CERRAR</button>
                </div>
                <div className="border-l-2 pl-4 mb-4 italic font-space text-[10px] text-[#8a9090]" style={{ borderColor: dayView.color }}>
                  "{dayView.lesson}"
                </div>
                <div className="space-y-2">
                  {dayView.tasks.map(task => {
                    const done = state.completedTasks.includes(task.id);
                    return (
                      <button key={task.id} onClick={() => toggleTask(task.id)}
                        className={`w-full flex items-center gap-3 p-3 border text-left transition-colors ${done ? "border-[#00e67640] bg-[#001a0a]" : "border-[#0d2030] hover:border-[#7ab3c8]"}`}>
                        <div className={`w-5 h-5 shrink-0 border flex items-center justify-center ${done ? "border-[#00e676] bg-[#00e676] text-black" : "border-[#7ab3c8]"}`}>
                          {done && <span className="text-[10px] font-bold">✓</span>}
                        </div>
                        <span className={`font-space text-[10px] flex-1 ${done ? "text-[#7ab3c8] line-through" : "text-white"}`}>{task.text}</span>
                        <span className="font-sharetech text-[8px] tracking-[0.1em] shrink-0" style={{ color: dayView.color }}>+{task.pts} pts</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 30-day grid */}
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-1.5">
              {DAYS.map(d => {
                const allDone  = d.tasks.every(t => state.completedTasks.includes(t.id));
                const partial  = !allDone && d.tasks.some(t => state.completedTasks.includes(t.id));
                const locked   = d.day > state.currentDay;
                const selected = selectedDay === d.day;

                return (
                  <button key={d.day} disabled={locked}
                    onClick={() => setSelectedDay(selected ? null : d.day)}
                    className={`aspect-square flex flex-col items-center justify-center border text-center transition-all ${
                      locked   ? "border-[#060d16] opacity-30 cursor-not-allowed" :
                      selected ? `border-current bg-opacity-20` :
                      allDone  ? "border-[#00e67640] bg-[#001a0a] hover:bg-[#002a14]" :
                      partial  ? "border-[#ffd70040] bg-[#0a0900] hover:bg-[#0f0d00]" :
                                 "border-[#0d2030] bg-[#040f18] hover:border-[#7ab3c8]"
                    }`}
                    style={selected ? { borderColor: d.color, backgroundColor: `${d.color}10` } : {}}>
                    <div className="font-bebas text-xs leading-none mb-0.5" style={{ color: locked ? "#2a4050" : allDone ? "#00e676" : d.color }}>
                      {d.day}
                    </div>
                    {allDone  && <div className="text-[6px]">✓</div>}
                    {partial  && !allDone && <div className="w-1 h-1 rounded-full bg-[#ffd700]" />}
                    {!allDone && !partial && !locked && <div className="font-sharetech text-[5px] text-[#7ab3c8] leading-none">{d.category.slice(0,3)}</div>}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex gap-4 font-space text-[9px] text-[#7ab3c8]">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 border border-[#00e67640] bg-[#001a0a]" /> Completado</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 border border-[#ffd70040] bg-[#0a0900]" /> En progreso</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 border border-[#0d2030] bg-[#040f18]" /> Disponible</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 border border-[#060d16] opacity-30" /> Bloqueado</div>
            </div>

            <button onClick={() => { if (confirm("¿Reiniciar todo el progreso?")) save(EMPTY_STATE); }}
              className="mt-6 font-space text-[9px] text-[#5a8898] hover:text-[#ff1744] transition-colors">
              Reiniciar challenge
            </button>
          </>
        )}
      </div>
    </div>
  );
}
