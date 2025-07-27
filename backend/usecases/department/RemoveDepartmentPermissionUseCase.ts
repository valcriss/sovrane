import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import type { Department } from '../../domain/entities/Department';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for removing a permission from a department.
 */
export class RemoveDepartmentPermissionUseCase {
  constructor(
    private readonly departmentRepository: DepartmentRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the permission removal.
   *
   * @param departmentId - Identifier of the department to update.
   * @param permissionId - Identifier of the permission to remove.
   * @returns The updated {@link Department} or `null` if not found.
   */
  async execute(departmentId: string, permissionId: string): Promise<Department | null> {
    this.checker.check(PermissionKeys.MANAGE_DEPARTMENT_PERMISSIONS);
    const department = await this.departmentRepository.findById(departmentId);
    if (!department) {
      return null;
    }
    department.permissions = department.permissions.filter(p => p.id !== permissionId);
    department.updatedAt = new Date();
    department.updatedBy = this.checker.currentUser;
    return this.departmentRepository.update(department);
  }
}
