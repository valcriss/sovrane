import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Permission } from '../../../domain/entities/Permission';
import { Site } from '../../../domain/entities/Site';

describe('User Entity', () => {
  let user: User;
  let adminRole: Role;
  let userRole: Role;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    adminRole = new Role('admin-id', 'Admin');
    userRole = new Role('user-id', 'User');
    site = new Site('site-1', 'HQ');
    department = new Department('dept-1', 'IT', null, null, site);
    user = new User(
      'user-123',
      'John',
      'Doe',
      'john.doe@example.com',
      [userRole],
      'active',
      department,
      site,
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
        undefined as any,
        'active',
        department,
        site
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
        undefined as any,
        department,
        site
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

    it('should handle picture and permissions properties', () => {
      const perm = new Permission('perm-1', 'READ', 'read');
      user.picture = 'avatar.png';
      user.permissions.push(perm);

      expect(user.picture).toBe('avatar.png');
      expect(user.permissions).toHaveLength(1);
      expect(user.permissions[0]).toBe(perm);
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
        department,
        site
      );

      expect(multiRoleUser.roles).toHaveLength(2);
      expect(multiRoleUser.roles).toContain(adminRole);
      expect(multiRoleUser.roles).toContain(userRole);
    });
  });

  describe('Timestamps and Audit Fields', () => {
    it('should set default createdAt and updatedAt values', () => {
      const newUser = new User('u1', 'A', 'B', 'a@b.c', [], 'active', department, site);

      expect(newUser.createdAt).toBeInstanceOf(Date);
      expect(newUser.updatedAt).toEqual(newUser.createdAt);
      expect(newUser.createdBy).toBeNull();
      expect(newUser.updatedBy).toBeNull();
    });

    it('should accept custom audit information', () => {
      const creator = new User('c1', 'C', 'D', 'c@d.e', [], 'active', department, site);
      const updater = new User('u2', 'U', 'D', 'u@d.e', [], 'active', department, site);
      const date = new Date('2020-01-01T00:00:00Z');
      const auditedUser = new User('u3', 'F', 'L', 'f@l.c', [], 'active', department, site, undefined, [], undefined, undefined, date, date, creator, updater);

      expect(auditedUser.createdAt).toBe(date);
      expect(auditedUser.updatedAt).toBe(date);
      expect(auditedUser.createdBy).toBe(creator);
      expect(auditedUser.updatedBy).toBe(updater);
    });
  });
});
