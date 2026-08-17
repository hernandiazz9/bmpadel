"use client";

import { useEffect } from "react";

/**
 * Registers the Serwist-built worker by hand rather than letting the plugin
 * inject a script, so registration is visible in the codebase and stays a
 * client component like everything else (ADR-004).
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // The worker only exists after a build; in dev this simply 404s.
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Nothing to recover: without it the app still runs, it just cannot be
      // installed from Android's prompt.
    });
  }, []);

  return null;
}
