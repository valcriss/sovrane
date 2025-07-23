import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import type { Department } from '../../domain/entities/Department';
import type { User } from '../../domain/entities/User';

/**
 * Use case for removing a user from a department.
 *
 * Note: the current domain model requires a user to always reference a
 * {@link Department}. The implementation therefore sets the department
 * reference to `null` through a cast.
 */
export class RemoveDepartmentUserUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  /**
   * Execute the removal.
   *
   * @param userId - Identifier of the user to update.
   * @returns The updated {@link User} or `null` if not found.
   */
  async execute(userId: string): Promise<User | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }
    user.department = null as unknown as Department;
    return this.userRepository.update(user);
  }
}
