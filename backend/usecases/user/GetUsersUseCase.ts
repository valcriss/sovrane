import { UserRepositoryPort, UserFilters } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/entities/User';
import { ListParams, PaginatedResult } from '../../domain/dtos/PaginatedResult';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for retrieving all users.
 */
export class GetUsersUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the retrieval.
   *
   * @returns Array of {@link User} instances.
   */
  async execute(params: ListParams & { filters?: UserFilters }): Promise<PaginatedResult<User>> {
    this.checker.check(PermissionKeys.READ_USERS);
    return this.userRepository.findPage(params);
  }
}
