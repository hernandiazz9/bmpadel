/**
 * Booking and cancelling, including the last-slot race (ADR-008).
 *
 * There is deliberately no capacity constraint in the database. Two phones in
 * the same room can press Book on the same last slot within milliseconds of
 * each other, and the rule is: insert, recount, and whoever arrived second
 * loses their row.
 */

import { supabase } from "@/lib/supabase";
import type { Booking } from "@/lib/types";

/** Thrown at whoever lost the race for the last slot. */
export class ClassFullError extends Error {
  constructor() {
    super("Class is full");
    this.name = "ClassFullError";
  }
}

/** Postgres unique_violation — this person already holds a slot. */
const UNIQUE_VIOLATION = "23505";

function isPostgrestError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  );
}

/**
 * Takes a slot, then checks whether it was really available.
 *
 * The recount orders every booking on the class by arrival and keeps the first
 * `capacity` of them. If this row is not in that set it is deleted again and
 * the caller is told the class is full. Both racing clients run the same
 * comparison against the same rows, so they agree on who won without either of
 * them holding a lock — and the loser is always the one who arrived second,
 * never whoever happened to recount first.
 *
 * `created_at` alone can tie at the same millisecond, so `id` breaks it. It is
 * arbitrary but identical on both devices, which is the only property that
 * matters.
 */
export async function bookClass(
  sessionId: string,
  userId: string,
  capacity: number,
): Promise<Booking> {
  const { data: row, error } = await supabase
    .from("booking")
    .insert({ session_id: sessionId, user_id: userId })
    .select("*")
    .single();

  if (error) {
    // Already booked — treat as success rather than making the user care.
    if (isPostgrestError(error) && error.code === UNIQUE_VIOLATION) {
      const { data: existing, error: readError } = await supabase
        .from("booking")
        .select("*")
        .eq("session_id", sessionId)
        .eq("user_id", userId)
        .single();
      if (readError) throw readError;
      return existing;
    }
    throw error;
  }

  const { data: all, error: countError } = await supabase
    .from("booking")
    .select("id, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (countError) throw countError;

  const kept = all.slice(0, capacity).map((booking) => booking.id);
  if (!kept.includes(row.id)) {
    await supabase.from("booking").delete().eq("id", row.id);
    throw new ClassFullError();
  }

  return row;
}

/**
 * Gives the slot back. Always allowed right up until the class starts, with no
 * penalty, and the slot returns to the pool immediately.
 */
export async function cancelBooking(
  sessionId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("booking")
    .delete()
    .eq("session_id", sessionId)
    .eq("user_id", userId);
  if (error) throw error;
}
