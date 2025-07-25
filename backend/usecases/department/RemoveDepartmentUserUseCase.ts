import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import type { Department } from '../../domain/entities/Department';
import type { User } from '../../domain/entities/User';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for removing a user from a department.
 *
 * Note: the current domain model requires a user to always reference a
 * {@link Department}. The implementation therefore sets the department
 * reference to `null` through a cast.
 */
export class RemoveDepartmentUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the removal.
   *
   * @param userId - Identifier of the user to update.
   * @returns The updated {@link User} or `null` if not found.
   */
  async execute(userId: string): Promise<User | null> {
    this.checker.check(PermissionKeys.MANAGE_DEPARTMENT_USERS);
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }
    user.department = null as unknown as Department;
    return this.userRepository.update(user);
  }
}
