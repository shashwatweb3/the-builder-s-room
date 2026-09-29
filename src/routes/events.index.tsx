import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createServerClient } from "@supabase/ssr";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { AccessGate } from "@/components/AccessGate";
import { BuilderBaseCredit } from "@/components/BuilderBaseCredit";
import { SectionLabel } from "@/components/SectionLabel";
import { EventCard } from "@/components/EventCard";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { JoinCTA } from "@/components/JoinCTA";
import { MobileFilterSheet } from "@/components/MobileFilterSheet";
import { VenueEntryCard } from "@/components/VenueEntryCard";
import { formatShortDate, formatShortDateRange, formatTimeRange } from "@/lib/format";
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
    endDate: row.end_date ? (row.end_date.split("T")[0] ?? row.end_date) : null,
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
      { property: "og:url", content: "https://www.krew3.site/events" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://www.krew3.site/venue-og-x-v1.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:type", content: "image/jpeg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://www.krew3.site/venue-og-x-v1.jpg" },
      {
        name: "twitter:image:alt",
        content: "Krew3 — Devcon 8 Mumbai side events and community hub",
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
  const [filterOpen, setFilterOpen] = useState(false);

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

  const nextUp = useMemo(() => {
    const today = new Date();
    const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    return (
      results.find((e) => {
        const end = e.endDate
          ? new Date(e.endDate + "T00:00:00Z").getTime()
          : new Date(e.date + "T00:00:00Z").getTime();
        return end >= todayUTC;
      }) ?? results[0]
    );
  }, [results]);

  const dateRail = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of results) {
      if (!seen.has(e.date)) seen.set(e.date, e.slug);
    }
    return [...seen.entries()];
  }, [results]);

  const jumpToDate = (slug: string) => {
    document
      .getElementById(`event-${slug}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const activeFilterLabel = FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? "FILTER";

  const viewCounts = useMemo(() => {
    const goa = events.filter((e) => e.region === "goa").length;
    return {
      devcon: events.length - goa,
      "pre-devcon": goa,
    };
  }, [events]);

  return (
    <AccessGate>
      <section className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-10">
        {/* Mobile segmented control */}
        <div
          role="tablist"
          aria-label="Event view"
          className="flex gap-1 rounded-full border-2 border-border bg-card p-1 shadow-offset-sm sm:hidden"
        >
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
                  "label-mono min-h-9 flex-1 rounded-full px-3 text-[12px] transition-colors duration-200",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label} · {viewCounts[option.value]}
              </button>
            );
          })}
        </div>

        {/* Desktop tabs */}
        <div role="tablist" aria-label="Event view" className="hidden flex-wrap gap-2 sm:flex">
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
                  "label-mono press min-h-11 shrink-0 rounded-full border-2 border-border px-5 py-2.5 text-[0.95rem] shadow-offset-sm",
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

        {/* Desktop count + note */}
        <div className="mt-3 hidden flex-wrap items-baseline gap-x-3 gap-y-1 sm:flex">
          <p className="label-mono text-xs text-muted-foreground">{results.length} EVENTS</p>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Events are listed by their respective organizers. Krew3 is the directory, not the host.
          </p>
        </div>

        {/* Mobile count + filter trigger */}
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label="Open filters"
          className="press mt-2.5 flex min-h-11 w-full items-center justify-between gap-3 rounded-full border-2 border-border bg-card px-4 py-2 shadow-offset-sm sm:hidden"
        >
          <span className="label-mono text-[13px]">{results.length} EVENTS</span>
          <span className="label-mono flex items-center gap-1.5 text-[13px]">
            {activeFilterLabel}
            <span aria-hidden className="text-muted-foreground">
              ▾
            </span>
          </span>
        </button>
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground sm:hidden">
          Events are listed by their respective organizers. Krew3 is the directory, not the host.
        </p>

        {/* Desktop filter pills */}
        <div className="mt-2.5 hidden sm:block">
          <FilterBar
            compact
            options={options}
            value={filter}
            onChange={(v) => setFilter(v as EventFilter)}
            ariaLabel="Filter events"
          />
        </div>

        <div className="mt-5 border-t-2 border-border pt-4 sm:mt-10 sm:pt-8">
          <SectionLabel>{meta.eyebrow}</SectionLabel>
          <h1 className="mt-2 text-[clamp(2rem,9.5vw,2.5rem)] leading-[0.95] font-extrabold tracking-tight sm:text-[clamp(2rem,5vw,3rem)]">
            {meta.title}
          </h1>
          <div className="mt-2.5 flex flex-wrap items-baseline gap-x-4 gap-y-1 sm:mt-3">
            <p className="max-w-2xl text-sm leading-snug text-muted-foreground sm:text-lg">
              {meta.copy}
            </p>
            {meta.note && <p className="label-mono text-muted-foreground">{meta.note}</p>}
          </div>
          <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
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

          <BuilderBaseCredit className="mt-5 sm:mt-6" />
        </div>

        <div className="mt-5 sm:mt-8">
          {results.length ? (
            <div className="flex flex-col gap-3 sm:gap-4">
              {nextUp && (
                <Link
                  to="/events/$id"
                  params={{ id: nextUp.slug }}
                  className="group flex items-center gap-3 rounded-2xl border-2 border-border bg-foreground p-4 text-background shadow-offset-sm transition-transform duration-150 active:translate-y-0.5 active:shadow-offset-sm sm:hidden"
                >
                  <span className="label-mono grid size-11 shrink-0 place-items-center rounded-xl border-2 border-background/20 bg-background/10 text-[10px] text-background/80">
                    NEXT
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="label-mono block text-[10px] text-background/70">
                      {formatShortDateRange(nextUp.date, nextUp.endDate)} ·{" "}
                      {formatTimeRange(nextUp.startTime, nextUp.endTime)}
                    </span>
                    <span className="mt-0.5 block truncate text-base font-extrabold tracking-tight">
                      {nextUp.name}
                    </span>
                  </span>
                  <ArrowRight
                    className="size-5 shrink-0 transition-transform duration-150 group-hover:translate-x-1"
                    aria-hidden
                  />
                </Link>
              )}

              {dateRail.length > 1 && (
                <div
                  className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:hidden"
                  aria-label="Jump to a date"
                >
                  {dateRail.map(([date, slug]) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => jumpToDate(slug)}
                      className="label-mono press shrink-0 snap-start rounded-full border-2 border-border bg-card px-3 py-1.5 text-[11px] shadow-offset-sm"
                    >
                      {formatShortDate(date).toUpperCase()}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid gap-3 sm:gap-4">
                {results.map((e) => (
                  <EventCard key={e.id} event={e} id={`event-${e.slug}`} />
                ))}
              </div>
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

      <VenueEntryCard />

      <section className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <JoinCTA />
      </section>

      <MobileFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        options={options}
        value={filter}
        onSelect={(v) => setFilter(v as EventFilter)}
      />
    </AccessGate>
  );
}
