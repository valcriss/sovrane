import { PermissionChecker } from '../../../domain/services/PermissionChecker';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Permission } from '../../../domain/entities/Permission';
import { PermissionKeys } from '../../../domain/entities/PermissionKeys';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';

describe('PermissionChecker', () => {
  const site = new Site('s', 'Site');
  const dept = new Department('d', 'Dept', null, null, site);

  it('should allow when user has permission', () => {
    const user = new User('u', 'John', 'Doe', 'j@e.c', [], 'active', dept, site, undefined, [
      new Permission('p', PermissionKeys.READ_USERS, 'read users'),
    ]);
    const checker = new PermissionChecker(user);
    expect(checker.has(PermissionKeys.READ_USERS)).toBe(true);
  });

  it('should allow when role grants permission', () => {
    const role = new Role('r', 'Role', [new Permission('p', PermissionKeys.READ_USERS, '')]);
    const user = new User('u', 'John', 'Doe', 'j@e.c', [role], 'active', dept, site);
    const checker = new PermissionChecker(user);
    expect(checker.has(PermissionKeys.READ_USERS)).toBe(true);
  });

  it('should allow when role has root permission', () => {
    const role = new Role('r', 'Role', [new Permission('p', PermissionKeys.ROOT, '')]);
    const user = new User('u', 'John', 'Doe', 'j@e.c', [role], 'active', dept, site);
    const checker = new PermissionChecker(user);
    expect(checker.has(PermissionKeys.READ_USERS)).toBe(true);
  });

  it('should allow when root permission present', () => {
    const user = new User('u', 'John', 'Doe', 'j@e.c', [], 'active', dept, site, undefined, [
      new Permission('p', PermissionKeys.ROOT, 'root'),
    ]);
    const checker = new PermissionChecker(user);
    expect(checker.has('anything')).toBe(true);
  });

  it('should deny when permission missing', () => {
    const user = new User('u', 'John', 'Doe', 'j@e.c', [], 'active', dept, site);
    const checker = new PermissionChecker(user);
    expect(checker.has(PermissionKeys.READ_USERS)).toBe(false);
  });

  it('check should throw when permission missing', () => {
    const user = new User('u', 'John', 'Doe', 'j@e.c', [], 'active', dept, site);
    const checker = new PermissionChecker(user);
    expect(() => checker.check(PermissionKeys.READ_USERS)).toThrow('Forbidden');
  });

  it('should deny when role lacks permission', () => {
    const role = new Role('r', 'Role');
    const user = new User('u', 'John', 'Doe', 'j@e.c', [role], 'active', dept, site);
    const checker = new PermissionChecker(user);
    expect(checker.has(PermissionKeys.READ_USERS)).toBe(false);
  });

  it('exposes the current user', () => {
    const user = new User('u', 'John', 'Doe', 'j@e.c', [], 'active', dept, site);
    const checker = new PermissionChecker(user);
    expect(checker.currentUser).toBe(user);
  });
});
