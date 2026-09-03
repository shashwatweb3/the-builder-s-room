import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { OffsetCard } from "@/components/OffsetCard";
import { SectionLabel } from "@/components/SectionLabel";
import { Button } from "@/components/Button";
import { JoinCTA } from "@/components/JoinCTA";
import { TELEGRAM_INVITE_URL } from "@/lib/community";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — The Rec Room" },
      {
        name: "description",
        content:
          "The Rec Room is a community for builders and creators to learn, build, share ideas, and discover opportunities together.",
      },
    ],
  }),
  component: AboutPage,
});

const values = [
  {
    title: "People first.",
    copy: "The best projects start with interesting people meeting each other. Everything we build is in service of that.",
  },
  {
    title: "Ship together.",
    copy: "We believe great things happen when builders collaborate openly — not in isolation.",
  },
  {
    title: "No gatekeeping.",
    copy: "Whether you're a seasoned engineer or shipping your first project, you belong here.",
  },
];

function AboutPage() {
  return (
    <>
      <PageHero label="About" title="What is The Rec Room?">
        A recreation room for builders and creators. A place to meet people, learn together, share
        what you're building and find your next rabbit hole.
      </PageHero>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <div className="max-w-3xl space-y-8">
          <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
            <p>
              The Rec Room started as a simple idea: what if there was a place online that felt like
              a real community — where builders and creators could meet, share what they're working
              on, and help each other ship?
            </p>
            <p>
              Not a job board. Not a directory. Not a social network. A room where people come to
              build things together.
            </p>
          </div>

          <OffsetCard tone="purple" size="lg" className="grid-paper p-6 sm:p-10">
            <p className="text-[clamp(1.5rem,4vw,3rem)] leading-[1] font-extrabold tracking-tight">
              Not a platform.
              <br />A community.
            </p>
          </OffsetCard>

          <div className="grid gap-6 pt-4 sm:grid-cols-3">
            {values.map((v) => (
              <OffsetCard key={v.title} className="p-5">
                <h3 className="text-xl font-extrabold tracking-tight">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.copy}</p>
              </OffsetCard>
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/projects">
                See what people are building
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={TELEGRAM_INVITE_URL} target="_blank" rel="noopener noreferrer">
                Join the community
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <JoinCTA />
      </section>
    </>
  );
}
