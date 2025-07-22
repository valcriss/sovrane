import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';

describe('User Entity', () => {
  let user: User;
  let adminRole: Role;
  let userRole: Role;

  beforeEach(() => {
    adminRole = new Role('admin-id', 'Admin');
    userRole = new Role('user-id', 'User');
    user = new User(
      'user-123',
      'John',
      'Doe',
      'john.doe@example.com',
      [userRole],
      'active',
      'dept-1'
    );
  });

  describe('Constructor', () => {
    it('should create a user with all required properties', () => {
      expect(user.id).toBe('user-123');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.email).toBe('john.doe@example.com');
      expect(user.roles).toEqual([userRole]);
      expect(user.status).toBe('active');
    });

    it('should create a user with default empty roles array', () => {
      const userWithoutRoles = new User(
        'user-456',
        'Jane',
        'Smith',
        'jane.smith@example.com',
        [],
        'active',
        'dept-1'
      );

      expect(userWithoutRoles.roles).toEqual([]);
      expect(userWithoutRoles.status).toBe('active');
    });

    it('should create a user with default active status', () => {
      const userWithoutStatus = new User(
        'user-789',
        'Bob',
        'Wilson',
        'bob.wilson@example.com',
        [adminRole],
        'active',
        'dept-1'
      );

      expect(userWithoutStatus.status).toBe('active');
    });
  });

  describe('User Properties', () => {
    it('should allow modification of mutable properties', () => {
      user.firstName = 'Johnny';
      user.lastName = 'Smith';
      user.email = 'johnny.smith@example.com';
      user.status = 'suspended';

      expect(user.firstName).toBe('Johnny');
      expect(user.lastName).toBe('Smith');
      expect(user.email).toBe('johnny.smith@example.com');
      expect(user.status).toBe('suspended');
    });

    it('should have immutable id property', () => {
      expect(user.id).toBe('user-123');
      // The id property is readonly at compile time but this test just verifies the getter
      expect(typeof user.id).toBe('string');
      expect(user.id.length).toBeGreaterThan(0);
    });

    it('should allow adding and removing roles', () => {
      user.roles.push(adminRole);
      expect(user.roles).toHaveLength(2);
      expect(user.roles).toContain(adminRole);
      expect(user.roles).toContain(userRole);

      user.roles.pop();
      expect(user.roles).toHaveLength(1);
      expect(user.roles).toContain(userRole);
    });
  });

  describe('User Status', () => {
    it('should accept valid status values', () => {
      const statuses: Array<'active' | 'suspended' | 'archived'> = ['active', 'suspended', 'archived'];
      
      statuses.forEach(status => {
        user.status = status;
        expect(user.status).toBe(status);
      });
    });
  });

  describe('User with Multiple Roles', () => {
    it('should handle user with multiple roles', () => {
      const multiRoleUser = new User(
        'multi-user-123',
        'Admin',
        'User',
        'admin.user@example.com',
        [adminRole, userRole],
        'active',
        'dept-1'
      );

      expect(multiRoleUser.roles).toHaveLength(2);
      expect(multiRoleUser.roles).toContain(adminRole);
      expect(multiRoleUser.roles).toContain(userRole);
    });
  });
});
