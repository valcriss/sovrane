import { User } from '../entities/User';

/**
 * Service handling multi-factor authentication operations.
 */
export interface MfaServicePort {
  /**
   * Generate and persist a new TOTP secret for the user.
   *
   * @param user - User enabling TOTP authentication.
   * @returns The generated secret encoded in base32.
   */
  generateTotpSecret(user: User): Promise<string>;

  /**
   * Verify a time-based one time password for the user.
   *
   * @param user - User submitting the token.
   * @param token - TOTP value to verify.
   * @returns `true` when the token is valid.
   */
  verifyTotp(user: User, token: string): Promise<boolean>;

  /**
   * Generate and send a one time password via email.
   *
   * @param user - User requesting the code.
   * @returns The generated code so it can be sent or logged.
   */
  generateEmailOtp(user: User): Promise<string>;

  /**
   * Verify an email delivered one time password.
   *
   * @param user - User providing the code.
   * @param otp - One time password received by email.
   * @returns `true` when the code matches.
   */
  verifyEmailOtp(user: User, otp: string): Promise<boolean>;

  /**
   * Disable multi-factor authentication for the user.
   *
   * @param user - User disabling MFA.
   */
  disableMfa(user: User): Promise<void>;
}
