"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { ScreenHeader } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMyClasses } from "@/hooks/use-my-classes";
import { formatLevel, levelLabel } from "@/lib/level";
import { strings } from "@/lib/strings";
import {
  formatClubDayNumber,
  formatClubTime,
  formatClubWeekday,
} from "@/lib/time";
import type { ClassSession } from "@/lib/types";

export default function MePage() {
  const { user, signOut } = useAuth();
  const isCoach = user?.role === "coach";
  const { classes, isLoading } = useMyClasses(user?.id ?? null, isCoach);

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
            {user.avatar_url ? <AvatarImage src={user.avatar_url} alt="" /> : null}
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="subhead truncate text-xl">{user.name}</p>
            <p className="text-sm text-muted-foreground">
              {isCoach ? strings.common.coach : strings.common.player}
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

      <section className="mt-8">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="subhead text-lg">
            {isCoach ? strings.me.coachClasses : strings.me.upcoming}
          </h2>
          {isCoach ? (
            // The Me tab's single `ball`: the coach's one creative action here.
            <Link
              href="/classes/new"
              aria-label={strings.me.newClass}
              className="inline-flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground"
            >
              <Plus className="size-5" aria-hidden />
            </Link>
          ) : null}
        </div>

        {isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {strings.common.loading}
          </p>
        ) : classes.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {isCoach ? strings.me.coachClassesEmpty : strings.me.upcomingEmpty}
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {classes.map((session) => (
              <MyClassRow key={session.id} session={session} />
            ))}
          </ul>
        )}
      </section>

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

function MyClassRow({ session }: { session: ClassSession }) {
  return (
    <li>
      <Link
        href={`/classes/${session.id}`}
        className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
      >
        <div className="flex flex-col">
          <span className="numeric text-[11px] tracking-wide text-muted-foreground uppercase">
            {formatClubWeekday(session.starts_at)}{" "}
            {formatClubDayNumber(session.starts_at)}
          </span>
          <span className="numeric text-base leading-tight font-semibold">
            {formatClubTime(session.starts_at)}
          </span>
        </div>
        <span className="subhead min-w-0 truncate text-[15px]">
          {session.title}
        </span>
        <span className="numeric text-[11px] text-muted-foreground">
          {session.court}
        </span>
      </Link>
    </li>
  );
}
