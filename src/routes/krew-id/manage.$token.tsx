import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, Check, Copy, Eye, EyeOff, KeyRound, Pencil } from "lucide-react";
import { Button } from "@/components/Button";
import { OffsetCard } from "@/components/OffsetCard";
import { SectionLabel } from "@/components/SectionLabel";
import { KrewCardDownloads } from "@/components/krew-profile/KrewCardDownloads";
import { KrewCardPreview } from "@/components/krew-profile/KrewCardPreview";
import { KrewProfileForm, type FormAvatar } from "@/components/krew-profile/KrewProfileForm";
import { KrewProfileView } from "@/components/krew-profile/KrewProfileView";
import {
  draftFromManaged,
  fetchManagedProfile,
  isExpiredUploadError,
  publicProfileFromManaged,
  updateManagedProfile,
  uploadClaimAvatar,
} from "@/lib/krew-claim";
import {
  STATUS_LABELS,
  emptyDraft,
  isPubliclyVisible,
  profilePathLabel,
  profileUrl,
  validateProfileDraft,
  type KrewProfileDraft,
} from "@/lib/krew-profile";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { ManagedKrewProfile } from "@/lib/supabase/types";

/**
 * Token-managed Krew ID: /krew-id/manage/$token
 *
 * The token in the URL is the only credential, so this page reads and writes
 * entirely from the browser: the token is hashed by the RPC and never reaches
 * a server function, a loader or storage. It is deliberately not indexable and
 * not shareable.
 */
export const Route = createFileRoute("/krew-id/manage/$token")({
  head: () => ({
    meta: [
      { title: "Manage your Krew ID | Krew3" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
  component: ManageKrewIdRoute,
});

function UnavailableNotice() {
  return (
    <div className="grid-paper flex min-h-[70vh] items-center justify-center px-4">
      <OffsetCard size="lg" className="max-w-md p-8 text-center">
        <SectionLabel dot={false} className="justify-center">
          KREW ID
        </SectionLabel>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">
          We can&apos;t reach the Krew.
        </h1>
        <p className="mt-2 text-muted-foreground">
          Please try opening your edit link again in a moment.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/">Back to Krew3</Link>
        </Button>
      </OffsetCard>
    </div>
  );
}

function InvalidToken() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 text-center">
        <SectionLabel dot={false} className="justify-center">
          KREW ID
        </SectionLabel>
        <h1 className="mt-2 text-[clamp(1.5rem,6vw,2.2rem)] leading-[0.95] font-extrabold tracking-tight">
          That edit link isn&apos;t valid.
        </h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Edit links are single secrets and cannot be recovered. If you lost yours, claim the handle
          again and a Krew3 admin can sort it out.
        </p>
      </div>
      <OffsetCard className="flex flex-wrap justify-center gap-2 p-6">
        <Button asChild size="lg">
          <Link to="/krew-id">Claim a Krew ID</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/">Back to Krew3</Link>
        </Button>
      </OffsetCard>
    </div>
  );
}

function ManageKrewIdRoute() {
  const { token } = Route.useParams();
  const [row, setRow] = useState<ManagedKrewProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [draft, setDraft] = useState<KrewProfileDraft>(emptyDraft);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  /** Krew Card preview is opt-in so the editor stays compact on a phone. */
  const [showCard, setShowCard] = useState(false);
  /** Remount key, bumped only to discard a dead upload ticket. */
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");

    fetchManagedProfile(token)
      .then((found) => {
        if (!active) return;
        if (found) setDraft(draftFromManaged(found));
        setRow(found);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setLoadError(
          cause instanceof Error ? cause.message : "Could not open that management link.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  if (!isSupabaseConfigured()) return <UnavailableNotice />;

  if (loading) {
    return (
      <div className="grid-paper px-4 py-10 sm:px-6 sm:py-14">
        <div
          role="status"
          aria-live="polite"
          className="flex min-h-[50vh] items-center justify-center"
        >
          <span className="label-mono text-muted-foreground">Opening your Krew ID…</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="grid-paper px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto w-full max-w-2xl">
          <OffsetCard className="p-8 text-center">
            <div
              role="alert"
              className="mx-auto flex max-w-md items-start gap-2 text-left text-sm font-medium text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {loadError}
            </div>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/krew-id">Claim a Krew ID</Link>
            </Button>
          </OffsetCard>
        </div>
      </div>
    );
  }

  if (!row) return <InvalidToken />;

  const isLive = isPubliclyVisible(row);
  const publicUrl = profileUrl(row.username);
  const publicProfile = publicProfileFromManaged(row);

  const copyProfileUrl = () => {
    void navigator.clipboard
      .writeText(publicUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setError("Could not copy. Select the address manually."));
  };

  const handleSave = (avatar: FormAvatar | null) => {
    const invalid = validateProfileDraft(draft);
    if (invalid) {
      setError(invalid);
      return;
    }

    setSaving(true);
    setError("");
    updateManagedProfile(token, draft, avatar)
      .then((updated) => {
        setRow(updated);
        setDraft(draftFromManaged(updated));
        setEditing(false);
        setSuccess("Saved.");
      })
      .catch((cause: unknown) => {
        if (isExpiredUploadError(cause)) setFormKey((k) => k + 1);
        setError(cause instanceof Error ? cause.message : "Could not save your profile.");
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className="grid-paper px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <SectionLabel dot={false}>KREW ID</SectionLabel>
            <h1 className="mt-2 text-[clamp(1.6rem,6vw,2.4rem)] leading-[0.95] font-extrabold tracking-tight">
              {row.display_name}
            </h1>
            <p className="mt-1 text-muted-foreground">{profilePathLabel(row.username)}</p>
          </div>

          <span
            className={
              isLive
                ? "rounded-full border-2 border-border bg-primary px-3 py-1 font-mono text-xs font-bold text-primary-foreground"
                : "rounded-full border-2 border-border bg-background px-3 py-1 font-mono text-xs font-bold text-muted-foreground"
            }
          >
            {isLive ? "Live" : STATUS_LABELS[row.status]}
          </span>
        </div>

        <OffsetCard className="mb-6 flex items-start gap-2 p-4 text-sm text-muted-foreground">
          <KeyRound className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            You&apos;re editing through a private link. Anyone who has it can change this profile,
            so don&apos;t post or forward it.
          </p>
        </OffsetCard>

        {!isLive && (
          <OffsetCard className="mb-6 p-5">
            <SectionLabel dot={false}>Not public yet</SectionLabel>
            <p className="mt-2 text-sm text-muted-foreground">
              Your Krew ID exists and is saved, but it stays out of the public feed until a Krew3
              admin approves it.{" "}
              {row.status === "revoked"
                ? "This profile was revoked, so contact an admin if you think that is a mistake."
                : "You can keep editing it in the meantime."}
            </p>
          </OffsetCard>
        )}

        {editing ? (
          <OffsetCard className="p-6">
            <KrewProfileForm
              key={formKey}
              draft={draft}
              onChange={(patch) => {
                setDraft((current) => ({ ...current, ...patch }));
                setError("");
                setSuccess("");
              }}
              lockedUsername={row.status !== "pending"}
              ownUsername={row.username}
              saving={saving}
              onUploadAvatar={uploadClaimAvatar}
              onSave={handleSave}
              error={error}
              success={success}
            />

            <Button variant="ghost" size="sm" className="mt-4" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </OffsetCard>
        ) : (
          <>
            <KrewProfileView profile={publicProfile} />

            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="size-4" aria-hidden />
                Edit profile
              </Button>

              <Button variant="outline" onClick={copyProfileUrl}>
                {copied ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  <Copy className="size-4" aria-hidden />
                )}
                {copied ? "Copied" : "Copy profile link"}
              </Button>

              {isLive && (
                <Button asChild variant="outline">
                  <Link to="/$username" params={{ username: row.username }}>
                    View Profile
                  </Link>
                </Button>
              )}
            </div>

            {error && !editing && (
              <p role="alert" className="mt-4 text-sm font-semibold text-destructive">
                {error}
              </p>
            )}

            {/* Krew Card: built in the browser from the same public profile,
                so a token holder gets the card without ever creating an account. */}
            <div className="mt-8">
              <Button variant="ghost" size="sm" onClick={() => setShowCard((v) => !v)}>
                {showCard ? (
                  <EyeOff className="size-4" aria-hidden />
                ) : (
                  <Eye className="size-4" aria-hidden />
                )}
                {showCard ? "Hide Krew Card" : "Show Krew Card"}
              </Button>

              {showCard && (
                <>
                  <p className="mt-2 mb-4 text-sm text-muted-foreground">
                    Your QR encodes {profilePathLabel(row.username)} only. Downloads happen on this
                    device, so the card never contains your edit link.
                  </p>
                  <KrewCardPreview profile={publicProfile} />
                </>
              )}

              <KrewCardDownloads profile={publicProfile} />
            </div>

            {success && <p className="mt-4 text-sm text-muted-foreground">{success}</p>}
          </>
        )}
      </div>
    </div>
  );
}
