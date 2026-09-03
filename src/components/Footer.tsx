import { Link } from "@tanstack/react-router";
import { Dot } from "./StatusBadge";
import { Button } from "./Button";

const room = [
  { to: "/projects", label: "Projects" },
  { to: "/events", label: "Events" },
] as const;

const discover = [
  { to: "/opportunities", label: "Opportunities" },
  { to: "/about", label: "About" },
  { to: "/guidelines", label: "Community Guidelines" },
  { to: "/contact", label: "Contact" },
] as const;

const socials = [
  { label: "X", url: "https://x.com" },
  { label: "Discord", url: "https://discord.com" },
  { label: "GitHub", url: "https://github.com" },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t-2 border-border bg-background">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-14 sm:px-6 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1.2fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="label-mono text-muted-foreground">The Rec Room</p>
            <p className="mt-3 max-w-sm text-3xl font-extrabold tracking-tight sm:text-4xl">
              A recreation room for builders and creators.
            </p>
            <span className="label-mono mt-5 inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-3 py-1.5 shadow-offset-sm">
              <Dot /> Room open
            </span>
          </div>

          <nav aria-label="Footer room links">
            <p className="label-mono text-muted-foreground">Room</p>
            <ul className="mt-4 space-y-2">
              {room.map((l) => (
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

          <nav aria-label="Footer discover links">
            <p className="label-mono text-muted-foreground">Discover</p>
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

          <nav aria-label="Footer elsewhere links">
            <p className="label-mono text-muted-foreground">Elsewhere</p>
            <ul className="mt-4 space-y-2">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-medium underline-offset-4 transition-colors hover:text-primary hover:underline"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="label-mono text-muted-foreground">Join</p>
            <Button asChild size="lg" className="mt-4">
              <a href="/#join">Pull up a chair →</a>
            </Button>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t-2 border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="label-mono text-muted-foreground">Built for people who ship.</p>
          <p className="label-mono text-muted-foreground">
            © {new Date().getFullYear()} The Rec Room
          </p>
        </div>
      </div>
    </footer>
  );
}
