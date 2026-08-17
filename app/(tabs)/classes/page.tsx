"use client";

import { ScreenHeader } from "@/components/app-shell";
import { strings } from "@/lib/strings";

export default function ClassesPage() {
  return (
    <>
      <ScreenHeader title={strings.nav.classes} />
      <p className="text-sm text-muted-foreground">
        {strings.placeholder.classes}
      </p>
    </>
  );
}
