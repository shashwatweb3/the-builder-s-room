import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { RecEvent } from "@/data/types";
import { formatShortDateRange, formatTimeRange, formatMonthShort } from "@/lib/format";
import { Tag } from "./Tag";
import { ShareButton } from "./ShareButton";
import { ScheduleButton } from "./ScheduleButton";
import { CalendarButton } from "./CalendarButton";
import { cn } from "@/lib/utils";

const eventKindLabel: Record<string, string> = {
  meetup: "Meetup",
  hackathon: "Hackathon",
  workshop: "Workshop",
  "demo-day": "Demo Day",
  "community-call": "Community Call",
};

export function MobileCompactEventCard({ event, id }: { event: RecEvent; id?: string }) {
  const cardId = id ?? `event-${event.slug}`;
  const hasDate = Boolean(event.date);
  const d = new Date((event.date ?? "") + "T00:00:00Z");
  const end = event.endDate ? new Date(event.endDate + "T00:00:00Z") : null;
  const month = hasDate
    ? d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }).toUpperCase()
    : formatMonthShort(event.dateLabel) || "DATE";
  const dayLabel =
    hasDate &&
    end &&
    d.getUTCMonth() === end.getUTCMonth() &&
    d.getUTCFullYear() === end.getUTCFullYear()
      ? `${d.getUTCDate()}–${end.getUTCDate()}`
      : hasDate
        ? String(d.getUTCDate())
        : "TBA";

  const timeRange = formatTimeRange(event.startTime, event.endTime);
  const meta = hasDate
    ? [formatShortDateRange(event.date!, event.endDate), timeRange, event.location]
        .filter(Boolean)
        .join(" · ")
    : [event.dateLabel ? event.dateLabel.replace(/-/g, ".") : "DATE TBA", timeRange, event.location]
        .filter(Boolean)
        .join(" · ");

  return (
    <article
      id={cardId}
      className={cn(
        "relative flex items-start gap-2.5 rounded-2xl border-2 border-border bg-card p-2.5 shadow-offset-sm transition-[transform,box-shadow] duration-150 active:translate-y-0.5 active:shadow-offset-sm motion-reduce:transition-none",
      )}
    >
      <div
        aria-hidden
        className="grid w-[58px] min-h-[52px] shrink-0 place-items-center rounded-lg border-2 border-border bg-lavender py-2 leading-none shadow-offset-sm"
      >
        <span className="label-mono text-[9px]">{month}</span>
        <span className="text-sm font-extrabold">{dayLabel}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 min-w-0 text-sm font-extrabold leading-snug tracking-tight">
            <Link
              to="/events/$id"
              params={{ id: event.slug }}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {event.name}
            </Link>
          </h3>
          <div className="relative z-10 flex items-center gap-0.5">
            <ScheduleButton event={event} />
            {event.date && <CalendarButton event={event} />}
            <ShareButton title={event.name} slug={event.slug} path={`/events/${event.slug}`} />
          </div>
        </div>
        <p className="label-mono truncate text-[10px] text-muted-foreground">{meta}</p>
        <div className="flex flex-wrap items-center gap-1">
          <Tag compact tone="purple">
            {eventKindLabel[event.kind] || "Meetup"}
          </Tag>
          <Tag compact tone="ghost">
            {event.online ? "Online" : "In person"}
          </Tag>
          {event.region === "mumbai" && (
            <Tag compact tone="ghost">
              Mumbai
            </Tag>
          )}
          {event.region === "goa" && (
            <Tag compact tone="ghost">
              Goa
            </Tag>
          )}
          {event.organizer && (
            <span className="label-mono ml-0.5 truncate text-[9px] text-muted-foreground">
              · {event.organizer}
            </span>
          )}
        </div>
        <div className="mt-0.5">
          {event.url ? (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="label-mono relative z-10 inline-flex min-h-[36px] items-center gap-1 rounded-full border-2 border-border bg-foreground px-2.5 py-1 text-[11px] text-background shadow-offset-sm"
            >
              RSVP
              <ArrowUpRight className="size-3" aria-hidden />
            </a>
          ) : (
            <span className="label-mono relative z-10 inline-flex min-h-[36px] items-center gap-1 rounded-full border-2 border-dashed border-foreground/40 px-2.5 py-1 text-[11px] text-muted-foreground">
              Details TBA
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
