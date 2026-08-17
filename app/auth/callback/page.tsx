"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Splash } from "@/components/app-gate";
import { useAuth } from "@/components/auth-provider";

/**
 * Where Google sends the browser back. The Supabase client has already
 * swapped the PKCE code for a session by the time this mounts
 * (`detectSessionInUrl`), so there is nothing to do but wait for the provider
 * to settle and move on — no route handler involved (ADR-004).
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "loading") return;
    router.replace("/wall");
  }, [status, router]);

  return <Splash />;
}
