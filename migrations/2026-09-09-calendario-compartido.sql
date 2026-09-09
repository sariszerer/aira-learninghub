-- Permiso de lectura de la agenda del centro.
--
-- Hasta ahora el calendario se leia desde el navegador con la cuenta de Google
-- de cada persona, asi que "quien puede verlo" lo decidia Google y no AIRA. Al
-- pasar la lectura al servidor con una cuenta de servicio hace falta decirlo
-- aqui: la funcion edge no puede preguntarle a Google quien es el que llama.
--
-- Se concede a los tres roles cuya pantalla de inicio muestra la agenda. La
-- tutora queda fuera a proposito: su alcance es un solo nino y la agenda del
-- centro lleva los titulos de las citas de TODOS los pacientes.
insert into permissions (key, grupo, descripcion)
values ('calendar:view', 'Interdisciplinario', 'Ver la agenda del centro')
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_key)
select r.id, 'calendar:view' from roles r
where r.id in ('admin', 'clinical_director', 'specialist')
on conflict do nothing;
