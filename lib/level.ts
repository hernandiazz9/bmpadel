/**
 * Player level: decimal 1.0–7.0 in 0.5 steps (ADR-010).
 *
 * A player has one value; a class has a `level_min`–`level_max` range. Booking
 * outside a class range is always allowed — the range only drives a soft hint.
 */

import { strings, type LevelLabelKey } from "@/lib/strings";

export const LEVEL_MIN = 1;
export const LEVEL_MAX = 7;
export const LEVEL_STEP = 0.5;

/** Sensible starting point for the onboarding slider: mid-scale club player. */
export const LEVEL_DEFAULT = 3;

/** `3` → `"3.0"`, `3.5` → `"3.5"`. Always one decimal, mono-friendly. */
export function formatLevel(level: number): string {
  return level.toFixed(1);
}

/** Descriptive label for a level value, e.g. `3.5` → "Controls the point". */
export function levelLabel(level: number): string {
  const key = String(level) as LevelLabelKey;
  return strings.levelLabels[key] ?? "";
}
