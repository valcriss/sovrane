import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../domain/entities/Department';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for retrieving the parent department of a department.
 */
export class GetDepartmentParentUseCase {
  constructor(
    private readonly repository: DepartmentRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the retrieval.
   *
   * @param departmentId - Identifier of the department.
   * @returns The parent {@link Department} or `null` if none found.
   */
  async execute(departmentId: string): Promise<Department | null> {
    this.checker.check(PermissionKeys.READ_DEPARTMENT);
    const department = await this.repository.findById(departmentId);
    if (!department?.parentDepartmentId) return null;
    return this.repository.findById(department.parentDepartmentId);
  }
}
