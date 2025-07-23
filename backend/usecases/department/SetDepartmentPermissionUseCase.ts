import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import type { Department } from '../../domain/entities/Department';
import type { Permission } from '../../domain/entities/Permission';

/**
 * Use case for adding a permission to a department.
 */
export class SetDepartmentPermissionUseCase {
  constructor(private readonly departmentRepository: DepartmentRepositoryPort) {}

  /**
   * Execute the permission addition.
   *
   * @param departmentId - Identifier of the department to update.
   * @param permission - Permission to add.
   * @returns The updated {@link Department} or `null` if not found.
   */
  async execute(departmentId: string, permission: Permission): Promise<Department | null> {
    const department = await this.departmentRepository.findById(departmentId);
    if (!department) {
      return null;
    }
    department.permissions.push(permission);
    return this.departmentRepository.update(department);
  }
}
