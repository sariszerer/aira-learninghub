-- Un usuario no puede ascenderse a si mismo.
--
-- La politica users_update decia:
--   has_perm('user:manage') OR id = app_user_id()
-- El segundo termino existe para que cada quien edite su propio perfil — hoy
-- hace falta para guardar la firma digital — pero RLS autoriza FILAS, no
-- COLUMNAS. Con esa politica cualquier especialista autenticado podia hacer
--   update users set role_id = 'admin' where id = <el suyo>
-- y quedarse con los permisos de administracion, incluido el de borrar
-- pacientes. Tambien podia apuntar assigned_child_id a cualquier nino y saltarse
-- can_see_child, que es lo que separa un expediente de otro.
--
-- Postgres no permite restringir columnas desde una politica, asi que la
-- proteccion va en un trigger. Se cierra la lista de columnas sensibles en vez
-- de enumerar las libres: una columna nueva nace protegida y no olvidada.
--
-- auth.uid() nulo significa que quien escribe es el backend con service_role
-- (las funciones edge crear-especialista y cambiar-correo). Ese camino ya esta
-- autenticado por su propia clave y no pasa por RLS.

create or replace function public.proteger_privilegios_usuario()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then return new; end if;
  if (select has_perm('user:manage')) then return new; end if;

  if new.id               is distinct from old.id
  or new.role             is distinct from old.role
  or new.role_id          is distinct from old.role_id
  or new.auth_id          is distinct from old.auth_id
  or new.assigned_child_id is distinct from old.assigned_child_id
  or new.activo           is distinct from old.activo then
    raise exception 'Solo la administración puede cambiar el rol, el acceso o la asignación de un usuario'
      using errcode = '42501';
  end if;

  return new;
end
$$;

drop trigger if exists users_proteger_privilegios on users;
create trigger users_proteger_privilegios
  before update on users
  for each row execute function proteger_privilegios_usuario();
