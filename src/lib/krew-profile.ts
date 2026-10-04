/**
 * Krew3 member profiles ("Krew ID").
 *
 * Shared by the member editor (/profile), the public profile route
 * (/$username) and admin review (/admin/members).
 *
 * Visibility rule, enforced by RLS in 019_krew_profiles.sql:
 * a profile is public only when status = 'approved' AND is_public = true.
 */

/**
 * Canonical Krew3 logo, served from public/assets like the other brand marks
 * (bb-logo-light.svg, devcon-logo.webp). Kept as an absolute public path so it
 * needs no bundler import and works unchanged on Vercel.
 */
export const KREW3_LOGO_SRC = "/assets/krew3-logo.jpeg";

/** Intrinsic size of KREW3_LOGO_SRC; lets the browser reserve layout space. */
export const KREW3_LOGO_SIZE = { width: 640, height: 640 } as const;

/** Single primary member type, kept compact per the Krew3 member-type list. */
export const MEMBER_TYPES = [
  { value: "builder", label: "Builder" },
  { value: "creator", label: "Creator" },
  { value: "community", label: "Community" },
  { value: "designer", label: "Designer" },
  { value: "developer", label: "Developer" },
  { value: "founder", label: "Founder" },
  { value: "other", label: "Other" },
] as const;

export type MemberType = (typeof MEMBER_TYPES)[number]["value"];

export const MEMBER_TYPE_VALUES = MEMBER_TYPES.map((m) => m.value) as readonly string[];

export const KREW_PROFILE_STATUSES = ["pending", "approved", "revoked"] as const;
export type KrewProfileStatus = (typeof KREW_PROFILE_STATUSES)[number];

export const STATUS_LABELS: Record<KrewProfileStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  revoked: "Revoked",
};

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const DISPLAY_NAME_MAX = 80;
export const BIO_MAX = 200;
export const HANDLE_MAX = 40;
export const URL_MAX = 300;
export const BEST_WORK_TITLE_MAX = 120;

/** Mirrors krew_profiles_username_format in the migration. */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$/;

/**
 * Every top-level application route that must never resolve as a username.
 * Must stay in sync with krew_profiles_username_reserved in 019, and with the
 * real routes in src/routes.
 */
export const RESERVED_USERNAMES = [
  // core routes
  "events",
  "projects",
  "opportunities",
  "about",
  "admin",
  "profile",
  "login",
  "signup",
  "venues",
  "ambassadors",
  "builders",
  "contact",
  "guidelines",
  "room",
  "saved",
  "submit",
  // the public, no-signup claim entry point (also reserved in the database)
  "krew-id",
  // internal QA routes (src/routes/x-card-test*.tsx)
  "x-card-test",
  "x-card-test-2",
  // infrastructure + common words
  "api",
  "assets",
  "index",
  "home",
  "help",
  "support",
  "settings",
  "account",
  "members",
  "user",
  "users",
  "krew",
  "krews",
  "card",
  "cards",
  "new",
  "edit",
  "search",
  "404",
  "500",
  "static",
  "public",
  "www",
  "email",
  "sitemap",
  "robots",
] as const;

const RESERVED_SET = new Set<string>(RESERVED_USERNAMES);

/** Normalise user input to the canonical URL form: lowercase, trimmed. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Strip characters that can never appear in a URL slug. */
export function slugifyUsername(raw: string): string {
  return normalizeUsername(raw)
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isReservedUsername(username: string): boolean {
  return RESERVED_SET.has(normalizeUsername(username));
}

/**
 * Navigation entries that must only be shown to signed-in members.
 * A logged-out visitor sees none of these.
 */
export const MEMBER_NAV_ROUTES = ["/profile", "/profile/card"] as const;

export function isMemberNavRoute(to: string): boolean {
  return (MEMBER_NAV_ROUTES as readonly string[]).includes(to);
}

/**
 * The single "Krew ID" nav entry, resolved per audience.
 *
 * Members already have an account, so they go to their dashboard. A logged-out
 * visitor has nothing to sign in to, so they get the public claim page instead.
 * Resolved in one place so the desktop dropdown and the mobile sheet agree.
 */
export function krewIdNavLink(memberLinksVisible: boolean): {
  to: "/krew-id" | "/profile";
  label: string;
} {
  return memberLinksVisible
    ? { to: "/profile", label: "Krew ID" }
    : { to: "/krew-id", label: "Krew ID" };
}

export type UsernameValidation = { ok: true; username: string } | { ok: false; error: string };

/**
 * Client-side mirror of the database constraints. The database remains the
 * authority; this only saves the member a round trip.
 */
export function validateUsername(raw: string): UsernameValidation {
  const username = normalizeUsername(raw);

  if (!username) return { ok: false, error: "Pick a Krew ID." };
  if (username.length < USERNAME_MIN)
    return { ok: false, error: `At least ${USERNAME_MIN} characters.` };
  if (username.length > USERNAME_MAX)
    return { ok: false, error: `At most ${USERNAME_MAX} characters.` };
  if (!/^[a-z0-9-]+$/.test(username))
    return { ok: false, error: "Letters, numbers and hyphens only." };
  if (!USERNAME_PATTERN.test(username))
    return { ok: false, error: "Must start and end with a letter or number." };
  if (isReservedUsername(username))
    return { ok: false, error: "That one is a Krew3 route. Pick another." };

  return { ok: true, username };
}

/** Social handles accept @name or a bare name, and are stored without the @. */
export function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "");
}

export function isValidHttpUrl(raw: string): boolean {
  try {
    const url = new URL(raw.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Add a scheme if the member typed a bare domain, so links stay clickable. */
export function normalizeUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(value)) return `https://${value}`;
  return value;
}

/**
 * The only columns a public visitor is ever allowed to receive.
 *
 * These map 1:1 onto the `krew_profiles_public` view in
 * 019_krew_profiles.sql, which is the sole read path anonymous clients have.
 * Deliberately excludes user_id, status, is_public and all timestamps.
 */
export const PUBLIC_PROFILE_COLUMNS =
  "username, display_name, bio, avatar_url, member_type, x_handle, telegram_handle, website_url, best_work_title, best_work_url";

/** Columns the member editor may write. status/is_public stay admin-only. */
export const EDITABLE_PROFILE_COLUMNS = [
  "display_name",
  "bio",
  "avatar_url",
  "member_type",
  "x_handle",
  "telegram_handle",
  "website_url",
  "best_work_title",
  "best_work_url",
] as const;

/** Exactly what an anonymous visitor may see. Nothing internal. */
export type PublicKrewProfile = {
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  member_type: MemberType | null;
  x_handle: string | null;
  telegram_handle: string | null;
  website_url: string | null;
  best_work_title: string | null;
  best_work_url: string | null;
};

/**
 * The signed-in member's own row, including approval state.
 * Only ever returned by the SECURITY DEFINER RPCs in migration 019, never by
 * a direct table read.
 */
export type KrewProfile = PublicKrewProfile & {
  id: string;
  /**
   * Null for a profile claimed at /krew-id: nobody has attached an account to
   * it, and the holder of the manage link is its only editor.
   */
  user_id: string | null;
  status: KrewProfileStatus;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

/** Shape used by the profile form. */
export type KrewProfileDraft = {
  display_name: string;
  username: string;
  bio: string;
  avatar_url: string | null;
  member_type: MemberType | null;
  x_handle: string;
  telegram_handle: string;
  website_url: string;
  best_work_title: string;
  best_work_url: string;
};

export const emptyDraft: KrewProfileDraft = {
  display_name: "",
  username: "",
  bio: "",
  avatar_url: null,
  member_type: null,
  x_handle: "",
  telegram_handle: "",
  website_url: "",
  best_work_title: "",
  best_work_url: "",
};

export function draftFromProfile(profile: KrewProfile): KrewProfileDraft {
  return {
    display_name: profile.display_name,
    username: profile.username,
    bio: profile.bio ?? "",
    avatar_url: profile.avatar_url,
    member_type: profile.member_type,
    x_handle: profile.x_handle ?? "",
    telegram_handle: profile.telegram_handle ?? "",
    website_url: profile.website_url ?? "",
    best_work_title: profile.best_work_title ?? "",
    best_work_url: profile.best_work_url ?? "",
  };
}

/** Canonical public profile URL. Always the Krew3 URL, never a social URL. */
export function profileUrl(username: string, origin?: string): string {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "https://krew3.site");
  return `${base.replace(/\/$/, "")}/${username}`;
}

/** Display form used in copy and on the card: krew3.site/shashwat */
export function profilePathLabel(username: string): string {
  return `krew3.site/${username}`;
}

export function memberTypeLabel(value: string | null): string | null {
  if (!value) return null;
  return MEMBER_TYPES.find((m) => m.value === value)?.label ?? null;
}

export function xUrl(handle: string): string {
  return `https://x.com/${normalizeHandle(handle)}`;
}

export function telegramUrl(handle: string): string {
  return `https://t.me/${normalizeHandle(handle)}`;
}

/** A profile is only publicly reachable when approved and public. */
export function isPubliclyVisible(
  profile: Pick<KrewProfile, "status" | "is_public"> | null | undefined,
): boolean {
  return !!profile && profile.status === "approved" && profile.is_public === true;
}

/**
 * Client-side gate shared by the member editor (/profile) and the public claim
 * form (/krew-id).
 *
 * Returns an empty string when the draft looks submittable. The database
 * re-validates every field on write (019 constraints plus the RPC checks in
 * 020), so this only saves a round trip and gives a precise message.
 */
export function validateProfileDraft(draft: KrewProfileDraft): string {
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

  if (draft.website_url.trim() && !isValidHttpUrl(normalizeUrl(draft.website_url)))
    return "That website link doesn't look like a valid URL.";
  if (draft.best_work_url.trim() && !isValidHttpUrl(normalizeUrl(draft.best_work_url)))
    return "That best work link doesn't look like a valid URL.";

  return "";
}

/** Supabase storage bucket + path convention for member avatars. */
export const AVATAR_BUCKET = "krew-avatars";
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function avatarPath(userId: string, file: File): string {
  const ext = (file.name.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || "png"}`;
}

export type AvatarValidation = { ok: true } | { ok: false; error: string };

export function validateAvatar(file: File): AvatarValidation {
  if (!AVATAR_MIME_TYPES.includes(file.type))
    return { ok: false, error: "Use a JPG, PNG, WebP or AVIF image." };
  if (file.size > AVATAR_MAX_BYTES) return { ok: false, error: "Keep it under 2 MB." };
  return { ok: true };
}

/** Build the sanitised row the editor is allowed to write. */
export function draftToRow(draft: KrewProfileDraft) {
  const username = slugifyUsername(draft.username);
  const memberType = draft.member_type;

  return {
    username,
    display_name: draft.display_name.trim(),
    bio: draft.bio.trim() || null,
    avatar_url: draft.avatar_url,
    member_type: memberType ? (memberTypeLabel(memberType) ? memberType : null) : null,
    x_handle: draft.x_handle.trim() ? normalizeHandle(draft.x_handle) : null,
    telegram_handle: draft.telegram_handle.trim() ? normalizeHandle(draft.telegram_handle) : null,
    website_url: draft.website_url.trim() ? normalizeUrl(draft.website_url) : null,
    best_work_title: draft.best_work_title.trim() || null,
    best_work_url: draft.best_work_url.trim() ? normalizeUrl(draft.best_work_url) : null,
  };
}
