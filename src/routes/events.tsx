import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionLabel } from "@/components/SectionLabel";
import { OffsetCard } from "@/components/OffsetCard";
import { Dot } from "@/components/StatusBadge";
import { EventCard } from "@/components/EventCard";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { JoinCTA } from "@/components/JoinCTA";
import { events } from "@/data/events";
import type { EventKind } from "@/data/types";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — The Rec Room" },
      {
        name: "description",
        content:
          "Community sessions, workshops, meetups, demo days and build nights. Come hang out.",
      },
      { property: "og:title", content: "Events — The Rec Room" },
      {
        property: "og:description",
        content: "Learn something. Meet someone. Workshops, meetups and more.",
      },
    ],
  }),
  component: EventsPage,
});

const kindLabels: { value: EventKind | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "meetup", label: "Meetups" },
  { value: "workshop", label: "Workshops" },
  { value: "community-call", label: "Community calls" },
  { value: "demo-day", label: "Demo days" },
  { value: "hackathon", label: "Hackathons" },
];

function EventsPage() {
  const [filter, setFilter] = useState<EventKind | "all">("all");

  const results = useMemo(
    () =>
      events
        .filter((e) => filter === "all" || e.kind === filter)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [filter],
  );

  const online = events.filter((e) => e.online).length;

  return (
    <>
      <PageHero
        label="Events"
        title="Come hang out."
        aside={
          <OffsetCard size="sm" className="px-5 py-4">
            <p className="label-mono flex items-center gap-2">
              <Dot /> On the calendar
            </p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight">{events.length}</p>
            <p className="label-mono text-muted-foreground">
              {online} online · {events.length - online} in person
            </p>
          </OffsetCard>
        }
      >
        Workshops, community calls, meetups, demo days and build sessions. The learning half of the
        room.
      </PageHero>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionLabel>What's on</SectionLabel>
            <h2 className="mt-4 text-[clamp(1.75rem,4vw,3rem)] leading-tight font-extrabold tracking-tight">
              Pick a night to show up to.
            </h2>
          </div>
          <Button asChild variant="outline" size="lg">
            <Link to="/submit">
              Host an event <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>

        <FilterBar
          ariaLabel="Filter events by type"
          className="mt-8"
          value={filter}
          onChange={(v) => setFilter(v as EventKind | "all")}
          options={kindLabels}
        />

        <div className="mt-10">
          {results.length ? (
            <div className="grid gap-6">
              {results.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No events like that yet."
              body="Someone should fix that. Host the first one."
              action={
                <Button asChild variant="outline">
                  <Link to="/submit">Host an event →</Link>
                </Button>
              }
            />
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <JoinCTA />
      </section>
    </>
  );
}
