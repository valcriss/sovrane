/**
 * Represents a permission directly assigned to a user.
 */
import { Permission } from './Permission';

export class UserPermissionAssignment {
  /**
   * Create a new user permission assignment.
   *
   * @param permission - Permission granted or denied.
   * @param scopeId - Optional scope identifier for the permission.
   * @param denyPermission - Whether this assignment denies the permission.
   */
  constructor(
    public permission: Permission,
    public scopeId?: string,
    public denyPermission = false,
  ) {}
}
