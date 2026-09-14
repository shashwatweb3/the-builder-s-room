import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createServerClient } from "@supabase/ssr";
import { ArrowLeft, ArrowUpRight, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/Button";
import { OffsetCard } from "@/components/OffsetCard";
import { Tag } from "@/components/Tag";
import { ShareButton } from "@/components/ShareButton";
import { formatDate, formatTimeRange } from "@/lib/format";
import { eventPublicUrl } from "@/lib/event";
import { AccessGate } from "@/components/AccessGate";

type DetailRow = {
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
  organizer: string | null;
  start_time: string | null;
  end_time: string | null;
  region: string | null;
};

function createSupabaseClient(request: Request) {
  if (!import.meta.env["VITE_SUPABASE_URL"] || !import.meta.env["VITE_SUPABASE_ANON_KEY"]) {
    return null;
  }
  return createServerClient(
    import.meta.env["VITE_SUPABASE_URL"],
    import.meta.env["VITE_SUPABASE_ANON_KEY"],
    {
      cookies: {
        getAll() {
          const h = request.headers.get("cookie") ?? "";
          return h.split(";").map((c) => {
            const [name, ...rest] = c.trim().split("=");
            return { name: name ?? "", value: rest.join("=") };
          });
        },
        setAll() {},
      },
    },
  );
}

const getEvent = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const request = getRequest();
    if (!request) return null;
    const supabase = createSupabaseClient(request);
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return null;
    return data as DetailRow;
  });

export const Route = createFileRoute("/events/$id")({
  loader: async ({ params }) => {
    const row = await getEvent({ data: params.id });
    if (!row) throw notFound();
    return { row };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Event — Krew3" }] };
    const { row } = loaderData;
    const url = eventPublicUrl(row.slug);
    return {
      meta: [
        { title: `${row.title} — Krew3` },
        { name: "description", content: row.description },
        { property: "og:title", content: `${row.title} — Krew3` },
        { property: "og:description", content: row.description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
      ],
    };
  },
  component: EventDetail,
});

function eventDateLabel(start: string, end: string | null) {
  const from = formatDate(start);
  if (end && end !== start) return `${from} – ${formatDate(end)}`;
  return from;
}

function EventDetail() {
  const { row } = Route.useLoaderData();
  const organizer = row.organizer ?? "";
  const organizerLine = organizer ? `Hosted by ${organizer}` : "Community event";
  const detailText = row.long_description ?? row.description;
  const registerUrl = row.registration_url || row.meeting_url;
  const timeRange = formatTimeRange(row.start_time, row.end_time);

  return (
    <AccessGate>
      <>
        <div className="mx-auto w-full max-w-[1400px] px-4 pt-8 sm:px-6 lg:px-10">
          <Link
            to="/events"
            search={{ view: undefined }}
            className="label-mono inline-flex items-center gap-2 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> Back to events
          </Link>
        </div>

        <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <Tag tone="purple">Community event</Tag>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                {row.title}
              </h1>
              <p className="label-mono mt-2 text-muted-foreground">{organizerLine}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Tag tone="ghost">{eventDateLabel(row.event_date, row.end_date)}</Tag>
                {timeRange && <Tag tone="ghost">{timeRange}</Tag>}
                <Tag tone="ghost">{row.is_online ? "Online" : "In person"}</Tag>
                {row.region === "mumbai" && <Tag tone="ghost">Mumbai</Tag>}
                {row.region === "goa" && <Tag tone="ghost">Goa</Tag>}
                {row.location && (
                  <Tag tone="ghost">
                    <MapPin className="size-3.5" aria-hidden /> {row.location}
                  </Tag>
                )}
                {registerUrl && (
                  <Tag tone="ghost">
                    <ExternalLink className="size-3.5" aria-hidden /> Details on organizer site
                  </Tag>
                )}
              </div>

              <div className="mt-8 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {detailText.split("\n\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>

            <OffsetCard size="sm" className="p-6 lg:sticky lg:top-24 self-start">
              <p className="label-mono text-muted-foreground">Event page</p>
              {registerUrl ? (
                <Button asChild className="mt-4 w-full" size="lg">
                  <a href={registerUrl} target="_blank" rel="noopener noreferrer">
                    RSVP <ArrowUpRight className="size-4" aria-hidden />
                  </a>
                </Button>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Details TBA. Invite only.</p>
              )}
              <p className="label-mono mt-6 text-muted-foreground">Organized by</p>
              <p className="mt-1 text-sm font-semibold">{organizer}</p>
              <div className="mt-6">
                <ShareButton title={row.title} slug={row.slug} path={`/events/${row.slug}`} />
              </div>
            </OffsetCard>
          </div>
        </section>
      </>
    </AccessGate>
  );
}
