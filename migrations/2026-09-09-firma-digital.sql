-- Firma digital del especialista.
--
-- Se guarda en su propia fila de users y no por reporte: es la misma rubrica en
-- los tres documentos, y pedirla en cada descarga convertiria un tramite de una
-- vez en uno de cada vez.
--
-- Que cada quien pueda escribirla ya lo permite users_update (id = app_user_id),
-- y ahora sin el agujero que traia: el trigger de 2026-09-09-blindar-privilegios
-- deja pasar el perfil y bloquea rol, acceso y asignacion.
alter table users add column if not exists firma text;

comment on column users.firma is
  'Imagen de la firma del especialista como data URL. Sale en el bloque de firma de los tres reportes.';
