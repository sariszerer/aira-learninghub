-- Rollback de 2026-09-03-cerrar-politicas-publicas.sql
-- Restaura exactamente las políticas que había antes, incluida su apertura a
-- `public`. Solo para usar si el corte rompe el flujo de consentimiento en
-- producción y hace falta volver atrás de inmediato.

begin;

drop policy if exists "documents_update" on public.documents;
create policy "documents_update" on public.documents
  for update
  using (
    ((fields ->> 'consentToken') is not null)
    or exists (select 1 from current_app_user() u
               where u.role = any (array['admin','clinical_director']))
    or exists (select 1 from current_app_user() u
               join public.children c on u.id = any (c.assigned_specialists)
               where u.role = 'specialist' and c.id = documents.child_id)
  )
  with check (true);

create policy "documents_select_public_consent" on public.documents
  for select
  using ((fields ->> 'consentToken') is not null);

drop function if exists public.get_consent_by_token(text);

drop policy if exists "parent_reports_select" on public.parent_reports;
drop policy if exists "parent_reports_insert" on public.parent_reports;
drop policy if exists "parent_reports_update" on public.parent_reports;
drop policy if exists "parent_reports_delete" on public.parent_reports;
create policy "allow_all_parent_reports" on public.parent_reports
  for all using (true) with check (true);

drop policy if exists "tutors_select" on public.tutors;
drop policy if exists "tutors_insert" on public.tutors;
drop policy if exists "tutors_update" on public.tutors;
drop policy if exists "tutors_delete" on public.tutors;
create policy "allow_all_tutors" on public.tutors
  for all using (true) with check (true);

commit;
