import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/entities/User';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for retrieving the currently authenticated user's profile.
 */
export class GetCurrentUserProfileUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the retrieval.
   *
   * @param userId - Identifier of the current user.
   * @returns The corresponding {@link User} or `null` if not found.
   */
  async execute(userId: string): Promise<User | null> {
    this.checker.check(PermissionKeys.READ_USER);
    return this.userRepository.findById(userId);
  }
}
