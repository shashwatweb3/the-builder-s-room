import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Search, Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./Button";
import { Dot } from "./StatusBadge";
import { MobileMenu } from "./MobileMenu";
import { useSaved } from "@/lib/saved";
import { cn } from "@/lib/utils";

export const navLinks = [
  { to: "/opportunities", label: "Opportunities" },
  { to: "/ambassadors", label: "Ambassadors" },
  { to: "/builders", label: "Builders" },
  { to: "/projects", label: "Projects" },
] as const;

export function Navbar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, hydrated } = useSaved();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b-2 transition-colors duration-300",
          scrolled
            ? "border-border bg-background/92 backdrop-blur-md"
            : "border-transparent bg-background",
        )}
      >
        <nav
          aria-label="Main"
          className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:h-20 lg:px-10"
        >
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 rounded-full"
            aria-label="The Rec Room — home"
          >
            <span className="grid size-8 place-items-center rounded-lg border-2 border-border bg-primary text-primary-foreground shadow-offset-sm">
              <span className="font-mono text-xs font-bold">RR</span>
            </span>
            <span className="text-lg font-extrabold tracking-tight lg:text-xl">
              The Rec Room
            </span>
          </Link>

          <ul className="ml-6 hidden items-center gap-1 lg:flex">
            {navLinks.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="rounded-full px-3 py-2 text-[0.95rem] font-medium text-foreground/80 transition-colors hover:bg-lavender/50 hover:text-foreground"
                  activeProps={{
                    className: "bg-lavender/70 !text-foreground font-semibold",
                  }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-2">
            <span className="label-mono mr-1 hidden items-center gap-1.5 text-muted-foreground xl:flex">
              <Dot /> Room open
            </span>

            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search The Rec Room"
              className="press flex min-h-10 items-center gap-2 rounded-full border-2 border-border bg-card px-3 shadow-offset-sm sm:px-3.5"
            >
              <Search className="size-4" aria-hidden />
              <span className="label-mono hidden text-muted-foreground sm:inline">
                ⌘K
              </span>
            </button>

            <Link
              to="/saved"
              aria-label={`Saved items${hydrated && count ? ` (${count})` : ""}`}
              className="press relative hidden size-10 place-items-center rounded-full border-2 border-border bg-card shadow-offset-sm sm:grid"
            >
              <Bookmark className="size-4" aria-hidden />
              {hydrated && count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full border-2 border-border bg-primary font-mono text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>

            <Button asChild size="sm" className="hidden lg:inline-flex">
              <Link to="/community">Join the Room</Link>
            </Button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="press grid size-10 place-items-center rounded-full border-2 border-border bg-card shadow-offset-sm lg:hidden"
            >
              <Menu className="size-5" aria-hidden />
            </button>
          </div>
        </nav>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
