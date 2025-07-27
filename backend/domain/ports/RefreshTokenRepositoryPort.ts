import { RefreshToken } from '../entities/RefreshToken';

/**
 * Defines the contract for persisting refresh tokens.
 */
export interface RefreshTokenRepositoryPort {
  /**
   * Store a refresh token.
   *
   * @param token - Token to persist.
   * @returns The stored {@link RefreshToken}.
   */
  create(token: RefreshToken): Promise<RefreshToken>;

  /**
   * Find a refresh token by its value.
   *
   * @param token - Token string to search for.
   * @returns The matching {@link RefreshToken} or `null` if not found.
   */
  findByToken(token: string): Promise<RefreshToken | null>;

  /**
   * Delete a refresh token by value.
   *
   * @param token - Token string to remove.
   */
  delete(token: string): Promise<void>;
}
