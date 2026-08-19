"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { ClassStrip } from "@/components/classes/class-strip";
import { DaySelector } from "@/components/classes/day-selector";
import { useClassWindow } from "@/hooks/use-classes";
import { nextOpenClassId } from "@/lib/classes";
import { strings } from "@/lib/strings";

export default function ClassesPage() {
  const { user } = useAuth();
  const isCoach = user?.role === "coach";
  const { dayKeys, byDay, isLoading, isError, now } = useClassWindow();
  const [chosenDay, setChosenDay] = useState<string | null>(null);

  // Defaults to today, but follows the window if it rolls over club midnight
  // while the screen is open.
  const selectedDay = chosenDay && dayKeys.includes(chosenDay) ? chosenDay : dayKeys[0];

  const dayClasses = useMemo(
    () => byDay.get(selectedDay) ?? [],
    [byDay, selectedDay],
  );

  // A coach never books, so on their screen the accent belongs to New class
  // instead. That keeps `ball` at exactly one use per screen for both roles,
  // rather than spending the whole rule 2 ceiling on one view.
  const nextOpenId = useMemo(() => nextOpenClassId(dayClasses), [dayClasses]);

  // For the empty-day shortcut: the first later day that has anything on it.
  const nextDayWithClasses = useMemo(() => {
    const start = dayKeys.indexOf(selectedDay);
    return (
      dayKeys.slice(start + 1).find((key) => (byDay.get(key)?.length ?? 0) > 0) ??
      null
    );
  }, [dayKeys, selectedDay, byDay]);

  return (
    <>
      <div className="flex items-start justify-between pt-8 pb-6">
        <h1 className="headline text-4xl">{strings.nav.classes}</h1>
        {isCoach ? (
          // Classes' single `ball`, and it only exists for the coach. On a
          // player's screen the accent stays reserved for the next class they
          // can still book.
          <Link
            href="/classes/new"
            aria-label={strings.me.newClass}
            className="inline-flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground"
          >
            <Plus className="size-6" aria-hidden />
          </Link>
        ) : null}
      </div>

      <DaySelector
        dayKeys={dayKeys}
        selected={selectedDay}
        countFor={(key) => byDay.get(key)?.length ?? 0}
        onSelect={setChosenDay}
      />

      {isError ? (
        <p className="mt-8 text-sm text-muted-foreground">
          {strings.classes.loadFailed}
        </p>
      ) : isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">
          {strings.common.loading}
        </p>
      ) : (
        <ClassStrip
          dayKey={selectedDay}
          classes={dayClasses}
          nextOpenId={isCoach ? null : nextOpenId}
          nextDayWithClasses={nextDayWithClasses}
          onSelectDay={setChosenDay}
          now={now}
        />
      )}
    </>
  );
}
