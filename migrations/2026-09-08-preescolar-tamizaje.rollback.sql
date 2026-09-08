-- Rollback de 2026-09-08-preescolar-tamizaje.sql
-- Los tamizajes se van con la tabla: no tienen otro sitio donde vivir.
begin;
drop table if exists public.tamizajes;
drop index if exists public.gabinete_estudiantes_nivel_idx;
alter table public.gabinete_estudiantes drop constraint if exists gabinete_estudiantes_nivel_check;
alter table public.gabinete_estudiantes drop constraint if exists gabinete_estudiantes_ruta_check;
alter table public.gabinete_estudiantes drop column if exists nivel;
alter table public.gabinete_estudiantes drop column if exists ruta;
alter table public.gabinete_estudiantes drop column if exists fecha_ruta;
alter table public.documents drop constraint if exists documents_type_check;
alter table public.documents add constraint documents_type_check check (type = any (array[
  'anamnesis','evaluacion','reporte','informe','plan_trabajo','pautas_crianza',
  'plan_trabajo_tutor','supervision','tutor_quincenal','minuta_interdisciplinaria'
]));
commit;
