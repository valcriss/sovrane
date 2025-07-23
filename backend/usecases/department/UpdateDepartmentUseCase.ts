import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import type { Department } from '../../domain/entities/Department';

/**
 * Use case for updating an existing {@link Department}.
 */
export class UpdateDepartmentUseCase {
  constructor(private readonly departmentRepository: DepartmentRepositoryPort) {}

  /**
   * Execute the update.
   *
   * @param department - Updated department entity.
   * @returns The persisted {@link Department} after update.
   */
  async execute(department: Department): Promise<Department> {
    return this.departmentRepository.update(department);
  }
}
