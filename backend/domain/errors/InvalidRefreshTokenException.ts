/* istanbul ignore file */
/**
 * Error thrown when a provided refresh token is invalid or expired.
 *
 * The {@link code} property can be used by callers to programmatically
 * handle this specific error.
 */
export class InvalidRefreshTokenException extends Error {
  /** Error code identifying the invalid refresh token condition. */
  readonly code = 'INVALID_REFRESH_TOKEN';

  constructor(message = 'Invalid or expired refresh token') {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
