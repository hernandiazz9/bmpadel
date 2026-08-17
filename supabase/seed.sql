-- ===========================================================================
-- BMPadel — seed
-- ---------------------------------------------------------------------------
-- 1 coach · 8 players · 12 classes · 5 posts, with four deliberate states:
--   · one class FULL            (Advanced Clinic, capacity 4, 4 bookings)
--   · one class with 1 SLOT     (Evening Group, capacity 6, 5 bookings)
--   · one class IN PROGRESS     (Cardio Drills, started 25 min ago)
--   · one EMPTY DAY             (day +2 has nothing on it)
--
-- Times are computed relative to *now* rather than pinned to a date, so the
-- seed is demo-ready whenever it runs. Run after schema.sql. Safe to re-run.
--
-- PLACEHOLDER DATA: court names, class types, prices (AUD) and people are
-- invented pending the club questionnaire. Replace before the real demo.
-- ===========================================================================

truncate table "comment", "like", post, booking, class_session, "user" restart identity cascade;

-- Club-local slot helper: bmpadel_slot(0, 7) is 07:00 today in Perth,
-- bmpadel_slot(3, 19.5) is 19:30 three days from now. Returns UTC, because
-- that is all the database ever stores (ADR-007).
create or replace function bmpadel_slot(day_offset int, hour_of_day numeric)
returns timestamptz
language sql
stable
as $$
  select (date_trunc('day', (now() at time zone 'Australia/Perth')) at time zone 'Australia/Perth')
       + make_interval(mins => (day_offset * 1440 + hour_of_day * 60)::int);
$$;

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------
-- These uuids are invented, not auth.users ids — that is the whole point of
-- rule 8. When a real person signs in with Google the app inserts a separate
-- row keyed by their auth uuid.
insert into "user" (id, name, avatar_url, role, level) values
  ('a0000000-0000-4000-8000-000000000001', 'Nico Alvarez',
   'https://api.dicebear.com/9.x/initials/svg?seed=Nico%20Alvarez&backgroundColor=12405A&textColor=F6F9F8', 'coach', 6.5),

  ('b0000000-0000-4000-8000-000000000001', 'Aisha Rahman',
   'https://api.dicebear.com/9.x/initials/svg?seed=Aisha%20Rahman&backgroundColor=12405A&textColor=F6F9F8', 'player', 3.5),
  ('b0000000-0000-4000-8000-000000000002', 'Ben Whitlock',
   'https://api.dicebear.com/9.x/initials/svg?seed=Ben%20Whitlock&backgroundColor=0A1F2C&textColor=F6F9F8', 'player', 4.0),
  ('b0000000-0000-4000-8000-000000000003', 'Chloe Nguyen',
   'https://api.dicebear.com/9.x/initials/svg?seed=Chloe%20Nguyen&backgroundColor=B85C38&textColor=F6F9F8', 'player', 2.5),
  ('b0000000-0000-4000-8000-000000000004', 'Diego Ferrer',
   'https://api.dicebear.com/9.x/initials/svg?seed=Diego%20Ferrer&backgroundColor=12405A&textColor=F6F9F8', 'player', 5.0),
  ('b0000000-0000-4000-8000-000000000005', 'Elena Kovac',
   'https://api.dicebear.com/9.x/initials/svg?seed=Elena%20Kovac&backgroundColor=0A1F2C&textColor=F6F9F8', 'player', 3.0),
  ('b0000000-0000-4000-8000-000000000006', 'Finn O''Leary',
   'https://api.dicebear.com/9.x/initials/svg?seed=Finn%20OLeary&backgroundColor=B85C38&textColor=F6F9F8', 'player', 4.5),
  ('b0000000-0000-4000-8000-000000000007', 'Grace Tanaka',
   'https://api.dicebear.com/9.x/initials/svg?seed=Grace%20Tanaka&backgroundColor=12405A&textColor=F6F9F8', 'player', 2.0),
  ('b0000000-0000-4000-8000-000000000008', 'Hugo Marchetti',
   'https://api.dicebear.com/9.x/initials/svg?seed=Hugo%20Marchetti&backgroundColor=0A1F2C&textColor=F6F9F8', 'player', 5.5);

-- ---------------------------------------------------------------------------
-- Classes
-- ---------------------------------------------------------------------------
-- Capacity/price follow the per-type defaults the New class form will prefill:
--   group 8 / $25 · clinic 6 / $35 · private 2 / $90 · match_play 4 / $20
insert into class_session
  (id, coach_id, title, type, level_min, level_max, starts_at, duration_min, court, capacity, price, notes)
values
  -- Today, anchored to now() so the state holds whenever the seed is run.
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Cardio Drills', 'group', 2.5, 4.0,
   now() - interval '25 minutes',          -- IN PROGRESS
   60, 'Court 2', 8, 25.00, 'High tempo. Bring a towel.'),

  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   'Advanced Clinic', 'clinic', 4.5, 6.0,
   now() + interval '2 hours',             -- FULL (capacity 4, 4 bookings)
   60, 'Court 1', 4, 35.00, 'Bandeja and vibora work.'),

  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
   'Evening Group', 'group', 3.0, 4.5,
   now() + interval '4 hours',             -- 1 SLOT LEFT (capacity 6, 5 bookings)
   90, 'Court 3', 6, 25.00, null),

  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001',
   'Sunrise Drills', 'group', 2.0, 3.5,
   bmpadel_slot(0, 7), 60, 'Court 2', 8, 25.00, null),

  -- Day +1
  ('c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001',
   'Morning Group', 'group', 2.0, 3.5,
   bmpadel_slot(1, 9), 60, 'Court 1', 8, 25.00, null),
  ('c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001',
   'After Work Clinic', 'clinic', 3.5, 5.0,
   bmpadel_slot(1, 18), 60, 'Court 3', 6, 35.00, 'Focus on the back glass.'),
  ('c0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001',
   'Match Play', 'match_play', 3.0, 5.0,
   bmpadel_slot(1, 19.5), 90, 'Court 4', 4, 20.00, null),

  -- Day +2 is deliberately empty.

  -- Day +3
  ('c0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000001',
   'Technique Lab', 'clinic', 2.5, 4.0,
   bmpadel_slot(3, 10), 60, 'Court 2', 6, 35.00, null),
  ('c0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000001',
   'Doubles Group', 'group', 3.0, 4.5,
   bmpadel_slot(3, 19), 90, 'Court 1', 8, 25.00, null),

  -- Day +4
  ('c0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000001',
   'Sunrise Drills', 'group', 2.0, 3.5,
   bmpadel_slot(4, 7), 60, 'Court 2', 8, 25.00, null),
  ('c0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000001',
   'Private Session', 'private', 1.0, 7.0,
   bmpadel_slot(4, 18.5), 60, 'Court 4', 2, 90.00, 'One on one, any level.'),

  -- Day +6
  ('c0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000001',
   'Weekend Social', 'match_play', 2.0, 4.0,
   bmpadel_slot(6, 11), 120, 'Court 3', 4, 20.00, 'Rotating pairs, everyone plays.');

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
insert into booking (session_id, user_id)
select c.id, u.id
from (values
  -- IN PROGRESS — 5 of 8
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003'),
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000004'),
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000005'),

  -- FULL — 4 of 4
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000006'),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000008'),

  -- 1 SLOT LEFT — 5 of 6
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000003'),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000004'),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000005'),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000007'),

  -- The rest, comfortably open
  ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000006'),
  ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000007'),

  ('c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000003'),
  ('c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000008'),

  ('c0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000004'),
  ('c0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000005'),

  ('c0000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000006'),

  ('c0000000-0000-4000-8000-000000000008', 'b0000000-0000-4000-8000-000000000007'),
  ('c0000000-0000-4000-8000-000000000008', 'b0000000-0000-4000-8000-000000000008'),

  -- c…009 is left with zero bookings on purpose.

  ('c0000000-0000-4000-8000-000000000010', 'b0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000003'),

  ('c0000000-0000-4000-8000-000000000012', 'b0000000-0000-4000-8000-000000000004'),
  ('c0000000-0000-4000-8000-000000000012', 'b0000000-0000-4000-8000-000000000006')
) as pair(session_id, user_id)
join class_session c on c.id = pair.session_id::uuid
join "user" u on u.id = pair.user_id::uuid;

-- ---------------------------------------------------------------------------
-- Wall
-- ---------------------------------------------------------------------------
insert into post (id, author_id, body, media_url, media_type, created_at) values
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Two spots opened up for tonight''s Evening Group. First in, first served.',
   null, null, now() - interval '3 hours'),

  ('d0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   'Saturday social was a full house. Same time next week.',
   'https://picsum.photos/seed/bmpadel-social/900/1200', 'image', now() - interval '1 day'),

  ('d0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
   'Reminder: the back glass is your friend. Let it come to you, then lift.',
   null, null, now() - interval '2 days'),

  ('d0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001',
   'New nets on Courts 1 and 2. Come and break them in.',
   'https://picsum.photos/seed/bmpadel-courts/900/900', 'image', now() - interval '4 days'),

  ('d0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001',
   'Adding a 7am drills slot on weekdays. Tell me which days you want it.',
   null, null, now() - interval '6 days');

insert into "like" (post_id, user_id) values
  ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002'),
  ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000005'),
  ('d0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001'),
  ('d0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000003'),
  ('d0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000004'),
  ('d0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000006'),
  ('d0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000007'),
  ('d0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000008');

insert into "comment" (post_id, user_id, body, created_at) values
  ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000006',
   'Just grabbed one. See you at 7.', now() - interval '2 hours'),
  ('d0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000003',
   'Best session in months.', now() - interval '20 hours'),
  ('d0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000008',
   'Who is in for next Saturday?', now() - interval '18 hours'),
  ('d0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000001',
   'Tuesday and Thursday for me.', now() - interval '5 days');

drop function bmpadel_slot(int, numeric);

-- ---------------------------------------------------------------------------
-- After the coach signs in with Google for the first time
-- ---------------------------------------------------------------------------
-- Signing in creates a second coach row keyed by the Google auth uuid, while
-- the seeded classes and posts still point at 'Nico Alvarez'. That is fine for
-- reading, but "my open classes" in Me will look empty. To hand the seeded
-- content over to the real account, run:
--
--   update class_session
--      set coach_id = (select id from "user" where role = 'coach'
--                       and id <> 'a0000000-0000-4000-8000-000000000001' limit 1);
--   update post
--      set author_id = (select id from "user" where role = 'coach'
--                        and id <> 'a0000000-0000-4000-8000-000000000001' limit 1);
--   delete from "user" where id = 'a0000000-0000-4000-8000-000000000001';
