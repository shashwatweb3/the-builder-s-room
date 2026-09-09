import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { RecEvent, EventKind } from "@/data/types";
import { formatDateRange, formatShortDateRange, formatTimeRange } from "@/lib/format";
import { OffsetCard } from "./OffsetCard";
import { Tag } from "./Tag";
import { ShareButton } from "./ShareButton";

const eventKindLabel: Record<EventKind, string> = {
  meetup: "Meetup",
  hackathon: "Hackathon",
  workshop: "Workshop",
  "demo-day": "Demo Day",
  "community-call": "Community Call",
};

export function EventCard({ event }: { event: RecEvent }) {
  const d = new Date(event.date + "T00:00:00Z");
  const end = event.endDate ? new Date(event.endDate + "T00:00:00Z") : null;
  const month = d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }).toUpperCase();
  const sameMonth =
    end && d.getUTCMonth() === end.getUTCMonth() && d.getUTCFullYear() === end.getUTCFullYear();
  const dayLabel = sameMonth ? `${d.getUTCDate()}–${end!.getUTCDate()}` : String(d.getUTCDate());

  const timeRange = formatTimeRange(event.startTime, event.endTime);
  const metaMobile = [formatShortDateRange(event.date, event.endDate), timeRange, event.location]
    .filter(Boolean)
    .join(" · ");
  const metaDesktop = [formatDateRange(event.date, event.endDate), timeRange, event.location]
    .filter(Boolean)
    .join(" · ");

  return (
    <OffsetCard
      as="article"
      size="sm"
      className="group relative flex flex-col gap-3 p-4 transition-[transform,box-shadow] duration-200 sm:grid sm:grid-cols-[auto_auto_minmax(0,1fr)_auto] sm:grid-rows-[auto_auto_auto] sm:[grid-template-areas:'date_tags_title_actions'_'.org_desc_actions'_'meta_meta_meta_meta'] sm:gap-x-6 sm:gap-y-2 sm:p-5 sm:hover:-translate-y-0.5 sm:hover:shadow-offset sm:focus-within:-translate-y-0.5 sm:focus-within:shadow-offset"
    >
      <div className="order-1 flex items-start justify-between gap-3 sm:contents">
        <div
          aria-hidden
          className="grid w-14 shrink-0 place-items-center rounded-lg border-2 border-border bg-lavender py-1.5 leading-none shadow-offset-sm sm:[grid-area:date]"
        >
          <span className="label-mono">{month}</span>
          <span className="text-lg font-extrabold">{dayLabel}</span>
        </div>

        <div className="flex flex-col items-end gap-1.5 sm:[grid-area:tags] sm:flex-row sm:flex-wrap sm:items-start">
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

      <h3 className="order-2 line-clamp-3 text-lg font-extrabold leading-snug tracking-tight sm:[grid-area:title] sm:line-clamp-2">
        <Link
          to="/events/$id"
          params={{ id: event.slug }}
          className="after:absolute after:inset-0 after:content-['']"
        >
          {event.name}
        </Link>
      </h3>

      {event.organizer && (
        <p className="order-3 label-mono text-muted-foreground sm:[grid-area:org]">
          Hosted by {event.organizer}
        </p>
      )}

      <p className="order-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:[grid-area:desc] sm:line-clamp-2">
        {event.summary}
      </p>

      <p className="order-5 label-mono text-muted-foreground sm:[grid-area:meta]">
        <span className="sm:hidden">{metaMobile}</span>
        <span className="hidden sm:inline">{metaDesktop}</span>
      </p>

      <div className="order-6 flex items-center justify-between gap-3 sm:[grid-area:actions] sm:flex-col sm:items-end sm:gap-2 sm:justify-start">
        <ShareButton title={event.name} slug={event.slug} path={`/events/${event.slug}`} />
        {event.url ? (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="label-mono relative z-10 inline-flex items-center gap-1 rounded-full border-2 border-border bg-foreground px-3 py-1.5 text-background shadow-offset-sm"
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
            className="label-mono inline-flex items-center gap-1 rounded-full border-2 border-dashed border-foreground/40 bg-transparent px-3 py-1.5 text-muted-foreground"
          >
            Details TBA
          </span>
        )}
      </div>
    </OffsetCard>
  );
}
