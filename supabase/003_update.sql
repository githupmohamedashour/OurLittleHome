-- 003: private username login, recipient-enforced scheduled messages, favorites cleanup, storage helper, demo removal.
-- Safe to re-run.

-- 1) Username -> email lookup is server-only (called by /api/login with the service-role key)
revoke execute on function public.get_login_email(text) from public, anon, authenticated;
grant execute on function public.get_login_email(text) to service_role;

-- 2) Scheduled messages: recipient is required and enforced by RLS
update public.scheduled_messages set to_user = created_by where to_user is null;
alter table public.scheduled_messages alter column to_user set not null;
drop policy if exists "read unlocked" on public.scheduled_messages;
drop policy if exists "read sender or unlocked recipient" on public.scheduled_messages;
create policy "read sender or unlocked recipient" on public.scheduled_messages for select to authenticated
  using (public.is_member() and (created_by = auth.uid() or (to_user = auth.uid() and unlock_at <= now())));
create or replace view public.locked_teasers with (security_invoker = false) as
  select id, 'open_when' as kind, title, unlock_at, created_by from public.open_when
    where unlock_at > now() and public.is_member()
  union all
  select id, 'scheduled', title, unlock_at, created_by from public.scheduled_messages
    where unlock_at > now() and public.is_member() and (to_user = auth.uid() or created_by = auth.uid());
grant select on public.locked_teasers to authenticated;

-- 3) Favorites: strictly per user, and removed when the item is deleted
drop policy if exists "read own" on public.favorites;
create policy "read own" on public.favorites for select to authenticated using (created_by = auth.uid());
create or replace function public.purge_favorites() returns trigger
language plpgsql security definer set search_path = public as $$
begin delete from public.favorites where item_type = tg_argv[0] and item_id = old.id; return old; end $$;
do $$ declare r record; begin
  for r in select * from (values ('memories','memory'),('events','event'),('open_when','open_when'),
                                 ('photos','photo'),('future_plans','future_plan')) v(t,k) loop
    execute format('drop trigger if exists purge_fav on public.%I', r.t);
    execute format('create trigger purge_fav after delete on public.%I for each row execute function public.purge_favorites(%L)', r.t, r.k);
  end loop; end $$;

-- 4) Is a storage file still referenced anywhere? (ignores RLS so the answer is complete)
create or replace function public.media_in_use(p_path text) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_member() then return true; end if;
  return exists (select 1 from events where photo_path = p_path)
    or exists (select 1 from memories where p_path = any(photo_paths) or video_path = p_path)
    or exists (select 1 from open_when where p_path in (photo_path, voice_path, video_path))
    or exists (select 1 from messages where attachment_path = p_path)
    or exists (select 1 from future_plans where image_path = p_path)
    or exists (select 1 from photos where path = p_path)
    or exists (select 1 from places where photo_path = p_path)
    or exists (select 1 from timeline_items where image_path = p_path)
    or exists (select 1 from scheduled_messages where p_path in (photo_path, voice_path, video_path))
    or exists (select 1 from profiles where avatar_url = p_path);
end $$;
grant execute on function public.media_in_use(text) to authenticated;

-- 5) One-click removal of all demo content
create or replace function public.remove_demo_content() returns void
language plpgsql security definer set search_path = public as $$
declare t text;
begin
  if not public.is_member() then raise exception 'not allowed'; end if;
  foreach t in array array['events','memories','open_when','messages','future_plans','little_things',
    'photos','places','timeline_items','scheduled_messages'] loop
    execute format('delete from public.%I where is_demo', t);
  end loop;
end $$;
grant execute on function public.remove_demo_content() to authenticated;
