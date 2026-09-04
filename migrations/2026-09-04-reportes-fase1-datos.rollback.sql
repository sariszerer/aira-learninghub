-- Rollback de 2026-09-04-reportes-fase1-datos.sql
--
-- Devuelve el esquema al estado previo. Los N° de expediente generados se
-- pierden con la columna; si se vuelve a aplicar la migracion se regeneran con
-- el mismo criterio de orden, pero no necesariamente con el mismo numero para
-- cada paciente si entretanto se creo o borro alguno.
begin;

drop table if exists public.evolution_reports;

delete from public.role_permissions
 where permission_key in ('report:evolution:generate', 'report:history:generate');
delete from public.permissions
 where key in ('report:evolution:generate', 'report:history:generate');

alter table public.objectives drop constraint if exists objectives_gas_check;
alter table public.objectives drop column if exists gas_baseline;
alter table public.objectives drop column if exists gas_target;
alter table public.objectives drop column if exists gas_current;
alter table public.objectives drop column if exists methodology;

alter table public.sessions drop constraint if exists sessions_attendance_check;
alter table public.sessions drop column if exists attendance;

alter table public.users drop column if exists license_no;

alter table public.children drop constraint if exists children_status_check;
drop index if exists public.children_record_no_key;
alter table public.children drop column if exists record_no;
alter table public.children drop column if exists school;
alter table public.children drop column if exists referral_reason;
alter table public.children drop column if exists discharge_date;
alter table public.children drop column if exists discharge_reason;

commit;
