import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/Button";
import { OffsetCard } from "@/components/OffsetCard";
import { SectionLabel } from "@/components/SectionLabel";
import { Tag } from "@/components/Tag";
import { HeroRoom } from "@/components/HeroRoom";
import { JoinCTA } from "@/components/JoinCTA";
import { FAQ } from "@/components/FAQ";
import { builders, getBuilder, initials } from "@/data/builders";
import { projects, projectStatusLabel } from "@/data/projects";
import { feedPosts, feedKindMeta } from "@/data/feed";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Rec Room — A Recreation Room for Builders" },
      {
        name: "description",
        content:
          "The Rec Room is a community for builders and creators — a place to meet people, learn together, share what you're building and find something worth making.",
      },
      {
        property: "og:title",
        content: "The Rec Room — A Recreation Room for Builders",
      },
      {
        property: "og:description",
        content:
          "A room full of interesting people building interesting things. Come for the ideas. Stay for the people.",
      },
    ],
  }),
  component: Home,
});

const rooms: {
  label: string;
  title: string;
  copy: string;
  to: string;
  tone: "card" | "lavender" | "purple";
}[] = [
  {
    label: "People",
    title: "Meet builders and creators.",
    copy: "Find people worth building with.",
    to: "/builders",
    tone: "lavender",
  },
  {
    label: "Projects",
    title: "See what people are building.",
    copy: "Discover projects worth following.",
    to: "/projects",
    tone: "card",
  },
  {
    label: "Events",
    title: "Learn, hang out, and build together.",
    copy: "Community sessions, meetups and workshops.",
    to: "/events",
    tone: "card",
  },
  {
    label: "Opportunities",
    title: "Jobs, hackathons, grants and more.",
    copy: "Find something worth applying to.",
    to: "/opportunities",
    tone: "purple",
  },
];

const communityCards = [
  { label: "Meet", copy: "Find your people.", tone: "card" as const },
  { label: "Learn", copy: "Share knowledge. Pick up new ideas.", tone: "lavender" as const },
  { label: "Build", copy: "Turn ideas into things.", tone: "card" as const },
];

const faqs = [
  {
    q: "What actually is The Rec Room?",
    a: "A recreation room for builders and creators. A place to meet people, learn together, share what you're building and find your next rabbit hole — not just a list of opportunities.",
  },
  {
    q: "Who is it for?",
    a: "Developers, designers, founders, researchers, writers, community people, and anyone who likes making things. If you build stuff, you're in.",
  },
  {
    q: "What happens inside the room?",
    a: "People introduce themselves, post what they're building, ask questions, find collaborators, run events and share the good and the messy.",
  },
  {
    q: "How do I join the community?",
    a: "Pull up a chair. Drop your email below to get in on the conversation before the door is locked.",
  },
  {
    q: "Is it free?",
    a: "Yes. Joining, browsing, posting and saving are all free. No paywall, no waiting list.",
  },
];

const feedPreview = feedPosts.slice(0, 3);

function builderName(builderId?: string, authorName?: string) {
  if (!builderId) return authorName ?? "Someone in the room";
  const b = getBuilder(builderId);
  return b?.name ?? authorName ?? "Someone in the room";
}

function builderRole(builderId?: string, authorRole?: string) {
  if (!builderId) return authorRole;
  const b = getBuilder(builderId);
  return b?.roleLabel ?? authorRole;
}

function Home() {
  const spotlightBuilders = builders.slice(0, 4);
  const spotlightProjects = projects.slice(0, 3);

  return (
    <>
      {/* HERO */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pt-8 pb-8 sm:px-6 sm:pt-12 lg:px-10 lg:pt-20 lg:pb-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div className="rise-in">
            <SectionLabel>A recreation room for builders</SectionLabel>
            <h1 className="mt-6 text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] font-extrabold tracking-tight">
              <span className="block">Come for the ideas.</span>
              <span className="block">
                Stay for the{" "}
                <span className="relative">
                  people.
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-[0.06em] -z-10 h-[0.32em] rounded-full bg-lavender"
                  />
                </span>
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-lg font-medium text-muted-foreground sm:text-xl">
              The Rec Room is a community for builders and creators to learn, share, build, and ship
              together.
            </p>
            <p className="mt-3 text-base font-medium text-muted-foreground/85 sm:text-lg">
              Find people to build with. Find something worth building.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <a href="#join">Join the Room →</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/builders">Meet the builders</Link>
              </Button>
            </div>
          </div>

          <HeroRoom />
        </div>
      </section>

      {/* COMMUNITY / WHAT THE ROOM IS */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pt-16 sm:px-6 lg:px-10 lg:pt-24">
        <OffsetCard tone="purple" size="lg" className="grid-paper p-6 sm:p-12">
          <p className="text-[clamp(2rem,6vw,4.5rem)] leading-[0.98] font-extrabold tracking-tight">
            Not a platform.
            <br />A <span className="text-primary-foreground">room.</span>
          </p>
          <p className="mt-4 max-w-xl text-base text-primary-foreground/85 sm:text-xl">
            A place to meet people, learn from each other, share what you're building, and make
            something together.
          </p>
        </OffsetCard>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {communityCards.map((c) => (
            <OffsetCard key={c.label} tone={c.tone} className="flex flex-col p-6">
              <span className="label-mono opacity-70">{c.label}</span>
              <p className="mt-4 text-2xl leading-tight font-extrabold tracking-tight">{c.copy}</p>
            </OffsetCard>
          ))}
        </div>
      </section>

      {/* WHAT'S HAPPENING IN THE ROOM */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pt-16 sm:px-6 lg:px-10 lg:pt-24">
        <SectionLabel>Inside the room</SectionLabel>
        <h2 className="mt-4 text-[clamp(2rem,6vw,4rem)] leading-[1] font-extrabold tracking-tight">
          What's happening in the room.
        </h2>
        <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
          There's always something going on.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {rooms.map((r) => (
            <OffsetCard
              key={r.label}
              interactive
              tone={r.tone}
              className="group relative flex flex-col p-6"
            >
              <span
                className={cn(
                  "label-mono",
                  r.tone === "purple" ? "text-primary-foreground/80" : "opacity-70",
                )}
              >
                {r.label}
              </span>
              <p
                className={cn(
                  "mt-4 text-2xl leading-tight font-extrabold tracking-tight",
                  r.tone === "purple" && "text-primary-foreground",
                )}
              >
                {r.title}
              </p>
              <p
                className={cn(
                  "mt-2 text-sm sm:text-base",
                  r.tone === "purple" ? "text-primary-foreground/80" : "text-muted-foreground",
                )}
              >
                {r.copy}
              </p>
              <span
                className={cn(
                  "mt-6 inline-flex items-center gap-1.5 font-semibold",
                  r.tone === "purple" && "text-primary-foreground",
                )}
              >
                <Link to={r.to} className="after:absolute after:inset-0 after:content-['']">
                  Step inside
                </Link>
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </OffsetCard>
          ))}
        </div>
      </section>

      {/* ROOM PREVIEW */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pt-16 sm:px-6 lg:px-10 lg:pt-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionLabel>The room is talking</SectionLabel>
            <h2 className="mt-4 text-[clamp(2rem,6vw,4rem)] leading-[1] font-extrabold tracking-tight">
              What's happening inside?
            </h2>
          </div>
          <Link
            to="/room"
            className="group inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline"
          >
            Enter the Room
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </div>

        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {feedPreview.map((p) => (
            <li
              key={p.id}
              className="flex flex-col rounded-2xl border-2 border-border bg-card p-5 shadow-offset-sm"
            >
              <Tag tone={feedKindMeta[p.kind].tag}>{feedKindMeta[p.kind].label}</Tag>
              <p className="mt-3 line-clamp-2 text-lg leading-snug font-bold">{p.content}</p>
              <p className="mt-4 border-t-2 border-dashed border-foreground/15 pt-3 text-sm font-semibold text-muted-foreground">
                {builderName(p.builderId, p.authorName)} — {builderRole(p.builderId, p.authorRole)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* BUILDERS + PROJECTS */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pt-16 sm:px-6 lg:px-10 lg:pt-24">
        <div>
          <SectionLabel>Stay a while</SectionLabel>
          <h2 className="mt-4 text-[clamp(2rem,6vw,4rem)] leading-[1] font-extrabold tracking-tight">
            See who's building.
          </h2>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Interesting people tend to build interesting things.
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="flex items-center justify-between gap-4">
              <span className="label-mono text-muted-foreground">Builders</span>
              <Link
                to="/builders"
                className="group inline-flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline"
              >
                Meet all builders
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {spotlightBuilders.map((b) => (
                <li key={b.id}>
                  <Link
                    to="/builders/$id"
                    params={{ id: b.id }}
                    className="group flex items-center gap-3 rounded-2xl border-2 border-border bg-card p-3 shadow-offset-sm"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-11 shrink-0 place-items-center rounded-xl border-2 border-border text-xs font-extrabold shadow-offset-sm",
                        b.accent,
                      )}
                    >
                      {initials(b.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-extrabold">{b.name}</span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {b.roleLabel}
                      </span>
                    </span>
                    <ArrowUpRight
                      className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4">
              <span className="label-mono text-muted-foreground">Projects</span>
              <Link
                to="/projects"
                className="group inline-flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline"
              >
                Explore projects
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {spotlightProjects.map((p) => (
                <Link
                  key={p.id}
                  to="/projects/$id"
                  params={{ id: p.id }}
                  className="group block rounded-2xl border-2 border-border bg-card p-4 shadow-offset-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Tag tone="purple">{projectStatusLabel[p.status]}</Tag>
                    <span className="label-mono text-muted-foreground">{p.category}</span>
                  </div>
                  <p className="mt-3 text-lg leading-tight font-extrabold tracking-tight group-hover:underline">
                    {p.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.pitch}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* JOIN */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pt-16 sm:px-6 lg:px-10 lg:pt-24">
        <JoinCTA />
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pt-16 sm:px-6 lg:px-10 lg:pt-24">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
          <div>
            <SectionLabel>Questions</SectionLabel>
            <h2 className="mt-4 text-[clamp(2rem,5vw,3.5rem)] leading-[1] font-extrabold tracking-tight">
              What is this place?
            </h2>
          </div>
          <FAQ items={faqs} />
        </div>
      </section>
    </>
  );
}
