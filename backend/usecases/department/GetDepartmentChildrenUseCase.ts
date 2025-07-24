import { DepartmentRepositoryPort, DepartmentFilters } from '../../domain/ports/DepartmentRepositoryPort';
import { Department } from '../../domain/entities/Department';
import { ListParams, PaginatedResult } from '../../domain/dtos/PaginatedResult';

/**
 * Use case for listing child departments of a given department.
 */
export class GetDepartmentChildrenUseCase {
  constructor(private readonly repository: DepartmentRepositoryPort) {}

  /**
   * Execute the retrieval.
   *
   * @param departmentId - Identifier of the parent department.
   * @param params - Pagination and filtering parameters.
   * @returns Paginated list of child departments.
   */
  async execute(
    departmentId: string,
    params: ListParams & { filters?: DepartmentFilters },
  ): Promise<PaginatedResult<Department>> {
    const all = await this.repository.findAll();
    let items = all.filter(d => d.parentDepartmentId === departmentId);

    if (params.filters?.siteId) {
      items = items.filter(d => d.site.id === params.filters!.siteId);
    }
    if (params.filters?.search) {
      const search = params.filters.search.toLowerCase();
      items = items.filter(d => d.label.toLowerCase().includes(search));
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
