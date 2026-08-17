"use client";

import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { BallMark } from "@/components/ball-mark";
import { Button } from "@/components/ui/button";
import { strings } from "@/lib/strings";

/**
 * Full-bleed `court` screen. The mark is the single `ball` on it, which keeps
 * the loudest colour inside its two-per-screen budget.
 */
export function LoginScreen() {
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleSignIn() {
    setBusy(true);
    setFailed(false);
    try {
      await signIn();
      // On success the browser navigates to Google, so `busy` stays true.
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-primary text-primary-foreground">
      <div className="mx-auto flex w-full max-w-app flex-1 flex-col px-5 pt-safe">
        <div className="flex flex-1 flex-col justify-end pb-10">
          <BallMark className="size-24" />
          <h1 className="headline mt-6 text-6xl">{strings.app.name}</h1>
          {/* 16ch keeps the break between the two sentences. */}
          <p className="mt-4 max-w-[16ch] text-lg text-primary-foreground/70">
            {strings.login.tagline}
          </p>
        </div>

        <div className="pb-safe">
          <div className="pb-10">
            <Button
              size="xl"
              variant="secondary"
              className="w-full"
              disabled={busy}
              onClick={handleSignIn}
            >
              {busy ? strings.login.signingIn : strings.login.signInWithGoogle}
            </Button>
            {failed ? (
              <p className="mt-4 text-center text-sm text-primary-foreground/70">
                {strings.login.failed}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
