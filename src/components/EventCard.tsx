import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { RecEvent, EventKind } from "@/data/types";
import {
  formatDateRange,
  formatShortDateRange,
  formatTimeRange,
  formatMonthShort,
  formatMonthYear,
} from "@/lib/format";
import { OffsetCard } from "./OffsetCard";
import { Tag } from "./Tag";
import { ShareButton } from "./ShareButton";
import { ScheduleButton } from "./ScheduleButton";
import { CalendarButton } from "./CalendarButton";

const eventKindLabel: Record<EventKind, string> = {
  meetup: "Meetup",
  hackathon: "Hackathon",
  workshop: "Workshop",
  "demo-day": "Demo Day",
  "community-call": "Community Call",
};

export function EventCard({ event, id }: { event: RecEvent; id?: string }) {
  const cardId = id ?? `event-${event.slug}`;
  const hasDate = Boolean(event.date);
  const d = new Date((event.date ?? "") + "T00:00:00Z");
  const end = event.endDate ? new Date(event.endDate + "T00:00:00Z") : null;
  const month = hasDate
    ? d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }).toUpperCase()
    : formatMonthShort(event.dateLabel) || "DATE";
  const sameMonth =
    hasDate &&
    end &&
    d.getUTCMonth() === end.getUTCMonth() &&
    d.getUTCFullYear() === end.getUTCFullYear();
  const dayLabel = hasDate
    ? sameMonth
      ? `${d.getUTCDate()}–${end!.getUTCDate()}`
      : String(d.getUTCDate())
    : "TBA";

  const timeRange = formatTimeRange(event.startTime, event.endTime);
  const undatedMeta = [formatMonthYear(event.dateLabel), "DATE TBA"].filter(Boolean).join(" · ");
  const metaMobile = hasDate
    ? [formatShortDateRange(event.date!, event.endDate), timeRange, event.location]
        .filter(Boolean)
        .join(" · ")
    : [undatedMeta, timeRange, event.location].filter(Boolean).join(" · ");
  const metaDesktop = hasDate
    ? [formatDateRange(event.date!, event.endDate), timeRange, event.location]
        .filter(Boolean)
        .join(" · ")
    : [undatedMeta, timeRange, event.location].filter(Boolean).join(" · ");

  return (
    <OffsetCard
      as="article"
      id={cardId}
      size="sm"
      className="group relative flex scroll-mt-24 flex-col gap-2 rounded-[1.25rem] p-3.5 transition-[transform,box-shadow] duration-150 active:translate-y-0.5 active:shadow-offset-sm motion-reduce:transition-none md:scroll-mt-40 md:rounded-2xl md:p-5 md:duration-200 md:hover:-translate-y-0.5 md:hover:shadow-offset-lg md:focus-within:-translate-y-0.5 md:focus-within:shadow-offset-lg lg:grid lg:grid-cols-[auto_minmax(0,auto)_minmax(0,1fr)_auto] lg:grid-rows-[auto_auto_auto_auto_auto] lg:[grid-template-areas:'date_tags_actions'_'._title_actions'_'._org_actions'_'._desc_actions'_'meta_meta_meta'] lg:gap-x-6 lg:gap-y-2"
    >
      <div className="order-1 flex items-start justify-between gap-2.5 lg:contents">
        <div
          aria-hidden
          className="grid w-[68px] min-h-[58px] place-items-center rounded-lg border-2 border-border bg-lavender py-2.5 leading-none shadow-offset-sm sm:w-[74px] sm:min-h-[62px] sm:py-3 lg:[grid-area:date] lg:w-14 lg:min-h-0 lg:self-start lg:py-1.5"
        >
          <span className="label-mono text-[10px] sm:text-xs">{month}</span>
          <span className="text-base font-extrabold sm:text-lg">{dayLabel}</span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1 lg:[grid-area:tags] lg:flex-row lg:flex-wrap lg:items-start lg:gap-1.5">
          <Tag compact tone="purple">
            {eventKindLabel[event.kind]}
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
        </div>
      </div>

      <h3 className="order-2 line-clamp-2 text-base font-extrabold leading-snug tracking-tight sm:text-lg lg:[grid-area:title] lg:min-w-0">
        <Link
          to="/events/$id"
          params={{ id: event.slug }}
          className="after:absolute after:inset-0 after:content-['']"
        >
          {event.name}
        </Link>
      </h3>

      {event.organizer && (
        <p className="order-3 label-mono text-[11px] text-muted-foreground sm:text-xs lg:[grid-area:org] lg:min-w-0 lg:line-clamp-1">
          Hosted by {event.organizer}
        </p>
      )}

      <p className="order-4 label-mono line-clamp-2 text-[11px] text-muted-foreground sm:text-xs lg:[grid-area:meta] lg:min-w-0">
        <span className="md:hidden">{metaMobile}</span>
        <span className="hidden md:inline">{metaDesktop}</span>
      </p>

      <p className="order-5 line-clamp-2 text-sm leading-snug text-muted-foreground lg:[grid-area:desc] lg:min-w-0 lg:leading-relaxed">
        {event.summary}
      </p>

      <div className="order-6 flex items-center justify-between gap-2.5 lg:[grid-area:actions] lg:flex-col lg:items-end lg:gap-2 lg:justify-start">
        <div className="flex items-center gap-1.5">
          <ScheduleButton event={event} />
          {event.date && <CalendarButton event={event} />}
          <ShareButton title={event.name} slug={event.slug} path={`/events/${event.slug}`} />
        </div>
        {event.url ? (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="label-mono relative z-10 inline-flex min-h-[44px] min-w-[108px] items-center justify-center gap-1 rounded-full border-2 border-border bg-foreground px-3 py-1.5 text-background shadow-offset-sm transition-transform duration-150 active:translate-y-0.5 motion-reduce:transition-none lg:h-auto lg:min-h-0 lg:w-auto lg:justify-start lg:active:translate-y-0"
          >
            RSVP
            <ArrowUpRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </a>
        ) : (
          <span
            title="Details TBA"
            className="label-mono relative z-10 inline-flex min-h-[44px] min-w-[108px] items-center justify-center gap-1 rounded-full border-2 border-dashed border-foreground/40 bg-transparent px-3 py-1.5 text-muted-foreground lg:h-auto lg:min-h-0 lg:w-auto"
          >
            Details TBA
          </span>
        )}
      </div>
    </OffsetCard>
  );
}
