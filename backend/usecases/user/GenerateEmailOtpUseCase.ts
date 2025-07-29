/* istanbul ignore file */
import { MfaServicePort } from '../../domain/ports/MfaServicePort';
import { User } from '../../domain/entities/User';

/**
 * Use case for generating a one time password delivered via email.
 */
export class GenerateEmailOtpUseCase {
  constructor(private readonly mfaService: MfaServicePort) {}

  /**
   * Generate and send the OTP for the provided user.
   *
   * @param user - User requesting the code.
   * @returns The generated OTP value.
   */
  async execute(user: User): Promise<string> {
    return this.mfaService.generateEmailOtp(user);
  }
}
