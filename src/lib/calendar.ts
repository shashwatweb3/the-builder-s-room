/**
 * iCalendar (RFC 5545) export for Krew3 events.
 *
 * The events table stores calendar dates and wall-clock times only; there is no
 * timezone column. We therefore:
 * - Emit date-only (all-day) entries when a start time is missing.
 * - Never invent an end time: a timed event without an explicit end gets only
 *   DTSTART.
 * - Attribute a timezone only when the event's own data points at a known
 *   region (Mumbai/Goa → India Standard Time). Otherwise times stay floating
 *   so a calendar client cannot silently shift them into an unrelated zone.
 *
 * Deliberately framework-free so it can be tested with plain Node.
 */

import { parseDateToDayIndex, parseTimeToMinutes } from "./schedule-conflicts";

export interface CalendarEventInput {
  slug: string;
  name: string;
  date?: string | null;
  dateLabel?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  online?: boolean;
  organizer?: string | null;
  summary?: string | null;
  url?: string | null;
  region?: string | null;
}

export interface CalendarBuildOptions {
  now?: Date;
  /** Force a zone, or pass null to force floating local times. */
  timeZone?: string | null;
  /** Unique-ID domain; defaults to krew3.site. */
  uidDomain?: string;
}

export interface ScheduleBuildOptions extends CalendarBuildOptions {
  calendarName?: string;
  calendarDescription?: string;
}

export interface ScheduleCalendar {
  /** Empty when nothing could be represented. */
  ics: string;
  included: number;
  skipped: CalendarEventInput[];
  /** True when at least one event could not be included. */
  partial: boolean;
}

interface ZoneDefinition {
  label: string;
  offset: string;
  vtimezone: string[];
}

const ZONES: Record<string, ZoneDefinition> = {
  "Asia/Kolkata": {
    label: "India Standard Time",
    offset: "UTC+05:30",
    vtimezone: [
      "BEGIN:VTIMEZONE",
      "TZID:Asia/Kolkata",
      "X-LIC-LOCATION:Asia/Kolkata",
      "BEGIN:STANDARD",
      "DTSTART:19700101T000000",
      "TZOFFSETFROM:+0530",
      "TZOFFSETTO:+0530",
      "TZNAME:IST",
      "END:STANDARD",
      "END:VTIMEZONE",
    ],
  },
};

const INDIA_LOCATION_HINTS = [
  "mumbai",
  "goa",
  "bengaluru",
  "bangalore",
  "new delhi",
  "delhi",
  "hyderabad",
  "pune",
  "chennai",
  "india",
];

/**
 * Best-effort zone from the structured region first, then the venue text.
 * Returns null when the data does not identify a supported zone.
 */
export function inferTimeZone(
  event: Pick<CalendarEventInput, "region" | "location">,
): string | null {
  const region = (event.region ?? "").trim().toLowerCase();
  if (region === "mumbai" || region === "goa") return "Asia/Kolkata";
  const location = (event.location ?? "").toLowerCase();
  if (INDIA_LOCATION_HINTS.some((hint) => location.includes(hint))) return "Asia/Kolkata";
  return null;
}

/** Escape a value for an iCalendar TEXT property (RFC 5545 §3.3.11). */
export function escapeIcsText(value: string): string {
  const cleaned = value
    .replace(/\r\n?/g, "\n")
    .replace(/\p{Cc}/gu, (char) => (char === "\n" || char === "\t" ? char : ""));
  return cleaned
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Fold one logical content line at 75 octets (UTF-8), prefixing continuation
 * lines with a single space. Counting octets rather than characters keeps
 * lines valid for non-ASCII titles (e.g. "é", CJK, emoji).
 */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;

  for (const char of line) {
    const bytes = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (current && currentBytes + bytes > limit) {
      parts.push(current);
      current = "";
      currentBytes = 0;
    }
    current += char;
    currentBytes += bytes;
  }
  if (current) parts.push(current);
  return parts.join("\r\n ");
}

const pad = (value: number) => String(value).padStart(2, "0");

function dateValue(dayIndex: number): string {
  const date = new Date(dayIndex * 86_400_000);
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

function dateTimeValue(dayIndex: number, minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${dateValue(dayIndex)}T${pad(hours)}${pad(mins)}00`;
}

export function formatIcsUtc(value: Date): string {
  return `${value
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "")}`;
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value.trim());
}

function safeSlug(slug: string): string {
  return (slug || "event").replace(/[^A-Za-z0-9._-]+/g, "-");
}

interface CompiledEvent {
  lines: string[];
  zone: string | null;
}

function compileEvent(
  event: CalendarEventInput,
  options: CalendarBuildOptions,
): CompiledEvent | null {
  const name = event.name?.trim();
  if (!name) return null;

  const startDay = parseDateToDayIndex(event.date);
  if (startDay === null) return null;

  const startTime = parseTimeToMinutes(event.startTime);
  const endTime = parseTimeToMinutes(event.endTime);
  const endDateDay = parseDateToDayIndex(event.endDate);
  const requestedZone = options.timeZone !== undefined ? options.timeZone : inferTimeZone(event);
  const zoneKey = requestedZone && ZONES[requestedZone] ? requestedZone : null;
  const zone = zoneKey ? ZONES[zoneKey] : null;

  const lines: string[] = ["BEGIN:VEVENT"];
  lines.push(`UID:${safeSlug(event.slug)}@${options.uidDomain ?? "krew3.site"}`);
  lines.push(`DTSTAMP:${formatIcsUtc(options.now ?? new Date())}`);

  const description: string[] = [];
  const summary = event.summary?.trim();
  if (summary) description.push(summary);
  const organizer = event.organizer?.trim();
  if (organizer) description.push(`Hosted by ${organizer}.`);
  const url = event.url?.trim() ?? "";
  const hasUrl = isHttpUrl(url);
  if (hasUrl) description.push(`Registration: ${url}`);

  if (startTime !== null) {
    lines.push(
      zoneKey
        ? `DTSTART;TZID=${zoneKey}:${dateTimeValue(startDay, startTime)}`
        : `DTSTART:${dateTimeValue(startDay, startTime)}`,
    );

    if (endTime !== null) {
      let endDay = startDay;
      if (endDateDay !== null && endDateDay > startDay) endDay = endDateDay;
      else if (endTime <= startTime) endDay = startDay + 1;

      const startAbs = startDay * 1440 + startTime;
      const endAbs = endDay * 1440 + endTime;
      if (endAbs > startAbs) {
        lines.push(
          zoneKey
            ? `DTEND;TZID=${zoneKey}:${dateTimeValue(endDay, endTime)}`
            : `DTEND:${dateTimeValue(endDay, endTime)}`,
        );
      } else {
        description.push("End time was not announced.");
      }
    } else {
      description.push("End time was not announced.");
    }

    description.push(
      zone
        ? `Times are in ${zone.label} (${zone.offset}).`
        : "Time zone was not specified by the organizer.",
    );
  } else {
    // Date known, time unknown: a standard all-day entry, never midnight.
    const lastDay = endDateDay !== null && endDateDay > startDay ? endDateDay : startDay;
    lines.push(`DTSTART;VALUE=DATE:${dateValue(startDay)}`);
    lines.push(`DTEND;VALUE=DATE:${dateValue(lastDay + 1)}`);
    description.push(
      lastDay > startDay
        ? "Dates only — start and end times were not announced."
        : "Start time was not announced.",
    );
  }

  lines.push(`SUMMARY:${escapeIcsText(name)}`);

  const online = event.online === true;
  const location = event.location?.trim() ?? "";
  if (online) {
    lines.push(`LOCATION:${escapeIcsText(location ? `Online — ${location}` : "Online")}`);
  } else if (location) {
    lines.push(`LOCATION:${escapeIcsText(location)}`);
  }

  if (description.length) {
    lines.push(`DESCRIPTION:${escapeIcsText(description.join("\n\n"))}`);
  }
  if (hasUrl) lines.push(`URL:${url}`);

  lines.push("END:VEVENT");
  // Only timed events actually reference the zone; date-only entries must not
  // drag an unused VTIMEZONE into the file.
  return { lines, zone: startTime !== null ? zoneKey : null };
}

function assembleCalendar(
  compiled: CompiledEvent[],
  options: CalendarBuildOptions & { calendarName?: string; calendarDescription?: string },
): string {
  const zones = [
    ...new Set(
      compiled
        .map((entry) => entry.zone)
        .filter((zone): zone is string => Boolean(zone && ZONES[zone])),
    ),
  ];

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Krew3//Event Calendar//EN",
    "CALSCALE:GREGORIAN",
  ];

  if (options.calendarName) {
    lines.push(`X-WR-CALNAME:${escapeIcsText(options.calendarName)}`);
  }
  if (options.calendarDescription) {
    lines.push(`X-WR-CALDESC:${escapeIcsText(options.calendarDescription)}`);
  }
  for (const zone of zones) {
    const definition = ZONES[zone];
    if (definition) lines.push(...definition.vtimezone);
  }
  for (const entry of compiled) lines.push(...entry.lines);
  lines.push("END:VCALENDAR");

  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}

/** Build a single-event .ics file, or null when the event has no usable date. */
export function buildEventIcs(
  event: CalendarEventInput,
  options: CalendarBuildOptions = {},
): string | null {
  const compiled = compileEvent(event, options);
  if (!compiled) return null;
  return assembleCalendar([compiled], options);
}

function sortKey(event: CalendarEventInput): {
  day: number;
  minutes: number;
  name: string;
} {
  const day = parseDateToDayIndex(event.date);
  const minutes = parseTimeToMinutes(event.startTime);
  return {
    day: day ?? Number.MAX_SAFE_INTEGER,
    minutes: minutes ?? Number.MAX_SAFE_INTEGER,
    name: event.name.toLowerCase(),
  };
}

/** Date → start time → title. Undated events sort last. */
export function sortCalendarEvents<T extends CalendarEventInput>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    const left = sortKey(a);
    const right = sortKey(b);
    return (
      left.day - right.day || left.minutes - right.minutes || left.name.localeCompare(right.name)
    );
  });
}

/**
 * Build one calendar for the supplied saved events.
 *
 * Events without a usable date are skipped (and returned) rather than emitted
 * with fabricated timestamps. The caller should surface the skip count.
 */
export function buildScheduleIcs(
  events: CalendarEventInput[],
  options: ScheduleBuildOptions = {},
): ScheduleCalendar {
  const now = options.now ?? new Date();
  const ordered = sortCalendarEvents(events);
  const compiled: CompiledEvent[] = [];
  const skipped: CalendarEventInput[] = [];

  for (const event of ordered) {
    const entry = compileEvent(event, { ...options, now });
    if (entry) compiled.push(entry);
    else skipped.push(event);
  }

  if (compiled.length === 0) {
    return { ics: "", included: 0, skipped, partial: skipped.length > 0 };
  }

  return {
    ics: assembleCalendar(compiled, {
      ...options,
      now,
      calendarName: options.calendarName ?? "Krew3 — My schedule",
      calendarDescription:
        options.calendarDescription ??
        "Events saved in Krew3 on this device. Self-reported, not a verified attendance record.",
    }),
    included: compiled.length,
    skipped,
    partial: skipped.length > 0,
  };
}

export function eventCalendarFilename(slug: string): string {
  return `krew3-${safeSlug(slug)}.ics`;
}

export function scheduleCalendarFilename(now: Date = new Date()): string {
  return `krew3-schedule-${now.toISOString().slice(0, 10)}.ics`;
}
