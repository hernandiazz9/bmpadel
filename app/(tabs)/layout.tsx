"use client";

import { AppGate } from "@/components/app-gate";

/**
 * Every tab route goes through the gate, so screens below can assume a
 * signed-in user who has already picked a level.
 */
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return <AppGate>{children}</AppGate>;
}
