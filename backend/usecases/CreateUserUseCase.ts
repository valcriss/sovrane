import { UserRepositoryPort } from '../domain/ports/UserRepositoryPort';
import { User } from '../domain/entities/User';

/**
 * Use case responsible for creating a {@link User}.
 */
export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  /**
   * Execute the use case.
   *
   * @param user - The user to persist.
   * @returns The created {@link User}.
   */
  async execute(user: User): Promise<User> {
    return this.userRepository.create(user);
  }
}
