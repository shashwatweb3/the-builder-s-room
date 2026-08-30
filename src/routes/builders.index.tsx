import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { OffsetCard } from "@/components/OffsetCard";
import { Dot } from "@/components/StatusBadge";
import { FilterBar, TogglePill } from "@/components/FilterBar";
import { BuilderCard } from "@/components/BuilderCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { CollabPanel } from "@/components/CollabPanel";
import { JoinCTA } from "@/components/JoinCTA";
import { builders, roleOptions, statusOptions } from "@/data/builders";
import type { BuilderRole, BuilderStatus } from "@/data/types";

export const Route = createFileRoute("/builders/")({
  head: () => ({
    meta: [
      { title: "Builders — The Rec Room" },
      {
        name: "description",
        content:
          "Meet the people in the room. Developers, designers, founders, researchers, writers and community builders making things.",
      },
      { property: "og:title", content: "Builders — The Rec Room" },
      {
        property: "og:description",
        content: "The people are the point. Find someone worth building with.",
      },
    ],
  }),
  component: BuildersPage,
});

function BuildersPage() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>("all");
  const [statuses, setStatuses] = useState<BuilderStatus[]>([]);

  const toggleStatus = (s: BuilderStatus) =>
    setStatuses((list) => (list.includes(s) ? list.filter((x) => x !== s) : [...list, s]));

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    return builders.filter((b) => {
      if (role !== "all" && b.role !== role) return false;
      if (statuses.length && !statuses.some((s) => b.statuses.includes(s))) return false;
      if (query) {
        const haystack = [
          b.name,
          b.handle,
          b.roleLabel,
          b.bio,
          b.about,
          b.currentProject,
          b.location,
          ...b.skills,
          ...b.lookingFor,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [q, role, statuses]);

  const lookingForPartners = builders.filter((b) => b.statuses.includes("open-to-collabs")).length;

  const clear = () => {
    setQ("");
    setRole("all");
    setStatuses([]);
  };

  return (
    <>
      <PageHero
        label="Builders"
        title="Meet the people in the room."
        aside={
          <OffsetCard size="sm" className="px-5 py-4">
            <p className="label-mono flex items-center gap-2">
              <Dot /> Open to collabs
            </p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight">{lookingForPartners}</p>
            <p className="label-mono text-muted-foreground">looking for people to build with</p>
          </OffsetCard>
        }
      >
        Developers, designers, founders, researchers, writers, community builders and curious people
        making things.
      </PageHero>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <OffsetCard className="space-y-5 p-4 sm:p-6">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <label htmlFor="builder-search" className="sr-only">
              Search builders
            </label>
            <input
              id="builder-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search profiles, skills, projects…"
              className="min-h-11 w-full rounded-full border-2 border-border bg-background pr-4 pl-11 text-base outline-none placeholder:text-muted-foreground"
            />
          </div>

          <FilterBar
            ariaLabel="Filter builders by role"
            value={role}
            onChange={(v) => setRole(v)}
            options={[
              { value: "all", label: "All" },
              ...roleOptions.map((r) => ({ value: r.value, label: r.label })),
            ]}
          />

          <details className="group">
            <summary className="label-mono flex min-h-9 cursor-pointer list-none items-center gap-2 text-muted-foreground">
              Availability
              <span className="text-foreground/40 transition-transform group-open:rotate-90">
                ▸
              </span>
            </summary>
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
              {statusOptions.map((s) => (
                <TogglePill
                  key={s.value}
                  active={statuses.includes(s.value)}
                  onClick={() => toggleStatus(s.value)}
                >
                  {s.label}
                </TogglePill>
              ))}
            </div>
          </details>

          <p
            className="label-mono border-t-2 border-dashed border-foreground/15 pt-3 text-muted-foreground"
            aria-live="polite"
          >
            {results.length} {results.length === 1 ? "person" : "people"} in the room
          </p>
        </OffsetCard>

        <div className="mt-10">
          {results.length ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((b) => (
                <BuilderCard key={b.id} builder={b} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No one matches that."
              body="Loosen a filter or two — the room is bigger than it looks."
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
