import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import type { Department } from '../../domain/entities/Department';

/**
 * Use case for removing the parent department of a department.
 */
export class RemoveDepartmentParentDepartmentUseCase {
  constructor(private readonly departmentRepository: DepartmentRepositoryPort) {}

  /**
   * Execute the removal of the parent department.
   *
   * @param departmentId - Identifier of the department to update.
   * @returns The updated {@link Department} or `null` if not found.
   */
  async execute(departmentId: string): Promise<Department | null> {
    const department = await this.departmentRepository.findById(departmentId);
    if (!department) {
      return null;
    }
    department.parentDepartmentId = null;
    return this.departmentRepository.update(department);
  }
}
