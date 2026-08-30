import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Check, ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { OffsetCard } from "@/components/OffsetCard";
import { SectionLabel } from "@/components/SectionLabel";
import { Button } from "@/components/Button";
import { TogglePill } from "@/components/FilterBar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Submit — The Rec Room" },
      {
        name: "description",
        content:
          "Got something worth sharing with the room? Send it over and we'll review it before it hits the floor.",
      },
    ],
  }),
  component: SubmitPage,
});

const kinds = [
  "Job",
  "Hackathon",
  "Residency",
  "Grant",
  "Ambassador program",
  "Project",
  "Event",
] as const;

interface FormState {
  kind: string;
  title: string;
  organization: string;
  url: string;
  location: string;
  deadline: string;
  remote: boolean;
  tags: string;
  compensation: string;
  contact: string;
  description: string;
}

const initial: FormState = {
  kind: "Project",
  title: "",
  organization: "",
  url: "",
  location: "",
  deadline: "",
  remote: true,
  tags: "",
  compensation: "",
  contact: "",
  description: "",
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-full border-2 border-border bg-background px-4 text-base outline-none placeholder:text-muted-foreground";

function SubmitPage() {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [done, setDone] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) next.title = "Give it a name.";
    if (!form.organization.trim() && form.kind !== "Project")
      next.organization = "Who's behind it?";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.contact.trim()))
      next.contact = "We need a real way to reach you.";
    if (!form.description.trim()) next.description = "Tell people what it is.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setDone(true);
  };

  if (done) {
    return (
      <>
        <PageHero label="Submit" title="Got something worth sharing?" />
        <section className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <OffsetCard tone="lavender" size="lg" className="max-w-2xl p-6 sm:p-10">
            <span className="grid size-12 place-items-center rounded-full border-2 border-border bg-primary text-primary-foreground">
              <Check className="size-6" aria-hidden />
            </span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Nice. We've got it.
            </h2>
            <p className="mt-2 text-lg text-foreground/75">
              We'll review it before it hits the room.
            </p>
            <Button
              variant="outline"
              size="lg"
              className="mt-6"
              onClick={() => {
                setForm(initial);
                setDone(false);
              }}
            >
              Submit another one →
            </Button>
          </OffsetCard>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero label="Submit" title="Got something worth sharing?">
        A job, a hackathon, a residency, a grant, an ambassador program, a project or an event. If
        it makes the room more interesting, we want it.
      </PageHero>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <form
          onSubmit={submit}
          noValidate
          className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start"
        >
          <OffsetCard className="p-5 sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <span className="label-mono text-muted-foreground">What is it?</span>
                <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
                  {kinds.map((k) => (
                    <TogglePill key={k} active={form.kind === k} onClick={() => set("kind", k)}>
                      {k}
                    </TogglePill>
                  ))}
                </div>
              </div>

              <Field label="Title" htmlFor="sub-title" error={errors.title}>
                <input
                  id="sub-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="What's it called?"
                  aria-invalid={!!errors.title}
                  className={cn(inputClass, errors.title && "border-destructive")}
                />
              </Field>

              <Field label="Organization" htmlFor="sub-org" error={errors.organization}>
                <input
                  id="sub-org"
                  type="text"
                  value={form.organization}
                  onChange={(e) => set("organization", e.target.value)}
                  placeholder="Who's behind it?"
                  aria-invalid={!!errors.organization}
                  className={cn(inputClass, errors.organization && "border-destructive")}
                />
              </Field>

              <Field label="Link" htmlFor="sub-url">
                <input
                  id="sub-url"
                  type="url"
                  value={form.url}
                  onChange={(e) => set("url", e.target.value)}
                  placeholder="https://…"
                  className={inputClass}
                />
              </Field>

              <Field label="Location" htmlFor="sub-loc">
                <input
                  id="sub-loc"
                  type="text"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="Remote, Berlin, Anywhere…"
                  className={inputClass}
                />
              </Field>

              <div className="flex items-end gap-4">
                <Field label="Deadline" htmlFor="sub-deadline" className="flex-1">
                  <input
                    id="sub-deadline"
                    type="date"
                    value={form.deadline}
                    onChange={(e) => set("deadline", e.target.value)}
                    className={cn(inputClass, "uppercase")}
                  />
                </Field>
                <div className="pb-0.5">
                  <span className="label-mono text-muted-foreground">Remote</span>
                  <TogglePill active={form.remote} onClick={() => set("remote", !form.remote)}>
                    {form.remote ? "Remote OK" : "In person"}
                  </TogglePill>
                </div>
              </div>

              <Field label="Compensation / prize" htmlFor="sub-comp">
                <input
                  id="sub-comp"
                  type="text"
                  value={form.compensation}
                  onChange={(e) => set("compensation", e.target.value)}
                  placeholder="$5,000, stipend, no equity…"
                  className={inputClass}
                />
              </Field>

              <Field label="Contact email" htmlFor="sub-contact" error={errors.contact}>
                <input
                  id="sub-contact"
                  type="email"
                  value={form.contact}
                  onChange={(e) => set("contact", e.target.value)}
                  placeholder="you@example.com"
                  aria-invalid={!!errors.contact}
                  className={cn(inputClass, errors.contact && "border-destructive")}
                />
              </Field>

              <Field label="Tags" htmlFor="sub-tags" className="sm:col-span-2">
                <input
                  id="sub-tags"
                  type="text"
                  value={form.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  placeholder="Rust, Open source, First time friendly…"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Tell people about it"
                htmlFor="sub-desc"
                error={errors.description}
                className="sm:col-span-2"
              >
                <textarea
                  id="sub-desc"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Two or three honest sentences. What it is, who it's for, why it's interesting."
                  aria-invalid={!!errors.description}
                  className={cn(
                    "mt-2 min-h-32 w-full resize-y rounded-2xl border-2 border-border bg-background p-4 text-base leading-relaxed outline-none placeholder:text-muted-foreground",
                    errors.description && "border-destructive",
                  )}
                />
              </Field>
            </div>
          </OffsetCard>

          <aside className="lg:sticky lg:top-28">
            <OffsetCard tone="purple" size="lg" className="grid-paper p-6 sm:p-8">
              <SectionLabel dot className="!text-primary-foreground/80">
                Before you send it
              </SectionLabel>
              <p className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Keep it human.
              </p>
              <p className="mt-3 text-base text-primary-foreground/85 sm:text-lg">
                No press releases. No buzzwords. Write like you're telling a friend in the room why
                they should care.
              </p>

              <Button size="lg" variant="ink" type="submit" className="mt-6 w-full">
                Send it to the room <ArrowUpRight className="size-4" aria-hidden />
              </Button>
              <p className="label-mono mt-3 text-primary-foreground/70">
                We read everything before it goes live.
              </p>
            </OffsetCard>
          </aside>
        </form>
      </section>
    </>
  );
}

function Field({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string | undefined;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label-mono text-muted-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
