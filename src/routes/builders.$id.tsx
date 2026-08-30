import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, MapPin, Github, ExternalLink } from "lucide-react";
import { SectionLabel } from "@/components/SectionLabel";
import { OffsetCard } from "@/components/OffsetCard";
import { Tag } from "@/components/Tag";
import { Button } from "@/components/Button";
import { SaveButton } from "@/components/SaveButton";
import { ProjectCard } from "@/components/ProjectCard";
import { JoinCTA } from "@/components/JoinCTA";
import { builders, getBuilder, initials, statusLabel } from "@/data/builders";
import { projects, projectsByBuilder } from "@/data/projects";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/builders/$id")({
  loader: ({ params }) => {
    const builder = getBuilder(params.id);
    if (!builder) throw notFound();
    return { builder };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return {
        meta: [{ title: "Builder not found — The Rec Room" }],
      };
    const { builder } = loaderData;
    const title = `${builder.name} — The Rec Room`;
    return {
      meta: [
        { title },
        { name: "description", content: builder.bio },
        { property: "og:title", content: title },
        { property: "og:description", content: builder.bio },
      ],
    };
  },
  component: BuilderProfile,
});

function BuilderProfile() {
  const { builder } = Route.useLoaderData();
  const projectsArr = projectsByBuilder(builder.id);
  const currentProject = projects.find(
    (p) => p.name.toLowerCase() === builder.currentProject.toLowerCase(),
  );
  const related = builders
    .filter((b) => b.id !== builder.id && b.role === builder.role)
    .slice(0, 3);

  return (
    <>
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-8 sm:px-6 lg:px-10">
        <Link
          to="/builders"
          className="label-mono inline-flex items-center gap-2 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Back to builders
        </Link>
      </div>

      <article className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
          <div className="min-w-0">
            <header className="flex flex-wrap items-start gap-4">
              <span
                aria-hidden
                className={cn(
                  "grid size-16 shrink-0 place-items-center rounded-2xl border-2 border-border text-xl font-extrabold shadow-offset-sm sm:size-20 sm:text-2xl",
                  builder.accent,
                )}
              >
                {initials(builder.name)}
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-[clamp(2rem,6vw,4rem)] leading-[0.98] font-extrabold tracking-tight">
                  {builder.name}
                </h1>
                <p className="mt-1 text-lg font-semibold text-muted-foreground">
                  {builder.handle} · {builder.roleLabel} · {builder.location}
                </p>
              </div>
              <SaveButton kind="builder" id={builder.id} label={builder.name} withText />
            </header>

            <div className="mt-4 flex flex-wrap gap-2">
              {builder.statuses.map((s) => (
                <Tag key={s} tone="purple">
                  {statusLabel[s]}
                </Tag>
              ))}
            </div>

            <div className="mt-10 space-y-10">
              <section>
                <SectionLabel>About</SectionLabel>
                <p className="mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">{builder.bio}</p>
                <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
                  {builder.about}
                </p>
              </section>

              <section>
                <SectionLabel>Skills</SectionLabel>
                <div className="mt-4 flex flex-wrap gap-2">
                  {builder.skills.map((s) => (
                    <Tag key={s}>{s}</Tag>
                  ))}
                </div>
              </section>

              {builder.lookingFor.length > 0 && (
                <section>
                  <SectionLabel>Looking for</SectionLabel>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {builder.lookingFor.map((l) => (
                      <Tag key={l} tone="purple">
                        {l}
                      </Tag>
                    ))}
                  </div>
                  <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                    Know someone? Point them at this profile.
                  </p>
                </section>
              )}

              <section className="grid gap-10 sm:grid-cols-2">
                <div>
                  <SectionLabel>Past projects</SectionLabel>
                  <ul className="mt-4 space-y-3">
                    {builder.pastProjects.map((p) => (
                      <li
                        key={p.name}
                        className="rounded-xl border-2 border-border bg-card p-4 shadow-offset-sm"
                      >
                        <p className="font-extrabold">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.note}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <SectionLabel>Contributions</SectionLabel>
                  <ul className="mt-4 space-y-3">
                    {builder.contributions.map((c) => (
                      <li key={c} className="flex gap-3">
                        <span
                          aria-hidden
                          className="mt-2.5 size-2 shrink-0 rounded-full bg-primary"
                        />
                        <span className="text-base sm:text-lg">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {projectsArr.length > 0 && (
                <section>
                  <SectionLabel>In the room</SectionLabel>
                  <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                    What {builder.name.split(" ")[0]} is building.
                  </h2>
                  <div className="mt-8 grid gap-6 sm:grid-cols-2">
                    {projectsArr.map((p) => (
                      <ProjectCard key={p.id} project={p} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* Rail */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <OffsetCard size="lg" className="p-6">
              <dl className="space-y-4">
                <div>
                  <dt className="label-mono text-muted-foreground">Currently</dt>
                  <dd className="mt-1 text-lg font-extrabold">
                    {currentProject ? (
                      <Link
                        to="/projects/$id"
                        params={{ id: currentProject.id }}
                        className="underline-offset-4 hover:underline"
                      >
                        {builder.currentProject}
                      </Link>
                    ) : (
                      builder.currentProject
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="label-mono text-muted-foreground">From</dt>
                  <dd className="mt-1 flex items-center gap-2 font-semibold">
                    <MapPin className="size-4" aria-hidden />
                    {builder.location}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-2">
                {builder.links.map((l) => (
                  <a
                    key={l.label}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="press inline-flex min-h-9 items-center gap-1.5 rounded-full border-2 border-border bg-card px-3 text-sm font-semibold shadow-offset-sm"
                  >
                    {l.label === "GitHub" ? (
                      <Github className="size-3.5" aria-hidden />
                    ) : l.label === "Site" ? (
                      <ExternalLink className="size-3.5" aria-hidden />
                    ) : null}
                    {l.label}
                  </a>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 border-t-2 border-dashed border-foreground/15 pt-5 text-center">
                <div>
                  <p className="text-2xl font-extrabold">{builder.stats.projects}</p>
                  <p className="label-mono text-muted-foreground">Projects</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold">{builder.stats.hackathons}</p>
                  <p className="label-mono text-muted-foreground">Hackathons</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold">{builder.stats.collaborations}</p>
                  <p className="label-mono text-muted-foreground">Collabs</p>
                </div>
              </div>

              <div className="mt-6">
                <Button asChild size="lg" variant="ink" className="w-full">
                  <Link to="/room">
                    Say hi in the room <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </OffsetCard>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <SectionLabel>Also in the room</SectionLabel>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              More {builder.roleLabel.toLowerCase()}s
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((b) => (
                <OffsetCard
                  key={b.id}
                  interactive
                  className="group relative flex items-center gap-4 p-5 sm:p-6"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-12 shrink-0 place-items-center rounded-xl border-2 border-border font-extrabold shadow-offset-sm",
                      b.accent,
                    )}
                  >
                    {initials(b.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xl font-extrabold tracking-tight">
                      <Link
                        to="/builders/$id"
                        params={{ id: b.id }}
                        className="after:absolute after:inset-0 after:content-['']"
                      >
                        {b.name}
                      </Link>
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{b.roleLabel}</p>
                  </div>
                  <ArrowRight
                    className="size-4 shrink-0 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </OffsetCard>
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
