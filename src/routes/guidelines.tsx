import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { OffsetCard } from "@/components/OffsetCard";
import { Button } from "@/components/Button";

export const Route = createFileRoute("/guidelines")({
  head: () => ({
    meta: [
      { title: "Community Guidelines — The Rec Room" },
      {
        name: "description",
        content: "How we keep The Rec Room a good place to build, learn and ship together.",
      },
    ],
  }),
  component: GuidelinesPage,
});

const guidelines = [
  {
    title: "Be kind.",
    copy: "Treat people the way you'd want to be treated. No ego, no gatekeeping.",
  },
  {
    title: "Be helpful.",
    copy: "Share what you know. Answer questions. Offer feedback. Everyone's learning.",
  },
  {
    title: "Be constructive.",
    copy: "If something isn't working, suggest what might. Critique ideas, not people.",
  },
  {
    title: "Be honest.",
    copy: "Share what's actually happening — the wins and the messy middle. That's what makes this place real.",
  },
  {
    title: "Be inclusive.",
    copy: "The room is for everyone who builds — regardless of background, experience level, or stack.",
  },
];

function GuidelinesPage() {
  return (
    <>
      <PageHero label="Community Guidelines" title="How we treat each other.">
        The Rec Room works because people respect each other. Here's what we expect.
      </PageHero>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <div className="max-w-3xl space-y-10">
          {guidelines.map((g, i) => (
            <div key={g.title} className="flex gap-5">
              <span className="label-mono mt-1 shrink-0 text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <OffsetCard className="flex-1 p-5 sm:p-6">
                <h3 className="text-xl font-extrabold tracking-tight">{g.title}</h3>
                <p className="mt-2 text-base text-muted-foreground">{g.copy}</p>
              </OffsetCard>
            </div>
          ))}

          <div className="pt-4">
            <p className="text-base text-muted-foreground">
              These guidelines apply everywhere in The Rec Room — posts, events, DMs, and comments.
              If something doesn't feel right, let us know.
            </p>
            <Button asChild variant="outline" size="lg" className="mt-4">
              <Link to="/contact">
                Get in touch <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
