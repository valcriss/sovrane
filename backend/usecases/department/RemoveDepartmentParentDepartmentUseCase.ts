import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import type { Department } from '../../domain/entities/Department';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for removing the parent department of a department.
 */
export class RemoveDepartmentParentDepartmentUseCase {
  constructor(
    private readonly departmentRepository: DepartmentRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the removal of the parent department.
   *
   * @param departmentId - Identifier of the department to update.
   * @returns The updated {@link Department} or `null` if not found.
   */
  async execute(departmentId: string): Promise<Department | null> {
    this.checker.check(PermissionKeys.MANAGE_DEPARTMENT_HIERARCHY);
    const department = await this.departmentRepository.findById(departmentId);
    if (!department) {
      return null;
    }
    department.parentDepartmentId = null;
    department.updatedAt = new Date();
    department.updatedBy = this.checker.currentUser;
    return this.departmentRepository.update(department);
  }
}
