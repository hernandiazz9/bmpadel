# BMPadel

Padel app built around the coach. POC for an in-person demo on two phones at
once, with shared data in real time.

## Read first

- `CONTEXT.md` — domain glossary and invariant rules. Read before touching any
  screen.
- `bmpadel-decisiones.md` — the ADRs. Decisions here are settled; reopen one
  with a new ADR rather than working around it.
- `bmpadel-spec.md` — the five vertical slices and their acceptance criteria.

Those three are the source of truth. Do not restate or relitigate them here.

## Working agreement

- One slice at a time, in the order the spec fixes. Do not pull work forward
  from a later slice.
- No new dependencies outside the closed stack without asking first.
- No colour or type token changes without a new ADR.

## Commands

```bash
pnpm dev      # webpack, not Turbopack — see below
pnpm build
pnpm start
pnpm lint
pnpm icons    # regenerates public/icons from the brand tokens
```

## Things that will bite you

- **webpack, not Turbopack.** Next 16 defaults to Turbopack, and `@serwist/next`
  does not support it. Both `dev` and `build` pass `--webpack`. Serwist is also
  disabled in development, so the service worker only exists in a production
  build — verify installability with `pnpm build && pnpm start`.
- **`NEXT_PUBLIC_COACH_EMAIL`, not `COACH_EMAIL`.** The app is all client
  components, so the role check runs in the browser and the variable needs the
  public prefix to exist there at all.
- **Domain types are type aliases, never interfaces.** Supabase's `Database`
  generic needs every Row to satisfy `Record<string, unknown>`; TypeScript only
  gives implicit index signatures to type aliases. An interface silently
  collapses every query result to `never`.
- **`user` and `like` are reserved words** in Postgres. They are quoted in the
  SQL files. PostgREST quotes them for you, so `.from("user")` is fine.
- **shadcn's `Slider` counts thumbs off `value`.** Pass an array even for a
  single thumb, or it falls back to `[min, max]` and renders two.
- **`clay` and `ball` are not ink colours.** Measured on the real tokens: raw
  `clay` is 4.29:1 on `line` and 3.59:1 on `glass` — both below AA for normal
  text — so body-size clay uses the derived `--clay-ink`. `ball` on `line` is
  1.36:1, a hue cue rather than a luminance one; it only reads as an accent
  against `court` (7.62:1) or `deep`. That is why the next bookable class
  inverts its whole row to navy instead of wearing a yellow chip.
- **Dim with ink tokens, never `opacity-*`.** Opacity compounds on already
  muted text and drags borders down with it.

## Database

`supabase/schema.sql` then `supabase/seed.sql`, in the Supabase SQL editor.
Both are re-runnable and destructive. Seed times are relative to *now*, so the
deliberate states (one class full, one with a single slot, one in progress, one
empty day) hold whenever you re-seed.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
