import { DepartmentRepositoryPort } from '../../domain/ports/DepartmentRepositoryPort';
import { Permission } from '../../domain/entities/Permission';
import { PermissionFilters } from '../../domain/ports/PermissionRepositoryPort';
import { ListParams, PaginatedResult } from '../../domain/dtos/PaginatedResult';

/**
 * Use case for listing permissions of a department.
 */
export class GetDepartmentPermissionsUseCase {
  constructor(private readonly repository: DepartmentRepositoryPort) {}

  /**
   * Execute the retrieval.
   *
   * @param departmentId - Identifier of the department.
   * @param params - Pagination and filtering parameters.
   * @returns Paginated list of {@link Permission}.
   */
  async execute(
    departmentId: string,
    params: ListParams & { filters?: PermissionFilters },
  ): Promise<PaginatedResult<Permission>> {
    const department = await this.repository.findById(departmentId);
    if (!department) {
      return { items: [], page: params.page, limit: params.limit, total: 0 };
    }

    let items = department.permissions;
    if (params.filters?.search) {
      const search = params.filters.search.toLowerCase();
      items = items.filter(
        p =>
          p.permissionKey.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search),
      );
    }

    const total = items.length;
    const start = (params.page - 1) * params.limit;
    return {
      items: items.slice(start, start + params.limit),
      page: params.page,
      limit: params.limit,
      total,
    };
  }
}
