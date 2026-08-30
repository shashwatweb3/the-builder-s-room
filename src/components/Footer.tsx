import { Link } from "@tanstack/react-router";
import { Dot } from "./StatusBadge";

const nav = [
  { to: "/opportunities", label: "Opportunities" },
  { to: "/ambassadors", label: "Ambassadors" },
  { to: "/builders", label: "Builders" },
  { to: "/projects", label: "Projects" },
  { to: "/events", label: "Events" },
  { to: "/community", label: "Community" },
  { to: "/submit", label: "Submit" },
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
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="label-mono text-muted-foreground">The Rec Room</p>
            <p className="mt-3 max-w-sm text-3xl font-extrabold tracking-tight sm:text-4xl">
              A recreation room for builders.
            </p>
            <span className="label-mono mt-5 inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-3 py-1.5 shadow-offset-sm">
              <Dot /> Room open
            </span>
          </div>

          <nav aria-label="Footer">
            <p className="label-mono text-muted-foreground">Rooms</p>
            <ul className="mt-4 space-y-2">
              {nav.map((l) => (
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
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t-2 border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="label-mono text-muted-foreground">
            Built for people who ship.
          </p>
          <p className="label-mono text-muted-foreground">
            © {new Date().getFullYear()} The Rec Room
          </p>
        </div>
      </div>
    </footer>
  );
}
