-- 2026-09-04 — Retirar users.password_temp.
--
-- La columna guardaba las contraseñas del personal EN TEXTO PLANO (nueve de
-- once filas), y la politica de lectura de users es:
--
--   users_select_authenticated  USING (auth.uid() IS NOT NULL)
--
-- es decir, cualquier usuario autenticado leia la tabla entera. Eso incluye al
-- rol Tutor AIRA, cuyo alcance es un unico niño. La escalada era directa:
-- entrar como tutor, leer password_temp de u-admin, entrar como administradora.
-- Todo el control de acceso construido sobre roles y RLS se saltaba por ahi.
--
-- RLS es a nivel de FILA, asi que no podia esconder solo esa columna sin
-- romper el resto de la tabla, que la aplicacion si necesita. Y no hacia falta:
-- ninguna parte del codigo — ni el cliente, ni las funciones edge, ni los
-- scripts — lee password_temp. Es dato muerto que sostenia un agujero vivo.
--
-- Las contraseñas seguian ademas un patron correlativo (AiraLH1001, 1002,
-- 1003...), asi que conocer una revelaba las demas. Se retiran de la base, pero
-- eso NO las invalida: hay que rotarlas aparte, porque han sido legibles.
--
-- No hay rollback con datos: recuperar la columna es trivial, recuperar su
-- contenido no debe hacerse. Guardar contraseñas en claro no tiene marcha atras
-- deseable.
-- Rollback (solo estructura): 2026-09-04-retirar-password-temp.rollback.sql

begin;

alter table public.users drop column if exists password_temp;

commit;
