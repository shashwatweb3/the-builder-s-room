import { cn } from "@/lib/utils";
import { OffsetCard } from "./OffsetCard";

function Bar({ className }: { className?: string }) {
  return <span className={cn("block animate-pulse rounded-full bg-foreground/10", className)} />;
}

export function CardSkeleton() {
  return (
    <OffsetCard className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <Bar className="h-4 w-20" />
        <Bar className="h-4 w-14" />
      </div>
      <Bar className="h-7 w-3/4" />
      <Bar className="h-4 w-full" />
      <Bar className="h-4 w-2/3" />
      <div className="flex gap-2 pt-2">
        <Bar className="h-6 w-16 rounded-full" />
        <Bar className="h-6 w-20 rounded-full" />
      </div>
    </OffsetCard>
  );
}

export function LoadingState({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      <span className="sr-only">Loading the Krew…</span>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
