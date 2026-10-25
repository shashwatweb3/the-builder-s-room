import { LayoutList, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type MobileEventViewMode = "detailed" | "compact";

export function MobileEventListToggle({
  mode,
  onChange,
  className,
}: {
  mode: MobileEventViewMode;
  onChange: (mode: MobileEventViewMode) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Event list view"
      className={cn(
        "flex items-center gap-1 rounded-full border-2 border-border bg-card p-0.5 shadow-offset-sm sm:hidden",
        className,
      )}
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === "detailed"}
        onClick={() => onChange("detailed")}
        className={cn(
          "press flex min-h-[36px] items-center gap-1.5 rounded-full px-2.5 text-[11px]",
          mode === "detailed" ? "bg-foreground text-background" : "text-muted-foreground",
        )}
        aria-label="Detailed cards"
      >
        <LayoutList className="size-3.5" aria-hidden />
        <span className="label-mono">Cards</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "compact"}
        onClick={() => onChange("compact")}
        className={cn(
          "press flex min-h-[36px] items-center gap-1.5 rounded-full px-2.5 text-[11px]",
          mode === "compact" ? "bg-foreground text-background" : "text-muted-foreground",
        )}
        aria-label="Compact list"
      >
        <List className="size-3.5" aria-hidden />
        <span className="label-mono">List</span>
      </button>
    </div>
  );
}
