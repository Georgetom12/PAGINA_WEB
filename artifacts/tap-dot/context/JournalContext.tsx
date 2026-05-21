import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Direction = "LONG" | "SHORT";
export type TradeResult = "WIN" | "LOSS" | "OPEN";
export type Emotion = "FOMO" | "MIEDO" | "CONFIANZA" | "NEUTRO" | "EUFORIA";

export interface JournalEntry {
  id: string;
  date: string;
  crypto: string;
  direction: Direction;
  entry: number;
  exit?: number;
  result: TradeResult;
  pnlPercent?: number;
  emotion: Emotion;
  notes: string;
}

interface JournalCtx {
  entries: JournalEntry[];
  addEntry: (entry: Omit<JournalEntry, "id" | "date">) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  isLoading: boolean;
  winRate: number;
  totalPnl: number;
}

const JournalContext = createContext<JournalCtx>({
  entries: [],
  addEntry: async () => {},
  deleteEntry: async () => {},
  isLoading: true,
  winRate: 0,
  totalPnl: 0,
});

const STORAGE_KEY = "psy_journal_mobile_v1";

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setEntries(JSON.parse(raw) as JournalEntry[]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const persist = useCallback(async (next: JournalEntry[]) => {
    setEntries(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addEntry = useCallback(
    async (entry: Omit<JournalEntry, "id" | "date">) => {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 7);
      const date = new Date().toISOString().split("T")[0];
      await persist([{ id, date, ...entry }, ...entries]);
    },
    [entries, persist]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      await persist(entries.filter((e) => e.id !== id));
    },
    [entries, persist]
  );

  const closed = entries.filter((e) => e.result !== "OPEN");
  const wins = closed.filter((e) => e.result === "WIN").length;
  const winRate = closed.length > 0 ? Math.round((wins / closed.length) * 100) : 0;
  const totalPnl = entries.reduce((acc, e) => acc + (e.pnlPercent ?? 0), 0);

  return (
    <JournalContext.Provider value={{ entries, addEntry, deleteEntry, isLoading, winRate, totalPnl }}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal() {
  return useContext(JournalContext);
}
