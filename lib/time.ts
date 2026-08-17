/**
 * The only place in the app allowed to format a date.
 *
 * ADR-007: every `starts_at` is stored in UTC and rendered in the club's zone,
 * never the browser's. No `toLocaleString` / `toLocaleDateString` anywhere else
 * in the codebase — if a screen needs a formatted time, it imports from here.
 */

export const CLUB_TZ = "Australia/Perth";

const timeFormatter = new Intl.DateTimeFormat("en-AU", {
  timeZone: CLUB_TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const weekdayFormatter = new Intl.DateTimeFormat("en-AU", {
  timeZone: CLUB_TZ,
  weekday: "short",
});

const dayNumberFormatter = new Intl.DateTimeFormat("en-AU", {
  timeZone: CLUB_TZ,
  day: "numeric",
});

const fullDateFormatter = new Intl.DateTimeFormat("en-AU", {
  timeZone: CLUB_TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** `19:00` in club time. */
export function formatClubTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

/** `Tue` in club time. */
export function formatClubWeekday(iso: string): string {
  return weekdayFormatter.format(new Date(iso));
}

/** `17` in club time. */
export function formatClubDayNumber(iso: string): string {
  return dayNumberFormatter.format(new Date(iso));
}

/** `Monday, 17 August` in club time. */
export function formatClubDate(iso: string): string {
  return fullDateFormatter.format(new Date(iso));
}

/**
 * The calendar day an instant falls on *in club time*, as `YYYY-MM-DD`.
 * Used to group and compare days without dragging the browser zone in.
 */
export function clubDayKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLUB_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts;
}
