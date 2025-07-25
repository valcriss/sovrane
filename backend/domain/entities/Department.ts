/**
 * Represents a department or service within the organization.
 */
import { Permission } from './Permission';
import { Site } from './Site';

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
   */
  constructor(
    public readonly id: string,
    public label: string,
    public parentDepartmentId: string | null = null,
    public managerUserId: string | null = null,
    public site: Site,
    public permissions: Permission[] = [],
  ) {}
}
