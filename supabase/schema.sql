-- UT Masterclass Academy — Supabase schema
-- Run in Supabase Dashboard > SQL Editor.
-- This schema stores learner progress only; course lessons live in the static site.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id text not null check (class_id ~ '^class-[0-9]{2}$'),
  completed boolean not null default false,
  best_score integer check (best_score between 0 and 100),
  last_score integer check (last_score between 0 and 100),
  notes text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, class_id)
);

alter table public.profiles enable row level security;
alter table public.course_progress enable row level security;

drop policy if exists "Learners can read own profile" on public.profiles;
create policy "Learners can read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "Learners can insert own profile" on public.profiles;
create policy "Learners can insert own profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "Learners can update own profile" on public.profiles;
create policy "Learners can update own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Learners can read own progress" on public.course_progress;
create policy "Learners can read own progress" on public.course_progress
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Learners can insert own progress" on public.course_progress;
create policy "Learners can insert own progress" on public.course_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Learners can update own progress" on public.course_progress;
create policy "Learners can update own progress" on public.course_progress
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "Learners can delete own progress" on public.course_progress;
create policy "Learners can delete own progress" on public.course_progress
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.course_progress to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
