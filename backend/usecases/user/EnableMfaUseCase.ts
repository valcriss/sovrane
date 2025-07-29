import { User } from '../../domain/entities/User';
import { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';

/**
 * Use case enabling multi-factor authentication for a user.
 */
export class EnableMfaUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

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
    user.mfaEnabled = true;
    user.mfaType = type;
    user.mfaRecoveryCodes = recoveryCodes;
    return this.userRepository.update(user);
  }
}
