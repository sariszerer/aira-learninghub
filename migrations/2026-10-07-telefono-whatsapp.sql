-- Para poder escribirle a alguien por WhatsApp hace falta su numero, y no
-- habia columna donde ponerlo: users tiene correo y nada mas.
alter table public.users add column if not exists telefono text;

-- Y hace falta que haya dicho que si.
--
-- No es una formalidad de la API: WhatsApp exige consentimiento previo para
-- escribirle a alguien, y escribirle sin el expone la cuenta del centro a que
-- Meta la bloquee. Ademas es su telefono personal y es su empleadora quien
-- escribe: que conste cuando lo acepto, no solo que lo acepto.
alter table public.users add column if not exists whatsapp_opt_in boolean not null default false;
alter table public.users add column if not exists whatsapp_opt_in_at timestamptz;

comment on column public.users.telefono is
  'Numero para WhatsApp, en formato internacional (+507...).';
comment on column public.users.whatsapp_opt_in is
  'Acepto recibir avisos del centro por WhatsApp. Sin esto no se le escribe.';
