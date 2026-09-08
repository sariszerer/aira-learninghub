-- 2026-09-08 — Programa de preescolar: tamizaje por nivel y ruta del caso.
--
-- El preescolar de MDA contrata un tamizaje de PK1 a PK5. Lo que se hace con
-- cada niño no es archivar un documento: es medirlo y DECIDIR — se queda con
-- atencion en la escuela, se deriva al centro, o las dos. Esa decision hay que
-- poder consultarla, no solo leerla en una nota.
--
-- El estudiante es la misma entidad que en tutoria. No hay tabla aparte: en los
-- dos programas es un niño al que se le sigue dentro de un colegio, y separarlos
-- habria duplicado la pantalla, el enlace con el expediente clinico y las
-- politicas.
--
-- Rollback: 2026-09-08-preescolar-tamizaje.rollback.sql

begin;

------------------------------------------------------------------------------
-- Nivel y ruta del caso.
--
-- El nivel es campo propio y no texto libre porque el programa se organiza por
-- el: "los de PK3" tiene que ser una consulta, no una busqueda por cadena.
-- Queda nulo en tutoria, donde el grado si es libre.
------------------------------------------------------------------------------
alter table public.gabinete_estudiantes add column if not exists nivel text;
alter table public.gabinete_estudiantes drop constraint if exists gabinete_estudiantes_nivel_check;
alter table public.gabinete_estudiantes add constraint gabinete_estudiantes_nivel_check
  check (nivel is null or nivel in ('PK1', 'PK2', 'PK3', 'PK4', 'PK5'));

-- La ruta es el ESTADO del caso, no un documento. "Se queda en la escuela" y
-- "se deriva al centro" son los dos destinos que pidio la clinica, y hay casos
-- que son los dos a la vez: escuela por la mañana, centro por la tarde.
alter table public.gabinete_estudiantes add column if not exists ruta text not null default 'sin_evaluar';
alter table public.gabinete_estudiantes drop constraint if exists gabinete_estudiantes_ruta_check;
alter table public.gabinete_estudiantes add constraint gabinete_estudiantes_ruta_check
  check (ruta in ('sin_evaluar', 'observacion', 'escuela', 'centro', 'ambas', 'alta'));

alter table public.gabinete_estudiantes add column if not exists fecha_ruta date;

create index if not exists gabinete_estudiantes_nivel_idx
  on public.gabinete_estudiantes (school_id, nivel) where nivel is not null;

------------------------------------------------------------------------------
-- Tamizajes.
--
-- Tabla propia y no un documento porque el RESULTADO decide la ruta y tiene que
-- ser consultable: cuantos de PK3 salieron con alerta, cuantos derivados siguen
-- sin expediente. Eso dentro de un jsonb de documento no se puede preguntar.
--
-- `detalle` guarda los items del instrumento, que varian de una prueba a otra y
-- todavia no estan definidos. Las columnas de arriba son lo que no cambia
-- aunque cambie el instrumento.
------------------------------------------------------------------------------
create table if not exists public.tamizajes (
  id            text primary key,
  student_id    text not null references public.gabinete_estudiantes(id) on delete cascade,
  fecha         date not null,
  instrumento   text,
  aplicado_por  text references public.users(id),
  resultado     text not null default 'pendiente',
  areas_alerta  text[] default '{}',
  observaciones text,
  recomendacion text,
  detalle       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- Los tres desenlaces de un tamizaje. 'pendiente' existe para poder registrar
-- que se aplico antes de tener la lectura: sin el, o se inventa un resultado o
-- no se puede guardar la aplicacion.
alter table public.tamizajes drop constraint if exists tamizajes_resultado_check;
alter table public.tamizajes add constraint tamizajes_resultado_check
  check (resultado in ('pendiente', 'sin_hallazgos', 'seguimiento', 'derivar'));

create index if not exists tamizajes_student_idx on public.tamizajes (student_id, fecha desc);

alter table public.tamizajes enable row level security;

drop policy if exists "tamizajes_select" on public.tamizajes;
create policy "tamizajes_select" on public.tamizajes
  for select to authenticated using ((select public.has_perm('gabinete:view')));

drop policy if exists "tamizajes_write" on public.tamizajes;
create policy "tamizajes_write" on public.tamizajes
  for all to authenticated
  using ((select public.has_perm('gabinete:session:create')))
  with check ((select public.has_perm('gabinete:session:create')));

------------------------------------------------------------------------------
-- Documentos del programa de preescolar.
------------------------------------------------------------------------------
alter table public.documents drop constraint if exists documents_type_check;
alter table public.documents add constraint documents_type_check check (type = any (array[
  -- expediente clinico del paciente
  'anamnesis', 'evaluacion', 'reporte', 'informe', 'plan_trabajo', 'pautas_crianza',
  -- programa de tutoria
  'plan_trabajo_tutor', 'supervision', 'tutor_quincenal',
  -- programa de preescolar
  'plan_preescolar', 'seguimiento_caso', 'informe_familia',
  -- del colegio
  'minuta_interdisciplinaria'
]));

commit;
