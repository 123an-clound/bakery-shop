import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

/**
 * Anon-key client with no cookie/session awareness — safe to call from inside
 * `unstable_cache` (no dynamic APIs involved). Only for public, non-user-scoped
 * reads (theme, site settings, catalog) where RLS's `status = 'active'` check
 * is all the access control that's needed.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
