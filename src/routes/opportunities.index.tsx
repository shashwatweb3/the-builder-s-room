import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/Button";
import { PageHero } from "@/components/PageHero";
import { OffsetCard } from "@/components/OffsetCard";
import { Tag } from "@/components/Tag";
import { StatusBadge } from "@/components/StatusBadge";
import { SaveButton } from "@/components/SaveButton";
import { Dot } from "@/components/StatusBadge";
import {
  OpportunityFilters,
  defaultFilters,
  type OpportunityFilterState,
} from "@/components/OpportunityFilters";
import { JoinCTA } from "@/components/JoinCTA";
import { opportunities, categoryMeta } from "@/data/opportunities";
import { ambassadorPrograms, programTypeLabel } from "@/data/ambassadors";
import { daysUntil, isClosingSoon, deadlineLabel } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/opportunities/")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search["category"] === "string" ? (search["category"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Opportunities — The Rec Room" },
      {
        name: "description",
        content:
          "Jobs, hackathons, residencies, grants and ambassador programs for people who build.",
      },
      { property: "og:title", content: "Opportunities — The Rec Room" },
      {
        property: "og:description",
        content: "Jobs, hackathons, residencies, grants and ambassador programs worth applying to.",
      },
    ],
  }),
  component: OpportunitiesPage,
});

const PAGE_SIZE = 6;

type MergedItem =
  | { kind: "opportunity"; data: (typeof opportunities)[0] }
  | { kind: "ambassador"; data: (typeof ambassadorPrograms)[0] };

function OpportunitiesPage() {
  const { category } = Route.useSearch();
  const [filters, setFilters] = useState<OpportunityFilterState>({
    ...defaultFilters,
    category: category ?? "all",
  });
  const [visible, setVisible] = useState(PAGE_SIZE);

  const results = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const showAmbassadors = filters.category === "all" || filters.category === "ambassador";
    const showRegular = filters.category === "all" || filters.category !== "ambassador";

    const items: MergedItem[] = [];

    if (showRegular) {
      for (const o of opportunities) {
        if (filters.category !== "all" && o.category !== filters.category) continue;
        if (filters.remote && !o.remote) continue;
        if (filters.paid && !o.paid) continue;
        if (filters.closingSoon && !isClosingSoon(o.deadline)) continue;
        if (filters.location !== "any" && o.location !== filters.location) continue;
        if (filters.ecosystem !== "any" && o.ecosystem !== filters.ecosystem) continue;
        if (filters.skill !== "any" && !o.skills.includes(filters.skill)) continue;
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
          if (!haystack.includes(q)) continue;
        }
        items.push({ kind: "opportunity", data: o });
      }
    }

    if (showAmbassadors) {
      for (const a of ambassadorPrograms) {
        if (q) {
          const haystack = [a.name, a.organization, a.summary, a.about, a.type, ...a.perks]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(q)) continue;
        }
        items.push({ kind: "ambassador", data: a });
      }
    }

    items.sort((a, b) => {
      if (filters.sort === "popular" && a.kind === "opportunity" && b.kind === "opportunity")
        return b.data.popularity - a.data.popularity;
      if (filters.sort === "deadline" && a.kind === "opportunity" && b.kind === "opportunity")
        return daysUntil(a.data.deadline) - daysUntil(b.data.deadline);
      return 0;
    });

    return items;
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
            <p className="mt-2 text-4xl font-extrabold tracking-tight">{results.length}</p>
            <p className="label-mono text-muted-foreground">open right now</p>
          </OffsetCard>
        }
      >
        Jobs, hackathons, residencies, grants and ambassador programs for people who build.
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
          {shown.length === 0 ? (
            <EmptyState
              title="Nothing matches that."
              body="Loosen a filter or two. The room is bigger than it looks."
              action={
                <Button asChild variant="outline">
                  <Link to="/opportunities" search={{ category: undefined }}>
                    Explore everything →
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((item) =>
                item.kind === "ambassador" ? (
                  <AmbassadorCard key={item.data.id} program={item.data} />
                ) : (
                  <OpportunityItem key={item.data.id} item={item.data} />
                ),
              )}
            </div>
          )}
        </div>

        {visible < results.length && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <Button variant="outline" size="lg" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
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

function OpportunityItem({ item }: { item: (typeof opportunities)[0] }) {
  const closing = isClosingSoon(item.deadline);

  return (
    <OffsetCard as="article" interactive className="group relative flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <Tag tone="purple">{categoryMeta[item.category].label}</Tag>
        <SaveButton kind="opportunity" id={item.id} label={item.title} className="relative z-10" />
      </div>

      <h3 className="mt-4 text-xl font-extrabold tracking-tight sm:text-2xl">
        <Link
          to="/opportunities/$id"
          params={{ id: item.id }}
          className="after:absolute after:inset-0 after:content-['']"
        >
          {item.title}
        </Link>
      </h3>
      <p className="label-mono mt-1.5 text-muted-foreground">{item.organization}</p>

      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground sm:text-base">{item.summary}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.tags.slice(0, 3).map((t) => (
          <Tag key={t} tone="ghost">
            {t}
          </Tag>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t-2 border-dashed border-foreground/15 pt-4">
        <StatusBadge
          label={deadlineLabel(item.deadline)}
          tone={closing ? "purple" : "neutral"}
          dot={closing}
        />
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
          Apply
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </span>
      </div>
    </OffsetCard>
  );
}

function AmbassadorCard({ program }: { program: (typeof ambassadorPrograms)[0] }) {
  return (
    <OffsetCard as="article" interactive className="group relative flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <Tag tone="purple">Ambassador</Tag>
        <StatusBadge
          label={program.open ? "Open" : "Closed"}
          tone={program.open ? "live" : "closed"}
          dot={program.open}
        />
      </div>

      <h3 className="mt-4 text-xl font-extrabold tracking-tight sm:text-2xl">{program.name}</h3>
      <p className="label-mono mt-1.5 text-muted-foreground">{program.organization}</p>

      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground sm:text-base">
        {program.summary}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Tag tone="ghost">{programTypeLabel[program.type]}</Tag>
        {program.remote && <Tag tone="ghost">Remote</Tag>}
        {program.paid && <Tag tone="ghost">Paid</Tag>}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t-2 border-dashed border-foreground/15 pt-4">
        <span className="label-mono text-muted-foreground">{program.commitment}</span>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
          Apply
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </span>
      </div>
    </OffsetCard>
  );
}
