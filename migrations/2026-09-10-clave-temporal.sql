-- Marca de "tiene que cambiar la contraseña en cuanto entre".
--
-- El flujo de enlaces de recuperacion ha fallado dos veces por razones
-- distintas: primero porque no existia pantalla donde poner la contraseña, y
-- despues porque el enlace ES una autenticacion y se gasta al abrirlo — cuatro
-- se consumieron en cinco minutos sin que nadie llegara a fijar una clave.
--
-- La via alternativa es la clasica: la administracion genera una contraseña
-- temporal, se la pasa a la persona, y la aplicacion obliga a cambiarla al
-- entrar. No caduca en 24 horas, no se gasta si alguien la abre por error, y se
-- puede dictar por telefono.
--
-- El flag NO es un control de seguridad: quien tiene la contraseña temporal ya
-- puede entrar. Es lo que garantiza que no se quede puesta para siempre.
alter table users add column if not exists debe_cambiar_clave boolean not null default false;

comment on column users.debe_cambiar_clave is
  'La contraseña actual la puso la administracion. Al entrar se obliga a cambiarla.';
