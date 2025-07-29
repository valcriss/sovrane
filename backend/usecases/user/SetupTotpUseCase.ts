import { MfaServicePort } from '../../domain/ports/MfaServicePort';
import { User } from '../../domain/entities/User';
import { PermissionChecker } from '../../domain/services/PermissionChecker';
import { PermissionKeys } from '../../domain/entities/PermissionKeys';

/**
 * Use case for setting up TOTP multi-factor authentication.
 */
export class SetupTotpUseCase {
  constructor(
    private readonly mfaService: MfaServicePort,
    private readonly checker: PermissionChecker,
  ) {}

  /**
   * Generate a secret for configuring TOTP on the user account.
   *
   * @param user - User enabling TOTP.
   * @returns Generated secret encoded in base32.
   */
  async execute(user: User): Promise<string> {
    this.checker.check(PermissionKeys.MANAGE_MFA);
    return this.mfaService.generateTotpSecret(user);
  }
}
