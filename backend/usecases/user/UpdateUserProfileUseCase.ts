import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/entities/User';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for updating user profile information.
 */
export class UpdateUserProfileUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the profile update.
   *
   * @param user - Updated user entity.
   * @returns The persisted {@link User} after update.
   */
  async execute(user: User): Promise<User> {
    this.checker.check(PermissionKeys.UPDATE_USER);
    return this.userRepository.update(user);
  }
}
