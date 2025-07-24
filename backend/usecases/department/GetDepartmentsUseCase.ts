import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../domain/entities/Department';

/**
 * Use case for retrieving all departments.
 */
export class GetDepartmentsUseCase {
  constructor(private readonly departmentRepository: DepartmentRepositoryPort) {}

  /**
   * Execute the retrieval.
   *
   * @returns Array of {@link Department} instances.
   */
  async execute(): Promise<Department[]> {
    return this.departmentRepository.findAll();
  }
}
