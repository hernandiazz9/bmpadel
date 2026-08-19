"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { Roster } from "@/components/classes/roster";
import { Button } from "@/components/ui/button";
import { useClassDetail } from "@/hooks/use-class-detail";
import { hasStarted, isOutsideLevelRange } from "@/lib/classes";
import { ClassFullError } from "@/lib/bookings";
import { formatLevel } from "@/lib/level";
import { strings } from "@/lib/strings";
import { classEndsAt, formatClubDate, formatClubTime, formatDuration } from "@/lib/time";

export default function ClassDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const viewerId = user?.id ?? null;
  const detail = useClassDetail(params.id, viewerId);
  const [failure, setFailure] = useState<string | null>(null);

  const { session, roster, booked, slots, isViewerBooked, now, book, cancel } = detail;

  if (detail.notFound) {
    return (
      <div className="pt-10">
        <BackLink />
        <p className="mt-8 text-sm text-muted-foreground">
          {strings.classDetail.notFound}
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="pt-10">
        <BackLink />
        <p className="mt-8 text-sm text-muted-foreground">
          {detail.isError ? strings.classes.loadFailed : strings.common.loading}
        </p>
      </div>
    );
  }

  const started = hasStarted(session, now);
  const over = now >= classEndsAt(session.starts_at, session.duration_min);
  const isCoach = user?.role === "coach";
  const offRange = isOutsideLevelRange(session, user?.level ?? null);

  async function onBook() {
    setFailure(null);
    try {
      await book.mutateAsync();
    } catch (error) {
      // The ADR-008 loser gets the honest message, not a generic failure.
      setFailure(
        error instanceof ClassFullError
          ? strings.classDetail.classFull
          : strings.classDetail.failed,
      );
    }
  }

  async function onCancel() {
    setFailure(null);
    try {
      await cancel.mutateAsync();
    } catch {
      setFailure(strings.classDetail.failed);
    }
  }

  return (
    <div className="pt-10 pb-4">
      <BackLink />

      <header className="mt-6">
        <p className="numeric text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          {formatClubDate(session.starts_at)}
        </p>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="numeric text-4xl leading-none font-semibold text-primary">
            {formatClubTime(session.starts_at)}
          </span>
          <span className="numeric text-sm text-muted-foreground">
            {formatDuration(session.duration_min)}
          </span>
        </div>
        <h1 className="headline mt-4 text-3xl">{session.title}</h1>
      </header>

      <dl className="mt-6 grid grid-cols-3 gap-4 rounded-lg bg-card p-5">
        <Fact label={strings.classDetail.court} value={session.court} />
        <Fact
          label={strings.common.level}
          value={strings.classes.levelRange(
            formatLevel(session.level_min),
            formatLevel(session.level_max),
          )}
        />
        <Fact
          label={strings.classDetail.priceLabel}
          value={strings.classDetail.price(session.price.toFixed(0))}
        />
      </dl>

      {session.notes ? (
        <p className="mt-4 text-sm text-muted-foreground">{session.notes}</p>
      ) : null}

      {offRange && !isCoach ? (
        <p className="mt-4 rounded-lg bg-secondary px-4 py-3 text-sm text-secondary-foreground">
          {strings.classDetail.levelHint(
            strings.classes.levelRange(
              formatLevel(session.level_min),
              formatLevel(session.level_max),
            ),
          )}
        </p>
      ) : null}

      <section className="mt-8">
        <div className="flex items-baseline justify-between border-b border-border pb-2">
          <h2 className="subhead text-lg">{strings.classDetail.roster}</h2>
          <span className="numeric text-xs text-muted-foreground">
            {strings.classDetail.occupancy(booked, session.capacity)}
          </span>
        </div>
        <div className="mt-4">
          <Roster entries={roster} viewerId={viewerId} />
        </div>
      </section>

      {failure ? (
        <p className="mt-6 text-sm text-destructive">{failure}</p>
      ) : null}

      <div className="mt-8">
        <ClassAction
          isCoach={isCoach}
          started={started}
          over={over}
          isViewerBooked={isViewerBooked}
          slots={slots}
          isBooking={book.isPending}
          isCancelling={cancel.isPending}
          onBook={onBook}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/classes"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground"
    >
      <ChevronLeft className="size-4" aria-hidden />
      {strings.classDetail.back}
    </Link>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="numeric mt-1 text-base font-medium">{value}</dd>
    </div>
  );
}

/**
 * The single call to action, or the reason there isn't one.
 *
 * `Book` is the screen's one `ball`: `deep` on `ball` measures 11.67:1, so the
 * accent finally gets to be a button rather than a decoration.
 */
function ClassAction({
  isCoach,
  started,
  over,
  isViewerBooked,
  slots,
  isBooking,
  isCancelling,
  onBook,
  onCancel,
}: {
  isCoach: boolean;
  started: boolean;
  over: boolean;
  isViewerBooked: boolean;
  slots: number;
  isBooking: boolean;
  isCancelling: boolean;
  onBook: () => void;
  onCancel: () => void;
}) {
  if (isCoach) {
    return (
      <p className="text-sm text-muted-foreground">
        {strings.classDetail.coachNote}
      </p>
    );
  }

  if (over) {
    return (
      <p className="text-sm text-muted-foreground">
        {strings.classDetail.finished}
      </p>
    );
  }

  // Cancelling stays open right up to the start, with no penalty.
  if (isViewerBooked) {
    if (started) {
      return (
        <p className="text-sm text-muted-foreground">
          {strings.classDetail.started}
        </p>
      );
    }
    return (
      <Button
        size="xl"
        variant="outline"
        className="w-full"
        disabled={isCancelling}
        onClick={onCancel}
      >
        {isCancelling ? strings.classDetail.cancelling : strings.classDetail.cancel}
      </Button>
    );
  }

  if (started) {
    return (
      <p className="text-sm text-muted-foreground">
        {strings.classDetail.started}
      </p>
    );
  }

  if (slots === 0) {
    return (
      <Button size="xl" className="w-full" disabled>
        {strings.classDetail.full}
      </Button>
    );
  }

  return (
    <Button
      size="xl"
      className="w-full bg-accent text-accent-foreground hover:bg-accent/85"
      disabled={isBooking}
      onClick={onBook}
    >
      {isBooking ? strings.classDetail.booking : strings.classDetail.book}
    </Button>
  );
}
