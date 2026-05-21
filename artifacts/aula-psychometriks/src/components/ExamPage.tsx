import React, { useState, useEffect, useRef, useCallback } from "react";
import { User } from "../auth/types";
import {
  EXAM_QUESTIONS, EXAM_MODES, getQuestionsForMode,
  type ExamQuestion, type ExamConfig, type ExamMode,
} from "../data/examQuestions";
import { saveExamResult, getExamHistory, type ExamResult } from "../auth/examHistory";
import { LEVEL_META } from "../data/modules";

interface ExamPageProps { currentUser: User; initialMode?: ExamMode; }

type ExamPhase = "select" | "exam" | "result" | "history";

export function ExamPage({ currentUser, initialMode }: ExamPageProps) {
  const [phase, setPhase] = useState<ExamPhase>("select");
  const [config, setConfig] = useState<ExamConfig | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [lastResult, setLastResult] = useState<ExamResult | null>(null);
  const [history, setHistory] = useState<ExamResult[]>([]);
  const [historyFilter, setHistoryFilter] = useState<ExamMode | "ALL">("ALL");
  const [showShareCard, setShowShareCard] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showCertPayment, setShowCertPayment] = useState(false);
  const [certUnlocked, setCertUnlocked] = useState(false);
  const [certStep, setCertStep] = useState<"select" | "crypto" | "binance">("select");
  const [showCertPrint, setShowCertPrint] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const CERT_PRICE_USD = 15;
  const PSY_WALLET = "0xd255a2Ab2Cdd0ECbA857214EF2400697d402af00";
  const TELEGRAM = "https://t.me/psychometriks_pro";

  useEffect(() => {
    if (phase === "history") {
      setHistory(getExamHistory(currentUser.id));
    }
  }, [phase, currentUser.id]);

  useEffect(() => {
    if (initialMode) {
      const cfg = EXAM_MODES.find(m => m.mode === initialMode);
      if (cfg) startExam(cfg);
    }
  }, [initialMode]);

  const startTimer = useCallback(() => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const startExam = (cfg: ExamConfig) => {
    const qs = getQuestionsForMode(cfg.mode, cfg.questionCount);
    setConfig(cfg);
    setQuestions(qs);
    setQIdx(0);
    setAnswers([]);
    setSelected(null);
    setRevealed(false);
    startTimer();
    setPhase("exam");
  };

  const handleAnswer = (optIdx: number) => {
    if (revealed) return;
    setSelected(optIdx);
    setRevealed(true);
  };

  const handleNext = () => {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    if (qIdx + 1 >= questions.length) {
      stopTimer();
      const correct = newAnswers.filter((a, i) => a === questions[i].correct).length;
      const pct = Math.round(correct / questions.length * 100);
      const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : "D";
      const result: ExamResult = {
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        userId: currentUser.id,
        mode: config!.mode,
        modeLabel: config!.label,
        correct, total: questions.length, pct, grade,
        durationSeconds: elapsed,
        date: new Date().toISOString(),
        questionIds: questions.map(q => q.id),
        answerMap: Object.fromEntries(questions.map((q, i) => [q.id, newAnswers[i]])),
      };
      saveExamResult(result);
      setLastResult(result);
      setAnswers(newAnswers);
      setPhase("result");
    } else {
      setAnswers(newAnswers);
      setQIdx(i => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const gradeColor = (g: string) =>
    g === "A+" ? "#ffd700" : g === "A" ? "#00e676" : g === "B" ? "#00e5ff" : g === "C" ? "#ff9800" : "#ff1744";

  const pctColor = (pct: number) =>
    pct >= 90 ? "#ffd700" : pct >= 75 ? "#00e676" : pct >= 60 ? "#00e5ff" : pct >= 40 ? "#ff9800" : "#ff1744";

  // ─── SELECT PHASE ──────────────────────────────────────────────────
  if (phase === "select") {
    const totalQs = EXAM_QUESTIONS.length;
    return (
      <div style={{ padding: "40px 36px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, letterSpacing: 5, color: "var(--cyan)", marginBottom: 8 }}>
            PSYCHOMETRIKS ACADEMY
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, letterSpacing: 5, color: "var(--text)", marginBottom: 12, lineHeight: 1 }}>
            EVALÚA TUS CONOCIMIENTOS
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 15, maxWidth: 600, lineHeight: 1.7 }}>
            Banco de {totalQs}+ preguntas distribuidas en 8 niveles. Seleccioná el modo de examen, completá las preguntas y al finalizar obtendrás tu resultado con historial permanente.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 6, padding: "16px 24px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 24, color: "var(--cyan)", fontWeight: 700 }}>{totalQs}+</div>
            <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, fontFamily: "'Share Tech Mono',monospace", marginTop: 4 }}>PREGUNTAS</div>
          </div>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 6, padding: "16px 24px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 24, color: "#00e676", fontWeight: 700 }}>8</div>
            <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, fontFamily: "'Share Tech Mono',monospace", marginTop: 4 }}>NIVELES</div>
          </div>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 6, padding: "16px 24px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 24, color: "#ffd700", fontWeight: 700 }}>{getExamHistory(currentUser.id).length}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, fontFamily: "'Share Tech Mono',monospace", marginTop: 4 }}>EXÁMENES</div>
          </div>
          <button
            onClick={() => setPhase("history")}
            style={{
              marginLeft: "auto", background: "rgba(0,229,255,0.07)", border: "1px solid rgba(0,229,255,0.25)",
              color: "var(--cyan)", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2,
              padding: "12px 20px", borderRadius: 4, cursor: "pointer",
            }}
          >
            📋 HISTORIAL
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {EXAM_MODES.map(cfg => {
            const levelMeta = cfg.mode !== "GENERAL" ? LEVEL_META[cfg.mode as keyof typeof LEVEL_META] : null;
            return (
              <button
                key={cfg.mode}
                onClick={() => startExam(cfg)}
                style={{
                  background: "var(--bg2)", border: `1px solid ${cfg.color}33`,
                  borderRadius: 8, padding: "20px 22px", cursor: "pointer",
                  textAlign: "left", transition: "all 0.2s", display: "flex", flexDirection: "column", gap: 10,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = cfg.color;
                  (e.currentTarget as HTMLElement).style.background = `${cfg.color}0d`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${cfg.color}33`;
                  (e.currentTarget as HTMLElement).style.background = "var(--bg2)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {cfg.mode !== "GENERAL" && (
                    <span style={{
                      fontFamily: "'Share Tech Mono',monospace", fontSize: 10, padding: "2px 8px",
                      background: `${cfg.color}22`, border: `1px solid ${cfg.color}55`,
                      color: cfg.color, letterSpacing: 1,
                    }}>{cfg.mode}</span>
                  )}
                  {cfg.mode === "GENERAL" && (
                    <span style={{
                      fontFamily: "'Share Tech Mono',monospace", fontSize: 10, padding: "2px 8px",
                      background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.4)",
                      color: "#00e5ff", letterSpacing: 1,
                    }}>🌐 ALL</span>
                  )}
                  <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Share Tech Mono',monospace" }}>
                    {cfg.questionCount} PREGUNTAS
                  </span>
                </div>
                <div>
                  <div style={{
                    fontFamily: "'Orbitron',monospace", fontSize: 12, letterSpacing: 2,
                    color: cfg.color, marginBottom: 4,
                  }}>
                    {cfg.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                    {levelMeta?.desc || cfg.description}
                  </div>
                </div>
                <div style={{
                  fontFamily: "'Share Tech Mono',monospace", fontSize: 10,
                  color: cfg.color, opacity: 0.7,
                }}>
                  INICIAR EXAMEN →
                </div>
              </button>
            );
          })}
        </div>

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        `}</style>
      </div>
    );
  }

  // ─── EXAM PHASE ─────────────────────────────────────────────────────
  if (phase === "exam" && questions.length > 0) {
    const q = questions[qIdx];
    const progress = qIdx / questions.length;
    const cfg = config!;
    return (
      <div style={{ padding: "32px 36px", maxWidth: 820, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <button
            onClick={() => { stopTimer(); setPhase("select"); }}
            style={{
              background: "none", border: "1px solid var(--border)", color: "var(--muted)",
              fontFamily: "'Share Tech Mono',monospace", fontSize: 11, letterSpacing: 1,
              padding: "6px 12px", borderRadius: 3, cursor: "pointer",
            }}
          >← SALIR</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 3, color: cfg.color }}>
              {cfg.label}
            </div>
          </div>
          <div style={{
            fontFamily: "'Share Tech Mono',monospace", fontSize: 18, color: "var(--cyan)",
            background: "rgba(0,229,255,0.07)", border: "1px solid rgba(0,229,255,0.2)",
            padding: "4px 14px", borderRadius: 4, letterSpacing: 2,
          }}>
            {formatTime(elapsed)}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "var(--muted)" }}>
              PREGUNTA {qIdx + 1} / {questions.length}
            </span>
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: cfg.color }}>
              {answers.filter((a, i) => a === questions[i].correct).length} CORRECTAS
            </span>
          </div>
          <div style={{ height: 4, background: "var(--bg2)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress * 100}%`, background: cfg.color, transition: "width 0.4s", borderRadius: 2 }} />
          </div>
          {/* Dot indicators */}
          <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
            {questions.map((_, i) => {
              let bg = "var(--bg2)";
              if (i < answers.length) bg = answers[i] === questions[i].correct ? "#00e676" : "#ff1744";
              else if (i === qIdx) bg = cfg.color;
              return <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: bg, border: `1px solid ${bg === "var(--bg2)" ? "var(--border)" : bg}`, transition: "all 0.2s" }} />;
            })}
          </div>
        </div>

        {/* Question level badge */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <span style={{
            fontFamily: "'Share Tech Mono',monospace", fontSize: 9, padding: "2px 8px",
            background: `${LEVEL_META[q.level].color}22`, border: `1px solid ${LEVEL_META[q.level].color}44`,
            color: LEVEL_META[q.level].color, letterSpacing: 1,
          }}>{q.level}</span>
          <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Share Tech Mono',monospace" }}>
            {q.module}
          </span>
        </div>

        {/* Question */}
        <div style={{
          background: "var(--bg2)", border: `1px solid ${cfg.color}33`,
          borderRadius: 8, padding: "28px 28px", marginBottom: 20,
        }}>
          <p style={{
            fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 19,
            color: "var(--text)", lineHeight: 1.5, margin: 0,
          }}>
            {q.q}
          </p>
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {q.opts.map((opt, i) => {
            let border = "1px solid var(--border)";
            let bg = "var(--bg2)";
            let color = "var(--text)";
            let cursor = "pointer";
            if (revealed) {
              if (i === q.correct) { bg = "rgba(0,230,118,0.12)"; border = "1px solid #00e676"; color = "#00e676"; }
              else if (i === selected && i !== q.correct) { bg = "rgba(255,23,68,0.1)"; border = "1px solid #ff1744"; color = "#ff5252"; }
              cursor = "default";
            } else if (i === selected) {
              bg = `${cfg.color}18`; border = `1px solid ${cfg.color}`;
            }
            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                style={{
                  background: bg, border, borderRadius: 6, padding: "14px 20px",
                  cursor, textAlign: "left", transition: "all 0.15s",
                  fontFamily: "'Rajdhani',sans-serif", fontWeight: 500, fontSize: 15,
                  color, display: "flex", alignItems: "center", gap: 14,
                }}
              >
                <span style={{
                  fontFamily: "'Share Tech Mono',monospace", fontSize: 11,
                  color: revealed && i === q.correct ? "#00e676" : revealed && i === selected ? "#ff1744" : "var(--muted)",
                  flexShrink: 0, width: 20,
                }}>
                  {["A","B","C","D"][i]}
                </span>
                <span>{opt}</span>
                {revealed && i === q.correct && <span style={{ marginLeft: "auto", flexShrink: 0 }}>✅</span>}
                {revealed && i === selected && i !== q.correct && <span style={{ marginLeft: "auto", flexShrink: 0 }}>❌</span>}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {revealed && (
          <div style={{
            background: "rgba(0,229,255,0.05)", border: "1px solid rgba(0,229,255,0.2)",
            borderRadius: 6, padding: "14px 18px", marginBottom: 20,
            fontFamily: "'Rajdhani',sans-serif", fontSize: 14, color: "var(--muted)", lineHeight: 1.6,
          }}>
            <span style={{ color: "var(--cyan)", fontWeight: 700, marginRight: 8, fontSize: 12, fontFamily: "'Orbitron',monospace", letterSpacing: 1 }}>
              EXPLICACIÓN:
            </span>
            {q.explanation}
          </div>
        )}

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={!revealed}
          style={{
            width: "100%", padding: "14px", background: revealed ? cfg.color : "var(--bg2)",
            border: `1px solid ${revealed ? cfg.color : "var(--border)"}`,
            borderRadius: 4, cursor: revealed ? "pointer" : "not-allowed",
            color: revealed ? "#060a0f" : "var(--muted)", fontFamily: "'Orbitron',monospace",
            fontSize: 12, letterSpacing: 3, fontWeight: 700, transition: "all 0.2s",
          }}
        >
          {qIdx + 1 >= questions.length ? "VER RESULTADO →" : "SIGUIENTE PREGUNTA →"}
        </button>
      </div>
    );
  }

  // ─── RESULT PHASE ────────────────────────────────────────────────────
  if (phase === "result" && lastResult && config) {
    const { correct, total, pct, grade, durationSeconds } = lastResult;
    const color = pctColor(pct);
    const gColor = gradeColor(grade);
    const circumference = 326.7;
    const offset = circumference - (pct / 100) * circumference;

    return (
      <>
      <div style={{ padding: "40px 36px", maxWidth: 860, margin: "0 auto" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, letterSpacing: 5, color: "var(--cyan)", marginBottom: 8 }}>
            RESULTADO DEL EXAMEN
          </div>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, letterSpacing: 3, color: config.color }}>
            {config.label}
          </div>
        </div>

        {/* Score ring + stats row */}
        <div style={{ display: "flex", gap: 32, alignItems: "center", justifyContent: "center", flexWrap: "wrap", marginBottom: 36 }}>
          {/* Ring */}
          <div style={{ position: "relative", width: 160, height: 160, flexShrink: 0 }}>
            <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="80" cy="80" r="52" fill="none" stroke="#1a2a3a" strokeWidth="14" />
              <circle
                cx="80" cy="80" r="52" fill="none"
                stroke={color} strokeWidth="14" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1.2s ease" }}
              />
            </svg>
            <div style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 26, color, fontWeight: 700 }}>{pct}%</span>
              <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{correct}/{total}</span>
            </div>
          </div>

          {/* Grade + stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 200 }}>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 52, color: gColor, lineHeight: 1, fontWeight: 700 }}>{grade}</div>
                <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, fontFamily: "'Share Tech Mono',monospace" }}>CALIFICACIÓN</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "CORRECTAS", val: `${correct}/${total}`, c: color },
                  { label: "TIEMPO", val: formatTime(durationSeconds), c: "var(--cyan)" },
                  { label: "MODO", val: lastResult.mode, c: config.color },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, color: s.c, fontWeight: 700 }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 2, fontFamily: "'Share Tech Mono',monospace" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              fontFamily: "'Rajdhani',sans-serif", fontSize: 15, color: color,
              fontWeight: 600, lineHeight: 1.4,
            }}>
              {pct >= 90 ? "🏆 Excelente — dominás este nivel completamente."
                : pct >= 75 ? "⚡ Muy bien — base sólida. Repasá los errores."
                : pct >= 60 ? "📊 Bien — hay conceptos para reforzar."
                : pct >= 40 ? "📖 En progreso — volvé al módulo correspondiente."
                : "🔄 Necesitás repasar los fundamentos de este nivel."}
            </div>
          </div>
        </div>

        {/* Per-question breakdown */}
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: 8, padding: "22px 24px", marginBottom: 24,
        }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 3, color: "var(--cyan)", marginBottom: 16 }}>
            DESGLOSE POR PREGUNTA
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {questions.map((q, i) => {
              const ans = answers[i];
              const ok = ans === q.correct;
              return (
                <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    fontFamily: "'Share Tech Mono',monospace", fontSize: 10,
                    color: "var(--muted)", width: 24, flexShrink: 0,
                  }}>P{i + 1}</span>
                  <span style={{
                    fontSize: 9, padding: "1px 6px",
                    background: `${LEVEL_META[q.level].color}22`,
                    border: `1px solid ${LEVEL_META[q.level].color}44`,
                    color: LEVEL_META[q.level].color, fontFamily: "'Share Tech Mono',monospace",
                    flexShrink: 0, letterSpacing: 0.5,
                  }}>{q.level}</span>
                  <div style={{ flex: 1, height: 8, background: "#1a2a3a", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: ok ? "100%" : "20%",
                      background: ok ? "#00e676" : "#ff1744",
                      borderRadius: 4, transition: "width 0.8s ease",
                    }} />
                  </div>
                  <span style={{ fontSize: 12, flexShrink: 0 }}>{ok ? "✅" : "❌"}</span>
                  <span style={{
                    fontSize: 11, color: "var(--muted)", maxWidth: 280,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    fontFamily: "'Rajdhani',sans-serif",
                  }} title={q.q}>{q.q}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incorrect answers detail */}
        {questions.some((_, i) => answers[i] !== questions[i].correct) && (
          <div style={{
            background: "rgba(255,23,68,0.04)", border: "1px solid rgba(255,23,68,0.2)",
            borderRadius: 8, padding: "22px 24px", marginBottom: 24,
          }}>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 3, color: "#ff1744", marginBottom: 16 }}>
              REVISIÓN DE ERRORES
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {questions.filter((_, i) => answers[i] !== questions[i].correct).map((q, idx) => (
                <div key={q.id} style={{ borderLeft: "2px solid rgba(255,23,68,0.4)", paddingLeft: 14 }}>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text)", marginBottom: 6 }}>
                    {q.q}
                  </div>
                  <div style={{ fontSize: 12, color: "#ff5252", marginBottom: 4 }}>
                    ❌ Tu respuesta: {q.opts[answers[questions.indexOf(q)]]}
                  </div>
                  <div style={{ fontSize: 12, color: "#00e676", marginBottom: 6 }}>
                    ✅ Correcta: {q.opts[q.correct]}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                    💡 {q.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {/* Certificate button — available for passing grades */}
          {pct >= 60 && (
            <button
              onClick={() => certUnlocked ? setShowCertPrint(true) : setShowCertPayment(true)}
              style={{
                flex: 1, padding: "13px 24px",
                background: certUnlocked ? "rgba(255,215,0,0.18)" : "rgba(255,215,0,0.08)",
                border: `1px solid ${certUnlocked ? "#ffd700" : "#ffd70044"}`,
                borderRadius: 4, cursor: "pointer",
                color: "#ffd700", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2,
              }}
            >
              {certUnlocked ? "🎓 IMPRIMIR CERTIFICADO" : "🎓 OBTENER CERTIFICADO"}
            </button>
          )}
          <button
            onClick={() => setShowShareCard(true)}
            style={{
              flex: 1, padding: "13px 24px", background: "rgba(124,77,255,0.12)",
              border: "1px solid rgba(124,77,255,0.5)", borderRadius: 4, cursor: "pointer",
              color: "#7c4dff", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2,
            }}
          >
            📤 COMPARTIR
          </button>
          <button
            onClick={() => config && startExam(config)}
            style={{
              flex: 1, padding: "13px 24px", background: `${config.color}18`,
              border: `1px solid ${config.color}55`, borderRadius: 4, cursor: "pointer",
              color: config.color, fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2,
            }}
          >
            🔄 REPETIR
          </button>
          <button
            onClick={() => setPhase("select")}
            style={{
              flex: 1, padding: "13px 24px", background: "rgba(0,229,255,0.08)",
              border: "1px solid rgba(0,229,255,0.3)", borderRadius: 4, cursor: "pointer",
              color: "var(--cyan)", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2,
            }}
          >
            ← NUEVO EXAMEN
          </button>
          <button
            onClick={() => setPhase("history")}
            style={{
              flex: 1, padding: "13px 24px", background: "rgba(0,0,0,0.2)",
              border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer",
              color: "var(--muted)", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2,
            }}
          >
            📋 HISTORIAL
          </button>
        </div>
      </div>

      {/* ── SHARE CARD MODAL ── */}
      {showShareCard && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24,
        }} onClick={() => setShowShareCard(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480 }}>
            {/* The shareable card */}
            <div id="share-card" style={{
              background: "linear-gradient(135deg, #060a0f 0%, #0d1a2a 100%)",
              border: `2px solid ${pctColor(pct)}55`,
              borderRadius: 16, padding: "36px 40px",
              position: "relative", overflow: "hidden",
            }}>
              {/* Background glow */}
              <div style={{
                position: "absolute", top: -60, right: -60, width: 220, height: 220,
                background: `radial-gradient(circle, ${pctColor(pct)}18, transparent 70%)`,
                pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", bottom: -40, left: -40, width: 160, height: 160,
                background: "radial-gradient(circle, rgba(0,229,255,0.06), transparent 70%)",
                pointerEvents: "none",
              }} />

              {/* Brand header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
                <div>
                  <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 14, letterSpacing: 4, color: "#00e5ff", fontWeight: 700 }}>
                    PSYCHOMETRIKS
                  </div>
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, letterSpacing: 3, color: "#2a5a6a", marginTop: 3 }}>
                    AULA VIRTUAL · TRADING ACADEMY
                  </div>
                </div>
                <div style={{
                  fontFamily: "'Share Tech Mono',monospace", fontSize: 10,
                  padding: "3px 10px", border: "1px solid rgba(0,229,255,0.3)",
                  color: "#00e5ff", background: "rgba(0,229,255,0.06)", borderRadius: 3,
                }}>
                  {new Date(lastResult.date).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                </div>
              </div>

              {/* Score display */}
              <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 24 }}>
                {/* Ring */}
                <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
                  <svg width="110" height="110" viewBox="0 0 110 110" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="55" cy="55" r="44" fill="none" stroke="#1a2a3a" strokeWidth="10" />
                    <circle cx="55" cy="55" r="44" fill="none" stroke={pctColor(pct)} strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={276.46}
                      strokeDashoffset={276.46 - (pct / 100) * 276.46} />
                  </svg>
                  <div style={{
                    position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, color: pctColor(pct), fontWeight: 700, lineHeight: 1 }}>{pct}%</span>
                    <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{correct}/{total}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 56, color: pctColor(pct), lineHeight: 1, fontWeight: 900 }}>{grade}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, fontFamily: "'Share Tech Mono',monospace", marginTop: 4 }}>CALIFICACIÓN</div>
                </div>
              </div>

              {/* Details row */}
              <div style={{ display: "flex", gap: 0, borderTop: "1px solid #1a2a3a", paddingTop: 18, marginBottom: 18 }}>
                {[
                  { label: "EXAMEN", val: config.label.replace(/^N\d — /, "") },
                  { label: "NIVEL", val: lastResult.mode },
                  { label: "TIEMPO", val: formatTime(durationSeconds) },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, paddingLeft: i > 0 ? 16 : 0, borderLeft: i > 0 ? "1px solid #1a2a3a" : "none", marginLeft: i > 0 ? 16 : 0 }}>
                    <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "var(--muted)", letterSpacing: 2, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* User + message */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "var(--muted)", letterSpacing: 2, marginBottom: 3 }}>TRADER</div>
                  <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, color: "#00e5ff", letterSpacing: 1 }}>
                    {currentUser.displayName || currentUser.username}
                  </div>
                </div>
                <div style={{ textAlign: "right", maxWidth: 160 }}>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: pctColor(pct), lineHeight: 1.3 }}>
                    {pct >= 90 ? "🏆 Dominio total del nivel"
                      : pct >= 75 ? "⚡ Base sólida — ¡Muy bien!"
                      : pct >= 60 ? "📊 En progreso — seguí adelante"
                      : "📖 En aprendizaje — no te rindas"}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid #1a2a3a", textAlign: "center" }}>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#2a4a5a", letterSpacing: 2 }}>
                  psychometriks.app · AULA VIRTUAL
                </div>
              </div>
            </div>

            {/* Controls */}
            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  const url = `${window.location.href.split("#")[0]}#test-${lastResult.mode}`;
                  navigator.clipboard.writeText(url).then(() => {
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 2000);
                  });
                }}
                style={{
                  flex: 1, padding: "11px 0", background: "rgba(124,77,255,0.15)",
                  border: "1px solid rgba(124,77,255,0.5)", borderRadius: 4, cursor: "pointer",
                  color: "#7c4dff", fontFamily: "'Orbitron',monospace", fontSize: 9, letterSpacing: 2,
                }}
              >{shareCopied ? "✓ ENLACE COPIADO" : "🔗 COPIAR ENLACE DEL TEST"}</button>
              <button
                onClick={() => setShowShareCard(false)}
                style={{
                  padding: "11px 20px", background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer",
                  color: "var(--muted)", fontFamily: "'Orbitron',monospace", fontSize: 9, letterSpacing: 2,
                }}
              >CERRAR</button>
            </div>
            <div style={{ textAlign: "center", marginTop: 10, fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "var(--muted)" }}>
              📸 Capturá esta pantalla para compartir en redes
            </div>
          </div>
        </div>
      )}

      {/* ── CERTIFICATE PAYMENT MODAL ── */}
      {showCertPayment && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1001, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setShowCertPayment(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, background: "#060a0f", border: "1px solid #ffd70044", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ height: 2, background: "linear-gradient(90deg, #ffd700, #00e5ff, #ffd700)" }} />
            <div style={{ padding: "28px 32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, letterSpacing: 4, color: "#ffd700", marginBottom: 6 }}>CERTIFICADO OFICIAL</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: "var(--text)", lineHeight: 1 }}>
                    PSYCHOMETRIKS<br /><span style={{ color: "#ffd700" }}>ACADEMY</span>
                  </div>
                </div>
                <button onClick={() => setShowCertPayment(false)} style={{ background: "none", border: "none", color: "#4a6070", cursor: "pointer", fontSize: 20 }}>✕</button>
              </div>

              <div style={{ background: "rgba(255,215,0,0.06)", border: "1px solid #ffd70022", borderRadius: 4, padding: "14px 16px", marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "var(--muted)" }}>Examen: {config?.label}</span>
                  <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, color: pct >= 90 ? "#ffd700" : pct >= 75 ? "#00e676" : "#00e5ff", fontWeight: 700 }}>{pct}% — {grade}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "var(--muted)" }}>Alumno: {currentUser.displayName ?? currentUser.username}</span>
                  <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 18, color: "#ffd700", fontWeight: 700 }}>${CERT_PRICE_USD} USD</span>
                </div>
              </div>

              {certStep === "select" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#4a6070", letterSpacing: 2, marginBottom: 4 }}>SELECCIONÁ TU MÉTODO DE PAGO:</div>
                  <button onClick={() => setCertStep("crypto")} style={{ padding: "14px 20px", background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.3)", borderRadius: 4, cursor: "pointer", color: "var(--cyan)", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2, textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 20 }}>⛓</span>
                    <div>
                      <div>TRANSFERENCIA CRYPTO</div>
                      <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#4a6070", marginTop: 2 }}>ETH, USDT, USDC — cualquier red</div>
                    </div>
                  </button>
                  <button onClick={() => setCertStep("binance")} style={{ padding: "14px 20px", background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: 4, cursor: "pointer", color: "#ffd700", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2, textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 20 }}>🔶</span>
                    <div>
                      <div>BINANCE PAY</div>
                      <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#4a6070", marginTop: 2 }}>Pago instantáneo desde Binance</div>
                    </div>
                  </button>
                  <a href={TELEGRAM} target="_blank" rel="noopener noreferrer" style={{ padding: "14px 20px", background: "rgba(34,158,217,0.08)", border: "1px solid rgba(34,158,217,0.3)", borderRadius: 4, cursor: "pointer", color: "#229ED9", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2, textAlign: "left", display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
                    <span style={{ fontSize: 20 }}>✈️</span>
                    <div>
                      <div>PAGAR POR TELEGRAM</div>
                      <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#4a6070", marginTop: 2 }}>Coordiná con el equipo directamente</div>
                    </div>
                  </a>
                </div>
              )}

              {certStep === "crypto" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <button onClick={() => setCertStep("select")} style={{ background: "none", border: "none", color: "#4a6070", cursor: "pointer", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, textAlign: "left", padding: 0, marginBottom: 4 }}>← volver</button>
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#4a6070", letterSpacing: 2 }}>WALLET DE DESTINO — ${CERT_PRICE_USD} USD EN CRYPTO:</div>
                  <div style={{ background: "#0a1520", border: "1px solid #1a2535", borderRadius: 4, padding: "12px 14px" }}>
                    <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "var(--cyan)", wordBreak: "break-all" }}>{PSY_WALLET}</div>
                    <button onClick={() => navigator.clipboard?.writeText(PSY_WALLET)} style={{ marginTop: 8, background: "none", border: "1px solid #1a2535", color: "#4a6070", fontFamily: "'Share Tech Mono',monospace", fontSize: 9, cursor: "pointer", padding: "3px 10px", borderRadius: 3 }}>📋 COPIAR</button>
                  </div>
                  <p style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#4a6070", lineHeight: 1.6, margin: 0 }}>
                    Enviá el equivalente a ${CERT_PRICE_USD} USD en ETH, USDT o USDC a esta dirección (cualquier red compatible).
                    Luego mandá el comprobante a Telegram y te enviamos el código del certificado.
                  </p>
                  <a href={TELEGRAM} target="_blank" rel="noopener noreferrer" style={{ display: "block", textAlign: "center", padding: "12px 0", background: "rgba(34,158,217,0.12)", border: "1px solid rgba(34,158,217,0.4)", borderRadius: 4, color: "#229ED9", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2, textDecoration: "none" }}>
                    ✈️ ENVIAR COMPROBANTE POR TELEGRAM →
                  </a>
                  <button onClick={() => { setCertUnlocked(true); setShowCertPayment(false); setShowCertPrint(true); }} style={{ padding: "11px 0", background: "rgba(255,215,0,0.1)", border: "1px solid #ffd70044", borderRadius: 4, cursor: "pointer", color: "#ffd700", fontFamily: "'Share Tech Mono',monospace", fontSize: 9, letterSpacing: 1 }}>
                    ✓ Ya pagué — VER CERTIFICADO
                  </button>
                </div>
              )}

              {certStep === "binance" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <button onClick={() => setCertStep("select")} style={{ background: "none", border: "none", color: "#4a6070", cursor: "pointer", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, textAlign: "left", padding: 0, marginBottom: 4 }}>← volver</button>
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#4a6070", letterSpacing: 2 }}>BINANCE PAY — ${CERT_PRICE_USD} USD:</div>
                  <div style={{ background: "#0a1520", border: "1px solid #ffd70022", borderRadius: 4, padding: "14px 16px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 28, color: "#ffd700", fontWeight: 700, letterSpacing: 2 }}>PSYMETRIKS</div>
                    <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#4a6070", marginTop: 4 }}>ID Binance Pay · Enviá exactamente ${CERT_PRICE_USD} USDT</div>
                  </div>
                  <p style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#4a6070", lineHeight: 1.6, margin: 0 }}>
                    Abrí Binance → Pay → Enviar → buscá <strong style={{ color: "#ffd700" }}>PSYMETRIKS</strong>. Enviá ${CERT_PRICE_USD} USDT.
                    Luego mandá el screenshot a Telegram y te enviamos el código.
                  </p>
                  <a href={TELEGRAM} target="_blank" rel="noopener noreferrer" style={{ display: "block", textAlign: "center", padding: "12px 0", background: "rgba(34,158,217,0.12)", border: "1px solid rgba(34,158,217,0.4)", borderRadius: 4, color: "#229ED9", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2, textDecoration: "none" }}>
                    ✈️ ENVIAR SCREENSHOT POR TELEGRAM →
                  </a>
                  <button onClick={() => { setCertUnlocked(true); setShowCertPayment(false); setShowCertPrint(true); }} style={{ padding: "11px 0", background: "rgba(255,215,0,0.1)", border: "1px solid #ffd70044", borderRadius: 4, cursor: "pointer", color: "#ffd700", fontFamily: "'Share Tech Mono',monospace", fontSize: 9, letterSpacing: 1 }}>
                    ✓ Ya pagué — VER CERTIFICADO
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CERTIFICATE PRINT VIEW ── */}
      {showCertPrint && lastResult && config && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1002, background: "rgba(0,0,0,0.95)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 700, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Controls */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => window.print()} style={{ padding: "10px 24px", background: "#ffd700", border: "none", borderRadius: 4, cursor: "pointer", color: "#020408", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2, fontWeight: 700 }}>
                🖨️ IMPRIMIR / GUARDAR PDF
              </button>
              <button onClick={() => setShowCertPrint(false)} style={{ padding: "10px 20px", background: "none", border: "1px solid #1a2535", borderRadius: 4, cursor: "pointer", color: "#4a6070", fontFamily: "'Share Tech Mono',monospace", fontSize: 10 }}>
                CERRAR
              </button>
            </div>

            {/* Certificate */}
            <div id="psyko-certificate" style={{
              background: "linear-gradient(135deg, #060a0f 0%, #0d1a2a 60%, #060810 100%)",
              border: "2px solid #ffd70044",
              borderRadius: 12, padding: "48px 56px",
              position: "relative", overflow: "hidden",
              boxShadow: "0 0 80px rgba(255,215,0,0.1), 0 0 40px rgba(0,229,255,0.05)",
            }}>
              {/* Corner ornaments */}
              <div style={{ position: "absolute", top: 12, left: 12, width: 40, height: 40, borderTop: "2px solid #ffd70066", borderLeft: "2px solid #ffd70066" }} />
              <div style={{ position: "absolute", top: 12, right: 12, width: 40, height: 40, borderTop: "2px solid #ffd70066", borderRight: "2px solid #ffd70066" }} />
              <div style={{ position: "absolute", bottom: 12, left: 12, width: 40, height: 40, borderBottom: "2px solid #ffd70066", borderLeft: "2px solid #ffd70066" }} />
              <div style={{ position: "absolute", bottom: 12, right: 12, width: 40, height: 40, borderBottom: "2px solid #ffd70066", borderRight: "2px solid #ffd70066" }} />
              {/* Background glow */}
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 400, height: 400, background: "radial-gradient(circle, rgba(255,215,0,0.04), transparent 70%)", pointerEvents: "none" }} />

              <div style={{ textAlign: "center", position: "relative" }}>
                {/* Brand */}
                <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, letterSpacing: 8, color: "#00e5ff", marginBottom: 4 }}>PSYCHOMETRIKS</div>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, letterSpacing: 4, color: "#2a5a6a", marginBottom: 28 }}>AULA VIRTUAL · TRADING ACADEMY</div>

                {/* Certificate title */}
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, letterSpacing: 4, color: "#ffd700", marginBottom: 12 }}>CERTIFICADO DE APROBACIÓN</div>
                <div style={{ width: 120, height: 1, background: "linear-gradient(90deg, transparent, #ffd700, transparent)", margin: "0 auto 24px" }} />

                {/* Student name */}
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "#4a6070", marginBottom: 8 }}>Se certifica que</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: "#ffffff", letterSpacing: 4, lineHeight: 1, marginBottom: 6 }}>
                  {currentUser.displayName ?? currentUser.username}
                </div>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "#4a6070", marginBottom: 28 }}>ha completado satisfactoriamente el examen</div>

                {/* Exam details */}
                <div style={{ display: "inline-block", background: `${config.color}12`, border: `1px solid ${config.color}44`, borderRadius: 6, padding: "14px 32px", marginBottom: 24 }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: config.color, letterSpacing: 3 }}>{config.label}</div>
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#4a6070", letterSpacing: 2, marginTop: 2 }}>PSYCHOMETRIKS TRADING ACADEMY</div>
                </div>

                {/* Score */}
                <div style={{ display: "flex", justifyContent: "center", gap: 40, marginBottom: 28 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 36, color: pctColor(pct), fontWeight: 700, lineHeight: 1 }}>{pct}%</div>
                    <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#4a6070", letterSpacing: 2, marginTop: 4 }}>PUNTAJE</div>
                  </div>
                  <div style={{ width: 1, background: "#1a2535" }} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 36, color: gradeColor(grade), fontWeight: 700, lineHeight: 1 }}>{grade}</div>
                    <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#4a6070", letterSpacing: 2, marginTop: 4 }}>CALIFICACIÓN</div>
                  </div>
                  <div style={{ width: 1, background: "#1a2535" }} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 36, color: "#00e5ff", fontWeight: 700, lineHeight: 1 }}>{lastResult.correct}/{lastResult.total}</div>
                    <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#4a6070", letterSpacing: 2, marginTop: 4 }}>CORRECTAS</div>
                  </div>
                </div>

                <div style={{ width: "100%", height: 1, background: "linear-gradient(90deg, transparent, #1a2535, transparent)", marginBottom: 20 }} />

                {/* Date + ID */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#2a4a5a", letterSpacing: 2 }}>FECHA DE EMISIÓN</div>
                    <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "#4a6070", marginTop: 2 }}>
                      {new Date(lastResult.date).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 18, color: "#ffd700", lineHeight: 1 }}>⬡</div>
                    <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: "#2a4a5a", letterSpacing: 2, marginTop: 2 }}>VERIFICADO</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#2a4a5a", letterSpacing: 2 }}>CÓDIGO</div>
                    <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "#4a6070", marginTop: 2, fontWeight: 700 }}>
                      PSY-{lastResult.id.slice(0, 8).toUpperCase()}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 16, fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: "#1a2535", letterSpacing: 2 }}>
                  PSYCHOMETRIKS.TRADE · AULA VIRTUAL · NO ES ASESORÍA FINANCIERA
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
    );
  }

  // ─── HISTORY PHASE ───────────────────────────────────────────────────
  if (phase === "history") {
    const allHistory = getExamHistory(currentUser.id);
    const filtered = historyFilter === "ALL" ? allHistory : allHistory.filter(h => h.mode === historyFilter);
    const avgPct = allHistory.length ? Math.round(allHistory.reduce((s, h) => s + h.pct, 0) / allHistory.length) : 0;
    const best = allHistory.length ? allHistory.reduce((b, h) => h.pct > b.pct ? h : b, allHistory[0]) : null;

    return (
      <div style={{ padding: "40px 36px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <button
            onClick={() => setPhase("select")}
            style={{
              background: "none", border: "1px solid var(--border)", color: "var(--muted)",
              fontFamily: "'Share Tech Mono',monospace", fontSize: 11, letterSpacing: 1,
              padding: "6px 12px", borderRadius: 3, cursor: "pointer",
            }}
          >← VOLVER</button>
          <div>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 14, letterSpacing: 3, color: "var(--text)" }}>
              HISTORIAL DE EXÁMENES
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "'Share Tech Mono',monospace", marginTop: 3 }}>
              {currentUser.displayName || currentUser.username}
            </div>
          </div>
        </div>

        {/* Summary stats */}
        {allHistory.length > 0 && (
          <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
            {[
              { label: "EXÁMENES TOTALES", val: allHistory.length.toString(), c: "var(--cyan)" },
              { label: "PROMEDIO GENERAL", val: avgPct + "%", c: pctColor(avgPct) },
              { label: "MEJOR RESULTADO", val: best ? best.pct + "%" : "—", c: "#ffd700" },
              { label: "NIVELES EVALUADOS", val: new Set(allHistory.map(h => h.mode)).size.toString(), c: "#00e676" },
            ].map(s => (
              <div key={s.label} style={{
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: 6, padding: "14px 20px", flex: 1, minWidth: 120,
              }}>
                <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 20, color: s.c, fontWeight: 700 }}>{s.val}</div>
                <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 2, fontFamily: "'Share Tech Mono',monospace", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {(["ALL", ...EXAM_MODES.map(m => m.mode)] as const).map(m => (
            <button
              key={m}
              onClick={() => setHistoryFilter(m as ExamMode | "ALL")}
              style={{
                padding: "5px 12px", borderRadius: 3, cursor: "pointer",
                fontFamily: "'Share Tech Mono',monospace", fontSize: 10, letterSpacing: 1,
                background: historyFilter === m ? "rgba(0,229,255,0.15)" : "var(--bg2)",
                border: historyFilter === m ? "1px solid var(--cyan)" : "1px solid var(--border)",
                color: historyFilter === m ? "var(--cyan)" : "var(--muted)",
              }}
            >{m === "ALL" ? "TODOS" : m}</button>
          ))}
        </div>

        {/* History list */}
        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 0",
            fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: "var(--muted)", letterSpacing: 2,
          }}>
            {allHistory.length === 0 ? "AÚN NO COMPLETASTE NINGÚN EXAMEN" : "SIN RESULTADOS PARA ESTE FILTRO"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((h, i) => {
              const modeCfg = EXAM_MODES.find(m => m.mode === h.mode);
              const col = modeCfg?.color || "var(--cyan)";
              const g = gradeColor(h.grade);
              const d = new Date(h.date);
              return (
                <div key={h.id} style={{
                  background: "var(--bg2)", border: `1px solid ${col}33`,
                  borderRadius: 6, padding: "16px 20px",
                  display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
                }}>
                  <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, color: "var(--muted)", width: 24 }}>
                    #{filtered.length - i}
                  </div>
                  <span style={{
                    fontFamily: "'Share Tech Mono',monospace", fontSize: 10, padding: "2px 8px",
                    background: `${col}22`, border: `1px solid ${col}44`, color: col,
                  }}>{h.mode}</span>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{h.modeLabel}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Share Tech Mono',monospace", marginTop: 2 }}>
                      {d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })} · {d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  {/* mini progress bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 80, height: 6, background: "#1a2a3a", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${h.pct}%`, background: pctColor(h.pct), borderRadius: 3 }} />
                    </div>
                    <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: pctColor(h.pct), width: 40 }}>{h.pct}%</span>
                  </div>
                  <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, color: g, fontWeight: 700, width: 40, textAlign: "center" }}>{h.grade}</div>
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "var(--muted)", width: 50, textAlign: "right" }}>
                    {formatTime(h.durationSeconds)}
                  </div>
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "var(--muted)", width: 60, textAlign: "right" }}>
                    {h.correct}/{h.total}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return null;
}
