import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { opportunities, categoryMeta } from "@/data/opportunities";
import { builders } from "@/data/builders";
import { projects } from "@/data/projects";
import { ambassadorPrograms } from "@/data/ambassadors";
import { events } from "@/data/events";
import { cn } from "@/lib/utils";

interface Hit {
  id: string;
  group: string;
  title: string;
  subtitle: string;
  to: string;
}

function buildIndex(): Hit[] {
  return [
    ...opportunities.map((o) => ({
      id: `o-${o.id}`,
      group: "Opportunities",
      title: o.title,
      subtitle: `${categoryMeta[o.category].label} · ${o.organization}`,
      to: `/opportunities/${o.id}`,
    })),
    ...builders.map((b) => ({
      id: `b-${b.id}`,
      group: "Builders",
      title: b.name,
      subtitle: `${b.roleLabel} · ${b.location}`,
      to: `/builders/${b.id}`,
    })),
    ...projects.map((p) => ({
      id: `p-${p.id}`,
      group: "Projects",
      title: p.name,
      subtitle: p.pitch,
      to: `/projects/${p.id}`,
    })),
    ...ambassadorPrograms.map((a) => ({
      id: `a-${a.id}`,
      group: "Programs",
      title: a.name,
      subtitle: a.organization,
      to: `/ambassadors/${a.id}`,
    })),
    ...events.map((e) => ({
      id: `e-${e.id}`,
      group: "Events",
      title: e.name,
      subtitle: `${e.location} · ${e.date}`,
      to: "/events",
    })),
  ];
}

export function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const index = useMemo(buildIndex, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? index.filter(
          (h) =>
            h.title.toLowerCase().includes(q) ||
            h.subtitle.toLowerCase().includes(q) ||
            h.group.toLowerCase().includes(q),
        )
      : index;
    return pool.slice(0, 12);
  }, [query, index]);

  const grouped = useMemo(() => {
    const map = new Map<string, Hit[]>();
    results.forEach((r) => {
      map.set(r.group, [...(map.get(r.group) ?? []), r]);
    });
    return Array.from(map.entries());
  }, [results]);

  const flat = grouped.flatMap(([, hits]) => hits);

  useEffect(() => {
    if (!open) return undefined;
    setQuery("");
    setActive(0);
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const go = (to: string) => {
    onClose();
    navigate({ to });
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-foreground/35 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search The Rec Room"
        className="rise-in absolute inset-x-3 top-[8vh] mx-auto max-w-2xl overflow-hidden rounded-3xl border-2 border-border bg-background shadow-offset-lg sm:inset-x-6"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, flat.length - 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          }
          if (e.key === "Enter" && flat[active]) {
            e.preventDefault();
            go(flat[active].to);
          }
        }}
      >
        <div className="flex items-center gap-3 border-b-2 border-border px-4 py-3">
          <Search className="size-5 shrink-0" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search opportunities, builders, projects…"
            aria-label="Search query"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-base font-medium outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-border bg-card"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {flat.length === 0 ? (
            <p className="px-4 py-10 text-center text-muted-foreground">
              Nothing matches “{query}”. Try something looser.
            </p>
          ) : (
            grouped.map(([group, hits]) => (
              <div key={group} className="mb-2">
                <p className="label-mono px-3 py-2 text-muted-foreground">
                  {group}
                </p>
                <ul>
                  {hits.map((hit) => {
                    const i = flat.indexOf(hit);
                    return (
                      <li key={hit.id}>
                        <button
                          type="button"
                          onMouseEnter={() => setActive(i)}
                          onClick={() => go(hit.to)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                            i === active ? "bg-lavender" : "hover:bg-lavender/50",
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">
                              {hit.title}
                            </span>
                            <span className="block truncate text-sm text-muted-foreground">
                              {hit.subtitle}
                            </span>
                          </span>
                          <span className="label-mono shrink-0 text-muted-foreground">
                            ↵
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="label-mono flex items-center justify-between border-t-2 border-border px-4 py-2.5 text-muted-foreground">
          <span>↑↓ to move · ↵ to open</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
}
