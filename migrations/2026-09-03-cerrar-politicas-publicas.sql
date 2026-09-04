-- 2026-09-03 — Cerrar las políticas RLS abiertas al rol `public`.
--
-- En Postgres `public` incluye a `anon`, así que estas cuatro políticas eran
-- alcanzables sin iniciar sesión. Al momento de escribir esto la exposición real
-- era de 0 filas (ningún documento con consentToken vigente, parent_reports y
-- tutors vacías), pero se abría sola en cuanto alguien generara un consentimiento
-- o un reporte a padres desde la interfaz.
--
-- Rollback: ver 2026-09-03-cerrar-politicas-publicas.rollback.sql

begin;

------------------------------------------------------------------------------
-- 1. documents UPDATE
--    Era `to public` con `with check (true)`: un anónimo podía sobrescribir por
--    completo cualquier documento que tuviera consentToken. La rama anónima ya
--    no hace falta — firmar pasa por el RPC security-definer `sign_consent`.
--    Se conservan intactas las dos ramas del personal clínico.
------------------------------------------------------------------------------
drop policy if exists "documents_update" on public.documents;

create policy "documents_update" on public.documents
  for update to authenticated
  using (
    exists (select 1 from current_app_user() u
            where u.role in ('admin','clinical_director'))
    or exists (select 1 from current_app_user() u
               join public.children c on u.id = any (c.assigned_specialists)
               where u.role = 'specialist' and c.id = documents.child_id)
  )
  with check (
    exists (select 1 from current_app_user() u
            where u.role in ('admin','clinical_director'))
    or exists (select 1 from current_app_user() u
               join public.children c on u.id = any (c.assigned_specialists)
               where u.role = 'specialist' and c.id = documents.child_id)
  );

------------------------------------------------------------------------------
-- 2. Lectura pública del consentimiento
--    La política exponía TODOS los documentos con consentToken, no solo el del
--    token presentado. El flujo sí necesita acceso anónimo, así que se sustituye
--    por un RPC acotado al token exacto — mismo patrón que `sign_consent`.
------------------------------------------------------------------------------
drop policy if exists "documents_select_public_consent" on public.documents;

create or replace function public.get_consent_by_token(p_token text)
returns setof public.documents
language sql
stable
security definer
set search_path to 'public'
as $$
  select * from public.documents
  where fields->>'consentToken' = p_token
  limit 1
$$;

revoke all on function public.get_consent_by_token(text) from public;
grant execute on function public.get_consent_by_token(text) to anon, authenticated;

------------------------------------------------------------------------------
-- 3. parent_reports — `all` a public. La app no toca esta tabla; 0 filas.
------------------------------------------------------------------------------
drop policy if exists "allow_all_parent_reports" on public.parent_reports;

create policy "parent_reports_select" on public.parent_reports
  for select to authenticated
  using (
    exists (select 1 from current_app_user() u
            where u.role in ('admin','clinical_director'))
    or exists (select 1 from current_app_user() u
               join public.children c on u.id = any (c.assigned_specialists)
               where u.role = 'specialist' and c.id = parent_reports.child_id)
  );

create policy "parent_reports_insert" on public.parent_reports
  for insert to authenticated
  with check (exists (select 1 from current_app_user() u
                      where u.role in ('admin','clinical_director')));

create policy "parent_reports_update" on public.parent_reports
  for update to authenticated
  using (exists (select 1 from current_app_user() u
                 where u.role in ('admin','clinical_director')))
  with check (exists (select 1 from current_app_user() u
                      where u.role in ('admin','clinical_director')));

create policy "parent_reports_delete" on public.parent_reports
  for delete to authenticated
  using (exists (select 1 from current_app_user() u
                 where u.role in ('admin','clinical_director')));

------------------------------------------------------------------------------
-- 4. tutors — `all` a public. La app no toca esta tabla; 0 filas.
------------------------------------------------------------------------------
drop policy if exists "allow_all_tutors" on public.tutors;

create policy "tutors_select" on public.tutors
  for select to authenticated using (true);

create policy "tutors_insert" on public.tutors
  for insert to authenticated
  with check (exists (select 1 from current_app_user() u
                      where u.role in ('admin','clinical_director')));

create policy "tutors_update" on public.tutors
  for update to authenticated
  using (exists (select 1 from current_app_user() u
                 where u.role in ('admin','clinical_director')))
  with check (exists (select 1 from current_app_user() u
                      where u.role in ('admin','clinical_director')));

create policy "tutors_delete" on public.tutors
  for delete to authenticated
  using (exists (select 1 from current_app_user() u
                 where u.role in ('admin','clinical_director')));

commit;
