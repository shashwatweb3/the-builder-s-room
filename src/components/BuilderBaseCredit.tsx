import { cn } from "@/lib/utils";

const BB_LOGO_SRC = "/assets/bb-logo-light.svg";
const BUILDER_BASE_URL = "https://link3.to/builderbase";

export function BuilderBaseCredit({
  align = "center",
  className,
}: {
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <a
      href={BUILDER_BASE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit Builder Base"
      className={cn(
        "flex flex-col gap-2 no-underline",
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
        className="h-[130px] w-auto sm:h-[150px]"
      />
    </a>
  );
}
