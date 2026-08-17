"use client";

import type { Session } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import type { AppUser } from "@/lib/types";
import { ensureAppUser } from "@/lib/users";

type AuthStatus =
  | "loading"
  | "unconfigured"
  | "signed-out"
  | "signed-in"
  /** Signed in with Google, but the `user` row could not be read or created. */
  | "error";

interface AuthValue {
  status: AuthStatus;
  session: Session | null;
  /** The domain row, not the Google identity. Null while it is still resolving. */
  user: AppUser | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-reads the domain row, e.g. after onboarding writes a level. */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let active = true;

    // `detectSessionInUrl` has already consumed the OAuth code by the time this
    // resolves, so the redirect back from Google lands here as a live session.
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setSessionReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setSessionReady(true);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const authUserId = session?.user.id ?? null;

  const userQuery = useQuery({
    queryKey: ["app-user", authUserId],
    enabled: isSupabaseConfigured && session !== null,
    queryFn: () => {
      if (!session) throw new Error("No session");
      return ensureAppUser(session);
    },
  });

  const signIn = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  }, [queryClient]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["app-user", authUserId] });
  }, [queryClient, authUserId]);

  // Order matters: the error branch sits ahead of the fallback `loading`, or a
  // failed profile read would hold the app on the splash screen forever.
  const status: AuthStatus = !isSupabaseConfigured
    ? "unconfigured"
    : !sessionReady
      ? "loading"
      : !session
        ? "signed-out"
        : userQuery.data
          ? "signed-in"
          : userQuery.isError
            ? "error"
            : "loading";

  const value = useMemo<AuthValue>(
    () => ({
      status,
      session,
      user: userQuery.data ?? null,
      signIn,
      signOut,
      refresh,
    }),
    [status, session, userQuery.data, signIn, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
