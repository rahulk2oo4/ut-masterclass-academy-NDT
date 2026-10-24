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
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('formula', 'lesson', 'knowledge')),
  item_id text not null,
  created_at timestamptz not null default now(),
  constraint bookmarks_user_item_unique unique (user_id, item_type, item_id)
);
create index if not exists bookmarks_user_type_idx on public.bookmarks (user_id, item_type);
alter table public.bookmarks enable row level security;
drop policy if exists "Bookmarks select own" on public.bookmarks;
create policy "Bookmarks select own" on public.bookmarks for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Bookmarks insert own" on public.bookmarks;
create policy "Bookmarks insert own" on public.bookmarks for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Bookmarks delete own" on public.bookmarks;
create policy "Bookmarks delete own" on public.bookmarks for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, delete on public.bookmarks to authenticated;

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
