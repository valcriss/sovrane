-- Insert default permissions
INSERT INTO "Permission" (id, "permissionKey", description)
VALUES ('00000000-0000-0000-0000-000000000001', 'root', 'All permissions')
ON CONFLICT ("permissionKey") DO NOTHING;
INSERT INTO "Permission" (id, "permissionKey", description)
VALUES ('00000000-0000-0000-0000-000000000002', 'read-users', 'List users')
ON CONFLICT ("permissionKey") DO NOTHING;
INSERT INTO "Permission" (id, "permissionKey", description)
VALUES ('00000000-0000-0000-0000-000000000003', 'read-user', 'Get user')
ON CONFLICT ("permissionKey") DO NOTHING;
INSERT INTO "Permission" (id, "permissionKey", description)
VALUES ('00000000-0000-0000-0000-000000000004', 'create-user', 'Create user')
ON CONFLICT ("permissionKey") DO NOTHING;
INSERT INTO "Permission" (id, "permissionKey", description)
VALUES ('00000000-0000-0000-0000-000000000005', 'update-user', 'Update user')
ON CONFLICT ("permissionKey") DO NOTHING;
INSERT INTO "Permission" (id, "permissionKey", description)
VALUES ('00000000-0000-0000-0000-000000000006', 'delete-user', 'Delete user')
ON CONFLICT ("permissionKey") DO NOTHING;
INSERT INTO "Permission" (id, "permissionKey", description)
VALUES ('00000000-0000-0000-0000-000000000007', 'create-session', 'Login')
ON CONFLICT ("permissionKey") DO NOTHING;
INSERT INTO "Permission" (id, "permissionKey", description)
VALUES ('00000000-0000-0000-0000-000000000008', 'create-password-reset', 'Request password reset')
ON CONFLICT ("permissionKey") DO NOTHING;
INSERT INTO "Permission" (id, "permissionKey", description)
VALUES ('00000000-0000-0000-0000-000000000009', 'update-password', 'Reset password')
ON CONFLICT ("permissionKey") DO NOTHING;
