"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  LEVEL_DEFAULT,
  LEVEL_MAX,
  LEVEL_MIN,
  LEVEL_STEP,
  formatLevel,
  levelLabel,
} from "@/lib/level";
import { strings } from "@/lib/strings";
import { setUserLevel } from "@/lib/users";

/**
 * Shown once, on first sign-in, while `user.level` is still null (ADR-006).
 * Self-assessed because there is no Playtomic history to import (ADR-010).
 */
export function LevelOnboarding() {
  const { user, refresh } = useAuth();
  const [level, setLevel] = useState(LEVEL_DEFAULT);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No user");
      await setUserLevel(user.id, level);
    },
    onSuccess: () => refresh(),
  });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col px-5 pt-safe">
      <header className="pt-16">
        <h1 className="headline text-4xl">{strings.onboarding.title}</h1>
        <p className="mt-4 text-base text-muted-foreground">
          {strings.onboarding.body}
        </p>
      </header>

      <div className="flex flex-1 flex-col justify-center py-10">
        <div className="rounded-lg bg-card p-6">
          <div className="flex items-baseline gap-3">
            <span className="numeric text-6xl font-semibold text-primary">
              {formatLevel(level)}
            </span>
            <span className="numeric text-sm text-muted-foreground">
              {formatLevel(LEVEL_MIN)}–{formatLevel(LEVEL_MAX)}
            </span>
          </div>

          <p className="subhead mt-2 min-h-[1.5em] text-lg">
            {levelLabel(level)}
          </p>

          {/* The value has to be an array even though there is one thumb:
              shadcn's Slider counts thumbs off `value`, and a bare number
              makes it fall back to [min, max] and render two of them. */}
          <Slider
            className="mt-8"
            min={LEVEL_MIN}
            max={LEVEL_MAX}
            step={LEVEL_STEP}
            value={[level]}
            onValueChange={(next) => {
              setLevel(Array.isArray(next) ? next[0] : next);
            }}
            aria-label={strings.common.level}
          />

          <p className="mt-6 text-sm text-muted-foreground">
            {strings.onboarding.hint}
          </p>
        </div>
      </div>

      <div className="pb-safe">
        <div className="pb-10">
          <Button
            size="xl"
            className="w-full"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending
              ? strings.onboarding.saving
              : strings.onboarding.confirm}
          </Button>
        </div>
      </div>
    </div>
  );
}
