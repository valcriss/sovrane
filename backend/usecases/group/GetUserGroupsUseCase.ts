import { UserGroup } from '../../domain/entities/UserGroup';
import { UserGroupRepositoryPort, UserGroupFilters } from '../../domain/ports/UserGroupRepositoryPort';
import { ListParams, PaginatedResult } from '../../domain/dtos/PaginatedResult';

/**
 * Use case for retrieving user groups with pagination.
 */
export class GetUserGroupsUseCase {
  constructor(private readonly groupRepository: UserGroupRepositoryPort) {}

  /**
   * Execute the retrieval.
   *
   * @param params - Pagination and filtering parameters.
   * @returns Paginated list of user groups.
   */
  async execute(
    params: ListParams & { filters?: UserGroupFilters },
  ): Promise<PaginatedResult<UserGroup>> {
    return this.groupRepository.findPage(params);
  }
}
