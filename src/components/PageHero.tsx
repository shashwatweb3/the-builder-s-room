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
      <div className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div className="rise-in">
            <SectionLabel>{label}</SectionLabel>
            <h1 className="mt-4 text-[clamp(2.5rem,8vw,5rem)] leading-[0.95] font-extrabold tracking-tight">
              {title}
            </h1>
            {children && (
              <div className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
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
