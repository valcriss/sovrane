import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import type { Department } from '../../domain/entities/Department';
import type { Permission } from '../../domain/entities/Permission';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for adding a permission to a department.
 */
export class SetDepartmentPermissionUseCase {
  constructor(
    private readonly departmentRepository: DepartmentRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the permission addition.
   *
   * @param departmentId - Identifier of the department to update.
   * @param permission - Permission to add.
   * @returns The updated {@link Department} or `null` if not found.
   */
  async execute(departmentId: string, permission: Permission): Promise<Department | null> {
    this.checker.check(PermissionKeys.MANAGE_DEPARTMENT_PERMISSIONS);
    const department = await this.departmentRepository.findById(departmentId);
    if (!department) {
      return null;
    }
    department.permissions.push(permission);
    department.updatedAt = new Date();
    department.updatedBy = this.checker.currentUser;
    return this.departmentRepository.update(department);
  }
}
