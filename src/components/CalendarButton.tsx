import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import type { RecEvent } from "@/data/types";
import { buildEventIcs, eventCalendarFilename, inferTimeZone } from "@/lib/calendar";
import { downloadText } from "@/lib/download";
import { formatDate, formatTimeRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./Button";

type CalendarButtonProps = {
  event: RecEvent;
  /** Compact icon for cards; full labelled button for detail pages. */
  variant?: "icon" | "full";
  className?: string;
};

/**
 * Downloads a single-event .ics file. Disabled until the event has a date,
 * because inventing one would put a wrong entry in the user's calendar.
 */
export function CalendarButton({ event, variant = "icon", className }: CalendarButtonProps) {
  const hasDate = Boolean(event.date);
  const label = hasDate
    ? `Add ${event.name} to calendar`
    : `${event.name} has no confirmed date yet`;

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Event cards use a stretched link; keep the click local.
    e.preventDefault();
    e.stopPropagation();

    const ics = buildEventIcs(event);
    if (!ics) {
      toast("Calendar export isn't ready", {
        description: "This event has no confirmed date yet.",
      });
      return;
    }

    downloadText(ics, eventCalendarFilename(event.slug), "text/calendar;charset=utf-8");
    const when = event.date ? formatDate(event.date) : "";
    const time = formatTimeRange(event.startTime, event.endTime);
    const zone = inferTimeZone(event);
    toast("Calendar file downloaded", {
      description: [when, time && `${time}${zone ? " IST" : ""}`].filter(Boolean).join(" · "),
    });
  };

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!hasDate}
        aria-label={label}
        title={hasDate ? "Download a calendar file for this event" : "Date not announced yet"}
        className={cn(
          buttonVariants({ variant: "outline", size: "md" }),
          "relative z-10 w-full",
          className,
        )}
      >
        <CalendarPlus className="size-4" aria-hidden />
        Add to calendar
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!hasDate}
      aria-label={label}
      title={hasDate ? "Add to calendar" : "Date not announced yet"}
      className={cn(
        "relative z-10 grid size-9 shrink-0 place-items-center rounded-full border-2 border-border bg-card shadow-offset-sm transition-colors duration-150 hover:bg-lavender/60 disabled:opacity-50",
        className,
      )}
    >
      <CalendarPlus className="size-4" aria-hidden />
    </button>
  );
}
