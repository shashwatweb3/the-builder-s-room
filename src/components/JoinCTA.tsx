import { Button } from "./Button";
import { OffsetCard } from "./OffsetCard";
import { SectionLabel } from "./SectionLabel";
import { cn } from "@/lib/utils";
import { TELEGRAM_INVITE_URL } from "@/lib/community";

export function JoinCTA({ className }: { className?: string }) {
  return (
    <OffsetCard
      as="section"
      tone="lavender"
      size="lg"
      id="join"
      className={cn("scroll-mt-24 overflow-hidden p-6 sm:p-10", className)}
      aria-labelledby="join-heading"
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <SectionLabel>Join the Krew</SectionLabel>
          <h2 id="join-heading" className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Join the Krew.
          </h2>
          <p className="mt-3 max-w-md text-base text-foreground/75 sm:text-lg">
            Builders and creators learning, helping, and building together.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-offset sm:p-6">
          <Button asChild size="lg" className="w-full">
            <a href={TELEGRAM_INVITE_URL} target="_blank" rel="noopener noreferrer">
              Join the Krew →
            </a>
          </Button>
        </div>
      </div>
    </OffsetCard>
  );
}
