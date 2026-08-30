import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Github, ExternalLink } from "lucide-react";
import { SectionLabel } from "@/components/SectionLabel";
import { OffsetCard } from "@/components/OffsetCard";
import { Tag } from "@/components/Tag";
import { Button } from "@/components/Button";
import { SaveButton } from "@/components/SaveButton";
import { ProjectCard } from "@/components/ProjectCard";
import { JoinCTA } from "@/components/JoinCTA";
import { getProject, projectStatusLabel, projects } from "@/data/projects";
import { getBuilder, initials } from "@/data/builders";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$id")({
  loader: ({ params }) => {
    const project = getProject(params.id);
    if (!project) throw notFound();
    return { project };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return {
        meta: [{ title: "Project not found — The Rec Room" }],
      };
    const { project } = loaderData;
    const title = `${project.name} — The Rec Room`;
    return {
      meta: [
        { title },
        { name: "description", content: project.pitch },
        { property: "og:title", content: title },
        { property: "og:description", content: project.pitch },
      ],
    };
  },
  component: ProjectDetail,
});

function ProjectDetail() {
  const { project } = Route.useLoaderData();
  const people = project.builderIds
    .map((id) => getBuilder(id))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));
  const related = projects.filter((p) => p.id !== project.id).slice(0, 3);

  return (
    <>
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-8 sm:px-6 lg:px-10">
        <Link
          to="/projects"
          className="label-mono inline-flex items-center gap-2 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Back to projects
        </Link>
      </div>

      <article className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="purple">{projectStatusLabel[project.status]}</Tag>
              <Tag tone="ghost">{project.category}</Tag>
            </div>

            <h1 className="mt-5 text-[clamp(2.25rem,7vw,4.5rem)] leading-[0.98] font-extrabold tracking-tight">
              {project.name}
            </h1>
            <p className="mt-4 text-xl font-semibold sm:text-2xl">{project.pitch}</p>

            <div className="mt-10 space-y-10">
              <section>
                <SectionLabel>The gist</SectionLabel>
                <p className="mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
                  {project.description}
                </p>
              </section>

              <section className="grid gap-8 sm:grid-cols-2">
                <div>
                  <SectionLabel>The problem</SectionLabel>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {project.problem}
                  </p>
                </div>
                <div>
                  <SectionLabel>What they're building</SectionLabel>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {project.building}
                  </p>
                </div>
              </section>

              <section>
                <SectionLabel>Stack</SectionLabel>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.stack.map((s) => (
                    <Tag key={s}>{s}</Tag>
                  ))}
                </div>
              </section>

              <section>
                <SectionLabel>Update log</SectionLabel>
                <div className="mt-4 space-y-4">
                  {project.updates.map((u) => (
                    <OffsetCard key={u.date} size="sm" className="p-4 sm:p-5">
                      <p className="label-mono text-muted-foreground">{formatShortDate(u.date)}</p>
                      <p className="mt-2 text-base sm:text-lg">{u.text}</p>
                    </OffsetCard>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* Rail */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <OffsetCard size="lg" className="p-6">
              <div className="flex items-center justify-between gap-3">
                <SectionLabel>Status</SectionLabel>
                <SaveButton kind="project" id={project.id} label={project.name} />
              </div>
              <p className="mt-2 text-lg font-extrabold">{projectStatusLabel[project.status]}</p>

              <div className="mt-6 grid gap-3">
                {project.github && (
                  <Button asChild variant="outline" size="lg">
                    <a href={project.github} target="_blank" rel="noreferrer noopener">
                      <Github className="size-4" aria-hidden /> GitHub
                    </a>
                  </Button>
                )}
                {project.demo && (
                  <Button asChild variant="outline" size="lg">
                    <a href={project.demo} target="_blank" rel="noreferrer noopener">
                      <ExternalLink className="size-4" aria-hidden /> Live demo
                    </a>
                  </Button>
                )}
              </div>

              {project.lookingFor.length > 0 && (
                <div className="mt-6 border-t-2 border-dashed border-foreground/15 pt-5">
                  <p className="label-mono text-muted-foreground">Looking for</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.lookingFor.map((l) => (
                      <Tag key={l} tone="purple">
                        {l}
                      </Tag>
                    ))}
                  </div>
                  <Button asChild size="lg" variant="ink" className="mt-5 w-full">
                    <Link to="/submit">
                      I want to help <ArrowUpRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              )}

              {people.length > 0 && (
                <div className="mt-6 border-t-2 border-dashed border-foreground/15 pt-5">
                  <p className="label-mono text-muted-foreground">Builders</p>
                  <ul className="mt-3 space-y-3">
                    {people.map((p) => (
                      <li key={p.id}>
                        <Link
                          to="/builders/$id"
                          params={{ id: p.id }}
                          className="group flex items-center gap-3 rounded-xl border-2 border-border bg-card p-3 shadow-offset-sm"
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "grid size-10 shrink-0 place-items-center rounded-lg border-2 border-border text-xs font-extrabold",
                              p.accent,
                            )}
                          >
                            {initials(p.name)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-extrabold">{p.name}</span>
                            <span className="block truncate text-sm text-muted-foreground">
                              {p.roleLabel}
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
              )}
            </OffsetCard>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <SectionLabel>More in the room</SectionLabel>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Other things people are building.
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </section>
        )}
      </article>

      <section className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <JoinCTA />
      </section>
    </>
  );
}
