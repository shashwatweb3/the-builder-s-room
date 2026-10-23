import { Bookmark, BookmarkCheck } from "lucide-react";
import type { RecEvent } from "@/data/types";
import { useSchedule } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./Button";

type ScheduleButtonProps = {
  event: RecEvent;
  /** Compact icon for cards; full labelled button for detail pages. */
  variant?: "icon" | "full";
  className?: string;
};

/**
 * Save/unsave an event. Renders a disabled, neutral control until localStorage
 * has been read so server and first client render agree.
 */
export function ScheduleButton({ event, variant = "icon", className }: ScheduleButtonProps) {
  const { hydrated, isScheduled, toggle } = useSchedule();
  const saved = hydrated && isScheduled(event.slug);
  const label = saved ? "Remove from my schedule" : "Add to my schedule";

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Event cards use an absolutely-positioned stretched link; stop the click
    // from navigating to the detail page.
    e.preventDefault();
    e.stopPropagation();
    if (!hydrated) return;
    toggle(event);
  };

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!hydrated}
        aria-pressed={saved}
        aria-label={label}
        title={label}
        className={cn(
          buttonVariants({ variant: saved ? "soft" : "outline", size: "md" }),
          "relative z-10 w-full",
          className,
        )}
      >
        {saved ? (
          <BookmarkCheck className="size-4" aria-hidden />
        ) : (
          <Bookmark className="size-4" aria-hidden />
        )}
        {saved ? "In my schedule" : "Add to my schedule"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!hydrated}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={cn(
        "relative z-10 grid size-9 shrink-0 place-items-center rounded-full border-2 border-border bg-card shadow-offset-sm transition-colors duration-150 hover:bg-lavender/60 disabled:opacity-50",
        saved && "bg-lavender",
        className,
      )}
    >
      {saved ? (
        <BookmarkCheck className="size-4" aria-hidden />
      ) : (
        <Bookmark className="size-4" aria-hidden />
      )}
    </button>
  );
}
