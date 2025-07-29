import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';
import { RefreshTokenPort } from '../../domain/ports/RefreshTokenPort';

/**
 * Use case for removing a user and all associated data from the system.
 */
export class RemoveUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly checker: PermissionChecker,
    private readonly refreshTokenRepository: RefreshTokenPort,
  ) {}

  /**
   * Execute the removal.
   *
   * @param userId - Identifier of the user to delete.
   * Also revokes all refresh tokens owned by the user.
   */
  async execute(userId: string): Promise<void> {
    this.checker.check(PermissionKeys.DELETE_USER);
    await this.userRepository.delete(userId);
    await this.refreshTokenRepository.revokeAll(userId);
  }
}
