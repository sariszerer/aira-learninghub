-- Rollback de 2026-09-04-retirar-password-temp.sql
--
-- Devuelve solo la ESTRUCTURA. El contenido no se restaura a proposito: eran
-- contraseñas en texto plano y volver a escribirlas reabriria el agujero. Si
-- algo dependiera de esta columna, la solucion correcta es que deje de
-- depender, no repoblarla.
begin;
alter table public.users add column if not exists password_temp text;
commit;
