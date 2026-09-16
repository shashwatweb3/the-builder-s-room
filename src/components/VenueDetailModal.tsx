import { ArrowUpRight, MapPin, X } from "lucide-react";
import { useEffect } from "react";
import type { Venue } from "@/data/venues";
import { VENUE_CATEGORIES } from "@/data/venues";
import { Tag } from "./Tag";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="label-mono shrink-0 pt-0.5 text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-semibold">{children}</dd>
    </div>
  );
}

export function VenueDetailModal({ venue, onClose }: { venue: Venue; onClose: () => void }) {
  const category = VENUE_CATEGORIES[venue.category];

  useEffect(() => {
    if (!venue) return undefined;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [venue, onClose]);

  if (!venue) return null;

  const links = [
    venue.bookingUrl && {
      label: "Visit venue",
      href: venue.bookingUrl,
    },
    venue.website && {
      label: "Website",
      href: venue.website,
    },
  ].filter((l): l is { label: string; href: string } => Boolean(l));

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close venue details"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-foreground/35 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${venue.name}`}
        className="rise-in absolute inset-x-3 top-[6vh] mx-auto max-h-[84vh] max-w-2xl overflow-y-auto rounded-3xl border-2 border-border bg-background shadow-offset-lg sm:inset-x-6"
      >
        <div className="flex items-start justify-between gap-4 border-b-2 border-border p-5 sm:p-6">
          <div className="min-w-0">
            <p className="label-mono text-muted-foreground">
              {category.label} · {venue.areaLabel}
            </p>
            <h2 className="mt-1.5 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
              {venue.name}
            </h2>
            <p className="label-mono mt-1.5 text-muted-foreground">
              {venue.type} · {venue.indoorOutdoor} · {venue.distanceKm} from JWCC
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close venue details"
            className="press grid size-10 shrink-0 place-items-center rounded-full border-2 border-border bg-card shadow-offset-sm"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {venue.description}
          </p>

          <dl className="space-y-2 border-t-2 border-dashed border-foreground/15 pt-4">
            <Field label="Capacity">{venue.capacity}</Field>
            <Field label="Budget">
              {venue.budget} · {venue.budgetNote}
            </Field>
            <Field label="Distance">{`${venue.distanceKm} from JWCC`}</Field>
            <Field label="Best for">{venue.bestFor}</Field>
            <div className="flex items-start justify-between gap-4">
              <dt className="label-mono shrink-0 pt-0.5 text-muted-foreground">Address</dt>
              <dd className="flex items-start gap-1.5 text-right text-sm font-semibold">
                <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {venue.address}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-1.5">
            {venue.eventTypes.map((t) => (
              <Tag key={t} compact tone="ghost">
                {t.toUpperCase()}
              </Tag>
            ))}
          </div>

          {venue.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {venue.tags.map((t) => (
                <Tag key={t} compact tone="purple">
                  {t}
                </Tag>
              ))}
            </div>
          )}

          {venue.amenities.length > 0 && (
            <div className="border-t-2 border-dashed border-foreground/15 pt-4">
              <p className="label-mono mb-2 text-muted-foreground">Amenities</p>
              <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
                {venue.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2">
                    <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t-2 border-dashed border-foreground/15 pt-4">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="label-mono inline-flex min-h-10 items-center gap-1.5 rounded-full border-2 border-border bg-foreground px-4 py-2 text-background shadow-offset-sm press"
              >
                {link.label}
                <ArrowUpRight className="size-3.5" aria-hidden />
              </a>
            ))}
            {venue.phone && (
              <a
                href={`tel:${venue.phone.replace(/\s/g, "")}`}
                className="label-mono inline-flex min-h-10 items-center rounded-full border-2 border-border bg-card px-4 py-2 shadow-offset-sm press"
              >
                {venue.phone}
              </a>
            )}
          </div>

          {!venue.bookingUrl && (
            <p className="text-xs text-muted-foreground">
              Booking details are TBD — contact the venue directly for availability and rates.
            </p>
          )}

          <p className="text-xs leading-relaxed text-muted-foreground">
            Prices, availability and booking terms change fast around Devcon dates. This is a
            community-curated directory — Krew3 is not affiliated, paid by, or sponsored by any of
            these venues. Book directly with the venue.
          </p>
        </div>
      </div>
    </div>
  );
}
