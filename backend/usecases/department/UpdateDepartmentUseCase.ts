import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import type { Department } from '../../domain/entities/Department';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for updating an existing {@link Department}.
 */
export class UpdateDepartmentUseCase {
  constructor(
    private readonly departmentRepository: DepartmentRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the update.
   *
   * @param department - Updated department entity.
   * @returns The persisted {@link Department} after update.
   */
  async execute(department: Department): Promise<Department> {
    this.checker.check(PermissionKeys.UPDATE_DEPARTMENT);
    department.updatedAt = new Date();
    department.updatedBy = this.checker.currentUser;
    return this.departmentRepository.update(department);
  }
}
