"use client";

import { useEffect, useRef } from "react";

import { strings } from "@/lib/strings";
import { formatClubDayNumber, formatClubWeekday, clubDayStart } from "@/lib/time";
import { cn } from "@/lib/utils";

/**
 * Today plus the next 13 club days, as a horizontal rail.
 *
 * Days that have classes carry a small `clay` dot. That is additive rather
 * than dimming the empty ones: the seed keeps one day deliberately empty, and
 * a dot tells you which days are worth tapping before you tap any of them.
 * `clay-ink` rather than raw `clay` — the brand clay only measures 3.6:1 on
 * the page background.
 */
export function DaySelector({
  dayKeys,
  selected,
  countFor,
  onSelect,
}: {
  dayKeys: readonly string[];
  selected: string;
  countFor: (dayKey: string) => number;
  onSelect: (dayKey: string) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Keep the chosen day on screen when it changes from outside the rail —
  // the empty-day shortcut can jump several days forward.
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [selected]);

  return (
    <div
      ref={railRef}
      // Bleeds past the 20px page margin so the rail runs edge to edge while
      // the first and last chips still align with the content.
      className="-mx-5 overflow-x-auto px-5 no-scrollbar"
    >
      <div className="flex gap-2">
        {dayKeys.map((dayKey, index) => {
          const active = dayKey === selected;
          const iso = clubDayStart(dayKey).toISOString();
          const hasClasses = countFor(dayKey) > 0;

          return (
            <button
              key={dayKey}
              ref={active ? activeRef : undefined}
              type="button"
              onClick={() => onSelect(dayKey)}
              aria-pressed={active}
              className={cn(
                "flex h-16 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground",
              )}
            >
              <span
                className={cn(
                  "numeric text-[10px] tracking-wide uppercase",
                  active ? "text-primary-foreground/70" : "text-muted-foreground",
                )}
              >
                {index === 0
                  ? strings.classes.today
                  : formatClubWeekday(iso)}
              </span>
              <span className="numeric text-lg leading-none font-semibold">
                {formatClubDayNumber(iso)}
              </span>
              <span
                aria-hidden
                className={cn(
                  "size-1 rounded-full",
                  !hasClasses
                    ? "bg-transparent"
                    : active
                      ? "bg-primary-foreground/60"
                      : "bg-clay-ink",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
