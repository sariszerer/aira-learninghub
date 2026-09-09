-- Borrar un paciente: permiso propio y politica de DELETE.
--
-- Hasta ahora children no tenia politica DELETE, asi que borrar era imposible
-- desde el cliente. Se abre con un permiso NUEVO en vez de reutilizar
-- patient:edit porque las dos acciones no se parecen en nada: editar corrige un
-- dato, borrar arrastra en cascada sesiones, objetivos, documentos, reuniones y
-- reportes de evolucion de un menor, y no hay vuelta atras.
--
-- No sustituye a "cerrar proceso". Un paciente que termina su tratamiento se
-- cierra y conserva su historia; esto es para el expediente creado por error o
-- duplicado, que nunca debio existir.
--
-- Solo administracion y direccion clinica. Un especialista con pacientes
-- asignados NO deberia poder vaciar un expediente entero.

insert into permissions (key, grupo, descripcion)
values ('patient:delete', 'Pacientes', 'Borrar pacientes y todo su expediente')
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_key)
select r.id, 'patient:delete' from roles r where r.id in ('admin', 'clinical_director')
on conflict do nothing;

-- can_see_child se mantiene en el USING: quien no puede ver al paciente tampoco
-- puede borrarlo, igual que en update.
create policy children_delete on children
  for delete to authenticated
  using (can_see_child(id) and (select has_perm('patient:delete')));
