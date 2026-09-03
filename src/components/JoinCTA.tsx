import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { Button } from "./Button";
import { OffsetCard } from "./OffsetCard";
import { SectionLabel } from "./SectionLabel";
import { cn } from "@/lib/utils";

export function JoinCTA({ className }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("That email doesn't look right.");
      return;
    }
    setError(null);
    setDone(true);
  };

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
          <SectionLabel>Join the room</SectionLabel>
          <h2 id="join-heading" className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Pull up a chair.
          </h2>
          <p className="mt-3 max-w-md text-base text-foreground/75 sm:text-lg">
            Join the community and stay updated with projects, events and opportunities.
          </p>
        </div>

        {done ? (
          <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-offset">
            <span className="grid size-11 place-items-center rounded-full border-2 border-border bg-primary text-primary-foreground">
              <Check className="size-5" aria-hidden />
            </span>
            <p className="mt-4 text-2xl font-extrabold tracking-tight">You're in the room.</p>
            <p className="mt-2 text-base text-muted-foreground">You'll hear from us soon.</p>
          </div>
        ) : (
          <form
            onSubmit={submit}
            noValidate
            className="rounded-2xl border-2 border-border bg-card p-5 shadow-offset sm:p-6"
          >
            <label htmlFor="join-email" className="label-mono text-muted-foreground">
              Your email
            </label>
            <input
              id="join-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-invalid={!!error}
              aria-describedby={error ? "join-error" : undefined}
              className="mt-2 min-h-12 w-full rounded-full border-2 border-border bg-background px-4 text-base outline-none placeholder:text-muted-foreground"
            />
            {error && (
              <p id="join-error" role="alert" className="mt-2 text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="mt-5 w-full">
              Join the Room
            </Button>
          </form>
        )}
      </div>
    </OffsetCard>
  );
}
