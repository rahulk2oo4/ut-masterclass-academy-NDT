create table if not exists public.practical_assessments (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 assessment_title text not null,
 assessor_name text not null,
 checklist jsonb not null default '[]'::jsonb,
 status text not null default 'pending' check(status in ('pending','passed','needs_review')),
 notes text not null default '',
 assessed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists practical_assessments_user_idx on public.practical_assessments(user_id,created_at desc);
alter table public.practical_assessments enable row level security;
drop policy if exists "Users read own practical assessments" on public.practical_assessments;
create policy "Users read own practical assessments" on public.practical_assessments for select to authenticated using((select auth.uid())=user_id);
drop policy if exists "Admins manage practical assessments" on public.practical_assessments;
create policy "Admins manage practical assessments" on public.practical_assessments for all to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin');
grant select on public.practical_assessments to authenticated;
grant select,insert,update,delete on public.practical_assessments to authenticated;
