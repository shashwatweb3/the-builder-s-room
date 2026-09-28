import { cn } from "@/lib/utils";

const BB_LOGO_SRC = "/assets/bb-logo-light.svg";

export function BuilderBaseCredit({
  align = "center",
  className,
}: {
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      <span className="label-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        Supported by
      </span>
      <img
        src={BB_LOGO_SRC}
        alt="Builder Base"
        width={1080}
        height={1080}
        loading="lazy"
        className="h-16 w-auto sm:h-20"
      />
    </div>
  );
}
