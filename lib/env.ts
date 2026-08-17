/**
 * Client-readable configuration.
 *
 * Everything here needs the `NEXT_PUBLIC_` prefix: the app is 100% client
 * components (ADR-004), so a bare `process.env.COACH_EMAIL` would be inlined as
 * `undefined` in the browser bundle and every user would resolve to `player`.
 * Exposing the coach email in the bundle costs nothing here — with RLS off
 * (ADR-005) anyone holding the link can already write to the tables.
 *
 * Referenced as full literals on purpose: Next replaces these statically at
 * build time and cannot see through a computed key.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const COACH_EMAIL = (process.env.NEXT_PUBLIC_COACH_EMAIL ?? "")
  .trim()
  .toLowerCase();

/**
 * False until the Supabase project exists. Lets the shell boot and show a
 * readable message instead of crashing on a missing key.
 */
export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
