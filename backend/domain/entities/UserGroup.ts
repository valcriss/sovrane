import { User } from './User';

/**
 * Represents a group of users.
 */
export class UserGroup {
  /**
   * Create a new {@link UserGroup}.
   *
   * @param id - Unique identifier for the group.
   * @param name - Group name.
   * @param responsibleUsers - Users responsible for managing the group.
   * @param members - Users belonging to the group.
   * @param description - Optional description of the group.
   * @param createdAt - Date of creation.
   * @param updatedAt - Date of last modification. Defaults to {@link createdAt}.
   * @param createdBy - User who created this record or `null` if created automatically.
   * @param updatedBy - User who last updated this record or `null` if updated automatically.
   */
  constructor(
    public readonly id: string,
    public name: string,
    public responsibleUsers: User[] = [],
    public members: User[] = [],
    public description?: string,
    /** Date when the group was created. */
    public createdAt: Date = new Date(),
    /** Date when the group was last updated. Defaults to {@link createdAt}. */
    public updatedAt: Date = createdAt,
    /** User that created the group or `null` when created automatically. */
    public createdBy: User | null = null,
    /** User that last updated the group or `null` when updated automatically. */
    public updatedBy: User | null = createdBy,
  ) {}
}
