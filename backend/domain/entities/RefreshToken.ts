/**
 * Represents a refresh token associated with a user account.
 */
export class RefreshToken {
  /**
   * Create a new refresh token instance.
   *
   * @param token - The token string value.
   * @param userId - Identifier of the user owning the token.
   * @param expiresAt - Expiration date of the token.
   */
  constructor(
    public readonly token: string,
    public readonly userId: string,
    public readonly expiresAt: Date,
  ) {}
}
