import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import type { Department } from '../../domain/entities/Department';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for adding a department as a child of another department.
 */
export class AddChildDepartmentUseCase {
  constructor(
    private readonly departmentRepository: DepartmentRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the child department addition.
   *
   * @param parentId - Identifier of the parent department.
   * @param childId - Identifier of the department to become a child.
   * @returns The updated child {@link Department} or `null` if not found.
   */
  async execute(parentId: string, childId: string): Promise<Department | null> {
    this.checker.check(PermissionKeys.MANAGE_DEPARTMENT_HIERARCHY);
    const child = await this.departmentRepository.findById(childId);
    if (!child) {
      return null;
    }
    child.parentDepartmentId = parentId;
    child.updatedAt = new Date();
    child.updatedBy = this.checker.currentUser;
    return this.departmentRepository.update(child);
  }
}
