/**
 * Central registry of application configuration keys.
 */
export class AppConfigKeys {
  /** Enables account locking after login failures. */
  static readonly ACCOUNT_LOCK_ON_LOGIN_FAIL = 'account_lock_on_login_fail';

  /** Duration in seconds of the account lock. */
  static readonly ACCOUNT_LOCK_DURATION = 'account_lock_duration';

  /** Number of failed logins required before locking an account. */
  static readonly ACCOUNT_LOCK_FAIL_THRESHOLD = 'account_lock_fail_threshold';
}
