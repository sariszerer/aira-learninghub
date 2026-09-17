-- Secretaria: sube los archivos del expediente y lleva el control de que esten.
--
-- es_sistema en false a proposito: los cuatro roles base no se pueden tocar
-- desde la aplicacion, y este si debe poder ajustarlo direccion sin pedir un
-- cambio de codigo.
insert into roles (id, nombre, etiqueta, color, scope, home, es_clinico, es_sistema)
values ('secretaria', 'Secretaría', 'Secretaría', 'inkFaint', 'todos', 'admin', false, false)
on conflict (id) do nothing;

-- Lo que puede hacer. Ni una sola de edicion sobre lo clinico: sube documentos
-- y nada mas. No hay session:create, objective:*, anamnesis:edit, patient:edit,
-- ni ninguno de los report:*:generate.
insert into role_permissions (role_id, permission_key)
select 'secretaria', k from unnest(array[
  'patient:view',      -- llegar al expediente y saber de quien es
  'session:view',      -- paquetes y asistencia
  'document:view',     -- abrir los documentos
  'document:create',   -- subirlos: es su trabajo
  'anamnesis:view',    -- ver si falta el consentimiento firmado
  'report:view'        -- la pestaña donde viven los documentos
]) as k
on conflict do nothing;
