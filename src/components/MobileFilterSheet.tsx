import { useEffect } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MobileFilterOption {
  value: string;
  label: string;
  count?: number;
}

/**
 * Mobile-only filter bottom sheet for the events guide. Slides up from the
 * screen bottom over a dimmed backdrop. Locked to small screens — desktop
 * keeps the inline pill rows and never renders this.
 */
export function MobileFilterSheet({
  open,
  onClose,
  options,
  value,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  options: MobileFilterOption[];
  value: string;
  onSelect: (value: string) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      className={cn("fixed inset-0 z-[70] sm:hidden", !open && "pointer-events-none")}
      aria-hidden={!open}
    >
      <div
        className={cn("absolute inset-0 bg-ink/40", open ? "fade-in" : "opacity-0")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filter events"
        className={cn(
          "absolute inset-x-0 bottom-0 mx-auto w-full max-w-[560px] rounded-t-3xl border-2 border-b-0 border-border bg-background px-4 pb-8 pt-3 shadow-offset-lg",
          open ? "sheet-in" : "translate-y-full",
        )}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink/25" aria-hidden />
        <div className="flex items-center justify-between">
          <p className="label-mono text-muted-foreground">Filter events</p>
          <button
            type="button"
            onClick={onClose}
            className="label-mono press min-h-9 rounded-full border-2 border-border bg-card px-3.5 shadow-offset-sm"
          >
            Done
          </button>
        </div>

        <ul className="mt-3 max-h-[60vh] space-y-1 overflow-y-auto pb-1">
          {options.map((o) => {
            const active = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    onSelect(o.value);
                    onClose();
                  }}
                  className={cn(
                    "flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-2.5 text-left transition-colors",
                    active
                      ? "border-border bg-lavender"
                      : "border-transparent hover:bg-lavender/40",
                  )}
                >
                  <span
                    className={cn(
                      "font-semibold",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {o.label}
                  </span>
                  <span className="label-mono flex items-center gap-2 text-muted-foreground">
                    {typeof o.count === "number" && <span>{o.count}</span>}
                    {active && <Check className="size-4 text-foreground" aria-hidden />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
