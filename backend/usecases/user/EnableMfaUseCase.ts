import { User } from '../../domain/entities/User';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { RefreshTokenPort } from '../../domain/ports/RefreshTokenPort';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case enabling multi-factor authentication for a user.
 */
export class EnableMfaUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    /** Repository used to revoke existing refresh tokens. */
    private readonly refreshTokenRepository: RefreshTokenPort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Enable MFA on the provided user.
   *
   * @param user - User to update.
   * @param type - MFA mechanism identifier.
   * @param recoveryCodes - Optional recovery codes.
   * @returns The updated {@link User} entity.
   */
  async execute(
    user: User,
    type: string,
    recoveryCodes: string[] = [],
  ): Promise<User> {
    this.checker.check(PermissionKeys.MANAGE_MFA);
    user.mfaEnabled = true;
    user.mfaType = type;
    user.mfaRecoveryCodes = recoveryCodes;
    const updated = await this.userRepository.update(user);
    await this.refreshTokenRepository.revokeAll(user.id);
    return updated;
  }
}
