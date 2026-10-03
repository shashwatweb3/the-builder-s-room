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
