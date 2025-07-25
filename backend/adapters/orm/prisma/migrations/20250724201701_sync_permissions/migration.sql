-- Insert default permissions
INSERT INTO "Permission" (id, "permissionKey", description)
VALUES ('00000000-0000-0000-0000-000000000001', 'root', 'All permissions')
ON CONFLICT ("permissionKey") DO NOTHING;
INSERT INTO "Permission" (id, "permissionKey", description)
VALUES ('00000000-0000-0000-0000-000000000002', 'read-users', 'List users')
ON CONFLICT ("permissionKey") DO NOTHING;
