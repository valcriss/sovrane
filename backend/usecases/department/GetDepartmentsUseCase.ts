import {
  DepartmentRepositoryPort,
  DepartmentFilters,
} from '../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../domain/entities/Department';
import { ListParams, PaginatedResult } from '../../domain/dtos/PaginatedResult';

/**
 * Use case for retrieving departments with pagination.
 */
export class GetDepartmentsUseCase {
  constructor(private readonly departmentRepository: DepartmentRepositoryPort) {}

  /**
   * Execute the retrieval.
   *
   * @param params - Pagination and filtering parameters.
   * @returns Paginated list of departments.
   */
  async execute(
    params: ListParams & { filters?: DepartmentFilters },
  ): Promise<PaginatedResult<Department>> {
    return this.departmentRepository.findPage(params);
  }
}
