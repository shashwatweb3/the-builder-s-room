import { cn } from "@/lib/utils";

const BB_LOGO_SRC = "/assets/bb-logo-light.svg";
const LUCKOW_LOGO_SRC = "/assets/lucknow.jpg";
const BUILDER_BASE_URL = "https://link3.to/builderbase";
const LUCKOW_DAO_URL: string | null = null;

export function BuilderBaseCredit({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-3 text-center", className)}>
      <span className="label-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        Supported by
      </span>
      <div className="flex items-center gap-3 sm:gap-4">
        <a
          href={BUILDER_BASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Builder Base"
          className="flex min-h-[104px] w-[110px] flex-col items-center justify-center gap-2 rounded-xl border border-ink bg-card p-3 shadow-offset-sm transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-offset-lg sm:min-h-[112px] sm:w-[124px]"
        >
          <img
            src={BB_LOGO_SRC}
            alt="Builder Base"
            width={1080}
            height={1080}
            loading="lazy"
            className="h-[56px] w-auto sm:h-[64px]"
          />
          <span className="label-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            Builder Base
          </span>
        </a>
        {LUCKOW_DAO_URL ? (
          <a
            href={LUCKOW_DAO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Lucknow DAO"
            className="flex min-h-[104px] w-[110px] flex-col items-center justify-center gap-2 rounded-xl border border-ink bg-card p-3 shadow-offset-sm transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-offset-lg sm:min-h-[112px] sm:w-[124px]"
          >
            <span className="block h-[27px] w-[27px] overflow-hidden rounded-md border border-border bg-ink sm:h-[31px] sm:w-[31px]">
              <img
                src={LUCKOW_LOGO_SRC}
                alt="Lucknow DAO"
                width={377}
                height={377}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </span>
            <span className="label-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              Lucknow DAO
            </span>
          </a>
        ) : (
          <div className="flex min-h-[104px] w-[110px] flex-col items-center justify-center gap-2 rounded-xl border border-ink bg-card p-3 shadow-offset-sm sm:min-h-[112px] sm:w-[124px]">
            <span className="block h-[27px] w-[27px] overflow-hidden rounded-md border border-border bg-ink sm:h-[31px] sm:w-[31px]">
              <img
                src={LUCKOW_LOGO_SRC}
                alt="Lucknow DAO"
                width={377}
                height={377}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </span>
            <span className="label-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              Lucknow DAO
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
