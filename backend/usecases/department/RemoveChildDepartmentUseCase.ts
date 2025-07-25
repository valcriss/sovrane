import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import type { Department } from '../../domain/entities/Department';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for removing a child department from its parent.
 */
export class RemoveChildDepartmentUseCase {
  constructor(
    private readonly departmentRepository: DepartmentRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the removal.
   *
   * @param childId - Identifier of the child department.
   * @returns The updated child {@link Department} or `null` if not found.
   */
  async execute(childId: string): Promise<Department | null> {
    this.checker.check(PermissionKeys.MANAGE_DEPARTMENT_HIERARCHY);
    const child = await this.departmentRepository.findById(childId);
    if (!child) {
      return null;
    }
    child.parentDepartmentId = null;
    return this.departmentRepository.update(child);
  }
}
