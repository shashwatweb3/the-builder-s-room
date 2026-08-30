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
import { opportunities, categoryMeta, getOpportunity } from "@/data/opportunities";
import { deadlineLabel, formatDate, isClosingSoon } from "@/lib/format";

export const Route = createFileRoute("/opportunities/$id")({
  loader: ({ params }) => {
    const item = getOpportunity(params.id);
    if (!item) throw notFound();
    return { item };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return {
        meta: [
          { title: "Opportunity not found — The Rec Room" },
          { name: "robots", content: "noindex" },
        ],
      };
    const { item } = loaderData;
    const title = `${item.title} at ${item.organization} — The Rec Room`;
    return {
      meta: [
        { title },
        { name: "description", content: item.summary },
        { property: "og:title", content: title },
        { property: "og:description", content: item.summary },
      ],
    };
  },
  component: OpportunityDetail,
});

function OpportunityDetail() {
  const { item } = Route.useLoaderData();
  const related = opportunities
    .filter((o) => o.id !== item.id && o.category === item.category)
    .slice(0, 3);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) await navigator.share({ title: item.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Link copied.", { description: "Send it to someone good." });
      }
    } catch {
      /* user dismissed */
    }
  };

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

      <article className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="purple">{categoryMeta[item.category].label}</Tag>
              {item.remote && <Tag tone="ghost">Remote OK</Tag>}
              <StatusBadge
                label={deadlineLabel(item.deadline)}
                tone={isClosingSoon(item.deadline) ? "purple" : "neutral"}
                dot={isClosingSoon(item.deadline)}
              />
            </div>

            <h1 className="mt-5 text-[clamp(2.25rem,7vw,4.5rem)] leading-[0.98] font-extrabold tracking-tight">
              {item.title}
            </h1>
            <p className="mt-4 text-xl font-semibold">{item.organization}</p>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              {item.summary}
            </p>

            <div className="mt-10 space-y-10">
              <section>
                <SectionLabel>The gist</SectionLabel>
                <p className="mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
                  {item.description}
                </p>
              </section>

              <section>
                <SectionLabel>What they're looking for</SectionLabel>
                <ul className="mt-4 max-w-2xl space-y-3">
                  {item.requirements.map((r) => (
                    <li key={r} className="flex gap-3">
                      <span
                        aria-hidden
                        className="mt-2.5 size-2 shrink-0 rounded-full bg-primary"
                      />
                      <span className="text-base sm:text-lg">{r}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <SectionLabel>Who it's for</SectionLabel>
                <OffsetCard tone="lavender" className="mt-4 max-w-2xl p-5 sm:p-6">
                  <p className="text-base sm:text-lg">{item.whoItsFor}</p>
                </OffsetCard>
              </section>

              <section>
                <SectionLabel>Tags</SectionLabel>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[...item.tags, ...item.skills].map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* Sticky detail rail */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <OffsetCard size="lg" className="p-6">
              <dl className="space-y-4">
                {item.compensation && (
                  <div>
                    <dt className="label-mono text-muted-foreground">
                      {item.category === "hackathon" ? "Prize" : "Compensation"}
                    </dt>
                    <dd className="mt-1 text-lg font-extrabold">
                      {item.compensation}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="label-mono text-muted-foreground">Location</dt>
                  <dd className="mt-1 flex items-center gap-2 font-semibold">
                    <MapPin className="size-4" aria-hidden />
                    {item.location}
                  </dd>
                </div>
                <div>
                  <dt className="label-mono text-muted-foreground">Deadline</dt>
                  <dd className="mt-1 flex items-center gap-2 font-semibold">
                    <Clock className="size-4" aria-hidden />
                    {formatDate(item.deadline)}
                  </dd>
                </div>
                <div>
                  <dt className="label-mono text-muted-foreground">Posted</dt>
                  <dd className="label-mono mt-1">{formatDate(item.postedAt)}</dd>
                </div>
              </dl>

              <div className="mt-6 space-y-3">
                <Button asChild size="lg" className="w-full">
                  <a href={item.applyUrl} target="_blank" rel="noreferrer noopener">
                    Apply <ArrowUpRight className="size-4" aria-hidden />
                  </a>
                </Button>
                <div className="flex gap-3">
                  <SaveButton
                    kind="opportunity"
                    id={item.id}
                    label={item.title}
                    withText
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={share}
                    className="press inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border-2 border-border bg-card text-sm font-semibold shadow-offset-sm"
                  >
                    <Share2 className="size-4" aria-hidden /> Share
                  </button>
                </div>
              </div>
            </OffsetCard>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <SectionLabel>Also in the room</SectionLabel>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Related {categoryMeta[item.category].plural.toLowerCase()}
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((o) => (
                <OpportunityCard key={o.id} item={o} />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
