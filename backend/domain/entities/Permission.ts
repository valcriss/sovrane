import { User } from './User';

/**
 * Represents a permission available in the system.
 */
export class Permission {
  /**
   * Create a new {@link Permission} instance.
   *
   * @param id - Unique identifier for the permission.
   * @param permissionKey - Key representing the permission.
   * @param description - Human readable description of the permission.
   */
  constructor(
    public readonly id: string,
    public permissionKey: string,
    public description: string,
    /** Date when the permission was created. */
    public createdAt: Date = new Date(),
    /** Date when the permission was last updated. Defaults to {@link createdAt}. */
    public updatedAt: Date = createdAt,
    /** User that created the permission or `null` when created automatically. */
    public createdBy: User | null = null,
    /** User that last updated the permission or `null` when updated automatically. */
    public updatedBy: User | null = createdBy,
  ) {}
}
