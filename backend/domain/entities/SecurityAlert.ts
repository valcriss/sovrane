/**
 * Information about a security alert triggered by suspicious login activity.
 */
export interface SecurityAlert {
  /**
   * Type of alert that occurred.
   *
   * - `lockout` when a user account is temporarily locked.
   * - `failedLogin` when consecutive login attempts fail without a lockout.
   */
  type: 'lockout' | 'failedLogin';

  /** Number of attempts detected during the time window. */
  count: number;

  /** Threshold of attempts after which the alert is triggered. */
  threshold: number;

  /** Time window in seconds used to evaluate the attempts. */
  window: number;
}
