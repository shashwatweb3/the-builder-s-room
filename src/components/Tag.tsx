import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Tag({
  children,
  tone = "default",
  compact = false,
  className,
}: {
  children: ReactNode;
  tone?: "default" | "purple" | "ghost";
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "label-mono inline-flex max-w-full items-center truncate rounded-full border-2 border-border leading-none",
        compact ? "px-2 py-0.5" : "px-2.5 py-1",
        tone === "default" && "bg-background",
        tone === "purple" && "bg-lavender",
        tone === "ghost" && "border-foreground/25 bg-transparent",
        className,
      )}
    >
      {children}
    </span>
  );
}
