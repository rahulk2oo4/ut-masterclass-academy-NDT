alter table public.course_certificates add column if not exists pdf_storage_path text;
insert into storage.buckets(id,name,public) values('academy-certificates','academy-certificates',false) on conflict(id) do update set public=false;
drop policy if exists "Users read own private certificate PDFs" on storage.objects;
create policy "Users read own private certificate PDFs" on storage.objects for select to authenticated
using(bucket_id='academy-certificates' and ((storage.foldername(name))[1]=(select auth.uid())::text or ((select auth.jwt())->'app_metadata'->>'role')='admin'));
