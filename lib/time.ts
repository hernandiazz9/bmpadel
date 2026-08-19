/**
 * The only place in the app allowed to format a date.
 *
 * ADR-007: every `starts_at` is stored in UTC and rendered in the club's zone,
 * never the browser's. No `toLocaleString` / `toLocaleDateString` anywhere else
 * in the codebase — if a screen needs a formatted time, it imports from here.
 */

export const CLUB_TZ = "Australia/Perth";

/**
 * Perth sits at UTC+8 all year — Western Australia has had no daylight saving
 * since 2009 (ADR-007 leans on this). Because the offset never moves, a club
 * day key can be turned into an exact instant by pinning this offset, and a day
 * is always exactly 24 hours long. Both shortcuts break the moment the club
 * opens a second site in a DST zone; that is the ADR's stated trigger.
 */
export const CLUB_UTC_OFFSET = "+08:00";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CLUB_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * The calendar day an instant falls on *in club time*, as `YYYY-MM-DD`.
 * Used to group and compare days without dragging the browser zone in.
 */
export function clubDayKey(date: Date = new Date()): string {
  return dayKeyFormatter.format(date);
}

/** Midnight at the start of a club day key, as a real instant. */
export function clubDayStart(dayKey: string): Date {
  return new Date(`${dayKey}T00:00:00${CLUB_UTC_OFFSET}`);
}

/** Midnight at the end of a club day key — the start of the next day. */
export function clubDayEnd(dayKey: string): Date {
  return new Date(clubDayStart(dayKey).getTime() + MS_PER_DAY);
}

/**
 * `count` consecutive club day keys, starting with the club day `from` falls on.
 * This is what the day selector runs on: "today" is today *in Perth*, even when
 * the phone looking at it is in Spain.
 */
export function clubDayKeys(count: number, from: Date = new Date()): string[] {
  const start = clubDayStart(clubDayKey(from)).getTime();
  return Array.from({ length: count }, (_, i) =>
    clubDayKey(new Date(start + i * MS_PER_DAY)),
  );
}

/** When a class finishes. */
export function classEndsAt(startsAt: string, durationMin: number): Date {
  return new Date(new Date(startsAt).getTime() + durationMin * 60_000);
}

/** `90` → `"1h 30m"`, `60` → `"1h"`, `45` → `"45m"`. */
export function formatDuration(durationMin: number): string {
  const hours = Math.floor(durationMin / 60);
  const minutes = durationMin % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * How long ago something happened, for the wall.
 *
 * A duration rather than a clock reading, so the club timezone does not come
 * into it — but it lives here anyway, because this module is the only place
 * allowed to turn a timestamp into words (ADR-007).
 */
export function formatTimeAgo(iso: string, now: Date = new Date()): string {
  const seconds = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

/**
 * Turns a club-local date and time — as typed into a form — into the UTC
 * instant to store. `dayKey` is `YYYY-MM-DD`, `time` is `HH:MM`.
 *
 * The fixed offset is safe for the same reason `clubDayStart` is: Perth has no
 * daylight saving.
 */
export function clubLocalToUtc(dayKey: string, time: string): string {
  return new Date(`${dayKey}T${time}:00${CLUB_UTC_OFFSET}`).toISOString();
}

/** `YYYY-MM-DD` and `HH:MM` for a form, in club time. */
export function clubFormParts(date: Date = new Date()): {
  day: string;
  time: string;
} {
  return { day: clubDayKey(date), time: timeFormatter.format(date) };
}
