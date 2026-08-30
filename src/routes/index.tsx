import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/Button";
import { OffsetCard } from "@/components/OffsetCard";
import { SectionLabel } from "@/components/SectionLabel";
import { Dot } from "@/components/StatusBadge";
import { HeroRoom } from "@/components/HeroRoom";
import { OpportunityCard } from "@/components/OpportunityCard";
import { FilterBar } from "@/components/FilterBar";
import { JoinCTA } from "@/components/JoinCTA";
import { CollabPanel } from "@/components/CollabPanel";
import { FAQ } from "@/components/FAQ";
import { EmptyState } from "@/components/EmptyState";
import { opportunities, countByCategory } from "@/data/opportunities";
import type { OpportunityCategory } from "@/data/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Rec Room — A Recreation Room for Builders" },
      {
        name: "description",
        content:
          "Discover jobs, hackathons, residencies, ambassador programs, projects and people worth building with.",
      },
      {
        property: "og:title",
        content: "The Rec Room — A Recreation Room for Builders",
      },
      {
        property: "og:description",
        content:
          "Find something worth building. Jobs, hackathons, residencies, grants, projects and people who ship.",
      },
    ],
  }),
  component: Home,
});

const categories: {
  key: OpportunityCategory;
  title: string;
  blurb: string;
  unit: string;
  tone: "card" | "lavender" | "purple" | "ivory";
}[] = [
  { key: "job", title: "Jobs", blurb: "Find your next role.", unit: "live", tone: "card" },
  {
    key: "hackathon",
    title: "Hackathons",
    blurb: "Build something. Ship something. Win something.",
    unit: "live",
    tone: "lavender",
  },
  {
    key: "residency",
    title: "Residencies",
    blurb: "Go somewhere interesting. Build with interesting people.",
    unit: "open",
    tone: "card",
  },
  {
    key: "grant",
    title: "Grants",
    blurb: "Get support for something you're building.",
    unit: "open",
    tone: "purple",
  },
];

const displayCounts: Record<OpportunityCategory, number> = {
  job: 24,
  hackathon: 18,
  residency: 7,
  grant: 12,
};

const faqs = [
  {
    q: "What actually is The Rec Room?",
    a: "A place to find things worth building and people worth building with. Opportunities, projects and builders in one room, kept small on purpose.",
  },
  {
    q: "Who is it for?",
    a: "Developers, designers, founders, researchers, writers and community people. If you make things, you're in.",
  },
  {
    q: "Can I post something?",
    a: "Yes. Head to Submit and send us a job, hackathon, residency, grant, ambassador program or project. We read everything before it hits the room.",
  },
  {
    q: "Does it cost anything?",
    a: "No. Browsing, posting and saving are free.",
  },
];

function Home() {
  const [tab, setTab] = useState("all");

  const preview = useMemo(() => {
    const list =
      tab === "all"
        ? opportunities
        : opportunities.filter((o) => o.category === tab);
    return list.slice(0, 6);
  }, [tab]);

  const openCount =
    countByCategory("job") +
    countByCategory("hackathon") +
    countByCategory("residency") +
    countByCategory("grant");

  return (
    <>
      {/* HERO */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pt-10 pb-6 sm:px-6 lg:px-10 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div className="rise-in">
            <SectionLabel>A recreation room for builders</SectionLabel>
            <h1 className="mt-5 text-[clamp(2.75rem,9vw,6.5rem)] leading-[0.92] font-extrabold tracking-tight">
              Find something{" "}
              <span className="relative inline-block">
                worth
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-1 -z-10 h-3 rounded-full bg-lavender sm:h-5"
                />
              </span>{" "}
              building.
            </h1>
            <p className="mt-6 max-w-xl text-lg font-medium sm:text-xl">
              Jobs. Hackathons. Residencies. Ambassador programs. Projects.
              People to build with.
            </p>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              The Rec Room is a place for builders to find their next
              opportunity, discover interesting projects, and meet people who
              actually ship.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/opportunities">Explore opportunities →</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/builders">Meet the builders</Link>
              </Button>
            </div>
          </div>

          <HeroRoom />
        </div>
      </section>

      {/* LIVE ROOM STATUS */}
      <section className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <OffsetCard
          size="sm"
          className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <p className="label-mono flex items-center gap-2">
            <Dot /> Live
            <span className="text-muted-foreground">
              — {openCount + 25} opportunities are currently open
            </span>
          </p>
          <p className="label-mono text-muted-foreground">
            Updated moments ago
          </p>
        </OffsetCard>
      </section>

      {/* PURPLE STATEMENT */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pt-16 sm:px-6 lg:px-10 lg:pt-24">
        <OffsetCard tone="purple" size="lg" className="grid-paper p-6 sm:p-12">
          <p className="text-[clamp(2rem,6vw,4.5rem)] leading-[0.98] font-extrabold tracking-tight">
            There's always something to build.
          </p>
          <p className="mt-4 max-w-xl text-base text-primary-foreground/85 sm:text-xl">
            The hard part is finding what is worth your time.
          </p>
        </OffsetCard>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pt-16 sm:px-6 lg:px-10 lg:pt-24">
        <SectionLabel>What's happening in the room</SectionLabel>
        <h2 className="mt-4 text-[clamp(2rem,6vw,4rem)] leading-[1] font-extrabold tracking-tight">
          Pick your next thing.
        </h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((c) => (
            <OffsetCard
              key={c.key}
              interactive
              tone={c.tone}
              className="group relative flex flex-col p-6"
            >
              <span className="label-mono opacity-70">{c.title}</span>
              <p className="mt-4 text-2xl leading-tight font-extrabold tracking-tight">
                {c.blurb}
              </p>
              <p className="label-mono mt-6 flex items-center gap-2">
                <Dot tone={c.tone === "purple" ? "ink" : "purple"} />
                {displayCounts[c.key]} {c.unit}
              </p>
              <span className="mt-6 inline-flex items-center gap-1.5 font-semibold">
                <Link
                  to="/opportunities"
                  search={{ category: c.key }}
                  className="after:absolute after:inset-0 after:content-['']"
                >
                  Explore
                </Link>
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </OffsetCard>
          ))}
        </div>
      </section>

      {/* LIVE PREVIEW */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pt-16 sm:px-6 lg:px-10 lg:pt-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionLabel>Open right now</SectionLabel>
            <h2 className="mt-4 text-[clamp(2rem,6vw,4rem)] leading-[1] font-extrabold tracking-tight">
              Things worth applying to.
            </h2>
          </div>
          <Link
            to="/opportunities"
            className="group inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline"
          >
            View all opportunities
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </div>

        <FilterBar
          ariaLabel="Filter opportunities by category"
          className="mt-8"
          value={tab}
          onChange={setTab}
          options={[
            { value: "all", label: "All" },
            { value: "job", label: "Jobs" },
            { value: "hackathon", label: "Hackathons" },
            { value: "residency", label: "Residencies" },
            { value: "grant", label: "Grants" },
          ]}
        />

        <div className="mt-8">
          {preview.length ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {preview.map((o) => (
                <OpportunityCard key={o.id} item={o} />
              ))}
            </div>
          ) : (
            <EmptyState
              action={
                <Button asChild variant="outline">
                  <Link to="/opportunities">Explore everything →</Link>
                </Button>
              }
            />
          )}
        </div>
      </section>

      {/* COLLAB */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pt-16 sm:px-6 lg:px-10 lg:pt-24">
        <CollabPanel />
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pt-16 sm:px-6 lg:px-10 lg:pt-24">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
          <div>
            <SectionLabel>Questions</SectionLabel>
            <h2 className="mt-4 text-[clamp(2rem,5vw,3.5rem)] leading-[1] font-extrabold tracking-tight">
              What is this place?
            </h2>
          </div>
          <FAQ items={faqs} />
        </div>
      </section>

      {/* JOIN */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pt-16 sm:px-6 lg:px-10 lg:pt-24">
        <JoinCTA />
      </section>
    </>
  );
}
