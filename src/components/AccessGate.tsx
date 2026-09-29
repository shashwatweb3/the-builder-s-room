import { type FormEvent, type ReactNode, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/Button";
import { BuilderBaseCredit } from "@/components/BuilderBaseCredit";
import { OffsetCard } from "@/components/OffsetCard";
import { SectionLabel } from "@/components/SectionLabel";
import { useKrewAccess } from "@/lib/krew-access";
import { TELEGRAM_INVITE_URL } from "@/lib/community";

/**
 * The Krew3 members-only card. Shared by the full-page route gates
 * (/events, /opportunities and their detail routes) and by inline
 * sections on the homepage. It is presentational: the parent owns the
 * access state (useKrewAccess) and renders this card only while locked.
 */
export function AccessGateCard({
  onUnlock,
  error,
  headingLevel = "h1",
}: {
  onUnlock: (code: string) => boolean;
  error: boolean;
  headingLevel?: "h1" | "h2";
}) {
  const [code, setCode] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onUnlock(code);
  };

  const Heading = headingLevel === "h2" ? "h2" : "h1";

  return (
    <OffsetCard size="lg" className="w-full max-w-lg p-5 text-center sm:p-12">
      <SectionLabel dot={false}>KREW ACCESS</SectionLabel>

      <Heading className="mt-3 text-2xl font-extrabold tracking-tight sm:mt-5 sm:text-4xl">
        Krew3 members only.
      </Heading>

      <p className="mx-auto mt-3 max-w-sm text-base text-muted-foreground sm:mt-4">
        Get approved in the Krew3 community to unlock events, opportunities, and more.
      </p>

      <div className="mt-5 sm:mt-7">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <a href={TELEGRAM_INVITE_URL} target="_blank" rel="noopener noreferrer">
            Get approved in the Krew
            <ArrowRight className="size-4" aria-hidden />
          </a>
        </Button>
      </div>

      <div className="my-6 flex items-center gap-3 sm:my-8">
        <span className="h-px flex-1 bg-border" />
        <span className="label-mono text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <p className="text-sm text-muted-foreground">Already approved? Enter your access code.</p>

      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 sm:mt-4 sm:flex-row">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
          }}
          placeholder="Enter access code"
          autoComplete="off"
          spellCheck={false}
          className="flex-1 rounded-full border-2 border-border bg-card px-5 py-2.5 text-sm font-medium outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
        />
        <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto">
          Unlock
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </form>

      {error && (
        <p className="mt-3 text-sm font-medium text-destructive">
          That code doesn&apos;t look right. Try again.
        </p>
      )}

      <div className="mt-6 flex justify-center border-t border-border/70 pt-6 sm:mt-8 sm:pt-8">
        <BuilderBaseCredit />
      </div>
    </OffsetCard>
  );
}

export function AccessGate({ children }: { children: ReactNode }) {
  const { unlocked, hydrated, error, unlock } = useKrewAccess();

  if (!hydrated) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-4 py-20">
        <div className="label-mono text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-4 py-10 sm:py-20">
      <AccessGateCard onUnlock={unlock} error={error} headingLevel="h1" />
    </div>
  );
}
