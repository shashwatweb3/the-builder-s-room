import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import type { Opportunity, OpportunityCategory } from "@/data/types";

const categoryMeta: Record<OpportunityCategory, { label: string; plural: string; blurb: string }> =
  {
    job: { label: "Job", plural: "Jobs", blurb: "Find your next role." },
    hackathon: { label: "Hackathon", plural: "Hackathons", blurb: "Build something in a weekend." },
    residency: { label: "Residency", plural: "Residencies", blurb: "Deep work with a team." },
    grant: { label: "Grant", plural: "Grants", blurb: "Fund your next thing." },
  };
import { deadlineLabel, isClosingSoon } from "@/lib/format";
import { OffsetCard } from "./OffsetCard";
import { Tag } from "./Tag";
import { StatusBadge } from "./StatusBadge";
import { SaveButton } from "./SaveButton";

export function OpportunityCard({ item }: { item: Opportunity }) {
  const closing = item.deadline ? isClosingSoon(item.deadline) : false;

  return (
    <OffsetCard as="article" interactive className="group relative flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <Tag tone="purple">{categoryMeta[item.category].label}</Tag>
        <SaveButton kind="opportunity" id={item.id} label={item.title} className="relative z-10" />
      </div>

      <h3 className="mt-4 text-xl font-extrabold tracking-tight sm:text-2xl">
        <Link
          to="/opportunities/$id"
          params={{ id: item.id }}
          className="after:absolute after:inset-0 after:content-['']"
        >
          {item.title}
        </Link>
      </h3>
      <p className="label-mono mt-1.5 text-muted-foreground">{item.organization}</p>

      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground sm:text-base">{item.summary}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.tags.slice(0, 3).map((t) => (
          <Tag key={t} tone="ghost">
            {t}
          </Tag>
        ))}
      </div>

      <dl className="mt-5 space-y-1.5 border-t-2 border-dashed border-foreground/15 pt-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Location</dt>
          <dd className="truncate">
            {item.location}
            {item.remote && " · Remote OK"}
          </dd>
        </div>
        {item.compensation && (
          <div className="flex gap-2">
            <dt className="sr-only">Compensation</dt>
            <dd className="font-semibold">{item.compensation}</dd>
          </div>
        )}
      </dl>

      <div className="mt-5 flex items-center justify-between gap-3 pt-1">
        <StatusBadge
          label={item.deadline ? deadlineLabel(item.deadline) : "No deadline"}
          tone={closing ? "purple" : "neutral"}
          dot={closing}
        />
        {item.applyUrl ? (
          <a
            href={item.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 inline-flex items-center gap-1.5 text-sm font-semibold"
          >
            Apply
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </a>
        ) : (
          <Link
            to="/opportunities/$id"
            params={{ id: item.id }}
            className="relative z-10 inline-flex items-center gap-1.5 text-sm font-semibold"
          >
            View Details
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        )}
      </div>
    </OffsetCard>
  );
}
