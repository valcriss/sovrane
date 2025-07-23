import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/entities/User';

/**
 * Use case for updating user profile information.
 */
export class UpdateUserProfileUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  /**
   * Execute the profile update.
   *
   * @param user - Updated user entity.
   * @returns The persisted {@link User} after update.
   */
  async execute(user: User): Promise<User> {
    return this.userRepository.update(user);
  }
}
