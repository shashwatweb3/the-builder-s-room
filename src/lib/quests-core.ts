/**
 * Sidequest logic — pure, framework-free and storage-agnostic.
 *
 * A sidequest is an optional goal the visitor gives themselves for the week.
 * It holds a short list of directory events they intend to attend, plus
 * self-reported state:
 *
 * - Each linked event can be marked done / reopened by the user.
 * - The quest itself can be marked complete / reopened by the user.
 *
 * We never infer attendance, never score people and never auto-complete on
 * their behalf. Everything here is derived from explicit taps, so milestone
 * indicators always reflect genuine user actions.
 *
 * Links keep a small snapshot (name/date/time) so a quest still reads correctly
 * if the event later disappears from the directory. The UI compares against the
 * live directory and marks missing events as "not in the directory"; nothing is
 * silently deleted.
 */

export type QuestCategory = "learn" | "meet" | "build" | "explore";

export const QUEST_CATEGORY_IDS = ["learn", "meet", "build", "explore"] as const;

export interface QuestDefinition {
  id: QuestCategory;
  title: string;
  blurb: string;
  prompt: string;
}

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    id: "learn",
    title: "Learn something",
    blurb: "Talks, workshops and deep dives.",
    prompt: "Pick a talk or workshop you actually want to sit through.",
  },
  {
    id: "meet",
    title: "Meet builders",
    blurb: "Meetups and networking where the Krew gathers.",
    prompt: "Pick a meetup where you'll talk to someone new.",
  },
  {
    id: "build",
    title: "Build something",
    blurb: "Hackathons and hands-on technical sessions.",
    prompt: "Pick a hackathon or build session to join.",
  },
  {
    id: "explore",
    title: "Explore the ecosystem",
    blurb: "Community and ecosystem gatherings.",
    prompt: "Pick a gathering outside your usual orbit.",
  },
];

const CATEGORY_ORDER: Record<QuestCategory, number> = {
  learn: 0,
  meet: 1,
  build: 2,
  explore: 3,
};

/** Keep storage bounded even if someone edits localStorage by hand. */
export const MAX_LINKS_PER_QUEST = 24;

export function isQuestCategory(value: unknown): value is QuestCategory {
  return typeof value === "string" && (QUEST_CATEGORY_IDS as readonly string[]).includes(value);
}

export function questDefinition(category: QuestCategory): QuestDefinition {
  return QUEST_DEFINITIONS[CATEGORY_ORDER[category]] ?? QUEST_DEFINITIONS[0]!;
}

/** The minimum event shape needed to link something to a quest. */
export interface QuestEventInput {
  slug: string;
  name: string;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

export interface QuestLink {
  slug: string;
  name: string;
  /** ISO calendar date (YYYY-MM-DD) or null. */
  date: string | null;
  /** Normalised wall-clock time (HH:MM) or null. */
  startTime: string | null;
  endTime: string | null;
  /** Self-reported: the user marked this event done. */
  done: boolean;
}

export interface Quest {
  category: QuestCategory;
  links: QuestLink[];
  /** Self-reported completion timestamp, or null while open. */
  completedAt: string | null;
  createdAt: string;
}

export interface QuestProgress {
  total: number;
  done: number;
  /** Whole percent, 0 when nothing is linked. */
  percent: number;
  /** True only when at least one event is linked and all of them are done. */
  allDone: boolean;
  started: boolean;
  completed: boolean;
}

export interface QuestMilestones {
  /** At least one linked event has been marked done. */
  started: boolean;
  /** Half of two-or-more linked events are done. */
  halfway: boolean;
  /** Every linked event is done. */
  allDone: boolean;
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Normalise YYYY-MM-DD (drops any time suffix) and reject impossible dates. */
function cleanDate(value: unknown): string | null {
  const s = cleanString(value);
  if (!s) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
}

/** Normalise a Postgres-style time ("9:00", "09:00:00") to zero-padded HH:MM. */
function cleanTime(value: unknown): string | null {
  const s = cleanString(value);
  if (!s) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(s);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

function cleanTimestamp(value: unknown): string | null {
  const s = cleanString(value);
  if (!s) return null;
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

/** Validate a stored link so corrupt/tampered data cannot break the page. */
export function sanitizeLink(value: unknown): QuestLink | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const slug = cleanString(row["slug"]);
  const name = cleanString(row["name"]);
  if (!slug || !name) return null;
  return {
    slug,
    name,
    date: cleanDate(row["date"]),
    startTime: cleanTime(row["startTime"]),
    endTime: cleanTime(row["endTime"]),
    done: row["done"] === true,
  };
}

export function sanitizeQuest(value: unknown): Quest | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (!isQuestCategory(row["category"])) return null;

  const rawLinks = Array.isArray(row["links"]) ? row["links"] : [];
  const links: QuestLink[] = [];
  const seen = new Set<string>();
  for (const raw of rawLinks) {
    const link = sanitizeLink(raw);
    if (!link || seen.has(link.slug)) continue;
    seen.add(link.slug);
    links.push(link);
    if (links.length >= MAX_LINKS_PER_QUEST) break;
  }

  return {
    category: row["category"],
    links,
    completedAt: cleanTimestamp(row["completedAt"]),
    createdAt: cleanTimestamp(row["createdAt"]) ?? new Date(0).toISOString(),
  };
}

/** Accepts the stored array (or arbitrary data) and returns clean, unique quests. */
export function sanitizeQuests(value: unknown): Quest[] {
  if (!Array.isArray(value)) return [];
  const out: Quest[] = [];
  const seen = new Set<QuestCategory>();
  for (const raw of value) {
    const quest = sanitizeQuest(raw);
    if (!quest || seen.has(quest.category)) continue;
    seen.add(quest.category);
    out.push(quest);
    if (out.length >= QUEST_CATEGORY_IDS.length) break;
  }
  return out.sort((a, b) => CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category]);
}

export function createQuest(category: QuestCategory, now: string): Quest {
  return { category, links: [], completedAt: null, createdAt: now };
}

export function addQuest(quests: Quest[], category: QuestCategory, now: string): Quest[] {
  if (quests.some((quest) => quest.category === category)) return quests;
  return [...quests, createQuest(category, now)].sort(
    (a, b) => CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category],
  );
}

export function removeQuest(quests: Quest[], category: QuestCategory): Quest[] {
  if (!quests.some((quest) => quest.category === category)) return quests;
  return quests.filter((quest) => quest.category !== category);
}

function updateQuest(
  quests: Quest[],
  category: QuestCategory,
  update: (quest: Quest) => Quest,
): Quest[] {
  let changed = false;
  const next = quests.map((quest) => {
    if (quest.category !== category) return quest;
    const updated = update(quest);
    if (updated === quest) return quest;
    changed = true;
    return updated;
  });
  return changed ? next : quests;
}

/** Build a fresh (not-done) link from a directory event. */
export function toQuestLink(event: QuestEventInput): QuestLink | null {
  return sanitizeLink({
    slug: event.slug,
    name: event.name,
    date: event.date ?? null,
    startTime: event.startTime ?? null,
    endTime: event.endTime ?? null,
    done: false,
  });
}

export function linkEvent(
  quests: Quest[],
  category: QuestCategory,
  event: QuestEventInput,
): Quest[] {
  const link = toQuestLink(event);
  if (!link) return quests;
  return updateQuest(quests, category, (quest) => {
    if (quest.links.some((existing) => existing.slug === link.slug)) return quest;
    if (quest.links.length >= MAX_LINKS_PER_QUEST) return quest;
    return { ...quest, links: [...quest.links, link] };
  });
}

export function unlinkEvent(quests: Quest[], category: QuestCategory, slug: string): Quest[] {
  return updateQuest(quests, category, (quest) => {
    if (!quest.links.some((link) => link.slug === slug)) return quest;
    return { ...quest, links: quest.links.filter((link) => link.slug !== slug) };
  });
}

export function toggleLinkDone(quests: Quest[], category: QuestCategory, slug: string): Quest[] {
  return updateQuest(quests, category, (quest) => {
    if (!quest.links.some((link) => link.slug === slug)) return quest;
    return {
      ...quest,
      links: quest.links.map((link) => (link.slug === slug ? { ...link, done: !link.done } : link)),
    };
  });
}

export function setQuestCompleted(
  quests: Quest[],
  category: QuestCategory,
  completed: boolean,
  now: string,
): Quest[] {
  return updateQuest(quests, category, (quest) => {
    if (completed && quest.completedAt) return quest;
    if (!completed && !quest.completedAt) return quest;
    return { ...quest, completedAt: completed ? now : null };
  });
}

/** Dated events first (chronological), then undated by name. */
export function sortLinks(links: QuestLink[]): QuestLink[] {
  return [...links].sort((a, b) => {
    if (!a.date && !b.date) return a.name.localeCompare(b.name);
    if (!a.date) return 1;
    if (!b.date) return -1;
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    const aTime = a.startTime ?? "99:99";
    const bTime = b.startTime ?? "99:99";
    if (aTime !== bTime) return aTime < bTime ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function questProgress(quest: Quest): QuestProgress {
  const total = quest.links.length;
  const done = quest.links.reduce((count, link) => count + (link.done ? 1 : 0), 0);
  return {
    total,
    done,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    allDone: total > 0 && done === total,
    started: done > 0,
    completed: Boolean(quest.completedAt),
  };
}

export function questMilestones(progress: QuestProgress): QuestMilestones {
  return {
    started: progress.done > 0,
    halfway: progress.total >= 2 && progress.done >= Math.ceil(progress.total / 2),
    allDone: progress.allDone,
  };
}

/* ------------------------------------------------------------------ *
 * Persistence envelope
 * ------------------------------------------------------------------ */

/** Bump only when the stored shape changes in a backwards-incompatible way. */
export const QUESTS_STORAGE_VERSION = 1;

export function serializeQuests(quests: Quest[]): string {
  return JSON.stringify({ version: QUESTS_STORAGE_VERSION, quests });
}

/**
 * Parse a raw localStorage value. Tolerates a bare array (older builds) and
 * rejects corrupt JSON / mismatched versions without throwing.
 */
export function parseStoredQuests(raw: string | null | undefined): Quest[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return sanitizeQuests(parsed);
    if (!parsed || typeof parsed !== "object") return [];
    const record = parsed as Record<string, unknown>;
    if (record["version"] !== QUESTS_STORAGE_VERSION) return [];
    return sanitizeQuests(record["quests"]);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ *
 * Directory resolution
 * ------------------------------------------------------------------ */

export interface ResolvedQuestLink extends QuestLink {
  /** True when the slug still exists in the published directory. */
  available: boolean;
}

/**
 * Merge a stored link with its live directory record.
 *
 * The stored snapshot is the fallback so removed events keep a readable name.
 * When a live record exists it wins outright — we never blend a stale date into
 * a live event.
 */
export function resolveQuestLink(
  link: QuestLink,
  live: QuestEventInput | null | undefined,
): ResolvedQuestLink {
  if (!live) return { ...link, available: false };
  return {
    slug: link.slug,
    name: cleanString(live.name) ?? link.name,
    date: cleanDate(live.date),
    startTime: cleanTime(live.startTime),
    endTime: cleanTime(live.endTime),
    done: link.done,
    available: true,
  };
}
