import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/Button";
import { SectionLabel } from "@/components/SectionLabel";
import { signInWithPassword } from "@/lib/member-auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in | Krew3" },
      {
        name: "description",
        content: "Sign in to manage your Krew3 ID and Krew Card.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MemberLogin,
});

function MemberLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signInWithPassword(email, password);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    await navigate({ to: "/profile" });
  };

  return (
    <div className="grid-paper flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="label-mono text-muted-foreground hover:text-foreground">
            Krew3
          </Link>
          <SectionLabel dot={false} className="mt-6 justify-center">
            YOUR KREW3 ID
          </SectionLabel>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Sign in</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            Your people should know where to find you.
          </p>
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

          <label htmlFor="login-email" className="label-mono text-muted-foreground">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 min-h-12 w-full rounded-full border-2 border-border bg-background px-4 text-base outline-none placeholder:text-muted-foreground"
          />

          <label htmlFor="login-password" className="label-mono mt-4 block text-muted-foreground">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 min-h-12 w-full rounded-full border-2 border-border bg-background px-4 text-base outline-none placeholder:text-muted-foreground"
          />

          <Button type="submit" size="lg" className="mt-6 w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Approved in the Krew but no account yet?{" "}
          <Link to="/signup" className="font-semibold text-foreground underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
