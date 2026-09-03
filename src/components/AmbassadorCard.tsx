import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { AmbassadorProgram } from "@/data/types";

const programTypeLabel: Record<string, string> = {
  community: "Community",
  content: "Content",
  developer: "Developer",
  regional: "Regional",
};
import { deadlineLabel } from "@/lib/format";
import { OffsetCard } from "./OffsetCard";
import { Tag } from "./Tag";
import { StatusBadge } from "./StatusBadge";

export function AmbassadorCard({
  program,
  featured = false,
}: {
  program: AmbassadorProgram;
  featured?: boolean;
}) {
  return (
    <OffsetCard
      as="article"
      interactive
      tone={featured ? "lavender" : "card"}
      size={featured ? "lg" : "md"}
      className="group relative flex h-full flex-col p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Tag tone={featured ? "default" : "purple"}>{programTypeLabel[program.type]}</Tag>
        {program.paid && <Tag tone="ghost">Paid</Tag>}
        {program.remote && <Tag tone="ghost">Remote</Tag>}
      </div>

      <p className="label-mono mt-4 text-muted-foreground">{program.organization}</p>
      <h3
        className={
          featured
            ? "mt-1.5 text-3xl font-extrabold tracking-tight sm:text-5xl"
            : "mt-1.5 text-xl font-extrabold tracking-tight sm:text-2xl"
        }
      >
        <Link
          to="/ambassadors/$id"
          params={{ id: program.id }}
          className="after:absolute after:inset-0 after:content-['']"
        >
          {program.name}
        </Link>
      </h3>

      <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">{program.summary}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {program.perks.map((p) => (
          <Tag key={p} tone="ghost">
            {p}
          </Tag>
        ))}
      </div>

      <div className="mt-auto pt-5">
        <p className="text-sm font-semibold">{program.reward}</p>
        <div className="mt-3 flex items-center justify-between gap-3 border-t-2 border-dashed border-foreground/15 pt-4">
          <StatusBadge
            label={program.open ? deadlineLabel(program.deadline) : "Closed"}
            tone={program.open ? "live" : "closed"}
            dot={program.open}
          />
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
            Apply
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </OffsetCard>
  );
}
