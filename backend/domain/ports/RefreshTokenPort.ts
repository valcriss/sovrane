import { RefreshToken } from '../entities/RefreshToken';

/**
 * Port for managing persisted refresh tokens with rotation support.
 */
export interface RefreshTokenPort {
  /**
   * Persist a new refresh token.
   *
   * @param token - Token to save.
   */
  save(token: RefreshToken): Promise<void>;

  /**
   * Retrieve a valid refresh token matching the provided value.
   *
   * @param token - Plain refresh token value.
   * @returns The stored token or `null` when not found or invalid.
   */
  findValidByToken(token: string): Promise<RefreshToken | null>;

  /**
   * Mark the token as used during rotation.
   *
   * @param tokenId - Identifier of the token to update.
   * @param replacedBy - Optional replacement token value.
   */
  markAsUsed(tokenId: string, replacedBy?: string): Promise<void>;

  /**
   * Revoke a refresh token.
   *
   * @param tokenId - Identifier of the token to revoke.
   * @param reason - Optional reason for revocation.
   */
  revoke(tokenId: string, reason?: string): Promise<void>;
}
