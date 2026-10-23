/**
 * Shareable schedule card — rendered locally on a <canvas>.
 *
 * Privacy: the card contains only event titles, dates, times and the count.
 * No account data, URLs, or free-text notes are drawn, and nothing is uploaded.
 *
 * The layout is measured before the canvas is sized, so long titles wrap and
 * taller schedules grow the image instead of clipping content.
 */

import { formatMonthYear, formatTime, formatTimeRange } from "./format";

export interface CardEvent {
  slug?: string;
  name: string;
  date?: string | null;
  dateLabel?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  region?: string | null;
}

export interface CardGroup {
  date: string | null;
  dateLabel: string | null;
  events: CardEvent[];
}

export interface CardStats {
  count: number;
  dayCount: number;
  place: string;
}

const WIDTH = 1080;
const MARGIN = 84;
const CONTENT_WIDTH = WIDTH - MARGIN * 2;
const DATE_COLUMN_WIDTH = 190;
const COLUMN_GAP = 36;
const EVENT_X = MARGIN + DATE_COLUMN_WIDTH + COLUMN_GAP;
const EVENT_WIDTH = WIDTH - MARGIN - EVENT_X;

const COLORS = {
  cream: "#F7F1E4",
  ink: "#171417",
  purple: "#7A3BEA",
  lavender: "#E7DAFA",
  muted: "#6E6875",
  rule: "rgba(23, 20, 23, 0.14)",
};

const FONT_DISPLAY = '"Space Grotesk", ui-sans-serif, system-ui, sans-serif';
const FONT_MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace';

const font = (weight: number, size: number, family: string) => `${weight} ${size}px ${family}`;

const dayNumber = (date: string) => date.slice(8, 10);
const monthShort = (date: string) =>
  new Date(date + "T00:00:00Z")
    .toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })
    .toUpperCase();
const weekdayShort = (date: string) =>
  new Date(date + "T00:00:00Z")
    .toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })
    .toUpperCase();

function timeLabel(event: CardEvent): string {
  const range = formatTimeRange(event.startTime, event.endTime);
  if (range) return range;
  const start = formatTime(event.startTime);
  return start ? `${start} (end TBA)` : "Time TBA";
}

function compare(a: CardEvent, b: CardEvent): number {
  if (!a.date && !b.date) return a.name.localeCompare(b.name);
  if (!a.date) return 1;
  if (!b.date) return -1;
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  const as = formatTime(a.startTime);
  const bs = formatTime(b.startTime);
  if (!as && !bs) return a.name.localeCompare(b.name);
  if (!as) return 1;
  if (!bs) return -1;
  return as.localeCompare(bs) || a.name.localeCompare(b.name);
}

/** Dated groups in chronological order, then a single "Date TBA" group. */
export function buildCardGroups(events: CardEvent[]): CardGroup[] {
  const groups = new Map<string, CardEvent[]>();
  const undated: CardEvent[] = [];
  for (const event of [...events].sort(compare)) {
    if (event.date) {
      const bucket = groups.get(event.date);
      if (bucket) bucket.push(event);
      else groups.set(event.date, [event]);
    } else {
      undated.push(event);
    }
  }
  const out: CardGroup[] = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, bucket]) => ({ date, dateLabel: null, events: bucket }));
  if (undated.length) out.push({ date: null, dateLabel: null, events: undated });
  return out;
}

export function cardStats(events: CardEvent[]): CardStats {
  const days = new Set(events.map((event) => event.date).filter(Boolean));
  const regions = new Set(
    events
      .map((event) => (event.region ?? "").trim().toLowerCase())
      .filter((region) => region === "mumbai" || region === "goa"),
  );
  const place =
    regions.size === 2
      ? "Mumbai & Goa"
      : regions.size === 1
        ? regions.has("mumbai")
          ? "Mumbai"
          : "Goa"
        : "";
  return { count: events.length, dayCount: days.size, place };
}

/**
 * Greedy word wrap with character-level breaking for very long unbroken names.
 * `measure` is injected so this can be unit-tested without a canvas.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  measure: (line: string) => number,
): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [""];

  const lines: string[] = [];
  let line = "";
  for (const word of clean.split(" ")) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    if (measure(word) <= maxWidth) {
      line = word;
      continue;
    }
    // Break an over-long word rather than letting it overflow the card.
    let chunk = "";
    for (const char of word) {
      if (chunk && measure(chunk + char) > maxWidth) {
        lines.push(chunk);
        chunk = char;
      } else {
        chunk += char;
      }
    }
    line = chunk;
  }
  if (line) lines.push(line);
  return lines;
}

/** Plain-text companion for clipboard fallbacks. */
export function scheduleAsText(events: CardEvent[]): string {
  const stats = cardStats(events);
  const groups = buildCardGroups(events);
  const lines: string[] = ["Krew3 — My Devcon week"];
  const meta = [`${stats.count} event${stats.count === 1 ? "" : "s"}`];
  if (stats.dayCount) meta.push(`${stats.dayCount} day${stats.dayCount === 1 ? "" : "s"}`);
  if (stats.place) meta.push(stats.place);
  lines.push(meta.join(" · "), "");
  for (const group of groups) {
    if (group.date) {
      const date = new Date(group.date + "T00:00:00Z");
      const heading = date
        .toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        })
        .toUpperCase();
      lines.push(heading);
    } else {
      lines.push("DATE TBA");
    }
    for (const event of group.events) {
      lines.push(`• ${timeLabel(event)} — ${event.name}`);
    }
    lines.push("");
  }
  lines.push("Saved on this device · Self-reported, not a verified attendance record.");
  return lines.join("\n");
}

function loadFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return Promise.resolve();
  const timeout = new Promise<void>((resolve) => {
    window.setTimeout(resolve, 1_800);
  });
  return Promise.race([document.fonts.ready.then(() => undefined), timeout]);
}

export interface RenderedCard {
  blob: Blob;
  width: number;
  height: number;
  scale: number;
}

/**
 * Draw the card and return a PNG blob. Height is content-driven; long titles
 * and large schedules increase the image size instead of being clipped.
 */
export async function renderScheduleCard(
  events: CardEvent[],
  options: { scale?: number } = {},
): Promise<RenderedCard> {
  if (typeof document === "undefined") throw new Error("Share cards need a browser.");
  if (events.length === 0) throw new Error("Add at least one event first.");

  const scale = options.scale ?? 2;
  await loadFonts();

  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  if (!measureCtx) throw new Error("Canvas is not available in this browser.");

  const groups = buildCardGroups(events).map((group) => ({
    ...group,
    dateLabel:
      group.dateLabel ??
      (group.date ? null : (group.events.find((event) => event.dateLabel)?.dateLabel ?? null)),
    rows: group.events.map((event) => {
      measureCtx.font = font(600, 30, FONT_DISPLAY);
      return {
        event,
        time: timeLabel(event),
        lines: wrapText(event.name, EVENT_WIDTH, (line) => measureCtx.measureText(line).width),
      };
    }),
  }));

  const stats = cardStats(events);

  // Vertical rhythm, measured in CSS pixels before scaling.
  const headlineFont = font(700, 72, FONT_DISPLAY);
  measureCtx.font = headlineFont;
  const headlineLines = wrapText(
    "My Devcon week.",
    CONTENT_WIDTH,
    (line) => measureCtx.measureText(line).width,
  );

  const headerTop = 84;
  const headlineTop = headerTop + 148;
  const headlineLineHeight = 84;
  const statsTop = headlineTop + headlineLines.length * headlineLineHeight + 12;
  const ruleTop = statsTop + 46;
  const groupsTop = ruleTop + 52;

  const groupHeights = groups.map((group) => {
    measureCtx.font = font(600, 30, FONT_DISPLAY);
    const rowsHeight = group.rows.reduce((total, row) => {
      const lineHeight = 38;
      return total + 24 + row.lines.length * lineHeight + 28;
    }, 0);
    return Math.max(104, rowsHeight - 28);
  });
  const groupsHeight = groupHeights.reduce((total, height) => total + height + 44, 0);

  const footerHeight = 118;
  const height = Math.ceil(groupsTop + groupsHeight + 24 + footerHeight + MARGIN);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(WIDTH * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.scale(scale, scale);
  ctx.textBaseline = "top";

  // Canvas background.
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 0, WIDTH, height);

  // Monogram + wordmark.
  ctx.fillStyle = COLORS.purple;
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(MARGIN, headerTop, 64, 64, 16);
    ctx.fill();
  } else {
    ctx.fillRect(MARGIN, headerTop, 64, 64);
  }
  ctx.fillStyle = COLORS.cream;
  ctx.font = font(700, 26, FONT_DISPLAY);
  ctx.textAlign = "center";
  ctx.fillText("K3", MARGIN + 32, headerTop + 19);
  ctx.textAlign = "left";

  ctx.fillStyle = COLORS.ink;
  ctx.font = font(700, 30, FONT_DISPLAY);
  ctx.fillText("KREW3", MARGIN + 84, headerTop + 14);

  ctx.fillStyle = COLORS.muted;
  ctx.font = font(600, 15, FONT_MONO);
  ctx.textAlign = "right";
  ctx.fillText("MY SCHEDULE", WIDTH - MARGIN, headerTop + 22);
  ctx.textAlign = "left";

  // Kicker + headline.
  ctx.fillStyle = COLORS.purple;
  ctx.font = font(600, 16, FONT_MONO);
  ctx.fillText("MY DEVCON WEEK", MARGIN, headerTop + 104);

  ctx.fillStyle = COLORS.ink;
  ctx.font = headlineFont;
  headlineLines.forEach((line, index) => {
    ctx.fillText(line, MARGIN, headlineTop + index * headlineLineHeight);
  });

  // Stats.
  const metaParts = [`${stats.count} event${stats.count === 1 ? "" : "s"}`];
  if (stats.dayCount) metaParts.push(`${stats.dayCount} day${stats.dayCount === 1 ? "" : "s"}`);
  if (stats.place) metaParts.push(stats.place);
  ctx.fillStyle = COLORS.muted;
  ctx.font = font(600, 19, FONT_MONO);
  ctx.fillText(metaParts.join("  ·  "), MARGIN, statsTop);

  // Purple rule.
  ctx.fillStyle = COLORS.purple;
  ctx.fillRect(MARGIN, ruleTop, 104, 8);

  // Date groups.
  let y = groupsTop;
  groups.forEach((group, groupIndex) => {
    const groupTop = y;
    if (group.date) {
      ctx.fillStyle = COLORS.ink;
      ctx.font = font(700, 54, FONT_DISPLAY);
      ctx.fillText(dayNumber(group.date), MARGIN, groupTop);

      ctx.fillStyle = COLORS.purple;
      ctx.font = font(600, 17, FONT_MONO);
      ctx.fillText(monthShort(group.date), MARGIN, groupTop + 60);

      ctx.fillStyle = COLORS.muted;
      ctx.font = font(600, 15, FONT_MONO);
      ctx.fillText(weekdayShort(group.date), MARGIN, groupTop + 84);
    } else {
      ctx.fillStyle = COLORS.ink;
      ctx.font = font(700, 40, FONT_DISPLAY);
      ctx.fillText("TBA", MARGIN, groupTop + 6);

      ctx.fillStyle = COLORS.purple;
      ctx.font = font(600, 15, FONT_MONO);
      ctx.fillText("DATE", MARGIN, groupTop + 56);

      const month = formatMonthYear(group.dateLabel);
      if (month) {
        ctx.fillStyle = COLORS.muted;
        ctx.font = font(600, 14, FONT_MONO);
        ctx.fillText(month, MARGIN, groupTop + 78);
      }
    }

    let rowY = groupTop;
    for (const row of group.rows) {
      const hasTime = Boolean(formatTime(row.event.startTime));
      ctx.fillStyle = hasTime ? COLORS.purple : COLORS.muted;
      ctx.font = font(600, 17, FONT_MONO);
      ctx.fillText(row.time, EVENT_X, rowY);

      ctx.fillStyle = COLORS.ink;
      ctx.font = font(600, 30, FONT_DISPLAY);
      row.lines.forEach((line, lineIndex) => {
        ctx.fillText(line, EVENT_X, rowY + 24 + lineIndex * 38);
      });

      rowY += 24 + row.lines.length * 38 + 28;
    }

    y = Math.max(groupTop + 104, rowY - 28) + 44;

    if (groupIndex < groups.length - 1) {
      ctx.strokeStyle = COLORS.rule;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(MARGIN, y - 22);
      ctx.lineTo(WIDTH - MARGIN, y - 22);
      ctx.stroke();
    }
  });

  // Footer.
  const footerTop = height - MARGIN - footerHeight;
  ctx.strokeStyle = COLORS.rule;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN, footerTop);
  ctx.lineTo(WIDTH - MARGIN, footerTop);
  ctx.stroke();

  ctx.fillStyle = COLORS.ink;
  ctx.font = font(700, 17, FONT_MONO);
  ctx.fillText("krew3.site", MARGIN, footerTop + 24);

  ctx.fillStyle = COLORS.muted;
  ctx.font = font(500, 14, FONT_MONO);
  ctx.textAlign = "right";
  ctx.fillText("Saved on this device", WIDTH - MARGIN, footerTop + 26);
  ctx.textAlign = "left";

  ctx.fillStyle = COLORS.muted;
  ctx.font = font(500, 15, FONT_DISPLAY);
  ctx.fillText("Self-reported plan, not a verified attendance record.", MARGIN, footerTop + 62);
  if (stats.place) {
    ctx.textAlign = "right";
    ctx.fillText("Times as announced · IST", WIDTH - MARGIN, footerTop + 62);
    ctx.textAlign = "left";
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Could not encode the share card."));
    }, "image/png");
  });

  return { blob, width: WIDTH, height, scale };
}
