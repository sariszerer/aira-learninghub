drop policy if exists children_delete on children;
delete from role_permissions where permission_key = 'patient:delete';
delete from permissions where key = 'patient:delete';
