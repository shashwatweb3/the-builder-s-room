import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { PageHero } from "@/components/PageHero";
import { OffsetCard } from "@/components/OffsetCard";
import { Dot } from "@/components/StatusBadge";
import { OpportunityGrid } from "@/components/OpportunityGrid";
import {
  OpportunityFilters,
  defaultFilters,
  type OpportunityFilterState,
} from "@/components/OpportunityFilters";
import { JoinCTA } from "@/components/JoinCTA";
import { opportunities } from "@/data/opportunities";
import { daysUntil, isClosingSoon } from "@/lib/format";

export const Route = createFileRoute("/opportunities")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Opportunities — The Rec Room" },
      {
        name: "description",
        content:
          "A living collection of jobs, hackathons, residencies and grants for people who build.",
      },
      { property: "og:title", content: "Opportunities — The Rec Room" },
      {
        property: "og:description",
        content:
          "Jobs, hackathons, residencies and grants worth applying to, updated constantly.",
      },
    ],
  }),
  component: OpportunitiesPage,
});

const PAGE_SIZE = 6;

function OpportunitiesPage() {
  const { category } = Route.useSearch();
  const [filters, setFilters] = useState<OpportunityFilterState>({
    ...defaultFilters,
    category: category ?? "all",
  });
  const [visible, setVisible] = useState(PAGE_SIZE);

  const results = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const list = opportunities.filter((o) => {
      if (filters.category !== "all" && o.category !== filters.category)
        return false;
      if (filters.remote && !o.remote) return false;
      if (filters.paid && !o.paid) return false;
      if (filters.closingSoon && !isClosingSoon(o.deadline)) return false;
      if (filters.location !== "any" && o.location !== filters.location)
        return false;
      if (filters.ecosystem !== "any" && o.ecosystem !== filters.ecosystem)
        return false;
      if (filters.skill !== "any" && !o.skills.includes(filters.skill))
        return false;
      if (q) {
        const haystack = [
          o.title,
          o.organization,
          o.summary,
          o.description,
          o.location,
          ...o.tags,
          ...o.skills,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (filters.sort === "popular") return b.popularity - a.popularity;
      if (filters.sort === "deadline")
        return daysUntil(a.deadline) - daysUntil(b.deadline);
      return b.postedAt.localeCompare(a.postedAt);
    });
  }, [filters]);

  const shown = results.slice(0, visible);

  return (
    <>
      <PageHero
        label="Opportunities"
        title="Things worth applying to."
        aside={
          <OffsetCard size="sm" className="px-5 py-4">
            <p className="label-mono flex items-center gap-2">
              <Dot /> Live board
            </p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight">
              {opportunities.length}
            </p>
            <p className="label-mono text-muted-foreground">open right now</p>
          </OffsetCard>
        }
      >
        A living collection of jobs, hackathons, residencies and grants for
        people who build.
      </PageHero>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <OpportunityFilters
          state={filters}
          onChange={(next) => {
            setFilters(next);
            setVisible(PAGE_SIZE);
          }}
          resultCount={results.length}
        />

        <div className="mt-10">
          <OpportunityGrid items={shown} />
        </div>

        {visible < results.length && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
            >
              Load more
            </Button>
            <p className="label-mono text-muted-foreground">
              Showing {shown.length} of {results.length}
            </p>
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <JoinCTA />
      </section>
    </>
  );
}
