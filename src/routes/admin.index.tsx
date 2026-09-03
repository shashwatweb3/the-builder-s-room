import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createServerClient } from "@supabase/ssr";
import { AdminLayout } from "@/components/AdminLayout";

export const Route = createFileRoute("/admin/")({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session.isAdmin) throw redirect({ to: "/admin/login" });
  },
  loader: async () => {
    const stats = await getAdminStats();
    return { stats };
  },
  component: AdminDashboard,
});

const getSession = createServerFn({ method: "GET" }).handler(async () => {
  if (!import.meta.env["VITE_SUPABASE_URL"] || !import.meta.env["VITE_SUPABASE_ANON_KEY"]) {
    return { user: null, isAdmin: false };
  }
  const request = getRequest();
  if (!request) return { user: null, isAdmin: false };
  const supabase = createServerClient(
    import.meta.env["VITE_SUPABASE_URL"],
    import.meta.env["VITE_SUPABASE_ANON_KEY"],
    {
      cookies: {
        getAll() {
          const header = request.headers.get("cookie") ?? "";
          return header.split(";").map((c) => {
            const [name, ...rest] = c.trim().split("=");
            return { name: name ?? "", value: rest.join("=") };
          });
        },
        setAll() {},
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return { user: { id: user.id, email: user.email ?? "" }, isAdmin: profile?.role === "admin" };
});

const getAdminStats = createServerFn({ method: "GET" }).handler(async () => {
  if (!import.meta.env["VITE_SUPABASE_URL"] || !import.meta.env["VITE_SUPABASE_ANON_KEY"]) {
    return {
      events: { total: 0, published: 0, drafts: 0, upcoming: 0 },
      opportunities: { total: 0, published: 0, drafts: 0, closingSoon: 0 },
    };
  }
  const request = getRequest();
  if (!request)
    return {
      events: { total: 0, published: 0, drafts: 0, upcoming: 0 },
      opportunities: { total: 0, published: 0, drafts: 0, closingSoon: 0 },
    };
  const supabase = createServerClient(
    import.meta.env["VITE_SUPABASE_URL"],
    import.meta.env["VITE_SUPABASE_ANON_KEY"],
    {
      cookies: {
        getAll() {
          const header = request.headers.get("cookie") ?? "";
          return header.split(";").map((c) => {
            const [name, ...rest] = c.trim().split("=");
            return { name: name ?? "", value: rest.join("=") };
          });
        },
        setAll() {},
      },
    },
  );

  const [eventsAll, eventsPublished, eventsDrafts, eventsUpcoming] = await Promise.all([
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .gte("event_date", new Date().toISOString().slice(0, 10)),
  ]);

  const [oppsAll, oppsPublished, oppsDrafts, oppsClosingSoon] = await Promise.all([
    supabase.from("opportunities").select("id", { count: "exact", head: true }),
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .lte("deadline", new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10))
      .gte("deadline", new Date().toISOString().slice(0, 10)),
  ]);

  return {
    events: {
      total: eventsAll.count ?? 0,
      published: eventsPublished.count ?? 0,
      drafts: eventsDrafts.count ?? 0,
      upcoming: eventsUpcoming.count ?? 0,
    },
    opportunities: {
      total: oppsAll.count ?? 0,
      published: oppsPublished.count ?? 0,
      drafts: oppsDrafts.count ?? 0,
      closingSoon: oppsClosingSoon.count ?? 0,
    },
  };
});

function AdminDashboard() {
  const { stats } = Route.useLoaderData();

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Overview of all content.</p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <StatCard
          title="Events"
          stats={[
            { label: "Total", value: stats.events.total },
            { label: "Published", value: stats.events.published },
            { label: "Drafts", value: stats.events.drafts },
            { label: "Upcoming", value: stats.events.upcoming },
          ]}
        />
        <StatCard
          title="Opportunities"
          stats={[
            { label: "Total", value: stats.opportunities.total },
            { label: "Published", value: stats.opportunities.published },
            { label: "Drafts", value: stats.opportunities.drafts },
            { label: "Closing soon", value: stats.opportunities.closingSoon },
          ]}
        />
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, stats }: { title: string; stats: { label: string; value: number }[] }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-offset">
      <h2 className="label-mono text-muted-foreground">{title}</h2>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-3xl font-extrabold tracking-tight">{s.value}</p>
            <p className="label-mono mt-1 text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
