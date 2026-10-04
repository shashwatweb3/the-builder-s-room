import { createBrowserClient } from "@supabase/ssr";

/**
 * True only when the Supabase env vars actually hold a value.
 * Empty strings are treated as missing so a misconfigured environment degrades
 * to a sign-in screen instead of a white-screen crash.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    import.meta.env["VITE_SUPABASE_URL"]?.trim() &&
    import.meta.env["VITE_SUPABASE_ANON_KEY"]?.trim(),
  );
}

export function createClient() {
  return createBrowserClient(
    import.meta.env["VITE_SUPABASE_URL"]!,
    import.meta.env["VITE_SUPABASE_ANON_KEY"]!,
  );
}

/**
 * A client that is deliberately the `anon` role, whatever is in localStorage.
 *
 * The public /krew-id claim flow must not depend on whether the visitor happens
 * to be signed in. It used to: createBrowserClient is a singleton that picks up
 * a stored session, so a signed-in visitor's upload carried a user JWT, PostgREST
 * evaluated it as `authenticated`, and it matched neither the ticketed INSERT
 * policy (scoped to anon) nor the member policy (which requires a path under
 * <auth.uid()>/). The upload was refused with "new row violates row-level
 * security policy" even though the ticket was valid.
 *
 * persistSession: false swaps localStorage/cookie session handling for an empty
 * in-memory store, so the request goes out with only the anon key.
 * isSingleton: false is required, otherwise this would hand back the cached
 * session-aware client and silently ignore both options.
 */
export function createPublicClient() {
  return createBrowserClient(
    import.meta.env["VITE_SUPABASE_URL"]!,
    import.meta.env["VITE_SUPABASE_ANON_KEY"]!,
    {
      isSingleton: false,
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
