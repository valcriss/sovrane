/* istanbul ignore file */
/**
 * Error thrown when a provided refresh token is invalid or expired.
 */
export class InvalidRefreshTokenException extends Error {
  constructor(message = 'Invalid or expired refresh token') {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
