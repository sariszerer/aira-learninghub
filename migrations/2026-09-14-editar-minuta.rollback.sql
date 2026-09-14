drop policy if exists meetings_update on meetings;
delete from role_permissions where permission_key in ('meeting:edit:own','meeting:edit:any');
delete from permissions where key in ('meeting:edit:own','meeting:edit:any');
