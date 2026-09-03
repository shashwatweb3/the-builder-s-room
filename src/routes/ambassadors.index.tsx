import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import { EmptyState } from "@/components/EmptyState";
import { JoinCTA } from "@/components/JoinCTA";

export const Route = createFileRoute("/ambassadors/")({
  head: () => ({
    meta: [
      { title: "Ambassadors — The Rec Room" },
      {
        name: "description",
        content:
          "Help shape the room. Ambassador and community programs worth joining to grow interesting projects.",
      },
      { property: "og:title", content: "Ambassadors — The Rec Room" },
      {
        property: "og:description",
        content:
          "Communities are built by people who care. Community, content, developer and regional programs.",
      },
    ],
  }),
  component: AmbassadorsPage,
});

function AmbassadorsPage() {
  return (
    <>
      <PageHero label="Ambassadors" title="Help shape the room.">
        Interesting communities are built by people who care. Find ambassador and community programs
        worth joining.
      </PageHero>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <EmptyState
          title="No ambassador programs yet."
          body="Check back soon — programs are coming."
          action={null}
        />
      </section>

      <section className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <JoinCTA />
      </section>
    </>
  );
}
