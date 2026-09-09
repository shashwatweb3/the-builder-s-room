import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createServerClient } from "@supabase/ssr";
import { useMemo, useState } from "react";
import { PageHero } from "@/components/PageHero";
import { SectionLabel } from "@/components/SectionLabel";
import { OffsetCard } from "@/components/OffsetCard";
import { EventCard } from "@/components/EventCard";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { JoinCTA } from "@/components/JoinCTA";
import type { RecEvent } from "@/data/types";

type EventRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  long_description: string | null;
  event_date: string;
  end_date: string | null;
  location: string;
  is_online: boolean;
  meeting_url: string | null;
  registration_url: string | null;
  image_url: string | null;
  featured: boolean;
  status: "draft" | "published" | "cancelled" | "completed";
  organizer: string;
  start_time: string | null;
  end_time: string | null;
  region: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
};

type EventFilter =
  "all" | "mumbai" | "goa" | "side-events" | "devcon" | "ibw" | "residencies" | "hacker-houses";

const FILTER_OPTIONS: { value: EventFilter; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "mumbai", label: "MUMBAI" },
  { value: "goa", label: "GOA" },
  { value: "side-events", label: "SIDE EVENTS" },
  { value: "devcon", label: "DEVCON" },
  { value: "ibw", label: "IBW" },
  { value: "residencies", label: "RESIDENCIES" },
  { value: "hacker-houses", label: "HACKER HOUSES" },
];

function matchesFilter(event: RecEvent, filter: EventFilter) {
  switch (filter) {
    case "mumbai":
      return event.region === "mumbai";
    case "goa":
      return event.region === "goa";
    case "side-events":
      return event.category === "side-event";
    case "devcon":
      return event.category === "devcon";
    case "ibw":
      return event.category === "ibw";
    case "residencies":
      return event.category === "residency";
    case "hacker-houses":
      return event.category === "hacker-house";
    default:
      return true;
  }
}

const getPublishedEvents = createServerFn({ method: "GET" }).handler(async () => {
  if (!import.meta.env["VITE_SUPABASE_URL"] || !import.meta.env["VITE_SUPABASE_ANON_KEY"]) {
    return [] as RecEvent[];
  }
  const request = getRequest();
  const supabase = createServerClient(
    import.meta.env["VITE_SUPABASE_URL"],
    import.meta.env["VITE_SUPABASE_ANON_KEY"],
    {
      cookies: {
        getAll() {
          const h = request?.headers.get("cookie") ?? "";
          return h.split(";").map((c) => {
            const [name, ...rest] = c.trim().split("=");
            return { name: name ?? "", value: rest.join("=") };
          });
        },
        setAll() {},
      },
    },
  );

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("event_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch events:", error);
    return [] as RecEvent[];
  }

  return ((data ?? []) as EventRow[]).map((row): RecEvent => ({
    id: row.id,
    slug: row.slug,
    name: row.title,
    kind: "meetup",
    date: row.event_date.split("T")[0] ?? row.event_date,
    time: "",
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location,
    online: row.is_online,
    organizer: row.organizer ?? "",
    summary: row.description,
    url: row.registration_url || row.meeting_url || "",
    region: row.region ?? "",
    category: row.category ?? "",
  }));
});

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Devcon 8 Mumbai Side Events | Krew3" },
      {
        name: "description",
        content:
          "Discover community events, side events, residencies and hacker houses around Devcon 8 and India Blockchain Week in Mumbai and Goa.",
      },
      { property: "og:title", content: "Devcon 8 Mumbai Side Events | Krew3" },
      {
        property: "og:description",
        content:
          "Discover community events, side events, residencies and hacker houses around Devcon 8 and India Blockchain Week in Mumbai and Goa.",
      },
    ],
  }),
  loader: async () => {
    const events = await getPublishedEvents();
    return { events };
  },
  component: EventsPage,
});

function sortEvents(events: RecEvent[]) {
  // Server returns event_date ASC then created_at ASC. created_at was tuned in the
  // migration to encode same-date chronological order (start time where available).
  // Stable sort by date preserves that ordering within arrivals.
  return [...events].sort((a, b) => a.date.localeCompare(b.date));
}

function EventSection({
  label,
  title,
  copy,
  note,
  count,
  events,
}: {
  label: string;
  title: string;
  copy: string;
  note?: string;
  count: number;
  events: RecEvent[];
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <SectionLabel>{label}</SectionLabel>
        <p className="label-mono text-muted-foreground">{count} events</p>
      </div>
      <h2 className="mt-3 text-[clamp(2rem,5vw,3.25rem)] leading-[0.95] font-extrabold tracking-tight">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">{copy}</p>
      {note && <p className="label-mono mt-2 text-muted-foreground">{note}</p>}
      <div className="mt-8 grid gap-6">
        {events.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
    </div>
  );
}

function EventsPage() {
  const { events } = Route.useLoaderData();
  const [filter, setFilter] = useState<EventFilter>("all");

  const counts = useMemo(() => {
    const map = new Map<EventFilter, number>(FILTER_OPTIONS.map((o) => [o.value, 0]));
    for (const event of events) {
      for (const option of FILTER_OPTIONS) {
        if (matchesFilter(event, option.value)) {
          map.set(option.value, (map.get(option.value) ?? 0) + 1);
        }
      }
    }
    return map;
  }, [events]);

  const options = useMemo(
    () =>
      FILTER_OPTIONS.map((o) => ({
        value: o.value,
        label: o.label,
        count: counts.get(o.value) ?? 0,
      })),
    [counts],
  );

  const goaEvents = useMemo(
    () => sortEvents(events.filter((e) => e.region === "goa" && matchesFilter(e, filter))),
    [events, filter],
  );

  const mumbaiEvents = useMemo(
    () => sortEvents(events.filter((e) => e.region === "mumbai" && matchesFilter(e, filter))),
    [events, filter],
  );

  const goaCount = events.filter((e) => e.region === "goa").length;
  const mumbaiCount = events.filter((e) => e.region === "mumbai").length;
  const hasResults = goaEvents.length > 0 || mumbaiEvents.length > 0;

  return (
    <>
      <PageHero
        label="DEVCON 8 • MUMBAI, INDIA 🇮🇳"
        title="SIDE EVENTS."
        aside={
          <OffsetCard size="sm" className="px-5 py-4">
            <p className="text-4xl font-extrabold tracking-tight">{events.length}</p>
            <p className="label-mono mt-1 text-muted-foreground">COMMUNITY EVENTS</p>
            <p className="label-mono mt-1 text-muted-foreground">
              {goaCount} PRE-DEVCON · {mumbaiCount} MUMBAI
            </p>
          </OffsetCard>
        }
      >
        <p>A community list of events happening around Devcon 8 and India Blockchain Week.</p>
        <p className="label-mono mt-4 text-muted-foreground">
          {events.length} EVENTS. PRE-DEVCON → DEVCON 8.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Want to add an opportunity or event? DM{" "}
          <a
            href="https://t.me/Lucky_sc0"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline decoration-2 underline-offset-2 hover:opacity-80"
          >
            @Lucky_sc0
          </a>{" "}
          on Telegram.
        </p>
      </PageHero>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <p className="text-sm text-muted-foreground">
          Events are listed by their respective organizers. Krew3 is the directory, not the host.
        </p>

        <div className="mt-4">
          <FilterBar
            options={options}
            value={filter}
            onChange={(v) => setFilter(v as EventFilter)}
            ariaLabel="Filter events"
          />
        </div>

        <div className="mt-10">
          {hasResults ? (
            <div className="space-y-12">
              {goaEvents.length > 0 && (
                <EventSection
                  label="PRE-DEVCON"
                  title="THE WARM-UP."
                  copy="Builder residencies, hacker houses, fellowships and events leading into Devcon."
                  note="BANGALORE → GOA → MUMBAI"
                  count={goaEvents.length}
                  events={goaEvents}
                />
              )}
              {mumbaiEvents.length > 0 && (
                <div className="border-t-2 border-border pt-12">
                  <EventSection
                    label="DEVCON 8 • MUMBAI 🇮🇳"
                    title="THE MAIN EVENT."
                    copy="Devcon, India Blockchain Week and the wider community taking over Mumbai."
                    count={mumbaiEvents.length}
                    events={mumbaiEvents}
                  />
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="Nothing on the calendar yet."
              body="More soon."
              action={
                <a
                  href="https://t.me/Lucky_sc0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-5 text-base font-semibold text-foreground shadow-offset transition-colors hover:bg-lavender/40"
                >
                  Add an event →
                </a>
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
