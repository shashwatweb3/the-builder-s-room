import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface OffsetCardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  interactive?: boolean;
  tone?: "card" | "ivory" | "purple" | "ink" | "lavender";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const tones = {
  card: "bg-card text-foreground",
  ivory: "bg-background text-foreground",
  purple: "bg-primary text-primary-foreground",
  lavender: "bg-lavender text-foreground",
  ink: "bg-foreground text-background",
};

const shadows = {
  sm: "shadow-offset-sm",
  md: "shadow-offset",
  lg: "shadow-offset-lg",
};

export function OffsetCard({
  as,
  interactive = false,
  tone = "card",
  size = "md",
  className,
  children,
  ...props
}: OffsetCardProps) {
  const Comp = (as ?? "div") as ElementType;
  return (
    <Comp
      className={cn(
        "rounded-2xl border-2 border-border",
        tones[tone],
        shadows[size],
        interactive &&
          "press cursor-pointer focus-within:-translate-x-0.5 focus-within:-translate-y-0.5",
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
