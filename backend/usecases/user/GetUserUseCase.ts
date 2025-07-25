import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/entities/User';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for retrieving a user by id.
 */
export class GetUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the retrieval.
   *
   * @param id - Identifier of the user to fetch.
   * @returns The corresponding {@link User} or `null` if not found.
   */
  async execute(id: string): Promise<User | null> {
    this.checker.check(PermissionKeys.READ_USER);
    return this.userRepository.findById(id);
  }
}
