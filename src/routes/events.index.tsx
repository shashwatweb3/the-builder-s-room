import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createServerClient } from "@supabase/ssr";
import { useMemo } from "react";
import { PageHero } from "@/components/PageHero";
import { SectionLabel } from "@/components/SectionLabel";
import { OffsetCard } from "@/components/OffsetCard";
import { EventCard } from "@/components/EventCard";
import { EmptyState } from "@/components/EmptyState";
import { JoinCTA } from "@/components/JoinCTA";
import type { RecEvent } from "@/data/types";

type EventRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  long_description: string | null;
  event_date: string;
  end_date: string | null;
  location: string;
  is_online: boolean;
  meeting_url: string | null;
  registration_url: string | null;
  image_url: string | null;
  featured: boolean;
  status: "draft" | "published" | "cancelled" | "completed";
  organizer: string;
  created_at: string;
  updated_at: string;
};

const getPublishedEvents = createServerFn({ method: "GET" }).handler(async () => {
  if (!import.meta.env["VITE_SUPABASE_URL"] || !import.meta.env["VITE_SUPABASE_ANON_KEY"]) {
    return [] as RecEvent[];
  }
  const request = getRequest();
  const supabase = createServerClient(
    import.meta.env["VITE_SUPABASE_URL"],
    import.meta.env["VITE_SUPABASE_ANON_KEY"],
    {
      cookies: {
        getAll() {
          const h = request?.headers.get("cookie") ?? "";
          return h.split(";").map((c) => {
            const [name, ...rest] = c.trim().split("=");
            return { name: name ?? "", value: rest.join("=") };
          });
        },
        setAll() {},
      },
    },
  );

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("event_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch events:", error);
    return [] as RecEvent[];
  }

  return ((data ?? []) as EventRow[]).map((row): RecEvent => ({
    id: row.id,
    slug: row.slug,
    name: row.title,
    kind: "meetup",
    date: row.event_date.split("T")[0] ?? row.event_date,
    time: "",
    location: row.location,
    online: row.is_online,
    organizer: row.organizer ?? "",
    summary: row.description,
    url: row.registration_url || row.meeting_url || "#",
  }));
});

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Devcon 8 Mumbai Side Events | Krew3" },
      {
        name: "description",
        content:
          "Discover community side events happening around Devcon 8 and India Blockchain Week in Mumbai.",
      },
      { property: "og:title", content: "Devcon 8 Mumbai Side Events | Krew3" },
      {
        property: "og:description",
        content:
          "Discover community side events happening around Devcon 8 and India Blockchain Week in Mumbai.",
      },
    ],
  }),
  loader: async () => {
    const events = await getPublishedEvents();
    return { events };
  },
  component: EventsPage,
});

function EventsPage() {
  const { events } = Route.useLoaderData();

  const results = useMemo(() => [...events].sort((a, b) => a.date.localeCompare(b.date)), [events]);

  return (
    <>
      <PageHero
        label="DEVCON 8 • MUMBAI, INDIA 🇮🇳"
        title="SIDE EVENTS."
        aside={
          <OffsetCard size="sm" className="px-5 py-4">
            <p className="text-4xl font-extrabold tracking-tight">{events.length}</p>
            <p className="label-mono mt-1 text-muted-foreground">COMMUNITY EVENTS</p>
          </OffsetCard>
        }
      >
        <p>A community list of events happening around Devcon 8 and India Blockchain Week.</p>
        <p className="label-mono mt-4 text-muted-foreground">{events.length} events. One city.</p>
        <p className="mt-4 text-sm text-muted-foreground">
          Want to add an opportunity or event? DM{" "}
          <a
            href="https://t.me/Lucky_sc0"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline decoration-2 underline-offset-2 hover:opacity-80"
          >
            @Lucky_sc0
          </a>{" "}
          on Telegram.
        </p>
      </PageHero>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <SectionLabel>COMMUNITY SIDE EVENTS</SectionLabel>
        <p className="mt-2 text-sm text-muted-foreground">
          Events listed by their respective organizers. Krew3 is the directory, not the host.
        </p>

        <div className="mt-8">
          {results.length ? (
            <div className="grid gap-6">
              {results.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nothing on the calendar yet."
              body="More soon."
              action={
                <a
                  href="https://t.me/Lucky_sc0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-5 text-base font-semibold text-foreground shadow-offset transition-colors hover:bg-lavender/40"
                >
                  Add an event →
                </a>
              }
            />
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <JoinCTA />
      </section>
    </>
  );
}
