-- Rollback de 2026-09-04-cerrar-helpers-a-anonimos.sql
-- Devuelve el EXECUTE por defecto de PUBLIC. Solo tiene sentido si algo
-- externo dependiera de invocar estos helpers sin sesion, cosa que hoy no pasa.
begin;
grant execute on function public.has_perm(text)             to public;
grant execute on function public.app_user_id()              to public;
grant execute on function public.app_scope()                to public;
grant execute on function public.app_assigned_child()       to public;
grant execute on function public.can_see_child(text)        to public;
grant execute on function public.current_app_user()         to public;
grant execute on function public.block_self_role_change()   to public;
commit;
