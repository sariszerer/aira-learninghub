-- 2026-09-04 — Avatares: texto blanco legible sobre todos los colores.
--
-- Ocho de los diez avatares de especialista tenian el texto por debajo del
-- minimo legible: el blanco sobre #9AA4C4 daba 2.48 y sobre #C79A6B 2.54,
-- cuando WCAG AA pide 4.5. En una tabla de 44 pacientes la columna de
-- especialista era, en la practica, circulos de color sin iniciales.
--
-- Cada color se oscurece bajando SOLO la luminosidad en HLS hasta cruzar 4.6:
-- el tono y la saturacion no se tocan, asi que cada persona conserva su color
-- (Idaira sigue siendo la verde, Daniella la terracota) y el equipo los sigue
-- distinguiendo de un vistazo.
--
-- Va junto con el cambio en src/theme.js (SPECIALIST_COLORS): esa tabla y esta
-- columna tienen que coincidir o la misma persona sale de dos colores segun la
-- vista.
--
-- Rollback: 2026-09-04-avatares-contraste.rollback.sql

begin;

update public.users set avatar_bg = '#597990' where id = 'u-celilia';        -- 3.42 -> 4.60
update public.users set avatar_bg = '#9A6B3A' where id = 'u-daniella';       -- 2.54 -> 4.63
update public.users set avatar_bg = '#567E61' where id = 'u-idaira';         -- 2.67 -> 4.61
update public.users set avatar_bg = '#6473A5' where id = 'u-ingrid';         -- 2.48 -> 4.63
update public.users set avatar_bg = '#5C7D5F' where id = 'u-laura';          -- 2.99 -> 4.61
update public.users set avatar_bg = '#995DB2' where id = 'u-mariavirginia';  -- 2.83 -> 4.60
update public.users set avatar_bg = '#637C4C' where id = 'u-milagros';       -- 2.90 -> 4.65
update public.users set avatar_bg = '#99648C' where id = 'u-neyma';          -- 3.67 -> 4.61

-- u-claudia (#C0392B, 5.44) y u-admin (#175FAF, 6.38) ya cumplian.

commit;
