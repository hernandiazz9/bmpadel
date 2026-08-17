import type { Session } from "@supabase/supabase-js";

import { COACH_EMAIL } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import type { AppUser, Role } from "@/lib/types";

/** Reads a string field out of Google's metadata bag without widening to `any`. */
function readString(meta: Record<string, unknown>, key: string): string | null {
  const value = meta[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

/**
 * Coach is whoever signs in with the configured email; everyone else is a
 * player (ADR-006). Never read from an editable field.
 */
export function roleForEmail(email: string | undefined): Role {
  if (COACH_EMAIL.length === 0) return "player";
  return email?.trim().toLowerCase() === COACH_EMAIL ? "coach" : "player";
}

/**
 * Maps a Google session onto its row in `user`, creating it on first sign-in.
 *
 * The row reuses the `auth.users` uuid as its own id. There is no foreign key
 * between them (rule 8), which is what lets `seed.sql` insert demo players that
 * have no Google account at all.
 *
 * `level` is never written here — onboarding owns it, and overwriting it on
 * every sign-in would send returning players back through the slider.
 */
export async function ensureAppUser(session: Session): Promise<AppUser> {
  const id = session.user.id;
  const meta = session.user.user_metadata as Record<string, unknown>;

  const name =
    readString(meta, "full_name") ??
    readString(meta, "name") ??
    session.user.email?.split("@")[0] ??
    "Player";
  const avatarUrl = readString(meta, "avatar_url") ?? readString(meta, "picture");
  const role = roleForEmail(session.user.email);

  const { data: existing, error: readError } = await supabase
    .from("user")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (readError) throw readError;

  if (!existing) {
    const { data, error } = await supabase
      .from("user")
      .insert({ id, name, avatar_url: avatarUrl, role, level: null })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  // Keep the identity fields in step with Google (new photo, changed name) and
  // re-derive the role in case COACH_EMAIL moved. Level stays untouched.
  const stale =
    existing.name !== name ||
    existing.avatar_url !== avatarUrl ||
    existing.role !== role;

  if (!stale) return existing;

  const { data, error } = await supabase
    .from("user")
    .update({ name, avatar_url: avatarUrl, role })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/** Writes the level chosen in onboarding. */
export async function setUserLevel(userId: string, level: number): Promise<AppUser> {
  const { data, error } = await supabase
    .from("user")
    .update({ level })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
