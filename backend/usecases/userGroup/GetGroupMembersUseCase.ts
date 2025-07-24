import { User } from '../../domain/entities/User';
import { UserGroupRepositoryPort } from '../../domain/ports/UserGroupRepositoryPort';
import { UserFilters } from '../../domain/ports/UserRepositoryPort';
import { ListParams, PaginatedResult } from '../../domain/dtos/PaginatedResult';

/**
 * Use case for retrieving members of a user group.
 */
export class GetGroupMembersUseCase {
  constructor(private readonly groupRepository: UserGroupRepositoryPort) {}

  /**
   * Execute the retrieval.
   *
   * @param groupId - Identifier of the group.
   * @param params - Pagination and filter parameters.
   * @returns Paginated list of {@link User}.
   */
  async execute(
    groupId: string,
    params: ListParams & { filters?: UserFilters },
  ): Promise<PaginatedResult<User>> {
    return this.groupRepository.listMembers(groupId, params);
  }
}
