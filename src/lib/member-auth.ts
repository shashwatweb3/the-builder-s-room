/**
 * Krew3 member accounts.
 *
 * Reuses the Supabase Auth instance that already backs /admin, plus the
 * existing Krew3 access code as the signup credential so the Krew stays
 * invite-style rather than open to anyone.
 *
 * Note: the access code ships in the client bundle (it always has, for the
 * members-only content gate). Treat it as friction, not as a secret.
 */

import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { grantKrewAccess, isValidAccessCode } from "@/lib/krew-access";
import { normalizeUsername, validateUsername, type KrewProfile } from "@/lib/krew-profile";

export const NOT_CONFIGURED = "Member sign-in is unavailable right now. Please try again later.";

export type AuthResult = { ok: true } | { ok: false; error: string };

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  if (!email.trim()) return { ok: false, error: "Enter your email." };
  if (!password) return { ok: false, error: "Enter your password." };
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Create a member account. The access code is verified first, and also unlocks
 * the members-only content gate so the member lands in a consistent state.
 */
export async function signUpWithAccessCode(
  email: string,
  password: string,
  accessCode: string,
): Promise<AuthResult> {
  if (!email.trim()) return { ok: false, error: "Enter your email." };
  if (password.length < 8)
    return { ok: false, error: "Use at least 8 characters for your password." };
  if (!isValidAccessCode(accessCode))
    return { ok: false, error: "That access code doesn't look right." };
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED };

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });

  if (error) return { ok: false, error: error.message };

  // With email confirmation enabled there is no session yet.
  if (!data.session) {
    grantKrewAccess();
    return { ok: false, error: "confirm-email" };
  }

  grantKrewAccess();
  return { ok: true };
}

export async function signOutMember(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export type MemberSession = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** False when the Supabase env vars are missing; routes show a notice instead of crashing. */
  configured: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

export function useMemberSession(): MemberSession {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!configured) {
      setSession(null);
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const supabase = createClient();
      const {
        data: { session: current },
      } = await supabase.auth.getSession();
      setSession(current);
      setUser(current?.user ?? null);
    } catch {
      setSession(null);
      setUser(null);
    }
    setLoading(false);
  }, [configured]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    let active = true;
    let subscription: { unsubscribe: () => void } | undefined;

    try {
      const supabase = createClient();
      void supabase.auth.getSession().then(({ data: { session: current } }) => {
        if (!active) return;
        setSession(current);
        setUser(current?.user ?? null);
        setLoading(false);
      });

      const listener = supabase.auth.onAuthStateChange((_event, next) => {
        if (!active) return;
        setSession(next);
        setUser(next?.user ?? null);
        setLoading(false);
      });
      subscription = listener.data.subscription;
    } catch {
      setLoading(false);
    }

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [configured]);

  const signOut = useCallback(async () => {
    if (!configured) return;
    await signOutMember();
    setSession(null);
    setUser(null);
  }, [configured]);

  return { user, session, loading, configured, refresh: load, signOut };
}

/**
 * Read the signed-in member's own profile, including approval state.
 *
 * Goes through the SECURITY DEFINER RPC rather than a table read: the
 * authenticated role intentionally has no SELECT grant on krew_profiles, and
 * the RPC scopes the row to auth.uid() so a client cannot ask for someone
 * else's profile.
 */
export async function fetchOwnProfile(): Promise<KrewProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("my_krew_profile");

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as KrewProfile[];
  return rows[0] ?? null;
}

/**
 * Insert a new profile. status/is_public are deliberately omitted: the database
 * forces 'pending' + private for non-admins. No representation is requested on
 * the insert; the row is read back through the RPC instead.
 */
export async function createProfile(userId: string, values: Record<string, unknown>) {
  const supabase = createClient();
  const { error } = await supabase.from("krew_profiles").insert({ user_id: userId, ...values });

  if (error) throw new Error(error.message);

  const created = await fetchOwnProfile();
  if (!created) throw new Error("Profile was created but could not be read back.");
  return created;
}

/**
 * Update the editable columns of the signed-in member's own profile.
 *
 * Filters on `currentUsername` rather than the row id: `id` is an internal
 * column with no SELECT grant, while `username` is unique and part of the
 * public column set. RLS still restricts the write to the caller's own row.
 */
export async function updateProfile(
  currentUsername: string,
  values: Record<string, unknown>,
): Promise<KrewProfile> {
  const supabase = createClient();
  const { error } = await supabase
    .from("krew_profiles")
    .update(values)
    .eq("username", currentUsername);

  if (error) throw new Error(error.message);

  const updated = await fetchOwnProfile();
  if (!updated) throw new Error("Profile disappeared while saving.");
  return updated;
}

/**
 * Is this username already claimed? Used for live availability feedback.
 *
 * Uses the RPC because the public view only exposes approved+public rows, so
 * querying it directly would report a pending member's handle as available.
 */
export async function isUsernameTaken(username: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("krew_username_taken", {
    p_username: normalizeUsername(username),
  });

  if (error) throw new Error(error.message);
  return data === true;
}

/**
 * Upload a member avatar into their own storage folder.
 * Path is user-id scoped, and RLS refuses writes outside it.
 */
export async function uploadAvatar(userId: string, file: File, path: string): Promise<string> {
  const supabase = createClient();
  const { error } = await supabase.storage.from("krew-avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("krew-avatars").getPublicUrl(path);
  return data.publicUrl;
}

export { validateUsername };
