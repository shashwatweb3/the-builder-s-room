import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import type { Builder, BuilderStatus } from "@/data/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const statusLabel: Record<BuilderStatus, string> = {
  building: "Building",
  "open-to-collabs": "Open to collabs",
  "available-for-work": "Available for work",
  "open-to-opportunities": "Open to opportunities",
};
import { OffsetCard } from "./OffsetCard";
import { Tag } from "./Tag";
import { SaveButton } from "./SaveButton";
import { cn } from "@/lib/utils";

export function BuilderCard({ builder }: { builder: Builder }) {
  return (
    <OffsetCard as="article" interactive className="group relative flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className={cn(
            "grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-border text-lg font-extrabold shadow-offset-sm",
            builder.accent,
          )}
        >
          {initials(builder.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-extrabold tracking-tight">
            <Link
              to="/builders/$id"
              params={{ id: builder.id }}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {builder.name}
            </Link>
          </h3>
          <p className="truncate text-sm font-medium text-muted-foreground">{builder.roleLabel}</p>
        </div>
        <SaveButton kind="builder" id={builder.id} label={builder.name} className="relative z-10" />
      </div>

      <p className="mt-4 line-clamp-3 text-sm text-muted-foreground sm:text-base">{builder.bio}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {builder.skills.slice(0, 3).map((s) => (
          <Tag key={s} tone="ghost">
            {s}
          </Tag>
        ))}
      </div>

      <div className="mt-auto space-y-3 pt-5">
        <p className="label-mono flex items-center gap-2 text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden />
          {builder.location}
        </p>
        <div className="flex flex-wrap gap-2 border-t-2 border-dashed border-foreground/15 pt-4">
          {builder.statuses.slice(0, 2).map((s) => (
            <Tag key={s} tone="purple">
              {statusLabel[s]}
            </Tag>
          ))}
        </div>
      </div>
    </OffsetCard>
  );
}
