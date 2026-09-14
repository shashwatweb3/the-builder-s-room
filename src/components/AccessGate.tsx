import { type ReactNode, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/Button";
import { OffsetCard } from "@/components/OffsetCard";
import { SectionLabel } from "@/components/SectionLabel";
import { useKrewAccess } from "@/lib/krew-access";
import { TELEGRAM_INVITE_URL } from "@/lib/community";

export function AccessGate({ children }: { children: ReactNode }) {
  const { unlocked, hydrated, error, unlock } = useKrewAccess();
  const [code, setCode] = useState("");

  if (!hydrated) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-4 py-20">
        <div className="label-mono text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    unlock(code);
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-4 py-20">
      <OffsetCard size="lg" className="w-full max-w-lg p-8 sm:p-12 text-center rise-in">
        <SectionLabel dot={false}>KREW ACCESS</SectionLabel>

        <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Krew3 members only.
        </h1>

        <p className="mx-auto mt-4 max-w-sm text-muted-foreground">
          Get approved in the Krew3 community to unlock events, opportunities, and more.
        </p>

        <div className="mt-7">
          <Button asChild size="lg">
            <a href={TELEGRAM_INVITE_URL} target="_blank" rel="noopener noreferrer">
              Get approved in the Krew
              <ArrowRight className="size-4" aria-hidden />
            </a>
          </Button>
        </div>

        <div className="my-8 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="label-mono text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <p className="text-sm text-muted-foreground">Already approved? Enter your access code.</p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
            }}
            placeholder="Enter access code"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 rounded-full border-2 border-border bg-card px-5 py-3 text-sm font-medium outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
          <Button type="submit" variant="primary" size="md">
            Unlock
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </form>

        {error && (
          <p className="mt-3 text-sm font-medium text-destructive">
            That code doesn&apos;t look right. Try again.
          </p>
        )}
      </OffsetCard>
    </div>
  );
}
