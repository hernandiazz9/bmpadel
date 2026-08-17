-- ===========================================================================
-- BMPadel — schema
-- ---------------------------------------------------------------------------
-- Versioned in the repo on purpose: the schema is one of the two artefacts
-- that survive the POC (ADR-001), so it is never improvised in the Supabase
-- dashboard. Run this file, then seed.sql, in the SQL editor.
--
-- Destructive: drops and recreates every table. Safe to re-run before a demo.
-- ===========================================================================

-- No extensions needed: gen_random_uuid() has been core Postgres since 13.

drop table if exists "comment" cascade;
drop table if exists "like" cascade;
drop table if exists post cascade;
drop table if exists booking cascade;
drop table if exists class_session cascade;
drop table if exists "user" cascade;

-- ---------------------------------------------------------------------------
-- user
-- ---------------------------------------------------------------------------
-- No foreign key to auth.users, deliberately (CONTEXT.md rule 8): the demo
-- needs eight seeded players who have never signed in with Google. Rows for
-- real people reuse their auth.users uuid as their id, without the constraint.
--
-- `role` is written by the app from NEXT_PUBLIC_COACH_EMAIL on every sign-in
-- (ADR-006) — it is derived state, not something a user edits.
-- `level` stays null until onboarding completes; that null is what triggers
-- the slider on first login.
create table "user" (
  id         uuid primary key default gen_random_uuid(),
  name       text        not null,
  avatar_url text,
  role       text        not null default 'player' check (role in ('coach', 'player')),
  level      numeric(2,1) check (level >= 1.0 and level <= 7.0),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- class_session
-- ---------------------------------------------------------------------------
-- `starts_at` is always UTC (ADR-007); the club timezone lives in the client,
-- in lib/time.ts, and never in the database.
create table class_session (
  id           uuid primary key default gen_random_uuid(),
  coach_id     uuid         not null references "user"(id) on delete cascade,
  title        text         not null,
  type         text         not null check (type in ('group', 'clinic', 'private', 'match_play')),
  level_min    numeric(2,1) not null check (level_min >= 1.0 and level_min <= 7.0),
  level_max    numeric(2,1) not null check (level_max >= 1.0 and level_max <= 7.0),
  starts_at    timestamptz  not null,
  duration_min int          not null check (duration_min > 0),
  court        text         not null,
  capacity     int          not null check (capacity > 0),
  price        numeric(6,2) not null check (price >= 0),
  notes        text,
  created_at   timestamptz  not null default now(),
  check (level_max >= level_min)
);

create index class_session_starts_at_idx on class_session (starts_at);

-- ---------------------------------------------------------------------------
-- booking
-- ---------------------------------------------------------------------------
-- There is deliberately NO constraint tying the number of bookings to
-- `capacity`. The last-slot race is resolved in the client: insert, recount,
-- delete the row that arrived second (ADR-008). A database constraint would
-- make that flow impossible.
--
-- The unique pair below is a different thing — it stops one person booking the
-- same class twice — and does not interfere with the recount.
create table booking (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid        not null references class_session(id) on delete cascade,
  user_id    uuid        not null references "user"(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (session_id, user_id)
);

create index booking_session_id_idx on booking (session_id);
create index booking_user_id_idx on booking (user_id);

-- ---------------------------------------------------------------------------
-- post / like / comment — the wall
-- ---------------------------------------------------------------------------
create table post (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid        not null references "user"(id) on delete cascade,
  body       text        not null,
  media_url  text,
  media_type text        check (media_type in ('image', 'video')),
  created_at timestamptz not null default now()
);

create index post_created_at_idx on post (created_at desc);

-- Composite primary key: a like is a toggle, so the pair is the identity.
create table "like" (
  post_id uuid not null references post(id) on delete cascade,
  user_id uuid not null references "user"(id) on delete cascade,
  primary key (post_id, user_id)
);

create table "comment" (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid        not null references post(id) on delete cascade,
  user_id    uuid        not null references "user"(id) on delete cascade,
  body       text        not null,
  created_at timestamptz not null default now()
);

create index comment_post_id_idx on "comment" (post_id, created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security: off, deliberately (ADR-005)
-- ---------------------------------------------------------------------------
-- A POC behind an unindexed link. Anyone with the link and some curiosity can
-- read and write these tables; the mitigation is that this file plus seed.sql
-- can re-create everything in one command. Do not "fix" this by enabling RLS
-- without reopening ADR-005.
alter table "user"         disable row level security;
alter table class_session  disable row level security;
alter table booking        disable row level security;
alter table post           disable row level security;
alter table "like"         disable row level security;
alter table "comment"      disable row level security;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
-- Only two screens subscribe: the roster of an open class, and the wall.
-- The tables behind them have to be in the publication for that to work, and
-- `replica identity full` is what makes DELETE events carry the old row (a
-- cancelled booking, an un-liked post) instead of just its primary key.
alter table booking   replica identity full;
alter table post      replica identity full;
alter table "like"    replica identity full;
alter table "comment" replica identity full;

do $$
begin
  alter publication supabase_realtime add table booking, post, "like", "comment";
exception
  when duplicate_object then null;  -- already published
  when undefined_object then
    raise notice 'publication supabase_realtime not found — create it or enable Realtime in the dashboard';
end;
$$;
