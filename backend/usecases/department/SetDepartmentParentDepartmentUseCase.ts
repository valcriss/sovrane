import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import type { Department } from '../../domain/entities/Department';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for defining the parent department of a department.
 */
export class SetDepartmentParentDepartmentUseCase {
  constructor(
    private readonly departmentRepository: DepartmentRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the parent department assignment.
   *
   * @param departmentId - Identifier of the department to update.
   * @param parentDepartmentId - Identifier of the parent department.
   * @returns The updated {@link Department} or `null` if not found.
   */
  async execute(departmentId: string, parentDepartmentId: string): Promise<Department | null> {
    this.checker.check(PermissionKeys.MANAGE_DEPARTMENT_HIERARCHY);
    const department = await this.departmentRepository.findById(departmentId);
    if (!department) {
      return null;
    }
    department.parentDepartmentId = parentDepartmentId;
    department.updatedAt = new Date();
    department.updatedBy = this.checker.currentUser;
    return this.departmentRepository.update(department);
  }
}
