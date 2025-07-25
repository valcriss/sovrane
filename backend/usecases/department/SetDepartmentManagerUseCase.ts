import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import type { Department } from '../../domain/entities/Department';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for assigning a manager to a department.
 */
export class SetDepartmentManagerUseCase {
  constructor(
    private readonly departmentRepository: DepartmentRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the manager assignment.
   *
   * @param departmentId - Identifier of the department to update.
   * @param userId - Identifier of the manager user.
   * @returns The updated {@link Department} or `null` if not found.
   */
  async execute(departmentId: string, userId: string): Promise<Department | null> {
    this.checker.check(PermissionKeys.MANAGE_DEPARTMENT_USERS);
    const department = await this.departmentRepository.findById(departmentId);
    if (!department) {
      return null;
    }
    department.managerUserId = userId;
    return this.departmentRepository.update(department);
  }
}
