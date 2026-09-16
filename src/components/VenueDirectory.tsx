import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AREA_OPTIONS,
  BUDGET_OPTIONS,
  CAPACITY_OPTIONS,
  EVENT_TYPE_OPTIONS,
  VENUES,
  VENUE_SORT_OPTIONS,
  type Venue,
  type VenueArea,
  type VenueBudgetTier,
  type VenueCapacityTier,
  type VenueEventType,
} from "@/data/venues";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { FilterBar } from "./FilterBar";
import { SectionLabel } from "./SectionLabel";
import { VenueCard } from "./VenueCard";
import { VenueDetailModal } from "./VenueDetailModal";

type VenueAreaFilter = "all" | VenueArea;
type VenueCapacityFilter = "all" | VenueCapacityTier;
type VenueBudgetFilter = "all" | VenueBudgetTier | "tbd";
type VenueTypeFilter = "all" | VenueEventType;
type VenueSort = (typeof VENUE_SORT_OPTIONS)[number]["value"];

const sorters: Record<VenueSort, (a: Venue, b: Venue) => number> = {
  recommended: (a, b) => a.rank - b.rank,
  nearest: (a, b) => a.distanceKmValue - b.distanceKmValue,
  budget: (a, b) => a.budgetValue - b.budgetValue,
  capacity: (a, b) => b.capacityValue - a.capacityValue,
};

export function VenueDirectory() {
  const [area, setArea] = useState<VenueAreaFilter>("all");
  const [capacity, setCapacity] = useState<VenueCapacityFilter>("all");
  const [budget, setBudget] = useState<VenueBudgetFilter>("all");
  const [eventType, setEventType] = useState<VenueTypeFilter>("all");
  const [sort, setSort] = useState<VenueSort>("recommended");
  const [selected, setSelected] = useState<Venue | null>(null);

  const results = useMemo(() => {
    const filtered = VENUES.filter((v) => {
      if (area !== "all" && v.area !== area) return false;
      if (capacity !== "all" && v.capacityTier !== capacity) return false;
      if (budget === "tbd") {
        // no venue advertises a TBD tier for now — keep TBD filter honest
        return false;
      }
      if (budget !== "all" && v.budget !== budget) return false;
      if (eventType !== "all" && !v.eventTypes.includes(eventType)) return false;
      return true;
    });
    return [...filtered].sort(sorters[sort]);
  }, [area, capacity, budget, eventType, sort]);

  return (
    <section id="venues" className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10">
      <div className="border-t-2 border-border pt-10 sm:pt-12">
        <SectionLabel>Plan a Devcon side event?</SectionLabel>
        <h2 className="mt-2 text-[clamp(2rem,5vw,3rem)] leading-[0.95] font-extrabold tracking-tight">
          Need a place to host it?
        </h2>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            Finding a venue for a Devcon side event can be harder than planning the event itself.
            Here's a community-curated shortlist of rooms, halls, lawns and lounges around Mumbai's
            Devcon scene — sized by capacity, budget and distance from JWCC.
          </p>
          <p className="label-mono text-muted-foreground">Community-curated. Not sponsored.</p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            href="#venue-directory"
            className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-border bg-primary px-6 text-base font-semibold text-primary-foreground shadow-offset press"
          >
            Explore venues
            <ArrowRight className="size-4" aria-hidden />
          </a>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Prices, availability and booking terms change fast — confirm directly with each venue.
          </p>
        </div>
      </div>

      <div id="venue-directory" className="mt-12 scroll-mt-28">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-xl font-extrabold tracking-tight sm:text-2xl">
            DEVCON SIDE-EVENT VENUES
          </h3>
          <p className="label-mono text-muted-foreground">{results.length} VENUES</p>
        </div>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Ranked by how useful they actually are for a side-event team — proximity, capacity, budget
          and flexibility before hype. Built by the Krew, for the Krew.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <FilterBar
          compact
          options={AREA_OPTIONS}
          value={area}
          onChange={(v) => setArea(v as VenueAreaFilter)}
          ariaLabel="Filter venues by area"
        />

        <div className="space-y-3 border-t-2 border-dashed border-foreground/15 pt-3">
          <FilterBar
            compact
            options={CAPACITY_OPTIONS}
            value={capacity}
            onChange={(v) => setCapacity(v as VenueCapacityFilter)}
            ariaLabel="Filter venues by capacity"
          />
          <FilterBar
            compact
            options={BUDGET_OPTIONS}
            value={budget}
            onChange={(v) => setBudget(v as VenueBudgetFilter)}
            ariaLabel="Filter venues by budget"
          />
          <FilterBar
            compact
            options={EVENT_TYPE_OPTIONS}
            value={eventType}
            onChange={(v) => setEventType(v as VenueTypeFilter)}
            ariaLabel="Filter venues by event type"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-foreground/15 pt-3">
          <FilterBar
            compact
            options={VENUE_SORT_OPTIONS}
            value={sort}
            onChange={(v) => setSort(v as VenueSort)}
            ariaLabel="Sort venues"
          />
          {(area !== "all" || capacity !== "all" || budget !== "all" || eventType !== "all") && (
            <button
              type="button"
              onClick={() => {
                setArea("all");
                setCapacity("all");
                setBudget("all");
                setEventType("all");
              }}
              className={cn(
                "label-mono press min-h-8 shrink-0 rounded-full border-2 border-border px-3 py-1.5 shadow-offset-sm",
                "bg-card hover:bg-lavender/50",
              )}
            >
              RESET FILTERS
            </button>
          )}
        </div>
      </div>

      <div className="mt-6">
        {results.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((venue) => (
              <VenueCard key={venue.id} venue={venue} onSelect={() => setSelected(venue)} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No venues match those filters."
            body="Loosen capacity, budget or event type — the directory is small by design."
            action={
              <button
                type="button"
                onClick={() => {
                  setArea("all");
                  setCapacity("all");
                  setBudget("all");
                  setEventType("all");
                }}
                className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-5 text-base font-semibold text-foreground shadow-offset transition-colors hover:bg-lavender/40"
              >
                Reset filters →
              </button>
            }
          />
        )}
      </div>

      <p className="mt-6 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground sm:items-center">
        <MapPin className="mt-0.5 size-3.5 shrink-0 sm:mt-0" aria-hidden />
        Everything here is community-sourced and independently verified as best we can. We are not
        affiliated with, paid by, or sponsored by these venues. Want a place added? DM{" "}
        <a
          href="https://t.me/Lucky_sc0"
          target="_blank"
          rel="noopener noreferrer"
          className="mx-1 font-semibold text-primary underline decoration-2 underline-offset-2 hover:opacity-80"
        >
          @Lucky_sc0
        </a>
        on Telegram.
      </p>

      <a
        href="https://t.me/Lucky_sc0"
        target="_blank"
        rel="noopener noreferrer"
        className="label-mono mt-8 inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-card px-4 py-2 shadow-offset-sm press"
      >
        Suggest a venue
        <ArrowUpRight className="size-3.5" aria-hidden />
      </a>

      {selected && <VenueDetailModal venue={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
