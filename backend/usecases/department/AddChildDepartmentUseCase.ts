import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import type { Department } from '../../domain/entities/Department';

/**
 * Use case for adding a department as a child of another department.
 */
export class AddChildDepartmentUseCase {
  constructor(private readonly departmentRepository: DepartmentRepositoryPort) {}

  /**
   * Execute the child department addition.
   *
   * @param parentId - Identifier of the parent department.
   * @param childId - Identifier of the department to become a child.
   * @returns The updated child {@link Department} or `null` if not found.
   */
  async execute(parentId: string, childId: string): Promise<Department | null> {
    const child = await this.departmentRepository.findById(childId);
    if (!child) {
      return null;
    }
    child.parentDepartmentId = parentId;
    return this.departmentRepository.update(child);
  }
}
