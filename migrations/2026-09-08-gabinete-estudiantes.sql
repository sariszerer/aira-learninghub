-- 2026-09-08 — Gabinete Externo: escuela → estudiante → documentos.
--
-- El modelo real: una familia contrata a AIRA para poner un tutor con su hijo
-- dentro de un colegio. Lo que se documenta es el acompañamiento a ESE niño, no
-- el contrato con la escuela. La escuela es el sitio donde ocurre.
--
-- La migracion anterior colgo los documentos del colegio porque era lo que se
-- habia pedido entonces. Se corrige: cuelgan del estudiante, y el colegio
-- conserva los suyos propios (una minuta interdisciplinaria si es del centro).
--
-- Gabinete tiene ademas dos programas distintos — tutoria y el de deteccion,
-- prevencion y atencion en preescolar — y una escuela pertenece a uno.
--
-- Rollback: 2026-09-08-gabinete-estudiantes.rollback.sql

begin;

------------------------------------------------------------------------------
-- Programa al que pertenece cada escuela.
------------------------------------------------------------------------------
alter table public.schools add column if not exists programa text not null default 'tutoria';
alter table public.schools drop constraint if exists schools_programa_check;
alter table public.schools add constraint schools_programa_check
  check (programa in ('tutoria', 'preescolar'));

------------------------------------------------------------------------------
-- La tutora trabaja en un colegio concreto. La columna `school` que ya existia
-- guardaba el nombre suelto: sin id no se puede listar "las tutoras de este
-- colegio" sin comparar cadenas.
------------------------------------------------------------------------------
alter table public.tutors add column if not exists school_id text references public.schools(id) on delete set null;
alter table public.tutors add column if not exists activo boolean not null default true;
create index if not exists tutors_school_idx on public.tutors (school_id) where school_id is not null;

------------------------------------------------------------------------------
-- Expediente del estudiante dentro del gabinete.
--
-- child_id es OPCIONAL y enlaza con el expediente clinico cuando el niño
-- ademas recibe terapia en AIRA — Asher Btesh es los dos a la vez. Obligarlo
-- impediria registrar a un estudiante que solo tiene tutor, que es el caso
-- normal de este programa.
------------------------------------------------------------------------------
create table if not exists public.gabinete_estudiantes (
  id          text primary key,
  school_id   text not null references public.schools(id) on delete cascade,
  child_id    text references public.children(id) on delete set null,
  tutor_id    text references public.tutors(id) on delete set null,
  name        text not null,
  last_name   text,
  grade       text,
  start_date  date,
  activo      boolean not null default true,
  notas       text,
  created_at  timestamptz not null default now()
);
create index if not exists gabinete_estudiantes_school_idx on public.gabinete_estudiantes (school_id);

alter table public.gabinete_estudiantes enable row level security;

drop policy if exists "gabinete_estudiantes_select" on public.gabinete_estudiantes;
create policy "gabinete_estudiantes_select" on public.gabinete_estudiantes
  for select to authenticated using ((select public.has_perm('gabinete:view')));

drop policy if exists "gabinete_estudiantes_write" on public.gabinete_estudiantes;
create policy "gabinete_estudiantes_write" on public.gabinete_estudiantes
  for all to authenticated
  using ((select public.has_perm('gabinete:session:create')))
  with check ((select public.has_perm('gabinete:session:create')));

------------------------------------------------------------------------------
-- Los documentos pasan a poder colgar tambien de un estudiante.
------------------------------------------------------------------------------
alter table public.documents add column if not exists student_id text
  references public.gabinete_estudiantes(id) on delete cascade;
create index if not exists documents_student_idx on public.documents (student_id) where student_id is not null;

-- Exactamente uno de los tres dueños. Sin esto una fila con dos dueños sale
-- duplicada en dos pantallas, y una sin ninguno no sale en ninguna.
alter table public.documents drop constraint if exists documents_pertenencia_check;
alter table public.documents add constraint documents_pertenencia_check check (
  (child_id is not null)::int + (school_id is not null)::int + (student_id is not null)::int = 1
);

drop policy if exists "documents_select_estudiante" on public.documents;
create policy "documents_select_estudiante" on public.documents
  for select to authenticated
  using (student_id is not null and (select public.has_perm('gabinete:view')));

drop policy if exists "documents_write_estudiante" on public.documents;
create policy "documents_write_estudiante" on public.documents
  for all to authenticated
  using (student_id is not null and (select public.has_perm('gabinete:session:create')))
  with check (student_id is not null and (select public.has_perm('gabinete:session:create')));

------------------------------------------------------------------------------
-- Tipos de documento del expediente del estudiante. Los dos ultimos tienen
-- formato propio (Tutor Aira_Registro Supervicion y _Reporte Quincenal), asi
-- que ademas del PDF se pueden llenar campo a campo — el contenido
-- estructurado va en documents.fields.
------------------------------------------------------------------------------
alter table public.documents drop constraint if exists documents_type_check;
alter table public.documents add constraint documents_type_check check (type = any (array[
  -- expediente clinico del paciente
  'anamnesis', 'evaluacion', 'reporte', 'informe', 'plan_trabajo', 'pautas_crianza',
  -- expediente del estudiante en gabinete
  'plan_trabajo_tutor', 'supervision', 'tutor_quincenal',
  -- del colegio
  'minuta_interdisciplinaria'
]));

commit;
