import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Copy, LogOut, Pencil, QrCode } from "lucide-react";
import { Button } from "@/components/Button";
import { OffsetCard } from "@/components/OffsetCard";
import { SectionLabel } from "@/components/SectionLabel";
import { KrewProfileForm } from "@/components/krew-profile/KrewProfileForm";
import { KrewProfileView } from "@/components/krew-profile/KrewProfileView";
import { createProfile, fetchOwnProfile, updateProfile, useMemberSession } from "@/lib/member-auth";
import {
  BIO_MAX,
  DISPLAY_NAME_MAX,
  STATUS_LABELS,
  draftFromProfile,
  draftToRow,
  emptyDraft,
  isPubliclyVisible,
  isValidHttpUrl,
  profilePathLabel,
  profileUrl,
  validateUsername,
  type KrewProfile,
  type KrewProfileDraft,
} from "@/lib/krew-profile";

export const Route = createFileRoute("/profile/")({
  head: () => ({
    meta: [{ title: "Krew ID | Krew3" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: ProfileRoute,
});

/** Client-side gate. The database remains the authority on every write. */
function validateDraft(draft: KrewProfileDraft): string {
  const username = validateUsername(draft.username);
  if (!username.ok) return username.error;

  if (!draft.display_name.trim()) return "Add your name.";
  if (draft.display_name.trim().length > DISPLAY_NAME_MAX)
    return `Keep your name under ${DISPLAY_NAME_MAX} characters.`;

  if (!draft.bio.trim()) return "Add a short bio so people know who you are.";
  if (draft.bio.trim().length > BIO_MAX) return `Keep your bio under ${BIO_MAX} characters.`;

  const connections = [draft.x_handle, draft.telegram_handle, draft.website_url].filter((v) =>
    v.trim(),
  );
  if (connections.length === 0) return "Add at least one way to connect: X, Telegram or a website.";

  if (draft.website_url.trim() && !isValidHttpUrl(draft.website_url))
    return "That website link doesn't look like a valid URL.";
  if (draft.best_work_url.trim() && !isValidHttpUrl(draft.best_work_url))
    return "That best work link doesn't look like a valid URL.";

  return "";
}

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center px-4">
      <p className="label-mono text-muted-foreground">Loading…</p>
    </div>
  );
}

function NotConfiguredNotice() {
  return (
    <div className="grid-paper flex min-h-[70vh] items-center justify-center px-4">
      <OffsetCard size="lg" className="max-w-md p-8 text-center">
        <SectionLabel dot={false} className="justify-center">
          KREW ID
        </SectionLabel>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Sign-in is unavailable.</h1>
        <p className="mt-2 text-muted-foreground">
          Member accounts can&apos;t be reached right now. Please try again in a moment.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/">Back to Krew3</Link>
        </Button>
      </OffsetCard>
    </div>
  );
}

function ProfileRoute() {
  const navigate = useNavigate();
  const { user, loading: authLoading, configured, signOut } = useMemberSession();
  const [profile, setProfile] = useState<KrewProfile | null>(null);
  /**
   * False until the first profile fetch settles. Without it a returning member
   * with an existing Krew ID would be shown the "Claim your handle" form for as
   * long as the RPC took to answer.
   */
  const [profileReady, setProfileReady] = useState(false);
  const [draft, setDraft] = useState<KrewProfileDraft>(emptyDraft);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (authLoading || !configured) return;
    if (!user) void navigate({ to: "/login" });
  }, [authLoading, configured, user, navigate]);

  useEffect(() => {
    if (!user) return;
    setProfileReady(false);
    void fetchOwnProfile()
      .then((own) => {
        setProfile(own);
        if (own) setDraft(draftFromProfile(own));
      })
      .catch(() => setProfile(null))
      .finally(() => setProfileReady(true));
  }, [user]);

  if (!configured) return <NotConfiguredNotice />;

  if (authLoading || !profileReady) return <LoadingState />;

  // Shared by the dashboard and the onboarding form so a member can always
  // leave, whether or not they have finished creating their Krew ID.
  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: "/login" });
  };

  if (!profile) {
    // Onboarding: there is no Krew ID yet, so the editor doubles as the sign-up form.
    return (
      <div className="grid-paper px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-6 text-center">
            <SectionLabel dot={false} className="justify-center">
              KREW ID
            </SectionLabel>
            <h1 className="mt-2 text-[clamp(1.6rem,6vw,2.4rem)] leading-[0.95] font-extrabold tracking-tight">
              Claim your handle.
            </h1>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              This becomes your permanent Krew3 identity. A Krew3 admin reviews every new profile
              before it goes live.
            </p>
          </div>

          <OffsetCard className="p-6">
            <KrewProfileForm
              draft={draft}
              onChange={(patch) => {
                setDraft((current) => ({ ...current, ...patch }));
                setError("");
                setSuccess("");
              }}
              userId={user?.id ?? ""}
              lockedUsername={false}
              saving={saving}
              error={error}
              success={success}
              onSave={() => {
                const invalid = validateDraft(draft);
                if (invalid) {
                  setError(invalid);
                  return;
                }
                if (!user) return;

                setSaving(true);
                setError("");
                createProfile(user.id, draftToRow(draft))
                  .then((created) => {
                    setProfile(created);
                    setDraft(draftFromProfile(created));
                    setSuccess("Krew ID created. It's pending review.");
                  })
                  .catch((cause: unknown) =>
                    setError(cause instanceof Error ? cause.message : "Could not create profile."),
                  )
                  .finally(() => setSaving(false));
              }}
            />
          </OffsetCard>

          <div className="mt-6 flex justify-center">
            <Button variant="ghost" size="sm" onClick={() => void handleSignOut()}>
              <LogOut className="size-4" aria-hidden />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isLive = isPubliclyVisible(profile);
  const { username } = profile;

  const copyProfileUrl = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl(username));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy. Select the address manually.");
    }
  };

  return (
    <div className="grid-paper px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <SectionLabel dot={false}>KREW ID</SectionLabel>
            <h1 className="mt-2 text-[clamp(1.6rem,6vw,2.4rem)] leading-[0.95] font-extrabold tracking-tight">
              {profile.display_name}
            </h1>
            <p className="mt-1 text-muted-foreground">{profilePathLabel(profile.username)}</p>
          </div>

          <span
            className={
              isLive
                ? "rounded-full border-2 border-border bg-primary px-3 py-1 font-mono text-xs font-bold text-primary-foreground"
                : "rounded-full border-2 border-border bg-background px-3 py-1 font-mono text-xs font-bold text-muted-foreground"
            }
          >
            {isLive ? "Live" : STATUS_LABELS[profile.status]}
          </span>
        </div>

        {!isLive && (
          <OffsetCard className="mb-6 p-5">
            <SectionLabel dot={false}>Not public yet</SectionLabel>
            <p className="mt-2 text-sm text-muted-foreground">
              Your Krew ID exists and is saved, but it stays out of the public feed until a Krew3
              admin approves it.{" "}
              {profile.status === "revoked"
                ? "This profile was revoked, so contact an admin if you think that is a mistake."
                : "You can keep editing it in the meantime."}
            </p>
          </OffsetCard>
        )}

        {editing ? (
          <OffsetCard className="p-6">
            <KrewProfileForm
              draft={draft}
              onChange={(patch) => {
                setDraft((current) => ({ ...current, ...patch }));
                setError("");
                setSuccess("");
              }}
              userId={profile.user_id}
              lockedUsername={profile.status !== "pending"}
              saving={saving}
              error={error}
              success={success}
              onSave={() => {
                const invalid = validateDraft(draft);
                if (invalid) {
                  setError(invalid);
                  return;
                }

                setSaving(true);
                setError("");
                updateProfile(profile.username, draftToRow(draft))
                  .then((updated) => {
                    setProfile(updated);
                    setDraft(draftFromProfile(updated));
                    setEditing(false);
                    setSuccess("Saved.");
                  })
                  .catch((cause: unknown) =>
                    setError(cause instanceof Error ? cause.message : "Could not save profile."),
                  )
                  .finally(() => setSaving(false));
              }}
            />

            <Button variant="ghost" size="sm" className="mt-4" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </OffsetCard>
        ) : (
          <>
            <KrewProfileView profile={profile} />

            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="size-4" aria-hidden />
                Edit profile
              </Button>

              <Button variant="outline" onClick={() => void copyProfileUrl()}>
                <Copy className="size-4" aria-hidden />
                {copied ? "Copied" : "Copy profile link"}
              </Button>

              {isLive && (
                <Button asChild variant="outline">
                  <Link to="/$username" params={{ username: profile.username }}>
                    View Profile
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              )}

              <Button asChild variant="outline">
                <Link to="/profile/card">
                  <QrCode className="size-4" aria-hidden />
                  Krew Card
                </Link>
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  void handleSignOut();
                }}
              >
                <LogOut className="size-4" aria-hidden />
                Sign out
              </Button>
            </div>

            {success && <p className="mt-4 text-sm text-muted-foreground">{success}</p>}
          </>
        )}
      </div>
    </div>
  );
}
