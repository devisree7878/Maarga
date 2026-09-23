-- ELEVORA — initial schema
-- Run this once in Supabase: Dashboard → SQL Editor → paste → Run.
-- Safe to re-run: every object uses IF NOT EXISTS / OR REPLACE / drop-first guards.

-- ============================================================================
-- 1. PROFILES
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  goal text not null default '',
  schedule_days integer not null default 90 check (schedule_days > 0),
  onboarding_completed boolean not null default false,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The single JSON blob holding this user's plan (categories, days, tasks,
-- study logs, problems, mistakes, goals, settings). This mirrors the
-- existing localStorage-era `schema.js` shape 1:1 so all existing
-- components/reducer logic keep working unchanged — only the persistence
-- layer moved from localStorage to Postgres, per-user, behind RLS.
create table if not exists public.user_plans (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  plan_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_type text not null check (game_type in ('number_sequence', 'memory_match', 'pattern_logic')),
  score integer not null default 0,
  correct_answers integer not null default 0,
  wrong_answers integer not null default 0,
  duration_seconds integer not null default 0,
  completed_at timestamptz not null default now()
);

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_self_request check (requester_id <> addressee_id),
  constraint unique_pending_pair unique (requester_id, addressee_id)
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint friendship_order check (user_a < user_b),
  constraint unique_friendship unique (user_a, user_b)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_game_sessions_user on public.game_sessions (user_id, completed_at desc);
create index if not exists idx_friend_requests_addressee on public.friend_requests (addressee_id, status);
create index if not exists idx_friend_requests_requester on public.friend_requests (requester_id, status);
create index if not exists idx_friendships_a on public.friendships (user_a);
create index if not exists idx_friendships_b on public.friendships (user_b);
create index if not exists idx_messages_pair on public.messages (least(sender_id, receiver_id), greatest(sender_id, receiver_id), created_at);
create index if not exists idx_profiles_last_active on public.profiles (last_active_at);

-- ============================================================================
-- 2. HELPER FUNCTIONS (security definer => no RLS recursion)
-- ============================================================================

-- Returns true iff the CURRENT auth user is the admin. SECURITY DEFINER means
-- this function reads `profiles` bypassing RLS, so policies that call it
-- never recurse back into the profiles policy they're defined on.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Returns the CURRENT auth user's role without ever going back through the
-- profiles RLS policies (security definer bypasses RLS). Used inside the
-- profiles UPDATE policy so a user can never grant themselves 'admin' —
-- without this, checking role via a normal subquery inside a profiles policy
-- would re-trigger the profiles policy and risk "infinite recursion detected
-- in policy for relation profiles".
create or replace function public.current_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- True iff the two given users are connected friends.
create or replace function public.are_friends(u1 uuid, u2 uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.friendships
    where user_a = least(u1, u2) and user_b = greatest(u1, u2)
  );
$$;

-- Creates the profile row right after a new auth user is created.
-- devisreeadmin@gmail.com is automatically granted the admin role here —
-- this is the ONLY place a profile's role is ever set to 'admin'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    case when lower(new.email) = 'devisreeadmin@gmail.com' then 'admin' else 'user' end
  )
  on conflict (id) do nothing;

  insert into public.user_plans (user_id, plan_data)
  values (new.id, '{}'::jsonb)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Bumps last_active_at for the calling user. Called from the client on
-- meaningful app usage (see src/hooks/useTrackActivity.js).
create or replace function public.touch_last_active()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set last_active_at = now() where id = auth.uid();
$$;

-- ============================================================================
-- 3. updated_at maintenance
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_user_plans_updated_at on public.user_plans;
create trigger trg_user_plans_updated_at before update on public.user_plans
  for each row execute function public.set_updated_at();

drop trigger if exists trg_friend_requests_updated_at on public.friend_requests;
create trigger trg_friend_requests_updated_at before update on public.friend_requests
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.user_plans enable row level security;
alter table public.game_sessions enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.messages enable row level security;

-- ---- profiles ----
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

-- Any authenticated user may look up the *public* row (id, full_name, email)
-- of another user in order to search/add friends. We keep this permissive at
-- the row level but the app only ever selects safe columns client-side.
drop policy if exists "profiles_select_for_search" on public.profiles;
create policy "profiles_select_for_search"
  on public.profiles for select
  using (auth.role() = 'authenticated');

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- a normal user can never change their own role or another user's row
    and role = public.current_role()
  );

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

-- ---- user_plans ----
drop policy if exists "plans_select_own" on public.user_plans;
create policy "plans_select_own"
  on public.user_plans for select
  using (user_id = auth.uid());

drop policy if exists "plans_insert_own" on public.user_plans;
create policy "plans_insert_own"
  on public.user_plans for insert
  with check (user_id = auth.uid());

drop policy if exists "plans_update_own" on public.user_plans;
create policy "plans_update_own"
  on public.user_plans for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---- game_sessions ----
drop policy if exists "games_select_own_or_admin" on public.game_sessions;
create policy "games_select_own_or_admin"
  on public.game_sessions for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "games_insert_own" on public.game_sessions;
create policy "games_insert_own"
  on public.game_sessions for insert
  with check (user_id = auth.uid());

-- ---- friend_requests ----
drop policy if exists "requests_select_involving_me" on public.friend_requests;
create policy "requests_select_involving_me"
  on public.friend_requests for select
  using (requester_id = auth.uid() or addressee_id = auth.uid());

drop policy if exists "requests_insert_as_me" on public.friend_requests;
create policy "requests_insert_as_me"
  on public.friend_requests for insert
  with check (requester_id = auth.uid());

-- only the addressee can accept/reject; either party can cancel a pending one
drop policy if exists "requests_update_involving_me" on public.friend_requests;
create policy "requests_update_involving_me"
  on public.friend_requests for update
  using (requester_id = auth.uid() or addressee_id = auth.uid())
  with check (requester_id = auth.uid() or addressee_id = auth.uid());

drop policy if exists "requests_delete_involving_me" on public.friend_requests;
create policy "requests_delete_involving_me"
  on public.friend_requests for delete
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- ---- friendships ----
drop policy if exists "friendships_select_own" on public.friendships;
create policy "friendships_select_own"
  on public.friendships for select
  using (user_a = auth.uid() or user_b = auth.uid());

drop policy if exists "friendships_insert_own" on public.friendships;
create policy "friendships_insert_own"
  on public.friendships for insert
  with check (user_a = auth.uid() or user_b = auth.uid());

drop policy if exists "friendships_delete_own" on public.friendships;
create policy "friendships_delete_own"
  on public.friendships for delete
  using (user_a = auth.uid() or user_b = auth.uid());

-- ---- messages ----
drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own"
  on public.messages for select
  using (sender_id = auth.uid() or receiver_id = auth.uid());

-- can only send a message to someone you are actually friends with
drop policy if exists "messages_insert_if_friends" on public.messages;
create policy "messages_insert_if_friends"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and public.are_friends(auth.uid(), receiver_id)
  );

drop policy if exists "messages_update_mark_read" on public.messages;
create policy "messages_update_mark_read"
  on public.messages for update
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());

-- ============================================================================
-- 5. FRIEND REQUEST ACCEPTANCE (atomic, server-side)
-- ============================================================================

-- Accepting a request and creating the friendship must happen together.
-- Exposed as an RPC so the client makes one call instead of two racy writes.
create or replace function public.accept_friend_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req record;
begin
  select * into req from public.friend_requests where id = request_id;

  if req is null then
    raise exception 'Request not found';
  end if;

  if req.addressee_id <> auth.uid() then
    raise exception 'Not authorized to accept this request';
  end if;

  update public.friend_requests set status = 'accepted' where id = request_id;

  insert into public.friendships (user_a, user_b)
  values (least(req.requester_id, req.addressee_id), greatest(req.requester_id, req.addressee_id))
  on conflict (user_a, user_b) do nothing;
end;
$$;

-- ============================================================================
-- 6. ADMIN STATS (SECURITY DEFINER, admin-only)
-- ============================================================================

create or replace function public.get_admin_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select json_build_object(
    'total_users', (select count(*) from public.profiles),
    'active_today', (select count(*) from public.profiles where last_active_at >= date_trunc('day', now())),
    'active_this_week', (select count(*) from public.profiles where last_active_at >= now() - interval '7 days'),
    'active_this_month', (select count(*) from public.profiles where last_active_at >= now() - interval '30 days'),
    'tasks_completed', (
      select coalesce(sum(
        (select count(*) from jsonb_array_elements(plan_data -> 'tasks') t where (t -> 'completed')::boolean is true)
      ), 0)
      from public.user_plans
    ),
    'games_played', (select count(*) from public.game_sessions),
    'game_sessions_by_type', (
      select coalesce(json_object_agg(game_type, cnt), '{}'::json)
      from (select game_type, count(*) cnt from public.game_sessions group by game_type) g
    ),
    'registrations_last_30_days', (
      select coalesce(json_agg(row_to_json(r)), '[]'::json) from (
        select to_char(d::date, 'YYYY-MM-DD') as date,
          (select count(*) from public.profiles p where p.created_at::date = d::date) as count
        from generate_series(current_date - interval '29 days', current_date, interval '1 day') d
      ) r
    ),
    'active_users_last_30_days', (
      select coalesce(json_agg(row_to_json(r)), '[]'::json) from (
        select to_char(d::date, 'YYYY-MM-DD') as date,
          (select count(*) from public.profiles p where p.last_active_at::date = d::date) as count
        from generate_series(current_date - interval '29 days', current_date, interval '1 day') d
      ) r
    )
  ) into result;

  return result;
end;
$$;
