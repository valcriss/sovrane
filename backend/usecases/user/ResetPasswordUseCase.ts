import { AuthServicePort } from '../../domain/ports/AuthServicePort';

/**
 * Use case for completing a password reset.
 */
export class ResetPasswordUseCase {
  constructor(private readonly authService: AuthServicePort) {}

  /**
   * Execute the password reset.
   *
   * @param token - Reset token provided to the user.
   * @param newPassword - The new password to set.
   */
  async execute(token: string, newPassword: string): Promise<void> {
    await this.authService.resetPassword(token, newPassword);
  }
}
