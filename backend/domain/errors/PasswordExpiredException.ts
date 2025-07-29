/**
 * Error thrown when a user attempts to authenticate with an expired password.
 */
export class PasswordExpiredException extends Error {
  constructor(message = 'Password has expired') {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
