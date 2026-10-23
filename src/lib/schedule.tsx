import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { RecEvent } from "@/data/types";

/**
 * Personal event schedule — local-only, anonymous.
 *
 * Kept deliberately separate from the public event records and from the
 * generic saved-items store, because a schedule entry also carries a snapshot:
 * if an event later disappears from the directory we can still show what the
 * user planned, marked as no longer listed, instead of silently dropping it.
 *
 * Storage is versioned so the shape can evolve without breaking older clients.
 */

const STORAGE_KEY = "krew3.schedule.v1";
const STORAGE_VERSION = 1;

export interface ScheduledEvent {
  slug: string;
  id: string;
  name: string;
  kind: RecEvent["kind"];
  date: string | null;
  dateLabel: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string;
  online: boolean;
  organizer: string;
  summary: string;
  url: string;
  region: string;
  category: string;
  /** ISO timestamp of when the user added it, used as a stable tie-breaker. */
  savedAt: string;
}

interface StoredSchedule {
  version: number;
  items: Record<string, ScheduledEvent>;
}

interface ScheduleContextValue {
  items: Record<string, ScheduledEvent>;
  list: ScheduledEvent[];
  hydrated: boolean;
  count: number;
  isScheduled: (slug: string) => boolean;
  toggle: (event: RecEvent) => boolean;
  remove: (slug: string) => void;
  clear: () => void;
}

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Validate one stored entry so a tampered/corrupt value cannot crash the app. */
function sanitizeEntry(value: unknown): ScheduledEvent | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const slug = asString(row["slug"]);
  const name = asString(row["name"]);
  if (!slug || !name) return null;

  const kind = asString(row["kind"]);
  return {
    slug,
    id: asString(row["id"]) ?? slug,
    name,
    kind: (kind ?? "meetup") as RecEvent["kind"],
    date: asString(row["date"]),
    dateLabel: asString(row["dateLabel"]),
    endDate: asString(row["endDate"]),
    startTime: asString(row["startTime"]),
    endTime: asString(row["endTime"]),
    location: asString(row["location"]) ?? "",
    online: row["online"] === true,
    organizer: asString(row["organizer"]) ?? "",
    summary: asString(row["summary"]) ?? "",
    url: asString(row["url"]) ?? "",
    region: asString(row["region"]) ?? "",
    category: asString(row["category"]) ?? "",
    savedAt: asString(row["savedAt"]) ?? new Date(0).toISOString(),
  };
}

function readStored(): Record<string, ScheduledEvent> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const stored = parsed as Partial<StoredSchedule>;
    if (stored.version !== STORAGE_VERSION || !stored.items) return {};
    if (typeof stored.items !== "object") return {};

    const items: Record<string, ScheduledEvent> = {};
    for (const [slug, entry] of Object.entries(stored.items)) {
      const clean = sanitizeEntry(entry);
      if (clean && clean.slug === slug) items[slug] = clean;
    }
    return items;
  } catch {
    return {};
  }
}

function toSnapshot(event: RecEvent): ScheduledEvent {
  return {
    slug: event.slug,
    id: event.id,
    name: event.name,
    kind: event.kind,
    date: event.date ?? null,
    dateLabel: event.dateLabel ?? null,
    endDate: event.endDate ?? null,
    startTime: event.startTime ?? null,
    endTime: event.endTime ?? null,
    location: event.location,
    online: event.online,
    organizer: event.organizer,
    summary: event.summary,
    url: event.url,
    region: event.region ?? "",
    category: event.category ?? "",
    savedAt: new Date().toISOString(),
  };
}

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Record<string, ScheduledEvent>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStored());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: Record<string, ScheduledEvent>) => {
    setItems(next);
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: STORAGE_VERSION, items: next } satisfies StoredSchedule),
      );
    } catch {
      /* Storage unavailable/full — keep the in-memory schedule for this session. */
    }
  }, []);

  const isScheduled = useCallback((slug: string) => Boolean(items[slug]), [items]);

  const toggle = useCallback(
    (event: RecEvent) => {
      const has = Boolean(items[event.slug]);
      const next = { ...items };
      if (has) delete next[event.slug];
      else next[event.slug] = toSnapshot(event);
      persist(next);
      return !has;
    },
    [items, persist],
  );

  const remove = useCallback(
    (slug: string) => {
      if (!items[slug]) return;
      const next = { ...items };
      delete next[slug];
      persist(next);
    },
    [items, persist],
  );

  const clear = useCallback(() => {
    persist({});
  }, [persist]);

  const list = useMemo(() => Object.values(items), [items]);

  const value = useMemo<ScheduleContextValue>(
    () => ({
      items,
      list,
      hydrated,
      count: list.length,
      isScheduled,
      toggle,
      remove,
      clear,
    }),
    [items, list, hydrated, isScheduled, toggle, remove, clear],
  );

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be used inside <ScheduleProvider>");
  return ctx;
}
