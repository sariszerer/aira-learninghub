-- 2026-09-04 — Reportes, fase 1: los datos que la especificacion pide y la
-- base no guarda.
--
-- Formatos_Reportes_AIRA.docx define tres reportes (Evolucion, Historial
-- Clinico Completo, Reporte para Padres). La mayoria de sus secciones se puede
-- componer con lo que ya hay, pero siete campos no existen en ninguna tabla y
-- sin ellos esas secciones solo podrian salir vacias.
--
-- Rollback: 2026-09-04-reportes-fase1-datos.rollback.sql

begin;

------------------------------------------------------------------------------
-- children — encabezado y "Datos de identificacion" del Historial.
------------------------------------------------------------------------------
alter table public.children add column if not exists record_no        text;
alter table public.children add column if not exists school           text;
alter table public.children add column if not exists referral_reason  text;
alter table public.children add column if not exists discharge_date   date;
alter table public.children add column if not exists discharge_reason text;

-- N° de expediente para los 44 existentes, por orden de ingreso. Se numera por
-- admission_date y, para los que no la tienen, por created_at: asi el numero
-- refleja el orden real de llegada a la clinica y no el azar del id.
update public.children c
set record_no = 'AIRA-' || lpad(n::text, 4, '0')
from (
  select id, row_number() over (order by coalesce(admission_date, created_at::date), created_at, id) n
  from public.children
) o
where o.id = c.id and c.record_no is null;

-- Unico, pero permitiendo nulos: un paciente creado desde la aplicacion recibe
-- el suyo en el cliente y no debe chocar con otro.
create unique index if not exists children_record_no_key
  on public.children (record_no) where record_no is not null;

-- El estado pasa de activo/inactivo a los cuatro que pide el documento
-- ("Activo / en pausa / de alta"). 'inactivo' se conserva como valor valido
-- para no reescribir las 4 filas que lo tienen sin que nadie lo decida.
alter table public.children drop constraint if exists children_status_check;
alter table public.children add constraint children_status_check
  check (status is null or status in ('activo', 'pausa', 'alta', 'inactivo'));

------------------------------------------------------------------------------
-- users — "Firma y validacion" del Reporte de Evolucion pide el N° de
-- licencia/idoneidad del especialista.
------------------------------------------------------------------------------
alter table public.users add column if not exists license_no text;

------------------------------------------------------------------------------
-- sessions — "Resumen de asistencia" y "Metricas de asistencia global".
--
-- Hoy una sesion registrada equivale a una sesion dada: no hay forma de
-- distinguir una ausencia de una sesion que nunca se agendo. Las 438 filas
-- existentes se marcan 'asistio' porque provienen del calendario ya ocurrido.
------------------------------------------------------------------------------
alter table public.sessions add column if not exists attendance text not null default 'asistio';
alter table public.sessions drop constraint if exists sessions_attendance_check;
alter table public.sessions add constraint sessions_attendance_check
  check (attendance in ('asistio', 'cancelo', 'no_show', 'reprogramada'));

------------------------------------------------------------------------------
-- objectives — escala GAS.
--
-- GAS (Goal Attainment Scaling) puntua de -2 a +2, donde 0 es la meta esperada:
--   -2 mucho peor que la linea base   -1 linea base / sin cambio
--    0 meta esperada                  +1 algo mejor    +2 mucho mejor
-- El documento la pide en tres sitios: "Objetivos vigentes", "Avance por
-- objetivo" (actual vs linea base y meta) y "Como le fue" del reporte a padres.
--
-- Convive con status (logrado/proceso/apoyo), que es el semaforo rapido de la
-- interfaz; GAS es la medida clinica. Nulo mientras la especialista no la fije.
------------------------------------------------------------------------------
alter table public.objectives add column if not exists gas_baseline smallint;
alter table public.objectives add column if not exists gas_target   smallint;
alter table public.objectives add column if not exists gas_current  smallint;
alter table public.objectives add column if not exists methodology  text;
alter table public.objectives drop constraint if exists objectives_gas_check;
alter table public.objectives add constraint objectives_gas_check check (
      (gas_baseline is null or gas_baseline between -2 and 2)
  and (gas_target   is null or gas_target   between -2 and 2)
  and (gas_current  is null or gas_current  between -2 and 2)
);

------------------------------------------------------------------------------
-- evolution_reports — "Reportes de evolucion compilados" del Historial pide el
-- listado cronologico de los generados. Hoy solo se guardan los de padres, asi
-- que esa seccion no tendria de donde salir.
--
-- El contenido se guarda entero (jsonb) y no solo el rango: un reporte es una
-- foto de un momento, y recalcularlo meses despues con objetivos ya cambiados
-- daria un texto distinto al que se firmo.
------------------------------------------------------------------------------
create table if not exists public.evolution_reports (
  id             text primary key,
  child_id       text not null references public.children(id) on delete cascade,
  specialty      text,
  specialist_id  text references public.users(id),
  from_date      date not null,
  to_date        date not null,
  generated_date date not null default current_date,
  generated_by   text references public.users(id),
  content        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists evolution_reports_child_idx
  on public.evolution_reports (child_id, generated_date desc);

alter table public.evolution_reports enable row level security;

-- Mismo criterio que el resto desde la fase 3 de roles: autoriza el permiso, no
-- el nombre del rol, y el alcance lo resuelve can_see_child.
drop policy if exists "evolution_reports_select" on public.evolution_reports;
create policy "evolution_reports_select" on public.evolution_reports
  for select to authenticated
  using ((select public.has_perm('report:view')) and public.can_see_child(child_id));

drop policy if exists "evolution_reports_insert" on public.evolution_reports;
create policy "evolution_reports_insert" on public.evolution_reports
  for insert to authenticated
  with check ((select public.has_perm('report:evolution:generate')) and public.can_see_child(child_id));

drop policy if exists "evolution_reports_delete" on public.evolution_reports;
create policy "evolution_reports_delete" on public.evolution_reports
  for delete to authenticated
  using ((select public.has_perm('report:evolution:generate')) and public.can_see_child(child_id));

------------------------------------------------------------------------------
-- Permisos nuevos.
--
-- El documento separa quien genera cada reporte: Evolucion y Padres los hace el
-- especialista tratante o un administrador; el Historial Clinico Completo es
-- "Administrador y Direccion Clinica unicamente", por ser el mas sensible.
-- report:generate cubria los dos a la vez, asi que se parte en dos.
------------------------------------------------------------------------------
insert into public.permissions (key, grupo, descripcion) values
  ('report:evolution:generate', 'Reportes', 'Generar reporte de evolución'),
  ('report:history:generate',   'Reportes', 'Generar historial clínico completo')
on conflict (key) do nothing;

-- Quien tuviera report:generate conserva la capacidad de generar evolucion.
insert into public.role_permissions (role_id, permission_key)
select role_id, 'report:evolution:generate' from public.role_permissions
where permission_key = 'report:generate'
on conflict do nothing;

-- El historial solo para quien ya podia gestionar usuarios o roles. Eso alcanza
-- a admin pero no a clinical_director, que no gestiona ninguna de las dos
-- cosas, asi que se le anade explicitamente: el documento lo restringe a
-- "Administrador y Direccion Clinica unicamente".
insert into public.role_permissions (role_id, permission_key)
select distinct role_id, 'report:history:generate' from public.role_permissions
where permission_key in ('user:manage', 'role:manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_key)
values ('clinical_director', 'report:history:generate')
on conflict do nothing;

commit;
