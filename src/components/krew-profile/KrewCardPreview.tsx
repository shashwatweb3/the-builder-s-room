import { KrewQrCode } from "@/components/krew-profile/KrewQrCode";
import { buildKrewCardModel } from "@/lib/krew-card-model";
import { KREW3_LOGO_SIZE, KREW3_LOGO_SRC, type PublicKrewProfile } from "@/lib/krew-profile";

/**
 * Krew Card composition.
 *
 * Rendered responsively on /profile/card and /krew-id/manage/$token and driven
 * by the same KrewCardModel as the Phase 2 exports (PNG, 1080x1920 wallpaper,
 * A6 print PDF), so what a member downloads matches what they see here. Kept
 * free of download logic.
 */
export function KrewCardPreview({ profile }: { profile: PublicKrewProfile }) {
  const model = buildKrewCardModel(profile);

  return (
    <div className="mx-auto w-full max-w-[380px]">
      <div className="overflow-hidden rounded-3xl border-2 border-border bg-card shadow-offset-lg">
        <div className="flex items-center justify-between gap-3 border-b-2 border-border bg-lavender/40 px-5 py-3.5">
          <span className="flex items-center gap-2">
            <span className="grid size-7 place-items-center overflow-hidden rounded-lg border-2 border-border bg-primary">
              <img
                src={KREW3_LOGO_SRC}
                alt=""
                width={KREW3_LOGO_SIZE.width}
                height={KREW3_LOGO_SIZE.height}
                className="size-full object-cover"
              />
            </span>
            <span className="font-extrabold tracking-tight">Krew3</span>
          </span>
          <span className="label-mono text-muted-foreground">Krew Card</span>
        </div>

        <div className="px-5 py-6">
          <div className="flex items-start gap-4">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-border bg-lavender/40">
              {model.avatarUrl ? (
                <img
                  src={model.avatarUrl}
                  alt=""
                  width={64}
                  height={64}
                  className="size-full object-cover"
                />
              ) : (
                <img
                  src={KREW3_LOGO_SRC}
                  alt=""
                  width={KREW3_LOGO_SIZE.width}
                  height={KREW3_LOGO_SIZE.height}
                  className="size-full object-cover"
                />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="text-xl leading-tight font-extrabold tracking-tight break-words">
                {model.displayName}
              </h2>
              <p className="label-mono mt-1 text-muted-foreground">@{model.username}</p>
              {model.typeLabel && (
                <p className="label-mono mt-2 inline-block rounded-full border-2 border-border bg-primary px-2.5 py-0.5 text-primary-foreground">
                  {model.typeLabel}
                </p>
              )}
            </div>
          </div>

          {model.bio && <p className="mt-4 text-[0.95rem] leading-snug break-words">{model.bio}</p>}

          {model.bestWorkTitle && (
            <div className="mt-4">
              <p className="label-mono text-muted-foreground">Best work</p>
              <p className="mt-1 font-semibold break-words">{model.bestWorkTitle}</p>
            </div>
          )}

          {model.connections.length > 0 && (
            <ul className="mt-4 flex flex-col gap-1.5">
              {model.connections.map((c) => (
                <li key={c} className="label-mono truncate text-muted-foreground">
                  {c}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 flex items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-background p-3">
            <div className="grid size-24 shrink-0 place-items-center rounded-lg border-2 border-border bg-white p-1">
              <KrewQrCode value={model.url} size={88} className="size-full" foreground="#2a2930" />
            </div>
            <div className="min-w-0">
              <p className="label-mono font-bold">SCAN TO CONNECT</p>
              <p className="mt-1 font-mono text-xs break-all text-muted-foreground">
                {model.pathLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
