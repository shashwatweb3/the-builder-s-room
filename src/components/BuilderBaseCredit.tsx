import { cn } from "@/lib/utils";

const BB_LOGO_SRC = "/assets/bb-logo-light.svg";
const LUCKOW_LOGO_SRC = "/assets/lucknow.jpg";
const BUILDER_BASE_URL = "https://link3.to/builderbase";
const LUCKOW_DAO_URL = "https://x.com/Lucknow_DAO";
const DEVCON_TICKETS_URL = "https://tickets.devcon.org/";
const DEVCON_LOGO_SRC = "/assets/devcon-logo.webp";
const VARA_NETWORK_URL = "https://vara.network/";
const VARA_LOGO_SRC = "/assets/vara.jpg";

export function BuilderBaseCredit({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-3 text-center sm:gap-5", className)}>
      <span className="label-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        Supported by
      </span>
      <div className="no-scrollbar w-full overflow-x-auto">
        <div className="mx-auto flex w-max flex-nowrap items-stretch gap-1 sm:w-full sm:flex-wrap sm:justify-center sm:gap-4">
          <a
            href={BUILDER_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit Builder Base"
            className="flex min-h-[88px] w-[76px] flex-col items-center justify-center gap-1 rounded-xl border border-ink bg-card p-[6px] shadow-offset-sm transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-offset-lg active:translate-y-0.5 active:shadow-offset-sm motion-reduce:transition-none sm:min-h-[104px] sm:w-[110px] sm:gap-2 sm:p-3"
          >
            <img
              src={BB_LOGO_SRC}
              alt="Builder Base"
              width={1080}
              height={1080}
              loading="lazy"
              className="h-9 w-auto sm:h-[64px]"
            />
            <span className="label-mono text-[7.5px] uppercase tracking-[0.04em] text-muted-foreground sm:text-[9px] sm:tracking-[0.16em]">
              Builder Base
            </span>
          </a>
          {LUCKOW_DAO_URL ? (
            <a
              href={LUCKOW_DAO_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Lucknow DAO"
              className="flex min-h-[96px] w-[80px] flex-col items-center justify-center gap-1.5 rounded-xl border border-ink bg-card p-[7px] shadow-offset-sm transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-offset-lg active:translate-y-0.5 active:shadow-offset-sm sm:min-h-[104px] sm:w-[110px] sm:gap-2 sm:p-3"
            >
              <span className="block h-10 w-10 overflow-hidden rounded-md border border-border bg-ink sm:h-[44px] sm:w-[44px]">
                <img
                  src={LUCKOW_LOGO_SRC}
                  alt="Lucknow DAO"
                  width={377}
                  height={377}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </span>
              <span className="label-mono text-[8px] uppercase tracking-[0.04em] text-muted-foreground sm:text-[9px] sm:tracking-[0.16em]">
                Lucknow DAO
              </span>
            </a>
          ) : (
            <div className="flex min-h-[96px] w-[80px] flex-col items-center justify-center gap-1.5 rounded-xl border border-ink bg-card p-[7px] shadow-offset-sm active:translate-y-0.5 active:shadow-offset-sm sm:min-h-[104px] sm:w-[110px] sm:gap-2 sm:p-3">
              <span className="block h-10 w-10 overflow-hidden rounded-md border border-border bg-ink sm:h-[44px] sm:w-[44px]">
                <img
                  src={LUCKOW_LOGO_SRC}
                  alt="Lucknow DAO"
                  width={377}
                  height={377}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </span>
              <span className="label-mono text-[8px] uppercase tracking-[0.04em] text-muted-foreground sm:text-[9px] sm:tracking-[0.16em]">
                Lucknow DAO
              </span>
            </div>
          )}
          <a
            href={DEVCON_TICKETS_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Get your Devcon 8 ticket"
            className="flex min-h-[96px] w-[80px] flex-col items-center justify-center gap-[2px] rounded-xl border border-ink bg-card p-[7px] shadow-offset-sm transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-offset-lg active:translate-y-0.5 active:shadow-offset-sm sm:min-h-[104px] sm:w-[110px] sm:gap-1 sm:p-3"
          >
            <img
              src={DEVCON_LOGO_SRC}
              alt="Devcon"
              width={508}
              height={224}
              loading="lazy"
              className="h-4 w-auto max-w-full object-contain sm:h-5"
            />
            <span className="label-mono text-[8px] uppercase tracking-[0.04em] text-lavender-deep sm:text-[9px] sm:tracking-[0.16em]">
              Devcon 8
            </span>
            <span className="text-center text-[7.5px] leading-[1.15] font-semibold text-foreground sm:text-[10.5px]">
              Don&apos;t have your Devcon ticket?
            </span>
            <span className="text-center text-[7px] font-semibold leading-[1.15] text-foreground sm:text-[9.5px]">
              Get your ticket →
            </span>
          </a>
          <a
            href={VARA_NETWORK_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Vara Network"
            className="flex min-h-[96px] w-[80px] flex-col items-center justify-center gap-1.5 rounded-xl border border-ink bg-card p-[7px] shadow-offset-sm active:translate-y-0.5 active:shadow-offset-sm sm:min-h-[104px] sm:w-[110px] sm:gap-2 sm:p-3"
          >
            <span className="block h-10 w-10 overflow-hidden rounded-md border border-border bg-ink sm:h-[44px] sm:w-[44px]">
              <img
                src={VARA_LOGO_SRC}
                alt="Vara Network"
                width={400}
                height={400}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </span>
            <span className="label-mono text-[8px] uppercase tracking-[0.04em] text-muted-foreground sm:text-[9px] sm:tracking-[0.16em]">
              Vara Network
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
