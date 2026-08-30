import { ArrowUpRight } from "lucide-react";
import type { RecEvent } from "@/data/types";
import { eventKindLabel } from "@/data/events";
import { formatDate } from "@/lib/format";
import { OffsetCard } from "./OffsetCard";
import { Tag } from "./Tag";

export function EventCard({ event }: { event: RecEvent }) {
  const d = new Date(event.date + "T00:00:00Z");
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
        <span className="text-2xl leading-none font-extrabold">
          {d.getUTCDate()}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="purple">{eventKindLabel[event.kind]}</Tag>
          <Tag tone="ghost">{event.online ? "Online" : "In person"}</Tag>
        </div>
        <h3 className="mt-3 text-xl font-extrabold tracking-tight">
          <a
            href={event.url}
            target="_blank"
            rel="noreferrer noopener"
            className="after:absolute after:inset-0 after:content-['']"
          >
            {event.name}
          </a>
        </h3>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {event.summary}
        </p>
        <p className="label-mono mt-3 text-muted-foreground">
          {formatDate(event.date)} · {event.time} · {event.location}
        </p>
        <p className="label-mono mt-1 text-muted-foreground">
          Hosted by {event.organizer}
        </p>
      </div>

      <span className="label-mono inline-flex shrink-0 items-center gap-1 self-start rounded-full border-2 border-border bg-background px-3 py-1.5 shadow-offset-sm">
        RSVP
        <ArrowUpRight
          className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden
        />
      </span>
    </OffsetCard>
  );
}
