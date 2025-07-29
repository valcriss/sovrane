import { AuthServicePort } from '../../domain/ports/AuthServicePort';
import { PasswordValidator } from '../../domain/services/PasswordValidator';
import { InvalidPasswordException } from '../../domain/errors/InvalidPasswordException';

/**
 * Use case for completing a password reset.
 */
export class ResetPasswordUseCase {
  constructor(
    private readonly authService: AuthServicePort,
    private readonly passwordValidator: PasswordValidator,
  ) {}

  /**
   * Execute the password reset.
   *
   * @param token - Reset token provided to the user.
   * @param newPassword - The new password to set.
   */
  async execute(token: string, newPassword: string): Promise<void> {
    await this.passwordValidator.validate(newPassword).catch((err) => {
      if (err instanceof InvalidPasswordException) {
        throw err;
      }
      throw new InvalidPasswordException(err.message);
    });
    await this.authService.resetPassword(token, newPassword);
  }
}
