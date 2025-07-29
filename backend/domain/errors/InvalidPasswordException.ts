/**
 * Error thrown when a password does not meet the configured complexity rules.
 */
export class InvalidPasswordException extends Error {
  /**
   * Create a new instance.
   *
   * @param message - Detailed validation message.
   */
  constructor(message = 'Password does not meet complexity requirements') {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
