-- 2026-09-04 — Cierre de la fase 3: las politicas de administracion tambien
-- pasan a permisos.
--
-- Se quedaron fuera del corte anterior y seguian comprobando el NOMBRE del rol
-- (`u.role = 'admin'`). Eso anula el objetivo de la fase: un rol creado desde
-- la aplicacion con user:manage no podia gestionar usuarios, porque la base no
-- miraba su permiso sino como se llamaba.
--
-- Rollback: 2026-09-04-roles-fase3b-admin.rollback.sql

begin;

drop policy if exists "users_insert" on public.users;
drop policy if exists "users_update" on public.users;
drop policy if exists "users_delete" on public.users;

create policy "users_insert" on public.users
  for insert to authenticated
  with check ((select public.has_perm('user:manage')));

-- Dos caminos: quien gestiona usuarios edita a cualquiera, y cualquier persona
-- edita su propia fila. El rol propio lo sigue bloqueando el trigger, que es lo
-- unico capaz de ver QUE columna cambio.
create policy "users_update" on public.users
  for update to authenticated
  using ((select public.has_perm('user:manage')) or id = (select public.app_user_id()))
  with check ((select public.has_perm('user:manage')) or id = (select public.app_user_id()));

create policy "users_delete" on public.users
  for delete to authenticated
  using (
    (select public.has_perm('user:manage'))
    and not exists (select 1 from public.sessions s where s.specialist_id = users.id)
    and not exists (select 1 from public.objectives o where o.specialist_id = users.id)
  );

drop policy if exists "roles_insert" on public.roles;
drop policy if exists "roles_update" on public.roles;
drop policy if exists "roles_delete" on public.roles;
drop policy if exists "role_permissions_write" on public.role_permissions;

create policy "roles_insert" on public.roles
  for insert to authenticated
  with check ((select public.has_perm('role:manage')));

create policy "roles_update" on public.roles
  for update to authenticated
  using (es_sistema = false and (select public.has_perm('role:manage')))
  with check (es_sistema = false and (select public.has_perm('role:manage')));

create policy "roles_delete" on public.roles
  for delete to authenticated
  using (
    es_sistema = false
    and (select public.has_perm('role:manage'))
    and not exists (select 1 from public.users x where x.role_id = roles.id)
  );

create policy "role_permissions_write" on public.role_permissions
  for all to authenticated
  using (exists (select 1 from public.roles r
                 where r.id = role_permissions.role_id and r.es_sistema = false)
         and (select public.has_perm('role:manage')))
  with check (exists (select 1 from public.roles r
                      where r.id = role_permissions.role_id and r.es_sistema = false)
              and (select public.has_perm('role:manage')));

commit;
