"use client";

import { ScreenHeader } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatLevel, levelLabel } from "@/lib/level";
import { strings } from "@/lib/strings";

/**
 * Slice 1 only carries the identity card and sign out — enough to confirm the
 * Google round trip, the role assignment and the saved level, and to swap
 * accounts between the two phones. Bookings arrive in slice 5.
 */
export default function MePage() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <ScreenHeader title={strings.nav.me} />

      <section className="rounded-lg bg-card p-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {user.avatar_url ? (
              <AvatarImage src={user.avatar_url} alt="" />
            ) : null}
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="subhead truncate text-xl">{user.name}</p>
            <p className="text-sm text-muted-foreground">
              {user.role === "coach" ? strings.common.coach : strings.common.player}
            </p>
          </div>
        </div>

        {user.level !== null ? (
          <div className="mt-6 border-t border-border pt-6">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              {strings.common.level}
            </p>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="numeric text-3xl font-semibold text-primary">
                {formatLevel(user.level)}
              </span>
              <span className="text-sm text-muted-foreground">
                {levelLabel(user.level)}
              </span>
            </div>
          </div>
        ) : null}
      </section>

      <p className="mt-6 text-sm text-muted-foreground">
        {strings.placeholder.me}
      </p>

      <Button
        size="lg"
        variant="outline"
        className="mt-8 w-full"
        onClick={() => void signOut()}
      >
        {strings.common.signOut}
      </Button>
    </>
  );
}
