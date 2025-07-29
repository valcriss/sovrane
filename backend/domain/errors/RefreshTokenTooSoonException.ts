/**
 * Error thrown when a refresh token rotation is attempted before the minimum
 * allowed interval.
 */
export class RefreshTokenTooSoonException extends Error {
  /**
   * Create a new instance.
   *
   * @param message - Optional custom message.
   */
  constructor(message = 'Refresh token rotation too soon') {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
