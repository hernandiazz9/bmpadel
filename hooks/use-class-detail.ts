"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useNow } from "@/hooks/use-now";
import { bookClass, cancelBooking } from "@/lib/bookings";
import { supabase } from "@/lib/supabase";
import type { AppUser, Booking, ClassSession } from "@/lib/types";

export type RosterEntry = {
  booking: Booking;
  /** Null only if the booking outlived its user row, which the FK prevents. */
  user: AppUser | null;
};

async function fetchSession(sessionId: string): Promise<ClassSession | null> {
  const { data, error } = await supabase
    .from("class_session")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * The roster: who is booked, with their names and faces.
 *
 * Two queries rather than a PostgREST embed — a class holds at most a handful
 * of people, and keeping the booking rows as their own cache entry is what
 * lets the Realtime handler below patch them without re-deriving anything.
 */
async function fetchRoster(sessionId: string): Promise<RosterEntry[]> {
  const { data: bookings, error } = await supabase
    .from("booking")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (bookings.length === 0) return [];

  const { data: users, error: usersError } = await supabase
    .from("user")
    .select("*")
    .in("id", bookings.map((booking) => booking.user_id));
  if (usersError) throw usersError;

  const byId = new Map(users.map((user) => [user.id, user]));
  return bookings.map((booking) => ({
    booking,
    user: byId.get(booking.user_id) ?? null,
  }));
}

/**
 * One class, its roster, and the actions on it — live.
 *
 * This is one of only two places in the app that subscribe to Realtime (the
 * wall is the other). Everywhere else a normal React Query refetch is enough.
 * The subscription invalidates rather than patching by hand: the payload for a
 * new booking carries no user row, and re-reading a roster of eight is cheaper
 * than keeping a merge function honest.
 */
export function useClassDetail(sessionId: string, viewerId: string | null) {
  const queryClient = useQueryClient();
  const now = useNow();

  const sessionQuery = useQuery({
    queryKey: ["class-session", sessionId],
    queryFn: () => fetchSession(sessionId),
  });

  const rosterQuery = useQuery({
    queryKey: ["class-roster", sessionId],
    queryFn: () => fetchRoster(sessionId),
  });

  useEffect(() => {
    const channel = supabase
      .channel(`roster:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "booking",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ["class-roster", sessionId],
          });
          // The strip behind this screen counts the same bookings.
          void queryClient.invalidateQueries({ queryKey: ["bookings"] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);

  const session = sessionQuery.data ?? null;
  const roster = rosterQuery.data ?? [];
  const booked = roster.length;
  const slots = session ? Math.max(0, session.capacity - booked) : 0;
  const viewerBooking =
    viewerId === null
      ? null
      : (roster.find((entry) => entry.booking.user_id === viewerId) ?? null);

  const book = useMutation({
    mutationFn: async () => {
      if (!session || !viewerId) throw new Error("Not ready");
      return bookClass(sessionId, viewerId, session.capacity);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["class-roster", sessionId] });
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  const cancel = useMutation({
    mutationFn: async () => {
      if (!viewerId) throw new Error("Not ready");
      return cancelBooking(sessionId, viewerId);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["class-roster", sessionId] });
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  return {
    session,
    roster,
    booked,
    slots,
    isViewerBooked: viewerBooking !== null,
    isLoading: sessionQuery.isPending || rosterQuery.isPending,
    isError: sessionQuery.isError || rosterQuery.isError,
    notFound: sessionQuery.isSuccess && sessionQuery.data === null,
    now,
    book,
    cancel,
  };
}
