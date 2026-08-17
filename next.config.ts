import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Registration is done explicitly in components/service-worker.tsx.
  register: false,
  reloadOnOnline: false,
  // Off in dev: webpack's eval source maps duplicate the source, Serwist sees
  // two copies of its injection point and fails the whole compile. Installing
  // the app is verified against `pnpm build && pnpm start` instead.
  disable: process.env.NODE_ENV === "development",
  // ADR-003: installable, but no offline cache. Serwist has no way to skip the
  // precache manifest from this plugin, so instead nothing is allowed into it —
  // no build assets, no files from public/. The worker ends up with an empty
  // precache list, which is the behaviour the ADR asks for.
  exclude: [/.*/],
  globPublicPatterns: [],
});

const nextConfig: NextConfig = {
  async redirects() {
    // The app has no landing page; Wall is home.
    return [{ source: "/", destination: "/wall", permanent: false }];
  },
};

export default withSerwist(nextConfig);
