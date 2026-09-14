alter table meetings alter column type drop default;
alter table meetings
  alter column type type text
  using case when array_length(type, 1) > 0 then type[1] else null end;
