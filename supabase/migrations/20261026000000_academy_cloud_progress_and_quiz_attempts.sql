-- Add cloud progress storage for the redesigned curriculum without altering legacy course tables.
create table if not exists public.academy_module_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id),
  constraint academy_module_progress_module_id_nonempty check (length(trim(module_id)) > 0)
);
create index if not exists academy_module_progress_user_completed_idx on public.academy_module_progress (user_id, completed);
alter table public.academy_module_progress enable row level security;
drop policy if exists "Learners read own academy module progress" on public.academy_module_progress;
create policy "Learners read own academy module progress" on public.academy_module_progress for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Learners insert own academy module progress" on public.academy_module_progress;
create policy "Learners insert own academy module progress" on public.academy_module_progress for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Learners update own academy module progress" on public.academy_module_progress;
create policy "Learners update own academy module progress" on public.academy_module_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Learners delete own academy module progress" on public.academy_module_progress;
create policy "Learners delete own academy module progress" on public.academy_module_progress for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.academy_module_progress to authenticated;
create table if not exists public.academy_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_type text not null default 'practice' check (length(trim(quiz_type)) > 0),
  correct_answers integer not null check (correct_answers >= 0),
  total_questions integer not null check (total_questions > 0),
  score_percent integer generated always as (round(100.0 * correct_answers / total_questions)::integer) stored,
  created_at timestamptz not null default now(),
  constraint academy_quiz_attempts_score_bounds check (correct_answers <= total_questions)
);
create index if not exists academy_quiz_attempts_user_created_idx on public.academy_quiz_attempts (user_id, created_at desc);
alter table public.academy_quiz_attempts enable row level security;
drop policy if exists "Learners read own academy quiz attempts" on public.academy_quiz_attempts;
create policy "Learners read own academy quiz attempts" on public.academy_quiz_attempts for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Learners insert own academy quiz attempts" on public.academy_quiz_attempts;
create policy "Learners insert own academy quiz attempts" on public.academy_quiz_attempts for insert to authenticated with check ((select auth.uid()) = user_id);
grant select, insert on public.academy_quiz_attempts to authenticated;
