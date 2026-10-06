-- Our Little World: schema, RLS, storage. Run in Supabase SQL editor.
create extension if not exists pgcrypto;

-- ---------- Profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  favorite_color text,
  birthday date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Hard cap: never more than two accounts
create or replace function public.limit_two_users() returns trigger
language plpgsql security definer as $$
begin
  if (select count(*) from auth.users) >= 2 then
    raise exception 'This private space is limited to two accounts.';
  end if;
  return new;
end $$;
create trigger limit_two_users before insert on auth.users
  for each row execute function public.limit_two_users();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
          coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

-- Username -> login email (usernames are changeable; email stays fixed)
create or replace function public.get_login_email(p_username text) returns text
language sql stable security definer set search_path = public, auth as $$
  select u.email from auth.users u join public.profiles p on p.id = u.id
  where lower(p.username) = lower(p_username) limit 1;
$$;
grant execute on function public.get_login_email(text) to anon, authenticated;

-- ---------- Content tables ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null, event_date date not null, event_time time,
  location text, description text, photo_path text, category text,
  reminder_date date, is_countdown boolean not null default false,
  is_demo boolean not null default false,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  title text not null, memory_date date, location text, description text,
  photo_paths text[] not null default '{}', video_path text, tags text[] not null default '{}',
  is_demo boolean not null default false,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.open_when (
  id uuid primary key default gen_random_uuid(),
  title text not null, message text, photo_path text, voice_path text, video_path text,
  unlock_at timestamptz,
  is_demo boolean not null default false,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.messages (            -- "For You"
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'message'
    check (kind in ('message','photo','voice','video','note','appreciation','question')),
  to_user uuid not null references public.profiles(id),
  title text, content text, attachment_path text,
  is_demo boolean not null default false,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.future_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text, category text, image_path text,
  status text not null default 'idea' check (status in ('idea','planned','done')),
  is_demo boolean not null default false,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.little_things (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text, category text,
  is_demo boolean not null default false,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  path text not null, caption text, taken_at date,
  is_demo boolean not null default false,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null, location text, latitude double precision, longitude double precision,
  visited_on date, description text, photo_path text, category text,
  is_demo boolean not null default false,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.timeline_items (
  id uuid primary key default gen_random_uuid(),
  item_date date not null, title text not null, description text,
  image_path text, location text, category text,
  is_demo boolean not null default false,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.scheduled_messages (
  id uuid primary key default gen_random_uuid(),
  title text not null, message text, photo_path text, video_path text, voice_path text,
  to_user uuid references public.profiles(id),
  unlock_at timestamptz not null,
  is_demo boolean not null default false,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  item_type text not null
    check (item_type in ('memory','event','open_when','photo','future_plan')),
  item_id uuid not null,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (created_by, item_type, item_id)
);

-- ---------- updated_at ----------
create or replace function public.touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','events','memories','open_when','messages','future_plans',
    'little_things','photos','places','timeline_items','scheduled_messages','favorites'] loop
    execute format('create trigger touch_%1$s before update on public.%1$s for each row execute function public.touch()', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;

  -- Standard policies: members read all; write/edit/delete only own rows
  foreach t in array array['events','memories','future_plans','little_things',
    'photos','places','timeline_items'] loop
    execute format('create policy "read" on public.%I for select to authenticated using (public.is_member())', t);
  end loop;
  foreach t in array array['events','memories','open_when','messages','future_plans','little_things',
    'photos','places','timeline_items','scheduled_messages','favorites'] loop
    execute format('create policy "insert own" on public.%I for insert to authenticated with check (public.is_member() and created_by = auth.uid())', t);
    execute format('create policy "update own" on public.%I for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid())', t);
    execute format('create policy "delete own" on public.%I for delete to authenticated using (created_by = auth.uid())', t);
  end loop;
end $$;

-- Locked content is hidden by the database itself, not just the UI
create policy "read unlocked" on public.open_when for select to authenticated
  using (public.is_member() and (created_by = auth.uid() or unlock_at is null or unlock_at <= now()));
create policy "read unlocked" on public.scheduled_messages for select to authenticated
  using (public.is_member() and (created_by = auth.uid() or unlock_at <= now()));

-- For You: only sender and recipient can read
create policy "read own or addressed" on public.messages for select to authenticated
  using (public.is_member() and (to_user = auth.uid() or created_by = auth.uid()));

-- Favorites are personal
create policy "read own" on public.favorites for select to authenticated using (created_by = auth.uid());

-- Profiles
create policy "read" on public.profiles for select to authenticated using (public.is_member());
create policy "update own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Teaser for locked items (title + unlock date only, never the content)
create or replace view public.locked_teasers with (security_invoker = false) as
  select id, 'open_when' as kind, title, unlock_at, created_by from public.open_when
    where unlock_at > now() and public.is_member()
  union all
  select id, 'scheduled', title, unlock_at, created_by from public.scheduled_messages
    where unlock_at > now() and public.is_member();
grant select on public.locked_teasers to authenticated;

-- ---------- Storage (private bucket) ----------
insert into storage.buckets (id, name, public) values ('media','media', false)
  on conflict (id) do nothing;

create policy "media read" on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.is_member());
create policy "media upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_member()
              and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media modify own" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

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
