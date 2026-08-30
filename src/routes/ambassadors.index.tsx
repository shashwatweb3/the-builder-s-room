import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHero } from "@/components/PageHero";
import { SectionLabel } from "@/components/SectionLabel";
import { AmbassadorCard } from "@/components/AmbassadorCard";
import { TogglePill } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { JoinCTA } from "@/components/JoinCTA";
import { Button } from "@/components/Button";
import { ambassadorPrograms } from "@/data/ambassadors";

export const Route = createFileRoute("/ambassadors/")({
  head: () => ({
    meta: [
      { title: "Ambassador Programs — The Rec Room" },
      {
        name: "description",
        content:
          "Live ambassador and community programs looking for people to help grow interesting projects.",
      },
      { property: "og:title", content: "Ambassador Programs — The Rec Room" },
      {
        property: "og:description",
        content:
          "Represent something you believe in. Community, content, developer and regional programs.",
      },
    ],
  }),
  component: AmbassadorsPage,
});

const filters = [
  { key: "open", label: "Open" },
  { key: "paid", label: "Paid" },
  { key: "remote", label: "Remote" },
  { key: "community", label: "Community" },
  { key: "content", label: "Content" },
  { key: "developer", label: "Developer" },
  { key: "regional", label: "Regional" },
] as const;

function AmbassadorsPage() {
  const [active, setActive] = useState<string[]>([]);

  const toggle = (key: string) =>
    setActive((a) => (a.includes(key) ? a.filter((k) => k !== key) : [...a, key]));

  const results = useMemo(
    () =>
      ambassadorPrograms.filter((p) => {
        if (active.includes("open") && !p.open) return false;
        if (active.includes("paid") && !p.paid) return false;
        if (active.includes("remote") && !p.remote) return false;
        const types = active.filter((a) =>
          ["community", "content", "developer", "regional"].includes(a),
        );
        if (types.length && !types.includes(p.type)) return false;
        return true;
      }),
    [active],
  );

  const featured = results.find((p) => p.featured);
  const rest = results.filter((p) => p !== featured);

  return (
    <>
      <PageHero label="Ambassadors" title="Represent something you believe in.">
        Find live ambassador and community programs looking for people to help
        grow interesting projects.
      </PageHero>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {filters.map((f) => (
            <TogglePill
              key={f.key}
              active={active.includes(f.key)}
              onClick={() => toggle(f.key)}
            >
              {f.label}
            </TogglePill>
          ))}
        </div>

        {results.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No programs match that."
              body="Try fewer filters — good programs come and go quickly."
              action={
                <Button variant="outline" onClick={() => setActive([])}>
                  Clear filters →
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {featured && (
              <div className="mt-10">
                <SectionLabel>Featured program</SectionLabel>
                <div className="mt-4">
                  <AmbassadorCard program={featured} featured />
                </div>
              </div>
            )}

            {rest.length > 0 && (
              <div className="mt-14">
                <SectionLabel>All programs</SectionLabel>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {rest.map((p) => (
                    <AmbassadorCard key={p.id} program={p} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <JoinCTA />
      </section>
    </>
  );
}
