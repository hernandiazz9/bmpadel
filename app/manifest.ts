import type { MetadataRoute } from "next";

import { strings } from "@/lib/strings";

/**
 * Next's native manifest route (ADR-003). On iOS this alone is enough for
 * "Add to Home Screen"; Android also wants the service worker before it will
 * offer the install prompt.
 *
 * `background_color` is `court`, matching the splash the app shows while the
 * session resolves, so the launch transition has no colour jump.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: strings.app.name,
    short_name: strings.app.shortName,
    description: strings.app.description,
    start_url: "/wall",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#12405A",
    theme_color: "#DCE7E4",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
