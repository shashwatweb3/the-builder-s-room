import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AdminLayout } from "@/components/AdminLayout";

export const Route = createFileRoute("/admin/opportunities/new")({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session.isAdmin) throw redirect({ to: "/admin/login" });
  },
  component: NewOpportunity,
});

function makeClient(request: Request) {
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

const getSession = createServerFn({ method: "GET" }).handler(async () => {
  if (!import.meta.env["VITE_SUPABASE_URL"] || !import.meta.env["VITE_SUPABASE_ANON_KEY"]) {
    return { user: null, isAdmin: false };
  }
  const request = getRequest();
  if (!request) return { user: null, isAdmin: false };
  const supabase = makeClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return {
    user: { id: user.id, email: user.email ?? "" },
    isAdmin: profile?.role === "admin",
  };
});

const insertOpportunity = createServerFn({ method: "POST" })
  .validator(
    (data: {
      title: string;
      slug: string;
      type: string;
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
      status: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    if (!import.meta.env["VITE_SUPABASE_URL"] || !import.meta.env["SUPABASE_SERVICE_ROLE_KEY"]) {
      return { success: false };
    }
    const adminClient = createClient(
      import.meta.env["VITE_SUPABASE_URL"],
      import.meta.env["SUPABASE_SERVICE_ROLE_KEY"],
    );
    const now = new Date().toISOString();
    const { error } = await adminClient.from("opportunities").insert({
      title: data.title,
      slug: data.slug,
      type: data.type,
      organization: data.organization,
      description: data.description,
      long_description: data.long_description || null,
      location: data.location,
      remote: data.remote,
      compensation: data.compensation || null,
      deadline: data.deadline || null,
      application_url: data.application_url || null,
      image_url: data.image_url || null,
      tags: data.tags,
      featured: data.featured,
      status: data.status,
      created_at: now,
      updated_at: now,
    });
    if (error) throw error;
    return { success: true };
  });

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const inputClass =
  "mt-2 min-h-12 w-full rounded-full border-2 border-border bg-background px-4 text-base outline-none placeholder:text-muted-foreground";

const selectClass =
  "mt-2 min-h-12 w-full rounded-full border-2 border-border bg-background px-4 text-base outline-none appearance-none";

const textareaClass =
  "mt-2 min-h-32 w-full resize-y rounded-2xl border-2 border-border bg-background p-4 text-base leading-relaxed outline-none placeholder:text-muted-foreground";

interface FormState {
  title: string;
  type: string;
  organization: string;
  description: string;
  long_description: string;
  location: string;
  remote: boolean;
  compensation: string;
  deadline: string;
  application_url: string;
  image_url: string;
  tags: string;
  featured: boolean;
  status: string;
}

const initial: FormState = {
  title: "",
  type: "job",
  organization: "",
  description: "",
  long_description: "",
  location: "",
  remote: true,
  compensation: "",
  deadline: "",
  application_url: "",
  image_url: "",
  tags: "",
  featured: false,
  status: "draft",
};

function NewOpportunity() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) next.title = "Title is required.";
    if (!form.type) next.type = "Type is required.";
    if (!form.organization.trim()) next.organization = "Organization is required.";
    if (!form.description.trim()) next.description = "Description is required.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await insertOpportunity({
        data: {
          title: form.title.trim(),
          slug: slugify(form.title.trim()),
          type: form.type,
          organization: form.organization.trim(),
          description: form.description.trim(),
          long_description: form.long_description.trim() || null,
          location: form.location.trim(),
          remote: form.remote,
          compensation: form.compensation.trim() || null,
          deadline: form.deadline || null,
          application_url: form.application_url.trim() || null,
          image_url: form.image_url.trim() || null,
          tags,
          featured: form.featured,
          status: form.status,
        },
      });
      toast.success("Opportunity created");
      navigate({ to: "/admin/opportunities" });
    } catch {
      toast.error("Failed to create opportunity");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div>
        <Link
          to="/admin/opportunities"
          className="label-mono inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to opportunities
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">New Opportunity</h1>
        <p className="mt-2 text-muted-foreground">Add a new opportunity to the board.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 rounded-2xl border-2 border-border bg-card p-6 shadow-offset sm:p-8"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="opp-title" className="label-mono text-muted-foreground">
              Title *
            </label>
            <input
              id="opp-title"
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="What's it called?"
              className={`${inputClass} ${errors.title ? "border-destructive" : ""}`}
            />
            {errors.title && (
              <p role="alert" className="mt-1.5 text-sm font-medium text-destructive">
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="opp-type" className="label-mono text-muted-foreground">
              Type *
            </label>
            <select
              id="opp-type"
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className={selectClass}
            >
              <option value="job">Job</option>
              <option value="hackathon">Hackathon</option>
              <option value="grant">Grant</option>
              <option value="residency">Residency</option>
              <option value="ambassador">Ambassador</option>
            </select>
          </div>

          <div>
            <label htmlFor="opp-org" className="label-mono text-muted-foreground">
              Organization *
            </label>
            <input
              id="opp-org"
              type="text"
              value={form.organization}
              onChange={(e) => set("organization", e.target.value)}
              placeholder="Who's behind it?"
              className={`${inputClass} ${errors.organization ? "border-destructive" : ""}`}
            />
            {errors.organization && (
              <p role="alert" className="mt-1.5 text-sm font-medium text-destructive">
                {errors.organization}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="opp-desc" className="label-mono text-muted-foreground">
              Description *
            </label>
            <textarea
              id="opp-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Short description for the card."
              className={`${textareaClass} ${errors.description ? "border-destructive" : ""}`}
            />
            {errors.description && (
              <p role="alert" className="mt-1.5 text-sm font-medium text-destructive">
                {errors.description}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="opp-long" className="label-mono text-muted-foreground">
              Long Description
            </label>
            <textarea
              id="opp-long"
              value={form.long_description}
              onChange={(e) => set("long_description", e.target.value)}
              placeholder="Full details for the detail page."
              className={textareaClass}
            />
          </div>

          <div>
            <label htmlFor="opp-location" className="label-mono text-muted-foreground">
              Location
            </label>
            <input
              id="opp-location"
              type="text"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Remote, Berlin, Anywhere…"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="opp-comp" className="label-mono text-muted-foreground">
              Compensation
            </label>
            <input
              id="opp-comp"
              type="text"
              value={form.compensation}
              onChange={(e) => set("compensation", e.target.value)}
              placeholder="$5,000, stipend, no equity…"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="opp-deadline" className="label-mono text-muted-foreground">
              Deadline
            </label>
            <input
              id="opp-deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => set("deadline", e.target.value)}
              className={`${inputClass} uppercase`}
            />
          </div>

          <div>
            <label htmlFor="opp-url" className="label-mono text-muted-foreground">
              Application URL
            </label>
            <input
              id="opp-url"
              type="url"
              value={form.application_url}
              onChange={(e) => set("application_url", e.target.value)}
              placeholder="https://…"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="opp-image" className="label-mono text-muted-foreground">
              Image URL
            </label>
            <input
              id="opp-image"
              type="url"
              value={form.image_url}
              onChange={(e) => set("image_url", e.target.value)}
              placeholder="https://…"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="opp-tags" className="label-mono text-muted-foreground">
              Tags
            </label>
            <input
              id="opp-tags"
              type="text"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="Rust, Open source, First time friendly…"
              className={inputClass}
            />
            <p className="label-mono mt-1 text-muted-foreground">Comma-separated</p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="opp-status" className="label-mono text-muted-foreground">
              Status
            </label>
            <select
              id="opp-status"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className={selectClass}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex items-center gap-6 sm:col-span-2">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.remote}
                onChange={(e) => set("remote", e.target.checked)}
                className="size-5 rounded border-2 border-border accent-primary"
              />
              <span className="label-mono text-muted-foreground">Remote OK</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="size-5 rounded border-2 border-border accent-primary"
              />
              <span className="label-mono text-muted-foreground">Featured</span>
            </label>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full border-2 border-border bg-primary px-6 text-base font-semibold text-primary-foreground shadow-offset transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create Opportunity"}
          </button>
          <Link
            to="/admin/opportunities"
            className="rounded-full border-2 border-border bg-card px-6 text-base font-semibold shadow-offset transition-colors hover:bg-lavender/40"
          >
            Cancel
          </Link>
        </div>
      </form>
    </AdminLayout>
  );
}
