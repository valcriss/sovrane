import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';

/**
 * Use case for removing a user and all associated data from the system.
 */
export class RemoveUserUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  /**
   * Execute the removal.
   *
   * @param userId - Identifier of the user to delete.
   */
  async execute(userId: string): Promise<void> {
    await this.userRepository.delete(userId);
  }
}
