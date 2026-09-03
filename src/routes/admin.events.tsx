import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createServerClient } from "@supabase/ssr";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Eye, EyeOff, MapPin, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Tag } from "@/components/Tag";

type EventRow = {
  id: string;
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
  status: "draft" | "published" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
};

export const Route = createFileRoute("/admin/events")({
  beforeLoad: async () => {
    const { isAdmin } = await getSession();
    if (!isAdmin) throw redirect({ to: "/admin/login" });
  },
  loader: async () => {
    const events = await getEvents();
    return { events };
  },
  component: AdminEvents,
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

const getEvents = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  if (!request) throw new Error("Admin dashboard must run in a server context");
  const supabase = await requireAdminClient(request);
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EventRow[];
});

const toggleStatus = createServerFn({ method: "POST" })
  .validator((data: { id: string; status: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest();
    if (!request) throw new Error("Admin dashboard must run in a server context");
    const supabase = await requireAdminClient(request);
    const newStatus = data.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("events").update({ status: newStatus }).eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

const deleteEvent = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest();
    if (!request) throw new Error("Admin dashboard must run in a server context");
    const supabase = await requireAdminClient(request);
    const { error } = await supabase.from("events").delete().eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

const statusTones: Record<string, "default" | "purple" | "ghost"> = {
  draft: "ghost",
  published: "purple",
  cancelled: "ghost",
  completed: "default",
};

function AdminEvents() {
  const { events } = Route.useLoaderData();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => e.title.toLowerCase().includes(q));
  }, [events, search]);

  const handleToggle = async (id: string, status: string) => {
    setPendingId(id);
    try {
      await toggleStatus({ data: { id, status } });
      toast.success(status === "published" ? "Unpublished" : "Published");
      router.invalidate();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setPendingId(id);
    try {
      await deleteEvent({ data: { id } });
      toast.success("Deleted");
      router.invalidate();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Events</h1>
          <p className="mt-2 text-muted-foreground">Manage your event lineup.</p>
        </div>
        <Link
          to="/admin/events/new"
          className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-primary px-6 text-base font-semibold text-primary-foreground shadow-offset transition-colors hover:opacity-90"
        >
          <Plus className="size-4" aria-hidden />
          Create Event
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border-2 border-border bg-card p-4 shadow-offset sm:p-6">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="text"
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-12 w-full rounded-full border-2 border-border bg-background pl-10 pr-4 text-base outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {events.length === 0 && (
          <div className="rounded-2xl border-2 border-border bg-card p-10 text-center shadow-offset">
            <p className="text-lg font-semibold">No events yet.</p>
            <p className="mt-1 text-muted-foreground">Create the first one to get started.</p>
          </div>
        )}

        {events.length > 0 && filtered.length === 0 && (
          <div className="rounded-2xl border-2 border-border bg-card p-10 text-center shadow-offset">
            <p className="text-lg font-semibold">No events found.</p>
            <p className="mt-1 text-muted-foreground">Try a different search.</p>
          </div>
        )}

        {filtered.map((e) => (
          <div
            key={e.id}
            className="rounded-2xl border-2 border-border bg-card p-5 shadow-offset sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-extrabold tracking-tight sm:text-xl">
                    {e.title}
                  </h2>
                  <Tag tone={statusTones[e.status] ?? "default"}>{e.status}</Tag>
                  {e.featured && <Tag tone="ghost">Featured</Tag>}
                  {e.is_online && <Tag tone="ghost">Online</Tag>}
                </div>
                <p className="mt-2 text-muted-foreground">{e.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 label-mono text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4" aria-hidden />
                    {e.event_date}
                    {e.end_date ? ` – ${e.end_date}` : ""}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" aria-hidden />
                    {e.is_online ? "Online" : e.location || "TBD"}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Link
                  to="/admin/events/$id/edit"
                  params={{ id: e.id }}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-semibold shadow-offset transition-colors hover:bg-lavender/40"
                >
                  <Pencil className="size-3.5" aria-hidden />
                  Edit
                </Link>
                <button
                  onClick={() => handleToggle(e.id, e.status)}
                  disabled={pendingId === e.id}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-semibold shadow-offset transition-colors hover:bg-lavender/40 disabled:opacity-50"
                >
                  {e.status === "published" ? (
                    <>
                      <EyeOff className="size-3.5" aria-hidden />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Eye className="size-3.5" aria-hidden />
                      Publish
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(e.id, e.title)}
                  disabled={pendingId === e.id}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-semibold text-destructive shadow-offset transition-colors hover:bg-destructive/10 disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
