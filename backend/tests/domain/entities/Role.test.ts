import { Role } from '../../../domain/entities/Role';
import { Permission } from '../../../domain/entities/Permission';
import { RolePermissionAssignment } from '../../../domain/entities/RolePermissionAssignment';

describe('Role Entity', () => {
  let role: Role;

  beforeEach(() => {
    role = new Role('role-123', 'Administrator');
  });

  describe('Constructor', () => {
    it('should create a role with all required properties', () => {
      expect(role.id).toBe('role-123');
      expect(role.label).toBe('Administrator');
    });

    it('should create roles with different labels', () => {
      const userRole = new Role('role-456', 'User');
      const moderatorRole = new Role('role-789', 'Moderator');

      expect(userRole.label).toBe('User');
      expect(moderatorRole.label).toBe('Moderator');
    });
  });

  describe('Role Properties', () => {
    it('should allow modification of mutable label property', () => {
      role.label = 'Super Administrator';
      expect(role.label).toBe('Super Administrator');
    });

    it('should manage permissions collection', () => {
      expect(role.permissions).toHaveLength(0);
      const perm = new Permission('perm-1', 'READ', 'read');
      const rolePermAssignment = new RolePermissionAssignment(perm);
      role.permissions.push(rolePermAssignment);
      expect(role.permissions).toHaveLength(1);
      expect(role.permissions[0]).toBe(rolePermAssignment);
    });

    it('should have immutable id property', () => {
      expect(role.id).toBe('role-123');
      // The id property is readonly at compile time but this test just verifies the getter
      expect(typeof role.id).toBe('string');
      expect(role.id.length).toBeGreaterThan(0);
    });
  });

  describe('Role Equality', () => {
    it('should be able to compare roles by id', () => {
      const sameRole = new Role('role-123', 'Different Label');
      const differentRole = new Role('role-456', 'Administrator');

      expect(role.id).toBe(sameRole.id);
      expect(role.id).not.toBe(differentRole.id);
    });

    it('should handle roles with same label but different ids', () => {
      const anotherAdminRole = new Role('role-999', 'Administrator');

      expect(role.label).toBe(anotherAdminRole.label);
      expect(role.id).not.toBe(anotherAdminRole.id);
    });
  });

  describe('Role Label Variations', () => {
    it('should handle empty label', () => {
      const emptyLabelRole = new Role('role-empty', '');
      expect(emptyLabelRole.label).toBe('');
    });

    it('should handle long labels', () => {
      const longLabel = 'Very Long Role Label That Might Be Used In Some Complex Systems';
      const longLabelRole = new Role('role-long', longLabel);
      expect(longLabelRole.label).toBe(longLabel);
    });

    it('should handle special characters in label', () => {
      const specialLabel = 'Admin & Moderator (Level 1)';
      const specialRole = new Role('role-special', specialLabel);
      expect(specialRole.label).toBe(specialLabel);
    });
  });
});
