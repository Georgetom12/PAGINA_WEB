import type { ExamMode } from "../data/examQuestions";

export interface ExamResult {
  id: string;
  userId: string;
  mode: ExamMode;
  modeLabel: string;
  correct: number;
  total: number;
  pct: number;
  grade: string;
  durationSeconds: number;
  date: string;
  questionIds: string[];
  answerMap: Record<string, number>;
}

const HISTORY_KEY = "psy_exam_history";

function getAll(): Record<string, ExamResult[]> {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveAll(all: Record<string, ExamResult[]>) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
}

export function saveExamResult(result: ExamResult): void {
  const all = getAll();
  const list = all[result.userId] || [];
  list.unshift(result);
  all[result.userId] = list.slice(0, 200);
  saveAll(all);
}

export function getExamHistory(userId: string): ExamResult[] {
  const all = getAll();
  return all[userId] || [];
}

export function clearExamHistory(userId: string): void {
  const all = getAll();
  delete all[userId];
  saveAll(all);
}

export function getAllUsersHistory(): Record<string, ExamResult[]> {
  return getAll();
}
