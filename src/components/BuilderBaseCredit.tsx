import { cn } from "@/lib/utils";

const BB_LOGO_SRC = "/assets/bb-logo-light.svg";
const LUCKOW_LOGO_SRC = "/assets/lucknow.jpg";
const BUILDER_BASE_URL = "https://link3.to/builderbase";
const LUCKOW_DAO_URL: string | null = null;

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
        "flex flex-col gap-2",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      <span className="label-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        Supported by
      </span>
      <div className="flex items-center gap-2 sm:gap-3">
        <a
          href={BUILDER_BASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Builder Base"
          className="no-underline"
        >
          <img
            src={BB_LOGO_SRC}
            alt="Builder Base"
            width={1080}
            height={1080}
            loading="lazy"
            className="h-[100px] w-auto sm:h-[120px]"
          />
        </a>
        <span aria-hidden="true" className="text-lg leading-none text-muted-foreground/60">
          ×
        </span>
        {LUCKOW_DAO_URL ? (
          <a
            href={LUCKOW_DAO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Lucknow DAO"
            className="no-underline"
          >
            <span className="block h-[48px] w-[48px] overflow-hidden rounded-lg border border-border bg-ink shadow-offset-sm sm:h-[57px] sm:w-[57px]">
              <img
                src={LUCKOW_LOGO_SRC}
                alt="Lucknow DAO"
                width={377}
                height={377}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </span>
          </a>
        ) : (
          <span className="block h-[48px] w-[48px] overflow-hidden rounded-lg border border-border bg-ink shadow-offset-sm sm:h-[57px] sm:w-[57px]">
            <img
              src={LUCKOW_LOGO_SRC}
              alt="Lucknow DAO"
              width={377}
              height={377}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </span>
        )}
      </div>
    </div>
  );
}
