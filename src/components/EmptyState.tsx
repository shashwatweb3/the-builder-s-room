import type { ReactNode } from "react";
import { OffsetCard } from "./OffsetCard";

export function EmptyState({
  title = "Nothing here yet.",
  body = "Give it a minute. The Krew is growing.",
  action,
}: {
  title?: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <OffsetCard className="grid-paper flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="label-mono text-muted-foreground">Empty Krew</span>
      <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h3>
      <p className="max-w-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </OffsetCard>
  );
}
