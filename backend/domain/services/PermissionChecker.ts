import { User } from '../entities/User';
import { PermissionKeys } from '../entities/PermissionKeys';

/**
 * Service used to verify that a user holds a specific permission.
 */
export class PermissionChecker {
  /**
   * Create a new checker for the provided user.
   *
   * @param user - Currently authenticated user.
   */
  constructor(private readonly user: User) {}

  /**
   * Retrieve the user associated with this checker.
   *
   * @returns The current authenticated {@link User}.
   */
  get currentUser(): User {
    return this.user;
  }

  /**
   * Determine whether the user has the requested permission key or the root permission.
   *
   * @param key - Permission key to verify.
   * @returns `true` if the user has the permission.
   */
  has(key: string): boolean {
    if (this.user.permissions.some(p => !p.denyPermission && p.permission.permissionKey === PermissionKeys.ROOT)) {
      return true;
    }
    if (this.user.permissions.some(p => !p.denyPermission && p.permission.permissionKey === key)) {
      return true;
    }
    for (const role of this.user.roles) {
      if (role.permissions.some(p => p.permission.permissionKey === PermissionKeys.ROOT)) {
        return true;
      }
      if (role.permissions.some(p => p.permission.permissionKey === key)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Assert that the user has the required permission. Throws an error otherwise.
   *
   * @param key - Permission key to verify.
   */
  check(key: string): void {
    if (!this.has(key)) {
      throw new Error('Forbidden');
    }
  }
}
