import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createServerClient } from "@supabase/ssr";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Eye, EyeOff, Trash2, Plus } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Tag } from "@/components/Tag";

type OpportunityRow = {
  id: string;
  title: string;
  slug: string;
  type: "job" | "hackathon" | "grant" | "residency" | "ambassador";
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
  status: "draft" | "published" | "closed";
  created_at: string;
  updated_at: string;
};

export const Route = createFileRoute("/admin/opportunities")({
  beforeLoad: async () => {
    const { isAdmin } = await getSession();
    if (!isAdmin) throw redirect({ to: "/admin/login" });
  },
  loader: async () => {
    const opportunities = await getOpportunities();
    return { opportunities };
  },
  component: AdminOpportunities,
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

const getOpportunities = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  if (!request) throw new Error("Admin dashboard must run in a server context");
  const supabase = await requireAdminClient(request);
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OpportunityRow[];
});

const toggleStatus = createServerFn({ method: "POST" })
  .validator((data: { id: string; status: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest();
    if (!request) throw new Error("Admin dashboard must run in a server context");
    const supabase = await requireAdminClient(request);
    const newStatus = data.status === "published" ? "draft" : "published";
    const { error } = await supabase
      .from("opportunities")
      .update({ status: newStatus })
      .eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

const deleteOpportunity = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest();
    if (!request) throw new Error("Admin dashboard must run in a server context");
    const supabase = await requireAdminClient(request);
    const { error } = await supabase.from("opportunities").delete().eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

const typeLabels: Record<string, string> = {
  job: "Job",
  hackathon: "Hackathon",
  grant: "Grant",
  residency: "Residency",
  ambassador: "Ambassador",
};

const typeTones: Record<string, "default" | "purple" | "ghost"> = {
  job: "default",
  hackathon: "purple",
  grant: "purple",
  residency: "ghost",
  ambassador: "default",
};

const statusTones: Record<string, "default" | "purple" | "ghost"> = {
  draft: "ghost",
  published: "default",
  closed: "purple",
};

function AdminOpportunities() {
  const { opportunities } = Route.useLoaderData();
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = opportunities.filter((o) => {
    if (typeFilter !== "all" && o.type !== typeFilter) return false;
    if (search && !o.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
      await deleteOpportunity({ data: { id } });
      toast.success("Deleted");
      router.invalidate();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setPendingId(null);
    }
  };

  const types = ["all", "job", "hackathon", "grant", "residency", "ambassador"] as const;

  // `admin.opportunities.new` and `admin.opportunities.$id.edit` are nested
  // file routes and must be rendered through this parent's outlet.
  if (pathname !== "/admin/opportunities") {
    return (
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Opportunities</h1>
          <p className="mt-2 text-muted-foreground">Manage jobs, hackathons, grants and more.</p>
        </div>
        <Link
          to="/admin/opportunities/new"
          className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-primary px-6 text-base font-semibold text-primary-foreground shadow-offset transition-colors hover:opacity-90"
        >
          <Plus className="size-4" aria-hidden />
          Create Opportunity
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border-2 border-border bg-card p-4 shadow-offset sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-12 w-full rounded-full border-2 border-border bg-background px-4 text-base outline-none placeholder:text-muted-foreground sm:max-w-xs"
          />
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-full border-2 border-border px-4 py-2 text-sm font-semibold transition-colors ${
                  typeFilter === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-card hover:bg-lavender/40"
                }`}
              >
                {t === "all" ? "All" : typeLabels[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {filtered.length === 0 && (
          <div className="rounded-2xl border-2 border-border bg-card p-10 text-center shadow-offset">
            <p className="text-lg font-semibold">No opportunities found.</p>
            <p className="mt-1 text-muted-foreground">
              {opportunities.length === 0
                ? "Create your first one to get started."
                : "Try a different search or filter."}
            </p>
          </div>
        )}

        {filtered.map((o) => (
          <div
            key={o.id}
            className="rounded-2xl border-2 border-border bg-card p-5 shadow-offset sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-extrabold tracking-tight sm:text-xl">
                    {o.title}
                  </h2>
                  <Tag tone={typeTones[o.type] ?? "default"}>{typeLabels[o.type]}</Tag>
                  <Tag tone={statusTones[o.status] ?? "default"}>{o.status}</Tag>
                </div>
                <p className="label-mono mt-1.5 text-muted-foreground">{o.organization}</p>
                {o.deadline && (
                  <p className="label-mono mt-1 text-muted-foreground">
                    Deadline: {new Date(o.deadline).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Link
                  to="/admin/opportunities/$id/edit"
                  params={{ id: o.id }}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-semibold shadow-offset transition-colors hover:bg-lavender/40"
                >
                  <Pencil className="size-3.5" aria-hidden />
                  Edit
                </Link>
                <button
                  onClick={() => handleToggle(o.id, o.status)}
                  disabled={pendingId === o.id}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-semibold shadow-offset transition-colors hover:bg-lavender/40 disabled:opacity-50"
                >
                  {o.status === "published" ? (
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
                  onClick={() => handleDelete(o.id, o.title)}
                  disabled={pendingId === o.id}
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
