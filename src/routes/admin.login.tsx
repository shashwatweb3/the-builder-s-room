import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createBrowserClient(
      import.meta.env["VITE_SUPABASE_URL"]!,
      import.meta.env["VITE_SUPABASE_ANON_KEY"]!,
    );

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role !== "admin") {
        setError("You do not have admin access.");
        setLoading(false);
        return;
      }
    }

    router.navigate({ to: "/admin" });
  };

  return (
    <div className="grid-paper flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="label-mono text-muted-foreground hover:text-foreground">
            Krew3
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Krew3 Admin</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border-2 border-border bg-card p-6 shadow-offset"
        >
          {error && (
            <div className="mb-4 rounded-xl border-2 border-destructive bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          <label htmlFor="email" className="label-mono text-muted-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 min-h-12 w-full rounded-full border-2 border-border bg-background px-4 text-base outline-none placeholder:text-muted-foreground"
          />

          <label htmlFor="password" className="label-mono mt-4 block text-muted-foreground">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 min-h-12 w-full rounded-full border-2 border-border bg-background px-4 text-base outline-none placeholder:text-muted-foreground"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-6 min-h-12 w-full rounded-full border-2 border-border bg-primary px-6 text-base font-semibold text-primary-foreground shadow-offset transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
