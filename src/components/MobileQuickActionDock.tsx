import { Search, SlidersHorizontal, CalendarDays } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function MobileQuickActionDock({
  onOpenSearch,
  onOpenFilters,
  className,
}: {
  onOpenSearch: () => void;
  onOpenFilters: () => void;
  className?: string;
}) {
  return (
    <nav
      aria-label="Quick actions"
      className={cn(
        "fixed inset-x-0 bottom-0 z-[65] mx-auto w-full max-w-[420px] px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] sm:hidden",
        className,
      )}
    >
      <div className="flex items-center justify-around rounded-full border-2 border-border bg-background/95 px-2 py-1 shadow-offset-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <button
          type="button"
          onClick={onOpenSearch}
          className="press flex min-h-[48px] min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-full px-2 text-foreground"
          aria-label="Search events"
        >
          <Search className="size-4" aria-hidden />
          <span className="label-mono text-[9px]">Search</span>
        </button>
        <button
          type="button"
          onClick={onOpenFilters}
          className="press flex min-h-[48px] min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-full px-2 text-foreground"
          aria-label="Open filters"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          <span className="label-mono text-[9px]">Filters</span>
        </button>
        <Link
          to="/schedule"
          className="press flex min-h-[48px] min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-full px-2 text-foreground"
          aria-label="My Schedule"
        >
          <CalendarDays className="size-4" aria-hidden />
          <span className="label-mono text-[9px]">My Schedule</span>
        </Link>
      </div>
    </nav>
  );
}
