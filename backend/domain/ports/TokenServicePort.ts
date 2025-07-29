import { User } from '../entities/User';

/**
 * Service responsible for issuing authentication tokens.
 */
export interface TokenServicePort {
  /**
   * Generate a short lived access token for the given user.
   *
   * @param user - User to encode in the token.
   * @returns Signed JWT string.
   */
  generateAccessToken(user: User): string;

  /**
   * Generate and persist a refresh token for the user.
   *
   * @param user - User owning the token.
   * @returns The created refresh token string.
   */
  generateRefreshToken(
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string>;
}
