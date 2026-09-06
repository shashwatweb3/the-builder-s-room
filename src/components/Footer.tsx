import { Link } from "@tanstack/react-router";
import { Twitter } from "lucide-react";
import { Dot } from "./StatusBadge";
import { Button } from "./Button";
import { TELEGRAM_INVITE_URL, X_PROFILE_URL } from "@/lib/community";

const discover = [
  { to: "/projects", label: "Projects" },
  { to: "/events", label: "Events" },
  { to: "/opportunities", label: "Opportunities" },
] as const;

const krew = [
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Footer() {
  return (
    <footer className="mt-24 border-t-2 border-border bg-background">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-14 sm:px-6 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1.2fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="label-mono text-muted-foreground">KREW3</p>
            <p className="mt-3 max-w-sm text-3xl font-extrabold tracking-tight sm:text-4xl">
              Not a community. A Krew.
            </p>
            <span className="label-mono mt-5 inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-3 py-1.5 shadow-offset-sm">
              <Dot /> Krew open
            </span>
          </div>

          <nav aria-label="Footer discover links">
            <p className="label-mono text-muted-foreground">DISCOVER</p>
            <ul className="mt-4 space-y-2">
              {discover.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="font-medium underline-offset-4 transition-colors hover:text-primary hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Footer krew links">
            <p className="label-mono text-muted-foreground">KREW</p>
            <ul className="mt-4 space-y-2">
              {krew.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="font-medium underline-offset-4 transition-colors hover:text-primary hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="label-mono text-muted-foreground">KREW</p>
            <Button asChild size="lg" className="mt-4">
              <a href={TELEGRAM_INVITE_URL} target="_blank" rel="noopener noreferrer">
                Join the Krew →
              </a>
            </Button>
            <a
              href={X_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 font-medium underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              <Twitter className="size-4" aria-hidden />X · @Krew3HQ
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t-2 border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="label-mono text-muted-foreground">Built for people who ship.</p>
          <p className="label-mono text-muted-foreground">© {new Date().getFullYear()} Krew3</p>
        </div>
      </div>
    </footer>
  );
}
