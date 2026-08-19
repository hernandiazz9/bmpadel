"use client";

import { useMemo, useState } from "react";

import { ScreenHeader } from "@/components/app-shell";
import { ClassStrip } from "@/components/classes/class-strip";
import { DaySelector } from "@/components/classes/day-selector";
import { useClassWindow } from "@/hooks/use-classes";
import { nextOpenClassId } from "@/lib/classes";
import { strings } from "@/lib/strings";

export default function ClassesPage() {
  const { dayKeys, byDay, isLoading, isError, now } = useClassWindow();
  const [chosenDay, setChosenDay] = useState<string | null>(null);

  // Defaults to today, but follows the window if it rolls over club midnight
  // while the screen is open.
  const selectedDay = chosenDay && dayKeys.includes(chosenDay) ? chosenDay : dayKeys[0];

  const dayClasses = useMemo(
    () => byDay.get(selectedDay) ?? [],
    [byDay, selectedDay],
  );

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
      <ScreenHeader title={strings.nav.classes} />

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
          nextOpenId={nextOpenId}
          nextDayWithClasses={nextDayWithClasses}
          onSelectDay={setChosenDay}
          now={now}
        />
      )}
    </>
  );
}
