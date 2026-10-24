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

-- Academy content and secure assessment records. Safe to apply repeatedly.
create table if not exists public.courses (
 id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null,
 description text not null default '', difficulty text not null default 'Beginner',
 is_published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.modules (
 id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
 position integer not null, title text not null, description text not null default '', is_published boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(course_id,position)
);
create table if not exists public.lessons (
 id uuid primary key default gen_random_uuid(), module_id uuid not null references public.modules(id) on delete cascade,
 position integer not null, slug text not null unique, title text not null, difficulty text not null default 'Beginner',
 content jsonb not null default '{}'::jsonb, is_published boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(module_id,position)
);
create table if not exists public.lesson_progress (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 lesson_id uuid not null references public.lessons(id) on delete cascade, completed boolean not null default false,
 notes text, last_viewed_at timestamptz not null default now(), completed_at timestamptz, unique(user_id,lesson_id)
);
create table if not exists public.quizzes (
 id uuid primary key default gen_random_uuid(), lesson_id uuid not null references public.lessons(id) on delete cascade,
 title text not null, pass_mark integer not null default 80 check(pass_mark between 0 and 100),
 is_published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.quiz_questions (
 id uuid primary key default gen_random_uuid(), quiz_id uuid not null references public.quizzes(id) on delete cascade,
 position integer not null, question text not null, options jsonb not null, explanation text not null default '',
 is_published boolean not null default false, created_at timestamptz not null default now(), unique(quiz_id,position)
);
create table if not exists public.quiz_answer_keys (
 question_id uuid primary key references public.quiz_questions(id) on delete cascade,
 correct_index integer not null check(correct_index>=0), updated_at timestamptz not null default now()
);
create table if not exists public.quiz_attempts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 quiz_id uuid not null references public.quizzes(id) on delete cascade, score integer not null check(score between 0 and 100),
 passed boolean not null, answers jsonb not null default '{}'::jsonb, submitted_at timestamptz not null default now()
);
create table if not exists public.glossary_terms (
 id uuid primary key default gen_random_uuid(), term text not null unique, definition text not null,
 method text not null default 'General', is_published boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.learning_resources (
 id uuid primary key default gen_random_uuid(), title text not null, description text not null default '',
 url text, resource_type text not null default 'article', category text not null default 'General',
 is_published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.exam_attempts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 course_key text not null default 'ndt-foundations', question_ids text[] not null, answers jsonb not null default '{}'::jsonb,
 started_at timestamptz not null default now(), expires_at timestamptz not null, submitted_at timestamptz,
 score integer check(score between 0 and 100), passed boolean, result_summary jsonb not null default '{}'::jsonb
);
create table if not exists public.course_certificates (
 id uuid primary key default gen_random_uuid(), certificate_number text not null unique,
 user_id uuid not null references auth.users(id) on delete cascade, recipient_name text not null,
 course_key text not null default 'ndt-foundations', course_title text not null,
 exam_attempt_id uuid not null references public.exam_attempts(id), score integer not null check(score between 50 and 100),
 issued_at timestamptz not null default now(), revoked_at timestamptz, revocation_reason text, created_at timestamptz not null default now()
);
create index if not exists modules_course_position_idx on public.modules(course_id,position);
create index if not exists lessons_module_position_idx on public.lessons(module_id,position);
create index if not exists lesson_progress_user_idx on public.lesson_progress(user_id,completed);
create index if not exists quiz_questions_quiz_position_idx on public.quiz_questions(quiz_id,position);
create index if not exists exam_attempts_user_course_idx on public.exam_attempts(user_id,course_key,started_at desc);
create index if not exists course_certificates_user_idx on public.course_certificates(user_id,issued_at desc);
create unique index if not exists course_certificates_one_active_per_user_course on public.course_certificates(user_id,course_key) where revoked_at is null;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_answer_keys enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.glossary_terms enable row level security;
alter table public.learning_resources enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.course_certificates enable row level security;
drop policy if exists "Published courses readable" on public.courses;
create policy "Published courses readable" on public.courses for select to anon,authenticated using(is_published);
drop policy if exists "Admins manage courses" on public.courses;
create policy "Admins manage courses" on public.courses for all to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists "Published modules readable" on public.modules;
create policy "Published modules readable" on public.modules for select to anon,authenticated using(is_published and exists(select 1 from public.courses c where c.id=course_id and c.is_published));
drop policy if exists "Admins manage modules" on public.modules;
create policy "Admins manage modules" on public.modules for all to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists "Published lessons readable" on public.lessons;
create policy "Published lessons readable" on public.lessons for select to anon,authenticated using(is_published and exists(select 1 from public.modules m join public.courses c on c.id=m.course_id where m.id=module_id and m.is_published and c.is_published));
drop policy if exists "Admins manage lessons" on public.lessons;
create policy "Admins manage lessons" on public.lessons for all to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists "Users read own lesson progress" on public.lesson_progress;
create policy "Users read own lesson progress" on public.lesson_progress for select to authenticated using((select auth.uid())=user_id);
drop policy if exists "Users insert own lesson progress" on public.lesson_progress;
create policy "Users insert own lesson progress" on public.lesson_progress for insert to authenticated with check((select auth.uid())=user_id);
drop policy if exists "Users update own lesson progress" on public.lesson_progress;
create policy "Users update own lesson progress" on public.lesson_progress for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
drop policy if exists "Users delete own lesson progress" on public.lesson_progress;
create policy "Users delete own lesson progress" on public.lesson_progress for delete to authenticated using((select auth.uid())=user_id);
drop policy if exists "Admins read lesson progress" on public.lesson_progress;
create policy "Admins read lesson progress" on public.lesson_progress for select to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists "Published quizzes readable" on public.quizzes;
create policy "Published quizzes readable" on public.quizzes for select to anon,authenticated using(is_published and exists(select 1 from public.lessons l join public.modules m on m.id=l.module_id join public.courses c on c.id=m.course_id where l.id=lesson_id and l.is_published and m.is_published and c.is_published));
drop policy if exists "Admins manage quizzes" on public.quizzes;
create policy "Admins manage quizzes" on public.quizzes for all to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists "Published quiz questions readable" on public.quiz_questions;
create policy "Published quiz questions readable" on public.quiz_questions for select to anon,authenticated using(is_published and exists(select 1 from public.quizzes q where q.id=quiz_id and q.is_published));
drop policy if exists "Admins manage quiz questions" on public.quiz_questions;
create policy "Admins manage quiz questions" on public.quiz_questions for all to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists "Admins manage quiz answer keys" on public.quiz_answer_keys;
create policy "Admins manage quiz answer keys" on public.quiz_answer_keys for all to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists "Users read own quiz attempts" on public.quiz_attempts;
create policy "Users read own quiz attempts" on public.quiz_attempts for select to authenticated using((select auth.uid())=user_id);
drop policy if exists "Admins read quiz attempts" on public.quiz_attempts;
create policy "Admins read quiz attempts" on public.quiz_attempts for select to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists "Published glossary readable" on public.glossary_terms;
create policy "Published glossary readable" on public.glossary_terms for select to anon,authenticated using(is_published);
drop policy if exists "Admins manage glossary" on public.glossary_terms;
create policy "Admins manage glossary" on public.glossary_terms for all to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists "Published resources readable" on public.learning_resources;
create policy "Published resources readable" on public.learning_resources for select to anon,authenticated using(is_published);
drop policy if exists "Admins manage resources" on public.learning_resources;
create policy "Admins manage resources" on public.learning_resources for all to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists "Users read own exam attempts" on public.exam_attempts;
create policy "Users read own exam attempts" on public.exam_attempts for select to authenticated using((select auth.uid())=user_id);
drop policy if exists "Admins read exam attempts" on public.exam_attempts;
create policy "Admins read exam attempts" on public.exam_attempts for select to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists "Users read own certificates" on public.course_certificates;
create policy "Users read own certificates" on public.course_certificates for select to authenticated using((select auth.uid())=user_id);
drop policy if exists "Admins manage certificates" on public.course_certificates;
create policy "Admins manage certificates" on public.course_certificates for all to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin');
grant select on public.courses,public.modules,public.lessons,public.quizzes,public.quiz_questions,public.glossary_terms,public.learning_resources to anon,authenticated;
grant select,insert,update,delete on public.lesson_progress to authenticated;
grant select on public.quiz_attempts,public.exam_attempts,public.course_certificates to authenticated;
grant select,insert,update,delete on public.courses,public.modules,public.lessons,public.quizzes,public.quiz_questions,public.quiz_answer_keys,public.glossary_terms,public.learning_resources,public.lesson_progress,public.quiz_attempts,public.exam_attempts,public.course_certificates to authenticated;

-- Trusted admin read access and private admin upload permissions.
drop policy if exists "Admins read profiles" on public.profiles;
create policy "Admins read profiles" on public.profiles for select to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists "Admins read course progress" on public.course_progress;
create policy "Admins read course progress" on public.course_progress for select to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin');
insert into storage.buckets(id,name,public) values('academy-resources','academy-resources',true) on conflict(id) do update set public=true;
drop policy if exists "Public read academy resource files" on storage.objects;
create policy "Public read academy resource files" on storage.objects for select to anon,authenticated using(bucket_id='academy-resources');
drop policy if exists "Admins upload academy resource files" on storage.objects;
create policy "Admins upload academy resource files" on storage.objects for insert to authenticated with check(bucket_id='academy-resources' and (select auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists "Admins update academy resource files" on storage.objects;
create policy "Admins update academy resource files" on storage.objects for update to authenticated using(bucket_id='academy-resources' and (select auth.jwt()->'app_metadata'->>'role')='admin') with check(bucket_id='academy-resources' and (select auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists "Admins delete academy resource files" on storage.objects;
create policy "Admins delete academy resource files" on storage.objects for delete to authenticated using(bucket_id='academy-resources' and (select auth.jwt()->'app_metadata'->>'role')='admin');
