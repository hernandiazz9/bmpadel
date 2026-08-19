"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useNow } from "@/hooks/use-now";
import {
  DAY_WINDOW,
  decorateClasses,
  groupByClubDay,
  type DecoratedClass,
} from "@/lib/classes";
import { supabase } from "@/lib/supabase";
import { clubDayEnd, clubDayKeys, clubDayStart } from "@/lib/time";
import type { Booking, ClassSession } from "@/lib/types";

async function fetchSessions(
  fromIso: string,
  toIso: string,
): Promise<ClassSession[]> {
  const { data, error } = await supabase
    .from("class_session")
    .select("*")
    .gte("starts_at", fromIso)
    .lt("starts_at", toIso)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return data;
}

async function fetchBookings(sessionIds: readonly string[]): Promise<Booking[]> {
  if (sessionIds.length === 0) return [];
  const { data, error } = await supabase
    .from("booking")
    .select("*")
    .in("session_id", sessionIds);
  if (error) throw error;
  return data;
}

export type ClassWindow = {
  /** The 14 club-time day keys the selector offers. */
  dayKeys: string[];
  /** Classes bucketed by club-time day. Days with none are simply absent. */
  byDay: Map<string, DecoratedClass[]>;
  isLoading: boolean;
  isError: boolean;
  now: Date;
};

/**
 * Every class in the visible fortnight, with its bookings counted and its state
 * resolved.
 *
 * Two queries rather than one PostgREST aggregate: the roster in slice 3 needs
 * the booking rows themselves, and keeping them as their own cache entry is
 * what lets Realtime patch them in place later.
 *
 * The bookings query is keyed on the window, not on the id list — the ids are
 * derived from the window, so the shorter key identifies the same data and does
 * not churn.
 */
export function useClassWindow(): ClassWindow {
  const now = useNow();

  // Recomputed as the clock ticks so the window rolls over at club midnight,
  // not at the browser's. The strings are stable within a day, so the query
  // keys below do not churn every minute.
  const dayKeys = useMemo(() => clubDayKeys(DAY_WINDOW, now), [now]);
  const fromIso = clubDayStart(dayKeys[0]).toISOString();
  const toIso = clubDayEnd(dayKeys[dayKeys.length - 1]).toISOString();

  const sessionsQuery = useQuery({
    queryKey: ["class-sessions", fromIso, toIso],
    queryFn: () => fetchSessions(fromIso, toIso),
  });

  const sessionIds = useMemo(
    () => (sessionsQuery.data ?? []).map((session) => session.id),
    [sessionsQuery.data],
  );

  const bookingsQuery = useQuery({
    queryKey: ["bookings", "window", fromIso, toIso],
    queryFn: () => fetchBookings(sessionIds),
    enabled: sessionsQuery.data !== undefined,
  });

  const byDay = useMemo(() => {
    if (!sessionsQuery.data || !bookingsQuery.data) {
      return new Map<string, DecoratedClass[]>();
    }
    return groupByClubDay(
      decorateClasses(sessionsQuery.data, bookingsQuery.data, now),
    );
  }, [sessionsQuery.data, bookingsQuery.data, now]);

  return {
    dayKeys,
    byDay,
    isLoading: sessionsQuery.isPending || bookingsQuery.isPending,
    isError: sessionsQuery.isError || bookingsQuery.isError,
    now,
  };
}
