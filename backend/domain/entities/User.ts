import { Role } from './Role';
import { Department } from './Department';
import { Permission } from './Permission';
import { Site } from './Site';

/**
 * Represents a user within the system.
 */
export class User {
  /**
   * Create a new {@link User}.
   *
   * @param id - Unique identifier of the user.
   * @param firstName - User's given name.
   * @param lastName - User's family name.
   * @param email - Email address used to contact the user.
   * @param roles - Collection of {@link Role} instances assigned to the user.
   * @param status - Current account status.
   * @param department - {@link Department} the user belongs to.
   * @param site - {@link Site} where the user is located.
   * @param picture - Optional profile picture URL.
   * @param permissions - Collection of {@link Permission} granted directly to the user.
   * @param createdAt - Date when the user was created.
   * @param updatedAt - Date when the user was last updated. Defaults to {@link createdAt}.
   * @param createdBy - User who created this record or `null` when created automatically.
   * @param updatedBy - User who last updated this record or `null` when updated automatically.
   */
  constructor(
    public readonly id: string,
    public firstName: string,
    public lastName: string,
    public email: string,
    public roles: Role[] = [],
    public status: 'active' | 'suspended' | 'archived' = 'active',
    public department: Department,
    public site: Site,
    public picture?: string,
    public permissions: Permission[] = [],
    /** Date when the user record was created. */
    public createdAt: Date = new Date(),
    /** Date when the user record was last updated. Defaults to {@link createdAt}. */
    public updatedAt: Date = createdAt,
    /** User that created this record or `null` when created automatically. */
    public createdBy: User | null = null,
    /** User that last updated this record or `null` when updated automatically. */
    public updatedBy: User | null = createdBy,
  ) {}
}

