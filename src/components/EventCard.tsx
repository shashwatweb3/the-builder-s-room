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

export function EventCard({ event, id }: { event: RecEvent; id?: string }) {
  const cardId = id ?? `event-${event.slug}`;
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
      id={cardId}
      size="sm"
      className="group relative flex scroll-mt-24 flex-col gap-2.5 rounded-[1.5rem] p-4 transition-[transform,box-shadow] duration-150 active:translate-y-0.5 active:shadow-offset-sm md:grid md:scroll-mt-40 md:grid-cols-[auto_auto_minmax(0,1fr)_auto] md:grid-rows-[auto_auto_auto] md:[grid-template-areas:'date_tags_title_actions'_'.org_desc_actions'_'meta_meta_meta_meta'] md:gap-x-6 md:gap-y-2 md:rounded-2xl md:p-5 md:duration-200 md:hover:-translate-y-0.5 md:hover:shadow-offset-lg md:focus-within:-translate-y-0.5 md:focus-within:shadow-offset-lg"
    >
      <div className="order-1 flex items-start justify-between gap-3 md:contents">
        <div
          aria-hidden
          className="grid w-[74px] min-h-[62px] place-items-center rounded-lg border-2 border-border bg-lavender py-3 leading-none shadow-offset-sm md:[grid-area:date] md:w-14 md:min-h-0 md:py-1.5"
        >
          <span className="label-mono">{month}</span>
          <span className="text-lg font-extrabold">{dayLabel}</span>
        </div>

        <div className="flex flex-col items-end gap-1 md:[grid-area:tags] md:flex-row md:flex-wrap md:items-start md:gap-1.5">
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

      <h3 className="order-2 line-clamp-2 text-lg font-extrabold leading-snug tracking-tight md:[grid-area:title]">
        <Link
          to="/events/$id"
          params={{ id: event.slug }}
          className="after:absolute after:inset-0 after:content-['']"
        >
          {event.name}
        </Link>
      </h3>

      {event.organizer && (
        <p className="order-3 label-mono text-muted-foreground md:[grid-area:org]">
          Hosted by {event.organizer}
        </p>
      )}

      <p className="order-4 label-mono line-clamp-2 text-muted-foreground md:[grid-area:meta]">
        <span className="md:hidden">{metaMobile}</span>
        <span className="hidden md:inline">{metaDesktop}</span>
      </p>

      <p className="order-5 line-clamp-2 text-sm leading-snug text-muted-foreground md:[grid-area:desc] md:leading-relaxed">
        {event.summary}
      </p>

      <div className="order-6 flex items-center justify-between gap-3 md:[grid-area:actions] md:flex-col md:items-end md:gap-2 md:justify-start">
        <ShareButton title={event.name} slug={event.slug} path={`/events/${event.slug}`} />
        {event.url ? (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="label-mono relative z-10 inline-flex h-[44px] w-[118px] items-center justify-center gap-1 rounded-full border-2 border-border bg-foreground px-3 py-1.5 text-background shadow-offset-sm md:h-auto md:w-auto md:justify-start"
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
            className="label-mono relative z-10 inline-flex h-[44px] w-[118px] items-center justify-center gap-1 rounded-full border-2 border-dashed border-foreground/40 bg-transparent px-3 py-1.5 text-muted-foreground md:h-auto md:w-auto"
          >
            Details TBA
          </span>
        )}
      </div>
    </OffsetCard>
  );
}
