import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { OffsetCard } from "@/components/OffsetCard";
import { SectionLabel } from "@/components/SectionLabel";
import { Button } from "@/components/Button";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Submit — Krew3" },
      {
        name: "description",
        content:
          "Got something worth sharing with the Krew? DM us on Telegram and we'll review it before it goes live.",
      },
    ],
  }),
  component: SubmitPage,
});

const TELEGRAM_URL = "https://t.me/Lucky_sc0";

function SubmitPage() {
  return (
    <>
      <PageHero label="Submit" title="Got something worth sharing?">
        A job, a hackathon, a residency, a grant, an ambassador program, a project or an event. If
        it makes the Krew more interesting, we want it.
      </PageHero>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <OffsetCard tone="lavender" size="lg" className="max-w-3xl p-6 sm:p-10">
          <SectionLabel dot>How to submit</SectionLabel>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Send it over and we'll review it.
          </h2>
          <p className="mt-3 max-w-xl text-base text-foreground/75 sm:text-lg">
            We review everything before it goes live, so there's no public posting. Message{" "}
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline decoration-2 underline-offset-2 hover:opacity-80"
            >
              @Lucky_sc0 on Telegram
            </a>{" "}
            with the details — title, a couple of honest sentences, and a link.
          </p>
          <Button asChild variant="ink" size="lg" className="mt-6">
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
              DM @Lucky_sc0 <ArrowUpRight className="size-4" aria-hidden />
            </a>
          </Button>
          <p className="label-mono mt-3 text-foreground/60">
            We read everything before it goes live.
          </p>
        </OffsetCard>

        <div className="mt-10">
          <Link to="/" className="label-mono text-muted-foreground hover:text-foreground">
            ← Back to Krew3
          </Link>
        </div>
      </section>
    </>
  );
}
