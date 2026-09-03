import { Link, useRouter } from "@tanstack/react-router";
import { createBrowserClient } from "@supabase/ssr";

const navItems = [
  { to: "/admin" as const, label: "Dashboard" as const, exact: true as const },
  { to: "/admin/events" as const, label: "Events" as const, exact: false as const },
  { to: "/admin/opportunities" as const, label: "Opportunities" as const, exact: false as const },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      import.meta.env["VITE_SUPABASE_URL"]!,
      import.meta.env["VITE_SUPABASE_ANON_KEY"]!,
    );
    await supabase.auth.signOut();
    router.navigate({ to: "/admin/login" });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-6 px-4 pt-6 pb-24 sm:px-6 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={item.exact ? { exact: true } : ({} as never)}
              className="rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:bg-lavender/50 [&.active]:bg-primary [&.active]:text-primary-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-semibold shadow-offset-sm transition-colors hover:bg-lavender/40"
        >
          Log out
        </button>
      </div>
      {children}
    </div>
  );
}
