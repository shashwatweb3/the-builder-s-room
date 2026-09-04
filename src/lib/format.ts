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
