"use client";

import type { RosterEntry } from "@/hooks/use-class-detail";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatLevel } from "@/lib/level";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Who is on court. Real Google faces where there are any — the point of
 * signing in with Google (ADR-006) was that the roster shows people rather
 * than seeded initials.
 *
 * The viewer's own row is marked so they can find themselves without reading
 * every name, which matters when the coach is showing this to eight people.
 */
export function Roster({
  entries,
  viewerId,
}: {
  entries: readonly RosterEntry[];
  viewerId: string | null;
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {strings.classDetail.rosterEmpty}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {entries.map(({ booking, user }) => {
        const isViewer = user !== null && user.id === viewerId;
        return (
          <li key={booking.id} className="flex items-center gap-3">
            <Avatar className="size-10">
              {user?.avatar_url ? (
                <AvatarImage src={user.avatar_url} alt="" />
              ) : null}
              <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
                {user ? initialsOf(user.name) : "?"}
              </AvatarFallback>
            </Avatar>

            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm",
                isViewer ? "font-semibold text-foreground" : "text-foreground",
              )}
            >
              {user?.name ?? ""}
              {isViewer ? (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {strings.classDetail.booked}
                </span>
              ) : null}
            </span>

            {user?.level !== null && user !== null ? (
              <span className="numeric text-xs text-muted-foreground">
                {formatLevel(user.level)}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
