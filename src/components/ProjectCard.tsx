import { Link } from "@tanstack/react-router";
import { Github, ExternalLink } from "lucide-react";
import type { Project } from "@/data/types";
import { projectStatusLabel } from "@/data/projects";
import { getBuilder } from "@/data/builders";
import { OffsetCard } from "./OffsetCard";
import { Tag } from "./Tag";
import { SaveButton } from "./SaveButton";
import { cn } from "@/lib/utils";

export function ProjectCard({ project }: { project: Project }) {
  const owners = project.builderIds
    .map((id) => getBuilder(id)?.name)
    .filter(Boolean)
    .join(" & ");

  return (
    <OffsetCard
      as="article"
      interactive
      className="group relative flex h-full flex-col overflow-hidden"
    >
      {/* Abstract generated visual — no stock photography */}
      <div
        aria-hidden
        className={cn(
          "grid-paper relative h-32 border-b-2 border-border sm:h-36",
          project.accent,
        )}
      >
        <span className="absolute bottom-3 left-4 font-mono text-3xl font-bold opacity-30 sm:text-4xl">
          {project.name.slice(0, 2).toUpperCase()}
        </span>
        <span className="absolute top-3 right-3 size-8 rounded-full border-2 border-border bg-background/70" />
        <span className="absolute top-8 right-9 size-4 rounded-full border-2 border-border bg-primary" />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <Tag tone="purple">{projectStatusLabel[project.status]}</Tag>
          <SaveButton
            kind="project"
            id={project.id}
            label={project.name}
            className="relative z-10"
          />
        </div>

        <h3 className="mt-4 text-xl font-extrabold tracking-tight sm:text-2xl">
          <Link
            to="/projects/$id"
            params={{ id: project.id }}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {project.name}
          </Link>
        </h3>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {project.pitch}
        </p>
        <p className="label-mono mt-3 text-muted-foreground">
          {owners} · {project.category}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {project.stack.slice(0, 3).map((s) => (
            <Tag key={s} tone="ghost">
              {s}
            </Tag>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-3 border-t-2 border-dashed border-foreground/15 pt-4">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noreferrer noopener"
              className="relative z-10 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
            >
              <Github className="size-4" aria-hidden /> Code
            </a>
          )}
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noreferrer noopener"
              className="relative z-10 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
            >
              <ExternalLink className="size-4" aria-hidden /> Demo
            </a>
          )}
        </div>
      </div>
    </OffsetCard>
  );
}
