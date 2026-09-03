import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { OffsetCard } from "@/components/OffsetCard";
import { Button } from "@/components/Button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — The Rec Room" },
      {
        name: "description",
        content: "Have a question, suggestion, or just want to say hi? We'd love to hear from you.",
      },
    ],
  }),
  component: ContactPage,
});

const links = [
  {
    label: "Email us",
    href: "mailto:hello@therecroom.dev",
    description: "For general questions, feedback or partnership inquiries.",
  },
  {
    label: "Open an issue",
    href: "https://github.com/shashwatweb3/the-builder-s-room/issues",
    description: "Found a bug or have a feature request? Let us know.",
  },
  {
    label: "Community Guidelines",
    to: "/guidelines" as const,
    description: "How we keep the room a good place to be.",
  },
];

function ContactPage() {
  return (
    <>
      <PageHero label="Contact" title="Get in touch.">
        Have a question, suggestion, or just want to say hi? We'd love to hear from you.
      </PageHero>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((l) => (
            <OffsetCard key={l.label} interactive className="p-6">
              {"href" in l && l.href ? (
                <a
                  href={l.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="after:absolute after:inset-0"
                >
                  <h3 className="text-xl font-extrabold tracking-tight">
                    {l.label} <ArrowUpRight className="inline size-4" aria-hidden />
                  </h3>
                </a>
              ) : "to" in l ? (
                <Link to={l.to} className="after:absolute after:inset-0">
                  <h3 className="text-xl font-extrabold tracking-tight">
                    {l.label} <ArrowUpRight className="inline size-4" aria-hidden />
                  </h3>
                </Link>
              ) : null}
              <p className="mt-2 text-sm text-muted-foreground">{l.description}</p>
            </OffsetCard>
          ))}
        </div>
      </section>
    </>
  );
}
