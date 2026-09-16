import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { VenueDirectory } from "@/components/VenueDirectory";

export const Route = createFileRoute("/venues/")({
  head: () => ({
    meta: [{ title: "Devcon 8 Side-Event Venues — Krew3" }],
  }),
  component: VenuesPage,
});

function VenuesPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-8 sm:px-6 lg:px-10">
        <Link
          to="/events"
          search={{ view: undefined }}
          className="label-mono inline-flex items-center gap-2 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Back to Events
        </Link>
      </div>

      <PageHero label="Devcon 8 • Mumbai" title="Need a place to host your side event?">
        <p>
          Finding a venue can be harder than planning the event itself. We put together a
          community-curated list of places around Mumbai&apos;s Devcon scene to help you find
          somewhere that fits.
        </p>
        <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="label-mono text-muted-foreground">Built by the Krew, for the Krew.</p>
          <p className="label-mono text-primary">Community-curated. Not sponsored.</p>
        </div>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          These venues are listed as a community resource for teams planning Devcon 8 side events.
          Krew3 is not affiliated with, paid by, or sponsored by the listed venues unless explicitly
          stated. Confirm pricing, availability and booking terms directly with the venue.
        </p>
      </PageHero>

      <VenueDirectory />
    </>
  );
}
