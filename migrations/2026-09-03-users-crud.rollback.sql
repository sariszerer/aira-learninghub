-- Rollback de 2026-09-03-users-crud.sql
-- Deja public.users como estaba: solo lectura para autenticados.

begin;

drop policy if exists "users_insert" on public.users;
drop policy if exists "users_update" on public.users;
drop policy if exists "users_delete" on public.users;

drop trigger if exists trg_block_self_role_change on public.users;
drop function if exists public.block_self_role_change();

-- La columna se conserva: eliminarla perderia que perfiles estaban desactivados.
-- Para quitarla del todo: alter table public.users drop column activo;

commit;
