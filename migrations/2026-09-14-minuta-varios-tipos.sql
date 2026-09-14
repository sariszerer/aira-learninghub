-- Una minuta puede ser de varias cosas a la vez.
--
-- Una reunión con la escuela Y la familia sobre el mismo niño es lo normal, no
-- la excepción, y obligar a elegir uno hace que el otro se pierda: el que se
-- descartó no aparece en ningún filtro ni en ningún recuento.
--
-- Se pasa a arreglo. Hoy no hay ninguna minuta guardada, así que la conversión
-- no arrastra datos — pero se escribe como si los hubiera, por si esta
-- migración se aplica sobre otra copia.
alter table meetings
  alter column type type text[]
  using case
    when type is null or btrim(type) = '' then array[]::text[]
    else array[type]
  end;

alter table meetings alter column type set default array[]::text[];
