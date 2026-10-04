import { useState } from "react";
import { Download, Image as ImageIcon, Printer } from "lucide-react";
import { Button } from "@/components/Button";
import { OffsetCard } from "@/components/OffsetCard";
import { SectionLabel } from "@/components/SectionLabel";
import { buildKrewCardModel } from "@/lib/krew-card-model";
import {
  cardFileName,
  downloadBlob,
  renderKrewCardA6Pdf,
  renderKrewCardPng,
  renderKrewWallpaperPng,
} from "@/lib/krew-card-render";
import { profilePathLabel, type PublicKrewProfile } from "@/lib/krew-profile";

type ExportKind = "card" | "wallpaper" | "print";

/**
 * Card / wallpaper / A6 print downloads.
 *
 * Shared by the authenticated /profile/card route and the token-only
 * /krew-id/manage/$token page so both produce byte-identical exports from the
 * same KrewCardModel. Rendering happens in the member's own browser: nothing
 * is uploaded, and no token or management URL can leak into a file because the
 * model only ever holds public fields.
 */
export function KrewCardDownloads({ profile }: { profile: PublicKrewProfile }) {
  const [busy, setBusy] = useState<ExportKind | null>(null);
  const [exportError, setExportError] = useState("");

  /** Renders the selected format off-screen and hands it to the browser. */
  const run = async (kind: ExportKind) => {
    if (busy) return;
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

  return (
    <OffsetCard className="mt-6 p-5">
      <SectionLabel dot={false}>Download</SectionLabel>
      <p className="mt-2 text-sm text-muted-foreground">
        Every format below carries the same QR, which encodes {profilePathLabel(profile.username)}{" "}
        only. Nothing is generated on a server and the code never expires.
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
  );
}
