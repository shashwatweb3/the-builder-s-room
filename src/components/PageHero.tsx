import type { ReactNode } from "react";
import { SectionLabel } from "./SectionLabel";

export function PageHero({
  label,
  title,
  children,
  aside,
}: {
  label: string;
  title: string;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="border-b-2 border-border">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-9 sm:px-6 lg:px-10 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div className="rise-in">
            <SectionLabel>{label}</SectionLabel>
            <h1 className="mt-3 text-[clamp(2rem,9vw,2.75rem)] leading-[0.95] font-extrabold tracking-tight sm:mt-4 sm:text-[clamp(2.5rem,8vw,5rem)]">
              {title}
            </h1>
            {children && (
              <div className="mt-3 max-w-2xl text-sm leading-snug text-muted-foreground sm:mt-5 sm:text-lg sm:leading-normal">
                {children}
              </div>
            )}
          </div>
          {aside && <div className="lg:justify-self-end">{aside}</div>}
        </div>
      </div>
    </section>
  );
}
