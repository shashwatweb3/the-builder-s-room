import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Search, Bookmark, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { Dot } from "./StatusBadge";
import { MobileMenu } from "./MobileMenu";
import { useSaved } from "@/lib/saved";
import { TELEGRAM_INVITE_URL } from "@/lib/community";
import { useMemberSession } from "@/lib/member-auth";
import { isMemberNavRoute, krewIdNavLink, memberProfileNavLink } from "@/lib/krew-profile";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/builders", label: "Builders" },
  { to: "/events", label: "Events" },
  { to: "/opportunities", label: "Opportunities" },
] as const;

const moreLinks = [
  { to: "/about", label: "About" },
  { to: "/guidelines", label: "Community Guidelines" },
  { to: "/", hash: "faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLLIElement>(null);
  const { count, hydrated } = useSaved();
  const { user, loading: authLoading } = useMemberSession();

  // Member routes stay hidden until we actually know a session exists, so
  // logged-out visitors never see Krew ID controls. Public nav is untouched.
  const memberLinksVisible = !authLoading && !!user;
  // "Krew ID" always points at the public claim page, so neither an anonymous
  // visitor nor a member is dropped on a sign-in screen by tapping it. A signed-in
  // member also gets their own dashboard as a separate entry below it.
  const visibleMoreLinks = [krewIdNavLink(), memberProfileNavLink(), ...moreLinks].filter(
    (l) => !isMemberNavRoute(l.to) || memberLinksVisible,
  );
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

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
          className={cn(
            "mx-auto flex w-full max-w-[1400px] items-center gap-3 px-4 transition-[height] duration-300 sm:px-6 lg:h-20 lg:px-10",
            scrolled ? "h-13 sm:h-16" : "h-16",
          )}
        >
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 rounded-full"
            aria-label="Krew3 — home"
          >
            <span
              className={cn(
                "grid place-items-center rounded-lg border-2 border-border bg-primary text-primary-foreground shadow-offset-sm transition-all duration-300",
                scrolled ? "size-7 lg:size-8" : "size-8",
              )}
            >
              <span className="font-mono text-xs font-bold">K3</span>
            </span>
            <span
              className={cn(
                "font-extrabold tracking-tight transition-all duration-300 lg:text-xl",
                scrolled ? "text-base" : "text-lg",
              )}
            >
              Krew3
            </span>
          </Link>

          <ul className="ml-6 hidden items-center gap-1 xl:flex">
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
            <li ref={moreRef} className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((o) => !o)}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-2 text-[0.95rem] font-medium text-foreground/80 transition-colors hover:bg-lavender/50 hover:text-foreground",
                  moreOpen && "bg-lavender/70 font-semibold !text-foreground",
                )}
              >
                More
                <ChevronDown
                  className={cn("size-4 transition-transform", moreOpen && "rotate-180")}
                  aria-hidden
                />
              </button>
              {moreOpen && (
                <div
                  role="menu"
                  aria-label="More"
                  className="rise-in absolute left-0 top-full mt-2 w-64 rounded-2xl border-2 border-border bg-card p-2 shadow-offset"
                >
                  {visibleMoreLinks.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      role="menuitem"
                      onClick={() => setMoreOpen(false)}
                      className="block rounded-xl px-3 py-2.5 font-medium transition-colors hover:bg-lavender/50"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          </ul>

          <div className="ml-auto flex items-center gap-2">
            <span className="label-mono mr-1 hidden items-center gap-1.5 text-muted-foreground xl:flex">
              <Dot /> Krew open
            </span>

            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search Krew3"
              className={cn(
                "press flex items-center gap-2 rounded-full border-2 border-border bg-card px-3 shadow-offset-sm transition-all duration-300 sm:px-3.5",
                scrolled ? "min-h-9 sm:min-h-10" : "min-h-10",
              )}
            >
              <Search className="size-4" aria-hidden />
              <span className="label-mono hidden text-muted-foreground sm:inline">⌘K</span>
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

            <Button asChild size="sm" className="hidden xl:inline-flex">
              <a href={TELEGRAM_INVITE_URL} target="_blank" rel="noopener noreferrer">
                Join the Krew
              </a>
            </Button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className={cn(
                "press grid place-items-center rounded-full border-2 border-border bg-card shadow-offset-sm transition-all duration-300 xl:hidden",
                scrolled ? "size-9 sm:size-10" : "size-10",
              )}
            >
              <Menu className="size-5" aria-hidden />
            </button>
          </div>
        </nav>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        memberLinksVisible={memberLinksVisible}
      />
    </>
  );
}
