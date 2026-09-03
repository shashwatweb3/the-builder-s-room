import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client using the service-role key.
 * ONLY use this server-side in admin API routes — never in client code.
 */
export function createAdminClient() {
  return createClient(
    import.meta.env["VITE_SUPABASE_URL"]!,
    import.meta.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
