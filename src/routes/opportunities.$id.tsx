import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createServerClient } from "@supabase/ssr";
import { ArrowLeft, ArrowUpRight, MapPin } from "lucide-react";
import { Button } from "@/components/Button";
import { OffsetCard } from "@/components/OffsetCard";
import { Tag } from "@/components/Tag";
import { StatusBadge } from "@/components/StatusBadge";
import { deadlineLabel, isClosingSoon } from "@/lib/format";
import { isDirectApplication, opportunityPublicUrl } from "@/lib/opportunity";
import { AccessGate } from "@/components/AccessGate";
import type { OpportunityCategory } from "@/data/types";

const categoryMeta: Record<OpportunityCategory, { label: string; plural: string }> = {
  job: { label: "Job", plural: "Jobs" },
  hackathon: { label: "Hackathon", plural: "Hackathons" },
  residency: { label: "Residency", plural: "Residencies" },
  grant: { label: "Grant", plural: "Grants" },
};

type DetailRow = {
  id: string;
  title: string;
  slug: string;
  type: "job" | "hackathon" | "grant" | "residency" | "ambassador";
  organization: string;
  description: string;
  long_description: string | null;
  location: string;
  remote: boolean;
  compensation: string | null;
  deadline: string | null;
  application_url: string | null;
  image_url: string | null;
  tags: string[];
  featured: boolean;
  status: "draft" | "published" | "closed";
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

const getOpportunity = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const request = getRequest();
    if (!request) return null;
    const supabase = createSupabaseClient(request);
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return null;
    return data as DetailRow;
  });

export const Route = createFileRoute("/opportunities/$id")({
  loader: async ({ params }) => {
    const row = await getOpportunity({ data: params.id });
    if (!row) throw notFound();
    return { row };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Opportunity — Krew3" }] };
    const { row } = loaderData;
    const url = opportunityPublicUrl(row.slug);
    const image = row.image_url
      ? /^https?:\/\//.test(row.image_url)
        ? row.image_url
        : opportunityPublicUrl(row.image_url)
      : undefined;
    return {
      meta: [
        { title: `${row.title} — Krew3` },
        { name: "description", content: row.description },
        { property: "og:title", content: `${row.title} — Krew3` },
        { property: "og:description", content: row.description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        ...(image ? [{ property: "og:image", content: image }] : []),
      ],
    };
  },
  component: OpportunityDetail,
});

function OpportunityDetail() {
  const { row } = Route.useLoaderData();
  const closing = row.deadline ? isClosingSoon(row.deadline) : false;
  const applyUrl = isDirectApplication(row.slug, row.application_url) ? row.application_url : null;
  const typeLabel =
    row.type === "ambassador"
      ? "Ambassador"
      : (categoryMeta[row.type as OpportunityCategory]?.label ?? row.type);

  const detailText = row.long_description ?? row.description;

  return (
    <AccessGate>
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
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <Tag tone="purple">{typeLabel}</Tag>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                {row.title}
              </h1>
              <p className="label-mono mt-2 text-muted-foreground">
                {row.organization}
                {row.featured && (
                  <>
                    {" "}
                    <span className="font-semibold text-primary">· Featured</span>
                  </>
                )}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {row.deadline ? (
                  <StatusBadge
                    label={deadlineLabel(row.deadline)}
                    tone={closing ? "purple" : "neutral"}
                    dot={closing}
                  />
                ) : (
                  <StatusBadge label="Open · Rolling" tone="live" dot />
                )}
                {row.remote && <Tag tone="ghost">Remote</Tag>}
                {row.location && (
                  <Tag tone="ghost">
                    <MapPin className="size-3.5" aria-hidden /> {row.location}
                  </Tag>
                )}
                {row.compensation && <Tag tone="ghost">Paid</Tag>}
                {row.tags.map((t) => (
                  <Tag key={t} tone="ghost">
                    {t}
                  </Tag>
                ))}
              </div>

              {row.compensation && <p className="mt-6 text-lg font-semibold">{row.compensation}</p>}

              <div className="mt-8 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {detailText.split("\n\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>

            <OffsetCard size="sm" className="p-6 lg:sticky lg:top-24 self-start">
              <p className="label-mono text-muted-foreground">Application</p>
              {applyUrl ? (
                <Button asChild className="mt-4 w-full" size="lg">
                  <a href={applyUrl} target="_blank" rel="noopener noreferrer">
                    Apply now <ArrowUpRight className="size-4" aria-hidden />
                  </a>
                </Button>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  There is no direct application link. Follow the application instructions described
                  above to apply.
                </p>
              )}
              <p className="label-mono mt-6 text-muted-foreground">Applied via</p>
              <p className="mt-1 text-sm font-semibold">{row.organization}</p>
            </OffsetCard>
          </div>
        </section>
      </>
    </AccessGate>
  );
}
