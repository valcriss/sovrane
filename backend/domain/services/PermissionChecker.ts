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
   * @param scopeId - Optional scope identifier to filter assignments.
   * @returns `true` if the user has the permission.
   */
  has(key: string, scopeId?: string): boolean {
    const denied = new Set(
      this.user.permissions
        .filter(p => p.denyPermission)
        .map(p => p.permission.permissionKey),
    );

    const assignments = [
      ...this.user.roles.flatMap(r => r.permissions),
      ...this.user.permissions.filter(p => !p.denyPermission),
    ];

    for (const a of assignments) {
      if (denied.has(a.permission.permissionKey)) {
        continue;
      }
      const permKey = a.permission.permissionKey;
      if (permKey !== key && permKey !== PermissionKeys.ROOT) {
        continue;
      }
      
      // Check scope compatibility
      if (scopeId !== undefined) {
        // When requesting a specific scope, assignment must match that scope or be global (null/undefined)
        if (a.scopeId !== undefined && a.scopeId !== scopeId) {
          continue;
        }
      } else {
        // When requesting global access, assignment must be global (null/undefined)
        if (a.scopeId !== undefined) {
          continue;
        }
      }
      
      return true;
    }
    return false;
  }

  /**
   * Assert that the user has the required permission. Throws an error otherwise.
   *
   * @param key - Permission key to verify.
   * @param scopeId - Optional scope identifier to filter assignments.
   */
  check(key: string, scopeId?: string): void {
    if (!this.has(key, scopeId)) {
      throw new Error('Forbidden');
    }
  }
}
