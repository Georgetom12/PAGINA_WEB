import { useState } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/site-nav";

interface Question {
  id: string;
  text: string;
  options: { value: string; label: string; score: Record<string, number> }[];
}

const QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "Abrís un trade. Va en tu contra 2%. ¿Qué hacés?",
    options: [
      { value: "a", label: "Cierro — respeto mi SL sin dudar", score: { disciplina: 3, paciencia: 2, control: 3 } },
      { value: "b", label: "Espero... a veces vuelve", score: { esperanza: 3, disciplina: -1, riesgo: 2 } },
      { value: "c", label: "Agrego posición — promedio a la baja", score: { agresividad: 3, riesgo: 3, disciplina: -2 } },
      { value: "d", label: "Muevo el SL para darle más espacio", score: { esperanza: 2, disciplina: -3, riesgo: 2 } },
    ],
  },
  {
    id: "q2",
    text: "BTC sube 8% en 2 horas y no estás en el trade. ¿Tu reacción?",
    options: [
      { value: "a", label: "Espero la corrección para entrar limpio", score: { paciencia: 3, disciplina: 3, control: 2 } },
      { value: "b", label: "Entro igual — no me quiero perder el movimiento", score: { fomo: 3, riesgo: 2, disciplina: -2 } },
      { value: "c", label: "Me enojo, cierro la pantalla", score: { emocional: 3, control: -2 } },
      { value: "d", label: "Analizo por qué no lo vi y aprendo", score: { sistemático: 3, disciplina: 2, paciencia: 2 } },
    ],
  },
  {
    id: "q3",
    text: "Ganás $500 en un trade. ¿Qué hacés inmediatamente después?",
    options: [
      { value: "a", label: "Registro el trade y espero el siguiente setup", score: { sistemático: 3, disciplina: 3 } },
      { value: "b", label: "Entro en otro trade para ganar más", score: { agresividad: 2, fomo: 2, riesgo: 2 } },
      { value: "c", label: "Me siento invencible — subo el tamaño de posición", score: { soberbia: 3, riesgo: 3, disciplina: -3 } },
      { value: "d", label: "Paro por hoy — prefiero no arruinar el día", score: { control: 3, paciencia: 2 } },
    ],
  },
  {
    id: "q4",
    text: "Llevás 3 trades perdedores seguidos. ¿Qué pasa en tu cabeza?",
    options: [
      { value: "a", label: "Reviso mi sistema — algo puede estar fallando", score: { sistemático: 3, disciplina: 2, control: 2 } },
      { value: "b", label: "Entro en modo revenge — necesito recuperar", score: { emocional: 3, riesgo: 3, disciplina: -3 } },
      { value: "c", label: "Paro, me alejo de la pantalla", score: { control: 3, paciencia: 3 } },
      { value: "d", label: "Subo el tamaño — la racha mala termina pronto", score: { esperanza: 2, riesgo: 3, disciplina: -2 } },
    ],
  },
  {
    id: "q5",
    text: "¿Cuánto tiempo analizás un setup ANTES de entrar?",
    options: [
      { value: "a", label: "5+ minutos — reviso múltiples timeframes", score: { sistemático: 3, paciencia: 3, disciplina: 2 } },
      { value: "b", label: "1-2 minutos — si se ve bien, entro", score: { agresividad: 2, disciplina: 1 } },
      { value: "c", label: "Segundos — las oportunidades se van rápido", score: { fomo: 3, riesgo: 2, disciplina: -2 } },
      { value: "d", label: "Depende del activo y el momento", score: { sistemático: 2, disciplina: 2 } },
    ],
  },
  {
    id: "q6",
    text: "Alguien en Twitter dice que BTC va a $200k esta semana. ¿Qué hacés?",
    options: [
      { value: "a", label: "Lo ignoro — analizo el mercado yo mismo", score: { independiente: 3, disciplina: 3, sistemático: 2 } },
      { value: "b", label: "Reviso si tiene sentido técnico, luego decido", score: { sistemático: 3, disciplina: 2 } },
      { value: "c", label: "Si el tipo tiene muchos seguidores, lo considero", score: { influenciable: 3, disciplina: -1 } },
      { value: "d", label: "Entro ya — no quiero quedarme afuera", score: { fomo: 3, riesgo: 2, disciplina: -2 } },
    ],
  },
  {
    id: "q7",
    text: "Tenés una posición abierta ganando $1,000. Empieza a corregir. ¿Qué hacés?",
    options: [
      { value: "a", label: "Respeto mi TP — no cierro antes de tiempo", score: { disciplina: 3, paciencia: 3, control: 2 } },
      { value: "b", label: "Cierro mitad y dejo correr el resto", score: { disciplina: 2, sistemático: 2, control: 2 } },
      { value: "c", label: "Cierro todo — prefiero asegurar la ganancia", score: { control: 2, paciencia: -1 } },
      { value: "d", label: "Muevo el TP hacia abajo porque tengo miedo", score: { emocional: 2, paciencia: -2, disciplina: -1 } },
    ],
  },
  {
    id: "q8",
    text: "¿Cuál es tu mayor problema como trader?",
    options: [
      { value: "a", label: "Entro antes de que el setup esté confirmado", score: { fomo: 3, paciencia: -2 } },
      { value: "b", label: "No respeto el SL cuando el trade va mal", score: { emocional: 3, disciplina: -3 } },
      { value: "c", label: "Sobretrading — opero demasiado", score: { agresividad: 2, fomo: 2, control: -2 } },
      { value: "d", label: "Me siento bien — tengo todo controlado", score: { soberbia: 3, disciplina: -1 } },
    ],
  },
];

interface Profile {
  id: string;
  name: string;
  emoji: string;
  color: string;
  tagline: string;
  description: string;
  fatalFlaw: string;
  superpower: string;
  marketSees: string;
  fix: string;
  shareText: string;
}

const PROFILES: Profile[] = [
  {
    id: "predator",
    name: "EL PREDADOR",
    emoji: "🦅",
    color: "#00e676",
    tagline: "Operás como el mercado quiere que operen los demás",
    description: "Tenés disciplina real. Analizás antes de entrar, respetás el SL, y no te afecta el ruido de corto plazo. Sos parte del 5% que gana consistentemente.",
    fatalFlaw: "La soberbia. Un período de buenas rachas puede hacerte bajar la guardia.",
    superpower: "Paciencia depredadora. Esperás el setup perfecto y cuando llegás, ejecutás sin dudar.",
    marketSees: "El mercado te ve como competencia. Sos difícil de liquidar.",
    fix: "Seguí registrando tus trades. La complacencia mata a los mejores traders.",
    shareText: "Soy EL PREDADOR 🦅 — el ADN del 5% que gana en crypto. Descubrí tu perfil en",
  },
  {
    id: "ghost",
    name: "EL FANTASMA",
    emoji: "👻",
    color: "#00e5ff",
    tagline: "Analizás bien, pero no ejecutás",
    description: "Tu análisis técnico es sólido, pero la parálisis por análisis te mata. Ves el setup, sabés que es bueno, y aun así dudás. Cuando finalmente entrás, el movimiento ya pasó.",
    fatalFlaw: "El miedo disfrazado de 'necesito más confirmación'. El mercado no espera.",
    superpower: "Análisis profundo. Cuando ejecutás, tus trades son los mejor planificados.",
    marketSees: "El mercado te respeta en análisis, pero te ignora en ejecución.",
    fix: "Definí reglas claras de entrada y EJECUTÁ cuando se cumplen. Sin negociación.",
    shareText: "Soy EL FANTASMA 👻 — analizo perfecto pero no ejecuto. ¿Cuál es tu ADN? Descubrilo en",
  },
  {
    id: "fomo",
    name: "EL FOMERO",
    emoji: "🔥",
    color: "#ff6d00",
    tagline: "El mercado te caza porque siempre llegás tarde al fuego",
    description: "Entrás cuando el movimiento ya pasó la mitad. Comprás los picos, vendés los pisos. No es mala suerte — es un patrón que se repite porque FOMO no es emoción, es hábito.",
    fatalFlaw: "Comprar ATH pensando que es el inicio. El mercado vive de gente como vos en esas entradas.",
    superpower: "Identificás los movimientos grandes rápido — el problema es cuándo entrás, no qué ves.",
    marketSees: "Liquidez fresca al final del movimiento. El mercado diseña candles de FOMO para atraerte.",
    fix: "Regla de oro: si ya subió 5%+, NO entrás. Esperás el retroceso o el próximo setup.",
    shareText: "Soy EL FOMERO 🔥 — el mercado me caza en cada pico. ¿Cuál es tu ADN? Descubrilo en",
  },
  {
    id: "revenge",
    name: "EL KAMIKAZE",
    emoji: "💀",
    color: "#ff1744",
    tagline: "Tu mayor enemigo en el mercado sos vos mismo",
    description: "Las emociones controlan cada decisión. Cuando perdés, querés recuperar. Cuando ganás, querés más. El mercado es un espejo de tu psicología y lo que refleja es caos.",
    fatalFlaw: "Revenge trading. Después de perder, entrás con posición más grande — y perdés el doble.",
    superpower: "Agresividad. Si la controlaras, serías formidable. Los mejores traders también son agresivos, pero con disciplina.",
    marketSees: "Una billetera con emociones. El mercado literalmente usa tu historial psicológico para atraparte.",
    fix: "STOP después de 2 losses seguidos. Sin excepciones. Volvés mañana. Eso solo puede doblar tu cuenta en 6 meses.",
    shareText: "Soy EL KAMIKAZE 💀 — mis emociones destruyen mis trades. ¿Cuál es tu ADN? Descubrilo en",
  },
  {
    id: "systematic",
    name: "EL SISTEMÁTICO",
    emoji: "🤖",
    color: "#e040fb",
    tagline: "Tenés el sistema, falta la confianza",
    description: "Estudiás, tenés reglas, usás indicadores. Pero cuando el sistema dice una cosa y tu intuición dice otra, dudás. La inconstancia en la ejecución arruina un sistema que sería ganador.",
    fatalFlaw: "Sobreoptimizan el sistema pero nunca lo ejecutan igual dos veces.",
    superpower: "Estructura. Tenés lo que la mayoría no tiene: un plan. Solo falta ejecutarlo con consistencia.",
    marketSees: "Un trader con sistema pero sin confianza en él. Es fácil moverte con noticias y opiniones.",
    fix: "Backtesteá tu sistema 100 trades. Ver que funciona en datos históricos elimina la duda en tiempo real.",
    shareText: "Soy EL SISTEMÁTICO 🤖 — tengo el sistema pero le falta confianza. ¿Cuál es tu ADN? Descubrilo en",
  },
];

function calcProfile(answers: Record<string, string>): Profile {
  const scores: Record<string, number> = {
    disciplina: 0, paciencia: 0, control: 0, esperanza: 0,
    riesgo: 0, fomo: 0, emocional: 0, agresividad: 0,
    sistemático: 0, soberbia: 0, independiente: 0, influenciable: 0,
  };

  Object.entries(answers).forEach(([qId, val]) => {
    const q = QUESTIONS.find(q => q.id === qId);
    const opt = q?.options.find(o => o.value === val);
    if (opt) {
      Object.entries(opt.score).forEach(([k, v]) => {
        scores[k] = (scores[k] ?? 0) + v;
      });
    }
  });

  const disciplina = scores.disciplina ?? 0;
  const paciencia  = scores.paciencia ?? 0;
  const control    = scores.control ?? 0;
  const fomo       = scores.fomo ?? 0;
  const emocional  = scores.emocional ?? 0;
  const sistematico = scores.sistemático ?? 0;

  if (disciplina >= 8 && paciencia >= 6) return PROFILES[0]; // predador
  if (sistematico >= 6 && disciplina >= 4 && paciencia < 4) return PROFILES[4]; // sistemático
  if (fomo >= 7) return PROFILES[2]; // fomero
  if (emocional >= 6 || (scores.riesgo ?? 0) >= 7) return PROFILES[3]; // kamikaze
  if (disciplina < 3 && paciencia >= 4) return PROFILES[1]; // ghost
  if (disciplina >= 5) return PROFILES[0]; // predador
  return PROFILES[3]; // default kamikaze
}

function AdnTraderGate() {
  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani flex flex-col">
      <SiteNav />
      <div className="flex-1 flex items-center justify-center px-6 pt-20">
        <div className="border border-[#1a2535] bg-[#060a0f] p-10 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#e040fb] to-transparent" />
          <div className="text-5xl mb-5">🧬</div>
          <div className="font-sharetech text-[9px] tracking-[0.4em] text-[#e040fb] mb-3">ACCESO RESTRINGIDO</div>
          <div className="font-bebas text-3xl text-white mb-2">ADN DEL TRADER</div>
          <div className="font-space text-[12px] text-[#7a9aaa] mb-6 leading-relaxed">
            El perfilador psicológico de trading está disponible para miembros con plan
            <span className="text-[#e040fb] font-bold"> Básico</span> o superior.
          </div>
          <div className="border border-[#e040fb22] bg-[#020408] px-5 py-4 mb-6 text-left">
            <div className="font-sharetech text-[10px] tracking-[0.2em] text-[#e040fb] mb-3">⬡ INCLUÍDO DESDE $9/mes</div>
            <div className="space-y-1.5">
              {["Test de 8 preguntas con resultado inmediato","Descubrí tu arquetipo: Predador, Kamikaze, Fantasma y más","Análisis de tus fortalezas y debilidades psicológicas","Recomendaciones personalizadas por perfil","Basado en psicología del riesgo real"].map(f => (
                <div key={f} className="flex items-center gap-2 font-space text-[11px] text-[#8a9ab0]">
                  <span className="text-[#e040fb] text-[9px]">✦</span> {f}
                </div>
              ))}
            </div>
          </div>
          <a href="/pricing" className="block w-full py-3 bg-[#e040fb] text-[#020408] font-space text-[12px] font-bold tracking-[0.2em] uppercase text-center no-underline hover:bg-white transition-colors">
            VER PLANES →
          </a>
          <div className="mt-4 font-space text-[10px] text-[#5a8898]">
            ¿Ya sos miembro? <a href="/login" className="text-[#e040fb] hover:underline">Iniciá sesión</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdnTrader() {
  const auth = (() => { try { return JSON.parse(localStorage.getItem("psyko_auth") ?? "null") as { role?: string; plan?: string } | null; } catch { return null; } })();
  const isAllowed = ["aprendiz","educacion","trader","institucional"].includes(auth?.plan ?? "") || auth?.role === "superadmin" || auth?.role === "operator";
  if (!isAllowed) return <AdnTraderGate />;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<Profile | null>(null);
  const [animating, setAnimating] = useState(false);

  const q = QUESTIONS[current];
  const answered = Object.keys(answers).length;
  const progress = (answered / QUESTIONS.length) * 100;

  function answer(val: string) {
    const newAnswers = { ...answers, [q.id]: val };
    setAnswers(newAnswers);
    if (current < QUESTIONS.length - 1) {
      setAnimating(true);
      setTimeout(() => { setCurrent(current + 1); setAnimating(false); }, 200);
    } else {
      setResult(calcProfile(newAnswers));
    }
  }

  function restart() {
    setAnswers({});
    setCurrent(0);
    setResult(null);
  }

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />
      <div className="pt-28 pb-20 px-4 md:px-10 max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="font-space text-[10px] text-[#e040fb] tracking-[0.4em] uppercase mb-3">
            🧬 PERFIL PSICOLÓGICO
          </div>
          <h1 className="font-bebas text-6xl md:text-7xl leading-none mb-3">
            ADN DEL<br /><span className="text-[#e040fb]">TRADER</span>
          </h1>
          <p className="font-space text-[12px] text-[#7ab3c8] leading-relaxed">
            8 preguntas. Sin trampa. El sistema lee tu patrón real.<br />
            El mercado ya sabe quién sos — ¿lo sabés vos?
          </p>
        </div>

        {!result ? (
          <div>
            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between font-space text-[10px] text-[#7ab3c8] mb-2">
                <span>Pregunta {current + 1} de {QUESTIONS.length}</span>
                <span style={{ color: "#e040fb" }}>{Math.round(progress)}% completado</span>
              </div>
              <div className="h-1 bg-[#1a2535] rounded-full overflow-hidden">
                <div className="h-full bg-[#e040fb] transition-all duration-500 rounded-full"
                  style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Question */}
            <div className={`transition-opacity duration-200 ${animating ? "opacity-0" : "opacity-100"}`}>
              <div className="border border-[#e040fb22] bg-[#0d0515] p-8 mb-4">
                <div className="font-space text-[10px] text-[#e040fb] tracking-[0.2em] uppercase mb-4">
                  ESCENARIO {current + 1}
                </div>
                <p className="font-bebas text-3xl md:text-4xl text-white leading-tight mb-8">
                  {q.text}
                </p>
                <div className="space-y-3">
                  {q.options.map(opt => (
                    <button key={opt.value} onClick={() => answer(opt.value)}
                      className="w-full text-left p-4 border border-[#1a2535] font-space text-[13px] text-[#7a9aaa] hover:border-[#e040fb55] hover:text-white hover:bg-[#e040fb08] transition-all">
                      <span className="text-[#e040fb] mr-3 font-bold">{opt.value.toUpperCase()})</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-center font-space text-[10px] text-[#5a8898]">
                Respondé con honestidad — el sistema detecta cuando intentás verse mejor de lo que sos
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Result card */}
            <div className="border-2 p-8 text-center relative overflow-hidden"
              style={{ borderColor: result.color, background: `${result.color}08` }}>
              <div className="text-7xl mb-4">{result.emoji}</div>
              <div className="font-space text-[10px] tracking-[0.4em] uppercase mb-2" style={{ color: result.color }}>
                TU ADN DE TRADER
              </div>
              <div className="font-bebas text-5xl md:text-6xl mb-3" style={{ color: result.color }}>
                {result.name}
              </div>
              <p className="font-space text-[14px] italic text-white mb-2">
                "{result.tagline}"
              </p>
              <p className="font-space text-[12px] text-[#7a9aaa] leading-relaxed">
                {result.description}
              </p>
            </div>

            {/* DNA breakdown */}
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "💀 DEBILIDAD FATAL",   text: result.fatalFlaw,   color: "#ff1744" },
                { label: "⚡ TU SUPERPODER",      text: result.superpower,  color: "#00e676" },
                { label: "🎯 QUÉ VE EL MERCADO", text: result.marketSees,  color: "#ffd700" },
                { label: "🔧 CÓMO ARREGLARLO",   text: result.fix,         color: "#00e5ff" },
              ].map(item => (
                <div key={item.label} className="border p-5" style={{ borderColor: `${item.color}33`, background: `${item.color}06` }}>
                  <div className="font-space text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: item.color }}>{item.label}</div>
                  <p className="font-space text-[13px] text-[#c0d8e8] leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>

            {/* Share */}
            <div className="border border-[#1a2535] bg-[#060a0f] p-6 text-center">
              <div className="font-space text-[10px] text-[#7ab3c8] tracking-[0.2em] uppercase mb-3">🚀 COMPARTÍ TU RESULTADO</div>
              <p className="font-space text-[12px] text-[#7a9aaa] mb-4">
                "{result.shareText} psychometriks.trade/adn-trader"
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${result.shareText} psychometriks.trade/adn-trader`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="font-space text-[11px] font-bold tracking-[0.15em] uppercase px-5 py-2.5 bg-[#1da1f2] text-white no-underline hover:bg-[#1890db] transition-colors">
                  TWITTER / X →
                </a>
                <button onClick={() => {
                  void navigator.clipboard.writeText(`${result.shareText} psychometriks.trade/adn-trader`);
                }}
                  className="font-space text-[11px] font-bold tracking-[0.15em] uppercase px-5 py-2.5 border border-[#1a2535] text-[#7ab3c8] hover:border-[#00e5ff33] hover:text-[#00e5ff] transition-all">
                  COPIAR TEXTO
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button onClick={restart}
                className="py-4 font-space text-[11px] font-bold tracking-[0.2em] uppercase border border-[#1a2535] text-[#7ab3c8] hover:border-[#e040fb33] hover:text-[#e040fb] transition-all">
                ← HACER DE NUEVO
              </button>
              <Link href="/pre-entry"
                className="py-4 font-space text-[11px] font-bold tracking-[0.2em] uppercase border border-[#00e5ff33] text-[#00e5ff] hover:bg-[#00e5ff10] transition-all text-center no-underline flex items-center justify-center">
                ⚡ ANALIZAR MI PRÓXIMO TRADE
              </Link>
              <Link href="/pricing"
                className="py-4 font-space text-[11px] font-bold tracking-[0.2em] uppercase bg-[#e040fb] text-[#020408] hover:bg-[#ce35e0] transition-all text-center no-underline flex items-center justify-center">
                MEJORAR MI TRADING →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
