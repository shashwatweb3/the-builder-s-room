import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Copy, Globe, Send, Share2 } from "lucide-react";
import { SectionLabel } from "@/components/SectionLabel";
import { krewCardUrl } from "@/lib/krew-card-model";
import {
  KREW3_LOGO_SIZE,
  KREW3_LOGO_SRC,
  memberTypeLabel,
  normalizeHandle,
  profilePathLabel,
  telegramUrl,
  xUrl,
  type PublicKrewProfile,
} from "@/lib/krew-profile";

/**
 * The public Krew identity card rendered on /$username.
 * Only ever receives the intentionally public columns.
 */
export function KrewProfileView({ profile }: { profile: PublicKrewProfile }) {
  const typeLabel = memberTypeLabel(profile.member_type);

  const links = [
    profile.x_handle
      ? {
          label: "X",
          handle: `@${normalizeHandle(profile.x_handle)}`,
          href: xUrl(profile.x_handle),
        }
      : null,
    profile.telegram_handle
      ? {
          label: "Telegram",
          handle: `@${normalizeHandle(profile.telegram_handle)}`,
          href: telegramUrl(profile.telegram_handle),
        }
      : null,
    profile.website_url
      ? {
          label: "Website",
          handle: profile.website_url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
          href: profile.website_url,
        }
      : null,
  ].filter((l): l is { label: string; handle: string; href: string } => l !== null);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <article className="overflow-hidden rounded-3xl border-2 border-border bg-card shadow-offset-lg">
        {/* Masthead */}
        <div className="flex items-center justify-between gap-3 border-b-2 border-border bg-lavender/40 px-5 py-4 sm:px-8">
          <span className="flex items-center gap-2">
            <span className="grid size-8 place-items-center overflow-hidden rounded-lg border-2 border-border bg-primary shadow-offset-sm">
              <img
                src={KREW3_LOGO_SRC}
                alt=""
                width={KREW3_LOGO_SIZE.width}
                height={KREW3_LOGO_SIZE.height}
                className="size-full object-cover"
              />
            </span>
            <span className="text-lg font-extrabold tracking-tight">Krew3</span>
          </span>

          <span className="flex items-center gap-2">
            <span className="label-mono hidden items-center gap-1.5 rounded-full border-2 border-border bg-surface px-2.5 py-1 sm:flex">
              <Check className="size-3" aria-hidden />
              Krew3 member
            </span>

            <KrewShareButton username={profile.username} displayName={profile.display_name} />
          </span>
        </div>

        <div className="px-5 py-7 sm:px-8 sm:py-9">
          {/* Identity */}
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-border bg-lavender/40 shadow-offset-sm sm:size-24">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  width={96}
                  height={96}
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

            <div className="min-w-0 flex-1">
              <h1 className="text-[clamp(1.6rem,7vw,2.6rem)] leading-[0.95] font-extrabold tracking-tight break-words">
                {profile.display_name}
              </h1>
              <p className="label-mono mt-2 text-muted-foreground">@{profile.username}</p>
              {typeLabel && (
                <p className="label-mono mt-3 inline-block rounded-full border-2 border-border bg-primary px-3 py-1 text-primary-foreground">
                  {typeLabel}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-6 max-w-prose text-lg leading-snug break-words">{profile.bio}</p>
          )}

          {/* Krew ID */}
          <div className="mt-7 rounded-2xl border-2 border-border bg-background px-4 py-3">
            <SectionLabel dot={false}>{profilePathLabel(profile.username)}</SectionLabel>
          </div>

          {/* Best work */}
          {(profile.best_work_title || profile.best_work_url) && (
            <div className="mt-6">
              <SectionLabel>Best work</SectionLabel>
              <div className="mt-3 rounded-2xl border-2 border-border bg-background p-4">
                {profile.best_work_url ? (
                  <a
                    href={profile.best_work_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="-m-2 flex min-h-11 items-center gap-1.5 rounded-xl p-2 font-semibold underline decoration-2 underline-offset-4 transition-colors hover:bg-muted"
                  >
                    {profile.best_work_title ?? profile.best_work_url}
                    <ArrowUpRight className="size-4 shrink-0" aria-hidden />
                  </a>
                ) : (
                  <p className="font-semibold">{profile.best_work_title}</p>
                )}
              </div>
            </div>
          )}

          {/* Connections */}
          <div className="mt-7">
            <SectionLabel>Connect</SectionLabel>

            {links.length === 0 ? (
              <p className="mt-3 text-muted-foreground">
                This member hasn&apos;t added a way to connect yet.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {links.map((link) => {
                  const Icon =
                    link.label === "Telegram" ? Send : link.label === "Website" ? Globe : X;
                  return (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="press flex items-center justify-between gap-3 rounded-2xl border-2 border-border bg-background px-4 py-3 transition-colors hover:bg-lavender/40"
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <Icon className="size-4 shrink-0" aria-hidden />
                          <span className="font-semibold">{link.label}</span>
                          <span className="truncate text-sm text-muted-foreground">
                            {link.handle}
                          </span>
                        </span>
                        <ArrowUpRight className="size-4 shrink-0" aria-hidden />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-border bg-background px-5 py-4 sm:px-8">
          <p className="label-mono text-muted-foreground">
            Scan to connect · not a community. a krew.
          </p>
        </div>
      </article>
    </div>
  );
}

/**
 * Share this Krew ID.
 *
 * Uses the same canonical URL the Krew Card QR encodes, so a shared link and a
 * scanned card always land on the same public page. Phones get the native share
 * sheet; everywhere else the URL is copied. Nothing about the profile beyond
 * its public fields is shared, and the URL is only ever the public path.
 */
function KrewShareButton({ username, displayName }: { username: string; displayName: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state !== "copied") return;
    const timer = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  const share = async () => {
    const url = krewCardUrl(username);

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} on Krew3`,
          text: `${displayName} is a Krew3 member.`,
          url,
        });
        return;
      } catch (cause) {
        // A cancelled share sheet is not an error worth reporting.
        if (cause instanceof DOMException && cause.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState("failed");
    }
  };

  return (
    <button
      type="button"
      onClick={() => void share()}
      aria-live="polite"
      className="press label-mono flex items-center gap-1.5 rounded-full border-2 border-border bg-background px-2.5 py-1 font-bold transition-colors hover:bg-lavender/40"
    >
      {state === "copied" ? (
        <Check className="size-3" aria-hidden />
      ) : state === "failed" ? (
        <Copy className="size-3" aria-hidden />
      ) : (
        <Share2 className="size-3" aria-hidden />
      )}
      {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Share"}
    </button>
  );
}

/** Inline X glyph so the connection row does not depend on an icon package. */
function X(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
