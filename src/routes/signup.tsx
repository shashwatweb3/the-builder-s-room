import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/Button";
import { SectionLabel } from "@/components/SectionLabel";
import { signUpWithAccessCode } from "@/lib/member-auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your Krew ID | Krew3" },
      {
        name: "description",
        content: "Create your Krew3 member account and claim your Krew ID.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MemberSignup,
});

function MemberSignup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    const result = await signUpWithAccessCode(email, password, accessCode);

    if (!result.ok) {
      if (result.error === "confirm-email") {
        setNotice(
          "Account created. Check your inbox to confirm your email, then sign in to finish your Krew ID.",
        );
        setLoading(false);
        return;
      }
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
            CREATE YOUR KREW ID
          </SectionLabel>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Join the Krew</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            Krew3 is invite-only. Use the access code from your approval.
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

          {notice && (
            <div className="mb-4 rounded-xl border-2 border-border bg-lavender/50 p-3 text-sm font-medium">
              {notice}
            </div>
          )}

          <label htmlFor="signup-email" className="label-mono text-muted-foreground">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 min-h-12 w-full rounded-full border-2 border-border bg-background px-4 text-base outline-none placeholder:text-muted-foreground"
          />

          <label htmlFor="signup-password" className="label-mono mt-4 block text-muted-foreground">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 min-h-12 w-full rounded-full border-2 border-border bg-background px-4 text-base outline-none placeholder:text-muted-foreground"
          />
          <p className="label-mono mt-1.5 text-muted-foreground">8 characters minimum</p>

          <label htmlFor="signup-code" className="label-mono mt-4 block text-muted-foreground">
            Krew access code
          </label>
          <input
            id="signup-code"
            type="text"
            required
            autoComplete="off"
            spellCheck={false}
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="K3-XXXX-XXXX"
            className="mt-2 min-h-12 w-full rounded-full border-2 border-border bg-background px-4 text-base outline-none placeholder:text-muted-foreground"
          />

          <Button type="submit" size="lg" className="mt-6 w-full" disabled={loading}>
            {loading ? "Creating…" : "Create my account"}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-foreground underline">
            Sign in
          </Link>
        </p>

        <p className="mt-3 text-center text-sm text-muted-foreground">
          Rather skip the account?{" "}
          <Link to="/krew-id" className="font-semibold text-foreground underline">
            Claim your Krew ID
          </Link>{" "}
          with no email at all.
        </p>
      </div>
    </div>
  );
}
