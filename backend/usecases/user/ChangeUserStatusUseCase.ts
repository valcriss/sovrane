import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/entities/User';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for changing the status of a {@link User} account.
 */
export class ChangeUserStatusUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the status update.
   *
   * @param userId - Identifier of the user to modify.
   * @param status - The new status to assign.
   * @returns The updated {@link User} or `null` if the user was not found.
   */
  async execute(userId: string, status: 'active' | 'suspended' | 'archived'): Promise<User | null> {
    this.checker.check(PermissionKeys.UPDATE_USER);
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }
    user.status = status;
    user.updatedAt = new Date();
    user.updatedBy = this.checker.currentUser;
    return this.userRepository.update(user);
  }
}
