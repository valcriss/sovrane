import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/entities/User';

/**
 * Use case for changing the status of a {@link User} account.
 */
export class ChangeUserStatusUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  /**
   * Execute the status update.
   *
   * @param userId - Identifier of the user to modify.
   * @param status - The new status to assign.
   * @returns The updated {@link User} or `null` if the user was not found.
   */
  async execute(userId: string, status: 'active' | 'suspended' | 'archived'): Promise<User | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }
    user.status = status;
    return this.userRepository.update(user);
  }
}
