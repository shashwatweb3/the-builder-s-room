import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import { EmptyState } from "@/components/EmptyState";
import { CollabPanel } from "@/components/CollabPanel";
import { JoinCTA } from "@/components/JoinCTA";

export const Route = createFileRoute("/builders/")({
  head: () => ({
    meta: [
      { title: "Builders — Krew3" },
      {
        name: "description",
        content:
          "Meet the people in the Krew. Developers, designers, founders, researchers, writers and community builders making things.",
      },
      { property: "og:title", content: "Builders — Krew3" },
      {
        property: "og:description",
        content: "The people are the point. Find someone worth building with.",
      },
    ],
  }),
  component: BuildersPage,
});

function BuildersPage() {
  return (
    <>
      <PageHero label="Builders" title="Meet the people in the Krew.">
        Developers, designers, founders, researchers, writers, community builders and curious people
        making things.
      </PageHero>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <EmptyState
          title="No builders listed yet."
          body="Check back soon — the Krew is just getting started."
          action={null}
        />
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
