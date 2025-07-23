import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import type { Department } from '../../domain/entities/Department';

/**
 * Use case for removing the manager from a department.
 */
export class RemoveDepartmentManagerUseCase {
  constructor(private readonly departmentRepository: DepartmentRepositoryPort) {}

  /**
   * Execute the removal.
   *
   * @param departmentId - Identifier of the department to update.
   * @returns The updated {@link Department} or `null` if not found.
   */
  async execute(departmentId: string): Promise<Department | null> {
    const department = await this.departmentRepository.findById(departmentId);
    if (!department) {
      return null;
    }
    department.managerUserId = null;
    return this.departmentRepository.update(department);
  }
}
