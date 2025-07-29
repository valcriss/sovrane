import { MfaServicePort } from '../../domain/ports/MfaServicePort';
import { User } from '../../domain/entities/User';

/**
 * Use case for setting up TOTP multi-factor authentication.
 */
export class SetupTotpUseCase {
  constructor(private readonly mfaService: MfaServicePort) {}

  /**
   * Generate a secret for configuring TOTP on the user account.
   *
   * @param user - User enabling TOTP.
   * @returns Generated secret encoded in base32.
   */
  async execute(user: User): Promise<string> {
    return this.mfaService.generateTotpSecret(user);
  }
}
