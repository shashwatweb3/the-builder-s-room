import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

/** Horizontally scrollable pill row — never overflows the viewport. */
export function FilterBar({
  options,
  value,
  onChange,
  ariaLabel,
  className,
  compact = false,
}: {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0",
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "label-mono press shrink-0 snap-start rounded-full border-2 border-border shadow-offset-sm",
              compact ? "min-h-8 px-3 py-1.5" : "min-h-9 px-3.5 py-2",
              active ? "bg-foreground text-background" : "bg-card hover:bg-lavender/50",
            )}
          >
            {o.label}
            {typeof o.count === "number" && (
              <span className={cn("ml-1.5", active ? "opacity-70" : "text-muted-foreground")}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TogglePill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "label-mono press min-h-9 shrink-0 rounded-full border-2 border-border px-3.5 py-2 shadow-offset-sm",
        active ? "bg-primary text-primary-foreground" : "bg-card hover:bg-lavender/50",
      )}
    >
      {children}
    </button>
  );
}
