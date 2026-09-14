-- Última conexión de cada persona del equipo.
--
-- El dato vive en auth.users.last_sign_in_at, y auth es un esquema al que el
-- cliente no llega — ni debe: ahí están los hashes de contraseña y los tokens.
-- Se expone SOLO esa columna, y solo a quien gestiona usuarios.
--
-- Sirve para lo que la administración necesita saber de verdad: quién ha
-- llegado a entrar y quién sigue sin hacerlo. De las once cuentas, ocho no
-- habían entrado nunca y desde la aplicación no había forma de verlo.
create or replace function public.ultimos_accesos()
returns table (user_id text, ultimo_acceso timestamptz)
language sql
stable
security definer
set search_path to 'public'
as $$
  select u.id, au.last_sign_in_at
  from public.users u
  join auth.users au on au.id = u.auth_id
  where (select has_perm('user:manage'))
$$;

revoke execute on function public.ultimos_accesos() from anon;
grant execute on function public.ultimos_accesos() to authenticated;
