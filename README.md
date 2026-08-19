# BMPadel

Padel app built around the coach: the coach opens classes and posts to a social
wall, players book those classes and comment. POC for an in-person demo on two
phones at once, with shared data in real time.

Domain rules live in [CONTEXT.md](CONTEXT.md), decisions in
[bmpadel-decisiones.md](bmpadel-decisiones.md), scope in
[bmpadel-spec.md](bmpadel-spec.md).

## Setup

### 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. **SQL Editor** → run [`supabase/schema.sql`](supabase/schema.sql), then
   [`supabase/seed.sql`](supabase/seed.sql). Both are destructive and
   re-runnable — run them again any time before a demo to reset the data.
3. **SQL Editor** → run [`supabase/storage.sql`](supabase/storage.sql). It
   creates the public `media` bucket that New post uploads into, with one
   permissive policy scoped to that bucket — storage RLS cannot be switched off
   the way table RLS can (ADR-005).
4. **Authentication → Sign In / Providers → Google**: enable it, and paste the
   client ID and secret from a Google Cloud OAuth 2.0 Web application
   credential. Copy the callback URL Supabase shows you into that credential's
   *Authorised redirect URIs*.
5. **Authentication → URL Configuration**: set *Site URL* to your deploy URL and
   add these to *Redirect URLs*:

   ```
   http://localhost:3000/auth/callback
   https://<your-vercel-domain>/auth/callback
   ```

6. **Database → Publications**: confirm `supabase_realtime` includes `booking`,
   `post`, `like` and `comment`. `schema.sql` adds them, and prints a notice
   instead of failing if the publication is missing.

Row Level Security stays **off** — that is deliberate, see ADR-005.

### 2. Configure the app

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
**Project Settings → API**. `NEXT_PUBLIC_COACH_EMAIL` decides who is the coach.

Until those keys are set the app boots and says so rather than crashing.

### 3. Run

```bash
pnpm install
pnpm dev
```

The service worker is only built in production, so to check that the app
installs from the browser:

```bash
pnpm build && pnpm start
```

## Stack

Next.js App Router (all client components) · Supabase (Postgres, Storage,
Realtime, Google Auth) · React Query · Tailwind v4 · shadcn/ui, rethemed ·
Serwist · pnpm, Node 22+.

Both `dev` and `build` run webpack rather than Turbopack, because
`@serwist/next` does not support Turbopack yet.
