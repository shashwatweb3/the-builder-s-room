import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "./Button";
import { OffsetCard } from "./OffsetCard";
import { SectionLabel } from "./SectionLabel";

export function VenueEntryCard() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
      <OffsetCard className="flex h-full flex-col gap-4 p-6 sm:p-8">
        <SectionLabel>Planning a side event?</SectionLabel>

        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Need a place to host it?
        </h2>

        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Find venues around BKC, Jio World Convention Centre, Bandra, Kurla, Santacruz and nearby
          areas for your Devcon 8 side event.
        </p>

        <div className="mt-1">
          <Button asChild size="lg" variant="ink">
            <Link to="/venues">
              Find a venue
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </OffsetCard>
    </section>
  );
}
