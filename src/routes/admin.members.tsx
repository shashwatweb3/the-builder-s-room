import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Search, X } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/Button";
import { OffsetCard } from "@/components/OffsetCard";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { createClient } from "@/lib/supabase/client";
import { useMemberSession } from "@/lib/member-auth";
import {
  KREW3_LOGO_SIZE,
  KREW3_LOGO_SRC,
  KREW_PROFILE_STATUSES,
  STATUS_LABELS,
  memberTypeLabel,
  profileUrl,
  validateUsername,
  type KrewProfile,
  type KrewProfileStatus,
} from "@/lib/krew-profile";

export const Route = createFileRoute("/admin/members")({
  beforeLoad: async () => {
    // Mirror admin.index.tsx: if Supabase env is missing, degrade to the login
    // screen instead of throwing a 500.
    if (!import.meta.env["VITE_SUPABASE_URL"] || !import.meta.env["VITE_SUPABASE_ANON_KEY"]) {
      throw redirect({ to: "/admin/login" });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/admin/login" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") throw redirect({ to: "/admin/login" });
  },
  component: AdminMembers,
});

type StatusFilter = "all" | KrewProfileStatus;

function AdminMembers() {
  const { user } = useMemberSession();
  const [rows, setRows] = useState<KrewProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const isAdmin = !!user;

  const load = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      // Admins read through the SECURITY DEFINER RPC, because the authenticated
      // role has no SELECT grant on the table. The RPC re-checks is_admin().
      const { data, error: queryError } = await supabase.rpc("admin_krew_profiles");

      if (queryError) throw new Error(queryError.message);
      setRows((data as KrewProfile[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load member profiles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter !== "all" && row.status !== filter) return false;
      if (!q) return true;
      return row.username.toLowerCase().includes(q) || row.display_name.toLowerCase().includes(q);
    });
  }, [rows, query, filter]);

  const counts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      all: rows.length,
      pending: 0,
      approved: 0,
      revoked: 0,
    };
    for (const row of rows) base[row.status] += 1;
    return base;
  }, [rows]);

  const setStatus = async (row: KrewProfile, status: KrewProfileStatus) => {
    setBusyId(row.id);
    setError("");
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("krew_profiles")
        .update({ status, is_public: status === "approved" })
        .eq("username", row.username);

      if (updateError) throw new Error(updateError.message);

      setRows((current) =>
        current.map((r) =>
          r.id === row.id ? { ...r, status, is_public: status === "approved" } : r,
        ),
      );
      toast.success(`${row.username} ${status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusyId(null);
    }
  };

  const rename = async (row: KrewProfile) => {
    const next = window.prompt(`New Krew ID for ${row.display_name}:`, row.username);
    if (next === null) return;

    const check = validateUsername(next);
    if (!check.ok) {
      setError(check.error);
      return;
    }

    setBusyId(row.id);
    setError("");
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("krew_profiles")
        .update({ username: check.username })
        .eq("username", row.username);

      if (updateError) throw new Error(updateError.message);

      setRows((current) =>
        current.map((r) => (r.id === row.id ? { ...r, username: check.username } : r)),
      );
      toast.success(`Krew ID changed to @${check.username}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rename failed.");
    } finally {
      setBusyId(null);
    }
  };

  const copyUrl = async (row: KrewProfile) => {
    try {
      await navigator.clipboard.writeText(profileUrl(row.username));
      toast.success("Profile URL copied");
    } catch {
      toast.error("Could not copy.");
    }
  };

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Members</h1>
        <p className="mt-1 text-muted-foreground">
          Review Krew IDs, approve them, revoke them, or fix a username.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border-2 border-destructive bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or Krew ID"
            aria-label="Search members"
            className="min-h-11 w-full rounded-full border-2 border-border bg-card pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>

        {(["all", ...KREW_PROFILE_STATUSES] as StatusFilter[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`min-h-11 rounded-full border-2 border-border px-4 text-sm font-semibold transition-colors ${
              filter === value
                ? "bg-primary text-primary-foreground"
                : "bg-card hover:bg-lavender/40"
            }`}
          >
            {value === "all" ? "All" : STATUS_LABELS[value]}
            <span className="ml-1.5 font-mono text-xs opacity-70">{counts[value]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="label-mono py-10 text-muted-foreground">Loading members…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={rows.length === 0 ? "No Krew IDs yet." : "Nothing matches that."}
          body={
            rows.length === 0
              ? "Member profiles land here for approval as soon as someone creates one."
              : "Try a different name or status filter."
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((row) => {
            const typeLabel = memberTypeLabel(row.member_type);
            const busy = busyId === row.id;

            return (
              <li key={row.id}>
                <OffsetCard className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-border bg-lavender/40">
                        {row.avatar_url ? (
                          <img
                            src={row.avatar_url}
                            alt=""
                            width={48}
                            height={48}
                            className="size-full object-cover"
                          />
                        ) : (
                          <img
                            src={KREW3_LOGO_SRC}
                            alt=""
                            width={KREW3_LOGO_SIZE.width}
                            height={KREW3_LOGO_SIZE.height}
                            className="size-full object-cover"
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-bold">{row.display_name}</p>
                        <p className="label-mono mt-0.5 text-muted-foreground">@{row.username}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <StatusBadge
                            label={STATUS_LABELS[row.status]}
                            tone={
                              row.status === "approved"
                                ? "live"
                                : row.status === "revoked"
                                  ? "closed"
                                  : "neutral"
                            }
                            dot
                          />
                          {typeLabel && <StatusBadge label={typeLabel} tone="purple" />}
                          {!row.is_public && row.status === "approved" && (
                            <StatusBadge label="Hidden" tone="closed" />
                          )}
                        </div>
                        {row.bio && (
                          <p className="mt-2 line-clamp-2 max-w-md text-sm text-muted-foreground">
                            {row.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {row.status !== "approved" && (
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => void setStatus(row, "approved")}
                        >
                          <Check className="size-4" aria-hidden />
                          Approve
                        </Button>
                      )}
                      {row.status !== "revoked" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void setStatus(row, "revoked")}
                        >
                          <X className="size-4" aria-hidden />
                          Revoke
                        </Button>
                      )}
                      {row.status === "revoked" && (
                        <Button
                          size="sm"
                          variant="soft"
                          disabled={busy}
                          onClick={() => void setStatus(row, "pending")}
                        >
                          Back to pending
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => void rename(row)}
                      >
                        Rename
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void copyUrl(row)}>
                        <Copy className="size-4" aria-hidden />
                        Copy URL
                      </Button>
                      {row.status === "approved" && row.is_public && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={`/${row.username}`} target="_blank" rel="noopener noreferrer">
                            View
                            <ExternalLink className="size-4" aria-hidden />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  <p className="label-mono mt-3 border-t-2 border-border/40 pt-3 text-muted-foreground">
                    {profileUrl(row.username)}
                  </p>
                </OffsetCard>
              </li>
            );
          })}
        </ul>
      )}

      <p className="label-mono text-muted-foreground">
        <Link to="/admin" className="underline">
          Back to dashboard
        </Link>
      </p>
    </AdminLayout>
  );
}
