-- Los terapeutas contratados son varios por escuela y crecen con el programa.
--
-- Ayer se modelaron mal: cuatro columnas — especialista_nombre, cedula,
-- telefono, email — colgando de schools, o sea UNA sola persona por centro. El
-- programa no funciona asi: AIRA coloca una terapeuta por nino, y a medida que
-- el colegio contrata mas ninos entran mas terapeutas.
--
-- El sitio correcto ya existia: tutors. Es la tabla que ya dice quien acompana a
-- cada estudiante (gabinete_estudiantes.tutor_id) y a que colegio pertenece.
-- Solo le faltaban los datos de contacto. No se pierde nada al mover: las
-- columnas de schools se enviaron pero no llego a usarlas ninguna fila.

alter table tutors
  add column if not exists cedula   text,
  add column if not exists telefono text,
  add column if not exists email    text;

alter table schools
  drop column if exists especialista_nombre,
  drop column if exists especialista_cedula,
  drop column if exists especialista_telefono,
  drop column if exists especialista_email;

-- ── El contrato firmado cuelga de la terapeuta, no del colegio ───────────────
--
-- Con una sola especialista por centro daba igual. Con varias, un contrato
-- guardado contra el colegio no dice de quien es.
alter table documents add column if not exists tutor_id text references tutors(id) on delete cascade;

alter table documents drop constraint if exists documents_pertenencia_check;
alter table documents add constraint documents_pertenencia_check check (
  (child_id is not null)::int + (school_id is not null)::int
  + (student_id is not null)::int + (tutor_id is not null)::int = 1
);

create index if not exists documents_tutor_id_idx on documents(tutor_id);

-- ── Alcance ─────────────────────────────────────────────────────────────────
--
-- Cada terapeuta ve su propio contrato; direccion ve todos. Falla cerrado: sin
-- vinculo con una cuenta, la fila de tutors no se la abre a nadie.
create or replace function public.puede_ver_tutor(p_tutor_id text)
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select (select ve_todo_el_gabinete())
      or exists (select 1 from tutors t
                 where t.id = p_tutor_id and t.user_id = (select app_user_id()))
$$;
revoke execute on function public.puede_ver_tutor(text) from anon;

create policy documents_select_tutor on documents
  for select to authenticated
  using (tutor_id is not null and (select has_perm('gabinete:view'))
         and puede_ver_tutor(tutor_id));

create policy documents_write_tutor on documents
  for all to authenticated
  using (tutor_id is not null and (select has_perm('gabinete:session:create')))
  with check (tutor_id is not null and (select has_perm('gabinete:session:create')));

-- tutors_select seguia abierta a cualquiera con tutorreport:view, sin alcance.
-- Ahora la fila lleva cedula, telefono y correo de la persona: se estrecha igual
-- que el resto del gabinete.
drop policy if exists tutors_select on tutors;
create policy tutors_select on tutors
  for select to authenticated
  using ((select ve_todo_el_gabinete()) or user_id = (select app_user_id()));
