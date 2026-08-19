"use client";

import { useEffect, useState } from "react";

/**
 * A clock that ticks, so "in progress" and "the next class with a slot" stay
 * true while the screen is open instead of freezing at first render.
 *
 * A minute is plenty: the states it drives change on class boundaries, not on
 * seconds. The initial value is produced inside the initialiser so the first
 * render on the client is the first time it is read at all.
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
