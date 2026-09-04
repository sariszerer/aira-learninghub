-- Rollback de 2026-09-04-roles-fase3b-admin.sql
-- Devuelve las politicas de administracion a comprobar el nombre del rol.

begin;

drop policy if exists "users_insert" on public.users;
drop policy if exists "users_update" on public.users;
drop policy if exists "users_delete" on public.users;
drop policy if exists "roles_insert" on public.roles;
drop policy if exists "roles_update" on public.roles;
drop policy if exists "roles_delete" on public.roles;
drop policy if exists "role_permissions_write" on public.role_permissions;

create policy "users_insert" on public.users for insert to authenticated
  with check (exists (select 1 from current_app_user() u where u.role = 'admin'));
create policy "users_update" on public.users for update to authenticated
  using (exists (select 1 from current_app_user() u where u.role = 'admin')
         or exists (select 1 from current_app_user() u where u.id = users.id))
  with check (exists (select 1 from current_app_user() u where u.role = 'admin')
              or exists (select 1 from current_app_user() u where u.id = users.id));
create policy "users_delete" on public.users for delete to authenticated
  using (exists (select 1 from current_app_user() u where u.role = 'admin')
         and not exists (select 1 from public.sessions s where s.specialist_id = users.id)
         and not exists (select 1 from public.objectives o where o.specialist_id = users.id));

create policy "roles_insert" on public.roles for insert to authenticated
  with check (exists (select 1 from current_app_user() u where u.role = 'admin'));
create policy "roles_update" on public.roles for update to authenticated
  using (es_sistema = false and exists (select 1 from current_app_user() u where u.role = 'admin'))
  with check (es_sistema = false and exists (select 1 from current_app_user() u where u.role = 'admin'));
create policy "roles_delete" on public.roles for delete to authenticated
  using (es_sistema = false
         and exists (select 1 from current_app_user() u where u.role = 'admin')
         and not exists (select 1 from public.users x where x.role_id = roles.id));
create policy "role_permissions_write" on public.role_permissions for all to authenticated
  using (exists (select 1 from current_app_user() u join public.roles r on r.id = role_permissions.role_id
                 where u.role = 'admin' and r.es_sistema = false))
  with check (exists (select 1 from current_app_user() u join public.roles r on r.id = role_permissions.role_id
                      where u.role = 'admin' and r.es_sistema = false));

commit;
