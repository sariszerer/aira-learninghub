drop trigger if exists children_proteger_asignacion on children;
drop function if exists public.proteger_asignacion_paciente();
delete from role_permissions where role_id = 'specialist' and permission_key = 'patient:edit';
delete from role_permissions where permission_key = 'patient:assign';
delete from permissions where key = 'patient:assign';
