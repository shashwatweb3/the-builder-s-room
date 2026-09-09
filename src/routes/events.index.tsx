import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createServerClient } from "@supabase/ssr";
import { useMemo, useState } from "react";
import { SectionLabel } from "@/components/SectionLabel";
import { EventCard } from "@/components/EventCard";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { JoinCTA } from "@/components/JoinCTA";
import { cn } from "@/lib/utils";
import type { RecEvent } from "@/data/types";

type EventView = "devcon" | "pre-devcon";

const EVENT_VIEWS: { value: EventView; label: string }[] = [
  { value: "devcon", label: "DEVCON 8" },
  { value: "pre-devcon", label: "PRE-DEVCON" },
];

const EVENT_VIEW_META: Record<
  EventView,
  { eyebrow: string; title: string; copy: string; note?: string }
> = {
  devcon: {
    eyebrow: "DEVCON 8 • MUMBAI, INDIA 🇮🇳",
    title: "SIDE EVENTS.",
    copy: "A community list of events happening around Devcon 8 and India Blockchain Week.",
  },
  "pre-devcon": {
    eyebrow: "PRE-DEVCON",
    title: "THE WARM-UP.",
    copy: "Builder residencies, hacker houses, fellowships and events leading into Devcon.",
    note: "BANGALORE → GOA → MUMBAI",
  },
};

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

const VIEW_FILTERS: Record<EventView, EventFilter[]> = {
  devcon: ["all", "mumbai", "side-events", "devcon", "ibw"],
  "pre-devcon": ["all", "goa", "residencies", "hacker-houses"],
};

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
  validateSearch: (search: Record<string, unknown>) => ({
    view: search["view"] === "pre-devcon" ? ("pre-devcon" as EventView) : undefined,
  }),
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

function EventsPage() {
  const { events } = Route.useLoaderData();
  const { view: rawView } = Route.useSearch();
  const navigate = useNavigate();
  const view: EventView = rawView ?? "devcon";
  const meta = EVENT_VIEW_META[view];
  const activeRegion = view === "devcon" ? "mumbai" : "goa";

  const [filter, setFilter] = useState<EventFilter>("all");

  const switchView = (next: EventView) => {
    setFilter("all");
    if (next !== view) {
      navigate({ to: "/events", search: { view: next } });
    }
  };

  const scoped = useMemo(
    () => events.filter((e) => e.region === activeRegion),
    [events, activeRegion],
  );

  const counts = useMemo(() => {
    const map = new Map<EventFilter, number>(FILTER_OPTIONS.map((o) => [o.value, 0]));
    for (const event of scoped) {
      for (const option of FILTER_OPTIONS) {
        if (matchesFilter(event, option.value)) {
          map.set(option.value, (map.get(option.value) ?? 0) + 1);
        }
      }
    }
    return map;
  }, [scoped]);

  const options = useMemo(
    () =>
      VIEW_FILTERS[view]
        .map((value) => ({
          value,
          label: FILTER_OPTIONS.find((o) => o.value === value)?.label ?? value,
          count: counts.get(value) ?? 0,
        }))
        .filter((o) => o.count > 0),
    [counts, view],
  );

  const results = useMemo(
    () => sortEvents(scoped.filter((e) => matchesFilter(e, filter))),
    [scoped, filter],
  );

  const viewCounts = useMemo(() => {
    const goa = events.filter((e) => e.region === "goa").length;
    return {
      devcon: events.length - goa,
      "pre-devcon": goa,
    };
  }, [events]);

  return (
    <>
      <section className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-10">
        <div role="tablist" aria-label="Event view" className="flex flex-wrap gap-2">
          {EVENT_VIEWS.map((option) => {
            const active = view === option.value;
            return (
              <button
                key={option.value}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => switchView(option.value)}
                className={cn(
                  "label-mono press min-h-11 shrink-0 rounded-full border-2 border-border px-5 py-2.5 shadow-offset-sm",
                  active ? "bg-foreground text-background" : "bg-card hover:bg-lavender/50",
                )}
              >
                {option.label}
                <span className={cn("ml-1.5", active ? "opacity-70" : "text-muted-foreground")}>
                  · {viewCounts[option.value]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="label-mono text-muted-foreground">{results.length} EVENTS</p>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Events are listed by their respective organizers. Krew3 is the directory, not the host.
          </p>
        </div>

        <div className="mt-2.5">
          <FilterBar
            compact
            options={options}
            value={filter}
            onChange={(v) => setFilter(v as EventFilter)}
            ariaLabel="Filter events"
          />
        </div>

        <div className="mt-10 border-t-2 border-border pt-8">
          <SectionLabel>{meta.eyebrow}</SectionLabel>
          <h1 className="mt-2 text-[clamp(2rem,5vw,3rem)] leading-[0.95] font-extrabold tracking-tight">
            {meta.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">{meta.copy}</p>
            {meta.note && <p className="label-mono text-muted-foreground">{meta.note}</p>}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
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
        </div>

        <div className="mt-8">
          {results.length ? (
            <div className="grid gap-6">
              {results.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
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
