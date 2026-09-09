drop policy if exists documents_write_supervision on documents;
drop policy if exists documents_write_estudiante on documents;
create policy documents_write_estudiante on documents
  for all to authenticated
  using (student_id is not null and (select has_perm('gabinete:session:create')))
  with check (student_id is not null and (select has_perm('gabinete:session:create')));
delete from role_permissions where permission_key = 'gabinete:supervision:write';
delete from permissions where key = 'gabinete:supervision:write';
