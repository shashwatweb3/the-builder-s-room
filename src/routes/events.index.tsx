import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createServerClient } from "@supabase/ssr";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { BuilderBaseCredit } from "@/components/BuilderBaseCredit";
import { SectionLabel } from "@/components/SectionLabel";
import { EventCard } from "@/components/EventCard";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { JoinCTA } from "@/components/JoinCTA";
import { MobileFilterSheet } from "@/components/MobileFilterSheet";
import { EventsTelegramPopup } from "@/components/EventsTelegramPopup";
import { VenueEntryCard } from "@/components/VenueEntryCard";
import { MobileQuickActionDock } from "@/components/MobileQuickActionDock";
import {
  MobileEventListToggle,
  type MobileEventViewMode,
} from "@/components/MobileEventListToggle";
import { MobileCompactEventCard } from "@/components/MobileCompactEventCard";
import { formatShortDate, formatMonthYear } from "@/lib/format";
import { findNextUpcomingEvent } from "@/lib/next-up";
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
  event_date: string | null;
  date_label: string | null;
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
    .order("event_date", { ascending: true, nullsFirst: false })
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
    date: row.event_date ? (row.event_date.split("T")[0] ?? row.event_date) : null,
    dateLabel: row.date_label ?? null,
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
  // Server returns event_date ASC (undated last) then created_at ASC. created_at was
  // tuned in the migration to encode same-date chronological order (start time where
  // available). Undated events sort after every dated event; stable sort preserves the
  // rest.
  return [...events].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });
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
  const [pinnedDate, setPinnedDate] = useState<string | null>(null);
  const [mobileViewMode, setMobileViewMode] = useState<MobileEventViewMode>("detailed");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const dateRailRef = useRef<HTMLDivElement>(null);
  const nextUpRef = useRef<HTMLAnchorElement>(null);

  const switchView = (next: EventView) => {
    setFilter("all");
    try {
      setPinnedDate(null);
    } catch {
      /* ignore */
    }
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

  const results = useMemo(() => {
    try {
      return sortEvents(scoped.filter((e) => matchesFilter(e, filter)));
    } catch {
      return sortEvents(scoped);
    }
  }, [scoped, filter]);

  const nextUp = useMemo(() => {
    return findNextUpcomingEvent(results);
  }, [results]);

  const dateRail = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of results) {
      if (!e.date) continue;
      if (!seen.has(e.date)) seen.set(e.date, e.slug);
    }
    return [...seen.entries()];
  }, [results]);

  const jumpToDate = (slug: string) => {
    document
      .getElementById(`event-${slug}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 600);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("krew3:events:mobile-view");
      if (saved === "compact" || saved === "detailed") {
        setMobileViewMode(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("krew3:events:mobile-view", mobileViewMode);
    } catch {
      /* ignore */
    }
  }, [mobileViewMode]);

  const activeFilterLabel = FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? "FILTER";

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
        <div className="lg:sticky lg:top-[82px] lg:z-40 lg:-mx-10 lg:border-b-2 lg:border-border lg:bg-background lg:px-10 lg:py-3">
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
                    "label-mono press min-h-[44px] flex-1 rounded-full px-3 text-[11px] transition-colors duration-150 motion-reduce:transition-none",
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
                    "label-mono press min-h-12 shrink-0 rounded-full border-2 border-border px-6 py-2.5 text-base shadow-offset-sm transition-colors duration-200",
                    active
                      ? "bg-foreground text-background"
                      : "bg-card text-muted-foreground hover:bg-lavender/50 hover:text-foreground",
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
        </div>

        {/* Desktop count + note */}
        <div className="mt-3 hidden flex-wrap items-baseline gap-x-3 gap-y-1 sm:flex">
          <p className="label-mono text-xs text-muted-foreground">{results.length} EVENTS</p>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Events are listed by their respective organizers. Krew3 is the directory, not the host.
          </p>
        </div>

        {/* Mobile count + filter trigger */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 sm:hidden">
          <p className="label-mono text-[12px] text-muted-foreground">{results.length} EVENTS</p>
          <div className="flex items-center gap-2">
            <MobileEventListToggle mode={mobileViewMode} onChange={setMobileViewMode} />
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              aria-label="Open filters"
              className="press flex min-h-[44px] items-center justify-between gap-2 rounded-full border-2 border-border bg-card px-3.5 py-2 shadow-offset-sm"
            >
              <span className="label-mono text-[12px]">{activeFilterLabel}</span>
              <span aria-hidden className="text-muted-foreground">
                ▾
              </span>
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground sm:hidden">
          Events are listed by their respective organizers. Krew3 is the directory, not the host.
        </p>

        <div className="mt-2.5 hidden sm:block">
          <FilterBar
            compact
            options={options}
            value={filter}
            onChange={(v) => setFilter(v as EventFilter)}
            ariaLabel="Filter events"
          />
        </div>

        <div className="mt-3 border-t-2 border-border pt-3 sm:mt-7 sm:pt-6">
          <SectionLabel>{meta.eyebrow}</SectionLabel>
          <h1 className="mt-1.5 text-[clamp(2rem,10vw,2.5rem)] leading-[0.95] font-extrabold tracking-tight sm:mt-2 sm:text-[clamp(2rem,5vw,3rem)]">
            {meta.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 sm:mt-3">
            <p className="max-w-2xl text-sm leading-snug text-muted-foreground sm:text-lg">
              {meta.copy}
            </p>
            {meta.note && <p className="label-mono text-muted-foreground">{meta.note}</p>}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground sm:mt-2 sm:text-sm">
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

          <BuilderBaseCredit className="mt-4 sm:mt-6" />
        </div>

        <div className="mt-3 sm:mt-6">
          {results.length ? (
            <div className="flex flex-col gap-2.5 sm:gap-4">
              {nextUp && (
                <Link
                  ref={nextUpRef}
                  to="/events/$id"
                  params={{ id: nextUp.slug }}
                  className="group flex items-stretch overflow-hidden rounded-2xl border-2 border-border bg-foreground text-background shadow-offset-sm transition-[transform,box-shadow] duration-150 active:translate-y-0.5 active:shadow-offset-sm motion-reduce:transition-none sm:hover:-translate-y-0.5 sm:hover:shadow-offset"
                >
                  <span className="label-mono flex w-[78px] shrink-0 flex-col justify-center border-r-2 border-background/15 px-2.5 py-2.5 sm:w-[150px] sm:px-5 sm:py-4">
                    <span className="text-[9px] text-background/70 sm:text-[10px]">NEXT UP</span>
                    <span className="mt-0.5 block text-lg font-extrabold leading-none tracking-tight sm:mt-1 sm:text-3xl">
                      {nextUp.date
                        ? formatShortDate(nextUp.date).toUpperCase()
                        : formatMonthYear(nextUp.dateLabel) || "TBA"}
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-2 px-2.5 py-2.5 sm:gap-3 sm:px-5 sm:py-4">
                    <span className="min-w-0">
                      <span className="line-clamp-2 block text-sm font-extrabold tracking-tight leading-snug sm:line-clamp-1 sm:text-lg">
                        {nextUp.name}
                      </span>
                      <span className="label-mono mt-0.5 block truncate text-[10px] text-background/80 sm:text-xs">
                        {[nextUp.organizer, nextUp.location].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    {nextUp.url && (
                      <span
                        aria-hidden
                        className="label-mono flex shrink-0 items-center gap-1 rounded-full border-2 border-background/25 px-2.5 py-1 text-[10px] transition-colors group-hover:border-background sm:px-3 sm:py-1.5 sm:text-[11px]"
                      >
                        RSVP ↗
                      </span>
                    )}
                  </span>
                </Link>
              )}

              {!nextUp && (
                <OffsetCard size="sm" className="p-4 sm:p-5">
                  <p className="label-mono text-muted-foreground">NEXT UP</p>
                  <p className="mt-1 text-base font-extrabold tracking-tight sm:text-lg">
                    No upcoming events right now.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Check back when organizers add the next date.
                  </p>
                </OffsetCard>
              )}

              {dateRail.length > 1 && (
                <div
                  ref={dateRailRef}
                  className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:gap-2"
                  aria-label="Jump to a date"
                >
                  {dateRail.map(([date, slug]) => {
                    const active = (pinnedDate ?? nextUp?.date ?? dateRail[0]?.[0]) === date;
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => {
                          setPinnedDate(date);
                          jumpToDate(slug);
                          const el = dateRailRef.current;
                          const btn = el?.querySelector(
                            `button[data-date="${date}"]`,
                          ) as HTMLElement | null;
                          if (btn && el) {
                            const left = btn.offsetLeft - el.offsetLeft;
                            el.scrollTo({ left: Math.max(0, left - 12), behavior: "smooth" });
                          }
                        }}
                        data-date={date}
                        className={cn(
                          "label-mono press min-h-[44px] shrink-0 snap-start rounded-full border-2 border-border px-3 py-1.5 text-[11px] transition-colors duration-150 motion-reduce:transition-none lg:px-3.5",
                          active
                            ? "bg-foreground text-background"
                            : "bg-card text-muted-foreground hover:bg-lavender/50 hover:text-foreground",
                        )}
                      >
                        {formatShortDate(date).toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              )}

              <div
                key={view}
                className={cn(
                  "rise-in sm:gap-4 lg:gap-5",
                  mobileViewMode === "compact"
                    ? "flex flex-col gap-2 sm:hidden"
                    : "grid grid-cols-1 gap-3 sm:hidden",
                )}
              >
                {results
                  .filter((e) => !(nextUp && results.length > 1 && e.id === nextUp.id))
                  .map((e) =>
                    mobileViewMode === "compact" ? (
                      <MobileCompactEventCard key={e.id} event={e} id={`event-${e.slug}`} />
                    ) : (
                      <EventCard key={e.id} event={e} id={`event-${e.slug}`} />
                    ),
                  )}
              </div>
              <div
                key={`${view}-desktop`}
                className="hidden sm:grid sm:grid-cols-1 md:grid-cols-2 sm:gap-4 lg:gap-5"
              >
                {results
                  .filter((e) => !(nextUp && results.length > 1 && e.id === nextUp.id))
                  .map((e) => (
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

      <MobileQuickActionDock
        onOpenSearch={() => {
          const btn = document.querySelector(
            '[aria-label="Open search"]',
          ) as HTMLButtonElement | null;
          if (btn) btn.click();
          else window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenFilters={() => setFilterOpen(true)}
      />

      {showBackToTop && (
        <button
          type="button"
          onClick={() => {
            if (nextUpRef.current) {
              nextUpRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="press fixed bottom-[calc(env(safe-area-inset-bottom)+86px)] right-3 z-[60] flex min-h-[44px] items-center gap-1.5 rounded-full border-2 border-border bg-foreground px-3 py-1.5 text-background shadow-offset-lg sm:hidden motion-reduce:transition-none"
          aria-label="Go to next event or top"
        >
          <ArrowUp className="size-4" aria-hidden />
          <span className="label-mono text-[11px]">Next event</span>
        </button>
      )}

      <div className="pb-[calc(env(safe-area-inset-bottom)+90px)] sm:pb-0" />

      <EventsTelegramPopup />
    </>
  );
}
