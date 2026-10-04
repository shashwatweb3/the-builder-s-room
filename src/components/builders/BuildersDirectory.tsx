import { useMemo, useState, type ReactElement } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Globe, Search, Send } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import {
  KREW3_LOGO_SIZE,
  KREW3_LOGO_SRC,
  memberTypeLabel,
  normalizeHandle,
  telegramUrl,
  xUrl,
  type PublicKrewProfile,
} from "@/lib/krew-profile";

/** Below this, a search box is more clutter than it is help. */
const SEARCH_THRESHOLD = 12;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * The approved + public member grid on /builders.
 *
 * Receives only the ten public columns, so there is nothing to hide here: no
 * status, no user_id, no token. Each card links to the member's public
 * /<username> profile, never the private management route.
 */
export function BuildersDirectory({ members }: { members: PublicKrewProfile[] }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) => m.display_name.toLowerCase().includes(q) || m.username.toLowerCase().includes(q),
    );
  }, [members, query]);

  const showSearch = members.length >= SEARCH_THRESHOLD;

  return (
    <>
      {members.length === 0 ? (
        <EmptyState
          title="No builders listed yet."
          body="Approved public Krew IDs show up here. The Krew is just getting started."
        />
      ) : (
        <>
          {showSearch && (
            <div className="mb-8 flex justify-center">
              <label className="relative block w-full max-w-sm">
                <span className="sr-only">Search builders by name or Krew ID</span>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name or Krew ID"
                  className="w-full rounded-xl border-2 border-border bg-card py-2.5 pr-3 pl-9 text-sm shadow-offset-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-lavender"
                />
              </label>
            </div>
          )}

          {visible.length === 0 ? (
            <EmptyState title="No builders match that." body="Try a different name or Krew ID." />
          ) : (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((member) => (
                <li key={member.username}>
                  <BuilderCard member={member} />
                </li>
              ))}
            </ul>
          )}

          <p className="label-mono mt-10 text-center text-muted-foreground">
            {visible.length} {visible.length === 1 ? "builder" : "builders"}
            {query.trim() ? " matched" : " in the Krew"}
          </p>
        </>
      )}
    </>
  );
}

function BuilderCard({ member }: { member: PublicKrewProfile }) {
  const typeLabel = memberTypeLabel(member.member_type);

  const socials = [
    member.x_handle ? { label: "X", href: xUrl(member.x_handle), icon: <XMark /> } : null,
    member.telegram_handle
      ? {
          label: "Telegram",
          href: telegramUrl(member.telegram_handle),
          icon: <Send className="size-3.5" />,
        }
      : null,
    member.website_url
      ? { label: "Website", href: member.website_url, icon: <Globe className="size-3.5" /> }
      : null,
  ].filter((s): s is { label: string; href: string; icon: ReactElement } => s !== null);

  return (
    <article className="flex h-full flex-col rounded-2xl border-2 border-border bg-card shadow-offset transition-transform hover:-translate-y-0.5">
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-border bg-lavender/40 shadow-offset-sm">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt=""
              width={56}
              height={56}
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          ) : (
            <span className="label-mono text-sm">{initials(member.display_name)}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base leading-tight font-extrabold tracking-tight">
            {member.display_name}
          </h2>
          <p className="truncate text-sm text-muted-foreground">@{member.username}</p>
          {typeLabel && (
            <span className="label-mono mt-1.5 inline-block rounded-full border-2 border-border bg-lavender/30 px-2 py-0.5 text-[0.65rem] text-foreground">
              {typeLabel}
            </span>
          )}
        </div>
      </div>

      {member.bio && (
        <p className="line-clamp-3 px-4 pb-3 text-sm leading-snug text-muted-foreground">
          {member.bio}
        </p>
      )}

      {member.best_work_title && (
        <div className="mx-4 mb-3 rounded-xl border-2 border-border bg-surface px-3 py-2">
          <p className="label-mono text-[0.6rem] text-muted-foreground">Best work</p>
          <p className="truncate text-sm font-semibold">{member.best_work_title}</p>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 border-t-2 border-border px-4 py-3">
        <div className="flex items-center gap-1.5">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.display_name} on ${s.label}`}
              className="grid size-7 place-items-center rounded-lg border-2 border-border bg-card text-muted-foreground transition-colors hover:bg-lavender/40 hover:text-foreground"
            >
              {s.icon}
            </a>
          ))}
        </div>

        <Link
          to="/$username"
          params={{ username: member.username }}
          className="label-mono inline-flex items-center gap-1 text-foreground underline decoration-2 underline-offset-4 hover:text-lavender-700"
        >
          View
          <ArrowUpRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

function XMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
