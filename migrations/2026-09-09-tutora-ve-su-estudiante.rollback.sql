delete from role_permissions where role_id = 'shadow' and permission_key = 'gabinete:view';

drop policy if exists schools_select on schools;
create policy schools_select on schools for select to authenticated
  using ((select has_perm('gabinete:view')));
drop policy if exists gabinete_estudiantes_select on gabinete_estudiantes;
create policy gabinete_estudiantes_select on gabinete_estudiantes for select to authenticated
  using ((select has_perm('gabinete:view')));
drop policy if exists documents_select_estudiante on documents;
create policy documents_select_estudiante on documents for select to authenticated
  using (student_id is not null and (select has_perm('gabinete:view')));
drop policy if exists documents_select_gabinete on documents;
create policy documents_select_gabinete on documents for select to authenticated
  using (school_id is not null and (select has_perm('gabinete:view')));
drop policy if exists tamizajes_select on tamizajes;
create policy tamizajes_select on tamizajes for select to authenticated
  using ((select has_perm('gabinete:view')));
drop policy if exists gabinete_sessions_select on gabinete_sessions;
create policy gabinete_sessions_select on gabinete_sessions for select to authenticated
  using ((select has_perm('gabinete:view')));

drop function if exists public.puede_ver_colegio(text);
drop function if exists public.puede_ver_estudiante_gabinete(text);
drop function if exists public.ve_todo_el_gabinete();
drop index if exists tutors_user_id_idx;
alter table tutors drop column if exists user_id;
