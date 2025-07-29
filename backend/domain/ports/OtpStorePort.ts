import { User } from '../entities/User';

/**
 * Persistence mechanism for one time passwords used by MFA workflows.
 */
export interface OtpStorePort {
  /**
   * Store an OTP value for a user.
   *
   * @param user - Owner of the OTP.
   * @param otp - Code to persist.
   * @param ttlSeconds - Expiration delay in seconds.
   */
  store(user: User, otp: string, ttlSeconds: number): Promise<void>;

  /**
   * Verify an OTP previously stored for the user.
   * The OTP should be removed when successfully validated.
   *
   * @param user - Owner of the OTP.
   * @param otp - Code submitted for verification.
   * @returns `true` when the code matches and is still valid.
   */
  verify(user: User, otp: string): Promise<boolean>;

  /**
   * Delete any OTP associated with the user without verification.
   *
   * @param user - Owner of the OTP to remove.
   */
  delete(user: User): Promise<void>;
}
