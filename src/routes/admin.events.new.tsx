import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createServerClient } from "@supabase/ssr";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Tag } from "@/components/Tag";

export const Route = createFileRoute("/admin/events/new")({
  beforeLoad: async () => {
    const { isAdmin } = await getSession();
    if (!isAdmin) throw redirect({ to: "/admin/login" });
  },
  component: NewEvent,
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
    isAdmin: (profile as { role?: string } | null)?.role === "admin",
  };
});

async function requireAdminClient(request: Request) {
  if (!import.meta.env["VITE_SUPABASE_URL"] || !import.meta.env["VITE_SUPABASE_ANON_KEY"]) {
    throw new Error(
      "Admin dashboard misconfigured: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.",
    );
  }
  const supabase = makeClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Admin authentication required");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if ((profile as { role?: string } | null)?.role !== "admin") {
    throw new Error("Admin authentication required");
  }
  return supabase;
}

const insertEvent = createServerFn({ method: "POST" })
  .validator(
    (data: {
      title: string;
      slug: string;
      description: string;
      long_description: string | null;
      event_date: string;
      end_date: string | null;
      location: string;
      is_online: boolean;
      meeting_url: string | null;
      registration_url: string | null;
      image_url: string | null;
      featured: boolean;
      status: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const request = getRequest();
    if (!request) throw new Error("Admin dashboard must run in a server context");
    const supabase = await requireAdminClient(request);
    const { error } = await supabase.from("events").insert(data);
    if (error) throw error;
    return { success: true };
  });

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

const inputClass =
  "mt-2 min-h-12 w-full rounded-full border-2 border-border bg-background px-4 text-base outline-none placeholder:text-muted-foreground";

const selectClass =
  "mt-2 min-h-12 w-full rounded-full border-2 border-border bg-background px-4 text-base outline-none appearance-none";

const textareaClass =
  "mt-2 min-h-32 w-full resize-y rounded-2xl border-2 border-border bg-background p-4 text-base leading-relaxed outline-none placeholder:text-muted-foreground";

interface FormState {
  title: string;
  description: string;
  long_description: string;
  event_date: string;
  end_date: string;
  location: string;
  is_online: boolean;
  meeting_url: string;
  registration_url: string;
  image_url: string;
  featured: boolean;
  status: string;
}

const initial: FormState = {
  title: "",
  description: "",
  long_description: "",
  event_date: "",
  end_date: "",
  location: "",
  is_online: false,
  meeting_url: "",
  registration_url: "",
  image_url: "",
  featured: false,
  status: "draft",
};

function NewEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) next.title = "Title is required.";
    if (!form.description.trim()) next.description = "Description is required.";
    if (!form.event_date) next.event_date = "Event date is required.";
    if (form.registration_url && !isValidUrl(form.registration_url)) {
      next.registration_url = "Registration URL must be a valid URL.";
    }
    if (form.meeting_url && !isValidUrl(form.meeting_url)) {
      next.meeting_url = "Meeting URL must be a valid URL.";
    }
    if (form.image_url && !isValidUrl(form.image_url)) {
      next.image_url = "Image URL must be a valid URL.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await insertEvent({
        data: {
          title: form.title.trim(),
          slug: slugify(form.title.trim()),
          description: form.description.trim(),
          long_description: form.long_description.trim() || null,
          event_date: form.event_date,
          end_date: form.end_date || null,
          location: form.location.trim(),
          is_online: form.is_online,
          meeting_url: form.meeting_url.trim() || null,
          registration_url: form.registration_url.trim() || null,
          image_url: form.image_url.trim() || null,
          featured: form.featured,
          status: form.status,
        },
      });
      toast.success("Event created");
      navigate({ to: "/admin/events" });
    } catch {
      toast.error("Failed to create event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div>
        <Link
          to="/admin/events"
          className="label-mono inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to events
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <Tag tone="purple">New</Tag>
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">New Event</h1>
        <p className="mt-2 text-muted-foreground">Add a new event to the calendar.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 rounded-2xl border-2 border-border bg-card p-6 shadow-offset sm:p-8"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="ev-title" className="label-mono text-muted-foreground">
              Title *
            </label>
            <input
              id="ev-title"
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

          <div className="sm:col-span-2">
            <label htmlFor="ev-desc" className="label-mono text-muted-foreground">
              Description *
            </label>
            <textarea
              id="ev-desc"
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
            <label htmlFor="ev-long" className="label-mono text-muted-foreground">
              Long Description
            </label>
            <textarea
              id="ev-long"
              value={form.long_description}
              onChange={(e) => set("long_description", e.target.value)}
              placeholder="Full details for the detail page."
              className={textareaClass}
            />
          </div>

          <div>
            <label htmlFor="ev-date" className="label-mono text-muted-foreground">
              Event Date *
            </label>
            <input
              id="ev-date"
              type="date"
              value={form.event_date}
              onChange={(e) => set("event_date", e.target.value)}
              className={`${inputClass} uppercase ${errors.event_date ? "border-destructive" : ""}`}
            />
            {errors.event_date && (
              <p role="alert" className="mt-1.5 text-sm font-medium text-destructive">
                {errors.event_date}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="ev-end-date" className="label-mono text-muted-foreground">
              End Date
            </label>
            <input
              id="ev-end-date"
              type="date"
              value={form.end_date}
              onChange={(e) => set("end_date", e.target.value)}
              className={`${inputClass} uppercase`}
            />
          </div>

          <div>
            <label htmlFor="ev-location" className="label-mono text-muted-foreground">
              Location
            </label>
            <input
              id="ev-location"
              type="text"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="San Francisco, Anywhere…"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="ev-meeting-url" className="label-mono text-muted-foreground">
              Meeting URL
            </label>
            <input
              id="ev-meeting-url"
              type="url"
              value={form.meeting_url}
              onChange={(e) => set("meeting_url", e.target.value)}
              placeholder="https://…"
              className={`${inputClass} ${errors.meeting_url ? "border-destructive" : ""}`}
            />
            {errors.meeting_url && (
              <p role="alert" className="mt-1.5 text-sm font-medium text-destructive">
                {errors.meeting_url}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="ev-reg-url" className="label-mono text-muted-foreground">
              Registration URL
            </label>
            <input
              id="ev-reg-url"
              type="url"
              value={form.registration_url}
              onChange={(e) => set("registration_url", e.target.value)}
              placeholder="https://lu.ma/…"
              className={`${inputClass} ${errors.registration_url ? "border-destructive" : ""}`}
            />
            {errors.registration_url && (
              <p role="alert" className="mt-1.5 text-sm font-medium text-destructive">
                {errors.registration_url}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="ev-image" className="label-mono text-muted-foreground">
              Image URL
            </label>
            <input
              id="ev-image"
              type="url"
              value={form.image_url}
              onChange={(e) => set("image_url", e.target.value)}
              placeholder="https://…"
              className={`${inputClass} ${errors.image_url ? "border-destructive" : ""}`}
            />
            {errors.image_url && (
              <p role="alert" className="mt-1.5 text-sm font-medium text-destructive">
                {errors.image_url}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="ev-status" className="label-mono text-muted-foreground">
              Status
            </label>
            <select
              id="ev-status"
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
                checked={form.is_online}
                onChange={(e) => set("is_online", e.target.checked)}
                className="size-5 rounded border-2 border-border accent-primary"
              />
              <span className="label-mono text-muted-foreground">Online event</span>
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
            {saving ? "Creating…" : "Create Event"}
          </button>
          <Link
            to="/admin/events"
            className="rounded-full border-2 border-border bg-card px-6 text-base font-semibold shadow-offset transition-colors hover:bg-lavender/40"
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
