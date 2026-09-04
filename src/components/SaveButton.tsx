import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useSaved } from "@/lib/saved";
import type { SavedKind } from "@/data/types";
import { cn } from "@/lib/utils";

export function SaveButton({
  kind,
  id,
  label,
  withText = false,
  className,
}: {
  kind: SavedKind;
  id: string;
  label: string;
  withText?: boolean;
  className?: string;
}) {
  const { isSaved, toggleSaved, hydrated } = useSaved();
  const active = hydrated && isSaved(kind, id);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${label} from saved` : `Save ${label}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const nowSaved = toggleSaved(kind, id);
        toast(nowSaved ? "Saved to your Krew." : "Removed from saved.", {
          description: nowSaved ? label : undefined,
        });
      }}
      className={cn(
        "press grid min-h-9 min-w-9 shrink-0 place-items-center gap-2 rounded-full border-2 border-border shadow-offset-sm",
        withText && "min-h-11 px-4 text-sm font-semibold [grid-auto-flow:column]",
        active ? "bg-primary text-primary-foreground" : "bg-card",
        className,
      )}
    >
      <Bookmark
        className={cn("size-4 transition-transform", active && "scale-110 fill-current")}
        aria-hidden
      />
      {withText && <span>{active ? "Saved" : "Save"}</span>}
    </button>
  );
}
