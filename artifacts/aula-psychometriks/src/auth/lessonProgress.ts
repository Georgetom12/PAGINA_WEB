const KEY = "psy_lesson_progress";

function getAll(): Record<string, Record<string, boolean>> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
  catch { return {}; }
}

function saveAll(data: Record<string, Record<string, boolean>>) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getLessonsDone(userId: string): Record<string, boolean> {
  return getAll()[userId] || {};
}

export function markLessonDone(userId: string, moduleId: string): void {
  const all = getAll();
  all[userId] = { ...(all[userId] || {}), [moduleId]: true };
  saveAll(all);
}

export function markLessonUndone(userId: string, moduleId: string): void {
  const all = getAll();
  if (all[userId]) {
    delete all[userId][moduleId];
    saveAll(all);
  }
}

export function isLessonDone(userId: string, moduleId: string): boolean {
  return !!(getAll()[userId]?.[moduleId]);
}

export function getLevelProgress(userId: string, modulesByLevel: Record<string, string[]>): Record<string, { done: number; total: number }> {
  const done = getLessonsDone(userId);
  const result: Record<string, { done: number; total: number }> = {};
  for (const [level, ids] of Object.entries(modulesByLevel)) {
    result[level] = {
      done: ids.filter(id => done[id]).length,
      total: ids.length,
    };
  }
  return result;
}
