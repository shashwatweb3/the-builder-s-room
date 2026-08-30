import { cn } from "@/lib/utils";

export function Dot({
  tone = "live",
  className,
}: {
  tone?: "live" | "purple" | "ink";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "pulse-dot inline-block size-2 rounded-full",
        tone === "live" && "bg-live",
        tone === "purple" && "bg-primary",
        tone === "ink" && "bg-foreground",
        className,
      )}
    />
  );
}

export function StatusBadge({
  label,
  tone = "neutral",
  dot = false,
  className,
}: {
  label: string;
  tone?: "neutral" | "live" | "purple" | "closed";
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "label-mono inline-flex items-center gap-1.5 rounded-full border-2 border-border px-2.5 py-1 leading-none",
        tone === "neutral" && "bg-background",
        tone === "live" && "bg-live/20",
        tone === "purple" && "bg-primary text-primary-foreground",
        tone === "closed" && "border-foreground/30 bg-transparent text-muted-foreground",
        className,
      )}
    >
      {dot && <Dot tone={tone === "purple" ? "ink" : "live"} />}
      {label}
    </span>
  );
}
