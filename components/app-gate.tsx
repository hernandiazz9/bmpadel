"use client";

import { useAuth } from "@/components/auth-provider";
import { AppShell } from "@/components/app-shell";
import { BallMark } from "@/components/ball-mark";
import { LevelOnboarding } from "@/components/level-onboarding";
import { LoginScreen } from "@/components/login-screen";
import { Button } from "@/components/ui/button";
import { strings } from "@/lib/strings";

/** Brand-coloured hold while the session resolves. */
export function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-primary">
      <BallMark className="size-16 animate-pulse" />
      <p className="text-sm text-primary-foreground/70">
        {strings.common.loading}
      </p>
    </div>
  );
}

/** Shown when .env.local has no Supabase keys yet, instead of crashing. */
function NotConfigured() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col justify-center px-5">
      <h1 className="headline text-3xl">
        {strings.login.notConfiguredTitle}
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        {strings.login.notConfiguredBody}
      </p>
    </div>
  );
}

/** Signed in, but the profile row would not load. Always leaves a way out. */
function SessionError({
  onRetry,
  onSignOut,
}: {
  onRetry: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col justify-center gap-6 px-5">
      <div>
        <h1 className="headline text-3xl">{strings.session.errorTitle}</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {strings.session.errorBody}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Button size="lg" onClick={onRetry}>
          {strings.common.retry}
        </Button>
        <Button size="lg" variant="ghost" onClick={onSignOut}>
          {strings.common.signOut}
        </Button>
      </div>
    </div>
  );
}

/**
 * Decides what a tab route actually renders: the splash, the login screen, the
 * level slider, or the app itself. Everything downstream can assume a signed-in
 * user with a level.
 */
export function AppGate({ children }: { children: React.ReactNode }) {
  const { status, user, refresh, signOut } = useAuth();

  if (status === "unconfigured") return <NotConfigured />;
  if (status === "loading") return <Splash />;
  if (status === "signed-out") return <LoginScreen />;
  if (status === "error") {
    return (
      <SessionError
        onRetry={() => void refresh()}
        onSignOut={() => void signOut()}
      />
    );
  }
  if (user && user.level === null) return <LevelOnboarding />;

  return <AppShell>{children}</AppShell>;
}
