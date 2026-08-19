/**
 * Pure logic behind the Classes screen: slot counts, class state, and which
 * single class earns the `ball` accent.
 *
 * Kept free of React and of Supabase so the rules can be reasoned about — and
 * checked — in one place.
 */

import { classEndsAt, clubDayKey } from "@/lib/time";
import type { Booking, ClassSession, ClassType } from "@/lib/types";

/**
 * How a class reads on the strip. Precedence when several could apply:
 * finished beats in-progress beats full beats open — a class that filled up
 * yesterday is "finished", not "full".
 */
export type ClassState = "finished" | "in-progress" | "full" | "open";

export type DecoratedClass = {
  session: ClassSession;
  /** Bookings taken. */
  booked: number;
  /** `capacity - booked`, floored at zero. */
  slots: number;
  state: ClassState;
  /** Club-time calendar day, `YYYY-MM-DD`. */
  dayKey: string;
};

/** How many days the day selector offers: today plus the next 13. */
export const DAY_WINDOW = 14;

function stateOf(
  session: ClassSession,
  slots: number,
  now: Date,
): ClassState {
  const startsAt = new Date(session.starts_at);
  if (now >= classEndsAt(session.starts_at, session.duration_min)) {
    return "finished";
  }
  if (now >= startsAt) return "in-progress";
  return slots > 0 ? "open" : "full";
}

/**
 * Joins classes to their bookings and works out the state of each.
 *
 * The join happens here rather than in the query because the roster in slice 3
 * needs the booking rows themselves, so they are fetched as rows and counted
 * client side rather than aggregated by PostgREST.
 */
export function decorateClasses(
  sessions: readonly ClassSession[],
  bookings: readonly Booking[],
  now: Date,
): DecoratedClass[] {
  const counts = new Map<string, number>();
  for (const booking of bookings) {
    counts.set(booking.session_id, (counts.get(booking.session_id) ?? 0) + 1);
  }

  return sessions
    .map((session) => {
      const booked = counts.get(session.id) ?? 0;
      // Never report a negative slot count: ADR-008 accepts a brief window
      // where an over-booked class reads 5/4 before the extra row is undone.
      const slots = Math.max(0, session.capacity - booked);
      return {
        session,
        booked,
        slots,
        state: stateOf(session, slots, now),
        dayKey: clubDayKey(new Date(session.starts_at)),
      };
    })
    .sort(
      (a, b) =>
        new Date(a.session.starts_at).getTime() -
        new Date(b.session.starts_at).getTime(),
    );
}

/** Buckets decorated classes by their club-time day. */
export function groupByClubDay(
  classes: readonly DecoratedClass[],
): Map<string, DecoratedClass[]> {
  const days = new Map<string, DecoratedClass[]>();
  for (const item of classes) {
    const bucket = days.get(item.dayKey);
    if (bucket) bucket.push(item);
    else days.set(item.dayKey, [item]);
  }
  return days;
}

/**
 * The one class on a day that carries `ball`: the earliest one still to come
 * that has a free slot (CONTEXT.md rule 2).
 *
 * Scoped to the day on screen rather than to the whole 14-day window. The rule
 * pairs "only the next class with a slot" with "every other counter uses
 * `clay`", which reads as one accent per screen — a window-wide winner would
 * leave every other day with no accent at all.
 *
 * Returns null for a day with nothing bookable left, which is correct: zero
 * uses of `ball` is inside the budget, two is the ceiling.
 */
export function nextOpenClassId(
  dayClasses: readonly DecoratedClass[],
): string | null {
  // `decorateClasses` already sorted by start time.
  return dayClasses.find((item) => item.state === "open")?.session.id ?? null;
}

/**
 * True when the player's level sits outside the class range.
 *
 * Drives a soft hint and nothing else — booking outside the range is always
 * allowed (ADR-010), because the level is self-assessed and there is no match
 * history behind it to justify blocking anyone.
 */
export function isOutsideLevelRange(
  session: ClassSession,
  level: number | null,
): boolean {
  if (level === null) return false;
  return level < session.level_min || level > session.level_max;
}

/** A class can still be joined or left only before it starts. */
export function hasStarted(session: ClassSession, now: Date): boolean {
  return now >= new Date(session.starts_at);
}

/** The club's courts. A fixed list, not free text — pending the real names. */
export const COURTS = ["Court 1", "Court 2", "Court 3", "Court 4"] as const;

/** Durations the coach can pick, in minutes. */
export const DURATIONS = [45, 60, 90, 120] as const;

/**
 * What each class type implies, so New class arrives pre-filled instead of
 * asking the coach to remember. Both stay editable — these are defaults, not
 * rules. Prices are placeholders in AUD until the club confirms them.
 */
export const CLASS_TYPE_DEFAULTS: Record<
  ClassType,
  { capacity: number; price: number }
> = {
  group: { capacity: 8, price: 25 },
  clinic: { capacity: 6, price: 35 },
  private: { capacity: 2, price: 90 },
  match_play: { capacity: 4, price: 20 },
};

export const CLASS_TYPES = [
  "group",
  "clinic",
  "private",
  "match_play",
] as const satisfies readonly ClassType[];
