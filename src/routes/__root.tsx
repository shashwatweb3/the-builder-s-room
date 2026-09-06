import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchModal } from "@/components/SearchModal";
import { Button } from "@/components/Button";
import { SavedProvider } from "@/lib/saved";

function NotFoundComponent() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
      <p className="label-mono text-muted-foreground">Error 404</p>
      <p className="mt-4 text-[clamp(5rem,22vw,12rem)] leading-[0.8] font-extrabold tracking-tighter">
        404
      </p>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl">
        You wandered into the wrong place.
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Nothing here but folding chairs and a broken ping-pong table.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link to="/">Back to Krew3 →</Link>
      </Button>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <p className="label-mono text-muted-foreground">Signal lost</p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">
        Well, that didn't work.
      </h1>
      <p className="mt-3 text-muted-foreground">Something went wrong.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          size="lg"
        >
          Try again →
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Krew3 — Not a community. A Krew." },
      {
        name: "description",
        content: "Web3's Krew of builders and creators learning, helping, and building together.",
      },
      { name: "author", content: "Krew3" },
      { property: "og:site_name", content: "Krew3" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Krew3HQ" },
      { name: "twitter:creator", content: "@Krew3HQ" },
      { name: "theme-color", content: "#F6F3ED" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { rel: "icon", href: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SavedProvider>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[80] focus:rounded-full focus:border-2 focus:border-border focus:bg-card focus:px-4 focus:py-2 focus:font-semibold"
        >
          Skip to content
        </a>
        <Navbar onOpenSearch={() => setSearchOpen(true)} />
        <main id="main">
          {/* Required: nested routes render here. */}
          <Outlet />
        </main>
        <Footer />
        <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
        <Toaster position="bottom-right" />
      </SavedProvider>
    </QueryClientProvider>
  );
}
