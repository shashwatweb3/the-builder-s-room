import type { RecEvent } from "@/data/types";

const IST_OFFSET_MINUTES = 330;

function getIstDateParts(date: Date = new Date()) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const ist = new Date(utc + IST_OFFSET_MINUTES * 60000);
  const year = ist.getFullYear();
  const month = String(ist.getMonth() + 1).padStart(2, "0");
  const day = String(ist.getDate()).padStart(2, "0");
  return { year, month, day, ist };
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(year: number, month: number, day: number, delta: number) {
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + delta);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export type MobileDateShortcut = "all" | "today" | "tomorrow" | "weekend";

export function getIstTodayKey(date: Date = new Date()) {
  const { year, month, day } = getIstDateParts(date);
  return toDateKey(year, month, day);
}

export function getIstWeekendKeys(date: Date = new Date()): string[] {
  const { year, month, day } = getIstDateParts(date);
  // getUTCDay() on UTC date gives correct day of week for that calendar date
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const dow = utcDate.getUTCDay(); // 0 Sun, 6 Sat
  if (dow === 0) {
    return [toDateKey(year, month, day)];
  }
  if (dow === 6) {
    return [toDateKey(year, month, day)];
  }
  // upcoming Sat/Sun (Sat is 6, Sun is 0)
  const daysToSat = (6 - dow) % 7;
  const daysToSun = (7 - dow) % 7;
  const sat = addDays(year, month, day, daysToSat);
  const sun = addDays(year, month, day, daysToSun);
  const keys = [toDateKey(sat.year, sat.month, sat.day)];
  if (!(sat.year === sun.year && sat.month === sun.month && sat.day === sun.day)) {
    keys.push(toDateKey(sun.year, sun.month, sun.day));
  }
  return keys;
}

export function eventMatchesShortcut(
  event: RecEvent,
  shortcut: MobileDateShortcut,
  date: Date = new Date(),
): boolean {
  try {
    if (shortcut === "all") return true;
    if (!event) return false;
    if (!event.date && !event.endDate) return false;
    if (typeof event.date === "string" && event.date.length < 8) return false;
    if (typeof event.endDate === "string" && event.endDate.length < 8) return false;
    const today = getIstTodayKey(date);
    if (shortcut === "today") {
      if (event.date === today) return true;
      if (event.endDate && event.date && event.date <= today && event.endDate >= today) return true;
      return false;
    }
    if (shortcut === "tomorrow") {
      const { year, month, day } = getIstDateParts(date);
      const t = addDays(year, month, day, 1);
      const tomorrow = toDateKey(t.year, t.month, t.day);
      if (event.date === tomorrow) return true;
      if (event.endDate && event.date && event.date <= tomorrow && event.endDate >= tomorrow)
        return true;
      return false;
    }
    if (shortcut === "weekend") {
      const keys = getIstWeekendKeys(date);
      const set = new Set(keys);
      if (event.date && set.has(event.date)) return true;
      if (event.endDate && event.date) {
        for (let i = 0; i < 7; i++) {
          const { year, month, day } = getIstDateParts(date);
          const d = addDays(year, month, day, i);
          const k = toDateKey(d.year, d.month, d.day);
          if (set.has(k) && event.date <= k && event.endDate >= k) return true;
        }
      }
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
