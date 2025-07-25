import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for removing a user and all associated data from the system.
 */
export class RemoveUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Execute the removal.
   *
   * @param userId - Identifier of the user to delete.
   */
  async execute(userId: string): Promise<void> {
    this.checker.check(PermissionKeys.DELETE_USER);
    await this.userRepository.delete(userId);
  }
}
