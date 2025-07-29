import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { MfaServicePort } from '../../domain/ports/MfaServicePort';
import { User } from '../../domain/entities/User';

/**
 * Use case disabling multi-factor authentication.
 */
export class DisableMfaUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly mfaService: MfaServicePort,
  ) {}

  /**
   * Disable MFA for the given user.
   *
   * @param user - User disabling MFA.
   */
  async execute(user: User): Promise<void> {
    await this.mfaService.disableMfa(user);
    user.mfaEnabled = false;
    user.mfaType = null;
    user.mfaSecret = null;
    user.mfaRecoveryCodes = [];
    await this.userRepository.update(user);
  }
}
