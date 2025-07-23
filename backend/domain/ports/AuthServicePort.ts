import { User } from '../entities/User';

/**
 * Defines the contract for user authentication and related operations.
 */
export interface AuthServicePort {
  /**
   * Authenticate a user using email and password.
   *
   * @param email - User email.
   * @param password - User password.
   * @returns The authenticated {@link User}.
   */
  authenticate(email: string, password: string): Promise<User>;

  /**
   * Authenticate a user with an external provider.
   *
   * @param provider - External provider name.
   * @param token - Authentication token from the provider.
   * @returns The authenticated {@link User}.
   */
  authenticateWithProvider(provider: string, token: string): Promise<User>;

  /**
   * Initiate a password reset for the user identified by email.
   *
   * @param email - Email requesting a reset.
   */
  requestPasswordReset(email: string): Promise<void>;

  /**
   * Complete a password reset.
   *
   * @param token - Reset token provided to the user.
   * @param newPassword - The new password to set.
   */
  resetPassword(token: string, newPassword: string): Promise<void>;

  /**
   * Validate an authentication token and return the associated user.
   *
   * @param token - JWT or OIDC token provided by the client.
   * @returns The authenticated {@link User}.
   */
  verifyToken(token: string): Promise<User>;
}
