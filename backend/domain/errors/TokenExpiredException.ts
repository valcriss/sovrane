/**
 * Error thrown when an authentication token has expired.
 */
export class TokenExpiredException extends Error {
  /**
   * Create a new exception instance.
   *
   * @param message - Optional custom message.
   */
  constructor(message = 'Token expired') {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
