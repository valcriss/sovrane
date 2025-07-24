import { UserRepositoryPort, UserFilters } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/entities/User';
import { ListParams, PaginatedResult } from '../../domain/dtos/PaginatedResult';

/**
 * Use case for retrieving all users.
 */
export class GetUsersUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  /**
   * Execute the retrieval.
   *
   * @returns Array of {@link User} instances.
   */
  async execute(params: ListParams & { filters?: UserFilters }): Promise<PaginatedResult<User>> {
    return this.userRepository.findPage(params);
  }
}
