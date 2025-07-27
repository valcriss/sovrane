/**
 * Describes a role that can be assigned to a user.
 */
import { Permission } from './Permission';
import { User } from './User';

export class Role {
  /**
   * Construct a new {@link Role} instance.
   *
   * @param id - Unique identifier of the role.
   * @param label - Human readable label for the role.
   * @param permissions - Collection of {@link Permission} associated with the role.
   */
  constructor(
    public readonly id: string,
    public label: string,
    public permissions: Permission[] = [],
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

