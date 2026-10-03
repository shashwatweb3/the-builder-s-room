import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Image as ImageIcon, Printer } from "lucide-react";
import { Button } from "@/components/Button";
import { OffsetCard } from "@/components/OffsetCard";
import { SectionLabel } from "@/components/SectionLabel";
import { KrewCardPreview } from "@/components/krew-profile/KrewCardPreview";
import { buildKrewCardModel } from "@/lib/krew-card-model";
import {
  cardFileName,
  downloadBlob,
  renderKrewCardA6Pdf,
  renderKrewCardPng,
  renderKrewWallpaperPng,
} from "@/lib/krew-card-render";
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
  const [busy, setBusy] = useState<"card" | "wallpaper" | "print" | null>(null);
  const [exportError, setExportError] = useState("");
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

  /** Renders the selected format off-screen and hands it to the browser. */
  const run = async (kind: "card" | "wallpaper" | "print") => {
    if (!profile || busy) return;
    setBusy(kind);
    setExportError("");
    try {
      const model = buildKrewCardModel(profile);
      if (kind === "card") {
        downloadBlob(await renderKrewCardPng(model), cardFileName(model, "png"));
      } else if (kind === "wallpaper") {
        downloadBlob(await renderKrewWallpaperPng(model), cardFileName(model, "png", "-wallpaper"));
      } else {
        downloadBlob(await renderKrewCardA6Pdf(model), cardFileName(model, "pdf"));
      }
    } catch (cause) {
      setExportError(
        cause instanceof Error ? cause.message : "Could not build that download. Please retry.",
      );
    } finally {
      setBusy(null);
    }
  };

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

        <OffsetCard className="mt-6 p-5">
          <SectionLabel dot={false}>Download</SectionLabel>
          <p className="mt-2 text-sm text-muted-foreground">
            Every format below carries the same QR, which encodes{" "}
            {profilePathLabel(profile.username)} only. Nothing is generated on a server and the code
            never expires.
          </p>

          {exportError && (
            <p role="alert" className="mt-3 text-sm font-semibold text-destructive">
              {exportError}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" disabled={busy !== null} onClick={() => void run("card")}>
              <Download className="size-4" aria-hidden />
              {busy === "card" ? "Preparing…" : "Download Card"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() => void run("wallpaper")}
            >
              <ImageIcon className="size-4" aria-hidden />
              {busy === "wallpaper" ? "Preparing…" : "Phone Wallpaper"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() => void run("print")}
            >
              <Printer className="size-4" aria-hidden />
              {busy === "print" ? "Preparing…" : "Print Card"}
            </Button>
          </div>

          <p className="label-mono mt-4 text-muted-foreground">
            PNG 1080&times;1520 &middot; Wallpaper 1080&times;1920 &middot; PDF A6 105&times;148mm
          </p>
        </OffsetCard>
      </div>
    </div>
  );
}
