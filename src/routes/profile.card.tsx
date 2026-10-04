import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/Button";
import { OffsetCard } from "@/components/OffsetCard";
import { SectionLabel } from "@/components/SectionLabel";
import { KrewCardDownloads } from "@/components/krew-profile/KrewCardDownloads";
import { KrewCardPreview } from "@/components/krew-profile/KrewCardPreview";
import { fetchOwnProfile, useMemberSession } from "@/lib/member-auth";
import { profilePathLabel, type KrewProfile } from "@/lib/krew-profile";

export const Route = createFileRoute("/profile/card")({
  head: () => ({
    meta: [{ title: "Krew Card | Krew3" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: KrewCardRoute,
});

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

function KrewCardRoute() {
  const navigate = useNavigate();
  const { user, loading: authLoading, configured } = useMemberSession();
  const [profile, setProfile] = useState<KrewProfile | null>(null);
  /**
   * False until the first profile fetch settles. Without it a member who
   * already has a Krew ID would be told "No Krew ID yet" while the RPC ran.
   */
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    if (authLoading || !configured) return;
    if (!user) void navigate({ to: "/login" });
  }, [authLoading, configured, user, navigate]);

  useEffect(() => {
    if (!user) return;
    setProfileReady(false);
    void fetchOwnProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setProfileReady(true));
  }, [user]);

  if (!configured) return <NotConfiguredNotice />;

  if (authLoading || !profileReady) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4">
        <p className="label-mono text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="grid-paper flex min-h-[70vh] items-center justify-center px-4">
        <OffsetCard size="lg" className="max-w-md p-8 text-center">
          <SectionLabel dot={false} className="justify-center">
            KREW CARD
          </SectionLabel>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight">No Krew ID yet.</h1>
          <p className="mt-2 text-muted-foreground">
            Create your profile first, then come back for your card.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/profile">Create My Krew ID</Link>
          </Button>
        </OffsetCard>
      </div>
    );
  }

  return (
    <div className="grid-paper px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
          <Link to="/profile">
            <ArrowLeft className="size-4" aria-hidden />
            Back to your Krew ID
          </Link>
        </Button>

        <div className="mb-6 text-center">
          <SectionLabel dot={false} className="justify-center">
            KREW CARD
          </SectionLabel>
          <h1 className="mt-2 text-[clamp(1.6rem,6vw,2.4rem)] leading-[0.95] font-extrabold tracking-tight">
            Scan to connect.
          </h1>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Your QR encodes {profilePathLabel(profile.username)} only, so the card keeps working
            even if you change your socials later.
          </p>
        </div>

        <KrewCardPreview profile={profile} />

        <KrewCardDownloads profile={profile} />
      </div>
    </div>
  );
}
