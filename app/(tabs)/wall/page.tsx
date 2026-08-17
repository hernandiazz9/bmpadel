"use client";

import { ScreenHeader } from "@/components/app-shell";
import { strings } from "@/lib/strings";

export default function WallPage() {
  return (
    <>
      <ScreenHeader title={strings.nav.wall} />
      <p className="text-sm text-muted-foreground">{strings.placeholder.wall}</p>
    </>
  );
}
