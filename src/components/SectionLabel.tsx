import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Dot } from "./StatusBadge";

export function SectionLabel({
  children,
  dot = true,
  className,
}: {
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <p className={cn("label-mono flex items-center gap-2 text-muted-foreground", className)}>
      {dot && <Dot tone="purple" />}
      {children}
    </p>
  );
}
