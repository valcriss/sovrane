import { UserRepositoryPort, UserFilters } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/entities/User';
import { ListParams, PaginatedResult } from '../../domain/dtos/PaginatedResult';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for listing users of a department.
 */
export class GetDepartmentUsersUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

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
    this.checker.check(PermissionKeys.READ_USERS);
    /* istanbul ignore next */
    const filters = { ...(params.filters || {}), departmentIds: [departmentId] };
    return this.userRepository.findPage({ ...params, filters });
  }
}
