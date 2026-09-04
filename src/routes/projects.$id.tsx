import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { JoinCTA } from "@/components/JoinCTA";

export const Route = createFileRoute("/projects/$id")({
  loader: () => {
    throw new Error("not found");
  },
  head: () => ({
    meta: [{ title: "Project not found — Krew3" }],
  }),
  component: ProjectDetail,
});

function ProjectDetail() {
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

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <EmptyState
          title="Project not found."
          body="This project may have been removed or doesn't exist yet."
          action={null}
        />
      </section>

      <section className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <JoinCTA />
      </section>
    </>
  );
}
