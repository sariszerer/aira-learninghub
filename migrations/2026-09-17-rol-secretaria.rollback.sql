-- Solo si nadie lo tiene puesto: borrar un rol en uso deja a esa persona sin
-- alcance ni permisos, que es peor que dejar el rol.
delete from role_permissions where role_id = 'secretaria';
delete from roles where id = 'secretaria'
  and not exists (select 1 from users where role_id = 'secretaria');
