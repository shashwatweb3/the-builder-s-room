import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Tag({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "purple" | "ghost";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "label-mono inline-flex max-w-full items-center truncate rounded-full border-2 border-border px-2.5 py-1 leading-none",
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
