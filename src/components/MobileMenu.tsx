import { Link } from "@tanstack/react-router";
import { X, ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "./Button";
import { Dot } from "./StatusBadge";
import { useJoinRoom } from "@/lib/useJoinRoom";

const items = [
  { to: "/room", label: "The Room" },
  { to: "/builders", label: "Builders" },
  { to: "/projects", label: "Projects" },
  { to: "/events", label: "Events" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/saved", label: "Saved" },
] as const;

const secondary = [
  { to: "/ambassadors", label: "Ambassadors" },
  { to: "/submit", label: "Submit" },
] as const;

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const joinRoom = useJoinRoom();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] xl:hidden">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-foreground/30 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className="rise-in absolute inset-x-3 top-3 max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-3xl border-2 border-border bg-background p-5 shadow-offset-lg outline-none"
      >
        <div className="flex items-center justify-between">
          <span className="label-mono flex items-center gap-2 text-muted-foreground">
            <Dot /> Room open
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="press grid size-10 place-items-center rounded-full border-2 border-border bg-card shadow-offset-sm"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <nav aria-label="Mobile" className="mt-5">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onClose}
                  className="group flex items-center justify-between rounded-2xl px-3 py-3 text-2xl font-extrabold tracking-tight transition-colors hover:bg-lavender/60"
                  activeProps={{ className: "bg-lavender/70" }}
                >
                  {item.label}
                  <ArrowUpRight
                    className="size-5 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>

          <p className="label-mono mt-6 mb-2 text-muted-foreground">More</p>
          <ul className="space-y-1">
            {secondary.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onClose}
                  className="group flex items-center justify-between rounded-2xl px-3 py-3 text-lg font-bold tracking-tight transition-colors hover:bg-lavender/60"
                  activeProps={{ className: "bg-lavender/70" }}
                >
                  {item.label}
                  <ArrowUpRight
                    className="size-5 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Button
          size="lg"
          className="mt-5 w-full"
          onClick={() => {
            onClose();
            joinRoom();
          }}
        >
          Join the Room
        </Button>
      </div>
    </div>
  );
}
