import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import type { Department } from '../../domain/entities/Department';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for removing the manager from a department.
 */
export class RemoveDepartmentManagerUseCase {
  constructor(
    private readonly departmentRepository: DepartmentRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the removal.
   *
   * @param departmentId - Identifier of the department to update.
   * @returns The updated {@link Department} or `null` if not found.
   */
  async execute(departmentId: string): Promise<Department | null> {
    this.checker.check(PermissionKeys.MANAGE_DEPARTMENT_USERS);
    const department = await this.departmentRepository.findById(departmentId);
    if (!department) {
      return null;
    }
    department.managerUserId = null;
    return this.departmentRepository.update(department);
  }
}
