-- El Registro de Supervisión y Observación Escolar solo lo escribe dirección.
--
-- Los tres documentos del expediente de tutoria compartian una sola llave,
-- gabinete:session:create, asi que quien podia subir el Plan de Trabajo podia
-- tambien escribir la supervision. No es lo mismo: la supervision es la
-- valoracion QUE SE HACE SOBRE la tutora — observa su intervencion y califica
-- su nivel de apoyo. Que la persona evaluada pueda editar su propia evaluacion
-- vacia el instrumento.
--
-- Leerla si puede, y debe: es su devolucion. Eso lo da documents_select_estudiante
-- con gabinete:view, que sigue intacta — las politicas permisivas se suman, asi
-- que restringir la escritura no cierra la lectura.

insert into permissions (key, grupo, descripcion)
values ('gabinete:supervision:write', 'Gabinete',
        'Escribir el registro de supervisión (evaluación de la tutora)')
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_key)
select r.id, 'gabinete:supervision:write' from roles r where r.id in ('admin', 'clinical_director')
on conflict do nothing;

-- La politica general de documentos de estudiante deja de cubrir la supervision.
drop policy if exists documents_write_estudiante on documents;
create policy documents_write_estudiante on documents
  for all to authenticated
  using (student_id is not null and type <> 'supervision'
         and (select has_perm('gabinete:session:create')))
  with check (student_id is not null and type <> 'supervision'
              and (select has_perm('gabinete:session:create')));

create policy documents_write_supervision on documents
  for all to authenticated
  using (student_id is not null and type = 'supervision'
         and (select has_perm('gabinete:supervision:write')))
  with check (student_id is not null and type = 'supervision'
              and (select has_perm('gabinete:supervision:write')));
