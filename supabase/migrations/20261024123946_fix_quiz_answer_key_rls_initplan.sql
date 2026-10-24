-- Avoid per-row evaluation of auth.jwt() in quiz answer-key policy.
drop policy if exists "Admins manage quiz answer keys" on public.quiz_answer_keys;
create policy "Admins manage quiz answer keys" on public.quiz_answer_keys for all to authenticated
using (((select auth.jwt())->'app_metadata'->>'role')='admin')
with check (((select auth.jwt())->'app_metadata'->>'role')='admin');
