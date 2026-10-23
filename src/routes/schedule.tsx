import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowUpRight, TriangleAlert, X } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionLabel } from "@/components/SectionLabel";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { OffsetCard } from "@/components/OffsetCard";
import { Tag } from "@/components/Tag";
import { Sidequests } from "@/components/Sidequests";
import { ScheduleTools } from "@/components/ScheduleTools";
import { getPublishedEvents } from "@/lib/events-query";
import { useSchedule, type ScheduledEvent } from "@/lib/schedule";
import {
  eventTimeWindow,
  findConflicts,
  formatOverlap,
  parseTimeToMinutes,
  type PlanEvent,
} from "@/lib/schedule-conflicts";
import { formatTimeRange, formatMonthYear } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RecEvent } from "@/data/types";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "My Schedule — Krew3" },
      {
        name: "description",
        content:
          "Your personal Devcon 8 and IBW plan: saved events grouped by day, with time-conflict checks and one-tap removal.",
      },
    ],
  }),
  loader: async () => {
    const events = await getPublishedEvents();
    return { events };
  },
  component: SchedulePage,
});

interface PlanEntry extends PlanEvent {
  location: string;
  organizer: string;
  url: string;
  online: boolean;
  region: string;
  savedAt: string;
  /** Still present in the published directory? */
  live: boolean;
}

function fromLive(event: RecEvent): PlanEntry {
  return {
    slug: event.slug,
    name: event.name,
    date: event.date ?? null,
    dateLabel: event.dateLabel ?? null,
    endDate: event.endDate ?? null,
    startTime: event.startTime ?? null,
    endTime: event.endTime ?? null,
    location: event.location,
    organizer: event.organizer,
    url: event.url,
    online: event.online,
    region: event.region ?? "",
    savedAt: "",
    live: true,
  };
}

function fromSnapshot(snapshot: ScheduledEvent): PlanEntry {
  return {
    slug: snapshot.slug,
    name: snapshot.name,
    date: snapshot.date,
    dateLabel: snapshot.dateLabel,
    endDate: snapshot.endDate,
    startTime: snapshot.startTime,
    endTime: snapshot.endTime,
    location: snapshot.location,
    organizer: snapshot.organizer,
    url: snapshot.url,
    online: snapshot.online,
    region: snapshot.region,
    savedAt: snapshot.savedAt,
    live: false,
  };
}

function sortEntries(entries: PlanEntry[]): PlanEntry[] {
  return [...entries].sort((a, b) => {
    if (!a.date && !b.date) return a.name.localeCompare(b.name);
    if (!a.date) return 1;
    if (!b.date) return -1;
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    const aStart = parseTimeToMinutes(a.startTime);
    const bStart = parseTimeToMinutes(b.startTime);
    if (aStart === null && bStart === null) return a.name.localeCompare(b.name);
    if (aStart === null) return 1;
    if (bStart === null) return -1;
    return aStart - bStart || a.name.localeCompare(b.name);
  });
}

function formatDayHeading(iso: string): { day: string; date: string } {
  const d = new Date(iso + "T00:00:00Z");
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
  const date = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return { day: weekday, date };
}

function SchedulePage() {
  const { events } = Route.useLoaderData();
  const { list, hydrated, remove } = useSchedule();

  const entries = useMemo(() => {
    const liveBySlug = new Map(events.map((event) => [event.slug, event]));
    const merged = list.map((snapshot) => {
      const live = liveBySlug.get(snapshot.slug);
      if (live) return { ...fromLive(live), savedAt: snapshot.savedAt };
      return fromSnapshot(snapshot);
    });
    return sortEntries(merged);
  }, [events, list]);

  const conflicts = useMemo(() => findConflicts(entries), [entries]);

  const conflictSlugs = useMemo(() => {
    const set = new Set<string>();
    for (const pair of conflicts) {
      set.add(pair.a.slug);
      set.add(pair.b.slug);
    }
    return set;
  }, [conflicts]);

  const unknownTiming = useMemo(
    () => entries.filter((entry) => eventTimeWindow(entry) === null).length,
    [entries],
  );

  const groups = useMemo(() => {
    const dated = new Map<string, PlanEntry[]>();
    const undated: PlanEntry[] = [];
    for (const entry of entries) {
      if (entry.date) {
        const bucket = dated.get(entry.date);
        if (bucket) bucket.push(entry);
        else dated.set(entry.date, [entry]);
      } else {
        undated.push(entry);
      }
    }
    const out: { date: string | null; events: PlanEntry[] }[] = [...dated.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, bucket]) => ({ date, events: bucket }));
    if (undated.length) out.push({ date: null, events: undated });
    return out;
  }, [entries]);

  const unavailable = entries.filter((entry) => !entry.live).length;

  return (
    <>
      <PageHero label="My Schedule" title="PLAN THE WEEK.">
        Save events as you browse the directory. Krew3 keeps them on this device — no account, no
        wallet. We flag real time overlaps, but we never assume travel time or move your picks.
      </PageHero>

      <section className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
        {!hydrated ? (
          <EmptyState
            title="Reading your schedule…"
            body="Loading the events you've saved on this device."
            action={null}
          />
        ) : entries.length === 0 ? (
          <div className="flex flex-col gap-6">
            <EmptyState
              title="Your schedule is empty."
              body="Tap the bookmark on any event card to build your personal plan for the week."
              action={
                <Button asChild variant="outline">
                  <Link to="/events" search={{ view: undefined }}>
                    Browse events <ArrowUpRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              }
            />
            <ScheduleTools entries={entries} />
          </div>
        ) : (
          <div className="flex flex-col gap-7">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="label-mono text-muted-foreground">
                {entries.length} saved event{entries.length === 1 ? "" : "s"}
              </p>
              {conflicts.length > 0 && (
                <p className="label-mono flex items-center gap-1.5 text-foreground">
                  <TriangleAlert className="size-3.5" aria-hidden />
                  {conflicts.length} overlap{conflicts.length === 1 ? "" : "s"}
                </p>
              )}
              {unavailable > 0 && (
                <p className="label-mono text-muted-foreground">{unavailable} no longer listed</p>
              )}
            </div>

            <ScheduleTools entries={entries} />

            {conflicts.length > 0 && (
              <OffsetCard tone="lavender" size="sm" className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border-2 border-border bg-card"
                  >
                    <TriangleAlert className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <SectionLabel dot={false} className="text-foreground">
                      Schedule overlap
                    </SectionLabel>
                    <h2 className="mt-1 text-lg font-extrabold tracking-tight">
                      {conflicts.length} time conflict{conflicts.length === 1 ? "" : "s"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      These saved events overlap. Nothing has been removed or reordered.
                    </p>
                    <ul className="mt-3 space-y-2">
                      {conflicts.map((pair) => (
                        <li key={`${pair.a.slug}--${pair.b.slug}`} className="text-sm leading-snug">
                          <ConflictName entry={pair.a} />{" "}
                          <span className="text-muted-foreground">and</span>{" "}
                          <ConflictName entry={pair.b} />{" "}
                          <span className="text-muted-foreground">overlap by</span>{" "}
                          <strong className="font-semibold">{formatOverlap(pair.minutes)}</strong>.
                        </li>
                      ))}
                    </ul>
                    <p className="label-mono mt-3 text-muted-foreground">
                      Travel time is not included. Back-to-back events are not flagged.
                    </p>
                  </div>
                </div>
              </OffsetCard>
            )}

            {unknownTiming > 0 && (
              <p className="text-sm text-muted-foreground">
                {unknownTiming} saved event{unknownTiming === 1 ? " has" : "s have"} no confirmed
                start and end time, so {unknownTiming === 1 ? "it is" : "they are"} not checked for
                conflicts.
              </p>
            )}

            <div className="flex flex-col gap-7">
              {groups.map((group) => (
                <div key={group.date ?? "undated"}>
                  {group.date ? (
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b-2 border-border pb-2">
                      <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                        {formatDayHeading(group.date).day}
                      </h2>
                      <p className="label-mono text-muted-foreground">
                        {formatDayHeading(group.date).date}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b-2 border-border pb-2">
                      <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                        Date TBA
                      </h2>
                      <p className="label-mono text-muted-foreground">
                        {group.events[0]?.dateLabel
                          ? formatMonthYear(group.events[0].dateLabel)
                          : "No confirmed date"}
                      </p>
                    </div>
                  )}

                  <ul className="mt-3 flex flex-col gap-2.5">
                    {group.events.map((entry) => (
                      <li key={entry.slug}>
                        <ScheduleRow
                          entry={entry}
                          conflict={conflictSlugs.has(entry.slug)}
                          onRemove={() => remove(entry.slug)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-border pt-4">
              <p className="text-xs text-muted-foreground sm:text-sm">
                Saved locally in this browser. Clearing site data removes it.
              </p>
              <Button asChild variant="ghost" size="sm">
                <Link to="/events" search={{ view: undefined }}>
                  Add more events <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        )}

        <div className="mt-10 sm:mt-12">
          <Sidequests events={events} />
        </div>
      </section>
    </>
  );
}

function ConflictName({ entry }: { entry: PlanEntry }) {
  if (entry.live) {
    return (
      <Link
        to="/events/$id"
        params={{ id: entry.slug }}
        className="font-semibold underline decoration-2 underline-offset-2 hover:text-primary"
      >
        {entry.name}
      </Link>
    );
  }
  return (
    <span className="font-semibold">
      {entry.name} <span className="text-muted-foreground font-normal">(no longer listed)</span>
    </span>
  );
}

function ScheduleRow({
  entry,
  conflict,
  onRemove,
}: {
  entry: PlanEntry;
  conflict: boolean;
  onRemove: () => void;
}) {
  const timeLabel = entry.startTime
    ? formatTimeRange(entry.startTime, entry.endTime) || "Time TBA"
    : "Time TBA";
  const meta = [entry.organizer, entry.online ? "Online" : entry.location]
    .filter(Boolean)
    .join(" · ");

  return (
    <OffsetCard
      size="sm"
      className={cn("p-3.5 sm:p-4", !entry.live && "bg-muted/60 text-muted-foreground")}
    >
      <div className="flex items-start gap-3">
        <div className="grid w-20 shrink-0 place-items-center rounded-lg border-2 border-border bg-lavender px-1 py-2 leading-tight text-foreground">
          <span className="label-mono text-[9px]">{entry.date ? "TIME" : "DATE"}</span>
          <span className="text-[11px] font-bold">{entry.date ? timeLabel : "TBA"}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {entry.live ? (
              <Link
                to="/events/$id"
                params={{ id: entry.slug }}
                className="text-base font-extrabold leading-snug tracking-tight hover:text-primary"
              >
                {entry.name}
              </Link>
            ) : (
              <span className="text-base font-extrabold leading-snug tracking-tight">
                {entry.name}
              </span>
            )}
            {entry.live && entry.url && (
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="label-mono inline-flex items-center gap-0.5 text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                RSVP <ArrowUpRight className="size-3" aria-hidden />
              </a>
            )}
          </div>

          {meta && <p className="label-mono mt-0.5 truncate text-muted-foreground">{meta}</p>}

          {(conflict || !entry.live) && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {conflict && (
                <Tag compact tone="purple">
                  <TriangleAlert className="mr-1 size-3" aria-hidden /> Time conflict
                </Tag>
              )}
              {!entry.live && (
                <Tag compact tone="ghost">
                  No longer in the directory
                </Tag>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${entry.name} from my schedule`}
          title="Remove from schedule"
          className="press grid size-8 shrink-0 place-items-center rounded-full border-2 border-border bg-card text-foreground shadow-offset-sm hover:bg-destructive hover:text-destructive-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </OffsetCard>
  );
}
