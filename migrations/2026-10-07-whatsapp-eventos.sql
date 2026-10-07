-- Lo que llega de WhatsApp: respuestas de las terapeutas y acuses de entrega.
--
-- Se guarda el aviso crudo ademas de los campos leidos. El formato de Meta
-- cambia y trae cosas que hoy no se usan; descartar lo que no se entiende hace
-- que el dia que haga falta no este.
create table if not exists whatsapp_eventos (
  id          bigserial primary key,
  tipo        text not null,            -- 'mensaje' | 'estado'
  wa_id       text,                     -- el numero, como lo da Meta
  mensaje_id  text,
  texto       text,
  crudo       jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists whatsapp_eventos_wa_id_idx on whatsapp_eventos (wa_id, created_at desc);

-- Un numero de telefono de una empleada y lo que escribe es dato personal.
-- RLS activo y SIN politicas: nadie lo lee desde el cliente. Solo la funcion,
-- que entra con service_role.
alter table whatsapp_eventos enable row level security;

comment on table whatsapp_eventos is
  'Avisos entrantes de WhatsApp. Escribe la Edge Function whatsapp; no se lee desde el cliente.';
