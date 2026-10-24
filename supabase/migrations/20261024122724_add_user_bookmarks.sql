-- User-owned bookmarks for formulas, lessons and knowledge topics.
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
