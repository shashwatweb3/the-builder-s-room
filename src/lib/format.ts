export const formatDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

export const formatShortDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

/** '5–6 NOV' for same-month multi-day events, otherwise a short date (no year). */
export const formatShortDateRange = (start: string, end?: string | null) => {
  const short = formatShortDate(start);
  if (!end || end === start) return short;
  const s = new Date(start + "T00:00:00Z");
  const e = new Date(end + "T00:00:00Z");
  if (s.getUTCMonth() === e.getUTCMonth() && s.getUTCFullYear() === e.getUTCFullYear()) {
    const month = s.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }).toUpperCase();
    return `${s.getUTCDate()}–${e.getUTCDate()} ${month}`;
  }
  return `${short} – ${formatShortDate(end)}`;
};

/** '5–6 NOV 2026' for same-month multi-day events, otherwise a plain date. */
export const formatDateRange = (start: string, end?: string | null) => {
  const s = new Date(start + "T00:00:00Z");
  const startLabel = formatDate(start);
  if (!end || end === start) return startLabel;
  const e = new Date(end + "T00:00:00Z");
  if (s.getUTCMonth() === e.getUTCMonth() && s.getUTCFullYear() === e.getUTCFullYear()) {
    const month = s.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }).toUpperCase();
    return `${s.getUTCDate()}–${e.getUTCDate()} ${month} ${s.getUTCFullYear()}`;
  }
  return `${startLabel} – ${formatDate(end)}`;
};

/** Days between now and an ISO date. Negative means it already passed. */
export const daysUntil = (iso: string) => {
  if (!iso) return Infinity;
  const target = new Date(iso + "T00:00:00Z").getTime();
  if (Number.isNaN(target)) return Infinity;
  const now = Date.now();
  return Math.ceil((target - now) / 86_400_000);
};

export const deadlineLabel = (iso: string) => {
  const d = daysUntil(iso);
  if (d < 0) return "Closed";
  if (d === 0) return "Closes today";
  if (d === 1) return "1 day left";
  if (d <= 45) return `${d} days left`;
  return formatDate(iso);
};

export const isClosingSoon = (iso: string) => {
  const d = daysUntil(iso);
  return d >= 0 && d <= 14;
};

/** 'HH:MM' (or '') from a Postgres time value like "19:00:00". */
export const formatTime = (value: string | null | undefined) => {
  if (!value) return "";
  const parts = value.split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return value;
};

export const formatTimeRange = (
  start: string | null | undefined,
  end: string | null | undefined,
) => {
  const s = formatTime(start);
  if (!s) return "";
  const e = formatTime(end);
  return e ? `${s}–${e}` : s;
};
