"use client";

import type { ClassState, DecoratedClass } from "@/lib/classes";
import { formatLevel } from "@/lib/level";
import { strings } from "@/lib/strings";
import {
  classEndsAt,
  clubDayStart,
  formatClubDate,
  formatClubDayNumber,
  formatClubTime,
  formatClubWeekday,
} from "@/lib/time";
import { cn } from "@/lib/utils";

/**
 * Per-state colour for every text slot in a row.
 *
 * Dimming is done with explicit ink tokens, never with `opacity-*`. Opacity
 * compounds on already-muted text and drags borders down with it; the tokens
 * here are the measured ones, all of which clear WCAG AA on both `line` and
 * `glass`.
 */
type RowTone = {
  card: string;
  time: string;
  endTime: string;
  title: string;
  meta: string;
  fraction: string;
  status: string;
};

const TONES: Record<Exclude<ClassState, "finished">, RowTone> = {
  open: {
    card: "border-border bg-card",
    time: "text-foreground",
    endTime: "text-muted-foreground",
    title: "text-foreground",
    meta: "text-muted-foreground",
    fraction: "text-muted-foreground",
    status: "text-clay-ink",
  },

  /**
   * The class currently on court. A tinted surface plus a `court` time — never
   * `ball`, which belongs to the one class you can still act on.
   */
  "in-progress": {
    card: "border-primary/35 bg-secondary",
    time: "text-primary",
    endTime: "text-primary/70",
    title: "text-foreground",
    meta: "text-muted-foreground",
    fraction: "text-muted-foreground",
    status: "text-primary",
  },

  /**
   * Full. The surface goes, but the real signal is the ink: `line` on `glass`
   * is only a 1.19:1 step, so a vanished fill alone would be invisible. Title
   * drops from 13.3:1 to 5.5:1 against the page, the hairline disappears, and
   * the row says the word.
   */
  full: {
    card: "border-transparent bg-transparent",
    time: "text-muted-foreground",
    endTime: "text-muted-foreground",
    title: "text-muted-foreground",
    meta: "text-muted-foreground",
    fraction: "text-muted-foreground",
    status: "text-muted-foreground",
  },
};

/**
 * The next class with a free slot: the whole row inverts to `court`.
 *
 * `ball` on `line` measures 1.36:1, so a small yellow chip on a near-white row
 * is a hue cue you have to already be looking at. `court` on `glass` is 8.70:1
 * and `ball` on `court` is 7.62:1 — a navy block in a stack of pale rows is
 * found before anything is read, and the yellow finally has something to sit
 * against. This is the screen's single `ball`, one of the two rule 2 allows.
 */
const NEXT_OPEN_TONE: RowTone = {
  card: "border-primary bg-primary",
  time: "text-primary-foreground",
  endTime: "text-primary-foreground/65",
  title: "text-primary-foreground",
  meta: "text-primary-foreground/70",
  fraction: "text-primary-foreground/70",
  status: "text-accent",
};

function statusFor(item: DecoratedClass, now: Date): string {
  switch (item.state) {
    case "full":
      return strings.classes.full;
    case "in-progress": {
      const endsAt = classEndsAt(item.session.starts_at, item.session.duration_min);
      const minutes = Math.max(
        0,
        Math.ceil((endsAt.getTime() - now.getTime()) / 60_000),
      );
      return strings.classes.minutesLeft(minutes);
    }
    case "finished":
      return strings.classes.finished;
    default:
      return strings.classes.slotsLeft(item.slots);
  }
}

function ClassRow({
  item,
  isNextOpen,
  now,
}: {
  item: DecoratedClass;
  isNextOpen: boolean;
  now: Date;
}) {
  const { session } = item;
  const endsAt = classEndsAt(session.starts_at, session.duration_min).toISOString();

  // Finished classes collapse to a single line, so the day physically shortens
  // as it burns down and what is left to come dominates the screen.
  if (item.state === "finished") {
    return (
      <li className="grid grid-cols-[4.5rem_1fr_auto] items-baseline gap-3 px-4 py-2">
        <span className="numeric text-sm text-muted-foreground">
          {formatClubTime(session.starts_at)}
        </span>
        <span className="truncate text-sm text-muted-foreground">
          {session.title}
        </span>
        <span className="numeric text-xs text-muted-foreground">
          {item.booked}/{session.capacity}
        </span>
      </li>
    );
  }

  const tone = isNextOpen ? NEXT_OPEN_TONE : TONES[item.state];

  return (
    <li
      className={cn(
        "grid grid-cols-[4.5rem_1fr_auto] gap-3 rounded-lg border px-4 py-3",
        tone.card,
      )}
    >
      {/* The mono time ladder — the column the eye runs down. */}
      <div className="flex flex-col">
        <span className={cn("numeric text-[22px] leading-none font-semibold", tone.time)}>
          {formatClubTime(session.starts_at)}
        </span>
        <span className={cn("numeric mt-1 text-[11px] leading-none", tone.endTime)}>
          {formatClubTime(endsAt)}
        </span>
      </div>

      <div className="min-w-0">
        <p className={cn("subhead truncate text-[17px]", tone.title)}>
          {session.title}
        </p>
        <p className={cn("numeric mt-1 truncate text-[11px]", tone.meta)}>
          {session.court} ·{" "}
          {strings.classes.levelRange(
            formatLevel(session.level_min),
            formatLevel(session.level_max),
          )}
        </p>
      </div>

      <div className="flex flex-col items-end">
        <span className={cn("numeric text-sm leading-none font-medium", tone.fraction)}>
          {item.booked}/{session.capacity}
        </span>
        <span className={cn("numeric mt-1.5 text-[11px] leading-none", tone.status)}>
          {statusFor(item, now)}
        </span>
      </div>
    </li>
  );
}

function EmptyDay({
  nextDayKey,
  onSelectDay,
}: {
  nextDayKey: string | null;
  onSelectDay: (dayKey: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-10 text-center">
      <p className="subhead text-lg">{strings.classes.emptyDay}</p>
      {nextDayKey ? (
        <button
          type="button"
          onClick={() => onSelectDay(nextDayKey)}
          className="numeric mt-4 text-xs tracking-wide text-primary uppercase underline underline-offset-4"
        >
          {strings.classes.nextWithClasses} ·{" "}
          {formatClubWeekday(clubDayStart(nextDayKey).toISOString())}{" "}
          {formatClubDayNumber(clubDayStart(nextDayKey).toISOString())}
        </button>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          {strings.classes.emptyDayHint}
        </p>
      )}
    </div>
  );
}

/** The strip: one club day, its classes, and the folio line above them. */
export function ClassStrip({
  dayKey,
  classes,
  nextOpenId,
  nextDayWithClasses,
  onSelectDay,
  now,
}: {
  dayKey: string;
  classes: readonly DecoratedClass[];
  nextOpenId: string | null;
  nextDayWithClasses: string | null;
  onSelectDay: (dayKey: string) => void;
  now: Date;
}) {
  return (
    <section className="mt-6">
      {/* Folio line: the printed-schedule cue that gives the strip an identity
          before any class is read. */}
      <div className="flex items-baseline justify-between border-b border-border pb-2">
        <h2 className="numeric text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          {formatClubDate(clubDayStart(dayKey).toISOString())}
        </h2>
        <span className="numeric text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          {strings.classes.classCount(classes.length)}
        </span>
      </div>

      {classes.length === 0 ? (
        <div className="mt-4">
          <EmptyDay nextDayKey={nextDayWithClasses} onSelectDay={onSelectDay} />
        </div>
      ) : (
        <ol className="mt-4 flex flex-col gap-2">
          {classes.map((item) => (
            <ClassRow
              key={item.session.id}
              item={item}
              isNextOpen={item.session.id === nextOpenId}
              now={now}
            />
          ))}
        </ol>
      )}
    </section>
  );
}
