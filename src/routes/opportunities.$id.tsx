import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Share2, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { OffsetCard } from "@/components/OffsetCard";
import { Tag } from "@/components/Tag";
import { StatusBadge } from "@/components/StatusBadge";
import { SaveButton } from "@/components/SaveButton";
import { OpportunityCard } from "@/components/OpportunityCard";
import { SectionLabel } from "@/components/SectionLabel";
import { EmptyState } from "@/components/EmptyState";
import type { OpportunityCategory } from "@/data/types";
import { deadlineLabel, formatDate, isClosingSoon } from "@/lib/format";

const categoryMeta: Record<OpportunityCategory, { label: string; plural: string; blurb: string }> =
  {
    job: { label: "Job", plural: "Jobs", blurb: "Find your next role." },
    hackathon: { label: "Hackathon", plural: "Hackathons", blurb: "Build something in a weekend." },
    residency: { label: "Residency", plural: "Residencies", blurb: "Deep work with a team." },
    grant: { label: "Grant", plural: "Grants", blurb: "Fund your next thing." },
  };

export const Route = createFileRoute("/opportunities/$id")({
  loader: () => {
    throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Opportunity not found — The Rec Room" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OpportunityDetail,
});

function OpportunityDetail() {
  return (
    <>
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-8 sm:px-6 lg:px-10">
        <Link
          to="/opportunities"
          search={{ category: undefined }}
          className="label-mono inline-flex items-center gap-2 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Back to opportunities
        </Link>
      </div>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <EmptyState
          title="Opportunity not found."
          body="This opportunity may have been removed or doesn't exist yet."
          action={null}
        />
      </section>
    </>
  );
}
