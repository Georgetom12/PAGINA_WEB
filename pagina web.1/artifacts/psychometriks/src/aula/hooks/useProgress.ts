import { useState, useCallback, useEffect } from "react";

function storageKey(user: string) {
  return `psyko_progress_${user}`;
}

function loadCompleted(user: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(user));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function saveCompleted(user: string, completed: Set<string>) {
  localStorage.setItem(storageKey(user), JSON.stringify(Array.from(completed)));
}

export function useProgress(user: string) {
  const [completed, setCompleted] = useState<Set<string>>(() => loadCompleted(user));

  useEffect(() => {
    setCompleted(loadCompleted(user));
  }, [user]);

  const markComplete = useCallback((moduleId: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(moduleId);
      saveCompleted(user, next);
      return next;
    });
  }, [user]);

  const markIncomplete = useCallback((moduleId: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.delete(moduleId);
      saveCompleted(user, next);
      return next;
    });
  }, [user]);

  const isCompleted = useCallback((moduleId: string) => completed.has(moduleId), [completed]);

  return { completed, markComplete, markIncomplete, isCompleted };
}
