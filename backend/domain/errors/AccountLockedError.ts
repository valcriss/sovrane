/**
 * Error thrown when a user attempts to authenticate while their account
 * is temporarily locked because of repeated failed login attempts.
 */
export class AccountLockedError extends Error {
  /** Timestamp until which the account remains locked. */
  readonly lockedUntil: Date;

  /**
   * Create a new error instance.
   *
   * @param lockedUntil - When the lock will expire.
   * @param message - Optional custom message.
   */
  constructor(lockedUntil: Date, message = 'Account is temporarily locked due to multiple failed login attempts.') {
    super(message);
    this.lockedUntil = lockedUntil;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
