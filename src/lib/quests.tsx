import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  addQuest as addQuestToList,
  linkEvent as linkEventInList,
  parseStoredQuests,
  removeQuest as removeQuestFromList,
  serializeQuests,
  setQuestCompleted as setQuestCompletedInList,
  toggleLinkDone as toggleLinkDoneInList,
  unlinkEvent as unlinkEventFromList,
  type Quest,
  type QuestCategory,
  type QuestEventInput,
} from "./quests-core";

/**
 * Local-only sidequests, stored next to (but independently from) the schedule.
 *
 * Deliberately anonymous: no account, no wallet, no server write. The versioned
 * key lets us evolve the shape later without crashing older clients.
 */

const STORAGE_KEY = "krew3.quests.v1";

interface QuestsContextValue {
  quests: Quest[];
  hydrated: boolean;
  count: number;
  completedCount: number;
  addQuest: (category: QuestCategory) => void;
  removeQuest: (category: QuestCategory) => void;
  linkEvent: (category: QuestCategory, event: QuestEventInput) => void;
  unlinkEvent: (category: QuestCategory, slug: string) => void;
  toggleLinkDone: (category: QuestCategory, slug: string) => void;
  setQuestCompleted: (category: QuestCategory, completed: boolean) => void;
}

const QuestsContext = createContext<QuestsContextValue | null>(null);

function readStored(): Quest[] {
  if (typeof window === "undefined") return [];
  try {
    return parseStoredQuests(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export function QuestsProvider({ children }: { children: ReactNode }) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setQuests(readStored());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: Quest[]) => {
    setQuests(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, serializeQuests(next));
    } catch {
      /* Storage unavailable/full — keep the in-memory quests for this session. */
    }
  }, []);

  const addQuest = useCallback(
    (category: QuestCategory) => {
      persist(addQuestToList(quests, category, new Date().toISOString()));
    },
    [quests, persist],
  );

  const removeQuest = useCallback(
    (category: QuestCategory) => {
      persist(removeQuestFromList(quests, category));
    },
    [quests, persist],
  );

  const linkEvent = useCallback(
    (category: QuestCategory, event: QuestEventInput) => {
      persist(linkEventInList(quests, category, event));
    },
    [quests, persist],
  );

  const unlinkEvent = useCallback(
    (category: QuestCategory, slug: string) => {
      persist(unlinkEventFromList(quests, category, slug));
    },
    [quests, persist],
  );

  const toggleLinkDone = useCallback(
    (category: QuestCategory, slug: string) => {
      persist(toggleLinkDoneInList(quests, category, slug));
    },
    [quests, persist],
  );

  const setQuestCompleted = useCallback(
    (category: QuestCategory, completed: boolean) => {
      persist(setQuestCompletedInList(quests, category, completed, new Date().toISOString()));
    },
    [quests, persist],
  );

  const completedCount = useMemo(
    () => quests.reduce((count, quest) => count + (quest.completedAt ? 1 : 0), 0),
    [quests],
  );

  const value = useMemo<QuestsContextValue>(
    () => ({
      quests,
      hydrated,
      count: quests.length,
      completedCount,
      addQuest,
      removeQuest,
      linkEvent,
      unlinkEvent,
      toggleLinkDone,
      setQuestCompleted,
    }),
    [
      quests,
      hydrated,
      completedCount,
      addQuest,
      removeQuest,
      linkEvent,
      unlinkEvent,
      toggleLinkDone,
      setQuestCompleted,
    ],
  );

  return <QuestsContext.Provider value={value}>{children}</QuestsContext.Provider>;
}

export function useQuests() {
  const ctx = useContext(QuestsContext);
  if (!ctx) throw new Error("useQuests must be used inside <QuestsProvider>");
  return ctx;
}
