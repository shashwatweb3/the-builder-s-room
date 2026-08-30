import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { FilterBar } from "@/components/FilterBar";
import { Button } from "@/components/Button";
import { OpportunityCard } from "@/components/OpportunityCard";
import { BuilderCard } from "@/components/BuilderCard";
import { ProjectCard } from "@/components/ProjectCard";
import { EmptyState } from "@/components/EmptyState";
import { SectionLabel } from "@/components/SectionLabel";
import { useSaved } from "@/lib/saved";
import { getOpportunity } from "@/data/opportunities";
import { getBuilder } from "@/data/builders";
import { getProject } from "@/data/projects";
import type { SavedKind } from "@/data/types";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved — The Rec Room" },
      {
        name: "description",
        content: "Everything you've bookmarked from the room, in one place.",
      },
    ],
  }),
  component: SavedPage,
});

const tabs = [
  { value: "opportunity", label: "Opportunities" },
  { value: "project", label: "Projects" },
  { value: "builder", label: "Builders" },
];

function SavedPage() {
  const { saved, hydrated } = useSaved();
  const [tab, setTab] = useState<SavedKind>("opportunity");

  const ids = saved[tab];
  const hasAny = saved.opportunity.length + saved.project.length + saved.builder.length > 0;

  const renderTab = () => {
    if (!hydrated) {
      return (
        <EmptyState title="Reading your room…" body="Grabbing your bookmarks." action={null} />
      );
    }
    if (!hasAny) {
      return (
        <>
          <EmptyState
            title="Nothing saved yet."
            body="Go find something interesting — there's plenty in here."
            action={
              <Button asChild variant="outline">
                <Link to="/opportunities" search={{ category: undefined }}>
                  Explore opportunities <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            }
          />
        </>
      );
    }
    if (ids.length === 0) {
      return (
        <EmptyState
          title={`No saved ${tab === "opportunity" ? "opportunities" : tab === "project" ? "projects" : "builders"} yet.`}
          body="Hit the bookmark button anywhere in the room and it'll land here."
          action={null}
        />
      );
    }

    if (tab === "opportunity") {
      const items = ids.map(getOpportunity).filter(Boolean);
      if (!items.length) return null;
      return (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((o) => (
            <OpportunityCard key={o!.id} item={o!} />
          ))}
        </div>
      );
    }
    if (tab === "project") {
      const items = ids.map(getProject).filter(Boolean);
      if (!items.length) return null;
      return (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => (
            <ProjectCard key={p!.id} project={p!} />
          ))}
        </div>
      );
    }
    const items = ids.map(getBuilder).filter(Boolean);
    if (!items.length) return null;
    return (
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((b) => (
          <BuilderCard key={b!.id} builder={b!} />
        ))}
      </div>
    );
  };

  return (
    <>
      <PageHero label="Saved" title="Your corner of the room.">
        Everything you've bookmarked while wandering around. It stays with you, even if you lose the
        link.
      </PageHero>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <FilterBar
          ariaLabel="Filter saved items by type"
          value={tab}
          onChange={(v) => setTab(v as SavedKind)}
          options={tabs.map((t) => ({
            value: t.value,
            label: t.label,
            count: saved[t.value as SavedKind].length,
          }))}
        />

        <div className="mt-10">{renderTab()}</div>

        {hasAny && (
          <div className="mt-14">
            <SectionLabel>Out of things to save?</SectionLabel>
            <p className="mt-3 max-w-xl text-lg text-muted-foreground">
              The room is always growing. Go find the next thing.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
