-- Rollback de 2026-09-04-avatares-contraste.sql
-- Valores leidos de produccion antes de aplicar la migracion.
begin;
update public.users set avatar_bg = '#6E8FA6' where id = 'u-celilia';
update public.users set avatar_bg = '#C79A6B' where id = 'u-daniella';
update public.users set avatar_bg = '#7FA88A' where id = 'u-idaira';
update public.users set avatar_bg = '#9AA4C4' where id = 'u-ingrid';
update public.users set avatar_bg = '#7A9E7E' where id = 'u-laura';
update public.users set avatar_bg = '#B58AC7' where id = 'u-mariavirginia';
update public.users set avatar_bg = '#82A166' where id = 'u-milagros';
update public.users set avatar_bg = '#A6779A' where id = 'u-neyma';
commit;
