-- Rollback de 2026-09-08-gabinete-estudiantes.sql
-- Los documentos de estudiante se van con la tabla: no tienen otro dueño.
begin;
drop policy if exists "documents_select_estudiante" on public.documents;
drop policy if exists "documents_write_estudiante" on public.documents;
alter table public.documents drop constraint if exists documents_pertenencia_check;
drop index if exists public.documents_student_idx;
alter table public.documents drop column if exists student_id;
alter table public.documents add constraint documents_pertenencia_check
  check ((child_id is not null) <> (school_id is not null));
alter table public.documents drop constraint if exists documents_type_check;
alter table public.documents add constraint documents_type_check check (type = any (array[
  'anamnesis','evaluacion','reporte','informe','plan_trabajo','pautas_crianza',
  'tutor_quincenal','supervision','minuta_interdisciplinaria'
]));
drop table if exists public.gabinete_estudiantes;
drop index if exists public.tutors_school_idx;
alter table public.tutors drop column if exists school_id;
alter table public.tutors drop column if exists activo;
alter table public.schools drop constraint if exists schools_programa_check;
alter table public.schools drop column if exists programa;
commit;
