import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../domain/entities/Department';

/**
 * Use case for retrieving a single department by id.
 */
export class GetDepartmentUseCase {
  constructor(private readonly departmentRepository: DepartmentRepositoryPort) {}

  /**
   * Execute the retrieval.
   *
   * @param id - Identifier of the department to fetch.
   * @returns The corresponding {@link Department} or `null` if not found.
   */
  async execute(id: string): Promise<Department | null> {
    return this.departmentRepository.findById(id);
  }
}
