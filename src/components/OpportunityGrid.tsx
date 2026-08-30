import { Link } from "@tanstack/react-router";
import type { Opportunity } from "@/data/types";
import { OpportunityCard } from "./OpportunityCard";
import { EmptyState } from "./EmptyState";
import { Button } from "./Button";

export function OpportunityGrid({ items }: { items: Opportunity[] }) {
  if (!items.length) {
    return (
      <EmptyState
        title="Nothing matches that."
        body="Loosen a filter or two. The room is bigger than it looks."
        action={
          <Button asChild variant="outline">
            <Link to="/opportunities" search={{ category: undefined }}>Explore everything →</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((o) => (
        <OpportunityCard key={o.id} item={o} />
      ))}
    </div>
  );
}
