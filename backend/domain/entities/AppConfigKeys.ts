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

  /** Minimum allowed password length. */
  static readonly ACCOUNT_PASSWORD_MIN_LENGTH = 'account_password_min_length';

  /** Maximum allowed password length. */
  static readonly ACCOUNT_PASSWORD_MAX_LENGTH = 'account_password_max_length';

  /** Require passwords to contain at least one uppercase character. */
  static readonly ACCOUNT_PASSWORD_MUST_HAVE_UPPERCASE =
    'account_password_must_have_uppercase';

  /** Require passwords to contain at least one lowercase character. */
  static readonly ACCOUNT_PASSWORD_MUST_HAVE_LOWERCASE =
    'account_password_must_have_lowercase';

  /** Require passwords to contain at least one digit. */
  static readonly ACCOUNT_PASSWORD_MUST_HAVE_DIGIT =
    'account_password_must_have_digit';

  /** Require passwords to contain at least one special character. */
  static readonly ACCOUNT_PASSWORD_MUST_HAVE_SPECIAL_CHAR =
    'account_password_must_have_special_char';

  /** Enable password expiration policy. */
  static readonly ACCOUNT_PASSWORD_EXPIRE = 'account_password_expire';

  /** Number of days before a password must be changed. */
  static readonly ACCOUNT_PASSWORD_EXPIRE_AFTER = 'account_password_expire_after';

  /** Number of days before expiration when a warning email is sent. */
  static readonly ACCOUNT_PASSWORD_EXPIRE_WARNING_DAYS =
    'account_password_expire_warning_days';

  /** Enable password history check when updating password. */
  static readonly ACCOUNT_PASSWORD_HISTORY = 'account_password_history';

  /** Number of previous passwords remembered for history check. */
  static readonly ACCOUNT_PASSWORD_HISTORY_COUNT = 'account_password_history_count';

  /** Allow users to enable multi-factor authentication. */
  static readonly ACCOUNT_ALLOW_MFA = 'account_allow_mfa';

  /** Require users to enable multi-factor authentication. */
  static readonly ACCOUNT_REQUIRE_MFA = 'account_require_mfa';

  /**
   * Path patterns considered sensitive and therefore audited when accessed.
   */
  static readonly AUDIT_SENSITIVE_ROUTES = 'audit_sensitive_routes';

  /** Number of lock events before sending an alert. */
  static readonly LOCKOUT_ALERT_THRESHOLD = 'lockout_alert_threshold';

  /** Consecutive failed logins before issuing an alert. */
  static readonly FAILED_LOGIN_ALERT_THRESHOLD = 'failed_login_alert_threshold';

  /** Time window in minutes for counting failed logins. */
  static readonly FAILED_LOGIN_TIME_WINDOW = 'failed_login_time_window';
}
