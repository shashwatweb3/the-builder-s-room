import { Link } from "@tanstack/react-router";
import { Button } from "./Button";
import { OffsetCard } from "./OffsetCard";

export function CollabPanel() {
  return (
    <OffsetCard
      as="section"
      tone="purple"
      size="lg"
      className="grid-paper overflow-hidden p-6 sm:p-10"
      aria-labelledby="collab-heading"
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_auto] lg:items-end">
        <div>
          <p className="label-mono text-primary-foreground/80">Collaboration</p>
          <h2
            id="collab-heading"
            className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl"
          >
            Looking for someone to build with?
          </h2>
          <p className="mt-3 max-w-lg text-base text-primary-foreground/85 sm:text-lg">
            Good projects rarely happen alone. Find someone with the skills you're missing.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
          <Button asChild variant="ink" size="lg">
            <Link to="/builders">Find a collaborator →</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="https://t.me/Lucky_sc0" target="_blank" rel="noopener noreferrer">
              Start a project →
            </a>
          </Button>
        </div>
      </div>
    </OffsetCard>
  );
}
