/**
 * Public, no-signup Krew ID claim flow.
 *
 * Backed exclusively by the SECURITY DEFINER RPCs in
 * 020_krew_public_claim.sql. Anonymous clients have no INSERT/UPDATE grant on
 * krew_profiles, so every write here goes through an RPC:
 *
 *   krew_avatar_upload_ticket -> storage upload -> krew_claim_id
 *                                       \-> krew_update_by_token
 *
 * Credential model: the database returns the raw manage token exactly once, at
 * claim time, and stores only its SHA-256 hash. The token is therefore never
 * persisted by this app - not in localStorage, not in sessionStorage, not in a
 * query string. The only place it exists is the /krew-id/manage/$token URL,
 * which the claimant is told to keep.
 */

import {
  AVATAR_BUCKET,
  MEMBER_TYPE_VALUES,
  draftToRow,
  validateAvatar,
  type KrewProfileDraft,
  type MemberType,
  type PublicKrewProfile,
} from "@/lib/krew-profile";
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { KrewAvatarTicket, KrewClaimResult, ManagedKrewProfile } from "@/lib/supabase/types";

export const CLAIM_NOT_CONFIGURED =
  "Claiming a Krew ID is unavailable right now. Please try again in a moment.";

/** Storage extension per accepted MIME type; the ticket RPC only allows these. */
const AVATAR_EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** A ticket-bound upload: the path to send on submit, plus a local preview. */
export type ClaimAvatar = {
  /** Reserved storage path. Submitted as p_avatar_path exactly once. */
  path: string;
  /** Public URL of the uploaded bytes, used only for the preview thumbnail. */
  previewUrl: string;
};

export type ManagedKrewProfileView = ManagedKrewProfile & {
  draft: KrewProfileDraft;
  publicProfile: PublicKrewProfile;
};

function unavailable(): Error {
  return new Error(CLAIM_NOT_CONFIGURED);
}

/**
 * supabase-js turns a dead network into an error object whose message is a raw
 * `TypeError: Failed to fetch`. That is not something to show a visitor, so
 * transport failures get a plain sentence while real database messages
 * ("That Krew ID is already claimed.") pass through untouched.
 */
function rpcMessage(message: string, fallback: string): Error {
  const text = message?.trim() ?? "";
  if (!text) return new Error(fallback);
  if (/failed to fetch|networkerror|load failed|failed to load/i.test(text)) {
    return new Error("We couldn't reach the Krew. Check your connection and try again.");
  }
  return new Error(text);
}

/**
 * Narrow the token-scoped row into the shape the shared profile view expects.
 * The database constrains member_type, but the client does not trust that.
 */
function memberTypeOrNull(value: string | null): MemberType | null {
  return MEMBER_TYPE_VALUES.includes(value ?? "") ? (value as MemberType) : null;
}

/** Adapt a managed row into the editor draft used by KrewProfileForm. */
export function draftFromManaged(row: ManagedKrewProfile): KrewProfileDraft {
  return {
    display_name: row.display_name,
    username: row.username,
    bio: row.bio ?? "",
    avatar_url: row.avatar_url,
    member_type: memberTypeOrNull(row.member_type),
    x_handle: row.x_handle ?? "",
    telegram_handle: row.telegram_handle ?? "",
    website_url: row.website_url ?? "",
    best_work_title: row.best_work_title ?? "",
    best_work_url: row.best_work_url ?? "",
  };
}

/** The ten columns that are safe to render anywhere, approval state excluded. */
export function publicProfileFromManaged(row: ManagedKrewProfile): PublicKrewProfile {
  return {
    username: row.username,
    display_name: row.display_name,
    bio: row.bio,
    avatar_url: row.avatar_url,
    member_type: memberTypeOrNull(row.member_type),
    x_handle: row.x_handle,
    telegram_handle: row.telegram_handle,
    website_url: row.website_url,
    best_work_title: row.best_work_title,
    best_work_url: row.best_work_url,
  };
}

/**
 * The RPC payload. avatar_url is dropped on purpose: the photo URL is built by
 * the database from a validated ticket path, never taken from the client.
 */
function claimPayload(draft: KrewProfileDraft): Record<string, unknown> {
  const { avatar_url: _ignored, ...rest } = draftToRow(draft);
  return rest;
}

/**
 * Reserve an upload path, then PUT the bytes there.
 *
 * Order matters: the anon storage policy only accepts an insert into a path the
 * database has reserved, so a ticket must exist before the upload. upsert stays
 * false because there is no anon UPDATE policy.
 */
export async function uploadClaimAvatar(file: File): Promise<ClaimAvatar> {
  const check = validateAvatar(file);
  if (!check.ok) throw new Error(check.error);
  if (!isSupabaseConfigured()) throw unavailable();

  const ext = AVATAR_EXT_BY_MIME[file.type];
  if (!ext) throw new Error("Use a JPG, PNG, WebP or AVIF image.");

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("krew_avatar_upload_ticket", { p_ext: ext });
  if (error) throw rpcMessage(error.message, "Could not reserve an upload slot.");

  const ticket = (data as KrewAvatarTicket[] | null)?.[0];
  if (!ticket?.path) throw new Error("Could not reserve an upload slot. Try again.");

  const bucket = supabase.storage.from(AVATAR_BUCKET);
  const { error: uploadError } = await bucket.upload(ticket.path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (uploadError) throw rpcMessage(uploadError.message, "Upload failed.");

  const { data: urlData } = bucket.getPublicUrl(ticket.path);
  return { path: ticket.path, previewUrl: urlData.publicUrl };
}

/**
 * Create the pending profile and return the one-time manage token.
 * `honeypot` must stay empty: the database rejects any non-empty value.
 */
export async function claimKrewId(
  draft: KrewProfileDraft,
  avatar: ClaimAvatar | null,
  honeypot = "",
): Promise<KrewClaimResult> {
  if (!isSupabaseConfigured()) throw unavailable();

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("krew_claim_id", {
    p_profile: claimPayload(draft),
    p_hp: honeypot,
    p_avatar_path: avatar?.path ?? null,
  });

  if (error) throw rpcMessage(error.message, "Could not claim that Krew ID.");

  const claimed = (data as KrewClaimResult[] | null)?.[0];
  if (!claimed?.manage_token) throw new Error("Could not claim that Krew ID.");
  return claimed;
}

/**
 * Read the profile behind a manage token. Returns null for an unknown token:
 * the RPC yields no rows rather than raising, so a wrong link and a revoked
 * profile are indistinguishable to a stranger.
 */
export async function fetchManagedProfile(token: string): Promise<ManagedKrewProfile | null> {
  if (!isSupabaseConfigured()) throw unavailable();
  if (!token) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("krew_managed_profile", { p_token: token });
  if (error) throw rpcMessage(error.message, "Could not open that management link.");

  return (data as ManagedKrewProfile[] | null)?.[0] ?? null;
}

/**
 * Save edits through the manage token. p_avatar_path is only sent when the photo
 * changed: passing null means "keep the current photo" server-side.
 */
export async function updateManagedProfile(
  token: string,
  draft: KrewProfileDraft,
  avatar: ClaimAvatar | null,
): Promise<ManagedKrewProfile> {
  if (!isSupabaseConfigured()) throw unavailable();

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("krew_update_by_token", {
    p_token: token,
    p_profile: claimPayload(draft),
    p_avatar_path: avatar?.path ?? null,
  });

  if (error) throw rpcMessage(error.message, "Could not save your profile.");

  const updated = (data as ManagedKrewProfile[] | null)?.[0];
  if (!updated) throw new Error("That management link is not valid.");
  return updated;
}

/**
 * The upload ticket died between upload and submit (they expire after 20
 * minutes). The client has to drop the stored path so the member re-uploads.
 */
export function isExpiredUploadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  return /upload expired|upload it again/i.test(message);
}

/** Secret URL that lets the claimant edit this profile without an account. */
export function manageProfileUrl(token: string, origin?: string): string {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "https://krew3.site");
  return `${base.replace(/\/$/, "")}/krew-id/manage/${token}`;
}
