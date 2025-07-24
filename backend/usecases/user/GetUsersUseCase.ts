import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/entities/User';

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
  async execute(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
