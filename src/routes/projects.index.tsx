import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { OffsetCard } from "@/components/OffsetCard";
import { Dot } from "@/components/StatusBadge";
import { FilterBar } from "@/components/FilterBar";
import { ProjectCard } from "@/components/ProjectCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { CollabPanel } from "@/components/CollabPanel";
import { JoinCTA } from "@/components/JoinCTA";
import { projects, projectStatusLabel } from "@/data/projects";
import type { ProjectStatus } from "@/data/types";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Projects — The Rec Room" },
      {
        name: "description",
        content:
          "Things people are building in the room. Interesting projects worth following, contributing to and collaborating on.",
      },
      { property: "og:title", content: "Projects — The Rec Room" },
      {
        property: "og:description",
        content: "See what people are building, and what they need help with.",
      },
    ],
  }),
  component: ProjectsPage,
});

const statusOptions: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "building", label: "Building" },
  { value: "live", label: "Live" },
  { value: "experiment", label: "Experiment" },
  { value: "needs-help", label: "Looking for help" },
];

function ProjectsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [category, setCategory] = useState<string>("all");

  const categories = useMemo(() => Array.from(new Set(projects.map((p) => p.category))).sort(), []);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    return projects.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (category !== "all" && p.category !== category) return false;
      if (query) {
        const haystack = [
          p.name,
          p.pitch,
          p.description,
          p.building,
          p.category,
          ...p.stack,
          ...p.lookingFor,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [q, status, category]);

  const needsHelp = projects.filter((p) => p.status === "needs-help").length;
  const clear = () => {
    setQ("");
    setStatus("all");
    setCategory("all");
  };

  return (
    <>
      <PageHero
        label="Projects"
        title="Things people are building."
        aside={
          <OffsetCard size="sm" className="px-5 py-4">
            <p className="label-mono flex items-center gap-2">
              <Dot /> Looking for help
            </p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight">{needsHelp}</p>
            <p className="label-mono text-muted-foreground">projects pulling up a chair</p>
          </OffsetCard>
        }
      >
        Interesting things made by people in the room. Follow them, help them, steal the ideas that
        deserve stealing.
      </PageHero>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Button asChild variant="outline" size="lg">
            <Link to="/submit">
              Share your project <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <p className="label-mono text-muted-foreground">
            {results.length} {results.length === 1 ? "project" : "projects"} in the room
          </p>
        </div>

        <OffsetCard className="mt-6 space-y-5 p-4 sm:p-6">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <label htmlFor="project-search" className="sr-only">
              Search projects
            </label>
            <input
              id="project-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search projects, stacks, needs…"
              className="min-h-11 w-full rounded-full border-2 border-border bg-background pr-4 pl-11 text-base outline-none placeholder:text-muted-foreground"
            />
          </div>

          <FilterBar
            ariaLabel="Filter projects by status"
            value={status}
            onChange={(v) => setStatus(v as ProjectStatus | "all")}
            options={statusOptions}
          />

          <FilterBar
            ariaLabel="Filter projects by category"
            value={category}
            onChange={setCategory}
            options={[
              { value: "all", label: "All categories" },
              ...categories.map((c) => ({ value: c, label: c })),
            ]}
          />

          {status === "needs-help" && (
            <p className="label-mono text-muted-foreground">
              {projectStatusLabel["needs-help"]} — these projects want hands.
            </p>
          )}
        </OffsetCard>

        <div className="mt-10">
          {results.length ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No projects like that yet."
              body="Either loosen a filter or be the one to fix it."
              action={
                <Button variant="outline" onClick={clear}>
                  Clear filters
                </Button>
              }
            />
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1400px] px-4 pt-16 sm:px-6 lg:px-10 lg:pt-24">
        <CollabPanel />
      </section>

      <section className="mx-auto w-full max-w-[1400px] px-4 pt-16 sm:px-6 lg:px-10">
        <JoinCTA />
      </section>
    </>
  );
}
