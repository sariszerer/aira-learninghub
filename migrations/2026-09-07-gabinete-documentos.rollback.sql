-- Rollback de 2026-09-07-gabinete-documentos.sql
-- Borra los documentos de colegio con la columna: no tienen otro sitio donde vivir.
begin;
drop policy if exists "documents_select_gabinete" on public.documents;
drop policy if exists "documents_insert_gabinete" on public.documents;
drop policy if exists "documents_update_gabinete" on public.documents;
alter table public.documents drop constraint if exists documents_pertenencia_check;
drop index if exists public.documents_school_idx;
alter table public.documents drop column if exists school_id;
alter table public.gabinete_sessions drop constraint if exists gabinete_sessions_school_id_fkey;
alter table public.gabinete_sessions add constraint gabinete_sessions_school_id_fkey
  foreign key (school_id) references public.schools(id);
commit;
