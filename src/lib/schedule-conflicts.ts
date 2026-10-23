/**
 * Time-conflict detection for saved schedule events.
 *
 * Deliberately pure and framework-free so it can be unit-tested in isolation.
 *
 * Design rules:
 * - Dates are calendar dates (YYYY-MM-DD) with no timezone. Times are wall-clock
 *   (HH:MM). The source table has no timezone column, so we compare events on a
 *   single, shared wall-clock timeline. We never reinterpret them as UTC or shift
 *   them into the viewer's zone; doing so would invent information the data does
 *   not contain.
 * - If a date, start time or end time is missing/invalid we cannot reliably
 *   compare the event, so it is treated as "unknown timing" and excluded from
 *   conflicts entirely. Unknown is never coerced to midnight or zero.
 * - An end time earlier than the start time is interpreted as crossing midnight
 *   (end on the following day). Multi-day events with an explicit end_date and
 *   end time span the full range.
 * - We only report genuine time overlap. Travel time, venue distance and
 *   "back-to-back" feasibility are explicitly out of scope.
 */

export interface PlanEvent {
  slug: string;
  name: string;
  date: string | null;
  dateLabel: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
}

export interface TimeWindow {
  /** Minutes since 1970-01-01 on the shared wall-clock timeline. */
  startMinute: number;
  endMinute: number;
}

export interface ConflictPair<T extends PlanEvent> {
  a: T;
  b: T;
  /** Overlap in whole minutes (always > 0 for a reported conflict). */
  minutes: number;
}

const MINUTES_PER_DAY = 24 * 60;
const MS_PER_DAY = 86_400_000;

/** Parse a Postgres-style time ("19:00", "19:00:00") to minutes, or null. */
export function parseTimeToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Parse a calendar date (YYYY-MM-DD) to a whole-day index, or null. */
export function parseDateToDayIndex(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const ms = Date.UTC(year, month - 1, day);
  const parsed = new Date(ms);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return Math.floor(ms / MS_PER_DAY);
}

/**
 * Resolve an event's absolute time window on the shared timeline.
 * Returns null when the timing cannot be compared reliably.
 */
export function eventTimeWindow(event: PlanEvent): TimeWindow | null {
  const startDay = parseDateToDayIndex(event.date);
  const startTime = parseTimeToMinutes(event.startTime);
  if (startDay === null || startTime === null) return null;

  // We require an end time to know the duration. Without it we would have to
  // assume a length, which risks false conflicts.
  const endTime = parseTimeToMinutes(event.endTime);
  if (endTime === null) return null;

  let endDay = startDay;
  const explicitEndDay = parseDateToDayIndex(event.endDate);
  if (event.endDate && explicitEndDay !== null && explicitEndDay > startDay) {
    endDay = explicitEndDay;
  } else if (endTime <= startTime) {
    // End is at or before start: treat as crossing midnight into the next day.
    endDay = startDay + 1;
  }

  const startMinute = startDay * MINUTES_PER_DAY + startTime;
  const endMinute = endDay * MINUTES_PER_DAY + endTime;
  if (endMinute <= startMinute) return null;

  return { startMinute, endMinute };
}

export function overlapMinutes(a: TimeWindow, b: TimeWindow): number {
  return Math.max(0, Math.min(a.endMinute, b.endMinute) - Math.max(a.startMinute, b.startMinute));
}

/**
 * All overlapping pairs among the supplied events. Events with unknown timing
 * are skipped, so they can never manufacture a conflict.
 */
export function findConflicts<T extends PlanEvent>(events: T[]): ConflictPair<T>[] {
  const timed: { event: T; window: TimeWindow }[] = [];
  for (const event of events) {
    const window = eventTimeWindow(event);
    if (window) timed.push({ event, window });
  }

  type InternalPair = ConflictPair<T> & { sortKey: number };
  const pairs: InternalPair[] = [];
  for (let i = 0; i < timed.length; i += 1) {
    const left = timed[i];
    if (!left) continue;
    for (let j = i + 1; j < timed.length; j += 1) {
      const right = timed[j];
      if (!right) continue;
      const minutes = overlapMinutes(left.window, right.window);
      if (minutes > 0) {
        pairs.push({
          a: left.event,
          b: right.event,
          minutes,
          sortKey: Math.min(left.window.startMinute, right.window.startMinute),
        });
      }
    }
  }

  pairs.sort((p, q) => {
    if (p.sortKey !== q.sortKey) return p.sortKey - q.sortKey;
    return p.a.name.localeCompare(q.a.name);
  });

  return pairs.map((pair) => ({ a: pair.a, b: pair.b, minutes: pair.minutes }));
}

/** Human-friendly overlap duration: "45 min", "2h", "1h 15m". */
export function formatOverlap(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
