"use client";

import { BottomNav } from "@/components/bottom-nav";

/**
 * The frame every signed-in screen sits in: 480px wide at most, 20px side
 * margins, bottom nav clearance. Vertical rhythm is 8px, so spacing utilities
 * stay on even steps (`py-2`, `gap-4`, `mt-6`…).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col">
      {/* Bottom padding clears the 64px nav plus the home indicator. */}
      <main className="flex-1 px-5 pt-safe pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}

/** Screen title block, shared by the three tabs. */
export function ScreenHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="pt-8 pb-6">
      <h1 className="headline text-4xl">{title}</h1>
      {subtitle ? (
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </header>
  );
}
