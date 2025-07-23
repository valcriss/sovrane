import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/entities/User';

/**
 * Use case for retrieving the currently authenticated user's profile.
 */
export class GetCurrentUserProfileUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  /**
   * Execute the retrieval.
   *
   * @param userId - Identifier of the current user.
   * @returns The corresponding {@link User} or `null` if not found.
   */
  async execute(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }
}
