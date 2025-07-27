/**
 * Represents a department or service within the organization.
 */
import { Permission } from './Permission';
import { Site } from './Site';
import { User } from './User';

export class Department {
  /**
   * Create a new {@link Department} instance.
   *
   * @param id - Unique identifier of the department.
   * @param label - Human readable label of the department.
   * @param parentDepartmentId - Identifier of the parent department, if any.
   * @param managerUserId - Identifier of the user managing the department, if any.
   * @param site - {@link Site} where the department is located.
   * @param permissions - Collection of {@link Permission} associated with the department.
   * @param createdAt - Date when the department was created.
   * @param updatedAt - Date when the department was last updated. Defaults to {@link createdAt}.
   * @param createdBy - User who created the department or `null` if created automatically.
   * @param updatedBy - User who last updated the department or `null` if updated automatically.
   */
  constructor(
    public readonly id: string,
    public label: string,
    public parentDepartmentId: string | null = null,
    public managerUserId: string | null = null,
    public site: Site,
    public permissions: Permission[] = [],
    /** Date when the department was created. */
    public createdAt: Date = new Date(),
    /** Date when the department was last updated. Defaults to {@link createdAt}. */
    public updatedAt: Date = createdAt,
    /** User that created the department or `null` when created automatically. */
    public createdBy: User | null = null,
    /** User that last updated the department or `null` when updated automatically. */
    public updatedBy: User | null = createdBy,
  ) {}
}
