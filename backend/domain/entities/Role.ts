/**
 * Describes a role that can be assigned to a user.
 */
import { RolePermissionAssignment } from './RolePermissionAssignment';
import { User } from './User';

export class Role {
  /**
   * Construct a new {@link Role} instance.
   *
   * @param id - Unique identifier of the role.
   * @param label - Human readable label for the role.
   * @param permissions - Collection of permission assignments associated with the role.
   */
  constructor(
    public readonly id: string,
    public label: string,
    public permissions: RolePermissionAssignment[] = [],
    /** Date when the role was created. */
    public createdAt: Date = new Date(),
    /** Date when the role was last updated. Defaults to {@link createdAt}. */
    public updatedAt: Date = createdAt,
    /** User that created the role or `null` when created automatically. */
    public createdBy: User | null = null,
    /** User that last updated the role or `null` when updated automatically. */
    public updatedBy: User | null = createdBy,
  ) {}
}

