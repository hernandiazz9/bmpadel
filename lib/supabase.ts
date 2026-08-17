import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/env";

/**
 * Single browser Supabase client, shared by every hook.
 *
 * RLS is off by design (ADR-005), so the anon key is all the access this app
 * needs — no service role, no server-side client, no route handlers.
 *
 * PKCE with `detectSessionInUrl` lets the OAuth round trip finish entirely in
 * the browser: Google redirects back to `/auth/callback`, the client swaps the
 * code for a session, and no route handler is involved (ADR-004).
 */
export const supabase = createClient<Database>(
  // `createClient` throws on an empty URL, so fall back to a placeholder when
  // the project has not been created yet. Every call site is gated behind
  // `isSupabaseConfigured` anyway.
  isSupabaseConfigured ? SUPABASE_URL : "http://localhost:54321",
  isSupabaseConfigured ? SUPABASE_ANON_KEY : "public-anon-key-placeholder",
  {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
