/// <reference lib="webworker" />

import { Serwist, type PrecacheEntry } from "serwist";

declare global {
  interface WorkerGlobalScope {
    /**
     * Serwist replaces this symbol with the generated precache manifest at
     * build time. next.config.ts configures that manifest to come out empty.
     */
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * The minimum service worker that makes the app installable on Android.
 *
 * Deliberately caches nothing: ADR-003 rules out offline support, and a
 * precached shell during a live demo is a way to serve a stale build to the
 * room. `exclude` and `globPublicPatterns` in next.config.ts empty the manifest
 * out, so `self.__SW_MANIFEST` resolves to `[]` — the injection point Serwist
 * insists on exists, with nothing in it.
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  runtimeCaching: [],
  skipWaiting: true,
  clientsClaim: true,
});

serwist.addEventListeners();
