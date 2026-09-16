import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, MapPin } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Tag } from "@/components/Tag";
import type { Venue } from "@/data/venues";
import { VENUES, VENUE_CATEGORIES } from "@/data/venues";

export const Route = createFileRoute("/venues/$slug")({
  loader: ({ params }) => VENUES.find((v) => v.slug === params.slug) ?? null,
  head: () => ({
    meta: [{ title: "Venue — Krew3" }],
  }),
  component: VenueDetailPage,
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <dt className="label-mono shrink-0 pt-0.5 text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold sm:text-right">{children}</dd>
    </div>
  );
}

function VenueDetailPage() {
  const venue = useLoaderData({ from: "/venues/$slug" });

  if (!venue) {
    return (
      <>
        <div className="mx-auto w-full max-w-[1400px] px-4 pt-8 sm:px-6 lg:px-10">
          <Link
            to="/venues"
            className="label-mono inline-flex items-center gap-2 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> Back to venues
          </Link>
        </div>
        <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10">
          <EmptyState
            title="Venue not found."
            body="It may have been removed, or the link is wrong."
            action={
              <Link
                to="/venues"
                className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-5 text-base font-semibold text-foreground shadow-offset transition-colors hover:bg-lavender/40"
              >
                Browse all venues →
              </Link>
            }
          />
        </section>
      </>
    );
  }

  return <VenueDetails venue={venue} />;
}

function VenueDetails({ venue }: { venue: Venue }) {
  const category = VENUE_CATEGORIES[venue.category];
  const external = venue.bookingUrl ?? venue.website;
  const separateWebsite = venue.website && venue.website !== external ? venue.website : undefined;

  return (
    <>
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-8 sm:px-6 lg:px-10">
        <Link
          to="/venues"
          className="label-mono inline-flex items-center gap-2 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Back to venues
        </Link>
      </div>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="purple" compact>
            {category.label}
          </Tag>
          <Tag tone="ghost" compact>
            {venue.indoorOutdoor}
          </Tag>
        </div>

        <h1 className="mt-4 text-[clamp(2.25rem,6vw,4rem)] leading-[0.98] font-extrabold tracking-tight">
          {venue.name}
        </h1>

        <p className="label-mono mt-3 text-muted-foreground">
          {venue.type} · {venue.areaLabel} · {venue.distanceKm} from JWCC
        </p>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {venue.description}
        </p>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <dl className="divide-y-2 divide-dashed divide-foreground/15 border-y-2 border-dashed border-foreground/15">
              <Field label="Capacity">{venue.capacity}</Field>
              <Field label="Budget">
                {venue.budget}
                {venue.budgetNote ? ` · ${venue.budgetNote}` : ""}
              </Field>
              <Field label="Distance from JWCC">{venue.distanceKm}</Field>
              <Field label="Best for">{venue.bestFor}</Field>
              <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <dt className="label-mono shrink-0 pt-0.5 text-muted-foreground">Address</dt>
                <dd className="flex items-start gap-1.5 text-sm font-semibold sm:justify-end sm:text-right">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>{venue.address}</span>
                </dd>
              </div>
            </dl>

            {venue.amenities.length > 0 && (
              <div className="mt-8">
                <p className="label-mono mb-3 text-muted-foreground">Amenities</p>
                <ul className="grid gap-2 text-sm sm:grid-cols-2">
                  {venue.amenities.map((a) => (
                    <li key={a} className="flex items-center gap-2 font-medium">
                      <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(venue.tags.length > 0 || venue.eventTypes.length > 0) && (
              <div className="mt-8 space-y-3">
                {venue.eventTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {venue.eventTypes.map((t) => (
                      <Tag key={t} compact tone="ghost">
                        {t.toUpperCase()}
                      </Tag>
                    ))}
                  </div>
                )}
                {venue.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {venue.tags.map((t) => (
                      <Tag key={t} compact tone="purple">
                        {t}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="h-fit">
            <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-offset">
              {external && (
                <a
                  href={external}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label-mono inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-border bg-foreground px-6 text-base text-background shadow-offset-sm press"
                >
                  Visit venue
                  <ArrowUpRight className="size-4" aria-hidden />
                </a>
              )}

              {separateWebsite && (
                <a
                  href={separateWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-border bg-card px-6 text-base font-semibold shadow-offset-sm press"
                >
                  Website
                </a>
              )}

              {venue.phone && (
                <a
                  href={`tel:${venue.phone.replace(/\s/g, "")}`}
                  className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-full border-2 border-border bg-card px-6 text-base font-semibold shadow-offset-sm press"
                >
                  {venue.phone}
                </a>
              )}

              {!external && (
                <p className="text-sm text-muted-foreground">
                  {venue.phone
                    ? "Call the number above to check availability."
                    : "Booking details are TBD — contact the venue directly."}
                </p>
              )}

              <p className="label-mono mt-5 text-muted-foreground">
                Krew3 handles discovery, not bookings.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Prices, availability and booking terms change fast around Devcon dates. Confirm
                directly with the venue — Krew3 is not affiliated with, paid by, or sponsored by it
                unless explicitly stated.
              </p>
            </div>
          </aside>
        </div>

        <div className="mt-10">
          <Link
            to="/events"
            search={{ view: undefined }}
            className="label-mono inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> Back to Events
          </Link>
        </div>
      </section>
    </>
  );
}
