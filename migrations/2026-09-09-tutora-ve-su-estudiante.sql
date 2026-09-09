-- La tutora ve el expediente de SU estudiante, y solo el suyo.
--
-- El registro de supervision es la devolucion que dirección le hace a la tutora
-- sobre su trabajo: tiene que poder leerla. Pero hasta ahora no habia forma de
-- darle acceso sin abrirle el gabinete entero, porque no existia vinculo entre
-- su CUENTA (public.users, rol shadow) y su ESTUDIANTE: gabinete_estudiantes
-- apunta a tutors, que es otra tabla, sin relacion con users.
--
-- tutors.user_id crea ese vinculo. A partir de el, las politicas de lectura del
-- gabinete dejan de ser "todo o nada" y pasan a filtrar por alcance: quien tiene
-- scope 'todos' sigue viendolo todo, y el resto ve unicamente los colegios y
-- estudiantes que le corresponden.
--
-- Sin el vinculo la tutora no ve NADA de gabinete, no todo: falla cerrado. Una
-- fila de tutors sin user_id es el estado normal de una tutora que aun no tiene
-- cuenta, y no debe abrirle el panel a nadie.

alter table tutors add column if not exists user_id text references users(id) on delete set null;
create index if not exists tutors_user_id_idx on tutors(user_id);

comment on column tutors.user_id is
  'Cuenta AIRA de esta tutora. Es lo que le permite ver el expediente de su estudiante.';

-- ── Alcance de lectura en el gabinete ────────────────────────────────────────

create or replace function public.ve_todo_el_gabinete()
returns boolean
language sql stable security definer set search_path to 'public'
as $$ select coalesce((select app_scope()) = 'todos', false) $$;

create or replace function public.puede_ver_estudiante_gabinete(p_student_id text)
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select (select ve_todo_el_gabinete())
      or exists (
        select 1 from gabinete_estudiantes ge
        join tutors t on t.id = ge.tutor_id
        where ge.id = p_student_id and t.user_id = (select app_user_id())
      )
$$;

create or replace function public.puede_ver_colegio(p_school_id text)
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select (select ve_todo_el_gabinete())
      or exists (
        select 1 from tutors t
        where t.user_id = (select app_user_id())
          and (t.school_id = p_school_id
               or exists (select 1 from gabinete_estudiantes ge
                          where ge.tutor_id = t.id and ge.school_id = p_school_id))
      )
$$;

revoke execute on function public.ve_todo_el_gabinete()             from anon;
revoke execute on function public.puede_ver_estudiante_gabinete(text) from anon;
revoke execute on function public.puede_ver_colegio(text)           from anon;

-- ── Politicas de lectura, ahora con alcance ──────────────────────────────────

drop policy if exists schools_select on schools;
create policy schools_select on schools
  for select to authenticated
  using ((select has_perm('gabinete:view')) and puede_ver_colegio(id));

drop policy if exists gabinete_estudiantes_select on gabinete_estudiantes;
create policy gabinete_estudiantes_select on gabinete_estudiantes
  for select to authenticated
  using ((select has_perm('gabinete:view')) and puede_ver_estudiante_gabinete(id));

drop policy if exists documents_select_estudiante on documents;
create policy documents_select_estudiante on documents
  for select to authenticated
  using (student_id is not null and (select has_perm('gabinete:view'))
         and puede_ver_estudiante_gabinete(student_id));

drop policy if exists documents_select_gabinete on documents;
create policy documents_select_gabinete on documents
  for select to authenticated
  using (school_id is not null and (select has_perm('gabinete:view'))
         and puede_ver_colegio(school_id));

drop policy if exists tamizajes_select on tamizajes;
create policy tamizajes_select on tamizajes
  for select to authenticated
  using ((select has_perm('gabinete:view')) and puede_ver_estudiante_gabinete(student_id));

drop policy if exists gabinete_sessions_select on gabinete_sessions;
create policy gabinete_sessions_select on gabinete_sessions
  for select to authenticated
  using ((select has_perm('gabinete:view')) and puede_ver_colegio(school_id));

-- La tutora entra al gabinete, pero solo a leer: no se le da
-- gabinete:session:create ni, por supuesto, gabinete:supervision:write.
insert into role_permissions (role_id, permission_key)
select 'shadow', 'gabinete:view'
on conflict do nothing;
