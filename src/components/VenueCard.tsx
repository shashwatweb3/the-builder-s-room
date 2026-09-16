import { ArrowUpRight } from "lucide-react";
import type { Venue } from "@/data/venues";
import { VENUE_CATEGORIES } from "@/data/venues";
import { cn } from "@/lib/utils";
import { OffsetCard } from "./OffsetCard";
import { Tag } from "./Tag";

export function VenueCard({
  venue,
  onSelect,
  className,
}: {
  venue: Venue;
  onSelect: () => void;
  className?: string;
}) {
  const category = VENUE_CATEGORIES[venue.category];

  return (
    <OffsetCard
      as="article"
      interactive
      className={cn("group relative flex h-full flex-col gap-3 p-4 sm:p-5", className)}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-label={`View venue details for ${venue.name}`}
        className="after:absolute after:inset-0 after:content-['']"
      />

      <div className="flex items-center justify-between gap-2">
        <Tag tone="purple" compact>
          {category.shortLabel}
        </Tag>
        <Tag tone="ghost" compact>
          {venue.indoorOutdoor}
        </Tag>
      </div>

      <h3 className="line-clamp-2 text-lg font-extrabold leading-snug tracking-tight">
        {venue.name}
      </h3>

      <p className="label-mono text-muted-foreground">
        {venue.type} · {venue.areaLabel}
      </p>

      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        Best for {venue.bestFor}
      </p>

      <dl className="label-mono mt-auto grid grid-cols-3 gap-1.5 border-t-2 border-dashed border-foreground/15 pt-3">
        <div className="flex flex-col gap-0.5">
          <dt className="truncate text-muted-foreground/70">Capacity</dt>
          <dd className="truncate font-semibold">{venue.capacityTier}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="truncate text-muted-foreground/70">Budget</dt>
          <dd className="truncate font-semibold">{venue.budget}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="truncate text-muted-foreground/70">From JWCC</dt>
          <dd className="truncate font-semibold">{venue.distanceKm}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-1.5">
        {venue.tags.slice(0, 3).map((t) => (
          <Tag key={t} compact tone="ghost">
            {t}
          </Tag>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="label-mono text-primary">View venue</span>
        <ArrowUpRight
          className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden
        />
      </div>
    </OffsetCard>
  );
}
