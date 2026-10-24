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
