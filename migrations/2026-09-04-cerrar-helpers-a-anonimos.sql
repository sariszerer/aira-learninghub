-- 2026-09-04 — Cerrar los helpers de permisos a los anonimos.
--
-- Las fases 2 y 3 de roles crearon has_perm, app_user_id, app_scope,
-- app_assigned_child, can_see_child y current_app_user como SECURITY DEFINER,
-- pero nunca les quitaron el EXECUTE que Postgres concede a PUBLIC por defecto.
-- Resultado: quedaron expuestas como /rest/v1/rpc/<nombre> y cualquiera podia
-- invocarlas sin sesion.
--
-- Comprobado antes de tocar nada: sin auth.uid() devuelven false o null y no
-- filtran una sola fila. Era superficie de API, no una fuga. Aun asi no hay
-- razon para que existan hacia fuera.
--
-- Se CONSERVA el EXECUTE de `authenticated`. Las expresiones de una politica
-- RLS se evaluan con los privilegios de quien consulta, asi que revocarselo
-- habria roto las 34 politicas a la vez y dejado la aplicacion sin datos.
-- Verificado con una sesion real antes y despues: 44 pacientes, 438 sesiones,
-- 41 objetivos, 11 usuarios y 4 roles en ambos casos.
--
-- get_consent_by_token y sign_consent quedan como estan: son el flujo publico
-- de firma y tienen que ser llamables sin sesion.
--
-- Rollback: 2026-09-04-cerrar-helpers-a-anonimos.rollback.sql

begin;

revoke all on function public.has_perm(text)          from public, anon;
revoke all on function public.app_user_id()           from public, anon;
revoke all on function public.app_scope()             from public, anon;
revoke all on function public.app_assigned_child()    from public, anon;
revoke all on function public.can_see_child(text)     from public, anon;
revoke all on function public.current_app_user()      from public, anon;

grant execute on function public.has_perm(text)       to authenticated;
grant execute on function public.app_user_id()        to authenticated;
grant execute on function public.app_scope()          to authenticated;
grant execute on function public.app_assigned_child() to authenticated;
grant execute on function public.can_see_child(text)  to authenticated;
grant execute on function public.current_app_user()   to authenticated;

-- Funcion de trigger: Postgres no exige EXECUTE al dispararlo, asi que nadie
-- necesita poder llamarla directamente.
revoke all on function public.block_self_role_change() from public, anon, authenticated;

commit;
