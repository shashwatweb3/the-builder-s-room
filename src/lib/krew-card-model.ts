import {
  KREW3_LOGO_SIZE,
  KREW3_LOGO_SRC,
  memberTypeLabel,
  normalizeHandle,
  profilePathLabel,
  type PublicKrewProfile,
} from "@/lib/krew-profile";

/**
 * Canonical origin for anything a member can download.
 *
 * Deliberately not window.location: a Krew Card exported from a staging or
 * localhost build must still resolve to the real public site, and the QR has
 * to keep working after the member changes their socials.
 */
export const KREW3_SITE_ORIGIN = "https://krew3.site";

/** The one and only thing encoded in the QR. */
export function krewCardUrl(username: string): string {
  return `${KREW3_SITE_ORIGIN}/${username}`;
}

/**
 * Everything the card, wallpaper and print PDF draw, derived from a profile.
 *
 * Both the on-screen preview (KrewCardPreview) and the canvas renderers in
 * krew-card-render.ts read this, so an export can never drift from the layout
 * shown on /profile/card.
 */
export interface KrewCardModel {
  username: string;
  /** Absolute URL encoded in the QR. */
  url: string;
  /** Human-readable form printed beside the QR: krew3.site/<username>. */
  pathLabel: string;
  displayName: string;
  typeLabel: string | null;
  bio: string | null;
  bestWorkTitle: string | null;
  avatarUrl: string | null;
  logoSrc: string;
  logoWidth: number;
  logoHeight: number;
  /** De-duplicated, ordered list of X / Telegram / website lines. */
  connections: string[];
}

/**
 * Only the public projection is needed, so both the authenticated
 * /profile/card route and the token-only /krew-id/manage/$token page can build
 * an identical card from a profile they already hold.
 */
export function buildKrewCardModel(profile: PublicKrewProfile): KrewCardModel {
  const connections = [
    profile.x_handle ? `X @${normalizeHandle(profile.x_handle)}` : null,
    profile.telegram_handle ? `Telegram @${normalizeHandle(profile.telegram_handle)}` : null,
    profile.website_url ? profile.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "") : null,
  ].filter((v): v is string => v !== null && v.length > 0);

  return {
    username: profile.username,
    url: krewCardUrl(profile.username),
    pathLabel: profilePathLabel(profile.username),
    displayName: profile.display_name,
    typeLabel: memberTypeLabel(profile.member_type),
    bio: profile.bio?.trim() ? profile.bio.trim() : null,
    bestWorkTitle: profile.best_work_title?.trim() ? profile.best_work_title.trim() : null,
    avatarUrl: profile.avatar_url,
    logoSrc: KREW3_LOGO_SRC,
    logoWidth: KREW3_LOGO_SIZE.width,
    logoHeight: KREW3_LOGO_SIZE.height,
    connections,
  };
}

/** File name stem shared by every export, e.g. "krew-card-testpal". */
export function cardFileStem(model: KrewCardModel): string {
  return `krew-card-${model.username}`;
}
