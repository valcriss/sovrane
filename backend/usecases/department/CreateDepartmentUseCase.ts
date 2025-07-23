import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../domain/entities/Department';

/**
 * Use case responsible for creating a {@link Department}.
 */
export class CreateDepartmentUseCase {
  constructor(private readonly departmentRepository: DepartmentRepositoryPort) {}

  /**
   * Execute the use case.
   *
   * @param department - The department to persist.
   * @returns The created {@link Department}.
   */
  async execute(department: Department): Promise<Department> {
    return this.departmentRepository.create(department);
  }
}
