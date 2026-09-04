-- 2026-09-04 — Fase 3: Postgres autoriza por PERMISO, no por nombre de rol.
--
-- Hasta ahora las politicas comprobaban `u.role = any(array['admin',
-- 'clinical_director'])`. Eso significaba que un rol creado desde la aplicacion
-- no tenia ningun efecto en la base: la fase 2 hizo los roles editables, pero
-- RLS seguia sin entenderlos.
--
-- Es el corte que hace que el permiso se CUMPLA y no solo se vea. Hasta hoy,
-- alguien autenticado que llamara la API REST directamente se saltaba lo que
-- decidiera can() en el navegador.
--
-- Rollback: 2026-09-04-roles-fase3-rls.rollback.sql (generado desde pg_policies)
--
-- ORDEN DE DESPLIEGUE: base primero, cliente despues. El cliente actual
-- funciona con estas politicas; el anterior tambien, porque users.role sigue
-- ahi y las dos fuentes coinciden.

begin;

------------------------------------------------------------------------------
-- Helpers.
--
-- Escalares a proposito: al no depender de la fila se pueden invocar envueltos
-- como (select has_perm('x')), y entonces Postgres los evalua UNA VEZ POR
-- CONSULTA en vez de una por fila. Sobre 438 sesiones es la diferencia entre
-- 1 llamada y 438.
--
-- security definer no es una optimizacion sino un requisito: una politica sobre
-- users que consulte users recursa infinito, y la funcion corta la recursion al
-- saltar RLS por dentro. El search_path fijo cierra un escalamiento via esquema
-- falso.
--
-- No se toca current_app_user(): Postgres no deja cambiar el RETURNS TABLE de
-- una funcion viva sin borrar antes todas las politicas que la usan. Estas van
-- al lado.
------------------------------------------------------------------------------
create or replace function public.app_user_id() returns text
language sql stable security definer set search_path to 'public' as $$
  select id from public.users where auth_id = auth.uid()
$$;

create or replace function public.app_scope() returns text
language sql stable security definer set search_path to 'public' as $$
  select r.scope from public.users u
  join public.roles r on r.id = u.role_id
  where u.auth_id = auth.uid()
$$;

create or replace function public.app_assigned_child() returns text
language sql stable security definer set search_path to 'public' as $$
  select assigned_child_id from public.users where auth_id = auth.uid()
$$;

create or replace function public.has_perm(p text) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from public.users u
    join public.role_permissions rp on rp.role_id = u.role_id
    where u.auth_id = auth.uid() and rp.permission_key = p
  )
$$;

-- Resolvedor de alcance, con atajo para 'todos' y fallo cerrado al final: un
-- rol sin scope reconocido no ve ningun paciente, no todos.
create or replace function public.can_see_child(cid text) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select case (select r.scope from public.users u
                 join public.roles r on r.id = u.role_id
                where u.auth_id = auth.uid())
    when 'todos'     then true
    when 'asignados' then exists (
      select 1 from public.children c
      where c.id = cid and (select public.app_user_id()) = any (c.assigned_specialists))
    when 'un_nino'   then cid = (select public.app_assigned_child())
    else false
  end
$$;

------------------------------------------------------------------------------
-- El trigger anti-autoascenso pasa a vigilar tambien role_id: desde la fase 2
-- esa es la columna que decide los permisos, y protegerla sola a `role` dejaba
-- la puerta abierta.
------------------------------------------------------------------------------
create or replace function public.block_self_role_change()
returns trigger
language plpgsql security definer set search_path to 'public'
as $$
declare
  actor text;
begin
  select id into actor from public.users where auth_id = auth.uid();
  if (new.role is distinct from old.role or new.role_id is distinct from old.role_id)
     and old.id = actor then
    raise exception 'No puedes cambiar tu propio rol';
  end if;
  return new;
end $$;

------------------------------------------------------------------------------
-- Fuera las 27 politicas por nombre de rol.
------------------------------------------------------------------------------
drop policy if exists "children_select" on public.children;
drop policy if exists "children_insert" on public.children;
drop policy if exists "children_update" on public.children;
drop policy if exists "sessions_select" on public.sessions;
drop policy if exists "sessions_insert" on public.sessions;
drop policy if exists "sessions_update" on public.sessions;
drop policy if exists "objectives_select" on public.objectives;
drop policy if exists "objectives_insert" on public.objectives;
drop policy if exists "objectives_update" on public.objectives;
drop policy if exists "objectives_delete" on public.objectives;
drop policy if exists "documents_select" on public.documents;
drop policy if exists "documents_insert" on public.documents;
drop policy if exists "documents_update" on public.documents;
drop policy if exists "meetings_select" on public.meetings;
drop policy if exists "meetings_insert" on public.meetings;
drop policy if exists "schools_all" on public.schools;
drop policy if exists "gabinete_sessions_all" on public.gabinete_sessions;
drop policy if exists "tutor_reports_select" on public.tutor_reports;
drop policy if exists "tutor_reports_insert" on public.tutor_reports;
drop policy if exists "parent_reports_select" on public.parent_reports;
drop policy if exists "parent_reports_insert" on public.parent_reports;
drop policy if exists "parent_reports_update" on public.parent_reports;
drop policy if exists "parent_reports_delete" on public.parent_reports;
drop policy if exists "tutors_select" on public.tutors;
drop policy if exists "tutors_insert" on public.tutors;
drop policy if exists "tutors_update" on public.tutors;
drop policy if exists "tutors_delete" on public.tutors;

------------------------------------------------------------------------------
-- children
------------------------------------------------------------------------------
create policy "children_select" on public.children
  for select to authenticated
  using ((select public.has_perm('patient:view')) and public.can_see_child(id));

create policy "children_insert" on public.children
  for insert to authenticated
  with check ((select public.has_perm('patient:create')));

create policy "children_update" on public.children
  for update to authenticated
  using (public.can_see_child(id) and (select public.has_perm('patient:edit')))
  with check (public.can_see_child(id) and (select public.has_perm('patient:edit')));

------------------------------------------------------------------------------
-- sessions. El par own/any traduce el `admin || director || es_mia` que estaba
-- repetido a mano en cuatro archivos del cliente.
------------------------------------------------------------------------------
create policy "sessions_select" on public.sessions
  for select to authenticated
  using ((select public.has_perm('session:view')) and public.can_see_child(child_id));

create policy "sessions_insert" on public.sessions
  for insert to authenticated
  with check ((select public.has_perm('session:create')) and public.can_see_child(child_id));

create policy "sessions_update" on public.sessions
  for update to authenticated
  using (public.can_see_child(child_id) and (
       (select public.has_perm('session:edit:any'))
    or ((select public.has_perm('session:edit:own')) and specialist_id = (select public.app_user_id()))))
  with check (public.can_see_child(child_id) and (
       (select public.has_perm('session:edit:any'))
    or ((select public.has_perm('session:edit:own')) and specialist_id = (select public.app_user_id()))));

------------------------------------------------------------------------------
-- objectives. Borrar usa el mismo permiso que editar: la interfaz siempre lo
-- escondio tras el mismo control.
------------------------------------------------------------------------------
create policy "objectives_select" on public.objectives
  for select to authenticated
  using ((select public.has_perm('objective:view')) and public.can_see_child(child_id));

create policy "objectives_insert" on public.objectives
  for insert to authenticated
  with check ((select public.has_perm('objective:create')) and public.can_see_child(child_id));

create policy "objectives_update" on public.objectives
  for update to authenticated
  using (public.can_see_child(child_id) and (
       (select public.has_perm('objective:edit:any'))
    or ((select public.has_perm('objective:edit:own')) and specialist_id = (select public.app_user_id()))))
  with check (public.can_see_child(child_id) and (
       (select public.has_perm('objective:edit:any'))
    or ((select public.has_perm('objective:edit:own')) and specialist_id = (select public.app_user_id()))));

create policy "objectives_delete" on public.objectives
  for delete to authenticated
  using (public.can_see_child(child_id) and (
       (select public.has_perm('objective:edit:any'))
    or ((select public.has_perm('objective:edit:own')) and specialist_id = (select public.app_user_id()))));

------------------------------------------------------------------------------
-- documents. El UPDATE publico del consentimiento ya se retiro el 2026-09-03:
-- firmar pasa por el RPC sign_consent, que corre con security definer.
------------------------------------------------------------------------------
create policy "documents_select" on public.documents
  for select to authenticated
  using ((select public.has_perm('document:view')) and public.can_see_child(child_id));

create policy "documents_insert" on public.documents
  for insert to authenticated
  with check ((select public.has_perm('document:create')) and public.can_see_child(child_id));

create policy "documents_update" on public.documents
  for update to authenticated
  using (public.can_see_child(child_id) and (
       (select public.has_perm('document:edit:any'))
    or ((select public.has_perm('document:edit:own')) and author_id = (select public.app_user_id()))))
  with check (public.can_see_child(child_id) and (
       (select public.has_perm('document:edit:any'))
    or ((select public.has_perm('document:edit:own')) and author_id = (select public.app_user_id()))));

------------------------------------------------------------------------------
-- meetings
------------------------------------------------------------------------------
create policy "meetings_select" on public.meetings
  for select to authenticated
  using ((select public.has_perm('meeting:view')) and public.can_see_child(child_id));

create policy "meetings_insert" on public.meetings
  for insert to authenticated
  with check ((select public.has_perm('meeting:create')) and public.can_see_child(child_id));

------------------------------------------------------------------------------
-- parent_reports
------------------------------------------------------------------------------
create policy "parent_reports_select" on public.parent_reports
  for select to authenticated
  using ((select public.has_perm('report:view')) and public.can_see_child(child_id));

create policy "parent_reports_insert" on public.parent_reports
  for insert to authenticated
  with check ((select public.has_perm('report:parent:generate')) and public.can_see_child(child_id));

create policy "parent_reports_update" on public.parent_reports
  for update to authenticated
  using ((select public.has_perm('report:parent:generate')) and public.can_see_child(child_id))
  with check ((select public.has_perm('report:parent:generate')) and public.can_see_child(child_id));

create policy "parent_reports_delete" on public.parent_reports
  for delete to authenticated
  using ((select public.has_perm('report:parent:generate')) and public.can_see_child(child_id));

------------------------------------------------------------------------------
-- Gabinete. No cuelga de un paciente: es trabajo en colegios, asi que aqui no
-- interviene el alcance.
------------------------------------------------------------------------------
create policy "schools_select" on public.schools
  for select to authenticated using ((select public.has_perm('gabinete:view')));

create policy "schools_write" on public.schools
  for all to authenticated
  using ((select public.has_perm('school:create')))
  with check ((select public.has_perm('school:create')));

create policy "gabinete_sessions_select" on public.gabinete_sessions
  for select to authenticated using ((select public.has_perm('gabinete:view')));

create policy "gabinete_sessions_write" on public.gabinete_sessions
  for all to authenticated
  using ((select public.has_perm('gabinete:session:create')))
  with check ((select public.has_perm('gabinete:session:create')));

------------------------------------------------------------------------------
-- tutor_reports y tutors
------------------------------------------------------------------------------
create policy "tutor_reports_select" on public.tutor_reports
  for select to authenticated using ((select public.has_perm('tutorreport:view')));

create policy "tutor_reports_insert" on public.tutor_reports
  for insert to authenticated with check ((select public.has_perm('tutorreport:create')));

create policy "tutors_select" on public.tutors
  for select to authenticated using ((select public.has_perm('tutorreport:view')));

create policy "tutors_write" on public.tutors
  for all to authenticated
  using ((select public.has_perm('user:manage')))
  with check ((select public.has_perm('user:manage')));

commit;
