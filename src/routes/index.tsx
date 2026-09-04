import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/Button";
import { OffsetCard } from "@/components/OffsetCard";
import { SectionLabel } from "@/components/SectionLabel";
import { Tag } from "@/components/Tag";
import { StatusBadge } from "@/components/StatusBadge";
import { HeroRoom } from "@/components/HeroRoom";
import { JoinCTA } from "@/components/JoinCTA";
import { FAQ } from "@/components/FAQ";
import { TELEGRAM_INVITE_URL } from "@/lib/community";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Krew3 — Not a community. A Krew." },
      {
        name: "description",
        content: "Web3's Krew of builders and creators learning, helping, and building together.",
      },
      {
        property: "og:title",
        content: "Krew3 — Not a community. A Krew.",
      },
      {
        property: "og:description",
        content:
          "Builders and creators learning, helping, and building together. Find your people. Make something.",
      },
    ],
  }),
  loader: async () => {
    try {
      if (!import.meta.env["VITE_SUPABASE_URL"] || !import.meta.env["VITE_SUPABASE_ANON_KEY"]) {
        return { events: [], opportunities: [] };
      }
      const { createServerClient } = await import("@supabase/ssr");
      const supabase = createServerClient(
        import.meta.env["VITE_SUPABASE_URL"],
        import.meta.env["VITE_SUPABASE_ANON_KEY"],
        {
          cookies: {
            getAll() {
              return [];
            },
            setAll() {},
          },
        },
      );
      const [eventsResult, oppsResult] = await Promise.all([
        supabase
          .from("events")
          .select(
            "id, title, slug, description, event_date, location, is_online, registration_url, featured",
          )
          .eq("status", "published")
          .order("event_date", { ascending: true })
          .limit(3),
        supabase
          .from("opportunities")
          .select(
            "id, title, slug, type, organization, description, location, deadline, application_url, featured",
          )
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(3),
      ]);
      return { events: eventsResult.data ?? [], opportunities: oppsResult.data ?? [] };
    } catch {
      return { events: [], opportunities: [] };
    }
  },
  component: Home,
});

const learnCards = [
  {
    label: "Learn",
    copy: "Community sessions, workshops and AMAs.",
    tone: "card" as const,
  },
  {
    label: "Build",
    copy: "Projects, hackathons and collaborations.",
    tone: "lavender" as const,
  },
  {
    label: "Discover",
    copy: "Jobs, grants, residencies and ambassador programs.",
    tone: "card" as const,
  },
];

const faqs = [
  {
    q: "What actually is Krew3?",
    a: "Web3's Krew of builders and creators. A place to meet people, learn together, share what you're building and find your next rabbit hole.",
  },
  {
    q: "Who is it for?",
    a: "Developers, designers, founders, researchers, writers, community people, and anyone who likes making things. If you build stuff, you're in.",
  },
  {
    q: "What happens inside the Krew?",
    a: "People introduce themselves, post what they're building, ask questions, find collaborators, run events and share the good and the messy.",
  },
  {
    q: "How do I join the Krew?",
    a: "Join the Telegram group. No paywall, no waiting list.",
  },
  {
    q: "Is it free?",
    a: "Yes. Joining, browsing, posting and saving are all free.",
  },
];

function Home() {
  const { events, opportunities } = Route.useLoaderData();

  return (
    <>
      {/* HERO */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pt-8 pb-8 sm:px-6 sm:pt-12 lg:px-10 lg:pt-20 lg:pb-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div className="rise-in">
            <SectionLabel>WEB3'S KREW FOR BUILDERS + CREATORS</SectionLabel>
            <h1 className="mt-6 text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] font-extrabold tracking-tight">
              <span className="block">Not a community.</span>
              <span className="block">
                A{" "}
                <span className="relative">
                  Krew.
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-[0.06em] -z-10 h-[0.32em] rounded-full bg-lavender"
                  />
                </span>
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-lg font-medium text-muted-foreground sm:text-xl">
              Builders and creators learning, helping, and building together.
            </p>
            <p className="mt-3 max-w-xl text-base text-muted-foreground">
              Find your people. Make something.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <a href={TELEGRAM_INVITE_URL} target="_blank" rel="noopener noreferrer">
                  Join the Krew →
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/projects">Explore Projects</Link>
              </Button>
            </div>
          </div>

          <HeroRoom />
        </div>
      </section>

      {/* WHAT IS KREW3 */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pt-20 sm:px-6 lg:px-10 lg:pt-28">
        <OffsetCard tone="purple" size="lg" className="grid-paper p-6 sm:p-12">
          <p className="text-[clamp(2rem,6vw,4.5rem)] leading-[0.98] font-extrabold tracking-tight">
            Not a community.
            <br />A <span className="text-primary-foreground">Krew.</span>
          </p>
          <p className="mt-4 max-w-xl text-base text-primary-foreground/85 sm:text-xl">
            A place for builders and creators to learn, share, help each other, and build things
            together.
          </p>
        </OffsetCard>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {learnCards.map((c) => (
            <OffsetCard key={c.label} tone={c.tone} className="flex flex-col p-5">
              <span className="label-mono opacity-70">{c.label}</span>
              <p className="mt-3 text-lg leading-tight font-extrabold tracking-tight">{c.copy}</p>
            </OffsetCard>
          ))}
        </div>
      </section>

      {/* FEATURED PROJECTS — empty state */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pt-20 sm:px-6 lg:px-10 lg:pt-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionLabel>Projects</SectionLabel>
            <h2 className="mt-4 text-[clamp(2rem,6vw,4rem)] leading-[1] font-extrabold tracking-tight">
              What people are building.
            </h2>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Interesting things built by people in the Krew.
            </p>
          </div>
          <Link
            to="/projects"
            className="group inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline"
          >
            Explore Projects
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border-2 border-dashed border-border bg-card/50 p-10 text-center">
          <p className="text-muted-foreground">Nothing here yet. The Krew is cooking.</p>
        </div>
      </section>

      {/* UPCOMING EVENTS */}
      {events.length > 0 && (
        <section className="mx-auto w-full max-w-[1400px] px-4 pt-20 sm:px-6 lg:px-10 lg:pt-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <SectionLabel>Events</SectionLabel>
              <h2 className="mt-4 text-[clamp(2rem,6vw,4rem)] leading-[1] font-extrabold tracking-tight">
                Come hang out.
              </h2>
              <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
                Weekly community sessions, workshops and demo nights.
              </p>
            </div>
            <Link
              to="/events"
              className="group inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline"
            >
              See all Events
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((e) => (
              <article
                key={e.id}
                className="group flex flex-col rounded-2xl border-2 border-border bg-card p-5 shadow-offset-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <Tag tone="purple">{e.is_online ? "Online" : "In person"}</Tag>
                  <StatusBadge
                    label={e.is_online ? "Online" : "In person"}
                    tone={e.is_online ? "live" : "neutral"}
                  />
                </div>
                <h3 className="mt-4 text-xl leading-tight font-extrabold tracking-tight">
                  {e.title}
                </h3>
                <p className="mt-1.5 label-mono text-muted-foreground">
                  {new Date(e.event_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>
                {e.location && (
                  <p className="mt-1.5 label-mono text-muted-foreground">{e.location}</p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* FEATURED OPPORTUNITIES */}
      {opportunities.length > 0 && (
        <section className="mx-auto w-full max-w-[1400px] px-4 pt-20 sm:px-6 lg:px-10 lg:pt-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <SectionLabel>Opportunities</SectionLabel>
              <h2 className="mt-4 text-[clamp(2rem,6vw,4rem)] leading-[1] font-extrabold tracking-tight">
                Something worth applying to.
              </h2>
              <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
                Jobs, hackathons, residencies, grants and ambassador programs.
              </p>
            </div>
            <Link
              to="/opportunities"
              search={{ category: undefined }}
              className="group inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline"
            >
              View all Opportunities
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {opportunities.map((o) => (
              <Link
                key={o.id}
                to="/opportunities/$id"
                params={{ id: o.slug }}
                className="group flex flex-col rounded-2xl border-2 border-border bg-card p-5 shadow-offset-sm transition-colors hover:bg-lavender/30"
              >
                <Tag tone="purple">{o.type}</Tag>
                <h3 className="mt-4 text-xl leading-tight font-extrabold tracking-tight group-hover:underline">
                  {o.title}
                </h3>
                <p className="mt-1.5 label-mono text-muted-foreground">{o.organization}</p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{o.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  {o.deadline && (
                    <StatusBadge
                      label={`Due ${new Date(o.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                      tone="neutral"
                    />
                  )}
                  {o.location && (
                    <span className="label-mono text-muted-foreground">{o.location}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* JOIN */}
      <section className="mx-auto w-full max-w-[1400px] px-4 pt-20 sm:px-6 lg:px-10 lg:pt-28">
        <JoinCTA />
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="mx-auto w-full max-w-[1400px] px-4 pt-20 sm:px-6 lg:px-10 lg:pt-28"
      >
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
