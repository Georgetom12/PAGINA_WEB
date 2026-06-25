import { getExamHistory, type ExamResult } from "./examHistory";
import type { ExamMode } from "../data/examQuestions";

// ─── BADGES ────────────────────────────────────────────────────────────
export interface Badge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  color: string;
  check: (history: ExamResult[]) => boolean;
}

export const ALL_BADGES: Badge[] = [
  {
    id: "first-exam",
    emoji: "🎯",
    title: "Primer Paso",
    description: "Completaste tu primer examen",
    color: "#00e5ff",
    check: (h) => h.length >= 1,
  },
  {
    id: "perfect-score",
    emoji: "🏆",
    title: "Perfeccionista",
    description: "100% correcto en cualquier examen",
    color: "#ffd700",
    check: (h) => h.some(e => e.pct === 100),
  },
  {
    id: "ten-exams",
    emoji: "📚",
    title: "Estudiante Dedicado",
    description: "Completaste 10 exámenes",
    color: "#00e676",
    check: (h) => h.length >= 10,
  },
  {
    id: "all-levels",
    emoji: "🌐",
    title: "El Completo",
    description: "Examinaste todos los 8 niveles",
    color: "#e040fb",
    check: (h) => {
      const levels = new Set(h.filter(e => e.mode !== "GENERAL").map(e => e.mode));
      return ["N1","N2","N3","N4","N5","N6","N7","N8"].every(l => levels.has(l as ExamMode));
    },
  },
  {
    id: "streak-3",
    emoji: "🔥",
    title: "En Racha",
    description: "3 días seguidos completando exámenes",
    color: "#ff6d00",
    check: (h) => getMaxStreak(h) >= 3,
  },
  {
    id: "streak-7",
    emoji: "⚡",
    title: "Semana Perfecta",
    description: "7 días seguidos completando exámenes",
    color: "#ffd700",
    check: (h) => getMaxStreak(h) >= 7,
  },
  {
    id: "smc-master",
    emoji: "🏦",
    title: "Maestro SMC",
    description: "80%+ en el examen N3 tres veces",
    color: "#ff6d00",
    check: (h) => h.filter(e => e.mode === "N3" && e.pct >= 80).length >= 3,
  },
  {
    id: "macro-trader",
    emoji: "🌍",
    title: "Trader Macro",
    description: "Completaste el examen N5 con 70%+",
    color: "#e040fb",
    check: (h) => h.some(e => e.mode === "N5" && e.pct >= 70),
  },
  {
    id: "risk-pro",
    emoji: "🛡️",
    title: "Gestor de Riesgo",
    description: "80%+ en el examen N7",
    color: "#ff1744",
    check: (h) => h.some(e => e.mode === "N7" && e.pct >= 80),
  },
  {
    id: "general-ace",
    emoji: "🎖️",
    title: "Trader Integral",
    description: "90%+ en el Examen General",
    color: "#00e5ff",
    check: (h) => h.some(e => e.mode === "GENERAL" && e.pct >= 90),
  },
  {
    id: "twenty-five",
    emoji: "💎",
    title: "Élite",
    description: "Completaste 25 exámenes",
    color: "#7c4dff",
    check: (h) => h.length >= 25,
  },
  {
    id: "improving",
    emoji: "📈",
    title: "En Ascenso",
    description: "Mejoraste tu score en el mismo nivel 3 veces",
    color: "#00e676",
    check: (h) => {
      const byMode: Record<string, number[]> = {};
      [...h].reverse().forEach(e => {
        if (!byMode[e.mode]) byMode[e.mode] = [];
        byMode[e.mode].push(e.pct);
      });
      return Object.values(byMode).some(scores => {
        if (scores.length < 3) return false;
        let consec = 1;
        for (let i = 1; i < scores.length; i++) {
          if (scores[i] > scores[i-1]) { consec++; if (consec >= 3) return true; }
          else consec = 1;
        }
        return false;
      });
    },
  },
];

// ─── CHALLENGES ─────────────────────────────────────────────────────────
export interface Challenge {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  durationDays?: number;
  steps: ChallengeStep[];
}

export interface ChallengeStep {
  id: string;
  label: string;
  check: (history: ExamResult[]) => boolean;
}

export const ALL_CHALLENGES: Challenge[] = [
  {
    id: "seven-days-fundamentals",
    emoji: "🧠",
    title: "7 Días de Fundamentos",
    subtitle: "Domina la base",
    description: "Completa el examen N1 7 días consecutivos y dominá los fundamentos del mercado.",
    color: "#00e676",
    durationDays: 7,
    steps: [
      { id: "s1", label: "Examen N1 — Día 1", check: (h) => daysWithLevel(h, "N1") >= 1 },
      { id: "s2", label: "Examen N1 — Día 2", check: (h) => daysWithLevel(h, "N1") >= 2 },
      { id: "s3", label: "Examen N1 — Día 3", check: (h) => daysWithLevel(h, "N1") >= 3 },
      { id: "s4", label: "Examen N1 — Día 4", check: (h) => daysWithLevel(h, "N1") >= 4 },
      { id: "s5", label: "Examen N1 — Día 5", check: (h) => daysWithLevel(h, "N1") >= 5 },
      { id: "s6", label: "Examen N1 — Día 6", check: (h) => daysWithLevel(h, "N1") >= 6 },
      { id: "s7", label: "¡Semana completa de N1!", check: (h) => daysWithLevel(h, "N1") >= 7 },
    ],
  },
  {
    id: "smc-path",
    emoji: "🏦",
    title: "Camino del Smart Money",
    subtitle: "Institucional",
    description: "Superá el 75% en N3 tres veces — convertite en un trader institucional.",
    color: "#ff6d00",
    steps: [
      { id: "s1", label: "N3 con 60%+ (1ª vez)", check: (h) => h.filter(e => e.mode === "N3" && e.pct >= 60).length >= 1 },
      { id: "s2", label: "N3 con 70%+ (2ª vez)", check: (h) => h.filter(e => e.mode === "N3" && e.pct >= 70).length >= 2 },
      { id: "s3", label: "N3 con 75%+ (dominio)", check: (h) => h.filter(e => e.mode === "N3" && e.pct >= 75).length >= 3 },
    ],
  },
  {
    id: "macro-vision",
    emoji: "🌍",
    title: "Visión Macro",
    subtitle: "El gran cuadro",
    description: "Completá todos los niveles de macro y análisis avanzado con al menos 65%.",
    color: "#e040fb",
    steps: [
      { id: "s1", label: "N4 Avanzado — 65%+", check: (h) => h.some(e => e.mode === "N4" && e.pct >= 65) },
      { id: "s2", label: "N5 Macro — 65%+",    check: (h) => h.some(e => e.mode === "N5" && e.pct >= 65) },
      { id: "s3", label: "Examen General — 70%+", check: (h) => h.some(e => e.mode === "GENERAL" && e.pct >= 70) },
    ],
  },
  {
    id: "risk-focus",
    emoji: "🛡️",
    title: "7 Días — Mejorá Tu Enfoque",
    subtitle: "Psicología y riesgo",
    description: "Una semana enfocada en gestión de riesgo y psicología del trader.",
    color: "#ff1744",
    durationDays: 7,
    steps: [
      { id: "s1", label: "Primer examen N7", check: (h) => h.some(e => e.mode === "N7") },
      { id: "s2", label: "N7 con 60%+", check: (h) => h.some(e => e.mode === "N7" && e.pct >= 60) },
      { id: "s3", label: "N7 con 70%+", check: (h) => h.some(e => e.mode === "N7" && e.pct >= 70) },
      { id: "s4", label: "N7 con 80%+ — ¡Dominio!", check: (h) => h.some(e => e.mode === "N7" && e.pct >= 80) },
    ],
  },
  {
    id: "full-journey",
    emoji: "🎖️",
    title: "El Viaje Completo",
    subtitle: "Trader integral",
    description: "Examiná cada nivel del Aula — de N1 a N8 — el viaje del trader profesional.",
    color: "#ffd700",
    steps: [
      { id: "s1", label: "Completar N1", check: (h) => h.some(e => e.mode === "N1") },
      { id: "s2", label: "Completar N2", check: (h) => h.some(e => e.mode === "N2") },
      { id: "s3", label: "Completar N3", check: (h) => h.some(e => e.mode === "N3") },
      { id: "s4", label: "Completar N4", check: (h) => h.some(e => e.mode === "N4") },
      { id: "s5", label: "Completar N5", check: (h) => h.some(e => e.mode === "N5") },
      { id: "s6", label: "Completar N6", check: (h) => h.some(e => e.mode === "N6") },
      { id: "s7", label: "Completar N7", check: (h) => h.some(e => e.mode === "N7") },
      { id: "s8", label: "Completar N8 — ¡Trader Completo!", check: (h) => h.some(e => e.mode === "N8") },
    ],
  },
  {
    id: "perfectionist",
    emoji: "💎",
    title: "El Perfeccionista",
    subtitle: "Sin errores",
    description: "Lográ 100% en cualquier examen — demostrá dominio total.",
    color: "#7c4dff",
    steps: [
      { id: "s1", label: "90%+ en cualquier examen", check: (h) => h.some(e => e.pct >= 90) },
      { id: "s2", label: "95%+ en cualquier examen", check: (h) => h.some(e => e.pct >= 95) },
      { id: "s3", label: "100% — ¡Perfecto!", check: (h) => h.some(e => e.pct === 100) },
    ],
  },
];

// ─── HELPERS ────────────────────────────────────────────────────────────
function daysWithLevel(history: ExamResult[], mode: ExamMode): number {
  const days = new Set(
    history.filter(e => e.mode === mode).map(e => e.date.slice(0, 10))
  );
  return days.size;
}

export function getMaxStreak(history: ExamResult[]): number {
  if (!history.length) return 0;
  const days = [...new Set(history.map(e => e.date.slice(0, 10)))].sort();
  let max = 1, cur = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i-1]);
    const curr = new Date(days[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) { cur++; max = Math.max(max, cur); }
    else { cur = 1; }
  }
  return max;
}

export function getCurrentStreak(history: ExamResult[]): number {
  if (!history.length) return 0;
  const days = [...new Set(history.map(e => e.date.slice(0, 10)))].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (days[0] !== today && days[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i-1]);
    const curr = new Date(days[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export interface ProgressStats {
  totalExams: number;
  avgPct: number;
  bestPct: number;
  currentStreak: number;
  maxStreak: number;
  earnedBadges: Badge[];
  levelStats: Record<string, { count: number; avgPct: number; bestPct: number }>;
  recentTrend: "up" | "down" | "stable";
  weakestLevel: string | null;
  strongestLevel: string | null;
}

export function computeStats(history: ExamResult[]): ProgressStats {
  const totalExams = history.length;
  const avgPct = totalExams ? Math.round(history.reduce((s, e) => s + e.pct, 0) / totalExams) : 0;
  const bestPct = totalExams ? Math.max(...history.map(e => e.pct)) : 0;
  const currentStreak = getCurrentStreak(history);
  const maxStreak = getMaxStreak(history);
  const earnedBadges = ALL_BADGES.filter(b => b.check(history));

  const levelStats: Record<string, { count: number; avgPct: number; bestPct: number }> = {};
  const modes = ["N1","N2","N3","N4","N5","N6","N7","N8","GENERAL"];
  modes.forEach(m => {
    const exs = history.filter(e => e.mode === m);
    if (exs.length) {
      levelStats[m] = {
        count: exs.length,
        avgPct: Math.round(exs.reduce((s, e) => s + e.pct, 0) / exs.length),
        bestPct: Math.max(...exs.map(e => e.pct)),
      };
    }
  });

  // Trend: last 5 vs previous 5
  let recentTrend: "up" | "down" | "stable" = "stable";
  if (history.length >= 4) {
    const recent = history.slice(0, Math.min(5, history.length));
    const prev = history.slice(Math.min(5, history.length), Math.min(10, history.length));
    if (prev.length) {
      const rAvg = recent.reduce((s, e) => s + e.pct, 0) / recent.length;
      const pAvg = prev.reduce((s, e) => s + e.pct, 0) / prev.length;
      if (rAvg > pAvg + 3) recentTrend = "up";
      else if (rAvg < pAvg - 3) recentTrend = "down";
    }
  }

  const levelOnly = Object.entries(levelStats).filter(([k]) => k !== "GENERAL");
  const weakestLevel = levelOnly.length
    ? levelOnly.sort((a, b) => a[1].avgPct - b[1].avgPct)[0][0]
    : null;
  const strongestLevel = levelOnly.length
    ? levelOnly.sort((a, b) => b[1].avgPct - a[1].avgPct)[0][0]
    : null;

  return { totalExams, avgPct, bestPct, currentStreak, maxStreak, earnedBadges, levelStats, recentTrend, weakestLevel, strongestLevel };
}

export function getChallengeProgress(c: Challenge, history: ExamResult[]): { completed: number; total: number; pct: number; done: boolean } {
  const completed = c.steps.filter(s => s.check(history)).length;
  const total = c.steps.length;
  return { completed, total, pct: Math.round(completed / total * 100), done: completed === total };
}
