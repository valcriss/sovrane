/* istanbul ignore file */
/**
 * Represents a refresh token associated with a user account.
 */
export class RefreshToken {
  /**
   * Create a new refresh token instance.
   *
   * @param id - Unique identifier for the token.
   * @param userId - Owner of the token.
   * @param tokenHash - Hash of the refresh token value.
   * @param expiresAt - Expiration date of the token.
   * @param createdAt - Creation timestamp.
   * @param revokedAt - Revocation date if any.
   * @param replacedBy - Hash of the replacing token.
   * @param usedAt - Timestamp when the token was rotated.
   */
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tokenHash: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date = new Date(),
    public revokedAt: Date | null = null,
    public replacedBy: string | null = null,
    public usedAt: Date | null = null,
    /** Optional IP address where the token was issued. */
    public ipAddress?: string,
    /** Optional user agent string associated with the request. */
    public userAgent?: string,
  ) {}
}
