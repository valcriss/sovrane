import { Permission } from '../domain/entities/Permission';
import { RolePermissionAssignment } from '../domain/entities/RolePermissionAssignment';
import { UserPermissionAssignment } from '../domain/entities/UserPermissionAssignment';

// Global test setup
beforeAll(() => {
  // Setup code that runs before all tests
});

afterAll(() => {
  // Cleanup code that runs after all tests
});

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Test helpers
export const createRolePermissionAssignment = (id: string, permissionKey: string, description = '', scopeId?: string): RolePermissionAssignment => {
  const permission = new Permission(id, permissionKey, description);
  return new RolePermissionAssignment(permission, scopeId);
};

export const createUserPermissionAssignment = (id: string, permissionKey: string, description = '', scopeId?: string, denyPermission = false): UserPermissionAssignment => {
  const permission = new Permission(id, permissionKey, description);
  return new UserPermissionAssignment(permission, scopeId, denyPermission);
};
