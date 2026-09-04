import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { EmptyState } from "@/components/EmptyState";
import { CollabPanel } from "@/components/CollabPanel";
import { JoinCTA } from "@/components/JoinCTA";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Projects — Krew3" },
      {
        name: "description",
        content:
          "What the Krew is building. Interesting projects worth following, contributing to and collaborating on.",
      },
      { property: "og:title", content: "Projects — Krew3" },
      {
        property: "og:description",
        content: "Interesting things built by people in the Krew.",
      },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <>
      <PageHero label="Projects" title="What the Krew is building.">
        Interesting things built by people in the Krew. Follow them, help them, steal the ideas that
        deserve stealing.
      </PageHero>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <a
            href="https://t.me/Lucky_sc0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-6 text-base font-semibold text-foreground shadow-offset transition-colors hover:bg-lavender/40"
          >
            Share your project <ArrowRight className="size-4" aria-hidden />
          </a>
        </div>

        <div className="mt-10">
          <EmptyState title="Nothing here yet." body="The Krew is cooking." action={null} />
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
