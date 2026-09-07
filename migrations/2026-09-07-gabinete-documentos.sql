-- 2026-09-07 — Gabinete externo: documentos de colegio, y poder borrar un colegio.
--
-- Los documentos van en la tabla documents y no en una nueva: child_id ya era
-- nulable, asi que un documento puede colgar de un colegio en vez de un
-- paciente. Reutiliza el modal, el mapper y el patron de politicas; una tabla
-- paralela habria duplicado los tres.
--
-- Rollback: 2026-09-07-gabinete-documentos.rollback.sql
begin;

alter table public.documents add column if not exists school_id text references public.schools(id) on delete cascade;
create index if not exists documents_school_idx on public.documents (school_id) where school_id is not null;

-- Un documento cuelga de un paciente O de un colegio, nunca de los dos ni de
-- ninguno: sin esto una fila huerfana no aparece en ninguna pantalla.
alter table public.documents drop constraint if exists documents_pertenencia_check;
alter table public.documents add constraint documents_pertenencia_check
  check ((child_id is not null) <> (school_id is not null));

-- Las politicas de documents resuelven el alcance con can_see_child(child_id),
-- que con child_id nulo devuelve falso. Los de colegio se autorizan aparte, con
-- el mismo permiso que ya gobierna el gabinete.
drop policy if exists "documents_select_gabinete" on public.documents;
create policy "documents_select_gabinete" on public.documents
  for select to authenticated
  using (school_id is not null and (select public.has_perm('gabinete:view')));

drop policy if exists "documents_insert_gabinete" on public.documents;
create policy "documents_insert_gabinete" on public.documents
  for insert to authenticated
  with check (school_id is not null and (select public.has_perm('gabinete:session:create')));

drop policy if exists "documents_update_gabinete" on public.documents;
create policy "documents_update_gabinete" on public.documents
  for update to authenticated
  using (school_id is not null and (select public.has_perm('gabinete:session:create')))
  with check (school_id is not null and (select public.has_perm('gabinete:session:create')));

-- Borrar un colegio. schools_write es FOR ALL e incluye delete, pero faltaba
-- que las sesiones colgadas se fueran con el: sin el cascade la clave foranea
-- bloqueaba el borrado y la pantalla no decia por que.
alter table public.gabinete_sessions drop constraint if exists gabinete_sessions_school_id_fkey;
alter table public.gabinete_sessions add constraint gabinete_sessions_school_id_fkey
  foreign key (school_id) references public.schools(id) on delete cascade;

commit;
