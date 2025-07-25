import {
  DepartmentRepositoryPort,
  DepartmentFilters,
} from '../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../domain/entities/Department';
import { ListParams, PaginatedResult } from '../../domain/dtos/PaginatedResult';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for retrieving departments with pagination.
 */
export class GetDepartmentsUseCase {
  constructor(
    private readonly departmentRepository: DepartmentRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the retrieval.
   *
   * @param params - Pagination and filtering parameters.
   * @returns Paginated list of departments.
   */
  async execute(
    params: ListParams & { filters?: DepartmentFilters },
  ): Promise<PaginatedResult<Department>> {
    this.checker.check(PermissionKeys.READ_DEPARTMENTS);
    return this.departmentRepository.findPage(params);
  }
}
