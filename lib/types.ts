/**
 * Domain types. One definition per table in `schema.sql`, mirroring the column
 * names exactly so rows coming back from PostgREST need no remapping.
 *
 * CONTEXT.md rule 4: no `any`, types live here and nowhere else.
 *
 * Written as type aliases rather than interfaces on purpose. Supabase's
 * `Database` generic requires every Row to satisfy `Record<string, unknown>`,
 * and TypeScript only gives implicit index signatures to type aliases — an
 * interface here silently collapses every query result to `never`.
 */

/** Only two roles exist. Coach is decided by email, never stored as editable. */
export type Role = "coach" | "player";

/** Fixed list — drives the capacity/price prefill in New class. */
export type ClassType = "group" | "clinic" | "private" | "match_play";

export type MediaType = "image" | "video";

/**
 * A person. `id` is our own uuid with no foreign key to `auth.users`, so demo
 * players can be seeded without a real Google account (ADR-006, rule 8).
 * `level` is null until the player finishes onboarding.
 */
export type AppUser = {
  id: string;
  name: string;
  avatar_url: string | null;
  role: Role;
  level: number | null;
  created_at: string;
};

/** One concrete class on the calendar. `starts_at` is always UTC (ADR-007). */
export type ClassSession = {
  id: string;
  coach_id: string;
  title: string;
  type: ClassType;
  level_min: number;
  level_max: number;
  starts_at: string;
  duration_min: number;
  court: string;
  capacity: number;
  price: number;
  notes: string | null;
  created_at: string;
};

export type Booking = {
  id: string;
  session_id: string;
  user_id: string;
  created_at: string;
};

export type Post = {
  id: string;
  author_id: string;
  body: string;
  media_url: string | null;
  media_type: MediaType | null;
  created_at: string;
};

/** Composite primary key (post_id, user_id) — a like is a toggle, not a row id. */
export type Like = {
  post_id: string;
  user_id: string;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
};
