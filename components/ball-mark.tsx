"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

// Same geometry as scripts/generate-icons.mjs, so the in-app mark and the
// installed icon are the same drawing. Ratios are against the ball radius.
const R = 33.2;
const DX = 0.62 * R;
const DY = 0.58 * R;
const SEAM_R = 1.3 * R;
const SEAM_W = 0.07 * R;

/**
 * The BMPadel mark: a ball in `ball` with its seam in `court`.
 *
 * Counts against the two-per-screen `ball` budget (CONTEXT.md rule 2) wherever
 * it appears, so it is used once per screen at most.
 */
export function BallMark({ className }: { className?: string }) {
  const clipId = useId();

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-hidden
      className={cn("block", className)}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={50} cy={50} r={R} />
        </clipPath>
      </defs>
      <circle cx={50} cy={50} r={R} fill="var(--color-ball)" />
      <g
        clipPath={`url(#${clipId})`}
        fill="none"
        stroke="var(--color-court)"
        strokeWidth={SEAM_W}
      >
        <circle cx={50 + DX} cy={50 - DY} r={SEAM_R} />
        <circle cx={50 - DX} cy={50 + DY} r={SEAM_R} />
      </g>
    </svg>
  );
}
