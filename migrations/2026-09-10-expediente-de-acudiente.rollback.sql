drop index if exists children_tipo_idx;
alter table children drop column if exists acudiente_de;
alter table children drop column if exists tipo;
