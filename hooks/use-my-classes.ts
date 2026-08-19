"use client";

import { useQuery } from "@tanstack/react-query";

import { useNow } from "@/hooks/use-now";
import { supabase } from "@/lib/supabase";
import type { ClassSession } from "@/lib/types";

/**
 * What the Me tab shows, which depends on who is looking.
 *
 * A player sees the classes they are booked onto; the coach sees the ones they
 * opened. Both lists are upcoming-only — there is no history in this POC.
 */
async function fetchBookedClasses(
  userId: string,
  fromIso: string,
): Promise<ClassSession[]> {
  const { data: bookings, error } = await supabase
    .from("booking")
    .select("session_id")
    .eq("user_id", userId);
  if (error) throw error;
  if (bookings.length === 0) return [];

  const { data, error: sessionsError } = await supabase
    .from("class_session")
    .select("*")
    .in("id", bookings.map((booking) => booking.session_id))
    .gte("starts_at", fromIso)
    .order("starts_at", { ascending: true });
  if (sessionsError) throw sessionsError;
  return data;
}

async function fetchCoachClasses(
  coachId: string,
  fromIso: string,
): Promise<ClassSession[]> {
  const { data, error } = await supabase
    .from("class_session")
    .select("*")
    .eq("coach_id", coachId)
    .gte("starts_at", fromIso)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return data;
}

export function useMyClasses(userId: string | null, isCoach: boolean) {
  const now = useNow();
  // Rounded to the minute so the key does not change on every tick.
  const fromIso = new Date(Math.floor(now.getTime() / 60_000) * 60_000).toISOString();

  const query = useQuery({
    queryKey: ["my-classes", userId, isCoach, fromIso],
    enabled: userId !== null,
    queryFn: () =>
      isCoach
        ? fetchCoachClasses(userId as string, fromIso)
        : fetchBookedClasses(userId as string, fromIso),
  });

  return {
    classes: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    now,
  };
}
