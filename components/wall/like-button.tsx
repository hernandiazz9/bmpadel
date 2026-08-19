"use client";

import { Heart } from "lucide-react";

import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

/**
 * Like as a toggle. `clay-ink` rather than raw `clay` — the brand clay is
 * 4.29:1 on the card surface, below AA for a label this size.
 */
export function LikeButton({
  liked,
  count,
  disabled,
  onToggle,
}: {
  liked: boolean;
  count: number;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={liked}
      aria-label={liked ? strings.wall.unlike : strings.wall.like}
      className={cn(
        "-m-2 inline-flex items-center gap-2 p-2 transition-colors disabled:opacity-50",
        liked ? "text-clay-ink" : "text-muted-foreground",
      )}
    >
      <Heart
        className="size-5"
        strokeWidth={liked ? 2.25 : 1.75}
        fill={liked ? "currentColor" : "none"}
        aria-hidden
      />
      <span className="numeric text-xs">{count}</span>
    </button>
  );
}
