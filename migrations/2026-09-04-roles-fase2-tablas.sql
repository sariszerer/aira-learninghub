-- 2026-09-04 — Fase 2 de roles y permisos: los roles pasan a ser datos.
--
-- Hasta ahora la matriz vivia en src/permissions.js, asi que crear un rol
-- exigia un despliegue. Aqui se mueve a tablas.
--
-- SIN CAMBIO DE COMPORTAMIENTO: la siembra se genera importando la propia
-- matriz del codigo, no transcribiendola. Transcribir 34 claves por 4 roles a
-- mano es donde se cuela el error que cambia quien puede hacer que.
--
-- Los permisos siguen aplicandose solo en el cliente. Que la base autorice por
-- permiso y no por nombre de rol es la fase 3; esta no toca ninguna politica
-- existente.
--
-- Rollback: 2026-09-04-roles-fase2-tablas.rollback.sql

begin;

------------------------------------------------------------------------------
-- Catalogo de permisos. Semilla, no editable desde la aplicacion: un permiso
-- que el codigo no verifica no protege nada.
------------------------------------------------------------------------------
create table if not exists public.permissions (
  key         text primary key,
  grupo       text not null,
  descripcion text not null
);

------------------------------------------------------------------------------
-- Roles. Estos si son creables desde la aplicacion (fase 4).
--
-- Los cuatro atributos que no son permisos existen porque no son deducibles
-- para un rol nuevo: a que panel entra, si aparece en selectores de terapeuta,
-- que pacientes alcanza y como se muestra.
------------------------------------------------------------------------------
create table if not exists public.roles (
  id          text primary key,
  nombre      text not null,
  scope       text not null check (scope in ('todos','asignados','un_nino')),
  home        text not null check (home in ('admin','clinico','especialista','tutor')),
  es_clinico  boolean not null default false,
  etiqueta    text not null,
  color       text,
  es_sistema  boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id        text references public.roles(id) on delete cascade,
  permission_key text references public.permissions(key) on delete cascade,
  primary key (role_id, permission_key)
);

------------------------------------------------------------------------------
-- users.role_id. La columna `role` NO se elimina: se rellena desde ella y
-- conviven. Es la ruta de rollback — revertir el cliente basta, sin migracion
-- inversa de datos. Se quita en un cambio posterior, cuando lleve semanas
-- estable.
------------------------------------------------------------------------------
alter table public.users add column if not exists role_id text references public.roles(id);

-- Catalogo de permisos. Generado desde src/permissions.js.
insert into public.permissions (key, grupo, descripcion) values
  ('patient:view', 'Pacientes', 'Ver fichas de pacientes'),
  ('patient:create', 'Pacientes', 'Dar de alta pacientes'),
  ('patient:edit', 'Pacientes', 'Editar datos del paciente'),
  ('patient:close', 'Pacientes', 'Cerrar proceso clínico'),
  ('patient:renew_package', 'Pacientes', 'Renovar paquete de sesiones'),
  ('session:view', 'Sesiones', 'Ver sesiones'),
  ('session:create', 'Sesiones', 'Registrar sesiones'),
  ('session:edit:own', 'Sesiones', 'Editar sus propias sesiones'),
  ('session:edit:any', 'Sesiones', 'Editar sesiones de cualquiera'),
  ('objective:view', 'Objetivos', 'Ver objetivos'),
  ('objective:create', 'Objetivos', 'Crear objetivos'),
  ('objective:edit:own', 'Objetivos', 'Editar y borrar sus objetivos'),
  ('objective:edit:any', 'Objetivos', 'Editar y borrar objetivos de cualquiera'),
  ('document:view', 'Documentos', 'Ver documentos'),
  ('document:create', 'Documentos', 'Subir documentos'),
  ('document:edit:own', 'Documentos', 'Editar sus propios documentos'),
  ('document:edit:any', 'Documentos', 'Editar documentos de cualquiera'),
  ('anamnesis:view', 'Clínico', 'Ver anamnesis'),
  ('anamnesis:edit', 'Clínico', 'Editar anamnesis'),
  ('workplan:view', 'Clínico', 'Ver plan de trabajo'),
  ('workplan:create', 'Clínico', 'Crear plan de trabajo'),
  ('report:view', 'Reportes', 'Ver reportes'),
  ('report:generate', 'Reportes', 'Generar historial y evolución'),
  ('report:parent:generate', 'Reportes', 'Generar reporte para padres'),
  ('meeting:view', 'Interdisciplinario', 'Ver reuniones'),
  ('meeting:create', 'Interdisciplinario', 'Registrar reuniones'),
  ('guidelines:view', 'Interdisciplinario', 'Ver pautas interdisciplinarias'),
  ('gabinete:view', 'Gabinete', 'Acceder al panel de gabinete'),
  ('gabinete:session:create', 'Gabinete', 'Registrar sesiones de gabinete'),
  ('school:create', 'Gabinete', 'Dar de alta colegios'),
  ('tutorreport:view', 'Tutores', 'Ver reportes de tutor'),
  ('tutorreport:create', 'Tutores', 'Crear reportes de tutor'),
  ('user:manage', 'Administración', 'Gestionar usuarios'),
  ('role:manage', 'Administración', 'Crear y modificar roles')
on conflict (key) do update set grupo = excluded.grupo, descripcion = excluded.descripcion;

-- Los 4 roles actuales, como filas de sistema.
insert into public.roles (id, nombre, scope, home, es_clinico, etiqueta, color, es_sistema) values
  ('admin', 'Administración', 'todos', 'admin', false, 'Admin', 'amberDeep', true),
  ('clinical_director', 'Dirección clínica', 'todos', 'clinico', true, 'Dir. Clínica', 'brandBright', true),
  ('specialist', 'Especialista', 'asignados', 'especialista', true, 'Especialista', 'inkFaint', true),
  ('shadow', 'Tutor AIRA', 'un_nino', 'tutor', false, 'Tutor AIRA', 'inkFaint', true)
on conflict (id) do update set nombre = excluded.nombre, scope = excluded.scope,
  home = excluded.home, es_clinico = excluded.es_clinico, etiqueta = excluded.etiqueta,
  color = excluded.color;

-- 86 concesiones, tomadas una a una de la matriz del codigo.
insert into public.role_permissions (role_id, permission_key) values
  ('admin', 'patient:view'),
  ('admin', 'session:view'),
  ('admin', 'objective:view'),
  ('admin', 'document:view'),
  ('admin', 'anamnesis:view'),
  ('admin', 'workplan:view'),
  ('admin', 'report:view'),
  ('admin', 'meeting:view'),
  ('admin', 'patient:create'),
  ('admin', 'patient:edit'),
  ('admin', 'patient:close'),
  ('admin', 'patient:renew_package'),
  ('admin', 'session:edit:any'),
  ('admin', 'objective:create'),
  ('admin', 'objective:edit:any'),
  ('admin', 'document:create'),
  ('admin', 'document:edit:any'),
  ('admin', 'anamnesis:edit'),
  ('admin', 'workplan:create'),
  ('admin', 'report:generate'),
  ('admin', 'report:parent:generate'),
  ('admin', 'meeting:create'),
  ('admin', 'guidelines:view'),
  ('admin', 'gabinete:view'),
  ('admin', 'gabinete:session:create'),
  ('admin', 'school:create'),
  ('admin', 'user:manage'),
  ('admin', 'role:manage'),
  ('clinical_director', 'patient:view'),
  ('clinical_director', 'session:view'),
  ('clinical_director', 'objective:view'),
  ('clinical_director', 'document:view'),
  ('clinical_director', 'anamnesis:view'),
  ('clinical_director', 'workplan:view'),
  ('clinical_director', 'report:view'),
  ('clinical_director', 'meeting:view'),
  ('clinical_director', 'tutorreport:view'),
  ('clinical_director', 'patient:edit'),
  ('clinical_director', 'patient:close'),
  ('clinical_director', 'patient:renew_package'),
  ('clinical_director', 'session:create'),
  ('clinical_director', 'session:edit:any'),
  ('clinical_director', 'objective:create'),
  ('clinical_director', 'objective:edit:any'),
  ('clinical_director', 'document:create'),
  ('clinical_director', 'document:edit:any'),
  ('clinical_director', 'anamnesis:edit'),
  ('clinical_director', 'workplan:create'),
  ('clinical_director', 'report:generate'),
  ('clinical_director', 'report:parent:generate'),
  ('clinical_director', 'meeting:create'),
  ('clinical_director', 'guidelines:view'),
  ('clinical_director', 'gabinete:view'),
  ('clinical_director', 'gabinete:session:create'),
  ('clinical_director', 'school:create'),
  ('specialist', 'patient:view'),
  ('specialist', 'session:view'),
  ('specialist', 'objective:view'),
  ('specialist', 'document:view'),
  ('specialist', 'anamnesis:view'),
  ('specialist', 'workplan:view'),
  ('specialist', 'report:view'),
  ('specialist', 'meeting:view'),
  ('specialist', 'patient:close'),
  ('specialist', 'patient:renew_package'),
  ('specialist', 'session:create'),
  ('specialist', 'session:edit:own'),
  ('specialist', 'objective:create'),
  ('specialist', 'objective:edit:own'),
  ('specialist', 'document:create'),
  ('specialist', 'document:edit:own'),
  ('specialist', 'anamnesis:edit'),
  ('specialist', 'workplan:create'),
  ('specialist', 'report:generate'),
  ('specialist', 'report:parent:generate'),
  ('specialist', 'meeting:create'),
  ('shadow', 'patient:view'),
  ('shadow', 'session:view'),
  ('shadow', 'objective:view'),
  ('shadow', 'document:view'),
  ('shadow', 'anamnesis:view'),
  ('shadow', 'workplan:view'),
  ('shadow', 'report:view'),
  ('shadow', 'meeting:view'),
  ('shadow', 'tutorreport:view'),
  ('shadow', 'tutorreport:create')
on conflict do nothing;

------------------------------------------------------------------------------
-- Backfill: cada usuario apunta al rol que ya tenia por nombre.
------------------------------------------------------------------------------
update public.users set role_id = role where role_id is null and role in (select id from public.roles);

------------------------------------------------------------------------------
-- RLS de las tablas nuevas.
--
-- Lectura para cualquier autenticado: el catalogo y las etiquetas no son
-- secretos y el cliente los necesita para pintar la interfaz. Escritura solo
-- para admin, y nunca sobre las filas de sistema — asi siempre queda un rol
-- admin completo aunque alguien destroce los demas.
------------------------------------------------------------------------------
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;

create policy "permissions_select" on public.permissions
  for select to authenticated using (true);

create policy "roles_select" on public.roles
  for select to authenticated using (true);

create policy "role_permissions_select" on public.role_permissions
  for select to authenticated using (true);

create policy "roles_insert" on public.roles
  for insert to authenticated
  with check (exists (select 1 from current_app_user() u where u.role = 'admin'));

create policy "roles_update" on public.roles
  for update to authenticated
  using (es_sistema = false and exists (select 1 from current_app_user() u where u.role = 'admin'))
  with check (es_sistema = false and exists (select 1 from current_app_user() u where u.role = 'admin'));

create policy "roles_delete" on public.roles
  for delete to authenticated
  using (
    es_sistema = false
    and exists (select 1 from current_app_user() u where u.role = 'admin')
    -- no se borra un rol que alguien tenga puesto: dejaria usuarios sin
    -- permisos y, con el fallo cerrado del cliente, sin ver absolutamente nada
    and not exists (select 1 from public.users x where x.role_id = roles.id)
  );

create policy "role_permissions_write" on public.role_permissions
  for all to authenticated
  using (exists (
    select 1 from current_app_user() u
    join public.roles r on r.id = role_permissions.role_id
    where u.role = 'admin' and r.es_sistema = false))
  with check (exists (
    select 1 from current_app_user() u
    join public.roles r on r.id = role_permissions.role_id
    where u.role = 'admin' and r.es_sistema = false));

commit;
