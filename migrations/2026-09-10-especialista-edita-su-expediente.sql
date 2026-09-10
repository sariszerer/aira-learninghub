-- La especialista edita el expediente del niño que atiende, pero no decide
-- quién más lo ve.
--
-- Son dos cosas distintas que hasta ahora viajaban en el mismo permiso. El
-- modal de perfil deja cambiar los datos del niño Y la lista de especialistas
-- asignados, y esa lista no es un dato del paciente: es el control de acceso a
-- su expediente. Quien la edita decide quién entra.
--
-- Se separan. patient:edit pasa a la especialista — corrige la fecha de
-- nacimiento, el colegio, el motivo de consulta, el contacto de la familia — y
-- la asignación se queda en un permiso nuevo que solo tiene dirección.

insert into permissions (key, grupo, descripcion)
values ('patient:assign', 'Pacientes', 'Asignar especialistas a un paciente')
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_key)
select r.id, 'patient:assign' from roles r where r.id in ('admin', 'clinical_director')
on conflict do nothing;

insert into role_permissions (role_id, permission_key)
values ('specialist', 'patient:edit')
on conflict do nothing;

-- La regla se cumple en la base, no en la pantalla.
--
-- RLS autoriza filas, no columnas: children_update ya permite a la especialista
-- escribir en la fila de su paciente, y no hay forma de decir "en esta fila sí
-- pero en esta columna no". Va en un trigger, igual que el que protege el rol
-- de un usuario.
--
-- auth.uid() nulo es el backend con service_role, que ya viene autenticado por
-- su propia clave.
create or replace function public.proteger_asignacion_paciente()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then return new; end if;
  if new.assigned_specialists is distinct from old.assigned_specialists
     and not (select has_perm('patient:assign')) then
    raise exception 'Solo la dirección asigna especialistas a un paciente'
      using errcode = '42501';
  end if;
  return new;
end
$$;

drop trigger if exists children_proteger_asignacion on children;
create trigger children_proteger_asignacion
  before update on children
  for each row execute function proteger_asignacion_paciente();
