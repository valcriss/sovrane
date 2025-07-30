/**
 * Represents a permission granted to a role.
 */
import { Permission } from './Permission';

export class RolePermissionAssignment {
  /**
   * Create a new role permission assignment.
   *
   * @param permission - Permission associated with the role.
   * @param scopeId - Optional scope identifier for the permission.
   */
  constructor(
    public permission: Permission,
    public scopeId?: string,
  ) {}
}
