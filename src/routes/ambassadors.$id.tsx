import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/Button";
import { OffsetCard } from "@/components/OffsetCard";
import { Tag } from "@/components/Tag";
import { StatusBadge } from "@/components/StatusBadge";
import { SectionLabel } from "@/components/SectionLabel";
import { AmbassadorCard } from "@/components/AmbassadorCard";
import {
  ambassadorPrograms,
  getProgram,
  programTypeLabel,
} from "@/data/ambassadors";
import { deadlineLabel, formatDate } from "@/lib/format";

export const Route = createFileRoute("/ambassadors/$id")({
  loader: ({ params }) => {
    const program = getProgram(params.id);
    if (!program) throw notFound();
    return { program };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return {
        meta: [
          { title: "Program not found — The Rec Room" },
          { name: "robots", content: "noindex" },
        ],
      };
    const { program } = loaderData;
    const title = `${program.name} · ${program.organization} — The Rec Room`;
    return {
      meta: [
        { title },
        { name: "description", content: program.summary },
        { property: "og:title", content: title },
        { property: "og:description", content: program.summary },
      ],
    };
  },
  component: ProgramDetail,
});

function Block({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <section>
      <SectionLabel>{label}</SectionLabel>
      <ul className="mt-4 max-w-2xl space-y-3">
        {items.map((i) => (
          <li key={i} className="flex gap-3">
            <span
              aria-hidden
              className="mt-2.5 size-2 shrink-0 rounded-full bg-primary"
            />
            <span className="text-base sm:text-lg">{i}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProgramDetail() {
  const { program } = Route.useLoaderData();
  const related = ambassadorPrograms
    .filter((p) => p.id !== program.id)
    .slice(0, 3);

  return (
    <>
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-8 sm:px-6 lg:px-10">
        <Link
          to="/ambassadors"
          className="label-mono inline-flex items-center gap-2 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Back to programs
        </Link>
      </div>

      <article className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="purple">{programTypeLabel[program.type]}</Tag>
              {program.paid && <Tag tone="ghost">Paid</Tag>}
              {program.remote && <Tag tone="ghost">Remote</Tag>}
              <StatusBadge
                label={program.open ? "Open" : "Closed"}
                tone={program.open ? "live" : "closed"}
                dot={program.open}
              />
            </div>

            <p className="label-mono mt-5 text-muted-foreground">
              {program.organization}
            </p>
            <h1 className="mt-2 text-[clamp(2.25rem,7vw,4.5rem)] leading-[0.98] font-extrabold tracking-tight">
              {program.name}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              {program.summary}
            </p>

            <div className="mt-10 space-y-10">
              <section>
                <SectionLabel>About the program</SectionLabel>
                <p className="mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
                  {program.about}
                </p>
              </section>
              <Block label="What ambassadors do" items={program.responsibilities} />
              <Block label="Requirements" items={program.requirements} />
              <Block label="Benefits" items={program.benefits} />
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <OffsetCard size="lg" className="p-6">
              <dl className="space-y-4">
                <div>
                  <dt className="label-mono text-muted-foreground">Reward</dt>
                  <dd className="mt-1 text-lg font-extrabold">{program.reward}</dd>
                </div>
                <div>
                  <dt className="label-mono text-muted-foreground">
                    Time commitment
                  </dt>
                  <dd className="mt-1 font-semibold">{program.commitment}</dd>
                </div>
                <div>
                  <dt className="label-mono text-muted-foreground">Deadline</dt>
                  <dd className="mt-1 font-semibold">
                    {formatDate(program.deadline)}
                  </dd>
                  <dd className="label-mono mt-1 text-muted-foreground">
                    {program.open ? deadlineLabel(program.deadline) : "Closed"}
                  </dd>
                </div>
                <div>
                  <dt className="label-mono text-muted-foreground">Perks</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {program.perks.map((p) => (
                      <Tag key={p} tone="ghost">
                        {p}
                      </Tag>
                    ))}
                  </dd>
                </div>
              </dl>

              <Button asChild size="lg" className="mt-6 w-full">
                <a href={program.applyUrl} target="_blank" rel="noreferrer noopener">
                  Apply <ArrowUpRight className="size-4" aria-hidden />
                </a>
              </Button>
            </OffsetCard>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <SectionLabel>More programs</SectionLabel>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Others looking for people.
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((p) => (
                <AmbassadorCard key={p.id} program={p} />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
