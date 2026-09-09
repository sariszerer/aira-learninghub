drop policy if exists tutors_select on tutors;
create policy tutors_select on tutors for select to authenticated
  using ((select has_perm('tutorreport:view')));

drop policy if exists documents_write_tutor on documents;
drop policy if exists documents_select_tutor on documents;
drop function if exists public.puede_ver_tutor(text);
drop index if exists documents_tutor_id_idx;

alter table documents drop constraint if exists documents_pertenencia_check;
alter table documents add constraint documents_pertenencia_check check (
  (child_id is not null)::int + (school_id is not null)::int
  + (student_id is not null)::int = 1
);
alter table documents drop column if exists tutor_id;

alter table schools
  add column if not exists especialista_nombre   text,
  add column if not exists especialista_cedula   text,
  add column if not exists especialista_telefono text,
  add column if not exists especialista_email    text;

alter table tutors
  drop column if exists cedula,
  drop column if exists telefono,
  drop column if exists email;
