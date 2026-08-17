/**
 * The brand tokens as literals, for the handful of places that cannot read a
 * CSS variable: the PWA manifest and the viewport `theme-color`.
 *
 * `app/globals.css` is the source of truth — these must match it. Changing
 * either needs a new ADR (CONTEXT.md rule 10).
 */

export const TOKENS = {
  court: "#12405A",
  deep: "#0A1F2C",
  glass: "#DCE7E4",
  line: "#F6F9F8",
  ball: "#D3E04B",
  clay: "#B85C38",
} as const;
