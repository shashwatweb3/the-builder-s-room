import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, ArrowRight, Check, Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/Button";
import { OffsetCard } from "@/components/OffsetCard";
import { SectionLabel } from "@/components/SectionLabel";
import { KrewProfileForm, type FormAvatar } from "@/components/krew-profile/KrewProfileForm";
import {
  claimKrewId,
  isExpiredUploadError,
  manageProfileUrl,
  uploadClaimAvatar,
} from "@/lib/krew-claim";
import {
  emptyDraft,
  isReservedUsername,
  profilePathLabel,
  profileUrl,
  validateProfileDraft,
  type KrewProfileDraft,
} from "@/lib/krew-profile";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { KrewClaimResult } from "@/lib/supabase/types";

/**
 * Public Krew ID claim: /krew-id
 *
 * No account, no email, no password. The browser calls the SECURITY DEFINER RPC
 * krew_claim_id, which creates a pending + private row and hands back the raw
 * manage token exactly once. The token stays in the URL the claimant is sent to
 * and is never written to storage by this app.
 */
export const Route = createFileRoute("/krew-id/")({
  head: () => ({
    meta: [
      { title: "Claim your Krew ID | Krew3" },
      {
        name: "description",
        content:
          "Claim a Krew3 handle in under a minute. No account needed — you get an edit link instead.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ClaimKrewIdRoute,
});

function UnavailableNotice() {
  return (
    <div className="grid-paper flex min-h-[70vh] items-center justify-center px-4">
      <OffsetCard size="lg" className="max-w-md p-8 text-center">
        <SectionLabel dot={false} className="justify-center">
          KREW ID
        </SectionLabel>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Claiming is unavailable.</h1>
        <p className="mt-2 text-muted-foreground">
          We can&apos;t reach the Krew right now. Please try again in a moment.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/">Back to Krew3</Link>
        </Button>
      </OffsetCard>
    </div>
  );
}

/** Read-only code block for the two URLs a claimant needs to keep. */
function UrlLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label-mono text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-mono text-sm break-all">{value}</p>
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        void navigator.clipboard
          .writeText(value)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          })
          .catch(() => setCopied(false));
      }}
    >
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied ? "Copied" : label}
    </Button>
  );
}

function ClaimSuccess({ claimed }: { claimed: KrewClaimResult }) {
  const editUrl = manageProfileUrl(claimed.manage_token);
  const publicUrl = profileUrl(claimed.username);
  const reserved = isReservedUsername(claimed.username);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 text-center">
        <SectionLabel dot={false} className="justify-center">
          KREW ID CLAIMED
        </SectionLabel>
        <h1 className="mt-2 text-[clamp(1.6rem,6vw,2.4rem)] leading-[0.95] font-extrabold tracking-tight">
          {profilePathLabel(claimed.username)} is yours.
        </h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          It is saved and waiting for a Krew3 admin to review it. Until then it stays private.
        </p>
      </div>

      <OffsetCard className="p-6">
        <div className="space-y-5">
          <div className="rounded-2xl border-2 border-border bg-lavender/40 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <KeyRound className="size-4 shrink-0" aria-hidden />
              <p className="text-sm font-semibold">Save your edit link now.</p>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              It is the only way back into this profile. We store a scrambled copy, so if you lose
              the link we cannot send it again.
            </p>
            <div className="mt-3">
              <UrlLine label="Your edit link" value={editUrl} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyButton value={editUrl} label="Copy edit link" />
              <Button asChild size="sm">
                <a href={editUrl}>
                  Open my Krew ID
                  <ArrowRight className="size-4" aria-hidden />
                </a>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-border p-4">
            <UrlLine label="Your Krew3 profile" value={publicUrl} />
            <p className="mt-1.5 text-sm text-muted-foreground">
              {reserved
                ? "This handle is reserved by a Krew3 route, so ask an admin to change it."
                : "This is where your profile lives once it is approved. It 404s until then."}
            </p>
            <div className="mt-3">
              <CopyButton value={publicUrl} label="Copy profile link" />
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-2xl border-2 border-border bg-background p-4 text-sm text-muted-foreground">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>Keep the edit link to yourself. Anyone holding it can change your profile.</p>
          </div>

          <Button asChild variant="ghost" className="w-full">
            <Link to="/">Back to Krew3</Link>
          </Button>
        </div>
      </OffsetCard>
    </div>
  );
}

function ClaimKrewIdRoute() {
  const [draft, setDraft] = useState<KrewProfileDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [claimed, setClaimed] = useState<KrewClaimResult | null>(null);
  /**
   * Remount key for the form. Bumped only to drop a dead upload ticket: the
   * form keeps the reserved path internally, and a ticket that expired while
   * the member was typing can never be reused.
   */
  const [formKey, setFormKey] = useState(0);
  /** Honeypot. A real browser leaves this hidden field empty. */
  const [honeypot, setHoneypot] = useState("");

  if (!isSupabaseConfigured()) return <UnavailableNotice />;

  const handleSave = (avatar: FormAvatar | null) => {
    const invalid = validateProfileDraft(draft);
    if (invalid) {
      setError(invalid);
      return;
    }

    setSaving(true);
    setError("");
    claimKrewId(draft, avatar, honeypot)
      .then((result) => setClaimed(result))
      .catch((cause: unknown) => {
        if (isExpiredUploadError(cause)) setFormKey((k) => k + 1);
        setError(cause instanceof Error ? cause.message : "Could not claim that Krew ID.");
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className="grid-paper px-4 py-10 sm:px-6 sm:py-14">
      {claimed ? (
        <ClaimSuccess claimed={claimed} />
      ) : (
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-6 text-center">
            <SectionLabel dot={false} className="justify-center">
              KREW ID
            </SectionLabel>
            <h1 className="mt-2 text-[clamp(1.6rem,6vw,2.4rem)] leading-[0.95] font-extrabold tracking-tight">
              Claim your handle.
            </h1>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              No account, no email. Fill this in and we&apos;ll give you an edit link — then a Krew3
              admin reviews it before it goes live.
            </p>
          </div>

          <OffsetCard className="p-6">
            <KrewProfileForm
              key={formKey}
              draft={draft}
              onChange={(patch) => {
                setDraft((current) => ({ ...current, ...patch }));
                setError("");
              }}
              lockedUsername={false}
              saving={saving}
              onUploadAvatar={uploadClaimAvatar}
              submitLabel="Claim Krew ID"
              onSave={handleSave}
              error={error}
              success=""
            />

            <label htmlFor="krew-hp" className="sr-only" aria-hidden>
              Leave this field empty
            </label>
            <input
              id="krew-hp"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="sr-only"
            />
          </OffsetCard>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-foreground underline">
              Sign in
            </Link>{" "}
            to edit your Krew ID.
          </p>
        </div>
      )}
    </div>
  );
}
