-- ===========================================================================
-- BMPadel — storage
-- ---------------------------------------------------------------------------
-- Run once, after schema.sql. Creates the bucket that New post uploads into.
--
-- RLS on storage.objects is enabled by Supabase and cannot be switched off from
-- the SQL editor, so this is the ADR-005 position expressed as a policy: one
-- permissive rule, scoped to this bucket and nothing else. Same trade-off as
-- the rest of the POC — open behind an unindexed link, re-creatable in one
-- command — and the same thing to revisit before any real use.
-- ===========================================================================

insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800)  -- 50 MB, enough for a phone clip
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists "bmpadel media open" on storage.objects;

create policy "bmpadel media open"
  on storage.objects
  for all
  using (bucket_id = 'media')
  with check (bucket_id = 'media');
