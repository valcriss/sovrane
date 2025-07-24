import { UserRepositoryPort, UserFilters } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/entities/User';
import { ListParams, PaginatedResult } from '../../domain/dtos/PaginatedResult';

/**
 * Use case for listing users of a department.
 */
export class GetDepartmentUsersUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  /**
   * Execute the retrieval.
   *
   * @param departmentId - Identifier of the department.
   * @param params - Pagination and filtering parameters.
   * @returns Paginated list of {@link User}.
   */
  async execute(
    departmentId: string,
    params: ListParams & { filters?: UserFilters },
  ): Promise<PaginatedResult<User>> {
    /* istanbul ignore next */
    const filters = { ...(params.filters || {}), departmentId };
    return this.userRepository.findPage({ ...params, filters });
  }
}
