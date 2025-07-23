import { AuthServicePort } from '../../domain/ports/AuthServicePort';

/**
 * Use case for initiating a password reset request.
 */
export class RequestPasswordResetUseCase {
  constructor(private readonly authService: AuthServicePort) {}

  /**
   * Execute the reset request.
   *
   * @param email - Email of the account requesting a reset.
   */
  async execute(email: string): Promise<void> {
    await this.authService.requestPasswordReset(email);
  }
}
