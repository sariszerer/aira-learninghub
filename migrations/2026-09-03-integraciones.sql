-- 2026-09-03 — Conexion de Google Calendar a nivel de clinica, no de navegador.
--
-- Hasta ahora el token vivia en el localStorage de cada persona, asi que cada
-- una tenia que autorizar por su cuenta y la conexion moria con el navegador.
-- Aqui se guarda una sola vez, del lado del servidor, y todo el equipo lee la
-- misma agenda.
--
-- Lo que se guarda es un REFRESH TOKEN de Google: una credencial de larga vida
-- que permite pedir tokens de acceso indefinidamente. Por eso esta tabla es la
-- unica de la base sin una sola politica.
--
-- Rollback: 2026-09-03-integraciones.rollback.sql

begin;

create table if not exists public.integraciones (
  id            text primary key,       -- 'google_calendar'
  refresh_token text,
  calendar_id   text,
  conectado_por text references public.users(id),
  conectado_en  timestamptz,
  actualizado_en timestamptz not null default now()
);

alter table public.integraciones enable row level security;

------------------------------------------------------------------------------
-- SIN POLITICAS, A PROPOSITO.
--
-- Con RLS activo y cero politicas, ningun cliente autenticado puede leer ni
-- escribir esta tabla: ni un admin desde el navegador. Solo la alcanza
-- service_role, que salta RLS, y esa clave vive unicamente dentro de las Edge
-- Functions.
--
-- Es deliberado y no un olvido: si el refresh token fuera legible desde el
-- cliente, cualquiera con la sesion de un admin podria extraerlo y leer la
-- agenda de la clinica indefinidamente, incluso despues de perder su acceso a
-- AIRA. Que el token nunca salga del servidor es el punto de todo el cambio.
------------------------------------------------------------------------------

comment on table public.integraciones is
  'Credenciales de integraciones externas. Sin politicas RLS a proposito: solo accesible con service_role desde Edge Functions.';

commit;
