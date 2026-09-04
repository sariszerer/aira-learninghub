-- Rollback de 2026-09-04-roles-fase2-tablas.sql
--
-- Seguro de ejecutar: la fase 2 no toca ninguna politica existente y la columna
-- users.role sigue siendo la que manda mientras el cliente no lea de role_id.

begin;

drop policy if exists "role_permissions_write"  on public.role_permissions;
drop policy if exists "role_permissions_select" on public.role_permissions;
drop policy if exists "roles_delete" on public.roles;
drop policy if exists "roles_update" on public.roles;
drop policy if exists "roles_insert" on public.roles;
drop policy if exists "roles_select" on public.roles;
drop policy if exists "permissions_select" on public.permissions;

alter table public.users drop column if exists role_id;

drop table if exists public.role_permissions;
drop table if exists public.roles;
drop table if exists public.permissions;

commit;
