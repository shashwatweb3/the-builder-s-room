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
import { VenueCard } from "./VenueCard";

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

  const results = useMemo(() => {
    const filtered = VENUES.filter((v) => {
      if (area !== "all" && v.area !== area) return false;
      if (capacity !== "all" && v.capacityTier !== capacity) return false;
      if (budget === "tbd") {
        return false;
      }
      if (budget !== "all" && v.budget !== budget) return false;
      if (eventType !== "all" && !v.eventTypes.includes(eventType)) return false;
      return true;
    });
    return [...filtered].sort(sorters[sort]);
  }, [area, capacity, budget, eventType, sort]);

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
          DEVCON SIDE-EVENT VENUES
        </h2>
        <p className="label-mono text-muted-foreground">{results.length} VENUES</p>
      </div>
      <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">
        Ranked by how useful they are for a side-event team — proximity, capacity, budget and
        flexibility before hype.
      </p>

      <div className="mt-6 space-y-3">
        <FilterBar
          compact
          options={AREA_OPTIONS}
          value={area}
          onChange={(v) => setArea(v as VenueAreaFilter)}
          ariaLabel="Filter venues by location"
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
              <VenueCard key={venue.slug} venue={venue} />
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
    </section>
  );
}
