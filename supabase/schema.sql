-- UT Masterclass Academy — Supabase schema
-- Matches the schema already present in the project's Supabase database.
-- Safe to run again: it creates missing tables, then sets owned-row RLS policies.
-- It does not drop tables or learner data.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Learner',
  learner_type text not null default 'Working Professional',
  date_of_birth date,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  completed integer[] not null default '{}',
  passed_quizzes integer[] not null default '{}',
  quiz_scores jsonb not null default '{}'::jsonb,
  certificate_record jsonb,
  last_exam_result jsonb,
  saved_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.course_progress enable row level security;

drop policy if exists "Profiles select own" on public.profiles;
create policy "Profiles select own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "Profiles insert own" on public.profiles;
create policy "Profiles insert own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "Profiles update own" on public.profiles;
create policy "Profiles update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Progress select own" on public.course_progress;
create policy "Progress select own" on public.course_progress
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Progress insert own" on public.course_progress;
create policy "Progress insert own" on public.course_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Progress update own" on public.course_progress;
create policy "Progress update own" on public.course_progress
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.course_progress to authenticated;
