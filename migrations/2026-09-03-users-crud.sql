-- 2026-09-03 — Escritura sobre public.users para la pantalla de especialistas.
--
-- La tabla solo tenia politica de SELECT, asi que cualquier alta o edicion desde
-- la aplicacion la rechazaba RLS en silencio.
--
-- Se restringe a rol admin usando current_app_user(), el mismo patron de las
-- demas tablas. Cuando la fase 3 de roles reemplace los literales por permisos,
-- estas tres politicas pasan a `has_perm('user:manage')` junto con el resto.
--
-- Rollback: 2026-09-03-users-crud.rollback.sql

begin;

------------------------------------------------------------------------------
-- Alta. La fila de public.users es el perfil; el usuario de auth lo crea la
-- Edge Function crear-especialista, que corre con service_role.
------------------------------------------------------------------------------
create policy "users_insert" on public.users
  for insert to authenticated
  with check (exists (select 1 from current_app_user() u where u.role = 'admin'));

------------------------------------------------------------------------------
-- Edicion. Dos caminos: un admin edita a cualquiera, y cualquier persona edita
-- su propia fila — pero NUNCA su propio rol, que lo impide el trigger de abajo.
------------------------------------------------------------------------------
create policy "users_update" on public.users
  for update to authenticated
  using (
    exists (select 1 from current_app_user() u where u.role = 'admin')
    or exists (select 1 from current_app_user() u where u.id = users.id)
  )
  with check (
    exists (select 1 from current_app_user() u where u.role = 'admin')
    or exists (select 1 from current_app_user() u where u.id = users.id)
  );

------------------------------------------------------------------------------
-- Nadie cambia su propio rol, ni siquiera un admin. Tiene que ser trigger y no
-- politica: una politica ve la fila entera, no distingue que columna cambio.
--
-- Sin esto, cualquiera que alcance su propia fila se asciende a admin de un
-- clic. Con esto hacen falta dos personas.
------------------------------------------------------------------------------
create or replace function public.block_self_role_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  actor text;
begin
  select id into actor from public.users where auth_id = auth.uid();
  if new.role is distinct from old.role and old.id = actor then
    raise exception 'No puedes cambiar tu propio rol';
  end if;
  return new;
end $$;

drop trigger if exists trg_block_self_role_change on public.users;
create trigger trg_block_self_role_change
  before update on public.users
  for each row execute function public.block_self_role_change();

------------------------------------------------------------------------------
-- Baja. No se elimina la fila: un especialista figura en sesiones, objetivos y
-- documentos historicos, y borrarlo dejaria huerfano el expediente clinico.
-- La pantalla desactiva marcando la fila; esta politica existe solo para que un
-- admin pueda limpiar un perfil creado por error y que nunca se uso.
------------------------------------------------------------------------------
create policy "users_delete" on public.users
  for delete to authenticated
  using (
    exists (select 1 from current_app_user() u where u.role = 'admin')
    and not exists (select 1 from public.sessions s where s.specialist_id = users.id)
    and not exists (select 1 from public.objectives o where o.specialist_id = users.id)
  );

------------------------------------------------------------------------------
-- Columna de estado, para poder desactivar sin borrar.
------------------------------------------------------------------------------
alter table public.users
  add column if not exists activo boolean not null default true;

commit;
