import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { RecEvent, EventKind } from "@/data/types";

const eventKindLabel: Record<EventKind, string> = {
  meetup: "Meetup",
  hackathon: "Hackathon",
  workshop: "Workshop",
  "demo-day": "Demo Day",
  "community-call": "Community Call",
};
import { formatDate, formatTimeRange } from "@/lib/format";
import { OffsetCard } from "./OffsetCard";
import { Tag } from "./Tag";
import { ShareButton } from "./ShareButton";

export function EventCard({ event }: { event: RecEvent }) {
  const d = new Date(event.date + "T00:00:00Z");
  const timeRange = formatTimeRange(event.startTime, event.endTime);
  return (
    <OffsetCard
      as="article"
      interactive
      className="group relative flex h-full flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6"
    >
      <div
        aria-hidden
        className="grid w-16 shrink-0 place-items-center rounded-xl border-2 border-border bg-lavender py-2 shadow-offset-sm"
      >
        <span className="label-mono">
          {d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
        </span>
        <span className="text-2xl leading-none font-extrabold">{d.getUTCDate()}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="purple">{eventKindLabel[event.kind]}</Tag>
          <Tag tone="ghost">{event.online ? "Online" : "In person"}</Tag>
          {event.region === "mumbai" && <Tag tone="ghost">Mumbai</Tag>}
          {event.region === "goa" && <Tag tone="ghost">Goa</Tag>}
        </div>
        <h3 className="mt-3 text-xl font-extrabold tracking-tight">
          <Link
            to="/events/$id"
            params={{ id: event.slug }}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {event.name}
          </Link>
        </h3>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">{event.summary}</p>
        <p className="label-mono mt-3 text-muted-foreground">
          {formatDate(event.date)}
          {timeRange ? ` · ${timeRange}` : ""}
          {event.location ? ` · ${event.location}` : ""}
        </p>
        {event.organizer && (
          <p className="label-mono mt-1 text-muted-foreground">Hosted by {event.organizer}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3 self-start">
        <ShareButton title={event.name} slug={event.slug} path={`/events/${event.slug}`} />
        {event.url ? (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="label-mono relative z-10 inline-flex items-center gap-1 rounded-full border-2 border-border bg-background px-3 py-1.5 shadow-offset-sm"
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
