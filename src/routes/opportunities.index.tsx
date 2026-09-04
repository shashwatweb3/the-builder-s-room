import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createServerClient } from "@supabase/ssr";
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
import { daysUntil, isClosingSoon, deadlineLabel } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import type { OpportunityCategory } from "@/data/types";

type SupabaseRow = {
  id: string;
  title: string;
  slug: string;
  type: "job" | "hackathon" | "grant" | "residency" | "ambassador";
  organization: string;
  description: string;
  long_description: string | null;
  location: string;
  remote: boolean;
  compensation: string | null;
  deadline: string | null;
  application_url: string | null;
  image_url: string | null;
  tags: string[];
  featured: boolean;
  status: "draft" | "published" | "closed";
  created_at: string;
  updated_at: string;
};

type UIOpportunity = {
  id: string;
  category: string;
  title: string;
  organization: string;
  summary: string;
  description: string;
  tags: string[];
  location: string;
  remote: boolean;
  paid: boolean;
  deadline: string;
  postedAt: string;
  popularity: number;
  applyUrl: string;
  compensation: string;
  ecosystem: string;
  skills: string[];
  requirements: string[];
  whoItsFor: string;
};

type UIAmbassador = {
  id: string;
  name: string;
  organization: string;
  summary: string;
  about: string;
  type: "community" | "content" | "developer" | "regional";
  commitment: string;
  remote: boolean;
  paid: boolean;
  open: boolean;
  perks: string[];
  applyUrl: string;
  deadline: string;
};

type MergedItem =
  { kind: "opportunity"; data: UIOpportunity } | { kind: "ambassador"; data: UIAmbassador };

const ambassadorCategoryMeta = {
  label: "Ambassador",
  plural: "Ambassadors",
  blurb: "Represent a brand you believe in.",
};

const programTypeLabel: Record<string, string> = {
  community: "Community",
  content: "Content",
  developer: "Developer",
  regional: "Regional",
};

function createSupabaseClient(request: Request) {
  if (!import.meta.env["VITE_SUPABASE_URL"] || !import.meta.env["VITE_SUPABASE_ANON_KEY"]) {
    return null;
  }
  return createServerClient(
    import.meta.env["VITE_SUPABASE_URL"],
    import.meta.env["VITE_SUPABASE_ANON_KEY"],
    {
      cookies: {
        getAll() {
          const h = request.headers.get("cookie") ?? "";
          return h.split(";").map((c) => {
            const [name, ...rest] = c.trim().split("=");
            return { name: name ?? "", value: rest.join("=") };
          });
        },
        setAll() {},
      },
    },
  );
}

const getPublishedOpportunities = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  if (!request) return [];
  const supabase = createSupabaseClient(request);
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as SupabaseRow[];
});

function rowToUI(row: SupabaseRow): UIOpportunity {
  return {
    id: row.id,
    category: row.type as UIOpportunity["category"],
    title: row.title,
    organization: row.organization,
    summary: row.description,
    description: row.long_description ?? row.description,
    tags: row.tags ?? [],
    location: row.location ?? "Remote",
    remote: row.remote,
    paid: !!row.compensation,
    deadline: row.deadline ?? "2099-01-01",
    postedAt: row.created_at,
    popularity: 0,
    applyUrl: row.application_url ?? "#",
    compensation: row.compensation ?? "",
    ecosystem: "",
    skills: [],
    requirements: [],
    whoItsFor: "",
  };
}

function rowToAmbassador(row: SupabaseRow): UIAmbassador {
  return {
    id: row.id,
    name: row.title,
    organization: row.organization,
    summary: row.description,
    about: row.long_description ?? row.description,
    type: (row as { type: string }).type as UIAmbassador["type"],
    commitment: "",
    remote: row.remote,
    paid: !!row.compensation,
    open: !row.deadline || new Date(row.deadline) > new Date(),
    perks: row.tags ?? [],
    applyUrl: row.application_url ?? "#",
    deadline: row.deadline ?? "2099-01-01",
  };
}

export const Route = createFileRoute("/opportunities/")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search["category"] === "string" ? (search["category"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Opportunities — Krew3" },
      {
        name: "description",
        content:
          "Jobs, hackathons, grants, residencies and ambassador programs for people who build.",
      },
      { property: "og:title", content: "Opportunities — Krew3" },
      {
        property: "og:description",
        content:
          "Jobs, hackathons, grants, residencies and ambassador programs worth checking out.",
      },
    ],
  }),
  loader: async () => {
    const rows = await getPublishedOpportunities();
    return { rows };
  },
  component: OpportunitiesPage,
});

const PAGE_SIZE = 6;

const categoryMeta: Record<OpportunityCategory, { label: string; plural: string; blurb: string }> =
  {
    job: { label: "Job", plural: "Jobs", blurb: "Find your next role." },
    hackathon: { label: "Hackathon", plural: "Hackathons", blurb: "Build something in a weekend." },
    residency: { label: "Residency", plural: "Residencies", blurb: "Deep work with a team." },
    grant: { label: "Grant", plural: "Grants", blurb: "Fund your next thing." },
  };

function OpportunitiesPage() {
  const { category } = Route.useSearch();
  const { rows } = Route.useLoaderData();
  const [filters, setFilters] = useState<OpportunityFilterState>({
    ...defaultFilters,
    category: category ?? "all",
  });
  const [visible, setVisible] = useState(PAGE_SIZE);

  const items = useMemo<MergedItem[]>(() => {
    return rows.map((row) =>
      row.type === "ambassador"
        ? { kind: "ambassador", data: rowToAmbassador(row) }
        : { kind: "opportunity", data: rowToUI(row) },
    );
  }, [rows]);

  const results = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const showAmbassadors = filters.category === "all" || filters.category === "ambassador";
    const showRegular = filters.category === "all" || filters.category !== "ambassador";

    const filtered: MergedItem[] = [];

    for (const item of items) {
      if (item.kind === "ambassador") {
        if (!showAmbassadors) continue;
        if (q) {
          const haystack = [
            item.data.name,
            item.data.organization,
            item.data.summary,
            item.data.about,
            item.data.type,
            ...item.data.perks,
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(q)) continue;
        }
        filtered.push(item);
      } else {
        if (!showRegular) continue;
        if (filters.category !== "all" && item.data.category !== filters.category) continue;
        if (filters.remote && !item.data.remote) continue;
        if (filters.closingSoon && !isClosingSoon(item.data.deadline)) continue;
        if (filters.location !== "any" && item.data.location !== filters.location) continue;
        if (q) {
          const haystack = [
            item.data.title,
            item.data.organization,
            item.data.summary,
            item.data.description,
            item.data.location,
            ...item.data.tags,
            ...item.data.skills,
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(q)) continue;
        }
        filtered.push(item);
      }
    }

    filtered.sort((a, b) => {
      if (filters.sort === "popular" && a.kind === "opportunity" && b.kind === "opportunity")
        return b.data.popularity - a.data.popularity;
      if (filters.sort === "deadline" && a.kind === "opportunity" && b.kind === "opportunity")
        return daysUntil(a.data.deadline) - daysUntil(b.data.deadline);
      return 0;
    });

    return filtered;
  }, [items, filters]);

  const shown = results.slice(0, visible);

  return (
    <>
      <PageHero
        label="Opportunities"
        title="Opportunities for the Krew."
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
        Jobs, hackathons, grants, residencies and ambassador programs worth checking out.
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

        <p className="mt-5 text-sm text-muted-foreground">
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

        <div className="mt-10">
          {shown.length === 0 ? (
            <EmptyState
              title={items.length === 0 ? "No open opportunities yet." : "Nothing matches that."}
              body={
                items.length === 0
                  ? "Check back soon."
                  : "Loosen a filter or two. The Krew is bigger than it looks."
              }
              action={
                items.length === 0 ? undefined : (
                  <Button asChild variant="outline">
                    <Link to="/opportunities" search={{ category: undefined }}>
                      Explore everything →
                    </Link>
                  </Button>
                )
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

function OpportunityItem({ item }: { item: UIOpportunity }) {
  const closing = isClosingSoon(item.deadline);
  const meta =
    item.category === "ambassador"
      ? ambassadorCategoryMeta
      : (categoryMeta[item.category as keyof typeof categoryMeta] ?? {
          label: item.category,
          plural: item.category + "s",
          blurb: "",
        });

  return (
    <OffsetCard as="article" interactive className="group relative flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <Tag tone="purple">{meta.label}</Tag>
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

function AmbassadorCard({ program }: { program: UIAmbassador }) {
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
        <Tag tone="ghost">{programTypeLabel[program.type] ?? program.type}</Tag>
        {program.remote && <Tag tone="ghost">Remote</Tag>}
        {program.paid && <Tag tone="ghost">Paid</Tag>}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t-2 border-dashed border-foreground/15 pt-4">
        <span className="label-mono text-muted-foreground">
          {program.deadline ? deadlineLabel(program.deadline) : ""}
        </span>
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
