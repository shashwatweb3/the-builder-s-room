import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SavedKind } from "@/data/types";

/**
 * Local-only saved items.
 * Deliberately isolated so it can be swapped for a per-user backend
 * table later without changing a single consumer.
 */

const STORAGE_KEY = "recroom.saved.v1";

type SavedMap = Record<SavedKind, string[]>;

const empty: SavedMap = { opportunity: [], project: [], builder: [] };

interface SavedContextValue {
  saved: SavedMap;
  hydrated: boolean;
  isSaved: (kind: SavedKind, id: string) => boolean;
  toggleSaved: (kind: SavedKind, id: string) => boolean;
  count: number;
}

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<SavedMap>(empty);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSaved({ ...empty, ...(JSON.parse(raw) as Partial<SavedMap>) });
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: SavedMap) => {
    setSaved(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — stay in memory */
    }
  }, []);

  const isSaved = useCallback((kind: SavedKind, id: string) => saved[kind].includes(id), [saved]);

  const toggleSaved = useCallback(
    (kind: SavedKind, id: string) => {
      const list = saved[kind];
      const has = list.includes(id);
      const next = {
        ...saved,
        [kind]: has ? list.filter((x) => x !== id) : [...list, id],
      };
      persist(next);
      return !has;
    },
    [saved, persist],
  );

  const value = useMemo<SavedContextValue>(
    () => ({
      saved,
      hydrated,
      isSaved,
      toggleSaved,
      count: saved.opportunity.length + saved.project.length + saved.builder.length,
    }),
    [saved, hydrated, isSaved, toggleSaved],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used inside <SavedProvider>");
  return ctx;
}
