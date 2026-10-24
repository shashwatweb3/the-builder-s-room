/**
 * NEXT UP is evaluated in the event directory's local timezone. Event records
 * store date and wall-clock time separately, so build their comparison instants
 * explicitly instead of relying on the visitor's browser timezone.
 */
const INDIA_OFFSET = "+05:30";
const END_OF_DAY = "23:59:59.999";

export interface NextUpEvent {
  date?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

function validDate(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function normalizedTime(value: string | null | undefined, fallback: string): string {
  if (!value || !/^\d{2}:\d{2}(?::\d{2})?$/.test(value)) return fallback;
  return value.length === 5 ? `${value}:00` : value;
}

function atIndiaTime(date: string, time: string): Date {
  return new Date(`${date}T${time}${INDIA_OFFSET}`);
}

function eventStart(event: NextUpEvent): Date | null {
  if (!validDate(event.date)) return null;
  return atIndiaTime(event.date, normalizedTime(event.startTime, "00:00:00"));
}

function eventSortStart(event: NextUpEvent): Date | null {
  if (!validDate(event.date)) return null;
  // Unknown times sort after confirmed times on the same future date.
  return atIndiaTime(event.date, normalizedTime(event.startTime, END_OF_DAY));
}

function eventEnd(event: NextUpEvent): Date | null {
  if (!validDate(event.date)) return null;
  const date = validDate(event.endDate) ? event.endDate : event.date;
  // Without an announced end time, keep the event eligible through its local
  // end date rather than incorrectly expiring it at midnight.
  return atIndiaTime(date, normalizedTime(event.endTime, END_OF_DAY));
}

/**
 * Returns the earliest event that has not started or ended in Asia/Kolkata, or
 * null when every dated event is already underway or over. An event with no
 * confirmed time is considered to start at the beginning of its listed day,
 * while confirmed times determine ordering among future events on that day.
 */
export function findNextUpcomingEvent<T extends NextUpEvent>(
  events: readonly T[],
  now: Date = new Date(),
): T | null {
  return (
    events
      .map((event) => ({
        event,
        start: eventStart(event),
        sortStart: eventSortStart(event),
        end: eventEnd(event),
      }))
      .filter(
        (candidate): candidate is { event: T; start: Date; sortStart: Date; end: Date } =>
          candidate.start !== null &&
          candidate.sortStart !== null &&
          candidate.end !== null &&
          candidate.start.getTime() > now.getTime() &&
          candidate.end.getTime() > now.getTime(),
      )
      .sort(
        (a, b) =>
          a.sortStart.getTime() - b.sortStart.getTime() || a.end.getTime() - b.end.getTime(),
      )[0]?.event ?? null
  );
}
