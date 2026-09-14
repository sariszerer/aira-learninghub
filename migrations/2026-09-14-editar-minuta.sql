-- Corregir una minuta ya registrada.
--
-- No se podia: meetings solo tenia politicas de INSERT y SELECT, asi que un
-- nombre mal escrito o un acuerdo que faltaba se quedaban ahi para siempre. Y
-- una minuta sale del centro — va al colegio, al especialista externo — asi
-- que un error en ella no es un detalle interno.
--
-- El par own/any es el mismo que ya rige sesiones y documentos: quien la
-- registro la corrige, y direccion corrige cualquiera. Reunirlas en un solo
-- permiso dejaria a una especialista editando la minuta que escribio otra
-- sobre un paciente que comparten.
insert into permissions (key, grupo, descripcion) values
  ('meeting:edit:own', 'Interdisciplinario', 'Editar sus propias minutas'),
  ('meeting:edit:any', 'Interdisciplinario', 'Editar minutas de cualquiera')
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_key)
select r.id, 'meeting:edit:any' from roles r where r.id in ('admin', 'clinical_director')
on conflict do nothing;

insert into role_permissions (role_id, permission_key)
values ('specialist', 'meeting:edit:own')
on conflict do nothing;

-- Calcado de documents_update. can_see_child sigue mandando: sin acceso al
-- expediente no se edita nada de el, tenga el permiso que tenga.
create policy meetings_update on meetings
  for update to authenticated
  using (
    can_see_child(child_id) and (
      (select has_perm('meeting:edit:any'))
      or ((select has_perm('meeting:edit:own')) and created_by = (select app_user_id()))
    )
  )
  with check (
    can_see_child(child_id) and (
      (select has_perm('meeting:edit:any'))
      or ((select has_perm('meeting:edit:own')) and created_by = (select app_user_id()))
    )
  );
