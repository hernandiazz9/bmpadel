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

## Database

`supabase/schema.sql` then `supabase/seed.sql`, in the Supabase SQL editor.
Both are re-runnable and destructive. Seed times are relative to *now*, so the
deliberate states (one class full, one with a single slot, one in progress, one
empty day) hold whenever you re-seed.
