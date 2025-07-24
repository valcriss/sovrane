import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { User } from '../../domain/entities/User';

/**
 * Use case for retrieving a user by id.
 */
export class GetUserUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  /**
   * Execute the retrieval.
   *
   * @param id - Identifier of the user to fetch.
   * @returns The corresponding {@link User} or `null` if not found.
   */
  async execute(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}
