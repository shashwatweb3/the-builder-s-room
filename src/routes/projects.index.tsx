import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { CollabPanel } from "@/components/CollabPanel";
import { JoinCTA } from "@/components/JoinCTA";

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

function ProjectsPage() {
  return (
    <>
      <PageHero label="Projects" title="Things people are building.">
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
        </div>

        <div className="mt-10">
          <EmptyState title="No projects yet." body="Things are coming soon." action={null} />
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
